// src/pages/LearnerSpace.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LearnerSpace.css";
import Footer from "../../../Footer/Footer";

const LearnerSpace = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté (simulation)
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/parcours/particulier/inscription");
      return;
    }
    // Charger infos utilisateur
    setUser({ name: "Jean Dupont", email: localStorage.getItem("userEmail"), level: localStorage.getItem("levelTestResult") });
    setCourses([
      { id: 1, title: "Anglais général – Module 1", progress: 60 },
      { id: 2, title: "Préparation TOEIC – Listening", progress: 30 },
    ]);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  return (
    <>
    <div className="learner-space">
      <header>
        <h1>Mon espace apprenant</h1>
        <button onClick={handleLogout} className="btn-logout">Déconnexion</button>
      </header>
      <div className="dashboard">
        <div className="profile-card">
          <h3>Bienvenue, {user?.name}</h3>
          <p>Email : {user?.email}</p>
          <p>Niveau : {user?.level}</p>
        </div>
        <div className="courses-section">
          <h2>Mes cours en cours</h2>
          {courses.map(c => (
            <div key={c.id} className="course-item">
              <span>{c.title}</span>
              <div className="progress-bar"><div style={{ width: `${c.progress}%` }}></div></div>
              <span>{c.progress}%</span>
            </div>
          ))}
        </div>
        <div className="resources">
          <h3>Ressources disponibles</h3>
          <ul>
            <li><a href="#">Grammaire interactive</a></li>
            <li><a href="#">Exercices TOEIC</a></li>
            <li><a href="#">Planning des cours live</a></li>
          </ul>
        </div>
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default LearnerSpace;