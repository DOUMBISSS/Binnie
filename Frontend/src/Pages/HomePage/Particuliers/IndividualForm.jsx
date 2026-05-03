// src/pages/IndividualForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../Footer/Footer";
import { insertLeadParticulier } from "../../../services/formsService";

const IndividualForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", level: "", goal: "" });
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErreur("");
    try {
      await insertLeadParticulier({ nom: form.name, email: form.email, telephone: form.phone, niveau: form.level || null, objectif: form.goal || null });
      setSubmitting(false);
      navigate("/parcours/particulier/confirmation");
    } catch (err) {
      console.error("Erreur particulier:", err);
      setErreur("Une erreur est survenue. Veuillez réessayer.");
      setSubmitting(false);
    }
  };

  return (
  <>
    <div className="corporate-form"> {/* réutilise le même style */}
      <h1>Un cours d’essai gratuit ?</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Nom complet *" required onChange={e => setForm({...form, name: e.target.value})} />
        <input type="email" placeholder="Email *" required onChange={e => setForm({...form, email: e.target.value})} />
        <input type="tel" placeholder="Téléphone *" required onChange={e => setForm({...form, phone: e.target.value})} />
        <select onChange={e => setForm({...form, level: e.target.value})}>
          <option value="">Votre niveau</option>
          <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option>
        </select>
        <textarea placeholder="Objectif (TOEIC, voyage, entretien...)" onChange={e => setForm({...form, goal: e.target.value})} />
        <button type="submit" disabled={submitting}>{submitting ? "Envoi..." : "Réserver mon essai"}</button>
        {erreur && <p style={{color:"#dc2626",marginTop:10,fontSize:".88rem"}}>{erreur}</p>}
      </form>
    </div>
    <Footer/>
  </>
  );
};

export default IndividualForm;