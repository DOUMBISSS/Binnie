import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer/Footer";
import { supabase } from "../../config/supabase";

if (!document.querySelector("#pe-fonts")) {
  const l = document.createElement("link"); l.id="pe-fonts"; l.rel="stylesheet";
  l.href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap";
  document.head.appendChild(l);
}
if (!document.querySelector("#pe-kf")) {
  const s = document.createElement("style"); s.id="pe-kf";
  s.textContent=`
    @keyframes peFU { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes peFI { from{opacity:0} to{opacity:1} }
    @keyframes peSI { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
    @keyframes peSpin{ to{transform:rotate(360deg)} }
    .pe-offer-card:hover { border-color:#1e3a8a !important; transform:translateY(-4px) !important; box-shadow:0 14px 36px rgba(0,0,0,.1) !important; }
    .pe-input:focus { border-color:#1e3a8a !important; box-shadow:0 0 0 3px rgba(30,58,138,.1) !important; outline:none; }
    .pe-plan:hover { transform:translateY(-3px) !important; box-shadow:0 12px 32px rgba(0,0,0,.1) !important; }
  `;
  document.head.appendChild(s);
}

// Injection responsive
if (!document.querySelector("#pe-responsive")) {
  const resp = document.createElement("style");
  resp.id = "pe-responsive";
  resp.textContent = `
    .pe-root { overflow-x: hidden; max-width: 100%; }
    @media (max-width: 900px) {
      .pe-hero-layout { grid-template-columns: 1fr !important; gap: 32px !important; text-align: center; }
      .pe-hero-layout > div:first-child { text-align: center; }
      .pe-hero-layout .pe-hero-ctas { justify-content: center; }
      .pe-hero-trust { justify-content: center; }
      .pe-plans-grid { grid-template-columns: 1fr !important; gap: 24px !important; max-width: 400px; margin-left: auto; margin-right: auto; }
    }
    @media (max-width: 768px) {
      .pe-offers-grid { grid-template-columns: 1fr !important; gap: 20px; }
      .pe-benef-grid { grid-template-columns: 1fr !important; }
      .pe-clients-row { gap: 8px; }
      .pe-cta-final { flex-direction: column; text-align: center; gap: 20px; }
      .pe-hero-title { font-size: 1.8rem !important; }
      .pe-tabs-inner { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    }
    @media (max-width: 640px) {
      .pe-hero-title { font-size: 1.5rem !important; }
      .pe-stats-card { margin-top: 20px; }
      .pe-guarantee-band { flex-direction: column; align-items: center; text-align: center; gap: 12px; }
      .pe-modal-frow { grid-template-columns: 1fr !important; gap: 12px; }
      .pe-audit-benefits { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 480px) {
      .pe-hero-ctas { flex-direction: column; align-items: stretch; gap: 12px; }
      .pe-hero-ctas button { width: 100%; text-align: center; justify-content: center; }
      .pe-share-buttons { flex-direction: column; gap: 8px; }
      .pe-plan-card { padding: 20px 16px; }
    }
  `;
  document.head.appendChild(resp);
}

function useInView(t=0.15){const r=useRef(null);const[v,sv]=useState(false);useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting)sv(true)},{threshold:t});if(r.current)o.observe(r.current);return()=>o.disconnect();},[]);return[r,v];}

const CORP_OFFERS = [
  { ico:"🔍", title:"Audit linguistique gratuit", color:"#1e3a8a", bg:"#eff6ff", desc:"Évaluation CECRL de vos équipes + rapport personnalisé + plan de formation sous 48h.", tag:"GRATUIT", cta:"Demander l'audit" },
  { ico:"💼", title:"Anglais des affaires",        color:"#dc2626", bg:"#fef2f2", desc:"Réunions, négociations, présentations et communication client internationale.", tag:"POPULAIRE", cta:"Demander un devis" },
  { ico:"🎓", title:"Préparation certifications", color:"#059669", bg:"#f0fdf4", desc:"Sessions intensives TOEIC, TOEFL, IELTS pour vos collaborateurs — score garanti.", tag:"CERTIFIANT", cta:"Demander un devis" },
  { ico:"👔", title:"Coaching dirigeants",         color:"#7c3aed", bg:"#faf5ff", desc:"Accompagnement individuel pour cadres et managers — perfectionnement express.", tag:"PREMIUM", cta:"Réserver un créneau" },
];

const PLANS = [
  { id:"starter",   label:"Starter",    price:"75 000", freq:"/mois",   color:"#1e3a8a", features:["Jusqu'à 5 collaborateurs","Cours en ligne illimités","Rapport mensuel","Support email"] },
  { id:"business",  label:"Business",   price:"150 000",freq:"/mois",   color:"#dc2626", features:["Jusqu'à 20 collaborateurs","Cours présentiel 2×/sem.","Dashboard RH","Coaching manager","Support dédié"], popular:true },
  { id:"enterprise",label:"Enterprise", price:"Sur devis",freq:"",      color:"#059669", features:["Effectif illimité","Programme 100% sur-mesure","Chef de projet attitré","Certification officielle","API & intégrations"] },
];

const BENEFITS = [
  { ico:"📊", title:"Rapport d'audit offert",      desc:"Analyse CECRL complète de vos équipes, recommandations et plan de formation." },
  { ico:"⚡", title:"Réponse sous 24h",             desc:"Notre équipe RH vous rappelle le jour ouvré suivant votre demande." },
  { ico:"💼", title:"Tarifs dégressifs",            desc:"Remises négociées selon l'effectif à former. Financement FDFP disponible." },
  { ico:"🏛️", title:"Cabinet agréé État CI",        desc:"Certificats officiellement reconnus par le Ministère de l'Emploi de CI." },
  { ico:"🌍", title:"6 centres + distanciel",       desc:"Formation en présentiel dans nos 6 centres ou 100% en ligne selon vos besoins." },
  { ico:"📜", title:"Certification incluse",        desc:"En fin de formation, chaque collaborateur reçoit un certificat BET officiel." },
];

