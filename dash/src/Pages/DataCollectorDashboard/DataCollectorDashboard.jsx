// src/Pages/DataCollector/DataCollectorDashboard.jsx
import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import NotificationsTab from "../../Components/NotificationsTab";

/* ═══════════════════════════════════════════════════════
   CHARTE BET
═══════════════════════════════════════════════════════ */
const C = {
  primary:   "#0891b2",
  dark:      "#0e7490",
  light:     "#e0f2fe",
  gradient:  "linear-gradient(135deg, #0f172a 0%, #0891b2 100%)",
  green:     "#22c55e",
  amber:     "#f59e0b",
  red:       "#ef4444",
  slate:     "#64748b",
};

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK
═══════════════════════════════════════════════════════ */
const PAYS = ["Côte d'Ivoire","Sénégal","Cameroun","Mali","Burkina Faso","Bénin","Togo","Niger","France","Autre"];
const VILLES_CI = ["Abidjan","Bouaké","Yamoussoukro","San-Pédro","Daloa","Man","Korhogo","Abengourou"];
const SECTEURS = ["Finance / Banque","Industrie","Commerce","Télécoms","Santé","Education","Énergie","Transport","Administration","Autre"];
const OFFRE_LIST = ["Anglais Pro B2","Business English","Certification TOEIC","Anglais Enfant","Formation Entreprise","Préparation IELTS"];
const NIVEAUX = ["A1 – Débutant","A2 – Élémentaire","B1 – Intermédiaire","B2 – Intermédiaire avancé","C1 – Avancé","C2 – Maîtrise","Non évalué"];

const INIT_CLIENTS = [
  { id:1,  type:"entreprise", nom:"Orange CI",        contact:"M. Kouamé Aya",       email:"k.aya@orange.ci",      tel:"+225 05 00 12 34",  ville:"Abidjan",  secteur:"Télécoms",      offre:"Formation Entreprise",  niveau:"B1 – Intermédiaire",    effectif:12, statut:"actif",     dateCreation:"2025-11-15", complet:true },
  { id:2,  type:"entreprise", nom:"BNP Paribas CI",   contact:"Mme Diallo Ibrahim",  email:"d.ibra@bnp.ci",        tel:"+225 07 22 33 44",  ville:"Abidjan",  secteur:"Finance / Banque", offre:"Certification TOEIC", niveau:"B2 – Intermédiaire avancé", effectif:8, statut:"actif",  dateCreation:"2025-11-18", complet:true },
  { id:3,  type:"particulier",nom:"Adjoua Koné",      contact:"",                     email:"adjoua.k@gmail.com",   tel:"+225 01 55 66 77",  ville:"Abidjan",  secteur:"",              offre:"Anglais Pro B2",        niveau:"A2 – Élémentaire",       effectif:1,  statut:"actif",    dateCreation:"2025-11-20", complet:false },
  { id:4,  type:"entreprise", nom:"Total Energies CI",contact:"M. Bamba Seydou",     email:"s.bamba@total.ci",     tel:"+225 07 88 99 00",  ville:"Abidjan",  secteur:"Énergie",       offre:"Business English",      niveau:"B1 – Intermédiaire",    effectif:20, statut:"inactif",   dateCreation:"2025-11-22", complet:true },
  { id:5,  type:"particulier",nom:"Ibrahim Traoré",   contact:"",                     email:"itraore@gmail.com",    tel:"+225 05 44 55 66",  ville:"Bouaké",   secteur:"",              offre:"Anglais Enfant",        niveau:"Non évalué",             effectif:1,  statut:"actif",    dateCreation:"2025-11-25", complet:false },
  { id:6,  type:"étudiant",   nom:"Marie-Ange Dupont",contact:"",                     email:"marie.d@cci.ci",       tel:"+225 07 11 22 33",  ville:"Abidjan",  secteur:"Education",     offre:"Préparation IELTS",     niveau:"B2 – Intermédiaire avancé", effectif:1, statut:"actif", dateCreation:"2025-12-01", complet:true },
];

const INIT_PROSPECTS = [
  { id:1,  nom:"Nestlé CI",       contact:"Mme Ouédraogo",  email:"hr@nestle.ci",       tel:"+225 22 40 50 60", ville:"Abidjan", secteur:"Industrie",     source:"Site web",      interetOffre:"Formation Entreprise", statut:"nouveau",   dateContact:"2025-12-05", notes:"Intéressée par groupe de 15 personnes" },
  { id:2,  nom:"SIFCA Group",     contact:"M. Koné Albert", email:"a.kone@sifca.ci",    tel:"+225 07 77 88 99", ville:"Abidjan", secteur:"Industrie",     source:"Salon",         interetOffre:"Business English",     statut:"contacté",  dateContact:"2025-12-06", notes:"RDV commercial prévu" },
  { id:3,  nom:"Fatoumata Diarra",contact:"",               email:"fdiarra@gmail.com",  tel:"+225 01 33 44 55", ville:"Daloa",   secteur:"",              source:"Test de niveau",interetOffre:"Anglais Pro B2",       statut:"relancé",   dateContact:"2025-12-07", notes:"Score B1 – très motivée" },
  { id:4,  nom:"Conseil Régional",contact:"DRH Konaté",     email:"drh@cr-abidjan.ci",  tel:"+225 22 30 40 50", ville:"Abidjan", secteur:"Administration",source:"Recommandation",interetOffre:"Certification TOEIC",  statut:"nouveau",   dateContact:"2025-12-08", notes:"" },
  { id:5,  nom:"Karim Ouattara",  contact:"",               email:"k.ouattara@free.ci", tel:"+225 05 66 77 88", ville:"Korhogo", secteur:"",              source:"Emailing",      interetOffre:"Anglais Enfant",       statut:"à_relancer",dateContact:"2025-11-30", notes:"2 enfants à inscrire" },
];

const INIT_HISTORIQUE = [
  { id:1,  action:"Création",    type:"Client",    nom:"Orange CI",          champ:"–",              avant:"–",             apres:"Dossier créé", date:"2025-11-15 09:05", operateur:"Saisie A." },
  { id:2,  action:"Modification",type:"Client",    nom:"Orange CI",          champ:"Effectif",       avant:"10",            apres:"12",           date:"2025-11-18 14:32", operateur:"Saisie A." },
  { id:3,  action:"Création",    type:"Client",    nom:"BNP Paribas CI",     champ:"–",              avant:"–",             apres:"Dossier créé", date:"2025-11-18 10:12", operateur:"Saisie A." },
  { id:4,  action:"Import",      type:"Import",    nom:"prospects_nov.csv",  champ:"–",              avant:"–",             apres:"12 lignes importées", date:"2025-11-20 16:00", operateur:"Saisie A." },
  { id:5,  action:"Création",    type:"Client",    nom:"Adjoua Koné",        champ:"–",              avant:"–",             apres:"Dossier créé", date:"2025-11-20 11:45", operateur:"Saisie A." },
  { id:6,  action:"Modification",type:"Prospect",  nom:"SIFCA Group",        champ:"Statut",         avant:"nouveau",       apres:"contacté",     date:"2025-12-06 09:18", operateur:"Saisie A." },
  { id:7,  action:"Import",      type:"Import",    nom:"clients_dec.xlsx",   champ:"–",              avant:"–",             apres:"8 lignes importées", date:"2025-12-08 14:00", operateur:"Saisie A." },
  { id:8,  action:"Suppression", type:"Prospect",  nom:"Ancien doublon",     champ:"–",              avant:"Dossier actif", apres:"Supprimé",     date:"2025-12-09 10:30", operateur:"Saisie A." },
];

