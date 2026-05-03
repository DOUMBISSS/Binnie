// src/Pages/DRH Entreprise/RHDashboard.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

/* ═══════════════════════════════════════════════════════
   CONSTANTES (chartre BET — identique à EspaceApprenant)
═══════════════════════════════════════════════════════ */
const PRIMARY_COLOR    = "#dc2626";
const PRIMARY_DARK     = "#1e3a8a";
const PRIMARY_LIGHT    = "#fef2f2";
const GRADIENT_HEADER  = "linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%)";

/* ═══════════════════════════════════════════════════════
   COULEURS & BADGES (définitions manquantes)
═══════════════════════════════════════════════════════ */
const STATUT_COLORS = {
  actif:     { bg: "#dcfce7", c: "#166534", label: "Actif" },
  inactif:   { bg: "#fee2e2", c: "#991b1b", label: "Inactif" },
  suspendu:  { bg: "#fef3c7", c: "#92400e", label: "Suspendu" },
  conge:     { bg: "#dbeafe", c: "#1e40af", label: "En congé" },
};

const NIVEAU_META = {
  A1: { label:"Débutant", color:"#6b7280", bg:"#f3f4f6" },
  A2: { label:"Élémentaire", color:"#d97706", bg:"#fef3c7" },
  B1: { label:"Intermédiaire", color:"#2563eb", bg:"#dbeafe" },
  B2: { label:"Interm. supérieur", color:"#7c3aed", bg:"#ede9fe" },
  C1: { label:"Avancé", color:"#059669", bg:"#dcfce7" },
  C2: { label:"Maîtrise", color:"#dc2626", bg:"#fee2e2" },
};

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

const ProgressBar = ({ value, color = PRIMARY_COLOR, height = 7 }) => (
  <div style={{ height, background:"#e5e7eb", borderRadius:height, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.min(100, value)}%`, background:color, borderRadius:height, transition:"width .4s" }} />
  </div>
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

const NiveauBadge = ({ niveau }) => {
  const m = NIVEAU_META[niveau] || NIVEAU_META.A1;
  return <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:800, background:m.bg, color:m.color }}>{niveau} — {m.label}</span>;
};

const StatutBadge = ({ statut }) => {
  const m = STATUT_COLORS[statut] || STATUT_COLORS.actif;
  return <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:m.bg, color:m.c }}>{m.label}</span>;
};

const AssiduiteBar = ({ rate }) => {
  const color = rate >= 90 ? "#22c55e" : rate >= 75 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${rate}%`, background:color, borderRadius:3 }} />
      </div>
      <span style={{ fontSize:12, fontWeight:700, color, minWidth:34 }}>{rate}%</span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK (entreprises & employés)
═══════════════════════════════════════════════════════ */
const ENTREPRISES = [
  { id:1, nom:"Orange CI", secteur:"Télécoms",    logo:"📱", employes:24, actifs:22 },
  { id:2, nom:"BNP Paribas CI", secteur:"Finance", logo:"🏦", employes:18, actifs:17 },
  { id:3, nom:"Nestlé CI",  secteur:"Agroalim.",  logo:"🏭", employes:12, actifs:12 },
];

const EMPLOYES_INIT = [
  { id:1,  nom:"Kouamé Aya",       prenom:"Aya",       email:"k.aya@orange.ci",       phone:"+225 07 11 22 33", entrepriseId:1, departement:"Marketing",   poste:"Chef de projet",   niveau:"B2", progression:78, assiduiteRate:94, cours:["Anglais Pro","Business English"], statut:"actif",    dateInscription:"2025-01-15", dernierCours:"2025-12-05", testScore:75, absences:2,  retards:1 },
  { id:2,  nom:"Diallo Ibrahima",  prenom:"Ibrahima",  email:"d.ibra@orange.ci",       phone:"+225 05 22 44 66", entrepriseId:1, departement:"Commercial",  poste:"Directeur Ventes", niveau:"C1", progression:88, assiduiteRate:98, cours:["English C1","Negociation EN"], statut:"actif",    dateInscription:"2025-02-01", dernierCours:"2025-12-08", testScore:88, absences:0,  retards:0 },
  { id:3,  nom:"N'Guessan Fatou",  prenom:"Fatou",     email:"ng.fatou@orange.ci",     phone:"+225 01 33 55 77", entrepriseId:1, departement:"RH",          poste:"DRH Adjointe",     niveau:"B1", progression:52, assiduiteRate:85, cours:["Anglais Intermédiaire"],       statut:"conge",    dateInscription:"2025-03-10", dernierCours:"2025-11-20", testScore:56, absences:5,  retards:3 },
  { id:4,  nom:"Touré Mamadou",    prenom:"Mamadou",   email:"toure.m@bnp.ci",         phone:"+225 07 44 88 22", entrepriseId:2, departement:"Finance",     poste:"Analyste Senior",  niveau:"C1", progression:91, assiduiteRate:97, cours:["Finance English","TOEIC Prep"], statut:"actif",    dateInscription:"2025-01-20", dernierCours:"2025-12-09", testScore:88, absences:1,  retards:0 },
  { id:5,  nom:"Bamba Aïcha",      prenom:"Aïcha",     email:"a.bamba@bnp.ci",         phone:"+225 05 66 99 11", entrepriseId:2, departement:"Compliance",  poste:"Juriste",          niveau:"A2", progression:34, assiduiteRate:72, cours:["Anglais Débutant"],            statut:"actif",    dateInscription:"2025-04-05", dernierCours:"2025-11-15", testScore:38, absences:8,  retards:6 },
  { id:6,  nom:"Coulibaly Jean",   prenom:"Jean",      email:"j.coulibaly@bnp.ci",     phone:"+225 01 77 33 99", entrepriseId:2, departement:"IT",          poste:"Dev Backend",      niveau:"B1", progression:63, assiduiteRate:90, cours:["Tech English","IELTS Prep"],    statut:"actif",    dateInscription:"2025-02-14", dernierCours:"2025-12-06", testScore:56, absences:3,  retards:2 },
  { id:7,  nom:"Yao Stéphanie",    prenom:"Stéphanie", email:"s.yao@nestle.ci",        phone:"+225 07 22 11 44", entrepriseId:3, departement:"Qualité",     poste:"Responsable QA",   niveau:"B2", progression:72, assiduiteRate:93, cours:["Business English","Rédaction"], statut:"actif",    dateInscription:"2025-01-08", dernierCours:"2025-12-07", testScore:71, absences:2,  retards:1 },
  { id:8,  nom:"Koné Aboubakar",   prenom:"Aboubakar", email:"ab.kone@nestle.ci",      phone:"+225 05 55 77 88", entrepriseId:3, departement:"Supply Chain",poste:"Responsable SC",   niveau:"C1", progression:85, assiduiteRate:96, cours:["Logistics EN","C1 Advanced"],   statut:"actif",    dateInscription:"2025-03-22", dernierCours:"2025-12-08", testScore:82, absences:1,  retards:0 },
  { id:9,  nom:"Traoré Mariam",    prenom:"Mariam",    email:"m.traore@orange.ci",     phone:"+225 01 44 66 22", entrepriseId:1, departement:"Communication",poste:"Chargée Comm.",   niveau:"A2", progression:41, assiduiteRate:78, cours:["Anglais A2→B1"],               statut:"suspendu", dateInscription:"2025-05-01", dernierCours:"2025-10-30", testScore:40, absences:9,  retards:4 },
  { id:10, nom:"Sawadogo Eric",    prenom:"Eric",      email:"e.sawadogo@bnp.ci",      phone:"+225 07 88 22 55", entrepriseId:2, departement:"Audit",       poste:"Auditeur",         niveau:"B2", progression:69, assiduiteRate:88, cours:["Audit English","TOEIC"],        statut:"actif",    dateInscription:"2025-02-28", dernierCours:"2025-12-04", testScore:68, absences:4,  retards:2 },
  { id:11, nom:"Ouattara Safi",    prenom:"Safi",      email:"safi.o@nestle.ci",       phone:"+225 05 33 11 77", entrepriseId:3, departement:"Marketing",   poste:"Brand Manager",    niveau:"B1", progression:58, assiduiteRate:87, cours:["Marketing EN"],                statut:"actif",    dateInscription:"2025-04-10", dernierCours:"2025-12-03", testScore:58, absences:3,  retards:2 },
  { id:12, nom:"Loba Paterne",     prenom:"Paterne",   email:"p.loba@bnp.ci",          phone:"+225 01 99 44 33", entrepriseId:2, departement:"Direction",   poste:"Directeur Général",niveau:"C2", progression:97, assiduiteRate:99, cours:["Executive English"],            statut:"actif",    dateInscription:"2025-01-03", dernierCours:"2025-12-09", testScore:95, absences:0,  retards:0 },
];

