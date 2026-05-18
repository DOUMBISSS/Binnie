// src/Pages/PedagogicalAdvisorDashboard/PedagogicalAdvisorDashboard.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import NotificationBell from "../../Components/NotificationBell";
import { useNotifPoller } from "../../hooks/useNotifPoller";

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

const formatMoney = (v) => (v||0).toLocaleString("fr-FR") + " FCFA";
const formatDate  = (d) => new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });

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
    { id:"dashboard",   icon:"🏠", label:"Tableau de bord" },
    { id:"cours",       icon:"📚", label:"Cours privés"    },
    { id:"attribution", icon:"🎯", label:"Attribution coach"},
    { id:"honoraires",  icon:"💰", label:"Honoraires"      },
    { id:"validation",  icon:"✅", label:"Validation"      },
    { id:"suivi",       icon:"📈", label:"Suivi pédago"    },
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
              </button>
            ))}
          </div>

          <div style={{ padding:24 }}>

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
    </div>
  );
}
