// src/pages/IndividualConfirmation.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const IndividualConfirmation = () => {
  const navigate = useNavigate();
  return (
    <div className="confirmation">
      <div className="confirmation-card">
        <h2>🎉 Votre demande est enregistrée</h2>
        <p>Un conseiller vous appellera sous 24h pour fixer votre cours d’essai gratuit.</p>
        <button onClick={() => navigate("/")} className="btn-primary">Retour à l’accueil</button>
      </div>
    </div>
  );
};

export default IndividualConfirmation;