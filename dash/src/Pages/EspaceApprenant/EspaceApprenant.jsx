// src/Pages/EspaceApprenant/EspaceApprenant.jsx
// Route : <Route path="/espace-apprenant" element={<EspaceApprenant />} />

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

/* ═══════════════════════════════════════════════════════
   CONSTANTES (NOUVELLE CHARTE)
═══════════════════════════════════════════════════════ */
const PRIMARY_COLOR    = "#dc2626";   // Rouge principal
const PRIMARY_DARK     = "#1e3a8a";   // Bleu foncé
const PRIMARY_LIGHT    = "#fef2f2";   // Rouge très clair
const GRADIENT_HEADER  = "linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%)";

const NIVEAU_META = {
  A1: { label:"Débutant",           color:"#6b7280", bg:"#f3f4f6" },
  A2: { label:"Élémentaire",        color:"#d97706", bg:"#fef3c7" },
  B1: { label:"Intermédiaire",      color:"#2563eb", bg:"#dbeafe" },
  B2: { label:"Interm. supérieur",  color:"#7c3aed", bg:"#ede9fe" },
  C1: { label:"Avancé",             color:"#059669", bg:"#dcfce7" },
  C2: { label:"Maîtrise",           color:"#dc2626", bg:"#fee2e2" },
};

const STATUT_COURS = {
  en_cours:  { label:"En cours",   bg:"#dbeafe", c:"#1e40af" },
  termine:   { label:"Terminé",    bg:"#dcfce7", c:"#166534" },
  planifie:  { label:"Planifié",   bg:"#fef3c7", c:"#92400e" },
  pause:     { label:"En pause",   bg:"#f3f4f6", c:"#374151" },
};

const TYPE_RESSOURCE = {
  pdf:       { icon:"📄", label:"PDF",     color:"#dc2626" },
  video:     { icon:"🎬", label:"Vidéo",   color:"#7c3aed" },
  audio:     { icon:"🎧", label:"Audio",   color:"#059669" },
  exercice:  { icon:"✏️", label:"Exercice",color:"#d97706" },
  quiz:      { icon:"❓", label:"Quiz",    color:"#2563eb" },
  lien:      { icon:"🔗", label:"Lien",    color: PRIMARY_COLOR },
};

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK (APPRENANT & NOUVEAUX MODULES)
═══════════════════════════════════════════════════════ */
const MON_PROFIL = {
  id: 1, nom:"Kouamé", prenom:"Aya", email:"k.aya@orange.ci",
  phone:"+225 07 11 22 33", avatar:"KA",
  niveau:"B2", testNiveauResultat:"B2 (score 68/100)",
  entreprise:"Orange CI", poste:"Chef de projet",
  dateInscription:"2025-01-15", objectif:"Atteindre le niveau C1 pour juin 2026",
  progression: 78, assiduiteRate: 94, testScore: 75,
  heuresTotal: 48, heuresRestantes: 22, certifications: 1,
  prochainExamen:"2026-01-20", langueMaternelle:"Français",
  pointsXP: 2340, badge:"🌟 Élève du mois",
  coach: { nom:"Prof. Martin", email:"martin@bet-formation.com" },
  gestionnaire: { nom:"Mme. Diallo", email:"gestion@bet-formation.com" },
  typeCours: "en ligne",
  classe: "B2 Business 2025",
  paiements: [
    { id:"BET-2025-001", date:"2025-01-10", montant:250000, description:"Frais d'inscription",  cours:"Anglais Pro B2", mode:"Virement bancaire", statut:"payé"    },
    { id:"BET-2025-042", date:"2025-04-10", montant:250000, description:"Renouvellement T2",    cours:"Anglais Pro B2", mode:"Orange Money",      statut:"payé"    },
    { id:"BET-2025-078", date:"2025-07-10", montant:250000, description:"Renouvellement T3",    cours:"Anglais Pro B2", mode:"Orange Money",      statut:"payé"    },
    { id:"BET-2025-115", date:"2025-10-10", montant:250000, description:"Renouvellement T4",    cours:"Anglais Pro B2", mode:"—",                 statut:"attente" },
  ],
  notesCoach: [
    { date:"2025-11-20", note:"Très bon investissement en classe. Aya progresse bien à l'oral.", auteur:"Prof. Martin" },
    { date:"2025-12-05", note:"À renforcer la compréhension écrite. Travail supplémentaire conseillé.", auteur:"Prof. Dubois" },
  ]
};

const ONBOARDING_VIDEOS = [
  { id:1, titre:"Présentation du processus BET", duree:"12 min", url:"https://www.youtube.com/embed/dQw4w9WgXcQ", description:"Découvrez le déroulement complet de la formation, du test de niveau à la certification." },
  { id:2, titre:"Modalités d'évaluation", duree:"8 min", url:"https://www.youtube.com/embed/dQw4w9WgXcQ", description:"Comment sont évalués vos compétences : quiz, examens, projets." },
  { id:3, titre:"Parcours jusqu'au certificat", duree:"10 min", url:"https://www.youtube.com/embed/dQw4w9WgXcQ", description:"Les étapes clés pour obtenir votre certificat BET." },
];

const CONTACTS_ADMIN = [
  { id:1, nom:"Assistante en ligne", role:"Assistance technique et pédagogique", tel:"+225 01 23 45 67", email:"assistante@bet-formation.com", disponible:"Lun-Ven 9h-18h" },
  { id:2, nom:"Service clientèle", role:"Facturation, administratif", tel:"+225 01 23 45 68", email:"client@bet-formation.com", disponible:"Lun-Ven 8h-19h" },
  { id:3, nom:"Superviseur pédagogique", role:"Suivi de la qualité", tel:"+225 01 23 45 69", email:"superviseur@bet-formation.com", disponible:"Sur rendez-vous" },
  { id:4, nom:"Manager", role:"Responsable de centre", tel:"+225 01 23 45 70", email:"manager@bet-formation.com", disponible:"Lun-Jeu 9h-17h" },
];

const PRODUITS_BOUTIQUE = [
  { id:1, titre:"Pack TOEIC intensif", type:"Cours", prix:"150 €", image:"🎧", description:"20h de préparation en ligne + 5 examens blancs" },
  { id:2, titre:"Grammaire anglaise complète", type:"Livre", prix:"35 €", image:"📘", description:"Livre électronique (PDF) – 300 pages" },
  { id:3, titre:"Business English Masterclass", type:"Vidéo", prix:"89 €", image:"🎬", description:"10 vidéos HD + exercices interactifs" },
  { id:4, titre:"Coaching individuel (5h)", type:"Service", prix:"250 €", image:"🎤", description:"Séances privées avec un coach BET" },
];

// Données originales inchangées (cours, planning, ressources, résultats, etc.)
const MES_COURS = [
  {
    id:1, titre:"Anglais Professionnel B2", niveau:"B2", formateur:"Prof. Martin",
    progression:82, heures:24, heuresFaites:20, statut:"en_cours",
    prochaineCours:"2025-12-12 09:00", description:"Communication professionnelle avancée, réunions, emails formels.",
    modules:[ {nom:"Réunions d'affaires", done:true}, {nom:"Négociation", done:true}, {nom:"Présentations", done:true}, {nom:"Correspondance", done:false}, {nom:"Rapport écrit", done:false} ],
    color:"#2563eb", emoji:"💼",
  },
  {
    id:2, titre:"Business English", niveau:"B2", formateur:"Prof. Dubois",
    progression:65, heures:16, heuresFaites:10, statut:"en_cours",
    prochaineCours:"2025-12-14 14:00", description:"Vocabulaire économique, finance d'entreprise et leadership.",
    modules:[ {nom:"Finances & Budget", done:true}, {nom:"Marketing", done:true}, {nom:"Leadership", done:false}, {nom:"Stratégie", done:false} ],
    color:"#059669", emoji:"📊",
  },
  {
    id:3, titre:"Préparation TOEIC", niveau:"B2", formateur:"Prof. Smith",
    progression:45, heures:20, heuresFaites:9, statut:"en_cours",
    prochaineCours:"2025-12-18 10:00", description:"Entraînement intensif à l'examen TOEIC — listening & reading.",
    modules:[ {nom:"Listening Part 1-2", done:true}, {nom:"Listening Part 3-4", done:false}, {nom:"Reading Part 5-6", done:false}, {nom:"Reading Part 7", done:false}, {nom:"Examens blancs", done:false} ],
    color:"#7c3aed", emoji:"🏆",
  },
  {
    id:4, titre:"English Fondamentaux A2→B1", niveau:"A2", formateur:"Prof. Dupont",
    progression:100, heures:12, heuresFaites:12, statut:"termine",
    prochaineCours:null, description:"Base solide de la grammaire anglaise et du vocabulaire courant.",
    modules:[ {nom:"Grammaire de base", done:true}, {nom:"Vocabulaire courant", done:true}, {nom:"Expression orale", done:true}, {nom:"Compréhension", done:true} ],
    color:"#d97706", emoji:"📚",
  },
];

const MON_PLANNING = [
  { id:1, titre:"Anglais Professionnel B2",  date:"2025-12-12", heure:"09:00", duree:"2h",   type:"presentiel", salle:"Salle A", formateur:"Prof. Martin", statut:"confirme" },
  { id:2, titre:"Business English",          date:"2025-12-14", heure:"14:00", duree:"2h",   type:"online",     salle:"Zoom",    formateur:"Prof. Dubois", statut:"confirme" },
  { id:3, titre:"TOEIC — Simulation",        date:"2025-12-16", heure:"09:00", duree:"3h",   type:"presentiel", salle:"Salle B", formateur:"Prof. Smith",  statut:"confirme" },
  { id:4, titre:"Préparation TOEIC",         date:"2025-12-18", heure:"10:00", duree:"2h",   type:"online",     salle:"Zoom",    formateur:"Prof. Smith",  statut:"confirme" },
  { id:5, titre:"Anglais Professionnel B2",  date:"2025-12-19", heure:"09:00", duree:"2h",   type:"presentiel", salle:"Salle A", formateur:"Prof. Martin", statut:"a_confirmer" },
  { id:6, titre:"Business English",          date:"2025-12-21", heure:"14:00", duree:"2h",   type:"online",     salle:"Zoom",    formateur:"Prof. Dubois", statut:"confirme" },
];

