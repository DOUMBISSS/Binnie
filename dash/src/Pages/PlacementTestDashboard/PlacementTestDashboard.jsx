// src/Pages/PlacementTestDashboard/PlacementTestDashboard.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import NotificationBell from "../../Components/NotificationBell";
import { useNotifPoller } from "../../hooks/useNotifPoller";

/* ═══════════════════════════════════════════════════════
   CHARTE COULEURS — Agent Placement Test
═══════════════════════════════════════════════════════ */
const PRIMARY_COLOR   = "#0891b2";
const PRIMARY_LIGHT   = "#e0f2fe";
const GRADIENT_HEADER = "linear-gradient(135deg, #0f172a 0%, #0891b2 100%)";
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
    <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:wide?740:560, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.2)", padding:28 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:8, width:32, height:32, fontSize:16, cursor:"pointer", color:"#6b7280" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK
═══════════════════════════════════════════════════════ */
const NIVEAUX_CECR = ["A1","A2","B1","B2","C1","C2"];

const QUESTIONS_MOCK = [
  { q:"Choose the correct form: 'She ___ to the market every day.'", opts:["go","goes","gone","going"], correct:1 },
  { q:"Which sentence is correct?", opts:["I am agree","I agree","I agreeing","I agreed to"], correct:1 },
  { q:"'Despite the rain, we ___ outside.'", opts:["stayed","stay","staying","have stay"], correct:0 },
  { q:"Select the appropriate tense: 'By 2025, she ___ three degrees.'", opts:["will have earned","earned","was earning","has earned"], correct:0 },
];

const INIT_TESTS = [
  {
    id:1, nom:"Kouamé", prenom:"Yao", email:"yao.k@gmail.com", telephone:"+225 07 11 22 33",
    profil:"Particulier", source:"Site web", date:"2026-05-15 09:14",
    score:62, niveau_auto:"B1", niveau_valide:null, statut:"en_attente",
    reponses:[1,1,0,0], commentaire:"", notifie:false,
    assistante:"Adjoua Koné", centre_dest:"Cocody",
  },
  {
    id:2, nom:"Diallo", prenom:"Aïssatou", email:"aissatou.d@yahoo.fr", telephone:"+225 05 44 55 66",
    profil:"Étudiant", source:"Formulaire", date:"2026-05-15 10:32",
    score:41, niveau_auto:"A2", niveau_valide:"A2", statut:"validé",
    reponses:[1,1,0,0], commentaire:"Niveau A2 confirmé. Accent francophone fort, recommander A2 intensif.", notifie:true,
    assistante:"Mamadou Bah", centre_dest:"Plateau",
  },
  {
    id:3, nom:"Traoré", prenom:"Ibrahima", email:"itraoré@totalci.com", telephone:"+225 01 77 88 99",
    profil:"Entreprise", source:"Partenaire", date:"2026-05-14 16:05",
    score:78, niveau_auto:"B2", niveau_valide:null, statut:"en_attente",
    reponses:[1,1,1,0], commentaire:"", notifie:false,
    assistante:"Adjoua Koné", centre_dest:"Plateau",
  },
  {
    id:4, nom:"N'Guessan", prenom:"Marie", email:"marie.n@cci.ci", telephone:"+225 07 33 44 55",
    profil:"Particulier", source:"Site web", date:"2026-05-14 11:18",
    score:28, niveau_auto:"A1", niveau_valide:"A1", statut:"validé",
    reponses:[0,0,0,0], commentaire:"A1 confirmé. Débutante complète. Orientation cours d'initiation.", notifie:true,
    assistante:"Fatou Camara", centre_dest:"Yopougon",
  },
  {
    id:5, nom:"Bamba", prenom:"Seydou", email:"s.bamba@orange.ci", telephone:"+225 07 88 99 00",
    profil:"Entreprise", source:"Recommandation", date:"2026-05-13 14:22",
    score:88, niveau_auto:"C1", niveau_valide:null, statut:"en_attente",
    reponses:[1,1,1,1], commentaire:"", notifie:false,
    assistante:"Mamadou Bah", centre_dest:"Plateau",
  },
  {
    id:6, nom:"Koné", prenom:"Adèle", email:"adele.k@gmail.com", telephone:"+225 05 22 33 44",
    profil:"Étudiant", source:"Formulaire", date:"2026-05-13 08:47",
    score:55, niveau_auto:"B1", niveau_valide:"B1", statut:"ajusté",
    reponses:[1,0,1,0], commentaire:"Profil B1 solide en compréhension mais expression orale faible. Recommander B1 avec focus communication.", notifie:true,
    assistante:"Adjoua Koné", centre_dest:"Cocody",
  },
];

