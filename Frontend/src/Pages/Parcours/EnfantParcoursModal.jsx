import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../config/supabase";

const API              = process.env.REACT_APP_API_URL || "http://localhost:5001";
const CENTRES_MASTER_KEY   = "bet_centres_master";
const DEFAULT_BROCHURE_URL = "https://pdfobject.com/pdf/sample.pdf";
const F        = "'Montserrat', 'Segoe UI', sans-serif";
const BET_BLUE = "#0891b2";
const BET_DARK = "#0f172a";
const BET_NAVY = "#1e3a8a";
const BET_GREEN= "#16a34a";

const OFFRES_EN_LIGNE = [
  { label:"Groupe Enfant A1",   prix:"25 000 FCFA/mois", desc:"4 séances/mois · Groupe de 5 max", icon:"👥" },
  { label:"Privé Enfant A1-B1", prix:"50 000 FCFA/mois", desc:"8 séances/mois · Suivi personnalisé", icon:"👤" },
];

const TRANCHES = [
  { val:"4-5",   label:"4 – 5 ans",   icon:"🧒", desc:"Éveil linguistique — jeux et chansons" },
  { val:"6-7",   label:"6 – 7 ans",   icon:"👧", desc:"Initiation A1 — lecture et oral" },
  { val:"8-10",  label:"8 – 10 ans",  icon:"🧑", desc:"Niveau A1 – A2 — bases solides" },
  { val:"11-13", label:"11 – 13 ans", icon:"👦", desc:"Niveau A2 – B1 — collège" },
  { val:"14-17", label:"14 – 17 ans", icon:"🎓", desc:"Niveau B1 – B2 — lycée & certif." },
];

const STEP_TITLES = [
  "Votre enfant",
  "Coordonnées du parent",
  "Mode de cours",
  "Votre assistante",
  "Paiement & confirmation",
  "Inscription envoyée !",
];

const PAIEMENT_OPTS = [
  { mode:"mobile_money",   icon:"📱", label:"Mobile Money",  sub:"Orange, MTN, Wave…" },
  { mode:"carte_bancaire", icon:"💳", label:"Carte bancaire", sub:"Visa, Mastercard" },
  { mode:"especes",        icon:"💵", label:"Espèces",        sub:"Au cabinet BET" },
];
const MM_OPTS = [
  { val:"orange", label:"Orange Money" }, { val:"mtn", label:"MTN MoMo" },
  { val:"wave",   label:"Wave" },         { val:"autres", label:"Autre" },
];

if (!document.querySelector("#em-styles")) {
  const s = document.createElement("style");
  s.id = "em-styles";
  s.textContent = `
    @keyframes emFU    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes emSpin  { to{transform:rotate(360deg)} }
    @keyframes emIn    { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    @keyframes emSlide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    .em-overlay { position:fixed;inset:0;background:rgba(10,20,50,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px); }
    .em-box { background:#fff;border-radius:24px;width:100%;max-width:620px;max-height:92vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.28);animation:emIn .25s ease; }
    .em-assistant:hover { border-color:#0891b2!important;transform:translateY(-2px)!important; }
    .em-centre-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    .em-assist-grid  { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    @media(max-width:540px){ .em-grid2{grid-template-columns:1fr!important;} .em-centre-grid{grid-template-columns:1fr!important;} .em-assist-grid{grid-template-columns:1fr!important;} }
  `;
  document.head.appendChild(s);
}

/* ── Step dots ── */
function StepDots({ step, total }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 22 : 8, height:8, borderRadius:999,
          background: i < step ? "#22c55e" : i === step ? BET_BLUE : "#e2e8f0",
          transition:"all .3s"
        }} />
      ))}
    </div>
  );
}

