import express from "express";
import { createClient } from "@supabase/supabase-js";
import supabase, { supabaseAuth } from "../config/supabase.js";
import {
  authenticateAdmin,
  requireSuperAdmin,
  requirePermission,
} from "../middlewares/requireAdmin.js";

// Client utilisateur temporaire pour les opérations MFA (nécessite la session de l'utilisateur)
const getUserClient = async (accessToken, refreshToken) => {
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  return client;
};

const router = express.Router();

/* ══════════════════════════════════════════════════════════════
   PERMISSIONS PAR DÉFAUT PAR TYPE DE PROFIL
   Le super_admin peut les ajuster au moment de la création.
══════════════════════════════════════════════════════════════ */
const PERMISSIONS_DEFAUT = {
  super_admin: Object.fromEntries(
    ["dashboard","users","roles","cours","examens","finances","rh",
     "commercial","audit","plateforme","coachs","apprenants","support"]
      .map(m => [m, { create:true, read:true, update:true, delete:true, manage:true }])
  ),
  admin_pedagogique: Object.fromEntries(
    ["dashboard","cours","examens","coachs","apprenants"]
      .map(m => [m, { create:true, read:true, update:true, delete:false, manage:false }])
  ),
  admin_financier: Object.fromEntries(
    ["dashboard","finances","paiements","ca"]
      .map(m => [m, { create:true, read:true, update:true, delete:false, manage:false }])
  ),
  admin_rh: Object.fromEntries(
    ["dashboard","coachs","rh","absences"]
      .map(m => [m, { create:true, read:true, update:true, delete:false, manage:true }])
  ),
  admin_commercial: Object.fromEntries(
    ["dashboard","clients","offres","commercial"]
      .map(m => [m, { create:true, read:true, update:true, delete:false, manage:false }])
  ),
  responsable_centre: Object.fromEntries(
    ["dashboard","cours","examens","coachs","apprenants","planning","presences"]
      .map(m => [m, { create:true, read:true, update:true, delete:false, manage:true }])
  ),
  observateur: Object.fromEntries(
    ["dashboard","cours","apprenants"]
      .map(m => [m, { create:false, read:true, update:false, delete:false, manage:false }])
  ),
};

const LABELS_TYPE = {
  super_admin:        "Direction Générale",
  admin_pedagogique:  "Administration Pédagogique",
  admin_financier:    "Administration Financière",
  admin_rh:           "Ressources Humaines",
  admin_commercial:   "Administration Commerciale",
  responsable_centre: "Responsable de Centre",
  observateur:        "Observateur",
};


