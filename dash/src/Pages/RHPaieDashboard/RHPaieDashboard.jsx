// src/Pages/RHPaieDashboard/RHPaieDashboard.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import NotificationBell from "../../Components/NotificationBell";
import { useNotifPoller } from "../../hooks/useNotifPoller";
import NotificationsTab from "../../Components/NotificationsTab";

const PRIMARY_COLOR   = "#0d9488";
const PRIMARY_LIGHT   = "#ccfbf1";
const GRADIENT_HEADER = "linear-gradient(135deg, #0f172a 0%, #0d9488 100%)";
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
    <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:wide?740:540, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.2)", padding:28 }}>
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
const PERIODES = ["Mai 2026","Avr 2026","Mars 2026","Fév 2026","Jan 2026"];

const INIT_CONTRATS = [
  { id:1, nom:"Koné Awa",        email:"kone.awa@bet.ci",        contrat:"CDI",      niveau:"B1/B2/C1", tarif_h:8000,  centre:"Cocody",   statut:"actif",    date_debut:"2024-01-15" },
  { id:2, nom:"Diallo Mamadou",  email:"diallo.m@bet.ci",        contrat:"Vacataire",niveau:"A2/B1/B2", tarif_h:7500,  centre:"Plateau",  statut:"actif",    date_debut:"2024-03-01" },
  { id:3, nom:"Touré Fatoumata", email:"toure.f@bet.ci",         contrat:"CDD",      niveau:"A1/A2/B1", tarif_h:6000,  centre:"Yopougon", statut:"actif",    date_debut:"2025-01-10" },
  { id:4, nom:"Bamba Seydou",    email:"bamba.s@bet.ci",         contrat:"CDI",      niveau:"B2/C1/C2", tarif_h:9000,  centre:"Plateau",  statut:"actif",    date_debut:"2023-09-01" },
  { id:5, nom:"Coulibaly Aïda",  email:"coulibaly.a@bet.ci",     contrat:"Vacataire",niveau:"A1/A2/B1/B2",tarif_h:7000, centre:"Cocody",  statut:"congé",    date_debut:"2024-06-15" },
  { id:6, nom:"Sanogo Paul",     email:"sanogo.p@bet.ci",        contrat:"CDD",      niveau:"B1/B2",    tarif_h:6500,  centre:"Marcory",  statut:"inactif",  date_debut:"2024-11-01" },
];

const INIT_RECAPS = [
  {
    id:1, coach:"Koné Awa",       periode:"Mai 2026", nbSeances:8, totalH:12, montant:96000,
    statut:"controle_rh", statut_pa:"validé_pa", statut_responsable:null, statut_comptable:null,
    anomalie:false, note_rh:"",
  },
  {
    id:2, coach:"Diallo Mamadou", periode:"Mai 2026", nbSeances:7, totalH:7,  montant:52500,
    statut:"controle_rh", statut_pa:"validé_pa", statut_responsable:null, statut_comptable:null,
    anomalie:false, note_rh:"",
  },
  {
    id:3, coach:"Bamba Seydou",   periode:"Mai 2026", nbSeances:12,totalH:24, montant:216000,
    statut:"anomalie", statut_pa:"validé_pa", statut_responsable:null, statut_comptable:null,
    anomalie:true,  note_rh:"Incohérence : 12 séances déclarées mais 10 validées superviseur.",
  },
  {
    id:4, coach:"Koné Awa",       periode:"Avr 2026", nbSeances:10,totalH:15, montant:120000,
    statut:"transmis_comptable", statut_pa:"validé_pa", statut_responsable:"validé", statut_comptable:"payé",
    anomalie:false, note_rh:"",
  },
  {
    id:5, coach:"Diallo Mamadou", periode:"Avr 2026", nbSeances:9, totalH:9,  montant:67500,
    statut:"transmis_comptable", statut_pa:"validé_pa", statut_responsable:"validé", statut_comptable:"payé",
    anomalie:false, note_rh:"",
  },
];

