import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
console.log("✅ Route contact chargée");

// Soumission d'un message client (depuis MonEspace)
router.post("/submit", async (req, res) => {
  try {
    const { nom, email, telephone, type, sujet, message, commercial_id, centre_id } = req.body;

    if (!nom || !email || !message) {
      return res.status(400).json({ error: "Champs obligatoires manquants (nom, email, message)" });
    }

    const { error } = await supabase.from("contacts").insert({
      nom,
      email,
      telephone:     telephone     || null,
      type:          type          || "particulier",
      sujet:         sujet         || null,
      message,
      statut:        "nouveau",
      commercial_id: commercial_id || null,
      centre_id:     centre_id     || null,
    });

    if (error) {
      console.error("Erreur Supabase contact :", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Message de contact enregistré" });
  } catch (err) {
    console.error("Erreur serveur contact :", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Messages reçus — filtrés par commercial_id (commercial) ou scope centre (manager/responsable)
router.get("/mes-clients", authenticateAdmin, async (req, res) => {
  try {
    const scope = req.profil?.scope || [];
    const isNational = scope.includes("national") || req.role === "super_admin";
    const isCommercial = req.role === "commercial";

    let query = supabase
      .from("contacts")
      .select("id, nom, email, telephone, type, sujet, message, statut, centre_id, commercial_id, created_at");

    if (isNational) {
      // Super admin / national : tout voir
    } else if (isCommercial) {
      // Commercial : uniquement SES contacts (par commercial_id)
      query = query.eq("commercial_id", req.user.id);
    } else if (scope.length > 0) {
      // Manager / responsable : tous les contacts du centre
      query = query.in("centre_id", scope);
    } else {
      return res.json({ contacts: [] });
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ contacts: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Changer le statut d'un message (lu, traité, en_cours)
router.patch("/:id/statut", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    if (!["nouveau", "lu", "en_cours", "traité"].includes(statut)) {
      return res.status(400).json({ error: "Statut invalide" });
    }
    const { error } = await supabase
      .from("contacts")
      .update({ statut })
      .eq("id", id)
      .eq("commercial_id", req.user?.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Statut mis à jour" });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;
