// src/Pages/Parcours/EntrepriseParcoursModal.jsx
import React, { useState, useMemo, useEffect } from "react";
import { insertSimulateurFormation } from "../../services/formsService";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

const BET_BLUE = "#1B3080";
const BET_RED  = "#E8273A";

// ── Catalogue (identique SimulateurFormationModal) ─────────
const NIVEAUX_CECRL = [
  { id:"A1", label:"A1 — Débutant",         color:"#6b7280", bg:"#f3f4f6" },
  { id:"A2", label:"A2 — Élémentaire",       color:"#d97706", bg:"#fef3c7" },
  { id:"B1", label:"B1 — Intermédiaire",     color:"#2563eb", bg:"#dbeafe" },
  { id:"B2", label:"B2 — Interm. supérieur", color:"#7c3aed", bg:"#ede9fe" },
  { id:"C1", label:"C1 — Avancé",            color:"#059669", bg:"#dcfce7" },
  { id:"C2", label:"C2 — Maîtrise",          color:"#dc2626", bg:"#fee2e2" },
];
const OBJECTIFS = [
  { id:"communication", label:"Communication quotidienne",  icon:"💬" },
  { id:"business",      label:"Anglais des affaires",       icon:"💼" },
  { id:"toeic",         label:"Certification TOEIC",        icon:"🏆" },
  { id:"ielts",         label:"Certification IELTS",        icon:"📜" },
  { id:"presentations", label:"Présentations & réunions",   icon:"🎤" },
  { id:"redaction",     label:"Rédaction professionnelle",  icon:"✍️" },
  { id:"negociation",   label:"Négociation commerciale",    icon:"🤝" },
  { id:"technique",     label:"Anglais technique / IT",     icon:"💻" },
];
const FORMATS = [
  { id:"presentiel", label:"Présentiel",      icon:"🏢", desc:"Dans nos locaux à Abidjan",     coefPrix:1.0  },
  { id:"distanciel", label:"À distance",      icon:"🌐", desc:"Sessions Zoom / Teams",         coefPrix:0.85 },
  { id:"hybride",    label:"Hybride",         icon:"⚡", desc:"Mix présentiel & en ligne",    coefPrix:0.92 },
  { id:"elearning",  label:"E-learning seul", icon:"💡", desc:"100% autonome, à votre rythme",coefPrix:0.60 },
];
const RYTHMES = [
  { id:"intensif", label:"Intensif",     sessions:5, desc:"5 sessions/semaine",  heures:2.5, coef:1.0  },
  { id:"regulier", label:"Régulier",     sessions:3, desc:"3 sessions/semaine",  heures:1.5, coef:0.9  },
  { id:"leger",    label:"Modéré",       sessions:2, desc:"2 sessions/semaine",  heures:1,   coef:0.85 },
  { id:"weekend",  label:"Week-end only",sessions:2, desc:"Sam + Dim uniquement",heures:3,   coef:0.88 },
];
const GROUPES = [
  { id:"individuel", label:"Individuel",    max:1,  coefPrix:2.2,  desc:"Cours 100% personnalisé" },
  { id:"duo",        label:"Duo",           max:2,  coefPrix:1.5,  desc:"2 participants" },
  { id:"petit",      label:"Petit groupe",  max:6,  coefPrix:1.0,  desc:"3 à 6 participants" },
  { id:"groupe",     label:"Groupe",        max:15, coefPrix:0.75, desc:"7 à 15 participants" },
  { id:"classe",     label:"Grande classe", max:25, coefPrix:0.55, desc:"16 à 25 participants" },
];
const CERTIFICATIONS = [
  { id:"toeic",     label:"TOEIC",         prix:85000,  icon:"🏆" },
  { id:"ielts",     label:"IELTS",         prix:120000, icon:"📜" },
  { id:"toefl",     label:"TOEFL",         prix:140000, icon:"🎓" },
  { id:"cambridge", label:"Cambridge FCE", prix:110000, icon:"🏅" },
];
const PRIX_BASE_HEURE = 12000;
const fmt     = (n) => Math.round(n).toLocaleString("fr-FR");
const fmtPrix = (n) => `${fmt(n)} FCFA`;

