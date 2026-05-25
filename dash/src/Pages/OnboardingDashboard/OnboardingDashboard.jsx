// src/Pages/OnboardingDashboard/OnboardingDashboard.jsx
import React, { useState, useMemo, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import NotificationsTab from "../../Components/NotificationsTab";
import MessagerieTab from "../../Components/MessagerieTab";

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
  { id:"bienvenue", label:"Email de bienvenue envoyé",        icon:"✉️" },
  { id:"acces",     label:"Lien espace apprenant transmis",   icon:"🔗" },
  { id:"kit",       label:"Lien matériel de cours envoyé",    icon:"📚" },
  { id:"planning",  label:"Planning des séances envoyé",      icon:"📅" },
];

const INIT_SUIVIS = [
  { id:1, apprenantId:1, apprenantNom:"Adjoua Koné",    coach:"Prof. Martin", dateDebut:"2026-01-13", checklist:{ bienvenue:true,acces:false,kit:false,planning:false }, notes:"" },
  { id:2, apprenantId:2, apprenantNom:"Ibrahim Traoré", coach:"Prof. Smith",  dateDebut:"2026-01-14", checklist:{ bienvenue:true,acces:true,kit:true,planning:true },  notes:"Apprenant très motivé, niveau réel peut-être B1" },
  { id:3, apprenantId:6, apprenantNom:"Kofi Mensah",    coach:"Prof. Smith",  dateDebut:"2026-01-15", checklist:{ bienvenue:true,acces:true,kit:false,planning:false }, notes:"" },
];

const INIT_BILANS = [
  { id:1, apprenantNom:"Marie Dupont",    offre:"Business English",   coach:"Prof. Dubois", dateFin:"2025-12-31", niveauDebut:"B2", niveauFin:"C1", nbSeances:24, tauxPresence:92, noteFinale:87, commentaire:"Excellente progression. A atteint tous ses objectifs. Recommande fortement le niveau C1→C2.", alerteCommerciale:false, renouvellement:"C1→C2" },
  { id:2, apprenantNom:"Fatoumata Diallo",offre:"Anglais Pro B2",     coach:"Prof. Martin", dateDebutBilan:"2026-01-20", niveauDebut:"B1", niveauFin:"B2", nbSeances:20, tauxPresence:85, noteFinale:79, commentaire:"Bonne progression à l'oral. Potentiel pour le TOEIC.", alerteCommerciale:false, renouvellement:"Certification TOEIC" },
];


/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

