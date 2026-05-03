// src/Pages/LeadMagnet/LeadThankYou.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./LeadMagnet.css";

const LeadThankYou = () => {
  const navigate = useNavigate();
  return (
    <div className="lead-magnet">
      <div className="lead-card">
        <h2>🎉 Merci !</h2>
        <p>Votre demande d’audit a bien été reçue.</p>
        <p>Vous allez recevoir un email dans les prochaines minutes avec un lien pour planifier votre rendez-vous.</p>
        <button onClick={() => navigate("/")} className="btn-primary">Retour à l’accueil</button>
      </div>
    </div>
  );
};

export default LeadThankYou;