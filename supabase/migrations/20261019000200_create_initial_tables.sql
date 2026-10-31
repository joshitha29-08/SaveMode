-- =========================================================
-- Migration 002: SaveMode Initial Tables
-- =========================================================

-- 1. USER SETTINGS
CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE RESTRICT,

    name TEXT
        CHECK (name IS NULL OR char_length(name) BETWEEN 1 AND 160),

    currency_code TEXT CHECK (
        currency_code IN (
            'INR','USD','EUR','GBP','JPY','BDT','SGD','AUD',
            'CAD','MYR','LKR','NPR','AED','SAR','QAR','KWD',
            'OMR','CHF'
        )
    ),

    theme TEXT NOT NULL DEFAULT 'system'
        CHECK (theme IN ('system','light','dark')),

    chart_type TEXT NOT NULL DEFAULT 'bar'
        CHECK (chart_type IN ('bar','pie')),

    last_source_id UUID,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    notif_daily_on BOOLEAN NOT NULL DEFAULT FALSE,
    notif_daily_time TIME NOT NULL DEFAULT '21:00',
    notif_monthly_on BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_card_dismissed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT settings_onboarding_complete
        CHECK (
            NOT onboarding_completed
            OR (name IS NOT NULL AND currency_code IS NOT NULL)
        )
);

CREATE TRIGGER user_settings_set_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();


-- 2. FINANCIAL SOURCES
CREATE TABLE public.financial_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users(id) ON DELETE RESTRICT,

    type TEXT NOT NULL
        CHECK (type IN ('bank','cash','card')),

    name TEXT NOT NULL
        CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),

    opening_amount NUMERIC(14,2) NOT NULL,
    current_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    credit_limit NUMERIC(14,2),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,

    available_credit NUMERIC(14,2)
        GENERATED ALWAYS AS (credit_limit - current_amount) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT financial_sources_user_id_id_unique
        UNIQUE (user_id, id),

    CONSTRAINT sources_opening_range
        CHECK (
            opening_amount BETWEEN -9999999999.99 AND 9999999999.99
        ),

    CONSTRAINT sources_opening_sign
        CHECK (type = 'bank' OR opening_amount >= 0),

    CONSTRAINT sources_card_limit
        CHECK (
            (type = 'card') = (credit_limit IS NOT NULL)
            AND (
                credit_limit IS NULL
                OR credit_limit BETWEEN 0.01 AND 9999999999.99
            )
        ),

    CONSTRAINT sources_current_range
        CHECK (
            current_amount BETWEEN -9999999999.99 AND 9999999999.99
        ),

    CONSTRAINT sources_card_outstanding
        CHECK (type <> 'card' OR current_amount >= 0)
);

CREATE UNIQUE INDEX financial_sources_unique_name
ON public.financial_sources (user_id, lower(btrim(name)));

ALTER TABLE public.user_settings
ADD CONSTRAINT settings_last_source_fkey
FOREIGN KEY (user_id, last_source_id)
REFERENCES public.financial_sources (user_id, id)
ON DELETE SET NULL (last_source_id);

CREATE TRIGGER financial_sources_set_updated_at
BEFORE UPDATE ON public.financial_sources
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();


-- 3. TAGS
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users(id) ON DELETE RESTRICT,

    type TEXT NOT NULL
        CHECK (type IN ('income','expense')),

    name TEXT NOT NULL
        CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),

    colour TEXT NOT NULL
        CHECK (char_length(colour) BETWEEN 1 AND 32),

    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_others BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    CONSTRAINT tags_user_id_id_type_unique
        UNIQUE (user_id, id, type)
);

CREATE UNIQUE INDEX tags_unique_name
ON public.tags (user_id, type, lower(btrim(name)));

CREATE UNIQUE INDEX tags_one_others_per_type
ON public.tags (user_id, type)
WHERE is_others = TRUE;


