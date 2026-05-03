// ══════════════════════════════════════════════════════════════════
// DashboardApprenant.jsx — BET · Tableau de bord Apprenant
// ══════════════════════════════════════════════════════════════════
import React, { useState } from "react";
import {
  FF, FD, StatCard, FilterBar, ExportBar, ScheduleModal,
  MiniLineChart, ProgressBar, Badge, DataTable,
  exportCSV, exportPDF, tabStyles as T,
} from "../Dashboard/Dashboardshared";

const TABS = [
  { id:"dashboard", l:"🏠 Tableau de bord" },
  { id:"cours",     l:"📚 Mes cours" },
  { id:"planning",  l:"📅 Planning" },
  { id:"resultats", l:"📊 Résultats" },
  { id:"paiements", l:"💳 Paiements" },
  { id:"materiels", l:"📁 Matériel" },
];

const MOCK = {
  user:{ name:"Awa Traoré", level:"B1", course:"Préparation TOEIC", avatar:"👩🏾‍💻", progress:68, nextScore:780 },
  stats:[
    { icon:"📈", label:"Progression", value:"68%", sub:"Objectif: B2", color:"#dc2626", trend:+5 },
    { icon:"📅", label:"Cours restants", value:"14", sub:"6 sem. de formation", color:"#1e3a8a", trend:0 },
    { icon:"📁", label:"Ressources dispos", value:"23", sub:"Vidéos, PDFs, quiz", color:"#7c3aed" },
    { icon:"💳", label:"Dernier paiement", value:"150K", sub:"FCFA · Il y a 3j", color:"#059669", trend:0 },
  ],
  progressData:[
    { l:"Oct", v:42 }, { l:"Nov", v:51 }, { l:"Déc", v:57 },
    { l:"Jan", v:62 }, { l:"Fév", v:65 }, { l:"Mar", v:68 },
  ],
  prochainsCours:[
    { date:"Lun 14/04", heure:"18h00–19h30", matiere:"TOEIC Listening Part 2", prof:"M. James Adou", salle:"Salle B3" },
    { date:"Mer 16/04", heure:"18h00–19h30", matiere:"TOEIC Reading Strategies", prof:"Prof. Ama Kouassi", salle:"Salle B3" },
    { date:"Sam 19/04", heure:"09h00–11h00", matiere:"Test blanc TOEIC n°3", prof:"Prof. Ama Kouassi", salle:"Salle Examen" },
  ],
  resultats:[
    { date:"10/03/25", epreuve:"Test blanc TOEIC n°1", score:"680/990", niveau:"B1", statut:"Validé" },
    { date:"24/03/25", epreuve:"Test blanc TOEIC n°2", score:"720/990", niveau:"B2", statut:"Validé" },
    { date:"05/04/25", epreuve:"Quiz Vocabulaire Pro", score:"84%", niveau:"B2", statut:"Validé" },
  ],
  paiements:[
    { date:"01/04/25", description:"Formation TOEIC — Mensualité 3/6", montant:"65 000 FCFA", mode:"Orange Money", statut:"✅ Payé" },
    { date:"01/03/25", description:"Formation TOEIC — Mensualité 2/6", montant:"65 000 FCFA", mode:"MTN MoMo",     statut:"✅ Payé" },
    { date:"01/02/25", description:"Formation TOEIC — Mensualité 1/6", montant:"65 000 FCFA", mode:"Wave",         statut:"✅ Payé" },
  ],
  materiels:[
    { type:"🎥", nom:"Listening Strategies TOEIC — Module 3", taille:"245 MB", date:"08/04/25" },
    { type:"📄", nom:"Guide 200 Questions TOEIC Corrigées", taille:"3.2 MB",  date:"05/04/25" },
    { type:"📄", nom:"Vocabulaire Professionnel — 500 mots", taille:"1.8 MB",  date:"01/04/25" },
    { type:"🎧", nom:"Podcast Business English Ep. 12",      taille:"18 MB",   date:"28/03/25" },
  ],
  categoryProgress:[
    { cat:"Listening", val:74, color:"#dc2626" },
    { cat:"Reading",   val:62, color:"#1e3a8a" },
    { cat:"Grammaire", val:71, color:"#7c3aed" },
    { cat:"Vocabulaire",val:65, color:"#059669" },
  ],
};

