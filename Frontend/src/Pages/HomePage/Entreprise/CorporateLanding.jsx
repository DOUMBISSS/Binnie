// src/pages/CorporateLanding.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Corporate.css";
import Footer from "../../Footer/Footer";

const CorporateLanding = () => {
  const navigate = useNavigate();

  return (
    <>
        <div className="corporate-landing">
      <h1>Formation anglais pour entreprises</h1>
      <p>Boostez la compétence linguistique de vos équipes avec nos programmes sur mesure.</p>
      <button onClick={() => navigate("/parcours/entreprise/offres")} className="btn-primary">
        Voir nos offres corporate →
      </button>
    </div>
    <Footer/>
    </>
  );
};

export default CorporateLanding;