-- 4. TRANSACTIONS
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users(id) ON DELETE RESTRICT,

    type TEXT NOT NULL
        CHECK (type IN ('income','expense','transfer','adjustment')),

    amount NUMERIC(14,2) NOT NULL,

    txn_date DATE NOT NULL
        CHECK (txn_date >= DATE '2000-01-01'),

    source_id UUID NOT NULL,
    to_source_id UUID,
    tag_id UUID,

    tag_type TEXT GENERATED ALWAYS AS (
        CASE
            WHEN type IN ('income','expense') THEN type
            ELSE NULL
        END
    ) STORED,

    description TEXT
        CHECK (description IS NULL OR char_length(description) <= 400),

    is_special BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT transactions_amount_check
        CHECK (
            (
                type <> 'adjustment'
                AND amount > 0
                AND amount <= 9999999999.99
            )
            OR (
                type = 'adjustment'
                AND amount <> 0
                AND abs(amount) <= 19999999999.98
            )
        ),

    CONSTRAINT transactions_shape_check
        CHECK (
            (
                type IN ('income','expense')
                AND tag_id IS NOT NULL
                AND to_source_id IS NULL
            )
            OR (
                type = 'transfer'
                AND to_source_id IS NOT NULL
                AND tag_id IS NULL
            )
            OR (
                type = 'adjustment'
                AND tag_id IS NULL
                AND to_source_id IS NULL
            )
        ),

    CONSTRAINT transactions_different_sources
        CHECK (to_source_id IS NULL OR to_source_id <> source_id),

    CONSTRAINT transactions_special_expense_only
        CHECK (NOT is_special OR type = 'expense'),

    CONSTRAINT transactions_source_fk
        FOREIGN KEY (user_id, source_id)
        REFERENCES public.financial_sources(user_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT transactions_to_source_fk
        FOREIGN KEY (user_id, to_source_id)
        REFERENCES public.financial_sources(user_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT transactions_tag_fk
        FOREIGN KEY (user_id, tag_id, tag_type)
        REFERENCES public.tags(user_id, id, type)
        ON DELETE RESTRICT
);

CREATE INDEX transactions_user_date_idx
ON public.transactions (user_id, txn_date DESC, created_at DESC, id DESC);

CREATE INDEX transactions_source_idx
ON public.transactions (user_id, source_id);

CREATE INDEX transactions_to_source_idx
ON public.transactions (user_id, to_source_id)
WHERE to_source_id IS NOT NULL;

CREATE INDEX transactions_tag_idx
ON public.transactions (user_id, tag_id)
WHERE tag_id IS NOT NULL;

CREATE TRIGGER transactions_set_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();


-- 5. APPLE TOKENS
CREATE TABLE public.apple_tokens (
    user_id UUID PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE RESTRICT,

    refresh_token TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- 6. GRANTS
-- =========================================================

REVOKE ALL ON
    public.user_settings,
    public.financial_sources,
    public.tags,
    public.transactions,
    public.apple_tokens
FROM anon, authenticated;

GRANT SELECT ON
    public.user_settings,
    public.financial_sources,
    public.tags,
    public.transactions
TO authenticated;

GRANT UPDATE (
    name,
    currency_code,
    theme,
    chart_type,
    onboarding_completed,
    notif_daily_on,
    notif_daily_time,
    notif_monthly_on,
    reminder_card_dismissed
)
ON public.user_settings TO authenticated;

GRANT INSERT (id, type, name, opening_amount, credit_limit),
      UPDATE (name, opening_amount, credit_limit, is_archived),
      DELETE
ON public.financial_sources TO authenticated;

GRANT INSERT (id, type, name, colour),
      UPDATE (name, colour),
      DELETE
ON public.tags TO authenticated;

GRANT INSERT (
    id, type, amount, txn_date, source_id,
    to_source_id, tag_id, description, is_special
),
UPDATE (
    amount, txn_date, source_id,
    to_source_id, tag_id, description, is_special
),
DELETE
ON public.transactions TO authenticated;


-- =========================================================
-- 7. ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apple_tokens ENABLE ROW LEVEL SECURITY;


-- USER SETTINGS: SELECT + UPDATE only
CREATE POLICY user_settings_select
ON public.user_settings
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_settings_update
ON public.user_settings
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));


-- FINANCIAL SOURCES
CREATE POLICY financial_sources_select
ON public.financial_sources
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY financial_sources_insert
ON public.financial_sources
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY financial_sources_update
ON public.financial_sources
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY financial_sources_delete
ON public.financial_sources
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));


-- TAGS
CREATE POLICY tags_select
ON public.tags
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY tags_insert
ON public.tags
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY tags_update
ON public.tags
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY tags_delete
ON public.tags
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));


-- TRANSACTIONS
CREATE POLICY transactions_select
ON public.transactions
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY transactions_insert
ON public.transactions
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY transactions_update
ON public.transactions
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY transactions_delete
ON public.transactions
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));