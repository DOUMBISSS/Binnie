import React, { useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

/**
 * Bouton "Payer avec CinetPay"
 *
 * Props:
 *   clientInfo  : { nom, prenom, email, telephone, ville }
 *   offreInfo   : { key, label, formule, type }
 *   niveau      : string  (ex: "Débutant")
 *   objectif    : string  (ex: "TOEIC 750")
 *   message     : string  (message libre)
 *   montant     : number  (en FCFA)
 *   label       : string  (texte du bouton, optionnel)
 *   onError     : function(msg) (optionnel)
 */
const CinetPayButton = ({ clientInfo, offreInfo, niveau, objectif, message, montant, label, onError, style }) => {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!clientInfo?.email?.trim()) {
      alert("Veuillez saisir votre email avant de payer.");
      return;
    }
    if (!montant || montant <= 0) {
      alert("Montant invalide.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cinetpay/initiate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_nom:       clientInfo.nom,
          client_prenom:    clientInfo.prenom,
          client_email:     clientInfo.email,
          client_telephone: clientInfo.telephone,
          client_ville:     clientInfo.ville || "Abidjan",
          offre_key:    offreInfo?.key,
          offre_label:  offreInfo?.label,
          offre_formule: offreInfo?.formule,
          offre_type:   offreInfo?.type,
          niveau,
          objectif,
          message,
          montant,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.payment_url) {
        const msg = data.error || "Impossible d'initier le paiement.";
        onError?.(msg);
        alert(msg);
        return;
      }

      // Rediriger vers CinetPay
      window.location.href = data.payment_url;
    } catch (err) {
      const msg = "Erreur réseau. Réessayez.";
      onError?.(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "14px 28px",
        background: loading ? "#9ca3af" : "linear-gradient(135deg,#f97316,#dc2626)",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        fontWeight: 800,
        fontSize: "1rem",
        cursor: loading ? "not-allowed" : "pointer",
        width: "100%",
        transition: "opacity .2s",
        ...style,
      }}
    >
      {loading ? (
        <>
          <span style={{ width:18, height:18, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }} />
          Redirection…
        </>
      ) : (
        <>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          {label || `Payer ${montant ? Number(montant).toLocaleString("fr-FR") + " FCFA" : ""} avec CinetPay`}
        </>
      )}
    </button>
  );
};

export default CinetPayButton;
