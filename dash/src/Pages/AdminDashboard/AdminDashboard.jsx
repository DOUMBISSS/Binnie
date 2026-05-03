// src/Pages/AdminDashboard/AdminDashboard.jsx
// Route : <Route path="/admin-dashboard" element={<AdminDashboard />} />

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { AvatarUpload } from "../../Components/CloudinaryUpload";
import MessagerieTab from "../../Components/MessagerieTab";
import TestsNiveauTab from "../../Components/TestsNiveauTab";

const API_URL  = process.env.REACT_APP_API_URL || "http://localhost:5001";
const authHdrs = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("admin_token")}` });


/* ═══════════════════════════════════════════════════════
   CONSTANTES (chartre BET)
═══════════════════════════════════════════════════════ */
const BET_COLOR    = "#0891b2";
const BET_DARK     = "#0e7490";
const BET_LIGHT    = "#e0f2fe";
const BET_GRADIENT = "linear-gradient(135deg, #0f172a 0%, #0891b2 100%)";
const BET_RED      = "#dc2626";

/* ═══════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES
═══════════════════════════════════════════════════════ */
const StatCard = ({ label, value, color, icon, sub, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff", padding:16, borderRadius:12, boxShadow:"0 1px 6px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:12, cursor:onClick?"pointer":"default", transition:"transform .15s", border:"1px solid #f1f5f9" }}>
    <div style={{ width:46, height:46, borderRadius:10, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{icon}</div>
    <div style={{ minWidth:0 }}>
      <div style={{ fontSize:11, color:"#9ca3af" }}>{label}</div>
      <div style={{ fontSize:21, fontWeight:800, color, lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>{sub}</div>}
    </div>
  </div>
);

const ProgressBar = ({ value, color = BET_COLOR, height = 7 }) => (
  <div style={{ height, background:"#e5e7eb", borderRadius:height, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.min(100, value)}%`, background:color, borderRadius:height, transition:"width .4s" }} />
  </div>
);

const ToggleSwitch = ({ on, onChange, color = BET_COLOR }) => (
  <div onClick={() => onChange(!on)} style={{ width:44, height:24, borderRadius:12, background:on?color:"#cbd5e1", cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
    <div style={{ position:"absolute", width:20, height:20, borderRadius:"50%", background:"#fff", top:2, left:on?22:2, transition:"left .2s", boxShadow:"0 1px 2px rgba(0,0,0,0.1)" }} />
  </div>
);

const RoleBadge = ({ role }) => {
  const roles = {
    super_admin: { label:"Super Admin", color:BET_RED, bg:"#fee2e2", emoji:"👑" },
    admin: { label:"Admin", color:BET_COLOR, bg:"#e0f2fe", emoji:"🔧" },
    responsable: { label:"Responsable", color:"#8b5cf6", bg:"#ede9fe", emoji:"📋" },
    manager: { label:"Manager", color:"#10b981", bg:"#d1fae5", emoji:"👥" },
  };
  const r = roles[role] || roles.manager;
  return <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:r.bg, color:r.color, display:"inline-flex", alignItems:"center", gap:4 }}>{r.emoji} {r.label}</span>;
};

const PermCheckbox = ({ on, onChange, color, disabled }) => (
  <div onClick={disabled ? undefined : () => onChange(!on)} style={{ width:28, height:28, borderRadius:8, background:on?color+"20":"#f3f4f6", border:`2px solid ${on?color:"#e5e7eb"}`, cursor:disabled?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:disabled?0.5:1 }}>
    {on && <span style={{ fontSize:16, color:color }}>✓</span>}
  </div>
);

const KpiCard = ({ icon, label, value, color, sub, alert, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff", padding:14, borderRadius:12, border:`1px solid ${alert?"#fecaca":"#e5e7eb"}`, cursor:onClick?"pointer":"default", background:alert?"#fff8f8":"#fff" }}>
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <span style={{ fontSize:11, color:"#9ca3af" }}>{label}</span>
    </div>
    <div style={{ fontSize:24, fontWeight:800, color:color }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:"#9ca3af", marginTop:4 }}>{sub}</div>}
  </div>
);

