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

DO $$
DECLARE
    i INTEGER;
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

    -- 98 extra expense tags + 1 existing expense tag = 99
    FOR i IN 1..98 LOOP
        INSERT INTO public.tags
            (user_id, type, name, colour)
        VALUES (
            'bb65b43f-a85e-4098-be4f-307194966c8b',
            'expense',
            'Rule Test Tag ' || i,
            '#808080'
        );
    END LOOP;

    -- Temporary Others tag for protection tests
    INSERT INTO public.tags
        (user_id, type, name, colour, is_others)
    VALUES (
        'bb65b43f-a85e-4098-be4f-307194966c8b',
        'expense',
        'Rule Test Others',
        '#808080',
        TRUE
    );
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
        WHERE name = 'Rule Test Others'
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
        WHERE name = 'Rule Test Others'
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
            (user_id, type, name, opening_amount)
        VALUES (
            'bb65b43f-a85e-4098-be4f-307194966c8b',
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


-- ---------------------------------------------------------
-- 18. Roll back all temporary test data
-- ---------------------------------------------------------

RESET ROLE;

ROLLBACK;

SELECT 'TASK 5 RULE TESTS COMPLETED - ALL CHANGES ROLLED BACK'
AS result;