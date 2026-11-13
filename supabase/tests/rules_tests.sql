-- =========================================================
-- SaveMode - Task 5: Source and Tag Rules Tests
-- Local Supabase only. Use dedicated dummy User A.
-- Run the ENTIRE script as one batch.
-- All fixture changes are rolled back.
-- =========================================================

BEGIN;

-- User A
-- bb65b43f-a85e-4098-be4f-307194966c8b

-- Existing User A source
-- 7a39cdb0-3775-4cd5-af25-db984700cbce

-- Existing User A expense tag
-- e19c94c8-6605-46e5-a9b8-37f766fef2e3


-- ---------------------------------------------------------
-- 1. Create temporary fixtures as database owner
-- ---------------------------------------------------------

-- Create User A
INSERT INTO auth.users (id, email)
VALUES (
    'bb65b43f-a85e-4098-be4f-307194966c8b',
    'task5-test@example.com'
);

-- Create existing User A source
INSERT INTO public.financial_sources
    (id, user_id, type, name, opening_amount)
VALUES (
    '7a39cdb0-3775-4cd5-af25-db984700cbce',
    'bb65b43f-a85e-4098-be4f-307194966c8b',
    'cash',
    'rls test cash',
    0
);

-- Create existing User A expense tag
INSERT INTO public.tags
    (id, user_id, type, name, colour)
VALUES (
    'e19c94c8-6605-46e5-a9b8-37f766fef2e3',
    'bb65b43f-a85e-4098-be4f-307194966c8b',
    'expense',
    'Rule Test Existing Tag',
    '#808080'
);


DO $$
DECLARE
    i INTEGER;
    v_existing INTEGER;
    v_others INTEGER;
    v_add_others INTEGER;
BEGIN
    --48 extra sources + 1 existing source = 49
    FOR i IN 1..48 LOOP
        INSERT INTO public.financial_sources
            (user_id, type, name, opening_amount)
        VALUES (
            'bb65b43f-a85e-4098-be4f-307194966c8b',
            'cash',
            'Rule Test Source ' || i,
            0
        );
    END LOOP;

    -- Fill up to 100 expense tags including "Others" (the 101st is
    -- expected to be blocked). After migration 005 the account
    -- already has default tags, so the number of extras is computed.
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE is_others = TRUE)
    INTO v_existing, v_others
    FROM public.tags
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b'
      AND type = 'expense';

    v_add_others := CASE WHEN v_others = 0 THEN 1 ELSE 0 END;

    FOR i IN 1..(100 - v_existing - v_add_others) LOOP
        INSERT INTO public.tags
            (user_id, type, name, colour)
        VALUES (
            'bb65b43f-a85e-4098-be4f-307194966c8b',
            'expense',
            'Rule Test Tag ' || i,
            '#808080'
        );
    END LOOP;

    -- Temporary Others tag for protection tests.
    -- After migration 005 the account already has an "Others" tag,
    -- so only create one when it is missing.
    IF NOT EXISTS (
        SELECT 1 FROM public.tags
        WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b'
          AND type = 'expense'
          AND is_others = TRUE
    ) THEN
        INSERT INTO public.tags
            (user_id, type, name, colour, is_others)
        VALUES (
            'bb65b43f-a85e-4098-be4f-307194966c8b',
            'expense',
            'Rule Test Others',
            '#808080',
            TRUE
        );
    END IF;
END;
$$;


-- ---------------------------------------------------------
-- 2. Switch to authenticated User A
-- ---------------------------------------------------------

SET LOCAL ROLE authenticated;

SELECT set_config(
    'request.jwt.claim.sub',
    'bb65b43f-a85e-4098-be4f-307194966c8b',
    TRUE
);

DO $$
BEGIN
    IF auth.uid() <> 'bb65b43f-a85e-4098-be4f-307194966c8b'::uuid THEN
        RAISE EXCEPTION 'FAIL: User A authentication simulation failed';
    END IF;

    RAISE NOTICE 'PASS: Running as authenticated User A';
END;
$$;


