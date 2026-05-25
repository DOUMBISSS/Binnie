import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";
import { logAudit } from "../middlewares/logAudit.js";

const router = express.Router();
console.log("✅ Route paiements chargée");

const TABLE = "paiements_parcours";
const FIELDS = "id, commercial_id, client, email, telephone, inscription, montant_du, montant_recu, date_paiement, mode_paiement, statut, ref_transaction, notes, assignation_id, preuve_image, created_at";

// ── POST /submit ──────────────────────────────────────────────
router.post("/submit", authenticateAdmin, async (req, res) => {
  try {
    const {
      client, email, telephone, offre, inscription,
      montant_du, montant_recu, date_paiement,
      mode_paiement, statut, ref_transaction, notes, assignation_id,
      // compat anciens noms
      date, mode, montantDu, montantRecu,
    } = req.body;

    if (!client?.trim()) {
      return res.status(400).json({ error: "Le nom du client est obligatoire" });
    }

    // Encode offre dans inscription : "offre::Anglais Pro B2||Parcours BET · En ligne"
    const inscriptionFull = [
      offre ? `offre::${offre.trim()}` : null,
      inscription?.trim() || null,
    ].filter(Boolean).join("||") || null;

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        commercial_id:   req.user.id,
        client:          client.trim(),
        email:           email?.trim()           || null,
        telephone:       telephone?.trim()       || null,
        inscription:     inscriptionFull,
        montant_du:      montant_du   ?? montantDu  ?? 0,
        montant_recu:    montant_recu ?? montantRecu ?? 0,
        date_paiement:   date_paiement || date   || new Date().toISOString().slice(0, 10),
        mode_paiement:   mode_paiement || mode   || "Mobile Money",
        statut:          statut                  || "en_attente",
        ref_transaction: ref_transaction?.trim() || null,
        notes:           notes?.trim()           || null,
        assignation_id:  assignation_id          || null,
        preuve_image:    req.body.preuve_image   || null,
      })
      .select(FIELDS)
      .single();

    if (error) {
      console.error("Erreur paiement insert:", error);
      return res.status(500).json({ error: error.message });
    }

    logAudit({
      acteur_id:    req.user?.id,
      acteur_nom:   req.profil ? `${req.profil.prenom} ${req.profil.nom}` : null,
      acteur_email: req.profil?.email || req.user?.email,
      acteur_role:  req.role || "commercial",
      action_type:  "PAIEMENT_CREATED",
      module:       "paiements",
      entite_type:  "paiement",
      entite_id:    data.id,
      detail:       `Paiement enregistré pour ${client.trim()} — montant reçu : ${data.montant_recu} (statut : ${data.statut})`,
      ip_address:   req.headers["x-forwarded-for"] || req.ip || null,
      user_agent:   req.headers["user-agent"] || null,
      statut:       "success",
    }).catch(() => {});

    res.status(201).json({ message: "Paiement enregistré", paiement: data });
  } catch (err) {
    console.error("Erreur serveur paiement:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── PATCH /:id ────────────────────────────────────────────────
router.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const allowed = ["client","email","telephone","montant_du","montant_recu","date_paiement","mode_paiement","statut","ref_transaction","notes","assignation_id","preuve_image"];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    // Encoder offre dans inscription si présent
    if (req.body.offre !== undefined || req.body.inscription !== undefined) {
      const offre = req.body.offre?.trim() || null;
      const insc  = req.body.inscription?.trim() || null;
      updates.inscription = [
        offre ? `offre::${offre}` : null,
        insc || null,
      ].filter(Boolean).join("||") || null;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq("id", req.params.id)
      .eq("commercial_id", req.user.id)
      .select(FIELDS)
      .single();

    if (error) return res.status(500).json({ error: error.message });

    logAudit({
      acteur_id:    req.user?.id,
      acteur_nom:   req.profil ? `${req.profil.prenom} ${req.profil.nom}` : null,
      acteur_email: req.profil?.email || req.user?.email,
      acteur_role:  req.role || "commercial",
      action_type:  "PAIEMENT_UPDATED",
      module:       "paiements",
      entite_type:  "paiement",
      entite_id:    req.params.id,
      detail:       `Paiement ${req.params.id} mis à jour — champs : ${Object.keys(updates).join(", ")}`,
      ip_address:   req.headers["x-forwarded-for"] || req.ip || null,
      user_agent:   req.headers["user-agent"] || null,
      statut:       "success",
    }).catch(() => {});

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── DELETE /:id ───────────────────────────────────────────────
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", req.params.id)
      .eq("commercial_id", req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Paiement supprimé" });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── GET /mes-paiements ────────────────────────────────────────
router.get("/mes-paiements", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select(FIELDS)
      .eq("commercial_id", req.user.id)
      .order("date_paiement", { ascending: false });

    if (error) {
      console.error("Erreur mes-paiements:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ paiements: data || [] });
  } catch (err) {
    console.error("Erreur serveur mes-paiements:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── GET /all ──────────────────────────────────────────────────
// Super admin / admin / manager → tous les paiements
// Autres rôles → uniquement leurs propres paiements
router.get("/all", authenticateAdmin, async (req, res) => {
  try {
    const ROLES_GLOBAUX = ["super_admin", "admin", "manager", "responsable", "gestionnaire", "comptable", "superviseur"];
    const isGlobal = ROLES_GLOBAUX.includes(req.role);

    let q = supabase.from(TABLE).select(FIELDS).order("date_paiement", { ascending: false });
    if (!isGlobal) q = q.eq("commercial_id", req.user.id);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    // Résoudre les noms des commerciaux via la table utilisateurs
    const commercialIds = [...new Set((data || []).map(p => p.commercial_id).filter(Boolean))];
    let commercialMap = {};
    if (commercialIds.length > 0) {
      const { data: users } = await supabase
        .from("utilisateurs")
        .select("id, prenom, nom")
        .in("id", commercialIds);
      (users || []).forEach(u => {
        commercialMap[u.id] = `${u.prenom || ""} ${u.nom || ""}`.trim();
      });
    }

    const paiements = (data || []).map(p => ({
      ...p,
      commercial_nom: commercialMap[p.commercial_id] || "—",
    }));

    res.json({ paiements });
  } catch (err) {
    console.error("Erreur /paiements/all:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── GET /assignation/:id ──────────────────────────────────────
// Versements liés à une assignation spécifique (PA, commercial, admin)
router.get("/assignation/:id", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select(FIELDS)
      .eq("assignation_id", req.params.id)
      .order("date_paiement", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ paiements: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;
