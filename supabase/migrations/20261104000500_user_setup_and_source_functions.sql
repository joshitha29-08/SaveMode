-- =========================================================
-- Migration 005: Automatic user setup + source RPCs
-- ONB-04, ONB-07, TAG-02, TAG-07, SRC-06, SRC-08,
-- EC-ONB-03, EC-ONB-09, EC-TAG-11
-- =========================================================

-- ---------------------------------------------------------
-- 1. private.setup_user(uid)
--    Idempotent. Safe to run any number of times.
--    Step 1: user_settings row if missing.
--    Step 2: 17 default tags (TAG-02) if the user has none.
--    Step 3: recreate a missing "Others" tag (EC-TAG-11).
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION private.setup_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Step 1: settings row (currency INR, theme System, onboarding not complete)
    INSERT INTO public.user_settings (user_id, currency_code, theme)
    VALUES (p_user_id, 'INR', 'system')
    ON CONFLICT (user_id) DO NOTHING;

    -- Step 2: all 17 default tags, only when the user has no tags at all
    IF NOT EXISTS (
        SELECT 1 FROM public.tags WHERE user_id = p_user_id
    ) THEN
        INSERT INTO public.tags
            (user_id, type, name, colour, is_default, is_others)
        VALUES
            (p_user_id, 'expense', 'Food',             'orange', TRUE, FALSE),
            (p_user_id, 'expense', 'Groceries',        'green',  TRUE, FALSE),
            (p_user_id, 'expense', 'Rent',             'brown',  TRUE, FALSE),
            (p_user_id, 'expense', 'EMI',              'purple', TRUE, FALSE),
            (p_user_id, 'expense', 'Recharge',         'cyan',   TRUE, FALSE),
            (p_user_id, 'expense', 'Fuel & Transport', 'blue',   TRUE, FALSE),
            (p_user_id, 'expense', 'Bills',            'indigo', TRUE, FALSE),
            (p_user_id, 'expense', 'Shopping',         'pink',   TRUE, FALSE),
            (p_user_id, 'expense', 'Health',           'red',    TRUE, FALSE),
            (p_user_id, 'expense', 'Education',        'teal',   TRUE, FALSE),
            (p_user_id, 'expense', 'Festivals & Gifts','gold',   TRUE, FALSE),
            (p_user_id, 'expense', 'Others',           'grey',   TRUE, TRUE),
            (p_user_id, 'income',  'Salary',           'green',  TRUE, FALSE),
            (p_user_id, 'income',  'Business',         'teal',   TRUE, FALSE),
            (p_user_id, 'income',  'Gift',             'gold',   TRUE, FALSE),
            (p_user_id, 'income',  'Refund',           'blue',   TRUE, FALSE),
            (p_user_id, 'income',  'Others',           'grey',   TRUE, TRUE);
    END IF;

    -- Step 3: recreate either "Others" tag if it is missing
    INSERT INTO public.tags (user_id, type, name, colour, is_default, is_others)
    SELECT p_user_id, t.type, 'Others', 'grey', TRUE, TRUE
    FROM (VALUES ('expense'), ('income')) AS t(type)
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.tags
        WHERE user_id = p_user_id
          AND type = t.type
          AND is_others = TRUE
    );
END;
$$;

REVOKE ALL ON FUNCTION private.setup_user(uuid)
FROM PUBLIC, anon, authenticated;


-- ---------------------------------------------------------
-- 2. Trigger on auth.users (after insert).
--    A setup failure never blocks sign-up; it is only a warning.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION private.setup_user_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    BEGIN
        PERFORM private.setup_user(NEW.id);
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'WPT_SETUP_FAILED: %', SQLERRM;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.setup_user_trigger();


