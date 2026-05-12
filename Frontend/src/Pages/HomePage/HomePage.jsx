// src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import ParcoursModal from "../Parcours/ParcoursModal";
import { supabase } from "../../config/supabase";

const HomePage = () => {
  const navigate = useNavigate();
  const [showParcours, setShowParcours] = useState(false);
  const [hasAssignation, setHasAssignation] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.parcours_assignation) setHasAssignation(true);
    });
  }, []);

  const openParcours = () => {
    if (hasAssignation) { navigate("/mon-espace"); return; }
    setShowParcours(true);
  };

  return (
    <div className="homepage">
      <section className="hero">
        <h1>Maîtrisez l’anglais avec un parcours sur mesure</h1>
        <p>Que vous soyez particulier ou entreprise, nous avons la solution adaptée.</p>
      </section>

      {/* ── CTA Parcours inscription ── */}
      <section style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#0891b2 100%)", padding:"48px 24px", textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,.75)", fontSize:".85rem", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", margin:"0 0 10px" }}>
          Nouveau — Parcours guidé
        </p>
        <h2 style={{ color:"#fff", fontSize:"clamp(1.5rem,4vw,2.2rem)", margin:"0 0 14px", fontWeight:800, lineHeight:1.2 }}>
          Trouvez votre assistante dédiée<br />
          <span style={{ color:"#38bdf8" }}>en 3 minutes chrono</span>
        </h2>
        <p style={{ color:"rgba(255,255,255,.7)", fontSize:".95rem", maxWidth:500, margin:"0 auto 28px", lineHeight:1.7 }}>
          Cours en ligne ou en présentiel — notre système vous oriente et assigne automatiquement une assistante disponible.
        </p>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          <button
            onClick={openParcours}
            style={{ background:"linear-gradient(135deg,#f59e0b,#fbbf24)", color:"#0f172a", borderRadius:999, padding:"14px 32px", fontWeight:900, fontSize:"1rem", border:"none", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8, boxShadow:"0 8px 24px rgba(245,158,11,.4)", fontFamily:"'Montserrat',sans-serif" }}
          >
            {hasAssignation ? "💬 Voir mon assistante →" : "🎯 Démarrer mon parcours →"}
          </button>
          <button
            onClick={() => navigate("/test-niveau")}
            style={{ background:"rgba(255,255,255,.12)", color:"#fff", border:"1.5px solid rgba(255,255,255,.3)", borderRadius:999, padding:"14px 28px", fontWeight:700, fontSize:".9rem", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8, fontFamily:"'Montserrat',sans-serif" }}
          >
            📝 Tester mon niveau d'abord
          </button>
        </div>
        <div style={{ display:"flex", gap:28, justifyContent:"center", marginTop:24, flexWrap:"wrap" }}>
          {["✓ Gratuit & sans engagement", "✓ Assistante assignée en 1 clic", "✓ En ligne ou en cabinet"].map(t => (
            <span key={t} style={{ color:"rgba(255,255,255,.65)", fontSize:".8rem", fontWeight:600 }}>{t}</span>
          ))}
        </div>
      </section>

      <ParcoursModal isOpen={showParcours} onClose={() => setShowParcours(false)} />

      <section className="dual-pathway">
        <div className="container">
          <h2>Choisissez votre profil</h2>
          <div className="pathway-cards">
            {/* Carte Particuliers */}
            <div className="card">
              <div className="icon">👤</div>
              <h3>Particuliers</h3>
              <p>Cours en ligne, en centre ou à domicile. Préparation TOEIC, IELTS, anglais général.</p>
              <button className="btn-individual" onClick={() => navigate("/parcours/particulier")}>
                Découvrir l’offre →
              </button>
            </div>
            {/* Carte Entreprise */}
            <div className="card">
              <div className="icon">🏢</div>
              <h3>Entreprises</h3>
              <p>Formation intra‑entreprise, audit linguistique, coaching professionnel.</p>
              <button className="btn-corporate" onClick={() => navigate("/parcours/entreprise")}>
                Découvrir l’offre →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;