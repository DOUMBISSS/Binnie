import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { getUTM } from "../../utils/utm";
import Footer from "../Footer/Footer";

/* ── Fonts & animations ─────────────────────────────── */
if (!document.querySelector("#me-fonts")) {
  const l = document.createElement("link"); l.id = "me-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap";
  document.head.appendChild(l);
}
if (!document.querySelector("#me-kf")) {
  const s = document.createElement("style"); s.id = "me-kf";
  s.textContent = `
    @keyframes meFU { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes meSpin { to{transform:rotate(360deg)} }
    .me-tab-btn:hover { color:#1e3a8a !important; }
    .me-card-hov:hover { transform:translateY(-3px); box-shadow:0 12px 24px rgba(0,0,0,.1) !important; }
    .me-inp:focus { border-color:#1e3a8a !important; outline:none; }
    @media(max-width:768px){
      .me-tabs { overflow-x:auto; -webkit-overflow-scrolling:touch; }
      .me-tab-btn { padding:10px 14px !important; font-size:.8rem !important; white-space:nowrap; }
      .me-two-col { grid-template-columns:1fr !important; }
      .me-catalog-grid { grid-template-columns:1fr !important; }
      .me-score-row { flex-direction:column !important; gap:12px !important; }
    }
  `;
  document.head.appendChild(s);
}

const FF = "'Montserrat','Segoe UI',sans-serif";
const API = "http://localhost:5001";

const COM_COLORS = ["#7c3aed","#0891b2","#dc2626","#1e3a8a","#d97706","#059669","#0f766e","#b45309"];