-- ---------------------------------------------------------
-- 3. public.ensure_user_setup()
--    Security definer, own user only. The app calls this once
--    per launch after login, and again before opening the tag
--    picker if tags are missing (EC-ONB-09).
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_user_setup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user uuid := auth.uid();
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'WPT_NOT_AUTHENTICATED';
    END IF;

    PERFORM private.setup_user(v_user);
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_setup()
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_setup()
TO authenticated;


-- ---------------------------------------------------------
-- 4. public.create_first_source(p_id, p_type, p_name, p_opening, p_credit_limit)
--    Returns 'created' or 'already_complete'.
--    If onboarding is already complete, creates nothing.
--    Otherwise inserts the source (on conflict (id) do nothing,
--    safe to retry) and sets onboarding_completed, in one
--    transaction. Safe on two devices (EC-ONB-03).
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_first_source(
    p_id           uuid,
    p_type         text,
    p_name         text,
    p_opening      numeric,
    p_credit_limit numeric DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_user uuid := auth.uid();
    v_done boolean;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'WPT_NOT_AUTHENTICATED';
    END IF;

    -- Same lock the source guard uses: two devices cannot race here.
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(v_user::text, 1)
    );

    SELECT onboarding_completed
    INTO v_done
    FROM public.user_settings
    WHERE user_id = v_user;

    -- Settings row missing (setup failed at sign-up): repair it first.
    IF v_done IS NULL THEN
        PERFORM private.setup_user(v_user);

        SELECT onboarding_completed
        INTO v_done
        FROM public.user_settings
        WHERE user_id = v_user;
    END IF;

    IF v_done THEN
        RETURN 'already_complete';
    END IF;

    INSERT INTO public.financial_sources
        (id, type, name, opening_amount, credit_limit)
    VALUES
        (p_id, p_type, p_name, p_opening, p_credit_limit)
    ON CONFLICT (id) DO NOTHING;

    UPDATE public.user_settings
    SET onboarding_completed = TRUE
    WHERE user_id = v_user
      AND onboarding_completed = FALSE;

    RETURN 'created';
END;
$$;

REVOKE ALL ON FUNCTION public.create_first_source(uuid, text, text, numeric, numeric)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_first_source(uuid, text, text, numeric, numeric)
TO authenticated;


-- ---------------------------------------------------------
-- 5. public.sources_with_stats()
--    All sources, archived included, plus has_transactions
--    (any row counts, bin included). Order: bank, cash, card,
--    then alphabetical (SRC-06, SRC-16/17, ARC-02).
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sources_with_stats()
RETURNS TABLE (
    id              uuid,
    type            text,
    name            text,
    current_amount  numeric,
    credit_limit    numeric,
    is_archived     boolean,
    has_transactions boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT
        s.id,
        s.type,
        s.name,
        s.current_amount,
        s.credit_limit,
        s.is_archived,
        EXISTS (
            SELECT 1
            FROM public.transactions t
            WHERE t.user_id = s.user_id
              AND (t.source_id = s.id OR t.to_source_id = s.id)
        ) AS has_transactions
    FROM public.financial_sources s
    ORDER BY
        CASE s.type WHEN 'bank' THEN 1 WHEN 'cash' THEN 2 ELSE 3 END,
        lower(s.name)
$$;

REVOKE ALL ON FUNCTION public.sources_with_stats()
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sources_with_stats()
TO authenticated;


-- ---------------------------------------------------------
-- 6. public.source_totals()
--    Total balance of active bank + cash, and total card
--    outstanding of active cards. Never combined (SRC-08).
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.source_totals()
RETURNS TABLE (
    bank_cash_total          numeric,
    card_outstanding_total   numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT
        COALESCE(SUM(s.current_amount)
            FILTER (WHERE s.type IN ('bank', 'cash')), 0::numeric),
        COALESCE(SUM(s.current_amount)
            FILTER (WHERE s.type = 'card'), 0::numeric)
    FROM public.financial_sources s
    WHERE NOT s.is_archived
$$;

REVOKE ALL ON FUNCTION public.source_totals()
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.source_totals()
TO authenticated;
