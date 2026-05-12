import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();


console.log("✅ Route levelTest chargée")

router.post("/submit", async (req, res) => {
  try {
    const { user, test, submitted_at } = req.body;

    // Pour un test oral saisi par une assistante, l'email peut être absent
    const isOral = test?.source === "oral";
    if (!test?.level) {
      return res.status(400).json({ error: "Le niveau CECRL est requis" });
    }
    if (!isOral && !user?.email) {
      return res.status(400).json({ error: "L'email est requis pour un test en ligne" });
    }

    const { data: inserted, error } = await supabase.from("level_test_results").insert({
      fullname:          user.fullname          || null,
      email:             user.email             || null,
      phone:             user.phone             || null,
      profile:           user.profile           || null,
      consent:           user.consent           ?? true,
      centre_id:         user.centre_id         || null,
      commercial_id:     user.commercial_id     || null,
      level:             test.level,
      score:             test.score             ?? 0,
      points_earned:     test.points_earned     ?? 0,
      points_total:      test.points_total      ?? 100,
      correct_answers:   test.correct_answers   ?? 0,
      total_questions:   test.total_questions   ?? 0,
      time_taken_seconds: test.time_taken_seconds ?? 0,
      answers_details:   test.answers_details   || [],
      audio_answers:     test.audio_answers     || {},
      by_category:       test.by_category       || {},
      by_cefr:           test.by_cefr           || {},
      source:            test.source            || "online",
      notes_oral:        test.notes_oral        || null,
      format_test:       test.format_test       || "mixte",
      correction_statut: test.correction_statut || "auto",
      submitted_at:      submitted_at           || new Date().toISOString(),
    }).select().single();

    if (error) {
      console.error("Erreur Supabase :", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Résultat enregistré", result: inserted });
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
    const ROLES_GLOBAUX = ["super_admin", "admin", "responsable", "gestionnaire", "manager"];
    const isGlobal = isNational || ROLES_GLOBAUX.includes(req.role);

    const SELECT = "id, fullname, email, phone, profile, level, score, points_earned, points_total, correct_answers, total_questions, time_taken_seconds, submitted_at, commercial_id, centre_id, source, notes_oral, format_test, correction_statut, by_category, by_cefr, answers_details, audio_answers";

    let query = supabase
      .from("level_test_results")
      .select(SELECT)
      .order("submitted_at", { ascending: false });

    if (isGlobal) {
      // Accès total
    } else if (scope.length > 0) {
      // Commerciale : tests du centre OU tests oraux qu'elle a elle-même saisis (commercial_id)
      const userId = req.profil?.id;
      if (userId) {
        query = query.or(`centre_id.in.(${scope.join(",")}),commercial_id.eq.${userId}`);
      } else {
        query = query.in("centre_id", scope);
      }
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ results: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// Corriger un test Writing/Speaking — attribuer score + niveau
router.patch("/:id/corriger", authenticateAdmin, async (req, res) => {
  try {
    const { level, score, notes_oral } = req.body;
    if (!level) return res.status(400).json({ error: "Le niveau CECRL est requis" });

    const { data, error } = await supabase
      .from("level_test_results")
      .update({
        level,
        score:             Number(score) || 0,
        points_earned:     Number(score) || 0,
        notes_oral:        notes_oral || null,
        correction_statut: "corrige",
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ result: data });
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