/* ══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════ */
const MonEspace = () => {
  const navigate = useNavigate();
  const [user,         setUser]        = useState(null);
  const [session,      setSession]     = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [activeTab,    setActiveTab]   = useState("test");
  const [prospectInfo, setProspectInfo] = useState({ is_apprenant: false, centre: null, commercial: null });

  /* ── Auth : session Supabase (Google + email/password) ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { navigate("/"); return; }
      setSession(s);
      const meta = s.user.user_metadata || {};
      const fullName =
        (meta.nom && meta.prenom) ? `${meta.nom} ${meta.prenom}`
        : meta.full_name || s.user.email.split("@")[0];
      const resolvedRole = meta.role || "prospect";
      setUser({ ...s.user, displayName: fullName, role: resolvedRole });
      // Charger les infos prospect (centre, statut apprenant, commercial)
      fetch(`${API}/api/auth/prospect-info?email=${encodeURIComponent(s.user.email)}`)
        .then(r => r.ok ? r.json() : {})
        .then(info => { if (info) setProspectInfo(info); })
        .catch(() => {})
        .finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) return (
    <div style={S.page}>
      <div style={{ textAlign:"center", padding:"80px 24px" }}>
        <div style={{ width:36, height:36, border:"3px solid #e2e8f0", borderTopColor:"#1e3a8a", borderRadius:"50%", animation:"meSpin .8s linear infinite", margin:"0 auto 16px" }} />
        <p style={{ color:"#64748b" }}>Chargement de votre espace…</p>
      </div>
    </div>
  );
  if (!user) return null;

  /* ── Rôle : "prospect" → vue prospect, sinon → vue apprenant ── */
  const isProspect = user.role === "prospect" && !prospectInfo.is_apprenant;

  return (
    <div style={S.page}>

      {/* ── HEADER ── */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", justifyContent:"space-between" }}>
            <div>
              {isProspect && (
                <span style={S.prospectBadge}>🔍 Compte Prospect</span>
              )}
              <h1 style={S.headerTitle}>Mon espace</h1>
              <p style={S.headerSub}>Bonjour, {user.displayName} 👋</p>
            </div>
            <button style={S.logoutBtnHeader} onClick={handleLogout}>
              ← Se déconnecter
            </button>
          </div>
        </div>
        <svg viewBox="0 0 1440 48" style={{ display:"block", width:"100%", lineHeight:0 }} preserveAspectRatio="none">
          <path fill="#f8fafc" d="M0,24 C480,48 960,0 1440,24 L1440,48 L0,48 Z" />
        </svg>
      </div>

      <div style={S.container}>
        {isProspect ? (
          <ProspectView
            user={user}
            session={session}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            prospectInfo={prospectInfo}
          />
        ) : (
          <ApprenantView user={user} session={session} prospectInfo={prospectInfo} />
        )}
      </div>

      <Footer />
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   VUE PROSPECT
══════════════════════════════════════════════════════ */
const ProspectView = ({ user, session, activeTab, setActiveTab, prospectInfo }) => {
  const TABS = [
    { id:"test",       label:"📊 Mon test de niveau" },
    { id:"conseiller", label:"🤝 Conseillère & Contact" },
    { id:"catalogue",  label:"📚 Catalogue formations" },
    { id:"profil",     label:"👤 Mon profil" },
    { id:"parametres", label:"⚙️ Paramètres" },
  ];

  return (
    <>
      {/* Bandeau apprenant si statut changé */}
      {prospectInfo.is_apprenant && (
        <div style={{ background:"linear-gradient(135deg,#059669,#0891b2)", borderRadius:14, padding:"16px 22px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:"1.6rem" }}>🎓</span>
            <div>
              <div style={{ fontWeight:800, color:"#fff", fontSize:".95rem" }}>Félicitations ! Vous êtes maintenant Apprenant BET</div>
              <div style={{ color:"rgba(255,255,255,.8)", fontSize:".82rem", marginTop:2 }}>Accédez à vos cours en ligne dès maintenant.</div>
            </div>
          </div>
          <a href="https://app.betlanguages.com" target="_blank" rel="noreferrer">
            <button style={{ background:"#fff", color:"#059669", border:"none", borderRadius:999, padding:"9px 20px", fontWeight:800, fontSize:".84rem", cursor:"pointer", whiteSpace:"nowrap" }}>
              Accéder à mon espace →
            </button>
          </a>
        </div>
      )}

      {/* Bandeau CTA upgrade */}
      <div style={S.upgradeBanner}>
        <div>
          <strong style={{ color:"#1e3a8a" }}>Devenez apprenant BET</strong>
          <span style={{ color:"#475569", fontSize:".85rem", marginLeft:10 }}>
            Accédez à vos cours, certifications et suivi personnalisé.
          </span>
        </div>
        <Link to="/parcours/particulier">
          <button style={S.upgradeBtn}>S'inscrire maintenant →</button>
        </Link>
      </div>

      {/* Onglets */}
      <div className="me-tabs" style={S.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className="me-tab-btn"
            style={{ ...S.tabBtn, ...(activeTab === t.id ? S.tabActive : {}) }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ animation:"meFU .4s ease" }}>
        {activeTab === "test"        && <TabTestNiveau user={user} />}
        {activeTab === "conseiller"  && <TabConseillereContact user={user} />}
        {activeTab === "catalogue"   && <TabCatalogue />}
        {activeTab === "profil"      && <TabProfil user={user} prospectInfo={prospectInfo} />}
        {activeTab === "parametres"  && <TabParametres user={user} />}
      </div>
    </>
  );
};

/* ── Mini-sondage "Comment nous avez-vous connu ?" ────── */
const SOURCES = [
  { key:"Bouche à oreille",       icon:"🗣️" },
  { key:"Facebook / Instagram",   icon:"📱" },
  { key:"LinkedIn",               icon:"💼" },
  { key:"Google / Recherche web", icon:"🔍" },
  { key:"Radio / Télévision",     icon:"📺" },
  { key:"Affichage / Flyers",     icon:"📋" },
  { key:"Recommandé par un ami",  icon:"👫" },
  { key:"Recommandé par mon entreprise", icon:"🏢" },
  { key:"Autre",                  icon:"✏️" },
];

const SondageCard = ({ user }) => {
  const [answered,     setAnswered]     = useState(null); // null=chargement, false=pas répondu, true=répondu
  const [selected,     setSelected]     = useState("");
  const [detail,       setDetail]       = useState("");
  const [saving,       setSaving]       = useState(false);
  const [done,         setDone]         = useState(false);

  useEffect(() => {
    fetch(`${API}/api/sondage/check?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => setAnswered(d.answered))
      .catch(() => setAnswered(false));
  }, [user.email]);

  const handleSubmit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const commercialId = user.user_metadata?.commercial_id || null;
      const utm = getUTM();
      const res = await fetch(`${API}/api/sondage/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:          user.email,
          commercial_id:  commercialId,
          source:         selected,
          source_detail:  selected === "Autre" ? detail : null,
          utm_source:     utm?.source   || null,
          utm_medium:     utm?.medium   || null,
          utm_campaign:   utm?.campaign || null,
        }),
      });
      const d = await res.json();
      if (d.already || res.ok) { setAnswered(true); setDone(true); }
    } catch { /* silently fail */ }
    setSaving(false);
  };

  if (answered === null) return null; // chargement silencieux
  if (answered) return (
    <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:14, padding:"18px 22px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
      <span style={{ fontSize:"1.4rem" }}>✅</span>
      <div>
        <div style={{ fontWeight:700, color:"#166534", fontSize:".9rem" }}>Merci pour votre réponse !</div>
        <div style={{ color:"#4ade80", fontSize:".78rem" }}>Votre retour nous aide à améliorer nos services.</div>
      </div>
    </div>
  );

  return (
    <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"22px 24px", marginBottom:20, boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <span style={{ fontSize:"1.4rem" }}>🎯</span>
        <div>
          <div style={{ fontWeight:800, color:"#0f172a", fontSize:".95rem" }}>Comment avez-vous connu BET ?</div>
          <div style={{ color:"#64748b", fontSize:".78rem" }}>Sondage rapide — 1 question, 10 secondes</div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
        {SOURCES.map(s => (
          <button key={s.key} onClick={() => setSelected(s.key)} style={{
            display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
            borderRadius:10, border:`2px solid ${selected === s.key ? "#1e3a8a" : "#e2e8f0"}`,
            background: selected === s.key ? "#eff6ff" : "#f8fafc",
            color: selected === s.key ? "#1e3a8a" : "#475569",
            fontWeight: selected === s.key ? 700 : 500,
            fontSize:".82rem", cursor:"pointer", textAlign:"left", transition:"all .15s",
          }}>
            <span>{s.icon}</span> {s.key}
          </button>
        ))}
      </div>
      {selected === "Autre" && (
        <input
          value={detail}
          onChange={e => setDetail(e.target.value)}
          placeholder="Précisez..."
          style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1.5px solid #cbd5e1", fontSize:".85rem", marginBottom:12, boxSizing:"border-box" }}
        />
      )}
      <button
        onClick={handleSubmit}
        disabled={!selected || saving}
        style={{ padding:"10px 24px", background: selected ? "#1e3a8a" : "#cbd5e1", color:"#fff", border:"none", borderRadius:10, fontWeight:700, fontSize:".88rem", cursor: selected ? "pointer" : "not-allowed", transition:"background .2s" }}
      >
        {saving ? "Envoi…" : "Envoyer ma réponse →"}
      </button>
    </div>
  );
};

/* ── Onglet 1 : Résultat test de niveau ───────────────── */
const TabTestNiveau = ({ user }) => {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/level-test/result?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => { setResult(d.result || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.email]);

  const LEVEL_COLOR = {
    "A1":"#94a3b8","A2":"#64748b","B1":"#3b82f6","B2":"#1e3a8a","C1":"#7c3aed","C2":"#059669",
  };

  if (loading) return <Loader />;

  if (!result) return (
    <div style={S.emptyCard}>
      <div style={{ fontSize:"3rem", marginBottom:16 }}>📝</div>
      <h3 style={S.emptyTitle}>Aucun test effectué</h3>
      <p style={{ color:"#64748b", marginBottom:24 }}>
        Passez notre test de niveau gratuit pour connaître votre niveau d'anglais (CECRL).
      </p>
      <Link to="/test-niveau">
        <button style={S.ctaBtn}>Passer le test gratuit →</button>
      </Link>
    </div>
  );

  const pct = Math.round((result.points_earned / result.points_total) * 100);
  const color = LEVEL_COLOR[result.level] || "#1e3a8a";

  return (
    <div style={{ maxWidth:700, margin:"0 auto" }}>
      {/* Badge niveau */}
      <div style={{ ...S.levelCard, borderColor: color }}>
        <div style={{ ...S.levelBadge, background: color }}>
          {result.level}
        </div>
        <div>
          <p style={{ color:"#64748b", fontSize:".8rem", margin:0 }}>Votre niveau CECRL</p>
          <h2 style={{ margin:"4px 0 0", fontFamily:FF, fontWeight:800, color:"#0f172a", fontSize:"1.5rem" }}>
            {LEVEL_LABELS[result.level] || result.level}
          </h2>
          <p style={{ color:"#64748b", fontSize:".82rem", marginTop:4 }}>
            Test passé le {new Date(result.submitted_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
          </p>
        </div>
      </div>

      {/* Score */}
      <div style={S.scoreCard}>
        <h4 style={S.cardTitle}>Score détaillé</h4>
        <div className="me-score-row" style={{ display:"flex", gap:24, marginBottom:20 }}>
          {[
            { label:"Score",      val:`${pct}%`,                        color },
            { label:"Points",     val:`${result.points_earned} / ${result.points_total}`, color:"#0891b2" },
            { label:"Réponses",   val:`${result.correct_answers} / ${result.total_questions}`, color:"#10b981" },
          ].map((s, i) => (
            <div key={i} style={{ flex:1, background:"#f8fafc", borderRadius:12, padding:"16px", textAlign:"center", border:`1.5px solid ${s.color}20` }}>
              <div style={{ fontSize:"1.6rem", fontWeight:800, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:".75rem", color:"#64748b", fontWeight:600, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Barre de progression */}
        <div style={{ background:"#f1f5f9", borderRadius:999, height:10, overflow:"hidden", marginBottom:20 }}>
          <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg,${color},${color}aa)`, borderRadius:999, transition:"width 1s ease" }} />
        </div>

        {/* Par catégorie */}
        {result.by_category && Object.keys(result.by_category).length > 0 && (
          <>
            <h5 style={{ fontSize:".82rem", fontWeight:800, color:"#0f172a", margin:"0 0 12px" }}>Par compétence</h5>
            {Object.entries(result.by_category).map(([cat, data]) => {
              const catPct = Math.round((data.correct / data.total) * 100);
              return (
                <div key={cat} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:".8rem", color:"#475569", marginBottom:4 }}>
                    <span style={{ fontWeight:600 }}>{cat}</span>
                    <span>{data.correct}/{data.total} ({catPct}%)</span>
                  </div>
                  <div style={{ background:"#f1f5f9", borderRadius:999, height:7, overflow:"hidden" }}>
                    <div style={{ width:`${catPct}%`, height:"100%", background:color, borderRadius:999 }} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Sondage "Comment nous avez-vous connu ?" */}
      <SondageCard user={user} />

      {/* CTA */}
      <div style={{ ...S.scoreCard, background:"linear-gradient(135deg,#0f172a,#1e3a8a)", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,.8)", fontSize:".9rem", marginBottom:16 }}>
          Prêt à passer au niveau supérieur ? Nos coachs certifiés vous accompagnent.
        </p>
        <Link to="/parcours/particulier">
          <button style={{ ...S.ctaBtn, background:"#dc2626" }}>Démarrer ma formation →</button>
        </Link>
      </div>
    </div>
  );
};

const LEVEL_LABELS = {
  A1:"Débutant (A1)", A2:"Élémentaire (A2)",
  B1:"Intermédiaire (B1)", B2:"Intermédiaire avancé (B2)",
  C1:"Avancé (C1)", C2:"Maîtrise (C2)",
};

/* ── Onglet 2 : Mon conseiller(ère) ──────────────────── */
const BET_CENTRES = [
  { id:"angre",     label:"BET Angré",       ville:"Abidjan" },
  { id:"2plateaux", label:"BET II Plateaux",  ville:"Abidjan" },
  { id:"yopougon",  label:"BET Yopougon",    ville:"Abidjan" },
  { id:"koumassi",  label:"BET Koumassi",    ville:"Abidjan" },
  { id:"abatta",    label:"BET Abatta",      ville:"Abidjan" },
  { id:"bouake",    label:"BET Bouaké",      ville:"Bouaké"  },
];

const TabConseiller = ({ user, onSelected }) => {
  const [commerciaux,  setCommerciaux]  = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState("");
  const [centreChoisi, setCentreChoisi] = useState("");
  const [selectedId,   setSelectedId]   = useState(
    user.user_metadata?.commercial_id || ""
  );
  const alreadyAssigned = !!user.user_metadata?.commercial_id;
  const [showGrid,     setShowGrid]     = useState(!alreadyAssigned);

  // Charger les conseillères du centre sélectionné
  useEffect(() => {
    if (!centreChoisi) { setCommerciaux([]); return; }
    setLoading(true);
    fetch(`${API}/api/level-test/commerciaux?centre_id=${encodeURIComponent(centreChoisi)}`)
      .then(r => r.json())
      .then(d => { setCommerciaux(d.commerciaux || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [centreChoisi]);

  const assigned = commerciaux.find(c => c.id === selectedId);

  const initiales = (c) =>
    ((c.prenom?.[0] || "") + (c.nom?.[0] || "")).toUpperCase() || "?";

  const handleSelect = async (id) => {
    setSaving(true); setError(""); setSaved(false);
    try {
      // 1. Sauvegarder dans Supabase user_metadata
      const { error: supaErr } = await supabase.auth.updateUser({
        data: { commercial_id: id },
      });
      if (supaErr) throw supaErr;

      // 2. Sauvegarder dans la DB (level_test_results)
      const res = await fetch(`${API}/api/level-test/assign-commercial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_email: user.email, commercial_id: id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Erreur serveur");
      }

      setSelectedId(id);
      setShowGrid(false);
      setSaved(true);
      if (onSelected) onSelected(id);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setError(e.message || "Impossible d'enregistrer. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Bandeau intro */}
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius:16, padding:"24px 28px", marginBottom:24, color:"#fff" }}>
        <div style={{ fontSize:"1.8rem", marginBottom:8 }}>🤝</div>
        <h2 style={{ fontFamily:FF, fontWeight:800, margin:"0 0 8px", fontSize:"1.2rem" }}>Votre conseiller(ère) personnel(le) BET</h2>
        <p style={{ color:"rgba(255,255,255,.75)", fontSize:".88rem", lineHeight:1.6, margin:0 }}>
          Choisissez la conseillère qui vous accompagnera tout au long de votre parcours chez BET Languages —
          de la première prise de contact jusqu'à l'obtention de votre certification.
        </p>
      </div>

      {/* Conseillère assignée */}
      {assigned && !showGrid ? (
        <div style={S.scoreCard}>
          <h3 style={{ ...S.cardTitle, marginBottom:16 }}>✅ Votre conseillère attitrée</h3>
          <div style={{ display:"flex", alignItems:"center", gap:16, padding:"16px", background:"#f5f3ff", borderRadius:12, border:"1.5px solid #c4b5fd", marginBottom:16 }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${COM_COLORS[commerciaux.indexOf(assigned) % COM_COLORS.length]},${COM_COLORS[commerciaux.indexOf(assigned) % COM_COLORS.length]}aa)`, color:"#fff", fontWeight:800, fontSize:".9rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {initiales(assigned)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, color:"#0f172a", fontSize:"1rem" }}>{assigned.prenom} {assigned.nom}</div>
              <div style={{ color:"#7c3aed", fontSize:".82rem", fontWeight:600, marginTop:2 }}>Conseiller(ère) BET Languages</div>
              {assigned.telephone && (
                <a href={`tel:${assigned.telephone}`} style={{ color:"#0891b2", fontSize:".8rem", marginTop:4, display:"block", textDecoration:"none" }}>📞 {assigned.telephone}</a>
              )}
              <div style={{ color:"#64748b", fontSize:".76rem", marginTop:6, lineHeight:1.5 }}>
                Cette personne est votre référente unique. Elle connaît votre profil, votre niveau et vos objectifs. Contactez-la directement pour toute question.
              </div>
            </div>
          </div>
          {/* Mention verrouillage */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 16px", background:"#fefce8", borderRadius:10, border:"1px solid #fde68a", marginTop:4 }}>
            <span style={{ fontSize:"1.1rem", flexShrink:0 }}>🔒</span>
            <p style={{ margin:0, fontSize:".78rem", color:"#92400e", lineHeight:1.6 }}>
              Ce choix est définitif et ne peut être modifié en ligne. Pour tout changement de conseiller(ère), veuillez vous rendre directement dans l'un de nos centres BET Languages.
            </p>
          </div>
        </div>
      ) : (
        <div style={S.scoreCard}>
          <h3 style={{ ...S.cardTitle, marginBottom:6 }}>Choisissez votre conseiller(ère)</h3>

          {/* Étape 1 : sélection du centre */}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:".78rem", fontWeight:700, color:"#0f172a", marginBottom:8 }}>
              🏢 Étape 1 — Choisissez votre centre BET
            </label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {BET_CENTRES.map(c => (
                <button key={c.id} onClick={() => { setCentreChoisi(c.id); setSelectedId(""); }}
                  style={{ padding:"10px 12px", borderRadius:10, border:`2px solid ${centreChoisi===c.id?"#1e3a8a":"#e2e8f0"}`,
                    background: centreChoisi===c.id?"#eff6ff":"#f8fafc", cursor:"pointer", textAlign:"left",
                    color: centreChoisi===c.id?"#1e3a8a":"#475569", fontWeight: centreChoisi===c.id?700:500, fontSize:".82rem" }}>
                  <div style={{ fontWeight:700 }}>{c.label}</div>
                  <div style={{ fontSize:".72rem", opacity:.7 }}>{c.ville}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Étape 2 : liste des conseillères du centre */}
          {centreChoisi && (
            <>
              <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:16, marginBottom:12 }}>
                <label style={{ fontSize:".78rem", fontWeight:700, color:"#0f172a" }}>
                  🤝 Étape 2 — Choisissez votre conseillère
                </label>
              </div>
              <p style={{ color:"#64748b", fontSize:".85rem", lineHeight:1.6, marginBottom:16 }}>
                {loading ? "Chargement…" : commerciaux.length === 0
                  ? "Aucune conseillère disponible pour ce centre. Contactez-nous directement."
                  : "Sélectionnez la personne qui vous accompagnera. Ce choix est définitif."}
              </p>
            </>
          )}

          <p style={{ color:"#64748b", fontSize:".85rem", lineHeight:1.6, marginBottom:20, display: centreChoisi ? "none" : "block" }}>
            {""}
          </p>
          <div style={{ display: centreChoisi ? "flex" : "none", flexDirection:"column", gap:10 }}>
            {commerciaux.map((c, i) => {
              const color = COM_COLORS[i % COM_COLORS.length];
              const isSelected = selectedId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => !saving && handleSelect(c.id)}
                  style={{
                    display:"flex", alignItems:"center", gap:14,
                    padding:"14px 16px", borderRadius:12,
                    border:`1.5px solid ${isSelected ? color : "#e2e8f0"}`,
                    background: isSelected ? color + "0e" : "#fff",
                    cursor: saving ? "wait" : "pointer",
                    transition:"all .18s",
                  }}
                >
                  <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}aa)`, color:"#fff", fontWeight:800, fontSize:".85rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {initiales(c)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:"#0f172a", fontSize:".95rem" }}>{c.prenom} {c.nom}</div>
                    <div style={{ color:"#64748b", fontSize:".78rem", marginTop:2 }}>Conseiller(ère) BET Languages</div>
                    {c.telephone && <div style={{ color:"#0891b2", fontSize:".76rem", marginTop:2 }}>📞 {c.telephone}</div>}
                  </div>
                  {saving && isSelected ? (
                    <div style={{ width:22, height:22, border:"2.5px solid #e2e8f0", borderTopColor:color, borderRadius:"50%", animation:"meSpin .7s linear infinite" }} />
                  ) : (
                    <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${isSelected ? color : "#e2e8f0"}`, background: isSelected ? color : "transparent", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:".75rem", transition:"all .18s" }}>
                      {isSelected && "✓"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {saved && (
        <div style={{ background:"#d1fae5", color:"#065f46", padding:"12px 16px", borderRadius:10, fontSize:".85rem", fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
          ✅ Conseiller(ère) enregistré(e) ! Il/elle a été notifié(e) et vous contactera rapidement.
        </div>
      )}
      {error && (
        <div style={{ background:"#fee2e2", color:"#dc2626", padding:"12px 16px", borderRadius:10, fontSize:".85rem", marginTop:8 }}>
          ⚠ {error}
        </div>
      )}

      {/* Bloc engagement */}
      <div style={{ ...S.scoreCard, marginTop:16, background:"#f8fafc" }}>
        <h4 style={{ ...S.cardTitle, marginBottom:12 }}>💼 Ce que fait votre conseiller(ère)</h4>
        {[
          ["📞", "Vous appelle sous 24h après votre choix"],
          ["🎯", "Vous propose les formations adaptées à votre niveau et objectifs"],
          ["📄", "Prépare votre devis personnalisé"],
          ["✅", "Suit votre dossier d'inscription de A à Z"],
          ["🎓", "Reste votre référente tout au long de votre parcours BET"],
        ].map(([ico, txt], i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
            <span style={{ fontSize:"1rem", flexShrink:0 }}>{ico}</span>
            <span style={{ fontSize:".85rem", color:"#475569", lineHeight:1.5 }}>{txt}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Onglet 3 : Catalogue formations ──────────────────── */
const CATALOG = [
  { emoji:"🎓", title:"Cours en ligne",          desc:"Accès illimité, à votre rythme, de chez vous.", path:"/cours/en-ligne",    badge:"Populaire" },
  { emoji:"🏢", title:"Cours en cabinet",         desc:"Présentiel dans nos 6 centres en Côte d'Ivoire.", path:"/cours/cabinet",    badge:null },
  { emoji:"🏠", title:"Cours à domicile",         desc:"Un coach certifié se déplace chez vous.", path:"/cours/domicile",          badge:null },
  { emoji:"📜", title:"Certification TOEIC",      desc:"Préparation complète pour le TOEIC.", path:"/certification/toeic",         badge:"Certifiant" },
  { emoji:"🌍", title:"Certification IELTS",      desc:"Préparation IELTS avec coach natif.", path:"/certification/ielts",         badge:"Certifiant" },
  { emoji:"✈️", title:"Séjour linguistique",      desc:"Immersion en UK, USA ou Canada.", path:"/service/sejour",                 badge:"Nouveau" },
];

const TabCatalogue = () => (
  <div>
    <div style={{ marginBottom:24 }}>
      <h3 style={{ fontFamily:FF, fontWeight:800, color:"#0f172a", margin:"0 0 8px" }}>Nos formations</h3>
      <p style={{ color:"#64748b", fontSize:".88rem" }}>Découvrez tous nos programmes. Cliquez pour en savoir plus.</p>
    </div>
    <div className="me-catalog-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
      {CATALOG.map((item, i) => (
        <Link key={i} to={item.path} style={{ textDecoration:"none" }}>
          <div className="me-card-hov" style={S.catalogCard}>
            {item.badge && (
              <span style={{ ...S.catalogBadge, background: item.badge === "Certifiant" ? "#eff6ff" : item.badge === "Nouveau" ? "#f0fdf4" : "#fef9c3", color: item.badge === "Certifiant" ? "#1e3a8a" : item.badge === "Nouveau" ? "#166534" : "#92400e" }}>
                {item.badge}
              </span>
            )}
            <div style={{ fontSize:"2rem", marginBottom:12 }}>{item.emoji}</div>
            <h4 style={{ fontWeight:800, color:"#0f172a", margin:"0 0 8px", fontSize:".95rem" }}>{item.title}</h4>
            <p style={{ color:"#64748b", fontSize:".82rem", lineHeight:1.6, margin:"0 0 16px" }}>{item.desc}</p>
            <span style={{ color:"#dc2626", fontWeight:700, fontSize:".82rem" }}>Voir le programme →</span>
          </div>
        </Link>
      ))}
    </div>

    {/* Catalogue téléchargeable */}
    <div style={{ ...S.scoreCard, marginTop:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
      <div>
        <h4 style={{ fontWeight:800, color:"#0f172a", margin:"0 0 4px" }}>📄 Catalogue complet BET 2025</h4>
        <p style={{ color:"#64748b", fontSize:".82rem", margin:0 }}>Toutes nos formations, tarifs et modalités en un seul document.</p>
      </div>
      <a href="/assets/catalogue-bet-2025.pdf" download>
        <button style={S.ctaBtn}>⬇ Télécharger le catalogue</button>
      </a>
    </div>
  </div>
);

/* ── Formulaire de contact (intégré dans TabConseillereContact) ── */
const TabContact = ({ user, commercialId }) => {
  const [form,    setForm]    = useState({ sujet:"", message:"", societe:"", effectif:"" });
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [erreur,  setErreur]  = useState("");

  const meta          = user.user_metadata || {};
  const nom           = meta.nom || meta.full_name || user.email.split("@")[0];
  const commercial_id = commercialId || meta.commercial_id || null;

  const isDevisEntreprise = form.sujet === "Demande de devis entreprise (Entreprises uniquement)";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sujet || !form.message) return;
    if (isDevisEntreprise && !form.societe) return;
    setLoading(true); setErreur("");
    try {
      const messageComplet = isDevisEntreprise
        ? `[Devis Entreprise] Société : ${form.societe}${form.effectif ? ` — Effectif : ${form.effectif}` : ""}\n\n${form.message}`
        : form.message;
      const res = await fetch(`${API}/api/contact/submit`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          nom,
          email:         user.email,
          telephone:     meta.telephone || null,
          type:          isDevisEntreprise ? "entreprise" : "prospect",
          sujet:         form.sujet,
          message:       messageComplet,
          commercial_id,
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const SUJETS = [
    "Question sur une formation",
    "Demande de rappel téléphonique",
    "Demande de devis entreprise (Entreprises uniquement)",
    "Information sur les certifications",
    "Autre",
  ];

  if (sent) return (
    <div style={S.emptyCard}>
      <div style={{ fontSize:"3rem", marginBottom:16 }}>✅</div>
      <h3 style={S.emptyTitle}>Message envoyé !</h3>
      <p style={{ color:"#64748b" }}>Un conseiller BET vous répondra sous <strong>24h ouvrées</strong>.</p>
      <button style={{ ...S.ctaBtn, marginTop:20 }} onClick={() => setSent(false)}>Envoyer un autre message</button>
    </div>
  );

  return (
    <div style={{ maxWidth:600, margin:"0 auto" }}>

      <div style={S.scoreCard}>
        <h3 style={{ ...S.cardTitle, marginBottom:20 }}>📞 Envoyer un message</h3>

        {/* Infos pré-remplies */}
        <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:".82rem", color:"#475569", display:"flex", gap:24, flexWrap:"wrap" }}>
          <span>👤 <strong>{nom}</strong></span>
          <span>📧 <strong>{user.email}</strong></span>
        </div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <label style={S.label}>Sujet *</label>
            <select
              className="me-inp"
              style={{ ...S.input, cursor:"pointer" }}
              value={form.sujet}
              onChange={e => setForm(p => ({ ...p, sujet: e.target.value }))}
              required
            >
              <option value="">Choisissez un sujet…</option>
              {SUJETS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* ── Bloc spécifique devis entreprise ── */}
          {isDevisEntreprise && (
            <>
              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"12px 16px", fontSize:".82rem", color:"#92400e", display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:"1.1rem" }}>🏢</span>
                <div>
                  <strong>Réservé aux entreprises</strong> — Ce service s'adresse exclusivement aux structures souhaitant former leurs collaborateurs. Un devis personnalisé vous sera transmis sous 24h.
                </div>
              </div>
              <div>
                <label style={S.label}>Nom de l'entreprise *</label>
                <input
                  className="me-inp"
                  style={S.input}
                  placeholder="Mon Entreprise SARL"
                  value={form.societe}
                  onChange={e => setForm(p => ({ ...p, societe: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={S.label}>Effectif à former</label>
                <select
                  className="me-inp"
                  style={{ ...S.input, cursor:"pointer" }}
                  value={form.effectif}
                  onChange={e => setForm(p => ({ ...p, effectif: e.target.value }))}
                >
                  <option value="">Sélectionner l'effectif</option>
                  <option>1 – 5 employés</option>
                  <option>6 – 20 employés</option>
                  <option>21 – 50 employés</option>
                  <option>50+ employés</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label style={S.label}>Message *</label>
            <textarea
              className="me-inp"
              style={{ ...S.input, minHeight:130, resize:"vertical" }}
              placeholder="Décrivez votre demande, vos questions ou vos besoins…"
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              required
            />
          </div>
          {erreur && <p style={{ color:"#dc2626", fontSize:".82rem", margin:0 }}>⚠ {erreur}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ ...S.ctaBtn, opacity: loading ? .7 : 1, width:"100%", padding:"14px" }}
          >
            {loading ? "Envoi en cours…" : "Envoyer mon message →"}
          </button>
        </form>
      </div>

      {/* Canaux alternatifs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:20 }}>
        {[
          { ico:"📞", label:"Appeler directement", sub:"+225 07 00 00 00 00", href:"tel:+2250700000000" },
          { ico:"💬", label:"WhatsApp", sub:"Réponse rapide", href:"https://wa.me/2250700000000" },
        ].map((c, i) => (
          <a key={i} href={c.href} style={{ textDecoration:"none" }}>
            <div className="me-card-hov" style={{ ...S.scoreCard, textAlign:"center", cursor:"pointer", transition:"all .2s" }}>
              <div style={{ fontSize:"1.8rem", marginBottom:8 }}>{c.ico}</div>
              <div style={{ fontWeight:700, color:"#0f172a", fontSize:".88rem" }}>{c.label}</div>
              <div style={{ color:"#64748b", fontSize:".78rem", marginTop:4 }}>{c.sub}</div>
            </div>
          </a>
        ))}
      </div>

    </div>
  );
};

/* ── Onglet fusionné : Conseillère + Contact ──────────── */
const TabConseillereContact = ({ user }) => {
  const [localCommercialId, setLocalCommercialId] = useState(
    user.user_metadata?.commercial_id || ""
  );

  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      {/* Section 1 : Conseillère */}
      <TabConseiller user={user} onSelected={setLocalCommercialId} />

      {/* Section 2 : Contact — apparaît dès qu'une conseillère est assignée */}
      {localCommercialId ? (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:12, margin:"32px 0 24px" }}>
            <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
            <span style={{ fontSize:".78rem", fontWeight:700, color:"#94a3b8", whiteSpace:"nowrap" }}>
              📩 ENVOYER UN MESSAGE
            </span>
            <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
          </div>
          <TabContact user={user} commercialId={localCommercialId} />
        </>
      ) : (
        <div style={{ marginTop:28, padding:"20px 24px", borderRadius:14, background:"#f8fafc", border:"1.5px dashed #cbd5e1", textAlign:"center" }}>
          <p style={{ color:"#94a3b8", fontSize:".88rem", margin:0 }}>
            👆 Choisissez votre centre et votre conseillère pour débloquer le formulaire de contact.
          </p>
        </div>
      )}
    </div>
  );
};

/* ── Onglet Profil (partagé Prospect + Apprenant) ─────── */
const TabProfil = ({ user, prospectInfo = {} }) => {
  const meta     = user.user_metadata || {};
  const nom      = meta.nom      || "";
  const prenom   = meta.prenom   || "";
  const tel      = meta.telephone|| "";
  const fullName = (nom && prenom) ? `${nom} ${prenom}` : user.displayName;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div className="me-two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        {/* Carte infos */}
        <div style={S.scoreCard}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
            <div style={S.avatarLg}>{(fullName[0]||"?").toUpperCase()}</div>
            <div>
              <h2 style={{ fontFamily:FF, fontWeight:800, color:"#0f172a", margin:"0 0 4px", fontSize:"1.2rem" }}>{fullName}</h2>
              <p style={{ color:"#64748b", fontSize:".82rem", margin:0 }}>
                Niveau : {meta.niveau_anglais || "Non évalué"}
              </p>
            </div>
          </div>
          <div style={S.infoRow}><span>📧 Email</span><span style={{ color:"#0f172a", fontWeight:600 }}>{user.email}</span></div>
          <div style={S.infoRow}><span>📞 Téléphone</span><span style={{ color:"#0f172a", fontWeight:600 }}>{tel || "Non renseigné"}</span></div>
          {prospectInfo.centre && (
            <div style={S.infoRow}>
              <span>🏢 Centre BET</span>
              <span style={{ color:"#0f172a", fontWeight:600 }}>{prospectInfo.centre.nom} — {prospectInfo.centre.ville}</span>
            </div>
          )}
          {prospectInfo.commercial && (
            <div style={S.infoRow}>
              <span>🤝 Conseillère</span>
              <span style={{ color:"#7c3aed", fontWeight:600 }}>{prospectInfo.commercial.prenom} {prospectInfo.commercial.nom}</span>
            </div>
          )}
          <div style={S.infoRow}>
            <span>🏷️ Statut</span>
            <span style={{ color: prospectInfo.is_apprenant ? "#059669" : "#dc2626", fontWeight:700 }}>
              {prospectInfo.is_apprenant ? "✓ Apprenant BET" : "Prospect"}
            </span>
          </div>
        </div>

        {/* Infos non modifiables */}
        <div style={S.scoreCard}>
          <h3 style={{ ...S.cardTitle, marginBottom:16 }}>Mes informations</h3>
          <p style={{ color:"#64748b", fontSize:".85rem", lineHeight:1.7, marginBottom:20 }}>
            Pour modifier vos informations personnelles (nom, téléphone…), contactez-nous via l'onglet <strong>Prise de contact</strong>.
          </p>
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"12px 16px", fontSize:".82rem", color:"#1e3a8a" }}>
            💡 En devenant <strong>apprenant BET</strong>, vous aurez accès à l'édition de votre profil, vos cours et vos certifications.
          </div>
        </div>
      </div>

    </div>
  );
};

/* ── Onglet Paramètres (partagé Prospect + Apprenant) ─── */
const TabParametres = ({ user }) => {
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [resetError,    setResetError]    = useState("");
  const [loading,       setLoading]       = useState(false);

  const handleSendResetLink = async () => {
    setResetLinkSent(false); setResetError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setResetLinkSent(true);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth:500 }}>
      <div style={S.scoreCard}>
        <h3 style={{ ...S.cardTitle, marginBottom:8 }}>Changer mon mot de passe</h3>
        <p style={{ color:"#64748b", fontSize:".85rem", lineHeight:1.7, marginBottom:20 }}>
          Recevez un lien par email à <strong>{user.email}</strong> pour réinitialiser votre mot de passe de façon sécurisée.
        </p>
        <button
          style={{ ...S.ctaBtn, background:"#dc2626", width:"100%", padding:"13px", opacity: loading ? .7 : 1 }}
          onClick={handleSendResetLink}
          disabled={loading}
        >
          {loading ? "Envoi…" : "Envoyer le lien de réinitialisation"}
        </button>
        {resetLinkSent && (
          <div style={{ background:"#d1fae5", color:"#065f46", padding:"12px 16px", borderRadius:8, fontSize:".82rem", marginTop:16 }}>
            ✓ Email envoyé à <strong>{user.email}</strong>. Cliquez sur le lien reçu pour changer votre mot de passe.
          </div>
        )}
        {resetError && (
          <div style={{ background:"#fee2e2", color:"#dc2626", padding:"12px 16px", borderRadius:8, fontSize:".82rem", marginTop:16 }}>
            ❌ {resetError}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Vue Apprenant (existante, inchangée) ─────────────── */
const ApprenantView = ({ user, session, prospectInfo = {} }) => {
  const [activeTab,     setActiveTab]     = useState("espace");
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [resetError,    setResetError]    = useState("");

  const meta     = user.user_metadata || {};
  const nom      = meta.nom      || "";
  const prenom   = meta.prenom   || "";
  const tel      = meta.telephone|| "";
  const fullName = nom && prenom ? `${nom} ${prenom}` : user.displayName;

  const TABS = [
    { id:"espace",     label:"🖥️ Mon espace en ligne" },
    { id:"profil",     label:"👤 Mon profil" },
    { id:"parametres", label:"⚙️ Paramètres" },
  ];

  const handleSendResetLink = async () => {
    setResetLinkSent(false); setResetError("");
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetLinkSent(true);
    } catch (err) { setResetError(err.message); }
  };

  return (
    <>
      <div className="me-tabs" style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} className="me-tab-btn"
            style={{ ...S.tabBtn, ...(activeTab === t.id ? S.tabActive : {}) }}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {activeTab === "espace" && (
        <div style={{ animation:"meFU .4s ease" }}>
          {/* Carte accès espace en ligne */}
          <div style={{ maxWidth:640, margin:"0 auto" }}>
            <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius:20, padding:"36px 32px", textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:"3rem", marginBottom:16 }}>🖥️</div>
              <h2 style={{ fontFamily:FF, color:"#fff", fontWeight:800, margin:"0 0 12px", fontSize:"1.5rem" }}>Votre espace apprenant en ligne</h2>
              <p style={{ color:"rgba(255,255,255,.75)", fontSize:".9rem", lineHeight:1.7, margin:"0 0 28px" }}>
                Accédez à vos cours, exercices, documents pédagogiques et suivez votre progression depuis votre espace personnel BET.
              </p>
              <a href="https://app.betlanguages.com" target="_blank" rel="noreferrer">
                <button style={{ background:"#dc2626", color:"#fff", border:"none", borderRadius:999, padding:"14px 36px", fontWeight:800, fontSize:"1rem", cursor:"pointer", fontFamily:FF, boxShadow:"0 8px 24px rgba(220,38,38,.35)" }}>
                  Accéder à mon espace en ligne →
                </button>
              </a>
            </div>

            {/* Infos centre si disponible */}
            {prospectInfo.centre && (
              <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"20px 24px", marginBottom:16 }}>
                <h4 style={{ fontFamily:FF, fontWeight:800, color:"#0f172a", margin:"0 0 14px", fontSize:".95rem" }}>🏢 Votre centre BET</h4>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ display:"flex", gap:10, fontSize:".88rem" }}>
                    <span style={{ color:"#64748b", minWidth:80 }}>Centre</span>
                    <span style={{ color:"#0f172a", fontWeight:700 }}>{prospectInfo.centre.nom} — {prospectInfo.centre.ville}</span>
                  </div>
                  {prospectInfo.centre.adresse && (
                    <div style={{ display:"flex", gap:10, fontSize:".88rem" }}>
                      <span style={{ color:"#64748b", minWidth:80 }}>Adresse</span>
                      <span style={{ color:"#475569" }}>{prospectInfo.centre.adresse}</span>
                    </div>
                  )}
                  {prospectInfo.centre.telephone && (
                    <div style={{ display:"flex", gap:10, fontSize:".88rem" }}>
                      <span style={{ color:"#64748b", minWidth:80 }}>Tél.</span>
                      <a href={`tel:${prospectInfo.centre.telephone}`} style={{ color:"#0891b2", fontWeight:600, textDecoration:"none" }}>{prospectInfo.centre.telephone}</a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Infos conseillère si disponible */}
            {prospectInfo.commercial && (
              <div style={{ background:"#f5f3ff", border:"1.5px solid #c4b5fd", borderRadius:16, padding:"20px 24px" }}>
                <h4 style={{ fontFamily:FF, fontWeight:800, color:"#0f172a", margin:"0 0 14px", fontSize:".95rem" }}>🤝 Votre conseillère BET</h4>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#0891b2)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".9rem", flexShrink:0 }}>
                    {(prospectInfo.commercial.prenom?.[0] || "") + (prospectInfo.commercial.nom?.[0] || "")}
                  </div>
                  <div>
                    <div style={{ fontWeight:800, color:"#0f172a" }}>{prospectInfo.commercial.prenom} {prospectInfo.commercial.nom}</div>
                    <div style={{ color:"#7c3aed", fontSize:".82rem", fontWeight:600 }}>Conseillère BET Languages</div>
                    {prospectInfo.commercial.telephone && (
                      <a href={`tel:${prospectInfo.commercial.telephone}`} style={{ color:"#0891b2", fontSize:".8rem", display:"block", marginTop:3, textDecoration:"none" }}>📞 {prospectInfo.commercial.telephone}</a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "profil" && (
        <div className="me-two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, animation:"meFU .4s ease" }}>
          <div style={S.scoreCard}>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
              <div style={S.avatarLg}>{(fullName[0]||"?").toUpperCase()}</div>
              <div>
                <h2 style={{ fontFamily:FF, fontWeight:800, color:"#0f172a", margin:"0 0 4px" }}>{fullName}</h2>
                <p style={{ color:"#64748b", fontSize:".82rem", margin:0 }}>Niveau : {meta.niveau_anglais || "Non évalué"}</p>
              </div>
            </div>
            <div style={S.infoRow}><span>📧 Email</span><span>{user.email}</span></div>
            <div style={S.infoRow}><span>📞 Téléphone</span><span>{tel || "Non renseigné"}</span></div>
          </div>
          <div style={S.scoreCard}>
            <h3 style={{ ...S.cardTitle, marginBottom:20 }}>Modifier mes informations</h3>
            <p style={{ color:"#64748b", fontSize:".85rem" }}>Pour modifier vos informations, contactez-nous ou utilisez la réinitialisation de mot de passe.</p>
          </div>
        </div>
      )}

      {activeTab === "parametres" && (
        <div style={{ maxWidth:500, animation:"meFU .4s ease" }}>
          <div style={S.scoreCard}>
            <h3 style={S.cardTitle}>Changer mon mot de passe</h3>
            <p style={{ color:"#64748b", fontSize:".85rem", marginBottom:20 }}>
              Recevez un lien par email pour réinitialiser votre mot de passe de façon sécurisée.
            </p>
            <button style={{ ...S.ctaBtn, background:"#dc2626", width:"100%", padding:"13px" }} onClick={handleSendResetLink}>
              Envoyer le lien de réinitialisation
            </button>
            {resetLinkSent && <div style={{ background:"#d1fae5", color:"#065f46", padding:"10px 14px", borderRadius:8, fontSize:".82rem", marginTop:16 }}>✓ Email envoyé. Consultez votre boîte mail.</div>}
            {resetError    && <div style={{ background:"#fee2e2", color:"#dc2626", padding:"10px 14px", borderRadius:8, fontSize:".82rem", marginTop:16 }}>❌ {resetError}</div>}
          </div>
        </div>
      )}
    </>
  );
};

/* ── Helpers ─────────────────────────────────────────── */
const Loader = () => (
  <div style={{ textAlign:"center", padding:"48px 24px" }}>
    <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTopColor:"#1e3a8a", borderRadius:"50%", animation:"meSpin .8s linear infinite", margin:"0 auto" }} />
  </div>
);

/* ── Styles ──────────────────────────────────────────── */
const S = {
  page:            { fontFamily:FF, background:"#f8fafc", minHeight:"100vh", color:"#0f172a" },
  header:          { background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)", padding:"40px 0 0", position:"relative" },
  headerInner:     { maxWidth:1180, margin:"0 auto", padding:"0 24px 32px" },
  headerTitle:     { fontFamily:FF, fontSize:"2rem", color:"#fff", margin:"4px 0 0", fontWeight:800 },
  headerSub:       { color:"rgba(255,255,255,.7)", fontSize:"1rem", margin:"6px 0 0" },
  logoutBtnHeader: { background:"rgba(255,255,255,.12)", color:"#fff", border:"1.5px solid rgba(255,255,255,.25)", borderRadius:999, padding:"9px 20px", fontWeight:700, fontSize:".84rem", cursor:"pointer", fontFamily:FF },
  prospectBadge:   { display:"inline-block", background:"rgba(220,38,38,.25)", border:"1px solid rgba(220,38,38,.5)", color:"#fca5a5", borderRadius:999, padding:"3px 14px", fontSize:".72rem", fontWeight:800, letterSpacing:".06em", marginBottom:8 },
  container:       { maxWidth:1180, margin:"32px auto 64px", padding:"0 24px" },

  upgradeBanner:   { background:"#eff6ff", border:"1.5px solid #bfdbfe", borderRadius:14, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:28 },
  upgradeBtn:      { background:"#1e3a8a", color:"#fff", border:"none", borderRadius:999, padding:"10px 22px", fontWeight:800, fontSize:".84rem", cursor:"pointer", fontFamily:FF, whiteSpace:"nowrap" },

  tabs:            { display:"flex", gap:4, borderBottom:"2px solid #e2e8f0", marginBottom:32 },
  tabBtn:          { background:"none", border:"none", padding:"12px 22px", fontSize:".88rem", fontWeight:600, color:"#64748b", cursor:"pointer", transition:"all .2s", fontFamily:FF, whiteSpace:"nowrap" },
  tabActive:       { color:"#dc2626", borderBottom:"2px solid #dc2626" },

  emptyCard:       { background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:20, padding:"56px 32px", textAlign:"center", maxWidth:480, margin:"0 auto" },
  emptyTitle:      { fontFamily:FF, fontWeight:800, fontSize:"1.2rem", margin:"0 0 12px" },
  ctaBtn:          { background:"#1e3a8a", color:"#fff", border:"none", borderRadius:999, padding:"12px 28px", fontWeight:800, fontSize:".9rem", cursor:"pointer", fontFamily:FF, transition:"all .2s" },

  levelCard:       { background:"#fff", border:"2px solid", borderRadius:20, padding:"28px 24px", display:"flex", alignItems:"center", gap:24, marginBottom:20, boxShadow:"0 4px 16px rgba(0,0,0,.06)" },
  levelBadge:      { width:80, height:80, borderRadius:16, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem", fontWeight:900, flexShrink:0 },
  scoreCard:       { background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"24px", marginBottom:16, boxShadow:"0 2px 8px rgba(0,0,0,.04)" },
  cardTitle:       { fontFamily:FF, fontWeight:800, color:"#0f172a", margin:"0 0 4px", fontSize:"1rem" },

  catalogCard:     { background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"22px", height:"100%", boxShadow:"0 2px 8px rgba(0,0,0,.04)", transition:"all .25s", position:"relative" },
  catalogBadge:    { position:"absolute", top:14, right:14, borderRadius:999, padding:"3px 10px", fontSize:".7rem", fontWeight:800 },

  label:           { display:"block", fontSize:".78rem", fontWeight:700, marginBottom:6, color:"#0f172a" },
  input:           { width:"100%", padding:"10px 13px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:".88rem", fontFamily:FF, boxSizing:"border-box", background:"#fff", transition:"border-color .2s" },
  infoRow:         { display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f1f5f9", fontSize:".88rem" },
  avatarLg:        { width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#1e3a8a,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", color:"#fff", fontWeight:800, flexShrink:0 },
};

export default MonEspace;
