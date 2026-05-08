import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();


console.log("✅ Route levelTest chargée")

router.post("/submit", async (req, res) => {
  try {
    const { user, test, submitted_at } = req.body;

    if (!user?.email || !test?.level) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    const { error } = await supabase.from("level_test_results").insert({
      fullname:  user.fullname,
      email:     user.email,
      phone:     user.phone,
      profile:   user.profile,
      consent:   user.consent,
      centre_id: user.centre_id || null,
      level: test.level,
      score: test.score,
      points_earned: test.points_earned,
      points_total: test.points_total,
      correct_answers: test.correct_answers,
      total_questions: test.total_questions,
      time_taken_seconds: test.time_taken_seconds,
      answers_details: test.answers_details,
      audio_answers:   test.audio_answers || {},
      by_category: test.by_category,
      by_cefr: test.by_cefr,
      submitted_at: submitted_at || new Date().toISOString(),
    });

    if (error) {
      console.error("Erreur Supabase :", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Résultat enregistré" });
  } catch (err) {
    console.error("Erreur serveur :", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Liste des commerciales actives, filtrée par centre si ?centre_id= fourni, ou par id si ?id= fourni
router.get("/commerciaux", async (req, res) => {
  try {
    const { centre_id, id } = req.query;
    let query = supabase
      .from("utilisateurs")
      .select("id, nom, prenom, email, telephone, role, scope")
      .eq("role", "commercial")
      .eq("actif", true)
      .order("prenom");

    if (id) {
      query = query.eq("id", id);
    } else if (centre_id) {
      query = query.or(`scope.cs.{"${centre_id}"},scope.cs.{"national"}`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ commerciaux: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Assigner un commercial à un client (appelé depuis MonEspace)
router.post("/assign-commercial", async (req, res) => {
  try {
    const { client_email, commercial_id, centre_id } = req.body;
    if (!client_email || !commercial_id) {
      return res.status(400).json({ error: "client_email et commercial_id requis" });
    }

    // Vérifier que ce commercial existe bien
    const { data: com, error: comErr } = await supabase
      .from("utilisateurs")
      .select("id, scope")
      .eq("id", commercial_id)
      .eq("role", "commercial")
      .maybeSingle();

    if (comErr || !com) {
      return res.status(400).json({ error: "Commercial introuvable" });
    }

    // Déterminer le centre_id : celui fourni, sinon le premier du scope du commercial
    const resolvedCentreId = centre_id ||
      (Array.isArray(com.scope) && !com.scope.includes("national") ? com.scope[0] : null);

    const updatePayload = { commercial_id };
    if (resolvedCentreId) updatePayload.centre_id = resolvedCentreId;

    const { error: updErr } = await supabase
      .from("level_test_results")
      .update(updatePayload)
      .eq("email", client_email);

    if (updErr) return res.status(500).json({ error: updErr.message });

    res.json({ message: "Conseiller(ère) assigné(e) avec succès" });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Récupérer tous les résultats filtrés par scope admin
router.get("/all", authenticateAdmin, async (req, res) => {
  try {
    const scope = req.profil?.scope || [];
    const isNational = scope.includes("national") || req.role === "super_admin";

    let query = supabase
      .from("level_test_results")
      .select("id, fullname, email, phone, profile, level, score, points_earned, points_total, correct_answers, total_questions, time_taken_seconds, submitted_at, commercial_id, centre_id, by_category, by_cefr, answers_details, audio_answers")
      .order("submitted_at", { ascending: false });

    if (!isNational && scope.length > 0) {
      query = query.in("centre_id", scope);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ results: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Récupérer le dernier résultat de test par email
router.get("/result", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email requis" });

    const { data, error } = await supabase
      .from("level_test_results")
      .select("level, score, points_earned, points_total, correct_answers, total_questions, submitted_at, by_category")
      .eq("email", email)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ result: data || null });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;