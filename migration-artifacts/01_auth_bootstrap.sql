-- Plain Postgres auth stub (GoTrue-compatible subset) for Vee Care
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS extensions;

-- Install extensions into the extensions schema (schema migrations call extensions.uuid_generate_v4()).
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS "pgcrypto";
CREATE EXTENSION "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  aud text,
  role text,
  email text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  recovery_token text,
  recovery_sent_at timestamptz,
  email_change_token_new text,
  email_change text,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  is_super_admin boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  phone text,
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token text,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz,
  email_change_token_current text,
  email_change_confirm_status smallint,
  banned_until timestamptz,
  reauthentication_token text,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamptz,
  is_anonymous boolean DEFAULT false
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.role', true), '');
$$;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

-- Stub Supabase roles so GRANT/POLICY statements in migrations succeed.
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT USAGE ON SCHEMA auth TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.jwt() TO PUBLIC;
