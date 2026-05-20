// src/Pages/SuperviseurDashboard/SuperviseurDashboard.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import NotificationBell from "../../Components/NotificationBell";
import { useNotifPoller } from "../../hooks/useNotifPoller";
import NotificationsTab from "../../Components/NotificationsTab";

const PRIMARY_COLOR   = "#b45309";
const PRIMARY_LIGHT   = "#fffbeb";
const GRADIENT_HEADER = "linear-gradient(135deg, #0f172a 0%, #b45309 100%)";
const FF              = "'Inter','Segoe UI',sans-serif";

/* ─── Composants ─── */
const StatCard = ({ label, value, color, icon, sub, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff", padding:16, borderRadius:12, boxShadow:"0 1px 6px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:12, cursor:onClick?"pointer":"default", border:"1px solid #f1f5f9" }}>
    <div style={{ width:46, height:46, borderRadius:10, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{icon}</div>
    <div style={{ minWidth:0 }}>
      <div style={{ fontSize:11, color:"#9ca3af" }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:800, color, lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>{sub}</div>}
    </div>
  </div>
);

const Badge = ({ label, color, bg }) => (
  <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:700, color, background:bg, whiteSpace:"nowrap" }}>{label}</span>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:16 }}>
    <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:wide?700:540, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.2)", padding:28 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:8, width:32, height:32, fontSize:16, cursor:"pointer" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Th = ({ children }) => (
  <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".04em", borderBottom:"1px solid #e5e7eb", background:"#f8fafc", whiteSpace:"nowrap" }}>{children}</th>
);
const Td = ({ children, bold, color }) => (
  <td style={{ padding:"10px 14px", fontSize:13, fontWeight:bold?700:400, color:color||"inherit", borderBottom:"1px solid #f1f5f9" }}>{children}</td>
);

/* ─── Données mock ─── */
const CENTRES  = ["Cocody","Plateau","Yopougon","Marcory","Abobo"];
const CLASSES  = ["Anglais A1-Matin","Anglais B1-Soir","TOEIC Intensif","Business B2","Enfants A1"];

const INIT_APPRENANTS = [
  { id:1,  nom:"Kouamé Yao",      classe:"TOEIC Intensif",    centre:"Cocody",   presences:8,  absences:2, total:10, note_eval:14, alerte:false },
  { id:2,  nom:"N'Guessan Aya",   classe:"Anglais A1-Matin",  centre:"Cocody",   presences:5,  absences:5, total:10, note_eval:8,  alerte:true  },
  { id:3,  nom:"Traoré Ibou",     classe:"Business B2",       centre:"Plateau",  presences:9,  absences:1, total:10, note_eval:16, alerte:false },
  { id:4,  nom:"Bah Mariam",      classe:"Anglais A1-Matin",  centre:"Yopougon", presences:3,  absences:7, total:10, note_eval:6,  alerte:true  },
  { id:5,  nom:"Koné Drissa",     classe:"TOEIC Intensif",    centre:"Cocody",   presences:10, absences:0, total:10, note_eval:18, alerte:false },
  { id:6,  nom:"Diallo Aïssatou", classe:"Enfants A1",        centre:"Marcory",  presences:7,  absences:3, total:10, note_eval:12, alerte:false },
  { id:7,  nom:"Sanogo Moussa",   classe:"Business B2",       centre:"Plateau",  presences:4,  absences:6, total:10, note_eval:9,  alerte:true  },
  { id:8,  nom:"Bamba Kadiatou",  classe:"Anglais B1-Soir",   centre:"Abobo",    presences:8,  absences:2, total:10, note_eval:13, alerte:false },
];

