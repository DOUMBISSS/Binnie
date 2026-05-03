import React, { useEffect, useState } from "react";
import "./slider.css";

const slides = [
  {
    title: "Cours intensifs",
    subtitle: "Apprendre de manière accélérée sur une courte période et développer vos compétences linguistiques à des fins professionnelles.",
    button: "Découvrir nos cours",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644"
  },
  {
    title: "Préparez vos certifications",
    subtitle: "TOEIC • TOEFL • IELTS",
    button: "S’inscrire maintenant",
    image: "https://images.unsplash.com/photo-1584697964358-3e14ca57658b"
  },
  {
    title: "Boostez votre carrière",
    subtitle: "Formation professionnelle & accompagnement",
    button: "Voir nos services",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978"
  }
];

const Slider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="slider">

      {slides.map((slide, index) => (
        <div
          key={index}
          className={`slide ${index === current ? "active" : ""}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="overlay"></div>

          <div className="content">
            <h1>{slide.title}</h1>
            <p>{slide.subtitle}</p>
            <button>{slide.button}</button>
          </div>
        </div>
      ))}

      {/* DOTS */}
      <div className="dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={index === current ? "active" : ""}
            onClick={() => setCurrent(index)}
          ></span>
        ))}
      </div>

    </div>
  );
};

export default Slider;