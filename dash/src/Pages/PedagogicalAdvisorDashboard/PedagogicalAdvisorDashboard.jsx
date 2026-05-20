// src/Pages/PedagogicalAdvisorDashboard/PedagogicalAdvisorDashboard.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import NotificationBell from "../../Components/NotificationBell";
import NotificationsTab from "../../Components/NotificationsTab";
import { useNotifPoller } from "../../hooks/useNotifPoller";
import ProspectChatPanel from "../../Components/ProspectChatPanel";
import MessagerieTab from "../../Components/MessagerieTab";

/* ═══════════════════════════════════════════════════════
   CHARTE COULEURS — Pedagogical Advisor (violet)
═══════════════════════════════════════════════════════ */
const PA_COLOR    = "#7c3aed";
const PA_DARK     = "#5b21b6";
const PA_LIGHT    = "#ede9fe";
const PA_GRADIENT = "linear-gradient(135deg, #0f172a 0%, #7c3aed 100%)";
const FF          = "'Inter','Segoe UI',sans-serif";

/* ═══════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES
═══════════════════════════════════════════════════════ */
const StatCard = ({ label, value, color, icon, sub, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff", padding:18, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,.06)", display:"flex", alignItems:"center", gap:14, cursor:onClick?"pointer":"default", border:"1px solid #f1f5f9", transition:"transform .15s, box-shadow .15s" }}
    onMouseOver={e => { if(onClick) e.currentTarget.style.transform="translateY(-2px)"; }}
    onMouseOut={e => { e.currentTarget.style.transform="none"; }}
  >
    <div style={{ width:50, height:50, borderRadius:12, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{icon}</div>
    <div>
      <div style={{ fontSize:11, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:".04em" }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color, lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>{sub}</div>}
    </div>
  </div>
);

const Badge = ({ label, color, bg }) => (
  <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:99, fontSize:10, fontWeight:700, color, background:bg, whiteSpace:"nowrap" }}>{label}</span>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:16 }}>
    <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:wide?720:540, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.2)", padding:28 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0f172a" }}>{title}</h3>
        <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:8, width:32, height:32, fontSize:16, cursor:"pointer", color:"#6b7280" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Section = ({ title, children, action }) => (
  <div style={{ background:"#fff", borderRadius:14, padding:"20px 22px", boxShadow:"0 2px 8px rgba(0,0,0,.06)", border:"1px solid #f1f5f9" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
      <h4 style={{ margin:0, fontSize:14, fontWeight:800, color:"#0f172a" }}>{title}</h4>
      {action}
    </div>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
    {label && <label style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{label}</label>}
    <input style={{ padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", fontFamily:FF }} {...props} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
    {label && <label style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{label}</label>}
    <select style={{ padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", fontFamily:FF, background:"#fff" }} {...props}>
      {children}
    </select>
  </div>
);

const Btn = ({ children, onClick, color = PA_COLOR, outline, small, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline ? "transparent" : color,
    color: outline ? color : "#fff",
    border: `1.5px solid ${color}`,
    borderRadius: 8, padding: small ? "6px 12px" : "9px 18px",
    fontSize: small ? 12 : 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? .6 : 1, fontFamily: FF, whiteSpace:"nowrap",
    transition:"all .15s",
  }}>{children}</button>
);

const ProgressBar = ({ value, color = PA_COLOR }) => (
  <div style={{ height:7, background:"#e5e7eb", borderRadius:999, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.min(100,value)}%`, background:color, borderRadius:999, transition:"width .4s" }} />
  </div>
);

function EcheancePicker({ tranche, onSave }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(tranche.date_echeance || "");
  if (!editing) return (
    <button onClick={() => setEditing(true)} title="Modifier l'échéance" style={{ background:"#e0f2fe", border:"1px solid #bae6fd", borderRadius:6, padding:"4px 8px", fontSize:12, cursor:"pointer" }}>📅</button>
  );
  return (
    <div style={{ display:"flex", gap:4 }}>
      <input type="date" value={val} onChange={e=>setVal(e.target.value)} style={{ padding:"3px 6px", border:"1.5px solid #0891b2", borderRadius:6, fontSize:11 }} />
      <button onClick={async()=>{await onSave(val);setEditing(false);}} style={{ background:"#0891b2", color:"#fff", border:"none", borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer" }}>✓</button>
      <button onClick={()=>setEditing(false)} style={{ background:"#e5e7eb", border:"none", borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer" }}>✕</button>
    </div>
  );
}

function AddTrancheForm({ onAdd }) {
  const [form, setForm] = React.useState({ label:"", montant:"", date_echeance:"" });
  const [saving, setSaving] = React.useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const canSubmit = form.label.trim() && form.montant && form.date_echeance;
  const handleAdd = async () => {
    if (!canSubmit) return;
    setSaving(true);
    await onAdd({ label:form.label.trim(), montant:Number(form.montant), date_echeance:form.date_echeance, notes:null });
    setForm({ label:"", montant:"", date_echeance:"" });
    setSaving(false);
  };
  return (
    <div style={{ padding:"14px", background:"#f8fafc", borderRadius:10, border:"1.5px dashed #cbd5e1" }}>
      <div style={{ fontSize:12, fontWeight:800, color:"#374151", marginBottom:10 }}>+ Ajouter une tranche</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
        <input placeholder="Label (ex: Acompte)" value={form.label} onChange={e=>set("label",e.target.value)} style={{ padding:"8px 10px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none" }} />
        <input type="number" placeholder="Montant (FCFA)" value={form.montant} onChange={e=>set("montant",e.target.value)} style={{ padding:"8px 10px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none" }} />
        <input type="date" value={form.date_echeance} onChange={e=>set("date_echeance",e.target.value)} style={{ padding:"8px 10px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none" }} />
      </div>
      <button onClick={handleAdd} disabled={!canSubmit||saving} style={{ padding:"8px 18px", background:PA_COLOR, color:"#fff", border:"none", borderRadius:7, fontWeight:700, fontSize:12, cursor:canSubmit?"pointer":"not-allowed", opacity:canSubmit?1:.5 }}>
        {saving?"Ajout…":"+ Ajouter la tranche"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK
═══════════════════════════════════════════════════════ */
const NIVEAUX = ["A1","A2","B1","B2","C1","C2"];

const INIT_COACHES = [
  { id:1, nom:"Koné Awa",       specialite:"Business English", niveaux:["B1","B2","C1"], tarif_h:8000,  dispo:true,  contrat:"CDI",    photo:null, nbSeancesTotal:42 },
  { id:2, nom:"Diallo Mamadou", specialite:"TOEIC / IELTS",    niveaux:["A2","B1","B2"], tarif_h:7500,  dispo:true,  contrat:"Vacataire", photo:null, nbSeancesTotal:38 },
  { id:3, nom:"Touré Fatoumata",specialite:"Anglais général",  niveaux:["A1","A2","B1"], tarif_h:6000,  dispo:false, contrat:"CDD",    photo:null, nbSeancesTotal:55 },
  { id:4, nom:"Bamba Seydou",   specialite:"Communication",    niveaux:["B2","C1","C2"], tarif_h:9000,  dispo:true,  contrat:"CDI",    photo:null, nbSeancesTotal:29 },
  { id:5, nom:"Coulibaly Aïda", specialite:"Anglais académique",niveaux:["A1","A2","B1","B2"], tarif_h:7000, dispo:true, contrat:"Vacataire", photo:null, nbSeancesTotal:61 },
];

const INIT_APPRENANTS = [
  { id:1, nom:"Kouamé Yao",    niveau:"B1", objectif:"TOEIC",          progression:62, coachId:1, seancesRealisees:8, seancesPlanifiees:12, statut:"actif"    },
  { id:2, nom:"N'Guessan Aya", niveau:"A2", objectif:"Général",        progression:35, coachId:5, seancesRealisees:5, seancesPlanifiees:10, statut:"actif"    },
  { id:3, nom:"Traoré Ibou",   niveau:"B2", objectif:"Business",       progression:78, coachId:4, seancesRealisees:14,seancesPlanifiees:16, statut:"actif"    },
  { id:4, nom:"Bah Mariam",    niveau:"A1", objectif:"Général",        progression:20, coachId:5, seancesRealisees:3, seancesPlanifiees:8,  statut:"actif"    },
  { id:5, nom:"Koné Drissa",   niveau:"C1", objectif:"Certif IELTS",   progression:88, coachId:4, seancesRealisees:10,seancesPlanifiees:10, statut:"terminé"  },
];

const INIT_COURS = [
  { id:1, apprenantId:1, apprenantNom:"Kouamé Yao",    coachId:1, coachNom:"Koné Awa",        niveau:"B1", horaire:"Lun-Mer 18h", debut:"2026-03-01", fin:"2026-06-30", statut:"actif",    nbSeances:12, typeSeance:"présentiel" },
  { id:2, apprenantId:2, apprenantNom:"N'Guessan Aya", coachId:5, coachNom:"Coulibaly Aïda",  niveau:"A2", horaire:"Mar-Jeu 09h", debut:"2026-03-15", fin:"2026-05-31", statut:"actif",    nbSeances:10, typeSeance:"en ligne"   },
  { id:3, apprenantId:3, apprenantNom:"Traoré Ibou",   coachId:4, coachNom:"Bamba Seydou",    niveau:"B2", horaire:"Sam 10h",     debut:"2026-02-01", fin:"2026-04-30", statut:"actif",    nbSeances:16, typeSeance:"présentiel" },
  { id:4, apprenantId:4, apprenantNom:"Bah Mariam",    coachId:5, coachNom:"Coulibaly Aïda",  niveau:"A1", horaire:"Lun-Ven 14h", debut:"2026-04-01", fin:"2026-07-31", statut:"actif",    nbSeances:8,  typeSeance:"en ligne"   },
  { id:5, apprenantId:5, apprenantNom:"Koné Drissa",   coachId:4, coachNom:"Bamba Seydou",    niveau:"C1", horaire:"Jeu 17h",     debut:"2026-01-10", fin:"2026-04-10", statut:"terminé",  nbSeances:10, typeSeance:"présentiel" },
];

// Séances réalisées ce mois (pour honoraires)
const INIT_SEANCES = [
  { id:1, coachId:1, coachNom:"Koné Awa",        apprenantNom:"Kouamé Yao",    date:"2026-05-05", dureeH:1.5, montant:12000, validee:false },
  { id:2, coachId:1, coachNom:"Koné Awa",        apprenantNom:"Kouamé Yao",    date:"2026-05-07", dureeH:1.5, montant:12000, validee:false },
  { id:3, coachId:2, coachNom:"Diallo Mamadou",  apprenantNom:"Bah Mariam",    date:"2026-05-06", dureeH:1,   montant:7500,  validee:false },
  { id:4, coachId:4, coachNom:"Bamba Seydou",    apprenantNom:"Traoré Ibou",   date:"2026-05-03", dureeH:2,   montant:18000, validee:true  },
  { id:5, coachId:4, coachNom:"Bamba Seydou",    apprenantNom:"Traoré Ibou",   date:"2026-05-10", dureeH:2,   montant:18000, validee:true  },
  { id:6, coachId:5, coachNom:"Coulibaly Aïda",  apprenantNom:"N'Guessan Aya", date:"2026-05-04", dureeH:1.5, montant:10500, validee:false },
  { id:7, coachId:5, coachNom:"Coulibaly Aïda",  apprenantNom:"Bah Mariam",    date:"2026-05-09", dureeH:1.5, montant:10500, validee:false },
];

const STATUT_COURS = {
  actif:    { label:"Actif",    color:"#16a34a", bg:"#dcfce7" },
  terminé:  { label:"Terminé",  color:"#6b7280", bg:"#f3f4f6" },
  suspendu: { label:"Suspendu", color:"#f59e0b", bg:"#fef3c7" },
};

const STATUT_PROSPECT = {
  nouveau:    { label:"Nouveau",    color:"#0891b2", bg:"#e0f2fe",  icon:"🆕" },
  en_cours:   { label:"En cours",   color:"#f59e0b", bg:"#fef3c7",  icon:"⏳" },
  converti:   { label:"Converti",   color:"#22c55e", bg:"#dcfce7",  icon:"✅" },
  perdu:      { label:"Perdu",      color:"#ef4444", bg:"#fee2e2",  icon:"❌" },
};

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
const authHeaders = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("admin_token")}` });

const formatMoney = (v) => (v||0).toLocaleString("fr-FR") + " FCFA";
const formatDate  = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" }) : "—";

/* ═══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function PedagogicalAdvisorDashboard() {
  const navigate  = useNavigate();
  const profil    = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom    = profil?.prenom || "";
  const nom       = profil?.nom    || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || "Pedagogical Advisor";
  const initiales  = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "PA";

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace:true });
  };

  useNotifPoller({ userId: profil?.id, sources: ["cours_prives"] });

  /* ── États principaux ── */
  const [activeTab, setActiveTab] = useState("dashboard");
  const [coaches,   setCoaches]   = useState(INIT_COACHES);
  const [apprenants, setApprenants] = useState(INIT_APPRENANTS);
  const [cours,     setCours]     = useState(INIT_COURS);
  const [seances,   setSeances]   = useState(INIT_SEANCES);

  /* ── Prospects domicile (depuis l'API) ── */
  const [prospects,        setProspects]        = useState([]);
  const [prospectsLoading, setProspectsLoading] = useState(false);
  const [prospectSearch,   setProspectSearch]   = useState("");
  const [prospectFiltreStatut, setProspectFiltreStatut] = useState("tous");
  const [prospectModal,    setProspectModal]    = useState(null); // assignation détaillée
  const [prospectCoachForm, setProspectCoachForm] = useState({}); // { [id]: coachId }
  const [prospectDossier,  setProspectDossier]  = useState({ niveau:"", nb_seances:"", formation:"", cout_formation:"" });
  const [savingDossier,    setSavingDossier]    = useState(false);

  const fetchProspects = useCallback(async () => {
    setProspectsLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/parcours/assignations`, { headers: authHeaders() });
      if (r.ok) {
        const d = await r.json();
        setProspects(d.assignations || []);
      }
    } catch (e) { console.error("Chargement prospects PA:", e); }
    finally { setProspectsLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "prospects" || activeTab === "apprenants") fetchProspects();
  }, [activeTab, fetchProspects]);

  const updateProspectStatut = async (id, statut) => {
    try {
      const r = await fetch(`${API_URL}/api/parcours/assignations/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ statut }),
      });
      if (r.ok) {
        setProspects(prev => prev.map(p => p.id === id ? { ...p, statut } : p));
        setProspectModal(prev => prev?.id === id ? { ...prev, statut } : prev);
        toast.success("Statut mis à jour ✓");
      }
    } catch { toast.error("Erreur lors de la mise à jour"); }
  };

  const affecterCoachProspect = async (prospectId) => {
    const coachId = prospectCoachForm[prospectId];
    if (!coachId) { toast.error("Sélectionnez un coach"); return; }
    const coach = coaches.find(c => c.id === +coachId);
    try {
      await fetch(`${API_URL}/api/parcours/assignations/${prospectId}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ statut: "en_cours", notes_coach: coach?.nom }),
      });
      setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, statut:"en_cours", coach_nom: coach?.nom } : p));
      setProspectModal(prev => prev?.id === prospectId ? { ...prev, statut:"en_cours", coach_nom: coach?.nom } : prev);
      toast.success(`${coach?.nom} affecté au prospect ✓`);
    } catch { toast.error("Erreur lors de l'affectation"); }
  };

  const saveDossierProspect = async (prospectId) => {
    if (!prospectDossier.niveau || !prospectDossier.nb_seances || !prospectDossier.formation) {
      toast.error("Remplissez tous les champs du dossier"); return;
    }
    setSavingDossier(true);
    try {
      const sd = {
        niveau_prospect:       prospectDossier.niveau,
        nb_seances_souhaitees: Number(prospectDossier.nb_seances),
        formation_souhaitee:   prospectDossier.formation,
        cout_formation:        prospectDossier.cout_formation ? Number(prospectDossier.cout_formation) : null,
      };
      const r = await fetch(`${API_URL}/api/parcours/assignations/${prospectId}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ suivi_demarrage: sd }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Erreur");
      const updated = { suivi_demarrage: sd };
      setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, ...updated } : p));
      setProspectModal(prev => prev?.id === prospectId ? { ...prev, ...updated } : prev);
      toast.success("Dossier prospect mis à jour ✓");
    } catch (e) { toast.error(e.message || "Erreur lors de la sauvegarde"); }
    finally { setSavingDossier(false); }
  };

  const prospectsFiltered = useMemo(() => {
    let list = prospects;
    if (prospectFiltreStatut !== "tous") list = list.filter(p => p.statut === prospectFiltreStatut);
    if (prospectSearch.trim()) {
      const q = prospectSearch.toLowerCase();
      list = list.filter(p =>
        (p.prospect_nom || "").toLowerCase().includes(q) ||
        (p.prospect_email || "").toLowerCase().includes(q) ||
        (p.prospect_telephone || "").includes(q)
      );
    }
    return list;
  }, [prospects, prospectFiltreStatut, prospectSearch]);

  /* ── Mes apprenants ── */
  const [apprenantModal,   setApprenantModal]   = useState(null);
  const [apprenantTab,     setApprenantTab]     = useState("infos");
  const [appSearchQ,       setAppSearchQ]       = useState("");
  const [appNiveau,        setAppNiveau]        = useState("tous");
  const [chatApprenant,    setChatApprenant]    = useState(null);
  const [progNotes,        setProgNotes]        = useState({});
  const [addingSession,    setAddingSession]    = useState(false);
  const [sessionForm,      setSessionForm]      = useState({ date:new Date().toISOString().slice(0,10), statut:"present" });
  const [progNote,         setProgNote]         = useState("");
  const [savingProgNote,   setSavingProgNote]   = useState(false);
  const [apprenantPaiements, setApprenantPaiements] = useState([]);
  const [loadingPaiements,   setLoadingPaiements]   = useState(false);
  const [versementForm,      setVersementForm]       = useState({ montant:"", date:new Date().toISOString().slice(0,10), mode:"Mobile Money", ref:"", notes:"" });
  const [addingVersement,    setAddingVersement]    = useState(false);
  const [savingVersement,    setSavingVersement]    = useState(false);

  const fetchPaiementsApprenant = useCallback(async (assignationId) => {
    setLoadingPaiements(true);
    try {
      const r = await fetch(`${API_URL}/api/paiements/assignation/${assignationId}`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setApprenantPaiements(d.paiements || []); }
    } catch { /* silencieux */ }
    finally { setLoadingPaiements(false); }
  }, []);

  const handleSaveVersement = async (a) => {
    if (!versementForm.montant) { toast.error("Montant requis"); return; }
    setSavingVersement(true);
    try {
      const r = await fetch(`${API_URL}/api/paiements/submit`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          client:         a.prospect_nom || "",
          email:          a.prospect_email || "",
          telephone:      a.prospect_telephone || "",
          offre:          (a.suivi_demarrage||{}).formation_souhaitee || "Cours domicile privé",
          inscription:    `Cours à domicile · Niveau ${(a.suivi_demarrage||{}).niveau_prospect||"?"} · ${(a.suivi_demarrage||{}).nb_seances_souhaitees||"?"} séances`,
          montant_du:     (a.suivi_demarrage||{}).cout_formation ? Number((a.suivi_demarrage||{}).cout_formation) : Number(versementForm.montant),
          montant_recu:   Number(versementForm.montant),
          date_paiement:  versementForm.date,
          mode_paiement:  versementForm.mode,
          statut:         "reçu",
          ref_transaction: versementForm.ref || null,
          notes:          versementForm.notes || null,
          assignation_id: a.id,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Erreur");
      await fetchPaiementsApprenant(a.id);
      setVersementForm({ montant:"", date:new Date().toISOString().slice(0,10), mode:"Mobile Money", ref:"", notes:"" });
      setAddingVersement(false);
      toast.success("Versement enregistré ✓");
    } catch (e) { toast.error(e.message || "Erreur"); }
    finally { setSavingVersement(false); }
  };

  const handleSavePlanPaiement = useCallback(async (id, plan_paiement) => {
    try {
      await fetch(`${API_URL}/api/parcours/assignations/${id}`, {
        method:"PATCH", headers:authHeaders(), body:JSON.stringify({ plan_paiement }),
      });
      setProspects(prev => prev.map(p => p.id === id ? { ...p, plan_paiement } : p));
      setApprenantModal(prev => prev?.id === id ? { ...prev, plan_paiement } : prev);
    } catch { toast.error("Erreur sauvegarde plan paiement"); }
  }, []);

  const handleSavePresencesPA = useCallback(async (id, suivi_presences) => {
    try {
      await fetch(`${API_URL}/api/parcours/assignations/${id}`, {
        method:"PATCH", headers:authHeaders(), body:JSON.stringify({ suivi_presences }),
      });
      setProspects(prev => prev.map(p => p.id === id ? { ...p, suivi_presences } : p));
      setApprenantModal(prev => prev?.id === id ? { ...prev, suivi_presences } : prev);
      toast.success("Suivi mis à jour ✓");
    } catch { toast.error("Erreur sauvegarde suivi présences"); }
  }, []);

  /* ── Modals ── */
  const [modalCours,       setModalCours]       = useState(false);
  const [modalAttrib,      setModalAttrib]       = useState(false);
  const [modalValidation,  setModalValidation]   = useState(false);
  const [selectedApprenant, setSelectedApprenant] = useState(null);
  const [selectedCoach,     setSelectedCoach]     = useState(null);

  /* ── Formulaire nouveau cours ── */
  const [formCours, setFormCours] = useState({ apprenantNom:"", niveau:"B1", objectif:"Général", horaire:"", debut:"", fin:"", nbSeances:8, typeSeance:"en ligne", coachId:"" });
  const [filtreCoachNiveau, setFiltreCoachNiveau] = useState("Tous");
  const [searchApprenant,   setSearchApprenant]   = useState("");
  const [moisValidation,    setMoisValidation]     = useState("Mai 2026");

  /* ── KPIs ── */
  const stats = useMemo(() => {
    const actifs  = cours.filter(c => c.statut === "actif").length;
    const coachesActifs = [...new Set(cours.filter(c=>c.statut==="actif").map(c=>c.coachId))].length;
    const totalHonoraires = seances.reduce((s,s2) => s + s2.montant, 0);
    const seancesValidees = seances.filter(s => s.validee).length;
    const seancesTotal    = seances.length;
    const aValider        = seances.filter(s => !s.validee).length;
    return { actifs, coachesActifs, totalHonoraires, seancesValidees, seancesTotal, aValider };
  }, [cours, seances]);

  /* ── Récapitulatif honoraires par coach ── */
  const honorairesParCoach = useMemo(() => {
    const map = {};
    seances.forEach(s => {
      if (!map[s.coachId]) {
        const coach = coaches.find(c => c.id === s.coachId);
        map[s.coachId] = { coachId:s.coachId, coachNom:s.coachNom, tarif_h:coach?.tarif_h||0, contrat:coach?.contrat||"—", seances:[], totalH:0, totalMontant:0, toutValidee:false };
      }
      map[s.coachId].seances.push(s);
      map[s.coachId].totalH += s.dureeH;
      map[s.coachId].totalMontant += s.montant;
    });
    Object.values(map).forEach(c => { c.toutValidee = c.seances.every(s => s.validee); });
    return Object.values(map);
  }, [seances, coaches]);

  /* ── Coach recommandés pour attribution ── */
  const coachesCompatibles = useMemo(() => {
    if (!selectedApprenant) return coaches;
    return coaches
      .filter(c => c.niveaux.includes(selectedApprenant.niveau))
      .sort((a,b) => (b.dispo?1:0) - (a.dispo?1:0));
  }, [selectedApprenant, coaches]);

  /* ── Créer un cours ── */
  const handleCreerCours = () => {
    if (!formCours.apprenantNom || !formCours.coachId || !formCours.debut || !formCours.fin) {
      toast.error("Remplissez tous les champs obligatoires."); return;
    }
    const coach = coaches.find(c => c.id === +formCours.coachId);
    const newCours = {
      id: Date.now(), apprenantId:Date.now(), apprenantNom:formCours.apprenantNom,
      coachId:+formCours.coachId, coachNom:coach?.nom||"—",
      niveau:formCours.niveau, horaire:formCours.horaire,
      debut:formCours.debut, fin:formCours.fin,
      statut:"actif", nbSeances:+formCours.nbSeances, typeSeance:formCours.typeSeance,
    };
    setCours(p => [newCours, ...p]);
    toast.success(`Cours privé créé pour ${formCours.apprenantNom} avec ${coach?.nom}`);
    setModalCours(false);
    setFormCours({ apprenantNom:"", niveau:"B1", objectif:"Général", horaire:"", debut:"", fin:"", nbSeances:8, typeSeance:"en ligne", coachId:"" });
  };

  /* ── Valider toutes les séances d'un coach ── */
  const handleValiderCoach = (coachId) => {
    setSeances(p => p.map(s => s.coachId === coachId ? {...s, validee:true} : s));
    toast.success("Honoraires validés — transmission RH en cours…");
  };

  const handleValiderTout = () => {
    setSeances(p => p.map(s => ({...s, validee:true})));
    toast.success(`Récapitulatif ${moisValidation} validé et transmis aux RH`);
    setModalValidation(false);
  };

  /* ── Affecter coach depuis modal attribution ── */
  const handleAffecterCoach = () => {
    if (!selectedApprenant || !selectedCoach) { toast.error("Sélectionnez un apprenant et un coach."); return; }
    toast.success(`${selectedCoach.nom} affecté à ${selectedApprenant.nom}`);
    setModalAttrib(false);
    setSelectedApprenant(null); setSelectedCoach(null);
  };

  /* ══════════════════════════════════════════════════════
     RENDU
  ══════════════════════════════════════════════════════ */
  const TABS = [
    { id:"dashboard",   icon:"🏠", label:"Tableau de bord"   },
    { id:"prospects",   icon:"📋", label:"Prospects parcours" },
    { id:"apprenants",  icon:"🎓", label:"Mes apprenants"     },
    { id:"cours",       icon:"📚", label:"Cours privés"       },
    { id:"attribution", icon:"🎯", label:"Attribution coach"  },
    { id:"honoraires",  icon:"💰", label:"Honoraires"         },
    { id:"validation",  icon:"✅", label:"Validation"         },
    { id:"suivi",       icon:"📈", label:"Suivi pédago"       },
    { id:"messages",    icon:"💬", label:"Messages"            },
    { id:"notifications", icon:"🔔", label:"Notifications"     },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f5f3ff", fontFamily:FF }}>
      <Toaster position="top-right" />

      {/* ── HERO HEADER ── */}
      <div style={{ background:PA_GRADIENT, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
        <div style={{ position:"absolute", bottom:-60, right:80, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }} />

        {/* Infos utilisateur + actions */}
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
            <div>
              <div style={{ fontSize:11, color:"#c4b5fd", fontWeight:600, letterSpacing:"0.08em" }}>Bonjour 👋</div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{nomComplet}</h1>
              <div style={{ fontSize:12, color:"#ddd6fe", marginTop:3 }}>📚 Conseiller Pédagogique · {profil?.email || ""}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {stats.aValider > 0 && (
              <div style={{ background:"rgba(239,68,68,.28)", border:"1px solid rgba(239,68,68,.5)", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}
                onClick={()=>setActiveTab("validation")}>
                ⚠️ {stats.aValider} séance{stats.aValider>1?"s":""} à valider
              </div>
            )}
            <NotificationBell userId={profil?.id} />
            <button onClick={handleLogout}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", backdropFilter:"blur(4px)" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
              <span>🚪</span> Déconnexion
            </button>
          </div>
        </div>

        {/* Mini KPIs dans le hero */}
        <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden", position:"relative", zIndex:1 }}>
          {[
            { l:"Cours actifs",        v:stats.actifs,                                                                   c:"#c4b5fd" },
            { l:"Coaches affectés",    v:stats.coachesActifs,                                                            c:"#93c5fd" },
            { l:"Honoraires du mois",  v:formatMoney(stats.totalHonoraires),                                             c:"#6ee7b7" },
            { l:"Séances validées",    v:`${stats.seancesValidees}/${stats.seancesTotal}`,                               c:"#fcd34d" },
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

          {/* ── Onglets horizontaux ── */}
          <div style={{ display:"flex", gap:0, borderBottom:"1px solid #e5e7eb", overflowX:"auto", background:"#fafafa" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding:"12px 16px", border:"none",
                borderBottom: activeTab===t.id ? `3px solid ${PA_COLOR}` : "3px solid transparent",
                cursor:"pointer", fontWeight:600, fontSize:12, whiteSpace:"nowrap",
                background:"transparent", color:activeTab===t.id ? PA_COLOR : "#6b7280",
                display:"flex", alignItems:"center", gap:6, transition:"color .15s",
              }}>
                <span style={{ fontSize:14 }}>{t.icon}</span>
                {t.label}
                {t.id==="validation" && stats.aValider>0 && (
                  <span style={{ background:"#ef4444", color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"1px 6px" }}>{stats.aValider}</span>
                )}
                {t.id==="prospects" && prospects.filter(p=>p.statut==="nouveau").length > 0 && (
                  <span style={{ background:"#0891b2", color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"1px 6px" }}>{prospects.filter(p=>p.statut==="nouveau").length}</span>
                )}
                {t.id==="apprenants" && prospects.filter(p=>p.statut==="converti").length > 0 && (
                  <span style={{ background:"#22c55e", color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"1px 6px" }}>{prospects.filter(p=>p.statut==="converti").length}</span>
                )}
              </button>
            ))}
          </div>

          <div style={{ padding:24 }}>

          {/* ══════════════════════════════════
              ONGLET PROSPECTS PARCOURS
          ══════════════════════════════════ */}
          {activeTab === "prospects" && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

              {/* Header + filtres */}
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ flex:1, minWidth:220 }}>
                  <input
                    value={prospectSearch} onChange={e=>setProspectSearch(e.target.value)}
                    placeholder="🔍 Rechercher un prospect…"
                    style={{ width:"100%", padding:"9px 14px", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13, outline:"none", boxSizing:"border-box" }}
                  />
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["tous","nouveau","en_cours","converti","perdu"].map(s => (
                    <button key={s} onClick={()=>setProspectFiltreStatut(s)}
                      style={{ padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:700, border:"1.5px solid", cursor:"pointer",
                        background: prospectFiltreStatut===s ? PA_COLOR : "transparent",
                        color: prospectFiltreStatut===s ? "#fff" : "#6b7280",
                        borderColor: prospectFiltreStatut===s ? PA_COLOR : "#e2e8f0" }}>
                      {s==="tous"?"Tous":STATUT_PROSPECT[s]?.label||s}
                      {s==="nouveau" && prospects.filter(p=>p.statut==="nouveau").length>0 && (
                        <span style={{ marginLeft:5, background:"#ef4444", color:"#fff", borderRadius:99, fontSize:10, padding:"0px 5px" }}>
                          {prospects.filter(p=>p.statut==="nouveau").length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button onClick={fetchProspects} style={{ padding:"8px 14px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#f8fafc", fontSize:12, cursor:"pointer", color:"#6b7280", fontWeight:600 }}>
                  🔄 Actualiser
                </button>
              </div>

              {/* KPIs rapides */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                {[
                  { l:"Total reçus",  v:prospects.length,                                        c:PA_COLOR,   icon:"📋" },
                  { l:"Nouveaux",     v:prospects.filter(p=>p.statut==="nouveau").length,         c:"#0891b2",  icon:"🆕" },
                  { l:"En cours",     v:prospects.filter(p=>p.statut==="en_cours").length,        c:"#f59e0b",  icon:"⏳" },
                  { l:"Convertis",    v:prospects.filter(p=>p.statut==="converti").length,        c:"#22c55e",  icon:"✅" },
                ].map(s=>(
                  <div key={s.l} style={{ background:"#fff", borderRadius:12, padding:"14px 16px", border:"1.5px solid #e2e8f0", display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:22 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600 }}>{s.l}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chargement */}
              {prospectsLoading && (
                <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8", fontSize:13 }}>Chargement des prospects…</div>
              )}

              {/* Vide */}
              {!prospectsLoading && prospectsFiltered.length === 0 && (
                <div style={{ textAlign:"center", padding:"60px 0" }}>
                  <div style={{ fontSize:"3rem", marginBottom:10 }}>🏠</div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#0f172a", marginBottom:6 }}>
                    {prospectSearch || prospectFiltreStatut!=="tous" ? "Aucun résultat" : "Aucun prospect reçu"}
                  </div>
                  <div style={{ fontSize:13, color:"#94a3b8" }}>
                    Les demandes de cours à domicile apparaîtront ici automatiquement.
                  </div>
                </div>
              )}

              {/* Grille cards */}
              {!prospectsLoading && prospectsFiltered.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))", gap:14 }}>
                  {prospectsFiltered.map(p => {
                    const st = STATUT_PROSPECT[p.statut] || STATUT_PROSPECT.nouveau;
                    const initiales = (p.prospect_nom||"?").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
                    return (
                      <div key={p.id}
                        onClick={() => {
                          setProspectModal(p);
                          const sd = p.suivi_demarrage || {};
                          setProspectDossier({ niveau: sd.niveau_prospect || "", nb_seances: sd.nb_seances_souhaitees || "", formation: sd.formation_souhaitee || "", cout_formation: sd.cout_formation || "" });
                        }}
                        style={{ cursor:"pointer", background:"#fff", borderRadius:14, border:"1.5px solid #e2e8f0", overflow:"hidden", boxShadow:"0 1px 6px rgba(0,0,0,0.05)", transition:"all .2s" }}
                        onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 18px rgba(0,0,0,0.10)"}
                        onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,0.05)"}
                      >
                        {/* Barre statut */}
                        <div style={{ height:3, background: p.statut==="converti"?"#22c55e":p.statut==="en_cours"?"#f59e0b":p.statut==="perdu"?"#ef4444":PA_COLOR }} />
                        <div style={{ padding:"14px 16px" }}>
                          {/* Row avatar + nom + statut */}
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                            <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#0f172a,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, color:"#fff", flexShrink:0 }}>
                              {initiales}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:14, fontWeight:800, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.prospect_nom||"—"}</div>
                              {p.prospect_email && <div style={{ fontSize:11, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.prospect_email}</div>}
                              {p.prospect_telephone && <div style={{ fontSize:11, color:"#64748b" }}>📞 {p.prospect_telephone}</div>}
                            </div>
                            <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999, color:st.color, background:st.bg, whiteSpace:"nowrap" }}>
                              {st.icon} {st.label}
                            </span>
                          </div>
                          {/* Infos */}
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"#f0fdf4", color:"#15803d" }}>🏠 À domicile</span>
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"#f3e8ff", color:"#7c3aed" }}>👤 Cours privé</span>
                            {p.source && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background:"#f1f5f9", color:"#64748b" }}>{p.source}</span>}
                          </div>
                          <div style={{ fontSize:10, color:"#94a3b8", borderTop:"1px solid #f1f5f9", paddingTop:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span>📅 {formatDate(p.created_at)}</span>
                            <span style={{ color:PA_COLOR, fontWeight:700 }}>Voir le dossier →</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ══════════════════════════════════
              ONGLET MES APPRENANTS
          ══════════════════════════════════ */}
          {activeTab === "apprenants" && (() => {
            const NIVEAU_COLOR = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };
            const apprenants = prospects.filter(p => p.statut === "converti");

            const appFiltered = apprenants.filter(a => {
              const q = appSearchQ.toLowerCase();
              if (q && !`${a.prospect_nom} ${a.prospect_email} ${a.prospect_telephone}`.toLowerCase().includes(q)) return false;
              if (appNiveau !== "tous") {
                const sd = a.suivi_demarrage || {};
                if (sd.niveau_prospect !== appNiveau) return false;
              }
              return true;
            });

            const totalTranchesGlobal = apprenants.reduce((s,a) => {
              const t = (a.plan_paiement?.tranches || []);
              return s + t.reduce((ss,tr)=>ss+(tr.montant||0),0);
            },0);
            const totalPayeGlobal = apprenants.reduce((s,a) => {
              const t = (a.plan_paiement?.tranches || []).filter(tr=>tr.statut==="payé");
              return s + t.reduce((ss,tr)=>ss+(tr.montant||0),0);
            },0);
            const nbAvecPlan = apprenants.filter(a=>(a.plan_paiement?.tranches||[]).length>0).length;
            const nbAvecSuivi = apprenants.filter(a=>(a.suivi_presences?.seances_effectuees||0)>0).length;

            return (
              <div>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>🎓 Mes apprenants</h2>
                    <p style={{ margin:"4px 0 0", fontSize:12, color:"#9ca3af" }}>Prospects convertis en apprenants — cours à domicile privés</p>
                  </div>
                  <Btn small outline onClick={()=>setActiveTab("prospects")}>← Retour aux prospects</Btn>
                </div>

                {/* KPIs */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
                  <StatCard label="Total apprenants"   value={apprenants.length}     icon="🎓" color={PA_COLOR}   sub="convertis" />
                  <StatCard label="Avec plan paiement" value={nbAvecPlan}            icon="💳" color="#0891b2"   sub={`sur ${apprenants.length}`} />
                  <StatCard label="Encaissé"           value={formatMoney(totalPayeGlobal)}   icon="✅" color="#22c55e" />
                  <StatCard label="Reste à percevoir"  value={formatMoney(Math.max(0,totalTranchesGlobal-totalPayeGlobal))} icon="⏳" color={totalTranchesGlobal-totalPayeGlobal>0?"#ef4444":"#22c55e"} />
                </div>

                {/* Filtres */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:18, padding:"10px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}>
                  <input
                    value={appSearchQ} onChange={e=>setAppSearchQ(e.target.value)}
                    placeholder="🔍 Rechercher un apprenant…"
                    style={{ padding:"8px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", width:220 }}
                  />
                  <select value={appNiveau} onChange={e=>setAppNiveau(e.target.value)}
                    style={{ padding:"8px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", background:"#fff" }}>
                    <option value="tous">Tous niveaux</option>
                    {NIVEAUX.map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                  {(appSearchQ||appNiveau!=="tous") && (
                    <button onClick={()=>{setAppSearchQ("");setAppNiveau("tous");}} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #e2e8f0", background:"#f1f5f9", fontSize:12, cursor:"pointer", color:"#6b7280" }}>✕ Effacer</button>
                  )}
                  <span style={{ marginLeft:"auto", fontSize:11, color:"#6b7280" }}>{appFiltered.length} apprenant{appFiltered.length!==1?"s":""}</span>
                </div>

                {/* Vide */}
                {apprenants.length === 0 && (
                  <div style={{ textAlign:"center", padding:"60px 24px", background:"#f8fafc", borderRadius:16, border:"2px dashed #e2e8f0" }}>
                    <div style={{ fontSize:"3.5rem", marginBottom:12 }}>🎓</div>
                    <div style={{ fontSize:15, fontWeight:800, color:"#0f172a", marginBottom:6 }}>Aucun apprenant pour l'instant</div>
                    <div style={{ fontSize:13, color:"#9ca3af", maxWidth:360, margin:"0 auto 20px" }}>
                      Lorsqu'un prospect est marqué <strong>Converti</strong> dans l'onglet Prospects, il apparaîtra automatiquement ici.
                    </div>
                    <Btn onClick={()=>setActiveTab("prospects")}>Voir les prospects →</Btn>
                  </div>
                )}

                {apprenants.length > 0 && appFiltered.length === 0 && (
                  <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8", fontSize:13 }}>Aucun apprenant ne correspond aux filtres.</div>
                )}

                {/* Grille cards */}
                {appFiltered.length > 0 && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
                    {appFiltered.map(a => {
                      const initiales = (a.prospect_nom||"?").split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();
                      const sd = a.suivi_demarrage || {};
                      const niveauColor = NIVEAU_COLOR[sd.niveau_prospect] || "#6b7280";
                      const plan = a.plan_paiement || {};
                      const tranches = plan.tranches || [];
                      const today2 = new Date(); today2.setHours(0,0,0,0);
                      const tranchesPaye  = tranches.filter(t=>t.statut==="payé").reduce((s,t)=>s+(t.montant||0),0);
                      const tranchesTotal = tranches.reduce((s,t)=>s+(t.montant||0),0);
                      const pctTranches = tranchesTotal>0?Math.round((tranchesPaye/tranchesTotal)*100):0;
                      const hasAlertePmt = tranches.some(t=>{
                        if(t.statut!=="en_attente") return false;
                        const d=new Date(t.date_echeance); d.setHours(0,0,0,0);
                        return d<today2;
                      });
                      const hasAlerteCritique = tranches.some(t=>{
                        if(t.statut!=="en_attente") return false;
                        const d=new Date(t.date_echeance); d.setHours(0,0,0,0);
                        return Math.ceil((today2-d)/86400000)>7;
                      });
                      const sp = a.suivi_presences || {};
                      const sessions = sp.sessions || [];
                      const seancesCnt = sp.seances_effectuees || sessions.length || 0;
                      const presences = sp.presences || 0;
                      const tauxPart = seancesCnt>0?Math.round((presences/seancesCnt)*100):null;
                      const now2=new Date(); const monday=new Date(now2); monday.setDate(now2.getDate()-((now2.getDay()+6)%7)); monday.setHours(0,0,0,0);
                      const absWeek=sessions.filter(s=>new Date(s.date)>=monday&&s.statut==="absent").length;
                      const alertSem=absWeek>2;
                      const sorted2=[...sessions].sort((x,y)=>x.date.localeCompare(y.date));
                      let c2=0,mc2=0; for(const s of sorted2){if(s.statut==="absent"){c2++;if(c2>mc2)mc2=c2;}else c2=0;}
                      const alertCons=mc2>=3;
                      const hasAlerteAss=alertSem||alertCons;

                      return (
                        <div key={a.id}
                          onClick={()=>{ setApprenantModal(a); setApprenantTab("infos"); setAddingSession(false); setAddingVersement(false); setSessionForm({date:new Date().toISOString().slice(0,10),statut:"present"}); setVersementForm({montant:"",date:new Date().toISOString().slice(0,10),mode:"Mobile Money",ref:"",notes:""}); setProgNote((a.suivi_presences||{}).notes_progression||""); fetchPaiementsApprenant(a.id); }}
                          style={{ cursor:"pointer", background:"#fff", borderRadius:14, border:`1.5px solid ${hasAlerteCritique?"#fca5a5":hasAlertePmt?"#fed7aa":hasAlerteAss?"#fde68a":"#e2e8f0"}`, overflow:"hidden", boxShadow:"0 1px 6px rgba(0,0,0,0.05)", transition:"all .2s" }}
                          onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.10)"}
                          onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,0.05)"}
                        >
                          <div style={{ height:3, background:hasAlerteCritique?"#dc2626":hasAlertePmt?"#f97316":hasAlerteAss?"#eab308":"#22c55e" }} />
                          <div style={{ padding:"14px 16px" }}>
                            {/* Row 1: avatar + nom + alertes */}
                            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                              <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#0f172a,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, color:"#fff", flexShrink:0 }}>
                                {initiales}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:14, fontWeight:800, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.prospect_nom||"—"}</div>
                                {a.prospect_email && <div style={{ fontSize:11, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.prospect_email}</div>}
                                {a.prospect_telephone && <div style={{ fontSize:11, color:"#64748b" }}>📞 {a.prospect_telephone}</div>}
                              </div>
                              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                                {hasAlertePmt && <span title="Retard paiement" style={{ fontSize:15 }}>💳</span>}
                                {hasAlerteAss && <span title="Alerte assiduité" style={{ fontSize:15 }}>⚠️</span>}
                              </div>
                            </div>

                            {/* Row 2: badges */}
                            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
                              <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"#f0fdf4", color:"#15803d" }}>🏠 À domicile</span>
                              <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"#f3e8ff", color:"#7c3aed" }}>👤 Privé</span>
                              {sd.niveau_prospect && <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:999, color:"#fff", background:niveauColor }}>{sd.niveau_prospect}</span>}
                              {sd.formation_souhaitee && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background:"#f1f5f9", color:"#64748b" }}>{sd.formation_souhaitee}</span>}
                            </div>

                            {/* Row 3: barre paiement */}
                            {tranches.length > 0 ? (
                              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                                <div style={{ flex:1, height:5, borderRadius:999, background:"#e5e7eb", overflow:"hidden" }}>
                                  <div style={{ height:"100%", borderRadius:999, background:pctTranches>=100?"#22c55e":pctTranches>0?"#7c3aed":"#e5e7eb", width:`${Math.min(100,pctTranches)}%`, transition:"width .4s" }} />
                                </div>
                                <span style={{ fontSize:10, fontWeight:700, color:(tranchesTotal-tranchesPaye)>0?"#ef4444":"#22c55e", whiteSpace:"nowrap" }}>
                                  {(tranchesTotal-tranchesPaye)>0?`${Number(tranchesTotal-tranchesPaye).toLocaleString("fr-FR")} F restants`:"✓ Soldé"}
                                </span>
                              </div>
                            ) : (
                              <div style={{ fontSize:10, color:"#94a3b8", marginBottom:6 }}>💳 Aucun plan de paiement</div>
                            )}

                            {/* Row 4: séances */}
                            {seancesCnt > 0 && (
                              <div style={{ fontSize:10, color:"#64748b", display:"flex", gap:12, marginBottom:6 }}>
                                <span>📅 {seancesCnt} séance{seancesCnt>1?"s":""}</span>
                                <span style={{ color:tauxPart>=80?"#15803d":tauxPart>=60?"#d97706":"#ef4444", fontWeight:700 }}>✅ {tauxPart}%</span>
                                {sd.nb_seances_souhaitees && <span>/ {sd.nb_seances_souhaitees} prévues</span>}
                              </div>
                            )}

                            <div style={{ marginTop:8, textAlign:"right", fontSize:10, color:PA_COLOR, fontWeight:700 }}>Voir le dossier →</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Chat panel */}
                {chatApprenant && activeTab === "apprenants" && (
                  <div style={{ marginTop:24 }}>
                    <ProspectChatPanel assignation={chatApprenant} profil={profil} onClose={()=>setChatApprenant(null)} />
                  </div>
                )}

              </div>
            );
          })()}

          {/* ══════════════════════════════════
              ONGLET DASHBOARD
          ══════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* KPIs */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                <StatCard label="Cours privés actifs" value={stats.actifs}           icon="📚" color={PA_COLOR} sub="en cours" onClick={()=>setActiveTab("cours")} />
                <StatCard label="Coaches affectés"    value={stats.coachesActifs}     icon="👨‍🏫" color="#0891b2" sub="ce mois"  onClick={()=>setActiveTab("attribution")} />
                <StatCard label="Honoraires du mois"  value={formatMoney(stats.totalHonoraires)} icon="💰" color="#16a34a" sub="à transmettre RH" onClick={()=>setActiveTab("honoraires")} />
                <StatCard label="Séances validées"    value={`${stats.seancesValidees}/${stats.seancesTotal}`} icon="✅" color="#f59e0b" sub="ce mois" onClick={()=>setActiveTab("validation")} />
              </div>

              {/* Alertes */}
              {stats.aValider > 0 && (
                <div style={{ background:"#fff7ed", border:"1.5px solid #fed7aa", borderRadius:12, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:20 }}>⏰</span>
                    <div>
                      <div style={{ fontWeight:700, color:"#c2410c", fontSize:13 }}>{stats.aValider} séance{stats.aValider>1?"s":""} en attente de validation</div>
                      <div style={{ fontSize:12, color:"#9a3412", marginTop:1 }}>Validez les récapitulatifs mensuels avant transmission aux RH</div>
                    </div>
                  </div>
                  <Btn onClick={()=>setActiveTab("validation")}>Valider maintenant →</Btn>
                </div>
              )}

              {/* Cours actifs + suivi rapide */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <Section title="🏃 Cours en cours" action={<Btn small onClick={()=>setActiveTab("cours")}>Voir tout</Btn>}>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {cours.filter(c=>c.statut==="actif").slice(0,4).map(c => (
                      <div key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", background:"#f8fafc", borderRadius:8 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{c.apprenantNom}</div>
                          <div style={{ fontSize:11, color:"#64748b" }}>{c.coachNom} · {c.niveau} · {c.typeSeance}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <Badge label={c.niveau} color={PA_COLOR} bg={PA_LIGHT} />
                          <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>{c.horaire}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="👨‍🏫 Coaches & disponibilité" action={<Btn small onClick={()=>setActiveTab("attribution")}>Attribution</Btn>}>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {coaches.map(c => (
                      <div key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", background:"#f8fafc", borderRadius:8 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{c.nom}</div>
                          <div style={{ fontSize:11, color:"#64748b" }}>{c.specialite}</div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                          <Badge label={c.dispo?"Disponible":"Occupé"} color={c.dispo?"#16a34a":"#dc2626"} bg={c.dispo?"#dcfce7":"#fee2e2"} />
                          <div style={{ fontSize:10, color:"#94a3b8" }}>{formatMoney(c.tarif_h)}/h</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              ONGLET COURS PRIVÉS
          ══════════════════════════════════ */}
          {activeTab === "cours" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", gap:8 }}>
                  <input placeholder="Rechercher apprenant ou coach…" value={searchApprenant} onChange={e=>setSearchApprenant(e.target.value)}
                    style={{ padding:"8px 14px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, width:260 }} />
                  <select onChange={e=>setFiltreCoachNiveau(e.target.value)} style={{ padding:"8px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13 }}>
                    <option value="Tous">Tous niveaux</option>
                    {NIVEAUX.map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
                <Btn onClick={()=>setModalCours(true)}>＋ Nouveau cours privé</Btn>
              </div>

              <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.06)", border:"1px solid #f1f5f9" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#f8fafc" }}>
                      {["Apprenant","Niveau","Coach","Type","Séances","Période","Horaire","Statut",""].map(h=>(
                        <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".04em", borderBottom:"1px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cours.filter(c => {
                      const q = searchApprenant.toLowerCase();
                      const matchSearch = !q || c.apprenantNom.toLowerCase().includes(q) || c.coachNom.toLowerCase().includes(q);
                      const matchNiveau = filtreCoachNiveau==="Tous" || c.niveau===filtreCoachNiveau;
                      return matchSearch && matchNiveau;
                    }).map((c,i) => {
                      const s = STATUT_COURS[c.statut] || STATUT_COURS.actif;
                      return (
                        <tr key={c.id} style={{ borderBottom:"1px solid #f1f5f9", background:i%2===0?"#fff":"#fafafa" }}>
                          <td style={{ padding:"12px 14px", fontWeight:700, fontSize:13 }}>{c.apprenantNom}</td>
                          <td style={{ padding:"12px 14px" }}><Badge label={c.niveau} color={PA_COLOR} bg={PA_LIGHT} /></td>
                          <td style={{ padding:"12px 14px", fontSize:13, color:"#374151" }}>{c.coachNom}</td>
                          <td style={{ padding:"12px 14px", fontSize:12, color:"#64748b" }}>{c.typeSeance}</td>
                          <td style={{ padding:"12px 14px", fontSize:13, fontWeight:600 }}>{c.nbSeances}</td>
                          <td style={{ padding:"12px 14px", fontSize:12, color:"#64748b" }}>{formatDate(c.debut)} → {formatDate(c.fin)}</td>
                          <td style={{ padding:"12px 14px", fontSize:12, color:"#64748b" }}>{c.horaire}</td>
                          <td style={{ padding:"12px 14px" }}><Badge label={s.label} color={s.color} bg={s.bg} /></td>
                          <td style={{ padding:"12px 14px" }}>
                            {c.statut === "actif" && (
                              <Btn small outline onClick={()=>{ setCours(p=>p.map(x=>x.id===c.id?{...x,statut:"suspendu"}:x)); toast.success("Cours suspendu"); }}>
                                Suspendre
                              </Btn>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {cours.length === 0 && (
                  <div style={{ textAlign:"center", padding:"40px 20px", color:"#94a3b8" }}>Aucun cours privé enregistré</div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              ONGLET ATTRIBUTION COACH
          ══════════════════════════════════ */}
          {activeTab === "attribution" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

                {/* Colonne apprenants */}
                <Section title="👤 Sélectionner un apprenant" action={
                  <Btn small onClick={()=>setModalAttrib(true)} disabled={!selectedApprenant||!selectedCoach}>
                    Affecter →
                  </Btn>
                }>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {apprenants.filter(a=>a.statut==="actif").map(a=>(
                      <div key={a.id} onClick={()=>setSelectedApprenant(a)} style={{
                        padding:"12px 14px", borderRadius:10, border:`1.5px solid ${selectedApprenant?.id===a.id?PA_COLOR:"#e2e8f0"}`,
                        background: selectedApprenant?.id===a.id ? PA_LIGHT : "#f8fafc",
                        cursor:"pointer", transition:"all .15s",
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{a.nom}</div>
                            <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Niveau {a.niveau} · {a.objectif}</div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <Badge label={`Niveau ${a.niveau}`} color={PA_COLOR} bg={PA_LIGHT} />
                            <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>{a.seancesRealisees}/{a.seancesPlanifiees} séances</div>
                          </div>
                        </div>
                        <div style={{ marginTop:8 }}>
                          <ProgressBar value={(a.seancesRealisees/a.seancesPlanifiees)*100} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* Colonne coaches recommandés */}
                <Section title={selectedApprenant ? `🎯 Coaches compatibles — Niveau ${selectedApprenant.niveau}` : "👨‍🏫 Coaches (sélectionnez un apprenant)"}>
                  {selectedApprenant && coachesCompatibles.length === 0 && (
                    <div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:13 }}>
                      Aucun coach disponible pour le niveau {selectedApprenant.niveau}
                    </div>
                  )}
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {(selectedApprenant ? coachesCompatibles : coaches).map(c=>(
                      <div key={c.id} onClick={()=>c.dispo&&setSelectedCoach(c)} style={{
                        padding:"12px 14px", borderRadius:10,
                        border:`1.5px solid ${selectedCoach?.id===c.id?PA_COLOR:c.dispo?"#e2e8f0":"#f1f5f9"}`,
                        background: selectedCoach?.id===c.id ? PA_LIGHT : c.dispo ? "#f8fafc" : "#f9f9f9",
                        cursor: c.dispo?"pointer":"not-allowed", opacity:c.dispo?1:.6, transition:"all .15s",
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{c.nom}</div>
                            <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{c.specialite} · {c.contrat}</div>
                            <div style={{ display:"flex", gap:4, marginTop:6, flexWrap:"wrap" }}>
                              {c.niveaux.map(n=>(
                                <Badge key={n} label={n} color="#0891b2" bg="#e0f2fe" />
                              ))}
                            </div>
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <Badge label={c.dispo?"Disponible":"Occupé"} color={c.dispo?"#16a34a":"#dc2626"} bg={c.dispo?"#dcfce7":"#fee2e2"} />
                            <div style={{ fontSize:11, fontWeight:700, color:PA_COLOR, marginTop:4 }}>{formatMoney(c.tarif_h)}/h</div>
                            <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>{c.nbSeancesTotal} séances total</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedApprenant && selectedCoach && (
                    <div style={{ marginTop:12, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:13 }}>
                        <strong>{selectedCoach.nom}</strong> → <strong>{selectedApprenant.nom}</strong>
                        <span style={{ fontSize:11, color:"#64748b", marginLeft:6 }}>{formatMoney(selectedCoach.tarif_h)}/h</span>
                      </div>
                      <Btn onClick={handleAffecterCoach}>Confirmer l'affectation ✓</Btn>
                    </div>
                  )}
                </Section>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              ONGLET HONORAIRES
          ══════════════════════════════════ */}
          {activeTab === "honoraires" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:13, color:"#64748b" }}>
                  Récapitulatif des séances réalisées · <strong>Mai 2026</strong>
                </div>
                <Btn onClick={()=>setActiveTab("validation")}>Aller à la validation →</Btn>
              </div>

              {/* Tableau honoraires par coach */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {honorairesParCoach.map(h => (
                  <div key={h.coachId} style={{ background:"#fff", borderRadius:14, overflow:"hidden", border:"1px solid #f1f5f9", boxShadow:"0 2px 8px rgba(0,0,0,.04)" }}>
                    {/* Header coach */}
                    <div style={{ padding:"14px 18px", background:"#f8fafc", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:14 }}>{h.coachNom}</div>
                        <div style={{ fontSize:11, color:"#64748b", marginTop:1 }}>
                          {h.contrat} · Tarif : {formatMoney(h.tarif_h)}/h
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:11, color:"#94a3b8" }}>Total heures</div>
                          <div style={{ fontWeight:800, fontSize:16, color:"#0f172a" }}>{h.totalH}h</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:11, color:"#94a3b8" }}>Montant dû</div>
                          <div style={{ fontWeight:800, fontSize:16, color:"#16a34a" }}>{formatMoney(h.totalMontant)}</div>
                        </div>
                        <Badge label={h.toutValidee?"Validé":"À valider"} color={h.toutValidee?"#16a34a":"#f59e0b"} bg={h.toutValidee?"#dcfce7":"#fef3c7"} />
                      </div>
                    </div>

                    {/* Séances détail */}
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ background:"#fafafa" }}>
                          {["Date","Apprenant","Durée","Montant","Statut"].map(hd=>(
                            <th key={hd} style={{ padding:"8px 18px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", borderBottom:"1px solid #f1f5f9" }}>{hd}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {h.seances.map(s=>(
                          <tr key={s.id} style={{ borderBottom:"1px solid #f9fafb" }}>
                            <td style={{ padding:"9px 18px", fontSize:12 }}>{formatDate(s.date)}</td>
                            <td style={{ padding:"9px 18px", fontSize:12, fontWeight:600 }}>{s.apprenantNom}</td>
                            <td style={{ padding:"9px 18px", fontSize:12 }}>{s.dureeH}h</td>
                            <td style={{ padding:"9px 18px", fontSize:12, fontWeight:700, color:"#16a34a" }}>{formatMoney(s.montant)}</td>
                            <td style={{ padding:"9px 18px" }}>
                              <Badge label={s.validee?"Validée":"En attente"} color={s.validee?"#16a34a":"#f59e0b"} bg={s.validee?"#dcfce7":"#fef3c7"} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!h.toutValidee && (
                      <div style={{ padding:"10px 18px", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"flex-end" }}>
                        <Btn small onClick={()=>handleValiderCoach(h.coachId)}>✓ Valider les honoraires de {h.coachNom}</Btn>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Récap global */}
              <div style={{ background:"linear-gradient(135deg,#0f172a,#7c3aed)", borderRadius:14, padding:"18px 22px", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:".04em" }}>Total honoraires Mai 2026</div>
                  <div style={{ fontSize:28, fontWeight:900, marginTop:4 }}>{formatMoney(stats.totalHonoraires)}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.6)" }}>{stats.seancesTotal} séances · {stats.seancesValidees} validées</div>
                  <Btn onClick={()=>setActiveTab("validation")} color="#fff">
                    <span style={{ color:PA_COLOR }}>Valider & transmettre RH →</span>
                  </Btn>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              ONGLET VALIDATION
          ══════════════════════════════════ */}
          {activeTab === "validation" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ background:"#fff", borderRadius:14, padding:22, boxShadow:"0 2px 8px rgba(0,0,0,.06)", border:"1px solid #f1f5f9" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:"#0f172a" }}>📋 Récapitulatif mensuel</div>
                    <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>À valider avant transmission aux Ressources Humaines</div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <select value={moisValidation} onChange={e=>setMoisValidation(e.target.value)} style={{ padding:"8px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13 }}>
                      <option>Mai 2026</option>
                      <option>Avril 2026</option>
                      <option>Mars 2026</option>
                    </select>
                    <Btn onClick={()=>setModalValidation(true)}>✓ Valider tout le mois</Btn>
                  </div>
                </div>

                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#f8fafc" }}>
                      {["Coach","Contrat","Nb séances","Total heures","Tarif/h","Montant dû","Statut","Action"].map(h=>(
                        <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", borderBottom:"1px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {honorairesParCoach.map((h,i)=>(
                      <tr key={h.coachId} style={{ borderBottom:"1px solid #f1f5f9", background:i%2===0?"#fff":"#fafafa" }}>
                        <td style={{ padding:"13px 14px", fontWeight:700, fontSize:13 }}>{h.coachNom}</td>
                        <td style={{ padding:"13px 14px" }}><Badge label={h.contrat} color="#374151" bg="#f3f4f6" /></td>
                        <td style={{ padding:"13px 14px", fontSize:13 }}>{h.seances.length}</td>
                        <td style={{ padding:"13px 14px", fontSize:13 }}>{h.totalH}h</td>
                        <td style={{ padding:"13px 14px", fontSize:13 }}>{formatMoney(h.tarif_h)}</td>
                        <td style={{ padding:"13px 14px", fontWeight:800, color:"#16a34a" }}>{formatMoney(h.totalMontant)}</td>
                        <td style={{ padding:"13px 14px" }}>
                          <Badge label={h.toutValidee?"✓ Validé":"En attente"} color={h.toutValidee?"#16a34a":"#f59e0b"} bg={h.toutValidee?"#dcfce7":"#fef3c7"} />
                        </td>
                        <td style={{ padding:"13px 14px" }}>
                          {!h.toutValidee && <Btn small onClick={()=>handleValiderCoach(h.coachId)}>Valider</Btn>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:"#f0fdf4", borderTop:"2px solid #bbf7d0" }}>
                      <td colSpan={5} style={{ padding:"13px 14px", fontWeight:800, fontSize:13 }}>TOTAL</td>
                      <td style={{ padding:"13px 14px", fontWeight:900, fontSize:15, color:"#16a34a" }}>
                        {formatMoney(honorairesParCoach.reduce((s,h)=>s+h.totalMontant,0))}
                      </td>
                      <td colSpan={2} style={{ padding:"13px 14px", fontSize:12, color:"#64748b" }}>
                        {honorairesParCoach.filter(h=>h.toutValidee).length}/{honorairesParCoach.length} coaches validés
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              ONGLET SUIVI PÉDAGOGIQUE
          ══════════════════════════════════ */}
          {activeTab === "suivi" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                <StatCard label="En progression"  value={apprenants.filter(a=>a.progression<80&&a.statut==="actif").length}  icon="📈" color={PA_COLOR} />
                <StatCard label="Objectif atteint" value={apprenants.filter(a=>a.progression>=80).length}                     icon="🏆" color="#16a34a" />
                <StatCard label="Moy. progression" value={`${Math.round(apprenants.reduce((s,a)=>s+a.progression,0)/apprenants.length)}%`} icon="📊" color="#0891b2" />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {apprenants.map(a => {
                  const coach = coaches.find(c=>c.id===a.coachId);
                  const pctSeances = Math.round((a.seancesRealisees/a.seancesPlanifiees)*100);
                  const niveauColor = { A1:"#94a3b8",A2:"#64748b",B1:"#3b82f6",B2:"#1e3a8a",C1:"#7c3aed",C2:"#059669" }[a.niveau]||PA_COLOR;
                  return (
                    <div key={a.id} style={{ background:"#fff", borderRadius:14, padding:20, border:"1px solid #f1f5f9", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                        <div>
                          <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>{a.nom}</div>
                          <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>Objectif : {a.objectif}</div>
                          <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>Coach : {coach?.nom||"—"}</div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                          <Badge label={`Niveau ${a.niveau}`} color={niveauColor} bg={niveauColor+"18"} />
                          <Badge label={a.statut==="actif"?"Actif":"Terminé"} color={a.statut==="actif"?"#16a34a":"#6b7280"} bg={a.statut==="actif"?"#dcfce7":"#f3f4f6"} />
                        </div>
                      </div>

                      <div style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <span style={{ fontSize:12, color:"#64748b" }}>Progression globale</span>
                          <span style={{ fontSize:13, fontWeight:800, color: a.progression>=80?PA_COLOR:"#0f172a" }}>{a.progression}%</span>
                        </div>
                        <ProgressBar value={a.progression} color={a.progression>=80?PA_COLOR:"#3b82f6"} />
                      </div>

                      <div style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <span style={{ fontSize:12, color:"#64748b" }}>Séances réalisées</span>
                          <span style={{ fontSize:12, fontWeight:700 }}>{a.seancesRealisees}/{a.seancesPlanifiees}</span>
                        </div>
                        <ProgressBar value={pctSeances} color="#0891b2" />
                      </div>

                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:12 }}>
                        {[
                          { label:"Compréhension", val: Math.min(100, a.progression + 5) },
                          { label:"Expression",    val: Math.max(0, a.progression - 8) },
                          { label:"Vocabulaire",   val: Math.min(100, a.progression + 12) },
                        ].map(sk=>(
                          <div key={sk.label} style={{ background:"#f8fafc", borderRadius:8, padding:"8px 10px" }}>
                            <div style={{ fontSize:10, color:"#94a3b8", marginBottom:4 }}>{sk.label}</div>
                            <div style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{sk.val}%</div>
                            <ProgressBar value={sk.val} color={PA_COLOR} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>{/* fin padding 24 */}
        </div>{/* fin white card */}
      </div>{/* fin outer padding */}

      {/* ══ MODAL APPRENANT ══ */}
      {apprenantModal && (() => {
        const a = apprenantModal;
        const initiales = (a.prospect_nom||"?").split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();
        const sd = a.suivi_demarrage || {};
        const NIVEAU_COLOR = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };
        const niveauColor = NIVEAU_COLOR[sd.niveau_prospect] || "#6b7280";
        const plan = a.plan_paiement || {};
        const tranches = plan.tranches || [];
        const today = new Date(); today.setHours(0,0,0,0);
        const tranchesPaye  = tranches.filter(t=>t.statut==="payé").reduce((s,t)=>s+(t.montant||0),0);
        const tranchesTotal = tranches.reduce((s,t)=>s+(t.montant||0),0);
        const isSolde = tranchesTotal>0 && tranchesPaye>=tranchesTotal;
        const sp = a.suivi_presences || {};
        const sessions = sp.sessions || [];
        const seancesCnt = sp.seances_effectuees || sessions.length || 0;
        const presences = sp.presences || 0;
        const abs = sp.absences || 0;
        const tauxPart = seancesCnt>0 ? Math.round((presences/seancesCnt)*100) : null;
        const tauxAbs  = seancesCnt>0 ? Math.round((abs/seancesCnt)*100) : null;

        const MODAL_TABS = [
          { id:"infos",       label:"📋 Informations" },
          { id:"suivi",       label:"📊 Suivi assiduité" },
          { id:"paiement",    label:"💳 Paiement" },
          { id:"progression", label:"📈 Progression" },
          { id:"chat",        label:"💬 Chat" },
        ];

        const handleAddSession = async () => {
          const newSessions = [...sessions, { date:sessionForm.date, statut:sessionForm.statut }];
          const newPresences = newSessions.filter(s=>s.statut==="present").length;
          const newAbs       = newSessions.filter(s=>s.statut==="absent").length;
          const newSp = { ...sp, sessions:newSessions, seances_effectuees:newSessions.length, presences:newPresences, absences:newAbs };
          await handleSavePresencesPA(a.id, newSp);
          setAddingSession(false);
        };

        const handleDeleteSession = async (idx) => {
          const newSessions = sessions.filter((_,i)=>i!==idx);
          const newPresences = newSessions.filter(s=>s.statut==="present").length;
          const newAbs       = newSessions.filter(s=>s.statut==="absent").length;
          const newSp = { ...sp, sessions:newSessions, seances_effectuees:newSessions.length, presences:newPresences, absences:newAbs };
          await handleSavePresencesPA(a.id, newSp);
        };

        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:16 }}
            onClick={()=>setApprenantModal(null)}>
            <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:740, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.25)", display:"flex", flexDirection:"column" }}
              onClick={e=>e.stopPropagation()}>

              {/* Header gradient */}
              <div style={{ background:PA_GRADIENT, padding:"20px 26px", borderRadius:"18px 18px 0 0", display:"flex", alignItems:"center", gap:14, position:"sticky", top:0, zIndex:10, flexShrink:0 }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:"#fff", flexShrink:0 }}>{initiales}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:800, color:"#fff" }}>{a.prospect_nom||"—"}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", display:"flex", gap:12, flexWrap:"wrap", marginTop:2 }}>
                    {a.prospect_email && <span>{a.prospect_email}</span>}
                    {a.prospect_telephone && <span>📞 {a.prospect_telephone}</span>}
                    {sd.niveau_prospect && <span style={{ background:niveauColor, color:"#fff", borderRadius:99, padding:"1px 8px", fontWeight:800, fontSize:11 }}>{sd.niveau_prospect}</span>}
                  </div>
                </div>
                <span style={{ fontSize:11, fontWeight:800, padding:"4px 12px", borderRadius:999, background:"#dcfce7", color:"#15803d" }}>✅ Apprenant</span>
                <button onClick={()=>setApprenantModal(null)} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:30, height:30, borderRadius:"50%", cursor:"pointer", fontSize:16, flexShrink:0 }}>✕</button>
              </div>

              {/* Onglets */}
              <div style={{ display:"flex", borderBottom:"2px solid #e2e8f0", background:"#f8fafc", padding:"0 24px", flexShrink:0, overflowX:"auto" }}>
                {MODAL_TABS.map(t=>(
                  <button key={t.id} onClick={()=>setApprenantTab(t.id)}
                    style={{ padding:"12px 16px", border:"none", background:"none", cursor:"pointer", fontSize:13, fontWeight:apprenantTab===t.id?800:500, color:apprenantTab===t.id?PA_COLOR:"#64748b", borderBottom:apprenantTab===t.id?`2.5px solid ${PA_COLOR}`:"2.5px solid transparent", marginBottom:-2, whiteSpace:"nowrap" }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Contenu */}
              <div style={{ padding:"24px", flex:1 }}>

                {/* ─── INFOS ─── */}
                {apprenantTab === "infos" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {/* Bloc formation mis en avant */}
                    {sd.formation_souhaitee ? (
                      <div style={{ background:"linear-gradient(135deg,#f5f3ff,#ede9fe)", borderRadius:12, padding:"16px 18px", border:"1.5px solid #c4b5fd" }}>
                        <div style={{ fontSize:10, fontWeight:700, color:PA_COLOR, textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>📚 Formation suivie</div>
                        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                          <div style={{ fontSize:16, fontWeight:900, color:"#0f172a" }}>{sd.formation_souhaitee}</div>
                          {sd.niveau_prospect && (
                            <span style={{ fontSize:12, fontWeight:800, padding:"3px 12px", borderRadius:999, background:niveauColor, color:"#fff" }}>Niveau {sd.niveau_prospect}</span>
                          )}
                          {sd.nb_seances_souhaitees && (
                            <span style={{ fontSize:12, fontWeight:700, color:"#6d28d9", background:"#ede9fe", padding:"3px 10px", borderRadius:999 }}>🎯 {sd.nb_seances_souhaitees} séances</span>
                          )}
                        </div>
                        {sd.cout_formation && (
                          <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ fontSize:11, color:"#7c3aed", fontWeight:700 }}>Coût total de la formation</div>
                            <div style={{ fontSize:20, fontWeight:900, color:"#0f172a" }}>{Number(sd.cout_formation).toLocaleString("fr-FR")} <span style={{ fontSize:13, fontWeight:600, color:"#6b7280" }}>FCFA</span></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background:"#fffbeb", borderRadius:10, padding:"12px 16px", border:"1.5px solid #fde68a", fontSize:12, color:"#92400e", fontWeight:700 }}>
                        ⚠️ Formation non encore renseignée — mettez à jour le dossier.
                      </div>
                    )}

                    {/* Infos secondaires */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      {[
                        ["Type de cours",      "🏠 À domicile / Privé"],
                        ["Source",              a.source || "formulaire_domicile"],
                        ["Conseiller PA",       a.assistante_nom || [profil?.prenom, profil?.nom].filter(Boolean).join(" ") || "—"],
                        ["Date de conversion",  formatDate(a.updated_at || a.created_at)],
                        ["Coach affecté",       a.notes_coach || a.coach_nom || "Non affecté"],
                      ].map(([l,v])=>(
                        <div key={l} style={{ background:"#f8fafc", borderRadius:8, padding:"10px 14px", border:"1px solid #e2e8f0" }}>
                          <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".05em", marginBottom:3 }}>{l}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <Btn small onClick={()=>setApprenantTab("chat")}>💬 Chat</Btn>
                      <Btn small outline onClick={()=>{ setProspectModal(a); const sd2=a.suivi_demarrage||{}; setProspectDossier({niveau:sd2.niveau_prospect||"",nb_seances:sd2.nb_seances_souhaitees||"",formation:sd2.formation_souhaitee||"",cout_formation:sd2.cout_formation||""}); setApprenantModal(null); }}>✏️ Modifier le dossier</Btn>
                    </div>
                  </div>
                )}

                {/* ─── SUIVI ASSIDUITÉ ─── */}
                {apprenantTab === "suivi" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {/* KPIs assiduité */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                      <div style={{ background:"#f0fdf4", borderRadius:10, padding:"12px", textAlign:"center", border:"1px solid #bbf7d0" }}>
                        <div style={{ fontSize:10, color:"#15803d", fontWeight:700, marginBottom:4 }}>Séances</div>
                        <div style={{ fontSize:28, fontWeight:900, color:"#0f172a" }}>{seancesCnt}</div>
                        {sd.nb_seances_souhaitees && <div style={{ fontSize:10, color:"#64748b" }}>/ {sd.nb_seances_souhaitees} prévues</div>}
                      </div>
                      <div style={{ background:"#e0f2fe", borderRadius:10, padding:"12px", textAlign:"center", border:"1px solid #bae6fd" }}>
                        <div style={{ fontSize:10, color:"#0369a1", fontWeight:700, marginBottom:4 }}>Participation</div>
                        <div style={{ fontSize:28, fontWeight:900, color:tauxPart===null?"#94a3b8":tauxPart>=80?"#15803d":tauxPart>=60?"#d97706":"#ef4444" }}>{tauxPart!==null?`${tauxPart}%`:"—"}</div>
                      </div>
                      <div style={{ background:"#fef2f2", borderRadius:10, padding:"12px", textAlign:"center", border:"1px solid #fca5a5" }}>
                        <div style={{ fontSize:10, color:"#b91c1c", fontWeight:700, marginBottom:4 }}>Absentéisme</div>
                        <div style={{ fontSize:28, fontWeight:900, color:tauxAbs===null?"#94a3b8":tauxAbs<=10?"#15803d":tauxAbs<=25?"#d97706":"#ef4444" }}>{tauxAbs!==null?`${tauxAbs}%`:"—"}</div>
                      </div>
                    </div>

                    {seancesCnt > 0 && (
                      <div style={{ height:8, background:"#e5e7eb", borderRadius:999, overflow:"hidden" }}>
                        <div style={{ height:"100%", borderRadius:999, width:`${tauxPart||0}%`, background:tauxPart>=80?"#22c55e":tauxPart>=60?"#f59e0b":"#ef4444", transition:"width .4s" }} />
                      </div>
                    )}

                    {/* Alertes */}
                    {(() => {
                      const monday2=new Date(); monday2.setDate(monday2.getDate()-((monday2.getDay()+6)%7)); monday2.setHours(0,0,0,0);
                      const aw=sessions.filter(s=>new Date(s.date)>=monday2&&s.statut==="absent").length;
                      const srt=[...sessions].sort((x,y)=>x.date.localeCompare(y.date));
                      let cc=0,mc=0; for(const s of srt){if(s.statut==="absent"){cc++;if(cc>mc)mc=cc;}else cc=0;}
                      return (
                        <>
                          {aw>2 && <div style={{ padding:"8px 12px", background:"#fff7ed", borderRadius:8, border:"1px solid #fed7aa", fontSize:12, color:"#c2410c", fontWeight:700 }}>🔔 {aw} absences cette semaine</div>}
                          {mc>=3 && <div style={{ padding:"8px 12px", background:"#fef2f2", borderRadius:8, border:"1px solid #fca5a5", fontSize:12, color:"#b91c1c", fontWeight:700 }}>🚨 {mc} absences consécutives — intervention urgente</div>}
                        </>
                      );
                    })()}

                    {/* Liste séances */}
                    <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
                      <div style={{ padding:"8px 14px", background:"#f8fafc", fontSize:11, fontWeight:700, color:"#374151", borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span>Liste des séances ({sessions.length})</span>
                        <button onClick={()=>setAddingSession(true)} style={{ padding:"4px 10px", background:PA_COLOR, color:"#fff", border:"none", borderRadius:6, fontSize:11, cursor:"pointer", fontWeight:700 }}>+ Ajouter</button>
                      </div>

                      {addingSession && (
                        <div style={{ padding:"10px 14px", background:"#f5f3ff", borderBottom:"1px solid #e2e8f0", display:"flex", gap:8, alignItems:"center" }}>
                          <input type="date" value={sessionForm.date} onChange={e=>setSessionForm(p=>({...p,date:e.target.value}))} style={{ padding:"6px 8px", border:"1.5px solid #c4b5fd", borderRadius:6, fontSize:12 }} />
                          <select value={sessionForm.statut} onChange={e=>setSessionForm(p=>({...p,statut:e.target.value}))} style={{ padding:"6px 8px", border:"1.5px solid #c4b5fd", borderRadius:6, fontSize:12, background:"#fff" }}>
                            <option value="present">✅ Présent</option>
                            <option value="absent">❌ Absent</option>
                          </select>
                          <button onClick={handleAddSession} style={{ padding:"6px 12px", background:PA_COLOR, color:"#fff", border:"none", borderRadius:6, fontSize:12, cursor:"pointer", fontWeight:700 }}>Enregistrer</button>
                          <button onClick={()=>setAddingSession(false)} style={{ padding:"6px 10px", background:"#e5e7eb", border:"none", borderRadius:6, fontSize:12, cursor:"pointer" }}>Annuler</button>
                        </div>
                      )}

                      {sessions.length === 0 && !addingSession && <div style={{ padding:"24px", textAlign:"center", fontSize:12, color:"#94a3b8" }}>Aucune séance enregistrée. Cliquez sur + Ajouter pour commencer.</div>}
                      {[...sessions].sort((x,y)=>y.date.localeCompare(x.date)).map((s,i)=>(
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", borderBottom:i<sessions.length-1?"1px solid #f1f5f9":"none" }}>
                          <span style={{ fontSize:14 }}>{s.statut==="present"?"✅":"❌"}</span>
                          <span style={{ fontSize:12, color:"#374151", flex:1 }}>{s.date && new Date(s.date).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</span>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999, color:s.statut==="present"?"#15803d":"#ef4444", background:s.statut==="present"?"#dcfce7":"#fee2e2" }}>{s.statut==="present"?"Présent":"Absent"}</span>
                          <button onClick={()=>handleDeleteSession(sessions.indexOf(s))} style={{ background:"#fee2e2", border:"none", borderRadius:5, padding:"3px 6px", cursor:"pointer", fontSize:10, color:"#b91c1c" }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── PAIEMENT ─── */}
                {apprenantTab === "paiement" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                    {/* Bloc formation + coût */}
                    <div style={{ background:"linear-gradient(135deg,#f5f3ff,#ede9fe)", borderRadius:12, padding:"14px 18px", border:"1.5px solid #c4b5fd", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                      <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:PA_COLOR, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>Formation</div>
                        <div style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>{sd.formation_souhaitee || <span style={{ color:"#94a3b8", fontStyle:"italic" }}>Non renseignée</span>}</div>
                        <div style={{ display:"flex", gap:8, marginTop:5, flexWrap:"wrap" }}>
                          {sd.niveau_prospect && <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999, background:niveauColor, color:"#fff" }}>Niveau {sd.niveau_prospect}</span>}
                          {sd.nb_seances_souhaitees && <span style={{ fontSize:11, fontWeight:700, color:"#6d28d9", background:"#ede9fe", padding:"2px 8px", borderRadius:999 }}>🎯 {sd.nb_seances_souhaitees} séances</span>}
                        </div>
                      </div>
                      {sd.cout_formation ? (
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:10, fontWeight:700, color:PA_COLOR, textTransform:"uppercase", letterSpacing:".05em", marginBottom:2 }}>Coût total</div>
                          <div style={{ fontSize:24, fontWeight:900, color:"#0f172a" }}>{Number(sd.cout_formation).toLocaleString("fr-FR")} <span style={{ fontSize:13, color:"#6b7280" }}>FCFA</span></div>
                        </div>
                      ) : (
                        <span style={{ fontSize:11, color:"#f59e0b", fontWeight:700 }}>⚠️ Coût non renseigné</span>
                      )}
                    </div>

                    {/* Alertes retard */}
                    {tranches.filter(t=>t.statut==="en_attente").map(t=>{
                      const d=new Date(t.date_echeance); d.setHours(0,0,0,0);
                      const diff=Math.ceil((today-d)/86400000);
                      const daysLeft=Math.ceil((d-today)/86400000);
                      if(diff>7) return <div key={t.id} style={{ padding:"10px 14px", background:"#fef2f2", borderRadius:8, border:"1px solid #fca5a5", fontSize:12, color:"#b91c1c", fontWeight:700 }}>🚨 {t.label} — Retard critique de {diff} jours</div>;
                      if(diff>0) return <div key={t.id} style={{ padding:"10px 14px", background:"#fff7ed", borderRadius:8, border:"1px solid #fed7aa", fontSize:12, color:"#c2410c", fontWeight:700 }}>⚠️ {t.label} — Retard de {diff} jour{diff>1?"s":""}</div>;
                      if(daysLeft>=0&&daysLeft<=5) return <div key={t.id} style={{ padding:"10px 14px", background:"#fefce8", borderRadius:8, border:"1px solid #fde68a", fontSize:12, color:"#854d0e", fontWeight:700 }}>⏰ {t.label} — Échéance dans {daysLeft} jour{daysLeft!==1?"s":""}</div>;
                      return null;
                    })}

                    {/* Résumé financier */}
                    {(() => {
                      const totalVerse = apprenantPaiements.reduce((s,p)=>s+(p.montant_recu||0),0);
                      const baseTotal  = tranchesTotal > 0 ? tranchesTotal : (sd.cout_formation ? Number(sd.cout_formation) : 0);
                      const restant    = Math.max(0, baseTotal - totalVerse);
                      if (baseTotal === 0 && totalVerse === 0) return null;
                      return (
                        <div style={{ display:"flex", gap:0, background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0", overflow:"hidden" }}>
                          {[
                            { l:"Total planifié", v:baseTotal,  c:"#0f172a",  show: baseTotal>0 },
                            { l:"Versé",          v:totalVerse, c:"#22c55e",  show: true },
                            { l:"Restant",        v:restant,    c:restant>0?"#ef4444":"#22c55e", show: baseTotal>0 },
                          ].filter(s=>s.show).map((s,i,arr)=>(
                            <div key={s.l} style={{ flex:1, textAlign:"center", padding:"12px 8px", borderRight:i<arr.length-1?"1px solid #e2e8f0":"none" }}>
                              <div style={{ fontSize:10, color:"#94a3b8", marginBottom:3 }}>{s.l}</div>
                              <div style={{ fontSize:16, fontWeight:800, color:s.c }}>{Number(s.v).toLocaleString("fr-FR")} F</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Plan de paiement */}
                    <div>
                      <div style={{ fontSize:12, fontWeight:800, color:"#374151", marginBottom:8 }}>📅 Plan de paiement échelonné</div>
                      {tranches.length === 0 && <div style={{ fontSize:12, color:"#94a3b8", padding:"16px", background:"#f8fafc", borderRadius:8, border:"1px dashed #e2e8f0", textAlign:"center" }}>Aucune tranche définie. Ajoutez-en ci-dessous.</div>}
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {tranches.map(t=>{
                          const d=new Date(t.date_echeance); d.setHours(0,0,0,0);
                          const diff=Math.ceil((today-d)/86400000);
                          const isLate=t.statut==="en_attente"&&diff>0;
                          return (
                            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${t.statut==="payé"?"#bbf7d0":isLate?"#fca5a5":"#e2e8f0"}`, background:t.statut==="payé"?"#f0fdf4":isLate?"#fef2f2":"#fff" }}>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:12, fontWeight:800, color:"#0f172a" }}>{t.label}</div>
                                <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>
                                  {Number(t.montant).toLocaleString("fr-FR")} F · Échéance : {t.date_echeance}
                                  {t.date_paiement_effectif && ` · Payé le ${t.date_paiement_effectif}`}
                                </div>
                              </div>
                              <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, color:t.statut==="payé"?"#15803d":isLate?"#b91c1c":"#d97706", background:t.statut==="payé"?"#dcfce7":isLate?"#fee2e2":"#fef3c7" }}>
                                {t.statut==="payé"?"✅ Payé":isLate?"⛔ Retard":"⏳ En attente"}
                              </span>
                              {t.statut !== "payé" && (
                                <button
                                  onClick={async()=>{
                                    const newTranches=tranches.map(tr=>tr.id===t.id?{...tr,statut:"payé",date_paiement_effectif:new Date().toISOString().slice(0,10)}:tr);
                                    await handleSavePlanPaiement(a.id,{...plan,tranches:newTranches});
                                    toast.success("Tranche marquée comme payée ✓");
                                  }}
                                  title="Marquer payé" style={{ background:"#dcfce7", border:"1px solid #bbf7d0", borderRadius:6, padding:"4px 8px", fontSize:12, cursor:"pointer" }}>✅</button>
                              )}
                              <EcheancePicker tranche={t} onSave={async(newDate)=>{
                                const newTranches=tranches.map(tr=>tr.id===t.id?{...tr,date_echeance:newDate}:tr);
                                await handleSavePlanPaiement(a.id,{...plan,tranches:newTranches});
                              }} />
                              <button
                                onClick={async()=>{
                                  const newTranches=tranches.filter(tr=>tr.id!==t.id);
                                  await handleSavePlanPaiement(a.id,{...plan,tranches:newTranches});
                                }}
                                title="Supprimer" style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:6, padding:"4px 8px", fontSize:12, cursor:"pointer" }}>🗑️</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ajouter tranche */}
                    {isSolde ? (
                      <div style={{ padding:"12px 16px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"#f1f5f9", color:"#94a3b8", fontSize:12, fontWeight:600 }}>✅ Paiement soldé — aucune nouvelle tranche possible</div>
                    ) : (
                      <AddTrancheForm onAdd={async(newT)=>{
                        const newTranches=[...tranches,{...newT,id:`t${Date.now()}`,statut:"en_attente",date_paiement_effectif:null}];
                        await handleSavePlanPaiement(a.id,{...plan,tranches:newTranches});
                      }} />
                    )}

                    {/* ── Versements enregistrés ── */}
                    <div style={{ borderTop:"1.5px solid #e2e8f0", paddingTop:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                        <div style={{ fontSize:12, fontWeight:800, color:"#374151" }}>
                          💳 Versements enregistrés {loadingPaiements ? "(…)" : `(${apprenantPaiements.length})`}
                        </div>
                        <button
                          onClick={()=>setAddingVersement(v=>!v)}
                          style={{ padding:"5px 12px", background:addingVersement?"#e5e7eb":PA_COLOR, color:addingVersement?"#374151":"#fff", border:"none", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                          {addingVersement ? "✕ Annuler" : "+ Ajouter un versement"}
                        </button>
                      </div>

                      {/* Formulaire ajout versement */}
                      {addingVersement && (
                        <div style={{ background:"#f5f3ff", borderRadius:10, padding:"14px 16px", border:"1.5px solid #ddd6fe", marginBottom:12 }}>
                          <div style={{ fontSize:12, fontWeight:800, color:PA_DARK, marginBottom:10 }}>Nouveau versement</div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                              <label style={{ fontSize:11, fontWeight:700, color:"#374151" }}>Montant (FCFA) *</label>
                              <input type="number" min={0} placeholder="Ex : 50000"
                                value={versementForm.montant} onChange={e=>setVersementForm(p=>({...p,montant:e.target.value}))}
                                style={{ padding:"8px 10px", border:"1.5px solid #c4b5fd", borderRadius:7, fontSize:13, outline:"none" }} />
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                              <label style={{ fontSize:11, fontWeight:700, color:"#374151" }}>Date</label>
                              <input type="date" value={versementForm.date} onChange={e=>setVersementForm(p=>({...p,date:e.target.value}))}
                                style={{ padding:"8px 10px", border:"1.5px solid #c4b5fd", borderRadius:7, fontSize:13, outline:"none" }} />
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                              <label style={{ fontSize:11, fontWeight:700, color:"#374151" }}>Mode de paiement</label>
                              <select value={versementForm.mode} onChange={e=>setVersementForm(p=>({...p,mode:e.target.value}))}
                                style={{ padding:"8px 10px", border:"1.5px solid #c4b5fd", borderRadius:7, fontSize:13, outline:"none", background:"#fff" }}>
                                {["Mobile Money","Virement bancaire","Espèces","Chèque","Carte bancaire"].map(m=><option key={m}>{m}</option>)}
                              </select>
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                              <label style={{ fontSize:11, fontWeight:700, color:"#374151" }}>Réf. transaction</label>
                              <input placeholder="Ex : TXN-12345"
                                value={versementForm.ref} onChange={e=>setVersementForm(p=>({...p,ref:e.target.value}))}
                                style={{ padding:"8px 10px", border:"1.5px solid #c4b5fd", borderRadius:7, fontSize:13, outline:"none" }} />
                            </div>
                            <div style={{ gridColumn:"span 2", display:"flex", flexDirection:"column", gap:4 }}>
                              <label style={{ fontSize:11, fontWeight:700, color:"#374151" }}>Notes</label>
                              <input placeholder="Ex : Règlement acompte Tranche 1"
                                value={versementForm.notes} onChange={e=>setVersementForm(p=>({...p,notes:e.target.value}))}
                                style={{ padding:"8px 10px", border:"1.5px solid #c4b5fd", borderRadius:7, fontSize:13, outline:"none" }} />
                            </div>
                          </div>
                          <button onClick={()=>handleSaveVersement(a)} disabled={savingVersement||!versementForm.montant}
                            style={{ padding:"9px 20px", background:PA_COLOR, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", opacity:(savingVersement||!versementForm.montant)?0.6:1 }}>
                            {savingVersement ? "Enregistrement…" : "✓ Enregistrer le versement"}
                          </button>
                        </div>
                      )}

                      {/* Liste versements */}
                      {loadingPaiements && <div style={{ textAlign:"center", padding:"20px 0", fontSize:12, color:"#94a3b8" }}>Chargement…</div>}
                      {!loadingPaiements && apprenantPaiements.length === 0 && (
                        <div style={{ textAlign:"center", padding:"24px 0", color:"#94a3b8", fontSize:12, background:"#f8fafc", borderRadius:8, border:"1px dashed #e2e8f0" }}>Aucun versement enregistré.</div>
                      )}
                      {!loadingPaiements && apprenantPaiements.length > 0 && (
                        <>
                          <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
                            {apprenantPaiements.map((p,i)=>(
                              <div key={p.id||i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderBottom:i<apprenantPaiements.length-1?"1px solid #f1f5f9":"none", background:i%2===0?"#fff":"#fafafa" }}>
                                <div style={{ width:34, height:34, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>✅</div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>
                                    {p.date_paiement ? new Date(p.date_paiement).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}) : "—"}
                                    {p.mode_paiement && <span style={{ marginLeft:8, fontSize:11, color:"#64748b", fontWeight:400 }}>· {p.mode_paiement}</span>}
                                  </div>
                                  {p.ref_transaction && <div style={{ fontSize:11, color:"#94a3b8" }}>Réf : {p.ref_transaction}</div>}
                                  {p.notes && <div style={{ fontSize:11, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.notes}</div>}
                                </div>
                                <div style={{ textAlign:"right", flexShrink:0 }}>
                                  <div style={{ fontSize:14, fontWeight:800, color:"#22c55e" }}>+{Number(p.montant_recu||0).toLocaleString("fr-FR")} F</div>
                                  {p.montant_du > 0 && p.montant_du !== p.montant_recu && (
                                    <div style={{ fontSize:10, color:"#94a3b8" }}>sur {Number(p.montant_du).toLocaleString("fr-FR")} F</div>
                                  )}
                                </div>
                              </div>
                            ))}
                            <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"#f0fdf4", borderTop:"1.5px solid #bbf7d0", fontSize:13, fontWeight:800 }}>
                              <span>Total versé</span>
                              <span style={{ color:"#16a34a" }}>{Number(apprenantPaiements.reduce((s,p)=>s+(p.montant_recu||0),0)).toLocaleString("fr-FR")} F</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── PROGRESSION ─── */}
                {apprenantTab === "progression" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                    {/* Infos dossier */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                      <div style={{ background:"#f5f3ff", borderRadius:10, padding:"14px", textAlign:"center", border:"1px solid #ddd6fe" }}>
                        <div style={{ fontSize:10, color:PA_COLOR, fontWeight:700, marginBottom:4 }}>Niveau de départ</div>
                        <div style={{ fontSize:24, fontWeight:900, color:"#0f172a" }}>{sd.niveau_prospect || "—"}</div>
                      </div>
                      <div style={{ background:"#f0fdf4", borderRadius:10, padding:"14px", textAlign:"center", border:"1px solid #bbf7d0" }}>
                        <div style={{ fontSize:10, color:"#15803d", fontWeight:700, marginBottom:4 }}>Séances réalisées</div>
                        <div style={{ fontSize:24, fontWeight:900, color:"#0f172a" }}>{seancesCnt}</div>
                        {sd.nb_seances_souhaitees && <div style={{ fontSize:10, color:"#64748b" }}>/ {sd.nb_seances_souhaitees}</div>}
                      </div>
                      <div style={{ background:"#e0f2fe", borderRadius:10, padding:"14px", textAlign:"center", border:"1px solid #bae6fd" }}>
                        <div style={{ fontSize:10, color:"#0369a1", fontWeight:700, marginBottom:4 }}>Formation</div>
                        <div style={{ fontSize:13, fontWeight:800, color:"#0f172a", lineHeight:1.3 }}>{sd.formation_souhaitee || "—"}</div>
                      </div>
                    </div>

                    {/* Barre de progression séances */}
                    {sd.nb_seances_souhaitees && (
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:12, color:"#64748b" }}>Avancement du parcours</span>
                          <span style={{ fontSize:13, fontWeight:800, color:PA_COLOR }}>{Math.min(100,Math.round((seancesCnt/sd.nb_seances_souhaitees)*100))}%</span>
                        </div>
                        <ProgressBar value={Math.min(100,Math.round((seancesCnt/(sd.nb_seances_souhaitees||1))*100))} />
                      </div>
                    )}

                    {/* Coach */}
                    {(a.notes_coach || a.coach_nom) && (
                      <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 16px", border:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:22 }}>👨‍🏫</span>
                        <div>
                          <div style={{ fontSize:12, fontWeight:800, color:"#0f172a" }}>Coach affecté</div>
                          <div style={{ fontSize:13, color:PA_COLOR, fontWeight:700 }}>{a.notes_coach || a.coach_nom}</div>
                        </div>
                      </div>
                    )}

                    {/* Commentaires / notes de suivi */}
                    <div>
                      <div style={{ fontSize:12, fontWeight:800, color:"#374151", marginBottom:8 }}>📝 Notes de progression</div>
                      <textarea
                        value={progNote || progNotes[a.id] || sp.notes_progression || ""}
                        onChange={e=>setProgNote(e.target.value)}
                        placeholder="Observations sur la progression, points à travailler, objectifs atteints…"
                        style={{ width:"100%", minHeight:100, padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, fontFamily:FF, resize:"vertical", outline:"none", boxSizing:"border-box" }}
                      />
                      <button
                        onClick={async()=>{
                          setSavingProgNote(true);
                          const newSp = { ...sp, notes_progression:progNote };
                          await handleSavePresencesPA(a.id, newSp);
                          setProgNotes(prev=>({...prev,[a.id]:progNote}));
                          setSavingProgNote(false);
                        }}
                        disabled={savingProgNote}
                        style={{ marginTop:8, padding:"8px 18px", background:PA_COLOR, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:12, cursor:"pointer", opacity:savingProgNote?0.6:1 }}>
                        {savingProgNote?"Enregistrement…":"💾 Sauvegarder les notes"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── CHAT ─── */}
                {apprenantTab === "chat" && (
                  <ProspectChatPanel assignation={a} profil={profil} onClose={()=>setApprenantTab("infos")} />
                )}

              </div>

              <div style={{ padding:"16px 24px", borderTop:"1px solid #e2e8f0", display:"flex", justifyContent:"flex-end", flexShrink:0 }}>
                <Btn outline onClick={()=>setApprenantModal(null)}>Fermer</Btn>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL — Nouveau cours privé ══ */}
      {modalCours && (
        <Modal title="📚 Nouveau cours privé" onClose={()=>setModalCours(false)} wide>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={{ gridColumn:"span 2" }}>
              <Input label="Nom de l'apprenant *" placeholder="Ex : Kouamé Yao" value={formCours.apprenantNom} onChange={e=>setFormCours(p=>({...p,apprenantNom:e.target.value}))} />
            </div>
            <Select label="Niveau *" value={formCours.niveau} onChange={e=>setFormCours(p=>({...p,niveau:e.target.value}))}>
              {NIVEAUX.map(n=><option key={n}>{n}</option>)}
            </Select>
            <Select label="Objectif" value={formCours.objectif} onChange={e=>setFormCours(p=>({...p,objectif:e.target.value}))}>
              {["Général","TOEIC","IELTS","Business English","Académique"].map(o=><option key={o}>{o}</option>)}
            </Select>
            <Select label="Type de séance" value={formCours.typeSeance} onChange={e=>setFormCours(p=>({...p,typeSeance:e.target.value}))}>
              <option value="en ligne">En ligne</option>
              <option value="présentiel">Présentiel</option>
              <option value="à domicile">À domicile</option>
            </Select>
            <Select label="Coach *" value={formCours.coachId} onChange={e=>setFormCours(p=>({...p,coachId:e.target.value}))}>
              <option value="">Sélectionner un coach</option>
              {coaches.filter(c=>c.dispo&&c.niveaux.includes(formCours.niveau)).map(c=>(
                <option key={c.id} value={c.id}>{c.nom} — {c.specialite} ({formatMoney(c.tarif_h)}/h)</option>
              ))}
            </Select>
            <Input label="Horaire" placeholder="Ex : Lun-Mer 18h" value={formCours.horaire} onChange={e=>setFormCours(p=>({...p,horaire:e.target.value}))} />
            <Input label="Nb séances" type="number" min={1} value={formCours.nbSeances} onChange={e=>setFormCours(p=>({...p,nbSeances:e.target.value}))} />
            <Input label="Date de début *" type="date" value={formCours.debut} onChange={e=>setFormCours(p=>({...p,debut:e.target.value}))} />
            <Input label="Date de fin *" type="date" value={formCours.fin} onChange={e=>setFormCours(p=>({...p,fin:e.target.value}))} />
          </div>

          {formCours.coachId && (
            <div style={{ marginTop:14, background:PA_LIGHT, borderRadius:10, padding:"12px 14px", fontSize:13 }}>
              <strong>Estimation honoraires :</strong>{" "}
              {formatMoney(+(coaches.find(c=>c.id===+formCours.coachId)?.tarif_h||0) * 1.5 * +formCours.nbSeances)}
              <span style={{ fontSize:11, color:"#64748b", marginLeft:6 }}>(base 1h30/séance)</span>
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:20 }}>
            <Btn outline onClick={()=>setModalCours(false)}>Annuler</Btn>
            <Btn onClick={handleCreerCours}>Créer le cours ✓</Btn>
          </div>
        </Modal>
      )}

      {/* ══ MODAL — Confirmation validation mensuelle ══ */}
      {modalValidation && (
        <Modal title="✅ Valider le récapitulatif mensuel" onClose={()=>setModalValidation(false)}>
          <div style={{ textAlign:"center", padding:"10px 0 20px" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
            <div style={{ fontSize:16, fontWeight:800, color:"#0f172a", marginBottom:8 }}>Confirmer la validation — {moisValidation}</div>
            <div style={{ fontSize:13, color:"#64748b", lineHeight:1.6 }}>
              Vous allez valider les honoraires de <strong>{honorairesParCoach.length} coaches</strong>{" "}
              pour un total de <strong>{formatMoney(honorairesParCoach.reduce((s,h)=>s+h.totalMontant,0))}</strong>.
              <br />Ce récapitulatif sera transmis aux <strong>Ressources Humaines</strong> pour traitement.
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <Btn outline onClick={()=>setModalValidation(false)}>Annuler</Btn>
            <Btn color="#16a34a" onClick={handleValiderTout}>✓ Valider et transmettre aux RH</Btn>
          </div>
        </Modal>
      )}

      {/* ══ MODAL PROSPECT DOMICILE ══ */}
      {prospectModal && (() => {
        const p = prospectModal;
        const st = STATUT_PROSPECT[p.statut] || STATUT_PROSPECT.nouveau;
        const initiales = (p.prospect_nom||"?").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:16 }}
            onClick={()=>setProspectModal(null)}>
            <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:660, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.2)" }}
              onClick={e=>e.stopPropagation()}>

              {/* Header */}
              <div style={{ background:PA_GRADIENT, padding:"20px 24px", borderRadius:"18px 18px 0 0", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:50, height:50, borderRadius:"50%", background:"rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:"#fff", flexShrink:0 }}>{initiales}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:800, color:"#fff" }}>{p.prospect_nom||"—"}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", display:"flex", gap:10, flexWrap:"wrap" }}>
                    {p.prospect_email && <span>{p.prospect_email}</span>}
                    {p.prospect_telephone && <span>📞 {p.prospect_telephone}</span>}
                  </div>
                </div>
                <span style={{ fontSize:11, fontWeight:800, padding:"4px 12px", borderRadius:999, background:st.bg, color:st.color }}>{st.icon} {st.label}</span>
                <button onClick={()=>setProspectModal(null)} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:30, height:30, borderRadius:"50%", cursor:"pointer", fontSize:16, flexShrink:0 }}>✕</button>
              </div>

              <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:16 }}>

                {/* Infos contact */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    ["Type de cours",  "🏠 À domicile / Privé"],
                    ["Source",          p.source || "formulaire_domicile"],
                    ["Date de demande", formatDate(p.created_at)],
                    ["Conseiller PA",   p.assistante_nom || "—"],
                  ].map(([l,v])=>(
                    <div key={l} style={{ background:"#f8fafc", borderRadius:8, padding:"10px 14px", border:"1px solid #e2e8f0" }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".05em", marginBottom:3 }}>{l}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* ─── DOSSIER PROSPECT (besoins) ─── */}
                {(() => {
                  const sd = p.suivi_demarrage || {};
                  const dossierComplet = sd.niveau_prospect && sd.nb_seances_souhaitees && sd.formation_souhaitee && sd.cout_formation;
                  return (
                    <div style={{ background: dossierComplet ? "#f0fdf4" : "#fffbeb", borderRadius:12, padding:"16px 18px", border:`1.5px solid ${dossierComplet?"#bbf7d0":"#fde68a"}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                        <span style={{ fontSize:16 }}>{dossierComplet ? "✅" : "⚠️"}</span>
                        <div style={{ fontSize:13, fontWeight:800, color: dossierComplet ? "#15803d" : "#92400e" }}>
                          Besoin du client {dossierComplet ? "(renseigné)" : "(à compléter avant affectation)"}
                        </div>
                      </div>

                      {/* Affichage si déjà renseigné */}
                      {dossierComplet && (
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                          {[
                            ["Niveau", sd.niveau_prospect],
                            ["Nb séances", sd.nb_seances_souhaitees],
                            ["Formation", sd.formation_souhaitee],
                            ["Coût total", sd.cout_formation ? Number(sd.cout_formation).toLocaleString("fr-FR")+" F" : "—"],
                          ].map(([l,v])=>(
                            <div key={l} style={{ background:"#fff", borderRadius:8, padding:"8px 10px", border:"1px solid #bbf7d0" }}>
                              <div style={{ fontSize:10, fontWeight:700, color:"#16a34a", textTransform:"uppercase", marginBottom:2 }}>{l}</div>
                              <div style={{ fontSize:13, fontWeight:800, color:"#0f172a" }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulaire éditable */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:"#374151" }}>Niveau détecté *</label>
                          <select
                            value={prospectDossier.niveau}
                            onChange={e=>setProspectDossier(prev=>({...prev, niveau:e.target.value}))}
                            style={{ padding:"8px 10px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none", background:"#fff" }}>
                            <option value="">— Choisir —</option>
                            {NIVEAUX.map(n=><option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:"#374151" }}>Nb de séances souhaitées *</label>
                          <input
                            type="number" min={1} max={200}
                            value={prospectDossier.nb_seances}
                            onChange={e=>setProspectDossier(prev=>({...prev, nb_seances:e.target.value}))}
                            placeholder="Ex : 20"
                            style={{ padding:"8px 10px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none" }}
                          />
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:"#374151" }}>Formation souhaitée *</label>
                          <select
                            value={prospectDossier.formation}
                            onChange={e=>setProspectDossier(prev=>({...prev, formation:e.target.value}))}
                            style={{ padding:"8px 10px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none", background:"#fff" }}>
                            <option value="">— Choisir —</option>
                            {["Anglais général","Business English","TOEIC","IELTS","Préparation examen","Communication professionnelle","Anglais académique"].map(f=>(
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:"#374151" }}>Coût de la formation (FCFA) *</label>
                          <input
                            type="number" min={0}
                            value={prospectDossier.cout_formation}
                            onChange={e=>setProspectDossier(prev=>({...prev, cout_formation:e.target.value}))}
                            placeholder="Ex : 150000"
                            style={{ padding:"8px 10px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none" }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={()=>saveDossierProspect(p.id)}
                        disabled={savingDossier || !prospectDossier.niveau || !prospectDossier.nb_seances || !prospectDossier.formation || !prospectDossier.cout_formation}
                        style={{ padding:"8px 18px", background: dossierComplet ? "#16a34a" : "#f59e0b", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:12, cursor:"pointer", opacity: (savingDossier||!prospectDossier.niveau||!prospectDossier.nb_seances||!prospectDossier.formation||!prospectDossier.cout_formation)?0.6:1 }}>
                        {savingDossier ? "Enregistrement…" : dossierComplet ? "✓ Mettre à jour le dossier" : "💾 Enregistrer le dossier"}
                      </button>
                    </div>
                  );
                })()}

                {/* Changer statut */}
                <div>
                  <div style={{ fontSize:12, fontWeight:800, color:"#374151", marginBottom:8 }}>Changer le statut</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {["nouveau","en_cours","converti","perdu"].map(s => {
                      const sv = STATUT_PROSPECT[s];
                      return (
                        <button key={s} onClick={()=>updateProspectStatut(p.id,s)} disabled={p.statut===s}
                          style={{ padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:700, cursor:p.statut===s?"default":"pointer", border:"1.5px solid", borderColor:p.statut===s?sv.color:"#e2e8f0", background:p.statut===s?sv.bg:"#f8fafc", color:p.statut===s?sv.color:"#6b7280", opacity:p.statut===s?1:0.85 }}>
                          {sv.icon} {sv.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Affecter un coach — bloqué si dossier incomplet */}
                {p.statut !== "converti" && p.statut !== "perdu" && (() => {
                  const sd = p.suivi_demarrage || {};
                  const dossierComplet = sd.niveau_prospect && sd.nb_seances_souhaitees && sd.formation_souhaitee && sd.cout_formation;
                  return (
                    <div style={{ background: dossierComplet ? "#f5f3ff" : "#f8fafc", borderRadius:12, padding:"14px 16px", border:`1.5px solid ${dossierComplet?"#ddd6fe":"#e2e8f0"}`, opacity: dossierComplet ? 1 : 0.6 }}>
                      <div style={{ fontSize:12, fontWeight:800, color: dossierComplet ? PA_DARK : "#94a3b8", marginBottom: dossierComplet ? 10 : 6 }}>
                        🎯 Affecter un coach privé
                      </div>
                      {!dossierComplet && (
                        <div style={{ fontSize:12, color:"#f59e0b", fontWeight:600, marginBottom:6 }}>
                          ⚠️ Renseignez le dossier du prospect avant d'affecter un coach.
                        </div>
                      )}
                      <div style={{ display:"flex", gap:8 }}>
                        <select
                          value={prospectCoachForm[p.id]||""}
                          onChange={e=>setProspectCoachForm(prev=>({...prev,[p.id]:e.target.value}))}
                          disabled={!dossierComplet}
                          style={{ flex:1, padding:"8px 12px", border:`1.5px solid ${dossierComplet?"#c4b5fd":"#e2e8f0"}`, borderRadius:8, fontSize:12, outline:"none", background:"#fff", cursor:dossierComplet?"pointer":"not-allowed" }}>
                          <option value="">— Choisir un coach —</option>
                          {coaches.filter(c=>c.dispo && (!sd.niveau_prospect || c.niveaux.includes(sd.niveau_prospect))).map(c=>(
                            <option key={c.id} value={c.id}>{c.nom} · {c.specialite} · {Number(c.tarif_h).toLocaleString("fr-FR")} F/h</option>
                          ))}
                        </select>
                        <button onClick={()=>affecterCoachProspect(p.id)} disabled={!dossierComplet}
                          style={{ padding:"8px 16px", background:dossierComplet?PA_COLOR:"#e2e8f0", color:dossierComplet?"#fff":"#9ca3af", border:"none", borderRadius:8, fontWeight:700, fontSize:12, cursor:dossierComplet?"pointer":"not-allowed" }}>
                          Affecter
                        </button>
                      </div>
                      {p.coach_nom && (
                        <div style={{ marginTop:8, fontSize:12, color:"#6d28d9", fontWeight:600 }}>👨‍🏫 Coach actuel : {p.coach_nom}</div>
                      )}
                    </div>
                  );
                })()}

                {/* Convertir en cours privé */}
                {p.statut === "converti" && (
                  <div style={{ background:"#f0fdf4", borderRadius:10, padding:"12px 16px", border:"1.5px solid #bbf7d0", display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:22 }}>✅</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:"#15803d" }}>Prospect converti</div>
                      <div style={{ fontSize:11, color:"#64748b" }}>Créez le cours privé dans l'onglet "Cours privés".</div>
                    </div>
                    <button onClick={()=>{ setProspectModal(null); setActiveTab("cours"); setModalCours(true); }}
                      style={{ marginLeft:"auto", padding:"7px 14px", background:"#22c55e", color:"#fff", border:"none", borderRadius:7, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                      → Créer le cours
                    </button>
                  </div>
                )}

                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <Btn outline onClick={()=>setProspectModal(null)}>Fermer</Btn>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

          {/* ── ONGLET MESSAGES ── */}
          {activeTab === "messages" && (
            <div style={{ padding:"0 0 32px" }}>
              <MessagerieTab accentColor="#7c3aed" />
            </div>
          )}

          {/* ── ONGLET NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <div style={{ padding: "24px 0" }}>
              <NotificationsTab userId={profil?.id} accentColor="#7c3aed" />
            </div>
          )}

    </div>
  );
}