const GRILLE = [
  { contrat:"CDI",       niveau:"A1/A2",    tarif_h:5500  },
  { contrat:"CDI",       niveau:"B1/B2",    tarif_h:7000  },
  { contrat:"CDI",       niveau:"C1/C2",    tarif_h:9000  },
  { contrat:"CDD",       niveau:"A1/A2",    tarif_h:5000  },
  { contrat:"CDD",       niveau:"B1/B2",    tarif_h:6000  },
  { contrat:"CDD",       niveau:"C1/C2",    tarif_h:7500  },
  { contrat:"Vacataire", niveau:"A1/A2",    tarif_h:4500  },
  { contrat:"Vacataire", niveau:"B1/B2",    tarif_h:6500  },
  { contrat:"Vacataire", niveau:"C1/C2",    tarif_h:8000  },
];

const WORKFLOW_STEPS = [
  { n:1, titre:"Saisie des séances",       desc:"Enseignant saisit ses présences · Superviseur valide les horaires",         role:"Coach / Superviseur", color:"#0891b2" },
  { n:2, titre:"Calcul automatique",        desc:"Système calcule : nb séances × tarif grille (contrat, niveau, modalité)",   role:"Système",             color:"#7c3aed" },
  { n:3, titre:"Validation PA",             desc:"Pedagogical Advisor valide le récapitulatif mensuel avant transmission RH",  role:"Pedagogical Advisor", color:"#d97706" },
  { n:4, titre:"Contrôle RH",               desc:"RH consulte, vérifie les anomalies, approuve ou retourne pour correction",   role:"RH (vous)",           color:PRIMARY_COLOR },
  { n:5, titre:"Validation Responsable",    desc:"Responsable / Manager valide la masse honoraires à payer",                   role:"Responsable / Manager",color:"#dc2626" },
  { n:6, titre:"Transmission Comptable",    desc:"RH transmet le bulletin de paie au comptable/trésorier pour paiement",       role:"Comptable",           color:"#16a34a" },
];

const STATUT_RECAP = {
  controle_rh:        { label:"En contrôle RH",  color:PRIMARY_COLOR,  bg:"#ccfbf1" },
  anomalie:           { label:"Anomalie",          color:"#dc2626",       bg:"#fee2e2" },
  validé_rh:          { label:"Validé RH",         color:"#16a34a",       bg:"#dcfce7" },
  retourné:           { label:"Retourné PA",        color:"#d97706",       bg:"#fef3c7" },
  transmis_comptable: { label:"Transmis Comptable", color:"#7c3aed",      bg:"#ede9fe" },
};

const fmt  = v => (v||0).toLocaleString("fr-FR") + " FCFA";
const fmtD = d => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "—";

