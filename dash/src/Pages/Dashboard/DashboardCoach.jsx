// ══════════════════════════════════════════════════════════════════
// DashboardCoach.jsx — BET · Tableau de bord Coach / Enseignant
// ══════════════════════════════════════════════════════════════════
import React, { useState } from "react";
import {
  FF, FD, StatCard, FilterBar, ExportBar, ScheduleModal,
  MiniBarChart, ProgressBar, Badge, DataTable,
  exportCSV, exportPDF, tabStyles as T,
} from "../Dashboard/Dashboardshared";

const TABS = [
  { id:"dashboard", l:"🏠 Tableau de bord" },
  { id:"apprenants", l:"👥 Mes apprenants" },
  { id:"presence",  l:"✅ Présences" },
  { id:"notes",     l:"📝 Notes" },
  { id:"materiels", l:"📁 Matériel partagé" },
  { id:"planning",  l:"📅 Planning" },
];

const MOCK = {
  user:{ name:"M. James Adou", role:"Formateur TOEIC Senior", cert:"TOEIC 990 · CELTA", avatar:"👨🏿‍🏫" },
  stats:[
    { icon:"👥", label:"Apprenants suivis",  value:"34",  sub:"3 classes actives",        color:"#dc2626", trend:+3 },
    { icon:"✅", label:"Taux de présence",   value:"87%", sub:"Semaine en cours",          color:"#1e3a8a", trend:+2 },
    { icon:"📁", label:"Matériels partagés", value:"47",  sub:"Ce mois · 12 nouveaux",    color:"#7c3aed" },
    { icon:"📝", label:"Notes saisies",       value:"128", sub:"Sur 136 attendues",         color:"#059669", trend:-1 },
  ],
  presenceData:[
    { l:"S1", v:91 }, { l:"S2", v:85 }, { l:"S3", v:88 },
    { l:"S4", v:84 }, { l:"S5", v:90 }, { l:"S6", v:87 },
  ],
  apprenants:[
    { nom:"Awa Traoré",     classe:"TOEIC B1→B2", progression:68, presence:92, dernierScore:"720/990", statut:"Actif" },
    { nom:"Kouamé Brou",    classe:"TOEIC B1→B2", progression:54, presence:78, dernierScore:"640/990", statut:"Actif" },
    { nom:"Fatoumata Diallo",classe:"TOEIC B1→B2", progression:82, presence:96, dernierScore:"780/990", statut:"Actif" },
    { nom:"Serge Assoua",   classe:"TOEIC B2→C1", progression:71, presence:88, dernierScore:"820/990", statut:"Actif" },
    { nom:"Marie Kouamé",   classe:"TOEIC B1→B2", progression:45, presence:65, dernierScore:"580/990", statut:"⚠ Risque" },
  ],
  presenceSheet:[
    { date:"14/04/25 18h00", classe:"TOEIC B1→B2",  presents:11, absents:2, taux:"85%" },
    { date:"12/04/25 10h00", classe:"TOEIC B2→C1",  presents:8,  absents:1, taux:"89%" },
    { date:"10/04/25 18h00", classe:"TOEIC B1→B2",  presents:12, absents:1, taux:"92%" },
  ],
  notesRecentes:[
    { apprenant:"Fatoumata Diallo", evaluation:"Test blanc n°3", note:"78/100", cecrl:"B2", date:"10/04/25" },
    { apprenant:"Serge Assoua",     evaluation:"Test blanc n°3", note:"82/100", cecrl:"C1", date:"10/04/25" },
    { apprenant:"Awa Traoré",       evaluation:"Test blanc n°3", note:"72/100", cecrl:"B1", date:"10/04/25" },
  ],
  materiels:[
    { nom:"Listening Part 2 — Exercices avancés", type:"📄 PDF", partageAvec:"TOEIC B1→B2", date:"08/04/25", telechargements:23 },
    { nom:"500 Vocab Professionnels Illustrés",    type:"📄 PDF", partageAvec:"Toutes classes", date:"05/04/25", telechargements:47 },
    { nom:"Podcast Business English S2",           type:"🎧 Audio", partageAvec:"TOEIC B2→C1", date:"01/04/25", telechargements:15 },
  ],
};

