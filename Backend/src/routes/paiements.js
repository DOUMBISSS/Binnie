import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

console.log("✅ Route paiements chargée");

// Enregistrer un paiement
router.post("/submit", authenticateAdmin, async (req, res) => {
  try {
    const {
      client, email, inscription, montant_du, montant_recu,
      date, mode, statut, notes,
    } = req.body;

    if (!client) {
      return res.status(400).json({ error: "Le nom du client est obligatoire" });
    }

    const { data, error } = await supabase.from("paiements").insert({
      commercial_id: req.user.id,
      client,
      email:         email        || null,
      inscription:   inscription  || null,
      montant_du:    montant_du   || 0,
      montant_recu:  montant_recu || 0,
      date:          date         || new Date().toISOString().slice(0, 10),
      mode:          mode         || "Virement",
      statut:        statut       || "en_attente",
      notes:         notes        || null,
    }).select().single();

    if (error) {
      console.error("Erreur Supabase paiement :", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Paiement enregistré", paiement: data });
  } catch (err) {
    console.error("Erreur serveur paiement :", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Modifier un paiement
router.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { client, email, inscription, montant_du, montant_recu, date, mode, statut, notes } = req.body;

    const { error } = await supabase
      .from("paiements")
      .update({ client, email, inscription, montant_du, montant_recu, date, mode, statut, notes })
      .eq("id", id)
      .eq("commercial_id", req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Paiement mis à jour" });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Supprimer un paiement
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from("paiements")
      .delete()
      .eq("id", req.params.id)
      .eq("commercial_id", req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Paiement supprimé" });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Récupérer les paiements de la commerciale connectée
router.get("/mes-paiements", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("paiements")
      .select("id, client, email, inscription, montant_du, montant_recu, date, mode, statut, notes, created_at")
      .eq("commercial_id", req.user.id)
      .order("date", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ paiements: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;
