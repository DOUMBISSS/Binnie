// src/Pages/HomePage/Particuliers/KidsLanding.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./KidsLanding.css";

const KidsLanding = () => {
  const navigate = useNavigate();

  return (
    <>
    <div className="kids-landing">
      <div className="hero">
        <h1>🎓 Cours d'anglais pour enfants & étudiants</h1>
        <p>Apprendre en s’amusant, progresser avec confiance</p>
        <button onClick={() => navigate("/parcours/particulier/enfants/programme")} className="btn-primary">
          Découvrir nos programmes →
        </button>
      </div>
      <div className="features">
        <div className="feature">
          <span>🧸</span>
          <h3>Méthode ludique</h3>
          <p>Jeux, chansons, activités interactives</p>
        </div>
        <div className="feature">
          <span>👩‍🏫</span>
          <h3>Professeurs spécialisés</h3>
          <p>Diplômés en enseignement jeunesse</p>
        </div>
        <div className="feature">
          <span>📈</span>
          <h3>Suivi personnalisé</h3>
          <p>Rapports trimestriels pour les parents</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default KidsLanding;