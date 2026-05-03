import React, { useEffect, useRef, useState, useCallback } from "react";
import Footer from "../Footer/Footer";
import { Link } from "react-router-dom";
import SEO from "../Components/SEO/SEO";
import BlogSection from "../Components/BlogSection/BlogSection";
import { insertInscriptionAdulte } from "../../services/formsService";

/* ═══════════════════════════════════════════════════════════
   ACCUEIL.JSX — BET · Conversion-First · Particuliers
   Philosophie : Hero → Profil → Programme → Paiement (2 clics)
═══════════════════════════════════════════════════════════ */

if (!document.querySelector("#bet-fonts")) {
  const link = document.createElement("link");
  link.id = "bet-fonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap";
  document.head.appendChild(link);
}

if (!document.querySelector("#bet-kf")) {
  const s = document.createElement("style");
  s.id = "bet-kf";
  s.textContent = `
    @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes scaleIn { from{transform:scale(.95);opacity:0} to{transform:scale(1);opacity:1} }
    @keyframes spinSlow{ to{transform:rotate(360deg)} }
    @keyframes pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)} 60%{box-shadow:0 0 0 14px rgba(220,38,38,0)} }
    @keyframes ticker  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes barFill { from{width:0} to{width:var(--w,100%)} }
    @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes slideDown { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }

    .bet-btn-primary:hover { transform:translateY(-3px)!important; box-shadow:0 10px 30px rgba(220,38,38,.45)!important; }
    .bet-btn-secondary:hover { background:rgba(255,255,255,.15)!important; border-color:#fff!important; }
    .bet-card:hover { transform:translateY(-6px)!important; box-shadow:0 24px 56px rgba(0,0,0,.14)!important; }
    .bet-pill:hover { background:#dc2626!important; color:#fff!important; border-color:#dc2626!important; }
    .bet-play:hover .bet-play-icon { transform:scale(1.1)!important; }
    .bet-sticky-btn:hover { background:#b91c1c!important; transform:scale(1.02)!important; }
    .bet-enroll-direct:hover { background:#1e3a8a!important; }
    
    @media (max-width:900px){
      .bet-hero-content{padding:0 20px!important;}
      .bet-programs-grid{grid-template-columns:1fr 1fr!important;}
      .bet-modes-grid{grid-template-columns:1fr!important;}
      .bet-proof-strip{grid-template-columns:repeat(2,1fr)!important;}
    }
    @media (max-width:640px){
      .bet-hero-h1{font-size:2rem!important;}
      .bet-programs-grid{grid-template-columns:1fr!important;}
      .bet-hero-ctas{flex-direction:column!important;align-items:stretch!important;}
      .bet-profile-bar{flex-wrap:wrap!important;gap:8px!important;}
      .bet-proof-strip{grid-template-columns:repeat(2,1fr)!important;gap:12px!important;}
      .bet-payment-grid{grid-template-columns:1fr!important;}
      .bet-testi-row{grid-template-columns:1fr!important;}
    }
  `;
  document.head.appendChild(s);
}

/* ── Hooks ────────────────────────────────────────────── */
function useInView(threshold = 0.18) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [threshold]);
  return [ref, v];
}

function useCounter(target, dur = 1800, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, dur]);
  return val;
}

/* ─────────────────────────────────────────────────────────
   PROGRAMMES DATA
───────────────────────────────────────────────────────── */
const PROGRAMS = [
  {
    id: 1, title: "TOEIC", sub: "Score 700+ garanti", level: "B1 → C1",
    duration: "6 semaines", price: 390000, priceLabel: "390 000 FCFA",
    rating: 4.9, students: 1240, spots: 4,
    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
    tag: "BESTSELLER", tagColor: "#d97706", tagBg: "#fef3c7",
    color: "#d97706",
    desc: "La certification la plus demandée par les recruteurs ivoiriens et internationaux.",
    features: ["15 tests blancs chronométrés", "Score garanti 700+", "Coach personnel dédié", "Vocabulaire Business intensif"],
    highlight: "98% de réussite",
    profiles: ["particulier", "professionnel"],
  },
  {
    id: 2, title: "TOEFL iBT", sub: "Accès université mondiale", level: "B2 → C2",
    duration: "8 semaines", price: 450000, priceLabel: "450 000 FCFA",
    rating: 4.8, students: 980, spots: 6,
    img: "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=600&q=80",
    tag: "TOP NOTÉ", tagColor: "#0891b2", tagBg: "#e0f2fe",
    color: "#0891b2",
    desc: "Ouvrez les portes des meilleures universités anglophones du monde.",
    features: ["4 compétences Reading/Listening/Speaking/Writing", "200+ exercices accès illimité", "Correction personnalisée", "Coaching Speaking individuel"],
    highlight: "Score 100+ iBT",
    profiles: ["étudiant", "particulier"],
  },
  {
    id: 3, title: "IELTS Academic", sub: "Band 7.0 garanti", level: "B2 → C2",
    duration: "10 semaines", price: 520000, priceLabel: "520 000 FCFA",
    rating: 4.9, students: 870, spots: 3,
    img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
    tag: "COMPLET", tagColor: "#7c3aed", tagBg: "#f3e8ff",
    color: "#7c3aed",
    desc: "Le passeport pour étudier, travailler ou s'installer dans un pays anglophone.",
    features: ["Academic + General Training", "Tuteur natif anglophone", "Band 7.0 garanti ou remboursé", "Corrections individuelles illimitées"],
    highlight: "Émigration & universités",
    profiles: ["étudiant", "particulier", "professionnel"],
  },
  {
    id: 4, title: "Anglais Pro", sub: "Dès 35 000 FCFA/mois", level: "A2 → B2",
    duration: "Flexible", price: 35000, priceLabel: "À partir de 35 000 FCFA",
    rating: 4.7, students: 2100, spots: 12,
    img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80",
    tag: "POPULAIRE", tagColor: "#dc2626", tagBg: "#fef2f2",
    color: "#dc2626",
    desc: "Entretiens, présentations, négociations — parlez enfin l'anglais des affaires.",
    features: ["Planning 100% flexible", "Mise en situation réelle", "Certification BET officielle", "Financement FDFP possible"],
    highlight: "Pour tous niveaux",
    profiles: ["particulier", "professionnel"],
  },
];

const PROFILES = [
  { id: "tous", label: "Tous les profils", emoji: "🌟" },
  { id: "particulier", label: "Particulier", emoji: "👤" },
  { id: "étudiant", label: "Étudiant", emoji: "🎓" },
  { id: "professionnel", label: "Professionnel", emoji: "💼" },
];