-- ---------------------------------------------------------
-- 3. Source name must be unique across source types
-- ---------------------------------------------------------

DO $$
BEGIN
    BEGIN
        INSERT INTO public.financial_sources
            (type, name, opening_amount)
        VALUES ('bank', '  rls test cash  ', 0);

        RAISE EXCEPTION 'FAIL: Duplicate source name was allowed';
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'PASS: Duplicate source name blocked';
    END;
END;
$$;


-- ---------------------------------------------------------
-- 4. Source type cannot be changed
-- ---------------------------------------------------------

RESET ROLE;

DO $$
BEGIN
    BEGIN
        UPDATE public.financial_sources
        SET type = 'bank'
        WHERE id = '7a39cdb0-3775-4cd5-af25-db984700cbce';

        RAISE EXCEPTION 'FAIL: Source type change was allowed';
    EXCEPTION
        WHEN SQLSTATE 'P0001' THEN
            IF SQLERRM <> 'WPT_TYPE_LOCKED' THEN
                RAISE;
            END IF;

            RAISE NOTICE 'PASS: Source type change blocked';
    END;
END;
$$;

SET LOCAL ROLE authenticated;


-- ---------------------------------------------------------
-- 5. Current amount cannot be directly updated by app
-- ---------------------------------------------------------

DO $$
BEGIN
    IF has_column_privilege(
        'authenticated',
        'public.financial_sources',
        'current_amount',
        'UPDATE'
    ) THEN
        RAISE EXCEPTION 'FAIL: App can directly update current_amount';
    END IF;

    RAISE NOTICE 'PASS: Direct current_amount update privilege denied';
END;
$$;

-- ---------------------------------------------------------
-- 5A. Database guard blocks direct current_amount changes
-- ---------------------------------------------------------

RESET ROLE;

DO $$
BEGIN
    BEGIN
        UPDATE public.financial_sources
        SET current_amount = current_amount + 100
        WHERE id = '7a39cdb0-3775-4cd5-af25-db984700cbce';

        RAISE EXCEPTION 'FAIL: Direct current_amount update was allowed';

    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM = 'WPT_CURRENT_AMOUNT_LOCKED' THEN
                RAISE NOTICE 'PASS: Database guard blocks direct current_amount update';
            ELSE
                RAISE;
            END IF;
    END;
END;
$$;

SET LOCAL ROLE authenticated;


-- ---------------------------------------------------------
-- 6. Opening amount update must shift current amount
-- ---------------------------------------------------------

DO $$
DECLARE
    old_opening NUMERIC(14,2);
    old_current NUMERIC(14,2);
    new_opening NUMERIC(14,2);
    new_current NUMERIC(14,2);
BEGIN
    SELECT opening_amount, current_amount
    INTO old_opening, old_current
    FROM public.financial_sources
    WHERE id = '7a39cdb0-3775-4cd5-af25-db984700cbce';

    UPDATE public.financial_sources
    SET opening_amount = old_opening + 100
    WHERE id = '7a39cdb0-3775-4cd5-af25-db984700cbce';

    SELECT opening_amount, current_amount
    INTO new_opening, new_current
    FROM public.financial_sources
    WHERE id = '7a39cdb0-3775-4cd5-af25-db984700cbce';

    IF new_opening <> old_opening + 100
       OR new_current <> old_current + 100 THEN
        RAISE EXCEPTION 'FAIL: Opening amount did not shift current amount';
    END IF;

    RAISE NOTICE 'PASS: Opening amount shifts current amount';
END;
$$;


-- ---------------------------------------------------------
-- 7. Source deletion must be blocked when transactions exist
-- ---------------------------------------------------------

DO $$
BEGIN
    INSERT INTO public.transactions
        (type, amount, txn_date, source_id, tag_id, description)
    VALUES (
        'expense',
        100,
        CURRENT_DATE,
        '7a39cdb0-3775-4cd5-af25-db984700cbce',
        'e19c94c8-6605-46e5-a9b8-37f766fef2e3',
        'Temporary source delete test'
    );

    BEGIN
        DELETE FROM public.financial_sources
        WHERE id = '7a39cdb0-3775-4cd5-af25-db984700cbce';

        RAISE EXCEPTION 'FAIL: Source with transaction was deleted';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'PASS: Source deletion blocked when transactions exist';
    END;
