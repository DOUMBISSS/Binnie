-- Migration : table offre_media
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS offre_media (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offre_type TEXT NOT NULL,        -- 'en-ligne' | 'cabinet' | 'domicile' | 'toeic' | 'toefl' | 'ielts'
  type       TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('image','video')),
  url        TEXT NOT NULL,
  titre      TEXT DEFAULT '',
  ordre      INTEGER NOT NULL DEFAULT 0,
  actif      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offre_media_lookup ON offre_media (offre_type, actif, ordre);
