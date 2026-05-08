import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../config/supabase";
import Footer from "../Footer/Footer";

/* ── Keyframes & styles globaux ── */
if (!document.querySelector("#bet-temo-page-kf")) {
  const s = document.createElement("style");
  s.id = "bet-temo-page-kf";
  s.textContent = `
    @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes scaleIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    @keyframes spinSlow{ to{transform:rotate(360deg)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }

    .tpg-card {
      background:#fff;
      border-radius:18px;
      border:1.5px solid #e2e8f0;
      overflow:hidden;
      display:flex;
      flex-direction:column;
      transition:box-shadow .22s, transform .22s;
      animation: fadeUp .45s ease both;
    }
    .tpg-card:hover {
      box-shadow: 0 12px 36px rgba(0,0,0,0.10);
      transform: translateY(-4px);
    }

    .tpg-filter-btn {
      padding: 8px 18px;
      border-radius: 999px;
      border: none;
      font-size: .82rem;
      font-weight: 700;
      cursor: pointer;
      transition: background .15s, color .15s, transform .12s;
      font-family: inherit;
    }
    .tpg-filter-btn:hover { transform: translateY(-1px); }
    .tpg-filter-btn--active   { background:#1e4080; color:#fff; }
    .tpg-filter-btn--inactive { background:#f1f5f9; color:#475569; }

    .tpg-cta-btn {
      background:linear-gradient(135deg,#e93747,#1e4080);
      color:#fff; border:none; border-radius:999px;
      padding:14px 36px; font-weight:800; font-size:1rem;
      cursor:pointer; font-family:inherit;
      box-shadow:0 6px 24px rgba(233,55,71,.3);
      transition:transform .2s, box-shadow .2s;
    }
    .tpg-cta-btn:hover { transform:translateY(-3px); box-shadow:0 10px 32px rgba(233,55,71,.35); }

    .tpg-back-btn:hover { background:#0b1f40!important; color:#fff!important; }

    @media(max-width:700px){
      .tpg-grid { grid-template-columns:1fr!important; }
      .tpg-hero-h1 { font-size:clamp(1.7rem,6vw,2.4rem)!important; }
      .tpg-stats { flex-direction:column; gap:12px!important; }
    }
  `;
  document.head.appendChild(s);
}

/* ── Fallback data ── */
const FALLBACK = [
  { id:"f1", avatar:"👩🏾‍⚖️", nom:"Awa Koné",        role:"Étudiante en droit",          score:"TOEIC 850",  texte:"En 3 mois j'ai décroché 850 au TOEIC. Les méthodes sont vraiment efficaces et le suivi personnalisé fait toute la différence. Je recommande à 100% !", etoiles:5, couleur:"#d97706" },
  { id:"f2", avatar:"👨🏿‍💼", nom:"Kouamé Brou",      role:"Directeur Commercial · NSIA", score:"IELTS 7.5",  texte:"La formation entreprise a transformé notre relation client internationale. Nos équipes communiquent maintenant avec confiance en anglais.", etoiles:5, couleur:"#0891b2" },
  { id:"f3", avatar:"👩🏽‍💻", nom:"Fatoumata Diallo", role:"Ingénieure IT · MTN CI",      score:"TOEFL 104",  texte:"Préparé mon TOEFL en ligne depuis Abidjan. Les corrections rapides et la disponibilité des profs m'ont permis d'atteindre mon score cible.", etoiles:5, couleur:"#1e4080" },
  { id:"f4", avatar:"👨🏽‍🎓", nom:"Sonia Ravin",      role:"Étudiante · Université HEC",  score:"TOEIC 920",  texte:"Programme d'immersion qui a littéralement changé ma vie. 920 points au TOEIC — des portes que je croyais fermées se sont ouvertes.", etoiles:5, couleur:"#e93747" },
];

const SCORES = ["Tous", "TOEIC", "TOEFL", "IELTS", "Anglais Pro"];

const F = "'Montserrat', 'Segoe UI', sans-serif";