export default function DashboardCoach() {
  const [activeTab,  setActiveTab]  = useState("dashboard");
  const [period,     setPeriod]     = useState("Mois");
  const [offre,      setOffre]      = useState("");
  const [schedModal, setSchedModal] = useState(false);

  const handleExportCSV = () => exportCSV(
    ["Apprenant","Classe","Progression","Présence","Dernier score","Statut"],
    MOCK.apprenants.map(a=>[a.nom,a.classe,`${a.progression}%`,`${a.presence}%`,a.dernierScore,a.statut]),
    "apprenants_coach"
  );

  return (
    <div style={{ fontFamily:FF, background:"#f8fafc", minHeight:"100vh", color:"#0f172a" }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1a2540 55%,#1e3a8a 100%)", padding:"32px 28px 28px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:280, height:280, borderRadius:"50%", background:"rgba(220,38,38,.07)", top:-80, right:100, pointerEvents:"none" }}/>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20, marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#1e3a8a,#dc2626)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", border:"2px solid rgba(255,255,255,.2)" }}>{MOCK.user.avatar}</div>
              <div>
                <p style={{ color:"rgba(255,255,255,.55)", fontSize:".78rem", margin:"0 0 3px", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" }}>Espace Enseignant</p>
                <h1 style={{ fontFamily:FD, fontWeight:800, fontSize:"1.4rem", color:"#fff", margin:0 }}>{MOCK.user.name}</h1>
                <p style={{ color:"rgba(255,255,255,.55)", fontSize:".78rem", margin:"3px 0 0" }}>{MOCK.user.role} · {MOCK.user.cert}</p>
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              {[["3", "Classes actives"],["34","Apprenants"],["87%","Présence moy."]].map(([v,l],i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"8px 16px", textAlign:"center" }}>
                  <div style={{ fontFamily:FD, fontWeight:800, fontSize:"1.3rem", color:"#fff" }}>{v}</div>
                  <div style={{ fontSize:".68rem", color:"rgba(255,255,255,.5)", fontWeight:600 }}>{l.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
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
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14, marginBottom:8 }}>
          <FilterBar period={period} setPeriod={setPeriod} offre={offre} setOffre={setOffre} offres={["TOEIC B1→B2","TOEIC B2→C1","Anglais général"]}/>
          <ExportBar onExportCSV={handleExportCSV} onExportPDF={()=>exportPDF("Tableau de bord Coach — BET")} onSchedule={()=>setSchedModal(true)}/>
        </div>

        {activeTab==="dashboard" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>
              <div>
                {/* Présence chart */}
                <div style={T.sectionCard}>
                  <h2 style={T.sH2}>📊 Taux de présence hebdomadaire</h2>
                  <MiniBarChart data={MOCK.presenceData} color="#1e3a8a"/>
                </div>
                {/* Apprenants résumé */}
                <div style={T.sectionCard}>
                  <h2 style={T.sH2}>👥 Aperçu des apprenants</h2>
                  <DataTable
                    columns={["Apprenant","Classe","Progression","Présence","Score","Statut"]}
                    rows={MOCK.apprenants.map(a=>[
                      a.nom,
                      <Badge label={a.classe} color="#1e3a8a"/>,
                      <div style={{display:"flex",alignItems:"center",gap:8,minWidth:120}}>
                        <div style={{flex:1,height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{width:`${a.progression}%`,height:"100%",background:"#dc2626",borderRadius:3}}/></div>
                        <span style={{fontSize:".76rem",fontWeight:800,color:"#dc2626"}}>{a.progression}%</span>
                      </div>,
                      <span style={{fontWeight:700,color:a.presence>=85?"#059669":"#f59e0b"}}>{a.presence}%</span>,
                      a.dernierScore,
                      a.statut.includes("⚠") ? <Badge label={a.statut} color="#f59e0b"/> : <Badge label={a.statut} color="#059669"/>,
                    ])}
                  />
                </div>
              </div>
              {/* Sidebar */}
              <div>
                <div style={T.sectionCard}>
                  <h2 style={T.sH2}>⚠️ Alertes</h2>
                  <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
                    <div style={{ fontWeight:800, fontSize:".82rem", color:"#92400e" }}>Marie Kouamé</div>
                    <div style={{ fontSize:".76rem", color:"#92400e" }}>Présence 65% — en dessous du seuil minimum (70%)</div>
                  </div>
                  <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontWeight:800, fontSize:".82rem", color:"#991b1b" }}>3 notes manquantes</div>
                    <div style={{ fontSize:".76rem", color:"#991b1b" }}>À saisir avant le 15/04/25</div>
                  </div>
                </div>
                <div style={T.sectionCard}>
                  <h2 style={T.sH2}>📅 Prochains cours</h2>
                  {[{d:"Lun 14/04",h:"18h00",c:"TOEIC B1→B2"},{d:"Mer 16/04",h:"18h00",c:"TOEIC B1→B2"},{d:"Sam 19/04",h:"09h00",c:"Test blanc"}].map((c,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"8px 0", borderBottom:i<2?"1px solid #f1f5f9":"none" }}>
                      <div style={{ background:"#eff6ff", borderRadius:8, padding:"4px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:".66rem", fontWeight:800, color:"#1e3a8a" }}>{c.d}</div>
                        <div style={{ fontSize:".7rem", color:"#64748b" }}>{c.h}</div>
                      </div>
                      <span style={{ fontSize:".84rem", fontWeight:600 }}>{c.c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab==="apprenants" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>👥 Tous mes apprenants</h2>
              <DataTable
                columns={["Apprenant","Classe","Progression","Présence","Dernier score","Statut"]}
                rows={MOCK.apprenants.map(a=>[
                  <strong>{a.nom}</strong>,
                  <Badge label={a.classe} color="#1e3a8a"/>,
                  <ProgressBar value={a.progression} color="#dc2626"/>,
                  <span style={{fontWeight:700,color:a.presence>=85?"#059669":"#f59e0b"}}>{a.presence}%</span>,
                  a.dernierScore,
                  a.statut.includes("⚠") ? <Badge label={a.statut} color="#f59e0b"/> : <Badge label={a.statut} color="#059669"/>,
                ])}
              />
            </div>
          </div>
        )}

        {activeTab==="presence" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>✅ Feuilles de présence</h2>
              <DataTable
                columns={["Date & Heure","Classe","Présents","Absents","Taux"]}
                rows={MOCK.presenceSheet.map(p=>[p.date,p.classe,<span style={{color:"#059669",fontWeight:800}}>{p.presents}</span>,<span style={{color:"#dc2626",fontWeight:800}}>{p.absents}</span>,<Badge label={p.taux} color="#059669"/>])}
              />
            </div>
          </div>
        )}

        {activeTab==="notes" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📝 Notes récentes saisies</h2>
              <DataTable
                columns={["Apprenant","Évaluation","Note","Niveau CECRL","Date"]}
                rows={MOCK.notesRecentes.map(n=>[n.apprenant,n.evaluation,<strong style={{color:"#dc2626"}}>{n.note}</strong>,<Badge label={n.cecrl} color="#1e3a8a"/>,n.date])}
              />
            </div>
          </div>
        )}

        {activeTab==="materiels" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📁 Matériel partagé avec mes classes</h2>
              {MOCK.materiels.map((m,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, marginBottom:10 }}>
                  <span style={{ fontSize:"1.4rem" }}>{m.type.split(" ")[0]}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:".88rem" }}>{m.nom}</div>
                    <div style={{ fontSize:".74rem", color:"#64748b" }}>Partagé avec : {m.partageAvec} · {m.date} · {m.telechargements} téléchargements</div>
                  </div>
                  <Badge label={`${m.telechargements} DL`} color="#1e3a8a"/>
                </div>
              ))}
              <button style={{ width:"100%", padding:"10px", background:"transparent", border:"1.5px dashed #1e3a8a", color:"#1e3a8a", borderRadius:10, fontFamily:FF, fontWeight:700, fontSize:".86rem", cursor:"pointer", marginTop:6 }}>
                + Ajouter du matériel
              </button>
            </div>
          </div>
        )}
      </div>

      {schedModal && <ScheduleModal onClose={()=>setSchedModal(false)}/>}
    </div>
  );
}