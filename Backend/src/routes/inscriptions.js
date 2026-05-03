// routes/inscriptions.js
import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

console.log("✅ Route inscriptions chargée");

// ── Adultes (18+) ─────────────────────────────────────────────
router.post("/adulte/submit", async (req, res) => {
  try {
    const { nom_complet, email, telephone, date_naissance, offre_id, offre_titre, mode_paiement, niveau_detecte, statut, commercial_id, centre_id } = req.body;

    if (!nom_complet || !email || !telephone) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    const { error } = await supabase.from("inscriptions_adultes").insert({
      nom_complet,
      email,
      telephone,
      date_naissance:  date_naissance  || null,
      offre_id:        offre_id        || null,
      offre_titre:     offre_titre     || null,
      mode_paiement:   mode_paiement   || null,
      niveau_detecte:  niveau_detecte  || null,
      commercial_id:   commercial_id   || null,
      centre_id:       centre_id       || null,
      statut:          statut          || "nouveau",
    });

    if (error) {
      console.error("Erreur Supabase inscription adulte :", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Inscription adulte enregistrée" });
  } catch (err) {
    console.error("Erreur serveur inscription adulte :", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── Enfants (3-17 ans) ────────────────────────────────────────
router.post("/enfant/submit", async (req, res) => {
  try {
    const { prenom_enfant, nom_enfant, date_naissance, tranche_age, nom_parent, email_parent, telephone_parent, tel_parent, adresse, notes, commercial_id, statut, centre_id } = req.body;
    const telephone = telephone_parent || tel_parent;

    if (!prenom_enfant || !nom_enfant || !nom_parent || !email_parent || !telephone) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    const { error } = await supabase.from("inscriptions_enfants").insert({
      prenom_enfant,
      nom_enfant,
      date_naissance:   date_naissance || null,
      tranche_age:      tranche_age    || null,
      nom_parent,
      email_parent,
      telephone_parent: telephone,
      adresse:          adresse        || null,
      notes:            notes          || null,
      commercial_id:    commercial_id  || null,
      centre_id:        centre_id      || null,
      statut:           statut         || "nouveau",
    });

    if (error) {
      console.error("Erreur Supabase inscription enfant :", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Inscription enfant enregistrée" });
  } catch (err) {
    console.error("Erreur serveur inscription enfant :", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── Étudiants (18-25 ans) ─────────────────────────────────────
router.post("/etudiant/submit", async (req, res) => {
  try {
    const { prenom, nom, date_naissance, email, telephone, etablissement, filiere, annee_etudes, notes, consentement_donnees, centre_id } = req.body;

    if (!prenom || !nom || !email || !telephone) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    if (!consentement_donnees) {
      return res.status(400).json({ error: "Consentement requis" });
    }

    const { error } = await supabase.from("inscriptions_etudiants").insert({
      prenom,
      nom,
      date_naissance:      date_naissance      || null,
      email,
      telephone,
      etablissement:       etablissement       || null,
      filiere:             filiere             || null,
      annee_etudes:        annee_etudes        || null,
      notes:               notes               || null,
      consentement_donnees: consentement_donnees,
      centre_id:           centre_id           || null,
      statut:              "nouveau",
    });

    if (error) {
      console.error("Erreur Supabase inscription étudiant :", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Inscription étudiant enregistrée" });
  } catch (err) {
    console.error("Erreur serveur inscription étudiant :", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── Lister toutes les inscriptions (dashboard, filtrées par scope) ──
router.get("/all", authenticateAdmin, async (req, res) => {
  try {
    const scope = req.profil?.scope || [];
    const isNational = scope.includes("national") || req.role === "super_admin";

    const applyScope = (q) => (!isNational && scope.length > 0) ? q.in("centre_id", scope) : q;

    const [adultes, enfants, etudiants] = await Promise.all([
      applyScope(supabase.from("inscriptions_adultes").select("id, nom_complet, email, telephone, offre_titre, statut, centre_id, commercial_id, created_at").order("created_at", { ascending: false })),
      applyScope(supabase.from("inscriptions_enfants").select("id, prenom_enfant, nom_enfant, nom_parent, email_parent, telephone_parent, statut, centre_id, commercial_id, created_at").order("created_at", { ascending: false })),
      applyScope(supabase.from("inscriptions_etudiants").select("id, prenom, nom, email, telephone, etablissement, statut, centre_id, created_at").order("created_at", { ascending: false })),
    ]);

    if (adultes.error)   return res.status(500).json({ error: adultes.error.message });
    if (enfants.error)   return res.status(500).json({ error: enfants.error.message });
    if (etudiants.error) return res.status(500).json({ error: etudiants.error.message });

    res.json({
      adultes:   adultes.data   || [],
      enfants:   enfants.data   || [],
      etudiants: etudiants.data || [],
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;
