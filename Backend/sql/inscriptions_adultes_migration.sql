-- ══════════════════════════════════════════════════════════════
-- TABLE inscriptions_adultes — Demandes de cours adultes
-- À exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.inscriptions_adultes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_complet     TEXT        NOT NULL,
  email           TEXT,
  telephone       TEXT        NOT NULL,
  date_naissance  DATE,
  offre_id        UUID,
  offre_titre     TEXT,
  mode_paiement   TEXT,
  niveau_detecte  TEXT,
  statut          TEXT        NOT NULL DEFAULT 'nouveau',
  commercial_id   UUID,
  centre_id       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Colonnes manquantes (si table déjà existante)
ALTER TABLE public.inscriptions_adultes ADD COLUMN IF NOT EXISTS date_naissance  DATE;
ALTER TABLE public.inscriptions_adultes ADD COLUMN IF NOT EXISTS offre_id        UUID;
ALTER TABLE public.inscriptions_adultes ADD COLUMN IF NOT EXISTS offre_titre     TEXT;
ALTER TABLE public.inscriptions_adultes ADD COLUMN IF NOT EXISTS mode_paiement   TEXT;
ALTER TABLE public.inscriptions_adultes ADD COLUMN IF NOT EXISTS niveau_detecte  TEXT;
ALTER TABLE public.inscriptions_adultes ADD COLUMN IF NOT EXISTS statut          TEXT NOT NULL DEFAULT 'nouveau';
ALTER TABLE public.inscriptions_adultes ADD COLUMN IF NOT EXISTS commercial_id   UUID;
ALTER TABLE public.inscriptions_adultes ADD COLUMN IF NOT EXISTS centre_id       TEXT;

-- Index
CREATE INDEX IF NOT EXISTS idx_inscr_adultes_email     ON public.inscriptions_adultes(email);
CREATE INDEX IF NOT EXISTS idx_inscr_adultes_statut    ON public.inscriptions_adultes(statut);
CREATE INDEX IF NOT EXISTS idx_inscr_adultes_created   ON public.inscriptions_adultes(created_at DESC);

-- Désactiver RLS pour accès backend service_role
ALTER TABLE public.inscriptions_adultes DISABLE ROW LEVEL SECURITY;
