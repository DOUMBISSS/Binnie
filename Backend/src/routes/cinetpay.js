import express from "express";
import fetch   from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import supabase from "../config/supabase.js";
import { authenticateAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();
console.log("✅ Route cinetpay chargée");

// ── Variables d'environnement ─────────────────────────────────
const CINETPAY_APIKEY  = process.env.CINETPAY_APIKEY;
const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID;
const FRONTEND_URL     = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL      = process.env.BACKEND_URL  || "http://localhost:5001";

// ── POST /initiate ────────────────────────────────────────────
// Le frontend appelle cette route pour démarrer un paiement CinetPay
// Body : { client_nom, client_prenom, client_email, client_telephone, client_ville,
//          offre_key, offre_label, offre_formule, offre_type, niveau, objectif, message, montant }
router.post("/initiate", async (req, res) => {
  try {
    const {
      client_nom, client_prenom, client_email, client_telephone, client_ville,
      offre_key, offre_label, offre_formule, offre_type,
      niveau, objectif, message,
      montant,
    } = req.body;

    if (!client_nom?.trim())  return res.status(400).json({ error: "Nom du client requis" });
    if (!client_email?.trim()) return res.status(400).json({ error: "Email du client requis" });
    if (!montant || montant <= 0) return res.status(400).json({ error: "Montant invalide" });

    const transaction_id = `BET-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // 1. Sauvegarder d'abord en base (statut: en_attente)
    const { error: dbErr } = await supabase.from("paiements_cinetpay").insert({
      transaction_id,
      client_nom:       client_nom.trim(),
      client_prenom:    client_prenom?.trim()    || null,
      client_email:     client_email.trim().toLowerCase(),
      client_telephone: client_telephone?.trim() || null,
      client_ville:     client_ville?.trim()     || null,
      offre_key:        offre_key                || null,
      offre_label:      offre_label              || null,
      offre_formule:    offre_formule            || null,
      offre_type:       offre_type               || null,
      niveau:           niveau?.trim()           || null,
      objectif:         objectif?.trim()         || null,
      message:          message?.trim()          || null,
      montant:          Number(montant),
      statut:           "en_attente",
    });

    if (dbErr) {
      console.error("Erreur DB initiate:", dbErr);
      return res.status(500).json({ error: dbErr.message });
    }

    // 2. Appeler l'API CinetPay pour créer le paiement
    const cpBody = {
      apikey:         CINETPAY_APIKEY,
      site_id:        CINETPAY_SITE_ID,
      transaction_id,
      amount:         Number(montant),
      currency:       "XOF",
      description:    `${offre_label || "Formation BET"} — ${client_nom.trim()}`,
      return_url:     `${FRONTEND_URL}/paiement/retour?transaction_id=${transaction_id}`,
      notify_url:     `${BACKEND_URL}/api/cinetpay/notify`,
      customer_name:     (client_prenom || "").trim() || client_nom.trim(),
      customer_surname:  client_nom.trim(),
      customer_email:    client_email.trim().toLowerCase(),
      customer_phone_number: client_telephone?.replace(/\s+/g, "") || "",
      customer_address:  client_ville?.trim() || "Abidjan",
      customer_city:     client_ville?.trim() || "Abidjan",
      customer_country:  "CI",
      customer_state:    "CI",
      customer_zip_code: "00225",
      channels:          "ALL",
      lang:              "fr",
    };

    const cpRes = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(cpBody),
    });

    const cpData = await cpRes.json();
    console.log("CinetPay initiate response:", cpData);

    if (cpData.code !== "201") {
      // Marquer comme échoué si CinetPay refuse
      await supabase.from("paiements_cinetpay").update({ statut: "échoué" }).eq("transaction_id", transaction_id);
      return res.status(502).json({ error: cpData.message || "Erreur CinetPay" });
    }

    res.json({
      transaction_id,
      payment_url: cpData.data.payment_url,
      payment_token: cpData.data.payment_token,
    });
  } catch (err) {
    console.error("Erreur /cinetpay/initiate:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── POST /notify ──────────────────────────────────────────────
// Webhook appelé automatiquement par CinetPay quand le paiement est confirmé
// IMPORTANT : cette route est publique (pas d'auth), CinetPay l'appelle directement
router.post("/notify", async (req, res) => {
  try {
    const { cpm_trans_id, cpm_site_id } = req.body;

    if (!cpm_trans_id) {
      return res.status(400).json({ error: "transaction_id manquant" });
    }

    // 1. Vérifier le paiement auprès de CinetPay
    const verifyRes = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey:         CINETPAY_APIKEY,
        site_id:        CINETPAY_SITE_ID || cpm_site_id,
        transaction_id: cpm_trans_id,
      }),
    });

    const verifyData = await verifyRes.json();
    console.log("CinetPay verify:", verifyData);

    const payment = verifyData.data;
    const isValid = verifyData.code === "00" && payment?.cpm_result === "00";

    // 2. Mettre à jour le statut en base
    const updates = {
      statut:       isValid ? "validé" : "échoué",
      cinetpay_ref: payment?.cpm_payid || payment?.cel_phone_num || null,
    };

    const { data: existing } = await supabase
      .from("paiements_cinetpay")
      .select("id, client_nom, client_email, offre_label, offre_formule, montant, assistante_id")
      .eq("transaction_id", cpm_trans_id)
      .single();

    if (!existing) {
      console.error("Transaction inconnue:", cpm_trans_id);
      return res.status(404).json({ error: "Transaction inconnue" });
    }

    await supabase.from("paiements_cinetpay").update(updates).eq("transaction_id", cpm_trans_id);

    // 3. Si validé : créer une entrée dans paiements_parcours pour que les assistantes la voient
    if (isValid) {
      const inscriptionLabel = [
        existing.offre_label  ? `offre::${existing.offre_label}`   : null,
        existing.offre_formule ? existing.offre_formule             : null,
      ].filter(Boolean).join("||") || null;

      // Trouver une assistante disponible (optionnel — peut rester null pour affectation manuelle)
      // On insère avec commercial_id = null si pas d'assistante assignée
      // Utilise un compte système ou laisse la superadmin affecter
      await supabase.from("paiements_parcours").insert({
        commercial_id:   existing.assistante_id || "00000000-0000-0000-0000-000000000000",
        client:          existing.client_nom,
        email:           existing.client_email,
        telephone:       null, // récupéré via cinetpay_id si besoin
        inscription:     inscriptionLabel,
        montant_du:      existing.montant,
        montant_recu:    existing.montant,
        date_paiement:   new Date().toISOString().slice(0, 10),
        mode_paiement:   "CinetPay",
        statut:          "validé",
        ref_transaction: cpm_trans_id,
        notes:           `Paiement en ligne CinetPay — ref: ${payment?.cpm_payid || "—"}`,
      });
    }

    // CinetPay attend un 200 OK pour ne pas renotifier
    res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("Erreur /cinetpay/notify:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── POST /verify ──────────────────────────────────────────────
// Le frontend peut vérifier manuellement le statut après retour
router.post("/verify", async (req, res) => {
  try {
    const { transaction_id } = req.body;
    if (!transaction_id) return res.status(400).json({ error: "transaction_id requis" });

    const { data, error } = await supabase
      .from("paiements_cinetpay")
      .select("transaction_id, statut, montant, offre_label, offre_formule, client_nom, client_email, created_at")
      .eq("transaction_id", transaction_id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Transaction introuvable" });

    res.json({ paiement: data });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── GET /admin/all ────────────────────────────────────────────
// Dashboard admin/assistante : tous les paiements CinetPay reçus
router.get("/admin/all", authenticateAdmin, async (req, res) => {
  try {
    const { statut, traitee } = req.query;

    let q = supabase
      .from("paiements_cinetpay")
      .select("*")
      .order("created_at", { ascending: false });

    if (statut)  q = q.eq("statut", statut);
    if (traitee !== undefined) q = q.eq("traitee", traitee === "true");

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    res.json({ paiements: data || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ── PATCH /admin/:id/traiter ──────────────────────────────────
// L'assistante marque un paiement comme traité après inscription du client
router.patch("/admin/:id/traiter", authenticateAdmin, async (req, res) => {
  try {
    const { notes_assistante } = req.body;

    const { data, error } = await supabase
      .from("paiements_cinetpay")
      .update({
        traitee:          true,
        assistante_id:    req.user.id,
        notes_assistante: notes_assistante?.trim() || null,
        date_traitement:  new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ paiement: data });
  } catch (err) {
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;