/* ═══════════════════════════════════════════════════════ */
export default function RHPaieDashboard() {
  const navigate   = useNavigate();
  const profil     = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom     = profil?.prenom || "";
  const nom        = profil?.nom    || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || "Responsable RH";
  const initiales  = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "RH";

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace:true });
  };

  useNotifPoller({ userId:profil?.id, sources:["honoraires"] });

  const [activeTab,   setActiveTab]   = useState("dashboard");
  const [contrats,    setContrats]    = useState(INIT_CONTRATS);
  const [recaps,      setRecaps]      = useState(INIT_RECAPS);
  const [periode,     setPeriode]     = useState("Mai 2026");
  const [searchQ,     setSearchQ]     = useState("");
  const [showBulletin,setShowBulletin] = useState(false);
  const [bulletinCoach,setBulletinCoach] = useState(null);
  const [showAnoModal, setShowAnoModal] = useState(false);
  const [anoRecap,    setAnoRecap]    = useState(null);
  const [noteRH,      setNoteRH]      = useState("");

  const stats = useMemo(() => {
    const recapsMois = recaps.filter(r=>r.periode===periode);
    const enControle = recapsMois.filter(r=>r.statut==="controle_rh").length;
    const anomalies  = recapsMois.filter(r=>r.anomalie).length;
    const masseSal   = recapsMois.reduce((s,r)=>s+r.montant,0);
    const coachsActifs = contrats.filter(c=>c.statut==="actif").length;
    return { enControle, anomalies, masseSal, coachsActifs };
  }, [recaps, contrats, periode]);

  const recapsMois = useMemo(() =>
    recaps.filter(r => r.periode === periode && (!searchQ || r.coach.toLowerCase().includes(searchQ.toLowerCase())))
  , [recaps, periode, searchQ]);

  const handleValiderRH = (id) => {
    setRecaps(p => p.map(r => r.id===id ? {...r, statut:"validé_rh", note_rh:r.note_rh||"Validé RH"} : r));
    toast.success("Récapitulatif approuvé — en attente validation Responsable");
  };

  const handleSignalerAnomalie = () => {
    if (!noteRH.trim()) { toast.error("Décrivez l'anomalie"); return; }
    setRecaps(p => p.map(r => r.id===anoRecap.id ? {...r, statut:"anomalie", anomalie:true, note_rh:noteRH} : r));
    toast.error(`Anomalie signalée pour ${anoRecap.coach}`);
    setShowAnoModal(false); setNoteRH("");
  };

  const handleTransmettre = (id) => {
    setRecaps(p => p.map(r => r.id===id ? {...r, statut:"transmis_comptable"} : r));
    toast.success("Bulletin transmis au Comptable pour paiement");
  };

  const openBulletin = (coach) => {
    const coachContrat = contrats.find(c=>c.nom===coach.coach);
    const coachRecaps  = recaps.filter(r=>r.coach===coach.coach);
    setBulletinCoach({ ...coach, contratInfo:coachContrat, historique:coachRecaps });
    setShowBulletin(true);
  };

  const printBulletin = () => {
    const w = window.open("","_blank");
    const b = bulletinCoach;
    w.document.write(`
      <html><head><title>Bulletin Honoraires — ${b.coach}</title>
      <style>body{font-family:sans-serif;padding:32px;max-width:640px;margin:auto}
      h1{font-size:22px;color:#0d9488;margin-bottom:4px}
      .sub{color:#64748b;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th{background:#f0fdfa;text-align:left;padding:8px 12px;font-size:12px;text-transform:uppercase;color:#0d9488;border-bottom:2px solid #0d9488}
      td{padding:8px 12px;font-size:13px;border-bottom:1px solid #e5e7eb}
      .total{font-size:18px;font-weight:900;color:#0d9488;text-align:right;margin-top:16px}
      .footer{margin-top:32px;font-size:11px;color:#94a3b8;border-top:1px solid #e5e7eb;padding-top:12px}
      </style></head><body>
      <h1>Bulletin d'Honoraires</h1>
      <div class="sub">Binnie's English Training (BET) · Période : ${b.periode}</div>
      <table>
        <tr><th>Coach</th><th>Contrat</th><th>Centre</th><th>Niveaux</th><th>Tarif/h</th></tr>
        <tr><td><strong>${b.coach}</strong></td><td>${b.contratInfo?.contrat||"—"}</td><td>${b.contratInfo?.centre||"—"}</td><td>${b.contratInfo?.niveau||"—"}</td><td>${fmt(b.contratInfo?.tarif_h)}</td></tr>
      </table>
      <table>
        <tr><th>Période</th><th>Nb séances</th><th>Total heures</th><th>Montant</th><th>Statut</th></tr>
        ${b.historique.map(h=>`<tr><td>${h.periode}</td><td>${h.nbSeances}</td><td>${h.totalH}h</td><td><strong>${fmt(h.montant)}</strong></td><td>${h.statut}</td></tr>`).join("")}
      </table>
      <div class="total">Total honoraires (${b.periode}) : ${fmt(b.montant)}</div>
      <div class="footer">Document généré par BET RH · ${new Date().toLocaleDateString("fr-FR")} · Confidentiel</div>
      </body></html>
    `);
    w.document.close(); w.print();
  };

  const selectSt = { padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, background:"#fff", fontFamily:FF };

  const TABS = [
    { key:"dashboard",  label:"Tableau de bord",    icon:"📊" },
    { key:"workflow",   label:"Workflow honoraires", icon:"🔄" },
    { key:"recaps",     label:"Récapitulatifs",      icon:"📋", badge:stats.enControle+stats.anomalies },
    { key:"contrats",   label:"Contrats coaches",    icon:"📄" },
    { key:"grille",     label:"Grilles tarifaires",  icon:"💰" },
    { key:"historique",     label:"Historique paiements", icon:"🕐" },
    { key:"notifications",  label:"Notifications",         icon:"🔔" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f0fdfa", fontFamily:FF }}>
      <Toaster position="top-right" />

      {/* ── HERO ── */}
      <div style={{ background:GRADIENT_HEADER, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
        <div style={{ position:"absolute", bottom:-60, right:80, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }} />
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
            <div>
              <div style={{ fontSize:11, color:"#99f6e4", fontWeight:600, letterSpacing:"0.08em" }}>Bonjour 👋</div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{nomComplet}</h1>
              <div style={{ fontSize:12, color:"#99f6e4", marginTop:3 }}>🤝 Ressources Humaines / Paie · {profil?.email || ""}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {(stats.enControle + stats.anomalies) > 0 && (
              <div style={{ background:"rgba(239,68,68,.28)", border:"1px solid rgba(239,68,68,.5)", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}
                onClick={()=>setActiveTab("recaps")}>
                ⚠️ {stats.enControle} à contrôler · {stats.anomalies} anomalie{stats.anomalies>1?"s":""}
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
            { l:"Coaches actifs",     v:stats.coachsActifs,            c:"#99f6e4" },
            { l:"Récaps à contrôler", v:stats.enControle,              c:"#fbbf24" },
            { l:"Anomalies",          v:stats.anomalies,               c:"#fca5a5" },
            { l:"Masse salariale",    v:fmt(stats.masseSal),           c:"#6ee7b7" },
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
                  <StatCard label="Coaches actifs"      value={stats.coachsActifs}          icon="👨‍🏫" color={PRIMARY_COLOR} onClick={()=>setActiveTab("contrats")} />
                  <StatCard label="À contrôler (RH)"    value={stats.enControle}             icon="🔍"  color="#d97706"       onClick={()=>setActiveTab("recaps")} />
                  <StatCard label="Anomalies signalées" value={stats.anomalies}              icon="⚠️"  color="#dc2626"       onClick={()=>setActiveTab("recaps")} />
                  <StatCard label="Masse salariale"     value={fmt(stats.masseSal)}          icon="💰"  color="#16a34a"       sub={periode} />
                </div>

                {/* Workflow résumé */}
                <div style={{ background:"#f0fdfa", border:"1.5px solid #99f6e4", borderRadius:12, padding:20 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:"#0f172a", marginBottom:16 }}>🔄 Workflow honoraires — Étape en cours</div>
                  <div style={{ display:"flex", gap:0, overflowX:"auto" }}>
                    {WORKFLOW_STEPS.map((s,i)=>(
                      <div key={s.n} style={{ display:"flex", alignItems:"center", flex:1, minWidth:120 }}>
                        <div style={{ flex:1, textAlign:"center" }}>
                          <div style={{ width:36, height:36, borderRadius:"50%", background:s.n===4?PRIMARY_COLOR:s.n<4?"#dcfce7":"#e5e7eb", color:s.n===4?"#fff":s.n<4?"#16a34a":"#9ca3af", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, margin:"0 auto 6px" }}>
                            {s.n<4?"✓":s.n===4?"🔍":s.n}
                          </div>
                          <div style={{ fontSize:11, fontWeight:700, color:s.n<=4?"#0f172a":"#9ca3af" }}>{s.titre}</div>
                          <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{s.role}</div>
                        </div>
                        {i<WORKFLOW_STEPS.length-1 && (
                          <div style={{ width:32, height:2, background:s.n<4?"#16a34a":"#e5e7eb", flexShrink:0 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Récaps du mois */}
                <div style={{ background:"#fff", borderRadius:12, padding:20, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div style={{ fontWeight:800, fontSize:14 }}>📋 Récapitulatifs — {periode}</div>
                    <button onClick={()=>setActiveTab("recaps")} style={{ fontSize:12, color:PRIMARY_COLOR, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Voir tout →</button>
                  </div>
                  {recapsMois.slice(0,4).map(r=>{
                    const s = STATUT_RECAP[r.statut]||STATUT_RECAP.controle_rh;
                    return (
                      <div key={r.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{r.coach}</div>
                          <div style={{ fontSize:11, color:"#64748b" }}>{r.nbSeances} séances · {r.totalH}h</div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontWeight:800, color:"#16a34a", fontSize:14 }}>{fmt(r.montant)}</span>
                          <Badge label={s.label} color={s.color} bg={s.bg} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════ WORKFLOW ══════ */}
            {activeTab==="workflow" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ fontSize:14, color:"#374151", fontWeight:600, marginBottom:4 }}>Processus de validation des honoraires enseignants</div>
                {WORKFLOW_STEPS.map((s,i)=>(
                  <div key={s.n} style={{ display:"flex", gap:16, position:"relative" }}>
                    {i<WORKFLOW_STEPS.length-1 && (
                      <div style={{ position:"absolute", left:20, top:52, width:2, height:"calc(100% - 8px)", background:"#e5e7eb", zIndex:0 }} />
                    )}
                    <div style={{ width:40, height:40, borderRadius:"50%", background:s.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:15, flexShrink:0, zIndex:1, boxShadow:`0 0 0 4px ${s.color}25` }}>
                      {s.n}
                    </div>
                    <div style={{ flex:1, background:"#fff", borderRadius:12, padding:"14px 18px", border:`1.5px solid ${s.n===4?PRIMARY_COLOR+"60":"#e5e7eb"}`, boxShadow:s.n===4?"0 0 0 2px "+PRIMARY_COLOR+"20":"none", marginBottom:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>{s.titre}</div>
                        <Badge label={s.n===4?"Votre étape":s.n<4?"Complété":"En attente"} color={s.n===4?PRIMARY_COLOR:s.n<4?"#16a34a":"#9ca3af"} bg={s.n===4?"#ccfbf1":s.n<4?"#dcfce7":"#f3f4f6"} />
                      </div>
                      <div style={{ fontSize:13, color:"#64748b", marginTop:6 }}>{s.desc}</div>
                      <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Responsable : <strong style={{ color:"#374151" }}>{s.role}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ══════ RÉCAPITULATIFS ══════ */}
            {activeTab==="recaps" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <select value={periode} onChange={e=>setPeriode(e.target.value)} style={selectSt}>
                    {PERIODES.map(p=><option key={p}>{p}</option>)}
                  </select>
                  <input placeholder="🔍 Chercher coach…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{ ...selectSt, width:200 }} />
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {recapsMois.map(r=>{
                    const s = STATUT_RECAP[r.statut]||STATUT_RECAP.controle_rh;
                    return (
                      <div key={r.id} style={{ background:r.anomalie?"#fff5f5":"#fff", borderRadius:12, padding:"16px 20px", border:`1.5px solid ${r.anomalie?"#fca5a5":r.statut==="controle_rh"?"#99f6e4":"#e5e7eb"}`, boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                          <div>
                            <div style={{ fontWeight:800, fontSize:14 }}>{r.coach}</div>
                            <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>{r.periode} · {r.nbSeances} séances · {r.totalH}h · Validé PA ✓</div>
                            {r.note_rh && (
                              <div style={{ marginTop:8, padding:"6px 10px", background:r.anomalie?"#fee2e2":"#f0fdfa", borderRadius:8, fontSize:12, color:r.anomalie?"#991b1b":"#0369a1", borderLeft:`3px solid ${r.anomalie?"#dc2626":PRIMARY_COLOR}` }}>
                                {r.anomalie?"⚠️":"💬"} {r.note_rh}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <div style={{ fontSize:20, fontWeight:900, color:"#16a34a" }}>{fmt(r.montant)}</div>
                            <Badge label={s.label} color={s.color} bg={s.bg} />
                          </div>
                        </div>
                        {r.statut==="controle_rh" && (
                          <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
                            <button onClick={()=>{ setAnoRecap(r); setNoteRH(r.note_rh||""); setShowAnoModal(true); }} style={{ padding:"7px 14px", border:"1px solid #fca5a5", background:"#fff5f5", color:"#dc2626", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                              ⚠️ Signaler anomalie
                            </button>
                            <button onClick={()=>openBulletin(r)} style={{ padding:"7px 14px", border:`1px solid ${PRIMARY_COLOR}40`, background:"#f0fdfa", color:PRIMARY_COLOR, borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                              📄 Bulletin PDF
                            </button>
                            <button onClick={()=>handleValiderRH(r.id)} style={{ padding:"7px 14px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                              ✓ Approuver RH
                            </button>
                          </div>
                        )}
                        {r.statut==="validé_rh" && (
                          <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
                            <button onClick={()=>openBulletin(r)} style={{ padding:"7px 14px", border:"1px solid #e5e7eb", background:"#f8fafc", color:"#374151", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                              📄 Bulletin PDF
                            </button>
                            <button onClick={()=>handleTransmettre(r.id)} style={{ padding:"7px 14px", background:"#7c3aed", color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                              📤 Transmettre au Comptable
                            </button>
                          </div>
                        )}
                        {r.statut==="transmis_comptable" && (
                          <div style={{ marginTop:10, display:"flex", justifyContent:"flex-end", gap:8 }}>
                            <button onClick={()=>openBulletin(r)} style={{ padding:"7px 14px", border:"1px solid #e5e7eb", background:"#f8fafc", color:"#374151", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>📄 Bulletin PDF</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {recapsMois.length===0 && <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>Aucun récapitulatif pour cette période</div>}
                </div>
              </div>
            )}

            {/* ══════ CONTRATS ══════ */}
            {activeTab==="contrats" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:13, color:"#64748b" }}>{contrats.length} contrats enregistrés</div>
                </div>
                <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Coach","Email","Contrat","Niveaux","Tarif/h","Centre","Début","Statut"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {contrats.map(c=>(
                        <tr key={c.id}>
                          <Td bold>{c.nom}</Td>
                          <Td>{c.email}</Td>
                          <Td><Badge label={c.contrat} color="#0891b2" bg="#e0f2fe" /></Td>
                          <Td>{c.niveau}</Td>
                          <Td bold color={PRIMARY_COLOR}>{fmt(c.tarif_h)}</Td>
                          <Td>{c.centre}</Td>
                          <Td>{fmtD(c.date_debut)}</Td>
                          <Td>
                            <Badge
                              label={c.statut==="actif"?"Actif":c.statut==="congé"?"En congé":"Inactif"}
                              color={c.statut==="actif"?"#16a34a":c.statut==="congé"?"#d97706":"#6b7280"}
                              bg={c.statut==="actif"?"#dcfce7":c.statut==="congé"?"#fef3c7":"#f3f4f6"}
                            />
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════ GRILLE ══════ */}
            {activeTab==="grille" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ fontSize:13, color:"#64748b" }}>Grille tarifaire officielle BET — base de calcul automatique des honoraires</div>
                <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Type de contrat","Niveaux enseignés","Tarif horaire","Calcul : 1 séance (1h30)"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {GRILLE.map((g,i)=>(
                        <tr key={i} style={{ background:i%2===0?"#fff":"#f8fafc" }}>
                          <Td><Badge label={g.contrat} color="#0891b2" bg="#e0f2fe" /></Td>
                          <Td>{g.niveau}</Td>
                          <Td bold color={PRIMARY_COLOR}>{fmt(g.tarif_h)}</Td>
                          <Td>{fmt(g.tarif_h * 1.5)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding:"14px 18px", background:"#f0fdfa", borderRadius:10, border:"1px solid #99f6e4", fontSize:13, color:"#0f172a" }}>
                  💡 <strong>Formule :</strong> Honoraires = Nb séances × Durée/séance (h) × Tarif/h (selon contrat + niveaux)
                </div>
              </div>
            )}

            {/* ══════ HISTORIQUE ══════ */}
            {activeTab==="historique" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ fontSize:13, color:"#64748b" }}>Historique complet des paiements d'honoraires</div>
                <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Coach","Période","Séances","Heures","Montant","Statut","Transmis comptable"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {[...recaps].reverse().map(r=>{
                        const s = STATUT_RECAP[r.statut]||STATUT_RECAP.controle_rh;
                        return (
                          <tr key={r.id}>
                            <Td bold>{r.coach}</Td>
                            <Td>{r.periode}</Td>
                            <Td>{r.nbSeances}</Td>
                            <Td>{r.totalH}h</Td>
                            <Td bold color="#16a34a">{fmt(r.montant)}</Td>
                            <Td><Badge label={s.label} color={s.color} bg={s.bg} /></Td>
                            <Td>{r.statut==="transmis_comptable"?"✓ Oui":"—"}</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background:"#f8fafc" }}>
                        <td colSpan={4} style={{ padding:"12px 14px", fontWeight:800, fontSize:13 }}>Total général</td>
                        <td style={{ padding:"12px 14px", fontWeight:900, fontSize:16, color:PRIMARY_COLOR }}>{fmt(recaps.reduce((s,r)=>s+r.montant,0))}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ══════ NOTIFICATIONS ══════ */}
            {activeTab==="notifications" && (
              <div style={{ padding:"24px 0" }}>
                <NotificationsTab userId={profil?.id} accentColor="#0d9488" />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal anomalie */}
      {showAnoModal && anoRecap && (
        <Modal title={`⚠️ Signaler une anomalie — ${anoRecap.coach}`} onClose={()=>setShowAnoModal(false)}>
          <div style={{ fontSize:13, color:"#64748b", marginBottom:14 }}>Décrivez l'anomalie. Le récapitulatif sera retourné au Pedagogical Advisor.</div>
          <textarea rows={4} placeholder="Ex : 12 séances déclarées mais 10 seulement validées par le superviseur…" value={noteRH} onChange={e=>setNoteRH(e.target.value)}
            style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, fontFamily:FF, resize:"vertical", boxSizing:"border-box" }} />
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:16 }}>
            <button onClick={()=>setShowAnoModal(false)} style={{ padding:"8px 16px", border:"1px solid #e5e7eb", borderRadius:8, cursor:"pointer", background:"#fff" }}>Annuler</button>
            <button onClick={handleSignalerAnomalie} style={{ padding:"8px 18px", background:"#dc2626", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer" }}>⚠️ Signaler</button>
          </div>
        </Modal>
      )}

      {/* Modal bulletin */}
      {showBulletin && bulletinCoach && (
        <Modal title={`📄 Bulletin honoraires — ${bulletinCoach.coach}`} onClose={()=>setShowBulletin(false)} wide>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { l:"Coach",    v:bulletinCoach.coach },
                { l:"Contrat",  v:bulletinCoach.contratInfo?.contrat||"—" },
                { l:"Centre",   v:bulletinCoach.contratInfo?.centre||"—" },
                { l:"Niveaux",  v:bulletinCoach.contratInfo?.niveau||"—" },
                { l:"Tarif/h",  v:fmt(bulletinCoach.contratInfo?.tarif_h) },
                { l:"Période",  v:bulletinCoach.periode },
              ].map(f=>(
                <div key={f.l} style={{ background:"#f0fdfa", borderRadius:8, padding:"8px 12px" }}>
                  <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>{f.l}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{f.v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"#f8fafc", borderRadius:10, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>{["Période","Séances","Heures","Montant","Statut"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>
                  {bulletinCoach.historique.map(h=>(
                    <tr key={h.id}><Td>{h.periode}</Td><Td>{h.nbSeances}</Td><Td>{h.totalH}h</Td><Td bold color="#16a34a">{fmt(h.montant)}</Td>
                    <Td><Badge label={STATUT_RECAP[h.statut]?.label||h.statut} color={STATUT_RECAP[h.statut]?.color||"#6b7280"} bg={STATUT_RECAP[h.statut]?.bg||"#f3f4f6"} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background:"linear-gradient(135deg,#0f172a,#0d9488)", borderRadius:10, padding:"14px 18px", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.6)" }}>Honoraires {bulletinCoach.periode}</div>
                <div style={{ fontSize:24, fontWeight:900 }}>{fmt(bulletinCoach.montant)}</div>
              </div>
              <button onClick={printBulletin} style={{ padding:"9px 20px", background:"#fff", color:PRIMARY_COLOR, border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                🖨️ Imprimer / PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
