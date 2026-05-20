import express from "express";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
console.log("✅ Route parcours chargée");

// ── Helpers ──────────────────────────────────────────────────

// Compte les assignations d'aujourd'hui pour chaque assistante
async function getQuotasAujourdHui() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("assignations_parcours")
    .select("assistante_id")
    .gte("created_at", today.toISOString());
  const counts = {};
  (data || []).forEach(a => {
    counts[a.assistante_id] = (counts[a.assistante_id] || 0) + 1;
  });
  return counts;
}

// Détermine si aujourd'hui est semaine ou weekend
function typeSemaineAujourdhui() {
  const day = new Date().getDay(); // 0=dim, 6=sam
  return day === 0 || day === 6 ? "weekend" : "semaine";
}

// Retourne le nom du jour courant en français
function jourAujourdhui() {
  const jours = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  return jours[new Date().getDay()];
}

// Enrichit photo_url avec avatar_url de la table utilisateurs si absent
async function mergeAvatarUrls(list) {
  const sans = list.filter(a => !a.photo_url && a.email);
  if (!sans.length) return list;
  const emails = sans.map(a => a.email);
  const { data: users } = await supabase
    .from("utilisateurs")
    .select("email, avatar_url")
    .in("email", emails);
  const map = {};
  (users || []).forEach(u => { if (u.avatar_url) map[u.email] = u.avatar_url; });
  return list.map(a => (!a.photo_url && map[a.email]) ? { ...a, photo_url: map[a.email] } : a);
}