const NIVEAUX = ["A1","A2","B1","B2","C1","C2"];
const DEPARTEMENTS = [...new Set(EMPLOYES_INIT.map(e => e.departement))];
const STATUTS = ["actif","inactif","suspendu","conge"];
const OFFRE_LIST = ["Anglais Pro B2", "Business English", "Certification TOEIC", "Anglais Adulte", "Formation Entreprise"];
const PROFIL_LIST = ["Particulier", "Entreprise", "Étudiant"];

const SESSIONS_INIT = [
  { id:1, titre:"Anglais Pro B2 — Module 3",         date:"2025-12-15", heure:"09:00", duree:"2h",    formateur:"Prof. Koné",   salle:"Salle A",      type:"presentiel", inscrits:12, presents:null, statut:"planifie"  },
  { id:2, titre:"Business English — Négociation",     date:"2025-12-14", heure:"14:00", duree:"1h30",  formateur:"Prof. Diallo", salle:"Online Zoom",  type:"online",     inscrits:8,  presents:null, statut:"planifie"  },
  { id:3, titre:"TOEIC Prep — Listening",             date:"2025-12-12", heure:"10:00", duree:"2h",    formateur:"Prof. Koné",   salle:"Salle B",      type:"presentiel", inscrits:15, presents:13,   statut:"terminee"  },
  { id:4, titre:"Anglais Intermédiaire B1 — Gram.",   date:"2025-12-11", heure:"16:00", duree:"1h",    formateur:"Prof. Yao",    salle:"Online Teams", type:"online",     inscrits:10, presents:9,    statut:"terminee"  },
  { id:5, titre:"C1 Advanced — Expression écrite",    date:"2025-12-10", heure:"09:00", duree:"2h",    formateur:"Prof. Koné",   salle:"Salle A",      type:"presentiel", inscrits:6,  presents:6,    statut:"terminee"  },
];

const ALERTES_INIT = [
  { id:1, employe:"Bamba Aïcha",     type:"assiduite",  msg:"Assiduité critique : 72% — 8 absences ce mois",              date:"2025-12-10", lu:false, priorite:"haute",   entreprise:"BNP Paribas CI" },
  { id:2, employe:"Traoré Mariam",   type:"assiduite",  msg:"Suspendue — 9 absences et 4 retards depuis oct.",             date:"2025-12-09", lu:false, priorite:"haute",   entreprise:"Orange CI"      },
  { id:3, employe:"N'Guessan Fatou", type:"progression",msg:"Progression stagnante : 52% depuis 3 semaines",              date:"2025-12-08", lu:true,  priorite:"moyenne", entreprise:"Orange CI"      },
  { id:4, employe:"Coulibaly Jean",  type:"test",       msg:"Score test en baisse : 56% — objectif B2 à risque",          date:"2025-12-07", lu:true,  priorite:"moyenne", entreprise:"BNP Paribas CI" },
  { id:5, employe:"Sawadogo Eric",   type:"assiduite",  msg:"4 absences ce mois — seuil d'alerte atteint",                date:"2025-12-05", lu:true,  priorite:"basse",   entreprise:"BNP Paribas CI" },
];