const Modal = ({ title, subtitle, onClose, children, danger }) => (
  <div style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
    <div style={{ background:"#fff", borderRadius:16, width:"90%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", padding:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:danger?"#dc2626":"#0f172a" }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#9ca3af" }}>✕</button>
      </div>
      {subtitle && <p style={{ margin:"0 0 16px", fontSize:12, color:"#9ca3af" }}>{subtitle}</p>}
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK EXISTANTES
═══════════════════════════════════════════════════════ */
const TRAFIC = {
  visites:12540, pagesVues:38720, tauxRebond:42.5,
  sources:[{name:"Recherche organique",part:48},{name:"Réseaux sociaux",part:27},{name:"Direct",part:15},{name:"Emailing",part:10}],
  pagesPopulaires:[{titre:"/formations/anglais-pro",vues:3420},{titre:"/tarifs-entreprises",vues:2780},{titre:"/test-niveau",vues:2150}],
  tauxConversionForm:3.2 };
const CLIENTS = { prospects:845, inscritsActifs:612, nouveauxClientsMois:78, tauxConversion:12.4 };
const OFFRES = [
  { id:1, nom:"Anglais Adulte", type:"Adulte", nbInscrits:210, chiffre:125000, tauxRemplissage:84 },
  { id:2, nom:"Anglais Enfant", type:"Enfant", nbInscrits:98, chiffre:58800, tauxRemplissage:72 },
  { id:3, nom:"Formation Entreprise", type:"Entreprise", nbInscrits:312, chiffre:468000, tauxRemplissage:91 },
  { id:4, nom:"Certification TOEIC", type:"Certification", nbInscrits:145, chiffre:72500, tauxRemplissage:68 },
];
const REPARTITION_TYPE = { Adulte:210, Enfant:98, Entreprise:312, Certification:145 };
const CA = {
  total:724300, parOffre:{ "Anglais Adulte":125000,"Anglais Enfant":58800,"Formation Entreprise":468000,"Certification TOEIC":72500 },
  parPeriode:{ "Jan":52000,"Fév":61000,"Mar":68000,"Avr":72000,"Mai":81000,"Juin":85000,"Juil":79000,"Août":75000,"Sep":82000,"Oct":88000,"Nov":92000,"Déc":45000 },
  paiementsRecus:654200, paiementsAttente:70100, moyenPaiement:{ "Mobile Money":58,"Carte bancaire":32,"Virement":10 },
};
const TRANSACTIONS = [
  { id:1, client:"Orange CI", montant:12500, date:"2025-12-10", statut:"validé", moyen:"Mobile Money" },
  { id:2, client:"BNP Paribas", montant:32000, date:"2025-12-09", statut:"validé", moyen:"Carte" },
  { id:3, client:"Nestlé", montant:5000, date:"2025-12-08", statut:"en_attente", moyen:"Virement" },
  { id:4, client:"SIFCA", montant:8800, date:"2025-12-07", statut:"validé", moyen:"Mobile Money" },
  { id:5, client:"Total CI", montant:21000, date:"2025-12-06", statut:"echoué", moyen:"Carte" },
];
const PROGRESSION = { moyenneProgression:67, resultatsParNiveau:{ A1:52, A2:61, B1:70, B2:78, C1:85, C2:92 }, assiduiteMoyenne:83, bulletinsGeneres:485, certificatsDelivres:127 };
const REQUETES = [
  { id:1, client:"Kouamé Aya", sujet:"Accès plateforme", statut:"ouvert", date:"2025-12-10", tempsTraitement:0, categorie:"Technique" },
  { id:2, client:"Diallo Ibrahima", sujet:"Facture", statut:"en_cours", date:"2025-12-09", tempsTraitement:4.5, categorie:"Facturation" },
  { id:3, client:"Touré Mamadou", sujet:"Certificat", statut:"résolu", date:"2025-12-05", tempsTraitement:12, categorie:"Certification" },
  { id:4, client:"Bamba Aïcha", sujet:"Absence", statut:"ouvert", date:"2025-12-10", tempsTraitement:0, categorie:"Pédagogique" },
];
const TEMPS_MOYEN_TRAITEMENT = 8.2;

/* ═══════════════════════════════════════════════════════
   DONNÉES POUR LA GESTION DES PERMISSIONS
═══════════════════════════════════════════════════════ */
const ROLES_DEF = {
  super_admin: { id:"super_admin", label:"Super Admin", emoji:"👑", color:BET_RED, border:"#fecaca", niveau:5, description:"Accès total, toutes permissions, non modifiable" },
  admin: { id:"admin", label:"Administrateur", emoji:"🔧", color:BET_COLOR, border:"#bae6fd", niveau:4, description:"Gestion complète sauf les paramètres critiques" },
  responsable: { id:"responsable", label:"Responsable", emoji:"📋", color:"#8b5cf6", border:"#c4b5fd", niveau:3, description:"Gestion des équipes, suivi pédagogique" },
  manager: { id:"manager", label:"Manager", emoji:"👥", color:"#10b981", border:"#a7f3d0", niveau:2, description:"Consultation et reporting, actions limitées" },
};

const MODULES = [
  { id:"dashboard", label:"Tableau de bord", cat:"Analyse", icon:"📊" },
  { id:"users", label:"Utilisateurs", cat:"Administration", icon:"👥" },
  { id:"roles", label:"Rôles & Permissions", cat:"Administration", icon:"🔐" },
  { id:"cours", label:"Cours", cat:"Pédagogie", icon:"📚" },
  { id:"examens", label:"Examens", cat:"Pédagogie", icon:"📝" },
  { id:"finances", label:"Finances", cat:"Finances", icon:"💰" },
  { id:"support", label:"Support", cat:"Support", icon:"💬" },
  { id:"audit", label:"Audit", cat:"Sécurité", icon:"📜" },
];

const PERM_LABELS = { create:"Créer", read:"Lire", update:"Modifier", delete:"Supprimer", manage:"Gérer" };
const PERM_COLORS = { create:"#22c55e", read:"#3b82f6", update:"#f59e0b", delete:"#ef4444", manage:"#8b5cf6" };

const USERS_INIT = [
  { id:1, nom:"Kouamé Aya", email:"aya@bet.com", avatar:"KA", role:"super_admin", actif:true, twofa:true, sessions:3, dernConn:"10/12/2025 09:23", ipRestr:false, accessTemp:null },
  { id:2, nom:"Diallo Ibrahima", email:"ibra@bet.com", avatar:"ID", role:"admin", actif:true, twofa:true, sessions:2, dernConn:"09/12/2025 14:12", ipRestr:false, accessTemp:null },
  { id:3, nom:"Touré Mamadou", email:"mamadou@bet.com", avatar:"TM", role:"responsable", actif:true, twofa:false, sessions:1, dernConn:"08/12/2025 11:45", ipRestr:false, accessTemp:null },
  { id:4, nom:"Bamba Aïcha", email:"aicha@bet.com", avatar:"BA", role:"manager", actif:true, twofa:false, sessions:0, dernConn:"05/12/2025 16:30", ipRestr:false, accessTemp:"2025-12-20" },
  { id:5, nom:"Coulibaly Jean", email:"jean@bet.com", avatar:"JC", role:"manager", actif:false, twofa:false, sessions:0, dernConn:"Jamais", ipRestr:false, accessTemp:null },
];

const SECURITE_INIT = {
  super_admin: { twofa_obligatoire:true, expiration_session:30, tentatives_max:3, rotation_pwd_jours:60, complexite_pwd:"haute", ip_restriction:false },
  admin: { twofa_obligatoire:true, expiration_session:60, tentatives_max:5, rotation_pwd_jours:90, complexite_pwd:"moyenne", ip_restriction:false },
  responsable: { twofa_obligatoire:false, expiration_session:120, tentatives_max:5, rotation_pwd_jours:120, complexite_pwd:"normale", ip_restriction:false },
  manager: { twofa_obligatoire:false, expiration_session:240, tentatives_max:8, rotation_pwd_jours:180, complexite_pwd:"normale", ip_restriction:false },
};

const PERMISSIONS_INIT = {
  super_admin: Object.fromEntries(MODULES.map(m => [m.id, { create:true, read:true, update:true, delete:true, manage:true }])),
  admin: Object.fromEntries(MODULES.map(m => [m.id, { create:true, read:true, update:true, delete:true, manage:false }])),
  responsable: Object.fromEntries(MODULES.map(m => [m.id, { create:false, read:true, update:false, delete:false, manage:false }])),
  manager: Object.fromEntries(MODULES.map(m => [m.id, { create:false, read:true, update:false, delete:false, manage:false }])),
};

const DEMANDES_INIT = [
  { id:1, nom:"N'Guessan Fatou", email:"fatou@orange.ci", entreprise:"Orange CI", roleDemande:"responsable", justification:"Besoin de gérer l'équipe marketing", statut:"en_attente", date:"2025-12-08" },
  { id:2, nom:"Yao Stéphanie", email:"stephanie@nestle.ci", entreprise:"Nestlé CI", roleDemande:"manager", justification:"Suivi des apprenants", statut:"en_attente", date:"2025-12-10" },
];

const AUDIT_INIT = [
  { id:1, acteur:"Kouamé Aya", role:"super_admin", action:"ROLE_MODIFIE", detail:"Ibrahima Diallo : manager → admin", date:"2025-12-10 09:15", ip:"192.168.1.45", statut:"success" },
  { id:2, acteur:"Diallo Ibrahima", role:"admin", action:"UTILISATEUR_INVITE", detail:"Invitation envoyée à jean@bet.com", date:"2025-12-09 14:22", ip:"192.168.1.23", statut:"success" },
  { id:3, acteur:"Touré Mamadou", role:"responsable", action:"TENTATIVE_ECHOUEE", detail:"Tentative de suppression de rôle", date:"2025-12-08 11:05", ip:"192.168.1.67", statut:"danger" },
  { id:4, acteur:"Système", role:"system", action:"2FA_FORCE_GLOBAL", detail:"2FA activé pour 3 utilisateurs", date:"2025-12-07 08:00", ip:"internal", statut:"warning" },
];

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK POUR LES NOUVEAUX ONGLETS
═══════════════════════════════════════════════════════ */
const PLANNING_DATA = [
  { id:1, titre:"Anglais Professionnel B2", formateur:"Prof. Martin", date:"2025-12-15", heure:"09:00", duree:"2h", salle:"Salle A", type:"presentiel", statut:"planifie", inscrits:12, placesMax:15 },
  { id:2, titre:"Business English", formateur:"Prof. Dubois", date:"2025-12-16", heure:"14:00", duree:"2h", salle:"Zoom", type:"online", statut:"planifie", inscrits:8, placesMax:20 },
  { id:3, titre:"Préparation TOEIC", formateur:"Prof. Smith", date:"2025-12-17", heure:"10:00", duree:"3h", salle:"Salle B", type:"presentiel", statut:"planifie", inscrits:15, placesMax:15 },
];

const PROFESSEURS = [
  { id:1, nom:"Martin", prenom:"Jean", email:"martin@bet.com", tel:"+225 01 23 45 67", specialite:"Anglais des affaires", statut:"actif", coursEnCharge:["Anglais Pro B2","English C1"], salaire:450000, dateEmbauche:"2023-01-10" },
  { id:2, nom:"Dubois", prenom:"Sophie", email:"dubois@bet.com", tel:"+225 01 23 45 68", specialite:"TOEIC", statut:"actif", coursEnCharge:["Business English","TOEIC Prep"], salaire:420000, dateEmbauche:"2023-03-15" },
  { id:3, nom:"Smith", prenom:"John", email:"smith@bet.com", tel:"+225 01 23 45 69", specialite:"Grammaire", statut:"actif", coursEnCharge:["Préparation TOEIC"], salaire:480000, dateEmbauche:"2022-11-20" },
];

const APPRENANTS = [
  { id:1, nom:"Kouamé Aya", email:"k.aya@orange.ci", tel:"+225 07 11 22 33", niveau:"B2", progression:78, assiduite:94, statut:"actif", dateInscription:"2025-01-15", entreprise:"Orange CI" },
  { id:2, nom:"Diallo Ibrahima", email:"d.ibra@orange.ci", tel:"+225 05 22 44 66", niveau:"C1", progression:88, assiduite:98, statut:"actif", dateInscription:"2025-02-01", entreprise:"Orange CI" },
  { id:3, nom:"Touré Mamadou", email:"toure.m@bnp.ci", tel:"+225 07 44 88 22", niveau:"C1", progression:91, assiduite:97, statut:"actif", dateInscription:"2025-01-20", entreprise:"BNP Paribas" },
  { id:4, nom:"Bamba Aïcha", email:"a.bamba@bnp.ci", tel:"+225 05 66 99 11", niveau:"A2", progression:34, assiduite:72, statut:"actif", dateInscription:"2025-04-05", entreprise:"BNP Paribas" },
];

const PRESENCES = [
  { id:1, apprenant:"Kouamé Aya", date:"2025-12-10", session:"Anglais Pro B2", present:true, retard:false, justifie:false },
  { id:2, apprenant:"Diallo Ibrahima", date:"2025-12-10", session:"Anglais Pro B2", present:true, retard:false, justifie:false },
  { id:3, apprenant:"Touré Mamadou", date:"2025-12-10", session:"Anglais Pro B2", present:false, retard:false, justifie:true },
  { id:4, apprenant:"Bamba Aïcha", date:"2025-12-10", session:"Anglais Pro B2", present:true, retard:true, justifie:false },
];

const EMPLOYES_BET = [
  { id:1, nom:"Kouassi", prenom:"Bernard", poste:"Directeur pédagogique", email:"b.kouassi@bet.com", tel:"+225 01 11 11 11", salaireBase:1200000, dateEmbauche:"2020-01-15", statut:"actif", paiements:[{mois:"Décembre 2025", montant:1250000, statut:"payé"}] },
  { id:2, nom:"Konan", prenom:"Christine", poste:"Responsable RH", email:"c.konan@bet.com", tel:"+225 01 11 11 12", salaireBase:850000, dateEmbauche:"2021-03-10", statut:"actif", paiements:[{mois:"Décembre 2025", montant:890000, statut:"payé"}] },
];

const CERTIFICATIONS = [
  { id:1, apprenant:"Kouamé Aya", certification:"TOEIC", score:850, dateObtention:"2025-11-15", valide:true, niveau:"B2" },
  { id:2, apprenant:"Diallo Ibrahima", certification:"TOEIC", score:920, dateObtention:"2025-10-20", valide:true, niveau:"C1" },
];

const EXAMENS = [
  { id:1, titre:"TOEIC Blanc #1", date:"2025-12-20", duree:120, nbQuestions:200, statut:"planifie", participantsMax:30, inscrits:25 },
  { id:2, titre:"Évaluation Module 3", date:"2025-12-18", duree:45, nbQuestions:30, statut:"planifie", participantsMax:20, inscrits:18 },
];

const RESULTATS_EXAMENS = [
  { id:1, apprenant:"Kouamé Aya", examen:"TOEIC Blanc #1", score:760, maxScore:990, date:"2025-12-05", commentaire:"Bonne progression" },
  { id:2, apprenant:"Diallo Ibrahima", examen:"TOEIC Blanc #1", score:890, maxScore:990, date:"2025-12-05", commentaire:"Excellent" },
];

const MODULES_RESSOURCES = [
  { id:1, module:"Anglais Professionnel B2", cours:"Réunions d'affaires", ressources:["PDF cours","Vidéo exemple","Exercice corrigé"], type:"video", duree:"45 min" },
  { id:2, module:"Anglais Professionnel B2", cours:"Négociation", ressources:["Fiche vocabulaire","Quiz","Audio"], type:"audio", duree:"30 min" },
];

const EVALUATIONS_PROGRAMMEES = [
  { id:1, titre:"Quiz Vocabulaire", module:"Anglais Pro B2", date:"2025-12-22", duree:15, coefficient:1, statut:"à venir" },
  { id:2, titre:"Examen final", module:"Business English", date:"2025-12-23", duree:60, coefficient:3, statut:"à venir" },
];

const NOTIFICATIONS = [
  { id:1, type:"rappel", message:"Rappel : cours d'Anglais Pro B2 demain à 9h (Salle A)", destinataires:"Apprenants inscrits", date:"2025-12-14", lu:false },
  { id:2, type:"reporting", message:"Taux d'assiduité de la semaine : 87%", destinataires:"Admin", date:"2025-12-13", lu:true },
];

const PROFIL_ADMIN = {
  id:1, nom:"Admin", prenom:"Super", email:"admin@bet.com", role:"super_admin", avatar:"AD", tel:"+225 01 00 00 01", dateEmbauche:"2020-01-01", dernierAcces:"2025-12-14 08:30", permissions:"totales"
};

/* ═══════════════════════════════════════════════════════
   DONNÉES ENRICHIES — PLANNING / EXAMENS / RESSOURCES / CHAT
═══════════════════════════════════════════════════════ */
const PLANNING_CRENEAUX = [
  { id:1, jour:"Lundi",    heureDebut:"08:00", heureFin:"10:00", cours:"Anglais Pro B2",      coach:"Prof. Martin", classe:"Groupe A", module:"Business English", salle:"Salle A", type:"presentiel", inscrits:12, placesMax:15 },
  { id:2, jour:"Lundi",    heureDebut:"14:00", heureFin:"16:00", cours:"Préparation TOEIC",   coach:"Prof. Smith",  classe:"Groupe B", module:"TOEIC Prep",       salle:"Salle B", type:"presentiel", inscrits:15, placesMax:15 },
  { id:3, jour:"Mardi",    heureDebut:"09:00", heureFin:"11:00", cours:"Business English",    coach:"Prof. Dubois", classe:"Groupe C", module:"Business English", salle:"Zoom",    type:"online",      inscrits:8,  placesMax:20 },
  { id:4, jour:"Mardi",    heureDebut:"15:00", heureFin:"17:00", cours:"Anglais Enfant",      coach:"Prof. Martin", classe:"Groupe D", module:"Anglais Enfant",   salle:"Salle C", type:"presentiel", inscrits:10, placesMax:12 },
  { id:5, jour:"Mercredi", heureDebut:"10:00", heureFin:"12:00", cours:"Grammar Workshop",   coach:"Prof. Smith",  classe:"Groupe A", module:"Grammaire",        salle:"Salle A", type:"presentiel", inscrits:11, placesMax:15 },
  { id:6, jour:"Mercredi", heureDebut:"14:00", heureFin:"15:30", cours:"Conversation Lab",   coach:"Prof. Dubois", classe:"Groupe B", module:"Conversation",     salle:"Zoom",    type:"online",      inscrits:14, placesMax:20 },
  { id:7, jour:"Jeudi",    heureDebut:"08:00", heureFin:"10:00", cours:"Anglais Pro B2",      coach:"Prof. Martin", classe:"Groupe C", module:"Business English", salle:"Salle A", type:"presentiel", inscrits:13, placesMax:15 },
  { id:8, jour:"Jeudi",    heureDebut:"16:00", heureFin:"18:00", cours:"TOEIC Intensif",      coach:"Prof. Smith",  classe:"Groupe D", module:"TOEIC Prep",       salle:"Salle B", type:"presentiel", inscrits:15, placesMax:15 },
  { id:9, jour:"Vendredi", heureDebut:"09:00", heureFin:"11:00", cours:"Business Writing",    coach:"Prof. Dubois", classe:"Groupe A", module:"Business English", salle:"Salle C", type:"presentiel", inscrits:9,  placesMax:15 },
  { id:10,jour:"Vendredi", heureDebut:"14:00", heureFin:"16:00", cours:"Préparation TOEIC",  coach:"Prof. Smith",  classe:"Groupe B", module:"TOEIC Prep",       salle:"Zoom",    type:"online",      inscrits:12, placesMax:20 },
];

const EXAMENS_COACHES = [
  { id:1, titre:"TOEIC Blanc #1",     coach:"Prof. Smith",  module:"TOEIC Prep",       classe:"Groupe B", date:"2025-12-20", heure:"09:00", duree:120, nbParticipants:25, placesMax:30, statut:"planifié", type:"blanc" },
  { id:2, titre:"Évaluation Module 3",coach:"Prof. Martin", module:"Business English", classe:"Groupe A", date:"2025-12-18", heure:"14:00", duree:45,  nbParticipants:12, placesMax:15, statut:"planifié", type:"module" },
  { id:3, titre:"Quiz Vocabulaire",   coach:"Prof. Dubois", module:"Conversation",     classe:"Groupe C", date:"2025-12-22", heure:"10:00", duree:20,  nbParticipants:8,  placesMax:20, statut:"planifié", type:"quiz" },
  { id:4, titre:"Examen Final B2",    coach:"Prof. Martin", module:"Business English", classe:"Groupe A", date:"2025-12-28", heure:"09:00", duree:90,  nbParticipants:12, placesMax:15, statut:"planifié", type:"final" },
];

const RESULTATS_COACHES = [
  { id:1, apprenant:"Kouamé Aya",      examen:"TOEIC Blanc #1",      coach:"Prof. Smith",  score:760, maxScore:990, pct:77, date:"2025-12-05", statut:"réussi",      commentaire:"Bonne progression" },
  { id:2, apprenant:"Diallo Ibrahima", examen:"TOEIC Blanc #1",      coach:"Prof. Smith",  score:890, maxScore:990, pct:90, date:"2025-12-05", statut:"réussi",      commentaire:"Excellent" },
  { id:3, apprenant:"Touré Mamadou",   examen:"Évaluation Module 3", coach:"Prof. Martin", score:34,  maxScore:40,  pct:85, date:"2025-12-01", statut:"réussi",      commentaire:"Très bien" },
  { id:4, apprenant:"Bamba Aïcha",     examen:"Évaluation Module 3", coach:"Prof. Martin", score:18,  maxScore:40,  pct:45, date:"2025-12-01", statut:"insuffisant", commentaire:"À retravailler" },
];

const RESSOURCES_COACHES = [
  { id:1, titre:"Guide TOEIC 2025",          module:"TOEIC Prep",       coach:"Prof. Smith",  type:"pdf",      taille:"2.4 MB", date:"2025-12-10", desc:"Guide complet de préparation au TOEIC avec exercices corrigés" },
  { id:2, titre:"Dialogue au bureau",         module:"Business English", coach:"Prof. Martin", type:"audio",    duree:"12 min",  date:"2025-12-08", desc:"Enregistrement d'un dialogue professionnel authentique en réunion" },
  { id:3, titre:"Masterclass Négociation",    module:"Business English", coach:"Prof. Dubois", type:"video",    duree:"45 min",  date:"2025-12-05", desc:"Techniques avancées pour négocier en anglais, avec exemples réels" },
  { id:4, titre:"Fiche Vocabulaire B2",       module:"Business English", coach:"Prof. Martin", type:"pdf",      taille:"560 KB", date:"2025-12-03", desc:"Vocabulaire essentiel niveau B2 avec exercices de mémorisation" },
  { id:5, titre:"Prononciation Avancée",      module:"TOEIC Prep",       coach:"Prof. Smith",  type:"audio",    duree:"20 min",  date:"2025-11-28", desc:"Exercices de phonétique pour améliorer la compréhension orale TOEIC" },
  { id:6, titre:"Cours Grammar Workshop",     module:"Grammaire",        coach:"Prof. Smith",  type:"video",    duree:"30 min",  date:"2025-11-25", desc:"Révision complète de la grammaire anglaise niveau C1 avec quiz" },
  { id:7, titre:"Exercices Listening",        module:"TOEIC Prep",       coach:"Prof. Smith",  type:"exercice", taille:"1.2 MB", date:"2025-11-20", desc:"50 exercices de compréhension orale format TOEIC" },
  { id:8, titre:"Templates Emails Pro",       module:"Business English", coach:"Prof. Dubois", type:"document", taille:"480 KB", date:"2025-11-18", desc:"20 modèles d'emails professionnels en anglais prêts à l'emploi" },
];

const CONV_INIT = [
  { id:1, nom:"Prof. Martin", role:"Coach", avatar:"JM", color:"#0891b2", lastMsg:"Les résultats du quiz sont disponibles", lastTime:"09:23", unread:2,
    messages:[
      { id:1, from:"them", text:"Bonjour ! Les résultats du quiz Module 3 sont disponibles.", time:"09:20" },
      { id:2, from:"them", text:"4 apprenants ont eu moins de 50%. Que fait-on pour eux ?", time:"09:21" },
      { id:3, from:"me",   text:"Merci pour l'info. On va programmer une session de rattrapage.", time:"09:23" },
      { id:4, from:"them", text:"Les résultats du quiz sont disponibles", time:"09:23" },
    ]},
  { id:2, nom:"Prof. Dubois", role:"Coach", avatar:"SD", color:"#8b5cf6", lastMsg:"Planning confirmé pour jeudi", lastTime:"Hier", unread:0,
    messages:[
      { id:1, from:"them", text:"Planning confirmé pour jeudi", time:"Hier" },
      { id:2, from:"me",   text:"Parfait, merci Sophie.", time:"Hier" },
    ]},
  { id:3, nom:"Kouamé Aya", role:"Apprenante", avatar:"KA", color:"#22c55e", lastMsg:"J'ai un problème d'accès à la plateforme", lastTime:"Lun", unread:1,
    messages:[
      { id:1, from:"them", text:"Bonjour, j'ai un problème d'accès à la plateforme depuis hier.", time:"Lun" },
      { id:2, from:"me",   text:"Je regarde ça maintenant.", time:"Lun" },
      { id:3, from:"them", text:"Merci !", time:"Lun" },
    ]},
  { id:4, nom:"Prof. Smith", role:"Coach", avatar:"JS", color:"#f59e0b", lastMsg:"TOEIC blanc prévu le 20 déc", lastTime:"Dim", unread:0,
    messages:[
      { id:1, from:"them", text:"TOEIC blanc prévu le 20 déc, tout est prêt.", time:"Dim" },
    ]},
];

// À ajouter dans AdminDashboard.jsx, après les autres données mockées (vers ligne 300)
/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK POUR LA GESTION DE CONTENU (BLOG)
═══════════════════════════════════════════════════════ */
const INIT_PAGES = [
  { id:1, titre:"Accueil", slug:"/", contenu:"Page d'accueil de BET", statut:"publiée", dateMaj:"2025-12-10" },
  { id:2, titre:"Nos formations", slug:"/formations", contenu:"Détail des formations proposées", statut:"publiée", dateMaj:"2025-12-05" },
  { id:3, titre:"Contact", slug:"/contact", contenu:"Formulaire de contact et coordonnées", statut:"brouillon", dateMaj:"2025-12-12" },
];

const INIT_OFFRES = [
  { id:1, titre:"Anglais Adulte", type:"Adulte", prix:125000, duree:"3 mois", actif:true },
  { id:2, titre:"Anglais Enfant", type:"Enfant", prix:58800, duree:"3 mois", actif:true },
  { id:3, titre:"Formation Entreprise", type:"Entreprise", prix:468000, duree:"6 mois", actif:true },
  { id:4, titre:"Certification TOEIC", type:"Certification", prix:72500, duree:"2 mois", actif:false },
];

const INIT_ARTICLES_BLOG = [
  { id:1, titre:"5 conseils pour réussir son TOEIC", categorie:"Conseils", date:"2025-12-01", statut:"publié", resume:"Découvrez nos astuces pour booster votre score." },
  { id:2, titre:"L'importance de l'anglais en entreprise", categorie:"Carrière", date:"2025-11-20", statut:"publié", resume:"Pourquoi l'anglais est un atout professionnel." },
  { id:3, titre:"Comment choisir sa formation", categorie:"Guide", date:"2025-11-10", statut:"brouillon", resume:"Les critères à prendre en compte." },
];

const INIT_TEMOIGNAGES = [
  { id:1, auteur:"Aya Kouamé", poste:"Chef de projet", avis:"Super formation, j'ai progressé rapidement !", note:5, approuve:true },
  { id:2, auteur:"Ibrahima Diallo", poste:"Directeur Ventes", avis:"Les cours sont adaptés à nos besoins professionnels.", note:5, approuve:true },
  { id:3, auteur:"Fatou N'Guessan", poste:"DRH", avis:"À améliorer sur les délais de correction.", note:3, approuve:false },
];

const INIT_CATALOGUE = [
  { id:1, nom:"Pack TOEIC intensif", type:"Cours", prix:"150 €", disponible:true, image:"🎧" },
  { id:2, nom:"Grammaire anglaise complète", type:"Livre", prix:"35 €", disponible:true, image:"📘" },
  { id:3, nom:"Business English Masterclass", type:"Vidéo", prix:"89 €", disponible:true, image:"🎬" },
];

const INIT_PARTENAIRES = [
  { id:1, nom:"Orange CI", logo:"📱", site:"https://orange.ci", actif:true },
  { id:2, nom:"BNP Paribas CI", logo:"🏦", site:"https://bnp.ci", actif:true },
  { id:3, nom:"Nestlé CI", logo:"🏭", site:"https://nestle.ci", actif:false },
];
/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const profil = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom = profil?.prenom || profil?.first_name || "";
  const nom    = profil?.nom    || profil?.last_name  || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || profil?.email || "Administrateur";
  const initiales  = [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "AD";
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_profil");
    navigate("/login-admin", { replace: true });
  };

  const [activeTab, setActiveTab] = useState("trafic");
  
  // États pour la gestion des permissions
  const [users, setUsers] = useState(USERS_INIT);
  const [onlineUsers, setOnlineUsers] = useState([1,2]);
  const [securite, setSecurite] = useState(SECURITE_INIT);
  const [permissions, setPermissions] = useState(PERMISSIONS_INIT);
  const [demandes, setDemandes] = useState(DEMANDES_INIT);
  const [auditLog, setAuditLog] = useState(AUDIT_INIT);
  const [filtreRole, setFiltreRole] = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [searchUser, setSearchUser] = useState("");
  const [editingRole, setEditingRole] = useState("admin");
  const [filtreAudit, setFiltreAudit] = useState("Tous");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showDemandeModal, setShowDemandeModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ nom:"", email:"", role:"manager", centre_id:"", accessTemp:"", note:"" });

  const BET_CENTRES = [
    { id:"angre",      label:"BET Angré — Abidjan" },
    { id:"2plateaux",  label:"BET II Plateaux — Abidjan" },
    { id:"yopougon",   label:"BET Yopougon — Abidjan" },
    { id:"koumassi",   label:"BET Koumassi — Abidjan" },
    { id:"abatta",     label:"BET Abatta — Abidjan" },
    { id:"bouake",     label:"BET Bouaké — Bouaké" },
  ];
  const [editingUser, setEditingUser] = useState(null);
  const [userToRevoke, setUserToRevoke] = useState(null);
  const [cloneForm, setCloneForm] = useState({ source:"admin", cible:"manager" });
  const [selectedDemande, setSelectedDemande] = useState(null);

  

  // États pour filtres des apprenants
  const [searchApprenant, setSearchApprenant] = useState("");
  const [filtreNiveau, setFiltreNiveau] = useState("Tous");
  const [filtreStatutApp, setFiltreStatutApp] = useState("Tous");

  /* ── BLOG ── */
  const [blogArticles,    setBlogArticles]    = useState([]);
  const [blogLoading,     setBlogLoading]     = useState(false);
  const [showArticleModal,setShowArticleModal]= useState(false);
  const [editArticle,     setEditArticle]     = useState(null);
  const [articleForm,     setArticleForm]     = useState({ titre:"", extrait:"", contenu:"", categorie:"Actualités", auteur:"Admin", image_url:"", images:["","",""], read_time:"", publie:true });
  const [showCommentsModal,setShowCommentsModal]= useState(false);
  const [commentsArticle, setCommentsArticle] = useState(null);
  const [articleComments, setArticleComments] = useState([]);
  const [blogSearchTerm,  setBlogSearchTerm]  = useState("");

  const fetchBlogArticles = useCallback(async () => {
    setBlogLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/blog/admin/all`, { headers: authHdrs() });
      if (!r.ok) throw new Error();
      const { articles } = await r.json();
      setBlogArticles(articles || []);
    } catch { toast.error("Impossible de charger les articles"); }
    finally { setBlogLoading(false); }
  }, []);

  const fetchArticleComments = async (articleId) => {
    try {
      const r = await fetch(`${API_URL}/api/blog/${articleId}/commentaires`, { headers: authHdrs() });
      const { commentaires } = await r.json();
      setArticleComments(commentaires || []);
    } catch { toast.error("Erreur chargement commentaires"); }
  };

  useEffect(() => { if (activeTab === "Blog") fetchBlogArticles(); }, [activeTab, fetchBlogArticles]);

  const openArticleModal = (a = null) => {
    setEditArticle(a);
    setArticleForm(a
      ? { titre:a.titre, extrait:a.extrait||"", contenu:a.contenu||"", categorie:a.categorie, auteur:a.auteur, image_url:a.image_url||"", images: [...(a.images||[""]), ...["","",""]].slice(0,3).map(v=>v||""), read_time:a.read_time||"", publie:a.publie }
      : { titre:"", extrait:"", contenu:"", categorie:"Actualités", auteur:"Admin", image_url:"", images:["","",""], read_time:"", publie:true });
    setShowArticleModal(true);
  };
  const [uploadingCover,  setUploadingCover]  = useState(false);
  const [uploadingImg,    setUploadingImg]    = useState([false, false, false]);

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const r = await fetch(`${API_URL}/api/blog/upload`, {
      method: "POST",
      headers: { Authorization: authHdrs().Authorization },
      body: fd,
    });
    if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Erreur upload"); }
    const { url } = await r.json();
    return url;
  };

  const handleCoverFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage(file);
      setArticleForm(f => ({ ...f, image_url: url }));
    } catch (err) { toast.error(err.message); }
    finally { setUploadingCover(false); }
  };

  const handleContentFile = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(prev => { const a=[...prev]; a[idx]=true; return a; });
    try {
      const url = await uploadImage(file);
      setArticleForm(f => { const imgs=[...f.images]; imgs[idx]=url; return { ...f, images:imgs }; });
    } catch (err) { toast.error(err.message); }
    finally { setUploadingImg(prev => { const a=[...prev]; a[idx]=false; return a; }); }
  };

  const saveBlogArticle = async () => {
    if (!articleForm.titre.trim()) { toast.error("Titre requis"); return; }
    try {
      const url    = editArticle ? `${API_URL}/api/blog/${editArticle.id}` : `${API_URL}/api/blog`;
      const method = editArticle ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(articleForm) });
      if (!r.ok) { const d = await r.json(); toast.error(d.error || "Erreur"); return; }
      toast.success(editArticle ? "Article modifié ✓" : "Article créé ✓");
      setShowArticleModal(false);
      fetchBlogArticles();
    } catch { toast.error("Erreur réseau"); }
  };
  const toggleBlogPublie = async (a) => {
    try {
      await fetch(`${API_URL}/api/blog/${a.id}/publie`, { method:"PATCH", headers:authHdrs(), body:JSON.stringify({ publie: !a.publie }) });
      toast.success(!a.publie ? "Article publié 🟢" : "Passé en brouillon");
      fetchBlogArticles();
    } catch { toast.error("Erreur"); }
  };
  const deleteBlogArticle = async (id) => {
    if (!window.confirm("Supprimer cet article et tous ses commentaires ?")) return;
    try {
      await fetch(`${API_URL}/api/blog/${id}`, { method:"DELETE", headers:authHdrs() });
      toast.success("Article supprimé");
      fetchBlogArticles();
    } catch { toast.error("Erreur"); }
  };
  const openCommentsModal = async (a) => {
    setCommentsArticle(a);
    setShowCommentsModal(true);
    await fetchArticleComments(a.id);
  };
  const toggleComment = async (c) => {
    try {
      await fetch(`${API_URL}/api/blog/commentaires/${c.id}`, { method:"PATCH", headers:authHdrs(), body:JSON.stringify({ approuve: !c.approuve }) });
      setArticleComments(prev => prev.map(x => x.id === c.id ? { ...x, approuve: !x.approuve } : x));
      fetchBlogArticles();
    } catch { toast.error("Erreur"); }
  };
  const deleteComment = async (cId) => {
    try {
      await fetch(`${API_URL}/api/blog/commentaires/${cId}`, { method:"DELETE", headers:authHdrs() });
      setArticleComments(prev => prev.filter(x => x.id !== cId));
      fetchBlogArticles();
    } catch { toast.error("Erreur"); }
  };
  const BLOG_CATS = ["Actualités","Événements","Cours","Certifications","Conseils","Entreprise","Annonces"];
  const filteredBlogArticles = blogArticles.filter(a =>
    !blogSearchTerm || a.titre.toLowerCase().includes(blogSearchTerm.toLowerCase())
  );

  const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
  const formatMoney = (val) => val.toLocaleString("fr-FR") + " €";
  const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });

  const stats = useMemo(() => ({
    actifs: users.filter(u=>u.actif).length,
    totalSessions: users.reduce((s,u)=>s+u.sessions,0),
    sans2fa: users.filter(u=>u.actif && !u.twofa).length,
    enAttente: demandes.filter(d=>d.statut==="en_attente").length,
    alertes: auditLog.filter(a=>a.statut==="danger").length,
    tempAccess: users.filter(u=>u.accessTemp && new Date(u.accessTemp)>new Date()).length,
  }), [users, demandes, auditLog]);

  const usersFiltres = useMemo(() => {
    let r = [...users];
    if (filtreRole !== "Tous") r = r.filter(u => u.role === filtreRole);
    if (filtreStatut === "Actifs") r = r.filter(u => u.actif);
    if (filtreStatut === "Inactifs") r = r.filter(u => !u.actif);
    if (filtreStatut === "Sans 2FA") r = r.filter(u => !u.twofa);
    if (filtreStatut === "En ligne") r = r.filter(u => onlineUsers.includes(u.id));
    if (searchUser) r = r.filter(u => u.nom.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase()));
    return r;
  }, [users, filtreRole, filtreStatut, searchUser, onlineUsers]);

  const auditFiltres = useMemo(() => {
    if (filtreAudit === "Tous") return auditLog;
    return auditLog.filter(a => a.statut === filtreAudit);
  }, [auditLog, filtreAudit]);

  const addAuditEntry = (action, detail, statut="success") => {
    const newEntry = { id: auditLog.length+1, acteur:"Admin", role:"admin", action, detail, date:new Date().toLocaleString(), ip:"127.0.0.1", statut };
    setAuditLog([newEntry, ...auditLog]);
  };

  const toggleUserStatus = (userId) => {
    setUsers(users.map(u => u.id===userId ? {...u, actif:!u.actif} : u));
    addAuditEntry("STATUT_UTILISATEUR", `Utilisateur ${userId} ${users.find(u=>u.id===userId)?.actif ? "désactivé" : "activé"}`, "warning");
  };

  const revokeSession = (userId) => {
    setUsers(users.map(u => u.id===userId ? {...u, sessions:0} : u));
    addAuditEntry("SESSION_REVOQUEE", `Toutes les sessions de l'utilisateur ${userId} ont été révoquées`, "warning");
    toast.success("Sessions révoquées");
    setShowRevokeModal(false);
  };

  const togglePerm = (role, moduleId, perm) => {
    if (role === "super_admin") return;
    setPermissions(prev => ({ ...prev, [role]: { ...prev[role], [moduleId]: { ...prev[role][moduleId], [perm]: !prev[role][moduleId]?.[perm] } } }));
  };

  const savePermissions = () => {
    addAuditEntry("PERMISSIONS_SAUVEGARDEES", `Permissions du rôle ${editingRole} modifiées`, "success");
    toast.success("Permissions sauvegardées ✓");
  };

  const sendInvite = async () => {
    if (!inviteForm.nom || !inviteForm.email) { toast.error("Veuillez remplir le nom et l'email"); return; }
    if (inviteForm.role === "commercial" && !inviteForm.centre_id) { toast.error("Sélectionnez le centre de la conseillère"); return; }
    try {
      const parts = inviteForm.nom.trim().split(" ");
      const prenom = parts[0] || "";
      const nom    = parts.slice(1).join(" ") || parts[0] || "";
      // scope : commercial → son centre uniquement ; autres → national
      const scope = inviteForm.role === "commercial" && inviteForm.centre_id
        ? [inviteForm.centre_id]
        : ["national"];
      const res = await fetch(`${API_URL}/api/admin/utilisateurs`, {
        method: "POST",
        headers: authHdrs(),
        body: JSON.stringify({ nom, prenom, email: inviteForm.email, role: inviteForm.role, scope, note: inviteForm.note || null }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erreur création"); return; }
      addAuditEntry("UTILISATEUR_INVITE", `${inviteForm.nom} (${inviteForm.email}) créé avec rôle ${inviteForm.role}`, "success");
      toast.success(`✅ Compte créé — mot de passe temporaire : ${data.mdp_temporaire}`);
      setShowInviteModal(false);
      setInviteForm({ nom:"", email:"", role:"manager", centre_id:"", accessTemp:"", note:"" });
    } catch { toast.error("Erreur réseau"); }
  };

  const clonePermissions = () => {
    if (cloneForm.source === cloneForm.cible) { toast.error("La source et la cible doivent être différentes"); return; }
    const sourcePerms = permissions[cloneForm.source];
    setPermissions(prev => ({ ...prev, [cloneForm.cible]: JSON.parse(JSON.stringify(sourcePerms)) }));
    addAuditEntry("PERMISSIONS_CLONEES", `Permissions clonées de ${cloneForm.source} vers ${cloneForm.cible}`, "warning");
    toast.success(`Permissions clonées de ${cloneForm.source} vers ${cloneForm.cible}`);
    setShowCloneModal(false);
  };

  const handleDemande = (id, action) => {
    const demande = demandes.find(d=>d.id===id);
    if (action === "approuver") {
      const newUser = { id: users.length+1, nom: demande.nom, email: demande.email, avatar: demande.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(), role: demande.roleDemande, actif: true, twofa: false, sessions: 0, dernConn: "Jamais", ipRestr: false, accessTemp: null };
      setUsers([...users, newUser]);
      addAuditEntry("DEMANDE_APPROUVEE", `Demande de ${demande.nom} approuvée → rôle ${demande.roleDemande}`, "success");
      toast.success(`Demande approuvée, ${demande.nom} a été ajouté`);
    } else {
      addAuditEntry("DEMANDE_REFUSEE", `Demande de ${demande.nom} refusée`, "warning");
      toast.warning(`Demande de ${demande.nom} refusée`);
    }
    setDemandes(demandes.filter(d=>d.id!==id));
    setShowDemandeModal(false);
  };

  const exportUsers = () => {
    const csv = ["Nom,Email,Rôle,Statut,2FA,Sessions,Dernier accès", ...users.map(u=>`${u.nom},${u.email},${u.role},${u.actif?"Actif":"Inactif"},${u.twofa?"Oui":"Non"},${u.sessions},${u.dernConn}`)].join("\n");
    const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv); a.download="utilisateurs.csv"; a.click();
    toast.success("Export CSV effectué");
  };

  const apprenantsFiltres = useMemo(() => {
    let list = APPRENANTS;
    if (searchApprenant) list = list.filter(a => a.nom.toLowerCase().includes(searchApprenant.toLowerCase()) || a.email.toLowerCase().includes(searchApprenant.toLowerCase()));
    if (filtreNiveau !== "Tous") list = list.filter(a => a.niveau === filtreNiveau);
    if (filtreStatutApp !== "Tous") list = list.filter(a => a.statut === filtreStatutApp);
    return list;
  }, [searchApprenant, filtreNiveau, filtreStatutApp]);

  // Planning filters
  const [filtrePlanCoach, setFiltrePlanCoach] = useState("Tous");
  const [filtrePlanClasse, setFiltrePlanClasse] = useState("Tous");
  const [filtrePlanModule, setFiltrePlanModule] = useState("Tous");
  const planningFiltres = useMemo(() => {
    let list = PLANNING_CRENEAUX;
    if (filtrePlanCoach !== "Tous") list = list.filter(s => s.coach === filtrePlanCoach);
    if (filtrePlanClasse !== "Tous") list = list.filter(s => s.classe === filtrePlanClasse);
    if (filtrePlanModule !== "Tous") list = list.filter(s => s.module === filtrePlanModule);
    return list;
  }, [filtrePlanCoach, filtrePlanClasse, filtrePlanModule]);

  // Examens & Résultats
  const [examSubTab, setExamSubTab] = useState("examens");

  // Chat / Notifications (local demo)
  const [activeConv, setActiveConv] = useState(1);
  const [conversations, setConversations] = useState(CONV_INIT);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [activeConv, conversations]);

  const sendMsgLocal = () => {
    if (!chatInput.trim()) return;
    const newMsg = { id: Date.now(), from:"me", text:chatInput, time:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) };
    setConversations(prev => prev.map(c => c.id===activeConv ? {...c, messages:[...c.messages, newMsg], lastMsg:chatInput, lastTime:"maintenant", unread:0} : c));
    setChatInput("");
  };

  // ── Messagerie interne (backend) ─────────────────────────
  const [adMsgConvs, setAdMsgConvs]       = useState([]);
  const [adMsgMessages, setAdMsgMessages] = useState([]);
  const [adMsgActiveId, setAdMsgActiveId] = useState(null);
  const [adMsgInput, setAdMsgInput]       = useState("");
  const [adMsgContacts, setAdMsgContacts] = useState([]);
  const [adShowNewConv, setAdShowNewConv] = useState(false);

  const adFetchConvs = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/messages/conversations`, { headers: authHdrs() });
      if (!r.ok) return;
      const { conversations: data } = await r.json();
      setAdMsgConvs(data || []);
    } catch {}
  }, []);

  const adFetchMessages = useCallback(async (convId) => {
    try {
      const r = await fetch(`${API_URL}/api/messages/conversations/${convId}/messages`, { headers: authHdrs() });
      if (!r.ok) return;
      const { messages } = await r.json();
      setAdMsgMessages(messages || []);
      await fetch(`${API_URL}/api/messages/conversations/${convId}/read`, { method:"PATCH", headers: authHdrs() });
      setAdMsgConvs(prev => prev.map(c => c.id===convId ? {...c, non_lus:0} : c));
    } catch {}
  }, []);

  const adStartConv = async (toId) => {
    try {
      const r = await fetch(`${API_URL}/api/messages/conversations`, {
        method:"POST", headers: authHdrs(), body: JSON.stringify({ to_id: toId })
      });
      if (!r.ok) return;
      const { conversation } = await r.json();
      await adFetchConvs();
      setAdShowNewConv(false);
      setAdMsgActiveId(conversation.id);
      await adFetchMessages(conversation.id);
    } catch {}
  };

  const adSendMsg = async () => {
    if (!adMsgInput.trim() || !adMsgActiveId) return;
    const content = adMsgInput.trim();
    setAdMsgInput("");
    try {
      await fetch(`${API_URL}/api/messages/conversations/${adMsgActiveId}/messages`, {
        method:"POST", headers: authHdrs(), body: JSON.stringify({ content })
      });
      await adFetchMessages(adMsgActiveId);
      await adFetchConvs();
    } catch {}
  };

  useEffect(() => { adFetchConvs(); }, [adFetchConvs]);
  useEffect(() => {
    if (!adMsgActiveId) return;
    const t = setInterval(() => adFetchMessages(adMsgActiveId), 6000);
    return () => clearInterval(t);
  }, [adMsgActiveId, adFetchMessages]);

  const adMsgNonLuTotal = adMsgConvs.reduce((s,c) => s+(c.non_lus||0), 0);
  const adMyId = JSON.parse(localStorage.getItem("admin_profil")||"{}")?.id || "";
  const adPartnerName = (conv) => conv.user1_id===adMyId ? conv.user2_name : conv.user1_name;
  const adPartnerRole = (conv) => conv.user1_id===adMyId ? conv.user2_role : conv.user1_role;
  const adActiveConv = adMsgConvs.find(c => c.id===adMsgActiveId);
  const AD_ROLE_META = {
    super_admin:"SuperAdmin", admin:"Admin", manager:"Manager",
    responsable:"Responsable", commercial:"Commercial",
    gestionnaire:"Gestionnaire", coach:"Coach", data_collector:"Data"
  };

  // Resources filters
  const [filtreResType, setFiltreResType] = useState("Tous");
  const [filtreResModule, setFiltreResModule] = useState("Tous");
  const ressourcesFiltres = useMemo(() => {
    let list = RESSOURCES_COACHES;
    if (filtreResType !== "Tous") list = list.filter(r => r.type === filtreResType);
    if (filtreResModule !== "Tous") list = list.filter(r => r.module === filtreResModule);
    return list;
  }, [filtreResType, filtreResModule]);

  const tabs = [
    { key: "trafic",      label: "Trafic web",           icon: "🌐" },
    { key: "clients",     label: "Clients & Prospects",  icon: "👥" },
    { key: "offres",      label: "Offres & Formations",  icon: "🎓" },
    { key: "ca",          label: "CA & Paiements",       icon: "💰" },
    { key: "progression", label: "Progression apprenants", icon: "📈" },
    { key: "support",     label: "Support & Requêtes",   icon: "🛠️" },
    { key: "planning",    label: "Planning",             icon: "📅" },
    { key: "professeurs", label: "Professeurs",          icon: "👨‍🏫" },
    { key: "apprenants",  label: "Apprenants",           icon: "👩‍🎓" },
    { key: "presences",   label: "Présences",            icon: "📋" },
    { key: "employes",    label: "Employés BET",         icon: "🏢" },
    { key: "certifications", label: "Certifications",    icon: "🏅" },
    { key: "examens",     label: "Examens & Résultats",  icon: "📝" },
    { key: "modules",     label: "Ressources",           icon: "📚" },
    { key: "evaluations", label: " Évaluations programmées", icon: "📋" },
    { key: "notifications", label: "Notifications",      icon: "🔔" },
    { key: "Blog",          label: "Blog",               icon: "📝" },
    { key: "tests_niveau",  label: "Test de Niveau",     icon: "🧪" },
    { key: "messages",      label: "Messages",           icon: "💬", badge: adMsgNonLuTotal||null, danger: adMsgNonLuTotal>0 },
    { key: "profiladmin",   label: "Profil Admin",       icon: "👤" },
  ];

  const permTabs = [
    { key:"vue_ensemble", label:"Vue d'ensemble", icon:"📊", badge:null },
    { key:"utilisateurs", label:"Utilisateurs", icon:"👥", badge:users.length },
    { key:"matrice", label:"Matrice des permissions", icon:"🔐", badge:null },
    { key:"securite", label:"Sécurité", icon:"🛡️", badge:null },
    { key:"demandes", label:"Demandes d'accès", icon:"📬", badge:stats.enAttente, danger:stats.enAttente>0 },
    { key:"audit", label:"Audit", icon:"📜", badge:auditLog.length },
  ];
  const [permSubTab, setPermSubTab] = useState("vue_ensemble");

  return (
    <div style={{ minHeight:"100vh", background:"#f0f9ff" }}>
      <div style={{ padding:0, overflowX:"hidden" }}>
        <Toaster position="top-right" />

        {/* HERO HEADER */}
        <div style={{ background:BET_GRADIENT, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
          <div style={{ position:"absolute", bottom:-60, right:80, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }} />
          <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
              <div>
                <div style={{ fontSize:11, color:"#7dd3fc", fontWeight:600, letterSpacing:"0.08em" }}>Bonjour 👋</div>
                <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{nomComplet}</h1>
                <div style={{ fontSize:12, color:"#bae6fd", marginTop:3 }}>{profil?.email || "Supervision globale · Chiffres clés · Pilotage"}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", transition:"background .2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
              <span>🚪</span> Déconnexion
            </button>
          </div>
          <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden" }}>
            {[
              { l:"CA total", v:formatMoney(CA.total), c:"#38bdf8" },
              { l:"Inscrits actifs", v:CLIENTS.inscritsActifs, c:"#34d399" },
              { l:"Taux conversion", v:`${CLIENTS.tauxConversion}%`, c:"#a78bfa" },
              { l:"Requêtes ouvertes", v:REQUETES.filter(r=>r.statut!=="résolu").length, c:"#f87171" },
            ].map((s, i, arr) => (
              <div key={s.l} style={{ flex:1, textAlign:"center", padding:"14px 8px", borderRight: i < arr.length-1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>{s.l}</div>
                <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"0 24px 24px" }}>
          {/* Tabs principaux */}
          <div style={{ display:"flex", gap:3, marginBottom:0, flexWrap:"wrap", paddingTop:20 }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  padding:"10px 16px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer",
                  fontWeight:600, fontSize:13,
                  background: isActive ? "#fff" : BET_LIGHT,
                  color: isActive ? BET_COLOR : "#0369a1",
                  boxShadow: isActive ? "0 -2px 8px rgba(8,145,178,0.15)" : "none",
                  display:"flex", alignItems:"center", gap:6,
                }}>
                  <span style={{ fontSize:14 }}>{tab.icon}</span>
                  {tab.label}
                  {tab.badge !== undefined && tab.badge !== null && (
                    <span style={{ padding:"1px 7px", borderRadius:10, fontSize:11, fontWeight:700,
                      background: tab.danger ? "#fee2e2" : BET_LIGHT,
                      color: tab.danger ? "#dc2626" : BET_COLOR }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Carte principale */}
          <div style={{ background:"#fff", padding:24, borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>

            {/* ================= ONGLETS EXISTANTS ================= */}
            {activeTab === "trafic" && (
              <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🌐 Trafic web</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Audience et comportement des visiteurs</p></div><div style={{ fontSize:12, color:"#9ca3af" }}>Mise à jour : {formatDate(new Date())}</div></div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:12, marginBottom:24 }}><StatCard label="Visites (30j)" value={TRAFIC.visites.toLocaleString()} color={BET_COLOR} icon="👀" /><StatCard label="Pages vues" value={TRAFIC.pagesVues.toLocaleString()} color="#2563eb" icon="📄" /><StatCard label="Taux de rebond" value={`${TRAFIC.tauxRebond}%`} color="#d97706" icon="🔄" /><StatCard label="Taux conversion form." value={`${TRAFIC.tauxConversionForm}%`} color="#059669" icon="📝" /></div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}><div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Sources de trafic</div>{TRAFIC.sources.map(s=><div key={s.name} style={{ marginBottom:12 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}><span>{s.name}</span><span>{s.part}%</span></div><ProgressBar value={s.part} color={BET_COLOR} /></div>)}</div>
                <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Pages les plus consultées</div>{TRAFIC.pagesPopulaires.map(p=><div key={p.titre} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:13 }}><span style={{ color:"#6b7280" }}>{p.titre}</span><strong>{p.vues.toLocaleString()}</strong></div>)}</div></div></div>
            )}

            {activeTab === "clients" && (
              <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>👥 Clients & Prospects</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Funnel de conversion et portefeuille</p></div></div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}><StatCard label="Prospects" value={CLIENTS.prospects} color="#6366f1" icon="👤" /><StatCard label="Inscrits actifs" value={CLIENTS.inscritsActifs} color="#22c55e" icon="✅" /><StatCard label="Nouveaux clients (mois)" value={CLIENTS.nouveauxClientsMois} color="#f59e0b" icon="🆕" /><StatCard label="Taux conversion" value={`${CLIENTS.tauxConversion}%`} color={BET_COLOR} icon="📈" /></div>
                <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Évolution mensuelle du nombre de prospects (mock)</div><ProgressBar value={65} color={BET_COLOR} /><div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:"#9ca3af" }}><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span></div></div></div>
            )}

            {activeTab === "offres" && (
              <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🎓 Offres & Formations</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Performance commerciale des produits</p></div></div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:16, marginBottom:24 }}>{OFFRES.map(offre=><div key={offre.id} style={{ border:`1px solid ${BET_COLOR}20`, borderRadius:12, padding:14, background:"#fff" }}><div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{offre.nom}</div><div style={{ fontSize:11, color:"#9ca3af", marginBottom:12 }}>{offre.type}</div><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:8 }}><span>Inscrits</span><strong>{offre.nbInscrits}</strong></div><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:8 }}><span>CA</span><strong>{formatMoney(offre.chiffre)}</strong></div><div><div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}><span>Taux remplissage</span><span>{offre.tauxRemplissage}%</span></div><ProgressBar value={offre.tauxRemplissage} color={BET_COLOR} /></div></div>)}</div>
                <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Répartition par type (nombre d'inscrits)</div><div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>{Object.entries(REPARTITION_TYPE).map(([type,nb])=><div key={type} style={{ flex:1, textAlign:"center" }}><div style={{ fontWeight:700 }}>{type}</div><div style={{ fontSize:16, color:BET_COLOR }}>{nb}</div></div>)}</div></div></div>
            )}

            {activeTab === "ca" && (
              <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>💰 Chiffre d'affaires & Paiements</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Suivi financier et transactions</p></div></div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>CA par période (6 derniers mois)</div><div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>{Object.entries(CA.parPeriode).slice(-6).map(([mois,val])=><div key={mois} style={{ flex:1, textAlign:"center", background:"#fff", borderRadius:8, padding:6 }}><div style={{ fontSize:10, color:"#9ca3af" }}>{mois}</div><div style={{ fontSize:12, fontWeight:700 }}>{formatMoney(val)}</div></div>)}</div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}><span>Paiements reçus</span><strong>{formatMoney(CA.paiementsRecus)}</strong></div><div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}><span>En attente</span><strong>{formatMoney(CA.paiementsAttente)}</strong></div>
                    <div><div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Moyens de paiement</div>{Object.entries(CA.moyenPaiement).map(([moyen,pct])=><div key={moyen} style={{ marginBottom:8 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}><span>{moyen}</span><span>{pct}%</span></div><ProgressBar value={pct} color="#7c3aed" /></div>)}</div></div>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Dernières transactions</div>{TRANSACTIONS.map(t=><div key={t.id} style={{ padding:"8px 0", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}><div><div style={{ fontSize:12, fontWeight:500 }}>{t.client}</div><div style={{ fontSize:10, color:"#9ca3af" }}>{formatDate(t.date)} · {t.moyen}</div></div><div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700 }}>{formatMoney(t.montant)}</div><span style={{ fontSize:10, color:t.statut==="validé"?"#22c55e":t.statut==="en_attente"?"#f59e0b":"#ef4444" }}>{t.statut==="validé"?"✅":t.statut==="en_attente"?"⏳":"❌"}</span></div></div>)}</div>
                </div></div>
            )}

            {activeTab === "progression" && (
              <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📈 Progression des apprenants</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Indicateurs pédagogiques</p></div></div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}><StatCard label="Progression moyenne" value={`${PROGRESSION.moyenneProgression}%`} color="#2563eb" icon="📈" /><StatCard label="Assiduité moyenne" value={`${PROGRESSION.assiduiteMoyenne}%`} color="#059669" icon="⏱️" /><StatCard label="Bulletins générés" value={PROGRESSION.bulletinsGeneres} color="#d97706" icon="📄" /><StatCard label="Certificats délivrés" value={PROGRESSION.certificatsDelivres} color={BET_COLOR} icon="🏅" /></div>
                <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Résultats moyens par niveau CECRL</div><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{Object.entries(PROGRESSION.resultatsParNiveau).map(([niveau,score])=><div key={niveau} style={{ flex:1, minWidth:60, textAlign:"center", background:"#fff", borderRadius:8, padding:8 }}><div style={{ fontWeight:700, fontSize:13 }}>{niveau}</div><div style={{ fontSize:14, color:score>=70?"#22c55e":"#f59e0b" }}>{score}%</div></div>)}</div></div></div>
            )}

            {activeTab === "support" && (
              <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🛠️ Support & Requêtes</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Suivi des demandes clients</p></div></div>
                <div style={{ display:"flex", gap:12, marginBottom:24 }}><StatCard label="Requêtes ouvertes" value={REQUETES.filter(r=>r.statut!=="résolu").length} color="#ef4444" icon="🟠" /><StatCard label="Temps moyen traitement" value={`${TEMPS_MOYEN_TRAITEMENT} h`} color="#7c3aed" icon="⏱️" /></div>
                <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse" }}><thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}><th style={{ padding:10, textAlign:"left" }}>Client</th><th>Sujet</th><th>Catégorie</th><th>Statut</th><th>Date</th><th>Traitement (h)</th></tr></thead><tbody>{REQUETES.map(r=><tr key={r.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}><td style={{ padding:8 }}>{r.client}</td><td>{r.sujet}</td><td>{r.categorie}</td><td><span style={{ padding:"2px 8px", borderRadius:10, background:r.statut==="ouvert"?"#fee2e2":r.statut==="en_cours"?"#fef3c7":"#dcfce7", color:r.statut==="ouvert"?"#dc2626":r.statut==="en_cours"?"#92400e":"#166534" }}>{r.statut}</span></td><td>{formatDate(r.date)}</td><td>{r.tempsTraitement || "—"}</td></tr>)}</tbody></table></div>
                <div style={{ marginTop:16, background:BET_LIGHT, borderRadius:8, padding:12, textAlign:"center" }}><button onClick={()=>toast.success("Redirection vers la gestion avancée des tickets")} style={{ padding:"8px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Voir toutes les requêtes →</button></div></div>
            )}

            {/* ═══════════ TAB BLOG ═══════════ */}
            {activeTab === "Blog" && (
              <div>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📝 News & Événements BET</h2>
                    <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>
                      {blogArticles.filter(a=>a.publie).length} publiés · {blogArticles.filter(a=>!a.publie).length} brouillons ·{" "}
                      {blogArticles.reduce((s,a)=>s+(a.nb_en_attente||0),0)} commentaire(s) en attente
                    </p>
                  </div>
                  <button onClick={() => openArticleModal()} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>
                    + Nouvel article
                  </button>
                </div>

                {/* Stats rapides */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:20 }}>
                  {[
                    { label:"Total articles",    value:blogArticles.length,                                  color:BET_COLOR,  icon:"📰" },
                    { label:"Publiés",           value:blogArticles.filter(a=>a.publie).length,               color:"#22c55e",  icon:"🟢" },
                    { label:"Brouillons",        value:blogArticles.filter(a=>!a.publie).length,              color:"#d97706",  icon:"✏️" },
                    { label:"Commentaires ⏳",   value:blogArticles.reduce((s,a)=>s+(a.nb_en_attente||0),0), color:"#ef4444",  icon:"💬" },
                  ].map(s => (
                    <div key={s.label} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:38, height:38, borderRadius:9, background:s.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{s.icon}</div>
                      <div>
                        <div style={{ fontSize:11, color:"#6b7280" }}>{s.label}</div>
                        <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Barre de recherche */}
                <div style={{ marginBottom:14 }}>
                  <input type="text" placeholder="🔍 Rechercher un article…" value={blogSearchTerm} onChange={e => setBlogSearchTerm(e.target.value)}
                    style={{ padding:"8px 12px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13, width:260 }} />
                </div>

                {/* Tableau des articles */}
                {blogLoading ? (
                  <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>Chargement…</div>
                ) : filteredBlogArticles.length === 0 ? (
                  <div style={{ textAlign:"center", padding:50 }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                    <p style={{ color:"#9ca3af", marginBottom:16 }}>Aucun article pour l'instant</p>
                    <button onClick={() => openArticleModal()} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>
                      + Rédiger le premier article
                    </button>
                  </div>
                ) : (
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                        {["Titre","Catégorie","Auteur","Date","Commentaires","Statut","Actions"].map(h =>
                          <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:600 }}>{h}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBlogArticles.map(a => (
                        <tr key={a.id} style={{ borderTop:"1px solid #f1f5f9" }}>
                          <td style={{ padding:"10px 12px" }}>
                            <div style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{a.titre}</div>
                            {a.extrait && <div style={{ fontSize:11, color:"#9ca3af", maxWidth:280, marginTop:2 }}>{a.extrait.slice(0,80)}{a.extrait.length>80?"…":""}</div>}
                          </td>
                          <td style={{ padding:"10px 12px" }}>
                            <span style={{ padding:"3px 8px", borderRadius:10, fontSize:11, background:"#ede9fe", color:"#5b21b6" }}>{a.categorie}</span>
                          </td>
                          <td style={{ padding:"10px 12px", fontSize:12, color:"#6b7280" }}>{a.auteur}</td>
                          <td style={{ padding:"10px 12px", fontSize:12, color:"#6b7280" }}>
                            {a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short" }) : "—"}
                          </td>
                          <td style={{ padding:"10px 12px" }}>
                            <button onClick={() => openCommentsModal(a)} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #e5e7eb", background:"#f9fafb", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:5 }}>
                              <span>💬 {a.nb_commentaires||0}</span>
                              {(a.nb_en_attente||0)>0 && <span style={{ background:"#ef4444", color:"#fff", borderRadius:999, padding:"1px 5px", fontSize:10, fontWeight:700 }}>{a.nb_en_attente}</span>}
                            </button>
                          </td>
                          <td style={{ padding:"10px 12px" }}>
                            <span style={{ padding:"3px 10px", borderRadius:14, fontSize:11, fontWeight:700, background:a.publie?"#dcfce7":"#fef3c7", color:a.publie?"#166534":"#92400e" }}>
                              {a.publie ? "Publié" : "Brouillon"}
                            </span>
                          </td>
                          <td style={{ padding:"10px 12px" }}>
                            <div style={{ display:"flex", gap:6 }}>
                              <button onClick={() => openArticleModal(a)} style={{ padding:"4px 8px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, cursor:"pointer", fontSize:13 }}>✏️</button>
                              <button onClick={() => toggleBlogPublie(a)} style={{ padding:"4px 8px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:6, cursor:"pointer", fontSize:13 }} title={a.publie?"Passer en brouillon":"Publier"}>
                                {a.publie ? "🔴" : "🟢"}
                              </button>
                              <button onClick={() => deleteBlogArticle(a.id)} style={{ padding:"4px 8px", background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:6, cursor:"pointer", fontSize:13 }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* ── MODAL ARTICLE ── */}
                {showArticleModal && (
                  <div style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 }}>
                    <div style={{ background:"#fff", padding:28, borderRadius:14, width:620, maxWidth:"92vw", maxHeight:"90vh", overflowY:"auto" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                        <h3 style={{ margin:0, fontSize:16 }}>{editArticle ? "Modifier l'article" : "Nouvel article"}</h3>
                        <button onClick={() => setShowArticleModal(false)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#6b7280" }}>✕</button>
                      </div>

                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Titre *</label>
                      <input type="text" placeholder="Titre de l'article" value={articleForm.titre} onChange={e => setArticleForm({...articleForm, titre:e.target.value})}
                        style={{ padding:9, marginBottom:12, width:"100%", borderRadius:6, border:"1px solid #d1d5db", boxSizing:"border-box", fontSize:13 }} />

                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Extrait (affiché sur la liste)</label>
                      <textarea value={articleForm.extrait} placeholder="Résumé court de l'article…" onChange={e => setArticleForm({...articleForm, extrait:e.target.value})}
                        style={{ padding:9, marginBottom:12, width:"100%", borderRadius:6, border:"1px solid #d1d5db", boxSizing:"border-box", fontSize:13, minHeight:60, resize:"vertical" }} />

                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Contenu complet</label>
                      <textarea value={articleForm.contenu} placeholder="Corps de l'article (HTML accepté)…" onChange={e => setArticleForm({...articleForm, contenu:e.target.value})}
                        style={{ padding:9, marginBottom:12, width:"100%", borderRadius:6, border:"1px solid #d1d5db", boxSizing:"border-box", fontSize:13, minHeight:160, resize:"vertical", fontFamily:"monospace" }} />

                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        <div>
                          <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Catégorie</label>
                          <select value={articleForm.categorie} onChange={e => setArticleForm({...articleForm, categorie:e.target.value})}
                            style={{ padding:9, marginBottom:12, width:"100%", borderRadius:6, border:"1px solid #d1d5db", boxSizing:"border-box", fontSize:13 }}>
                            {BLOG_CATS.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Auteur</label>
                          <input type="text" value={articleForm.auteur} onChange={e => setArticleForm({...articleForm, auteur:e.target.value})}
                            style={{ padding:9, marginBottom:12, width:"100%", borderRadius:6, border:"1px solid #d1d5db", boxSizing:"border-box", fontSize:13 }} />
                        </div>
                      </div>

                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Image de couverture</label>
                      <label style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderRadius:6, border:"1.5px dashed #d1d5db", cursor:"pointer", background:"#f9fafb", marginBottom:10 }}>
                        <span style={{ fontSize:18 }}>🖼️</span>
                        <span style={{ fontSize:12, color:"#6b7280" }}>{uploadingCover ? "Envoi en cours…" : "Choisir une image (JPG, PNG, WebP — max 8 Mo)"}</span>
                        <input type="file" accept="image/*" onChange={handleCoverFile} style={{ display:"none" }} />
                      </label>
                      {uploadingCover && <div style={{ fontSize:12, color:"#6b7280", marginBottom:8 }}>⏳ Upload en cours…</div>}
                      {articleForm.image_url && !uploadingCover && (
                        <div style={{ position:"relative", marginBottom:12 }}>
                          <img src={articleForm.image_url} alt="couverture" style={{ width:"100%", height:140, objectFit:"cover", borderRadius:8 }} />
                          <button onClick={() => setArticleForm(f=>({...f,image_url:""}))} style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,.55)", color:"#fff", border:"none", borderRadius:"50%", width:24, height:24, cursor:"pointer", fontSize:14, lineHeight:"24px" }}>✕</button>
                        </div>
                      )}

                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, marginTop:4 }}>Images du contenu (optionnel — max 3)</label>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ marginBottom:12, padding:10, borderRadius:8, background:"#f9fafb", border:"1px solid #e5e7eb" }}>
                          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:12, color:"#6b7280" }}>
                            <span style={{ fontSize:16 }}>📷</span>
                            <span>{uploadingImg[i] ? "Envoi en cours…" : `Image ${i+1} — cliquer pour choisir`}</span>
                            <input type="file" accept="image/*" onChange={e => handleContentFile(e, i)} style={{ display:"none" }} />
                          </label>
                          {uploadingImg[i] && <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>⏳ Upload…</div>}
                          {articleForm.images[i] && !uploadingImg[i] && (
                            <div style={{ position:"relative", marginTop:8 }}>
                              <img src={articleForm.images[i]} alt={`img ${i+1}`} style={{ width:"100%", height:90, objectFit:"cover", borderRadius:6 }} />
                              <button onClick={() => { const imgs=[...articleForm.images]; imgs[i]=""; setArticleForm(f=>({...f,images:imgs})); }} style={{ position:"absolute", top:5, right:5, background:"rgba(0,0,0,.55)", color:"#fff", border:"none", borderRadius:"50%", width:22, height:22, cursor:"pointer", fontSize:13, lineHeight:"22px" }}>✕</button>
                            </div>
                          )}
                        </div>
                      ))}

                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Temps de lecture</label>
                      <input type="text" placeholder="ex: 5 min" value={articleForm.read_time} onChange={e => setArticleForm({...articleForm, read_time:e.target.value})}
                        style={{ padding:9, marginBottom:14, width:"100%", borderRadius:6, border:"1px solid #d1d5db", boxSizing:"border-box", fontSize:13 }} />

                      <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:600, color:"#374151", marginBottom:16, cursor:"pointer" }}>
                        <input type="checkbox" checked={articleForm.publie} onChange={e => setArticleForm({...articleForm, publie:e.target.checked})} style={{ accentColor:BET_COLOR, width:16, height:16 }} />
                        Publier immédiatement sur le site
                      </label>

                      <div style={{ display:"flex", gap:10 }}>
                        <button onClick={saveBlogArticle} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>
                          {editArticle ? "Enregistrer" : "Créer l'article"}
                        </button>
                        <button onClick={() => setShowArticleModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── MODAL COMMENTAIRES ── */}
                {showCommentsModal && commentsArticle && (
                  <div style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 }}>
                    <div style={{ background:"#fff", padding:28, borderRadius:14, width:600, maxWidth:"92vw", maxHeight:"88vh", overflowY:"auto" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                        <div>
                          <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>💬 Commentaires</h3>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{commentsArticle.titre}</p>
                        </div>
                        <button onClick={() => setShowCommentsModal(false)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#6b7280" }}>✕</button>
                      </div>

                      {articleComments.length === 0 ? (
                        <div style={{ textAlign:"center", padding:32, color:"#9ca3af" }}>
                          <span style={{ fontSize:32 }}>🗨️</span>
                          <p>Aucun commentaire pour cet article.</p>
                        </div>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                          {articleComments.map(c => (
                            <div key={c.id} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 16px", background:c.approuve?"#f0fdf4":"#fffbeb" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                  <div style={{ width:34, height:34, borderRadius:"50%", background:BET_COLOR+"20", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:BET_COLOR, fontSize:13 }}>
                                    {c.nom[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight:600, fontSize:13 }}>{c.nom}</div>
                                    {c.email && <div style={{ fontSize:11, color:"#9ca3af" }}>{c.email}</div>}
                                    <div style={{ fontSize:11, color:"#9ca3af" }}>{c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : ""}</div>
                                  </div>
                                </div>
                                <span style={{ padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700, background:c.approuve?"#dcfce7":"#fef3c7", color:c.approuve?"#166534":"#92400e" }}>
                                  {c.approuve ? "✅ Approuvé" : "⏳ En attente"}
                                </span>
                              </div>
                              <p style={{ margin:"0 0 10px", fontSize:13, color:"#334155", lineHeight:1.6 }}>{c.commentaire}</p>
                              <div style={{ display:"flex", gap:8 }}>
                                <button onClick={() => toggleComment(c)} style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #e5e7eb", background:c.approuve?"#fff1f2":"#f0fdf4", color:c.approuve?"#dc2626":"#16a34a", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                                  {c.approuve ? "🔴 Désapprouver" : "✅ Approuver"}
                                </button>
                                <button onClick={() => deleteComment(c.id)} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #fecdd3", background:"#fff1f2", color:"#dc2626", cursor:"pointer", fontSize:12 }}>
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "__super_admin_only_permissions" && (
              <div>
                <div style={{ display:"flex", gap:3, marginBottom:20, flexWrap:"wrap", borderBottom:"1px solid #e5e7eb", paddingBottom:8 }}>
                  {permTabs.map(tab => {
                    const isActive = permSubTab === tab.key;
                    return <button key={tab.key} onClick={() => setPermSubTab(tab.key)} style={{ padding:"8px 14px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer", fontWeight:600, fontSize:12, background:isActive?BET_LIGHT:"transparent", color:isActive?BET_COLOR:"#6b7280", display:"flex", alignItems:"center", gap:5 }}><span style={{ fontSize:13 }}>{tab.icon}</span>{tab.label}{tab.badge!==null&&tab.badge!==undefined&&<span style={{ padding:"1px 6px", borderRadius:9, fontSize:10, fontWeight:700, background:tab.danger?"#fee2e2":BET_LIGHT, color:tab.danger?"#dc2626":BET_COLOR }}>{tab.badge}</span>}</button>;
                  })}
                </div>
                {permSubTab === "vue_ensemble" && (
                  <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}><div><h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Vue d'ensemble — Contrôle d'accès</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Tableau de bord de sécurité en temps réel</p></div><div style={{ display:"flex", gap:8 }}><button onClick={()=>setShowCloneModal(true)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>📋 Cloner des permissions</button><button onClick={()=>setShowInviteModal(true)} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Inviter un utilisateur</button></div></div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:26 }}><KpiCard icon="👥" label="Utilisateurs totaux" value={users.length} color={BET_COLOR} sub={`${stats.actifs} actifs`} onClick={()=>setPermSubTab("utilisateurs")}/><KpiCard icon="🟢" label="Connexions actives" value={onlineUsers.length} color="#22c55e" sub="En ce moment"/><KpiCard icon="🔐" label="Sans 2FA activé" value={stats.sans2fa} color={stats.sans2fa>0?BET_RED:BET_COLOR} sub="Utilisateurs à risque" alert={stats.sans2fa>2} onClick={()=>setPermSubTab("securite")}/><KpiCard icon="📬" label="Demandes en attente" value={stats.enAttente} color="#d97706" sub="À traiter" alert={stats.enAttente>0} onClick={()=>setPermSubTab("demandes")}/><KpiCard icon="⚠️" label="Alertes sécurité" value={stats.alertes} color={BET_RED} sub="Dernières 48h" alert={stats.alertes>0} onClick={()=>setPermSubTab("audit")}/><KpiCard icon="⏳" label="Accès temporaires" value={stats.tempAccess} color="#7c3aed" sub="Actifs"/></div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}><div><h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:14 }}>Répartition par rôle</h3>{Object.values(ROLES_DEF).reverse().map(r=>{const count=users.filter(u=>u.role===r.id).length;const pct=users.length?Math.round((count/users.length)*100):0;return <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, padding:"10px 14px", borderRadius:10, background:`${r.color}06`, border:`1px solid ${r.border}`, cursor:"pointer" }} onClick={()=>{setFiltreRole(r.id);setPermSubTab("utilisateurs");}}><span style={{ fontSize:20 }}>{r.emoji}</span><div style={{ flex:1 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{r.label}</span><span style={{ fontWeight:800, color:r.color, fontSize:14 }}>{count}</span></div><div style={{ height:5, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}><div style={{ height:"100%", width:`${pct}%`, background:r.color, borderRadius:3 }}/></div></div></div>})}</div>
                      <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}><h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0 }}>Activité récente</h3><button onClick={()=>setPermSubTab("audit")} style={{ padding:"5px 10px", background:"none", color:BET_COLOR, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:11 }}>Voir tout →</button></div>{auditLog.slice(0,5).map(a=>{const colors={success:"#059669",danger:BET_RED,warning:"#d97706"};const bgs={success:"#f0fdf4",danger:"#fff1f2",warning:"#fff7ed"};const icons={success:"✅",danger:"🚨",warning:"⚠️"};return <div key={a.id} style={{ display:"flex", gap:10, padding:"9px 12px", borderRadius:9, background:bgs[a.statut]||"#f8fafc", border:`1px solid ${a.statut==="danger"?"#fecdd3":a.statut==="warning"?"#fed7aa":"#e5e7eb"}`, marginBottom:8 }}><span style={{ fontSize:16 }}>{icons[a.statut]||"ℹ️"}</span><div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{a.action.replace(/_/g," ")}</div><div style={{ fontSize:11, color:"#6b7280", marginTop:1 }}>{a.detail.slice(0,55)}{a.detail.length>55?"…":""}</div></div><div style={{ fontSize:10, color:"#9ca3af", flexShrink:0 }}>{a.date.slice(11,16)}</div></div>})}</div></div></div>
                )}
                {permSubTab === "utilisateurs" && (
                  <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Utilisateurs administratifs</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{usersFiltres.length} affiché(s) sur {users.length}</p></div><div style={{ display:"flex", gap:8 }}><button onClick={exportUsers} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Export CSV</button><button onClick={()=>setShowInviteModal(true)} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Inviter</button></div></div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}><input type="text" placeholder="🔍 Nom ou email…" value={searchUser} onChange={e=>setSearchUser(e.target.value)} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:200, marginBottom:0 }} /><div style={{ display:"flex", gap:5 }}>{["Tous","super_admin","admin","responsable","manager"].map(r=><button key={r} onClick={()=>setFiltreRole(r)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:11, fontWeight:600, cursor:"pointer", background:filtreRole===r?(ROLES_DEF[r]?.color||BET_COLOR):"#fff", color:filtreRole===r?"#fff":"#6b7280", borderColor:filtreRole===r?(ROLES_DEF[r]?.color||BET_COLOR):"#e5e7eb" }}>{r==="Tous"?"Tous":ROLES_DEF[r]?.emoji+" "+ROLES_DEF[r]?.label}</button>)}</div><div style={{ display:"flex", gap:5 }}>{["Tous","Actifs","Inactifs","Sans 2FA","En ligne"].map(s=><button key={s} onClick={()=>setFiltreStatut(s)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:11, cursor:"pointer", background:filtreStatut===s?BET_COLOR:"#fff", color:filtreStatut===s?"#fff":"#6b7280", borderColor:filtreStatut===s?BET_COLOR:"#e5e7eb" }}>{s}</button>)}</div></div>
                    <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse" }}><thead><tr style={{ background:"#f9fafb" }}>{["Utilisateur","Rôle","Statut","2FA","Sessions","Dernier accès","Accès temp.","Actions"].map(h=><th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:"#6b7280", fontWeight:600 }}>{h}</th>)}</tr></thead><tbody>{usersFiltres.map(u=>{const r=ROLES_DEF[u.role];const isOnline=onlineUsers.includes(u.id);const isExpired=u.accessTemp&&new Date(u.accessTemp)<new Date();return <tr key={u.id} style={{ borderTop:"1px solid #f1f5f9", background:!u.actif?"#f9fafb":"#fff" }}><td style={{ padding:"12px" }}><div style={{ display:"flex", alignItems:"center", gap:10 }}><div style={{ position:"relative" }}><div style={{ width:36, height:36, borderRadius:"50%", background:`${r?.color||BET_COLOR}18`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:r?.color||BET_COLOR }}>{u.avatar}</div>{isOnline&&<div style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%", background:"#22c55e", border:"2px solid #fff" }}/>}</div><div><div style={{ fontWeight:600, fontSize:13 }}>{u.nom}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{u.email}</div></div></div></td><td style={{ padding:"12px" }}><RoleBadge role={u.role}/></td><td style={{ padding:"12px" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><ToggleSwitch on={u.actif} onChange={()=>toggleUserStatus(u.id)} color="#22c55e"/><span style={{ fontSize:11, color:u.actif?"#22c55e":"#9ca3af", fontWeight:600 }}>{u.actif?"Actif":"Inactif"}</span></div></td><td style={{ padding:"12px" }}><div style={{ display:"flex", alignItems:"center", gap:6 }}><ToggleSwitch on={u.twofa} onChange={()=>{setUsers(users.map(x=>x.id===u.id?{...x,twofa:!x.twofa}:x));addAuditEntry("2FA_MODIFIE",`${u.nom} : 2FA ${!u.twofa?"activé":"désactivé"}`,"warning");toast(`2FA ${!u.twofa?"activé":"désactivé"} pour ${u.nom}`);}} color={BET_COLOR}/>{!u.twofa&&u.actif&&<span style={{ fontSize:10, color:BET_RED, fontWeight:700 }}>⚠️</span>}</div></td><td style={{ padding:"12px" }}><div style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ fontWeight:700, color:u.sessions>0?BET_COLOR:"#9ca3af" }}>{u.sessions}</span>{u.sessions>0&&<button onClick={()=>{setUserToRevoke(u);setShowRevokeModal(true);}} style={{ padding:"2px 7px", borderRadius:5, background:"#fff1f2", border:"1px solid #fecdd3", color:BET_RED, fontSize:10, cursor:"pointer", fontWeight:600 }}>Révoquer</button>}</div></td><td style={{ padding:"12px", fontSize:12, color:"#6b7280" }}>{u.dernConn}</td><td style={{ padding:"12px" }}>{u.accessTemp?<span style={{ fontSize:11, padding:"2px 7px", borderRadius:8, background:isExpired?"#fee2e2":"#fef3c7", color:isExpired?"#dc2626":"#92400e", fontWeight:600 }}>{isExpired?"Expiré":"⏳ "+(new Date(u.accessTemp)).toLocaleDateString("fr-FR")}</span>:<span style={{ color:"#d1d5db", fontSize:11 }}>Permanent</span>}</td><td style={{ padding:"12px" }}><div style={{ display:"flex", gap:5 }}><button onClick={()=>{setEditingUser(u);setShowUserModal(true);}} style={{ padding:"5px 10px", background:BET_LIGHT, color:BET_DARK, border:`1px solid ${BET_COLOR}40`, borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️</button><button onClick={()=>{setEditingRole(u.role);setPermSubTab("matrice");}} style={{ padding:"5px 10px", background:BET_LIGHT, color:BET_DARK, border:`1px solid ${BET_COLOR}40`, borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600 }}>🔐</button></div></td></tr>})}</tbody></table></div></div>
                )}
                {permSubTab === "matrice" && (
                  <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Matrice des permissions</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Configurez les droits CRUD par rôle et par module</p></div><div style={{ display:"flex", gap:8 }}><button onClick={()=>setShowCloneModal(true)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>📋 Cloner</button><button onClick={()=>{addAuditEntry("MATRICE_EXPORTEE","Export de la matrice des permissions","warning");toast.success("Export en cours…");}} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Export</button></div></div>
                    <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>{Object.values(ROLES_DEF).map(r=><button key={r.id} onClick={()=>setEditingRole(r.id)} style={{ padding:"9px 18px", borderRadius:10, border:`2px solid ${editingRole===r.id?r.color:"#e5e7eb"}`, background:editingRole===r.id?r.color+"10":"#fff", cursor:"pointer", fontWeight:editingRole===r.id?700:400, color:editingRole===r.id?r.color:"#374151", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>{r.emoji} {r.label}</button>)}</div>
                    {(()=>{const r=ROLES_DEF[editingRole];return <div style={{ padding:"12px 16px", borderRadius:10, background:`${r.color}06`, border:`1px solid ${r.border}`, marginBottom:18, display:"flex", gap:14, alignItems:"center" }}><span style={{ fontSize:28 }}>{r.emoji}</span><div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{r.label}</div><div style={{ fontSize:12, color:"#6b7280" }}>{r.description}</div></div>{editingRole==="super_admin"?<span style={{ padding:"4px 12px", borderRadius:8, background:"#fee2e2", color:"#dc2626", fontSize:12, fontWeight:700 }}>🔒 Non modifiable</span>:<button onClick={savePermissions} style={{ ...btnPrimary, background:r.color }}>💾 Sauvegarder</button>}</div>})()}
                    <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>{Object.entries(PERM_LABELS).map(([k,l])=><div key={k} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12 }}><div style={{ width:16, height:16, borderRadius:4, background:PERM_COLORS[k] }}/><span style={{ color:"#6b7280" }}>{l}</span></div>)}</div>
                    <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse" }}><thead><tr style={{ background:"#f9fafb" }}><th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"#6b7280", fontWeight:600, minWidth:220 }}>Module</th><th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"#6b7280", fontWeight:600 }}>Catégorie</th>{Object.entries(PERM_LABELS).map(([k,l])=><th key={k} style={{ padding:"10px 14px", textAlign:"center", fontSize:11, color:PERM_COLORS[k], fontWeight:700, minWidth:90 }}>{l}</th>)}<th style={{ padding:"10px 14px", textAlign:"center", fontSize:11, color:"#9ca3af", fontWeight:600 }}>Tout</th></tr></thead><tbody>{[...new Set(MODULES.map(m=>m.cat))].map(cat=><React.Fragment key={cat}><tr><td colSpan={7} style={{ padding:"8px 14px", background:"#f8fafc", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:"0.06em", borderTop:"1px solid #e5e7eb" }}>{cat}</td></tr>{MODULES.filter(m=>m.cat===cat).map(m=>{const perms=permissions[editingRole]?.[m.id]||{};const allOn=Object.values(perms).every(Boolean);return <tr key={m.id} style={{ borderTop:"1px solid #f1f5f9" }}><td style={{ padding:"10px 14px" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:16 }}>{m.icon}</span><span style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>{m.label}</span></div></td><td style={{ padding:"10px 14px" }}><span style={{ fontSize:10, padding:"2px 7px", borderRadius:5, background:"#f3f4f6", color:"#6b7280" }}>{m.cat}</span></td>{Object.keys(PERM_LABELS).map(perm=><td key={perm} style={{ padding:"10px 14px", textAlign:"center" }}><div style={{ display:"flex", justifyContent:"center" }}><PermCheckbox on={!!perms[perm]} color={PERM_COLORS[perm]} onChange={()=>togglePerm(editingRole,m.id,perm)} disabled={editingRole==="super_admin"}/></div></td>)}<td style={{ padding:"10px 14px", textAlign:"center" }}>{editingRole!=="super_admin"&&<div style={{ display:"flex", justifyContent:"center" }}><PermCheckbox on={allOn} color={ROLES_DEF[editingRole]?.color||BET_COLOR} onChange={()=>{const newPerms=Object.fromEntries(Object.keys(PERM_LABELS).map(p=>[p,!allOn]));setPermissions(prev=>({...prev,[editingRole]:{...prev[editingRole],[m.id]:newPerms}}));}}/></div>}</td></tr>})}</React.Fragment>)}</tbody></table></div></div>
                )}
                {permSubTab === "securite" && (
                  <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}><div><h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Politiques de Sécurité</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Configurez les règles de sécurité par rôle</p></div><button onClick={()=>{addAuditEntry("POLITIQUES_SAUVEGARDEES","Politiques de sécurité mises à jour");toast.success("Politiques sauvegardées ✓");}} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>💾 Sauvegarder toutes les politiques</button></div>
                    {stats.sans2fa>0&&<div style={{ padding:"14px 18px", borderRadius:12, background:"#fff7ed", border:"1px solid #fed7aa", marginBottom:20, display:"flex", gap:12, alignItems:"center" }}><span style={{ fontSize:22 }}>⚠️</span><div><div style={{ fontWeight:700, fontSize:14, color:"#92400e" }}>{stats.sans2fa} utilisateur(s) actif(s) sans authentification 2FA</div><div style={{ fontSize:12, color:"#b45309" }}>Renforcez la sécurité en forçant le 2FA pour ces comptes.</div></div><button onClick={()=>{setUsers(prev=>prev.map(u=>({...u,twofa:u.actif?true:u.twofa})));addAuditEntry("2FA_FORCE_GLOBAL","2FA activé de force sur tous les comptes actifs");toast.success(`2FA forcé sur ${stats.sans2fa} compte(s) ✓`);}} style={{ ...btnPrimary, marginLeft:"auto", background:BET_RED, whiteSpace:"nowrap" }}>🔒 Forcer le 2FA sur tous</button></div>}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:18 }}>{Object.entries(securite).map(([roleId,pol])=>{const r=ROLES_DEF[roleId];return <div key={roleId} style={{ borderRadius:14, border:`1.5px solid ${r.border}`, padding:20, background:"#fff" }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${r.border}` }}><span style={{ fontSize:24 }}>{r.emoji}</span><div><div style={{ fontWeight:700, fontSize:15, color:r.color }}>{r.label}</div><div style={{ fontSize:11, color:"#9ca3af" }}>Niveau {r.niveau} · {users.filter(u=>u.role===roleId).length} utilisateur(s)</div></div></div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}><div><div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>🔐 2FA obligatoire</div><div style={{ fontSize:11, color:"#9ca3af" }}>Authentification à 2 facteurs</div></div><ToggleSwitch on={pol.twofa_obligatoire} color={r.color} onChange={(v)=>{setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],twofa_obligatoire:v}}));addAuditEntry("POLITIQUE_2FA",`${r.label} : 2FA obligatoire → ${v?"activé":"désactivé"}`,"warning");}}/></div>
                      <div style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}><span style={{ fontWeight:600, color:"#374151" }}>⏱ Expiration session</span><strong style={{ color:r.color }}>{pol.expiration_session} min</strong></div><input type="range" min={15} max={480} step={15} value={pol.expiration_session} onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],expiration_session:Number(e.target.value)}}))}/><div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#d1d5db", marginTop:2 }}><span>15 min</span><span>8h</span></div></div>
                      <div style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}><span style={{ fontWeight:600, color:"#374151" }}>🔄 Tentatives max</span><strong style={{ color:r.color }}>{pol.tentatives_max}</strong></div><input type="range" min={2} max={10} step={1} value={pol.tentatives_max} onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],tentatives_max:Number(e.target.value)}}))}/></div>
                      <div style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}><span style={{ fontWeight:600, color:"#374151" }}>🔑 Rotation mdp</span><strong style={{ color:r.color }}>{pol.rotation_pwd_jours} jours</strong></div><input type="range" min={30} max={365} step={30} value={pol.rotation_pwd_jours} onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],rotation_pwd_jours:Number(e.target.value)}}))}/></div>
                      <div style={{ marginBottom:10 }}><label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>🛡️ Complexité mot de passe</label><select value={pol.complexite_pwd} onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],complexite_pwd:e.target.value}}))} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%" }}><option value="normale">Normale (8 car. minimum)</option><option value="moyenne">Moyenne (12 car. + chiffres)</option><option value="haute">Haute (12 car. + spéciaux)</option><option value="tres_haute">Très haute (16 car. + tout)</option></select></div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}><div><div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>🌐 Restriction IP</div><div style={{ fontSize:11, color:"#9ca3af" }}>Limiter aux IPs autorisées</div></div><ToggleSwitch on={pol.ip_restriction} color={r.color} onChange={(v)=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],ip_restriction:v}}))}/></div></div>})}</div></div>
                )}
                {permSubTab === "demandes" && (
                  <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}><div><h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Demandes d'accès</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{demandes.filter(d=>d.statut==="en_attente").length} demande(s) en attente de traitement</p></div></div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>{demandes.map(d=>{const r=ROLES_DEF[d.roleDemande];const statutMeta={en_attente:{bg:"#fef3c7",c:"#92400e",label:"⏳ En attente"},approuve:{bg:"#dcfce7",c:"#166534",label:"✅ Approuvé"},refuse:{bg:"#fee2e2",c:"#991b1b",label:"❌ Refusé"}};const sm=statutMeta[d.statut];return <div key={d.id} style={{ borderRadius:14, border:`1.5px solid ${d.statut==="en_attente"?r?.border:"#e5e7eb"}`, background:"#fff", overflow:"hidden" }}><div style={{ height:4, background:d.statut==="en_attente"?r?.color||BET_COLOR:d.statut==="approuve"?"#22c55e":"#9ca3af" }}/><div style={{ padding:18 }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}><div style={{ display:"flex", gap:10, alignItems:"center" }}><div style={{ width:40, height:40, borderRadius:"50%", background:`${r?.color||BET_COLOR}15`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:r?.color||BET_COLOR }}>{d.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div><div><div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{d.nom}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{d.email}</div></div></div><span style={{ padding:"3px 9px", borderRadius:10, fontSize:11, fontWeight:700, background:sm.bg, color:sm.c }}>{sm.label}</span></div><div style={{ marginBottom:10 }}><div style={{ fontSize:11, color:"#9ca3af", marginBottom:5 }}>Entreprise · Date</div><div style={{ fontSize:13, color:"#374151" }}>🏢 {d.entreprise} · 📅 {fmtDate(d.date)}</div></div><div style={{ marginBottom:10 }}><div style={{ fontSize:11, color:"#9ca3af", marginBottom:5 }}>Rôle demandé</div><RoleBadge role={d.roleDemande}/></div><div style={{ padding:"9px 12px", borderRadius:8, background:"#f8fafc", fontSize:12, color:"#374151", lineHeight:1.5, marginBottom:14 }}>💬 {d.justification}</div>{d.statut==="en_attente"&&<div style={{ display:"flex", gap:8 }}><button onClick={()=>handleDemande(d.id,"approuver")} style={{ ...btnPrimary, flex:1, textAlign:"center", background:"#22c55e" }}>✅ Approuver</button><button onClick={()=>handleDemande(d.id,"refuser")} style={{ ...btnSecondary, flex:1, textAlign:"center", background:"#fee2e2", color:BET_RED, border:`1px solid #fecdd3` }}>❌ Refuser</button><button onClick={()=>{setSelectedDemande(d);setShowDemandeModal(true);}} style={{ ...btnSecondary, padding:"9px 11px" }}>🔍</button></div>}</div></div>})}</div></div>
                )}
                {permSubTab === "audit" && (
                  <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Journal d'Audit</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Traçabilité complète de toutes les actions administratives</p></div><button onClick={()=>{const csv="Acteur,Rôle,Action,Détail,Date,IP,Statut\n"+auditLog.map(a=>[a.acteur,a.role,a.action,`"${a.detail}"`,a.date,a.ip,a.statut].join(",")).join("\n");const el=document.createElement("a");el.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv);el.download=`audit_log_${new Date().toISOString().split("T")[0]}.csv`;el.click();toast.success("Journal exporté ✓");}} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Export audit</button></div>
                    <div style={{ display:"flex", gap:8, marginBottom:16 }}>{["Tous","success","warning","danger"].map(f=>{const meta={Tous:{bg:"#f3f4f6",c:"#374151"},success:{bg:"#dcfce7",c:"#166534"},warning:{bg:"#fef3c7",c:"#92400e"},danger:{bg:"#fee2e2",c:"#991b1b"}};const m=meta[f];return <button key={f} onClick={()=>setFiltreAudit(f)} style={{ padding:"5px 14px", borderRadius:20, border:"1px solid", fontSize:12, cursor:"pointer", background:filtreAudit===f?m.bg:"#fff", color:filtreAudit===f?m.c:"#6b7280", borderColor:filtreAudit===f?m.bg:"#e5e7eb", fontWeight:filtreAudit===f?700:400 }}>{f==="Tous"?"Tous":f==="success"?"✅ Succès":f==="warning"?"⚠️ Attention":"🚨 Alertes"}</button>})}<span style={{ fontSize:12, color:"#9ca3af", alignSelf:"center", marginLeft:"auto" }}>{auditFiltres.length} entrée(s)</span></div>
                    <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse" }}><thead><tr style={{ background:"#f9fafb" }}><th style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:"#6b7280", fontWeight:600 }}></th><th>Acteur</th><th>Action</th><th>Détail</th><th>Date & Heure</th><th>IP Source</th></tr></thead><tbody>{auditFiltres.map(a=>{const meta={success:{bg:"#f0fdf4",dot:"#22c55e",c:"#166534"},warning:{bg:"#fff7ed",dot:"#f59e0b",c:"#92400e"},danger:{bg:"#fff1f2",dot:"#ef4444",c:"#991b1b"}};const m=meta[a.statut]||meta.success;const r=ROLES_DEF[a.role];return <tr key={a.id} style={{ borderTop:"1px solid #f1f5f9", background:a.statut==="danger"?"#fff8f8":a.statut==="warning"?"#fffaf0":"#fff" }}><td style={{ padding:"10px 12px" }}><div style={{ width:8, height:8, borderRadius:"50%", background:m.dot, boxShadow:`0 0 0 3px ${m.dot}30` }}/></td><td style={{ padding:"10px 12px" }}><div style={{ fontWeight:600, fontSize:13 }}>{a.acteur}</div>{r&&<RoleBadge role={a.role}/>}</td><td style={{ padding:"10px 12px" }}><span style={{ padding:"3px 9px", borderRadius:8, fontSize:11, fontWeight:700, background:m.bg, color:m.c }}>{a.action.replace(/_/g," ")}</span></td><td style={{ padding:"10px 12px", fontSize:12, color:"#374151", maxWidth:260 }}>{a.detail}</td><td style={{ padding:"10px 12px", fontSize:12, color:"#6b7280", whiteSpace:"nowrap" }}>{a.date}</td><td style={{ padding:"10px 12px" }}><code style={{ fontSize:11, padding:"2px 7px", borderRadius:5, background:"#f3f4f6", color:"#374151" }}>{a.ip}</code></td></tr>})}</tbody></table></div></div>
                )}
              </div>
            )}

            {/* ================= NOUVEAUX ONGLETS ================= */}

            {/* 1. PLANNING */}
            {activeTab === "planning" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📅 Planning hebdomadaire</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Créneaux de formations par coach, classe et module</p></div>
                  <button onClick={()=>toast.success("Session ajoutée")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Programmer un créneau</button>
                </div>

                {/* Filters */}
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20, padding:"14px 16px", background:"#f8fafc", borderRadius:10, border:"1px solid #e5e7eb" }}>
                  <select value={filtrePlanCoach} onChange={e=>setFiltrePlanCoach(e.target.value)} style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #d1d5db", fontSize:13, background:"#fff" }}>
                    <option value="Tous">👨‍🏫 Tous les coachs</option>
                    {[...new Set(PLANNING_CRENEAUX.map(s=>s.coach))].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filtrePlanClasse} onChange={e=>setFiltrePlanClasse(e.target.value)} style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #d1d5db", fontSize:13, background:"#fff" }}>
                    <option value="Tous">🏫 Toutes les classes</option>
                    {[...new Set(PLANNING_CRENEAUX.map(s=>s.classe))].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filtrePlanModule} onChange={e=>setFiltrePlanModule(e.target.value)} style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #d1d5db", fontSize:13, background:"#fff" }}>
                    <option value="Tous">📚 Tous les modules</option>
                    {[...new Set(PLANNING_CRENEAUX.map(s=>s.module))].map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  {(filtrePlanCoach!=="Tous"||filtrePlanClasse!=="Tous"||filtrePlanModule!=="Tous") && (
                    <button onClick={()=>{setFiltrePlanCoach("Tous");setFiltrePlanClasse("Tous");setFiltrePlanModule("Tous");}} style={{ padding:"8px 12px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>✕ Réinitialiser</button>
                  )}
                  <span style={{ alignSelf:"center", fontSize:12, color:"#9ca3af", marginLeft:"auto" }}>{planningFiltres.length} créneau(x) affiché(s)</span>
                </div>

                {/* KPIs */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                  <StatCard label="Créneaux cette semaine" value={planningFiltres.length} color={BET_COLOR} icon="📅" />
                  <StatCard label="Sessions présentiel" value={planningFiltres.filter(s=>s.type==="presentiel").length} color="#059669" icon="🏢" />
                  <StatCard label="Sessions en ligne" value={planningFiltres.filter(s=>s.type==="online").length} color="#8b5cf6" icon="🌐" />
                  <StatCard label="Places occupées" value={planningFiltres.reduce((a,s)=>a+s.inscrits,0)} color="#f59e0b" icon="👥" />
                </div>

                {/* Weekly grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
                  {["Lundi","Mardi","Mercredi","Jeudi","Vendredi"].map(jour => {
                    const slots = planningFiltres.filter(s=>s.jour===jour).sort((a,b)=>a.heureDebut.localeCompare(b.heureDebut));
                    return (
                      <div key={jour}>
                        <div style={{ textAlign:"center", padding:"8px 6px", background:BET_COLOR, color:"#fff", borderRadius:"8px 8px 0 0", fontWeight:700, fontSize:13, marginBottom:4 }}>{jour}</div>
                        {slots.length === 0 ? (
                          <div style={{ padding:12, textAlign:"center", fontSize:12, color:"#d1d5db", background:"#fafafa", borderRadius:"0 0 8px 8px", border:"1px dashed #e5e7eb" }}>Aucun créneau</div>
                        ) : slots.map(slot => {
                          const isOnline = slot.type === "online";
                          const full = slot.inscrits >= slot.placesMax;
                          return (
                            <div key={slot.id} style={{ marginBottom:8, padding:10, borderRadius:8, background: isOnline?"#faf5ff":"#eff6ff", border:`1px solid ${isOnline?"#c4b5fd":"#bfdbfe"}`, fontSize:11 }}>
                              <div style={{ fontWeight:700, color:isOnline?"#7c3aed":BET_DARK, marginBottom:3 }}>
                                🕐 {slot.heureDebut}–{slot.heureFin}
                              </div>
                              <div style={{ fontWeight:600, color:"#0f172a", marginBottom:2, fontSize:12 }}>{slot.cours}</div>
                              <div style={{ color:"#6b7280", marginBottom:2 }}>👨‍🏫 {slot.coach}</div>
                              <div style={{ color:"#6b7280", marginBottom:4 }}>🏫 {slot.classe} · {isOnline?"🌐 En ligne":"🏢 "+slot.salle}</div>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                <span style={{ padding:"2px 6px", borderRadius:4, background: isOnline?"#ede9fe":"#dbeafe", color:isOnline?"#6d28d9":"#1d4ed8", fontSize:10 }}>{slot.module}</span>
                                <span style={{ fontSize:11, fontWeight:700, color:full?"#dc2626":"#059669" }}>{slot.inscrits}/{slot.placesMax}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. PROFESSEURS */}
            {activeTab === "professeurs" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>👨‍🏫 Liste des professeurs</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{PROFESSEURS.length} enseignants</p></div>
                  <button onClick={()=>toast.success("Ajouter un professeur")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Nouveau professeur</button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                      <th>Nom</th><th>Email</th><th>Téléphone</th><th>Spécialité</th><th>Statut</th><th>Cours en charge</th><th>Salaire</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                      {PROFESSEURS.map(p => (
                        <tr key={p.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                          <td style={{ padding:8 }}>{p.prenom} {p.nom}</td>
                          <td style={{ padding:8 }}>{p.email}</td>
                          <td style={{ padding:8 }}>{p.tel}</td>
                          <td style={{ padding:8 }}>{p.specialite}</td>
                          <td style={{ padding:8 }}><span style={{ padding:"2px 8px", borderRadius:10, background:p.statut==="actif"?"#dcfce7":"#fef3c7", color:p.statut==="actif"?"#166534":"#92400e" }}>{p.statut==="actif"?"Actif":"En congé"}</span></td>
                          <td style={{ padding:8 }}>{p.coursEnCharge.join(", ")}</td>
                          <td style={{ padding:8 }}>{formatMoney(p.salaire)}</td>
                          <td style={{ padding:8 }}><button onClick={()=>toast.success(`Modifier ${p.nom}`)} style={{ padding:"4px 8px", background:BET_LIGHT, color:BET_DARK, border:"none", borderRadius:4, cursor:"pointer" }}>✏️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. APPRENANTS */}
            {activeTab === "apprenants" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>👩‍🎓 Liste des apprenants</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{APPRENANTS.length} inscrits</p></div>
                  <button onClick={()=>toast.success("Ajouter un apprenant")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Nouvel apprenant</button>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                  <input type="text" placeholder="🔍 Nom ou email..." value={searchApprenant} onChange={e=>setSearchApprenant(e.target.value)} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:200 }} />
                  <select value={filtreNiveau} onChange={e=>setFiltreNiveau(e.target.value)} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13 }}>
                    <option value="Tous">Tous niveaux</option><option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option><option value="B2">B2</option><option value="C1">C1</option><option value="C2">C2</option>
                  </select>
                  <select value={filtreStatutApp} onChange={e=>setFiltreStatutApp(e.target.value)} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13 }}>
                    <option value="Tous">Tous statuts</option><option value="actif">Actif</option><option value="inactif">Inactif</option>
                  </select>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                      <th>Nom</th><th>Email</th><th>Téléphone</th><th>Niveau</th><th>Progression</th><th>Assiduité</th><th>Entreprise</th><th>Statut</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                      {apprenantsFiltres.map(a => (
                        <tr key={a.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                          <td style={{ padding:8 }}>{a.nom}</td>
                          <td style={{ padding:8 }}>{a.email}</td>
                          <td style={{ padding:8 }}>{a.tel}</td>
                          <td style={{ padding:8 }}><span style={{ padding:"2px 6px", borderRadius:10, background:"#ede9fe", color:"#5b21b6" }}>{a.niveau}</span></td>
                          <td style={{ padding:8 }}><div style={{ width:80 }}><ProgressBar value={a.progression} color={BET_COLOR} height={6} /></div><span style={{ fontSize:11, marginLeft:4 }}>{a.progression}%</span></td>
                          <td style={{ padding:8 }}>{a.assiduite}%</td>
                          <td style={{ padding:8 }}>{a.entreprise}</td>
                          <td style={{ padding:8 }}><span style={{ padding:"2px 8px", borderRadius:10, background:a.statut==="actif"?"#dcfce7":"#fef3c7", color:a.statut==="actif"?"#166534":"#92400e" }}>{a.statut==="actif"?"Actif":"Inactif"}</span></td>
                          <td style={{ padding:8 }}><button onClick={()=>toast.success(`Détails de ${a.nom}`)} style={{ padding:"4px 8px", background:BET_LIGHT, color:BET_DARK, border:"none", borderRadius:4, cursor:"pointer" }}>Voir</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. PRÉSENCES */}
            {activeTab === "presences" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📋 Gestion des présences</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Absences et présences des apprenants</p></div>
                  <button onClick={()=>toast.success("Ajouter une présence")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Pointer</button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                      <th>Apprenant</th><th>Date</th><th>Session</th><th>Présent</th><th>Retard</th><th>Justifié</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                      {PRESENCES.map(p => (
                        <tr key={p.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                          <td style={{ padding:8 }}>{p.apprenant}</td>
                          <td style={{ padding:8 }}>{formatDate(p.date)}</td>
                          <td style={{ padding:8 }}>{p.session}</td>
                          <td style={{ padding:8 }}>{p.present ? "✅" : "❌"}</td>
                          <td style={{ padding:8 }}>{p.retard ? "🟡" : "-"}</td>
                          <td style={{ padding:8 }}>{p.justifie ? "✓" : "-"}</td>
                          <td style={{ padding:8 }}><button onClick={()=>toast.success("Modifier présence")} style={{ padding:"4px 8px", background:BET_LIGHT, color:BET_DARK, border:"none", borderRadius:4, cursor:"pointer" }}>✏️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. EMPLOYÉS BET */}
            {activeTab === "employes" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🏢 Employés BET</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Personnel interne et salaires</p></div>
                  <button onClick={()=>toast.success("Ajouter un employé")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Nouvel employé</button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                      <th>Nom</th><th>Poste</th><th>Email</th><th>Téléphone</th><th>Salaire base</th><th>Date embauche</th><th>Statut</th><th>Paiement mois</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                      {EMPLOYES_BET.map(e => (
                        <tr key={e.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                          <td style={{ padding:8 }}>{e.prenom} {e.nom}</td>
                          <td style={{ padding:8 }}>{e.poste}</td>
                          <td style={{ padding:8 }}>{e.email}</td>
                          <td style={{ padding:8 }}>{e.tel}</td>
                          <td style={{ padding:8 }}>{formatMoney(e.salaireBase)}</td>
                          <td style={{ padding:8 }}>{formatDate(e.dateEmbauche)}</td>
                          <td style={{ padding:8 }}><span style={{ padding:"2px 8px", borderRadius:10, background:e.statut==="actif"?"#dcfce7":"#fef3c7", color:e.statut==="actif"?"#166534":"#92400e" }}>{e.statut==="actif"?"Actif":"Inactif"}</span></td>
                          <td style={{ padding:8 }}>{e.paiements[0]?.montant?formatMoney(e.paiements[0].montant):"-"}<br/><span style={{ fontSize:10, color:e.paiements[0]?.statut==="payé"?"#22c55e":"#f59e0b" }}>{e.paiements[0]?.statut}</span></td>
                          <td style={{ padding:8 }}><button onClick={()=>toast.success(`Gérer ${e.nom}`)} style={{ padding:"4px 8px", background:BET_LIGHT, color:BET_DARK, border:"none", borderRadius:4, cursor:"pointer" }}>📄</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. CERTIFICATIONS */}
            {activeTab === "certifications" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🏅 Certifications délivrées</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Apprenants certifiés</p></div>
                  <button onClick={()=>toast.success("Délivrer une certification")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Nouvelle certification</button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                      <th>Apprenant</th><th>Certification</th><th>Score</th><th>Date obtention</th><th>Niveau</th><th>Statut</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                      {CERTIFICATIONS.map(c => (
                        <tr key={c.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                          <td style={{ padding:8 }}>{c.apprenant}</td>
                          <td style={{ padding:8 }}>{c.certification}</td>
                          <td style={{ padding:8 }}>{c.score}</td>
                          <td style={{ padding:8 }}>{formatDate(c.dateObtention)}</td>
                          <td style={{ padding:8 }}>{c.niveau}</td>
                          <td style={{ padding:8 }}><span style={{ padding:"2px 8px", borderRadius:10, background:"#dcfce7", color:"#166534" }}>Valide</span></td>
                          <td style={{ padding:8 }}><button onClick={()=>toast.success("Télécharger certificat")} style={{ padding:"4px 8px", background:BET_LIGHT, color:BET_DARK, border:"none", borderRadius:4, cursor:"pointer" }}>⬇️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. EXAMENS & RÉSULTATS */}
            {activeTab === "examens" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📝 Examens & Résultats</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Examens programmés par les coachs et résultats des apprenants</p></div>
                  <button onClick={()=>toast.success("Examen créé")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Nouvel examen</button>
                </div>

                {/* Sub-tabs */}
                <div style={{ display:"flex", gap:4, marginBottom:20, borderBottom:"2px solid #e5e7eb" }}>
                  {[{key:"examens",label:"📋 Examens programmés"},{key:"resultats",label:"📊 Résultats"}].map(t=>(
                    <button key={t.key} onClick={()=>setExamSubTab(t.key)} style={{ padding:"9px 18px", border:"none", cursor:"pointer", fontWeight:600, fontSize:13, background:"none", color:examSubTab===t.key?BET_COLOR:"#9ca3af", borderBottom:`2px solid ${examSubTab===t.key?BET_COLOR:"transparent"}`, marginBottom:-2 }}>{t.label}</button>
                  ))}
                </div>

                {examSubTab === "examens" && (
                  <div>
                    {/* KPIs */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                      <StatCard label="Examens planifiés" value={EXAMENS_COACHES.length} color={BET_COLOR} icon="📝" />
                      <StatCard label="Participants total" value={EXAMENS_COACHES.reduce((a,e)=>a+e.nbParticipants,0)} color="#059669" icon="👥" />
                      <StatCard label="Coachs impliqués" value={[...new Set(EXAMENS_COACHES.map(e=>e.coach))].length} color="#8b5cf6" icon="👨‍🏫" />
                      <StatCard label="Modules évalués" value={[...new Set(EXAMENS_COACHES.map(e=>e.module))].length} color="#f59e0b" icon="📚" />
                    </div>
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                          {["Titre","Coach","Module","Classe","Date","Heure","Durée","Inscrits","Type","Statut","Action"].map(h=><th key={h} style={{ padding:"10px 8px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {EXAMENS_COACHES.map(e => {
                            const typeColors = { blanc:"#dbeafe,#1d4ed8", module:"#fef3c7,#92400e", quiz:"#d1fae5,#065f46", final:"#fee2e2,#991b1b" };
                            const [bg,c] = (typeColors[e.type]||"#f3f4f6,#374151").split(",");
                            return (
                              <tr key={e.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                                <td style={{ padding:"10px 8px", fontWeight:600 }}>{e.titre}</td>
                                <td style={{ padding:"10px 8px" }}>{e.coach}</td>
                                <td style={{ padding:"10px 8px", color:"#6b7280" }}>{e.module}</td>
                                <td style={{ padding:"10px 8px" }}>{e.classe}</td>
                                <td style={{ padding:"10px 8px" }}>{formatDate(e.date)}</td>
                                <td style={{ padding:"10px 8px" }}>{e.heure}</td>
                                <td style={{ padding:"10px 8px" }}>{e.duree} min</td>
                                <td style={{ padding:"10px 8px" }}><span style={{ fontWeight:700, color:e.nbParticipants>=e.placesMax?"#dc2626":BET_COLOR }}>{e.nbParticipants}/{e.placesMax}</span></td>
                                <td style={{ padding:"10px 8px" }}><span style={{ padding:"2px 8px", borderRadius:10, background:bg, color:c, fontSize:11, fontWeight:600 }}>{e.type}</span></td>
                                <td style={{ padding:"10px 8px" }}><span style={{ padding:"2px 8px", borderRadius:10, background:"#fef3c7", color:"#92400e", fontSize:11 }}>planifié</span></td>
                                <td style={{ padding:"10px 8px" }}><button onClick={()=>toast.success(`Gérer ${e.titre}`)} style={{ padding:"4px 8px", background:BET_LIGHT, color:BET_DARK, border:"none", borderRadius:4, cursor:"pointer" }}>✏️</button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {examSubTab === "resultats" && (
                  <div>
                    {/* KPIs */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                      <StatCard label="Résultats enregistrés" value={RESULTATS_COACHES.length} color={BET_COLOR} icon="📊" />
                      <StatCard label="Score moyen" value={`${Math.round(RESULTATS_COACHES.reduce((a,r)=>a+r.pct,0)/RESULTATS_COACHES.length)}%`} color="#059669" icon="🎯" />
                      <StatCard label="Réussis" value={RESULTATS_COACHES.filter(r=>r.statut==="réussi").length} color="#22c55e" icon="✅" />
                      <StatCard label="Insuffisants" value={RESULTATS_COACHES.filter(r=>r.statut==="insuffisant").length} color="#dc2626" icon="⚠️" />
                    </div>
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                          {["Apprenant","Examen","Coach","Score","Résultat","Date","Commentaire"].map(h=><th key={h} style={{ padding:"10px 8px", textAlign:"left" }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {RESULTATS_COACHES.map(r => (
                            <tr key={r.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                              <td style={{ padding:"10px 8px", fontWeight:600 }}>{r.apprenant}</td>
                              <td style={{ padding:"10px 8px" }}>{r.examen}</td>
                              <td style={{ padding:"10px 8px", color:"#6b7280" }}>{r.coach}</td>
                              <td style={{ padding:"10px 8px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                  <span style={{ fontWeight:700, color:r.pct>=70?"#059669":"#dc2626" }}>{r.score}/{r.maxScore}</span>
                                  <div style={{ flex:1, minWidth:60 }}><ProgressBar value={r.pct} color={r.pct>=70?"#22c55e":"#ef4444"} height={5} /></div>
                                  <span style={{ fontSize:11, color:"#6b7280" }}>{r.pct}%</span>
                                </div>
                              </td>
                              <td style={{ padding:"10px 8px" }}><span style={{ padding:"2px 8px", borderRadius:10, background:r.statut==="réussi"?"#dcfce7":"#fee2e2", color:r.statut==="réussi"?"#166534":"#991b1b", fontSize:11, fontWeight:600 }}>{r.statut==="réussi"?"✅ Réussi":"⚠️ Insuffisant"}</span></td>
                              <td style={{ padding:"10px 8px" }}>{formatDate(r.date)}</td>
                              <td style={{ padding:"10px 8px", color:"#6b7280" }}>{r.commentaire}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 9. RESSOURCES */}
            {activeTab === "modules" && (() => {
              const typeIcon = { Tous:"📁", pdf:"📄", audio:"🎧", video:"🎬", document:"📝", exercice:"✏️" };
              const typeLabel = { Tous:"Tous", pdf:"PDF", audio:"Audio", video:"Vidéo", document:"Document", exercice:"Exercice" };
              const typeColor = { pdf:"#fee2e2,#dc2626", audio:"#fef3c7,#92400e", video:"#ede9fe,#7c3aed", document:"#dbeafe,#1d4ed8", exercice:"#d1fae5,#065f46" };
              return (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📚 Ressources partagées</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Ressources partagées par les coachs — PDF, audio, vidéo et plus</p></div>
                  <button onClick={()=>toast.success("Ressource ajoutée")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Ajouter une ressource</button>
                </div>

                {/* Type filter pills */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                  {Object.entries(typeLabel).map(([k,l]) => {
                    const active = filtreResType === k;
                    return (
                      <button key={k} onClick={()=>setFiltreResType(k)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${active?"transparent":"#e5e7eb"}`, cursor:"pointer", fontWeight:600, fontSize:12, background:active?BET_COLOR:"#fff", color:active?"#fff":"#6b7280", display:"flex", alignItems:"center", gap:5 }}>
                        {typeIcon[k]} {l}
                        {k !== "Tous" && <span style={{ fontSize:10, background:active?"rgba(255,255,255,0.25)":"#f3f4f6", padding:"1px 5px", borderRadius:10 }}>{RESSOURCES_COACHES.filter(r=>r.type===k).length}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Module filter */}
                <div style={{ display:"flex", gap:10, marginBottom:20, alignItems:"center" }}>
                  <select value={filtreResModule} onChange={e=>setFiltreResModule(e.target.value)} style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #d1d5db", fontSize:13, background:"#fff" }}>
                    <option value="Tous">📚 Tous les modules</option>
                    {[...new Set(RESSOURCES_COACHES.map(r=>r.module))].map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  {(filtreResType!=="Tous"||filtreResModule!=="Tous")&&<button onClick={()=>{setFiltreResType("Tous");setFiltreResModule("Tous");}} style={{ padding:"8px 12px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>✕ Réinitialiser</button>}
                  <span style={{ fontSize:12, color:"#9ca3af", marginLeft:"auto" }}>{ressourcesFiltres.length} ressource(s)</span>
                </div>

                {/* Cards grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:16 }}>
                  {ressourcesFiltres.map(r => {
                    const [bg,c] = (typeColor[r.type]||"#f3f4f6,#374151").split(",");
                    return (
                      <div key={r.id} style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:16, background:"#fff", display:"flex", flexDirection:"column", gap:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <span style={{ fontSize:28 }}>{typeIcon[r.type]}</span>
                          <span style={{ padding:"3px 10px", borderRadius:20, background:bg, color:c, fontSize:11, fontWeight:700 }}>{typeLabel[r.type]}</span>
                        </div>
                        <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{r.titre}</div>
                        <div style={{ fontSize:12, color:"#6b7280" }}>📚 {r.module}</div>
                        <div style={{ fontSize:12, color:"#9ca3af" }}>👨‍🏫 {r.coach} · {r.taille||r.duree}</div>
                        <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5, flexGrow:1 }}>{r.desc}</div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
                          <span style={{ fontSize:11, color:"#9ca3af" }}>📅 {formatDate(r.date)}</span>
                          <button onClick={()=>toast.success(`Téléchargement de "${r.titre}"`)} style={{ padding:"6px 12px", background:BET_LIGHT, color:BET_DARK, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>📥 Télécharger</button>
                        </div>
                      </div>
                    );
                  })}
                  {ressourcesFiltres.length === 0 && (
                    <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"#9ca3af" }}>
                      <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
                      <div style={{ fontWeight:600 }}>Aucune ressource pour ces filtres</div>
                    </div>
                  )}
                </div>
              </div>
              );
            })()}

            {/* 10. ÉVALUATIONS PROGRAMMÉES */}
            {activeTab === "evaluations" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📋 Évaluations programmées</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Planning des contrôles et examens</p></div>
                  <button onClick={()=>toast.success("Programmer une évaluation")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Programmer</button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                      <th>Titre</th><th>Module</th><th>Date</th><th>Durée</th><th>Coefficient</th><th>Statut</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                      {EVALUATIONS_PROGRAMMEES.map(e => (
                        <tr key={e.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                          <td style={{ padding:8 }}>{e.titre}</td>
                          <td style={{ padding:8 }}>{e.module}</td>
                          <td style={{ padding:8 }}>{formatDate(e.date)}</td>
                          <td style={{ padding:8 }}>{e.duree} min</td>
                          <td style={{ padding:8 }}>{e.coefficient}</td>
                          <td style={{ padding:8 }}><span style={{ padding:"2px 8px", borderRadius:10, background:"#fef3c7", color:"#92400e" }}>{e.statut}</span></td>
                          <td style={{ padding:8 }}><button onClick={()=>toast.success(`Modifier ${e.titre}`)} style={{ padding:"4px 8px", background:BET_LIGHT, color:BET_DARK, border:"none", borderRadius:4, cursor:"pointer" }}>✏️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 11. NOTIFICATIONS / CHAT */}
            {activeTab === "notifications" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>💬 Messagerie BET</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Échangez avec les coachs et les apprenants</p></div>
                  <span style={{ fontSize:12, color:"#9ca3af" }}>{conversations.reduce((a,c)=>a+c.unread,0)} message(s) non lu(s)</span>
                </div>
                <div style={{ display:"flex", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden", height:560 }}>

                  {/* Left – conversation list */}
                  <div style={{ width:280, borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", background:"#fafafa" }}>
                    <div style={{ padding:"10px 12px", borderBottom:"1px solid #e5e7eb" }}>
                      <input placeholder="🔍 Rechercher…" style={{ width:"100%", padding:"7px 10px", borderRadius:6, border:"1px solid #d1d5db", fontSize:12 }} />
                    </div>
                    <div style={{ overflowY:"auto", flex:1 }}>
                      {conversations.map(conv => (
                        <div key={conv.id} onClick={()=>setActiveConv(conv.id)} style={{ padding:"12px 14px", cursor:"pointer", background:activeConv===conv.id?BET_LIGHT:"transparent", borderBottom:"1px solid #f1f5f9", display:"flex", gap:10, alignItems:"center" }}>
                          <div style={{ flexShrink:0, width:40, height:40, borderRadius:"50%", background:conv.color+"20", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:conv.color }}>{conv.avatar}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{conv.nom}</span>
                              <span style={{ fontSize:10, color:"#9ca3af" }}>{conv.lastTime}</span>
                            </div>
                            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:1 }}>{conv.role}</div>
                            <div style={{ fontSize:11, color:"#6b7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{conv.lastMsg}</div>
                          </div>
                          {conv.unread > 0 && <span style={{ flexShrink:0, background:BET_COLOR, color:"#fff", borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700 }}>{conv.unread}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right – chat view */}
                  {(() => {
                    const conv = conversations.find(c => c.id === activeConv);
                    if (!conv) return null;
                    return (
                      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
                        {/* Header */}
                        <div style={{ padding:"12px 16px", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", gap:12, background:"#fff" }}>
                          <div style={{ width:38, height:38, borderRadius:"50%", background:conv.color+"20", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:conv.color }}>{conv.avatar}</div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{conv.nom}</div>
                            <div style={{ fontSize:11, color:"#9ca3af" }}>{conv.role}</div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:8, background:"#f8fafc" }}>
                          {conv.messages.map(msg => (
                            <div key={msg.id} style={{ display:"flex", justifyContent:msg.from==="me"?"flex-end":"flex-start" }}>
                              <div style={{ maxWidth:"72%", padding:"9px 13px", borderRadius:msg.from==="me"?"14px 14px 2px 14px":"14px 14px 14px 2px", background:msg.from==="me"?BET_COLOR:"#fff", color:msg.from==="me"?"#fff":"#374151", fontSize:13, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
                                {msg.text}
                                <div style={{ fontSize:10, color:msg.from==="me"?"rgba(255,255,255,0.65)":"#9ca3af", textAlign:"right", marginTop:4 }}>{msg.time}</div>
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Input bar */}
                        <div style={{ padding:"10px 14px", borderTop:"1px solid #e5e7eb", display:"flex", gap:8, background:"#fff" }}>
                          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsgLocal();}}} placeholder="Écrire un message…" style={{ flex:1, padding:"9px 12px", borderRadius:8, border:"1px solid #d1d5db", fontSize:13, outline:"none" }} />
                          <button onClick={sendMsgLocal} style={{ padding:"9px 18px", background:chatInput.trim()?BET_COLOR:"#e5e7eb", color:chatInput.trim()?"#fff":"#9ca3af", border:"none", borderRadius:8, cursor:chatInput.trim()?"pointer":"default", fontWeight:700, fontSize:13 }}>Envoyer</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TEST DE NIVEAU */}
            {activeTab === "tests_niveau" && <TestsNiveauTab />}

            {/* MESSAGES */}
            {activeTab === "messages" && <MessagerieTab />}

            {/* 12. PROFIL ADMIN */}
            {activeTab === "profiladmin" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>👤 Mon profil administrateur</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Informations personnelles et accès</p></div>
                  <button onClick={()=>toast.success("Modifier le profil")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>✏️ Modifier</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
                      <AvatarUpload
                        currentUrl={profil?.avatar_url || null}
                        nom={nomComplet}
                        size={64}
                        onSuccess={(file) => {
                          const updated = { ...profil, avatar_url: file.url };
                          localStorage.setItem("admin_profil", JSON.stringify(updated));
                          toast.success("Photo de profil mise à jour ✓");
                        }}
                      />
                      <div><h3 style={{ margin:0, fontSize:16, fontWeight:700 }}>{nomComplet}</h3><RoleBadge role={profil?.role || profil?.profil_type || "admin"}/></div>
                    </div>
                    <div style={{ marginBottom:12 }}><strong>Email :</strong> {profil?.email || "—"}</div>
                    <div style={{ marginBottom:12 }}><strong>Téléphone :</strong> {profil?.telephone || profil?.tel || "—"}</div>
                    <div style={{ marginBottom:12 }}><strong>Rôle :</strong> {profil?.role || profil?.profil_type || "admin"}</div>
                    <div><strong>Statut :</strong> {profil?.actif !== false ? "Actif" : "Inactif"}</div>
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Actions rapides</h3>
                    <button onClick={()=>setActiveTab("permissions")} style={{ width:"100%", marginBottom:8, ...btnSecondary }}>🔐 Gérer les droits</button>
                    <button onClick={()=>setActiveTab("utilisateurs")} style={{ width:"100%", marginBottom:8, ...btnSecondary }}>👥 Gérer les utilisateurs</button>
                    <button onClick={()=>toast.success("Journal d'audit exporté")} style={{ width:"100%", ...btnSecondary }}>📜 Exporter l'audit</button>
                  </div>
                </div>
              </div>
            )}

            

          </div>
        </div>

        {/* MODALES (invitation, utilisateur, révocation, clone, demande) */}
        {showInviteModal && (
          <Modal title="Inviter un administrateur" subtitle="L'utilisateur recevra un email avec ses accès" onClose={()=>setShowInviteModal(false)}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Nom complet *</label><input value={inviteForm.nom} onChange={e=>setInviteForm({...inviteForm,nom:e.target.value})} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%" }} placeholder="Prénom Nom"/></div>
              <div><label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Email *</label><input type="email" value={inviteForm.email} onChange={e=>setInviteForm({...inviteForm,email:e.target.value})} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%" }} placeholder="email@domaine.ci"/></div>
            </div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Rôle à attribuer *</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {Object.values(ROLES_DEF).filter(r=>r.id!=="super_admin").map(r=>(
                <div key={r.id} onClick={()=>setInviteForm({...inviteForm,role:r.id})} style={{ padding:"12px 14px", borderRadius:10, border:`2px solid ${inviteForm.role===r.id?r.color:"#e5e7eb"}`, background:inviteForm.role===r.id?r.color+"08":"#fff", cursor:"pointer" }}>
                  <div style={{ fontWeight:700, color:inviteForm.role===r.id?r.color:"#0f172a", fontSize:14 }}>{r.emoji} {r.label}</div><div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>{r.description.slice(0,60)}…</div>
                </div>
              ))}
            </div>
            {/* Centre — obligatoire pour le rôle "commercial" */}
            {inviteForm.role === "commercial" && (
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#dc2626", marginBottom:4 }}>🏢 Centre BET attribué *</label>
                <select value={inviteForm.centre_id} onChange={e=>setInviteForm({...inviteForm,centre_id:e.target.value})}
                  style={{ padding:9, borderRadius:6, border:`2px solid ${inviteForm.centre_id?"#1e3a8a":"#fca5a5"}`, fontSize:13, width:"100%", cursor:"pointer", background:"#fff" }}>
                  <option value="">— Choisir le centre —</option>
                  {BET_CENTRES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <div style={{ fontSize:11, color:"#64748b", marginTop:4 }}>La conseillère n'apparaîtra que pour les prospects de ce centre.</div>
              </div>
            )}
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Accès temporaire (optionnel)</label>
            <input type="date" value={inviteForm.accessTemp} onChange={e=>setInviteForm({...inviteForm,accessTemp:e.target.value})} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%", marginBottom:8 }} min={new Date().toISOString().split("T")[0]}/>
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:-4, marginBottom:12 }}>Laissez vide pour un accès permanent.</div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Message personnalisé (optionnel)</label>
            <textarea value={inviteForm.note} onChange={e=>setInviteForm({...inviteForm,note:e.target.value})} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%", minHeight:60, resize:"vertical", marginBottom:12 }} placeholder="Message à inclure dans l'email d'invitation…"/>
            <div style={{ padding:"10px 14px", borderRadius:8, background:"#f0f9ff", border:"1px solid #bae6fd", fontSize:12, color:BET_COLOR, marginBottom:16 }}>📧 Un email avec un lien d'activation sera envoyé à <strong>{inviteForm.email||"l'adresse saisie"}</strong>.</div>
            <div style={{ display:"flex", gap:10 }}><button onClick={sendInvite} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>📨 Envoyer l'invitation</button><button onClick={()=>setShowInviteModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Annuler</button></div>
          </Modal>
        )}

        {showUserModal && editingUser && (
          <Modal title={`Modifier — ${editingUser.nom}`} subtitle="Modifier le rôle et les paramètres de cet utilisateur" onClose={()=>setShowUserModal(false)}>
            <div style={{ display:"flex", gap:14, padding:"12px 16px", borderRadius:10, background:`${ROLES_DEF[editingUser.role]?.bg}`, border:`1px solid ${ROLES_DEF[editingUser.role]?.border}`, marginBottom:18, alignItems:"center" }}>
              <AvatarUpload
                currentUrl={editingUser.avatar_url || null}
                nom={editingUser.nom || ""}
                size={52}
                onSuccess={(file) => setEditingUser(u => ({ ...u, avatar_url: file.url }))}
              />
              <div><div style={{ fontWeight:700, fontSize:15 }}>{editingUser.nom}</div><div style={{ fontSize:12, color:"#9ca3af" }}>{editingUser.email}</div><div style={{ marginTop:5 }}><RoleBadge role={editingUser.role}/></div></div>
            </div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Changer le rôle</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {Object.values(ROLES_DEF).filter(r=>r.id!=="super_admin").map(r=>(
                <div key={r.id} onClick={()=>setEditingUser({...editingUser,role:r.id})} style={{ padding:"10px 12px", borderRadius:9, border:`2px solid ${editingUser.role===r.id?r.color:"#e5e7eb"}`, background:editingUser.role===r.id?r.color+"08":"#fff", cursor:"pointer" }}>
                  <div style={{ fontWeight:700, fontSize:13, color:editingUser.role===r.id?r.color:"#374151" }}>{r.emoji} {r.label}</div>
                </div>
              ))}
            </div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Accès temporaire</label>
            <input type="date" value={editingUser.accessTemp||""} onChange={e=>setEditingUser({...editingUser,accessTemp:e.target.value||null})} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%", marginBottom:14 }}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e5e7eb" }}><span style={{ fontSize:13, fontWeight:500 }}>2FA activé</span><ToggleSwitch on={editingUser.twofa} onChange={v=>setEditingUser({...editingUser,twofa:v})} color={BET_COLOR}/></div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e5e7eb" }}><span style={{ fontSize:13, fontWeight:500 }}>Restr. IP</span><ToggleSwitch on={editingUser.ipRestr} onChange={v=>setEditingUser({...editingUser,ipRestr:v})} color={BET_COLOR}/></div>
            </div>
            <div style={{ display:"flex", gap:10 }}><button onClick={()=>{ const old=users.find(u=>u.id===editingUser.id); setUsers(users.map(u=>u.id===editingUser.id?editingUser:u)); if(old.role!==editingUser.role) addAuditEntry("ROLE_MODIFIE",`${editingUser.nom} : ${old.role} → ${editingUser.role}`); toast.success("Modifications enregistrées ✓"); setShowUserModal(false); }} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>💾 Enregistrer</button><button onClick={()=>setShowUserModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Annuler</button></div>
          </Modal>
        )}

        {showRevokeModal && userToRevoke && (
          <Modal title="Révoquer les sessions" subtitle="Cette action déconnectera l'utilisateur immédiatement" onClose={()=>setShowRevokeModal(false)} danger>
            <div style={{ textAlign:"center", padding:"16px 0" }}><div style={{ fontSize:48, marginBottom:12 }}>⚠️</div><p style={{ fontSize:14, color:"#374151", lineHeight:1.7 }}>Vous êtes sur le point de déconnecter <strong>{userToRevoke.nom}</strong> ({ROLES_DEF[userToRevoke.role]?.label}) de toutes ses sessions actives ({userToRevoke.sessions} session(s)).</p><p style={{ fontSize:13, color:"#9ca3af", marginTop:8 }}>L'utilisateur devra se reconnecter pour continuer.</p></div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:16 }}><button onClick={()=>revokeSession(userToRevoke.id)} style={{ padding:"9px 16px", background:BET_RED, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>🔌 Révoquer les sessions</button><button onClick={()=>setShowRevokeModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Annuler</button></div>
          </Modal>
        )}

        {showCloneModal && (
          <Modal title="Cloner des permissions" subtitle="Copier la matrice de permissions d'un rôle vers un autre" onClose={()=>setShowCloneModal(false)}>
            <div style={{ padding:"12px 16px", borderRadius:10, background:"#fff7ed", border:"1px solid #fed7aa", fontSize:13, color:"#92400e", marginBottom:18 }}>⚠️ Cette action remplacera toutes les permissions du rôle cible. L'action est irréversible (sauf sauvegarde manuelle).</div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Rôle source (copier de…)</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>{Object.values(ROLES_DEF).map(r=><div key={r.id} onClick={()=>setCloneForm({...cloneForm,source:r.id})} style={{ padding:"10px 12px", borderRadius:9, border:`2px solid ${cloneForm.source===r.id?r.color:"#e5e7eb"}`, background:cloneForm.source===r.id?r.color+"08":"#fff", cursor:"pointer" }}><div style={{ fontWeight:700, fontSize:13, color:cloneForm.source===r.id?r.color:"#374151" }}>{r.emoji} {r.label}</div></div>)}</div>
            <div style={{ textAlign:"center", fontSize:22, marginBottom:14 }}>↓</div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Rôle cible (coller vers…)</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18 }}>{Object.values(ROLES_DEF).filter(r=>r.id!=="super_admin").map(r=><div key={r.id} onClick={()=>setCloneForm({...cloneForm,cible:r.id})} style={{ padding:"10px 12px", borderRadius:9, border:`2px solid ${cloneForm.cible===r.id?r.color:"#e5e7eb"}`, background:cloneForm.cible===r.id?r.color+"08":"#fff", cursor:"pointer", opacity:cloneForm.source===r.id?0.35:1 }}><div style={{ fontWeight:700, fontSize:13, color:cloneForm.cible===r.id?r.color:"#374151" }}>{r.emoji} {r.label}</div></div>)}</div>
            <div style={{ display:"flex", gap:10 }}><button onClick={clonePermissions} disabled={cloneForm.source===cloneForm.cible} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12, opacity:cloneForm.source===cloneForm.cible?0.5:1 }}>📋 Cloner les permissions</button><button onClick={()=>setShowCloneModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Annuler</button></div>
          </Modal>
        )}

        {showDemandeModal && selectedDemande && (
          <Modal title="Détail de la demande" subtitle={`Demande de ${selectedDemande.nom}`} onClose={()=>setShowDemandeModal(false)}>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[{ l:"Nom complet", v:selectedDemande.nom },{ l:"Email", v:selectedDemande.email },{ l:"Entreprise", v:selectedDemande.entreprise },{ l:"Rôle demandé", v:<RoleBadge role={selectedDemande.roleDemande}/> },{ l:"Date demande", v:fmtDate(selectedDemande.date) }].map(row=>(
                <div key={row.l} style={{ display:"flex", gap:16, padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}><span style={{ width:140, fontSize:12, fontWeight:600, color:"#9ca3af", flexShrink:0 }}>{row.l}</span><span style={{ fontSize:13, color:"#374151" }}>{row.v}</span></div>
              ))}
            </div>
            <div style={{ marginTop:14, padding:"12px 16px", borderRadius:10, background:"#f8fafc", fontSize:13, color:"#374151", lineHeight:1.7 }}>💬 <strong>Justification :</strong> {selectedDemande.justification}</div>
            {selectedDemande.statut==="en_attente"&&<div style={{ display:"flex", gap:10, marginTop:16 }}><button onClick={()=>handleDemande(selectedDemande.id,"approuver")} style={{ ...btnPrimary, flex:1, textAlign:"center", background:"#22c55e" }}>✅ Approuver</button><button onClick={()=>handleDemande(selectedDemande.id,"refuser")} style={{ ...btnSecondary, flex:1, textAlign:"center", color:BET_RED }}>❌ Refuser</button></div>}
          </Modal>
        )}

      </div>
    </div>
  );
}

/* ═══ STYLES COMPLÉMENTAIRES ═══ */
const btnPrimary = { padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnSecondary = { padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };