import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";

const API           = process.env.REACT_APP_API_URL || "http://localhost:5001";
const LS_OFFRES_KEY = "bet_offres_en_ligne";
const F             = "'Montserrat', 'Segoe UI', sans-serif";
const BET_BLUE      = "#0891b2";
const BET_DARK      = "#0f172a";
const BET_NAVY      = "#1e3a8a";

const PAIEMENT_OPTS = [
  { mode:"mobile_money",   icon:"📱", label:"Mobile Money",  sub:"Orange, MTN, Wave…" },
  { mode:"carte_bancaire", icon:"💳", label:"Carte bancaire", sub:"Visa, Mastercard" },
  { mode:"especes",        icon:"💵", label:"Espèces",        sub:"Au cabinet BET" },
];
const MM_OPTS = [
  { val:"orange", label:"Orange Money" }, { val:"mtn", label:"MTN MoMo" },
  { val:"wave",   label:"Wave" },         { val:"autres", label:"Autre" },
];

if (!document.querySelector("#cel-styles")) {
  const s = document.createElement("style");
  s.id = "cel-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
    @keyframes celFU   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes celSpin { to{transform:rotate(360deg)} }
    @keyframes celIn   { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    @keyframes celSlide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    .cel-overlay { position:fixed;inset:0;background:rgba(10,20,50,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px); }
    .cel-box     { background:#fff;border-radius:24px;width:100%;max-width:700px;max-height:92vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.28);animation:celIn .25s ease; }
    .cel-offre-card:hover  { border-color:${BET_BLUE}!important;transform:translateY(-4px)!important;box-shadow:0 12px 32px rgba(8,145,178,.14)!important; }
    .cel-assist-card:hover { border-color:${BET_BLUE}!important;transform:translateY(-3px)!important;box-shadow:0 8px 24px rgba(8,145,178,.12)!important; }
    @media(max-width:600px){ .cel-offres-grid{grid-template-columns:1fr!important;} .cel-assist-grid{grid-template-columns:1fr 1fr!important;} }
    @media(max-width:380px){ .cel-assist-grid{grid-template-columns:1fr!important;} }
  `;
  document.head.appendChild(s);
}

/* ── Dots de progression ── */
function StepDots({ current }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:20 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: i === current ? 24 : 8, height:8, borderRadius:999,
          background: i < current ? "#22c55e" : i === current ? BET_BLUE : "#e2e8f0",
          transition:"all .3s"
        }} />
      ))}
    </div>
  );
}

/* ── Avatar ── */
function Avatar({ a, size = 56 }) {
  const ini = `${a.prenom?.[0] || ""}${a.nom?.[0] || ""}`.toUpperCase();
  const src = a.photo_url || a.avatar_url || null;
  return src
    ? <img src={src} alt={a.prenom} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"2.5px solid #e2e8f0" }} />
    : <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${BET_NAVY},${BET_BLUE})`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:Math.max(10, size * .32), flexShrink:0, fontFamily:F }}>
        {ini || "?"}
      </div>;
}

/* ── Lit les offres en ligne depuis localStorage ── */
function lireOffresEnLigne() {
  try {
    const s = localStorage.getItem(LS_OFFRES_KEY);
    if (!s) return [];
    return JSON.parse(s).filter(o => o.actif !== false);
  } catch { return []; }
}

/* ── Styles partagés formulaire ── */
const labelStyle = { fontSize:".76rem", fontWeight:700, color:"#374151", display:"block", marginBottom:5, fontFamily:F };
const inputStyle = { width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:".84rem", fontFamily:F, outline:"none", boxSizing:"border-box", color:BET_DARK };
const errStyle   = { color:"#dc2626", fontSize:".72rem", marginTop:4, marginBottom:0 };
const primaryBtn = { width:"100%", padding:"13px 0", background:`linear-gradient(135deg,${BET_BLUE},${BET_NAVY})`, color:"#fff", border:"none", borderRadius:999, fontWeight:800, fontSize:".88rem", fontFamily:F, cursor:"pointer", transition:"opacity .18s" };

