import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer/Footer";
import { insertTestNiveau } from "../../services/formsService";
import { supabase } from "../../config/supabase";

/* ── Fonts & KF (inchangés) ───────────────────────────────── */
if (!document.querySelector("#flt-fonts")) {
  const l = document.createElement("link"); l.id = "flt-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap";
  document.head.appendChild(l);
}
if (!document.querySelector("#flt-kf")) {
  const s = document.createElement("style"); s.id = "flt-kf";
  s.textContent = `
    @keyframes fltFU   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fltFI   { from{opacity:0} to{opacity:1} }
    @keyframes fltSI   { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
    @keyframes fltSpin { to{transform:rotate(360deg)} }
    @keyframes fltPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.35)} 60%{box-shadow:0 0 0 12px rgba(220,38,38,0)} }
    @keyframes fltBar  { from{width:0} to{width:var(--bw,100%)} }
    @keyframes fltCount{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .flt-opt:hover { border-color:#dc2626 !important; background:#fef2f2 !important; color:#dc2626 !important; }
    .flt-nav-dot:hover { transform:scale(1.2) !important; }
    .flt-share:hover { background:#1e3a8a !important; color:#fff !important; border-color:#1e3a8a !important; }
    .flt-profile-btn:hover { border-color:#dc2626 !important; background:#fef2f2 !important; color:#dc2626 !important; }
    @keyframes pmFU { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    .pm-card:hover { transform:translateY(-4px)!important;box-shadow:0 16px 40px rgba(0,0,0,.12)!important; }
    .pm-assistant:hover { border-color:#0891b2!important;transform:translateY(-2px)!important; }
    .pm-centre:hover { border-color:#1e3a8a!important;background:#eff6ff!important; }
  `;
  document.head.appendChild(s);
}

/* ════════════════════════════════════════════════════════
   QUESTIONS BANK
════════════════════════════════════════════════════════ */
const DEFAULT_QUESTIONS = [
  { id:1,  cefr:"A1", category:"Grammaire",     text:'What ______ your name?',                                        options:["is","are","am","be"],                                                                              correct:"is",                        explanation:"On utilise 'is' avec 'what' pour les sujets singuliers de la 3ème personne.",                                                          points:1 },
  { id:2,  cefr:"A1", category:"Vocabulaire",   text:'Which word means the opposite of "big"?',                       options:["tall","small","heavy","old"],                                                                      correct:"small",                     explanation:"'Small' est l'antonyme direct de 'big'.",                                                                                            points:1 },
  { id:3,  cefr:"A2", category:"Grammaire",     text:'She ______ to the cinema last Saturday.',                       options:["go","goes","went","going"],                                                                        correct:"went",                      explanation:"Le prétérit de 'go' est 'went' (verbe irrégulier). On l'utilise pour des actions passées terminées.",                                 points:1 },
  { id:4,  cefr:"A2", category:"Vocabulaire",   text:'Choose the correct meaning of "exhausted".',                   options:["Very hungry","Very tired","Very happy","Very cold"],                                               correct:"Very tired",                explanation:"'Exhausted' signifie extrêmement fatigué, épuisé.",                                                                                  points:1 },
  { id:5,  cefr:"B1", category:"Grammaire",     text:'If I ______ you, I would study harder.',                        options:["was","were","am","is"],                                                                            correct:"were",                      explanation:"Dans les conditionnels de type 2, on utilise 'were' pour tous les sujets, même 'I'.",                                                  points:2 },
  { id:6,  cefr:"B1", category:"Compréhension", text:'He has been working here ______ five years.',                  options:["since","for","during","while"],                                                                    correct:"for",                       explanation:"'For' indique une durée (five years). 'Since' indique un point de départ.",                                                           points:2 },
  { id:7,  cefr:"B2", category:"Grammaire",     text:'By the time we arrived, the film ______ already started.',     options:["has","have","had","would have"],                                                                   correct:"had",                       explanation:"Le plus-que-parfait (had + participe) exprime une action antérieure à un autre moment passé.",                                        points:2 },
  { id:8,  cefr:"B2", category:"Vocabulaire",   text:'Choose the best synonym for "meticulous".',                    options:["Careless","Precise","Generous","Stubborn"],                                                        correct:"Precise",                   explanation:"'Meticulous' signifie très attentif aux détails, précis et minutieux.",                                                               points:2 },
  { id:9,  cefr:"C1", category:"Grammaire",     text:'The report ______ have been submitted by noon.',               options:["should","must","ought to","All are correct"],                                                      correct:"All are correct",           explanation:"'Should', 'must' et 'ought to' expriment l'obligation — tous corrects dans ce contexte.",                                             points:3 },
  { id:10, cefr:"C1", category:"Compréhension", text:'Which sentence uses the subjunctive correctly?',               options:["I suggest that he goes home.","I suggest that he go home.","I suggest that he will go home.","I suggest that he going home."], correct:"I suggest that he go home.", explanation:"Le subjonctif utilise la base verbale sans conjugaison après 'suggest', 'recommend', 'insist'.", points:3 },
];

const CEFR = {
  A1: { label:"Débutant",            color:"#64748b", bg:"#f8fafc", ring:"#e2e8f0", icon:"🌱", desc:"Compréhension d'expressions familières. Communication basique.", course:"Anglais Débutant A1→A2" },
  A2: { label:"Élémentaire",         color:"#d97706", bg:"#fefce8", ring:"#fde68a", icon:"🌿", desc:"Communication sur des sujets quotidiens et familiers.",          course:"Anglais Élémentaire A2→B1" },
  B1: { label:"Intermédiaire",       color:"#1e3a8a", bg:"#eff6ff", ring:"#bfdbfe", icon:"🌳", desc:"Interaction courante. Compréhension des points essentiels.",      course:"Anglais Intermédiaire B1→B2" },
  B2: { label:"Inter. Supérieur",    color:"#7c3aed", bg:"#faf5ff", ring:"#ddd6fe", icon:"⭐", desc:"Compréhension de textes complexes. Expression fluide.",           course:"Préparation TOEIC / IELTS" },
  C1: { label:"Avancé",              color:"#059669", bg:"#f0fdf4", ring:"#bbf7d0", icon:"🏆", desc:"Expression efficace et flexible dans des contextes exigeants.",   course:"Anglais Expert C1→C2" },
  C2: { label:"Maîtrise",            color:"#dc2626", bg:"#fef2f2", ring:"#fecaca", icon:"👑", desc:"Compréhension et expression parfaites — niveau bilingue.",        course:"Perfectionnement & Accent" },
};

const CAT = {
  "Grammaire":     { bg:"#eff6ff", c:"#1e40af", dot:"#3b82f6" },
  "Vocabulaire":   { bg:"#fefce8", c:"#92400e", dot:"#f59e0b" },
  "Compréhension": { bg:"#f0fdf4", c:"#065f46", dot:"#10b981" },
  "Listening":     { bg:"#fdf2f8", c:"#9d174d", dot:"#ec4899" },
  "Reading":       { bg:"#e0f2fe", c:"#075985", dot:"#0ea5e9" },
  "Speaking":      { bg:"#fff7ed", c:"#9a3412", dot:"#f97316" },
  "Orthographe":   { bg:"#ede9fe", c:"#5b21b6", dot:"#8b5cf6" },
  "Expression":    { bg:"#fee2e2", c:"#991b1b", dot:"#ef4444" },
};

const Q_TYPE_LABEL = {
  qcm:         { icon:"🎯", label:"QCM" },
  vrai_faux:   { icon:"✅", label:"Vrai / Faux" },
  texte_trous: { icon:"✏️", label:"Texte à trous" },
  audio_qcm:   { icon:"🎧", label:"Listening" },
  lecture_qcm: { icon:"📖", label:"Reading" },
  libre:       { icon:"💬", label:"Expression libre" },
  speaking:    { icon:"🎙️", label:"Speaking" },
};

/* ════════════════════════════════════════════════════════
   FORMAT INFOS
════════════════════════════════════════════════════════ */
const FORMAT_INFO = {
  mixte:    { icon:"🔀", label:"Test Mixte",  color:"#1e3a8a", bg:"#eff6ff", desc:"Grammaire · Vocabulaire · Compréhension",              scored:true  },
  reading:  { icon:"📖", label:"Reading",     color:"#075985", bg:"#e0f2fe", desc:"Compréhension de textes écrits",                        scored:true  },
  writing:  { icon:"✍️", label:"Writing",     color:"#6d28d9", bg:"#faf5ff", desc:"Expression écrite — résultat sous 24h après correction", scored:false },
  speaking: { icon:"🎤", label:"Speaking",    color:"#dc2626", bg:"#fff1f2", desc:"Expression orale — résultat sous 24h après correction",  scored:false },
  listening:{ icon:"🎧", label:"Listening",   color:"#9d174d", bg:"#fdf2f8", desc:"Compréhension orale",                                   scored:true  },
};

/* ════════════════════════════════════════════════════════
   BANQUES DE QUESTIONS PAR FORMAT
════════════════════════════════════════════════════════ */

// ── READING ─────────────────────────────────────────────
const READING_PASSAGE = `The rise of remote work has transformed the modern workplace. Since 2020, millions of employees across the globe have shifted from traditional office environments to home-based setups. Companies initially adopted remote work as a temporary measure, but many have since made it a permanent option.

Studies show that remote workers often report higher job satisfaction due to the flexibility it offers. They save time and money on commuting, and many find they are more productive without the usual office distractions. However, remote work is not without challenges. Isolation, difficulty collaborating with colleagues, and the blurring of work-life boundaries are common concerns.

Despite these drawbacks, a survey of 5,000 professionals found that 78% prefer a hybrid model — combining remote and in-office work. This preference reflects the desire for flexibility while maintaining human connection and structured collaboration.`;

const READING_QUESTIONS = [
  { id:1, type:"lecture_qcm", cefr:"A2", category:"Reading", passage:READING_PASSAGE, text:"When did remote work become widespread?", options:["Before 2010","Since 2020","In 2015","After 2025"], correct:"Since 2020", explanation:"The passage states 'Since 2020, millions of employees...shifted to home-based setups.'", points:2 },
  { id:2, type:"lecture_qcm", cefr:"A2", category:"Reading", passage:READING_PASSAGE, text:"Why do remote workers often report higher job satisfaction?", options:["They earn more money","They work fewer hours","They have more flexibility","Their managers are kinder"], correct:"They have more flexibility", explanation:"The text says 'higher job satisfaction due to the flexibility it offers.'", points:2 },
  { id:3, type:"lecture_qcm", cefr:"B1", category:"Reading", passage:READING_PASSAGE, text:"Which of the following is NOT mentioned as a challenge of remote work?", options:["Isolation","Poor internet connection","Work-life boundary issues","Difficulty collaborating"], correct:"Poor internet connection", explanation:"Internet issues are not mentioned in the passage. The challenges listed are isolation, collaboration difficulty, and work-life blur.", points:2 },
  { id:4, type:"lecture_qcm", cefr:"B1", category:"Reading", passage:READING_PASSAGE, text:"What percentage of professionals prefer a hybrid model?", options:["50%","68%","78%","88%"], correct:"78%", explanation:"'A survey of 5,000 professionals found that 78% prefer a hybrid model.'", points:2 },
  { id:5, type:"lecture_qcm", cefr:"B2", category:"Reading", passage:READING_PASSAGE, text:"What does the word 'drawbacks' mean in the last paragraph?", options:["Benefits","Disadvantages","Solutions","Improvements"], correct:"Disadvantages", explanation:"'Drawbacks' means disadvantages or negative aspects, contrasting with the benefits mentioned earlier.", points:3 },
  { id:6, type:"lecture_qcm", cefr:"B2", category:"Reading", passage:READING_PASSAGE, text:"What can be inferred about companies' original intention regarding remote work?", options:["They planned it for years","They saw it as a long-term solution","They considered it temporary at first","They were forced by governments"], correct:"They considered it temporary at first", explanation:"'Companies initially adopted remote work as a temporary measure' — 'initially' and 'temporary' indicate it wasn't planned long-term.", points:3 },
  { id:7, type:"lecture_qcm", cefr:"C1", category:"Reading", passage:READING_PASSAGE, text:"Which statement best summarises the overall tone of the passage?", options:["Highly critical of remote work","Purely descriptive with no opinion","Balanced — acknowledging both benefits and challenges","Enthusiastically promoting remote work"], correct:"Balanced — acknowledging both benefits and challenges", explanation:"The passage presents advantages (satisfaction, productivity) and disadvantages (isolation, collaboration) before concluding with survey data.", points:4 },
];

// ── LISTENING ────────────────────────────────────────────
const LISTENING_SCRIPT = `You will now hear a conversation between two colleagues, Sarah and Mark, discussing their company's annual conference. Sarah is the events coordinator. Mark is a sales manager. They are meeting on Monday morning.

SARAH: "Mark, I wanted to confirm the logistics for the conference next Friday. We're expecting about 200 attendees."
MARK: "Great. Has the catering been arranged?"
SARAH: "Yes, we've booked a local restaurant to provide lunch. The cost is 35 euros per person. I'll need your approval on the budget by Wednesday."
MARK: "That's fine. What about the keynote speaker?"
SARAH: "Professor Chen confirmed yesterday. She'll be speaking for 45 minutes on digital transformation."
MARK: "Perfect. Will there be translation services? We have clients coming from Spain and Brazil."
SARAH: "We've arranged simultaneous translation into Spanish and Portuguese. The headsets will be ready at the entrance."
MARK: "One last thing — the parking. Last year it was a real problem."
SARAH: "I've reserved 50 parking spaces at the building next door. Attendees can register for a spot on the website."`;

const LISTENING_QUESTIONS = [
  { id:1, type:"audio_qcm", cefr:"A2", category:"Listening", script:LISTENING_SCRIPT, text:"Who is Sarah?", options:["A sales manager","An events coordinator","A keynote speaker","A restaurant owner"], correct:"An events coordinator", explanation:"Sarah introduces herself as the events coordinator.", points:2 },
  { id:2, type:"audio_qcm", cefr:"A2", category:"Listening", script:LISTENING_SCRIPT, text:"When is the conference?", options:["Next Monday","Next Wednesday","Next Friday","This weekend"], correct:"Next Friday", explanation:"Sarah says 'the conference next Friday.'", points:2 },
  { id:3, type:"audio_qcm", cefr:"B1", category:"Listening", script:LISTENING_SCRIPT, text:"How much does the catering cost per person?", options:["25 euros","30 euros","35 euros","40 euros"], correct:"35 euros", explanation:"Sarah states 'The cost is 35 euros per person.'", points:2 },
  { id:4, type:"audio_qcm", cefr:"B1", category:"Listening", script:LISTENING_SCRIPT, text:"What is Professor Chen's presentation topic?", options:["Sales strategies","Digital transformation","Event management","International business"], correct:"Digital transformation", explanation:"'She'll be speaking for 45 minutes on digital transformation.'", points:2 },
  { id:5, type:"audio_qcm", cefr:"B2", category:"Listening", script:LISTENING_SCRIPT, text:"Which languages will translation be provided in?", options:["French and Spanish","Spanish and Portuguese","Portuguese and Italian","French and Portuguese"], correct:"Spanish and Portuguese", explanation:"'We've arranged simultaneous translation into Spanish and Portuguese.'", points:3 },
  { id:6, type:"audio_qcm", cefr:"B2", category:"Listening", script:LISTENING_SCRIPT, text:"What was a problem at last year's conference?", options:["The catering","The speaker","The parking","The translation"], correct:"The parking", explanation:"Mark says 'Last year it was a real problem' when discussing parking.", points:3 },
  { id:7, type:"audio_qcm", cefr:"C1", category:"Listening", script:LISTENING_SCRIPT, text:"How can attendees reserve a parking space?", options:["By calling Sarah","By emailing Mark","By registering on the website","By arriving early"], correct:"By registering on the website", explanation:"'Attendees can register for a spot on the website.'", points:3 },
];

// ── WRITING ─────────────────────────────────────────────
const WRITING_QUESTIONS = [
  { id:1, type:"libre", cefr:"A2", category:"Writing", text:"Introduce yourself. Write about your name, your job, where you live and one hobby. (40–60 words)", minWords:30, points:10 },
  { id:2, type:"libre", cefr:"B1", category:"Writing", text:"Write an email to your manager explaining that you will be late to work tomorrow due to a personal appointment. Be polite and professional. (80–120 words)", minWords:60, points:15 },
  { id:3, type:"libre", cefr:"B2", category:"Writing", text:"A local company has announced it will ban employees from using social media during working hours. Write a short opinion article agreeing or disagreeing with this policy. Give two clear reasons. (150–200 words)", minWords:120, points:20 },
];

// ── SPEAKING ─────────────────────────────────────────────
const SPEAKING_QUESTIONS = [
  { id:1, type:"speaking", cefr:"A2", category:"Speaking", text:"Describe your typical workday from morning to evening. Talk about your routine and any activities you enjoy. (Speak for 1–2 minutes)", prepTime:30, points:10 },
  { id:2, type:"speaking", cefr:"B1", category:"Speaking", text:"Tell us about a challenge you faced at work or in your studies, and how you overcame it. (Speak for 1–2 minutes)", prepTime:45, points:15 },
  { id:3, type:"speaking", cefr:"B2", category:"Speaking", text:"Some people believe that English will eventually replace all other languages in international business. Do you agree or disagree? Give reasons and examples. (Speak for 2 minutes)", prepTime:60, points:20 },
];


