import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logoBET  from "../../Assets/BIINIES-ENGLISH-LOGO.png";
import logoFDFP from "../../Assets/logo-fdfp.png";
import Footer   from "../Footer/Footer";

/* ── Fonts & KF ─────────────────────────────────────────── */
if (!document.querySelector("#abt-fonts")) {
  const l = document.createElement("link"); l.id = "abt-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.querySelector("#abt-kf")) {
  const s = document.createElement("style"); s.id = "abt-kf";
  s.textContent = `
    @keyframes abtFU  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes abtFI  { from{opacity:0} to{opacity:1} }
    @keyframes abtSI  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
    @keyframes abtPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
    @keyframes abtSlide { from{transform:translateX(-30px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes abtCount { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes abtBar   { from{width:0} to{width:var(--bw,80%)} }
    .abt-card-hov { transition: all .28s ease !important; }
    .abt-card-hov:hover { transform: translateY(-5px) !important; box-shadow: 0 16px 40px rgba(0,0,0,.12) !important; }
  `;
  document.head.appendChild(s);
}

/* ── Injection responsive ───────────────────────────────── */
if (!document.querySelector("#abt-responsive")) {
  const resp = document.createElement("style");
  resp.id = "abt-responsive";
  resp.textContent = `
    .abt-root { overflow-x: hidden; max-width: 100%; }
    @media (max-width: 900px) {
      .abt-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
      .abt-sidebar { position: relative !important; top: 0 !important; width: 100% !important; margin-top: 32px; }
      .abt-hero-layout { grid-template-columns: 1fr !important; text-align: center; gap: 32px !important; }
      .abt-hero-layout .abt-hero-left { text-align: center; }
      .abt-hero-quick-stats { justify-content: center; }
      .abt-hero-ctas { justify-content: center; }
    }
    @media (max-width: 768px) {
      .abt-intro-split { grid-template-columns: 1fr !important; gap: 24px; }
      .abt-philo-grid, .abt-method-grid { grid-template-columns: 1fr !important; gap: 16px; }
      .abt-team-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important; }
      .abt-partners-grid { grid-template-columns: 1fr !important; }
      .abt-agree-banner { flex-direction: column; text-align: center; }
      .abt-agree-banner-left { flex-direction: column; align-items: center; text-align: center; }
      .abt-join-banner { flex-direction: column; text-align: center; gap: 24px; }
      .abt-stats-grid { grid-template-columns: 1fr !important; gap: 16px; }
      .abt-hero-title { font-size: 1.8rem !important; }
      .abt-tabs-inner { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .abt-tab-btn { padding: 10px 14px !important; font-size: 0.8rem !important; }
    }
    @media (max-width: 640px) {
      .abt-hero-title { font-size: 1.5rem !important; }
      .abt-hero-quick-stats { grid-template-columns: repeat(2, 1fr) !important; gap: 12px; }
      .abt-centers-grid { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 480px) {
      .abt-hero-quick-stats { grid-template-columns: 1fr !important; }
      .abt-share-buttons { flex-direction: column; gap: 8px; }
    }
  `;
  document.head.appendChild(resp);
}

/* ── Counter hook ───────────────────────────────────────── */
function useCounter(target, active, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return val;
}

/* ── InView hook ────────────────────────────────────────── */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/* ════════════════════════════════════════════════════════
   DATA (inchangée)
════════════════════════════════════════════════════════ */
const TABS = [
  { id: "histoire",     label: "Notre histoire" },
  { id: "approche",     label: "Approche pédagogique" },
  // { id: "equipe",       label: "Notre équipe" },
  { id: "partenaires",  label: "Partenaires & Agréments" },
];

const TIMELINE = [
  { year:"2018", title:"Fondation de BET",         desc:"Création de Binnie's English Training à Abidjan, avec un premier centre à Angré et une vision claire : rendre l'anglais professionnel accessible à tous." },
  { year:"2019", title:"Agrément de l'État",        desc:"BET obtient l'agrément officiel du Ministère de l'Emploi de Côte d'Ivoire, devenant un cabinet de formation certifié." },
  { year:"2020", title:"Partenariat ETS Global",    desc:"Signature du partenariat avec ETS Global, faisant de BET un centre officiel pour les examens TOEIC en Côte d'Ivoire." },
  { year:"2021", title:"3 nouveaux centres",        desc:"Ouverture des centres de Yopougon, Koumassi et Bouaké, pour couvrir l'ensemble du territoire ivoirien." },
  { year:"2022", title:"Lancement des cours en ligne",desc:"Déploiement de la plateforme e-learning permettant à nos apprenants de se former depuis n'importe où en Côte d'Ivoire et en Afrique." },
  { year:"2024", title:"3 000+ apprenants formés",  desc:"BET franchit le cap des 5 000 apprenants formés et des 750 certifications internationales décrochées. Un résultat dont toute l'équipe est fière." },
];

