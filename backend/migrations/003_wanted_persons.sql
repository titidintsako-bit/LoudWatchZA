-- Migration 003: Wanted Persons & Missing Persons
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS wanted_persons (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name      TEXT NOT NULL,
  photo_url      TEXT,
  crime_category TEXT,
  charges        TEXT,
  last_known_location TEXT,
  province       TEXT,
  lat            DOUBLE PRECISION,
  lng            DOUBLE PRECISION,
  case_number    TEXT,
  station        TEXT,
  is_missing     BOOLEAN NOT NULL DEFAULT FALSE,
  date_added     TIMESTAMPTZ DEFAULT NOW(),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  source_url     TEXT,
  scrape_key     TEXT UNIQUE,  -- dedup key: sha256(full_name + case_number)
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wanted_province  ON wanted_persons (province);
CREATE INDEX IF NOT EXISTS idx_wanted_category  ON wanted_persons (crime_category);
CREATE INDEX IF NOT EXISTS idx_wanted_active    ON wanted_persons (is_active);
CREATE INDEX IF NOT EXISTS idx_wanted_missing   ON wanted_persons (is_missing);
CREATE INDEX IF NOT EXISTS idx_wanted_added     ON wanted_persons (date_added DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_wanted_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_wanted_updated_at ON wanted_persons;
CREATE TRIGGER trg_wanted_updated_at
  BEFORE UPDATE ON wanted_persons
  FOR EACH ROW EXECUTE FUNCTION update_wanted_updated_at();

-- Row-level security: public read, service-role write
ALTER TABLE wanted_persons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'wanted_persons' AND policyname = 'wanted_public_select'
  ) THEN
    CREATE POLICY wanted_public_select ON wanted_persons FOR SELECT USING (true);
  END IF;
END $$;