END;
$$;

RESET ROLE;

SET LOCAL ROLE authenticated;



-- ---------------------------------------------------------
-- 9. 101st tag must be blocked
-- ---------------------------------------------------------

DO $$
BEGIN
    BEGIN
        INSERT INTO public.tags (type, name, colour)
        VALUES ('expense', 'Rule Test 101st Tag', '#808080');

        RAISE EXCEPTION 'FAIL: 101st tag was allowed';
    EXCEPTION
        WHEN SQLSTATE 'P0001' THEN
            IF SQLERRM <> 'WPT_TAG_LIMIT' THEN
                RAISE;
            END IF;

            RAISE NOTICE 'PASS: 101st tag blocked';
    END;
END;
$$;


-- ---------------------------------------------------------
-- 10. Others tag cannot be renamed
-- ---------------------------------------------------------

DO $$
BEGIN
    BEGIN
        UPDATE public.tags
        SET name = 'Changed Others'
        WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b'
          AND type = 'expense'
          AND is_others = TRUE;

        RAISE EXCEPTION 'FAIL: Others tag rename was allowed';
    EXCEPTION
        WHEN SQLSTATE 'P0001' THEN
            IF SQLERRM <> 'WPT_OTHERS_PROTECTED' THEN
                RAISE;
            END IF;

            RAISE NOTICE 'PASS: Others tag rename blocked';
    END;
END;
$$;


-- ---------------------------------------------------------
-- 11. Others tag cannot be deleted
-- ---------------------------------------------------------

DO $$
BEGIN
    BEGIN
        DELETE FROM public.tags
        WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b'
          AND type = 'expense'
          AND is_others = TRUE;

        RAISE EXCEPTION 'FAIL: Others tag deletion was allowed';
    EXCEPTION
        WHEN SQLSTATE 'P0001' THEN
            IF SQLERRM <> 'WPT_OTHERS_PROTECTED' THEN
                RAISE;
            END IF;

            RAISE NOTICE 'PASS: Others tag deletion blocked';
    END;
END;
$$;


-- ---------------------------------------------------------
-- 12. Source name length: maximum 120 characters
-- ---------------------------------------------------------

DO $$
BEGIN
    BEGIN
        INSERT INTO public.financial_sources
            (type, name, opening_amount)
        VALUES (
            'cash',
            repeat('A', 121),
            0
        );

        RAISE EXCEPTION 'FAIL: 121-character source name allowed';
    EXCEPTION
        WHEN SQLSTATE '23514' THEN
            RAISE NOTICE 'PASS: Source name length checked';
    END;
END;
$$;


-- ---------------------------------------------------------
-- 13. Tag name length: maximum 80 characters
-- ---------------------------------------------------------

DO $$
BEGIN
    BEGIN
        INSERT INTO public.tags (type, name, colour)
        VALUES ('income', repeat('A', 81), '#808080');

        RAISE EXCEPTION 'FAIL: 81-character tag name allowed';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Tag name length checked';
    END;
END;
$$;


-- ---------------------------------------------------------
-- 14. Tag colour length: maximum 32 characters
-- ---------------------------------------------------------

DO $$
BEGIN
    BEGIN
        INSERT INTO public.tags (type, name, colour)
        VALUES ('income', 'Colour Test', repeat('A', 33));

        RAISE EXCEPTION 'FAIL: 33-character colour allowed';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Tag colour length checked';
    END;
END;
$$;


-- ---------------------------------------------------------
-- 15. Transaction description length: maximum 400
-- ---------------------------------------------------------

