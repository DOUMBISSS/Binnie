// src/pages/CorporateConfirmation.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Corporate.css";

const CorporateConfirmation = () => {
  const navigate = useNavigate();

  return (
    <div className="confirmation">
      <div className="confirmation-card">
        <h2>✅ Demande envoyée avec succès</h2>
        <p>Un conseiller BET (Business Education Training) vous contactera sous 48h pour organiser l’audit gratuit.</p>
        <p>En attendant, découvrez nos <button className="link-btn" onClick={() => navigate("/parcours/entreprise/offres")}>offres corporate</button>.</p>
        <button onClick={() => navigate("/")} className="btn-primary">Retour à l’accueil</button>
      </div>
    </div>
  );
};

export default CorporateConfirmation;