/* ══════════════════════════════════════════════════════════════
   POST /api/admin/login
   Login spécifique aux comptes admin du dashboard.
   Vérifie que le compte a bien un rôle admin dans app_metadata.
══════════════════════════════════════════════════════════════ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    // 1. Authentifier via Supabase Auth
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Supabase auth error:", error.message);
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const user = data.user;

    // 2. Chercher le profil dans `utilisateurs` (nouveaux comptes)
    //    puis fallback sur `profils_admin` (super_admin historique)
    let profil = null;
    let source = null;

    const { data: u } = await supabase
      .from("utilisateurs")
      .select("*")
      .eq("id", user.id)
      .single();

    if (u) {
      profil = u;
      source = "utilisateurs";
    } else {
      const { data: pa } = await supabase
        .from("profils_admin")
        .select("*")
        .eq("id", user.id)
        .single();
      if (pa) {
        profil = { ...pa, role: pa.profil_type };
        source = "profils_admin";
      }
    }

    if (!profil) {
      return res.status(403).json({ error: "Profil introuvable — contactez le Super Admin BET" });
    }

    if (!profil.actif) {
      return res.status(403).json({ error: "Compte désactivé — contactez le Super Admin BET" });
    }

    // 3. Vérifier le statut MFA
    const userClient = await getUserClient(data.session.access_token, data.session.refresh_token);
    const { data: aalData } = await userClient.auth.mfa.getAuthenticatorAssuranceLevel();

    // Résoudre twofa_obligatoire EN PREMIER (avant tout check Supabase MFA)
    // Pour utilisateurs : twofa_active | Pour profils_admin : twofa_obligatoire
    const twofa_obligatoire = profil.twofa_obligatoire ?? profil.twofa_active ?? false;
    console.log(`[LOGIN] ${profil.email} | twofa_active=${profil.twofa_active} | twofa_obligatoire=${profil.twofa_obligatoire} | résolu=${twofa_obligatoire} | nextLevel=${aalData?.nextLevel} | currentLevel=${aalData?.currentLevel}`);

    const profilPublic = {
      id:                 profil.id,
      email:              profil.email,
      nom:                profil.nom,
      prenom:             profil.prenom,
      telephone:          profil.telephone || null,
      role:               profil.role,
      scope:              profil.scope || ["national"],
      departement:        profil.departement || null,
      actif:              profil.actif,
      twofa_active:       twofa_obligatoire,
      mdp_temporaire:     profil.mdp_temporaire ?? false,
      derniere_connexion: profil.derniere_connexion,
      date_creation:      profil.date_creation,
    };

    // Si 2FA désactivée en DB → connexion directe, ignorer l'état Supabase MFA
    if (twofa_obligatoire) {
      // 3a. MFA déjà configurée → demander le code TOTP
      if (aalData?.nextLevel === "aal2") {
        const { data: factorsData } = await userClient.auth.mfa.listFactors();
        const totpFactor = factorsData?.totp?.[0];
        return res.json({
          requires_mfa: true,
          factor_id:    totpFactor?.id,
          session:      data.session,
          profil:       profilPublic,
        });
      }

      // 3b. 2FA obligatoire mais pas encore configurée → enrôlement
      return res.json({
        requires_enrollment: true,
        session:             data.session,
        profil:              profilPublic,
      });
    }

    // 3c. Connexion directe
    const table = source === "utilisateurs" ? "utilisateurs" : "profils_admin";
    await supabase.from(table).update({ derniere_connexion: new Date().toISOString() }).eq("id", user.id);

    // audit non bloquant
    supabase.from("audit_admin").insert({
      acteur_id:  user.id,
      acteur_nom: `${profil.prenom} ${profil.nom}`,
      action:     "LOGIN",
      detail:     `Connexion — rôle : ${profil.role}`,
      ip:         req.headers["x-forwarded-for"] || req.socket.remoteAddress || "—",
      statut:     "success",
    }).then(() => {}).catch(() => {});

    res.json({ message: "Connexion réussie", session: data.session, profil: profilPublic });
  } catch (err) {
    console.error("Erreur login admin :", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});


/* ══════════════════════════════════════════════════════════════
   GET /api/admin/me
   Profil de l'admin connecté.
══════════════════════════════════════════════════════════════ */
router.get("/me", authenticateAdmin, (req, res) => {
  res.json({ profil: req.profil });
});


/* ══════════════════════════════════════════════════════════════
   GET /api/admin/profils
   Liste tous les profils admin (accessible à tous les admins actifs).
══════════════════════════════════════════════════════════════ */
router.get("/profils", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profils_admin")
      .select("id, email, nom, prenom, profil_type, scope, departement, actif, twofa_obligatoire, date_creation, derniere_connexion, cree_par_id, note")
      .order("date_creation", { ascending: false });

    if (error) throw error;
    res.json({ profils: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des profils" });
  }
});


