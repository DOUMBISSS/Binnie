import React, { useState } from "react";
import "./Newsletter.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // 'success', 'error', null
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus(null), 4000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="newsletter">
      <div className="newsletter-bg-decoration"></div>
      <div className="newsletter-container">
        <div className="newsletter-content">
          <div className="newsletter-icon">📧</div>
          <h2>Restez informé(e)</h2>
          <p>
            Recevez nos actualités, offres spéciales et conseils pour
            progresser en anglais directement dans votre boîte mail.
          </p>

          <form className="newsletter-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Votre adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? "..." : "S'abonner"}
              </button>
            </div>
            {status === "success" && (
              <div className="newsletter-message success">
                ✅ Merci ! Vous êtes bien inscrit.
              </div>
            )}
            {status === "error" && (
              <div className="newsletter-message error">
                ⚠️ Veuillez entrer un email valide.
              </div>
            )}
          </form>

          <p className="newsletter-note">
            Aucun spam, désinscription facile. Vos données sont sécurisées.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;