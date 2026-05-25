import express from "express";
import supabase from "../config/supabase.js";
import { authenticateUser } from "../middlewares/auth.js";
import { logAudit } from "../middlewares/logAudit.js";

const router = express.Router();

// --------------------- Inscription ---------------------
router.post("/register", async (req, res) => {
  try {
    const { nom, prenom, email, telephone, password } = req.body;
    if (!nom || !prenom || !email || !telephone || !password) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nom,
        prenom,
        telephone,
        niveau_anglais: "Non évalué",
        historique_inscriptions: [],
        resultats: [],
        acces_mediatheque: false
      }
    });

    if (authError) {
      console.error("Erreur Auth :", authError);
      return res.status(400).json({ error: authError.message });
    }

    logAudit({
      acteur_id:    authData.user.id,
      acteur_nom:   `${prenom} ${nom}`,
      acteur_email: email,
      acteur_role:  "apprenant",
      action_type:  "REGISTER",
      module:       "auth",
      entite_type:  "user",
      entite_id:    authData.user.id,
      detail:       `Inscription apprenant : ${prenom} ${nom} (${email})`,
      ip_address:   req.headers["x-forwarded-for"] || req.ip || null,
      user_agent:   req.headers["user-agent"] || null,
      statut:       "success",
    }).catch(() => {});

    res.status(201).json({
      message: "Inscription réussie",
      user: {
        id: authData.user.id,
        email,
        nom,
        prenom,
        telephone,
        niveau_anglais: "Non évalué",
        acces_mediatheque: false
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// --------------------- Connexion ---------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logAudit({
        acteur_email: email,
        action_type:  "LOGIN_FAILED",
        module:       "auth",
        detail:       `Échec de connexion pour ${email}`,
        ip_address:   req.headers["x-forwarded-for"] || req.ip || null,
        user_agent:   req.headers["user-agent"] || null,
        statut:       "danger",
      }).catch(() => {});
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // Récupérer les métadonnées
    const metadata = data.user.user_metadata;

    logAudit({
      acteur_id:    data.user.id,
      acteur_nom:   `${metadata?.prenom || ""} ${metadata?.nom || ""}`.trim() || email,
      acteur_email: data.user.email,
      acteur_role:  "apprenant",
      action_type:  "LOGIN_SUCCESS",
      module:       "auth",
      entite_type:  "user",
      entite_id:    data.user.id,
      detail:       `Connexion réussie : ${email}`,
      ip_address:   req.headers["x-forwarded-for"] || req.ip || null,
      user_agent:   req.headers["user-agent"] || null,
      statut:       "success",
    }).catch(() => {});

    res.json({
      message: "Connexion réussie",
      session: data.session,         // contient access_token, refresh_token
      user: {
        id: data.user.id,
        email: data.user.email,
        nom: metadata?.nom || "",
        prenom: metadata?.prenom || "",
        telephone: metadata?.telephone || "",
        niveau_anglais: metadata?.niveau_anglais || "Non évalué",
        acces_mediatheque: metadata?.acces_mediatheque || false
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// --------------------- Mise à jour du profil ---------------------
router.put("/profile", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nom, prenom, telephone, niveau_anglais, acces_mediatheque, avatar_url } = req.body;

    // Récupérer les métadonnées actuelles
    const { data: { user }, error: fetchError } = await supabase.auth.admin.getUserById(userId);
    if (fetchError) throw fetchError;

    const currentMeta = user.user_metadata || {};
    const updatedMetadata = {
      ...currentMeta,
      nom:               nom               ?? currentMeta.nom,
      prenom:            prenom            ?? currentMeta.prenom,
      telephone:         telephone         ?? currentMeta.telephone,
      niveau_anglais:    niveau_anglais    ?? currentMeta.niveau_anglais,
      acces_mediatheque: acces_mediatheque ?? currentMeta.acces_mediatheque,
      bet_avatar_url:    avatar_url        ?? currentMeta.bet_avatar_url,
    };

    const { data, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    });
    if (updateError) throw updateError;

    // Synchroniser aussi la table utilisateurs
    const syncFields = {};
    if (updatedMetadata.nom)       syncFields.nom       = updatedMetadata.nom;
    if (updatedMetadata.prenom)    syncFields.prenom    = updatedMetadata.prenom;
    if (updatedMetadata.telephone) syncFields.telephone = updatedMetadata.telephone;
    if (Object.keys(syncFields).length > 0) {
      await supabase.from("utilisateurs").update(syncFields).eq("id", userId);
    }

    res.json({
      message: "Profil mis à jour",
      user: {
        id: data.user.id,
        email: data.user.email,
        nom: updatedMetadata.nom,
        prenom: updatedMetadata.prenom,
        telephone: updatedMetadata.telephone,
        niveau_anglais: updatedMetadata.niveau_anglais,
        acces_mediatheque: updatedMetadata.acces_mediatheque
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

router.get("/me", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    if (error) throw error;
    const metadata = user.user_metadata || {};
    res.json({
      id: user.id,
      email: user.email,
      nom: metadata.nom || "",
      prenom: metadata.prenom || "",
      telephone: metadata.telephone || "",
      niveau_anglais: metadata.niveau_anglais || "Non évalué",
      acces_mediatheque: metadata.acces_mediatheque || false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération du profil" });
  }
});

router.put("/change-password", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Mot de passe actuel et nouveau mot de passe (min 6 caractères) requis" });
    }
    // Vérifier le mot de passe actuel en tentant une connexion
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword
    });
    if (signInError) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect" });
    }
    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
    if (updateError) throw updateError;
    res.json({ message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors du changement de mot de passe" });
  }
});

// Route pour demander la réinitialisation du mot de passe
// Route pour demander un lien de réinitialisation de mot de passe
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "L'email est requis." });
    }

    // URL de redirection après clic sur le lien (doit être dans les Redirect URLs de Supabase)
    const redirectTo = `${process.env.FRONTEND_URL || "http://localhost:3000"}/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("Erreur resetPasswordForEmail :", error);
      // Pour des raisons de sécurité, on ne précise pas si l'email existe
      return res.status(400).json({ error: "Impossible d'envoyer l'email. Vérifiez l'adresse." });
    }

    // Toujours renvoyer un message de succès générique
    res.json({ message: "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

router.post("/sync-profile", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, user_metadata } = req.user;

    let nom = user_metadata?.nom || "";
    let prenom = user_metadata?.prenom || "";
    let telephone = user_metadata?.telephone || "";

    if ((!nom || !prenom) && user_metadata?.full_name) {
      const parts = user_metadata.full_name.trim().split(" ");
      nom = parts[0] || "";
      prenom = parts.slice(1).join(" ") || "";
    }

    const { data: existing, error: findError } = await supabase
      .from("apprenants")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (findError && findError.code !== "PGRST116") throw findError;

    if (!existing) {
      const { error: insertError } = await supabase.from("apprenants").insert({
        id: userId,
        email,
        nom: nom || email.split("@")[0],
        prenom: prenom || "",
        telephone: telephone || "",
      });
      if (insertError) throw insertError;
    } else {
      const { error: updateError } = await supabase
        .from("apprenants")
        .update({ nom, prenom, telephone, email })
        .eq("id", userId);
      if (updateError) throw updateError;
    }

    res.json({ message: "Profil synchronisé", nom, prenom });
  } catch (error) {
    console.error("Erreur sync-profile:", error);
    res.status(500).json({ error: "Erreur lors de la synchronisation" });
  }
});

// ── Infos prospect : centre, statut apprenant, commercial ─
router.get("/prospect-info", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email requis" });
  try {
    // 1. Vérifier si le prospect est devenu apprenant (présent dans une table d'inscription)
    const [{ data: adulte }, { data: enfant }, { data: etudiant }] = await Promise.all([
      supabase.from("inscriptions_adultes").select("id, centre_id").eq("email", email).maybeSingle(),
      supabase.from("inscriptions_enfants").select("id, centre_id").eq("email", email).maybeSingle(),
      supabase.from("inscriptions_etudiants").select("id, centre_id").eq("email", email).maybeSingle(),
    ]);
    const inscription = adulte || enfant || etudiant;
    const is_apprenant = !!inscription;

    // 2. Récupérer le dernier test de niveau (centre + commercial)
    const { data: testResult } = await supabase
      .from("level_test_results")
      .select("centre_id, commercial_id")
      .eq("email", email)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const centre_id = inscription?.centre_id || testResult?.centre_id || null;

    // 3. Données du centre
    let centre = null;
    if (centre_id) {
      const { data } = await supabase
        .from("centres")
        .select("id, nom, ville, telephone, adresse")
        .eq("id", centre_id)
        .maybeSingle();
      centre = data;
    }

    // 4. Données de la commercial (si assignée)
    let commercial = null;
    const commercial_id = testResult?.commercial_id || null;
    if (commercial_id) {
      const { data } = await supabase
        .from("utilisateurs")
        .select("id, nom, prenom, telephone, email, scope")
        .eq("id", commercial_id)
        .maybeSingle();
      commercial = data;
    }

    res.json({ is_apprenant, centre, commercial });
  } catch (err) {
    console.error("prospect-info:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;