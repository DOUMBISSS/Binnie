// src/pages/RegistrationForm.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./RegistrationForm.css";
import Footer from "../../../Footer/Footer";
import { insertInscriptionAdulte } from "../../../../services/formsService";

const RegistrationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [level, setLevel] = useState(location.state?.level || localStorage.getItem("levelTestResult") || "Non évalué");
  const [form, setForm] = useState({ fullname: "", email: "", phone: "", birthDate: "", offerId: "" });
  const [offers, setOffers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    // Récupération des offres (simulée)
    setOffers([
      { id: 1, title: "Anglais général – 3 mois" },
      { id: 2, title: "Préparation TOEIC" },
      { id: 3, title: "Anglais des affaires" },
      { id: 4, title: "Conversation intensif" },
    ]);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErreur("");
    try {
      const offre = offers.find(o => String(o.id) === String(form.offerId));
      await insertInscriptionAdulte({ nom_complet: form.fullname, email: form.email, telephone: form.phone, date_naissance: form.birthDate || null, offre_id: form.offerId || null, offre_titre: offre?.title || null, niveau_detecte: level });
      localStorage.setItem("userToken", "demo-token");
      localStorage.setItem("userEmail", form.email);
      setSubmitting(false);
      navigate("/espace-apprenant");
    } catch (err) {
      console.error("Erreur inscription adulte:", err);
      setErreur("Erreur lors de l'inscription. Vérifiez votre connexion et réessayez.");
      setSubmitting(false);
    }
  };

  return (
  <>
    <div className="registration-form">
      <h1>Finalisez votre inscription</h1>
      <div className="level-info">Niveau détecté : <strong>{level}</strong></div>
      <form onSubmit={handleSubmit}>
        <input type="text" name="fullname" placeholder="Nom complet *" required onChange={handleChange} />
        <input type="email" name="email" placeholder="Email *" required onChange={handleChange} />
        <input type="tel" name="phone" placeholder="Téléphone *" required onChange={handleChange} />
        <input type="date" name="birthDate" placeholder="Date de naissance" onChange={handleChange} />
        <select name="offerId" required onChange={handleChange}>
          <option value="">Choisissez une offre</option>
          {offers.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
        <button type="submit" disabled={submitting}>{submitting ? "Inscription..." : "S’inscrire et accéder à mon espace"}</button>
        {erreur && <p style={{color:"#dc2626",marginTop:10,fontSize:".88rem"}}>{erreur}</p>}
      </form>
    </div>
    <Footer/>
  </>
  );
};

export default RegistrationForm;