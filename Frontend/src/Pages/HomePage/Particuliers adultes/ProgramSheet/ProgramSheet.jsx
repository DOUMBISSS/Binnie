// src/pages/ProgramSheet.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProgramSheet.css";
import Footer from "../../../Footer/Footer";

const programs = {
  1: { title: "Anglais général – 3 mois", description: "Cours intensifs pour acquérir les bases ou consolider. Grammaire, vocabulaire, expression orale.", syllabus: ["Module 1 : Present simple & continuous", "Module 2 : Past tenses", "Module 3 : Future forms", "Module 4 : Communication quotidienne"], duration: "60h", price: "450€" },
  2: { title: "Préparation TOEIC", description: "Entraînement spécifique, stratégies de test, simulations. Objectif score 800+.", syllabus: ["Listening strategies", "Reading techniques", "Mock exams", "Grammar review"], duration: "40h", price: "390€" },
  3: { title: "Anglais des affaires", description: "Réunions, négociations, emails professionnels.", syllabus: ["Business vocabulary", "Meeting simulations", "Presentation skills", "Email writing"], duration: "50h", price: "520€" },
  4: { title: "Conversation intensif", description: "Pratique orale intensive pour gagner en aisance.", syllabus: ["Debates", "Role plays", "Idioms", "Fluency drills"], duration: "30h", price: "280€" },
};

const ProgramSheet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const program = programs[id];

  if (!program) return <div>Programme non trouvé</div>;

  return (
  <>
    <div className="program-sheet">
      <h1>{program.title}</h1>
      <p className="desc">{program.description}</p>
      <div className="details">
        <span>⏱️ Durée : {program.duration}</span>
        <span>💰 Tarif : {program.price}</span>
      </div>
      <h2>Programme détaillé</h2>
      <ul>
        {program.syllabus.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
      <div className="actions">
        <button onClick={() => navigate("/parcours/particulier/test-niveau")} className="btn-primary">
          Commencer le test de niveau →
        </button>
      </div>
    </div>
    <Footer/>
  </>
  );
};

export default ProgramSheet;