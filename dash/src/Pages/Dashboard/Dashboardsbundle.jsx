// ══════════════════════════════════════════════════════════════════
// DashboardCommercial.jsx — BET · Tableau de bord Commercial
// ══════════════════════════════════════════════════════════════════
import React, { useState } from "react";
import {
  FF, FD, StatCard, FilterBar, ExportBar, ScheduleModal,
  MiniBarChart, MiniLineChart, Badge, DataTable, ProgressBar,
  exportCSV, exportPDF, tabStyles as T,
} from "../Dashboard/Dashboardshared";

const COM_TABS = [
  { id:"dashboard", l:"🏠 Tableau de bord" },
  { id:"leads",     l:"🎯 Leads" },
  { id:"devis",     l:"📋 Devis" },
  { id:"conversions",l:"✅ Conversions" },
  { id:"ca",        l:"💰 CA" },
];

const COM_MOCK = {
  user:{ name:"Éric N'Goran", role:"Conseiller Commercial Senior", avatar:"👨🏿‍💼" },
  stats:[
    { icon:"🎯", label:"Leads traités",       value:"142", sub:"Ce mois",             color:"#dc2626", trend:+12 },
    { icon:"📋", label:"Devis envoyés",        value:"68",  sub:"Taux ouverture: 91%", color:"#1e3a8a", trend:+8  },
    { icon:"✅", label:"Inscriptions converties",value:"31",sub:"Taux: 45%",          color:"#059669", trend:+5  },
    { icon:"💰", label:"CA attribué",          value:"4.8M",sub:"FCFA ce mois",       color:"#7c3aed", trend:+18 },
  ],
  leadsData:[{ l:"S1",v:28 },{ l:"S2",v:35 },{ l:"S3",v:38 },{ l:"S4",v:41 }],
  caData:[{ l:"Oct",v:2.8 },{ l:"Nov",v:3.2 },{ l:"Déc",v:2.9 },{ l:"Jan",v:3.8 },{ l:"Fév",v:4.2 },{ l:"Mar",v:4.8 }],
  leads:[
    { nom:"Awa Koné",       source:"Site web",  offre:"TOEIC",       statut:"Qualifié",   date:"14/04", score:85 },
    { nom:"DTF SARL",       source:"LinkedIn",  offre:"Formation entreprise", statut:"Devis envoyé", date:"13/04", score:92 },
    { nom:"Mamadou Diallo", source:"Référence", offre:"Anglais B2",  statut:"Relance 2",  date:"12/04", score:70 },
    { nom:"Orange CI",      source:"Téléphone", offre:"Formation entreprise", statut:"RDV planifié", date:"11/04", score:95 },
  ],
  devis:[
    { client:"DTF SARL",  offre:"Formation 20 emp.",  montant:"2 400 000 FCFA", envoyé:"10/04", statut:"En attente" },
    { client:"Orange CI", offre:"Formation 50 emp.",  montant:"5 000 000 FCFA", envoyé:"08/04", statut:"Négociation" },
    { client:"Awa Koné",  offre:"TOEIC Intensif",     montant:"390 000 FCFA",   envoyé:"05/04", statut:"Accepté ✅" },
  ],
  conversions:[
    { client:"Fatoumata D.", offre:"TOEIC B1→B2",      ca:"390 000 FCFA",  date:"12/04" },
    { client:"NSIA Assurances",offre:"Formation 8 emp.","ca":"960 000 FCFA",date:"10/04" },
    { client:"Serge Assoua",offre:"Anglais Affaires", ca:"200 000 FCFA",  date:"08/04" },
  ],
  funnel:[
    { stage:"Contacts initiaux", n:320, color:"#e2e8f0" },
    { stage:"Leads qualifiés",   n:142, color:"#bfdbfe" },
    { stage:"Devis envoyés",     n:68,  color:"#93c5fd" },
    { stage:"Négociation",       n:45,  color:"#1e3a8a" },
    { stage:"Convertis",         n:31,  color:"#dc2626" },
  ],
};