/* ─────────────────────────────────────────────────────────
   PAYMENT MODAL (streamlined — 1 seul modal)
───────────────────────────────────────────────────────── */
const PaymentModal = ({ program, onClose }) => {
  const [step, setStep] = useState(1); // 1=infos, 2=paiement, 3=succès
  const [method, setMethod] = useState("mobile");
  const [data, setData] = useState({ nom: "", email: "", tel: "", numero: "", carte: "", expiry: "", cvv: "", consent: false });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  const upd = (k, v) => setData(p => ({ ...p, [k]: v }));

  const goStep2 = () => {
    if (!data.nom || !data.email || !data.tel) return alert("Remplissez tous les champs");
    setStep(2);
  };

  const confirm = async () => {
    if (method === "mobile" && !data.numero) return alert("Entrez votre numéro Mobile Money");
    if (method === "card" && (!data.carte || !data.expiry || !data.cvv)) return alert("Complétez les infos carte");
    if (!data.consent) return alert("Acceptez les conditions pour continuer");
    setLoading(true);
    setErreur("");
    try {
      await insertInscriptionAdulte({
        nom_complet: data.nom,
        email: data.email,
        telephone: data.tel,
        offre_titre: program.title,
        offre_id: String(program.id),
        mode_paiement: method === "mobile" ? `Mobile Money — ${data.numero}` : "Carte bancaire",
        statut: "en_attente",
      });
      setStep(3);
    } catch (e) {
      setErreur("Une erreur est survenue. Veuillez réessayer ou nous contacter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={PS.overlay} onClick={onClose}>
      <div style={PS.modal} onClick={e => e.stopPropagation()}>
        <button style={PS.close} onClick={onClose}>✕</button>

        {/* Header programme */}
        <div style={PS.header}>
          <div style={PS.headerLeft}>
            <span style={{ ...PS.tag, background: program.tagColor + "33", color: program.tagColor }}>{program.tag}</span>
            <h2 style={PS.headerTitle}>{program.title}</h2>
            <p style={PS.headerSub}>{program.sub}</p>
          </div>
          <div style={PS.headerPrice}>
            <div style={PS.price}>{program.priceLabel}</div>
            <div style={PS.priceNote}>par personne · accès complet</div>
            {program.spots <= 5 && (
              <div style={PS.urgency}>🔥 {program.spots} places restantes</div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div style={PS.steps}>
          {[{ n: 1, l: "Vos infos" }, { n: 2, l: "Paiement" }, { n: 3, l: "Confirmé !" }].map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ ...PS.stepDot, background: step >= s.n ? "#dc2626" : "#e2e8f0", color: step >= s.n ? "#fff" : "#94a3b8" }}>{step > s.n ? "✓" : s.n}</div>
              <span style={{ fontSize: ".78rem", fontWeight: 700, color: step >= s.n ? "#0f172a" : "#94a3b8" }}>{s.l}</span>
              {s.n < 3 && <div style={{ width: 32, height: 2, background: step > s.n ? "#dc2626" : "#e2e8f0", borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={PS.body}>
            <p style={PS.bodyTitle}>Vos informations</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="bet-payment-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={PS.label}>Nom complet *</label>
                  <input style={PS.input} value={data.nom} onChange={e => upd("nom", e.target.value)} placeholder="Jean Kouamé" />
                </div>
                <div>
                  <label style={PS.label}>Email *</label>
                  <input style={PS.input} type="email" value={data.email} onChange={e => upd("email", e.target.value)} placeholder="jean@exemple.com" />
                </div>
              </div>
              <div>
                <label style={PS.label}>Téléphone *</label>
                <input style={PS.input} type="tel" value={data.tel} onChange={e => upd("tel", e.target.value)} placeholder="+225 07 00 00 00 00" />
              </div>
              {/* Features incluses */}
              <div style={PS.featBox}>
                <p style={{ fontSize: ".78rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Ce programme comprend :</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {program.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, fontSize: ".76rem", color: "#334155" }}>
                      <span style={{ color: "#10b981", fontWeight: 800 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
              </div>
              <button style={PS.btnNext} onClick={goStep2}>Continuer vers le paiement →</button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={PS.body}>
            <p style={PS.bodyTitle}>Choisissez votre mode de paiement</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              {[{ id: "mobile", icon: "📱", label: "Mobile Money" }, { id: "card", icon: "💳", label: "Carte bancaire" }].map(m => (
                <button key={m.id} style={{ ...PS.methodBtn, ...(method === m.id ? PS.methodBtnActive : {}) }} onClick={() => setMethod(m.id)}>
                  <span style={{ fontSize: "1.3rem" }}>{m.icon}</span>
                  <span style={{ fontSize: ".82rem", fontWeight: 700 }}>{m.label}</span>
                </button>
              ))}
            </div>

            {method === "mobile" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={PS.label}>Numéro Mobile Money (Orange · MTN · Moov · Wave) *</label>
                  <input style={PS.input} type="tel" value={data.numero} onChange={e => upd("numero", e.target.value)} placeholder="07 00 00 00 00" />
                  <p style={{ fontSize: ".72rem", color: "#64748b", marginTop: 4 }}>Une demande de paiement vous sera envoyée sur ce numéro.</p>
                </div>
              </div>
            )}

            {method === "card" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={PS.label}>Numéro de carte *</label>
                  <input style={PS.input} value={data.carte} onChange={e => upd("carte", e.target.value)} placeholder="1234 5678 9012 3456" />
                </div>
                <div className="bet-payment-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={PS.label}>Expiration *</label>
                    <input style={PS.input} value={data.expiry} onChange={e => upd("expiry", e.target.value)} placeholder="MM/AA" />
                  </div>
                  <div>
                    <label style={PS.label}>CVV *</label>
                    <input style={PS.input} type="password" value={data.cvv} onChange={e => upd("cvv", e.target.value)} placeholder="•••" />
                  </div>
                </div>
              </div>
            )}

            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer", marginTop: 16 }}>
              <input type="checkbox" checked={data.consent} onChange={e => upd("consent", e.target.checked)} style={{ accentColor: "#dc2626", marginTop: 3, flexShrink: 0 }} />
              <span style={{ fontSize: ".78rem", color: "#64748b", lineHeight: 1.5 }}>J'accepte les conditions générales et l'utilisation de mes données pour la gestion de mon inscription.</span>
            </label>

            {erreur && (
              <p style={{ color: "#dc2626", fontSize: ".82rem", marginTop: 12, textAlign: "center" }}>{erreur}</p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={PS.btnBack} onClick={() => setStep(1)}>← Retour</button>
              <button style={{ ...PS.btnNext, flex: 1 }} onClick={confirm} disabled={loading}>
                {loading
                  ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><span style={PS.spinner} /> Traitement...</span>
                  : `🔒 Confirmer — ${program.priceLabel}`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "40px 32px" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: 12, animation: "floatUp 2s ease infinite" }}>🎉</div>
            <h3 style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "1.6rem", margin: "0 0 8px", color: "#0f172a" }}>Inscription confirmée !</h3>
            <p style={{ color: "#475569", lineHeight: 1.7, marginBottom: 8 }}>
              Un email a été envoyé à <strong>{data.email}</strong>.
            </p>
            <p style={{ color: "#475569", lineHeight: 1.7, marginBottom: 28, fontSize: ".92rem" }}>
              Notre équipe vous contacte sous <strong>24h</strong> pour valider votre place et vous donner accès à votre espace apprenant.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {["✓ Certification officielle agréée", "✓ Remboursement 30j", "✓ Accès immédiat à la plateforme"].map((t, i) => (
                <span key={i} style={{ fontSize: ".75rem", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 999, padding: "4px 12px", fontWeight: 700 }}>{t}</span>
              ))}
            </div>
            <button style={{ ...PS.btnNext, marginTop: 28, maxWidth: 200, margin: "28px auto 0" }} onClick={onClose}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
};

const PS = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeIn .2s ease" },
  modal: { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "92vh", overflowY: "auto", animation: "scaleIn .25s ease", boxShadow: "0 40px 100px rgba(0,0,0,.3)", position: "relative" },
  close: { position: "absolute", top: 12, right: 12, zIndex: 10, background: "rgba(0,0,0,.15)", border: "none", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: ".85rem", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 24px 0", gap: 16, flexWrap: "wrap" },
  headerLeft: { flex: 1 },
  headerPrice: { textAlign: "right" },
  tag: { display: "inline-block", fontSize: ".65rem", fontWeight: 800, letterSpacing: ".06em", borderRadius: 999, padding: "3px 10px", marginBottom: 6 },
  headerTitle: { fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "1.8rem", margin: "0 0 4px", fontWeight: 400, color: "#0f172a" },
  headerSub: { fontSize: ".88rem", color: "#64748b", margin: 0 },
  price: { fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "1.4rem", color: "#0f172a", fontWeight: 400 },
  priceNote: { fontSize: ".72rem", color: "#94a3b8", marginTop: 2 },
  urgency: { fontSize: ".75rem", background: "#fef3c7", color: "#d97706", borderRadius: 999, padding: "3px 10px", fontWeight: 700, marginTop: 6, display: "inline-block" },
  steps: { display: "flex", alignItems: "center", gap: 6, padding: "20px 24px 0", flexWrap: "wrap" },
  stepDot: { width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 800, flexShrink: 0 },
  body: { padding: "20px 24px 28px" },
  bodyTitle: { fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "1.1rem", color: "#0f172a", margin: "0 0 16px", fontWeight: 400 },
  label: { display: "block", fontSize: ".76rem", fontWeight: 700, color: "#0f172a", marginBottom: 5 },
  input: { width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: ".9rem", fontFamily: "'Montserrat', 'Segoe UI', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color .2s" },
  featBox: { background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0" },
  btnNext: { background: "linear-gradient(135deg,#dc2626,#1e3a8a)", color: "#fff", border: "none", borderRadius: 999, padding: "13px 24px", fontWeight: 800, fontSize: ".95rem", cursor: "pointer", width: "100%", fontFamily: "'Montserrat', 'Segoe UI', sans-serif", transition: "opacity .2s" },
  btnBack: { background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 999, padding: "13px 20px", fontWeight: 700, fontSize: ".88rem", cursor: "pointer", fontFamily: "'Montserrat', 'Segoe UI', sans-serif" },
  methodBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px", border: "2px solid #e2e8f0", borderRadius: 12, background: "#fff", cursor: "pointer", transition: "all .2s" },
  methodBtnActive: { border: "2px solid #1e3a8a", background: "#eff6ff" },
  spinner: { width: 16, height: 16, border: "2.5px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spinSlow .8s linear infinite", display: "inline-block" },
};

/* ─────────────────────────────────────────────────────────
   1. HERO SECTION
───────────────────────────────────────────────────────── */
const HeroSection = ({ activeProfile, setActiveProfile, onTest }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const IMGS = [
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80",
  ];
  useEffect(() => {
    const t = setInterval(() => setImgIdx(p => (p + 1) % IMGS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section style={HS.hero}>
      {IMGS.map((src, i) => (
        <div key={i} style={{ ...HS.bg, backgroundImage: `url(${src})`, opacity: i === imgIdx ? 1 : 0 }} />
      ))}
      <div style={HS.overlay} />

      <div className="bet-hero-content" style={HS.content}>
        {/* Badge */}
        <div style={{ animation: "fadeUp .6s ease .1s both" }}>
          <span style={HS.badge}>🏛️ Cabinet agréé de l'État · Côte d'Ivoire</span>
        </div>

        {/* H1 */}
        <h1 className="bet-hero-h1" style={{ ...HS.h1, animation: "fadeUp .7s ease .25s both" }}>
          Votre anglais,<br />
          <em style={HS.accent}>votre avenir.</em>
        </h1>

        <p style={{ ...HS.sub, animation: "fadeUp .7s ease .4s both" }}>
          Certifications TOEIC · TOEFL · IELTS — cours personnalisés pour particuliers, étudiants et professionnels en Côte d'Ivoire.
        </p>

        {/* Sélecteur de profil */}
        <div style={{ animation: "fadeUp .7s ease .5s both" }}>
          <p style={HS.profileLabel}>Quel est votre profil ?</p>
          <div className="bet-profile-bar" style={HS.profileBar}>
            {PROFILES.map(p => (
              <button key={p.id} style={{ ...HS.profileBtn, ...(activeProfile === p.id ? HS.profileBtnActive : {}) }} onClick={() => setActiveProfile(p.id)}>
                <span>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="bet-hero-ctas" style={{ ...HS.ctas, animation: "fadeUp .7s ease .65s both" }}>
          <a href="#programmes">
            <button className="bet-btn-primary" style={HS.btnPrimary}>
              Voir mes formations →
            </button>
          </a>
          <button className="bet-btn-secondary" style={HS.btnSecondary} onClick={onTest}>
            🧪 Tester mon niveau gratuitement
          </button>
        </div>

        {/* Social proof */}
        <div style={{ ...HS.proof, animation: "fadeUp .7s ease .8s both" }}>
          <div style={HS.avatarStack}>
            {["👩🏾‍💼", "👨🏽‍💻", "👩🏻‍🎓", "👨🏿‍🏫", "👩🏽‍💼"].map((e, i) => (
              <div key={i} style={{ ...HS.avatar, marginLeft: i === 0 ? 0 : -12, zIndex: 5 - i }}>{e}</div>
            ))}
          </div>
          <span style={HS.proofText}><strong style={{ color: "#fbbf24" }}>+5 000</strong> apprenants certifiés · <strong style={{ color: "#34d399" }}>98%</strong> de réussite</span>
        </div>
      </div>

      {/* Wave */}
      <div style={HS.wave}>
        <svg viewBox="0 0 1440 64" style={{ display: "block", width: "100%" }} preserveAspectRatio="none">
          <path fill="#fff" d="M0,32 C480,64 960,0 1440,32 L1440,64 L0,64 Z" />
        </svg>
      </div>
    </section>
  );
};

const HS = {
  hero: { position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" },
  bg: { position: "absolute", inset: 0, backgroundSize: "cover", backgroundPosition: "center", transition: "opacity 1s ease" },
  overlay: { position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(8,16,40,.9) 0%, rgba(8,16,40,.75) 55%, rgba(8,16,40,.4) 100%)", zIndex: 1 },
  content: { position: "relative", zIndex: 2, maxWidth: 680, margin: "0 auto 0 8%", padding: "80px 24px 100px 48px" },
  badge: { display: "inline-block", background: "rgba(8,145,178,.3)", border: "1px solid rgba(8,145,178,.5)", color: "#7dd3fc", borderRadius: 999, padding: "5px 16px", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".06em", marginBottom: 20 },
  h1: { fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "clamp(2.4rem,5.5vw,4.2rem)", color: "#fff", lineHeight: 1.1, margin: "0 0 18px" },
  accent: { color: "#38bdf8", fontStyle: "italic" },
  sub: { color: "rgba(255,255,255,.78)", fontSize: "1rem", lineHeight: 1.75, margin: "0 0 28px", maxWidth: 500 },
  profileLabel: { color: "rgba(255,255,255,.55)", fontSize: ".8rem", fontWeight: 600, letterSpacing: ".05em", marginBottom: 10, textTransform: "uppercase" },
  profileBar: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 },
  profileBtn: { display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.75)", borderRadius: 999, padding: "8px 18px", fontSize: ".85rem", fontWeight: 600, cursor: "pointer", transition: "all .2s", fontFamily: "'Montserrat', 'Segoe UI', sans-serif" },
  profileBtnActive: { background: "#0891b2", borderColor: "#0891b2", color: "#fff", boxShadow: "0 4px 16px rgba(8,145,178,.4)" },
  ctas: { display: "flex", gap: 12, flexWrap: "wrap" },
  btnPrimary: { background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "#fff", border: "none", borderRadius: 999, padding: "14px 30px", fontSize: "1rem", fontWeight: 800, cursor: "pointer", transition: "all .2s", boxShadow: "0 6px 24px rgba(220,38,38,.4)", fontFamily: "'Montserrat', 'Segoe UI', sans-serif", animation: "pulse 2.5s ease infinite" },
  btnSecondary: { background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,.45)", borderRadius: 999, padding: "13px 26px", fontSize: ".95rem", fontWeight: 700, cursor: "pointer", transition: "all .2s", fontFamily: "'Montserrat', 'Segoe UI', sans-serif" },
  proof: { display: "flex", alignItems: "center", gap: 14, marginTop: 32 },
  avatarStack: { display: "flex" },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.18)", border: "2px solid rgba(255,255,255,.55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".95rem" },
  proofText: { color: "rgba(255,255,255,.8)", fontSize: ".85rem" },
  wave: { position: "absolute", bottom: -1, left: 0, right: 0, zIndex: 3, lineHeight: 0 },
};

/* ─────────────────────────────────────────────────────────
   2. PROOF STRIP (Stats)
───────────────────────────────────────────────────────── */
const STATS = [
  { n: 5000, suf: "+", label: "Apprenants certifiés", icon: "🎓" },
  { n: 98, suf: "%", label: "Taux de réussite", icon: "🏆" },
  { n: 6, suf: "", label: "Centres en Côte d'Ivoire", icon: "📍" },
  { n: 15, suf: " ans", label: "D'expertise pédagogique", icon: "⭐" },
];

const Stat = ({ n, suf, label, icon, active }) => {
  const val = useCounter(n, 1800, active);
  return (
    <div style={PRFS.statCard}>
      <div style={PRFS.statIcon}>{icon}</div>
      <div style={PRFS.statNum}>{val.toLocaleString("fr")}{suf}</div>
      <div style={PRFS.statLabel}>{label}</div>
    </div>
  );
};

const ProofStrip = () => {
  const [ref, inView] = useInView();
  return (
    <section ref={ref} style={PRFS.strip}>
      <div style={PRFS.inner}>
        <div className="bet-proof-strip" style={PRFS.grid}>
          {STATS.map((s, i) => <Stat key={i} {...s} active={inView} />)}
        </div>
      </div>
    </section>
  );
};

const PRFS = {
  strip: { background: "linear-gradient(135deg,#0f172a,#1e3a8a)", padding: "52px 0" },
  inner: { maxWidth: 1100, margin: "0 auto", padding: "0 24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 },
  statCard: { textAlign: "center", padding: "20px 16px", borderRadius: 16, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" },
  statIcon: { fontSize: "1.8rem", marginBottom: 10 },
  statNum: { fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "2.2rem", color: "#fff", lineHeight: 1 },
  statLabel: { fontSize: ".82rem", color: "rgba(255,255,255,.6)", marginTop: 6, fontWeight: 600, lineHeight: 1.35 },
};

/* ─────────────────────────────────────────────────────────
   3. PROGRAMMES SECTION — cartes avec S'inscrire direct
───────────────────────────────────────────────────────── */
const ProgramCard = ({ p, inView, delay, onEnroll }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="bet-card"
      style={{
        ...PG.card,
        opacity: inView ? 1 : 0,
        transform: inView ? (hov ? "translateY(-6px)" : "none") : "translateY(24px)",
        transition: `opacity .5s ease ${delay}ms, transform .3s ease`,
        boxShadow: hov ? "0 24px 56px rgba(0,0,0,.14)" : "0 2px 12px rgba(0,0,0,.07)",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Image */}
      <div style={PG.imgWrap}>
        <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hov ? "scale(1.05)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 50%,rgba(0,0,0,.6))" }} />
        {/* Tag */}
        <div style={{ ...PG.tag, background: p.tagBg, color: p.color }}>{p.tag}</div>
        {/* Highlight */}
        <div style={PG.highlight}>{p.highlight}</div>
        {/* Urgence */}
        {p.spots <= 5 && <div style={PG.spots}>🔥 {p.spots} places restantes</div>}
      </div>

      {/* Body */}
      <div style={PG.body}>
        <div style={PG.topRow}>
          <h3 style={PG.title}>{p.title}</h3>
          <div style={PG.rating}><span style={{ color: "#f59e0b" }}>★</span> {p.rating}</div>
        </div>
        <p style={PG.sub}>{p.sub}</p>
        <p style={PG.desc}>{p.desc}</p>

        {/* Features mini */}
        <div style={PG.featMini}>
          {p.features.slice(0, 2).map((f, i) => (
            <span key={i} style={PG.featPill}><span style={{ color: "#10b981" }}>✓</span> {f}</span>
          ))}
        </div>

        {/* Meta */}
        <div style={PG.meta}>
          <span style={PG.metaPill}>⏱ {p.duration}</span>
          <span style={PG.metaPill}>📊 {p.level}</span>
          <span style={PG.metaPill}>👥 {p.students.toLocaleString("fr")} inscrits</span>
        </div>

        {/* Prix + CTA */}
        <div style={PG.footer}>
          <div>
            <div style={PG.price}>{p.priceLabel}</div>
            <div style={{ fontSize: ".7rem", color: "#94a3b8" }}>accès complet · remboursement 30j</div>
          </div>
          <button
            className="bet-enroll-direct"
            style={{ ...PG.enrollBtn, background: p.color }}
            onClick={() => onEnroll(p)}
          >
            S'inscrire →
          </button>
        </div>
      </div>
    </div>
  );
};

const ProgramsSection = ({ activeProfile, onFilter, onEnroll }) => {
  const [ref, inView] = useInView();
  const filtered = activeProfile === "tous"
    ? PROGRAMS
    : PROGRAMS.filter(p => p.profiles.includes(activeProfile));

  return (
    <section id="programmes" ref={ref} style={{ padding: "80px 0", background: "#fff" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={SH.badge}>🎯 NOS CERTIFICATIONS & FORMATIONS</span>
          <h2 style={SH.h2}>
            Choisissez votre programme<br />
            <span style={SH.accent}>et inscrivez-vous maintenant</span>
          </h2>
          <div style={SH.line} />
          <p style={SH.sub}>Cliquez sur <strong>« S'inscrire »</strong> pour accéder directement au paiement — simple, rapide, sécurisé.</p>
        </div>

        {/* Filtre profil */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
          {PROFILES.map(p => (
            <button key={p.id} className="bet-pill" style={{ ...PG.filterBtn, ...(activeProfile === p.id ? PG.filterBtnActive : {}) }} onClick={() => onFilter(p.id)}>
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        {/* Grille */}
        <div className="bet-programs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 }}>
          {filtered.map((p, i) => (
            <ProgramCard key={p.id} p={p} inView={inView} delay={i * 90} onEnroll={onEnroll} />
          ))}
        </div>

        {/* Note FDFP */}
        <div style={PG.fdfpNote}>
          <span style={{ fontSize: "1.1rem" }}>💡</span>
          <span>Financement FDFP disponible pour les salariés du secteur privé — <strong>jusqu'à 100% de prise en charge</strong>. <a href="/contact" style={{ color: "#0891b2", fontWeight: 700 }}>Nous contacter →</a></span>
        </div>
      </div>
    </section>
  );
};

const PG = {
  card: { borderRadius: 18, overflow: "hidden", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer" },
  imgWrap: { height: 196, position: "relative", overflow: "hidden" },
  tag: { position: "absolute", top: 12, left: 12, fontSize: ".64rem", fontWeight: 800, letterSpacing: ".07em", borderRadius: 999, padding: "3px 10px" },
  highlight: { position: "absolute", bottom: 12, left: 12, background: "rgba(255,255,255,.95)", color: "#0f172a", fontSize: ".72rem", fontWeight: 800, borderRadius: 999, padding: "3px 10px" },
  spots: { position: "absolute", top: 12, right: 12, background: "#fef3c7", color: "#d97706", fontSize: ".65rem", fontWeight: 800, borderRadius: 999, padding: "3px 10px" },
  body: { padding: "18px 18px 20px" },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  title: { fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "1.3rem", margin: 0, fontWeight: 400, color: "#0f172a" },
  rating: { fontSize: ".8rem", fontWeight: 700, color: "#f59e0b", whiteSpace: "nowrap" },
  sub: { fontSize: ".78rem", color: "#dc2626", fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".04em" },
  desc: { fontSize: ".85rem", color: "#475569", lineHeight: 1.6, margin: "0 0 12px" },
  featMini: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 },
  featPill: { fontSize: ".78rem", color: "#334155", display: "flex", alignItems: "center", gap: 5 },
  meta: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  metaPill: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 9px", fontSize: ".7rem", fontWeight: 600, color: "#475569" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: 14 },
  price: { fontWeight: 800, fontSize: ".92rem", color: "#0f172a" },
  enrollBtn: { color: "#fff", border: "none", borderRadius: 999, padding: "9px 18px", fontWeight: 800, fontSize: ".82rem", cursor: "pointer", transition: "background .2s", fontFamily: "'Montserrat', 'Segoe UI', sans-serif", whiteSpace: "nowrap" },
  filterBtn: { background: "#f1f5f9", border: "1.5px solid transparent", borderRadius: 999, padding: "7px 18px", fontSize: ".82rem", fontWeight: 700, cursor: "pointer", transition: "all .2s", fontFamily: "'Montserrat', 'Segoe UI', sans-serif", color: "#475569" },
  filterBtnActive: { background: "#dc2626", color: "#fff", borderColor: "#dc2626" },
  fdfpNote: { display: "flex", gap: 10, alignItems: "center", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 18px", marginTop: 36, fontSize: ".88rem", color: "#1e3a8a", lineHeight: 1.55 },
};

const SH = {
  badge: { display: "inline-block", background: "#fef2f2", color: "#dc2626", borderRadius: 999, padding: "5px 16px", fontSize: ".72rem", fontWeight: 800, letterSpacing: ".08em", marginBottom: 14, border: "1px solid #fecaca" },
  h2: { fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 400, color: "#0f172a", margin: "0 0 14px", lineHeight: 1.18 },
  accent: { color: "#dc2626", fontStyle: "italic" },
  line: { width: 52, height: 3, borderRadius: 2, margin: "0 auto 18px", background: "#fecaca" },
  sub: { fontSize: ".95rem", color: "#64748b", lineHeight: 1.7, maxWidth: 540, margin: "0 auto" },
};

/* ─────────────────────────────────────────────────────────
   4. BANDE TEST GRATUIT
───────────────────────────────────────────────────────── */
const TestBand = () => {
  const [ref, inView] = useInView();
  return (
    <section ref={ref} style={{ background: "linear-gradient(135deg,#0f172a,#0891b2)", padding: "60px 24px", textAlign: "center" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: "all .6s ease" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🧪</div>
        <h2 style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "clamp(1.7rem,3.5vw,2.6rem)", color: "#fff", margin: "0 0 12px", fontWeight: 400 }}>
          Vous ne savez pas quel programme<br />
          <em style={{ color: "#38bdf8" }}>choisir ?</em>
        </h2>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: ".96rem", lineHeight: 1.7, marginBottom: 28 }}>
          Faites notre test de niveau officiel <strong style={{ color: "#fff" }}>CECRL en 10 minutes</strong> — recevez instantanément votre niveau et le programme idéal pour vous.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/test-niveau">
            <button style={TB.btnPrimary}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px) scale(1.03)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              🎯 Faire le test gratuit (10 min)
            </button>
          </Link>
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
          {["✓ 100% gratuit", "✓ Résultats immédiats", "✓ Sans inscription", "✓ Recommandation personnalisée"].map((t, i) => (
            <span key={i} style={{ fontSize: ".76rem", color: "rgba(255,255,255,.55)", fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

const TB = {
  btnPrimary: { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000", border: "none", borderRadius: 999, padding: "15px 34px", fontSize: "1rem", fontWeight: 800, cursor: "pointer", transition: "all .2s", boxShadow: "0 6px 24px rgba(251,191,36,.4)", fontFamily: "'Montserrat', 'Segoe UI', sans-serif" },
};

/* ─────────────────────────────────────────────────────────
   5. MODES D'APPRENTISSAGE (simplifié)
───────────────────────────────────────────────────────── */
const MODES = [
  { icon: "💻", title: "En ligne", desc: "Apprenez n'importe où via visioconférence avec nos profs certifiés. Classes en direct + replay 24h/24.", badge: "FLEX", color: "#0891b2", img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80" },
  { icon: "🏢", title: "En cabinet", desc: "Immergez-vous dans nos 6 centres. Groupes réduits, locuteurs natifs, progression accélérée.", badge: "PRÉSENTIEL", color: "#1e3a8a", img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=700&q=80" },
  { icon: "🏠", title: "À domicile", desc: "Votre professeur certifié se déplace chez vous, à vos horaires. Idéal pour les familles et les exigeants.", badge: "PREMIUM", color: "#dc2626", img: "https://images.unsplash.com/photo-1560523159-4a9692d222ef?auto=format&fit=crop&w=700&q=80" },
];

const ModesSection = () => {
  const [ref, inView] = useInView();
  return (
    <section ref={ref} style={{ padding: "80px 0", background: "#f8fafc" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <span style={SH.badge}>📚 COMMENT APPRENDRE ?</span>
          <h2 style={SH.h2}>3 formats pour s'adapter<br /><span style={SH.accent}>à votre vie</span></h2>
          <div style={SH.line} />
        </div>
        <div className="bet-modes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {MODES.map((m, i) => (
            <ModeCard key={i} m={m} inView={inView} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ModeCard = ({ m, inView, delay }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        borderRadius: 18, overflow: "hidden", background: "#fff", border: "1.5px solid #e2e8f0",
        opacity: inView ? 1 : 0, transform: inView ? (hov ? "translateY(-6px)" : "none") : "translateY(20px)",
        transition: `opacity .5s ease ${delay}ms, transform .3s ease`,
        boxShadow: hov ? "0 20px 48px rgba(0,0,0,.12)" : "0 2px 10px rgba(0,0,0,.05)",
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
        <img src={m.img} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hov ? "scale(1.05)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.5))" }} />
        <div style={{ position: "absolute", top: 12, left: 12, background: m.color, color: "#fff", fontSize: ".65rem", fontWeight: 800, borderRadius: 999, padding: "4px 12px", letterSpacing: ".06em" }}>{m.badge}</div>
      </div>
      <div style={{ padding: "20px" }}>
        <h3 style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "1.25rem", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <span>{m.icon}</span> {m.title}
        </h3>
        <p style={{ fontSize: ".86rem", color: "#475569", lineHeight: 1.65, margin: "0 0 16px" }}>{m.desc}</p>
        <a href="#programmes">
          <button style={{ background: "none", border: `1.5px solid ${m.color}`, color: m.color, borderRadius: 999, padding: "8px 18px", fontSize: ".82rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Montserrat', 'Segoe UI', sans-serif", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = m.color; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = m.color; }}>
            Choisir ce format →
          </button>
        </a>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   6. TESTIMONIALS
───────────────────────────────────────────────────────── */
const TESTIS = [
  { av: "👩🏾‍⚖️", name: "Awa Koné", role: "Étudiante en droit", score: "TOEIC 850", text: "En 3 mois j'ai décroché 850 au TOEIC. Les méthodes sont vraiment efficaces et le suivi personnalisé fait toute la différence. Je recommande à 100% !", stars: 5, color: "#d97706" },
  { av: "👨🏿‍💼", name: "Kouamé Brou", role: "Directeur Commercial · NSIA", score: "IELTS 7.5", text: "La formation entreprise a transformé notre relation client internationale. Nos équipes communiquent maintenant avec confiance en anglais.", stars: 5, color: "#0891b2" },
  { av: "👩🏽‍💻", name: "Fatoumata Diallo", role: "Ingénieure IT · MTN CI", score: "TOEFL 104", text: "Préparé mon TOEFL en ligne depuis Abidjan. Les corrections rapides et la disponibilité des profs m'ont permis d'atteindre mon score cible.", stars: 5, color: "#7c3aed" },
  { av: "👨🏽‍🎓", name: "Sonia Ravin", role: "Étudiante · Université HEC", score: "TOEIC 920", text: "Programme d'immersion qui a littéralement changé ma vie. 920 points au TOEIC — des portes que je croyais fermées se sont ouvertes.", stars: 5, color: "#dc2626" },
];

const TestimonialsSection = () => {
  const [ref, inView] = useInView();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setActive(p => (p + 1) % TESTIS.length), 5000);
    return () => clearInterval(t);
  }, [inView]);

  const t = TESTIS[active];

  return (
    <section ref={ref} style={{ padding: "80px 0", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={SH.badge}>💬 ILS ONT RÉUSSI</span>
          <h2 style={SH.h2}>Ils ont choisi BET<br /><span style={SH.accent}>et ils ne le regrettent pas</span></h2>
          <div style={SH.line} />
        </div>

        <div className="bet-testi-row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 48, alignItems: "center" }}>
          {/* Avatars liste */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {TESTIS.map((ti, i) => (
              <button key={i} onClick={() => setActive(i)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14,
                border: `2px solid ${i === active ? ti.color : "#e2e8f0"}`,
                background: i === active ? ti.color + "0d" : "#fff",
                cursor: "pointer", transition: "all .2s", textAlign: "left",
              }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${ti.color}33,${ti.color}11)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>{ti.av}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: ".88rem", color: "#0f172a" }}>{ti.name}</div>
                  <div style={{ fontSize: ".75rem", color: "#64748b" }}>{ti.role}</div>
                </div>
                <div style={{ marginLeft: "auto", background: ti.color + "22", color: ti.color, borderRadius: 999, padding: "3px 10px", fontSize: ".7rem", fontWeight: 800, whiteSpace: "nowrap" }}>{ti.score}</div>
              </button>
            ))}
          </div>

          {/* Témoignage actif */}
          <div key={active} style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius: 24, padding: "40px 44px", animation: "scaleIn .3s ease", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />
            <div style={{ color: "#fbbf24", fontSize: "1.5rem", marginBottom: 16, letterSpacing: 2 }}>{"★".repeat(t.stars)}</div>
            <p style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "1.2rem", color: "#fff", lineHeight: 1.65, margin: "0 0 28px", fontStyle: "italic" }}>"{t.text}"</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `rgba(255,255,255,.1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>{t.av}</div>
              <div>
                <div style={{ fontWeight: 800, color: "#fff", fontSize: ".95rem" }}>{t.name}</div>
                <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,.55)" }}>{t.role}</div>
              </div>
              <div style={{ marginLeft: "auto", background: "#dc2626", color: "#fff", borderRadius: 999, padding: "5px 14px", fontSize: ".8rem", fontWeight: 800 }}>{t.score}</div>
            </div>
          </div>
        </div>

        {/* CTA sous temoignages */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <p style={{ color: "#64748b", fontSize: ".92rem", marginBottom: 16 }}>Rejoignez +5 000 apprenants qui ont transformé leur carrière avec BET</p>
          <a href="#programmes">
            <button style={{ background: "linear-gradient(135deg,#dc2626,#1e3a8a)", color: "#fff", border: "none", borderRadius: 999, padding: "14px 36px", fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: "'Montserrat', 'Segoe UI', sans-serif", boxShadow: "0 6px 24px rgba(220,38,38,.3)" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              Commencer ma formation →
            </button>
          </a>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────
   7. CABINET AGRÉÉ BANNER
───────────────────────────────────────────────────────── */
const AgreeeBanner = () => {
  const [ref, inView] = useInView();
  return (
    <section ref={ref} style={{ padding: "0 0 80px", background: "#f8fafc" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
        <div style={{
          background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)", borderRadius: 24, padding: "48px 52px",
          display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap",
          opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: "all .6s ease",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(8,145,178,.12)", top: -100, right: -60, pointerEvents: "none" }} />
          <div style={{ flex: 1, minWidth: 280, position: "relative", zIndex: 1 }}>
            <span style={{ display: "inline-block", background: "rgba(255,255,255,.15)", color: "#7dd3fc", borderRadius: 999, padding: "4px 14px", fontSize: ".7rem", fontWeight: 700, letterSpacing: ".06em", marginBottom: 14 }}>🏛️ CABINET DE FORMATION AGRÉÉ PAR L'ÉTAT DE CÔTE D'IVOIRE</span>
            <h3 style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", fontSize: "1.7rem", color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>Votre certificat BET a une valeur officielle et reconnue.</h3>
            <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".9rem", lineHeight: 1.7, margin: "0 0 20px", maxWidth: 480 }}>BET est agréé par l'État de Côte d'Ivoire. Vos certifications sont reconnues par les recruteurs, universités et administrations locales et internationales.</p>
            <Link to="/certification/toeic">
              <button style={{ background: "rgba(255,255,255,.1)", border: "2px solid rgba(255,255,255,.3)", color: "#fff", borderRadius: 999, padding: "10px 22px", fontWeight: 700, cursor: "pointer", fontSize: ".88rem", fontFamily: "'Montserrat', 'Segoe UI', sans-serif", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.2)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.6)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.3)"; }}>
                En savoir plus sur nos certifications →
              </button>
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, position: "relative", zIndex: 1 }}>
            {["🎓 Agréé État", "📜 Certifié", "🌍 International", "⭐ 15 ans", "🏆 98% réussite", "✅ FDFP"].map((item, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "12px", textAlign: "center", fontSize: ".78rem", color: "rgba(255,255,255,.8)", fontWeight: 600, lineHeight: 1.4 }}>{item}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────
   8. PARTNERS MARQUEE
───────────────────────────────────────────────────────── */
const PARTNERS = [
  { name: "dot.", logo: "/images/partners/dot.png" },
  { name: "Digital Opportunity Trust", logo: "/images/partners/dot_trust.png" },
  { name: "Business Scouts", logo: "/images/partners/business_scouts.png" },
  { name: "GIZ", logo: "/images/partners/giz.png" },
  { name: "ENSEA", logo: "/images/partners/ensea.png" },
  { name: "Allianz", logo: "/images/partners/allianz.png" },
  { name: "GIZ Full", logo: "/images/partners/giz_full.png" },
];

const PartnersSection = () => (
  <section style={{ padding: "48px 0", background: "#fff", borderTop: "1px solid #f1f5f9", overflow: "hidden" }}>
    <div style={{ maxWidth: 1180, margin: "0 auto 24px", padding: "0 24px", textAlign: "center" }}>
      <p style={{ fontSize: ".78rem", color: "#94a3b8", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Ils nous accordent leur confiance</p>
    </div>
    <div style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", width: "fit-content", animation: "ticker 22s linear infinite" }}>
        {[...PARTNERS, ...PARTNERS].map((p, i) => (
          <div key={i} style={{ flexShrink: 0, height: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 36px", opacity: 0.65, filter: "grayscale(.3)" }}>
            <img src={p.logo} alt={p.name} style={{ maxHeight: "100%", maxWidth: 120, objectFit: "contain" }} />
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────
   9. COACHES SECTION
───────────────────────────────────────────────────────── */
const COACHES = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, img: `/team${i + 1}.jpeg` }));

const CoachCard = ({ coach }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        flexShrink: 0, width: 200, height: 240, margin: "0 10px", borderRadius: 18, overflow: "hidden",
        position: "relative",
        transform: hov ? "scale(1.05)" : "scale(1)",
        transition: "transform .3s ease, box-shadow .3s ease",
        boxShadow: hov ? "0 20px 48px rgba(0,0,0,.22)" : "0 4px 18px rgba(0,0,0,.1)",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <img
        src={coach.img}
        alt={`Coach BET ${coach.id}`}
        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s ease", transform: hov ? "scale(1.08)" : "scale(1)" }}
        onError={e => { e.currentTarget.parentElement.style.background = "#e2e8f0"; e.currentTarget.style.display = "none"; }}
      />
      <div style={{
        position: "absolute", inset: 0,
        background: hov
          ? "linear-gradient(180deg,transparent 35%,rgba(15,23,42,.75))"
          : "linear-gradient(180deg,transparent 55%,rgba(15,23,42,.5))",
        transition: "background .3s",
      }} />
      <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
        <div style={{ width: 26, height: 3, background: "#dc2626", borderRadius: 2, marginBottom: 6 }} />
        <div style={{
          fontSize: ".72rem", color: "#fff", fontWeight: 700, letterSpacing: ".04em",
          opacity: hov ? 1 : 0, transform: hov ? "translateY(0)" : "translateY(6px)",
          transition: "opacity .3s, transform .3s",
        }}>
          Coach BET Certifié
        </div>
      </div>
    </div>
  );
};

// const CoachesSection = () => {
//   const [ref, inView] = useInView();
//   const row1 = COACHES.slice(0, 10);
//   const row2 = COACHES.slice(10, 20);

//   return (
//     <section ref={ref} style={{ padding: "80px 0", background: "#fff", overflow: "hidden" }}>
//       <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", textAlign: "center", marginBottom: 52 }}>
//         <span style={SH.badge}>👥 NOTRE ÉQUIPE</span>
//         <h2 style={{ ...SH.h2, opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: "all .6s ease" }}>
//           Quelques membres de<br /><span style={SH.accent}>l'équipe coachs</span>
//         </h2>
//         <div style={SH.line} />
//         <p style={{ ...SH.sub, opacity: inView ? 1 : 0, transition: "all .6s ease .15s" }}>
//           Des coachs certifiés, passionnés et entièrement dédiés à votre réussite.
//         </p>
//       </div>

//       {/* Ligne 1 — défile vers la gauche */}
//       <div style={{ overflow: "hidden", marginBottom: 16 }}>
//         <div style={{ display: "flex", width: "fit-content", animation: "ticker 50s linear infinite" }}>
//           {[...row1, ...row1].map((coach, i) => <CoachCard key={i} coach={coach} />)}
//         </div>
//       </div>

//       {/* Ligne 2 — défile vers la droite */}
//       <div style={{ overflow: "hidden" }}>
//         <div style={{ display: "flex", width: "fit-content", animation: "ticker 50s linear infinite reverse" }}>
//           {[...row2, ...row2].map((coach, i) => <CoachCard key={i} coach={coach} />)}
//         </div>
//       </div>

//       <div style={{ textAlign: "center", marginTop: 44 }}>
//         <div style={{ display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" }}>
//           {[
//             { icon: "🎓", label: "Certifiés CELTA / DELTA" },
//             { icon: "🌍", label: "Locuteurs natifs & bilingues" },
//             { icon: "⭐", label: "+5 ans d'expérience en moyenne" },
//           ].map((item, i) => (
//             <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".85rem", color: "#475569", fontWeight: 600 }}>
//               <span style={{ fontSize: "1.1rem" }}>{item.icon}</span> {item.label}
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

/* ─────────────────────────────────────────────────────────
   10. STICKY BOTTOM BAR
───────────────────────────────────────────────────────── */
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const StickyBar = ({ onEnroll, visible }) => {
  const [nom,      setNom]      = useState("");
  const [email,    setEmail]    = useState("");
  const [tel,      setTel]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [erreur,   setErreur]   = useState("");

  if (!visible) return null;

  const handleLead = async (e) => {
    e.preventDefault();
    if (!nom.trim() || !tel.trim()) return;
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch(`${API_URL}/api/leads/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, telephone: tel, objectif: "Demande via sticky bar accueil" }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setErreur("Erreur, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const FF = "'Montserrat','Segoe UI',sans-serif";
  const inp = {
    padding: "8px 14px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,.25)",
    background: "rgba(255,255,255,.1)", color: "#fff", fontSize: ".82rem",
    fontFamily: FF, outline: "none", width: 140,
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 8000,
      background: "linear-gradient(90deg,#0f172a,#1e3a8a)", borderTop: "2px solid rgba(255,255,255,.1)",
      padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, flexWrap: "wrap", animation: "slideDown .4s ease", boxShadow: "0 -8px 32px rgba(0,0,0,.35)"
    }}>
      {/* Texte */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🎓</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: ".92rem" }}>Prêt à commencer votre formation ?</div>
          <div style={{ color: "rgba(255,255,255,.55)", fontSize: ".76rem" }}>Places limitées · Remboursement 30 jours garanti</div>
        </div>
      </div>

      {/* Mini-formulaire lead OU message de succès */}
      {sent ? (
        <div style={{ color: "#86efac", fontWeight: 700, fontSize: ".88rem" }}>
          ✓ Reçu ! Un conseiller vous contacte sous 24h.
        </div>
      ) : (
        <form onSubmit={handleLead} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            style={inp} placeholder="Votre nom"
            value={nom} onChange={e => setNom(e.target.value)}
            required
          />
          <input
            style={inp} placeholder="Email" type="email"
            value={email} onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={inp} placeholder="Téléphone" type="tel"
            value={tel} onChange={e => setTel(e.target.value)}
            required
          />
          {erreur && <span style={{ color: "#fca5a5", fontSize: ".75rem" }}>⚠ {erreur}</span>}
          <button
            type="submit"
            disabled={loading}
            style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 999, padding: "9px 20px", fontWeight: 800, fontSize: ".84rem", cursor: "pointer", fontFamily: FF, opacity: loading ? .7 : 1, whiteSpace: "nowrap" }}>
            {loading ? "…" : "Être rappelé →"}
          </button>
        </form>
      )}

      {/* Bouton inscription complète */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Link to="/test-niveau">
          <button style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,.3)", color: "rgba(255,255,255,.8)", borderRadius: 999, padding: "9px 20px", fontWeight: 700, fontSize: ".84rem", cursor: "pointer", fontFamily: FF }}>
            Test gratuit
          </button>
        </Link>
        <button
          style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,.2)", borderRadius: 999, padding: "9px 20px", fontWeight: 800, fontSize: ".84rem", cursor: "pointer", fontFamily: FF }}
          onClick={() => document.getElementById("programmes")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Choisir une formation →
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────── */
export default function Accueil() {
  const [activeProfile, setActiveProfile] = useState("tous");
  const [enrollProgram, setEnrollProgram] = useState(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  // Affiche la sticky bar après 3 secondes ou 400px de scroll
  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 400) setStickyVisible(true); };
    window.addEventListener("scroll", onScroll);
    const t = setTimeout(() => setStickyVisible(true), 4000);
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(t); };
  }, []);

  const handleTest = useCallback(() => {
    window.location.href = "/test-niveau";
  }, []);

  return (
    <>
      <SEO
        title="Binnie's English Training – Formation anglais certifiante en Côte d'Ivoire"
        description="Certifications TOEIC, TOEFL, IELTS et cours d'anglais personnalisés pour particuliers et professionnels. Cabinet agréé État. +5 000 apprenants certifiés."
        canonicalUrl="/"
        image="/assets/images/og-home.jpg"
      />

      <div style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", color: "#0f172a", overflowX: "hidden", background: "#fff", paddingBottom: 72 }}>
        <HeroSection
          activeProfile={activeProfile}
          setActiveProfile={setActiveProfile}
          onTest={handleTest}
        />
        <ProofStrip />
        <ProgramsSection activeProfile={activeProfile} onFilter={setActiveProfile} onEnroll={setEnrollProgram} />
        <TestBand />
        <ModesSection />
        <TestimonialsSection />
        <AgreeeBanner />
        <BlogSection/>
        <PartnersSection />
        {/* <CoachesSection /> */}
        <Footer />
      </div>

      {/* Modal paiement unique */}
      {enrollProgram && (
        <PaymentModal program={enrollProgram} onClose={() => setEnrollProgram(null)} />
      )}

      {/* Sticky bar */}
      <StickyBar onEnroll={setEnrollProgram} visible={stickyVisible} />
    </>
  );
}