const NIVEAUX_COLOR = { A1:"#94a3b8",A2:"#64748b",B1:"#3b82f6",B2:"#1e40af",C1:"#7c3aed",C2:"#059669" };

/* ═══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function PlacementTestDashboard() {
  const navigate   = useNavigate();
  const profil     = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom     = profil?.prenom || "";
  const nom        = profil?.nom    || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || "Agent Placement Test";
  const initiales  = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "PT";

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace:true });
  };

  useNotifPoller({ userId: profil?.id, sources: ["level_tests"] });

  const [activeTab,  setActiveTab]  = useState("file");
  const [tests,      setTests]      = useState(INIT_TESTS);
  const [selected,   setSelected]   = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [searchQ,    setSearchQ]    = useState("");

  /* formulaire de validation */
  const [niveauChoisi,  setNiveauChoisi]  = useState("");
  const [commentaire,   setCommentaire]   = useState("");

  const stats = useMemo(() => ({
    enAttente: tests.filter(t=>t.statut==="en_attente").length,
    validés:   tests.filter(t=>t.statut==="validé").length,
    ajustés:   tests.filter(t=>t.statut==="ajusté").length,
    total:     tests.length,
  }), [tests]);

  const testsFiltres = useMemo(() => {
    return tests.filter(t => {
      const qMatch = !searchQ || (t.nom+" "+t.prenom).toLowerCase().includes(searchQ.toLowerCase()) || t.email.toLowerCase().includes(searchQ.toLowerCase());
      const sMatch = filtreStatut==="Tous" || t.statut===filtreStatut;
      return qMatch && sMatch;
    }).sort((a,b)=> a.statut==="en_attente"?-1:1);
  }, [tests, searchQ, filtreStatut]);

  const openDetail = (t) => {
    setSelected(t);
    setNiveauChoisi(t.niveau_valide || t.niveau_auto);
    setCommentaire(t.commentaire || "");
    setShowDetail(true);
  };

  const handleValider = (ajuste=false) => {
    if (!selected) return;
    if (!commentaire.trim()) { toast.error("Un commentaire pédagogique est requis"); return; }
    const nv = ajuste && niveauChoisi !== selected.niveau_auto ? niveauChoisi : selected.niveau_auto;
    setTests(prev => prev.map(t => t.id === selected.id
      ? { ...t, niveau_valide:niveauChoisi, statut:ajuste?"ajusté":"validé", commentaire, notifie:true }
      : t
    ));
    toast.success(`Niveau ${niveauChoisi} ${ajuste?"ajusté":"confirmé"} — ${selected.assistante} notifié(e) ✓`);
    setShowDetail(false);
  };

  const TABS = [
    { key:"file",      label:"File d'attente",  icon:"📥", badge:stats.enAttente },
    { key:"validés",   label:"Validés",          icon:"✅" },
    { key:"rapports",  label:"Rapports",         icon:"📊" },
  ];

  const selectSt = { padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, background:"#fff", fontFamily:FF };
  const inputSt  = { padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, fontFamily:FF };

  const statutBadge = (s) => ({
    en_attente: { label:"En attente", color:"#d97706", bg:"#fef3c7" },
    validé:     { label:"Validé",     color:"#16a34a", bg:"#dcfce7" },
    ajusté:     { label:"Ajusté",     color:"#7c3aed", bg:"#ede9fe" },
  }[s] || { label:s, color:"#6b7280", bg:"#f3f4f6" });

  return (
    <div style={{ minHeight:"100vh", background:"#f0f9ff", fontFamily:FF }}>
      <Toaster position="top-right" />

      {/* ── HERO HEADER ── */}
      <div style={{ background:GRADIENT_HEADER, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
        <div style={{ position:"absolute", bottom:-60, right:80, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }} />
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
            <div>
              <div style={{ fontSize:11, color:"#7dd3fc", fontWeight:600, letterSpacing:"0.08em" }}>Bonjour 👋</div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{nomComplet}</h1>
              <div style={{ fontSize:12, color:"#bae6fd", marginTop:3 }}>🧪 Agent Placement Test · {profil?.email || ""}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {stats.enAttente > 0 && (
              <div style={{ background:"rgba(239,68,68,.28)", border:"1px solid rgba(239,68,68,.5)", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}
                onClick={()=>setActiveTab("file")}>
                ⏳ {stats.enAttente} test{stats.enAttente>1?"s":""} en attente
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
        {/* Mini KPIs */}
        <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden", position:"relative", zIndex:1 }}>
          {[
            { l:"En attente",  v:stats.enAttente,                                  c:"#fbbf24" },
            { l:"Validés",     v:stats.validés,                                    c:"#6ee7b7" },
            { l:"Ajustés",     v:stats.ajustés,                                    c:"#c4b5fd" },
            { l:"Total reçus", v:stats.total,                                      c:"#93c5fd" },
          ].map((s,i,arr)=>(
            <div key={s.l} style={{ flex:1, textAlign:"center", padding:"14px 8px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.08)":"none" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>{s.l}</div>
              <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 24px 32px" }}>
        <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", overflow:"hidden" }}>

          {/* ── Onglets ── */}
          <div style={{ display:"flex", gap:0, borderBottom:"1px solid #e5e7eb", overflowX:"auto", background:"#fafafa" }}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
                padding:"12px 18px", border:"none",
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

            {/* ══════════════ FILE D'ATTENTE ══════════════ */}
            {activeTab === "file" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <input placeholder="🔍 Rechercher nom, email…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{ ...inputSt, width:220 }} />
                  <select value={filtreStatut} onChange={e=>setFiltreStatut(e.target.value)} style={selectSt}>
                    <option value="Tous">Tous les statuts</option>
                    <option value="en_attente">En attente</option>
                    <option value="validé">Validé</option>
                    <option value="ajusté">Ajusté</option>
                  </select>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {testsFiltres.map(t=>{
                    const sb = statutBadge(t.statut);
                    const nc = NIVEAUX_COLOR[t.niveau_auto]||PRIMARY_COLOR;
                    return (
                      <div key={t.id} style={{
                        background:t.statut==="en_attente"?"#f0f9ff":"#fff",
                        borderRadius:12, padding:"16px 20px",
                        border:`1.5px solid ${t.statut==="en_attente"?"#bae6fd":"#e5e7eb"}`,
                        boxShadow:"0 1px 6px rgba(0,0,0,.04)",
                        display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
                      }}>
                        {/* Infos prospect */}
                        <div style={{ display:"flex", alignItems:"center", gap:14, flex:1, minWidth:0 }}>
                          <div style={{ width:42, height:42, borderRadius:"50%", background:nc+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:nc, flexShrink:0 }}>
                            {t.niveau_auto}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{t.prenom} {t.nom}</div>
                            <div style={{ fontSize:12, color:"#64748b", marginTop:1 }}>{t.email} · {t.telephone}</div>
                            <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>{t.profil} · via {t.source} · {t.date}</div>
                          </div>
                        </div>

                        {/* Score + niveau auto */}
                        <div style={{ textAlign:"center", flexShrink:0 }}>
                          <div style={{ fontSize:22, fontWeight:900, color:nc }}>{t.score}%</div>
                          <div style={{ fontSize:10, color:"#94a3b8" }}>Score brut</div>
                          <Badge label={`Niveau IA : ${t.niveau_auto}`} color={nc} bg={nc+"18"} />
                        </div>

                        {/* Assigné à */}
                        <div style={{ textAlign:"center", flexShrink:0 }}>
                          <div style={{ fontSize:11, color:"#94a3b8", marginBottom:2 }}>Assigné à</div>
                          <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{t.assistante}</div>
                          <div style={{ fontSize:11, color:"#64748b" }}>📍 {t.centre_dest}</div>
                        </div>

                        {/* Statut + actions */}
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                          <Badge label={sb.label} color={sb.color} bg={sb.bg} />
                          {t.notifie && <Badge label="✓ Notifié" color="#16a34a" bg="#dcfce7" />}
                          <button onClick={()=>openDetail(t)} style={{
                            padding:"7px 16px", background:t.statut==="en_attente"?PRIMARY_COLOR:"#f1f5f9",
                            color:t.statut==="en_attente"?"#fff":"#374151",
                            border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer",
                          }}>
                            {t.statut==="en_attente"?"✏️ Valider":"👁 Voir"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {testsFiltres.length===0 && (
                    <div style={{ textAlign:"center", padding:40, color:"#94a3b8", fontSize:14 }}>
                      Aucun test trouvé
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════ VALIDÉS ══════════════ */}
            {activeTab === "validés" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ fontSize:13, color:"#64748b" }}>
                  {tests.filter(t=>t.statut!=="en_attente").length} test{tests.filter(t=>t.statut!=="en_attente").length>1?"s":""} traités
                </div>
                {tests.filter(t=>t.statut!=="en_attente").map(t=>{
                  const sb = statutBadge(t.statut);
                  const nc = NIVEAUX_COLOR[t.niveau_valide||t.niveau_auto]||PRIMARY_COLOR;
                  const ajuste = t.niveau_valide !== t.niveau_auto;
                  return (
                    <div key={t.id} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e5e7eb", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14 }}>{t.prenom} {t.nom}
                            <span style={{ fontSize:11, color:"#94a3b8", fontWeight:400, marginLeft:8 }}>{t.email}</span>
                          </div>
                          <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>{t.profil} · {t.source} · {t.date}</div>
                          {t.commentaire && (
                            <div style={{ marginTop:10, padding:"8px 12px", background:"#f0f9ff", borderRadius:8, fontSize:12, color:"#0369a1", borderLeft:"3px solid #0891b2" }}>
                              💬 {t.commentaire}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ display:"flex", gap:6, justifyContent:"flex-end", marginBottom:4 }}>
                            {ajuste && <Badge label={`IA : ${t.niveau_auto}`} color="#94a3b8" bg="#f3f4f6" />}
                            <Badge label={`${ajuste?"→ Ajusté :":""} ${t.niveau_valide}`} color={nc} bg={nc+"18"} />
                            <Badge label={sb.label} color={sb.color} bg={sb.bg} />
                          </div>
                          <div style={{ fontSize:11, color:"#94a3b8" }}>
                            Notifié → {t.assistante}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══════════════ RAPPORTS ══════════════ */}
            {activeTab === "rapports" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                  <StatCard label="Tests reçus"    value={stats.total}     icon="📥" color={PRIMARY_COLOR} />
                  <StatCard label="En attente"      value={stats.enAttente} icon="⏳" color="#d97706" />
                  <StatCard label="Validés"         value={stats.validés}   icon="✅" color="#16a34a" />
                  <StatCard label="Niveaux ajustés" value={stats.ajustés}   icon="✏️" color="#7c3aed" sub={`${stats.total?Math.round((stats.ajustés/stats.total)*100):0}% taux d'ajustement`} />
                </div>

                {/* Répartition par niveau */}
                <div style={{ background:"#fff", borderRadius:12, padding:22, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>📊 Répartition par niveau CECR (IA)</div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {NIVEAUX_CECR.map(n=>{
                      const count = tests.filter(t=>t.niveau_auto===n).length;
                      const color = NIVEAUX_COLOR[n]||PRIMARY_COLOR;
                      return (
                        <div key={n} style={{ flex:"1 1 80px", background:color+"10", borderRadius:10, padding:"14px 12px", border:`1.5px solid ${color}30`, textAlign:"center" }}>
                          <div style={{ fontSize:22, fontWeight:900, color }}>{n}</div>
                          <div style={{ fontSize:20, fontWeight:800, color, marginTop:4 }}>{count}</div>
                          <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>test{count>1?"s":""}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Taux ajustement IA */}
                <div style={{ background:"#fff", borderRadius:12, padding:22, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>🧠 Fiabilité du niveau IA</div>
                  {NIVEAUX_CECR.map(n=>{
                    const total   = tests.filter(t=>t.niveau_auto===n).length;
                    const confirms = tests.filter(t=>t.niveau_auto===n && t.niveau_valide===n).length;
                    const pct = total ? Math.round((confirms/total)*100) : 0;
                    const color = pct>=80?"#16a34a":pct>=60?"#d97706":"#dc2626";
                    if (!total) return null;
                    return (
                      <div key={n} style={{ marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                          <span style={{ fontWeight:600 }}>Niveau {n}</span>
                          <span style={{ color, fontWeight:700 }}>{pct}% confirmés <span style={{ color:"#94a3b8", fontWeight:400 }}>({confirms}/{total})</span></span>
                        </div>
                        <div style={{ height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Par source */}
                <div style={{ background:"#fff", borderRadius:12, padding:22, border:"1px solid #f1f5f9", boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>📋 Tests par source</div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {["Site web","Formulaire","Partenaire","Recommandation"].map(src=>{
                      const count = tests.filter(t=>t.source===src).length;
                      return (
                        <div key={src} style={{ flex:"1 1 120px", background:"#f8fafc", borderRadius:10, padding:"12px 14px", border:"1px solid #e5e7eb", textAlign:"center" }}>
                          <div style={{ fontSize:12, color:"#64748b" }}>{src}</div>
                          <div style={{ fontSize:24, fontWeight:900, color:PRIMARY_COLOR, marginTop:4 }}>{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>{/* fin padding 24 */}
        </div>{/* fin white card */}
      </div>{/* fin outer padding */}

      {/* ══ MODAL DÉTAIL / VALIDATION ══ */}
      {showDetail && selected && (
        <Modal title={`🧪 Test de placement — ${selected.prenom} ${selected.nom}`} onClose={()=>setShowDetail(false)} wide>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* Profil prospect */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { l:"Nom complet",  v:`${selected.prenom} ${selected.nom}` },
                { l:"Email",        v:selected.email },
                { l:"Téléphone",    v:selected.telephone },
                { l:"Profil",       v:selected.profil },
                { l:"Source",       v:selected.source },
                { l:"Date soumis",  v:selected.date },
              ].map(f=>(
                <div key={f.l} style={{ background:"#f8fafc", borderRadius:8, padding:"8px 12px" }}>
                  <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>{f.l}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginTop:2 }}>{f.v}</div>
                </div>
              ))}
            </div>

            {/* Score brut + niveau IA */}
            <div style={{ display:"flex", gap:12 }}>
              <div style={{ flex:1, background:`${NIVEAUX_COLOR[selected.niveau_auto]||PRIMARY_COLOR}12`, border:`1.5px solid ${NIVEAUX_COLOR[selected.niveau_auto]||PRIMARY_COLOR}30`, borderRadius:10, padding:"14px 18px", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#64748b" }}>Score brut</div>
                <div style={{ fontSize:36, fontWeight:900, color:NIVEAUX_COLOR[selected.niveau_auto]||PRIMARY_COLOR }}>{selected.score}%</div>
              </div>
              <div style={{ flex:1, background:"#f0f9ff", border:"1.5px solid #bae6fd", borderRadius:10, padding:"14px 18px", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#64748b" }}>Niveau attribué par l'IA</div>
                <div style={{ fontSize:36, fontWeight:900, color:NIVEAUX_COLOR[selected.niveau_auto]||PRIMARY_COLOR }}>{selected.niveau_auto}</div>
              </div>
            </div>

            {/* Réponses détaillées */}
            <div>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>📋 Réponses détaillées</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {QUESTIONS_MOCK.map((q,i)=>{
                  const given   = selected.reponses[i];
                  const correct = q.correct;
                  const ok      = given === correct;
                  return (
                    <div key={i} style={{ padding:"10px 14px", borderRadius:10, border:`1px solid ${ok?"#bbf7d0":"#fca5a5"}`, background:ok?"#f0fdf4":"#fff5f5" }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"#0f172a", marginBottom:6 }}>Q{i+1}. {q.q}</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {q.opts.map((o,j)=>(
                          <span key={j} style={{
                            padding:"3px 10px", borderRadius:6, fontSize:11,
                            background: j===correct?"#dcfce7":j===given&&!ok?"#fee2e2":"#f3f4f6",
                            color:       j===correct?"#16a34a":j===given&&!ok?"#dc2626":"#64748b",
                            fontWeight:  j===correct||j===given?700:400,
                            border:`1px solid ${j===correct?"#86efac":j===given&&!ok?"#fca5a5":"#e5e7eb"}`,
                          }}>
                            {o} {j===correct?"✓":""}{j===given&&!ok?"✗":""}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Niveau à valider */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Niveau CECR à attribuer *</label>
                <select value={niveauChoisi} onChange={e=>setNiveauChoisi(e.target.value)} style={{ padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:14, fontWeight:700, width:"100%" }}>
                  {NIVEAUX_CECR.map(n=><option key={n}>{n}</option>)}
                </select>
                {niveauChoisi !== selected.niveau_auto && (
                  <div style={{ marginTop:6, fontSize:12, color:"#d97706", fontWeight:600 }}>
                    ⚠️ Vous allez ajuster le niveau IA ({selected.niveau_auto} → {niveauChoisi})
                  </div>
                )}
              </div>
              <div style={{ background:"#f0f9ff", borderRadius:10, padding:"10px 14px", border:"1px solid #bae6fd" }}>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Assigné à</div>
                <div style={{ fontWeight:700, fontSize:14 }}>{selected.assistante}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>📍 {selected.centre_dest}</div>
              </div>
            </div>

            {/* Commentaire pédagogique */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Commentaire pédagogique * <span style={{ fontWeight:400, color:"#94a3b8" }}>(obligatoire)</span></label>
              <textarea
                rows={3}
                placeholder="Ex : Accent francophone marqué, recommander B1 intensif avec focus expression orale…"
                value={commentaire}
                onChange={e=>setCommentaire(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, fontFamily:FF, resize:"vertical", boxSizing:"border-box" }}
              />
            </div>

            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button onClick={()=>setShowDetail(false)} style={{ padding:"9px 18px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>Annuler</button>
              {niveauChoisi !== selected.niveau_auto ? (
                <button onClick={()=>handleValider(true)} style={{ padding:"9px 20px", background:"#7c3aed", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  ✏️ Valider avec ajustement ({selected.niveau_auto} → {niveauChoisi})
                </button>
              ) : (
                <button onClick={()=>handleValider(false)} style={{ padding:"9px 20px", background:"#16a34a", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  ✅ Confirmer niveau {niveauChoisi} & notifier
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
