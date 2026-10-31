-- =========================================================
-- Migration 003: Guard Functions
-- =========================================================

-- 1. GUARD SOURCE
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


-- 2. GUARD TAG
CREATE OR REPLACE FUNCTION private.guard_tag()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtextextended(
                NEW.user_id::TEXT || ':' || NEW.type, 2
            )
        );

        SELECT COUNT(*)
        INTO v_count
        FROM public.tags
        WHERE user_id = NEW.user_id
          AND type = NEW.type;

        IF v_count >= 100 THEN
            RAISE EXCEPTION 'WPT_TAG_LIMIT';
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.type IS DISTINCT FROM OLD.type
           OR NEW.user_id IS DISTINCT FROM OLD.user_id
           OR NEW.is_others IS DISTINCT FROM OLD.is_others
           OR NEW.is_default IS DISTINCT FROM OLD.is_default THEN
            RAISE EXCEPTION 'WPT_TYPE_LOCKED';
        END IF;

        IF OLD.is_others
           AND NEW.name IS DISTINCT FROM OLD.name THEN
            RAISE EXCEPTION 'WPT_OTHERS_PROTECTED';
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_others
           AND COALESCE(
               pg_catalog.current_setting('wpt.account_delete', TRUE),
               'off'
           ) <> 'on' THEN
            RAISE EXCEPTION 'WPT_OTHERS_PROTECTED';
        END IF;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;


-- 3. GUARD TRANSACTION
CREATE OR REPLACE FUNCTION private.guard_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_source_archived BOOLEAN;
    v_to_source_archived BOOLEAN;
    v_utc_today DATE;
BEGIN
    IF TG_OP = 'UPDATE' THEN

        IF NEW.type IS DISTINCT FROM OLD.type
           OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'WPT_TYPE_LOCKED';
        END IF;

        IF OLD.type = 'adjustment' THEN
            IF NEW.id IS DISTINCT FROM OLD.id
               OR NEW.amount IS DISTINCT FROM OLD.amount
               OR NEW.txn_date IS DISTINCT FROM OLD.txn_date
               OR NEW.source_id IS DISTINCT FROM OLD.source_id
               OR NEW.to_source_id IS DISTINCT FROM OLD.to_source_id
               OR NEW.tag_id IS DISTINCT FROM OLD.tag_id
               OR NEW.description IS DISTINCT FROM OLD.description
               OR NEW.is_special IS DISTINCT FROM OLD.is_special
               OR NEW.created_at IS DISTINCT FROM OLD.created_at
               OR NEW.updated_at IS DISTINCT FROM OLD.updated_at THEN
                RAISE EXCEPTION 'WPT_ADJUST_LOCKED';
            END IF;
        END IF;

    END IF;

    IF TG_OP = 'INSERT' AND NEW.type = 'adjustment'
       AND COALESCE(
           pg_catalog.current_setting('wpt.adjust', TRUE), 'off'
       ) <> 'on' THEN
        RAISE EXCEPTION 'WPT_ADJUST_VIA_RPC';
    END IF;

    IF TG_OP = 'INSERT'
       OR NEW.txn_date IS DISTINCT FROM OLD.txn_date THEN

        v_utc_today :=
            (pg_catalog.now() AT TIME ZONE 'UTC')::DATE;

        IF NEW.txn_date > v_utc_today + 1 THEN
            RAISE EXCEPTION 'WPT_DATE_FUTURE';
        END IF;
    END IF;

    IF TG_OP = 'INSERT'
       OR NEW.source_id IS DISTINCT FROM OLD.source_id
       OR NEW.to_source_id IS DISTINCT FROM OLD.to_source_id THEN

        SELECT is_archived
        INTO v_source_archived
        FROM public.financial_sources
        WHERE id = NEW.source_id
          AND user_id = NEW.user_id;

        IF COALESCE(v_source_archived, TRUE) THEN
            RAISE EXCEPTION 'WPT_SOURCE_UNAVAILABLE';
        END IF;

        IF NEW.to_source_id IS NOT NULL THEN
            SELECT is_archived
            INTO v_to_source_archived
            FROM public.financial_sources
            WHERE id = NEW.to_source_id
              AND user_id = NEW.user_id;

            IF COALESCE(v_to_source_archived, TRUE) THEN
                RAISE EXCEPTION 'WPT_SOURCE_UNAVAILABLE';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


-- 4. CREATE GUARD TRIGGERS
CREATE TRIGGER financial_sources_guard
BEFORE INSERT OR UPDATE ON public.financial_sources
FOR EACH ROW
EXECUTE FUNCTION private.guard_source();

CREATE TRIGGER tags_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION private.guard_tag();

CREATE TRIGGER transactions_guard
BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION private.guard_transaction();