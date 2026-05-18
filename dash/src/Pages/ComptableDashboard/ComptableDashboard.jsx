// src/Pages/ComptableDashboard/ComptableDashboard.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import NotificationBell from "../../Components/NotificationBell";
import { useNotifPoller } from "../../hooks/useNotifPoller";

/* ═══════════════════════════════════════════════════════
   CHARTE COULEURS — Comptable / Trésorier
═══════════════════════════════════════════════════════ */
const PRIMARY_COLOR   = "#d97706";
const PRIMARY_LIGHT   = "#fffbeb";
const GRADIENT_HEADER = "linear-gradient(135deg, #0f172a 0%, #d97706 100%)";
const FF              = "'Inter','Segoe UI',sans-serif";

/* ═══════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES
═══════════════════════════════════════════════════════ */
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
    <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:wide?700:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.2)", padding:28 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:8, width:32, height:32, fontSize:16, cursor:"pointer", color:"#6b7280" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const ProgressBar = ({ value, color = PRIMARY_COLOR }) => (
  <div style={{ height:6, background:"#e5e7eb", borderRadius:99, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.min(100,value)}%`, background:color, borderRadius:99, transition:"width .4s" }} />
  </div>
);

const Th = ({ children }) => (
  <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".04em", borderBottom:"1px solid #e5e7eb", background:"#f8fafc", whiteSpace:"nowrap" }}>{children}</th>
);
const Td = ({ children, bold, right }) => (
  <td style={{ padding:"10px 14px", fontSize:13, fontWeight:bold?700:400, textAlign:right?"right":"left", borderBottom:"1px solid #f1f5f9" }}>{children}</td>
);

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK
═══════════════════════════════════════════════════════ */
const CENTRES = ["Cocody", "Plateau", "Yopougon", "Marcory", "Abobo"];
const OFFRES  = ["Anglais Adulte", "Anglais Enfant", "TOEIC/IELTS", "Business English", "Formation Entreprise"];
const MODALITES = ["Mobile Money", "Virement", "Chèque", "Carte bancaire", "Espèces"];

const INIT_PAIEMENTS = [
  { id:1,  client:"Orange CI",       offre:"Formation Entreprise",  centre:"Plateau",   montant:320000, modalite:"Virement",      date:"2026-05-10", statut:"réglé"   },
  { id:2,  client:"Kouamé Aya",      offre:"Anglais Adulte",        centre:"Cocody",    montant:85000,  modalite:"Mobile Money",  date:"2026-05-10", statut:"réglé"   },
  { id:3,  client:"Traoré Ibou",     offre:"TOEIC/IELTS",           centre:"Marcory",   montant:120000, modalite:"Chèque",        date:"2026-05-09", statut:"partiel" },
  { id:4,  client:"BNP Paribas",     offre:"Business English",      centre:"Plateau",   montant:480000, modalite:"Virement",      date:"2026-05-09", statut:"réglé"   },
  { id:5,  client:"N'Guessan Aya",   offre:"Anglais Enfant",        centre:"Yopougon",  montant:65000,  modalite:"Mobile Money",  date:"2026-05-08", statut:"réglé"   },
  { id:6,  client:"SIFCA",           offre:"Formation Entreprise",  centre:"Abobo",     montant:250000, modalite:"Virement",      date:"2026-05-07", statut:"impayé"  },
  { id:7,  client:"Diallo Mamadou",  offre:"Anglais Adulte",        centre:"Cocody",    montant:85000,  modalite:"Mobile Money",  date:"2026-05-06", statut:"réglé"   },
  { id:8,  client:"Nestlé CI",       offre:"Business English",      centre:"Plateau",   montant:390000, modalite:"Virement",      date:"2026-05-05", statut:"réglé"   },
  { id:9,  client:"Bah Mariam",      offre:"Anglais Enfant",        centre:"Yopougon",  montant:65000,  modalite:"Espèces",       date:"2026-05-03", statut:"partiel" },
  { id:10, client:"Coulibaly Jean",  offre:"Anglais Adulte",        centre:"Marcory",   montant:85000,  modalite:"Carte bancaire",date:"2026-05-02", statut:"réglé"   },
];

const INIT_HONORAIRES = [
  { id:1, coach:"Koné Awa",        periode:"Mai 2026", montant:96000,  statut_rh:"validé",    statut_paiement:"payé",    virement:"VIR-2026-051", date_paiement:"2026-05-12" },
  { id:2, coach:"Diallo Mamadou",  periode:"Mai 2026", montant:52500,  statut_rh:"validé",    statut_paiement:"en attente", virement:null, date_paiement:null },
  { id:3, coach:"Bamba Seydou",    periode:"Mai 2026", montant:108000, statut_rh:"validé",    statut_paiement:"en attente", virement:null, date_paiement:null },
  { id:4, coach:"Touré Fatoumata", periode:"Mai 2026", montant:63000,  statut_rh:"en cours",  statut_paiement:"en attente", virement:null, date_paiement:null },
  { id:5, coach:"Coulibaly Aïda",  periode:"Avr 2026", montant:84000,  statut_rh:"validé",    statut_paiement:"payé",    virement:"VIR-2026-042", date_paiement:"2026-04-30" },
  { id:6, coach:"Koné Awa",        periode:"Avr 2026", montant:80000,  statut_rh:"validé",    statut_paiement:"payé",    virement:"VIR-2026-041", date_paiement:"2026-04-30" },
];

const BUDGET_PAR_OFFRE = [
  { offre:"Anglais Adulte",       budget:800000,  reel:680000  },
  { offre:"Anglais Enfant",       budget:500000,  reel:520000  },
  { offre:"TOEIC/IELTS",          budget:600000,  reel:420000  },
  { offre:"Business English",     budget:900000,  reel:870000  },
  { offre:"Formation Entreprise", budget:1200000, reel:1250000 },
];

const STATUT_PMT = {
  "réglé":   { color:"#16a34a", bg:"#dcfce7" },
  "partiel":  { color:"#d97706", bg:"#fef3c7" },
  "impayé":   { color:"#dc2626", bg:"#fee2e2" },
};

/* ═══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function ComptableDashboard() {
  const navigate   = useNavigate();
  const profil     = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom     = profil?.prenom || "";
  const nom        = profil?.nom    || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || "Comptable";
  const initiales  = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "CP";

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace:true });
  };

  useNotifPoller({ userId: profil?.id, sources: ["honoraires","paiements"] });

  const [activeTab,    setActiveTab]    = useState("dashboard");
  const [paiements,    setPaiements]    = useState(INIT_PAIEMENTS);
  const [honoraires,   setHonoraires]   = useState(INIT_HONORAIRES);
  const [periode,      setPeriode]      = useState("mois");
  const [filtreCentre, setFiltreCentre] = useState("Tous");
  const [filtreOffre,  setFiltreOffre]  = useState("Toutes");
  const [filtreModali, setFiltreModali] = useState("Toutes");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [searchQ,      setSearchQ]      = useState("");
  const [showVirModal, setShowVirModal] = useState(false);
  const [virForm,      setVirForm]      = useState({ honoraireId:"", reference:"", date_paiement:"" });
  const [filtrePeriodeHon, setFiltrePeriodeHon] = useState("Mai 2026");

  const fmt  = (v) => (v||0).toLocaleString("fr-FR") + " FCFA";
  const fmtD = (d) => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "—";

  /* ── KPIs ── */
  const stats = useMemo(() => {
    const regles     = paiements.filter(p => p.statut === "réglé");
    const caJour     = paiements.filter(p => p.date === new Date().toISOString().slice(0,10) && p.statut==="réglé").reduce((s,p)=>s+p.montant,0);
    const caMois     = paiements.filter(p => p.date.startsWith("2026-05") && p.statut==="réglé").reduce((s,p)=>s+p.montant,0);
    const caAnnee    = paiements.filter(p => p.date.startsWith("2026") && p.statut==="réglé").reduce((s,p)=>s+p.montant,0);
    const honorairesMois = honoraires.filter(h=>h.periode==="Mai 2026").reduce((s,h)=>s+h.montant,0);
    const soldePrev  = caMois - honorairesMois;
    const impayés    = paiements.filter(p=>p.statut==="impayé").length;
    const aPayerHon  = honoraires.filter(h=>h.statut_rh==="validé"&&h.statut_paiement==="en attente").length;
    return { caJour, caMois, caAnnee, honorairesMois, soldePrev, impayés, aPayerHon, totalEncaissé:caAnnee };
  }, [paiements, honoraires]);

  /* ── Paiements filtrés ── */
  const paiementsFiltres = useMemo(() => {
    return paiements.filter(p => {
      const qMatch = !searchQ || p.client.toLowerCase().includes(searchQ.toLowerCase());
      const cMatch = filtreCentre === "Tous" || p.centre === filtreCentre;
      const oMatch = filtreOffre  === "Toutes" || p.offre === filtreOffre;
      const mMatch = filtreModali === "Toutes" || p.modalite === filtreModali;
      const sMatch = filtreStatut === "Tous" || p.statut === filtreStatut;
      return qMatch && cMatch && oMatch && mMatch && sMatch;
    });
  }, [paiements, searchQ, filtreCentre, filtreOffre, filtreModali, filtreStatut]);

  /* ── CA par centre ── */
  const caParCentre = useMemo(() => {
    const map = {};
    CENTRES.forEach(c => { map[c] = { encaissé:0, impayé:0, count:0 }; });
    paiements.forEach(p => {
      if (!map[p.centre]) return;
      if (p.statut === "réglé") map[p.centre].encaissé += p.montant;
      if (p.statut === "impayé") map[p.centre].impayé += p.montant;
      map[p.centre].count++;
    });
    return Object.entries(map).map(([centre, v]) => ({ centre, ...v })).sort((a,b)=>b.encaissé-a.encaissé);
  }, [paiements]);

  /* ── Enregistrer un virement ── */
  const handleVirement = () => {
    if (!virForm.honoraireId || !virForm.reference || !virForm.date_paiement) {
      toast.error("Remplissez tous les champs"); return;
    }
    setHonoraires(prev => prev.map(h =>
      h.id === +virForm.honoraireId
        ? { ...h, statut_paiement:"payé", virement:virForm.reference, date_paiement:virForm.date_paiement }
        : h
    ));
    toast.success("Virement enregistré avec succès");
    setShowVirModal(false);
    setVirForm({ honoraireId:"", reference:"", date_paiement:"" });
  };

  /* ── Exports CSV ── */
  const exportCSV = (data, filename) => {
    if (!data.length) { toast.error("Aucune donnée à exporter"); return; }
    const headers = Object.keys(data[0]);
    const rows = [headers.join(","), ...data.map(r => headers.map(h => JSON.stringify(r[h]||"")).join(","))];
    const blob = new Blob(["﻿" + rows.join("\n")], { type:"text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`; a.click();
    toast.success(`Export ${filename}.csv effectué`);
  };

  const TABS = [
    { key:"dashboard",  label:"Tableau de bord",   icon:"📊" },
    { key:"paiements",  label:"Paiements",          icon:"💳", badge: stats.impayés },
    { key:"honoraires", label:"Honoraires coaches", icon:"💰", badge: stats.aPayerHon },
    { key:"rapports",   label:"Rapports financiers",icon:"📈" },
    { key:"exports",    label:"Exports comptables", icon:"📤" },
  ];

  const selectSt = { padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, background:"#fff", fontFamily:FF };
  const inputSt  = { padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, fontFamily:FF };

  return (
    <div style={{ minHeight:"100vh", background:PRIMARY_LIGHT, fontFamily:FF }}>
      <Toaster position="top-right" />

      {/* ── HERO HEADER ── */}
      <div style={{ background:GRADIENT_HEADER, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
        <div style={{ position:"absolute", bottom:-60, right:80, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }} />
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
            <div>
              <div style={{ fontSize:11, color:"#fde68a", fontWeight:600, letterSpacing:"0.08em" }}>Bonjour 👋</div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{nomComplet}</h1>
              <div style={{ fontSize:12, color:"#fde68a", marginTop:3 }}>💰 Comptable / Trésorier · {profil?.email || ""}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <NotificationBell userId={profil?.id} />
            <button onClick={handleLogout}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
              <span>🚪</span> Déconnexion
            </button>
          </div>
        </div>
        {/* Mini KPIs */}
        <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden", position:"relative", zIndex:1 }}>
          {[
            { l:"CA du jour",       v:fmt(stats.caJour),     c:"#fde68a" },
            { l:"CA du mois",       v:fmt(stats.caMois),     c:"#6ee7b7" },
            { l:"CA de l'année",    v:fmt(stats.caAnnee),    c:"#93c5fd" },
            { l:"Solde prévisionnel",v:fmt(stats.soldePrev), c:stats.soldePrev>=0?"#6ee7b7":"#fca5a5" },
          ].map((s,i,arr)=>(
            <div key={s.l} style={{ flex:1, textAlign:"center", padding:"14px 8px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.08)":"none" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>{s.l}</div>
              <div style={{ fontSize:16, fontWeight:800, color:s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 24px 32px" }}>
        <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", overflow:"hidden" }}>

          {/* ── Onglets ── */}
          <div style={{ display:"flex", gap:0, borderBottom:"1px solid #e5e7eb", overflowX:"auto", background:"#fafafa" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
                padding:"12px 16px", border:"none",
                borderBottom:activeTab===t.key?`3px solid ${PRIMARY_COLOR}`:"3px solid transparent",
                cursor:"pointer", fontWeight:600, fontSize:12, whiteSpace:"nowrap",
                background:"transparent", color:activeTab===t.key?PRIMARY_COLOR:"#6b7280",
                display:"flex", alignItems:"center", gap:6, transition:"color .15s",
              }}>
                <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
                {t.badge>0 && <span style={{ background:"#ef4444", color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"1px 6px" }}>{t.badge}</span>}
              </button>
            ))}
          </div>

          <div style={{ padding:24 }}>

            {/* ══════════════ DASHBOARD ══════════════ */}
            {activeTab === "dashboard" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                  <StatCard label="CA encaissé (mois)"   value={fmt(stats.caMois)}          icon="💵" color={PRIMARY_COLOR}  sub="Mai 2026"       onClick={()=>setActiveTab("paiements")} />
                  <StatCard label="Honoraires (mois)"    value={fmt(stats.honorairesMois)}   icon="💸" color="#dc2626"        sub="à décaisser"    onClick={()=>setActiveTab("honoraires")} />
                  <StatCard label="Solde prévisionnel"   value={fmt(stats.soldePrev)}        icon="🏦" color={stats.soldePrev>=0?"#16a34a":"#dc2626"} sub="CA − honoraires" />
                  <StatCard label="Paiements impayés"    value={stats.impayés}               icon="⚠️" color="#dc2626"        sub="à relancer"     onClick={()=>setActiveTab("paiements")} />
                </div>

                {/* Alertes */}
                {(stats.impayés > 0 || stats.aPayerHon > 0) && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {stats.impayés > 0 && (
                      <div style={{ padding:"10px 16px", background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:10, fontSize:13, color:"#991b1b", fontWeight:600, display:"flex", justifyContent:"space-between", cursor:"pointer" }}
                        onClick={()=>{ setFiltreStatut("impayé"); setActiveTab("paiements"); }}>
                        <span>⚠️ {stats.impayés} paiement{stats.impayés>1?"s":""} impayé{stats.impayés>1?"s":""}  — relance requise</span>
                        <span style={{ fontSize:11 }}>Voir →</span>
                      </div>
                    )}
                    {stats.aPayerHon > 0 && (
                      <div style={{ padding:"10px 16px", background:"#fef3c7", border:"1px solid #fcd34d", borderRadius:10, fontSize:13, color:"#92400e", fontWeight:600, display:"flex", justifyContent:"space-between", cursor:"pointer" }}
                        onClick={()=>setActiveTab("honoraires")}>
                        <span>💰 {stats.aPayerHon} virement{stats.aPayerHon>1?"s":""} d'honoraires à enregistrer</span>
                        <span style={{ fontSize:11 }}>Voir →</span>
                      </div>
                    )}
                  </div>
                )}

                {/* CA par centre + Répartition par offre */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div style={{ background:"#fff", borderRadius:12, padding:20, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                    <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>🏢 CA par centre</div>
                    {caParCentre.map(r => {
                      const max = caParCentre[0]?.encaissé || 1;
                      return (
                        <div key={r.centre} style={{ marginBottom:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:13 }}>
                            <span style={{ fontWeight:600 }}>{r.centre}</span>
                            <span style={{ fontWeight:800, color:PRIMARY_COLOR }}>{fmt(r.encaissé)}</span>
                          </div>
                          <ProgressBar value={(r.encaissé/max)*100} />
                          {r.impayé > 0 && <div style={{ fontSize:11, color:"#dc2626", marginTop:2 }}>Impayé : {fmt(r.impayé)}</div>}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background:"#fff", borderRadius:12, padding:20, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                    <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>📦 Budget vs Réel par offre</div>
                    {BUDGET_PAR_OFFRE.map(r => {
                      const pct = Math.round((r.reel/r.budget)*100);
                      const color = pct >= 100 ? "#16a34a" : pct >= 80 ? PRIMARY_COLOR : "#dc2626";
                      return (
                        <div key={r.offre} style={{ marginBottom:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                            <span style={{ fontWeight:600 }}>{r.offre}</span>
                            <span style={{ fontWeight:700, color }}>{pct}% <span style={{ fontWeight:400, color:"#9ca3af" }}>({fmt(r.reel)} / {fmt(r.budget)})</span></span>
                          </div>
                          <ProgressBar value={pct} color={color} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dernières transactions */}
                <div style={{ background:"#fff", borderRadius:12, padding:20, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:14, display:"flex", justifyContent:"space-between" }}>
                    <span>🕐 Dernières transactions</span>
                    <button onClick={()=>setActiveTab("paiements")} style={{ fontSize:12, color:PRIMARY_COLOR, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Voir tout →</button>
                  </div>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Client","Offre","Montant","Modalité","Date","Statut"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {paiements.slice(0,5).map(p => {
                        const s = STATUT_PMT[p.statut]||STATUT_PMT["réglé"];
                        return (
                          <tr key={p.id}>
                            <Td bold>{p.client}</Td>
                            <Td>{p.offre}</Td>
                            <Td bold>{fmt(p.montant)}</Td>
                            <Td>{p.modalite}</Td>
                            <Td>{fmtD(p.date)}</Td>
                            <Td><Badge label={p.statut} color={s.color} bg={s.bg} /></Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════ PAIEMENTS ══════════════ */}
            {activeTab === "paiements" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {/* Filtres */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <input placeholder="🔍 Rechercher client…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{ ...inputSt, width:200 }} />
                  <select value={filtreCentre} onChange={e=>setFiltreCentre(e.target.value)} style={selectSt}>
                    <option value="Tous">Tous centres</option>
                    {CENTRES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <select value={filtreOffre} onChange={e=>setFiltreOffre(e.target.value)} style={selectSt}>
                    <option value="Toutes">Toutes offres</option>
                    {OFFRES.map(o=><option key={o}>{o}</option>)}
                  </select>
                  <select value={filtreModali} onChange={e=>setFiltreModali(e.target.value)} style={selectSt}>
                    <option value="Toutes">Toutes modalités</option>
                    {MODALITES.map(m=><option key={m}>{m}</option>)}
                  </select>
                  <select value={filtreStatut} onChange={e=>setFiltreStatut(e.target.value)} style={selectSt}>
                    <option value="Tous">Tous statuts</option>
                    <option>réglé</option><option>partiel</option><option>impayé</option>
                  </select>
                  <button onClick={()=>{ setSearchQ(""); setFiltreCentre("Tous"); setFiltreOffre("Toutes"); setFiltreModali("Toutes"); setFiltreStatut("Tous"); }} style={{ ...inputSt, cursor:"pointer", background:"#f1f5f9", color:"#6b7280" }}>Réinitialiser</button>
                  <div style={{ marginLeft:"auto" }}>
                    <button onClick={()=>exportCSV(paiementsFiltres,"paiements_apprenants")} style={{ padding:"7px 14px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>📤 Export CSV</button>
                  </div>
                </div>

                {/* Résumé rapide */}
                <div style={{ display:"flex", gap:12 }}>
                  {[
                    { l:"Total filtré", v:fmt(paiementsFiltres.reduce((s,p)=>s+p.montant,0)), c:PRIMARY_COLOR },
                    { l:"Réglé",        v:fmt(paiementsFiltres.filter(p=>p.statut==="réglé").reduce((s,p)=>s+p.montant,0)),   c:"#16a34a" },
                    { l:"Partiel",      v:fmt(paiementsFiltres.filter(p=>p.statut==="partiel").reduce((s,p)=>s+p.montant,0)), c:PRIMARY_COLOR },
                    { l:"Impayé",       v:fmt(paiementsFiltres.filter(p=>p.statut==="impayé").reduce((s,p)=>s+p.montant,0)), c:"#dc2626" },
                  ].map(s=>(
                    <div key={s.l} style={{ flex:1, background:"#f8fafc", borderRadius:10, padding:"12px 14px", border:"1px solid #e5e7eb" }}>
                      <div style={{ fontSize:11, color:"#9ca3af" }}>{s.l}</div>
                      <div style={{ fontSize:16, fontWeight:800, color:s.c, marginTop:2 }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Client","Offre","Centre","Montant","Modalité","Date","Statut"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {paiementsFiltres.map(p=>{
                        const s=STATUT_PMT[p.statut]||STATUT_PMT["réglé"];
                        return (
                          <tr key={p.id} style={{ background:p.statut==="impayé"?"#fff5f5":"#fff" }}>
                            <Td bold>{p.client}</Td>
                            <Td>{p.offre}</Td>
                            <Td>{p.centre}</Td>
                            <Td bold>{fmt(p.montant)}</Td>
                            <Td>{p.modalite}</Td>
                            <Td>{fmtD(p.date)}</Td>
                            <Td><Badge label={p.statut} color={s.color} bg={s.bg} /></Td>
                          </tr>
                        );
                      })}
                      {paiementsFiltres.length===0 && (
                        <tr><td colSpan={7} style={{ textAlign:"center", padding:32, color:"#94a3b8", fontSize:13 }}>Aucun paiement trouvé</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════ HONORAIRES ══════════════ */}
            {activeTab === "honoraires" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <select value={filtrePeriodeHon} onChange={e=>setFiltrePeriodeHon(e.target.value)} style={selectSt}>
                      <option>Mai 2026</option><option>Avr 2026</option><option>Mars 2026</option>
                    </select>
                  </div>
                  <button onClick={()=>setShowVirModal(true)} style={{ padding:"8px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    + Enregistrer un virement
                  </button>
                </div>

                <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr>{["Coach","Période","Montant","Statut RH","Statut paiement","Référence virement","Date paiement"].map(h=><Th key={h}>{h}</Th>)}</tr>
                    </thead>
                    <tbody>
                      {honoraires.filter(h=>h.periode===filtrePeriodeHon).map(h=>(
                        <tr key={h.id} style={{ background:h.statut_paiement==="en attente"&&h.statut_rh==="validé"?"#fffbeb":"#fff" }}>
                          <Td bold>{h.coach}</Td>
                          <Td>{h.periode}</Td>
                          <Td bold>{fmt(h.montant)}</Td>
                          <Td>
                            <Badge
                              label={h.statut_rh==="validé"?"✓ Validé RH":"En cours"}
                              color={h.statut_rh==="validé"?"#16a34a":"#d97706"}
                              bg={h.statut_rh==="validé"?"#dcfce7":"#fef3c7"}
                            />
                          </Td>
                          <Td>
                            <Badge
                              label={h.statut_paiement==="payé"?"✓ Payé":"⏳ En attente"}
                              color={h.statut_paiement==="payé"?"#16a34a":"#dc2626"}
                              bg={h.statut_paiement==="payé"?"#dcfce7":"#fee2e2"}
                            />
                          </Td>
                          <Td>{h.virement || <span style={{ color:"#94a3b8" }}>—</span>}</Td>
                          <Td>{fmtD(h.date_paiement)}</Td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background:"#f8fafc" }}>
                        <td colSpan={2} style={{ padding:"12px 14px", fontWeight:800, fontSize:13 }}>Total {filtrePeriodeHon}</td>
                        <td style={{ padding:"12px 14px", fontWeight:900, fontSize:15, color:PRIMARY_COLOR }}>
                          {fmt(honoraires.filter(h=>h.periode===filtrePeriodeHon).reduce((s,h)=>s+h.montant,0))}
                        </td>
                        <td colSpan={4} style={{ padding:"12px 14px", fontSize:12, color:"#6b7280" }}>
                          {honoraires.filter(h=>h.periode===filtrePeriodeHon&&h.statut_paiement==="payé").length} payé(s) ·{" "}
                          {honoraires.filter(h=>h.periode===filtrePeriodeHon&&h.statut_paiement==="en attente").length} en attente
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <button onClick={()=>exportCSV(honoraires,"honoraires_coaches")} style={{ alignSelf:"flex-start", padding:"8px 16px", background:"#f1f5f9", color:"#374151", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  📤 Exporter tous les honoraires CSV
                </button>
              </div>
            )}

            {/* ══════════════ RAPPORTS FINANCIERS ══════════════ */}
            {activeTab === "rapports" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                  <StatCard label="CA total encaissé"  value={fmt(stats.caAnnee)}          icon="📈" color={PRIMARY_COLOR}  sub="Année 2026" />
                  <StatCard label="Honoraires versés"   value={fmt(honoraires.filter(h=>h.statut_paiement==="payé").reduce((s,h)=>s+h.montant,0))} icon="💸" color="#dc2626" sub="Toutes périodes" />
                  <StatCard label="Taux de recouvrement" value={`${Math.round((paiements.filter(p=>p.statut==="réglé").length/paiements.length)*100)}%`} icon="🎯" color="#16a34a" sub={`${paiements.filter(p=>p.statut==="réglé").length}/${paiements.length} paiements`} />
                </div>

                {/* CA par centre */}
                <div style={{ background:"#fff", borderRadius:12, padding:22, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>🏢 CA par centre · Détail</div>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Centre","Transactions","CA Encaissé","Impayés","% du total"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {caParCentre.map(r=>{
                        const total = paiements.filter(p=>p.statut==="réglé").reduce((s,p)=>s+p.montant,0)||1;
                        return (
                          <tr key={r.centre}>
                            <Td bold>{r.centre}</Td>
                            <Td>{r.count}</Td>
                            <Td bold>{fmt(r.encaissé)}</Td>
                            <Td><span style={{ color:r.impayé>0?"#dc2626":"#16a34a", fontWeight:700 }}>{fmt(r.impayé)}</span></Td>
                            <Td>{Math.round((r.encaissé/total)*100)}%</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Budget vs Réel */}
                <div style={{ background:"#fff", borderRadius:12, padding:22, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>📊 Écart Budget vs Réel · Par offre</div>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Offre","Budget","Réalisé","Écart","Taux réalisation"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {BUDGET_PAR_OFFRE.map(r=>{
                        const ecart = r.reel - r.budget;
                        const pct   = Math.round((r.reel/r.budget)*100);
                        const color = pct>=100?"#16a34a":pct>=80?PRIMARY_COLOR:"#dc2626";
                        return (
                          <tr key={r.offre}>
                            <Td bold>{r.offre}</Td>
                            <Td>{fmt(r.budget)}</Td>
                            <Td bold>{fmt(r.reel)}</Td>
                            <Td><span style={{ color:ecart>=0?"#16a34a":"#dc2626", fontWeight:700 }}>{ecart>=0?"+":""}{fmt(ecart)}</span></Td>
                            <Td>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ flex:1, height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden", minWidth:60 }}>
                                  <div style={{ height:"100%", width:`${Math.min(100,pct)}%`, background:color, borderRadius:3 }} />
                                </div>
                                <span style={{ fontSize:12, fontWeight:700, color, minWidth:36 }}>{pct}%</span>
                              </div>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* CA par modalité */}
                <div style={{ background:"#fff", borderRadius:12, padding:22, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>💳 CA par modalité de paiement</div>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                    {MODALITES.map(m=>{
                      const total = paiements.filter(p=>p.modalite===m&&p.statut==="réglé").reduce((s,p)=>s+p.montant,0);
                      const count = paiements.filter(p=>p.modalite===m).length;
                      return (
                        <div key={m} style={{ flex:"1 1 160px", background:"#f8fafc", borderRadius:10, padding:"14px 16px", border:"1px solid #e5e7eb" }}>
                          <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>{m}</div>
                          <div style={{ fontSize:18, fontWeight:800, color:PRIMARY_COLOR }}>{fmt(total)}</div>
                          <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{count} transaction{count>1?"s":""}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ EXPORTS ══════════════ */}
            {activeTab === "exports" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ fontSize:14, color:"#374151", fontWeight:600 }}>📤 Exports comptables — Intégration logiciel</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {[
                    { title:"Tous les paiements",     desc:"Journal de caisse complet — toutes transactions",          data:paiements,          file:"journal_caisse" },
                    { title:"Paiements réglés",        desc:"Uniquement les encaissements validés",                     data:paiements.filter(p=>p.statut==="réglé"), file:"encaissements" },
                    { title:"Paiements impayés",       desc:"Liste des créances à recouvrer",                          data:paiements.filter(p=>p.statut==="impayé"), file:"impayes" },
                    { title:"Honoraires coaches",      desc:"Récapitulatif des décaissements coaches",                  data:honoraires,          file:"honoraires_coaches" },
                    { title:"CA par centre",           desc:"Chiffre d'affaires ventilé par centre BET",               data:caParCentre,         file:"ca_par_centre" },
                    { title:"Budget vs Réel",          desc:"Analyse des écarts budgétaires par offre",                data:BUDGET_PAR_OFFRE,    file:"budget_vs_reel" },
                  ].map(ex=>(
                    <div key={ex.file} style={{ background:"#fff", borderRadius:12, padding:20, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{ex.title}</div>
                        <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>{ex.desc}</div>
                      </div>
                      <button onClick={()=>exportCSV(ex.data, ex.file)} style={{ padding:"8px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                        📤 CSV
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>{/* fin padding 24 */}
        </div>{/* fin white card */}
      </div>{/* fin outer padding */}

      {/* ══ MODAL virement ══ */}
      {showVirModal && (
        <Modal title="💰 Enregistrer un virement d'honoraires" onClose={()=>setShowVirModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Coach / récapitulatif *</label>
              <select value={virForm.honoraireId} onChange={e=>setVirForm(p=>({...p,honoraireId:e.target.value}))} style={{ ...selectSt, width:"100%" }}>
                <option value="">Sélectionner…</option>
                {honoraires.filter(h=>h.statut_rh==="validé"&&h.statut_paiement==="en attente").map(h=>(
                  <option key={h.id} value={h.id}>{h.coach} — {h.periode} — {fmt(h.montant)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Référence virement *</label>
              <input placeholder="Ex : VIR-2026-053" value={virForm.reference} onChange={e=>setVirForm(p=>({...p,reference:e.target.value}))} style={{ ...inputSt, width:"100%" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Date de paiement *</label>
              <input type="date" value={virForm.date_paiement} onChange={e=>setVirForm(p=>({...p,date_paiement:e.target.value}))} style={{ ...inputSt, width:"100%" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:8 }}>
              <button onClick={()=>setShowVirModal(false)} style={{ padding:"8px 16px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>Annuler</button>
              <button onClick={handleVirement} style={{ padding:"8px 18px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>✓ Enregistrer</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
