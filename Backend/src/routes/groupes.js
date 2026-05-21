import express from "express";
import { createClient } from "@supabase/supabase-js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function sendNotif(userId, notif) {
  if (!userId) return;
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type:    notif.type    || "info",
      titre:   notif.titre   || "",
      message: notif.message || "",
      lu:      false,
      meta:    notif.meta    || null,
    });
  } catch (e) {
    console.warn("[groupes] Notification Supabase échouée:", e.message);
  }
}

/* ══════════════════════════════════════════════════════════════
   GET /api/groupes          — liste (filtrable par coach_id, statut)
   GET /api/groupes/:id      — détail avec apprenants
══════════════════════════════════════════════════════════════ */
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const { coach_id, statut, centre_id } = req.query;
    let q = supabase.from("groupes").select("*").order("created_at", { ascending: false });
    if (coach_id)  q = q.eq("coach_id", coach_id);
    if (statut)    q = q.eq("statut", statut);
    if (centre_id) q = q.eq("centre_id", centre_id);

    // Coach ne voit que ses groupes
    if (req.role === "coach") q = q.eq("coach_id", req.profil.id);

    const { data, error } = await q;
    if (error) throw error;

    // Compter les apprenants actifs pour chaque groupe
    const ids = data.map(g => g.id);
    let counts = {};
    if (ids.length) {
      const { data: cnt } = await supabase
        .from("groupes_apprenants")
        .select("groupe_id")
        .in("groupe_id", ids)
        .eq("statut", "actif");
      (cnt || []).forEach(r => { counts[r.groupe_id] = (counts[r.groupe_id] || 0) + 1; });
    }

    res.json({ groupes: data.map(g => ({ ...g, nb_apprenants: counts[g.id] || 0 })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération groupes" });
  }
});

router.get("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: groupe, error } = await supabase.from("groupes").select("*").eq("id", id).single();
    if (error || !groupe) return res.status(404).json({ error: "Groupe introuvable" });

    if (req.role === "coach" && groupe.coach_id !== req.profil.id)
      return res.status(403).json({ error: "Accès refusé" });

    const { data: apprenants } = await supabase
      .from("groupes_apprenants").select("*").eq("groupe_id", id).order("date_ajout");

    const { data: fichiers } = await supabase
      .from("groupes_fichiers").select("*").eq("groupe_id", id).order("created_at", { ascending: false });

    // Enrichir chaque apprenant avec le nom de l'assistante (added_by → utilisateurs)
    const assistantIds = [...new Set((apprenants || []).map(a => a.added_by).filter(Boolean))];
    let assistants = {};
    if (assistantIds.length) {
      const { data: users } = await supabase
        .from("utilisateurs").select("id,nom,prenom,role").in("id", assistantIds);
      (users || []).forEach(u => { assistants[u.id] = `${u.prenom} ${u.nom}`; });
    }

    const apprenantesEnrichis = (apprenants || []).map(a => ({
      ...a,
      assistante_nom: a.added_by ? (assistants[a.added_by] || null) : null,
    }));

    res.json({ groupe, apprenants: apprenantesEnrichis, fichiers: fichiers || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération groupe" });
  }
});

/* ══════════════════════════════════════════════════════════════
   GET  /api/groupes/:id/presences          — historique par date
   POST /api/groupes/:id/presences          — sauvegarder une séance
══════════════════════════════════════════════════════════════ */
router.get("/:id/presences", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("groupes_presences").select("*").eq("groupe_id", id)
      .order("date_seance", { ascending: false });
    if (error) throw error;
    // Regrouper par date de séance
    const parDate = {};
    (data || []).forEach(p => {
      if (!parDate[p.date_seance]) parDate[p.date_seance] = [];
      parDate[p.date_seance].push(p);
    });
    res.json({ presences: data || [], parDate });
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération présences" });
  }
});

router.post("/:id/presences", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { date_seance, liste } = req.body;
    // liste = [{ ga_id, nom_apprenant, prenom_apprenant, statut, note }]
    if (!date_seance || !Array.isArray(liste) || !liste.length)
      return res.status(400).json({ error: "date_seance et liste[] requis" });

    // Supprimer l'éventuelle feuille existante pour cette date (upsert manuel)
    await supabase.from("groupes_presences").delete()
      .eq("groupe_id", id).eq("date_seance", date_seance);

    const rows = liste.map(l => ({
      groupe_id:        id,
      ga_id:            l.ga_id || null,
      nom_apprenant:    l.nom_apprenant,
      prenom_apprenant: l.prenom_apprenant || null,
      date_seance,
      statut:           l.statut || "present",
      note:             l.note || null,
      created_by:       req.profil.id,
    }));

    const { data, error } = await supabase.from("groupes_presences").insert(rows).select();
    if (error) throw error;
    res.status(201).json({ message: "Présences enregistrées", presences: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur enregistrement présences" });
  }
});

