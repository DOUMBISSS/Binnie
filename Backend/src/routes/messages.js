import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

console.log("✅ Route messages chargée");

// ── Helper : vérifier que l'user est bien dans la conv ──────
async function isParticipant(convId, userId) {
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", convId)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single();
  return !!data;
}

// ── GET /contacts → liste des autres utilisateurs à contacter ─
router.get("/contacts", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("utilisateurs")
      .select("id, nom, prenom, email, role, actif")
      .neq("id", req.user.id)
      .eq("actif", true)
      .order("nom");

    if (error) return res.status(500).json({ error: error.message });
    res.json({ contacts: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── GET /conversations → mes conversations ──────────────────
router.get("/conversations", authenticateAdmin, async (req, res) => {
  try {
    const uid = req.user.id;
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
      .order("last_message_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Compter les messages non lus pour chaque conv
    const enriched = await Promise.all((data || []).map(async (conv) => {
      const { count } = await supabase
        .from("messages_chat")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("lu", false)
        .neq("from_id", uid);
      return { ...conv, non_lus: count || 0 };
    }));

    res.json({ conversations: enriched });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── POST /conversations → ouvrir/trouver une conv avec un user
router.post("/conversations", authenticateAdmin, async (req, res) => {
  try {
    const me = req.user.id;
    const { to_id } = req.body;
    if (!to_id) return res.status(400).json({ error: "to_id requis" });

    // Chercher conv existante dans les deux sens
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(`and(user1_id.eq.${me},user2_id.eq.${to_id}),and(user1_id.eq.${to_id},user2_id.eq.${me})`)
      .maybeSingle();

    if (existing) return res.json({ conversation: existing });

    // Récupérer infos du destinataire
    const { data: toProfil } = await supabase
      .from("utilisateurs")
      .select("nom, prenom, role, email")
      .eq("id", to_id)
      .maybeSingle();

    const meProfil = req.profil;

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        user1_id:    me,
        user1_name:  `${meProfil.prenom || ""} ${meProfil.nom || ""}`.trim() || meProfil.email,
        user1_role:  req.role,
        user2_id:    to_id,
        user2_name:  toProfil ? `${toProfil.prenom || ""} ${toProfil.nom || ""}`.trim() || toProfil.email : to_id,
        user2_role:  toProfil?.role || null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ conversation: created });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── GET /conversations/:id/messages ─────────────────────────
router.get("/conversations/:id/messages", authenticateAdmin, async (req, res) => {
  try {
    if (!(await isParticipant(req.params.id, req.user.id))) {
      return res.status(403).json({ error: "Accès interdit" });
    }

    const { data, error } = await supabase
      .from("messages_chat")
      .select("*")
      .eq("conversation_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ messages: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── POST /conversations/:id/messages → envoyer un message ───
router.post("/conversations/:id/messages", authenticateAdmin, async (req, res) => {
  try {
    const convId = req.params.id;
    if (!(await isParticipant(convId, req.user.id))) {
      return res.status(403).json({ error: "Accès interdit" });
    }

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Contenu vide" });

    const meProfil = req.profil;
    const fromName = `${meProfil.prenom || ""} ${meProfil.nom || ""}`.trim() || meProfil.email;

    const { data, error } = await supabase
      .from("messages_chat")
      .insert({
        conversation_id: convId,
        from_id:         req.user.id,
        from_name:       fromName,
        from_role:       req.role,
        content:         content.trim(),
        lu:              false,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Mettre à jour last_message sur la conv
    await supabase
      .from("conversations")
      .update({ last_message: content.trim().slice(0, 100), last_message_at: new Date().toISOString() })
      .eq("id", convId);

    res.status(201).json({ message: data });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── PATCH /conversations/:id/read → marquer lu ──────────────
router.patch("/conversations/:id/read", authenticateAdmin, async (req, res) => {
  try {
    const convId = req.params.id;
    if (!(await isParticipant(convId, req.user.id))) {
      return res.status(403).json({ error: "Accès interdit" });
    }

    await supabase
      .from("messages_chat")
      .update({ lu: true })
      .eq("conversation_id", convId)
      .neq("from_id", req.user.id);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;
