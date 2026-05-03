// src/pages/LevelTest.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LevelTest.css";

const questions = [
  { id: 1, text: "What ______ your name?", options: ["is", "are", "am"], correct: "is", level: "A1" },
  { id: 2, text: "She ______ to school every day.", options: ["go", "goes", "going"], correct: "goes", level: "A1" },
  { id: 3, text: "I ______ a student last year.", options: ["am", "was", "were"], correct: "was", level: "A2" },
  { id: 4, text: "If I ______ you, I would study more.", options: ["was", "were", "am"], correct: "were", level: "B1" },
  { id: 5, text: "By next year, I ______ here for 5 years.", options: ["will work", "will have worked", "work"], correct: "will have worked", level: "B2" },
];

const LevelTest = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [level, setLevel] = useState("");

  const handleAnswer = (qId, answer) => {
    setAnswers({ ...answers, [qId]: answer });
  };

  const computeLevel = () => {
    let correct = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct) correct++; });
    const ratio = correct / questions.length;
    if (ratio < 0.4) return "Débutant (A1)";
    if (ratio < 0.7) return "Intermédiaire (A2-B1)";
    return "Avancé (B2-C1)";
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length !== questions.length) {
      alert("Veuillez répondre à toutes les questions");
      return;
    }
    const computed = computeLevel();
    setLevel(computed);
    setSubmitted(true);
    // Sauvegarde du résultat (localStorage ou API)
    localStorage.setItem("levelTestResult", computed);
  };

  const proceedToRegistration = () => {
    navigate("/parcours/particulier/inscription", { state: { level } });
  };

  if (submitted) {
    return (
      <div className="level-test-result">
        <h2>Votre niveau estimé :</h2>
        <div className="result-badge">{level}</div>
        <p>Ce test nous permet de vous proposer le programme adapté.</p>
        <button onClick={proceedToRegistration} className="btn-primary">
          Poursuivre l’inscription →
        </button>
        <button onClick={() => navigate("/parcours/particulier/offres")} className="btn-secondary">
          Voir les offres
        </button>
      </div>
    );
  }

  return (
   <>
    <div className="level-test">
      <h1>Test de niveau gratuit</h1>
      <p>5 questions pour évaluer votre niveau.</p>
      {questions.map(q => (
        <div key={q.id} className="question">
          <p>{q.text}</p>
          <div className="options">
            {q.options.map(opt => (
              <label key={opt}>
                <input type="radio" name={`q${q.id}`} value={opt} onChange={() => handleAnswer(q.id, opt)} />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={handleSubmit} className="btn-primary">Valider mes réponses</button>
    </div>
   </>
  );
};

export default LevelTest;