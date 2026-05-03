// src/components/SimulateurButton.jsx
import React, { useState } from "react";
import { createPortal } from "react-dom";
import SimulateurFormationModal from "./SimulateurFormationModal";

const SimulateurButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "360px",
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
        <span style={{ fontSize: "28px" }}>📊</span>
      </button>

      {/* Modale avec le simulateur */}
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
                width: "95%",
                maxWidth: "1100px",
                height: "90vh",
                maxHeight: "800px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                animation: "slideUp 0.3s ease",
              }}
            >
              {/* En-tête de la modale */}
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
                  📊 Simulateur de formation BET
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

              {/* Contenu du simulateur (scrollable) */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                <SimulateurFormationModal onClose={() => setIsOpen(false)} />
              </div>
            </div>
          </div>,
          document.body
        )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default SimulateurButton;