/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
export default function RHEnterpriseDashboard() {
  const navigate = useNavigate();
  const profil = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom = profil?.prenom || profil?.first_name || "";
  const nom    = profil?.nom    || profil?.last_name  || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || profil?.email || "Responsable RH";
  const initiales  = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "RH";
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace: true });
  };

  const [activeTab, setActiveTab] = useState("tableau");
  const [employes, setEmployes] = useState(EMPLOYES_INIT);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  
  // Filtres pour les exports et les onglets
  const [periode, setPeriode] = useState("mois");
  const [filtreOffre, setFiltreOffre] = useState("Toutes");
  const [filtreProfil, setFiltreProfil] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEntreprise, setFilterEnt] = useState("Tous");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [filterNiveau, setFilterNiveau] = useState("Tous");
  const [sortField, setSortField] = useState("nom");
  const [sortDir, setSortDir] = useState("asc");
  
  // Planification d'envoi
  const [showPlanifModal, setShowPlanifModal] = useState(false);
  const [planifConfig, setPlanifConfig] = useState({ frequence: "hebdomadaire", emails: "", format: "pdf" });

  // États pour les alertes et sessions (conservés)
  const [sessions, setSessions] = useState(SESSIONS_INIT);
  const [alertes, setAlertes] = useState(ALERTES_INIT);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" }) : "—";
  const formatMoney = (val) => val.toLocaleString("fr-FR") + " €";

  // Stats globales
  const stats = useMemo(() => {
    const total = employes.length;
    const actifs = employes.filter(e => e.statut === "actif").length;
    const avgProg = total ? Math.round(employes.reduce((s,e)=>s+e.progression,0)/total) : 0;
    const avgAssid = total ? Math.round(employes.reduce((s,e)=>s+e.assiduiteRate,0)/total) : 0;
    const enDanger = employes.filter(e => e.assiduiteRate < 80 || e.progression < 40).length;
    const certifs = employes.filter(e => e.certifications && e.certifications.length > 0).length;
    return { total, actifs, avgProg, avgAssid, enDanger, certifs };
  }, [employes]);

  // Filtrage par période (simulé – filtre sur dateInscription)
  const filterByPeriode = (data, dateField) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return data.filter(item => {
      const d = new Date(item[dateField]);
      if (periode === "semaine") {
        const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
        return d >= oneWeekAgo;
      } else if (periode === "mois") {
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      } else if (periode === "trimestre") {
        const quarter = Math.floor(currentMonth / 3);
        const itemQuarter = Math.floor(d.getMonth() / 3);
        return itemQuarter === quarter && d.getFullYear() === currentYear;
      } else if (periode === "annee") {
        return d.getFullYear() === currentYear;
      }
      return true;
    });
  };

  // Employés filtrés (pour les ongles employes, assiduite, progression, exports)
  const empFiltered = useMemo(() => {
    let r = [...employes];
    if (filterEntreprise !== "Tous") {
      const ent = ENTREPRISES.find(e => e.nom === filterEntreprise);
      if (ent) r = r.filter(e => e.entrepriseId === ent.id);
    }
    if (filterStatut !== "Tous") r = r.filter(e => e.statut === filterStatut);
    if (filterNiveau !== "Tous") r = r.filter(e => e.niveau === filterNiveau);
    if (searchTerm) r = r.filter(e => e.nom.toLowerCase().includes(searchTerm.toLowerCase()) || e.email.toLowerCase().includes(searchTerm.toLowerCase()) || e.departement.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filtreOffre !== "Toutes") r = r.filter(e => e.cours.some(c => c === filtreOffre));
    // Appliquer le filtre période sur dateInscription
    r = filterByPeriode(r, "dateInscription");
    r.sort((a,b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === "string") {
        va = va.toLowerCase();
        vb = vb.toLowerCase();
      }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return r;
  }, [employes, filterEntreprise, filterStatut, filterNiveau, searchTerm, filtreOffre, periode, sortField, sortDir]);

  // CRUD
  const handleSaveEmploye = (emp) => {
    if (emp.id) {
      setEmployes(employes.map(e => e.id === emp.id ? emp : e));
      toast.success("Employé modifié");
    } else {
      const newId = Math.max(...employes.map(e => e.id), 0) + 1;
      setEmployes([...employes, { ...emp, id: newId }]);
      toast.success("Employé ajouté");
    }
    setShowEmpModal(false);
    setEditingEmp(null);
  };

  const handleDeleteEmploye = (id) => {
    setEmployes(employes.filter(e => e.id !== id));
    toast.success("Employé supprimé");
  };

  // Fonctions d'export
  const exportExcel = (data, filename) => {
    if (!data.length) { toast.error("Aucune donnée à exporter"); return; }
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(","));
    for (const row of data) {
      const values = headers.map(header => JSON.stringify(row[header] || ""));
      csvRows.push(values.join(","));
    }
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Export ${filename} en CSV (Excel) effectué`);
  };

  const exportPDF = (data, title) => {
    if (!data.length) { toast.error("Aucune donnée à exporter"); return; }
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>${title}</title>
      <style>body{font-family:sans-serif; padding:20px;} table{border-collapse:collapse; width:100%} th,td{border:1px solid #ccc; padding:8px; text-align:left}</style>
      </head><body><h1>${title}</h1><table><thead><tr>${Object.keys(data[0]).map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>
      ${data.map(row=>`<tr>${Object.values(row).map(v=>`<td>${v}</td>`).join("")}<tr>`).join("")}
      </tbody></table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
    toast.success(`Export PDF de ${title} lancé`);
  };

  const handlePlanifierEnvoi = () => {
    toast.success(`Planification enregistrée : envoi ${planifConfig.frequence} au format ${planifConfig.format} vers ${planifConfig.emails}`);
    setShowPlanifModal(false);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d==="asc"?"desc":"asc");
    else { setSortField(field); setSortDir("asc"); }
  };
  const SortIcon = ({ field }) => (
    <span style={{ fontSize:10, color:"#9ca3af" }}>
      {sortField===field ? (sortDir==="asc" ? " ↑" : " ↓") : " ↕"}
    </span>
  );

  const tabs = [
    { key:"tableau",     label:"Tableau de bord",  icon:"📊", count:null },
    { key:"employes",    label:"Employés",          icon:"👥", count:employes.length },
    { key:"assiduite",   label:"Assiduité",         icon:"📅", count:null },
    { key:"progression", label:"Progression",       icon:"📈", count:null },
    { key:"sessions",    label:"Sessions",          icon:"🎓", count:sessions.length },
    { key:"alertes",     label:"Alertes",           icon:"🔔", count:alertes.length },
    { key:"entreprises", label:"Entreprises",       icon:"🏢", count:ENTREPRISES.length },
    { key:"exports",     label:"Exports & envois",  icon:"📧", count:null },
  ];

  return (
    <div style={{ minHeight:"100vh", background:PRIMARY_LIGHT }}>
      <div style={{ padding:0, overflowX:"hidden" }}>
        <Toaster position="top-right" />

        {/* HERO HEADER (identique EspaceApprenant) */}
        <div style={{ background:GRADIENT_HEADER, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
          <div style={{ position:"absolute", bottom:-60, right:80, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }} />
          <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
              <div>
                <div style={{ fontSize:11, color:"#fecaca", fontWeight:600, letterSpacing:"0.08em" }}>Bonjour 👋</div>
                <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{nomComplet}</h1>
                <div style={{ fontSize:12, color:"#fecaca", marginTop:3 }}>{profil?.email || "Effectifs · Progression · Résultats individuels et collectifs"}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", transition:"background .2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
              <span>🚪</span> Déconnexion
            </button>
          </div>
          <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden" }}>
            {[
              { l:"Employés inscrits", v:stats.total, c:"#f87171" },
              { l:"Progression moyenne", v:`${stats.avgProg}%`, c:"#fca5a5" },
              { l:"Assiduité moyenne", v:`${stats.avgAssid}%`, c:"#fecaca" },
              { l:"À surveiller", v:stats.enDanger, c:"#fbbf24" },
            ].map((s, i, arr) => (
              <div key={s.l} style={{ flex:1, textAlign:"center", padding:"14px 8px", borderRight: i < arr.length-1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>{s.l}</div>
                <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"0 24px 24px" }}>
          {/* Tabs principaux */}
          <div style={{ display:"flex", gap:3, marginBottom:0, flexWrap:"wrap", paddingTop:20 }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  padding:"10px 16px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer",
                  fontWeight:600, fontSize:13,
                  background: isActive ? "#fff" : PRIMARY_LIGHT,
                  color: isActive ? PRIMARY_COLOR : PRIMARY_DARK,
                  boxShadow: isActive ? `0 -2px 8px ${PRIMARY_COLOR}25` : "none",
                  display:"flex", alignItems:"center", gap:6,
                }}>
                  <span style={{ fontSize:14 }}>{tab.icon}</span>
                  {tab.label}
                  {tab.count !== null && tab.count !== undefined && (
                    <span style={{ padding:"1px 7px", borderRadius:10, fontSize:11, fontWeight:700,
                      background: tab.danger ? "#fee2e2" : isActive ? PRIMARY_LIGHT : "#fecaca",
                      color: tab.danger ? "#dc2626" : isActive ? PRIMARY_COLOR : PRIMARY_DARK }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Barre de filtres commune (visible sur les onglets employes, assiduite, progression, exports) */}
          {(activeTab === "employes" || activeTab === "assiduite" || activeTab === "progression" || activeTab === "exports") && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20, marginTop:12, alignItems:"center" }}>
              <input type="text" placeholder="🔍 Nom, email, département…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                style={{ ...inputSt, marginBottom:0, width:230 }} />
              <select value={filterEntreprise} onChange={e=>setFilterEnt(e.target.value)} style={{ ...inputSt, marginBottom:0, width:"auto" }}>
                <option value="Tous">Toutes les entreprises</option>
                {ENTREPRISES.map(e => <option key={e.id}>{e.nom}</option>)}
              </select>
              <select value={filterStatut} onChange={e=>setFilterStatut(e.target.value)} style={{ ...inputSt, marginBottom:0, width:"auto" }}>
                <option value="Tous">Tous statuts</option>
                {Object.entries(STATUT_COLORS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={filterNiveau} onChange={e=>setFilterNiveau(e.target.value)} style={{ ...inputSt, marginBottom:0, width:"auto" }}>
                <option value="Tous">Tous niveaux</option>
                {NIVEAUX.map(l => <option key={l}>{l}</option>)}
              </select>
              <select value={periode} onChange={e=>setPeriode(e.target.value)} style={{ ...inputSt, marginBottom:0, width:"auto" }}>
                <option value="semaine">Semaine</option><option value="mois">Mois</option><option value="trimestre">Trimestre</option><option value="annee">Année</option>
              </select>
              <select value={filtreOffre} onChange={e=>setFiltreOffre(e.target.value)} style={{ ...inputSt, marginBottom:0, width:"auto" }}>
                <option value="Toutes">Toutes offres</option>
                {OFFRE_LIST.map(o => <option key={o}>{o}</option>)}
              </select>
              {(filterEntreprise!=="Tous" || filterStatut!=="Tous" || filterNiveau!=="Tous" || searchTerm || periode!=="mois" || filtreOffre!=="Toutes") &&
                <button onClick={()=>{setFilterEnt("Tous");setFilterStatut("Tous");setFilterNiveau("Tous");setSearchTerm("");setPeriode("mois");setFiltreOffre("Toutes");}}
                  style={{ ...btnSecondary, padding:"7px 12px", fontSize:11 }}>✕ Reset</button>}
            </div>
          )}

          {/* Carte principale */}
          <div style={{ background:"#fff", padding:24, borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>

            {/* ========== ONGLETS EXISTANTS (conservés intégralement) ========== */}
            {activeTab === "tableau" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Vue d'ensemble RH</h2><p style={tabSubtitle}>Synthèse temps réel de tous les employés inscrits</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                  {/* Répartition par niveau */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <h3 style={blockTitle}>Niveaux CECRL des employés</h3>
                    {Object.keys(NIVEAU_META).map(lvl => {
                      const count = employes.filter(e => e.niveau===lvl).length;
                      if (!count) return null;
                      const m = NIVEAU_META[lvl];
                      return (
                        <div key={lvl} style={{ marginBottom:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:13 }}><span style={{ padding:"2px 7px", borderRadius:8, background:m.bg, color:m.color, fontWeight:800, fontSize:11 }}>{lvl}</span></span>
                            <span style={{ fontSize:12, color:"#6b7280" }}>{count} employé(s) · {Math.round((count/employes.length)*100)}%</span>
                          </div>
                          <ProgressBar value={(count/employes.length)*100} color={m.color} />
                        </div>
                      );
                    })}
                  </div>
                  {/* Répartition par statut + taux */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <h3 style={blockTitle}>Statut des employés</h3>
                    {Object.entries(STATUT_COLORS).map(([key, m]) => {
                      const count = employes.filter(e => e.statut===key).length;
                      if (!count) return null;
                      return (
                        <div key={key} style={{ marginBottom:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:13, padding:"2px 8px", borderRadius:8, background:m.bg, color:m.c, fontWeight:600 }}>{m.label}</span>
                            <span style={{ fontSize:12, color:"#6b7280" }}>{count} · {Math.round((count/employes.length)*100)}%</span>
                          </div>
                          <ProgressBar value={(count/employes.length)*100} color={m.c} />
                        </div>
                      );
                    })}
                    <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #e5e7eb" }}>
                      <h3 style={{ ...blockTitle, marginBottom:10 }}>Taux d'assiduité global</h3>
                      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                        <div style={{ position:"relative", width:72, height:72 }}>
                          <svg viewBox="0 0 36 36" style={{ width:72, height:72, transform:"rotate(-90deg)" }}>
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3"
                              strokeDasharray={`${stats.avgAssid} 100`} strokeLinecap="round"/>
                          </svg>
                          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#22c55e" }}>{stats.avgAssid}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize:13, color:"#374151" }}><strong style={{ color:"#22c55e" }}>{employes.filter(e=>e.assiduiteRate>=85).length}</strong> bonne assiduité (≥85%)</div>
                          <div style={{ fontSize:13, color:"#374151" }}><strong style={{ color:"#f59e0b" }}>{employes.filter(e=>e.assiduiteRate>=70&&e.assiduiteRate<85).length}</strong> surveillance (70–84%)</div>
                          <div style={{ fontSize:13, color:"#374151" }}><strong style={{ color:"#ef4444" }}>{employes.filter(e=>e.assiduiteRate<70).length}</strong> critique (&lt;70%)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Top progresseurs */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <h3 style={blockTitle}>🏆 Top 5 — Meilleure progression</h3>
                    {[...employes].sort((a,b)=>b.progression-a.progression).slice(0,5).map((e,i) => {
                      const ent = ENTREPRISES.find(x=>x.id===e.entrepriseId);
                      return (
                        <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, padding:"8px 10px", borderRadius:8, background:"#fff", border:"1px solid #e5e7eb", cursor:"pointer" }}
                          onClick={() => { setSelectedEmp(e); setShowEmpModal(true); }}>
                          <span style={{ fontSize:18 }}>{["🥇","🥈","🥉","4️⃣","5️⃣"][i]}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600, fontSize:13 }}>{e.nom}</div>
                            <div style={{ fontSize:11, color:"#9ca3af" }}>{ent?.logo} {ent?.nom} · {e.departement}</div>
                          </div>
                          <NiveauBadge niveau={e.niveau} />
                          <span style={{ fontWeight:800, color:"#059669", fontSize:14 }}>{e.progression}%</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Alertes récentes */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                      <h3 style={{ ...blockTitle, margin:0 }}>🔔 Dernières alertes</h3>
                      <button onClick={() => setActiveTab("alertes")} style={{ ...btnSecondary, padding:"4px 10px", fontSize:11 }}>Voir toutes →</button>
                    </div>
                    {alertes.slice(0,5).map(a => (
                      <div key={a.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 10px", borderRadius:8, marginBottom:6, background: a.lu?"#fff":"#f0f9ff", border:`1px solid ${a.lu?"#e5e7eb":"#bae6fd"}` }}>
                        <span style={{ fontSize:16 }}>🔴</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, fontSize:12, color:"#0f172a" }}>{a.employe}</div>
                          <div style={{ fontSize:11, color:"#6b7280" }}>{a.msg}</div>
                        </div>
                        <span style={{ fontSize:10, color:"#9ca3af", whiteSpace:"nowrap" }}>{formatDate(a.date)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Synthèse par entreprise */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20, gridColumn:"1 / -1" }}>
                    <h3 style={blockTitle}>Synthèse par entreprise</h3>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:12 }}>
                      {ENTREPRISES.map((ent, idx) => {
                        const empEnt = employes.filter(e => e.entrepriseId===ent.id);
                        const avgP   = empEnt.length ? Math.round(empEnt.reduce((s,e)=>s+e.progression,0)/empEnt.length) : 0;
                        const avgA   = empEnt.length ? Math.round(empEnt.reduce((s,e)=>s+e.assiduiteRate,0)/empEnt.length) : 0;
                        return (
                          <div key={ent.id} style={{ padding:16, borderRadius:10, background:"#fff", border:"1px solid #e5e7eb", cursor:"pointer" }}
                            onClick={() => { setActiveTab("employes"); setFilterEnt(ent.nom); }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                              <span style={{ fontSize:26 }}>{ent.logo}</span>
                              <div>
                                <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{ent.nom}</div>
                                <div style={{ fontSize:11, color:"#9ca3af" }}>{ent.secteur}</div>
                              </div>
                            </div>
                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:8 }}>
                              <span style={{ color:"#6b7280" }}>Employés</span>
                              <strong style={{ color:"#0891b2" }}>{empEnt.length}</strong>
                            </div>
                            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>Progression moy.</div>
                            <ProgressBar value={avgP} color={"#6366f1"} />
                            <div style={{ fontSize:11, color:"#9ca3af", marginTop:8, marginBottom:4 }}>Assiduité moy.</div>
                            <ProgressBar value={avgA} color={avgA>=85?"#22c55e":avgA>=70?"#f59e0b":"#ef4444"} />
                            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:12 }}>
                              <span style={{ color:"#6b7280" }}>Moy. prog.</span><strong>{avgP}%</strong>
                              <span style={{ color:"#6b7280", marginLeft:10 }}>Moy. assid.</span><strong>{avgA}%</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "employes" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Liste des Employés</h2><p style={tabSubtitle}>{employes.length} inscrits · {empFiltered.length} affichés</p></div>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={tableStyle}><thead><tr>
                    <th style={th}>Employé</th>
                    <th style={{ ...th, cursor:"pointer" }} onClick={()=>handleSort("entrepriseId")}>Entreprise<SortIcon field="entrepriseId"/></th>
                    <th style={{ ...th, cursor:"pointer" }} onClick={()=>handleSort("departement")}>Département<SortIcon field="departement"/></th>
                    <th style={th}>Niveau</th>
                    <th style={{ ...th, cursor:"pointer", minWidth:130 }} onClick={()=>handleSort("progression")}>Progression<SortIcon field="progression"/></th>
                    <th style={{ ...th, cursor:"pointer", minWidth:130 }} onClick={()=>handleSort("assiduiteRate")}>Assiduité<SortIcon field="assiduiteRate"/></th>
                    <th style={{ ...th, cursor:"pointer" }} onClick={()=>handleSort("statut")}>Statut<SortIcon field="statut"/></th>
                    <th style={th}>Action</th>
                  </tr></thead><tbody>
                    {empFiltered.map(e => {
                      const ent = ENTREPRISES.find(x=>x.id===e.entrepriseId);
                      return (
                        <tr key={e.id} style={{ borderTop:"1px solid #f1f5f9" }}>
                          <td style={td}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:36, height:36, borderRadius:"50%", background:"#e0f2fe", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:"#0891b2", flexShrink:0 }}>
                                {e.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{e.nom}</div>
                                <div style={{ fontSize:11, color:"#9ca3af" }}>{e.poste}</div>
                              </div>
                            </div>
                          </td>
                          <td style={td}><span style={{ fontSize:12 }}>{ent?.logo} {ent?.nom}</span></td>
                          <td style={{ ...td, fontSize:12 }}>{e.departement}</td>
                          <td style={td}><NiveauBadge niveau={e.niveau} /></td>
                          <td style={{ ...td, minWidth:130 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ flex:1, height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${e.progression}%`, background: e.progression>=70?"#6366f1":"#f59e0b", borderRadius:3 }} />
                              </div>
                              <span style={{ fontSize:12, fontWeight:700, color: e.progression>=70?"#6366f1":"#f59e0b", minWidth:34 }}>{e.progression}%</span>
                            </div>
                          </td>
                          <td style={{ ...td, minWidth:130 }}><AssiduiteBar rate={e.assiduiteRate} /></td>
                          <td style={td}><StatutBadge statut={e.statut} /></td>
                          <td style={td}>
                            <button onClick={()=>{setSelectedEmp(e);setShowEmpModal(true);}} style={btnIconEdit}>🔍 Détail</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody></table>
                </div>
              </div>
            )}

            {activeTab === "assiduite" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Suivi de l'Assiduité</h2><p style={tabSubtitle}>Présence, absences et retards par employé</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                  {[
                    { l:"Excellente (≥90%)", v:empFiltered.filter(e=>e.assiduiteRate>=90).length, color:"#22c55e" },
                    { l:"Bonne (75–89%)",    v:empFiltered.filter(e=>e.assiduiteRate>=75&&e.assiduiteRate<90).length, color:"#f59e0b" },
                    { l:"Insuffisante (<75%)",v:empFiltered.filter(e=>e.assiduiteRate<75).length, color:"#ef4444" },
                    { l:"Total absences",    v:empFiltered.reduce((s,e)=>s+e.absences,0), color:"#6366f1" },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign:"center", padding:14, borderRadius:10, background:"#f8fafc", border:"1px solid #e5e7eb" }}>
                      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>{s.l}</div>
                      <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <table style={tableStyle}><thead><tr>
                  <th style={th}>Employé</th><th style={th}>Entreprise</th><th style={th}>Taux assiduité</th><th style={th}>Absences</th><th style={th}>Retards</th><th style={th}>Dernière session</th><th style={th}>Statut</th>
                </tr></thead>
                <tbody>
                  {empFiltered.sort((a,b)=>a.assiduiteRate-b.assiduiteRate).map(e => {
                    const ent = ENTREPRISES.find(x=>x.id===e.entrepriseId);
                    return (
                      <tr key={e.id} style={{ borderTop:"1px solid #f1f5f9", background: e.assiduiteRate<70?"#fff5f5":"transparent" }}>
                        <td style={td}>
                          <div style={{ fontWeight:600, fontSize:13 }}>{e.nom}</div>
                          <div style={{ fontSize:11, color:"#9ca3af" }}>{e.poste}</div>
                        </td>
                        <td style={{ ...td, fontSize:12 }}>{ent?.logo} {ent?.nom}</td>
                        <td style={{ ...td, minWidth:150 }}><AssiduiteBar rate={e.assiduiteRate} /></td>
                        <td style={td}>
                          <span style={{ fontWeight:700, color: e.absences>5?"#ef4444":e.absences>2?"#f59e0b":"#22c55e", fontSize:16 }}>{e.absences}</span>
                        </td>
                        <td style={td}>
                          <span style={{ fontWeight:700, color: e.retards>4?"#ef4444":e.retards>1?"#f59e0b":"#22c55e", fontSize:16 }}>{e.retards}</span>
                        </td>
                        <td style={{ ...td, fontSize:12, color:"#6b7280" }}>{formatDate(e.dernierCours)}</td>
                        <td style={td}><StatutBadge statut={e.statut} /></td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            )}

            {activeTab === "progression" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Suivi de Progression</h2><p style={tabSubtitle}>Avancement des apprentissages par employé</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <h3 style={blockTitle}>Progression par département</h3>
                    {[...new Set(empFiltered.map(e=>e.departement))].map(dept => {
                      const group = empFiltered.filter(e=>e.departement===dept);
                      const avg = Math.round(group.reduce((s,e)=>s+e.progression,0)/group.length);
                      return (
                        <div key={dept} style={{ marginBottom:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:13 }}>{dept} <span style={{ color:"#9ca3af", fontSize:11 }}>({group.length})</span></span>
                            <strong style={{ color: avg>=70?"#059669":"#d97706" }}>{avg}%</strong>
                          </div>
                          <ProgressBar value={avg} color={avg>=70?"#6366f1":"#f59e0b"} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <h3 style={blockTitle}>Score test vs Progression</h3>
                    {empFiltered.sort((a,b)=>b.progression-a.progression).slice(0,8).map(e => (
                      <div key={e.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:"#374151", minWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.nom.split(" ")[0]}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", gap:2 }}>
                            <div style={{ height:6, borderRadius:3, background:"#6366f1", width:`${e.progression/2}%`, minWidth:2 }} />
                            <div style={{ height:6, borderRadius:3, background:"#06b6d4", width:`${e.testScore/2}%`, minWidth:2 }} />
                          </div>
                        </div>
                        <span style={{ fontSize:11, color:"#9ca3af", minWidth:70, textAlign:"right" }}>{e.progression}% / {e.testScore}%</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", gap:16, marginTop:12, fontSize:11, color:"#6b7280" }}>
                      <span><span style={{ display:"inline-block", width:10, height:6, borderRadius:3, background:"#6366f1", marginRight:4 }}/>Progression</span>
                      <span><span style={{ display:"inline-block", width:10, height:6, borderRadius:3, background:"#06b6d4", marginRight:4 }}/>Score test</span>
                    </div>
                  </div>
                </div>
                <table style={tableStyle}><thead><tr>
                  <th style={th}>Employé</th><th style={th}>Entreprise</th><th style={th}>Cours inscrits</th><th style={th}>Niveau</th>
                  <th style={{ ...th, minWidth:140 }}>Progression</th><th style={{ ...th, minWidth:140 }}>Score test</th><th style={th}>Dernier cours</th>
                </tr></thead><tbody>
                  {empFiltered.sort((a,b)=>b.progression-a.progression).map(e => {
                    const ent = ENTREPRISES.find(x=>x.id===e.entrepriseId);
                    return (
                      <tr key={e.id} style={{ borderTop:"1px solid #f1f5f9" }}>
                        <td style={td}>
                          <div style={{ fontWeight:600, fontSize:13 }}>{e.nom}</div>
                          <div style={{ fontSize:11, color:"#9ca3af" }}>{e.departement}</div>
                        </td>
                        <td style={{ ...td, fontSize:12 }}>{ent?.logo} {ent?.nom}</td>
                        <td style={td}>
                          {e.cours.map((c,i) => <span key={i} style={{ display:"inline-block", padding:"2px 6px", borderRadius:4, fontSize:10, background:"#ede9fe", color:"#5b21b6", marginRight:3, marginBottom:2 }}>{c}</span>)}
                        </td>
                        <td style={td}><NiveauBadge niveau={e.niveau} /></td>
                        <td style={{ ...td, minWidth:140 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ flex:1, height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${e.progression}%`, background:"#6366f1", borderRadius:3 }} />
                            </div>
                            <span style={{ fontSize:12, fontWeight:700, color:"#6366f1", minWidth:34 }}>{e.progression}%</span>
                          </div>
                        </td>
                        <td style={{ ...td, minWidth:140 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ flex:1, height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${e.testScore}%`, background: e.testScore>=60?"#22c55e":"#f59e0b", borderRadius:3 }} />
                            </div>
                            <span style={{ fontSize:12, fontWeight:700, color: e.testScore>=60?"#22c55e":"#f59e0b", minWidth:34 }}>{e.testScore}%</span>
                          </div>
                        </td>
                        <td style={{ ...td, fontSize:12, color:"#6b7280" }}>{formatDate(e.dernierCours)}</td>
                      </tr>
                    );
                  })}
                </tbody></table>
              </div>
            )}

            {activeTab === "sessions" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Sessions de Formation</h2><p style={tabSubtitle}>{sessions.length} sessions · {sessions.filter(s=>s.statut==="planifie").length} à venir</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:16 }}>
                  {sessions.map(s => {
                    const isFuture = s.statut === "planifie";
                    const tauxP    = s.presents !== null ? Math.round((s.presents/s.inscrits)*100) : null;
                    return (
                      <div key={s.id} style={{ border:`1px solid ${isFuture?"#93c5fd":"#e5e7eb"}`, borderRadius:12, padding:16, background: isFuture?"#eff6ff":"#fff", borderTop:`4px solid ${isFuture?"#2563eb":"#9ca3af"}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                          <span style={{ padding:"3px 8px", borderRadius:8, fontSize:10, fontWeight:700, background: isFuture?"#dbeafe":"#f3f4f6", color: isFuture?"#1e40af":"#6b7280" }}>{isFuture?"📅 À venir":"✅ Terminée"}</span>
                          <span style={{ padding:"3px 8px", borderRadius:8, fontSize:10, background:"#f3f4f6", color:"#374151" }}>{s.type==="online"?"🌐 Online":"🏢 Présentiel"}</span>
                        </div>
                        <h4 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:"0 0 8px" }}>{s.titre}</h4>
                        <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>📅 {formatDate(s.date)} à {s.heure} · ⏱ {s.duree}</div>
                        <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>👤 {s.formateur} · 📍 {s.salle}</div>
                        <div style={{ fontSize:12, color:"#6b7280", marginBottom: tauxP!==null ? 12 : 0 }}>👥 {s.inscrits} inscrits</div>
                        {tauxP !== null && (
                          <>
                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                              <span style={{ color:"#9ca3af" }}>Présents</span>
                              <strong style={{ color: tauxP>=80?"#22c55e":"#f59e0b" }}>{s.presents}/{s.inscrits} ({tauxP}%)</strong>
                            </div>
                            <ProgressBar value={tauxP} color={tauxP>=80?"#22c55e":"#f59e0b"} />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "alertes" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Alertes & Notifications</h2><p style={tabSubtitle}>{alertes.filter(a=>!a.lu).length} non lues · {alertes.length} au total</p></div>
                  <button onClick={()=>setAlertes(a=>a.map(x=>({...x,lu:true})))} style={{ ...btnSecondary, fontSize:11 }}>✅ Tout marquer lu</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
                  {[
                    { l:"Haute priorité", v:alertes.filter(a=>a.priorite==="haute").length, color:"#ef4444", bg:"#fee2e2" },
                    { l:"Priorité moyenne", v:alertes.filter(a=>a.priorite==="moyenne").length, color:"#f59e0b", bg:"#fef3c7" },
                    { l:"Non lues", v:alertes.filter(a=>!a.lu).length, color:"#6366f1", bg:"#ede9fe" },
                  ].map(s=>(
                    <div key={s.l} style={{ textAlign:"center", padding:14, borderRadius:10, background:s.bg, border:`1px solid ${s.color}30` }}>
                      <div style={{ fontSize:11, color:"#6b7280" }}>{s.l}</div>
                      <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {alertes.map(a=>(
                  <div key={a.id} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", borderRadius:10, marginBottom:8, background:a.lu?"#fff":"#fef9f0", border:`1px solid ${a.lu?"#e5e7eb":a.priorite==="haute"?"#fca5a5":"#fcd34d"}` }}>
                    <div style={{ width:38, height:38, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, background:a.priorite==="haute"?"#fee2e2":a.priorite==="moyenne"?"#fef3c7":"#f0fdf4", flexShrink:0 }}>
                      {a.priorite==="haute"?"🔴":a.priorite==="moyenne"?"🟡":"🟢"}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{a.employe}</span>
                        <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:"#f3f4f6", color:"#374151" }}>{a.entreprise}</span>
                        {!a.lu && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:6, background:"#dbeafe", color:"#1e40af", fontWeight:700 }}>Nouveau</span>}
                      </div>
                      <div style={{ fontSize:12, color:"#374151" }}>{a.msg}</div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{formatDate(a.date)}</div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {!a.lu && <button onClick={()=>setAlertes(prev=>prev.map(x=>x.id===a.id?{...x,lu:true}:x))} style={{ ...btnSecondary, padding:"4px 8px", fontSize:11 }}>Lu</button>}
                      <button onClick={()=>{ setActiveTab("employes"); }} style={{ padding:"4px 8px", background:"#e0f2fe", color:"#0891b2", border:"none", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600 }}>Voir employé →</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "entreprises" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Entreprises Clientes</h2><p style={tabSubtitle}>{ENTREPRISES.length} entreprises partenaires</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:16 }}>
                  {ENTREPRISES.map((ent, idx) => {
                    const empEnt    = employes.filter(e=>e.entrepriseId===ent.id);
                    const avgProg   = empEnt.length ? Math.round(empEnt.reduce((s,e)=>s+e.progression,0)/empEnt.length) : 0;
                    const avgAssid  = empEnt.length ? Math.round(empEnt.reduce((s,e)=>s+e.assiduiteRate,0)/empEnt.length) : 0;
                    const depts     = [...new Set(empEnt.map(e=>e.departement))];
                    return (
                      <div key={ent.id} style={{ border:"1px solid #e5e7eb", borderRadius:14, padding:20, background:"#fff", borderTop:`4px solid ${PRIMARY_COLOR}` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                          <span style={{ fontSize:32 }}>{ent.logo}</span>
                          <div>
                            <div style={{ fontSize:16, fontWeight:800, color:"#0f172a" }}>{ent.nom}</div>
                            <div style={{ fontSize:12, color:"#9ca3af" }}>{ent.secteur}</div>
                          </div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                          {[
                            { l:"Employés inscrits", v:empEnt.length,    c:"#0891b2" },
                            { l:"Progression moy.",  v:`${avgProg}%`,    c:"#6366f1" },
                            { l:"Assiduité moy.",    v:`${avgAssid}%`,   c: avgAssid>=85?"#22c55e":"#f59e0b" },
                            { l:"Cours actifs",      v:empEnt.reduce((s,e)=>s+e.cours.length,0), c:"#7c3aed" },
                          ].map(s => (
                            <div key={s.l} style={{ padding:"8px 10px", borderRadius:8, background:"#f8fafc", textAlign:"center" }}>
                              <div style={{ fontSize:10, color:"#9ca3af" }}>{s.l}</div>
                              <div style={{ fontSize:16, fontWeight:800, color:s.c }}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize:11, color:"#9ca3af", marginBottom:6 }}>Départements :</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:14 }}>
                          {depts.map(d => <span key={d} style={{ padding:"2px 7px", borderRadius:6, fontSize:10, background:"#f3f4f6", color:"#374151" }}>{d}</span>)}
                        </div>
                        <button onClick={()=>{setActiveTab("employes");setFilterEnt(ent.nom);}} style={{ ...btnPrimary, width:"100%", textAlign:"center" }}>
                          👥 Voir les employés →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========== NOUVEL ONGLET : EXPORTS & ENVOIS ========== */}
            {activeTab === "exports" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Exports et rapports automatiques</h2><p style={tabSubtitle}>Téléchargez les données ou planifiez des envois par email</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>📎 Exports manuels</h3>
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
                      <button onClick={() => exportExcel(empFiltered, `employes_${new Date().toISOString().slice(0,10)}`)} style={btnPrimary}>📊 Liste employés (Excel)</button>
                      <button onClick={() => exportPDF(empFiltered, `Rapport_RH_${new Date().toISOString().slice(0,10)}`)} style={btnSecondary}>📄 Rapport RH (PDF)</button>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Filtres actifs :</div>
                    <ul style={{ fontSize:12, color:"#6b7280", margin:0, paddingLeft:20 }}>
                      <li>Période : {periode === "semaine" ? "Semaine" : periode === "mois" ? "Mois" : periode === "trimestre" ? "Trimestre" : "Année"}</li>
                      <li>Entreprise : {filterEntreprise === "Tous" ? "Toutes" : filterEntreprise}</li>
                      <li>Statut : {filterStatut === "Tous" ? "Tous" : filterStatut}</li>
                      <li>Niveau : {filterNiveau === "Tous" ? "Tous" : filterNiveau}</li>
                      <li>Offre : {filtreOffre === "Toutes" ? "Toutes" : filtreOffre}</li>
                    </ul>
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>⏱️ Envois automatiques</h3>
                    <p style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>Planifiez l’envoi de rapports récapitulatifs aux managers par email.</p>
                    <button onClick={() => setShowPlanifModal(true)} style={btnPrimary}>📧 Planifier un envoi</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL CRUD EMPLOYÉ */}
        {showEmpModal && (
          <Modal title={editingEmp ? "Modifier l'employé" : (selectedEmp ? "Détail employé" : "Ajouter un employé")} onClose={() => { setShowEmpModal(false); setEditingEmp(null); setSelectedEmp(null); }} wide>
            {selectedEmp ? (
              <EmployeDetail employe={selectedEmp} entreprises={ENTREPRISES} onClose={() => setShowEmpModal(false)} />
            ) : (
              <EmployeForm initialData={editingEmp} onSave={handleSaveEmploye} onCancel={() => setShowEmpModal(false)} entreprises={ENTREPRISES} />
            )}
          </Modal>
        )}

        {/* MODALE PLANIFICATION */}
        {showPlanifModal && (
          <Modal title="Planifier l'envoi automatique de rapports" onClose={() => setShowPlanifModal(false)}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label style={labelSt}>Fréquence</label><select value={planifConfig.frequence} onChange={e => setPlanifConfig({...planifConfig, frequence: e.target.value})} style={inputSt}><option value="hebdomadaire">Hebdomadaire</option><option value="mensuel">Mensuel</option></select></div>
              <div><label style={labelSt}>Emails destinataires (séparés par des virgules)</label><input type="text" value={planifConfig.emails} onChange={e => setPlanifConfig({...planifConfig, emails: e.target.value})} placeholder="manager@bet.com, rh@entreprise.ci" style={inputSt} /></div>
              <div><label style={labelSt}>Format du rapport</label><select value={planifConfig.format} onChange={e => setPlanifConfig({...planifConfig, format: e.target.value})} style={inputSt}><option value="pdf">PDF</option><option value="excel">Excel (CSV)</option></select></div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:10 }}><button onClick={() => setShowPlanifModal(false)} style={btnSecondary}>Annuler</button><button onClick={handlePlanifierEnvoi} style={btnPrimary}>Enregistrer la planification</button></div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPOSANTS FORMULAIRES & DÉTAIL
═══════════════════════════════════════════════════════ */
const EmployeForm = ({ initialData, onSave, onCancel, entreprises }) => {
  const [form, setForm] = useState(initialData || {
    nom: "", prenom: "", email: "", phone: "", entrepriseId: 1, departement: "", poste: "",
    niveau: "B1", progression: 50, assiduiteRate: 85, cours: [], statut: "actif",
    dateInscription: new Date().toISOString().slice(0,10), dernierCours: "", testScore: 50, absences: 0, retards: 0
  });
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div><label style={labelSt}>Nom *</label><input style={inputSt} value={form.nom} onChange={e=>setForm({...form, nom:e.target.value})} required /></div>
        <div><label style={labelSt}>Prénom</label><input style={inputSt} value={form.prenom} onChange={e=>setForm({...form, prenom:e.target.value})} /></div>
        <div><label style={labelSt}>Email</label><input type="email" style={inputSt} value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
        <div><label style={labelSt}>Téléphone</label><input style={inputSt} value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} /></div>
        <div><label style={labelSt}>Entreprise</label><select style={inputSt} value={form.entrepriseId} onChange={e=>setForm({...form, entrepriseId:Number(e.target.value)})}>{entreprises.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}</select></div>
        <div><label style={labelSt}>Département</label><input style={inputSt} value={form.departement} onChange={e=>setForm({...form, departement:e.target.value})} /></div>
        <div><label style={labelSt}>Poste</label><input style={inputSt} value={form.poste} onChange={e=>setForm({...form, poste:e.target.value})} /></div>
        <div><label style={labelSt}>Niveau</label><select style={inputSt} value={form.niveau} onChange={e=>setForm({...form, niveau:e.target.value})}><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></div>
        <div><label style={labelSt}>Progression (%)</label><input type="number" style={inputSt} value={form.progression} onChange={e=>setForm({...form, progression:Number(e.target.value)})} /></div>
        <div><label style={labelSt}>Assiduité (%)</label><input type="number" style={inputSt} value={form.assiduiteRate} onChange={e=>setForm({...form, assiduiteRate:Number(e.target.value)})} /></div>
        <div><label style={labelSt}>Score test</label><input type="number" style={inputSt} value={form.testScore} onChange={e=>setForm({...form, testScore:Number(e.target.value)})} /></div>
        <div><label style={labelSt}>Statut</label><select style={inputSt} value={form.statut} onChange={e=>setForm({...form, statut:e.target.value})}><option>actif</option><option>inactif</option><option>suspendu</option><option>conge</option></select></div>
      </div>
      <div style={{ marginTop:16, display:"flex", gap:10, justifyContent:"flex-end" }}><button type="button" onClick={onCancel} style={btnSecondary}>Annuler</button><button type="submit" style={btnPrimary}>Enregistrer</button></div>
    </form>
  );
};

const EmployeDetail = ({ employe, entreprises, onClose }) => {
  const ent = entreprises.find(x=>x.id===employe.entrepriseId);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20, paddingBottom:16, borderBottom:"1px solid #e5e7eb" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:PRIMARY_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:PRIMARY_COLOR }}>{employe.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
        <div><div style={{ fontSize:18, fontWeight:800 }}>{employe.nom}</div><div style={{ fontSize:13, color:"#6b7280" }}>{employe.poste} · {employe.departement}</div><div style={{ marginTop:4 }}><NiveauBadge niveau={employe.niveau} /> <StatutBadge statut={employe.statut} /></div></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div><strong>Email :</strong> {employe.email}</div><div><strong>Téléphone :</strong> {employe.phone}</div>
        <div><strong>Entreprise :</strong> {ent?.logo} {ent?.nom}</div><div><strong>Date inscription :</strong> {new Date(employe.dateInscription).toLocaleDateString("fr-FR")}</div>
        <div><strong>Progression :</strong> {employe.progression}%</div><div><strong>Assiduité :</strong> {employe.assiduiteRate}%</div>
        <div><strong>Score test :</strong> {employe.testScore}%</div><div><strong>Absences / retards :</strong> {employe.absences} / {employe.retards}</div>
        <div><strong>Cours :</strong> {employe.cours.join(", ")}</div><div><strong>Dernier cours :</strong> {new Date(employe.dernierCours).toLocaleDateString("fr-FR")}</div>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}><button onClick={onClose} style={btnSecondary}>Fermer</button></div>
    </div>
  );
};

/* ═══ STYLES ═══ */
const btnPrimary  = { padding:"9px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnSecondary = { padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnGhost     = { padding:"5px 10px", background:"none", color:PRIMARY_COLOR, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnIconEdit  = { padding:"4px 8px", background:PRIMARY_LIGHT, color:PRIMARY_DARK, border:`1px solid ${PRIMARY_COLOR}40`, borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 };
const labelSt      = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 };
const inputSt      = { padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%", boxSizing:"border-box" };
const modalOverlay = { position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 };
const modalBox     = { background:"#fff", padding:24, borderRadius:14, maxWidth:"92vw" };
const tabHeader    = { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 };
const tabTitle     = { margin:0, fontSize:17, fontWeight:700, color:"#0f172a" };
const tabSubtitle  = { margin:"3px 0 0", fontSize:12, color:"#9ca3af" };
const blockTitle   = { fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:16, margin:"0 0 16px" };
const tableStyle   = { width:"100%", borderCollapse:"collapse" };
const th           = { padding:"10px 12px", textAlign:"left", fontSize:12, color:"#6b7280", background:"#f9fafb", fontWeight:600 };
const td           = { padding:"10px 12px", fontSize:13, verticalAlign:"middle" };