DO $$
BEGIN
    BEGIN
        INSERT INTO public.transactions
            (type, amount, txn_date, source_id, tag_id, description)
        VALUES (
            'expense',
            100,
            CURRENT_DATE,
            '7a39cdb0-3775-4cd5-af25-db984700cbce',
            'e19c94c8-6605-46e5-a9b8-37f766fef2e3',
            repeat('A', 401)
        );

        RAISE EXCEPTION 'FAIL: 401-character description allowed';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Transaction description length checked';
    END;
END;
$$;


-- ---------------------------------------------------------
-- 16. Amount range must be enforced
-- ---------------------------------------------------------

DO $$
BEGIN
    BEGIN
        INSERT INTO public.financial_sources
            (type, name, opening_amount)
        VALUES (
            'cash',
            'Amount Range Test',
            10000000000.00
        );

        RAISE EXCEPTION 'FAIL: Amount above maximum was allowed';

    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Source amount range checked';
    END;
END;
$$;
 
RESET ROLE;

-- ---------------------------------------------------------
-- 8. 51st source must be blocked
-- ---------------------------------------------------------

DO $$
BEGIN
    -- Create the 50th source
    INSERT INTO public.financial_sources
        (user_id, type, name, opening_amount)
    VALUES (
        'bb65b43f-a85e-4098-be4f-307194966c8b',
        'cash',
        'Rule Test 50th Source',
        0
    );

    -- Try to create the 51st source
    BEGIN
        INSERT INTO public.financial_sources
            (user_id, type, name, opening_amount)
        VALUES (
            'bb65b43f-a85e-4098-be4f-307194966c8b',
            'cash',
            'Rule Test 51st Source',
            0
        );

        RAISE EXCEPTION 'FAIL: 51st source was allowed';

    EXCEPTION
        WHEN SQLSTATE 'P0001' THEN
            IF SQLERRM <> 'WPT_SOURCE_LIMIT' THEN
                RAISE;
            END IF;

            RAISE NOTICE 'PASS: 51st source blocked';
    END;
END;
$$;




-- ---------------------------------------------------------
-- 17. Initial current amount must equal opening amount
-- ---------------------------------------------------------

DO $$
DECLARE
    opening_value NUMERIC(14,2);
    current_value NUMERIC(14,2);
BEGIN
    SELECT opening_amount, current_amount
    INTO opening_value, current_value
    FROM public.financial_sources
    WHERE name = 'Rule Test 50th Source'
      AND user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'FAIL: 50th source not found';
    END IF;

    IF opening_value <> current_value THEN
        RAISE EXCEPTION 'FAIL: Initial current amount mismatch';
    END IF;

    RAISE NOTICE 'PASS: Initial current amount equals opening amount';
END;
$$;


-- =========================================================
-- TASK 6: Migration 005 tests
-- User setup + source RPCs. Dedicated test user B.
-- All fixture changes are rolled back at the end.
-- =========================================================

-- Test User B
-- 11111111-1111-1111-1111-111111111111

RESET ROLE;

-- ---------------------------------------------------------
-- 19. Sign-up trigger creates 1 settings row and 17 tags
-- ---------------------------------------------------------

INSERT INTO auth.users (id, email)
VALUES ('11111111-1111-1111-1111-111111111111', 'task6-test@example.com');

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_settings
        WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
          AND currency_code = 'INR'
          AND theme = 'system'
          AND onboarding_completed = FALSE
    ) THEN
        RAISE EXCEPTION 'FAIL: settings row missing or wrong values';
    END IF;

    RAISE NOTICE 'PASS: sign-up created the settings row';
END;
$$;

DO $$
DECLARE
    v_tag_count INTEGER;
    v_others_count INTEGER;
    v_bad_tags INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_tag_count
    FROM public.tags
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

    IF v_tag_count <> 17 THEN
        RAISE EXCEPTION 'FAIL: expected 17 tags, found %', v_tag_count;
    END IF;

    SELECT COUNT(*)
    INTO v_others_count
    FROM public.tags
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
      AND is_others = TRUE
      AND is_default = TRUE
      AND name = 'Others'
      AND colour = 'grey';

    IF v_others_count <> 2 THEN
        RAISE EXCEPTION 'FAIL: expected 2 protected Others tags, found %', v_others_count;
    END IF;

    SELECT COUNT(*)
    INTO v_bad_tags
    FROM public.tags
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
      AND (is_default = FALSE OR is_others NOT IN (FALSE, TRUE));

    IF v_bad_tags <> 0 THEN
        RAISE EXCEPTION 'FAIL: default tags missing is_default';
    END IF;

    RAISE NOTICE 'PASS: sign-up created 17 default tags with protected Others';
