import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// ─── PRODUITS ────────────────────────────────────────────────────────────────

// GET /api/boutique/produits — tous les produits (public)
router.get("/produits", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/boutique/produits/actifs — produits actifs seulement (public vitrine)
router.get("/produits/actifs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .eq("actif", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boutique/produits — créer un produit (admin)
router.post("/produits", authenticateAdmin, async (req, res) => {
  try {
    const { nom, description, prix, stock, categorie, image_url, images } = req.body;
    if (!nom || prix === undefined) {
      return res.status(400).json({ error: "nom et prix sont requis" });
    }
    const imagesArr = Array.isArray(images) ? images : (image_url ? [image_url] : []);
    const { data, error } = await supabase
      .from("produits")
      .insert({ nom, description, prix: Number(prix), stock: Number(stock) || 0, categorie: categorie || "Autre", image_url: imagesArr[0] || null, images: imagesArr, actif: true })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/boutique/produits/:id — modifier un produit (admin)
router.patch("/produits/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["nom", "description", "prix", "stock", "categorie", "image_url", "images", "actif"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.prix !== undefined) updates.prix = Number(updates.prix);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    const { data, error } = await supabase
      .from("produits")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/boutique/produits/:id — supprimer un produit (admin)
router.delete("/produits/:id", authenticateAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from("produits").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Produit supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COMMANDES ───────────────────────────────────────────────────────────────

// GET /api/boutique/commandes — toutes les commandes (admin)
router.get("/commandes", authenticateAdmin, async (req, res) => {
  try {
    const { statut } = req.query;
    let query = supabase.from("commandes").select("*").order("created_at", { ascending: false });
    if (statut && statut !== "tous") query = query.eq("statut", statut);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boutique/commandes — créer une commande (public)
router.post("/commandes", async (req, res) => {
  try {
    const { client_nom, client_email, client_telephone, items, notes } = req.body;
    if (!client_nom || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "client_nom et items sont requis" });
    }
    const total = items.reduce((sum, i) => sum + (Number(i.prix_unitaire) * Number(i.quantite)), 0);
    const { data, error } = await supabase
      .from("commandes")
      .insert({ client_nom, client_email, client_telephone, items, total, notes, statut: "en_attente" })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/boutique/commandes/:id — changer le statut (admin)
router.patch("/commandes/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["statut", "notes"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const { data, error } = await supabase
      .from("commandes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/boutique/commandes/:id — supprimer une commande (admin)
router.delete("/commandes/:id", authenticateAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from("commandes").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Commande supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