const CLIENTS = ["NSIA Assurances","Orange CI","Bolloré Africa","MTN CI","BICICI","SGBCI","Air Côte d'Ivoire","SODECI"];

const SECTORS = ["Finance & Banque","Télécommunications","Pétrole & Gaz","Distribution & Commerce","Industrie & BTP","Santé & Pharmacie","Technologie & IT","Hôtellerie & Tourisme","ONG & Organisations Int.","Autre"];
const SIZES   = ["1–10","11–50","51–100","101–250","250+"];
const BUDGETS = ["< 500 000 FCFA","500 000 – 1 M FCFA","1 M – 3 M FCFA","3 M – 5 M FCFA","+ 5 M FCFA","À discuter"];

export default function ParcoursEntreprise() {
  const navigate = useNavigate();

  const [modal,      setModal]      = useState(null);
  const [selOffer,   setSelOffer]   = useState(null);
  const [form,       setForm]       = useState({ company:"", sector:"", size:"", employees:"", name:"", role:"", email:"", phone:"", budget:"", message:"", consent:false });
  const [submitting, setSub]        = useState(false);
  const [sent,       setSent]       = useState(false);
  const [erreur,     setErreur]     = useState("");
  const [corpAssist, setCorpAssist] = useState(null);

  // ── Auth gate ────────────────────────────────────────
  const [supaUser,     setSupaUser]     = useState(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authTab,      setAuthTab]      = useState("login");
  const [authForm,     setAuthForm]     = useState({ email:"", password:"", prenom:"", nom:"", telephone:"" });
  const [authLoading,  setAuthLoading]  = useState(false);
  const [authErr,      setAuthErr]      = useState("");

  const [heroRef,   heroInView]   = useInView();
  const [offerRef,  offerInView]  = useInView();
  const [planRef,   planInView]   = useInView();
  const [benefRef,  benefInView]  = useInView();

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  // ── Pré-remplissage depuis la session Supabase ───────
  const prefillFromUser = (u) => {
    if (!u) return {};
    const meta = u.user_metadata || {};
    return {
      name:  (meta.prenom && meta.nom) ? `${meta.prenom} ${meta.nom}` : meta.full_name || "",
      email: u.email || "",
      phone: meta.telephone || "",
    };
  };

  // ── Restauration d'un devis en attente (après OAuth) ─
  const restorePending = (u) => {
    const raw = localStorage.getItem("pending_devis");
    if (!raw) return;
    try {
      const { form: saved, modal: savedModal, selOffer: savedOffer } = JSON.parse(raw);
      const pref = prefillFromUser(u);
      setForm({ ...saved, name: saved.name || pref.name, email: saved.email || pref.email, phone: saved.phone || pref.phone });
      setModal(savedModal); setSelOffer(savedOffer);
      setSent(false); setErreur(""); setShowAuthGate(false);
      localStorage.removeItem("pending_devis");
    } catch { localStorage.removeItem("pending_devis"); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setSupaUser(session.user); restorePending(session.user); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user || null;
      setSupaUser(u);
      if (u && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        setForm(prev => { const p = prefillFromUser(u); return { ...prev, name: prev.name || p.name, email: prev.email || p.email, phone: prev.phone || p.phone }; });
        setShowAuthGate(false); setAuthErr("");
        restorePending(u);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers auth inline ─────────────────────────────
  const handleAuthLogin = async () => {
    if (!authForm.email || !authForm.password) return setAuthErr("Email et mot de passe requis.");
    setAuthLoading(true); setAuthErr("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5001"}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email ou mot de passe incorrect");
      await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
    } catch (err) { setAuthErr(err.message); }
    finally { setAuthLoading(false); }
  };

  const handleAuthRegister = async () => {
    if (!authForm.prenom || !authForm.nom || !authForm.email || !authForm.password) return setAuthErr("Tous les champs marqués * sont requis.");
    setAuthLoading(true); setAuthErr("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5001"}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: authForm.nom, prenom: authForm.prenom, email: authForm.email, telephone: authForm.telephone, password: authForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription");
      const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
      if (error) throw new Error(error.message);
    } catch (err) { setAuthErr(err.message); }
    finally { setAuthLoading(false); }
  };

  const handleGoogleAuth = async () => {
    localStorage.setItem("pending_devis", JSON.stringify({ form, modal, selOffer }));
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/parcours/entreprise` },
    });
  };

  const openModal = (type, offer=null) => {
    const pref = prefillFromUser(supaUser);
    setModal(type); setSelOffer(offer); setSent(false); setErreur(""); setShowAuthGate(false); setAuthErr("");
    setForm({ company:"", sector:"", size:"", employees:"", role:"", budget:"", message:"", consent:false, ...pref });
  };
  const closeModal = () => { setModal(null); setSent(false); setErreur(""); setShowAuthGate(false); };

  const handleSubmit = async () => {
    if (!form.company || !form.name || !form.email || !form.phone) {
      setErreur("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }
    if (!supaUser) {
      localStorage.setItem("pending_devis", JSON.stringify({ form, modal, selOffer }));
      setShowAuthGate(true);
      return;
    }
    setSub(true); setErreur("");
    try {
      const API = process.env.REACT_APP_API_URL || "http://localhost:5001";
      const res = await fetch(`${API}/api/entreprise/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entreprise:  form.company,
          contact:     form.name,
          email:       form.email,
          telephone:   form.phone,
          nb_employes: form.employees || null,
          besoins:     [form.sector, form.size, form.budget, form.message].filter(Boolean).join(" | ") || null,
        }),
      });
      if (!res.ok) throw new Error();

      // Auto-assign to dedicated corporate assistante (B2B)
      try {
        const ar = await fetch(`${API}/api/parcours/assistantes-ligne?profil=b2b`);
        const ad = await ar.json();
        const ca = (ad.assistantes || [])[0] || null;
        if (ca) {
          await fetch(`${API}/api/parcours/assignation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assistante_id:      ca.id,
              prospect_nom:       form.name,
              prospect_email:     form.email,
              prospect_telephone: form.phone || null,
              type_cours:         "en_ligne",
              source:             "devis_entreprise",
            }),
          });
          setCorpAssist(ca);
        }
      } catch { /* silent — form submit already succeeded */ }

      setSent(true);
    } catch {
      setErreur("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setSub(false);
    }
  };

  return (
    <>
      <div className="pe-root" style={S.page}>

        <div ref={heroRef} style={S.hero}>
          <div style={S.heroOrb1}/><div style={S.heroOrb2}/>
          <div style={S.heroInner}>
            <div style={S.breadcrumb}>
              <span style={S.bLink} onClick={()=>navigate("/")}>Accueil</span>
              <span style={S.bSep}>/</span>
              <span style={{color:"#e2e8f0"}}>Entreprises</span>
            </div>
            <div className="pe-hero-layout" style={S.heroLayout}>
              <div style={{animation:heroInView?"peFU .6s ease both":"none"}}>
                <div style={S.heroTags}>
                  <span style={S.tagBlue}>🏢 SOLUTIONS ENTREPRISES</span>
                  <span style={S.tagRed}>🎁 AUDIT GRATUIT</span>
                </div>
                <h1 className="pe-hero-title" style={S.heroH1}>Formation anglais<br /><em style={S.heroAccent}>pour vos équipes</em></h1>
                <p style={S.heroDesc}>Programmes sur-mesure, certifications officielles et audit linguistique gratuit pour booster la compétitivité internationale de votre entreprise.</p>
                <div className="pe-hero-ctas" style={S.heroCtas}>
                  <button style={S.btnBlue} onClick={()=>openModal("audit")}
                    onMouseEnter={e=>e.currentTarget.style.background="#1e40af"}
                    onMouseLeave={e=>e.currentTarget.style.background="#1e3a8a"}>
                    🔍 Audit gratuit →
                  </button>
                  <button style={S.btnOutlineWhite} onClick={()=>openModal("devis")}>
                    💬 Demander un devis
                  </button>
                </div>
                <div className="pe-hero-trust" style={S.heroTrust}>
                  {["✓ 100% gratuit sans engagement","✓ Réponse sous 24h","✓ Financement FDFP"].map((t,i)=>(
                    <span key={i} style={{fontSize:".8rem",color:"rgba(255,255,255,.65)",fontWeight:600}}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="pe-stats-card" style={{animation:heroInView?"peFU .7s ease .15s both":"none"}}>
                <div style={S.heroStatsCard}>
                  <p style={{fontSize:".76rem",fontWeight:800,color:"rgba(255,255,255,.45)",textTransform:"uppercase",letterSpacing:".07em",margin:"0 0 14px"}}>Nos résultats entreprises</p>
                  {[["500+","Entreprises auditées"],["96%","Taux de satisfaction RH"],["24h","Délai de réponse garanti"],["FDFP","Financement disponible"]].map(([num,lbl],i)=>(
                    <div key={i} style={S.heroStatRow}>
                      <span style={{fontFamily:"'Montserrat','Segoe UI',sans-serif",fontSize:"1.4rem",color:i%2===0?"#f87171":"#93c5fd"}}>{num}</span>
                      <span style={{fontSize:".82rem",color:"rgba(255,255,255,.7)",fontWeight:500}}>{lbl}</span>
                    </div>
                  ))}
                  <button style={{...S.btnBlue,width:"100%",marginTop:16}} onClick={()=>openModal("audit")}>🔍 Demander mon audit gratuit</button>
                </div>
              </div>
            </div>
          </div>
          <div style={{lineHeight:0}}><svg viewBox="0 0 1440 48" style={{display:"block",width:"100%"}} preserveAspectRatio="none"><path fill="#f8fafc" d="M0,24 C480,48 960,0 1440,24 L1440,48 L0,48 Z"/></svg></div>
        </div>

        <div style={S.body}>
          <div style={S.inner}>

            <div style={{marginBottom:40}}>
              <span style={S.badge}>NOS OFFRES CORPORATE</span>
              <h2 style={S.sH2}>Que souhaitez-vous mettre en place ?</h2>
              <p style={S.sDesc}>Chaque offre peut être combinée pour créer un programme global adapté à vos besoins RH.</p>
            </div>

            <div ref={offerRef} className="pe-offers-grid" style={S.offersGrid}>
              {CORP_OFFERS.map((o,i)=>(
                <div key={i} className="pe-offer-card" style={{...S.offerCard, opacity:offerInView?1:0, transform:offerInView?"none":"translateY(16px)", transition:`all .5s ease ${i*80}ms`, borderColor:offerInView?"#e2e8f0":"transparent"}}>
                  <div style={{...S.offerTag, background:o.bg, color:o.color}}>{o.tag}</div>
                  <div style={{...S.offerIcoWrap, background:o.bg}}><span style={{fontSize:"1.5rem"}}>{o.ico}</span></div>
                  <h3 style={{...S.offerTitle, color:o.color}}>{o.title}</h3>
                  <p style={S.offerDesc}>{o.desc}</p>
                  <button style={{...S.offerBtn, background:o.bg, color:o.color, border:`1.5px solid ${o.color}33`}} onClick={()=>openModal(o.tag==="GRATUIT"?"audit":"devis",o)}>{o.cta} →</button>
                </div>
              ))}
            </div>

            <div style={{margin:"60px 0 40px"}}>
              <span style={S.badge}>FORMULES & TARIFS</span>
              <h2 style={S.sH2}>Choisissez votre formule</h2>
              <p style={S.sDesc}>Sans engagement. Changez ou annulez à tout moment. Devis sur-mesure disponible.</p>
            </div>

            <div ref={planRef} className="pe-plans-grid" style={S.plansGrid}>
              {PLANS.map((p,i)=>(
                <div key={p.id} className="pe-plan" style={{...S.planCard, opacity:planInView?1:0, transform:planInView?"none":"translateY(16px)", transition:`all .5s ease ${i*100}ms`, border:p.popular?`2px solid ${p.color}`:"1.5px solid #e2e8f0", background:p.popular?"#fef2f2":"#fff" }}>
                  {p.popular && <div style={{...S.planBadge, background:p.color}}>⭐ Le plus choisi</div>}
                  <h3 style={{fontFamily:"'Montserrat','Segoe UI',sans-serif",fontSize:"1.2rem",margin:"0 0 8px",fontWeight:400}}>{p.label}</h3>
                  <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:12}}>
                    <span style={{fontFamily:"'Montserrat','Segoe UI',sans-serif",fontSize:"1.6rem",color:p.color}}>{p.price}</span>
                    {p.freq && <span style={{fontSize:".8rem",color:"#64748b"}}>FCFA{p.freq}</span>}
                  </div>
                  <ul style={{listStyle:"none",padding:0,margin:"0 0 20px",display:"flex",flexDirection:"column",gap:9}}>
                    {p.features.map((f,j)=>(
                      <li key={j} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:".84rem",color:"#334155"}}>
                        <span style={{...S.checkDot,background:p.color}}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button style={{...S.planBtn, background:p.popular?p.color:"transparent", color:p.popular?"#fff":p.color, border:`1.5px solid ${p.color}`}} onClick={()=>openModal("devis",{title:p.label})}
                    onMouseEnter={e=>{e.currentTarget.style.background=p.color;e.currentTarget.style.color="#fff";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=p.popular?p.color:"transparent";e.currentTarget.style.color=p.popular?"#fff":p.color;}}>
                    {p.id==="enterprise"?"Demander un devis":"Choisir cette formule"}
                  </button>
                </div>
              ))}
            </div>

            <div className="pe-guarantee-band" style={S.guaranteeBand}>
              <span style={{fontSize:"1.3rem"}}>🛡️</span>
              <div>
                <strong style={{display:"block",marginBottom:3}}>Garantie satisfait ou remboursé 30 jours</strong>
                <span style={{fontSize:".86rem",color:"#64748b"}}>Si vous n'êtes pas satisfait dans les 30 premiers jours, nous vous remboursons intégralement.</span>
              </div>
            </div>

            <div style={{margin:"60px 0 28px"}}>
              <span style={S.badge}>POURQUOI CHOISIR BET</span>
              <h2 style={S.sH2}>Vos avantages exclusifs</h2>
            </div>
            <div ref={benefRef} className="pe-benef-grid" style={S.benefGrid}>
              {BENEFITS.map((b,i)=>(
                <div key={i} style={{...S.benefCard, opacity:benefInView?1:0, transform:benefInView?"none":"translateY(14px)", transition:`all .45s ease ${i*80}ms`}}>
                  <span style={{fontSize:"1.6rem"}}>{b.ico}</span>
                  <div>
                    <h4 style={{fontWeight:800,fontSize:".9rem",color:"#0f172a",margin:"0 0 4px"}}>{b.title}</h4>
                    <p style={{fontSize:".82rem",color:"#64748b",lineHeight:1.55,margin:0}}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={S.clientsBlock}>
              <p style={{fontSize:".78rem",fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em",margin:"0 0 16px",textAlign:"center"}}>Ils nous font confiance</p>
              <div className="pe-clients-row" style={S.clientsRow}>
                {CLIENTS.map((c,i)=><div key={i} style={S.clientPill}>{c}</div>)}
              </div>
            </div>

            <div className="pe-cta-final" style={S.ctaFinal}>
              <div style={S.ctaFinalOrb}/>
              <div style={{position:"relative",zIndex:1}}>
                <h2 style={{fontFamily:"'Montserrat','Segoe UI',sans-serif",fontSize:"clamp(1.5rem,3vw,2.2rem)",color:"#fff",margin:"0 0 12px",fontWeight:400}}>
                  Prêt à former vos équipes ?<br/><span style={{color:"#38bdf8",fontStyle:"italic"}}>Commençons par l'audit gratuit.</span>
                </h2>
                <p style={{color:"rgba(255,255,255,.7)",margin:0,fontSize:".95rem"}}>Aucune obligation. Résultats et rapport sous 48h.</p>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",flexShrink:0}}>
                <button style={S.btnGold} onClick={()=>openModal("audit")}
                  onMouseEnter={e=>e.currentTarget.style.background="#fbbf24"}
                  onMouseLeave={e=>e.currentTarget.style.background="#f59e0b"}>
                  🔍 Audit gratuit →
                </button>
                <button style={S.btnOutlineWhite} onClick={()=>openModal("devis")}>Demander un devis</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DEMANDE DE DEVIS */}
      {modal === "devis" && (
        <ModalWrap onClose={closeModal}>
          {sent ? <SuccessView name={form.name} email={form.email} onClose={closeModal} msg={corpAssist ? `Merci ${form.name} ! Votre conseillère Corporate ${corpAssist.prenom} ${corpAssist.nom} vous contactera sous 24h.` : `Merci ${form.name} ! Notre équipe Corporate vous contactera sous 24h pour discuter de vos besoins.`}/> : (
            <>
              <div style={S.modalHeader}>
                <h2 style={S.modalTitle}>Demande de devis — {selOffer?.title||"Formation entreprise"}</h2>
                <p style={S.modalSub}>Réponse personnalisée sous 24h · Gratuit · Sans engagement</p>
              </div>
              <div style={S.modalBody}>
                {showAuthGate ? (
                  <AuthGate authTab={authTab} setAuthTab={setAuthTab} authForm={authForm} setAuthForm={setAuthForm} authLoading={authLoading} authErr={authErr} inp={S.inp} onLogin={handleAuthLogin} onRegister={handleAuthRegister} onGoogle={handleGoogleAuth} onBack={()=>setShowAuthGate(false)} />
                ) : (
                  <>
                    {supaUser && (
                      <div style={{padding:"8px 12px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:14}}>👤</span>
                        <span style={{fontSize:".78rem",color:"#15803d",fontWeight:600}}>Connecté en tant que <strong>{supaUser.email}</strong> — vos coordonnées sont pré-remplies</span>
                      </div>
                    )}
                    <div className="pe-modal-frow" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                      <FField label="Entreprise *"><input className="pe-input" style={S.inp} placeholder="Mon Entreprise SARL" value={form.company} onChange={e=>set("company",e.target.value)}/></FField>
                      <FField label="Secteur d'activité"><select className="pe-input" style={{...S.inp,cursor:"pointer"}} value={form.sector} onChange={e=>set("sector",e.target.value)}><option value="">Sélectionner</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select></FField>
                    </div>
                    <div className="pe-modal-frow" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                      <FField label="Effectif total"><select className="pe-input" style={{...S.inp,cursor:"pointer"}} value={form.size} onChange={e=>set("size",e.target.value)}><option value="">Sélectionner</option>{SIZES.map(s=><option key={s}>{s}</option>)}</select></FField>
                      <FField label="Nb à former"><select className="pe-input" style={{...S.inp,cursor:"pointer"}} value={form.employees} onChange={e=>set("employees",e.target.value)}><option value="">Sélectionner</option>{["1–5","6–10","11–20","21–50","50+"].map(s=><option key={s}>{s}</option>)}</select></FField>
                    </div>
                    <div className="pe-modal-frow" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                      <FField label="Votre nom *"><input className="pe-input" style={S.inp} placeholder="Jean Kouamé" value={form.name} onChange={e=>set("name",e.target.value)}/></FField>
                      <FField label="Poste / Fonction"><input className="pe-input" style={S.inp} placeholder="DRH, Directeur..." value={form.role} onChange={e=>set("role",e.target.value)}/></FField>
                    </div>
                    <div className="pe-modal-frow" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                      <FField label="Email *"><input className="pe-input" style={S.inp} type="email" placeholder="jean@entreprise.ci" value={form.email} onChange={e=>set("email",e.target.value)}/></FField>
                      <FField label="Téléphone *"><input className="pe-input" style={S.inp} placeholder="+225 07 00 00 00 00" value={form.phone} onChange={e=>set("phone",e.target.value)}/></FField>
                    </div>
                    <FField label="Budget envisagé"><select className="pe-input" style={{...S.inp,cursor:"pointer"}} value={form.budget} onChange={e=>set("budget",e.target.value)}><option value="">Sélectionner</option>{BUDGETS.map(b=><option key={b}>{b}</option>)}</select></FField>
                    <FField label="Message / Besoins spécifiques" mt><textarea className="pe-input" style={{...S.inp,height:80,resize:"vertical"}} placeholder="Décrivez vos objectifs de formation..." value={form.message} onChange={e=>set("message",e.target.value)}/></FField>
                    <Consent form={form} set={set}/>
                    {erreur && <p style={{color:"#dc2626",fontSize:".82rem",textAlign:"center",margin:"8px 0 0"}}>{erreur}</p>}
                    <SubmitBtn submitting={submitting} onClick={handleSubmit} label={supaUser ? "Envoyer ma demande →" : "Continuer →"}/>
                    {!supaUser && <p style={{textAlign:"center",fontSize:".73rem",color:"#94a3b8",marginTop:6}}>🔒 Une connexion rapide sera demandée pour valider votre demande</p>}
                    {supaUser && <p style={{textAlign:"center",fontSize:".73rem",color:"#94a3b8",marginTop:8}}>✓ Gratuit · ✓ Réponse sous 24h · ✓ Sans engagement</p>}
                  </>
                )}
              </div>
            </>
          )}
        </ModalWrap>
      )}

      {/* MODAL AUDIT GRATUIT */}
      {modal === "audit" && (
        <ModalWrap onClose={closeModal}>
          {sent ? <SuccessView name={form.name} email={form.email} onClose={closeModal} msg={`Merci ${form.name} ! Notre équipe vous contactera sous 24h pour planifier votre audit linguistique gratuit.`}/> : (
            <>
              <div style={{...S.modalHeader, background:"linear-gradient(135deg,#0f172a,#059669)"}}>
                <h2 style={S.modalTitle}>🔍 Audit linguistique gratuit</h2>
                <p style={S.modalSub}>Rapport CECRL complet · Plan de formation · Devis · 100% gratuit</p>
              </div>
              <div style={S.modalBody}>
                {showAuthGate ? (
                  <AuthGate authTab={authTab} setAuthTab={setAuthTab} authForm={authForm} setAuthForm={setAuthForm} authLoading={authLoading} authErr={authErr} inp={S.inp} onLogin={handleAuthLogin} onRegister={handleAuthRegister} onGoogle={handleGoogleAuth} onBack={()=>setShowAuthGate(false)} />
                ) : (
                  <>
                    {supaUser && (
                      <div style={{padding:"8px 12px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:14}}>👤</span>
                        <span style={{fontSize:".78rem",color:"#15803d",fontWeight:600}}>Connecté en tant que <strong>{supaUser.email}</strong></span>
                      </div>
                    )}
                    <div className="pe-audit-benefits" style={S.auditBenefits}>
                      {["Analyse CECRL de vos équipes","Rapport de recommandations offert","Plan de formation sur-mesure","Conseil financement FDFP"].map((it,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:8}}><span style={{...S.checkDot,background:"#059669"}}>✓</span><span style={{fontSize:".84rem",color:"#334155"}}>{it}</span></div>
                      ))}
                    </div>
                    <div className="pe-modal-frow" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                      <FField label="Entreprise *"><input className="pe-input" style={S.inp} placeholder="Mon Entreprise SARL" value={form.company} onChange={e=>set("company",e.target.value)}/></FField>
                      <FField label="Nb d'employés à évaluer"><select className="pe-input" style={{...S.inp,cursor:"pointer"}} value={form.employees} onChange={e=>set("employees",e.target.value)}><option value="">Sélectionner</option>{["1–5","6–10","11–20","21–50","50+"].map(s=><option key={s}>{s}</option>)}</select></FField>
                    </div>
                    <div className="pe-modal-frow" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                      <FField label="Votre nom *"><input className="pe-input" style={S.inp} placeholder="Jean Kouamé" value={form.name} onChange={e=>set("name",e.target.value)}/></FField>
                      <FField label="Email *"><input className="pe-input" style={S.inp} type="email" placeholder="jean@entreprise.ci" value={form.email} onChange={e=>set("email",e.target.value)}/></FField>
                    </div>
                    <FField label="Téléphone *"><input className="pe-input" style={S.inp} placeholder="+225 07 00 00 00 00" value={form.phone} onChange={e=>set("phone",e.target.value)}/></FField>
                    <FField label="Message (optionnel)" mt><textarea className="pe-input" style={{...S.inp,height:72,resize:"vertical"}} placeholder="Précisez vos contraintes ou questions…" value={form.message} onChange={e=>set("message",e.target.value)}/></FField>
                    <Consent form={form} set={set}/>
                    {erreur && <p style={{color:"#dc2626",fontSize:".82rem",textAlign:"center",margin:"8px 0 0"}}>{erreur}</p>}
                    <button style={{...S.planBtn,background:"#059669",color:"#fff",border:"none",width:"100%",padding:"13px",fontSize:".96rem",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:4,opacity:submitting?.7:1}} onClick={handleSubmit} disabled={submitting}>
                      {submitting?<><span style={{width:15,height:15,border:"2.5px solid rgba(255,255,255,.35)",borderTopColor:"#fff",borderRadius:"50%",animation:"peSpin .8s linear infinite",display:"inline-block"}}/>Envoi…</>: supaUser ? "🔍 Demander mon audit gratuit" : "Continuer →"}
                    </button>
                    {!supaUser && <p style={{textAlign:"center",fontSize:".73rem",color:"#94a3b8",marginTop:6}}>🔒 Une connexion rapide sera demandée pour valider</p>}
                  </>
                )}
              </div>
            </>
          )}
        </ModalWrap>
      )}

      <Footer/>
    </>
  );
}

/* ── Shared sub-components ───────────────────────────────── */
const ModalWrap=({children,onClose})=>(
  <div style={S.overlay} onClick={onClose}>
    <div style={S.modalCard} onClick={e=>e.stopPropagation()}>
      <button style={S.modalClose} onClick={onClose}>✕</button>
      {children}
    </div>
  </div>
);
const FField=({label,children,mt})=><div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:mt?12:0}}><label style={{fontSize:".76rem",fontWeight:700,color:"#0f172a"}}>{label}</label>{children}</div>;
const Consent=({form,set})=>(
  <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",margin:"14px 0"}}>
    <input type="checkbox" checked={form.consent} onChange={e=>set("consent",e.target.checked)} style={{accentColor:"#1e3a8a",width:15,height:15,marginTop:2}}/>
    <span style={{fontSize:".82rem",color:"#475569",lineHeight:1.5}}>J'accepte que mes données soient utilisées par BET pour préparer mon audit et me recontacter. <span style={{color:"#94a3b8"}}>(Confidentielles · Désinscription facile)</span></span>
  </label>
);
const SubmitBtn=({submitting,onClick,label})=>(
  <button style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#1e3a8a,#dc2626)",color:"#fff",border:"none",borderRadius:999,fontFamily:"'Montserrat','Segoe UI',sans-serif",fontWeight:800,fontSize:".95rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:submitting?.7:1}} onClick={onClick} disabled={submitting}>
    {submitting?<><span style={{width:15,height:15,border:"2.5px solid rgba(255,255,255,.35)",borderTopColor:"#fff",borderRadius:"50%",animation:"peSpin .8s linear infinite",display:"inline-block"}}/>Envoi en cours…</>:label}
  </button>
);
const AuthGate=({authTab,setAuthTab,authForm,setAuthForm,authLoading,authErr,inp,onLogin,onRegister,onGoogle,onBack})=>{
  const setF=(k,v)=>setAuthForm(p=>({...p,[k]:v}));
  const isOk=authErr&&authErr.startsWith("✓");
  return(
    <div>
      {/* Bannière données conservées */}
      <div style={{padding:"10px 14px",background:"#f0fdf4",borderRadius:10,border:"1px solid #bbf7d0",marginBottom:18,display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:20}}>✅</span>
        <div>
          <div style={{fontSize:".82rem",fontWeight:700,color:"#15803d"}}>Votre formulaire est conservé</div>
          <div style={{fontSize:".76rem",color:"#64748b",marginTop:2}}>Connectez-vous pour envoyer votre demande — vous n'aurez pas à tout ressaisir.</div>
        </div>
      </div>
      {/* Onglets */}
      <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:"1.5px solid #e2e8f0",marginBottom:16}}>
        {[["login","Se connecter"],["register","Créer un compte"]].map(([t,l])=>(
          <button key={t} onClick={()=>setAuthTab(t)} style={{flex:1,padding:"10px 0",border:"none",fontWeight:700,fontSize:".84rem",cursor:"pointer",background:authTab===t?"#1e3a8a":"#fff",color:authTab===t?"#fff":"#374151",transition:"background .2s"}}>{l}</button>
        ))}
      </div>
      {/* Champs */}
      {authTab==="login"?(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input className="pe-input" style={inp} type="email" placeholder="Email *" value={authForm.email} onChange={e=>setF("email",e.target.value)}/>
          <input className="pe-input" style={inp} type="password" placeholder="Mot de passe *" value={authForm.password} onChange={e=>setF("password",e.target.value)}/>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <input className="pe-input" style={inp} placeholder="Prénom *" value={authForm.prenom} onChange={e=>setF("prenom",e.target.value)}/>
            <input className="pe-input" style={inp} placeholder="Nom *" value={authForm.nom} onChange={e=>setF("nom",e.target.value)}/>
          </div>
          <input className="pe-input" style={inp} type="email" placeholder="Email *" value={authForm.email} onChange={e=>setF("email",e.target.value)}/>
          <input className="pe-input" style={inp} placeholder="Téléphone" value={authForm.telephone} onChange={e=>setF("telephone",e.target.value)}/>
          <input className="pe-input" style={inp} type="password" placeholder="Mot de passe *" value={authForm.password} onChange={e=>setF("password",e.target.value)}/>
        </div>
      )}
      {authErr&&<p style={{fontSize:".78rem",margin:"8px 0 0",textAlign:"center",color:isOk?"#15803d":"#dc2626"}}>{authErr}</p>}
      {/* Bouton principal */}
      <button onClick={authTab==="login"?onLogin:onRegister} disabled={authLoading}
        style={{width:"100%",marginTop:14,padding:"12px",background:"#1e3a8a",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",opacity:authLoading?.7:1,fontSize:".9rem",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        {authLoading?<><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,.35)",borderTopColor:"#fff",borderRadius:"50%",animation:"peSpin .8s linear infinite",display:"inline-block"}}/>Chargement…</>:authTab==="login"?"Se connecter":"Créer mon compte"}
      </button>
      {/* Séparateur */}
      <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0"}}>
        <div style={{flex:1,height:1,background:"#e2e8f0"}}/><span style={{fontSize:".74rem",color:"#94a3b8",fontWeight:600}}>ou</span><div style={{flex:1,height:1,background:"#e2e8f0"}}/>
      </div>
      {/* Google */}
      <button onClick={onGoogle}
        style={{width:"100%",padding:"11px",background:"#fff",color:"#374151",border:"1.5px solid #e2e8f0",borderRadius:8,fontWeight:700,fontSize:".85rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#4285F4" d="M47.53 24.56c0-1.64-.15-3.21-.42-4.73H24v8.95h13.19c-.57 2.95-2.28 5.44-4.86 7.11v5.91h7.87c4.6-4.24 7.27-10.49 7.27-17.24z"/><path fill="#34A853" d="M24 48c6.62 0 12.18-2.2 16.24-5.97l-7.87-5.91c-2.19 1.47-4.99 2.34-8.37 2.34-6.44 0-11.9-4.35-13.85-10.2H2.02v6.1C6.07 43.06 14.43 48 24 48z"/><path fill="#FBBC05" d="M10.15 28.26A14.76 14.76 0 0 1 9.3 24c0-1.48.26-2.92.85-4.26v-6.1H2.02A23.99 23.99 0 0 0 0 24c0 3.88.92 7.55 2.02 10.36l8.13-6.1z"/><path fill="#EA4335" d="M24 9.54c3.63 0 6.88 1.25 9.44 3.69l7.07-7.07C36.17 2.19 30.62 0 24 0 14.43 0 6.07 4.94 2.02 13.64l8.13 6.1C12.1 13.89 17.56 9.54 24 9.54z"/></svg>
        Continuer avec Google
      </button>
      {/* Retour */}
      <button onClick={onBack}
        style={{width:"100%",marginTop:10,padding:"10px",background:"transparent",color:"#64748b",border:"1.5px solid #e2e8f0",borderRadius:8,fontWeight:600,fontSize:".82rem",cursor:"pointer"}}>
        ← Retour au formulaire
      </button>
    </div>
  );
};

const SuccessView=({name,email,onClose,msg})=>(
  <div style={{textAlign:"center",padding:"36px 28px"}}>
    <div style={{fontSize:"3.2rem",marginBottom:14}}>✅</div>
    <h3 style={{fontFamily:"'Montserrat','Segoe UI',sans-serif",fontSize:"1.4rem",margin:"0 0 10px",fontWeight:400}}>Demande envoyée !</h3>
    <p style={{color:"#475569",fontSize:".9rem",lineHeight:1.7,margin:"0 0 24px"}}>{msg||`Merci ${name} ! Un expert BET contactera ${email} sous 24h.`}</p>
    <button style={{padding:"11px 26px",background:"#1e3a8a",color:"#fff",border:"none",borderRadius:999,fontFamily:"'Montserrat','Segoe UI',sans-serif",fontWeight:800,fontSize:".92rem",cursor:"pointer"}} onClick={onClose}>Fermer</button>
  </div>
);

const FF = "'Montserrat','Segoe UI',sans-serif";
const FD = "'Montserrat','Segoe UI',sans-serif"; 
const S={
  page:         { fontFamily:FF, background:"#f8fafc", minHeight:"100vh", color:"#0f172a" },
  inner:        { maxWidth:1180, margin:"0 auto", padding:"0 24px" },
  body:         { padding:"52px 0 64px" },

  hero:         { background:"linear-gradient(135deg,#0f172a 0%,#1e2a4a 55%,#1e3a8a 100%)", padding:"52px 0 0", position:"relative", overflow:"hidden" },
  heroOrb1:     { position:"absolute", width:380, height:380, borderRadius:"50%", background:"rgba(220,38,38,.1)", top:-100, right:-60, pointerEvents:"none" },
  heroOrb2:     { position:"absolute", width:220, height:220, borderRadius:"50%", background:"rgba(30,58,138,.15)", bottom:40, left:-50, pointerEvents:"none" },
  heroInner:    { maxWidth:1180, margin:"0 auto", padding:"0 24px", position:"relative", zIndex:1 },
  breadcrumb:   { display:"flex", alignItems:"center", gap:8, marginBottom:22, fontSize:".82rem", flexWrap:"wrap" },
  bLink:        { color:"rgba(255,255,255,.6)", cursor:"pointer", textDecoration:"underline" },
  bSep:         { color:"rgba(255,255,255,.3)" },
  heroLayout:   { display:"grid", gridTemplateColumns:"1fr 320px", gap:48, alignItems:"center", paddingBottom:52 },
  heroTags:     { display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" },
  tagBlue:      { background:"rgba(30,58,138,.3)", border:"1px solid rgba(30,58,138,.6)", color:"#93c5fd", borderRadius:999, padding:"4px 14px", fontSize:".72rem", fontWeight:800 },
  tagRed:       { background:"rgba(220,38,38,.25)", border:"1px solid rgba(220,38,38,.5)", color:"#fca5a5", borderRadius:999, padding:"4px 14px", fontSize:".72rem", fontWeight:800 },
  heroH1:       { fontFamily:FD, fontSize:"clamp(2rem,4.5vw,3.2rem)", color:"#fff", margin:"0 0 14px", fontWeight:400, lineHeight:1.1 },
  heroAccent:   { color:"#38bdf8", fontStyle:"italic" },
  heroDesc:     { color:"rgba(255,255,255,.75)", fontSize:"1rem", lineHeight:1.75, margin:"0 0 24px", maxWidth:520 },
  heroCtas:     { display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 },
  heroTrust:    { display:"flex", flexWrap:"wrap", gap:14 },
  heroStatsCard:{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:18, padding:"22px 20px" },
  heroStatRow:  { display:"flex", alignItems:"center", gap:12, marginBottom:12, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,.08)" },

  badge:        { display:"inline-block", background:"#eff6ff", color:"#1e3a8a", border:"1px solid #bfdbfe", borderRadius:999, padding:"4px 14px", fontSize:".72rem", fontWeight:800, letterSpacing:".06em", marginBottom:10 },
  sH2:          { fontFamily:FD, fontSize:"clamp(1.6rem,3vw,2.2rem)", fontWeight:400, color:"#0f172a", margin:"0 0 10px" },
  sDesc:        { fontSize:".95rem", color:"#64748b", lineHeight:1.65, margin:"0 0 32px" },

  offersGrid:   { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:20, marginBottom:0 },
  offerCard:    { background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"22px 18px", display:"flex", flexDirection:"column", gap:10, cursor:"pointer", transition:"all .25s", boxShadow:"0 2px 8px rgba(0,0,0,.05)" },
  offerTag:     { display:"inline-block", borderRadius:999, padding:"3px 11px", fontSize:".68rem", fontWeight:800, letterSpacing:".06em", alignSelf:"flex-start" },
  offerIcoWrap: { width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" },
  offerTitle:   { fontFamily:FD, fontSize:"1.15rem", margin:0, fontWeight:400 },
  offerDesc:    { fontSize:".84rem", color:"#64748b", lineHeight:1.6, margin:0, flex:1 },
  offerBtn:     { padding:"9px 16px", borderRadius:999, fontFamily:FF, fontWeight:700, fontSize:".82rem", cursor:"pointer", transition:"all .2s", marginTop:"auto" },

  plansGrid:    { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:22, marginBottom:28 },
  planCard:     { borderRadius:16, padding:"26px 20px", cursor:"pointer", transition:"all .25s", position:"relative", display:"flex", flexDirection:"column", gap:0 },
  planBadge:    { position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", color:"#fff", borderRadius:999, padding:"2px 14px", fontSize:".66rem", fontWeight:800, whiteSpace:"nowrap" },
  checkDot:     { width:18, height:18, borderRadius:"50%", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:800, flexShrink:0 },
  planBtn:      { width:"100%", padding:"11px", borderRadius:999, fontFamily:FF, fontWeight:800, fontSize:".88rem", cursor:"pointer", transition:"all .2s", marginTop:"auto" },

  guaranteeBand:{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"18px 20px", display:"flex", alignItems:"flex-start", gap:16, color:"#166534" },

  benefGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, marginBottom:40 },
  benefCard:    { display:"flex", alignItems:"flex-start", gap:14, background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"16px 14px", transition:"all .25s" },

  clientsBlock: { background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"22px", marginBottom:48 },
  clientsRow:   { display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" },
  clientPill:   { background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:999, padding:"6px 16px", fontSize:".82rem", fontWeight:700, color:"#475569" },

  ctaFinal:     { background:"linear-gradient(135deg,#0f172a,#1e3a8a 60%,#0891b2 100%)", borderRadius:20, padding:"36px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:32, position:"relative", overflow:"hidden" },
  ctaFinalOrb:  { position:"absolute", width:240, height:240, borderRadius:"50%", background:"rgba(220,38,38,.12)", top:-80, right:200, pointerEvents:"none" },

  overlay:      { position:"fixed", inset:0, background:"rgba(0,0,0,.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9000, padding:16, animation:"peFI .2s ease" },
  modalCard:    { background:"#fff", borderRadius:20, width:"100%", maxWidth:600, maxHeight:"92vh", overflowY:"auto", position:"relative", animation:"peSI .25s ease", boxShadow:"0 24px 60px rgba(0,0,0,.2)" },
  modalClose:   { position:"absolute", top:14, right:14, background:"rgba(255,255,255,.2)", border:"none", width:28, height:28, borderRadius:"50%", cursor:"pointer", color:"#fff", fontSize:".88rem", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 },
  modalHeader:  { background:"linear-gradient(135deg,#0f172a,#1e3a8a)", padding:"24px 28px 20px" },
  modalTitle:   { fontFamily:FD, fontSize:"1.3rem", color:"#fff", margin:"0 0 4px", fontWeight:400 },
  modalSub:     { fontSize:".82rem", color:"rgba(255,255,255,.6)", margin:0 },
  modalBody:    { padding:"22px 28px 26px" },
  auditBenefits:{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"14px 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 },
  inp:          { width:"100%", padding:"10px 13px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:".9rem", fontFamily:FF, boxSizing:"border-box", color:"#0f172a", background:"#fff", transition:"border-color .2s" },

  btnBlue:      { padding:"11px 24px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:999, fontFamily:FF, fontWeight:800, fontSize:".9rem", cursor:"pointer", transition:"background .2s", boxShadow:"0 4px 14px rgba(30,58,138,.3)" },
  btnOutlineWhite:{ padding:"10px 22px", background:"transparent", color:"rgba(255,255,255,.85)", border:"1.5px solid rgba(255,255,255,.35)", borderRadius:999, fontFamily:FF, fontWeight:700, fontSize:".9rem", cursor:"pointer" },
  btnGold:      { padding:"12px 26px", background:"#f59e0b", color:"#000", border:"none", borderRadius:999, fontFamily:FF, fontWeight:800, fontSize:".95rem", cursor:"pointer", transition:"background .2s", boxShadow:"0 4px 14px rgba(245,158,11,.35)", whiteSpace:"nowrap" },
};