END;
$$;

-- ---------------------------------------------------------
-- 20. setup_user is idempotent
-- ---------------------------------------------------------

SELECT private.setup_user('11111111-1111-1111-1111-111111111111'::uuid);
SELECT private.setup_user('11111111-1111-1111-1111-111111111111'::uuid);

DO $$
DECLARE
    v_settings_count INTEGER;
    v_tag_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_settings_count
    FROM public.user_settings
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

    SELECT COUNT(*) INTO v_tag_count
    FROM public.tags
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

    IF v_settings_count <> 1 OR v_tag_count <> 17 THEN
        RAISE EXCEPTION 'FAIL: idempotency broken (% settings, % tags)',
            v_settings_count, v_tag_count;
    END IF;

    RAISE NOTICE 'PASS: setup_user is idempotent';
END;
$$;

-- ---------------------------------------------------------
-- 21. Missing Others tag is recreated (EC-TAG-11)
-- ---------------------------------------------------------

SELECT set_config('wpt.account_delete', 'on', FALSE);

DELETE FROM public.tags
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
  AND is_others = TRUE;

SELECT private.setup_user('11111111-1111-1111-1111-111111111111'::uuid);

SELECT set_config('wpt.account_delete', 'off', FALSE);

DO $$
DECLARE
    v_others_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_others_count
    FROM public.tags
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
      AND is_others = TRUE
      AND name = 'Others'
      AND colour = 'grey'
      AND is_default = TRUE;

    IF v_others_count <> 2 THEN
        RAISE EXCEPTION 'FAIL: Others tags not recreated (found %)', v_others_count;
    END IF;

    RAISE NOTICE 'PASS: missing Others tags recreated';
END;
$$;

-- ---------------------------------------------------------
-- 22. ensure_user_setup as authenticated: own user only,
--     never duplicates anything
-- ---------------------------------------------------------

SET LOCAL ROLE authenticated;

SELECT set_config(
    'request.jwt.claim.sub',
    '11111111-1111-1111-1111-111111111111',
    TRUE
);

SELECT public.ensure_user_setup();

DO $$
DECLARE
    v_tag_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_tag_count
    FROM public.tags
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

    IF v_tag_count <> 17 THEN
        RAISE EXCEPTION 'FAIL: ensure_user_setup changed the tag count to %',
            v_tag_count;
    END IF;

    RAISE NOTICE 'PASS: ensure_user_setup does not duplicate data';
END;
$$;

-- Existing user A: must not gain tags either
SELECT set_config(
    'request.jwt.claim.sub',
    'bb65b43f-a85e-4098-be4f-307194966c8b',
    TRUE
);

DO $$
DECLARE
    v_before INTEGER;
    v_after INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_before
    FROM public.tags
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b'::uuid;

    PERFORM public.ensure_user_setup();

    SELECT COUNT(*) INTO v_after
    FROM public.tags
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b'::uuid;

    IF v_after <> v_before THEN
        RAISE EXCEPTION 'FAIL: ensure_user_setup added tags to user A (% -> %)',
            v_before, v_after;
    END IF;

    RAISE NOTICE 'PASS: ensure_user_setup leaves existing users alone';
END;
$$;

-- ---------------------------------------------------------
-- 23. create_first_source: created, then already_complete
-- ---------------------------------------------------------

-- The app saves the name in onboarding step 1 (ONB-02)
-- before step 3 calls create_first_source.

RESET ROLE;

UPDATE public.user_settings
SET name = 'Task 6 User'
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

SET LOCAL ROLE authenticated;

