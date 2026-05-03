// src/Pages/GestionnaireDashboard/GestionnaireDashboard.jsx
// Route : <Route path="/gestionnaire-dashboard" element={<GestionnaireDashboard />} />

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

/* ═══════════════════════════════════════════════════════
   CONSTANTES (chartre BET – version EspaceApprenant)
═══════════════════════════════════════════════════════ */
const PRIMARY_COLOR    = "#dc2626";
const PRIMARY_DARK     = "#1e3a8a";
const PRIMARY_LIGHT    = "#fef2f2";
const GRADIENT_HEADER  = "linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%)";

/* ═══════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES (identiques à EspaceApprenant)
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

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK (Gestionnaire enrichies)
═══════════════════════════════════════════════════════ */
const INIT_DOSSIERS = [
  { id:1, client:"Orange CI", type:"Inscription", statut:"en_attente", date:"2025-12-10", montant:12500 },
  { id:2, client:"BNP Paribas", type:"Renouvellement", statut:"en_cours", date:"2025-12-09", montant:32000 },
  { id:3, client:"Nestlé", type:"Certification", statut:"en_attente", date:"2025-12-08", montant:5000 },
];

const INIT_PAIEMENTS = [
  { id:1, client:"Orange CI", montant:12500, moyen:"Mobile Money", date:"2025-12-10", statut:"validé" },
  { id:2, client:"Nestlé", montant:5000, moyen:"Virement", date:"2025-12-10", statut:"validé" },
  { id:3, client:"BNP Paribas", montant:32000, moyen:"Carte", date:"2025-12-10", statut:"validé" },
  { id:4, client:"SIFCA", montant:8800, moyen:"Mobile Money", date:"2025-12-09", statut:"en_attente" },
];

const INIT_REQUETES = [
  { id:1, client:"Kouamé Aya", sujet:"Accès plateforme", statut:"ouvert", date:"2025-12-10", priorite:"haute" },
  { id:2, client:"Diallo Ibrahima", sujet:"Facture", statut:"en_cours", date:"2025-12-09", priorite:"moyenne" },
  { id:3, client:"Touré Mamadou", sujet:"Certificat", statut:"ouvert", date:"2025-12-08", priorite:"haute" },
  { id:4, client:"Bamba Aïcha", sujet:"Absence", statut:"fermé", date:"2025-12-07", priorite:"basse" },
];

const INIT_INSCRIPTIONS = [
  { id:1, nom:"Kouamé Aya", offre:"Anglais Adulte", date:"2025-12-10", statut:"confirmée" },
  { id:2, nom:"Touré Mamadou", offre:"Certification TOEIC", date:"2025-12-09", statut:"confirmée" },
  { id:3, nom:"Bamba Aïcha", offre:"Anglais Enfant", date:"2025-12-08", statut:"en_attente" },
  { id:4, nom:"Coulibaly Jean", offre:"Formation Entreprise", date:"2025-12-07", statut:"confirmée" },
  { id:5, nom:"Diallo Ibrahima", offre:"Business English", date:"2025-12-06", statut:"confirmée" },
];

const OFFRE_LIST = ["Anglais Adulte", "Anglais Enfant", "Formation Entreprise", "Certification TOEIC", "Business English"];
const PROFIL_LIST = ["Particulier", "Entreprise", "Étudiant"];