/* ── Avatar ── */
function Avatar({ a, size = 46 }) {
  const ini = `${a.prenom?.[0]||""}${a.nom?.[0]||""}`.toUpperCase();
  const src = a.photo_url || a.avatar_url || null;
  return src
    ? <img src={src} alt={a.prenom} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
    : <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${BET_NAVY},${BET_BLUE})`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:Math.max(10,size*.3), flexShrink:0, fontFamily:F }}>{ini||"?"}</div>;
}

/* ── AvatarStack ── */
function AvatarStack({ assistantes = [], size = 26, max = 4 }) {
  const shown   = assistantes.slice(0, max);
  const surplus = assistantes.length - max;
  return (
    <div style={{ display:"flex", alignItems:"center" }}>
      {shown.map((a, i) => (
        <div key={a.id} title={`${a.prenom} ${a.nom}`}
          style={{ marginLeft: i === 0 ? 0 : -(size * 0.3), zIndex: shown.length - i, position:"relative" }}>
          <Avatar a={a} size={size} />
        </div>
      ))}
      {surplus > 0 && (
        <div style={{ marginLeft:-(size * 0.3), width:size, height:size, borderRadius:"50%",
          background:"#f1f5f9", border:"2px solid #fff", display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:size * .28, fontWeight:800, color:"#64748b" }}>
          +{surplus}
        </div>
      )}
    </div>
  );
}

/* ── Spinner inline ── */
function Spinner() {
  return <div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"emSpin .7s linear infinite" }} />;
}

/* ════════════════════════════════════════════════════════
   MODAL PRINCIPAL
════════════════════════════════════════════════════════ */
export default function EnfantParcoursModal({ isOpen, onClose }) {
  const [step,       setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [erreur,     setErreur]     = useState("");

  // Data
  const [centres,             setCentres]             = useState([]);
  const [centresMaster,       setCentresMaster]       = useState([]);
  const [centreAssistantesMap,setCentreAssistantesMap]= useState({});
  const [assistantes,         setAssistantes]         = useState([]);
  const [loadingAss,          setLoadingAss]          = useState(false);

  // Form
  const [enfant,       setEnfant]       = useState({ prenom:"", nom:"", tranche_age:"" });
  const [parent,       setParent]       = useState({ nom:"", email:"", tel:"" });
  const [parentErrors, setParentErrors] = useState({});

  // Mode & sélection
  const [modeCours,         setModeCours]         = useState(null);
  const [offreChoisie,      setOffreChoisie]      = useState(null);
  const [offreEnLigne,      setOffreEnLigne]      = useState(null);
  const [centreChoisi,      setCentreChoisi]      = useState(null);
  const [selectedCentreCard,setSelectedCentreCard]= useState(null);
  const [assistante,        setAssistante]        = useState(null);

  // Paiement
  const [modePaiement, setModePaiement] = useState(null);
  const [mmOption,     setMmOption]     = useState(null);

  // ── Load data
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API}/api/parcours/centres`).then(r => r.json()).then(d => setCentres(d.centres || [])).catch(() => {});
    try {
      const s = localStorage.getItem(CENTRES_MASTER_KEY);
      if (s) setCentresMaster(JSON.parse(s).filter(c => c.actif !== false));
    } catch {}
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      const u = session.user, meta = u.user_metadata || {};
      const nom = (meta.prenom && meta.nom) ? `${meta.prenom} ${meta.nom}` : meta.full_name || u.email?.split("@")[0] || "";
      setParent({ nom, email: u.email || "", tel: meta.telephone || "" });
    });
  }, [isOpen]);

  // ── Pré-charger assistantes de tous les centres (photos dans les cartes)
  useEffect(() => {
    if (!isOpen || centres.length === 0) return;
    Promise.all(
      centres.map(async c => {
        try {
          const r = await fetch(`${API}/api/parcours/assistantes-presentiel/${c.id}?tous=true`);
          const d = await r.json();
          return { id: c.id, assistantes: d.assistantes || [] };
        } catch { return { id: c.id, assistantes: [] }; }
      })
    ).then(results => {
      const map = {};
      results.forEach(({ id, assistantes }) => { map[id] = assistantes; });
      setCentreAssistantesMap(map);
    });
  }, [isOpen, centres]);

  const findMaster = useCallback((centre) => {
    const norm = s => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/^bet\s+/,"").trim();
    const cn = norm(centre.nom);
    return centresMaster.find(m => norm(m.name) === cn) ||
           centresMaster.find(m => norm(m.name).includes(cn) || cn.includes(norm(m.name)));
  }, [centresMaster]);

  const handleClose = useCallback(() => {
    setStep(0); setErreur("");
    setEnfant({ prenom:"", nom:"", tranche_age:"" });
    setParent({ nom:"", email:"", tel:"" });
    setModeCours(null); setOffreChoisie(null); setOffreEnLigne(null);
    setCentreChoisi(null); setSelectedCentreCard(null); setAssistante(null);
    setAssistantes([]); setParentErrors({});
    setModePaiement(null); setMmOption(null);
    onClose();
  }, [onClose]);

  // ── Validation
  const canStep0 = enfant.prenom.trim() && enfant.nom.trim() && enfant.tranche_age;

  const validateParent = () => {
    const errors = {};
    if (!parent.tel.trim()) errors.tel = "Requis";
    setParentErrors(errors);
    return !Object.keys(errors).length;
  };

  // ── Step 2 : mode toggle (accordion)
  const toggleMode = (mode) => {
    setModeCours(prev => prev === mode ? null : mode);
    setOffreChoisie(null); setOffreEnLigne(null);
    setCentreChoisi(null); setSelectedCentreCard(null);
  };

  const toggleCentreCard = (centreId) => {
    setSelectedCentreCard(prev => prev === centreId ? null : centreId);
    setOffreChoisie(null);
  };

  // ── Confirmer centre → step 3 (assistantes)
  const confirmerCentre = async (centre) => {
    setCentreChoisi(centre);
    setLoadingAss(true); setAssistantes([]);
    try {
      const r = await fetch(`${API}/api/parcours/assistantes-presentiel/${centre.id}?tous=true`);
      const d = await r.json();
      setAssistantes(d.assistantes || []);
    } catch {}
    finally { setLoadingAss(false); }
    setStep(3);
  };

  // ── Choisir assistante → step 4
  const choisirAssistante = (a) => { setAssistante(a); setStep(4); };

  // ── Submit
  const handleSubmit = async () => {
    setSubmitting(true); setErreur("");
    try {
      const offre = modeCours === "en_ligne" ? offreEnLigne : offreChoisie;
      const r = await fetch(`${API}/api/inscriptions/enfant/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom_enfant:  enfant.prenom.trim(),
          nom_enfant:     enfant.nom.trim(),
          tranche_age:    enfant.tranche_age,
          mode_cours:     modeCours,
          centre_id:      centreChoisi?.id || undefined,
          nom_parent:     parent.nom.trim() || undefined,
          email_parent:   parent.email.trim() || undefined,
          tel_parent:     parent.tel.trim(),
          assistante_id:  assistante?.id || undefined,
          offre_titre:    offre?.label || undefined,
          mode_paiement:  modePaiement === "mobile_money" ? `mobile_money_${mmOption||"autre"}` : modePaiement || undefined,
          statut:         "en_attente",
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Erreur serveur");
      setStep(5);
    } catch (e) {
      setErreur(e.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedTranche = TRANCHES.find(t => t.val === enfant.tranche_age);
  const offre = modeCours === "en_ligne" ? offreEnLigne : offreChoisie;

  return (
    <div className="em-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="em-box">

        {/* ── Header ── */}
        <div style={{ background:`linear-gradient(135deg,#064e3b,#065f46,#0891b2)`, borderRadius:"24px 24px 0 0", padding:"20px 24px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:"rgba(255,255,255,.6)", fontSize:".7rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4 }}>
              👧 Parcours Enfant — BET Languages
            </div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:"1rem", fontFamily:F }}>
              {STEP_TITLES[step] || ""}
            </div>
          </div>
          <button onClick={handleClose} style={{ background:"rgba(255,255,255,.12)", border:"none", borderRadius:"50%", width:32, height:32, color:"#fff", fontSize:"1.1rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding:"24px 24px 28px" }}>

          {step < 5 && <StepDots step={step} total={5} />}

          {erreur && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", color:"#dc2626", fontSize:".84rem", marginBottom:16 }}>
              ⚠️ {erreur}
            </div>
          )}

          {/* ═══ STEP 0 : Infos enfant ═══ */}
          {step === 0 && (
            <div style={{ animation:"emFU .3s ease" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
                <span style={{ fontSize:"1.3rem", flexShrink:0 }}>🎓</span>
                <p style={{ margin:0, fontSize:".8rem", color:"#166534", lineHeight:1.6 }}>
                  Nos coachs sont spécialisés en <strong>pédagogie jeunesse</strong> (niveaux A1 → B2). Chaque tranche d'âge a son programme adapté.
                </p>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div className="em-grid2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={labelStyle}>Prénom de l'enfant *</label>
                    <input value={enfant.prenom} onChange={e => setEnfant(p => ({...p, prenom:e.target.value}))}
                      placeholder="Kouamé" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Nom de l'enfant *</label>
                    <input value={enfant.nom} onChange={e => setEnfant(p => ({...p, nom:e.target.value}))}
                      placeholder="Diallo" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Tranche d'âge *</label>
                  <div className="em-grid2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:6 }}>
                    {TRANCHES.map(t => (
                      <div key={t.val} onClick={() => setEnfant(p => ({...p, tranche_age:t.val}))}
                        style={{ border:`2px solid ${enfant.tranche_age===t.val ? BET_BLUE : "#e2e8f0"}`, borderRadius:14, padding:"12px 14px", cursor:"pointer", background: enfant.tranche_age===t.val ? `${BET_BLUE}0d` : "#fafafa", transition:"all .2s", display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:"1.5rem", flexShrink:0 }}>{t.icon}</span>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:800, fontSize:".82rem", color:BET_DARK }}>{t.label}</div>
                          <div style={{ fontSize:".68rem", color:"#64748b", marginTop:2, lineHeight:1.4 }}>{t.desc}</div>
                        </div>
                        {enfant.tranche_age===t.val && (
                          <div style={{ marginLeft:"auto", width:18, height:18, borderRadius:"50%", background:BET_BLUE, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={() => { setErreur(""); setStep(1); }} disabled={!canStep0}
                style={{ ...primaryBtn, marginTop:22, opacity: canStep0 ? 1 : .45 }}>
                Continuer →
              </button>
            </div>
          )}

          {/* ═══ STEP 1 : Coordonnées parent ═══ */}
          {step === 1 && (
            <div style={{ animation:"emFU .3s ease" }}>
              <button onClick={() => setStep(0)} style={backBtn}>← Retour</button>

              <div style={{ display:"flex", alignItems:"center", gap:12, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
                <span style={{ fontSize:"1.8rem" }}>{selectedTranche?.icon || "🧒"}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:".88rem", color:BET_DARK }}>{enfant.prenom} {enfant.nom}</div>
                  <div style={{ fontSize:".74rem", color:"#64748b", marginTop:2 }}>{selectedTranche?.label} · {selectedTranche?.desc}</div>
                </div>
                <span style={{ background:"#dcfce7", color:BET_GREEN, borderRadius:999, padding:"3px 10px", fontSize:".68rem", fontWeight:700, flexShrink:0 }}>✓</span>
              </div>

              <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:16, lineHeight:1.6 }}>
                Ces coordonnées permettent à votre assistante de vous contacter pour le suivi de votre enfant.
              </p>

              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={labelStyle}>Votre nom complet <span style={{ color:"#94a3b8", fontWeight:400 }}>(optionnel)</span></label>
                  <input value={parent.nom} onChange={e => setParent(p => ({...p, nom:e.target.value}))}
                    placeholder="Jean Kouamé" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Numéro WhatsApp *</label>
                  <input value={parent.tel} onChange={e => { setParent(p => ({...p, tel:e.target.value})); setParentErrors(pe => ({...pe, tel:""})); }}
                    placeholder="+225 07 XX XX XX"
                    style={{ ...inputStyle, borderColor: parentErrors.tel ? "#dc2626" : "#e2e8f0" }} />
                  {parentErrors.tel && <p style={errStyle}>{parentErrors.tel}</p>}
                </div>
                <div>
                  <label style={labelStyle}>E-mail <span style={{ color:"#94a3b8", fontWeight:400 }}>(optionnel)</span></label>
                  <input value={parent.email} onChange={e => setParent(p => ({...p, email:e.target.value}))}
                    placeholder="parent@email.com" type="email" style={inputStyle} />
                </div>
              </div>

              <button onClick={() => { if (validateParent()) { setErreur(""); setStep(2); } }}
                style={{ ...primaryBtn, marginTop:22 }}>
                Continuer →
              </button>
            </div>
          )}

          {/* ═══ STEP 2 : Mode de cours ═══ */}
          {step === 2 && (
            <div style={{ animation:"emFU .3s ease" }}>
              <button onClick={() => setStep(1)} style={backBtn}>← Retour</button>
              <p style={{ color:"#64748b", fontSize:".82rem", marginBottom:16, lineHeight:1.6 }}>
                Choisissez comment votre enfant suivra ses cours BET.
              </p>

              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {[
                  { mode:"en_ligne",   icon:"💻", title:"En ligne",      subtitle:"Cours via Zoom/Meet — depuis chez vous", color:BET_BLUE },
                  { mode:"presentiel", icon:"🏫", title:"En présentiel", subtitle:"Dans l'un de nos cabinets BET",           color:BET_NAVY },
                ].map((o, idx) => {
                  const sel = modeCours === o.mode;
                  const isLast = idx === 1;
                  return (
                    <div key={o.mode}>
                      {/* Mode card header */}
                      <div onClick={() => toggleMode(o.mode)}
                        style={{ display:"flex", alignItems:"center", gap:14,
                          border:`2px solid ${sel ? o.color : "#e2e8f0"}`,
                          borderBottom: sel ? `2px solid ${o.color}` : "2px solid #e2e8f0",
                          borderRadius: sel ? "16px 16px 0 0" : isLast ? "16px" : "16px",
                          marginBottom: sel ? 0 : 12,
                          padding:"16px 18px", cursor:"pointer",
                          background: sel ? `${o.color}08` : "#fff",
                          transition:"all .22s", boxShadow: sel ? `0 4px 16px ${o.color}18` : "none" }}>
                        <div style={{ width:44, height:44, borderRadius:12, background:`${o.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", flexShrink:0 }}>{o.icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:800, fontSize:".9rem", color: sel ? o.color : BET_DARK }}>{o.title}</div>
                          <div style={{ fontSize:".72rem", color:"#64748b", marginTop:2 }}>{o.subtitle}</div>
                        </div>
                        <div style={{ color: sel ? o.color : "#94a3b8", fontWeight:800, fontSize:"1.1rem", transform: sel ? "rotate(90deg)" : "none", transition:"transform .2s" }}>›</div>
                      </div>

                      {/* ── Contenu en ligne ── */}
                      {sel && o.mode === "en_ligne" && (
                        <div style={{ border:`2px solid ${o.color}`, borderTop:"none", borderRadius:"0 0 16px 16px",
                          padding:"16px", animation:"emSlide .2s ease", background:`${o.color}04`, marginBottom:12 }}
                          onClick={e => e.stopPropagation()}>

                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                            <p style={{ fontSize:".72rem", fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:".05em", margin:0 }}>
                              Formules disponibles
                            </p>
                            <span style={{ background:"#fef3c7", color:"#92400e", borderRadius:4, padding:"1px 7px", fontSize:".62rem", fontWeight:700 }}>Exemples</span>
                          </div>

                          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                            {OFFRES_EN_LIGNE.map((off, i) => {
                              const s = offreEnLigne?.label === off.label;
                              return (
                                <div key={i} onClick={() => setOffreEnLigne(off)}
                                  style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 13px", borderRadius:12,
                                    border:`2px solid ${s ? o.color : "#e2e8f0"}`, background: s ? `${o.color}08` : "#f8fafc",
                                    cursor:"pointer", transition:"all .15s" }}>
                                  <div style={{ width:17, height:17, borderRadius:"50%", border:`2px solid ${s ? o.color : "#cbd5e1"}`,
                                    background: s ? o.color : "#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                    {s && <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }} />}
                                  </div>
                                  <span style={{ fontSize:"1rem" }}>{off.icon}</span>
                                  <div style={{ flex:1 }}>
                                    <div style={{ fontWeight:700, fontSize:".82rem", color: s ? o.color : BET_DARK }}>{off.label}</div>
                                    <div style={{ fontSize:".7rem", color:"#64748b" }}>{off.desc}</div>
                                  </div>
                                  <div style={{ fontWeight:800, fontSize:".82rem", color: s ? o.color : BET_DARK, flexShrink:0 }}>{off.prix}</div>
                                </div>
                              );
                            })}
                          </div>

                          <div style={{ display:"flex", alignItems:"flex-start", gap:8, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, padding:"8px 12px", marginBottom:14 }}>
                            <span style={{ flexShrink:0 }}>💡</span>
                            <p style={{ margin:0, fontSize:".73rem", color:"#92400e", lineHeight:1.5 }}>
                              Les assistantes en ligne pour enfants seront assignées prochainement.
                            </p>
                          </div>

                          <button onClick={() => setStep(4)} disabled={!offreEnLigne}
                            style={{ ...primaryBtn, opacity: offreEnLigne ? 1 : .45 }}>
                            Continuer →
                          </button>
                        </div>
                      )}

                      {/* ── Contenu présentiel : grille centres ── */}
                      {sel && o.mode === "presentiel" && (
                        <div style={{ border:`2px solid ${o.color}`, borderTop:"none", borderRadius:"0 0 16px 16px",
                          padding:"16px", animation:"emSlide .2s ease", background:`${o.color}04`, marginBottom:12 }}
                          onClick={e => e.stopPropagation()}>

                          {centres.length === 0
                            ? <p style={{ color:"#94a3b8", textAlign:"center", padding:16, margin:0 }}>Chargement des centres…</p>
                            : (
                              <div className="em-centre-grid">
                                {centres.map(c => {
                                  const master    = findMaster(c);
                                  const color     = master?.color || BET_NAVY;
                                  const offres    = (master?.offres || []).filter(off => off.actif !== false);
                                  const assistList= centreAssistantesMap[c.id] || [];
                                  const isOpenC   = selectedCentreCard === c.id;
                                  const offreOk   = isOpenC && offreChoisie && selectedCentreCard === c.id;

                                  return (
                                    <div key={c.id} onClick={() => toggleCentreCard(c.id)}
                                      style={{ gridColumn: isOpenC ? "1 / -1" : "auto",
                                        border:`2px solid ${isOpenC ? color : "#e2e8f0"}`, borderRadius:14,
                                        background: isOpenC ? `${color}06` : "#fff", cursor:"pointer",
                                        transition:"all .22s", overflow:"hidden",
                                        boxShadow: isOpenC ? `0 6px 20px ${color}20` : "none" }}>

                                      <div style={{ height:4, background: isOpenC ? color : "#e2e8f0", transition:"background .2s" }} />

                                      <div style={{ padding:"12px 14px" }}>
                                        <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                                          <div style={{ width:36, height:36, borderRadius:8, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>🏢</div>
                                          <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ fontWeight:800, fontSize:".85rem", color: isOpenC ? color : BET_DARK, lineHeight:1.2 }}>{c.nom}</div>
                                            {c.ville && <div style={{ fontSize:".68rem", color:"#64748b", marginTop:2 }}>{c.ville}</div>}
                                            {c.adresse && <div style={{ fontSize:".64rem", color:"#94a3b8", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.adresse}</div>}
                                          </div>
                                          <div style={{ color: isOpenC ? color : "#94a3b8", fontWeight:800, fontSize:".9rem", transform: isOpenC ? "rotate(90deg)" : "none", transition:"transform .2s" }}>›</div>
                                        </div>

                                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                            {assistList.length > 0
                                              ? <><AvatarStack assistantes={assistList} size={24} max={3} /><span style={{ fontSize:".66rem", color:"#64748b" }}>{assistList.length} assistante{assistList.length>1?"s":""}</span></>
                                              : <span style={{ fontSize:".66rem", color:"#94a3b8" }}>—</span>
                                            }
                                          </div>
                                          {offres.length > 0 && (() => {
                                            const prix = offres.map(of => parseInt((of.prix||"").replace(/\D/g,""))||0).filter(Boolean);
                                            const min  = prix.length ? Math.min(...prix) : null;
                                            return min ? <span style={{ fontSize:".62rem", fontWeight:800, color, background:`${color}12`, padding:"2px 7px", borderRadius:999 }}>Dès {min.toLocaleString("fr")} F</span> : null;
                                          })()}
                                        </div>
                                      </div>

                                      {/* Section offres */}
                                      {isOpenC && (
                                        <div style={{ borderTop:`1px solid ${color}30`, padding:"12px 14px", animation:"emSlide .2s ease" }}
                                          onClick={e => e.stopPropagation()}>

                                          {/* Brochure */}
                                          <a href={master?.brochure_url || DEFAULT_BROCHURE_URL} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer"
                                            style={{ display:"flex", alignItems:"center", gap:6, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:8, padding:"7px 10px", marginBottom:12, textDecoration:"none" }}>
                                            <span style={{ fontSize:".9rem" }}>📄</span>
                                            <span style={{ fontSize:".72rem", fontWeight:700, color:BET_BLUE, flex:1 }}>Télécharger la brochure</span>
                                            <span style={{ fontSize:".62rem", fontWeight:700, color:"#94a3b8", background:"#f1f5f9", borderRadius:4, padding:"1px 5px" }}>PDF</span>
                                          </a>

                                          {offres.length === 0 ? (
                                            <p style={{ fontSize:".78rem", color:"#94a3b8", margin:"0 0 10px", textAlign:"center" }}>Contactez-nous pour les tarifs.</p>
                                          ) : (
                                            <>
                                              <p style={{ fontSize:".68rem", fontWeight:700, color:"#374151", marginBottom:8, textTransform:"uppercase", letterSpacing:".05em" }}>Choisissez votre formule</p>
                                              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
                                                {offres.map((off, i) => {
                                                  const s = offreChoisie?.label === off.label && selectedCentreCard === c.id;
                                                  return (
                                                    <div key={i} onClick={() => setOffreChoisie(off)}
                                                      style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10,
                                                        border:`2px solid ${s ? color : "#e2e8f0"}`, background: s ? `${color}08` : "#f8fafc",
                                                        cursor:"pointer", transition:"all .15s" }}>
                                                      <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${s ? color : "#cbd5e1"}`,
                                                        background: s ? color : "#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                                        {s && <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }} />}
                                                      </div>
                                                      <div style={{ flex:1, minWidth:0 }}>
                                                        <div style={{ fontWeight:700, fontSize:".8rem", color: s ? color : BET_DARK }}>{off.label}</div>
                                                        {off.desc && <div style={{ fontSize:".68rem", color:"#64748b" }}>{off.desc}</div>}
                                                      </div>
                                                      <div style={{ fontWeight:800, fontSize:".8rem", color: s ? color : BET_DARK, flexShrink:0 }}>{off.prix}</div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </>
                                          )}
                                          <button onClick={() => confirmerCentre(c)}
                                            disabled={offres.length > 0 && !offreOk}
                                            style={{ width:"100%", padding:"10px", borderRadius:999,
                                              background: (offres.length === 0 || offreOk) ? `linear-gradient(135deg,${color},${BET_DARK})` : "#e5e7eb",
                                              color: (offres.length === 0 || offreOk) ? "#fff" : "#94a3b8",
                                              border:"none", cursor: (offres.length === 0 || offreOk) ? "pointer" : "default",
                                              fontWeight:800, fontSize:".82rem", fontFamily:F }}>
                                            {offres.length > 0 && !offreOk ? "Sélectionnez une formule ↑" : `Continuer avec ${c.nom.replace("BET ","")} →`}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ STEP 3 : Assistantes du centre (présentiel) ═══ */}
          {step === 3 && (
            <div style={{ animation:"emFU .3s ease" }}>
              <button onClick={() => setStep(2)} style={backBtn}>← Retour</button>

              {/* Recap centre + offre */}
              {(centreChoisi || offreChoisie) && (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
                  <span style={{ fontSize:"1rem" }}>✅</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:".82rem", color:"#065f46" }}>{offreChoisie?.label || centreChoisi?.nom}</div>
                    <div style={{ fontSize:".72rem", color:"#047857" }}>{centreChoisi?.nom}{offreChoisie ? ` · ${offreChoisie.prix}` : ""}</div>
                  </div>
                  <button onClick={() => setStep(2)} style={{ background:"none", border:"none", fontSize:".7rem", color:"#059669", cursor:"pointer", fontWeight:700 }}>Changer</button>
                </div>
              )}

              {loadingAss ? (
                <div style={{ textAlign:"center", padding:40 }}>
                  <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTopColor:BET_BLUE, borderRadius:"50%", animation:"emSpin .8s linear infinite", margin:"0 auto 12px" }} />
                  <p style={{ color:"#64748b", fontSize:".88rem", margin:0 }}>Recherche des assistantes…</p>
                </div>
              ) : assistantes.length === 0 ? (
                <div style={{ textAlign:"center", padding:"28px 20px", background:"#f8fafc", borderRadius:14, border:"1.5px dashed #e2e8f0", marginBottom:16 }}>
                  <div style={{ fontSize:"1.8rem", marginBottom:10 }}>😔</div>
                  <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6, margin:0 }}>
                    Aucune assistante assignée à ce centre pour le moment.<br/>
                    <strong>Continuez</strong> et un conseiller vous recontactera.
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:14 }}>
                    {assistantes.length} assistante{assistantes.length > 1 ? "s" : ""} — {centreChoisi?.nom}
                  </p>
                  <div className="em-assist-grid" style={{ marginBottom:14 }}>
                    {assistantes.map(a => (
                      <div key={a.id} className="em-assistant" onClick={() => choisirAssistante(a)}
                        style={{ border:"2px solid #e2e8f0", borderRadius:16, padding:"16px 12px", cursor:"pointer", textAlign:"center", background:"#fff", transition:"all .22s" }}>
                        <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                          <Avatar a={a} size={62} />
                        </div>
                        <div style={{ fontWeight:800, fontSize:".88rem", color:BET_DARK, marginBottom:2 }}>{a.prenom} {a.nom}</div>
                        <div style={{ fontSize:".7rem", color:"#94a3b8", marginBottom: a.telephone ? 4 : 10 }}>Assistante BET</div>
                        {a.telephone && <div style={{ fontSize:".7rem", color:BET_BLUE, fontWeight:700, marginBottom:10 }}>📞 {a.telephone}</div>}
                        <div style={{ background:`linear-gradient(135deg,${BET_NAVY},${BET_BLUE})`, color:"#fff", borderRadius:999, padding:"7px 0", fontWeight:800, fontSize:".74rem", fontFamily:F }}>
                          Choisir →
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button onClick={() => { setAssistante(null); setStep(4); }} disabled={submitting}
                style={{ ...primaryBtn, background:"linear-gradient(135deg,#475569,#1e3a8a)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                Continuer sans assistante →
              </button>
            </div>
          )}

          {/* ═══ STEP 4 : Paiement ═══ */}
          {step === 4 && (
            <div style={{ animation:"emFU .3s ease" }}>
              <button onClick={() => setStep(modeCours === "presentiel" ? 3 : 2)} style={backBtn}>← Retour</button>

              {/* Recap */}
              <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ fontSize:".7rem", fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>Récapitulatif</div>

                {/* ── Enfant ── */}
                <div style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:10, borderBottom:"1px solid #f1f5f9", marginBottom:10 }}>
                  <span style={{ fontSize:"1.5rem" }}>{selectedTranche?.icon || "🧒"}</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:".88rem", color:BET_DARK }}>{enfant.prenom} {enfant.nom}</div>
                    <div style={{ fontSize:".72rem", color:"#64748b", marginTop:2 }}>{selectedTranche?.label} · {modeCours === "en_ligne" ? "En ligne" : `Présentiel · ${centreChoisi?.nom||""}`}</div>
                  </div>
                </div>

                {/* ── Parent ── */}
                <div style={{ display:"flex", flexDirection:"column", gap:5, paddingBottom:10, borderBottom:"1px solid #f1f5f9", marginBottom:10 }}>
                  <div style={{ fontSize:".68rem", fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".06em", marginBottom:2 }}>Parent</div>
                  {parent.nom && (
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:".82rem" }}>👤</span>
                      <span style={{ fontSize:".8rem", color:BET_DARK, fontWeight:600 }}>{parent.nom}</span>
                    </div>
                  )}
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:".82rem" }}>📱</span>
                    <span style={{ fontSize:".8rem", color:BET_DARK, fontWeight:600 }}>{parent.tel}</span>
                  </div>
                  {parent.email && (
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:".82rem" }}>📧</span>
                      <span style={{ fontSize:".8rem", color:BET_DARK, fontWeight:600 }}>{parent.email}</span>
                    </div>
                  )}
                </div>

                {/* ── Assistante + offre ── */}
                {assistante && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <Avatar a={assistante} size={38} />
                    <div>
                      <div style={{ fontWeight:800, fontSize:".84rem", color:BET_DARK }}>{assistante.prenom} {assistante.nom}</div>
                      <div style={{ fontSize:".72rem", color:"#64748b" }}>
                        {modeCours === "en_ligne" ? "En ligne" : `Présentiel · ${centreChoisi?.nom || "BET"}`}
                      </div>
                    </div>
                  </div>
                )}

                {offre && (
                  <div style={{ borderRadius:10, background:`${BET_BLUE}07`, border:`1.5px solid ${BET_BLUE}20`, overflow:"hidden" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderBottom: offre.desc ? `1px solid ${BET_BLUE}15` : "none" }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:".84rem", color:BET_DARK }}>{offre.label}</div>
                        {offre.duration && <div style={{ fontSize:".68rem", color:"#64748b", marginTop:1 }}>⏱ {offre.duration}</div>}
                      </div>
                      <div style={{ fontWeight:900, fontSize:".9rem", color:BET_BLUE, flexShrink:0 }}>{offre.prix}</div>
                    </div>
                    {offre.desc && (
                      <div style={{ padding:"8px 12px", fontSize:".74rem", color:"#475569", lineHeight:1.6 }}>{offre.desc}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Mode de paiement */}
              <p style={{ fontSize:".72rem", fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:".05em", marginBottom:12 }}>Mode de paiement</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
                {PAIEMENT_OPTS.map(opt => (
                  <div key={opt.mode} onClick={() => { setModePaiement(opt.mode); if (opt.mode !== "mobile_money") setMmOption(null); }}
                    style={{ border:`2px solid ${modePaiement===opt.mode ? BET_BLUE : "#e2e8f0"}`, borderRadius:12, padding:"12px 8px", cursor:"pointer", textAlign:"center",
                      background: modePaiement===opt.mode ? `${BET_BLUE}08` : "#fafafa", transition:"all .18s" }}>
                    <div style={{ fontSize:"1.4rem", marginBottom:4 }}>{opt.icon}</div>
                    <div style={{ fontWeight:800, fontSize:".72rem", color:BET_DARK, marginBottom:2 }}>{opt.label}</div>
                    <div style={{ fontSize:".62rem", color:"#94a3b8", lineHeight:1.4 }}>{opt.sub}</div>
                    {modePaiement===opt.mode && <div style={{ width:8, height:8, borderRadius:"50%", background:BET_BLUE, margin:"8px auto 0" }} />}
                  </div>
                ))}
              </div>

              {modePaiement === "mobile_money" && (
                <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px 14px", marginBottom:14, animation:"emSlide .2s ease" }}>
                  <div style={{ fontSize:".75rem", fontWeight:700, color:"#475569", marginBottom:10 }}>Opérateur :</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {MM_OPTS.map(op => (
                      <button key={op.val} onClick={() => setMmOption(op.val)}
                        style={{ padding:"6px 12px", borderRadius:999, border:`2px solid ${mmOption===op.val ? BET_BLUE : "#e2e8f0"}`,
                          background: mmOption===op.val ? `${BET_BLUE}10` : "#fff", color: mmOption===op.val ? BET_BLUE : "#475569",
                          fontWeight:700, fontSize:".76rem", cursor:"pointer", transition:"all .15s" }}>
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display:"flex", alignItems:"flex-start", gap:10, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
                <span style={{ fontSize:"1.1rem", flexShrink:0 }}>💬</span>
                <p style={{ margin:0, fontSize:".78rem", color:"#1e40af", lineHeight:1.6 }}>
                  Après confirmation, {assistante ? <><strong>{assistante.prenom}</strong></> : "votre assistante"} vous contactera par WhatsApp pour finaliser l'inscription de <strong>{enfant.prenom}</strong>.
                </p>
              </div>

              <button onClick={handleSubmit} disabled={!modePaiement || (modePaiement==="mobile_money"&&!mmOption) || submitting}
                style={{ ...primaryBtn, opacity:(!modePaiement||(modePaiement==="mobile_money"&&!mmOption)||submitting)?.5:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {submitting ? <><Spinner/>Envoi…</> : "Confirmer l'inscription →"}
              </button>
            </div>
          )}

          {/* ═══ STEP 5 : Succès ═══ */}
          {step === 5 && (
            <div style={{ animation:"emFU .4s ease" }}>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#22c55e,#16a34a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem", margin:"0 auto 16px", boxShadow:"0 8px 24px rgba(34,197,94,.3)" }}>✓</div>
                <h3 style={{ fontFamily:F, color:BET_DARK, fontWeight:800, fontSize:"1.2rem", margin:"0 0 8px" }}>Inscription envoyée !</h3>
                <p style={{ color:"#475569", fontSize:".88rem", lineHeight:1.7, margin:0 }}>
                  {assistante
                    ? <><strong>{assistante.prenom} {assistante.nom}</strong> a été notifiée et vous contactera sous peu.</>
                    : <>Un conseiller BET vous contactera sous <strong>24 h</strong> pour finaliser l'inscription de <strong>{enfant.prenom}</strong>.</>
                  }
                </p>
              </div>

              <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"16px 18px", marginBottom:20 }}>
                <div style={{ fontSize:".72rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", marginBottom:12 }}>Récapitulatif</div>
                {[
                  { icon:"🧒", label:"Enfant",      val:`${enfant.prenom} ${enfant.nom}` },
                  { icon:"📅", label:"Âge",          val: selectedTranche?.label },
                  { icon:"💻", label:"Mode",         val: modeCours === "en_ligne" ? "En ligne" : "Présentiel" },
                  centreChoisi  && { icon:"🏢", label:"Centre",      val: centreChoisi.nom },
                  parent.nom    && { icon:"👤", label:"Parent",      val: parent.nom },
                  { icon:"📱",   label:"WhatsApp",   val: parent.tel },
                  parent.email  && { icon:"📧", label:"E-mail",      val: parent.email },
                  assistante    && { icon:"🧑‍💼", label:"Assistante", val:`${assistante.prenom} ${assistante.nom} · ${modeCours === "en_ligne" ? "En ligne" : "Présentiel"}` },
                ].filter(Boolean).map(r => (
                  <div key={r.label} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom:"1px solid #f1f5f9" }}>
                    <span style={{ fontSize:"1rem", width:20, textAlign:"center", flexShrink:0 }}>{r.icon}</span>
                    <span style={{ fontSize:".75rem", color:"#64748b", width:80, flexShrink:0 }}>{r.label}</span>
                    <span style={{ fontSize:".82rem", fontWeight:600, color:BET_DARK }}>{r.val}</span>
                  </div>
                ))}

                {/* Détail offre */}
                {offre && (
                  <div style={{ marginTop:10, borderRadius:10, background:`${BET_BLUE}07`, border:`1.5px solid ${BET_BLUE}20`, overflow:"hidden" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderBottom: offre.desc ? `1px solid ${BET_BLUE}15` : "none" }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:".82rem", color:BET_DARK }}>{offre.label}</div>
                        {offre.duration && <div style={{ fontSize:".67rem", color:"#64748b", marginTop:1 }}>⏱ {offre.duration}</div>}
                      </div>
                      <div style={{ fontWeight:900, fontSize:".88rem", color:BET_BLUE, flexShrink:0 }}>{offre.prix}</div>
                    </div>
                    {offre.desc && (
                      <div style={{ padding:"8px 12px", fontSize:".73rem", color:"#475569", lineHeight:1.6 }}>{offre.desc}</div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {assistante?.telephone && (
                  <a href={`https://wa.me/${(assistante.telephone||"").replace(/[\s+\-()]/g,"")}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", alignItems:"center", gap:12, background:"#22c55e", color:"#fff", borderRadius:12, padding:"13px 18px", textDecoration:"none", fontWeight:800, fontSize:".9rem", fontFamily:F }}>
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fff" fillOpacity=".2"/><path d="M23.5 19.9c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2c-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4-.1-.5-.1-.2-.7-1.8-1-2.4-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.3 4.7 2 .9 2.7.9 3.7.8.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" fill="#fff"/></svg>
                    Écrire à {assistante.prenom} sur WhatsApp
                  </a>
                )}
                <button onClick={handleClose}
                  style={{ background:"none", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px", color:"#64748b", fontWeight:700, fontSize:".88rem", cursor:"pointer", fontFamily:F }}>
                  Fermer
                </button>
              </div>
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
  border:"none", borderRadius:999, padding:"13px", fontWeight:800, fontSize:".9rem",
  cursor:"pointer", fontFamily:F, transition:"opacity .2s",
};
const backBtn = {
  background:"none", border:"none", color:"#64748b", cursor:"pointer",
  fontSize:".82rem", marginBottom:16, display:"flex", alignItems:"center", gap:4, padding:0,
};
const labelStyle = { display:"block", fontSize:".75rem", fontWeight:700, color:BET_DARK, marginBottom:5 };
const inputStyle  = { width:"100%", padding:"11px 13px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:".88rem", fontFamily:F, boxSizing:"border-box", outline:"none" };
const errStyle    = { color:"#dc2626", fontSize:".72rem", margin:"4px 0 0" };
