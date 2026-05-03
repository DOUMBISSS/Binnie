// src/pages/CorporateOffers.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Corporate.css";
import Footer from "../../Footer/Footer";

const CorporateOffers = () => {
  const navigate = useNavigate();

  const offers = [
    { title: "Audit linguistique gratuit", desc: "Évaluation des niveaux et des besoins.", cta: "Demander un audit" },
    { title: "Anglais des affaires", desc: "Réunions, négociations, présentations.", cta: "En savoir plus" },
    { title: "Préparation certifications", desc: "TOEIC, TOEFL, IELTS – sessions intensives.", cta: "Demander un devis" },
    { title: "Coaching professionnel", desc: "Cours individuels pour cadres dirigeants.", cta: "Réserver un créneau" },
  ];

  return (
   <>
    <div className="corporate-offers">
      <h1>Nos offres corporate</h1>
      <div className="offers-grid">
        {offers.map((offer, idx) => (
          <div key={idx} className="offer-card">
            <h3>{offer.title}</h3>
            <p>{offer.desc}</p>
            <button onClick={() => navigate("/parcours/entreprise/formulaire")} className="btn-outline">
              {offer.cta}
            </button>
          </div>
        ))}
      </div>
      <div className="cta-bulk">
        <button onClick={() => navigate("/parcours/entreprise/formulaire")} className="btn-primary">
          Demander un devis personnalisé →
        </button>
      </div>
    </div>
    <Footer/>
   </>
  );
};

export default CorporateOffers;