/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
export default function GestionnaireDashboard() {
  const navigate = useNavigate();
  const profil = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom = profil?.prenom || profil?.first_name || "";
  const nom    = profil?.nom    || profil?.last_name  || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || profil?.email || "Gestionnaire";
  const initiales  = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "GS";
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace: true });
  };

  const [activeTab, setActiveTab] = useState("dashboard");
  const [dossiers, setDossiers] = useState(INIT_DOSSIERS);
  const [paiements, setPaiements] = useState(INIT_PAIEMENTS);
  const [requetes, setRequetes] = useState(INIT_REQUETES);
  const [inscriptions, setInscriptions] = useState(INIT_INSCRIPTIONS);

  // Filtres
  const [periode, setPeriode] = useState("mois"); // semaine, mois, trimestre, année
  const [filtreOffre, setFiltreOffre] = useState("Toutes");
  const [filtreProfil, setFiltreProfil] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");

  // Planification d'envoi
  const [showPlanifModal, setShowPlanifModal] = useState(false);
  const [planifConfig, setPlanifConfig] = useState({ frequence: "hebdomadaire", emails: "", format: "pdf" });

  const formatMoney = (val) => val.toLocaleString("fr-FR") + " €";
  const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });

  // Filtrage par période
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

  // Données filtrées
  const filteredDossiers = useMemo(() => {
    let filtered = [...dossiers];
    filtered = filterByPeriode(filtered, "date");
    return filtered;
  }, [dossiers, periode]);

  const filteredPaiements = useMemo(() => {
    let filtered = [...paiements];
    filtered = filterByPeriode(filtered, "date");
    return filtered;
  }, [paiements, periode]);

  const filteredRequetes = useMemo(() => {
    let filtered = [...requetes];
    filtered = filterByPeriode(filtered, "date");
    return filtered;
  }, [requetes, periode]);

  const filteredInscriptions = useMemo(() => {
    let filtered = [...inscriptions];
    if (filtreOffre !== "Toutes") filtered = filtered.filter(i => i.offre === filtreOffre);
    filtered = filterByPeriode(filtered, "date");
    if (searchTerm) filtered = filtered.filter(i => i.nom.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered;
  }, [inscriptions, filtreOffre, periode, searchTerm]);

  // Stats
  const stats = useMemo(() => ({
    dossiersEnCours: dossiers.filter(d => d.statut === "en_attente").length,
    paiementsJour: paiements.filter(p => p.date === new Date().toISOString().slice(0,10)).reduce((s,p)=>s+p.montant,0),
    requetesEnAttente: requetes.filter(r => r.statut === "ouvert").length,
    inscriptionsRecentes: inscriptions.length,
  }), [dossiers, paiements, requetes, inscriptions]);

  // Exports
  const exportExcel = (data, filename) => {
    const csvRows = [];
    const headers = Object.keys(data[0] || {});
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
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>${title}</title>
      <style>body{font-family:sans-serif; padding:20px;} table{border-collapse:collapse; width:100%} th,td{border:1px solid #ccc; padding:8px; text-align:left}</style>
      </head><body><h1>${title}</h1><table><thead><tr>${Object.keys(data[0] || {}).map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>
      ${data.map(row=>`<tr>${Object.values(row).map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}
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

  const tabs = [
    { key: "dashboard", label: "Tableau de bord", icon: "📊" },
    { key: "dossiers",  label: "Dossiers",        icon: "📂" },
    { key: "paiements", label: "Paiements",       icon: "💳" },
    { key: "requetes",  label: "Requêtes",        icon: "🕒" },
    { key: "inscriptions", label: "Inscriptions", icon: "📝" },
    { key: "exports",   label: "Exports & envois",icon: "📧" },
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
                <div style={{ fontSize:12, color:"#fecaca", marginTop:3 }}>{profil?.email || "Dossiers, paiements, requêtes et inscriptions"}</div>
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
              { l:"Dossiers en cours", v:stats.dossiersEnCours, c:"#f87171" },
              { l:"Paiements du jour", v:formatMoney(stats.paiementsJour), c:"#34d399" },
              { l:"Requêtes en attente", v:stats.requetesEnAttente, c:"#fbbf24" },
            ].map((s, i, arr) => (
              <div key={s.l} style={{ flex:1, textAlign:"center", padding:"14px 8px", borderRight: i < arr.length-1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>{s.l}</div>
                <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"0 24px 24px" }}>
          <div style={{ background:"#fff", padding:24, borderRadius:"12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", marginTop:0 }}>
            
            {/* Tabs */}
            <div style={{ display:"flex", gap:3, marginBottom:20, flexWrap:"wrap", borderBottom:"1px solid #e5e7eb", paddingBottom:8 }}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                    padding:"8px 14px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer",
                    fontWeight:600, fontSize:12,
                    background: isActive ? PRIMARY_LIGHT : "transparent",
                    color: isActive ? PRIMARY_COLOR : "#6b7280",
                    display:"flex", alignItems:"center", gap:5,
                  }}>
                    <span style={{ fontSize:13 }}>{tab.icon}</span>{tab.label}
                  </button>
                );
              })}
            </div>

            {/* Filtres (sauf pour le dashboard et exports) */}
            {(activeTab !== "dashboard" && activeTab !== "exports") && (
              <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
                <select value={periode} onChange={e => setPeriode(e.target.value)} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #e5e7eb", fontSize:12 }}>
                  <option value="semaine">Semaine</option><option value="mois">Mois</option><option value="trimestre">Trimestre</option><option value="annee">Année</option>
                </select>
                {activeTab === "inscriptions" && (
                  <>
                    <select value={filtreOffre} onChange={e => setFiltreOffre(e.target.value)} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #e5e7eb", fontSize:12 }}>
                      <option value="Toutes">Toutes offres</option>
                      {OFFRE_LIST.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <select value={filtreProfil} onChange={e => setFiltreProfil(e.target.value)} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #e5e7eb", fontSize:12 }}>
                      <option value="Tous">Tous profils</option>
                      {PROFIL_LIST.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <input type="text" placeholder="🔍 Nom apprenant..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #e5e7eb", fontSize:12, width:200 }} />
                  </>
                )}
                {(periode !== "mois" || filtreOffre !== "Toutes" || filtreProfil !== "Tous" || searchTerm) && (
                  <button onClick={() => { setPeriode("mois"); setFiltreOffre("Toutes"); setFiltreProfil("Tous"); setSearchTerm(""); }} style={btnGhost}>Réinitialiser</button>
                )}
              </div>
            )}

            {/* TABLEAU DE BORD */}
            {activeTab === "dashboard" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
                  <StatCard label="Dossiers en cours" value={stats.dossiersEnCours} color={PRIMARY_COLOR} icon="📂" sub="à traiter" />
                  <StatCard label="Paiements du jour" value={formatMoney(stats.paiementsJour)} color="#22c55e" icon="💳" sub={`${paiements.filter(p => p.date === new Date().toISOString().slice(0,10)).length} transactions`} />
                  <StatCard label="Requêtes en attente" value={stats.requetesEnAttente} color="#ef4444" icon="🕒" sub="non traitées" />
                  <StatCard label="Inscriptions récentes" value={inscriptions.length} color="#f59e0b" icon="📝" sub="7 derniers jours" />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>📊 Évolution des dossiers (mock)</div>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:100 }}>
                      {[12,15,18,22,28,34,38,42,45,48,52,58].map((val,idx)=>(
                        <div key={idx} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
                          <div style={{ height:`${val/1.2}px`, width:"100%", background:PRIMARY_COLOR, borderRadius:"4px 4px 0 0", minHeight:2 }} />
                          <span style={{ fontSize:8, marginTop:4 }}>{idx+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>📋 Répartition des requêtes par priorité</div>
                    {[
                      { l:"Haute", val:requetes.filter(r=>r.priorite==="haute").length, color:"#ef4444" },
                      { l:"Moyenne", val:requetes.filter(r=>r.priorite==="moyenne").length, color:"#f59e0b" },
                      { l:"Basse", val:requetes.filter(r=>r.priorite==="basse").length, color:"#22c55e" },
                    ].map(p => (
                      <div key={p.l} style={{ marginBottom:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:2 }}><span>{p.l}</span><span>{p.val}</span></div>
                        <ProgressBar value={(p.val/requetes.length)*100} color={p.color} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DOSSIERS */}
            {activeTab === "dossiers" && (
              <div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#f9fafb", fontSize:12 }}>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                  </thead>
                  <tbody>
                    {filteredDossiers.map(d => (
                      <tr key={d.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                        <td style={{ padding:8 }}>{d.client}</td>
                        <td style={{ padding:8 }}>{d.type}</td>
                        <td style={{ padding:8 }}>{formatMoney(d.montant)}</td>
                        <td style={{ padding:8 }}><span style={{ padding:"2px 8px", borderRadius:10, background:d.statut==="en_attente"?"#fef3c7":"#dbeafe", color:d.statut==="en_attente"?"#92400e":"#1e40af" }}>{d.statut}</span></td>
                        <td style={{ padding:8 }}>{formatDate(d.date)}</td>
                        <td style={{ padding:8 }}><button onClick={()=>toast.success(`Traiter dossier ${d.client}`)} style={btnIconEdit}>Traiter</button></td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAIEMENTS */}
            {activeTab === "paiements" && (
              <div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"#f9fafb", fontSize:12 }}>
                    <th>Client</th><th>Montant</th><th>Moyen</th><th>Date</th><th>Statut</th><th>Action</th>
                  </tr></thead>
                  <tbody>
                    {filteredPaiements.map(p => (
                      <tr key={p.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                        <td style={{ padding:8 }}>{p.client}</td>
                        <td style={{ padding:8 }}>{formatMoney(p.montant)}</td>
                        <td style={{ padding:8 }}>{p.moyen}</td>
                        <td style={{ padding:8 }}>{formatDate(p.date)}</td>
                        <td style={{ padding:8 }}><span style={{ padding:"2px 8px", borderRadius:10, background:p.statut==="validé"?"#dcfce7":"#fef3c7", color:p.statut==="validé"?"#166534":"#92400e" }}>{p.statut}</span></td>
                        <td style={{ padding:8 }}><button onClick={()=>toast.success(`Voir paiement ${p.client}`)} style={btnIconEdit}>Détail</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REQUÊTES */}
            {activeTab === "requetes" && (
              <div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"#f9fafb", fontSize:12 }}>
                    <th>Client</th><th>Sujet</th><th>Priorité</th><th>Statut</th><th>Date</th><th>Action</th>
                  </tr></thead>
                  <tbody>
                    {filteredRequetes.map(r => (
                      <tr key={r.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12, background:r.priorite==="haute"?"#fff5f5":"transparent" }}>
                        <td style={{ padding:8 }}>{r.client}</td>
                        <td style={{ padding:8 }}>{r.sujet}</td>
                        <td style={{ padding:8 }}><span style={{ padding:"2px 8px", borderRadius:10, background:r.priorite==="haute"?"#fee2e2":r.priorite==="moyenne"?"#fef3c7":"#dcfce7", color:r.priorite==="haute"?"#dc2626":r.priorite==="moyenne"?"#92400e":"#166534" }}>{r.priorite}</span></td>
                        <td style={{ padding:8 }}>{r.statut}</td>
                        <td style={{ padding:8 }}>{formatDate(r.date)}</td>
                        <td style={{ padding:8 }}><button onClick={()=>toast.success(`Traiter requête de ${r.client}`)} style={btnIconEdit}>Traiter</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* INSCRIPTIONS */}
            {activeTab === "inscriptions" && (
              <div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
                  <button onClick={()=>toast.success("Ajouter une inscription")} style={btnPrimary}>+ Nouvelle inscription</button>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"#f9fafb", fontSize:12 }}>
                    <th>Apprenant</th><th>Offre</th><th>Date</th><th>Statut</th><th>Action</th>
                  </tr></thead>
                  <tbody>
                    {filteredInscriptions.map(i => (
                      <tr key={i.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                        <td style={{ padding:8 }}>{i.nom}</td>
                        <td style={{ padding:8 }}>{i.offre}</td>
                        <td style={{ padding:8 }}>{formatDate(i.date)}</td>
                        <td style={{ padding:8 }}><span style={{ padding:"2px 8px", borderRadius:10, background:i.statut==="confirmée"?"#dcfce7":"#fef3c7", color:i.statut==="confirmée"?"#166534":"#92400e" }}>{i.statut}</span></td>
                        <td style={{ padding:8 }}><button onClick={()=>toast.success(`Dossier de ${i.nom}`)} style={btnIconEdit}>Voir</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* EXPORTS & PLANIFICATION */}
            {activeTab === "exports" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>📎 Exports manuels</h3>
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                      <button onClick={() => exportExcel(filteredDossiers, `dossiers_${new Date().toISOString().slice(0,10)}`)} style={btnPrimary}>📊 Dossiers (Excel)</button>
                      <button onClick={() => exportExcel(filteredPaiements, `paiements_${new Date().toISOString().slice(0,10)}`)} style={btnPrimary}>📊 Paiements (Excel)</button>
                      <button onClick={() => exportExcel(filteredRequetes, `requetes_${new Date().toISOString().slice(0,10)}`)} style={btnPrimary}>📊 Requêtes (Excel)</button>
                      <button onClick={() => exportExcel(filteredInscriptions, `inscriptions_${new Date().toISOString().slice(0,10)}`)} style={btnPrimary}>📊 Inscriptions (Excel)</button>
                      <button onClick={() => exportPDF(filteredDossiers, "Rapport_dossiers")} style={btnSecondary}>📄 PDF Dossiers</button>
                    </div>
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>⏱️ Envois automatiques</h3>
                    <p style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>Planifiez l’envoi de rapports récapitulatifs par email.</p>
                    <button onClick={() => setShowPlanifModal(true)} style={btnPrimary}>📧 Planifier un envoi</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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

/* ═══ STYLES ═══ */
const btnPrimary  = { padding:"9px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnSecondary = { padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnGhost     = { padding:"5px 10px", background:"none", color:PRIMARY_COLOR, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnIconEdit  = { padding:"4px 8px", background:PRIMARY_LIGHT, color:PRIMARY_DARK, border:`1px solid ${PRIMARY_COLOR}40`, borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:600 };
const labelSt      = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 };
const inputSt      = { padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%", boxSizing:"border-box" };
const modalOverlay = { position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 };
const modalBox     = { background:"#fff", padding:24, borderRadius:14, maxWidth:"92vw" };