const STEPS = [
  { id:1, label:"Votre entreprise",   icon:"🏢" },
  { id:2, label:"Niveau & objectifs", icon:"🎯" },
  { id:3, label:"Format & rythme",    icon:"📅" },
  { id:4, label:"Options",            icon:"⚙️" },
  { id:5, label:"Devis estimatif",    icon:"📊" },
];

// ── Composants UI ─────────────────────────────────────────
const SelectCard = ({ item, selected, onSelect }) => (
  <div onClick={() => onSelect(item.id)} style={{ padding:"12px 14px", borderRadius:10, border:`1.5px solid ${selected?BET_BLUE:"#e5e7eb"}`, background:selected?BET_BLUE+"08":"#fff", cursor:"pointer", transition:"all .2s" }}>
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${selected?BET_BLUE:"#d1d5db"}`, background:selected?BET_BLUE:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {selected && <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }} />}
      </div>
      {item.icon && <span style={{ fontSize:16 }}>{item.icon}</span>}
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{item.label}</div>
        {item.desc && <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>{item.desc}</div>}
      </div>
    </div>
  </div>
);

const ProgressBar = ({ current }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, marginBottom:28, flexWrap:"wrap", rowGap:10 }}>
    {STEPS.map((s, i) => (
      <React.Fragment key={s.id}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, transition:"all .3s",
            background: current > s.id ? BET_BLUE : current === s.id ? BET_BLUE : "#e5e7eb",
            color: current >= s.id ? "#fff" : "#9ca3af",
            boxShadow: current === s.id ? `0 0 0 4px ${BET_BLUE}22` : "none" }}>
            {current > s.id ? "✓" : s.icon}
          </div>
          <span style={{ fontSize:9, fontWeight:current===s.id?700:400, color:current>=s.id?BET_BLUE:"#9ca3af", textAlign:"center", maxWidth:64, lineHeight:1.3 }}>{s.label}</span>
        </div>
        {i < STEPS.length-1 && <div style={{ width:32, height:2, background:current>s.id?BET_BLUE:"#e5e7eb", marginBottom:18, flexShrink:0, transition:"background .3s" }} />}
      </React.Fragment>
    ))}
  </div>
);

// ── MODAL PRINCIPAL ───────────────────────────────────────
export default function EntrepriseParcoursModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  // Infos entreprise
  const [entreprise, setEntreprise] = useState({ nom:"", secteur:"", secteurAutre:"", nbEmployes:"", nbEmployesAutre:"", emailContact:"", tel:"", nomContact:"" });

  // Simulateur
  const [niveauActuel,     setNiveauActuel]     = useState("");
  const [niveauCible,      setNiveauCible]      = useState("");
  const [objectifs,        setObjectifs]        = useState([]);
  const [dureeWeeks,       setDureeWeeks]       = useState(12);
  const [nbParticipants,   setNbParticipants]   = useState(5);
  const [formatId,         setFormatId]         = useState("hybride");
  const [rythmeId,         setRythmeId]         = useState("regulier");
  const [groupeId,         setGroupeId]         = useState("petit");
  const [certifsChoisis,   setCertifsChoisis]   = useState([]);
  const [avecSupportExtra, setAvecSupportExtra] = useState(false);
  const [avecRapport,      setAvecRapport]      = useState(true);
  const [budgetMax,        setBudgetMax]        = useState("");

  // Assistante Corporate (auto-assignée)
  const [assistante,       setAssistante]       = useState(null);
  const [submitting,       setSubmitting]       = useState(false);
  const [erreur,           setErreur]           = useState("");

  // Devis calculé
  const devis = useMemo(() => {
    const format = FORMATS.find(f => f.id===formatId) || FORMATS[0];
    const rythme = RYTHMES.find(r => r.id===rythmeId) || RYTHMES[1];
    const groupe = GROUPES.find(g => g.id===groupeId) || GROUPES[2];
    const heuresSemaine = rythme.sessions * rythme.heures;
    const heuresTotal   = heuresSemaine * dureeWeeks;
    const nbReel        = Math.max(1, nbParticipants);
    const prixHeureBrut = PRIX_BASE_HEURE * format.coefPrix * rythme.coef * groupe.coefPrix;
    const prixFormation = heuresTotal * prixHeureBrut * nbReel;
    const prixCertifs   = certifsChoisis.reduce((s, cId) => { const c = CERTIFICATIONS.find(x => x.id===cId); return s + (c ? c.prix * nbReel : 0); }, 0);
    const prixSupport   = avecSupportExtra ? prixFormation * 0.1 : 0;
    const prixRapport   = avecRapport ? 25000 * Math.ceil(nbReel / 5) : 0;
    const sousTotal     = prixFormation + prixCertifs + prixSupport + prixRapport;
    const tva           = sousTotal * 0.18;
    const total         = sousTotal + tva;
    return { heuresTotal:Math.round(heuresTotal), nbReel, prixFormation, prixCertifs, prixSupport, prixRapport, sousTotal, tva, total, prixParPers:nbReel>0?total/nbReel:0, format, rythme, groupe };
  }, [formatId, rythmeId, groupeId, dureeWeeks, nbParticipants, certifsChoisis, avecSupportExtra, avecRapport]);

  // Reset quand modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setStep(1); setDone(false); setAssistante(null); setErreur("");
      setEntreprise({ nom:"", secteur:"", secteurAutre:"", nbEmployes:"", nbEmployesAutre:"", emailContact:"", tel:"", nomContact:"" });
      setObjectifs([]); setCertifsChoisis([]); setNiveauActuel(""); setNiveauCible("");
    }
  }, [isOpen]);

  const canNext = () => {
    if (step===1) {
      if (!entreprise.nom.trim() || !entreprise.emailContact.trim()) return false;
      if (entreprise.secteur==="Autre" && !entreprise.secteurAutre.trim()) return false;
      if (entreprise.nbEmployes==="Autre" && !entreprise.nbEmployesAutre.trim()) return false;
      return true;
    }
    if (step===2) return niveauActuel && niveauCible && objectifs.length > 0;
    if (step===3) return formatId && rythmeId && groupeId;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true); setErreur("");
    try {
      // 1. Sauvegarder le simulateur
      await insertSimulateurFormation({
        nom_entreprise:  entreprise.nom,
        secteur:         entreprise.secteur==="Autre" ? entreprise.secteurAutre : entreprise.secteur || null,
        nb_employes:     entreprise.nbEmployes==="Autre" ? entreprise.nbEmployesAutre : entreprise.nbEmployes || null,
        email_contact:   entreprise.emailContact,
        tel:             entreprise.tel || null,
        niveau_actuel:   niveauActuel || null,
        niveau_cible:    niveauCible  || null,
        objectifs,
        format:          formatId || null,
        rythme:          rythmeId || null,
        groupe:          groupeId || null,
        nb_participants: nbParticipants,
        duree_semaines:  dureeWeeks,
        certifications:  certifsChoisis,
        avec_support:    avecSupportExtra,
        avec_rapport:    avecRapport,
        budget_max:      budgetMax ? Number(budgetMax) : null,
        email_devis:     entreprise.emailContact,
        montant_estime:  Math.round(devis.total),
      });

      // 2. Récupérer l'assistante corporate dédiée (profil=b2b)
      let corpAssistante = null;
      try {
        const r = await fetch(`${API}/api/parcours/assistantes-ligne?profil=b2b`);
        const d = await r.json();
        corpAssistante = (d.assistantes || [])[0] || null;
      } catch { /* on continue même sans assistante */ }

      // 3. Créer l'assignation avec l'assistante Corporate
      if (corpAssistante) {
        await fetch(`${API}/api/parcours/assignation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assistante_id:       corpAssistante.id,
            prospect_nom:        entreprise.nomContact.trim() || entreprise.nom.trim(),
            prospect_email:      entreprise.emailContact.trim(),
            prospect_telephone:  entreprise.tel.trim() || null,
            type_cours:          formatId === "presentiel" ? "presentiel" : "en_ligne",
            type_coaching:       groupeId === "individuel" ? "prive" : "groupe",
          }),
        });
        setAssistante(corpAssistante);
      }

      setDone(true);
    } catch (e) {
      console.error(e);
      setErreur("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.65)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflowY:"auto" }}>
      <div style={{ background:"#f8fafc", borderRadius:18, width:"100%", maxWidth:760, maxHeight:"94vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.28)" }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${BET_BLUE},#0d1a4a)`, padding:"22px 28px", borderRadius:"18px 18px 0 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", fontWeight:600, letterSpacing:"0.08em" }}>ESPACE ENTREPRISE</div>
            <h2 style={{ margin:"4px 0 0", fontSize:18, fontWeight:800, color:"#fff" }}>🏢 Votre programme de formation</h2>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ padding:"28px 28px 24px" }}>

          {!done && <ProgressBar current={step} />}

          {/* ── ÉTAPE 1 : Votre entreprise ── */}
          {step===1 && (
            <div>
              <h3 style={titleSt}>🏢 Votre entreprise</h3>
              <p style={subSt}>Ces informations nous permettent de personnaliser votre programme et de vous recontacter.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelSt}>Nom de l'entreprise *</label>
                  <input style={inputSt} placeholder="Orange Côte d'Ivoire" value={entreprise.nom} onChange={e=>setEntreprise(p=>({...p,nom:e.target.value}))} />
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelSt}>Nom du contact *</label>
                  <input style={inputSt} placeholder="Jean Kouamé — DRH" value={entreprise.nomContact} onChange={e=>setEntreprise(p=>({...p,nomContact:e.target.value}))} />
                </div>
                <div>
                  <label style={labelSt}>Email professionnel *</label>
                  <input style={inputSt} type="email" placeholder="drh@entreprise.ci" value={entreprise.emailContact} onChange={e=>setEntreprise(p=>({...p,emailContact:e.target.value}))} />
                </div>
                <div>
                  <label style={labelSt}>Téléphone</label>
                  <input style={inputSt} type="tel" placeholder="+225 07 00 00 00 00" value={entreprise.tel} onChange={e=>setEntreprise(p=>({...p,tel:e.target.value}))} />
                </div>
                <div>
                  <label style={labelSt}>Secteur d'activité</label>
                  <select style={inputSt} value={entreprise.secteur} onChange={e=>setEntreprise(p=>({...p,secteur:e.target.value,secteurAutre:""}))}>
                    <option value="">Sélectionner…</option>
                    {["Télécommunications","Finance & Banque","Industrie","Commerce","Santé","Education","Technologie","Logistique","Tourisme","Autre"].map(s=><option key={s}>{s}</option>)}
                  </select>
                  {entreprise.secteur==="Autre" && <input style={{...inputSt,marginTop:8}} placeholder="Précisez votre secteur" value={entreprise.secteurAutre} onChange={e=>setEntreprise(p=>({...p,secteurAutre:e.target.value}))} />}
                </div>
                <div>
                  <label style={labelSt}>Nombre d'employés</label>
                  <select style={inputSt} value={entreprise.nbEmployes} onChange={e=>setEntreprise(p=>({...p,nbEmployes:e.target.value,nbEmployesAutre:""}))}>
                    <option value="">Sélectionner…</option>
                    {["1–10","11–50","51–200","201–500","500+","Autre"].map(s=><option key={s}>{s}</option>)}
                  </select>
                  {entreprise.nbEmployes==="Autre" && <input style={{...inputSt,marginTop:8}} placeholder="Précisez" value={entreprise.nbEmployesAutre} onChange={e=>setEntreprise(p=>({...p,nbEmployesAutre:e.target.value}))} />}
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Niveau & objectifs ── */}
          {step===2 && (
            <div>
              <h3 style={titleSt}>🎯 Niveau & objectifs</h3>
              <p style={subSt}>Définissez le point de départ et la destination de vos équipes.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                <div>
                  <label style={{...labelSt,marginBottom:10}}>Niveau actuel des équipes *</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {NIVEAUX_CECRL.map(n=>(
                      <div key={n.id} onClick={()=>setNiveauActuel(n.id)} style={{ padding:"9px 12px", borderRadius:8, border:`1.5px solid ${niveauActuel===n.id?n.color:"#e5e7eb"}`, background:niveauActuel===n.id?n.bg:"#fff", cursor:"pointer", display:"flex", gap:8, alignItems:"center" }}>
                        <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${niveauActuel===n.id?n.color:"#d1d5db"}`, background:niveauActuel===n.id?n.color:"transparent", flexShrink:0 }} />
                        <span style={{ fontSize:12, fontWeight:niveauActuel===n.id?700:400, color:niveauActuel===n.id?n.color:"#374151" }}>{n.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{...labelSt,marginBottom:10}}>Niveau cible visé *</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {NIVEAUX_CECRL.map(n=>(
                      <div key={n.id} onClick={()=>setNiveauCible(n.id)} style={{ padding:"9px 12px", borderRadius:8, border:`1.5px solid ${niveauCible===n.id?n.color:"#e5e7eb"}`, background:niveauCible===n.id?n.bg:"#fff", cursor:"pointer", display:"flex", gap:8, alignItems:"center", opacity:niveauActuel&&n.id<=niveauActuel?0.3:1 }}>
                        <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${niveauCible===n.id?n.color:"#d1d5db"}`, background:niveauCible===n.id?n.color:"transparent", flexShrink:0 }} />
                        <span style={{ fontSize:12, fontWeight:niveauCible===n.id?700:400, color:niveauCible===n.id?n.color:"#374151" }}>{n.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <label style={{...labelSt,marginBottom:10}}>Objectifs de formation * <span style={{fontSize:10,color:"#9ca3af"}}>(plusieurs choix)</span></label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:8 }}>
                {OBJECTIFS.map(o=>(
                  <div key={o.id} onClick={()=>setObjectifs(p=>p.includes(o.id)?p.filter(x=>x!==o.id):[...p,o.id])} style={{ padding:"9px 12px", borderRadius:8, border:`1.5px solid ${objectifs.includes(o.id)?BET_BLUE:"#e5e7eb"}`, background:objectifs.includes(o.id)?"#eef2ff":"#fff", cursor:"pointer", display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{fontSize:15}}>{o.icon}</span>
                    <span style={{ fontSize:12, fontWeight:objectifs.includes(o.id)?700:400, color:objectifs.includes(o.id)?BET_BLUE:"#374151" }}>{o.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Format & rythme ── */}
          {step===3 && (
            <div>
              <h3 style={titleSt}>📅 Format, rythme & groupe</h3>
              <p style={subSt}>Ces choix influencent le coût et l'efficacité de la formation.</p>
              <div style={{marginBottom:20}}>
                <label style={{...labelSt,marginBottom:10}}>Format des cours *</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:8 }}>
                  {FORMATS.map(f=><SelectCard key={f.id} item={f} selected={formatId===f.id} onSelect={setFormatId} />)}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{...labelSt,marginBottom:10}}>Rythme d'apprentissage *</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:8 }}>
                  {RYTHMES.map(r=><SelectCard key={r.id} item={r} selected={rythmeId===r.id} onSelect={setRythmeId} />)}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{...labelSt,marginBottom:10}}>Type de groupe *</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:8 }}>
                  {GROUPES.map(g=><SelectCard key={g.id} item={g} selected={groupeId===g.id} onSelect={setGroupeId} />)}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div>
                  <label style={labelSt}>Participants : <strong style={{color:BET_BLUE}}>{nbParticipants}</strong></label>
                  <input type="range" min={1} max={50} step={1} value={nbParticipants} onChange={e=>setNbParticipants(Number(e.target.value))} style={{width:"100%",marginTop:8}} />
                </div>
                <div>
                  <label style={labelSt}>Durée : <strong style={{color:BET_BLUE}}>{dureeWeeks} semaines</strong></label>
                  <input type="range" min={4} max={52} step={2} value={dureeWeeks} onChange={e=>setDureeWeeks(Number(e.target.value))} style={{width:"100%",marginTop:8}} />
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 : Options ── */}
          {step===4 && (
            <div>
              <h3 style={titleSt}>⚙️ Options complémentaires</h3>
              <p style={subSt}>Enrichissez votre programme avec certifications et services additionnels.</p>
              <label style={{...labelSt,marginBottom:12}}>Certifications officielles <span style={{fontSize:10,color:"#9ca3af"}}>(prix par participant)</span></label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:10, marginBottom:24 }}>
                {CERTIFICATIONS.map(c=>(
                  <div key={c.id} onClick={()=>setCertifsChoisis(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} style={{ padding:"13px 14px", borderRadius:10, border:`1.5px solid ${certifsChoisis.includes(c.id)?BET_BLUE:"#e5e7eb"}`, background:certifsChoisis.includes(c.id)?"#eef2ff":"#fff", cursor:"pointer" }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
                      <span style={{fontSize:18}}>{c.icon}</span>
                      <span style={{ fontWeight:700, fontSize:13 }}>{c.label}</span>
                      {certifsChoisis.includes(c.id) && <span style={{ marginLeft:"auto", color:BET_BLUE }}>✓</span>}
                    </div>
                    <div style={{ fontSize:11, color:certifsChoisis.includes(c.id)?BET_BLUE:"#9ca3af", fontWeight:certifsChoisis.includes(c.id)?700:400 }}>{fmtPrix(c.prix)} / pers.</div>
                  </div>
                ))}
              </div>
              <label style={labelSt}>Services additionnels</label>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
                {[
                  { val:avecSupportExtra, set:setAvecSupportExtra, label:"Support pédagogique renforcé", desc:"+10% — Accès tuteur dédié entre les sessions" },
                  { val:avecRapport,      set:setAvecRapport,      label:"Rapport de progression mensuel", desc:"25 000 FCFA / 5 participants — Bilan mensuel DRH" },
                ].map((opt,i)=>(
                  <div key={i} onClick={()=>opt.set(v=>!v)} style={{ padding:"12px 14px", borderRadius:10, border:`1.5px solid ${opt.val?BET_BLUE:"#e5e7eb"}`, background:opt.val?"#eef2ff":"#fff", cursor:"pointer", display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${opt.val?BET_BLUE:"#d1d5db"}`, background:opt.val?BET_BLUE:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                      {opt.val && <span style={{ color:"#fff", fontSize:11 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{opt.label}</div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <label style={labelSt}>Budget maximum envisagé <span style={{fontSize:10,color:"#9ca3af"}}>(optionnel)</span></label>
              <input style={inputSt} type="number" placeholder="Ex: 5 000 000 FCFA" value={budgetMax} onChange={e=>setBudgetMax(e.target.value)} />
              {budgetMax && Number(budgetMax) < devis.total && (
                <div style={{ padding:"10px 12px", borderRadius:8, background:"#fef3c7", border:"1px solid #fcd34d", fontSize:12, color:"#92400e", marginTop:8 }}>
                  ⚠️ Budget de {fmtPrix(Number(budgetMax))} — estimation actuelle : {fmtPrix(devis.total)}. Nos conseillers adapteront le programme.
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 5 : Devis estimatif ── */}
          {step===5 && (
            <div>
              <h3 style={titleSt}>📊 Votre estimation budgétaire</h3>
              <p style={subSt}>Estimation indicative — un devis définitif sera établi par votre assistante Corporate.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
                <div style={{ background:`linear-gradient(135deg,${BET_BLUE},#0d1a4a)`, borderRadius:14, padding:"18px 20px", color:"#fff", gridColumn:"1/-1" }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:6, letterSpacing:"0.08em" }}>ESTIMATION TOTALE TTC</div>
                  <div style={{ fontSize:34, fontWeight:900 }}>{fmtPrix(devis.total)}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:4 }}>{devis.nbReel} participant(s) · {devis.heuresTotal}h · {dureeWeeks} semaines</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginTop:6 }}>soit {fmtPrix(devis.prixParPers)} / personne</div>
                </div>
              </div>
              <div style={{ border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                {[
                  { l:`Formation (${devis.heuresTotal}h × ${devis.nbReel} participants)`, v:devis.prixFormation, show:true },
                  { l:`Certifications`,                                                   v:devis.prixCertifs,   show:devis.prixCertifs>0 },
                  { l:"Support pédagogique renforcé (+10%)",                              v:devis.prixSupport,   show:devis.prixSupport>0 },
                  { l:"Rapports de progression",                                          v:devis.prixRapport,   show:devis.prixRapport>0 },
                  { l:"Sous-total HT",                                                    v:devis.sousTotal,     show:true },
                  { l:"TVA 18%",                                                          v:devis.tva,           show:true },
                ].filter(r=>r.show).map((r,i,arr)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderBottom:i<arr.length-1?"1px solid #f1f5f9":"none", fontSize:13 }}>
                    <span style={{ color:"#374151" }}>{r.l}</span>
                    <strong style={{ color:"#0f172a" }}>{fmtPrix(r.v)}</strong>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 14px", background:`${BET_BLUE}06`, fontSize:15, fontWeight:800 }}>
                  <span style={{ color:"#0f172a" }}>TOTAL TTC</span>
                  <span style={{ color:BET_BLUE, fontSize:18 }}>{fmtPrix(devis.total)}</span>
                </div>
              </div>
              <div style={{ padding:"10px 14px", borderRadius:8, background:"#dcfce7", border:"1px solid #bbf7d0", fontSize:13, color:"#166534" }}>
                💡 Une assistante Corporate BET vous contactera sous 24h pour affiner ce devis et planifier votre programme.
              </div>
            </div>
          )}

          {/* ── CONFIRMATION ── */}
          {done && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
              <h2 style={{ fontSize:22, fontWeight:800, color:"#0f172a", marginBottom:8 }}>Demande enregistrée !</h2>
              <p style={{ fontSize:14, color:"#6b7280", lineHeight:1.7, maxWidth:440, margin:"0 auto 20px" }}>
                {assistante
                  ? <>Votre programme a été transmis à <strong>{assistante.prenom} {assistante.nom}</strong> — votre conseillère Corporate BET. Elle vous contactera sous <strong>24h</strong> à l'adresse <strong>{entreprise.emailContact}</strong>.</>
                  : <>Votre demande a bien été enregistrée. Notre équipe Corporate vous contactera sous <strong>24h</strong> à l'adresse <strong>{entreprise.emailContact}</strong>.</>
                }
              </p>
              <div style={{ display:"inline-flex", flexDirection:"column", gap:8, background:"#f0f4ff", borderRadius:12, padding:"16px 24px", marginBottom:24, textAlign:"left" }}>
                {[
                  ["Entreprise", entreprise.nom],
                  ["Contact", entreprise.nomContact||entreprise.emailContact],
                  ["Programme", `${devis.nbReel} participant(s) · ${devis.heuresTotal}h · ${dureeWeeks} semaines`],
                  ["Estimation", fmtPrix(devis.total)],
                  ...(assistante ? [["Conseillère", `${assistante.prenom} ${assistante.nom}`]] : []),
                ].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", gap:10, fontSize:13 }}>
                    <span style={{ color:"#9ca3af", minWidth:90 }}>{l}</span>
                    <strong style={{ color:"#0f172a" }}>{v}</strong>
                  </div>
                ))}
              </div>
              <button onClick={onClose} style={{ ...btnPrimary, padding:"11px 28px" }}>Fermer ✓</button>
            </div>
          )}

          {/* ── Navigation ── */}
          {!done && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:28, paddingTop:20, borderTop:"1px solid #e5e7eb" }}>
              <button onClick={()=>setStep(s=>Math.max(1,s-1))} disabled={step===1} style={{ ...btnSecondary, opacity:step===1?0.4:1 }}>← Précédent</button>
              <span style={{ fontSize:12, color:"#9ca3af" }}>Étape {step} / {STEPS.length}</span>
              {step < 5 ? (
                <button onClick={()=>canNext()&&setStep(s=>s+1)} disabled={!canNext()} style={{ ...btnPrimary, opacity:canNext()?1:0.45 }}>
                  Suivant →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} style={{ ...btnPrimary, opacity:submitting?0.5:1 }}>
                  {submitting ? "Envoi…" : "✅ Confirmer"}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────
const titleSt    = { fontSize:20, fontWeight:800, color:"#0f172a", margin:"0 0 6px" };
const subSt      = { fontSize:13, color:"#9ca3af", marginBottom:22 };
const labelSt    = { display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:6 };
const inputSt    = { padding:"11px 13px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none", width:"100%", background:"#fff", color:"#0f172a", boxSizing:"border-box" };
const btnPrimary = { background:`linear-gradient(135deg,${BET_BLUE},#0d1a4a)`, color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:13, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 22px" };
const btnSecondary = { background:"#e5e7eb", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13, padding:"9px 16px" };