/* ══════════════════════════════════════════════════════════════
   POST /api/admin/profils
   Créer un nouveau profil admin.
   RÉSERVÉ AU SUPER ADMIN UNIQUEMENT.
══════════════════════════════════════════════════════════════ */
router.post("/profils", authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const {
      nom, prenom, email, telephone,
      profil_type, scope,
      permissions_custom,   // optionnel : override des permissions par défaut
      twofa_obligatoire,
      note,
    } = req.body;

    // Validation
    if (!nom || !prenom || !email || !profil_type || !scope?.length) {
      return res.status(400).json({
        error: "Champs requis : nom, prenom, email, profil_type, scope"
      });
    }

    const TYPES_VALIDES = [
      "admin_pedagogique", "admin_financier", "admin_rh",
      "admin_commercial", "responsable_centre", "observateur",
    ];
    if (!TYPES_VALIDES.includes(profil_type)) {
      return res.status(400).json({
        error: `Type de profil invalide. Types autorisés : ${TYPES_VALIDES.join(", ")}`
      });
    }

    // Générer un mot de passe temporaire sécurisé
    const mdpTemp = "BET@" + Math.random().toString(36).slice(2, 8).toUpperCase() + "!";

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: mdpTemp,
      email_confirm: true,  // confirmé d'office par le super_admin
      app_metadata: {
        role:  profil_type,
        actif: true,
      },
      user_metadata: { nom, prenom, telephone },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const newUserId = authData.user.id;

    // 2. Permissions : utiliser les permissions par défaut du type + éventuels overrides
    const permissions = permissions_custom || PERMISSIONS_DEFAUT[profil_type] || {};

    // 3. Insérer le profil dans profils_admin
    const { data: profil, error: insertError } = await supabase
      .from("profils_admin")
      .insert({
        id:                newUserId,
        email,
        nom,
        prenom,
        telephone:         telephone || null,
        profil_type,
        scope:             scope,
        departement:       LABELS_TYPE[profil_type],
        permissions,
        actif:             true,
        twofa_obligatoire: twofa_obligatoire ?? false,
        mdp_temporaire:    true,
        cree_par_id:       req.profil.id,
        note:              note || null,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback : supprimer l'utilisateur Auth si l'insert DB a échoué
      await supabase.auth.admin.deleteUser(newUserId);
      throw insertError;
    }

    // 4. Audit
    await supabase.from("audit_admin").insert({
      acteur_id:  req.profil.id,
      acteur_nom: `${req.profil.prenom} ${req.profil.nom}`,
      action:     "PROFIL_CREE",
      cible_id:   newUserId,
      detail:     `Profil ${profil_type} créé pour ${prenom} ${nom} (${email}) — périmètre : ${scope.join(", ")}`,
      statut:     "success",
    });

    // 5. Réponse (inclut le mdp temporaire pour que le super_admin le transmette)
    res.status(201).json({
      message:      `Profil ${LABELS_TYPE[profil_type]} créé pour ${prenom} ${nom}`,
      profil,
      mdp_temporaire: mdpTemp,  // À transmettre de façon sécurisée à l'utilisateur
    });

  } catch (err) {
    console.error("Erreur création profil :", err);
    res.status(500).json({ error: "Erreur lors de la création du profil" });
  }
});


