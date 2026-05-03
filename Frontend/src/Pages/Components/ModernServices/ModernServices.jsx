import React from "react";
import "./ModernServices.css";

const ModernServices = () => {
  const features = [
    {
      title: "COURS INTENSIFS",
      description:
        "Apprendre de manière accélérée sur une courte période et développer vos compétences linguistiques à des fins professionnelles.",
      icon: "⚡", // ou une icône SVG
    },
    {
      title: "BOOSTEZ VOTRE NIVEAU D'ANGLAIS",
      description:
        "Passez à une autre étape de votre carrière grâce à la langue Anglaise.",
      icon: "🚀",
    },
    {
      title: "CERTIFICATION",
      description:
        "Préparez vos Certifications avec nous, c'est s'ouvrir aux opportunités du monde.",
      icon: "🎓",
    },
  ];

  return (
    <section className="modern-services">
      <div className="container">
        {/* Grille des 3 cartes */}
        <div className="features-grid">
          {features.map((item, idx) => (
            <div className="feature-card" key={idx}>
              <div className="card-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="card-hover-effect"></div>
            </div>
          ))}
        </div>

        {/* Bloc "Cabinet agréé" */}
        <div className="certification-block">
          <div className="cert-badge">CABINET DE FORMATION AGRÉÉ</div>
          <div className="cert-content">
            <div className="cert-left">
              <h2>CERTIFICATION</h2>
              <p>
                BET est un cabinet de langue agréé de l'État spécialisé dans
                l'enseignement de la langue anglaise pour particuliers et
                entreprises avec certification en fin de formation.
              </p>
              <button className="btn-savoir">SAVOIR PLUS →</button>
            </div>
            <div className="cert-right">
              {/* Image ou illustration (optionnelle) */}
              <div className="cert-illustration">
                <div className="circle-animation"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernServices;