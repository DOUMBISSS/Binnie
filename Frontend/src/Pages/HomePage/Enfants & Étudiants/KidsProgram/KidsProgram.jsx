// src/Pages/HomePage/Particuliers/KidsProgram.jsx (modifié)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./KidsProgram.css";
import Footer from "../../../Footer/Footer";

const KidsProgram = () => {
  const navigate = useNavigate();
  const [ageGroup, setAgeGroup] = useState("3-6");

  const programs = {
    "3-6": { title: "Petits explorateurs (3-6 ans)", description: "Découverte de l’anglais par le jeu, chansons et histoires.", duration: "30min/séance", price: "120€/mois", type: "kid" },
    "7-12": { title: "Juniors (7-12 ans)", description: "Grammaire, vocabulaire, expression orale – approche interactive.", duration: "45min/séance", price: "150€/mois", type: "kid" },
    "13-17": { title: "Ados (13-17 ans)", description: "Préparation aux examens (TOEFL Junior), débats, culture.", duration: "60min/séance", price: "180€/mois", type: "kid" },
    "etudiant": { title: "Étudiants (18-25 ans)", description: "Anglais académique, préparation IELTS/TOEIC.", duration: "90min/séance", price: "200€/mois", type: "student" },
  };

  const current = programs[ageGroup];

  const handleChoose = () => {
    if (current.type === "kid") {
      navigate("/parcours/particulier/enfants/inscription");
    } else {
      navigate("/parcours/particulier/etudiants/inscription");
    }
  };

  return (
  <>
    <div className="kids-program">
      <h1>Programmes adaptés à chaque âge</h1>
      <div className="age-selector">
        {Object.keys(programs).map(key => (
          <button key={key} className={`age-btn ${ageGroup === key ? "active" : ""}`} onClick={() => setAgeGroup(key)}>
            {key === "3-6" && "3-6 ans"}
            {key === "7-12" && "7-12 ans"}
            {key === "13-17" && "13-17 ans"}
            {key === "etudiant" && "Étudiants (18-25 ans)"}
          </button>
        ))}
      </div>
      <div className="program-card">
        <h2>{current.title}</h2>
        <p>{current.description}</p>
        <p>⏱️ Durée : {current.duration}</p>
        <p>💰 Tarif : {current.price}</p>
        <button onClick={handleChoose} className="btn-primary">
          Je choisis ce programme →
        </button>
      </div>
    </div>
    <Footer/>
  </>
  );
};

export default KidsProgram;