const MES_RESSOURCES = [
  { id:1,  titre:"Guide de grammaire B2 — PDF complet",              type:"pdf",      cours:"Anglais Pro B2",  taille:"2.4 MB",  date:"2025-11-10", telechargements:3, favori:true  },
  { id:2,  titre:"Webinaire : Réussir vos présentations en anglais", type:"video",    cours:"Anglais Pro B2",  duree:"45 min",   date:"2025-11-15", vu:true,           favori:true  },
  { id:3,  titre:"Vocabulaire Finance & Business — Flashcards",      type:"exercice", cours:"Business English", pages:"50 cartes",date:"2025-11-20", fait:false,        favori:false },
  { id:4,  titre:"Podcast BBC Learning English — Advanced",          type:"audio",    cours:"Anglais Pro B2",  duree:"30 min",   date:"2025-11-22", ecoute:false,      favori:false, audioUrl:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", description:"Compréhension orale niveau avancé. Écoutez et prenez des notes sur les structures grammaticales utilisées." },
  { id:5,  titre:"TOEIC Listening — 200 questions d'entraînement",   type:"exercice", cours:"TOEIC Prep",       pages:"45 pages", date:"2025-11-25", fait:true,         favori:true  },
  { id:6,  titre:"Quiz interactif — Temps verbaux anglais",          type:"quiz",     cours:"Anglais Pro B2",  questions:"20 q", date:"2025-11-28", score:"85%",       favori:false },
  { id:7,  titre:"Vocabulary Builder — Business Idioms",             type:"pdf",      cours:"Business English", taille:"1.1 MB",  date:"2025-12-01", telechargements:1, favori:false },
  { id:8,  titre:"BBC Business English Podcast — Episodes 1–10",     type:"lien",     cours:"Business English", duree:"~5h",      date:"2025-12-03", favori:true  },
  { id:9,  titre:"TOEIC Reading Practice Test — Full Simulation",    type:"exercice", cours:"TOEIC Prep",       pages:"60 pages", date:"2025-12-05", fait:false,        favori:false },
  { id:10, titre:"Expressions idiomatiques — Vidéo 30min",           type:"video",    cours:"Anglais Pro B2",  duree:"32 min",   date:"2025-12-06", vu:false,          favori:false },
];

const MES_RESULTATS = [
  { id:1, titre:"Test de positionnement initial",  cours:"Général",       date:"2025-01-20", score:68, maxScore:100, niveau:"B1", type:"positionnement", commentaire:"Bon niveau de départ, objectif B2 atteint en fin d'année." },
  { id:2, titre:"Évaluation mensuelle — Novembre", cours:"Anglais Pro B2",date:"2025-11-28", score:82, maxScore:100, niveau:"B2", type:"evaluation",     commentaire:"Excellente maîtrise des structures de présentation." },
  { id:3, titre:"Quiz Vocabulaire Business",       cours:"Business Eng.", date:"2025-11-15", score:17, maxScore:20,  niveau:"B2", type:"quiz",           commentaire:"Très bonne performance sur les termes financiers." },
  { id:4, titre:"Simulation TOEIC — Blanc #1",     cours:"TOEIC Prep",   date:"2025-12-02", score:710,maxScore:990, niveau:"B2", type:"examen_blanc",   commentaire:"Score en progression. Travailler la partie Reading Part 7." },
  { id:5, titre:"Simulation TOEIC — Blanc #2",     cours:"TOEIC Prep",   date:"2025-12-09", score:760,maxScore:990, niveau:"B2", type:"examen_blanc",   commentaire:"+50 pts depuis le dernier blanc. Objectif 850 atteignable." },
  { id:6, titre:"Certification English Fondamentaux", cours:"Fondamentaux",date:"2025-06-30",score:89, maxScore:100, niveau:"B1", type:"certification",  commentaire:"Certifié avec mention. Passage réussi en B1." },
];

const MES_CERTIFICATIONS = [
  { id:1, titre:"Certificate of Completion — English A2→B1", cours:"English Fondamentaux", date:"2025-06-30", niveau:"B1", valide:true,  expire:"2027-06-30", score:89 },
];

const MES_OBJECTIFS = [
  { id:1, titre:"Atteindre le score TOEIC 850+",         echeance:"2026-02-28", progression:76, statut:"en_cours"  },
  { id:2, titre:"Maîtriser les présentations pro en EN",  echeance:"2026-01-15", progression:90, statut:"presque"   },
  { id:3, titre:"Certifier le niveau C1",                echeance:"2026-06-30", progression:40, statut:"en_cours"  },
];

const MESSAGES = [
  { id:1, expediteur:"Prof. Martin",  avatar:"PM", date:"2025-12-09", lu:false, objet:"Rappel — Session du 12/12",             message:"Bonjour Aya, n'oubliez pas notre session de jeudi à 9h. Préparez les pages 45–52 du guide.", type:"prof" },
  { id:2, expediteur:"Prof. Smith",   avatar:"PS", date:"2025-12-08", lu:false, objet:"Résultats TOEIC Blanc #2",               message:"Félicitations pour votre progression ! 760/990, vous êtes dans les 80% les plus avancés du groupe.", type:"prof" },
  { id:3, expediteur:"BET Admin",     avatar:"BT", date:"2025-12-06", lu:true,  objet:"Votre planning de décembre",             message:"Votre planning du mois de décembre est disponible. Pensez à confirmer vos sessions.", type:"admin" },
  { id:4, expediteur:"Prof. Dubois",  avatar:"PD", date:"2025-12-01", lu:true,  objet:"Ressources Business English",            message:"J'ai ajouté les flashcards de vocabulaire financier dans votre espace ressources.", type:"prof" },
  { id:5, expediteur:"Mme. Diallo",   avatar:"GS", date:"2025-12-10", lu:false, objet:"⚠️ Rappel paiement — Renouvellement T4", message:"Bonjour Aya, votre paiement du Renouvellement T4 (250 000 FCFA) est en attente depuis le 10/10/2025. Merci de régulariser avant le 20/12/2025 pour éviter une suspension d'accès.", type:"gestionnaire" },
  { id:6, expediteur:"Mme. Diallo",   avatar:"GS", date:"2025-11-28", lu:true,  objet:"✅ Confirmation paiement T3",             message:"Votre paiement du Renouvellement T3 a bien été reçu et validé. Merci de votre confiance. N'hésitez pas à nous contacter pour toute question.", type:"gestionnaire" },
  { id:7, expediteur:"BET Admin",     avatar:"BT", date:"2025-11-25", lu:true,  objet:"📚 Nouvelles ressources disponibles",    message:"De nouvelles ressources ont été ajoutées : TOEIC Listening Practice et BBC Business Podcast Episodes 1–10.", type:"admin" },
];

const MES_EXAMENS = [
  {
    id:1, coursId:1, titre:"Évaluation Module 3 — Présentations Pro",
    cours:"Anglais Professionnel B2", formateur:"Prof. Martin",
    categorie:"evaluation",
    dureeMinutes:20, nbQuestions:10, passingScore:60,
    statut:"disponible", tentatives:0, maxTentatives:2,
    dateOuverture:"2025-12-01", dateFermeture:"2025-12-20",
    description:"Évaluation de votre maîtrise des présentations professionnelles en anglais.",
    questions:[
      { id:1, text:"Which phrase best opens a professional presentation?", options:["Let me start","Good morning everyone, today I'll be presenting…","Hi so I want to talk…","Hey folks!"], correct:"Good morning everyone, today I'll be presenting…", points:1, explanation:"Une présentation pro débute par une salutation formelle et l'annonce claire du sujet." },
      { id:2, text:"How do you signal a transition to the next point?", options:["Okay, next","Moving on to our second point…","And then, um…","So yeah, slide 2"], correct:"Moving on to our second point…", points:1, explanation:"Les connecteurs ('Moving on', 'Turning to') structurent clairement le discours." },
      { id:3, text:"Which expression invites questions at the end?", options:["Are we done?","I'm finished","I'd now welcome any questions you may have.","That's it!"], correct:"I'd now welcome any questions you may have.", points:1, explanation:"Cette formule polie est standard dans les présentations formelles." },
      { id:4, text:"'To sum up' is used to…", options:["Start a new topic","Interrupt someone","Summarize key points","Disagree politely"], correct:"Summarize key points", points:1, explanation:"'To sum up' / 'In summary' introduit la synthèse d'un exposé." },
      { id:5, text:"Which visual aid reference is most professional?", options:["Look at this thing","As you can see in Figure 1, the data shows…","Check this graph","This picture shows stuff"], correct:"As you can see in Figure 1, the data shows…", points:2, explanation:"Référencer précisément les supports visuels est essentiel en présentation formelle." },
      { id:6, text:"How do you handle a question you don't know?", options:["No idea","Not my problem","That's an excellent point — let me get back to you on that.","Don't ask!"], correct:"That's an excellent point — let me get back to you on that.", points:2, explanation:"Reconnaître la question et promettre un suivi est la réponse professionnelle." },
      { id:7, text:"'Bear in mind that…' means:", options:["Forget about it","Please remember that…","In contrast,","On the other hand"], correct:"Please remember that…", points:1, explanation:"'Bear in mind' signifie 'gardez à l'esprit que'." },
      { id:8, text:"Which sentence correctly uses passive voice?", options:["We did the research","The research was conducted over six months.","Someone studied things","I researched it"], correct:"The research was conducted over six months.", points:2, explanation:"La voix passive (was conducted) est fréquente dans les présentations formelles." },
      { id:9, text:"How would you politely disagree?", options:["You're wrong!","I see your point, however I'd argue that…","Nope","Bad idea"], correct:"I see your point, however I'd argue that…", points:2, explanation:"Reconnaître le point de vue adverse avant de nuancer est la clé du désaccord poli." },
      { id:10, text:"Which is the correct formal email subject line?", options:["hey!!","Q3 Results — Follow-up Action Required","sup, meeting?","URGENT READ NOW"], correct:"Q3 Results — Follow-up Action Required", points:2, explanation:"Un objet d'email formel doit être précis et sans ponctuation excessive." },
    ],
  },
  {
    id:2, coursId:2, titre:"Évaluation Module 2 — Marketing & Finance",
    cours:"Business English", formateur:"Prof. Dubois",
    categorie:"evaluation",
    dureeMinutes:15, nbQuestions:8, passingScore:65,
    statut:"disponible", tentatives:0, maxTentatives:2,
    dateOuverture:"2025-12-05", dateFermeture:"2025-12-22",
    description:"Testez votre vocabulaire Business English sur les domaines Finance et Marketing.",
    questions:[
      { id:1, text:"What does 'ROI' stand for?", options:["Return On Investment","Rate Of Increase","Risk Of Inflation","Revenue Over Inventory"], correct:"Return On Investment", points:1, explanation:"ROI mesure la rentabilité d'un investissement." },
      { id:2, text:"'Bottom line' in business means:", options:["The last sentence","Net profit or final result","The lowest price","An underline"], correct:"Net profit or final result", points:1, explanation:"'Bottom line' désigne le résultat net — le profit ou la perte finale." },
      { id:3, text:"Which term describes selling extra products to existing customers?", options:["Cold calling","Cross-selling","Outsourcing","Benchmarking"], correct:"Cross-selling", points:1, explanation:"Le cross-selling consiste à proposer des produits complémentaires." },
      { id:4, text:"A 'stakeholder' is:", options:["A butcher","Anyone with an interest in a business","A stock market investor only","A founder"], correct:"Anyone with an interest in a business", points:1, explanation:"Un stakeholder désigne toute personne affectée par les activités d'une entreprise." },
      { id:5, text:"'Cash flow' refers to:", options:["Cash in a safe","Money moving in and out of a business","The salary budget","Credit card payments"], correct:"Money moving in and out of a business", points:2, explanation:"Le cash flow représente les flux de trésorerie — entrées et sorties d'argent." },
      { id:6, text:"Which phrase means 'to reach an agreement'?", options:["Strike a deal","Break a deal","Fake a deal","Miss a deal"], correct:"Strike a deal", points:1, explanation:"'Strike a deal' est l'expression pour conclure un accord commercial." },
      { id:7, text:"'KPI' stands for:", options:["Key Personnel Index","Key Performance Indicator","Known Price Information","Keynote Presentation Item"], correct:"Key Performance Indicator", points:2, explanation:"Les KPI sont des indicateurs clés de performance." },
      { id:8, text:"What is a 'USP' in marketing?", options:["United Sales Partnership","Unique Selling Proposition","Universal Standard Price","User Service Portal"], correct:"Unique Selling Proposition", points:2, explanation:"La USP différencie un produit de la concurrence." },
    ],
  },
  {
    id:3, coursId:3, titre:"TOEIC Blanc — Simulation complète",
    cours:"Préparation TOEIC", formateur:"Prof. Smith",
    categorie:"examen",
    dureeMinutes:30, nbQuestions:10, passingScore:70,
    statut:"termine", tentatives:2, maxTentatives:2,
    meilleurScore:{ score:8, total:10, pct:80, date:"2025-12-05" },
    dateOuverture:"2025-11-25", dateFermeture:"2025-12-10",
    description:"Simulation d'examen TOEIC — Compréhension écrite et vocabulaire avancé.",
    questions:[
      { id:1, text:"The meeting has been ______ due to the CEO's absence.", options:["cancelled","canceled","cancelling","cancel"], correct:"cancelled", points:1, explanation:"En anglais britannique (TOEIC), 'cancelled' prend deux 'l'." },
      { id:2, text:"Please ______ the attached documents before the meeting.", options:["review","reviews","reviewed","reviewing"], correct:"review", points:1, explanation:"Après 'please' dans un impératif formel, on utilise la base verbale." },
      { id:3, text:"The proposal was ______ by the board of directors.", options:["approved","approving","approvingly","approve"], correct:"approved", points:1, explanation:"Structure passive : was + participe passé." },
      { id:4, text:"We need to ______ our marketing strategy for Q1.", options:["revise","revision","revised","revising"], correct:"revise", points:1, explanation:"'Need to' est suivi de l'infinitif." },
      { id:5, text:"______ the high costs, the project was deemed necessary.", options:["Despite","Although","However","Because"], correct:"Despite", points:2, explanation:"'Despite' est suivi d'un nom. 'Although' d'une proposition." },
      { id:6, text:"The quarterly ______ will be presented to investors next week.", options:["report","reports","reported","reporting"], correct:"report", points:1, explanation:"'Quarterly report' est un syntagme nominal courant en TOEIC." },
      { id:7, text:"______ placing the order, please verify your billing address.", options:["Before","After","Since","While"], correct:"Before", points:2, explanation:"Le contexte logique impose 'before' — vérifier avant de commander." },
      { id:8, text:"The new software has significantly ______ productivity.", options:["improved","improvement","improving","improve"], correct:"improved", points:2, explanation:"'Has + participe passé' = present perfect actif." },
      { id:9, text:"All employees are ______ to attend the mandatory training.", options:["required","requiring","requirement","require"], correct:"required", points:2, explanation:"Structure passive : are + required." },
      { id:10, text:"The conference room ______ for three hours during the seminar.", options:["was occupied","occupied","will occupy","has occupy"], correct:"was occupied", points:2, explanation:"Prétérit passif : was + participe passé." },
    ],
  },
];

const SPEAKING_TASKS = [
  {
    id:1, titre:"Task 1 — Opinion personnelle",
    type:"independant", niveau:"B2", cours:"Anglais Pro B2", formateur:"Prof. Martin",
    consigne:"Do you prefer working from home or at the office? Use specific reasons and examples to support your answer.",
    prepTime:15, recordTime:45, statut:"disponible",
    tip:"Structure your answer: State your preference → Give 2 reasons → Give a concrete example → Conclude.",
  },
  {
    id:2, titre:"Task 2 — Réaction professionnelle",
    type:"independant", niveau:"B2", cours:"Business English", formateur:"Prof. Dubois",
    consigne:"Describe a professional challenge you faced. What was the situation? What actions did you take? What was the outcome?",
    prepTime:15, recordTime:45, statut:"disponible",
    tip:"Use the STAR method: Situation → Task → Action → Result.",
  },
  {
    id:3, titre:"Task 3 — Intégré (Lecture + Expression)",
    type:"integre_lecture", niveau:"B2", cours:"Préparation TOEIC", formateur:"Prof. Smith",
    textePassage:"Companies are increasingly adopting flexible work arrangements. Research shows that employees who have control over their schedules report higher job satisfaction and lower stress levels. However, some managers argue that face-to-face collaboration is essential for innovation and team cohesion. The debate continues as organizations try to balance individual needs with collective performance goals.",
    consigne:"The reading passage discusses flexible work arrangements. Summarize the main arguments presented and then express your own view on this topic.",
    prepTime:30, recordTime:60, statut:"disponible",
    tip:"First summarize the passage (2–3 sentences), then give your personal opinion with 1–2 reasons.",
  },
  {
    id:4, titre:"Task 4 — Intégré (Audio + Expression)",
    type:"integre_audio", niveau:"B2", cours:"Préparation TOEIC", formateur:"Prof. Smith",
    audioPromptUrl:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    audioPromptDuree:"1 min",
    consigne:"Listen to the audio extract carefully. Then summarize the key points discussed and share your perspective on the topic.",
    prepTime:30, recordTime:60, statut:"disponible",
    tip:"Take notes while listening. Your response should cover: main topic → key points → your opinion.",
  },
  {
    id:5, titre:"Task 1 — Simulation TOEIC Speaking",
    type:"independant", niveau:"B2", cours:"Préparation TOEIC", formateur:"Prof. Smith",
    consigne:"Talk about your ideal workplace environment. Describe its key features and explain why each matters to you professionally.",
    prepTime:15, recordTime:45, statut:"soumis",
    dateSubmit:"2025-12-10",
    scoreProf:78, maxScore:100,
    commentaireProf:"Good vocabulary and clear structure. Work on reducing filler words ('uh', 'um') and improving intonation on key points.",
  },
];

/* ═══════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES
═══════════════════════════════════════════════════════ */
const ProgressRing = ({ pct, size = 80, stroke = 6, color = PRIMARY_COLOR }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
    </svg>
  );
};

