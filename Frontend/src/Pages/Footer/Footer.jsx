import React, { useState } from "react";
import "./Footer.css";
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // 'success', 'error', 'duplicate'
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);   // { type, message }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      showToast("error", "Adresse email invalide");
      setTimeout(() => setStatus(null), 3000);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus("success");
        showToast("success", "Inscription réussie !");
        setEmail("");
        setTimeout(() => setStatus(null), 4000);
      } else if (response.status === 409) {
        setStatus("duplicate");
        showToast("error", "Cet email est déjà inscrit.");
        setTimeout(() => setStatus(null), 4000);
      } else {
        setStatus("error");
        showToast("error", "Erreur serveur, veuillez réessayer.");
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (err) {
      console.error("Erreur inscription newsletter:", err);
      setStatus("error");
      showToast("error", "Erreur de connexion au serveur.");
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Colonne 1 - Logo & description */}
        <div className="footer-col">
          <div className="footer-logo-wrapper">
            <img src="/assets/BIINIES-ENGLISH-LOGO.png" alt={t('footer.logo_alt')} className="logo-img" />
          </div>
          <p className="footer-description">
            {t('footer.description')}
          </p>
          <div className="social-links">
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <i className="fa-brands fa-facebook"></i>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <i className="fa-brands fa-linkedin"></i>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <i className="fa-brands fa-tiktok"></i>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
              <i className="fa-brands fa-x-twitter"></i>
            </a>
          </div>
        </div>

        {/* Colonne 2 - Liens rapides */}
        <div className="footer-col">
          <h4>{t('footer.quick_links')}</h4>
          <ul>
            <li><a href="/">{t('footer.home')}</a></li>
            <li><a href="/cours/en-ligne">{t('footer.courses')}</a></li>
            <li><a href="/certification/toeic">{t('footer.certifications')}</a></li>
            <li><a href="/parcours/entreprise">{t('footer.pro_training')}</a></li>
            <li><a href="/blog/erreurs-anglais">{t('footer.blog')}</a></li>
          </ul>
        </div>

        {/* Colonne 3 - Formations */}
        <div className="footer-col">
          <h4>{t('footer.trainings')}</h4>
          <ul>
            <li><a href="/cours/en-ligne">{t('footer.general_english')}</a></li>
            <li><a href="/certification/toeic">{t('footer.toeic_prep')}</a></li>
            <li><a href="/certification/toefl">{t('footer.toefl_prep')}</a></li>
            <li><a href="/service/affaires">{t('footer.business_english')}</a></li>
            <li><a href="/parcours/particulier/enfants">{t('footer.kids_teens')}</a></li>
          </ul>
        </div>

        {/* Colonne 4 - Newsletter + Contact */}
        <div className="footer-col footer-newsletter-col">
          <h4>{t('footer.newsletter')}</h4>
          <p className="newsletter-text">
            {t('footer.newsletter_text')}
          </p>
          <form className="footer-newsletter-form" onSubmit={handleSubmit}>
            <div className="footer-input-group">
              <input
                type="email"
                placeholder={t('footer.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? "..." : t('footer.ok')}
              </button>
            </div>
            {status === "success" && (
              <div className="footer-message success">✅ {t('footer.subscribed')}</div>
            )}
            {status === "error" && (
              <div className="footer-message error">📧 {t('footer.invalid_email')}</div>
            )}
            {status === "duplicate" && (
              <div className="footer-message error">📧 Cet email est déjà inscrit !</div>
            )}
          </form>
          <div className="footer-contact-compact">
            <p>📍 Abidjan, Côte d'Ivoire</p>
            <p>📞 +225 00 00 00 00</p>
            <p>✉️ {t('footer.email')}</p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        <div className="footer-legal">
          <a href="/legal">{t('footer.legal_notice')}</a>
          <span>|</span>
          <a href="/privacy">{t('footer.privacy_policy')}</a>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`footer-toast footer-toast--${toast.type}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      )}
    </footer>
  );
};

export default Footer;