import React, { useEffect, useRef, useState, useCallback } from "react";
import Footer from "../Footer/Footer";
import { Link } from "react-router-dom";
import SEO from "../Components/SEO/SEO";
import BlogSection from "../Components/BlogSection/BlogSection";
import { insertInscriptionAdulte } from "../../services/formsService";
import { supabase } from "../../config/supabase";

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
      .bet-testi-alt-row{grid-template-columns:1fr!important;gap:28px!important;}

      /* ── Sticky bar mobile ── */
      .bet-sticky { padding:10px 14px!important; flex-wrap:nowrap!important; gap:10px!important; }
      .bet-sticky-form { display:none!important; }
      .bet-sticky-sub  { display:none!important; }
      .bet-sticky-icon { display:none!important; }
      .bet-sticky-ctas { gap:6px!important; }
      .bet-sticky-ctas a, .bet-sticky-ctas button {
        padding:8px 12px!important; font-size:.75rem!important;
      }
      .bet-sticky-text { font-size:.8rem!important; }
    }
    @media (max-width:400px){
      .bet-sticky-ctas-secondary { display:none!important; }
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  // Pré-remplir depuis la session connectée
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      const u    = session.user;
      const meta = u.user_metadata || {};
      const nom  = (meta.prenom && meta.nom)
        ? `${meta.prenom} ${meta.nom}`
        : meta.full_name || u.email?.split("@")[0] || "";
      setData(p => ({
        ...p,
        nom:   p.nom   || nom,
        email: p.email || u.email || "",
        tel:   p.tel   || meta.telephone || "",
      }));
    });
  }, []);

  const upd = (k, v) => {
    setData(p => ({ ...p, [k]: v }));
    setFieldErrors(e => ({ ...e, [k]: "" }));
  };

  const goStep2 = () => {
    const errors = {};
    if (!data.nom.trim())   errors.nom   = "Requis";
    if (!data.email.trim()) errors.email = "Requis";
    if (!data.tel.trim())   errors.tel   = "Requis";
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setStep(2);
  };

  const confirm = async () => {
    if (method === "mobile" && !data.numero) { setErreur("Entrez votre numéro Mobile Money."); return; }
    if (method === "card" && (!data.carte || !data.expiry || !data.cvv)) { setErreur("Complétez les informations de carte."); return; }
    if (!data.consent) { setErreur("Acceptez les conditions pour continuer."); return; }
    setErreur("");
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
            {(data.nom || data.email || data.tel) && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"8px 12px", marginBottom:14, fontSize:".78rem", color:"#166534", fontWeight:600 }}>
                <span>✓</span> Pré-rempli depuis votre compte — vérifiez et modifiez si besoin.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="bet-payment-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={PS.label}>Nom complet *</label>
                  <input style={{ ...PS.input, borderColor: fieldErrors.nom ? "#dc2626" : "#e2e8f0" }} value={data.nom} onChange={e => upd("nom", e.target.value)} placeholder="Jean Kouamé" />
                  {fieldErrors.nom && <p style={PS.ferr}>{fieldErrors.nom}</p>}
                </div>
                <div>
                  <label style={PS.label}>Email *</label>
                  <input style={{ ...PS.input, borderColor: fieldErrors.email ? "#dc2626" : "#e2e8f0" }} type="email" value={data.email} onChange={e => upd("email", e.target.value)} placeholder="jean@exemple.com" />
                  {fieldErrors.email && <p style={PS.ferr}>{fieldErrors.email}</p>}
                </div>
              </div>
              <div>
                <label style={PS.label}>Téléphone *</label>
                <input style={{ ...PS.input, borderColor: fieldErrors.tel ? "#dc2626" : "#e2e8f0" }} type="tel" value={data.tel} onChange={e => upd("tel", e.target.value)} placeholder="+225 07 00 00 00 00" />
                {fieldErrors.tel && <p style={PS.ferr}>{fieldErrors.tel}</p>}
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
  ferr: { color: "#dc2626", fontSize: ".72rem", margin: "4px 0 0" },
};

/* ─────────────────────────────────────────────────────────
   1. HERO SECTION
───────────────────────────────────────────────────────── */
const HERO_FALLBACK_SLIDES = [
  { id:"f1", type:"image", url:"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80", titre:"", description:"", link_url:"", link_label:"" },
  { id:"f2", type:"image", url:"https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1600&q=80", titre:"", description:"", link_url:"", link_label:"" },
  { id:"f3", type:"image", url:"https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80", titre:"", description:"", link_url:"", link_label:"" },
];