SELECT set_config(
    'request.jwt.claim.sub',
    '11111111-1111-1111-1111-111111111111',
    TRUE
);

-- Test: Another user's source ID must not be accepted

DO $$
BEGIN
    BEGIN
        PERFORM public.create_first_source(
            '7a39cdb0-3775-4cd5-af25-db984700cbce'::uuid,
            'cash',
            'Collision Test',
            0
        );

        RAISE EXCEPTION 'FAIL: Foreign source ID was accepted';

    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM = 'WPT_SOURCE_ID_CONFLICT' THEN
                RAISE NOTICE 'PASS: Foreign source ID conflict blocked';
            ELSE
                RAISE;
            END IF;
    END;
END;
$$;

DO $$
DECLARE
    v_result TEXT;
    v_source_id UUID := gen_random_uuid();
BEGIN
    v_result := public.create_first_source(
        v_source_id, 'cash', 'Task 6 Cash', 100
    );

    IF v_result <> 'created' THEN
        RAISE EXCEPTION 'FAIL: expected created, got %', v_result;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.financial_sources
        WHERE id = v_source_id
          AND type = 'cash'
          AND opening_amount = 100
          AND current_amount = 100
          AND user_id = '11111111-1111-1111-1111-111111111111'::uuid
    ) THEN
        RAISE EXCEPTION 'FAIL: first source not created correctly';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.user_settings
        WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
          AND onboarding_completed = TRUE
    ) THEN
        RAISE EXCEPTION 'FAIL: onboarding not marked complete';
    END IF;

    RAISE NOTICE 'PASS: create_first_source created the first source';
END;
$$;

DO $$
DECLARE
    v_result TEXT;
    v_source_count INTEGER;
BEGIN
    v_result := public.create_first_source(
        gen_random_uuid(), 'bank', 'Task 6 Bank', 0
    );

    IF v_result <> 'already_complete' THEN
        RAISE EXCEPTION 'FAIL: expected already_complete, got %', v_result;
    END IF;

    SELECT COUNT(*) INTO v_source_count
    FROM public.financial_sources
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

    IF v_source_count <> 1 THEN
        RAISE EXCEPTION 'FAIL: retry created extra sources (%)', v_source_count;
    END IF;

    RAISE NOTICE 'PASS: create_first_source is safe to retry';
END;
$$;

-- Repair path: settings row missing (sign-up setup failed).
-- The app calls ensure_user_setup (recreating the row), saves the
-- name in onboarding step 1, then create_first_source completes it.

RESET ROLE;

DELETE FROM public.user_settings
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

SELECT private.setup_user('11111111-1111-1111-1111-111111111111'::uuid);

UPDATE public.user_settings
SET name = 'Task 6 User'
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

SET LOCAL ROLE authenticated;

SELECT set_config(
    'request.jwt.claim.sub',
    '11111111-1111-1111-1111-111111111111',
    TRUE
);

DO $$
DECLARE
    v_result TEXT;
BEGIN
    v_result := public.create_first_source(
        gen_random_uuid(), 'bank', 'Task 6 Bank', 0
    );

    IF v_result <> 'created' THEN
        RAISE EXCEPTION 'FAIL: expected created after repair, got %', v_result;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.user_settings
        WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
          AND onboarding_completed = TRUE
          AND currency_code = 'INR'
          AND name = 'Task 6 User'
    ) THEN
        RAISE EXCEPTION 'FAIL: settings row not repaired';
    END IF;

    RAISE NOTICE 'PASS: onboarding completes after a settings repair';
END;
$$;

-- ---------------------------------------------------------
-- 24. sources_with_stats: order + has_transactions (bin included)
-- ---------------------------------------------------------

-- User B now has: Task 6 Cash (cash), Task 6 Bank (bank).
INSERT INTO public.financial_sources (type, name, opening_amount)
VALUES ('bank', 'Alpha Bank', 500);

INSERT INTO public.financial_sources (type, name, opening_amount, credit_limit)
VALUES ('card', 'Zed Card', 300, 1000);

