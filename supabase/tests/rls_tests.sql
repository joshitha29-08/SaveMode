-- =========================================================
-- E4: REPEATABLE ROW LEVEL SECURITY TEST
-- Creates two temporary Auth users and their own test data.
-- Run as postgres in Supabase SQL Editor.
-- All test data is rolled back at the end.
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- 1. CREATE TWO TEMPORARY AUTH USERS
-- The on_auth_user_created trigger creates their settings
-- and default tags automatically.
-- ---------------------------------------------------------

INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_anonymous
)
VALUES
(
    'a1000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'e4-user-a@test.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    false
),
(
    'b1000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'e4-user-b@test.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    false
);

-- ---------------------------------------------------------
-- 2. CREATE TEST SOURCES FOR BOTH USERS
-- ---------------------------------------------------------

INSERT INTO public.financial_sources (
    id, user_id, type, name, opening_amount
)
VALUES
(
    'a2000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'cash',
    'E4 User A Cash',
    1000
),
(
    'b2000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000002',
    'cash',
    'E4 User B Cash',
    1000
);

-- ---------------------------------------------------------
-- 3. CREATE ONE TRANSACTION FOR USER A
-- Use the default Food expense tag created automatically.
-- ---------------------------------------------------------

INSERT INTO public.transactions (
    id,
    user_id,
    type,
    amount,
    txn_date,
    source_id,
    tag_id,
    description
)
SELECT
    'a3000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'expense',
    100,
    CURRENT_DATE,
    'a2000000-0000-4000-8000-000000000001',
    t.id,
    'E4 temporary test transaction'
FROM public.tags t
WHERE t.user_id = 'a1000000-0000-4000-8000-000000000001'
  AND t.type = 'expense'
  AND t.name = 'Food';

  -- Create a private tag for User A to test cross-user tag access
INSERT INTO public.tags (id, user_id, type, name, colour)
VALUES (
    'a4000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'expense',
    'E4 Private Tag',
    'red'
);


-- Verify that both users were automatically set up.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_settings
        WHERE user_id = 'a1000000-0000-4000-8000-000000000001'
    ) THEN
        RAISE EXCEPTION 'FAIL: User A settings missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.user_settings
        WHERE user_id = 'b1000000-0000-4000-8000-000000000002'
    ) THEN
        RAISE EXCEPTION 'FAIL: User B settings missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.transactions
        WHERE id = 'a3000000-0000-4000-8000-000000000001'
    ) THEN
        RAISE EXCEPTION 'FAIL: User A transaction missing';
    END IF;

        IF NOT EXISTS (
        SELECT 1 FROM public.tags
        WHERE id = 'a4000000-0000-4000-8000-000000000001'
    ) THEN
        RAISE EXCEPTION 'FAIL: User A private tag missing';
    END IF;

END;
$$;


-- ---------------------------------------------------------
-- 4. ACT AS USER B
-- ---------------------------------------------------------

SET LOCAL ROLE authenticated;

SELECT set_config(
    'request.jwt.claim.sub',
    'b1000000-0000-4000-8000-000000000002',
    true
);

DO $$
DECLARE
    v_count INTEGER;
    v_rows INTEGER;
