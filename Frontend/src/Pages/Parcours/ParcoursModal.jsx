import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";
const F   = "'Montserrat', 'Segoe UI', sans-serif";
const BET_BLUE = "#0891b2";
const BET_DARK = "#0f172a";
const BET_NAVY = "#1e3a8a";

if (!document.querySelector("#pm-styles")) {
  const s = document.createElement("style");
  s.id = "pm-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
    @keyframes pmFU   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pmSpin { to{transform:rotate(360deg)} }
    @keyframes pmIn   { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    .pm-overlay { position:fixed;inset:0;background:rgba(10,20,50,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px); }
    .pm-box { background:#fff;border-radius:24px;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.28);animation:pmIn .25s ease; }
    .pm-card:hover { transform:translateY(-4px)!important;box-shadow:0 16px 40px rgba(0,0,0,.12)!important; }
    .pm-assistant:hover { border-color:#0891b2!important;transform:translateY(-2px)!important; }
    .pm-centre:hover { border-color:#1e3a8a!important;background:#eff6ff!important; }
    @media(max-width:540px){ .pm-grid2{grid-template-columns:1fr!important;} }
  `;
  document.head.appendChild(s);
}

/* ── Step dots ── */
function StepDots({ step, total }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === step ? 22 : 8, height:8, borderRadius:999, background: i < step ? "#22c55e" : i === step ? BET_BLUE : "#e2e8f0", transition:"all .3s" }} />
      ))}
    </div>
  );
}

/* ── Avatar initiales ── */
function Avatar({ a, size = 52 }) {
  const ini = `${a.prenom?.[0]||""}${a.nom?.[0]||""}`.toUpperCase();
  return a.photo_url
    ? <img src={a.photo_url} alt={a.prenom} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
    : <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${BET_NAVY},${BET_BLUE})`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:size*.3, flexShrink:0, fontFamily:F }}>{ini||"?"}</div>;
}

/* ════════════════════════════════════════════════════════
   MODAL COMPONENT
   Props:
     isOpen   — bool
     onClose  — fn()
     user     — Supabase user object (optionnel, auto-détecté si absent)
     defaultMode — 'en_ligne' | 'presentiel' | null (pré-sélection optionnelle)
════════════════════════════════════════════════════════ */
export default function ParcoursModal({ isOpen, onClose, user: userProp = null, defaultMode = null }) {
  const navigate = useNavigate();

  // ── Auth
  const [sbUser, setSbUser]       = useState(userProp);
  const [authChecked, setAuthChecked] = useState(!!userProp);

  // ── Wizard state
  const [step,         setStep]         = useState(defaultMode ? 1 : 0);
  const [modeCours,    setModeCours]    = useState(defaultMode);
  const [typeCoaching, setTypeCoaching] = useState(null);
  const [centreChoisi, setCentreChoisi] = useState(null);
  const [assistante,   setAssistante]   = useState(null);
  const [assistantes,  setAssistantes]  = useState([]);
  const [centres,      setCentres]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [erreur,       setErreur]       = useState("");
  const [form,         setForm]         = useState({ nom:"", email:"", telephone:"" });
  const [formErrors,   setFormErrors]   = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [modePaiement, setModePaiement] = useState(null);
  const [mmOption,     setMmOption]     = useState(null);

  // ── Fetch Supabase user si non fourni
  useEffect(() => {
    if (userProp) { setSbUser(userProp); setAuthChecked(true); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSbUser(session?.user || null);
      setAuthChecked(true);
    });
  }, [userProp]);

  // ── Fetch centres au montage
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API}/api/parcours/centres`)
      .then(r => r.json())
      .then(d => setCentres(d.centres || []))
      .catch(() => {});
  }, [isOpen]);

  // ── Reset à la fermeture
  const handleClose = useCallback(() => {
    setStep(defaultMode ? 1 : 0); setModeCours(defaultMode);
    setTypeCoaching(null); setCentreChoisi(null);
    setAssistante(null); setAssistantes([]);

    setPeriodePresentiel(null); setModePaiement(null); setMmOption(null);
    setErreur(""); setForm({ nom:"", email:"", telephone:"" }); setFormErrors({});
    onClose();
  }, [onClose, defaultMode]);

  // ── Pré-remplir le formulaire depuis l'utilisateur connecté
  const prefillForm = useCallback((u) => {
    if (!u) return;
    const meta = u.user_metadata || {};
    const nom = (meta.nom && meta.prenom) ? `${meta.prenom} ${meta.nom}` : meta.full_name || u.email?.split("@")[0] || "";
    setForm({ nom, email: u.email || "", telephone: meta.telephone || "" });
  }, []);

  // ── Step 0 : mode — reset tout le downstream avant de changer
  const choisirMode = (mode) => {
    setModeCours(mode);
    setTypeCoaching(null);
    setCentreChoisi(null);
    setAssistante(null);
    setAssistantes([]);
    setPeriodePresentiel(null);
    setModePaiement(null);
    setMmOption(null);
    setErreur("");
    setStep(1);
  };

  // ── Step 1 : groupe/privé — en_ligne → fetch assistantes, presentiel → step 1.5
  const choisirCoaching = async (type) => {
    setTypeCoaching(type);
    setCentreChoisi(null);
    setAssistante(null);
    setAssistantes([]);
    setPeriodePresentiel(null);
    setModePaiement(null);
    setMmOption(null);
    setErreur("");
    if (modeCours === "presentiel") { setStep(1.5); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/parcours/assistantes-ligne?type_coaching=${type}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setAssistantes(d.assistantes || []);
      setStep(2);
    } catch (e) { setErreur(e.message); }
    finally { setLoading(false); }
  };

  // ── Step 1.5 présentiel : choisir centre → récupère toutes les assistantes dispo
  const [periodePresentiel, setPeriodePresentiel] = useState(null); // "semaine" | "weekend"
  const choisirCentre = async (centre) => {
    setCentreChoisi(centre); setLoading(true); setErreur("");
    try {
      const r = await fetch(`${API}/api/parcours/assistantes-presentiel/${centre.id}?liste=true`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setAssistantes(d.assistantes || []);
      setPeriodePresentiel(d.periode || null);
      setStep(2);
    } catch (e) { setErreur(e.message); }
    finally { setLoading(false); }
  };

  // ── Step 2 : choisir une assistante → auth gate (en_ligne et présentiel)
  const choisirAssistante = (a) => {
    setAssistante(a);
    if (!sbUser) { setStep(2.5); return; }
    prefillForm(sbUser);
    setStep(typeCoaching === "groupe" ? 3.5 : 3);
  };

  // ── Step 2.5 : après connexion réussie
  const handleLoginSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setSbUser(session.user);
      prefillForm(session.user);
      setStep(typeCoaching === "groupe" ? 3.5 : 3);
    }
  };

  // ── Submit
  const validateForm = () => {
    const errors = {};
    if (!form.nom.trim()) errors.nom = "Requis";
    if (!form.telephone.trim()) errors.telephone = "Requis";
    setFormErrors(errors);
    return !Object.keys(errors).length;
  };

  const submitAssignation = async () => {
    if (!validateForm()) return;
    setSubmitting(true); setErreur("");
    try {
      const r = await fetch(`${API}/api/parcours/assignation`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          assistante_id:      assistante.id,
          prospect_nom:       form.nom.trim(),
          prospect_email:     form.email.trim() || undefined,
          prospect_telephone: form.telephone.trim(),
          type_cours:         modeCours,
          type_coaching:      typeCoaching || undefined,
          centre_id:          centreChoisi?.id || undefined,
          mode_paiement:      modePaiement === "mobile_money"
                                ? `mobile_money_${mmOption || "autre"}`
                                : modePaiement || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");

      // Persister l'assignation sur le profil Supabase de l'utilisateur connecté
      if (sbUser) {
        await supabase.auth.updateUser({
          data: {
            parcours_assignation: {
              assignation_id:    d.assignation?.id || null,
              assistante_id:     assistante.id,
              assistante_prenom: assistante.prenom,
              assistante_nom:    assistante.nom,
              assistante_photo:  assistante.photo_url || null,
              assistante_tel:    assistante.telephone || null,
              type_cours:        modeCours,
              type_coaching:     typeCoaching || null,
              centre_id:         centreChoisi?.id || null,
              centre_nom:        centreChoisi?.nom || null,
              date:              new Date().toISOString(),
            },
          },
        });
      }

      setStep(4);
    } catch (e) { setErreur(e.message); }
    finally { setSubmitting(false); }
  };

  if (!isOpen) return null;

  const totalDots = 5;

  return (
    <div className="pm-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="pm-box">

        {/* ── Header ── */}
        <div style={{ background:`linear-gradient(135deg,${BET_DARK},${BET_NAVY})`, borderRadius:"24px 24px 0 0", padding:"20px 24px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:"rgba(255,255,255,.6)", fontSize:".7rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4 }}>Parcours BET Languages</div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:"1rem", fontFamily:F }}>
              {step === 0 && "Comment souhaitez-vous apprendre ?"}
              {step === 1 && "Quel type de coaching ?"}
              {step === 1.5 && "Choisissez votre cabinet"}
              {step === 2 && "Choisissez votre assistante"}
              {step === 2.5 && "Connexion requise"}
              {step === 3 && "Vos coordonnées"}
              {step === 3.5 && "Mode de paiement"}
              {step === 4 && "Demande envoyée !"}
            </div>
          </div>
          <button onClick={handleClose} style={{ background:"rgba(255,255,255,.12)", border:"none", borderRadius:"50%", width:32, height:32, color:"#fff", fontSize:"1.1rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding:"24px 24px 28px" }}>

          {step < 4 && step !== 2.5 && <StepDots step={step === 1.5 ? 1 : Math.floor(step)} total={totalDots} />}

          {erreur && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", color:"#dc2626", fontSize:".84rem", marginBottom:16 }}>
              ⚠️ {erreur}
            </div>
          )}

          {loading && (
            <div style={{ textAlign:"center", padding:40 }}>
              <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTopColor:BET_BLUE, borderRadius:"50%", animation:"pmSpin .8s linear infinite", margin:"0 auto 12px" }} />
              <p style={{ color:"#64748b", fontSize:".88rem", margin:0 }}>Recherche en cours…</p>
            </div>
          )}

          {/* ═══ STEP 0 : mode ═══ */}
          {step === 0 && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <div className="pm-grid2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  { mode:"en_ligne", icon:"💻", title:"Cours en ligne", desc:"Coaching groupe ou privé, depuis chez vous.", tags:["Groupe","Privé"], color:BET_BLUE },
                  { mode:"presentiel", icon:"🏫", title:"En présentiel", desc:"Dans l'un de nos 6 cabinets en Côte d'Ivoire.", tags:["6 centres","Abidjan & Bouaké"], color:BET_NAVY },
                ].map(o => (
                  <div key={o.mode} className="pm-card" onClick={() => choisirMode(o.mode)}
                    style={{ border:`2px solid #e2e8f0`, borderRadius:16, padding:"22px 18px", cursor:"pointer", transition:"all .22s", textAlign:"center", background:"#fafafa" }}>
                    <div style={{ fontSize:"2.4rem", marginBottom:10 }}>{o.icon}</div>
                    <div style={{ fontWeight:800, color:BET_DARK, fontSize:".98rem", marginBottom:6, fontFamily:F }}>{o.title}</div>
                    <div style={{ fontSize:".78rem", color:"#475569", lineHeight:1.6, marginBottom:12 }}>{o.desc}</div>
                    <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap", marginBottom:14 }}>
                      {o.tags.map(t => <span key={t} style={{ background:o.color+"15", color:o.color, borderRadius:999, padding:"2px 10px", fontSize:".68rem", fontWeight:700 }}>{t}</span>)}
                    </div>
                    <div style={{ background:`linear-gradient(135deg,${o.color},${o.mode==="en_ligne"?BET_NAVY:BET_BLUE})`, color:"#fff", borderRadius:999, padding:"9px 0", fontWeight:800, fontSize:".82rem", fontFamily:F }}>
                      Choisir →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ STEP 1 : type de coaching (en_ligne ET présentiel) ═══ */}
          {step === 1 && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <button onClick={() => setStep(0)} style={backBtn}>← Retour</button>
              <div className="pm-grid2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  { type:"groupe", icon:"👥", title:"Coaching de groupe", desc:"Sessions avec d'autres apprenants. Dynamique et économique.", prix:"Dès 35 000 FCFA/mois" },
                  { type:"prive",  icon:"👤", title:"Coaching privé",     desc:"Suivi individuel avec votre coach attitré.", prix:"Dès 65 000 FCFA/mois" },
                ].map(o => (
                  <div key={o.type} className="pm-card" onClick={() => choisirCoaching(o.type)}
                    style={{ border:"2px solid #e2e8f0", borderRadius:16, padding:"20px 16px", cursor:"pointer", transition:"all .22s", textAlign:"center", background:"#fafafa" }}>
                    <div style={{ fontSize:"2.2rem", marginBottom:10 }}>{o.icon}</div>
                    <div style={{ fontWeight:800, color:BET_DARK, fontSize:".92rem", marginBottom:6, fontFamily:F }}>{o.title}</div>
                    <div style={{ fontSize:".76rem", color:"#475569", lineHeight:1.6, marginBottom:10 }}>{o.desc}</div>
                    <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"3px 10px", fontSize:".7rem", fontWeight:700 }}>{o.prix}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ STEP 1.5 présentiel : cabinets ═══ */}
          {step === 1.5 && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <button onClick={() => setStep(1)} style={backBtn}>← Retour</button>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {centres.length === 0
                  ? <p style={{ color:"#94a3b8", textAlign:"center", padding:20 }}>Chargement des centres…</p>
                  : centres.map(c => (
                    <div key={c.id} className="pm-centre" onClick={() => choisirCentre(c)}
                      style={{ display:"flex", alignItems:"center", gap:12, border:"2px solid #e2e8f0", borderRadius:12, padding:"14px 16px", cursor:"pointer", transition:"all .18s", background:"#fff" }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:`${BET_NAVY}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", flexShrink:0 }}>🏢</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:".88rem", color:BET_DARK }}>{c.nom}</div>
                        {c.ville && <div style={{ fontSize:".73rem", color:"#64748b", marginTop:1 }}>{c.ville}</div>}
                      </div>
                      <span style={{ color:BET_NAVY, fontWeight:800 }}>→</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ═══ STEP 2 en_ligne : liste assistantes ═══ */}
          {step === 2 && modeCours === "en_ligne" && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <button onClick={() => setStep(1)} style={backBtn}>← Retour</button>
              <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:14 }}>
                {assistantes.length} assistante{assistantes.length>1?"s":""} disponible{assistantes.length>1?"s":""} · Coaching {typeCoaching==="groupe"?"de groupe":"privé"}
              </p>
              {assistantes.length === 0 ? (
                <div style={{ textAlign:"center", padding:"32px 20px", background:"#f8fafc", borderRadius:14, border:"1.5px dashed #e2e8f0" }}>
                  <div style={{ fontSize:"1.8rem", marginBottom:10 }}>😔</div>
                  <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6 }}>
                    Toutes nos assistantes ont atteint leur quota aujourd'hui.<br />
                    <strong>Contactez-nous directement</strong> pour être pris(e) en charge.
                  </p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {assistantes.map(a => (
                    <div key={a.id} className="pm-assistant" onClick={() => choisirAssistante(a)}
                      style={{ display:"flex", alignItems:"center", gap:14, border:"2px solid #e2e8f0", borderRadius:14, padding:"14px 16px", cursor:"pointer", transition:"all .2s", background:"#fff" }}>
                      <Avatar a={a} size={46} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:".9rem", color:BET_DARK }}>{a.prenom} {a.nom}</div>
                        <div style={{ fontSize:".72rem", color:"#64748b", marginTop:2 }}>Assistante BET Languages</div>
                        <div style={{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap" }}>
                          <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"2px 8px", fontSize:".68rem", fontWeight:700 }}>✓ Disponible</span>
                          <span style={{ background:`${BET_BLUE}12`, color:BET_BLUE, borderRadius:999, padding:"2px 8px", fontSize:".68rem", fontWeight:700 }}>
                            {a.quota_jour - a.prises_aujourd_hui} place{a.quota_jour - a.prises_aujourd_hui > 1?"s":""} restante{a.quota_jour - a.prises_aujourd_hui > 1?"s":""}
                          </span>
                        </div>
                      </div>
                      <span style={{ color:BET_BLUE, fontWeight:800, fontSize:"1.1rem", flexShrink:0 }}>→</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 2 présentiel : liste des assistantes disponibles ═══ */}
          {step === 2 && modeCours === "presentiel" && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <button onClick={() => setStep(1.5)} style={backBtn}>← Retour</button>

              {/* Bandeau période */}
              <div style={{ display:"flex", alignItems:"center", gap:8, background: periodePresentiel==="weekend" ? "#fef9ec" : "#eff6ff", border:`1.5px solid ${periodePresentiel==="weekend"?"#fde68a":"#bae6fd"}`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                <span style={{ fontSize:"1.1rem" }}>{periodePresentiel==="weekend" ? "📅" : "📆"}</span>
                <div style={{ fontSize:".78rem", color: periodePresentiel==="weekend" ? "#92400e" : "#1e40af", lineHeight:1.5 }}>
                  Assistante{assistantes.length > 1 ? "s" : ""} <strong>{periodePresentiel==="weekend" ? "week-end" : "semaine"}</strong> — {centreChoisi?.nom}
                  {assistantes.length > 1 && <span style={{ marginLeft:6, opacity:.8 }}>· Choisissez la vôtre</span>}
                </div>
              </div>

              {assistantes.length === 0 ? (
                <div style={{ textAlign:"center", padding:"32px 20px", background:"#f8fafc", borderRadius:14, border:"1.5px dashed #e2e8f0" }}>
                  <div style={{ fontSize:"1.8rem", marginBottom:10 }}>😔</div>
                  <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6 }}>
                    Aucune assistante disponible pour ce centre aujourd'hui.<br />
                    <strong>Contactez-nous directement</strong> pour être pris(e) en charge.
                  </p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {assistantes.map(a => (
                    <div key={a.id} className="pm-assistant" onClick={() => choisirAssistante(a)}
                      style={{ display:"flex", alignItems:"center", gap:14, border:"2px solid #e2e8f0", borderRadius:14, padding:"14px 16px", cursor:"pointer", transition:"all .2s", background:"#fff" }}>
                      <Avatar a={a} size={46} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:".9rem", color:BET_DARK }}>{a.prenom} {a.nom}</div>
                        <div style={{ fontSize:".72rem", color:"#64748b", marginTop:2 }}>Assistante présentiel — {centreChoisi?.nom}</div>
                        <div style={{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap" }}>
                          <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"2px 8px", fontSize:".68rem", fontWeight:700 }}>✓ Disponible</span>
                          <span style={{ background: periodePresentiel==="weekend" ? "#fef9ec" : "#eff6ff", color: periodePresentiel==="weekend" ? "#92400e" : "#1e40af", borderRadius:999, padding:"2px 8px", fontSize:".68rem", fontWeight:700 }}>
                            {periodePresentiel==="weekend" ? "Sam – Dim" : "Lun – Ven"}
                          </span>
                        </div>
                      </div>
                      <span style={{ color:BET_BLUE, fontWeight:800, fontSize:"1.1rem", flexShrink:0 }}>→</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 2.5 : Auth gate — connexion obligatoire ═══ */}
          {step === 2.5 && (
            <div style={{ animation:"pmFU .3s ease", textAlign:"center", padding:"8px 0" }}>
              <div style={{ fontSize:"3rem", marginBottom:12 }}>🔐</div>
              <h3 style={{ fontFamily:F, color:BET_DARK, fontSize:"1.1rem", fontWeight:800, margin:"0 0 10px" }}>
                Connexion requise
              </h3>
              <p style={{ color:"#475569", fontSize:".88rem", lineHeight:1.7, margin:"0 0 20px", maxWidth:380, marginLeft:"auto", marginRight:"auto" }}>
                Pour finaliser votre demande et que votre assistante puisse vous identifier, vous devez être connecté(e) à votre espace BET.
              </p>

              {/* Résumé du choix */}
              <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px 16px", marginBottom:20, textAlign:"left", display:"flex", alignItems:"center", gap:12 }}>
                <Avatar a={assistante} size={40} />
                <div>
                  <div style={{ fontWeight:800, fontSize:".85rem", color:BET_DARK }}>{assistante?.prenom} {assistante?.nom}</div>
                  <div style={{ fontSize:".72rem", color:"#64748b" }}>
                    {modeCours === "en_ligne" ? `En ligne · ${typeCoaching === "groupe" ? "Groupe" : "Privé"}` : `Présentiel · ${centreChoisi?.nom || ""}`}
                  </div>
                </div>
                <span style={{ marginLeft:"auto", background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"3px 10px", fontSize:".7rem", fontWeight:700 }}>✓ Sélectionnée</span>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <button
                  onClick={() => { handleClose(); navigate("/mon-espace"); }}
                  style={primaryBtn}
                >
                  🔑 Se connecter / Créer mon espace →
                </button>
                <button onClick={() => setStep(modeCours === "en_ligne" ? 2 : 2)} style={backBtn}>
                  ← Choisir une autre assistante
                </button>
              </div>
              <p style={{ color:"#94a3b8", fontSize:".73rem", marginTop:16, lineHeight:1.5 }}>
                Votre sélection sera conservée. Revenez sur cette page après connexion pour finaliser.
              </p>
            </div>
          )}

          {/* ═══ STEP 3 : Formulaire ═══ */}
          {step === 3 && (
            <div style={{ animation:"pmFU .3s ease" }}>
              {/* Résumé choix */}
              <div style={{ display:"flex", alignItems:"center", gap:12, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
                <Avatar a={assistante} size={40} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:".85rem", color:BET_DARK }}>{assistante?.prenom} {assistante?.nom}</div>
                  <div style={{ fontSize:".72rem", color:"#64748b" }}>
                    {modeCours === "en_ligne" ? `En ligne · ${typeCoaching === "groupe" ? "Groupe" : "Privé"}` : `Présentiel · ${centreChoisi?.nom || ""}`}
                  </div>
                </div>
                <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"3px 10px", fontSize:".7rem", fontWeight:700, flexShrink:0 }}>✓ Connecté(e)</span>
              </div>

              <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:16, lineHeight:1.6 }}>
                Vos informations ont été pré-remplies depuis votre profil. Vérifiez et complétez si nécessaire.
              </p>

              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={labelStyle}>Nom complet *</label>
                  <input value={form.nom} onChange={e => { setForm(f => ({...f,nom:e.target.value})); setFormErrors(fe => ({...fe,nom:""})); }}
                    placeholder="Ex : Kouamé Yao"
                    style={{ ...inputStyle, borderColor: formErrors.nom ? "#dc2626" : "#e2e8f0" }} />
                  {formErrors.nom && <p style={errStyle}>{formErrors.nom}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Numéro WhatsApp *</label>
                  <input value={form.telephone} onChange={e => { setForm(f => ({...f,telephone:e.target.value})); setFormErrors(fe => ({...fe,telephone:""})); }}
                    placeholder="+225 07 XX XX XX"
                    style={{ ...inputStyle, borderColor: formErrors.telephone ? "#dc2626" : "#e2e8f0" }} />
                  {formErrors.telephone && <p style={errStyle}>{formErrors.telephone}</p>}
                </div>
                <div>
                  <label style={labelStyle}>E-mail <span style={{ color:"#94a3b8", fontWeight:400 }}>(optionnel)</span></label>
                  <input value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))}
                    placeholder="votre@email.com" type="email" style={inputStyle} />
                </div>
                <button onClick={submitAssignation} disabled={submitting} style={{ ...primaryBtn, opacity:submitting?.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {submitting
                    ? <><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"pmSpin .7s linear infinite" }} />Envoi…</>
                    : "Confirmer ma demande →"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 3.5 : Paiement — Coaching de groupe ═══ */}
          {step === 3.5 && (
            <div style={{ animation:"pmFU .3s ease" }}>
              {/* Recap assistante */}
              <div style={{ display:"flex", alignItems:"center", gap:12, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
                <Avatar a={assistante} size={40} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:".85rem", color:BET_DARK }}>{assistante?.prenom} {assistante?.nom}</div>
                  <div style={{ fontSize:".72rem", color:"#64748b" }}>
                    {modeCours === "en_ligne" ? "En ligne" : `Présentiel · ${centreChoisi?.nom || ""}`} · Coaching de groupe
                  </div>
                </div>
                <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"3px 10px", fontSize:".7rem", fontWeight:700, flexShrink:0 }}>✓ Connecté(e)</span>
              </div>

              <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:14, lineHeight:1.6 }}>
                Choisissez votre mode de paiement pour finaliser votre inscription au coaching de groupe.
              </p>

              {/* Options principales */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  { mode:"en_ligne",      icon:"💻", label:"En ligne",    sub:"Plateforme sécurisée" },
                  { mode:"especes",       icon:"💵", label:"Espèces",     sub:"Au cabinet BET" },
                  { mode:"mobile_money",  icon:"📱", label:"Mobile Money",sub:"Ria, MoneyGram…" },
                ].map(opt => (
                  <div key={opt.mode} onClick={() => { setModePaiement(opt.mode); if (opt.mode !== "mobile_money") setMmOption(null); }}
                    style={{ border:`2px solid ${modePaiement===opt.mode ? BET_BLUE : "#e2e8f0"}`, borderRadius:14, padding:"14px 10px", cursor:"pointer", textAlign:"center", background: modePaiement===opt.mode ? `${BET_BLUE}08` : "#fafafa", transition:"all .18s" }}>
                    <div style={{ fontSize:"1.5rem", marginBottom:6 }}>{opt.icon}</div>
                    <div style={{ fontWeight:800, fontSize:".78rem", color:BET_DARK, marginBottom:2 }}>{opt.label}</div>
                    <div style={{ fontSize:".68rem", color:"#94a3b8", lineHeight:1.4 }}>{opt.sub}</div>
                    {modePaiement===opt.mode && <div style={{ width:8, height:8, borderRadius:"50%", background:BET_BLUE, margin:"8px auto 0" }} />}
                  </div>
                ))}
              </div>

              {/* Sous-options Mobile Money */}
              {modePaiement === "mobile_money" && (
                <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px 14px", marginBottom:16, animation:"pmFU .2s ease" }}>
                  <div style={{ fontSize:".75rem", fontWeight:700, color:"#475569", marginBottom:10 }}>Choisissez l'opérateur :</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[{ val:"ria", label:"Ria" }, { val:"moneygram", label:"MoneyGram" }, { val:"autres", label:"Autres" }].map(op => (
                      <button key={op.val} onClick={() => setMmOption(op.val)}
                        style={{ padding:"8px 16px", borderRadius:999, border:`2px solid ${mmOption===op.val ? BET_BLUE : "#e2e8f0"}`, background: mmOption===op.val ? `${BET_BLUE}10` : "#fff", color: mmOption===op.val ? BET_BLUE : "#475569", fontWeight:700, fontSize:".82rem", cursor:"pointer", transition:"all .15s" }}>
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={submitAssignation}
                disabled={!modePaiement || (modePaiement === "mobile_money" && !mmOption) || submitting}
                style={{ ...primaryBtn, opacity:(!modePaiement || (modePaiement==="mobile_money"&&!mmOption) || submitting) ? .5 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
              >
                {submitting
                  ? <><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"pmSpin .7s linear infinite" }} />Envoi…</>
                  : "Confirmer mon inscription →"}
              </button>
            </div>
          )}

          {/* ═══ STEP 4 : Succès + contact ═══ */}
          {step === 4 && (
            <div style={{ animation:"pmFU .4s ease" }}>
              {/* En-tête succès */}
              <div style={{ textAlign:"center", marginBottom:22 }}>
                <div style={{ width:70,height:70,borderRadius:"50%",background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",margin:"0 auto 14px",boxShadow:"0 8px 24px rgba(34,197,94,.3)" }}>✓</div>
                <h3 style={{ fontFamily:F, color:BET_DARK, fontWeight:800, fontSize:"1.2rem", margin:"0 0 6px" }}>Assistante assignée !</h3>
                <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6, margin:0 }}>
                  <strong>{assistante?.prenom} {assistante?.nom}</strong> a été notifiée et vous contactera sous peu.
                </p>
              </div>

              {/* Carte assistante */}
              <div style={{ display:"flex", alignItems:"center", gap:14, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"14px 16px", marginBottom:18 }}>
                <Avatar a={assistante} size={50} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, color:BET_DARK, fontSize:".95rem" }}>{assistante?.prenom} {assistante?.nom}</div>
                  <div style={{ fontSize:".74rem", color:"#64748b", marginTop:2 }}>
                    {modeCours==="en_ligne" ? `En ligne · ${typeCoaching==="groupe"?"Groupe":"Privé"}` : `Présentiel · ${centreChoisi?.nom||""}`}
                  </div>
                  {assistante?.telephone && (
                    <div style={{ fontSize:".74rem", color:"#0891b2", marginTop:3 }}>📞 {assistante.telephone}</div>
                  )}
                </div>
                <span style={{ background:"#dcfce7", color:"#16a34a", borderRadius:999, padding:"4px 10px", fontSize:".7rem", fontWeight:800, flexShrink:0 }}>✓ Assignée</span>
              </div>

              {/* Boutons contact */}
              <div style={{ marginBottom:14 }}>
                <p style={{ fontSize:".75rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 10px" }}>Contacter maintenant</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {assistante?.telephone && (
                    <a
                      href={`https://wa.me/${(assistante.telephone||"").replace(/[\s+\-()]/g,"")}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display:"flex", alignItems:"center", gap:12, background:"#22c55e", color:"#fff", borderRadius:12, padding:"13px 18px", textDecoration:"none", fontWeight:800, fontSize:".9rem", fontFamily:F }}
                    >
                      <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fff" fillOpacity=".2"/><path d="M23.5 19.9c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2c-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4-.1-.5-.1-.2-.7-1.8-1-2.4-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.3 4.7 2 .9 2.7.9 3.7.8.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" fill="#fff"/></svg>
                      Écrire sur WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => { handleClose(); navigate("/mon-espace"); }}
                    style={{ display:"flex", alignItems:"center", gap:12, background:`linear-gradient(135deg,${BET_BLUE},${BET_NAVY})`, color:"#fff", borderRadius:12, padding:"13px 18px", border:"none", cursor:"pointer", fontWeight:800, fontSize:".9rem", fontFamily:F, textAlign:"left" }}
                  >
                    <span style={{ fontSize:"1.2rem" }}>💬</span>
                    Discuter dans Mon Espace
                  </button>
                </div>
              </div>

              <button onClick={handleClose} style={{ ...backBtn, justifyContent:"center", width:"100%", padding:"8px 0", fontSize:".82rem" }}>
                Fermer sans contacter
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ── Styles partagés ── */
const primaryBtn = {
  width:"100%", background:`linear-gradient(135deg,${BET_BLUE},${BET_NAVY})`, color:"#fff",
  border:"none", borderRadius:999, padding:"12px", fontWeight:800, fontSize:".9rem",
  cursor:"pointer", fontFamily:F, transition:"opacity .2s",
};
const backBtn = {
  background:"none", border:"none", color:"#64748b", cursor:"pointer",
  fontSize:".82rem", marginBottom:16, display:"flex", alignItems:"center", gap:4, padding:0,
};
const labelStyle = { display:"block", fontSize:".75rem", fontWeight:700, color:BET_DARK, marginBottom:5 };
const inputStyle  = { width:"100%", padding:"11px 13px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:".88rem", fontFamily:F, boxSizing:"border-box", outline:"none" };
const errStyle    = { color:"#dc2626", fontSize:".72rem", margin:"4px 0 0" };