/* ══════════════════════════════════════════════════════════════
   PATCH /api/admin/profils/:id
   Modifier un profil (permissions, scope, note, twofa).
   RÉSERVÉ AU SUPER ADMIN.
   Le super_admin NE PEUT PAS modifier son propre profil_type.
══════════════════════════════════════════════════════════════ */
router.patch("/profils/:id", authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { scope, permissions, twofa_obligatoire, note, actif } = req.body;

    // Récupérer le profil cible
    const { data: cible, error: findError } = await supabase
      .from("profils_admin")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !cible) {
      return res.status(404).json({ error: "Profil introuvable" });
    }

    // Interdire la modification du super_admin
    if (cible.profil_type === "super_admin") {
      return res.status(403).json({
        error: "Le profil Super Admin ne peut pas être modifié"
      });
    }

    // Construire les champs à mettre à jour
    const updates = {};
    if (scope !== undefined)              updates.scope              = scope;
    if (permissions !== undefined)        updates.permissions        = permissions;
    if (twofa_obligatoire !== undefined)  updates.twofa_obligatoire  = twofa_obligatoire;
    if (note !== undefined)               updates.note               = note;
    if (actif !== undefined) {
      updates.actif = actif;
      // Synchroniser dans app_metadata Auth
      await supabase.auth.admin.updateUserById(id, {
        app_metadata: { actif }
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from("profils_admin")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    await supabase.from("audit_admin").insert({
      acteur_id:  req.profil.id,
      acteur_nom: `${req.profil.prenom} ${req.profil.nom}`,
      action:     actif === false ? "PROFIL_DESACTIVE" : "PROFIL_MODIFIE",
      cible_id:   id,
      detail:     `Profil de ${cible.prenom} ${cible.nom} modifié — champs : ${Object.keys(updates).join(", ")}`,
      statut:     "warning",
    });

    res.json({ message: "Profil mis à jour", profil: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la modification du profil" });
  }
});


/* ══════════════════════════════════════════════════════════════
   GET /api/admin/audit
   Logs d'audit (super_admin voit tout, les autres voient les leurs).
══════════════════════════════════════════════════════════════ */
router.get("/audit", authenticateAdmin, async (req, res) => {
  try {
    let query = supabase
      .from("audit_admin")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (req.role !== "super_admin") {
      query = query.eq("acteur_id", req.profil.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ audit: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur audit" });
  }
});

/* ══════════════════════════════════════════════════════════════
   POST /api/admin/mfa/enroll
   Lance l'enrôlement TOTP — renvoie le QR code SVG + le secret.
   Appelé quand requires_enrollment = true après le login.
══════════════════════════════════════════════════════════════ */
router.post("/mfa/enroll", async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;
    if (!access_token) return res.status(400).json({ error: "Session requise" });

    const userClient = await getUserClient(access_token, refresh_token);
    const { data, error } = await userClient.auth.mfa.enroll({
      factorType:   "totp",
      issuer:       "BET Admin Dashboard",
      friendlyName: "Authentificateur BET",
    });
    if (error) return res.status(400).json({ error: error.message });

    res.json({
      factor_id: data.id,
      qr_code:   data.totp.qr_code, // SVG à afficher directement
      secret:    data.totp.secret,  // Pour saisie manuelle
      uri:       data.totp.uri,
    });
  } catch (err) {
    console.error("MFA enroll error:", err);
    res.status(500).json({ error: "Erreur lors de l'initialisation 2FA" });
  }
});


/* ══════════════════════════════════════════════════════════════
   POST /api/admin/mfa/enroll/confirm
   Confirme l'enrôlement avec le premier code TOTP scanné.
══════════════════════════════════════════════════════════════ */
router.post("/mfa/enroll/confirm", async (req, res) => {
  try {
    const { access_token, refresh_token, factor_id, code } = req.body;
    if (!access_token || !factor_id || !code) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }

    const userClient = await getUserClient(access_token, refresh_token);

    const { data: challenge, error: challengeErr } = await userClient.auth.mfa.challenge({ factorId: factor_id });
    if (challengeErr) return res.status(400).json({ error: challengeErr.message });

    const { data: verifyData, error: verifyErr } = await userClient.auth.mfa.verify({
      factorId:    factor_id,
      challengeId: challenge.id,
      code,
    });
    if (verifyErr) return res.status(401).json({ error: "Code invalide — vérifiez votre application" });

    // Récupérer le profil pour l'audit (utilisateurs ou profils_admin)
    const { data: { user } } = await userClient.auth.getUser();
    let profil = null;
    const { data: u1 } = await supabase.from("utilisateurs").select("*").eq("id", user.id).single();
    if (u1) { profil = u1; }
    else {
      const { data: pa } = await supabase.from("profils_admin").select("*").eq("id", user.id).single();
      profil = pa;
    }

    await supabase.from("audit_admin").insert({
      acteur_id:  user.id,
      acteur_nom: `${profil?.prenom} ${profil?.nom}`,
      action:     "MFA_ENROLEE",
      detail:     "Authentification à 2 facteurs (TOTP) configurée avec succès",
      statut:     "success",
    });

    res.json({ message: "2FA configurée avec succès", session: verifyData.session });
  } catch (err) {
    console.error("MFA enroll confirm error:", err);
    res.status(500).json({ error: "Erreur lors de la confirmation 2FA" });
  }
});


/* ══════════════════════════════════════════════════════════════
   POST /api/admin/mfa/verify
   Vérifie le code TOTP lors d'une connexion (après mot de passe).
   Élève la session de aal1 → aal2.
══════════════════════════════════════════════════════════════ */
router.post("/mfa/verify", async (req, res) => {
  try {
    const { access_token, refresh_token, factor_id, code } = req.body;
    if (!access_token || !factor_id || !code) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }

    const userClient = await getUserClient(access_token, refresh_token);

    const { data: challenge, error: challengeErr } = await userClient.auth.mfa.challenge({ factorId: factor_id });
    if (challengeErr) return res.status(400).json({ error: challengeErr.message });

    const { data: verifyData, error: verifyErr } = await userClient.auth.mfa.verify({
      factorId:    factor_id,
      challengeId: challenge.id,
      code,
    });
    if (verifyErr) return res.status(401).json({ error: "Code invalide ou expiré" });

    // Récupérer le profil complet (utilisateurs ou profils_admin)
    const { data: { user } } = await userClient.auth.getUser();
    let profil = null;
    let source = null;
    const { data: u2 } = await supabase.from("utilisateurs").select("*").eq("id", user.id).single();
    if (u2) { profil = u2; source = "utilisateurs"; }
    else {
      const { data: pa } = await supabase.from("profils_admin").select("*").eq("id", user.id).single();
      if (pa) { profil = { ...pa, role: pa.profil_type }; source = "profils_admin"; }
    }
    if (!profil) return res.status(403).json({ error: "Profil introuvable" });

    const table = source === "utilisateurs" ? "utilisateurs" : "profils_admin";
    await supabase.from(table).update({ derniere_connexion: new Date().toISOString() }).eq("id", user.id);
    await supabase.from("audit_admin").insert({
      acteur_id:  user.id,
      acteur_nom: `${profil.prenom} ${profil.nom}`,
      action:     "LOGIN_MFA",
      detail:     `Connexion 2FA validée — rôle : ${profil.role || profil.profil_type}`,
      ip:         req.headers["x-forwarded-for"] || req.socket.remoteAddress || "—",
      statut:     "success",
    });

    res.json({
      message: "Connexion 2FA réussie",
      session: verifyData.session,
      profil: {
        id:                 profil.id,
        email:              profil.email,
        nom:                profil.nom,
        prenom:             profil.prenom,
        telephone:          profil.telephone,
        role:               profil.role || profil.profil_type,
        scope:              profil.scope,
        departement:        profil.departement,
        actif:              profil.actif,
        twofa_active:       profil.twofa_active ?? profil.twofa_obligatoire ?? false,
        mdp_temporaire:     profil.mdp_temporaire,
        derniere_connexion: profil.derniere_connexion,
        date_creation:      profil.date_creation,
      },
    });
  } catch (err) {
    console.error("MFA verify error:", err);
    res.status(500).json({ error: "Erreur lors de la vérification 2FA" });
  }
});

