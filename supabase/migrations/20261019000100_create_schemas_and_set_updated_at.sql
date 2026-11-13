-- Migration 001: Create schemas and helper function

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.set_updated_at()
FROM PUBLIC, anon, authenticated;