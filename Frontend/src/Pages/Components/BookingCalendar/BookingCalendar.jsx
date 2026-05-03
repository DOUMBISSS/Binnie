import React, { useState } from "react";
import { createPortal } from "react-dom";

/**
 * Composant d'intégration Cal.com
 * @param {string} calUrl - URL publique de votre événement Cal.com (ex: https://cal.com/username/30min)
 * @param {string} buttonPosition - bottom / right (par défaut "bottom:80px, right:20px")
 */
const BookingCalendar = ({ calUrl, buttonStyle = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // URL par défaut (remplacez par la vôtre)
  const defaultUrl = "https://cal.com/username/30min";
  const finalUrl = calUrl || defaultUrl;

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "200px",
          right: "20px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1e3a8a, #0891b2)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          transition: "transform 0.2s, box-shadow 0.2s",
          ...buttonStyle,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
        }}
      >
        <span style={{ fontSize: "28px" }}>📅</span>
      </button>

      {/* Modale avec iframe Cal.com */}
      {isOpen &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              animation: "fadeIn 0.2s ease",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "24px",
                width: "90%",
                maxWidth: "900px",
                height: "85vh",
                maxHeight: "750px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                animation: "slideUp 0.3s ease",
              }}
            >
              {/* En‑tête */}
              <div
                style={{
                  padding: "14px 20px",
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#0f172a" }}>
                  📅 Prendre rendez-vous
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "26px",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "0 8px",
                    lineHeight: 1,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                >
                  ×
                </button>
              </div>

              {/* Contenu iframe */}
              <div style={{ flex: 1, position: "relative" }}>
                {!iframeLoaded && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        border: "4px solid #e2e8f0",
                        borderTopColor: "#1e3a8a",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <p style={{ marginTop: "12px", color: "#64748b" }}>Chargement du calendrier...</p>
                  </div>
                )}
                <iframe
                  src={finalUrl}
                  title="Cal.com - Prise de rendez-vous"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0, opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
                  onLoad={() => setIframeLoaded(true)}
                  onError={() => console.warn("Erreur de chargement Cal.com")}
                />
                {/* Fallback si l'iframe est bloqué */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#94a3b8",
                    background: "rgba(255,255,255,0.8)",
                    padding: "4px",
                  }}
                >
                  Si le calendrier ne s'affiche pas,{" "}
                  <a href={finalUrl} target="_blank" rel="noopener noreferrer">
                    cliquez ici
                  </a>
                  .
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Animations (intégrées une seule fois) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default BookingCalendar;