export function DashboardCommercial() {
  const [activeTab,  setActiveTab]  = useState("dashboard");
  const [period,     setPeriod]     = useState("Mois");
  const [offre,      setOffre]      = useState("");
  const [schedModal, setSchedModal] = useState(false);

  const handleExportCSV = () => exportCSV(
    ["Client","Offre","Montant","Date","Statut"],
    COM_MOCK.conversions.map(c=>[c.client,c.offre,c.ca,c.date,"Converti"]),
    "conversions_commercial"
  );

  return (
    <div style={{ fontFamily:FF, background:"#f8fafc", minHeight:"100vh", color:"#0f172a" }}>
      {/* HERO */}
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e2a0a 40%,#dc2626 100%)", padding:"32px 28px 28px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"rgba(30,58,138,.12)", bottom:-80, right:-60, pointerEvents:"none" }}/>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#dc2626,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", border:"2px solid rgba(255,255,255,.2)" }}>{COM_MOCK.user.avatar}</div>
            <div>
              <p style={{ color:"rgba(255,255,255,.55)", fontSize:".78rem", margin:"0 0 3px", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" }}>Espace Commercial</p>
              <h1 style={{ fontFamily:FD, fontWeight:800, fontSize:"1.4rem", color:"#fff", margin:0 }}>{COM_MOCK.user.name}</h1>
              <p style={{ color:"rgba(255,255,255,.55)", fontSize:".78rem", margin:"3px 0 0" }}>{COM_MOCK.user.role}</p>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {COM_MOCK.stats.map((s,i)=><StatCard key={i} {...s} idx={i}/>)}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={T.tabsBar}>
        <div style={T.tabsInner}>
          {COM_TABS.map(t=><button key={t.id} style={T.tabBtn(activeTab===t.id)} onClick={()=>setActiveTab(t.id)}>{t.l}</button>)}
        </div>
      </div>

      <div style={T.body}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14, marginBottom:8 }}>
          <FilterBar period={period} setPeriod={setPeriod} offre={offre} setOffre={setOffre} offres={["TOEIC","Anglais général","Formation entreprise"]}/>
          <ExportBar onExportCSV={handleExportCSV} onExportPDF={()=>exportPDF("Tableau de bord Commercial — BET")} onSchedule={()=>setSchedModal(true)}/>
        </div>

        {activeTab==="dashboard" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
              <div style={T.sectionCard}>
                <h2 style={T.sH2}>📈 Évolution du CA mensuel (MFCFA)</h2>
                <MiniLineChart data={COM_MOCK.caData} color="#dc2626"/>
              </div>
              <div style={T.sectionCard}>
                <h2 style={T.sH2}>🎯 Leads par semaine</h2>
                <MiniBarChart data={COM_MOCK.leadsData} color="#1e3a8a"/>
              </div>
            </div>
            {/* Funnel */}
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>🔽 Entonnoir de conversion</h2>
              {COM_MOCK.funnel.map((s,i)=>(
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:".84rem", fontWeight:700, color:"#475569" }}>{s.stage}</span>
                    <span style={{ fontFamily:FD, fontWeight:800, color:"#0f172a" }}>{s.n}</span>
                  </div>
                  <div style={{ height:12, background:"#f1f5f9", borderRadius:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(s.n/320)*100}%`, background:s.color, borderRadius:6, transition:"width 1s ease" }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab==="leads" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>🎯 Pipeline des leads</h2>
              <DataTable
                columns={["Prospect","Source","Offre","Score","Statut","Date"]}
                rows={COM_MOCK.leads.map(l=>[
                  <strong>{l.nom}</strong>, l.source, <Badge label={l.offre} color="#1e3a8a"/>,
                  <span style={{fontWeight:800,color:l.score>=90?"#059669":l.score>=75?"#f59e0b":"#dc2626"}}>{l.score}/100</span>,
                  <Badge label={l.statut} color={l.statut==="Qualifié"?"#059669":l.statut.includes("Devis")?"#1e3a8a":"#f59e0b"}/>, l.date
                ])}
              />
            </div>
          </div>
        )}

        {activeTab==="devis" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📋 Devis envoyés</h2>
              <DataTable
                columns={["Client","Offre","Montant","Date envoi","Statut"]}
                rows={COM_MOCK.devis.map(d=>[d.client,d.offre,<strong style={{color:"#dc2626"}}>{d.montant}</strong>,d.envoyé,
                  <Badge label={d.statut} color={d.statut.includes("Accepté")?"#059669":d.statut==="Négociation"?"#1e3a8a":"#f59e0b"}/>])}
              />
            </div>
          </div>
        )}

        {activeTab==="conversions" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>✅ Inscriptions converties</h2>
              <DataTable
                columns={["Client","Offre","CA","Date"]}
                rows={COM_MOCK.conversions.map(c=>[c.client,c.offre,<strong style={{color:"#059669"}}>{c.ca}</strong>,c.date])}
              />
            </div>
          </div>
        )}

        {activeTab==="ca" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>💰 Chiffre d'affaires attribué</h2>
              <MiniLineChart data={COM_MOCK.caData} color="#dc2626"/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginTop:20 }}>
                {[["4.8M FCFA","Ce mois","#dc2626"],["13.9M FCFA","Trimestre","#1e3a8a"],["45.2M FCFA","Année","#7c3aed"]].map(([v,l,c],i)=>(
                  <div key={i} style={{ background:`${c}10`, border:`1.5px solid ${c}30`, borderRadius:12, padding:"16px 14px", textAlign:"center" }}>
                    <div style={{ fontFamily:FD, fontWeight:800, fontSize:"1.5rem", color:c }}>{v}</div>
                    <div style={{ fontSize:".76rem", color:"#64748b", fontWeight:600 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {schedModal && <ScheduleModal onClose={()=>setSchedModal(false)}/>}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
// DashboardGestionnaire.jsx — BET · Tableau de bord Gestionnaire
// ══════════════════════════════════════════════════════════════════
const GEST_TABS = [
  { id:"dashboard",   l:"🏠 Tableau de bord" },
  { id:"dossiers",    l:"📂 Dossiers" },
  { id:"paiements",   l:"💳 Paiements" },
  { id:"requetes",    l:"📬 Requêtes" },
  { id:"inscriptions",l:"📝 Inscriptions" },
];

const GEST_MOCK = {
  user:{ name:"Sylvie Aka", role:"Gestionnaire Administrative", avatar:"👩🏽‍💼" },
  stats:[
    { icon:"📂", label:"Dossiers en cours",  value:"23",  sub:"5 urgents",              color:"#dc2626", trend:0  },
    { icon:"💳", label:"Paiements du jour",   value:"8",   sub:"1 245 000 FCFA",         color:"#059669", trend:+3 },
    { icon:"📬", label:"Requêtes en attente", value:"12",  sub:"3 depuis > 48h",          color:"#f59e0b", trend:-2 },
    { icon:"📝", label:"Inscriptions récentes",value:"7",  sub:"Ce matin",               color:"#1e3a8a", trend:+7 },
  ],
  dossiers:[
    { apprenant:"Kouamé Brou",    type:"Réinscription",  offre:"TOEIC",       priorité:"Normale", statut:"En cours",  date:"14/04" },
    { apprenant:"NSIA Assurances",type:"Convention B2B",  offre:"Entrep. 20p", priorité:"🔴 Urgent",statut:"À valider",  date:"13/04" },
    { apprenant:"Fatou Diallo",   type:"Prise en charge", offre:"TOEFL",      priorité:"Normale", statut:"En cours",  date:"12/04" },
    { apprenant:"Jean-Marc Yao",  type:"Remboursement",   offre:"IELTS",      priorité:"🔴 Urgent",statut:"En attente",date:"11/04" },
  ],
  paiements:[
    { heure:"08:42", client:"Awa Koné",       montant:"65 000 FCFA",   mode:"Orange Money", statut:"✅" },
    { heure:"09:15", client:"DTF SARL",        montant:"480 000 FCFA",  mode:"Virement",     statut:"✅" },
    { heure:"10:08", client:"Serge Assoua",    montant:"30 000 FCFA",   mode:"MTN MoMo",     statut:"✅" },
    { heure:"11:30", client:"Marie Kouamé",    montant:"75 000 FCFA",   mode:"Wave",         statut:"⏳ En attente" },
  ],
  requetes:[
    { id:"REQ-0412", objet:"Attestation de formation",  apprenant:"Fatoumata D.",  depuis:"2j",  priorité:"Normale" },
    { id:"REQ-0410", objet:"Report de session",          apprenant:"Kouamé Brou",  depuis:"4j",  priorité:"🔴 Urgent" },
    { id:"REQ-0408", objet:"Facture mensualité",         apprenant:"NSIA",         depuis:"1j",  priorité:"Normale" },
  ],
  inscriptions:[
    { nom:"David Yao",    offre:"TOEIC B1→B2",       tarif:"390 000 FCFA", date:"Aujourd'hui 08h30", mode:"En ligne" },
    { nom:"Aïcha Konaté", offre:"Anglais Affaires",   tarif:"200 000 FCFA", date:"Aujourd'hui 09h15", mode:"Accueil" },
    { nom:"Eric Mensah",  offre:"IELTS Academic",     tarif:"520 000 FCFA", date:"Aujourd'hui 10h00", mode:"Téléphone" },
  ],
};

export function DashboardGestionnaire() {
  const [activeTab,  setActiveTab]  = useState("dashboard");
  const [period,     setPeriod]     = useState("Mois");
  const [offre,      setOffre]      = useState("");
  const [schedModal, setSchedModal] = useState(false);

  return (
    <div style={{ fontFamily:FF, background:"#f8fafc", minHeight:"100vh", color:"#0f172a" }}>
      {/* HERO */}
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e2a4a 55%,#1e3a8a 100%)", padding:"32px 28px 28px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:260, height:260, borderRadius:"50%", background:"rgba(220,38,38,.08)", top:-80, right:80 }}/>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#dc2626,#1e3a8a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", border:"2px solid rgba(255,255,255,.2)" }}>{GEST_MOCK.user.avatar}</div>
            <div>
              <p style={{ color:"rgba(255,255,255,.55)", fontSize:".78rem", margin:"0 0 3px", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" }}>Espace Gestionnaire</p>
              <h1 style={{ fontFamily:FD, fontWeight:800, fontSize:"1.4rem", color:"#fff", margin:0 }}>{GEST_MOCK.user.name}</h1>
              <p style={{ color:"rgba(255,255,255,.55)", fontSize:".78rem", margin:"3px 0 0" }}>{GEST_MOCK.user.role}</p>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {GEST_MOCK.stats.map((s,i)=><StatCard key={i} {...s} idx={i}/>)}
          </div>
        </div>
      </div>

      <div style={T.tabsBar}>
        <div style={T.tabsInner}>
          {GEST_TABS.map(t=><button key={t.id} style={T.tabBtn(activeTab===t.id)} onClick={()=>setActiveTab(t.id)}>{t.l}</button>)}
        </div>
      </div>

      <div style={T.body}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14, marginBottom:8 }}>
          <FilterBar period={period} setPeriod={setPeriod} offre={offre} setOffre={setOffre} offres={["TOEIC","IELTS","Anglais général","Formation entreprise"]}/>
          <ExportBar onExportCSV={()=>exportCSV(["ID","Apprenant","Type","Offre","Statut"],GEST_MOCK.dossiers.map((d,i)=>[`DOS-${i+1}`,d.apprenant,d.type,d.offre,d.statut]),"dossiers")} onExportPDF={()=>exportPDF("Gestionnaire — BET")} onSchedule={()=>setSchedModal(true)}/>
        </div>

        {activeTab==="dashboard" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
              {/* Paiements du jour */}
              <div style={T.sectionCard}>
                <h2 style={T.sH2}>💳 Paiements du jour</h2>
                {GEST_MOCK.paiements.map((p,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<GEST_MOCK.paiements.length-1?"1px solid #f1f5f9":"none" }}>
                    <span style={{ fontSize:".72rem", color:"#94a3b8", fontWeight:600, width:36 }}>{p.heure}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:".84rem" }}>{p.client}</div>
                      <div style={{ fontSize:".72rem", color:"#64748b" }}>{p.mode}</div>
                    </div>
                    <strong style={{ color:"#059669", fontSize:".84rem" }}>{p.montant}</strong>
                    <span style={{ fontSize:"1rem" }}>{p.statut}</span>
                  </div>
                ))}
              </div>
              {/* Inscriptions récentes */}
              <div style={T.sectionCard}>
                <h2 style={T.sH2}>📝 Inscriptions récentes</h2>
                {GEST_MOCK.inscriptions.map((ins,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<GEST_MOCK.inscriptions.length-1?"1px solid #f1f5f9":"none" }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#dc2626,#1e3a8a)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:".72rem" }}>{ins.nom[0]}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:".84rem" }}>{ins.nom}</div>
                      <div style={{ fontSize:".72rem", color:"#64748b" }}>{ins.offre} · {ins.date}</div>
                    </div>
                    <strong style={{ color:"#dc2626", fontSize:".82rem" }}>{ins.tarif}</strong>
                  </div>
                ))}
              </div>
            </div>
            {/* Requêtes urgentes */}
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📬 Requêtes en attente</h2>
              <DataTable
                columns={["Réf.","Objet","Apprenant","Depuis","Priorité"]}
                rows={GEST_MOCK.requetes.map(r=>[r.id,r.objet,r.apprenant,<span style={{color:r.depuis.includes("4")?"#dc2626":"#64748b",fontWeight:700}}>{r.depuis}</span>,<Badge label={r.priorité} color={r.priorité.includes("Urgent")?"#dc2626":"#64748b"}/>])}
              />
            </div>
          </div>
        )}

        {activeTab==="dossiers" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📂 Dossiers en cours</h2>
              <DataTable
                columns={["Apprenant","Type","Offre","Priorité","Statut","Date"]}
                rows={GEST_MOCK.dossiers.map(d=>[
                  <strong>{d.apprenant}</strong>,d.type,
                  <Badge label={d.offre} color="#1e3a8a"/>,
                  <Badge label={d.priorité} color={d.priorité.includes("Urgent")?"#dc2626":"#64748b"}/>,
                  <Badge label={d.statut} color={d.statut==="À valider"?"#f59e0b":"#1e3a8a"}/>, d.date
                ])}
              />
            </div>
          </div>
        )}

        {activeTab==="paiements" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>💳 Paiements du jour</h2>
              <DataTable
                columns={["Heure","Client","Montant","Mode","Statut"]}
                rows={GEST_MOCK.paiements.map(p=>[p.heure,p.client,<strong style={{color:"#059669"}}>{p.montant}</strong>,p.mode,p.statut])}
              />
            </div>
          </div>
        )}

        {activeTab==="requetes" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📬 Toutes les requêtes</h2>
              <DataTable
                columns={["Réf.","Objet","Apprenant","Depuis","Priorité"]}
                rows={GEST_MOCK.requetes.map(r=>[r.id,r.objet,r.apprenant,r.depuis,<Badge label={r.priorité} color={r.priorité.includes("Urgent")?"#dc2626":"#64748b"}/>])}
              />
            </div>
          </div>
        )}

        {activeTab==="inscriptions" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📝 Inscriptions récentes</h2>
              <DataTable
                columns={["Apprenant","Offre","Tarif","Date","Canal"]}
                rows={GEST_MOCK.inscriptions.map(i=>[<strong>{i.nom}</strong>,i.offre,<strong style={{color:"#dc2626"}}>{i.tarif}</strong>,i.date,<Badge label={i.mode} color="#1e3a8a"/>])}
              />
            </div>
          </div>
        )}
      </div>
      {schedModal && <ScheduleModal onClose={()=>setSchedModal(false)}/>}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
// DashboardRH.jsx — BET · Tableau de bord RH Entreprise
// ══════════════════════════════════════════════════════════════════
const RH_TABS = [
  { id:"dashboard",   l:"🏠 Tableau de bord" },
  { id:"effectifs",   l:"👥 Effectifs" },
  { id:"progression", l:"📈 Progression" },
  { id:"resultats",   l:"📊 Résultats" },
  { id:"rapports",    l:"📋 Rapports" },
];

const RH_MOCK = {
  user:{ name:"DRH — NSIA Assurances", role:"Responsable Formation", avatar:"🏢" },
  company:"NSIA Assurances",
  stats:[
    { icon:"👥", label:"Effectifs inscrits",    value:"28",  sub:"Sur 35 collaborateurs", color:"#dc2626", trend:+3  },
    { icon:"📈", label:"Progression collective", value:"71%", sub:"Objectif: 75%",         color:"#1e3a8a", trend:+4  },
    { icon:"🏆", label:"Score moyen TOEIC",      value:"762", sub:"/990 · Objectif: 780",  color:"#059669", trend:+18 },
    { icon:"📋", label:"Certifications obtenues",value:"12",  sub:"Sur 28 inscrits",       color:"#7c3aed" },
  ],
  progressData:[
    { l:"Oct", v:52 }, { l:"Nov", v:58 }, { l:"Déc", v:61 },
    { l:"Jan", v:65 }, { l:"Fév", v:68 }, { l:"Mar", v:71 },
  ],
  employes:[
    { nom:"Awa Koné",       poste:"Resp. Marketing",  offre:"TOEIC",    progression:88, score:"880/990", cecrl:"C1", statut:"✅ Certifié" },
    { nom:"Kouamé Brou",    poste:"Ingénieur IT",      offre:"TOEIC",    progression:74, score:"760/990", cecrl:"B2", statut:"En cours" },
    { nom:"Mariam Diallo",  poste:"Comptable",         offre:"Ang. Aff.",progression:65, score:"—",       cecrl:"B1", statut:"En cours" },
    { nom:"Jean-Pierre A.", poste:"Chef de projet",    offre:"TOEIC",    progression:82, score:"820/990", cecrl:"C1", statut:"✅ Certifié" },
    { nom:"Fatou Ouattara", poste:"RH",                offre:"TOEIC",    progression:58, score:"—",       cecrl:"B1", statut:"⚠ Retard" },
  ],
  parOffre:[
    { offre:"TOEIC",              inscrits:18, progression:74, certifies:9 },
    { offre:"Anglais des Affaires",inscrits:8, progression:68, certifies:3 },
    { offre:"Conversation Pro",    inscrits:2, progression:71, certifies:0 },
  ],
};

export function DashboardRH() {
  const [activeTab,  setActiveTab]  = useState("dashboard");
  const [period,     setPeriod]     = useState("Mois");
  const [offre,      setOffre]      = useState("");
  const [schedModal, setSchedModal] = useState(false);

  const handleExportCSV = () => exportCSV(
    ["Employé","Poste","Formation","Progression","Score","Niveau","Statut"],
    RH_MOCK.employes.map(e=>[e.nom,e.poste,e.offre,`${e.progression}%`,e.score,e.cecrl,e.statut]),
    "rapport_rh_formation"
  );

  return (
    <div style={{ fontFamily:FF, background:"#f8fafc", minHeight:"100vh", color:"#0f172a" }}>
      {/* HERO */}
      <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e2a4a 55%,#1e3a8a 100%)", padding:"32px 28px 28px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:280, height:280, borderRadius:"50%", background:"rgba(220,38,38,.07)", top:-80, right:-40 }}/>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20, marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:52, height:52, borderRadius:12, background:"linear-gradient(135deg,#dc2626,#1e3a8a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", border:"2px solid rgba(255,255,255,.2)" }}>{RH_MOCK.user.avatar}</div>
              <div>
                <p style={{ color:"rgba(255,255,255,.55)", fontSize:".78rem", margin:"0 0 3px", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" }}>Espace RH Entreprise</p>
                <h1 style={{ fontFamily:FD, fontWeight:800, fontSize:"1.4rem", color:"#fff", margin:0 }}>{RH_MOCK.company}</h1>
                <p style={{ color:"rgba(255,255,255,.55)", fontSize:".78rem", margin:"3px 0 0" }}>{RH_MOCK.user.role}</p>
              </div>
            </div>
            <div style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:"12px 20px", textAlign:"center" }}>
              <div style={{ fontFamily:FD, fontWeight:800, fontSize:"1.3rem", color:"#fca5a5" }}>71%</div>
              <div style={{ fontSize:".7rem", color:"rgba(255,255,255,.5)", fontWeight:600 }}>PROGRESSION COLLECTIVE</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {RH_MOCK.stats.map((s,i)=><StatCard key={i} {...s} idx={i}/>)}
          </div>
        </div>
      </div>

      <div style={T.tabsBar}>
        <div style={T.tabsInner}>
          {RH_TABS.map(t=><button key={t.id} style={T.tabBtn(activeTab===t.id)} onClick={()=>setActiveTab(t.id)}>{t.l}</button>)}
        </div>
      </div>

      <div style={T.body}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14, marginBottom:8 }}>
          <FilterBar period={period} setPeriod={setPeriod} offre={offre} setOffre={setOffre} offres={["TOEIC","Anglais des Affaires","Conversation Pro"]}/>
          <ExportBar onExportCSV={handleExportCSV} onExportPDF={()=>exportPDF(`Rapport formation — ${RH_MOCK.company}`)} onSchedule={()=>setSchedModal(true)}/>
        </div>

        {activeTab==="dashboard" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
              <div>
                {/* Evolution collective */}
                <div style={T.sectionCard}>
                  <h2 style={T.sH2}>📈 Évolution de la progression collective</h2>
                  <MiniLineChart data={RH_MOCK.progressData} color="#dc2626"/>
                </div>
                {/* Par offre */}
                <div style={T.sectionCard}>
                  <h2 style={T.sH2}>📊 Répartition par formation</h2>
                  {RH_MOCK.parOffre.map((o,i)=>(
                    <div key={i} style={{ marginBottom:18 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <Badge label={o.offre} color="#1e3a8a"/>
                          <span style={{ fontSize:".76rem", color:"#64748b" }}>{o.inscrits} inscrits · {o.certifies} certifiés</span>
                        </div>
                        <span style={{ fontWeight:800, fontSize:".84rem", color:"#dc2626" }}>{o.progression}%</span>
                      </div>
                      <ProgressBar value={o.progression} color="#dc2626"/>
                    </div>
                  ))}
                </div>
              </div>
              {/* Sidebar alertes */}
              <div>
                <div style={T.sectionCard}>
                  <h2 style={T.sH2}>⚠️ Points d'attention</h2>
                  <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
                    <div style={{ fontWeight:800, fontSize:".82rem", color:"#92400e" }}>Fatou Ouattara</div>
                    <div style={{ fontSize:".76rem", color:"#92400e" }}>Progression 58% — En retard sur l'objectif</div>
                  </div>
                  <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontWeight:800, fontSize:".82rem", color:"#166534" }}>+18 pts score moyen</div>
                    <div style={{ fontSize:".76rem", color:"#166534" }}>Amélioration significative ce trimestre</div>
                  </div>
                </div>
                <div style={T.sectionCard}>
                  <h2 style={T.sH2}>🏆 Top performers</h2>
                  {RH_MOCK.employes.filter(e=>e.statut.includes("Certifié")).map((e,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${i===0?"#dc2626":"#1e3a8a"},#0f172a)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:".72rem" }}>{e.nom[0]}</div>
                      <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:".82rem" }}>{e.nom}</div><div style={{ fontSize:".72rem", color:"#64748b" }}>{e.poste}</div></div>
                      <strong style={{ color:"#059669", fontSize:".82rem" }}>{e.score}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab==="effectifs" || activeTab==="progression" || activeTab==="resultats") && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>👥 {activeTab==="effectifs"?"Effectifs inscrits":activeTab==="progression"?"Progression individuelle":"Résultats par employé"}</h2>
              <DataTable
                columns={["Employé","Poste","Formation","Progression","Score","Niveau","Statut"]}
                rows={RH_MOCK.employes.map(e=>[
                  <strong>{e.nom}</strong>, e.poste,
                  <Badge label={e.offre} color="#1e3a8a"/>,
                  <div style={{display:"flex",alignItems:"center",gap:8,minWidth:120}}>
                    <div style={{flex:1,height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{width:`${e.progression}%`,height:"100%",background:"#dc2626",borderRadius:3}}/></div>
                    <span style={{fontSize:".76rem",fontWeight:800,color:"#dc2626"}}>{e.progression}%</span>
                  </div>,
                  e.score,
                  <Badge label={e.cecrl} color="#1e3a8a"/>,
                  <Badge label={e.statut} color={e.statut.includes("Certifié")?"#059669":e.statut.includes("Retard")?"#f59e0b":"#1e3a8a"}/>,
                ])}
              />
            </div>
          </div>
        )}

        {activeTab==="rapports" && (
          <div style={{ animation:"dbFU .4s ease" }}>
            <div style={T.sectionCard}>
              <h2 style={T.sH2}>📋 Rapports disponibles</h2>
              {[
                { titre:"Rapport de progression — Avril 2025", date:"01/04/25", type:"PDF" },
                { titre:"Synthèse TOEIC — Trimestre 1 2025",   date:"01/01/25", type:"PDF" },
                { titre:"Tableau de bord formation annuel 2024",date:"01/01/25", type:"Excel" },
              ].map((r,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, marginBottom:10 }}>
                  <span style={{ fontSize:"1.4rem" }}>{r.type==="PDF"?"📄":"📊"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:".88rem" }}>{r.titre}</div>
                    <div style={{ fontSize:".74rem", color:"#64748b" }}>Généré le {r.date}</div>
                  </div>
                  <button style={{ padding:"6px 16px", background:r.type==="PDF"?"#dc2626":"#059669", color:"#fff", border:"none", borderRadius:999, fontFamily:FF, fontWeight:700, fontSize:".76rem", cursor:"pointer" }} onClick={()=>exportPDF(r.titre)}>Télécharger</button>
                </div>
              ))}
              <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"14px 16px", marginTop:16 }}>
                <p style={{ fontWeight:700, fontSize:".84rem", color:"#1e3a8a", margin:"0 0 8px" }}>📅 Rapport automatique planifié</p>
                <p style={{ fontSize:".78rem", color:"#475569", margin:0 }}>Rapport mensuel envoyé le 1er de chaque mois à votre adresse DRH. <button style={{ background:"none", border:"none", color:"#dc2626", fontWeight:700, cursor:"pointer", fontSize:".78rem", fontFamily:FF }} onClick={()=>setSchedModal(true)}>Modifier →</button></p>
              </div>
            </div>
          </div>
        )}
      </div>
      {schedModal && <ScheduleModal onClose={()=>setSchedModal(false)}/>}
    </div>
  );
}