/* ══════════════════════════════════════════════════════════════
   GET  /api/admin/utilisateurs        — liste tous les utilisateurs
   POST /api/admin/utilisateurs        — crée un utilisateur (super_admin)
   PATCH /api/admin/utilisateurs/:id   — modifie (actif, note…)
══════════════════════════════════════════════════════════════ */
router.get("/utilisateurs", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("utilisateurs")
      .select("id,email,nom,prenom,telephone,role,scope,departement,actif,twofa_active,mdp_temporaire,date_creation,derniere_connexion,note,cree_par_id")
      .order("date_creation", { ascending: false });
    if (error) throw error;
    res.json({ utilisateurs: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération utilisateurs" });
  }
});

router.post("/utilisateurs", authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { nom, prenom, email, telephone, role, scope, departement, note } = req.body;
    if (!nom || !prenom || !email || !role) {
      return res.status(400).json({ error: "Champs requis : nom, prenom, email, role" });
    }

    const mdpTemp = "BET@" + Math.random().toString(36).slice(2, 8).toUpperCase() + "!";

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password: mdpTemp, email_confirm: true,
      app_metadata: { role, actif: true },
      user_metadata: { nom, prenom, telephone },
    });
    if (authError) {
      console.error("❌ createUser error:", JSON.stringify(authError, null, 2));
      return res.status(400).json({ error: authError.message, detail: authError });
    }

    const { data: utilisateur, error: insertError } = await supabase
      .from("utilisateurs")
      .insert({
        id: authData.user.id, email, nom, prenom,
        telephone: telephone || null, role,
        scope: scope || ["national"],
        departement: departement || null,
        actif: true, mdp_temporaire: true,
        mdp_initial: mdpTemp,
        cree_par_id: req.profil.id,
        note: note || null,
      })
      .select().single();

    if (insertError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw insertError;
    }

    await supabase.from("audit_admin").insert({
      acteur_id: req.profil.id,
      acteur_nom: `${req.profil.prenom} ${req.profil.nom}`,
      action: "UTILISATEUR_CREE",
      cible_id: authData.user.id,
      detail: `Utilisateur ${role} créé : ${prenom} ${nom} (${email})`,
      statut: "success",
    });

    res.status(201).json({ message: "Utilisateur créé", utilisateur, mdp_temporaire: mdpTemp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création utilisateur" });
  }
});

