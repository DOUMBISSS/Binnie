// src/Pages/HomePage/Particuliers/IndividualLanding.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Individual.css";
import Footer from "../../Footer/Footer";

const IndividualLanding = () => {
  const navigate = useNavigate();

  return (
  <>
    <div className="individual-landing">
      <h1>Formation anglais pour particuliers</h1>
      <div className="pathway-options">
        <div className="option-card">
          <h2>👤 Adultes</h2>
          <p>Cours flexibles, préparation certifications, anglais des affaires.</p>
          <button onClick={() => navigate("/parcours/particulier/offres")} className="btn-primary">Voir les offres adultes</button>
        </div>
        <div className="option-card">
          <h2>🧸 Enfants & étudiants</h2>
          <p>Programmes ludiques par âge, suivi personnalisé, professeurs spécialisés.</p>
          <button onClick={() => navigate("/parcours/particulier/enfants")} className="btn-secondary">Découvrir l’offre jeune</button>
        </div>
      </div>
    </div>
     <Footer/>
  </>
  );
};

export default IndividualLanding;