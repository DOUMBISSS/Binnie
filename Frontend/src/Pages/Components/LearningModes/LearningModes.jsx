import React from "react";
import "./LearningModes.css";

const LearningModes = () => {
  const modes = [
    {
      title: "Cours en ligne",
      description:
        "Chez vous, apprenez via e-learning par visio conférence.",
      icon: "💻",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
      features: ["Classes en direct", "Ressources téléchargeables", "Suivi personnalisé"],
    },
    {
      title: "Cours aux cabinets",
      description:
        "Des solutions personnalisées avec des locuteurs natifs.",
      icon: "🏢",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
      features: ["Groupes réduits", "Immersion totale", "Matériel fourni"],
    },
    {
      title: "Cours à domicile",
      description:
        "Décidez des jours qui correspondent à vos calendriers.",
      icon: "🏠",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
      features: ["Professeur à domicile", "Horaires flexibles", "Progression sur mesure"],
    },
  ];

  return (
    <section className="learning-modes">
      <div className="modes-container">
        <div className="section-header">
          <span className="section-badge">SUIVEZ LES COURS SELON VOTRE CONVENANCE</span>
          <h2>COMMENT VOULEZ-VOUS APPRENDRE ?</h2>
          <div className="header-line"></div>
        </div>

        <div className="modes-grid">
          {modes.map((mode, index) => (
            <div className="mode-card" key={index}>
              <div className="card-image">
                <img src={mode.image} alt={mode.title} />
                <div className="card-overlay">
                  <div className="mode-icon">{mode.icon}</div>
                </div>
              </div>
              <div className="card-content">
                <h3>{mode.title}</h3>
                <p>{mode.description}</p>
                <ul className="features-list">
                  {mode.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
                <button className="mode-btn">Je choisis cette formule →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LearningModes;