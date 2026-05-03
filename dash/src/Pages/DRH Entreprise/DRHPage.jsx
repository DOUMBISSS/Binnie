import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

/* ═══════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════ */
const STATUT_COLORS = {
  actif:     { bg: "#dcfce7", c: "#166534", label: "Actif" },
  inactif:   { bg: "#fee2e2", c: "#991b1b", label: "Inactif" },
  suspendu:  { bg: "#fef3c7", c: "#92400e", label: "Suspendu" },
  conge:     { bg: "#dbeafe", c: "#1e40af", label: "En congé" },
};
const NIVEAU_COLORS = {
  A1: { bg: "#f3f4f6", c: "#374151" }, A2: { bg: "#fef3c7", c: "#92400e" },
  B1: { bg: "#dbeafe", c: "#1e40af" }, B2: { bg: "#ede9fe", c: "#5b21b6" },
  C1: { bg: "#dcfce7", c: "#166534" }, C2: { bg: "#fee2e2", c: "#991b1b" },
};
const DEPT_COLORS = ["#6366f1","#2563eb","#059669","#d97706","#dc2626","#7c3aed","#0891b2"];

/* ═══════════════════════════════════════════════════
   DONNÉES MOCK
═══════════════════════════════════════════════════ */
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

const SESSIONS_INIT = [
  { id:1, titre:"Business English — Niveau B2", date:"2025-12-10", heure:"09:00", duree:"2h", formateur:"Prof. Martin", salle:"Salle A", inscrits:8,  presents:7,  type:"presentiel", statut:"termine"  },
  { id:2, titre:"TOEIC Preparation",            date:"2025-12-12", heure:"14:00", duree:"3h", formateur:"Prof. Dubois", salle:"Online",  inscrits:12, presents:11, type:"online",      statut:"termine"  },
  { id:3, titre:"English C1 — Advanced",        date:"2025-12-15", heure:"10:00", duree:"2h", formateur:"Prof. Martin", salle:"Salle B", inscrits:6,  presents:null, type:"presentiel", statut:"planifie" },
  { id:4, titre:"Finance English",              date:"2025-12-18", heure:"09:00", duree:"2h", formateur:"Prof. Smith",  salle:"Salle A", inscrits:5,  presents:null, type:"presentiel", statut:"planifie" },
  { id:5, titre:"Anglais Débutant A1→A2",       date:"2025-12-08", heure:"16:00", duree:"1h30",formateur:"Prof. Dupont",salle:"Online",  inscrits:9,  presents:6,  type:"online",      statut:"termine"  },
];

const ALERTES_INIT = [
  { id:1, type:"absence",    employe:"N'Guessan Fatou",  msg:"5 absences non justifiées ce mois",   date:"2025-12-08", lu:false, severity:"high"   },
  { id:2, type:"retard",     employe:"Bamba Aïcha",      msg:"6 retards consécutifs — action requise",date:"2025-12-07",lu:false, severity:"high"   },
  { id:3, type:"progression",employe:"Traoré Mariam",    msg:"Progression stagnante depuis 6 semaines",date:"2025-12-05",lu:false, severity:"medium" },
  { id:4, type:"succes",     employe:"Loba Paterne",     msg:"Score parfait au test de niveau — C2", date:"2025-12-09", lu:true,  severity:"low"    },
  { id:5, type:"succes",     employe:"Diallo Ibrahima",  msg:"Certification TOEIC obtenue — 890pts",  date:"2025-12-06", lu:true,  severity:"low"    },
  { id:6, type:"absence",    employe:"Traoré Mariam",    msg:"Suspendu — trop d'absences injustifiées",date:"2025-12-04",lu:true,  severity:"high"   },
];

/* ═══════════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════════ */
// const Sidebar = ({ role = "drh" }) => {
//   const navigate = useNavigate();
//   const items = [
//     { name:"Dashboard",            path:"/AdminDashboard" },
//     { name:"Professeurs",          path:"/TeachersPage" },
//     { name:"Classes",              path:"/classes" },
//     { name:"Cours",                path:"/courses" },
//     { name:"Etudiant",             path:"/student" },
//     { name:"Examens",              path:"/exams" },
//     { name:"Salles",               path:"/rooms" },
//     { name:"Bulletins",            path:"/bulletins" },
//     { name:"Notifications",        path:"/notifications" },
//     { name:"Gestion Utilisateurs", path:"/administrator" },
//     { name:"Administration",       path:"/administration" },
//     { name:"Test Niveau",          path:"/test-niveau" },
//     { name:"Tableau de bord RH",   path:"/drh",      active: role==="drh" },
//     { name:"Espace Manager",       path:"/managers", active: role==="manager" },
//     { name:"Profil",               path:"/profile" },
//     { name:"Déconnexion",          path:"/logout" },
//   ];
//   return (
//     <div style={sidebarStyle}>
//       <h2 style={{ marginBottom:30, color:"#fff", fontSize:16 }}>Menu</h2>
//       {items.map((it, i) => (
//         <div key={i} onClick={() => navigate(it.path)}
//           style={{ ...sidebarItemStyle, background: it.active ? "#0891b2" : "#1e3a8a", fontWeight: it.active ? 700 : 400 }}>
//           {it.name}
//         </div>
//       ))}
//     </div>
//   );
// };

const StatCard = ({ label, value, color, icon, sub, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff", padding:16, borderRadius:12, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:12, cursor: onClick?"pointer":"default" }}>
    <div style={{ width:46, height:46, borderRadius:10, background:color+"1a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{icon}</div>
    <div style={{ minWidth:0 }}>
      <div style={{ fontSize:11, color:"#9ca3af" }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color, lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>{sub}</div>}
    </div>
  </div>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div style={modalOverlay}>
    <div style={{ ...modalBox, width: wide ? 720 : 520, maxHeight:"92vh", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h3 style={{ margin:0, fontSize:16 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#6b7280" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const ProgressBar = ({ value, color = "#6366f1", height = 7 }) => (
  <div style={{ height, background:"#e5e7eb", borderRadius:height, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.min(100, value)}%`, background:color, borderRadius:height, transition:"width .4s" }} />
  </div>
);

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

const StatutBadge = ({ statut }) => {
  const m = STATUT_COLORS[statut] || STATUT_COLORS.actif;
  return <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:m.bg, color:m.c }}>{m.label}</span>;
};

const NiveauBadge = ({ niveau }) => {
  const m = NIVEAU_COLORS[niveau] || NIVEAU_COLORS.A1;
  return <span style={{ padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:800, background:m.bg, color:m.c, border:`1px solid ${m.c}30` }}>{niveau}</span>;
};

const AlerteIcon = ({ type }) => {
  const map = { absence:"🔴", retard:"🟡", progression:"🟠", succes:"🟢" };
  return <span style={{ fontSize:16 }}>{map[type] || "⚪"}</span>;
};

/* ═══════════════════════════════════════════════════
   PAGE DRH
═══════════════════════════════════════════════════ */
export default function DRHPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]         = useState("tableau");
  const [employes, setEmployes]           = useState(EMPLOYES_INIT);
  const [sessions]                        = useState(SESSIONS_INIT);
  const [alertes, setAlertes]             = useState(ALERTES_INIT);
  const [filterEntreprise, setFilterEnt]  = useState("Tous");
  const [filterStatut, setFilterStatut]   = useState("Tous");
  const [filterNiveau, setFilterNiveau]   = useState("Tous");
  const [searchTerm, setSearchTerm]       = useState("");
  const [sortField, setSortField]         = useState("nom");
  const [sortDir, setSortDir]             = useState("asc");
  const [selectedEmp, setSelectedEmp]     = useState(null);
  const [showEmpModal, setShowEmpModal]   = useState(false);
  const [activeEntreprise, setActiveEnt]  = useState(null);

  /* ── Stats globales ── */
  const stats = useMemo(() => {
    const total       = employes.length;
    const actifs      = employes.filter(e => e.statut === "actif").length;
    const avgProg     = total ? Math.round(employes.reduce((s,e)=>s+e.progression,0)/total) : 0;
    const avgAssid    = total ? Math.round(employes.reduce((s,e)=>s+e.assiduiteRate,0)/total) : 0;
    const alertesNL   = alertes.filter(a => !a.lu).length;
    const enDanger    = employes.filter(e => e.assiduiteRate < 80 || e.progression < 40).length;
    const sessionsAV  = sessions.filter(s => s.statut==="planifie").length;
    return { total, actifs, avgProg, avgAssid, alertesNL, enDanger, sessionsAV };
  }, [employes, alertes, sessions]);

  /* ── Employés filtrés ── */
  const empFiltered = useMemo(() => {
    let r = [...employes];
    if (filterEntreprise !== "Tous") r = r.filter(e => {
      const ent = ENTREPRISES.find(x => x.id === e.entrepriseId);
      return ent?.nom === filterEntreprise;
    });
    if (filterStatut !== "Tous") r = r.filter(e => e.statut === filterStatut);
    if (filterNiveau !== "Tous") r = r.filter(e => e.niveau === filterNiveau);
    if (searchTerm)  r = r.filter(e => e.nom.toLowerCase().includes(searchTerm.toLowerCase()) || e.email.toLowerCase().includes(searchTerm.toLowerCase()) || e.departement.toLowerCase().includes(searchTerm.toLowerCase()));
    r.sort((a,b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === "string") {
        va = va.toLowerCase();
        vb = vb.toLowerCase();
      }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return r;
  }, [employes, filterEntreprise, filterStatut, filterNiveau, searchTerm, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d==="asc"?"desc":"asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => (
    <span style={{ fontSize:10, color:"#9ca3af" }}>
      {sortField===field ? (sortDir==="asc" ? " ↑" : " ↓") : " ↕"}
    </span>
  );

  const markAllRead = () => {
    setAlertes(alertes.map(a => ({ ...a, lu:true })));
    toast.success("Toutes les alertes marquées comme lues");
  };

  const tabs = [
    { key:"tableau",     label:"Tableau de bord",  icon:"📊", count:null },
    { key:"employes",    label:"Employés",          icon:"👥", count:employes.length },
    { key:"assiduite",   label:"Assiduité",         icon:"📅", count:null },
    { key:"progression", label:"Progression",       icon:"📈", count:null },
    { key:"sessions",    label:"Sessions",          icon:"🎓", count:sessions.length },
    { key:"alertes",     label:"Alertes",           icon:"🔔", count:stats.alertesNL || null, danger:stats.alertesNL > 0 },
    { key:"entreprises", label:"Entreprises",       icon:"🏢", count:ENTREPRISES.length },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" }) : "—";

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f1f5f9" }}>
      {/* <Sidebar role="drh" /> */}
      <div style={{ flex:1, padding:24, overflowX:"hidden" }}>
        <Toaster position="top-right" />

        {/* ── HEADER ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <h1 style={{ margin:0, fontSize:24, color:"#0f172a", fontWeight:800 }}>🏢 Tableau de bord RH</h1>
            <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:13 }}>
              Suivi en temps réel · Assiduité · Progression · Résultats — {employes.length} employés inscrits
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => navigate("/managers")} style={{ ...btnSecondary, display:"flex", alignItems:"center", gap:6 }}>
              👔 Espace Manager
            </button>
            <button onClick={() => {
              const csv = ["Nom,Email,Entreprise,Département,Niveau,Progression,Assiduité,Statut",
                ...employes.map(e => {
                  const ent = ENTREPRISES.find(x=>x.id===e.entrepriseId);
                  return `${e.nom},${e.email},${ent?.nom||""},${e.departement},${e.niveau},${e.progression}%,${e.assiduiteRate}%,${e.statut}`;
                })
              ].join("\n");
              const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download="rapport_rh.csv"; a.click();
              toast.success("Rapport CSV exporté");
            }} style={btnPrimary}>⬇️ Exporter rapport</button>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(155px,1fr))", gap:12, marginBottom:24 }}>
          <StatCard label="Employés inscrits"  value={stats.total}                color="#6366f1" icon="👥"  sub={`${stats.actifs} actifs`} onClick={() => setActiveTab("employes")} />
          <StatCard label="Progression moy."   value={`${stats.avgProg}%`}        color="#2563eb" icon="📈"  sub={stats.avgProg>=60?"Bon niveau":"À améliorer"} onClick={() => setActiveTab("progression")} />
          <StatCard label="Assiduité moy."     value={`${stats.avgAssid}%`}       color="#059669" icon="📅"  sub={stats.avgAssid>=85?"Bonne présence":"Surveillance"} onClick={() => setActiveTab("assiduite")} />
          <StatCard label="Sessions planif."   value={stats.sessionsAV}           color="#d97706" icon="🎓"  sub="à venir" onClick={() => setActiveTab("sessions")} />
          <StatCard label="Alertes actives"    value={stats.alertesNL}            color={stats.alertesNL>0?"#ef4444":"#9ca3af"} icon="🔔" sub="non lues" onClick={() => setActiveTab("alertes")} />
          <StatCard label="À surveiller"       value={stats.enDanger}             color="#dc2626" icon="⚠️"  sub="assiduité ou progression" onClick={() => setActiveTab("employes")} />
        </div>

        {/* ── TABS ── */}
        <div style={{ display:"flex", gap:3, marginBottom:0, flexWrap:"wrap" }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding:"10px 16px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer",
                fontWeight:600, fontSize:13,
                background: isActive ? "#fff" : "#e5e7eb",
                color: isActive ? "#0891b2" : "#6b7280",
                boxShadow: isActive ? "0 -2px 6px rgba(0,0,0,0.06)" : "none",
                display:"flex", alignItems:"center", gap:6,
              }}>
                <span style={{ fontSize:14 }}>{tab.icon}</span>
                {tab.label}
                {tab.count !== null && tab.count !== undefined && (
                  <span style={{ padding:"1px 7px", borderRadius:10, fontSize:11, fontWeight:700,
                    background: tab.danger ? "#fee2e2" : isActive ? "#e0f2fe" : "#d1d5db",
                    color: tab.danger ? "#dc2626" : isActive ? "#0891b2" : "#4b5563" }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── CARD PRINCIPALE ── */}
        <div style={{ ...card, borderRadius:"0 12px 12px 12px" }}>

          {/* ═══════ TAB : TABLEAU DE BORD ═══════ */}
          {activeTab === "tableau" && (
            <div>
              <div style={tabHeader}>
                <div><h2 style={tabTitle}>Vue d'ensemble RH</h2><p style={tabSubtitle}>Synthèse temps réel de tous les employés inscrits</p></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

                {/* Répartition par niveau */}
                <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                  <h3 style={blockTitle}>Niveaux CECRL des employés</h3>
                  {Object.keys(NIVEAU_COLORS).map(lvl => {
                    const count = employes.filter(e => e.niveau===lvl).length;
                    if (!count) return null;
                    const m = NIVEAU_COLORS[lvl];
                    return (
                      <div key={lvl} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:13 }}><span style={{ padding:"2px 7px", borderRadius:8, background:m.bg, color:m.c, fontWeight:800, fontSize:11 }}>{lvl}</span></span>
                          <span style={{ fontSize:12, color:"#6b7280" }}>{count} employé(s) · {Math.round((count/employes.length)*100)}%</span>
                        </div>
                        <ProgressBar value={(count/employes.length)*100} color={m.c} />
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
                      <AlerteIcon type={a.type} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:12, color:"#0f172a" }}>{a.employe}</div>
                        <div style={{ fontSize:11, color:"#6b7280" }}>{a.msg}</div>
                      </div>
                      <span style={{ fontSize:10, color:"#9ca3af", whiteSpace:"nowrap" }}>{formatDate(a.date)}</span>
                    </div>
                  ))}
                </div>

                {/* Répartition par entreprise */}
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
                            <strong style={{ color:DEPT_COLORS[idx] }}>{empEnt.length}</strong>
                          </div>
                          <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>Progression moy.</div>
                          <ProgressBar value={avgP} color={DEPT_COLORS[idx]} />
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

          {/* ═══════ TAB : EMPLOYÉS ═══════ */}
          {activeTab === "employes" && (
            <div>
              <div style={tabHeader}>
                <div><h2 style={tabTitle}>Liste des Employés</h2><p style={tabSubtitle}>{employes.length} inscrits · {empFiltered.length} affichés</p></div>
              </div>
              {/* Filtres */}
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
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
                  {Object.keys(NIVEAU_COLORS).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                {(filterEntreprise!=="Tous"||filterStatut!=="Tous"||filterNiveau!=="Tous"||searchTerm) &&
                  <button onClick={()=>{setFilterEnt("Tous");setFilterStatut("Tous");setFilterNiveau("Tous");setSearchTerm("");}}
                    style={{ ...btnSecondary, padding:"7px 12px", fontSize:11 }}>✕ Reset</button>}
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

          {/* ═══════ TAB : ASSIDUITÉ ═══════ */}
          {activeTab === "assiduite" && (
            <div>
              <div style={tabHeader}>
                <div><h2 style={tabTitle}>Suivi de l'Assiduité</h2><p style={tabSubtitle}>Présence, absences et retards par employé</p></div>
              </div>
              {/* Résumé */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                {[
                  { l:"Excellente (≥90%)", v:employes.filter(e=>e.assiduiteRate>=90).length, color:"#22c55e" },
                  { l:"Bonne (75–89%)",    v:employes.filter(e=>e.assiduiteRate>=75&&e.assiduiteRate<90).length, color:"#f59e0b" },
                  { l:"Insuffisante (<75%)",v:employes.filter(e=>e.assiduiteRate<75).length, color:"#ef4444" },
                  { l:"Total absences",    v:employes.reduce((s,e)=>s+e.absences,0), color:"#6366f1" },
                ].map(s => (
                  <div key={s.l} style={{ textAlign:"center", padding:14, borderRadius:10, background:"#f8fafc", border:"1px solid #e5e7eb" }}>
                    <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>{s.l}</div>
                    <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <table style={tableStyle}><thead><tr>
                <th style={th}>Employé</th><th style={th}>Entreprise</th><th style={th}>Taux assiduité</th><th style={th}>Absences</th><th style={th}>Retards</th><th style={th}>Dernière session</th><th style={th}>Statut</th>
              </tr></thead><tbody>
                {[...employes].sort((a,b)=>a.assiduiteRate-b.assiduiteRate).map(e => {
                  const ent = ENTREPRISES.find(x=>x.id===e.entrepriseId);
                  const riskColor = e.assiduiteRate<70?"#ef4444":e.assiduiteRate<85?"#f59e0b":"#22c55e";
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
              </tbody></table>
            </div>
          )}

          {/* ═══════ TAB : PROGRESSION ═══════ */}
          {activeTab === "progression" && (
            <div>
              <div style={tabHeader}>
                <div><h2 style={tabTitle}>Suivi de Progression</h2><p style={tabSubtitle}>Avancement des apprentissages par employé</p></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                {/* Progression par département */}
                <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                  <h3 style={blockTitle}>Progression par département</h3>
                  {[...new Set(employes.map(e=>e.departement))].map(dept => {
                    const group = employes.filter(e=>e.departement===dept);
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
                {/* Score test vs progression */}
                <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                  <h3 style={blockTitle}>Score test vs Progression</h3>
                  {[...employes].sort((a,b)=>b.progression-a.progression).slice(0,8).map(e => (
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
                {[...employes].sort((a,b)=>b.progression-a.progression).map(e => {
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

          {/* ═══════ TAB : SESSIONS ═══════ */}
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

          {/* ═══════ TAB : ALERTES ═══════ */}
          {activeTab === "alertes" && (
            <div>
              <div style={tabHeader}>
                <div><h2 style={tabTitle}>Alertes & Notifications</h2><p style={tabSubtitle}>{alertes.filter(a=>!a.lu).length} non lues · {alertes.length} au total</p></div>
                <button onClick={markAllRead} style={btnSecondary}>✓ Tout marquer comme lu</button>
              </div>
              {["high","medium","low"].map(sev => {
                const group = alertes.filter(a => a.severity===sev);
                if (!group.length) return null;
                const labels = { high:"🔴 Critique", medium:"🟠 Moyenne", low:"🟢 Info" };
                return (
                  <div key={sev} style={{ marginBottom:24 }}>
                    <h3 style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:10 }}>{labels[sev]}</h3>
                    {group.map(a => (
                      <div key={a.id} onClick={() => setAlertes(alertes.map(x=>x.id===a.id?{...x,lu:true}:x))}
                        style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px", borderRadius:10, marginBottom:8, cursor:"pointer", background: a.lu?"#f9fafb":"#fff", border:`1px solid ${a.lu?"#e5e7eb": sev==="high"?"#fca5a5":sev==="medium"?"#fdba74":"#86efac"}` }}>
                        <AlerteIcon type={a.type} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{a.employe}</div>
                          <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{a.msg}</div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontSize:11, color:"#9ca3af" }}>{formatDate(a.date)}</div>
                          {!a.lu && <span style={{ fontSize:10, fontWeight:700, color:"#2563eb", background:"#dbeafe", padding:"2px 6px", borderRadius:4 }}>NOUVEAU</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════ TAB : ENTREPRISES ═══════ */}
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
                    <div key={ent.id} style={{ border:"1px solid #e5e7eb", borderRadius:14, padding:20, background:"#fff", borderTop:`4px solid ${DEPT_COLORS[idx]}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                        <span style={{ fontSize:32 }}>{ent.logo}</span>
                        <div>
                          <div style={{ fontSize:16, fontWeight:800, color:"#0f172a" }}>{ent.nom}</div>
                          <div style={{ fontSize:12, color:"#9ca3af" }}>{ent.secteur}</div>
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                        {[
                          { l:"Employés inscrits", v:empEnt.length,    c:DEPT_COLORS[idx] },
                          { l:"Progression moy.",  v:`${avgProg}%`,    c:"#6366f1" },
                          { l:"Assiduité moy.",    v:`${avgAssid}%`,   c: avgAssid>=85?"#22c55e":"#f59e0b" },
                          { l:"Cours actifs",      v:empEnt.reduce((s,e)=>s+e.cours.length,0), c:"#0891b2" },
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
        </div>

        {/* ── MODAL DÉTAIL EMPLOYÉ ── */}
        {showEmpModal && selectedEmp && (() => {
          const e   = selectedEmp;
          const ent = ENTREPRISES.find(x=>x.id===e.entrepriseId);
          return (
            <Modal title="Fiche Employé" onClose={()=>setShowEmpModal(false)} wide>
              <div style={{ display:"flex", alignItems:"center", gap:16, paddingBottom:20, borderBottom:"1px solid #e5e7eb", marginBottom:20 }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:"#e0f2fe", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:"#0891b2", flexShrink:0 }}>
                  {e.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:18, fontWeight:800, color:"#0f172a" }}>{e.nom}</div>
                  <div style={{ fontSize:13, color:"#6b7280" }}>{e.poste} · {e.departement}</div>
                  <div style={{ display:"flex", gap:8, marginTop:6 }}>
                    <span style={{ fontSize:12 }}>{ent?.logo} {ent?.nom}</span>
                    <StatutBadge statut={e.statut} />
                    <NiveauBadge niveau={e.niveau} />
                  </div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { l:"Progression",  v:`${e.progression}%`,   c:"#6366f1" },
                  { l:"Assiduité",    v:`${e.assiduiteRate}%`,  c: e.assiduiteRate>=85?"#22c55e":"#ef4444" },
                  { l:"Score test",   v:`${e.testScore}%`,      c: e.testScore>=60?"#22c55e":"#f59e0b" },
                  { l:"Absences",     v:e.absences,             c: e.absences>5?"#ef4444":"#374151" },
                ].map(s => (
                  <div key={s.l} style={{ textAlign:"center", padding:12, borderRadius:10, background:"#f8fafc" }}>
                    <div style={{ fontSize:11, color:"#9ca3af" }}>{s.l}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:"#9ca3af", marginBottom:6 }}>Progression globale</div>
                <ProgressBar value={e.progression} color="#6366f1" height={10} />
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, color:"#9ca3af", marginBottom:6 }}>Assiduité</div>
                <ProgressBar value={e.assiduiteRate} color={e.assiduiteRate>=85?"#22c55e":"#ef4444"} height={10} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:8 }}>Informations</div>
                  {[
                    ["Email",     e.email],
                    ["Téléphone", e.phone],
                    ["Inscrit le",formatDate(e.dateInscription)],
                    ["Dernier cours",formatDate(e.dernierCours)],
                    ["Retards",   e.retards],
                  ].map(([l,v]) => (
                    <div key={l} style={{ display:"flex", padding:"5px 0", borderBottom:"1px solid #f3f4f6", fontSize:12 }}>
                      <span style={{ color:"#9ca3af", width:110 }}>{l}</span>
                      <span style={{ fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:8 }}>Cours inscrits</div>
                  {e.cours.map((c,i) => (
                    <div key={i} style={{ padding:"6px 10px", borderRadius:6, background:"#ede9fe", color:"#5b21b6", fontSize:12, fontWeight:500, marginBottom:6 }}>📚 {c}</div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>{
                  const body = encodeURIComponent(`Bonjour ${e.nom},\n\nVotre tableau de suivi :\n- Progression : ${e.progression}%\n- Assiduité : ${e.assiduiteRate}%\n- Score test : ${e.testScore}%\n\nCordialement`);
                  window.location.href=`mailto:${e.email}?subject=Suivi formation&body=${body}`;
                }} style={btnPrimary}>📧 Envoyer rapport par email</button>
                <button onClick={()=>setShowEmpModal(false)} style={btnSecondary}>Fermer</button>
              </div>
            </Modal>
          );
        })()}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE MANAGER (vue filtrée par équipe)
═══════════════════════════════════════════════════ */
export function ManagerPage() {
  const navigate = useNavigate();
  // Le manager voit uniquement son entreprise (ex: Orange CI = id 1)
  // En production : récupérer depuis le contexte auth
  const monEntrepriseId = 1;
  const monEntreprise   = ENTREPRISES.find(e => e.id === monEntrepriseId);
  const monEquipe       = EMPLOYES_INIT.filter(e => e.entrepriseId === monEntrepriseId);

  const [activeTab, setActiveTab] = useState("equipe");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showModal, setShowModal]     = useState(false);

  const empFiltered = useMemo(() =>
    monEquipe.filter(e =>
      !searchTerm || e.nom.toLowerCase().includes(searchTerm.toLowerCase()) || e.poste.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm]);

  const stats = useMemo(() => ({
    total:   monEquipe.length,
    actifs:  monEquipe.filter(e=>e.statut==="actif").length,
    avgProg: Math.round(monEquipe.reduce((s,e)=>s+e.progression,0)/monEquipe.length),
    avgAss:  Math.round(monEquipe.reduce((s,e)=>s+e.assiduiteRate,0)/monEquipe.length),
    alerts:  monEquipe.filter(e=>e.assiduiteRate<80||e.progression<40).length,
  }), []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" }) : "—";

  const tabs = [
    { key:"equipe",      label:"Mon équipe",   icon:"👥", count:monEquipe.length },
    { key:"assiduite",   label:"Assiduité",    icon:"📅", count:null },
    { key:"progression", label:"Progression",  icon:"📈", count:null },
    { key:"alertes",     label:"À surveiller", icon:"⚠️", count:stats.alerts||null, danger:stats.alerts>0 },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f1f5f9" }}>
      {/* <Sidebar role="manager" /> */}
      <div style={{ flex:1, padding:24, overflowX:"hidden" }}>
        <Toaster position="top-right" />

        {/* HEADER */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
              <span style={{ fontSize:28 }}>{monEntreprise?.logo}</span>
              <h1 style={{ margin:0, fontSize:22, color:"#0f172a", fontWeight:800 }}>Espace Manager — {monEntreprise?.nom}</h1>
            </div>
            <p style={{ margin:0, color:"#6b7280", fontSize:13 }}>
              Suivi de votre équipe · {monEquipe.length} employés inscrits chez BET
            </p>
          </div>
          <button onClick={()=>navigate("/drh")} style={btnSecondary}>📊 Vue DRH complète</button>
        </div>

        {/* STATS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:12, marginBottom:24 }}>
          <StatCard label="Membres équipe"    value={stats.total}           color="#0891b2" icon="👥"  sub={`${stats.actifs} actifs`} />
          <StatCard label="Progression moy."  value={`${stats.avgProg}%`}   color="#6366f1" icon="📈"  sub={stats.avgProg>=60?"✅ Bon niveau":"⚠️ À améliorer"} />
          <StatCard label="Assiduité moy."    value={`${stats.avgAss}%`}    color="#059669" icon="📅"  sub={stats.avgAss>=85?"✅ Bonne présence":"⚠️ À surveiller"} />
          <StatCard label="À surveiller"      value={stats.alerts}          color={stats.alerts>0?"#ef4444":"#9ca3af"} icon="⚠️" sub="assiduité ou progression" />
        </div>

        {/* TABS */}
        <div style={{ display:"flex", gap:3, marginBottom:0, flexWrap:"wrap" }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
                padding:"10px 16px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer",
                fontWeight:600, fontSize:13,
                background: isActive?"#fff":"#e5e7eb",
                color: isActive?"#0891b2":"#6b7280",
                boxShadow: isActive?"0 -2px 6px rgba(0,0,0,0.06)":"none",
                display:"flex", alignItems:"center", gap:6,
              }}>
                <span style={{ fontSize:14 }}>{tab.icon}</span>
                {tab.label}
                {tab.count !== null && tab.count !== undefined && (
                  <span style={{ padding:"1px 7px", borderRadius:10, fontSize:11, fontWeight:700,
                    background: tab.danger?"#fee2e2":isActive?"#e0f2fe":"#d1d5db",
                    color: tab.danger?"#dc2626":isActive?"#0891b2":"#4b5563" }}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ ...card, borderRadius:"0 12px 12px 12px" }}>

          {/* ── MON ÉQUIPE ── */}
          {activeTab === "equipe" && (
            <div>
              <div style={tabHeader}>
                <div><h2 style={tabTitle}>Mon Équipe</h2><p style={tabSubtitle}>{monEntreprise?.nom} · {monEquipe.length} membres</p></div>
              </div>
              <input type="text" placeholder="🔍 Rechercher un membre…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                style={{ ...inputSt, marginBottom:16, width:280 }} />
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
                {empFiltered.map(e => (
                  <div key={e.id} style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:16, background:"#fff", cursor:"pointer" }}
                    onClick={()=>{setSelectedEmp(e);setShowModal(true);}}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                      <div style={{ width:44, height:44, borderRadius:"50%", background:"#e0f2fe", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, color:"#0891b2", flexShrink:0 }}>
                        {e.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{e.nom}</div>
                        <div style={{ fontSize:11, color:"#9ca3af" }}>{e.poste}</div>
                      </div>
                      <div style={{ marginLeft:"auto" }}><StatutBadge statut={e.statut} /></div>
                    </div>
                    <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                      <NiveauBadge niveau={e.niveau} />
                      <span style={{ fontSize:11, color:"#9ca3af", alignSelf:"center" }}>{e.departement}</span>
                    </div>
                    <div style={{ marginBottom:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af", marginBottom:3 }}>
                        <span>Progression</span><span style={{ fontWeight:700, color:"#6366f1" }}>{e.progression}%</span>
                      </div>
                      <ProgressBar value={e.progression} color="#6366f1" />
                    </div>
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af", marginBottom:3 }}>
                        <span>Assiduité</span><span style={{ fontWeight:700, color: e.assiduiteRate>=85?"#22c55e":"#f59e0b" }}>{e.assiduiteRate}%</span>
                      </div>
                      <ProgressBar value={e.assiduiteRate} color={e.assiduiteRate>=85?"#22c55e":"#f59e0b"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ASSIDUITÉ MANAGER ── */}
          {activeTab === "assiduite" && (
            <div>
              <div style={tabHeader}>
                <div><h2 style={tabTitle}>Suivi Assiduité — Mon Équipe</h2><p style={tabSubtitle}>Présence et absences</p></div>
              </div>
              <table style={tableStyle}><thead><tr>
                <th style={th}>Membre</th><th style={th}>Assiduité</th><th style={th}>Absences</th><th style={th}>Retards</th><th style={th}>Dernier cours</th><th style={th}>Statut</th>
              </tr></thead><tbody>
                {[...monEquipe].sort((a,b)=>a.assiduiteRate-b.assiduiteRate).map(e => (
                  <tr key={e.id} style={{ borderTop:"1px solid #f1f5f9", background: e.assiduiteRate<75?"#fff5f5":"transparent" }}>
                    <td style={td}><div style={{ fontWeight:600, fontSize:13 }}>{e.nom}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{e.poste}</div></td>
                    <td style={{ ...td, minWidth:140 }}><AssiduiteBar rate={e.assiduiteRate} /></td>
                    <td style={td}><span style={{ fontWeight:700, color:e.absences>5?"#ef4444":"#374151", fontSize:16 }}>{e.absences}</span></td>
                    <td style={td}><span style={{ fontWeight:700, color:e.retards>4?"#ef4444":"#374151", fontSize:16 }}>{e.retards}</span></td>
                    <td style={{ ...td, fontSize:12, color:"#6b7280" }}>{formatDate(e.dernierCours)}</td>
                    <td style={td}><StatutBadge statut={e.statut} /></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          )}

          {/* ── PROGRESSION MANAGER ── */}
          {activeTab === "progression" && (
            <div>
              <div style={tabHeader}>
                <div><h2 style={tabTitle}>Progression — Mon Équipe</h2><p style={tabSubtitle}>Avancement et résultats</p></div>
              </div>
              {[...monEquipe].sort((a,b)=>b.progression-a.progression).map(e => (
                <div key={e.id} style={{ display:"flex", alignItems:"center", gap:16, padding:"12px 0", borderBottom:"1px solid #f3f4f6" }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:"#e0f2fe", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:"#0891b2", flexShrink:0 }}>
                    {e.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ minWidth:150 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{e.nom}</div>
                    <div style={{ fontSize:11, color:"#9ca3af" }}>{e.poste}</div>
                  </div>
                  <NiveauBadge niveau={e.niveau} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af", marginBottom:4 }}>
                      <span>Progression</span><span style={{ fontWeight:700, color:"#6366f1" }}>{e.progression}%</span>
                    </div>
                    <ProgressBar value={e.progression} color="#6366f1" />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af", marginBottom:4 }}>
                      <span>Score test</span><span style={{ fontWeight:700, color: e.testScore>=60?"#22c55e":"#f59e0b" }}>{e.testScore}%</span>
                    </div>
                    <ProgressBar value={e.testScore} color={e.testScore>=60?"#22c55e":"#f59e0b"} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ALERTES MANAGER ── */}
          {activeTab === "alertes" && (
            <div>
              <div style={tabHeader}>
                <div><h2 style={tabTitle}>Membres à Surveiller</h2><p style={tabSubtitle}>Assiduité faible ou progression insuffisante</p></div>
              </div>
              {monEquipe.filter(e=>e.assiduiteRate<80||e.progression<40).length === 0 ? (
                <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
                  <p>Toute l'équipe est dans les normes !</p>
                </div>
              ) : monEquipe.filter(e=>e.assiduiteRate<80||e.progression<40).map(e => (
                <div key={e.id} style={{ padding:16, borderRadius:10, border:"1px solid #fca5a5", background:"#fff5f5", marginBottom:12, display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, color:"#dc2626" }}>
                    {e.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{e.nom} <span style={{ fontSize:12, color:"#9ca3af", fontWeight:400 }}>· {e.poste}</span></div>
                    <div style={{ display:"flex", gap:16, marginTop:6, flexWrap:"wrap" }}>
                      {e.assiduiteRate<80 && <span style={{ fontSize:12, color:"#dc2626" }}>⚠️ Assiduité : {e.assiduiteRate}% (seuil 80%)</span>}
                      {e.progression<40  && <span style={{ fontSize:12, color:"#dc2626" }}>⚠️ Progression : {e.progression}% (seuil 40%)</span>}
                      <span style={{ fontSize:12, color:"#6b7280" }}>Absences : {e.absences} · Retards : {e.retards}</span>
                    </div>
                  </div>
                  <button onClick={()=>{
                    const body = encodeURIComponent(`Bonjour ${e.nom},\n\nNous souhaitons faire un point sur votre formation.\nAssiduité actuelle : ${e.assiduiteRate}%\nProgression : ${e.progression}%\n\nMerci de vous manifester.\n\nCordialement, votre Manager`);
                    window.location.href=`mailto:${e.email}?subject=Point formation&body=${body}`;
                  }} style={btnPrimary}>📧 Contacter</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL DÉTAIL EMPLOYÉ (Manager) */}
        {showModal && selectedEmp && (
          <Modal title="Détail du membre" onClose={()=>setShowModal(false)}>
            <div style={{ display:"flex", alignItems:"center", gap:14, paddingBottom:16, borderBottom:"1px solid #e5e7eb", marginBottom:16 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:"#e0f2fe", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:"#0891b2" }}>
                {selectedEmp.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:800 }}>{selectedEmp.nom}</div>
                <div style={{ fontSize:12, color:"#6b7280" }}>{selectedEmp.poste} · {selectedEmp.departement}</div>
                <div style={{ display:"flex", gap:6, marginTop:4 }}><StatutBadge statut={selectedEmp.statut} /><NiveauBadge niveau={selectedEmp.niveau} /></div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {[
                { l:"Progression",  v:`${selectedEmp.progression}%`,   c:"#6366f1" },
                { l:"Assiduité",    v:`${selectedEmp.assiduiteRate}%`,  c:selectedEmp.assiduiteRate>=85?"#22c55e":"#ef4444" },
                { l:"Score test",   v:`${selectedEmp.testScore}%`,      c:selectedEmp.testScore>=60?"#22c55e":"#f59e0b" },
                { l:"Absences",     v:selectedEmp.absences,             c:selectedEmp.absences>5?"#ef4444":"#374151" },
              ].map(s => (
                <div key={s.l} style={{ textAlign:"center", padding:12, borderRadius:8, background:"#f8fafc" }}>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{s.l}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:6 }}>Cours inscrits</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
              {selectedEmp.cours.map((c,i) => <span key={i} style={{ padding:"4px 10px", borderRadius:6, background:"#ede9fe", color:"#5b21b6", fontSize:12 }}>📚 {c}</span>)}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{
                const body=encodeURIComponent(`Bonjour ${selectedEmp.nom},\n\nVotre suivi :\n- Progression : ${selectedEmp.progression}%\n- Assiduité : ${selectedEmp.assiduiteRate}%\n\nCordialement`);
                window.location.href=`mailto:${selectedEmp.email}?subject=Suivi formation&body=${body}`;
              }} style={btnPrimary}>📧 Envoyer un rapport</button>
              <button onClick={()=>setShowModal(false)} style={btnSecondary}>Fermer</button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

/* ═══ STYLES ═══ */
const sidebarStyle     = { width:200, minWidth:200, background:"#0f172a", color:"#fff", padding:20, minHeight:"100vh" };
const sidebarItemStyle = { padding:12, marginBottom:8, borderRadius:8, cursor:"pointer", fontSize:13, color:"#fff" };
const card             = { background:"#fff", padding:24, boxShadow:"0 2px 8px rgba(0,0,0,0.05)" };
const tableStyle       = { width:"100%", borderCollapse:"collapse" };
const th               = { padding:"10px 12px", textAlign:"left", fontSize:12, color:"#6b7280", background:"#f9fafb", fontWeight:600 };
const td               = { padding:"10px 12px", fontSize:13, verticalAlign:"middle" };
const tabHeader        = { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 };
const tabTitle         = { margin:0, fontSize:17, fontWeight:700, color:"#0f172a" };
const tabSubtitle      = { margin:"3px 0 0", fontSize:12, color:"#9ca3af" };
const blockTitle       = { fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:16, margin:"0 0 16px" };
const btnPrimary       = { padding:"9px 16px", background:"#0891b2", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnSecondary     = { padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnIconEdit      = { padding:"5px 10px", background:"#e0f2fe", color:"#0891b2", border:"1px solid #bae6fd", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600 };
const modalOverlay     = { position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 };
const modalBox         = { background:"#fff", padding:24, borderRadius:14, maxWidth:"92vw" };
const inputSt          = { padding:9, marginBottom:10, width:"100%", borderRadius:6, border:"1px solid #d1d5db", boxSizing:"border-box", fontSize:13 };
const labelSt          = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 };