// src/Pages/ResponsableDashboard/ResponsableDashboard.jsx
// Route : <Route path="/responsable-dashboard" element={<ResponsableDashboard />} />

import React, { useState, useMemo, useEffect } from "react";
import MessagerieTab from "../../Components/MessagerieTab";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import CloudinaryUpload, { AvatarUpload } from "../../Components/CloudinaryUpload";

const API_URL    = process.env.REACT_APP_API_URL || "http://localhost:5001";
const authHdrs   = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("admin_token")}` });

/* ═══════════════════════════════════════════════════════
   CHARTE BET
═══════════════════════════════════════════════════════ */
const C = {
  primary:   "#0891b2",
  dark:      "#0e7490",
  light:     "#e0f2fe",
  gradient:  "linear-gradient(135deg, #0f172a 0%, #0891b2 100%)",
  green:     "#22c55e",
  amber:     "#f59e0b",
  red:       "#ef4444",
  purple:    "#8b5cf6",
  slate:     "#64748b",
};

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK
═══════════════════════════════════════════════════════ */
const RESPONSABLE = { avatar:"TM", prenom:"Mamadou", nom:"Touré" };

const OFFRES = ["Anglais Pro B2","Business English","Certification TOEIC","Anglais Enfant","Formation Entreprise","Préparation IELTS"];
const NIVEAUX = ["A1","A2","B1","B2","C1","C2"];
const JOURS   = ["Lun","Mar","Mer","Jeu","Ven","Sam"];
const HEURES  = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00"];
const SALLES  = [
  { id:"A", nom:"Salle A",    capacite:15 },
  { id:"B", nom:"Salle B",    capacite:20 },
  { id:"C", nom:"Salle C",    capacite:10 },
  { id:"Z", nom:"Zoom",       capacite:30 },
  { id:"T", nom:"Teams",      capacite:30 },
];

// Coachs avec créneaux occupés (jour-heure)
const INIT_COACHS = [
  { id:1, nom:"Martin",  prenom:"Jean",   email:"jean.martin@bet.com",   tel:"+225 01 23 45 67", specialite:"Anglais des affaires", statut:"actif",  evaluationMoyenne:4.8, heuresEffectuees:120, heuresPlanifiees:150,
    occupes:["Lun-08:00","Lun-09:00","Mer-14:00","Mer-15:00","Ven-10:00"],
    classesEnCharge:["B2 Business","C1 Prep"] },
  { id:2, nom:"Dubois",  prenom:"Sophie", email:"sophie.dubois@bet.com",  tel:"+225 01 23 45 68", specialite:"TOEIC / IELTS",       statut:"actif",  evaluationMoyenne:4.9, heuresEffectuees:98,  heuresPlanifiees:120,
    occupes:["Mar-14:00","Mar-15:00","Jeu-09:00","Jeu-10:00"],
    classesEnCharge:["TOEIC Prep","B2 General"] },
  { id:3, nom:"Smith",   prenom:"John",   email:"john.smith@bet.com",     tel:"+225 01 23 45 69", specialite:"Grammaire / General",  statut:"actif",  evaluationMoyenne:4.7, heuresEffectuees:105, heuresPlanifiees:130,
    occupes:["Lun-10:00","Mer-09:00","Mer-10:00","Ven-14:00","Ven-15:00"],
    classesEnCharge:["A2 General","B1 General"] },
  { id:4, nom:"Koné",    prenom:"Fatou",  email:"fatou.kone@bet.com",     tel:"+225 01 23 45 70", specialite:"IELTS / Certification", statut:"actif",  evaluationMoyenne:4.9, heuresEffectuees:45,  heuresPlanifiees:60,
    occupes:["Sam-10:00","Sam-11:00"],
    classesEnCharge:["IELTS Prep"] },
];

// Occupation des salles (salle_id-jour-heure)
const INIT_SALLE_OCCUPEES = [
  "A-Lun-08:00","A-Lun-09:00",
  "B-Mar-14:00","B-Mar-15:00",
  "C-Sam-10:00","C-Sam-11:00",
  "A-Mer-14:00","A-Mer-15:00",
];

const INIT_CLASSES = [
  { id:1, nom:"B2 Business",  coachId:1, niveau:"B2", offre:"Business English",      effectif:12, progressionMoyenne:78, statut:"actif",  apprenants:[1,2,3], creneaux:[{jour:"Lun",heure:"08:00",salle:"A"},{jour:"Mer",heure:"14:00",salle:"A"}], remplacantId:2 },
  { id:2, nom:"TOEIC Prep",   coachId:2, niveau:"B2", offre:"Certification TOEIC",   effectif:15, progressionMoyenne:82, statut:"actif",  apprenants:[4,5,6], creneaux:[{jour:"Mar",heure:"14:00",salle:"B"}], remplacantId:null },
  { id:3, nom:"A2 General",   coachId:3, niveau:"A2", offre:"Anglais Pro B2",         effectif:10, progressionMoyenne:65, statut:"actif",  apprenants:[7,8],   creneaux:[{jour:"Mer",heure:"09:00",salle:"Z"}], remplacantId:null },
  { id:4, nom:"IELTS Prep",   coachId:4, niveau:"C1", offre:"Préparation IELTS",     effectif:8,  progressionMoyenne:85, statut:"actif",  apprenants:[9,10],  creneaux:[{jour:"Sam",heure:"10:00",salle:"C"}], remplacantId:null },
];

const INIT_PLANNING = [
  { id:1, classeId:1, titre:"B2 Business",  coachId:1, date:"2025-12-16", heure:"09:00", duree:"2h", salle:"A", type:"presentiel", inscrits:12, placesMax:15 },
  { id:2, classeId:2, titre:"TOEIC Prep",   coachId:2, date:"2025-12-17", heure:"14:00", duree:"2h", salle:"B", type:"presentiel", inscrits:15, placesMax:15 },
  { id:3, classeId:3, titre:"A2 General",   coachId:3, date:"2025-12-15", heure:"10:00", duree:"2h", salle:"Z", type:"online",     inscrits:8,  placesMax:20 },
  { id:4, classeId:4, titre:"IELTS Prep",   coachId:4, date:"2025-12-19", heure:"16:00", duree:"2h", salle:"C", type:"presentiel", inscrits:8,  placesMax:10 },
];

const INIT_EVALUATIONS = [
  { id:1, titre:"Quiz Grammaire B2",  classe:"B2 Business", date:"2025-12-20", coefficient:1, nbQuestions:20,  statut:"programme" },
  { id:2, titre:"Mock TOEIC Blanc",   classe:"TOEIC Prep",  date:"2025-12-22", coefficient:2, nbQuestions:100, statut:"programme" },
  { id:3, titre:"Examen final A2",    classe:"A2 General",  date:"2025-12-23", coefficient:3, nbQuestions:50,  statut:"programme" },
];

const INIT_MEDIATHEQUE = [
  { id:1, titre:"Guide de grammaire B2",       type:"PDF",      classe:"B2 Business", telechargements:45, icon:"📄" },
  { id:2, titre:"Webinaire TOEIC stratégies",  type:"Vidéo",    classe:"TOEIC Prep",  vues:120,           icon:"🎬" },
  { id:3, titre:"Exercices A2 interactifs",    type:"Exercice", classe:"A2 General",  tauxCompletion:78,  icon:"✏️" },
  { id:4, titre:"Podcast IELTS Speaking",      type:"Audio",    classe:"IELTS Prep",  ecoutes:34,         icon:"🎧" },
];

const INIT_DEMANDES = [
  { id:1, type:"remplacement", coachId:1, date:"2025-12-17", motif:"Maladie", statut:"en_attente", remplacant:"Sophie Dubois" },
  { id:2, type:"signalement",  coachId:3, date:"2025-12-14", motif:"Problème technique salle", statut:"traite" },
];

// ── Absences et suspensions de coachs ────────────────
const INIT_ABSENCES = [
  {
    id:1, coachId:1, type:"absence",
    motif:"Arrêt maladie", details:"Certificat médical fourni",
    dateDebut:"2025-12-16", dateFin:"2025-12-20",
    remplacantId:2, classesAffectees:[1],
    statut:"actif", // actif | cloture
    notifCoachOriginal:true, notifRemplacant:true,
  },
];

// ── Apprenants en attente d'affectation ──────────────
const INIT_APPRENANTS_ATTENTE = [
  { id:101, nom:"Koné",     prenom:"Adjoua",   email:"adjoua.k@gmail.com",   niveau:"A2", offre:"Anglais Pro B2",        profil:"Particulier", dateInscription:"2025-12-10" },
  { id:102, nom:"Traoré",   prenom:"Ibrahim",  email:"itraore@totalci.com",  niveau:"B1", offre:"Business English",      profil:"Entreprise",  dateInscription:"2025-12-11" },
  { id:103, nom:"Dupont",   prenom:"Marie",    email:"marie.d@cci.ci",       niveau:"B2", offre:"Préparation IELTS",     profil:"Étudiant",    dateInscription:"2025-12-08" },
  { id:104, nom:"Bamba",    prenom:"Seydou",   email:"s.bamba@orange.ci",    niveau:"A1", offre:"Anglais Pro B2",        profil:"Entreprise",  dateInscription:"2025-12-12" },
  { id:105, nom:"Ouattara", prenom:"Karim",    email:"k.ouattara@free.ci",   niveau:"B2", offre:"Certification TOEIC",   profil:"Particulier", dateInscription:"2025-12-09" },
];

// ── Notifications envoyées aux coachs ────────────────
const INIT_NOTIFICATIONS = [
  { id:1, coachId:2, type:"nouvel_etudiant", message:"Nouvel apprenant affecté : Marie Dupont (B2 – IELTS Prep)", date:"2025-12-13 14:30", lu:false },
  { id:2, coachId:1, type:"nouvelle_session", message:"Nouvelle session programmée : B2 Business – Lun 16 déc. 09:00 (Salle A)", date:"2025-12-12 10:00", lu:true },
];

// Données de présence pour chaque apprenant (par classe)
const INIT_PRESENCES = {
  // classe 1 : B2 Business
  1: [
    { apprenantId:1, nom:"Kouamé Aya",       totalSeances:12, presentes:11, absences:1,  retards:0, justifiees:1 },
    { apprenantId:2, nom:"Diallo Ibrahima",  totalSeances:12, presentes:10, absences:2,  retards:1, justifiees:0 },
    { apprenantId:3, nom:"Touré Mamadou",    totalSeances:12, presentes:12, absences:0,  retards:0, justifiees:0 },
  ],
  // classe 2 : TOEIC Prep
  2: [
    { apprenantId:4, nom:"Bamba Aïcha",      totalSeances:8,  presentes:7,  absences:1,  retards:0, justifiees:1 },
    { apprenantId:5, nom:"Coulibaly Jean",   totalSeances:8,  presentes:5,  absences:3,  retards:2, justifiees:0 },
  ],
  // classe 3 : A2 General
  3: [
    { apprenantId:7, nom:"Koné Fatou",       totalSeances:10, presentes:9,  absences:1,  retards:0, justifiees:0 },
    { apprenantId:8, nom:"N'Guessan",        totalSeances:10, presentes:8,  absences:2,  retards:1, justifiees:1 },
  ],
  // classe 4 : IELTS Prep
  4: [
    { apprenantId:9, nom:"Yao Stéphanie",    totalSeances:6,  presentes:6,  absences:0,  retards:0, justifiees:0 },
    { apprenantId:10,nom:"Ouattara Karim",   totalSeances:6,  presentes:4,  absences:2,  retards:1, justifiees:0 },
  ],
};

// Évolution de l'assiduité sur les dernières semaines (mock)
const ASSIDUITE_EVOLUTION = [
  { semaine:"S-4", taux:84 },
  { semaine:"S-3", taux:86 },
  { semaine:"S-2", taux:81 },
  { semaine:"S-1", taux:88 },
  { semaine:"Cette semaine", taux:87 },
];

/* ═══════════════════════════════════════════════════════
   COMPOSANTS UI
═══════════════════════════════════════════════════════ */
const Badge = ({ label, color, bg }) => (
  <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:99, fontSize:10, fontWeight:700, color, background:bg, whiteSpace:"nowrap" }}>{label}</span>
);

const StatCard = ({ label, value, color, icon, sub, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff", padding:16, borderRadius:12, boxShadow:"0 1px 6px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:12, cursor:onClick?"pointer":"default", border:"1px solid #f1f5f9" }}>
    <div style={{ width:46, height:46, borderRadius:10, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{icon}</div>
    <div style={{ minWidth:0 }}>
      <div style={{ fontSize:11, color:"#9ca3af" }}>{label}</div>
      <div style={{ fontSize:21, fontWeight:800, color, lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>{sub}</div>}
    </div>
  </div>
);

const ProgressBar = ({ value, color = C.primary, height = 6 }) => (
  <div style={{ height, background:"#e5e7eb", borderRadius:height, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.min(100, value||0)}%`, background:color, borderRadius:height, transition:"width .4s" }} />
  </div>
);

const Modal = ({ title, subtitle, onClose, children, wide }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
    <div style={{ background:"#fff", borderRadius:16, width: wide ? 780 : 560, maxWidth:"97vw", maxHeight:"94vh", overflowY:"auto", padding:28 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:subtitle?4:20 }}>
        <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#9ca3af", flexShrink:0 }}>✕</button>
      </div>
      {subtitle && <p style={{ margin:"0 0 20px", fontSize:12, color:"#9ca3af" }}>{subtitle}</p>}
      {children}
    </div>
  </div>
);