const PHILOSOPHY = [
  { icon:"🎯", title:"Pratique concrète", desc:"Nos cours sont interactifs et centrés sur l'expression dans des situations réelles du monde professionnel. 70% du temps est consacré à la pratique orale et écrite.", color:"#fef2f2", accent:"#dc2626" },
  { icon:"🚀", title:"Sortir de sa zone de confort", desc:"Nous encourageons chaque apprenant à prendre des risques linguistiques, car c'est là que l'apprentissage le plus profond et le plus durable se produit.", color:"#eff6ff", accent:"#1e3a8a" },
  { icon:"📚", title:"Formations personnalisées", desc:"Chaque apprenant a des besoins uniques. Nos programmes sont sur-mesure, adaptés à vos objectifs, votre rythme et votre style d'apprentissage.", color:"#f0fdf4", accent:"#059669" },
  { icon:"🌍", title:"Ouverture internationale", desc:"Nos partenariats avec des institutions internationales (ETS, British Council) garantissent un contenu pédagogique aligné sur les standards mondiaux.", color:"#fefce8", accent:"#d97706" },
];

const TEAM = [
  { av:"👩🏾‍🏫", name:"Prof. Ama Kouassi",    role:"Directrice Générale & Pédagogique", cert:"CELTA · DELTA · MA Applied Linguistics", exp:"12 ans", color:"#dc2626" },
  { av:"👨🏿‍🏫", name:"M. James K. Adou",      role:"Responsable Certifications TOEIC",  cert:"TOEIC 990 · CELTA Cambridge",           exp:"9 ans",  color:"#1e3a8a" },
  { av:"👩🏼‍🏫", name:"Ms Sarah Mortimer",     role:"Formatrice native UK",              cert:"Cambridge CELTA · M.Ed Oxford",         exp:"7 ans",  color:"#059669" },
  { av:"👨🏾‍💼", name:"M. Kofi Mensah",        role:"Directeur Formation Entreprises",    cert:"MBA · Certificate in L&D",              exp:"10 ans", color:"#d97706" },
];

const PARTNERS = [
  { name:"FDFP", fullName:"Fonds de Développement de la Formation Professionnelle", desc:"Partenaire officiel pour le financement des formations professionnelles en Côte d'Ivoire.", logo: null, badge:"AGRÉMENT OFFICIEL" },
];

// const SKILLS = [
//   { label:"Taux de satisfaction apprenants", value:98, color:"#dc2626" },
//   { label:"Taux de réussite aux certifications",value:96, color:"#1e3a8a" },
//   { label:"Apprenants recommandant BET",     value:94, color:"#059669" },
//   { label:"Score TOEIC moyen de nos certifiés",value:78, color:"#d97706", suffix:"/100" },
// ];

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
const About = () => {
  const navigate    = useNavigate();
  const [activeTab, setActiveTab] = useState("histoire");
  const [stickyBar, setStickyBar] = useState(false);
  const [openTl,    setOpenTl]    = useState({0:true});
  const [hovCard,   setHovCard]   = useState(null);

  const heroRef = useRef(null);
  const [statsRef, statsInView] = useInView(0.3);

  const c1 = useCounter(5000, statsInView, 2000);
  const c2 = useCounter(750,  statsInView, 1800);
  const c3 = useCounter(98,   statsInView, 1600);
  const c4 = useCounter(6,    statsInView, 1200);

  useEffect(() => {
    const h = () => setStickyBar(window.scrollY > (heroRef.current?.offsetHeight || 400) - 80);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="abt-root" style={S.page}>

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
            <span style={{ color:"#e2e8f0" }}>À propos</span>
          </div>

          <div className="abt-hero-layout" style={S.heroLayout}>
            <div className="abt-hero-left" style={S.heroLeft}>
              <div style={S.heroBadgeRow}>
                <span style={S.heroBadgeRed}>🏛️ CABINET AGRÉÉ ÉTAT CI</span>
                <span style={S.heroBadgeBlue}>🌍 DEPUIS 2018</span>
              </div>

              <h1 className="abt-hero-title" style={S.heroTitle}>
                Binnie's English
                <br />
                <em style={S.heroTitleAccent}>Training</em>
              </h1>
              <p style={S.heroTagline}>
                Avec nous, profitez des opportunités du monde.
              </p>
              <p style={S.heroDesc}>
                Le cabinet de référence pour l'enseignement de l'anglais en Côte d'Ivoire.
                Formation certifiante, méthodes éprouvées, résultats garantis.
              </p>

              <div className="abt-hero-quick-stats" style={S.heroQuickStats}>
                {[
                  { num:"3 000+", lbl:"Apprenants formés", color:"#fca5a5" },
                  { num:"6",      lbl:"Centres CI",         color:"#93c5fd" },
                  { num:"100%",    lbl:"Satisfaction",       color:"#6ee7b7" },
                  { num:"750+",   lbl:"Certifications",     color:"#fde68a" },
                ].map((s, i) => (
                  <div key={i} style={S.heroQuickStat}>
                    <strong style={{ ...S.heroQuickNum, color: s.color }}>{s.num}</strong>
                    <span style={S.heroQuickLbl}>{s.lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* partie droite (logo card) - inchangée */}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          STICKY TABS
      ══════════════════════════════════════════════ */}
      <div style={{ ...S.tabsBar, ...(stickyBar ? S.tabsSticky : {}) }}>
        <div className="abt-tabs-inner" style={S.tabsInner}>
          {TABS.map(t => (
            <button key={t.id}
              className="abt-tab-btn"
              style={{ ...S.tabBtn, ...(activeTab === t.id ? S.tabActive : {}) }}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN LAYOUT
      ══════════════════════════════════════════════ */}
      <div className="abt-layout" style={S.layout}>
        <div style={S.contentCol}>

          {/* ── NOTRE HISTOIRE ─────────────────────── */}
          {activeTab === "histoire" && (
            <div style={{ animation:"abtFU .4s ease" }}>
              <section style={S.section}>
                <div className="abt-intro-split" style={S.introSplit}>
                  <div style={S.introText}>
                    <h2 style={S.sH2}>Qui sommes-nous ?</h2>
                    <p style={S.descP}>
                      BET est un cabinet de formation linguistique agréé par l'État, spécialisé dans l'enseignement
                      de la langue anglaise pour les particuliers et les entreprises, fondé en 2018.
                    </p>
                    <p style={S.descP}>
                      Nous nous sommes engagés à fournir à nos étudiants une formation de haute qualité pour
                      les aider à atteindre leurs objectifs linguistiques, qu'il s'agisse d'améliorer leur anglais
                      professionnel, de préparer des examens internationaux ou de se sentir plus confiants à l'oral.
                    </p>
                    <p style={S.descP}>
                      Nos enseignants qualifiés et expérimentés sont à l'écoute de chaque étudiant et déterminés
                      à les aider à atteindre leur plein potentiel, couronné par une{" "}
                      <strong style={{ color:"#dc2626" }}>certification officielle reconnue</strong> attestant
                      des compétences linguistiques acquises.
                    </p>
                  </div>
                  <div style={S.introCard}>
                    <div style={S.introCardTop}>
                      <div style={S.introCardLogo}>
                        <img src={logoBET} alt="BET" style={{ width:"100%", objectFit:"contain" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ── APPROCHE PÉDAGOGIQUE ───────────────── */}
          {activeTab === "approche" && (
            <div style={{ animation:"abtFU .4s ease" }}>
              <section style={S.section}>
                <h2 style={S.sH2}>Notre approche pédagogique</h2>
                <p style={S.descP}>Une méthode construite sur 6 ans d'expérience et de résultats concrets.</p>
                <div className="abt-philo-grid" style={S.philoGrid}>
                  {PHILOSOPHY.map((p, i) => (
                    <div key={i} className="abt-card-hov" style={{
                      ...S.philoCard,
                      background: hovCard === i ? p.color : "#fff",
                      borderColor: hovCard === i ? p.accent : "#e2e8f0",
                    }}
                      onMouseEnter={() => setHovCard(i)}
                      onMouseLeave={() => setHovCard(null)}>
                      <div style={{ ...S.philoIconWrap, background: p.color }}>
                        <span style={S.philoIcon}>{p.icon}</span>
                      </div>
                      <h3 style={{ ...S.philoTitle, color: hovCard === i ? p.accent : "#0f172a" }}>{p.title}</h3>
                      <p style={S.philoDesc}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* <section style={S.section}>
                <h2 style={S.sH2}>Notre expertise en chiffres</h2>
                <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
                  {SKILLS.map((sk, i) => (
                    <div key={i}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:".9rem", fontWeight:600, color:"#0f172a" }}>{sk.label}</span>
                        <span style={{ fontSize:".9rem", fontWeight:800, color: sk.color }}>{sk.value}{sk.suffix || "%"}</span>
                      </div>
                      <div style={{ background:"#f1f5f9", borderRadius:6, height:10, overflow:"hidden" }}>
                        <div style={{ height:"100%", background:`linear-gradient(90deg,${sk.color},${sk.color}88)`, borderRadius:6, "--bw":`${sk.value}%`, width:`${sk.value}%`, transition:`width 1.5s ease ${i*200}ms`, animation:`abtBar 1.5s ease ${i*200}ms both` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section> */}

              {/* <section style={S.section}>
                <h2 style={S.sH2}>Notre méthode en 4 étapes</h2>
                <div className="abt-method-grid" style={S.methodGrid}>
                  {[
                    { num:"01", title:"Test de positionnement",    desc:"Évaluation gratuite pour déterminer votre niveau exact et vos objectifs.", color:"#dc2626" },
                    { num:"02", title:"Programme sur-mesure",      desc:"Construction d'un parcours personnalisé aligné sur vos besoins spécifiques.", color:"#1e3a8a" },
                    { num:"03", title:"Formation intensive",        desc:"Cours pratiques avec exercices réels et feedback immédiat de formateurs certifiés.", color:"#059669" },
                    { num:"04", title:"Certification officielle",  desc:"Examen et remise d'un certificat reconnu nationalement et internationalement.", color:"#d97706" },
                  ].map((m, i) => (
                    <div key={i} className="abt-card-hov" style={S.methodCard}>
                      <div style={{ ...S.methodNum, background:`linear-gradient(135deg,${m.color},#0f172a)` }}>{m.num}</div>
                      <h3 style={{ ...S.methodTitle, color: m.color }}>{m.title}</h3>
                      <p style={S.methodDesc}>{m.desc}</p>
                    </div>
                  ))}
                </div>
              </section> */}
            </div>
          )}

          {/* ── ÉQUIPE ─────────────────────────────── */}
          {activeTab === "equipe" && (
            <div style={{ animation:"abtFU .4s ease" }}>
              <section style={S.section}>
                <h2 style={S.sH2}>Notre équipe de formateurs</h2>
                <p style={S.descP}>Des experts passionnés, certifiés et dédiés à votre réussite.</p>
                <div className="abt-team-grid" style={S.teamGrid}>
                  {TEAM.map((m, i) => (
                    <div key={i} className="abt-card-hov" style={{
                      ...S.teamCard,
                      borderTop: `4px solid ${m.color}`,
                    }}>
                      <div style={{ ...S.teamAv, background:`linear-gradient(135deg,${m.color},#0f172a)` }}>{m.av}</div>
                      <h3 style={{ ...S.teamName, color: m.color }}>{m.name}</h3>
                      <p style={S.teamRole}>{m.role}</p>
                      <div style={S.teamCert}>{m.cert}</div>
                      <div style={{ ...S.teamExp, background: m.color+"22", color: m.color }}>
                        {m.exp} d'expérience
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={S.section}>
                <div className="abt-join-banner" style={S.joinBanner}>
                  <div style={S.joinOrb} />
                  <div style={S.joinLeft}>
                    <h3 style={S.joinTitle}>Vous êtes formateur certifié ?</h3>
                    <p style={S.joinDesc}>Rejoignez l'équipe BET et participez à la mission de démocratiser l'anglais professionnel en Côte d'Ivoire.</p>
                    <button style={S.joinBtn}
                      onMouseEnter={e => e.currentTarget.style.background="#1e40af"}
                      onMouseLeave={e => e.currentTarget.style.background="#fff"}
                      onClick={() => navigate("/contact")}>
                      Postuler →
                    </button>
                  </div>
                  <div style={S.joinIcons}>
                    {["👩🏾‍🏫","👨🏿‍🏫","👩🏼‍🏫","👨🏽‍🏫","🎓","🌍"].map((ico, i) => (
                      <div key={i} style={S.joinIconBubble}>{ico}</div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ── PARTENAIRES ─────────────────────────── */}
          {activeTab === "partenaires" && (
            <div style={{ animation:"abtFU .4s ease" }}>
              <section style={S.section}>
                <h2 style={S.sH2}>Nos partenaires officiels</h2>
                <p style={S.descP}>BET collabore avec des institutions nationales et internationales de référence pour garantir la qualité et la reconnaissance de ses formations.</p>
                <div className="abt-partners-grid" style={S.partnersGrid}>
                  {PARTNERS.map((p, i) => (
                    <div key={i} className="abt-card-hov" style={S.partnerCard}>
                      <div style={S.partnerBadge}>{p.badge}</div>
                      <div style={S.partnerLogoArea}>
                        {p.name === "FDFP" && logoFDFP
                          ? <img src={logoFDFP} alt={p.name} style={{ maxHeight:60, objectFit:"contain", maxWidth:140 }} />
                          : <div style={S.partnerNameBig}>{p.name}</div>
                        }
                      </div>
                      <h3 style={S.partnerName}>{p.fullName}</h3>
                      <p style={S.partnerDesc}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section style={S.section}>
                <div className="abt-agree-banner" style={S.agreeBanner}>
                  <div style={S.agreeBannerLeft}>
                    <div style={S.agreeCertIcon}>✓</div>
                    <div>
                      <h3 style={S.agreeTitle}>Cabinet de formation agréé par l'État</h3>
                      <p style={S.agreeDesc}>
                        Nos certifications de fin de formation sont officiellement reconnues par le Ministère
                        de l'Emploi et de la Formation Professionnelle de Côte d'Ivoire. Chaque apprenant
                        reçoit un certificat à valeur légale attestant de ses compétences acquises.
                      </p>
                      <div style={S.agreeSignature}>Binnie's English Training</div>
                    </div>
                  </div>
                  <div style={S.agreeBannerRight}>
                    <div style={S.agreeOrb1} />
                    <div style={S.agreeIconGrid}>
                      {["📜","🏛️","✅","🌍","⭐","🏆"].map((ico, i) => (
                        <div key={i} style={S.agreeIco}>{ico}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ────────────────────────────────── */}
        <aside className="abt-sidebar" style={{ ...S.sidebar, top: stickyBar ? 80 : 20 }}>
          <div style={S.sideCard}>
            <div style={S.sideCardTop}>
              <div style={{ fontSize:"1.8rem", marginBottom:10 }}>💬</div>
              <p style={{ color:"rgba(255,255,255,.75)", fontSize:".82rem", margin:"0 0 4px" }}>Vous avez une question ?</p>
              <p style={{ color:"#fff", fontFamily:"'DM Sans','Segoe UI',sans-serif", fontSize:"1.1rem", margin:0, lineHeight:1.3 }}>Notre équipe est disponible 7j/7</p>
            </div>
            <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
              <button style={S.sideBtn1}
                onMouseEnter={e => e.currentTarget.style.background="#b91c1c"}
                onMouseLeave={e => e.currentTarget.style.background="#dc2626"}
                onClick={() => navigate("/contact")}>
                ✉️ Nous écrire
              </button>
              <button style={S.sideBtn2}
                onMouseEnter={e => { e.currentTarget.style.background="#dc2626"; e.currentTarget.style.color="#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#dc2626"; }}
                onClick={() => navigate("/contact")}>
                📞 Nous appeler
              </button>
            </div>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   STYLES (inchangés)
════════════════════════════════════════════════════════ */
const FF = "'DM Sans','Segoe UI',sans-serif";
const FD = "''DM Sans','Segoe UI',sans-serif";

const S = {
  page:        { fontFamily:FF, color:"#0f172a", background:"#fff", minHeight:"100vh", overflowX:"hidden" },

  /* HERO */
  hero:        { background:"linear-gradient(135deg,#0f172a 0%,#1e2a4a 55%,#1e3a8a 100%)", padding:"52px 0 48px", position:"relative", overflow:"hidden" },
  heroOrb1:    { position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(220,38,38,.12)", top:-100, right:-80, pointerEvents:"none" },
  heroOrb2:    { position:"absolute", width:280, height:280, borderRadius:"50%", background:"rgba(30,58,138,.25)", bottom:-80, left:-60, pointerEvents:"none" },
  heroOrb3:    { position:"absolute", width:200, height:200, borderRadius:"50%", background:"rgba(220,38,38,.08)", top:"30%", left:"40%", pointerEvents:"none" },
  heroInner:   { maxWidth:1180, margin:"0 auto", padding:"0 24px", position:"relative", zIndex:1 },
  breadcrumb:  { display:"flex", alignItems:"center", gap:8, marginBottom:24, fontSize:".82rem", flexWrap:"wrap" },
  breadLink:   { color:"rgba(255,255,255,.6)", cursor:"pointer", textDecoration:"underline" },
  breadSep:    { color:"rgba(255,255,255,.3)" },
  heroLayout:  { display:"grid", gridTemplateColumns:"1fr 300px", gap:48, alignItems:"center" },
  heroLeft:    {},
  heroBadgeRow:{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" },
  heroBadgeRed:{ background:"rgba(220,38,38,.25)", border:"1px solid rgba(220,38,38,.5)", color:"#fca5a5", borderRadius:999, padding:"4px 14px", fontSize:".72rem", fontWeight:800, letterSpacing:".05em" },
  heroBadgeBlue:{ background:"rgba(30,58,138,.3)", border:"1px solid rgba(30,58,138,.6)", color:"#93c5fd", borderRadius:999, padding:"4px 14px", fontSize:".72rem", fontWeight:800 },
  heroTitle:   { fontFamily:FD, fontSize:"clamp(2.2rem,5vw,3.8rem)", color:"#fff", margin:"0 0 10px", fontWeight:400, lineHeight:1.08 },
  heroTitleAccent:{ color:"#f87171", fontStyle:"italic" },
  heroTagline: { color:"rgba(255,255,255,.9)", fontSize:"1.15rem", fontWeight:600, margin:"0 0 14px", letterSpacing:".01em" },
  heroDesc:    { color:"rgba(255,255,255,.7)", fontSize:".95rem", lineHeight:1.7, margin:"0 0 28px", maxWidth:540 },
  heroQuickStats:{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:14, padding:"18px 16px" },
  heroQuickStat:{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 },
  heroQuickNum:{ fontFamily:FD, fontSize:"1.5rem", lineHeight:1 },
  heroQuickLbl:{ fontSize:".68rem", color:"rgba(255,255,255,.55)", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", textAlign:"center" },
  heroCtas:    { display:"flex", gap:12, flexWrap:"wrap" },
  heroBtnRed:  { background:"#1e3a8a", color:"#fff", border:"none", borderRadius:999, padding:"12px 26px", fontSize:".94rem", fontWeight:800, cursor:"pointer", transition:"background .2s", boxShadow:"0 6px 20px rgba(220,38,38,.35)" },
  heroBtnBlue: { background:"#1e3a8a", color:"#fff", border:"none", borderRadius:999, padding:"12px 24px", fontSize:".9rem", fontWeight:700, cursor:"pointer", transition:"background .2s" },
  heroRight:   { display:"flex", flexDirection:"column", alignItems:"center", gap:16 },
  heroLogoCard:{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:20, padding:"24px", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)", position:"relative", overflow:"hidden" },
  heroLogo:    { width:"100%", maxWidth:220, objectFit:"contain", filter:"drop-shadow(0 8px 20px rgba(0,0,0,.3))", animation:"abtPulse 4s ease infinite" },
  heroLogoGlow:{ position:"absolute", inset:0, background:"radial-gradient(circle at 50% 50%, rgba(220,38,38,.1), transparent 70%)", pointerEvents:"none" },
  heroAgreeBadge:{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, width:"100%" },

  /* TABS */
  tabsBar:     { background:"#fff", borderBottom:"1px solid #e2e8f0", position:"relative", zIndex:50 },
  tabsSticky:  { position:"sticky", top:0, boxShadow:"0 2px 8px rgba(0,0,0,.06)" },
  tabsInner:   { maxWidth:1180, margin:"0 auto", padding:"0 24px", display:"flex", overflowX:"auto" },
  tabBtn:      { background:"none", border:"none", borderBottom:"3px solid transparent", padding:"14px 18px", fontSize:".88rem", fontWeight:600, color:"#64748b", cursor:"pointer", whiteSpace:"nowrap", transition:"all .2s", fontFamily:FF },
  tabActive:   { color:"#dc2626", borderBottomColor:"#dc2626" },

  /* LAYOUT */
  layout:      { maxWidth:1180, margin:"0 auto", padding:"40px 24px", display:"grid", gridTemplateColumns:"1fr 280px", gap:40, alignItems:"start" },
  contentCol:  { minWidth:0 },
  section:     { marginBottom:44, paddingBottom:40, borderBottom:"1px solid #f1f5f9" },
  sH2:         { fontFamily:FD, fontSize:"1.5rem", fontWeight:400, margin:"0 0 8px", color:"#0f172a" },
  descP:       { fontSize:".95rem", color:"#475569", lineHeight:1.75, margin:"0 0 14px" },

  /* INTRO */
  introSplit:  { display:"grid", gridTemplateColumns:"1fr 280px", gap:32, alignItems:"start" },
  introText:   {},
  introCard:   {borderRadius:16, overflow:"hidden"},
  introCardTop:{ padding:"24px", display:"flex", alignItems:"center", justifyContent:"center", height:140 },
  introCardLogo:{ width:180, background:"rgba(255,255,255,.95)", borderRadius:10, padding:"10px 14px" },
  introBadge:  { background:"linear-gradient(135deg,#dc2626,#1e3a8a)", padding:"14px 16px", display:"flex", alignItems:"center", gap:12 },
  introBadgeIcon:{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:".8rem", flexShrink:0 },

  /* TIMELINE */
  timeline:    { display:"flex", flexDirection:"column", gap:0 },
  tlRow:       { display:"grid", gridTemplateColumns:"80px 1fr", gap:20, alignItems:"start" },
  tlLeft:      { display:"flex", flexDirection:"column", alignItems:"center" },
  tlYearBubble:{ width:60, height:60, borderRadius:"50%", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FD, fontSize:".95rem", fontWeight:400, flexShrink:0, boxShadow:"0 4px 14px rgba(0,0,0,.2)" },
  tlLine:      { width:2, flex:1, minHeight:24, background:"linear-gradient(180deg,#dc2626,#1e3a8a)", margin:"4px auto 0", opacity:.3 },
  tlCard:      { background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"16px 18px", marginBottom:20 },
  tlTitle:     { fontFamily:FD, fontSize:"1.1rem", margin:"0 0 6px", fontWeight:400 },
  tlDesc:      { fontSize:".88rem", color:"#64748b", lineHeight:1.6, margin:0 },

  /* PHILOSOPHY */
  philoGrid:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 },
  philoCard:   { border:"1.5px solid #e2e8f0", borderRadius:16, padding:"22px 18px", cursor:"default", display:"flex", flexDirection:"column", gap:12 },
  philoIconWrap:{ width:48, height:48, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" },
  philoIcon:   { fontSize:"1.5rem" },
  philoTitle:  { fontFamily:FD, fontSize:"1.2rem", margin:0, fontWeight:400, transition:"color .2s" },
  philoDesc:   { fontSize:".88rem", color:"#64748b", lineHeight:1.65, margin:0 },
  philoLink:   { fontSize:".84rem", fontWeight:700 },

  /* METHOD */
  methodGrid:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 },
  methodCard:  { border:"1px solid #e2e8f0", borderRadius:14, padding:"20px 16px", cursor:"default" },
  methodNum:   { width:44, height:44, borderRadius:"50%", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FD, fontSize:"1.1rem", marginBottom:12 },
  methodTitle: { fontFamily:FD, fontSize:"1.1rem", margin:"0 0 8px", fontWeight:400 },
  methodDesc:  { fontSize:".86rem", color:"#64748b", lineHeight:1.6, margin:0 },

  /* TEAM */
  teamGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:18 },
  teamCard:    { background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"24px 18px", textAlign:"center", cursor:"default" },
  teamAv:      { width:60, height:60, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", margin:"0 auto 14px" },
  teamName:    { fontFamily:FD, fontSize:"1.1rem", margin:"0 0 4px", fontWeight:400 },
  teamRole:    { fontSize:".8rem", color:"#64748b", margin:"0 0 10px" },
  teamCert:    { background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, padding:"5px 10px", fontSize:".72rem", fontWeight:600, color:"#475569", marginBottom:10 },
  teamExp:     { display:"inline-block", borderRadius:999, padding:"4px 12px", fontSize:".74rem", fontWeight:800 },

  /* JOIN */
  joinBanner:  { background:"linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius:18, padding:"36px 32px", display:"flex", alignItems:"center", gap:32, position:"relative", overflow:"hidden" },
  joinOrb:     { position:"absolute", width:300, height:300, borderRadius:"50%", background:"rgba(220,38,38,.1)", top:-100, right:-80, pointerEvents:"none" },
  joinLeft:    { flex:1, position:"relative", zIndex:1 },
  joinTitle:   { fontFamily:FD, fontSize:"1.5rem", color:"#fff", margin:"0 0 10px", fontWeight:400 },
  joinDesc:    { color:"rgba(255,255,255,.7)", fontSize:".9rem", lineHeight:1.65, margin:"0 0 20px" },
  joinBtn:     { background:"#fff", color:"#1e3a8a", border:"none", borderRadius:999, padding:"10px 24px", fontFamily:FF, fontWeight:800, fontSize:".9rem", cursor:"pointer", transition:"background .2s, color .2s" },
  joinIcons:   { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, position:"relative", zIndex:1 },
  joinIconBubble:{ width:48, height:48, borderRadius:12, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem" },

  /* PARTNERS */
  partnersGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:18 },
  partnerCard: { border:"1.5px solid #e2e8f0", borderRadius:16, padding:"22px 18px", background:"#fff", cursor:"default" },
  partnerBadge:{ display:"inline-block", background:"linear-gradient(135deg,#dc2626,#1e3a8a)", color:"#fff", borderRadius:999, padding:"3px 12px", fontSize:".66rem", fontWeight:800, letterSpacing:".06em", marginBottom:14 },
  partnerLogoArea:{ height:60, display:"flex", alignItems:"center", justifyContent:"flex-start", marginBottom:14 },
  partnerNameBig:{ fontFamily:FD, fontSize:"1.8rem", color:"#0f172a" },
  partnerName: { fontWeight:800, fontSize:".9rem", margin:"0 0 8px", color:"#0f172a" },
  partnerDesc: { fontSize:".84rem", color:"#64748b", lineHeight:1.6, margin:0 },

  /* AGRÉE */
  agreeBanner: { background:"linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius:18, overflow:"hidden", display:"flex" },
  agreeBannerLeft:{ flex:1, padding:"36px 32px", display:"flex", alignItems:"flex-start", gap:20 },
  agreeCertIcon:{ width:56, height:56, borderRadius:"50%", background:"rgba(255,255,255,.15)", border:"2px solid rgba(255,255,255,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", fontWeight:800, color:"#fff", flexShrink:0 },
  agreeTitle:  { fontFamily:FD, fontSize:"1.4rem", color:"#fff", margin:"0 0 12px", fontWeight:400 },
  agreeDesc:   { color:"rgba(255,255,255,.7)", fontSize:".9rem", lineHeight:1.7, margin:"0 0 16px" },
  agreeSignature:{ fontFamily:FD, fontSize:"1.3rem", color:"#f87171", fontStyle:"italic" },
  agreeBannerRight:{ width:220, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" },
  agreeOrb1:   { position:"absolute", inset:0, background:"rgba(220,38,38,.1)", borderRadius:999 },
  agreeIconGrid:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, position:"relative", zIndex:1 },
  agreeIco:    { width:44, height:44, borderRadius:10, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem" },

  /* STATS */
  statsGrid:   { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18 },
  statCard:    { border:"1.5px solid", borderRadius:16, padding:"24px 18px", textAlign:"center", cursor:"default" },
  statIcon:    { width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", margin:"0 auto 14px" },
  statNum:     { fontFamily:FD, fontSize:"2.2rem", lineHeight:1, marginBottom:6 },
  statLabel:   { fontSize:".76rem", color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" },

  /* CENTERS */
  centersGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 },
  centerCard:  { background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" },
  centerDot:   { width:10, height:10, borderRadius:"50%", flexShrink:0 },
  centerStatus:{ marginLeft:"auto", borderRadius:999, padding:"3px 12px", fontSize:".72rem", fontWeight:800, whiteSpace:"nowrap", flexShrink:0 },

  /* SIDEBAR */
  sidebar:     { position:"sticky", alignSelf:"start", transition:"top .3s", display:"flex", flexDirection:"column", gap:16 },
  sideCard:    { background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,.07)" },
  sideCardTop: { background:"#1e3a8a", padding:"22px 18px", textAlign:"center" },
  sideBtn1:    { display:"block", width:"100%", padding:"12px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:999, fontFamily:FF, fontWeight:800, fontSize:".9rem", cursor:"pointer", transition:"background .2s" },
  sideBtn2:    { display:"block", width:"100%", padding:"11px", background:"transparent", color:"#dc2626", border:"1.5px solid #dc2626", borderRadius:999, fontFamily:FF, fontWeight:700, fontSize:".86rem", cursor:"pointer", transition:"all .2s", textAlign:"center" },
  sideFactCard:{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"18px 16px", boxShadow:"0 2px 10px rgba(0,0,0,.05)" },
  factRow:     { display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom:"1px solid #f8fafc" },
  sideTestCard:{ background:"linear-gradient(135deg,#dc2626,#1e3a8a)", borderRadius:14, padding:"20px 16px", textAlign:"center" },
  sideTestBtn: { background:"#f59e0b", color:"#000", border:"none", borderRadius:999, padding:"10px 20px", fontFamily:FF, fontWeight:800, fontSize:".88rem", cursor:"pointer", transition:"background .2s", width:"100%" },
};

export default About;