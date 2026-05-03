// src/pages/CorporateForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Corporate.css";
import Footer from "../../Footer/Footer";
import { insertDemandeEntreprise } from "../../../services/formsService";

const CorporateForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company: "", contact: "", email: "", phone: "", employees: "", message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErreur("");
    try {
      await insertDemandeEntreprise({ entreprise: form.company, contact: form.contact, email: form.email, telephone: form.phone, nb_employes: form.employees || null, besoins: form.message || null });
      setSubmitting(false);
      navigate("/parcours/entreprise/confirmation");
    } catch (err) {
      console.error("Erreur entreprise:", err);
      setErreur("Une erreur est survenue. Veuillez réessayer.");
      setSubmitting(false);
    }
  };

  return (
  <>
    <div className="corporate-form">
      <h1>Demande d’audit gratuit / Devis</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="company" placeholder="Nom de l'entreprise *" required onChange={handleChange} />
        <input type="text" name="contact" placeholder="Personne de contact *" required onChange={handleChange} />
        <input type="email" name="email" placeholder="Email *" required onChange={handleChange} />
        <input type="tel" name="phone" placeholder="Téléphone *" required onChange={handleChange} />
        <select name="employees" onChange={handleChange}>
          <option value="">Nombre de collaborateurs</option>
          <option value="1-5">1-5</option><option value="6-20">6-20</option>
          <option value="21-50">21-50</option><option value="50+">50+</option>
        </select>
        <textarea name="message" placeholder="Vos besoins spécifiques..." rows="4" onChange={handleChange}></textarea>
        <button type="submit" disabled={submitting}>{submitting ? "Envoi..." : "Envoyer la demande"}</button>
        {erreur && <p style={{color:"#dc2626",marginTop:10,fontSize:".88rem"}}>{erreur}</p>}
      </form>
    </div>
    <Footer/>
  </>
  );
};

export default CorporateForm;