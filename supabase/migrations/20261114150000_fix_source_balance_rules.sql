CREATE OR REPLACE FUNCTION private.guard_source()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtextextended(NEW.user_id::TEXT, 1)
        );

        SELECT COUNT(*)
        INTO v_count
        FROM public.financial_sources
        WHERE user_id = NEW.user_id;

        IF v_count >= 50 THEN
            RAISE EXCEPTION 'WPT_SOURCE_LIMIT';
        END IF;

        NEW.current_amount := NEW.opening_amount;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.type IS DISTINCT FROM OLD.type
           OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'WPT_TYPE_LOCKED';
        END IF;

        IF NEW.opening_amount IS DISTINCT FROM OLD.opening_amount THEN
            NEW.current_amount :=
                OLD.current_amount
                + (NEW.opening_amount - OLD.opening_amount);

            IF NEW.current_amount > 9999999999.99 THEN
                RAISE EXCEPTION 'WPT_BAL_MAX';
            ELSIF NEW.current_amount < -9999999999.99 THEN
                RAISE EXCEPTION 'WPT_BAL_MIN';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

ALTER TABLE public.financial_sources
DROP CONSTRAINT IF EXISTS sources_card_outstanding;
