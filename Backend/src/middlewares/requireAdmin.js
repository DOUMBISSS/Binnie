import supabase from "../config/supabase.js";

/* ══════════════════════════════════════════════════════════════
   MIDDLEWARES DE CONTRÔLE DES ACCÈS ADMIN
   Principe : le rôle est lu depuis app_metadata (côté serveur,
   non modifiable par l'utilisateur) ET vérifié en base.
══════════════════════════════════════════════════════════════ */

// ── 1. Extraire et valider le token JWT ──────────────────────
export const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant ou invalide" });
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }

  const ROLES_ADMIN_VALIDES = [
    // Nouveaux rôles (table utilisateurs)
    "super_admin", "admin", "manager", "responsable",
    "commercial", "gestionnaire", "coach", "data_collector",
    "superviseur", "pedagogical_advisor", "onboarding",
    "rh", "comptable", "customer_care",
    // Anciens rôles (table profils_admin)
    "admin_pedagogique", "admin_financier", "admin_rh",
    "admin_commercial", "responsable_centre", "observateur",
  ];

  const role = user.app_metadata?.role;
  if (!role || !ROLES_ADMIN_VALIDES.includes(role)) {
    return res.status(403).json({
      error: "Accès refusé — ce compte n'est pas un compte administrateur"
    });
  }

  // Chercher le profil dans `utilisateurs` d'abord, puis `profils_admin`
  let profil = null;
  let roleEffectif = role;

  const { data: u } = await supabase
    .from("utilisateurs")
    .select("*")
    .eq("id", user.id)
    .single();

  if (u) {
    profil = u;
    roleEffectif = u.role;
  } else {
    const { data: pa } = await supabase
      .from("profils_admin")
      .select("*")
      .eq("id", user.id)
      .single();
    if (pa) {
      profil = pa;
      roleEffectif = pa.profil_type;
    }
  }

  // ── Auto-réparation : profil absent mais rôle valide dans app_metadata
  if (!profil) {
    const DEPT_PAR_ROLE = {
      super_admin:"Direction Générale", admin:"Administration",
      manager:"Management", superviseur:"Supervision",
      responsable:"Responsable de Centre", pedagogical_advisor:"Conseil Pédagogique",
      commercial:"Commercial / Assistante", onboarding:"Onboarding & Classes",
      gestionnaire:"Gestion Administrative", rh:"Ressources Humaines / Paie",
      comptable:"Comptabilité / Trésorerie", coach:"Pédagogie",
      customer_care:"Customer Care", data_collector:"Collecte de Données",
    };
    const nomMeta    = user.user_metadata?.nom    || user.email.split("@")[0];
    const prenomMeta = user.user_metadata?.prenom || "Admin";
    const { data: created } = await supabase
      .from("utilisateurs")
      .upsert({
        id: user.id, email: user.email,
        nom: nomMeta, prenom: prenomMeta,
        role, scope: ["national"],
        departement: DEPT_PAR_ROLE[role] || null,
        actif: true, mdp_temporaire: false,
      }, { onConflict: "id" })
      .select()
      .single();
    if (!created) {
      return res.status(403).json({ error: "Profil introuvable — contactez le Super Admin" });
    }
    profil = created;
    roleEffectif = created.role;
    console.log(`[MIDDLEWARE AUTO-REPAIR] Profil recréé pour ${user.email} (rôle: ${role})`);
  }

  if (!profil.actif) {
    return res.status(403).json({ error: "Compte désactivé — contactez le Super Admin" });
  }

  req.user   = user;
  req.profil = { ...profil, role: roleEffectif };
  req.role   = roleEffectif;
  next();
};


// ── 2. Vérifier que c'est UNIQUEMENT le super_admin ─────────
export const requireSuperAdmin = (req, res, next) => {
  if (req.role !== "super_admin") {
    return res.status(403).json({
      error: "Action réservée au Super Admin uniquement"
    });
  }
  next();
};


// ── 3. Vérifier qu'il a accès à un module + une action ──────
//    Usage : requirePermission("cours", "create")
export const requirePermission = (module, action) => {
  return (req, res, next) => {
    // Le super_admin a toujours accès à tout
    if (req.role === "super_admin") return next();

    const perms = req.profil?.permissions?.[module];
    if (!perms || !perms[action]) {
      return res.status(403).json({
        error: `Permission refusée — action '${action}' sur '${module}' non autorisée pour ce profil`
      });
    }
    next();
  };
};


// ── 4. Vérifier que le profil couvre le périmètre demandé ───
//    Usage : requireScope("angre")
export const requireScope = (centreId) => {
  return (req, res, next) => {
    if (req.role === "super_admin") return next();

    const scope = req.profil?.scope || [];
    if (scope.includes("national") || scope.includes(centreId)) {
      return next();
    }
    return res.status(403).json({
      error: `Accès refusé — votre profil ne couvre pas le centre '${centreId}'`
    });
  };
};
