// src/pages/HomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <section className="hero">
        <h1>Maîtrisez l’anglais avec un parcours sur mesure</h1>
        <p>Que vous soyez particulier ou entreprise, nous avons la solution adaptée.</p>
      </section>

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