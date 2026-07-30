-- Minimal storage schema so supabase/migrations INSERT/POLICY statements succeed.
-- Runtime file I/O uses disk via lib/db/storage.ts (STORAGE_ROOT), not these tables.

CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[],
  owner_id text
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[],
  version text,
  owner_id text,
  user_metadata jsonb
);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA storage TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage TO PUBLIC;
