import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer/Footer";
import CoachesSection from "../Components/CoachesSection/CoachesSection";
import { insertContact } from "../../services/formsService";

/* ── Fonts & KF ─────────────────────────────────────────── */
if (!document.querySelector("#cnt-fonts")) {
  const l = document.createElement("link"); l.id = "cnt-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap";
  document.head.appendChild(l);
}
if (!document.querySelector("#cnt-kf")) {
  const s = document.createElement("style"); s.id = "cnt-kf";
  s.textContent = `
    @keyframes cntFU  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cntFI  { from{opacity:0} to{opacity:1} }
    @keyframes cntSI  { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    @keyframes cntPulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.35)} 60%{box-shadow:0 0 0 14px rgba(220,38,38,0)} }
    @keyframes cntSpin  { to{transform:rotate(360deg)} }
    @keyframes cntOrb   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
    .cnt-input:focus { border-color:#dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,.1) !important; }
    .cnt-input-blue:focus { border-color:#1e3a8a !important; box-shadow: 0 0 0 3px rgba(30,58,138,.1) !important; }
    .cnt-info-card:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,.1) !important; }
    .cnt-social:hover { background:#1e3a8a !important; color:#fff !important; }
  `;
  document.head.appendChild(s);
}

/* ── Injection responsive ───────────────────────────────── */
if (!document.querySelector("#cnt-responsive")) {
  const resp = document.createElement("style");
  resp.id = "cnt-responsive";
  resp.textContent = `
    .cnt-root { overflow-x: hidden; max-width: 100%; }
    @media (max-width: 900px) {
      .cnt-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
      .cnt-hero-layout { grid-template-columns: 1fr !important; text-align: center; gap: 32px !important; }
      .cnt-hero-layout .cnt-hero-left { text-align: center; }
      .cnt-hero-contacts { align-items: center; }
      .cnt-hero-contact-item { justify-content: center; }
    }
    @media (max-width: 768px) {
      .cnt-info-grid { grid-template-columns: 1fr !important; gap: 16px; }
      .cnt-field-row { flex-direction: column !important; gap: 16px !important; }
      .cnt-alt-contact { grid-template-columns: 1fr !important; gap: 12px; }
      .cnt-cta-band-inner { grid-template-columns: 1fr !important; text-align: center; gap: 20px; }
      .cnt-hero-title { font-size: 1.8rem !important; }
      .cnt-form-card-header { text-align: center; }
      .cnt-type-switcher { justify-content: center; }
    }
    @media (max-width: 640px) {
      .cnt-hero-title { font-size: 1.5rem !important; }
      .cnt-hero-contact-item { flex-direction: column; text-align: center; gap: 6px; }
      .cnt-faq-item .cnt-faq-q { flex-wrap: wrap; gap: 8px; }
    }
    @media (max-width: 480px) {
      .cnt-hero-badge-row { justify-content: center; }
      .cnt-share-buttons { flex-direction: column; gap: 8px; }
      .cnt-modal-fields { gap: 12px; }
    }
  `;
  document.head.appendChild(resp);
}

/* ── InView hook ────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return [ref, v];
}

/* ─── DATA ───────────────────────────────────────────────── */
const OFFICES = [
  { name:"Centre Angré (Siège)",     address:"Angré 7ème Tranche, Immeuble Le Palace, 2ème étage, Abidjan", phone:"+225 07 00 00 00 00", email:"angre@binnies-english.ci",     hours:"Lun–Ven : 08h–20h · Sam : 09h–17h", color:"#dc2626" },
  { name:"Centre II Plateaux",       address:"Les Dieux, Abidjan",                                          phone:"+225 07 11 11 11 11", email:"plateaux@binnies-english.ci",   hours:"Lun–Ven : 08h–20h · Sam : 09h–17h", color:"#1e3a8a" },
  { name:"Centre Bouaké",            address:"Centre-ville, Bouaké",                                        phone:"+225 07 22 22 22 22", email:"bouake@binnies-english.ci",     hours:"Lun–Ven : 08h–19h · Sam : 09h–15h", color:"#059669" },
];

const FAQ_QUICK = [
  { q:"Comment s'inscrire ?",               a:"Contactez-nous par téléphone, email ou via ce formulaire. Nous organisons un test de niveau gratuit avant toute inscription." },
  { q:"Les cours sont-ils disponibles en ligne ?", a:"Oui ! Tous nos cours sont disponibles en présentiel et en ligne. Vous choisissez le format adapté à votre rythme." },
  { q:"Quels modes de paiement acceptez-vous ?",   a:"Nous acceptons Mobile Money (Orange, MTN, Wave, Moov), virement bancaire et règlement sur place en espèces." },
  { q:"Sous quel délai vous répondez ?",            a:"Nous répondons à tous les messages sous 24h ouvrées. Pour les urgences, appelez directement notre centre." },
];

const SUBJECTS = [
  "Demande de renseignements",
  "Inscription à une formation",
  "Préparation TOEIC / TOEFL / IELTS",
  "Formation entreprise",
  "Cours en ligne",
  "Cours à domicile",
  "Séjour linguistique",
  "Demande de devis (Entreprises uniquement)",
  "Partenariat",
  "Autre",
];
const DEVIS_SUBJECT = "Demande de devis (Entreprises uniquement)";

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
const Contact = () => {
  const navigate = useNavigate();

  const [formData,    setFormData]    = useState({ name:"", email:"", phone:"", subject:"", message:"", type:"particulier", centre_id:"" });
  const [isSubmitting,setIsSubmitting]= useState(false);
  const [success,     setSuccess]     = useState(false);
  const [errors,      setErrors]      = useState({});
  const [activeOffice,setActiveOffice]= useState(0);
  const [openFaq,     setOpenFaq]     = useState(null);
  const [focusedField,setFocusedField]= useState(null);

  const [heroRef,  heroInView]  = useInView();
  const [formRef,  formInView]  = useInView();
  const [infoRef,  infoInView]  = useInView();

  const validate = () => {
    const e = {};
    if (!formData.name.trim())    e.name    = "Le nom est requis";
    if (!formData.email.trim())   e.email   = "L'email est requis";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Email invalide";
    if (!formData.message.trim()) e.message = "Le message est requis";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => {
      const next = { ...p, [name]: value };
      // Auto-switch vers "entreprise" si le sujet devis est sélectionné
      if (name === "subject" && value === DEVIS_SUBJECT) next.type = "entreprise";
      return next;
    });
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
  };

  const isDevisSubject = formData.subject === DEVIS_SUBJECT;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsSubmitting(true);
    try {
      await insertContact({ nom: formData.name, email: formData.email, telephone: formData.phone || null, type: formData.type, sujet: formData.subject || null, message: formData.message, centre_id: formData.centre_id || null });
      setIsSubmitting(false);
      setSuccess(true);
      setFormData({ name:"", email:"", phone:"", subject:"", message:"", type:"particulier", centre_id:"" });
      setTimeout(() => setSuccess(false), 6000);
    } catch (err) {
      console.error("Erreur contact:", err);
      setIsSubmitting(false);
    }
  };

  const off = OFFICES[activeOffice];

  return (
    <div className="cnt-root" style={S.page}>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <div ref={heroRef} style={S.hero}>
        <div style={S.heroOrb1} />
        <div style={S.heroOrb2} />
        <div style={S.heroOrb3} />
        <div style={S.heroInner}>
          <div style={S.breadcrumb}>
            <span style={S.breadLink} onClick={() => navigate("/")}>Accueil</span>
            <span style={S.breadSep}>/</span>
            <span style={{ color:"#e2e8f0" }}>Contact</span>
          </div>

          <div className="cnt-hero-layout" style={S.heroLayout}>
            <div className="cnt-hero-left" style={{ animation: heroInView ? "cntFU .6s ease both" : "none" }}>
              <div className="cnt-hero-badge-row" style={S.heroTagRow}>
                <span style={S.heroBadgeRed}>📞 SUPPORT 7J/7</span>
                <span style={S.heroBadgeBlue}>💬 RÉPONSE SOUS 24H</span>
              </div>
              <h1 className="cnt-hero-title" style={S.heroTitle}>
                Parlons de votre<br />
                <em style={S.heroAccent}>projet anglais</em>
              </h1>
              <p style={S.heroDesc}>
                Une question, une inscription, un devis entreprise ou un simple renseignement —
                notre équipe est à votre disposition pour vous accompagner.
              </p>
              <div className="cnt-hero-contacts" style={S.heroContacts}>
                {[
                  { ico:"📞", val:"+225 07 00 00 00 00", lbl:"Appelez-nous",  color:"#fca5a5" },
                  { ico:"✉️", val:"contact@binnies-english.ci", lbl:"Écrivez-nous", color:"#93c5fd" },
                  { ico:"💬", val:"WhatsApp disponible", lbl:"Messagerie directe", color:"#6ee7b7" },
                ].map((c, i) => (
                  <div key={i} className="cnt-hero-contact-item" style={S.heroContactItem}>
                    <div style={S.heroContactIco}>{c.ico}</div>
                    <div>
                      <div style={{ ...S.heroContactVal, color: c.color }}>{c.val}</div>
                      <div style={S.heroContactLbl}>{c.lbl}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* partie droite (stats card) - inchangée */}
          </div>
        </div>

        <div style={S.heroWave}>
          <svg viewBox="0 0 1440 56" style={{ display:"block", width:"100%" }} preserveAspectRatio="none">
            <path fill="#fff" d="M0,28 C480,56 960,0 1440,28 L1440,56 L0,56 Z" />
          </svg>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN LAYOUT
      ══════════════════════════════════════════════ */}
      <div className="cnt-layout" style={S.layout}>

        {/* ── COLONNE GAUCHE : infos + map ─────────── */}
        <div ref={infoRef} style={S.infoCol}>

          {/* Google Maps */}
          <div style={S.mapWrap}>
            <div style={S.mapHeader}>
              <span style={S.mapHeaderTitle}>📍 Localisation</span>
            </div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.310376339353!2d-4.003492318927239!3d5.369546221617872!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfc1eb492c36597d%3A0x93bb218604963c57!2sBET%20Binnie&#39;s%20English%20Training!5e0!3m2!1sfr!2sfr!4v1775952579458!5m2!1sfr!2sfr"
              width="100%"
              height="240"
              style={{ border:0, borderRadius:"0 0 14px 14px", display:"block" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps - BET Binnie's English Training"
            />
          </div>

          {/* FAQ rapide */}
          <div style={S.faqBlock}>
            <h3 style={S.faqTitle}>Questions fréquentes</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {FAQ_QUICK.map((item, i) => (
                <div key={i} className="cnt-faq-item" style={{ ...S.faqItem, borderColor: openFaq === i ? "#dc2626" : "#e2e8f0" }}>
                  <button className="cnt-faq-q" style={S.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{item.q}</span>
                    <span style={{ fontSize:"1.2rem", color:"#dc2626", transition:"transform .2s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                  </button>
                  {openFaq === i && (
                    <p style={S.faqA}>{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COLONNE DROITE : FORMULAIRE ──────────── */}
        <div ref={formRef} style={{ ...S.formCol, opacity: formInView ? 1 : 0, transform: formInView ? "none" : "translateY(24px)", transition:"all .6s ease .1s" }}>
          <div style={S.formCard}>

            <div className="cnt-form-card-header" style={S.formCardHeader}>
              <div style={S.formHeaderOrb} />
              <h2 style={S.formTitle}>Envoyez-nous un message</h2>
              <p style={S.formSubtitle}>Notre équipe vous répond sous 24h ouvrées.</p>
              <div className="cnt-type-switcher" style={S.typeSwitcher}>
                {[{ id:"particulier", label:"👤 Particulier" }, { id:"entreprise", label:"🏢 Entreprise" }].map(t => (
                  <button key={t.id} style={{ ...S.typeBtn, ...(formData.type === t.id ? S.typeBtnActive : {}) }}
                    onClick={() => setFormData(p => ({ ...p, type: t.id }))}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.formBody}>
              {success && (
                <div style={S.successBand}>
                  <span style={{ fontSize:"1.6rem" }}>✅</span>
                  <div>
                    <strong style={{ display:"block", marginBottom:2 }}>Message envoyé avec succès !</strong>
                    <span style={{ fontSize:".84rem", opacity:.85 }}>Notre équipe vous répondra sous 24h. Merci de nous faire confiance !</span>
                  </div>
                </div>
              )}

              <div className="cnt-field-row" style={S.fieldRow}>
                <Field label="Nom complet *" error={errors.name}>
                  <input className="cnt-input" style={{ ...S.input, ...(errors.name ? S.inputError : {}), ...(focusedField === "name" ? S.inputFocus : {}) }}
                    type="text" name="name" placeholder="Jean Kouamé"
                    value={formData.name} onChange={handleChange}
                    onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)} />
                </Field>
                <Field label="Email *" error={errors.email}>
                  <input className="cnt-input" style={{ ...S.input, ...(errors.email ? S.inputError : {}), ...(focusedField === "email" ? S.inputFocus : {}) }}
                    type="email" name="email" placeholder="jean@exemple.com"
                    value={formData.email} onChange={handleChange}
                    onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} />
                </Field>
              </div>

              <div className="cnt-field-row" style={S.fieldRow}>
                <Field label="Téléphone">
                  <input className="cnt-input-blue" style={{ ...S.input, ...(focusedField === "phone" ? S.inputFocusBlue : {}) }}
                    type="tel" name="phone" placeholder="+225 07 00 00 00 00"
                    value={formData.phone} onChange={handleChange}
                    onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)} />
                </Field>
                <Field label="Sujet">
                  <select className="cnt-input-blue" style={{ ...S.input, ...(focusedField === "subject" ? S.inputFocusBlue : {}), cursor:"pointer" }}
                    name="subject" value={formData.subject} onChange={handleChange}
                    onFocus={() => setFocusedField("subject")} onBlur={() => setFocusedField(null)}>
                    <option value="">Sélectionner un sujet</option>
                    {SUBJECTS.map((s, i) => <option key={i}>{s}</option>)}
                  </select>
                </Field>
              </div>

              {/* Note devis entreprise */}
              {isDevisSubject && (
                <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"12px 16px", fontSize:".82rem", color:"#92400e", display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ fontSize:"1.1rem", flexShrink:0 }}>🏢</span>
                  <div>
                    <strong>Réservé aux entreprises</strong> — La demande de devis est exclusivement destinée aux structures souhaitant former leurs collaborateurs. Nous avons automatiquement sélectionné le profil <strong>Entreprise</strong> pour votre demande.
                  </div>
                </div>
              )}

              {formData.type === "entreprise" && (
                <Field label={isDevisSubject ? "Nom de l'entreprise *" : "Nom de l'entreprise"}>
                  <input className="cnt-input-blue" style={{ ...S.input, ...(focusedField === "company" ? S.inputFocusBlue : {}) }}
                    type="text" name="company" placeholder="Mon Entreprise SARL"
                    value={formData.company || ""} onChange={handleChange}
                    onFocus={() => setFocusedField("company")} onBlur={() => setFocusedField(null)} />
                </Field>
              )}
              {isDevisSubject && (
                <Field label="Effectif à former">
                  <select className="cnt-input-blue"
                    style={{ ...S.input, cursor:"pointer" }}
                    name="effectif"
                    value={formData.effectif || ""}
                    onChange={handleChange}>
                    <option value="">Sélectionner l'effectif</option>
                    <option>1 – 5 employés</option>
                    <option>6 – 20 employés</option>
                    <option>21 – 50 employés</option>
                    <option>50+ employés</option>
                  </select>
                </Field>
              )}

              <Field label="Centre souhaité">
                <select className="cnt-input-blue" style={{ ...S.input, cursor:"pointer" }}
                  name="centre_id" value={formData.centre_id} onChange={handleChange}>
                  <option value="">Choisir un centre (optionnel)</option>
                  <option value="angre">Angré — Abidjan</option>
                  <option value="2plateaux">II Plateaux — Abidjan</option>
                  <option value="yopougon">Yopougon — Abidjan</option>
                  <option value="koumassi">Koumassi — Abidjan</option>
                  <option value="abatta">Abatta — Abidjan</option>
                  <option value="bouake">Bouaké</option>
                </select>
              </Field>

              <Field label="Message *" error={errors.message}>
                <textarea className="cnt-input" style={{ ...S.input, height:140, resize:"vertical", ...(errors.message ? S.inputError : {}), ...(focusedField === "message" ? S.inputFocus : {}) }}
                  name="message" placeholder="Décrivez votre besoin, vos objectifs ou votre question..."
                  value={formData.message} onChange={handleChange}
                  onFocus={() => setFocusedField("message")} onBlur={() => setFocusedField(null)} />
              </Field>

              <div style={S.attachHint}>
                <span style={{ fontSize:"1rem" }}>📎</span>
                <span>Vous pouvez joindre un CV ou un document en répondant à notre email de confirmation.</span>
              </div>

              <button style={{ ...S.submitBtn, opacity: isSubmitting ? .7 : 1 }} onClick={handleSubmit} disabled={isSubmitting}
                onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background="#b91c1c"; }}
                onMouseLeave={e => { e.currentTarget.style.background="linear-gradient(135deg,#dc2626,#1e3a8a)"; }}>
                {isSubmitting ? (
                  <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                    <span style={{ width:18, height:18, border:"2.5px solid rgba(255,255,255,.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"cntSpin .8s linear infinite", display:"inline-block" }} />
                    Envoi en cours…
                  </span>
                ) : "Envoyer le message →"}
              </button>

              <p style={S.formFooterNote}>
                ✓ Réponse sous 24h &nbsp;·&nbsp; ✓ Sans engagement &nbsp;·&nbsp; ✓ Données protégées
              </p>
            </div>
          </div>
        </div>
      </div>

      <CoachesSection />

      <Footer />
    </div>
  );
};

/* ── Field wrapper ───────────────────────────────────────── */
const Field = ({ label, children, error }) => (
  <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:5 }}>
    <label style={{ fontSize:".78rem", fontWeight:700, color:"#0f172a", display:"flex", alignItems:"center", gap:6 }}>{label}</label>
    {children}
    {error && <span style={{ fontSize:".74rem", color:"#dc2626", fontWeight:600 }}>⚠ {error}</span>}
  </div>
);

/* ════════════════════════════════════════════════════════
   STYLES (inchangés)
════════════════════════════════════════════════════════ */
const FF = "'Montserrat','Segoe UI',sans-serif";
const FD = "'Montserrat','Segoe UI',sans-serif"; 

const S = {
  page:          { fontFamily:FF, color:"#0f172a", background:"#fff", minHeight:"100vh" },

  /* HERO */
  hero:          { background:"linear-gradient(135deg,#0f172a 0%,#1e2a4a 55%,#1e3a8a 100%)", padding:"52px 0 0", position:"relative", overflow:"hidden" },
  heroOrb1:      { position:"absolute", width:360, height:360, borderRadius:"50%", background:"rgba(220,38,38,.12)", top:-100, right:-60, pointerEvents:"none" },
  heroOrb2:      { position:"absolute", width:240, height:240, borderRadius:"50%", background:"rgba(30,58,138,.2)", bottom:40, left:-60, pointerEvents:"none", animation:"cntOrb 5s ease infinite" },
  heroOrb3:      { position:"absolute", width:180, height:180, borderRadius:"50%", background:"rgba(220,38,38,.07)", top:"35%", left:"38%", pointerEvents:"none" },
  heroInner:     { maxWidth:1180, margin:"0 auto", padding:"0 24px", position:"relative", zIndex:1 },
  breadcrumb:    { display:"flex", alignItems:"center", gap:8, marginBottom:28, fontSize:".82rem", flexWrap:"wrap" },
  breadLink:     { color:"rgba(255,255,255,.6)", cursor:"pointer", textDecoration:"underline" },
  breadSep:      { color:"rgba(255,255,255,.3)" },
  heroLayout:    { display:"grid", gridTemplateColumns:"1fr 340px", gap:48, alignItems:"flex-start", paddingBottom:52 },
  heroTagRow:    { display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" },
  heroBadgeRed:  { background:"rgba(220,38,38,.25)", border:"1px solid rgba(220,38,38,.5)", color:"#fca5a5", borderRadius:999, padding:"4px 14px", fontSize:".72rem", fontWeight:800, letterSpacing:".05em" },
  heroBadgeBlue: { background:"rgba(30,58,138,.3)", border:"1px solid rgba(30,58,138,.6)", color:"#93c5fd", borderRadius:999, padding:"4px 14px", fontSize:".72rem", fontWeight:800 },
  heroTitle:     { fontFamily:FD, fontSize:"clamp(2rem,4.5vw,3.4rem)", color:"#fff", margin:"0 0 14px", fontWeight:400, lineHeight:1.1 },
  heroAccent:    { color:"#f87171", fontStyle:"italic" },
  heroDesc:      { color:"rgba(255,255,255,.75)", fontSize:"1rem", lineHeight:1.75, margin:"0 0 28px", maxWidth:520 },
  heroContacts:  { display:"flex", flexDirection:"column", gap:14 },
  heroContactItem:{ display:"flex", alignItems:"center", gap:14 },
  heroContactIco:{ width:38, height:38, borderRadius:10, background:"rgba(255,255,255,.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 },
  heroContactVal:{ fontWeight:700, fontSize:".9rem", marginBottom:1 },
  heroContactLbl:{ fontSize:".74rem", color:"rgba(255,255,255,.5)", fontWeight:500 },
  heroStatsCard: { background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:18, padding:"22px 18px", backdropFilter:"blur(8px)" },
  heroStatsTitle:{ fontSize:".8rem", fontWeight:800, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 14px" },
  heroOfficeBtn: { width:"100%", display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"9px 12px", fontFamily:FF, fontSize:".84rem", fontWeight:600, color:"rgba(255,255,255,.75)", cursor:"pointer", marginBottom:8, transition:"all .2s", textAlign:"left" },
  heroOfficeDot: { width:8, height:8, borderRadius:"50%", flexShrink:0 },
  heroOfficeDetail:{ marginTop:14, padding:"12px 14px", background:"rgba(255,255,255,.05)", borderRadius:10, border:"1px solid rgba(255,255,255,.08)" },
  heroOfficeLine:{ display:"flex", alignItems:"flex-start", gap:8, fontSize:".8rem", color:"rgba(255,255,255,.65)", marginBottom:8, lineHeight:1.5 },
  heroWave:      { marginTop:8, lineHeight:0, position:"relative", zIndex:1 },

  /* LAYOUT */
  layout:        { maxWidth:1180, margin:"0 auto", padding:"48px 24px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"start" },

  /* INFO COL */
  infoCol:       { display:"flex", flexDirection:"column", gap:24 },
  infoGrid:      { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 },
  infoCard:      { border:"1.5px solid", borderRadius:14, padding:"18px 16px", transition:"all .25s", cursor:"default" },
  infoCardIco:   { width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", marginBottom:10, color:"#fff" },
  infoCardTitle: { fontFamily:FD, fontSize:"1rem", margin:"0 0 8px", fontWeight:400 },
  infoCardLine:  { fontSize:".84rem", color:"#475569", margin:"0 0 3px", lineHeight:1.5 },

  /* SOCIAL */
  socialBlock:   { background:"#fafafa", border:"1px solid #e2e8f0", borderRadius:14, padding:"18px 16px" },
  socialTitle:   { fontSize:".78rem", fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 12px" },
  socialRow:     { display:"flex", gap:10 },
  socialBtn:     { width:42, height:42, borderRadius:10, background:"#f1f5f9", border:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", cursor:"pointer", textDecoration:"none", transition:"all .2s" },

  /* MAP */
  mapWrap:       { border:"1px solid #e2e8f0", borderRadius:14, overflow:"hidden" },
  mapHeader:     { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"linear-gradient(135deg,#0f172a,#1e3a8a)" },
  mapHeaderTitle:{ fontSize:".8rem", fontWeight:700, color:"#fff" },
  mapLink:       { fontSize:".76rem", color:"#93c5fd", fontWeight:600, textDecoration:"none" },

  /* FAQ */
  faqBlock:      { background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"20px 16px" },
  faqTitle:      { fontFamily:FD, fontSize:"1.15rem", margin:"0 0 16px", fontWeight:400, color:"#0f172a" },
  faqItem:       { border:"1.5px solid", borderRadius:10, overflow:"hidden", transition:"border-color .2s" },
  faqQ:          { width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:"none", border:"none", fontFamily:FF, fontSize:".88rem", fontWeight:600, color:"#0f172a", cursor:"pointer", textAlign:"left", gap:12 },
  faqA:          { padding:"0 14px 12px", fontSize:".86rem", color:"#475569", lineHeight:1.65, margin:0 },

  /* FORM COL */
  formCol:       { display:"flex", flexDirection:"column", gap:20 },
  formCard:      { background:"#fff", border:"1px solid #e2e8f0", borderRadius:20, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,.08)" },
  formCardHeader:{ background:"#1e3a8a", padding:"28px 28px 24px", position:"relative", overflow:"hidden" },
  formHeaderOrb: { position:"absolute", width:200, height:200, borderRadius:"50%", background:"rgba(220,38,38,.15)", top:-80, right:-60, pointerEvents:"none" },
  formTitle:     { fontFamily:FD, fontSize:"1.6rem", color:"#fff", margin:"0 0 6px", fontWeight:400, position:"relative", zIndex:1 },
  formSubtitle:  { fontSize:".88rem", color:"rgba(255,255,255,.65)", margin:"0 0 18px", position:"relative", zIndex:1 },
  typeSwitcher:  { display:"flex", gap:8, position:"relative", zIndex:1 },
  typeBtn:       { background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.2)", borderRadius:999, padding:"7px 18px", fontFamily:FF, fontSize:".82rem", fontWeight:700, color:"rgba(255,255,255,.75)", cursor:"pointer", transition:"all .2s" },
  typeBtnActive: { background:"#dc2626", borderColor:"#dc2626", color:"#fff", boxShadow:"0 4px 14px rgba(220,38,38,.4)" },
  formBody:      { padding:"28px" },
  fieldRow:      { display:"flex", gap:16, marginBottom:16 },
  input:         { width:"100%", padding:"10px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:".9rem", fontFamily:FF, outline:"none", boxSizing:"border-box", transition:"border-color .2s, box-shadow .2s", background:"#fff", color:"#0f172a" },
  inputError:    { borderColor:"#dc2626 !important" },
  inputFocus:    { borderColor:"#dc2626", boxShadow:"0 0 0 3px rgba(220,38,38,.1)" },
  inputFocusBlue:{ borderColor:"#1e3a8a", boxShadow:"0 0 0 3px rgba(30,58,138,.1)" },
  attachHint:    { display:"flex", alignItems:"center", gap:8, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:".78rem", color:"#64748b", marginBottom:18 },
  successBand:   { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:14, color:"#166534", marginBottom:20, animation:"cntFU .4s ease" },
  submitBtn:     { width:"100%", padding:"14px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:999, fontFamily:FF, fontWeight:800, fontSize:"1rem", cursor:"pointer", transition:"background .2s", boxShadow:"0 6px 20px rgba(220,38,38,.3)" },
  formFooterNote:{ textAlign:"center", fontSize:".76rem", color:"#94a3b8", margin:"14px 0 0" },

  /* ALT CONTACT */
  altContact:    { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 },
  altCard:       { background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"14px 12px", display:"flex", alignItems:"center", gap:12 },
  altIco:        { width:36, height:36, borderRadius:10, background:"#fef2f2", color:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 },
  altTitle:      { fontSize:".74rem", color:"#64748b", margin:"0 0 2px", fontWeight:600 },
  altVal:        { fontSize:".82rem", fontWeight:800, color:"#0f172a", margin:0 },

  /* CTA BAND */
  ctaBand:       { background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#0891b2 100%)", padding:"68px 0", position:"relative", overflow:"hidden" },
  ctaBandOrb1:   { position:"absolute", width:300, height:300, borderRadius:"50%", background:"rgba(220,38,38,.15)", top:-100, right:60, pointerEvents:"none" },
  ctaBandOrb2:   { position:"absolute", width:200, height:200, borderRadius:"50%", background:"rgba(220,38,38,.08)", bottom:-80, left:40, pointerEvents:"none" },
  ctaBandInner:  { maxWidth:1180, margin:"0 auto", padding:"0 24px", display:"grid", gridTemplateColumns:"1fr auto", gap:40, alignItems:"center", position:"relative", zIndex:1 },
  ctaKicker:     { color:"rgba(255,255,255,.65)", fontSize:".9rem", fontWeight:600, margin:"0 0 12px" },
  ctaTitle:      { fontFamily:FD, fontSize:"clamp(1.6rem,3.5vw,2.6rem)", color:"#fff", margin:0, fontWeight:400, lineHeight:1.2 },
  ctaBtnGold:    { background:"#f59e0b", color:"#000", border:"none", borderRadius:999, padding:"13px 28px", fontFamily:FF, fontWeight:800, fontSize:".96rem", cursor:"pointer", transition:"background .2s", boxShadow:"0 6px 20px rgba(245,158,11,.35)", whiteSpace:"nowrap" },
  ctaBtnGhost:   { background:"transparent", color:"#fff", border:"2px solid rgba(255,255,255,.35)", borderRadius:999, padding:"12px 24px", fontFamily:FF, fontWeight:700, fontSize:".9rem", cursor:"pointer", transition:"background .2s", whiteSpace:"nowrap" },
};

export default Contact;