/* ── Progress bar ──────────────────────────────────────── */
const PBar = ({ value, max, color = "#dc2626", height = 8 }) => (
  <div style={{ height, background:"#f1f5f9", borderRadius:4, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.round((value/max)*100)}%`, background:`linear-gradient(90deg,${color},${color}bb)`, borderRadius:4, transition:"width .6s ease" }} />
  </div>
);

/* ── Stepper ───────────────────────────────────────────── */
const Stepper = ({ current, alreadyAssigned }) => {
  const steps = [
    {n:1, l:"Vos infos"},
    {n:2, l: alreadyAssigned ? "Projet ✓" : "Votre projet"},
    {n:3, l:"Le test"},
    {n:4, l:"Résultats"},
  ];
  // Si conseillère déjà assignée, traiter le step 2 comme validé dès le début
  const effectiveCurrent = alreadyAssigned && current <= 2 ? 3 : current;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, marginBottom:40 }}>
      {steps.map((s, i) => {
        const done    = effectiveCurrent > s.n;
        const active  = effectiveCurrent === s.n;
        return (
          <React.Fragment key={s.n}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{
                width:40, height:40, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                fontWeight:800, fontSize:".88rem", transition:"all .3s",
                background: done ? "#10b981" : active ? "linear-gradient(135deg,#dc2626,#1e3a8a)" : "#f1f5f9",
                color: (done || active) ? "#fff" : "#94a3b8",
                boxShadow: active ? "0 4px 14px rgba(220,38,38,.35)" : "none",
              }}>
                {done ? "✓" : s.n}
              </div>
              <span style={{ fontSize:".72rem", fontWeight: active ? 700 : 500, color: active ? "#dc2626" : done ? "#10b981" : "#94a3b8", whiteSpace:"nowrap" }}>
                {s.l}
              </span>
            </div>
            {i < 3 && <div style={{ width:48, height:2, background: done ? "#10b981" : "#e2e8f0", margin:"0 4px 20px", transition:"background .4s" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

/* ────────────────────────────────────────────────────────
   COMPOSANT : Enregistreur audio (questions Speaking)
──────────────────────────────────────────────────────── */
function AudioRecorder({ onRecordingComplete, existingUrl }) {
  const [phase, setPhase]     = React.useState(existingUrl ? "done" : "idle");
  const [seconds, setSeconds] = React.useState(0);
  const [blobUrl, setBlobUrl] = React.useState(existingUrl || null);
  const [error, setError]     = React.useState("");
  const mrRef    = React.useRef(null);
  const chunksRef = React.useRef([]);
  const timerRef  = React.useRef(null);
  const MAX_SECONDS = 120;

  React.useEffect(() => () => {
    clearInterval(timerRef.current);
    if (mrRef.current?.state === "recording") mrRef.current.stop();
  }, []);

  const startRecording = async () => {
    setError("");
    setPhase("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      chunksRef.current = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find(m => MediaRecorder.isTypeSupported(m)) || "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mrRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: mimeType.split(";")[0] || "audio/webm" });
        const localUrl = URL.createObjectURL(blob);
        setBlobUrl(localUrl);
        setPhase("uploading");
        try {
          const fd = new FormData();
          fd.append("file", blob, "recording.webm");
          const r = await fetch(`${API_BASE}/api/upload/recording`, { method:"POST", body:fd });
          const d = await r.json();
          if (r.ok && d.url) { setBlobUrl(d.url); onRecordingComplete(d.url); setPhase("done"); }
          else { setError(d.error || "Erreur lors de l'envoi"); setPhase("error"); }
        } catch { setError("Erreur réseau — vérifiez votre connexion"); setPhase("error"); }
      };
      mr.start(500);
      setPhase("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s + 1 >= MAX_SECONDS) { clearInterval(timerRef.current); mr.stop(); }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      setError(e.name === "NotAllowedError"
        ? "Accès au microphone refusé. Autorisez le micro dans les paramètres de votre navigateur."
        : "Microphone non disponible sur cet appareil.");
      setPhase("error");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mrRef.current?.state === "recording") mrRef.current.stop();
  };

  const reRecord = () => {
    if (blobUrl?.startsWith("blob:")) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null); setSeconds(0); setError(""); setPhase("idle");
    onRecordingComplete(null);
  };

  const fmtT = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const baseBox = { borderRadius:14, padding:"18px 20px", marginBottom:18, textAlign:"center" };

  if (phase === "idle" || phase === "requesting" || phase === "error") return (
    <div style={{ ...baseBox, background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1.5px solid #86efac" }}>
      <p style={{ fontSize:".88rem", color:"#166534", fontWeight:600, marginBottom:14 }}>
        🎙️ <strong>Enregistrez votre réponse orale</strong>
        <span style={{ display:"block", fontWeight:400, fontSize:".81rem", color:"#4b5563", marginTop:4 }}>
          Cliquez sur le micro et répondez à voix haute en anglais. Maximum 2 minutes.
        </span>
      </p>
      {error && (
        <div style={{ background:"#fee2e2", border:"1px solid #fecaca", borderRadius:8, padding:"8px 12px", marginBottom:12, fontSize:".81rem", color:"#b91c1c" }}>
          ⚠️ {error}
          <div style={{ fontSize:".76rem", color:"#6b7280", marginTop:4 }}>Passez à la question suivante si le micro est indisponible.</div>
        </div>
      )}
      <button onClick={startRecording} disabled={phase === "requesting"}
        style={{ width:72, height:72, borderRadius:"50%", border:"none", background:phase==="requesting"?"#d1fae5":"#22c55e",
          color:"#fff", fontSize:"1.8rem", cursor:phase==="requesting"?"default":"pointer",
          boxShadow:"0 4px 20px rgba(34,197,94,.35)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", transition:"all .2s" }}>
        {phase === "requesting" ? "⏳" : "🎙️"}
      </button>
      {phase === "requesting" && <p style={{ fontSize:".79rem", color:"#6b7280", marginTop:10 }}>Autorisation du microphone…</p>}
    </div>
  );

  if (phase === "recording") return (
    <div style={{ ...baseBox, background:"linear-gradient(135deg,#fff1f2,#fee2e2)", border:"1.5px solid #fca5a5" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:12 }}>
        <div style={{ width:12, height:12, borderRadius:"50%", background:"#dc2626", animation:"fltPulse 1.2s ease infinite" }} />
        <span style={{ fontSize:"1rem", fontWeight:800, color:"#dc2626" }}>Enregistrement • {fmtT(seconds)}</span>
        <span style={{ fontSize:".77rem", color:"#9ca3af" }}>/ {fmtT(MAX_SECONDS)} max</span>
      </div>
      <div style={{ height:6, background:"#fecaca", borderRadius:3, marginBottom:16, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${(seconds/MAX_SECONDS)*100}%`, background:"#dc2626", borderRadius:3, transition:"width .8s" }} />
      </div>
      <button onClick={stopRecording} style={{ padding:"12px 28px", background:"#dc2626", color:"#fff", border:"none", borderRadius:12, fontWeight:700, fontSize:".94rem", cursor:"pointer", boxShadow:"0 4px 16px rgba(220,38,38,.3)" }}>
        ⏹ Arrêter l'enregistrement
      </button>
      <p style={{ fontSize:".77rem", color:"#9ca3af", marginTop:10 }}>Arrêt automatique après 2 minutes</p>
    </div>
  );

  if (phase === "uploading") return (
    <div style={{ ...baseBox, background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1.5px solid #86efac" }}>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid rgba(34,197,94,.2)", borderTopColor:"#22c55e", animation:"fltSpin .8s linear infinite", margin:"0 auto 12px" }} />
      <p style={{ fontSize:".88rem", color:"#166534", fontWeight:600 }}>Envoi de l'enregistrement…</p>
      {blobUrl && <audio controls src={blobUrl} style={{ width:"100%", marginTop:10, borderRadius:8 }} />}
    </div>
  );

  return (
    <div style={{ ...baseBox, background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1.5px solid #86efac" }}>
      <p style={{ fontSize:".88rem", color:"#166534", fontWeight:700, marginBottom:10 }}>✅ Réponse enregistrée</p>
      {blobUrl && <audio controls src={blobUrl} crossOrigin="anonymous" style={{ width:"100%", marginBottom:12, borderRadius:8 }} />}
      <button onClick={reRecord} style={{ padding:"8px 18px", background:"#fff", border:"1.5px solid #86efac", borderRadius:8, color:"#166534", fontWeight:600, fontSize:".84rem", cursor:"pointer" }}>
        🔄 Ré-enregistrer
      </button>
    </div>
  );
}

export default function FreeLevelTest({ questions: propQ }) {
  const navigate  = useNavigate();

  const [activeTest,   setActiveTest]   = useState(null);
  const [loadingTest,  setLoadingTest]  = useState(true);

  // Charger le test actif depuis l'API au montage
  useEffect(() => {
    fetch(`${API_BASE}/api/level-tests/actif`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.test) setActiveTest(d.test); })
      .catch(() => {})
      .finally(() => setLoadingTest(false));
  }, []);

  // Format : dérivé du test actif (configuré par l'admin), sinon "mixte"
  const format = activeTest?.format_test || activeTest?.format || "mixte";
  const fmtInfo = FORMAT_INFO[format] || FORMAT_INFO.mixte;
  // Writing et Speaking : résultat donné par l'assistante après correction
  const needsManualCorrection = format === "writing" || format === "speaking";

  // Questions : propQ > test actif de l'admin > fallback statique par format > DEFAULT
  const FALLBACK_BY_FORMAT = {
    mixte:    DEFAULT_QUESTIONS,
    reading:  READING_QUESTIONS,
    writing:  WRITING_QUESTIONS,
    speaking: SPEAKING_QUESTIONS,
    listening:LISTENING_QUESTIONS,
  };
  const activeQuestions = activeTest?.level_questions?.filter(q => q.actif !== false).sort((a,b) => (a.ordre||0)-(b.ordre||0));
  const questions = propQ || activeQuestions || FALLBACK_BY_FORMAT[format] || DEFAULT_QUESTIONS;

  const testParams = activeTest?.params || {};
  const totalPts  = questions.reduce((s, q) => s + (q.points || 1), 0);

  const [step,       setStep]       = useState("form");
  const [formData,   setFormData]   = useState({ fullname:"", email:"", phone:"", consent:false, profile:"particulier", centre_id:"", commercial_id:"" });
  const [formErrors, setFormErrors] = useState({});
  // Étape "Votre projet" — wizard style ParcoursModal
  const [pStep,         setPStep]         = useState(0);   // sub-step du wizard projet
  const [pModeCours,    setPModeCours]    = useState(null);// "en_ligne" | "presentiel"
  const [pTypeCoaching, setPTypeCoaching] = useState(null);// "groupe" | "prive"
  const [pCentreChoisi, setPCentreChoisi] = useState(null);// objet centre {id,nom,ville}
  const [pAssistante,   setPAssistante]   = useState(null);// objet assistante
  const [pAssistantes,  setPAssistantes]  = useState([]);
  const [pCentres,      setPCentres]      = useState([]);
  const [pLoading,      setPLoading]      = useState(false);
  const [pErreur,       setPErreur]       = useState("");
  const [pModePaiement, setPModePaiement] = useState(null);
  const [pMmOption,     setPMmOption]     = useState(null);
  const [pSubmitting,   setPSubmitting]   = useState(false);
  const [pOffresEnLigne,       setPOffresEnLigne]       = useState([]);
  const [pOffreChoisie,        setPOffreChoisie]        = useState(null);
  const [pSelectedCentreCard,  setPSelectedCentreCard]  = useState(null);
  const [pCentresMaster,       setPCentresMaster]       = useState([]);
  const [pCentreAssistantesMap,setPCentreAssistantesMap]= useState({});
  // Étape assign (après le quiz — fallback si l'utilisateur a un lien direct sans projet)
  const [assignCentre,       setAssignCentre]       = useState("");
  const [assignCommerciaux,  setAssignCommerciaux]  = useState([]);
  const [assignLoadingCom,   setAssignLoadingCom]   = useState(false);
  const [assignCommercialId, setAssignCommercialId] = useState("");
  const [assignSaving,       setAssignSaving]       = useState(false);
  const [assignError,        setAssignError]        = useState("");
  const [answers,    setAnswers]    = useState({});
  const [currentQ,   setCurrentQ]   = useState(0);
  const [result,     setResult]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isLoggedIn,       setIsLoggedIn]       = useState(false);
  const [checkingSession,  setCheckingSession]  = useState(true);
  const [alreadyTested,    setAlreadyTested]    = useState(false);
  const [checkingTest,     setCheckingTest]     = useState(false);
  const [sessionCommercialId, setSessionCommercialId] = useState("");
  // Auth wall
  const [authTab,        setAuthTab]        = useState("register");
  const [authEmail,      setAuthEmail]      = useState("");
  const [authPassword,   setAuthPassword]   = useState("");
  const [authName,       setAuthName]       = useState("");
  const [authTel,        setAuthTel]        = useState("");
  const [authError,      setAuthError]      = useState("");
  const [authSuccess,    setAuthSuccess]    = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const timerPerQ = testParams?.timerEnabled !== false ? (testParams?.timerPerQ || 60) : 9999;
  const [timeLeft,   setTimeLeft]   = useState(questions.length * timerPerQ);
  const [elapsed,    setElapsed]    = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [emailSent,  setEmailSent]  = useState(false);

  const timerRef = useRef(null);
  const startRef = useRef(null);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const BET_CENTRES = [
    { id:"angre",      label:"Angré",        ville:"Abidjan", icon:"🏙️" },
    { id:"2plateaux",  label:"II Plateaux",  ville:"Abidjan", icon:"🌆" },
    { id:"yopougon",   label:"Yopougon",     ville:"Abidjan", icon:"🏢" },
    { id:"koumassi",   label:"Koumassi",     ville:"Abidjan", icon:"🌇" },
    { id:"abatta",     label:"Abatta",       ville:"Abidjan", icon:"🏘️" },
    { id:"bouake",     label:"Bouaké",       ville:"Bouaké",  icon:"🌍" },
  ];

  /* ── Charger les conseillères dans le step assign ── */
  useEffect(() => {
    if (!assignCentre) { setAssignCommerciaux([]); return; }
    setAssignLoadingCom(true);
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5001"}/api/level-test/commerciaux?centre_id=${assignCentre}`)
      .then(r => r.json())
      .then(data => setAssignCommerciaux(data.commerciaux || []))
      .catch(() => setAssignCommerciaux([]))
      .finally(() => setAssignLoadingCom(false));
  }, [assignCentre]);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

  /* ── Charger les centres BET + offres en ligne quand on entre dans le step projet ── */
  useEffect(() => {
    if (step !== "projet") return;
    // Reset wizard
    setPStep(0); setPModeCours(null); setPTypeCoaching(null);
    setPCentreChoisi(null); setPAssistante(null); setPAssistantes([]);
    setPOffreChoisie(null); setPSelectedCentreCard(null);
    setPModePaiement(null); setPMmOption(null);
    setPCentreAssistantesMap({}); setPErreur("");

    // Centres
    fetch(`${API_BASE}/api/parcours/centres`)
      .then(r => r.json())
      .then(d => {
        const centres = d.centres || [];
        setPCentres(centres);
        // Pré-charger les assistantes de chaque centre
        Promise.all(centres.map(async c => {
          try {
            const r = await fetch(`${API_BASE}/api/parcours/assistantes-presentiel/${c.id}?tous=true`);
            const d = await r.json();
            return { id: c.id, assistantes: d.assistantes || [] };
          } catch { return { id: c.id, assistantes: [] }; }
        })).then(results => {
          const map = {};
          results.forEach(({ id, assistantes }) => { map[id] = assistantes; });
          setPCentreAssistantesMap(map);
        });
      })
      .catch(() => {});

    // Centres master (pour les offres par cabinet)
    try {
      const s = localStorage.getItem("bet_centres_master");
      if (s) setPCentresMaster(JSON.parse(s).filter(c => c.actif !== false));
    } catch {}

    // Offres en ligne : localStorage d'abord, puis sync Supabase
    try {
      const s = localStorage.getItem("bet_offres_en_ligne");
      if (s) setPOffresEnLigne(JSON.parse(s).filter(o => o.actif !== false));
    } catch {}
    supabase.from("plateforme_config").select("valeur").eq("key","offres_en_ligne").maybeSingle()
      .then(({ data, error }) => {
        if (!error && Array.isArray(data?.valeur) && data.valeur.length) {
          localStorage.setItem("bet_offres_en_ligne", JSON.stringify(data.valeur));
          setPOffresEnLigne(data.valeur.filter(o => o.actif !== false));
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* ── Lire ?ref= dans l'URL pour pré-attribuer l'assistante ── */
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setFormData(fd => ({ ...fd, commercial_id: ref }));
      setSessionCommercialId(ref);
    }
  }, []);

  /* ── Session Supabase : pré-remplissage + vérification test ── */
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setCheckingSession(false); return; }
      const meta = session.user.user_metadata || {};
      const fullName = (meta.nom && meta.prenom)
        ? `${meta.nom} ${meta.prenom}`
        : meta.full_name || session.user.email.split("@")[0];
      setIsLoggedIn(true);
      setCheckingSession(false);
      if (meta.commercial_id) setSessionCommercialId(meta.commercial_id);
      setFormData(fd => ({
        ...fd,
        fullname: fullName,
        email:    session.user.email,
        phone:    meta.telephone || fd.phone,
        consent:  true,
      }));
      setCheckingTest(true);
      try {
        const res = await fetch(`${API_BASE}/api/level-test/result?email=${encodeURIComponent(session.user.email)}`);
        const data = await res.json();
        if (data.result) setAlreadyTested(true);
      } catch { /* silently ignore */ }
      finally { setCheckingTest(false); }
    });
  }, []);

  const handleAuthRegister = async (e) => {
    e.preventDefault();
    setAuthError(""); setAuthSuccess(""); setAuthSubmitting(true);
    try {
      const nameParts = authName.trim().split(" ");
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nameParts[0] || "", prenom: nameParts.slice(1).join(" ") || "", email: authEmail, telephone: authTel, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription");
      setAuthSuccess("Compte créé ! Connexion en cours…");
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (signInErr) throw new Error(signInErr.message);
      window.location.reload();
    } catch (err) {
      setAuthError(err.message);
      setAuthSubmitting(false);
    }
  };

  const handleAuthLogin = async (e) => {
    e.preventDefault();
    setAuthError(""); setAuthSuccess(""); setAuthSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email ou mot de passe incorrect");
      await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
      window.location.reload();
    } catch (err) {
      setAuthError(err.message);
      setAuthSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/test-niveau` } });
  };


  useEffect(() => {
    if (step === "quiz") {
      startRef.current = Date.now();
      setTimeLeft(questions.length * timerPerQ);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); doSubmit(); return 0; } return t-1; });
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  useEffect(() => { window.scrollTo({ top:0, behavior:"smooth" }); }, [step]);

  const validateForm = () => {
    const e = {};
    if (!formData.fullname.trim()) e.fullname = "Le nom est requis";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Email invalide";
    if (!formData.consent) e.consent = "Requis";
    return e;
  };

  const handleFormSubmit = () => {
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      // Si une assistante est déjà assignée (lien ?ref= ou session), aller directement au quiz
      if (sessionCommercialId || formData.commercial_id) {
        setStep("quiz");
      } else {
        setStep("projet");
      }
    }, 800);
  };

  /* ── Wizard projet : helpers ── */
  const pInferTypeCoaching = (offre) => {
    if (!offre) return null;
    const l = (offre.label || "").toLowerCase();
    if (l.includes("groupe") || l.includes("group")) return "groupe";
    if (l.includes("priv")) return "prive";
    return null;
  };

  const pFindMaster = (centre) => {
    const norm = s => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/^bet\s+/,"").trim();
    const cn = norm(centre.nom);
    return pCentresMaster.find(m => norm(m.name) === cn) ||
           pCentresMaster.find(m => norm(m.name).includes(cn) || cn.includes(norm(m.name)));
  };

  /* ── Wizard projet : handlers ── */
  const pChoisirMode = (mode) => {
    setPModeCours(mode);
    setPTypeCoaching(null);
    setPCentreChoisi(null);
    setPAssistante(null);
    setPAssistantes([]);
    setPOffreChoisie(null);
    setPSelectedCentreCard(null);
    setPModePaiement(null);
    setPMmOption(null);
    setPErreur("");
    if (mode === "en_ligne") setPStep(1);
    else setPStep(1.5);
  };

  // En ligne : offre sélectionnée → charger les assistantes
  const pChoisirOffreEnLigne = async (offre) => {
    setPOffreChoisie(offre);
    setPTypeCoaching(pInferTypeCoaching(offre));
    setPAssistantes([]); setPAssistante(null); setPErreur("");
    setPLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/parcours/assistantes-ligne`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setPAssistantes(d.assistantes || []);
      setPStep(2);
    } catch (e) { setPErreur(e.message); }
    finally { setPLoading(false); }
  };

  // En ligne : continuer sans sélectionner d'offre
  const pContinuerSansOffreEnLigne = async () => {
    setPOffreChoisie(null); setPTypeCoaching(null);
    setPAssistantes([]); setPAssistante(null); setPErreur("");
    setPLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/parcours/assistantes-ligne`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setPAssistantes(d.assistantes || []);
      setPStep(2);
    } catch (e) { setPErreur(e.message); }
    finally { setPLoading(false); }
  };

  // Présentiel : confirmer cabinet (avec ou sans offre) → charger assistantes
  const pChoisirCentre = async (centre) => {
    setPCentreChoisi(centre); setPLoading(true); setPErreur("");
    setPSelectedCentreCard(null);
    try {
      const r = await fetch(`${API_BASE}/api/parcours/assistantes-presentiel/${centre.id}?liste=true`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setPAssistantes(d.assistantes || []);
      setPStep(2);
    } catch (e) { setPErreur(e.message); }
    finally { setPLoading(false); }
  };

  const pChoisirAssistante = (a) => {
    setPAssistante(a);
    pDoSubmit(a); // pas d'étape paiement dans le test de niveau
  };

  const pDoSubmit = async (assistante) => {
    const ast = assistante || pAssistante;
    if (!ast) return;
    setPSubmitting(true); setPErreur("");
    try {
      const r = await fetch(`${API_BASE}/api/parcours/assignation`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistante_id:      ast.id,
          prospect_nom:       formData.fullname,
          prospect_email:     formData.email || undefined,
          prospect_telephone: formData.phone || "",
          type_cours:         pModeCours,
          type_coaching:      pTypeCoaching || undefined,
          centre_id:          pCentreChoisi?.id || undefined,
          source:             "test_niveau",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      // utilisateur_id = ID dans la table utilisateurs (pour le filtre level_test_results)
      // ast.id         = ID dans la table assistantes  (pour l'assignation parcours)
      const commercialUserId = d.assistante?.utilisateur_id || null;
      await supabase.auth.updateUser({
        data: {
          commercial_id: commercialUserId,
          centre_id: pCentreChoisi?.id || null,
          parcours_assignation: {
            assignation_id:    d.assignation?.id || null,
            assistante_id:     ast.id,
            assistante_prenom: ast.prenom,
            assistante_nom:    ast.nom,
            assistante_photo:  ast.photo_url || null,
            assistante_tel:    ast.telephone || null,
            type_cours:        pModeCours,
            type_coaching:     pTypeCoaching || null,
            centre_id:         pCentreChoisi?.id || null,
            centre_nom:        pCentreChoisi?.nom || null,
            date:              new Date().toISOString(),
          },
        },
      }).catch(() => {});
      setFormData(fd => ({ ...fd, commercial_id: commercialUserId, centre_id: pCentreChoisi?.id || null }));
      setSessionCommercialId(commercialUserId);
      setPAssistante(ast);
      setPStep(4);
    } catch (e) { setPErreur(e.message); }
    finally { setPSubmitting(false); }
  };

  const handleAnswer = (qId, val) => {
    setAnswers(p => ({ ...p, [qId]: val }));
    if (currentQ < questions.length - 1) setTimeout(() => setCurrentQ(c => c+1), 260);
  };

  const isCorrect = (q) => {
    const ans = answers[q.id] || "";
    if (q.type === "libre")     return false; // correction manuelle
    if (q.type === "speaking")  return false; // correction manuelle (audio)
    if (q.type === "texte_trous")  return ans.toLowerCase().trim() === (q.correct||"").toLowerCase().trim();
    return ans === q.correct;
  };

  const computeResult = () => {
    let earned = 0;
    const byCat = {}, byCefr = {};
    questions.forEach(q => {
      if (!byCat[q.category])  byCat[q.category]  = { correct:0, total:0, pts:0, max:0 };
      if (!byCefr[q.cefr])     byCefr[q.cefr]     = { correct:0, total:0 };
      byCat[q.category].total++;
      byCat[q.category].max += (q.type === "libre" || q.type === "speaking" ? 0 : (q.points || 1));
      byCefr[q.cefr].total++;
      if (isCorrect(q)) {
        earned += (q.points || 1);
        byCat[q.category].correct++;
        byCat[q.category].pts += (q.points || 1);
        byCefr[q.cefr].correct++;
      }
    });
    const gradableTotal = questions.filter(q => q.type !== "libre" && q.type !== "speaking").reduce((s,q) => s+(q.points||1), 0) || 1;
    const pct = Math.round((earned / gradableTotal) * 100);
    let cefr = "A1";
    if (pct >= 90) cefr="C2"; else if (pct >= 75) cefr="C1"; else if (pct >= 60) cefr="B2"; else if (pct >= 45) cefr="B1"; else if (pct >= 25) cefr="A2";
    return { earned, pct, cefr, byCat, byCefr, timeTaken:elapsed, correct: questions.filter(q => isCorrect(q)).length };
  };

  const saveTestResultToBackend = (resultData) => {
    const audioAnswers = {};
    questions.filter(q => q.type === "speaking").forEach(q => {
      const url = answers[q.id];
      if (url && url.startsWith("http")) audioAnswers[q.id] = url;
    });
    // Pour Writing/Speaking : pas de score auto — en attente de correction
    const isManual = format === "writing" || format === "speaking";
    return insertTestNiveau({
      user: {
        fullname:  formData.fullname,
        email:     formData.email,
        phone:     formData.phone || null,
        profile:   formData.profile || "particulier",
        consent:   formData.consent,
        centre_id:     formData.centre_id     || null,
        commercial_id: formData.commercial_id || null,
      },
      test: {
        level:              isManual ? "En attente" : resultData.cefr,
        score:              isManual ? 0 : resultData.pct,
        points_earned:      isManual ? 0 : resultData.earned,
        points_total:       totalPts,
        correct_answers:    isManual ? 0 : resultData.correct,
        total_questions:    questions.length,
        time_taken_seconds: resultData?.timeTaken || 0,
        answers_details:    questions.map(q => ({
          question_id:    q.id,
          question_text:  q.text,
          category:       q.category,
          cefr:           q.cefr,
          text:           q.text,
          user_answer:    q.type === "speaking" ? (answers[q.id] ? "[audio]" : null) : (answers[q.id] || null),
          correct_answer: q.correct || null,
          is_correct:     isManual ? null : isCorrect(q),
        })),
        audio_answers:     audioAnswers,
        by_category:       isManual ? {} : resultData.byCat,
        by_cefr:           isManual ? {} : resultData.byCefr,
        format_test:       format,
        correction_statut: isManual ? "en_attente" : "auto",
        source:            "online",
      },
      submitted_at: new Date().toISOString(),
    });
  };

  const doSubmit = async () => {
    clearInterval(timerRef.current);
    // Writing/Speaking : pas de calcul de score auto
    const r = needsManualCorrection ? { cefr:"En attente", pct:0, earned:0, byCat:{}, byCefr:{}, timeTaken:elapsed, correct:0 } : computeResult();
    setResult(r);
    setSavingResult(true);
    setSaveError("");

    // Lire le commercial_id depuis la session en temps réel (au cas où choisi depuis Mon Espace)
    let currentCommercialId = sessionCommercialId;
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      currentCommercialId = currentSession?.user?.user_metadata?.commercial_id || sessionCommercialId;
    } catch { /* utiliser sessionCommercialId */ }

    try {
      await saveTestResultToBackend(r);
      if (currentCommercialId) {
        const centreFromMeta = (await supabase.auth.getSession())?.data?.session?.user?.user_metadata?.centre_id || null;
        await fetch(`${API_BASE}/api/level-test/assign-commercial`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_email: formData.email, commercial_id: currentCommercialId, centre_id: centreFromMeta }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Erreur sauvegarde résultat :", err);
    } finally {
      setSavingResult(false);
      if (needsManualCorrection) {
        // Writing/Speaking → écran "en attente de correction"
        setStep("pending");
      } else if (currentCommercialId) {
        setStep("result");
        setTimeout(() => setEmailSent(true), 1800);
      } else {
        setStep("assign");
      }
    }
  };

  const handleAssignAndContinue = async () => {
    if (!assignCentre) { setAssignError("Veuillez sélectionner votre centre BET."); return; }
    if (!assignCommercialId) { setAssignError("Veuillez choisir votre conseillère."); return; }
    setAssignError("");
    setAssignSaving(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";
      await fetch(`${API_BASE}/api/level-test/assign-commercial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_email: formData.email, commercial_id: assignCommercialId, centre_id: assignCentre }),
      });
      if (isLoggedIn) {
        await supabase.auth.updateUser({ data: { commercial_id: assignCommercialId, centre_id: assignCentre } });
      }
    } catch (err) {
      console.error("Erreur assignation conseillère :", err);
    } finally {
      setAssignSaving(false);
      setStep("result");
      setTimeout(() => setEmailSent(true), 1800);
    }
  };

  // Envoi du bilan gratuit
  const answered = Object.keys(answers).filter(id => answers[id]).length;
  const requiredCount = questions.filter(q => q.type !== "speaking").length;
  const answeredRequired = questions.filter(q => q.type !== "speaking" && answers[q.id]).length;
  const isLow    = timeLeft <= 60;
  const q        = questions[currentQ];
  const cs       = q ? (CAT[q.category] || { bg:"#f3f4f6", c:"#374151", dot:"#6b7280" }) : {};

  if (loadingTest) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc", flexDirection:"column", gap:16 }}>
      <div style={{ width:44, height:44, border:"4px solid #e2e8f0", borderTopColor:"#dc2626", borderRadius:"50%", animation:"fltSpin .8s linear infinite" }} />
      <p style={{ color:"#64748b", fontFamily:"Montserrat,sans-serif", fontSize:".9rem" }}>Chargement du test…</p>
    </div>
  );

  return (
    <>
      <div style={S.page}>

        {/* ── STICKY HEADER ─────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerInner}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={S.headerDiv}>|</span>
              <span style={S.headerTitle}>Test de niveau officiel — CECRL A1–C2</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {step === "quiz" && (
                <div style={{ ...S.timerChip, ...(isLow ? S.timerLow : {}), animation: isLow ? "fltPulse 1s ease infinite" : "none" }}>
                  ⏱ {fmt(timeLeft)}
                </div>
              )}
              <span style={S.headerBadge}>🏅 Gratuit & Officiel</span>
            </div>
          </div>
        </div>

        {/* ── PAGE BODY ─────────────────────────────── */}
        <div style={S.body}>
          {/* Badge format de test */}
          {format !== "mixte" && (
            <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center", marginBottom:20, padding:"10px 20px", borderRadius:12, background:fmtInfo.bg, border:`1.5px solid ${fmtInfo.color}30`, maxWidth:520, margin:"0 auto 24px" }}>
              <span style={{ fontSize:"1.4rem" }}>{fmtInfo.icon}</span>
              <div>
                <div style={{ fontWeight:800, fontSize:".95rem", color:fmtInfo.color }}>{fmtInfo.label}</div>
                <div style={{ fontSize:".78rem", color:"#64748b" }}>{fmtInfo.desc}</div>
              </div>
              {needsManualCorrection && (
                <span style={{ marginLeft:"auto", background:"#fffbeb", color:"#92400e", border:"1px solid #fde68a", borderRadius:999, padding:"2px 10px", fontSize:".72rem", fontWeight:700, whiteSpace:"nowrap" }}>
                  ⏳ Résultat sous 24h
                </span>
              )}
            </div>
          )}
          <Stepper current={step === "form" ? 1 : step === "projet" ? 2 : step === "quiz" ? 3 : (step === "assign" || step === "pending") ? 3 : 4} alreadyAssigned={!!sessionCommercialId} />

          {/* MUR AUTH : non connecté */}
          {step === "form" && (checkingSession ? (
            <div style={{ textAlign:"center", padding:"60px 24px", color:"#64748b" }}>
              <div style={{ width:40, height:40, border:"4px solid #e2e8f0", borderTopColor:"#dc2626", borderRadius:"50%", animation:"fltSpin .8s linear infinite", margin:"0 auto 16px" }} />
              Vérification de votre session…
            </div>
          ) : !isLoggedIn ? (
            <div style={{ ...S.card, maxWidth:460, animation:"fltSI .45s ease" }}>
              <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a8a)", padding:"28px 28px 22px", textAlign:"center" }}>
                <div style={{ fontSize:"2.4rem", marginBottom:8 }}>🔐</div>
                <h2 style={{ fontFamily:"Montserrat,sans-serif", color:"#fff", fontWeight:800, margin:"0 0 8px", fontSize:"1.15rem" }}>
                  Connectez-vous pour passer le test
                </h2>
                <p style={{ color:"rgba(255,255,255,.7)", fontSize:".83rem", margin:0, lineHeight:1.6 }}>
                  Un compte est obligatoire pour que votre conseillère puisse recevoir votre résultat et vous contacter.
                </p>
              </div>

              {/* Tabs */}
              <div style={{ display:"flex", borderBottom:"1px solid #e2e8f0" }}>
                {[{id:"register",l:"Créer un compte"},{id:"login",l:"Se connecter"}].map(t => (
                  <button key={t.id} onClick={() => { setAuthTab(t.id); setAuthError(""); setAuthSuccess(""); }}
                    style={{ flex:1, padding:"13px 0", border:"none", background:"none", fontWeight: authTab===t.id?800:500,
                      color: authTab===t.id?"#dc2626":"#64748b", borderBottom: authTab===t.id?"2.5px solid #dc2626":"2.5px solid transparent",
                      cursor:"pointer", fontSize:".88rem", transition:"all .15s" }}>
                    {t.l}
                  </button>
                ))}
              </div>

              <div style={{ padding:"24px 28px" }}>
                {/* Google */}
                <button onClick={handleGoogleAuth}
                  style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                    padding:"11px 16px", border:"1.5px solid #e2e8f0", borderRadius:10, background:"#fff",
                    cursor:"pointer", fontWeight:700, fontSize:".88rem", color:"#0f172a", marginBottom:18 }}>
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Continuer avec Google
                </button>

                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                  <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
                  <span style={{ fontSize:".76rem", color:"#94a3b8", fontWeight:600 }}>ou</span>
                  <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
                </div>

                <form onSubmit={authTab==="register" ? handleAuthRegister : handleAuthLogin} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {authTab === "register" && (
                    <>
                      <input placeholder="Nom complet *" value={authName} onChange={e=>setAuthName(e.target.value)} required
                        style={S.input} />
                      <input placeholder="Téléphone" value={authTel} onChange={e=>setAuthTel(e.target.value)}
                        style={S.input} />
                    </>
                  )}
                  <input type="email" placeholder="Email *" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} required style={S.input} />
                  <input type="password" placeholder="Mot de passe *" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} required style={S.input} />

                  {authError && <p style={{ color:"#dc2626", fontSize:".82rem", margin:0, fontWeight:600 }}>⚠ {authError}</p>}
                  {authSuccess && <p style={{ color:"#059669", fontSize:".82rem", margin:0, fontWeight:600 }}>✅ {authSuccess}</p>}

                  <button type="submit" disabled={authSubmitting}
                    style={{ ...S.btnRed, width:"100%", opacity: authSubmitting ? .7 : 1 }}>
                    {authSubmitting ? "Chargement…" : authTab==="register" ? "Créer mon compte et passer le test →" : "Se connecter →"}
                  </button>
                </form>
              </div>
            </div>
          ) : null)}

          {/* BLOCAGE : test déjà passé */}
          {step === "form" && isLoggedIn && (checkingTest || alreadyTested) && (
            <div style={{ ...S.card, maxWidth:500, animation:"fltSI .45s ease", textAlign:"center", padding:"48px 32px" }}>
              {checkingTest ? (
                <div style={{ color:"#64748b", fontSize:14 }}>Vérification en cours…</div>
              ) : (
                <>
                  <div style={{ fontSize:"3.5rem", marginBottom:16 }}>🎯</div>
                  <h2 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, color:"#0f172a", marginBottom:12 }}>
                    Vous avez déjà passé ce test
                  </h2>
                  <p style={{ color:"#64748b", fontSize:".9rem", lineHeight:1.7, marginBottom:24 }}>
                    Le test de niveau BET est unique et ne peut être passé qu'une seule fois en ligne.
                    Votre résultat et votre programme personnalisé sont disponibles dans votre espace.
                  </p>
                  <p style={{ color:"#94a3b8", fontSize:".82rem", marginBottom:28 }}>
                    Si vous souhaitez repasser le test, rendez-vous directement dans l'un de nos centres BET Languages.
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <button
                      onClick={() => navigate("/mon-espace")}
                      style={{ padding:"13px 28px", background:"linear-gradient(135deg,#dc2626,#1e3a8a)", color:"#fff", border:"none", borderRadius:12, fontWeight:800, fontSize:"1rem", cursor:"pointer" }}
                    >
                      Voir mon résultat →
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      style={{ padding:"10px 24px", background:"none", color:"#64748b", border:"1.5px solid #e2e8f0", borderRadius:12, fontWeight:600, fontSize:".88rem", cursor:"pointer" }}
                    >
                      Retour à l'accueil
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ÉTAPE 1 — FORMULAIRE */}
          {step === "form" && isLoggedIn && !checkingTest && !alreadyTested && (
            <div style={{ ...S.card, maxWidth:500, animation:"fltSI .45s ease" }}>
              <div style={S.formTop}>
                <div style={S.formTopOrb} />
                <span style={S.formTopIcon}>🎓</span>
                <h1 style={S.formH1}>Testez votre niveau gratuitement</h1>
                <p style={S.formSub}>{questions.length} questions · ~{questions.length} minutes · Résultat CECRL immédiat</p>
                <div style={S.formPills}>
                  {["✅ 100% gratuit","📊 A1→C2","📧 Résultat par email","🎯 Programme personnalisé"].map((p, i) => (
                    <span key={i} style={S.formPill}>{p}</span>
                  ))}
                </div>
              </div>

              <div style={S.cardBody}>
                {/* Badge connecté */}
                {isLoggedIn && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:18, fontSize:".82rem", color:"#065f46" }}>
                    <span style={{ fontSize:"1rem" }}>✅</span>
                    <div>
                      <strong>Connecté en tant que {formData.fullname}</strong>
                      <div style={{ fontSize:".76rem", color:"#047857", marginTop:2 }}>Vos informations ont été pré-remplies. Le résultat sera automatiquement enregistré dans votre espace.</div>
                    </div>
                  </div>
                )}

                {/* Profile */}
                <label style={S.fieldLabel}>Vous êtes :</label>
                <div style={S.profileGrid}>
                  {[{v:"particulier",l:"Particulier",i:"👤"},{v:"etudiant",l:"Étudiant",i:"🎒"},{v:"professionnel",l:"Professionnel",i:"💼"},{v:"entreprise",l:"Entreprise",i:"🏢"}].map(p => (
                    <button key={p.v} className="flt-profile-btn" style={{ ...S.profileBtn, ...(formData.profile === p.v ? S.profileBtnActive : {}) }}
                      onClick={() => setFormData(fd => ({ ...fd, profile:p.v }))}>
                      <span style={{ fontSize:"1.3rem" }}>{p.i}</span>
                      <span style={{ fontSize:".76rem", fontWeight: formData.profile === p.v ? 800 : 600 }}>{p.l}</span>
                    </button>
                  ))}
                </div>

                {/* Fields */}
                <div style={{ display:"flex", flexDirection:"column", gap:14, margin:"20px 0" }}>
                  {[
                    { key:"fullname", label:"Nom complet *",   type:"text",  ph:"Jean Kouamé" },
                    { key:"email",    label:"Email *",          type:"email", ph:"jean@exemple.com" },
                    { key:"phone",    label:"Téléphone",        type:"tel",   ph:"+225 07 00 00 00 00" },
                  ].map(f => {
                    const locked = isLoggedIn && f.key === "email";
                    return (
                      <div key={f.key}>
                        <label style={S.fieldLabel}>
                          {f.label}
                          {isLoggedIn && <span style={{ marginLeft:6, fontSize:".72rem", color:"#059669", fontWeight:600 }}>✓ pré-rempli</span>}
                        </label>
                        <input
                          type={f.type}
                          placeholder={f.ph}
                          value={formData[f.key] || ""}
                          readOnly={locked}
                          onChange={e => { if (!locked) { setFormData(fd => ({ ...fd, [f.key]: e.target.value })); setFormErrors(fe => ({ ...fe, [f.key]: null })); } }}
                          style={{
                            ...S.input,
                            ...(formErrors[f.key] ? { borderColor:"#dc2626", boxShadow:"0 0 0 3px rgba(220,38,38,.1)" } : {}),
                            ...(locked ? { background:"#f8fafc", color:"#64748b", cursor:"not-allowed" } : {}),
                          }}
                          onFocus={e => { if (!locked) { e.currentTarget.style.borderColor="#dc2626"; e.currentTarget.style.boxShadow="0 0 0 3px rgba(220,38,38,.1)"; } }}
                          onBlur={e  => { e.currentTarget.style.borderColor=formErrors[f.key]?"#dc2626":"#e2e8f0"; e.currentTarget.style.boxShadow="none"; }}
                        />
                        {formErrors[f.key] && <p style={S.errTxt}>⚠ {formErrors[f.key]}</p>}
                      </div>
                    );
                  })}
                </div>

                {/* Consent */}
                <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", marginBottom:22 }}>
                  <input type="checkbox" checked={formData.consent} onChange={e => setFormData(fd => ({ ...fd, consent:e.target.checked }))} style={{ accentColor:"#dc2626", width:16, height:16, marginTop:2 }} />
                  <span style={{ fontSize:".84rem", color:"#475569", lineHeight:1.6 }}>
                    J'accepte de recevoir des informations personnalisées sur les formations adaptées à mon niveau.
                    <span style={{ color:"#94a3b8" }}> (Données confidentielles · Désinscription facile)</span>
                  </span>
                </label>
                {formErrors.consent && <p style={{ ...S.errTxt, marginTop:-16, marginBottom:12 }}>⚠ Ce champ est requis</p>}

                <button style={{ ...S.btnRed, width:"100%", opacity: submitting ? .7 : 1 }} onClick={handleFormSubmit} disabled={submitting}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background="#b91c1c"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="#dc2626"; }}>
                  {submitting
                    ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}><span style={S.spinner} />Préparation du test...</span>
                    : "Commencer le test →"}
                </button>

                <div style={S.formBenefits}>
                  {[["🕒",`${questions.length} min`],["📊","Niveau A1–C2"],["✅","Résultat immédiat"],["📧","Reçu par email"]].map(([ico, lbl]) => (
                    <div key={lbl} style={{ textAlign:"center", fontSize:".78rem", color:"#94a3b8" }}>
                      <div style={{ fontSize:"1.2rem", marginBottom:3 }}>{ico}</div>{lbl}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 — VOTRE PROJET (wizard style ParcoursModal) */}
          {step === "projet" && (() => {
            const PM_BLUE = "#0891b2";
            const PM_DARK = "#0f172a";
            const PM_NAVY = "#1e3a8a";
            const PM_F    = "'Montserrat','Segoe UI',sans-serif";

            const pmPrimaryBtn = { width:"100%", background:`linear-gradient(135deg,${PM_BLUE},${PM_NAVY})`, color:"#fff", border:"none", borderRadius:999, padding:"12px", fontWeight:800, fontSize:".9rem", cursor:"pointer", fontFamily:PM_F, transition:"opacity .2s" };
            const pmBackBtn    = { background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:".82rem", marginBottom:16, display:"flex", alignItems:"center", gap:4, padding:0 };

            const pHeaderTitle = {
              0: "Comment souhaitez-vous apprendre ?",
              1: "Choisissez votre formule",
              1.5: "Choisissez votre cabinet",
              2: "Choisissez votre assistante",
              3.5: "Mode de paiement",
              4: "Conseillère assignée !",
            }[pStep] || "Votre projet de formation";

            const PMAv = ({ a, size = 48 }) => {
              const ini = `${a.prenom?.[0]||""}${a.nom?.[0]||""}`.toUpperCase();
              return a.photo_url
                ? <img src={a.photo_url} alt={a.prenom} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                : <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${PM_NAVY},${PM_BLUE})`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:size*.3, flexShrink:0, fontFamily:PM_F }}>{ini||"?"}</div>;
            };

            const PMAvatarStack = ({ list = [], size = 28, max = 4 }) => {
              const shown = list.slice(0, max);
              const surplus = list.length - max;
              return (
                <div style={{ display:"flex", alignItems:"center" }}>
                  {shown.map((a, i) => (
                    <div key={a.id} style={{ marginLeft: i ? -size*.3 : 0, zIndex: max - i }}>
                      <PMAv a={a} size={size} />
                    </div>
                  ))}
                  {surplus > 0 && (
                    <div style={{ marginLeft:-size*.3, width:size, height:size, borderRadius:"50%", background:"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*.28, fontWeight:800, color:"#64748b" }}>
                      +{surplus}
                    </div>
                  )}
                </div>
              );
            };

            const totalDots = 4;
            const dotStep   = pStep === 3.5 ? 3 : pStep === 1.5 ? 1 : Math.floor(pStep);

            return (
              <div style={{ ...S.card, maxWidth:560, animation:"fltSI .45s ease", overflow:"hidden" }}>
                {/* Header */}
                <div style={{ background:`linear-gradient(135deg,${PM_DARK},${PM_NAVY})`, padding:"20px 24px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ color:"rgba(255,255,255,.6)", fontSize:".68rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4 }}>Parcours BET Languages</div>
                    <div style={{ color:"#fff", fontWeight:800, fontSize:"1rem", fontFamily:PM_F }}>{pHeaderTitle}</div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding:"24px 24px 28px" }}>

                  {/* Step dots */}
                  {pStep < 4 && (
                    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:24 }}>
                      {Array.from({ length: totalDots }).map((_, i) => (
                        <div key={i} style={{ width: i === dotStep ? 22 : 8, height:8, borderRadius:999, background: i < dotStep ? "#22c55e" : i === dotStep ? PM_BLUE : "#e2e8f0", transition:"all .3s" }} />
                      ))}
                    </div>
                  )}

                  {/* Erreur */}
                  {pErreur && (
                    <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", color:"#dc2626", fontSize:".84rem", marginBottom:16 }}>
                      ⚠️ {pErreur}
                    </div>
                  )}

                  {/* Spinner */}
                  {pLoading && (
                    <div style={{ textAlign:"center", padding:40 }}>
                      <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTopColor:PM_BLUE, borderRadius:"50%", animation:"fltSpin .8s linear infinite", margin:"0 auto 12px" }} />
                      <p style={{ color:"#64748b", fontSize:".88rem", margin:0 }}>Recherche en cours…</p>
                    </div>
                  )}

                  {/* ─── pStep 0 : Mode ─── */}
                  {pStep === 0 && !pLoading && (
                    <div style={{ animation:"pmFU .3s ease" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                        {[
                          { mode:"en_ligne",   icon:"💻", title:"Cours en ligne",   desc:"Coaching groupe ou privé, depuis chez vous.", tags:["Groupe","Privé"],                  color:PM_BLUE },
                          { mode:"presentiel", icon:"🏫", title:"En présentiel",    desc:"Dans l'un de nos cabinets en Côte d'Ivoire.", tags:["6 centres","Abidjan & Bouaké"], color:PM_NAVY },
                        ].map(o => (
                          <div key={o.mode} className="pm-card" onClick={() => pChoisirMode(o.mode)}
                            style={{ border:"2px solid #e2e8f0", borderRadius:16, padding:"22px 18px", cursor:"pointer", transition:"all .22s", textAlign:"center", background:"#fafafa" }}>
                            <div style={{ fontSize:"2.4rem", marginBottom:10 }}>{o.icon}</div>
                            <div style={{ fontWeight:800, color:PM_DARK, fontSize:".96rem", marginBottom:6, fontFamily:PM_F }}>{o.title}</div>
                            <div style={{ fontSize:".77rem", color:"#475569", lineHeight:1.6, marginBottom:12 }}>{o.desc}</div>
                            <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap", marginBottom:14 }}>
                              {o.tags.map(t => <span key={t} style={{ background:o.color+"15", color:o.color, borderRadius:999, padding:"2px 10px", fontSize:".68rem", fontWeight:700 }}>{t}</span>)}
                            </div>
                            <div style={{ background:`linear-gradient(135deg,${o.color},${o.mode==="en_ligne"?PM_NAVY:PM_BLUE})`, color:"#fff", borderRadius:999, padding:"9px 0", fontWeight:800, fontSize:".82rem", fontFamily:PM_F }}>Choisir →</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ─── pStep 1 : offres en ligne (même design que ParcoursModal step 1) ─── */}
                  {pStep === 1 && !pLoading && (
                    <div style={{ animation:"pmFU .3s ease" }}>
                      <button onClick={() => setPStep(0)} style={pmBackBtn}>← Retour</button>
                      <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:20, lineHeight:1.6 }}>
                        Découvrez nos formules de cours en ligne. Apprenez où que vous soyez, à votre rythme, avec nos assistantes dédiées.
                      </p>
                      {pOffresEnLigne.length === 0 ? (
                        <div style={{ textAlign:"center", padding:"36px 20px", background:"#f8fafc", borderRadius:16, border:"1.5px dashed #e2e8f0" }}>
                          <div style={{ fontSize:"2rem", marginBottom:10 }}>💻</div>
                          <p style={{ color:"#64748b", fontSize:".88rem", lineHeight:1.6, margin:0 }}>
                            Nos offres seront disponibles très prochainement.<br />
                            <strong>Contactez-nous</strong> pour en savoir plus.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="pm-grid2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
                            {pOffresEnLigne.map((o, i) => {
                              const COLORS = [PM_BLUE, PM_NAVY, "#059669", "#d97706", "#7c3aed", "#dc2626"];
                              const col = COLORS[i % COLORS.length];
                              return (
                                <div key={o.id || i} className="pm-card"
                                  onClick={() => pChoisirOffreEnLigne(o)}
                                  style={{ border:"2px solid #e2e8f0", borderRadius:18, padding:"18px 16px", cursor:"pointer", transition:"all .22s", background:"#fafafa", display:"flex", flexDirection:"column", gap:10 }}>
                                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                                    <div style={{ width:44, height:44, borderRadius:12, background:`${col}15`, border:`2px solid ${col}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", flexShrink:0 }}>
                                      {o.icon || "💻"}
                                    </div>
                                    <div style={{ textAlign:"right" }}>
                                      <div style={{ fontWeight:800, fontSize:".88rem", color:col, fontFamily:PM_F }}>{o.prix || "Sur devis"}</div>
                                      {o.duration && <div style={{ fontSize:".68rem", color:"#94a3b8", marginTop:1 }}>{o.duration}</div>}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontWeight:800, fontSize:".88rem", color:PM_DARK, fontFamily:PM_F, marginBottom:4, lineHeight:1.3 }}>{o.label}</div>
                                    {o.desc && <div style={{ fontSize:".74rem", color:"#64748b", lineHeight:1.5 }}>{o.desc}</div>}
                                  </div>
                                  {o.brochure_url && (
                                    <a href={o.brochure_url} download={o.brochure_nom || true} target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      style={{ display:"flex", alignItems:"center", gap:6, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:8, padding:"6px 10px", textDecoration:"none", marginTop:"auto" }}>
                                      <span style={{ fontSize:".8rem" }}>📄</span>
                                      <span style={{ fontSize:".7rem", fontWeight:700, color:PM_BLUE, flex:1 }}>{o.brochure_nom || "Télécharger la brochure"}</span>
                                      <span style={{ fontSize:".62rem", fontWeight:700, color:"#94a3b8", background:"#f1f5f9", borderRadius:4, padding:"1px 5px" }}>PDF</span>
                                    </a>
                                  )}
                                  <div style={{ background:`linear-gradient(135deg,${col},${PM_NAVY})`, color:"#fff", borderRadius:999, padding:"8px 0", fontWeight:800, fontSize:".74rem", textAlign:"center", fontFamily:PM_F, marginTop:"auto" }}>
                                    Choisir cette offre →
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ textAlign:"center" }}>
                            <button onClick={pContinuerSansOffreEnLigne}
                              style={{ background:"none", border:"none", color:"#94a3b8", fontSize:".78rem", cursor:"pointer", textDecoration:"underline", fontFamily:PM_F }}>
                              Continuer sans sélectionner d'offre →
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ─── pStep 1.5 présentiel : cabinets (même design que ParcoursModal p1) ─── */}
                  {pStep === 1.5 && !pLoading && (
                    <div style={{ animation:"pmFU .3s ease" }}>
                      <button onClick={() => setPStep(0)} style={pmBackBtn}>← Retour</button>
                      <p style={{ color:"#64748b", fontSize:".82rem", marginBottom:16, lineHeight:1.6 }}>
                        Sélectionnez un cabinet et choisissez votre formule pour continuer.
                      </p>
                      {pCentres.length === 0
                        ? <p style={{ color:"#94a3b8", textAlign:"center", padding:20 }}>Chargement des centres…</p>
                        : (
                          <div className="pm-centre-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                            {pCentres.map(c => {
                              const master     = pFindMaster(c);
                              const color      = master?.color || PM_NAVY;
                              const offres     = (master?.offres || []).filter(o => o.actif !== false);
                              const assistList = pCentreAssistantesMap[c.id] || [];
                              const isOpen_    = pSelectedCentreCard === c.id;
                              const offreOk    = isOpen_ && pOffreChoisie && pSelectedCentreCard === c.id;
                              const prixList   = offres.map(o => parseInt((o.prix||"").replace(/\D/g,""))||0).filter(Boolean);
                              const minPrix    = prixList.length ? Math.min(...prixList) : null;
                              return (
                                <div key={c.id}
                                  onClick={() => setPSelectedCentreCard(isOpen_ ? null : c.id)}
                                  style={{ gridColumn: isOpen_ ? "1 / -1" : "auto",
                                    border:`2px solid ${isOpen_ ? color : "#e2e8f0"}`, borderRadius:16,
                                    background: isOpen_ ? `${color}06` : "#fff",
                                    cursor:"pointer", transition:"all .22s", overflow:"hidden",
                                    boxShadow: isOpen_ ? `0 8px 24px ${color}20` : "none" }}>
                                  <div style={{ height:4, background: isOpen_ ? color : "#e2e8f0", transition:"background .2s" }} />
                                  <div style={{ padding:"14px 16px" }}>
                                    <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                                      <div style={{ width:42, height:42, borderRadius:10, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", flexShrink:0 }}>🏢</div>
                                      <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ fontWeight:800, fontSize:".9rem", color: isOpen_ ? color : PM_DARK, lineHeight:1.2 }}>{c.nom}</div>
                                        {c.ville && <div style={{ fontSize:".72rem", color:"#64748b", marginTop:2 }}>{c.ville}</div>}
                                        {c.adresse && <div style={{ fontSize:".68rem", color:"#94a3b8", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.adresse}</div>}
                                      </div>
                                      <div style={{ color: isOpen_ ? color : "#94a3b8", fontWeight:800, fontSize:"1rem", transition:"transform .2s", transform: isOpen_ ? "rotate(90deg)" : "none" }}>›</div>
                                    </div>
                                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                        {assistList.length > 0
                                          ? <PMAvatarStack list={assistList} size={28} max={4} />
                                          : <span style={{ fontSize:".7rem", color:"#94a3b8" }}>—</span>
                                        }
                                        {assistList.length > 0 && (
                                          <span style={{ fontSize:".7rem", color:"#64748b", fontWeight:600 }}>
                                            {assistList.length} assistante{assistList.length > 1 ? "s" : ""}
                                          </span>
                                        )}
                                      </div>
                                      {minPrix && (
                                        <span style={{ background:`${color}12`, color, borderRadius:999, padding:"2px 8px", fontSize:".66rem", fontWeight:800 }}>
                                          Dès {minPrix.toLocaleString("fr")} F
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isOpen_ && (
                                    <div style={{ borderTop:`1px solid ${color}30`, padding:"14px 16px", animation:"pmFU .2s ease" }}
                                      onClick={e => e.stopPropagation()}>
                                      {master?.brochure_url && (
                                        <a href={master.brochure_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                          style={{ display:"flex", alignItems:"center", gap:6, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:8, padding:"7px 10px", marginBottom:14, textDecoration:"none" }}>
                                          <span style={{ fontSize:".9rem" }}>📄</span>
                                          <span style={{ fontSize:".72rem", fontWeight:700, color:PM_BLUE, flex:1 }}>Télécharger la brochure</span>
                                          <span style={{ fontSize:".62rem", fontWeight:700, color:"#94a3b8", background:"#f1f5f9", borderRadius:4, padding:"1px 5px" }}>PDF</span>
                                        </a>
                                      )}
                                      {offres.length === 0 ? (
                                        <p style={{ fontSize:".78rem", color:"#94a3b8", margin:"0 0 12px", textAlign:"center" }}>Contactez-nous pour les tarifs.</p>
                                      ) : (
                                        <>
                                          <p style={{ fontSize:".72rem", fontWeight:700, color:"#374151", marginBottom:10, textTransform:"uppercase", letterSpacing:".05em" }}>
                                            Choisissez votre formule
                                          </p>
                                          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                                            {offres.map((o, i) => {
                                              const sel = pOffreChoisie?.label === o.label && pSelectedCentreCard === c.id;
                                              return (
                                                <div key={i} onClick={() => setPOffreChoisie(o)}
                                                  style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 13px", borderRadius:12,
                                                    border:`2px solid ${sel ? color : "#e2e8f0"}`,
                                                    background: sel ? `${color}08` : "#f8fafc",
                                                    cursor:"pointer", transition:"all .15s" }}>
                                                  <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${sel ? color : "#cbd5e1"}`,
                                                    background: sel ? color : "#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                                    {sel && <div style={{ width:7, height:7, borderRadius:"50%", background:"#fff" }} />}
                                                  </div>
                                                  <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ fontWeight:700, fontSize:".82rem", color: sel ? color : PM_DARK }}>{o.label}</div>
                                                    {o.desc && <div style={{ fontSize:".7rem", color:"#64748b", marginTop:1 }}>{o.desc}</div>}
                                                  </div>
                                                  <div style={{ textAlign:"right", flexShrink:0 }}>
                                                    <div style={{ fontWeight:800, fontSize:".82rem", color: sel ? color : PM_DARK }}>{o.prix}</div>
                                                    {o.duration && <div style={{ fontSize:".66rem", color:"#94a3b8" }}>{o.duration}</div>}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </>
                                      )}
                                      <button onClick={() => pChoisirCentre(c)}
                                        disabled={offres.length > 0 && !offreOk}
                                        style={{ width:"100%", padding:"11px", borderRadius:999,
                                          background: (offres.length === 0 || offreOk) ? `linear-gradient(135deg,${color},${PM_DARK})` : "#e5e7eb",
                                          color: (offres.length === 0 || offreOk) ? "#fff" : "#94a3b8",
                                          border:"none", cursor: (offres.length === 0 || offreOk) ? "pointer" : "default",
                                          fontWeight:800, fontSize:".84rem", fontFamily:PM_F, transition:"all .2s" }}>
                                        {offres.length > 0 && !offreOk
                                          ? "Sélectionnez une formule ↑"
                                          : `Continuer avec ${c.nom.replace(/^BET\s*/i,"")} →`}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )
                      }
                    </div>
                  )}

                  {/* ─── pStep 2 en_ligne : assistantes (même design que ParcoursModal step 2) ─── */}
                  {pStep === 2 && pModeCours === "en_ligne" && !pLoading && (
                    <div style={{ animation:"pmFU .3s ease" }}>
                      <button onClick={() => setPStep(1)} style={pmBackBtn}>← Retour aux offres</button>
                      {pOffreChoisie && (
                        <div style={{ display:"flex", alignItems:"center", gap:10, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"10px 14px", marginBottom:16 }}>
                          <span style={{ fontSize:"1.1rem" }}>{pOffreChoisie.icon || "💻"}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:800, fontSize:".82rem", color:PM_DARK }}>{pOffreChoisie.label}</div>
                            <div style={{ fontSize:".72rem", color:"#64748b" }}>{pOffreChoisie.prix}{pOffreChoisie.duration ? ` · ${pOffreChoisie.duration}` : ""}</div>
                          </div>
                          <button onClick={() => { setPOffreChoisie(null); setPStep(1); }} style={{ background:"none", border:"none", fontSize:".72rem", color:"#94a3b8", cursor:"pointer", fontWeight:700 }}>Changer</button>
                        </div>
                      )}
                      <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:16, lineHeight:1.6 }}>
                        Choisissez l'assistante qui vous accompagnera tout au long de votre parcours en ligne.
                      </p>
                      {pAssistantes.length === 0 ? (
                        <div style={{ textAlign:"center", padding:"32px 20px", background:"#f8fafc", borderRadius:14, border:"1.5px dashed #e2e8f0" }}>
                          <div style={{ fontSize:"1.8rem", marginBottom:10 }}>😔</div>
                          <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6, margin:0 }}>Toutes nos assistantes ont atteint leur quota aujourd'hui.<br/><strong>Contactez-nous directement.</strong></p>
                        </div>
                      ) : (
                        <div className="pm-assist-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                          {pAssistantes.map(a => {
                            const placesRestantes = (a.quota_jour || 5) - (a.prises_aujourd_hui || 0);
                            const wa = a.telephone
                              ? `https://wa.me/${a.telephone.replace(/\D/g,"")}?text=${encodeURIComponent(`Bonjour ${a.prenom}, je souhaite m'inscrire à un cours BET en ligne${pOffreChoisie ? ` — ${pOffreChoisie.label}` : ""}.`)}`
                              : null;
                            return (
                              <div key={a.id} className="pm-assist-card" onClick={() => pChoisirAssistante(a)}
                                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, border:"2px solid #e2e8f0", borderRadius:18, padding:"20px 14px 16px", cursor:"pointer", transition:"all .22s", background:"#fff", textAlign:"center" }}>
                                <div style={{ position:"relative" }}>
                                  <PMAv a={a} size={72} />
                                  <span style={{ position:"absolute", bottom:0, right:0, width:16, height:16, borderRadius:"50%", background:"#22c55e", border:"2.5px solid #fff" }} />
                                </div>
                                <div>
                                  <div style={{ fontWeight:800, fontSize:".88rem", color:PM_DARK, fontFamily:PM_F, lineHeight:1.3 }}>{a.prenom} {a.nom}</div>
                                  <div style={{ fontSize:".68rem", color:"#94a3b8", marginTop:3 }}>Assistante · En ligne</div>
                                </div>
                                {a.telephone && (
                                  <div style={{ fontSize:".72rem", color:"#334155", fontWeight:600 }}>📞 {a.telephone}</div>
                                )}
                                <span style={{ background:`${PM_BLUE}14`, color:PM_BLUE, borderRadius:999, padding:"3px 10px", fontSize:".66rem", fontWeight:700 }}>
                                  {placesRestantes} place{placesRestantes > 1 ? "s" : ""} restante{placesRestantes > 1 ? "s" : ""}
                                </span>
                                {wa && (
                                  <a href={wa} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, width:"100%", padding:"8px 0", background:"#25d366", color:"#fff", borderRadius:999, textDecoration:"none", fontWeight:700, fontSize:".74rem", fontFamily:PM_F, marginTop:"auto" }}>
                                    <span>💬</span> WhatsApp
                                  </a>
                                )}
                                <div style={{ width:"100%", padding:"7px 0", background:`linear-gradient(135deg,${PM_BLUE},${PM_NAVY})`, color:"#fff", borderRadius:999, fontWeight:800, fontSize:".72rem", fontFamily:PM_F }}>
                                  Choisir →
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── pStep 2 présentiel : assistantes (même design que ParcoursModal p2) ─── */}
                  {pStep === 2 && pModeCours === "presentiel" && !pLoading && (
                    <div style={{ animation:"pmFU .3s ease" }}>
                      <button onClick={() => { setPStep(1.5); setPSelectedCentreCard(pCentreChoisi?.id); }} style={pmBackBtn}>← Retour</button>
                      {pOffreChoisie && (
                        <div style={{ display:"flex", alignItems:"center", gap:10, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
                          <span style={{ fontSize:"1rem" }}>✅</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, fontSize:".82rem", color:"#065f46" }}>{pOffreChoisie.label}</div>
                            <div style={{ fontSize:".72rem", color:"#047857" }}>{pOffreChoisie.prix}{pOffreChoisie.duration ? ` · ${pOffreChoisie.duration}` : ""}</div>
                          </div>
                          <button onClick={() => setPStep(1.5)} style={{ background:"none", border:"none", fontSize:".7rem", color:"#059669", cursor:"pointer", fontWeight:700 }}>Changer</button>
                        </div>
                      )}
                      <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:16 }}>
                        {pAssistantes.length} assistante{pAssistantes.length > 1 ? "s" : ""} — {pCentreChoisi?.nom}
                      </p>
                      {pAssistantes.length === 0 ? (
                        <div style={{ textAlign:"center", padding:"32px 20px", background:"#f8fafc", borderRadius:14, border:"1.5px dashed #e2e8f0" }}>
                          <div style={{ fontSize:"1.8rem", marginBottom:10 }}>😔</div>
                          <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6 }}>
                            Aucune assistante assignée à ce centre.<br/>
                            <strong>Contactez-nous directement</strong> pour être pris(e) en charge.
                          </p>
                        </div>
                      ) : (
                        <div className="pm-assist-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                          {pAssistantes.map(a => {
                            const JOURS_SEMAINE_ = ["lundi","mardi","mercredi","jeudi","vendredi"];
                            const JOURS_WEEKEND_ = ["samedi","dimanche"];
                            const JOURS_COURT_   = { lundi:"Lun", mardi:"Mar", mercredi:"Mer", jeudi:"Jeu", vendredi:"Ven", samedi:"Sam", dimanche:"Dim" };
                            const jours      = a.jours_travail || JOURS_SEMAINE_;
                            const hasSemaine = jours.some(j => JOURS_SEMAINE_.includes(j));
                            const hasWeekend = jours.some(j => JOURS_WEEKEND_.includes(j));
                            const master     = pFindMaster(pCentreChoisi || {});
                            const color      = master?.color || PM_NAVY;
                            return (
                              <div key={a.id} className="pm-assist-card" onClick={() => pChoisirAssistante(a)}
                                style={{ border:"2px solid #e2e8f0", borderRadius:18, padding:"18px 14px", cursor:"pointer", transition:"all .22s", background:"#fff", textAlign:"center" }}>
                                <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                                  <PMAv a={a} size={68} />
                                </div>
                                <div style={{ fontWeight:800, fontSize:".9rem", color:PM_DARK, marginBottom:2 }}>{a.prenom} {a.nom}</div>
                                <div style={{ fontSize:".72rem", color:"#94a3b8", marginBottom: a.telephone ? 4 : 8 }}>Assistante BET</div>
                                {a.telephone && (
                                  <div style={{ fontSize:".72rem", color:PM_BLUE, fontWeight:700, marginBottom:8 }}>📞 {a.telephone}</div>
                                )}
                                <div style={{ marginBottom:8 }}>
                                  <div style={{ display:"flex", gap:3, justifyContent:"center", flexWrap:"wrap" }}>
                                    {jours.map(j => (
                                      <span key={j} style={{ fontSize:".58rem", fontWeight:800, padding:"2px 6px", borderRadius:4, background: JOURS_WEEKEND_.includes(j) ? "#fef3c7" : "#eff6ff", color: JOURS_WEEKEND_.includes(j) ? "#92400e" : "#1e40af" }}>
                                        {JOURS_COURT_[j] || j}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div style={{ display:"flex", gap:5, justifyContent:"center", flexWrap:"wrap", marginBottom:12 }}>
                                  {hasSemaine && <span style={{ fontSize:".65rem", padding:"3px 8px", borderRadius:999, background:"#eff6ff", color:"#1e40af", fontWeight:700 }}>📆 Semaine</span>}
                                  {hasWeekend && <span style={{ fontSize:".65rem", padding:"3px 8px", borderRadius:999, background:"#fef3c7", color:"#92400e", fontWeight:700 }}>📅 Weekend</span>}
                                </div>
                                <div style={{ background:`linear-gradient(135deg,${color},${PM_DARK})`, color:"#fff", borderRadius:999, padding:"8px 0", fontWeight:800, fontSize:".76rem", fontFamily:PM_F }}>
                                  Choisir →
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── pStep 3.5 : Paiement — Coaching de groupe ─── */}
                  {pStep === 3.5 && (
                    <div style={{ animation:"pmFU .3s ease" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
                        <PMAv a={pAssistante} size={40} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:800, fontSize:".85rem", color:PM_DARK }}>{pAssistante?.prenom} {pAssistante?.nom}</div>
                          <div style={{ fontSize:".72rem", color:"#64748b" }}>
                            {pModeCours === "en_ligne" ? "En ligne" : `Présentiel · ${pCentreChoisi?.nom || ""}`} · Coaching de groupe
                          </div>
                        </div>
                        <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"3px 10px", fontSize:".7rem", fontWeight:700, flexShrink:0 }}>✓ Sélectionnée</span>
                      </div>
                      <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:14, lineHeight:1.6 }}>
                        Choisissez votre mode de paiement pour finaliser votre inscription au coaching de groupe.
                      </p>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
                        {[
                          { mode:"en_ligne",     icon:"💻", label:"En ligne",     sub:"Plateforme sécurisée" },
                          { mode:"especes",      icon:"💵", label:"Espèces",      sub:"Au cabinet BET" },
                          { mode:"mobile_money", icon:"📱", label:"Mobile Money", sub:"Ria, MoneyGram…" },
                        ].map(opt => (
                          <div key={opt.mode} onClick={() => { setPModePaiement(opt.mode); if (opt.mode !== "mobile_money") setPMmOption(null); }}
                            style={{ border:`2px solid ${pModePaiement===opt.mode ? PM_BLUE : "#e2e8f0"}`, borderRadius:14, padding:"14px 10px", cursor:"pointer", textAlign:"center", background: pModePaiement===opt.mode ? `${PM_BLUE}08` : "#fafafa", transition:"all .18s" }}>
                            <div style={{ fontSize:"1.5rem", marginBottom:6 }}>{opt.icon}</div>
                            <div style={{ fontWeight:800, fontSize:".78rem", color:PM_DARK, marginBottom:2 }}>{opt.label}</div>
                            <div style={{ fontSize:".68rem", color:"#94a3b8", lineHeight:1.4 }}>{opt.sub}</div>
                            {pModePaiement===opt.mode && <div style={{ width:8, height:8, borderRadius:"50%", background:PM_BLUE, margin:"8px auto 0" }} />}
                          </div>
                        ))}
                      </div>
                      {pModePaiement === "mobile_money" && (
                        <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px 14px", marginBottom:16, animation:"pmFU .2s ease" }}>
                          <div style={{ fontSize:".75rem", fontWeight:700, color:"#475569", marginBottom:10 }}>Choisissez l'opérateur :</div>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            {[{ val:"ria",label:"Ria" },{ val:"moneygram",label:"MoneyGram" },{ val:"autres",label:"Autres" }].map(op => (
                              <button key={op.val} onClick={() => setPMmOption(op.val)}
                                style={{ padding:"8px 16px", borderRadius:999, border:`2px solid ${pMmOption===op.val ? PM_BLUE : "#e2e8f0"}`, background: pMmOption===op.val ? `${PM_BLUE}10` : "#fff", color: pMmOption===op.val ? PM_BLUE : "#475569", fontWeight:700, fontSize:".82rem", cursor:"pointer", transition:"all .15s" }}>
                                {op.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => pDoSubmit(pAssistante)}
                        disabled={!pModePaiement || (pModePaiement==="mobile_money" && !pMmOption) || pSubmitting}
                        style={{ ...pmPrimaryBtn, opacity:(!pModePaiement||(pModePaiement==="mobile_money"&&!pMmOption)||pSubmitting)?.5:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                      >
                        {pSubmitting
                          ? <><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"fltSpin .7s linear infinite" }} />Assignation…</>
                          : "Confirmer mon inscription →"}
                      </button>
                    </div>
                  )}

                  {/* ─── pStep 4 : Succès → passer le test ─── */}
                  {pStep === 4 && (
                    <div style={{ animation:"pmFU .4s ease" }}>
                      <div style={{ textAlign:"center", marginBottom:22 }}>
                        <div style={{ width:70,height:70,borderRadius:"50%",background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",margin:"0 auto 14px",boxShadow:"0 8px 24px rgba(34,197,94,.3)" }}>✓</div>
                        <h3 style={{ fontFamily:PM_F, color:PM_DARK, fontWeight:800, fontSize:"1.2rem", margin:"0 0 6px" }}>Assistante assignée !</h3>
                        <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6, margin:0 }}>
                          <strong>{pAssistante?.prenom} {pAssistante?.nom}</strong> a été notifiée et vous contactera après votre test.
                        </p>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:14, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
                        <PMAv a={pAssistante} size={50} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:800, color:PM_DARK, fontSize:".95rem" }}>{pAssistante?.prenom} {pAssistante?.nom}</div>
                          <div style={{ fontSize:".74rem", color:"#64748b", marginTop:2 }}>
                            {pModeCours==="en_ligne" ? `En ligne · ${pTypeCoaching==="groupe"?"Groupe":"Privé"}` : `Présentiel · ${pCentreChoisi?.nom||""}`}
                          </div>
                          {pAssistante?.telephone && <div style={{ fontSize:".74rem", color:PM_BLUE, marginTop:3 }}>📞 {pAssistante.telephone}</div>}
                        </div>
                        <span style={{ background:"#dcfce7", color:"#16a34a", borderRadius:999, padding:"4px 10px", fontSize:".7rem", fontWeight:800, flexShrink:0 }}>✓ Assignée</span>
                      </div>
                      {pAssistante?.telephone && (
                        <a
                          href={`https://wa.me/${(pAssistante.telephone||"").replace(/[\s+\-()]/g,"")}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ display:"flex", alignItems:"center", gap:12, background:"#22c55e", color:"#fff", borderRadius:12, padding:"12px 18px", textDecoration:"none", fontWeight:800, fontSize:".9rem", fontFamily:PM_F, marginBottom:10 }}
                        >
                          <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fff" fillOpacity=".2"/><path d="M23.5 19.9c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2c-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4-.1-.5-.1-.2-.7-1.8-1-2.4-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.3 4.7 2 .9 2.7.9 3.7.8.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" fill="#fff"/></svg>
                          Écrire sur WhatsApp
                        </a>
                      )}
                      <button onClick={() => setStep("quiz")}
                        style={{ ...pmPrimaryBtn, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                        <span style={{ fontSize:"1.1rem" }}>🎯</span>
                        Passer le test maintenant →
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })()}

          {/* ÉTAPE 3 — QUIZ */}
          {step === "quiz" && q && (() => {
            const qTypeMeta = Q_TYPE_LABEL[q.type] || Q_TYPE_LABEL.qcm;
            const isQcmLike = ["qcm","audio_qcm","lecture_qcm"].includes(q.type);
            const opts      = (q.options || []).filter(Boolean);

            return (
              <div style={{ ...S.card, maxWidth:700, animation:"fltSI .35s ease" }}>
                {/* Header */}
                <div style={S.quizTop}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={S.quizQLabel}>Question <strong>{currentQ+1}</strong>/{questions.length}</span>
                    <span style={{ ...S.catChip, background:"#f1f5f9", color:"#475569" }}>
                      {qTypeMeta.icon} {qTypeMeta.label}
                    </span>
                    <span style={{ ...S.catChip, background:cs.bg, color:cs.c }}>{q.category}</span>
                    <span style={S.cefrChip}>{q.cefr}</span>
                    {q.type !== "libre" && <span style={S.ptsChip}>{q.points||1} pt{(q.points||1)>1?"s":""}</span>}
                  </div>
                  <span style={{ fontSize:".82rem", color:"#64748b" }}>{answered}/{questions.length} répondues</span>
                </div>

                <div style={{ padding:"0 24px 4px" }}>
                  <PBar value={answeredRequired} max={requiredCount} color="#10b981" height={6} />
                </div>

                <div style={S.dotsRow}>
                  {questions.map((qq, i) => (
                    <button key={qq.id} className="flt-nav-dot" style={{
                      ...S.dot,
                      width: i === currentQ ? 26 : 10,
                      borderRadius: i === currentQ ? 5 : "50%",
                      background: i === currentQ ? "#dc2626" : answers[qq.id] ? "#10b981" : "#e2e8f0",
                      boxShadow: i === currentQ ? "0 0 8px rgba(220,38,38,.4)" : "none",
                    }} onClick={() => setCurrentQ(i)} />
                  ))}
                </div>

                <div style={S.cardBody}>

                  {/* ── SPEAKING : audio stimulus + enregistreur ── */}
                  {q.type === "speaking" && (
                    <div>
                      {q.audio_url && (
                        <div style={S.audioBox}>
                          <div style={S.audioLabel}>
                            🎧 <strong>Écoutez cet audio</strong>, puis enregistrez votre réponse orale ci-dessous
                          </div>
                          <audio key={q.audio_url} controls controlsList="nodownload" crossOrigin="anonymous"
                            src={q.audio_url} style={{ width:"100%", borderRadius:12, marginTop:10 }} />
                          <p style={{ fontSize:".78rem", color:"#9d174d", margin:"8px 0 0", fontWeight:600 }}>
                            💡 Vous pouvez écouter plusieurs fois avant d'enregistrer
                          </p>
                        </div>
                      )}
                      <AudioRecorder
                        existingUrl={answers[q.id]?.startsWith("http") ? answers[q.id] : null}
                        onRecordingComplete={(url) => setAnswers(p => ({ ...p, [q.id]: url || "" }))}
                      />
                    </div>
                  )}

                  {/* ── LISTENING : lecteur audio ou script texte ── */}
                  {q.type === "audio_qcm" && (
                    q.audio_url ? (
                      <div style={S.audioBox}>
                        <div style={S.audioLabel}>🎧 <strong>Écoutez attentivement</strong>, puis répondez à la question ci-dessous</div>
                        <audio key={q.audio_url} controls controlsList="nodownload" crossOrigin="anonymous" src={q.audio_url} style={{ width:"100%", borderRadius:12, marginTop:10 }} />
                        <p style={{ fontSize:".78rem", color:"#9d174d", margin:"8px 0 0", fontWeight:600 }}>💡 Vous pouvez écouter plusieurs fois avant de répondre</p>
                      </div>
                    ) : q.script ? (
                      <div style={{ background:"#fdf2f8", border:"1.5px solid #f0abfc", borderRadius:14, padding:"16px 18px", marginBottom:16 }}>
                        <div style={{ fontSize:".82rem", fontWeight:700, color:"#9d174d", marginBottom:10 }}>🎧 Transcript de l'audio — lisez attentivement</div>
                        <div style={{ fontSize:".84rem", color:"#374151", lineHeight:1.75, whiteSpace:"pre-wrap", background:"#fff", borderRadius:8, padding:"12px 14px", border:"1px solid #f0abfc40" }}>
                          {q.script}
                        </div>
                      </div>
                    ) : null
                  )}

                  {/* ── READING : passage texte ── */}
                  {q.type === "lecture_qcm" && q.passage && (
                    <div style={S.passageBox}>
                      <div style={S.passageLabel}>📖 <strong>Lisez ce texte</strong> puis répondez à la question :</div>
                      <div style={S.passageTxt}>{q.passage}</div>
                    </div>
                  )}

                  {/* ── Texte question ── */}
                  {q.text && <p style={S.questionTxt}>{q.text}</p>}

                  {/* ── QCM (qcm / audio_qcm / lecture_qcm) ── */}
                  {isQcmLike && opts.length > 0 && (
                    <div style={{ ...S.optsGrid, gridTemplateColumns: opts.length === 2 ? "1fr 1fr" : "1fr 1fr" }}>
                      {opts.map((opt, idx) => {
                        const sel = answers[q.id] === opt;
                        return (
                          <button key={idx} className={sel ? "" : "flt-opt"} style={{
                            ...S.opt,
                            border: sel ? "2px solid #dc2626" : "1.5px solid #e2e8f0",
                            background: sel ? "#fef2f2" : "#fff",
                            color: sel ? "#dc2626" : "#334155",
                            fontWeight: sel ? 700 : 500,
                            transform: sel ? "scale(1.01)" : "scale(1)",
                          }} onClick={() => handleAnswer(q.id, opt)}>
                            <span style={{ ...S.optRadio, borderColor: sel?"#dc2626":"#d1d5db", background: sel?"#dc2626":"transparent" }}>
                              {sel && <span style={{ width:7, height:7, borderRadius:"50%", background:"#fff", display:"block" }} />}
                            </span>
                            <span style={S.optLetter}>{["A","B","C","D","E","F"][idx]}</span>
                            <span style={{ flex:1, textAlign:"left", lineHeight:1.4 }}>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ── VRAI / FAUX ── */}
                  {q.type === "vrai_faux" && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, margin:"8px 0 20px" }}>
                      {["Vrai","Faux"].map(opt => {
                        const sel = answers[q.id] === opt;
                        return (
                          <button key={opt} onClick={() => handleAnswer(q.id, opt)} style={{
                            padding:"20px 12px", borderRadius:16, fontWeight:800, fontSize:"1.1rem",
                            border: sel ? "2.5px solid #dc2626" : "1.5px solid #e2e8f0",
                            background: sel ? "#fef2f2" : "#fff",
                            color: sel ? "#dc2626" : "#334155",
                            cursor:"pointer", transition:"all .2s",
                            display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                            boxShadow: sel ? "0 4px 16px rgba(220,38,38,.15)" : "none",
                          }}>
                            <span style={{ fontSize:"2rem" }}>{opt==="Vrai"?"✅":"❌"}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ── TEXTE À TROUS ── */}
                  {q.type === "texte_trous" && (
                    <div style={{ margin:"4px 0 20px" }}>
                      <p style={{ fontSize:".84rem", color:"#475569", marginBottom:10 }}>
                        ✏️ <strong>Complétez la phrase</strong> en tapant le mot manquant :
                      </p>
                      <input
                        type="text"
                        placeholder="Votre réponse…"
                        value={answers[q.id] || ""}
                        onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                        onFocus={e => { e.currentTarget.style.borderColor="#dc2626"; e.currentTarget.style.boxShadow="0 0 0 3px rgba(220,38,38,.1)"; }}
                        onBlur={e  => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.boxShadow="none"; }}
                        style={{ ...S.input, fontSize:"1.05rem", fontWeight:600, textAlign:"center", letterSpacing:".05em", maxWidth:320, margin:"0 auto", display:"block" }}
                      />
                      <p style={{ fontSize:".76rem", color:"#94a3b8", textAlign:"center", marginTop:8 }}>
                        La casse n'a pas d'importance (majuscules/minuscules)
                      </p>
                    </div>
                  )}

                  {/* ── QUESTION LIBRE (Writing) ── */}
                  {q.type === "libre" && (
                    <div style={{ margin:"4px 0 20px" }}>
                      <div style={{ background:"#faf5ff", border:"1px solid #ddd6fe", borderRadius:12, padding:"12px 16px", marginBottom:14 }}>
                        <p style={{ margin:0, fontSize:".84rem", color:"#6d28d9", fontWeight:600 }}>
                          ✍️ <strong>Expression écrite</strong> — Répondez en anglais dans le champ ci-dessous.
                          <span style={{ fontWeight:400, display:"block", marginTop:4, color:"#7c3aed" }}>
                            Votre réponse sera corrigée par votre conseillère BET sous 24h.
                            {q.minWords && ` Minimum : ~${q.minWords} mots.`}
                          </span>
                        </p>
                      </div>
                      <textarea
                        placeholder="Write your answer in English here…"
                        value={answers[q.id] || ""}
                        onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                        rows={7}
                        onFocus={e => { e.currentTarget.style.borderColor="#7c3aed"; e.currentTarget.style.boxShadow="0 0 0 3px rgba(124,58,237,.1)"; }}
                        onBlur={e  => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.boxShadow="none"; }}
                        style={{ ...S.input, resize:"vertical", fontSize:".95rem", lineHeight:1.7 }}
                      />
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                        <span style={{ fontSize:".76rem", color:"#94a3b8" }}>
                          {(answers[q.id]||"").trim().split(/\s+/).filter(Boolean).length} mots
                          {q.minWords ? ` / min. ${q.minWords}` : ""}
                        </span>
                        <span style={{ fontSize:".76rem", color:"#94a3b8" }}>{(answers[q.id]||"").length} caractères</span>
                      </div>
                    </div>
                  )}

                  {/* ── Navigation ── */}
                  <div style={S.quizNav}>
                    <button style={{ ...S.btnOutline, opacity: currentQ===0?.4:1 }} onClick={() => setCurrentQ(c => Math.max(0,c-1))} disabled={currentQ===0}>
                      ← Précédent
                    </button>
                    {currentQ < questions.length - 1
                      ? <button style={S.btnBlue} onClick={() => setCurrentQ(c => c+1)}>Suivant →</button>
                      : <button
                          style={{ ...S.btnGreen, opacity: answeredRequired < requiredCount ? .5 : 1 }}
                          onClick={doSubmit}
                          disabled={answeredRequired < requiredCount || savingResult}>
                          {savingResult
                            ? <span style={{ display:"flex", alignItems:"center", gap:8 }}><span style={S.spinner}/> Enregistrement…</span>
                            : answeredRequired < requiredCount
                              ? `⚠ ${requiredCount - answeredRequired} réponse(s) manquante(s)`
                              : "🎯 Voir mon résultat"}
                        </button>
                    }
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ÉTAPE 3 — CHOIX CONSEILLÈRE (obligatoire) */}
          {step === "assign" && result && (
            <div style={{ ...S.card, maxWidth:560, animation:"fltSI .4s ease" }}>
              {/* Aperçu résultat */}
              <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius:14, padding:"20px 24px", marginBottom:24, display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:"1.3rem", color:"#fff", flexShrink:0 }}>
                  {result.cefr}
                </div>
                <div>
                  <div style={{ color:"rgba(255,255,255,.7)", fontSize:".78rem" }}>Votre niveau</div>
                  <div style={{ color:"#fff", fontWeight:800, fontSize:"1.1rem" }}>Score : {result.pct}% — {result.cefr}</div>
                  <div style={{ color:"rgba(255,255,255,.6)", fontSize:".76rem", marginTop:2 }}>Résultat enregistré ✓</div>
                </div>
              </div>

              {/* Titre étape */}
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ fontSize:"2rem", marginBottom:8 }}>🤝</div>
                <h2 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, color:"#0f172a", margin:"0 0 8px", fontSize:"1.15rem" }}>
                  Choisissez votre conseillère BET
                </h2>
                <p style={{ color:"#64748b", fontSize:".87rem", lineHeight:1.6, margin:0 }}>
                  Votre conseillère recevra votre résultat et vous contactera pour vous proposer un programme personnalisé. Cette étape est <strong>obligatoire</strong>.
                </p>
              </div>

              {/* Étape 1 : Centre */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:".78rem", fontWeight:700, color:"#0f172a", marginBottom:10 }}>
                  🏢 Étape 1 — Choisissez votre centre BET *
                </label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {BET_CENTRES.map(c => {
                    const sel = assignCentre === c.id;
                    return (
                      <button key={c.id} type="button"
                        onClick={() => { setAssignCentre(c.id); setAssignCommercialId(""); setAssignError(""); }}
                        style={{ padding:"10px 6px", border:`2px solid ${sel?"#dc2626":"#e2e8f0"}`, borderRadius:10,
                          background: sel?"#fef2f2":"#fff", cursor:"pointer",
                          display:"flex", flexDirection:"column", alignItems:"center", gap:4, transition:"all .18s" }}>
                        <span style={{ fontSize:"1.3rem" }}>{c.icon}</span>
                        <span style={{ fontSize:".75rem", fontWeight: sel?800:600, color: sel?"#dc2626":"#1e293b" }}>{c.label}</span>
                        <span style={{ fontSize:".68rem", color:"#94a3b8" }}>{c.ville}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Étape 2 : Conseillère */}
              {assignCentre && (
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:"block", fontSize:".78rem", fontWeight:700, color:"#0f172a", marginBottom:10 }}>
                    👩‍💼 Étape 2 — Choisissez votre conseillère *
                  </label>
                  {assignLoadingCom ? (
                    <div style={{ textAlign:"center", padding:"16px 0", color:"#94a3b8", fontSize:".84rem" }}>Chargement…</div>
                  ) : assignCommerciaux.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"16px 0", color:"#94a3b8", fontSize:".84rem" }}>Aucune conseillère disponible. Contactez-nous directement.</div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {assignCommerciaux.map(com => {
                        const sel = assignCommercialId === com.id;
                        return (
                          <button key={com.id} type="button"
                            onClick={() => { setAssignCommercialId(sel ? "" : com.id); setAssignError(""); }}
                            style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                              border:`2px solid ${sel?"#dc2626":"#e2e8f0"}`, borderRadius:10,
                              background: sel?"#fef2f2":"#fff", cursor:"pointer", textAlign:"left", transition:"all .18s" }}>
                            <div style={{ width:42, height:42, borderRadius:"50%", background: sel?"#dc2626":"#f1f5f9",
                              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <span style={{ fontSize:"1.2rem" }}>👩‍💼</span>
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:700, fontSize:".9rem", color: sel?"#dc2626":"#1e293b" }}>{com.prenom} {com.nom}</div>
                              {com.telephone && <div style={{ fontSize:".76rem", color:"#64748b", marginTop:2 }}>{com.telephone}</div>}
                            </div>
                            {sel && <span style={{ fontSize:".75rem", background:"#dc2626", color:"#fff", borderRadius:20, padding:"2px 10px", fontWeight:700 }}>✓ Choisie</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {assignError && (
                <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:14, color:"#dc2626", fontSize:".84rem", fontWeight:600 }}>
                  ⚠ {assignError}
                </div>
              )}

              <button onClick={handleAssignAndContinue} disabled={assignSaving}
                style={{ ...S.btnRed, width:"100%", opacity: assignSaving ? .7 : 1, cursor: assignSaving ? "wait" : "pointer" }}>
                {assignSaving
                  ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}><span style={S.spinner} />Enregistrement…</span>
                  : "Confirmer et voir mon résultat complet →"}
              </button>
            </div>
          )}

          {/* ÉTAPE PENDING — Writing/Speaking : en attente de correction */}
          {step === "pending" && (
            <div style={{ maxWidth:560, width:"100%", margin:"0 auto", animation:"fltFU .5s ease" }}>
              <div style={{ background:`linear-gradient(135deg,${fmtInfo.bg},#fff)`, border:`1.5px solid ${fmtInfo.color}30`, borderRadius:20, padding:"36px 32px", textAlign:"center" }}>
                <div style={{ fontSize:"3.5rem", marginBottom:16 }}>{fmtInfo.icon}</div>
                <h2 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"1.4rem", color:"#0f172a", margin:"0 0 12px" }}>
                  Test {fmtInfo.label} envoyé !
                </h2>
                <p style={{ fontSize:".9rem", color:"#475569", lineHeight:1.6, margin:"0 0 24px" }}>
                  Vos réponses ont bien été reçues par votre conseillère BET.
                  <br />Elle analysera votre {format === "speaking" ? "expression orale" : "expression écrite"} et vous communiquera votre niveau CECRL <strong>sous 24h</strong>.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:28 }}>
                  {[
                    { icon:"✅", text:"Vos réponses ont été sauvegardées" },
                    { icon:"👩‍💼", text:"Votre conseillère a été notifiée" },
                    { icon:"📬", text:`Résultat envoyé à ${formData.email || "votre email"}` },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", background:"rgba(255,255,255,.8)", borderRadius:10, border:"1px solid #e5e7eb", textAlign:"left" }}>
                      <span style={{ fontSize:"1.1rem" }}>{icon}</span>
                      <span style={{ fontSize:".85rem", color:"#374151", fontWeight:500 }}>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"16px 20px", background:"#fffbeb", borderRadius:12, border:"1px solid #fde68a", marginBottom:24 }}>
                  <div style={{ fontSize:".82rem", color:"#92400e", fontWeight:600, marginBottom:4 }}>⏳ Résultat sous 24h ouvrées</div>
                  <div style={{ fontSize:".78rem", color:"#b45309" }}>
                    En attendant, vous pouvez contacter votre conseillère via votre espace personnel.
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = "/mon-espace"}
                  style={{ padding:"12px 28px", background:"linear-gradient(135deg,#dc2626,#1e3a8a)", color:"#fff", border:"none", borderRadius:12, fontWeight:700, fontSize:".9rem", cursor:"pointer", fontFamily:"Montserrat,sans-serif" }}
                >
                  Accéder à mon espace →
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 — RÉSULTATS (avec message d'erreur éventuel) */}
          {step === "result" && result && (() => {
            const ci = CEFR[result.cefr];
            return (
              <div style={{ maxWidth:720, width:"100%", display:"flex", flexDirection:"column", gap:20, animation:"fltFU .5s ease" }}>
                {saveError && (
                  <div style={{ background:"#fee2e2", border:"1px solid #fecaca", borderRadius:12, padding:"12px 16px", color:"#b91c1c", fontSize:".85rem", textAlign:"center" }}>
                    ⚠️ {saveError}
                  </div>
                )}
                {/* Email notification (simulation) */}
                {emailSent && (
                  <div style={S.emailBand}>
                    <span style={{ fontSize:"1.1rem" }}>📧</span>
                    <div>
                      <strong style={{ display:"block", fontSize:".88rem", marginBottom:2, color:"#065f46" }}>Résultats envoyés par email !</strong>
                      <span style={{ fontSize:".8rem", color:"#047857" }}>Votre rapport + programme recommandé vous attendent dans la boîte mail de <strong>{formData.email}</strong></span>
                    </div>
                  </div>
                )}

                {/* Carte principale niveau */}
                <div style={{ ...S.card, overflow:"hidden" }}>
                  <div style={{ ...S.resultTop, background:`linear-gradient(135deg,#0f172a,#1e3a8a)` }}>
                    <div style={S.resultTopOrb1} />
                    <div style={S.resultTopOrb2} />
                    <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
                      <div style={{ fontSize:"3rem", marginBottom:8 }}>{ci.icon}</div>
                      <p style={S.resultKicker}>Votre niveau estimé</p>
                      <div style={{ ...S.resultCefr, color: ci.color === "#1e3a8a" ? "#93c5fd" : ci.color }}>{result.cefr}</div>
                      <div style={S.resultLabel}>{ci.label}</div>
                      <p style={S.resultDesc}>{ci.desc}</p>
                    </div>
                  </div>
                  <div style={S.statsRow}>
                    {[
                      { l:"Score",         v:`${result.pct}%`,                       c: result.pct>=60?"#059669":result.pct>=40?"#d97706":"#dc2626" },
                      { l:"Bonnes rép.",   v:`${result.correct}/${questions.length}`, c:"#1e3a8a" },
                      { l:"Points",        v:`${result.earned}/${totalPts}`,          c:"#7c3aed" },
                      { l:"Durée",         v:fmt(result.timeTaken),                   c:"#d97706" },
                    ].map((st, i) => (
                      <div key={i} style={S.statItem}>
                        <div style={{ fontSize:".7rem", color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", marginBottom:5 }}>{st.l}</div>
                        <div style={{ ...S.statVal, color:st.c, animation:`fltCount .4s ease ${i*70}ms both` }}>{st.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding:"0 28px 24px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      {["A1","A2","B1","B2","C1","C2"].map(l => (
                        <span key={l} style={{ fontSize:".7rem", fontWeight: l===result.cefr ? 800 : 500, color: l===result.cefr ? "#dc2626" : "#94a3b8" }}>{l}</span>
                      ))}
                    </div>
                    <div style={{ position:"relative", height:12, background:"#f1f5f9", borderRadius:6, overflow:"visible" }}>
                      <div style={{ height:"100%", width:`${result.pct}%`, background:"linear-gradient(90deg,#1e3a8a,#dc2626)", borderRadius:6, transition:"width 1.2s ease" }} />
                      <div style={{ position:"absolute", top:"50%", left:`${result.pct}%`, transform:"translate(-50%,-50%)", width:20, height:20, borderRadius:"50%", background:"#fff", border:"3px solid #dc2626", boxShadow:"0 0 8px rgba(220,38,38,.4)", transition:"left 1.2s ease", zIndex:2 }} />
                    </div>
                  </div>
                </div>

                {/* Scores par catégorie (inchangé) */}
                <div style={S.lightCard}>
                  <h3 style={S.lcTitle}>📊 Résultats par catégorie</h3>
                  {Object.entries(result.byCat).map(([cat, data]) => {
                    const cs2 = CAT[cat] || { bg:"#f3f4f6", c:"#374151", dot:"#6b7280" };
                    const pct = Math.round((data.pts / data.max) * 100);
                    return (
                      <div key={cat} style={{ marginBottom:18 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ width:10, height:10, borderRadius:"50%", background:cs2.dot, flexShrink:0, display:"block" }} />
                            <span style={{ fontSize:".92rem", fontWeight:700, color:"#0f172a" }}>{cat}</span>
                            <span style={{ ...S.miniChip, background:cs2.bg, color:cs2.c }}>{data.correct}/{data.total} bonnes</span>
                          </div>
                          <span style={{ fontWeight:800, fontSize:".92rem", color: pct>=70?"#059669":pct>=50?"#d97706":"#dc2626" }}>{pct}%</span>
                        </div>
                        <PBar value={data.pts} max={data.max} color={cs2.dot} />
                      </div>
                    );
                  })}
                </div>

                {/* Maîtrise par niveau CECRL (inchangé) */}
                <div style={S.lightCard}>
                  <h3 style={S.lcTitle}>🏅 Maîtrise par niveau CECRL</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                    {Object.entries(result.byCefr).map(([lvl, data]) => {
                      const ci2 = CEFR[lvl];
                      const pct = Math.round((data.correct/data.total)*100);
                      return (
                        <div key={lvl} style={{ ...S.cefrCard, background:ci2.bg, border:`1.5px solid ${lvl===result.cefr?ci2.color:ci2.ring}`, boxShadow: lvl===result.cefr?`0 4px 16px ${ci2.color}33`:"none" }}>
                          {lvl === result.cefr && <div style={{ ...S.cefrTopBadge, background:ci2.color }}>VOTRE NIVEAU</div>}
                          <span style={{ fontSize:"1.4rem" }}>{ci2.icon}</span>
                          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.5rem", color:ci2.color, lineHeight:1 }}>{lvl}</div>
                          <div style={{ fontWeight:900, fontSize:"1.2rem", color:ci2.color }}>{pct}%</div>
                          <div style={{ fontSize:".7rem", color:ci2.color, opacity:.7 }}>{data.correct}/{data.total}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTA formations */}
                <div style={{ ...S.recCard, background:`linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)` }}>
                  <div style={S.recOrb} />
                  <div style={{ position:"relative", zIndex:1 }}>
                    <span style={S.recKicker}>✅ Votre conseillère a bien reçu votre résultat</span>
                    <h3 style={S.recTitle}>Votre niveau : {result.cefr} — {ci.label}</h3>
                    <p style={S.recDesc}>Elle vous contactera prochainement pour vous proposer un programme de formation adapté à votre niveau et à vos objectifs.</p>
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                      <button style={S.recBtnGhost} onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.12)";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}} onClick={()=>navigate("/cours/en-ligne")}>
                        📚 Voir nos formations →
                      </button>
                      {isLoggedIn && (
                        <button
                          style={{ ...S.recBtnGhost, background:"rgba(16,185,129,.15)", border:"1.5px solid rgba(16,185,129,.5)", color:"#6ee7b7" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(16,185,129,.25)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(16,185,129,.15)"}
                          onClick={() => navigate("/mon-espace")}
                        >
                          🏠 Voir dans Mon Espace →
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Révision (inchangé) */}
                <div style={S.lightCard}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: showReview ? 20 : 0 }}>
                    <h3 style={{ ...S.lcTitle, margin:0 }}>🔍 Révision question par question</h3>
                    <button style={S.reviewToggleBtn} onClick={() => setShowReview(r=>!r)}>{showReview ? "Masquer ▲" : "Voir le détail ▼"}</button>
                  </div>
                  {showReview && (
                    <div style={{ display:"flex", flexDirection:"column", gap:12, animation:"fltFU .3s ease" }}>
                      {questions.map((qq, idx) => {
                        const isLibre    = qq.type === "libre";
                        const isSpeaking = qq.type === "speaking";
                        const isManual   = isLibre || isSpeaking;
                        const ok         = isManual ? null : isCorrect(qq);
                        const cs3        = CAT[qq.category] || { bg:"#f3f4f6", c:"#374151" };
                        const qTypeMeta  = Q_TYPE_LABEL[qq.type] || Q_TYPE_LABEL.qcm;
                        const borderC    = isManual ? "#c4b5fd" : ok ? "#bbf7d0" : "#fecaca";
                        const bgC        = isManual ? "#faf5ff" : ok ? "#f0fdf4" : "#fff5f5";
                        const recordUrl  = answers[qq.id]?.startsWith("http") ? answers[qq.id] : null;
                        return (
                          <div key={qq.id} style={{ border:`1.5px solid ${borderC}`, background:bgC, borderRadius:12, padding:"14px 16px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                                <span style={{ fontWeight:800, fontSize:".88rem", color:"#0f172a" }}>Q{idx+1}</span>
                                <span style={{ ...S.miniChip, background:"#f1f5f9", color:"#475569" }}>{qTypeMeta.icon} {qTypeMeta.label}</span>
                                <span style={{ ...S.miniChip, background:cs3.bg, color:cs3.c }}>{qq.category}</span>
                                <span style={{ ...S.miniChip, background:"#f1f5f9", color:"#475569" }}>{qq.cefr}</span>
                              </div>
                              <span style={{ fontSize:"1.1rem" }}>
                                {isSpeaking ? "🎙️" : isLibre ? "🔍" : ok ? "✅" : "❌"}
                              </span>
                            </div>

                            {/* Audio stimulus (audio_qcm ou speaking) */}
                            {(qq.type === "audio_qcm" || qq.type === "speaking") && qq.audio_url && (
                              <audio controls src={qq.audio_url} controlsList="nodownload" crossOrigin="anonymous"
                                style={{ width:"100%", borderRadius:8, marginBottom:8 }} />
                            )}
                            {/* Passage */}
                            {qq.type === "lecture_qcm" && qq.passage && (
                              <div style={{ background:"#f8fafc", borderLeft:"3px solid #0ea5e9", borderRadius:6, padding:"8px 12px", fontSize:".82rem", color:"#334155", marginBottom:8, lineHeight:1.6 }}>
                                {qq.passage}
                              </div>
                            )}

                            <p style={{ fontSize:".9rem", color:"#334155", margin:"0 0 8px", fontWeight:500, lineHeight:1.5 }}>{qq.text}</p>

                            {/* Réponse donnée */}
                            {isSpeaking ? (
                              <div style={{ background:"#fff", border:"1px solid #c4b5fd", borderRadius:8, padding:"8px 12px", fontSize:".83rem", color:"#4c1d95" }}>
                                <strong>Votre réponse vocale :</strong>
                                {recordUrl
                                  ? <audio controls src={recordUrl} crossOrigin="anonymous" style={{ width:"100%", marginTop:6, borderRadius:6 }} />
                                  : <em style={{ color:"#94a3b8", marginLeft:6 }}>non enregistrée</em>
                                }
                                <div style={{ fontSize:".76rem", color:"#7c3aed", marginTop:4 }}>⏳ Correction manuelle par un formateur BET</div>
                              </div>
                            ) : isLibre ? (
                              <div style={{ background:"#fff", border:"1px solid #fed7aa", borderRadius:8, padding:"8px 12px", fontSize:".83rem", color:"#92400e" }}>
                                <strong>Votre réponse :</strong> {answers[qq.id] || <em style={{ color:"#94a3b8" }}>non répondue</em>}
                                <div style={{ fontSize:".76rem", color:"#9a3412", marginTop:4 }}>⏳ Correction manuelle par un formateur BET</div>
                              </div>
                            ) : (
                              <>
                                {!ok && <p style={{ fontSize:".83rem", margin:"0 0 3px", color:"#dc2626" }}>
                                  Votre réponse : <strong>{answers[qq.id] || "—"}</strong>
                                </p>}
                                {qq.correct && <p style={{ fontSize:".83rem", margin:"0 0 6px", color:"#059669" }}>
                                  Bonne réponse : <strong>{qq.correct}</strong>
                                </p>}
                              </>
                            )}

                            {qq.explanation && !isManual && (
                              <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderLeft:"3px solid #94a3b8", borderRadius:6, padding:"8px 12px", fontSize:".8rem", color:"#64748b", marginTop:6 }}>
                                💡 {qq.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Partage (inchangé) */}
                <div style={{ ...S.lightCard, textAlign:"center" }}>
                  <h3 style={S.lcTitle}>📣 Partagez votre résultat</h3>
                  <div style={{ display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap" }}>
                    {[
                      { l:"💬 WhatsApp",  fn:() => window.open(`https://wa.me/?text=J'ai obtenu le niveau ${result.cefr} (${result.pct}%) au test d'anglais Binnie's English Training ! 🎓`) },
                      { l:"📘 Facebook",  fn:() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`) },
                      { l:"💼 LinkedIn",  fn:() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`) },
                      { l:"🔄 Recommencer", fn:() => { setStep("form"); setAnswers({}); setCurrentQ(0); setResult(null); setTimeLeft(questions.length*60); setEmailSent(false); setSaveError(""); }},
                    ].map((sh, i) => (
                      <button key={i} className="flt-share" style={S.shareBtn} onClick={sh.fn}>{sh.l}</button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* MODAL CONSEILLER (inchangée) */}
      <Footer />
    </>
  );
}

/* ════════════════════════════════════════════════════════
   STYLES (inchangés)
════════════════════════════════════════════════════════ */
const FF = "'Montserrat','Segoe UI',sans-serif";
const FD = "'Montserrat','Segoe UI',sans-serif"; 

const S = {
  page:         { fontFamily:FF, background:"#f8fafc", minHeight:"100vh", color:"#0f172a" },
  header:       { background:"#fff", borderBottom:"1px solid #e2e8f0", position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 6px rgba(0,0,0,.05)" },
  headerInner:  { maxWidth:800, margin:"0 auto", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" },
  headerDiv:    { color:"#e2e8f0", fontSize:"1.2rem" },
  headerTitle:  { fontSize:".82rem", fontWeight:600, color:"#64748b" },
  headerBadge:  { background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", borderRadius:999, padding:"3px 12px", fontSize:".72rem", fontWeight:800 },
  timerChip:    { background:"#f1f5f9", border:"1px solid #e2e8f0", color:"#0f172a", borderRadius:999, padding:"5px 14px", fontFamily:FD, fontSize:".95rem", minWidth:72, textAlign:"center", transition:"all .3s" },
  timerLow:     { background:"#fef2f2", borderColor:"#fecaca", color:"#dc2626", animation:"fltPulse 1s ease infinite" },
  body:         { maxWidth:800, margin:"0 auto", padding:"40px 16px 60px", display:"flex", flexDirection:"column", alignItems:"center" },
  card:         { background:"#fff", border:"1px solid #e2e8f0", borderRadius:20, overflow:"hidden", width:"100%", boxShadow:"0 4px 24px rgba(0,0,0,.07)" },
  cardBody:     { padding:"24px 28px" },
  formTop:      { background:"linear-gradient(135deg,#0f172a,#1e3a8a)", padding:"30px 28px 24px", position:"relative", overflow:"hidden", textAlign:"center" },
  formTopOrb:   { position:"absolute", width:180, height:180, borderRadius:"50%", background:"rgba(220,38,38,.12)", top:-60, right:-50, pointerEvents:"none" },
  formTopIcon:  { fontSize:"2.5rem", display:"block", marginBottom:10, position:"relative", zIndex:1 },
  formH1:       { fontFamily:FD, fontSize:"1.65rem", color:"#fff", margin:"0 0 8px", fontWeight:400, position:"relative", zIndex:1 },
  formSub:      { color:"rgba(255,255,255,.65)", fontSize:".86rem", margin:"0 0 16px", position:"relative", zIndex:1 },
  formPills:    { display:"flex", flexWrap:"wrap", justifyContent:"center", gap:6, position:"relative", zIndex:1 },
  formPill:     { background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.15)", color:"rgba(255,255,255,.8)", borderRadius:999, padding:"3px 11px", fontSize:".72rem", fontWeight:600 },
  profileGrid:  { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:0 },
  profileBtn:   { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"10px 4px", background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:10, cursor:"pointer", color:"#475569", fontFamily:FF, transition:"all .2s" },
  profileBtnActive:{ background:"#fef2f2", borderColor:"#dc2626", color:"#dc2626", boxShadow:"0 2px 8px rgba(220,38,38,.15)" },
  fieldLabel:   { display:"block", fontSize:".78rem", fontWeight:700, color:"#0f172a", marginBottom:5 },
  input:        { width:"100%", padding:"11px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:".9rem", fontFamily:FF, outline:"none", boxSizing:"border-box", color:"#0f172a", background:"#fff", transition:"border-color .2s, box-shadow .2s" },
  errTxt:       { fontSize:".74rem", color:"#dc2626", fontWeight:600, margin:"3px 0 0" },
  formBenefits: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:20, paddingTop:20, borderTop:"1px solid #f1f5f9" },
  spinner:      { width:16, height:16, border:"2.5px solid rgba(255,255,255,.35)", borderTopColor:"#fff", borderRadius:"50%", animation:"fltSpin .8s linear infinite", display:"inline-block" },
  quizTop:      { background:"#f8fafc", padding:"14px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap", gap:8 },
  quizQLabel:   { fontSize:".9rem", color:"#64748b" },
  catChip:      { fontSize:".72rem", fontWeight:800, borderRadius:999, padding:"3px 10px" },
  cefrChip:     { background:"#f1f5f9", color:"#475569", borderRadius:999, padding:"3px 10px", fontSize:".72rem", fontWeight:700 },
  ptsChip:      { background:"#fefce8", color:"#92400e", borderRadius:999, padding:"3px 10px", fontSize:".72rem", fontWeight:800 },
  dotsRow:      { display:"flex", gap:6, padding:"10px 24px", flexWrap:"wrap", borderBottom:"1px solid #f1f5f9" },
  dot:          { height:10, border:"none", cursor:"pointer", transition:"all .25s ease", padding:0, flexShrink:0 },
  questionTxt:  { fontFamily:FD, fontSize:"1.25rem", color:"#0f172a", lineHeight:1.55, margin:"0 0 24px", fontWeight:400 },
  optsGrid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginBottom:24 },
  opt:          { padding:"13px 14px", borderRadius:12, cursor:"pointer", fontFamily:FF, fontSize:".9rem", transition:"all .2s", display:"flex", alignItems:"center", gap:10, textAlign:"left" },
  optRadio:     { width:18, height:18, borderRadius:"50%", border:"2px solid", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .2s" },
  optLetter:    { width:22, height:22, borderRadius:6, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem", fontWeight:800, color:"#64748b", flexShrink:0 },
  quizNav:      { display:"flex", justifyContent:"space-between", alignItems:"center" },
  btnRed:       { padding:"13px 28px", background:"#dc2626", color:"#fff", border:"none", borderRadius:999, fontFamily:FF, fontWeight:800, fontSize:".95rem", cursor:"pointer", transition:"all .2s", boxShadow:"0 4px 16px rgba(220,38,38,.3)" },
  btnBlue:      { padding:"11px 24px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:999, fontFamily:FF, fontWeight:700, fontSize:".9rem", cursor:"pointer", transition:"opacity .2s" },
  btnGreen:     { padding:"11px 24px", background:"linear-gradient(135deg,#059669,#0f766e)", color:"#fff", border:"none", borderRadius:999, fontFamily:FF, fontWeight:800, fontSize:".88rem", cursor:"pointer" },
  btnOutline:   { padding:"10px 22px", background:"#fff", color:"#475569", border:"1.5px solid #e2e8f0", borderRadius:999, fontFamily:FF, fontWeight:600, fontSize:".88rem", cursor:"pointer" },
  emailBand:    { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"flex-start", gap:12, animation:"fltFI .5s ease", width:"100%", boxSizing:"border-box" },
  resultTop:    { padding:"36px 28px", position:"relative", overflow:"hidden", textAlign:"center", borderBottom:"1px solid #e2e8f0" },
  resultTopOrb1:{ position:"absolute", width:260, height:260, borderRadius:"50%", background:"rgba(220,38,38,.1)", top:-80, right:-60, pointerEvents:"none" },
  resultTopOrb2:{ position:"absolute", width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,.05)", bottom:-60, left:-40, pointerEvents:"none" },
  resultKicker: { fontSize:".72rem", fontWeight:800, letterSpacing:".1em", color:"rgba(255,255,255,.5)", textTransform:"uppercase", margin:"0 0 6px", display:"block" },
  resultCefr:   { fontFamily:FD, fontSize:"4rem", lineHeight:1, marginBottom:4 },
  resultLabel:  { fontSize:"1.3rem", fontWeight:800, color:"#fff", marginBottom:8 },
  resultDesc:   { fontSize:".9rem", color:"rgba(255,255,255,.7)", lineHeight:1.65, maxWidth:440, margin:"0 auto" },
  statsRow:     { display:"grid", gridTemplateColumns:"repeat(4,1fr)", borderBottom:"1px solid #f1f5f9" },
  statItem:     { padding:"18px 12px", textAlign:"center", borderRight:"1px solid #f1f5f9" },
  statVal:      { fontFamily:FD, fontSize:"1.7rem", lineHeight:1 },
  lightCard:    { background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, padding:"22px", width:"100%", boxSizing:"border-box", boxShadow:"0 2px 10px rgba(0,0,0,.05)" },
  lcTitle:      { fontFamily:FD, fontSize:"1.1rem", fontWeight:400, color:"#0f172a", margin:"0 0 18px" },
  miniChip:     { fontSize:".7rem", fontWeight:700, borderRadius:999, padding:"2px 9px" },
  cefrCard:     { borderRadius:12, padding:"16px 10px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:5, position:"relative", paddingTop:22 },
  cefrTopBadge: { position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", color:"#fff", borderRadius:999, padding:"2px 10px", fontSize:".62rem", fontWeight:800, whiteSpace:"nowrap" },
  recCard:      { borderRadius:18, padding:"30px 28px", position:"relative", overflow:"hidden", width:"100%", boxSizing:"border-box" },
  recOrb:       { position:"absolute", width:240, height:240, borderRadius:"50%", background:"rgba(220,38,38,.12)", top:-80, right:-60, pointerEvents:"none" },
  recKicker:    { display:"block", fontSize:".78rem", fontWeight:700, color:"rgba(255,255,255,.55)", letterSpacing:".04em", marginBottom:10 },
  recTitle:     { fontFamily:FD, fontSize:"1.6rem", color:"#fff", margin:"0 0 12px", fontWeight:400, lineHeight:1.2 },
  recDesc:      { color:"rgba(255,255,255,.75)", fontSize:".9rem", lineHeight:1.7, margin:"0 0 20px" },
  recBtnRed:    { background:"#dc2626", color:"#fff", border:"none", borderRadius:999, padding:"11px 24px", fontFamily:FF, fontWeight:800, fontSize:".9rem", cursor:"pointer", transition:"background .2s", boxShadow:"0 4px 14px rgba(220,38,38,.4)" },
  recBtnGhost:  { background:"transparent", color:"#fff", border:"2px solid rgba(255,255,255,.3)", borderRadius:999, padding:"10px 22px", fontFamily:FF, fontWeight:700, fontSize:".86rem", cursor:"pointer", transition:"background .2s" },
  reviewToggleBtn:{ background:"#f1f5f9", border:"1px solid #e2e8f0", color:"#475569", borderRadius:999, padding:"6px 16px", fontFamily:FF, fontWeight:700, fontSize:".8rem", cursor:"pointer" },
  shareBtn:     { padding:"9px 16px", background:"#f8fafc", color:"#334155", border:"1px solid #e2e8f0", borderRadius:10, fontFamily:FF, fontWeight:600, fontSize:".84rem", cursor:"pointer", transition:"all .2s" },
  modalOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 },
  modalContainer:{ background:"#fff", borderRadius:20, width:"100%", maxWidth:500, overflow:"hidden", animation:"fltSI .25s ease", boxShadow:"0 20px 40px rgba(0,0,0,.2)" },
  modalHeader:  { background:"linear-gradient(135deg,#0f172a,#1e3a8a)", padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", color:"#fff" },
  modalTitle:   { fontFamily:FD, fontSize:"1.2rem", margin:0, fontWeight:400 },
  modalClose:   { background:"rgba(255,255,255,.2)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color:"#fff", fontSize:"1.2rem", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .2s" },
  modalBody:    { padding:"24px" },

  /* ── Nouveaux styles pour les formats de question ── */
  audioBox:     { background:"linear-gradient(135deg,#fdf2f8,#fce7f3)", border:"1.5px solid #f9a8d4", borderRadius:14, padding:"16px 18px", marginBottom:18 },
  audioLabel:   { fontSize:".88rem", color:"#9d174d", marginBottom:6, lineHeight:1.5 },

  passageBox:   { background:"#f0f9ff", border:"1.5px solid #bae6fd", borderRadius:14, padding:"16px 18px", marginBottom:18, maxHeight:260, overflowY:"auto" },
  passageLabel: { fontSize:".82rem", color:"#0369a1", fontWeight:700, marginBottom:10 },
  passageTxt:   { fontSize:".9rem", color:"#0f172a", lineHeight:1.8, whiteSpace:"pre-wrap", margin:0 },
};

