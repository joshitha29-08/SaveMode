-- =========================================================
-- SaveMode - Task 4: RLS Isolation Tests
-- LOCAL DATABASE ONLY
-- All test data is rolled back.
-- =========================================================

BEGIN;

-- User A and User B
-- User A: bb65b43f-a85e-4098-be4f-307194966c8b
-- User B: 4c9c4423-202f-466b-87d1-16c88863e977

-- Existing fixtures
-- A source: 7a39cdb0-3775-4cd5-af25-db984700cbce
-- A tag:    e19c94c8-6605-46e5-a9b8-37f766fef2e3
-- B source: 5b35e8b3-b8fe-4822-9252-d22fc470cb48

-- 1. Prepare temporary User A records
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.user_settings
        WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b'
    ) THEN
        RAISE EXCEPTION 'STOP: User A settings already exist';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.transactions
        WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    ) THEN
        RAISE EXCEPTION 'STOP: Test transaction already exists';
    END IF;
END $$;

INSERT INTO public.user_settings (user_id, name, currency_code)
VALUES (
    'bb65b43f-a85e-4098-be4f-307194966c8b',
    'RLS Test User A',
    'INR'
);

INSERT INTO public.transactions (
    id, user_id, type, amount, txn_date,
    source_id, tag_id, description
)
VALUES (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bb65b43f-a85e-4098-be4f-307194966c8b',
    'expense', 100, CURRENT_DATE,
    '7a39cdb0-3775-4cd5-af25-db984700cbce',
    'e19c94c8-6605-46e5-a9b8-37f766fef2e3',
    'Temporary RLS test'
);

-- 2. Authenticate as User B
SET LOCAL ROLE authenticated;

SELECT set_config(
    'request.jwt.claim.sub',
    '4c9c4423-202f-466b-87d1-16c88863e977',
    true
);

DO $$
BEGIN
    IF auth.uid() IS DISTINCT FROM
       '4c9c4423-202f-466b-87d1-16c88863e977'::uuid THEN
        RAISE EXCEPTION 'FAIL: User B authentication';
    END IF;
    RAISE NOTICE 'PASS: User B authenticated';
END $$;

-- 3. User B cannot read User A records
DO $$
DECLARE
    n INTEGER;
BEGIN
    SELECT COUNT(*) INTO n FROM public.user_settings
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: user_settings SELECT'; END IF;

    SELECT COUNT(*) INTO n FROM public.financial_sources
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: financial_sources SELECT'; END IF;

    SELECT COUNT(*) INTO n FROM public.tags
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: tags SELECT'; END IF;

    SELECT COUNT(*) INTO n FROM public.transactions
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: transactions SELECT'; END IF;

    RAISE NOTICE 'PASS: User B cannot read User A records';
END $$;

-- 4. User B cannot insert User A settings
DO $$
BEGIN
    BEGIN
        INSERT INTO public.user_settings (user_id, name, currency_code)
        VALUES (
            'bb65b43f-a85e-4098-be4f-307194966c8b',
            'Unauthorized', 'INR'
        );
        RAISE EXCEPTION 'FAIL: User B inserted User A settings';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: User B settings INSERT denied';
    END;
END $$;

-- 5. User B cannot update/delete User A rows
DO $$
DECLARE
    n INTEGER;
BEGIN
    UPDATE public.user_settings SET name = 'Hacked'
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: user_settings UPDATE'; END IF;

    UPDATE public.financial_sources SET name = 'Hacked'
    WHERE id = '7a39cdb0-3775-4cd5-af25-db984700cbce';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: source UPDATE'; END IF;

    DELETE FROM public.financial_sources
    WHERE id = '7a39cdb0-3775-4cd5-af25-db984700cbce';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: source DELETE'; END IF;

    UPDATE public.tags SET name = 'Hacked'
    WHERE id = 'e19c94c8-6605-46e5-a9b8-37f766fef2e3';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: tag UPDATE'; END IF;

    DELETE FROM public.tags
    WHERE id = 'e19c94c8-6605-46e5-a9b8-37f766fef2e3';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: tag DELETE'; END IF;

    UPDATE public.transactions SET description = 'Hacked'
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: transaction UPDATE'; END IF;

    DELETE FROM public.transactions
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: transaction DELETE'; END IF;

    RAISE NOTICE 'PASS: User B cannot update/delete User A records';
END $$;

-- 6. User B cannot link User A source or tag
DO $$
BEGIN
    BEGIN
        INSERT INTO public.transactions (
            type, amount, txn_date, source_id, tag_id, description
        )
        VALUES (
            'expense', 50, CURRENT_DATE,
            '7a39cdb0-3775-4cd5-af25-db984700cbce',
            'e19c94c8-6605-46e5-a9b8-37f766fef2e3',
            'Cross-user source test'
        );
        RAISE EXCEPTION 'FAIL: Cross-user source accepted';
    EXCEPTION
        WHEN SQLSTATE 'P0001' THEN
            IF SQLERRM <> 'WPT_SOURCE_UNAVAILABLE' THEN RAISE; END IF;
            RAISE NOTICE 'PASS: Cross-user source blocked';
    END;

    BEGIN
        INSERT INTO public.transactions (
            type, amount, txn_date, source_id, tag_id, description
        )
        VALUES (
            'expense', 50, CURRENT_DATE,
            '5b35e8b3-b8fe-4822-9252-d22fc470cb48',
            'e19c94c8-6605-46e5-a9b8-37f766fef2e3',
            'Cross-user tag test'
        );
        RAISE EXCEPTION 'FAIL: Cross-user tag accepted';
    EXCEPTION
        WHEN SQLSTATE '23503' THEN
            RAISE NOTICE 'PASS: Cross-user tag blocked';
    END;
END $$;

-- 7. apple_tokens inaccessible to authenticated users
DO $$
BEGIN
    BEGIN
        PERFORM * FROM public.apple_tokens;
        RAISE EXCEPTION 'FAIL: apple_tokens SELECT allowed';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens SELECT denied';
    END;

    BEGIN
        INSERT INTO public.apple_tokens (user_id, refresh_token)
        VALUES (
            '4c9c4423-202f-466b-87d1-16c88863e977',
            'temporary-test-token'
        );
        RAISE EXCEPTION 'FAIL: apple_tokens INSERT allowed';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens INSERT denied';
    END;

    BEGIN
        UPDATE public.apple_tokens
        SET refresh_token = 'temporary-test-token';
        RAISE EXCEPTION 'FAIL: apple_tokens UPDATE allowed';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens UPDATE denied';
    END;

    BEGIN
        DELETE FROM public.apple_tokens;
        RAISE EXCEPTION 'FAIL: apple_tokens DELETE allowed';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens DELETE denied';
    END;
END $$;

-- 8. Restore owner and roll back all temporary data
RESET ROLE;
ROLLBACK;

SELECT 'RLS TEST SCRIPT COMPLETED - ALL CHANGES ROLLED BACK' AS result;