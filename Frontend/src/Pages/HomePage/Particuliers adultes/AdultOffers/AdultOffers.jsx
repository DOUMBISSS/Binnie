// src/pages/AdultOffers.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdultOffers.css";
import Footer from "../../../Footer/Footer";

const AdultOffers = () => {
  const navigate = useNavigate();

  const offers = [
    { id: 1, title: "Anglais général – 3 mois", level: "Débutant à Intermédiaire", hours: "60h", price: "450€", icon: "🗣️" },
    { id: 2, title: "Préparation TOEIC", level: "Intermédiaire", hours: "40h", price: "390€", icon: "🎓" },
    { id: 3, title: "Anglais des affaires", level: "Avancé", hours: "50h", price: "520€", icon: "💼" },
    { id: 4, title: "Conversation intensif", level: "Tous niveaux", hours: "30h", price: "280€", icon: "💬" },
  ];

  return (
  <>
    <div className="adult-offers">
      <h1>Nos offres adultes</h1>
      <div className="offers-grid">
        {offers.map(offer => (
          <div key={offer.id} className="offer-card">
            <div className="offer-icon">{offer.icon}</div>
            <h3>{offer.title}</h3>
            <p>Niveau : {offer.level}</p>
            <p>Durée : {offer.hours}</p>
            <p className="price">{offer.price}</p>
            <button onClick={() => navigate(`/parcours/particulier/programme/${offer.id}`)} className="btn-primary">
              Voir le programme →
            </button>
          </div>
        ))}
      </div>
    </div>
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

export default AdultOffers;