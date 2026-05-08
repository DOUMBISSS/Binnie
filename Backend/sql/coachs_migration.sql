-- Migration : ajout des colonnes d'affichage à la table coachs
-- À exécuter dans Supabase SQL Editor

ALTER TABLE coachs
  ADD COLUMN IF NOT EXISTS nom    TEXT,
  ADD COLUMN IF NOT EXISTS prenom TEXT,
  ADD COLUMN IF NOT EXISTS grade  TEXT DEFAULT 'Coach';
