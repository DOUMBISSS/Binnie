// src/components/WhatsAppButton.jsx
import React from "react";
import "./WhatsAppButton.css";

const WhatsAppButton = () => {
  // Remplace par ton numéro WhatsApp Business (format international sans le +)
  const phoneNumber = "221781234567"; // Exemple : 221781234567 pour +221 78 123 45 67
  // Message pré-rempli (optionnel)
  const message = encodeURIComponent(
    "Bonjour ! Je viens de visiter votre site EnglishBoost et j’aimerais avoir plus d’informations."
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      className="whatsapp-button"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactez-nous sur WhatsApp"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp"
        className="whatsapp-icon"
      />
    </a>
  );
};

export default WhatsAppButton;