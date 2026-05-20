import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import PromosBanner from "../Components/PromosBanner/PromosBanner";

const API                   = process.env.REACT_APP_API_URL || "http://localhost:5001";
const CENTRES_MASTER_KEY    = "bet_centres_master";
const LS_OFFRES_EN_LIGNE_KEY = "bet_offres_en_ligne";
const DEFAULT_BROCHURE_URL = "https://pdfobject.com/pdf/sample.pdf";
const F                  = "'Montserrat', 'Segoe UI', sans-serif";
const BET_BLUE           = "#0891b2";
const BET_DARK           = "#0f172a";
const BET_NAVY           = "#1e3a8a";
const JOURS_SEMAINE      = ["lundi","mardi","mercredi","jeudi","vendredi"];
const JOURS_WEEKEND      = ["samedi","dimanche"];
const JOURS_COURT        = { lundi:"Lun", mardi:"Mar", mercredi:"Mer", jeudi:"Jeu", vendredi:"Ven", samedi:"Sam", dimanche:"Dim" };

// Coordonnées des principales villes de Côte d'Ivoire (pour le tri par distance)
const CITY_COORDS = {
  "abidjan":      { lat: 5.3364, lng: -4.0267 },
  "bouake":       { lat: 7.6897, lng: -5.0304 },
  "bouaké":       { lat: 7.6897, lng: -5.0304 },
  "yamoussoukro": { lat: 6.8206, lng: -5.2768 },
  "san-pedro":    { lat: 4.7491, lng: -6.6350 },
  "san pedro":    { lat: 4.7491, lng: -6.6350 },
  "korhogo":      { lat: 9.4500, lng: -5.6333 },
  "daloa":        { lat: 6.8742, lng: -6.4502 },
  "man":          { lat: 7.4122, lng: -7.5547 },
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getCentreCoords(centre, master) {
  if (master?.lat && master?.lng) return { lat: master.lat, lng: master.lng };
  const ville = (centre.ville || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (ville.includes(key) || key.includes(ville)) return coords;
  }
  return null;
}

if (!document.querySelector("#pm-styles")) {
  const s = document.createElement("style");
  s.id = "pm-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
    @keyframes pmFU   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pmSpin { to{transform:rotate(360deg)} }
    @keyframes pmIn   { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    @keyframes pmSlide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    .pm-overlay { position:fixed;inset:0;background:rgba(10,20,50,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px); }
    .pm-box { background:#fff;border-radius:24px;width:100%;max-width:660px;max-height:92vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.28);animation:pmIn .25s ease; }
    .pm-card:hover { transform:translateY(-4px)!important;box-shadow:0 16px 40px rgba(0,0,0,.12)!important; }
    .pm-assist-card:hover { border-color:#0891b2!important;box-shadow:0 8px 24px rgba(8,145,178,.12)!important;transform:translateY(-3px)!important; }
    .pm-card-dom:hover { border-color:#059669!important;transform:translateY(-4px)!important; }
    .pm-centre-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    @media(max-width:540px){ .pm-grid2{grid-template-columns:1fr!important;} .pm-grid3{grid-template-columns:1fr!important;} .pm-assist-grid{grid-template-columns:1fr!important;} .pm-centre-grid{grid-template-columns:1fr!important;} }
  `;
  document.head.appendChild(s);
}

/* ── Step dots ── */
function StepDots({ current, total }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === current ? 22 : 8, height:8, borderRadius:999,
          background: i < current ? "#22c55e" : i === current ? BET_BLUE : "#e2e8f0",
          transition:"all .3s" }} />
      ))}
    </div>
  );
}

/* ── Avatar ── */
function Avatar({ a, size = 52, border = false, color = BET_NAVY }) {
  const ini = `${a.prenom?.[0]||""}${a.nom?.[0]||""}`.toUpperCase();
  const style = {
    width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0,
    ...(border ? { border:`2px solid #fff`, boxSizing:"border-box" } : {}),
  };
  const src = a.photo_url || a.avatar_url || null;
  return src
    ? <img src={src} alt={a.prenom} style={style} />
    : <div style={{ ...style, background:`linear-gradient(135deg,${color},${BET_BLUE})`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:Math.max(10, size*.3), fontFamily:F }}>
        {ini||"?"}
      </div>;
}

/* ── Stacked avatars ── */
function AvatarStack({ assistantes = [], size = 30, max = 4, color }) {
  const shown   = assistantes.slice(0, max);
  const surplus = assistantes.length - max;
  return (
    <div style={{ display:"flex", alignItems:"center" }}>
      {shown.map((a, i) => (
        <div key={a.id} title={`${a.prenom} ${a.nom}`}
          style={{ marginLeft: i === 0 ? 0 : -(size * 0.3), zIndex: shown.length - i, position:"relative" }}>
          <Avatar a={a} size={size} border color={color} />
        </div>
      ))}
      {surplus > 0 && (
        <div style={{ marginLeft:-(size * 0.3), width:size, height:size, borderRadius:"50%",
          background:"#f1f5f9", border:"2px solid #fff", display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:size * .28, fontWeight:800, color:"#64748b", zIndex:0, flexShrink:0 }}>
          +{surplus}
        </div>
      )}
    </div>
  );
}

/* ── Jours pills ── */
function JoursPills({ jours }) {
  const list = jours || JOURS_SEMAINE;
  return (
    <div style={{ display:"flex", gap:3, justifyContent:"center", flexWrap:"wrap" }}>
      {list.map(j => (
        <span key={j} style={{ fontSize:".58rem", fontWeight:800, padding:"2px 6px", borderRadius:4,
          background: JOURS_WEEKEND.includes(j) ? "#fef3c7" : "#eff6ff",
          color:      JOURS_WEEKEND.includes(j) ? "#92400e" : "#1e40af" }}>
          {JOURS_COURT[j] || j}
        </span>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MODAL PRINCIPAL
════════════════════════════════════════════════════════ */
export default function ParcoursModal({ isOpen, onClose, user: userProp = null, defaultMode = null }) {
  const navigate = useNavigate();

  // ── Auth
  const [sbUser, setSbUser] = useState(userProp);

  // ── Wizard
  const getInitialStep = (m) => m === "domicile" ? 6 : m === "presentiel" ? "p1" : m === "en_ligne" ? 1 : 0;
  const [step,         setStep]         = useState(getInitialStep(defaultMode));
  const [modeCours,    setModeCours]    = useState(defaultMode);
  const [typeCoaching, setTypeCoaching] = useState(null);
  const [centreChoisi, setCentreChoisi] = useState(null);
  const [offreChoisie, setOffreChoisie] = useState(null);   // offre sélectionnée dans p1
  const [assistante,   setAssistante]   = useState(null);
  const [assistantes,  setAssistantes]  = useState([]);
  const [centres,      setCentres]      = useState([]);
  const [centresMaster, setCentresMaster] = useState([]);
  const [centreAssistantesMap, setCentreAssistantesMap] = useState({}); // centreId → assistantes[]
  const [selectedCentreCard,   setSelectedCentreCard]   = useState(null); // carte ouverte en p1
  const [userCoords,           setUserCoords]           = useState(null); // { lat, lng }
  const [geoStatus,            setGeoStatus]            = useState("idle"); // idle | loading | ok | denied
  const [offresEnLigne, setOffresEnLigne] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [erreur,       setErreur]       = useState("");
  const [form,         setForm]         = useState({ nom:"", email:"", telephone:"" });
  const [formErrors,   setFormErrors]   = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [modePaiement, setModePaiement] = useState(null);
  const [mmOption,     setMmOption]     = useState(null);

  /* Auth inline (step 2.5) */
  const [authTab,    setAuthTab]    = useState("login");
  const [authFormPm, setAuthFormPm] = useState({ email:"", password:"", prenom:"", nom:"", telephone:"" });
  const [authLoadPm, setAuthLoadPm] = useState(false);
  const [authErrPm,  setAuthErrPm]  = useState("");

  /* Code promo */
  const [codePromo,        setCodePromo]        = useState("");
  const [codePromoApplied, setCodePromoApplied] = useState(null);
  const [codePromoLoading, setCodePromoLoading] = useState(false);
  const [codePromoError,   setCodePromoError]   = useState("");
  const [zoneForm,     setZoneForm]     = useState("");
  const [disponForm,   setDisponForm]   = useState([]);

  const DISPOS = [
    { id:"lv_matin",  label:"Lun–Ven · Matin",      sub:"6h – 13h"  },
    { id:"lv_apm",    label:"Lun–Ven · Après-midi",  sub:"13h – 18h" },
    { id:"lv_soir",   label:"Lun–Ven · Soir",        sub:"18h – 21h" },
    { id:"sam_matin", label:"Samedi · Matin",         sub:"6h – 13h"  },
    { id:"sam_apm",   label:"Samedi · Après-midi",    sub:"13h – 18h" },
    { id:"dim_matin", label:"Dimanche · Matin",       sub:"6h – 13h"  },
    { id:"dim_apm",   label:"Dimanche · Après-midi",  sub:"13h – 18h" },
  ];
  const toggleDispo = (id) =>
    setDisponForm(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  // ── Auth check + live tracking
  useEffect(() => {
    if (userProp) { setSbUser(userProp); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSbUser(session?.user || null);
      if (session?.user) prefillForm(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSbUser(session?.user || null);
      if (session?.user) prefillForm(session.user);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProp]);

  // ── Load centres + centresMaster + offres en ligne
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API}/api/parcours/centres`).then(r => r.json()).then(d => setCentres(d.centres || [])).catch(() => {});
    try {
      const s = localStorage.getItem(CENTRES_MASTER_KEY);
      if (s) setCentresMaster(JSON.parse(s).filter(c => c.actif !== false));
    } catch {}
    // Offres en ligne : localStorage d'abord, puis sync Supabase
    try {
      const s = localStorage.getItem(LS_OFFRES_EN_LIGNE_KEY);
      if (s) setOffresEnLigne(JSON.parse(s).filter(o => o.actif !== false));
    } catch {}
    supabase.from("plateforme_config").select("valeur").eq("key","offres_en_ligne").maybeSingle()
      .then(({ data, error }) => {
        if (!error && Array.isArray(data?.valeur) && data.valeur.length) {
          localStorage.setItem(LS_OFFRES_EN_LIGNE_KEY, JSON.stringify(data.valeur));
          setOffresEnLigne(data.valeur.filter(o => o.actif !== false));
        }
      });
  }, [isOpen]);

  // ── Pré-charger les assistantes de tous les centres (pour les photos dans les cartes)
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

  // ── Géolocalisation pour le tri des centres
  useEffect(() => {
    if (step !== "p1" || geoStatus !== "idle") return;
    if (!navigator.geolocation) { setGeoStatus("denied"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      pos => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus("ok"); },
      ()   => setGeoStatus("denied"),
      { timeout: 6000 }
    );
  }, [step, geoStatus]);

  // ── Find master data for a centre (name match)
  const findMaster = useCallback((centre) => {
    const norm = s => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/^bet\s+/,"").trim();
    const cn = norm(centre.nom);
    return centresMaster.find(m => norm(m.name) === cn) ||
           centresMaster.find(m => norm(m.name).includes(cn) || cn.includes(norm(m.name)));
  }, [centresMaster]);

  // ── Reset
  const resetPresentiel = () => {
    setCentreChoisi(null); setOffreChoisie(null);
    setAssistante(null); setAssistantes([]);
    setSelectedCentreCard(null);
    setModePaiement(null); setMmOption(null); setErreur("");
  };

  const handleClose = useCallback(() => {
    setStep(getInitialStep(defaultMode)); setModeCours(defaultMode);
    setTypeCoaching(null); setCentreChoisi(null); setOffreChoisie(null);
    setAssistante(null); setAssistantes([]); setSelectedCentreCard(null);
    setModePaiement(null); setMmOption(null);
    setZoneForm(""); setDisponForm([]);
    setErreur(""); setForm({ nom:"", email:"", telephone:"" }); setFormErrors({});
    onClose();
  }, [onClose, defaultMode]);

  const prefillForm = useCallback((u) => {
    if (!u) return;
    const meta = u.user_metadata || {};
    const nom = (meta.nom && meta.prenom) ? `${meta.prenom} ${meta.nom}` : meta.full_name || u.email?.split("@")[0] || "";
    setForm({ nom, email: u.email || "", telephone: meta.telephone || "" });
  }, []);

  // ── Choisir mode
  const choisirMode = (mode) => {
    setModeCours(mode); resetPresentiel(); setTypeCoaching(null); setZoneForm(""); setDisponForm([]);
    if (mode === "domicile") {
      if (sbUser) { prefillForm(sbUser); setStep(6); }
      else { setStep(2.5); }  // show auth gate before domicile form
    }
    else if (mode === "presentiel") setStep("p1");
    else setStep(1);
  };

  // ── Offre en ligne sélectionnée → charge toutes les assistantes en ligne
  const choisirOffreEnLigne = async (offre) => {
    setOffreChoisie(offre);
    setTypeCoaching(inferTypeCoaching(offre));
    setAssistantes([]); setAssistante(null); setErreur("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/parcours/assistantes-ligne`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setAssistantes(d.assistantes || []);
      setStep(2);
    } catch (e) { setErreur(e.message); }
    finally { setLoading(false); }
  };

  // ── Auto-progression quand l'user se connecte depuis l'auth gate (step 2.5)
  useEffect(() => {
    if (step === 2.5 && sbUser) {
      prefillForm(sbUser);
      if (modeCours === "domicile") setStep(6);
      else if (modeCours === "presentiel") setStep("p4");
      else setStep(typeCoaching === "groupe" ? 3.5 : 3);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sbUser, step]);

  // ── Ouvrir/fermer une carte centre
  const toggleCentreCard = (centreId) => {
    if (selectedCentreCard === centreId) {
      setSelectedCentreCard(null);
    } else {
      setSelectedCentreCard(centreId);
      setOffreChoisie(null); // reset offre quand on change de centre
    }
  };

  // Déduit le type de coaching depuis le label de l'offre
  const inferTypeCoaching = (offre) => {
    if (!offre) return null;
    const l = (offre.label || "").toLowerCase();
    if (l.includes("groupe") || l.includes("group")) return "groupe";
    if (l.includes("priv")) return "prive";
    return null;
  };

  // ── Confirmer le centre + offre → p2
  const confirmerCentre = (centre) => {
    setCentreChoisi(centre);
    setAssistantes(centreAssistantesMap[centre.id] || []);
    if (offreChoisie) setTypeCoaching(inferTypeCoaching(offreChoisie));
    setStep("p2");
  };

  // ── Choisir assistante
  const choisirAssistante = (a) => {
    setAssistante(a);
    if (!sbUser) { setStep(2.5); return; }
    prefillForm(sbUser);
    if (modeCours === "presentiel") setStep("p4");
    else setStep(typeCoaching === "groupe" ? 3.5 : 3);
  };

  // ── Validation
  const validateForm = () => {
    const errors = {};
    if (!form.nom.trim()) errors.nom = "Requis";
    if (!form.telephone.trim()) errors.telephone = "Requis";
    if (modeCours === "domicile" && !zoneForm.trim()) errors.zone = "Requis";
    if (modeCours === "domicile" && !disponForm.length) errors.dispos = "Requis";
    setFormErrors(errors);
    return !Object.keys(errors).length;
  };

  // ── Valider code promo
  const validerCodePromo = async (offreType) => {
    const code = codePromo.trim().toUpperCase();
    if (!code) return;
    setCodePromoLoading(true);
    setCodePromoError("");
    setCodePromoApplied(null);
    try {
      const token = localStorage.getItem("bet_token") || localStorage.getItem("admin_token") || "";
      const r = await fetch(`${API}/api/codes-promo/valider`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, offre_type: offreType }),
      });
      const d = await r.json();
      if (!r.ok) { setCodePromoError(d.error || "Code invalide"); return; }
      setCodePromoApplied(d);
    } catch { setCodePromoError("Impossible de vérifier le code"); }
    finally { setCodePromoLoading(false); }
  };

  const handleAuthLogin = async () => {
    if (!authFormPm.email || !authFormPm.password) return setAuthErrPm("Email et mot de passe requis.");
    setAuthLoadPm(true); setAuthErrPm("");
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authFormPm.email, password: authFormPm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email ou mot de passe incorrect");
      await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
    } catch (err) { setAuthErrPm(err.message); }
    finally { setAuthLoadPm(false); }
  };

  const handleAuthRegister = async () => {
    if (!authFormPm.prenom || !authFormPm.nom || !authFormPm.email || !authFormPm.password) return setAuthErrPm("Tous les champs * sont requis.");
    setAuthLoadPm(true); setAuthErrPm("");
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: authFormPm.nom, prenom: authFormPm.prenom, email: authFormPm.email, telephone: authFormPm.telephone, password: authFormPm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription");
      const { error } = await supabase.auth.signInWithPassword({ email: authFormPm.email, password: authFormPm.password });
      if (error) throw new Error(error.message);
    } catch (err) { setAuthErrPm(err.message); }
    finally { setAuthLoadPm(false); }
  };

  // ── Submit assignation
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
          code_promo:         codePromoApplied?.code || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      if (sbUser) {
        await supabase.auth.updateUser({ data: { parcours_assignation: {
          assignation_id: d.assignation?.id || null,
          assistante_id: assistante.id, assistante_prenom: assistante.prenom,
          assistante_nom: assistante.nom, assistante_photo: assistante.photo_url || null,
          assistante_tel: assistante.telephone || null, type_cours: modeCours,
          type_coaching: typeCoaching || null, centre_id: centreChoisi?.id || null,
          centre_nom: centreChoisi?.nom || null, offre: offreChoisie?.label || null,
          date: new Date().toISOString(),
        }}});
      }
      setStep(4);
    } catch (e) { setErreur(e.message); }
    finally { setSubmitting(false); }
  };

  // ── Submit domicile
  const submitDomicile = async () => {
    if (!validateForm()) return;
    setSubmitting(true); setErreur("");
    try {
      const disponStr = disponForm.map(id => DISPOS.find(d => d.id === id)?.label || id).join(", ");
      const notes = [zoneForm ? `Zone : ${zoneForm}` : "", disponStr ? `Disponibilités : ${disponStr}` : ""].filter(Boolean).join(" | ");

      // Étape 1 : inscription dans la table (non-bloquante si la table a un problème)
      try {
        await fetch(`${API}/api/inscriptions/adulte/submit`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            nom_complet:  form.nom.trim(),
            email:        form.email.trim() || null,
            telephone:    form.telephone.trim(),
            offre_titre:  `Cours à domicile${notes ? " — " + notes : ""}`,
            statut:       "nouveau",
          }),
        });
      } catch(_) { /* table absente ou schéma incorrect — on continue quand même */ }

      // Étape 2 : assignation vers le PA (prioritaire)
      const paR = await fetch(`${API}/api/parcours/assistantes-pa`);
      const paD = await paR.json();
      const pa = (paD.assistantes || [])[0] || null;

      if (!pa) {
        throw new Error("Aucun conseiller pédagogique disponible. Veuillez réessayer ou nous contacter directement.");
      }

      const ar = await fetch(`${API}/api/parcours/assignation`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistante_id:      pa.id,
          prospect_nom:       form.nom.trim(),
          prospect_email:     form.email.trim() || undefined,
          prospect_telephone: form.telephone.trim(),
          type_cours:         "domicile",
          type_coaching:      "prive",
          source:             "formulaire_domicile",
        }),
      });
      if (!ar.ok) {
        const ad = await ar.json();
        throw new Error(ad.error || "Erreur lors de l'envoi de la demande");
      }

      setStep(4);
    } catch(e) { setErreur(e.message); }
    finally { setSubmitting(false); }
  };

  if (!isOpen) return null;

  // ── Step dots
  const stepDotMap = { "p1":0, "p2":1, "p4":2, 4:3 };
  const dotCurrent = stepDotMap[String(step)] ?? -1;
  const showDots   = (typeof step === "string" && step !== "2.5") || (typeof step === "number" && step >= 1 && step < 4 && step !== 2.5 && step !== 6);

  // ── Header
  const headerTitle = { 0:"Comment souhaitez-vous apprendre ?", "p1":"Choisissez votre cabinet", "p2":`Assistantes — ${centreChoisi?.nom||""}`, "p4":"Paiement & confirmation",
    1:"Choisissez votre formule", 2:"Choisissez votre assistante", 2.5:"Connexion requise",
    3:"Vos coordonnées", 3.5:"Mode de paiement", 6:"Cours à domicile / Cours privé",
    4: modeCours === "domicile" ? "Demande reçue !" : "Demande envoyée !" }[String(step)] || "";

  // ── Centres triés par distance si géolocalisation disponible
  const sortedCentres = userCoords
    ? [...centres].sort((a, b) => {
        const ca = getCentreCoords(a, findMaster(a)), cb = getCentreCoords(b, findMaster(b));
        if (!ca && !cb) return 0;
        if (!ca) return 1;
        if (!cb) return -1;
        return haversine(userCoords.lat, userCoords.lng, ca.lat, ca.lng)
             - haversine(userCoords.lat, userCoords.lng, cb.lat, cb.lng);
      })
    : centres;

  // ── Shared payment options
  const PAIEMENT_OPTS = [
    { mode:"mobile_money",   icon:"📱", label:"Mobile Money",  sub:"Orange, MTN, Wave…" },
    { mode:"carte_bancaire", icon:"💳", label:"Carte bancaire", sub:"Visa, Mastercard" },
    { mode:"especes",        icon:"💵", label:"Espèces",        sub:"Au cabinet BET" },
  ];
  const MM_OPTS = [
    { val:"orange", label:"Orange Money" }, { val:"mtn", label:"MTN MoMo" },
    { val:"wave",   label:"Wave" },         { val:"autres", label:"Autre" },
  ];

  return (
    <div className="pm-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="pm-box">

        {/* ── Header ── */}
        <div style={{ background:`linear-gradient(135deg,${BET_DARK},${BET_NAVY})`, borderRadius:"24px 24px 0 0", padding:"20px 24px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:"rgba(255,255,255,.6)", fontSize:".68rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", marginBottom:4 }}>
              Parcours BET{modeCours === "presentiel" && step !== 0 ? " · Présentiel" : ""}
            </div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:"1rem", fontFamily:F }}>{headerTitle}</div>
          </div>
          <button onClick={handleClose} style={{ background:"rgba(255,255,255,.12)", border:"none", borderRadius:"50%", width:32, height:32, color:"#fff", fontSize:"1.1rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding:"24px 24px 28px" }}>

          {showDots && step !== 4 && dotCurrent >= 0 && <StepDots current={dotCurrent} total={4} />}
          {step === 6 && <StepDots current={1} total={2} />}

          {erreur && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", color:"#dc2626", fontSize:".84rem", marginBottom:16 }}>⚠️ {erreur}</div>
          )}
          {loading && (
            <div style={{ textAlign:"center", padding:40 }}>
              <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTopColor:BET_BLUE, borderRadius:"50%", animation:"pmSpin .8s linear infinite", margin:"0 auto 12px" }} />
              <p style={{ color:"#64748b", fontSize:".88rem", margin:0 }}>Chargement…</p>
            </div>
          )}

          {/* ═══ STEP 0 : mode ═══ */}
          {step === 0 && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <div className="pm-grid3" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[
                  { mode:"en_ligne",   icon:"💻", title:"En ligne",      desc:"Coaching groupe ou privé, depuis chez vous.",          tags:["Groupe","Privé"],               color:BET_BLUE,  grad:`linear-gradient(135deg,${BET_BLUE},${BET_NAVY})` },
                  { mode:"presentiel", icon:"🏫", title:"En présentiel", desc:"Dans l'un de nos 6 cabinets en Côte d'Ivoire.",        tags:["6 centres","Abidjan & Bouaké"],  color:BET_NAVY,  grad:`linear-gradient(135deg,${BET_NAVY},${BET_BLUE})` },
                  { mode:"domicile",   icon:"🏠", title:"À domicile",    desc:"Un coach certifié se déplace chez vous. Cours privé.", tags:["Cours privé","Chez vous"],       color:"#059669", grad:"linear-gradient(135deg,#059669,#0f172a)" },
                ].map(o => (
                  <div key={o.mode} className={o.mode==="domicile"?"pm-card pm-card-dom":"pm-card"} onClick={() => choisirMode(o.mode)}
                    style={{ border:`2px solid ${o.mode==="domicile"?"#bbf7d0":"#e2e8f0"}`, borderRadius:16, padding:"20px 14px", cursor:"pointer", transition:"all .22s", textAlign:"center", background: o.mode==="domicile"?"#f0fdf4":"#fafafa" }}>
                    <div style={{ fontSize:"2.2rem", marginBottom:8 }}>{o.icon}</div>
                    <div style={{ fontWeight:800, color:BET_DARK, fontSize:".88rem", marginBottom:6, fontFamily:F }}>{o.title}</div>
                    <div style={{ fontSize:".73rem", color:"#475569", lineHeight:1.5, marginBottom:10 }}>{o.desc}</div>
                    <div style={{ display:"flex", gap:5, justifyContent:"center", flexWrap:"wrap", marginBottom:12 }}>
                      {o.tags.map(t => <span key={t} style={{ background:o.color+"18", color:o.color, borderRadius:999, padding:"2px 8px", fontSize:".64rem", fontWeight:700 }}>{t}</span>)}
                    </div>
                    <div style={{ background:o.grad, color:"#fff", borderRadius:999, padding:"8px 0", fontWeight:800, fontSize:".78rem", fontFamily:F }}>Choisir →</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ STEP 1 (en ligne) : offres ═══ */}
          {step === 1 && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <button onClick={() => setStep(0)} style={backBtn}>← Retour</button>
              <PromosBanner
                offreType="en_ligne"
                accentColor={BET_BLUE}
                onApply={(code) => { setCodePromo(code); setCodePromoApplied(null); setCodePromoError(""); }}
              />
              <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:20, lineHeight:1.6 }}>
                Découvrez nos formules de cours en ligne. Apprenez où que vous soyez, à votre rythme, avec nos assistantes dédiées.
              </p>

              {offresEnLigne.length === 0 ? (
                <div style={{ textAlign:"center", padding:"36px 20px", background:"#f8fafc", borderRadius:16, border:"1.5px dashed #e2e8f0" }}>
                  <div style={{ fontSize:"2rem", marginBottom:10 }}>💻</div>
                  <p style={{ color:"#64748b", fontSize:".88rem", lineHeight:1.6, margin:0 }}>
                    Nos offres seront disponibles très prochainement.<br />
                    <strong>Contactez-nous</strong> pour en savoir plus.
                  </p>
                </div>
              ) : (
                <>
                  <div className="pm-grid2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
                    {offresEnLigne.map((o, i) => {
                      const COLORS = [BET_BLUE, BET_NAVY, "#059669", "#d97706", "#7c3aed", "#dc2626"];
                      const col = COLORS[i % COLORS.length];
                      return (
                        <div key={o.id || i} className="pm-card"
                          onClick={() => choisirOffreEnLigne(o)}
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
                    <button onClick={() => choisirOffreEnLigne(null)}
                      style={{ background:"none", border:"none", color:"#94a3b8", fontSize:".78rem", cursor:"pointer", textDecoration:"underline", fontFamily:F }}>
                      Continuer sans sélectionner d'offre →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ STEP p1 : cartes centres (flex) + offres + assistantes ═══ */}
          {step === "p1" && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <button onClick={() => setStep(0)} style={backBtn}>← Retour</button>
              <PromosBanner
                offreType="centres"
                accentColor={BET_NAVY}
                onApply={(code) => { setCodePromo(code); setCodePromoApplied(null); setCodePromoError(""); }}
              />
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:8 }}>
                <p style={{ color:"#64748b", fontSize:".82rem", margin:0, lineHeight:1.6 }}>
                  Sélectionnez un cabinet et choisissez votre formule pour continuer.
                </p>
                {geoStatus === "loading" && (
                  <span style={{ fontSize:".68rem", color:"#94a3b8", whiteSpace:"nowrap" }}>📍 Localisation…</span>
                )}
                {geoStatus === "ok" && (
                  <span style={{ fontSize:".68rem", color:"#059669", fontWeight:700, whiteSpace:"nowrap" }}>📍 Trié par distance</span>
                )}
              </div>

              {sortedCentres.length === 0
                ? <p style={{ color:"#94a3b8", textAlign:"center", padding:20 }}>Chargement des centres…</p>
                : (
                  <div className="pm-centre-grid">
                    {sortedCentres.map(c => {
                      const master      = findMaster(c);
                      const color       = master?.color || BET_NAVY;
                      const offres      = (master?.offres || []).filter(o => o.actif !== false);
                      const assistList  = centreAssistantesMap[c.id] || [];
                      const isOpen_     = selectedCentreCard === c.id;
                      const offreOk     = isOpen_ && offreChoisie && selectedCentreCard === c.id;
                      const centreKm    = userCoords ? (() => { const coords = getCentreCoords(c, master); return coords ? Math.round(haversine(userCoords.lat, userCoords.lng, coords.lat, coords.lng)) : null; })() : null;

                      return (
                        <div key={c.id} onClick={() => toggleCentreCard(c.id)}
                          style={{ gridColumn: isOpen_ ? "1 / -1" : "auto",
                            border:`2px solid ${isOpen_ ? color : "#e2e8f0"}`, borderRadius:16,
                            background: isOpen_ ? `${color}06` : "#fff",
                            cursor:"pointer", transition:"all .22s", overflow:"hidden",
                            boxShadow: isOpen_ ? `0 8px 24px ${color}20` : "none" }}>

                            {/* Bandeau couleur haut */}
                            <div style={{ height:4, background: isOpen_ ? color : "#e2e8f0", transition:"background .2s" }} />

                            <div style={{ padding:"14px 16px" }}>
                              {/* Ligne principale */}
                              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                                <div style={{ width:42, height:42, borderRadius:10, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", flexShrink:0 }}>🏢</div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontWeight:800, fontSize:".9rem", color: isOpen_ ? color : BET_DARK, lineHeight:1.2 }}>{c.nom}</div>
                                  {c.ville && (
                                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                                      <span style={{ fontSize:".72rem", color:"#64748b" }}>{c.ville}</span>
                                      {centreKm !== null && (
                                        <span style={{ fontSize:".62rem", fontWeight:700, color:"#6366f1", background:"#eef2ff", padding:"1px 5px", borderRadius:999 }}>~{centreKm} km</span>
                                      )}
                                    </div>
                                  )}
                                  {c.adresse && <div style={{ fontSize:".68rem", color:"#94a3b8", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.adresse}</div>}
                                </div>
                                <div style={{ color: isOpen_ ? color : "#94a3b8", fontWeight:800, fontSize:"1rem", transition:"transform .2s", transform: isOpen_ ? "rotate(90deg)" : "none" }}>›</div>
                              </div>

                              {/* Assistantes preview + compteur */}
                              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: offres.length > 0 ? 10 : 0 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                  {assistList.length > 0
                                    ? <AvatarStack assistantes={assistList} size={28} max={4} color={color} />
                                    : <span style={{ fontSize:".7rem", color:"#94a3b8" }}>—</span>
                                  }
                                  {assistList.length > 0 && (
                                    <span style={{ fontSize:".7rem", color:"#64748b", fontWeight:600 }}>
                                      {assistList.length} assistante{assistList.length > 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                                {offres.length > 0 && (() => {
                                  const prix = offres.map(o => parseInt((o.prix||"").replace(/\D/g,""))||0).filter(Boolean);
                                  const min  = prix.length ? Math.min(...prix) : null;
                                  return min ? (
                                    <span style={{ background:`${color}12`, color, borderRadius:999, padding:"2px 8px", fontSize:".66rem", fontWeight:800 }}>
                                      Dès {min.toLocaleString("fr")} F
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </div>

                            {/* ── Section offres (dépliée) ── */}
                            {isOpen_ && (
                              <div style={{ borderTop:`1px solid ${color}30`, padding:"14px 16px", animation:"pmSlide .2s ease" }}
                                onClick={e => e.stopPropagation()}>

                                {/* Brochure */}
                                <a href={master?.brochure_url || DEFAULT_BROCHURE_URL} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer"
                                  style={{ display:"flex", alignItems:"center", gap:6, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:8, padding:"7px 10px", marginBottom:14, textDecoration:"none" }}>
                                  <span style={{ fontSize:".9rem" }}>📄</span>
                                  <span style={{ fontSize:".72rem", fontWeight:700, color:BET_BLUE, flex:1 }}>Télécharger la brochure</span>
                                  <span style={{ fontSize:".62rem", fontWeight:700, color:"#94a3b8", background:"#f1f5f9", borderRadius:4, padding:"1px 5px" }}>PDF</span>
                                </a>

                                {offres.length === 0 ? (
                                  <p style={{ fontSize:".78rem", color:"#94a3b8", margin:"0 0 12px", textAlign:"center" }}>Contactez-nous pour les tarifs.</p>
                                ) : (
                                  <>
                                    <p style={{ fontSize:".72rem", fontWeight:700, color:"#374151", marginBottom:10, textTransform:"uppercase", letterSpacing:".05em" }}>
                                      Choisissez votre formule
                                    </p>
                                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                                      {offres.map((o, i) => {
                                        const sel = offreChoisie?.label === o.label && selectedCentreCard === c.id;
                                        return (
                                          <div key={i} onClick={() => setOffreChoisie(o)}
                                            style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 13px", borderRadius:12,
                                              border:`2px solid ${sel ? color : "#e2e8f0"}`,
                                              background: sel ? `${color}08` : "#f8fafc",
                                              cursor:"pointer", transition:"all .15s" }}>
                                            {/* Radio */}
                                            <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${sel ? color : "#cbd5e1"}`,
                                              background: sel ? color : "#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                                              {sel && <div style={{ width:7, height:7, borderRadius:"50%", background:"#fff" }} />}
                                            </div>
                                            <div style={{ flex:1, minWidth:0 }}>
                                              <div style={{ fontWeight:700, fontSize:".82rem", color: sel ? color : BET_DARK }}>{o.label}</div>
                                              {o.desc && <div style={{ fontSize:".7rem", color:"#64748b", marginTop:1 }}>{o.desc}</div>}
                                            </div>
                                            <div style={{ textAlign:"right", flexShrink:0 }}>
                                              <div style={{ fontWeight:800, fontSize:".82rem", color: sel ? color : BET_DARK }}>{o.prix}</div>
                                              {o.duration && <div style={{ fontSize:".66rem", color:"#94a3b8" }}>{o.duration}</div>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}

                                <button onClick={() => confirmerCentre(c)}
                                  disabled={offres.length > 0 && !offreOk}
                                  style={{ width:"100%", padding:"11px", borderRadius:999,
                                    background: (offres.length === 0 || offreOk) ? `linear-gradient(135deg,${color},${BET_DARK})` : "#e5e7eb",
                                    color: (offres.length === 0 || offreOk) ? "#fff" : "#94a3b8",
                                    border:"none", cursor: (offres.length === 0 || offreOk) ? "pointer" : "default",
                                    fontWeight:800, fontSize:".84rem", fontFamily:F, transition:"all .2s" }}>
                                  {offres.length > 0 && !offreOk
                                    ? "Sélectionnez une formule ↑"
                                    : `Continuer avec ${c.nom.replace("BET ","")} →`}
                                </button>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          )}

          {/* ═══ STEP p2 : cartes assistantes ═══ */}
          {step === "p2" && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <button onClick={() => { setStep("p1"); setSelectedCentreCard(centreChoisi?.id); }} style={backBtn}>← Retour</button>

              {/* Recap offre */}
              {offreChoisie && (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
                  <span style={{ fontSize:"1rem" }}>✅</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:".82rem", color:"#065f46" }}>{offreChoisie.label}</div>
                    <div style={{ fontSize:".72rem", color:"#047857" }}>{offreChoisie.prix}{offreChoisie.duration ? ` · ${offreChoisie.duration}` : ""}</div>
                  </div>
                  <button onClick={() => setStep("p1")} style={{ background:"none", border:"none", fontSize:".7rem", color:"#059669", cursor:"pointer", fontWeight:700 }}>Changer</button>
                </div>
              )}

              <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:16 }}>
                {assistantes.length} assistante{assistantes.length > 1 ? "s" : ""} — {centreChoisi?.nom}
              </p>

              {assistantes.length === 0 ? (
                <div style={{ textAlign:"center", padding:"32px 20px", background:"#f8fafc", borderRadius:14, border:"1.5px dashed #e2e8f0" }}>
                  <div style={{ fontSize:"1.8rem", marginBottom:10 }}>😔</div>
                  <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6 }}>
                    Aucune assistante assignée à ce centre.<br/>
                    <strong>Contactez-nous directement</strong> pour être pris(e) en charge.
                  </p>
                </div>
              ) : (
                <div className="pm-assist-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {assistantes.map(a => {
                    const jours = a.jours_travail || JOURS_SEMAINE;
                    const hasSemaine = jours.some(j => JOURS_SEMAINE.includes(j));
                    const hasWeekend = jours.some(j => JOURS_WEEKEND.includes(j));
                    const master  = findMaster(centreChoisi || {});
                    const color   = master?.color || BET_NAVY;
                    return (
                      <div key={a.id} className="pm-assist-card" onClick={() => choisirAssistante(a)}
                        style={{ border:"2px solid #e2e8f0", borderRadius:18, padding:"18px 14px", cursor:"pointer", transition:"all .22s", background:"#fff", textAlign:"center" }}>
                        <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                          <Avatar a={a} size={68} color={color} />
                        </div>
                        <div style={{ fontWeight:800, fontSize:".9rem", color:BET_DARK, marginBottom:2 }}>{a.prenom} {a.nom}</div>
                        <div style={{ fontSize:".72rem", color:"#94a3b8", marginBottom: a.telephone ? 4 : 8 }}>Assistante BET</div>
                        {a.telephone && (
                          <div style={{ fontSize:".72rem", color:"#0891b2", fontWeight:700, marginBottom:8 }}>📞 {a.telephone}</div>
                        )}
                        <div style={{ marginBottom:8 }}>
                          <JoursPills jours={jours} />
                        </div>
                        <div style={{ display:"flex", gap:5, justifyContent:"center", flexWrap:"wrap", marginBottom:12 }}>
                          {hasSemaine && <span style={{ fontSize:".65rem", padding:"3px 8px", borderRadius:999, background:"#eff6ff", color:"#1e40af", fontWeight:700 }}>📆 Semaine</span>}
                          {hasWeekend && <span style={{ fontSize:".65rem", padding:"3px 8px", borderRadius:999, background:"#fef3c7", color:"#92400e", fontWeight:700 }}>📅 Weekend</span>}
                        </div>
                        <div style={{ background:`linear-gradient(135deg,${color},${BET_DARK})`, color:"#fff", borderRadius:999, padding:"8px 0", fontWeight:800, fontSize:".76rem", fontFamily:F }}>
                          Choisir →
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 2 (en ligne) : assistantes ═══ */}
          {step === 2 && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <button onClick={() => setStep(1)} style={backBtn}>← Retour aux offres</button>

              {/* Recap offre choisie */}
              {offreChoisie && (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"10px 14px", marginBottom:16 }}>
                  <span style={{ fontSize:"1.1rem" }}>{offreChoisie.icon || "💻"}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:".82rem", color:BET_DARK }}>{offreChoisie.label}</div>
                    <div style={{ fontSize:".72rem", color:"#64748b" }}>{offreChoisie.prix}{offreChoisie.duration ? ` · ${offreChoisie.duration}` : ""}</div>
                  </div>
                  <button onClick={() => setStep(1)} style={{ background:"none", border:"none", fontSize:".72rem", color:"#94a3b8", cursor:"pointer", fontWeight:700 }}>Changer</button>
                </div>
              )}

              <p style={{ color:"#64748b", fontSize:".84rem", marginBottom:16, lineHeight:1.6 }}>
                Choisissez l'assistante qui vous accompagnera tout au long de votre parcours en ligne.
              </p>

              {assistantes.length === 0 ? (
                <div style={{ textAlign:"center", padding:"32px 20px", background:"#f8fafc", borderRadius:14, border:"1.5px dashed #e2e8f0" }}>
                  <div style={{ fontSize:"1.8rem", marginBottom:10 }}>😔</div>
                  <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6, margin:0 }}>Toutes nos assistantes ont atteint leur quota aujourd'hui.<br/><strong>Contactez-nous directement.</strong></p>
                </div>
              ) : (
                <div className="pm-assist-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                  {assistantes.map(a => {
                    const placesRestantes = (a.quota_jour || 5) - (a.prises_aujourd_hui || 0);
                    const wa = a.telephone
                      ? `https://wa.me/${a.telephone.replace(/\D/g,"")}?text=${encodeURIComponent(`Bonjour ${a.prenom}, je souhaite m'inscrire à un cours BET en ligne${offreChoisie ? ` — ${offreChoisie.label}` : ""}.`)}`
                      : null;
                    return (
                      <div key={a.id} className="pm-assist-card" onClick={() => choisirAssistante(a)}
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

          {/* ═══ STEP 2.5 : Auth gate ═══ */}
          {step === 2.5 && (
            <div style={{ padding:"8px 0", animation:"pmFU .3s ease" }}>
              {/* Progress recap */}
              {modeCours !== "domicile" && assistante && (
                <div style={{ display:"flex", alignItems:"center", gap:12, background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
                  {assistante.photo_url
                    ? <img src={assistante.photo_url} alt="" style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                    : <div style={{ width:42, height:42, borderRadius:"50%", background:"#1B3080", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, flexShrink:0 }}>{`${assistante.prenom?.[0]||""}${assistante.nom?.[0]||""}`.toUpperCase()}</div>
                  }
                  <div>
                    <div style={{ fontWeight:800, fontSize:".88rem" }}>{assistante.prenom} {assistante.nom}</div>
                    <div style={{ fontSize:".72rem", color:"#64748b" }}>{modeCours === "en_ligne" ? "Cours en ligne" : "Présentiel"} {offreChoisie ? `· ${offreChoisie.label}` : ""}</div>
                  </div>
                  <span style={{ marginLeft:"auto", background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"3px 10px", fontSize:".7rem", fontWeight:700 }}>✓ Sélectionnée</span>
                </div>
              )}
              {modeCours === "domicile" && (
                <div style={{ padding:"10px 14px", background:"#f0fdf4", borderRadius:10, border:"1px solid #bbf7d0", marginBottom:16, display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontSize:20 }}>🏠</span>
                  <div>
                    <div style={{ fontSize:".82rem", fontWeight:700, color:"#15803d" }}>Cours à domicile</div>
                    <div style={{ fontSize:".76rem", color:"#64748b" }}>Connectez-vous pour pré-remplir vos coordonnées automatiquement.</div>
                  </div>
                </div>
              )}
              {/* Inline Auth */}
              <div style={{ background:"#fff", borderRadius:12, border:"1.5px solid #e2e8f0", padding:"16px" }}>
                <div style={{ fontSize:".78rem", fontWeight:700, color:"#64748b", marginBottom:12, textAlign:"center" }}>Votre progression est conservée</div>
                {/* Tabs */}
                <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:"1.5px solid #e2e8f0", marginBottom:14 }}>
                  {[["login","Se connecter"],["register","Créer un compte"]].map(([t,l]) => (
                    <button key={t} onClick={() => setAuthTab(t)} style={{ flex:1, padding:"9px 0", border:"none", fontWeight:700, fontSize:".82rem", cursor:"pointer", background:authTab===t?"#1B3080":"#fff", color:authTab===t?"#fff":"#374151" }}>{l}</button>
                  ))}
                </div>
                {authTab === "login" ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <input type="email" placeholder="Email *" value={authFormPm.email} onChange={e=>setAuthFormPm(p=>({...p,email:e.target.value}))} style={{ padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:".84rem", outline:"none", boxSizing:"border-box", width:"100%" }} />
                    <input type="password" placeholder="Mot de passe *" value={authFormPm.password} onChange={e=>setAuthFormPm(p=>({...p,password:e.target.value}))} style={{ padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:".84rem", outline:"none", boxSizing:"border-box", width:"100%" }} />
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <input placeholder="Prénom *" value={authFormPm.prenom} onChange={e=>setAuthFormPm(p=>({...p,prenom:e.target.value}))} style={{ padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:".84rem", outline:"none", boxSizing:"border-box", width:"100%" }} />
                      <input placeholder="Nom *" value={authFormPm.nom} onChange={e=>setAuthFormPm(p=>({...p,nom:e.target.value}))} style={{ padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:".84rem", outline:"none", boxSizing:"border-box", width:"100%" }} />
                    </div>
                    <input type="email" placeholder="Email *" value={authFormPm.email} onChange={e=>setAuthFormPm(p=>({...p,email:e.target.value}))} style={{ padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:".84rem", outline:"none", boxSizing:"border-box", width:"100%" }} />
                    <input placeholder="Téléphone" value={authFormPm.telephone} onChange={e=>setAuthFormPm(p=>({...p,telephone:e.target.value}))} style={{ padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:".84rem", outline:"none", boxSizing:"border-box", width:"100%" }} />
                    <input type="password" placeholder="Mot de passe *" value={authFormPm.password} onChange={e=>setAuthFormPm(p=>({...p,password:e.target.value}))} style={{ padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:".84rem", outline:"none", boxSizing:"border-box", width:"100%" }} />
                  </div>
                )}
                {authErrPm && <p style={{ fontSize:".78rem", margin:"8px 0 0", color:"#dc2626", textAlign:"center" }}>{authErrPm}</p>}
                <button onClick={authTab==="login" ? handleAuthLogin : handleAuthRegister} disabled={authLoadPm}
                  style={{ width:"100%", marginTop:14, padding:"12px", background:"#1B3080", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:authLoadPm?.7:1, fontSize:".88rem" }}>
                  {authLoadPm ? "Chargement…" : authTab==="login" ? "Se connecter" : "Créer mon compte"}
                </button>
                <button onClick={() => setStep(modeCours === "domicile" ? 0 : modeCours === "en_ligne" ? 2 : "p2")}
                  style={{ width:"100%", marginTop:8, padding:"9px", background:"transparent", color:"#64748b", border:"1.5px solid #e2e8f0", borderRadius:8, fontWeight:600, fontSize:".8rem", cursor:"pointer" }}>
                  ← Retour
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP p4 : paiement (présentiel) ═══ */}
          {step === "p4" && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <button onClick={() => setStep("p2")} style={backBtn}>← Retour</button>

              {/* Recap complet */}
              <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ fontSize:".7rem", fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>Récapitulatif</div>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <Avatar a={assistante} size={42} />
                  <div>
                    <div style={{ fontWeight:800, fontSize:".88rem", color:BET_DARK }}>{assistante?.prenom} {assistante?.nom}</div>
                    <div style={{ fontSize:".72rem", color:"#64748b" }}>Présentiel · {centreChoisi?.nom} · {typeCoaching === "groupe" ? "Groupe" : "Privé"}</div>
                  </div>
                </div>
                {offreChoisie && (
                  <div style={{ borderRadius:10, background:`${BET_BLUE}07`, border:`1.5px solid ${BET_BLUE}20`, overflow:"hidden" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderBottom: offreChoisie.desc ? `1px solid ${BET_BLUE}15` : "none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:".9rem" }}>{typeCoaching === "groupe" ? "👥" : typeCoaching === "prive" ? "👤" : "📋"}</span>
                        <div>
                          <div style={{ fontWeight:800, fontSize:".84rem", color:BET_DARK }}>{offreChoisie.label}</div>
                          {offreChoisie.duration && (
                            <div style={{ fontSize:".68rem", color:"#64748b", marginTop:1 }}>⏱ {offreChoisie.duration}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontWeight:900, fontSize:".92rem", color:BET_BLUE }}>{offreChoisie.prix}</div>
                        {typeCoaching && (
                          <div style={{ fontSize:".62rem", fontWeight:700, color:"#fff", background: typeCoaching === "groupe" ? "#6366f1" : "#0891b2", borderRadius:999, padding:"1px 7px", marginTop:3, display:"inline-block" }}>
                            {typeCoaching === "groupe" ? "Groupe" : "Privé"}
                          </div>
                        )}
                      </div>
                    </div>
                    {offreChoisie.desc && (
                      <div style={{ padding:"8px 12px", fontSize:".74rem", color:"#475569", lineHeight:1.6 }}>
                        {offreChoisie.desc}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form */}
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
                <div>
                  <label style={labelStyle}>Nom complet *</label>
                  <input value={form.nom} onChange={e => { setForm(f=>({...f,nom:e.target.value})); setFormErrors(fe=>({...fe,nom:""})); }}
                    placeholder="Ex : Kouamé Yao" style={{ ...inputStyle, borderColor: formErrors.nom ? "#dc2626" : "#e2e8f0" }} />
                  {formErrors.nom && <p style={errStyle}>{formErrors.nom}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Numéro WhatsApp *</label>
                  <input value={form.telephone} onChange={e => { setForm(f=>({...f,telephone:e.target.value})); setFormErrors(fe=>({...fe,telephone:""})); }}
                    placeholder="+225 07 XX XX XX" style={{ ...inputStyle, borderColor: formErrors.telephone ? "#dc2626" : "#e2e8f0" }} />
                  {formErrors.telephone && <p style={errStyle}>{formErrors.telephone}</p>}
                </div>
                <div>
                  <label style={labelStyle}>E-mail <span style={{ color:"#94a3b8", fontWeight:400 }}>(optionnel)</span></label>
                  <input value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
                    placeholder="votre@email.com" type="email" style={inputStyle} />
                </div>
              </div>

              {/* Code promo — step p4 */}
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:".78rem", fontWeight:700, color:"#374151", marginBottom:8 }}>🏷️ Code promo <span style={{ fontWeight:400, color:"#94a3b8" }}>(optionnel)</span></p>
                {codePromoApplied ? (
                  <div style={{ display:"flex", alignItems:"center", gap:10, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"10px 14px" }}>
                    <span style={{ fontSize:"1.1rem" }}>✅</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:".82rem", color:"#166534" }}>{codePromoApplied.code} appliqué !</div>
                      <div style={{ fontSize:".72rem", color:"#166534" }}>Réduction : {codePromoApplied.type_reduction === "pourcentage" ? `-${codePromoApplied.valeur}%` : `-${Number(codePromoApplied.valeur).toLocaleString("fr-FR")} FCFA`}{codePromoApplied.description && ` · ${codePromoApplied.description}`}</div>
                    </div>
                    <button onClick={() => { setCodePromoApplied(null); setCodePromo(""); setCodePromoError(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:16, padding:0 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:8 }}>
                    <input value={codePromo} onChange={e => { setCodePromo(e.target.value.toUpperCase()); setCodePromoError(""); }}
                      onKeyDown={e => e.key === "Enter" && validerCodePromo("centres")}
                      placeholder="Ex : BET2025"
                      style={{ flex:1, padding:"10px 13px", border:`1.5px solid ${codePromoError?"#dc2626":"#e2e8f0"}`, borderRadius:9, fontSize:".82rem", fontFamily:"monospace", letterSpacing:1, outline:"none" }} />
                    <button onClick={() => validerCodePromo("centres")} disabled={!codePromo.trim() || codePromoLoading}
                      style={{ padding:"0 16px", background:BET_BLUE, color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:".78rem", opacity:(!codePromo.trim()||codePromoLoading)?.5:1, whiteSpace:"nowrap" }}>
                      {codePromoLoading ? "⏳" : "Appliquer"}
                    </button>
                  </div>
                )}
                {codePromoError && <p style={{ margin:"5px 0 0", fontSize:".72rem", color:"#dc2626" }}>{codePromoError}</p>}
              </div>

              {/* Paiement */}
              <p style={{ fontSize:".78rem", fontWeight:700, color:"#374151", marginBottom:10 }}>Mode de paiement</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
                {PAIEMENT_OPTS.map(opt => (
                  <div key={opt.mode} onClick={() => { setModePaiement(opt.mode); if (opt.mode !== "mobile_money") setMmOption(null); }}
                    style={{ border:`2px solid ${modePaiement===opt.mode ? BET_BLUE : "#e2e8f0"}`, borderRadius:14, padding:"14px 10px", cursor:"pointer", textAlign:"center",
                      background: modePaiement===opt.mode ? `${BET_BLUE}08` : "#fafafa", transition:"all .18s" }}>
                    <div style={{ fontSize:"1.5rem", marginBottom:6 }}>{opt.icon}</div>
                    <div style={{ fontWeight:800, fontSize:".74rem", color:BET_DARK, marginBottom:2 }}>{opt.label}</div>
                    <div style={{ fontSize:".64rem", color:"#94a3b8", lineHeight:1.4 }}>{opt.sub}</div>
                    {modePaiement===opt.mode && <div style={{ width:8, height:8, borderRadius:"50%", background:BET_BLUE, margin:"8px auto 0" }} />}
                  </div>
                ))}
              </div>
              {modePaiement === "mobile_money" && (
                <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px 14px", marginBottom:14, animation:"pmSlide .2s ease" }}>
                  <div style={{ fontSize:".75rem", fontWeight:700, color:"#475569", marginBottom:10 }}>Opérateur :</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {MM_OPTS.map(op => (
                      <button key={op.val} onClick={() => setMmOption(op.val)}
                        style={{ padding:"7px 13px", borderRadius:999, border:`2px solid ${mmOption===op.val ? BET_BLUE : "#e2e8f0"}`,
                          background: mmOption===op.val ? `${BET_BLUE}10` : "#fff", color: mmOption===op.val ? BET_BLUE : "#475569",
                          fontWeight:700, fontSize:".78rem", cursor:"pointer", transition:"all .15s" }}>
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={submitAssignation}
                disabled={!modePaiement || (modePaiement === "mobile_money" && !mmOption) || submitting}
                style={{ ...primaryBtn, opacity:(!modePaiement || (modePaiement==="mobile_money"&&!mmOption) || submitting) ? .5 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {submitting ? <><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"pmSpin .7s linear infinite" }}/>Envoi…</> : "Confirmer mon inscription →"}
              </button>
            </div>
          )}

          {/* ═══ STEP 3 (en ligne privé) ═══ */}
          {step === 3 && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
                <Avatar a={assistante} size={40} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:".85rem", color:BET_DARK }}>{assistante?.prenom} {assistante?.nom}</div>
                  <div style={{ fontSize:".72rem", color:"#64748b" }}>En ligne · Coaching privé</div>
                </div>
                <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"3px 10px", fontSize:".7rem", fontWeight:700, flexShrink:0 }}>✓ Connecté(e)</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div><label style={labelStyle}>Nom complet *</label>
                  <input value={form.nom} onChange={e => { setForm(f=>({...f,nom:e.target.value})); setFormErrors(fe=>({...fe,nom:""})); }} placeholder="Ex : Kouamé Yao" style={{ ...inputStyle, borderColor: formErrors.nom ? "#dc2626" : "#e2e8f0" }} />
                  {formErrors.nom && <p style={errStyle}>{formErrors.nom}</p>}</div>
                <div><label style={labelStyle}>Numéro WhatsApp *</label>
                  <input value={form.telephone} onChange={e => { setForm(f=>({...f,telephone:e.target.value})); setFormErrors(fe=>({...fe,telephone:""})); }} placeholder="+225 07 XX XX XX" style={{ ...inputStyle, borderColor: formErrors.telephone ? "#dc2626" : "#e2e8f0" }} />
                  {formErrors.telephone && <p style={errStyle}>{formErrors.telephone}</p>}</div>
                <div><label style={labelStyle}>E-mail <span style={{ color:"#94a3b8", fontWeight:400 }}>(optionnel)</span></label>
                  <input value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="votre@email.com" type="email" style={inputStyle} /></div>
                <button onClick={submitAssignation} disabled={submitting} style={{ ...primaryBtn, opacity:submitting?.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {submitting ? <><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"pmSpin .7s linear infinite" }}/>Envoi…</> : "Confirmer ma demande →"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 3.5 (en ligne groupe) : paiement ═══ */}
          {step === 3.5 && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
                <Avatar a={assistante} size={40} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:".85rem", color:BET_DARK }}>{assistante?.prenom} {assistante?.nom}</div>
                  <div style={{ fontSize:".72rem", color:"#64748b" }}>En ligne · Coaching de groupe</div>
                </div>
                <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:999, padding:"3px 10px", fontSize:".7rem", fontWeight:700, flexShrink:0 }}>✓ Connecté(e)</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
                <div><label style={labelStyle}>Nom complet *</label>
                  <input value={form.nom} onChange={e => { setForm(f=>({...f,nom:e.target.value})); setFormErrors(fe=>({...fe,nom:""})); }} placeholder="Ex : Kouamé Yao" style={{ ...inputStyle, borderColor: formErrors.nom ? "#dc2626" : "#e2e8f0" }} />
                  {formErrors.nom && <p style={errStyle}>{formErrors.nom}</p>}</div>
                <div><label style={labelStyle}>Numéro WhatsApp *</label>
                  <input value={form.telephone} onChange={e => { setForm(f=>({...f,telephone:e.target.value})); setFormErrors(fe=>({...fe,telephone:""})); }} placeholder="+225 07 XX XX XX" style={{ ...inputStyle, borderColor: formErrors.telephone ? "#dc2626" : "#e2e8f0" }} />
                  {formErrors.telephone && <p style={errStyle}>{formErrors.telephone}</p>}</div>
              </div>
              {/* Code promo — step 3.5 */}
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:".78rem", fontWeight:700, color:"#374151", marginBottom:8 }}>🏷️ Code promo <span style={{ fontWeight:400, color:"#94a3b8" }}>(optionnel)</span></p>
                {codePromoApplied ? (
                  <div style={{ display:"flex", alignItems:"center", gap:10, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"10px 14px" }}>
                    <span style={{ fontSize:"1.1rem" }}>✅</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:".82rem", color:"#166534" }}>{codePromoApplied.code} appliqué !</div>
                      <div style={{ fontSize:".72rem", color:"#166534" }}>Réduction : {codePromoApplied.type_reduction === "pourcentage" ? `-${codePromoApplied.valeur}%` : `-${Number(codePromoApplied.valeur).toLocaleString("fr-FR")} FCFA`}{codePromoApplied.description && ` · ${codePromoApplied.description}`}</div>
                    </div>
                    <button onClick={() => { setCodePromoApplied(null); setCodePromo(""); setCodePromoError(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:16, padding:0 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:8 }}>
                    <input value={codePromo} onChange={e => { setCodePromo(e.target.value.toUpperCase()); setCodePromoError(""); }}
                      onKeyDown={e => e.key === "Enter" && validerCodePromo("en_ligne")}
                      placeholder="Ex : BET2025"
                      style={{ flex:1, padding:"10px 13px", border:`1.5px solid ${codePromoError?"#dc2626":"#e2e8f0"}`, borderRadius:9, fontSize:".82rem", fontFamily:"monospace", letterSpacing:1, outline:"none" }} />
                    <button onClick={() => validerCodePromo("en_ligne")} disabled={!codePromo.trim() || codePromoLoading}
                      style={{ padding:"0 16px", background:BET_BLUE, color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:".78rem", opacity:(!codePromo.trim()||codePromoLoading)?.5:1, whiteSpace:"nowrap" }}>
                      {codePromoLoading ? "⏳" : "Appliquer"}
                    </button>
                  </div>
                )}
                {codePromoError && <p style={{ margin:"5px 0 0", fontSize:".72rem", color:"#dc2626" }}>{codePromoError}</p>}
              </div>

              <p style={{ fontSize:".78rem", fontWeight:700, color:"#374151", marginBottom:10 }}>Mode de paiement</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
                {PAIEMENT_OPTS.map(opt => (
                  <div key={opt.mode} onClick={() => { setModePaiement(opt.mode); if (opt.mode !== "mobile_money") setMmOption(null); }}
                    style={{ border:`2px solid ${modePaiement===opt.mode ? BET_BLUE : "#e2e8f0"}`, borderRadius:14, padding:"14px 10px", cursor:"pointer", textAlign:"center",
                      background: modePaiement===opt.mode ? `${BET_BLUE}08` : "#fafafa", transition:"all .18s" }}>
                    <div style={{ fontSize:"1.5rem", marginBottom:6 }}>{opt.icon}</div>
                    <div style={{ fontWeight:800, fontSize:".74rem", color:BET_DARK, marginBottom:2 }}>{opt.label}</div>
                    <div style={{ fontSize:".64rem", color:"#94a3b8", lineHeight:1.4 }}>{opt.sub}</div>
                    {modePaiement===opt.mode && <div style={{ width:8, height:8, borderRadius:"50%", background:BET_BLUE, margin:"8px auto 0" }} />}
                  </div>
                ))}
              </div>
              {modePaiement === "mobile_money" && (
                <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"12px 14px", marginBottom:14, animation:"pmSlide .2s ease" }}>
                  <div style={{ fontSize:".75rem", fontWeight:700, color:"#475569", marginBottom:10 }}>Opérateur :</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {MM_OPTS.map(op => (
                      <button key={op.val} onClick={() => setMmOption(op.val)}
                        style={{ padding:"7px 13px", borderRadius:999, border:`2px solid ${mmOption===op.val ? BET_BLUE : "#e2e8f0"}`,
                          background: mmOption===op.val ? `${BET_BLUE}10` : "#fff", color: mmOption===op.val ? BET_BLUE : "#475569",
                          fontWeight:700, fontSize:".78rem", cursor:"pointer", transition:"all .15s" }}>
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
                <span style={{ fontSize:"1.1rem", flexShrink:0 }}>💬</span>
                <p style={{ margin:0, fontSize:".78rem", color:"#1e40af", lineHeight:1.6 }}>
                  Après confirmation, <strong>{assistante?.prenom || "votre assistante"}</strong> vous contactera directement par WhatsApp ou téléphone pour finaliser votre inscription.
                </p>
              </div>
              <button onClick={submitAssignation} disabled={!modePaiement || (modePaiement === "mobile_money" && !mmOption) || submitting}
                style={{ ...primaryBtn, opacity:(!modePaiement || (modePaiement==="mobile_money"&&!mmOption) || submitting) ? .5 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {submitting ? <><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"pmSpin .7s linear infinite" }}/>Envoi…</> : "Confirmer mon inscription →"}
              </button>
            </div>
          )}

          {/* ═══ STEP 6 : domicile ═══ */}
          {step === 6 && !loading && (
            <div style={{ animation:"pmFU .3s ease" }}>
              <button onClick={() => setStep(0)} style={backBtn}>← Retour</button>
              <div style={{ display:"flex", alignItems:"center", gap:12, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12, padding:"12px 16px", marginBottom:20 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#059669,#065f46)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", flexShrink:0 }}>🏠</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:".85rem", color:"#065f46" }}>Cours à domicile / Cours privé</div>
                  <div style={{ fontSize:".75rem", color:"#047857", lineHeight:1.5, marginTop:2 }}>Un <strong>Responsable pédagogique</strong> vous contactera sous 24–48h.</div>
                </div>
              </div>
              {sbUser && <div style={{ fontSize:".75rem", color:"#059669", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"7px 12px", marginBottom:14 }}>✓ Coordonnées pré-remplies depuis votre compte</div>}
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div><label style={labelStyle}>Nom complet *</label><input value={form.nom} onChange={e => { setForm(f=>({...f,nom:e.target.value})); setFormErrors(fe=>({...fe,nom:""})); }} placeholder="Ex : Kouamé Yao" style={{ ...inputStyle, borderColor: formErrors.nom?"#dc2626":"#e2e8f0" }}/>{formErrors.nom&&<p style={errStyle}>{formErrors.nom}</p>}</div>
                <div><label style={labelStyle}>Numéro WhatsApp *</label><input value={form.telephone} onChange={e=>{setForm(f=>({...f,telephone:e.target.value}));setFormErrors(fe=>({...fe,telephone:""}));}} placeholder="+225 07 XX XX XX" style={{...inputStyle,borderColor:formErrors.telephone?"#dc2626":"#e2e8f0"}}/>{formErrors.telephone&&<p style={errStyle}>{formErrors.telephone}</p>}</div>
                <div><label style={labelStyle}>E-mail <span style={{color:"#94a3b8",fontWeight:400}}>(optionnel)</span></label><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="votre@email.com" type="email" style={inputStyle}/></div>
                <div><label style={labelStyle}>Quartier / Zone *</label><input value={zoneForm} onChange={e=>{setZoneForm(e.target.value);setFormErrors(fe=>({...fe,zone:""}));}} placeholder="Ex : Cocody Riviera…" style={{...inputStyle,borderColor:formErrors.zone?"#dc2626":"#e2e8f0"}}/>{formErrors.zone&&<p style={errStyle}>{formErrors.zone}</p>}</div>
                <div>
                  <label style={labelStyle}>Votre(vos) disponibilité(s) *</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:6, borderRadius:10, border: formErrors.dispos ? "1.5px solid #dc2626" : "none", padding: formErrors.dispos ? "8px" : 0 }}>
                    {DISPOS.map(d => { const checked = disponForm.includes(d.id); return (
                      <button key={d.id} type="button" onClick={() => { toggleDispo(d.id); setFormErrors(fe=>({...fe,dispos:""})); }}
                        style={{ display:"flex", alignItems:"center", gap:10, background: checked?"#f0fdf4":"#f8fafc", border:`1.5px solid ${checked?"#059669":"#e2e8f0"}`, borderRadius:10, padding:"9px 12px", cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
                        <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, border:`2px solid ${checked?"#059669":"#cbd5e1"}`, background:checked?"#059669":"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {checked&&<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div><div style={{ fontSize:".8rem", fontWeight:700, color:checked?"#065f46":"#374151", lineHeight:1.2 }}>{d.label}</div><div style={{ fontSize:".7rem", color:checked?"#059669":"#94a3b8", marginTop:1 }}>{d.sub}</div></div>
                      </button>
                    );})}
                  </div>
                  {formErrors.dispos && <p style={errStyle}>{formErrors.dispos}</p>}
                </div>
                <button onClick={submitDomicile} disabled={submitting} style={{ ...primaryBtn, background:"linear-gradient(135deg,#059669,#065f46)", opacity:submitting?.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:4 }}>
                  {submitting ? <><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"pmSpin .7s linear infinite" }}/>Envoi…</> : "📩 Envoyer ma demande →"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 4 : Succès ═══ */}
          {step === 4 && (
            <div style={{ animation:"pmFU .4s ease" }}>
              <div style={{ textAlign:"center", marginBottom:22 }}>
                <div style={{ width:70, height:70, borderRadius:"50%", background: modeCours==="domicile" ? "linear-gradient(135deg,#059669,#065f46)" : "linear-gradient(135deg,#22c55e,#16a34a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem", margin:"0 auto 14px", boxShadow:"0 8px 24px rgba(34,197,94,.3)" }}>
                  {modeCours === "domicile" ? "🏠" : "✓"}
                </div>
                <h3 style={{ fontFamily:F, color:BET_DARK, fontWeight:800, fontSize:"1.2rem", margin:"0 0 6px" }}>
                  {modeCours === "domicile" ? "Demande reçue !" : "Assistante assignée !"}
                </h3>
                <p style={{ color:"#475569", fontSize:".86rem", lineHeight:1.6, margin:0 }}>
                  {modeCours === "domicile"
                    ? "Un Pedagogical Advisor BET vous contactera sous 24–48h."
                    : <><strong>{assistante?.prenom} {assistante?.nom}</strong> a été notifiée et vous contactera sous peu.</>}
                </p>
              </div>

              {modeCours !== "domicile" && (
                <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"14px 16px", marginBottom:18 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom: offreChoisie ? 12 : 0 }}>
                    <Avatar a={assistante} size={50} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, color:BET_DARK, fontSize:".95rem" }}>{assistante?.prenom} {assistante?.nom}</div>
                      <div style={{ fontSize:".74rem", color:"#64748b", marginTop:2 }}>
                        {modeCours === "en_ligne" ? `En ligne · ${typeCoaching==="groupe"?"Groupe":"Privé"}` : `Présentiel · ${centreChoisi?.nom||""} · ${typeCoaching==="groupe"?"Groupe":"Privé"}`}
                      </div>
                      {assistante?.telephone && <div style={{ fontSize:".74rem", color:"#0891b2", marginTop:3 }}>📞 {assistante.telephone}</div>}
                    </div>
                    <span style={{ background:"#dcfce7", color:"#16a34a", borderRadius:999, padding:"4px 10px", fontSize:".7rem", fontWeight:800, flexShrink:0 }}>✓ Assignée</span>
                  </div>
                  {offreChoisie && (
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 10px", borderRadius:8, background:`${BET_BLUE}08`, border:`1px solid ${BET_BLUE}20` }}>
                      <span style={{ fontSize:".8rem", fontWeight:700, color:BET_DARK }}>{offreChoisie.label}</span>
                      <span style={{ fontSize:".8rem", fontWeight:800, color:BET_BLUE }}>{offreChoisie.prix}</span>
                    </div>
                  )}
                </div>
              )}

              {modeCours === "domicile" && (
                <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12, padding:"14px 16px", marginBottom:18 }}>
                  {[{ label:"Nom", val:form.nom }, { label:"WhatsApp", val:form.telephone }, { label:"Email", val:form.email||"—" }, { label:"Zone", val:zoneForm||"—" }, { label:"Dispos", val:disponForm.length>0?disponForm.map(id=>DISPOS.find(d=>d.id===id)?.label||id).join(", "):"—" }].map(r => (
                    <div key={r.label} style={{ display:"flex", justifyContent:"space-between", fontSize:".78rem", color:"#047857", marginBottom:4 }}>
                      <span style={{ color:"#64748b" }}>{r.label}</span><strong>{r.val}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {modeCours !== "domicile" && assistante?.telephone && (
                  <a href={`https://wa.me/${(assistante.telephone||"").replace(/[\s+\-()]/g,"")}`} target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", alignItems:"center", gap:12, background:"#22c55e", color:"#fff", borderRadius:12, padding:"13px 18px", textDecoration:"none", fontWeight:800, fontSize:".9rem", fontFamily:F }}>
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fff" fillOpacity=".2"/><path d="M23.5 19.9c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2c-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4-.1-.5-.1-.2-.7-1.8-1-2.4-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.3 4.7 2 .9 2.7.9 3.7.8.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" fill="#fff"/></svg>
                    Écrire sur WhatsApp
                  </a>
                )}
                <button onClick={() => { handleClose(); navigate("/mon-espace"); }}
                  style={{ display:"flex", alignItems:"center", gap:12, background: modeCours==="domicile" ? "linear-gradient(135deg,#059669,#065f46)" : `linear-gradient(135deg,${BET_BLUE},${BET_NAVY})`, color:"#fff", borderRadius:12, padding:"13px 18px", border:"none", cursor:"pointer", fontWeight:800, fontSize:".9rem", fontFamily:F }}>
                  <span style={{ fontSize:"1.2rem" }}>💬</span>
                  {modeCours === "domicile" ? "Accéder à Mon Espace" : "Discuter dans Mon Espace"}
                </button>
              </div>
              <button onClick={handleClose} style={{ ...backBtn, justifyContent:"center", width:"100%", padding:"10px 0", fontSize:".82rem", marginTop:10 }}>Fermer</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const primaryBtn = { width:"100%", background:`linear-gradient(135deg,${BET_BLUE},${BET_NAVY})`, color:"#fff", border:"none", borderRadius:999, padding:"12px", fontWeight:800, fontSize:".9rem", cursor:"pointer", fontFamily:F, transition:"opacity .2s" };
const backBtn    = { background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:".82rem", marginBottom:16, display:"flex", alignItems:"center", gap:4, padding:0 };
const labelStyle = { display:"block", fontSize:".75rem", fontWeight:700, color:BET_DARK, marginBottom:5 };
const inputStyle = { width:"100%", padding:"11px 13px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:".88rem", fontFamily:F, boxSizing:"border-box", outline:"none" };
const errStyle   = { color:"#dc2626", fontSize:".72rem", margin:"4px 0 0" };
