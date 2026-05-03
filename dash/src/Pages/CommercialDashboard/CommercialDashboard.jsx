// src/Pages/CommercialDashboard/CommercialDashboard.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

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
const PROFIL_LIST = ["Particulier", "Entreprise", "Étudiant"];

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

/* ── NOUVEAU : Messages clients ── */
const INIT_CONVERSATIONS = [
  { id:1, client:"Orange CI",   email:"k.aya@orange.ci",    avatar:"OC", messages:[
    { from:"client",    text:"Bonjour, je souhaitais avoir plus d'infos sur la formation B2.",       date:"2025-12-10 09:12" },
    { from:"commercial",text:"Bonjour M. Kouamé ! Bien sûr, voici notre programme détaillé...",    date:"2025-12-10 10:05" },
    { from:"client",    text:"Merci, cela correspond bien à nos besoins. Pouvez-vous envoyer un devis ?", date:"2025-12-10 14:30" },
  ], nonLu:0 },
  { id:2, client:"BNP Paribas", email:"d.ibra@bnp.ci",      avatar:"BP", messages:[
    { from:"client",    text:"Nous avons bien reçu le devis. Quelles sont les modalités de paiement ?", date:"2025-12-09 11:20" },
    { from:"commercial",text:"Vous pouvez régler en 2 fois sans frais ou par virement unique.",     date:"2025-12-09 11:45" },
  ], nonLu:1 },
  { id:3, client:"Nestlé CI",   email:"ab.kone@nestle.ci",  avatar:"NC", messages:[
    { from:"client",    text:"Bonjour, nous avons un besoin urgent pour 15 collaborateurs.",         date:"2025-12-08 08:00" },
  ], nonLu:2 },
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
      correct_answers:  r.correct_answers,
      total_questions:  r.total_questions,
      date:             r.submitted_at ? r.submitted_at.split("T")[0] : "",
      commercial_id:    r.commercial_id || null,
      statut:           "nouveau",
      notes:            "",
      offreRecommandee: offreParNiveau(r.level),
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
  const [paiementsLoading, setPaiementsLoading] = useState(false);

  const dbToLocal = (p) => ({
    id:          p.id,
    client:      p.client,
    email:       p.email       || "",
    inscription: p.inscription || "",
    montantDu:   p.montant_du  || 0,
    montantReçu: p.montant_recu|| 0,
    date:        p.date        || "",
    mode:        p.mode        || "Virement",
    statut:      p.statut      || "en_attente",
    notes:       p.notes       || "",
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
  const [conversations, setConversations]   = useState(INIT_CONVERSATIONS);
  const [newsletters, setNewsletters]       = useState(INIT_NEWSLETTERS);
  const [filtreNewsCat, setFiltreNewsCat]   = useState("Tous");
  const [selectedNewsletter, setSelectedNewsletter] = useState(null);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);

  // Filtres
  const [periode, setPeriode]         = useState("mois");
  const [filtreOffre, setFiltreOffre] = useState("Toutes");
  const [filtreProfil, setFiltreProfil]= useState("Tous");
  const [searchQ, setSearchQ]         = useState("");

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
  const [showRecuModal, setShowRecuModal]               = useState(false);
  const [selectedPaiement, setSelectedPaiement]         = useState(null);
  const [showInscDetailModal, setShowInscDetailModal]   = useState(false);
  const [selectedInscription, setSelectedInscription]  = useState(null);
  const [editingItem, setEditingItem]                   = useState(null);

  // Messagerie
  const [activeConvId, setActiveConvId]   = useState(INIT_CONVERSATIONS[0].id);
  const [newMessage, setNewMessage]       = useState("");

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

  const totalNonLu = useMemo(() => conversations.reduce((s, c) => s + c.nonLu, 0), [conversations]);

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

  const caTotal = useMemo(() => inscriptions.reduce((s, i) => s + i.montant, 0), [inscriptions]);
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
        client:       p.client,
        email:        p.email        || "",
        inscription:  p.inscription  || "",
        montant_du:   p.montantDu    || 0,
        montant_recu: p.montantReçu  || 0,
        date:         p.date,
        mode:         p.mode,
        statut:       p.statut,
        notes:        p.notes        || "",
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

  // ── CRUD Dossiers ────────────────────────────────────
  const handleSaveDossier = (dos) => {
    if (dos.id) { setDossiers(dossiers.map(d=>d.id===dos.id?dos:d)); toast.success("Dossier modifié"); }
    else { setDossiers([...dossiers, {...dos, id:Math.max(...dossiers.map(d=>d.id),0)+1}]); toast.success("Dossier ajouté"); }
    setShowDossierModal(false); setEditingItem(null);
  };
  const handleDeleteDossier = (id) => { setDossiers(dossiers.filter(d=>d.id!==id)); toast.success("Dossier supprimé"); };

  // ── CRUD Tests ───────────────────────────────────────
  const handleSaveTest = (t) => {
    if (t.id) { setTests(tests.map(tv=>tv.id===t.id?t:tv)); toast.success("Test modifié"); }
    else { setTests([...tests, {...t, id:Math.max(...tests.map(tv=>tv.id),0)+1}]); toast.success("Test ajouté"); }
    setShowTestModal(false); setEditingItem(null);
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
    const num = `BET-REC-${String(p.id).padStart(4,"0")}-${new Date().getFullYear()}`;
    const w = window.open("","_blank","width=700,height=800");
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Reçu ${num}</title>
    <style>
      body{font-family:'Monsterrat',sans-serif;margin:0;padding:40px;color:#1e293b;background:#fff}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0891b2;padding-bottom:20px;margin-bottom:28px}
      .logo{font-size:28px;font-weight:900;color:#0891b2;letter-spacing:-1px}
      .logo span{color:#0f172a}
      .badge{background:#dcfce7;color:#166534;padding:6px 14px;border-radius:20px;font-weight:700;font-size:13px}
      h2{margin:0 0 4px;font-size:22px}
      .num{font-size:12px;color:#6b7280}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      td{padding:11px 14px;border-bottom:1px solid #e5e7eb;font-size:14px}
      .lbl{color:#6b7280;font-weight:500;width:40%}
      .val{font-weight:600}
      .total-row td{background:#f0f9ff;font-weight:800;font-size:16px;color:#0891b2;border-top:2px solid #0891b2}
      .footer{margin-top:36px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
      .stamp{display:inline-block;border:3px solid #22c55e;color:#166534;padding:6px 18px;border-radius:8px;font-weight:800;font-size:15px;transform:rotate(-5deg);margin-top:10px}
      @media print{body{padding:20px}}
    </style></head><body>
    <div class="header">
      <div><div class="logo">BET<span>Languages</span></div><div style="font-size:11px;color:#6b7280;margin-top:4px">Centre de langues — Abidjan, Côte d'Ivoire</div></div>
      <div style="text-align:right"><h2>REÇU DE PAIEMENT</h2><div class="num">${num}</div><div class="num">${dateStr}</div></div>
    </div>
    <table>
      <tr><td class="lbl">Client</td><td class="val">${p.client}</td></tr>
      <tr><td class="lbl">Formation</td><td class="val">${p.inscription}</td></tr>
      <tr><td class="lbl">Mode de paiement</td><td class="val">${p.mode || "—"}</td></tr>
      <tr><td class="lbl">Date de réception</td><td class="val">${dateStr}</td></tr>
      <tr><td class="lbl">Montant total dû</td><td class="val">${Number(p.montantDu).toLocaleString("fr-FR")} FCFA</td></tr>
      <tr><td class="lbl">Montant reçu</td><td class="val" style="color:#22c55e">${Number(p.montantReçu).toLocaleString("fr-FR")} FCFA</td></tr>
      ${p.montantDu - p.montantReçu > 0 ? `<tr><td class="lbl">Reste à payer</td><td class="val" style="color:#ef4444">${Number(p.montantDu - p.montantReçu).toLocaleString("fr-FR")} FCFA</td></tr>` : ""}
      <tr class="total-row"><td>TOTAL ENCAISSÉ</td><td>${Number(p.montantReçu).toLocaleString("fr-FR")} FCFA</td></tr>
    </table>
    <div style="text-align:center;margin-top:24px">
      <div class="badge">${p.statut === "reçu" ? "✅ PAIEMENT INTÉGRAL REÇU" : "⏳ PAIEMENT PARTIEL"}</div>
      <div class="stamp">${p.statut === "reçu" ? "PAYÉ" : "PARTIEL"}</div>
    </div>
    <div class="footer">
      Ce reçu est généré automatiquement par le système BET Languages. Conservez ce document pour vos archives.<br/>
      BET Languages · contact@betlanguages.ci · +225 27 22 XX XX XX
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

  // ── Messagerie ───────────────────────────────────────
  const activeConv = conversations.find(c => c.id === activeConvId);
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setConversations(prev => prev.map(c => c.id === activeConvId ? {
      ...c,
      messages: [...c.messages, { from:"commercial", text:newMessage.trim(), date:new Date().toLocaleString("fr-FR") }]
    } : c));
    setNewMessage("");
  };
  const markAsRead = (id) => setConversations(prev => prev.map(c => c.id === id ? { ...c, nonLu:0 } : c));

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

  // ── Tab config ───────────────────────────────────────
  const TABS = [
    { key:"dashboard",     label:"Tableau de bord",  icon:"📊" },
    { key:"clients",       label:"Mes clients",       icon:"📬", badge: clientMessages.filter(m=>m.statut==="nouveau").length },
    { key:"tests",         label:"Tests reçus",       icon:"📝", badge: tests.filter(t=>t.statut==="nouveau").length },
    { key:"leads",         label:"Leads",             icon:"👥" },
    { key:"devis",         label:"Devis",             icon:"📄" },
    { key:"inscriptions",  label:"Inscriptions",      icon:"✅" },
    { key:"paiements",     label:"Paiements",         icon:"💳", badge: paiements.filter(p=>p.statut==="en_attente").length },
    { key:"dossiers",      label:"Dossiers",          icon:"📁", badge: dossiers.filter(d=>d.statut==="reçu"||d.statut==="en_étude").length },
    { key:"messages",      label:"Messages",          icon:"💬", badge: totalNonLu },
    { key:"newsletters",   label:"Newsletters",       icon:"📰", badge: newsletters.filter(n=>!n.lu).length },
    { key:"sondages",      label:"Sondages",          icon:"🎯", badge: sondages.length },
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
              <div style={{ fontSize:12, color:"#bae6fd", marginTop:3 }}>Commercial · {profil?.email || "Leads · Devis · Paiements"}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", backdropFilter:"blur(4px)", transition:"background .2s" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
            <span>🚪</span> Déconnexion
          </button>
        </div>
        <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden" }}>
          {[
            { l:"Tests reçus (mois)",  v:filteredTests.length,  c:"#38bdf8" },
            { l:"Leads actifs",        v:leads.filter(l=>l.statut!=="perdu").length, c:"#818cf8" },
            { l:"Taux conversion",     v:`${leads.length?Math.round((inscriptions.length/leads.length)*100):0}%`, c:"#34d399" },
            { l:"CA encaissé",         v:Number(caPaiements).toLocaleString("fr-FR")+" F", c:"#fbbf24" },
          ].map((s,i,arr)=>(
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
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); if(tab.key==="messages" && activeConvId) markAsRead(activeConvId); }} style={{
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

            {/* ══ MES CLIENTS — PRISE EN CHARGE ══ */}
            {activeTab === "clients" && (
              <div>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0f172a" }}>📬 Mes clients — Prises en charge</h2>
                    <p style={{ margin:"4px 0 0", fontSize:12, color:"#9ca3af" }}>
                      Messages et demandes des clients qui vous ont choisi comme conseillère
                    </p>
                  </div>
                  <button onClick={() => { fetchMessages(); }} style={{ ...btnSecondary, fontSize:11, padding:"6px 12px" }} disabled={messagesLoading}>
                    🔄 Actualiser
                  </button>
                </div>

                {/* Stats rapides */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                  {[
                    { label:"Total messages",  val:clientMessages.length,                                          color:"#0891b2" },
                    { label:"Nouveaux",        val:clientMessages.filter(m=>m.statut==="nouveau").length,           color:"#dc2626" },
                    { label:"En cours",        val:clientMessages.filter(m=>m.statut==="en_cours").length,          color:"#f59e0b" },
                    { label:"Traités",         val:clientMessages.filter(m=>m.statut==="traité").length,            color:"#22c55e" },
                  ].map((s,i) => (
                    <div key={i} style={{ background:"#fff", borderRadius:10, padding:"14px 16px", border:"1px solid #f1f5f9", textAlign:"center" }}>
                      <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:11, color:"#6b7280", marginTop:3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* État chargement */}
                {messagesLoading && (
                  <div style={{ textAlign:"center", padding:40, color:"#0891b2", fontSize:13 }}>⏳ Chargement des messages…</div>
                )}

                {/* Liste messages */}
                {!messagesLoading && clientMessages.length === 0 && (
                  <div style={{ textAlign:"center", padding:"48px 24px", background:"#f8fafc", borderRadius:16, border:"1.5px dashed #e2e8f0" }}>
                    <div style={{ fontSize:"3rem", marginBottom:12 }}>📭</div>
                    <div style={{ fontWeight:700, color:"#0f172a", marginBottom:6 }}>Aucun message reçu</div>
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
                      <div style={{ width:380, flexShrink:0, background:"#fff", borderRadius:14, border:"1.5px solid #e5e7eb", padding:24, alignSelf:"flex-start", position:"sticky", top:20 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                          <div>
                            <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a" }}>{selectedMessage.nom}</h3>
                            <div style={{ fontSize:12, color:"#9ca3af", marginTop:3 }}>{selectedMessage.email}</div>
                            {selectedMessage.telephone && <div style={{ fontSize:12, color:"#0891b2", marginTop:2 }}>📞 {selectedMessage.telephone}</div>}
                          </div>
                          <button onClick={() => setSelectedMessage(null)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#9ca3af" }}>✕</button>
                        </div>

                        <div style={{ padding:"10px 14px", borderRadius:8, background:"#f8fafc", marginBottom:16 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:4 }}>SUJET</div>
                          <div style={{ fontSize:14, fontWeight:600, color:"#0f172a" }}>{selectedMessage.sujet || "Sans sujet"}</div>
                        </div>

                        <div style={{ padding:"12px 14px", borderRadius:8, background:"#f8fafc", marginBottom:20, minHeight:100 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:8 }}>MESSAGE</div>
                          <div style={{ fontSize:13, color:"#374151", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{selectedMessage.message}</div>
                        </div>

                        <div style={{ fontSize:11, color:"#9ca3af", marginBottom:16 }}>
                          Reçu le {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—"}
                        </div>

                        {/* Actions statut */}
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:2 }}>Changer le statut :</div>
                          {[
                            { key:"en_cours", label:"🟡 Marquer En cours",  bg:"#fef3c7", color:"#92400e" },
                            { key:"traité",   label:"🟢 Marquer Traité",    bg:"#d1fae5", color:"#065f46" },
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
            {activeTab === "paiements" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
                  <StatCard label="Total encaissé" value={Number(paiements.filter(p=>p.statut==="reçu").reduce((s,p)=>s+p.montantReçu,0)).toLocaleString("fr-FR")+" F"} color="#22c55e" icon="✅" />
                  <StatCard label="Paiements partiels" value={paiements.filter(p=>p.statut==="partiel").length} color="#f59e0b" icon="⏳" />
                  <StatCard label="En attente" value={paiements.filter(p=>p.statut==="en_attente").length} color="#ef4444" icon="⚠️" />
                </div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
                  <button onClick={() => { setEditingItem(null); setShowPaiementModal(true); }} style={btnPrimary}>+ Enregistrer un paiement</button>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"#f9fafb", fontSize:11 }}>
                    <th style={th}>Client</th><th style={th}>Inscription</th><th style={th}>Montant dû</th><th style={th}>Montant reçu</th><th style={th}>Reste</th><th style={th}>Date</th><th style={th}>Mode</th><th style={th}>Statut</th><th style={th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {paiements.map(p => {
                      const reste = p.montantDu - p.montantReçu;
                      const st = STATUT_PAIEMENT[p.statut] || {};
                      return (
                        <tr key={p.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                          <td style={td}><div style={{ fontWeight:600 }}>{p.client}</div></td>
                          <td style={td}>{p.inscription}</td>
                          <td style={td}>{formatMoney(p.montantDu)}</td>
                          <td style={td}><span style={{ fontWeight:700, color:"#22c55e" }}>{formatMoney(p.montantReçu)}</span></td>
                          <td style={td}><span style={{ fontWeight:700, color:reste>0?"#ef4444":"#22c55e" }}>{reste > 0 ? formatMoney(reste) : "–"}</span></td>
                          <td style={td}>{formatDate(p.date)}</td>
                          <td style={td}>{p.mode || "–"}</td>
                          <td style={td}><Badge {...st} label={st.label||p.statut} /></td>
                          <td style={td}>
                            <div style={{ display:"flex", gap:4 }}>
                              {(p.statut==="reçu"||p.statut==="partiel") && (
                                <button onClick={() => genererRecu(p)} style={{ ...btnIconEdit, background:"#f0fdf4", color:"#15803d", borderColor:"#22c55e40" }}>📄 Reçu</button>
                              )}
                              <button onClick={() => { setEditingItem(p); setShowPaiementModal(true); }} style={btnIconEdit}>✏️</button>
                              <button onClick={() => handleDeletePaiement(p.id)} style={{ ...btnIconEdit, color:"#dc2626", background:"#fee2e2", borderColor:"#ef444440" }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

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

            {/* ══ MESSAGERIE (NOUVEAU) ══ */}
            {activeTab === "messages" && (
              <div style={{ display:"flex", gap:0, height:520, border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden" }}>
                {/* Liste conversations */}
                <div style={{ width:240, borderRight:"1px solid #e5e7eb", overflowY:"auto", background:"#fafafa" }}>
                  <div style={{ padding:"12px 14px", borderBottom:"1px solid #e5e7eb", fontSize:12, fontWeight:700, color:"#374151" }}>Conversations</div>
                  {conversations.map(conv => (
                    <div key={conv.id} onClick={() => { setActiveConvId(conv.id); markAsRead(conv.id); }} style={{
                      padding:"12px 14px", borderBottom:"1px solid #f1f5f9", cursor:"pointer",
                      background: activeConvId === conv.id ? BET_LIGHT : "transparent",
                      display:"flex", alignItems:"center", gap:10
                    }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:BET_COLOR, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, flexShrink:0 }}>{conv.avatar}</div>
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{conv.client}</div>
                        <div style={{ fontSize:10, color:"#9ca3af", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                          {conv.messages[conv.messages.length-1]?.text}
                        </div>
                      </div>
                      {conv.nonLu > 0 && (
                        <span style={{ background:"#ef4444", color:"#fff", borderRadius:99, fontSize:9, fontWeight:800, padding:"1px 5px" }}>{conv.nonLu}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Zone messages */}
                {activeConv && (
                  <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
                    <div style={{ padding:"12px 16px", borderBottom:"1px solid #e5e7eb", background:"#fff", display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:BET_COLOR, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800 }}>{activeConv.avatar}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700 }}>{activeConv.client}</div>
                        <div style={{ fontSize:11, color:"#9ca3af" }}>{activeConv.email}</div>
                      </div>
                    </div>
                    <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:10, background:"#f8fafc" }}>
                      {activeConv.messages.map((msg, i) => (
                        <div key={i} style={{ display:"flex", justifyContent: msg.from==="commercial" ? "flex-end" : "flex-start" }}>
                          <div style={{
                            maxWidth:"70%", padding:"10px 14px", borderRadius:12, fontSize:12,
                            background: msg.from==="commercial" ? BET_COLOR : "#fff",
                            color: msg.from==="commercial" ? "#fff" : "#111827",
                            boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                            borderRadius: msg.from==="commercial" ? "12px 12px 0 12px" : "12px 12px 12px 0"
                          }}>
                            <div>{msg.text}</div>
                            <div style={{ fontSize:9, marginTop:4, opacity:0.6, textAlign:"right" }}>{msg.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:"12px 16px", borderTop:"1px solid #e5e7eb", display:"flex", gap:8, background:"#fff" }}>
                      <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                        placeholder="Écrire un message..."
                        style={{ flex:1, padding:"9px 12px", borderRadius:20, border:"1px solid #e5e7eb", fontSize:12, outline:"none" }}
                      />
                      <button onClick={sendMessage} style={{ padding:"9px 18px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:20, cursor:"pointer", fontWeight:700, fontSize:12 }}>Envoyer</button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
      {showPaiementModal && (
        <Modal title={editingItem ? "Modifier le paiement" : "Enregistrer un paiement"} onClose={() => { setShowPaiementModal(false); setEditingItem(null); }}>
          <PaiementForm initialData={editingItem} onSave={handleSavePaiement} onCancel={() => setShowPaiementModal(false)} />
        </Modal>
      )}
      {showDossierModal && (
        <Modal title={editingItem ? "Modifier le dossier" : "Ajouter un dossier"} onClose={() => { setShowDossierModal(false); setEditingItem(null); }}>
          <DossierForm initialData={editingItem} onSave={handleSaveDossier} onCancel={() => setShowDossierModal(false)} />
        </Modal>
      )}
      {showTestModal && (
        <Modal title={editingItem ? "Modifier le test" : "Ajouter un test"} onClose={() => { setShowTestModal(false); setEditingItem(null); }}>
          <TestForm initialData={editingItem} onSave={handleSaveTest} onCancel={() => setShowTestModal(false)} />
        </Modal>
      )}
      {/* ══ MODAL DÉTAIL TEST DE NIVEAU ══ */}
      {showTestDetailModal && selectedTest && (
        <Modal title={`🔍 Test de niveau — ${selectedTest.prenom} ${selectedTest.nom}`} onClose={() => { setShowTestDetailModal(false); setSelectedTest(null); }} wide>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
            <div style={{ padding:16, borderRadius:10, background:"#f0f9ff", border:"1px solid #bae6fd" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#0369a1", marginBottom:10 }}>👤 Informations candidat</div>
              {[["Nom complet",`${selectedTest.prenom} ${selectedTest.nom}`],["Email",selectedTest.email],["Téléphone",selectedTest.telephone||"—"],["Profil",selectedTest.profil],["Date du test",formatDate(selectedTest.date)]].map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12 }}>
                  <span style={{ color:"#6b7280" }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:16, borderRadius:10, background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#15803d", marginBottom:10 }}>📊 Résultats du test</div>
              <div style={{ textAlign:"center", marginBottom:12 }}>
                <div style={{ fontSize:42, fontWeight:900, color: selectedTest.score>=70?"#22c55e":selectedTest.score>=50?"#f59e0b":"#ef4444" }}>{selectedTest.score}%</div>
                <div style={{ fontSize:20, fontWeight:800, color:BET_COLOR }}>{selectedTest.niveau}</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>Niveau CECRL</div>
              </div>
              <div style={{ height:8, background:"#e5e7eb", borderRadius:4, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${selectedTest.score}%`, background:selectedTest.score>=70?"#22c55e":selectedTest.score>=50?"#f59e0b":"#ef4444", borderRadius:4 }} />
              </div>
            </div>
          </div>
          <div style={{ padding:14, borderRadius:10, background:"#fef9ee", border:"1px solid #fde68a", marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#92400e", marginBottom:8 }}>💡 Offre recommandée & actions à mener</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                [`📚 Offre conseillée : ${selectedTest.offreRecommandee||"à déterminer"}`,"Proposez cette offre en priorité lors du contact"],
                ["📞 Appel de suivi","Contactez le candidat dans les 24h pour présenter l'offre"],
                ["📄 Créer le devis","Convertissez en Lead puis générez un devis adapté"],
                ["📁 Ouvrir le dossier","Préparez le dossier d'inscription après accord du prospect"],
              ].map(([titre,desc],i)=>(
                <div key={i} style={{ padding:"8px 12px", borderRadius:8, background:"#fff", border:"1px solid #e5e7eb", fontSize:12 }}>
                  <div style={{ fontWeight:700, color:"#374151" }}>{titre}</div>
                  <div style={{ color:"#9ca3af", fontSize:11 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
          {selectedTest.notes && <div style={{ padding:"10px 14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e5e7eb", fontSize:12, color:"#374151", marginBottom:16 }}>📝 Notes : {selectedTest.notes}</div>}
          <div style={{ display:"flex", gap:10 }}>
            {selectedTest.statut !== "converti" && selectedTest.statut !== "archivé" && (
              <button onClick={() => { convertirTestEnLead(selectedTest); setShowTestDetailModal(false); }} style={{ ...btnPrimary, background:"#22c55e" }}>→ Convertir en Lead</button>
            )}
            <button onClick={() => { setEditingItem(selectedTest); setShowTestModal(true); setShowTestDetailModal(false); }} style={btnSecondary}>✏️ Modifier</button>
            <button onClick={() => setShowTestDetailModal(false)} style={btnSecondary}>Fermer</button>
          </div>
        </Modal>
      )}

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
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FORMULAIRES CRUD
═══════════════════════════════════════════════════════ */
const BET_COLOR_F = "#0891b2";
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

const InscriptionForm = ({ initialData, onSave, onCancel }) => {
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

  return (
    <div>
      <div style={{ fontSize:12, fontWeight:700, color:"#0369a1", marginBottom:10, padding:"8px 12px", background:"#f0f9ff", borderRadius:8 }}>👤 Coordonnées client</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
        <div><label style={labelSt}>Client / Entreprise *</label><input style={inputSt} value={form.client} onChange={e=>setForm({...form,client:e.target.value})} required /></div>
        <div><label style={labelSt}>Nom du contact</label><input style={inputSt} value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} /></div>
        <div><label style={labelSt}>Téléphone</label><input style={inputSt} value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+225 07 XX XX XX" /></div>
        <div><label style={labelSt}>Email</label><input type="email" style={inputSt} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:"#15803d", margin:"14px 0 10px", padding:"8px 12px", background:"#f0fdf4", borderRadius:8 }}>📚 Formation</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
        <div><label style={labelSt}>Offre choisie</label>
          <select style={inputSt} value={form.offre} onChange={e=>setForm({...form,offre:e.target.value})}>
            <option value="">– Choisir –</option>{OFFRE_LIST_F.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <div><label style={labelSt}>Niveau test de niveau</label>
          <select style={inputSt} value={form.niveauTest} onChange={e=>setForm({...form,niveauTest:e.target.value})}>
            {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n}>{n}</option>)}
          </select>
        </div>
        <div><label style={labelSt}>Date d'inscription</label><input type="date" style={inputSt} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
        <div><label style={labelSt}>Date de début formation</label><input type="date" style={inputSt} value={form.dateDebut} onChange={e=>setForm({...form,dateDebut:e.target.value})} /></div>
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
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}><button onClick={onCancel} style={btnSecondary}>Annuler</button><button onClick={() => onSave(form)} style={btnPrimary}>Enregistrer</button></div>
    </div>
  );
};

const PaiementForm = ({ initialData, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || { client:"",email:"",inscription:"",montantDu:0,montantReçu:0,date:new Date().toISOString().slice(0,10),mode:"Virement",statut:"en_attente",notes:"" });
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div style={{ marginBottom:12 }}><label style={labelSt}>Client *</label><input style={inputSt} value={form.client} onChange={e=>f("client",e.target.value)} required /></div>
        <div style={{ marginBottom:12 }}><label style={labelSt}>Email client</label><input type="email" style={inputSt} value={form.email} onChange={e=>f("email",e.target.value)} placeholder="exemple@email.com" /></div>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Inscription / Formation</label><input style={inputSt} value={form.inscription} onChange={e=>f("inscription",e.target.value)} /></div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div style={{ marginBottom:12 }}><label style={labelSt}>Montant dû (FCFA)</label><input type="number" style={inputSt} value={form.montantDu} onChange={e=>f("montantDu",Number(e.target.value))} /></div>
        <div style={{ marginBottom:12 }}><label style={labelSt}>Montant reçu (FCFA)</label><input type="number" style={inputSt} value={form.montantReçu} onChange={e=>f("montantReçu",Number(e.target.value))} /></div>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Date de réception</label><input type="date" style={inputSt} value={form.date} onChange={e=>f("date",e.target.value)} /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Mode de paiement</label>
        <select style={inputSt} value={form.mode} onChange={e=>f("mode",e.target.value)}>
          <option>Virement</option>
          <option>CinetPay</option>
          <option>Orange Money</option>
          <option>Wave</option>
          <option>Mobile Money (MTN)</option>
          <option>Espèces</option>
          <option>Chèque</option>
          <option>Carte bancaire</option>
        </select>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Statut</label>
        <select style={inputSt} value={form.statut} onChange={e=>f("statut",e.target.value)}>
          <option value="en_attente">En attente</option><option value="partiel">Partiel</option><option value="reçu">Reçu</option><option value="remboursé">Remboursé</option>
        </select>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Notes / Référence transaction</label><textarea style={{ ...inputSt, height:60 }} value={form.notes} onChange={e=>f("notes",e.target.value)} placeholder="Ex: Réf. CinetPay #TXN-123456" /></div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}><button onClick={onCancel} style={btnSecondary}>Annuler</button><button onClick={() => onSave(form)} style={btnPrimary}>Enregistrer</button></div>
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

const TestForm = ({ initialData, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || { nom:"", prenom:"", telephone:"", email:"", profil:"Particulier", niveau:"A2", score:0, date:new Date().toISOString().slice(0,10), statut:"nouveau", notes:"", offreRecommandee:"" });
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
        <div><label style={labelSt}>Nom *</label><input style={inputSt} value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} required /></div>
        <div><label style={labelSt}>Prénom *</label><input style={inputSt} value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} required /></div>
        <div><label style={labelSt}>Téléphone</label><input style={inputSt} value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+225 07 XX XX XX" /></div>
        <div><label style={labelSt}>Email</label><input type="email" style={inputSt} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Profil</label>
        <select style={inputSt} value={form.profil} onChange={e=>setForm({...form,profil:e.target.value})}>
          <option>Particulier</option><option>Entreprise</option><option>Étudiant</option>
        </select>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
        <div><label style={labelSt}>Niveau CECRL</label>
          <select style={inputSt} value={form.niveau} onChange={e=>setForm({...form,niveau:e.target.value})}>
            {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n}>{n}</option>)}
          </select>
        </div>
        <div><label style={labelSt}>Score (%)</label><input type="number" min={0} max={100} style={inputSt} value={form.score} onChange={e=>setForm({...form,score:Number(e.target.value)})} /></div>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Offre recommandée</label>
        <select style={inputSt} value={form.offreRecommandee} onChange={e=>setForm({...form,offreRecommandee:e.target.value})}>
          <option value="">– À déterminer –</option>{OFFRE_LIST_F.map(o=><option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Date du test</label><input type="date" style={inputSt} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Statut</label>
        <select style={inputSt} value={form.statut} onChange={e=>setForm({...form,statut:e.target.value})}>
          <option value="nouveau">Nouveau</option><option value="contacté">Contacté</option><option value="converti">Converti</option><option value="archivé">Archivé</option>
        </select>
      </div>
      <div style={{ marginBottom:12 }}><label style={labelSt}>Notes</label><textarea style={{ ...inputSt, height:60 }} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}><button onClick={onCancel} style={btnSecondary}>Annuler</button><button onClick={() => onSave(form)} style={btnPrimary}>Enregistrer</button></div>
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