export default function OnboardingDashboard() {
  const profil = JSON.parse(localStorage.getItem("admin_profil") || "{}");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [apprenants, setApprenants] = useState(INIT_APPRENANTS);
  const [plannings, setPlannings] = useState(INIT_PLANNINGS);
  const [suivis, setSuivis] = useState(INIT_SUIVIS);
  const [bilans, setBilans] = useState(INIT_BILANS);

  // Modaux
  const [showAppModal, setShowAppModal]           = useState(false);
  const [selectedApprenant, setSelectedApprenant] = useState(null);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [selectedPlanning, setSelectedPlanning]   = useState(null);
  const [showSuiviModal, setShowSuiviModal]       = useState(false);
  const [selectedSuivi, setSelectedSuivi]         = useState(null);
  const [showBilanModal, setShowBilanModal]       = useState(false);
  const [selectedBilan, setSelectedBilan]         = useState(null);

  // Nouveau planning form
  const [showNewPlanningModal, setShowNewPlanningModal] = useState(false);
  const [planningForm, setPlanningForm] = useState({ apprenantId:"", dateDebut:"", nbSeancesTotal:20 });

  // Groupes state
  const [groupes, setGroupes] = useState([]);
  const [groupesLoading, setGroupesLoading] = useState(false);
  const [selectedGroupe, setSelectedGroupe] = useState(null);
  const [groupeDetail, setGroupeDetail] = useState({ apprenants:[], fichiers:[] });
  const [showCreateGroupe, setShowCreateGroupe] = useState(false);
  const [showAddApprenant, setShowAddApprenant] = useState(false);
  const [allStaff, setAllStaff]   = useState([]);
  const [coaches, setCoaches]     = useState([]);
  const [groupeForm, setGroupeForm] = useState({ nom:"", niveau:"", filiere:"", type_cours:"en_ligne", coach_id:"", date_debut:"", date_fin:"", capacite_max:20, horaire:[] });
  const [apprenantForm, setApprenantForm] = useState({ nom_apprenant:"", prenom_apprenant:"", email_apprenant:"", telephone:"", niveau:"" });
  const [horaireTmp, setHoraireTmp] = useState({ jour:"Lun", debut:"08:00", fin:"10:00" });
  const [groupeSaving, setGroupeSaving] = useState(false);
  const [showEditGroupe, setShowEditGroupe] = useState(false);

  // ── Apprenant detail modal ───────────────────────────────────
  const [selectedApprenantGroupe, setSelectedApprenantGroupe]       = useState(null);
  const [apprenantTab, setApprenantTab]                 = useState("profil");
  const [apprenantTest, setApprenantTest]               = useState(null);
  const [apprenantTestLoading, setApprenantTestLoading] = useState(false);
  const [apprenantPresences, setApprenantPresences]     = useState([]);
  const [apprenantPresLoading, setApprenantPresLoading] = useState(false);

  // ── Transfert de groupe ──────────────────────────────────────
  const [showTransfert,        setShowTransfert]        = useState(false);
  const [transfertForm,        setTransfertForm]        = useState({ nouveau_groupe_id:"", motif:"", initiateur:"apprenant", jours:[], creneau:"" });
  const [groupesCibles,        setGroupesCibles]        = useState([]);
  const [groupesCiblesLoading, setGroupesCiblesLoading] = useState(false);
  const [transfertSaving,      setTransfertSaving]      = useState(false);

  // ── Groupes sub-tabs: Historique cours & Présences ──────────────────────
  const [obCoursList, setObCoursList]         = useState([]);
  const [obCoursLoading, setObCoursLoading]   = useState(false);
  const [obPresences, setObPresences]         = useState([]);
  const [obGroupeSubTab, setObGroupeSubTab]   = useState("apprenants"); // apprenants | cours | presences
  const [obCoursFiltreMois, setObCoursFiltreMois] = useState(() => new Date().getMonth()+1);
  const [obCoursAnnee, setObCoursAnnee]       = useState(() => new Date().getFullYear());

  const enAttente = useMemo(() => apprenants.filter(a=>a.statut==="en_attente").length, [apprenants]);
  const enCours   = useMemo(() => apprenants.filter(a=>a.statut==="en_cours").length, [apprenants]);
  const bilansDus  = useMemo(() => bilans.filter(b=>!b.alerteCommerciale).length, [bilans]);

  // Fetch groupes and coaches
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    setGroupesLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/groupes`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.ok?r.json():{groupes:[]}),
      fetch(`${API_URL}/api/admin/utilisateurs`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.ok?r.json():{utilisateurs:[]})
    ]).then(([gData, uData]) => {
      setGroupes(gData.groupes || []);
      const staff = uData.utilisateurs || [];
      setAllStaff(staff);
      setCoaches(staff.filter(u => u.role === "coach" && u.actif));
    }).catch(()=>{}).finally(()=>setGroupesLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!selectedGroupe) return;
    if (obGroupeSubTab === "cours") fetchObCours();
    if (obGroupeSubTab === "presences") fetchObPresences();
  }, [obGroupeSubTab, selectedGroupe, obCoursFiltreMois, obCoursAnnee]);

  // Fetch "Mes apprenants" réels depuis l'API
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab !== "mes_apprenants") return;
    setMesAppLoading(true);
    const token = localStorage.getItem("admin_token");
    fetch(`${API_URL}/api/groupes/apprenants`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { apprenants:[] })
      .then(d => setMesApprenants(d.apprenants || []))
      .catch(() => {})
      .finally(() => setMesAppLoading(false));
  }, [activeTab]);

  const fetchGroupeDetail = async (groupe) => {
    const token = localStorage.getItem("admin_token");
    setObGroupeSubTab("apprenants");
    setObCoursList([]); setObPresences([]);
    setSelectedGroupe(groupe);
    try {
      const r = await fetch(`${API_URL}/api/groupes/${groupe.id}`, { headers: { Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setGroupeDetail({ apprenants: d.apprenants || [], fichiers: d.fichiers || [] });
    } catch {}
  };

  const openApprenantDetail = async (a) => {
    setSelectedApprenantGroupe(a);
    setApprenantTab("profil");
    setApprenantTest(null);
    setApprenantPresences([]);
    // Fetch test de niveau par email
    if (a.email_apprenant) {
      setApprenantTestLoading(true);
      try {
        const r = await fetch(`${API_URL}/api/level-test/result?email=${encodeURIComponent(a.email_apprenant)}`);
        if (r.ok) { const d = await r.json(); setApprenantTest(d.result || null); }
      } catch {} finally { setApprenantTestLoading(false); }
    }
  };

  const searchGroupesCibles = async (niveau) => {
    if (!niveau) return;
    setGroupesCiblesLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const r = await fetch(`${API_URL}/api/groupes?niveau=${encodeURIComponent(niveau)}&statut=actif`, { headers:{ Authorization:`Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        setGroupesCibles((d.groupes||[]).filter(g => g.id !== selectedGroupe?.id));
      }
    } catch {} finally { setGroupesCiblesLoading(false); }
  };

  const executerTransfert = async () => {
    if (!transfertForm.nouveau_groupe_id) { toast.error("Sélectionnez un groupe cible"); return; }
    setTransfertSaving(true);
    const token = localStorage.getItem("admin_token");
    try {
      const dispoStr = [transfertForm.jours.join(", "), transfertForm.creneau].filter(Boolean).join(" — ") || "—";
      const motifFinal = transfertForm.motif || `Changement de disponibilités. Créneaux souhaités : ${dispoStr}`;
      const r = await fetch(`${API_URL}/api/groupes/transfert`, {
        method:"POST",
        headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({
          ga_id:             selectedApprenantGroupe.id,
          nouveau_groupe_id: transfertForm.nouveau_groupe_id,
          motif:             motifFinal,
          initiateur:        transfertForm.initiateur,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      toast.success(d.message || "Transfert effectué ✓");
      setShowTransfert(false);
      setSelectedApprenantGroupe(null);
      const gr = await fetch(`${API_URL}/api/groupes`, { headers:{ Authorization:`Bearer ${token}` } });
      if (gr.ok) { const gd = await gr.json(); setGroupes(gd.groupes||[]); }
    } catch (e) { toast.error(e.message); } finally { setTransfertSaving(false); }
  };

  const fetchApprenantPresences = async (a) => {
    if (!selectedGroupe) return;
    setApprenantPresLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const r = await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/presences`, { headers:{ Authorization:`Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        setApprenantPresences((d.presences || []).filter(p => p.ga_id === a.id || (p.nom_apprenant === a.nom_apprenant && p.prenom_apprenant === a.prenom_apprenant)));
      }
    } catch {} finally { setApprenantPresLoading(false); }
  };

  const createGroupe = async () => {
    if (!groupeForm.nom.trim()) { toast.error("Le nom du groupe est requis"); return; }
    const token = localStorage.getItem("admin_token");
    setGroupeSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/groupes`, {
        method:"POST",
        headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({ ...groupeForm, coach_id: groupeForm.coach_id || null })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setGroupes(prev => [{ ...d.groupe, nb_apprenants:0 }, ...prev]);
      setShowCreateGroupe(false);
      setGroupeForm({ nom:"", niveau:"", filiere:"", type_cours:"en_ligne", coach_id:"", date_debut:"", date_fin:"", capacite_max:20, horaire:[] });
      toast.success("Groupe créé ✓");
    } catch(e) { toast.error(e.message || "Erreur création"); }
    finally { setGroupeSaving(false); }
  };

  const editGroupe = async () => {
    if (!groupeForm.nom.trim()) { toast.error("Le nom du groupe est requis"); return; }
    const token = localStorage.getItem("admin_token");
    setGroupeSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}`, {
        method:"PATCH",
        headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({ ...groupeForm, coach_id: groupeForm.coach_id || null })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const updated = d.groupe || { ...selectedGroupe, ...groupeForm };
      setGroupes(prev => prev.map(g => g.id===selectedGroupe.id ? {...g,...updated} : g));
      setSelectedGroupe(prev => ({...prev,...updated}));
      setShowEditGroupe(false);
      toast.success("Groupe mis à jour ✓");
    } catch(e) { toast.error(e.message || "Erreur modification"); }
    finally { setGroupeSaving(false); }
  };

  const addApprenant = async () => {
    if (!apprenantForm.nom_apprenant.trim()) { toast.error("Nom requis"); return; }
    const token = localStorage.getItem("admin_token");
    try {
      const r = await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/apprenants`, {
        method:"POST",
        headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify(apprenantForm)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setGroupeDetail(prev => ({ ...prev, apprenants:[...prev.apprenants, d.apprenant] }));
      setGroupes(prev => prev.map(g => g.id===selectedGroupe.id ? {...g, nb_apprenants:(g.nb_apprenants||0)+1} : g));
      setSelectedGroupe(prev => ({...prev, nb_apprenants:(prev.nb_apprenants||0)+1}));
      setShowAddApprenant(false);
      setApprenantForm({ nom_apprenant:"", prenom_apprenant:"", email_apprenant:"", telephone:"", niveau:"" });
      toast.success("Apprenant ajouté ✓");
    } catch(e) { toast.error(e.message || "Erreur ajout"); }
  };

  const removeApprenant = async (aid, nomApprenant) => {
    if (!window.confirm(`Retirer ${nomApprenant} de ce groupe ?`)) return;
    const token = localStorage.getItem("admin_token");
    try {
      await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/apprenants/${aid}`, {
        method:"DELETE", headers:{ Authorization:`Bearer ${token}` }
      });
      setGroupeDetail(prev => ({ ...prev, apprenants: prev.apprenants.map(a => a.id===aid ? {...a, statut:"retire"} : a) }));
      toast.success("Apprenant retiré ✓");
    } catch { toast.error("Erreur"); }
  };

  const fetchObCours = async () => {
    if (!selectedGroupe) return;
    const token = localStorage.getItem("admin_token");
    setObCoursLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/cours?mois=${obCoursFiltreMois}&annee=${obCoursAnnee}`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setObCoursList(d.cours||[]);
    } catch {} finally { setObCoursLoading(false); }
  };

  const fetchObPresences = async () => {
    if (!selectedGroupe) return;
    const token = localStorage.getItem("admin_token");
    try {
      const r = await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/presences`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setObPresences(d.presences||[]);
    } catch {}
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "–";

  const pctChecklist = (cl) => {
    const keys = CHECKLIST_ITEMS.map(i => i.id);
    const vals = keys.map(k => cl[k] || false);
    return Math.round((vals.filter(Boolean).length / keys.length) * 100);
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

  // ── Modal Dossier Réception + Affectation Coach + Groupe (3 étapes) ─
  const DOSSIER_INIT = { nom:"", prenom:"", email:"", telephone:"", niveau:"", programme:"", description:"", attentes:"", date_debut_supposee:"", date_renouvellement_supposee:"", coach_id:"", coach_nom:"" };
  const [showDossierModal,     setShowDossierModal]     = useState(false);
  const [dossierTarget,        setDossierTarget]        = useState(null);
  const [dossierStep,          setDossierStep]          = useState(1);
  const [dossierForm,          setDossierForm]          = useState(DOSSIER_INIT);
  const [dossierCoachQ,        setDossierCoachQ]        = useState("");
  const [dossierSelectedCoach, setDossierSelectedCoach] = useState(null);
  const [dossierSelectedGroupe,setDossierSelectedGroupe]= useState(null);
  const [dossierCreerGroupe,   setDossierCreerGroupe]   = useState(false);
  const [dossierNouveauGroupe, setDossierNouveauGroupe] = useState({ nom:"", date_debut:"", capacite_max:20 });
  const [dossierSaving,        setDossierSaving]        = useState(false);

  const openDossierModal = (a) => {
    setDossierTarget(a);
    setDossierForm({
      nom: a.nom || "", prenom: "", email: a.email || "", telephone: a.telephone || "",
      niveau: a.niveau || "", programme: a.offre || "", description: "", attentes: "",
      date_debut_supposee: "", date_renouvellement_supposee: "",
      coach_id: "", coach_nom: a.coach || "",
    });
    setDossierStep(1);
    setDossierSelectedCoach(null);
    setDossierCoachQ("");
    setDossierSelectedGroupe(null);
    setDossierCreerGroupe(false);
    setDossierNouveauGroupe({ nom:"", date_debut:"", capacite_max:20 });
    setShowDossierModal(true);
  };

  // Groupes du coach sélectionné filtrés par niveau de l'apprenant
  const groupesCoachNiveau = groupes.filter(g =>
    g.coach_id === dossierSelectedCoach?.id &&
    g.niveau   === dossierForm.niveau &&
    g.statut   === "actif"
  );
  const groupesDisponibles = groupesCoachNiveau.filter(g => (g.nb_apprenants||0) < (g.capacite_max||20));
  const tousComplets       = groupesCoachNiveau.length > 0 && groupesDisponibles.length === 0;

  const confirmerAffectation = async () => {
    if (!dossierCreerGroupe && !dossierSelectedGroupe) { toast.error("Sélectionnez un groupe ou créez-en un"); return; }
    const token = localStorage.getItem("admin_token");
    const coachNom = dossierSelectedCoach
      ? `${dossierSelectedCoach.prenom||""} ${dossierSelectedCoach.nom||""}`.trim()
      : dossierForm.coach_nom;
    setDossierSaving(true);
    try {
      let groupeId = dossierSelectedGroupe?.id;

      // Créer un nouveau groupe si demandé
      if (dossierCreerGroupe) {
        const nomGroupe = dossierNouveauGroupe.nom ||
          `${dossierForm.programme} — ${dossierForm.niveau} (Nouveau)`;
        const r = await fetch(`${API_URL}/api/groupes`, {
          method: "POST",
          headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
          body: JSON.stringify({
            nom:          nomGroupe,
            niveau:       dossierForm.niveau,
            filiere:      dossierForm.programme,
            type_cours:   "en_ligne",
            coach_id:     dossierSelectedCoach?.id || null,
            date_debut:   dossierNouveauGroupe.date_debut || dossierForm.date_debut_supposee || null,
            capacite_max: dossierNouveauGroupe.capacite_max || 20,
          }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Erreur création groupe");
        groupeId = d.groupe.id;
        // Coach notifié automatiquement par l'API
        setGroupes(prev => [{ ...d.groupe, nb_apprenants:0 }, ...prev]);
        toast(`📣 Groupe "${nomGroupe}" créé — coach notifié`, { icon:"👥" });
      }

      // Ajouter l'apprenant au groupe
      if (groupeId) {
        const r2 = await fetch(`${API_URL}/api/groupes/${groupeId}/apprenants`, {
          method: "POST",
          headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
          body: JSON.stringify({
            nom_apprenant:    dossierForm.nom,
            prenom_apprenant: dossierForm.prenom,
            email_apprenant:  dossierForm.email,
            telephone:        dossierForm.telephone,
            niveau:           dossierForm.niveau,
            note: JSON.stringify({
              programme:           dossierForm.programme,
              description:         dossierForm.description,
              attentes:            dossierForm.attentes,
              date_debut:          dossierForm.date_debut_supposee,
              date_renouvellement: dossierForm.date_renouvellement_supposee,
            }),
          }),
        });
        const d2 = await r2.json();
        if (!r2.ok) throw new Error(d2.error || "Erreur ajout apprenant au groupe");
        // Coach notifié automatiquement par l'API
        // Mettre à jour le compteur local
        setGroupes(prev => prev.map(g => g.id===groupeId ? {...g, nb_apprenants:(g.nb_apprenants||0)+1} : g));
      }

      // Mettre à jour l'apprenant localement
      const groupeNom = dossierCreerGroupe
        ? (dossierNouveauGroupe.nom || `${dossierForm.programme} — ${dossierForm.niveau}`)
        : dossierSelectedGroupe?.nom || "";
      setApprenants(prev => prev.map(ap => ap.id === dossierTarget.id
        ? { ...ap, statut:"en_cours", coach:coachNom,
            nom: dossierForm.nom || ap.nom, email: dossierForm.email || ap.email,
            telephone: dossierForm.telephone || ap.telephone,
            niveau: dossierForm.niveau || ap.niveau, offre: dossierForm.programme || ap.offre,
            groupe_nom: groupeNom,
          }
        : ap
      ));
      setSuivis(prev => [...prev, {
        id: Date.now(), apprenantId: dossierTarget.id,
        apprenantNom: `${dossierForm.prenom} ${dossierForm.nom}`.trim() || dossierTarget.nom,
        coach: coachNom, dateDebut: dossierForm.date_debut_supposee || new Date().toISOString().slice(0,10),
        checklist:{ bienvenue:false,acces:false,kit:false,planning:false },
        notes: dossierForm.attentes || "",
      }]);
      toast.success(`✅ ${dossierForm.nom} → ${coachNom} → ${groupeNom} — Onboarding démarré !`);
      setShowDossierModal(false);
    } catch(e) {
      toast.error(e.message || "Erreur lors de la finalisation");
    } finally {
      setDossierSaving(false);
    }
  };

  // ── Mes apprenants (données réelles) ─────────────────────────────
  const [mesApprenants,      setMesApprenants]      = useState([]);
  const [mesAppLoading,      setMesAppLoading]      = useState(false);
  const [mesAppSearch,       setMesAppSearch]       = useState("");
  const [mesAppNiveau,       setMesAppNiveau]       = useState("tous");
  const [mesAppStatut,       setMesAppStatut]       = useState("tous");
  const [mesAppGroupe,       setMesAppGroupe]       = useState("tous");

  const PROGRAMMES = ["Anglais Général","Anglais Pro B2","Business English","Certification TOEIC","Certification IELTS","Formation Entreprise","Anglais Enfants","Autre"];
  const NIVEAU_COLOR = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };

  const TABS = [
    { key:"dashboard",      label:"Tableau de bord",         icon:"📊" },
    { key:"apprenants",     label:"Nouveaux apprenants",      icon:"📥", badge:enAttente },
    { key:"mes_apprenants", label:"Mes apprenants",           icon:"🎓", badge:mesApprenants.filter(a=>a.statut==="actif"||a.statut==="periode_test").length || null },
    { key:"programmation",  label:"Programmation",            icon:"📅", badge:plannings.filter(p=>p.statut!=="envoyé").length },
    { key:"suivi",          label:"Suivi démarrage",          icon:"✅" },
    { key:"bilans",         label:"Bilans & Renouvellements", icon:"📋", badge:bilansDus },
    { key:"groupes",        label:"Groupes",                  icon:"👥", badge:groupes.filter(g=>g.statut==="actif").length || null },
    { key:"messages",       label:"Messages",                 icon:"💬" },
    { key:"notifications",  label:"Notifications",            icon:"🔔" },
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
            { l:"Plannings à envoyer",    v:plannings.filter(p=>p.statut!=="envoyé").length, c:"#a5f3fc" },
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

                {/* Workflow Onboarding */}
                <div style={{ background:"#f8fafc",borderRadius:14,padding:20,marginBottom:20 }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:"#0f172a" }}>🔄 Workflow Onboarding</div>
                    <span style={{ fontSize:11,color:"#9ca3af" }}>6 étapes · automatisées &amp; manuelles</span>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:0 }}>
                    {[
                      {
                        n:1, icon:"📥", label:"Réception du dossier",
                        action:"Inscription validée + paiement confirmé → dossier arrive dans la file d'attente Onboarding",
                        systeme:"Auto", couleur:"#7c3aed", bg:"#f3e8ff",
                        stat:enAttente, statLabel:"en attente",
                      },
                      {
                        n:2, icon:"🎯", label:"Niveau vérifié",
                        action:"Résultat test de niveau vérifié (ou placement test humain effectué)",
                        systeme:"Manuel", couleur:"#0891b2", bg:"#e0f2fe",
                        stat:null,
                      },
                      {
                        n:3, icon:"👥", label:"Affectation classe",
                        action:"Classe proposée automatiquement → confirmation par l'assistante Onboarding",
                        systeme:"Auto + Manuel", couleur:"#6366f1", bg:"#ede9fe",
                        stat:groupes.filter(g=>g.statut==="actif").length, statLabel:"groupes actifs",
                      },
                      {
                        n:4, icon:"👨‍🏫", label:"Affectation coach",
                        action:"Coach disponible affecté à la classe (ou déjà affecté si classe existante)",
                        systeme:"Manuel", couleur:"#d97706", bg:"#fef3c7",
                        stat:null,
                      },
                      {
                        n:5, icon:"✉️", label:"Email de bienvenue",
                        action:"Email automatique : bienvenue + identifiants espace apprenant + planning + matériel",
                        systeme:"Auto", couleur:"#059669", bg:"#d1fae5",
                        stat:suivis.filter(s=>s.checklist.bienvenue).length, statLabel:"envoyés",
                      },
                      {
                        n:6, icon:"🔓", label:"Accès espace apprenant activé",
                        action:"Le compte apprenant est activé avec toutes les informations pré-renseignées",
                        systeme:"Auto", couleur:"#22c55e", bg:"#dcfce7",
                        stat:suivis.filter(s=>s.checklist.acces).length, statLabel:"activés",
                      },
                    ].map((step, i, arr) => (
                      <div key={step.n} style={{ display:"flex",alignItems:"stretch",gap:0 }}>
                        {/* Ligne verticale + numéro */}
                        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",width:40,flexShrink:0 }}>
                          <div style={{ width:32,height:32,borderRadius:"50%",background:step.couleur,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,flexShrink:0,zIndex:1 }}>{step.n}</div>
                          {i<arr.length-1&&<div style={{ width:2,flex:1,background:`linear-gradient(${step.couleur},${arr[i+1].couleur})`,opacity:0.25,minHeight:16 }}/>}
                        </div>
                        {/* Contenu */}
                        <div style={{ flex:1,background:"#fff",borderRadius:10,border:`1px solid ${step.couleur}20`,padding:"12px 16px",marginLeft:10,marginBottom:i<arr.length-1?8:0,display:"flex",gap:12,alignItems:"flex-start" }}>
                          <div style={{ fontSize:22,flexShrink:0,marginTop:1 }}>{step.icon}</div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
                              <span style={{ fontSize:13,fontWeight:800,color:"#0f172a" }}>{step.label}</span>
                              <span style={{ padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,background:step.bg,color:step.couleur }}>{step.systeme}</span>
                              {step.stat!=null&&<span style={{ padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,background:"#f1f5f9",color:"#374151" }}>
                                {step.stat} {step.statLabel}
                              </span>}
                            </div>
                            <div style={{ fontSize:11,color:"#6b7280",lineHeight:1.5 }}>{step.action}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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

            {/* ══ NOUVEAUX APPRENANTS — Réception des dossiers ══ */}
            {activeTab==="apprenants" && (() => {
              const enAttentes = apprenants.filter(a => a.statut === "en_attente");
              return (
                <div>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
                    <div>
                      <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:"#0f172a" }}>📥 Réception des dossiers</h2>
                      <p style={{ margin:"4px 0 0",fontSize:12,color:"#6b7280" }}>Apprenants convertis par la commerciale — à traiter avant transfert dans <strong>Mes apprenants</strong></p>
                    </div>
                    <span style={{ padding:"4px 12px",borderRadius:99,background:C_LIGHT,color:C,fontSize:12,fontWeight:700 }}>{enAttentes.length} en attente</span>
                  </div>

                  {/* Explication du processus */}
                  <div style={{ background:"linear-gradient(135deg,#f3e8ff,#e0f2fe)",borderRadius:12,padding:"14px 18px",marginBottom:22,border:"1px solid #ddd6fe",display:"flex",gap:14,alignItems:"flex-start" }}>
                    <span style={{ fontSize:22,flexShrink:0 }}>ℹ️</span>
                    <div style={{ fontSize:12,color:"#374151",lineHeight:1.7 }}>
                      <strong>Processus de traitement :</strong><br/>
                      <span style={{ color:C,fontWeight:700 }}>Étape 1</span> — Vérification et complétion du profil (coordonnées, niveau, programme, attentes, dates).<br/>
                      <span style={{ color:"#0891b2",fontWeight:700 }}>Étape 2</span> — Recherche et affectation d'un coach selon le niveau et le programme.<br/>
                      <span style={{ color:"#22c55e",fontWeight:700 }}>Étape 3</span> — Affectation au groupe du coach pour ce niveau. Si quota atteint ou aucun groupe disponible, un nouveau groupe est créé (le coach est notifié automatiquement).<br/>
                      Une fois validé, l'apprenant est transféré dans <strong>Mes apprenants</strong> pour le suivi.
                    </div>
                  </div>

                  {enAttentes.length === 0 && (
                    <div style={{ textAlign:"center",padding:"50px 24px",background:"#f8fafc",borderRadius:16,border:"2px dashed #e2e8f0" }}>
                      <div style={{ fontSize:"3rem",marginBottom:10 }}>✅</div>
                      <div style={{ fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:6 }}>Aucun dossier en attente</div>
                      <div style={{ fontSize:12,color:"#9ca3af" }}>Tous les dossiers ont été traités. Consultez <strong>Mes apprenants</strong> pour le suivi.</div>
                      <button onClick={()=>setActiveTab("mes_apprenants")} style={{ marginTop:16,padding:"9px 20px",background:C,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12 }}>Voir Mes apprenants →</button>
                    </div>
                  )}

                  <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                    {enAttentes.map(a => (
                      <div key={a.id} style={{ background:"#fff",borderRadius:14,border:`1.5px solid ${C}30`,overflow:"hidden",boxShadow:"0 2px 10px rgba(124,58,237,0.07)" }}>
                        <div style={{ height:3,background:`linear-gradient(90deg,${C},#0891b2)` }}/>
                        <div style={{ padding:"16px 20px",display:"flex",gap:16,alignItems:"flex-start" }}>
                          {/* Avatar */}
                          <div style={{ width:48,height:48,borderRadius:"50%",background:C_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:C,flexShrink:0 }}>{a.nom[0]}</div>
                          {/* Infos */}
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6 }}>
                              <span style={{ fontSize:15,fontWeight:800,color:"#0f172a" }}>{a.nom}</span>
                              <Badge label="En attente" color="#d97706" bg="#fef3c7" />
                              <span style={{ fontSize:11,color:"#9ca3af" }}>Reçu le {formatDate(a.dateConversion)}</span>
                            </div>
                            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6 }}>
                              {[
                                { l:"Email",    v:a.email||"—",         icon:"📧" },
                                { l:"Téléphone",v:a.telephone||"—",     icon:"📞" },
                                { l:"Programme",v:a.offre||"—",         icon:"📚" },
                                { l:"Niveau",   v:a.niveau?(a.niveau+" — "+(NIVEAUX[a.niveau]||"")):"—", icon:"🎯" },
                                { l:"Profil",   v:a.entreprise||a.profil||"—", icon:"🏢" },
                              ].map(s=>(
                                <div key={s.l} style={{ padding:"5px 8px",borderRadius:6,background:"#f8fafc",display:"flex",gap:6,alignItems:"flex-start" }}>
                                  <span style={{ fontSize:11,flexShrink:0 }}>{s.icon}</span>
                                  <div>
                                    <div style={{ fontSize:9,color:"#9ca3af",lineHeight:1 }}>{s.l}</div>
                                    <div style={{ fontSize:11,fontWeight:700,color:"#374151" }}>{s.v}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Action */}
                          <div style={{ flexShrink:0 }}>
                            <button onClick={()=>openDossierModal(a)} style={{ padding:"10px 18px",background:C,color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,whiteSpace:"nowrap",boxShadow:`0 2px 8px ${C}40` }}>
                              📋 Traiter le dossier
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ══ MES APPRENANTS — Suivi ══ */}
            {activeTab==="mes_apprenants" && (() => {
              const STATUT_GA = {
                actif:        { label:"Actif",          color:"#166534", bg:"#dcfce7" },
                periode_test: { label:"Période de test",color:"#7c3aed", bg:"#ede9fe" },
                transfere:    { label:"Transféré",      color:"#0891b2", bg:"#e0f2fe" },
                retire:       { label:"Retiré",         color:"#6b7280", bg:"#f1f5f9" },
              };
              const NIVEAUX_COLORS = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };
              const TYPE_ICO = { en_ligne:"💻",domicile:"🏠",centre:"🏢" };
              const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "—";

              const groupesUniq = [...new Set(mesApprenants.map(a=>a.groupe_nom).filter(Boolean))];

              const filtered = mesApprenants.filter(a => {
                const q = mesAppSearch.toLowerCase();
                const nom = `${a.prenom_apprenant||""} ${a.nom_apprenant||""}`.toLowerCase();
                if (q && !nom.includes(q) && !(a.email_apprenant||"").toLowerCase().includes(q) && !(a.coach_nom||"").toLowerCase().includes(q)) return false;
                const niv = a.niveau || a.groupe_niveau;
                if (mesAppNiveau !== "tous" && niv !== mesAppNiveau) return false;
                if (mesAppStatut !== "tous" && a.statut !== mesAppStatut) return false;
                if (mesAppGroupe !== "tous" && a.groupe_nom !== mesAppGroupe) return false;
                return true;
              });

              const kpiActif   = mesApprenants.filter(a=>a.statut==="actif").length;
              const kpiTest    = mesApprenants.filter(a=>a.statut==="periode_test").length;
              const kpiTransf  = mesApprenants.filter(a=>a.statut==="transfere").length;

              return (
                <div>
                  {/* Header */}
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
                    <div>
                      <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:"#0f172a" }}>🎓 Mes apprenants</h2>
                      <p style={{ margin:"4px 0 0",fontSize:12,color:"#6b7280" }}>Tous les apprenants inscrits dans les groupes — données réelles</p>
                    </div>
                    <button onClick={()=>{ setMesAppLoading(true); const tok=localStorage.getItem("admin_token"); fetch(`${API_URL}/api/groupes/apprenants`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.ok?r.json():{apprenants:[]}).then(d=>setMesApprenants(d.apprenants||[])).catch(()=>{}).finally(()=>setMesAppLoading(false)); }}
                      style={{ padding:"7px 14px",background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:11 }}>
                      🔄 Actualiser
                    </button>
                  </div>

                  {/* KPIs */}
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:22 }}>
                    {[
                      { icon:"🎓", label:"Total",          value:mesApprenants.length,  color:C },
                      { icon:"✅", label:"Actifs",          value:kpiActif,              color:"#16a34a" },
                      { icon:"🧪", label:"Période de test", value:kpiTest,               color:"#7c3aed" },
                      { icon:"🔄", label:"Transférés",      value:kpiTransf,             color:"#0891b2" },
                    ].map(k=>(
                      <div key={k.label} style={{ background:"#fff",borderRadius:12,padding:"14px 16px",border:"1px solid #f1f5f9",boxShadow:"0 1px 6px rgba(0,0,0,0.05)",display:"flex",alignItems:"center",gap:12 }}>
                        <div style={{ width:42,height:42,borderRadius:10,background:k.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{k.icon}</div>
                        <div>
                          <div style={{ fontSize:10,color:"#9ca3af" }}>{k.label}</div>
                          <div style={{ fontSize:22,fontWeight:900,color:k.color,lineHeight:1.1 }}>{k.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Filtres */}
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:18,padding:"10px 14px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0" }}>
                    <input value={mesAppSearch} onChange={e=>setMesAppSearch(e.target.value)} placeholder="🔍 Nom, email ou coach…" style={{ padding:"8px 11px",borderRadius:8,border:"1px solid #d1d5db",fontSize:12,width:220 }} />
                    <select value={mesAppNiveau} onChange={e=>setMesAppNiveau(e.target.value)} style={{ padding:"8px 10px",borderRadius:8,border:"1px solid #d1d5db",fontSize:12 }}>
                      <option value="tous">Tous niveaux</option>
                      {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                    <select value={mesAppStatut} onChange={e=>setMesAppStatut(e.target.value)} style={{ padding:"8px 10px",borderRadius:8,border:"1px solid #d1d5db",fontSize:12 }}>
                      <option value="tous">Tous statuts</option>
                      <option value="actif">Actif</option>
                      <option value="periode_test">Période de test</option>
                      <option value="transfere">Transféré</option>
                    </select>
                    {groupesUniq.length > 1 && (
                      <select value={mesAppGroupe} onChange={e=>setMesAppGroupe(e.target.value)} style={{ padding:"8px 10px",borderRadius:8,border:"1px solid #d1d5db",fontSize:12 }}>
                        <option value="tous">Tous les groupes</option>
                        {groupesUniq.map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                    )}
                    {(mesAppSearch||mesAppNiveau!=="tous"||mesAppStatut!=="tous"||mesAppGroupe!=="tous") && (
                      <button onClick={()=>{setMesAppSearch("");setMesAppNiveau("tous");setMesAppStatut("tous");setMesAppGroupe("tous");}}
                        style={{ padding:"7px 12px",background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",fontSize:11 }}>✕ Effacer</button>
                    )}
                    <span style={{ marginLeft:"auto",fontSize:11,color:"#6b7280" }}>{filtered.length} apprenant{filtered.length!==1?"s":""}</span>
                  </div>

                  {/* États vides */}
                  {mesAppLoading && <div style={{ textAlign:"center",padding:60,color:"#9ca3af" }}>Chargement des apprenants…</div>}
                  {!mesAppLoading && mesApprenants.length===0 && (
                    <div style={{ textAlign:"center",padding:"50px 24px",background:"#f8fafc",borderRadius:16,border:"2px dashed #e2e8f0" }}>
                      <div style={{ fontSize:"3rem",marginBottom:10 }}>🎓</div>
                      <div style={{ fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:6 }}>Aucun apprenant dans vos groupes</div>
                      <div style={{ fontSize:12,color:"#9ca3af",marginBottom:16 }}>Ajoutez des apprenants dans vos groupes depuis l'onglet <strong>Groupes</strong>.</div>
                      <button onClick={()=>setActiveTab("groupes")} style={{ padding:"9px 20px",background:C,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12 }}>👥 Voir les groupes</button>
                    </div>
                  )}
                  {!mesAppLoading && mesApprenants.length>0 && filtered.length===0 && (
                    <div style={{ textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13 }}>Aucun apprenant ne correspond aux filtres.</div>
                  )}

                  {/* Grille cartes */}
                  {!mesAppLoading && filtered.length>0 && (
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14 }}>
                      {filtered.map(a => {
                        const statCfg = STATUT_GA[a.statut] || { label:a.statut||"—", color:"#6b7280", bg:"#f1f5f9" };
                        const niv = a.niveau || a.groupe_niveau;
                        const nvColor = NIVEAUX_COLORS[niv] || "#6b7280";
                        const initiales = ((a.prenom_apprenant?.[0]||"")+(a.nom_apprenant?.[0]||"")).toUpperCase() || "?";
                        const prog = a.note_obj?.programme || a.groupe_filiere || "—";
                        const ac = a.assistante_commerciale;
                        return (
                          <div key={a.id} style={{ background:"#fff",borderRadius:14,border:`1.5px solid ${a.statut==="periode_test"?"#c4b5fd":a.statut==="transfere"?"#bae6fd":"#e5e7eb"}`,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>
                            <div style={{ height:4,background:a.statut==="actif"?`linear-gradient(90deg,${C},#0891b2)`:a.statut==="periode_test"?"#7c3aed":a.statut==="transfere"?"#0891b2":"#e5e7eb" }}/>
                            <div style={{ padding:16 }}>

                              {/* Header */}
                              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                                <div style={{ width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,#0f172a,${C})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#fff",flexShrink:0 }}>{initiales}</div>
                                <div style={{ flex:1,minWidth:0 }}>
                                  <div style={{ fontSize:14,fontWeight:800,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.prenom_apprenant} {a.nom_apprenant}</div>
                                  <div style={{ fontSize:11,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.email_apprenant||"—"}</div>
                                </div>
                                <span style={{ padding:"2px 9px",borderRadius:99,fontSize:10,fontWeight:700,color:statCfg.color,background:statCfg.bg,whiteSpace:"nowrap" }}>{statCfg.label}</span>
                              </div>

                              {/* Badges niveau + programme + type */}
                              <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:10 }}>
                                {niv && <span style={{ fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:999,color:"#fff",background:nvColor }}>{niv}</span>}
                                {prog!=="—" && <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,background:"#f3e8ff",color:C }}>{prog}</span>}
                                <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,background:"#f1f5f9",color:"#374151" }}>{TYPE_ICO[a.groupe_type_cours]||"🏢"} {a.groupe_type_cours==="en_ligne"?"En ligne":a.groupe_type_cours==="domicile"?"Domicile":"Centre"}</span>
                              </div>

                              {/* Infos groupe + coach */}
                              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10 }}>
                                <div style={{ padding:"6px 8px",borderRadius:6,background:"#f8fafc" }}>
                                  <div style={{ fontSize:9,color:"#9ca3af" }}>Groupe</div>
                                  <div style={{ fontSize:11,fontWeight:700,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.groupe_nom||"—"}</div>
                                </div>
                                <div style={{ padding:"6px 8px",borderRadius:6,background:"#f8fafc" }}>
                                  <div style={{ fontSize:9,color:"#9ca3af" }}>Coach</div>
                                  <div style={{ fontSize:11,fontWeight:700,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.coach_nom||"—"}</div>
                                </div>
                                <div style={{ padding:"6px 8px",borderRadius:6,background:"#f8fafc" }}>
                                  <div style={{ fontSize:9,color:"#9ca3af" }}>Ajouté le</div>
                                  <div style={{ fontSize:11,fontWeight:700,color:"#374151" }}>{fmtDate(a.date_ajout)}</div>
                                </div>
                                <div style={{ padding:"6px 8px",borderRadius:6,background:"#f8fafc" }}>
                                  <div style={{ fontSize:9,color:"#9ca3af" }}>Téléphone</div>
                                  <div style={{ fontSize:11,fontWeight:700,color:"#374151" }}>{a.telephone||"—"}</div>
                                </div>
                              </div>

                              {/* Assistante commerciale */}
                              {ac && (
                                <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,background:"#f0fdf4",border:"1px solid #bbf7d0",marginBottom:10 }}>
                                  <div style={{ width:28,height:28,borderRadius:"50%",background:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0 }}>
                                    {ac.photo_url ? <img src={ac.photo_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%" }} onError={e=>{e.currentTarget.style.display="none";}} /> : ((ac.prenom?.[0]||"")+(ac.nom?.[0]||"")).toUpperCase()||"💼"}
                                  </div>
                                  <div style={{ flex:1,minWidth:0 }}>
                                    <div style={{ fontSize:9,color:"#16a34a",fontWeight:700 }}>Assistante commerciale</div>
                                    <div style={{ fontSize:11,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ac.prenom} {ac.nom}{ac.telephone?` · ${ac.telephone}`:""}</div>
                                  </div>
                                </div>
                              )}

                              {/* Action */}
                              <button
                                onClick={()=>{
                                  // Ouvrir la fiche apprenant du groupe via le modal de groupe
                                  const grp = groupes.find(g=>g.id===a.groupe_id);
                                  if (grp) {
                                    setSelectedGroupe(grp);
                                    setActiveTab("groupes");
                                    setTimeout(()=>openApprenantDetail(a), 200);
                                  } else {
                                    openApprenantDetail(a);
                                  }
                                }}
                                style={{ width:"100%",padding:"9px 0",background:C_LIGHT,color:C,border:`1px solid ${C}30`,borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12 }}>
                                👤 Voir le dossier →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

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
                  <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:"#0f172a" }}>🚀 Kick-off & Onboarding apprenant</h2>
                  <p style={{ margin:"4px 0 0",fontSize:12,color:"#6b7280" }}>Envoi automatique : email de bienvenue · lien espace apprenant · lien matériel de cours · planning</p>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  {suivis.map(s=>{
                    const pct=pctChecklist(s.checklist);
                    const app=apprenants.find(a=>a.id===s.apprenantId);
                    const tousEnvoyes = CHECKLIST_ITEMS.every(it=>s.checklist[it.id]);
                    return (
                      <div key={s.id} style={{ background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",padding:20 }}>
                        {/* En-tête apprenant */}
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
                            <div style={{ fontSize:24,fontWeight:900,color:pct===100?"#22c55e":pct>=50?C:"#d97706" }}>{pct}%</div>
                            <div style={{ fontSize:10,color:"#9ca3af" }}>envoyé</div>
                          </div>
                        </div>
                        {/* Barre de progression */}
                        <div style={{ height:6,background:"#e5e7eb",borderRadius:4,overflow:"hidden",marginBottom:16 }}>
                          <div style={{ height:"100%",width:`${pct}%`,background:pct===100?"#22c55e":pct>=50?C:"#d97706",borderRadius:4,transition:"width .3s" }}/>
                        </div>
                        {/* 4 envois kick-off */}
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
                          {CHECKLIST_ITEMS.map(item=>{
                            const fait = s.checklist[item.id]||false;
                            return (
                              <button
                                key={item.id}
                                onClick={()=>toggleCheck(s.id,item.id)}
                                style={{
                                  display:"flex",alignItems:"center",gap:10,
                                  padding:"10px 14px",borderRadius:10,cursor:"pointer",
                                  border:`1.5px solid ${fait?"#bbf7d0":"#e5e7eb"}`,
                                  background:fait?"#f0fdf4":"#f8fafc",
                                  textAlign:"left",width:"100%"
                                }}
                              >
                                <span style={{ fontSize:18,flexShrink:0 }}>{fait?"✅":item.icon}</span>
                                <div>
                                  <div style={{ fontSize:12,fontWeight:700,color:fait?"#166534":"#374151" }}>{item.label}</div>
                                  <div style={{ fontSize:10,color:fait?"#22c55e":"#9ca3af" }}>{fait?"Envoyé":"En attente"}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {s.notes&&(
                          <div style={{ padding:"8px 12px",borderRadius:8,background:"#f8fafc",border:"1px solid #e2e8f0",fontSize:12,color:"#374151",fontStyle:"italic" }}>📝 {s.notes}</div>
                        )}
                        {tousEnvoyes&&(
                          <div style={{ marginTop:12,padding:"10px 14px",borderRadius:10,background:"#dcfce7",border:"1px solid #bbf7d0",fontSize:13,color:"#166534",fontWeight:700,textAlign:"center" }}>
                            🎉 Kick-off complet ! Tous les envois ont été effectués.
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {suivis.length===0&&(
                    <div style={{ textAlign:"center",padding:40,color:"#9ca3af",fontSize:13 }}>Aucun onboarding en cours — démarrez depuis l'onglet "Nouveaux apprenants"</div>
                  )}
                </div>
              </div>
            )}

            {/* ══ GROUPES ══ */}
            {activeTab==="groupes" && (
              <div>
              {/* ── Grille groupes (toujours visible) ── */}
              <div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
                  <div>
                    <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:"#0f172a" }}>👥 Groupes de cours</h2>
                    <p style={{ margin:"4px 0 0",fontSize:12,color:"#6b7280" }}>{groupes.length} groupe{groupes.length>1?"s":""} — cliquez sur une carte pour ouvrir le détail</p>
                  </div>
                  <button onClick={()=>setShowCreateGroupe(true)} style={btnP}>+ Créer un groupe</button>
                </div>
                {groupesLoading && (
                  <div style={{ textAlign:"center",padding:40,color:"#9ca3af",fontSize:13 }}>Chargement des groupes…</div>
                )}
                {!groupesLoading && groupes.length===0 && (
                  <div style={{ textAlign:"center",padding:60,color:"#9ca3af",fontSize:13 }}>
                    <div style={{ fontSize:40,marginBottom:12 }}>👥</div>
                    Aucun groupe créé — cliquez sur "+ Créer un groupe"
                  </div>
                )}
                {!groupesLoading && groupes.length>0 && (
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14 }}>
                    {groupes.map(g => {
                      const isActif = g.statut==="actif";
                      const coachNom = coaches.find(c=>c.id===g.coach_id)?.nom || (g.coach_nom || "—");
                      const horaires = Array.isArray(g.horaire) ? g.horaire : (typeof g.horaire==="string" ? (() => { try { return JSON.parse(g.horaire); } catch { return []; } })() : []);
                      const nbApp = g.nb_apprenants || 0;
                      const cap = g.capacite_max || 20;
                      const pct = Math.min(100, Math.round((nbApp/cap)*100));
                      return (
                        <div key={g.id} onClick={()=>fetchGroupeDetail(g)}
                          style={{ background:"#fff",borderRadius:14,border:`1.5px solid ${isActif?C+"30":"#e5e7eb"}`,overflow:"hidden",boxShadow:isActif?"0 2px 10px rgba(124,58,237,0.08)":"none",cursor:"pointer",transition:"box-shadow 0.15s" }}
                          onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(124,58,237,0.15)"}
                          onMouseLeave={e=>e.currentTarget.style.boxShadow=isActif?"0 2px 10px rgba(124,58,237,0.08)":"none"}
                        >
                          <div style={{ height:4,background:isActif?C:"#94a3b8" }}/>
                          <div style={{ padding:18 }}>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                              <div>
                                <div style={{ fontWeight:800,fontSize:14,color:"#0f172a",marginBottom:2 }}>{g.nom}</div>
                                <div style={{ fontSize:11,color:"#6b7280" }}>{g.filiere||"—"} · Niveau {g.niveau||"—"}</div>
                              </div>
                              <span style={{ display:"inline-block",padding:"2px 9px",borderRadius:99,fontSize:10,fontWeight:700,color:isActif?"#166534":"#6b7280",background:isActif?"#dcfce7":"#f1f5f9",whiteSpace:"nowrap" }}>
                                {isActif?"Actif":"Inactif"}
                              </span>
                            </div>
                            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
                              <div style={{ padding:"6px 8px",borderRadius:6,background:"#f8fafc" }}>
                                <div style={{ fontSize:9,color:"#9ca3af" }}>Coach</div>
                                <div style={{ fontSize:11,fontWeight:700,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{coachNom}</div>
                              </div>
                              <div style={{ padding:"6px 8px",borderRadius:6,background:"#f8fafc" }}>
                                <div style={{ fontSize:9,color:"#9ca3af" }}>Apprenants</div>
                                <div style={{ fontSize:11,fontWeight:700,color:C }}>{nbApp} / {cap}</div>
                              </div>
                              <div style={{ padding:"6px 8px",borderRadius:6,background:"#f8fafc" }}>
                                <div style={{ fontSize:9,color:"#9ca3af" }}>Type</div>
                                <div style={{ fontSize:11,fontWeight:700,color:"#374151" }}>{g.type_cours==="en_ligne"?"💻 En ligne":g.type_cours==="domicile"?"🏠 Domicile":"🏢 Centre"}</div>
                              </div>
                              <div style={{ padding:"6px 8px",borderRadius:6,background:"#f8fafc" }}>
                                <div style={{ fontSize:9,color:"#9ca3af" }}>Début</div>
                                <div style={{ fontSize:11,fontWeight:700,color:"#374151" }}>{g.date_debut?new Date(g.date_debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}):"—"}</div>
                              </div>
                            </div>
                            {/* Barre de remplissage */}
                            <div style={{ marginBottom:10 }}>
                              <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"#9ca3af",marginBottom:3 }}>
                                <span>Remplissage</span>
                                <span style={{ fontWeight:700,color:pct>=100?"#dc2626":pct>=80?"#d97706":"#16a34a" }}>{pct}%</span>
                              </div>
                              <div style={{ height:5,background:"#f1f5f9",borderRadius:99,overflow:"hidden" }}>
                                <div style={{ height:"100%",width:`${pct}%`,background:pct>=100?"#dc2626":pct>=80?"#d97706":C,borderRadius:99,transition:"width 0.3s" }}/>
                              </div>
                            </div>
                            {horaires.length>0 && (
                              <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginBottom:8 }}>
                                {horaires.map((h,i)=>(
                                  <span key={i} style={{ padding:"2px 7px",borderRadius:6,background:C_LIGHT,color:C,fontSize:10,fontWeight:600 }}>{h.jour} {h.debut}–{h.fin}</span>
                                ))}
                              </div>
                            )}
                            <div style={{ marginTop:6,fontSize:10,color:C,fontWeight:600,textAlign:"center",padding:"4px",background:C_LIGHT,borderRadius:6 }}>
                              Cliquer pour ouvrir →
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Modal détail groupe ── */}
              {selectedGroupe && (
                <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}
                  onClick={()=>{ setSelectedGroupe(null); setGroupeDetail({apprenants:[],fichiers:[]}); }}>
                  <div style={{ background:"#fff",borderRadius:18,width:"97vw",maxWidth:1100,height:"93vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.35)",overflow:"hidden" }}
                    onClick={e=>e.stopPropagation()}>

                    {/* En-tête modal */}
                    <div style={{ background:C_GRAD,padding:"18px 24px",color:"#fff",flexShrink:0,display:"flex",gap:16,alignItems:"flex-start" }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:10,color:"#c4b5fd",fontWeight:700,letterSpacing:"0.08em",marginBottom:3 }}>GROUPE</div>
                        <div style={{ fontSize:19,fontWeight:900,marginBottom:5 }}>{selectedGroupe.nom}</div>
                        <div style={{ fontSize:12,color:"#c4b5fd",display:"flex",gap:14,flexWrap:"wrap" }}>
                          {selectedGroupe.niveau && <span>📊 {selectedGroupe.niveau}</span>}
                          {selectedGroupe.filiere && <span>🎓 {selectedGroupe.filiere}</span>}
                          <span>👤 {groupeDetail.apprenants.filter(a=>a.statut==="actif").length} apprenants actifs</span>
                          {selectedGroupe.date_debut && <span>📅 Début : {new Date(selectedGroupe.date_debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</span>}
                          <span>{selectedGroupe.type_cours==="en_ligne"?"💻 En ligne":selectedGroupe.type_cours==="domicile"?"🏠 Domicile":"🏢 Centre"}</span>
                          <span style={{ padding:"1px 8px",borderRadius:99,background:selectedGroupe.statut==="actif"?"rgba(34,197,94,0.3)":"rgba(148,163,184,0.3)",fontSize:10,fontWeight:700 }}>{selectedGroupe.statut==="actif"?"Actif":"Inactif"}</span>
                        </div>
                        {(() => {
                          const hs = Array.isArray(selectedGroupe.horaire)?selectedGroupe.horaire:(typeof selectedGroupe.horaire==="string"?(()=>{try{return JSON.parse(selectedGroupe.horaire);}catch{return[];}})():[]);
                          return hs.length>0 ? (
                            <div style={{ marginTop:8,display:"flex",gap:5,flexWrap:"wrap" }}>
                              {hs.map((h,i)=><span key={i} style={{ padding:"2px 9px",borderRadius:7,background:"rgba(255,255,255,0.18)",fontSize:11,fontWeight:600 }}>{h.jour} {h.debut}–{h.fin}</span>)}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <div style={{ display:"flex",gap:8,flexShrink:0,marginTop:2 }}>
                        <button onClick={()=>{
                          const hs = Array.isArray(selectedGroupe.horaire)?selectedGroupe.horaire:(typeof selectedGroupe.horaire==="string"?(()=>{try{return JSON.parse(selectedGroupe.horaire);}catch{return[];}})():[]);
                          setGroupeForm({ nom:selectedGroupe.nom||"", niveau:selectedGroupe.niveau||"", filiere:selectedGroupe.filiere||"", type_cours:selectedGroupe.type_cours||"en_ligne", coach_id:selectedGroupe.coach_id||"", date_debut:selectedGroupe.date_debut?selectedGroupe.date_debut.slice(0,10):"", date_fin:selectedGroupe.date_fin?selectedGroupe.date_fin.slice(0,10):"", capacite_max:selectedGroupe.capacite_max||20, horaire:hs });
                          setShowEditGroupe(true);
                        }} style={{ padding:"7px 14px",background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12 }}>
                          ✏️ Modifier
                        </button>
                        <button onClick={()=>{ setSelectedGroupe(null); setGroupeDetail({apprenants:[],fichiers:[]}); }}
                          style={{ background:"rgba(255,255,255,0.18)",border:"none",color:"#fff",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Onglets */}
                    <div style={{ display:"flex",gap:0,background:"#fafafa",borderBottom:"1px solid #e5e7eb",flexShrink:0,overflowX:"auto" }}>
                      {[
                        { k:"apprenants", l:`Apprenants (${groupeDetail.apprenants.filter(a=>a.statut==="actif").length})`, icon:"👤" },
                        { k:"cours", l:"Historique cours", icon:"📚" },
                        { k:"presences", l:"Présences", icon:"✅" },
                      ].map(t=>(
                        <button key={t.k} onClick={()=>setObGroupeSubTab(t.k)}
                          style={{ padding:"12px 18px",border:"none",borderBottom:obGroupeSubTab===t.k?`3px solid ${C}`:"3px solid transparent",fontSize:12,fontWeight:600,cursor:"pointer",background:"transparent",color:obGroupeSubTab===t.k?C:"#64748b",whiteSpace:"nowrap",flexShrink:0 }}>
                          {t.icon} {t.l}
                        </button>
                      ))}
                    </div>

                    {/* Corps scrollable */}
                    <div style={{ flex:1,overflowY:"auto",padding:"20px 24px" }}>

                      {/* Apprenants */}
                      {obGroupeSubTab==="apprenants" && (
                        <div style={{ background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden" }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",borderBottom:"1px solid #e5e7eb",background:"#fafafa" }}>
                            <div style={{ fontSize:13,fontWeight:700,color:"#0f172a" }}>Apprenants ({groupeDetail.apprenants.filter(a=>a.statut!=="retire").length})</div>
                            <button onClick={()=>setShowAddApprenant(true)} style={btnP}>+ Ajouter un apprenant</button>
                          </div>
                          {groupeDetail.apprenants.length===0 && (
                            <div style={{ textAlign:"center",padding:32,color:"#9ca3af",fontSize:12 }}>Aucun apprenant dans ce groupe</div>
                          )}
                          {groupeDetail.apprenants.filter(a=>a.statut!=="retire").map(a=>{
                            let noteObj = {};
                            try { noteObj = JSON.parse(a.note||"{}"); } catch {}
                            return (
                              <div key={a.id} onClick={()=>openApprenantDetail(a)}
                                style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",borderBottom:"1px solid #f1f5f9",gap:10,cursor:"pointer",transition:"background 0.1s" }}
                                onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                <div style={{ display:"flex",gap:10,alignItems:"center",minWidth:0,flex:1 }}>
                                  <div style={{ width:38,height:38,borderRadius:"50%",background:C_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:C,flexShrink:0 }}>
                                    {(a.prenom_apprenant||a.nom_apprenant||"?")[0].toUpperCase()}
                                  </div>
                                  <div style={{ minWidth:0 }}>
                                    <div style={{ fontSize:13,fontWeight:700,color:"#0f172a" }}>{a.prenom_apprenant} {a.nom_apprenant}</div>
                                    <div style={{ fontSize:11,color:"#6b7280",display:"flex",gap:8,flexWrap:"wrap" }}>
                                      <span>{a.email_apprenant||"—"}</span>
                                      {a.niveau && <span style={{ padding:"1px 6px",borderRadius:99,background:C_LIGHT,color:C,fontWeight:700 }}>{a.niveau}</span>}
                                      {noteObj.programme && <span style={{ color:"#9ca3af" }}>· {noteObj.programme}</span>}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display:"flex",gap:6,alignItems:"center",flexShrink:0 }}>
                                  <span style={{ fontSize:10,color:C,fontWeight:600 }}>Voir le dossier →</span>
                                  <button onClick={e=>{ e.stopPropagation(); removeApprenant(a.id, `${a.prenom_apprenant||""} ${a.nom_apprenant||""}`.trim()); }}
                                    style={{ padding:"5px 12px",background:"#fee2e2",color:"#dc2626",border:"1px solid #fca5a5",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:11 }}>
                                    Retirer
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {groupeDetail.apprenants.some(a=>a.statut==="retire") && (
                            <div style={{ padding:"10px 18px",background:"#f9fafb",borderTop:"1px solid #e5e7eb" }}>
                              <div style={{ fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:6 }}>Apprenants retirés</div>
                              {groupeDetail.apprenants.filter(a=>a.statut==="retire").map(a=>(
                                <div key={a.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",opacity:0.5,fontSize:12,color:"#6b7280",borderBottom:"1px solid #f1f5f9" }}>
                                  <div style={{ width:28,height:28,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0 }}>
                                    {(a.prenom_apprenant||a.nom_apprenant||"?")[0].toUpperCase()}
                                  </div>
                                  <span style={{ textDecoration:"line-through" }}>{a.prenom_apprenant} {a.nom_apprenant}</span>
                                  <span style={{ marginLeft:"auto",padding:"1px 7px",borderRadius:99,background:"#f1f5f9",color:"#9ca3af",fontSize:10,fontWeight:700 }}>Retiré</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Historique cours */}
                      {obGroupeSubTab==="cours" && (
                        <div>
                          <div style={{ display:"flex",gap:8,marginBottom:16,alignItems:"center" }}>
                            <select value={obCoursFiltreMois} onChange={e=>setObCoursFiltreMois(Number(e.target.value))}
                              style={{ padding:"7px 10px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:12 }}>
                              {["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"].map((m,i)=>(
                                <option key={i+1} value={i+1}>{m}</option>
                              ))}
                            </select>
                            <select value={obCoursAnnee} onChange={e=>setObCoursAnnee(Number(e.target.value))}
                              style={{ padding:"7px 10px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:12 }}>
                              {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          {obCoursLoading && <p style={{ color:"#9ca3af",textAlign:"center" }}>Chargement…</p>}
                          {!obCoursLoading && obCoursList.length===0 && <p style={{ color:"#9ca3af",textAlign:"center",padding:20 }}>Aucun cours ce mois-ci.</p>}
                          {!obCoursLoading && obCoursList.length>0 && (
                            <div style={{ overflowX:"auto",borderRadius:10,border:"1px solid #e5e7eb" }}>
                              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
                                <thead>
                                  <tr style={{ background:"#f8fafc" }}>
                                    {["Date","Statut","Objectif","Grammaire","Sujet discussion","Commentaire"].map((h,i)=>(
                                      <th key={i} style={{ padding:"9px 12px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:11,borderBottom:"2px solid #e5e7eb",whiteSpace:"nowrap" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {obCoursList.map((c,idx)=>{
                                    const SCFG = {dispense:{label:"Dispensé",color:"#065f46",bg:"#d1fae5",icon:"✅"},annule:{label:"Annulé",color:"#991b1b",bg:"#fee2e2",icon:"❌"},apprenant_absent:{label:"Apprenant absent",color:"#92400e",bg:"#fef3c7",icon:"👤"},coach_absent:{label:"Coach absent",color:"#1e40af",bg:"#dbeafe",icon:"🏃"},catch_up:{label:"Catch up",color:"#5b21b6",bg:"#ede9fe",icon:"🔄"},holiday:{label:"Congé/Férié",color:"#374151",bg:"#f1f5f9",icon:"🏖️"}};
                                    const s=SCFG[c.statut]||SCFG.dispense;
                                    return (
                                      <tr key={c.id} style={{ background:idx%2===0?"#fff":"#fafafa",borderBottom:"1px solid #f1f5f9" }}>
                                        <td style={{ padding:"9px 12px",fontWeight:600,whiteSpace:"nowrap" }}>{new Date(c.date_cours).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</td>
                                        <td style={{ padding:"9px 12px" }}><span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:s.bg,color:s.color }}>{s.icon} {s.label}</span></td>
                                        <td style={{ padding:"9px 12px",color:"#374151" }}>{c.objectif||"—"}</td>
                                        <td style={{ padding:"9px 12px",color:"#374151" }}>{c.grammaire||"—"}</td>
                                        <td style={{ padding:"9px 12px",color:"#374151" }}>{c.sujet_discussion||"—"}</td>
                                        <td style={{ padding:"9px 12px",color:"#6b7280" }}>{c.commentaire||"—"}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Présences */}
                      {obGroupeSubTab==="presences" && (
                        <div>
                          {obPresences.length===0 && <p style={{ color:"#9ca3af",textAlign:"center",padding:20 }}>Aucune présence enregistrée.</p>}
                          {(() => {
                            const parDate = {};
                            obPresences.forEach(p=>{ if(!parDate[p.date_seance]) parDate[p.date_seance]=[]; parDate[p.date_seance].push(p); });
                            return Object.entries(parDate).sort(([a],[b])=>b.localeCompare(a)).map(([date,rows])=>{
                              const presents = rows.filter(r=>r.statut==="present").length;
                              const taux = rows.length ? Math.round(presents/rows.length*100) : 0;
                              return (
                                <div key={date} style={{ marginBottom:12,background:"#fff",borderRadius:10,border:"1px solid #e5e7eb",overflow:"hidden" }}>
                                  <div style={{ padding:"10px 14px",background:"#f8fafc",borderBottom:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                                    <span style={{ fontWeight:700,fontSize:13,color:"#0f172a" }}>📅 {new Date(date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</span>
                                    <span style={{ fontSize:11,fontWeight:700,color:taux>=80?"#059669":taux>=60?"#d97706":"#dc2626" }}>{presents}/{rows.length} — {taux}%</span>
                                  </div>
                                  <div style={{ padding:"10px 14px",display:"flex",flexWrap:"wrap",gap:6 }}>
                                    {rows.map(r=>(
                                      <span key={r.id} style={{ padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,
                                        background:r.statut==="present"?"#d1fae5":r.statut==="absent"?"#fee2e2":r.statut==="retard"?"#fef3c7":"#ede9fe",
                                        color:r.statut==="present"?"#065f46":r.statut==="absent"?"#991b1b":r.statut==="retard"?"#92400e":"#5b21b6" }}>
                                        {r.statut==="present"?"✅":r.statut==="absent"?"❌":r.statut==="retard"?"⏰":"📝"} {[r.prenom_apprenant,r.nom_apprenant].filter(Boolean).join(" ")}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* ── MODAL DÉTAIL APPRENANT ── */}
              {selectedApprenantGroupe && (() => {
                let noteObj = {};
                try { noteObj = JSON.parse(selectedApprenantGroupe.note||"{}"); } catch {}
                const NIVEAUX_LABELS = { A1:"Débutant",A2:"Élémentaire",B1:"Intermédiaire",B2:"Interm. Supérieur",C1:"Avancé",C2:"Maîtrise" };
                const NIVEAUX_COLORS = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };
                const nvColor = NIVEAUX_COLORS[selectedApprenantGroupe.niveau] || "#6b7280";
                const coachNom = coaches.find(c=>c.id===selectedGroupe?.coach_id)?.nom || selectedGroupe?.coach_nom || "—";
                const initiales = ((selectedApprenantGroupe.prenom_apprenant?.[0]||"") + (selectedApprenantGroupe.nom_apprenant?.[0]||"")).toUpperCase() || "?";
                // Commercial from test
                const commercialNom = apprenantTest?.commercial_id ? (allStaff.find(s=>s.id===apprenantTest.commercial_id) ? `${allStaff.find(s=>s.id===apprenantTest.commercial_id).prenom||""} ${allStaff.find(s=>s.id===apprenantTest.commercial_id).nom||""}`.trim() : "—") : "—";
                // Taux présences
                const nbPresent = apprenantPresences.filter(p=>p.statut==="present").length;
                const tauxPres = apprenantPresences.length ? Math.round(nbPresent/apprenantPresences.length*100) : null;
                return (
                  <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.75)",zIndex:1050,display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}
                    onClick={()=>setSelectedApprenantGroupe(null)}>
                    <div style={{ background:"#fff",borderRadius:18,width:"min(97vw,820px)",maxHeight:"93vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.4)",overflow:"hidden" }}
                      onClick={e=>e.stopPropagation()}>

                      {/* Header */}
                      <div style={{ background:C_GRAD,padding:"20px 24px",color:"#fff",flexShrink:0 }}>
                        <div style={{ display:"flex",gap:16,alignItems:"flex-start" }}>
                          <div style={{ width:54,height:54,borderRadius:"50%",background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,flexShrink:0 }}>
                            {initiales}
                          </div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:10,color:"#c4b5fd",fontWeight:700,letterSpacing:"0.08em",marginBottom:3 }}>DOSSIER APPRENANT</div>
                            <div style={{ fontSize:18,fontWeight:900,marginBottom:5 }}>{selectedApprenantGroupe.prenom_apprenant} {selectedApprenantGroupe.nom_apprenant}</div>
                            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                              {selectedApprenantGroupe.niveau && (
                                <span style={{ padding:"2px 10px",borderRadius:99,background:"rgba(255,255,255,0.2)",fontSize:11,fontWeight:700 }}>
                                  {selectedApprenantGroupe.niveau} — {NIVEAUX_LABELS[selectedApprenantGroupe.niveau]||""}
                                </span>
                              )}
                              {noteObj.programme && <span style={{ padding:"2px 10px",borderRadius:99,background:"rgba(255,255,255,0.15)",fontSize:11 }}>{noteObj.programme}</span>}
                              <span style={{ padding:"2px 10px",borderRadius:99,background:selectedApprenantGroupe.statut==="actif"?"rgba(34,197,94,0.3)":"rgba(148,163,184,0.3)",fontSize:11,fontWeight:700 }}>
                                {selectedApprenantGroupe.statut==="actif"?"Actif":"Retiré"}
                              </span>
                            </div>
                          </div>
                          <button onClick={()=>setSelectedApprenantGroupe(null)}
                            style={{ background:"rgba(255,255,255,0.18)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Onglets */}
                      <div style={{ display:"flex",background:"#fafafa",borderBottom:"1px solid #e5e7eb",flexShrink:0 }}>
                        {[
                          { k:"profil",    l:"Profil & Formation",   icon:"👤" },
                          { k:"test",      l:"Test de niveau",        icon:"📊" },
                          { k:"presences", l:`Présences${tauxPres!==null?` (${tauxPres}%)`:""}`, icon:"✅" },
                        ].map(t=>(
                          <button key={t.k} onClick={()=>{
                            setApprenantTab(t.k);
                            if (t.k==="presences" && apprenantPresences.length===0) fetchApprenantPresences(selectedApprenantGroupe);
                          }}
                            style={{ padding:"11px 18px",border:"none",borderBottom:apprenantTab===t.k?`3px solid ${C}`:"3px solid transparent",fontSize:12,fontWeight:600,cursor:"pointer",background:"transparent",color:apprenantTab===t.k?C:"#64748b",whiteSpace:"nowrap" }}>
                            {t.icon} {t.l}
                          </button>
                        ))}
                      </div>

                      {/* Corps */}
                      <div style={{ flex:1,overflowY:"auto",padding:"20px 24px" }}>

                        {/* ── PROFIL ── */}
                        {apprenantTab==="profil" && (
                          <div style={{ display:"grid",gap:16 }}>

                            {/* Coordonnées */}
                            <div style={{ background:"#f8fafc",borderRadius:12,padding:16,border:"1px solid #e5e7eb" }}>
                              <div style={{ fontSize:11,fontWeight:800,color:"#7c3aed",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12 }}>📬 Coordonnées</div>
                              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                                <div><div style={{ fontSize:10,color:"#9ca3af",marginBottom:2 }}>Email</div><div style={{ fontSize:13,fontWeight:600,color:"#0f172a" }}>{selectedApprenantGroupe.email_apprenant||"—"}</div></div>
                                <div><div style={{ fontSize:10,color:"#9ca3af",marginBottom:2 }}>Téléphone</div><div style={{ fontSize:13,fontWeight:600,color:"#0f172a" }}>{noteObj.telephone||selectedApprenantGroupe.telephone||"—"}</div></div>
                              </div>
                            </div>

                            {/* Formation */}
                            <div style={{ background:"#f8fafc",borderRadius:12,padding:16,border:"1px solid #e5e7eb" }}>
                              <div style={{ fontSize:11,fontWeight:800,color:"#7c3aed",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12 }}>🎓 Formation</div>
                              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                                <div>
                                  <div style={{ fontSize:10,color:"#9ca3af",marginBottom:2 }}>Niveau</div>
                                  <div style={{ fontSize:13,fontWeight:700,color:nvColor }}>{selectedApprenantGroupe.niveau||"—"} {NIVEAUX_LABELS[selectedApprenantGroupe.niveau]?`— ${NIVEAUX_LABELS[selectedApprenantGroupe.niveau]}`:""}</div>
                                </div>
                                <div><div style={{ fontSize:10,color:"#9ca3af",marginBottom:2 }}>Programme</div><div style={{ fontSize:13,fontWeight:600,color:"#0f172a" }}>{noteObj.programme||"—"}</div></div>
                                <div><div style={{ fontSize:10,color:"#9ca3af",marginBottom:2 }}>Groupe</div><div style={{ fontSize:13,fontWeight:600,color:"#0f172a" }}>{selectedGroupe?.nom||"—"}</div></div>
                                <div><div style={{ fontSize:10,color:"#9ca3af",marginBottom:2 }}>Coach</div><div style={{ fontSize:13,fontWeight:600,color:"#0f172a" }}>{coachNom}</div></div>
                                <div><div style={{ fontSize:10,color:"#9ca3af",marginBottom:2 }}>Début supposé</div><div style={{ fontSize:13,fontWeight:600,color:"#0f172a" }}>{noteObj.date_debut?new Date(noteObj.date_debut).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):"—"}</div></div>
                                <div><div style={{ fontSize:10,color:"#9ca3af",marginBottom:2 }}>Renouvellement</div><div style={{ fontSize:13,fontWeight:600,color:"#0f172a" }}>{noteObj.date_renouvellement?new Date(noteObj.date_renouvellement).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):"—"}</div></div>
                              </div>
                            </div>

                            {/* Description / Attentes */}
                            {(noteObj.description||noteObj.attentes) && (
                              <div style={{ background:"#f8fafc",borderRadius:12,padding:16,border:"1px solid #e5e7eb" }}>
                                <div style={{ fontSize:11,fontWeight:800,color:"#7c3aed",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12 }}>📝 Profil & Objectifs</div>
                                {noteObj.description && (
                                  <div style={{ marginBottom:10 }}>
                                    <div style={{ fontSize:11,color:"#9ca3af",marginBottom:4 }}>Description du profil</div>
                                    <div style={{ fontSize:13,color:"#374151",lineHeight:1.6 }}>{noteObj.description}</div>
                                  </div>
                                )}
                                {noteObj.attentes && (
                                  <div>
                                    <div style={{ fontSize:11,color:"#9ca3af",marginBottom:4 }}>Attentes / Objectifs</div>
                                    <div style={{ fontSize:13,color:"#374151",lineHeight:1.6 }}>{noteObj.attentes}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Équipe assignée */}
                            <div style={{ background:"#f8fafc",borderRadius:12,padding:16,border:"1px solid #e5e7eb" }}>
                              <div style={{ fontSize:11,fontWeight:800,color:"#7c3aed",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12 }}>👥 Équipe assignée</div>
                              <div style={{ display:"grid",gap:10 }}>
                                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#fff",borderRadius:8,border:"1px solid #ede9fe" }}>
                                  <div style={{ width:32,height:32,borderRadius:"50%",background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>🟣</div>
                                  <div>
                                    <div style={{ fontSize:10,color:"#9ca3af" }}>Assistante Onboarding (affectation)</div>
                                    <div style={{ fontSize:13,fontWeight:700,color:"#0f172a" }}>{selectedApprenantGroupe.assistante_nom||"—"}</div>
                                  </div>
                                </div>
                                {(() => {
                                  const ac = selectedApprenantGroupe.assistante_commerciale;
                                  return (
                                    <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:8,border:"1.5px solid #86efac" }}>
                                      <div style={{ width:38,height:38,borderRadius:"50%",background:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff",flexShrink:0,overflow:"hidden" }}>
                                        {ac?.photo_url
                                          ? <img src={ac.photo_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>{e.currentTarget.style.display="none";}} />
                                          : ac ? ((ac.prenom?.[0]||"")+(ac.nom?.[0]||"")).toUpperCase()||"💼" : "💼"
                                        }
                                      </div>
                                      <div style={{ flex:1,minWidth:0 }}>
                                        <div style={{ fontSize:10,color:"#16a34a",fontWeight:700 }}>Assistante Commerciale (prise en charge)</div>
                                        <div style={{ fontSize:13,fontWeight:700,color:"#0f172a" }}>{ac ? `${ac.prenom||""} ${ac.nom||""}`.trim() : "Non renseignée"}</div>
                                        {ac?.telephone && <div style={{ fontSize:11,color:"#0891b2",marginTop:1 }}>📞 {ac.telephone}</div>}
                                      </div>
                                    </div>
                                  );
                                })()}
                                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#fff",borderRadius:8,border:"1px solid #d1fae5" }}>
                                  <div style={{ width:32,height:32,borderRadius:"50%",background:"#d1fae5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>🎓</div>
                                  <div>
                                    <div style={{ fontSize:10,color:"#9ca3af" }}>Coach</div>
                                    <div style={{ fontSize:13,fontWeight:700,color:"#0f172a" }}>{coachNom}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action : Changer de groupe */}
                            <div style={{ paddingTop:4 }}>
                              <button
                                onClick={()=>{
                                  setTransfertForm({ nouveau_groupe_id:"", motif:"", initiateur:"apprenant", jours:[], creneau:"" });
                                  setGroupesCibles([]);
                                  if (selectedApprenantGroupe?.niveau) searchGroupesCibles(selectedApprenantGroupe.niveau);
                                  setShowTransfert(true);
                                }}
                                style={{ width:"100%",padding:"11px 0",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,letterSpacing:"0.02em" }}>
                                🔄 Changer de groupe
                              </button>
                            </div>

                          </div>
                        )}

                        {/* ── TEST DE NIVEAU ── */}
                        {apprenantTab==="test" && (
                          <div>
                            {apprenantTestLoading && <p style={{ textAlign:"center",color:"#9ca3af",padding:40 }}>Chargement…</p>}
                            {!apprenantTestLoading && !apprenantTest && (
                              <div style={{ textAlign:"center",padding:"60px 20px",background:"#f8fafc",borderRadius:14,border:"1px solid #e5e7eb" }}>
                                <div style={{ fontSize:42,marginBottom:10 }}>📊</div>
                                <div style={{ fontWeight:700,color:"#0f172a",marginBottom:4 }}>Aucun test de niveau enregistré</div>
                                <p style={{ color:"#9ca3af",fontSize:13 }}>Le test de placement n'a pas encore été passé ou n'est pas lié à cet email.</p>
                              </div>
                            )}
                            {!apprenantTestLoading && apprenantTest && (() => {
                              const CEFR_COLOR = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };
                              const c = CEFR_COLOR[apprenantTest.level] || "#6b7280";
                              return (
                                <div style={{ display:"grid",gap:16 }}>
                                  {/* Score principal */}
                                  <div style={{ background:C_GRAD,borderRadius:14,padding:"24px 28px",color:"#fff",display:"flex",gap:24,alignItems:"center",flexWrap:"wrap" }}>
                                    <div style={{ textAlign:"center",flexShrink:0 }}>
                                      <div style={{ fontSize:48,fontWeight:900,lineHeight:1 }}>{apprenantTest.level||"—"}</div>
                                      <div style={{ fontSize:12,color:"#c4b5fd",marginTop:4 }}>{NIVEAUX_LABELS[apprenantTest.level]||"Niveau CECRL"}</div>
                                    </div>
                                    <div style={{ flex:1,minWidth:160 }}>
                                      <div style={{ fontSize:13,color:"#c4b5fd",marginBottom:4 }}>Score</div>
                                      <div style={{ fontSize:28,fontWeight:800 }}>{apprenantTest.score??apprenantTest.points_earned??0} pts</div>
                                      {apprenantTest.points_total && <div style={{ fontSize:12,color:"#c4b5fd" }}>sur {apprenantTest.points_total} · {apprenantTest.correct_answers||0}/{apprenantTest.total_questions||0} bonnes réponses</div>}
                                      {apprenantTest.submitted_at && <div style={{ fontSize:11,color:"#c4b5fd",marginTop:6 }}>📅 {new Date(apprenantTest.submitted_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</div>}
                                    </div>
                                  </div>

                                  {/* Par catégorie */}
                                  {apprenantTest.by_category && Object.keys(apprenantTest.by_category).length>0 && (
                                    <div style={{ background:"#f8fafc",borderRadius:12,padding:16,border:"1px solid #e5e7eb" }}>
                                      <div style={{ fontSize:11,fontWeight:800,color:C,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12 }}>Résultats par catégorie</div>
                                      <div style={{ display:"grid",gap:8 }}>
                                        {Object.entries(apprenantTest.by_category).map(([cat,val])=>{
                                          const total = val.total||val.max||10;
                                          const score = val.score??val.correct??0;
                                          const pct = Math.round((score/total)*100);
                                          return (
                                            <div key={cat}>
                                              <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3 }}>
                                                <span style={{ fontWeight:600,color:"#374151" }}>{cat}</span>
                                                <span style={{ color:pct>=70?c:"#dc2626",fontWeight:700 }}>{score}/{total} ({pct}%)</span>
                                              </div>
                                              <div style={{ height:6,background:"#e5e7eb",borderRadius:99,overflow:"hidden" }}>
                                                <div style={{ height:"100%",width:`${pct}%`,background:pct>=70?c:"#f87171",borderRadius:99 }}/>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Par CEFR */}
                                  {apprenantTest.by_cefr && Object.keys(apprenantTest.by_cefr).length>0 && (
                                    <div style={{ background:"#f8fafc",borderRadius:12,padding:16,border:"1px solid #e5e7eb" }}>
                                      <div style={{ fontSize:11,fontWeight:800,color:C,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12 }}>Répartition CECRL</div>
                                      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                                        {Object.entries(apprenantTest.by_cefr).map(([level,count])=>(
                                          <div key={level} style={{ padding:"6px 14px",borderRadius:8,background:CEFR_COLOR[level]+"18",border:`1px solid ${CEFR_COLOR[level]||"#e5e7eb"}30` }}>
                                            <div style={{ fontSize:14,fontWeight:800,color:CEFR_COLOR[level]||"#374151" }}>{level}</div>
                                            <div style={{ fontSize:11,color:"#6b7280" }}>{count} question{count>1?"s":""}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {apprenantTest.notes_oral && (
                                    <div style={{ background:"#f8fafc",borderRadius:12,padding:16,border:"1px solid #e5e7eb" }}>
                                      <div style={{ fontSize:11,fontWeight:800,color:C,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8 }}>Notes de l'oral</div>
                                      <p style={{ color:"#374151",fontSize:13,lineHeight:1.6,margin:0 }}>{apprenantTest.notes_oral}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* ── PRÉSENCES ── */}
                        {apprenantTab==="presences" && (
                          <div>
                            {apprenantPresLoading && <p style={{ textAlign:"center",color:"#9ca3af",padding:40 }}>Chargement…</p>}
                            {!apprenantPresLoading && apprenantPresences.length===0 && (
                              <div style={{ textAlign:"center",padding:"60px 20px",background:"#f8fafc",borderRadius:14,border:"1px solid #e5e7eb" }}>
                                <div style={{ fontSize:42,marginBottom:10 }}>✅</div>
                                <div style={{ fontWeight:700,color:"#0f172a",marginBottom:4 }}>Aucune présence enregistrée</div>
                                <p style={{ color:"#9ca3af",fontSize:13 }}>Les présences apparaîtront ici au fil des séances.</p>
                              </div>
                            )}
                            {!apprenantPresLoading && apprenantPresences.length>0 && (() => {
                              const presents = apprenantPresences.filter(p=>p.statut==="present").length;
                              const absents  = apprenantPresences.filter(p=>p.statut==="absent").length;
                              const retards  = apprenantPresences.filter(p=>p.statut==="retard").length;
                              const taux = Math.round(presents/apprenantPresences.length*100);
                              return (
                                <div style={{ display:"grid",gap:14 }}>
                                  {/* Stats */}
                                  <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
                                    {[
                                      { l:"Séances", v:apprenantPresences.length, c:"#0f172a" },
                                      { l:"Présent", v:presents, c:"#059669" },
                                      { l:"Absent", v:absents, c:"#dc2626" },
                                      { l:"Retard", v:retards, c:"#d97706" },
                                    ].map(s=>(
                                      <div key={s.l} style={{ background:"#f8fafc",borderRadius:10,padding:"12px",border:"1px solid #e5e7eb",textAlign:"center" }}>
                                        <div style={{ fontSize:20,fontWeight:900,color:s.c }}>{s.v}</div>
                                        <div style={{ fontSize:10,color:"#9ca3af",marginTop:2 }}>{s.l}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Barre taux */}
                                  <div style={{ background:"#f8fafc",borderRadius:10,padding:"12px 16px",border:"1px solid #e5e7eb" }}>
                                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6 }}>
                                      <span style={{ fontWeight:700,color:"#374151" }}>Taux de présence global</span>
                                      <span style={{ fontWeight:800,color:taux>=80?"#059669":taux>=60?"#d97706":"#dc2626" }}>{taux}%</span>
                                    </div>
                                    <div style={{ height:8,background:"#e5e7eb",borderRadius:99,overflow:"hidden" }}>
                                      <div style={{ height:"100%",width:`${taux}%`,background:taux>=80?"#059669":taux>=60?"#d97706":"#dc2626",borderRadius:99 }}/>
                                    </div>
                                  </div>
                                  {/* Liste séances */}
                                  <div style={{ borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden" }}>
                                    {apprenantPresences.sort((a,b)=>b.date_seance?.localeCompare(a.date_seance)).map((p,i)=>{
                                      const cfg = { present:{bg:"#d1fae5",c:"#065f46",icon:"✅",l:"Présent"}, absent:{bg:"#fee2e2",c:"#991b1b",icon:"❌",l:"Absent"}, retard:{bg:"#fef3c7",c:"#92400e",icon:"⏰",l:"Retard"} };
                                      const s = cfg[p.statut] || cfg.present;
                                      return (
                                        <div key={p.id||i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:i%2===0?"#fff":"#fafafa",borderBottom:"1px solid #f1f5f9" }}>
                                          <span style={{ fontSize:13,fontWeight:600,color:"#0f172a" }}>📅 {p.date_seance?new Date(p.date_seance).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short",year:"numeric"}):"—"}</span>
                                          <span style={{ padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:s.bg,color:s.c }}>{s.icon} {s.l}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── MODAL TRANSFERT DE GROUPE ── */}
              {showTransfert && selectedApprenantGroupe && (
                <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.75)",zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}
                  onClick={()=>setShowTransfert(false)}>
                  <div style={{ background:"#fff",borderRadius:18,width:"min(97vw,680px)",maxHeight:"93vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.35)" }}
                    onClick={e=>e.stopPropagation()}>

                    {/* Header */}
                    <div style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)",borderRadius:"18px 18px 0 0",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div>
                        <div style={{ color:"#c4b5fd",fontSize:11,fontWeight:700,marginBottom:3 }}>CHANGEMENT DE PROGRAMME</div>
                        <div style={{ color:"#fff",fontSize:16,fontWeight:800 }}>🔄 {selectedApprenantGroupe.prenom_apprenant} {selectedApprenantGroupe.nom_apprenant}</div>
                        <div style={{ color:"#c4b5fd",fontSize:12,marginTop:2 }}>Groupe actuel : {selectedGroupe?.nom||"—"} · Niveau {selectedApprenantGroupe.niveau||"—"}</div>
                      </div>
                      <button onClick={()=>setShowTransfert(false)} style={{ background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:20,width:36,height:36,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                    </div>

                    {/* Corps scrollable */}
                    <div style={{ flex:1,overflowY:"auto",padding:"24px" }}>

                      {/* Initiateur */}
                      <div style={{ marginBottom:18 }}>
                        <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:8 }}>Qui fait la demande ?</label>
                        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                          {[
                            { v:"apprenant",  l:"👤 L'apprenant directement" },
                            { v:"assistant",  l:"💬 Via l'assistant commercial" },
                            { v:"coach",      l:"🎓 Via le coach" },
                          ].map(opt=>(
                            <button key={opt.v} onClick={()=>setTransfertForm(f=>({...f,initiateur:opt.v}))}
                              style={{ padding:"8px 14px",borderRadius:20,border:`1.5px solid`,fontSize:12,fontWeight:600,cursor:"pointer",
                                borderColor:transfertForm.initiateur===opt.v?"#7c3aed":"#e5e7eb",
                                background:transfertForm.initiateur===opt.v?"#ede9fe":"#fff",
                                color:transfertForm.initiateur===opt.v?"#7c3aed":"#374151" }}>
                              {opt.l}
                            </button>
                          ))}
                        </div>
                        {transfertForm.initiateur==="coach" && (
                          <div style={{ marginTop:10,padding:"10px 12px",borderRadius:8,background:"#fef3c7",border:"1px solid #fde68a",fontSize:12,color:"#92400e" }}>
                            ℹ️ L'assistante commerciale de cet apprenant sera automatiquement notifiée pour mettre à jour ses données.
                          </div>
                        )}
                      </div>

                      {/* Disponibilités souhaitées */}
                      <div style={{ marginBottom:18 }}>
                        <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:8 }}>Nouveaux créneaux souhaités</label>
                        {/* Jours */}
                        <div style={{ fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:6 }}>Jours</div>
                        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                          {["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"].map(j=>{
                            const sel = transfertForm.jours.includes(j);
                            return (
                              <button key={j} type="button"
                                onClick={()=>setTransfertForm(f=>({ ...f, jours: sel ? f.jours.filter(x=>x!==j) : [...f.jours, j] }))}
                                style={{ padding:"6px 13px",borderRadius:20,border:`1.5px solid ${sel?"#7c3aed":"#e5e7eb"}`,
                                  background:sel?"#7c3aed":"#fff",color:sel?"#fff":"#374151",
                                  fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s" }}>
                                {j}
                              </button>
                            );
                          })}
                        </div>
                        {/* Créneaux horaires */}
                        <div style={{ fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:6 }}>Créneau horaire</div>
                        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                          {[
                            { v:"Matin (7h–12h)",       icon:"🌅" },
                            { v:"Après-midi (12h–17h)", icon:"☀️" },
                            { v:"Soir (17h–21h)",       icon:"🌆" },
                            { v:"Week-end matin",        icon:"🏖️" },
                            { v:"Week-end après-midi",   icon:"🏖️" },
                          ].map(opt=>{
                            const sel = transfertForm.creneau===opt.v;
                            return (
                              <button key={opt.v} type="button"
                                onClick={()=>setTransfertForm(f=>({ ...f, creneau: sel ? "" : opt.v }))}
                                style={{ padding:"6px 13px",borderRadius:20,border:`1.5px solid ${sel?"#7c3aed":"#e5e7eb"}`,
                                  background:sel?"#7c3aed":"#fff",color:sel?"#fff":"#374151",
                                  fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s" }}>
                                {opt.icon} {opt.v}
                              </button>
                            );
                          })}
                        </div>
                        {/* Récap */}
                        {(transfertForm.jours.length>0||transfertForm.creneau) && (
                          <div style={{ marginTop:10,padding:"8px 12px",borderRadius:8,background:"#ede9fe",border:"1px solid #c4b5fd",fontSize:12,color:"#7c3aed",fontWeight:600 }}>
                            📌 {[transfertForm.jours.join(", "),transfertForm.creneau].filter(Boolean).join(" — ")}
                          </div>
                        )}
                      </div>

                      {/* Motif */}
                      <div style={{ marginBottom:20 }}>
                        <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6 }}>Motif / contexte (optionnel)</label>
                        <textarea
                          value={transfertForm.motif}
                          onChange={e=>setTransfertForm(f=>({...f,motif:e.target.value}))}
                          rows={2}
                          placeholder="Ex: Changement d'horaires de travail, déménagement, …"
                          style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:13,resize:"vertical",boxSizing:"border-box" }}
                        />
                      </div>

                      {/* Sélection du groupe cible */}
                      <div>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                          <label style={{ fontSize:12,fontWeight:700,color:"#374151" }}>
                            Groupes compatibles — Niveau {selectedApprenantGroupe.niveau||"—"}
                          </label>
                          <button onClick={()=>searchGroupesCibles(selectedApprenantGroupe.niveau)}
                            style={{ padding:"5px 12px",background:"#ede9fe",color:"#7c3aed",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:11 }}>
                            🔄 Actualiser
                          </button>
                        </div>

                        {groupesCiblesLoading && <p style={{ textAlign:"center",color:"#9ca3af",padding:20 }}>Recherche des groupes…</p>}
                        {!groupesCiblesLoading && groupesCibles.length===0 && (
                          <div style={{ textAlign:"center",padding:24,background:"#f8fafc",borderRadius:10,border:"1px solid #e5e7eb",color:"#9ca3af",fontSize:13 }}>
                            Aucun groupe actif de niveau {selectedApprenantGroupe.niveau||"—"} trouvé.
                          </div>
                        )}
                        {!groupesCiblesLoading && groupesCibles.length>0 && (
                          <div style={{ display:"grid",gap:8 }}>
                            {groupesCibles.map(g=>{
                              const sel = transfertForm.nouveau_groupe_id===g.id;
                              const TYPE_ICO = { en_ligne:"💻",domicile:"🏠",centre:"🏢" };
                              return (
                                <div key={g.id} onClick={()=>setTransfertForm(f=>({...f,nouveau_groupe_id:g.id}))}
                                  style={{ padding:"12px 14px",borderRadius:10,border:`2px solid ${sel?"#7c3aed":"#e5e7eb"}`,
                                    background:sel?"#faf5ff":"#fff",cursor:"pointer",transition:"all .15s",display:"flex",gap:12,alignItems:"center" }}>
                                  <div style={{ width:36,height:36,borderRadius:"50%",background:sel?"#7c3aed":"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>
                                    {sel?"✅":"👥"}
                                  </div>
                                  <div style={{ flex:1,minWidth:0 }}>
                                    <div style={{ fontWeight:700,fontSize:13,color:sel?"#7c3aed":"#0f172a" }}>{g.nom}</div>
                                    <div style={{ fontSize:11,color:"#6b7280",marginTop:2 }}>
                                      {TYPE_ICO[g.type_cours]||"🏢"} {g.type_cours==="en_ligne"?"En ligne":g.type_cours==="domicile"?"Domicile":"Centre"}
                                      {g.filiere ? ` · ${g.filiere}` : ""}
                                      {g.coach_nom||g.nom_coach ? ` · 👨‍🏫 ${g.coach_nom||g.nom_coach}` : ""}
                                    </div>
                                  </div>
                                  <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,
                                    background:g.statut==="actif"?"#dcfce7":"#f1f5f9",
                                    color:g.statut==="actif"?"#166534":"#6b7280" }}>
                                    {g.nb_apprenants||0} appr.
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ padding:"16px 24px",borderTop:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10 }}>
                      <button onClick={()=>setShowTransfert(false)}
                        style={{ padding:"10px 20px",background:"#f1f5f9",color:"#374151",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13 }}>
                        Annuler
                      </button>
                      <button onClick={executerTransfert} disabled={!transfertForm.nouveau_groupe_id||transfertSaving}
                        style={{ padding:"10px 24px",background:transfertForm.nouveau_groupe_id?"linear-gradient(135deg,#7c3aed,#6d28d9)":"#e5e7eb",
                          color:transfertForm.nouveau_groupe_id?"#fff":"#9ca3af",border:"none",borderRadius:9,cursor:transfertForm.nouveau_groupe_id?"pointer":"default",
                          fontWeight:700,fontSize:13,opacity:transfertSaving?0.7:1 }}>
                        {transfertSaving ? "⏳ Transfert en cours…" : "✅ Confirmer le transfert"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── EDIT GROUPE MODAL ── */}
              {showEditGroupe && (
                <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
                  <div style={{ background:"#fff",borderRadius:16,width:660,maxWidth:"96vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:"1px solid #e5e7eb" }}>
                      <h3 style={{ margin:0,fontSize:15,fontWeight:800,color:"#0f172a" }}>✏️ Modifier le groupe</h3>
                      <button onClick={()=>setShowEditGroupe(false)} style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#6b7280" }}>✕</button>
                    </div>
                    <div style={{ padding:"20px 24px" }}>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
                        <div style={{ gridColumn:"1/-1" }}>
                          <label style={lbl}>Nom du groupe *</label>
                          <input style={inp} value={groupeForm.nom} onChange={e=>setGroupeForm(f=>({...f,nom:e.target.value}))} placeholder="ex: Groupe B2 Soir" />
                        </div>
                        <div>
                          <label style={lbl}>Niveau</label>
                          <select style={inp} value={groupeForm.niveau} onChange={e=>setGroupeForm(f=>({...f,niveau:e.target.value}))}>
                            <option value="">— Sélectionner —</option>
                            {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>Filière</label>
                          <select style={inp} value={groupeForm.filiere} onChange={e=>setGroupeForm(f=>({...f,filiere:e.target.value}))}>
                            <option value="">— Sélectionner —</option>
                            {["Anglais Général","Business","TOEIC","IELTS","TOEFL","Enfants","Autre"].map(f=><option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>Type de cours</label>
                          <select style={inp} value={groupeForm.type_cours} onChange={e=>setGroupeForm(f=>({...f,type_cours:e.target.value}))}>
                            <option value="en_ligne">💻 En ligne</option>
                            <option value="domicile">🏠 Domicile</option>
                            <option value="centre">🏢 Centre</option>
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>Coach</label>
                          <select style={inp} value={groupeForm.coach_id} onChange={e=>setGroupeForm(f=>({...f,coach_id:e.target.value}))}>
                            <option value="">— Aucun —</option>
                            {coaches.map(c=><option key={c.id} value={c.id}>{c.prenom||""} {c.nom||""}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>Capacité max</label>
                          <input type="number" min={1} max={50} style={inp} value={groupeForm.capacite_max} onChange={e=>setGroupeForm(f=>({...f,capacite_max:Number(e.target.value)}))} />
                        </div>
                        <div>
                          <label style={lbl}>Date début</label>
                          <input type="date" style={inp} value={groupeForm.date_debut} onChange={e=>setGroupeForm(f=>({...f,date_debut:e.target.value}))} />
                        </div>
                        <div>
                          <label style={lbl}>Date fin</label>
                          <input type="date" style={inp} value={groupeForm.date_fin} onChange={e=>setGroupeForm(f=>({...f,date_fin:e.target.value}))} />
                        </div>
                      </div>
                      <div style={{ marginBottom:16 }}>
                        <label style={lbl}>Horaires</label>
                        <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:8 }}>
                          <select style={{ ...inp,width:"auto",flex:"0 0 80px" }} value={horaireTmp.jour} onChange={e=>setHoraireTmp(h=>({...h,jour:e.target.value}))}>
                            {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(j=><option key={j} value={j}>{j}</option>)}
                          </select>
                          <input type="time" style={{ ...inp,width:"auto",flex:"0 0 100px" }} value={horaireTmp.debut} onChange={e=>setHoraireTmp(h=>({...h,debut:e.target.value}))} />
                          <span style={{ fontSize:12,color:"#6b7280",flexShrink:0 }}>→</span>
                          <input type="time" style={{ ...inp,width:"auto",flex:"0 0 100px" }} value={horaireTmp.fin} onChange={e=>setHoraireTmp(h=>({...h,fin:e.target.value}))} />
                          <button onClick={()=>setGroupeForm(f=>({...f,horaire:[...f.horaire,{...horaireTmp}]}))} style={{ ...btnP,flexShrink:0,whiteSpace:"nowrap" }}>+ Ajouter</button>
                        </div>
                        {groupeForm.horaire.length>0 && (
                          <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                            {groupeForm.horaire.map((h,i)=>(
                              <span key={i} style={{ padding:"3px 10px",borderRadius:8,background:C_LIGHT,color:C,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5 }}>
                                {h.jour} {h.debut}–{h.fin}
                                <button onClick={()=>setGroupeForm(f=>({...f,horaire:f.horaire.filter((_,j)=>j!==i)}))} style={{ background:"none",border:"none",cursor:"pointer",color:C,fontWeight:900,fontSize:13,padding:0,lineHeight:1 }}>×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
                        <button onClick={()=>setShowEditGroupe(false)} style={btnS}>Annuler</button>
                        <button onClick={editGroupe} disabled={groupeSaving} style={{ ...btnP,opacity:groupeSaving?0.7:1 }}>{groupeSaving?"Mise à jour…":"💾 Enregistrer les modifications"}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                {/* ── CREATE GROUPE MODAL ── */}
                {showCreateGroupe && (
                  <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
                    <div style={{ background:"#fff",borderRadius:16,width:660,maxWidth:"96vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:"1px solid #e5e7eb" }}>
                        <h3 style={{ margin:0,fontSize:15,fontWeight:800,color:"#0f172a" }}>👥 Créer un groupe</h3>
                        <button onClick={()=>setShowCreateGroupe(false)} style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#6b7280" }}>✕</button>
                      </div>
                      <div style={{ padding:"20px 24px" }}>
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
                          <div style={{ gridColumn:"1/-1" }}>
                            <label style={lbl}>Nom du groupe *</label>
                            <input style={inp} value={groupeForm.nom} onChange={e=>setGroupeForm(f=>({...f,nom:e.target.value}))} placeholder="ex: Groupe B2 Soir" />
                          </div>
                          <div>
                            <label style={lbl}>Niveau</label>
                            <select style={inp} value={groupeForm.niveau} onChange={e=>setGroupeForm(f=>({...f,niveau:e.target.value}))}>
                              <option value="">— Sélectionner —</option>
                              {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Filière</label>
                            <select style={inp} value={groupeForm.filiere} onChange={e=>setGroupeForm(f=>({...f,filiere:e.target.value}))}>
                              <option value="">— Sélectionner —</option>
                              {["Anglais Général","Business","TOEIC","IELTS","TOEFL","Enfants","Autre"].map(f=><option key={f} value={f}>{f}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Type de cours</label>
                            <select style={inp} value={groupeForm.type_cours} onChange={e=>setGroupeForm(f=>({...f,type_cours:e.target.value}))}>
                              <option value="en_ligne">💻 En ligne</option>
                              <option value="domicile">🏠 Domicile</option>
                              <option value="centre">🏢 Centre</option>
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Coach</label>
                            <select style={inp} value={groupeForm.coach_id} onChange={e=>setGroupeForm(f=>({...f,coach_id:e.target.value}))}>
                              <option value="">— Aucun —</option>
                              {coaches.map(c=><option key={c.id} value={c.id}>{c.prenom||""} {c.nom||""}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Capacité max</label>
                            <input type="number" min={1} max={50} style={inp} value={groupeForm.capacite_max} onChange={e=>setGroupeForm(f=>({...f,capacite_max:Number(e.target.value)}))} />
                          </div>
                          <div>
                            <label style={lbl}>Date début</label>
                            <input type="date" style={inp} value={groupeForm.date_debut} onChange={e=>setGroupeForm(f=>({...f,date_debut:e.target.value}))} />
                          </div>
                          <div>
                            <label style={lbl}>Date fin</label>
                            <input type="date" style={inp} value={groupeForm.date_fin} onChange={e=>setGroupeForm(f=>({...f,date_fin:e.target.value}))} />
                          </div>
                        </div>

                        {/* Horaires */}
                        <div style={{ marginBottom:16 }}>
                          <label style={lbl}>Horaires</label>
                          <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:8 }}>
                            <select style={{ ...inp,width:"auto",flex:"0 0 80px" }} value={horaireTmp.jour} onChange={e=>setHoraireTmp(h=>({...h,jour:e.target.value}))}>
                              {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(j=><option key={j} value={j}>{j}</option>)}
                            </select>
                            <input type="time" style={{ ...inp,width:"auto",flex:"0 0 100px" }} value={horaireTmp.debut} onChange={e=>setHoraireTmp(h=>({...h,debut:e.target.value}))} />
                            <span style={{ fontSize:12,color:"#6b7280",flexShrink:0 }}>→</span>
                            <input type="time" style={{ ...inp,width:"auto",flex:"0 0 100px" }} value={horaireTmp.fin} onChange={e=>setHoraireTmp(h=>({...h,fin:e.target.value}))} />
                            <button onClick={()=>setGroupeForm(f=>({...f,horaire:[...f.horaire,{...horaireTmp}]}))} style={{ ...btnP,flexShrink:0,whiteSpace:"nowrap" }}>+ Ajouter</button>
                          </div>
                          {groupeForm.horaire.length>0 && (
                            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                              {groupeForm.horaire.map((h,i)=>(
                                <span key={i} style={{ padding:"3px 10px",borderRadius:8,background:C_LIGHT,color:C,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5 }}>
                                  {h.jour} {h.debut}–{h.fin}
                                  <button onClick={()=>setGroupeForm(f=>({...f,horaire:f.horaire.filter((_,j)=>j!==i)}))} style={{ background:"none",border:"none",cursor:"pointer",color:C,fontWeight:900,fontSize:13,padding:0,lineHeight:1 }}>×</button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
                          <button onClick={()=>setShowCreateGroupe(false)} style={btnS}>Annuler</button>
                          <button onClick={createGroupe} disabled={groupeSaving} style={{ ...btnP,opacity:groupeSaving?0.7:1 }}>{groupeSaving?"Création…":"✅ Créer le groupe"}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ADD APPRENANT MODAL ── */}
                {showAddApprenant && (
                  <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
                    <div style={{ background:"#fff",borderRadius:16,width:480,maxWidth:"96vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:"1px solid #e5e7eb" }}>
                        <h3 style={{ margin:0,fontSize:15,fontWeight:800,color:"#0f172a" }}>🎓 Ajouter un apprenant</h3>
                        <button onClick={()=>setShowAddApprenant(false)} style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#6b7280" }}>✕</button>
                      </div>
                      <div style={{ padding:"20px 24px" }}>
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
                          <div>
                            <label style={lbl}>Prénom</label>
                            <input style={inp} value={apprenantForm.prenom_apprenant} onChange={e=>setApprenantForm(f=>({...f,prenom_apprenant:e.target.value}))} placeholder="Prénom" />
                          </div>
                          <div>
                            <label style={lbl}>Nom *</label>
                            <input style={inp} value={apprenantForm.nom_apprenant} onChange={e=>setApprenantForm(f=>({...f,nom_apprenant:e.target.value}))} placeholder="Nom de famille" />
                          </div>
                          <div>
                            <label style={lbl}>Email</label>
                            <input type="email" style={inp} value={apprenantForm.email_apprenant} onChange={e=>setApprenantForm(f=>({...f,email_apprenant:e.target.value}))} placeholder="email@exemple.com" />
                          </div>
                          <div>
                            <label style={lbl}>Téléphone</label>
                            <input style={inp} value={apprenantForm.telephone} onChange={e=>setApprenantForm(f=>({...f,telephone:e.target.value}))} placeholder="+225 07 00 00 00" />
                          </div>
                          <div style={{ gridColumn:"1/-1" }}>
                            <label style={lbl}>Niveau</label>
                            <select style={inp} value={apprenantForm.niveau} onChange={e=>setApprenantForm(f=>({...f,niveau:e.target.value}))}>
                              <option value="">— Sélectionner —</option>
                              {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                        <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
                          <button onClick={()=>setShowAddApprenant(false)} style={btnS}>Annuler</button>
                          <button onClick={addApprenant} style={btnP}>✅ Ajouter</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
              <div style={{ padding:"0 0 32px" }}>
                <MessagerieTab accentColor={C} />
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
            <div style={{ fontSize:12,fontWeight:700,color:"#374151",marginBottom:10 }}>🚀 Envois Kick-off à déclencher</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {CHECKLIST_ITEMS.map(item=>(
                <div key={item.id} style={{ padding:"8px 12px",borderRadius:8,background:"#f8fafc",border:"1px solid #e5e7eb",fontSize:12,display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:16,flexShrink:0 }}>{item.icon}</span>{item.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            {selectedApprenant.statut==="en_attente"&&(
              <button onClick={()=>{ setApprenants(prev=>prev.map(a=>a.id===selectedApprenant.id?{...a,statut:"en_cours"}:a)); setSuivis(prev=>[...prev,{id:Date.now(),apprenantId:selectedApprenant.id,apprenantNom:selectedApprenant.nom,coach:selectedApprenant.coach,dateDebut:new Date().toISOString().slice(0,10),checklist:{bienvenue:false,acces:false,kit:false,planning:false},notes:""}]); toast.success(`Onboarding démarré pour ${selectedApprenant.nom} ✓`); setShowAppModal(false); setActiveTab("suivi"); }} style={{ ...btnP,background:"#22c55e" }}>🚀 Démarrer l'onboarding</button>
            )}
            <button onClick={()=>{ setShowAppModal(false); setSelectedApprenant(null); }} style={btnS}>Fermer</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL DOSSIER RÉCEPTION + COACH + GROUPE (3 étapes) ══ */}
      {showDossierModal && dossierTarget && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.65)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:"#fff",borderRadius:18,width:700,maxWidth:"96vw",maxHeight:"93vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ background:`linear-gradient(135deg,#0f172a,${C})`,padding:"20px 26px",color:"#fff",borderRadius:"18px 18px 0 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11,color:"#c4b5fd",fontWeight:600,marginBottom:4 }}>Traitement du dossier</div>
                <h3 style={{ margin:0,fontSize:17,fontWeight:900 }}>📋 {dossierForm.nom||dossierTarget.nom}</h3>
                {/* Stepper 3 étapes */}
                <div style={{ display:"flex",gap:0,marginTop:12,alignItems:"center" }}>
                  {[{n:1,l:"Profil"},{n:2,l:"Coach"},{n:3,l:"Classe / Groupe"}].map((s,i,arr)=>(
                    <React.Fragment key={s.n}>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <div style={{ width:24,height:24,borderRadius:"50%",background:dossierStep>=s.n?"#a78bfa":"rgba(255,255,255,0.2)",color:dossierStep>=s.n?"#0f172a":"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:11,flexShrink:0 }}>{s.n}</div>
                        <span style={{ fontSize:10,fontWeight:dossierStep===s.n?700:400,color:dossierStep>=s.n?"#e9d5ff":"rgba(255,255,255,0.4)",whiteSpace:"nowrap" }}>{s.l}</span>
                      </div>
                      {i<arr.length-1&&<div style={{ width:24,height:2,background:"rgba(255,255,255,0.2)",margin:"0 6px",flexShrink:0 }}/>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <button onClick={()=>setShowDossierModal(false)} style={{ background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>✕</button>
            </div>

            <div style={{ padding:"24px 26px" }}>
              {/* ── ÉTAPE 1 : PROFIL ── */}
              {dossierStep===1&&(
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:18,display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ width:24,height:24,borderRadius:"50%",background:C,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900 }}>1</span>
                    Vérification et complétion du profil
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                    <div>
                      <label style={lbl}>Nom *</label>
                      <input style={inp} value={dossierForm.nom} onChange={e=>setDossierForm(f=>({...f,nom:e.target.value}))} placeholder="Nom de famille" />
                    </div>
                    <div>
                      <label style={lbl}>Prénoms *</label>
                      <input style={inp} value={dossierForm.prenom} onChange={e=>setDossierForm(f=>({...f,prenom:e.target.value}))} placeholder="Prénoms" />
                    </div>
                    <div>
                      <label style={lbl}>Adresse email *</label>
                      <input type="email" style={inp} value={dossierForm.email} onChange={e=>setDossierForm(f=>({...f,email:e.target.value}))} placeholder="email@exemple.com" />
                    </div>
                    <div>
                      <label style={lbl}>Contact (téléphone) *</label>
                      <input style={inp} value={dossierForm.telephone} onChange={e=>setDossierForm(f=>({...f,telephone:e.target.value}))} placeholder="+225 07 00 00 00" />
                    </div>
                    <div>
                      <label style={lbl}>Niveau *</label>
                      <select style={inp} value={dossierForm.niveau} onChange={e=>setDossierForm(f=>({...f,niveau:e.target.value}))}>
                        <option value="">— Sélectionner —</option>
                        {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n} value={n}>{n} — {NIVEAUX[n]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Programme choisi *</label>
                      <select style={inp} value={dossierForm.programme} onChange={e=>setDossierForm(f=>({...f,programme:e.target.value}))}>
                        <option value="">— Sélectionner —</option>
                        {PROGRAMMES.map(p=><option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Date de début supposée</label>
                      <input type="date" style={inp} value={dossierForm.date_debut_supposee} onChange={e=>setDossierForm(f=>({...f,date_debut_supposee:e.target.value}))} />
                    </div>
                    <div>
                      <label style={lbl}>Date de renouvellement supposée</label>
                      <input type="date" style={inp} value={dossierForm.date_renouvellement_supposee} onChange={e=>setDossierForm(f=>({...f,date_renouvellement_supposee:e.target.value}))} />
                    </div>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={lbl}>Description de l'apprenant</label>
                      <textarea style={{ ...inp,height:70,resize:"vertical" }} value={dossierForm.description} onChange={e=>setDossierForm(f=>({...f,description:e.target.value}))} placeholder="Profil : expérience, contexte professionnel, entreprise, points forts / points faibles…" />
                    </div>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={lbl}>Attentes par rapport à la formation</label>
                      <textarea style={{ ...inp,height:70,resize:"vertical" }} value={dossierForm.attentes} onChange={e=>setDossierForm(f=>({...f,attentes:e.target.value}))} placeholder="Ce que l'apprenant veut atteindre : certification, aisance orale, promotion, réunions internationales…" />
                    </div>
                  </div>
                  <div style={{ display:"flex",justifyContent:"flex-end",marginTop:20 }}>
                    <button onClick={()=>{
                      if(!dossierForm.nom.trim()||!dossierForm.email.trim()||!dossierForm.niveau||!dossierForm.programme){ toast.error("Remplissez les champs obligatoires (*)"); return; }
                      setDossierStep(2);
                    }} style={{ padding:"10px 24px",background:C,color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13 }}>
                      Suivant : Choisir le coach →
                    </button>
                  </div>
                </div>
              )}

              {/* ── ÉTAPE 2 : RECHERCHE COACH ── */}
              {dossierStep===2&&(
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:6,display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ width:24,height:24,borderRadius:"50%",background:"#0891b2",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900 }}>2</span>
                    Recherche et affectation du coach
                  </div>
                  <div style={{ padding:"10px 14px",borderRadius:10,background:"#e0f2fe",border:"1px solid #bae6fd",marginBottom:16,fontSize:12,color:"#0369a1" }}>
                    Niveau : <strong>{dossierForm.niveau}</strong> · Programme : <strong>{dossierForm.programme}</strong> — Les coaches compatibles sont mis en avant.
                  </div>

                  {/* Recherche */}
                  <input value={dossierCoachQ} onChange={e=>setDossierCoachQ(e.target.value)} placeholder="🔍 Rechercher un coach par nom…" style={{ ...inp,marginBottom:14 }} />

                  {coaches.length===0&&(
                    <div style={{ textAlign:"center",padding:24,color:"#9ca3af",fontSize:12 }}>Aucun coach disponible dans le système. Vous pouvez saisir un nom manuellement ci-dessous.</div>
                  )}

                  {/* Liste coaches */}
                  <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:300,overflowY:"auto",marginBottom:16 }}>
                    {coaches
                      .filter(c=>{
                        const q=dossierCoachQ.toLowerCase();
                        return !q || `${c.prenom||""} ${c.nom||""}`.toLowerCase().includes(q);
                      })
                      .sort((a,b)=>{
                        // Mise en avant : coaches dont le niveau ou la filière correspond
                        const aMatch = (a.niveaux||[]).includes(dossierForm.niveau)||(a.filieres||[]).some(f=>dossierForm.programme.toLowerCase().includes(f.toLowerCase()));
                        const bMatch = (b.niveaux||[]).includes(dossierForm.niveau)||(b.filieres||[]).some(f=>dossierForm.programme.toLowerCase().includes(f.toLowerCase()));
                        return (bMatch?1:0)-(aMatch?1:0);
                      })
                      .map(c=>{
                        const nom = `${c.prenom||""} ${c.nom||""}`.trim();
                        const selected = dossierSelectedCoach?.id===c.id;
                        const match = (c.niveaux||[]).includes(dossierForm.niveau)||(c.filieres||[]).some(f=>dossierForm.programme.toLowerCase().includes(f.toLowerCase()));
                        return (
                          <div key={c.id} onClick={()=>setDossierSelectedCoach(selected?null:c)}
                            style={{ padding:"12px 14px",borderRadius:10,border:`2px solid ${selected?C:"#e5e7eb"}`,background:selected?C_LIGHT:"#fafafa",cursor:"pointer",display:"flex",gap:12,alignItems:"center",transition:"all .15s" }}>
                            <div style={{ width:40,height:40,borderRadius:"50%",background:selected?C:"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:selected?"#fff":"#9ca3af",flexShrink:0 }}>{nom[0]||"?"}</div>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontSize:13,fontWeight:800,color:selected?C:"#0f172a" }}>{nom}</div>
                              <div style={{ fontSize:11,color:"#6b7280" }}>{c.email||"—"}</div>
                              {match&&<span style={{ fontSize:9,padding:"1px 6px",borderRadius:99,background:"#d1fae5",color:"#065f46",fontWeight:700 }}>✓ Compatible {dossierForm.niveau}</span>}
                            </div>
                            {selected&&<span style={{ color:C,fontWeight:900,fontSize:18 }}>✓</span>}
                          </div>
                        );
                      })
                    }
                  </div>

                  {/* Saisie manuelle si pas de coach dans la liste */}
                  <div style={{ padding:14,borderRadius:10,background:"#f8fafc",border:"1px solid #e5e7eb",marginBottom:20 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:"#374151",marginBottom:8 }}>✏️ Ou saisir le nom du coach manuellement</div>
                    <input style={inp} value={dossierForm.coach_nom} onChange={e=>{setDossierForm(f=>({...f,coach_nom:e.target.value}));setDossierSelectedCoach(null);}} placeholder="Ex : Prof. Martin" />
                  </div>

                  {/* Résumé sélection */}
                  {(dossierSelectedCoach||dossierForm.coach_nom)&&(
                    <div style={{ padding:"10px 14px",borderRadius:10,background:"#dcfce7",border:"1px solid #86efac",marginBottom:16,fontSize:12,color:"#166534" }}>
                      ✅ Coach sélectionné : <strong>{dossierSelectedCoach?`${dossierSelectedCoach.prenom||""} ${dossierSelectedCoach.nom||""}`.trim():dossierForm.coach_nom}</strong>
                    </div>
                  )}

                  <div style={{ display:"flex",gap:10,justifyContent:"space-between" }}>
                    <button onClick={()=>setDossierStep(1)} style={{ ...btnS }}>← Retour</button>
                    <button onClick={()=>{
                      if(!dossierSelectedCoach && !dossierForm.coach_nom.trim()){ toast.error("Sélectionnez ou saisissez un coach"); return; }
                      setDossierSelectedGroupe(null); setDossierCreerGroupe(false);
                      setDossierStep(3);
                    }} style={{ padding:"10px 24px",background:"#0891b2",color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13 }}>
                      Suivant : Affecter au groupe →
                    </button>
                  </div>
                </div>
              )}

              {/* ── ÉTAPE 3 : AFFECTATION GROUPE ── */}
              {dossierStep===3&&(()=>{
                const coachNom = dossierSelectedCoach
                  ? `${dossierSelectedCoach.prenom||""} ${dossierSelectedCoach.nom||""}`.trim()
                  : dossierForm.coach_nom;
                return (
                  <div>
                    <div style={{ fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:6,display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ width:24,height:24,borderRadius:"50%",background:"#22c55e",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900 }}>3</span>
                      Affectation à un groupe / classe
                    </div>

                    {/* Rappel */}
                    <div style={{ padding:"10px 14px",borderRadius:10,background:"#f0fdf4",border:"1px solid #86efac",marginBottom:16,fontSize:12,color:"#166534" }}>
                      Coach : <strong>{coachNom}</strong> · Niveau : <strong>{dossierForm.niveau}</strong> · Programme : <strong>{dossierForm.programme}</strong>
                    </div>

                    {/* Groupes du coach pour ce niveau */}
                    {groupesCoachNiveau.length > 0 ? (
                      <div style={{ marginBottom:16 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:"#374151",marginBottom:10 }}>
                          Groupes de <strong>{coachNom}</strong> — Niveau <strong>{dossierForm.niveau}</strong>
                        </div>
                        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                          {groupesCoachNiveau.map(g=>{
                            const nbApp    = g.nb_apprenants || 0;
                            const cap      = g.capacite_max  || 20;
                            const plein    = nbApp >= cap;
                            const selected = dossierSelectedGroupe?.id === g.id;
                            const pct      = Math.round((nbApp / cap) * 100);
                            return (
                              <div key={g.id}
                                onClick={()=>{ if(plein) return; setDossierSelectedGroupe(selected?null:g); setDossierCreerGroupe(false); }}
                                style={{ padding:"12px 14px",borderRadius:10,border:`2px solid ${selected?"#22c55e":plein?"#e5e7eb":"#e5e7eb"}`,background:selected?"#f0fdf4":plein?"#f9fafb":"#fafafa",cursor:plein?"not-allowed":"pointer",opacity:plein?0.6:1,display:"flex",gap:12,alignItems:"center" }}>
                                <div style={{ flex:1,minWidth:0 }}>
                                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                                    <span style={{ fontSize:13,fontWeight:800,color:plein?"#9ca3af":"#0f172a" }}>{g.nom}</span>
                                    {plein
                                      ? <span style={{ fontSize:10,padding:"1px 7px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:700 }}>🔒 Complet</span>
                                      : <span style={{ fontSize:10,padding:"1px 7px",borderRadius:99,background:"#d1fae5",color:"#065f46",fontWeight:700 }}>✓ Disponible</span>
                                    }
                                  </div>
                                  {/* Barre de quota */}
                                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                                    <div style={{ flex:1,height:6,background:"#e5e7eb",borderRadius:3,overflow:"hidden" }}>
                                      <div style={{ height:"100%",width:`${pct}%`,background:plein?"#ef4444":pct>=75?"#f59e0b":"#22c55e",borderRadius:3 }}/>
                                    </div>
                                    <span style={{ fontSize:11,fontWeight:700,color:plein?"#dc2626":"#374151",flexShrink:0 }}>{nbApp}/{cap} places</span>
                                  </div>
                                  {g.date_debut&&<div style={{ fontSize:10,color:"#9ca3af",marginTop:3 }}>Début : {formatDate(g.date_debut)}</div>}
                                </div>
                                {selected&&<span style={{ color:"#22c55e",fontWeight:900,fontSize:20,flexShrink:0 }}>✓</span>}
                              </div>
                            );
                          })}
                        </div>

                        {/* Si tous complets → inviter à créer */}
                        {tousComplets && !dossierCreerGroupe && (
                          <div style={{ marginTop:12,padding:"10px 14px",borderRadius:10,background:"#fff7ed",border:"1px solid #fed7aa",fontSize:12,color:"#c2410c" }}>
                            ⚠️ Tous les groupes de ce coach à ce niveau sont complets.
                            <button onClick={()=>{ setDossierCreerGroupe(true); setDossierSelectedGroupe(null); }} style={{ marginLeft:10,padding:"3px 10px",background:"#ea580c",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:11 }}>
                              + Créer un nouveau groupe
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding:"14px",borderRadius:10,background:"#fff7ed",border:"1px solid #fed7aa",marginBottom:16,fontSize:12,color:"#c2410c" }}>
                        ⚠️ <strong>{coachNom}</strong> n'a pas encore de groupe au niveau <strong>{dossierForm.niveau}</strong>. Un nouveau groupe sera créé.
                      </div>
                    )}

                    {/* Bouton créer un groupe (si disponibles mais veut quand même créer, ou si aucun groupe) */}
                    {!dossierCreerGroupe && (groupesCoachNiveau.length===0 || (!tousComplets && groupesDisponibles.length>0)) && (
                      <button onClick={()=>{ setDossierCreerGroupe(true); setDossierSelectedGroupe(null); }} style={{ padding:"8px 14px",background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12,marginBottom:16 }}>
                        + Créer un nouveau groupe
                      </button>
                    )}

                    {/* Formulaire création groupe */}
                    {(dossierCreerGroupe || groupesCoachNiveau.length===0) && (
                      <div style={{ padding:16,borderRadius:12,background:"#f8fafc",border:"2px dashed #c4b5fd",marginBottom:16 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:C,marginBottom:12 }}>👥 Nouveau groupe — {coachNom} · {dossierForm.niveau}</div>
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                          <div style={{ gridColumn:"1/-1" }}>
                            <label style={lbl}>Nom du groupe *</label>
                            <input style={inp} value={dossierNouveauGroupe.nom}
                              onChange={e=>setDossierNouveauGroupe(f=>({...f,nom:e.target.value}))}
                              placeholder={`Ex : ${dossierForm.programme} — ${dossierForm.niveau} Soir`} />
                          </div>
                          <div>
                            <label style={lbl}>Date de début</label>
                            <input type="date" style={inp} value={dossierNouveauGroupe.date_debut}
                              onChange={e=>setDossierNouveauGroupe(f=>({...f,date_debut:e.target.value}))} />
                          </div>
                          <div>
                            <label style={lbl}>Capacité maximale</label>
                            <input type="number" min={2} max={30} style={inp} value={dossierNouveauGroupe.capacite_max}
                              onChange={e=>setDossierNouveauGroupe(f=>({...f,capacite_max:Number(e.target.value)}))} />
                          </div>
                        </div>
                        <div style={{ fontSize:10,color:"#9ca3af",marginTop:8 }}>
                          Le coach <strong>{coachNom}</strong> recevra une notification de création de groupe.
                        </div>
                      </div>
                    )}

                    {/* Résumé final */}
                    {(dossierSelectedGroupe||dossierCreerGroupe||groupesCoachNiveau.length===0)&&(
                      <div style={{ padding:"10px 14px",borderRadius:10,background:`${C_LIGHT}`,border:`1px solid ${C}30`,marginBottom:16,fontSize:12 }}>
                        <div style={{ fontWeight:700,color:C,marginBottom:4 }}>✅ Récapitulatif de l'affectation</div>
                        <div style={{ color:"#374151" }}>
                          <strong>{dossierForm.prenom} {dossierForm.nom}</strong> · {dossierForm.niveau} · {dossierForm.programme}<br/>
                          Coach : <strong>{coachNom}</strong><br/>
                          Groupe : <strong>{dossierSelectedGroupe?.nom || dossierNouveauGroupe.nom || `Nouveau groupe ${dossierForm.niveau}`}</strong>
                          {(dossierCreerGroupe||groupesCoachNiveau.length===0) && <span style={{ marginLeft:6,padding:"1px 6px",borderRadius:99,background:"#fef3c7",color:"#92400e",fontSize:10,fontWeight:700 }}>À créer</span>}
                        </div>
                      </div>
                    )}

                    <div style={{ display:"flex",gap:10,justifyContent:"space-between" }}>
                      <button onClick={()=>setDossierStep(2)} style={btnS}>← Retour</button>
                      <button onClick={confirmerAffectation} disabled={dossierSaving||(!dossierSelectedGroupe&&!dossierCreerGroupe&&groupesCoachNiveau.length>0)}
                        style={{ padding:"10px 24px",background:dossierSaving?"#9ca3af":"#22c55e",color:"#fff",border:"none",borderRadius:9,cursor:dossierSaving?"wait":"pointer",fontWeight:700,fontSize:13,opacity:((!dossierSelectedGroupe&&!dossierCreerGroupe&&groupesCoachNiveau.length>0)||dossierSaving)?0.6:1 }}>
                        {dossierSaving ? "⏳ En cours…" : "✅ Confirmer et démarrer l'onboarding"}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
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
