// src/Pages/CommercialDashboard/CommercialDashboard.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import MessagerieTab from "../../Components/MessagerieTab";
import NotificationBell from "../../Components/NotificationBell";
import { useNotifPoller } from "../../hooks/useNotifPoller";
import { useProspectChatsUnread } from "../../hooks/useProspectChatsUnread";
import ProspectChatPanel from "../../Components/ProspectChatPanel";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` });

/* ═══════════════════════════════════════════════════════
   CONSTANTES (charte BET)
═══════════════════════════════════════════════════════ */
const BET_COLOR    = "#0891b2";
const BET_DARK     = "#0e7490";
const BET_LIGHT    = "#e0f2fe";
const BET_GRADIENT = "linear-gradient(135deg, #0f172a 0%, #0891b2 100%)";

/* ═══════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES
═══════════════════════════════════════════════════════ */
const StatCard = ({ label, value, color, icon, sub, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff", padding:16, borderRadius:12, boxShadow:"0 1px 6px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:12, cursor:onClick?"pointer":"default", transition:"transform .15s", border:"1px solid #f1f5f9" }}>
    <div style={{ width:46, height:46, borderRadius:10, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{icon}</div>
    <div style={{ minWidth:0 }}>
      <div style={{ fontSize:11, color:"#9ca3af" }}>{label}</div>
      <div style={{ fontSize:21, fontWeight:800, color, lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>{sub}</div>}
    </div>
  </div>
);

const Badge = ({ label, color, bg }) => (
  <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:700, color, background:bg, whiteSpace:"nowrap" }}>{label}</span>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div style={modalOverlay}>
    <div style={{ ...modalBox, width: wide ? 680 : 520, maxHeight:"90vh", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h3 style={{ margin:0, fontSize:16 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#6b7280" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   HELPERS STATUTS
═══════════════════════════════════════════════════════ */
const STATUT_LEAD = {
  qualifié:   { label:"Qualifié",   color:"#0891b2", bg:"#e0f2fe" },
  en_cours:   { label:"En cours",   color:"#f59e0b", bg:"#fef3c7" },
  converti:   { label:"Converti",   color:"#22c55e", bg:"#dcfce7" },
  perdu:      { label:"Perdu",      color:"#ef4444", bg:"#fee2e2" },
};
const STATUT_DEVIS = {
  envoyé:     { label:"Envoyé",     color:"#0891b2", bg:"#e0f2fe" },
  accepté:    { label:"Accepté",    color:"#22c55e", bg:"#dcfce7" },
  relancé:    { label:"Relancé",    color:"#f59e0b", bg:"#fef3c7" },
  expiré:     { label:"Expiré",     color:"#ef4444", bg:"#fee2e2" },
  refusé:     { label:"Refusé",     color:"#6b7280", bg:"#f3f4f6" },
};
const STATUT_PAIEMENT = {
  en_attente: { label:"En attente", color:"#f59e0b", bg:"#fef3c7" },
  partiel:    { label:"Partiel",    color:"#0891b2", bg:"#e0f2fe" },
  reçu:       { label:"Reçu",       color:"#22c55e", bg:"#dcfce7" },
  remboursé:  { label:"Remboursé",  color:"#8b5cf6", bg:"#ede9fe" },
};
const STATUT_DOSSIER = {
  reçu:       { label:"Reçu",       color:"#0891b2", bg:"#e0f2fe" },
  en_étude:   { label:"En étude",   color:"#f59e0b", bg:"#fef3c7" },
  accepté:    { label:"Accepté",    color:"#22c55e", bg:"#dcfce7" },
  refusé:     { label:"Refusé",     color:"#ef4444", bg:"#fee2e2" },
};
const STATUT_TEST = {
  nouveau:    { label:"Nouveau",    color:"#0891b2", bg:"#e0f2fe" },
  contacté:   { label:"Contacté",  color:"#f59e0b", bg:"#fef3c7" },
  converti:   { label:"Converti",  color:"#22c55e", bg:"#dcfce7" },
  archivé:    { label:"Archivé",   color:"#6b7280", bg:"#f3f4f6" },
};

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK
═══════════════════════════════════════════════════════ */
const OFFRE_LIST = ["Anglais Pro B2", "Business English", "Certification TOEIC", "Anglais Enfant", "Formation Entreprise"];
// const PROFIL_LIST = ["Particulier", "Entreprise", "Étudiant"];

const INIT_LEADS = [
  { id:1, client:"Orange CI",   contact:"M. Kouamé",  email:"k.aya@orange.ci",     source:"Site web",      statut:"qualifié", date:"2025-12-10", montantPotentiel:12500, notes:"" },
  { id:2, client:"BNP Paribas", contact:"Mme Diallo", email:"d.ibra@bnp.ci",        source:"Recommandation",statut:"en_cours", date:"2025-12-09", montantPotentiel:32000, notes:"Appel prévu vendredi" },
  { id:3, client:"Nestlé CI",   contact:"M. Koné",    email:"ab.kone@nestle.ci",    source:"Salon",         statut:"converti", date:"2025-12-08", montantPotentiel:8800,  notes:"" },
];

const INIT_DEVIS = [
  { id:1, client:"Orange CI",   montant:12500, date:"2025-12-10", statut:"envoyé",  validite:"2026-01-10", offre:"Anglais Pro B2" },
  { id:2, client:"BNP Paribas", montant:32000, date:"2025-12-09", statut:"accepté", validite:"2026-01-09", offre:"Certification TOEIC" },
  { id:3, client:"SIFCA",       montant:8800,  date:"2025-12-07", statut:"relancé", validite:"2026-01-07", offre:"Business English" },
];

const INIT_INSCRIPTIONS = [
  { id:1, client:"Orange CI",   contact:"M. Kouamé",  telephone:"+225 05 11 22 33", email:"k.aya@orange.ci",  offre:"Anglais Pro B2",     niveauTest:"B1", dateDebut:"2026-01-15", date:"2025-12-10", montant:12500, statut:"confirmée",  apprenantConverti:true,  documents:[{nom:"Devis signé",type:"devis"},{nom:"Bon de commande",type:"bc"},{nom:"Pièce d'identité",type:"id"}], notesAdmin:"Dossier transmis au responsable pédagogique le 10/12" },
  { id:2, client:"BNP Paribas", contact:"Mme Diallo", telephone:"+225 07 44 55 66", email:"d.ibra@bnp.ci",    offre:"Certification TOEIC",niveauTest:"A2", dateDebut:"2026-01-20", date:"2025-12-09", montant:32000, statut:"confirmée",  apprenantConverti:false, documents:[{nom:"Devis signé",type:"devis"}], notesAdmin:"" },
  { id:3, client:"Total CI",    contact:"M. Sanogo",  telephone:"+225 07 88 99 11", email:"s@total.ci",       offre:"Business English",   niveauTest:"B2", dateDebut:"",          date:"2025-12-06", montant:21000, statut:"en_attente", apprenantConverti:false, documents:[], notesAdmin:"En attente du paiement" },
];

/* ── Tests de niveau reçus ── */
const INIT_TESTS = [
  { id:1, nom:"Adjoua",    prenom:"Koné",     telephone:"+225 07 11 22 33", email:"adjoua.k@gmail.com",  profil:"Particulier", niveau:"B1", score:62, date:"2025-12-11", statut:"nouveau",   notes:"", offreRecommandee:"Anglais Pro B2" },
  { id:2, nom:"Ibrahim",   prenom:"Traoré",   telephone:"+225 05 44 55 66", email:"itraoré@totalci.com", profil:"Entreprise",  niveau:"A2", score:41, date:"2025-12-10", statut:"contacté",  notes:"Intéressé par TOEIC", offreRecommandee:"Certification TOEIC" },
  { id:3, nom:"Marie",     prenom:"Dupont",   telephone:"+225 01 23 45 67", email:"marie.d@cci.ci",      profil:"Étudiant",    niveau:"B2", score:74, date:"2025-12-09", statut:"converti",  notes:"Inscription validée", offreRecommandee:"Anglais Pro B2" },
  { id:4, nom:"Seydou",    prenom:"Bamba",    telephone:"+225 07 88 99 00", email:"s.bamba@orange.ci",   profil:"Entreprise",  niveau:"A1", score:28, date:"2025-12-08", statut:"nouveau",   notes:"", offreRecommandee:"Formation Entreprise" },
];

/* ── NOUVEAU : Dossiers à valider ── */
const INIT_DOSSIERS = [
  { id:1, client:"Orange CI",   offre:"Anglais Pro B2",     dateReception:"2025-12-10", statut:"accepté",  commentaire:"Dossier complet", documents:["Devis signé","Bon de commande"] },
  { id:2, client:"BNP Paribas", offre:"Certification TOEIC",dateReception:"2025-12-09", statut:"en_étude", commentaire:"",               documents:["Devis signé"] },
  { id:3, client:"SIFCA",       offre:"Business English",   dateReception:"2025-12-08", statut:"reçu",     commentaire:"",               documents:[] },
  { id:4, client:"Total CI",    offre:"Formation Entreprise",dateReception:"2025-12-06",statut:"refusé",   commentaire:"Budget non confirmé", documents:[] },
];


/* ── Newsletters reçues ── */
const INIT_NEWSLETTERS = [
  {
    id:1, expediteur:"BET Languages — Direction",  expediteurEmail:"direction@betlanguages.ci",
    sujet:"🎉 Lancement de la nouvelle saison de formations 2026",
    categorie:"interne", date:"2025-12-15", lu:false,
    resume:"La nouvelle saison démarre le 15 janvier 2026. Découvrez les nouvelles offres, les promotions de lancement et les objectifs commerciaux du trimestre.",
    contenu:`<h2>Nouvelle saison 2026 — Objectifs & Offres</h2>
<p>Chère équipe commerciale,</p>
<p>Nous sommes ravis de vous annoncer le lancement de notre nouvelle saison de formations pour le premier trimestre 2026. Voici les points clés :</p>
<h3>🎯 Objectifs commerciaux T1 2026</h3>
<ul><li>Recruter 80 nouveaux apprenants individuels</li><li>Signer 5 contrats entreprises (min. 10 collaborateurs)</li><li>Atteindre un CA de 15 000 000 FCFA</li></ul>
<h3>📚 Nouvelles offres</h3>
<ul><li><strong>Pack TOEIC Intensif 2026</strong> — 250 000 FCFA (↓15%)</li><li><strong>Anglais des Affaires B2→C1</strong> — Formation premium 6 mois</li><li><strong>Formation Entreprise Sur-Mesure</strong> — Devis personnalisé</li></ul>
<h3>🎁 Promotion de lancement</h3><p>Toute inscription avant le 20 janvier 2026 bénéficie d'un <strong>accès gratuit à la bibliothèque digitale BET</strong> (valeur 35 000 FCFA).</p>
<p>Bonne saison à toutes et à tous !</p><p><em>— La Direction BET Languages</em></p>`,
    pieceJointe:"Catalogue_BET_2026.pdf",
  },
  {
    id:2, expediteur:"LinkedIn Business",  expediteurEmail:"newsletter@linkedin.com",
    sujet:"📈 Tendances de la formation professionnelle en Afrique — Décembre 2025",
    categorie:"marché", date:"2025-12-12", lu:false,
    resume:"L'Afrique subsaharienne connaît une explosion de la demande en formations linguistiques professionnelles. +38% de croissance en 2025 selon LinkedIn Learning.",
    contenu:`<h2>Tendances Formation Professionnelle — Afrique 2025</h2>
<h3>📊 Chiffres clés</h3>
<ul><li>+38% de croissance des formations en langues en Afrique subsaharienne</li><li>La Côte d'Ivoire figure en <strong>3e position</strong> des marchés les plus dynamiques</li><li>87% des recruteurs privilégient les candidats certifiés TOEIC/TOEFL</li><li>Budget moyen dédié à la formation par entreprise : +22% vs 2024</li></ul>
<h3>🔥 Formations les plus demandées</h3>
<ol><li>Anglais des affaires (B1→C1)</li><li>Préparation aux certifications internationales</li><li>Communication interculturelle</li><li>Anglais technique (finance, IT, santé)</li></ol>
<h3>💡 Opportunité commerciale</h3>
<p>Les entreprises du secteur financier et des télécoms augmentent leur budget formation de 28% en 2026. Ciblez ces secteurs en priorité pour vos prospections.</p>`,
    pieceJointe:null,
  },
  {
    id:3, expediteur:"Cambridge Assessment English", expediteurEmail:"partners@cambridge.org",
    sujet:"🏆 Nouveau partenariat certificat Cambridge Business English",
    categorie:"partenaire", date:"2025-12-10", lu:true,
    resume:"Cambridge Assessment English vous propose un partenariat officiel pour proposer les certifications BEC (Business English Certificate) à vos apprenants.",
    contenu:`<h2>Partenariat Cambridge Business English Certificate</h2>
<p>Cher partenaire BET Languages,</p>
<p>Cambridge Assessment English est heureux de vous proposer un <strong>partenariat officiel de centre agréé</strong> pour l'administration des certifications BEC.</p>
<h3>✅ Ce que comprend le partenariat</h3>
<ul><li>Droit d'administrer les examens BEC Preliminary, Vantage et Higher</li><li>Matériel officiel de préparation aux examens</li><li>Formation de vos formateurs (2 jours) — Offerte la 1ère année</li><li>Accès à la plateforme Cambridge One pour vos apprenants</li><li>Commission de 12% sur chaque inscription examen</li></ul>
<h3>💰 Impact commercial estimé</h3>
<ul><li>Revenu additionnel estimé : 2 800 000 FCFA/an</li><li>Différenciation concurrentielle forte sur le marché d'Abidjan</li><li>Fidélisation renforcée des apprenants entreprise</li></ul>
<h3>📅 Prochaine étape</h3><p>Un représentant Cambridge se déplace à Abidjan les 15-16 janvier 2026. Répondez avant le 5 janvier pour confirmer votre participation.</p>
<p><em>— Cambridge Assessment English, Africa Partnership Team</em></p>`,
    pieceJointe:"Cambridge_Partenariat_BET_2026.pdf",
  },
  {
    id:4, expediteur:"CGECI — Confédération Générale", expediteurEmail:"info@cgeci.ci",
    sujet:"📋 Appel à propositions — Formation linguistique des PME ivoiriennes 2026",
    categorie:"opportunité", date:"2025-12-08", lu:true,
    resume:"La CGECI lance un appel à propositions pour des prestataires de formation linguistique destinés aux PME membres. Budget global : 180 millions FCFA.",
    contenu:`<h2>Appel à Propositions — CGECI Formation Linguistique PME 2026</h2>
<h3>📌 Contexte</h3>
<p>Dans le cadre de son programme d'appui aux PME membres, la CGECI lance un appel à propositions pour sélectionner des <strong>prestataires agréés de formation linguistique</strong> pour l'exercice 2026.</p>
<h3>📊 Volume et budget</h3>
<ul><li>Volume estimé : <strong>1 200 à 1 500 bénéficiaires</strong></li><li>Budget global alloué : <strong>180 000 000 FCFA</strong></li><li>Durée des formations : 3 à 6 mois selon le niveau</li><li>Langues ciblées : Anglais des affaires, Français professionnel, Espagnol</li></ul>
<h3>✅ Critères d'éligibilité</h3>
<ul><li>Être enregistré comme centre de formation agréé en Côte d'Ivoire</li><li>Justifier d'au moins 3 ans d'expérience en formation professionnelle</li><li>Disposer d'outils numériques de suivi des apprenants</li><li>Présenter un dossier technique et financier complet</li></ul>
<h3>📅 Calendrier</h3>
<ul><li>Dépôt des dossiers : <strong>avant le 31 janvier 2026</strong></li><li>Résultats : 15 février 2026</li><li>Démarrage des formations : mars 2026</li></ul>
<p><strong>⚠️ Action requise :</strong> Préparez votre dossier de candidature dès maintenant !</p>`,
    pieceJointe:"CGECI_Appel_Propositions_2026.pdf",
  },
  {
    id:5, expediteur:"HubSpot Academy", expediteurEmail:"academy@hubspot.com",
    sujet:"🚀 Nouvelles techniques de prospection B2B pour les centres de formation",
    categorie:"formation", date:"2025-12-05", lu:true,
    resume:"Découvrez les 7 techniques de prospection B2B les plus efficaces en 2025 pour les centres de formation : LinkedIn outreach, cold email, webinaires de conversion.",
    contenu:`<h2>7 Techniques de Prospection B2B pour Centres de Formation</h2>
<h3>1. 🔗 LinkedIn Sales Navigator</h3><p>Identifiez les DRH et responsables formation de grandes entreprises ivoiriennes. Taux de réponse : 34% en moyenne avec un message personnalisé.</p>
<h3>2. 📧 Séquence email "Before / After"</h3><p>Montrez la transformation : "Avant notre formation, vos équipes galèrent en réunion internationale. Après, elles négocient avec aisance en anglais." Taux d'ouverture : +52%.</p>
<h3>3. 🎥 Webinaire de démonstration gratuit</h3><p>Organisez un webinaire mensuel "Testez votre niveau d'anglais professionnel en 20 minutes". Coût faible, génère 15-30 leads qualifiés par session.</p>
<h3>4. 🤝 Partenariats prescripteurs</h3><p>Travaillez avec les cabinets RH, écoles de commerce et associations professionnelles. Programme de commission 8-12% sur les inscriptions apportées.</p>
<h3>5. 📱 WhatsApp Business</h3><p>Créez un catalogue digital de vos formations sur WhatsApp Business. 78% des prospects d'Abidjan préfèrent être contactés par WhatsApp.</p>
<h3>6. 📊 Cas clients et témoignages vidéo</h3><p>Un témoignage vidéo de 60 secondes d'un client satisfait convertit 3x mieux qu'un texte. Priorité à filmer vos apprenants entreprise.</p>
<h3>7. 🎁 Offre d'essai gratuite</h3><p>Proposez une séance d'essai gratuite de 45 minutes. Taux de conversion essai → inscription : 68% selon nos données 2025.</p>`,
    pieceJointe:null,
  },
  {
    id:6, expediteur:"BET Languages — RH", expediteurEmail:"rh@betlanguages.ci",
    sujet:"📢 Mise à jour des objectifs commerciaux — Bonus Q4 2025",
    categorie:"interne", date:"2025-12-02", lu:true,
    resume:"Les résultats commerciaux du Q3 2025 ont dépassé les objectifs de 18%. Nouveau palier de bonus activé pour l'équipe commerciale au Q4.",
    contenu:`<h2>Résultats Q3 2025 & Objectifs Q4 — Équipe Commerciale</h2>
<h3>🏆 Résultats Q3 2025</h3>
<ul><li>CA réalisé : <strong>12 450 000 FCFA</strong> (objectif : 10 500 000 FCFA — <strong>+18,6%</strong>)</li><li>Nouveaux apprenants : 67 (objectif : 55)</li><li>Contrats entreprises signés : 4 (objectif : 3)</li><li>Taux de conversion lead→inscription : 34% (record)</li></ul>
<h3>💰 Activation du palier bonus</h3>
<p>Suite au dépassement des objectifs, le <strong>palier bonus de 15%</strong> est activé pour l'ensemble de l'équipe commerciale sur le Q4 2025.</p>
<h3>🎯 Objectifs Q4 2025</h3>
<ul><li>CA cible : <strong>14 000 000 FCFA</strong></li><li>Nouveaux apprenants : 75</li><li>Priorité : secteur bancaire + télécoms (budget formation Q4 disponible)</li></ul>
<h3>📅 Réunion commerciale</h3><p>Réunion de bilan Q3 + lancement Q4 : <strong>vendredi 6 décembre à 14h00</strong> — Salle de réunion principale.</p>
<p><em>— L'équipe RH BET Languages</em></p>`,
    pieceJointe:"Objectifs_Q4_2025_Commercial.pdf",
  },
];