/* ══════════════════════════════════════════════════════════════
   POST /api/groupes — créer un groupe (onboarding / admin)
══════════════════════════════════════════════════════════════ */
router.post("/", authenticateAdmin, async (req, res) => {
  try {
    const { nom, niveau, filiere, type_cours, coach_id, centre_id, horaire, date_debut, date_fin, capacite_max } = req.body;
    if (!nom) return res.status(400).json({ error: "Le nom du groupe est requis" });

    const { data: groupe, error } = await supabase
      .from("groupes")
      .insert({ nom, niveau, filiere, type_cours: type_cours || "en_ligne", coach_id: coach_id || null, centre_id: centre_id || null, horaire: horaire || [], date_debut: date_debut || null, date_fin: date_fin || null, capacite_max: capacite_max || 20, statut: "actif", created_by: req.profil.id })
      .select().single();

    if (error) throw error;

    // Notifier le coach assigné
    if (coach_id) {
      await sendNotif(coach_id, {
        type: "assignation",
        titre: "Nouveau groupe assigné",
        message: `Le groupe "${nom}" ${niveau ? `(${niveau})` : ""} vous a été assigné. ${date_debut ? `Début : ${date_debut}.` : ""}`,
      });
    }

    res.status(201).json({ message: "Groupe créé", groupe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création groupe" });
  }
});

/* ══════════════════════════════════════════════════════════════
   PATCH /api/groupes/:id — modifier un groupe
══════════════════════════════════════════════════════════════ */
router.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["nom","niveau","filiere","type_cours","coach_id","centre_id","horaire","date_debut","date_fin","statut","capacite_max"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const { data: ancien } = await supabase.from("groupes").select("coach_id,nom").eq("id", id).single();

    const { data, error } = await supabase.from("groupes").update(updates).eq("id", id).select().single();
    if (error) throw error;

    // Si le coach change, notifier le nouveau
    if (updates.coach_id && updates.coach_id !== ancien?.coach_id) {
      await sendNotif(updates.coach_id, {
        type: "assignation",
        titre: "Nouveau groupe assigné",
        message: `Le groupe "${ancien?.nom || data.nom}" vous a été assigné.`,
      });
    }

    res.json({ message: "Groupe mis à jour", groupe: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour groupe" });
  }
});

/* ══════════════════════════════════════════════════════════════
   POST /api/groupes/:id/apprenants — ajouter un apprenant
══════════════════════════════════════════════════════════════ */
router.post("/:id/apprenants", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_apprenant, prenom_apprenant, email_apprenant, telephone, niveau, note, apprenant_id } = req.body;
    if (!nom_apprenant) return res.status(400).json({ error: "nom_apprenant requis" });

    const { data: groupe } = await supabase.from("groupes").select("coach_id,nom,niveau").eq("id", id).single();
    if (!groupe) return res.status(404).json({ error: "Groupe introuvable" });

    const { data, error } = await supabase
      .from("groupes_apprenants")
      .insert({ groupe_id: id, apprenant_id: apprenant_id || null, nom_apprenant, prenom_apprenant: prenom_apprenant || null, email_apprenant: email_apprenant || null, telephone: telephone || null, niveau: niveau || groupe.niveau, note: note || null, statut: "actif", added_by: req.profil.id })
      .select().single();
    if (error) throw error;

    // Notifier le coach
    if (groupe.coach_id) {
      const nomComplet = [prenom_apprenant, nom_apprenant].filter(Boolean).join(" ");
      await sendNotif(groupe.coach_id, {
        type: "inscription",
        titre: "Nouvel apprenant dans votre groupe",
        message: `${nomComplet} a été ajouté(e) au groupe "${groupe.nom}".`,
      });
    }

    res.status(201).json({ message: "Apprenant ajouté", apprenant: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur ajout apprenant" });
  }
});

/* ══════════════════════════════════════════════════════════════
   DELETE /api/groupes/:id/apprenants/:aid — retirer un apprenant
══════════════════════════════════════════════════════════════ */
router.delete("/:id/apprenants/:aid", authenticateAdmin, async (req, res) => {
  try {
    const { id, aid } = req.params;

    const { data: apprenant } = await supabase.from("groupes_apprenants").select("*").eq("id", aid).single();
    const { data: groupe }    = await supabase.from("groupes").select("coach_id,nom").eq("id", id).single();

    await supabase.from("groupes_apprenants")
      .update({ statut: "retire", date_retrait: new Date().toISOString() })
      .eq("id", aid);

    if (groupe?.coach_id && apprenant) {
      const nomComplet = [apprenant.prenom_apprenant, apprenant.nom_apprenant].filter(Boolean).join(" ");
      await sendNotif(groupe.coach_id, {
        type: "alerte",
        titre: "Apprenant retiré de votre groupe",
        message: `${nomComplet} a été retiré(e) du groupe "${groupe.nom}".`,
      });
    }

    res.json({ message: "Apprenant retiré" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur retrait apprenant" });
  }
});

/* ══════════════════════════════════════════════════════════════
   POST /api/groupes/:id/fichiers — partager un fichier
   DELETE /api/groupes/:id/fichiers/:fid — supprimer un fichier
══════════════════════════════════════════════════════════════ */
router.post("/:id/fichiers", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, url, public_id, type_fichier, taille_ko } = req.body;
    if (!nom || !url) return res.status(400).json({ error: "nom et url requis" });

    const { data, error } = await supabase
      .from("groupes_fichiers")
      .insert({ groupe_id: id, coach_id: req.profil.id, nom, url, public_id: public_id || null, type_fichier: type_fichier || "autre", taille_ko: taille_ko || null })
      .select().single();
    if (error) throw error;

    res.status(201).json({ message: "Fichier partagé", fichier: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur partage fichier" });
  }
});

router.delete("/:id/fichiers/:fid", authenticateAdmin, async (req, res) => {
  try {
    await supabase.from("groupes_fichiers").delete().eq("id", req.params.fid);
    res.json({ message: "Fichier supprimé" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression fichier" });
  }
});

/* ══════════════════════════════════════════════════════════════
   GET  /api/groupes/:id/cours         — historique des cours
   POST /api/groupes/:id/cours         — ajouter / mettre à jour un cours
   PATCH /api/groupes/:id/cours/:cid   — modifier une entrée
   DELETE /api/groupes/:id/cours/:cid  — supprimer une entrée
══════════════════════════════════════════════════════════════ */
router.get("/:id/cours", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { mois, annee } = req.query; // optionnel : filtrage par mois/année
    let q = supabase.from("groupes_cours").select("*").eq("groupe_id", id).order("date_cours", { ascending: false });
    if (mois && annee) {
      const debut = `${annee}-${String(mois).padStart(2,"0")}-01`;
      const fin   = new Date(annee, mois, 0).toISOString().slice(0,10);
      q = q.gte("date_cours", debut).lte("date_cours", fin);
    }
    const { data, error } = await q;
    if (error) throw error;
    res.json({ cours: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération historique cours" });
  }
});

router.post("/:id/cours", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { date_cours, objectif, grammaire, sujet_discussion, statut, commentaire } = req.body;
    if (!date_cours) return res.status(400).json({ error: "date_cours requis" });

    const STATUTS = ["dispense","annule","apprenant_absent","coach_absent","catch_up","holiday"];
    if (statut && !STATUTS.includes(statut))
      return res.status(400).json({ error: `statut invalide. Valeurs : ${STATUTS.join(", ")}` });

    const { data, error } = await supabase.from("groupes_cours")
      .insert({ groupe_id:id, coach_id:req.profil.id, date_cours, objectif:objectif||null, grammaire:grammaire||null, sujet_discussion:sujet_discussion||null, statut:statut||"dispense", commentaire:commentaire||null })
      .select().single();
    if (error) throw error;
    res.status(201).json({ message: "Cours ajouté", cours: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur ajout cours" });
  }
});

router.patch("/:id/cours/:cid", authenticateAdmin, async (req, res) => {
  try {
    const { cid } = req.params;
    const allowed = ["date_cours","objectif","grammaire","sujet_discussion","statut","commentaire"];
    const updates = { updated_at: new Date().toISOString() };
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const { data, error } = await supabase.from("groupes_cours").update(updates).eq("id", cid).select().single();
    if (error) throw error;
    res.json({ message: "Cours mis à jour", cours: data });
  } catch (err) {
    res.status(500).json({ error: "Erreur mise à jour cours" });
  }
});

router.delete("/:id/cours/:cid", authenticateAdmin, async (req, res) => {
  try {
    await supabase.from("groupes_cours").delete().eq("id", req.params.cid);
    res.json({ message: "Cours supprimé" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression cours" });
  }
});

export default router;
