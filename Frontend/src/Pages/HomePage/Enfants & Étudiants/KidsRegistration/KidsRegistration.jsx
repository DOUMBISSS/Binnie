// src/Pages/HomePage/Particuliers/KidsRegistration.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./KidsRegistration.css";
import Footer from "../../../Footer/Footer";
import { insertInscriptionEnfant } from "../../../../services/formsService";

const KidsRegistration = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    childFirstName: "", childLastName: "", birthDate: "", ageGroup: "",
    parentName: "", parentEmail: "", parentPhone: "", address: "", notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await insertInscriptionEnfant({ prenom_enfant: form.childFirstName, nom_enfant: form.childLastName, date_naissance: form.birthDate || null, tranche_age: form.ageGroup || null, nom_parent: form.parentName, email_parent: form.parentEmail, telephone_parent: form.parentPhone, adresse: form.address || null, notes: form.notes || null });
      localStorage.setItem("kidToken", "demo-kid-token");
      localStorage.setItem("kidEmail", form.parentEmail);
      setSubmitting(false);
      navigate("/espace-apprenant");
    } catch (err) {
      console.error("Erreur inscription enfant:", err);
      setSubmitting(false);
    }
  };

  return (
   <>
    <div className="kids-registration">
      <h1>Inscription – Programme enfant/étudiant</h1>
      <form onSubmit={handleSubmit}>
        <h3>Informations de l’enfant</h3>
        <input type="text" name="childFirstName" placeholder="Prénom de l'enfant *" required onChange={handleChange} />
        <input type="text" name="childLastName" placeholder="Nom de l'enfant *" required onChange={handleChange} />
        <input type="date" name="birthDate" placeholder="Date de naissance" onChange={handleChange} />
        <select name="ageGroup" required onChange={handleChange}>
          <option value="">Tranche d'âge</option>
          <option value="3-6">3-6 ans</option>
          <option value="7-12">7-12 ans</option>
          <option value="13-17">13-17 ans</option>
          <option value="etudiant">Étudiant (18-25 ans)</option>
        </select>

        <h3>Informations du parent / tuteur</h3>
        <input type="text" name="parentName" placeholder="Nom complet *" required onChange={handleChange} />
        <input type="email" name="parentEmail" placeholder="Email *" required onChange={handleChange} />
        <input type="tel" name="parentPhone" placeholder="Téléphone *" required onChange={handleChange} />
        <input type="text" name="address" placeholder="Adresse (optionnel)" onChange={handleChange} />
        <textarea name="notes" placeholder="Notes particulières (allergies, besoins spécifiques...)" rows="3" onChange={handleChange}></textarea>

        <button type="submit" disabled={submitting}>{submitting ? "Inscription..." : "S’inscrire et accéder à l’espace"}</button>
      </form>
    </div>
    <Footer/>
   </>
  );
};

export default KidsRegistration;