/* ════════════════════════════════════════════════════════
   MODAL CENTRES VIRTUELS — Mini-parcours en ligne
   Étape 0 : Offres en ligne
   Étape 1 : Assistantes disponibles (non assignées à un centre physique)
   Étape 2 : Paiement & confirmation
   Étape 3 : Succès
════════════════════════════════════════════════════════ */
export default function CentresEnLigneModal({ isOpen, onClose, onSelectAssistante }) {
  const navigate = useNavigate();

  const [sbUser,            setSbUser]        = useState(null);
  const [step,              setStep]          = useState(0);
  const [offres,            setOffres]        = useState([]);
  const [offreChoisie,      setOffreChoisie]  = useState(null);
  const [assistantes,       setAssistantes]   = useState([]);
  const [assistanteChoisie, setAssistanteChoisie] = useState(null);
  const [loading,           setLoading]       = useState(false);
  const [erreur,            setErreur]        = useState("");

  /* Formulaire */
  const [form,         setForm]         = useState({ nom:"", telephone:"", email:"" });
  const [formErrors,   setFormErrors]   = useState({});
  const [modePaiement, setModePaiement] = useState(null);
  const [mmOption,     setMmOption]     = useState(null);
  const [submitting,   setSubmitting]   = useState(false);

  /* ── Session Supabase ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSbUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSbUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const prefillForm = useCallback((u) => {
    if (!u) return;
    const meta = u.user_metadata || {};
    const nom = (meta.nom && meta.prenom)
      ? `${meta.prenom} ${meta.nom}`
      : meta.full_name || u.email?.split("@")[0] || "";
    setForm({ nom, email: u.email || "", telephone: meta.telephone || "" });
  }, []);

  /* ── Chargement à l'ouverture ── */
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setOffreChoisie(null);
    setAssistanteChoisie(null);
    setErreur("");
    setForm({ nom:"", telephone:"", email:"" });
    setFormErrors({});
    setModePaiement(null);
    setMmOption(null);
    setOffres(lireOffresEnLigne());

    // Sync depuis Supabase (dashboard sur port différent — localStorage non partagé)
    supabase.from("plateforme_config").select("valeur").eq("key","offres_en_ligne").maybeSingle()
      .then(({ data, error }) => {
        if (!error && Array.isArray(data?.valeur) && data.valeur.length) {
          localStorage.setItem(LS_OFFRES_KEY, JSON.stringify(data.valeur));
          setOffres(lireOffresEnLigne());
        }
      });

    const onStorage = (e) => {
      if (e.key === LS_OFFRES_KEY) setOffres(lireOffresEnLigne());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [isOpen]);

  /* ── Charger assistantes à l'étape 1 ── */
  useEffect(() => {
    if (!isOpen || step !== 1) return;
    setLoading(true);
    setErreur("");
    fetch(`${API}/api/parcours/assistantes-ligne`)
      .then(r => r.json())
      .then(d => setAssistantes(d.assistantes || []))
      .catch(() => setErreur("Impossible de charger les assistantes. Réessayez."))
      .finally(() => setLoading(false));
  }, [isOpen, step]);

  const handleClose = useCallback(() => {
    setStep(0);
    setOffreChoisie(null);
    setAssistanteChoisie(null);
    setErreur("");
    setForm({ nom:"", telephone:"", email:"" });
    setFormErrors({});
    setModePaiement(null);
    setMmOption(null);
    onClose();
  }, [onClose]);

  const choisirOffre = (o) => {
    setOffreChoisie(o);
    setStep(1);
  };

  const choisirAssistante = (a) => {
    setAssistanteChoisie(a);
    setErreur("");
    if (!sbUser) {
      setStep("authgate");
    } else {
      prefillForm(sbUser);
      setStep(2);
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!form.nom.trim())       errs.nom       = "Nom complet requis";
    if (!form.telephone.trim()) errs.telephone = "Numéro WhatsApp requis";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitInscription = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    setErreur("");
    try {
      const r = await fetch(`${API}/api/parcours/assignation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistante_id:      assistanteChoisie.id,
          prospect_nom:       form.nom.trim(),
          prospect_email:     form.email.trim() || undefined,
          prospect_telephone: form.telephone.trim(),
          type_cours:         "en_ligne",
          offre_label:        offreChoisie?.label || undefined,
          mode_paiement:      modePaiement === "mobile_money"
                                ? `mobile_money_${mmOption || "autre"}`
                                : modePaiement || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur lors de l'envoi");
      setStep(3);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const titres = {
    0: "Nos offres en ligne",
    1: "Choisissez votre assistante",
    2: "Paiement & confirmation",
    authgate: "Connexion requise",
    3: "Inscription confirmée !",
  };

  return (
    <div className="cel-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="cel-box">

        {/* ── Header ── */}
        <div style={{ background:`linear-gradient(135deg,${BET_DARK},${BET_NAVY})`, borderRadius:"24px 24px 0 0", padding:"20px 24px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:"rgba(255,255,255,.55)", fontSize:".68rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", marginBottom:3 }}>
              BET Languages · Centre virtuel en ligne
            </div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:"1rem", fontFamily:F }}>
              {titres[step] || ""}
            </div>
          </div>
          <button onClick={handleClose} style={{ background:"rgba(255,255,255,.12)", border:"none", borderRadius:"50%", width:32, height:32, color:"#fff", fontSize:"1.1rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding:"22px 24px 28px" }}>

          {typeof step === "number" && step < 3 && <StepDots current={step} />}

          {erreur && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", color:"#dc2626", fontSize:".84rem", marginBottom:16 }}>
              ⚠️ {erreur}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              ÉTAPE 0 — Offres en ligne
          ═══════════════════════════════════════════════ */}
          {step === 0 && (
            <div style={{ animation:"celFU .3s ease" }}>
              <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:20, lineHeight:1.6 }}>
                Découvrez nos formules de cours en ligne. Apprenez où que vous soyez, à votre rythme, avec nos assistantes dédiées.
              </p>

              {offres.length === 0 ? (
                <div style={{ textAlign:"center", padding:"36px 20px", background:"#f8fafc", borderRadius:16, border:"1.5px dashed #e2e8f0" }}>
                  <div style={{ fontSize:"2rem", marginBottom:10 }}>💻</div>
                  <p style={{ color:"#64748b", fontSize:".88rem", lineHeight:1.6, margin:0 }}>
                    Nos offres seront disponibles très prochainement.<br />
                    <strong>Contactez-nous</strong> pour en savoir plus.
                  </p>
                  <button onClick={() => setStep(1)}
                    style={{ marginTop:18, padding:"10px 24px", background:`linear-gradient(135deg,${BET_BLUE},${BET_NAVY})`, color:"#fff", border:"none", borderRadius:999, cursor:"pointer", fontWeight:700, fontSize:".84rem", fontFamily:F }}>
                    Voir les assistantes →
                  </button>
                </div>
              ) : (
                <>
                  <div className="cel-offres-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
                    {offres.map((o, i) => {
                      const COLORS = [BET_BLUE, BET_NAVY, "#059669", "#d97706", "#7c3aed", "#dc2626"];
                      const col = COLORS[i % COLORS.length];
                      return (
                        <div key={o.id || i} className="cel-offre-card"
                          onClick={() => choisirOffre(o)}
                          style={{ border:"2px solid #e2e8f0", borderRadius:18, padding:"18px 16px", cursor:"pointer", transition:"all .22s", background:"#fafafa", display:"flex", flexDirection:"column", gap:10 }}>

                          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                            <div style={{ width:44, height:44, borderRadius:12, background:`${col}15`, border:`2px solid ${col}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", flexShrink:0 }}>
                              {o.icon || "💻"}
                            </div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontWeight:800, fontSize:".88rem", color:col, fontFamily:F }}>{o.prix || "Sur devis"}</div>
                              {o.duration && <div style={{ fontSize:".68rem", color:"#94a3b8", marginTop:1 }}>{o.duration}</div>}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontWeight:800, fontSize:".88rem", color:BET_DARK, fontFamily:F, marginBottom:4, lineHeight:1.3 }}>{o.label}</div>
                            {o.desc && <div style={{ fontSize:".74rem", color:"#64748b", lineHeight:1.5 }}>{o.desc}</div>}
                          </div>

                          {o.brochure_url && (
                            <a href={o.brochure_url} download={o.brochure_nom || true} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ display:"flex", alignItems:"center", gap:6, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:8, padding:"6px 10px", textDecoration:"none", marginTop:"auto" }}>
                              <span style={{ fontSize:".8rem" }}>📄</span>
                              <span style={{ fontSize:".7rem", fontWeight:700, color:BET_BLUE, flex:1 }}>{o.brochure_nom || "Télécharger la brochure"}</span>
                              <span style={{ fontSize:".62rem", fontWeight:700, color:"#94a3b8", background:"#f1f5f9", borderRadius:4, padding:"1px 5px" }}>PDF</span>
                            </a>
                          )}

                          <div style={{ background:`linear-gradient(135deg,${col},${BET_NAVY})`, color:"#fff", borderRadius:999, padding:"8px 0", fontWeight:800, fontSize:".74rem", textAlign:"center", fontFamily:F, marginTop:"auto" }}>
                            Choisir cette offre →
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ textAlign:"center" }}>
                    <button onClick={() => setStep(1)}
                      style={{ background:"none", border:"none", color:"#94a3b8", fontSize:".78rem", cursor:"pointer", textDecoration:"underline" }}>
                      Continuer sans sélectionner d'offre →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              ÉTAPE 1 — Assistantes en ligne
          ═══════════════════════════════════════════════ */}
          {step === 1 && (
            <div style={{ animation:"celFU .3s ease" }}>
              <button onClick={() => setStep(0)}
                style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:".82rem", marginBottom:16, display:"flex", alignItems:"center", gap:4, padding:0, fontFamily:F }}>
                ← Retour aux offres
              </button>

              {offreChoisie && (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"10px 14px", marginBottom:16 }}>
                  <span style={{ fontSize:"1.1rem" }}>{offreChoisie.icon || "💻"}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:".82rem", color:BET_DARK }}>{offreChoisie.label}</div>
                    <div style={{ fontSize:".72rem", color:"#64748b" }}>{offreChoisie.prix}{offreChoisie.duration ? ` · ${offreChoisie.duration}` : ""}</div>
                  </div>
                  <button onClick={() => setOffreChoisie(null)}
                    style={{ background:"none", border:"none", fontSize:".72rem", color:"#94a3b8", cursor:"pointer", fontWeight:700 }}>
                    Changer
                  </button>
                </div>
              )}

              <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:16, lineHeight:1.6 }}>
                Choisissez l'assistante qui vous accompagnera tout au long de votre parcours en ligne.
              </p>

              {loading ? (
                <div style={{ textAlign:"center", padding:48 }}>
                  <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTopColor:BET_BLUE, borderRadius:"50%", animation:"celSpin .8s linear infinite", margin:"0 auto 12px" }} />
                  <p style={{ color:"#64748b", fontSize:".88rem", margin:0 }}>Chargement des assistantes…</p>
                </div>
              ) : assistantes.length === 0 ? (
                <div style={{ textAlign:"center", padding:"32px 20px", background:"#f8fafc", borderRadius:14, border:"1.5px dashed #e2e8f0" }}>
                  <div style={{ fontSize:"1.8rem", marginBottom:10 }}>😔</div>
                  <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6, margin:0 }}>
                    Aucune assistante disponible pour le moment.<br />
                    <strong>Contactez-nous directement</strong> pour être pris(e) en charge.
                  </p>
                </div>
              ) : (
                <div className="cel-assist-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                  {assistantes.map(a => {
                    const placesRestantes = (a.quota_jour || 5) - (a.prises_aujourd_hui || 0);
                    const wa = a.telephone
                      ? `https://wa.me/${a.telephone.replace(/\D/g,"")}?text=${encodeURIComponent(`Bonjour ${a.prenom}, je souhaite m'inscrire à un cours BET en ligne${offreChoisie ? ` — ${offreChoisie.label}` : ""}.`)}`
                      : null;
                    return (
                      <div key={a.id} className="cel-assist-card"
                        onClick={() => choisirAssistante(a)}
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, border:"2px solid #e2e8f0", borderRadius:18, padding:"20px 14px 16px", cursor:"pointer", transition:"all .22s", background:"#fff", textAlign:"center" }}>

                        <div style={{ position:"relative" }}>
                          <Avatar a={a} size={72} />
                          <span style={{ position:"absolute", bottom:0, right:0, width:16, height:16, borderRadius:"50%", background:"#22c55e", border:"2.5px solid #fff" }} />
                        </div>

                        <div>
                          <div style={{ fontWeight:800, fontSize:".88rem", color:BET_DARK, fontFamily:F, lineHeight:1.3 }}>{a.prenom} {a.nom}</div>
                          <div style={{ fontSize:".68rem", color:"#94a3b8", marginTop:3 }}>Assistante · En ligne</div>
                        </div>

                        {a.telephone && (
                          <div style={{ fontSize:".72rem", color:"#334155", fontWeight:600 }}>📞 {a.telephone}</div>
                        )}

                        <span style={{ background:`${BET_BLUE}14`, color:BET_BLUE, borderRadius:999, padding:"3px 10px", fontSize:".66rem", fontWeight:700 }}>
                          {placesRestantes} place{placesRestantes > 1 ? "s" : ""} restante{placesRestantes > 1 ? "s" : ""}
                        </span>

                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, width:"100%", padding:"8px 0", background:"#25d366", color:"#fff", borderRadius:999, textDecoration:"none", fontWeight:700, fontSize:".74rem", fontFamily:F, marginTop:"auto" }}>
                            <span>💬</span> WhatsApp
                          </a>
                        )}

                        <div style={{ width:"100%", padding:"7px 0", background:`linear-gradient(135deg,${BET_BLUE},${BET_NAVY})`, color:"#fff", borderRadius:999, fontWeight:800, fontSize:".72rem", fontFamily:F }}>
                          Choisir →
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              AUTH GATE — Connexion requise
          ═══════════════════════════════════════════════ */}
          {step === "authgate" && (
            <div style={{ animation:"celFU .3s ease", textAlign:"center", padding:"8px 0" }}>
              <div style={{ fontSize:"3rem", marginBottom:12 }}>🔐</div>
              <h3 style={{ fontFamily:F, color:BET_DARK, fontSize:"1.1rem", fontWeight:800, margin:"0 0 10px" }}>
                Connexion requise
              </h3>
              <p style={{ color:"#475569", fontSize:".88rem", lineHeight:1.7, margin:"0 0 20px" }}>
                Pour finaliser votre inscription, connectez-vous à votre espace BET.<br />
                Vos coordonnées seront pré-remplies automatiquement.
              </p>

              {/* Mini recap assistante + offre */}
              <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px 16px", marginBottom:20, textAlign:"left", display:"flex", alignItems:"center", gap:12 }}>
                <Avatar a={assistanteChoisie || {}} size={40} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:".85rem", color:BET_DARK }}>
                    {assistanteChoisie?.prenom} {assistanteChoisie?.nom}
                  </div>
                  <div style={{ fontSize:".72rem", color:"#64748b" }}>
                    En ligne{offreChoisie ? ` · ${offreChoisie.label}` : ""}
                    {offreChoisie?.prix ? ` · ${offreChoisie.prix}` : ""}
                  </div>
                </div>
                <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"3px 10px", fontSize:".7rem", fontWeight:700, flexShrink:0 }}>✓ Sélectionnée</span>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <button
                  onClick={() => { handleClose(); navigate("/mon-espace"); }}
                  style={{ ...primaryBtn, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  🔑 Se connecter / Créer mon espace →
                </button>
                <button
                  onClick={() => setStep(1)}
                  style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:".82rem", fontFamily:F, padding:"6px 0" }}>
                  ← Choisir une autre assistante
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              ÉTAPE 2 — Paiement & confirmation
          ═══════════════════════════════════════════════ */}
          {step === 2 && (
            <div style={{ animation:"celFU .3s ease" }}>
              <button onClick={() => setStep(1)}
                style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:".82rem", marginBottom:16, display:"flex", alignItems:"center", gap:4, padding:0, fontFamily:F }}>
                ← Retour
              </button>

              {/* Récapitulatif */}
              <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ fontSize:".7rem", fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".05em", marginBottom:12 }}>Récapitulatif</div>

                {/* Assistante choisie */}
                {assistanteChoisie && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                    <Avatar a={assistanteChoisie} size={42} />
                    <div>
                      <div style={{ fontWeight:800, fontSize:".88rem", color:BET_DARK }}>{assistanteChoisie.prenom} {assistanteChoisie.nom}</div>
                      <div style={{ fontSize:".72rem", color:"#64748b" }}>Assistante · Cours en ligne</div>
                    </div>
                  </div>
                )}

                {/* Offre choisie */}
                {offreChoisie && (
                  <div style={{ borderRadius:10, background:`${BET_BLUE}07`, border:`1.5px solid ${BET_BLUE}20`, overflow:"hidden" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderBottom: offreChoisie.desc ? `1px solid ${BET_BLUE}15` : "none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:".9rem" }}>{offreChoisie.icon || "💻"}</span>
                        <div>
                          <div style={{ fontWeight:800, fontSize:".84rem", color:BET_DARK }}>{offreChoisie.label}</div>
                          {offreChoisie.duration && (
                            <div style={{ fontSize:".68rem", color:"#64748b", marginTop:1 }}>⏱ {offreChoisie.duration}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ fontWeight:900, fontSize:".92rem", color:BET_BLUE, flexShrink:0 }}>
                        {offreChoisie.prix || "Sur devis"}
                      </div>
                    </div>
                    {offreChoisie.desc && (
                      <div style={{ padding:"8px 12px", fontSize:".74rem", color:"#475569", lineHeight:1.6 }}>
                        {offreChoisie.desc}
                      </div>
                    )}
                  </div>
                )}

                {!offreChoisie && (
                  <div style={{ fontSize:".78rem", color:"#94a3b8", fontStyle:"italic" }}>
                    Aucune offre sélectionnée — nos conseillers vous proposeront la formule adaptée.
                  </div>
                )}
              </div>

              {/* Bannière pré-remplissage */}
              {sbUser && (
                <div style={{ fontSize:".75rem", color:"#059669", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"7px 12px", marginBottom:14 }}>
                  ✓ Coordonnées pré-remplies depuis votre compte
                </div>
              )}

              {/* Formulaire */}
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
                <div>
                  <label style={labelStyle}>Nom complet *</label>
                  <input value={form.nom}
                    onChange={e => { setForm(f => ({ ...f, nom:e.target.value })); setFormErrors(fe => ({ ...fe, nom:"" })); }}
                    placeholder="Ex : Kouamé Yao"
                    style={{ ...inputStyle, borderColor: formErrors.nom ? "#dc2626" : "#e2e8f0" }} />
                  {formErrors.nom && <p style={errStyle}>{formErrors.nom}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Numéro WhatsApp *</label>
                  <input value={form.telephone}
                    onChange={e => { setForm(f => ({ ...f, telephone:e.target.value })); setFormErrors(fe => ({ ...fe, telephone:"" })); }}
                    placeholder="+225 07 XX XX XX"
                    style={{ ...inputStyle, borderColor: formErrors.telephone ? "#dc2626" : "#e2e8f0" }} />
                  {formErrors.telephone && <p style={errStyle}>{formErrors.telephone}</p>}
                </div>
                <div>
                  <label style={labelStyle}>E-mail <span style={{ color:"#94a3b8", fontWeight:400 }}>(optionnel)</span></label>
                  <input value={form.email}
                    onChange={e => setForm(f => ({ ...f, email:e.target.value }))}
                    placeholder="votre@email.com" type="email"
                    style={inputStyle} />
                </div>
              </div>

              {/* Mode de paiement */}
              <p style={{ fontSize:".78rem", fontWeight:700, color:"#374151", marginBottom:10 }}>Mode de paiement</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
                {PAIEMENT_OPTS.map(opt => (
                  <div key={opt.mode}
                    onClick={() => { setModePaiement(opt.mode); if (opt.mode !== "mobile_money") setMmOption(null); }}
                    style={{ border:`2px solid ${modePaiement === opt.mode ? BET_BLUE : "#e2e8f0"}`, borderRadius:14, padding:"14px 10px", cursor:"pointer", textAlign:"center",
                      background: modePaiement === opt.mode ? `${BET_BLUE}08` : "#fafafa", transition:"all .18s" }}>
                    <div style={{ fontSize:"1.5rem", marginBottom:6 }}>{opt.icon}</div>
                    <div style={{ fontWeight:800, fontSize:".74rem", color:BET_DARK, marginBottom:2 }}>{opt.label}</div>
                    <div style={{ fontSize:".64rem", color:"#94a3b8", lineHeight:1.4 }}>{opt.sub}</div>
                    {modePaiement === opt.mode && <div style={{ width:8, height:8, borderRadius:"50%", background:BET_BLUE, margin:"8px auto 0" }} />}
                  </div>
                ))}
              </div>

              {modePaiement === "mobile_money" && (
                <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px 14px", marginBottom:14, animation:"celSlide .2s ease" }}>
                  <div style={{ fontSize:".75rem", fontWeight:700, color:"#475569", marginBottom:10 }}>Opérateur :</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {MM_OPTS.map(op => (
                      <button key={op.val} onClick={() => setMmOption(op.val)}
                        style={{ padding:"7px 13px", borderRadius:999, border:`2px solid ${mmOption === op.val ? BET_BLUE : "#e2e8f0"}`,
                          background: mmOption === op.val ? `${BET_BLUE}10` : "#fff", color: mmOption === op.val ? BET_BLUE : "#475569",
                          fontWeight:700, fontSize:".78rem", cursor:"pointer", transition:"all .15s", fontFamily:F }}>
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={submitInscription}
                disabled={!modePaiement || (modePaiement === "mobile_money" && !mmOption) || submitting}
                style={{ ...primaryBtn, opacity:(!modePaiement || (modePaiement === "mobile_money" && !mmOption) || submitting) ? .5 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {submitting
                  ? <><div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"celSpin .7s linear infinite" }} />Envoi…</>
                  : "Confirmer mon inscription →"}
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              ÉTAPE 3 — Succès
          ═══════════════════════════════════════════════ */}
          {step === 3 && (
            <div style={{ animation:"celFU .3s ease", textAlign:"center", padding:"12px 0 8px" }}>
              <div style={{ fontSize:"3.5rem", marginBottom:16 }}>🎉</div>
              <h3 style={{ fontWeight:900, fontSize:"1.1rem", color:BET_DARK, fontFamily:F, marginBottom:8 }}>
                Inscription envoyée !
              </h3>
              <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.7, marginBottom:24, maxWidth:380, margin:"0 auto 24px" }}>
                Votre demande a bien été reçue. <strong>{assistanteChoisie?.prenom}</strong> vous contactera très prochainement sur WhatsApp au <strong>{form.telephone}</strong>.
              </p>

              {/* Mini récap */}
              <div style={{ display:"flex", alignItems:"center", gap:12, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:14, padding:"14px 16px", marginBottom:24, textAlign:"left" }}>
                <Avatar a={assistanteChoisie || {}} size={44} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:".86rem", color:BET_DARK }}>{assistanteChoisie?.prenom} {assistanteChoisie?.nom}</div>
                  <div style={{ fontSize:".72rem", color:"#64748b" }}>
                    {offreChoisie ? offreChoisie.label : "Cours en ligne"} · {assistanteChoisie?.telephone || ""}
                  </div>
                </div>
                <span style={{ background:"#f0fdf4", color:"#16a34a", border:"1.5px solid #bbf7d0", borderRadius:999, padding:"4px 12px", fontSize:".72rem", fontWeight:700, flexShrink:0 }}>✓ Confirmé</span>
              </div>

              <button onClick={handleClose}
                style={{ ...primaryBtn, maxWidth:280, margin:"0 auto" }}>
                Fermer
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