router.patch("/utilisateurs/:id", authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { actif, note, scope, departement, twofa_active } = req.body;
    const updates = {};
    if (actif        !== undefined) { updates.actif        = actif;        await supabase.auth.admin.updateUserById(id, { app_metadata: { actif } }); }
    if (note         !== undefined)   updates.note         = note;
    if (scope        !== undefined)   updates.scope        = scope;
    if (departement  !== undefined)   updates.departement  = departement;
    if (twofa_active !== undefined) {
      updates.twofa_active = twofa_active;
      // Si désactivation : supprimer les facteurs TOTP enrôlés dans Supabase Auth
      if (!twofa_active) {
        try {
          const listRes = await fetch(
            `${process.env.SUPABASE_URL}/auth/v1/admin/users/${id}/factors`,
            { headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`, apikey: process.env.SUPABASE_SERVICE_KEY } }
          );
          const { factors } = await listRes.json();
          if (Array.isArray(factors) && factors.length > 0) {
            await Promise.allSettled(factors.map(f =>
              fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${id}/factors/${f.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`, apikey: process.env.SUPABASE_SERVICE_KEY },
              })
            ));
            console.log(`[2FA] Facteurs TOTP supprimés pour user ${id} (${factors.length} facteur(s))`);
          }
        } catch (e) {
          console.warn("[2FA] Impossible de supprimer les facteurs TOTP:", e.message);
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Aucun champ à mettre à jour" });
    }

    const { data, error } = await supabase.from("utilisateurs").update(updates).eq("id", id).select().single();
    if (error) {
      console.error("PATCH utilisateur error:", JSON.stringify(error));
      throw error;
    }
    res.json({ message: "Utilisateur mis à jour", utilisateur: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour utilisateur" });
  }
});


/* ══════════════════════════════════════════════════════════════
   POST /api/admin/utilisateurs/:id/renvoyer-acces
   Retourne email + mdp_initial stocké pour que le superadmin
   puisse les retransmettre manuellement à l'utilisateur.
══════════════════════════════════════════════════════════════ */
router.post("/utilisateurs/:id/renvoyer-acces", authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: u, error } = await supabase
      .from("utilisateurs")
      .select("id, email, nom, prenom, role, mdp_initial, mdp_temporaire")
      .eq("id", id)
      .single();
    if (error || !u) return res.status(404).json({ error: "Utilisateur introuvable" });
    if (!u.mdp_initial) return res.status(400).json({ error: "Aucun mot de passe initial enregistré pour cet utilisateur" });

    supabase.from("audit_admin").insert({
      acteur_id:  req.profil.id,
      acteur_nom: `${req.profil.prenom} ${req.profil.nom}`,
      action:     "ACCES_RENVOYES",
      cible_id:   id,
      detail:     `Accès renvoyés pour ${u.prenom} ${u.nom} (${u.email})`,
      statut:     "warning",
    }).then(() => {}).catch(() => {});

    res.json({ email: u.email, mdp_initial: u.mdp_initial, nom: `${u.prenom} ${u.nom}`, role: u.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur renvoi accès" });
  }
});


/* ══════════════════════════════════════════════════════════════
   GET /api/admin/permissions-matrice
   Renvoie la matrice permissions_roles transformée en objet
   { role: { module: { peut_lire, peut_creer, ... } } }
══════════════════════════════════════════════════════════════ */
router.get("/permissions-matrice", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("permissions_roles")
      .select("role,module,peut_lire,peut_creer,peut_modifier,peut_supprimer,peut_gerer")
      .order("role").order("module");
    if (error) throw error;

    const matrice = {};
    for (const row of data) {
      if (!matrice[row.role]) matrice[row.role] = {};
      matrice[row.role][row.module] = {
        read:   row.peut_lire,
        create: row.peut_creer,
        update: row.peut_modifier,
        delete: row.peut_supprimer,
        manage: row.peut_gerer,
      };
    }
    res.json({ matrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération permissions" });
  }
});

export default router;