/* ── Grille de disponibilité ── */
const DispoGrid = ({ coach, salleOccupees, salleId, onSelectSlot, selectedSlots = [] }) => (
  <div style={{ overflowX:"auto" }}>
    <table style={{ borderCollapse:"collapse", fontSize:11, width:"100%" }}>
      <thead>
        <tr>
          <th style={{ padding:"6px 10px", background:"#f1f5f9", border:"1px solid #e5e7eb", width:60 }}>Heure</th>
          {JOURS.map(j=><th key={j} style={{ padding:"6px 10px", background:"#f1f5f9", border:"1px solid #e5e7eb", minWidth:70, textAlign:"center" }}>{j}</th>)}
        </tr>
      </thead>
      <tbody>
        {HEURES.map(h=>(
          <tr key={h}>
            <td style={{ padding:"5px 10px", border:"1px solid #e5e7eb", fontWeight:700, color:C.slate, background:"#f8fafc" }}>{h}</td>
            {JOURS.map(j=>{
              const key = `${j}-${h}`;
              const coachBusy = coach?.occupes?.includes(key);
              const salleBusy = salleId ? salleOccupees.includes(`${salleId}-${key}`) : false;
              const isSelected = selectedSlots.includes(key);
              let bg = "#fff", color = "#000", cursor = "pointer", title = "Disponible";
              if (coachBusy && salleBusy) { bg="#fee2e2"; color="#991b1b"; cursor="not-allowed"; title="Coach + salle occupés"; }
              else if (coachBusy)         { bg="#fef3c7"; color="#92400e"; cursor="not-allowed"; title="Coach occupé"; }
              else if (salleBusy)         { bg="#fce7f3"; color="#9d174d"; cursor="not-allowed"; title="Salle occupée"; }
              else if (isSelected)        { bg=C.primary; color="#fff"; title="Sélectionné"; }
              return (
                <td key={j} title={title} onClick={() => !coachBusy && !salleBusy && onSelectSlot && onSelectSlot(key)}
                  style={{ padding:"5px", border:"1px solid #e5e7eb", background:bg, cursor, textAlign:"center", transition:"background .15s" }}>
                  {isSelected && !coachBusy && !salleBusy ? <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>✓</span>
                   : coachBusy ? <span style={{ fontSize:9, color }}>●</span>
                   : salleBusy ? <span style={{ fontSize:9, color }}>■</span>
                   : null}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ display:"flex", gap:16, marginTop:8, fontSize:11, flexWrap:"wrap" }}>
      {[
        { bg:"#fff",      border:"1px solid #e5e7eb", label:"Disponible" },
        { bg:C.primary,   label:"Sélectionné" },
        { bg:"#fef3c7",   label:"Coach occupé" },
        { bg:"#fce7f3",   label:"Salle occupée" },
        { bg:"#fee2e2",   label:"Doublement occupé" },
      ].map(l=>(
        <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:14, height:14, borderRadius:3, background:l.bg, border:l.border||"none" }} />
          <span style={{ color:C.slate }}>{l.label}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   WIZARD ONBOARDING — CRÉER UNE CLASSE
═══════════════════════════════════════════════════════ */
const WIZARD_STEPS = [
  { n:1, label:"Infos classe",  icon:"📋" },
  { n:2, label:"Coach",         icon:"👨‍🏫" },
  { n:3, label:"Créneaux",      icon:"🗓️" },
  { n:4, label:"Apprenants",    icon:"👥" },
  { n:5, label:"Confirmation",  icon:"✅" },
];

function OnboardingWizard({ coachs, apprenants, salleOccupees, onConfirm, onCancel }) {
  const [step, setStep]       = useState(1);
  const [infos, setInfos]     = useState({ nom:"", niveau:"B1", offre:"", description:"" });
  const [coachId, setCoachId] = useState(null);
  const [salleId, setSalleId] = useState("A");
  const [slots, setSlots]     = useState([]);
  const [selectedApp, setSelectedApp] = useState([]);

  const coach = coachs.find(c=>c.id===coachId);
  const canNext1 = infos.nom && infos.offre;
  const canNext2 = coachId !== null;
  const canNext3 = slots.length > 0;

  const toggleSlot = (key) => setSlots(prev => prev.includes(key) ? prev.filter(s=>s!==key) : [...prev, key]);
  const toggleApp  = (id)  => setSelectedApp(prev => prev.includes(id) ? prev.filter(a=>a!==id) : [...prev, id]);

  return (
    <div>
      {/* Stepper */}
      <div style={{ display:"flex", alignItems:"center", marginBottom:28, gap:0 }}>
        {WIZARD_STEPS.map((s,i)=>(
          <React.Fragment key={s.n}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flex:1 }}>
              <div style={{
                width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:s.n < step ? 16 : 14, fontWeight:800,
                background: s.n < step ? C.green : s.n === step ? C.primary : "#e5e7eb",
                color: s.n <= step ? "#fff" : "#9ca3af",
                border: s.n === step ? `3px solid ${C.dark}` : "none",
                transition:"all .25s",
              }}>{s.n < step ? "✓" : s.icon}</div>
              <span style={{ fontSize:10, fontWeight: s.n===step?700:500, color:s.n<=step?C.primary:"#9ca3af", textAlign:"center" }}>{s.label}</span>
            </div>
            {i < WIZARD_STEPS.length-1 && (
              <div style={{ height:2, flex:1, background:step>s.n?C.green:"#e5e7eb", transition:"background .3s", marginBottom:20 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ─ Étape 1 : Infos classe ─ */}
      {step===1 && (
        <div>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>📋 Informations de la classe</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div>
              <label style={labelSt}>Nom de la classe *</label>
              <input style={inputSt} value={infos.nom} onChange={e=>setInfos({...infos,nom:e.target.value})} placeholder="ex : B2 Business Janvier" />
            </div>
            <div>
              <label style={labelSt}>Niveau CECRL *</label>
              <select style={inputSt} value={infos.niveau} onChange={e=>setInfos({...infos,niveau:e.target.value})}>
                {NIVEAUX.map(n=><option key={n}>{n}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={labelSt}>Offre / Programme *</label>
              <select style={inputSt} value={infos.offre} onChange={e=>setInfos({...infos,offre:e.target.value})}>
                <option value="">– Choisir une offre –</option>
                {OFFRES.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={labelSt}>Description / Objectifs</label>
              <textarea style={{ ...inputSt, height:70, resize:"vertical" }} value={infos.description} onChange={e=>setInfos({...infos,description:e.target.value})} placeholder="Objectifs pédagogiques, public cible, prérequis..." />
            </div>
          </div>
        </div>
      )}

      {/* ─ Étape 2 : Choix coach ─ */}
      {step===2 && (
        <div>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>👨‍🏫 Choisir un coach</div>
          <p style={{ fontSize:12, color:C.slate, marginBottom:16 }}>Sélectionnez un coach disponible. Les créneaux occupés sont indiqués.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {coachs.map(c=>{
              const selected = coachId===c.id;
              const charge = Math.round((c.heuresEffectuees/c.heuresPlanifiees)*100);
              return (
                <div key={c.id} onClick={()=>setCoachId(c.id)} style={{
                  borderRadius:12, padding:16, border:`2px solid ${selected?C.primary:"#e5e7eb"}`,
                  background:selected?C.light:"#fff", cursor:"pointer", transition:"all .2s",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:13 }}>{c.prenom} {c.nom} {selected && "✓"}</div>
                      <div style={{ fontSize:11, color:C.slate }}>{c.specialite}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.amber }}>⭐ {c.evaluationMoyenne}</div>
                      <div style={{ fontSize:10, color:C.slate }}>{c.occupes.length} créneaux pris</div>
                    </div>
                  </div>
                  <div style={{ marginBottom:6 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                      <span style={{ color:C.slate }}>Charge de travail</span>
                      <span style={{ fontWeight:700, color:charge>85?C.red:C.green }}>{charge}%</span>
                    </div>
                    <ProgressBar value={charge} color={charge>85?C.red:C.green} />
                  </div>
                  <div style={{ fontSize:10, color:C.slate }}>Classes : {c.classesEnCharge.join(", ")}</div>
                </div>
              );
            })}
          </div>
          {coachId && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Disponibilités de {coach?.prenom} {coach?.nom}</div>
              <DispoGrid coach={coach} salleOccupees={[]} salleId={null} />
            </div>
          )}
        </div>
      )}

      {/* ─ Étape 3 : Créneaux & Salle ─ */}
      {step===3 && (
        <div>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>🗓️ Créneaux & Salle</div>
          <p style={{ fontSize:12, color:C.slate, marginBottom:16 }}>Cliquez sur les cases disponibles pour sélectionner les créneaux de la classe.</p>
          <div style={{ display:"flex", gap:16, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
            <div>
              <label style={{ ...labelSt, display:"inline" }}>Salle : </label>
              <select value={salleId} onChange={e=>setSalleId(e.target.value)} style={{ ...inputSt, width:"auto", display:"inline-block", marginLeft:8 }}>
                {SALLES.map(s=><option key={s.id} value={s.id}>{s.nom} (max {s.capacite})</option>)}
              </select>
            </div>
            {slots.length>0 && (
              <div style={{ marginLeft:"auto", background:C.light, borderRadius:8, padding:"6px 12px", fontSize:12, color:C.dark, fontWeight:700 }}>
                {slots.length} créneau(x) sélectionné(s) : {slots.join(", ")}
              </div>
            )}
          </div>
          <DispoGrid coach={coach} salleOccupees={salleOccupees} salleId={salleId} onSelectSlot={toggleSlot} selectedSlots={slots} />
        </div>
      )}

      {/* ─ Étape 4 : Apprenants ─ */}
      {step===4 && (
        <div>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>👥 Ajouter des apprenants</div>
          <p style={{ fontSize:12, color:C.slate, marginBottom:16 }}>Sélectionnez les apprenants en attente d'affectation compatibles avec le niveau <strong>{infos.niveau}</strong>.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {apprenants.map(a=>{
              const selected = selectedApp.includes(a.id);
              const compatible = a.niveau === infos.niveau;
              return (
                <div key={a.id} onClick={()=>toggleApp(a.id)} style={{
                  display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10,
                  border:`2px solid ${selected?C.primary:compatible?"#e5e7eb":"#f1f5f9"}`,
                  background:selected?C.light:"#fff", cursor:"pointer", transition:"all .15s",
                  opacity:compatible?1:0.55,
                }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:selected?C.primary:C.light, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:selected?"#fff":C.primary, flexShrink:0 }}>
                    {selected ? "✓" : a.prenom[0]+a.nom[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>{a.prenom} {a.nom}</div>
                    <div style={{ fontSize:11, color:C.slate }}>{a.email} · {a.profil}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <Badge label={`Niveau ${a.niveau}`} color={a.niveau===infos.niveau?C.green:C.amber} bg={a.niveau===infos.niveau?"#dcfce7":"#fef3c7"} />
                    <div style={{ fontSize:10, color:C.slate, marginTop:3 }}>{a.offre}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:12, fontSize:12, color:C.slate }}>
            {selectedApp.length} apprenant(s) sélectionné(s) · Les apprenants d'autres niveaux peuvent être ajoutés mais sont signalés.
          </div>
        </div>
      )}

      {/* ─ Étape 5 : Confirmation ─ */}
      {step===5 && (
        <div>
          <div style={{ fontSize:15, fontWeight:800, marginBottom:20 }}>✅ Récapitulatif avant création</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            {[
              { label:"Nom de la classe", value:infos.nom, icon:"📋" },
              { label:"Niveau",           value:infos.niveau, icon:"🎓" },
              { label:"Offre",            value:infos.offre, icon:"🎯" },
              { label:"Coach assigné",    value:coach ? `${coach.prenom} ${coach.nom}` : "–", icon:"👨‍🏫" },
              { label:"Salle",            value:SALLES.find(s=>s.id===salleId)?.nom||"–", icon:"🏫" },
              { label:"Créneaux",         value:slots.length ? slots.join(" · ") : "–", icon:"🗓️" },
            ].map(r=>(
              <div key={r.label} style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:10, color:C.slate, marginBottom:3 }}>{r.icon} {r.label}</div>
                <div style={{ fontSize:13, fontWeight:700 }}>{r.value}</div>
              </div>
            ))}
          </div>
          {infos.description && (
            <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px", marginBottom:14, fontSize:12, color:"#374151" }}>
              <div style={{ fontSize:10, color:C.slate, marginBottom:3 }}>📝 Description</div>
              {infos.description}
            </div>
          )}
          <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px", marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>👥 Apprenants ({selectedApp.length})</div>
            {selectedApp.length===0 ? <div style={{ fontSize:12, color:C.slate }}>Aucun apprenant sélectionné</div> : (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {selectedApp.map(id=>{
                  const a = apprenants.find(ap=>ap.id===id);
                  return a ? <Badge key={id} label={`${a.prenom} ${a.nom}`} color={C.dark} bg={C.light} /> : null;
                })}
              </div>
            )}
          </div>
          <div style={{ background:"#ecfdf5", border:"1px solid #a7f3d0", borderRadius:10, padding:"12px 16px", fontSize:12, color:"#065f46" }}>
            🔔 <strong>Notifications automatiques :</strong> {coach?.prenom} {coach?.nom} recevra une notification dans son espace (nouvelle classe + créneaux). {selectedApp.length>0&&`${selectedApp.length} apprenant(s) seront notifié(s) de leur affectation.`}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:28, paddingTop:20, borderTop:"1px solid #e5e7eb" }}>
        <button onClick={step===1?onCancel:()=>setStep(s=>s-1)} style={btnSecondary}>
          {step===1 ? "Annuler" : "← Précédent"}
        </button>
        {step < 5 ? (
          <button
            disabled={(step===1&&!canNext1)||(step===2&&!canNext2)||(step===3&&!canNext3)}
            onClick={()=>setStep(s=>s+1)}
            style={{ ...btnPrimary, opacity:((step===1&&!canNext1)||(step===2&&!canNext2)||(step===3&&!canNext3))?0.45:1 }}>
            Suivant →
          </button>
        ) : (
          <button onClick={()=>onConfirm({ infos, coachId, salleId, slots, apprenants:selectedApp })} style={{ ...btnPrimary, background:C.green, padding:"10px 24px" }}>
            🚀 Créer la classe
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MODALE AFFECTATION D'UN APPRENANT
═══════════════════════════════════════════════════════ */
function AffectationModal({ apprenant, coachs, classes, salleOccupees, onConfirm, onClose }) {
  const [coachId, setCoachId]   = useState(null);
  const [classeId, setClasseId] = useState(null);
  const [slot, setSlot]         = useState(null);
  const [salleId, setSalleId]   = useState("A");
  const [step, setStep]         = useState(1); // 1=coach, 2=créneau, 3=confirm

  const coach       = coachs.find(c=>c.id===coachId);
  const classesDisp = classes.filter(c=>c.coachId===coachId);

  return (
    <div>
      {/* Mini-stepper */}
      <div style={{ display:"flex", gap:0, marginBottom:20 }}>
        {["Choisir coach","Créneau / Salle","Confirmer"].map((l,i)=>(
          <React.Fragment key={l}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:step>i+1?C.green:step===i+1?C.primary:"#e5e7eb", color:step>=i+1?"#fff":"#9ca3af", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800 }}>
                {step>i+1?"✓":i+1}
              </div>
              <span style={{ fontSize:11, fontWeight:step===i+1?700:500, color:step>=i+1?C.primary:C.slate }}>{l}</span>
            </div>
            {i<2 && <div style={{ flex:1, height:2, background:step>i+1?C.green:"#e5e7eb", margin:"0 8px", alignSelf:"center" }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Profil apprenant */}
      <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 16px", marginBottom:18, display:"flex", gap:12, alignItems:"center" }}>
        <div style={{ width:40, height:40, borderRadius:"50%", background:C.primary, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0 }}>
          {apprenant.prenom[0]}{apprenant.nom[0]}
        </div>
        <div>
          <div style={{ fontWeight:800 }}>{apprenant.prenom} {apprenant.nom}</div>
          <div style={{ fontSize:11, color:C.slate }}>{apprenant.email} · Niveau {apprenant.niveau} · {apprenant.offre}</div>
        </div>
      </div>

      {/* Étape 1 : Choisir coach */}
      {step===1 && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Sélectionnez un coach disponible</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {coachs.map(c=>{
              const selected = coachId===c.id;
              const charge = Math.round((c.heuresEffectuees/c.heuresPlanifiees)*100);
              return (
                <div key={c.id} onClick={()=>setCoachId(c.id)} style={{
                  display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10,
                  border:`2px solid ${selected?C.primary:"#e5e7eb"}`, background:selected?C.light:"#fff", cursor:"pointer",
                }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:selected?C.primary:C.light, color:selected?"#fff":C.primary, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0 }}>
                    {c.prenom[0]}{c.nom[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>{c.prenom} {c.nom} {selected?"✓":""}</div>
                    <div style={{ fontSize:11, color:C.slate }}>{c.specialite}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.amber }}>⭐ {c.evaluationMoyenne}</div>
                    <div style={{ fontSize:10, color:charge>85?C.red:C.green, fontWeight:600 }}>Charge {charge}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          {coachId && classesDisp.length>0 && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>Ou affecter à une classe existante</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {classesDisp.map(cl=>(
                  <div key={cl.id} onClick={()=>setClasseId(cl.id===classeId?null:cl.id)} style={{
                    padding:"7px 14px", borderRadius:8, border:`2px solid ${classeId===cl.id?C.primary:"#e5e7eb"}`,
                    background:classeId===cl.id?C.light:"#fff", cursor:"pointer", fontSize:12, fontWeight:600,
                  }}>{cl.nom} ({cl.effectif} apprenants)</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Étape 2 : Créneau */}
      {step===2 && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>Sélectionnez un créneau disponible</div>
          <p style={{ fontSize:12, color:C.slate, marginBottom:12 }}>Cases jaunes = coach occupé · Roses = salle occupée · Rouges = les deux</p>
          <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
            <label style={{ fontSize:12, fontWeight:700 }}>Salle :</label>
            <select value={salleId} onChange={e=>setSalleId(e.target.value)} style={{ ...inputSt, width:"auto" }}>
              {SALLES.map(s=><option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
            {slot && <Badge label={`Sélectionné : ${slot}`} color="#fff" bg={C.primary} />}
          </div>
          <DispoGrid coach={coach} salleOccupees={salleOccupees} salleId={salleId} onSelectSlot={k=>setSlot(slot===k?null:k)} selectedSlots={slot?[slot]:[]} />
        </div>
      )}

      {/* Étape 3 : Confirmer */}
      {step===3 && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Confirmer l'affectation</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            {[
              { label:"Apprenant",   value:`${apprenant.prenom} ${apprenant.nom}` },
              { label:"Coach",       value:coach?`${coach.prenom} ${coach.nom}`:"–" },
              { label:"Créneau",     value:slot||"–" },
              { label:"Salle",       value:SALLES.find(s=>s.id===salleId)?.nom||"–" },
              { label:"Classe",      value:classeId?classes.find(c=>c.id===classeId)?.nom||"–":"Nouvelle session" },
            ].map(r=>(
              <div key={r.label} style={{ background:"#f8fafc", borderRadius:8, padding:"10px 14px" }}>
                <div style={{ fontSize:10, color:C.slate }}>{r.label}</div>
                <div style={{ fontSize:13, fontWeight:700 }}>{r.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"#ecfdf5", border:"1px solid #a7f3d0", borderRadius:10, padding:"12px 16px", fontSize:12, color:"#065f46" }}>
            🔔 <strong>{coach?.prenom} {coach?.nom}</strong> recevra une notification dans son espace : nouvel apprenant + nouveau créneau.
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:24, paddingTop:16, borderTop:"1px solid #e5e7eb" }}>
        <button onClick={step===1?onClose:()=>setStep(s=>s-1)} style={btnSecondary}>
          {step===1?"Annuler":"← Retour"}
        </button>
        {step<3 ? (
          <button onClick={()=>setStep(s=>s+1)} disabled={step===1&&!coachId||step===2&&!slot}
            style={{ ...btnPrimary, opacity:(step===1&&!coachId||step===2&&!slot)?0.45:1 }}>
            Suivant →
          </button>
        ) : (
          <button onClick={()=>onConfirm({ apprenant, coachId, classeId, slot, salleId })} style={{ ...btnPrimary, background:C.green }}>
            ✅ Confirmer l'affectation
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function ResponsableDashboard() {
  const navigate = useNavigate();
  const profil = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom = profil?.prenom || profil?.first_name || "";
  const nom    = profil?.nom    || profil?.last_name  || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || profil?.email || "Responsable";
  const initiales  = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "RP";
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace: true });
  };

  const [activeTab, setActiveTab]         = useState("overview");
  const [coachs, setCoachs]               = useState(INIT_COACHS);

  // ── Coachs depuis la DB ──────────────────────────────
  const [coachsDB, setCoachsDB]           = useState([]);
  const [coachsLoading, setCoachsLoading] = useState(false);
  const [showCoachModal, setShowCoachModal]   = useState(false);
  const [editingCoach, setEditingCoach]       = useState(null);
  const [showCoachProfile, setShowCoachProfile] = useState(false);
  const [profileCoach, setProfileCoach]       = useState(null);
  const [coachAcces, setCoachAcces]           = useState(null); // { email, mdp_temp, email_sent }

  const fetchCoachs = async () => {
    setCoachsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/coachs`, { headers: authHdrs() });
      if (!res.ok) throw new Error();
      const { coachs: data } = await res.json();
      setCoachsDB(data || []);
    } catch { console.error("Chargement coachs"); }
    finally { setCoachsLoading(false); }
  };

  useEffect(() => { fetchCoachs(); }, []);

  const [classes, setClasses]             = useState(INIT_CLASSES);
  const [planning, setPlanning]           = useState(INIT_PLANNING);
  const [evaluations, setEvaluations]     = useState(INIT_EVALUATIONS);
  const [mediatheque, setMediatheque]     = useState(INIT_MEDIATHEQUE);
  const [demandes, setDemandes]           = useState(INIT_DEMANDES);
  const [salleOccupees, setSalleOccupees] = useState(INIT_SALLE_OCCUPEES);
  const [appAttente, setAppAttente]       = useState(INIT_APPRENANTS_ATTENTE);
  const [notifications, setNotifications] = useState(INIT_NOTIFICATIONS);
  const [absences, setAbsences]           = useState(INIT_ABSENCES);
  const [historiqueRH, setHistoriqueRH]   = useState([]); // registre RH des transferts définitifs

  // Modales absences
  const [showAbsenceModal, setShowAbsenceModal]     = useState(false);
  const [absenceForm, setAbsenceForm]               = useState({ coachId:null, type:"absence", motif:"", details:"", dateDebut:"", dateFin:"" });
  const [showRemplacantModal, setShowRemplacantModal] = useState(false);
  const [remplacantTarget, setRemplacantTarget]     = useState(null);
  const [showTransfertConfirm, setShowTransfertConfirm] = useState(false);
  const [transfertTarget, setTransfertTarget]       = useState(null); // { absence, remplacant }

  // Modales
  const [showWizard, setShowWizard]               = useState(false);
  const [showAffectation, setShowAffectation]     = useState(false);
  const [affectationTarget, setAffectationTarget] = useState(null);
  const [showCoachDispo, setShowCoachDispo]       = useState(false);
  const [coachDispoTarget, setCoachDispoTarget]   = useState(null);
  const [showAddModal, setShowAddModal]           = useState(false);
  const [modalType, setModalType]                 = useState("");
  const [ressourceForm, setRessourceForm]         = useState({ titre:"", type:"pdf", fileUrl:"", fileNom:"", taille:"" });
   const [presences, setPresences] = useState(INIT_PRESENCES);
const [filtreClassePres, setFiltreClassePres] = useState("all");

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "–";

  const nonLuCount = useMemo(()=>notifications.filter(n=>!n.lu).length,[notifications]);

  /* ── Créer une classe (wizard) ── */
  const handleConfirmWizard = ({ infos, coachId, salleId, slots, apprenants: appIds }) => {
    const newId = Math.max(...classes.map(c=>c.id),0)+1;
    const newClass = {
      id:newId, nom:infos.nom, coachId, niveau:infos.niveau, offre:infos.offre,
      effectif:appIds.length, progressionMoyenne:0, statut:"actif",
      apprenants:appIds,
      creneaux:slots.map(s=>({ jour:s.split("-")[0], heure:s.split("-")[1], salle:salleId }))
    };
    setClasses(prev=>[...prev, newClass]);

    // Marquer salles comme occupées
    const newOcc = slots.map(s=>`${salleId}-${s}`);
    setSalleOccupees(prev=>[...prev,...newOcc]);

    // Marquer coach comme occupé
    setCoachs(prev=>prev.map(c=>c.id===coachId?{...c, occupes:[...c.occupes,...slots], classesEnCharge:[...c.classesEnCharge,infos.nom]}:c));

    // Retirer apprenants de la liste d'attente
    setAppAttente(prev=>prev.filter(a=>!appIds.includes(a.id)));

    // Notification coach
    const coach = coachs.find(c=>c.id===coachId);
    const notifId = Math.max(...notifications.map(n=>n.id),0)+1;
    setNotifications(prev=>[{
      id:notifId, coachId, type:"nouvelle_classe",
      message:`Nouvelle classe créée : "${infos.nom}" (${infos.niveau}) · Créneaux : ${slots.join(", ")} · ${appIds.length} apprenant(s) affecté(s).`,
      date:new Date().toLocaleString("fr-FR"), lu:false,
    },...prev]);

    toast.success(`Classe "${infos.nom}" créée ! ${coach?.prenom} ${coach?.nom} notifié(e).`);
    setShowWizard(false);
  };

  /* ── Affecter un apprenant ── */
  const handleConfirmAffectation = ({ apprenant, coachId, classeId, slot, salleId }) => {
    const coach = coachs.find(c=>c.id===coachId);

    // Mettre à jour la classe si existante
    if (classeId) {
      setClasses(prev=>prev.map(c=>c.id===classeId?{...c, effectif:c.effectif+1, apprenants:[...c.apprenants, apprenant.id]}:c));
    } else {
      // Créer une mini session
      const newId = Math.max(...planning.map(p=>p.id),0)+1;
      const [jour, heure] = slot.split("-");
      setPlanning(prev=>[...prev,{
        id:newId, classeId:null, titre:`Session ${apprenant.prenom}`, coachId,
        date:new Date().toISOString().slice(0,10), heure, duree:"1h30", salle:salleId,
        type:"presentiel", inscrits:1, placesMax:1,
      }]);
    }

    // Occuper le créneau
    if (slot) {
      setCoachs(prev=>prev.map(c=>c.id===coachId?{...c,occupes:[...c.occupes,slot]}:c));
      setSalleOccupees(prev=>[...prev,`${salleId}-${slot}`]);
    }

    // Retirer de la liste d'attente
    setAppAttente(prev=>prev.filter(a=>a.id!==apprenant.id));

    // Notification coach
    const notifId = Math.max(...notifications.map(n=>n.id),0)+1;
    setNotifications(prev=>[{
      id:notifId, coachId, type:"nouvel_etudiant",
      message:`Nouvel apprenant affecté : ${apprenant.prenom} ${apprenant.nom} (${apprenant.niveau} – ${apprenant.offre}) · Créneau : ${slot||"à définir"}.`,
      date:new Date().toLocaleString("fr-FR"), lu:false,
    },...prev]);

    toast.success(`${apprenant.prenom} affecté(e) à ${coach?.prenom} ${coach?.nom} ! Notification envoyée.`);
    setShowAffectation(false);
    setAffectationTarget(null);
  };

  const handleDemande = (id, action) => {
    setDemandes(prev=>prev.map(d=>d.id===id?{...d,statut:action==="accepter"?"acceptee":"refusee"}:d));
    toast.success(`Demande ${action==="accepter"?"acceptée":"refusée"}`);
  };

  /* ── ABSENCES & REMPLACEMENTS ── */
  const absencesActives = absences.filter(a => a.statut === "actif");

  const ouvrirDeclaration = (coachId = null) => {
    setAbsenceForm({ coachId, type:"absence", motif:"", details:"", dateDebut:"", dateFin:"" });
    setShowAbsenceModal(true);
  };

  const confirmerAbsence = () => {
    if (!absenceForm.coachId || !absenceForm.motif || !absenceForm.dateDebut || !absenceForm.dateFin) {
      toast.error("Tous les champs obligatoires doivent être remplis"); return;
    }
    const classesCoach = classes.filter(c => c.coachId === absenceForm.coachId).map(c => c.id);
    const newAbs = {
      id: Math.max(...absences.map(a=>a.id), 0) + 1,
      coachId: absenceForm.coachId,
      type: absenceForm.type,
      motif: absenceForm.motif,
      details: absenceForm.details,
      dateDebut: absenceForm.dateDebut,
      dateFin: absenceForm.dateFin,
      remplacantId: null,
      classesAffectees: classesCoach,
      statut: "actif",
    };
    setAbsences(prev => [...prev, newAbs]);
    setCoachs(prev => prev.map(c => c.id === absenceForm.coachId
      ? { ...c, statut: absenceForm.type === "suspension" ? "suspendu" : "absent" }
      : c
    ));
    const coach = coachs.find(c => c.id === absenceForm.coachId);
    toast.success(`${absenceForm.type === "suspension" ? "Suspension" : "Absence"} déclarée pour ${coach?.prenom} ${coach?.nom}`);
    setShowAbsenceModal(false);
  };

  const ouvrirRemplacant = (absence) => {
    setRemplacantTarget(absence);
    setShowRemplacantModal(true);
  };

  const assignerRemplacant = (absenceId, remplacantId) => {
    const abs = absences.find(a => a.id === absenceId);
    if (!abs) return;
    setAbsences(prev => prev.map(a => a.id === absenceId ? { ...a, remplacantId } : a));
    setClasses(prev => prev.map(c =>
      abs.classesAffectees.includes(c.id) ? { ...c, remplacantId } : c
    ));
    const rempl = coachs.find(c => c.id === remplacantId);
    const orig  = coachs.find(c => c.id === abs.coachId);
    const notifId = Math.max(...notifications.map(n=>n.id), 0) + 1;
    setNotifications(prev => [{
      id: notifId, coachId: remplacantId, type: "remplacement",
      message: `Vous remplacez ${orig?.prenom} ${orig?.nom} du ${abs.dateDebut} au ${abs.dateFin} sur ${abs.classesAffectees.length} classe(s). Motif : ${abs.motif}.`,
      date: new Date().toLocaleString("fr-FR"), lu: false,
    }, ...prev]);
    toast.success(`${rempl?.prenom} ${rempl?.nom} assigné(e) comme remplaçant(e) — notification envoyée`);
    setShowRemplacantModal(false);
    setRemplacantTarget(null);
  };

  const cloturerAbsence = (absenceId) => {
    const abs = absences.find(a => a.id === absenceId);
    if (!abs) return;
    setAbsences(prev => prev.map(a => a.id === absenceId ? { ...a, statut: "cloture" } : a));
    setClasses(prev => prev.map(c =>
      abs.classesAffectees.includes(c.id) ? { ...c, remplacantId: null } : c
    ));
    setCoachs(prev => prev.map(c => c.id === abs.coachId ? { ...c, statut: "actif" } : c));
    const orig = coachs.find(c => c.id === abs.coachId);
    toast.success(`${orig?.prenom} ${orig?.nom} réintégré(e) — classes restituées`);
  };

  /* ── TRANSFERT DÉFINITIF ──────────────────────────────
     Coach B prend les classes en permanence :
     - coachId change définitivement sur les classes
     - Coach B voit ces classes dans son espace normal (pas "remplacement")
     - Heures de Coach B augmentent (pour la paie RH)
     - Coach A perd l'accès définitivement
     - Notification à Coach B + aux étudiants
     - Entrée RH créée pour la paie
  ──────────────────────────────────────────────────── */
  const confirmerTransfertDefinitif = () => {
    if (!transfertTarget) return;
    const { absence, remplacant } = transfertTarget;
    const orig = coachs.find(c => c.id === absence.coachId);
    const classesConcernees = classes.filter(c => absence.classesAffectees.includes(c.id));
    const dateTransfert = new Date().toISOString().split("T")[0];

    // 1. Changer coachId définitivement sur les classes + effacer remplacantId
    setClasses(prev => prev.map(c =>
      absence.classesAffectees.includes(c.id)
        ? { ...c, coachId: remplacant.id, remplacantId: null }
        : c
    ));

    // 2. Mettre à jour les coachs : Coach A perd les classes, Coach B les gagne
    const heuresSup = classesConcernees.reduce((s, cl) => s + (cl.effectif * 2), 0); // estimation
    setCoachs(prev => prev.map(c => {
      if (c.id === orig?.id) return {
        ...c,
        statut: absence.type === "suspension" ? "suspendu" : "actif",
        classesEnCharge: c.classesEnCharge.filter(n => !classesConcernees.map(cl=>cl.nom).includes(n)),
      };
      if (c.id === remplacant.id) return {
        ...c,
        classesEnCharge: [...c.classesEnCharge, ...classesConcernees.map(cl=>cl.nom)],
        heuresPlanifiees: c.heuresPlanifiees + heuresSup,
      };
      return c;
    }));

    // 3. Clôturer l'absence avec statut spécial
    setAbsences(prev => prev.map(a =>
      a.id === absence.id ? { ...a, statut: "transfert_definitif", dateTransfert } : a
    ));

    // 4. Notification Coach B — affectation définitive
    const nId = Math.max(...notifications.map(n=>n.id), 0) + 1;
    setNotifications(prev => [
      {
        id: nId,
        coachId: remplacant.id,
        type: "transfert_classe",
        message: `📋 Affectation définitive : vous êtes désormais le coach officiel de ${classesConcernees.length} classe(s) : ${classesConcernees.map(cl=>cl.nom).join(", ")}. Ces heures sont comptabilisées dans votre paie RH.`,
        date: new Date().toLocaleString("fr-FR"),
        lu: false,
      },
      {
        id: nId + 1,
        coachId: remplacant.id,
        type: "info_etudiants",
        message: `📢 Notification automatique envoyée aux ${classesConcernees.reduce((s,cl)=>s+cl.effectif,0)} étudiant(s) concerné(s) : "Votre nouveau coach est ${remplacant.prenom} ${remplacant.nom}. Ce changement est effectif à partir du ${dateTransfert}."`,
        date: new Date().toLocaleString("fr-FR"),
        lu: false,
      },
      ...prev,
    ]);

    // 5. Enregistrement RH
    setHistoriqueRH(prev => [{
      id: Date.now(),
      dateTransfert,
      coachOriginalId: orig?.id,
      coachOriginalNom: `${orig?.prenom} ${orig?.nom}`,
      coachRemplacantId: remplacant.id,
      coachRemplacantNom: `${remplacant.prenom} ${remplacant.nom}`,
      classes: classesConcernees.map(cl => ({ id:cl.id, nom:cl.nom, effectif:cl.effectif })),
      motifOriginal: absence.motif,
      typeAbsence: absence.type,
      heuresTransferees: heuresSup,
      statut: "enregistre_RH",
    }, ...prev]);

    toast.success(`Transfert définitif confirmé — ${remplacant.prenom} ${remplacant.nom} est le nouveau coach officiel · RH notifié · Étudiants informés`);
    setShowTransfertConfirm(false);
    setTransfertTarget(null);
  };

  const markNotifRead = (id) => setNotifications(prev=>prev.map(n=>n.id===id?{...n,lu:true}:n));

  const TABS = [
    { key:"overview",     label:"Vue d'ensemble",    icon:"🏠" },
    { key:"affectation",  label:"Affectation",        icon:"🎯", badge:appAttente.length, highlight:true },
    { key:"disponibilites",label:"Disponibilités",   icon:"🗓️" },
    { key:"coachs",       label:"Coachs",             icon:"👨‍🏫" },
    { key:"absences",     label:"Absences / Rempl.",  icon:"🚨", badge:absencesActives.length||null, danger:absencesActives.length>0 },
    { key:"classes",      label:"Classes",            icon:"👥" },
    { key:"presences",    label:"Présences",          icon:"📊", badge:null },
    { key:"planning",     label:"Planning",           icon:"📅" },
    { key:"evaluations",  label:"Évaluations",        icon:"📝" },
    { key:"mediatheque",  label:"Médiathèque",        icon:"📚" },
    { key:"demandes",     label:"Demandes",           icon:"📬", badge:demandes.filter(d=>d.statut==="en_attente").length, danger:true },
    { key:"notifications",label:"Notifications",      icon:"🔔", badge:nonLuCount, danger:nonLuCount>0 },
    { key:"messages",     label:"Messages",           icon:"💬" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f0f9ff" }}>
      <Toaster position="top-right" />

      {/* ── HERO ── */}
      <div style={{ background:C.gradient, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", gap:20, marginBottom:20 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"#7dd3fc", fontWeight:600, letterSpacing:".08em" }}>Responsable pédagogique 👋</div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{nomComplet}</h1>
            <div style={{ fontSize:12, color:"#bae6fd", marginTop:3 }}>{profil?.email || "Supervision · Affectation · Planning · Onboarding classes"}</div>
          </div>
          <div style={{ display:"flex", gap:10, flexShrink:0 }}>
            <button onClick={()=>setShowWizard(true)} style={{ background:"#fff", color:C.primary, border:"none", borderRadius:12, padding:"12px 22px", fontWeight:800, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 14px rgba(0,0,0,0.15)" }}>
              🧭 <span>Nouvelle classe</span>
            </button>
            <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:6, padding:"12px 16px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:12, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", transition:"background .2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
              🚪 Déconnexion
            </button>
          </div>
        </div>
        <div style={{ display:"flex", background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden" }}>
          {[
            { l:"Coachs actifs",     v:`${coachs.filter(c=>c.statut==="actif").length}/${coachs.length}`, c:"#38bdf8" },
            { l:"Classes ouvertes",  v:classes.length, c:"#34d399" },
            { l:"En attente affec.", v:appAttente.length, c:"#fbbf24" },
            { l:"Notifs non lues",   v:nonLuCount, c:"#f87171" },
          ].map((s,i,arr)=>(
            <div key={s.l} style={{ flex:1, textAlign:"center", padding:"13px 8px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.08)":"none" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginBottom:2 }}>{s.l}</div>
              <div style={{ fontSize:19, fontWeight:800, color:s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 24px 32px" }}>
        {/* Tabs */}
        <div style={{ display:"flex", gap:0, flexWrap:"wrap", background:"#fff", borderRadius:"0 0 0 0", boxShadow:"0 1px 0 #e5e7eb", overflowX:"auto" }}>
          {TABS.map(tab=>{
            const isActive = activeTab===tab.key;
            return (
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
                padding:"12px 16px", border:"none", borderBottom:isActive?`3px solid ${C.primary}`:"3px solid transparent",
                background:"transparent", cursor:"pointer", fontWeight:700, fontSize:12,
                color:isActive?C.primary:"#6b7280", whiteSpace:"nowrap",
                display:"flex", alignItems:"center", gap:5, transition:"color .15s",
              }}>
                <span>{tab.icon}</span>{tab.label}
                {tab.badge>0 && (
                  <span style={{ background:tab.danger?"#ef4444":C.primary, color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"1px 6px", minWidth:18, textAlign:"center" }}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", padding:24 }}>

          {/* ════ VUE D'ENSEMBLE ════ */}
          {activeTab==="overview" && (
            <div>
              {/* Bannière absences actives */}
              {absencesActives.length > 0 && (
                <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ fontSize:26, flexShrink:0 }}>🚨</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:13, color:"#991b1b", marginBottom:3 }}>
                      {absencesActives.length} coach{absencesActives.length>1?"s":""} absent{absencesActives.length>1?"s":""} / suspendu{absencesActives.length>1?"s":""}
                    </div>
                    <div style={{ fontSize:12, color:"#b91c1c" }}>
                      {absencesActives.map(a => {
                        const c = coachs.find(x=>x.id===a.coachId);
                        const r = coachs.find(x=>x.id===a.remplacantId);
                        return `${c?.prenom} ${c?.nom} (${a.motif})${r ? ` → remplacé par ${r.prenom} ${r.nom}` : " → aucun remplaçant"}`;
                      }).join(" · ")}
                    </div>
                  </div>
                  <button onClick={()=>setActiveTab("absences")} style={{ ...btnPrimary, background:"#dc2626", whiteSpace:"nowrap" }}>
                    Gérer →
                  </button>
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
                <StatCard label="Coachs actifs" value={`${coachs.filter(c=>c.statut==="actif").length}/${coachs.length}`} color={C.primary} icon="👨‍🏫" sub="Taux activité 87%" />
                <StatCard label="Classes ouvertes" value={classes.length} color={C.green} icon="👥" sub="+1 ce mois" onClick={()=>setActiveTab("classes")} />
                <StatCard label="Apprenants en attente" value={appAttente.length} color={C.amber} icon="⏳" sub="à affecter" onClick={()=>setActiveTab("affectation")} />
                <StatCard label="Évaluations à venir" value={evaluations.length} color={C.purple} icon="📝" sub="dont 1 examen final" />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📈 Progression par classe</div>
                  {classes.map(c=>(
                    <div key={c.id} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                        <span style={{ fontWeight:600 }}>{c.nom}</span><span style={{ fontWeight:700, color:C.primary }}>{c.progressionMoyenne}%</span>
                      </div>
                      <ProgressBar value={c.progressionMoyenne} />
                    </div>
                  ))}
                </div>
                <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>⏱️ Charge des coachs</div>
                  {coachs.map(c=>{
                    const charge = Math.round((c.heuresEffectuees/c.heuresPlanifiees)*100);
                    return (
                      <div key={c.id} style={{ marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                          <span style={{ fontWeight:600 }}>{c.prenom} {c.nom}</span>
                          <span style={{ fontWeight:700, color:charge>85?C.red:C.green }}>{c.heuresEffectuees}h / {c.heuresPlanifiees}h</span>
                        </div>
                        <ProgressBar value={charge} color={charge>85?C.red:C.amber} />
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* CTA Onboarding */}
              <div style={{ background:C.gradient, borderRadius:14, padding:"20px 24px", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>🧭 Créer une nouvelle classe</div>
                  <div style={{ fontSize:12, color:"#bae6fd" }}>Assistant pas-à-pas · Vérification des disponibilités · Notification automatique du coach</div>
                </div>
                <button onClick={()=>setShowWizard(true)} style={{ background:"#fff", color:C.primary, border:"none", borderRadius:10, padding:"11px 24px", fontWeight:800, fontSize:13, cursor:"pointer" }}>
                  Démarrer l'onboarding →
                </button>
              </div>
            </div>
          )}

          {/* ════ AFFECTATION ════ */}
          {activeTab==="affectation" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:17, fontWeight:800 }}>🎯 Affectation des apprenants</h2>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate }}>Vérifiez les disponibilités et affectez chaque apprenant à un coach.</p>
                </div>
              </div>
              {appAttente.length===0 ? (
                <div style={{ textAlign:"center", padding:"40px 20px", color:C.slate }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                  <div style={{ fontSize:16, fontWeight:700 }}>Tous les apprenants sont affectés !</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {appAttente.map(a=>(
                    <div key={a.id} style={{ display:"flex", alignItems:"center", gap:16, background:"#f8fafc", borderRadius:12, padding:"14px 18px", border:"1px solid #e5e7eb" }}>
                      <div style={{ width:44, height:44, borderRadius:"50%", background:C.primary, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, flexShrink:0 }}>
                        {a.prenom[0]}{a.nom[0]}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:800 }}>{a.prenom} {a.nom}</div>
                        <div style={{ fontSize:12, color:C.slate }}>{a.email} · {a.profil}</div>
                        <div style={{ display:"flex", gap:8, marginTop:5 }}>
                          <Badge label={`Niveau ${a.niveau}`} color={C.dark} bg={C.light} />
                          <Badge label={a.offre} color="#374151" bg="#f1f5f9" />
                        </div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontSize:11, color:C.slate, marginBottom:8 }}>Inscrit le {formatDate(a.dateInscription)}</div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={()=>{setCoachDispoTarget(null);setActiveTab("disponibilites");}} style={{ ...btnSecondary, fontSize:11, padding:"6px 12px" }}>🗓️ Voir dispos</button>
                          <button onClick={()=>{setAffectationTarget(a);setShowAffectation(true);}} style={{ ...btnPrimary, fontSize:11, padding:"6px 14px" }}>→ Affecter</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ DISPONIBILITÉS ════ */}
          {activeTab==="disponibilites" && (
            <div>
              <h2 style={{ margin:"0 0 6px", fontSize:17, fontWeight:800 }}>🗓️ Disponibilités des coachs et salles</h2>
              <p style={{ margin:"0 0 20px", fontSize:12, color:C.slate }}>Consultez en un coup d'œil les créneaux libres avant toute affectation.</p>
              {/* Sélecteur coach */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
                <button onClick={()=>setCoachDispoTarget(null)} style={{ ...btnSecondary, background:!coachDispoTarget?C.light:"#e5e7eb", color:!coachDispoTarget?C.primary:"#374151", border:`1px solid ${!coachDispoTarget?C.primary:"#e5e7eb"}` }}>
                  Toutes les salles
                </button>
                {coachs.map(c=>(
                  <button key={c.id} onClick={()=>setCoachDispoTarget(c.id===coachDispoTarget?null:c.id)} style={{ ...btnSecondary, background:coachDispoTarget===c.id?C.light:"#e5e7eb", color:coachDispoTarget===c.id?C.primary:"#374151", border:`1px solid ${coachDispoTarget===c.id?C.primary:"#e5e7eb"}` }}>
                    {c.prenom} {c.nom}
                  </button>
                ))}
              </div>
              {coachDispoTarget ? (
                <div>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>
                    Disponibilités de {coachs.find(c=>c.id===coachDispoTarget)?.prenom} {coachs.find(c=>c.id===coachDispoTarget)?.nom}
                  </div>
                  {SALLES.filter(s=>s.id!=="T").map(salle=>(
                    <div key={salle.id} style={{ marginBottom:24 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.slate, marginBottom:8 }}>
                        🏫 {salle.nom} (capacité {salle.capacite})
                      </div>
                      <DispoGrid coach={coachs.find(c=>c.id===coachDispoTarget)} salleOccupees={salleOccupees} salleId={salle.id} />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {SALLES.filter(s=>s.id!=="T").map(salle=>(
                    <div key={salle.id} style={{ marginBottom:24 }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>
                        🏫 {salle.nom} (capacité {salle.capacite})
                      </div>
                      <DispoGrid coach={null} salleOccupees={salleOccupees} salleId={salle.id} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ COACHS ════ */}
          {activeTab==="coachs" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:17, fontWeight:800 }}>👨‍🏫 Gestion des coachs</h2>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate }}>{coachsDB.length} coach{coachsDB.length!==1?"s":""} enregistré{coachsDB.length!==1?"s":""}</p>
                </div>
                <button onClick={()=>{ setEditingCoach(null); setShowCoachModal(true); }} style={btnPrimary}>+ Créer un profil coach</button>
              </div>

              {coachsLoading && <div style={{ textAlign:"center", padding:40, color:C.primary }}>⏳ Chargement…</div>}

              {/* Grille cartes coaches */}
              {!coachsLoading && coachsDB.length === 0 && (
                <div style={{ textAlign:"center", padding:"60px 24px", background:"#f8fafc", borderRadius:16, border:"1.5px dashed #e2e8f0" }}>
                  <div style={{ fontSize:"3rem", marginBottom:12 }}>👨‍🏫</div>
                  <div style={{ fontWeight:700, color:"#0f172a", marginBottom:8 }}>Aucun coach enregistré</div>
                  <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>Créez le premier profil coach pour commencer.</div>
                  <button onClick={()=>{ setEditingCoach(null); setShowCoachModal(true); }} style={btnPrimary}>+ Créer un profil coach</button>
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16, marginBottom:32 }}>
                {coachsDB.map(c => {
                  const initiales = ((c.prenom?.[0]||"")+(c.nom?.[0]||"")).toUpperCase();
                  const statutColor = c.statut==="actif" ? { bg:"#dcfce7", color:"#15803d" } : c.statut==="suspendu" ? { bg:"#fee2e2", color:"#991b1b" } : { bg:"#fef3c7", color:"#92400e" };
                  return (
                    <div key={c.id} style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", transition:"transform .15s" }}
                      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                      {/* Header carte */}
                      <div style={{ background:"linear-gradient(135deg,#0f172a,#0891b2)", padding:"20px 20px 50px", position:"relative" }}>
                        <span style={{ position:"absolute", top:12, right:12, padding:"3px 10px", borderRadius:99, fontSize:10, fontWeight:800, background:statutColor.bg, color:statutColor.color }}>
                          {c.statut}
                        </span>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", fontWeight:600 }}>{c.grade || "Coach"}</div>
                        <div style={{ fontWeight:800, fontSize:16, color:"#fff", marginTop:2 }}>{c.prenom} {c.nom}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,.7)", marginTop:2 }}>{(c.specialites||[]).slice(0,2).join(" · ") || "—"}</div>
                      </div>
                      {/* Avatar centré */}
                      <div style={{ display:"flex", justifyContent:"center", marginTop:-32, marginBottom:8, position:"relative", zIndex:1 }}>
                        {c.photo_url
                          ? <img src={c.photo_url} alt={c.prenom} style={{ width:64, height:64, borderRadius:"50%", border:"3px solid #fff", objectFit:"cover", boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }} />
                          : <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#0891b2,#0e7490)", border:"3px solid #fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>{initiales}</div>
                        }
                      </div>
                      {/* Infos */}
                      <div style={{ padding:"0 16px 16px", textAlign:"center" }}>
                        <div style={{ fontSize:11, color:C.slate, marginBottom:4 }}>{c.email}</div>
                        {c.telephone && <div style={{ fontSize:11, color:C.slate, marginBottom:8 }}>📞 {c.telephone}</div>}
                        <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:12 }}>
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:16, fontWeight:800, color:C.primary }}>{c.evaluation_moyenne > 0 ? c.evaluation_moyenne.toFixed(1) : "–"}</div>
                            <div style={{ fontSize:9, color:C.slate }}>Éval./5</div>
                          </div>
                          <div style={{ width:1, background:"#e5e7eb" }} />
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:16, fontWeight:800, color:C.primary }}>{c.experience_annees || 0}</div>
                            <div style={{ fontSize:9, color:C.slate }}>Ans exp.</div>
                          </div>
                          <div style={{ width:1, background:"#e5e7eb" }} />
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:16, fontWeight:800, color:C.primary }}>{c.heures_effectuees || 0}</div>
                            <div style={{ fontSize:9, color:C.slate }}>Heures</div>
                          </div>
                        </div>
                        {/* Niveaux */}
                        {(c.niveaux_enseignes||[]).length > 0 && (
                          <div style={{ display:"flex", justifyContent:"center", gap:4, flexWrap:"wrap", marginBottom:12 }}>
                            {c.niveaux_enseignes.map(n => (
                              <span key={n} style={{ padding:"2px 8px", borderRadius:99, background:"#e0f2fe", color:C.primary, fontSize:10, fontWeight:700 }}>{n}</span>
                            ))}
                          </div>
                        )}
                        {/* Actions */}
                        <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                          <button onClick={()=>{ setProfileCoach(c); setShowCoachProfile(true); }} style={{ ...btnSecondary, fontSize:11, padding:"7px 14px" }}>👤 Profil</button>
                          <button onClick={()=>{ setEditingCoach(c); setShowCoachModal(true); }} style={{ ...btnSecondary, fontSize:11, padding:"7px 14px" }}>✏️ Modifier</button>
                          <button onClick={()=>{setCoachDispoTarget(c.id); setActiveTab("disponibilites");}} style={{ ...btnSecondary, fontSize:11, padding:"7px 12px" }}>🗓️</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tableau récap coachs mock (planning) */}
              {coachs.length > 0 && (
                <div>
                  <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:"0 0 12px" }}>📋 Coachs planning (session en cours)</h3>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"#f9fafb", fontSize:11, color:"#6b7280" }}>
                      <th style={th}>Coach</th><th style={th}>Spécialité</th><th style={th}>Classes</th><th style={th}>Éval.</th><th style={th}>Charge</th><th style={th}>Statut</th><th style={th}>Actions</th>
                    </tr></thead>
                    <tbody>
                      {coachs.map(c=>{
                        const charge = Math.round((c.heuresEffectuees/c.heuresPlanifiees)*100);
                        return (
                          <tr key={c.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                            <td style={td}><div style={{ fontWeight:700 }}>{c.prenom} {c.nom}</div><div style={{ fontSize:10, color:C.slate }}>{c.email}</div></td>
                            <td style={td}>{c.specialite}</td>
                            <td style={td}><div style={{ fontSize:11 }}>{c.classesEnCharge.join(", ")}</div></td>
                            <td style={td}>⭐ {c.evaluationMoyenne}/5</td>
                            <td style={td}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ width:50, height:5, background:"#e5e7eb", borderRadius:5, overflow:"hidden" }}>
                                  <div style={{ height:"100%", width:`${charge}%`, background:charge>85?C.red:C.amber, borderRadius:5 }} />
                                </div>
                                <span style={{ fontWeight:700, color:charge>85?C.red:C.slate, fontSize:11 }}>{charge}%</span>
                              </div>
                            </td>
                            <td style={td}>
                              {c.statut==="suspendu" ? <Badge label="Suspendu" color="#991b1b" bg="#fee2e2"/>
                               : c.statut==="absent"  ? <Badge label="Absent" color="#92400e" bg="#fef3c7"/>
                               : <Badge label="Actif" color="#15803d" bg="#dcfce7"/>}
                            </td>
                            <td style={td}>
                              <button onClick={()=>{setCoachDispoTarget(c.id);setActiveTab("disponibilites");}} style={{ ...btnIconSm, marginBottom:4 }}>🗓️ Dispos</button>
                              {c.statut==="actif"
                                ? <button onClick={()=>ouvrirDeclaration(c.id)} style={{ ...btnIconSm, background:"#fef2f2", color:"#dc2626" }}>🚨 Abs/Susp</button>
                                : <button onClick={()=>{ const abs=absencesActives.find(a=>a.coachId===c.id); if(abs) cloturerAbsence(abs.id); }} style={{ ...btnIconSm, background:"#dcfce7", color:"#15803d" }}>✅ Réintégrer</button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ════ ABSENCES & REMPLACEMENTS ════ */}
          {activeTab==="absences" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:17, fontWeight:800 }}>🚨 Absences & Remplacements</h2>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate }}>Déclarez une absence ou suspension et assignez un remplaçant sans toucher à l'organisation des cours.</p>
                </div>
                <button onClick={()=>ouvrirDeclaration()} style={{ ...btnPrimary, background:"#dc2626" }}>+ Déclarer une absence</button>
              </div>

              {/* Explication du principe */}
              <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:12, padding:"14px 18px", marginBottom:24, fontSize:12, color:"#0c4a6e", lineHeight:1.7 }}>
                <strong>💡 Comment ça fonctionne :</strong> Le coach d'origine reste propriétaire de ses classes.
                Un remplaçant voit temporairement les cours avec un badge <strong>"🔄 Remplacement"</strong> dans son espace.
                Quand la période se termine, cliquez <strong>"Clôturer"</strong> — tout revient automatiquement au coach original. <strong>Zéro modification des modules, apprenants ou créneaux.</strong>
              </div>

              {/* Absences actives */}
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:13, fontWeight:800, marginBottom:12, color:"#0f172a" }}>🔴 Absences / suspensions en cours ({absencesActives.length})</div>
                {absencesActives.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"30px 20px", color:C.slate, background:"#f8fafc", borderRadius:12, border:"1px dashed #d1d5db" }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
                    <div style={{ fontWeight:700 }}>Tous les coachs sont actifs</div>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {absencesActives.map(abs => {
                      const coach   = coachs.find(c=>c.id===abs.coachId);
                      const rempl   = coachs.find(c=>c.id===abs.remplacantId);
                      const classesConcernees = classes.filter(c=>abs.classesAffectees.includes(c.id));
                      const typeColor = abs.type==="suspension"
                        ? { bg:"#fef2f2", border:"#fecaca", badge:{ bg:"#fee2e2", c:"#991b1b", label:"Suspension" } }
                        : { bg:"#fff7ed", border:"#fed7aa", badge:{ bg:"#fef3c7", c:"#92400e", label:"Absence" } };
                      return (
                        <div key={abs.id} style={{ borderRadius:14, border:`1px solid ${typeColor.border}`, background:typeColor.bg, padding:18 }}>
                          <div style={{ display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
                            {/* Avatar coach */}
                            <div style={{ width:48, height:48, borderRadius:"50%", background:"#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, flexShrink:0 }}>
                              {coach?.prenom?.[0]}{coach?.nom?.[0]}
                            </div>
                            <div style={{ flex:1, minWidth:200 }}>
                              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                                <div style={{ fontSize:14, fontWeight:800 }}>{coach?.prenom} {coach?.nom}</div>
                                <Badge label={typeColor.badge.label} color={typeColor.badge.c} bg={typeColor.badge.bg} />
                              </div>
                              <div style={{ fontSize:12, color:"#374151", marginBottom:6 }}>
                                <strong>Motif :</strong> {abs.motif} {abs.details && `— ${abs.details}`}
                              </div>
                              <div style={{ fontSize:12, color:C.slate, marginBottom:8 }}>
                                📅 Du <strong>{abs.dateDebut}</strong> au <strong>{abs.dateFin}</strong>
                              </div>
                              {/* Classes concernées */}
                              <div style={{ fontSize:11, marginBottom:8 }}>
                                <strong style={{ color:"#374151" }}>Classes concernées ({classesConcernees.length}) :</strong>
                                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
                                  {classesConcernees.map(cl=>(
                                    <span key={cl.id} style={{ padding:"2px 8px", borderRadius:6, background:"#f1f5f9", border:"1px solid #e2e8f0", fontSize:11 }}>
                                      {cl.nom}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {/* Remplaçant */}
                              {rempl ? (
                                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, background:"#dcfce7", border:"1px solid #bbf7d0" }}>
                                  <span style={{ fontSize:16 }}>🔄</span>
                                  <div style={{ flex:1 }}>
                                    <div style={{ fontSize:12, fontWeight:700, color:"#15803d" }}>Remplacé par : {rempl.prenom} {rempl.nom}</div>
                                    <div style={{ fontSize:11, color:"#166534" }}>{rempl.specialite} · Notification envoyée</div>
                                  </div>
                                  <button onClick={()=>ouvrirRemplacant(abs)} style={{ ...btnIconSm, background:"#bbf7d0", color:"#15803d" }}>Changer</button>
                                </div>
                              ) : (
                                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, background:"#fff3cd", border:"1px solid #fbbf24" }}>
                                  <span style={{ fontSize:16 }}>⚠️</span>
                                  <div style={{ flex:1, fontSize:12, color:"#92400e", fontWeight:600 }}>Aucun remplaçant assigné — les classes sont sans coach actif</div>
                                  <button onClick={()=>ouvrirRemplacant(abs)} style={{ ...btnPrimary, padding:"6px 14px", fontSize:11, background:"#d97706" }}>Assigner →</button>
                                </div>
                              )}
                            </div>
                            {/* Actions */}
                            <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                              <button onClick={()=>cloturerAbsence(abs.id)} style={{ ...btnSecondary, fontSize:11, padding:"6px 12px", background:"#dcfce7", color:"#15803d", border:"1px solid #bbf7d0" }}>
                                ✅ Clôturer — Réintégrer
                              </button>
                              {abs.remplacantId && (
                                <button
                                  onClick={()=>{ setTransfertTarget({ absence:abs, remplacant:coachs.find(c=>c.id===abs.remplacantId) }); setShowTransfertConfirm(true); }}
                                  style={{ ...btnPrimary, fontSize:11, padding:"6px 12px", background:"#7c3aed" }}>
                                  🏛️ Transfert définitif
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Historique absences clôturées */}
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:13, fontWeight:800, marginBottom:12, color:"#6b7280" }}>🕓 Historique absences clôturées ({absences.filter(a=>a.statut==="cloture").length})</div>
                {absences.filter(a=>a.statut==="cloture").length === 0 ? (
                  <div style={{ fontSize:12, color:C.slate, fontStyle:"italic" }}>Aucune absence clôturée.</div>
                ) : (
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"#f9fafb", fontSize:11 }}>
                      <th style={th}>Coach</th><th style={th}>Type</th><th style={th}>Motif</th><th style={th}>Période</th><th style={th}>Remplaçant</th><th style={th}>Résultat</th>
                    </tr></thead>
                    <tbody>
                      {absences.filter(a=>a.statut==="cloture").map(abs=>{
                        const coach = coachs.find(c=>c.id===abs.coachId);
                        const rempl = coachs.find(c=>c.id===abs.remplacantId);
                        return (
                          <tr key={abs.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                            <td style={td}>{coach?.prenom} {coach?.nom}</td>
                            <td style={td}><Badge label={abs.type==="suspension"?"Suspension":"Absence"} color="#374151" bg="#f1f5f9"/></td>
                            <td style={td}>{abs.motif}</td>
                            <td style={td}>{abs.dateDebut} → {abs.dateFin}</td>
                            <td style={td}>{rempl?`${rempl.prenom} ${rempl.nom}`:"—"}</td>
                            <td style={td}><Badge label="Coach réintégré" color="#15803d" bg="#dcfce7"/></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Registre RH — Transferts définitifs */}
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"#7c3aed" }}>🏛️ Registre RH — Transferts définitifs ({historiqueRH.length + absences.filter(a=>a.statut==="transfert_definitif").length})</div>
                  <Badge label="Paie impactée" color="#7c3aed" bg="#ede9fe"/>
                </div>
                {historiqueRH.length === 0 && absences.filter(a=>a.statut==="transfert_definitif").length === 0 ? (
                  <div style={{ fontSize:12, color:C.slate, fontStyle:"italic" }}>Aucun transfert définitif enregistré.</div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {historiqueRH.map(rh => (
                      <div key={rh.id} style={{ borderRadius:12, border:"1px solid #ddd6fe", background:"#faf5ff", padding:"14px 18px" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
                              <Badge label="Transfert définitif" color="#7c3aed" bg="#ede9fe"/>
                              <span style={{ fontSize:11, color:C.slate }}>📅 {rh.dateTransfert}</span>
                            </div>
                            <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:4 }}>
                              <span style={{ color:"#dc2626" }}>{rh.coachOriginalNom}</span>
                              <span style={{ color:C.slate, fontWeight:400, margin:"0 8px" }}>→</span>
                              <span style={{ color:"#15803d" }}>{rh.coachRemplacantNom}</span>
                              <span style={{ fontSize:11, color:C.slate, marginLeft:8, fontWeight:400 }}>({rh.typeAbsence === "suspension" ? "suspension" : "absence"} — {rh.motifOriginal})</span>
                            </div>
                            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                              {rh.classes.map(cl=>(
                                <span key={cl.id} style={{ padding:"2px 8px", borderRadius:6, background:"#f3e8ff", border:"1px solid #ddd6fe", fontSize:11 }}>
                                  {cl.nom} ({cl.effectif} apprenants)
                                </span>
                              ))}
                            </div>
                            <div style={{ fontSize:12, color:"#7c3aed", fontWeight:600 }}>
                              ⏱ +{rh.heuresTransferees}h planifiées transférées à {rh.coachRemplacantNom}
                            </div>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end", flexShrink:0 }}>
                            <Badge label="✅ Enregistré RH" color="#15803d" bg="#dcfce7"/>
                            <div style={{ fontSize:10, color:C.slate }}>Notifications envoyées</div>
                            <div style={{ fontSize:10, color:C.slate }}>Coach · Étudiants</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {absences.filter(a=>a.statut==="transfert_definitif").map(abs=>{
                      const orig  = coachs.find(c=>c.id===abs.coachId);
                      const rempl = coachs.find(c=>c.id===abs.remplacantId);
                      const cls   = classes.filter(c=>abs.classesAffectees.includes(c.id));
                      return (
                        <div key={abs.id} style={{ borderRadius:12, border:"1px solid #ddd6fe", background:"#faf5ff", padding:"14px 18px" }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                            <Badge label="Transfert définitif" color="#7c3aed" bg="#ede9fe"/>
                            <span style={{ fontSize:11, color:C.slate }}>📅 {abs.dateTransfert || abs.dateFin}</span>
                          </div>
                          <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>
                            <span style={{ color:"#dc2626" }}>{orig?.prenom} {orig?.nom}</span>
                            <span style={{ color:C.slate, margin:"0 8px", fontWeight:400 }}>→</span>
                            <span style={{ color:"#15803d" }}>{rempl?.prenom} {rempl?.nom}</span>
                          </div>
                          <div style={{ fontSize:12, color:C.slate }}>{abs.motif} · {cls.length} classe(s) transférée(s)</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ CLASSES ════ */}
          {activeTab==="classes" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20, alignItems:"center" }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:800 }}>👥 Classes</h2>
                <button onClick={()=>setShowWizard(true)} style={btnPrimary}>🧭 Créer via onboarding</button>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#f9fafb", fontSize:11 }}>
                  <th style={th}>Classe</th><th style={th}>Coach</th><th style={th}>Niveau</th><th style={th}>Effectif</th><th style={th}>Progression</th><th style={th}>Créneaux</th><th style={th}>Actions</th>
                </tr></thead>
                <tbody>
                  {classes.map(c=>{
                    const coach  = coachs.find(cv=>cv.id===c.coachId);
                    const rempl  = c.remplacantId ? coachs.find(cv=>cv.id===c.remplacantId) : null;
                    return (
                      <tr key={c.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12, background:rempl?"#fff7ed":"#fff" }}>
                        <td style={td}>
                          <div style={{ fontWeight:700 }}>{c.nom}</div>
                          {rempl && <div style={{ fontSize:10, color:"#dc2626", fontWeight:600, marginTop:2 }}>⚠️ Coach absent</div>}
                        </td>
                        <td style={td}>
                          <div>{coach?`${coach.prenom} ${coach.nom}`:"–"}</div>
                          {rempl && (
                            <div style={{ fontSize:11, color:"#059669", fontWeight:700, marginTop:2 }}>
                              🔄 {rempl.prenom} {rempl.nom} (remplaçant)
                            </div>
                          )}
                        </td>
                        <td style={td}><Badge label={c.niveau} color={C.dark} bg={C.light} /></td>
                        <td style={td}>{c.effectif}</td>
                        <td style={td}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <ProgressBar value={c.progressionMoyenne} />
                            <span style={{ fontSize:11, fontWeight:700, minWidth:32 }}>{c.progressionMoyenne}%</span>
                          </div>
                        </td>
                        <td style={td}>{c.creneaux.map((cr,i)=><div key={i} style={{ fontSize:10, color:C.slate }}>{cr.jour} {cr.heure} · {cr.salle}</div>)}</td>
                        <td style={td}><button onClick={()=>toast.success(`Détails ${c.nom}`)} style={btnIconSm}>📊</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ════ PLANNING ════ */}
          {activeTab==="planning" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:800 }}>📅 Planning des sessions</h2>
                <button onClick={()=>{setModalType("session");setShowAddModal(true);}} style={btnPrimary}>+ Programmer</button>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#f9fafb", fontSize:11 }}>
                  <th style={th}>Titre</th><th style={th}>Coach</th><th style={th}>Date</th><th style={th}>Heure</th><th style={th}>Salle</th><th style={th}>Inscrits</th><th style={th}>Type</th><th style={th}>Actions</th>
                </tr></thead>
                <tbody>
                  {planning.map(s=>{
                    const coach = coachs.find(c=>c.id===s.coachId);
                    const taux = Math.round((s.inscrits/s.placesMax)*100);
                    return (
                      <tr key={s.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                        <td style={td}><div style={{ fontWeight:700 }}>{s.titre}</div></td>
                        <td style={td}>{coach?`${coach.prenom} ${coach.nom}`:"–"}</td>
                        <td style={td}>{formatDate(s.date)}</td>
                        <td style={td}>{s.heure}</td>
                        <td style={td}>{SALLES.find(sl=>sl.id===s.salle)?.nom||s.salle}</td>
                        <td style={td}>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ fontWeight:700 }}>{s.inscrits}/{s.placesMax}</span>
                            <div style={{ width:36, height:4, background:"#e5e7eb", borderRadius:4, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${taux}%`, background:taux>=100?C.red:taux>=80?C.amber:C.green, borderRadius:4 }} />
                            </div>
                          </div>
                        </td>
                        <td style={td}><Badge label={s.type==="online"?"En ligne":"Présentiel"} color={s.type==="online"?"#1d4ed8":"#374151"} bg={s.type==="online"?"#dbeafe":"#f1f5f9"} /></td>
                        <td style={td}><button onClick={()=>toast.success(`Modifier ${s.titre}`)} style={btnIconSm}>✏️</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ════ ÉVALUATIONS ════ */}
          {activeTab==="evaluations" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:800 }}>📝 Évaluations programmées</h2>
                <button onClick={()=>{setModalType("evaluation");setShowAddModal(true);}} style={btnPrimary}>+ Programmer</button>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#f9fafb", fontSize:11 }}>
                  <th style={th}>Titre</th><th style={th}>Classe</th><th style={th}>Date</th><th style={th}>Coeff.</th><th style={th}>Questions</th><th style={th}>Statut</th><th style={th}>Actions</th>
                </tr></thead>
                <tbody>
                  {evaluations.map(e=>(
                    <tr key={e.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                      <td style={td}><div style={{ fontWeight:700 }}>{e.titre}</div></td>
                      <td style={td}>{e.classe}</td>
                      <td style={td}>{formatDate(e.date)}</td>
                      <td style={td}>{e.coefficient}</td>
                      <td style={td}>{e.nbQuestions}</td>
                      <td style={td}><Badge label="Programmé" color="#92400e" bg="#fef3c7" /></td>
                      <td style={td}><button onClick={()=>toast.success(`Gérer ${e.titre}`)} style={btnIconSm}>✏️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ════ MÉDIATHÈQUE ════ */}
          {activeTab==="mediatheque" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:800 }}>📚 Médiathèque</h2>
                <button onClick={()=>{setModalType("ressource");setShowAddModal(true);}} style={btnPrimary}>+ Ajouter</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
                {mediatheque.map(r=>(
                  <div key={r.id} style={{ background:"#f8fafc", borderRadius:12, padding:16, border:"1px solid #e5e7eb", display:"flex", gap:12 }}>
                    <div style={{ fontSize:28, flexShrink:0 }}>{r.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>{r.titre}</div>
                      <div style={{ fontSize:11, color:C.slate, marginBottom:6 }}>{r.type} · {r.classe}</div>
                      <div style={{ fontSize:11, color:C.primary, fontWeight:700 }}>
                        {r.telechargements?`${r.telechargements} téléch.`:r.vues?`${r.vues} vues`:r.tauxCompletion?`${r.tauxCompletion}% complétion`:`${r.ecoutes} écoutes`}
                      </div>
                    </div>
                    <button onClick={()=>toast.success(`Ouvrir ${r.titre}`)} style={btnIconSm}>🔍</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ DEMANDES ════ */}
          {activeTab==="demandes" && (
            <div>
              <h2 style={{ margin:"0 0 20px", fontSize:17, fontWeight:800 }}>📬 Demandes & signalements</h2>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#f9fafb", fontSize:11 }}>
                  <th style={th}>Type</th><th style={th}>Coach</th><th style={th}>Date</th><th style={th}>Motif</th><th style={th}>Statut</th><th style={th}>Action</th>
                </tr></thead>
                <tbody>
                  {demandes.map(d=>{
                    const coach = coachs.find(c=>c.id===d.coachId);
                    return (
                      <tr key={d.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                        <td style={td}>{d.type==="remplacement"?"🔄 Remplacement":"⚠️ Signalement"}</td>
                        <td style={td}>{coach?`${coach.prenom} ${coach.nom}`:"–"}</td>
                        <td style={td}>{formatDate(d.date)}</td>
                        <td style={td}>{d.motif}</td>
                        <td style={td}>
                          <Badge
                            label={d.statut==="en_attente"?"En attente":d.statut==="acceptee"?"Acceptée":d.statut==="refusee"?"Refusée":"Traité"}
                            color={d.statut==="en_attente"?"#92400e":d.statut==="acceptee"?"#15803d":"#991b1b"}
                            bg={d.statut==="en_attente"?"#fef3c7":d.statut==="acceptee"?"#dcfce7":"#fee2e2"}
                          />
                        </td>
                        <td style={td}>
                          {d.statut==="en_attente" && (
                            <div style={{ display:"flex", gap:6 }}>
                              <button onClick={()=>handleDemande(d.id,"accepter")} style={{ ...btnIconSm, background:"#dcfce7", color:"#15803d" }}>✓ Accepter</button>
                              <button onClick={()=>handleDemande(d.id,"refuser")} style={{ ...btnIconSm, background:"#fee2e2", color:"#991b1b" }}>✕ Refuser</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ════ NOTIFICATIONS ════ */}
          {activeTab==="notifications" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20, alignItems:"center" }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:800 }}>🔔 Notifications envoyées aux coachs</h2>
                {nonLuCount>0 && <button onClick={()=>setNotifications(prev=>prev.map(n=>({...n,lu:true})))} style={btnSecondary}>Tout marquer comme lu</button>}
              </div>
              {notifications.length===0 ? (
                <div style={{ textAlign:"center", padding:40, color:C.slate, fontSize:13 }}>Aucune notification envoyée</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {notifications.map(n=>{
                    const coach = coachs.find(c=>c.id===n.coachId);
                    const typeColor = n.type==="nouvel_etudiant"?{c:C.green,bg:"#dcfce7"}:n.type==="nouvelle_session"?{c:C.primary,bg:C.light}:{c:C.purple,bg:"#ede9fe"};
                    return (
                      <div key={n.id} onClick={()=>markNotifRead(n.id)} style={{
                        display:"flex", gap:14, padding:"14px 18px", borderRadius:12,
                        background:n.lu?"#fff":"#f0f9ff", border:`1px solid ${n.lu?"#e5e7eb":C.primary+"40"}`,
                        cursor:"pointer",
                      }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", background:typeColor.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                          {n.type==="nouvel_etudiant"?"👤":n.type==="nouvelle_session"?"📅":"🏫"}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
                            <Badge label={n.type.replace(/_/g," ")} color={typeColor.c} bg={typeColor.bg} />
                            {!n.lu && <Badge label="Non lu" color={C.primary} bg={C.light} />}
                            <span style={{ fontSize:11, color:C.slate }}>→ {coach?`${coach.prenom} ${coach.nom}`:"Coach"}</span>
                            <span style={{ fontSize:10, color:"#9ca3af", marginLeft:"auto" }}>{n.date}</span>
                          </div>
                          <div style={{ fontSize:12, color:"#374151" }}>{n.message}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ MESSAGES ════ */}
          {activeTab === "messages" && <MessagerieTab accentColor={C.primary} />}

          {activeTab === "presences" && (
  <div>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
      <div>
        <h2 style={{ margin:0, fontSize:17, fontWeight:800 }}>📊 Assiduité des apprenants</h2>
        <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate }}>Suivi des présences, absences et retards par classe.</p>
      </div>
      <div>
        <select value={filtreClassePres} onChange={e=>setFiltreClassePres(e.target.value)} style={inputSt}>
          <option value="all">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>
    </div>

    {/* Cartes récapitulatives globales */}
    {(() => {
      let totalSeances = 0, totalPresentes = 0, totalAbsences = 0, totalRetards = 0;
      Object.values(presences).forEach(classe => {
        classe.forEach(a => {
          totalSeances += a.totalSeances;
          totalPresentes += a.presentes;
          totalAbsences += a.absences;
          totalRetards += a.retards;
        });
      });
      const tauxGlobal = totalSeances ? Math.round((totalPresentes / totalSeances) * 100) : 0;
      return (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
          <StatCard label="Taux d'assiduité global" value={`${tauxGlobal}%`} color={tauxGlobal>=85?C.green:tauxGlobal>=70?C.amber:C.red} icon="📈" sub={`${totalPresentes} / ${totalSeances} présences`} />
          <StatCard label="Absences totales" value={totalAbsences} color={C.red} icon="❌" sub={`dont ${totalAbsences} non justifiées`} />
          <StatCard label="Retards" value={totalRetards} color={C.amber} icon="⏰" />
          <StatCard label="Taux de présence moyen par classe" value={`${Math.round(Object.values(presences).reduce((acc,cl)=>acc+cl.reduce((s,a)=>s+(a.presentes/a.totalSeances)*100,0)/cl.length,0)/Object.keys(presences).length)}%`} color={C.purple} icon="📊" />
        </div>
      );
    })()}

    {/* Graphique d'évolution (simplifié) */}
    <div style={{ background:"#f8fafc", borderRadius:12, padding:16, marginBottom:24 }}>
      <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📈 Évolution de l'assiduité (4 dernières semaines)</div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120 }}>
        {ASSIDUITE_EVOLUTION.map((s, i) => (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ height:`${s.taux}%`, minHeight:4, width:"100%", background:C.primary, borderRadius:4, transition:"height .3s" }} />
            <div style={{ fontSize:10, color:C.slate }}>{s.semaine}</div>
            <div style={{ fontSize:11, fontWeight:700 }}>{s.taux}%</div>
          </div>
        ))}
      </div>
    </div>

    {/* Tableau des apprenants par classe */}
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"#f9fafb", fontSize:11 }}>
            <th style={th}>Apprenant</th>
            <th style={th}>Classe</th>
            <th style={th}>Présences</th>
            <th style={th}>Absences</th>
            <th style={th}>Retards</th>
            <th style={th}>Taux assiduité</th>
            <th style={th}>Statut</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(presences)
            .filter(([classeId]) => filtreClassePres === "all" || classeId == filtreClassePres)
            .flatMap(([classeId, apprenants]) => {
              const classe = classes.find(c => c.id == classeId);
              return apprenants.map(a => {
                const taux = Math.round((a.presentes / a.totalSeances) * 100);
                let statusColor = "", statusLabel = "";
                if (taux >= 85) { statusColor = C.green; statusLabel = "Excellent"; }
                else if (taux >= 70) { statusColor = C.amber; statusLabel = "Correct"; }
                else { statusColor = C.red; statusLabel = "Attention"; }
                return (
                  <tr key={a.apprenantId} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                    <td style={td}><div style={{ fontWeight:700 }}>{a.nom}</div></td>
                    <td style={td}>{classe?.nom || "—"}</td>
                    <td style={td}>{a.presentes} / {a.totalSeances}</td>
                    <td style={td}>{a.absences}</td>
                    <td style={td}>{a.retards}</td>
                    <td style={td}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:50, height:5, background:"#e5e7eb", borderRadius:5, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${taux}%`, background:taux>=85?C.green:taux>=70?C.amber:C.red, borderRadius:5 }} />
                        </div>
                        <span style={{ fontWeight:700 }}>{taux}%</span>
                      </div>
                    </td>
                    <td style={td}><Badge label={statusLabel} color={statusColor} bg={statusColor+"20"} /></td>
                    <td style={td}>
                      <button onClick={()=>toast.success(`Envoyer un rappel à ${a.nom}`)} style={btnIconSm}>📧 Rappel</button>
                    </td>
                  </tr>
                );
              });
            })}
        </tbody>
      </table>
    </div>
  </div>
)}

        </div>
      </div>

      {/* ════ MODALES ════ */}

      {/* Wizard Onboarding */}
      {showWizard && (
        <Modal title="🧭 Onboarding — Créer une nouvelle classe" subtitle="Assistant pas-à-pas · Vérification des disponibilités · Notification automatique" onClose={()=>setShowWizard(false)} wide>
          <OnboardingWizard
            coachs={coachs}
            apprenants={appAttente}
            salleOccupees={salleOccupees}
            onConfirm={handleConfirmWizard}
            onCancel={()=>setShowWizard(false)}
          />
        </Modal>
      )}

      {/* Affectation apprenant */}
      {showAffectation && affectationTarget && (
        <Modal title="→ Affecter un apprenant" subtitle="Vérifiez la disponibilité du coach et de la salle avant d'affecter." onClose={()=>{setShowAffectation(false);setAffectationTarget(null);}} wide>
          <AffectationModal
            apprenant={affectationTarget}
            coachs={coachs}
            classes={classes}
            salleOccupees={salleOccupees}
            onConfirm={handleConfirmAffectation}
            onClose={()=>{setShowAffectation(false);setAffectationTarget(null);}}
          />
        </Modal>
      )}

      {/* Modale déclarer absence / suspension */}
      {showAbsenceModal && (
        <Modal title="🚨 Déclarer une absence ou suspension" onClose={()=>setShowAbsenceModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={labelSt}>Coach concerné *</label>
              <select style={inputSt} value={absenceForm.coachId||""} onChange={e=>setAbsenceForm(f=>({...f,coachId:Number(e.target.value)}))}>
                <option value="">— Sélectionner un coach —</option>
                {coachs.filter(c=>c.statut==="actif").map(c=>(
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom} — {c.specialite}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelSt}>Type *</label>
              <div style={{ display:"flex", gap:10 }}>
                {[["absence","🤒 Absence (maladie, perso…)"],["suspension","⛔ Suspension disciplinaire"]].map(([v,lb])=>(
                  <button key={v} onClick={()=>setAbsenceForm(f=>({...f,type:v}))} style={{
                    flex:1, padding:"10px 8px", borderRadius:8, border:`2px solid ${absenceForm.type===v?(v==="suspension"?"#dc2626":C.amber):"#e5e7eb"}`,
                    background:absenceForm.type===v?(v==="suspension"?"#fef2f2":"#fffbeb"):"#fff",
                    cursor:"pointer", fontSize:12, fontWeight:absenceForm.type===v?700:400,
                  }}>{lb}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelSt}>Motif * {absenceForm.type==="suspension"&&<span style={{ color:"#dc2626" }}>(sera consigné dans l'historique)</span>}</label>
              <input style={inputSt} value={absenceForm.motif} onChange={e=>setAbsenceForm(f=>({...f,motif:e.target.value}))}
                placeholder={absenceForm.type==="suspension"?"ex: Non-respect du règlement intérieur":"ex: Arrêt maladie, urgence familiale…"}/>
            </div>
            <div>
              <label style={labelSt}>Détails (optionnel)</label>
              <input style={inputSt} value={absenceForm.details} onChange={e=>setAbsenceForm(f=>({...f,details:e.target.value}))} placeholder="Informations complémentaires…"/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={labelSt}>Date de début *</label>
                <input type="date" style={inputSt} value={absenceForm.dateDebut} onChange={e=>setAbsenceForm(f=>({...f,dateDebut:e.target.value}))}/>
              </div>
              <div>
                <label style={labelSt}>Date de fin prévue *</label>
                <input type="date" style={inputSt} value={absenceForm.dateFin} onChange={e=>setAbsenceForm(f=>({...f,dateFin:e.target.value}))}/>
              </div>
            </div>
            {absenceForm.coachId && (
              <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#0c4a6e" }}>
                ℹ️ <strong>{classes.filter(c=>c.coachId===absenceForm.coachId).length} classe(s)</strong> seront marquées sans coach actif.
                Vous pourrez assigner un remplaçant à l'étape suivante.
              </div>
            )}
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
              <button onClick={()=>setShowAbsenceModal(false)} style={btnSecondary}>Annuler</button>
              <button onClick={confirmerAbsence} style={{ ...btnPrimary, background:"#dc2626" }}>Confirmer →</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modale assigner remplaçant */}
      {showRemplacantModal && remplacantTarget && (()=>{
        const orig = coachs.find(c=>c.id===remplacantTarget.coachId);
        const candidats = coachs.filter(c =>
          c.id !== remplacantTarget.coachId &&
          c.statut === "actif" &&
          !absencesActives.find(a => a.coachId === c.id)
        );
        return (
          <Modal title="🔄 Choisir un remplaçant" subtitle={`Remplaçant pour ${orig?.prenom} ${orig?.nom} — ${remplacantTarget.motif}`} onClose={()=>{setShowRemplacantModal(false);setRemplacantTarget(null);}}>
            <div style={{ marginBottom:12, fontSize:12, color:C.slate }}>
              Seuls les coachs <strong>actifs</strong> et <strong>sans absence en cours</strong> sont affichés.
              Le remplaçant verra les classes dans son espace avec un badge "🔄 Remplacement" et recevra une notification.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {candidats.length === 0 ? (
                <div style={{ textAlign:"center", padding:24, color:C.slate, background:"#f8fafc", borderRadius:10 }}>
                  Aucun coach disponible pour le moment.
                </div>
              ) : candidats.map(c => {
                const isSelected = remplacantTarget.remplacantId === c.id;
                const charge = Math.round((c.heuresEffectuees/c.heuresPlanifiees)*100);
                return (
                  <div key={c.id} onClick={()=>setRemplacantTarget(t=>({...t,remplacantId:c.id}))}
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", borderRadius:10,
                      border:`2px solid ${isSelected?C.green:"#e5e7eb"}`, background:isSelected?"#f0fdf4":"#fff", cursor:"pointer" }}>
                    <div style={{ width:42,height:42,borderRadius:"50%",background:isSelected?"#dcfce7":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,flexShrink:0 }}>
                      {c.prenom[0]}{c.nom[0]}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{c.prenom} {c.nom}</div>
                      <div style={{ fontSize:11, color:C.slate }}>{c.specialite}</div>
                      <div style={{ fontSize:11, color:charge>85?C.red:C.slate, marginTop:2 }}>Charge : {charge}% · ⭐ {c.evaluationMoyenne}/5</div>
                    </div>
                    {isSelected && <span style={{ fontSize:20, color:C.green }}>✓</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
              <button onClick={()=>{setShowRemplacantModal(false);setRemplacantTarget(null);}} style={btnSecondary}>Annuler</button>
              <button
                disabled={!remplacantTarget.remplacantId}
                onClick={()=>assignerRemplacant(remplacantTarget.id, remplacantTarget.remplacantId)}
                style={{ ...btnPrimary, background:C.green, opacity:remplacantTarget.remplacantId?1:0.45 }}>
                ✅ Confirmer le remplacement
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* Modale confirmation transfert définitif */}
      {showTransfertConfirm && transfertTarget && (()=>{
        const { absence, remplacant } = transfertTarget;
        const orig = coachs.find(c=>c.id===absence.coachId);
        const classesConcernees = classes.filter(c=>absence.classesAffectees.includes(c.id));
        const totalEtudiants = classesConcernees.reduce((s,cl)=>s+cl.effectif,0);
        const heuresSup = classesConcernees.reduce((s,cl)=>s+(cl.effectif*2),0);
        return (
          <Modal title="🏛️ Confirmer le transfert définitif" onClose={()=>{setShowTransfertConfirm(false);setTransfertTarget(null);}}>
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"12px 16px", marginBottom:18, fontSize:12, color:"#991b1b" }}>
              ⚠️ <strong>Action irréversible.</strong> Le coach original perdra définitivement l'accès à ces classes. Assurez-vous d'avoir la validation de la direction avant de confirmer.
            </div>

            {/* Résumé du transfert */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:10, alignItems:"center", marginBottom:18 }}>
              <div style={{ background:"#fee2e2", borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#991b1b", fontWeight:700, marginBottom:4 }}>COACH SORTANT</div>
                <div style={{ fontWeight:800, fontSize:14, color:"#dc2626" }}>{orig?.prenom} {orig?.nom}</div>
                <div style={{ fontSize:11, color:"#991b1b", marginTop:4 }}>Perd l'accès aux classes</div>
                <div style={{ fontSize:10, color:"#b91c1c", marginTop:2 }}>Heures retirées de sa paie</div>
              </div>
              <div style={{ fontSize:24, textAlign:"center", color:"#7c3aed" }}>→</div>
              <div style={{ background:"#dcfce7", borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#15803d", fontWeight:700, marginBottom:4 }}>NOUVEAU COACH OFFICIEL</div>
                <div style={{ fontWeight:800, fontSize:14, color:"#15803d" }}>{remplacant?.prenom} {remplacant?.nom}</div>
                <div style={{ fontSize:11, color:"#15803d", marginTop:4 }}>Coach permanent des classes</div>
                <div style={{ fontSize:10, color:"#166534", marginTop:2 }}>+{heuresSup}h ajoutées à sa paie</div>
              </div>
            </div>

            {/* Classes transférées */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>Classes transférées ({classesConcernees.length})</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {classesConcernees.map(cl=>(
                  <div key={cl.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:8, background:"#f8fafc", border:"1px solid #e5e7eb", fontSize:12 }}>
                    <span style={{ fontWeight:600 }}>{cl.nom}</span>
                    <span style={{ color:C.slate }}>{cl.effectif} apprenants · {cl.creneaux.length} créneau(x)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ce qui sera déclenché */}
            <div style={{ background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:10, padding:"12px 16px", marginBottom:18 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#7c3aed", marginBottom:8 }}>Ce qui sera déclenché automatiquement :</div>
              {[
                `📋 coachId des ${classesConcernees.length} classe(s) changé vers ${remplacant?.prenom} ${remplacant?.nom}`,
                `💰 +${heuresSup}h planifiées ajoutées au compteur RH de ${remplacant?.prenom} ${remplacant?.nom}`,
                `🔔 Notification d'affectation définitive envoyée à ${remplacant?.prenom} ${remplacant?.nom}`,
                `📢 Message automatique aux ${totalEtudiants} étudiant(s) : "Votre nouveau coach est ${remplacant?.prenom} ${remplacant?.nom}"`,
                `🏛️ Entrée créée dans le registre RH pour la paie`,
              ].map((item,i)=>(
                <div key={i} style={{ fontSize:11, color:"#4c1d95", padding:"3px 0", borderBottom:i<4?"1px solid #ede9fe":"none" }}>{item}</div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>{setShowTransfertConfirm(false);setTransfertTarget(null);}} style={btnSecondary}>Annuler</button>
              <button onClick={confirmerTransfertDefinitif} style={{ ...btnPrimary, background:"#7c3aed" }}>
                🏛️ Confirmer le transfert définitif
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* Modal générique */}
      {/* ══ MODAL CRÉATION / ÉDITION COACH ══ */}
      {showCoachModal && (
        <CoachFormModal
          initialData={editingCoach}
          onClose={() => { setShowCoachModal(false); setEditingCoach(null); }}
          onSave={async (formData) => {
            try {
              const method = formData.id ? "PATCH" : "POST";
              const url    = formData.id
                ? `${API_URL}/api/coachs/${formData.id}`
                : `${API_URL}/api/coachs`;
              const res = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(formData) });
              const d = await res.json();
              if (!res.ok) throw new Error(d.error || "Erreur");
              if (formData.id) {
                toast.success("Coach modifié ✓");
              } else {
                toast.success("Coach créé ✓ — accès générés !");
                if (d.acces) setCoachAcces(d.acces);
              }
              setShowCoachModal(false); setEditingCoach(null);
              fetchCoachs();
            } catch (e) { toast.error(e.message); }
          }}
        />
      )}

      {/* ══ MODAL ACCÈS COACH ══ */}
      {coachAcces && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:20, padding:36, width:460, boxShadow:"0 24px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:"#0f172a" }}>Coach créé avec succès !</h2>
              <p style={{ margin:"6px 0 0", fontSize:13, color:"#9ca3af" }}>Les accès ont été générés et envoyés automatiquement.</p>
            </div>

            <div style={{ background:"#f0f9ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"20px 24px", marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.primary, textTransform:"uppercase", letterSpacing:".08em", marginBottom:14 }}>Identifiants générés</div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:2 }}>Email</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", fontFamily:"monospace" }}>{coachAcces.email}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:2 }}>Mot de passe temporaire</div>
                <div style={{ fontSize:20, fontWeight:900, color:C.primary, fontFamily:"monospace", letterSpacing:3 }}>{coachAcces.mdp_temp}</div>
              </div>
            </div>

            <div style={{ padding:"12px 16px", borderRadius:10, background:coachAcces.email_sent?"#f0fdf4":"#fef3c7", border:`1px solid ${coachAcces.email_sent?"#bbf7d0":"#fde68a"}`, marginBottom:20, display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:18 }}>{coachAcces.email_sent ? "✅" : "⚠️"}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:coachAcces.email_sent?"#166534":"#92400e" }}>
                  {coachAcces.email_sent ? "Email envoyé avec succès" : "Email non envoyé"}
                </div>
                <div style={{ fontSize:11, color:coachAcces.email_sent?"#15803d":"#b45309" }}>
                  {coachAcces.email_sent
                    ? `Un email de bienvenue a été envoyé à ${coachAcces.email}`
                    : "Veuillez transmettre manuellement ces accès au coach. Vérifiez la config SMTP."}
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button
                onClick={() => { navigator.clipboard.writeText(`Email: ${coachAcces.email}\nMot de passe: ${coachAcces.mdp_temp}`); toast.success("Copié !"); }}
                style={{ flex:1, padding:"11px", background:"#e0f2fe", color:C.primary, border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                📋 Copier les accès
              </button>
              <button onClick={() => setCoachAcces(null)} style={{ flex:1, padding:"11px", background:C.primary, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                ✓ Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL PROFIL COACH ══ */}
      {showCoachProfile && profileCoach && (
        <CoachProfileModal
          coach={profileCoach}
          onClose={() => { setShowCoachProfile(false); setProfileCoach(null); }}
          onEdit={() => { setEditingCoach(profileCoach); setShowCoachProfile(false); setShowCoachModal(true); }}
          onRenvoyerAcces={async () => {
            try {
              const r = await fetch(`${API_URL}/api/coachs/${profileCoach.id}/renvoyer-acces`, { method:"POST", headers: authHdrs() });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error || "Erreur");
              toast.success(`📧 Accès renvoyé à ${d.email}`);
            } catch (e) { toast.error(e.message); }
          }}
          onDelete={async () => {
            if (!window.confirm("Supprimer ce coach ?")) return;
            try {
              await fetch(`${API_URL}/api/coachs/${profileCoach.id}`, { method:"DELETE", headers: authHdrs() });
              toast.success("Coach supprimé");
              setShowCoachProfile(false); setProfileCoach(null);
              fetchCoachs();
            } catch { toast.error("Erreur suppression"); }
          }}
        />
      )}

      {showAddModal && (
        <Modal title={`Ajouter : ${modalType}`} onClose={()=>setShowAddModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {modalType === "ressource" ? (
              <>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Titre *</label>
                  <input placeholder="ex: Guide de grammaire B2" value={ressourceForm.titre} onChange={e=>setRessourceForm(f=>({...f,titre:e.target.value}))} style={inputSt} />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Type</label>
                  <select value={ressourceForm.type} onChange={e=>setRessourceForm(f=>({...f,type:e.target.value,fileUrl:"",fileNom:""}))} style={inputSt}>
                    <option value="pdf">📄 PDF / Document</option>
                    <option value="video">🎬 Vidéo</option>
                    <option value="audio">🎧 Audio</option>
                    <option value="exercice">✏️ Exercice</option>
                  </select>
                </div>
                <CloudinaryUpload
                  type={ressourceForm.type === "pdf" || ressourceForm.type === "exercice" ? "document" : ressourceForm.type}
                  label={`Uploader ${ressourceForm.type === "pdf" ? "un document" : ressourceForm.type === "video" ? "une vidéo" : ressourceForm.type === "audio" ? "un audio" : "un fichier"}`}
                  onSuccess={(file) => {
                    setRessourceForm(f => ({ ...f, fileUrl: file.url, fileNom: file.original_name, taille: file.size ? `${(file.size/1024/1024).toFixed(1)} MB` : "" }));
                    toast.success("Fichier uploadé ✓");
                  }}
                  onError={(msg) => toast.error(msg)}
                />
                {ressourceForm.fileNom && (
                  <div style={{ fontSize:12, color:"#059669", padding:"6px 10px", background:"#f0fdf4", borderRadius:6 }}>
                    ✓ {ressourceForm.fileNom} {ressourceForm.taille && `· ${ressourceForm.taille}`}
                  </div>
                )}
              </>
            ) : (
              <>
                <input placeholder="Nom" style={inputSt} />
                <input placeholder="Informations complémentaires" style={inputSt} />
              </>
            )}
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
              <button onClick={()=>{ setShowAddModal(false); setRessourceForm({ titre:"", type:"pdf", fileUrl:"", fileNom:"", taille:"" }); }} style={btnSecondary}>Annuler</button>
              <button onClick={()=>{
                if (modalType === "ressource") {
                  if (!ressourceForm.titre) { toast.error("Titre requis"); return; }
                  setMediatheque(prev => [...prev, { id: Date.now(), titre: ressourceForm.titre, type: ressourceForm.type, url: ressourceForm.fileUrl, taille: ressourceForm.taille, date: new Date().toISOString().split("T")[0] }]);
                  setRessourceForm({ titre:"", type:"pdf", fileUrl:"", fileNom:"", taille:"" });
                }
                toast.success(`${modalType} ajouté ✓`);
                setShowAddModal(false);
              }} style={btnPrimary}>Ajouter</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COACH FORM MODAL
═══════════════════════════════════════════════════════ */
const GRADES        = ["Coach Junior","Coach","Coach Senior","Coach Expert","Master Coach","Formateur certifié"];
const CONTRATS      = ["CDI","CDD","Freelance","Vacataire","Stage"];
const NIVEAUX_CEFR  = ["A1","A2","B1","B2","C1","C2"];
const CERTIFS_DISPO = ["CELTA","DELTA","TESOL","TEFL","IELTS Examiner","TOEIC Examiner","Cambridge Assessor","Autre"];

function CoachFormModal({ initialData, onClose, onSave }) {
  const isEdit = !!initialData;
  const empty = {
    photo_url:"", nom:"", prenom:"", genre:"", date_naissance:"", nationalite:"Ivoirienne",
    email:"", telephone:"", telephone2:"", adresse:"", ville:"Abidjan",
    grade:"Coach", specialites:[], niveaux_enseignes:[], experience_annees:0,
    date_embauche:"", type_contrat:"Freelance", taux_horaire:"",
    certifications:[], langues:["Français","Anglais"],
    bio:"", linkedin:"", cv_url:"", statut:"actif",
  };
  const [form, setForm] = useState(initialData ? { ...empty, ...initialData } : empty);
  const [tab, setTab]   = useState("identite");
  const [saving, setSaving] = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (k, v) => setForm(p => ({
    ...p, [k]: p[k].includes(v) ? p[k].filter(x=>x!==v) : [...p[k], v]
  }));

  const TABS_FORM = [
    { id:"identite",  label:"👤 Identité" },
    { id:"contact",   label:"📞 Contact" },
    { id:"pro",       label:"🎓 Profil pro" },
    { id:"contrat",   label:"📋 Contrat" },
    { id:"docs",      label:"📎 Documents" },
  ];

  const inputS = { width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box", outline:"none" };
  const labelS = { display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:4 };
  const row2   = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 };

  const handleSave = async () => {
    if (!form.nom || !form.prenom || !form.email) { return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:620, maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#0891b2)", borderRadius:"18px 18px 0 0", padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", fontWeight:600 }}>{isEdit ? "Modifier le profil" : "Nouveau profil coach"}</div>
            <div style={{ fontWeight:800, fontSize:16, color:"#fff" }}>{isEdit ? `${form.prenom} ${form.nom}` : "Créer un coach"}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.15)", border:"none", color:"#fff", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontWeight:700 }}>✕</button>
        </div>

        {/* Sous-tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid #e5e7eb", background:"#fafafa", overflowX:"auto" }}>
          {TABS_FORM.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"10px 16px", border:"none", background:"transparent", cursor:"pointer",
              fontWeight: tab===t.id ? 700 : 500, fontSize:12, whiteSpace:"nowrap",
              color: tab===t.id ? "#0891b2" : "#6b7280",
              borderBottom: tab===t.id ? "2px solid #0891b2" : "2px solid transparent",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Corps scrollable */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

          {/* ─ Identité ─ */}
          {tab === "identite" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Photo */}
              <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
                <AvatarUpload
                  currentUrl={form.photo_url}
                  nom={form.prenom || "Coach"}
                  size={72}
                  onSuccess={file => f("photo_url", file.url)}
                  onError={msg => {}}
                />
              </div>
              <div style={row2}>
                <div><label style={labelS}>Prénom *</label><input style={inputS} value={form.prenom} onChange={e=>f("prenom",e.target.value)} placeholder="Prénom" /></div>
                <div><label style={labelS}>Nom *</label><input style={inputS} value={form.nom} onChange={e=>f("nom",e.target.value)} placeholder="Nom de famille" /></div>
              </div>
              <div style={row2}>
                <div><label style={labelS}>Genre</label>
                  <select style={inputS} value={form.genre} onChange={e=>f("genre",e.target.value)}>
                    <option value="">– Choisir –</option>
                    <option>Homme</option><option>Femme</option><option>Autre</option>
                  </select>
                </div>
                <div><label style={labelS}>Date de naissance</label><input type="date" style={inputS} value={form.date_naissance} onChange={e=>f("date_naissance",e.target.value)} /></div>
              </div>
              <div style={row2}>
                <div><label style={labelS}>Nationalité</label><input style={inputS} value={form.nationalite} onChange={e=>f("nationalite",e.target.value)} /></div>
                <div><label style={labelS}>Ville</label><input style={inputS} value={form.ville} onChange={e=>f("ville",e.target.value)} /></div>
              </div>
              <div><label style={labelS}>Bio / Présentation</label>
                <textarea style={{ ...inputS, height:80, resize:"vertical" }} value={form.bio} onChange={e=>f("bio",e.target.value)} placeholder="Décrivez le parcours et les points forts de ce coach…" />
              </div>
            </div>
          )}

          {/* ─ Contact ─ */}
          {tab === "contact" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label style={labelS}>Email professionnel *</label><input type="email" style={inputS} value={form.email} onChange={e=>f("email",e.target.value)} placeholder="coach@betlanguages.com" /></div>
              <div style={row2}>
                <div><label style={labelS}>Téléphone principal</label><input style={inputS} value={form.telephone} onChange={e=>f("telephone",e.target.value)} placeholder="+225 07 00 00 00 00" /></div>
                <div><label style={labelS}>Téléphone secondaire</label><input style={inputS} value={form.telephone2} onChange={e=>f("telephone2",e.target.value)} placeholder="+225 05 00 00 00 00" /></div>
              </div>
              <div><label style={labelS}>Adresse complète</label><input style={inputS} value={form.adresse} onChange={e=>f("adresse",e.target.value)} placeholder="Rue, Quartier, Commune" /></div>
              <div><label style={labelS}>LinkedIn</label><input style={inputS} value={form.linkedin} onChange={e=>f("linkedin",e.target.value)} placeholder="https://linkedin.com/in/…" /></div>
            </div>
          )}

          {/* ─ Profil pro ─ */}
          {tab === "pro" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={row2}>
                <div><label style={labelS}>Grade</label>
                  <select style={inputS} value={form.grade} onChange={e=>f("grade",e.target.value)}>
                    {GRADES.map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
                <div><label style={labelS}>Années d'expérience</label><input type="number" style={inputS} value={form.experience_annees} onChange={e=>f("experience_annees",Number(e.target.value))} min={0} /></div>
              </div>

              <div><label style={labelS}>Niveaux enseignés</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {NIVEAUX_CEFR.map(n => (
                    <button key={n} type="button" onClick={()=>toggleArr("niveaux_enseignes",n)} style={{
                      padding:"6px 14px", borderRadius:99, border:"1.5px solid", cursor:"pointer", fontWeight:700, fontSize:12,
                      background: form.niveaux_enseignes.includes(n) ? "#0891b2" : "#f8fafc",
                      color:      form.niveaux_enseignes.includes(n) ? "#fff"    : "#6b7280",
                      borderColor:form.niveaux_enseignes.includes(n) ? "#0891b2" : "#e2e8f0",
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              <div><label style={labelS}>Spécialités (séparées par Entrée)</label>
                <input style={inputS} placeholder="ex: TOEIC, Business English, Grammaire…"
                  value={form.specialites.join(", ")}
                  onChange={e=>f("specialites", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} />
              </div>

              <div><label style={labelS}>Langues parlées</label>
                <input style={inputS} placeholder="ex: Français, Anglais, Espagnol"
                  value={form.langues.join(", ")}
                  onChange={e=>f("langues", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} />
              </div>

              <div><label style={labelS}>Certifications obtenues</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                  {CERTIFS_DISPO.map(cert => (
                    <button key={cert} type="button" onClick={()=>{
                      const has = form.certifications.find(c=>c.nom===cert);
                      if (has) f("certifications", form.certifications.filter(c=>c.nom!==cert));
                      else f("certifications", [...form.certifications, { nom:cert, annee:"", organisme:"" }]);
                    }} style={{
                      padding:"5px 12px", borderRadius:8, border:"1.5px solid", cursor:"pointer", fontSize:11, fontWeight:700,
                      background: form.certifications.find(c=>c.nom===cert) ? "#7c3aed" : "#f8fafc",
                      color:      form.certifications.find(c=>c.nom===cert) ? "#fff"    : "#6b7280",
                      borderColor:form.certifications.find(c=>c.nom===cert) ? "#7c3aed" : "#e2e8f0",
                    }}>{cert}</button>
                  ))}
                </div>
                {form.certifications.map((cert, i) => (
                  <div key={i} style={{ ...row2, marginBottom:6 }}>
                    <input style={{ ...inputS, fontSize:12 }} value={cert.annee} onChange={e=>{ const arr=[...form.certifications]; arr[i]={...arr[i],annee:e.target.value}; f("certifications",arr); }} placeholder="Année (ex: 2022)" />
                    <input style={{ ...inputS, fontSize:12 }} value={cert.organisme} onChange={e=>{ const arr=[...form.certifications]; arr[i]={...arr[i],organisme:e.target.value}; f("certifications",arr); }} placeholder="Organisme" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─ Contrat ─ */}
          {tab === "contrat" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={row2}>
                <div><label style={labelS}>Type de contrat</label>
                  <select style={inputS} value={form.type_contrat} onChange={e=>f("type_contrat",e.target.value)}>
                    {CONTRATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={labelS}>Date d'embauche</label><input type="date" style={inputS} value={form.date_embauche} onChange={e=>f("date_embauche",e.target.value)} /></div>
              </div>
              <div style={row2}>
                <div><label style={labelS}>Taux horaire (FCFA)</label><input type="number" style={inputS} value={form.taux_horaire} onChange={e=>f("taux_horaire",e.target.value)} placeholder="ex: 5000" /></div>
                <div><label style={labelS}>Statut</label>
                  <select style={inputS} value={form.statut} onChange={e=>f("statut",e.target.value)}>
                    <option value="actif">Actif</option>
                    <option value="conge">En congé</option>
                    <option value="suspendu">Suspendu</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ─ Documents ─ */}
          {tab === "docs" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={labelS}>CV / Lettre de motivation</label>
                <CloudinaryUpload
                  type="document"
                  label={form.cv_url ? "✓ CV uploadé — Remplacer" : "📄 Uploader le CV"}
                  onSuccess={file => { f("cv_url", file.url); }}
                  onError={() => {}}
                />
                {form.cv_url && (
                  <div style={{ marginTop:8, padding:"8px 12px", background:"#f0fdf4", borderRadius:8, border:"1px solid #86efac", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"#166534", fontWeight:600 }}>✓ CV disponible</span>
                    <a href={form.cv_url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"#0891b2", fontWeight:600 }}>Voir →</a>
                  </div>
                )}
              </div>
              <div style={{ padding:"14px 16px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0", fontSize:12, color:"#64748b" }}>
                💡 D'autres documents (diplômes, certifications scannées) peuvent être ajoutés depuis le profil détail du coach.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop:"1px solid #e5e7eb", padding:"14px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fafafa", borderRadius:"0 0 18px 18px" }}>
          <span style={{ fontSize:11, color:"#9ca3af" }}>* Champs obligatoires</span>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={{ padding:"9px 18px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer" }}>Annuler</button>
            <button onClick={handleSave} disabled={saving || !form.nom || !form.prenom || !form.email}
              style={{ padding:"9px 20px", background: saving||!form.nom||!form.prenom||!form.email ? "#94a3b8" : "#0891b2", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Enregistrement…" : isEdit ? "✓ Mettre à jour" : "✓ Créer le profil"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COACH PROFILE MODAL
═══════════════════════════════════════════════════════ */
function CoachProfileModal({ coach: c, onClose, onEdit, onDelete, onRenvoyerAcces }) {
  const initiales = ((c.prenom?.[0]||"")+(c.nom?.[0]||"")).toUpperCase();
  const statutColor = c.statut==="actif" ? { bg:"#dcfce7",color:"#15803d" } : c.statut==="suspendu" ? { bg:"#fee2e2",color:"#991b1b" } : { bg:"#fef3c7",color:"#92400e" };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:800, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".08em", marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
  const Row = ({ label, value }) => value ? (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
      <span style={{ color:"#64748b", fontWeight:500 }}>{label}</span>
      <span style={{ color:"#0f172a", fontWeight:600, textAlign:"right", maxWidth:"60%" }}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:560, maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", overflow:"hidden" }}>

        {/* Hero */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#0891b2)", padding:"28px 24px 60px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,.15)", border:"none", color:"#fff", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontWeight:700 }}>✕</button>
          <span style={{ padding:"3px 12px", borderRadius:99, fontSize:10, fontWeight:800, background:statutColor.bg, color:statutColor.color }}>{c.statut}</span>
          <div style={{ marginTop:10, fontWeight:800, fontSize:20, color:"#fff" }}>{c.prenom} {c.nom}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.75)", marginTop:3 }}>{c.grade} · {c.type_contrat}</div>
          {(c.specialites||[]).length > 0 && <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", marginTop:4 }}>{c.specialites.join(" · ")}</div>}
        </div>

        {/* Avatar centré */}
        <div style={{ display:"flex", justifyContent:"center", marginTop:-40, position:"relative", zIndex:1 }}>
          {c.photo_url
            ? <img src={c.photo_url} alt={c.prenom} style={{ width:80, height:80, borderRadius:"50%", border:"4px solid #fff", objectFit:"cover", boxShadow:"0 4px 12px rgba(0,0,0,0.15)" }} />
            : <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#0891b2,#0e7490)", border:"4px solid #fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:26, color:"#fff", boxShadow:"0 4px 12px rgba(0,0,0,0.15)" }}>{initiales}</div>
          }
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>

          {/* KPIs */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20, marginTop:8 }}>
            {[
              { label:"Évaluation", value: c.evaluation_moyenne > 0 ? `⭐ ${c.evaluation_moyenne}/5` : "–", color:"#f59e0b" },
              { label:"Expérience", value:`${c.experience_annees||0} ans`, color:"#0891b2" },
              { label:"Heures eff.", value:`${c.heures_effectuees||0}h`, color:"#059669" },
            ].map(k=>(
              <div key={k.label} style={{ background:"#f8fafc", borderRadius:10, padding:"12px", textAlign:"center", border:"1px solid #e5e7eb" }}>
                <div style={{ fontSize:16, fontWeight:800, color:k.color }}>{k.value}</div>
                <div style={{ fontSize:10, color:"#9ca3af", marginTop:3 }}>{k.label}</div>
              </div>
            ))}
          </div>

          <Section title="Contact">
            <Row label="Email"      value={c.email} />
            <Row label="Téléphone"  value={c.telephone} />
            <Row label="Tél. 2"     value={c.telephone2} />
            <Row label="Adresse"    value={c.adresse} />
            <Row label="Ville"      value={c.ville} />
          </Section>

          <Section title="Informations personnelles">
            <Row label="Genre"        value={c.genre} />
            <Row label="Naissance"    value={c.date_naissance ? new Date(c.date_naissance).toLocaleDateString("fr-FR") : null} />
            <Row label="Nationalité"  value={c.nationalite} />
            <Row label="Langues"      value={(c.langues||[]).join(", ")} />
          </Section>

          <Section title="Profil professionnel">
            <Row label="Grade"         value={c.grade} />
            <Row label="Contrat"       value={c.type_contrat} />
            <Row label="Date embauche" value={c.date_embauche ? new Date(c.date_embauche).toLocaleDateString("fr-FR") : null} />
            <Row label="Taux horaire"  value={c.taux_horaire ? `${Number(c.taux_horaire).toLocaleString("fr-FR")} FCFA/h` : null} />
            <Row label="Niveaux"       value={(c.niveaux_enseignes||[]).join(", ")} />
          </Section>

          {(c.certifications||[]).length > 0 && (
            <Section title="Certifications">
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {c.certifications.map((cert,i) => (
                  <div key={i} style={{ background:"#f3e8ff", color:"#7c3aed", padding:"6px 12px", borderRadius:8, fontSize:11, fontWeight:700 }}>
                    {cert.nom}{cert.annee ? ` (${cert.annee})` : ""}
                    {cert.organisme ? <div style={{ fontWeight:400, fontSize:10, color:"#a78bfa" }}>{cert.organisme}</div> : null}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {c.bio && (
            <Section title="Bio">
              <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, margin:0 }}>{c.bio}</p>
            </Section>
          )}

          {(c.cv_url || c.linkedin) && (
            <Section title="Documents & liens">
              {c.cv_url && <a href={c.cv_url} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#e0f2fe", color:"#0369a1", borderRadius:8, fontSize:12, fontWeight:700, textDecoration:"none", marginRight:8 }}>📄 Voir le CV</a>}
              {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#eff6ff", color:"#1d4ed8", borderRadius:8, fontSize:12, fontWeight:700, textDecoration:"none" }}>💼 LinkedIn</a>}
            </Section>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop:"1px solid #e5e7eb", padding:"14px 24px", display:"flex", gap:10, justifyContent:"flex-end", background:"#fafafa" }}>
          <button onClick={onDelete} style={{ padding:"8px 16px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:12 }}>🗑️ Supprimer</button>
          {onRenvoyerAcces && (
            <button onClick={onRenvoyerAcces} style={{ padding:"8px 16px", background:"#fef3c7", color:"#92400e", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:12 }}>📧 Renvoyer les accès</button>
          )}
          <button onClick={onEdit}   style={{ padding:"8px 16px", background:"#0891b2", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:12 }}>✏️ Modifier</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════ */
const btnPrimary   = { padding:"9px 18px", background:C.primary, color:"#fff",    border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 };
const btnSecondary = { padding:"9px 18px", background:"#e5e7eb",  color:"#374151", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 };
const btnIconSm    = { display:"block", padding:"5px 10px", background:C.light, color:C.dark, border:`1px solid ${C.primary}30`, borderRadius:5, cursor:"pointer", fontSize:11, fontWeight:700, marginBottom:3 };
const labelSt      = { display:"block", fontSize:12, fontWeight:700, color:"#374151", marginBottom:4 };
const inputSt      = { padding:"9px 10px", borderRadius:7, border:"1px solid #d1d5db", fontSize:13, width:"100%", boxSizing:"border-box" };
const th           = { padding:"9px 10px", textAlign:"left", fontWeight:700, fontSize:11, color:"#374151", borderBottom:"2px solid #e5e7eb" };
const td           = { padding:"9px 10px", verticalAlign:"middle" };