BEGIN

    -- Confirm the simulated identity.
    IF auth.uid() <>
       'b1000000-0000-4000-8000-000000000002'::uuid THEN
        RAISE EXCEPTION 'FAIL: Incorrect authenticated user';
    END IF;

    RAISE NOTICE 'PASS: User B authentication context';

    -- -----------------------------------------------------
    -- 5. USER B CANNOT READ USER A DATA
    -- -----------------------------------------------------

    SELECT count(*) INTO v_count
    FROM public.user_settings
    WHERE user_id = 'a1000000-0000-4000-8000-000000000001';

    IF v_count <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B read User A settings';
    END IF;

    SELECT count(*) INTO v_count
    FROM public.financial_sources
    WHERE id = 'a2000000-0000-4000-8000-000000000001';

    IF v_count <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B read User A source';
    END IF;

    SELECT count(*) INTO v_count
    FROM public.tags
    WHERE user_id = 'a1000000-0000-4000-8000-000000000001';

    IF v_count <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B read User A tags';
    END IF;

    SELECT count(*) INTO v_count
    FROM public.transactions
    WHERE id = 'a3000000-0000-4000-8000-000000000001';

    IF v_count <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B read User A transaction';
    END IF;

    RAISE NOTICE 'PASS: SELECT isolation on all four user tables';

    -- -----------------------------------------------------
    -- 6. USER B CANNOT UPDATE USER A DATA
    -- -----------------------------------------------------

    UPDATE public.user_settings
    SET name = 'Hacked'
    WHERE user_id = 'a1000000-0000-4000-8000-000000000001';

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B updated User A settings';
    END IF;

    UPDATE public.financial_sources
    SET name = 'Hacked'
    WHERE id = 'a2000000-0000-4000-8000-000000000001';

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B updated User A source';
    END IF;

    UPDATE public.tags
    SET colour = 'red'
    WHERE user_id = 'a1000000-0000-4000-8000-000000000001'
      AND name = 'Food'
      AND type = 'expense';

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B updated User A tags';
    END IF;

    UPDATE public.transactions
    SET description = 'Hacked'
    WHERE id = 'a3000000-0000-4000-8000-000000000001';

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B updated User A transaction';
    END IF;

    RAISE NOTICE 'PASS: UPDATE isolation on all four user tables';

    -- -----------------------------------------------------
    -- 7. USER B CANNOT DELETE USER A DATA
    -- -----------------------------------------------------

    DELETE FROM public.financial_sources
    WHERE id = 'a2000000-0000-4000-8000-000000000001';

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B deleted User A source';
    END IF;

    DELETE FROM public.tags
    WHERE user_id = 'a1000000-0000-4000-8000-000000000001'
      AND name = 'Food'
      AND type = 'expense';

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B deleted User A tag';
    END IF;

    DELETE FROM public.transactions
    WHERE id = 'a3000000-0000-4000-8000-000000000001';

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B deleted User A transaction';
    END IF;

    RAISE NOTICE 'PASS: DELETE isolation on source, tag and transaction';

    -- User settings intentionally has no DELETE permission.
    BEGIN
        DELETE FROM public.user_settings
        WHERE user_id = 'a1000000-0000-4000-8000-000000000001';

        RAISE EXCEPTION 'FAIL: User B unexpectedly had settings DELETE access';

    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: User B cannot DELETE user_settings';
    END;

    -- -----------------------------------------------------
    -- 8. USER B CANNOT INSERT ROWS FOR USER A
    -- -----------------------------------------------------

    BEGIN
        INSERT INTO public.financial_sources (
            id, user_id, type, name, opening_amount
        )
        VALUES (
            gen_random_uuid(),
            'a1000000-0000-4000-8000-000000000001',
            'cash',
            'Unauthorized source',
            100
        );

        RAISE EXCEPTION 'FAIL: Cross-user source INSERT succeeded';

    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: Cross-user source INSERT blocked';
    END;

    BEGIN
        INSERT INTO public.tags (
            id, user_id, type, name, colour
        )
        VALUES (
            gen_random_uuid(),
            'a1000000-0000-4000-8000-000000000001',
            'expense',
            'Unauthorized tag',
            'red'
        );

        RAISE EXCEPTION 'FAIL: Cross-user tag INSERT succeeded';

    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: Cross-user tag INSERT blocked';
    END;

    BEGIN
        INSERT INTO public.transactions (
            id, user_id, type, amount, txn_date, source_id, tag_id
        )
        VALUES (
            gen_random_uuid(),
            'a1000000-0000-4000-8000-000000000001',
            'expense',
            50,
            CURRENT_DATE,
            'a2000000-0000-4000-8000-000000000001',
            NULL
        );

        RAISE EXCEPTION 'FAIL: Cross-user transaction INSERT succeeded';

    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: Cross-user transaction INSERT blocked';
    END;

    -- user_settings has no INSERT permission.
    BEGIN
        INSERT INTO public.user_settings (user_id)
        VALUES ('a1000000-0000-4000-8000-000000000001');

        RAISE EXCEPTION 'FAIL: User B unexpectedly had settings INSERT access';

    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: User B cannot INSERT user_settings';
    END;

    -- -----------------------------------------------------
    -- 9. USER B CANNOT LINK A TRANSACTION TO USER A SOURCE
    -- -----------------------------------------------------

    BEGIN
        INSERT INTO public.transactions (
            id, type, amount, txn_date, source_id, tag_id
        )
        VALUES (
            gen_random_uuid(),
            'expense',
            50,
            CURRENT_DATE,
            'a2000000-0000-4000-8000-000000000001',
            (
                SELECT id
                FROM public.tags
                WHERE user_id = auth.uid()
                  AND type = 'expense'
                  AND name = 'Food'
                LIMIT 1
            )
        );

        RAISE EXCEPTION 'FAIL: Cross-user source link succeeded';

    EXCEPTION
        WHEN SQLSTATE 'P0001' THEN
            IF SQLERRM <> 'WPT_SOURCE_UNAVAILABLE' THEN
                RAISE;
            END IF;

            RAISE NOTICE 'PASS: User A source link rejected';
    END;

    -- -----------------------------------------------------
    -- 10. USER B CANNOT LINK A TRANSACTION TO USER A TAG
    -- -----------------------------------------------------

    BEGIN
        INSERT INTO public.transactions (
            id, type, amount, txn_date, source_id, tag_id
        )
        VALUES (
            gen_random_uuid(),
            'expense',
            50,
            CURRENT_DATE,
            'b2000000-0000-4000-8000-000000000002',
            'a4000000-0000-4000-8000-000000000001'
           
        );

        RAISE EXCEPTION 'FAIL: Cross-user tag link succeeded';

    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'PASS: User A tag link rejected';
    END;

    -- -----------------------------------------------------
    -- 11. USER B CANNOT USE USER A SOURCE AS TRANSFER TARGET
    -- -----------------------------------------------------

    BEGIN
        INSERT INTO public.transactions (
            id, type, amount, txn_date,
            source_id, to_source_id
        )
        VALUES (
            gen_random_uuid(),
            'transfer',
            50,
            CURRENT_DATE,
            'b2000000-0000-4000-8000-000000000002',
            'a2000000-0000-4000-8000-000000000001'
        );

        RAISE EXCEPTION 'FAIL: Cross-user transfer target succeeded';

    EXCEPTION
        WHEN SQLSTATE 'P0001' THEN
            IF SQLERRM <> 'WPT_SOURCE_UNAVAILABLE' THEN
                RAISE;
            END IF;

            RAISE NOTICE 'PASS: Cross-user transfer target rejected';
    END;

    -- -----------------------------------------------------
    -- 12. APPLE TOKENS MUST HAVE NO AUTHENTICATED ACCESS
    -- -----------------------------------------------------

    BEGIN
        PERFORM * FROM public.apple_tokens;

        RAISE EXCEPTION 'FAIL: apple_tokens SELECT was allowed';

    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens SELECT blocked';
    END;

    BEGIN
        INSERT INTO public.apple_tokens (user_id, refresh_token)
        VALUES (
            auth.uid(),
            'temporary-test-token'
        );

        RAISE EXCEPTION 'FAIL: apple_tokens INSERT was allowed';

    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens INSERT blocked';
    END;

    BEGIN
        UPDATE public.apple_tokens
        SET refresh_token = 'unauthorized'
        WHERE user_id = auth.uid();

        RAISE EXCEPTION 'FAIL: apple_tokens UPDATE was allowed';

    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens UPDATE blocked';
    END;

    BEGIN
        DELETE FROM public.apple_tokens
        WHERE user_id = auth.uid();

        RAISE EXCEPTION 'FAIL: apple_tokens DELETE was allowed';

    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens DELETE blocked';
    END;

    RAISE NOTICE 'PASS: All E4 security checks completed';

END;
$$;

-- ---------------------------------------------------------
-- 13. CLEAN UP ALL TEMPORARY TEST DATA
-- ---------------------------------------------------------

RESET ROLE;

ROLLBACK;

SELECT 'E4 RLS TEST COMPLETED - ALL TEST DATA ROLLED BACK' AS result;