// src/Pages/HomePage/Particuliers/ParentsAssurance.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./ParentsAssurance.css";
import Footer from "../../../Footer/Footer";

const ParentsAssurance = () => {
  const navigate = useNavigate();

  const points = [
    { icon: "🔒", title: "Sécurité en ligne", desc: "Classes virtuelles sécurisées, modération en direct." },
    { icon: "📊", title: "Suivi trimestriel", desc: "Rapports détaillés sur la progression de votre enfant." },
    { icon: "👩‍🏫", title: "Professeurs qualifiés", desc: "Tous nos enseignants sont diplômés et formés à la pédagogie jeunesse." },
    { icon: "🔄", title: "Flexibilité", desc: "Cours à domicile, en centre ou en ligne, horaires adaptables." },
  ];

  return (
   <>
    <div className="parents-assurance">
      <h1>Pourquoi nos parents nous font confiance</h1>
      <div className="trust-grid">
        {points.map((p, i) => (
          <div key={i} className="trust-card">
            <div className="icon">{p.icon}</div>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </div>
        ))}
      </div>
      <div className="testimonial">
        <p>“Mon fils a gagné en confiance et ses notes ont grimpé de 3 points en 6 mois !”</p>
        <span>— Marie, parent d’élève</span>
      </div>
      <button onClick={() => navigate("/parcours/particulier/enfants/inscription")} className="btn-primary">
        Inscrire mon enfant →
      </button>
    </div>
    <Footer/>
   </>
  );
};

export default ParentsAssurance;