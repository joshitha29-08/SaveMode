-- =========================================================
-- SaveMode - Task 4: RLS Isolation Tests
-- Local test using dedicated local dummy accounts only.
-- Run the ENTIRE script as one batch.
-- All fixture changes are rolled back.
-- =========================================================

BEGIN;

-- User A
-- bb65b43f-a85e-4098-be4f-307194966c8b

-- User B
-- 4c9c4423-202f-466b-87d1-16c88863e977

-- User A source
-- 7a39cdb0-3775-4cd5-af25-db984700cbce

-- User A expense tag
-- e19c94c8-6605-46e5-a9b8-37f766fef2e3

-- User B source
-- 5b35e8b3-b8fe-4822-9252-d22fc470cb48


-- ---------------------------------------------------------
-- 1. Create temporary User A fixtures as database owner
-- ---------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.user_settings
        WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b'
    ) THEN
        RAISE EXCEPTION 'STOP: User A user_settings already exists';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.transactions
        WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    ) THEN
        RAISE EXCEPTION 'STOP: Test transaction ID already exists';
    END IF;
END $$;

INSERT INTO public.user_settings (
    user_id,
    name,
    currency_code
)
VALUES (
    'bb65b43f-a85e-4098-be4f-307194966c8b',
    'RLS Test User A',
    'INR'
);

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
VALUES (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bb65b43f-a85e-4098-be4f-307194966c8b',
    'expense',
    100,
    CURRENT_DATE,
    '7a39cdb0-3775-4cd5-af25-db984700cbce',
    'e19c94c8-6605-46e5-a9b8-37f766fef2e3',
    'Temporary RLS test'
);


-- ---------------------------------------------------------
-- 2. Switch to authenticated User B
-- ---------------------------------------------------------

SET LOCAL ROLE authenticated;

SELECT set_config(
    'request.jwt.claim.sub',
    '4c9c4423-202f-466b-87d1-16c88863e977',
    true
);

DO $$
BEGIN
    IF auth.uid() <> '4c9c4423-202f-466b-87d1-16c88863e977'::uuid THEN
        RAISE EXCEPTION 'FAIL: User B authentication simulation failed';
    END IF;

    RAISE NOTICE 'PASS: Running as authenticated User B';
END $$;


-- ---------------------------------------------------------
-- 3. User B cannot read User A records
-- ---------------------------------------------------------

DO $$
DECLARE
    n INTEGER;
BEGIN
    SELECT COUNT(*) INTO n
    FROM public.user_settings
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';

    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B can read User A user_settings';
    END IF;

    SELECT COUNT(*) INTO n
    FROM public.financial_sources
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';

    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B can read User A financial_sources';
    END IF;

    SELECT COUNT(*) INTO n
    FROM public.tags
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';

    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B can read User A tags';
    END IF;

    SELECT COUNT(*) INTO n
    FROM public.transactions
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';

    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B can read User A transactions';
    END IF;

    RAISE NOTICE 'PASS: User B cannot read User A records';
END $$;


-- ---------------------------------------------------------
-- 4. User B cannot update or delete User A records
-- ---------------------------------------------------------

DO $$
DECLARE
    n INTEGER;
BEGIN
    UPDATE public.user_settings
    SET name = 'Hacked'
    WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B updated User A user_settings';
    END IF;

    -- User B cannot delete User A user_settings
    BEGIN
        DELETE FROM public.user_settings
        WHERE user_id = 'bb65b43f-a85e-4098-be4f-307194966c8b';

        RAISE EXCEPTION 'FAIL: User B deleted User A user_settings';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: User B cannot delete User A user_settings';
    END;

    UPDATE public.financial_sources
    SET name = 'Hacked'
    WHERE id = '7a39cdb0-3775-4cd5-af25-db984700cbce';

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B updated User A source';
    END IF;

    DELETE FROM public.financial_sources
    WHERE id = '7a39cdb0-3775-4cd5-af25-db984700cbce';

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B deleted User A source';
    END IF;

    UPDATE public.tags
    SET name = 'Hacked'
    WHERE id = 'e19c94c8-6605-46e5-a9b8-37f766fef2e3';

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B updated User A tag';
    END IF;

    DELETE FROM public.tags
    WHERE id = 'e19c94c8-6605-46e5-a9b8-37f766fef2e3';

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B deleted User A tag';
    END IF;

    UPDATE public.transactions
    SET description = 'Hacked'
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B updated User A transaction';
    END IF;

    DELETE FROM public.transactions
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN
        RAISE EXCEPTION 'FAIL: User B deleted User A transaction';
    END IF;

    RAISE NOTICE 'PASS: User B cannot update or delete User A records';
