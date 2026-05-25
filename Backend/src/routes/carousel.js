import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// ── Public : slides actives ─────────────────────────────────────────────────
router.get("/publiques", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("carousel_slides")
      .select("id, type, url, titre, description, link_url, link_label, ordre")
      .eq("actif", true)
      .order("ordre", { ascending: true });
    if (error) throw error;
    res.json({ slides: data || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin : liste complète ──────────────────────────────────────────────────
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("carousel_slides")
      .select("*")
      .order("ordre", { ascending: true });
    if (error) throw error;
    res.json({ slides: data || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin : création ────────────────────────────────────────────────────────
router.post("/", authenticateAdmin, async (req, res) => {
  try {
    const { type, url, titre, description, link_url, link_label, ordre, actif } = req.body;
    if (!url?.trim()) return res.status(400).json({ error: "L'URL est requise" });

    let nextOrdre = ordre != null ? Number(ordre) : 0;
    if (ordre == null) {
      const { data: last } = await supabase
        .from("carousel_slides")
        .select("ordre")
        .order("ordre", { ascending: false })
        .limit(1)
        .maybeSingle();
      nextOrdre = (last?.ordre ?? -1) + 1;
    }

    const { data, error } = await supabase
      .from("carousel_slides")
      .insert({
        type:        type || "image",
        url:         url.trim(),
        titre:       titre?.trim() || "",
        description: description?.trim() || "",
        link_url:    link_url?.trim() || "",
        link_label:  link_label?.trim() || "",
        ordre:       nextOrdre,
        actif:       actif !== false,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin : modification ────────────────────────────────────────────────────
router.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const allowed = ["type", "url", "titre", "description", "link_url", "link_label", "ordre", "actif"];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    if (updates.url)         updates.url         = updates.url.trim();
    if (updates.titre)       updates.titre       = updates.titre.trim();
    if (updates.description) updates.description = updates.description.trim();
    if (updates.link_url)    updates.link_url    = updates.link_url.trim();
    if (updates.link_label)  updates.link_label  = updates.link_label.trim();
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("carousel_slides")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin : suppression ─────────────────────────────────────────────────────
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from("carousel_slides")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Slide supprimée" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