const ProgressBar = ({ value, color = PRIMARY_COLOR, height = 7, animated = false }) => (
  <div style={{ height, background:"#e5e7eb", borderRadius:height, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.min(100, value)}%`, background:color, borderRadius:height,
      transition: animated ? "width 1s ease" : "none" }} />
  </div>
);

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

const NiveauBadge = ({ niveau }) => {
  const m = NIVEAU_META[niveau] || NIVEAU_META.A1;
  return <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:800, background:m.bg, color:m.color }}>{niveau} — {m.label}</span>;
};

const Modal = ({ title, onClose, children, wide }) => (
  <div style={modalOverlay}>
    <div style={{ ...modalBox, width: wide ? 680 : 520, maxHeight:"90vh", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h3 style={{ margin:0, fontSize:16 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#6b7280" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
   COMPOSANT LECTEUR AUDIO RÉEL
═══════════════════════════════════════════════════════ */
const AudioPlayer = ({ url, titre, cours, duree, description }) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [playing, setPlaying]       = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime]   = useState(0);
  const [volume, setVolume]         = useState(1);
  const [speed, setSpeed]           = useState(1);
  const [loaded, setLoaded]         = useState(false);
  const [error, setError]           = useState(false);

  const fmtTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2,"0")}`;
  };

  const toggle = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); }
    else { audioRef.current.play().catch(() => setError(true)); }
  }, [playing]);

  const skip = (s) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(totalTime, audioRef.current.currentTime + s));
    }
  };

  const handleSeek = (e) => {
    if (!progressRef.current || !totalTime) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioRef.current) audioRef.current.currentTime = pct * totalTime;
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const changeSpeed = (s) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  const pct = totalTime ? (currentTime / totalTime) * 100 : 0;

  return (
    <div>
      {/* Élément audio natif caché */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={e => { setTotalTime(e.target.duration); setLoaded(true); }}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)}
      />

      {/* En-tête coloré */}
      <div style={{ padding:"20px 24px", borderRadius:"12px 12px 0 0", background:"linear-gradient(135deg,#059669,#34d399)", color:"#fff", textAlign:"center", marginBottom:0 }}>
        <div style={{ fontSize:44, marginBottom:6 }}>🎧</div>
        <div style={{ fontSize:15, fontWeight:700, lineHeight:1.3, marginBottom:4 }}>{titre}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>📚 {cours} · ⏱ {duree}</div>
      </div>

      {/* Lecteur */}
      <div style={{ padding:"16px 20px", borderRadius:"0 0 12px 12px", background:"#f0fdf4", border:"1px solid #bbf7d0", marginBottom:14 }}>
        {error ? (
          <div style={{ textAlign:"center", padding:"12px 0", color:"#dc2626", fontSize:13 }}>
            ⚠️ Impossible de charger l'audio. Vérifiez votre connexion.
          </div>
        ) : (
          <>
            {/* Barre de progression cliquable */}
            <div
              ref={progressRef}
              onClick={handleSeek}
              style={{ height:8, background:"#d1fae5", borderRadius:4, cursor:"pointer", marginBottom:8, position:"relative", overflow:"hidden" }}
            >
              <div style={{ height:"100%", width:`${pct}%`, background:"#059669", borderRadius:4, transition:"width .1s linear" }} />
              {/* Curseur */}
              <div style={{ position:"absolute", top:-2, left:`${pct}%`, transform:"translateX(-50%)", width:14, height:14, borderRadius:"50%", background:"#059669", border:"2px solid #fff", boxShadow:"0 1px 4px rgba(0,0,0,.2)", transition:"left .1s linear" }} />
            </div>

            {/* Temps */}
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#6b7280", marginBottom:14 }}>
              <span>{fmtTime(currentTime)}</span>
              <span>{loaded ? fmtTime(totalTime) : duree}</span>
            </div>

            {/* Contrôles principaux */}
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginBottom:14 }}>
              <button onClick={()=>skip(-10)} title="Reculer 10s" style={{ padding:"8px 14px", background:"#e5e7eb", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, color:"#374151" }}>⏮ 10s</button>

              <button
                onClick={toggle}
                style={{ width:52, height:52, borderRadius:"50%", background:playing?"#dc2626":"#059669", border:"none", cursor:"pointer", fontSize:22, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,.2)", transition:"background .2s" }}
              >
                {playing ? "⏸" : "▶️"}
              </button>

              <button onClick={()=>skip(10)} title="Avancer 10s" style={{ padding:"8px 14px", background:"#e5e7eb", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, color:"#374151" }}>10s ⏭</button>
            </div>

            {/* Volume + Vitesse */}
            <div style={{ display:"flex", gap:16, alignItems:"center", justifyContent:"center", flexWrap:"wrap" }}>
              {/* Volume */}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14 }}>{volume===0?"🔇":volume<0.5?"🔉":"🔊"}</span>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolume}
                  style={{ width:80, accentColor:"#059669" }} />
              </div>

              {/* Vitesse */}
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                <span style={{ fontSize:11, color:"#6b7280", marginRight:2 }}>Vitesse :</span>
                {[0.75, 1, 1.25, 1.5].map(s => (
                  <button key={s} onClick={()=>changeSpeed(s)} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid", fontSize:11, fontWeight:600, cursor:"pointer", background:speed===s?"#059669":"#fff", color:speed===s?"#fff":"#374151", borderColor:speed===s?"#059669":"#e5e7eb" }}>{s}×</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Description */}
      {description && (
        <p style={{ fontSize:12, color:"#6b7280", lineHeight:1.6, margin:"8px 0 0" }}>
          📝 {description}
        </p>
      )}
    </div>
  );
};

export default function EspaceApprenant() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCours, setSelectedCours] = useState(null);
  const [showCoursModal, setShowCoursModal] = useState(false);
  const [filterRessource, setFilterRess] = useState("Tous");
  const [filterFavori, setFilterFav] = useState(false);
  const [showMessageModal, setShowMsgModal] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [messages, setMessages] = useState(MESSAGES);
  const [semaineCourante, setSemaine] = useState(0);

  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDestinataire, setRequestDestinataire] = useState(CONTACTS_ADMIN[0].nom);
  const [requestObjet, setRequestObjet] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const msgNonLus = messages.filter(m => !m.lu).length;
  const certifCount = MES_CERTIFICATIONS.filter(c => c.valide).length;

  const [examens, setExamens] = useState(MES_EXAMENS);
  const [examStep, setExamStep] = useState("liste");
  const [examActif, setExamActif] = useState(null);
  const [examAnswers, setExamAnswers] = useState({});
  const [examCurrentQ, setExamCurrentQ] = useState(0);
  const [examTimeLeft, setExamTimeLeft] = useState(0);
  const [examResult, setExamResult] = useState(null);
  const [examTimerRef, setExamTimerRef] = useState(null);
  const [filterExamCat, setFilterExamCat] = useState("Tous");
  const [showExamInfoModal, setShowExamInfoModal] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);

  // Chat & messages
  const [activeConvMsg, setActiveConvMsg] = useState(null);
  const [convReply, setConvReply] = useState("");
  const [filterMsgType, setFilterMsgType] = useState("Tous");
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [signalForm, setSignalForm] = useState({ type:"probleme_acces", sujet:"", description:"", urgence:"normale" });
  // Ressource viewer
  const [showRessModal, setShowRessModal] = useState(false);
  const [selectedRess, setSelectedRess] = useState(null);
  // Course expandable modules in modal
  const [expandedModule, setExpandedModule] = useState(null);
  // Boutique achat
  const [showAchatModal, setShowAchatModal] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [achatForm, setAchatForm] = useState({ mode:"orange_money", nom:"", email:"" });
  // Résultat détail
  const [expandedResult, setExpandedResult] = useState(null);

  // ── Speaking ──────────────────────────────────────────
  const [speakingTask, setSpeakingTask]   = useState(null);   // tâche sélectionnée
  const [speakPhase, setSpeakPhase]       = useState("idle"); // idle | prep | recording | playback | submitted
  const [speakTimer, setSpeakTimer]       = useState(0);
  const [speakBlob, setSpeakBlob]         = useState(null);
  const [speakUrl, setSpeakUrl]           = useState(null);
  const [speakTasks, setSpeakTasks]       = useState(SPEAKING_TASKS);
  const [micError, setMicError]           = useState(false);
  const mediaRecorderRef  = useRef(null);
  const speakTimerRef     = useRef(null);
  const chunksRef         = useRef([]);

  const clearSpeakTimer = () => {
    if (speakTimerRef.current) clearInterval(speakTimerRef.current);
  };

  const startPrep = (task) => {
    setSpeakingTask(task);
    setSpeakPhase("prep");
    setSpeakBlob(null);
    setSpeakUrl(null);
    setMicError(false);
    setSpeakTimer(task.prepTime);
  };

  const startRecording = useCallback(async () => {
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type:"audio/webm" });
        setSpeakBlob(blob);
        setSpeakUrl(URL.createObjectURL(blob));
        setSpeakPhase("playback");
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setSpeakPhase("recording");
    } catch {
      setMicError(true);
      setSpeakPhase("idle");
    }
  }, []);

  const stopRecording = () => {
    clearSpeakTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const submitSpeaking = () => {
    setSpeakTasks(prev => prev.map(t =>
      t.id === speakingTask.id
        ? { ...t, statut:"soumis", dateSubmit: new Date().toISOString().split("T")[0] }
        : t
    ));
    setSpeakPhase("submitted");
    toast.success("🎤 Réponse envoyée au coach !");
  };

  const resetSpeaking = () => {
    clearSpeakTimer();
    setSpeakPhase("idle");
    setSpeakingTask(null);
    setSpeakBlob(null);
    setSpeakUrl(null);
  };

  // Décompte préparation → lance automatiquement l'enregistrement
  useEffect(() => {
    if (speakPhase === "prep") {
      speakTimerRef.current = setInterval(() => {
        setSpeakTimer(t => {
          if (t <= 1) { clearInterval(speakTimerRef.current); startRecording(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    if (speakPhase === "recording") {
      speakTimerRef.current = setInterval(() => {
        setSpeakTimer(t => {
          if (t <= 1) { clearInterval(speakTimerRef.current); stopRecording(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearSpeakTimer();
    // eslint-disable-next-line
  }, [speakPhase]);

  const startExam = (examen) => {
    setExamActif(examen);
    setExamAnswers({});
    setExamCurrentQ(0);
    setExamResult(null);
    setCheatCount(0);
    setShowCheatWarning(false);
    setShowExamInfoModal(true);
  };

  const launchQuiz = () => {
    setShowExamInfoModal(false);
    const secs = examActif.dureeMinutes * 60;
    setExamTimeLeft(secs);
    setExamStep("quiz");
    const ref = setInterval(() => {
      setExamTimeLeft(t => {
        if (t <= 1) { clearInterval(ref); submitExam(); return 0; }
        return t - 1;
      });
    }, 1000);
    setExamTimerRef(ref);
  };

  /* Anti-triche : visibilitychange + blur pendant le quiz */
  useEffect(() => {
    if (examStep !== "quiz") return;
    const onHide = () => {
      if (document.hidden) {
        setCheatCount(c => {
          const next = c + 1;
          if (next >= 3) { submitExam(); toast.error("⛔ Examen soumis automatiquement — 3 infractions détectées"); }
          else { setShowCheatWarning(true); toast.error(`⚠️ Changement d'onglet détecté (avertissement ${next}/3)`); }
          return next;
        });
      }
    };
    const onBlur = () => {
      setCheatCount(c => {
        const next = c + 1;
        if (next >= 3) { submitExam(); toast.error("⛔ Examen soumis — fenêtre quittée 3 fois"); }
        else setShowCheatWarning(true);
        return next;
      });
    };
    const onCtx = (e) => e.preventDefault();
    const onKeyCtrl = (e) => {
      if ((e.ctrlKey||e.metaKey) && ["c","v","a","u","s","p"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("keydown", onKeyCtrl);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("keydown", onKeyCtrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStep]);

  const submitExam = () => {
    if (examTimerRef) clearInterval(examTimerRef);
    const qs = examActif.questions;
    let earned = 0;
    let correct = 0;
    qs.forEach(q => {
      if (examAnswers[q.id] === q.correct) {
        earned += q.points;
        correct++;
      }
    });
    const total = qs.reduce((s, q) => s + q.points, 0);
    const pct = Math.round((earned / total) * 100);
    const passed = pct >= examActif.passingScore;
    const result = { earned, total, correct, nbQ: qs.length, pct, passed, date: new Date().toISOString().split("T")[0] };
    setExamResult(result);
    setExamens(examens.map(e => e.id === examActif.id
      ? { ...e, statut: e.tentatives + 1 >= e.maxTentatives ? "termine" : "disponible", tentatives: e.tentatives + 1, meilleurScore: (!e.meilleurScore || pct > e.meilleurScore.pct) ? { score:correct, total:qs.length, pct, date:result.date } : e.meilleurScore }
      : e
    ));
    setExamStep("result");
    toast.success(passed ? "🎉 Examen réussi !" : "Examen terminé — consultez vos résultats");
  };

  const examFmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const examTimeLow = examTimeLeft <= 60;

  const sendConvReply = () => {
    if (!convReply.trim() || !activeConvMsg) return;
    const reply = { id: Date.now(), expediteur: `${MON_PROFIL.prenom} ${MON_PROFIL.nom}`, avatar: MON_PROFIL.avatar, date: new Date().toISOString().split("T")[0], lu: true, objet: `RE: ${activeConvMsg.objet}`, message: convReply.trim(), type: "envoye", sens: "envoye", conversationId: activeConvMsg.id };
    setMessages(prev => [...prev, reply]);
    setConvReply("");
    toast.success("Réponse envoyée !");
  };

  const sendSignalApprenant = () => {
    if (!signalForm.sujet.trim() || !signalForm.description.trim()) { toast.error("Veuillez remplir le sujet et la description."); return; }
    const msg = { id: Date.now(), expediteur: `${MON_PROFIL.prenom} ${MON_PROFIL.nom}`, avatar: MON_PROFIL.avatar, date: new Date().toISOString().split("T")[0], lu: true, objet: `🚨 Signal: ${signalForm.sujet}`, message: signalForm.description, type: "envoye", sens: "envoye" };
    setMessages(prev => [...prev, msg]);
    setShowSignalModal(false);
    setSignalForm({ type:"probleme_acces", sujet:"", description:"", urgence:"normale" });
    toast.success("Votre signalement a été envoyé au gestionnaire. Nous vous répondrons sous 24h.");
  };

  const messagesFiltres = messages.filter(m => {
    if (filterMsgType === "prof") return m.type === "prof";
    if (filterMsgType === "gestionnaire") return m.type === "gestionnaire";
    if (filterMsgType === "admin") return m.type === "admin";
    if (filterMsgType === "envoye") return m.sens === "envoye";
    return true;
  });

  const ressourcesFiltrees = useMemo(() => {
    let r = [...MES_RESSOURCES];
    if (filterRessource !== "Tous") r = r.filter(x => x.type === filterRessource);
    if (filterFavori) r = r.filter(x => x.favori);
    return r;
  }, [filterRessource, filterFavori]);

  const planningFiltré = useMemo(() => {
    const now = new Date("2025-12-10");
    return MON_PLANNING.filter(s => {
      const d = new Date(s.date);
      const diff = Math.floor((d - now) / (1000*3600*24));
      return diff >= semaineCourante * 7 && diff < (semaineCourante + 1) * 7;
    });
  }, [semaineCourante]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short" }) : "—";
  const formatDateFull = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }) : "—";

  const scoreColor = (s, max) => {
    const p = (s/max)*100;
    return p >= 75 ? "#22c55e" : p >= 50 ? "#f59e0b" : "#ef4444";
  };

  const tabs = [
    { key:"dashboard",      label:"Tableau de bord", icon:"🏠", count:null },
    { key:"monprofil",      label:"Mon profil",      icon:"👤", count:null },
    { key:"onboarding",     label:"Onboarding",      icon:"🎬", count:ONBOARDING_VIDEOS.length },
    { key:"cours",          label:"Mes cours",       icon:"📚", count:MES_COURS.filter(c=>c.statut==="en_cours").length },
    { key:"planning",       label:"Planning",        icon:"📅", count:MON_PLANNING.filter(p=>p.statut==="confirme").length },
    { key:"ressources",     label:"Ressources",      icon:"📂", count:MES_RESSOURCES.length },
    { key:"resultats",      label:"Résultats",       icon:"📊", count:MES_RESULTATS.length },
    { key:"objectifs",      label:"Objectifs",       icon:"🎯", count:null },
    { key:"certifications", label:"Certifications",  icon:"🏅", count:certifCount },
    { key:"examens",        label:"Examens",         icon:"📝", count:examens.filter(e=>e.statut==="disponible").length + speakTasks.filter(t=>t.statut==="disponible").length, danger: (examens.filter(e=>e.statut==="disponible").length + speakTasks.filter(t=>t.statut==="disponible").length) > 0 },
    { key:"contacts",       label:"Contacts & Support", icon:"📞", count:null },
    { key:"boutique",       label:"Boutique",        icon:"🛒", count:PRODUITS_BOUTIQUE.length },
    { key:"messages",       label:"Messages",        icon:"💬", count:msgNonLus || null, danger:msgNonLus > 0 },
    { key:"paiement",       label:"Paiement",        icon:"💳", count:MON_PROFIL.paiements.filter(p=>p.statut==="attente").length || null, danger:MON_PROFIL.paiements.some(p=>p.statut==="attente") },
  ];

  const handleSubmitRequest = () => {
    if (!requestObjet.trim() || !requestMessage.trim()) {
      toast.error("Veuillez remplir l'objet et le message.");
      return;
    }
    toast.success(`Votre requête à ${requestDestinataire} a été envoyée. Nous vous répondrons dans les 48h.`);
    setShowRequestModal(false);
    setRequestObjet("");
    setRequestMessage("");
    setRequestDestinataire(CONTACTS_ADMIN[0].nom);
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:PRIMARY_LIGHT }}>
      <div style={{ flex:1, padding:0, overflowX:"hidden" }}>
        <Toaster position="top-right" />

        {/* HERO HEADER */}
        <div style={{ background:GRADIENT_HEADER, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
          <div style={{ position:"absolute", bottom:-60, right:80, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }} />

          <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:28, position:"relative", flexWrap:"wrap" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", border:"3px solid rgba(255,255,255,0.3)" }}>
              {MON_PROFIL.avatar}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:"#fecaca", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" }}>Bonjour 👋</div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{MON_PROFIL.prenom} {MON_PROFIL.nom}</h1>
              <div style={{ fontSize:12, color:"#fecaca", marginTop:3, display:"flex", gap:12, flexWrap:"wrap" }}>
                <span>{MON_PROFIL.poste} · {MON_PROFIL.entreprise}</span>
                <span style={{ padding:"2px 8px", borderRadius:10, background:"rgba(255,255,255,0.15)" }}>{MON_PROFIL.badge}</span>
              </div>
            </div>
            <div style={{ textAlign:"center", padding:"12px 20px", borderRadius:12, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize:10, color:"#fecaca", marginBottom:2, fontWeight:600 }}>NIVEAU ACTUEL</div>
              <div style={{ fontSize:28, fontWeight:900 }}>{MON_PROFIL.niveau}</div>
              <div style={{ fontSize:10, color:"#fecaca" }}>{NIVEAU_META[MON_PROFIL.niveau]?.label}</div>
            </div>
          </div>

          <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden" }}>
            {[
              { l:"Progression globale", v:`${MON_PROFIL.progression}%`,  c:"#f87171" },
              { l:"Heures effectuées",   v:`${MON_PROFIL.heuresTotal}h`,  c:"#fca5a5" },
              { l:"Assiduité",           v:`${MON_PROFIL.assiduiteRate}%`, c:"#fecaca" },
              { l:"Score dernier test",  v:`${MON_PROFIL.testScore}%`,    c:"#fbbf24" },
              { l:"Certifications",      v:certifCount,                   c:"#34d399" },
            ].map((s, i, arr) => (
              <div key={s.l} style={{ flex:1, textAlign:"center", padding:"14px 8px", borderRight: i < arr.length-1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>{s.l}</div>
                <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"0 24px 24px" }}>
          {/* TABS */}
          <div style={{ display:"flex", gap:3, marginBottom:0, flexWrap:"wrap", paddingTop:20 }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  padding:"10px 16px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer",
                  fontWeight:600, fontSize:13,
                  background: isActive ? "#fff" : PRIMARY_LIGHT,
                  color: isActive ? PRIMARY_COLOR : PRIMARY_DARK,
                  boxShadow: isActive ? `0 -2px 8px ${PRIMARY_COLOR}25` : "none",
                  display:"flex", alignItems:"center", gap:6,
                }}>
                  <span style={{ fontSize:14 }}>{tab.icon}</span>
                  {tab.label}
                  {tab.count !== null && tab.count !== undefined && (
                    <span style={{ padding:"1px 7px", borderRadius:10, fontSize:11, fontWeight:700,
                      background: tab.danger ? "#fee2e2" : isActive ? PRIMARY_LIGHT : "#fecaca",
                      color: tab.danger ? "#dc2626" : isActive ? PRIMARY_COLOR : PRIMARY_DARK }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* CARD PRINCIPALE */}
          <div style={{ background:"#fff", padding:24, borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>

            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Mon tableau de bord</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Bienvenue dans votre espace personnel BET</p></div>
                  <div style={{ fontSize:12, color:"#9ca3af" }}>Dernière connexion : {formatDateFull("2025-12-09")}</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px,1fr))", gap:12, marginBottom:24 }}>
                  <StatCard label="Cours en cours" value={MES_COURS.filter(c=>c.statut==="en_cours").length} color={PRIMARY_COLOR} icon="📚" sub="3 actifs" onClick={()=>setActiveTab("cours")} />
                  <StatCard label="Prochaine session" value="Jeu. 12/12" color={PRIMARY_DARK} icon="📅" sub="09:00 — Salle A" onClick={()=>setActiveTab("planning")} />
                  <StatCard label="Ressources" value={MES_RESSOURCES.length} color="#059669" icon="📂" sub={`${MES_RESSOURCES.filter(r=>r.favori).length} favoris`} onClick={()=>setActiveTab("ressources")} />
                  <StatCard label="Messages non lus" value={msgNonLus} color={msgNonLus>0?"#dc2626":"#9ca3af"} icon="💬" onClick={()=>setActiveTab("messages")} />
                  <StatCard label="Points XP" value={MON_PROFIL.pointsXP.toLocaleString()} color="#d97706" icon="⭐" sub="niveau intermédiaire" />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                      <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>Progression de mes cours</h3>
                      <button onClick={()=>setActiveTab("cours")} style={{ padding:"5px 10px", background:"none", color:PRIMARY_COLOR, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:11 }}>Voir tout →</button>
                    </div>
                    {MES_COURS.filter(c=>c.statut==="en_cours").map(c => (
                      <div key={c.id} style={{ marginBottom:16, padding:"12px 14px", borderRadius:10, background:"#fff", border:"1px solid #e5e7eb", cursor:"pointer" }} onClick={()=>{ setSelectedCours(c); setShowCoursModal(true); }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:20 }}>{c.emoji}</span>
                            <div><div style={{ fontWeight:600, fontSize:13 }}>{c.titre}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{c.formateur} · {c.heuresFaites}h/{c.heures}h</div></div>
                          </div>
                          <NiveauBadge niveau={c.niveau} />
                        </div>
                        <ProgressBar value={c.progression} color={c.color} />
                        {c.prochaineCours && <div style={{ fontSize:11, color:"#9ca3af", marginTop:6 }}>📅 Prochain : {new Date(c.prochaineCours).toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                      <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12 }}>🎯 Mon objectif principal</h3>
                      <p style={{ fontSize:13, color:"#374151", fontStyle:"italic", marginBottom:12, lineHeight:1.6 }}>"{MON_PROFIL.objectif}"</p>
                      <div style={{ position:"relative", width:80, height:80, margin:"0 auto 10px" }}>
                        <ProgressRing pct={MON_PROFIL.progression} size={80} stroke={7} color={PRIMARY_COLOR} />
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:PRIMARY_COLOR }}>{MON_PROFIL.progression}%</div>
                      </div>
                      <div style={{ textAlign:"center", fontSize:11, color:"#9ca3af" }}>Progression globale</div>
                    </div>
                    <div style={{ background:PRIMARY_LIGHT, borderRadius:12, padding:16, border:`1px solid ${PRIMARY_COLOR}30` }}>
                      <div style={{ fontSize:12, fontWeight:700, color:PRIMARY_COLOR, marginBottom:6 }}>⏳ Prochain examen</div>
                      <div style={{ fontSize:16, fontWeight:800, color:"#0f172a" }}>TOEIC Officiel</div>
                      <div style={{ fontSize:12, color:"#6b7280" }}>📅 {formatDateFull(MON_PROFIL.prochainExamen)}</div>
                      <div style={{ marginTop:10, fontSize:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span>Objectif score</span><strong style={{ color:PRIMARY_COLOR }}>850 / 990</strong></div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span>Dernier score</span><strong style={{ color:PRIMARY_DARK }}>760 / 990</strong></div>
                      </div>
                    </div>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                        <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0 }}>💬 Messages récents</h3>
                        <button onClick={()=>setActiveTab("messages")} style={{ padding:"5px 10px", background:"none", color:PRIMARY_COLOR, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:11 }}>Voir →</button>
                      </div>
                      {messages.slice(0,3).map(m => (
                        <div key={m.id} onClick={()=>{ setSelectedMsg(m); setShowMsgModal(true); setMessages(messages.map(x=>x.id===m.id?{...x,lu:true}:x)); }}
                          style={{ padding:"8px 10px", borderRadius:8, marginBottom:6, cursor:"pointer", background: m.lu?"#fff":PRIMARY_LIGHT, border:`1px solid ${m.lu?"#e5e7eb":PRIMARY_COLOR+"40"}` }}>
                          <div style={{ fontWeight:600, fontSize:12, color:"#0f172a" }}>{m.expediteur}</div>
                          <div style={{ fontSize:11, color:"#6b7280", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{m.objet}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MON PROFIL */}
            {activeTab === "monprofil" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Mon profil</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Informations personnelles et suivi</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                  <div>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:20, marginBottom:20 }}>
                      <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}><span>👤</span> Identité</h3>
                      <div style={{ fontSize:13, marginBottom:8 }}><strong>Nom :</strong> {MON_PROFIL.prenom} {MON_PROFIL.nom}</div>
                      <div style={{ fontSize:13, marginBottom:8 }}><strong>Email :</strong> {MON_PROFIL.email}</div>
                      <div style={{ fontSize:13, marginBottom:8 }}><strong>Téléphone :</strong> {MON_PROFIL.phone}</div>
                      <div style={{ fontSize:13, marginBottom:8 }}><strong>Date d'inscription :</strong> {formatDateFull(MON_PROFIL.dateInscription)}</div>
                    </div>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:20, marginBottom:20 }}>
                      <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}><span>📊</span> Parcours pédagogique</h3>
                      <div style={{ fontSize:13, marginBottom:8 }}><strong>Niveau d'anglais :</strong> {MON_PROFIL.niveau} — {NIVEAU_META[MON_PROFIL.niveau]?.label}</div>
                      <div style={{ fontSize:13, marginBottom:8 }}><strong>Résultat test de niveau :</strong> {MON_PROFIL.testNiveauResultat}</div>
                      <div style={{ fontSize:13, marginBottom:8 }}><strong>Coach assigné :</strong> {MON_PROFIL.coach.nom} ({MON_PROFIL.coach.email})</div>
                      <div style={{ fontSize:13, marginBottom:8 }}><strong>Gestionnaire référent :</strong> {MON_PROFIL.gestionnaire.nom} ({MON_PROFIL.gestionnaire.email})</div>
                      <div style={{ fontSize:13, marginBottom:8 }}><strong>Type de cours :</strong> {MON_PROFIL.typeCours === "presentiel" ? "Présentiel" : MON_PROFIL.typeCours === "en ligne" ? "En ligne" : "Entreprise"}</div>
                      <div style={{ fontSize:13, marginBottom:8 }}><strong>Classe :</strong> {MON_PROFIL.classe}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:20, marginBottom:20 }}>
                      <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}><span>💰</span> Historique des paiements</h3>
                      {MON_PROFIL.paiements.map(p => (
                        <div key={p.date} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #e5e7eb" }}>
                          <div><span style={{ fontSize:12, color:"#6b7280" }}>{formatDateFull(p.date)}</span><br/><span style={{ fontSize:13 }}>{p.description}</span></div>
                          <div style={{ textAlign:"right" }}><span style={{ fontWeight:700, color:PRIMARY_DARK }}>{p.montant.toLocaleString()} FCFA</span><br/><span style={{ fontSize:11, color:p.statut==="payé"?"#22c55e":"#f59e0b" }}>{p.statut === "payé" ? "✅ Payé" : "⏳ En attente"}</span></div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                      <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}><span>📝</span> Notes du coach / Évaluations</h3>
                      {MON_PROFIL.notesCoach.map(n => (
                        <div key={n.date} style={{ padding:"10px 0", borderBottom:"1px solid #e5e7eb" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontWeight:600, fontSize:12 }}>{n.auteur}</span><span style={{ fontSize:11, color:"#9ca3af" }}>{formatDateFull(n.date)}</span></div>
                          <p style={{ fontSize:12, color:"#374151", margin:0 }}>{n.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ONBOARDING */}
            {activeTab === "onboarding" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Vidéos d'onboarding</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Découvrez le processus BET, du démarrage au certificat</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px,1fr))", gap:20 }}>
                  {ONBOARDING_VIDEOS.map(video => (
                    <div key={video.id} style={{ borderRadius:12, border:`1px solid ${PRIMARY_COLOR}20`, overflow:"hidden", background:"#fff" }}>
                      <div style={{ position:"relative", paddingBottom:"56.25%", background:"#000" }}>
                        <iframe src={video.url} title={video.titre} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%" }}></iframe>
                      </div>
                      <div style={{ padding:16 }}>
                        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>{video.titre}</h3>
                        <p style={{ fontSize:12, color:"#6b7280", marginBottom:8 }}>{video.description}</p>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:11, color:"#9ca3af" }}>⏱ {video.duree}</span>
                          <button onClick={()=>toast.success(`Lecture de "${video.titre}"`)} style={{ padding:"6px 14px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Regarder</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MES COURS */}
            {activeTab === "cours" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Mes Cours</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{MES_COURS.length} cours · {MES_COURS.filter(c=>c.statut==="en_cours").length} en cours</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:16 }}>
                  {MES_COURS.map(c => {
                    const sm = STATUT_COURS[c.statut];
                    const modulesOk = c.modules.filter(m=>m.done).length;
                    return (
                      <div key={c.id} style={{ borderRadius:14, border:"1px solid #e5e7eb", background:"#fff", overflow:"hidden", cursor:"pointer" }} onClick={()=>{ setSelectedCours(c); setShowCoursModal(true); }}>
                        <div style={{ height:6, background:c.color }} />
                        <div style={{ padding:18 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}><span style={{ fontSize:26 }}>{c.emoji}</span><div><div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{c.titre}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{c.formateur}</div></div></div>
                            <span style={{ padding:"3px 9px", borderRadius:14, fontSize:11, fontWeight:700, background:sm.bg, color:sm.c }}>{sm.label}</span>
                          </div>
                          <p style={{ fontSize:12, color:"#6b7280", lineHeight:1.6, marginBottom:14 }}>{c.description}</p>
                          <div style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}><span>Progression</span><strong style={{ color:c.color }}>{c.progression}%</strong></div><ProgressBar value={c.progression} color={c.color} height={8} /></div>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#6b7280", marginBottom:10 }}><span>⏱ {c.heuresFaites}h / {c.heures}h</span><span>📚 {modulesOk}/{c.modules.length} modules</span></div>
                          {c.prochaineCours && <div style={{ padding:"7px 10px", borderRadius:8, background:`${c.color}10`, fontSize:11, color:c.color, fontWeight:600 }}>📅 Prochaine session : {new Date(c.prochaineCours).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PLANNING */}
            {activeTab === "planning" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Mon Planning</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{MON_PLANNING.length} sessions programmées</p></div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setSemaine(s=>Math.max(0,s-1))} style={{ padding:"7px 12px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }} disabled={semaineCourante===0}>← Semaine préc.</button>
                    <span style={{ padding:"7px 14px", background:PRIMARY_LIGHT, color:PRIMARY_COLOR, borderRadius:6, fontWeight:600, fontSize:12 }}>Semaine {semaineCourante === 0 ? "courante" : `+${semaineCourante}`}</span>
                    <button onClick={()=>setSemaine(s=>s+1)} style={{ padding:"7px 12px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Semaine suiv. →</button>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:8, marginBottom:24 }}>
                  {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((j,i) => {
                    const base = new Date("2025-12-09");
                    base.setDate(base.getDate() + semaineCourante*7 + i);
                    const dateStr = base.toISOString().split("T")[0];
                    const sessionsJour = MON_PLANNING.filter(s => s.date === dateStr);
                    const isToday = dateStr === "2025-12-09";
                    return (
                      <div key={j} style={{ minHeight:80, padding:8, borderRadius:8, background: isToday ? PRIMARY_LIGHT : "#f8fafc", border:`1px solid ${isToday?PRIMARY_COLOR:"#e5e7eb"}` }}>
                        <div style={{ fontSize:11, fontWeight:700, color: isToday?PRIMARY_COLOR:"#9ca3af", marginBottom:4 }}>{j} {base.getDate()}</div>
                        {sessionsJour.map(s => (
                          <div key={s.id} style={{ fontSize:10, padding:"3px 6px", borderRadius:4, background:s.type==="online"?"#ede9fe":"#dcfce7", color:s.type==="online"?"#5b21b6":"#166534", marginBottom:3, lineHeight:1.3 }}>
                            {s.heure} {s.titre.split(" ").slice(0,2).join(" ")}
                          </div>
                        ))}
                        {!sessionsJour.length && <div style={{ fontSize:10, color:"#d1d5db", marginTop:6 }}>—</div>}
                      </div>
                    );
                  })}
                </div>
                <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Sessions de la semaine</h3>
                {planningFiltré.length === 0 ? (
                  <div style={{ textAlign:"center", padding:30, color:"#9ca3af" }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>📅</div>
                    <p>Aucune session cette semaine</p>
                  </div>
                ) : planningFiltré.map(s => {
                  const isFuture = new Date(s.date) >= new Date("2025-12-10");
                  return (
                    <div key={s.id} style={{ display:"flex", gap:16, padding:"14px 16px", borderRadius:10, border:`1px solid ${isFuture?PRIMARY_COLOR+"40":"#e5e7eb"}`, background: isFuture?PRIMARY_LIGHT:"#f9fafb", marginBottom:10 }}>
                      <div style={{ textAlign:"center", padding:"8px 14px", borderRadius:8, background: s.type==="online"?"#ede9fe":"#dcfce7", flexShrink:0 }}>
                        <div style={{ fontSize:18 }}>{s.type==="online"?"🌐":"🏢"}</div>
                        <div style={{ fontSize:10, color: s.type==="online"?"#5b21b6":"#166534", fontWeight:700 }}>{s.type==="online"?"Online":"Présentiel"}</div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{s.titre}</div>
                        <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>📅 {formatDate(s.date)} · ⏱ {s.heure} · ⌛ {s.duree}</div>
                        <div style={{ fontSize:12, color:"#6b7280" }}>👤 {s.formateur} · 📍 {s.salle}</div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <span style={{ padding:"4px 10px", borderRadius:10, fontSize:11, fontWeight:700, background: s.statut==="confirme"?"#dcfce7":"#fef3c7", color: s.statut==="confirme"?"#166534":"#92400e" }}>{s.statut==="confirme"?"✅ Confirmé":"⚠️ À confirmer"}</span>
                        {s.statut==="a_confirmer" && <div style={{ marginTop:6 }}><button onClick={()=>toast.success("Session confirmée !")} style={{ padding:"5px 10px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:11 }}>Confirmer</button></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* RESSOURCES */}
            {activeTab === "ressources" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Ressources Pédagogiques</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{MES_RESSOURCES.length} ressources · {MES_RESSOURCES.filter(r=>r.favori).length} favoris</p></div>
                </div>
                <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                  {["Tous",...Object.keys(TYPE_RESSOURCE)].map(t => {
                    const meta = TYPE_RESSOURCE[t];
                    return (
                      <button key={t} onClick={()=>setFilterRess(t)} style={{
                        padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:12, cursor:"pointer",
                        background: filterRessource===t ? (meta?.color || PRIMARY_COLOR)+"15" : "#fff",
                        color: filterRessource===t ? (meta?.color || PRIMARY_COLOR) : "#6b7280",
                        borderColor: filterRessource===t ? (meta?.color || PRIMARY_COLOR) : "#e5e7eb",
                        fontWeight: filterRessource===t ? 700 : 400,
                      }}>{meta ? `${meta.icon} ${meta.label}` : "Tous"}</button>
                    );
                  })}
                  <button onClick={()=>setFilterFav(f=>!f)} style={{
                    padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:12, cursor:"pointer",
                    background: filterFavori?"#fef9c3":"#fff", color: filterFavori?"#d97706":"#6b7280",
                    borderColor: filterFavori?"#fcd34d":"#e5e7eb", fontWeight: filterFavori?700:400,
                  }}>⭐ Favoris seulement</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                  {ressourcesFiltrees.map(r => {
                    const meta = TYPE_RESSOURCE[r.type];
                    return (
                      <div key={r.id} style={{ borderRadius:10, border:"1px solid #e5e7eb", background:"#fff", padding:14, display:"flex", flexDirection:"column", gap:10 }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                          <div style={{ width:38, height:38, borderRadius:8, background:meta.color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{meta.icon}</div>
                          <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:600, fontSize:13, color:"#0f172a", lineHeight:1.4 }}>{r.titre}</div><div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{r.cours}</div></div>
                          <button onClick={(e)=>{ e.stopPropagation(); toast.success(r.favori?"Retiré des favoris":"Ajouté aux favoris"); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, opacity: r.favori?1:0.3 }}>⭐</button>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af" }}>
                          <span style={{ padding:"2px 7px", borderRadius:6, background:meta.color+"12", color:meta.color, fontWeight:600 }}>{meta.icon} {meta.label}</span>
                          <span>{r.taille || r.duree || r.pages || r.questions}</span>
                        </div>
                        <button onClick={()=>{ if(r.type==="lien"){ window.open("#","_blank"); toast.success("Ouverture du lien..."); } else { setSelectedRess(r); setShowRessModal(true); } }} style={{ padding:"8px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12, width:"100%", textAlign:"center" }}>
                          {r.type==="pdf"?"⬇️ Télécharger": r.type==="video"?"▶️ Regarder": r.type==="audio"?"🎧 Écouter": r.type==="lien"?"🔗 Ouvrir": "▶️ Commencer"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

                        {/* EXAMENS */}
            {activeTab === "examens" && (
              <div>

                {/* ── Liste examens + speaking ── */}
                {examStep === "liste" && (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                      <div>
                        <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Mes Évaluations & Examens</h2>
                        <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>
                          {examens.filter(e=>e.statut==="disponible").length + speakTasks.filter(t=>t.statut==="disponible").length} disponible(s) · {examens.filter(e=>e.statut==="termine").length} terminé(s)
                        </p>
                      </div>
                    </div>

                    {/* Filtres : Évaluations / Examens / Speaking */}
                    <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                      {[
                        ["Tous",       "Tous",                 "#374151","#f1f5f9"],
                        ["evaluation", "📝 Évaluations",       "#0891b2","#e0f2fe"],
                        ["examen",     "🎓 Examens officiels", "#7c3aed","#f3e8ff"],
                        ["speaking",   "🎤 Speaking",          "#dc2626","#fef2f2"],
                      ].map(([val,label,col,bg]) => {
                        const count = val === "Tous"
                          ? examens.length + speakTasks.length
                          : val === "speaking"
                          ? speakTasks.length
                          : examens.filter(e=>e.categorie===val).length;
                        return (
                          <button key={val} onClick={()=>setFilterExamCat(val)} style={{ padding:"7px 16px", borderRadius:20, border:`1.5px solid ${filterExamCat===val?col:"#e5e7eb"}`, background:filterExamCat===val?bg:"#fff", color:filterExamCat===val?col:"#6b7280", fontWeight:filterExamCat===val?700:400, fontSize:12, cursor:"pointer" }}>
                            {label} <span style={{ marginLeft:4, padding:"1px 7px", borderRadius:10, background:filterExamCat===val?col:"#e5e7eb", color:filterExamCat===val?"#fff":"#374151", fontSize:10, fontWeight:700 }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>

                      {/* ── Cartes examens/évaluations classiques ── */}
                      {(filterExamCat === "Tous" || filterExamCat === "evaluation" || filterExamCat === "examen") &&
                        examens.filter(ex => filterExamCat === "Tous" || ex.categorie === filterExamCat).map(ex => {
                          const isDispo = ex.statut === "disponible";
                          const isTermine = ex.statut === "termine";
                          const cours = MES_COURS.find(c => c.id === ex.coursId);
                          const tentLeft = ex.maxTentatives - ex.tentatives;
                          const isExamen = ex.categorie === "examen";
                          const catColor = isExamen ? "#7c3aed" : "#0891b2";
                          const catBg    = isExamen ? "#f3e8ff"  : "#e0f2fe";
                          return (
                            <div key={ex.id} style={{ borderRadius:14, border:`1.5px solid ${isExamen?"#c4b5fd":isDispo?"#bae6fd":"#e5e7eb"}`, background:"#fff", overflow:"hidden" }}>
                              <div style={{ height:5, background: isExamen?"#7c3aed": isDispo ? PRIMARY_COLOR : isTermine?"#9ca3af":"#f59e0b" }} />
                              <div style={{ padding:18 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                                  <div style={{ display:"flex", gap:10, alignItems:"center" }}><span style={{ fontSize:26 }}>{cours?.emoji || "📝"}</span><div><div style={{ fontWeight:700, fontSize:14, color:"#0f172a", lineHeight:1.3 }}>{ex.titre}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{ex.cours}</div></div></div>
                                  <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                                    <span style={{ padding:"3px 10px", borderRadius:14, fontSize:10, fontWeight:700, background:catBg, color:catColor }}>{isExamen?"🎓 Examen officiel":"📝 Évaluation"}</span>
                                    <span style={{ padding:"3px 10px", borderRadius:14, fontSize:10, fontWeight:700, background: isDispo?"#dbeafe":isTermine?"#f3f4f6":"#fef3c7", color: isDispo?"#1e40af":isTermine?"#6b7280":"#92400e" }}>{isDispo?"🟢 Disponible":isTermine?"✅ Terminé":"⏳ En attente"}</span>
                                  </div>
                                </div>
                                {isExamen && <div style={{ padding:"5px 10px",borderRadius:6,background:"#faf5ff",border:"1px solid #e9d5ff",fontSize:11,color:"#7c3aed",marginBottom:8,fontWeight:600 }}>⚠️ Examen certifiant — résultat enregistré dans votre dossier</div>}
                                <p style={{ fontSize:12, color:"#6b7280", lineHeight:1.6, marginBottom:12 }}>{ex.description}</p>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                                  {[{l:"Questions",v:`${ex.nbQuestions} q`},{l:"Durée",v:`${ex.dureeMinutes} min`},{l:"Seuil réussite",v:`${ex.passingScore}%`},{l:"Tentatives",v:`${ex.tentatives}/${ex.maxTentatives}`}].map(s => <div key={s.l} style={{ padding:"7px 10px", borderRadius:7, background:"#f8fafc", textAlign:"center" }}><div style={{ fontSize:10, color:"#9ca3af" }}>{s.l}</div><div style={{ fontSize:14, fontWeight:700, color:"#374151" }}>{s.v}</div></div>)}
                                </div>
                                {ex.meilleurScore && <div style={{ padding:"8px 12px", borderRadius:8, background:"#f0fdf4", border:"1px solid #bbf7d0", marginBottom:12, fontSize:12 }}>🏆 Meilleur score : <strong style={{ color:"#166534" }}>{ex.meilleurScore.pct}%</strong> <span style={{ color:"#9ca3af", marginLeft:8 }}>({ex.meilleurScore.score}/{ex.meilleurScore.total} — le {new Date(ex.meilleurScore.date).toLocaleDateString("fr-FR")})</span></div>}
                                <div style={{ display:"flex", gap:8 }}>
                                  {isDispo && tentLeft > 0 ? (
                                    <button onClick={() => startExam(ex)} style={{ flex:1, textAlign:"center", padding:"9px 16px", background:isExamen?"#7c3aed":PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>{ex.tentatives > 0 ? "🔄 Repasser" : isExamen?"🎓 Commencer l'examen":"▶️ Commencer l'évaluation"}</button>
                                  ) : isTermine ? (
                                    <button onClick={() => { setExamActif(ex); setExamResult(ex.meilleurScore ? { ...ex.meilleurScore, passed: ex.meilleurScore.pct >= ex.passingScore, earned:ex.meilleurScore.score, total:ex.nbQuestions, correct:ex.meilleurScore.score, nbQ:ex.nbQuestions } : null); setExamStep("result"); }} style={{ flex:1, textAlign:"center", padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>📊 Voir les résultats</button>
                                  ) : <span style={{ fontSize:12, color:"#9ca3af", alignSelf:"center" }}>Tentatives épuisées</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      }

                      {/* ── Cartes speaking tasks ── */}
                      {(filterExamCat === "Tous" || filterExamCat === "speaking") &&
                        speakTasks.map(task => {
                          const isDispo = task.statut === "disponible";
                          const typeLabel = { independant:"💭 Opinion", integre_lecture:"📖 Lecture + Expression", integre_audio:"🎧 Audio + Expression" };
                          return (
                            <div key={`sp-${task.id}`} style={{ borderRadius:14, border:`1.5px solid ${isDispo?"#fecaca":"#e5e7eb"}`, background:"#fff", overflow:"hidden" }}>
                              <div style={{ height:5, background: isDispo ? PRIMARY_COLOR : "#9ca3af" }} />
                              <div style={{ padding:18 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                                    <span style={{ fontSize:26 }}>🎤</span>
                                    <div>
                                      <div style={{ fontWeight:700, fontSize:14, color:"#0f172a", lineHeight:1.3 }}>{task.titre}</div>
                                      <div style={{ fontSize:11, color:"#9ca3af" }}>{task.cours}</div>
                                    </div>
                                  </div>
                                  <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                                    <span style={{ padding:"3px 10px", borderRadius:14, fontSize:10, fontWeight:700, background:"#fef2f2", color:"#dc2626" }}>🎤 Speaking</span>
                                    <span style={{ padding:"3px 10px", borderRadius:14, fontSize:10, fontWeight:700, background: isDispo?"#dbeafe":"#f3f4f6", color: isDispo?"#1e40af":"#6b7280" }}>{isDispo?"🟢 Disponible":"✅ Soumis"}</span>
                                  </div>
                                </div>

                                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:10 }}>{typeLabel[task.type]} · 👨‍🏫 {task.formateur}</div>
                                <div style={{ fontSize:12, color:"#374151", lineHeight:1.5, marginBottom:12, padding:"10px 12px", background:"#f8fafc", borderRadius:8, borderLeft:`3px solid ${PRIMARY_COLOR}` }}>
                                  "{task.consigne}"
                                </div>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                                  <div style={{ padding:"7px 10px", borderRadius:7, background:"#f8fafc", textAlign:"center" }}><div style={{ fontSize:10, color:"#9ca3af" }}>Préparation</div><div style={{ fontSize:14, fontWeight:700, color:"#374151" }}>{task.prepTime}s</div></div>
                                  <div style={{ padding:"7px 10px", borderRadius:7, background:"#f8fafc", textAlign:"center" }}><div style={{ fontSize:10, color:"#9ca3af" }}>Réponse</div><div style={{ fontSize:14, fontWeight:700, color:"#374151" }}>{task.recordTime}s</div></div>
                                </div>

                                {!isDispo && task.scoreProf && (
                                  <div style={{ padding:"10px 12px", borderRadius:8, background:"#f0fdf4", border:"1px solid #bbf7d0", marginBottom:12 }}>
                                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                      <span style={{ fontSize:12, fontWeight:700, color:"#059669" }}>Score coach</span>
                                      <span style={{ fontSize:14, fontWeight:800, color:"#059669" }}>{task.scoreProf}/{task.maxScore||100}</span>
                                    </div>
                                    <div style={{ height:5, background:"#d1fae5", borderRadius:3, marginBottom:6 }}><div style={{ height:"100%", width:`${task.scoreProf}%`, background:"#059669", borderRadius:3 }}/></div>
                                    <div style={{ fontSize:11, color:"#374151", fontStyle:"italic" }}>💬 "{task.commentaireProf}"</div>
                                  </div>
                                )}

                                <button
                                  onClick={() => isDispo ? startPrep(task) : null}
                                  disabled={!isDispo}
                                  style={{ width:"100%", padding:"10px", background:isDispo?PRIMARY_COLOR:"#e5e7eb", color:isDispo?"#fff":"#9ca3af", border:"none", borderRadius:8, cursor:isDispo?"pointer":"default", fontWeight:700, fontSize:13 }}
                                >
                                  {isDispo ? "🎤 Démarrer l'exercice oral" : "✅ Déjà soumis"}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      }

                    </div>
                  </div>
                )}
                {/* La page "info" est maintenant affichée dans un modal — voir MODAL EXAM INFO ci-dessous */}
                {examStep === "quiz" && examActif && (
                  <div style={{ maxWidth:680, margin:"0 auto", userSelect:"none" }}>
                    {/* Bannière surveillance anti-triche */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 14px", borderRadius:8, background:"#1e293b", color:"#94a3b8", marginBottom:10, fontSize:11 }}>
                      <span style={{ display:"flex", alignItems:"center", gap:6 }}>🔒 <strong style={{ color:"#38bdf8" }}>MODE SURVEILLANCE ACTIF</strong> — Ne quittez pas cette fenêtre. Copier/coller désactivé.</span>
                      {cheatCount > 0 && <span style={{ padding:"3px 10px", borderRadius:8, background:"#ef4444", color:"#fff", fontWeight:700, fontSize:11 }}>⚠️ {cheatCount}/3 infraction(s)</span>}
                    </div>
                    {/* Avertissement triche */}
                    {showCheatWarning && (
                      <div style={{ padding:"12px 16px", borderRadius:10, background:"#fef2f2", border:"2px solid #fca5a5", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ fontWeight:700, color:"#dc2626", fontSize:13 }}>⚠️ Comportement suspect détecté !</div>
                          <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>Quitter la fenêtre ou changer d'onglet est interdit. Après 3 infractions, l'examen sera soumis automatiquement.</div>
                        </div>
                        <button onClick={()=>setShowCheatWarning(false)} style={{ padding:"6px 12px", borderRadius:6, background:"#dc2626", color:"#fff", border:"none", cursor:"pointer", fontWeight:600, fontSize:12, flexShrink:0 }}>Compris</button>
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderRadius:10, background:"#0f172a", color:"#fff", marginBottom:20 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{examActif.titre}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:16 }}><span style={{ fontSize:12, color:"#94a3b8" }}>Q{examCurrentQ+1}/{examActif.questions.length} · ✅{Object.keys(examAnswers).length} répondues</span><div style={{ padding:"6px 14px", borderRadius:8, fontWeight:800, fontSize:16, background: examTimeLow?"#ef4444":"rgba(255,255,255,0.1)", color: examTimeLow?"#fff":"#38bdf8", minWidth:72, textAlign:"center" }}>⏱ {examFmt(examTimeLeft)}</div></div>
                    </div>
                    <div style={{ height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden", marginBottom:12 }}><div style={{ height:"100%", width:`${(Object.keys(examAnswers).length/examActif.questions.length)*100}%`, background:PRIMARY_COLOR, borderRadius:3, transition:"width .3s" }} /></div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:20 }}>
                      {examActif.questions.map((q, i) => <button key={q.id} onClick={() => setExamCurrentQ(i)} style={{ width:32, height:32, borderRadius:7, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, background: i === examCurrentQ ? PRIMARY_COLOR : examAnswers[q.id] ? "#dcfce7" : "#f1f5f9", color: i === examCurrentQ ? "#fff" : examAnswers[q.id] ? "#166534" : "#6b7280" }}>{i+1}</button>)}
                    </div>
                    {(() => {
                      const q = examActif.questions[examCurrentQ];
                      return (
                        <div style={{ borderRadius:14, border:"1.5px solid #e5e7eb", padding:22, background:"#fff", marginBottom:20 }}>
                          <div style={{ display:"flex", gap:8, marginBottom:14 }}><span style={{ padding:"3px 9px", borderRadius:10, fontSize:11, fontWeight:700, background:PRIMARY_LIGHT, color:PRIMARY_COLOR }}>Question {examCurrentQ+1}</span><span style={{ padding:"3px 9px", borderRadius:10, fontSize:11, fontWeight:700, background:"#fef3c7", color:"#92400e" }}>{q.points} pt{q.points>1?"s":""}</span></div>
                          <p style={{ fontSize:17, fontWeight:600, color:"#0f172a", lineHeight:1.6, marginBottom:20 }}>{q.text}</p>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                            {q.options.map((opt, oi) => {
                              const selected = examAnswers[q.id] === opt;
                              return (
                                <button key={oi} onClick={() => setExamAnswers(prev => ({ ...prev, [q.id]:opt }))} style={{
                                  padding:"13px 16px", borderRadius:10, textAlign:"left", fontSize:14, cursor:"pointer", fontWeight: selected?700:400, transition:"all .15s",
                                  border: selected ? `2px solid ${PRIMARY_COLOR}` : "1.5px solid #e5e7eb", background: selected ? PRIMARY_LIGHT : "#fafafa", color: selected ? PRIMARY_DARK : "#374151",
                                  display:"flex", alignItems:"center", gap:10,
                                }}>
                                  <span style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", border: `2px solid ${selected?PRIMARY_COLOR:"#d1d5db"}`, background: selected ? PRIMARY_COLOR : "transparent" }}>{selected && <span style={{ width:8, height:8, borderRadius:"50%", background:"#fff" }} />}</span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <button onClick={() => setExamCurrentQ(q => Math.max(0, q-1))} disabled={examCurrentQ===0} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12, opacity:examCurrentQ===0?0.4:1 }}>← Précédent</button>
                      {examCurrentQ < examActif.questions.length - 1 ? <button onClick={() => setExamCurrentQ(q => q+1)} style={{ padding:"9px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Suivant →</button> : <button onClick={submitExam} disabled={Object.keys(examAnswers).length < examActif.questions.length} style={{ padding:"11px 22px", fontSize:14, background: Object.keys(examAnswers).length < examActif.questions.length ? "#9ca3af" : "#22c55e", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, opacity:1 }}>{Object.keys(examAnswers).length < examActif.questions.length ? `${examActif.questions.length - Object.keys(examAnswers).length} réponse(s) manquante(s)` : "✅ Soumettre l'examen"}</button>}
                    </div>
                  </div>
                )}
                {examStep === "result" && examActif && examResult && (
                  <div style={{ maxWidth:680, margin:"0 auto" }}>
                    <div style={{ borderRadius:16, overflow:"hidden", marginBottom:20, border:`2px solid ${examResult.passed?"#22c55e30":"#ef444430"}` }}>
                      <div style={{ background: examResult.passed ? "linear-gradient(135deg,#064e3b,#059669)" : "linear-gradient(135deg,#7f1d1d,#dc2626)", padding:"24px 28px", color:"#fff", textAlign:"center" }}>
                        <div style={{ fontSize:52, marginBottom:8 }}>{examResult.passed?"🎉":"😔"}</div>
                        <div style={{ fontSize:13, color: examResult.passed?"#6ee7b7":"#fca5a5", fontWeight:600, marginBottom:4 }}>{examResult.passed ? "EXAMEN RÉUSSI !" : "EXAMEN NON VALIDÉ"}</div>
                        <div style={{ fontSize:52, fontWeight:900, lineHeight:1 }}>{examResult.pct}%</div>
                        <div style={{ fontSize:14, color: examResult.passed?"#a7f3d0":"#fca5a5", marginTop:4 }}>Seuil de réussite : {examActif.passingScore}%</div>
                      </div>
                      <div style={{ padding:20, background:"#fff" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                          {[
                            { l:"Score", v:`${examResult.pct}%`, c: examResult.passed?"#22c55e":"#ef4444" },
                            { l:"Bonnes rép.", v:`${examResult.correct || examResult.score}/${examResult.nbQ || examResult.total}`, c:PRIMARY_COLOR },
                            { l:"Points", v:`${examResult.earned}/${examResult.total}`, c:"#7c3aed" },
                            { l:"Statut", v: examResult.passed?"Réussi":"Non validé", c: examResult.passed?"#22c55e":"#ef4444" },
                          ].map(s => <div key={s.l} style={{ textAlign:"center", padding:12, borderRadius:10, background:"#f8fafc" }}><div style={{ fontSize:11, color:"#9ca3af" }}>{s.l}</div><div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.v}</div></div>)}
                        </div>
                        <div style={{ marginBottom:16 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}><span style={{ color:"#9ca3af" }}>Score obtenu</span><span style={{ fontWeight:700, color: examResult.passed?"#22c55e":"#ef4444" }}>{examResult.pct}% / seuil {examActif.passingScore}%</span></div>
                          <div style={{ height:10, background:"#e5e7eb", borderRadius:5, overflow:"hidden", position:"relative" }}><div style={{ height:"100%", width:`${examActif.passingScore}%`, background:"#fcd34d", borderRadius:5, position:"absolute", opacity:0.4 }} /><div style={{ height:"100%", width:`${examResult.pct}%`, background: examResult.passed?"#22c55e":"#ef4444", borderRadius:5, position:"relative", zIndex:1 }} /></div>
                          <div style={{ fontSize:10, color:"#9ca3af", marginTop:3 }}>La ligne jaune indique le seuil de réussite ({examActif.passingScore}%)</div>
                        </div>
                        <div style={{ padding:"12px 16px", borderRadius:10, background: examResult.passed?"#f0fdf4":"#fff5f5", border:`1px solid ${examResult.passed?"#bbf7d0":"#fecaca"}`, fontSize:13, color: examResult.passed?"#166534":"#dc2626", marginBottom:16 }}>{examResult.passed ? "✨ Félicitations ! Vous avez validé ce module. Votre progression a été mise à jour. Continuez sur cette lancée !" : `💪 Pas de découragement ! Vous pouvez repasser l'examen (${examActif.maxTentatives - examActif.tentatives} tentative(s) restante(s)). Révisez les points où vous avez perdu des points.`}</div>
                      </div>
                    </div>
                    {examAnswers && Object.keys(examAnswers).length > 0 && (
                      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:20, marginBottom:20 }}>
                        <h3 style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:16 }}>📋 Correction détaillée</h3>
                        {examActif.questions.map((q, idx) => {
                          const isOk = examAnswers[q.id] === q.correct;
                          const answered = examAnswers[q.id];
                          return (
                            <div key={q.id} style={{ padding:"12px 14px", borderRadius:10, marginBottom:10, background: isOk?"#f0fdf4":"#fff5f5", border:`1px solid ${isOk?"#bbf7d0":"#fecaca"}` }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}><div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}><span style={{ fontWeight:700, fontSize:12, color:"#9ca3af" }}>Q{idx+1}</span><span style={{ padding:"2px 7px", borderRadius:6, fontSize:10, fontWeight:700, background:PRIMARY_LIGHT, color:PRIMARY_COLOR }}>{q.points}pt</span></div><span style={{ fontSize:18 }}>{isOk?"✅":"❌"}</span></div>
                              <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:"0 0 8px", lineHeight:1.5 }}>{q.text}</p>
                              {!isOk && answered && <div style={{ fontSize:12, color:"#dc2626", marginBottom:4 }}>Votre réponse : <strong>{answered}</strong></div>}
                              <div style={{ fontSize:12, color:"#16a34a", marginBottom: q.explanation?8:0 }}>Bonne réponse : <strong>{q.correct}</strong></div>
                              {q.explanation && <div style={{ padding:"7px 10px", borderRadius:6, background:"#f8fafc", fontSize:11, color:"#6b7280", borderLeft:"3px solid #94a3b8" }}>💡 {q.explanation}</div>}
                            </div>
                          );
              
              })}
                      </div>
                    )}
                    <div style={{ display:"flex", gap:10 }}><button onClick={() => { setExamStep("liste"); setExamActif(null); setExamResult(null); setExamAnswers({}); }} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>← Retour aux examens</button>{!examResult.passed && (examActif.maxTentatives - examActif.tentatives) > 0 && <button onClick={() => startExam(examActif)} style={{ padding:"9px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>🔄 Repasser l'examen</button>}</div>
                  </div>
                )}
              </div>
            )}

            {/* RÉSULTATS */}
            {activeTab === "resultats" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Mes Résultats</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{MES_RESULTATS.length} évaluations</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
                  {[
                    { l:"Moyenne générale", v:`${Math.round(MES_RESULTATS.filter(r=>r.maxScore===100).reduce((s,r)=>s+r.score,0)/MES_RESULTATS.filter(r=>r.maxScore===100).length)}%`, c:"#6366f1" },
                    { l:"Meilleur score",   v:"89%",    c:"#22c55e" },
                    { l:"Certifications",  v:certifCount, c:PRIMARY_COLOR },
                    { l:"Progression test",v:"+50 pts", c:"#059669", sub:"depuis TOEIC Blanc #1" },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign:"center", padding:14, borderRadius:10, background:"#f8fafc" }}>
                      <div style={{ fontSize:11, color:"#9ca3af" }}>{s.l}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                      {s.sub && <div style={{ fontSize:10, color:"#9ca3af" }}>{s.sub}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[...MES_RESULTATS].reverse().map(r => {
                    const norm = r.maxScore === 100 ? r.score : Math.round((r.score/r.maxScore)*100);
                    const typeColors = { positionnement:"#6b7280", evaluation:"#2563eb", quiz:"#7c3aed", examen_blanc:"#d97706", certification:"#059669" };
                    const isExpanded = expandedResult === r.id;
                    const couleur = scoreColor(r.score, r.maxScore);
                    return (
                      <div key={r.id} style={{ borderRadius:10, border:`1px solid ${isExpanded?couleur+"60":"#e5e7eb"}`, background:"#fff", overflow:"hidden" }}>
                        {/* En-tête cliquable */}
                        <div onClick={()=>setExpandedResult(isExpanded?null:r.id)} style={{ padding:"14px 16px", cursor:"pointer", userSelect:"none" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                            <div>
                              <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{r.titre}</div>
                              <div style={{ fontSize:12, color:"#9ca3af" }}>{r.cours} · 📅 {formatDateFull(r.date)}</div>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ textAlign:"right" }}>
                                <div style={{ fontSize:22, fontWeight:900, color:couleur }}>{r.score}{r.maxScore !== 100 ? `/${r.maxScore}` : "%"}</div>
                                <span style={{ padding:"2px 8px", borderRadius:8, fontSize:10, fontWeight:700, background:(typeColors[r.type]||"#6b7280")+"15", color:typeColors[r.type]||"#6b7280" }}>{r.type.replace("_"," ")}</span>
                              </div>
                              <span style={{ fontSize:12, color:"#9ca3af", transition:"transform .2s", display:"inline-block", transform:isExpanded?"rotate(180deg)":"none" }}>▼</span>
                            </div>
                          </div>
                          <ProgressBar value={norm} color={couleur} height={6} />
                        </div>
                        {/* Détail déroulant */}
                        {isExpanded && (
                          <div style={{ padding:"14px 16px", borderTop:`1px solid ${couleur}30`, background:"#fafafa" }}>
                            {r.commentaire && (
                              <div style={{ padding:"10px 14px", borderRadius:8, background:"#fff", border:`1px solid ${couleur}30`, fontSize:13, color:"#374151", borderLeft:`4px solid ${couleur}`, marginBottom:14 }}>
                                💬 <strong>Commentaire du coach :</strong> {r.commentaire}
                              </div>
                            )}
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
                              {[
                                { l:"Score obtenu", v:`${r.score}${r.maxScore!==100?`/${r.maxScore}`:`/100`}`, c:couleur },
                                { l:"Pourcentage", v:`${norm}%`, c:couleur },
                                { l:"Résultat", v:norm>=60?"✅ Validé":"❌ Non validé", c:norm>=60?"#22c55e":"#ef4444" },
                              ].map(s=>(
                                <div key={s.l} style={{ textAlign:"center", padding:"10px 12px", borderRadius:8, background:"#fff", border:"1px solid #e5e7eb" }}>
                                  <div style={{ fontSize:10, color:"#9ca3af" }}>{s.l}</div>
                                  <div style={{ fontSize:16, fontWeight:800, color:s.c }}>{s.v}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                              <div style={{ padding:"10px 14px", borderRadius:8, background:"#fff", border:"1px solid #e5e7eb", fontSize:12 }}>
                                <div style={{ fontWeight:600, color:"#374151", marginBottom:6 }}>📊 Répartition des points</div>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ color:"#6b7280" }}>Points obtenus</span><strong style={{ color:couleur }}>{r.score}</strong></div>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ color:"#6b7280" }}>Points possibles</span><strong>{r.maxScore}</strong></div>
                                <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:"#6b7280" }}>Points perdus</span><strong style={{ color:"#ef4444" }}>{r.maxScore-r.score}</strong></div>
                              </div>
                              <div style={{ padding:"10px 14px", borderRadius:8, background:"#fff", border:"1px solid #e5e7eb", fontSize:12 }}>
                                <div style={{ fontWeight:600, color:"#374151", marginBottom:6 }}>🎯 Niveau évalué</div>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ color:"#6b7280" }}>Niveau ciblé</span><strong style={{ color:NIVEAU_META[r.niveau]?.color||"#374151" }}>{r.niveau}</strong></div>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ color:"#6b7280" }}>Type</span><strong>{r.type.replace("_"," ")}</strong></div>
                                <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:"#6b7280" }}>Date</span><strong>{formatDateFull(r.date)}</strong></div>
                              </div>
                            </div>
                            <div style={{ height:8, background:"#e5e7eb", borderRadius:4, overflow:"hidden", position:"relative" }}>
                              <div style={{ position:"absolute", top:0, left:`${60}%`, width:2, height:"100%", background:"#fbbf24", zIndex:1 }} />
                              <div style={{ height:"100%", width:`${norm}%`, background:couleur, borderRadius:4 }} />
                            </div>
                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#9ca3af", marginTop:3 }}>
                              <span>0%</span><span style={{ color:"#f59e0b" }}>Seuil 60%</span><span>100%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OBJECTIFS */}
            {activeTab === "objectifs" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Mes Objectifs</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Suivi de vos objectifs personnels</p></div>
                </div>
                <div style={{ padding:20, borderRadius:12, background:GRADIENT_HEADER, color:"#fff", marginBottom:24 }}>
                  <div style={{ fontSize:12, color:"#fecaca", marginBottom:6 }}>OBJECTIF PRINCIPAL</div>
                  <div style={{ fontSize:17, fontWeight:700, marginBottom:16 }}>{MON_PROFIL.objectif}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}><div style={{ flex:1, height:10, background:"rgba(255,255,255,0.2)", borderRadius:5, overflow:"hidden" }}><div style={{ height:"100%", width:`${MON_PROFIL.progression}%`, background:"#f87171", borderRadius:5 }} /></div><span style={{ fontSize:18, fontWeight:800, color:"#f87171" }}>{MON_PROFIL.progression}%</span></div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {MES_OBJECTIFS.map(o => {
                    const statusColors = { en_cours:{ bg:"#dbeafe", c:"#1e40af" }, presque:{ bg:"#dcfce7", c:"#166534" }, atteint:{ bg:"#dcfce7", c:"#166534" } };
                    const sm = statusColors[o.statut] || statusColors.en_cours;
                    const progColor = o.progression>=80?"#22c55e":o.progression>=50?PRIMARY_COLOR:"#f59e0b";
                    return (
                      <div key={o.id} style={{ padding:"16px 20px", borderRadius:12, background:"#fff", border:"1px solid #e5e7eb" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                          <div><div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{o.titre}</div><div style={{ fontSize:12, color:"#9ca3af" }}>📅 Échéance : {formatDateFull(o.echeance)}</div></div>
                          <span style={{ padding:"4px 10px", borderRadius:10, fontSize:11, fontWeight:700, background:sm.bg, color:sm.c }}>{o.statut.replace("_"," ")}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ position:"relative", flexShrink:0 }}><ProgressRing pct={o.progression} size={56} stroke={5} color={progColor} /><div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:progColor }}>{o.progression}%</div></div>
                          <div style={{ flex:1 }}><ProgressBar value={o.progression} color={progColor} height={8} /><div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{o.progression >= 80 ? "Presque atteint ! 🎉" : o.progression >= 50 ? "Bonne progression 👍" : "Continuez vos efforts 💪"}</div></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CERTIFICATIONS */}
            {activeTab === "certifications" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Mes Certifications</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{certifCount} certification(s) obtenue(s)</p></div>
                </div>
                {MES_CERTIFICATIONS.map(c => {
                  const m = NIVEAU_META[c.niveau];
                  return (
                    <div key={c.id} style={{ padding:24, borderRadius:14, border:`2px solid ${m.color}40`, background:"#fff", marginBottom:16, position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:m.color+"08" }} />
                      <div style={{ display:"flex", alignItems:"flex-start", gap:20 }}>
                        <div style={{ width:70, height:70, borderRadius:14, background:m.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, flexShrink:0, border:`2px solid ${m.color}30` }}>🏅</div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", gap:8, marginBottom:6 }}><span style={{ padding:"3px 10px", borderRadius:10, fontSize:11, fontWeight:700, background:m.bg, color:m.color }}>Niveau {c.niveau} — {m.label}</span><span style={{ padding:"3px 10px", borderRadius:10, fontSize:11, fontWeight:700, background:"#dcfce7", color:"#166534" }}>✅ Valide</span></div>
                          <div style={{ fontSize:18, fontWeight:800, color:"#0f172a", marginBottom:4 }}>{c.titre}</div>
                          <div style={{ fontSize:12, color:"#6b7280" }}>Cours : {c.cours} · Score : <strong style={{ color:m.color }}>{c.score}%</strong></div>
                          <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>📅 Obtenu le {formatDateFull(c.date)} · Expire le {formatDateFull(c.expire)}</div>
                        </div>
                        <button onClick={()=>toast.success("Téléchargement du certificat...")} style={{ padding:"9px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12, flexShrink:0 }}>⬇️ Télécharger</button>
                      </div>
                    </div>
                  );
                })}
                <div style={{ background:"#f8fafc", borderRadius:12, padding:20, marginTop:16 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12 }}>🎯 Prochaines certifications visées</h3>
                  {[
                    { titre:"TOEIC 850+", date:"Fév. 2026", progression:76, color:"#7c3aed" },
                    { titre:"Certificate C1 — BET", date:"Juin 2026", progression:40, color:PRIMARY_COLOR },
                  ].map(cert => (
                    <div key={cert.titre} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14, padding:"10px 12px", borderRadius:8, background:"#fff", border:"1px solid #e5e7eb" }}>
                      <span style={{ fontSize:22 }}>🎯</span>
                      <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{cert.titre} <span style={{ fontSize:11, color:"#9ca3af" }}>— Objectif {cert.date}</span></div><ProgressBar value={cert.progression} color={cert.color} /></div>
                      <span style={{ fontWeight:800, color:cert.color, fontSize:15, minWidth:34 }}>{cert.progression}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* CONTACTS & SUPPORT */}
            {activeTab === "contacts" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Contacts administration</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Joignez facilement les services BET</p></div>
                  <button onClick={()=>setShowRequestModal(true)} style={{ padding:"9px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>📝 Formulaire de requête</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:16 }}>
                  {CONTACTS_ADMIN.map(contact => (
                    <div key={contact.id} style={{ background:"#fff", borderRadius:12, border:`1px solid ${PRIMARY_COLOR}20`, padding:16 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}><div style={{ width:40, height:40, borderRadius:"50%", background:PRIMARY_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:PRIMARY_COLOR }}>👤</div><div><div style={{ fontWeight:700, fontSize:14 }}>{contact.nom}</div><div style={{ fontSize:11, color:"#6b7280" }}>{contact.role}</div></div></div>
                      <div style={{ marginBottom:8, fontSize:12, color:"#374151" }}><span style={{ fontWeight:600 }}>📞</span> {contact.tel}</div>
                      <div style={{ marginBottom:8, fontSize:12, color:"#374151" }}><span style={{ fontWeight:600 }}>✉️</span> {contact.email}</div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:12 }}>📅 {contact.disponible}</div>
                      <div style={{ display:"flex", gap:8 }}><a href={`tel:${contact.tel}`} style={{ flex:1, textAlign:"center", padding:"6px", background:PRIMARY_LIGHT, color:PRIMARY_DARK, textDecoration:"none", borderRadius:6, fontSize:12, fontWeight:600 }}>📞 Appeler</a><a href={`mailto:${contact.email}`} style={{ flex:1, textAlign:"center", padding:"6px", background:PRIMARY_LIGHT, color:PRIMARY_DARK, textDecoration:"none", borderRadius:6, fontSize:12, fontWeight:600 }}>✉️ Email</a></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BOUTIQUE */}
            {activeTab === "boutique" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Boutique BET</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Cours supplémentaires, vidéos et livres</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:20 }}>
                  {PRODUITS_BOUTIQUE.map(produit => (
                    <div key={produit.id} style={{ borderRadius:12, border:`1px solid ${PRIMARY_COLOR}20`, background:"#fff", padding:16, textAlign:"center" }}>
                      <div style={{ fontSize:48, marginBottom:8 }}>{produit.image}</div>
                      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{produit.titre}</h3>
                      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:8 }}>{produit.type}</div>
                      <p style={{ fontSize:12, color:"#6b7280", marginBottom:12 }}>{produit.description}</p>
                      <div style={{ fontSize:20, fontWeight:800, color:PRIMARY_COLOR, marginBottom:12 }}>{produit.prix}</div>
                      <button onClick={()=>{ setSelectedProduit(produit); setShowAchatModal(true); setAchatForm({ mode:"orange_money", nom:"", email:"" }); }} style={{ width:"100%", padding:"8px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600 }}>🛒 Acheter</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {activeTab === "messages" && (
              <div>
                {activeConvMsg ? (
                  /* ── VUE CONVERSATION ── */
                  <div>
                    <button onClick={()=>{ setActiveConvMsg(null); setConvReply(""); }} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"none", border:"none", color:PRIMARY_COLOR, cursor:"pointer", fontWeight:600, fontSize:13, marginBottom:16 }}>← Retour aux messages</button>
                    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, background:"#f8fafc", border:"1px solid #e5e7eb", marginBottom:16 }}>
                      <div style={{ width:40, height:40, borderRadius:"50%", background:activeConvMsg.type==="gestionnaire"?"#fef3c7":activeConvMsg.type==="admin"?"#dbeafe":PRIMARY_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:activeConvMsg.type==="gestionnaire"?"#92400e":activeConvMsg.type==="admin"?"#1e40af":PRIMARY_COLOR }}>{activeConvMsg.avatar}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{activeConvMsg.expediteur}</div>
                        <div style={{ fontSize:11, color:"#9ca3af" }}>{activeConvMsg.objet}</div>
                      </div>
                    </div>
                    <div style={{ minHeight:300, maxHeight:420, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, padding:"0 4px", marginBottom:14 }}>
                      {/* message reçu */}
                      <div style={{ display:"flex", gap:10, maxWidth:"75%" }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:activeConvMsg.type==="gestionnaire"?"#fef3c7":activeConvMsg.type==="admin"?"#dbeafe":PRIMARY_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11, color:activeConvMsg.type==="gestionnaire"?"#92400e":activeConvMsg.type==="admin"?"#1e40af":PRIMARY_COLOR, flexShrink:0 }}>{activeConvMsg.avatar}</div>
                        <div>
                          <div style={{ padding:"10px 14px", borderRadius:"0 12px 12px 12px", background:"#f3f4f6", fontSize:13, color:"#374151", lineHeight:1.6 }}>{activeConvMsg.message}</div>
                          <div style={{ fontSize:10, color:"#9ca3af", marginTop:4 }}>{activeConvMsg.expediteur} · {activeConvMsg.date}</div>
                        </div>
                      </div>
                      {/* réponses envoyées dans cette conversation */}
                      {messages.filter(m=>m.conversationId===activeConvMsg.id).map(r=>(
                        <div key={r.id} style={{ display:"flex", gap:10, maxWidth:"75%", alignSelf:"flex-end", flexDirection:"row-reverse" }}>
                          <div style={{ width:32, height:32, borderRadius:"50%", background:PRIMARY_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11, color:PRIMARY_COLOR, flexShrink:0 }}>{MON_PROFIL.avatar}</div>
                          <div>
                            <div style={{ padding:"10px 14px", borderRadius:"12px 0 12px 12px", background:PRIMARY_COLOR, color:"#fff", fontSize:13, lineHeight:1.6 }}>{r.message}</div>
                            <div style={{ fontSize:10, color:"#9ca3af", marginTop:4, textAlign:"right" }}>Moi · {r.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <textarea value={convReply} onChange={e=>setConvReply(e.target.value)} onKeyDown={e=>{ if(e.ctrlKey&&e.key==="Enter") sendConvReply(); }} placeholder="Votre réponse… (Ctrl+Entrée pour envoyer)" style={{ flex:1, padding:"10px 12px", borderRadius:8, border:"1px solid #d1d5db", fontSize:13, resize:"none", height:72, fontFamily:"inherit" }}/>
                      <button onClick={sendConvReply} style={{ padding:"10px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:14, alignSelf:"flex-end", height:72 }}>📨</button>
                    </div>
                  </div>
                ) : (
                  /* ── VUE LISTE ── */
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                      <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Messages</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{messages.filter(m=>!m.lu).length} non lu(s) · {messages.length} au total</p></div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>setShowSignalModal(true)} style={{ padding:"8px 14px", background:"#f97316", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⚠️ Signaler un problème</button>
                        {messages.filter(m=>!m.lu).length > 0 && <button onClick={()=>setMessages(m=>m.map(x=>({...x,lu:true})))} style={{ padding:"8px 14px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>✓ Tout lu</button>}
                      </div>
                    </div>
                    {/* Filtres par type */}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
                      {[["Tous","Tous"],["prof","👨‍🏫 Professeurs"],["gestionnaire","💼 Gestionnaire"],["admin","🏫 Admin"],["envoye","📤 Envoyés"]].map(([val,lbl])=>(
                        <button key={val} onClick={()=>setFilterMsgType(val)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:12, cursor:"pointer", fontWeight:filterMsgType===val?700:400,
                          background: filterMsgType===val?(val==="gestionnaire"?"#fef3c7":val==="admin"?"#dbeafe":PRIMARY_LIGHT):"#fff",
                          color: filterMsgType===val?(val==="gestionnaire"?"#92400e":val==="admin"?"#1e40af":PRIMARY_COLOR):"#6b7280",
                          borderColor: filterMsgType===val?(val==="gestionnaire"?"#fcd34d":val==="admin"?"#93c5fd":PRIMARY_COLOR):"#e5e7eb",
                        }}>{lbl}</button>
                      ))}
                    </div>
                    {messagesFiltres.length === 0 && <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>Aucun message dans cette catégorie</div>}
                    {messagesFiltres.map(m => (
                      <div key={m.id} onClick={()=>{ if(m.sens!=="envoye"){ setActiveConvMsg(m); setMessages(prev=>prev.map(x=>x.id===m.id?{...x,lu:true}:x)); } }} style={{ display:"flex", gap:14, padding:"14px 16px", borderRadius:10, marginBottom:8, cursor:m.sens!=="envoye"?"pointer":"default", background: m.lu?"#fff":m.type==="gestionnaire"?"#fffbeb":PRIMARY_LIGHT, border:`1px solid ${m.lu?"#e5e7eb":m.type==="gestionnaire"?"#fcd34d":PRIMARY_COLOR+"40"}` }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", background:m.type==="gestionnaire"?"#fef3c7":m.type==="admin"?"#dbeafe":m.sens==="envoye"?"#f3f4f6":PRIMARY_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:m.type==="gestionnaire"?"#92400e":m.type==="admin"?"#1e40af":PRIMARY_COLOR, flexShrink:0 }}>{m.avatar}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                            <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{m.expediteur}</span>
                            <span style={{ fontSize:11, color:"#9ca3af" }}>{m.date}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                            <span style={{ fontWeight:m.lu?400:600, fontSize:13, color:m.lu?"#6b7280":"#0f172a" }}>{m.objet}</span>
                            {m.type==="gestionnaire" && !m.lu && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:8, background:"#fef3c7", color:"#92400e", fontWeight:700 }}>Gestionnaire</span>}
                          </div>
                          <div style={{ fontSize:12, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.message}</div>
                        </div>
                        {!m.lu && m.sens!=="envoye" && <div style={{ width:8, height:8, borderRadius:"50%", background:m.type==="gestionnaire"?"#f59e0b":PRIMARY_COLOR, flexShrink:0, marginTop:8 }} />}
                        {m.sens==="envoye" && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:"#f3f4f6", color:"#6b7280", alignSelf:"flex-start", flexShrink:0 }}>Envoyé</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* PAIEMENT */}
            {activeTab === "paiement" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Mes Paiements</h2>
                    <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Historique et suivi de vos règlements</p>
                  </div>
                  <button onClick={() => setShowPaiementModal(true)} style={{ padding:"10px 20px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
                    💳 Faire un paiement
                  </button>
                </div>

                {/* Résumé */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))", gap:12, marginBottom:24 }}>
                  {[
                    { label:"Total payé",      value:`${MON_PROFIL.paiements.filter(p=>p.statut==="payé").reduce((s,p)=>s+p.montant,0).toLocaleString("fr-FR")} FCFA`, color:"#16a34a", icon:"✅" },
                    { label:"En attente",      value:`${MON_PROFIL.paiements.filter(p=>p.statut==="attente").reduce((s,p)=>s+p.montant,0).toLocaleString("fr-FR")} FCFA`, color:"#f59e0b", icon:"⏳" },
                    { label:"Nb de paiements", value:MON_PROFIL.paiements.length, color:PRIMARY_COLOR, icon:"🧾" },
                  ].map(s => (
                    <div key={s.label} style={{ background:"#fff", padding:"14px 16px", borderRadius:12, border:"1px solid #e5e7eb", display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:10, background:s.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon}</div>
                      <div><div style={{ fontSize:11, color:"#9ca3af" }}>{s.label}</div><div style={{ fontSize:17, fontWeight:800, color:s.color }}>{s.value}</div></div>
                    </div>
                  ))}
                </div>

                {/* Tableau */}
                <div style={{ overflowX:"auto", borderRadius:12, border:"1px solid #e5e7eb" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"#f8fafc" }}>
                        {["Référence","Date","Description","Cours","Montant (FCFA)","Mode de paiement","Statut"].map(h => (
                          <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:12, borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MON_PROFIL.paiements.map((p, i) => {
                        const isPayé = p.statut === "payé";
                        return (
                          <tr key={p.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", borderBottom:"1px solid #f1f5f9" }}>
                            <td style={{ padding:"12px 14px", fontWeight:600, color:"#6366f1", fontFamily:"monospace", fontSize:12 }}>{p.id}</td>
                            <td style={{ padding:"12px 14px", color:"#374151", whiteSpace:"nowrap" }}>{new Date(p.date).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}</td>
                            <td style={{ padding:"12px 14px", color:"#0f172a", fontWeight:500 }}>{p.description}</td>
                            <td style={{ padding:"12px 14px", color:"#6b7280" }}>{p.cours}</td>
                            <td style={{ padding:"12px 14px", fontWeight:700, color:isPayé?"#16a34a":"#f59e0b" }}>{p.montant.toLocaleString("fr-FR")}</td>
                            <td style={{ padding:"12px 14px", color:"#374151" }}>{p.mode}</td>
                            <td style={{ padding:"12px 14px" }}>
                              <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:isPayé?"#dcfce7":"#fef3c7", color:isPayé?"#166534":"#92400e" }}>
                                {isPayé ? "✅ Payé" : "⏳ En attente"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop:16, padding:"10px 14px", borderRadius:8, background:"#fef3c7", border:"1px solid #fcd34d", fontSize:12, color:"#92400e" }}>
                  ⚠️ Pour toute question concernant un paiement, contactez le service clientèle : <strong>client@bet-formation.com</strong>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* ══ MODAL EXAM INFO ══ */}
        {showExamInfoModal && examActif && (
          <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ background:"#fff", borderRadius:18, maxWidth:560, width:"100%", overflow:"hidden", boxShadow:"0 25px 60px rgba(0,0,0,0.4)" }}>
              {/* Header */}
              <div style={{ background: examActif.categorie==="examen" ? "linear-gradient(135deg,#4c1d95,#7c3aed)" : GRADIENT_HEADER, padding:"22px 26px", color:"#fff" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:4, fontWeight:600, letterSpacing:1 }}>
                  {examActif.categorie==="examen" ? "🎓 EXAMEN OFFICIEL CERTIFIANT" : "📝 ÉVALUATION DE MODULE"}
                </div>
                <h2 style={{ margin:"0 0 6px", fontSize:19, fontWeight:800 }}>{examActif.titre}</h2>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>{examActif.cours} · {examActif.formateur}</div>
              </div>
              <div style={{ padding:24 }}>
                <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, marginBottom:18 }}>{examActif.description}</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                  {[
                    { icon:"❓", l:"Questions", v:`${examActif.nbQuestions} questions` },
                    { icon:"⏱", l:"Durée", v:`${examActif.dureeMinutes} minutes` },
                    { icon:"🎯", l:"Seuil de réussite", v:`${examActif.passingScore}% minimum` },
                    { icon:"🔄", l:"Tentatives restantes", v:`${examActif.maxTentatives - examActif.tentatives} / ${examActif.maxTentatives}` },
                  ].map(s => (
                    <div key={s.l} style={{ display:"flex", gap:10, padding:12, borderRadius:10, background:"#f8fafc", alignItems:"center" }}>
                      <span style={{ fontSize:20 }}>{s.icon}</span>
                      <div><div style={{ fontSize:10, color:"#9ca3af" }}>{s.l}</div><div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{s.v}</div></div>
                    </div>
                  ))}
                </div>
                {/* Règles anti-triche */}
                <div style={{ padding:"12px 14px", borderRadius:10, background:"#fef2f2", border:"1px solid #fecaca", marginBottom:20 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:"#dc2626", marginBottom:8 }}>🔒 Règles de surveillance — à lire avant de commencer</div>
                  {[
                    "Ne changez pas d'onglet ni de fenêtre pendant l'examen",
                    "Copier / coller et clic droit sont désactivés",
                    "Raccourcis clavier suspects (Ctrl+C, Ctrl+V…) sont bloqués",
                    "3 infractions → soumission automatique immédiate",
                    "Le chronomètre se lance dès le début et ne s'arrête pas",
                  ].map((r,i) => (
                    <div key={i} style={{ display:"flex", gap:8, fontSize:12, color:"#374151", marginBottom:4 }}>
                      <span style={{ color:"#dc2626", flexShrink:0 }}>•</span>{r}
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={launchQuiz} style={{ flex:1, padding:"12px", fontSize:14, textAlign:"center", background: examActif.categorie==="examen"?"#7c3aed":PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700 }}>
                    {examActif.categorie==="examen" ? "🎓 Démarrer l'examen" : "▶️ Démarrer l'évaluation"}
                  </button>
                  <button onClick={()=>setShowExamInfoModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:12 }}>Annuler</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ACHAT BOUTIQUE */}
        {showAchatModal && selectedProduit && (
          <Modal title={`🛒 Acheter — ${selectedProduit.titre}`} onClose={()=>setShowAchatModal(false)} wide>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
              <div style={{ textAlign:"center", padding:20, borderRadius:12, background:PRIMARY_LIGHT, border:`1px solid ${PRIMARY_COLOR}20` }}>
                <div style={{ fontSize:52, marginBottom:8 }}>{selectedProduit.image}</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#0f172a", marginBottom:4 }}>{selectedProduit.titre}</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:8 }}>{selectedProduit.type}</div>
                <p style={{ fontSize:12, color:"#6b7280", marginBottom:12 }}>{selectedProduit.description}</p>
                <div style={{ fontSize:28, fontWeight:900, color:PRIMARY_COLOR }}>{selectedProduit.prix}</div>
              </div>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Nom complet *</label>
                <input type="text" value={achatForm.nom} onChange={e=>setAchatForm(f=>({...f,nom:e.target.value}))} placeholder="Votre nom complet" style={{ width:"100%", padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, boxSizing:"border-box", marginBottom:12 }}/>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Email *</label>
                <input type="email" value={achatForm.email} onChange={e=>setAchatForm(f=>({...f,email:e.target.value}))} placeholder="votre@email.com" style={{ width:"100%", padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, boxSizing:"border-box", marginBottom:12 }}/>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>Moyen de paiement *</label>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                  {[["orange_money","📱 Orange Money"],["wave","🌊 Wave"],["virement","🏦 Virement bancaire"],["especes","💵 Espèces (en centre)"]].map(([val,lbl])=>(
                    <button key={val} onClick={()=>setAchatForm(f=>({...f,mode:val}))} style={{ padding:"9px 14px", borderRadius:8, border:"1px solid", fontSize:13, cursor:"pointer", textAlign:"left", fontWeight:achatForm.mode===val?700:400, background:achatForm.mode===val?PRIMARY_LIGHT:"#fff", color:achatForm.mode===val?PRIMARY_COLOR:"#374151", borderColor:achatForm.mode===val?PRIMARY_COLOR:"#d1d5db" }}>{lbl}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding:"12px 16px", borderRadius:8, background:"#fef3c7", border:"1px solid #fcd34d", fontSize:12, color:"#92400e", marginBottom:16 }}>
              ⚠️ En cliquant sur "Confirmer", votre commande sera enregistrée. L'accès au contenu sera activé après validation du paiement par notre équipe.
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>setShowAchatModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Annuler</button>
              <button onClick={()=>{ if(!achatForm.nom.trim()||!achatForm.email.trim()){ toast.error("Veuillez remplir votre nom et email."); return; } toast.success(`✅ Commande de "${selectedProduit.titre}" enregistrée ! Vous recevrez un email de confirmation à ${achatForm.email}.`); setShowAchatModal(false); }} style={{ padding:"9px 20px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:13 }}>💳 Confirmer la commande — {selectedProduit.prix}</button>
            </div>
          </Modal>
        )}

        {/* MODAL PAIEMENT */}
        {showPaiementModal && (
          <div style={modalOverlay}>
            <div style={{ ...modalBox, width:480 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <h3 style={{ margin:0, fontSize:16 }}>💳 Faire un paiement</h3>
                <button onClick={()=>setShowPaiementModal(false)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#6b7280" }}>✕</button>
              </div>
              <div style={{ padding:"12px 14px", borderRadius:8, background:PRIMARY_LIGHT, border:`1px solid ${PRIMARY_COLOR}30`, marginBottom:18, fontSize:13, color:PRIMARY_COLOR }}>
                Paiement en attente : <strong>Renouvellement T4</strong> — 250 000 FCFA
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, marginBottom:4 }}>Montant (FCFA)</label>
                <input type="number" defaultValue={250000} readOnly style={{ width:"100%", padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, background:"#f8fafc", boxSizing:"border-box" }} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, marginBottom:4 }}>Mode de paiement</label>
                <select style={{ width:"100%", padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13 }}>
                  <option>Orange Money</option>
                  <option>Wave</option>
                  <option>Virement bancaire</option>
                  <option>Espèces (en centre)</option>
                </select>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, marginBottom:4 }}>Référence / Note (optionnel)</label>
                <input type="text" placeholder="Ex: Reçu n°12345" style={{ width:"100%", padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, boxSizing:"border-box" }} />
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button onClick={()=>setShowPaiementModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Annuler</button>
                <button onClick={()=>{ toast.success("Demande de paiement envoyée ! Notre équipe vous contactera sous 24h."); setShowPaiementModal(false); }} style={{ padding:"9px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:12 }}>Confirmer le paiement</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DÉTAIL COURS */}
        {showCoursModal && selectedCours && (
          <Modal title={selectedCours.titre} onClose={()=>{ setShowCoursModal(false); setExpandedModule(null); }} wide>
            <div style={{ display:"flex", gap:14, alignItems:"flex-start", paddingBottom:16, borderBottom:"1px solid #e5e7eb", marginBottom:16 }}>
              <span style={{ fontSize:40 }}>{selectedCours.emoji}</span>
              <div style={{ flex:1 }}><div style={{ fontSize:18, fontWeight:800, color:"#0f172a" }}>{selectedCours.titre}</div><div style={{ fontSize:13, color:"#6b7280" }}>👤 {selectedCours.formateur}</div><div style={{ marginTop:6 }}><NiveauBadge niveau={selectedCours.niveau} /></div></div>
              <span style={{ padding:"5px 12px", borderRadius:14, fontSize:12, fontWeight:700, background:STATUT_COURS[selectedCours.statut]?.bg, color:STATUT_COURS[selectedCours.statut]?.c }}>{STATUT_COURS[selectedCours.statut]?.label}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
              {[
                { l:"Progression", v:`${selectedCours.progression}%`, c:selectedCours.color },
                { l:"Heures", v:`${selectedCours.heuresFaites}h / ${selectedCours.heures}h`, c:"#374151" },
                { l:"Modules", v:`${selectedCours.modules.filter(m=>m.done).length}/${selectedCours.modules.length}`, c:"#6366f1" },
              ].map(s => <div key={s.l} style={{ textAlign:"center", padding:12, borderRadius:8, background:"#f8fafc" }}><div style={{ fontSize:11, color:"#9ca3af" }}>{s.l}</div><div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.v}</div></div>)}
            </div>
            <div style={{ marginBottom:14 }}><ProgressBar value={selectedCours.progression} color={selectedCours.color} height={10} /></div>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:16, lineHeight:1.6 }}>{selectedCours.description}</p>
            <h4 style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:10 }}>Modules du cours — cliquez pour voir le détail</h4>
            {selectedCours.modules.map((mod, i) => {
              const isExpanded = expandedModule === i;
              const moduleDetails = {
                objectifs: ["Comprendre et utiliser le vocabulaire clé", "Maîtriser les structures grammaticales liées", "Pratiquer à l'oral et à l'écrit"],
                blocs: [
                  { icon:"📖", titre:"Vocabulaire essentiel", desc:"20 mots et expressions clés avec exemples", duree:"15 min" },
                  { icon:"🎧", titre:"Écoute active", desc:"2 dialogues audio avec exercices de compréhension", duree:"20 min" },
                  { icon:"✏️", titre:"Exercices pratiques", desc:"10 exercices de mise en application", duree:"25 min" },
                  { icon:"❓", titre:"Quiz de validation", desc:"QCM 10 questions — score minimum 60%", duree:"10 min" },
                ],
              };
              return (
                <div key={i} style={{ marginBottom:8, borderRadius:10, border:`1px solid ${mod.done?"#bbf7d0":"#e5e7eb"}`, overflow:"hidden" }}>
                  <div onClick={()=>setExpandedModule(isExpanded?null:i)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", background:mod.done?"#f0fdf4":isExpanded?"#f8fafc":"#fff", userSelect:"none" }}>
                    <span style={{ fontSize:18 }}>{mod.done?"✅":"⭕"}</span>
                    <span style={{ flex:1, fontSize:13, fontWeight:600, color:mod.done?"#166534":"#374151" }}>{mod.nom}</span>
                    <span style={{ fontSize:11, padding:"2px 7px", borderRadius:6, background:mod.done?"#dcfce7":"#f3f4f6", color:mod.done?"#166534":"#6b7280" }}>{mod.done?"Terminé":"En cours"}</span>
                    <span style={{ fontSize:12, color:"#9ca3af", transition:"transform .2s", display:"inline-block", transform:isExpanded?"rotate(180deg)":"none" }}>▼</span>
                  </div>
                  {isExpanded && (
                    <div style={{ padding:"14px 16px", background:"#fafafa", borderTop:"1px solid #e5e7eb" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>🎯 Objectifs pédagogiques</div>
                      <ul style={{ margin:"0 0 14px 0", paddingLeft:18 }}>
                        {moduleDetails.objectifs.map((o,idx)=><li key={idx} style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>{o}</li>)}
                      </ul>
                      <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>📦 Contenu du module</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {moduleDetails.blocs.map((b,idx)=>(
                          <div key={idx} style={{ display:"flex", gap:8, padding:"8px 10px", borderRadius:8, background:"#fff", border:"1px solid #e5e7eb" }}>
                            <span style={{ fontSize:16 }}>{b.icon}</span>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{b.titre}</div>
                              <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>{b.desc}</div>
                              <div style={{ fontSize:10, color:"#6b7280", marginTop:2 }}>⏱ {b.duree}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!mod.done && <button onClick={()=>{ toast.success(`Module "${mod.nom}" — Accès au contenu`); }} style={{ marginTop:12, padding:"7px 14px", background:selectedCours.color, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>▶️ Accéder au module</button>}
                    </div>
                  )}
                </div>
              );
            })}
            {selectedCours.prochaineCours && <div style={{ marginTop:14, padding:"10px 14px", borderRadius:8, background:PRIMARY_LIGHT, border:`1px solid ${PRIMARY_COLOR}30`, fontSize:12, color:PRIMARY_COLOR, fontWeight:600 }}>📅 Prochaine session : {new Date(selectedCours.prochaineCours).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", hour:"2-digit", minute:"2-digit" })}</div>}
            <button onClick={()=>{ setShowCoursModal(false); setExpandedModule(null); }} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12, marginTop:16 }}>Fermer</button>
          </Modal>
        )}

        {/* MODAL MESSAGE */}
        {showMessageModal && selectedMsg && (
          <Modal title={selectedMsg.objet} onClose={()=>setShowMsgModal(false)}>
            <div style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:14, borderBottom:"1px solid #e5e7eb", marginBottom:14 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:selectedMsg.type==="gestionnaire"?"#fef3c7":PRIMARY_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:selectedMsg.type==="gestionnaire"?"#92400e":PRIMARY_COLOR }}>{selectedMsg.avatar}</div>
              <div><div style={{ fontWeight:700, fontSize:14 }}>{selectedMsg.expediteur}</div><div style={{ fontSize:12, color:"#9ca3af" }}>📅 {formatDateFull(selectedMsg.date)}</div></div>
            </div>
            <p style={{ fontSize:14, color:"#374151", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{selectedMsg.message}</p>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={()=>{ setActiveConvMsg(selectedMsg); setShowMsgModal(false); setActiveTab("messages"); }} style={{ padding:"9px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>↩️ Répondre dans le chat</button>
              <button onClick={()=>setShowMsgModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Fermer</button>
            </div>
          </Modal>
        )}

        {/* MODAL RESSOURCE VIEWER */}
        {showRessModal && selectedRess && (
          <Modal title={selectedRess.titre} onClose={()=>setShowRessModal(false)} wide>
            {selectedRess.type === "video" && (
              <div>
                <div style={{ position:"relative", paddingBottom:"56.25%", background:"#000", borderRadius:8, overflow:"hidden", marginBottom:16 }}>
                  <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title={selectedRess.titre} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%" }} />
                </div>
                <div style={{ display:"flex", gap:12, fontSize:12, color:"#6b7280", marginBottom:14 }}>
                  <span>⏱ {selectedRess.duree}</span>
                  <span>📚 {selectedRess.cours}</span>
                  <span style={{ padding:"2px 8px", borderRadius:8, background:"#ede9fe", color:"#5b21b6", fontWeight:600 }}>🎬 Vidéo</span>
                </div>
                <p style={{ fontSize:13, color:"#6b7280" }}>Cette vidéo pédagogique fait partie de votre parcours de formation BET. Regardez-la dans un endroit calme.</p>
              </div>
            )}
            {selectedRess.type === "audio" && (
              <AudioPlayer
                url={selectedRess.audioUrl}
                titre={selectedRess.titre}
                cours={selectedRess.cours}
                duree={selectedRess.duree}
                description={selectedRess.description || "Podcast d'entraînement à la compréhension orale. Écoutez attentivement puis prenez des notes."}
              />
            )}
            {(selectedRess.type === "exercice" || selectedRess.type === "quiz") && (
              <div>
                <div style={{ padding:"12px 16px", borderRadius:10, background:selectedRess.type==="quiz"?"#dbeafe":"#fef3c7", border:`1px solid ${selectedRess.type==="quiz"?"#93c5fd":"#fcd34d"}`, marginBottom:16, fontSize:13 }}>
                  <strong>{selectedRess.type==="quiz"?"❓ Quiz interactif":"✏️ Exercice pratique"}</strong> — {selectedRess.pages || selectedRess.questions} · Cours : {selectedRess.cours}
                </div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Exemple de question :</div>
                <div style={{ padding:"14px 16px", borderRadius:10, background:"#f8fafc", border:"1px solid #e5e7eb", marginBottom:12 }}>
                  <p style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Which sentence is grammatically correct in a formal context?</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {["We was able to reach the target.","The target has been successfully reached.","Target reached we did it.","We have reached the target successfully."].map((opt,i)=>(
                      <button key={i} onClick={()=>toast.success(i===1||i===3?"✅ Bonne réponse !":"❌ Mauvaise réponse")} style={{ padding:"10px 12px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:12, textAlign:"left" }}>{opt}</button>
                    ))}
                  </div>
                </div>
                <button onClick={()=>{ setShowRessModal(false); setActiveTab("examens"); }} style={{ padding:"9px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>▶️ Commencer l'exercice complet</button>
              </div>
            )}
            {selectedRess.type === "pdf" && (
              <div>
                <div style={{ padding:32, borderRadius:12, background:"#f8fafc", border:"2px dashed #d1d5db", textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontSize:52, marginBottom:8 }}>📄</div>
                  <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>{selectedRess.titre}</div>
                  <div style={{ fontSize:12, color:"#9ca3af" }}>{selectedRess.taille} · {selectedRess.cours}</div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>toast.success("Téléchargement lancé !")} style={{ flex:1, padding:"9px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Télécharger le PDF</button>
                  <button onClick={()=>toast.success("Ouverture de l'aperçu...")} style={{ flex:1, padding:"9px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>👁️ Aperçu en ligne</button>
                </div>
              </div>
            )}
            <button onClick={()=>setShowRessModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12, marginTop:16 }}>Fermer</button>
          </Modal>
        )}

        {/* MODAL SIGNALER UN PROBLÈME */}
        {showSignalModal && (
          <Modal title="⚠️ Signaler un problème" onClose={()=>setShowSignalModal(false)}>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Type de problème</label>
            <select value={signalForm.type} onChange={e=>setSignalForm(f=>({...f,type:e.target.value}))} style={{ padding:9, marginBottom:10, width:"100%", borderRadius:6, border:"1px solid #d1d5db", fontSize:13 }}>
              <option value="probleme_acces">🔐 Problème d'accès à la plateforme</option>
              <option value="probleme_contenu">📚 Problème de contenu (cours, ressource)</option>
              <option value="probleme_paiement">💳 Question sur un paiement</option>
              <option value="probleme_planning">📅 Problème de planning</option>
              <option value="probleme_technique">🔧 Problème technique</option>
              <option value="autre">📌 Autre</option>
            </select>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Sujet *</label>
            <input type="text" placeholder="Résumé court du problème…" value={signalForm.sujet} onChange={e=>setSignalForm(f=>({...f,sujet:e.target.value}))} style={{ padding:9, marginBottom:10, width:"100%", borderRadius:6, border:"1px solid #d1d5db", fontSize:13, boxSizing:"border-box" }}/>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Description *</label>
            <textarea placeholder="Décrivez votre problème en détail…" value={signalForm.description} onChange={e=>setSignalForm(f=>({...f,description:e.target.value}))} style={{ padding:9, marginBottom:10, width:"100%", borderRadius:6, border:"1px solid #d1d5db", fontSize:13, minHeight:80, resize:"vertical", boxSizing:"border-box" }}/>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>Urgence</label>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              {[["normale","🟢 Normale"],["haute","🟡 Haute"],["critique","🔴 Critique"]].map(([val,lbl])=>(
                <button key={val} onClick={()=>setSignalForm(f=>({...f,urgence:val}))} style={{ padding:"7px 14px", borderRadius:6, border:"1px solid", fontSize:12, cursor:"pointer", fontWeight:600,
                  background:signalForm.urgence===val?(val==="critique"?"#fee2e2":val==="haute"?"#fef3c7":"#dcfce7"):"#fff",
                  color:signalForm.urgence===val?(val==="critique"?"#991b1b":val==="haute"?"#92400e":"#166534"):"#6b7280",
                  borderColor:signalForm.urgence===val?(val==="critique"?"#fca5a5":val==="haute"?"#fcd34d":"#bbf7d0"):"#e5e7eb",
                }}>{lbl}</button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>sendSignalApprenant()} style={{ padding:"9px 16px", background:"#f97316", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>📤 Envoyer le signalement</button>
              <button onClick={()=>setShowSignalModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* MODAL FORMULAIRE DE REQUETE */}
        {showRequestModal && (
          <div style={modalOverlay}>
            <div style={{ ...modalBox, width:520 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}><h3 style={{ margin:0, fontSize:16 }}>Formulaire de requête</h3><button onClick={()=>setShowRequestModal(false)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#6b7280" }}>✕</button></div>
              <div style={{ marginBottom:16 }}><label style={{ display:"block", fontSize:12, fontWeight:600, marginBottom:4 }}>Destinataire</label><select value={requestDestinataire} onChange={(e)=>setRequestDestinataire(e.target.value)} style={{ width:"100%", padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13 }}>{CONTACTS_ADMIN.map(c => <option key={c.id} value={c.nom}>{c.nom} ({c.role})</option>)}</select></div>
              <div style={{ marginBottom:16 }}><label style={{ display:"block", fontSize:12, fontWeight:600, marginBottom:4 }}>Objet</label><input type="text" value={requestObjet} onChange={(e)=>setRequestObjet(e.target.value)} placeholder="Ex: Problème d'accès à une ressource" style={{ width:"100%", padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13 }} /></div>
              <div style={{ marginBottom:20 }}><label style={{ display:"block", fontSize:12, fontWeight:600, marginBottom:4 }}>Message</label><textarea rows={5} value={requestMessage} onChange={(e)=>setRequestMessage(e.target.value)} placeholder="Décrivez votre demande ou signalement..." style={{ width:"100%", padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, resize:"vertical" }}></textarea></div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}><button onClick={()=>setShowRequestModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Annuler</button><button onClick={handleSubmitRequest} style={{ padding:"9px 16px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Envoyer la requête</button></div>
            </div>
          </div>
        )}

      </div>

      {/* ══ MODAL SPEAKING ══ */}
      {speakingTask && speakPhase !== "idle" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.75)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:640, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 30px 80px rgba(0,0,0,0.4)" }}>

            {/* Header modal */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 22px", borderBottom:"1px solid #f1f5f9" }}>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:"#0f172a" }}>{speakingTask.titre}</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>
                  {speakPhase === "prep" && "⏳ Temps de préparation"}
                  {speakPhase === "recording" && "🔴 Enregistrement en cours"}
                  {speakPhase === "playback" && "🎧 Écoute & soumission"}
                  {speakPhase === "submitted" && "✅ Réponse envoyée"}
                </div>
              </div>
              <button onClick={resetSpeaking} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#9ca3af", lineHeight:1 }}>✕</button>
            </div>

            <div style={{ padding:"22px 24px" }}>

              {/* ── PHASE : PRÉPARATION ── */}
              {speakPhase === "prep" && (
                <div>
                  {speakingTask.type === "integre_lecture" && (
                    <div style={{ padding:"14px 16px", borderRadius:10, background:"#f8fafc", border:"1px solid #e5e7eb", marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#6b7280", letterSpacing:".06em", marginBottom:6 }}>PASSAGE À LIRE</div>
                      <p style={{ fontSize:13, lineHeight:1.8, color:"#374151", margin:0 }}>{speakingTask.textePassage}</p>
                    </div>
                  )}
                  {speakingTask.type === "integre_audio" && (
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#6b7280", letterSpacing:".06em", marginBottom:6 }}>AUDIO À ÉCOUTER</div>
                      <AudioPlayer url={speakingTask.audioPromptUrl} titre="Extrait audio" cours={speakingTask.cours} duree={speakingTask.audioPromptDuree} />
                    </div>
                  )}
                  <div style={{ padding:"14px 16px", borderRadius:10, background:"#fef2f2", border:`1.5px solid ${PRIMARY_COLOR}30`, marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:PRIMARY_COLOR, letterSpacing:".06em", marginBottom:6 }}>CONSIGNE</div>
                    <p style={{ fontSize:13, lineHeight:1.6, color:"#0f172a", margin:0, fontWeight:500 }}>{speakingTask.consigne}</p>
                  </div>
                  {speakingTask.tip && (
                    <div style={{ padding:"9px 13px", borderRadius:8, background:"#fffbeb", border:"1px solid #fcd34d", marginBottom:18, fontSize:12, color:"#92400e" }}>
                      💡 <strong>Conseil :</strong> {speakingTask.tip}
                    </div>
                  )}
                  <div style={{ textAlign:"center", padding:"28px 20px", borderRadius:16, background:"linear-gradient(135deg,#1e3a8a,#dc2626)", color:"#fff" }}>
                    <div style={{ fontSize:12, fontWeight:600, letterSpacing:".08em", marginBottom:10, color:"rgba(255,255,255,0.8)" }}>TEMPS DE PRÉPARATION</div>
                    <div style={{ fontSize:72, fontWeight:900, lineHeight:1, marginBottom:6, fontVariantNumeric:"tabular-nums" }}>{speakTimer}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginBottom:16 }}>secondes restantes</div>
                    <div style={{ width:200, height:5, background:"rgba(255,255,255,0.2)", borderRadius:3, margin:"0 auto 18px" }}>
                      <div style={{ height:"100%", width:`${(speakTimer/speakingTask.prepTime)*100}%`, background:"#fff", borderRadius:3, transition:"width 1s linear" }} />
                    </div>
                    <button onClick={() => { clearSpeakTimer(); startRecording(); }} style={{ padding:"10px 24px", background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.5)", color:"#fff", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                      Passer → Enregistrer maintenant
                    </button>
                  </div>
                </div>
              )}

              {/* ── PHASE : ENREGISTREMENT ── */}
              {speakPhase === "recording" && (
                <div style={{ textAlign:"center" }}>
                  <div style={{ padding:"32px 20px", borderRadius:18, background:"linear-gradient(135deg,#7f1d1d,#dc2626)", color:"#fff", marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                      <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ width:56, height:56, borderRadius:"50%", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <div style={{ width:20, height:20, borderRadius:"50%", background:"#dc2626" }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, letterSpacing:".1em", marginBottom:8, color:"rgba(255,255,255,0.85)" }}>🔴 ENREGISTREMENT EN COURS</div>
                    <div style={{ fontSize:68, fontWeight:900, lineHeight:1, marginBottom:6, fontVariantNumeric:"tabular-nums" }}>{speakTimer}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:16 }}>secondes restantes</div>
                    <div style={{ width:220, height:5, background:"rgba(255,255,255,0.2)", borderRadius:3, margin:"0 auto 20px" }}>
                      <div style={{ height:"100%", width:`${(speakTimer/speakingTask.recordTime)*100}%`, background:"#fff", borderRadius:3, transition:"width 1s linear" }} />
                    </div>
                    <button onClick={stopRecording} style={{ padding:"10px 28px", background:"#fff", color:"#dc2626", border:"none", borderRadius:10, cursor:"pointer", fontWeight:800, fontSize:14 }}>
                      ⏹ Arrêter et écouter
                    </button>
                  </div>
                  <div style={{ padding:"10px 14px", borderRadius:10, background:"#f8fafc", border:"1px solid #e5e7eb", fontSize:12, color:"#374151", textAlign:"left" }}>
                    <strong>Rappel :</strong> {speakingTask.consigne}
                  </div>
                </div>
              )}

              {/* ── PHASE : ÉCOUTE + SOUMISSION ── */}
              {speakPhase === "playback" && (
                <div>
                  <div style={{ padding:"18px 20px", borderRadius:14, background:"linear-gradient(135deg,#059669,#34d399)", color:"#fff", marginBottom:18 }}>
                    <div style={{ fontSize:12, fontWeight:600, marginBottom:10, color:"rgba(255,255,255,0.85)" }}>🎧 Votre enregistrement</div>
                    <audio src={speakUrl} controls style={{ width:"100%", height:40 }} />
                  </div>
                  <div style={{ padding:"12px 14px", borderRadius:10, background:"#f8fafc", border:"1px solid #e5e7eb", marginBottom:18 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>✅ Check-list avant soumission</div>
                    {["J'ai répondu directement à la question","J'ai donné au moins 2 raisons ou exemples","Mon débit est clair et compréhensible","J'ai utilisé des connecteurs (however, therefore, for example…)"].map((item,i) => (
                      <div key={i} style={{ display:"flex", gap:8, fontSize:12, color:"#374151", marginBottom:5 }}><span style={{ color:"#059669" }}>✓</span>{item}</div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={() => { setSpeakBlob(null); setSpeakUrl(null); startRecording(); setSpeakTimer(speakingTask.recordTime); }} style={{ flex:1, padding:"11px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13 }}>🔄 Recommencer</button>
                    <button onClick={submitSpeaking} style={{ flex:2, padding:"11px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:14 }}>📤 Soumettre au coach</button>
                  </div>
                </div>
              )}

              {/* ── PHASE : SOUMIS ── */}
              {speakPhase === "submitted" && (
                <div style={{ textAlign:"center", padding:"20px 0" }}>
                  <div style={{ fontSize:60, marginBottom:14 }}>🎉</div>
                  <h2 style={{ fontSize:20, fontWeight:800, color:"#059669", marginBottom:8 }}>Réponse envoyée !</h2>
                  <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.7, marginBottom:22 }}>
                    Votre enregistrement a été transmis à <strong>{speakingTask.formateur}</strong>. Vous recevrez le feedback de votre coach dans votre espace Messages sous 48h.
                  </p>
                  <div style={{ padding:"14px 16px", borderRadius:12, background:"#f0fdf4", border:"1px solid #bbf7d0", marginBottom:22, textAlign:"left" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#059669", marginBottom:8 }}>📋 Critères évalués par le coach :</div>
                    {["Fluidité et débit (Fluency)","Prononciation (Pronunciation)","Richesse du vocabulaire (Lexical Resource)","Précision grammaticale (Grammar Range & Accuracy)","Cohérence et pertinence (Coherence)"].map((c,i) => (
                      <div key={i} style={{ fontSize:12, color:"#374151", marginBottom:4, display:"flex", gap:8 }}><span style={{ color:"#059669" }}>•</span>{c}</div>
                    ))}
                  </div>
                  <button onClick={resetSpeaking} style={{ padding:"11px 28px", background:PRIMARY_COLOR, color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:14 }}>
                    Fermer
                  </button>
                </div>
              )}

              {/* Erreur micro */}
              {micError && (
                <div style={{ padding:"20px 20px", borderRadius:12, background:"#fef2f2", border:"1px solid #fecaca", textAlign:"center" }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>🎙️❌</div>
                  <div style={{ fontWeight:700, color:"#dc2626", marginBottom:8 }}>Accès au microphone refusé</div>
                  <div style={{ fontSize:12, color:"#374151", marginBottom:14 }}>Autorisez l'accès au microphone dans les paramètres de votre navigateur puis réessayez.</div>
                  <button onClick={resetSpeaking} style={{ padding:"8px 20px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:12 }}>Fermer</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* STYLES */
const modalOverlay = { position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 };
const modalBox = { background:"#fff", padding:24, borderRadius:14, maxWidth:"92vw" };