/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
export default function CommercialDashboard() {
  const navigate = useNavigate();
  const profil = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom = profil?.prenom || profil?.first_name || "";
  const nom    = profil?.nom    || profil?.last_name  || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || profil?.email || "Commercial";
  const initiales = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "CM";

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace: true });
  };

  const [activeTab, setActiveTab]           = useState("dashboard");

  // ── Détection profil assistante (b2c / b2b / les_deux) ───
  const [assistanteProfil, setAssistanteProfil] = useState(null); // null = chargement
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token || !profil?.email) { setAssistanteProfil("b2c"); return; }
    fetch(`${API_URL}/api/parcours/assistantes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const myAss = (d?.assistantes || []).find(a => a.email === profil.email);
        const p = myAss?.profil || "b2c";
        setAssistanteProfil(p);
        // Si B2B pur, démarrer sur l'onglet entreprises
        if (p === "b2b") setActiveTab("entreprises");
      })
      .catch(() => setAssistanteProfil("b2c"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasB2C = !assistanteProfil || assistanteProfil === "b2c" || assistanteProfil === "les_deux";
  const hasB2B = assistanteProfil === "b2b" || assistanteProfil === "les_deux";

  // ── Données B2B (chargées à la demande) ─────────────────
  const [b2bEntreprises, setB2bEntreprises] = useState([]);
  const [b2bProspects,   setB2bProspects]   = useState([]);
  const [b2bDocuments,   setB2bDocuments]   = useState([]);
  const [b2bFactures,    setB2bFactures]    = useState([]);
  const [b2bLoaded,      setB2bLoaded]      = useState(false);
  const [b2bLoading,     setB2bLoading]     = useState(false);

  const loadB2B = async () => {
    if (b2bLoaded || b2bLoading) return;
    setB2bLoading(true);
    try {
      const [rE, rP, rD, rF] = await Promise.all([
        fetch(`${API_URL}/api/corporate/entreprises`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/corporate/prospects`,   { headers: authHeaders() }),
        fetch(`${API_URL}/api/corporate/documents`,   { headers: authHeaders() }),
        fetch(`${API_URL}/api/corporate/factures`,    { headers: authHeaders() }),
      ]);
      const [dE, dP, dD, dF] = await Promise.all([rE.json(), rP.json(), rD.json(), rF.json()]);
      setB2bEntreprises(dE.entreprises || []);
      setB2bProspects(dP.prospects || []);
      setB2bDocuments(dD.documents || []);
      setB2bFactures(dF.factures || []);
      setB2bLoaded(true);
    } catch { toast.error("Erreur chargement données Corporate"); }
    finally { setB2bLoading(false); }
  };

  useEffect(() => {
    if (hasB2B && ["entreprises","pipeline_b2b","documents_b2b","facturation_b2b"].includes(activeTab)) {
      loadB2B();
    }
  }, [activeTab, hasB2B]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helpers B2B
  const fmtB2B = (n) => n != null ? Number(n).toLocaleString("fr-FR") + " FCFA" : "—";
  const fmtDateB2B = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  // Modales B2B
  const [b2bEntrepriseForm, setB2bEntrepriseForm] = useState(null); // null=fermé, {}=nouveau, {id,...}=édition
  const [b2bProspectForm,   setB2bProspectForm]   = useState(null);
  const [b2bDocumentForm,   setB2bDocumentForm]   = useState(null);
  const [b2bFactureForm,    setB2bFactureForm]    = useState(null);
  const [b2bSavingId,       setB2bSavingId]       = useState(null);
  const [b2bHistoriqueItem, setB2bHistoriqueItem] = useState(null);

  const saveB2BEntreprise = async (form) => {
    setB2bSavingId("entreprise");
    try {
      const isEdit = !!form.id;
      const url = isEdit ? `${API_URL}/api/corporate/entreprises/${form.id}` : `${API_URL}/api/corporate/entreprises`;
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: authHeaders(), body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(isEdit ? "Entreprise mise à jour ✓" : "Entreprise créée ✓");
      setB2bEntrepriseForm(null); setB2bLoaded(false); loadB2B();
    } catch (err) { toast.error(err.message); }
    finally { setB2bSavingId(null); }
  };

  const saveB2BProspect = async (form) => {
    setB2bSavingId("prospect");
    try {
      const isEdit = !!form.id;
      const url = isEdit ? `${API_URL}/api/corporate/prospects/${form.id}` : `${API_URL}/api/corporate/prospects`;
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: authHeaders(), body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(isEdit ? "Prospect mis à jour ✓" : "Prospect créé ✓");
      setB2bProspectForm(null); setB2bLoaded(false); loadB2B();
    } catch (err) { toast.error(err.message); }
    finally { setB2bSavingId(null); }
  };

  const saveB2BDocument = async (form) => {
    setB2bSavingId("document");
    try {
      const res = await fetch(`${API_URL}/api/corporate/documents`, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Document enregistré ✓");
      setB2bDocumentForm(null); setB2bLoaded(false); loadB2B();
    } catch (err) { toast.error(err.message); }
    finally { setB2bSavingId(null); }
  };

  const saveB2BFacture = async (form) => {
    setB2bSavingId("facture");
    try {
      const res = await fetch(`${API_URL}/api/corporate/factures`, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Facture créée ✓");
      setB2bFactureForm(null); setB2bLoaded(false); loadB2B();
    } catch (err) { toast.error(err.message); }
    finally { setB2bSavingId(null); }
  };

  const patchB2BStatut = async (table, id, updates) => {
    await fetch(`${API_URL}/api/corporate/${table}/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(updates) });
    setB2bLoaded(false); loadB2B();
  };

  // Notifications polling
  useNotifPoller({ userId: profil?.id, sources: ["tests", "contacts", "assignations"] });

  const [leads, setLeads]                   = useState(INIT_LEADS);
  const [devis, setDevis]                   = useState(INIT_DEVIS);
  const [inscriptions, setInscriptions]     = useState(INIT_INSCRIPTIONS);
  const [tests, setTests]                   = useState(INIT_TESTS);
  const [testsLoading, setTestsLoading]     = useState(false);
  const [testsNonAssignes, setTestsNonAssignes] = useState([]);
  const [clientMessages, setClientMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const myCommercialId = profil?.id || null;
  const { unreadMap: prospectUnreadMap } = useProspectChatsUnread(myCommercialId);

  const [centreName, setCentreName] = useState("");

  useEffect(() => {
    const scope = profil?.scope || [];
    if (!scope.length || scope.includes("national")) return;
    fetch(`${API_URL}/api/centres`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.centres) return;
        const matched = d.centres.filter(c => scope.includes(c.id));
        if (matched.length > 0) setCentreName(matched.map(c => c.nom).join(" · "));
      })
      .catch(() => {});
  }, []);

  const offreParNiveau = (level) => {
    const map = { A1:"Cours débutant / Alphabétisation", A2:"Anglais Essentiel A2", B1:"Anglais Pro B1", B2:"Anglais Pro B2", C1:"Business English", C2:"Anglais Expert C2" };
    return map[level] || "Formation Personnalisée";
  };

  const mapTest = (r, i) => {
    const parts = (r.fullname || "").trim().split(" ");
    const prenom = parts[0] || "";
    const nom    = parts.slice(1).join(" ") || "";
    const scorePct = r.points_total > 0
      ? Math.round((r.points_earned / r.points_total) * 100)
      : (r.score || 0);
    return {
      id:               r.id || i + 1,
      nom:              nom || prenom,
      prenom:           nom ? prenom : "",
      telephone:        r.phone || "",
      email:            r.email || "",
      profil:           r.profile || "Particulier",
      niveau:           r.level || "—",
      score:            scorePct,
      points_earned:    r.points_earned || 0,
      points_total:     r.points_total  || 0,
      correct_answers:  r.correct_answers,
      total_questions:  r.total_questions,
      time_taken_seconds: r.time_taken_seconds || 0,
      date:             r.submitted_at ? r.submitted_at.split("T")[0] : "",
      commercial_id:    r.commercial_id || null,
      source:           r.source            || "online",
      format_test:      r.format_test       || "mixte",
      correction_statut: r.correction_statut || "auto",
      notes:            r.notes_oral        || "",
      answers_text:     r.answers_details   || [],
      statut:           "nouveau",
      offreRecommandee: offreParNiveau(r.level),
      by_category:      r.by_category   || {},
      by_cefr:          r.by_cefr       || {},
      answers_details:  r.answers_details || [],
      audio_answers:    r.audio_answers  || {},
    };
  };

  const fetchTests = async () => {
    setTestsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/level-test/all`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const { results } = await res.json();
      if (Array.isArray(results)) {
        const all = results.map(mapTest);
        // Mes clients = ceux qui m'ont choisi
        const miens = myCommercialId
          ? all.filter(t => t.commercial_id === myCommercialId)
          : all;
        // Non assignés (peut-être à revendiquer)
        const nonAssignes = all.filter(t => !t.commercial_id);
        setTests(miens.length > 0 ? miens : all);
        setTestsNonAssignes(nonAssignes);
      }
    } catch (e) {
      console.error("Chargement tests:", e);
    } finally {
      setTestsLoading(false);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/contact/mes-clients`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const { contacts } = await res.json();
      setClientMessages(contacts || []);
    } catch (e) {
      console.error("Chargement messages:", e);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  // ── Paiements (DB) ───────────────────────────────────
  const [paiements, setPaiements]           = useState([]);
  const [, setPaiementsLoading] = useState(false);

  const dbToLocal = (p) => ({
    id:             p.id,
    client:         p.client         || "",
    email:          p.email          || "",
    telephone:      p.telephone      || "",
    inscription:    p.inscription    || "",
    montantDu:      p.montant_du     || 0,
    montantReçu:    p.montant_recu   || 0,
    date:           p.date_paiement  || p.date || "",
    mode:           p.mode_paiement  || p.mode || "Mobile Money",
    statut:         p.statut         || "en_attente",
    notes:          p.notes          || "",
    refTransaction: p.ref_transaction|| "",
    assignationId:  p.assignation_id || null,
    preuveImage:    p.preuve_image   || null,
  });

  const fetchPaiements = async () => {
    setPaiementsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/paiements/mes-paiements`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const { paiements: data } = await res.json();
      setPaiements((data || []).map(dbToLocal));
    } catch (e) {
      console.error("Chargement paiements:", e);
    } finally {
      setPaiementsLoading(false);
    }
  };

  useEffect(() => { fetchPaiements(); }, []);

  // ── Sondages acquisition (DB) ────────────────────────
  const [sondages, setSondages] = useState([]);
  const [sondageStats, setSondageStats] = useState({});

  // ── Assignations parcours ────────────────────────────────
  const [assignations,        setAssignations]        = useState([]);
  const [assignationsLoading, setAssignationsLoading] = useState(false);
  const [assignFiltreType,    setAssignFiltreType]    = useState("tous");
  const [assignFiltreStatut,  setAssignFiltreStatut]  = useState("tous");
  const [chatAssignation,     setChatAssignation]     = useState(null); // assignation ouverte en chat

  const fetchAssignations = async () => {
    setAssignationsLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/parcours/assignations`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setAssignations(d.assignations || []); }
    } catch (e) { console.error("Chargement assignations:", e); }
    finally { setAssignationsLoading(false); }
  };

  useEffect(() => { fetchAssignations(); }, []);

  const updateStatutAssignation = async (id, statut) => {
    try {
      const r = await fetch(`${API_URL}/api/parcours/assignations/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ statut }),
      });
      if (r.ok) {
        setAssignations(prev => prev.map(a => a.id === id ? { ...a, statut } : a));
        toast.success("Statut mis à jour");
      }
    } catch { toast.error("Erreur"); }
  };

  const handleSaveDocsDossier = async (assignationId, docs) => {
    try {
      const r = await fetch(`${API_URL}/api/parcours/assignations/${assignationId}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ documents_dossier: docs }),
      });
      if (!r.ok) throw new Error();
      setAssignations(prev => prev.map(a => a.id === assignationId ? { ...a, documents_dossier: docs } : a));
      toast.success("Documents mis à jour ✓");
      setShowDocDossierModal(false); setDocDossierTarget(null);
    } catch { toast.error("Erreur lors de la sauvegarde des documents"); }
  };

  const handleSaveSuivi = async (assignationId, suivi) => {
    try {
      const r = await fetch(`${API_URL}/api/parcours/assignations/${assignationId}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ suivi_demarrage: suivi }),
      });
      if (!r.ok) throw new Error();
      setAssignations(prev => prev.map(a => a.id === assignationId ? { ...a, suivi_demarrage: suivi } : a));
      toast.success("Suivi de démarrage enregistré ✓");
      setShowSuiviModal(false); setSuiviTarget(null);
    } catch { toast.error("Erreur lors de la sauvegarde du suivi"); }
  };


  const fetchSondages = async () => {
    try {
      const [rList, rStats] = await Promise.all([
        fetch(`${API_URL}/api/sondage/mes-clients`,  { headers: authHeaders() }),
        fetch(`${API_URL}/api/sondage/stats`,        { headers: authHeaders() }),
      ]);
      if (rList.ok)  { const d = await rList.json();  setSondages(d.sondages || []); }
      if (rStats.ok) { const d = await rStats.json(); setSondageStats(d.stats || {}); }
    } catch (e) { console.error("Chargement sondages:", e); }
  };

  useEffect(() => { fetchSondages(); }, []);

  // Helper : retrouver la source d'un client par email
  const sourceClient = (email) => sondages.find(s => s.email === email)?.source || null;

  const [dossiers, setDossiers]             = useState(INIT_DOSSIERS);
  const [newsletters, setNewsletters]       = useState(INIT_NEWSLETTERS);
  const [filtreNewsCat, setFiltreNewsCat]   = useState("Tous");
  const [selectedNewsletter, setSelectedNewsletter] = useState(null);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);

  // Filtres
  const [periode, setPeriode]         = useState("mois");
  const [filtreOffre, setFiltreOffre] = useState("Toutes");

  const [searchQ, setSearchQ]         = useState("");

  // Filtres paiements
  const [paiSearchQ,    setPaiSearchQ]    = useState("");
  const [paiStatut,     setPaiStatut]     = useState("tous");
  const [paiMode,       setPaiMode]       = useState("tous");
  const [paiPeriode,    setPaiPeriode]    = useState("tous");
  const [paiPage,       setPaiPage]       = useState(1);
  const PAI_PAGE_SIZE = 10;

  // Filtres apprenants
  const [appSearchQ,    setAppSearchQ]    = useState("");
  const [appTypeCours,  setAppTypeCours]  = useState("tous");
  const [appTypeCoach,  setAppTypeCoach]  = useState("tous");
  const [appNiveau,     setAppNiveau]     = useState("tous");

  // Modales
  const [showLeadModal, setShowLeadModal]               = useState(false);
  const [showDevisModal, setShowDevisModal]             = useState(false);
  const [showInscriptionModal, setShowInscriptionModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal]       = useState(false);
  const [showDossierModal, setShowDossierModal]         = useState(false);
  const [showTestModal, setShowTestModal]               = useState(false);
  const [showPlanifModal, setShowPlanifModal]           = useState(false);
  const [showTestDetailModal, setShowTestDetailModal]   = useState(false);
  const [selectedTest, setSelectedTest]                 = useState(null);

  const [showInscDetailModal, setShowInscDetailModal]     = useState(false);
  const [selectedInscription, setSelectedInscription]    = useState(null);
  const [editingItem, setEditingItem]                     = useState(null);
  const [showFinalisationModal, setShowFinalisationModal] = useState(false);
  const [finalisationTarget, setFinalisationTarget]       = useState(null);
  const [showPmtListModal,    setShowPmtListModal]         = useState(false);
  const [pmtListTarget,       setPmtListTarget]            = useState(null); // assignation dont on liste les paiements
  const [showProgressionModal,setShowProgressionModal]    = useState(false);
  const [progressionTarget,   setProgressionTarget]        = useState(null); // assignation dont on affiche la progression
  const [progressionNotes,    setProgressionNotes]         = useState({});   // { [assignationId]: { seances, objectif, commentaire } }
  const [showDocDossierModal, setShowDocDossierModal]      = useState(false);
  const [docDossierTarget,    setDocDossierTarget]         = useState(null);  // assignation dont on gère les documents
  const [showSuiviModal,      setShowSuiviModal]           = useState(false);
  const [suiviTarget,         setSuiviTarget]              = useState(null);  // assignation dont on gère le suivi démarrage
  // Planification
  const [planifConfig, setPlanifConfig] = useState({ frequence:"hebdomadaire", emails:"", format:"pdf" });

  const formatMoney = (val) => Number(val || 0).toLocaleString("fr-FR") + " FCFA";
  const formatDate  = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" }) : "–";

  const isExpired = (d) => d && new Date(d) < new Date();

  // ── Alertes calculées ────────────────────────────────
  const alertes = useMemo(() => {
    const list = [];
    devis.filter(d => d.statut === "envoyé" && isExpired(d.validite)).forEach(d =>
      list.push({ type:"warning", msg:`Devis expiré — ${d.client}`, tab:"devis" })
    );
    leads.filter(l => l.statut === "qualifié").forEach(l =>
      list.push({ type:"info", msg:`Lead à traiter — ${l.client}`, tab:"leads" })
    );
    paiements.filter(p => p.statut === "en_attente").forEach(p =>
      list.push({ type:"danger", msg:`Paiement en attente — ${p.client}`, tab:"paiements" })
    );
    tests.filter(t => t.statut === "nouveau").forEach(t =>
      list.push({ type:"info", msg:`Nouveau test reçu — ${t.nom}`, tab:"tests" })
    );
    clientMessages.filter(m => m.statut === "nouveau").forEach(m =>
      list.push({ type:"info", msg:`Nouveau message — ${m.nom} : ${m.sujet || "sans sujet"}`, tab:"clients" })
    );
    return list;
  }, [devis, leads, paiements, tests]);

  const totalNonLu = 0; // géré par MessagerieTab (Firebase)

  // Convertir un message client en Lead
  const convertirLeadFromMessage = (msg) => {
    const newLead = {
      id:              Math.max(...leads.map(l => l.id), 0) + 1,
      client:          msg.nom,
      contact:         msg.nom,
      telephone:       msg.telephone || "",
      email:           msg.email || "",
      offre:           msg.sujet || "À définir",
      source:          "Mon Espace (message direct)",
      statut:          "qualifié",
      date:            new Date().toISOString().split("T")[0],
      montantPotentiel: 0,
      notes:           `Message reçu : ${msg.message?.slice(0, 120)}…`,
    };
    setLeads(prev => [newLead, ...prev]);
    setClientMessages(prev => prev.map(m => m.id === msg.id ? { ...m, statut:"en_cours" } : m));
    setSelectedMessage(null);
    setActiveTab("leads");
    toast.success(`Lead créé pour ${msg.nom} ✓`);
  };

  // ── Filtrage période ─────────────────────────────────
  const filterByPeriode = (data, dateField) => {
    const now = new Date();
    return data.filter(item => {
      const d = new Date(item[dateField]);
      if (periode === "semaine") { const w = new Date(); w.setDate(now.getDate()-7); return d >= w; }
      if (periode === "mois")    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (periode === "trimestre") return Math.floor(d.getMonth()/3) === Math.floor(now.getMonth()/3) && d.getFullYear() === now.getFullYear();
      if (periode === "annee")   return d.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const filteredLeads        = useMemo(() => filterByPeriode(leads, "date").filter(l => !searchQ || l.client.toLowerCase().includes(searchQ.toLowerCase())), [leads, periode, searchQ]);
  const filteredDevis        = useMemo(() => filterByPeriode(devis, "date"), [devis, periode]);
  const filteredInscriptions = useMemo(() => filterByPeriode(inscriptions, "date"), [inscriptions, periode]);
  const filteredTests        = useMemo(() => filterByPeriode(tests, "date"), [tests, periode]);


  const caPaiements = useMemo(() => paiements.reduce((s, p) => s + p.montantReçu, 0), [paiements]);

  // ── Conversion Lead → Devis ─────────────────────────
  const convertirLeadEnDevis = (lead) => {
    const newId = Math.max(...devis.map(d => d.id), 0) + 1;
    const newDevis = {
      id: newId,
      client: lead.client,
      montant: lead.montantPotentiel,
      date: new Date().toISOString().slice(0, 10),
      statut: "envoyé",
      validite: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10),
      offre: ""
    };
    setDevis(prev => [...prev, newDevis]);
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, statut:"en_cours" } : l));
    toast.success(`Devis créé pour ${lead.client}`);
  };

  // ── Relancer un devis ────────────────────────────────
  const relancerDevis = (d) => {
    setDevis(prev => prev.map(dv => dv.id === d.id ? { ...dv, statut:"relancé" } : dv));
    toast.success(`Relance envoyée pour ${d.client}`);
  };

  // ── Valider / Refuser dossier ────────────────────────
  const updateDossierStatut = (id, statut) => {
    setDossiers(prev => prev.map(d => d.id === id ? { ...d, statut } : d));
    toast.success(`Dossier ${statut}`);
  };

  // ── Test → Lead ──────────────────────────────────────
  const convertirTestEnLead = (test) => {
    const newId = Math.max(...leads.map(l => l.id), 0) + 1;
    setLeads(prev => [...prev, {
      id: newId, client: test.nom, contact: test.nom, email: test.email,
      source: "Test de niveau", statut: "qualifié",
      date: new Date().toISOString().slice(0, 10),
      montantPotentiel: 0, notes: `Niveau CECRL : ${test.niveau} (${test.score}%)`
    }]);
    setTests(prev => prev.map(t => t.id === test.id ? { ...t, statut:"converti" } : t));
    toast.success(`${test.nom} ajouté comme lead`);
  };

  // ── CRUD Leads ───────────────────────────────────────
  const handleSaveLead = (lead) => {
    if (lead.id) {
      setLeads(leads.map(l => l.id === lead.id ? lead : l));
      toast.success("Lead modifié");
    } else {
      setLeads([...leads, { ...lead, id: Math.max(...leads.map(l=>l.id),0)+1 }]);
      toast.success("Lead ajouté");
    }
    setShowLeadModal(false); setEditingItem(null);
  };
  const handleDeleteLead = (id) => { setLeads(leads.filter(l=>l.id!==id)); toast.success("Lead supprimé"); };

  // ── CRUD Devis ───────────────────────────────────────
  const handleSaveDevis = (d) => {
    if (d.id) { setDevis(devis.map(dv=>dv.id===d.id?d:dv)); toast.success("Devis modifié"); }
    else { setDevis([...devis, {...d, id:Math.max(...devis.map(dv=>dv.id),0)+1}]); toast.success("Devis ajouté"); }
    setShowDevisModal(false); setEditingItem(null);
  };
  const handleDeleteDevis = (id) => { setDevis(devis.filter(d=>d.id!==id)); toast.success("Devis supprimé"); };

  // ── CRUD Inscriptions ────────────────────────────────
  const handleSaveInscription = (insc) => {
    if (insc.id) { setInscriptions(inscriptions.map(i=>i.id===insc.id?insc:i)); toast.success("Inscription modifiée"); }
    else { setInscriptions([...inscriptions, {...insc, id:Math.max(...inscriptions.map(i=>i.id),0)+1}]); toast.success("Inscription ajoutée"); }
    setShowInscriptionModal(false); setEditingItem(null);
  };
  const handleDeleteInscription = (id) => { setInscriptions(inscriptions.filter(i=>i.id!==id)); toast.success("Inscription supprimée"); };

  // ── CRUD Paiements ───────────────────────────────────
  const handleSavePaiement = async (p) => {
    try {
      const payload = {
        client:          p.client,
        email:           p.email          || "",
        telephone:       p.telephone      || "",
        inscription:     p.inscription    || "",
        montant_du:      p.montantDu      || 0,
        montant_recu:    p.montantReçu    || 0,
        date_paiement:   p.date,
        mode_paiement:   p.mode,
        statut:          p.statut,
        notes:           p.notes          || "",
        ref_transaction: p.refTransaction || null,
        assignation_id:  p.assignationId  || null,
        preuve_image:    p.preuveImage    || null,
      };

      if (p.id) {
        const res = await fetch(`${API_URL}/api/paiements/${p.id}`, {
          method:"PATCH", headers: authHeaders(), body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success("Paiement modifié ✓");
      } else {
        const res = await fetch(`${API_URL}/api/paiements/submit`, {
          method:"POST", headers: authHeaders(), body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success("Paiement enregistré ✓");
      }
      await fetchPaiements();
    } catch {
      toast.error("Erreur lors de l'enregistrement du paiement");
    }
    setShowPaiementModal(false); setEditingItem(null);
  };
  const handleDeletePaiement = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/paiements/${id}`, {
        method:"DELETE", headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast.success("Paiement supprimé");
      await fetchPaiements();
    } catch {
      toast.error("Erreur suppression paiement");
    }
  };

  // ── Finaliser l'inscription d'un prospect ────────────
  const handleFinaliserInscription = async (a, formData) => {
    // 1. Créer l'inscription
    const newInsc = {
      ...formData,
      id:         Math.max(...inscriptions.map(i => i.id), 0) + 1,
      client:     a.prospect_nom       || "",
      contact:    a.prospect_nom       || "",
      telephone:  a.prospect_telephone || "",
      email:      a.prospect_email     || "",
      apprenantConverti: false,
    };
    setInscriptions(prev => [newInsc, ...prev]);

    // 2. Marquer l'assignation comme convertie
    await updateStatutAssignation(a.id, "converti");

    setShowFinalisationModal(false);
    setFinalisationTarget(null);
    toast.success(`🎓 ${a.prospect_nom} est maintenant apprenant BET !`, { duration:4000 });
    toast(`📋 Inscription créée — consultable dans l'onglet Inscriptions`, { icon:"📨", duration:3000 });
    setActiveTab("apprenants");
  };

  // ── CRUD Dossiers ────────────────────────────────────
  const handleSaveDossier = (dos) => {
    if (dos.id) { setDossiers(dossiers.map(d=>d.id===dos.id?dos:d)); toast.success("Dossier modifié"); }
    else { setDossiers([...dossiers, {...dos, id:Math.max(...dossiers.map(d=>d.id),0)+1}]); toast.success("Dossier ajouté"); }
    setShowDossierModal(false); setEditingItem(null);
  };
  const handleDeleteDossier = (id) => { setDossiers(dossiers.filter(d=>d.id!==id)); toast.success("Dossier supprimé"); };

  // ── CRUD Tests ───────────────────────────────────────
  const handleSaveTest = async (t) => {
    if (t.id) {
      // Correction d'un test Writing/Speaking → appel API PATCH
      try {
        const res = await fetch(`${API_URL}/api/level-test/${t.id}/corriger`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ level: t.niveau, score: t.score, notes_oral: t.notes }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "Erreur lors de la correction"); return; }
        toast.success("Correction enregistrée ✅");
        setShowTestModal(false); setEditingItem(null);
        await fetchTests();
        if (data.result) {
          const mapped = { ...t, niveau: data.result.level, score: data.result.score, correction_statut: "corrige" };
          setSelectedTest(mapped); setShowTestDetailModal(true);
        }
      } catch { toast.error("Erreur réseau"); }
      return;
    }
    // Nouveau test oral → enregistrer en DB avec commercial_id
    try {
      const res = await fetch(`${API_URL}/api/level-test/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // pas d'auth requise sur /submit
        body: JSON.stringify({
          user: {
            fullname:      `${t.prenom || ""} ${t.nom || ""}`.trim() || t.nom,
            email:         t.email     || null,
            phone:         t.telephone || null,
            profile:       t.profil    || "Particulier",
            consent:       true,
            commercial_id: profil?.id  || null,
            centre_id:     t.centre_id || null,
          },
          test: {
            level:              t.niveau,
            score:              Number(t.score) || 0,
            points_earned:      Number(t.score) || 0,
            points_total:       100,
            correct_answers:    0,
            total_questions:    0,
            time_taken_seconds: 0,
            answers_details:    [],
            audio_answers:      {},
            by_category:        {},
            by_cefr:            {},
            notes_oral:         t.notes || null,
            source:             "oral",
          },
          submitted_at: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erreur lors de l'enregistrement"); return; }
      toast.success("Test oral enregistré ✅");
      setShowTestModal(false); setEditingItem(null);
      // Rafraîchir la liste puis ouvrir le détail
      await fetchTests();
      if (data.result) {
        const mapped = {
          id:              data.result.id,
          nom:             (data.result.fullname || "").split(" ")[0] || t.nom,
          prenom:          (data.result.fullname || "").split(" ").slice(1).join(" ") || t.prenom,
          email:           data.result.email        || "",
          telephone:       data.result.phone        || "",
          niveau:          data.result.level,
          score:           data.result.score        || 0,
          date:            data.result.submitted_at ? data.result.submitted_at.split("T")[0] : "",
          commercial_id:   data.result.commercial_id || null,
          source:          "oral",
          notes:           data.result.notes_oral   || t.notes || "",
          by_category:     {},
          by_cefr:         {},
          answers_details: [],
          audio_answers:   {},
        };
        setSelectedTest(mapped);
        setShowTestDetailModal(true);
      }
    } catch (err) {
      toast.error("Erreur réseau lors de l'enregistrement");
    }
  };

  // ── Conversion Inscription → Apprenant BET ──────────
  const convertirEnApprenant = (insc) => {
    if (insc.statut !== "confirmée") { toast.error("Paiement non confirmé — impossible de convertir"); return; }
    const pmt = paiements.find(p => p.client === insc.client && p.statut === "reçu");
    if (!pmt) { toast.error("Aucun paiement 'Reçu' trouvé pour ce client — validez d'abord le paiement"); return; }
    setInscriptions(prev => prev.map(i => i.id === insc.id ? { ...i, apprenantConverti:true } : i));
    setLeads(prev => prev.map(l => l.client === insc.client ? { ...l, statut:"converti" } : l));
    toast.success(`✅ ${insc.client} converti(e) en Apprenant BET — dossier transféré au Responsable pédagogique`);
    toast(`📋 Responsable pédagogique notifié — dossier ${insc.client} (${insc.offre}) reçu`, { icon:"📨", duration:4000 });
  };

  // ── Générer reçu de paiement ─────────────────────────
  const genererRecu = (p) => {
    const dateStr = p.date ? new Date(p.date).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }) : new Date().toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
    const now = new Date().toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
    const num = `BET-REC-${String(p.id).padStart(4,"0")}-${new Date().getFullYear()}`;
    const reste = (p.montantDu || 0) - (p.montantReçu || 0);
    const isComplet = p.statut === "reçu" || reste <= 0;
    const w = window.open("","_blank","width=720,height=900");
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Reçu ${num}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#1e293b;background:#fff}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0891b2;padding-bottom:20px;margin-bottom:28px}
      .logo{font-size:28px;font-weight:900;color:#0891b2;letter-spacing:-1px}
      .logo span{color:#0f172a}
      .logo-sub{font-size:11px;color:#6b7280;margin-top:4px}
      h2{margin:0 0 4px;font-size:20px;font-weight:800;color:#0f172a}
      .num{font-size:11px;color:#6b7280;margin-top:2px}
      section{margin-bottom:20px}
      .section-title{font-size:11px;font-weight:800;color:#0891b2;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;border-bottom:1px solid #e0f2fe;padding-bottom:4px}
      table{width:100%;border-collapse:collapse}
      td{padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;vertical-align:top}
      .lbl{color:#6b7280;font-weight:500;width:42%}
      .val{font-weight:600;color:#0f172a}
      .total-row td{background:#f0f9ff;font-weight:800;font-size:15px;color:#0891b2;border-top:2px solid #0891b2;border-bottom:none}
      .ref-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;font-family:monospace;font-size:13px;color:#0891b2;font-weight:700;margin-top:4px;display:inline-block}
      .badge-ok{display:inline-block;background:#dcfce7;color:#166534;padding:5px 16px;border-radius:20px;font-weight:700;font-size:12px}
      .badge-partial{display:inline-block;background:#fef3c7;color:#92400e;padding:5px 16px;border-radius:20px;font-weight:700;font-size:12px}
      .stamp{display:inline-block;border:3px solid ${isComplet ? "#22c55e" : "#f59e0b"};color:${isComplet ? "#166534" : "#92400e"};padding:6px 20px;border-radius:8px;font-weight:900;font-size:16px;transform:rotate(-4deg);margin-top:12px;letter-spacing:.08em}
      .footer{margin-top:36px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center;line-height:1.7}
      @media print{body{padding:20px}}
    </style></head><body>
    <div class="header">
      <div>
        <div class="logo">BET<span>Languages</span></div>
        <div class="logo-sub">Centre de langues — Abidjan, Côte d'Ivoire</div>
        <div class="logo-sub" style="margin-top:2px">📧 contact@betlanguages.ci · 📞 +225 27 22 XX XX XX</div>
      </div>
      <div style="text-align:right">
        <h2>REÇU DE PAIEMENT</h2>
        <div class="num">N° ${num}</div>
        <div class="num">Émis le ${now}</div>
      </div>
    </div>

    <section>
      <div class="section-title">📋 Informations client</div>
      <table>
        <tr><td class="lbl">Nom du client</td><td class="val">${p.client || "—"}</td></tr>
        ${p.email    ? `<tr><td class="lbl">Email</td><td class="val">${p.email}</td></tr>` : ""}
        ${p.telephone ? `<tr><td class="lbl">Téléphone</td><td class="val">${p.telephone}</td></tr>` : ""}
        ${p.inscription ? `<tr><td class="lbl">Formation / Parcours</td><td class="val">${p.inscription}</td></tr>` : ""}
      </table>
    </section>

    <section>
      <div class="section-title">💳 Détails du paiement</div>
      <table>
        <tr><td class="lbl">Date de réception</td><td class="val">${dateStr}</td></tr>
        <tr><td class="lbl">Mode de paiement</td><td class="val">${p.mode || "—"}</td></tr>
        ${p.refTransaction ? `<tr><td class="lbl">Référence transaction</td><td class="val"><span class="ref-box">🔖 ${p.refTransaction}</span></td></tr>` : ""}
        ${p.notes ? `<tr><td class="lbl">Notes</td><td class="val" style="color:#6b7280;font-weight:400">${p.notes}</td></tr>` : ""}
      </table>
    </section>

    <section>
      <div class="section-title">💰 Récapitulatif financier</div>
      <table>
        <tr><td class="lbl">Montant total dû</td><td class="val">${Number(p.montantDu || 0).toLocaleString("fr-FR")} FCFA</td></tr>
        <tr><td class="lbl">Montant reçu</td><td class="val" style="color:#22c55e">${Number(p.montantReçu || 0).toLocaleString("fr-FR")} FCFA</td></tr>
        ${reste > 0 ? `<tr><td class="lbl">Reste à payer</td><td class="val" style="color:#ef4444;font-weight:800">${Number(reste).toLocaleString("fr-FR")} FCFA</td></tr>` : ""}
        <tr class="total-row"><td>TOTAL ENCAISSÉ</td><td>${Number(p.montantReçu || 0).toLocaleString("fr-FR")} FCFA</td></tr>
      </table>
    </section>

    <div style="text-align:center;margin-top:28px">
      <div class="${isComplet ? "badge-ok" : "badge-partial"}">${isComplet ? "✅ PAIEMENT INTÉGRAL CONFIRMÉ" : "⏳ PAIEMENT PARTIEL — SOLDE EN ATTENTE"}</div>
      <br/><div class="stamp">${isComplet ? "PAYÉ" : "PARTIEL"}</div>
    </div>
    <div class="footer">
      Ce reçu est généré automatiquement par le système BET Languages. Conservez ce document pour vos archives.<br/>
      BET Languages · Centre de langues agréé · Abidjan, Côte d'Ivoire<br/>
      contact@betlanguages.ci · +225 27 22 XX XX XX
    </div>
    <script>window.onload=()=>window.print();</script>
    </body></html>`);
    w.document.close();
    toast.success(`Reçu ${num} généré`);
  };

  // ── Télécharger document (simulation) ───────────────
  const telechargerDocument = (doc, client) => {
    const content = `DOCUMENT : ${doc.nom}\nClient : ${client}\nDate : ${new Date().toLocaleDateString("fr-FR")}\n\n[Contenu du document — en production, ce fichier serait le document réel uploadé]`;
    const blob = new Blob([content], { type:"text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.nom.replace(/\s+/g,"_")}_${client.replace(/\s+/g,"_")}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success(`📎 ${doc.nom} téléchargé`);
  };


  // ── Export ───────────────────────────────────────────
  const exportCSV = (data, filename) => {
    if (!data.length) return toast.error("Aucune donnée à exporter");
    const headers = Object.keys(data[0]);
    const rows = [headers.join(","), ...data.map(r => headers.map(h => JSON.stringify(r[h]||"")).join(","))];
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type:"text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success(`Export ${filename}.csv effectué`);
  };
  const exportPDF = (data, title) => {
    if (!data.length) return toast.error("Aucune donnée à exporter");
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>${title}</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}</style></head><body><h1>${title}</h1><table><thead><tr>${Object.keys(data[0]).map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${data.map(r=>`<tr>${Object.values(r).map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`);
    w.document.close(); w.print(); toast.success(`PDF ${title} lancé`);
  };
  const handlePlanifierEnvoi = () => {
    toast.success(`Planification enregistrée : ${planifConfig.frequence} → ${planifConfig.emails} (${planifConfig.format.toUpperCase()})`);
    setShowPlanifModal(false);
  };

  // ── Tab config (dynamique selon profil b2c/b2b/les_deux) ─
  const B2B_PIPELINE_STEPS = [
    { id:"prospection", label:"Prospection", color:"#64748b", bg:"#f8fafc" },
    { id:"negociation", label:"Négociation", color:"#f59e0b", bg:"#fffbeb" },
    { id:"proposition", label:"Proposition", color:"#0891b2", bg:"#e0f2fe" },
    { id:"conclu",      label:"Conclu ✅",   color:"#16a34a", bg:"#f0fdf4" },
    { id:"perdu",       label:"Perdu ❌",    color:"#dc2626", bg:"#fef2f2" },
  ];
  const B2B_DOC_TYPES = { proforma:"📄 Proforma", bon_commande:"📋 Bon de commande", contrat:"📑 Contrat", autre:"📎 Autre" };
  const B2B_FACT_STATUTS = { brouillon:"⚪ Brouillon", envoyée:"📤 Envoyée", payée:"✅ Payée", en_retard:"🔴 En retard", annulée:"❌ Annulée" };
  const B2B_FACT_COLORS  = { brouillon:"#94a3b8", envoyée:"#0891b2", payée:"#16a34a", en_retard:"#dc2626", annulée:"#9ca3af" };
  const B2B_SECTEURS = ["Finance / Banque","Industrie","Commerce / Distribution","Services","Santé","Éducation","Télécoms","BTP / Immobilier","Agro-alimentaire","Énergie","Transport / Logistique","Autre"];

  const b2bFacturesEnRetard = b2bFactures.filter(f => f.statut === "en_retard").length;
  const b2bProspectsActifs  = b2bProspects.filter(p => !["conclu","perdu"].includes(p.statut)).length;

  const TABS = [
    ...(hasB2C ? [
      { key:"dashboard",     label:"Tableau de bord",   icon:"📊" },
      { key:"apprenants",    label:"Mes apprenants",    icon:"🎓", badge: assignations.filter(a => a.statut === "converti").length || null },
      { key:"paiements",     label:"Paiements",         icon:"💳", badge: paiements.filter(p=>p.statut==="en_attente").length },
      { key:"assignations",  label:"Prospects parcours",icon:"🎯", badge: (assignations.filter(a => a.statut === "en_attente").length + clientMessages.filter(m=>m.statut==="nouveau").length) || null },
      { key:"tests",         label:"Tests reçus",       icon:"📝", badge: tests.filter(t=>t.statut==="nouveau").length },
      { key:"leads",         label:"Leads",             icon:"👥" },
      { key:"devis",         label:"Devis",             icon:"📄" },
      { key:"inscriptions",  label:"Inscriptions",      icon:"✅" },
      { key:"dossiers",      label:"Dossiers",          icon:"📁", badge: dossiers.filter(d=>d.statut==="reçu"||d.statut==="en_étude").length },
      { key:"sondages",      label:"Sondages",          icon:"🎯", badge: sondages.length },
    ] : []),
    ...(hasB2B ? [
      ...(assistanteProfil === "les_deux" ? [{ key:"__b2b_sep", label:"── Corporate ──", isSep:true }] : []),
      { key:"entreprises",    label:"Comptes entreprises", icon:"🏢" },
      { key:"pipeline_b2b",   label:"Pipeline B2B",        icon:"🔄", badge: b2bProspectsActifs || null },
      { key:"documents_b2b",  label:"Documents",           icon:"📄" },
      { key:"facturation_b2b",label:"Facturation",         icon:"🧾", badge: b2bFacturesEnRetard || null },
    ] : []),
    { key:"messages",    label:"Messages",    icon:"💬", badge: totalNonLu },
    ...(hasB2C ? [
      { key:"newsletters", label:"Newsletters", icon:"📰", badge: newsletters.filter(n=>!n.lu).length },
    ] : []),
  ];

  const currentExportData = () => {
    if (activeTab === "leads")        return filteredLeads;
    if (activeTab === "devis")        return filteredDevis;
    if (activeTab === "inscriptions") return filteredInscriptions;
    if (activeTab === "tests")        return filteredTests;
    if (activeTab === "paiements")    return paiements;
    if (activeTab === "dossiers")     return dossiers;
    return [];
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f9ff" }}>
      <Toaster position="top-right" />

      {/* HERO */}
      <div style={{ background:BET_GRADIENT, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
        <div style={{ position:"absolute", bottom:-60, right:80, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }} />
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
            <div>
              <div style={{ fontSize:11, color:"#7dd3fc", fontWeight:600, letterSpacing:"0.08em" }}>Bonjour 👋</div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{nomComplet}</h1>
              <div style={{ fontSize:12, color:"#bae6fd", marginTop:3 }}>
                {assistanteProfil === "b2b" ? "🏢 Commerciale Corporate B2B" : assistanteProfil === "les_deux" ? "🔀 Commerciale B2C + Corporate B2B" : "Commercial"} · {profil?.email || ""}
              </div>
              {centreName && <div style={{ fontSize:11, color:"#7dd3fc", marginTop:2, fontWeight:600 }}>📍 {centreName}</div>}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <NotificationBell userId={profil?.id} />
            <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", backdropFilter:"blur(4px)", transition:"background .2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
              <span>🚪</span> Déconnexion
            </button>
          </div>
        </div>
        <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden" }}>
          {(assistanteProfil === "b2b" ? [
            { l:"Comptes entreprises",  v:b2bEntreprises.length,        c:"#818cf8" },
            { l:"Prospects actifs",     v:b2bProspectsActifs,           c:"#38bdf8" },
            { l:"CA estimé (pipeline)", v:fmtB2B(b2bProspects.filter(p=>p.statut!=="perdu").reduce((s,p)=>s+(Number(p.montant_estime)||0),0)), c:"#34d399" },
            { l:"Factures en retard",   v:b2bFacturesEnRetard,          c:"#f87171" },
          ] : assistanteProfil === "les_deux" ? [
            { l:"Apprenants actifs",    v:assignations.filter(a=>a.statut==="converti").length, c:"#38bdf8" },
            { l:"Prospects B2B actifs", v:b2bProspectsActifs,           c:"#818cf8" },
            { l:"CA encaissé (B2C)",    v:Number(caPaiements).toLocaleString("fr-FR")+" F",    c:"#34d399" },
            { l:"Factures retard (B2B)",v:b2bFacturesEnRetard,          c:"#f87171" },
          ] : [
            { l:"Tests reçus (mois)",   v:filteredTests.length,         c:"#38bdf8" },
            { l:"Leads actifs",         v:leads.filter(l=>l.statut!=="perdu").length, c:"#818cf8" },
            { l:"Taux conversion",      v:`${leads.length?Math.round((inscriptions.length/leads.length)*100):0}%`, c:"#34d399" },
            { l:"CA encaissé",          v:Number(caPaiements).toLocaleString("fr-FR")+" F",    c:"#fbbf24" },
          ]).map((s,i,arr)=>(
            <div key={s.l} style={{ flex:1, textAlign:"center", padding:"14px 8px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.08)":"none" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>{s.l}</div>
              <div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 24px 32px" }}>
        <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", overflow:"hidden" }}>

          {/* TABS */}
          <div style={{ display:"flex", gap:0, borderBottom:"1px solid #e5e7eb", overflowX:"auto", background:"#fafafa" }}>
            {TABS.map(tab => tab.isSep ? (
              <div key={tab.key} style={{ display:"flex", alignItems:"center", padding:"0 8px", fontSize:10, color:"#94a3b8", fontWeight:700, letterSpacing:"0.08em", whiteSpace:"nowrap", borderLeft:"2px solid #e5e7eb", marginLeft:4 }}>
                🏢 CORPORATE
              </div>
            ) : (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding:"12px 16px", border:"none", borderBottom: activeTab===tab.key ? `3px solid ${BET_COLOR}` : "3px solid transparent",
                cursor:"pointer", fontWeight:600, fontSize:12, whiteSpace:"nowrap",
                background:"transparent", color:activeTab===tab.key ? BET_COLOR : "#6b7280",
                display:"flex", alignItems:"center", gap:6, transition:"color .15s",
              }}>
                <span style={{ fontSize:14 }}>{tab.icon}</span>
                {tab.label}
                {tab.badge > 0 && <span style={{ background:"#ef4444", color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"1px 6px", minWidth:18, textAlign:"center" }}>{tab.badge}</span>}
              </button>
            ))}
          </div>

          <div style={{ padding:24 }}>
            {/* Barre d'outils commune */}
            {activeTab !== "messages" && (
              <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
                <input
                  placeholder="🔍 Rechercher un client..."
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  style={{ padding:"7px 12px", borderRadius:6, border:"1px solid #e5e7eb", fontSize:12, width:200 }}
                />
                <select value={periode} onChange={e=>setPeriode(e.target.value)} style={selectSt}>
                  <option value="semaine">Semaine</option><option value="mois">Mois</option>
                  <option value="trimestre">Trimestre</option><option value="annee">Année</option>
                </select>
                <select value={filtreOffre} onChange={e=>setFiltreOffre(e.target.value)} style={selectSt}>
                  <option value="Toutes">Toutes offres</option>
                  {OFFRE_LIST.map(o=><option key={o}>{o}</option>)}
                </select>
                <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                  <button onClick={() => exportCSV(currentExportData(), activeTab)} style={btnSecondary}>📊 Excel</button>
                  <button onClick={() => exportPDF(currentExportData(), activeTab)} style={btnSecondary}>📄 PDF</button>
                  <button onClick={() => setShowPlanifModal(true)} style={btnSecondary}>📧 Planifier</button>
                </div>
              </div>
            )}

            {/* ══ DASHBOARD ══ */}
            {activeTab === "dashboard" && (
              <div>
                {/* Alertes */}
                {alertes.length > 0 && (
                  <div style={{ marginBottom:20, display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:4 }}>🔔 Alertes</div>
                    {alertes.slice(0,5).map((a,i) => {
                      const colors = { warning:{ bg:"#fef9c3", text:"#92400e", border:"#fcd34d" }, info:{ bg:"#e0f2fe", text:"#0369a1", border:"#38bdf8" }, danger:{ bg:"#fee2e2", text:"#991b1b", border:"#fca5a5" } };
                      const c = colors[a.type];
                      return (
                        <div key={i} onClick={() => setActiveTab(a.tab)} style={{ padding:"9px 14px", borderRadius:8, background:c.bg, border:`1px solid ${c.border}`, color:c.text, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span>{a.msg}</span>
                          <span style={{ fontSize:10, opacity:0.6 }}>Voir →</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Stat cards */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
                  <StatCard label="Tests reçus" value={tests.length} color="#0891b2" icon="📝" sub={`${tests.filter(t=>t.statut==="nouveau").length} nouveau(x)`} onClick={() => setActiveTab("tests")} />
                  <StatCard label="Leads actifs" value={leads.filter(l=>l.statut!=="perdu").length} color="#6366f1" icon="👥" sub="en cours de traitement" onClick={() => setActiveTab("leads")} />
                  <StatCard label="Devis en attente" value={devis.filter(d=>d.statut==="envoyé").length} color="#f59e0b" icon="📄" sub="réponse attendue" onClick={() => setActiveTab("devis")} />
                  <StatCard label="CA encaissé" value={Number(caPaiements).toLocaleString("fr-FR")+" F"} color="#22c55e" icon="💰" sub="paiements confirmés" onClick={() => setActiveTab("paiements")} />
                </div>

                {/* Pipeline commercial */}
                <div style={{ background:"#f8fafc", borderRadius:12, padding:20, marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>🔄 Pipeline commercial</div>
                  <div style={{ display:"flex", alignItems:"center", gap:0 }}>
                    {[
                      { label:"Tests reçus",   count:tests.length,         color:"#0891b2", bg:"#e0f2fe" },
                      { label:"Leads",          count:leads.length,         color:"#6366f1", bg:"#ede9fe" },
                      { label:"Devis",          count:devis.length,         color:"#f59e0b", bg:"#fef3c7" },
                      { label:"Inscriptions",   count:inscriptions.length,  color:"#22c55e", bg:"#dcfce7" },
                      { label:"Paiements reçus",count:paiements.filter(p=>p.statut==="reçu").length, color:"#14b8a6", bg:"#ccfbf1" },
                    ].map((step, i, arr) => (
                      <React.Fragment key={step.label}>
                        <div style={{ flex:1, textAlign:"center", padding:"12px 8px", background:step.bg, borderRadius:i===0?"8px 0 0 8px":i===arr.length-1?"0 8px 8px 0":"0", border:`1px solid ${step.color}30` }}>
                          <div style={{ fontSize:22, fontWeight:800, color:step.color }}>{step.count}</div>
                          <div style={{ fontSize:10, color:step.color, fontWeight:600 }}>{step.label}</div>
                        </div>
                        {i < arr.length-1 && (
                          <div style={{ fontSize:18, color:"#94a3b8", zIndex:1, margin:"0 -2px" }}>›</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Dossiers en attente */}
                <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📁 Dossiers à valider</div>
                  {dossiers.filter(d=>d.statut==="reçu"||d.statut==="en_étude").map(d => (
                    <div key={d.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #e5e7eb" }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{d.client}</div>
                        <div style={{ fontSize:11, color:"#6b7280" }}>{d.offre} · Reçu le {formatDate(d.dateReception)}</div>
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <Badge {...(STATUT_DOSSIER[d.statut] || {})} label={STATUT_DOSSIER[d.statut]?.label || d.statut} />
                        <button onClick={() => updateDossierStatut(d.id,"accepté")} style={{ ...btnIconEdit, background:"#dcfce7", color:"#15803d", borderColor:"#22c55e40" }}>✓ Accepter</button>
                        <button onClick={() => updateDossierStatut(d.id,"refusé")}  style={{ ...btnIconEdit, background:"#fee2e2", color:"#b91c1c", borderColor:"#ef444440" }}>✕ Refuser</button>
                      </div>
                    </div>
                  ))}
                  {dossiers.filter(d=>d.statut==="reçu"||d.statut==="en_étude").length === 0 && (
                    <div style={{ fontSize:12, color:"#9ca3af", textAlign:"center", padding:16 }}>Aucun dossier en attente</div>
                  )}
                </div>
              </div>
            )}


            {/* ══ TESTS REÇUS ══ */}
            {activeTab === "tests" && (
              <div>
                {/* Workflow guide */}
                <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:12, padding:"14px 18px", marginBottom:18 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#0369a1", marginBottom:10 }}>📋 Workflow — Que faire après réception d'un test de niveau ?</div>
                  <div style={{ display:"flex", gap:0, alignItems:"stretch" }}>
                    {[
                      ["1","📥","Test reçu","Le prospect a soumis son test depuis le site web","#0891b2"],
                      ["2","📞","Contacter","Appelez dans les 24h pour présenter les offres adaptées à son niveau","#6366f1"],
                      ["3","📄","Créer devis","Convertissez en Lead → générez un devis personnalisé","#f59e0b"],
                      ["4","✅","Inscription","Validez l'inscription et collectez le dossier complet","#22c55e"],
                      ["5","💳","Paiement","Enregistrez le paiement et générez le reçu","#14b8a6"],
                      ["6","🎓","→ Apprenant","Transférez le dossier au Responsable Pédagogique","#8b5cf6"],
                    ].map((s,i,arr)=>(
                      <React.Fragment key={s[0]}>
                        <div style={{ flex:1, textAlign:"center", padding:"8px 4px" }}>
                          <div style={{ width:28,height:28,borderRadius:"50%",background:s[4],color:"#fff",fontWeight:800,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 4px" }}>{s[0]}</div>
                          <div style={{ fontSize:16 }}>{s[1]}</div>
                          <div style={{ fontSize:10,fontWeight:700,color:s[4],marginTop:2 }}>{s[2]}</div>
                          <div style={{ fontSize:9,color:"#6b7280",marginTop:2,lineHeight:1.3 }}>{s[3]}</div>
                        </div>
                        {i<arr.length-1&&<div style={{ color:"#94a3b8",fontSize:16,alignSelf:"center",flexShrink:0 }}>›</div>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <span style={{ fontSize:12, color:"#6b7280" }}>
                    {testsLoading ? "⏳ Chargement…" : `${filteredTests.length} test${filteredTests.length > 1 ? "s" : ""} · ${tests.filter(t=>t.statut==="nouveau").length} nouveau${tests.filter(t=>t.statut==="nouveau").length > 1 ? "x" : ""}`}
                  </span>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => { fetchTests(); toast.success("Actualisation…"); }} style={{ ...btnSecondary, fontSize:11, padding:"6px 12px" }} disabled={testsLoading}>
                      🔄 Actualiser
                    </button>
                    <button onClick={() => { setEditingItem(null); setShowTestModal(true); }} style={btnPrimary}>+ Ajouter manuellement</button>
                  </div>
                </div>
                {testsLoading && <div style={{ textAlign:"center", padding:"30px", color:"#0891b2", fontSize:13 }}>⏳ Chargement des tests depuis la base de données…</div>}
                {/* Stats sources acquisition */}
                {Object.keys(sondageStats).length > 0 && (
                  <div style={{ background:"#faf5ff", border:"1px solid #e9d5ff", borderRadius:12, padding:"14px 18px", marginBottom:16 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#7c3aed", marginBottom:10 }}>🎯 Sources d'acquisition de vos clients</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {Object.entries(sondageStats).sort((a,b)=>b[1]-a[1]).map(([src, count]) => {
                        const total = Object.values(sondageStats).reduce((s,v)=>s+v,0);
                        const pct = Math.round((count/total)*100);
                        return (
                          <div key={src} style={{ background:"#fff", border:"1px solid #ddd6fe", borderRadius:8, padding:"6px 12px", fontSize:11, display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontWeight:800, color:"#7c3aed" }}>{count}</span>
                            <span style={{ color:"#374151" }}>{src}</span>
                            <span style={{ color:"#a78bfa", fontSize:10 }}>({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <table style={{ width:"100%", borderCollapse:"collapse", display: testsLoading ? "none" : "table" }}>
                  <thead><tr style={{ background:"#f9fafb", fontSize:11, color:"#374151" }}>
                    <th style={th}>Candidat</th><th style={th}>Contact</th><th style={th}>Profil</th><th style={th}>Niveau</th><th style={th}>Score</th><th style={th}>Source</th><th style={th}>Offre recommandée</th><th style={th}>Date</th><th style={th}>Statut</th><th style={th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredTests.map(t => {
                      const st = STATUT_TEST[t.statut] || {};
                      const src = sourceClient(t.email);
                      return (
                        <tr key={t.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                          <td style={td}><div style={{ fontWeight:700 }}>{t.prenom} {t.nom}</div></td>
                          <td style={td}><div style={{ fontSize:11 }}>{t.telephone}</div><div style={{ fontSize:10,color:"#9ca3af" }}>{t.email}</div></td>
                          <td style={td}>{t.profil}</td>
                          <td style={td}><span style={{ fontWeight:800, color:BET_COLOR, background:BET_LIGHT, padding:"2px 8px", borderRadius:6 }}>{t.niveau}</span></td>
                          <td style={td}>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <div style={{ width:50, height:5, background:"#e5e7eb", borderRadius:5, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${t.score}%`, background:t.score>=70?"#22c55e":t.score>=50?"#f59e0b":"#ef4444", borderRadius:5 }} />
                              </div>
                              <span style={{ fontWeight:700 }}>{t.score}%</span>
                            </div>
                          </td>
                          <td style={td}>
                            {src
                              ? <span style={{ fontSize:11, background:"#f3e8ff", color:"#7c3aed", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>{src}</span>
                              : <span style={{ fontSize:10, color:"#d1d5db", fontStyle:"italic" }}>–</span>
                            }
                          </td>
                          <td style={td}><span style={{ fontSize:11, color:"#6b7280" }}>{t.offreRecommandee||"—"}</span></td>
                          <td style={td}>{formatDate(t.date)}</td>
                          <td style={td}><Badge {...st} label={st.label||t.statut} /></td>
                          <td style={td}>
                            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                              <button onClick={() => { setSelectedTest(t); setShowTestDetailModal(true); }} style={{ ...btnIconEdit, background:"#e0f2fe", color:"#0369a1" }}>🔍 Voir</button>
                              {t.statut !== "converti" && t.statut !== "archivé" && (
                                <button onClick={() => convertirTestEnLead(t)} style={{ ...btnIconEdit, background:"#dcfce7", color:"#15803d", borderColor:"#22c55e40" }}>→ Lead</button>
                              )}
                              <button onClick={() => { setEditingItem(t); setShowTestModal(true); }} style={btnIconEdit}>✏️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Tests non assignés (pas encore choisi de commerciale) */}
                {testsNonAssignes.length > 0 && myCommercialId && (
                  <div style={{ marginTop:24, padding:"14px 18px", borderRadius:12, background:"#fff7ed", border:"1px solid #fed7aa" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <div>
                        <span style={{ fontSize:13, fontWeight:700, color:"#92400e" }}>
                          📥 {testsNonAssignes.length} test{testsNonAssignes.length > 1 ? "s" : ""} sans conseillère assignée
                        </span>
                        <div style={{ fontSize:11, color:"#b45309", marginTop:2 }}>Ces prospects n'ont pas encore choisi leur conseillère depuis leur espace.</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {testsNonAssignes.slice(0, 5).map((t, i) => (
                        <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:8, background:"#fff", border:"1px solid #fde68a" }}>
                          <div style={{ width:32, height:32, borderRadius:"50%", background:"#fef3c7", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:"#92400e" }}>
                            {t.niveau}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{t.prenom} {t.nom}</div>
                            <div style={{ fontSize:11, color:"#6b7280" }}>{t.email} · {t.date}</div>
                          </div>
                          <span style={{ fontSize:11, color:"#b45309", fontWeight:600 }}>En attente de choix</span>
                        </div>
                      ))}
                      {testsNonAssignes.length > 5 && (
                        <div style={{ fontSize:11, color:"#92400e", textAlign:"center", paddingTop:4 }}>
                          + {testsNonAssignes.length - 5} autre{testsNonAssignes.length - 5 > 1 ? "s" : ""}…
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ LEADS ══ */}
            {activeTab === "leads" && (
              <div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
                  <button onClick={() => { setEditingItem(null); setShowLeadModal(true); }} style={btnPrimary}>+ Nouveau lead</button>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"#f9fafb", fontSize:11 }}>
                    <th style={th}>Client</th><th style={th}>Contact</th><th style={th}>Email</th><th style={th}>Source</th><th style={th}>Statut</th><th style={th}>Date</th><th style={th}>Montant potentiel</th><th style={th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredLeads.map(l => {
                      const st = STATUT_LEAD[l.statut] || {};
                      return (
                        <tr key={l.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                          <td style={td}><div style={{ fontWeight:600 }}>{l.client}</div></td>
                          <td style={td}>{l.contact}</td>
                          <td style={td}>{l.email}</td>
                          <td style={td}>{l.source}</td>
                          <td style={td}><Badge {...st} label={st.label||l.statut} /></td>
                          <td style={td}>{formatDate(l.date)}</td>
                          <td style={td}><span style={{ fontWeight:700 }}>{formatMoney(l.montantPotentiel)}</span></td>
                          <td style={td}>
                            {l.statut !== "converti" && (
                              <button onClick={() => convertirLeadEnDevis(l)} style={{ ...btnIconEdit, marginRight:4, background:"#fef3c7", color:"#92400e", borderColor:"#f59e0b40" }}>📄 Devis</button>
                            )}
                            <button onClick={() => { setEditingItem(l); setShowLeadModal(true); }} style={btnIconEdit}>✏️</button>
                            <button onClick={() => handleDeleteLead(l.id)} style={{ ...btnIconEdit, marginLeft:4, color:"#dc2626", background:"#fee2e2", borderColor:"#ef444440" }}>🗑️</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ══ DEVIS ══ */}
            {activeTab === "devis" && (
              <div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
                  <button onClick={() => { setEditingItem(null); setShowDevisModal(true); }} style={btnPrimary}>+ Nouveau devis</button>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"#f9fafb", fontSize:11 }}>
                    <th style={th}>Client</th><th style={th}>Offre</th><th style={th}>Montant</th><th style={th}>Date</th><th style={th}>Validité</th><th style={th}>Statut</th><th style={th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredDevis.map(d => {
                      const expired = d.statut === "envoyé" && isExpired(d.validite);
                      const statutKey = expired ? "expiré" : d.statut;
                      const st = STATUT_DEVIS[statutKey] || {};
                      return (
                        <tr key={d.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12, background:expired?"#fff7ed":"transparent" }}>
                          <td style={td}><div style={{ fontWeight:600 }}>{d.client}</div></td>
                          <td style={td}>{d.offre || "–"}</td>
                          <td style={td}><span style={{ fontWeight:700 }}>{formatMoney(d.montant)}</span></td>
                          <td style={td}>{formatDate(d.date)}</td>
                          <td style={td}>{formatDate(d.validite)}</td>
                          <td style={td}><Badge {...st} label={st.label||d.statut} /></td>
                          <td style={td}>
                            {(d.statut === "envoyé" || d.statut === "relancé") && (
                              <button onClick={() => relancerDevis(d)} style={{ ...btnIconEdit, marginRight:4, background:"#fef3c7", color:"#92400e", borderColor:"#f59e0b40" }}>📧 Relancer</button>
                            )}
                            <button onClick={() => { setEditingItem(d); setShowDevisModal(true); }} style={btnIconEdit}>✏️</button>
                            <button onClick={() => handleDeleteDevis(d.id)} style={{ ...btnIconEdit, marginLeft:4, color:"#dc2626", background:"#fee2e2", borderColor:"#ef444440" }}>🗑️</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ══ INSCRIPTIONS ══ */}
            {activeTab === "inscriptions" && (
              <div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
                  <button onClick={() => { setEditingItem(null); setShowInscriptionModal(true); }} style={btnPrimary}>+ Nouvelle inscription</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:14 }}>
                  {filteredInscriptions.map(insc => (
                    <div key={insc.id} style={{ background:"#fff", borderRadius:12, border:`1.5px solid ${insc.apprenantConverti?"#22c55e30":insc.statut==="confirmée"?"#0891b230":"#e5e7eb"}`, overflow:"hidden" }}>
                      <div style={{ height:4, background: insc.apprenantConverti?"#22c55e":insc.statut==="confirmée"?BET_COLOR:"#f59e0b" }} />
                      <div style={{ padding:16 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:14 }}>{insc.client}</div>
                            <div style={{ fontSize:11, color:"#6b7280" }}>{insc.contact} · {insc.telephone}</div>
                            <div style={{ fontSize:11, color:"#9ca3af" }}>{insc.email}</div>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                            <Badge label={insc.statut==="confirmée"?"Confirmée":"En attente"} color={insc.statut==="confirmée"?"#15803d":"#92400e"} bg={insc.statut==="confirmée"?"#dcfce7":"#fef3c7"} />
                            {insc.apprenantConverti && <Badge label="🎓 Apprenant BET" color="#7c3aed" bg="#f3e8ff" />}
                          </div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                          {[
                            { l:"Formation", v:insc.offre },
                            { l:"Niveau testé", v:insc.niveauTest || "—" },
                            { l:"Montant", v:formatMoney(insc.montant) },
                            { l:"Début", v:insc.dateDebut ? formatDate(insc.dateDebut) : "—" },
                          ].map(s=>(
                            <div key={s.l} style={{ padding:"6px 8px", borderRadius:6, background:"#f8fafc" }}>
                              <div style={{ fontSize:9, color:"#9ca3af" }}>{s.l}</div>
                              <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        {/* Documents */}
                        {insc.documents && insc.documents.length > 0 && (
                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontSize:10, fontWeight:700, color:"#374151", marginBottom:5 }}>📎 Documents ({insc.documents.length})</div>
                            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                              {insc.documents.map((doc,di)=>(
                                <button key={di} onClick={() => telechargerDocument(doc, insc.client)} style={{ fontSize:10, background:"#e0f2fe", color:"#0369a1", padding:"3px 8px", borderRadius:4, fontWeight:600, border:"none", cursor:"pointer" }}>⬇️ {doc.nom}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        {insc.notesAdmin && <div style={{ fontSize:11, color:"#6b7280", fontStyle:"italic", marginBottom:10 }}>📝 {insc.notesAdmin}</div>}
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          <button onClick={() => { setSelectedInscription(insc); setShowInscDetailModal(true); }} style={{ ...btnIconEdit, background:"#e0f2fe", color:"#0369a1" }}>🔍 Détail</button>
                          {!insc.apprenantConverti && insc.statut==="confirmée" && (
                            <button onClick={() => convertirEnApprenant(insc)} style={{ ...btnIconEdit, background:"#f3e8ff", color:"#7c3aed", borderColor:"#8b5cf640", fontWeight:700 }}>🎓 → Apprenant BET</button>
                          )}
                          <button onClick={() => { setEditingItem(insc); setShowInscriptionModal(true); }} style={btnIconEdit}>✏️</button>
                          <button onClick={() => handleDeleteInscription(insc.id)} style={{ ...btnIconEdit, color:"#dc2626", background:"#fee2e2", borderColor:"#ef444440" }}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ PAIEMENTS (NOUVEAU) ══ */}
            {activeTab === "paiements" && (() => {
              // ── Filtrage ────────────────────────────────────────
              const now2 = new Date();
              const paiFiltered = paiements.filter(p => {
                if (paiSearchQ && !`${p.client} ${p.email} ${p.telephone} ${p.refTransaction}`.toLowerCase().includes(paiSearchQ.toLowerCase())) return false;
                if (paiStatut !== "tous" && p.statut !== paiStatut) return false;
                if (paiMode   !== "tous" && p.mode   !== paiMode)   return false;
                if (paiPeriode !== "tous") {
                  const d = new Date(p.date);
                  if (paiPeriode === "semaine") { const w=new Date(); w.setDate(now2.getDate()-7); if(d<w) return false; }
                  else if (paiPeriode === "mois")      { if(d.getMonth()!==now2.getMonth()||d.getFullYear()!==now2.getFullYear()) return false; }
                  else if (paiPeriode === "trimestre") { if(Math.floor(d.getMonth()/3)!==Math.floor(now2.getMonth()/3)||d.getFullYear()!==now2.getFullYear()) return false; }
                  else if (paiPeriode === "annee")     { if(d.getFullYear()!==now2.getFullYear()) return false; }
                }
                return true;
              });

              // ── KPI sur données filtrées ─────────────────────────
              const kpiTotalEncaisse  = paiFiltered.reduce((s,p) => s + (p.montantReçu||0), 0);
              const kpiTotalDu        = paiFiltered.reduce((s,p) => s + (p.montantDu  ||0), 0);
              const kpiReste          = kpiTotalDu - kpiTotalEncaisse;
              const kpiNbComplet      = paiFiltered.filter(p => p.statut==="reçu").length;
              const kpiNbPartiel      = paiFiltered.filter(p => p.statut==="partiel").length;
              const kpiNbAttente      = paiFiltered.filter(p => p.statut==="en_attente").length;

              // ── Pagination ──────────────────────────────────────
              const totalPages = Math.max(1, Math.ceil(paiFiltered.length / PAI_PAGE_SIZE));
              const safePage   = Math.min(paiPage, totalPages);
              const paiPage_   = paiFiltered.slice((safePage-1)*PAI_PAGE_SIZE, safePage*PAI_PAGE_SIZE);

              // ── Modes uniques pour le filtre ────────────────────
              const modesUniques = [...new Set(paiements.map(p=>p.mode).filter(Boolean))];

              return (
              <div>
                {/* KPI row */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:20 }}>
                  <StatCard label="Total encaissé"  value={Number(kpiTotalEncaisse).toLocaleString("fr-FR")+" F"} color="#22c55e" icon="✅" sub={`${paiFiltered.length} paiement${paiFiltered.length>1?"s":""}`} />
                  <StatCard label="Total dû"         value={Number(kpiTotalDu).toLocaleString("fr-FR")+" F"}       color="#0891b2" icon="📋" />
                  <StatCard label="Reste à percevoir" value={Number(kpiReste>0?kpiReste:0).toLocaleString("fr-FR")+" F"} color={kpiReste>0?"#ef4444":"#22c55e"} icon="⏳" />
                  <StatCard label="Paiements complets" value={kpiNbComplet} color="#22c55e" icon="✔️" />
                  <StatCard label="Partiels"          value={kpiNbPartiel} color="#f59e0b" icon="🔄" />
                  <StatCard label="En attente"        value={kpiNbAttente} color="#ef4444" icon="⚠️" />
                </div>

                {/* Barre filtres */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:14, padding:"12px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}>
                  <input
                    value={paiSearchQ}
                    onChange={e=>{ setPaiSearchQ(e.target.value); setPaiPage(1); }}
                    placeholder="🔍 Rechercher client, email, tél, réf…"
                    style={{ ...inputSt, width:220, margin:0 }}
                  />
                  <select value={paiStatut} onChange={e=>{ setPaiStatut(e.target.value); setPaiPage(1); }} style={{ ...inputSt, width:160, margin:0 }}>
                    <option value="tous">Tous les statuts</option>
                    <option value="en_attente">⏳ En attente</option>
                    <option value="partiel">🔄 Partiel</option>
                    <option value="reçu">✅ Reçu</option>
                    <option value="remboursé">↩️ Remboursé</option>
                  </select>
                  <select value={paiMode} onChange={e=>{ setPaiMode(e.target.value); setPaiPage(1); }} style={{ ...inputSt, width:170, margin:0 }}>
                    <option value="tous">Tous les modes</option>
                    {modesUniques.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={paiPeriode} onChange={e=>{ setPaiPeriode(e.target.value); setPaiPage(1); }} style={{ ...inputSt, width:150, margin:0 }}>
                    <option value="tous">Toutes périodes</option>
                    <option value="semaine">Cette semaine</option>
                    <option value="mois">Ce mois</option>
                    <option value="trimestre">Ce trimestre</option>
                    <option value="annee">Cette année</option>
                  </select>
                  {(paiSearchQ||paiStatut!=="tous"||paiMode!=="tous"||paiPeriode!=="tous") && (
                    <button onClick={()=>{ setPaiSearchQ(""); setPaiStatut("tous"); setPaiMode("tous"); setPaiPeriode("tous"); setPaiPage(1); }} style={{ ...btnSecondary, padding:"6px 12px", margin:0, fontSize:11 }}>✕ Réinitialiser</button>
                  )}
                  <div style={{ marginLeft:"auto" }}>
                    <button onClick={() => { setEditingItem(null); setShowPaiementModal(true); }} style={btnPrimary}>+ Nouveau paiement</button>
                  </div>
                </div>

                {/* Table */}
                {paiFiltered.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8", fontSize:13 }}>Aucun paiement ne correspond aux filtres.</div>
                ) : (
                  <>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"#f9fafb", fontSize:11 }}>
                        <th style={th}>Client</th>
                        <th style={th}>Formation / Réf.</th>
                        <th style={th}>Dû</th>
                        <th style={th}>Reçu</th>
                        <th style={th}>Reste</th>
                        <th style={th}>Date</th>
                        <th style={th}>Mode</th>
                        <th style={th}>Statut</th>
                        <th style={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paiPage_.map(p => {
                        const reste = (p.montantDu||0) - (p.montantReçu||0);
                        const st = STATUT_PAIEMENT[p.statut] || {};
                        return (
                          <tr key={p.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12, background: p.assignationId ? "#fffdf5" : "#fff" }}>
                            <td style={td}>
                              <div style={{ fontWeight:700 }}>{p.client}</div>
                              {p.email     && <div style={{ fontSize:10, color:"#9ca3af" }}>✉ {p.email}</div>}
                              {p.telephone && <div style={{ fontSize:10, color:"#9ca3af" }}>📞 {p.telephone}</div>}
                              {p.assignationId && <span style={{ display:"inline-block", marginTop:3, background:"#fef3c7", color:"#d97706", borderRadius:999, padding:"1px 7px", fontSize:10, fontWeight:700 }}>🎯 Prospect</span>}
                            </td>
                            <td style={td}>
                              <div style={{ maxWidth:200 }}>{p.inscription || "–"}</div>
                              {p.refTransaction && <div style={{ marginTop:3 }}><span style={{ background:"#f0fdf4", color:"#15803d", borderRadius:4, padding:"1px 7px", fontSize:10, fontWeight:700, fontFamily:"monospace" }}>🔖 {p.refTransaction}</span></div>}
                              {p.notes && <div style={{ fontSize:10, color:"#94a3b8", marginTop:2, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={p.notes}>📝 {p.notes}</div>}
                            </td>
                            <td style={td}>{formatMoney(p.montantDu)}</td>
                            <td style={td}><span style={{ fontWeight:700, color:"#22c55e" }}>{formatMoney(p.montantReçu)}</span></td>
                            <td style={td}><span style={{ fontWeight:700, color:reste>0?"#ef4444":"#22c55e" }}>{reste>0?formatMoney(reste):"–"}</span></td>
                            <td style={td}>{formatDate(p.date)}</td>
                            <td style={td}>{p.mode||"–"}</td>
                            <td style={td}><Badge {...st} label={st.label||p.statut} /></td>
                            <td style={td}>
                              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                <button onClick={() => genererRecu(p)} style={{ ...btnIconEdit, background:"#f0fdf4", color:"#15803d", borderColor:"#22c55e40" }}>📄 Reçu</button>
                                {p.assignationId && (() => {
                                  const aLie = assignations.find(a => a.id === p.assignationId);
                                  const pmtsLies = paiements.filter(x => x.assignationId === p.assignationId);
                                  const tDu = pmtsLies.reduce((s,x)=>s+(x.montantDu||0),0);
                                  const tRec = pmtsLies.reduce((s,x)=>s+(x.montantReçu||0),0);
                                  const full = tDu > 0 && tRec >= tDu;
                                  return (
                                    <button
                                      disabled={full}
                                      title={full ? "Paiement à jour" : "Ajouter un versement pour cet apprenant"}
                                      onClick={() => {
                                        if (!aLie || full) return;
                                        const ml = aLie.type_cours==="en_ligne"?"En ligne":`Présentiel${aLie.centre_nom?" · "+aLie.centre_nom:""}`;
                                        const tl = aLie.type_coaching==="groupe"?"Coaching groupe":aLie.type_coaching==="prive"?"Coaching privé":"Formation";
                                        setEditingItem({ client:aLie.prospect_nom||"", email:aLie.prospect_email||"", telephone:aLie.prospect_telephone||"", inscription:`Parcours BET · ${ml} · ${tl}`, montantDu:tDu||0, montantReçu:0, date:new Date().toISOString().slice(0,10), mode:"Mobile Money", statut:"en_attente", notes:"", refTransaction:"", assignationId:aLie.id });
                                        setShowPaiementModal(true);
                                      }}
                                      style={{ ...btnIconEdit, background: full?"#f1f5f9":"#fffbeb", color: full?"#94a3b8":"#d97706", borderColor: full?"#e2e8f0":"#fde68a", cursor: full?"not-allowed":"pointer", opacity: full?0.6:1 }}
                                    >{full ? "✅" : "➕"}</button>
                                  );
                                })()}
                                <button onClick={() => { setEditingItem(p); setShowPaiementModal(true); }} style={btnIconEdit}>✏️</button>
                                <button onClick={() => handleDeletePaiement(p.id)} style={{ ...btnIconEdit, color:"#dc2626", background:"#fee2e2", borderColor:"#ef444440" }}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14, padding:"10px 4px" }}>
                      <span style={{ fontSize:11, color:"#6b7280" }}>
                        {(safePage-1)*PAI_PAGE_SIZE+1}–{Math.min(safePage*PAI_PAGE_SIZE, paiFiltered.length)} sur {paiFiltered.length} paiements
                      </span>
                      <div style={{ display:"flex", gap:4 }}>
                        <button onClick={()=>setPaiPage(1)} disabled={safePage===1} style={{ ...btnIconEdit, opacity:safePage===1?.4:1 }}>«</button>
                        <button onClick={()=>setPaiPage(p=>Math.max(1,p-1))} disabled={safePage===1} style={{ ...btnIconEdit, opacity:safePage===1?.4:1 }}>‹</button>
                        {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>Math.abs(n-safePage)<=2).map(n=>(
                          <button key={n} onClick={()=>setPaiPage(n)} style={{ ...btnIconEdit, background:n===safePage?BET_COLOR:"#fff", color:n===safePage?"#fff":"#374151", fontWeight:n===safePage?700:400 }}>{n}</button>
                        ))}
                        <button onClick={()=>setPaiPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages} style={{ ...btnIconEdit, opacity:safePage===totalPages?.4:1 }}>›</button>
                        <button onClick={()=>setPaiPage(totalPages)} disabled={safePage===totalPages} style={{ ...btnIconEdit, opacity:safePage===totalPages?.4:1 }}>»</button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </div>
              );
            })()}

            {/* ══ DOSSIERS (NOUVEAU) ══ */}
            {activeTab === "dossiers" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16, alignItems:"center" }}>
                  <p style={{ margin:0, fontSize:12, color:"#6b7280" }}>Acceptez ou refusez les dossiers clients avant de valider définitivement les inscriptions.</p>
                  <button onClick={() => { setEditingItem(null); setShowDossierModal(true); }} style={btnPrimary}>+ Nouveau dossier</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
                  {dossiers.map(d => {
                    const st = STATUT_DOSSIER[d.statut] || {};
                    return (
                      <div key={d.id} style={{ background:"#f8fafc", borderRadius:12, padding:16, border:`1px solid ${st.color || "#e5e7eb"}30` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                          <div>
                            <div style={{ fontSize:14, fontWeight:700 }}>{d.client}</div>
                            <div style={{ fontSize:12, color:"#6b7280" }}>{d.offre}</div>
                          </div>
                          <Badge {...st} label={st.label||d.statut} />
                        </div>
                        <div style={{ fontSize:11, color:"#6b7280", marginBottom:8 }}>
                          Reçu le {formatDate(d.dateReception)}
                          {d.commentaire && <span> · {d.commentaire}</span>}
                        </div>
                        {d.documents.length > 0 && (
                          <div style={{ marginBottom:12 }}>
                            <div style={{ fontSize:10, fontWeight:700, color:"#374151", marginBottom:5 }}>📎 Documents ({d.documents.length})</div>
                            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                              {d.documents.map((doc,di) => (
                                <button key={di} onClick={() => telechargerDocument(typeof doc==="string"?{nom:doc,type:"doc"}:doc, d.client)} style={{ fontSize:10, background:"#e0f2fe", color:"#0369a1", padding:"3px 8px", borderRadius:4, fontWeight:600, border:"none", cursor:"pointer" }}>⬇️ {typeof doc==="string"?doc:doc.nom}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        {(d.statut === "reçu" || d.statut === "en_étude") && (
                          <div style={{ display:"flex", gap:8 }}>
                            <button onClick={() => updateDossierStatut(d.id,"accepté")} style={{ flex:1, padding:"7px", borderRadius:6, border:"none", background:"#22c55e", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:11 }}>✓ Accepter</button>
                            <button onClick={() => updateDossierStatut(d.id,"en_étude")} style={{ flex:1, padding:"7px", borderRadius:6, border:"none", background:"#fef3c7", color:"#92400e", cursor:"pointer", fontWeight:700, fontSize:11 }}>🔍 En étude</button>
                            <button onClick={() => updateDossierStatut(d.id,"refusé")}  style={{ flex:1, padding:"7px", borderRadius:6, border:"none", background:"#ef4444", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:11 }}>✕ Refuser</button>
                          </div>
                        )}
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:6, marginTop:8 }}>
                          <button onClick={() => { setEditingItem(d); setShowDossierModal(true); }} style={btnIconEdit}>✏️ Modifier</button>
                          <button onClick={() => handleDeleteDossier(d.id)} style={{ ...btnIconEdit, color:"#dc2626", background:"#fee2e2", borderColor:"#ef444440" }}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ MESSAGERIE FIREBASE TEMPS RÉEL ══ */}
            {activeTab === "messages" && <MessagerieTab />}
            {/* ══ NEWSLETTERS ══ */}
            {activeTab === "newsletters" && (() => {
              const CAT_META = {
                interne:     { label:"Interne BET",    color:"#0891b2", bg:"#e0f2fe",  icon:"🏢" },
                marché:      { label:"Marché",         color:"#7c3aed", bg:"#f3e8ff",  icon:"📈" },
                partenaire:  { label:"Partenaire",     color:"#059669", bg:"#d1fae5",  icon:"🤝" },
                opportunité: { label:"Opportunité",    color:"#d97706", bg:"#fef3c7",  icon:"💡" },
                formation:   { label:"Formation",      color:"#6366f1", bg:"#ede9fe",  icon:"🚀" },
              };
              const nonLus = newsletters.filter(n=>!n.lu).length;
              const filtrees = filtreNewsCat === "Tous" ? newsletters : newsletters.filter(n => n.categorie === filtreNewsCat);
              return (
                <div>
                  {/* Stats */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
                    <StatCard label="Total reçues"  value={newsletters.length} color={BET_COLOR} icon="📰" />
                    <StatCard label="Non lues"       value={nonLus}             color="#ef4444"  icon="🔴" sub="à consulter" />
                    <StatCard label="Internes BET"   value={newsletters.filter(n=>n.categorie==="interne").length}     color="#0891b2" icon="🏢" />
                    <StatCard label="Opportunités"   value={newsletters.filter(n=>n.categorie==="opportunité").length} color="#d97706" icon="💡" />
                    <StatCard label="Partenaires"    value={newsletters.filter(n=>n.categorie==="partenaire").length}  color="#059669" icon="🤝" />
                  </div>

                  {/* Filtres catégories */}
                  <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
                    <button onClick={()=>setFiltreNewsCat("Tous")} style={{ padding:"7px 16px", borderRadius:20, border:`1.5px solid ${filtreNewsCat==="Tous"?BET_COLOR:"#e5e7eb"}`, background:filtreNewsCat==="Tous"?BET_LIGHT:"#fff", color:filtreNewsCat==="Tous"?BET_COLOR:"#6b7280", fontWeight:filtreNewsCat==="Tous"?700:400, fontSize:12, cursor:"pointer" }}>
                      Toutes <span style={{ marginLeft:4, padding:"1px 7px", borderRadius:10, background:filtreNewsCat==="Tous"?BET_COLOR:"#e5e7eb", color:filtreNewsCat==="Tous"?"#fff":"#374151", fontSize:10, fontWeight:700 }}>{newsletters.length}</span>
                    </button>
                    {Object.entries(CAT_META).map(([key,m])=>(
                      <button key={key} onClick={()=>setFiltreNewsCat(key)} style={{ padding:"7px 14px", borderRadius:20, border:`1.5px solid ${filtreNewsCat===key?m.color:"#e5e7eb"}`, background:filtreNewsCat===key?m.bg:"#fff", color:filtreNewsCat===key?m.color:"#6b7280", fontWeight:filtreNewsCat===key?700:400, fontSize:12, cursor:"pointer" }}>
                        {m.icon} {m.label} <span style={{ marginLeft:3, padding:"1px 6px", borderRadius:10, background:filtreNewsCat===key?m.color:"#e5e7eb", color:filtreNewsCat===key?"#fff":"#374151", fontSize:10, fontWeight:700 }}>{newsletters.filter(n=>n.categorie===key).length}</span>
                      </button>
                    ))}
                    <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                      {nonLus > 0 && (
                        <button onClick={()=>setNewsletters(prev=>prev.map(n=>({...n,lu:true})))} style={{ padding:"7px 14px", borderRadius:20, border:"1.5px solid #e5e7eb", background:"#f8fafc", color:"#6b7280", fontSize:12, cursor:"pointer", fontWeight:600 }}>✓ Tout marquer lu</button>
                      )}
                    </div>
                  </div>

                  {/* Liste newsletters */}
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {filtrees.map(nl => {
                      const cat = CAT_META[nl.categorie] || { label:nl.categorie, color:"#6b7280", bg:"#f3f4f6", icon:"📧" };
                      return (
                        <div key={nl.id} onClick={()=>{ setSelectedNewsletter(nl); setShowNewsletterModal(true); setNewsletters(prev=>prev.map(n=>n.id===nl.id?{...n,lu:true}:n)); }}
                          style={{ background:"#fff", borderRadius:12, border:`1.5px solid ${nl.lu?"#e5e7eb":BET_COLOR+"40"}`, padding:"16px 20px", cursor:"pointer", transition:"box-shadow .15s", display:"flex", gap:16, alignItems:"flex-start",
                            boxShadow: nl.lu ? "none" : "0 2px 8px rgba(8,145,178,0.10)" }}>
                          {/* Icône catégorie */}
                          <div style={{ width:44, height:44, borderRadius:10, background:cat.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{cat.icon}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5, gap:8 }}>
                              <div>
                                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                                  {!nl.lu && <span style={{ width:8, height:8, borderRadius:"50%", background:"#ef4444", display:"inline-block", flexShrink:0 }} />}
                                  <span style={{ fontSize:14, fontWeight:nl.lu?600:800, color:"#0f172a" }}>{nl.sujet}</span>
                                </div>
                                <div style={{ fontSize:11, color:"#6b7280" }}>De : <strong>{nl.expediteur}</strong> · {nl.expediteurEmail}</div>
                              </div>
                              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                                <span style={{ fontSize:11, color:"#9ca3af", whiteSpace:"nowrap" }}>{formatDate(nl.date)}</span>
                                <span style={{ padding:"2px 10px", borderRadius:10, fontSize:10, fontWeight:700, background:cat.bg, color:cat.color }}>{cat.icon} {cat.label}</span>
                              </div>
                            </div>
                            <p style={{ fontSize:12, color:"#6b7280", margin:"6px 0 8px", lineHeight:1.5 }}>{nl.resume}</p>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              <span style={{ fontSize:11, color:BET_COLOR, fontWeight:600 }}>Lire la newsletter →</span>
                              {nl.pieceJointe && (
                                <span style={{ fontSize:10, color:"#6b7280", background:"#f1f5f9", padding:"2px 8px", borderRadius:4 }}>📎 {nl.pieceJointe}</span>
                              )}
                              {!nl.lu && <span style={{ fontSize:10, background:"#fee2e2", color:"#dc2626", padding:"2px 8px", borderRadius:4, fontWeight:700 }}>NOUVEAU</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filtrees.length === 0 && (
                      <div style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:13 }}>Aucune newsletter dans cette catégorie</div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ══ ONGLET SONDAGES ══ */}
            {activeTab === "sondages" && (() => {
              const SOURCE_ICONS = {
                "Bouche à oreille":"🗣️","Facebook / Instagram":"📱","LinkedIn":"💼",
                "Google / Recherche web":"🔍","Radio / Télévision":"📺",
                "Affichage / Flyers":"📋","Recommandé par un ami":"👫",
                "Recommandé par mon entreprise":"🏢","Autre":"✏️",
              };
              const total = sondages.length;
              const topSource = Object.entries(sondageStats).sort((a,b)=>b[1]-a[1])[0];

              return (
                <div>
                  {/* En-tête */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                    <div>
                      <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0f172a" }}>🎯 Sondage — Comment vos clients vous ont-ils connu ?</h3>
                      <p style={{ margin:"4px 0 0", fontSize:12, color:"#6b7280" }}>Réponses recueillies automatiquement depuis l'espace client après le test de niveau.</p>
                    </div>
                    <button onClick={() => { fetchSondages(); toast.success("Actualisation…"); }} style={{ ...btnSecondary, fontSize:11, padding:"6px 12px" }}>🔄 Actualiser</button>
                  </div>

                  {/* Stat cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                    <StatCard label="Réponses reçues"  value={total}                         color="#7c3aed" icon="📋" sub="clients ayant répondu" />
                    <StatCard label="Source principale" value={topSource ? topSource[0] : "—"} color="#0891b2" icon="🏆" sub={topSource ? `${topSource[1]} client(s)` : ""} />
                    <StatCard label="Sources distinctes" value={Object.keys(sondageStats).length} color="#059669" icon="🌐" />
                  </div>

                  {total === 0 ? (
                    <div style={{ textAlign:"center", padding:"60px 24px", background:"#f8fafc", borderRadius:16, border:"1.5px dashed #e2e8f0" }}>
                      <div style={{ fontSize:"3rem", marginBottom:12 }}>🎯</div>
                      <div style={{ fontWeight:700, color:"#0f172a", marginBottom:8 }}>Aucune réponse pour l'instant</div>
                      <div style={{ fontSize:13, color:"#6b7280" }}>Le sondage s'affiche automatiquement dans l'espace client après le test de niveau.</div>
                    </div>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

                      {/* Graphique barres */}
                      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px" }}>
                        <h4 style={{ margin:"0 0 16px", fontSize:13, fontWeight:800, color:"#0f172a" }}>Répartition par source</h4>
                        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          {Object.entries(sondageStats).sort((a,b)=>b[1]-a[1]).map(([src, count]) => {
                            const pct = Math.round((count / total) * 100);
                            return (
                              <div key={src}>
                                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#374151", marginBottom:4 }}>
                                  <span>{SOURCE_ICONS[src] || "•"} {src}</span>
                                  <span style={{ fontWeight:700, color:"#7c3aed" }}>{count} ({pct}%)</span>
                                </div>
                                <div style={{ background:"#f1f5f9", borderRadius:999, height:8, overflow:"hidden" }}>
                                  <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius:999, transition:"width .6s ease" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Liste des réponses */}
                      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px", overflowY:"auto", maxHeight:400 }}>
                        <h4 style={{ margin:"0 0 16px", fontSize:13, fontWeight:800, color:"#0f172a" }}>Détail par client</h4>
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {sondages.map(s => (
                            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, background:"#faf5ff", border:"1px solid #e9d5ff" }}>
                              <div style={{ width:36, height:36, borderRadius:"50%", background:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13, flexShrink:0 }}>
                                {(s.email?.[0] || "?").toUpperCase()}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.email}</div>
                                <div style={{ fontSize:11, color:"#7c3aed", fontWeight:600, marginTop:2 }}>
                                  {SOURCE_ICONS[s.source] || "•"} {s.source}
                                  {s.source_detail && <span style={{ color:"#a78bfa", fontWeight:400 }}> — {s.source_detail}</span>}
                                </div>
                              </div>
                              <div style={{ fontSize:10, color:"#9ca3af", whiteSpace:"nowrap", flexShrink:0 }}>
                                {s.created_at ? new Date(s.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short" }) : "–"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════
                ONGLETS CORPORATE B2B
            ══════════════════════════════════════════ */}

            {/* ── COMPTES ENTREPRISES ── */}
            {activeTab === "entreprises" && (() => {
              const searchE = b2bEntrepriseForm?.__search || "";
              const EMPTY_ENT = { nom:"", rccm:"", secteur:"", nb_employes:"", referent_rh_nom:"", referent_rh_email:"", referent_rh_telephone:"", budget_formation:"", ville:"", adresse:"", site_web:"", notes:"" };
              const filtered = b2bEntreprises.filter(e => !searchE || e.nom?.toLowerCase().includes(searchE.toLowerCase()) || e.secteur?.toLowerCase().includes(searchE.toLowerCase()));

              return (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <input placeholder="🔍 Rechercher une entreprise…" style={{ padding:"7px 12px", borderRadius:6, border:"1px solid #e5e7eb", fontSize:12, width:220 }}
                        onChange={e => setB2bEntrepriseForm(f => ({ ...(f||{}), __search: e.target.value }))} />
                      <button onClick={() => { setB2bLoaded(false); loadB2B(); toast.success("Actualisation…"); }} style={{ ...btnSecondary, fontSize:11, padding:"6px 12px" }}>🔄</button>
                    </div>
                    <button onClick={() => setB2bEntrepriseForm({ ...EMPTY_ENT, __mode:"new" })} style={btnPrimary}>➕ Nouvelle entreprise</button>
                  </div>

                  {b2bLoading ? <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>⏳ Chargement…</div> : filtered.length === 0 ? (
                    <div style={{ textAlign:"center", padding:60, background:"#f8fafc", borderRadius:16, border:"1.5px dashed #e2e8f0" }}>
                      <div style={{ fontSize:"3rem", marginBottom:10 }}>🏢</div>
                      <div style={{ fontWeight:700, color:"#0f172a" }}>Aucun compte entreprise</div>
                      <div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>Créez votre premier client B2B.</div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {filtered.map(e => {
                        const isExp = (b2bEntrepriseForm?.__expanded) === e.id;
                        return (
                          <div key={e.id} style={{ background:"#fff", borderRadius:12, border:"1.5px solid #e5e7eb", overflow:"hidden" }}>
                            <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", gap:10 }}
                              onClick={() => setB2bEntrepriseForm(f => ({ ...(f||{}), __expanded: isExp ? null : e.id }))}>
                              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                                <div style={{ width:38, height:38, borderRadius:10, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🏢</div>
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontWeight:800, fontSize:13, color:"#0f172a" }}>{e.nom}</div>
                                  <div style={{ fontSize:11, color:"#6b7280" }}>{e.secteur || "Secteur N/R"}{e.ville ? ` · ${e.ville}` : ""}</div>
                                </div>
                              </div>
                              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                                {e.budget_formation && <span style={{ fontSize:11, fontWeight:700, color:"#059669" }}>{fmtB2B(e.budget_formation)}</span>}
                                {e.nb_employes && <span style={{ fontSize:11, color:"#6b7280" }}>{e.nb_employes} emp.</span>}
                                <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background: e.statut==="actif"?"#dcfce7":"#fee2e2", color: e.statut==="actif"?"#166534":"#dc2626", fontWeight:700 }}>{e.statut}</span>
                                <button onClick={ev => { ev.stopPropagation(); setB2bEntrepriseForm({ ...e, __mode:"edit" }); }} style={{ padding:"4px 8px", background:BET_LIGHT, color:BET_DARK, border:`1px solid ${BET_COLOR}40`, borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️ Modifier</button>
                                <button onClick={ev => { ev.stopPropagation(); if(window.confirm("Supprimer cette entreprise ?")) { fetch(`${API_URL}/api/corporate/entreprises/${e.id}`,{method:"DELETE",headers:authHeaders()}).then(()=>{ setB2bLoaded(false); loadB2B(); toast.success("Supprimé"); }); } }} style={{ padding:"4px 8px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:4, cursor:"pointer", fontSize:11 }}>🗑️</button>
                              </div>
                            </div>
                            {isExp && (
                              <div style={{ padding:"0 16px 14px", borderTop:"1px solid #f1f5f9", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginTop:10 }}>
                                {[["📋 RCCM",e.rccm],["📧 Email RH",e.referent_rh_email],["📞 Tél RH",e.referent_rh_telephone],["👤 Référent RH",e.referent_rh_nom],["📍 Adresse",e.adresse],["🌐 Site web",e.site_web]].filter(([,v])=>v).map(([l,v])=>(
                                  <div key={l}><div style={{ fontSize:9, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", marginBottom:2 }}>{l}</div><div style={{ fontSize:12, color:"#0f172a" }}>{v}</div></div>
                                ))}
                                {e.notes && <div style={{ gridColumn:"1/-1" }}><div style={{ fontSize:9, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", marginBottom:2 }}>📝 NOTES</div><div style={{ fontSize:12, color:"#0f172a" }}>{e.notes}</div></div>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Modal entreprise */}
                  {b2bEntrepriseForm && (b2bEntrepriseForm.__mode === "new" || b2bEntrepriseForm.__mode === "edit") && (
                    <div style={modalOverlay} onClick={e => { if(e.target===e.currentTarget) setB2bEntrepriseForm(null); }}>
                      <div style={{ ...modalBox, width:580, maxHeight:"90vh", overflowY:"auto" }}>
                        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800, color:"#0f172a" }}>{b2bEntrepriseForm.__mode==="edit" ? "✏️ Modifier l'entreprise" : "🏢 Nouvelle entreprise cliente"}</h3>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                          {[["Nom de l'entreprise *","nom","text",true,"BET Industries SA"],["RCCM","rccm","text",false,"CI-ABJ-2024-…"],["Nombre d'employés","nb_employes","number",false,"250"],["Budget formation (FCFA)","budget_formation","number",false,"5 000 000"],["Référent RH — Nom","referent_rh_nom","text",false,""],["Référent RH — Email","referent_rh_email","email",false,""],["Référent RH — Tél.","referent_rh_telephone","text",false,""],["Ville","ville","text",false,"Abidjan"],["Site web","site_web","url",false,"https://…"]].map(([label, key, type, req, ph])=>(
                            <div key={key} style={{ gridColumn: key==="nom" ? "1/-1" : undefined, marginBottom:10 }}>
                              <label style={labelSt}>{label}</label>
                              <input type={type} value={b2bEntrepriseForm[key]||""} onChange={e=>setB2bEntrepriseForm(f=>({...f,[key]:e.target.value}))} placeholder={ph||""} style={inputSt} />
                            </div>
                          ))}
                          <div style={{ gridColumn:"1/-1", marginBottom:10 }}>
                            <label style={labelSt}>Secteur d'activité</label>
                            <select value={b2bEntrepriseForm.secteur||""} onChange={e=>setB2bEntrepriseForm(f=>({...f,secteur:e.target.value}))} style={inputSt}>
                              <option value="">— Choisir —</option>
                              {B2B_SECTEURS.map(s=><option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div style={{ gridColumn:"1/-1", marginBottom:10 }}>
                            <label style={labelSt}>Notes internes</label>
                            <textarea value={b2bEntrepriseForm.notes||""} onChange={e=>setB2bEntrepriseForm(f=>({...f,notes:e.target.value}))} style={{ ...inputSt, minHeight:55, resize:"vertical" }} />
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
                          <button onClick={()=>setB2bEntrepriseForm(null)} style={btnSecondary}>Annuler</button>
                          <button disabled={b2bSavingId==="entreprise"} onClick={()=>saveB2BEntreprise(b2bEntrepriseForm)} style={btnPrimary}>{b2bSavingId==="entreprise"?"⏳…":b2bEntrepriseForm.__mode==="edit"?"💾 Mettre à jour":"✅ Créer l'entreprise"}</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── PIPELINE B2B ── */}
            {activeTab === "pipeline_b2b" && (() => {
              const EMPTY_PR = { entreprise_id:"", titre:"", statut:"prospection", montant_estime:"", date_cloture_prevue:"", notes:"" };
              const byStatut = {};
              B2B_PIPELINE_STEPS.forEach(s => { byStatut[s.id] = b2bProspects.filter(p => p.statut === s.id); });

              return (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div>
                      <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0f172a" }}>🔄 Pipeline de vente B2B</h3>
                      <p style={{ margin:"4px 0 0", fontSize:12, color:"#6b7280" }}>{b2bProspects.length} prospect(s) · {b2bProspects.filter(p=>p.statut==="conclu").length} conclu(s)</p>
                    </div>
                    <button onClick={()=>setB2bProspectForm({...EMPTY_PR,__mode:"new"})} style={btnPrimary}>➕ Nouveau prospect</button>
                  </div>

                  {/* Résumé KPIs */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:20 }}>
                    {B2B_PIPELINE_STEPS.map(s => {
                      const items = byStatut[s.id] || [];
                      const total = items.reduce((a,p)=>a+(Number(p.montant_estime)||0),0);
                      return (
                        <div key={s.id} style={{ background:s.bg, borderRadius:10, padding:"10px 12px", border:`1.5px solid ${s.color}30`, textAlign:"center" }}>
                          <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{items.length}</div>
                          <div style={{ fontSize:10, color:s.color, fontWeight:700, marginTop:1 }}>{s.label}</div>
                          {total > 0 && <div style={{ fontSize:9, color:s.color, marginTop:2, opacity:0.8 }}>{fmtB2B(total)}</div>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Table des prospects */}
                  {b2bLoading ? <div style={{ textAlign:"center", padding:30, color:"#94a3b8" }}>⏳ Chargement…</div> : (
                    <div style={{ background:"#fff", borderRadius:10, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead><tr style={{ background:"#f8fafc", borderBottom:"1px solid #e5e7eb" }}>
                          {["Titre","Entreprise","Statut","Montant estimé","Clôture prévue","Actions"].map(h=><th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#374151" }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {b2bProspects.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>Aucun prospect. Créez votre premier deal.</td></tr>
                          ) : b2bProspects.map(p => {
                            const st = B2B_PIPELINE_STEPS.find(s=>s.id===p.statut);
                            return (
                              <tr key={p.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                                <td style={{ padding:"10px 12px", fontSize:12, fontWeight:600, color:"#0f172a" }}>{p.titre}</td>
                                <td style={{ padding:"10px 12px", fontSize:12, color:"#6b7280" }}>🏢 {p.entreprise_nom}</td>
                                <td style={{ padding:"10px 12px" }}>
                                  <select value={p.statut} onChange={async e => { await patchB2BStatut("prospects", p.id, { statut: e.target.value }); toast.success("Statut mis à jour"); }}
                                    style={{ padding:"3px 8px", borderRadius:6, border:`1.5px solid ${st?.color}40`, background:st?.bg, color:st?.color, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                                    {B2B_PIPELINE_STEPS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                                  </select>
                                </td>
                                <td style={{ padding:"10px 12px", fontSize:12, fontWeight:700, color:"#059669" }}>{p.montant_estime ? fmtB2B(p.montant_estime) : "—"}</td>
                                <td style={{ padding:"10px 12px", fontSize:11, color:"#6b7280" }}>{fmtDateB2B(p.date_cloture_prevue)}</td>
                                <td style={{ padding:"10px 12px", display:"flex", gap:6 }}>
                                  <button onClick={()=>setB2bProspectForm({...p,__mode:"edit"})} style={{ padding:"3px 8px", background:BET_LIGHT, color:BET_DARK, border:`1px solid ${BET_COLOR}40`, borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️</button>
                                  <button onClick={()=>setB2bHistoriqueItem(p)} style={{ padding:"3px 8px", background:"#f8fafc", color:"#6b7280", border:"1px solid #e5e7eb", borderRadius:4, cursor:"pointer", fontSize:11 }}>📋</button>
                                  <button onClick={()=>{ if(window.confirm("Supprimer ?")) fetch(`${API_URL}/api/corporate/prospects/${p.id}`,{method:"DELETE",headers:authHeaders()}).then(()=>{setB2bLoaded(false);loadB2B();}); }} style={{ padding:"3px 8px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:4, cursor:"pointer", fontSize:11 }}>🗑️</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Modal prospect */}
                  {b2bProspectForm && (b2bProspectForm.__mode === "new" || b2bProspectForm.__mode === "edit") && (
                    <div style={modalOverlay} onClick={e=>{if(e.target===e.currentTarget)setB2bProspectForm(null);}}>
                      <div style={{ ...modalBox, width:480, maxHeight:"90vh", overflowY:"auto" }}>
                        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800, color:"#0f172a" }}>{b2bProspectForm.__mode==="edit"?"✏️ Modifier le prospect":"🔄 Nouveau prospect B2B"}</h3>
                        <div style={{ marginBottom:10 }}>
                          <label style={labelSt}>Entreprise *</label>
                          <select value={b2bProspectForm.entreprise_id||""} onChange={e=>setB2bProspectForm(f=>({...f,entreprise_id:e.target.value}))} style={inputSt}>
                            <option value="">— Choisir l'entreprise —</option>
                            {b2bEntreprises.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}
                          </select>
                        </div>
                        <div style={{ marginBottom:10 }}><label style={labelSt}>Titre / Objet *</label><input value={b2bProspectForm.titre||""} onChange={e=>setB2bProspectForm(f=>({...f,titre:e.target.value}))} style={inputSt} placeholder="Formation Anglais — 20 employés" /></div>
                        <div style={{ marginBottom:10 }}>
                          <label style={labelSt}>Étape pipeline</label>
                          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                            {B2B_PIPELINE_STEPS.map(s=>(
                              <button key={s.id} onClick={()=>setB2bProspectForm(f=>({...f,statut:s.id}))}
                                style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid ${b2bProspectForm.statut===s.id?s.color:"#e2e8f0"}`, background:b2bProspectForm.statut===s.id?s.bg:"#fff", color:b2bProspectForm.statut===s.id?s.color:"#374151", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                          <div><label style={labelSt}>Montant estimé (FCFA)</label><input type="number" value={b2bProspectForm.montant_estime||""} onChange={e=>setB2bProspectForm(f=>({...f,montant_estime:e.target.value}))} style={inputSt} /></div>
                          <div><label style={labelSt}>Date clôture prévue</label><input type="date" value={b2bProspectForm.date_cloture_prevue||""} onChange={e=>setB2bProspectForm(f=>({...f,date_cloture_prevue:e.target.value}))} style={inputSt} /></div>
                        </div>
                        <div style={{ marginBottom:12 }}><label style={labelSt}>Notes</label><textarea value={b2bProspectForm.notes||""} onChange={e=>setB2bProspectForm(f=>({...f,notes:e.target.value}))} style={{ ...inputSt, minHeight:60, resize:"vertical" }} /></div>
                        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                          <button onClick={()=>setB2bProspectForm(null)} style={btnSecondary}>Annuler</button>
                          <button disabled={b2bSavingId==="prospect"} onClick={()=>saveB2BProspect(b2bProspectForm)} style={btnPrimary}>{b2bSavingId==="prospect"?"⏳…":b2bProspectForm.__mode==="edit"?"💾 Mettre à jour":"✅ Créer"}</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal historique */}
                  {b2bHistoriqueItem && (
                    <div style={modalOverlay} onClick={e=>{if(e.target===e.currentTarget)setB2bHistoriqueItem(null);}}>
                      <div style={{ ...modalBox, width:420, maxHeight:"80vh", overflowY:"auto" }}>
                        <h3 style={{ margin:"0 0 4px", fontSize:14, fontWeight:800, color:"#0f172a" }}>📋 Historique — {b2bHistoriqueItem.titre}</h3>
                        <div style={{ fontSize:11, color:"#6b7280", marginBottom:14 }}>🏢 {b2bHistoriqueItem.entreprise_nom}</div>
                        {(b2bHistoriqueItem.historique||[]).length === 0 ? <p style={{ color:"#94a3b8", textAlign:"center" }}>Aucun historique</p> : (
                          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                            {[...(b2bHistoriqueItem.historique||[])].reverse().map((h,i) => {
                              const st = B2B_PIPELINE_STEPS.find(s=>s.id===h.statut);
                              return (
                                <div key={i} style={{ padding:"8px 12px", borderRadius:8, background:st?.bg||"#f8fafc", border:`1px solid ${st?.color||"#e2e8f0"}30`, display:"flex", gap:10, alignItems:"flex-start" }}>
                                  <div style={{ width:7, height:7, borderRadius:"50%", background:st?.color||"#94a3b8", marginTop:4, flexShrink:0 }} />
                                  <div>
                                    <div style={{ fontWeight:700, fontSize:12, color:st?.color||"#0f172a" }}>{h.action}</div>
                                    {h.note && <div style={{ fontSize:11, color:"#6b7280" }}>{h.note}</div>}
                                    <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{fmtDateB2B(h.date)}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div style={{ marginTop:16, textAlign:"right" }}><button onClick={()=>setB2bHistoriqueItem(null)} style={btnSecondary}>Fermer</button></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── DOCUMENTS COMMERCIAUX B2B ── */}
            {activeTab === "documents_b2b" && (() => {
              const EMPTY_DOC = { entreprise_id:"", type_doc:"proforma", titre:"", montant:"", statut:"brouillon", notes:"", fichier_url:"" };
              const STATUT_DOC_COLOR = { brouillon:"#94a3b8", "envoyé":"#0891b2", "signé":"#16a34a", "annulé":"#dc2626" };

              return (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div>
                      <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0f172a" }}>📄 Documents commerciaux</h3>
                      <p style={{ margin:"4px 0 0", fontSize:12, color:"#6b7280" }}>Proformas · Bons de commande · Contrats</p>
                    </div>
                    <button onClick={()=>setB2bDocumentForm({...EMPTY_DOC})} style={btnPrimary}>➕ Nouveau document</button>
                  </div>

                  {/* Filtres type */}
                  <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
                    {["tous","proforma","bon_commande","contrat","autre"].map(t=>(
                      <button key={t} onClick={()=>setB2bDocumentForm(f=>({...(f||{}),__filterType:t}))}
                        style={{ padding:"5px 11px", borderRadius:999, border:`1.5px solid ${(b2bDocumentForm?.__filterType||"tous")===t?BET_COLOR:"#e5e7eb"}`, background:(b2bDocumentForm?.__filterType||"tous")===t?BET_LIGHT:"#fff", color:(b2bDocumentForm?.__filterType||"tous")===t?BET_COLOR:"#374151", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                        {t==="tous"?"Tous":B2B_DOC_TYPES[t]}
                      </button>
                    ))}
                  </div>

                  {b2bLoading ? <div style={{ textAlign:"center", padding:30, color:"#94a3b8" }}>⏳ Chargement…</div> : (() => {
                    const filterType = b2bDocumentForm?.__filterType || "tous";
                    const filteredDocs = filterType === "tous" ? b2bDocuments : b2bDocuments.filter(d=>d.type_doc===filterType);
                    return filteredDocs.length === 0 ? (
                      <div style={{ textAlign:"center", padding:60, background:"#f8fafc", borderRadius:16, border:"1.5px dashed #e2e8f0" }}>
                        <div style={{ fontSize:"2.5rem", marginBottom:10 }}>📄</div>
                        <div style={{ fontWeight:700, color:"#0f172a" }}>Aucun document</div>
                      </div>
                    ) : (
                      <div style={{ background:"#fff", borderRadius:10, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                          <thead><tr style={{ background:"#f8fafc", borderBottom:"1px solid #e5e7eb" }}>
                            {["Type","Titre","Entreprise","Montant","Statut","Date","Actions"].map(h=><th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#374151" }}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {filteredDocs.map(d=>(
                              <tr key={d.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                                <td style={{ padding:"10px 12px", fontSize:13 }}>{B2B_DOC_TYPES[d.type_doc]?.split(" ")[0]}</td>
                                <td style={{ padding:"10px 12px", fontSize:12, fontWeight:600, color:"#0f172a" }}>{d.titre}</td>
                                <td style={{ padding:"10px 12px", fontSize:12, color:"#6b7280" }}>🏢 {d.entreprise_nom}</td>
                                <td style={{ padding:"10px 12px", fontSize:12, fontWeight:700, color:"#059669" }}>{d.montant ? fmtB2B(d.montant) : "—"}</td>
                                <td style={{ padding:"10px 12px" }}>
                                  <span style={{ padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700, background:`${STATUT_DOC_COLOR[d.statut]||"#94a3b8"}20`, color:STATUT_DOC_COLOR[d.statut]||"#94a3b8" }}>{d.statut}</span>
                                </td>
                                <td style={{ padding:"10px 12px", fontSize:11, color:"#9ca3af" }}>{fmtDateB2B(d.created_at)}</td>
                                <td style={{ padding:"10px 12px", display:"flex", gap:5 }}>
                                  {d.fichier_url && <a href={d.fichier_url} target="_blank" rel="noreferrer" style={{ padding:"3px 8px", background:BET_LIGHT, color:BET_DARK, borderRadius:4, fontSize:11, fontWeight:600, textDecoration:"none" }}>📎 Fichier</a>}
                                  {d.statut==="brouillon" && <button onClick={()=>{ patchB2BStatut("documents",d.id,{statut:"envoyé"}); toast.success("Marqué envoyé"); }} style={{ padding:"3px 8px", background:"#e0f2fe", color:BET_COLOR, border:"none", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 }}>📤 Envoyé</button>}
                                  {d.statut==="envoyé"    && <button onClick={()=>{ patchB2BStatut("documents",d.id,{statut:"signé"}); toast.success("Marqué signé ✓"); }} style={{ padding:"3px 8px", background:"#dcfce7", color:"#166534", border:"none", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 }}>✅ Signé</button>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}

                  {/* Modal document */}
                  {b2bDocumentForm && !b2bDocumentForm.__filterType && (
                    <div style={modalOverlay} onClick={e=>{if(e.target===e.currentTarget)setB2bDocumentForm(null);}}>
                      <div style={{ ...modalBox, width:480, maxHeight:"90vh", overflowY:"auto" }}>
                        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800, color:"#0f172a" }}>📄 Nouveau document commercial</h3>
                        <div style={{ marginBottom:10 }}>
                          <label style={labelSt}>Entreprise *</label>
                          <select value={b2bDocumentForm.entreprise_id||""} onChange={e=>setB2bDocumentForm(f=>({...f,entreprise_id:e.target.value}))} style={inputSt}>
                            <option value="">— Choisir —</option>
                            {b2bEntreprises.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}
                          </select>
                        </div>
                        <div style={{ marginBottom:10 }}>
                          <label style={labelSt}>Type de document</label>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {Object.entries(B2B_DOC_TYPES).map(([v,l])=>(
                              <button key={v} onClick={()=>setB2bDocumentForm(f=>({...f,type_doc:v}))}
                                style={{ padding:"6px 11px", borderRadius:7, border:`1.5px solid ${b2bDocumentForm.type_doc===v?BET_COLOR:"#e5e7eb"}`, background:b2bDocumentForm.type_doc===v?BET_LIGHT:"#fff", color:b2bDocumentForm.type_doc===v?BET_COLOR:"#374151", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom:10 }}><label style={labelSt}>Titre *</label><input value={b2bDocumentForm.titre||""} onChange={e=>setB2bDocumentForm(f=>({...f,titre:e.target.value}))} style={inputSt} placeholder="Proforma Formation Anglais Q2 2026" /></div>
                        <div style={{ marginBottom:10 }}><label style={labelSt}>Montant (FCFA)</label><input type="number" value={b2bDocumentForm.montant||""} onChange={e=>setB2bDocumentForm(f=>({...f,montant:e.target.value}))} style={inputSt} /></div>
                        <div style={{ marginBottom:10 }}><label style={labelSt}>URL du fichier</label><input value={b2bDocumentForm.fichier_url||""} onChange={e=>setB2bDocumentForm(f=>({...f,fichier_url:e.target.value}))} style={inputSt} placeholder="https://…" /></div>
                        <div style={{ marginBottom:12 }}><label style={labelSt}>Notes</label><textarea value={b2bDocumentForm.notes||""} onChange={e=>setB2bDocumentForm(f=>({...f,notes:e.target.value}))} style={{ ...inputSt, minHeight:55, resize:"vertical" }} /></div>
                        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                          <button onClick={()=>setB2bDocumentForm(null)} style={btnSecondary}>Annuler</button>
                          <button disabled={b2bSavingId==="document"} onClick={()=>saveB2BDocument(b2bDocumentForm)} style={btnPrimary}>{b2bSavingId==="document"?"⏳…":"✅ Enregistrer"}</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── FACTURATION B2B ── */}
            {activeTab === "facturation_b2b" && (() => {
              const EMPTY_FACT = { entreprise_id:"", objet:"", montant_ht:"", taux_tva:18, date_echeance:"", notes:"" };
              const totalPaye     = b2bFactures.filter(f=>f.statut==="payée").reduce((s,f)=>s+(Number(f.montant_ttc)||0),0);
              const totalAttente  = b2bFactures.filter(f=>["envoyée","brouillon"].includes(f.statut)).reduce((s,f)=>s+(Number(f.montant_ttc)||0),0);
              const totalRetard   = b2bFactures.filter(f=>f.statut==="en_retard").reduce((s,f)=>s+(Number(f.montant_ttc)||0),0);
              const filtreStatutF = b2bFactureForm?.__filtreStatut || "tous";
              const filteredFact  = filtreStatutF === "tous" ? b2bFactures : b2bFactures.filter(f=>f.statut===filtreStatutF);

              return (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0f172a" }}>🧾 Facturation B2B</h3>
                    <button onClick={()=>setB2bFactureForm({...EMPTY_FACT})} style={btnPrimary}>➕ Nouvelle facture</button>
                  </div>

                  {/* KPIs */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
                    <StatCard label="CA encaissé (B2B)" value={fmtB2B(totalPaye)} color="#22c55e" icon="✅" sub="factures payées" />
                    <StatCard label="En attente règlement" value={fmtB2B(totalAttente)} color="#0891b2" icon="📤" sub="envoyées / brouillons" />
                    <StatCard label="En retard" value={fmtB2B(totalRetard)} color="#ef4444" icon="🔴" sub="à relancer" onClick={()=>setB2bFactureForm(f=>({...(f||{}),__filtreStatut:"en_retard"}))} />
                  </div>

                  {/* Filtres */}
                  <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
                    {["tous",...Object.keys(B2B_FACT_STATUTS)].map(s=>(
                      <button key={s} onClick={()=>setB2bFactureForm(f=>({...(f||{}),__filtreStatut:s}))}
                        style={{ padding:"5px 10px", borderRadius:999, border:`1.5px solid ${filtreStatutF===s?(B2B_FACT_COLORS[s]||BET_COLOR):"#e5e7eb"}`, background:filtreStatutF===s?`${B2B_FACT_COLORS[s]||BET_COLOR}12`:"#fff", color:filtreStatutF===s?(B2B_FACT_COLORS[s]||BET_COLOR):"#374151", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                        {s==="tous"?"Toutes":B2B_FACT_STATUTS[s]}
                      </button>
                    ))}
                  </div>

                  {b2bLoading ? <div style={{ textAlign:"center", padding:30, color:"#94a3b8" }}>⏳ Chargement…</div> : filteredFact.length === 0 ? (
                    <div style={{ textAlign:"center", padding:60, background:"#f8fafc", borderRadius:16, border:"1.5px dashed #e2e8f0" }}>
                      <div style={{ fontSize:"2.5rem", marginBottom:10 }}>🧾</div>
                      <div style={{ fontWeight:700, color:"#0f172a" }}>Aucune facture</div>
                    </div>
                  ) : (
                    <div style={{ background:"#fff", borderRadius:10, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead><tr style={{ background:"#f8fafc", borderBottom:"1px solid #e5e7eb" }}>
                          {["Numéro","Entreprise","Objet","Montant TTC","Statut","Échéance","Actions"].map(h=><th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#374151" }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {filteredFact.map(f => {
                            const c = B2B_FACT_COLORS[f.statut] || "#94a3b8";
                            return (
                              <tr key={f.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                                <td style={{ padding:"10px 12px", fontSize:12, fontWeight:700, color:"#0f172a" }}>{f.numero}</td>
                                <td style={{ padding:"10px 12px", fontSize:12, color:"#6b7280" }}>🏢 {f.entreprise_nom}</td>
                                <td style={{ padding:"10px 12px", fontSize:12, color:"#374151" }}>{f.objet || "—"}</td>
                                <td style={{ padding:"10px 12px", fontSize:12, fontWeight:800, color:"#0f172a" }}>{fmtB2B(f.montant_ttc)}</td>
                                <td style={{ padding:"10px 12px" }}>
                                  <span style={{ padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700, background:`${c}15`, color:c }}>{B2B_FACT_STATUTS[f.statut]}</span>
                                </td>
                                <td style={{ padding:"10px 12px", fontSize:11, color: f.statut==="en_retard"?"#dc2626":"#6b7280", fontWeight: f.statut==="en_retard"?700:400 }}>{fmtDateB2B(f.date_echeance)}</td>
                                <td style={{ padding:"10px 12px", display:"flex", gap:5 }}>
                                  {f.statut==="brouillon"  && <button onClick={()=>{ patchB2BStatut("factures",f.id,{statut:"envoyée"}); toast.success("Facture envoyée"); }} style={{ padding:"3px 8px", background:"#e0f2fe", color:BET_COLOR, border:"none", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 }}>📤</button>}
                                  {f.statut==="envoyée"    && <button onClick={()=>{ patchB2BStatut("factures",f.id,{statut:"payée",date_paiement:new Date().toISOString().slice(0,10)}); toast.success("✅ Paiement enregistré"); }} style={{ padding:"3px 8px", background:"#dcfce7", color:"#166534", border:"none", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 }}>✅ Payée</button>}
                                  {f.statut==="envoyée"    && <button onClick={()=>{ patchB2BStatut("factures",f.id,{statut:"en_retard"}); toast.success("Marqué en retard"); }} style={{ padding:"3px 8px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 }}>🔴</button>}
                                  {f.statut==="en_retard"  && <button onClick={()=>{ patchB2BStatut("factures",f.id,{statut:"payée",date_paiement:new Date().toISOString().slice(0,10)}); toast.success("✅ Encaissé"); }} style={{ padding:"3px 8px", background:"#dcfce7", color:"#166534", border:"none", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 }}>✅ Encaisser</button>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Modal facture */}
                  {b2bFactureForm && b2bFactureForm.entreprise_id !== undefined && !b2bFactureForm.__filtreStatut && (
                    <div style={modalOverlay} onClick={e=>{if(e.target===e.currentTarget)setB2bFactureForm(null);}}>
                      <div style={{ ...modalBox, width:460, maxHeight:"90vh", overflowY:"auto" }}>
                        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800, color:"#0f172a" }}>🧾 Nouvelle facture B2B</h3>
                        <div style={{ marginBottom:10 }}>
                          <label style={labelSt}>Entreprise *</label>
                          <select value={b2bFactureForm.entreprise_id||""} onChange={e=>setB2bFactureForm(f=>({...f,entreprise_id:e.target.value}))} style={inputSt}>
                            <option value="">— Choisir —</option>
                            {b2bEntreprises.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}
                          </select>
                        </div>
                        <div style={{ marginBottom:10 }}><label style={labelSt}>Objet</label><input value={b2bFactureForm.objet||""} onChange={e=>setB2bFactureForm(f=>({...f,objet:e.target.value}))} style={inputSt} placeholder="Formation Anglais professionnel — 15 employés" /></div>
                        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:10, marginBottom:10 }}>
                          <div><label style={labelSt}>Montant HT (FCFA) *</label><input type="number" value={b2bFactureForm.montant_ht||""} onChange={e=>setB2bFactureForm(f=>({...f,montant_ht:e.target.value}))} style={inputSt} /></div>
                          <div><label style={labelSt}>TVA (%)</label><input type="number" value={b2bFactureForm.taux_tva||18} onChange={e=>setB2bFactureForm(f=>({...f,taux_tva:e.target.value}))} style={inputSt} /></div>
                        </div>
                        {b2bFactureForm.montant_ht && (
                          <div style={{ marginBottom:12, padding:"8px 12px", borderRadius:7, background:"#f0fdf4", border:"1px solid #bbf7d0", fontSize:12, fontWeight:700, color:"#166534" }}>
                            TTC estimé : {fmtB2B(parseFloat(b2bFactureForm.montant_ht||0) * (1 + parseFloat(b2bFactureForm.taux_tva||18)/100))}
                          </div>
                        )}
                        <div style={{ marginBottom:10 }}><label style={labelSt}>Date d'échéance</label><input type="date" value={b2bFactureForm.date_echeance||""} onChange={e=>setB2bFactureForm(f=>({...f,date_echeance:e.target.value}))} style={inputSt} /></div>
                        <div style={{ marginBottom:12 }}><label style={labelSt}>Notes</label><textarea value={b2bFactureForm.notes||""} onChange={e=>setB2bFactureForm(f=>({...f,notes:e.target.value}))} style={{ ...inputSt, minHeight:55, resize:"vertical" }} /></div>
                        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                          <button onClick={()=>setB2bFactureForm(null)} style={btnSecondary}>Annuler</button>
                          <button disabled={b2bSavingId==="facture"} onClick={()=>saveB2BFacture(b2bFactureForm)} style={btnPrimary}>{b2bSavingId==="facture"?"⏳…":"✅ Créer la facture"}</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ═══ ONGLET ASSIGNATIONS PARCOURS ═══ */}
            {activeTab === "assignations" && (() => {
              const TYPE_COURS  = { en_ligne:"En ligne", presentiel:"Présentiel" };
              const TYPE_COACH  = { groupe:"Groupe", prive:"Privé" };
              const STATUT_META = {
                en_attente: { label:"En attente",  color:"#d97706", bg:"#fef3c7" },
                en_cours:   { label:"En cours",    color:"#0891b2", bg:"#e0f2fe" },
                converti:   { label:"Converti",    color:"#22c55e", bg:"#dcfce7" },
                perdu:      { label:"Perdu",       color:"#ef4444", bg:"#fee2e2" },
              };

              const filtered = assignations.filter(a => {
                if (a.statut === "converti") return false; // convertis → onglet "Mes apprenants"
                if (assignFiltreType   !== "tous" && a.type_cours !== assignFiltreType)   return false;
                if (assignFiltreStatut !== "tous" && a.statut     !== assignFiltreStatut) return false;
                return true;
              });

              return (
                <div>

                  {/* ── Section Mes clients (commentée temporairement) ── */}
                  {false && <div style={{ marginBottom:32 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                      <div>
                        <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0f172a" }}>📬 Mes clients — Prises en charge</h3>
                        <p style={{ margin:"4px 0 0", fontSize:12, color:"#9ca3af" }}>Messages et demandes des clients qui vous ont choisi comme conseillère</p>
                      </div>
                      <button onClick={() => { fetchMessages(); }} style={{ ...btnSecondary, fontSize:11, padding:"6px 12px" }} disabled={messagesLoading}>
                        🔄 Actualiser
                      </button>
                    </div>

                    {/* Stats */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
                      {[
                        { label:"Total messages", val:clientMessages.length,                                        color:"#0891b2" },
                        { label:"Nouveaux",       val:clientMessages.filter(m=>m.statut==="nouveau").length,         color:"#dc2626" },
                        { label:"En cours",       val:clientMessages.filter(m=>m.statut==="en_cours").length,        color:"#f59e0b" },
                        { label:"Traités",        val:clientMessages.filter(m=>m.statut==="traité").length,          color:"#22c55e" },
                      ].map((s,i) => (
                        <div key={i} style={{ background:"#fff", borderRadius:10, padding:"14px 16px", border:"1px solid #f1f5f9", textAlign:"center" }}>
                          <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
                          <div style={{ fontSize:11, color:"#6b7280", marginTop:3 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {messagesLoading && (
                      <div style={{ textAlign:"center", padding:32, color:"#0891b2", fontSize:13 }}>⏳ Chargement des messages…</div>
                    )}

                    {!messagesLoading && clientMessages.length === 0 && (
                      <div style={{ textAlign:"center", padding:"36px 24px", background:"#f8fafc", borderRadius:14, border:"1.5px dashed #e2e8f0" }}>
                        <div style={{ fontSize:"2.5rem", marginBottom:10 }}>📭</div>
                        <div style={{ fontWeight:700, color:"#0f172a", marginBottom:4 }}>Aucun message reçu</div>
                        <div style={{ fontSize:13, color:"#9ca3af" }}>Les messages de vos clients apparaîtront ici dès qu'ils vous contacteront depuis leur espace.</div>
                      </div>
                    )}

                    {!messagesLoading && clientMessages.length > 0 && (
                      <div style={{ display:"flex", gap:20 }}>
                        {/* Liste */}
                        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
                          {clientMessages.map(m => {
                            const statutColor = { nouveau:"#dc2626", lu:"#6b7280", en_cours:"#f59e0b", "traité":"#22c55e" }[m.statut] || "#6b7280";
                            const statutBg    = { nouveau:"#fee2e2", lu:"#f3f4f6", en_cours:"#fef3c7", "traité":"#d1fae5" }[m.statut] || "#f3f4f6";
                            const isSelected  = selectedMessage?.id === m.id;
                            return (
                              <div
                                key={m.id}
                                onClick={() => setSelectedMessage(m)}
                                style={{
                                  padding:"14px 16px", borderRadius:12, cursor:"pointer", transition:"all .15s",
                                  border:`1.5px solid ${isSelected ? BET_COLOR : m.statut==="nouveau" ? "#fca5a5" : "#e5e7eb"}`,
                                  background: isSelected ? BET_LIGHT : m.statut==="nouveau" ? "#fff5f5" : "#fff",
                                }}
                              >
                                <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                                  <div style={{ width:38, height:38, borderRadius:"50%", background:BET_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:BET_COLOR, flexShrink:0 }}>
                                    {(m.nom?.[0] || "?").toUpperCase()}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                                      <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{m.nom}</span>
                                      <span style={{ fontSize:10, color:"#9ca3af" }}>
                                        {m.created_at ? new Date(m.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
                                      </span>
                                    </div>
                                    <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:3 }}>{m.sujet || "Sans sujet"}</div>
                                    <div style={{ fontSize:11, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.message}</div>
                                    <div style={{ marginTop:6 }}>
                                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, background:statutBg, color:statutColor }}>
                                        {m.statut === "nouveau" ? "🔴 Nouveau" : m.statut === "en_cours" ? "🟡 En cours" : m.statut === "traité" ? "🟢 Traité" : "⚪ Lu"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Détail message */}
                        {selectedMessage && (
                          <div style={{ width:360, flexShrink:0, background:"#fff", borderRadius:14, border:"1.5px solid #e5e7eb", padding:22, alignSelf:"flex-start", position:"sticky", top:20 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                              <div>
                                <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a" }}>{selectedMessage.nom}</h3>
                                <div style={{ fontSize:12, color:"#9ca3af", marginTop:3 }}>{selectedMessage.email}</div>
                                {selectedMessage.telephone && <div style={{ fontSize:12, color:"#0891b2", marginTop:2 }}>📞 {selectedMessage.telephone}</div>}
                              </div>
                              <button onClick={() => setSelectedMessage(null)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#9ca3af" }}>✕</button>
                            </div>
                            <div style={{ padding:"10px 14px", borderRadius:8, background:"#f8fafc", marginBottom:12 }}>
                              <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:4 }}>SUJET</div>
                              <div style={{ fontSize:14, fontWeight:600, color:"#0f172a" }}>{selectedMessage.sujet || "Sans sujet"}</div>
                            </div>
                            <div style={{ padding:"12px 14px", borderRadius:8, background:"#f8fafc", marginBottom:16, minHeight:80 }}>
                              <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:8 }}>MESSAGE</div>
                              <div style={{ fontSize:13, color:"#374151", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{selectedMessage.message}</div>
                            </div>
                            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:14 }}>
                              Reçu le {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—"}
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                              <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:2 }}>Changer le statut :</div>
                              {[
                                { key:"en_cours", label:"🟡 Marquer En cours", bg:"#fef3c7", color:"#92400e" },
                                { key:"traité",   label:"🟢 Marquer Traité",   bg:"#d1fae5", color:"#065f46" },
                              ].map(s => (
                                <button
                                  key={s.key}
                                  disabled={selectedMessage.statut === s.key}
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${API_URL}/api/contact/${selectedMessage.id}/statut`, {
                                        method:"PATCH", headers: authHeaders(),
                                        body: JSON.stringify({ statut: s.key }),
                                      });
                                      if (!res.ok) throw new Error();
                                      setClientMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, statut: s.key } : m));
                                      setSelectedMessage(prev => ({ ...prev, statut: s.key }));
                                      toast.success(`Statut mis à jour : ${s.key}`);
                                    } catch { toast.error("Erreur mise à jour"); }
                                  }}
                                  style={{ padding:"9px 14px", borderRadius:8, border:"none", cursor: selectedMessage.statut===s.key ? "not-allowed" : "pointer", background: selectedMessage.statut===s.key ? "#f3f4f6" : s.bg, color: selectedMessage.statut===s.key ? "#9ca3af" : s.color, fontWeight:700, fontSize:12, opacity: selectedMessage.statut===s.key ? 0.5 : 1 }}
                                >
                                  {s.label}
                                </button>
                              ))}
                              <button
                                onClick={() => convertirLeadFromMessage(selectedMessage)}
                                style={{ padding:"9px 14px", borderRadius:8, border:`1px solid ${BET_COLOR}40`, cursor:"pointer", background:BET_LIGHT, color:BET_COLOR, fontWeight:700, fontSize:12 }}
                              >
                                👥 Convertir en Lead
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>}

                  {/* En-tête */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                    <div>
                      <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0f172a" }}>🎯 Prospects — Parcours d'inscription</h3>
                      <p style={{ margin:"4px 0 0", fontSize:12, color:"#6b7280" }}>
                        Prospects ayant choisi une assistante via le tunnel /parcours/inscription
                      </p>
                    </div>
                    <button onClick={() => { fetchAssignations(); toast.success("Actualisé"); }} style={{ ...btnSecondary, fontSize:11, padding:"6px 12px" }}>🔄 Actualiser</button>
                  </div>

                  {/* Stat cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                    <StatCard label="Total prospects"  value={assignations.length}                                             color="#0891b2" icon="👥" />
                    <StatCard label="En attente"        value={assignations.filter(a=>a.statut==="en_attente").length}          color="#d97706" icon="⏳" />
                    <StatCard label="En cours"          value={assignations.filter(a=>a.statut==="en_cours").length}            color="#7c3aed" icon="🔄" />
                    <StatCard label="Convertis"         value={assignations.filter(a=>a.statut==="converti").length}            color="#22c55e" icon="✅" />
                  </div>

                  {/* Filtres */}
                  <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                    <select value={assignFiltreType} onChange={e => setAssignFiltreType(e.target.value)} style={selectSt}>
                      <option value="tous">Tous les modes</option>
                      <option value="en_ligne">En ligne</option>
                      <option value="presentiel">Présentiel</option>
                    </select>
                    <select value={assignFiltreStatut} onChange={e => setAssignFiltreStatut(e.target.value)} style={selectSt}>
                      <option value="tous">Tous les statuts</option>
                      <option value="en_attente">En attente</option>
                      <option value="en_cours">En cours</option>
                      <option value="perdu">Perdu</option>
                    </select>
                    <span style={{ fontSize:12, color:"#6b7280", alignSelf:"center" }}>{filtered.length} résultat{filtered.length>1?"s":""}</span>
                  </div>

                  {assignationsLoading ? (
                    <div style={{ textAlign:"center", padding:48, color:"#6b7280" }}>Chargement…</div>
                  ) : filtered.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"60px 24px", background:"#f8fafc", borderRadius:16, border:"1.5px dashed #e2e8f0" }}>
                      <div style={{ fontSize:"2.5rem", marginBottom:12 }}>🎯</div>
                      <div style={{ fontWeight:700, color:"#0f172a", marginBottom:6 }}>Aucun prospect pour l'instant</div>
                      <div style={{ fontSize:13, color:"#6b7280" }}>Les prospects apparaissent ici dès qu'ils choisissent une assistante sur le site.</div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {filtered.map(a => {
                        const sm = STATUT_META[a.statut] || STATUT_META.en_attente;
                        const testProspect = a.prospect_email
                          ? tests.find(t => t.email?.toLowerCase() === a.prospect_email.toLowerCase())
                          : null;
                        const NIVEAU_COLOR = { A1:"#64748b", A2:"#d97706", B1:"#1e3a8a", B2:"#7c3aed", C1:"#059669", C2:"#dc2626" };
                        const niveauColor  = testProspect ? (NIVEAU_COLOR[testProspect.niveau] || "#0891b2") : null;
                        return (
                          <div key={a.id} style={{ background:"#fff", border:`1.5px solid ${testProspect ? "#bbf7d0" : "#e5e7eb"}`, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"flex-start", gap:14 }}>
                            {/* Avatar initiales */}
                            <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#1e3a8a,#0891b2)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0 }}>
                              {(a.prospect_nom||"?")[0].toUpperCase()}
                            </div>
                            {/* Infos */}
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, flexWrap:"wrap" }}>
                                <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>{a.prospect_nom}</div>
                                <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                                  <span style={{ fontSize:11, color:"#94a3b8" }}>
                                    {new Date(a.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                                  </span>
                                  <span style={{ background:sm.bg, color:sm.color, borderRadius:999, padding:"2px 10px", fontSize:11, fontWeight:700 }}>{sm.label}</span>
                                </div>
                              </div>
                              <div style={{ display:"flex", gap:10, marginTop:4, flexWrap:"wrap" }}>
                                {a.prospect_telephone && <span style={{ fontSize:12, color:"#0891b2", fontWeight:600 }}>📞 {a.prospect_telephone}</span>}
                                {a.prospect_email    && <span style={{ fontSize:12, color:"#64748b" }}>✉️ {a.prospect_email}</span>}
                              </div>
                              <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
                                <span style={{ background:"#eff6ff", color:"#1e3a8a", borderRadius:999, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
                                  {TYPE_COURS[a.type_cours] || a.type_cours}
                                  {a.type_coaching ? ` · ${TYPE_COACH[a.type_coaching] || a.type_coaching}` : ""}
                                </span>
                                {a.centre_nom && <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"2px 10px", fontSize:11, fontWeight:700 }}>📍 {a.centre_nom}</span>}
                                <span style={{ background:"#f8fafc", color:"#475569", borderRadius:999, padding:"2px 10px", fontSize:11 }}>
                                  👤 {a.assistante_nom}
                                </span>
                              </div>

                              {/* ── Bandeaux test de niveau ── */}
                              {testProspect ? (() => {
                                const enAttente = testProspect.correction_statut === "en_attente";
                                const FORMAT_LABEL = { mixte:"Mixte", reading:"Reading", writing:"Writing", speaking:"Speaking", listening:"Listening" };
                                const fmtLabel = FORMAT_LABEL[testProspect.format_test] || "Test";
                                if (enAttente) return (
                                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, padding:"8px 12px", background:"#fffbeb", borderRadius:8, border:"1px solid #fde68a", flexWrap:"wrap" }}>
                                    <span style={{ fontSize:11, fontWeight:700, color:"#92400e" }}>⏳ {fmtLabel} — À corriger</span>
                                    <button
                                      onClick={() => {
                                        setEditingItem({ ...testProspect, id: testProspect.id });
                                        setShowTestModal(true);
                                      }}
                                      style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:6, border:"1px solid #f59e0b", background:"#fef3c7", color:"#92400e", cursor:"pointer" }}
                                    >
                                      ✏️ Corriger →
                                    </button>
                                  </div>
                                );
                                return (
                                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, padding:"8px 12px", background:"#f0fdf4", borderRadius:8, border:"1px solid #bbf7d0", flexWrap:"wrap" }}>
                                    <span style={{ fontSize:11, fontWeight:700, color:"#15803d" }}>
                                      {testProspect.source === "oral" ? "📝 Test oral" : `✅ ${fmtLabel}`} reçu
                                    </span>
                                    <span style={{ fontWeight:800, fontSize:12, color:niveauColor, background:"#fff", border:`1px solid ${niveauColor}40`, borderRadius:999, padding:"1px 9px" }}>
                                      {testProspect.niveau}
                                    </span>
                                    <span style={{ fontSize:11, color:"#64748b" }}>{testProspect.score}% · {testProspect.date}</span>
                                    <button
                                      onClick={() => { setSelectedTest(testProspect); setShowTestDetailModal(true); }}
                                      style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:6, border:"1px solid #16a34a40", background:"#dcfce7", color:"#15803d", cursor:"pointer" }}
                                    >
                                      Voir le détail →
                                    </button>
                                  </div>
                                );
                              })() : (
                                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, padding:"7px 12px", background:"#fafafa", borderRadius:8, border:"1px dashed #e2e8f0" }}>
                                  <span style={{ fontSize:11, color:"#94a3b8" }}>⏳ Test de niveau non encore effectué</span>
                                </div>
                              )}

                              {/* ── Résumé paiement lié (compact) ── */}
                              {(() => {
                                const pmts = paiements.filter(p => p.assignationId === a.id);
                                if (pmts.length === 0) return (
                                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, padding:"7px 12px", background:"#fafafa", borderRadius:8, border:"1px dashed #e2e8f0" }}>
                                    <span style={{ fontSize:11, color:"#94a3b8" }}>💳 Aucun paiement enregistré</span>
                                  </div>
                                );
                                const totalDu   = pmts.reduce((s,p) => s+(p.montantDu  ||0), 0);
                                const totalReçu = pmts.reduce((s,p) => s+(p.montantReçu||0), 0);
                                const reste     = totalDu - totalReçu;
                                const last      = pmts[0];
                                const PSTAT = { en_attente:{label:"En attente",color:"#d97706",bg:"#fef3c7",border:"#fde68a",icon:"⏳"}, partiel:{label:"Partiel",color:"#0891b2",bg:"#e0f2fe",border:"#bae6fd",icon:"🔄"}, reçu:{label:"Reçu",color:"#16a34a",bg:"#dcfce7",border:"#bbf7d0",icon:"✅"}, confirme:{label:"Reçu",color:"#16a34a",bg:"#dcfce7",border:"#bbf7d0",icon:"✅"}, remboursé:{label:"Remboursé",color:"#7c3aed",bg:"#ede9fe",border:"#ddd6fe",icon:"↩️"} };
                                const ps = PSTAT[last.statut] || PSTAT.en_attente;
                                return (
                                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, padding:"7px 12px", background: ps.bg, borderRadius:8, border:`1px solid ${ps.border}`, flexWrap:"wrap" }}>
                                    <span style={{ fontSize:12 }}>{ps.icon}</span>
                                    <span style={{ fontSize:11, fontWeight:700, color: ps.color }}>{ps.label}</span>
                                    <span style={{ fontSize:11, color:"#475569" }}>·</span>
                                    <span style={{ fontSize:11, color:"#475569" }}><strong style={{ color:"#22c55e" }}>{Number(totalReçu).toLocaleString("fr-FR")} F</strong> reçu</span>
                                    {reste > 0 && <span style={{ fontSize:11, color:"#ef4444", fontWeight:700 }}>· {Number(reste).toLocaleString("fr-FR")} F restant</span>}
                                    {last.refTransaction && <span style={{ fontSize:10, fontFamily:"monospace", color:"#0891b2", background:"#fff", border:"1px solid #bae6fd", borderRadius:4, padding:"0 5px", marginLeft:2 }}>🔖 {last.refTransaction}</span>}
                                    {pmts.length > 1 && <span style={{ marginLeft:"auto", fontSize:10, color:"#94a3b8" }}>{pmts.length} paiements</span>}
                                  </div>
                                );
                              })()}

                            </div>
                            {/* Actions */}
                            <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                              <select
                                value={a.statut}
                                onChange={e => updateStatutAssignation(a.id, e.target.value)}
                                style={{ ...selectSt, fontSize:11, padding:"4px 8px", cursor:"pointer" }}
                              >
                                <option value="en_attente">En attente</option>
                                <option value="en_cours">En cours</option>
                                <option value="converti">Converti</option>
                                <option value="perdu">Perdu</option>
                              </select>
                              <button
                                onClick={() => setChatAssignation(chatAssignation?.id === a.id ? null : a)}
                                style={{ position:"relative", background: chatAssignation?.id === a.id ? "#0f172a" : BET_COLOR, color:"#fff", border:"none", borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5, justifyContent:"center" }}
                              >
                                💬 {chatAssignation?.id === a.id ? "Fermer" : "Discuter"}
                                {(prospectUnreadMap[a.id] || 0) > 0 && chatAssignation?.id !== a.id && (
                                  <span style={{ position:"absolute", top:-5, right:-5, background:"#ef4444", color:"#fff", borderRadius:"50%", minWidth:16, height:16, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px", lineHeight:1, border:"2px solid #fff" }}>
                                    {prospectUnreadMap[a.id] > 9 ? "9+" : prospectUnreadMap[a.id]}
                                  </span>
                                )}
                              </button>
                              {/* ── Lien test ── */}
                              <button
                                onClick={() => {
                                  if (testProspect) return;
                                  const SITE = process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000";
                                  const lien = `${SITE}/test-niveau?ref=${profil?.id}`;
                                  navigator.clipboard.writeText(lien).then(() => toast.success("Lien test copié !")).catch(() => toast.error("Impossible de copier"));
                                }}
                                disabled={!!testProspect}
                                title={testProspect ? "Test déjà effectué" : "Copier le lien du test"}
                                style={{ background: testProspect ? "#f1f5f9" : "#f0fdf4", color: testProspect ? "#94a3b8" : "#16a34a", border: `1px solid ${testProspect ? "#e2e8f0" : "#bbf7d0"}`, borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700, cursor: testProspect ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:5, justifyContent:"center", opacity: testProspect ? 0.6 : 1 }}
                              >
                                📋 Lien test
                              </button>
                              <button
                                onClick={() => {
                                  if (testProspect) return;
                                  const nameParts = (a.prospect_nom || "").trim().split(/\s+/);
                                  setEditingItem({
                                    nom:       nameParts[0] || "",
                                    prenom:    nameParts.slice(1).join(" ") || "",
                                    email:     a.prospect_email    || "",
                                    telephone: a.prospect_telephone || "",
                                    profil:    "Particulier",
                                    niveau:    "A2",
                                    score:     0,
                                    date:      new Date().toISOString().slice(0, 10),
                                    statut:    "nouveau",
                                    notes:     "",
                                    offreRecommandee: "",
                                    centre_id: a.centre_id || null,
                                  });
                                  setShowTestModal(true);
                                }}
                                disabled={!!testProspect}
                                title={testProspect ? "Test déjà effectué" : "Saisir le résultat d'un test oral"}
                                style={{ background: testProspect ? "#f1f5f9" : "#faf5ff", color: testProspect ? "#94a3b8" : "#7c3aed", border: `1px solid ${testProspect ? "#e2e8f0" : "#ddd6fe"}`, borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700, cursor: testProspect ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:5, justifyContent:"center", opacity: testProspect ? 0.6 : 1 }}
                              >
                                📝 Test oral
                              </button>
                              {/* ── Bouton paiement prospect ── */}
                              <button
                                onClick={() => {
                                  const typeLabel = a.type_coaching === "groupe" ? "Coaching groupe" : a.type_coaching === "prive" ? "Coaching privé" : "Formation";
                                  const modeLabel = a.type_cours === "en_ligne" ? "En ligne" : `Présentiel${a.centre_nom ? " — " + a.centre_nom : ""}`;
                                  setEditingItem({
                                    client:        a.prospect_nom       || "",
                                    email:         a.prospect_email     || "",
                                    telephone:     a.prospect_telephone || "",
                                    inscription:   `Parcours BET · ${modeLabel} · ${typeLabel}`,
                                    montantDu:     0,
                                    montantReçu:   0,
                                    date:          new Date().toISOString().slice(0, 10),
                                    mode:          "Mobile Money",
                                    statut:        "en_attente",
                                    notes:         "",
                                    refTransaction:"",
                                    assignationId: a.id,
                                  });
                                  setShowPaiementModal(true);
                                }}
                                title="Enregistrer un paiement pour ce prospect"
                                style={{ background:"#fffbeb", color:"#d97706", border:"1px solid #fde68a", borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5, justifyContent:"center" }}
                              >
                                💳 Paiement
                              </button>

                              {/* ── Finaliser l'inscription ── */}
                              {(() => {
                                const pmtsDispo = paiements.filter(p => p.assignationId === a.id);
                                const hasPaiement = pmtsDispo.length > 0 && pmtsDispo.some(p => (p.montantReçu||0) > 0);
                                return (
                                  <button
                                    onClick={() => {
                                      if (!hasPaiement) {
                                        toast.error("Un paiement doit être enregistré avant de finaliser l'inscription.");
                                        return;
                                      }
                                      setFinalisationTarget(a);
                                      setShowFinalisationModal(true);
                                    }}
                                    title={hasPaiement ? "Finaliser l'inscription et convertir en apprenant" : "Paiement requis avant finalisation"}
                                    style={{
                                      background: hasPaiement ? "linear-gradient(135deg,#15803d,#22c55e)" : "#f1f5f9",
                                      color:      hasPaiement ? "#fff" : "#94a3b8",
                                      border:     hasPaiement ? "none" : "1px solid #e2e8f0",
                                      borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700,
                                      cursor: hasPaiement ? "pointer" : "not-allowed",
                                      display:"flex", alignItems:"center", gap:5, justifyContent:"center",
                                      opacity: hasPaiement ? 1 : 0.6,
                                    }}
                                  >
                                    🎓 Finaliser
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══ MES APPRENANTS ══ */}
            {activeTab === "apprenants" && (() => {
              const NIVEAU_COLOR = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };

              // Source : toutes les assignations converties
              const apprenants = assignations.filter(a => a.statut === "converti");

              // Filtrage
              const appFiltered = apprenants.filter(a => {
                const q = appSearchQ.toLowerCase();
                if (q && !`${a.prospect_nom} ${a.prospect_email} ${a.prospect_telephone}`.toLowerCase().includes(q)) return false;
                if (appTypeCours !== "tous" && a.type_cours    !== appTypeCours)  return false;
                if (appTypeCoach !== "tous" && a.type_coaching !== appTypeCoach)  return false;
                if (appNiveau    !== "tous") {
                  const t = tests.find(t => t.email && a.prospect_email && t.email.toLowerCase() === a.prospect_email.toLowerCase());
                  if (!t || t.niveau !== appNiveau) return false;
                }
                return true;
              });

              // KPI globaux (sur toute la liste, pas filtrée)
              const totalEncaisse = apprenants.reduce((s, a) => {
                const pmts = paiements.filter(p => p.assignationId === a.id);
                return s + pmts.reduce((ss,p) => ss+(p.montantReçu||0), 0);
              }, 0);
              const totalDuGlobal = apprenants.reduce((s, a) => {
                const pmts = paiements.filter(p => p.assignationId === a.id);
                return s + pmts.reduce((ss,p) => ss+(p.montantDu||0), 0);
              }, 0);
              const nbAvecTest = apprenants.filter(a =>
                tests.some(t => t.email && a.prospect_email && t.email.toLowerCase() === a.prospect_email.toLowerCase())
              ).length;

              return (
                <div>
                  {/* ── Header ── */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>🎓 Mes apprenants</h2>
                      <p style={{ margin:"4px 0 0", fontSize:12, color:"#9ca3af" }}>Tous les prospects que vous avez convertis en apprenants BET Languages</p>
                    </div>
                    <button onClick={() => { setActiveTab("assignations"); }} style={{ ...btnSecondary, fontSize:11, padding:"7px 14px" }}>
                      ← Retour aux prospects
                    </button>
                  </div>

                  {/* ── KPI ── */}
                  {(() => {
                    const appAvecStats = apprenants.filter(a => Number(progressionNotes[a.id]?.seances) > 0);
                    const totalSeances   = appAvecStats.reduce((s,a) => s + Number(progressionNotes[a.id]?.seances  ||0), 0);
                    const totalPresences = appAvecStats.reduce((s,a) => s + Number(progressionNotes[a.id]?.presences||0), 0);
                    const totalAbsences  = appAvecStats.reduce((s,a) => s + Number(progressionNotes[a.id]?.absences ||0), 0);
                    const tauxPartGlobal = totalSeances > 0 ? Math.round((totalPresences / totalSeances) * 100) : null;
                    const tauxAbsGlobal  = totalSeances > 0 ? Math.round((totalAbsences  / totalSeances) * 100) : null;
                    return (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:22 }}>
                        <StatCard label="Total apprenants"  value={apprenants.length}        color={BET_COLOR}  icon="🎓" sub="convertis" />
                        <StatCard label="Avec test de niveau" value={nbAvecTest}             color="#7c3aed"    icon="📝" sub={`sur ${apprenants.length}`} />
                        <StatCard label="Total encaissé"    value={Number(totalEncaisse).toLocaleString("fr-FR")+" F"} color="#22c55e" icon="✅" />
                        <StatCard label="Reste à percevoir" value={Number(Math.max(0,totalDuGlobal-totalEncaisse)).toLocaleString("fr-FR")+" F"} color={totalDuGlobal-totalEncaisse>0?"#ef4444":"#22c55e"} icon="⏳" />
                        <StatCard
                          label="Taux de participation"
                          value={tauxPartGlobal !== null ? `${tauxPartGlobal}%` : "—"}
                          color={tauxPartGlobal===null?"#94a3b8":tauxPartGlobal>=80?"#22c55e":tauxPartGlobal>=60?"#f59e0b":"#ef4444"}
                          icon="✅"
                          sub={tauxPartGlobal !== null ? `${totalPresences}/${totalSeances} séances` : "Aucune donnée"}
                        />
                        <StatCard
                          label="Taux d'absentéisme"
                          value={tauxAbsGlobal !== null ? `${tauxAbsGlobal}%` : "—"}
                          color={tauxAbsGlobal===null?"#94a3b8":tauxAbsGlobal<=10?"#22c55e":tauxAbsGlobal<=25?"#f59e0b":"#ef4444"}
                          icon="❌"
                          sub={tauxAbsGlobal !== null ? `${totalAbsences} absence${totalAbsences>1?"s":""}` : "Aucune donnée"}
                        />
                      </div>
                    );
                  })()}

                  {/* ── Barre filtres ── */}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:18, padding:"10px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}>
                    <input
                      value={appSearchQ}
                      onChange={e => setAppSearchQ(e.target.value)}
                      placeholder="🔍 Rechercher un apprenant…"
                      style={{ ...inputSt, width:220, margin:0 }}
                    />
                    <select value={appTypeCours} onChange={e => setAppTypeCours(e.target.value)} style={{ ...inputSt, width:150, margin:0 }}>
                      <option value="tous">Tous les modes</option>
                      <option value="en_ligne">En ligne</option>
                      <option value="presentiel">Présentiel</option>
                    </select>
                    <select value={appTypeCoach} onChange={e => setAppTypeCoach(e.target.value)} style={{ ...inputSt, width:150, margin:0 }}>
                      <option value="tous">Tout coaching</option>
                      <option value="groupe">Groupe</option>
                      <option value="prive">Privé</option>
                    </select>
                    <select value={appNiveau} onChange={e => setAppNiveau(e.target.value)} style={{ ...inputSt, width:140, margin:0 }}>
                      <option value="tous">Tous niveaux</option>
                      {["A1","A2","B1","B2","C1","C2"].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {(appSearchQ||appTypeCours!=="tous"||appTypeCoach!=="tous"||appNiveau!=="tous") && (
                      <button onClick={() => { setAppSearchQ(""); setAppTypeCours("tous"); setAppTypeCoach("tous"); setAppNiveau("tous"); }} style={{ ...btnSecondary, padding:"6px 12px", margin:0, fontSize:11 }}>✕ Effacer</button>
                    )}
                    <span style={{ marginLeft:"auto", fontSize:11, color:"#6b7280" }}>{appFiltered.length} apprenant{appFiltered.length!==1?"s":""}</span>
                  </div>

                  {/* ── Vide ── */}
                  {apprenants.length === 0 && (
                    <div style={{ textAlign:"center", padding:"60px 24px", background:"#f8fafc", borderRadius:16, border:"2px dashed #e2e8f0" }}>
                      <div style={{ fontSize:"3.5rem", marginBottom:12 }}>🎓</div>
                      <div style={{ fontSize:15, fontWeight:800, color:"#0f172a", marginBottom:6 }}>Aucun apprenant pour l'instant</div>
                      <div style={{ fontSize:13, color:"#9ca3af", maxWidth:360, margin:"0 auto 20px" }}>
                        Lorsqu'un prospect est marqué <strong>Converti</strong> dans l'onglet Prospects, il apparaîtra automatiquement ici.
                      </div>
                      <button onClick={() => setActiveTab("assignations")} style={btnPrimary}>Voir mes prospects →</button>
                    </div>
                  )}

                  {apprenants.length > 0 && appFiltered.length === 0 && (
                    <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8", fontSize:13 }}>Aucun apprenant ne correspond aux filtres.</div>
                  )}

                  {/* ── Grille cards ── */}
                  {appFiltered.length > 0 && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
                      {appFiltered.map(a => {
                        const initiales = (a.prospect_nom || "?").split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();
                        const testProspect = tests.find(t => t.email && a.prospect_email && t.email.toLowerCase() === a.prospect_email.toLowerCase());
                        const docsApp = a.documents_dossier || [];
                        const pmts = paiements.filter(p => p.assignationId === a.id);
                        const totalReçu = pmts.reduce((s,p)=>s+(p.montantReçu||0),0);
                        const totalDu   = pmts.reduce((s,p)=>s+(p.montantDu  ||0),0);
                        const reste     = totalDu - totalReçu;
                        const lastPmt   = pmts[0];
                        const niveauColor = NIVEAU_COLOR[testProspect?.niveau] || "#6b7280";
                        const modeLabel = a.type_cours === "en_ligne" ? "En ligne" : `Présentiel${a.centre_nom ? " · "+a.centre_nom : ""}`;
                        const coachLabel = a.type_coaching === "groupe" ? "Groupe" : a.type_coaching === "prive" ? "Privé" : "—";

                        return (
                          <div key={a.id} style={{ background:"#fff", borderRadius:14, border:"1.5px solid #e2e8f0", overflow:"hidden", boxShadow:"0 1px 6px rgba(0,0,0,0.05)", transition:"box-shadow .2s" }}>

                            {/* ── Header coloré ── */}
                            <div style={{ background:"linear-gradient(135deg,#0f172a,#0891b2)", padding:"16px 18px", display:"flex", alignItems:"center", gap:14 }}>
                              <div style={{ width:46, height:46, borderRadius:"50%", background:"rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:"#fff", flexShrink:0, border:"2px solid rgba(255,255,255,0.3)" }}>
                                {initiales}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:14, fontWeight:800, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.prospect_nom || "—"}</div>
                                {a.prospect_email && <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.prospect_email}</div>}
                                {a.prospect_telephone && <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", marginTop:1 }}>📞 {a.prospect_telephone}</div>}
                              </div>
                              <span style={{ background:"#22c55e", color:"#fff", borderRadius:999, fontSize:10, fontWeight:800, padding:"3px 10px", whiteSpace:"nowrap", flexShrink:0 }}>✓ Apprenant</span>
                            </div>

                            <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:10 }}>

                              {/* ── Parcours ── */}
                              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:999, background:"#e0f2fe", color:"#0369a1" }}>{modeLabel}</span>
                                <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:999, background:"#f3e8ff", color:"#7c3aed" }}>👥 {coachLabel}</span>
                                {a.assistante_nom && <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:999, background:"#f0fdf4", color:"#15803d" }}>👩‍💼 {a.assistante_nom}</span>}
                              </div>

                              {/* ── Test de niveau ── */}
                              {testProspect ? (
                                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 11px", background:"#f0fdf4", borderRadius:8, border:"1px solid #bbf7d0" }}>
                                  <span style={{ fontSize:11, fontWeight:700, color:"#15803d" }}>📝 Niveau</span>
                                  <span style={{ fontWeight:800, fontSize:13, color:"#fff", background: niveauColor, borderRadius:999, padding:"1px 10px" }}>{testProspect.niveau}</span>
                                  <span style={{ fontSize:11, color:"#64748b" }}>{testProspect.score}%</span>
                                  <button
                                    onClick={() => { setSelectedTest(testProspect); setShowTestDetailModal(true); }}
                                    style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6, border:"1px solid #16a34a40", background:"#dcfce7", color:"#15803d", cursor:"pointer" }}
                                  >Voir →</button>
                                </div>
                              ) : (
                                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 11px", background:"#fafafa", borderRadius:8, border:"1px dashed #e2e8f0" }}>
                                  <span style={{ fontSize:11, color:"#94a3b8" }}>⏳ Test non effectué</span>
                                </div>
                              )}

                              {/* ── Paiements ── */}
                              {pmts.length === 0 ? (
                                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 11px", background:"#fafafa", borderRadius:8, border:"1px dashed #e2e8f0" }}>
                                  <span style={{ fontSize:11, color:"#94a3b8" }}>💳 Aucun paiement</span>
                                  <button
                                    onClick={() => {
                                      const typeLabel = a.type_coaching === "groupe" ? "Coaching groupe" : a.type_coaching === "prive" ? "Coaching privé" : "Formation";
                                      setEditingItem({ client:a.prospect_nom||"", email:a.prospect_email||"", telephone:a.prospect_telephone||"", inscription:`Parcours BET · ${modeLabel} · ${typeLabel}`, montantDu:0, montantReçu:0, date:new Date().toISOString().slice(0,10), mode:"Mobile Money", statut:"en_attente", notes:"", refTransaction:"", assignationId:a.id });
                                      setShowPaiementModal(true);
                                    }}
                                    style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6, border:"1px solid #fde68a", background:"#fffbeb", color:"#d97706", cursor:"pointer" }}
                                  >+ Ajouter</button>
                                </div>
                              ) : (
                                <div style={{ background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0", overflow:"hidden" }}>
                                  {/* barre statut */}
                                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", background: reste<=0?"#dcfce7":totalReçu>0?"#e0f2fe":"#fef3c7", borderBottom:"1px solid #e2e8f0" }}>
                                    <span style={{ fontSize:11, fontWeight:700, color: reste<=0?"#15803d":totalReçu>0?"#0369a1":"#d97706" }}>
                                      {reste<=0 ? "✅ Paiement complet" : totalReçu>0 ? "🔄 Paiement partiel" : "⏳ En attente"}
                                    </span>
                                    {lastPmt?.mode && <span style={{ fontSize:10, color:"#64748b", marginLeft:4 }}>· {lastPmt.mode}</span>}
                                    {pmts.length > 1 && <span style={{ marginLeft:"auto", fontSize:10, color:"#94a3b8" }}>{pmts.length} versements</span>}
                                  </div>
                                  {/* montants */}
                                  <div style={{ display:"flex", padding:"8px 12px", gap:0 }}>
                                    <div style={{ flex:1, textAlign:"center", borderRight:"1px solid #e2e8f0" }}>
                                      <div style={{ fontSize:10, color:"#94a3b8" }}>Dû</div>
                                      <div style={{ fontSize:12, fontWeight:800, color:"#0f172a" }}>{Number(totalDu).toLocaleString("fr-FR")} F</div>
                                    </div>
                                    <div style={{ flex:1, textAlign:"center", borderRight:"1px solid #e2e8f0" }}>
                                      <div style={{ fontSize:10, color:"#94a3b8" }}>Reçu</div>
                                      <div style={{ fontSize:12, fontWeight:800, color:"#22c55e" }}>{Number(totalReçu).toLocaleString("fr-FR")} F</div>
                                    </div>
                                    <div style={{ flex:1, textAlign:"center" }}>
                                      <div style={{ fontSize:10, color:"#94a3b8" }}>Reste</div>
                                      <div style={{ fontSize:12, fontWeight:800, color:reste>0?"#ef4444":"#22c55e" }}>{reste>0?Number(reste).toLocaleString("fr-FR")+" F":"–"}</div>
                                    </div>
                                  </div>
                                  {/* ref */}
                                  {lastPmt?.refTransaction && (
                                    <div style={{ padding:"4px 12px 7px", borderTop:"1px solid #f1f5f9", fontSize:10 }}>
                                      <span style={{ color:"#64748b" }}>🔖 </span>
                                      <span style={{ fontWeight:700, color:"#0891b2", fontFamily:"monospace" }}>{lastPmt.refTransaction}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* ── Documents dossier ── */}
                              <button
                                onClick={() => { setDocDossierTarget(a); setShowDocDossierModal(true); }}
                                style={{ width:"100%", textAlign:"left", background: docsApp.length > 0 ? "#faf5ff" : "#fafafa", borderRadius:8, border: docsApp.length > 0 ? "1px solid #e9d5ff" : "1px dashed #e2e8f0", padding:"7px 11px", cursor:"pointer" }}
                              >
                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: docsApp.length > 0 ? 5 : 0 }}>
                                  <span style={{ fontSize:10, fontWeight:700, color: docsApp.length > 0 ? "#7c3aed" : "#94a3b8" }}>
                                    📎 Documents dossier {docsApp.length > 0 ? `(${docsApp.length})` : ""}
                                  </span>
                                  <span style={{ fontSize:10, color:"#7c3aed", fontWeight:600 }}>
                                    {docsApp.length > 0 ? "✏️ Gérer" : "+ Ajouter"}
                                  </span>
                                </div>
                                {docsApp.length > 0 && (
                                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                    {docsApp.map((doc, di) => (
                                      <span key={di} style={{ fontSize:10, background:"#ede9fe", color:"#6d28d9", padding:"2px 8px", borderRadius:5, fontWeight:600 }}>
                                        {DOC_TYPES.find(d=>d.key===doc.type)?.icon||"📎"} {doc.nom}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </button>

                              {/* ── Assiduité ── */}
                              {(() => {
                                const p = progressionNotes[a.id] || {};
                                const seances   = Number(p.seances)   || 0;
                                const presences = Number(p.presences) || 0;
                                const absences  = Number(p.absences)  || 0;
                                if (seances === 0) return null;
                                const tauxParticipation = Math.round((presences / seances) * 100);
                                const tauxAbsenteisme   = Math.round((absences  / seances) * 100);
                                return (
                                  <div style={{ background:"#f0fdf4", borderRadius:8, border:"1px solid #bbf7d0", padding:"8px 11px" }}>
                                    <div style={{ fontSize:10, fontWeight:800, color:"#15803d", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>📊 Assiduité · {seances} séance{seances>1?"s":""}</div>
                                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                                      <div style={{ background:"#dcfce7", borderRadius:6, padding:"6px 8px", textAlign:"center" }}>
                                        <div style={{ fontSize:9, color:"#15803d", fontWeight:600, marginBottom:2 }}>Participation</div>
                                        <div style={{ fontSize:17, fontWeight:900, color: tauxParticipation >= 80 ? "#15803d" : tauxParticipation >= 60 ? "#d97706" : "#ef4444", lineHeight:1 }}>{tauxParticipation}%</div>
                                      </div>
                                      <div style={{ background:"#fee2e2", borderRadius:6, padding:"6px 8px", textAlign:"center" }}>
                                        <div style={{ fontSize:9, color:"#b91c1c", fontWeight:600, marginBottom:2 }}>Absentéisme</div>
                                        <div style={{ fontSize:17, fontWeight:900, color: tauxAbsenteisme <= 10 ? "#15803d" : tauxAbsenteisme <= 25 ? "#d97706" : "#ef4444", lineHeight:1 }}>{tauxAbsenteisme}%</div>
                                      </div>
                                    </div>
                                    <div style={{ marginTop:6, height:5, background:"#e5e7eb", borderRadius:999, overflow:"hidden" }}>
                                      <div style={{ height:"100%", borderRadius:999, width:`${tauxParticipation}%`, background: tauxParticipation>=80?"#22c55e":tauxParticipation>=60?"#f59e0b":"#ef4444", transition:"width .4s" }} />
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* ── Date conversion ── */}
                              {a.updated_at && (
                                <div style={{ fontSize:10, color:"#94a3b8" }}>
                                  ✓ Converti le {new Date(a.updated_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
                                </div>
                              )}

                              {/* ── Actions ── */}
                              <div style={{ display:"flex", gap:6, flexWrap:"wrap", paddingTop:4, borderTop:"1px solid #f1f5f9" }}>
                                {/* Chat */}
                                <button
                                  onClick={() => setChatAssignation(chatAssignation?.id === a.id ? null : a)}
                                  style={{ flex:1, position:"relative", background: chatAssignation?.id === a.id ? "#0f172a" : BET_COLOR, color:"#fff", border:"none", borderRadius:8, padding:"6px 8px", fontSize:11, fontWeight:700, cursor:"pointer" }}
                                >
                                  💬 {chatAssignation?.id === a.id ? "Fermer" : "Chat"}
                                </button>
                                {/* Paiements → ouvre la liste */}
                                <button
                                  onClick={() => { setPmtListTarget(a); setShowPmtListModal(true); }}
                                  style={{ flex:1, background:"#fffbeb", color:"#d97706", border:"1px solid #fde68a", borderRadius:8, padding:"6px 8px", fontSize:11, fontWeight:700, cursor:"pointer", position:"relative" }}
                                >
                                  💳 Paiements
                                  {pmts.length > 0 && <span style={{ marginLeft:4, background:"#d97706", color:"#fff", borderRadius:999, fontSize:9, padding:"0 5px", fontWeight:800 }}>{pmts.length}</span>}
                                </button>
                                {/* Progression */}
                                <button
                                  onClick={() => { setProgressionTarget(a); setShowProgressionModal(true); }}
                                  style={{ flex:1, background:"#f3e8ff", color:"#7c3aed", border:"1px solid #ddd6fe", borderRadius:8, padding:"6px 8px", fontSize:11, fontWeight:700, cursor:"pointer" }}
                                >📈 Progression</button>
                                {/* Suivi démarrage */}
                                {(() => {
                                  const suivi = a.suivi_demarrage || {};
                                  const steps = suivi.steps || [];
                                  const done  = steps.filter(s => s.done).length;
                                  const total = steps.length;
                                  const allDone = total > 0 && done === total;
                                  return (
                                    <button
                                      onClick={() => { setSuiviTarget(a); setShowSuiviModal(true); }}
                                      style={{ flex:1, background: allDone ? "#dcfce7" : total > 0 ? "#fef9c3" : "#f0fdf4", color: allDone ? "#15803d" : total > 0 ? "#92400e" : "#15803d", border: allDone ? "1px solid #86efac" : total > 0 ? "1px solid #fde68a" : "1px solid #bbf7d0", borderRadius:8, padding:"6px 8px", fontSize:11, fontWeight:700, cursor:"pointer", position:"relative" }}
                                    >
                                      🚀 Suivi
                                      {total > 0 && (
                                        <span style={{ marginLeft:4, background: allDone ? "#15803d" : "#d97706", color:"#fff", borderRadius:999, fontSize:9, padding:"0 5px", fontWeight:800 }}>
                                          {done}/{total}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })()}
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Chat panel ancré en bas si ouvert */}
                  {chatAssignation && activeTab === "apprenants" && (
                    <div style={{ marginTop:24 }}>
                      <ProspectChatPanel assignation={chatAssignation} commercialId={myCommercialId} onClose={() => setChatAssignation(null)} />
                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        </div>
      </div>

      {/* ══ MODAL NEWSLETTER ══ */}
      {showNewsletterModal && selectedNewsletter && (() => {
        const CAT_META2 = {
          interne:     { label:"Interne BET",    color:"#0891b2", bg:"#e0f2fe",  icon:"🏢" },
          marché:      { label:"Marché",         color:"#7c3aed", bg:"#f3e8ff",  icon:"📈" },
          partenaire:  { label:"Partenaire",     color:"#059669", bg:"#d1fae5",  icon:"🤝" },
          opportunité: { label:"Opportunité",    color:"#d97706", bg:"#fef3c7",  icon:"💡" },
          formation:   { label:"Formation",      color:"#6366f1", bg:"#ede9fe",  icon:"🚀" },
        };
        const cat = CAT_META2[selectedNewsletter.categorie] || { label:selectedNewsletter.categorie, color:"#6b7280", bg:"#f3f4f6", icon:"📧" };
        return (
          <div style={modalOverlay}>
            <div style={{ ...modalBox, width:700, maxHeight:"88vh", overflowY:"auto", padding:0 }}>
              {/* Header coloré */}
              <div style={{ background:`linear-gradient(135deg,#0f172a,${cat.color})`, padding:"22px 28px", color:"#fff", borderRadius:"14px 14px 0 0", position:"relative" }}>
                <button onClick={()=>{ setShowNewsletterModal(false); setSelectedNewsletter(null); }} style={{ position:"absolute", top:14, right:16, background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:28, height:28, borderRadius:"50%", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>{cat.icon}</div>
                  <div>
                    <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                      <span style={{ padding:"2px 10px", borderRadius:10, fontSize:10, fontWeight:700, background:"rgba(255,255,255,0.2)", color:"#fff" }}>{cat.label}</span>
                    </div>
                    <h2 style={{ margin:"0 0 6px", fontSize:17, fontWeight:800, lineHeight:1.3 }}>{selectedNewsletter.sujet}</h2>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)" }}>De : {selectedNewsletter.expediteur} · {formatDate(selectedNewsletter.date)}</div>
                  </div>
                </div>
              </div>
              {/* Contenu */}
              <div style={{ padding:"24px 28px" }}>
                <div style={{ padding:"12px 16px", borderRadius:8, background:"#f8fafc", border:"1px solid #e2e8f0", marginBottom:20, fontSize:12, color:"#374151", lineHeight:1.6, fontStyle:"italic" }}>
                  📝 {selectedNewsletter.resume}
                </div>
                <div style={{ fontSize:13, color:"#374151", lineHeight:1.8 }}
                  dangerouslySetInnerHTML={{ __html: selectedNewsletter.contenu }}
                />
                {selectedNewsletter.pieceJointe && (
                  <div style={{ marginTop:20, padding:"12px 16px", borderRadius:10, background:"#f0f9ff", border:"1px solid #bae6fd", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:13 }}>
                      <span style={{ fontSize:22 }}>📎</span>
                      <div><div style={{ fontWeight:700, color:"#0f172a" }}>{selectedNewsletter.pieceJointe}</div><div style={{ fontSize:11, color:"#9ca3af" }}>Pièce jointe</div></div>
                    </div>
                    <button onClick={()=>{ const a=document.createElement("a"); a.href="#"; a.download=selectedNewsletter.pieceJointe; toast.success(`📎 ${selectedNewsletter.pieceJointe} téléchargé`); }} style={{ padding:"7px 14px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Télécharger</button>
                  </div>
                )}
                <div style={{ display:"flex", gap:10, marginTop:20, paddingTop:16, borderTop:"1px solid #e5e7eb" }}>
                  <button onClick={()=>{ setShowNewsletterModal(false); setSelectedNewsletter(null); }} style={btnSecondary}>Fermer</button>
                  <button onClick={()=>{ setNewsletters(prev=>prev.map(n=>n.id===selectedNewsletter.id?{...n,lu:false}:n)); toast("Marqué comme non lu"); setShowNewsletterModal(false); }} style={{ ...btnSecondary, marginLeft:"auto" }}>Marquer non lu</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODALES ══ */}
      {showLeadModal && (
        <Modal title={editingItem ? "Modifier le lead" : "Ajouter un lead"} onClose={() => { setShowLeadModal(false); setEditingItem(null); }}>
          <LeadForm initialData={editingItem} onSave={handleSaveLead} onCancel={() => setShowLeadModal(false)} />
        </Modal>
      )}
      {showDevisModal && (
        <Modal title={editingItem ? "Modifier le devis" : "Ajouter un devis"} onClose={() => { setShowDevisModal(false); setEditingItem(null); }}>
          <DevisForm initialData={editingItem} onSave={handleSaveDevis} onCancel={() => setShowDevisModal(false)} />
        </Modal>
      )}
      {showInscriptionModal && (
        <Modal title={editingItem ? "Modifier l'inscription" : "Ajouter une inscription"} onClose={() => { setShowInscriptionModal(false); setEditingItem(null); }}>
          <InscriptionForm initialData={editingItem} onSave={handleSaveInscription} onCancel={() => setShowInscriptionModal(false)} />
        </Modal>
      )}

      {/* ══ MODAL LISTE PAIEMENTS APPRENANT ══ */}
      {showPmtListModal && pmtListTarget && (() => {
        const a    = pmtListTarget;
        const pmts = paiements.filter(p => p.assignationId === a.id);
        const totalDu   = pmts.reduce((s,p)=>s+(p.montantDu  ||0),0);
        const totalReçu = pmts.reduce((s,p)=>s+(p.montantReçu||0),0);
        const reste     = totalDu - totalReçu;
        const modeLabel = a.type_cours==="en_ligne" ? "En ligne" : `Présentiel${a.centre_nom?" · "+a.centre_nom:""}`;
        const PSTAT = { en_attente:{label:"En attente",color:"#d97706",bg:"#fef3c7",icon:"⏳"}, partiel:{label:"Partiel",color:"#0891b2",bg:"#e0f2fe",icon:"🔄"}, reçu:{label:"Reçu",color:"#16a34a",bg:"#dcfce7",icon:"✅"}, remboursé:{label:"Remboursé",color:"#7c3aed",bg:"#ede9fe",icon:"↩️"} };

        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:620, maxHeight:"90vh", overflowY:"auto", display:"flex", flexDirection:"column" }}>

              {/* Header */}
              <div style={{ background:"linear-gradient(135deg,#0f172a,#d97706)", padding:"18px 22px", borderRadius:"16px 16px 0 0", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
                <div>
                  <div style={{ fontSize:10, color:"#fde68a", fontWeight:700, letterSpacing:".06em", marginBottom:3 }}>PAIEMENTS — {a.prospect_nom}</div>
                  <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>💳 Historique des paiements</h3>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", marginTop:3 }}>{modeLabel} · {pmts.length} versement{pmts.length!==1?"s":""}</div>
                </div>
                <button onClick={()=>{ setShowPmtListModal(false); setPmtListTarget(null); }} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:28, height:28, borderRadius:"50%", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>

              <div style={{ padding:"18px 22px", display:"flex", flexDirection:"column", gap:14 }}>

                {/* Récap financier */}
                <div style={{ display:"flex", gap:0, background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0", overflow:"hidden" }}>
                  {[{l:"Total dû",v:totalDu,c:"#0f172a"},{l:"Total reçu",v:totalReçu,c:"#22c55e"},{l:"Reste",v:reste,c:reste>0?"#ef4444":"#22c55e"}].map((s,i,arr)=>(
                    <div key={s.l} style={{ flex:1, textAlign:"center", padding:"10px 8px", borderRight:i<arr.length-1?"1px solid #e2e8f0":"none" }}>
                      <div style={{ fontSize:10, color:"#94a3b8", marginBottom:3 }}>{s.l}</div>
                      <div style={{ fontSize:15, fontWeight:800, color:s.c }}>{Number(Math.max(0,s.v)).toLocaleString("fr-FR")} F</div>
                    </div>
                  ))}
                </div>

                {/* Liste paiements */}
                {pmts.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"30px 0", color:"#94a3b8" }}>Aucun paiement enregistré.</div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {pmts.map((p, idx) => {
                      const ps = PSTAT[p.statut] || PSTAT.en_attente;
                      return (
                        <div key={p.id||idx} style={{ background:"#fff", borderRadius:12, border:"1.5px solid #e2e8f0", overflow:"hidden" }}>
                          {/* barre colorée statut */}
                          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background: ps.bg, borderBottom:"1px solid #e2e8f0" }}>
                            <span>{ps.icon}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:ps.color }}>{ps.label}</span>
                            <span style={{ fontSize:11, color:"#64748b" }}>· {p.mode || "—"}</span>
                            <span style={{ marginLeft:"auto", fontSize:11, color:"#64748b" }}>{p.date ? new Date(p.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "—"}</span>
                          </div>
                          {/* corps */}
                          <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:6 }}>
                            <div style={{ display:"flex", gap:0 }}>
                              {[{l:"Dû",v:p.montantDu,c:"#0f172a"},{l:"Reçu",v:p.montantReçu,c:"#22c55e"},{l:"Reste",v:(p.montantDu||0)-(p.montantReçu||0),c:(p.montantDu||0)-(p.montantReçu||0)>0?"#ef4444":"#22c55e"}].map((s,i,arr)=>(
                                <div key={s.l} style={{ flex:1, textAlign:"center", borderRight:i<arr.length-1?"1px solid #f1f5f9":"none" }}>
                                  <div style={{ fontSize:9, color:"#94a3b8" }}>{s.l}</div>
                                  <div style={{ fontSize:13, fontWeight:800, color:s.c }}>{Number(Math.max(0,s.v)).toLocaleString("fr-FR")} F</div>
                                </div>
                              ))}
                            </div>
                            {p.refTransaction && (
                              <div style={{ fontSize:11, color:"#0891b2", fontFamily:"monospace", background:"#f0f9ff", borderRadius:6, padding:"3px 8px", alignSelf:"flex-start" }}>
                                🔖 {p.refTransaction}
                              </div>
                            )}
                            {p.notes && <div style={{ fontSize:10, color:"#94a3b8", fontStyle:"italic" }}>📝 {p.notes}</div>}

                            {/* Preuve de paiement (chèque / virement / RIA…) */}
                            {p.preuveImage && (
                              <div style={{ marginTop:4 }}>
                                <div style={{ fontSize:10, fontWeight:700, color:"#92400e", marginBottom:4 }}>📸 Preuve de paiement</div>
                                {p.preuveImage.startsWith("data:image") ? (
                                  <img
                                    src={p.preuveImage}
                                    alt="Preuve"
                                    style={{ maxWidth:"100%", maxHeight:160, objectFit:"contain", borderRadius:6, border:"1px solid #fde68a", background:"#fffbeb", cursor:"pointer" }}
                                    onClick={() => window.open(p.preuveImage, "_blank")}
                                    title="Cliquer pour agrandir"
                                  />
                                ) : (
                                  <a href={p.preuveImage} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"#0891b2", fontWeight:700 }}>
                                    📎 Voir le justificatif
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Bouton reçu individuel */}
                            <div style={{ display:"flex", justifyContent:"flex-end", gap:6, marginTop:6 }}>
                              <button
                                onClick={() => { setEditingItem(p); setShowPaiementModal(true); }}
                                style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:6, border:"1px solid #e2e8f0", background:"#f8fafc", color:"#374151", cursor:"pointer" }}
                              >✏️ Modifier</button>
                              <button
                                onClick={() => genererRecu(p)}
                                style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:6, border:"1px solid #bbf7d0", background:"#f0fdf4", color:"#15803d", cursor:"pointer" }}
                              >📄 Générer reçu</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bouton nouveau paiement */}
                {(() => {
                  const isPaidUp = totalDu > 0 && totalReçu >= totalDu;
                  const inscLie = inscriptions.find(i => i.email && a.prospect_email && i.email.toLowerCase() === a.prospect_email.toLowerCase());
                  const montantTotal = inscLie?.montant || totalDu || 0;
                  return (
                    <button
                      disabled={isPaidUp}
                      onClick={() => {
                        if (isPaidUp) return;
                        const typeLabel = a.type_coaching==="groupe"?"Coaching groupe":a.type_coaching==="prive"?"Coaching privé":"Formation";
                        setEditingItem({ client:a.prospect_nom||"", email:a.prospect_email||"", telephone:a.prospect_telephone||"", inscription:`Parcours BET · ${modeLabel} · ${typeLabel}`, montantDu:montantTotal, montantReçu:0, date:new Date().toISOString().slice(0,10), mode:"Mobile Money", statut:"en_attente", notes:"", refTransaction:"", assignationId:a.id });
                        setShowPmtListModal(false);
                        setShowPaiementModal(true);
                      }}
                      style={{ ...btnPrimary, width:"100%", justifyContent:"center", marginTop:4,
                        background: isPaidUp ? "#f1f5f9" : "linear-gradient(135deg,#d97706,#f59e0b)",
                        color: isPaidUp ? "#94a3b8" : "#fff",
                        cursor: isPaidUp ? "not-allowed" : "pointer",
                        opacity: isPaidUp ? 0.8 : 1,
                        border: isPaidUp ? "1px solid #e2e8f0" : "none"
                      }}
                    >{isPaidUp ? "✅ Paiement à jour — aucun solde restant" : "+ Enregistrer un nouveau paiement"}</button>
                  );
                })()}

              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL PROGRESSION APPRENANT ══ */}
      {showProgressionModal && progressionTarget && (() => {
        const a         = progressionTarget;
        const pmts      = paiements.filter(p => p.assignationId === a.id);
        const totalDu   = pmts.reduce((s,p)=>s+(p.montantDu  ||0),0);
        const totalReçu = pmts.reduce((s,p)=>s+(p.montantReçu||0),0);
        const testLie   = tests.find(t => t.email && a.prospect_email && t.email.toLowerCase()===a.prospect_email.toLowerCase());
        const modeLabel = a.type_cours==="en_ligne"?"En ligne":`Présentiel${a.centre_nom?" · "+a.centre_nom:""}`;
        const coachLabel= a.type_coaching==="groupe"?"Coaching groupe":a.type_coaching==="prive"?"Coaching privé":"—";
        const inscLie   = inscriptions.find(i => i.email && a.prospect_email && i.email.toLowerCase()===a.prospect_email.toLowerCase());
        const NIVEAU_COLOR = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };
        const NIVEAUX     = ["A1","A2","B1","B2","C1","C2"];
        const prog        = progressionNotes[a.id] || { seances:"", niveauActuel: testLie?.niveau || "", niveauCible:"", commentaire:"", presences:"", absences:"" };
        const setP        = (k,v) => setProgressionNotes(prev => ({ ...prev, [a.id]: { ...prog, [k]:v } }));
        const pctPaiement = totalDu > 0 ? Math.round((totalReçu/totalDu)*100) : 0;

        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:640, maxHeight:"92vh", overflowY:"auto", display:"flex", flexDirection:"column" }}>

              {/* Header */}
              <div style={{ background:"linear-gradient(135deg,#4c1d95,#7c3aed)", padding:"18px 22px", borderRadius:"16px 16px 0 0", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
                <div>
                  <div style={{ fontSize:10, color:"#ddd6fe", fontWeight:700, letterSpacing:".06em", marginBottom:3 }}>SUIVI DE PROGRESSION</div>
                  <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>📈 {a.prospect_nom}</h3>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", marginTop:3 }}>{modeLabel} · {coachLabel}{a.assistante_nom?" · "+a.assistante_nom:""}</div>
                </div>
                <button onClick={()=>{ setShowProgressionModal(false); setProgressionTarget(null); }} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:28, height:28, borderRadius:"50%", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>

              <div style={{ padding:"18px 22px", display:"flex", flexDirection:"column", gap:16 }}>

                {/* ── Infos formation ── */}
                {inscLie ? (
                  <div style={{ background:"#f0f9ff", borderRadius:10, padding:"12px 14px", border:"1px solid #bae6fd" }}>
                    <div style={{ fontSize:10, fontWeight:800, color:"#0369a1", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>📚 Formation inscrite</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {[
                        { l:"Offre", v:inscLie.offre||"—" },
                        { l:"Statut inscription", v:inscLie.statut||"—" },
                        { l:"Date de début", v:inscLie.dateDebut ? new Date(inscLie.dateDebut).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}) : "—" },
                        { l:"Montant", v:Number(inscLie.montant||0).toLocaleString("fr-FR")+" FCFA" },
                      ].map(s=>(
                        <div key={s.l} style={{ background:"#fff", borderRadius:6, padding:"6px 10px" }}>
                          <div style={{ fontSize:9, color:"#94a3b8" }}>{s.l}</div>
                          <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:"10px 14px", background:"#fafafa", borderRadius:8, border:"1px dashed #e2e8f0", fontSize:11, color:"#94a3b8" }}>
                    📋 Aucune inscription liée trouvée — finalisez d'abord l'inscription dans les Prospects.
                  </div>
                )}

                {/* ── Niveau CECRL ── */}
                <div style={{ background:"#faf5ff", borderRadius:10, padding:"12px 14px", border:"1px solid #ddd6fe" }}>
                  <div style={{ fontSize:10, fontWeight:800, color:"#7c3aed", marginBottom:10, textTransform:"uppercase", letterSpacing:".06em" }}>🎯 Niveaux CECRL</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <label style={{ fontSize:10, color:"#6b7280", display:"block", marginBottom:4 }}>Niveau initial (test)</label>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {NIVEAUX.map(n => (
                          <span key={n} style={{ padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:800, cursor:"default", background: (testLie?.niveau===n?NIVEAU_COLOR[n]:"#f1f5f9"), color: testLie?.niveau===n?"#fff":"#9ca3af" }}>{n}</span>
                        ))}
                      </div>
                      {testLie && <div style={{ fontSize:10, color:"#6b7280", marginTop:4 }}>Score : {testLie.score}% · {testLie.date}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:"#6b7280", display:"block", marginBottom:4 }}>Niveau actuel</label>
                      <select value={prog.niveauActuel||""} onChange={e=>setP("niveauActuel",e.target.value)} style={{ ...inputSt, margin:0, fontWeight:800 }}>
                        <option value="">– Choisir –</option>
                        {NIVEAUX.map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:"#6b7280", display:"block", marginBottom:4 }}>Niveau cible</label>
                      <select value={prog.niveauCible||""} onChange={e=>setP("niveauCible",e.target.value)} style={{ ...inputSt, margin:0, fontWeight:800 }}>
                        <option value="">– Choisir –</option>
                        {NIVEAUX.map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                      {prog.niveauActuel && prog.niveauCible && (
                        <div style={{ padding:"8px 10px", background:"#f3e8ff", borderRadius:8, fontSize:11, fontWeight:700, color:"#7c3aed" }}>
                          {NIVEAUX.indexOf(prog.niveauCible) > NIVEAUX.indexOf(prog.niveauActuel)
                            ? `🚀 Objectif : passer de ${prog.niveauActuel} → ${prog.niveauCible} (${NIVEAUX.indexOf(prog.niveauCible)-NIVEAUX.indexOf(prog.niveauActuel)} niveau${NIVEAUX.indexOf(prog.niveauCible)-NIVEAUX.indexOf(prog.niveauActuel)>1?"x":""})`
                            : prog.niveauActuel===prog.niveauCible
                              ? "✅ Niveau cible atteint !"
                              : "⚠️ Niveau cible inférieur au niveau actuel"
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Assiduité (lecture seule — saisie par le formateur) ── */}
                <div style={{ background:"#f0fdf4", borderRadius:10, padding:"12px 14px", border:"1px solid #bbf7d0" }}>
                  <div style={{ fontSize:10, fontWeight:800, color:"#15803d", marginBottom:10, textTransform:"uppercase", letterSpacing:".06em" }}>📅 Assiduité — saisie par le formateur</div>
                  {(() => {
                    const sp = a.suivi_presences || {};
                    const seances   = Number(sp.seances_effectuees) || 0;
                    const presences = Number(sp.presences)          || 0;
                    const absences  = Number(sp.absences)           || 0;
                    if (seances === 0) return (
                      <div style={{ padding:"14px", background:"#f8fafc", borderRadius:8, border:"1px dashed #d1fae5", textAlign:"center" }}>
                        <div style={{ fontSize:13, color:"#9ca3af" }}>⏳ Aucune donnée de présence pour l'instant</div>
                        <div style={{ fontSize:11, color:"#b0b9c6", marginTop:4 }}>Le formateur renseignera les présences depuis son espace</div>
                      </div>
                    );
                    const tauxPart = Math.round((presences / seances) * 100);
                    const tauxAbs  = Math.round((absences  / seances) * 100);
                    return (
                      <div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                          {[
                            { l:"Séances", v:seances,   c:"#0891b2", bg:"#e0f2fe" },
                            { l:"Présences", v:presences, c:"#15803d", bg:"#dcfce7" },
                            { l:"Absences",  v:absences,  c:"#b91c1c", bg:"#fee2e2" },
                          ].map(s => (
                            <div key={s.l} style={{ background:s.bg, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                              <div style={{ fontSize:9, color:s.c, fontWeight:600, marginBottom:2 }}>{s.l}</div>
                              <div style={{ fontSize:18, fontWeight:900, color:s.c }}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                          <div style={{ background:"#dcfce7", borderRadius:10, padding:"12px 14px", textAlign:"center", border:"1px solid #86efac" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:"#15803d", marginBottom:4 }}>✅ TAUX DE PARTICIPATION</div>
                            <div style={{ fontSize:30, fontWeight:900, color: tauxPart>=80?"#15803d":tauxPart>=60?"#d97706":"#ef4444", lineHeight:1 }}>{tauxPart}%</div>
                          </div>
                          <div style={{ background:"#fee2e2", borderRadius:10, padding:"12px 14px", textAlign:"center", border:"1px solid #fca5a5" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:"#b91c1c", marginBottom:4 }}>❌ TAUX D'ABSENTÉISME</div>
                            <div style={{ fontSize:30, fontWeight:900, color: tauxAbs<=10?"#15803d":tauxAbs<=25?"#d97706":"#ef4444", lineHeight:1 }}>{tauxAbs}%</div>
                          </div>
                        </div>
                        <div style={{ height:8, background:"#e5e7eb", borderRadius:999, overflow:"hidden" }}>
                          <div style={{ height:"100%", background: tauxPart>=80?"#22c55e":tauxPart>=60?"#f59e0b":"#ef4444", borderRadius:999, width:`${tauxPart}%`, transition:"width .4s" }} />
                        </div>
                        {sp.updated_at && (
                          <div style={{ marginTop:6, fontSize:10, color:"#9ca3af" }}>
                            Mis à jour le {new Date(sp.updated_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long" })} par le formateur
                          </div>
                        )}
                        {tauxAbs > 25 && (
                          <div style={{ marginTop:8, padding:"6px 10px", background:"#fff7ed", borderRadius:7, border:"1px solid #fed7aa", fontSize:11, color:"#c2410c", fontWeight:600 }}>
                            ⚠️ Taux d'absentéisme élevé — relance recommandée
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* ── Progression paiement ── */}
                <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px", border:"1px solid #e2e8f0" }}>
                  <div style={{ fontSize:10, fontWeight:800, color:"#374151", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>💰 Progression paiement</div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#6b7280", marginBottom:6 }}>
                    <span>{Number(totalReçu).toLocaleString("fr-FR")} F reçus sur {Number(totalDu).toLocaleString("fr-FR")} F dus</span>
                    <span style={{ fontWeight:700, color: pctPaiement===100?"#22c55e":"#d97706" }}>{pctPaiement}%</span>
                  </div>
                  <div style={{ height:8, background:"#e5e7eb", borderRadius:999, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:999, width:`${pctPaiement}%`, transition:"width .4s", background: pctPaiement===100?"#22c55e":pctPaiement>=50?"#0891b2":"#f59e0b" }} />
                  </div>
                </div>

                {/* ── Commentaire libre ── */}
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>📝 Notes de suivi (commercial)</label>
                  <textarea
                    value={prog.commentaire||""}
                    onChange={e=>setP("commentaire",e.target.value)}
                    rows={3}
                    placeholder="Observations, difficultés, points positifs, prochaines étapes…"
                    style={{ ...inputSt, margin:0, height:"auto", resize:"vertical" }}
                  />
                </div>

                <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                  <button onClick={()=>{ setShowProgressionModal(false); setProgressionTarget(null); }} style={btnSecondary}>Fermer</button>
                  <button
                    onClick={()=>{ toast.success("Notes de suivi enregistrées ✓"); }}
                    style={{ ...btnPrimary, background:"linear-gradient(135deg,#4c1d95,#7c3aed)" }}
                  >💾 Sauvegarder</button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL DOCUMENTS DOSSIER ══ */}
      {showDocDossierModal && docDossierTarget && (
        <DocDossierModal
          assignation={docDossierTarget}
          onSave={(docs) => handleSaveDocsDossier(docDossierTarget.id, docs)}
          onClose={() => { setShowDocDossierModal(false); setDocDossierTarget(null); }}
        />
      )}

      {/* ══ MODAL SUIVI DÉMARRAGE ══ */}
      {showSuiviModal && suiviTarget && (
        <SuiviDemarrageModal
          assignation={suiviTarget}
          onSave={(suivi) => handleSaveSuivi(suiviTarget.id, suivi)}
          onClose={() => { setShowSuiviModal(false); setSuiviTarget(null); }}
        />
      )}

      {/* ══ MODAL FINALISATION INSCRIPTION ══ */}
      {showFinalisationModal && finalisationTarget && (() => {
        const a    = finalisationTarget;
        const pmts = paiements.filter(p => p.assignationId === a.id);
        const totalDu   = pmts.reduce((s,p)=>s+(p.montantDu  ||0),0);
        const totalReçu = pmts.reduce((s,p)=>s+(p.montantReçu||0),0);
        const reste     = totalDu - totalReçu;
        const testLie   = tests.find(t => t.email && a.prospect_email && t.email.toLowerCase()===a.prospect_email.toLowerCase());
        const modeLabel = a.type_cours==="en_ligne" ? "En ligne" : `Présentiel${a.centre_nom?" · "+a.centre_nom:""}`;
        const coachLabel= a.type_coaching==="groupe" ? "Coaching groupe" : a.type_coaching==="prive" ? "Coaching privé" : "—";

        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:680, maxHeight:"92vh", overflowY:"auto", display:"flex", flexDirection:"column" }}>

              {/* Header */}
              <div style={{ background:"linear-gradient(135deg,#0f172a,#15803d)", padding:"20px 24px", borderRadius:"16px 16px 0 0", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
                <div>
                  <div style={{ fontSize:11, color:"#86efac", fontWeight:700, letterSpacing:".06em", marginBottom:4 }}>FINALISATION DE L'INSCRIPTION</div>
                  <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>🎓 {a.prospect_nom}</h2>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", marginTop:4 }}>{modeLabel} · {coachLabel}</div>
                </div>
                <button onClick={()=>{ setShowFinalisationModal(false); setFinalisationTarget(null); }} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:30, height:30, borderRadius:"50%", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>

              <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>

                {/* ── Récap prospect (lecture seule) ── */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {/* Identité */}
                  <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px", border:"1px solid #e2e8f0" }}>
                    <div style={{ fontSize:10, fontWeight:800, color:"#0891b2", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>👤 Prospect</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{a.prospect_nom||"—"}</div>
                    {a.prospect_email     && <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>✉ {a.prospect_email}</div>}
                    {a.prospect_telephone && <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>📞 {a.prospect_telephone}</div>}
                  </div>
                  {/* Test */}
                  <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px", border:"1px solid #e2e8f0" }}>
                    <div style={{ fontSize:10, fontWeight:800, color:"#7c3aed", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>📝 Test de niveau</div>
                    {testLie ? (
                      <>
                        <span style={{ fontWeight:800, fontSize:15, color:"#fff", background:{ A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" }[testLie.niveau]||"#6b7280", borderRadius:999, padding:"2px 12px" }}>{testLie.niveau}</span>
                        <span style={{ marginLeft:8, fontSize:12, color:"#6b7280" }}>{testLie.score}%</span>
                      </>
                    ) : <div style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic" }}>Non effectué</div>}
                  </div>
                </div>

                {/* Paiements */}
                <div style={{ borderRadius:10, border:`2px solid ${reste<=0?"#bbf7d0":"#fde68a"}`, overflow:"hidden" }}>
                  <div style={{ padding:"9px 14px", background:reste<=0?"#dcfce7":"#fef3c7", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13 }}>{reste<=0?"✅":"⚠️"}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:reste<=0?"#15803d":"#92400e" }}>
                      {reste<=0 ? "Paiement intégral confirmé" : `Paiement partiel — ${Number(reste).toLocaleString("fr-FR")} FCFA restants`}
                    </span>
                    <span style={{ marginLeft:"auto", fontSize:11, color:"#64748b" }}>{pmts.length} versement{pmts.length>1?"s":""}</span>
                  </div>
                  <div style={{ display:"flex", padding:"10px 14px", gap:0 }}>
                    {[{l:"Total dû",v:totalDu,c:"#0f172a"},{l:"Reçu",v:totalReçu,c:"#22c55e"},{l:"Reste",v:reste,c:reste>0?"#ef4444":"#22c55e"}].map((s,i,arr)=>(
                      <div key={s.l} style={{ flex:1, textAlign:"center", borderRight:i<arr.length-1?"1px solid #e2e8f0":"none" }}>
                        <div style={{ fontSize:10, color:"#94a3b8", marginBottom:3 }}>{s.l}</div>
                        <div style={{ fontSize:14, fontWeight:800, color:s.c }}>{Number(Math.max(0,s.v)).toLocaleString("fr-FR")} F</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Séparateur */}
                <div style={{ borderTop:"2px dashed #e2e8f0", paddingTop:4 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#0f172a", marginBottom:2 }}>📋 Informations de formation</div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>Complétez les détails ci-dessous pour finaliser l'inscription officielle.</div>
                </div>

                {/* Formulaire d'inscription intégré */}
                <InscriptionForm
                  initialData={{
                    client:     a.prospect_nom       || "",
                    contact:    a.prospect_nom       || "",
                    telephone:  a.prospect_telephone || "",
                    email:      a.prospect_email     || "",
                    offre:      testLie ? offreParNiveau(testLie.niveau) : "",
                    niveauTest: testLie?.niveau || "B1",
                    dateDebut:  "",
                    date:       new Date().toISOString().slice(0,10),
                    montant:    totalDu,
                    statut:     "confirmée",
                    apprenantConverti: false,
                    documents:  [],
                    notesAdmin: `Parcours BET · ${modeLabel} · ${coachLabel}${a.assistante_nom ? " · Assistante : "+a.assistante_nom : ""}`,
                  }}
                  onSave={(formData) => handleFinaliserInscription(a, formData)}
                  onCancel={() => { setShowFinalisationModal(false); setFinalisationTarget(null); }}
                  finalisationMode
                />

              </div>
            </div>
          </div>
        );
      })()}
      {showPaiementModal && (
        <Modal title={editingItem?.id ? "Modifier le paiement" : editingItem?.assignationId ? `💳 Paiement — ${editingItem.client}` : "Enregistrer un paiement"} onClose={() => { setShowPaiementModal(false); setEditingItem(null); }} wide>
          <PaiementForm initialData={editingItem} onSave={handleSavePaiement} onCancel={() => setShowPaiementModal(false)} apprenants={assignations.filter(a => a.statut === "converti")} />
        </Modal>
      )}
      {showDossierModal && (
        <Modal title={editingItem ? "Modifier le dossier" : "Ajouter un dossier"} onClose={() => { setShowDossierModal(false); setEditingItem(null); }}>
          <DossierForm initialData={editingItem} onSave={handleSaveDossier} onCancel={() => setShowDossierModal(false)} />
        </Modal>
      )}
      {showTestModal && (
        <Modal
          title={
            editingItem?.correction_statut === "en_attente"
              ? `✏️ Corriger le test ${editingItem?.format_test || ""} — ${editingItem?.prenom} ${editingItem?.nom}`
              : editingItem?.id
              ? "Modifier le test"
              : editingItem?.email
              ? "📝 Saisir résultat du test oral"
              : "Ajouter un test manuellement"
          }
          onClose={() => { setShowTestModal(false); setEditingItem(null); }}
        >
          <TestForm initialData={editingItem} onSave={handleSaveTest} onCancel={() => { setShowTestModal(false); setEditingItem(null); }} />
        </Modal>
      )}
      {/* ══ MODAL DÉTAIL TEST DE NIVEAU ══ */}
      {showTestDetailModal && selectedTest && (() => {
        const t = selectedTest;
        const scoreColor = t.score >= 70 ? "#22c55e" : t.score >= 50 ? "#f59e0b" : "#ef4444";
        const cats = Object.entries(t.by_category || {});
        const cefrs = Object.entries(t.by_cefr || {});
        const answers = Array.isArray(t.answers_details) ? t.answers_details : [];
        const audioAnswers = t.audio_answers || {};
        const hasAudio = Object.keys(audioAnswers).length > 0;
        const mins = Math.floor((t.time_taken_seconds||0)/60);
        const secs = (t.time_taken_seconds||0) % 60;
        const CAT_ICONS = { Grammaire:"📖", Vocabulaire:"💬", Compréhension:"🧠", Listening:"🎧", Speaking:"🎤", Writing:"✍️", Reading:"📚" };
        const CEFR_COLORS = { A1:"#94a3b8", A2:"#f59e0b", B1:"#1e3a8a", B2:"#7c3aed", C1:"#059669", C2:"#dc2626" };

        return (
          <Modal title={`🔍 Test de niveau — ${t.prenom} ${t.nom}`} onClose={() => { setShowTestDetailModal(false); setSelectedTest(null); }} wide>

            {/* ── Candidat + Score global ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
              <div style={{ padding:14, borderRadius:10, background:"#f0f9ff", border:"1px solid #bae6fd" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#0369a1", marginBottom:10 }}>👤 Candidat</div>
                {[
                  ["Nom",`${t.prenom} ${t.nom}`],
                  ["Email", t.email],
                  ["Téléphone", t.telephone||"—"],
                  ["Profil", t.profil],
                  ["Date", formatDate(t.date)],
                  ["Durée", `${mins}m ${secs}s`],
                  ["Réponses", `${t.correct_answers||0} / ${t.total_questions||0} correctes`],
                ].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:12 }}>
                    <span style={{ color:"#6b7280" }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding:14, borderRadius:10, background:"#f0fdf4", border:"1px solid #bbf7d0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <div style={{ fontSize:48, fontWeight:900, color:scoreColor, lineHeight:1 }}>{t.score}%</div>
                <div style={{ fontSize:22, fontWeight:800, color:BET_COLOR, margin:"6px 0 2px" }}>{t.niveau}</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:12 }}>Niveau CECRL</div>
                <div style={{ width:"100%", height:10, background:"#e5e7eb", borderRadius:5, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${t.score}%`, background:scoreColor, borderRadius:5 }} />
                </div>
                <div style={{ fontSize:11, color:"#6b7280", marginTop:6 }}>{t.points_earned} / {t.points_total} pts</div>
              </div>
            </div>

            {/* ── Scores par catégorie ── */}
            {cats.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>📊 Scores par compétence</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
                  {cats.map(([cat, val])=>{
                    const pct = val.total > 0 ? Math.round((val.earned/val.total)*100) : 0;
                    const c = pct>=70?"#22c55e":pct>=50?"#f59e0b":"#ef4444";
                    return (
                      <div key={cat} style={{ padding:"10px 12px", borderRadius:9, background:"#f8fafc", border:"1px solid #e5e7eb" }}>
                        <div style={{ fontSize:11, color:"#6b7280", marginBottom:4 }}>{CAT_ICONS[cat]||"•"} {cat}</div>
                        <div style={{ fontSize:18, fontWeight:800, color:c }}>{pct}%</div>
                        <div style={{ height:5, background:"#e5e7eb", borderRadius:3, marginTop:5 }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:c, borderRadius:3 }} />
                        </div>
                        <div style={{ fontSize:10, color:"#9ca3af", marginTop:4 }}>{val.earned}/{val.total} pts</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Scores par niveau CEFR ── */}
            {cefrs.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>🎯 Scores par niveau CECRL</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {cefrs.map(([lvl, val])=>{
                    const pct = val.total > 0 ? Math.round((val.earned/val.total)*100) : 0;
                    return (
                      <div key={lvl} style={{ padding:"8px 14px", borderRadius:8, background:"#f8fafc", border:`2px solid ${CEFR_COLORS[lvl]||"#e5e7eb"}`, minWidth:80, textAlign:"center" }}>
                        <div style={{ fontSize:15, fontWeight:800, color:CEFR_COLORS[lvl]||"#374151" }}>{lvl}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{pct}%</div>
                        <div style={{ fontSize:10, color:"#9ca3af" }}>{val.earned}/{val.total}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Enregistrements audio (Speaking) ── */}
            {hasAudio && (
              <div style={{ marginBottom:16, padding:14, borderRadius:10, background:"#fdf4ff", border:"1px solid #e9d5ff" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#7e22ce", marginBottom:10 }}>🎤 Réponses orales (Speaking)</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {Object.entries(audioAnswers).map(([qId, url])=>(
                    <div key={qId} style={{ background:"#fff", borderRadius:8, padding:"10px 14px", border:"1px solid #e9d5ff" }}>
                      <div style={{ fontSize:11, color:"#7e22ce", fontWeight:600, marginBottom:6 }}>Question #{qId}</div>
                      <audio controls src={url} style={{ width:"100%", height:36 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Détail des réponses par question ── */}
            {answers.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>📋 Détail question par question</div>
                <div style={{ maxHeight:280, overflowY:"auto", border:"1px solid #e5e7eb", borderRadius:10 }}>
                  {answers.map((a, idx)=>{
                    const isAudio = a.user_answer === "[audio]";
                    const audioUrl = isAudio ? audioAnswers[a.question_id] : null;
                    return (
                      <div key={idx} style={{ padding:"10px 14px", borderBottom:"1px solid #f1f5f9", background: a.is_correct ? "#f0fdf4" : "#fff8f8" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                              <span style={{ fontSize:10, fontWeight:700, color:"#6b7280" }}>Q{a.question_id}</span>
                              <span style={{ fontSize:10, padding:"1px 7px", borderRadius:99, background:"#f0f9ff", color:"#0369a1", fontWeight:600 }}>{CAT_ICONS[a.category]||""} {a.category}</span>
                              <span style={{ fontSize:10, padding:"1px 7px", borderRadius:99, background:"#f8fafc", color:CEFR_COLORS[a.cefr]||"#6b7280", fontWeight:700, border:`1px solid ${CEFR_COLORS[a.cefr]||"#e5e7eb"}` }}>{a.cefr}</span>
                            </div>
                            {isAudio && audioUrl ? (
                              <audio controls src={audioUrl} style={{ width:"100%", height:32, marginTop:4 }} />
                            ) : (
                              <div style={{ fontSize:12 }}>
                                <span style={{ color:"#6b7280" }}>Réponse : </span>
                                <span style={{ fontWeight:600, color: a.is_correct ? "#15803d" : "#dc2626" }}>{a.user_answer || "—"}</span>
                                {!a.is_correct && a.correct_answer && (
                                  <span style={{ color:"#6b7280", marginLeft:8 }}>→ <span style={{ fontWeight:600, color:"#15803d" }}>{a.correct_answer}</span></span>
                                )}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize:18, flexShrink:0 }}>{a.is_correct ? "✅" : "❌"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Offre recommandée ── */}
            <div style={{ padding:12, borderRadius:9, background:"#fef9ee", border:"1px solid #fde68a", marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#92400e", marginBottom:6 }}>💡 Offre conseillée</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>📚 {t.offreRecommandee||"à déterminer"}</div>
            </div>

            {t.notes && <div style={{ padding:"10px 14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e5e7eb", fontSize:12, color:"#374151", marginBottom:14 }}>📝 {t.notes}</div>}

            <div style={{ display:"flex", gap:10 }}>
              {t.statut !== "converti" && t.statut !== "archivé" && (
                <button onClick={() => { convertirTestEnLead(t); setShowTestDetailModal(false); }} style={{ ...btnPrimary, background:"#22c55e" }}>→ Convertir en Lead</button>
              )}
              <button onClick={() => { setEditingItem(t); setShowTestModal(true); setShowTestDetailModal(false); }} style={btnSecondary}>✏️ Modifier</button>
              <button onClick={() => setShowTestDetailModal(false)} style={btnSecondary}>Fermer</button>
            </div>
          </Modal>
        );
      })()}

      {/* ══ MODAL DÉTAIL INSCRIPTION ══ */}
      {showInscDetailModal && selectedInscription && (
        <Modal title={`📋 Dossier inscription — ${selectedInscription.client}`} onClose={() => { setShowInscDetailModal(false); setSelectedInscription(null); }} wide>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
            <div style={{ padding:14, borderRadius:10, background:"#f0f9ff", border:"1px solid #bae6fd" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#0369a1", marginBottom:10 }}>👤 Coordonnées client</div>
              {[["Client/Entreprise",selectedInscription.client],["Contact",selectedInscription.contact||"—"],["Téléphone",selectedInscription.telephone||"—"],["Email",selectedInscription.email||"—"]].map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12 }}><span style={{ color:"#6b7280" }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span></div>
              ))}
            </div>
            <div style={{ padding:14, borderRadius:10, background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#15803d", marginBottom:10 }}>📚 Formation</div>
              {[["Offre",selectedInscription.offre],["Niveau testé",selectedInscription.niveauTest||"—"],["Date début",selectedInscription.dateDebut?formatDate(selectedInscription.dateDebut):"—"],["Montant",formatMoney(selectedInscription.montant)],["Statut",selectedInscription.statut]].map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12 }}><span style={{ color:"#6b7280" }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span></div>
              ))}
            </div>
          </div>
          {/* Documents */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>📎 Documents du dossier</div>
            {selectedInscription.documents && selectedInscription.documents.length > 0 ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8 }}>
                {selectedInscription.documents.map((doc,di)=>{
                  const typeIcons = { devis:"📄", bc:"🧾", id:"🪪", photo:"📷", fiche:"📋" };
                  const ic = typeIcons[doc.type]||"📎";
                  return (
                    <div key={di} style={{ padding:"10px 12px", borderRadius:8, background:"#f8fafc", border:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span style={{ fontSize:20 }}>{ic}</span>
                        <span style={{ fontSize:11, fontWeight:600, color:"#374151" }}>{doc.nom}</span>
                      </div>
                      <button onClick={() => telechargerDocument(doc, selectedInscription.client)} style={{ padding:"3px 8px", background:"#0891b2", color:"#fff", border:"none", borderRadius:4, cursor:"pointer", fontSize:10 }}>⬇️</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding:12, borderRadius:8, background:"#fef9ee", border:"1px dashed #fde68a", fontSize:12, color:"#92400e", textAlign:"center" }}>Aucun document joint — modifiez le dossier pour en ajouter</div>
            )}
          </div>
          {selectedInscription.notesAdmin && <div style={{ padding:"10px 14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e5e7eb", fontSize:12, marginBottom:14 }}>📝 {selectedInscription.notesAdmin}</div>}
          <div style={{ display:"flex", gap:10 }}>
            {!selectedInscription.apprenantConverti && selectedInscription.statut==="confirmée" && (
              <button onClick={() => { convertirEnApprenant(selectedInscription); setShowInscDetailModal(false); }} style={{ ...btnPrimary, background:"#7c3aed" }}>🎓 Convertir → Apprenant BET</button>
            )}
            {selectedInscription.apprenantConverti && <span style={{ padding:"9px 14px", background:"#f3e8ff", color:"#7c3aed", borderRadius:6, fontSize:12, fontWeight:700 }}>✅ Déjà converti en Apprenant BET</span>}
            <button onClick={() => setShowInscDetailModal(false)} style={btnSecondary}>Fermer</button>
          </div>
        </Modal>
      )}

      {showPlanifModal && (
        <Modal title="Planifier l'envoi automatique de rapports" onClose={() => setShowPlanifModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div><label style={labelSt}>Fréquence</label>
              <select value={planifConfig.frequence} onChange={e=>setPlanifConfig({...planifConfig,frequence:e.target.value})} style={inputSt}>
                <option value="hebdomadaire">Hebdomadaire</option><option value="mensuel">Mensuel</option>
              </select>
            </div>
            <div><label style={labelSt}>Emails destinataires (séparés par virgules)</label>
              <input value={planifConfig.emails} onChange={e=>setPlanifConfig({...planifConfig,emails:e.target.value})} placeholder="manager@bet.com, direction@bet.ci" style={inputSt} />
            </div>
            <div><label style={labelSt}>Format</label>
              <select value={planifConfig.format} onChange={e=>setPlanifConfig({...planifConfig,format:e.target.value})} style={inputSt}>
                <option value="pdf">PDF</option><option value="excel">Excel (CSV)</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:10 }}>
              <button onClick={()=>setShowPlanifModal(false)} style={btnSecondary}>Annuler</button>
              <button onClick={handlePlanifierEnvoi} style={btnPrimary}>Enregistrer</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ PANNEAU CHAT PROSPECT (flottant) ══ */}
      {chatAssignation && (
        <ProspectChatPanel
          assignationId={chatAssignation.id}
          profil={profil}
          assignation={chatAssignation}
          onClose={() => setChatAssignation(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FORMULAIRES CRUD
═══════════════════════════════════════════════════════ */
// const BET_COLOR_F = "#0891b2";
const OFFRE_LIST_F = ["Anglais Pro B2","Business English","Certification TOEIC","Anglais Enfant","Formation Entreprise"];

const LeadForm = ({ initialData, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || { client:"",contact:"",email:"",source:"Site web",statut:"qualifié",date:new Date().toISOString().slice(0,10),montantPotentiel:0,notes:"" });
  return (
    <div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Client *</label><input style={inputSt} value={form.client} onChange={e=>setForm({...form,client:e.target.value})} required /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Contact</label><input style={inputSt} value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Email</label><input type="email" style={inputSt} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Source</label>
        <select style={inputSt} value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>
          <option>Site web</option><option>Recommandation</option><option>Salon</option><option>Emailing</option><option>Test de niveau</option>
        </select>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Statut</label>
        <select style={inputSt} value={form.statut} onChange={e=>setForm({...form,statut:e.target.value})}>
          <option value="qualifié">Qualifié</option><option value="en_cours">En cours</option><option value="converti">Converti</option><option value="perdu">Perdu</option>
        </select>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Date</label><input type="date" style={inputSt} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Montant potentiel (FCFA)</label><input type="number" style={inputSt} value={form.montantPotentiel} onChange={e=>setForm({...form,montantPotentiel:Number(e.target.value)})} /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Notes</label><textarea style={{ ...inputSt, height:60 }} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}><button onClick={onCancel} style={btnSecondary}>Annuler</button><button onClick={() => onSave(form)} style={btnPrimary}>Enregistrer</button></div>
    </div>
  );
};

const DevisForm = ({ initialData, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || { client:"",offre:"",montant:0,date:new Date().toISOString().slice(0,10),statut:"envoyé",validite:"" });
  return (
    <div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Client *</label><input style={inputSt} value={form.client} onChange={e=>setForm({...form,client:e.target.value})} required /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Offre</label>
        <select style={inputSt} value={form.offre} onChange={e=>setForm({...form,offre:e.target.value})}>
          <option value="">– Choisir –</option>{OFFRE_LIST_F.map(o=><option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Montant (FCFA)</label><input type="number" style={inputSt} value={form.montant} onChange={e=>setForm({...form,montant:Number(e.target.value)})} /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Date</label><input type="date" style={inputSt} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Statut</label>
        <select style={inputSt} value={form.statut} onChange={e=>setForm({...form,statut:e.target.value})}>
          <option value="envoyé">Envoyé</option><option value="accepté">Accepté</option><option value="relancé">Relancé</option><option value="refusé">Refusé</option>
        </select>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Date de validité</label><input type="date" style={inputSt} value={form.validite} onChange={e=>setForm({...form,validite:e.target.value})} /></div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}><button onClick={onCancel} style={btnSecondary}>Annuler</button><button onClick={() => onSave(form)} style={btnPrimary}>Enregistrer</button></div>
    </div>
  );
};

const DOC_TYPES = [
  { key:"devis",  label:"Devis signé",          icon:"📄" },
  { key:"bc",     label:"Bon de commande",       icon:"🧾" },
  { key:"id",     label:"Pièce d'identité",      icon:"🪪" },
  { key:"photo",  label:"Photo d'identité",      icon:"📷" },
  { key:"fiche",  label:"Fiche de renseignement",icon:"📋" },
  { key:"autre",  label:"Autre document",        icon:"📎" },
];

const InscriptionForm = ({ initialData, onSave, onCancel, finalisationMode }) => {
  const [form, setForm] = useState(initialData || {
    client:"", contact:"", telephone:"", email:"", offre:"", niveauTest:"B1",
    dateDebut:"", date:new Date().toISOString().slice(0,10), montant:0,
    statut:"confirmée", apprenantConverti:false, documents:[], notesAdmin:""
  });
  const [uploadingType, setUploadingType] = useState("");
  const [uploadingName, setUploadingName] = useState("");

  const addDocument = () => {
    if (!uploadingType) return;
    const docDef = DOC_TYPES.find(d=>d.key===uploadingType);
    const nom = uploadingName.trim() || docDef?.label || uploadingType;
    if (form.documents.find(d=>d.type===uploadingType && d.nom===nom)) return;
    setForm(f=>({ ...f, documents:[...f.documents, { nom, type:uploadingType }] }));
    setUploadingType(""); setUploadingName("");
  };

  const rdOnly = { ...inputSt, background:"#f8fafc", color:"#64748b", cursor:"not-allowed" };

  return (
    <div>
      {/* Coordonnées — lecture seule en mode finalisation */}
      <div style={{ fontSize:12, fontWeight:700, color:"#0369a1", marginBottom:10, padding:"8px 12px", background:"#f0f9ff", borderRadius:8, display:"flex", alignItems:"center", gap:8 }}>
        👤 Coordonnées client {finalisationMode && <span style={{ fontSize:10, color:"#94a3b8", fontWeight:400 }}>· pré-remplies depuis le profil prospect</span>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
        <div><label style={labelSt}>Client / Entreprise *</label><input style={finalisationMode?rdOnly:inputSt} value={form.client} onChange={e=>setForm({...form,client:e.target.value})} readOnly={finalisationMode} required /></div>
        <div><label style={labelSt}>Nom du contact</label><input style={finalisationMode?rdOnly:inputSt} value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} readOnly={finalisationMode} /></div>
        <div><label style={labelSt}>Téléphone</label><input style={finalisationMode?rdOnly:inputSt} value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+225 07 XX XX XX" readOnly={finalisationMode} /></div>
        <div><label style={labelSt}>Email</label><input type="email" style={finalisationMode?rdOnly:inputSt} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} readOnly={finalisationMode} /></div>
      </div>

      <div style={{ fontSize:12, fontWeight:700, color:"#15803d", margin:"14px 0 10px", padding:"8px 12px", background:"#f0fdf4", borderRadius:8 }}>📚 Formation</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
        <div><label style={labelSt}>Offre choisie *</label>
          <select style={inputSt} value={form.offre} onChange={e=>setForm({...form,offre:e.target.value})}>
            <option value="">– Choisir –</option>{OFFRE_LIST_F.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <div><label style={labelSt}>Niveau CECRL</label>
          <select style={inputSt} value={form.niveauTest} onChange={e=>setForm({...form,niveauTest:e.target.value})}>
            {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n}>{n}</option>)}
          </select>
        </div>
        <div><label style={labelSt}>Date d'inscription</label><input type="date" style={inputSt} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
        <div><label style={labelSt}>Date de début formation *</label><input type="date" style={inputSt} value={form.dateDebut} onChange={e=>setForm({...form,dateDebut:e.target.value})} /></div>
        <div><label style={labelSt}>Montant (FCFA)</label><input type="number" style={inputSt} value={form.montant} onChange={e=>setForm({...form,montant:Number(e.target.value)})} /></div>
        <div><label style={labelSt}>Statut</label>
          <select style={inputSt} value={form.statut} onChange={e=>setForm({...form,statut:e.target.value})}>
            <option value="confirmée">Confirmée</option><option value="en_attente">En attente</option>
          </select>
        </div>
      </div>

      <div style={{ fontSize:12, fontWeight:700, color:"#7c3aed", margin:"14px 0 10px", padding:"8px 12px", background:"#faf5ff", borderRadius:8 }}>📎 Documents du dossier</div>
      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <select value={uploadingType} onChange={e=>setUploadingType(e.target.value)} style={{ ...inputSt, flex:1 }}>
          <option value="">— Type de document —</option>
          {DOC_TYPES.map(d=><option key={d.key} value={d.key}>{d.icon} {d.label}</option>)}
        </select>
        <input value={uploadingName} onChange={e=>setUploadingName(e.target.value)} style={{ ...inputSt, flex:1 }} placeholder="Nom personnalisé (optionnel)" />
        <button onClick={addDocument} style={{ ...btnPrimary, padding:"9px 14px" }}>+ Ajouter</button>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {form.documents.map((doc,i)=>(
          <span key={i} style={{ fontSize:11, background:"#e0f2fe", color:"#0369a1", padding:"4px 10px", borderRadius:6, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
            {DOC_TYPES.find(d=>d.key===doc.type)?.icon||"📎"} {doc.nom}
            <button onClick={()=>setForm(f=>({...f,documents:f.documents.filter((_,j)=>j!==i)}))} style={{ background:"none", border:"none", cursor:"pointer", color:"#dc2626", fontSize:12, padding:0 }}>✕</button>
          </span>
        ))}
        {form.documents.length===0 && <span style={{ fontSize:11, color:"#9ca3af", fontStyle:"italic" }}>Aucun document ajouté</span>}
      </div>

      <div style={{ marginBottom:14 }}><label style={labelSt}>Notes administratives</label><textarea style={{ ...inputSt, height:60 }} value={form.notesAdmin} onChange={e=>setForm({...form,notesAdmin:e.target.value})} placeholder="Remarques, conditions particulières…"/></div>

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={btnSecondary}>Annuler</button>
        <button
          onClick={() => {
            if (!form.offre) { alert("Veuillez choisir une offre de formation."); return; }
            if (!form.dateDebut) { alert("Veuillez indiquer la date de début de la formation."); return; }
            onSave(form);
          }}
          style={finalisationMode
            ? { ...btnPrimary, background:"linear-gradient(135deg,#15803d,#22c55e)", padding:"10px 22px", fontSize:13 }
            : btnPrimary
          }
        >
          {finalisationMode ? "🎓 Valider & convertir en apprenant" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
};

const PROOF_MODES = new Set(["Chèque","RIA","MoneyGram","Western Union","Virement bancaire"]);

const PaiementForm = ({ initialData, onSave, onCancel, apprenants = [] }) => {
  const [form, setForm] = useState(initialData || { client:"",email:"",telephone:"",inscription:"",montantDu:0,montantReçu:0,date:new Date().toISOString().slice(0,10),mode:"Mobile Money",statut:"en_attente",notes:"",refTransaction:"",assignationId:null,preuveImage:null });
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleProofUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert("Fichier trop volumineux (max 8 Mo)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => f("preuveImage", ev.target.result);
    reader.readAsDataURL(file);
  };

  const isFromProspect = !!form.assignationId;

  const selectApprenant = (id) => {
    if (!id) { setForm(prev => ({ ...prev, assignationId:null, client:"", email:"", telephone:"", inscription:"", montantDu:0 })); return; }
    const a = apprenants.find(x => x.id === id);
    if (!a) return;
    const ml = a.type_cours==="en_ligne"?"En ligne":`Présentiel${a.centre_nom?" · "+a.centre_nom:""}`;
    const tl = a.type_coaching==="groupe"?"Coaching groupe":a.type_coaching==="prive"?"Coaching privé":"Formation";
    setForm(prev => ({ ...prev, assignationId:a.id, client:a.prospect_nom||"", email:a.prospect_email||"", telephone:a.prospect_telephone||"", inscription:`Parcours BET · ${ml} · ${tl}` }));
  };

  return (
    <div>
      {/* Sélecteur apprenant — uniquement pour un nouveau paiement sans apprenant pré-lié */}
      {!initialData?.assignationId && apprenants.length > 0 && (
        <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#15803d", marginBottom:6 }}>🎓 Lier à un apprenant (optionnel)</div>
          <select
            value={form.assignationId || ""}
            onChange={e => selectApprenant(e.target.value)}
            style={{ ...inputSt, margin:0, width:"100%" }}
          >
            <option value="">— Paiement libre (sans apprenant lié) —</option>
            {apprenants.map(a => (
              <option key={a.id} value={a.id}>{a.prospect_nom}{a.prospect_email ? ` · ${a.prospect_email}` : ""}</option>
            ))}
          </select>
        </div>
      )}

      {/* Bloc apprenant/prospect lié */}
      {isFromProspect && (
        <div style={{ background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:"1.3rem" }}>🎯</span>
          <div>
            <div style={{ fontWeight:700, fontSize:12, color:"#92400e" }}>Paiement lié à un apprenant parcours</div>
            <div style={{ fontSize:11, color:"#b45309", marginTop:2 }}>
              {form.client}{form.email ? ` · ${form.email}` : ""}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div style={{ marginBottom:12 }}><label style={labelSt}>Client *</label><input style={inputSt} value={form.client} onChange={e=>f("client",e.target.value)} required /></div>
        <div style={{ marginBottom:12 }}><label style={labelSt}>Téléphone</label><input style={inputSt} value={form.telephone||""} onChange={e=>f("telephone",e.target.value)} placeholder="+225 07 XX XX XX" /></div>
      </div>

      <div style={{ marginBottom:12 }}><label style={labelSt}>Email client</label><input type="email" style={inputSt} value={form.email} onChange={e=>f("email",e.target.value)} placeholder="exemple@email.com" /></div>

      <div style={{ marginBottom:12 }}><label style={labelSt}>Formation / Parcours</label><input style={inputSt} value={form.inscription} onChange={e=>f("inscription",e.target.value)} placeholder="Ex: Parcours BET · En ligne · Coaching groupe" /></div>

      {/* Montants */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:10 }}>💰 Montants</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={labelSt}>Montant total dû (FCFA)</label>
            <input type="number" style={inputSt} value={form.montantDu} onChange={e=>f("montantDu",Number(e.target.value))} min={0} />
          </div>
          <div>
            <label style={labelSt}>Montant reçu (FCFA)</label>
            <input type="number" style={inputSt} value={form.montantReçu} onChange={e=>f("montantReçu",Number(e.target.value))} min={0} />
          </div>
        </div>
        {(form.montantDu > 0 || form.montantReçu > 0) && (
          <div style={{ marginTop:10, padding:"8px 12px", background: form.montantReçu >= form.montantDu ? "#f0fdf4" : "#fef3c7", borderRadius:8, fontSize:12, fontWeight:700, color: form.montantReçu >= form.montantDu ? "#15803d" : "#d97706" }}>
            {form.montantReçu >= form.montantDu
              ? `✅ Paiement complet — ${Number(form.montantReçu).toLocaleString("fr-FR")} FCFA reçu`
              : `⏳ Reste à payer : ${Number(form.montantDu - form.montantReçu).toLocaleString("fr-FR")} FCFA`
            }
          </div>
        )}
      </div>

      {/* Détails du paiement */}
      <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#0369a1", marginBottom:10 }}>📱 Détails du paiement</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={labelSt}>Mode de paiement</label>
            <select style={inputSt} value={form.mode} onChange={e=>{ f("mode",e.target.value); if (!PROOF_MODES.has(e.target.value)) f("preuveImage",null); }}>
              <option>Mobile Money (MTN)</option>
              <option>Orange Money</option>
              <option>Wave</option>
              <option>CinetPay</option>
              <option>Espèces</option>
              <option>Carte bancaire</option>
              <option>Chèque</option>
              <option>Virement bancaire</option>
              <option>RIA</option>
              <option>MoneyGram</option>
              <option>Western Union</option>
            </select>
          </div>
          <div>
            <label style={labelSt}>Date de réception</label>
            <input type="date" style={inputSt} value={form.date} onChange={e=>f("date",e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop:10 }}>
          <label style={labelSt}>🔖 Référence de transaction</label>
          <input
            style={{ ...inputSt, fontFamily:"monospace", letterSpacing:".05em" }}
            value={form.refTransaction}
            onChange={e=>f("refTransaction",e.target.value)}
            placeholder="Ex : TXN-123456789, OCI-20240511-0099…"
          />
          <div style={{ fontSize:10, color:"#64748b", marginTop:4 }}>Numéro fourni par Orange Money, Wave, CinetPay, etc.</div>
        </div>

        {/* Preuve de paiement — obligatoire pour chèque / transfert physique */}
        {PROOF_MODES.has(form.mode) && (
          <div style={{ marginTop:12, background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:8, padding:"10px 12px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#92400e", marginBottom:8 }}>
              📸 Preuve de paiement <span style={{ fontWeight:400, color:"#b45309" }}>({form.mode} — justificatif requis)</span>
            </div>
            {form.preuveImage ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <img
                  src={form.preuveImage}
                  alt="Preuve de paiement"
                  style={{ maxWidth:"100%", maxHeight:200, objectFit:"contain", borderRadius:6, border:"1px solid #fde68a", background:"#fff" }}
                />
                <div style={{ display:"flex", gap:8 }}>
                  <span style={{ fontSize:10, color:"#15803d", fontWeight:700 }}>✅ Document chargé</span>
                  <button
                    type="button"
                    onClick={() => f("preuveImage", null)}
                    style={{ fontSize:10, color:"#dc2626", background:"none", border:"none", cursor:"pointer", fontWeight:700, padding:0 }}
                  >✕ Supprimer</button>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display:"block", cursor:"pointer", background:"#fff", border:"1.5px dashed #fcd34d", borderRadius:6, padding:"12px", textAlign:"center" }}>
                  <input type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={handleProofUpload} />
                  <div style={{ fontSize:22, marginBottom:4 }}>📎</div>
                  <div style={{ fontSize:11, color:"#d97706", fontWeight:700 }}>Cliquer pour uploader la photo du reçu</div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>JPG, PNG, PDF — max 8 Mo</div>
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={labelSt}>Statut</label>
        <select style={inputSt} value={form.statut} onChange={e=>f("statut",e.target.value)}>
          <option value="en_attente">⏳ En attente de confirmation</option>
          <option value="partiel">🔄 Paiement partiel</option>
          <option value="reçu">✅ Paiement reçu / confirmé</option>
          <option value="remboursé">↩️ Remboursé</option>
        </select>
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={labelSt}>Notes internes</label>
        <textarea style={{ ...inputSt, height:52 }} value={form.notes} onChange={e=>f("notes",e.target.value)} placeholder="Remarques, informations complémentaires…" />
      </div>

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={btnSecondary}>Annuler</button>
        <button onClick={() => onSave(form)} style={btnPrimary}>💾 Enregistrer le paiement</button>
      </div>
    </div>
  );
};

const DocDossierModal = ({ assignation: a, onSave, onClose }) => {
  const [docs,      setDocs]      = useState(a.documents_dossier ? [...a.documents_dossier] : []);
  const [upType,    setUpType]    = useState("");
  const [upNom,     setUpNom]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving,    setSaving]    = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!upType) { toast.error("Choisissez d'abord le type de document"); e.target.value = ""; return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Fichier trop volumineux (max 20 Mo)"); e.target.value = ""; return; }

    setUploading(true); setUploadPct(10);
    try {
      const def = DOC_TYPES.find(d => d.key === upType);
      const nom = upNom.trim() || def?.label || upType;

      const formData = new FormData();
      formData.append("file", file);

      setUploadPct(40);
      const res = await fetch(`${API_URL}/api/upload/dossier`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
        body: formData,
      });
      const rawText = await res.text();
      if (!res.ok) {
        let msg = `Erreur ${res.status}`;
        try { msg = JSON.parse(rawText).error || msg; } catch { msg = rawText.slice(0, 200); }
        throw new Error(msg);
      }
      const { file: uploaded } = JSON.parse(rawText);
      setUploadPct(90);

      setDocs(prev => [...prev, {
        nom,
        type:       upType,
        url:        uploaded.url,
        public_id:  uploaded.public_id,
        taille:     uploaded.size || file.size,
        mimetype:   file.type,
      }]);
      setUpType(""); setUpNom("");
      toast.success(`${def?.icon || "📎"} ${nom} ajouté`);
    } catch (err) {
      toast.error("Erreur lors de l'upload : " + (err.message || "réessayez"));
    } finally {
      setUploading(false); setUploadPct(0);
      e.target.value = "";
    }
  };

  const removeDoc = async (i) => {
    const doc = docs[i];
    if (doc.public_id) {
      const rt = doc.mimetype?.startsWith("image/") ? "image" : "raw";
      fetch(`${API_URL}/api/upload/delete?public_id=${encodeURIComponent(doc.public_id)}&resource_type=${rt}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      }).catch(() => {});
    }
    setDocs(prev => prev.filter((_, j) => j !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(docs);
    setSaving(false);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(0)} Ko`;
    return `${(bytes/(1024*1024)).toFixed(1)} Mo`;
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:560, display:"flex", flexDirection:"column", maxHeight:"92vh", overflowY:"auto" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#4c1d95,#7c3aed)", padding:"18px 22px", borderRadius:"16px 16px 0 0", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:10, color:"#ddd6fe", fontWeight:700, letterSpacing:".06em", marginBottom:3 }}>DOSSIER APPRENANT</div>
            <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>📎 Documents — {a.prospect_nom}</h3>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:3 }}>{docs.length} document{docs.length !== 1 ? "s" : ""} dans le dossier</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:28, height:28, borderRadius:"50%", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ padding:"18px 22px", display:"flex", flexDirection:"column", gap:14 }}>

          {/* Liste des documents */}
          {docs.length === 0 ? (
            <div style={{ textAlign:"center", padding:"28px 0", color:"#94a3b8", fontSize:12, fontStyle:"italic" }}>
              Aucun document dans le dossier.<br/>Ajoutez des fichiers ci-dessous.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {docs.map((doc, i) => {
                const def = DOC_TYPES.find(d => d.key === doc.type);
                const isImage = doc.mimetype?.startsWith("image/");
                return (
                  <div key={i} style={{ background:"#faf5ff", borderRadius:10, border:"1px solid #e9d5ff", overflow:"hidden" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px" }}>
                      <span style={{ fontSize:22, flexShrink:0 }}>{def?.icon || "📎"}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#4c1d95", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.nom}</div>
                        <div style={{ fontSize:10, color:"#9ca3af", marginTop:1 }}>
                          {def?.label || doc.type}{doc.taille ? ` · ${formatSize(doc.taille)}` : ""}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:6, border:"1px solid #ddd6fe", background:"#ede9fe", color:"#6d28d9", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}
                          >
                            {isImage ? "🔍 Voir" : "⬇️ Télécharger"}
                          </a>
                        )}
                        <button
                          onClick={() => removeDoc(i)}
                          style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:6, border:"1px solid #fecaca", background:"#fee2e2", color:"#dc2626", cursor:"pointer" }}
                        >✕ Retirer</button>
                      </div>
                    </div>
                    {/* Aperçu image inline */}
                    {isImage && doc.url && (
                      <div style={{ borderTop:"1px solid #e9d5ff", padding:"0 12px 10px" }}>
                        <img
                          src={doc.url}
                          alt={doc.nom}
                          style={{ maxWidth:"100%", maxHeight:120, objectFit:"contain", borderRadius:6, marginTop:8, background:"#fff", border:"1px solid #e9d5ff" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Zone d'upload */}
          <div style={{ background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0", padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:12 }}>➕ Ajouter un fichier</div>

            {/* Type + nom personnalisé */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:600, color:"#6b7280", display:"block", marginBottom:4 }}>Type de document *</label>
                <select value={upType} onChange={e => setUpType(e.target.value)} style={{ ...inputSt, margin:0 }}>
                  <option value="">— Choisir —</option>
                  {DOC_TYPES.map(d => <option key={d.key} value={d.key}>{d.icon} {d.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:600, color:"#6b7280", display:"block", marginBottom:4 }}>Nom personnalisé</label>
                <input
                  value={upNom}
                  onChange={e => setUpNom(e.target.value)}
                  placeholder="Ex : CNI de Jean Koné"
                  style={{ ...inputSt, margin:0 }}
                />
              </div>
            </div>

            {/* Zone de sélection fichier */}
            {uploading ? (
              <div style={{ textAlign:"center", padding:"16px 0" }}>
                <div style={{ fontSize:12, color:"#7c3aed", fontWeight:700, marginBottom:8 }}>Upload en cours… {uploadPct}%</div>
                <div style={{ height:6, background:"#e9d5ff", borderRadius:999, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${uploadPct}%`, background:"#7c3aed", borderRadius:999, transition:"width .3s" }} />
                </div>
              </div>
            ) : (
              <label style={{
                display:"block", cursor: upType ? "pointer" : "not-allowed",
                background: upType ? "#fff" : "#f1f5f9",
                border:`2px dashed ${upType ? "#a78bfa" : "#cbd5e1"}`,
                borderRadius:8, padding:"18px", textAlign:"center",
              }}>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                  style={{ display:"none" }}
                  disabled={!upType || uploading}
                  onChange={handleFileSelect}
                />
                <div style={{ fontSize:28, marginBottom:6 }}>📂</div>
                <div style={{ fontSize:12, fontWeight:700, color: upType ? "#7c3aed" : "#94a3b8" }}>
                  {upType ? "Cliquer pour choisir un fichier" : "Choisissez d'abord le type de document"}
                </div>
                <div style={{ fontSize:10, color:"#9ca3af", marginTop:4 }}>PDF · JPG · PNG · Word · Excel — max 20 Mo</div>
              </label>
            )}
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", borderTop:"1px solid #f1f5f9", paddingTop:14 }}>
            <button onClick={onClose} style={btnSecondary}>Fermer sans sauvegarder</button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              style={{ ...btnPrimary, background:"linear-gradient(135deg,#4c1d95,#7c3aed)", opacity: (saving || uploading) ? 0.7 : 1 }}
            >
              {saving ? "Enregistrement…" : "💾 Sauvegarder le dossier"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   SUIVI DÉMARRAGE MODAL
═══════════════════════════════════════════════════════ */
const SUIVI_STEPS_DEFAULT = [
  { id: "acces_plateforme",   label: "Accès plateforme créé et envoyé",        icon: "🔐" },
  { id: "test_niveau",        label: "Test de niveau effectué",                 icon: "📝" },
  { id: "coach_assigne",      label: "Coach / formateur assigné",               icon: "👩‍🏫" },
  { id: "planning_envoye",    label: "Planning de cours communiqué",            icon: "📅" },
  { id: "premier_cours",      label: "Premier cours effectué",                  icon: "🎓" },
  { id: "materiel_partage",   label: "Matériel pédagogique partagé",            icon: "📚" },
  { id: "contact_etabli",     label: "Contact WhatsApp / e-mail établi",        icon: "💬" },
  { id: "groupe_whatsapp",    label: "Groupe WhatsApp rejoint",                 icon: "📲" },
  { id: "dossier_complet",    label: "Documents dossier complets",              icon: "📎" },
  { id: "premier_paiement",   label: "Premier paiement reçu",                  icon: "💳" },
];

const SuiviDemarrageModal = ({ assignation: a, onSave, onClose }) => {
  const existing = a.suivi_demarrage || {};
  const initSteps = SUIVI_STEPS_DEFAULT.map(def => {
    const saved = (existing.steps || []).find(s => s.id === def.id);
    return { ...def, done: saved?.done || false, date: saved?.date || null, note: saved?.note || "" };
  });

  const [steps,   setSteps]   = useState(initSteps);
  const [notes,   setNotes]   = useState(existing.notes_generales || "");
  const [saving,  setSaving]  = useState(false);
  const [noteOpen, setNoteOpen] = useState(null);

  const toggle = (id) => setSteps(prev => prev.map(s =>
    s.id === id ? { ...s, done: !s.done, date: !s.done ? new Date().toISOString().slice(0, 10) : null } : s
  ));

  const setNote = (id, val) => setSteps(prev => prev.map(s => s.id === id ? { ...s, note: val } : s));

  const done  = steps.filter(s => s.done).length;
  const total = steps.length;
  const pct   = Math.round((done / total) * 100);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ steps: steps.map(s => ({ id: s.id, done: s.done, date: s.date, note: s.note })), notes_generales: notes });
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:560, maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#15803d)", padding:"18px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginBottom:3 }}>Suivi de démarrage</div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>🚀 {a.prospect_nom}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:30, height:30, borderRadius:"50%", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* Barre de progression */}
        <div style={{ padding:"14px 22px 10px", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{done}/{total} étapes complétées</span>
            <span style={{ fontSize:12, fontWeight:800, color: pct===100 ? "#15803d" : "#d97706" }}>{pct}%</span>
          </div>
          <div style={{ background:"#e5e7eb", borderRadius:999, height:8, overflow:"hidden" }}>
            <div style={{ background: pct===100 ? "#22c55e" : "#f59e0b", height:"100%", width:`${pct}%`, borderRadius:999, transition:"width .3s" }} />
          </div>
          {pct === 100 && (
            <div style={{ marginTop:6, fontSize:11, color:"#15803d", fontWeight:700 }}>🎉 Onboarding terminé !</div>
          )}
        </div>

        {/* Checklist */}
        <div style={{ flex:1, overflowY:"auto", padding:"14px 22px" }}>
          {steps.map(s => (
            <div key={s.id} style={{ marginBottom:6 }}>
              <div
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", borderRadius:9, border:`1px solid ${s.done ? "#bbf7d0" : "#e2e8f0"}`, background: s.done ? "#f0fdf4" : "#fafafa", cursor:"pointer", transition:"all .15s" }}
                onClick={() => toggle(s.id)}
              >
                <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${s.done ? "#22c55e" : "#d1d5db"}`, background: s.done ? "#22c55e" : "#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}>
                  {s.done && <span style={{ color:"#fff", fontSize:13, fontWeight:900 }}>✓</span>}
                </div>
                <span style={{ fontSize:13, color:"#0f172a" }}>{s.icon} {s.label}</span>
                {s.done && s.date && (
                  <span style={{ marginLeft:"auto", fontSize:10, color:"#6b7280", flexShrink:0 }}>
                    {new Date(s.date).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setNoteOpen(noteOpen === s.id ? null : s.id); }}
                  style={{ marginLeft: s.done && s.date ? 6 : "auto", background:"none", border:"none", cursor:"pointer", fontSize:14, color: s.note ? "#0891b2" : "#9ca3af", padding:0, flexShrink:0 }}
                  title="Ajouter une note"
                >💬</button>
              </div>
              {noteOpen === s.id && (
                <div style={{ padding:"6px 13px 8px", background:"#f0f9ff", border:"1px solid #bae6fd", borderTop:"none", borderRadius:"0 0 9px 9px" }}>
                  <input
                    value={s.note}
                    onChange={e => setNote(s.id, e.target.value)}
                    placeholder="Note optionnelle…"
                    style={{ width:"100%", border:"none", background:"transparent", fontSize:12, color:"#374151", outline:"none", boxSizing:"border-box" }}
                    autoFocus
                  />
                </div>
              )}
            </div>
          ))}

          {/* Notes générales */}
          <div style={{ marginTop:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>📝 Notes générales de suivi</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observations, points d'attention, prochaines actions…"
              style={{ width:"100%", padding:"9px 11px", borderRadius:8, border:"1px solid #d1d5db", fontSize:12, resize:"vertical", minHeight:72, boxSizing:"border-box", fontFamily:"inherit" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 22px", borderTop:"1px solid #e2e8f0", display:"flex", gap:10, justifyContent:"flex-end", flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:"8px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:12 }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding:"8px 18px", background:"#15803d", color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12, opacity: saving ? .7 : 1 }}>
            {saving ? "Enregistrement…" : "💾 Sauvegarder le suivi"}
          </button>
        </div>

      </div>
    </div>
  );
};

const DossierForm = ({ initialData, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || { client:"",offre:"",dateReception:new Date().toISOString().slice(0,10),statut:"reçu",commentaire:"",documents:[] });
  const [docType, setDocType] = useState("");
  const [docNom, setDocNom] = useState("");
  const addDoc = () => {
    if (!docType) return;
    const def = DOC_TYPES.find(d=>d.key===docType);
    const nom = docNom.trim() || def?.label || docType;
    setForm(f=>({...f, documents:[...f.documents, {nom, type:docType}]}));
    setDocType(""); setDocNom("");
  };
  return (
    <div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Client *</label><input style={inputSt} value={form.client} onChange={e=>setForm({...form,client:e.target.value})} required /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Offre</label>
        <select style={inputSt} value={form.offre} onChange={e=>setForm({...form,offre:e.target.value})}>
          <option value="">– Choisir –</option>{OFFRE_LIST_F.map(o=><option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Date de réception</label><input type="date" style={inputSt} value={form.dateReception} onChange={e=>setForm({...form,dateReception:e.target.value})} /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Statut</label>
        <select style={inputSt} value={form.statut} onChange={e=>setForm({...form,statut:e.target.value})}>
          <option value="reçu">Reçu</option><option value="en_étude">En étude</option><option value="accepté">Accepté</option><option value="refusé">Refusé</option>
        </select>
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={labelSt}>📎 Ajouter un document</label>
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <select value={docType} onChange={e=>setDocType(e.target.value)} style={{ ...inputSt, flex:1 }}>
            <option value="">— Type —</option>
            {DOC_TYPES.map(d=><option key={d.key} value={d.key}>{d.icon} {d.label}</option>)}
          </select>
          <input value={docNom} onChange={e=>setDocNom(e.target.value)} style={{ ...inputSt, flex:1 }} placeholder="Nom (optionnel)" />
          <button onClick={addDoc} style={{ ...btnPrimary, padding:"9px 14px" }}>+</button>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {form.documents.map((doc,i) => {
            const d = typeof doc==="string" ? {nom:doc,type:"autre"} : doc;
            const ic = DOC_TYPES.find(dt=>dt.key===d.type)?.icon||"📎";
            return (
              <span key={i} style={{ fontSize:11, background:"#e0f2fe", color:"#0369a1", padding:"4px 8px", borderRadius:6, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
                {ic} {d.nom}
                <button onClick={()=>setForm(f=>({...f,documents:f.documents.filter((_,j)=>j!==i)}))} style={{ background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:12,padding:0 }}>✕</button>
              </span>
            );
          })}
          {form.documents.length===0 && <span style={{ fontSize:11, color:"#9ca3af", fontStyle:"italic" }}>Aucun document</span>}
        </div>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Commentaire</label><textarea style={{ ...inputSt, height:60 }} value={form.commentaire} onChange={e=>setForm({...form,commentaire:e.target.value})} /></div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}><button onClick={onCancel} style={btnSecondary}>Annuler</button><button onClick={() => onSave(form)} style={btnPrimary}>Enregistrer</button></div>
    </div>
  );
};

const FORMAT_ICONS = { mixte:"🔀", reading:"📖", writing:"✍️", speaking:"🎤", listening:"🎧", oral:"📝" };
const FORMAT_LABELS = { mixte:"Texte mixte", reading:"Reading", writing:"Writing", speaking:"Speaking", listening:"Listening", oral:"Test oral" };

const TestForm = ({ initialData, onSave, onCancel }) => {
  const defaultForm = { nom:"", prenom:"", telephone:"", email:"", profil:"Particulier", niveau:"A2", score:0, date:new Date().toISOString().slice(0,10), statut:"nouveau", notes:"", offreRecommandee:"" };
  const [form, setForm] = useState(initialData || defaultForm);
  const isFromProspect = !!(initialData?.email || initialData?.telephone);
  const isCorrection   = initialData?.correction_statut === "en_attente";
  const fmtKey = initialData?.format_test || (initialData?.source === "oral" ? "oral" : "mixte");

  return (
    <div>
      {/* Bandeau contextuel */}
      {(isFromProspect || isCorrection) && (
        <div style={{ background: isCorrection ? "#fffbeb" : "#faf5ff", border:`1px solid ${isCorrection ? "#fde68a" : "#ddd6fe"}`, borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:"1.4rem" }}>{FORMAT_ICONS[fmtKey]}</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color: isCorrection ? "#92400e" : "#6d28d9" }}>
              {isCorrection
                ? `Correction du test ${FORMAT_LABELS[fmtKey]} — attribuez le score et le niveau`
                : `Test oral — résultat saisi par l'assistante`}
            </div>
            <div style={{ fontSize:11, color: isCorrection ? "#b45309" : "#7c3aed", marginTop:1 }}>
              Candidat : <strong>{form.prenom} {form.nom}</strong>{form.email ? ` · ${form.email}` : ""}
            </div>
          </div>
        </div>
      )}

      {/* Réponses écrites (Writing) à lire avant de corriger */}
      {isCorrection && fmtKey === "writing" && Array.isArray(initialData?.answers_text) && initialData.answers_text.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>📄 Réponses écrites du candidat</div>
          {initialData.answers_text.map((a, i) => (
            <div key={i} style={{ background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px 14px", marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:4 }}>Question {i+1} — {a.category || ""}</div>
              <div style={{ fontSize:12, color:"#1e293b", fontStyle:"italic", marginBottom:6 }}>"{a.text || a.question_text || ""}"</div>
              <div style={{ fontSize:13, color:"#374151", background:"#fff", borderRadius:6, padding:"8px 10px", border:"1px solid #e2e8f0" }}>{a.user_answer || "—"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Enregistrements audio (Speaking) */}
      {isCorrection && fmtKey === "speaking" && initialData?.audio_answers && Object.keys(initialData.audio_answers).length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>🎤 Enregistrements du candidat</div>
          {Object.entries(initialData.audio_answers).map(([qId, url]) => (
            <div key={qId} style={{ background:"#fdf4ff", border:"1px solid #e9d5ff", borderRadius:8, padding:"10px 14px", marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#7e22ce", marginBottom:6 }}>Question #{qId}</div>
              <audio controls src={url} style={{ width:"100%", height:36, borderRadius:4 }} />
            </div>
          ))}
        </div>
      )}

      {!isCorrection && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
          <div>
            <label style={labelSt}>Nom *</label>
            <input style={{ ...inputSt, background: isFromProspect ? "#f8fafc" : "#fff" }} value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} readOnly={isFromProspect} />
          </div>
          <div>
            <label style={labelSt}>Prénom</label>
            <input style={{ ...inputSt, background: isFromProspect ? "#f8fafc" : "#fff" }} value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} readOnly={isFromProspect} />
          </div>
          <div>
            <label style={labelSt}>Téléphone</label>
            <input style={{ ...inputSt, background: isFromProspect ? "#f8fafc" : "#fff" }} value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+225 07 XX XX XX" readOnly={isFromProspect} />
          </div>
          <div>
            <label style={labelSt}>Email</label>
            <input type="email" style={{ ...inputSt, background: isFromProspect ? "#f8fafc" : "#fff" }} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} readOnly={isFromProspect} />
          </div>
        </div>
      )}

      {!isFromProspect && !isCorrection && (
        <div style={{ marginBottom:12 }}><label style={labelSt}>Profil</label>
          <select style={inputSt} value={form.profil} onChange={e=>setForm({...form,profil:e.target.value})}>
            <option>Particulier</option><option>Entreprise</option><option>Étudiant</option>
          </select>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
        <div><label style={labelSt}>Niveau CECRL *</label>
          <select style={inputSt} value={form.niveau} onChange={e=>setForm({...form,niveau:e.target.value})}>
            {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n}>{n}</option>)}
          </select>
        </div>
        <div><label style={labelSt}>Score (%)</label>
          <input type="number" min={0} max={100} style={inputSt} value={form.score} onChange={e=>setForm({...form,score:Number(e.target.value)})} />
        </div>
      </div>

      {!isCorrection && (
        <>
          <div style={{ marginBottom:12 }}><label style={labelSt}>Offre recommandée</label>
            <select style={inputSt} value={form.offreRecommandee} onChange={e=>setForm({...form,offreRecommandee:e.target.value})}>
              <option value="">– À déterminer –</option>{OFFRE_LIST_F.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:12 }}><label style={labelSt}>Date du test</label>
            <input type="date" style={inputSt} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          </div>
        </>
      )}

      <div style={{ marginBottom:12 }}>
        <label style={labelSt}>{isCorrection ? "Observations de correction" : "Notes / Observations"}</label>
        <textarea style={{ ...inputSt, height:70 }} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Ex : bonne compréhension, difficultés à l'expression écrite…" />
      </div>

      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={btnSecondary}>Annuler</button>
        <button onClick={() => { if (!isCorrection && !form.nom) { alert("Le nom est requis"); return; } onSave(form); }} style={{ ...btnPrimary, background: isCorrection ? "#d97706" : undefined }}>
          {isCorrection ? "✅ Valider la correction" : "✅ Enregistrer le test"}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════ */
const BET_C   = "#0891b2";
const BET_L   = "#e0f2fe";
const BET_Dk  = "#0e7490";
const btnPrimary   = { padding:"9px 16px", background:BET_C,   color:"#fff",    border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnSecondary = { padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnIconEdit  = { padding:"4px 8px", background:BET_L, color:BET_Dk, border:`1px solid ${BET_C}40`, borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 };
const labelSt      = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 };
const inputSt      = { padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%", boxSizing:"border-box" };
const selectSt     = { padding:"6px 12px", borderRadius:6, border:"1px solid #e5e7eb", fontSize:12 };
const modalOverlay = { position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 };
const modalBox     = { background:"#fff", padding:24, borderRadius:14, maxWidth:"92vw" };
const th           = { padding:"8px 10px", textAlign:"left", fontWeight:600, color:"#374151" };
const td           = { padding:"8px 10px" };