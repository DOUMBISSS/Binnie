// src/Pages/HomePage/Particuliers/StudentRegistration.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentRegistration.css";
import Footer from "../../../Footer/Footer";
import { insertInscriptionEtudiant } from "../../../../services/formsService";

const StudentRegistration = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: "", lastname: "", birthDate: "",
    email: "", phone: "",
    institution: "", fieldOfStudy: "", studyYear: "",
    notes: "",
    dataConsent: false
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dataConsent) {
      alert("Vous devez accepter la politique de confidentialité.");
      return;
    }
    setSubmitting(true);
    try {
      await insertInscriptionEtudiant({ prenom: form.firstname, nom: form.lastname, date_naissance: form.birthDate || null, email: form.email, telephone: form.phone, etablissement: form.institution || null, filiere: form.fieldOfStudy || null, annee_etudes: form.studyYear || null, notes: form.notes || null, consentement_donnees: form.dataConsent });
      localStorage.setItem("studentToken", "demo-student-token");
      localStorage.setItem("studentEmail", form.email);
      localStorage.setItem("isStudent", "true");
      setSubmitting(false);
      navigate("/espace-apprenant");
    } catch (err) {
      console.error("Erreur inscription étudiant:", err);
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="student-registration">
      <h1>Inscription – Programme étudiant (18‑25 ans)</h1>
      <form onSubmit={handleSubmit}>
        <h3>Informations personnelles</h3>
        <input type="text" name="firstname" placeholder="Prénom *" required onChange={handleChange} />
        <input type="text" name="lastname" placeholder="Nom *" required onChange={handleChange} />
        <input type="date" name="birthDate" placeholder="Date de naissance" required onChange={handleChange} />
        <input type="email" name="email" placeholder="Email *" required onChange={handleChange} />
        <input type="tel" name="phone" placeholder="Téléphone *" required onChange={handleChange} />

        <h3>Informations académiques</h3>
        <input type="text" name="institution" placeholder="Établissement / Université" onChange={handleChange} />
        <input type="text" name="fieldOfStudy" placeholder="Filière / Spécialité" onChange={handleChange} />
        <select name="studyYear" onChange={handleChange}>
          <option value="">Année d'étude</option>
          <option value="L1">Licence 1</option>
          <option value="L2">Licence 2</option>
          <option value="L3">Licence 3</option>
          <option value="M1">Master 1</option>
          <option value="M2">Master 2</option>
          <option value="Doctorat">Doctorat</option>
        </select>

        <textarea name="notes" placeholder="Objectifs spécifiques (préparation examen, mobilité...)" rows="3" onChange={handleChange}></textarea>

        <div className="consent">
          <label>
            <input type="checkbox" name="dataConsent" checked={form.dataConsent} onChange={handleChange} required />
            J’accepte le traitement de mes données personnelles.
          </label>
        </div>

        <button type="submit" disabled={submitting}>{submitting ? "Inscription..." : "M'inscrire"}</button>
      </form>
    </div>
    <Footer/>
    </>
  );
};

export default StudentRegistration;