/* ── Helpers vidéo ──────────────────────────────────────── */
function detectVideoType(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/vimeo\.com/i.test(url))             return "vimeo";
  return "native";
}

function extractYoutubeId(url) {
  // youtu.be/ID  ou  youtu.be/ID?si=...
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  // youtube.com/watch?v=ID
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watch) return watch[1];
  // youtube.com/embed/ID
  const embed = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embed) return embed[1];
  // youtube.com/shorts/ID
  const shorts = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shorts) return shorts[1];
  return null;
}

function buildEmbedUrl(url, muted) {
  const type = detectVideoType(url);
  if (type === "youtube") {
    const id = extractYoutubeId(url);
    if (!id) return url; // URL embed déjà formatée ou format inconnu
    const u = new URL(`https://www.youtube.com/embed/${id}`);
    u.searchParams.set("autoplay",       "1");
    u.searchParams.set("mute",           muted ? "1" : "0");
    u.searchParams.set("enablejsapi",    "1");
    u.searchParams.set("controls",       "0");
    u.searchParams.set("rel",            "0");
    u.searchParams.set("modestbranding", "1");
    return u.toString();
  }
  if (type === "vimeo") {
    // Extraire l'ID Vimeo (suite de chiffres)
    const vimeoId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
    const base = vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}`
      : (url.includes("player.vimeo") ? url : url.replace("vimeo.com/", "player.vimeo.com/video/"));
    const u = new URL(base);
    u.searchParams.set("autoplay", "1");
    u.searchParams.set("muted",    muted ? "1" : "0");
    u.searchParams.set("api",      "1");
    u.searchParams.set("controls", "0");
    return u.toString();
  }
  return url; // native MP4/WebM : pas de paramètre
}

const HeroSection = () => {
  const [slideIdx, setSlideIdx]   = useState(0);
  const [slides,   setSlides]     = useState(HERO_FALLBACK_SLIDES);
  const [paused,   setPaused]     = useState(false);
  const [muted,    setMuted]      = useState(true);
  const iframeRefs = useRef({});  // { [slide.id]: iframeElement }
  const videoRefs  = useRef({});  // { [slide.id]: videoElement }

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || "http://localhost:5001";
    fetch(`${API}/api/carousel/publiques`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.slides?.length > 0) setSlides(d.slides); })
      .catch(() => {});
  }, []);

  const nextSlide = useCallback(() => {
    setSlideIdx(p => (p + 1) % slides.length);
  }, [slides.length]);

  // Avance automatique — suspendu sur les slides vidéo (la vidéo déclenche nextSlide elle-même)
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const current = slides[slideIdx];
    if (current?.type === "video") return; // la vidéo gère sa propre fin
    const t = setInterval(nextSlide, 5000);
    return () => clearInterval(t);
  }, [slides, slideIdx, paused, nextSlide]);

  // Écoute la fin des vidéos YouTube / Vimeo via postMessage
  useEffect(() => {
    const onMessage = (e) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        // YouTube : playerState 0 = ended
        if (data?.event === "infoDelivery" && data?.info?.playerState === 0) nextSlide();
        // Vimeo : event finish
        if (data?.event === "finish") nextSlide();
      } catch {}
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [nextSlide]);

  const goTo = (i) => { setSlideIdx(i); setPaused(true); setTimeout(() => setPaused(false), 12000); };
  const current = slides[slideIdx] || slides[0];
  const isCurrentVideo = current?.type === "video";

  /* ── Commandes vidéo ─────────────────────────────────── */
  const sendYT = (iframe, func, args = "") => {
    try { iframe.contentWindow.postMessage(JSON.stringify({ event:"command", func, args }), "*"); } catch {}
  };
  const sendVimeo = (iframe, method, value) => {
    try { iframe.contentWindow.postMessage(JSON.stringify({ method, value }), "*"); } catch {}
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    const id = current?.id;
    const type = detectVideoType(current?.url || "");
    if (type === "native") {
      const v = videoRefs.current[id];
      if (v) v.muted = next;
    } else if (type === "youtube") {
      const f = iframeRefs.current[id];
      if (f) sendYT(f, next ? "muteVideo" : "unMuteVideo");
    } else if (type === "vimeo") {
      const f = iframeRefs.current[id];
      if (f) sendVimeo(f, "setVolume", next ? 0 : 1);
    }
  };

  const replay = () => {
    const id = current?.id;
    const type = detectVideoType(current?.url || "");
    if (type === "native") {
      const v = videoRefs.current[id];
      if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    } else if (type === "youtube") {
      const f = iframeRefs.current[id];
      if (f) { sendYT(f, "seekTo", [0, true]); sendYT(f, "playVideo"); }
    } else if (type === "vimeo") {
      const f = iframeRefs.current[id];
      if (f) { sendVimeo(f, "setCurrentTime", 0); sendVimeo(f, "play"); }
    }
  };

  return (
    <section style={HS.hero}>
      {/* Slides : images toujours dans le DOM (crossfade), vidéos seulement quand actives */}
      {slides.map((slide, i) => {
        if (slide.type === "video") {
          /* Vidéo inactive → div vide noire, pas de lecture en arrière-plan */
          if (i !== slideIdx) return <div key={slide.id} style={{ ...HS.bg, background:"#000", opacity:0 }} />;
          return (
            <div key={slide.id} style={{ ...HS.bg, opacity:1, background:"#000" }}>
              {detectVideoType(slide.url) === "native"
                ? <video
                    ref={el => { videoRefs.current[slide.id] = el; }}
                    src={slide.url}
                    autoPlay muted={muted} playsInline
                    onEnded={nextSlide}
                    style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", border:"none" }}
                  />
                : <iframe
                    ref={el => { iframeRefs.current[slide.id] = el; }}
                    src={buildEmbedUrl(slide.url, muted)}
                    title={slide.titre || "slide video"}
                    allow="autoplay; fullscreen"
                    style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none", pointerEvents:"none" }}
                  />
              }
            </div>
          );
        }
        return <div key={slide.id} style={{ ...HS.bg, backgroundImage:`url(${slide.url})`, opacity: i === slideIdx ? 1 : 0 }} />;
      })}

      {/* Contrôles vidéo (haut-droite) — uniquement sur une slide vidéo */}
      {isCurrentVideo && (
        <div style={{ position:"absolute", top:20, right:24, zIndex:12, display:"flex", gap:8 }}>
          <button onClick={replay} title="Rejouer"
            style={{ width:40, height:40, borderRadius:"50%", border:"none", cursor:"pointer", background:"rgba(0,0,0,.5)", backdropFilter:"blur(6px)", color:"#fff", fontSize:"1.1rem", display:"flex", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,.75)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,.5)"}
          >↺</button>
          <button onClick={toggleMute} title={muted ? "Activer le son" : "Sourdine"}
            style={{ width:40, height:40, borderRadius:"50%", border:"none", cursor:"pointer", background:"rgba(0,0,0,.5)", backdropFilter:"blur(6px)", color:"#fff", fontSize:"1.1rem", display:"flex", alignItems:"center", justifyContent:"center" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,.75)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,.5)"}
          >{muted ? "🔇" : "🔊"}</button>
        </div>
      )}

      {/* Gradient bas + caption + points de navigation */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:10, background:"linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.2) 60%, transparent 100%)", padding:"80px 48px 32px" }}>
        <div key={slideIdx} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:20 }}>
          <div style={{ flex:1, minWidth:0 }}>
            {current?.titre ? (
              <p style={{ margin:"0 0 6px", color:"#fff", fontWeight:800, fontSize:"clamp(1.1rem,2.8vw,1.8rem)", lineHeight:1.25, textShadow:"0 2px 12px rgba(0,0,0,.7)", animation:"fadeUp .45s ease both" }}>
                {current.titre}
              </p>
            ) : null}
            {current?.description ? (
              <p style={{ margin:0, color:"rgba(255,255,255,.85)", fontWeight:500, fontSize:"clamp(.82rem,1.5vw,.95rem)", lineHeight:1.6, textShadow:"0 1px 6px rgba(0,0,0,.5)", animation:"fadeUp .45s ease .12s both" }}>
                {current.description}
              </p>
            ) : null}
            {current?.link_url ? (
              <a href={current.link_url}
                style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:12, background:"#dc2626", color:"#fff", borderRadius:999, padding:"10px 22px", fontWeight:800, fontSize:".88rem", textDecoration:"none", boxShadow:"0 4px 18px rgba(220,38,38,.55)", animation:"fadeUp .45s ease .22s both" }}>
                {current.link_label || "En savoir plus →"}
              </a>
            ) : null}
          </div>
          {slides.length > 1 && (
            <div style={{ display:"flex", gap:8, flexShrink:0, alignSelf:"flex-end" }}>
              {slides.map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  style={{ width: i===slideIdx?28:10, height:10, borderRadius:5, border:"none", cursor:"pointer", background: i===slideIdx?"#fff":"rgba(255,255,255,.45)", transition:"all .3s", padding:0 }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Wave de transition vers la section suivante */}
      <div style={HS.wave}>
        <svg viewBox="0 0 1440 64" style={{ display:"block", width:"100%" }} preserveAspectRatio="none">
          <path fill="#fff" d="M0,32 C480,64 960,0 1440,32 L1440,64 L0,64 Z" />
        </svg>
      </div>
    </section>
  );
};

const HS = {
  hero: { position: "relative", height: "70vh", minHeight: 480, maxHeight: 680, overflow: "hidden" },
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
  { n: 3000, suf: "+", label: "Apprenants certifiés", icon: "🎓" },
  { n:100, suf: "%", label: "Taux de réussite", icon: "🏆" },
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
/* Fallback statique — remplacé par Supabase dès le chargement */
const TESTIS = [
  { avatar: "👩🏾‍⚖️", nom: "Awa Koné",         role: "Étudiante en droit",          score: "TOEIC 850",  texte: "En 3 mois j'ai décroché 850 au TOEIC. Les méthodes sont vraiment efficaces et le suivi personnalisé fait toute la différence. Je recommande à 100% !", etoiles: 5, couleur: "#d97706", video_url: null },
  { avatar: "👨🏿‍💼", nom: "Kouamé Brou",       role: "Directeur Commercial · NSIA",  score: "IELTS 7.5",  texte: "La formation entreprise a transformé notre relation client internationale. Nos équipes communiquent maintenant avec confiance en anglais.", etoiles: 5, couleur: "#0891b2", video_url: null },
  { avatar: "👩🏽‍💻", nom: "Fatoumata Diallo",  role: "Ingénieure IT · MTN CI",       score: "TOEFL 104",  texte: "Préparé mon TOEFL en ligne depuis Abidjan. Les corrections rapides et la disponibilité des profs m'ont permis d'atteindre mon score cible.", etoiles: 5, couleur: "#1e4080", video_url: null },
  { avatar: "👨🏽‍🎓", nom: "Sonia Ravin",       role: "Étudiante · Université HEC",   score: "TOEIC 920",  texte: "Programme d'immersion qui a littéralement changé ma vie. 920 points au TOEIC — des portes que je croyais fermées se sont ouvertes.", etoiles: 5, couleur: "#e93747", video_url: null },
];

function buildTestiEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null; // URL directe (MP4…)
}

const TestiVideoCard = ({ ti }) => {
  const videoRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);

  if (!ti.video_url) {
    return (
      <div style={{ borderRadius: 16, overflow: "hidden", background: `linear-gradient(135deg,${ti.couleur}22,${ti.couleur}08)`, border: `2px solid ${ti.couleur}33`, aspectRatio: "16/9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ fontSize: "4rem" }}>{ti.avatar}</div>
        <div style={{ fontWeight: 800, fontSize: "1rem", color: ti.couleur }}>{ti.nom}</div>
        <div style={{ fontSize: ".8rem", color: "#64748b" }}>{ti.role}</div>
      </div>
    );
  }

  const embedUrl = buildTestiEmbedUrl(ti.video_url);

  // YouTube / Vimeo → iframe
  if (embedUrl) {
    return (
      <div style={{ borderRadius: 16, overflow: "hidden", position: "relative", background: "#000", aspectRatio: "16/9" }}>
        <iframe
          src={embedUrl}
          title={ti.nom}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", height: "100%", display: "block", border: "none" }}
        />
      </div>
    );
  }

  // Fichier direct (MP4, webm…) → <video> avec bouton play custom
  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", position: "relative", background: "#000", aspectRatio: "16/9", cursor: "pointer" }} onClick={toggle}>
      <video ref={videoRef} src={ti.video_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onEnded={() => setPlaying(false)} />
      <div style={{ position: "absolute", top: 12, left: 14, background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)", borderRadius: 6, padding: "4px 10px", color: "#fff", fontWeight: 700, fontSize: ".78rem" }}>{ti.nom}</div>
      {!playing && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.18)" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(0,0,0,.3)" }}>
            <div style={{ width: 0, height: 0, borderTop: "11px solid transparent", borderBottom: "11px solid transparent", borderLeft: `18px solid ${ti.couleur||"#1e4080"}`, marginLeft: 4 }} />
          </div>
        </div>
      )}
    </div>
  );
};

const TestiTextCard = ({ ti }) => (
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: ti.etoiles ?? 5 }).map((_, i) => (
        <span key={i} style={{ color: "#f59e0b", fontSize: "1.1rem" }}>★</span>
      ))}
    </div>
    <h3 style={{ fontFamily: "'Montserrat','Segoe UI',sans-serif", fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>{ti.nom}</h3>
    <p style={{ fontSize: "1rem", color: "#334155", lineHeight: 1.75, margin: 0 }}>"{ti.texte}"</p>
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: ".82rem", color: "#64748b" }}>{ti.role}</span>
      <span style={{ background: ti.couleur + "20", color: ti.couleur, borderRadius: 999, padding: "3px 12px", fontSize: ".75rem", fontWeight: 800 }}>{ti.score}</span>
    </div>
  </div>
);

const TestimonialsSection = () => {
  const [testis, setTestis] = useState(TESTIS);

  useEffect(() => {
    supabase
      .from("temoignages")
      .select("id, nom, role, score, texte, avatar, couleur, etoiles, ordre, video_url")
      .eq("actif", true)
      .eq("statut", "actif")
      .order("ordre", { ascending: true })
      .then(({ data }) => { if (data?.length) setTestis(data); });
  }, []);

  return (
    <section style={{ padding: "80px 0", background: "#eef2f8" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        {/* En-tête */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <span style={SH.badge}>💬 ILS ONT RÉUSSI</span>
          <h2 style={{ ...SH.h2, marginTop: 8 }}>Ils ont choisi BET<br /><span style={SH.accent}>et ils ne le regrettent pas</span></h2>
          <p style={{ color: "#64748b", fontSize: ".95rem", maxWidth: 620, margin: "14px auto 0", lineHeight: 1.7 }}>
            Rencontrez certains des apprenants qui ont rejoint BET et ont obtenu de vrais résultats. Ces témoignages illustrent la puissance de notre accompagnement.
          </p>
          <div style={{ ...SH.line, marginTop: 20 }} />
        </div>

        {/* Lignes alternées vidéo / texte */}
        <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
          {testis.map((ti, i) => (
            <div key={ti.id ?? i} className="bet-testi-alt-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "center" }}>
              {i % 2 === 0 ? (
                <><TestiVideoCard ti={ti} /><TestiTextCard ti={ti} /></>
              ) : (
                <><TestiTextCard ti={ti} /><TestiVideoCard ti={ti} /></>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 64 }}>
          <p style={{ color: "#64748b", fontSize: ".92rem", marginBottom: 20 }}>Rejoignez +3 000 apprenants qui ont transformé leur carrière avec BET</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#programmes">
              <button style={{ background: "linear-gradient(135deg,#e93747,#1e4080)", color: "#fff", border: "none", borderRadius: 999, padding: "14px 36px", fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: "'Montserrat','Segoe UI',sans-serif", boxShadow: "0 6px 24px rgba(233,55,71,.3)", transition: "transform .2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                Commencer ma formation →
              </button>
            </a>
            <Link to="/temoignages">
              <button style={{ background: "#fff", color: "#1e4080", border: "2px solid #1e4080", borderRadius: 999, padding: "14px 28px", fontWeight: 700, fontSize: ".95rem", cursor: "pointer", fontFamily: "'Montserrat','Segoe UI',sans-serif", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1e4080"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1e4080"; }}>
                Voir tous les témoignages →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};


/* ─────────────────────────────────────────────────────────
   8. PARTNERS MARQUEE
───────────────────────────────────────────────────────── */
const PARTNERS_FALLBACK = [
  { nom: "dot.", logo_url: "/images/partners/dot.png" },
  { nom: "Digital Opportunity Trust", logo_url: "/images/partners/dot_trust.png" },
  { nom: "Business Scouts", logo_url: "/images/partners/business_scouts.png" },
  { nom: "GIZ", logo_url: "/images/partners/giz.png" },
  { nom: "ENSEA", logo_url: "/images/partners/ensea.png" },
  { nom: "Allianz", logo_url: "/images/partners/allianz.png" },
  { nom: "GIZ Full", logo_url: "/images/partners/giz_full.png" },
];

const PartnersSection = () => {
  const [partners, setPartners] = useState(PARTNERS_FALLBACK);

  useEffect(() => {
    fetch(`${API_URL}/api/partenaires/publics`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length > 0) setPartners(data); })
      .catch(() => {});
  }, []);

  const items = [...partners, ...partners];

  return (
    <section style={{ padding: "56px 0", background: "#fff", borderTop: "1px solid #f1f5f9", overflow: "hidden" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto 28px", padding: "0 24px", textAlign: "center" }}>
        <p style={{ fontSize: ".78rem", color: "#94a3b8", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>
          Ils nous accordent leur confiance
        </p>
        <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "#0f172a" }}>Nos partenaires</h2>
      </div>
      <div style={{ overflow: "hidden", position: "relative" }}>
        {/* fade gauche/droite */}
        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:80, background:"linear-gradient(to right,#fff,transparent)", zIndex:2, pointerEvents:"none" }} />
        <div style={{ position:"absolute", right:0, top:0, bottom:0, width:80, background:"linear-gradient(to left,#fff,transparent)", zIndex:2, pointerEvents:"none" }} />
        <div style={{ display: "flex", width: "fit-content", animation: "ticker 28s linear infinite" }}>
          {items.map((p, i) => (
            <div key={i} style={{ flexShrink: 0, height: 72, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 48px" }}>
              {p.site_web ? (
                <a href={p.site_web} target="_blank" rel="noopener noreferrer" title={p.nom} style={{ display:"flex", alignItems:"center" }}>
                  <img src={p.logo_url} alt={p.nom} style={{ maxHeight: 56, maxWidth: 140, objectFit: "contain", opacity: 0.7, filter: "grayscale(.2)", transition:"opacity .2s" }}
                    onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="0.7"} />
                </a>
              ) : (
                <img src={p.logo_url} alt={p.nom} style={{ maxHeight: 56, maxWidth: 140, objectFit: "contain", opacity: 0.7, filter: "grayscale(.2)" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────
   9. COACHES SECTION
───────────────────────────────────────────────────────── */

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
        alt={coach.nom || `Coach BET ${coach.id}`}
        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s ease", transform: hov ? "scale(1.08)" : "scale(1)" }}
        onError={e => { e.currentTarget.parentElement.style.background = "#e2e8f0"; e.currentTarget.style.display = "none"; }}
      />
      <div style={{
        position: "absolute", inset: 0,
        background: hov
          ? "linear-gradient(180deg,transparent 25%,rgba(15,23,42,.85))"
          : "linear-gradient(180deg,transparent 55%,rgba(15,23,42,.5))",
        transition: "background .3s",
      }} />
      <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
        <div style={{ width: 26, height: 3, background: "#dc2626", borderRadius: 2, marginBottom: 6 }} />
        {coach.nom && (
          <div style={{ fontSize: ".78rem", color: "#fff", fontWeight: 700, lineHeight: 1.3 }}>{coach.nom}</div>
        )}
        <div style={{
          fontSize: ".68rem", color: "rgba(255,255,255,.8)", fontWeight: 600,
          opacity: hov ? 1 : 0, transform: hov ? "translateY(0)" : "translateY(6px)",
          transition: "opacity .3s, transform .3s", marginTop: 2,
        }}>
          {coach.grade || "Coach BET Certifié"}
        </div>
      </div>
    </div>
  );
};

const CoachesSection = () => {
  const [ref, inView] = useInView();
  const [coachs, setCoachs] = useState([]);

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || "http://localhost:5001";
    fetch(`${API}/api/equipe-photos/publics`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCoachs(data.map(c => ({
            id:    c.id,
            img:   c.photo_url,
            nom:   c.nom   || "",
            grade: c.titre || "",
          })));
        }
      })
      .catch(() => {});
  }, []);

  const half = Math.ceil(coachs.length / 2);
  const row1 = coachs.slice(0, half);
  const row2 = coachs.slice(half);

  return (
    <section ref={ref} style={{ padding: "80px 0", background: "#f8fafc", overflow: "hidden" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", textAlign: "center", marginBottom: 52 }}>
        <span style={SH.badge}>👥 NOTRE ÉQUIPE</span>
        <h2 style={{ ...SH.h2, opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: "all .6s ease" }}>
          Quelques membres de<br /><span style={SH.accent}>l'équipe coachs</span>
        </h2>
        <div style={SH.line} />
        <p style={{ ...SH.sub, opacity: inView ? 1 : 0, transition: "all .6s ease .15s" }}>
          Des coachs certifiés, passionnés et entièrement dédiés à votre réussite.
        </p>
      </div>

      {/* Ticker photos — affiché seulement si des photos existent */}
      {row1.length > 0 && (
        <>
          <div style={{ overflow: "hidden", marginBottom: 16 }}>
            <div style={{ display: "flex", width: "fit-content", animation: "ticker 50s linear infinite" }}>
              {[...row1, ...row1].map((coach, i) => <CoachCard key={i} coach={coach} />)}
            </div>
          </div>
          {row2.length > 0 && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", width: "fit-content", animation: "ticker 50s linear infinite reverse" }}>
                {[...row2, ...row2].map((coach, i) => <CoachCard key={i} coach={coach} />)}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 44 }}>
        <div style={{ display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { icon: "🎓", label: "Certifiés CELTA / DELTA" },
            { icon: "🌍", label: "Locuteurs natifs & bilingues" },
            { icon: "⭐", label: "+5 ans d'expérience en moyenne" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".85rem", color: "#475569", fontWeight: 600 }}>
              <span style={{ fontSize: "1.1rem" }}>{item.icon}</span> {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

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
    <div className="bet-sticky" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 8000,
      background: "linear-gradient(90deg,#0f172a,#1e3a8a)", borderTop: "2px solid rgba(255,255,255,.1)",
      padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, flexWrap: "wrap", animation: "slideDown .4s ease", boxShadow: "0 -8px 32px rgba(0,0,0,.35)"
    }}>
      {/* Texte */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div className="bet-sticky-icon" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🎓</div>
        <div>
          <div className="bet-sticky-text" style={{ color: "#fff", fontWeight: 800, fontSize: ".92rem" }}>Prêt à commencer votre formation ?</div>
          <div className="bet-sticky-sub" style={{ color: "rgba(255,255,255,.55)", fontSize: ".76rem" }}>Places limitées · Remboursement 30 jours garanti</div>
        </div>
      </div>

      {/* Mini-formulaire lead OU message de succès */}
      {sent ? (
        <div style={{ color: "#86efac", fontWeight: 700, fontSize: ".88rem" }}>
          ✓ Reçu ! Un conseiller vous contacte sous 24h.
        </div>
      ) : (
        <form className="bet-sticky-form" onSubmit={handleLead} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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

      {/* Boutons CTA */}
      <div className="bet-sticky-ctas" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Link to="/test-niveau">
          <button style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,.3)", color: "rgba(255,255,255,.8)", borderRadius: 999, padding: "9px 20px", fontWeight: 700, fontSize: ".84rem", cursor: "pointer", fontFamily: FF, whiteSpace: "nowrap" }}>
            Test gratuit
          </button>
        </Link>
        <button
          className="bet-sticky-ctas-secondary"
          style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,.2)", borderRadius: 999, padding: "9px 20px", fontWeight: 800, fontSize: ".84rem", cursor: "pointer", fontFamily: FF, whiteSpace: "nowrap" }}
          onClick={() => document.getElementById("programmes")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Choisir →
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
  useEffect(() => {
  }, []);

  const handleTest = useCallback(() => {
    window.location.href = "/test-niveau";
  }, []);

  return (
    <>
      <SEO
        title="Binnie's English Training – Formation anglais certifiante en Côte d'Ivoire"
        description="Certifications TOEIC, TOEFL, IELTS et cours d'anglais personnalisés pour particuliers et professionnels. Cabinet agréé État. +3 000 apprenants certifiés."
        canonicalUrl="/"
        image="/assets/images/og-home.jpg"
      />

      <div style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", color: "#0f172a", overflowX: "hidden", background: "#fff", paddingBottom: 72 }}>
        <HeroSection />
        <ProofStrip />
        <ProgramsSection activeProfile={activeProfile} onFilter={setActiveProfile} onEnroll={setEnrollProgram} />
        <TestBand />
        <ModesSection />
        <TestimonialsSection />
        <BlogSection/>
        <CoachesSection />
        <PartnersSection />
        <Footer />
      </div>

      {/* Modal paiement unique */}
      {enrollProgram && (
        <PaymentModal program={enrollProgram} onClose={() => setEnrollProgram(null)} />
      )}

    </>
  );
}