-- One expense transaction on Task 6 Cash, using the Food tag
INSERT INTO public.transactions
    (type, amount, txn_date, source_id, tag_id)
SELECT 'expense', 50, CURRENT_DATE, s.id, t.id
FROM public.financial_sources s,
     public.tags t
WHERE s.name = 'Task 6 Cash'
  AND s.user_id = '11111111-1111-1111-1111-111111111111'::uuid
  AND t.user_id = s.user_id
  AND t.type = 'expense'
  AND t.name = 'Food';

DO $$
DECLARE
    v_names TEXT;
    v_txn_source TEXT;
BEGIN
    SELECT string_agg(name, ',') INTO v_names
    FROM public.sources_with_stats();

    -- bank first (alphabetical), then cash, then card
    IF v_names <> 'Alpha Bank,Task 6 Bank,Task 6 Cash,Zed Card' THEN
        RAISE EXCEPTION 'FAIL: sources_with_stats order wrong: %', v_names;
    END IF;

    SELECT name INTO v_txn_source
    FROM public.sources_with_stats()
    WHERE has_transactions = TRUE;

    IF v_txn_source <> 'Task 6 Cash' THEN
        RAISE EXCEPTION 'FAIL: has_transactions wrong (only % set)', v_txn_source;
    END IF;

    RAISE NOTICE 'PASS: sources_with_stats order and has_transactions';
END;
$$;

-- Soft-deleted (bin) transactions still count (ARC-02)
RESET ROLE;

UPDATE public.transactions
SET deleted_at = now()
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

SET LOCAL ROLE authenticated;

SELECT set_config(
    'request.jwt.claim.sub',
    '11111111-1111-1111-1111-111111111111',
    TRUE
);

DO $$
DECLARE
    v_bin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_bin_count
    FROM public.sources_with_stats()
    WHERE has_transactions = TRUE;

    IF v_bin_count <> 1 THEN
        RAISE EXCEPTION 'FAIL: bin transaction not counted (%)', v_bin_count;
    END IF;

    RAISE NOTICE 'PASS: has_transactions includes the bin';
END;
$$;

-- ---------------------------------------------------------
-- 25. source_totals: bank + cash separate from card (SRC-08)
-- ---------------------------------------------------------

DO $$
DECLARE
    v_bank_cash NUMERIC;
    v_card NUMERIC;
BEGIN
    SELECT bank_cash_total, card_outstanding_total
    INTO v_bank_cash, v_card
    FROM public.source_totals();

    -- Alpha Bank 500 + Task 6 Cash 100 = 600; Zed Card outstanding 300
    IF v_bank_cash <> 600 OR v_card <> 300 THEN
        RAISE EXCEPTION 'FAIL: totals expected 600/300, got %/%',
            v_bank_cash, v_card;
    END IF;

    RAISE NOTICE 'PASS: source_totals returns bank+cash and card separately';
END;
$$;

-- Archived sources are excluded
RESET ROLE;

UPDATE public.financial_sources
SET is_archived = TRUE
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
  AND name = 'Alpha Bank';

SET LOCAL ROLE authenticated;

SELECT set_config(
    'request.jwt.claim.sub',
    '11111111-1111-1111-1111-111111111111',
    TRUE
);

DO $$
DECLARE
    v_bank_cash NUMERIC;
    v_card NUMERIC;
BEGIN
    SELECT bank_cash_total, card_outstanding_total
    INTO v_bank_cash, v_card
    FROM public.source_totals();

    IF v_bank_cash <> 100 OR v_card <> 300 THEN
        RAISE EXCEPTION 'FAIL: archived sources included (%/%)',
            v_bank_cash, v_card;
    END IF;

    RAISE NOTICE 'PASS: source_totals excludes archived sources';
END;
$$;

-- ---------------------------------------------------------
-- 26. Roll back all temporary test data
-- ---------------------------------------------------------

RESET ROLE;

ROLLBACK;

SELECT 'TASK 5 + TASK 6 RULE TESTS COMPLETED - ALL CHANGES ROLLED BACK'
AS result;