const INIT_COACHES = [
  { id:1, nom:"Koné Awa",        classe:"TOEIC Intensif",   centre:"Cocody",   heures_planif:20, heures_reelles:20, retards:0, absences:0, note_qualite:4.7 },
  { id:2, nom:"Diallo Mamadou",  classe:"Anglais A1-Matin", centre:"Cocody",   heures_planif:18, heures_reelles:16, retards:2, absences:1, note_qualite:3.8 },
  { id:3, nom:"Touré Fatoumata", classe:"Anglais B1-Soir",  centre:"Abobo",    heures_planif:15, heures_reelles:15, retards:0, absences:0, note_qualite:4.5 },
  { id:4, nom:"Bamba Seydou",    classe:"Business B2",      centre:"Plateau",  heures_planif:22, heures_reelles:20, retards:1, absences:1, note_qualite:4.2 },
  { id:5, nom:"Coulibaly Aïda",  classe:"Enfants A1",       centre:"Marcory",  heures_planif:16, heures_reelles:14, retards:3, absences:0, note_qualite:3.5 },
];

const INIT_INCIDENTS = [
  { id:1, type:"Absentéisme",    coach:"Diallo Mamadou",  apprenant:null,       date:"2026-05-10", gravite:"moyenne", statut:"ouvert",  cible:"RH",          description:"2ème absence non justifiée ce mois-ci.", escalade:null },
  { id:2, type:"Absentéisme",    coach:null,              apprenant:"Bah Mariam",date:"2026-05-09", gravite:"haute",   statut:"ouvert",  cible:"Responsable", description:"7 absences sur 10 — risque abandon.", escalade:null },
  { id:3, type:"Conflit",        coach:"Coulibaly Aïda",  apprenant:null,       date:"2026-05-08", gravite:"haute",   statut:"escaladé",cible:"Manager",      description:"Incident pédagogique signalé par les apprenants.", escalade:"Transmis au Manager" },
  { id:4, type:"Qualité",        coach:"Diallo Mamadou",  apprenant:null,       date:"2026-05-07", gravite:"moyenne", statut:"fermé",   cible:"RH",          description:"Note qualité < 4.0 — entretien effectué.", escalade:null },
  { id:5, type:"Absentéisme",    coach:null,              apprenant:"Sanogo Moussa",date:"2026-05-06", gravite:"haute",statut:"ouvert", cible:"Responsable", description:"6 absences sans justificatif — contrat en risque.", escalade:null },
];

const EVAL_APPRENANTS = [
  { id:1, apprenant:"Kouamé Yao",    coach:"Koné Awa",       note:4.8, commentaire:"Excellent cours, très bien préparé", date:"2026-05-08" },
  { id:2, apprenant:"N'Guessan Aya", coach:"Diallo Mamadou", note:2.5, commentaire:"Cours trop rapide, peu d'interactions", date:"2026-05-09" },
  { id:3, apprenant:"Traoré Ibou",   coach:"Bamba Seydou",   note:4.5, commentaire:"Très bon niveau, exercises variés", date:"2026-05-07" },
  { id:4, apprenant:"Bah Mariam",    coach:"Diallo Mamadou", note:2.8, commentaire:"Méthode pas adaptée au niveau A1", date:"2026-05-10" },
  { id:5, apprenant:"Koné Drissa",   coach:"Koné Awa",       note:5.0, commentaire:"Parfait ! Très motivant", date:"2026-05-08" },
];

const GRAVITE = {
  haute:   { color:"#dc2626", bg:"#fee2e2" },
  moyenne: { color:"#d97706", bg:"#fef3c7" },
  basse:   { color:"#6b7280", bg:"#f3f4f6" },
};

const fmtD = d => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}) : "—";

