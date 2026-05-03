import React, { useState } from "react";
import "./ProgramsSection.css";

const ProgramsSection = () => {
  const [selectedProgram, setSelectedProgram] = useState(null);

  const programs = [
    {
      id: 1,
      title: "TOEFL CERTIFICATION",
      shortDesc: "Préparer votre examen de TOEFL...",
      fullDesc: "Notre préparation TOEFL vous offre : cours intensifs, simulations d'examen, stratégies de compréhension orale et écrite. Durée : 8 semaines. Tarif : 450€.",
      image: "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=400&q=80",
      icon: "🌎",
    },
    {
      id: 2,
      title: "IELTS CERTIFICATION",
      shortDesc: "Préparer votre examen de IELTS...",
      fullDesc: "Préparation complète à l'IELTS : Academic et General Training. Entraînement aux 4 compétences, correction personnalisée. Durée : 10 semaines. Tarif : 520€.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&q=80",
      icon: "🇬🇧",
    },
    {
      id: 3,
      title: "TOEIC CERTIFICATION",
      shortDesc: "Préparer votre examen de TOEIC...",
      fullDesc: "Boostez votre score TOEIC grâce à nos méthodes éprouvées : 15 tests blancs, focus sur le vocabulaire professionnel. Durée : 6 semaines. Tarif : 390€.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80",
      icon: "📊",
    },
    {
      id: 4,
      title: "COURS DE PRÉPARATION",
      shortDesc: "Préparation sur mesure pour tous niveaux",
      fullDesc: "Cours particuliers ou en petit groupe, adaptés à vos objectifs (entretien, mobilité, études). Planning flexible. Tarif : à partir de 35€/h.",
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80",
      icon: "🎯",
    },
  ];

  const openModal = (program) => {
    setSelectedProgram(program);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedProgram(null);
    document.body.style.overflow = "auto";
  };

  return (
    <section className="programs-section">
      <div className="programs-container">
        <div className="section-header">
          <span className="section-badge">CARACTÉRISTIQUES UNIQUES</span>
          <h2>QUE VOULEZ-VOUS PRÉPARER ?</h2>
          <div className="header-line"></div>
        </div>

        <div className="programs-grid">
          {programs.map((program) => (
            <div
              key={program.id}
              className="program-card"
              onClick={() => openModal(program)}
            >
              <div className="program-image">
                <img src={program.image} alt={program.title} />
                <div className="program-overlay">
                  <span className="program-icon">{program.icon}</span>
                </div>
              </div>
              <div className="program-content">
                <h3>{program.title}</h3>
                <p>{program.shortDesc}</p>
                <div className="card-footer">
                  <span className="learn-more">En savoir plus →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedProgram && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>
            <div className="modal-header">
              <div className="modal-icon">{selectedProgram.icon}</div>
              <h3>{selectedProgram.title}</h3>
            </div>
            <div className="modal-body">
              <img
                src={selectedProgram.image}
                alt={selectedProgram.title}
                className="modal-image"
              />
              <p className="modal-description">{selectedProgram.fullDesc}</p>
              <button className="modal-cta" onClick={() => alert("Inscription en cours...")}>
                S'inscrire maintenant
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProgramsSection;