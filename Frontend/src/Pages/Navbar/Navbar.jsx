import React, { useEffect, useState, useRef, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./navbar.css";
import { supabase } from '../../config/supabase';

/* ─── ICÔNES SVG INLINE (inchangées) ───────────────────────────────────────── */
const IcoSearch  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoClose   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoBuild   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M9 12h.01M15 12h.01"/></svg>;
const IcoUser    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoCheck   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoPhone   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
const IcoCard    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IcoArrow   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IcoChevron = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoLogout  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoGlobe   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IcoStar    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoChild   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="3"/><path d="M12 8v5m0 0-3 4m3-4 3 4"/><path d="M9 21h6"/></svg>;
const IcoGoogle  = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);
const IcoMail    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcoLock    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcoEye     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoEyeOff  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

/* ─── DONNÉES (inchangées) ───────────────────────────────────────────────── */
const searchableItems = [
  { type:"page",          title:"Accueil",                path:"/",                     keywords:["accueil","home"] },
  { type:"page",          title:"À propos",               path:"/about",                keywords:["à propos","about"] },
  { type:"cours",         title:"Cours en ligne",         path:"/cours/en-ligne",        keywords:["en ligne","online","distance"] },
  { type:"cours",         title:"Cours aux cabinets",     path:"/cours/cabinet",         keywords:["cabinet","présentiel"] },
  { type:"cours",         title:"Cours à domicile",       path:"/cours/domicile",        keywords:["domicile","particulier"] },
  { type:"certification", title:"TOEIC",                  path:"/certification/toeic",   keywords:["toeic","anglais","certification"] },
  { type:"certification", title:"TOEFL",                  path:"/certification/toefl",   keywords:["toefl","américain"] },
  { type:"certification", title:"IELTS",                  path:"/certification/ielts",   keywords:["ielts","britannique"] },
  { type:"centre",        title:"Centre Bouaké",          path:"/centre/bouake",         keywords:["bouaké"] },
  { type:"centre",        title:"Centre Angré",           path:"/centre/angre",          keywords:["angré"] },
  { type:"centre",        title:"Centre Abatta",          path:"/centre/abatta",         keywords:["abatta"] },
  { type:"centre",        title:"Centre Yopougon",        path:"/centre/yopougon",       keywords:["yopougon"] },
  { type:"centre",        title:"Centre Koumassi",        path:"/centre/koumassi",       keywords:["koumassi"] },
  { type:"centre",        title:"Centre II Plateaux",     path:"/centre/2plateaux",      keywords:["plateaux"] },
  // { type:"service",       title:"Séjour linguistique",    path:"/service/sejour",        keywords:["séjour","linguistique"] },
  { type:"service",       title:"Préparation interviews", path:"/service/interview",     keywords:["interview","entretien"] },
  { type:"service",       title:"Plateforme natifs",      path:"/service/natifs",        keywords:["natifs","native"] },
  { type:"service",       title:"Interprétariat",         path:"/service/interpretariat",keywords:["interprétariat"] },
];

const popularTopics = ["TOEIC","Cours en ligne","Anglais des affaires","Préparation IELTS","Cours à domicile","Séjour linguistique"];

const MARQUEE_MESSAGES = [
  "🎓 Nouveau · Cours intensifs TOEIC — Session de Juin ouverte !",
  "🌍 Séjours linguistiques UK, USA, Canada — Places limitées !",
  "📢 Test de niveau 100% gratuit — Connaissez votre niveau en 20 min !",
  "🏆 Nos apprenants obtiennent en moyenne 750+ au TOEIC dès le 1er passage !",
  "💼 Formations entreprises : tarifs dégressifs à partir de 5 employés !",
  "🎁 Offre spéciale · -15% sur l'inscription en ligne jusqu'au 30 juin !",
];

const plansEntreprise = [
  { id:"starter",    label:"Starter",    price:"75 000",   freq:"/mois", features:["Jusqu'à 5 employés","Cours en ligne illimités","Rapports mensuels","Support email"] },
  { id:"business",   label:"Business",   price:"150 000",  freq:"/mois", features:["Jusqu'à 20 employés","Cours présentiel 2×/sem.","Dashboard RH","Support dédié"], popular:true },
  { id:"enterprise", label:"Enterprise", price:"Sur devis",freq:"",      features:["Effectif illimité","Programme sur-mesure","Chef de projet attitré","API & intégrations"] },
];
const plansParticulier = [
  { id:"decouverte", label:"Découverte", price:"15 000", freq:"/mois", features:["2 cours / semaine","Exercices en ligne","Accès 3 mois","Support communauté"] },
  { id:"intensif",   label:"Intensif",   price:"30 000", freq:"/mois", features:["5 cours / semaine","Coach personnel","Accès illimité","Préparation certif."], popular:true },
  { id:"premium",    label:"Premium",    price:"50 000", freq:"/mois", features:["Cours illimités","Tuteur natif","Immersion linguistique","Certification incluse"] },
];
const plansEnfant = [
  { id:"junior",   label:"Junior (6–10 ans)",  price:"12 000", freq:"/mois", features:["2 cours/semaine","Niveau A1–A2","Supports illustrés","Suivi mensuel parent"] },
  { id:"ado",      label:"Ado (11–17 ans)",     price:"20 000", freq:"/mois", features:["3 cours/semaine","Niveaux A1–B1","Coach dédié","Prépa examens scolaires"], popular:true },
  { id:"intensif", label:"Intensif Junior",     price:"35 000", freq:"/mois", features:["5 cours/semaine","Tous niveaux","Tuteur natif","Certification junior"] },
];
const COMMERCIAUX = [
  { id:"amina",   nom:"Amina Coulibaly",  role:"Conseillère Senior",        initiales:"AC" },
  { id:"fatou",   nom:"Fatou Diallo",     role:"Conseillère Parcours",      initiales:"FD" },
  { id:"marie",   nom:"Marie Yao",        role:"Conseillère Entreprises",   initiales:"MY" },
  { id:"ibrahim", nom:"Ibrahim Koné",     role:"Conseiller Certifications", initiales:"IK" },
  { id:"aissata", nom:"Aissatou Bah",     role:"Conseillère Enfants",       initiales:"AB" },
  { id:"david",   nom:"David Assoumou",   role:"Conseiller Premium",        initiales:"DA" },
];

const NAV_DROPDOWNS = [
  { key:"cours",          label:"Nos cours",      links:[{to:"/cours/en-ligne",l:"Cours en ligne"},{to:"/cours/cabinet",l:"Cours aux cabinets"},{to:"/cours/domicile",l:"Cours à domicile"}] },
  { key:"certifications", label:"Certifications", links:[{to:"/certification/toeic",l:"TOEIC"},{to:"/certification/toefl",l:"TOEFL"},{to:"/certification/ielts",l:"IELTS"}] },
  { key:"centres",        label:"Centres",        links:[{to:"/centre/bouake",l:"Bouaké"},{to:"/centre/angre",l:"Angré"},{to:"/centre/abatta",l:"Abatta"},{to:"/centre/yopougon",l:"Yopougon"},{to:"/centre/koumassi",l:"Koumassi"},{to:"/centre/2plateaux",l:"II Plateaux"}] },
  // { key:"services",       label:"Services",       links:[{to:"/service/sejour",l:"Séjour linguistique"},{to:"/service/interview",l:"Préparation interviews"},{to:"/service/natifs",l:"Plateforme natifs"},{to:"/service/interpretariat",l:"Interprétariat"}] },
  { key:"parcours",       label:"Parcours",       links:[{to:"/parcours/particulier",l:"Particuliers"},{to:"/parcours/entreprise",l:"Entreprises"}] },
];

/* ════════════════════════════════════════════════════════════════════════════
   NAVBAR (avec notifications)
════════════════════════════════════════════════════════════════════════════ */
const Navbar = () => {
  const navigate = useNavigate();

  const [scrolled,       setScrolled]       = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [lang,           setLang]           = useState("FR");

  /* Auth ── */
  const [user,            setUser]            = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  /* Modal connexion ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab,   setActiveTab]   = useState("login");
  const [showPwd,     setShowPwd]     = useState(false);
  const [loginData,   setLoginData]   = useState({ email:"", password:"" });
  const [regData,     setRegData]     = useState({ name:"", email:"", tel:"", password:"" });

  /* Notifications */
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  // Effacement automatique des messages après 3 secondes
  useEffect(() => {
    if (loginError) setTimeout(() => setLoginError(""), 3000);
    if (loginSuccess) setTimeout(() => setLoginSuccess(""), 3000);
    if (registerError) setTimeout(() => setRegisterError(""), 3000);
    if (registerSuccess) setTimeout(() => setRegisterSuccess(""), 3000);
  }, [loginError, loginSuccess, registerError, registerSuccess]);

  /* Recherche ── */
  const [isSearchOpen,  setIsSearchOpen]  = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);

  /* Tunnel ── */
  const [tunnelOpen,    setTunnelOpen]    = useState(false);
  const [tunnelType,    setTunnelType]    = useState(null);
  const [tunnelStep,    setTunnelStep]    = useState(1);
  const [selectedPlan,  setSelectedPlan]  = useState(null);
  const [payMethod,     setPayMethod]     = useState(null);
  const [mobileOp,      setMobileOp]      = useState(null);
  const [formData,      setFormData]      = useState({ nom:"", email:"", tel:"", societe:"", effectif:"", besoin:"" });
  const [payData,       setPayData]       = useState({ numero:"", cardNum:"", expiry:"", cvv:"", holder:"" });
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [tunnelErreur,  setTunnelErreur]  = useState("");
  const [enfantData,    setEnfantData]    = useState({ prenom_enfant:"", nom_enfant:"", tranche_age:"", nom_parent:"", email_parent:"", tel_parent:"" });
  const [selectedCommercial, setSelectedCommercial] = useState("");

  /* ── Scroll ── */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* ── Fermeture dropdown + profil au clic extérieur ── */
  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest(".dropdown")) setActiveDropdown(null);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Recherche ── */
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(searchableItems.filter(i =>
      i.title.toLowerCase().includes(q) || i.keywords.some(k => k.toLowerCase().includes(q))
    ));
  }, [searchQuery]);

  const handleNavClick = useCallback(() => {
    setActiveDropdown(null);
    setMenuOpen(false);
  }, []);

  const toggleDropdown = (key) => setActiveDropdown(p => p === key ? null : key);

  const openSearch = () => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 80); };
  const closeSearch = () => { setIsSearchOpen(false); setSearchQuery(""); setSearchResults([]); };

  /* ══════════════════════════════════════════════════════════
     AUTHENTIFICATION — source unique : session Supabase
     • Email/password  → backend → supabase.auth.setSession()
     • Google OAuth    → supabase.auth.signInWithOAuth()
     • Au chargement   → supabase.auth.getSession() + onAuthStateChange
  ══════════════════════════════════════════════════════════ */

  const buildUser = (supaUser) => {
    const meta = supaUser.user_metadata || {};
    const fullName = (meta.nom && meta.prenom)
      ? `${meta.nom} ${meta.prenom}`
      : meta.full_name || supaUser.email.split("@")[0];
    return {
      ...supaUser,
      name: fullName,
      role: "Apprenant",
    };
  };

  const syncProfile = async (session) => {
    try {
      await fetch("http://localhost:5001/api/auth/sync-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });
    } catch {}
  };

  useEffect(() => {
    // 1. Nettoyage de l'ancien système JWT (migration)
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    // 2. Vérifier la session Supabase existante (OAuth callback ou session persistée)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(buildUser(session.user));
        syncProfile(session);
      }
    });

    // 3. Écouter tous les changements d'état (login, logout, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(buildUser(session.user));
        syncProfile(session);
        setIsModalOpen(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(buildUser(session.user));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ── Connexion email/password ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");
    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginData.email, password: loginData.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Email ou mot de passe incorrect");

      // Synchroniser la session dans le client Supabase → onAuthStateChange prend le relais
      await supabase.auth.setSession({
        access_token:  data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      setLoginSuccess("Connexion réussie !");
      setTimeout(() => setIsModalOpen(false), 800);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  /* ── Inscription email/password ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    try {
      const nameParts = regData.name.trim().split(" ");
      const response = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom:       nameParts[0] || "",
          prenom:    nameParts.slice(1).join(" ") || "",
          email:     regData.email,
          telephone: regData.tel,
          password:  regData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur lors de l'inscription");

      setRegisterSuccess("Compte créé ! Connexion automatique…");

      // Connexion immédiate via Supabase client
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    regData.email,
        password: regData.password,
      });
      if (signInErr) throw new Error(signInErr.message);
      // onAuthStateChange déclenche setUser automatiquement
      setTimeout(() => setIsModalOpen(false), 800);
    } catch (err) {
      setRegisterError(err.message);
    }
  };

  /* ── Google OAuth (connexion ET inscription) ── */
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
    } catch (err) {
      setRegisterError("Erreur lors de la connexion avec Google.");
    }
  };

  /* ── Déconnexion ── */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  /* ── Mise à jour profil ── */
  const updateProfile = async (updatedData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const response = await fetch("http://localhost:5001/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(updatedData),
    });
    const data = await response.json();
    if (response.ok) setUser(prev => ({ ...prev, ...data.user }));
  };

  const initials = (name = "") => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  /* ── Tunnel ── */
  const openTunnel = (type) => {
    setTunnelType(type); setTunnelStep(1); setSelectedPlan(null);
    setPayMethod(null); setMobileOp(null);
    setFormData({ nom:"", email:"", tel:"", societe:"", effectif:"", besoin:"" });
    setPayData({ numero:"", cardNum:"", expiry:"", cvv:"", holder:"" });
    setEnfantData({ prenom_enfant:"", nom_enfant:"", tranche_age:"", nom_parent:"", email_parent:"", tel_parent:"" });
    setSelectedCommercial("");
    setTunnelErreur("");
    setTunnelOpen(true);
  };

  const isEnfant = tunnelType === "enfant";
  const maxStep = isEnfant ? 3 : 4;
  const plans = tunnelType === "entreprise" ? plansEntreprise : isEnfant ? plansEnfant : plansParticulier;

  const canGo1 = isEnfant
    ? (enfantData.prenom_enfant && enfantData.nom_enfant && enfantData.tranche_age)
    : (formData.nom && formData.email && formData.tel);
  const canGo2 = isEnfant
    ? (enfantData.nom_parent && enfantData.email_parent && enfantData.tel_parent)
    : !!selectedPlan;
  const canGo3 = isEnfant
    ? true
    : (payMethod === "mobile"
        ? mobileOp && payData.numero.length >= 8
        : payData.cardNum.length >= 16 && payData.expiry && payData.cvv && payData.holder);

  const stepLabels = isEnfant
    ? ["Mon enfant", "Parent & Suivi", "Confirmation"]
    : ["Profil", "Plan", "Paiement", "Confirmation"];
  const selectedPlanObj = plans?.find(p => p.id === selectedPlan);

  const nextStep = async () => {
    if (tunnelStep===1 && !canGo1) return;
    if (tunnelStep===2 && !canGo2) return;
    if (tunnelStep===3 && !canGo3) return;

    const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

    /* ── Tunnel Enfant : soumission à l'étape 2 ── */
    if (isEnfant && tunnelStep === 2) {
      setTunnelLoading(true);
      setTunnelErreur("");
      try {
        await fetch(`${API}/api/inscriptions/enfant/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prenom_enfant:  enfantData.prenom_enfant,
            nom_enfant:     enfantData.nom_enfant,
            tranche_age:    enfantData.tranche_age,
            nom_parent:     enfantData.nom_parent,
            email_parent:   enfantData.email_parent,
            tel_parent:     enfantData.tel_parent,
            commercial_id:  selectedCommercial || null,
            statut:         "en_attente",
          }),
        }).then(r => { if (!r.ok) throw new Error(); });
        setTunnelStep(3);
      } catch {
        setTunnelErreur("Une erreur est survenue. Veuillez réessayer ou nous contacter directement.");
      } finally {
        setTunnelLoading(false);
      }
      return;
    }

    /* ── Tunnel Particulier / Entreprise : soumission à l'étape 3 ── */
    if (!isEnfant && tunnelStep === 3) {
      setTunnelLoading(true);
      setTunnelErreur("");
      try {
        const modeP = payMethod === "mobile"
          ? `Mobile Money ${mobileOp || ""} — ${payData.numero}`
          : `Carte bancaire — ${payData.holder}`;
        if (tunnelType === "entreprise") {
          await fetch(`${API}/api/entreprise/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entreprise:    formData.societe || formData.nom,
              contact:       formData.nom,
              email:         formData.email,
              telephone:     formData.tel,
              nb_employes:   formData.effectif || null,
              besoins:       [formData.besoin, selectedPlanObj?.label, modeP].filter(Boolean).join(" | ") || null,
              commercial_id: selectedCommercial || null,
            }),
          }).then(r => { if (!r.ok) throw new Error(); });
        } else {
          await fetch(`${API}/api/inscriptions/adulte/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nom_complet:   formData.nom,
              email:         formData.email,
              telephone:     formData.tel,
              offre_titre:   selectedPlanObj?.label || null,
              mode_paiement: modeP,
              commercial_id: selectedCommercial || null,
              statut:        "en_attente",
            }),
          }).then(r => { if (!r.ok) throw new Error(); });
        }
        setTunnelStep(4);
      } catch {
        setTunnelErreur("Une erreur est survenue. Veuillez réessayer ou nous contacter directement.");
      } finally {
        setTunnelLoading(false);
      }
      return;
    }

    if (tunnelStep < maxStep) setTunnelStep(s => s + 1);
  };

  const BET_CENTERS = {
    angre: { name: "Angré", phone: "2250700000001", message: "Bonjour, je souhaite des informations sur les formations BET à Angré." },
    bouake: { name: "Bouaké", phone: "2250700000002", message: "Bonjour, je souhaite des informations sur les formations BET à Bouaké." },
    plateaux: { name: "II Plateaux", phone: "2250700000003", message: "Bonjour, je souhaite des informations sur les formations BET à Plateaux." },
    Yopougon: { name: "Yopougon", phone: "2250700000001", message: "Bonjour, je souhaite des informations sur les formations BET à Angré." },
    Koumassi: { name: "Koumassi", phone: "2250700000002", message: "Bonjour, je souhaite des informations sur les formations BET à Bouaké." },
    Abatta: { name: "Abatta", phone: "2250700000003", message: "Bonjour, je souhaite des informations sur les formations BET à Plateaux." }
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className={`navbar-container ${scrolled ? "scrolled" : ""}`}>
      <div className="marquee-bar">
        <div className="marquee-track">
          {[...MARQUEE_MESSAGES, ...MARQUEE_MESSAGES].map((msg, i) => (
            <span key={i} className="marquee-item">{msg}<span className="marquee-dot">·</span></span>
          ))}
        </div>
      </div>

      <div className="parcours-banner">
        <div className="parcours-group">
          <span className="parcours-label">Commencez votre parcours :</span>
          <button className="parcours-btn parcours-btn--b2b" onClick={() => openTunnel("entreprise")}>
            <IcoBuild /> Je suis une entreprise
          </button>
          <button className="parcours-btn parcours-btn--b2c" onClick={() => openTunnel("particulier")}>
            <IcoUser /> Je suis un particulier
          </button>
          <button className="parcours-btn parcours-btn--enfant" onClick={() => openTunnel("enfant")}>
            <IcoChild /> J'inscris mon enfant
          </button>
        </div>
        <div className="bet-group">
          <span className="bet-label">📍 Contactez votre centre BET :</span>
          <div className="bet-buttons">
            {Object.entries(BET_CENTERS).map(([key, center]) => (
              <button
                key={key}
                className={`bet-btn bet-btn--${key}`}
                onClick={() => window.open(`https://wa.me/${center.phone}?text=${encodeURIComponent(center.message)}`)}
              >
                📍 {center.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="navbar">
        <div className="logo">
          <NavLink to="/" onClick={handleNavClick}>
            <img src="/assets/BIINIES-ENGLISH-LOGO.png" alt="Binnie's" className="logo-img" />
          </NavLink>
        </div>

        <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
          <li><NavLink to="/" onClick={handleNavClick}>Accueil</NavLink></li>
          {NAV_DROPDOWNS.map(({ key, label, links }) => (
            <li key={key} className="dropdown">
              <div className="dropdown-trigger" onClick={() => toggleDropdown(key)}>
                {label} <span className={`chevron ${activeDropdown===key?"open":""}`}><IcoChevron /></span>
              </div>
              <ul className={`dropdown-menu ${activeDropdown===key ? "show" : ""}`}>
                {links.map(({ to, l }) => (
                  <li key={to}>
                    <NavLink to={to} onClick={handleNavClick}>{l}</NavLink>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li><NavLink to="/test-niveau" onClick={handleNavClick}>Test de niveau</NavLink></li>
          <li><NavLink to="/about" onClick={handleNavClick}>À propos</NavLink></li>
          <li><NavLink to="/contact" onClick={handleNavClick}>Contact</NavLink></li>
        </ul>

        <div className="nav-right">
          <button className="icon-btn" onClick={openSearch} aria-label="Rechercher"><IcoSearch /></button>
          <button className="lang-btn" onClick={() => setLang(l => l==="FR"?"EN":"FR")}>
            <IcoGlobe />
            <span>{lang === "FR" ? "🇫🇷 FR" : "🇬🇧 EN"}</span>
            <span className="lang-slash">/</span>
            <span className="lang-other">{lang === "FR" ? "EN" : "FR"}</span>
          </button>

          {!user ? (
            <button className="btn-login" onClick={() => setIsModalOpen(true)}>Connexion</button>
          ) : (
            <div className="profile-wrap" ref={profileRef}>
              <button className="profile-btn" onClick={() => setProfileMenuOpen(p => !p)}>
                <div className="profile-avatar">
                  {user.avatar ? <img src={user.avatar} alt="" /> : <span>{initials(user.name)}</span>}
                  <span className="online-dot" />
                </div>
               <span className="profile-name">
  {user?.name || user?.email?.split("@")[0] || "Utilisateur"}
</span>
                <span className={`chevron ${profileMenuOpen?"open":""}`}><IcoChevron /></span>
              </button>
              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <div className="pd-header">
                    <div className="pd-avatar-lg">{initials(user?.name || user?.email || "?")}</div>
                    <div>
                      <div className="pd-name">{user.name}</div>
                      <div className="pd-email">{user.email}</div>
                      <span className="pd-badge">{user.role}</span>
                    </div>
                  </div>
                  <div className="pd-links">
                    <NavLink to="/mon-espace" className="pd-link" onClick={() => setProfileMenuOpen(false)}>Mon espace</NavLink>
                  </div>
                  <div className="pd-footer">
                    <button className="pd-logout" onClick={handleLogout}><IcoLogout /> Déconnexion</button>
                  </div>
                </div>
              )}
            </div>
          )}
          <button className={`burger ${menuOpen?"open":""}`} onClick={() => setMenuOpen(p=>!p)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* TUNNEL B2B / B2C (inchangé) */}
      {tunnelOpen && (
        <div className="tunnel-overlay" onClick={() => setTunnelOpen(false)}>
          <div className="tunnel-container" onClick={e => e.stopPropagation()}>
            <div className={`tunnel-header ${tunnelType==="entreprise"?"th--b2b":isEnfant?"th--enfant":"th--b2c"}`}>
              <div className="th-left">
                {tunnelType==="entreprise"?<IcoBuild />:isEnfant?<IcoChild />:<IcoUser />}
                <span>{tunnelType==="entreprise"?"Espace Entreprise":isEnfant?"Inscription Enfant":"Espace Particulier"}</span>
              </div>
              <button className="tunnel-close" onClick={() => setTunnelOpen(false)}><IcoClose /></button>
            </div>
            <div className="tunnel-stepper">
              {stepLabels.map((label, i) => (
                <React.Fragment key={i}>
                  <div className={`ts-step ${tunnelStep>i+1?"done":""} ${tunnelStep===i+1?"active":""}`}>
                    <div className="ts-dot">{tunnelStep>i+1?<IcoCheck />:i+1}</div>
                    <span className="ts-label">{label}</span>
                  </div>
                  {i < stepLabels.length-1 && <div className={`ts-line ${tunnelStep>i+1?"done":""}`} />}
                </React.Fragment>
              ))}
            </div>
            {/* ── Étape 1 ── */}
            {tunnelStep === 1 && !isEnfant && (
              <div className="tunnel-body">
                <h2 className="t-title">{tunnelType==="entreprise"?"Parlez-nous de votre entreprise":"Votre profil d'apprentissage"}</h2>
                <p className="t-sub">{tunnelType==="entreprise"?"Nous personnalisons votre programme selon vos besoins.":"Quelques infos pour adapter votre parcours."}</p>
                <div className="tunnel-form">
                  <div className="tfield"><label>Nom complet *</label><input placeholder="Jean Kouamé" value={formData.nom} onChange={e=>setFormData(p=>({...p,nom:e.target.value}))} /></div>
                  <div className="tfield"><label>Email *</label><input type="email" placeholder="jean@exemple.com" value={formData.email} onChange={e=>setFormData(p=>({...p,email:e.target.value}))} /></div>
                  <div className="tfield"><label>Téléphone *</label><input placeholder="+225 07 00 00 00 00" value={formData.tel} onChange={e=>setFormData(p=>({...p,tel:e.target.value}))} /></div>
                  {tunnelType==="entreprise" && <>
                    <div className="tfield"><label>Société</label><input placeholder="Mon Entreprise SARL" value={formData.societe} onChange={e=>setFormData(p=>({...p,societe:e.target.value}))} /></div>
                    <div className="tfield"><label>Effectif à former</label>
                      <select value={formData.effectif} onChange={e=>setFormData(p=>({...p,effectif:e.target.value}))}>
                        <option value="">Sélectionner</option>
                        <option>1–5</option><option>6–20</option><option>21–50</option><option>50+</option>
                      </select>
                    </div>
                  </>}
                  <div className="tfield tfield--full"><label>Objectif</label>
                    <select value={formData.besoin} onChange={e=>setFormData(p=>({...p,besoin:e.target.value}))}>
                      <option value="">Choisir un objectif</option>
                      {tunnelType==="entreprise"
                        ? <><option>Communication interne</option><option>Certifications</option><option>Relation client internationale</option><option>Missions à l'étranger</option></>
                        : <><option>TOEIC / TOEFL / IELTS</option><option>Anglais professionnel</option><option>Études à l'étranger</option><option>Parler couramment</option></>}
                    </select>
                  </div>
                  {/* Choix du commercial */}
                  <div className="tfield tfield--full">
                    <label>Votre conseiller(ère) BET <span style={{fontWeight:400,color:"#94a3b8"}}>(optionnel)</span></label>
                    <div className="commercial-grid">
                      {COMMERCIAUX.map(c => (
                        <div
                          key={c.id}
                          className={`commercial-card ${selectedCommercial===c.id?"commercial-card--sel":""}`}
                          onClick={() => setSelectedCommercial(p => p===c.id ? "" : c.id)}
                        >
                          <div className="commercial-av">{c.initiales}</div>
                          <div className="commercial-info">
                            <div className="commercial-nom">{c.nom}</div>
                            <div className="commercial-role">{c.role}</div>
                          </div>
                          {selectedCommercial===c.id && <div className="commercial-check"><IcoCheck /></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Étape 1 Enfant ── */}
            {tunnelStep === 1 && isEnfant && (
              <div className="tunnel-body">
                <h2 className="t-title">Informations sur l'enfant</h2>
                <p className="t-sub">Dites-nous en plus sur votre enfant pour adapter le parcours.</p>
                <div className="tunnel-form">
                  <div className="tfield"><label>Prénom de l'enfant *</label><input placeholder="Kouamé" value={enfantData.prenom_enfant} onChange={e=>setEnfantData(p=>({...p,prenom_enfant:e.target.value}))} /></div>
                  <div className="tfield"><label>Nom de l'enfant *</label><input placeholder="Diallo" value={enfantData.nom_enfant} onChange={e=>setEnfantData(p=>({...p,nom_enfant:e.target.value}))} /></div>
                  <div className="tfield tfield--full"><label>Tranche d'âge *</label>
                    <select value={enfantData.tranche_age} onChange={e=>setEnfantData(p=>({...p,tranche_age:e.target.value}))}>
                      <option value="">Sélectionner l'âge</option>
                      <option value="4-5">4 – 5 ans</option>
                      <option value="6-7">6 – 7 ans</option>
                      <option value="8-10">8 – 10 ans</option>
                      <option value="11-13">11 – 13 ans</option>
                      <option value="14-17">14 – 17 ans</option>
                    </select>
                  </div>
                </div>
                <div style={{marginTop:20, padding:"14px 16px", background:"#fef9ec", borderRadius:10, fontSize:".82rem", color:"#92400e", border:"1px solid #fde68a"}}>
                  🎓 Nos parcours enfants sont animés par des coachs spécialisés en pédagogie jeunesse, niveau A1 à B1.
                </div>
              </div>
            )}

            {/* ── Étape 2 : Choix du plan (particulier / entreprise) ── */}
            {tunnelStep === 2 && !isEnfant && (
              <div className="tunnel-body">
                <h2 className="t-title">Choisissez votre formule</h2>
                <p className="t-sub">Sans engagement. Changez ou annulez à tout moment.</p>
                <div className="plans-grid">
                  {plans.map(p => (
                    <div key={p.id} className={`plan-card ${p.popular?"plan-card--pop":""} ${selectedPlan===p.id?"plan-card--sel":""}`} onClick={()=>setSelectedPlan(p.id)}>
                      {p.popular && <div className="plan-badge"><IcoStar /> Populaire</div>}
                      <div className="plan-name">{p.label}</div>
                      <div className="plan-price"><span className="plan-amt">{p.price}</span><span className="plan-freq"> FCFA{p.freq}</span></div>
                      <ul className="plan-features">{p.features.map((f,i)=><li key={i}><IcoCheck />{f}</li>)}</ul>
                      <div className={`plan-radio ${selectedPlan===p.id?"checked":""}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Étape 2 Enfant : infos parent + conseiller ── */}
            {tunnelStep === 2 && isEnfant && (
              <div className="tunnel-body">
                <h2 className="t-title">Informations du parent</h2>
                <p className="t-sub">Ces données nous permettent de vous contacter pour le suivi de votre enfant.</p>
                <div className="tunnel-form">
                  <div className="tfield"><label>Votre nom complet *</label><input placeholder="Jean Kouamé" value={enfantData.nom_parent} onChange={e=>setEnfantData(p=>({...p,nom_parent:e.target.value}))} /></div>
                  <div className="tfield"><label>Email *</label><input type="email" placeholder="parent@exemple.com" value={enfantData.email_parent} onChange={e=>setEnfantData(p=>({...p,email_parent:e.target.value}))} /></div>
                  <div className="tfield"><label>Téléphone *</label><input placeholder="+225 07 00 00 00 00" value={enfantData.tel_parent} onChange={e=>setEnfantData(p=>({...p,tel_parent:e.target.value}))} /></div>
                  {/* Choix du commercial */}
                  <div className="tfield tfield--full">
                    <label>Votre conseiller(ère) BET <span style={{fontWeight:400,color:"#94a3b8"}}>(optionnel)</span></label>
                    <p style={{fontSize:".8rem",color:"#64748b",margin:"4px 0 10px"}}>Choisissez un conseiller pour le suivi accompagné de votre enfant.</p>
                    <div className="commercial-grid">
                      {COMMERCIAUX.map(c => (
                        <div
                          key={c.id}
                          className={`commercial-card ${selectedCommercial===c.id?"commercial-card--sel":""}`}
                          onClick={() => setSelectedCommercial(p => p===c.id ? "" : c.id)}
                        >
                          <div className="commercial-av">{c.initiales}</div>
                          <div className="commercial-info">
                            <div className="commercial-nom">{c.nom}</div>
                            <div className="commercial-role">{c.role}</div>
                          </div>
                          {selectedCommercial===c.id && <div className="commercial-check"><IcoCheck /></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Étape 3 : Paiement (particulier / entreprise) ── */}
            {tunnelStep === 3 && !isEnfant && (
              <div className="tunnel-body">
                <h2 className="t-title">Paiement sécurisé</h2>
                <div className="order-summary">
                  <span>Plan :</span>
                  <strong>{plans.find(p=>p.id===selectedPlan)?.label} — {plans.find(p=>p.id===selectedPlan)?.price} FCFA{plans.find(p=>p.id===selectedPlan)?.freq}</strong>
                </div>
                <div className="pay-methods">
                  <button className={`pay-btn ${payMethod==="mobile"?"active":""}`} onClick={()=>setPayMethod("mobile")}><IcoPhone /> Mobile Money</button>
                  <button className={`pay-btn ${payMethod==="card"?"active":""}`} onClick={()=>setPayMethod("card")}><IcoCard /> Carte bancaire</button>
                </div>
                {payMethod==="mobile" && (
                  <div>
                    <div className="mobile-ops">
                      {[{id:"orange",label:"Orange Money",color:"#ff7900"},{id:"mtn",label:"MTN MoMo",color:"#ffcc00"},{id:"wave",label:"Wave",color:"#1fb6ff"},{id:"moov",label:"Moov Money",color:"#00a86b"}].map(op=>(
                        <button key={op.id} className={`mobile-op ${mobileOp===op.id?"active":""}`} style={{"--oc":op.color}} onClick={()=>setMobileOp(op.id)}>{op.label}</button>
                      ))}
                    </div>
                    {mobileOp && <div className="tfield" style={{marginTop:"1rem"}}>
                      <label>Numéro {mobileOp}</label>
                      <input placeholder="07 00 00 00 00" value={payData.numero} onChange={e=>setPayData(p=>({...p,numero:e.target.value.replace(/\D/g,"")}))} maxLength={10} />
                      <span className="tfield-hint">Vous recevrez une invite de paiement sur ce numéro.</span>
                    </div>}
                  </div>
                )}
                {payMethod==="card" && (
                  <div className="tunnel-form">
                    <div className="tfield tfield--full"><label>Titulaire</label><input placeholder="Jean Kouamé" value={payData.holder} onChange={e=>setPayData(p=>({...p,holder:e.target.value}))} /></div>
                    <div className="tfield tfield--full"><label>Numéro de carte</label><input placeholder="•••• •••• •••• ••••" value={payData.cardNum.replace(/(.{4})/g,"$1 ").trim()} onChange={e=>setPayData(p=>({...p,cardNum:e.target.value.replace(/\D/g,"")}))} maxLength={19} /></div>
                    <div className="tfield"><label>Expiration</label><input placeholder="MM/AA" value={payData.expiry} onChange={e=>setPayData(p=>({...p,expiry:e.target.value}))} maxLength={5} /></div>
                    <div className="tfield"><label>CVV</label><input placeholder="•••" type="password" value={payData.cvv} onChange={e=>setPayData(p=>({...p,cvv:e.target.value.replace(/\D/g,"")}))} maxLength={4} /></div>
                    <div className="card-note">🔒 SSL 256-bit — Visa & Mastercard acceptés</div>
                  </div>
                )}
              </div>
            )}

            {/* ── Confirmation enfant (étape 3) ── */}
            {tunnelStep === 3 && isEnfant && (
              <div className="tunnel-body tunnel-confirm">
                <div className="confirm-icon">🎉</div>
                <h2 className="t-title">Inscription enregistrée !</h2>
                <p className="t-sub">Un conseiller vous contactera sous <strong>24h</strong> pour valider le parcours de votre enfant.</p>
                <div className="confirm-summary">
                  <div><span>Enfant</span><strong>{enfantData.prenom_enfant} {enfantData.nom_enfant}</strong></div>
                  <div><span>Âge</span><strong>{enfantData.tranche_age} ans</strong></div>
                  <div><span>Contact parent</span><strong>{enfantData.email_parent}</strong></div>
                  {selectedCommercial && <div><span>Conseiller(ère)</span><strong>{COMMERCIAUX.find(c=>c.id===selectedCommercial)?.nom}</strong></div>}
                </div>
                <button className="t-action-btn" onClick={()=>setTunnelOpen(false)}>
                  Fermer <IcoArrow />
                </button>
              </div>
            )}

            {/* ── Confirmation adulte (étape 4) ── */}
            {tunnelStep === 4 && !isEnfant && (
              <div className="tunnel-body tunnel-confirm">
                <div className="confirm-icon">🎉</div>
                <h2 className="t-title">Bienvenue chez Binnie's !</h2>
                <p className="t-sub">Un conseiller vous contactera sous <strong>24h</strong> pour finaliser votre accès.</p>
                <div className="confirm-summary">
                  <div><span>Plan</span><strong>{plans.find(p=>p.id===selectedPlan)?.label}</strong></div>
                  <div><span>Email</span><strong>{formData.email}</strong></div>
                  <div><span>Tél.</span><strong>{formData.tel}</strong></div>
                  {selectedCommercial && <div><span>Conseiller(ère)</span><strong>{COMMERCIAUX.find(c=>c.id===selectedCommercial)?.nom}</strong></div>}
                </div>
                <button className="t-action-btn" onClick={()=>{setTunnelOpen(false);navigate(tunnelType==="entreprise"?"/parcours/entreprise":"/parcours/particulier");}}>
                  Accéder à mon espace <IcoArrow />
                </button>
              </div>
            )}

            {tunnelStep < maxStep && (
              <div className="tunnel-footer" style={{ flexDirection:"column", gap:8 }}>
                {tunnelErreur && <p style={{ color:"#dc2626", fontSize:"0.82rem", textAlign:"center", margin:0 }}>⚠ {tunnelErreur}</p>}
                <div style={{ display:"flex", justifyContent:"space-between", width:"100%" }}>
                  {tunnelStep > 1 && <button className="t-back-btn" onClick={()=>{ setTunnelStep(s=>s-1); setTunnelErreur(""); }}>← Retour</button>}
                  <button
                    className={`t-action-btn ${(tunnelStep===1&&!canGo1)||(tunnelStep===2&&!canGo2)||(tunnelStep===3&&!canGo3)||tunnelLoading?"t-disabled":""}`}
                    onClick={nextStep}
                    disabled={tunnelLoading}
                    style={{ opacity: tunnelLoading ? 0.7 : 1 }}
                  >
                    {tunnelLoading ? "Envoi…" : (!isEnfant && tunnelStep===3) ? "Confirmer & payer" : (isEnfant && tunnelStep===2) ? "Envoyer la demande" : "Continuer"} {!tunnelLoading && <IcoArrow />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL RECHERCHE (inchangée) */}
      {isSearchOpen && (
        <div className="search-overlay" onClick={closeSearch}>
          <div className="search-box" onClick={e=>e.stopPropagation()}>
            <button className="search-close" onClick={closeSearch}><IcoClose /></button>
            <form onSubmit={e=>{e.preventDefault();if(searchResults.length){navigate(searchResults[0].path);closeSearch();}}} className="search-form">
              <span className="s-ico"><IcoSearch /></span>
              <input ref={searchInputRef} type="text" placeholder="Que souhaitez-vous apprendre ?" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="search-input" />
              <button type="submit" className="search-submit">Rechercher</button>
            </form>
            <p className="sug-title">Tendances</p>
            <div className="topics-grid">
              {popularTopics.map((t,i)=><button key={i} className="topic-chip" onClick={()=>setSearchQuery(t)}>{t}</button>)}
            </div>
            {searchQuery.trim() && (
              <div className="search-results">
                <p className="sug-title">Résultats pour « {searchQuery} »</p>
                {searchResults.length ? (
                  <ul className="results-list">
                    {searchResults.map((item,i)=>(
                      <li key={i} className="result-item" onClick={()=>{navigate(item.path);closeSearch();}}>
                        <span className="result-type">{item.type}</span>
                        <span className="result-title">{item.title}</span>
                        <IcoArrow />
                      </li>
                    ))}
                  </ul>
                ) : <p className="no-results">Aucun résultat pour « {searchQuery} »</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONNEXION AVEC NOTIFICATIONS */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={()=>setIsModalOpen(false)}>
          <div className="modal-split" onClick={e=>e.stopPropagation()}>
            <div className="modal-left">
              <div className="ml-brand">B<em>ET</em></div>
              <h2 className="ml-title">Apprenez l'anglais<br /><span>comme jamais</span></h2>
              <p className="ml-desc">Rejoignez +5 000 apprenants qui progressent chaque jour avec Binnie's English Training.</p>
              <div className="ml-stats">
                <div><strong>5 000+</strong><span>Apprenants</span></div>
                <div><strong>98%</strong><span>Satisfaction</span></div>
                <div><strong>6</strong><span>Centres</span></div>
              </div>
              <div className="ml-testi">
                <p>"J'ai obtenu 850 au TOEIC après seulement 3 mois !"</p>
                <div className="testi-row">
                  <div className="testi-av">AK</div>
                  <div><strong>Awa Koné</strong><br /><small>Étudiante, Abidjan</small></div>
                </div>
              </div>
            </div>
            <div className="modal-right">
              <button className="mr-close" onClick={()=>setIsModalOpen(false)}><IcoClose /></button>
              <div className="auth-tabs">
                <button className={`tab-btn ${activeTab==="login"?"active":""}`} onClick={()=>setActiveTab("login")}>Connexion</button>
                <button className={`tab-btn ${activeTab==="register"?"active":""}`} onClick={()=>setActiveTab("register")}>Inscription</button>
              </div>

              {activeTab === "login" && (
                <div className="auth-form">
                  <p className="auth-welcome">Bon retour parmi nous 👋</p>
                  {loginError && <div className="notification error">{loginError}</div>}
                  {loginSuccess && <div className="notification success">{loginSuccess}</div>}
                  <div className="tfield">
                    <label><IcoMail /> Email</label>
                    <input type="email" placeholder="jean@exemple.com" value={loginData.email} onChange={e=>setLoginData(p=>({...p,email:e.target.value}))} />
                  </div>
                  <div className="tfield">
                    <label><IcoLock /> Mot de passe</label>
                    <div className="pwd-wrap">
                      <input type={showPwd?"text":"password"} placeholder="••••••••" value={loginData.password} onChange={e=>setLoginData(p=>({...p,password:e.target.value}))} />
                      <button type="button" className="pwd-toggle" onClick={()=>setShowPwd(s=>!s)}>{showPwd?<IcoEyeOff />:<IcoEye />}</button>
                    </div>
                  </div>
                  <div className="auth-row">
                    <label className="check-lbl"><input type="checkbox" name="rememberMe" /> Se souvenir</label>
                    <a href="#" className="forgot-lnk">Mot de passe oublié ?</a>
                  </div>
                  <button className="auth-submit" onClick={handleLogin}>Se connecter</button>
                  <div className="auth-divider"><span>ou continuer avec</span></div>
                  <div className="social-row">
                    <button className="social-btn" onClick={handleGoogleSignIn} style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
                      <IcoGoogle /> Continuer avec Google
                    </button>
                  </div>
                  <p className="auth-switch">Pas encore de compte ? <a href="#" onClick={()=>setActiveTab("register")}>S'inscrire gratuitement</a></p>
                </div>
              )}

              {activeTab === "register" && (
                <div className="auth-form">
                  <p className="auth-welcome">Créez votre compte gratuit 🚀</p>
                  {registerError && <div className="notification error">{registerError}</div>}
                  {registerSuccess && <div className="notification success">{registerSuccess}</div>}
                  <div className="tfield"><label>Nom complet</label><input type="text" placeholder="Jean Kouamé" value={regData.name} onChange={e=>setRegData(p=>({...p,name:e.target.value}))} /></div>
                  <div className="tfield"><label>Email</label><input type="email" placeholder="jean@exemple.com" value={regData.email} onChange={e=>setRegData(p=>({...p,email:e.target.value}))} /></div>
                  <div className="tfield"><label>Téléphone</label><input type="tel" placeholder="+225 07 00 00 00 00" value={regData.tel} onChange={e=>setRegData(p=>({...p,tel:e.target.value}))} /></div>
                  <div className="tfield">
                    <label>Mot de passe</label>
                    <div className="pwd-wrap">
                      <input type={showPwd?"text":"password"} placeholder="8 caractères minimum" value={regData.password} onChange={e=>setRegData(p=>({...p,password:e.target.value}))} />
                      <button type="button" className="pwd-toggle" onClick={()=>setShowPwd(s=>!s)}>{showPwd?<IcoEyeOff />:<IcoEye />}</button>
                    </div>
                  </div>
                  <button className="auth-submit" onClick={handleRegister}>Créer mon compte</button>
                  <div className="auth-divider"><span>ou s'inscrire avec</span></div>
                  <div className="social-row">
                    <button className="social-btn" onClick={handleGoogleSignIn} style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
                      <IcoGoogle /> S'inscrire avec Google
                    </button>
                  </div>
                  <p className="auth-switch">Déjà un compte ? <a href="#" onClick={()=>setActiveTab("login")}>Se connecter</a></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;