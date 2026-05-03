import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
console.log("✅ Route centres chargée");

// Liste publique des centres actifs (pour les formulaires frontend)
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("centres")
      .select("id, nom, ville, adresse, telephone, email")
      .eq("actif", true)
      .order("ville");
    if (error) return res.status(500).json({ error: error.message });
    res.json({ centres: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Détail d'un centre (dashboard)
router.get("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("centres")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: "Centre introuvable" });
    res.json({ centre: data });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;
