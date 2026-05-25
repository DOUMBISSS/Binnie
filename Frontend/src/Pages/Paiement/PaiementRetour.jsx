import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

const PaiementRetour = () => {
  const [params]  = useSearchParams();
  const [statut,  setStatut]  = useState("chargement");
  const [paiement, setPaiement] = useState(null);

  const transactionId = params.get("transaction_id");

  useEffect(() => {
    if (!transactionId) { setStatut("erreur"); return; }

    fetch(`${API_BASE}/api/cinetpay/verify`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ transaction_id: transactionId }),
    })
      .then(r => r.json())
      .then(({ paiement }) => {
        setPaiement(paiement);
        setStatut(paiement?.statut || "en_attente");
      })
      .catch(() => setStatut("en_attente"));
  }, [transactionId]);

  const F = "'Montserrat','Segoe UI',sans-serif";

  const config = {
    validé:     { emoji:"✅", titre:"Paiement confirmé !", color:"#059669", bg:"#f0fdf4", border:"#bbf7d0", msg:"Votre paiement a bien été reçu. Notre équipe vous contactera sous 24h pour finaliser votre inscription." },
    en_attente: { emoji:"⏳", titre:"Paiement en cours...",  color:"#d97706", bg:"#fef9c3", border:"#fde68a", msg:"Votre paiement est en cours de traitement. Vous recevrez une confirmation par email dès qu'il sera validé." },
    échoué:     { emoji:"❌", titre:"Paiement échoué",       color:"#dc2626", bg:"#fef2f2", border:"#fecdd3", msg:"Votre paiement n'a pas pu être traité. Aucun montant n'a été débité. Réessayez ou choisissez un autre moyen de paiement." },
    annulé:     { emoji:"↩️", titre:"Paiement annulé",       color:"#6b7280", bg:"#f9fafb", border:"#e5e7eb", msg:"Vous avez annulé le paiement. Aucun montant n'a été débité." },
    chargement: { emoji:"⏳", titre:"Vérification...",        color:"#1e3a8a", bg:"#eff6ff", border:"#bfdbfe", msg:"Nous vérifions votre paiement..." },
    erreur:     { emoji:"⚠️", titre:"Lien invalide",          color:"#dc2626", bg:"#fef2f2", border:"#fecdd3", msg:"Ce lien de paiement est invalide ou expiré." },
  };

  const c = config[statut] || config.en_attente;

  return (
    <div style={{ fontFamily:F, minHeight:"100vh", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#fff", borderRadius:24, maxWidth:520, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,.08)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a8a)", padding:"32px 28px", textAlign:"center" }}>
          <img src="/assets/BIINIES-ENGLISH-LOGO.png" alt="BET" style={{ height:50, objectFit:"contain" }} />
        </div>

        {/* Statut */}
        <div style={{ padding:"32px 28px", textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>{c.emoji}</div>
          <h1 style={{ margin:"0 0 12px", fontSize:"1.4rem", fontWeight:900, color:c.color }}>{c.titre}</h1>
          <p style={{ fontSize:".95rem", color:"#475569", lineHeight:1.7, margin:"0 0 24px" }}>{c.msg}</p>

          {/* Récapitulatif */}
          {paiement && statut === "validé" && (
            <div style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:14, padding:"18px 20px", marginBottom:24, textAlign:"left" }}>
              <div style={{ fontWeight:800, fontSize:14, color:"#0f172a", marginBottom:12 }}>📋 Récapitulatif</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:13, color:"#374151" }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"#9ca3af" }}>Client</span>
                  <span style={{ fontWeight:700 }}>{paiement.client_nom}</span>
                </div>
                {paiement.offre_label && (
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"#9ca3af" }}>Offre</span>
                    <span style={{ fontWeight:700 }}>{paiement.offre_label}</span>
                  </div>
                )}
                {paiement.offre_formule && (
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"#9ca3af" }}>Formule</span>
                    <span style={{ fontWeight:700 }}>{paiement.offre_formule}</span>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid #e2e8f0" }}>
                  <span style={{ color:"#9ca3af" }}>Montant payé</span>
                  <span style={{ fontWeight:900, color:c.color, fontSize:16 }}>{Number(paiement.montant).toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"#9ca3af" }}>Référence</span>
                  <span style={{ fontWeight:600, fontSize:11, color:"#6b7280", fontFamily:"monospace" }}>{paiement.transaction_id}</span>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Link to="/" style={{ display:"block", padding:"13px 20px", background:"#1e3a8a", color:"#fff", borderRadius:10, fontWeight:700, fontSize:".95rem", textDecoration:"none" }}>
              Retour à l'accueil
            </Link>
            <Link to="/contact" style={{ display:"block", padding:"13px 20px", background:"transparent", color:"#1e3a8a", border:"2px solid #1e3a8a", borderRadius:10, fontWeight:700, fontSize:".95rem", textDecoration:"none" }}>
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaiementRetour;
