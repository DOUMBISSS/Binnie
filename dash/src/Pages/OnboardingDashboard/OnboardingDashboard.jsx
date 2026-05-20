// src/Pages/OnboardingDashboard/OnboardingDashboard.jsx
import React, { useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import NotificationsTab from "../../Components/NotificationsTab";

/* ═══════════════════════════════════════════════════════
   CHARTE BET ONBOARDING
═══════════════════════════════════════════════════════ */
const C       = "#7c3aed";   // violet principal
const C_DARK  = "#5b21b6";
const C_LIGHT = "#f3e8ff";
const C_GRAD  = "linear-gradient(135deg,#0f172a 0%,#7c3aed 100%)";

/* ═══════════════════════════════════════════════════════
   COMPOSANTS
═══════════════════════════════════════════════════════ */
const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
    <div style={{ background:"#fff",borderRadius:16,width:wide?720:500,maxWidth:"96vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:"1px solid #e5e7eb" }}>
        <h3 style={{ margin:0,fontSize:15,fontWeight:800,color:"#0f172a" }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#6b7280" }}>✕</button>
      </div>
      <div style={{ padding:"20px 24px" }}>{children}</div>
    </div>
  </div>
);

const Badge = ({ label, color, bg }) => (
  <span style={{ display:"inline-block",padding:"2px 9px",borderRadius:99,fontSize:10,fontWeight:700,color,background:bg,whiteSpace:"nowrap" }}>{label}</span>
);

const KpiCard = ({ icon, label, value, color, sub, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff",borderRadius:12,padding:"16px 18px",border:"1px solid #f1f5f9",boxShadow:"0 1px 6px rgba(0,0,0,0.05)",display:"flex",alignItems:"center",gap:14,cursor:onClick?"pointer":"default" }}>
    <div style={{ width:46,height:46,borderRadius:10,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>{icon}</div>
    <div>
      <div style={{ fontSize:11,color:"#9ca3af" }}>{label}</div>
      <div style={{ fontSize:22,fontWeight:900,color,lineHeight:1.1 }}>{value}</div>
      {sub&&<div style={{ fontSize:11,color:"#9ca3af",marginTop:1 }}>{sub}</div>}
    </div>
  </div>
);

const Checkbox = ({ checked, onChange, label }) => (
  <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:checked?"#6b7280":"#0f172a",textDecoration:checked?"line-through":"none" }}>
    <div onClick={onChange} style={{ width:18,height:18,borderRadius:4,border:`2px solid ${checked?"#22c55e":"#d1d5db"}`,background:checked?"#22c55e":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer" }}>
      {checked&&<span style={{ color:"#fff",fontSize:11,fontWeight:800 }}>✓</span>}
    </div>
    {label}
  </label>
);

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK
═══════════════════════════════════════════════════════ */
const NIVEAUX = { A1:"Débutant",A2:"Élémentaire",B1:"Intermédiaire",B2:"Interm. Sup.",C1:"Avancé",C2:"Maîtrise" };

const PAIEMENT_ST = {
  en_attente:  { label:"En attente",  color:"#d97706", bg:"#fef3c7" },
  confirme:    { label:"Confirmé",    color:"#16a34a", bg:"#dcfce7" },
  rejete:      { label:"Rejeté",      color:"#dc2626", bg:"#fee2e2" },
};

const MODE_PAI_LABELS = {
  en_ligne:              "💻 En ligne",
  especes:               "💵 Espèces",
  mobile_money_ria:      "📱 Mobile Money — Ria",
  mobile_money_moneygram:"📱 Mobile Money — MoneyGram",
  mobile_money_autres:   "📱 Mobile Money — Autres",
};

const INIT_APPRENANTS = [
  { id:1, nom:"Adjoua Koné",    email:"adjoua.k@gmail.com",    telephone:"+225 07 11 22 33", offre:"Anglais Pro B2",     niveau:"B1", coach:"Prof. Martin",  dateConversion:"2025-12-15", statut:"en_attente",  profil:"Particulier",  entreprise:"",           objectif:"Améliorer la communication professionnelle pour des réunions internationales", statut_paiement:"en_attente", mode_paiement:"en_ligne" },
  { id:2, nom:"Ibrahim Traoré", email:"itraoré@totalci.com",   telephone:"+225 05 44 55 66", offre:"Certification TOEIC",niveau:"A2", coach:"Prof. Smith",   dateConversion:"2025-12-14", statut:"en_cours",    profil:"Entreprise",   entreprise:"Total CI",   objectif:"Préparer et réussir la certification TOEIC avec un score ≥ 785", statut_paiement:"confirme", mode_paiement:"mobile_money_ria" },
  { id:3, nom:"Marie Dupont",   email:"marie.d@cci.ci",        telephone:"+225 01 23 45 67", offre:"Business English",   niveau:"B2", coach:"Prof. Dubois",  dateConversion:"2025-12-13", statut:"terminé",     profil:"Entreprise",   entreprise:"CCI CI",     objectif:"Maîtriser l'anglais des affaires : présentations, négociations, emails", statut_paiement:"confirme", mode_paiement:"especes" },
  { id:4, nom:"Seydou Bamba",   email:"s.bamba@orange.ci",     telephone:"+225 07 88 99 00", offre:"Anglais Professionnel",niveau:"A1",coach:"Prof. Koné",   dateConversion:"2025-12-12", statut:"en_attente",  profil:"Entreprise",   entreprise:"Orange CI",  objectif:"Acquérir les bases de l'anglais pour les échanges internationaux", statut_paiement:"en_attente", mode_paiement:null },
  { id:5, nom:"Fatoumata Diallo",email:"f.diallo@bnp.ci",      telephone:"+225 07 55 66 77", offre:"Anglais Pro B2",     niveau:"B1", coach:"Prof. Martin",  dateConversion:"2025-12-10", statut:"terminé",     profil:"Entreprise",   entreprise:"BNP Paribas",objectif:"Développer l'aisance à l'oral en contexte professionnel", statut_paiement:"confirme", mode_paiement:"mobile_money_moneygram" },
  { id:6, nom:"Kofi Mensah",    email:"k.mensah@ecobank.com",  telephone:"+225 05 33 44 55", offre:"Certification TOEIC",niveau:"A2", coach:"Prof. Smith",   dateConversion:"2025-12-09", statut:"en_cours",    profil:"Entreprise",   entreprise:"Ecobank CI", objectif:"Score TOEIC ≥ 700 pour exigence interne RH", statut_paiement:"en_attente", mode_paiement:"en_ligne" },
];

const INIT_PLANNINGS = [
  { id:1, apprenantId:1, apprenantNom:"Adjoua Koné",    coach:"Prof. Martin", offre:"Anglais Pro B2",     seances:[
    { jour:"Lundi",    heure:"09:00", duree:90, mode:"Présentiel", salle:"Salle A", statut:"confirmée" },
    { jour:"Mercredi", heure:"09:00", duree:90, mode:"Présentiel", salle:"Salle A", statut:"confirmée" },
  ], dateDebut:"2026-01-13", nbSeancesTotal:24, statut:"à_envoyer" },
  { id:2, apprenantId:2, apprenantNom:"Ibrahim Traoré", coach:"Prof. Smith",  offre:"Certification TOEIC",seances:[
    { jour:"Mardi",    heure:"18:30", duree:90, mode:"En ligne",   salle:"Google Meet", statut:"confirmée" },
    { jour:"Jeudi",    heure:"18:30", duree:90, mode:"En ligne",   salle:"Google Meet", statut:"confirmée" },
  ], dateDebut:"2026-01-14", nbSeancesTotal:20, statut:"envoyé" },
  { id:3, apprenantId:6, apprenantNom:"Kofi Mensah",    coach:"Prof. Smith",  offre:"Certification TOEIC",seances:[
    { jour:"Lundi",    heure:"07:30", duree:60, mode:"En ligne",   salle:"Zoom", statut:"confirmée" },
    { jour:"Vendredi", heure:"07:30", duree:60, mode:"En ligne",   salle:"Zoom", statut:"à_confirmer" },
  ], dateDebut:"2026-01-15", nbSeancesTotal:20, statut:"en_préparation" },
];

const CHECKLIST_ITEMS = [
  { id:"bienvenue",  label:"Message de bienvenue envoyé à l'apprenant" },
  { id:"acces",      label:"Accès EspaceApprenant créés (login + mot de passe)" },
  { id:"kit",        label:"Kit de démarrage envoyé (règlement + guide)" },
  { id:"planning",   label:"Planning des séances créé et envoyé" },
  { id:"fiche",      label:"Fiche apprenant transmise au coach" },
  { id:"briefing",   label:"Briefing coach effectué (objectifs + profil)" },
  { id:"1ere",       label:"1ère séance confirmée et réalisée" },
  { id:"feedback",   label:"Retour apprenant après 1ère séance recueilli" },
];

const INIT_SUIVIS = [
  { id:1, apprenantId:1, apprenantNom:"Adjoua Koné",    coach:"Prof. Martin", dateDebut:"2026-01-13", checklist:{ bienvenue:true,acces:false,kit:false,planning:false,fiche:false,briefing:false,"1ere":false,feedback:false }, notes:"" },
  { id:2, apprenantId:2, apprenantNom:"Ibrahim Traoré", coach:"Prof. Smith",  dateDebut:"2026-01-14", checklist:{ bienvenue:true,acces:true,kit:true,planning:true,fiche:true,briefing:true,"1ere":false,feedback:false },  notes:"Apprenant très motivé, niveau réel peut-être B1" },
  { id:3, apprenantId:6, apprenantNom:"Kofi Mensah",    coach:"Prof. Smith",  dateDebut:"2026-01-15", checklist:{ bienvenue:true,acces:true,kit:false,planning:false,fiche:false,briefing:false,"1ere":false,feedback:false }, notes:"" },
];

const INIT_BILANS = [
  { id:1, apprenantNom:"Marie Dupont",    offre:"Business English",   coach:"Prof. Dubois", dateFin:"2025-12-31", niveauDebut:"B2", niveauFin:"C1", nbSeances:24, tauxPresence:92, noteFinale:87, commentaire:"Excellente progression. A atteint tous ses objectifs. Recommande fortement le niveau C1→C2.", alerteCommerciale:false, renouvellement:"C1→C2" },
  { id:2, apprenantNom:"Fatoumata Diallo",offre:"Anglais Pro B2",     coach:"Prof. Martin", dateDebutBilan:"2026-01-20", niveauDebut:"B1", niveauFin:"B2", nbSeances:20, tauxPresence:85, noteFinale:79, commentaire:"Bonne progression à l'oral. Potentiel pour le TOEIC.", alerteCommerciale:false, renouvellement:"Certification TOEIC" },
];

const INIT_MESSAGES = [
  { id:1, de:"Responsable Pédagogique", avatar:"RP", email:"resp.peda@betlanguages.ci", type:"alerte",   date:"2025-12-15 09:10", objet:"Nouveau apprenant assigné — Adjoua Koné",   texte:"Bonjour, j'ai viens d'assigner Prof. Martin à Adjoua Koné pour la formation Anglais Pro B2. Merci de lancer la procédure d'onboarding.", lu:false },
  { id:2, de:"Prof. Martin",            avatar:"PM", email:"prof.martin@betlanguages.ci",type:"coach",   date:"2025-12-14 14:30", objet:"Disponibilités semaine du 13 janvier",        texte:"Bonjour, je suis disponible lundi et mercredi de 9h à 12h pour les séances en présentiel. Vendredi matin aussi si besoin.", lu:false },
  { id:3, de:"Ibrahim Traoré",          avatar:"IT", email:"itraoré@totalci.com",        type:"apprenant",date:"2025-12-13 08:45", objet:"Question sur l'accès à la plateforme",        texte:"Bonjour, j'ai reçu mes identifiants mais je n'arrive pas à me connecter à l'EspaceApprenant. Pourriez-vous m'aider ?", lu:true },
  { id:4, de:"Commercial — Amina",      avatar:"CA", email:"commercial@betlanguages.ci", type:"commercial",date:"2025-12-12 16:00",objet:"Nouveau converti — Seydou Bamba (Orange CI)",  texte:"Bonjour, le dossier de Seydou Bamba vient d'être validé et le paiement reçu. Il vous est transféré pour onboarding. Prof. Koné lui a été assigné.", lu:true },
  { id:5, de:"Responsable Pédagogique", avatar:"RP", email:"resp.peda@betlanguages.ci",  type:"alerte",  date:"2025-12-11 11:20", objet:"Coaching Kofi Mensah — Ecobank CI",           texte:"Prof. Smith prend en charge Kofi Mensah. Score TOEIC cible ≥ 700. Entreprise très demandeuse. Veuillez organiser l'onboarding en priorité.", lu:true },
];

/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
export default function OnboardingDashboard() {
  const profil = JSON.parse(localStorage.getItem("admin_profil") || "{}");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [apprenants, setApprenants] = useState(INIT_APPRENANTS);
  const [plannings, setPlannings] = useState(INIT_PLANNINGS);
  const [suivis, setSuivis] = useState(INIT_SUIVIS);
  const [bilans, setBilans] = useState(INIT_BILANS);
  const [messages, setMessages] = useState(INIT_MESSAGES);

  // Modaux
  const [showAppModal, setShowAppModal]           = useState(false);
  const [selectedApprenant, setSelectedApprenant] = useState(null);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [selectedPlanning, setSelectedPlanning]   = useState(null);
  const [showSuiviModal, setShowSuiviModal]       = useState(false);
  const [selectedSuivi, setSelectedSuivi]         = useState(null);
  const [showBilanModal, setShowBilanModal]       = useState(false);
  const [selectedBilan, setSelectedBilan]         = useState(null);
  const [showMsgModal, setShowMsgModal]           = useState(false);
  const [selectedMsg, setSelectedMsg]             = useState(null);
  const [replyText, setReplyText]                 = useState("");

  // Nouveau planning form
  const [showNewPlanningModal, setShowNewPlanningModal] = useState(false);
  const [planningForm, setPlanningForm] = useState({ apprenantId:"", dateDebut:"", nbSeancesTotal:20 });

  const msgNonLus = useMemo(() => messages.filter(m=>!m.lu).length, [messages]);
  const enAttente = useMemo(() => apprenants.filter(a=>a.statut==="en_attente").length, [apprenants]);
  const enCours   = useMemo(() => apprenants.filter(a=>a.statut==="en_cours").length, [apprenants]);
  const bilansDus  = useMemo(() => bilans.filter(b=>!b.alerteCommerciale).length, [bilans]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "–";

  const pctChecklist = (cl) => {
    const vals = Object.values(cl);
    return vals.length ? Math.round((vals.filter(Boolean).length / vals.length)*100) : 0;
  };

  const toggleCheck = (suiviId, itemId) => {
    setSuivis(prev => prev.map(s => s.id === suiviId ? {
      ...s, checklist:{ ...s.checklist, [itemId]:!s.checklist[itemId] }
    } : s));
  };

  const envoyerPlanning = (planningId) => {
    setPlannings(prev=>prev.map(p=>p.id===planningId?{...p,statut:"envoyé"}:p));
    toast.success("📅 Planning envoyé à l'apprenant et au coach ✓");
  };

  const envoyerAlerteCommerciale = (bilanId) => {
    setBilans(prev=>prev.map(b=>b.id===bilanId?{...b,alerteCommerciale:true}:b));
    toast.success("📣 Alerte de renouvellement envoyée à l'équipe commerciale ✓");
    toast("💡 La commerciale a été notifiée pour relancer l'apprenant", { icon:"📧",duration:4000 });
  };

  const marquerLu = (msgId) => {
    setMessages(prev=>prev.map(m=>m.id===msgId?{...m,lu:true}:m));
  };

  const STATUT_APP = {
    en_attente: { label:"En attente",  color:"#d97706", bg:"#fef3c7" },
    en_cours:   { label:"En cours",    color:"#0891b2", bg:"#e0f2fe" },
    terminé:    { label:"Terminé",     color:"#22c55e", bg:"#dcfce7" },
  };

  const STATUT_PLANNING = {
    en_préparation: { label:"En préparation", color:"#d97706", bg:"#fef3c7" },
    à_envoyer:      { label:"À envoyer",      color:"#7c3aed", bg:"#f3e8ff" },
    envoyé:         { label:"Envoyé",         color:"#22c55e", bg:"#dcfce7" },
  };

  const MSG_TYPE = {
    alerte:     { color:"#dc2626", bg:"#fee2e2",  icon:"🔔" },
    coach:      { color:"#0891b2", bg:"#e0f2fe",  icon:"👨‍🏫" },
    apprenant:  { color:"#7c3aed", bg:"#f3e8ff",  icon:"🎓" },
    commercial: { color:"#d97706", bg:"#fef3c7",  icon:"💼" },
  };

  const TABS = [
    { key:"dashboard",     label:"Tableau de bord",    icon:"📊" },
    { key:"apprenants",    label:"Nouveaux apprenants", icon:"🎓", badge:enAttente },
    { key:"programmation", label:"Programmation",      icon:"📅", badge:plannings.filter(p=>p.statut!=="envoyé").length },
    { key:"suivi",         label:"Suivi démarrage",    icon:"✅" },
    { key:"bilans",        label:"Bilans & Renouvellements", icon:"📋", badge:bilansDus },
    { key:"messages",      label:"Messages",           icon:"💬", badge:msgNonLus },
    { key:"notifications", label:"Notifications",      icon:"🔔" },
  ];

  const inp = { padding:"9px 11px",borderRadius:8,border:"1px solid #d1d5db",fontSize:13,width:"100%",boxSizing:"border-box" };
  const lbl = { display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4 };
  const btnP = { padding:"9px 16px",background:C,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12 };
  const btnS = { padding:"9px 16px",background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12 };

  return (
    <div style={{ minHeight:"100vh",background:"#f5f3ff" }}>
      <Toaster position="top-right" />

      {/* HERO */}
      <div style={{ background:C_GRAD,padding:"28px 32px 0",color:"#fff",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-30,right:-30,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.05)" }}/>
        <div style={{ position:"absolute",bottom:-50,right:100,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.04)" }}/>
        <div style={{ display:"flex",alignItems:"center",gap:18,marginBottom:26 }}>
          <div style={{ width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:20,border:"3px solid rgba(255,255,255,0.3)" }}>AO</div>
          <div>
            <div style={{ fontSize:11,color:"#d8b4fe",fontWeight:600,letterSpacing:"0.08em" }}>Bonjour 👋</div>
            <h1 style={{ margin:0,fontSize:21,fontWeight:900 }}>Tableau de bord — Assistante Onboarding</h1>
            <div style={{ fontSize:12,color:"#c4b5fd",marginTop:3 }}>Accueil · Programmation · Suivi · Bilans · Renouvellements</div>
          </div>
        </div>
        {/* Mini KPIs header */}
        <div style={{ display:"flex",gap:0,background:"rgba(0,0,0,0.18)",borderRadius:"10px 10px 0 0",overflow:"hidden" }}>
          {[
            { l:"En attente onboarding", v:enAttente,  c:"#f9a8d4" },
            { l:"Onboarding en cours",   v:enCours,    c:"#7dd3fc" },
            { l:"Bilans à traiter",      v:bilansDus,  c:"#fcd34d" },
            { l:"Messages non lus",      v:msgNonLus,  c:"#a5f3fc" },
          ].map((s,i,arr)=>(
            <div key={s.l} style={{ flex:1,textAlign:"center",padding:"12px 8px",borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.08)":"none" }}>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:2 }}>{s.l}</div>
              <div style={{ fontSize:20,fontWeight:900,color:s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 24px 40px" }}>
        <div style={{ background:"#fff",borderRadius:"0 0 14px 14px",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",overflow:"hidden" }}>
          {/* TABS */}
          <div style={{ display:"flex",gap:0,borderBottom:"1px solid #e5e7eb",overflowX:"auto",background:"#fafafa" }}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
                padding:"12px 16px",border:"none",borderBottom:activeTab===t.key?`3px solid ${C}`:"3px solid transparent",
                cursor:"pointer",fontWeight:600,fontSize:12,whiteSpace:"nowrap",
                background:"transparent",color:activeTab===t.key?C:"#6b7280",
                display:"flex",alignItems:"center",gap:6,
              }}>
                <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
                {t.badge>0&&<span style={{ background:"#ef4444",color:"#fff",borderRadius:99,fontSize:9,fontWeight:800,padding:"1px 6px" }}>{t.badge}</span>}
              </button>
            ))}
          </div>

          <div style={{ padding:24 }}>

            {/* ══ TABLEAU DE BORD ══ */}
            {activeTab==="dashboard" && (
              <div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24 }}>
                  <KpiCard icon="⏳" label="En attente d'onboarding" value={enAttente} color="#d97706" sub="apprenants à traiter" onClick={()=>setActiveTab("apprenants")} />
                  <KpiCard icon="🔄" label="Onboarding en cours"    value={enCours}   color={C}       sub="en cours de démarrage" onClick={()=>setActiveTab("suivi")} />
                  <KpiCard icon="📅" label="Plannings à envoyer"    value={plannings.filter(p=>p.statut!=="envoyé").length} color="#0891b2" sub="à finaliser" onClick={()=>setActiveTab("programmation")} />
                  <KpiCard icon="📋" label="Bilans à traiter"       value={bilansDus} color="#22c55e" sub="fin de cycle" onClick={()=>setActiveTab("bilans")} />
                </div>

                {/* Pipeline onboarding */}
                <div style={{ background:"#f8fafc",borderRadius:14,padding:20,marginBottom:20 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:16 }}>🔄 Pipeline Onboarding</div>
                  <div style={{ display:"flex",alignItems:"stretch",gap:0 }}>
                    {[
                      { label:"Nouveaux",     count:enAttente, color:C,        bg:C_LIGHT,      icon:"📥" },
                      { label:"Accueil",      count:suivis.filter(s=>s.checklist.bienvenue&&!s.checklist["1ere"]).length, color:"#0891b2",bg:"#e0f2fe",icon:"👋" },
                      { label:"Programmation",count:plannings.filter(p=>p.statut==="envoyé").length, color:"#6366f1",bg:"#ede9fe",icon:"📅" },
                      { label:"1ère séance",  count:suivis.filter(s=>s.checklist["1ere"]).length, color:"#f59e0b",bg:"#fef3c7",icon:"🎯" },
                      { label:"Terminé",      count:apprenants.filter(a=>a.statut==="terminé").length, color:"#22c55e",bg:"#dcfce7",icon:"✅" },
                    ].map((step,i,arr)=>(
                      <React.Fragment key={step.label}>
                        <div style={{ flex:1,textAlign:"center",padding:"14px 8px",background:step.bg,borderRadius:i===0?"10px 0 0 10px":i===arr.length-1?"0 10px 10px 0":"0",border:`1px solid ${step.color}20` }}>
                          <div style={{ fontSize:20,marginBottom:4 }}>{step.icon}</div>
                          <div style={{ fontSize:22,fontWeight:900,color:step.color }}>{step.count}</div>
                          <div style={{ fontSize:10,fontWeight:700,color:step.color }}>{step.label}</div>
                        </div>
                        {i<arr.length-1&&<div style={{ fontSize:20,color:"#94a3b8",display:"flex",alignItems:"center",margin:"0 -1px",zIndex:1 }}>›</div>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Alertes messages */}
                {messages.filter(m=>!m.lu).length>0&&(
                  <div style={{ background:"#fff7ed",borderRadius:12,padding:16,marginBottom:20,border:"1px solid #fed7aa" }}>
                    <div style={{ fontSize:12,fontWeight:700,color:"#c2410c",marginBottom:10 }}>🔔 Messages non lus ({messages.filter(m=>!m.lu).length})</div>
                    {messages.filter(m=>!m.lu).map(m=>{
                      const mt=MSG_TYPE[m.type]||{};
                      return (
                        <div key={m.id} onClick={()=>{ setSelectedMsg(m); setShowMsgModal(true); marquerLu(m.id); }} style={{ display:"flex",gap:10,alignItems:"center",padding:"9px 12px",borderRadius:8,background:"#fff",marginBottom:6,cursor:"pointer",border:"1px solid #e5e7eb" }}>
                          <span style={{ padding:"3px 8px",borderRadius:10,fontSize:10,fontWeight:700,background:mt.bg,color:mt.color }}>{mt.icon} {m.de}</span>
                          <span style={{ flex:1,fontSize:12,fontWeight:600,color:"#374151" }}>{m.objet}</span>
                          <span style={{ fontSize:10,color:"#9ca3af" }}>{m.date.slice(11)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Apprenants en attente */}
                <div style={{ background:"#f8fafc",borderRadius:12,padding:16 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:12 }}>⏳ Apprenants en attente d'onboarding</div>
                  {apprenants.filter(a=>a.statut==="en_attente").map(a=>(
                    <div key={a.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e5e7eb",gap:10 }}>
                      <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                        <div style={{ width:36,height:36,borderRadius:"50%",background:C_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:C,flexShrink:0 }}>{a.nom[0]}</div>
                        <div>
                          <div style={{ fontSize:13,fontWeight:700 }}>{a.nom}</div>
                          <div style={{ fontSize:11,color:"#6b7280" }}>{a.offre} · Coach : {a.coach} · Niveau {a.niveau}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                        <span style={{ fontSize:11,color:"#9ca3af" }}>Depuis le {formatDate(a.dateConversion)}</span>
                        <button onClick={()=>{ setSelectedApprenant(a); setShowAppModal(true); }} style={{ padding:"5px 12px",background:C_LIGHT,color:C,border:`1px solid ${C}30`,borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:11 }}>🚀 Démarrer</button>
                      </div>
                    </div>
                  ))}
                  {apprenants.filter(a=>a.statut==="en_attente").length===0&&(
                    <div style={{ textAlign:"center",padding:20,color:"#9ca3af",fontSize:12 }}>✅ Aucun apprenant en attente</div>
                  )}
                </div>
              </div>
            )}

            {/* ══ NOUVEAUX APPRENANTS ══ */}
            {activeTab==="apprenants" && (
              <div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
                  <div>
                    <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:"#0f172a" }}>Nouveaux apprenants</h2>
                    <p style={{ margin:"4px 0 0",fontSize:12,color:"#6b7280" }}>Apprenants convertis par la commerciale, en attente d'onboarding</p>
                  </div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14 }}>
                  {apprenants.map(a=>{
                    const st = STATUT_APP[a.statut]||{};
                    const suivi = suivis.find(s=>s.apprenantId===a.id);
                    const pct = suivi ? pctChecklist(suivi.checklist) : 0;
                    return (
                      <div key={a.id} style={{ background:"#fff",borderRadius:14,border:`1.5px solid ${a.statut==="en_attente"?C+"40":"#e5e7eb"}`,overflow:"hidden",boxShadow:a.statut==="en_attente"?"0 2px 10px rgba(124,58,237,0.08)":"none" }}>
                        <div style={{ height:4,background:a.statut==="en_attente"?C:a.statut==="en_cours"?"#0891b2":"#22c55e" }}/>
                        <div style={{ padding:18 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                            <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                              <div style={{ width:40,height:40,borderRadius:"50%",background:C_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:C,flexShrink:0 }}>{a.nom[0]}</div>
                              <div>
                                <div style={{ fontWeight:800,fontSize:14,color:"#0f172a" }}>{a.nom}</div>
                                <div style={{ fontSize:11,color:"#6b7280" }}>{a.entreprise||a.profil}</div>
                              </div>
                            </div>
                            <Badge label={st.label||a.statut} color={st.color} bg={st.bg} />
                          </div>
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
                            {[
                              {l:"Formation",v:a.offre},{l:"Niveau",v:a.niveau+" — "+NIVEAUX[a.niveau]},
                              {l:"Coach assigné",v:a.coach},{l:"Date conversion",v:formatDate(a.dateConversion)},
                            ].map(s=>(
                              <div key={s.l} style={{ padding:"6px 8px",borderRadius:6,background:"#f8fafc" }}>
                                <div style={{ fontSize:9,color:"#9ca3af" }}>{s.l}</div>
                                <div style={{ fontSize:11,fontWeight:700,color:"#374151" }}>{s.v}</div>
                              </div>
                            ))}
                          </div>
                          {a.statut!=="en_attente"&&(
                            <div style={{ marginBottom:12 }}>
                              <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4 }}>
                                <span style={{ color:"#6b7280" }}>Avancement onboarding</span>
                                <span style={{ fontWeight:700,color:pct>=80?"#22c55e":pct>=40?C:"#d97706" }}>{pct}%</span>
                              </div>
                              <div style={{ height:6,background:"#e5e7eb",borderRadius:3,overflow:"hidden" }}>
                                <div style={{ height:"100%",width:`${pct}%`,background:pct>=80?"#22c55e":pct>=40?C:"#d97706",borderRadius:3,transition:"width .3s" }}/>
                              </div>
                            </div>
                          )}
                          <div style={{ display:"flex",gap:6 }}>
                            <button onClick={()=>{ setSelectedApprenant(a); setShowAppModal(true); }} style={{ flex:1,padding:"8px",background:C_LIGHT,color:C,border:`1px solid ${C}30`,borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:11,textAlign:"center" }}>🔍 Voir le dossier</button>
                            {a.statut==="en_attente"&&(
                              <button onClick={()=>{ setApprenants(prev=>prev.map(ap=>ap.id===a.id?{...ap,statut:"en_cours"}:ap)); setSuivis(prev=>[...prev,{id:Date.now(),apprenantId:a.id,apprenantNom:a.nom,coach:a.coach,dateDebut:new Date().toISOString().slice(0,10),checklist:{bienvenue:false,acces:false,kit:false,planning:false,fiche:false,briefing:false,"1ere":false,feedback:false},notes:""}]); toast.success(`Onboarding démarré pour ${a.nom} ✓`); }} style={{ padding:"8px 12px",background:C,color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:11 }}>🚀 Démarrer</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ PROGRAMMATION ══ */}
            {activeTab==="programmation" && (
              <div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
                  <div>
                    <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:"#0f172a" }}>Programmation des séances</h2>
                    <p style={{ margin:"4px 0 0",fontSize:12,color:"#6b7280" }}>Créez et envoyez les plannings de séances aux apprenants et coachs</p>
                  </div>
                  <button onClick={()=>setShowNewPlanningModal(true)} style={btnP}>+ Créer un planning</button>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14 }}>
                  {plannings.map(p=>{
                    const st=STATUT_PLANNING[p.statut]||{};
                    return (
                      <div key={p.id} style={{ background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden" }}>
                        <div style={{ padding:18 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                            <div>
                              <div style={{ fontWeight:800,fontSize:14,color:"#0f172a",marginBottom:3 }}>{p.apprenantNom}</div>
                              <div style={{ fontSize:11,color:"#6b7280" }}>{p.offre} · {p.coach}</div>
                            </div>
                            <Badge label={st.label||p.statut} color={st.color} bg={st.bg} />
                          </div>
                          <div style={{ background:"#f8fafc",borderRadius:10,padding:12,marginBottom:14 }}>
                            <div style={{ fontSize:11,fontWeight:700,color:"#374151",marginBottom:8 }}>📅 Créneaux de séances</div>
                            {p.seances.map((s,i)=>(
                              <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:i<p.seances.length-1?6:0,fontSize:12 }}>
                                <span><strong>{s.jour}</strong> à {s.heure} ({s.duree} min)</span>
                                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                                  <span style={{ fontSize:10,background:s.mode==="En ligne"?"#f0fdf4":"#fef3c7",color:s.mode==="En ligne"?"#166534":"#92400e",padding:"1px 6px",borderRadius:4 }}>{s.mode}</span>
                                  <span style={{ fontSize:10,color:"#9ca3af" }}>{s.salle}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
                            <div style={{ padding:"6px 10px",borderRadius:6,background:"#f0f9ff",textAlign:"center" }}>
                              <div style={{ fontSize:10,color:"#9ca3af" }}>Date de début</div>
                              <div style={{ fontSize:12,fontWeight:700,color:"#0891b2" }}>{formatDate(p.dateDebut)}</div>
                            </div>
                            <div style={{ padding:"6px 10px",borderRadius:6,background:"#f3e8ff",textAlign:"center" }}>
                              <div style={{ fontSize:10,color:"#9ca3af" }}>Séances prévues</div>
                              <div style={{ fontSize:12,fontWeight:700,color:C }}>{p.nbSeancesTotal} séances</div>
                            </div>
                          </div>
                          {p.statut!=="envoyé"&&(
                            <button onClick={()=>envoyerPlanning(p.id)} style={{ width:"100%",padding:"9px",background:C,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12 }}>📤 Envoyer à l'apprenant & au coach</button>
                          )}
                          {p.statut==="envoyé"&&(
                            <div style={{ padding:"8px 12px",background:"#dcfce7",borderRadius:8,fontSize:12,color:"#166534",fontWeight:700,textAlign:"center" }}>✅ Planning envoyé</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {plannings.length===0&&(
                    <div style={{ gridColumn:"1/-1",textAlign:"center",padding:40,color:"#9ca3af",fontSize:13 }}>Aucun planning créé — cliquez sur "+ Créer un planning"</div>
                  )}
                </div>
              </div>
            )}

            {/* ══ SUIVI DÉMARRAGE ══ */}
            {activeTab==="suivi" && (
              <div>
                <div style={{ marginBottom:18 }}>
                  <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:"#0f172a" }}>Suivi de démarrage</h2>
                  <p style={{ margin:"4px 0 0",fontSize:12,color:"#6b7280" }}>Checklist de chaque apprenant en cours d'onboarding</p>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  {suivis.map(s=>{
                    const pct=pctChecklist(s.checklist);
                    const app=apprenants.find(a=>a.id===s.apprenantId);
                    return (
                      <div key={s.id} style={{ background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",padding:20 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
                          <div style={{ display:"flex",gap:12,alignItems:"center" }}>
                            <div style={{ width:42,height:42,borderRadius:"50%",background:C_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:C }}>
                              {s.apprenantNom[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight:800,fontSize:14,color:"#0f172a" }}>{s.apprenantNom}</div>
                              <div style={{ fontSize:11,color:"#6b7280" }}>{app?.offre||""} · Coach : {s.coach}</div>
                              <div style={{ fontSize:11,color:"#9ca3af" }}>Début : {formatDate(s.dateDebut)}</div>
                            </div>
                          </div>
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:24,fontWeight:900,color:pct>=80?"#22c55e":pct>=40?C:"#d97706" }}>{pct}%</div>
                            <div style={{ fontSize:10,color:"#9ca3af" }}>complété</div>
                          </div>
                        </div>
                        {/* Barre de progression */}
                        <div style={{ height:8,background:"#e5e7eb",borderRadius:4,overflow:"hidden",marginBottom:16 }}>
                          <div style={{ height:"100%",width:`${pct}%`,background:pct>=80?"#22c55e":pct>=40?C:"#d97706",borderRadius:4,transition:"width .3s" }}/>
                        </div>
                        {/* Checklist */}
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                          {CHECKLIST_ITEMS.map(item=>(
                            <Checkbox
                              key={item.id}
                              checked={s.checklist[item.id]||false}
                              onChange={()=>toggleCheck(s.id,item.id)}
                              label={item.label}
                            />
                          ))}
                        </div>
                        {s.notes&&(
                          <div style={{ marginTop:12,padding:"8px 12px",borderRadius:8,background:"#f8fafc",border:"1px solid #e2e8f0",fontSize:12,color:"#374151",fontStyle:"italic" }}>📝 {s.notes}</div>
                        )}
                        {pct===100&&(
                          <div style={{ marginTop:12,padding:"10px 14px",borderRadius:10,background:"#dcfce7",border:"1px solid #bbf7d0",fontSize:13,color:"#166534",fontWeight:700,textAlign:"center" }}>
                            🎉 Onboarding complet ! L'apprenant est pleinement intégré.
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {suivis.length===0&&(
                    <div style={{ textAlign:"center",padding:40,color:"#9ca3af",fontSize:13 }}>Aucun suivi en cours — démarrez l'onboarding depuis l'onglet "Nouveaux apprenants"</div>
                  )}
                </div>
              </div>
            )}

            {/* ══ BILANS & RENOUVELLEMENTS ══ */}
            {activeTab==="bilans" && (
              <div>
                <div style={{ marginBottom:18 }}>
                  <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:"#0f172a" }}>Bilans & Renouvellements</h2>
                  <p style={{ margin:"4px 0 0",fontSize:12,color:"#6b7280" }}>Apprenants en fin de cycle — préparez le bilan et déclenchez l'alerte commerciale</p>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:16 }}>
                  {bilans.map(b=>(
                    <div key={b.id} style={{ background:"#fff",borderRadius:14,border:`1.5px solid ${b.alerteCommerciale?"#22c55e30":"#fde68a"}`,overflow:"hidden" }}>
                      <div style={{ height:5,background:b.alerteCommerciale?"#22c55e":"#f59e0b" }}/>
                      <div style={{ padding:20 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                          <div>
                            <div style={{ fontWeight:800,fontSize:15,color:"#0f172a",marginBottom:3 }}>{b.apprenantNom}</div>
                            <div style={{ fontSize:12,color:"#6b7280" }}>{b.offre} · {b.coach}</div>
                          </div>
                          {b.alerteCommerciale
                            ? <Badge label="✅ Alerte envoyée" color="#166534" bg="#dcfce7" />
                            : <Badge label="⚠️ Action requise"  color="#92400e" bg="#fef3c7" />
                          }
                        </div>
                        {/* Résultats */}
                        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14 }}>
                          {[
                            { l:"Niveau initial",v:b.niveauDebut,c:"#6b7280" },
                            { l:"Niveau final",  v:b.niveauFin,  c:"#22c55e" },
                            { l:"Note finale",   v:`${b.noteFinale}%`,c:b.noteFinale>=70?"#22c55e":b.noteFinale>=50?"#f59e0b":"#ef4444" },
                            { l:"Séances",       v:b.nbSeances,  c:"#0891b2" },
                            { l:"Présence",      v:`${b.tauxPresence}%`,c:b.tauxPresence>=80?"#22c55e":"#f59e0b" },
                            { l:"Renouvellement",v:b.renouvellement,c:C },
                          ].map(s=>(
                            <div key={s.l} style={{ padding:"8px 10px",borderRadius:8,background:"#f8fafc",textAlign:"center" }}>
                              <div style={{ fontSize:9,color:"#9ca3af" }}>{s.l}</div>
                              <div style={{ fontSize:13,fontWeight:800,color:s.c,marginTop:2 }}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        {/* Commentaire coach */}
                        <div style={{ padding:"10px 14px",borderRadius:10,background:"#f0f9ff",border:"1px solid #bae6fd",fontSize:12,color:"#374151",marginBottom:16,lineHeight:1.6 }}>
                          💬 <strong>Commentaire coach :</strong> {b.commentaire}
                        </div>
                        {/* Offre de renouvellement */}
                        <div style={{ padding:"10px 14px",borderRadius:10,background:`${C_LIGHT}`,border:`1px solid ${C}30`,fontSize:12,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                          <div><div style={{ fontSize:10,color:C,fontWeight:700 }}>OFFRE DE RENOUVELLEMENT</div><div style={{ fontWeight:800,color:"#0f172a",marginTop:2 }}>{b.renouvellement}</div></div>
                          <span style={{ fontSize:22 }}>🎓</span>
                        </div>
                        {!b.alerteCommerciale
                          ? <button onClick={()=>envoyerAlerteCommerciale(b.id)} style={{ width:"100%",padding:"10px",background:"#d97706",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13 }}>📣 Envoyer l'alerte de renouvellement à la Commerciale</button>
                          : <div style={{ padding:"10px",background:"#dcfce7",borderRadius:8,fontSize:13,color:"#166534",fontWeight:700,textAlign:"center" }}>✅ Alerte commerciale envoyée — suivi en cours</div>
                        }
                      </div>
                    </div>
                  ))}
                  {bilans.length===0&&(
                    <div style={{ gridColumn:"1/-1",textAlign:"center",padding:40,color:"#9ca3af",fontSize:13 }}>Aucun bilan à traiter actuellement</div>
                  )}
                </div>
              </div>
            )}

            {/* ══ NOTIFICATIONS ══ */}
            {activeTab==="notifications" && (
              <div style={{ padding: "24px 0" }}>
                <NotificationsTab userId={profil?.id} accentColor="#7c3aed" />
              </div>
            )}

            {/* ══ MESSAGES ══ */}
            {activeTab==="messages" && (
              <div style={{ display:"flex",gap:0,height:540,border:"1px solid #e5e7eb",borderRadius:12,overflow:"hidden" }}>
                {/* Liste */}
                <div style={{ width:260,borderRight:"1px solid #e5e7eb",overflowY:"auto",background:"#fafafa" }}>
                  <div style={{ padding:"12px 14px",borderBottom:"1px solid #e5e7eb",fontSize:12,fontWeight:700,color:"#374151" }}>Conversations ({messages.length})</div>
                  {messages.map(m=>{
                    const mt=MSG_TYPE[m.type]||{};
                    return (
                      <div key={m.id} onClick={()=>{ setSelectedMsg(m); marquerLu(m.id); }} style={{
                        padding:"12px 14px",borderBottom:"1px solid #f1f5f9",cursor:"pointer",
                        background:selectedMsg?.id===m.id?C_LIGHT:"transparent",
                        display:"flex",gap:10,alignItems:"flex-start"
                      }}>
                        <div style={{ width:36,height:36,borderRadius:"50%",background:mt.bg||C_LIGHT,color:mt.color||C,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0 }}>{m.avatar}</div>
                        <div style={{ minWidth:0,flex:1 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                            <span style={{ fontSize:11,fontWeight:700,color:"#0f172a",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis" }}>{m.de}</span>
                            {!m.lu&&<span style={{ width:7,height:7,borderRadius:"50%",background:"#ef4444",flexShrink:0 }}/>}
                          </div>
                          <div style={{ fontSize:10,color:"#6b7280",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",marginTop:2 }}>{m.objet}</div>
                          <div style={{ fontSize:9,color:"#9ca3af",marginTop:2 }}>{m.date.slice(0,10)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Zone de lecture */}
                {selectedMsg ? (
                  <div style={{ flex:1,display:"flex",flexDirection:"column" }}>
                    <div style={{ padding:"14px 20px",borderBottom:"1px solid #e5e7eb",background:"#fff" }}>
                      <div style={{ fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:3 }}>{selectedMsg.objet}</div>
                      <div style={{ fontSize:11,color:"#6b7280" }}>De : <strong>{selectedMsg.de}</strong> · {selectedMsg.email} · {selectedMsg.date}</div>
                    </div>
                    <div style={{ flex:1,padding:"20px 24px",background:"#f8fafc",overflowY:"auto" }}>
                      <div style={{ background:"#fff",borderRadius:12,padding:20,fontSize:13,color:"#374151",lineHeight:1.8,boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>{selectedMsg.texte}</div>
                    </div>
                    <div style={{ padding:"12px 20px",borderTop:"1px solid #e5e7eb",background:"#fff",display:"flex",gap:8 }}>
                      <input value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Répondre..." style={{ flex:1,padding:"9px 14px",borderRadius:20,border:"1px solid #e5e7eb",fontSize:12,outline:"none" }} onKeyDown={e=>{ if(e.key==="Enter"&&replyText.trim()){ toast.success("Réponse envoyée ✓"); setReplyText(""); }}}/>
                      <button onClick={()=>{ if(replyText.trim()){ toast.success("Réponse envoyée ✓"); setReplyText(""); }}} style={{ padding:"9px 18px",background:C,color:"#fff",border:"none",borderRadius:20,cursor:"pointer",fontWeight:700,fontSize:12 }}>Envoyer</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#9ca3af",fontSize:13 }}>Sélectionnez un message</div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══ MODAL DOSSIER APPRENANT ══ */}
      {showAppModal&&selectedApprenant&&(
        <Modal title={`🎓 Dossier — ${selectedApprenant.nom}`} onClose={()=>{ setShowAppModal(false); setSelectedApprenant(null); }} wide>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16 }}>
            <div style={{ padding:14,borderRadius:10,background:"#f0f9ff",border:"1px solid #bae6fd" }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#0369a1",marginBottom:10 }}>👤 Informations personnelles</div>
              {[["Nom complet",selectedApprenant.nom],["Email",selectedApprenant.email],["Téléphone",selectedApprenant.telephone||"—"],["Profil",selectedApprenant.profil],["Entreprise",selectedApprenant.entreprise||"Particulier"]].map(([l,v])=>(
                <div key={l} style={{ display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12 }}><span style={{ color:"#6b7280" }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span></div>
              ))}
            </div>
            <div style={{ padding:14,borderRadius:10,background:C_LIGHT,border:`1px solid ${C}30` }}>
              <div style={{ fontSize:11,fontWeight:700,color:C,marginBottom:10 }}>📚 Formation assignée</div>
              {[["Offre",selectedApprenant.offre],["Niveau test",selectedApprenant.niveau+" — "+NIVEAUX[selectedApprenant.niveau]],["Coach",selectedApprenant.coach],["Conversion",formatDate(selectedApprenant.dateConversion)]].map(([l,v])=>(
                <div key={l} style={{ display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12 }}><span style={{ color:"#6b7280" }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span></div>
              ))}
            </div>
          </div>
          <div style={{ padding:"12px 16px",borderRadius:10,background:"#fef9ee",border:"1px solid #fde68a",marginBottom:16 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#92400e",marginBottom:4 }}>🎯 Objectif pédagogique</div>
            <div style={{ fontSize:13,color:"#374151",lineHeight:1.6 }}>{selectedApprenant.objectif}</div>
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12,fontWeight:700,color:"#374151",marginBottom:10 }}>✅ Actions d'onboarding à réaliser</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {CHECKLIST_ITEMS.map(item=>(
                <div key={item.id} style={{ padding:"8px 12px",borderRadius:8,background:"#f8fafc",border:"1px solid #e5e7eb",fontSize:12,display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:16,flexShrink:0 }}>⬜</span>{item.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            {selectedApprenant.statut==="en_attente"&&(
              <button onClick={()=>{ setApprenants(prev=>prev.map(a=>a.id===selectedApprenant.id?{...a,statut:"en_cours"}:a)); setSuivis(prev=>[...prev,{id:Date.now(),apprenantId:selectedApprenant.id,apprenantNom:selectedApprenant.nom,coach:selectedApprenant.coach,dateDebut:new Date().toISOString().slice(0,10),checklist:{bienvenue:false,acces:false,kit:false,planning:false,fiche:false,briefing:false,"1ere":false,feedback:false},notes:""}]); toast.success(`Onboarding démarré pour ${selectedApprenant.nom} ✓`); setShowAppModal(false); setActiveTab("suivi"); }} style={{ ...btnP,background:"#22c55e" }}>🚀 Démarrer l'onboarding</button>
            )}
            <button onClick={()=>{ setShowAppModal(false); setSelectedApprenant(null); }} style={btnS}>Fermer</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL NOUVEAU PLANNING ══ */}
      {showNewPlanningModal&&(
        <Modal title="📅 Créer un nouveau planning" onClose={()=>setShowNewPlanningModal(false)}>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Apprenant *</label>
            <select style={inp} value={planningForm.apprenantId} onChange={e=>setPlanningForm(f=>({...f,apprenantId:e.target.value}))}>
              <option value="">— Sélectionner —</option>
              {apprenants.filter(a=>a.statut!=="terminé").map(a=><option key={a.id} value={a.id}>{a.nom} ({a.offre})</option>)}
            </select>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Date de début</label>
            <input type="date" style={inp} value={planningForm.dateDebut} onChange={e=>setPlanningForm(f=>({...f,dateDebut:e.target.value}))}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Nombre de séances total</label>
            <input type="number" min={4} max={60} style={inp} value={planningForm.nbSeancesTotal} onChange={e=>setPlanningForm(f=>({...f,nbSeancesTotal:Number(e.target.value)}))}/>
          </div>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
            <button onClick={()=>setShowNewPlanningModal(false)} style={btnS}>Annuler</button>
            <button onClick={()=>{
              if(!planningForm.apprenantId||!planningForm.dateDebut){ toast.error("Remplissez tous les champs requis"); return; }
              const app=apprenants.find(a=>a.id===Number(planningForm.apprenantId));
              setPlannings(prev=>[...prev,{
                id:Date.now(),apprenantId:Number(planningForm.apprenantId),apprenantNom:app?.nom||"",
                coach:app?.coach||"",offre:app?.offre||"",
                seances:[{jour:"Lundi",heure:"09:00",duree:90,mode:"Présentiel",salle:"À définir",statut:"à_confirmer"}],
                dateDebut:planningForm.dateDebut,nbSeancesTotal:planningForm.nbSeancesTotal,statut:"en_préparation"
              }]);
              toast.success("Planning créé ✓ — ajoutez les créneaux depuis l'onglet Programmation");
              setShowNewPlanningModal(false);
              setPlanningForm({apprenantId:"",dateDebut:"",nbSeancesTotal:20});
            }} style={btnP}>✅ Créer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
