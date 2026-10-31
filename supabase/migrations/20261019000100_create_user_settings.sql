-- =====================================================================
-- Table 1: user_settings
-- PRD: Section 8, ONB-01, ONB-07, NOT-01, CUR01, DASH03, SET03
-- =====================================================================

CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE RESTRICT,

    name TEXT NOT NULL DEFAULT '',
    currency_code TEXT NOT NULL DEFAULT 'INR',
    theme TEXT NOT NULL DEFAULT 'system',
    chart_type TEXT NOT NULL DEFAULT 'donut',
    last_source_id UUID,

    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    notif_daily_on BOOLEAN NOT NULL DEFAULT FALSE,
    notif_daily_time TIME NOT NULL DEFAULT '21:00',
    notif_monthly_on BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_card_dismissed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Name validation
    CONSTRAINT user_settings_name_length
        CHECK (char_length(btrim(name)) <= 160),

    CONSTRAINT user_settings_name_no_linebreak
        CHECK (name !~ E'[\r\n]'),

    CONSTRAINT user_settings_name_required_after_onboarding
        CHECK (
            NOT onboarding_completed
            OR char_length(btrim(name)) >= 1
        ),

    -- Supported currencies
    CONSTRAINT user_settings_currency_check
        CHECK (
            currency_code IN (
                'INR', 'USD', 'EUR', 'GBP', 'JPY', 'BDT',
                'SGD', 'AUD', 'CAD', 'MYR', 'LKR', 'NPR',
                'AED', 'SAR', 'QAR', 'KWD', 'OMR', 'CHF'
            )
        ),

    -- Theme validation
    CONSTRAINT user_settings_theme_check
        CHECK (theme IN ('system', 'light', 'dark')),

    -- Dashboard chart validation
    CONSTRAINT user_settings_chart_type_check
        CHECK (chart_type IN ('donut', 'bar'))
);

-- =====================================================================
-- Automatically update updated_at
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER user_settings_set_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- Automatically create settings when a new user signs up
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.user_settings (user_id, name)
    VALUES (
        NEW.id,
        LEFT(
            BTRIM(
                REGEXP_REPLACE(
                    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
                    E'[\r\n]+',
                    ' ',
                    'g'
                )
            ),
            40
        )
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- Row Level Security
-- =====================================================================

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own settings"
    ON public.user_settings
    FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================================
-- Realtime
-- =====================================================================

ALTER PUBLICATION supabase_realtime
    ADD TABLE public.user_settings;