/* ══════════════════════════════════════════════
   CARD COMPOSANT
══════════════════════════════════════════════ */
const TemoCard = ({ t, delay = 0 }) => (
  <div className="tpg-card" style={{ animationDelay: `${delay}ms` }}>
    {/* Bande couleur */}
    <div style={{ height: 5, background: t.couleur || "#1e4080", flexShrink: 0 }} />

    <div style={{ padding: "22px 22px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Étoiles */}
      <div style={{ marginBottom: 12, fontSize: "1rem", letterSpacing: 1 }}>
        <span style={{ color: "#f59e0b" }}>{"★".repeat(t.etoiles || 5)}</span>
        <span style={{ color: "#e5e7eb" }}>{"☆".repeat(5 - (t.etoiles || 5))}</span>
      </div>

      {/* Texte */}
      <p style={{ fontFamily: F, fontSize: ".92rem", color: "#334155", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 20px", flex: 1 }}>
        « {t.texte} »
      </p>

      {/* Identité */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: `${t.couleur || "#1e4080"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
          {t.avatar || "🎓"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: ".88rem", color: "#0b1f40", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.nom}</div>
          {t.role && <div style={{ fontSize: ".73rem", color: "#64748b", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.role}</div>}
        </div>
        {t.score && (
          <div style={{ background: t.couleur || "#1e4080", color: "#fff", borderRadius: 999, padding: "4px 12px", fontSize: ".72rem", fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>
            {t.score}
          </div>
        )}
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════ */
const TemoignagesPage = () => {
  const [temos,   setTemos]   = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [filtre,  setFiltre]  = useState("Tous");
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    supabase
      .from("temoignages")
      .select("id, nom, role, score, texte, avatar, couleur, etoiles, ordre")
      .eq("actif", true)
      .eq("statut", "actif")
      .order("ordre", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data?.length) setTemos(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const PER_PAGE = 9;
  const [page, setPage] = useState(1);

  /* Filtrage */
  const filtered = temos.filter(t => {
    const matchFiltre = filtre === "Tous" || (t.score || "").toUpperCase().includes(filtre.toUpperCase());
    const q = search.toLowerCase();
    const matchSearch = !q || t.nom?.toLowerCase().includes(q) || t.texte?.toLowerCase().includes(q) || t.role?.toLowerCase().includes(q);
    return matchFiltre && matchSearch;
  });

  // Remettre à la page 1 quand filtre/recherche changent
  useEffect(() => { setPage(1); }, [filtre, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const displayed  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const goTo = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Stats */
  const nbTotal    = temos.length;
  const nbToeic    = temos.filter(t => (t.score || "").toUpperCase().includes("TOEIC")).length;
  const nbIelts    = temos.filter(t => (t.score || "").toUpperCase().includes("IELTS")).length;
  const nbToefl    = temos.filter(t => (t.score || "").toUpperCase().includes("TOEFL")).length;
  const avgEtoiles = temos.length ? (temos.reduce((s, t) => s + (t.etoiles || 5), 0) / temos.length).toFixed(1) : "5.0";

  return (
    <div style={{ fontFamily: F, background: "#f8fafc", minHeight: "100vh" }}>

      {/* ══════════ HERO ══════════ */}
      <div style={{ background: "linear-gradient(135deg,#0b1f40 0%,#1e4080 60%,#e93747 100%)", padding: "80px 24px 100px", position: "relative", overflow: "hidden" }}>
        {/* Cercles déco */}
        <div style={{ position:"absolute", top:-60, right:-60, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,.04)" }} />
        <div style={{ position:"absolute", bottom:-80, left:-40, width:200, height:200, borderRadius:"50%", background:"rgba(233,55,71,.12)" }} />

        <div style={{ maxWidth: 860, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 28, fontSize: ".78rem" }}>
            <Link to="/" style={{ color: "rgba(255,255,255,.55)", textDecoration: "none", fontWeight: 500 }}>Accueil</Link>
            <span style={{ color: "rgba(255,255,255,.3)" }}>›</span>
            <span style={{ color: "rgba(255,255,255,.8)", fontWeight: 600 }}>Témoignages</span>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.1)", backdropFilter: "blur(8px)", borderRadius: 999, padding: "6px 18px", fontSize: ".72rem", fontWeight: 800, color: "rgba(255,255,255,.85)", letterSpacing: ".08em", marginBottom: 20 }}>
            💬 ILS ONT RÉUSSI
          </div>

          <h1 className="tpg-hero-h1" style={{ fontFamily: F, fontSize: "clamp(2rem,5vw,3.2rem)", color: "#fff", margin: "0 0 20px", fontWeight: 800, lineHeight: 1.15 }}>
            Ils ont choisi BET<br />
            <span style={{ background: "linear-gradient(90deg,#fbbf24,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>et ils ne le regrettent pas</span>
          </h1>

          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,.65)", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Découvrez les parcours de nos apprenants — des résultats concrets, des certifications obtenues, des carrières transformées.
          </p>

          {/* Stats */}
          <div className="tpg-stats" style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { v: `${nbTotal}+`, l: "Témoignages" },
              { v: `${avgEtoiles}/5`, l: "Note moyenne" },
              { v: `${nbToeic}`,  l: "TOEIC" },
              { v: `${nbIelts}`,  l: "IELTS" },
              { v: `${nbToefl}`,  l: "TOEFL" },
            ].map(s => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff" }}>{s.v}</div>
                <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.5)", fontWeight: 600, letterSpacing: ".06em" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ CONTENU ══════════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Barre filtres + recherche */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          {/* Filtres certification */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SCORES.map(sc => (
              <button
                key={sc}
                className={`tpg-filter-btn tpg-filter-btn--${filtre === sc ? "active" : "inactive"}`}
                onClick={() => setFiltre(sc)}
              >
                {sc === "Tous" ? `Tous (${temos.length})` : sc}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: ".9rem", color: "#94a3b8" }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un nom, un rôle…"
              style={{ paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: "1.5px solid #e2e8f0", borderRadius: 999, fontSize: ".83rem", fontFamily: F, width: 220, outline: "none", background: "#fff", transition: "border-color .15s" }}
              onFocus={e => e.target.style.borderColor = "#1e4080"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
        </div>

        {/* Résultat count */}
        <p style={{ fontSize: ".82rem", color: "#94a3b8", marginBottom: 24, fontWeight: 600 }}>
          {loading ? "Chargement…" : `${filtered.length} témoignage${filtered.length > 1 ? "s" : ""}${filtre !== "Tous" ? ` · ${filtre}` : ""}${search ? ` · "${search}"` : ""} — page ${page}/${totalPages}`}
        </p>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ width: 40, height: 40, border: "4px solid #e2e8f0", borderTopColor: "#e93747", borderRadius: "50%", animation: "spinSlow .8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ fontSize: ".9rem" }}>Chargement des témoignages…</p>
          </div>
        )}

        {/* Grille */}
        {!loading && displayed.length > 0 && (
          <div className="tpg-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 22 }}>
            {displayed.map((t, i) => (
              <TemoCard key={t.id ?? i} t={t} delay={i * 60} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 48, flexWrap: "wrap" }}>
            {/* Précédent */}
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              style={{ padding: "9px 18px", borderRadius: 999, border: "1.5px solid #e2e8f0", background: page === 1 ? "#f8fafc" : "#fff", color: page === 1 ? "#cbd5e1" : "#0b1f40", fontWeight: 700, fontSize: ".85rem", cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: F, transition: "all .15s" }}
            >
              ← Précédent
            </button>

            {/* Numéros */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
              const isActive = n === page;
              const isNear   = Math.abs(n - page) <= 2 || n === 1 || n === totalPages;
              if (!isNear) {
                const isPrevDot = n === page - 3;
                const isNextDot = n === page + 3;
                if (isPrevDot || isNextDot) return <span key={n} style={{ color: "#94a3b8", fontSize: ".9rem", padding: "0 2px" }}>…</span>;
                return null;
              }
              return (
                <button key={n} onClick={() => goTo(n)}
                  style={{ width: 38, height: 38, borderRadius: "50%", border: isActive ? "none" : "1.5px solid #e2e8f0", background: isActive ? "#1e4080" : "#fff", color: isActive ? "#fff" : "#0b1f40", fontWeight: 800, fontSize: ".88rem", cursor: "pointer", fontFamily: F, transition: "all .15s", flexShrink: 0 }}>
                  {n}
                </button>
              );
            })}

            {/* Suivant */}
            <button
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              style={{ padding: "9px 18px", borderRadius: 999, border: "1.5px solid #e2e8f0", background: page === totalPages ? "#f8fafc" : "#fff", color: page === totalPages ? "#cbd5e1" : "#0b1f40", fontWeight: 700, fontSize: ".85rem", cursor: page === totalPages ? "not-allowed" : "pointer", fontFamily: F, transition: "all .15s" }}
            >
              Suivant →
            </button>
          </div>
        )}

        {/* Aucun résultat */}
        {!loading && displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: 18, border: "1.5px dashed #e2e8f0" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🔍</div>
            <h3 style={{ fontFamily: F, fontWeight: 800, color: "#0b1f40", margin: "0 0 8px" }}>Aucun résultat</h3>
            <p style={{ color: "#64748b", fontSize: ".9rem" }}>Essayez un autre filtre ou effacez la recherche.</p>
            <button onClick={() => { setFiltre("Tous"); setSearch(""); }}
              style={{ marginTop: 16, padding: "9px 22px", background: "#1e4080", color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, fontSize: ".85rem", cursor: "pointer", fontFamily: F }}>
              Tout afficher
            </button>
          </div>
        )}

        {/* ══ BANDEAU CTA ══ */}
        <div style={{ marginTop: 72, background: "linear-gradient(135deg,#0b1f40,#1e4080)", borderRadius: 24, padding: "52px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />
          <div style={{ position: "absolute", bottom: -40, left: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(233,55,71,.12)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>🚀</div>
            <h2 style={{ fontFamily: F, fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#fff", margin: "0 0 14px", fontWeight: 800 }}>
              Prêt à écrire votre propre succès ?
            </h2>
            <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".95rem", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Rejoignez +5 000 apprenants qui ont transformé leur carrière avec BET English Training.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/#programmes">
                <button className="tpg-cta-btn">Commencer ma formation →</button>
              </Link>
              <Link to="/test-niveau">
                <button style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "14px 28px", fontWeight: 700, fontSize: ".95rem", cursor: "pointer", fontFamily: F, transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}>
                  Tester mon niveau gratuitement
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Retour accueil */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link to="/" className="tpg-back-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f1f5f9", color: "#0b1f40", borderRadius: 999, padding: "10px 22px", fontWeight: 700, fontSize: ".85rem", textDecoration: "none", transition: "all .2s", border: "1.5px solid #e2e8f0" }}>
            ← Retour à l'accueil
          </Link>
        </div>

      </div>
      <Footer/>
    </div>
  );
};

export default TemoignagesPage;
