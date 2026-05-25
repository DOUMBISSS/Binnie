import React, { useState, useEffect, useRef } from "react";

/* ── Animation ticker ───────────────────────────────── */
if (!document.querySelector("#coaches-ticker-kf")) {
  const s = document.createElement("style");
  s.id = "coaches-ticker-kf";
  s.textContent = `
    @keyframes coachesTicker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    .coach-card-wrap:hover .coach-img { transform:scale(1.08); }
  `;
  document.head.appendChild(s);
}

/* ── Hook IntersectionObserver ──────────────────────── */
function useInView(t = 0.15) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [t]);
  return [ref, v];
}

/* ── Données fallback ────────────────────────────────── */
const COACHES_FALLBACK = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, img: `/team${i + 1}.jpeg`, nom: "", grade: "" }));

/* ── Carte coach ─────────────────────────────────────── */
const CoachCard = ({ coach }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="coach-card-wrap"
      style={{
        flexShrink: 0, width: 200, height: 240, margin: "0 10px",
        borderRadius: 18, overflow: "hidden", position: "relative",
        transform: hov ? "scale(1.05)" : "scale(1)",
        transition: "transform .3s ease, box-shadow .3s ease",
        boxShadow: hov ? "0 20px 48px rgba(0,0,0,.22)" : "0 4px 18px rgba(0,0,0,.1)",
        cursor: "default",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <img
        className="coach-img"
        src={coach.img}
        alt={`Coach BET ${coach.id}`}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          transition: "transform .5s ease",
          transform: hov ? "scale(1.08)" : "scale(1)",
        }}
        onError={e => {
          e.currentTarget.parentElement.style.background = "#e2e8f0";
          e.currentTarget.style.display = "none";
        }}
      />
      {/* Dégradé bas */}
      <div style={{
        position: "absolute", inset: 0,
        background: hov
          ? "linear-gradient(180deg,transparent 35%,rgba(15,23,42,.75))"
          : "linear-gradient(180deg,transparent 55%,rgba(15,23,42,.5))",
        transition: "background .3s",
      }} />
      {/* Label */}
      <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
        <div style={{ width: 26, height: 3, background: "#dc2626", borderRadius: 2, marginBottom: 6 }} />
        <div style={{
          fontSize: ".72rem", color: "#fff", fontWeight: 700, letterSpacing: ".04em",
          opacity: hov ? 1 : 0,
          transform: hov ? "translateY(0)" : "translateY(6px)",
          transition: "opacity .3s, transform .3s",
        }}>
          Coach BET Certifié
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   SECTION PRINCIPALE
══════════════════════════════════════════════════════ */
const CoachesSection = () => {
  const [ref, inView] = useInView();
  const [coaches, setCoaches] = useState(COACHES_FALLBACK);

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || "http://localhost:5001";
    fetch(`${API}/api/equipe-photos/publics`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCoaches(data.map(c => ({ id: c.id, img: c.photo_url, nom: c.nom || "", grade: c.titre || "" })));
        }
      })
      .catch(() => {});
  }, []);

  const half = Math.ceil(coaches.length / 2);
  const row1 = coaches.slice(0, half);
  const row2 = coaches.slice(half);

  const FF = "'Montserrat','Segoe UI',sans-serif";
  const FD = "'DM Serif Display',Georgia,serif";

  return (
    <section
      ref={ref}
      style={{ padding: "80px 0", background: "#fff", overflow: "hidden", fontFamily: FF }}
    >
      {/* En-tête */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", textAlign: "center", marginBottom: 52 }}>
        <span style={{
          display: "inline-block", background: "#fef2f2", color: "#dc2626",
          border: "1px solid #fecaca", borderRadius: 999, padding: "5px 16px",
          fontSize: ".72rem", fontWeight: 800, letterSpacing: ".08em", marginBottom: 14,
        }}>
          👥 NOTRE ÉQUIPE
        </span>
        <h2 style={{
          fontFamily: FD, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 400,
          margin: "0 0 14px", lineHeight: 1.15, color: "#0f172a",
          opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)",
          transition: "all .6s ease",
        }}>
          Quelques membres de<br />
          <span style={{ color: "#dc2626", fontStyle: "italic" }}>l'équipe coachs</span>
        </h2>
        <div style={{ width: 60, height: 3, borderRadius: 2, margin: "0 auto 18px", background: "#e2e8f0" }} />
        <p style={{
          fontSize: "1rem", lineHeight: 1.6, maxWidth: 560, margin: "0 auto", color: "#64748b",
          opacity: inView ? 1 : 0, transition: "all .6s ease .15s",
        }}>
          Des coachs certifiés, passionnés et entièrement dédiés à votre réussite.
        </p>
      </div>

      {/* Rangée 1 — défile vers la gauche */}
      <div style={{ overflow: "hidden", marginBottom: 16 }}>
        <div style={{
          display: "flex", width: "fit-content",
          animation: "coachesTicker 50s linear infinite",
        }}>
          {[...row1, ...row1].map((coach, i) => <CoachCard key={i} coach={coach} />)}
        </div>
      </div>

      {/* Rangée 2 — défile vers la droite */}
      <div style={{ overflow: "hidden" }}>
        <div style={{
          display: "flex", width: "fit-content",
          animation: "coachesTicker 50s linear infinite reverse",
        }}>
          {[...row2, ...row2].map((coach, i) => <CoachCard key={i} coach={coach} />)}
        </div>
      </div>
    </section>
  );
};

export default CoachesSection;