END $$;

-- 5. User B cannot link User A source

DO $$
BEGIN
    BEGIN
        INSERT INTO public.transactions (
            type, amount, txn_date, source_id, tag_id, description
        )
        VALUES (
            'expense',
            50,
            CURRENT_DATE,
            '7a39cdb0-3775-4cd5-af25-db984700cbce',
            'e19c94c8-6605-46e5-a9b8-37f766fef2e3',
            'Cross-user source test'
        );

        RAISE EXCEPTION 'FAIL: User B linked User A source';

    EXCEPTION
        WHEN SQLSTATE 'P0001' THEN
            IF SQLERRM = 'FAIL: User B linked User A source' THEN
                RAISE;
            END IF;

            IF SQLERRM <> 'WPT_SOURCE_UNAVAILABLE' THEN
                RAISE;
            END IF;
    END;

    RAISE NOTICE 'PASS: User B cannot link User A source';
END $$;

-- 6. User B cannot link User A tag

DO $$
BEGIN
    BEGIN
        INSERT INTO public.transactions (
            type, amount, txn_date, source_id, tag_id, description
        )
        VALUES (
            'expense',
            50,
            CURRENT_DATE,
            '5b35e8b3-b8fe-4822-9252-d22fc470cb48',
            'e19c94c8-6605-46e5-a9b8-37f766fef2e3',
            'Cross-user tag test'
        );

        RAISE EXCEPTION 'FAIL: User B linked User A tag';

    EXCEPTION
        WHEN SQLSTATE '23503' THEN
            RAISE NOTICE 'PASS: User B cannot link User A tag';
    END;
END $$;


-- ---------------------------------------------------------
-- 7. apple_tokens must deny all app access
-- ---------------------------------------------------------

DO $$
BEGIN
    -- SELECT
    BEGIN
        PERFORM * FROM public.apple_tokens;

        RAISE EXCEPTION 'FAIL: apple_tokens SELECT allowed'
            USING ERRCODE = 'P0001';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens SELECT denied';
    END;

    -- INSERT
    BEGIN
        INSERT INTO public.apple_tokens (user_id, refresh_token)
        VALUES (
            '4c9c4423-202f-466b-87d1-16c88863e977',
            'temporary-test-token'
        );

        RAISE EXCEPTION 'FAIL: apple_tokens INSERT allowed'
            USING ERRCODE = 'P0001';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens INSERT denied';
    END;

    -- UPDATE
    BEGIN
        UPDATE public.apple_tokens
        SET refresh_token = 'temporary-test-token';

        RAISE EXCEPTION 'FAIL: apple_tokens UPDATE allowed'
            USING ERRCODE = 'P0001';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens UPDATE denied';
    END;

    -- DELETE
    BEGIN
        DELETE FROM public.apple_tokens;

        RAISE EXCEPTION 'FAIL: apple_tokens DELETE allowed'
            USING ERRCODE = 'P0001';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS: apple_tokens DELETE denied';
    END;
END $$;


-- ---------------------------------------------------------
-- 8. Roll back all temporary test data
-- ---------------------------------------------------------

RESET ROLE;

ROLLBACK;

SELECT 'RLS TEST SCRIPT COMPLETED - ALL CHANGES ROLLED BACK'
AS result;