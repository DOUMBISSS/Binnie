import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// ── Public : photos actives pour l'Accueil ──────────────────
router.get("/publics", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("equipe_photos")
      .select("id, photo_url, nom, titre, ordre")
      .eq("actif", true)
      .order("ordre", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin : liste complète ───────────────────────────────────
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("equipe_photos")
      .select("*")
      .order("ordre", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin : ajouter une photo ────────────────────────────────
router.post("/", authenticateAdmin, async (req, res) => {
  const { photo_url, nom, titre, ordre } = req.body;
  if (!photo_url) return res.status(400).json({ error: "photo_url requis" });
  try {
    const { data, error } = await supabase
      .from("equipe_photos")
      .insert({ photo_url, nom: nom || null, titre: titre || null, ordre: ordre || 0, actif: true })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin : modifier (nom, titre, actif, ordre) ──────────────
router.patch("/:id", authenticateAdmin, async (req, res) => {
  const allowed = ["photo_url", "nom", "titre", "ordre", "actif"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  try {
    const { data, error } = await supabase
      .from("equipe_photos")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin : supprimer ────────────────────────────────────────
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from("equipe_photos").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