export default function DashboardApprenant() {
  const [activeTab,  setActiveTab]  = useState("dashboard");
  const [period,     setPeriod]     = useState("Mois");
  const [offre,      setOffre]      = useState("");
  const [schedModal, setSchedModal] = useState(false);

  const handleExportCSV = () => exportCSV(
    ["Date","Épreuve","Score","Niveau","Statut"],
    MOCK.resultats.map(r=>[r.date,r.epreuve,r.score,r.niveau,r.statut]),
    "resultats_apprenant"
  );

  return (
    <div style={{ fontFamily:FF, background:"#f8fafc", minHeight:"100vh", color:"#0f172a" }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e2a4a 55%,#1e3a8a 100%)", padding:"32px 28px 28px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"rgba(220,38,38,.08)", top:-100, right:-60, pointerEvents:"none" }}/>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20, marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#dc2626,#1e3a8a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", border:"2px solid rgba(255,255,255,.2)" }}>{MOCK.user.avatar}</div>
              <div>
                <p style={{ color:"rgba(255,255,255,.6)", fontSize:".8rem", margin:"0 0 3px", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" }}>Espace Apprenant</p>
                <h1 style={{ fontFamily:FD, fontWeight:800, fontSize:"1.4rem", color:"#fff", margin:0 }}>Bonjour, {MOCK.user.name.split(" ")[0]} 👋</h1>
                <p style={{ color:"rgba(255,255,255,.55)", fontSize:".8rem", margin:"3px 0 0" }}>{MOCK.user.course} · Niveau {MOCK.user.level}</p>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ background:"rgba(220,38,38,.2)", border:"1px solid rgba(220,38,38,.4)", borderRadius:10, padding:"8px 16px", textAlign:"center" }}>
                <div style={{ fontFamily:FD, fontWeight:800, fontSize:"1.3rem", color:"#fca5a5" }}>{MOCK.user.progress}%</div>
                <div style={{ fontSize:".7rem", color:"rgba(255,255,255,.55)", fontWeight:600 }}>PROGRESSION</div>
              </div>
              <div style={{ background:"rgba(30,58,138,.3)", border:"1px solid rgba(30,58,138,.5)", borderRadius:10, padding:"8px 16px", textAlign:"center" }}>
                <div style={{ fontFamily:FD, fontWeight:800, fontSize:"1.3rem", color:"#93c5fd" }}>{MOCK.user.nextScore}</div>
                <div style={{ fontSize:".7rem", color:"rgba(255,255,255,.55)", fontWeight:600 }}>SCORE VISÉ</div>
              </div>
            </div>
          </div>
          {/* Stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {MOCK.stats.map((s,i)=><StatCard key={i} {...s} idx={i}/>)}
          </div>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div style={T.tabsBar}>
        <div style={T.tabsInner}>
          {TABS.map(t=><button key={t.id} style={T.tabBtn(activeTab===t.id)} onClick={()=>setActiveTab(t.id)}>{t.l}</button>)}
        </div>
      </div>

      <div style={T.body}>

        {/* ── FILTRES & EXPORT ─────────────────────────────── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14, marginBottom:8 }}>
          <FilterBar period={period} setPeriod={setPeriod} offre={offre} setOffre={setOffre} offres={["TOEIC","Anglais général","Anglais affaires"]} />
          <ExportBar onExportCSV={handleExportCSV} onExportPDF={()=>exportPDF("Mon tableau de bord — BET")} onSchedule={()=>setSchedModal(true)}/>
        </div>

        {/* ── DASHBOARD ──────────────────────────────────────── */}
        {activeTab==="dashboard" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, animation:"dbFU .4s ease" }}>
            <div>
              {/* Progression chart */}
              <div style={T.sectionCard}>
                <h2 style={T.sH2}>📈 Évolution de votre progression</h2>
                <MiniLineChart data={MOCK.progressData} color="#dc2626"/>
                <div style={{ display:"flex", gap:16, marginTop:16 }}>
                  {MOCK.categoryProgress.map((c,i)=>(
                    <div key={i} style={{ flex:1 }}>
                      <ProgressBar value={c.val} color={c.color} label={c.cat}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prochains cours */}
              <div style={T.sectionCard}>
                <h2 style={T.sH2}>📅 Prochains cours</h2>
                {MOCK.prochainsCours.map((c,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:i<MOCK.prochainsCours.length-1?"1px solid #f1f5f9":"none" }}>
                    <div style={{ width:44, textAlign:"center", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"6px 4px" }}>
                      <div style={{ fontSize:".7rem", fontWeight:800, color:"#dc2626" }}>{c.date.split(" ")[0]}</div>
                      <div style={{ fontSize:".72rem", color:"#64748b" }}>{c.date.split(" ")[1]}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:".88rem" }}>{c.matiere}</div>
                      <div style={{ fontSize:".76rem", color:"#64748b" }}>{c.heure} · {c.prof} · {c.salle}</div>
                    </div>
                    <Badge label="Confirmé" color="#059669"/>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div style={T.sectionCard}>
                <h2 style={T.sH2}>🎯 Objectif TOEIC</h2>
                <div style={{ textAlign:"center", padding:"10px 0 16px" }}>
                  <div style={{ fontFamily:FD, fontWeight:800, fontSize:"2.5rem", color:"#dc2626" }}>{MOCK.user.nextScore}</div>
                  <div style={{ fontSize:".78rem", color:"#64748b" }}>Score visé (actuellement ~720)</div>
                </div>
                <ProgressBar value={68} color="#dc2626" label="Progression vers B2"/>
                <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"10px 12px", marginTop:12, fontSize:".78rem", color:"#059669", fontWeight:600 }}>
                  ✓ +60 points depuis votre inscription
                </div>
              </div>
              <div style={T.sectionCard}>
                <h2 style={T.sH2}>💳 Paiements récents</h2>
                {MOCK.paiements.slice(0,2).map((p,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<1?"1px solid #f1f5f9":"none" }}>
                    <div style={{ fontSize:".8rem" }}>
                      <div style={{ fontWeight:700 }}>{p.description.split("—")[1]?.trim()}</div>
                      <div style={{ color:"#94a3b8", fontSize:".72rem" }}>{p.date}</div>
                    </div>
                    <Badge label="✅ Payé" color="#059669"/>
                  </div>
                ))}
                <button style={{ width:"100%", marginTop:12, padding:"8px", background:"transparent", border:"1.5px solid #1e3a8a", color:"#1e3a8a", borderRadius:8, fontFamily:FF, fontWeight:700, fontSize:".8rem", cursor:"pointer" }} onClick={()=>setActiveTab("paiements")}>Voir tout →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── RÉSULTATS ─────────────────────────────────────── */}
        {activeTab==="resultats" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📊 Historique de vos résultats</h2>
              <DataTable
                columns={["Date","Épreuve","Score","Niveau","Statut"]}
                rows={MOCK.resultats.map(r=>[r.date,r.epreuve,<strong style={{color:"#dc2626"}}>{r.score}</strong>,<Badge label={r.niveau} color="#1e3a8a"/>,r.statut])}
              />
            </div>
          </div>
        )}

        {/* ── PAIEMENTS ─────────────────────────────────────── */}
        {activeTab==="paiements" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>💳 Historique des paiements</h2>
              <DataTable
                columns={["Date","Description","Montant","Mode","Statut"]}
                rows={MOCK.paiements.map(p=>[p.date,p.description,<strong style={{color:"#0f172a"}}>{p.montant}</strong>,p.mode,p.statut])}
              />
            </div>
          </div>
        )}

        {/* ── MATÉRIEL ──────────────────────────────────────── */}
        {activeTab==="materiels" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📁 Ressources disponibles</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {MOCK.materiels.map((m,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10 }}>
                    <span style={{ fontSize:"1.5rem" }}>{m.type}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:".88rem" }}>{m.nom}</div>
                      <div style={{ fontSize:".74rem", color:"#64748b" }}>{m.taille} · Ajouté le {m.date}</div>
                    </div>
                    <button style={{ padding:"6px 16px", background:"#dc2626", color:"#fff", border:"none", borderRadius:999, fontFamily:FF, fontWeight:700, fontSize:".76rem", cursor:"pointer" }}>Télécharger</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PLANNING ──────────────────────────────────────── */}
        {activeTab==="planning" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📅 Planning de la semaine</h2>
              <DataTable
                columns={["Date","Horaire","Cours","Professeur","Salle"]}
                rows={MOCK.prochainsCours.map(c=>[<strong>{c.date}</strong>,c.heure,c.matiere,c.prof,c.salle])}
              />
            </div>
          </div>
        )}

        {/* ── COURS ─────────────────────────────────────────── */}
        {activeTab==="cours" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📚 Mes formations en cours</h2>
              <div style={{ background:"linear-gradient(135deg,#fef2f2,#eff6ff)", border:"1px solid #e2e8f0", borderRadius:12, padding:"20px 22px", marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                  <div>
                    <Badge label="EN COURS" color="#dc2626"/>
                    <h3 style={{ fontFamily:FD, fontWeight:800, fontSize:"1.2rem", margin:"10px 0 6px" }}>{MOCK.user.course}</h3>
                    <p style={{ fontSize:".86rem", color:"#64748b", margin:0 }}>6 semaines intensives · 48 sessions · Coach M. James Adou</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:FD, fontWeight:800, fontSize:"1.8rem", color:"#dc2626" }}>68%</div>
                    <div style={{ fontSize:".74rem", color:"#64748b" }}>14 sessions restantes</div>
                  </div>
                </div>
                <ProgressBar value={68} color="#dc2626"/>
              </div>
            </div>
          </div>
        )}
      </div>

      {schedModal && <ScheduleModal onClose={()=>setSchedModal(false)}/>}
    </div>
  );
}