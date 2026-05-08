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
    {n:2, l:"Le test"},
    {n:3, l: alreadyAssigned ? "Conseillère ✓" : "Conseillère"},
    {n:4, l:"Résultats"},
  ];
  // Si conseillère déjà assignée, traiter le step 3 comme validé même en step 4
  const effectiveCurrent = (alreadyAssigned && current === 4) ? 5 : current;
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

  // Questions : propQ > test actif API > mock par défaut
  const questions = propQ
    || (activeTest?.level_questions?.filter(q => q.actif !== false).sort((a,b) => (a.ordre||0)-(b.ordre||0)))
    || DEFAULT_QUESTIONS;

  const testParams = activeTest?.params || {};
  const totalPts  = questions.reduce((s, q) => s + (q.points || 1), 0);

  const [step,       setStep]       = useState("form");
  const [formData,   setFormData]   = useState({ fullname:"", email:"", phone:"", consent:false, profile:"particulier", centre_id:"", commercial_id:"" });
  const [formErrors, setFormErrors] = useState({});
  const [centreChoisi,       setCentreChoisi]       = useState("");
  const [commerciaux,        setCommerciaux]        = useState([]);
  const [loadingCommerciaux, setLoadingCommerciaux] = useState(false);
  // Étape assign (après le quiz)
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

  /* ── Charger les conseillères quand un centre est choisi (form) ── */
  useEffect(() => {
    if (!centreChoisi) { setCommerciaux([]); return; }
    setLoadingCommerciaux(true);
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5001"}/api/level-test/commerciaux?centre_id=${centreChoisi}`)
      .then(r => r.json())
      .then(data => setCommerciaux(data.commerciaux || []))
      .catch(() => setCommerciaux([]))
      .finally(() => setLoadingCommerciaux(false));
  }, [centreChoisi]);

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
    setTimeout(() => { setSubmitting(false); setStep("quiz"); }, 800);
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
    return insertTestNiveau({
      user: {
        fullname:  formData.fullname,
        email:     formData.email,
        phone:     formData.phone || null,
        profile:   formData.profile || "particulier",
        consent:   formData.consent,
        centre_id:    formData.centre_id    || null,
        commercial_id: formData.commercial_id || null,
      },
      test: {
        level:              resultData.cefr,
        score:              resultData.pct,
        points_earned:      resultData.earned,
        points_total:       totalPts,
        correct_answers:    resultData.correct,
        total_questions:    questions.length,
        time_taken_seconds: resultData.timeTaken,
        answers_details:    questions.map(q => ({
          question_id:    q.id,
          category:       q.category,
          cefr:           q.cefr,
          user_answer:    q.type === "speaking" ? (answers[q.id] ? "[audio]" : null) : (answers[q.id] || null),
          correct_answer: q.correct,
          is_correct:     isCorrect(q),
        })),
        audio_answers: audioAnswers,
        by_category: resultData.byCat,
        by_cefr:     resultData.byCefr,
      },
      submitted_at: new Date().toISOString(),
    });
  };

  const doSubmit = async () => {
    clearInterval(timerRef.current);
    const r = computeResult();
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
      // Si une conseillère est déjà assignée, l'associer au résultat et passer directement au résultat
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
      if (currentCommercialId) {
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
          <Stepper current={step === "form" ? 1 : step === "quiz" ? 2 : step === "assign" ? 3 : 4} alreadyAssigned={!!sessionCommercialId} />

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

          {/* ÉTAPE 2 — QUIZ */}
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

                  {/* ── LISTENING : lecteur audio ── */}
                  {q.type === "audio_qcm" && q.audio_url && (
                    <div style={S.audioBox}>
                      <div style={S.audioLabel}>
                        🎧 <strong>Écoutez attentivement</strong>, puis répondez à la question ci-dessous
                      </div>
                      <audio
                        key={q.audio_url}
                        controls
                        controlsList="nodownload"
                        crossOrigin="anonymous"
                        src={q.audio_url}
                        style={{ width:"100%", borderRadius:12, marginTop:10 }}
                      />
                      <p style={{ fontSize:".78rem", color:"#9d174d", margin:"8px 0 0", fontWeight:600 }}>
                        💡 Vous pouvez écouter plusieurs fois avant de répondre
                      </p>
                    </div>
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

                  {/* ── QUESTION LIBRE (Speaking / Writing) ── */}
                  {q.type === "libre" && (
                    <div style={{ margin:"4px 0 20px" }}>
                      <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:12, padding:"12px 16px", marginBottom:14 }}>
                        <p style={{ margin:0, fontSize:".84rem", color:"#9a3412", fontWeight:600 }}>
                          💬 <strong>Expression libre</strong> — Répondez en anglais dans le champ ci-dessous.
                          <span style={{ fontWeight:400, display:"block", marginTop:4 }}>Cette réponse sera corrigée manuellement par un formateur BET.</span>
                        </p>
                      </div>
                      <textarea
                        placeholder="Write your answer in English here…"
                        value={answers[q.id] || ""}
                        onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                        rows={6}
                        onFocus={e => { e.currentTarget.style.borderColor="#dc2626"; e.currentTarget.style.boxShadow="0 0 0 3px rgba(220,38,38,.1)"; }}
                        onBlur={e  => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.boxShadow="none"; }}
                        style={{ ...S.input, resize:"vertical", fontSize:".95rem", lineHeight:1.7 }}
                      />
                      <p style={{ fontSize:".76rem", color:"#94a3b8", textAlign:"right", marginTop:4 }}>
                        {(answers[q.id]||"").length} caractères
                      </p>
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