const QUALITE_FIELDS = [
  { champ:"Email",        clients:6, remplis:6, taux:100 },
  { champ:"Téléphone",    clients:6, remplis:6, taux:100 },
  { champ:"Ville",        clients:6, remplis:6, taux:100 },
  { champ:"Secteur",      clients:6, remplis:4, taux:67  },
  { champ:"Offre",        clients:6, remplis:6, taux:100 },
  { champ:"Niveau CECRL", clients:6, remplis:5, taux:83  },
  { champ:"Effectif",     clients:6, remplis:6, taux:100 },
];

/* ═══════════════════════════════════════════════════════
   COMPOSANTS UI
═══════════════════════════════════════════════════════ */
const Badge = ({ label, color, bg }) => (
  <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:99, fontSize:10, fontWeight:700, color, background:bg, whiteSpace:"nowrap" }}>{label}</span>
);

const StatCard = ({ label, value, sub, icon, color, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff", padding:"14px 16px", borderRadius:12, border:`1px solid ${color}22`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)", display:"flex", alignItems:"center", gap:12, cursor:onClick?"pointer":"default" }}>
    <div style={{ width:44, height:44, borderRadius:10, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
    <div>
      <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:".04em" }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color, lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:"#9ca3af" }}>{sub}</div>}
    </div>
  </div>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000, padding:16 }}>
    <div style={{ background:"#fff", borderRadius:14, padding:24, width: wide ? 720 : 540, maxWidth:"96vw", maxHeight:"92vh", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#111827" }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#9ca3af", lineHeight:1 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const QualityBar = ({ taux }) => {
  const color = taux === 100 ? C.green : taux >= 80 ? C.amber : C.red;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height:7, background:"#e5e7eb", borderRadius:7, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${taux}%`, background:color, borderRadius:7, transition:"width .4s" }} />
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, minWidth:32, textAlign:"right" }}>{taux}%</span>
    </div>
  );
};

const statutClientColors = {
  actif:   { label:"Actif",   color:"#15803d", bg:"#dcfce7" },
  inactif: { label:"Inactif", color:"#6b7280", bg:"#f3f4f6" },
};
const statutProspectColors = {
  nouveau:     { label:"Nouveau",     color:C.primary, bg:C.light },
  contacté:    { label:"Contacté",    color:"#92400e",  bg:"#fef3c7" },
  relancé:     { label:"Relancé",     color:"#1d4ed8",  bg:"#dbeafe" },
  à_relancer:  { label:"À relancer",  color:C.red,      bg:"#fee2e2" },
  converti:    { label:"Converti",    color:"#15803d",  bg:"#dcfce7" },
};
const actionColors = {
  Création:    { color:"#15803d", bg:"#dcfce7" },
  Modification:{ color:"#92400e", bg:"#fef3c7" },
  Import:      { color:C.primary, bg:C.light  },
  Suppression: { color:C.red,     bg:"#fee2e2" },
};

/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
export default function DataCollectorDashboard() {
  const navigate = useNavigate();
  const profil = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom = profil?.prenom || profil?.first_name || "";
  const nom    = profil?.nom    || profil?.last_name  || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || profil?.email || "Data Collector";
  const initiales  = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "DC";
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace: true });
  };

  const [activeTab, setActiveTab]         = useState("dashboard");
  const [clients, setClients]             = useState(INIT_CLIENTS);
  const [prospects, setProspects]         = useState(INIT_PROSPECTS);
  const [historique, setHistorique]       = useState(INIT_HISTORIQUE);

  // Filtres
  const [clientSearch, setClientSearch]   = useState("");
  const [clientType, setClientType]       = useState("Tous");
  const [clientStatut, setClientStatut]   = useState("Tous");
  const [prospectSearch, setProspectSearch]= useState("");
  const [prospectStatut, setProspectStatut]= useState("Tous");
  const [histSearch, setHistSearch]       = useState("");
  const [histType, setHistType]           = useState("Tous");

  // Modales
  const [showClientModal, setShowClientModal]     = useState(false);
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [editItem, setEditItem]                   = useState(null);

  // Import
  const [importStep, setImportStep]   = useState(0); // 0=idle, 1=preview, 2=mapping, 3=done
  const [importFile, setImportFile]   = useState(null);
  const [importData, setImportData]   = useState([]);
  const [importType, setImportType]   = useState("clients");
  const [importErrors, setImportErrors]= useState([]);
  const [dragOver, setDragOver]       = useState(false);
  const fileRef                       = useRef();

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "–";

  /* ── Filtres clients ── */
  const filteredClients = useMemo(() => clients.filter(c => {
    const q = clientSearch.toLowerCase();
    const matchQ = !q || c.nom.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q);
    const matchT = clientType === "Tous" || c.type === clientType;
    const matchS = clientStatut === "Tous" || c.statut === clientStatut;
    return matchQ && matchT && matchS;
  }), [clients, clientSearch, clientType, clientStatut]);

  /* ── Filtres prospects ── */
  const filteredProspects = useMemo(() => prospects.filter(p => {
    const q = prospectSearch.toLowerCase();
    const matchQ = !q || p.nom.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    const matchS = prospectStatut === "Tous" || p.statut === prospectStatut;
    return matchQ && matchS;
  }), [prospects, prospectSearch, prospectStatut]);

  /* ── Filtres historique ── */
  const filteredHisto = useMemo(() => historique.filter(h => {
    const q = histSearch.toLowerCase();
    const matchQ = !q || h.nom.toLowerCase().includes(q) || h.operateur.toLowerCase().includes(q);
    const matchT = histType === "Tous" || h.action === histType;
    return matchQ && matchT;
  }), [historique, histSearch, histType]);

  /* ── Stats dashboard ── */
  const stats = useMemo(() => ({
    clients: clients.length,
    prospects: prospects.length,
    completude: Math.round(clients.filter(c=>c.complet).length / (clients.length||1) * 100),
    saisieAujourdhui: historique.filter(h => h.date.startsWith("2025-12")).length,
    doublons: 1,
  }), [clients, prospects, historique]);

  /* ── CRUD Clients ── */
  const pushHistorique = (action, type, nom, champ="–", avant="–", apres="Mis à jour") => {
    setHistorique(prev => [{
      id: Math.max(...prev.map(h=>h.id),0)+1,
      action, type, nom, champ, avant, apres,
      date: new Date().toLocaleString("fr-FR").replace(",",""),
      operateur:"Saisie A."
    }, ...prev]);
  };

  const handleSaveClient = (c) => {
    if (c.id) {
      setClients(prev => prev.map(cl => cl.id===c.id ? c : cl));
      pushHistorique("Modification","Client",c.nom,"Données","–","Mis à jour");
      toast.success("Client modifié");
    } else {
      const newId = Math.max(...clients.map(cl=>cl.id),0)+1;
      const newC = { ...c, id:newId, complet: !!(c.nom&&c.email&&c.tel&&c.ville&&c.offre) };
      setClients(prev=>[newC,...prev]);
      pushHistorique("Création","Client",c.nom);
      toast.success("Client créé");
    }
    setShowClientModal(false); setEditItem(null);
  };

  const handleDeleteClient = (id) => {
    const c = clients.find(cl=>cl.id===id);
    setClients(prev=>prev.filter(cl=>cl.id!==id));
    if(c) pushHistorique("Suppression","Client",c.nom,"–","Dossier actif","Supprimé");
    toast.success("Client supprimé");
  };

  /* ── CRUD Prospects ── */
  const handleSaveProspect = (p) => {
    if (p.id) {
      setProspects(prev=>prev.map(pv=>pv.id===p.id?p:pv));
      pushHistorique("Modification","Prospect",p.nom,"Données","–","Mis à jour");
      toast.success("Prospect modifié");
    } else {
      const newId = Math.max(...prospects.map(pv=>pv.id),0)+1;
      setProspects(prev=>[{...p,id:newId},...prev]);
      pushHistorique("Création","Prospect",p.nom);
      toast.success("Prospect créé");
    }
    setShowProspectModal(false); setEditItem(null);
  };

  const handleDeleteProspect = (id) => {
    const p = prospects.find(pv=>pv.id===id);
    setProspects(prev=>prev.filter(pv=>pv.id!==id));
    if(p) pushHistorique("Suppression","Prospect",p.nom);
    toast.success("Prospect supprimé");
  };

  /* ── Import fichier ── */
  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(/[,;]/).map(h=>h.trim().replace(/"/g,""));
    return lines.slice(1).map((line,i) => {
      const vals = line.split(/[,;]/).map(v=>v.trim().replace(/"/g,""));
      const obj = { _row: i+2 };
      headers.forEach((h,j) => { obj[h] = vals[j] || ""; });
      return obj;
    }).filter(r => Object.values(r).some(v=>v&&v!==String(r._row)));
  };

  const handleFileDrop = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv","txt"].includes(ext)) { toast.error("Format accepté : CSV uniquement pour l'aperçu (xlsx sera simulé)"); }
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      if (parsed.length === 0) {
        // Simuler des données si le fichier est vide ou non-CSV
        const simulated = Array.from({length:6},(_,i)=>({
          _row:i+2, nom:`Prospect ${i+1}`, email:`prospect${i+1}@exemple.ci`,
          tel:`+225 0${i} 12 34 5${i}`, ville:"Abidjan", secteur:"Télécoms",
        }));
        setImportData(simulated);
      } else {
        setImportData(parsed.slice(0,50));
      }
      // Validation simulée
      const errs = [];
      if (parsed.length > 40) errs.push("Attention : plus de 40 lignes détectées, vérifiez le fichier.");
      setImportErrors(errs);
      setImportStep(1);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleFileChange = (e) => { if(e.target.files[0]) handleFileDrop(e.target.files[0]); };

  const handleConfirmImport = () => {
    const n = importData.length;
    if (importType === "clients") {
      const newClients = importData.map((row, i) => ({
        id: Math.max(...clients.map(c=>c.id),0)+i+1,
        type:"entreprise", nom:row.nom||row.Nom||row.NAME||`Importé ${i+1}`,
        contact:row.contact||row.Contact||"", email:row.email||row.Email||row.EMAIL||"",
        tel:row.tel||row.Tel||row.Téléphone||row.telephone||"",
        ville:row.ville||row.Ville||"Abidjan", secteur:row.secteur||row.Secteur||"",
        offre:"", niveau:"Non évalué", effectif:1, statut:"actif",
        dateCreation:new Date().toISOString().slice(0,10), complet:false,
      }));
      setClients(prev=>[...newClients,...prev]);
    } else {
      const newProspects = importData.map((row, i) => ({
        id: Math.max(...prospects.map(p=>p.id),0)+i+1,
        nom:row.nom||row.Nom||`Importé ${i+1}`,
        contact:row.contact||"", email:row.email||row.Email||"",
        tel:row.tel||"", ville:row.ville||"Abidjan", secteur:row.secteur||"",
        source:"Import fichier", interetOffre:"", statut:"nouveau",
        dateContact:new Date().toISOString().slice(0,10), notes:"",
      }));
      setProspects(prev=>[...newProspects,...prev]);
    }
    pushHistorique("Import","Import",importFile?.name||"fichier.csv","–","–",`${n} lignes importées`);
    toast.success(`${n} enregistrements importés avec succès`);
    setImportStep(3);
  };

  const resetImport = () => { setImportStep(0); setImportFile(null); setImportData([]); setImportErrors([]); };

  /* ── Export CSV ── */
  const exportCSV = (data, name) => {
    if (!data.length) return toast.error("Aucune donnée");
    const h = Object.keys(data[0]);
    const rows = [h.join(","), ...data.map(r=>h.map(k=>JSON.stringify(r[k]||"")).join(","))];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF"+rows.join("\n")],{type:"text/csv;charset=utf-8"}));
    a.download = `${name}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success(`Export ${name}.csv effectué`);
  };

  /* ── TABS ── */
  const TABS = [
    { key:"dashboard",  label:"Tableau de bord",    icon:"📊" },
    { key:"clients",    label:"Clients",             icon:"🏢", badge: clients.filter(c=>!c.complet).length },
    { key:"prospects",  label:"Prospects",           icon:"🎯", badge: prospects.filter(p=>p.statut==="à_relancer").length },
    { key:"import",     label:"Import fichiers",     icon:"📥" },
    { key:"qualite",    label:"Qualité des données", icon:"✅" },
    { key:"historique",    label:"Historique",     icon:"🕐" },
    { key:"notifications", label:"Notifications",  icon:"🔔" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f0f9ff", fontFamily:"system-ui, sans-serif" }}>
      <Toaster position="top-right" />

      {/* ── HERO ── */}
      <div style={{ background:C.gradient, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
        <div style={{ position:"absolute", bottom:-50, right:100, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }} />
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:18 }}>
            <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:20, border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
            <div>
              <div style={{ fontSize:10, color:"#7dd3fc", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase" }}>Espace saisie</div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{nomComplet}</h1>
              <div style={{ fontSize:12, color:"#bae6fd", marginTop:2 }}>{profil?.email || "Saisie · Import · Qualité des données"}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", transition:"background .2s" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
            <span>🚪</span> Déconnexion
          </button>
        </div>
        {/* Mini-stats hero */}
        <div style={{ display:"flex", background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden" }}>
          {[
            { l:"Clients enregistrés", v:clients.length,    c:"#38bdf8" },
            { l:"Prospects saisis",    v:prospects.length,  c:"#818cf8" },
            { l:"Complétude fiches",   v:`${stats.completude}%`, c:"#34d399" },
            { l:"Saisies ce mois",     v:stats.saisieAujourdhui, c:"#fbbf24" },
          ].map((s,i,arr)=>(
            <div key={s.l} style={{ flex:1, textAlign:"center", padding:"13px 8px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.08)":"none" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginBottom:2 }}>{s.l}</div>
              <div style={{ fontSize:19, fontWeight:800, color:s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div style={{ padding:"0 24px 40px" }}>
        <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>

          {/* TABS */}
          <div style={{ display:"flex", borderBottom:"2px solid #e5e7eb", overflowX:"auto", background:"#fafafa" }}>
            {TABS.map(tab=>(
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
                padding:"13px 18px", border:"none", borderBottom:activeTab===tab.key?`3px solid ${C.primary}`:"3px solid transparent",
                background:"transparent", cursor:"pointer", fontWeight:700, fontSize:12,
                color:activeTab===tab.key?C.primary:"#6b7280", whiteSpace:"nowrap",
                display:"flex", alignItems:"center", gap:6, transition:"color .15s",
              }}>
                <span style={{ fontSize:14 }}>{tab.icon}</span>{tab.label}
                {tab.badge > 0 && <span style={{ background:"#ef4444", color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"1px 6px", minWidth:18, textAlign:"center", lineHeight:"16px" }}>{tab.badge}</span>}
              </button>
            ))}
          </div>

          <div style={{ padding:24 }}>

            {/* ══════════════════════════════════════
                TAB : DASHBOARD
            ══════════════════════════════════════ */}
            {activeTab==="dashboard" && (
              <div>
                {/* Alerte fiches incomplètes */}
                {clients.filter(c=>!c.complet).length > 0 && (
                  <div onClick={()=>setActiveTab("clients")} style={{ background:"#fff7ed", border:"1px solid #fcd34d", borderRadius:10, padding:"10px 16px", marginBottom:20, fontSize:12, fontWeight:600, color:"#92400e", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span>⚠️ {clients.filter(c=>!c.complet).length} fiche(s) client incomplète(s) à compléter</span>
                    <span style={{ fontSize:11, opacity:.7 }}>Voir →</span>
                  </div>
                )}
                {prospects.filter(p=>p.statut==="à_relancer").length > 0 && (
                  <div onClick={()=>setActiveTab("prospects")} style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, padding:"10px 16px", marginBottom:20, fontSize:12, fontWeight:600, color:"#991b1b", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span>🔴 {prospects.filter(p=>p.statut==="à_relancer").length} prospect(s) à relancer — informations à mettre à jour</span>
                    <span style={{ fontSize:11, opacity:.7 }}>Voir →</span>
                  </div>
                )}

                {/* Stat cards */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
                  <StatCard label="Clients" value={clients.length} sub={`${clients.filter(c=>c.statut==="actif").length} actifs`} icon="🏢" color={C.primary} onClick={()=>setActiveTab("clients")} />
                  <StatCard label="Prospects" value={prospects.length} sub={`${prospects.filter(p=>p.statut==="nouveau").length} nouveaux`} icon="🎯" color="#6366f1" onClick={()=>setActiveTab("prospects")} />
                  <StatCard label="Fiches complètes" value={`${stats.completude}%`} sub={`${clients.filter(c=>c.complet).length}/${clients.length} clients`} icon="✅" color={stats.completude>=90?C.green:C.amber} />
                  <StatCard label="Imports réalisés" value={historique.filter(h=>h.action==="Import").length} sub="fichiers traités" icon="📥" color="#8b5cf6" onClick={()=>setActiveTab("import")} />
                </div>

                {/* Activité récente + Répartition */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                  {/* Activité */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>🕐 Activité récente</div>
                    {historique.slice(0,6).map(h=>{
                      const ac = actionColors[h.action]||{color:C.slate,bg:"#f1f5f9"};
                      return (
                        <div key={h.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid #e5e7eb" }}>
                          <Badge label={h.action} color={ac.color} bg={ac.bg} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{h.nom}</div>
                            <div style={{ fontSize:10, color:"#9ca3af" }}>{h.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Répartition par type */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>📊 Répartition des clients</div>
                    {[
                      { label:"Entreprise",   count:clients.filter(c=>c.type==="entreprise").length,  color:"#0891b2" },
                      { label:"Particulier",  count:clients.filter(c=>c.type==="particulier").length, color:"#6366f1" },
                      { label:"Étudiant",     count:clients.filter(c=>c.type==="étudiant").length,    color:"#22c55e" },
                    ].map(t=>(
                      <div key={t.label} style={{ marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                          <span style={{ fontWeight:600 }}>{t.label}</span>
                          <span style={{ fontWeight:800, color:t.color }}>{t.count}</span>
                        </div>
                        <div style={{ height:7, background:"#e5e7eb", borderRadius:7, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${(t.count/clients.length)*100}%`, background:t.color, borderRadius:7 }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop:20, fontSize:13, fontWeight:700, marginBottom:14 }}>🎯 Statuts prospects</div>
                    {Object.entries(statutProspectColors).map(([k,v])=>{
                      const count = prospects.filter(p=>p.statut===k).length;
                      if (!count) return null;
                      return (
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", fontSize:12 }}>
                          <Badge label={v.label} color={v.color} bg={v.bg} />
                          <span style={{ fontWeight:700 }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Raccourcis rapides */}
                <div style={{ background:"#f0f9ff", borderRadius:12, padding:18, border:`1px dashed ${C.primary}40` }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>⚡ Actions rapides</div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <button onClick={()=>{setEditItem(null);setShowClientModal(true);}} style={btnPrimary}>+ Nouveau client</button>
                    <button onClick={()=>{setEditItem(null);setShowProspectModal(true);}} style={btnSecondary}>+ Nouveau prospect</button>
                    <button onClick={()=>setActiveTab("import")} style={btnSecondary}>📥 Importer un fichier</button>
                    <button onClick={()=>setActiveTab("qualite")} style={btnSecondary}>✅ Vérifier la qualité</button>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════
                TAB : CLIENTS
            ══════════════════════════════════════ */}
            {activeTab==="clients" && (
              <div>
                {/* Barre outils */}
                <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
                  <input value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="🔍 Nom, email, contact..."
                    style={{ ...inputSt, width:230 }} />
                  <select value={clientType} onChange={e=>setClientType(e.target.value)} style={selectSt}>
                    <option value="Tous">Tous types</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="particulier">Particulier</option>
                    <option value="étudiant">Étudiant</option>
                  </select>
                  <select value={clientStatut} onChange={e=>setClientStatut(e.target.value)} style={selectSt}>
                    <option value="Tous">Tous statuts</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                  <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                    <button onClick={()=>exportCSV(filteredClients,"clients")} style={btnSecondary}>⬇ Exporter CSV</button>
                    <button onClick={()=>{setEditItem(null);setShowClientModal(true);}} style={btnPrimary}>+ Nouveau client</button>
                  </div>
                </div>

                {/* Tableau */}
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead><tr style={{ background:"#f9fafb" }}>
                      <th style={th}>Nom</th><th style={th}>Type</th><th style={th}>Contact / Email</th>
                      <th style={th}>Téléphone</th><th style={th}>Ville</th><th style={th}>Offre</th>
                      <th style={th}>Statut</th><th style={th}>Complétude</th><th style={th}>Ajouté le</th><th style={th}>Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredClients.map(c=>{
                        const st = statutClientColors[c.statut]||{};
                        return (
                          <tr key={c.id} style={{ borderTop:"1px solid #e5e7eb", background:c.complet?"#fff":"#fff9f0" }}>
                            <td style={td}><div style={{ fontWeight:700 }}>{c.nom}</div></td>
                            <td style={td}><Badge label={c.type} color={c.type==="entreprise"?C.primary:c.type==="étudiant"?"#15803d":"#6366f1"} bg={c.type==="entreprise"?C.light:c.type==="étudiant"?"#dcfce7":"#ede9fe"} /></td>
                            <td style={td}><div>{c.contact||"–"}</div><div style={{ fontSize:10, color:C.slate }}>{c.email}</div></td>
                            <td style={td}>{c.tel}</td>
                            <td style={td}>{c.ville}</td>
                            <td style={td}><div style={{ fontSize:11 }}>{c.offre||"–"}</div></td>
                            <td style={td}><Badge label={st.label||c.statut} color={st.color||C.slate} bg={st.bg||"#f1f5f9"} /></td>
                            <td style={td}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ width:40, height:5, background:"#e5e7eb", borderRadius:5, overflow:"hidden" }}>
                                  <div style={{ height:"100%", width:c.complet?"100%":"60%", background:c.complet?C.green:C.amber, borderRadius:5 }} />
                                </div>
                                <span style={{ fontSize:10, fontWeight:700, color:c.complet?C.green:C.amber }}>{c.complet?"100%":"~60%"}</span>
                              </div>
                            </td>
                            <td style={td}>{formatDate(c.dateCreation)}</td>
                            <td style={td}>
                              <button onClick={()=>{setEditItem(c);setShowClientModal(true);}} style={btnIconEdit}>✏️ Modifier</button>
                              <button onClick={()=>handleDeleteClient(c.id)} style={{ ...btnIconDelete, marginTop:4 }}>🗑️</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredClients.length===0 && <div style={{ textAlign:"center", padding:32, color:C.slate, fontSize:13 }}>Aucun client trouvé</div>}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════
                TAB : PROSPECTS
            ══════════════════════════════════════ */}
            {activeTab==="prospects" && (
              <div>
                <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
                  <input value={prospectSearch} onChange={e=>setProspectSearch(e.target.value)} placeholder="🔍 Nom, email..."
                    style={{ ...inputSt, width:230 }} />
                  <select value={prospectStatut} onChange={e=>setProspectStatut(e.target.value)} style={selectSt}>
                    <option value="Tous">Tous statuts</option>
                    {Object.entries(statutProspectColors).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                    <button onClick={()=>exportCSV(filteredProspects,"prospects")} style={btnSecondary}>⬇ Exporter CSV</button>
                    <button onClick={()=>{setEditItem(null);setShowProspectModal(true);}} style={btnPrimary}>+ Nouveau prospect</button>
                  </div>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead><tr style={{ background:"#f9fafb" }}>
                      <th style={th}>Nom</th><th style={th}>Contact / Email</th><th style={th}>Téléphone</th>
                      <th style={th}>Ville</th><th style={th}>Source</th><th style={th}>Intérêt</th>
                      <th style={th}>Statut</th><th style={th}>Date contact</th><th style={th}>Notes</th><th style={th}>Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredProspects.map(p=>{
                        const st = statutProspectColors[p.statut]||{};
                        return (
                          <tr key={p.id} style={{ borderTop:"1px solid #e5e7eb", background:p.statut==="à_relancer"?"#fff9f0":"#fff" }}>
                            <td style={td}><div style={{ fontWeight:700 }}>{p.nom}</div></td>
                            <td style={td}><div>{p.contact||"–"}</div><div style={{ fontSize:10, color:C.slate }}>{p.email}</div></td>
                            <td style={td}>{p.tel}</td>
                            <td style={td}>{p.ville}</td>
                            <td style={td}><span style={{ fontSize:11, color:C.slate }}>{p.source}</span></td>
                            <td style={td}><span style={{ fontSize:11 }}>{p.interetOffre||"–"}</span></td>
                            <td style={td}><Badge label={st.label||p.statut} color={st.color||C.slate} bg={st.bg||"#f1f5f9"} /></td>
                            <td style={td}>{formatDate(p.dateContact)}</td>
                            <td style={td}><span style={{ fontSize:11, color:C.slate, fontStyle:"italic" }}>{p.notes ? p.notes.slice(0,30)+(p.notes.length>30?"…":"") : "–"}</span></td>
                            <td style={td}>
                              <button onClick={()=>{setEditItem(p);setShowProspectModal(true);}} style={btnIconEdit}>✏️ Modifier</button>
                              <button onClick={()=>handleDeleteProspect(p.id)} style={{ ...btnIconDelete, marginTop:4 }}>🗑️</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredProspects.length===0 && <div style={{ textAlign:"center", padding:32, color:C.slate, fontSize:13 }}>Aucun prospect trouvé</div>}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════
                TAB : IMPORT FICHIERS
            ══════════════════════════════════════ */}
            {activeTab==="import" && (
              <div>
                {importStep===0 && (
                  <div>
                    {/* Type d'import */}
                    <div style={{ marginBottom:20 }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Type de données à importer</div>
                      <div style={{ display:"flex", gap:12 }}>
                        {[["clients","🏢 Clients"],["prospects","🎯 Prospects"]].map(([k,l])=>(
                          <button key={k} onClick={()=>setImportType(k)} style={{
                            padding:"12px 24px", borderRadius:10, border:`2px solid ${importType===k?C.primary:"#e5e7eb"}`,
                            background:importType===k?C.light:"#fff", color:importType===k?C.dark:"#374151",
                            cursor:"pointer", fontWeight:700, fontSize:13,
                          }}>{l}</button>
                        ))}
                      </div>
                    </div>

                    {/* Zone de dépôt */}
                    <div
                      onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                      onDragLeave={()=>setDragOver(false)}
                      onDrop={e=>{e.preventDefault();setDragOver(false);handleFileDrop(e.dataTransfer.files[0]);}}
                      onClick={()=>fileRef.current?.click()}
                      style={{
                        border:`2px dashed ${dragOver?C.primary:"#c7d2fe"}`,
                        borderRadius:16, padding:"50px 24px", textAlign:"center",
                        background:dragOver?"#e0f2fe":"#f8faff", cursor:"pointer",
                        transition:"all .2s", marginBottom:24,
                      }}>
                      <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" style={{ display:"none" }} onChange={handleFileChange} />
                      <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
                      <div style={{ fontSize:16, fontWeight:800, color:"#1e40af", marginBottom:6 }}>Glissez-déposez votre fichier ici</div>
                      <div style={{ fontSize:13, color:C.slate }}>ou cliquez pour sélectionner</div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:8 }}>Formats acceptés : CSV, Excel (XLSX), TXT · Max 5 MB</div>
                    </div>

                    {/* Modèles téléchargeables */}
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📋 Modèles de fichiers</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        {[
                          { label:"Modèle clients CSV",    cols:"nom, type, contact, email, tel, ville, secteur, offre", icon:"🏢" },
                          { label:"Modèle prospects CSV",  cols:"nom, contact, email, tel, ville, source, interetOffre, notes", icon:"🎯" },
                        ].map(m=>(
                          <div key={m.label} style={{ background:"#fff", borderRadius:10, padding:14, border:"1px solid #e5e7eb" }}>
                            <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{m.icon} {m.label}</div>
                            <div style={{ fontSize:10, color:C.slate, fontFamily:"monospace", background:"#f1f5f9", padding:"6px 8px", borderRadius:6, marginBottom:10 }}>{m.cols}</div>
                            <button onClick={()=>{
                              const blob = new Blob(["\uFEFF"+m.cols.split(", ").join(",")+"\nExemple,valeur1,contact@email.ci,+225 01 00 00 00,Abidjan,,"],{type:"text/csv;charset=utf-8"});
                              const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=m.label.replace(/ /g,"_")+".csv"; document.body.appendChild(a);a.click();document.body.removeChild(a);
                              toast.success("Modèle téléchargé");
                            }} style={btnSecondary}>⬇ Télécharger</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Historique imports */}
                    <div style={{ marginTop:20, background:"#f8fafc", borderRadius:12, padding:18 }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📜 Derniers imports</div>
                      {historique.filter(h=>h.action==="Import").map(h=>(
                        <div key={h.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid #e5e7eb", fontSize:12 }}>
                          <span style={{ fontSize:20 }}>📥</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700 }}>{h.nom}</div>
                            <div style={{ fontSize:10, color:C.slate }}>{h.apres} · {h.date}</div>
                          </div>
                          <Badge label="Import" color={C.primary} bg={C.light} />
                        </div>
                      ))}
                      {historique.filter(h=>h.action==="Import").length===0 && (
                        <div style={{ fontSize:12, color:C.slate, textAlign:"center", padding:16 }}>Aucun import effectué</div>
                      )}
                    </div>
                  </div>
                )}

                {importStep===1 && importData.length>0 && (
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                      <div style={{ fontSize:14, fontWeight:800 }}>Aperçu du fichier : <span style={{ color:C.primary }}>{importFile?.name}</span></div>
                      <Badge label={`${importData.length} lignes détectées`} color="#15803d" bg="#dcfce7" />
                      <Badge label={importType} color={C.primary} bg={C.light} />
                    </div>
                    {importErrors.length>0 && (
                      <div style={{ background:"#fef3c7", border:"1px solid #fcd34d", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#92400e" }}>
                        ⚠️ {importErrors.join(" ")}
                      </div>
                    )}
                    <div style={{ overflowX:"auto", maxHeight:300, overflowY:"auto", borderRadius:10, border:"1px solid #e5e7eb", marginBottom:20 }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                        <thead style={{ background:"#f9fafb", position:"sticky", top:0 }}>
                          <tr>{Object.keys(importData[0]||{}).filter(k=>k!=="⁠_row").map(h=><th key={h} style={{ ...th, fontSize:10 }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {importData.slice(0,20).map((row,i)=>(
                            <tr key={i} style={{ borderTop:"1px solid #e5e7eb" }}>
                              {Object.entries(row).filter(([k])=>k!=="⁠_row").map(([k,v])=>(
                                <td key={k} style={{ ...td, maxWidth:120, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{v||<span style={{ color:"#d1d5db" }}>–</span>}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importData.length>20 && <div style={{ fontSize:11, color:C.slate, marginBottom:12, textAlign:"center" }}>... et {importData.length-20} lignes supplémentaires</div>}
                    <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button onClick={resetImport} style={btnSecondary}>Annuler</button>
                      <button onClick={handleConfirmImport} style={btnPrimary}>✅ Confirmer l'import ({importData.length} lignes)</button>
                    </div>
                  </div>
                )}

                {importStep===3 && (
                  <div style={{ textAlign:"center", padding:"40px 20px" }}>
                    <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
                    <div style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:8 }}>Import réussi !</div>
                    <div style={{ fontSize:14, color:C.slate, marginBottom:24 }}>{importData.length} enregistrements ajoutés dans la liste {importType}</div>
                    <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
                      <button onClick={()=>{resetImport();setActiveTab(importType);}} style={btnPrimary}>Voir les {importType}</button>
                      <button onClick={()=>resetImport()} style={btnSecondary}>Nouvel import</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════
                TAB : QUALITÉ DES DONNÉES
            ══════════════════════════════════════ */}
            {activeTab==="qualite" && (
              <div>
                {/* Score global */}
                <div style={{ background:C.gradient, borderRadius:14, padding:"20px 24px", color:"#fff", marginBottom:24, display:"flex", alignItems:"center", gap:20 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:48, fontWeight:900, lineHeight:1 }}>{Math.round(QUALITE_FIELDS.reduce((s,f)=>s+f.taux,0)/QUALITE_FIELDS.length)}%</div>
                    <div style={{ fontSize:12, color:"#bae6fd" }}>Score qualité global</div>
                  </div>
                  <div style={{ flex:1, paddingLeft:20, borderLeft:"1px solid rgba(255,255,255,0.15)" }}>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Qualité des données clients</div>
                    <div style={{ fontSize:12, color:"#bae6fd" }}>Basé sur {clients.length} fiches · {QUALITE_FIELDS.filter(f=>f.taux===100).length} champs à 100% · {QUALITE_FIELDS.filter(f=>f.taux<80).length} champ(s) à améliorer</div>
                    <div style={{ marginTop:12, display:"flex", gap:16 }}>
                      {[
                        { label:"Excellent (100%)", count:QUALITE_FIELDS.filter(f=>f.taux===100).length, color:"#34d399" },
                        { label:"Bon (≥80%)",        count:QUALITE_FIELDS.filter(f=>f.taux>=80&&f.taux<100).length, color:"#fbbf24" },
                        { label:"À améliorer (<80%)",count:QUALITE_FIELDS.filter(f=>f.taux<80).length, color:"#f87171" },
                      ].map(s=>(
                        <div key={s.label}>
                          <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.count}</div>
                          <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                  {/* Complétude par champ */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>📊 Complétude par champ</div>
                    {QUALITE_FIELDS.map(f=>(
                      <div key={f.champ} style={{ marginBottom:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:600, marginBottom:5 }}>
                          <span>{f.champ}</span>
                          <span style={{ color:C.slate }}>{f.remplis}/{f.clients} fiches</span>
                        </div>
                        <QualityBar taux={f.taux} />
                      </div>
                    ))}
                  </div>

                  {/* Fiches incomplètes */}
                  <div>
                    <div style={{ background:"#fff9f0", borderRadius:12, padding:18, border:"1px solid #fcd34d", marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>⚠️ Fiches clients incomplètes</div>
                      {clients.filter(c=>!c.complet).map(c=>(
                        <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f3f4f6" }}>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700 }}>{c.nom}</div>
                            <div style={{ fontSize:10, color:C.slate }}>
                              {[!c.secteur&&"secteur manquant", !c.offre&&"offre manquante", !c.contact&&"contact manquant"].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          <button onClick={()=>{setEditItem(c);setShowClientModal(true);setActiveTab("clients");}} style={{ ...btnIconEdit, fontSize:11 }}>✏️ Compléter</button>
                        </div>
                      ))}
                      {clients.filter(c=>!c.complet).length===0 && (
                        <div style={{ fontSize:12, color:"#15803d", textAlign:"center", padding:12 }}>✅ Toutes les fiches sont complètes !</div>
                      )}
                    </div>

                    {/* Doublons potentiels */}
                    <div style={{ background:"#fef2f2", borderRadius:12, padding:18, border:"1px solid #fca5a5" }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>🔴 Doublons potentiels</div>
                      <div style={{ fontSize:12, color:"#991b1b", padding:"10px 12px", background:"rgba(239,68,68,0.07)", borderRadius:8, marginBottom:10 }}>
                        <div style={{ fontWeight:700 }}>Orange CI ↔ Orange Côte d'Ivoire</div>
                        <div style={{ fontSize:11, marginTop:4 }}>Même email de domaine détecté · Vérifier si doublon</div>
                      </div>
                      <button onClick={()=>toast.success("Analyse complète lancée (simulée)")} style={{ ...btnSecondary, fontSize:11, padding:"7px 12px" }}>🔍 Analyser tous les doublons</button>
                    </div>
                  </div>
                </div>

                {/* Recommandations */}
                <div style={{ background:"#f0f9ff", borderRadius:12, padding:18, marginTop:20, border:`1px dashed ${C.primary}50` }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>💡 Recommandations</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[
                      { icon:"📋", text:"Compléter le champ Secteur pour les fiches particuliers (4 fiches concernées)", priority:"medium" },
                      { icon:"🎯", text:"Évaluer le niveau CECRL pour Ibrahim Traoré", priority:"low" },
                      { icon:"🔄", text:"Fusionner les doublons Orange CI identifiés", priority:"high" },
                    ].map((r,i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10, fontSize:12 }}>
                        <span>{r.icon}</span>
                        <span style={{ flex:1 }}>{r.text}</span>
                        <Badge
                          label={r.priority==="high"?"Prioritaire":r.priority==="medium"?"Moyen":"Faible"}
                          color={r.priority==="high"?C.red:r.priority==="medium"?C.amber:"#6b7280"}
                          bg={r.priority==="high"?"#fee2e2":r.priority==="medium"?"#fef3c7":"#f3f4f6"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════
                TAB : HISTORIQUE
            ══════════════════════════════════════ */}
            {activeTab==="historique" && (
              <div>
                <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
                  <input value={histSearch} onChange={e=>setHistSearch(e.target.value)} placeholder="🔍 Nom, opérateur..."
                    style={{ ...inputSt, width:230 }} />
                  <select value={histType} onChange={e=>setHistType(e.target.value)} style={selectSt}>
                    <option value="Tous">Toutes actions</option>
                    {["Création","Modification","Import","Suppression"].map(a=><option key={a}>{a}</option>)}
                  </select>
                  <div style={{ marginLeft:"auto" }}>
                    <button onClick={()=>exportCSV(filteredHisto,"historique")} style={btnSecondary}>⬇ Exporter CSV</button>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ position:"relative", paddingLeft:28 }}>
                  <div style={{ position:"absolute", left:10, top:0, bottom:0, width:2, background:"#e5e7eb" }} />
                  {filteredHisto.map(h=>{
                    const ac = actionColors[h.action]||{color:C.slate,bg:"#f1f5f9"};
                    return (
                      <div key={h.id} style={{ position:"relative", marginBottom:16 }}>
                        <div style={{ position:"absolute", left:-22, top:6, width:16, height:16, borderRadius:"50%", background:ac.bg, border:`2px solid ${ac.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:ac.color }}>
                          {h.action==="Création"?"+"  :h.action==="Modification"?"~":h.action==="Import"?"↓":"×"}
                        </div>
                        <div style={{ background:"#fff", borderRadius:10, padding:"12px 16px", border:"1px solid #f1f5f9", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                            <Badge label={h.action} color={ac.color} bg={ac.bg} />
                            <Badge label={h.type} color="#374151" bg="#f3f4f6" />
                            <span style={{ fontSize:12, fontWeight:700 }}>{h.nom}</span>
                            <span style={{ fontSize:10, color:C.slate, marginLeft:"auto" }}>{h.date}</span>
                          </div>
                          {h.champ !== "–" && (
                            <div style={{ fontSize:11, color:C.slate }}>
                              <span style={{ fontWeight:600 }}>Champ :</span> {h.champ} &nbsp;·&nbsp;
                              <span style={{ textDecoration:"line-through", color:"#ef4444" }}>{h.avant}</span>
                              &nbsp;→&nbsp;
                              <span style={{ color:"#22c55e", fontWeight:700 }}>{h.apres}</span>
                            </div>
                          )}
                          {h.champ === "–" && <div style={{ fontSize:11, color:C.slate }}>{h.apres}</div>}
                          <div style={{ fontSize:10, color:"#9ca3af", marginTop:4 }}>Par : {h.operateur}</div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredHisto.length===0 && <div style={{ textAlign:"center", padding:32, color:C.slate, fontSize:13 }}>Aucune entrée dans l'historique</div>}
                </div>
              </div>
            )}
            {/* ══════ NOTIFICATIONS ══════ */}
            {activeTab==="notifications" && (
              <div style={{ padding:"24px 0" }}>
                <NotificationsTab userId={profil?.id} accentColor="#0891b2" />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══ MODAL CLIENT ══ */}
      {showClientModal && (
        <Modal title={editItem?"Modifier le client":"Nouveau client"} wide onClose={()=>{setShowClientModal(false);setEditItem(null);}}>
          <ClientForm initialData={editItem} onSave={handleSaveClient} onCancel={()=>{setShowClientModal(false);setEditItem(null);}} />
        </Modal>
      )}
      {/* ══ MODAL PROSPECT ══ */}
      {showProspectModal && (
        <Modal title={editItem?"Modifier le prospect":"Nouveau prospect"} wide onClose={()=>{setShowProspectModal(false);setEditItem(null);}}>
          <ProspectForm initialData={editItem} onSave={handleSaveProspect} onCancel={()=>{setShowProspectModal(false);setEditItem(null);}} />
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FORMULAIRES
═══════════════════════════════════════════════════════ */
const PAYS_F  = ["Côte d'Ivoire","Sénégal","Cameroun","Mali","France","Autre"];
const VILLES_F = ["Abidjan","Bouaké","Yamoussoukro","San-Pédro","Daloa","Man","Korhogo","Autre"];
const SECTEURS_F = ["Finance / Banque","Industrie","Commerce","Télécoms","Santé","Education","Énergie","Transport","Administration","Autre"];
const OFFRES_F = ["Anglais Pro B2","Business English","Certification TOEIC","Anglais Enfant","Formation Entreprise","Préparation IELTS"];
const NIVEAUX_F = ["A1 – Débutant","A2 – Élémentaire","B1 – Intermédiaire","B2 – Intermédiaire avancé","C1 – Avancé","C2 – Maîtrise","Non évalué"];

const FRow = ({ children }) => <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>{children}</div>;
const FField = ({ label, children }) => (
  <div>
    <label style={labelSt}>{label}</label>
    {children}
  </div>
);

const ClientForm = ({ initialData, onSave, onCancel }) => {
  const [f, setF] = useState(initialData || {
    type:"entreprise", nom:"", contact:"", email:"", tel:"", ville:"Abidjan",
    secteur:"", offre:"", niveau:"Non évalué", effectif:1, statut:"actif",
    dateCreation:new Date().toISOString().slice(0,10), complet:false
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div>
      <FRow>
        <FField label="Type *">
          <select style={inputSt} value={f.type} onChange={e=>set("type",e.target.value)}>
            <option value="entreprise">Entreprise</option>
            <option value="particulier">Particulier</option>
            <option value="étudiant">Étudiant</option>
          </select>
        </FField>
        <FField label="Statut">
          <select style={inputSt} value={f.statut} onChange={e=>set("statut",e.target.value)}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </FField>
      </FRow>
      <FRow>
        <FField label="Nom / Raison sociale *"><input style={inputSt} value={f.nom} onChange={e=>set("nom",e.target.value)} required /></FField>
        <FField label="Nom du contact"><input style={inputSt} value={f.contact} onChange={e=>set("contact",e.target.value)} /></FField>
      </FRow>
      <FRow>
        <FField label="Email *"><input type="email" style={inputSt} value={f.email} onChange={e=>set("email",e.target.value)} required /></FField>
        <FField label="Téléphone *"><input style={inputSt} value={f.tel} onChange={e=>set("tel",e.target.value)} placeholder="+225 07 00 00 00" /></FField>
      </FRow>
      <FRow>
        <FField label="Ville">
          <select style={inputSt} value={f.ville} onChange={e=>set("ville",e.target.value)}>
            {VILLES_F.map(v=><option key={v}>{v}</option>)}
          </select>
        </FField>
        <FField label="Secteur d'activité">
          <select style={inputSt} value={f.secteur} onChange={e=>set("secteur",e.target.value)}>
            <option value="">– Choisir –</option>
            {SECTEURS_F.map(s=><option key={s}>{s}</option>)}
          </select>
        </FField>
      </FRow>
      <FRow>
        <FField label="Offre souhaitée">
          <select style={inputSt} value={f.offre} onChange={e=>set("offre",e.target.value)}>
            <option value="">– Choisir –</option>
            {OFFRES_F.map(o=><option key={o}>{o}</option>)}
          </select>
        </FField>
        <FField label="Niveau CECRL">
          <select style={inputSt} value={f.niveau} onChange={e=>set("niveau",e.target.value)}>
            {NIVEAUX_F.map(n=><option key={n}>{n}</option>)}
          </select>
        </FField>
      </FRow>
      <FRow>
        <FField label="Effectif / Nb personnes">
          <input type="number" min={1} style={inputSt} value={f.effectif} onChange={e=>set("effectif",Number(e.target.value))} />
        </FField>
        <FField label="Date de création">
          <input type="date" style={inputSt} value={f.dateCreation} onChange={e=>set("dateCreation",e.target.value)} />
        </FField>
      </FRow>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <button onClick={onCancel} style={btnSecondary}>Annuler</button>
        <button onClick={()=>onSave({...f, complet:!!(f.nom&&f.email&&f.tel&&f.ville&&f.offre&&f.secteur)})} style={btnPrimary}>Enregistrer</button>
      </div>
    </div>
  );
};

const ProspectForm = ({ initialData, onSave, onCancel }) => {
  const [f, setF] = useState(initialData || {
    nom:"", contact:"", email:"", tel:"", ville:"Abidjan", secteur:"",
    source:"Site web", interetOffre:"", statut:"nouveau",
    dateContact:new Date().toISOString().slice(0,10), notes:""
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div>
      <FRow>
        <FField label="Nom / Société *"><input style={inputSt} value={f.nom} onChange={e=>set("nom",e.target.value)} required /></FField>
        <FField label="Nom du contact"><input style={inputSt} value={f.contact} onChange={e=>set("contact",e.target.value)} /></FField>
      </FRow>
      <FRow>
        <FField label="Email"><input type="email" style={inputSt} value={f.email} onChange={e=>set("email",e.target.value)} /></FField>
        <FField label="Téléphone"><input style={inputSt} value={f.tel} onChange={e=>set("tel",e.target.value)} placeholder="+225 07 00 00 00" /></FField>
      </FRow>
      <FRow>
        <FField label="Ville">
          <select style={inputSt} value={f.ville} onChange={e=>set("ville",e.target.value)}>
            {VILLES_F.map(v=><option key={v}>{v}</option>)}
          </select>
        </FField>
        <FField label="Secteur d'activité">
          <select style={inputSt} value={f.secteur} onChange={e=>set("secteur",e.target.value)}>
            <option value="">– Choisir –</option>
            {SECTEURS_F.map(s=><option key={s}>{s}</option>)}
          </select>
        </FField>
      </FRow>
      <FRow>
        <FField label="Source">
          <select style={inputSt} value={f.source} onChange={e=>set("source",e.target.value)}>
            {["Site web","Recommandation","Salon","Emailing","Test de niveau","Import fichier","Autre"].map(s=><option key={s}>{s}</option>)}
          </select>
        </FField>
        <FField label="Offre d'intérêt">
          <select style={inputSt} value={f.interetOffre} onChange={e=>set("interetOffre",e.target.value)}>
            <option value="">– Choisir –</option>
            {OFFRES_F.map(o=><option key={o}>{o}</option>)}
          </select>
        </FField>
      </FRow>
      <FRow>
        <FField label="Statut">
          <select style={inputSt} value={f.statut} onChange={e=>set("statut",e.target.value)}>
            <option value="nouveau">Nouveau</option>
            <option value="contacté">Contacté</option>
            <option value="relancé">Relancé</option>
            <option value="à_relancer">À relancer</option>
            <option value="converti">Converti</option>
          </select>
        </FField>
        <FField label="Date de contact">
          <input type="date" style={inputSt} value={f.dateContact} onChange={e=>set("dateContact",e.target.value)} />
        </FField>
      </FRow>
      <div style={{ marginBottom:14 }}>
        <label style={labelSt}>Notes</label>
        <textarea style={{ ...inputSt, height:70, resize:"vertical" }} value={f.notes} onChange={e=>set("notes",e.target.value)} placeholder="Observations, contexte, besoins particuliers..." />
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={btnSecondary}>Annuler</button>
        <button onClick={()=>onSave(f)} style={btnPrimary}>Enregistrer</button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════ */
const CC = "#0891b2";
const CL = "#e0f2fe";
const CD = "#0e7490";
const btnPrimary    = { padding:"9px 18px", background:CC, color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 };
const btnSecondary  = { padding:"9px 18px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 };
const btnIconEdit   = { display:"block", padding:"5px 10px", background:CL, color:CD, border:`1px solid ${CC}40`, borderRadius:5, cursor:"pointer", fontSize:11, fontWeight:700 };
const btnIconDelete = { display:"block", padding:"5px 8px", background:"#fee2e2", color:"#b91c1c", border:"1px solid #ef444440", borderRadius:5, cursor:"pointer", fontSize:11, fontWeight:700 };
const labelSt  = { display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:4 };
const inputSt  = { padding:"9px 10px", borderRadius:7, border:"1px solid #d1d5db", fontSize:13, width:"100%", boxSizing:"border-box" };
const selectSt = { padding:"7px 12px", borderRadius:7, border:"1px solid #e5e7eb", fontSize:12 };
const th = { padding:"9px 10px", textAlign:"left", fontWeight:700, fontSize:11, color:"#374151", borderBottom:"2px solid #e5e7eb" };
const td = { padding:"9px 10px", verticalAlign:"middle" };