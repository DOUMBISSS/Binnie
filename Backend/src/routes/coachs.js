import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";
import { sendCoachWelcomeEmail } from "../services/emailService.js";

const router = express.Router();

console.log("✅ Route coachs chargée");

// ── Auth middleware pour les coachs (JWT Supabase) ──────────
const authenticateCoach = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Non authentifié" });
  const token = auth.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: "Token invalide" });
  if (data.user.app_metadata?.role !== "coach") return res.status(403).json({ error: "Accès réservé aux coachs" });
  req.coachId = data.user.id;
  next();
};

// ── GET disponibilités du coach connecté ───────────────────
router.get("/disponibilites", authenticateCoach, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("coach_disponibilites")
      .select("*")
      .eq("coach_id", req.coachId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ disponibilites: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── POST upsert disponibilités (slots non verrouillés) ─────
router.post("/disponibilites", authenticateCoach, async (req, res) => {
  try {
    const { slots } = req.body;
    if (!Array.isArray(slots)) return res.status(400).json({ error: "slots doit être un tableau" });

    // Récupérer les créneaux verrouillés existants
    const { data: existing } = await supabase
      .from("coach_disponibilites")
      .select("jour, creneau, verrouille")
      .eq("coach_id", req.coachId);

    const lockedKeys = new Set(
      (existing || []).filter(r => r.verrouille).map(r => `${r.jour}|${r.creneau}`)
    );

    const toUpsert = slots
      .filter(s => !lockedKeys.has(`${s.jour}|${s.creneau}`))
      .map(s => ({
        coach_id:   req.coachId,
        jour:       s.jour,
        creneau:    s.creneau,
        debut:      s.debut,
        fin:        s.fin,
        dispo:      s.dispo,
        verrouille: false,
        updated_at: new Date().toISOString(),
      }));

    if (toUpsert.length === 0) {
      return res.json({ message: "Aucun créneau modifiable (tous verrouillés)", updated: 0 });
    }

    const { error } = await supabase
      .from("coach_disponibilites")
      .upsert(toUpsert, { onConflict: "coach_id,jour,creneau" });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Disponibilités enregistrées", updated: toUpsert.length });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── Lecture publique : coachs actifs (site frontend) ────────
router.get("/publics", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("coachs")
      .select("id, nom, prenom, grade, photo_url")
      .eq("actif", true)
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Lister tous les coachs ──────────────────────────────────
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("coachs")
      .select("id, nom, prenom, grade, photo_url, actif, email_professionnel, biographie, created_at")
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    // Normalise actif → statut pour compatibilité frontend
    const normalized = (data || []).map(c => ({ ...c, statut: c.actif ? "actif" : "inactif" }));
    res.json({ coachs: normalized });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── Créer un coach affichage uniquement (sans compte auth) ──
router.post("/display", authenticateAdmin, async (req, res) => {
  try {
    const { nom, prenom, grade, photo_url } = req.body;
    if (!nom) return res.status(400).json({ error: "Le nom est requis" });

    const { data, error } = await supabase
      .from("coachs")
      .insert({
        id:        crypto.randomUUID(),
        nom:       nom.trim(),
        prenom:    (prenom || "").trim() || null,
        grade:     grade    || "Coach",
        photo_url: photo_url || null,
        actif:     true,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── Créer un coach + accès auth + mail de bienvenue ─────────
router.post("/", authenticateAdmin, async (req, res) => {
  try {
    const {
      photo_url, nom, prenom, genre, date_naissance, nationalite,
      email, telephone, telephone2, adresse, ville,
      grade, specialites, niveaux_enseignes, experience_annees,
      date_embauche, type_contrat, taux_horaire,
      certifications, langues, bio, linkedin,
      cv_url, statut,
    } = req.body;

    if (!nom || !prenom || !email) {
      return res.status(400).json({ error: "nom, prenom et email sont obligatoires" });
    }

    // 1. Générer un mot de passe temporaire
    const mdpTemp = "BET@" + Math.random().toString(36).slice(2, 8).toUpperCase() + "!";

    // 2. Créer le compte Supabase Auth avec le rôle "coach"
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: mdpTemp,
      email_confirm: true,
      app_metadata: { role: "coach", actif: true },
      user_metadata:  { nom: nom.trim(), prenom: prenom.trim(), telephone: telephone || null },
    });

    if (authError) {
      console.error("❌ Création auth coach :", authError);
      // Si l'email existe déjà dans Supabase Auth
      if (authError.message?.includes("already") || authError.status === 422) {
        return res.status(409).json({ error: "Un compte avec cet email existe déjà" });
      }
      return res.status(400).json({ error: authError.message });
    }

    const coachId = authData.user.id;

    // 3. Insérer dans la table utilisateurs (pour la connexion au dashboard)
    await supabase.from("utilisateurs").insert({
      id:           coachId,
      email:        email.trim(),
      nom:          nom.trim(),
      prenom:       prenom.trim(),
      telephone:    telephone || null,
      role:         "coach",
      scope:        ["national"],
      actif:        true,
      mdp_temporaire: true,
      mdp_initial:  mdpTemp,
      cree_par_id:  req.profil.id,
    });

    // 4. Insérer le profil complet dans la table coachs
    const { data: coachData, error: coachError } = await supabase.from("coachs").insert({
      id:                 coachId,        // même ID que Supabase Auth
      photo_url:          photo_url        || null,
      nom:                nom.trim(),
      prenom:             prenom.trim(),
      genre:              genre            || null,
      date_naissance:     date_naissance   || null,
      nationalite:        nationalite      || null,
      email:              email.trim(),
      telephone:          telephone        || null,
      telephone2:         telephone2       || null,
      adresse:            adresse          || null,
      ville:              ville            || null,
      grade:              grade            || "Coach",
      specialites:        specialites      || [],
      niveaux_enseignes:  niveaux_enseignes|| [],
      experience_annees:  experience_annees|| 0,
      date_embauche:      date_embauche    || null,
      type_contrat:       type_contrat     || "Freelance",
      taux_horaire:       taux_horaire     || null,
      certifications:     certifications   || [],
      langues:            langues          || ["Français","Anglais"],
      bio:                bio              || null,
      linkedin:           linkedin         || null,
      cv_url:             cv_url           || null,
      statut:             statut           || "actif",
      evaluation_moyenne: 0,
      heures_effectuees:  0,
      heures_planifiees:  0,
    }).select().single();

    if (coachError) {
      // Rollback : supprimer le compte auth si l'insertion profil échoue
      await supabase.auth.admin.deleteUser(coachId);
      await supabase.from("utilisateurs").delete().eq("id", coachId);
      console.error("Erreur insertion coach :", coachError);
      return res.status(500).json({ error: coachError.message });
    }

    // 5. Audit
    await supabase.from("audit_admin").insert({
      acteur_id:  req.profil.id,
      acteur_nom: `${req.profil.prenom} ${req.profil.nom}`,
      action:     "COACH_CREE",
      cible_id:   coachId,
      detail:     `Coach créé : ${prenom} ${nom} (${email})`,
      statut:     "success",
    }).catch(() => {});

    // 6. Envoyer l'email de bienvenue (non-bloquant)
    let emailSent = false;
    try {
      await sendCoachWelcomeEmail({ prenom: prenom.trim(), nom: nom.trim(), email: email.trim(), mdpTemp });
      emailSent = true;
    } catch (mailErr) {
      console.error("⚠️  Email non envoyé :", mailErr.message);
    }

    res.status(201).json({
      message: "Coach créé",
      coach:   coachData,
      acces: {
        email:      email.trim(),
        mdp_temp:   mdpTemp,
        email_sent: emailSent,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── Modifier un coach ───────────────────────────────────────
router.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    delete updates.statut; // colonne inexistante, remplacée par actif

    // Convertit statut → actif si envoyé
    if (req.body.statut !== undefined) {
      updates.actif = req.body.statut === "actif";
    }

    const { error } = await supabase
      .from("coachs")
      .update(updates)
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    // Sync email/nom/prenom dans utilisateurs si modifiés
    const syncFields = {};
    if (updates.email)  syncFields.email  = updates.email;
    if (updates.nom)    syncFields.nom    = updates.nom;
    if (updates.prenom) syncFields.prenom = updates.prenom;
    if (Object.keys(syncFields).length > 0) {
      await supabase.from("utilisateurs").update(syncFields).eq("id", id).catch(() => {});
    }

    res.json({ message: "Coach mis à jour" });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── Supprimer un coach ──────────────────────────────────────
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Supprimer profil coach
    const { error } = await supabase.from("coachs").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });

    // Supprimer compte auth + utilisateur (best-effort)
    await supabase.auth.admin.deleteUser(id).catch(() => {});
    await supabase.from("utilisateurs").delete().eq("id", id).catch(() => {});

    res.json({ message: "Coach supprimé" });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── Renvoyer les accès par email ────────────────────────────
router.post("/:id/renvoyer-acces", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: u } = await supabase
      .from("utilisateurs")
      .select("email, nom, prenom, mdp_initial")
      .eq("id", id)
      .maybeSingle();

    if (!u) return res.status(404).json({ error: "Coach introuvable" });
    if (!u.mdp_initial) return res.status(400).json({ error: "Aucun mot de passe initial enregistré" });

    await sendCoachWelcomeEmail({
      prenom: u.prenom, nom: u.nom, email: u.email, mdpTemp: u.mdp_initial
    });

    res.json({ message: "Accès renvoyé par email", email: u.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur envoi email" });
  }
});

export default router;