/* ═══════════════════════════════════════════════════════ */
export default function SuperviseurDashboard() {
  const navigate   = useNavigate();
  const profil     = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom     = profil?.prenom || "";
  const nom        = profil?.nom    || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || "Superviseur";
  const initiales  = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "SV";

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace:true });
  };

  useNotifPoller({ userId:profil?.id, sources:["presences","incidents"] });

  const [activeTab,     setActiveTab]     = useState("dashboard");
  const [apprenants,    setApprenants]    = useState(INIT_APPRENANTS);
  const [coaches,       setCoaches]       = useState(INIT_COACHES);
  const [incidents,     setIncidents]     = useState(INIT_INCIDENTS);
  const [filtreCentre,  setFiltreCentre]  = useState("Tous");
  const [filtreClasse,  setFiltreClasse]  = useState("Toutes");
  const [searchQ,       setSearchQ]       = useState("");
  const [showIncident,  setShowIncident]  = useState(false);
  const [incidentForm,  setIncidentForm]  = useState({ type:"Absentéisme", coach:"", apprenant:"", description:"", gravite:"moyenne", cible:"RH" });

  const stats = useMemo(() => ({
    alertes:       apprenants.filter(a=>a.alerte).length,
    tauxAssid:     Math.round(apprenants.reduce((s,a)=>s+(a.presences/a.total)*100,0)/apprenants.length),
    coachsPb:      coaches.filter(c=>c.retards>1||c.absences>0||c.note_qualite<4.0).length,
    incidentsOuverts: incidents.filter(i=>i.statut==="ouvert").length,
    evalFaibles:   EVAL_APPRENANTS.filter(e=>e.note<3.5).length,
  }), [apprenants, coaches, incidents]);

  const apprenantsFiltres = useMemo(() =>
    apprenants.filter(a => {
      const cMatch = filtreCentre==="Tous" || a.centre===filtreCentre;
      const klMatch = filtreClasse==="Toutes" || a.classe===filtreClasse;
      const qMatch  = !searchQ || a.nom.toLowerCase().includes(searchQ.toLowerCase());
      return cMatch && klMatch && qMatch;
    })
  , [apprenants, filtreCentre, filtreClasse, searchQ]);

  const coachesFiltres = useMemo(() =>
    coaches.filter(c => filtreCentre==="Tous" || c.centre===filtreCentre)
  , [coaches, filtreCentre]);

  const handleSignalerIncident = () => {
    if (!incidentForm.description.trim()) { toast.error("Décrivez l'incident"); return; }
    const nouveau = {
      id: Date.now(), ...incidentForm,
      date: new Date().toISOString().slice(0,10),
      statut:"ouvert", escalade:null,
      coach: incidentForm.coach || null,
      apprenant: incidentForm.apprenant || null,
    };
    setIncidents(p => [nouveau, ...p]);
    toast.success(`Incident signalé → ${incidentForm.cible}`);
    setShowIncident(false);
    setIncidentForm({ type:"Absentéisme", coach:"", apprenant:"", description:"", gravite:"moyenne", cible:"RH" });
  };

  const handleEscalade = (id, cible) => {
    setIncidents(p => p.map(i => i.id===id ? {...i, statut:"escaladé", escalade:`Transmis au ${cible}`} : i));
    toast.success(`Incident escaladé au ${cible}`);
  };

  const selectSt = { padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, background:"#fff", fontFamily:FF };

  const TABS = [
    { key:"dashboard",     label:"Tableau de bord",    icon:"📊" },
    { key:"assiduite",     label:"Assiduité apprenants",icon:"📅", badge:stats.alertes },
    { key:"horaires",      label:"Horaires coaches",    icon:"⏱️", badge:stats.coachsPb },
    { key:"qualite",       label:"Rapports qualité",    icon:"⭐", badge:stats.evalFaibles },
    { key:"incidents",     label:"Alertes & escalades", icon:"🚨", badge:stats.incidentsOuverts },
    { key:"notifications", label:"Notifications",       icon:"🔔", count: null },
  ];

  const assidColor = (pct) => pct>=90?"#16a34a":pct>=70?"#d97706":"#dc2626";
  const starRating = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5-Math.round(n));

  return (
    <div style={{ minHeight:"100vh", background:PRIMARY_LIGHT, fontFamily:FF }}>
      <Toaster position="top-right" />

      {/* ── HERO ── */}
      <div style={{ background:GRADIENT_HEADER, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
        <div style={{ position:"absolute", bottom:-60, right:80, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }} />
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
            <div>
              <div style={{ fontSize:11, color:"#fde68a", fontWeight:600, letterSpacing:"0.08em" }}>Bonjour 👋</div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{nomComplet}</h1>
              <div style={{ fontSize:12, color:"#fde68a", marginTop:3 }}>🔍 Superviseur · {profil?.email || ""}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {stats.incidentsOuverts > 0 && (
              <div style={{ background:"rgba(239,68,68,.28)", border:"1px solid rgba(239,68,68,.5)", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}
                onClick={()=>setActiveTab("incidents")}>
                🚨 {stats.incidentsOuverts} incident{stats.incidentsOuverts>1?"s":""} ouverts
              </div>
            )}
            <NotificationBell userId={profil?.id} />
            <button onClick={handleLogout}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
              <span>🚪</span> Déconnexion
            </button>
          </div>
        </div>
        <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden", position:"relative", zIndex:1 }}>
          {[
            { l:"Alertes absentéisme", v:stats.alertes,          c:"#fca5a5" },
            { l:"Taux assiduité moy.", v:`${stats.tauxAssid}%`,  c:"#fde68a" },
            { l:"Coaches à surveiller",v:stats.coachsPb,          c:"#fbbf24" },
            { l:"Incidents ouverts",   v:stats.incidentsOuverts,  c:"#fca5a5" },
          ].map((s,i,arr)=>(
            <div key={s.l} style={{ flex:1, textAlign:"center", padding:"14px 8px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.08)":"none" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>{s.l}</div>
              <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 24px 32px" }}>
        <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", overflow:"hidden" }}>
          <div style={{ display:"flex", gap:0, borderBottom:"1px solid #e5e7eb", overflowX:"auto", background:"#fafafa" }}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
                padding:"12px 15px", border:"none",
                borderBottom:activeTab===t.key?`3px solid ${PRIMARY_COLOR}`:"3px solid transparent",
                cursor:"pointer", fontWeight:600, fontSize:12, whiteSpace:"nowrap",
                background:"transparent", color:activeTab===t.key?PRIMARY_COLOR:"#6b7280",
                display:"flex", alignItems:"center", gap:6, transition:"color .15s",
              }}>
                <span>{t.icon}</span>{t.label}
                {t.badge>0 && <span style={{ background:"#ef4444", color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"1px 6px" }}>{t.badge}</span>}
              </button>
            ))}
          </div>

          <div style={{ padding:24 }}>

            {/* ══════ DASHBOARD ══════ */}
            {activeTab==="dashboard" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                  <StatCard label="Alertes absentéisme" value={stats.alertes}          icon="🚨" color="#dc2626" onClick={()=>setActiveTab("assiduite")} />
                  <StatCard label="Taux assiduité"       value={`${stats.tauxAssid}%`}  icon="📅" color={assidColor(stats.tauxAssid)} sub="moyenne classe" />
                  <StatCard label="Coaches à surveiller" value={stats.coachsPb}         icon="⚠️" color="#d97706" onClick={()=>setActiveTab("horaires")} />
                  <StatCard label="Incidents ouverts"    value={stats.incidentsOuverts} icon="🔔" color="#dc2626" onClick={()=>setActiveTab("incidents")} />
                </div>

                {/* Alertes actives */}
                {(stats.alertes>0 || stats.evalFaibles>0) && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {apprenants.filter(a=>a.alerte).map(a=>(
                      <div key={a.id} style={{ padding:"10px 16px", background:"#fff5f5", border:"1px solid #fca5a5", borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, cursor:"pointer" }}
                        onClick={()=>setActiveTab("assiduite")}>
                        <span>🔴 <strong>{a.nom}</strong> — {a.absences} absence{a.absences>1?"s":""}/{a.total} séances · Classe : {a.classe}</span>
                        <span style={{ fontSize:11, color:"#94a3b8" }}>Voir →</span>
                      </div>
                    ))}
                    {EVAL_APPRENANTS.filter(e=>e.note<3.5).map(e=>(
                      <div key={e.id} style={{ padding:"10px 16px", background:"#fef9c3", border:"1px solid #fcd34d", borderRadius:10, display:"flex", justifyContent:"space-between", fontSize:13, cursor:"pointer" }}
                        onClick={()=>setActiveTab("qualite")}>
                        <span>⭐ Éval faible ({e.note}/5) — Coach : <strong>{e.coach}</strong> · par {e.apprenant}</span>
                        <span style={{ fontSize:11, color:"#94a3b8" }}>Voir →</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Aperçu assiduité + horaires */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div style={{ background:"#fff", borderRadius:12, padding:20, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                    <div style={{ fontWeight:800, fontSize:14, marginBottom:14, display:"flex", justifyContent:"space-between" }}>
                      <span>📅 Assiduité apprenants</span>
                      <button onClick={()=>setActiveTab("assiduite")} style={{ fontSize:12, color:PRIMARY_COLOR, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Voir tout →</button>
                    </div>
                    {apprenants.slice(0,5).map(a=>{
                      const pct = Math.round((a.presences/a.total)*100);
                      const c   = assidColor(pct);
                      return (
                        <div key={a.id} style={{ marginBottom:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                            <span style={{ fontWeight:600 }}>{a.nom} {a.alerte&&"🔴"}</span>
                            <span style={{ fontWeight:700, color:c }}>{pct}%</span>
                          </div>
                          <div style={{ height:5, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:c, borderRadius:3 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background:"#fff", borderRadius:12, padding:20, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                    <div style={{ fontWeight:800, fontSize:14, marginBottom:14, display:"flex", justifyContent:"space-between" }}>
                      <span>⏱️ Heures coaches</span>
                      <button onClick={()=>setActiveTab("horaires")} style={{ fontSize:12, color:PRIMARY_COLOR, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Voir tout →</button>
                    </div>
                    {coaches.map(c=>{
                      const pct  = Math.round((c.heures_reelles/c.heures_planif)*100);
                      const prob = c.retards>1||c.absences>0||c.note_qualite<4.0;
                      return (
                        <div key={c.id} style={{ marginBottom:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                            <span style={{ fontWeight:600 }}>{c.nom} {prob&&"⚠️"}</span>
                            <span style={{ fontWeight:700, color:prob?"#d97706":"#16a34a" }}>{c.heures_reelles}/{c.heures_planif}h</span>
                          </div>
                          <div style={{ height:5, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:prob?"#d97706":"#16a34a", borderRadius:3 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══════ ASSIDUITÉ ══════ */}
            {activeTab==="assiduite" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <input placeholder="🔍 Chercher apprenant…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{ ...selectSt, width:200 }} />
                  <select value={filtreCentre} onChange={e=>setFiltreCentre(e.target.value)} style={selectSt}>
                    <option value="Tous">Tous centres</option>
                    {CENTRES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <select value={filtreClasse} onChange={e=>setFiltreClasse(e.target.value)} style={selectSt}>
                    <option value="Toutes">Toutes classes</option>
                    {CLASSES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>

                <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Apprenant","Classe","Centre","Présences","Absences","Taux","Note eval","Statut",""].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {apprenantsFiltres.map(a=>{
                        const pct = Math.round((a.presences/a.total)*100);
                        const c   = assidColor(pct);
                        return (
                          <tr key={a.id} style={{ background:a.alerte?"#fff5f5":"#fff" }}>
                            <Td bold>{a.nom} {a.alerte&&"🔴"}</Td>
                            <Td>{a.classe}</Td>
                            <Td>{a.centre}</Td>
                            <Td color="#16a34a" bold>{a.presences}</Td>
                            <Td color={a.absences>3?"#dc2626":"inherit"} bold={a.absences>3}>{a.absences}</Td>
                            <Td>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:60, height:5, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                                  <div style={{ height:"100%", width:`${pct}%`, background:c, borderRadius:3 }} />
                                </div>
                                <span style={{ fontSize:12, fontWeight:700, color:c }}>{pct}%</span>
                              </div>
                            </Td>
                            <Td color={a.note_eval<10?"#dc2626":a.note_eval>=15?"#16a34a":"inherit"} bold>{a.note_eval}/20</Td>
                            <Td>
                              <Badge label={a.alerte?"Alerte":"OK"} color={a.alerte?"#dc2626":"#16a34a"} bg={a.alerte?"#fee2e2":"#dcfce7"} />
                            </Td>
                            <Td>
                              {a.alerte && (
                                <button onClick={()=>{ setIncidentForm(f=>({...f, apprenant:a.nom, type:"Absentéisme", cible:"Responsable"})); setShowIncident(true); }}
                                  style={{ padding:"5px 10px", background:"#fee2e2", border:"1px solid #fca5a5", color:"#dc2626", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                                  🚨 Escalader
                                </button>
                              )}
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════ HORAIRES COACHES ══════ */}
            {activeTab==="horaires" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"flex", gap:8 }}>
                  <select value={filtreCentre} onChange={e=>setFiltreCentre(e.target.value)} style={selectSt}>
                    <option value="Tous">Tous centres</option>
                    {CENTRES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {coachesFiltres.map(c=>{
                    const pct  = Math.round((c.heures_reelles/c.heures_planif)*100);
                    const prob = c.retards>1||c.absences>0||c.note_qualite<4.0;
                    const cPct = pct>=95?"#16a34a":pct>=80?"#d97706":"#dc2626";
                    return (
                      <div key={c.id} style={{ background:prob?"#fffbeb":"#fff", borderRadius:12, padding:"16px 20px", border:`1.5px solid ${prob?"#fcd34d":"#e5e7eb"}`, boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div>
                            <div style={{ fontWeight:800, fontSize:14 }}>{c.nom} {prob&&<span style={{ fontSize:12, color:"#d97706" }}>⚠️ À surveiller</span>}</div>
                            <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>{c.classe} · {c.centre}</div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontWeight:800, fontSize:16, color:cPct }}>{c.heures_reelles}h / {c.heures_planif}h planif.</div>
                            <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Taux réalisation : {pct}%</div>
                          </div>
                        </div>
                        <div style={{ marginTop:12, display:"flex", gap:14 }}>
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:11, color:"#94a3b8" }}>Retards</div>
                            <div style={{ fontWeight:800, color:c.retards>1?"#dc2626":"#16a34a", fontSize:18 }}>{c.retards}</div>
                          </div>
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:11, color:"#94a3b8" }}>Absences</div>
                            <div style={{ fontWeight:800, color:c.absences>0?"#dc2626":"#16a34a", fontSize:18 }}>{c.absences}</div>
                          </div>
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:11, color:"#94a3b8" }}>Note qualité</div>
                            <div style={{ fontWeight:800, color:c.note_qualite<4.0?"#dc2626":"#16a34a", fontSize:18 }}>{c.note_qualite}/5</div>
                          </div>
                          <div style={{ flex:1, display:"flex", alignItems:"center" }}>
                            <div style={{ width:"100%", height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${pct}%`, background:cPct, borderRadius:3 }} />
                            </div>
                          </div>
                        </div>
                        {prob && (
                          <div style={{ marginTop:12, display:"flex", justifyContent:"flex-end" }}>
                            <button onClick={()=>{ setIncidentForm(f=>({...f, coach:c.nom, type:c.absences>0?"Absentéisme":"Qualité", cible:"RH"})); setShowIncident(true); }}
                              style={{ padding:"7px 14px", background:"#fffbeb", border:"1px solid #fcd34d", color:"#b45309", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                              🚨 Signaler au RH
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════ QUALITÉ ══════ */}
            {activeTab==="qualite" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                  <StatCard label="Note moy. évaluations" value={`${(EVAL_APPRENANTS.reduce((s,e)=>s+e.note,0)/EVAL_APPRENANTS.length).toFixed(1)}/5`} icon="⭐" color="#d97706" />
                  <StatCard label="Évals < 3.5/5"         value={stats.evalFaibles} icon="⚠️" color="#dc2626" sub="nécessitent attention" />
                  <StatCard label="Évals ≥ 4.5/5"         value={EVAL_APPRENANTS.filter(e=>e.note>=4.5).length} icon="🏆" color="#16a34a" />
                </div>

                {/* Évals faibles — alertes */}
                {EVAL_APPRENANTS.filter(e=>e.note<3.5).length>0 && (
                  <div style={{ background:"#fef9c3", border:"1.5px solid #fcd34d", borderRadius:12, padding:"14px 18px" }}>
                    <div style={{ fontWeight:800, fontSize:13, color:"#92400e", marginBottom:10 }}>⚠️ Évaluations faibles — action recommandée</div>
                    {EVAL_APPRENANTS.filter(e=>e.note<3.5).map(e=>(
                      <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #fde68a" }}>
                        <div>
                          <span style={{ fontWeight:700 }}>Coach : {e.coach}</span>
                          <span style={{ fontSize:12, color:"#64748b", marginLeft:8 }}>par {e.apprenant} · {fmtD(e.date)}</span>
                          <div style={{ fontSize:12, color:"#92400e", marginTop:3, fontStyle:"italic" }}>"{e.commentaire}"</div>
                        </div>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <span style={{ fontWeight:900, color:"#dc2626", fontSize:16 }}>{e.note}/5</span>
                          <button onClick={()=>{ setIncidentForm(f=>({...f,coach:e.coach,type:"Qualité",cible:"RH"})); setShowIncident(true); }}
                            style={{ padding:"5px 10px", background:"#fee2e2", border:"1px solid #fca5a5", color:"#dc2626", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                            Signaler RH
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Toutes les évaluations */}
                <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
                  <div style={{ padding:"14px 20px", fontWeight:800, fontSize:14, borderBottom:"1px solid #f1f5f9" }}>Toutes les évaluations</div>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Apprenant","Coach","Note","Commentaire","Date"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {EVAL_APPRENANTS.sort((a,b)=>a.note-b.note).map(e=>(
                        <tr key={e.id} style={{ background:e.note<3.5?"#fffbeb":"#fff" }}>
                          <Td>{e.apprenant}</Td>
                          <Td bold>{e.coach}</Td>
                          <Td>
                            <span style={{ fontWeight:800, color:e.note>=4.5?"#16a34a":e.note>=3.5?"#d97706":"#dc2626" }}>{e.note}/5</span>
                            <span style={{ fontSize:12, color:"#fbbf24", marginLeft:6 }}>{starRating(e.note)}</span>
                          </Td>
                          <Td><span style={{ fontSize:12, fontStyle:"italic", color:"#64748b" }}>"{e.commentaire}"</span></Td>
                          <Td>{fmtD(e.date)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════ INCIDENTS ══════ */}
            {activeTab==="notifications" && (
              <div style={{ padding: "24px 0" }}>
                <NotificationsTab userId={profil?.id} accentColor="#b45309" />
              </div>
            )}

            {activeTab==="incidents" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:13, color:"#64748b" }}>{incidents.filter(i=>i.statut==="ouvert").length} incident{incidents.filter(i=>i.statut==="ouvert").length>1?"s":""} ouverts</div>
                  <button onClick={()=>setShowIncident(true)} style={{ padding:"8px 18px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    + Signaler un incident
                  </button>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {incidents.map(inc=>{
                    const g = GRAVITE[inc.gravite]||GRAVITE.basse;
                    return (
                      <div key={inc.id} style={{ background:inc.statut==="ouvert"?"#fff":"#f8fafc", borderRadius:12, padding:"16px 20px", border:`1.5px solid ${inc.statut==="ouvert"?g.color+"50":"#e5e7eb"}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                          <div>
                            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                              <Badge label={inc.type} color="#374151" bg="#f1f5f9" />
                              <Badge label={inc.gravite.charAt(0).toUpperCase()+inc.gravite.slice(1)} color={g.color} bg={g.bg} />
                              <Badge label={inc.statut==="ouvert"?"Ouvert":inc.statut==="escaladé"?"Escaladé":"Fermé"} color={inc.statut==="ouvert"?"#dc2626":inc.statut==="escaladé"?"#7c3aed":"#16a34a"} bg={inc.statut==="ouvert"?"#fee2e2":inc.statut==="escaladé"?"#ede9fe":"#dcfce7"} />
                            </div>
                            <div style={{ fontSize:13, color:"#0f172a", fontWeight:600 }}>
                              {inc.coach&&<span>👨‍🏫 {inc.coach}</span>}
                              {inc.coach&&inc.apprenant&&<span style={{ color:"#94a3b8", margin:"0 6px" }}>·</span>}
                              {inc.apprenant&&<span>👤 {inc.apprenant}</span>}
                            </div>
                            <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>{inc.description}</div>
                            {inc.escalade && <div style={{ fontSize:11, color:"#7c3aed", marginTop:4, fontWeight:600 }}>↗ {inc.escalade}</div>}
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <div style={{ fontSize:11, color:"#94a3b8" }}>{fmtD(inc.date)}</div>
                            <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>→ {inc.cible}</div>
                          </div>
                        </div>
                        {inc.statut==="ouvert" && (
                          <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
                            {["RH","Responsable","Manager"].filter(c=>c!==inc.cible).map(c=>(
                              <button key={c} onClick={()=>handleEscalade(inc.id,c)} style={{ padding:"6px 12px", background:"#ede9fe", border:"1px solid #c4b5fd", color:"#7c3aed", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                                ↗ Escalader au {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal incident */}
      {showIncident && (
        <Modal title="🚨 Signaler un incident" onClose={()=>setShowIncident(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Type d'incident</label>
                <select value={incidentForm.type} onChange={e=>setIncidentForm(p=>({...p,type:e.target.value}))} style={{ ...selectSt, width:"100%" }}>
                  {["Absentéisme","Conflit","Qualité","Problème pédagogique","Autre"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Gravité</label>
                <select value={incidentForm.gravite} onChange={e=>setIncidentForm(p=>({...p,gravite:e.target.value}))} style={{ ...selectSt, width:"100%" }}>
                  <option value="basse">Basse</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Coach concerné</label>
                <input value={incidentForm.coach} onChange={e=>setIncidentForm(p=>({...p,coach:e.target.value}))} placeholder="Nom du coach…" style={{ ...selectSt, width:"100%" }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Apprenant concerné</label>
                <input value={incidentForm.apprenant} onChange={e=>setIncidentForm(p=>({...p,apprenant:e.target.value}))} placeholder="Nom de l'apprenant…" style={{ ...selectSt, width:"100%" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Transmettre à</label>
              <select value={incidentForm.cible} onChange={e=>setIncidentForm(p=>({...p,cible:e.target.value}))} style={{ ...selectSt, width:"100%" }}>
                <option value="RH">RH</option>
                <option value="Responsable">Responsable</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Description *</label>
              <textarea rows={3} placeholder="Décrivez l'incident en détail…" value={incidentForm.description} onChange={e=>setIncidentForm(p=>({...p,description:e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, fontFamily:FF, resize:"vertical", boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button onClick={()=>setShowIncident(false)} style={{ padding:"8px 16px", border:"1px solid #e5e7eb", borderRadius:8, cursor:"pointer", background:"#fff" }}>Annuler</button>
              <button onClick={handleSignalerIncident} style={{ padding:"8px 18px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer" }}>🚨 Signaler</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
