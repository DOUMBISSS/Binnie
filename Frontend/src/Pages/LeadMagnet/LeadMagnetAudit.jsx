// src/Pages/LeadMagnet/LeadMagnetAudit.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LeadMagnet.css";
import Footer from "../Footer/Footer";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

const LeadMagnetAudit = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErreur("");
    try {
      const res = await fetch(`${API}/api/leads/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom:       form.name,
          email:     form.email,
          telephone: form.phone || null,
          objectif:  form.company ? `Entreprise : ${form.company}` : null,
        }),
      });
      if (!res.ok) throw new Error();
      localStorage.setItem("leadEmail", form.email);
      navigate("/lead-magnet/merci");
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
   <>
    <div className="lead-magnet">
      <div className="lead-card">
        <h1>Audit linguistique gratuit</h1>
        <p>Recevez une évaluation personnalisée de votre niveau + un plan de progression sur 3 mois.</p>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Nom complet *" required onChange={handleChange} />
          <input type="email" name="email" placeholder="Email *" required onChange={handleChange} />
          <input type="tel" name="phone" placeholder="Téléphone" onChange={handleChange} />
          <input type="text" name="company" placeholder="Entreprise (optionnel)" onChange={handleChange} />
          {erreur && <p style={{ color:"#dc2626", fontSize:"0.85rem", margin:"4px 0" }}>⚠ {erreur}</p>}
          <button type="submit" disabled={submitting}>{submitting ? "Envoi..." : "Je réserve mon audit"}</button>
        </form>
        <p className="legal">Sans engagement. Un conseiller vous recontactera sous 48h.</p>
      </div>
    </div>
    <Footer/>
   </>
  );
};

export default LeadMagnetAudit;