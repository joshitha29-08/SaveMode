CREATE OR REPLACE FUNCTION private.setup_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Prevent simultaneous setup for the same user.
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_user_id::text, 1)
    );

    -- Step 1: Create user settings.
    INSERT INTO public.user_settings (user_id, currency_code, theme)
    VALUES (p_user_id, 'INR', 'system')
    ON CONFLICT (user_id) DO NOTHING;

    -- Step 2: Insert all 17 default tags if no tags exist.
    IF NOT EXISTS (
        SELECT 1
        FROM public.tags
        WHERE user_id = p_user_id
    ) THEN
        INSERT INTO public.tags
            (user_id, type, name, colour, is_default, is_others)
        VALUES
            (p_user_id, 'expense', 'Food', 'orange', TRUE, FALSE),
            (p_user_id, 'expense', 'Groceries', 'green', TRUE, FALSE),
            (p_user_id, 'expense', 'Rent', 'brown', TRUE, FALSE),
            (p_user_id, 'expense', 'EMI', 'purple', TRUE, FALSE),
            (p_user_id, 'expense', 'Recharge', 'cyan', TRUE, FALSE),
            (p_user_id, 'expense', 'Fuel & Transport', 'blue', TRUE, FALSE),
            (p_user_id, 'expense', 'Bills', 'indigo', TRUE, FALSE),
            (p_user_id, 'expense', 'Shopping', 'pink', TRUE, FALSE),
            (p_user_id, 'expense', 'Health', 'red', TRUE, FALSE),
            (p_user_id, 'expense', 'Education', 'teal', TRUE, FALSE),
            (p_user_id, 'expense', 'Festivals & Gifts', 'gold', TRUE, FALSE),
            (p_user_id, 'expense', 'Others', 'grey', TRUE, TRUE),
            (p_user_id, 'income', 'Salary', 'green', TRUE, FALSE),
            (p_user_id, 'income', 'Business', 'teal', TRUE, FALSE),
            (p_user_id, 'income', 'Gift', 'gold', TRUE, FALSE),
            (p_user_id, 'income', 'Refund', 'blue', TRUE, FALSE),
            (p_user_id, 'income', 'Others', 'grey', TRUE, TRUE);
    END IF;

    -- Step 3: Recreate missing Others tags.
    INSERT INTO public.tags
        (user_id, type, name, colour, is_default, is_others)
    SELECT
        p_user_id, t.type, 'Others', 'grey', TRUE, TRUE
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