// ── GET /api/parcours/assistantes-ligne ──────────────────────
// Retourne les assistantes disponibles pour le cours en ligne
// Query: ?type_coaching=groupe|prive
router.get("/assistantes-ligne", async (req, res) => {
  try {
    const { profil } = req.query; // optionnel : "b2c" | "b2b" | "les_deux"

    let query = supabase
      .from("assistantes")
      .select("id, nom, prenom, email, telephone, photo_url, quota_jour, jours_travail, profil")
      .eq("actif", true)
      .in("type_cours", ["en_ligne", "les_deux"])
      .order("created_at", { ascending: true });

    if (profil) {
      query = query.in("profil", [profil, "les_deux"]);
    }

    const { data: assistantes, error } = await query;

    if (error) throw error;

    const quotas = await getQuotasAujourdHui();
    const aujourd = jourAujourdhui();

    // Filtrer : quota non atteint ET travaille aujourd'hui
    const disponibles = (assistantes || []).filter(a => {
      const prises = quotas[a.id] || 0;
      const travailleAujourdHui = !a.jours_travail || a.jours_travail.includes(aujourd);
      return prises < a.quota_jour && travailleAujourdHui;
    });

    // Rotation : décaler selon le nombre total d'assignations du jour
    const totalAujourdHui = Object.values(quotas).reduce((s, v) => s + v, 0);
    const offset = disponibles.length > 0 ? totalAujourdHui % disponibles.length : 0;
    const rotated = [...disponibles.slice(offset), ...disponibles.slice(0, offset)];

    const enriched = await mergeAvatarUrls(rotated);
    res.json({
      assistantes: enriched.map(a => ({
        ...a,
        prises_aujourd_hui: quotas[a.id] || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/parcours/assistantes-pa ─────────────────────────
// Retourne les assistantes de profil "pa" (Pedagogical Advisor)
// utilisé par le formulaire domicile pour auto-assigner le prospect
router.get("/assistantes-pa", async (req, res) => {
  try {
    const { data: assistantes, error } = await supabase
      .from("assistantes")
      .select("id, nom, prenom, email, telephone, photo_url")
      .eq("actif", true)
      .eq("profil", "pa")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const enriched = await mergeAvatarUrls(assistantes || []);
    res.json({ assistantes: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/parcours/assistantes-presentiel/:centreId ───────
// ?liste=true → retourne toutes les assistantes disponibles (pour affichage liste)
// Sans paramètre  → retourne 1 assistante via rotation (comportement ParcoursModal)
router.get("/assistantes-presentiel/:centreId", async (req, res) => {
  try {
    const { centreId } = req.params;
    const { liste, tous } = req.query;
    const aujourd = jourAujourdhui();
    const joursWeekend = ["samedi", "dimanche"];
    const estWeekend = joursWeekend.includes(aujourd);
    const periodeJour = estWeekend ? "weekend" : "semaine";

    const { data: assistantes, error } = await supabase
      .from("assistantes")
      .select("id, nom, prenom, email, telephone, photo_url, quota_jour, jours_travail")
      .eq("actif", true)
      .eq("centre_id", centreId)
      .in("type_cours", ["presentiel", "les_deux"])
      .order("created_at", { ascending: true });

    if (error) throw error;

    const quotas = await getQuotasAujourdHui();

    // Mode "tous" : TOUTES les assistantes actives du centre, sans filtre jour/quota
    // ⚠️ Ce check doit être AVANT le filtre disponibles pour ne pas être bloqué par le quota
    if (tous === "true") {
      const enriched = await mergeAvatarUrls(assistantes || []);
      return res.json({
        assistantes: enriched.map(a => ({ ...a, prises_aujourd_hui: quotas[a.id] || 0 })),
        periode: periodeJour,
      });
    }

    // Filtrer les assistantes qui travaillent aujourd'hui ET dont le quota n'est pas atteint
    const disponibles = (assistantes || []).filter(a => {
      const travailleAujourdHui = !a.jours_travail || a.jours_travail.includes(aujourd);
      return travailleAujourdHui && (quotas[a.id] || 0) < a.quota_jour;
    });

    if (disponibles.length === 0) {
      return res.json({
        assistante:  null,
        assistantes: [],
        periode: periodeJour,
        message: `Aucune assistante ${periodeJour === "weekend" ? "week-end" : "semaine"} disponible pour ce centre aujourd'hui. Veuillez nous contacter directement.`,
      });
    }

    // Mode liste : retourner toutes les assistantes disponibles (filtrées par jour)
    if (liste === "true") {
      const enriched = await mergeAvatarUrls(disponibles);
      return res.json({
        assistantes: enriched.map(a => ({ ...a, prises_aujourd_hui: quotas[a.id] || 0 })),
        periode: periodeJour,
      });
    }

    // Mode rotation (ParcoursModal) : 1 assistante selon l'index du jour
    const totalAujourdHui = Object.values(quotas).reduce((s, v) => s + v, 0);
    const offset = totalAujourdHui % disponibles.length;
    const assistante = disponibles[offset];
    const enrichedAll = await mergeAvatarUrls(disponibles);
    const enrichedOne = enrichedAll.find(a => a.id === assistante.id) || assistante;

    res.json({
      assistante: { ...enrichedOne, prises_aujourd_hui: quotas[assistante.id] || 0 },
      assistantes: enrichedAll.map(a => ({ ...a, prises_aujourd_hui: quotas[a.id] || 0 })),
      periode: periodeJour,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/parcours/centres ────────────────────────────────
// Liste des centres actifs avec le nombre d'assistantes dispo
router.get("/centres", async (req, res) => {
  try {
    const { data: centres, error } = await supabase
      .from("centres")
      .select("id, nom, ville, adresse")
      .eq("actif", true)
      .order("nom");
    if (error) throw error;
    res.json({ centres: centres || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/parcours/mon-assignation?email=xxx ──────────────
// Récupère la dernière assignation d'un prospect (public, par email)
router.get("/mon-assignation", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email requis" });
  try {
    const { data, error } = await supabase
      .from("assignations_parcours")
      .select("id, type_cours, type_coaching, statut, created_at, source, assistantes(id, nom, prenom, telephone, photo_url), centres(id, nom)")
      .ilike("prospect_email", email.trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.json({ assignation: null });

    res.json({
      assignation: {
        assignation_id:    data.id,
        assistante_id:     data.assistantes?.id,
        assistante_prenom: data.assistantes?.prenom,
        assistante_nom:    data.assistantes?.nom,
        assistante_photo:  data.assistantes?.photo_url || null,
        assistante_tel:    data.assistantes?.telephone || null,
        type_cours:        data.type_cours,
        type_coaching:     data.type_coaching || null,
        centre_id:         data.centres?.id || null,
        centre_nom:        data.centres?.nom || null,
        date:              data.created_at,
        source:            data.source || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/parcours/assignation ───────────────────────────
// Crée une assignation prospect → assistante
router.post("/assignation", async (req, res) => {
  try {
    const {
      assistante_id,
      prospect_nom,
      prospect_email,
      prospect_telephone,
      type_cours,
      type_coaching,
      centre_id,
      source,
    } = req.body;

    if (!assistante_id || !prospect_nom || !type_cours) {
      return res.status(400).json({ error: "assistante_id, prospect_nom et type_cours sont requis" });
    }

    // Vérifier que l'assistante existe et est active
    const { data: assistante, error: aErr } = await supabase
      .from("assistantes")
      .select("id, nom, prenom, email, telephone, photo_url, quota_jour")
      .eq("id", assistante_id)
      .eq("actif", true)
      .single();

    if (aErr || !assistante) {
      return res.status(404).json({ error: "Assistante introuvable ou inactive" });
    }

    // Vérifier le quota du jour
    const quotas = await getQuotasAujourdHui();
    if ((quotas[assistante_id] || 0) >= assistante.quota_jour) {
      return res.status(409).json({ error: "Cette assistante a atteint son quota pour aujourd'hui" });
    }

    // Créer l'assignation
    const { data: assignation, error: insErr } = await supabase
      .from("assignations_parcours")
      .insert({
        assistante_id,
        prospect_nom: prospect_nom.trim(),
        prospect_email: prospect_email?.trim() || null,
        prospect_telephone: prospect_telephone?.trim() || null,
        type_cours,
        type_coaching: type_coaching || null,
        centre_id: centre_id || null,
        source: source || null,
        statut: "en_attente",
      })
      .select()
      .single();

    if (insErr) throw insErr;

    // Retrouver l'ID utilisateurs de l'assistante (pour lier le test de niveau)
    let utilisateurId = null;
    if (assistante.email) {
      const { data: u } = await supabase
        .from("utilisateurs")
        .select("id")
        .eq("email", assistante.email)
        .eq("role", "commercial")
        .maybeSingle();
      utilisateurId = u?.id || null;
    }

    res.status(201).json({
      assignation,
      assistante: { ...assistante, utilisateur_id: utilisateurId },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/parcours/assignations/recentes ───────────────────
// Pour le poller de notification — filtré par assistante si commercial
router.get("/assignations/recentes", authenticateAdmin, async (req, res) => {
  try {
    const ROLES_GLOBAUX = ["super_admin", "admin", "responsable", "gestionnaire", "manager"];
    const isGlobal = ROLES_GLOBAUX.includes(req.role);

    let query = supabase
      .from("assignations_parcours")
      .select("id, prospect_nom, prospect_email, prospect_telephone, type_cours, type_coaching, statut, source, created_at, assistantes(nom, prenom)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!isGlobal) {
      const { data: ass } = await supabase.from("assistantes").select("id").eq("email", req.profil.email).maybeSingle();
      if (!ass) return res.json({ assignations: [] });
      query = query.eq("assistante_id", ass.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({
      assignations: (data || []).map(a => ({
        ...a,
        assistante_nom: a.assistantes ? `${a.assistantes.prenom} ${a.assistantes.nom}` : "—",
        assistantes: undefined,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/parcours/assignations ───────────────────────────
// Super admin / admin / responsable + PA → toutes les assignations (avec filtre type_cours)
// Commercial → uniquement celles de son assistante (par email)
router.get("/assignations", authenticateAdmin, async (req, res) => {
  try {
    const { statut, type_cours } = req.query;
    const ROLES_GLOBAUX = ["super_admin", "admin", "responsable", "gestionnaire", "manager", "pedagogical_advisor"];
    const isGlobal = ROLES_GLOBAUX.includes(req.role);
    const isPa = req.role === "pedagogical_advisor";

    let assistanteId = null;
    if (!isGlobal) {
      // Trouver l'assistante liée au compte connecté via l'email
      const { data: ass } = await supabase
        .from("assistantes")
        .select("id")
        .eq("email", req.profil.email)
        .maybeSingle();

      if (!ass) {
        // Aucune assistante trouvée pour ce compte → liste vide
        return res.json({ assignations: [] });
      }
      assistanteId = ass.id;
    }

    const BASE_SELECT  = "id, prospect_nom, prospect_email, prospect_telephone, type_cours, type_coaching, centre_id, statut, statut_paiement, mode_paiement, source, created_at, assistantes(id, nom, prenom, telephone), centres(nom)";
    const FULL_SELECT  = BASE_SELECT.replace("created_at,", "documents_dossier, suivi_demarrage, suivi_presences, plan_paiement, created_at,");

    const buildQuery = (select) => {
      let q = supabase.from("assignations_parcours").select(select).order("created_at", { ascending: false });
      if (assistanteId) q = q.eq("assistante_id", assistanteId);
      if (statut     && statut     !== "tous") q = q.eq("statut",     statut);
      // PA voit uniquement les cours domicile, sauf filtre explicite différent
      const tcFilter = isPa ? (type_cours && type_cours !== "tous" ? type_cours : "domicile") : (type_cours && type_cours !== "tous" ? type_cours : null);
      if (tcFilter) q = q.eq("type_cours", tcFilter);
      return q;
    };

    let { data, error } = await buildQuery(FULL_SELECT);

    // Fallback si la migration documents_dossier n'a pas encore été exécutée
    if (error) ({ data, error } = await buildQuery(BASE_SELECT));
    if (error) throw error;

    const mapRow = (a) => ({
      ...a,
      documents_dossier: a.documents_dossier ?? [],
      suivi_demarrage:   a.suivi_demarrage   ?? null,
      suivi_presences:   a.suivi_presences   ?? null,
      plan_paiement:     a.plan_paiement     ?? null,
      assistante_nom: a.assistantes ? `${a.assistantes.prenom} ${a.assistantes.nom}` : "—",
      assistante_tel: a.assistantes?.telephone || null,
      centre_nom:     a.centres?.nom || null,
      assistantes: undefined,
      centres: undefined,
    });

    res.json({ assignations: (data || []).map(mapRow) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/parcours/assignations/:id ─────────────────────
// Un commercial ne peut modifier que ses propres assignations
router.patch("/assignations/:id", authenticateAdmin, async (req, res) => {
  try {
    const ROLES_GLOBAUX = ["super_admin", "admin", "responsable", "gestionnaire", "manager", "pedagogical_advisor"];
    const isGlobal = ROLES_GLOBAUX.includes(req.role);

    let query = supabase.from("assignations_parcours").select("assistante_id").eq("id", req.params.id).single();
    const { data: existing, error: selErr } = await query;
    if (selErr || !existing) return res.status(404).json({ error: "Assignation introuvable" });

    if (!isGlobal) {
      const { data: ass } = await supabase.from("assistantes").select("id").eq("email", req.profil.email).maybeSingle();
      if (!ass || ass.id !== existing.assistante_id) {
        return res.status(403).json({ error: "Accès refusé — ce prospect ne vous appartient pas" });
      }
    }

    const allowed = ["statut", "mode_paiement", "statut_paiement", "documents_dossier", "suivi_demarrage", "suivi_presences", "plan_paiement", "notes_coach"];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const { data, error } = await supabase
      .from("assignations_parcours")
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

// ── GET /api/parcours/assistantes (admin) ────────────────────
router.get("/assistantes", authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("assistantes")
      .select("*, centres(nom)")
      .order("created_at");
    if (error) throw error;
    res.json({
      assistantes: (data || []).map(a => ({
        ...a,
        centre_nom: a.centres?.nom || null,
        centres: undefined,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/parcours/assistantes/:id (admin) ──────────────
router.patch("/assistantes/:id", authenticateAdmin, async (req, res) => {
  try {
    const allowed = ["nom", "prenom", "email", "telephone", "photo_url", "quota_jour", "actif", "type_cours", "type_semaine", "centre_id", "jours_travail", "profil"];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const { data, error } = await supabase
      .from("assistantes")
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

export default router;
