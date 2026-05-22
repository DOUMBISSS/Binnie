// src/Pages/EspaceProfesseur/EspaceProfesseur.jsx
// Route : <Route path="/espace-professeur" element={<EspaceProfesseur />} />

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import CloudinaryUpload, { AvatarUpload } from "../../Components/CloudinaryUpload";
import NotificationsTab from "../../Components/NotificationsTab";
import MessagerieTab from "../../Components/MessagerieTab";
import { useGroupeChat } from "../../hooks/useGroupeChat";

/* ═══════════════════════════════════════════════════════
   CONSTANTES BET
═══════════════════════════════════════════════════════ */
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
const BET        = "#0891b2";
const CENTRES_LABELS = {
  angre:      "BET Angré",
  "2plateaux":"BET II Plateaux",
  yopougon:   "BET Yopougon",
  koumassi:   "BET Koumassi",
  abatta:     "BET Abatta",
  bouake:     "BET Bouaké",
};
const JOURS_SEMAINE = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const CRENEAUX_DEF  = [
  { id:"matin",     label:"Matin",      debut:"08:00", fin:"12:00" },
  { id:"apresmidi", label:"Après-midi", debut:"13:00", fin:"17:00" },
  { id:"soir",      label:"Soir",       debut:"18:00", fin:"21:00" },
];
const initDispo = () => {
  const d = {};
  JOURS_SEMAINE.forEach(j => {
    d[j] = {};
    CRENEAUX_DEF.forEach(c => { d[j][c.id] = { dispo:false, debut:c.debut, fin:c.fin }; });
  });
  return d;
};
const BET_DARK   = "#0e7490";
const BET_LIGHT  = "#e0f2fe";
const BET_GRAD   = "linear-gradient(135deg,#0f172a 0%,#0891b2 100%)";

const STATUT_SEANCE = {
  planifie:  { label:"Planifiée",   bg:"#fef3c7", c:"#92400e" },
  confirme:  { label:"Confirmée",   bg:"#dbeafe", c:"#1e40af" },
  termine:   { label:"Terminée",    bg:"#dcfce7", c:"#166534" },
  annule:    { label:"Annulée",     bg:"#fee2e2", c:"#991b1b" },
};
const STATUT_ETUD = {
  actif:    { bg:"#dcfce7", c:"#166534", label:"Actif"    },
  absent:   { bg:"#fee2e2", c:"#991b1b", label:"Absent"   },
  retard:   { bg:"#fef3c7", c:"#92400e", label:"En retard"},
  conge:    { bg:"#dbeafe", c:"#1e40af", label:"Congé"    },
};
const NIVEAU_META = {
  A1:{ l:"Débutant",         c:"#6b7280", bg:"#f3f4f6" },
  A2:{ l:"Élémentaire",      c:"#d97706", bg:"#fef3c7" },
  B1:{ l:"Intermédiaire",    c:"#2563eb", bg:"#dbeafe" },
  B2:{ l:"Interm. supérieur",c:"#7c3aed", bg:"#ede9fe" },
  C1:{ l:"Avancé",           c:"#059669", bg:"#dcfce7" },
  C2:{ l:"Maîtrise",         c:"#dc2626", bg:"#fee2e2" },
};
const TYPE_RESSOURCE = {
  pdf:      { icon:"📄", label:"PDF",      color:"#dc2626" },
  video:    { icon:"🎬", label:"Vidéo",    color:"#7c3aed" },
  audio:    { icon:"🎧", label:"Audio",    color:"#059669" },
  exercice: { icon:"✏️", label:"Exercice", color:"#d97706" },
  quiz:     { icon:"❓", label:"Quiz",     color:"#2563eb" },
  lien:     { icon:"🔗", label:"Lien",     color:BET      },
  speaking: { icon:"🎤", label:"Speaking", color:"#dc2626" },
};

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK
═══════════════════════════════════════════════════════ */
const MON_PROFIL = {
  id:1, nom:"Martin", prenom:"Sophie", avatar:"SM",
  email:"s.martin@bet.ci", phone:"+225 07 22 33 44",
  specialite:"Anglais Professionnel & TOEIC",
  niveauxEnseignes:["B1","B2","C1"],
  dateRecrutement:"2023-09-01",
  notation: 4.8, nbAvis: 124,
  coursActifs: 3, totalEtudiants: 54, heuresMois: 48,
  xp:"Senior", certifications:["CELTA","DELTA","TOEIC 990"],
};

const MES_COURS_INIT = [
  { id:1, titre:"Anglais Professionnel B2", niveau:"B2", emoji:"💼", color:"#2563eb",
    description:"Communication professionnelle avancée : réunions, emails, présentations.",
    etudiants:18, modules:5, modulesOk:3, heuresTotales:24, heuresFaites:18,
    prochainSeance:"2025-12-12 09:00", statut:"actif",
    modules_list:[
      { id:1, nom:"Réunions d'affaires",     fait:true,  type:"presentiel", date:"2025-11-10" },
      { id:2, nom:"Négociation en anglais",  fait:true,  type:"presentiel", date:"2025-11-17" },
      { id:3, nom:"Présentations Pro",       fait:true,  type:"online",     date:"2025-11-24" },
      { id:4, nom:"Correspondance formelle", fait:false, type:"presentiel", date:"2025-12-12" },
      { id:5, nom:"Rapport d'activité",      fait:false, type:"online",     date:"2025-12-19" },
    ] },
  { id:2, titre:"Business English",        niveau:"B2", emoji:"📊", color:"#059669",
    description:"Vocabulaire économique, finance d'entreprise et leadership.",
    etudiants:14, modules:4, modulesOk:2, heuresTotales:16, heuresFaites:8,
    prochainSeance:"2025-12-14 14:00", statut:"actif",
    modules_list:[
      { id:1, nom:"Finance & Budget",   fait:true,  type:"online",     date:"2025-11-12" },
      { id:2, nom:"Marketing Digital",  fait:true,  type:"presentiel", date:"2025-11-26" },
      { id:3, nom:"Leadership",         fait:false, type:"presentiel", date:"2025-12-14" },
      { id:4, nom:"Stratégie d'entrep.",fait:false, type:"online",     date:"2025-12-21" },
    ] },
  { id:3, titre:"Préparation TOEIC",       niveau:"B2", emoji:"🏆", color:"#7c3aed",
    description:"Entraînement intensif à l'examen TOEIC — listening & reading.",
    etudiants:22, modules:5, modulesOk:2, heuresTotales:20, heuresFaites:8,
    prochainSeance:"2025-12-18 10:00", statut:"actif",
    modules_list:[
      { id:1, nom:"Listening Part 1-2",  fait:true,  type:"presentiel", date:"2025-11-08" },
      { id:2, nom:"Listening Part 3-4",  fait:true,  type:"presentiel", date:"2025-11-22" },
      { id:3, nom:"Reading Part 5-6",    fait:false, type:"online",     date:"2025-12-06" },
      { id:4, nom:"Reading Part 7",      fait:false, type:"presentiel", date:"2025-12-18" },
      { id:5, nom:"Examens blancs",      fait:false, type:"presentiel", date:"2025-12-25" },
    ] },
];

const MES_SEANCES_INIT = [
  { id:1, coursId:1, titre:"Correspondance formelle — Module 4", date:"2025-12-12", heure:"09:00", duree:"2h",   type:"presentiel", salle:"Salle A", statut:"confirme",  nbInscrits:18, nbPresents:null },
  { id:2, coursId:2, titre:"Leadership en anglais — Module 3",   date:"2025-12-14", heure:"14:00", duree:"2h",   type:"online",     salle:"Zoom",    statut:"confirme",  nbInscrits:14, nbPresents:null },
  { id:3, coursId:3, titre:"TOEIC Reading Part 5-6 — Module 3",  date:"2025-12-06", heure:"09:00", duree:"2h",   type:"presentiel", salle:"Salle B", statut:"termine",   nbInscrits:22, nbPresents:19 },
  { id:4, coursId:3, titre:"TOEIC Simulation complète",          date:"2025-12-18", heure:"10:00", duree:"3h",   type:"presentiel", salle:"Salle A", statut:"planifie",  nbInscrits:22, nbPresents:null },
  { id:5, coursId:1, titre:"Rapport d'activité — Module 5",      date:"2025-12-19", heure:"09:00", duree:"2h",   type:"online",     salle:"Zoom",    statut:"planifie",  nbInscrits:18, nbPresents:null },
  { id:6, coursId:2, titre:"Stratégie d'entreprise — Module 4",  date:"2025-12-21", heure:"14:00", duree:"2h",   type:"online",     salle:"Zoom",    statut:"planifie",  nbInscrits:14, nbPresents:null },
  { id:7, coursId:1, titre:"Présentations Pro — Module 3",       date:"2025-11-24", heure:"09:00", duree:"2h",   type:"online",     salle:"Zoom",    statut:"termine",   nbInscrits:18, nbPresents:17 },
  { id:8, coursId:2, titre:"Marketing Digital — Module 2",       date:"2025-11-26", heure:"14:00", duree:"2h",   type:"presentiel", salle:"Salle A", statut:"termine",   nbInscrits:14, nbPresents:13 },
];

const MES_ETUDIANTS_INIT = [
  { id:1,  coursIds:[1,2],  nom:"Kouamé Aya",      email:"k.aya@orange.ci",   niveau:"B2", progression:78, assiduite:94, testScore:75, absent:2, retard:1, dernNote:17, statut:"actif",   profil:"professionnel", commentaire:"" },
  { id:2,  coursIds:[1],    nom:"Diallo Ibrahima",  email:"d.ibra@orange.ci",  niveau:"C1", progression:88, assiduite:98, testScore:88, absent:0, retard:0, dernNote:19, statut:"actif",   profil:"professionnel", commentaire:"Excellent élève — proposer C1 avancé" },
  { id:3,  coursIds:[1,3],  nom:"N'Guessan Fatou",  email:"ng.f@orange.ci",    niveau:"B1", progression:52, assiduite:85, testScore:56, absent:5, retard:3, dernNote:12, statut:"absent",  profil:"particulier",   commentaire:"À surveiller — absences répétées" },
  { id:4,  coursIds:[2,3],  nom:"Touré Mamadou",    email:"toure.m@bnp.ci",    niveau:"C1", progression:91, assiduite:97, testScore:88, absent:1, retard:0, dernNote:18, statut:"actif",   profil:"professionnel", commentaire:"" },
  { id:5,  coursIds:[3],    nom:"Bamba Aïcha",       email:"a.bamba@bnp.ci",    niveau:"A2", progression:34, assiduite:72, testScore:38, absent:8, retard:6, dernNote:9,  statut:"actif",   profil:"etudiant",      commentaire:"Difficultés sérieuses — soutien nécessaire" },
  { id:6,  coursIds:[2],    nom:"Coulibaly Jean",   email:"j.coul@bnp.ci",     niveau:"B1", progression:63, assiduite:90, testScore:56, absent:3, retard:2, dernNote:14, statut:"actif",   profil:"professionnel", commentaire:"" },
  { id:7,  coursIds:[1,3],  nom:"Yao Stéphanie",    email:"s.yao@nestle.ci",   niveau:"B2", progression:72, assiduite:93, testScore:71, absent:2, retard:1, dernNote:16, statut:"actif",   profil:"professionnel", commentaire:"Bons progrès" },
  { id:8,  coursIds:[2,3],  nom:"Koné Aboubakar",   email:"ab.kone@bnp.ci",    niveau:"C1", progression:85, assiduite:96, testScore:82, absent:1, retard:0, dernNote:18, statut:"actif",   profil:"entreprise",    commentaire:"" },
  { id:9,  coursIds:[1],    nom:"Traoré Mariam",    email:"m.trao@orange.ci",  niveau:"A2", progression:41, assiduite:78, testScore:40, absent:9, retard:4, dernNote:10, statut:"retard",  profil:"particulier",   commentaire:"Situation difficile à surveiller" },
  { id:10, coursIds:[3],    nom:"Sawadogo Eric",    email:"e.saw@bnp.ci",      niveau:"B2", progression:69, assiduite:88, testScore:68, absent:4, retard:2, dernNote:15, statut:"actif",   profil:"professionnel", commentaire:"" },
];

const MES_RESSOURCES_INIT = [
  { id:1,  titre:"Guide de grammaire B2 — Complet",              type:"pdf",      cours:"Anglais Pro B2",  taille:"2.4 MB", date:"2025-11-10", partage:true  },
  { id:2,  titre:"Webinaire Présentations professionnelles",     type:"video",    cours:"Anglais Pro B2",  duree:"45min",   date:"2025-11-15", partage:true  },
  { id:3,  titre:"Flashcards Finance & Business",                type:"exercice", cours:"Business English",taille:"50 fiches",date:"2025-11-20",partage:true  },
  { id:4,  titre:"Podcast BBC Learning English Advanced",        type:"audio",    cours:"Anglais Pro B2",  duree:"30min",   date:"2025-11-22", partage:false },
  { id:5,  titre:"TOEIC 200 questions d'entraînement",           type:"exercice", cours:"TOEIC Prep",      taille:"45 p.",  date:"2025-11-25", partage:true  },
  { id:6,  titre:"Quiz interactif — Temps verbaux",              type:"quiz",     cours:"Anglais Pro B2",  taille:"20 q.",  date:"2025-11-28", partage:true  },
  { id:7,  titre:"Business Idioms PDF",                          type:"pdf",      cours:"Business English",taille:"1.1 MB", date:"2025-12-01", partage:false },
  { id:8,  titre:"BBC Business Podcast Episodes 1–10",           type:"lien",     cours:"Business English",taille:"~5h",    date:"2025-12-03", partage:true  },
];

const MES_EVALUATIONS_INIT = [
  { id:1, coursId:1, titre:"Évaluation Module 3 — Présentations",date:"2025-11-24",nbEtudiants:18,moyenneClasse:14.2,tauxReussite:78,min:9,max:19,statut:"corrige" },
  { id:2, coursId:2, titre:"Quiz Finance & Budget",              date:"2025-11-26",nbEtudiants:14,moyenneClasse:15.1,tauxReussite:86,min:11,max:20,statut:"corrige" },
  { id:3, coursId:3, titre:"TOEIC Blanc #1",                    date:"2025-11-22",nbEtudiants:22,moyenneClasse:690, tauxReussite:64,min:510,max:885,statut:"corrige",surTOEIC:true },
  { id:4, coursId:3, titre:"TOEIC Blanc #2",                    date:"2025-12-02",nbEtudiants:22,moyenneClasse:720, tauxReussite:73,min:540,max:890,statut:"corrige",surTOEIC:true },
  { id:5, coursId:1, titre:"Évaluation Module 4 — Correspondance",date:"2025-12-12",nbEtudiants:18,moyenneClasse:null,tauxReussite:null,min:null,max:null,statut:"a_venir" },
  { id:6, coursId:2, titre:"Évaluation Module 3 — Leadership",  date:"2025-12-14",nbEtudiants:14,moyenneClasse:null,tauxReussite:null,min:null,max:null,statut:"a_venir" },
];

const MES_MESSAGES_INIT = [
  { id:1,  de:"Kouamé Aya",           avatar:"KA", date:"2025-12-09", lu:false, objet:"Question sur Module 4",               msg:"Bonjour Prof. Martin, j'ai une question sur le chapitre 3 du module correspondance. Pouvez-vous m'expliquer la différence entre formal et semi-formal?", type:"etudiant" },
  { id:2,  de:"BET Admin",            avatar:"BT", date:"2025-12-08", lu:false, objet:"Planning du 15 au 22 déc.",           msg:"Votre planning de la semaine du 15 décembre a été mis à jour. Veuillez vérifier et confirmer vos disponibilités.", type:"admin" },
  { id:3,  de:"Diallo Ibrahima",      avatar:"DI", date:"2025-12-06", lu:true,  objet:"Merci pour le cours!",                msg:"Bonjour Prof. Martin, je voulais vous remercier pour le cours d'hier. La simulation TOEIC était très utile. À bientôt!", type:"etudiant" },
  { id:4,  de:"DRH Orange CI",        avatar:"DO", date:"2025-12-04", lu:true,  objet:"Rapport mensuel novembre",            msg:"Bonjour, pourriez-vous nous faire parvenir le rapport de progression de l'équipe Orange CI pour le mois de novembre? Merci.", type:"admin" },
  { id:5,  de:"Resp. Pédagogique",    avatar:"RP", date:"2025-12-10", lu:false, objet:"🆕 Nouveau groupe ajouté — B2 Pro 2",msg:"Bonjour Prof. Martin, un nouveau groupe 'Anglais Pro B2 — Groupe 2' a été créé et vous est assigné à partir du 6 janvier 2026. Ce groupe comprend 16 apprenants d'Orange CI et de Total CI. Merci de confirmer votre disponibilité.", type:"responsable" },
  { id:6,  de:"Resp. Pédagogique",    avatar:"RP", date:"2025-12-09", lu:false, objet:"👤 Nouvel apprenant inscrit",         msg:"Un nouvel apprenant a été ajouté à votre cours 'Préparation TOEIC' : M. Sanogo Adama (sanogo.a@bnp.ci). Son niveau évalué est B1. Il intégrera le groupe dès le prochain cours (18 déc.). Merci de l'accueillir.", type:"responsable" },
  { id:7,  de:"Resp. Pédagogique",    avatar:"RP", date:"2025-12-07", lu:true,  objet:"📋 Consignes évaluations fin d'année",msg:"Bonjour, les évaluations de fin de semestre doivent être saisies avant le 22 décembre. Merci de créer les évaluations dans le système pour chacun de vos cours et de renseigner les résultats dès que possible. Contactez-moi pour toute question.", type:"responsable" },
  { id:8,  de:"Resp. Pédagogique",    avatar:"RP", date:"2025-12-03", lu:true,  objet:"📅 Modification horaire — 14 déc.",   msg:"L'horaire du cours Business English du 14 décembre est modifié : il passe de 14h00 à 15h30. La salle reste la même (Zoom). Les apprenants ont été notifiés automatiquement. Merci.", type:"responsable" },
];

const NOTES_ETUD = {
  1: [{ qId:1, score:17, total:20, date:"2025-11-24", eval:"Éval. Module 3" }, { qId:2, score:15, total:20, date:"2025-11-10", eval:"Quiz M2" }],
  2: [{ qId:1, score:19, total:20, date:"2025-11-24", eval:"Éval. Module 3" }, { qId:2, score:18, total:20, date:"2025-11-10", eval:"Quiz M2" }],
  3: [{ qId:1, score:12, total:20, date:"2025-11-24", eval:"Éval. Module 3" }],
  5: [{ qId:1, score:9,  total:20, date:"2025-11-24", eval:"Éval. Module 3" }],
};
/* ═══════════════════════════════════════════════════════
   MODULES & CONTENU AVANCÉ — NOUVELLES DONNÉES
═══════════════════════════════════════════════════════ */
const BLOCK_TYPES = {
  texte:    { icon:"📝", label:"Texte / Cours",           color:"#374151" },
  video:    { icon:"🎬", label:"Vidéo",                   color:"#7c3aed" },
  document: { icon:"📄", label:"Document / PDF",          color:"#dc2626" },
  quiz:     { icon:"❓", label:"Quiz interactif",          color:"#2563eb" },
  exercice: { icon:"✏️", label:"Exercice pratique",       color:"#d97706" },
  audio:    { icon:"🎧", label:"Audio / Podcast",         color:"#059669" },
  lien:     { icon:"🔗", label:"Lien externe",             color:"#0891b2" },
  speaking: { icon:"🎤", label:"Speaking / Expression orale", color:"#dc2626" },
};

const STATUT_MODULE = {
  brouillon:{ label:"Brouillon", bg:"#f3f4f6", c:"#374151" },
  publie:   { label:"Publié",    bg:"#dcfce7", c:"#166534" },
  archive:  { label:"Archivé",  bg:"#fef3c7", c:"#92400e" },
};

const MODULES_CONTENT_INIT = {
  "1": {
    "1":{ id:"m1-1",coursId:1,moduleId:1,titre:"Réunions d'affaires",objectifs:["Vocabulaire des réunions","Animer en anglais","Rédiger un compte-rendu"],statut:"publie",dureeEstimee:90,ordre:1,
      blocs:[
        { id:"b1",type:"texte",titre:"Introduction aux réunions",contenu:"Les réunions internationales nécessitent un vocabulaire précis. Nous couvrons les expressions clés pour ouvrir, animer et clore une réunion formelle.",dureeMin:10,ordre:1 },
        { id:"b2",type:"video",titre:"Vidéo : Exemple réunion B2 — 15 min",url:"https://www.youtube.com/embed/example",dureeMin:15,ordre:2 },
        { id:"b3",type:"exercice",titre:"Exercice : Phrases de réunion",contenu:"Complétez : 1) 'Let\'s ______ the meeting to order.' 2) 'I\'d like to ______ to the agenda.' 3) 'Can we ______ on that?'",dureeMin:15,ordre:3 },
        { id:"b4",type:"quiz",titre:"Quiz : Vocabulaire réunions",dureeMin:10,ordre:4,
          questions:[
            { id:"q1",texte:"Which opens a meeting?",options:["Let's get started","Begin now","Meeting time","Start it"],correct:"Let's get started" },
            { id:"q2",texte:"How to ask for clarification?",options:["Could you elaborate?","Say again?","What?","Repeat."],correct:"Could you elaborate?" },
            { id:"q3",texte:"'AOB' stands for:",options:["Any Other Business","All Options Booked","Agency of Business","Another Old Book"],correct:"Any Other Business" },
          ]
        },
        { id:"b5",type:"document",titre:"PDF : 50 expressions clés pour les réunions",fichier:"phrases_reunions_b2.pdf",taille:"1.2 MB",dureeMin:20,ordre:5 },
      ]
    },
    "2":{ id:"m1-2",coursId:1,moduleId:2,titre:"Négociation en anglais",objectifs:["Techniques de négociation","Contre-propositions","Conclure un accord"],statut:"publie",dureeEstimee:75,ordre:2,
      blocs:[
        { id:"b1",type:"texte",titre:"Principes de la négociation",contenu:"Négocier en anglais requiert précision et diplomatie. Ce module couvre les stratégies avancées.",dureeMin:12,ordre:1 },
        { id:"b2",type:"audio",titre:"Podcast : Negotiation Masterclass",url:"https://example.com/negotiation.mp3",dureeMin:25,ordre:2 },
        { id:"b3",type:"exercice",titre:"Jeu de rôle : Négocier un contrat",contenu:"En binôme : l\'un acheteur, l\'autre vendeur. Utiliser : 'We could consider...', 'Our best offer is...', 'Let\'s meet halfway...'",dureeMin:20,ordre:3 },
        { id:"b4",type:"quiz",titre:"Quiz : Expressions de négociation",dureeMin:8,ordre:4,
          questions:[
            { id:"q1",texte:"'To meet halfway' means:",options:["To compromise","To disagree","To walk away","To fully agree"],correct:"To compromise" },
            { id:"q2",texte:"A 'counteroffer' is:",options:["A response proposal","The original offer","A refusal","A contract"],correct:"A response proposal" },
          ]
        },
      ]
    },
    "3":{ id:"m1-3",coursId:1,moduleId:3,titre:"Présentations Pro",objectifs:["Structurer une présentation","Gérer les transitions","Les questions-réponses"],statut:"publie",dureeEstimee:80,ordre:3,
      blocs:[
        { id:"b1",type:"texte",titre:"Structure d'une présentation",contenu:"Règle des 3 parties : intro (hook+agenda), développement (3 points), conclusion (résumé+CTA). Chaque partie a ses phrases clés.",dureeMin:15,ordre:1 },
        { id:"b2",type:"video",titre:"TED Talk : How to speak so people listen",url:"https://www.youtube.com/embed/eIho2S0ZahI",dureeMin:22,ordre:2 },
        { id:"b3",type:"exercice",titre:"Créer votre présentation de 3 minutes",contenu:"Préparez 3 minutes sur votre secteur. Utiliser : 'Today I\'d like to discuss...', 'Moving on to...', 'To wrap up...'",dureeMin:25,ordre:3 },
        { id:"b4",type:"document",titre:"Template PowerPoint BET — Présentation Pro",fichier:"template_presentation.pptx",taille:"3.1 MB",dureeMin:10,ordre:4 },
        { id:"b5",type:"quiz",titre:"Quiz final : Présentations",dureeMin:8,ordre:5,
          questions:[
            { id:"q1",texte:"'To sum up' is used to:",options:["Summarize","Start a new point","Ask a question","Disagree"],correct:"Summarize" },
            { id:"q2",texte:"A 'hook' in a presentation is:",options:["Attention-grabbing opening","The conclusion","A slide title","A transition"],correct:"Attention-grabbing opening" },
          ]
        },
      ]
    },
    "4":{ id:"m1-4",coursId:1,moduleId:4,titre:"Correspondance formelle",objectifs:["Emails formels","Lettres professionnelles","Memos"],statut:"brouillon",dureeEstimee:60,ordre:4,blocs:[] },
    "5":{ id:"m1-5",coursId:1,moduleId:5,titre:"Rapport d'activité",objectifs:["Structure d'un rapport","Données et graphiques","Recommandations"],statut:"brouillon",dureeEstimee:70,ordre:5,blocs:[] },
  },
  "2":{
    "1":{ id:"m2-1",coursId:2,moduleId:1,titre:"Finance & Budget",objectifs:["Vocabulaire financier","Lecture de bilans","Présenter des chiffres"],statut:"publie",dureeEstimee:80,ordre:1,
      blocs:[
        { id:"b1",type:"texte",titre:"Vocabulaire finance en anglais",contenu:"ROI, EBITDA, cash flow, balance sheet, P&L — termes essentiels pour tout professionnel en environnement international.",dureeMin:15,ordre:1 },
        { id:"b2",type:"document",titre:"Glossaire Finance English — 200 termes",fichier:"glossaire_finance.pdf",taille:"2.8 MB",dureeMin:20,ordre:2 },
        { id:"b3",type:"quiz",titre:"Quiz : Finance Vocabulary",dureeMin:10,ordre:3,
          questions:[
            { id:"q1",texte:"'Bottom line' means:",options:["Net profit","Revenue","Fixed costs","Tax"],correct:"Net profit" },
            { id:"q2",texte:"'ROI' stands for:",options:["Return On Investment","Rate Of Inflation","Revenue Over Income","Risk Of Increase"],correct:"Return On Investment" },
          ]
        },
      ]
    },
    "2":{ id:"m2-2",coursId:2,moduleId:2,titre:"Marketing Digital",objectifs:["Digital marketing vocabulary","Campaigns","Analytics"],statut:"publie",dureeEstimee:65,ordre:2,blocs:[] },
    "3":{ id:"m2-3",coursId:2,moduleId:3,titre:"Leadership",objectifs:["Leadership styles","Team management","Motivation"],statut:"brouillon",dureeEstimee:70,ordre:3,blocs:[] },
    "4":{ id:"m2-4",coursId:2,moduleId:4,titre:"Stratégie d'entreprise",objectifs:["Strategic planning","SWOT","Presentations"],statut:"brouillon",dureeEstimee:75,ordre:4,blocs:[] },
  },
  "3":{
    "1":{ id:"m3-1",coursId:3,moduleId:1,titre:"Listening Part 1-2",objectifs:["Photos","Short conversations","TOEIC strategy"],statut:"publie",dureeEstimee:90,ordre:1,
      blocs:[
        { id:"b1",type:"texte",titre:"Stratégie TOEIC Listening Parts 1 & 2",contenu:"Part 1 : 6 photos. Part 2 : 25 questions-réponses. Stratégie : écouter le premier mot, éliminer les distracteurs.",dureeMin:20,ordre:1 },
        { id:"b2",type:"audio",titre:"Practice : 20 Questions Parts 1 & 2",url:"https://example.com/toeic-listening.mp3",dureeMin:30,ordre:2 },
        { id:"b3",type:"quiz",titre:"Mini-test TOEIC Part 1",dureeMin:15,ordre:3,
          questions:[
            { id:"q1",texte:"TOEIC Listening Part 1 has:",options:["6 questions","10 questions","25 questions","45 questions"],correct:"6 questions" },
            { id:"q2",texte:"Best strategy for Part 2:",options:["Listen to first word","Read options first","Guess quickly","Skip all"],correct:"Listen to first word" },
          ]
        },
      ]
    },
    "2":{ id:"m3-2",coursId:3,moduleId:2,titre:"Listening Part 3-4",objectifs:["Conversations","Talks","TOEIC strategy"],statut:"publie",dureeEstimee:95,ordre:2,blocs:[] },
    "3":{ id:"m3-3",coursId:3,moduleId:3,titre:"Reading Part 5-6",objectifs:["Incomplete sentences","Error recognition"],statut:"brouillon",dureeEstimee:85,ordre:3,blocs:[] },
    "4":{ id:"m3-4",coursId:3,moduleId:4,titre:"Reading Part 7",objectifs:["Single passages","Multiple passages"],statut:"brouillon",dureeEstimee:100,ordre:4,blocs:[] },
    "5":{ id:"m3-5",coursId:3,moduleId:5,titre:"Examens blancs",objectifs:["Full TOEIC simulation","Time management"],statut:"brouillon",dureeEstimee:120,ordre:5,blocs:[] },
  }
};

const STUDENT_PROGRESSIONS_INIT = {
  1:{ "1":{ "1":{statut:"termine",pct:100,quizScore:90,dateComplete:"2025-11-12"}, "2":{statut:"termine",pct:100,quizScore:80,dateComplete:"2025-11-19"}, "3":{statut:"termine",pct:85,quizScore:75,dateComplete:"2025-11-26"}, "4":{statut:"en_cours",pct:40,quizScore:null,dateComplete:null}, "5":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null} }},
  2:{ "1":{ "1":{statut:"termine",pct:100,quizScore:100,dateComplete:"2025-11-12"}, "2":{statut:"termine",pct:100,quizScore:95,dateComplete:"2025-11-19"}, "3":{statut:"termine",pct:100,quizScore:95,dateComplete:"2025-11-26"}, "4":{statut:"en_cours",pct:70,quizScore:null,dateComplete:null}, "5":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null} }},
  3:{ "1":{ "1":{statut:"termine",pct:100,quizScore:60,dateComplete:"2025-11-15"}, "2":{statut:"en_cours",pct:50,quizScore:null,dateComplete:null}, "3":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null}, "4":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null}, "5":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null} }},
  7:{ "1":{ "1":{statut:"termine",pct:100,quizScore:85,dateComplete:"2025-11-12"}, "2":{statut:"termine",pct:100,quizScore:75,dateComplete:"2025-11-19"}, "3":{statut:"en_cours",pct:60,quizScore:null,dateComplete:null}, "4":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null}, "5":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null} }},
  9:{ "1":{ "1":{statut:"termine",pct:100,quizScore:55,dateComplete:"2025-11-20"}, "2":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null}, "3":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null}, "4":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null}, "5":{statut:"non_commence",pct:0,quizScore:null,dateComplete:null} }},
};

const STATUT_PROG_META = {
  "non_commence":{ label:"Non commencé", bg:"#f3f4f6", c:"#6b7280", icon:"○" },
  "en_cours":    { label:"En cours",     bg:"#fef3c7", c:"#92400e", icon:"◐" },
  "termine":     { label:"Terminé",      bg:"#dcfce7", c:"#166534", icon:"●" },
};

const NOTIFICATIONS_INIT = [
  { id:1,type:"module_publie",   titre:"Nouveau module disponible",message:"Le module 'Correspondance formelle' est maintenant accessible.",cours:"Anglais Pro B2",destinataires:18,date:"2025-12-01",statut:"envoye" },
  { id:2,type:"evaluation",      titre:"Évaluation à venir",       message:"Rappel : évaluation Module 4 le 12/12. Révisez les emails formels.",cours:"Anglais Pro B2",destinataires:18,date:"2025-12-08",statut:"envoye" },
  { id:3,type:"ressource_ajoutee",titre:"Nouvelle ressource PDF",  message:"Un nouveau guide a été ajouté : Guide de grammaire B2.",cours:"Anglais Pro B2",destinataires:18,date:"2025-11-10",statut:"envoye" },
];


/* ═══════════════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════════════ */

const Modal = ({ title, onClose, children, wide }) => (
  <div style={modalOverlay}>
    <div style={{ ...modalBox, width: wide ? 740 : 540, maxHeight:"92vh", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h3 style={{ margin:0, fontSize:16 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#6b7280" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const ProgressRing = ({ pct, size=70, stroke=5, color=BET }) => {
  const r = (size-stroke)/2, circ = 2*Math.PI*r, dash = (pct/100)*circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
    </svg>
  );
};

const Bar = ({ value, color=BET, h=7 }) => (
  <div style={{ height:h, background:"#e5e7eb", borderRadius:h, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${Math.min(100,value)}%`, background:color, borderRadius:h, transition:"width .4s" }}/>
  </div>
);

const StatCard = ({ label, value, color, icon, sub, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff", padding:16, borderRadius:12, boxShadow:"0 1px 6px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:12, cursor:onClick?"pointer":"default", border:"1px solid #f1f5f9" }}>
    <div style={{ width:46, height:46, borderRadius:10, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{icon}</div>
    <div>
      <div style={{ fontSize:11, color:"#9ca3af" }}>{label}</div>
      <div style={{ fontSize:21, fontWeight:800, color, lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af" }}>{sub}</div>}
    </div>
  </div>
);

const NivBadge = ({ n }) => { const m=NIVEAU_META[n]||NIVEAU_META.A1; return <span style={{ padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:800, background:m.bg, color:m.c }}>{n}</span>; };
const Sbadge  = ({ s })  => { const m=STATUT_ETUD[s]||STATUT_ETUD.actif; return <span style={{ padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:700, background:m.bg, color:m.c }}>{m.label}</span>; };

const fmtDate = (d, opts) => d ? new Date(d).toLocaleDateString("fr-FR", opts||{ day:"numeric", month:"short", year:"numeric" }) : "—";
const fmtDateCourt = (d) => d ? new Date(d).toLocaleDateString("fr-FR",{ weekday:"short", day:"numeric", month:"short" }) : "—";


/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
const EMOJIS_COURS = ["📚","💼","🏆","📊","🎯","✏️","🌐","🎓","📖","🔬","💡","🗣️"];
const COLORS_COURS = ["#2563eb","#059669","#7c3aed","#d97706","#dc2626","#0891b2","#db2777","#16a34a","#9333ea","#ea580c"];

const MES_HONORAIRES_SEANCES = [
  { id:1, date:"2025-12-09", cours:"Anglais Pro B2",       duree:2, statut:"validee",  tarif_heure:8000, notes:"Cours normal" },
  { id:2, date:"2025-12-07", cours:"Business English B2",  duree:1.5, statut:"validee",tarif_heure:8000, notes:"" },
  { id:3, date:"2025-12-05", cours:"Préparation TOEIC",    duree:2, statut:"validee",  tarif_heure:10000,notes:"Séance intensive" },
  { id:4, date:"2025-12-03", cours:"Anglais Pro B2",       duree:2, statut:"validee",  tarif_heure:8000, notes:"" },
  { id:5, date:"2025-12-01", cours:"Business English B2",  duree:1.5, statut:"validee",tarif_heure:8000, notes:"" },
  { id:6, date:"2025-11-28", cours:"Préparation TOEIC",    duree:2, statut:"en_attente",tarif_heure:10000,notes:"" },
  { id:7, date:"2025-11-26", cours:"Anglais Pro B2",       duree:2, statut:"validee",  tarif_heure:8000, notes:"" },
  { id:8, date:"2025-11-24", cours:"Business English B2",  duree:1.5, statut:"validee",tarif_heure:8000, notes:"" },
  { id:9, date:"2025-11-22", cours:"Préparation TOEIC",    duree:2, statut:"validee",  tarif_heure:10000,notes:"" },
  { id:10,date:"2025-11-20", cours:"Anglais Pro B2",       duree:2, statut:"en_attente",tarif_heure:8000, notes:"En cours de validation" },
];

export default function EspaceProfesseur() {
  const navigate = useNavigate();

  // Profil réel du coach connecté (localStorage en priorité, remplacé par fetch frais)
  const coachStored = JSON.parse(localStorage.getItem("coach_profil") || "null");
  const [profilFrais, setProfilFrais] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    if (!token) return;
    fetch(`${API_URL}/api/admin/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profil) {
          setProfilFrais(data.profil);
          // Mettre à jour localStorage pour les prochains rendus
          localStorage.setItem("coach_profil", JSON.stringify(data.profil));
        }
      })
      .catch(() => {});
  }, []);

  const coachBase = profilFrais || coachStored;
  const coachCentreId    = coachBase?.scope?.find(s => s !== "national") || null;
  const coachCentreLabel = coachCentreId ? (CENTRES_LABELS[coachCentreId] || coachCentreId) : null;

  const MON_PROFIL_REEL = coachBase ? {
    id:              coachBase.id,
    nom:             coachBase.nom       || "—",
    prenom:          coachBase.prenom    || "—",
    avatar:          ((coachBase.prenom?.[0] || "") + (coachBase.nom?.[0] || "")).toUpperCase() || "CO",
    photo_url:       coachBase.avatar_url || coachBase.coach_info?.photo_url || null,
    email:           coachBase.email     || "—",
    phone:           coachBase.telephone || "—",
    specialite:      coachBase.departement || "Anglais",
    niveauxEnseignes:["B1","B2","C1"],
    dateRecrutement: coachBase.date_creation?.slice(0,10) || "—",
    notation: 4.8, nbAvis: 0,
    coursActifs: 0, totalEtudiants: 0, heuresMois: 0,
    xp:"Coach",
    certifications: coachBase.coach_info?.certifications || [],
    nbr_contrats_actifs: coachBase.nbr_contrats_actifs ?? null,
  } : MON_PROFIL;

  const handleLogout = () => {
    localStorage.removeItem("coach_token");
    localStorage.removeItem("coach_refresh");
    localStorage.removeItem("coach_profil");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_profil");
    window.location.replace("/login-admin");
  };

  const [activeTab, setActiveTab]             = useState("dashboard");
  const [disponibilites, setDisponibilites]   = useState(initDispo);
  const [dispoSaved,    setDispoSaved]        = useState(false);
  const [dispoLoading,  setDispoLoading]      = useState(false);
  const [cours, setCours]                     = useState(MES_COURS_INIT);
  const [seances, setSeances]                 = useState(MES_SEANCES_INIT);
  const [etudiants, setEtudiants]             = useState(MES_ETUDIANTS_INIT);
  const [ressources, setRessources]           = useState(MES_RESSOURCES_INIT);
  const [evaluations, setEvaluations]         = useState(MES_EVALUATIONS_INIT);
  const [messages, setMessages]               = useState(MES_MESSAGES_INIT);

  /* modals */
  const [showEtudModal, setShowEtudModal]     = useState(false);
  const [selectedEtud, setSelectedEtud]       = useState(null);
  const [showSeanceModal, setShowSeanceModal] = useState(false);
  const [selectedSeance, setSelectedSeance]  = useState(null);
  const [showCoursModal, setShowCoursModal]   = useState(false);
  const [selectedCours, setSelectedCours]    = useState(null);
  const [showMsgModal, setShowMsgModal]       = useState(false);
  const [selectedMsg, setSelectedMsg]         = useState(null);
  const [showAddRessModal, setShowAddRessModal]= useState(false);
  const [showNoteModal, setShowNoteModal]     = useState(false);
  const [noteForm, setNoteForm]               = useState({ etudiantId:"", evalNom:"", score:"", total:"20", commentaire:"" });
  const [ressForm, setRessForm]               = useState({ titre:"", type:"pdf", cours:"Anglais Pro B2", taille:"", partage:true, url:"", fichierNom:"", speakConsigne:"", speakPrepTime:30, speakRecordTime:60, speakType:"independant", speakNiveau:"B2", speakTip:"" });
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [presenceSeance, setPresenceSeance]   = useState(null);
  const [presenceData, setPresenceData]       = useState({});

  /* filtres */
  const [filtEtudCours, setFiltEtudCours]     = useState("Tous");
  const [filtEtudNiveau, setFiltEtudNiveau]   = useState("Tous");
  const [searchEtud, setSearchEtud]           = useState("");
  const [filtSeanceSt, setFiltSeanceSt]       = useState("Tous");
  const [filtRessType, setFiltRessType]        = useState("Tous");
  const [semaine, setSemaine]                 = useState(0);


  // messages améliorés
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);
  const [newMsgForm, setNewMsgForm] = useState({ destinataire:"etudiant", etudiantId:"", objet:"", message:"" });
  const [filterMsgLu, setFilterMsgLu] = useState("Tous");
  const [searchMsg, setSearchMsg] = useState("");
  const [activeConvMsg, setActiveConvMsg] = useState(null);
  const [convReply, setConvReply] = useState("");
  const [filterMsgType, setFilterMsgType] = useState("Tous");

  // évaluations
  const [showCreateEvalModal, setShowCreateEvalModal] = useState(false);
  const [evalForm, setEvalForm] = useState({ coursId:1, titre:"", date:"", type:"qcm", categorie:"evaluation", surTOEIC:false, dureeMin:60, nbQuestions:20, questions:[], ressourceUrl:"", notifierEleves:true, notifierResponsable:true });

  // nouveau module
  const [showNewModuleModal, setShowNewModuleModal] = useState(false);
  const [newModForm, setNewModForm] = useState({ coursId:1, titre:"", objectifs:"", dureeEstimee:60 });

  // nouveau cours
  const [showNewCoursModal, setShowNewCoursModal] = useState(false);
  const [newCoursForm, setNewCoursForm] = useState({ titre:"", niveau:"B1", emoji:"📚", color:"#2563eb", description:"", heuresTotales:20 });

  // signal au responsable
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [signalForm, setSignalForm] = useState({ type:"probleme_technique", sujet:"", description:"", urgence:"normale" });

  // groupes
  const [groupes, setGroupes] = useState([]);
  const [groupesLoading, setGroupesLoading] = useState(false);
  const [selectedGroupe, setSelectedGroupe] = useState(null);
  const [groupeApprenants, setGroupeApprenants] = useState([]);
  const [groupeFichiers, setGroupeFichiers] = useState([]);
  const [groupeSubTab, setGroupeSubTab] = useState("apprenants");
  // détail apprenant (modal)
  const [apprenantDetail, setApprenantDetail]           = useState(null);
  const [ficheFicheTab, setFicheFicheTab]               = useState("profil"); // profil | test | presences
  const [ficheTest, setFicheTest]                       = useState(null);
  const [ficheTestLoading, setFicheTestLoading]         = useState(false);
  const [fichePres, setFichePres]                       = useState([]);
  const [fichePresLoading, setFichePresLoading]         = useState(false);

  // ── Transfert (coach → demande de changement de groupe) ────
  const [showTransfertCoach,      setShowTransfertCoach]      = useState(false);
  const [transfertCoachGroupes,   setTransfertCoachGroupes]   = useState([]);
  const [transfertCoachLoading,   setTransfertCoachLoading]   = useState(false);
  const [transfertCoachForm,      setTransfertCoachForm]      = useState({ nouveau_groupe_id:"", motif:"", jours:[], creneau:"" });
  const [transfertCoachSaving,    setTransfertCoachSaving]    = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [fichierUploading, setFichierUploading] = useState(false);
  const [presenceDate, setPresenceDate] = useState(() => new Date().toISOString().slice(0,10));
  const [presenceListe, setPresenceListe] = useState([]);
  const [presenceSaving, setPresenceSaving] = useState(false);
  const [presenceHistory, setPresenceHistory] = useState([]);
  const [presenceView, setPresenceView] = useState("saisie");

  // Blocage chat
  const [chatBloque, setChatBloque]           = useState(false);
  const [coursManquants, setCoursManquants]   = useState([]);

  // historique cours
  const [coursList, setCoursList]             = useState([]);
  const [coursLoading, setCoursLoading]       = useState(false);
  const [coursFiltreMois, setCoursFiltreMois] = useState(() => new Date().getMonth() + 1);
  const [coursFiltreAnnee, setCoursFiltreAnnee] = useState(() => new Date().getFullYear());
  const [showCoursForm, setShowCoursForm]     = useState(false);
  const [coursEditId, setCoursEditId]         = useState(null);
  const [coursForm, setCoursForm]             = useState({ date_cours:"", objectif:"", grammaire:"", sujet_discussion:"", statut:"dispense", commentaire:"" });
  const [coursSaving, setCoursSaving]         = useState(false);

  // cours détail expandable
  const [expandedModuleInCours, setExpandedModuleInCours] = useState(null);

  // Charger les disponibilités depuis la base de données
  useEffect(() => {
    const token = localStorage.getItem("coach_token");
    if (!token) return;
    setDispoLoading(true);
    fetch(`${API_URL}/api/coachs/disponibilites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(({ disponibilites: rows }) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        setDisponibilites(prev => {
          const next = { ...prev };
          rows.forEach(r => {
            if (!next[r.jour]) return;
            next[r.jour] = {
              ...next[r.jour],
              [r.creneau]: { dispo: r.dispo, debut: r.debut?.slice(0,5) || r.debut, fin: r.fin?.slice(0,5) || r.fin, verrouille: r.verrouille },
            };
          });
          return next;
        });
      })
      .catch(() => {})
      .finally(() => setDispoLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    if (!token) return;
    setGroupesLoading(true);
    fetch(`${API_URL}/api/groupes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { groupes: [] })
      .then(d => setGroupes(d.groupes || []))
      .catch(() => {})
      .finally(() => setGroupesLoading(false));
  }, []);

  const fetchGroupeDetail = async (groupe) => {
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    setSelectedGroupe(groupe);
    setGroupeSubTab("apprenants");
    try {
      const r = await fetch(`${API_URL}/api/groupes/${groupe.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setGroupeApprenants(d.apprenants || []);
      setGroupeFichiers(d.fichiers || []);
    } catch {}
  };

  useEffect(() => {
    if (groupeApprenants.length > 0) {
      setPresenceListe(groupeApprenants.filter(a=>a.statut==="actif").map(a => ({
        ga_id: a.id,
        nom_apprenant: a.nom_apprenant,
        prenom_apprenant: a.prenom_apprenant || "",
        statut: "present",
        note: "",
      })));
    }
  }, [groupeApprenants]);

  const fetchPresenceHistory = async () => {
    if (!selectedGroupe) return;
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    try {
      const r = await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/presences`, { headers: { Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setPresenceHistory(d.presences || []);
    } catch {}
  };

  const checkChatBlock = async (groupeId) => {
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    try {
      const [rCours, rPres] = await Promise.all([
        fetch(`${API_URL}/api/groupes/${groupeId}/cours`, { headers:{ Authorization:`Bearer ${token}` } }),
        fetch(`${API_URL}/api/groupes/${groupeId}/presences`, { headers:{ Authorization:`Bearer ${token}` } }),
      ]);
      const { cours: tousLesCours = [] } = await rCours.json();
      const { presences: toutesPresences = [] } = await rPres.json();
      const datesAvecPresence = new Set(toutesPresences.map(p => p.date_seance));
      // Cours dispensés/confirmés/terminés sans présences enregistrées pour cette date
      const manquants = tousLesCours.filter(c =>
        c.statut !== "annule" && !datesAvecPresence.has(c.date_cours)
      );
      setCoursManquants(manquants);
      setChatBloque(manquants.length > 0);
    } catch {
      setChatBloque(false);
      setCoursManquants([]);
    }
  };

  const savePresences = async () => {
    if (!selectedGroupe || !presenceDate) return;
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    setPresenceSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/presences`, {
        method:"POST",
        headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({ date_seance: presenceDate, liste: presenceListe })
      });
      if (!r.ok) throw new Error();
      toast.success("Présences enregistrées ✓");
      fetchPresenceHistory();
      checkChatBlock(selectedGroupe.id);
    } catch { toast.error("Erreur enregistrement"); }
    finally { setPresenceSaving(false); }
  };

  const signalerAbsence = async (apprenant) => {
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    toast.success(`Absence répétée de ${apprenant.prenom_apprenant || ""} ${apprenant.nom_apprenant} signalée à l'assistante`);
  };

  const searchGroupesPourTransfert = async (niveau) => {
    if (!niveau) return;
    setTransfertCoachLoading(true);
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    try {
      const r = await fetch(`${API_URL}/api/groupes?niveau=${encodeURIComponent(niveau)}&statut=actif`, { headers:{ Authorization:`Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        setTransfertCoachGroupes((d.groupes||[]).filter(g => g.id !== selectedGroupe?.id));
      }
    } catch {} finally { setTransfertCoachLoading(false); }
  };

  const executerTransfertCoach = async (apprenant) => {
    if (!transfertCoachForm.nouveau_groupe_id) { toast.error("Sélectionnez un groupe cible"); return; }
    setTransfertCoachSaving(true);
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    try {
      const dispoStr = [transfertCoachForm.jours.join(", "), transfertCoachForm.creneau].filter(Boolean).join(" — ") || "—";
      const motifFinal = transfertCoachForm.motif || `Signalement coach — Changement de disponibilités. Créneaux souhaités : ${dispoStr}`;
      const r = await fetch(`${API_URL}/api/groupes/transfert`, {
        method:"POST",
        headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify({
          ga_id:             apprenant.id,
          nouveau_groupe_id: transfertCoachForm.nouveau_groupe_id,
          motif:             motifFinal,
          initiateur:        "coach",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      toast.success(d.message || "Demande de transfert envoyée ✓");
      setShowTransfertCoach(false);
      setApprenantDetail(null);
    } catch (e) { toast.error(e.message); } finally { setTransfertCoachSaving(false); }
  };

  useEffect(() => {
    if (groupeSubTab === "presences" && selectedGroupe) fetchPresenceHistory();
    if (groupeSubTab === "chat"      && selectedGroupe) checkChatBlock(selectedGroupe.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupeSubTab, selectedGroupe]);

  const fetchCours = async (groupeId, mois, annee) => {
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    setCoursLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/groupes/${groupeId}/cours?mois=${mois}&annee=${annee}`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setCoursList(d.cours || []);
    } catch {}
    finally { setCoursLoading(false); }
  };

  useEffect(() => {
    if (groupeSubTab === "cours" && selectedGroupe) {
      fetchCours(selectedGroupe.id, coursFiltreMois, coursFiltreAnnee);
    }
  }, [groupeSubTab, selectedGroupe, coursFiltreMois, coursFiltreAnnee]);

  const saveCours = async () => {
    if (!coursForm.date_cours) { toast.error("La date est requise"); return; }
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    setCoursSaving(true);
    try {
      const url = coursEditId
        ? `${API_URL}/api/groupes/${selectedGroupe.id}/cours/${coursEditId}`
        : `${API_URL}/api/groupes/${selectedGroupe.id}/cours`;
      const r = await fetch(url, {
        method: coursEditId ? "PATCH" : "POST",
        headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify(coursForm)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success(coursEditId ? "Cours mis à jour ✓" : "Cours ajouté ✓");
      setShowCoursForm(false);
      setCoursEditId(null);
      setCoursForm({ date_cours:"", objectif:"", grammaire:"", sujet_discussion:"", statut:"dispense", commentaire:"" });
      fetchCours(selectedGroupe.id, coursFiltreMois, coursFiltreAnnee);
    } catch(e) { toast.error(e.message || "Erreur"); }
    finally { setCoursSaving(false); }
  };

  const deleteCours = async (cid) => {
    if (!window.confirm("Supprimer cette entrée ?")) return;
    const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
    await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/cours/${cid}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
    setCoursList(prev => prev.filter(c => c.id !== cid));
    toast.success("Supprimé ✓");
  };

  const msgNonLus = messages.filter(m => !m.lu).length;
  const msgResponsable = messages.filter(m => m.type === "responsable" && !m.lu).length;
  const evalAVenir = evaluations.filter(e => e.statut==="a_venir").length;

  /* ── Computed ── */
  const etudsFiltres = useMemo(() => {
    let r = [...etudiants];
    if (filtEtudCours  !== "Tous") r = r.filter(e => e.coursIds.includes(Number(filtEtudCours)));
    if (filtEtudNiveau !== "Tous") r = r.filter(e => e.niveau === filtEtudNiveau);
    if (searchEtud) r = r.filter(e => e.nom.toLowerCase().includes(searchEtud.toLowerCase()) || e.email.toLowerCase().includes(searchEtud.toLowerCase()));
    return r;
  }, [etudiants, filtEtudCours, filtEtudNiveau, searchEtud]);

  const seancesFiltres = useMemo(() => {
    let r = [...seances];
    if (filtSeanceSt !== "Tous") r = r.filter(s => s.statut === filtSeanceSt);
    return r.sort((a,b) => a.date.localeCompare(b.date));
  }, [seances, filtSeanceSt]);

  const planningSeam = useMemo(() => {
    const base = new Date("2025-12-08");
    return seances.filter(s => {
      const d = new Date(s.date);
      const diff = Math.floor((d - base) / (1000*3600*24));
      return diff >= semaine*7 && diff < (semaine+1)*7;
    }).sort((a,b) => (a.date+a.heure).localeCompare(b.date+b.heure));
  }, [seances, semaine]);

  const stats = useMemo(() => ({
    totalEtudiants: etudiants.length,
    avgProg:  Math.round(etudiants.reduce((s,e)=>s+e.progression,0)/etudiants.length),
    avgAssid: Math.round(etudiants.reduce((s,e)=>s+e.assiduite,0)/etudiants.length),
    enDanger: etudiants.filter(e=>e.assiduite<80||e.progression<45).length,
    seancesAV:seances.filter(s=>s.statut==="planifie"||s.statut==="confirme").length,
    tauxAssidMoyen: Math.round(seances.filter(s=>s.nbPresents!==null).reduce((s,se)=>s+(se.nbPresents/se.nbInscrits),0)/Math.max(1,seances.filter(s=>s.nbPresents!==null).length)*100),
  }), [etudiants, seances]);

  /* ── Handlers ── */
  const openPresence = (seance) => {
    const init = {};
    etudiants.filter(e=>e.coursIds.includes(seance.coursId)).forEach(e => { init[e.id] = "present"; });
    setPresenceData(init);
    setPresenceSeance(seance);
    setShowPresenceModal(true);
  };
  const savePresence = () => {
    const presents = Object.values(presenceData).filter(v=>v==="present").length;
    setSeances(seances.map(s => s.id===presenceSeance.id ? { ...s, nbPresents:presents, statut:"termine" } : s));
    toast.success(`Présences enregistrées — ${presents} présents`);
    setShowPresenceModal(false);
  };
  const saveNote = () => {
    if (!noteForm.etudiantId || !noteForm.score || !noteForm.evalNom) { toast.error("Remplissez tous les champs"); return; }
    setEtudiants(etudiants.map(e => e.id===Number(noteForm.etudiantId) ? { ...e, dernNote: Number(noteForm.score) } : e));
    toast.success("Note enregistrée ✓");
    setShowNoteModal(false);
    setNoteForm({ etudiantId:"", evalNom:"", score:"", total:"20", commentaire:"" });
  };
  const saveRessource = () => {
    if (!ressForm.titre) { toast.error("Titre requis"); return; }
    if (ressForm.type === "speaking" && !ressForm.speakConsigne.trim()) { toast.error("La consigne speaking est requise"); return; }
    setRessources([...ressources, { ...ressForm, id:Date.now(), date:new Date().toISOString().split("T")[0] }]);
    const label = ressForm.type === "speaking" ? "Exercice speaking" : ressForm.type === "audio" ? "Audio" : ressForm.type === "video" ? "Vidéo" : "Ressource";
    toast.success(`${label} ajouté${ressForm.type==="speaking"||ressForm.type==="audio"||ressForm.type==="video"?"":"e"} ✓`);
    if (ressForm.partage) toast("📣 Ressource partagée avec les étudiants", { icon:"🎓" });
    setShowAddRessModal(false);
    setRessForm({ titre:"", type:"pdf", cours:"Anglais Pro B2", taille:"", partage:true, url:"", fichierNom:"", speakConsigne:"", speakPrepTime:30, speakRecordTime:60, speakType:"independant", speakNiveau:"B2", speakTip:"" });
  };
  /* ── NOUVEAUX ÉTATS — Modules & Contenu avancé ── */
  const [modulesContent, setModulesContent]             = useState(MODULES_CONTENT_INIT);
  const [studentProgressions, setStudentProgressions]   = useState(STUDENT_PROGRESSIONS_INIT);
  const [notifications, setNotifications]               = useState(NOTIFICATIONS_INIT);
  const [selectedCoursModules, setSelectedCoursModules] = useState(1);
  const [showModuleBuilder, setShowModuleBuilder]       = useState(false);
  const [editingModuleContent, setEditingModuleContent] = useState(null);
  const [moduleForm, setModuleForm]                     = useState({ titre:"", objectifs:"", dureeEstimee:60, statut:"brouillon" });
  const [blocs, setBlocs]                               = useState([]);
  const [previewMode, setPreviewMode]                   = useState(false);
  const [showBlocForm, setShowBlocForm]                 = useState(false);
  const [blocForm, setBlocForm]                         = useState({ type:"texte", titre:"", contenu:"", url:"", dureeMin:10, fichier:"", taille:"", questions:[], sections:[{id:1,niveau:"h2",titre:"I. Introduction",contenu:""}] });
  const [blocQuizQ, setBlocQuizQ]                       = useState({ texte:"", options:["","","",""], correct:"" });
  const [showConfirmModuleModal, setShowConfirmModuleModal] = useState(false);
  const [confirmModuleTarget, setConfirmModuleTarget]   = useState(null);
  const [evalQForm, setEvalQForm]                       = useState({ texte:"", options:["","","",""], correct:"", media:"" });
  const [showRecurringModal, setShowRecurringModal]     = useState(false);
  const [recurringForm, setRecurringForm]               = useState({ seanceBaseId:"", nbSemaines:4 });
  const [showNotifModal, setShowNotifModal]             = useState(false);
  const [notifForm, setNotifForm]                       = useState({ titre:"", message:"", coursId:1, type:"info" });
  const [showProgEtudModal, setShowProgEtudModal]       = useState(false);
  const [selectedEtudProg, setSelectedEtudProg]         = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal]     = useState(false);
  const [selectedCoursAnalytics, setSelectedCoursAnalytics] = useState(null);
  const [showAudioModal, setShowAudioModal]             = useState(false);
  const [selectedAudio, setSelectedAudio]               = useState(null);

  /* ── HANDLERS MODULES & CONTENU ── */
  const getModuleContent = (coursId, moduleId) =>
    modulesContent[String(coursId)]?.[String(moduleId)] || null;

  const openModuleBuilder = (coursId, moduleId, moduleBase) => {
    const ex = getModuleContent(coursId, moduleId);
    setEditingModuleContent({ coursId, moduleId, moduleBase });
    setModuleForm({ titre:ex?.titre||moduleBase.nom, objectifs:(ex?.objectifs||[]).join("\n"), dureeEstimee:ex?.dureeEstimee||60, statut:ex?.statut||"brouillon" });
    setBlocs(ex?.blocs?[...ex.blocs]:[]);
    setPreviewMode(false);
    setShowModuleBuilder(true);
  };

  const saveModuleContent = () => {
    if (!moduleForm.titre) { toast.error("Titre requis"); return; }
    const { coursId, moduleId } = editingModuleContent;
    const updated = { ...getModuleContent(coursId, moduleId), id:`m${coursId}-${moduleId}`, coursId, moduleId, titre:moduleForm.titre, objectifs:moduleForm.objectifs.split("\n").filter(Boolean), dureeEstimee:Number(moduleForm.dureeEstimee), statut:moduleForm.statut, blocs:blocs.map((b,i)=>({...b,ordre:i+1})) };
    setModulesContent(prev => ({ ...prev, [String(coursId)]:{ ...prev[String(coursId)], [String(moduleId)]:updated } }));
    setCours(prev => prev.map(c => c.id===coursId ? { ...c, modules_list:c.modules_list.map(m => m.id===moduleId?{...m,nom:moduleForm.titre,fait:moduleForm.statut==="publie"}:m), modulesOk:c.modules_list.filter(m=>m.id===moduleId?moduleForm.statut==="publie":m.fait).length } : c));
    if (moduleForm.statut==="publie") {
      const c = cours.find(x=>x.id===coursId);
      setNotifications(prev => [{ id:Date.now(),type:"module_publie",titre:`Module publié : ${moduleForm.titre}`,message:`Le module "${moduleForm.titre}" est maintenant disponible dans ${c?.titre}.`,cours:c?.titre||"",destinataires:c?.etudiants||0,date:new Date().toISOString().split("T")[0],statut:"envoye" },...prev]);
      toast.success("Module publié — étudiants notifiés ✓");
    } else { toast.success("Module sauvegardé en brouillon ✓"); }
    setShowModuleBuilder(false);
  };

  const addBloc = () => {
    if (!blocForm.titre) { toast.error("Titre du bloc requis"); return; }
    setBlocs(prev => [...prev, { ...blocForm, id:`b${Date.now()}`, ordre:prev.length+1, questions:blocForm.type==="quiz"?blocForm.questions:[] }]);
    setBlocForm({ type:"texte", titre:"", contenu:"", url:"", dureeMin:10, fichier:"", taille:"", questions:[], sections:[{id:1,niveau:"h2",titre:"I. Introduction",contenu:""}] });
    setShowBlocForm(false);
    toast.success("Bloc ajouté ✓");
  };

  const addQuizQuestion = () => {
    if (!blocQuizQ.texte||!blocQuizQ.correct) { toast.error("Question et bonne réponse requises"); return; }
    setBlocForm(prev => ({ ...prev, questions:[...prev.questions,{...blocQuizQ,id:`q${Date.now()}`}] }));
    setBlocQuizQ({ texte:"", options:["","","",""], correct:"" });
  };

  const removeBloc = (id) => setBlocs(prev => prev.filter(b=>b.id!==id));
  const moveBlocUp = (i) => { if(i===0)return; const a=[...blocs]; [a[i-1],a[i]]=[a[i],a[i-1]]; setBlocs(a); };
  const moveBlocDown = (i) => { if(i>=blocs.length-1)return; const a=[...blocs]; [a[i],a[i+1]]=[a[i+1],a[i]]; setBlocs(a); };
  const getTotalDureeModule = () => blocs.reduce((s,b)=>s+(Number(b.dureeMin)||0),0);

  /* ── SÉANCES RÉCURRENTES ── */
  const saveRecurringSessions = () => {
    const base = seances.find(s=>s.id===Number(recurringForm.seanceBaseId));
    if (!base) { toast.error("Séance introuvable"); return; }
    const newSeances = Array.from({length:Number(recurringForm.nbSemaines)},(_,w)=>{ const d=new Date(base.date); d.setDate(d.getDate()+(w+1)*7); return { ...base, id:Date.now()+w, date:d.toISOString().split("T")[0], statut:"planifie", nbPresents:null }; });
    setSeances(prev=>[...prev,...newSeances]);
    toast.success(`${recurringForm.nbSemaines} séances récurrentes créées ✓`);
    setShowRecurringModal(false);
  };

  /* ── EXPORT CSV ── */
  const exportCSVNotes = () => {
    const headers = ["Nom","Email","Niveau","Cours","Progression %","Assiduité %","Dernière note /20","Score test %","Absences","Retards","Commentaire"];
    const rows = etudiants.map(e => {
      const coursList = e.coursIds.map(cId=>cours.find(x=>x.id===cId)?.titre||"").join(" | ");
      return [e.nom,e.email,e.niveau,`"${coursList}"`,e.progression,e.assiduite,e.dernNote,e.testScore,e.absent,e.retard,`"${e.commentaire||""}"`];
    });
    const csv=[headers,...rows].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv); a.download=`rapport_notes_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    toast.success("Export CSV téléchargé ✓");
  };

  const exportCSVProgressions = (coursId) => {
    const c=cours.find(x=>x.id===coursId);
    const etudsCours=etudiants.filter(e=>e.coursIds.includes(coursId));
    const modules=c?.modules_list||[];
    const headers=["Nom","Email",...modules.map(m=>m.nom+" (%)"),"Moyenne %"];
    const rows=etudsCours.map(e=>{ const progs=modules.map(m=>studentProgressions[e.id]?.[String(coursId)]?.[String(m.id)]?.pct||0); const avg=progs.length?Math.round(progs.reduce((s,v)=>s+v,0)/progs.length):0; return [e.nom,e.email,...progs,avg]; });
    const csv=[headers,...rows].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv); a.download=`progression_${(c?.titre||"cours").replace(/\s+/g,"_")}_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    toast.success("Export progression CSV ✓");
  };

  /* ── CRÉER UNE ÉVALUATION / EXAMEN ── */
  const createEvaluation = () => {
    if (!evalForm.titre || !evalForm.date) { toast.error("Titre et date requis"); return; }
    const c = cours.find(x => x.id === Number(evalForm.coursId));
    const newEval = {
      id: Date.now(), coursId: Number(evalForm.coursId), titre: evalForm.titre,
      date: evalForm.date, nbEtudiants: c?.etudiants || 0,
      moyenneClasse: null, tauxReussite: null, min: null, max: null,
      statut: "a_venir", surTOEIC: evalForm.surTOEIC,
      categorie: evalForm.categorie, type: evalForm.type,
      dureeMin: Number(evalForm.dureeMin), nbQuestions: Number(evalForm.nbQuestions),
      questions: evalForm.questions, ressourceUrl: evalForm.ressourceUrl,
    };
    setEvaluations(prev => [...prev, newEval]);
    const label = evalForm.categorie === "examen" ? "Examen" : "Évaluation";
    toast.success(`${label} "${evalForm.titre}" créé${evalForm.categorie==="examen"?"":"e"} ✓`);
    if (evalForm.notifierEleves) toast(`📣 ${c?.etudiants||0} élève(s) notifié(s) de la programmation`, { icon:"🎓" });
    if (evalForm.notifierResponsable) toast(`📋 Responsable pédagogique notifié`, { icon:"👤" });
    setShowCreateEvalModal(false);
    setEvalForm({ coursId:1, titre:"", date:"", type:"qcm", categorie:"evaluation", surTOEIC:false, dureeMin:60, nbQuestions:20, questions:[], ressourceUrl:"", notifierEleves:true, notifierResponsable:true });
    setEvalQForm({ texte:"", options:["","","",""], correct:"", media:"" });
  };

  /* ── AJOUTER QUESTION ÉVALUATION ── */
  const addEvalQuestion = () => {
    if (!evalQForm.texte.trim()) { toast.error("Texte de la question requis"); return; }
    if (["qcm","listening","audio"].includes(evalForm.type) && !evalQForm.correct) { toast.error("Sélectionnez la bonne réponse"); return; }
    setEvalForm(f => ({ ...f, questions: [...f.questions, { id: Date.now(), ...evalQForm }] }));
    setEvalQForm({ texte:"", options:["","","",""], correct:"", media:"" });
  };

  /* ── CONFIRMER MODULE EFFECTUÉ ── */
  const confirmModuleEffectue = () => {
    if (!confirmModuleTarget) return;
    const { coursId, moduleId } = confirmModuleTarget;
    setCours(prev => prev.map(c => c.id === coursId ? {
      ...c, modules_list: c.modules_list.map(m => m.id === moduleId ? { ...m, fait:true } : m)
    } : c));
    setModulesContent(prev => {
      const mc = prev[String(coursId)]?.[String(moduleId)];
      if (!mc) return prev;
      return { ...prev, [String(coursId)]: { ...prev[String(coursId)], [String(moduleId)]: { ...mc, statut:"publie", confirmeCoach:true } } };
    });
    setStudentProgressions(prev => {
      const updated = { ...prev };
      etudiants.filter(e => e.coursIds.includes(coursId)).forEach(e => {
        const cProg = updated[e.id]?.[String(coursId)] || {};
        const mProg = cProg[String(moduleId)] || { statut:"non_commence", pct:0 };
        updated[e.id] = { ...updated[e.id], [String(coursId)]: { ...cProg, [String(moduleId)]: { ...mProg, statut:"termine", pct:100 } } };
      });
      return updated;
    });
    toast.success("Module confirmé ✓ — progressions mises à jour, impact RH enregistré");
    setShowConfirmModuleModal(false);
    setConfirmModuleTarget(null);
  };

  /* ── CRÉER UN NOUVEAU MODULE ── */
  const createNewModule = () => {
    if (!newModForm.titre) { toast.error("Titre du module requis"); return; }
    const cId = Number(newModForm.coursId);
    const c = cours.find(x => x.id === cId);
    if (!c) return;
    const newModId = (c.modules_list.length + 1);
    const newMod = { id: newModId, nom: newModForm.titre, fait: false, type: "presentiel", date: "" };
    setCours(prev => prev.map(x => x.id === cId ? { ...x, modules: x.modules + 1, modules_list: [...x.modules_list, newMod] } : x));
    const newContent = {
      id: `m${cId}-${newModId}`, coursId: cId, moduleId: newModId,
      titre: newModForm.titre,
      objectifs: newModForm.objectifs.split("\n").filter(Boolean),
      dureeEstimee: Number(newModForm.dureeEstimee),
      statut: "brouillon", ordre: newModId, blocs: [],
    };
    setModulesContent(prev => ({ ...prev, [String(cId)]: { ...prev[String(cId)], [String(newModId)]: newContent } }));
    toast.success(`Module "${newModForm.titre}" créé — prêt à éditer ✓`);
    setShowNewModuleModal(false);
    setNewModForm({ coursId:1, titre:"", objectifs:"", dureeEstimee:60 });
    setSelectedCoursModules(cId);
    setActiveTab("modules_contenu");
  };

  /* ── CRÉER UN NOUVEAU COURS ── */
  const createNewCours = () => {
    if (!newCoursForm.titre.trim()) { toast.error("Le titre du cours est requis"); return; }
    const newId = Math.max(...cours.map(c => c.id), 0) + 1;
    const newCours = {
      id: newId,
      titre: newCoursForm.titre.trim(),
      niveau: newCoursForm.niveau,
      emoji: newCoursForm.emoji,
      color: newCoursForm.color,
      description: newCoursForm.description || "Nouveau cours",
      etudiants: 0, modules: 0, modulesOk: 0,
      heuresTotales: Number(newCoursForm.heuresTotales),
      heuresFaites: 0,
      prochainSeance: null, statut: "actif",
      modules_list: [],
    };
    setCours(prev => [...prev, newCours]);
    setModulesContent(prev => ({ ...prev, [String(newId)]: {} }));
    toast.success(`Cours "${newCours.titre}" créé ✓ — vous pouvez maintenant y ajouter des modules`);
    setShowNewCoursModal(false);
    setNewCoursForm({ titre:"", niveau:"B1", emoji:"📚", color:"#2563eb", description:"", heuresTotales:20 });
    setSelectedCoursModules(newId);
    setActiveTab("modules_contenu");
  };

  /* ── SIGNAL AU RESPONSABLE ── */
  const sendSignal = () => {
    if (!signalForm.sujet || !signalForm.description) { toast.error("Sujet et description requis"); return; }
    const typeLabels = { probleme_technique:"🔧 Problème technique", probleme_etudiant:"👤 Problème étudiant", demande_ressource:"📦 Demande ressource", autre:"💬 Autre" };
    const urgenceColors = { normale:"normale", haute:"haute ⚠️", critique:"critique 🚨" };
    const newMsg = {
      id: Date.now(), de: "Moi (Professeur)", avatar: "MP",
      date: new Date().toISOString().split("T")[0], lu: true,
      objet: `${typeLabels[signalForm.type]} — ${signalForm.sujet}`,
      msg: `[Urgence : ${urgenceColors[signalForm.urgence]}]\n\n${signalForm.description}`,
      type: "envoye", sens: "envoye", destinataire: "responsable",
    };
    setMessages(prev => [newMsg, ...prev]);
    toast.success("Signal envoyé au responsable pédagogique ✓");
    setShowSignalModal(false);
    setSignalForm({ type:"probleme_technique", sujet:"", description:"", urgence:"normale" });
  };

  /* ── ENVOYER MESSAGE ── */
  const sendNewMessage = () => {
    if (!newMsgForm.objet || !newMsgForm.message) { toast.error("Objet et message requis"); return; }
    let destinataireNom = "";
    if (newMsgForm.destinataire === "etudiant") {
      if (!newMsgForm.etudiantId) { toast.error("Sélectionnez un étudiant"); return; }
      destinataireNom = etudiants.find(e => e.id === Number(newMsgForm.etudiantId))?.nom || "";
    } else {
      destinataireNom = "Responsable Pédagogique";
    }
    const newMsg = {
      id: Date.now(), de: "Moi (Professeur)", avatar: "MP",
      date: new Date().toISOString().split("T")[0], lu: true,
      objet: newMsgForm.objet, msg: newMsgForm.message,
      type: "envoye", sens: "envoye",
      destinataire: newMsgForm.destinataire === "etudiant" ? Number(newMsgForm.etudiantId) : "responsable",
    };
    setMessages(prev => [newMsg, ...prev]);
    toast.success(`Message envoyé à ${destinataireNom} ✓`);
    setShowNewMsgModal(false);
    setNewMsgForm({ destinataire:"etudiant", etudiantId:"", objet:"", message:"" });
  };

  /* ── RÉPONDRE DANS UNE CONVERSATION ── */
  const sendConvReply = () => {
    if (!convReply.trim() || !activeConvMsg) return;
    const reply = {
      id: Date.now(), de: "Moi (Professeur)", avatar: "MP",
      date: new Date().toISOString().split("T")[0], lu: true,
      objet: `Re: ${activeConvMsg.objet}`, msg: convReply.trim(),
      type: "envoye", sens: "envoye", conversationId: activeConvMsg.id,
    };
    setMessages(prev => [reply, ...prev]);
    setConvReply("");
    toast.success("Réponse envoyée ✓");
  };

  /* ── NOTIFICATIONS ── */
  const sendNotification = () => {
    if (!notifForm.titre||!notifForm.message) { toast.error("Titre et message requis"); return; }
    const c=cours.find(x=>x.id===Number(notifForm.coursId));
    setNotifications(prev=>[{ id:Date.now(),type:notifForm.type,titre:notifForm.titre,message:notifForm.message,cours:c?.titre||"",destinataires:c?.etudiants||0,date:new Date().toISOString().split("T")[0],statut:"envoye" },...prev]);
    toast.success(`Notification envoyée à ${c?.etudiants||0} étudiant(s) ✓`);
    setShowNotifModal(false);
    setNotifForm({ titre:"", message:"", coursId:1, type:"info" });
  };

  /* ── ANALYTICS ── */
  const getCoursAnalytics = (coursId) => {
    const mc=modulesContent[String(coursId)]||{};
    const etudsCours=etudiants.filter(e=>e.coursIds.includes(coursId));
    const moduleStats=Object.entries(mc).map(([mId,mData])=>{ const etudProgs=etudsCours.map(e=>studentProgressions[e.id]?.[String(coursId)]?.[mId]); const termines=etudProgs.filter(p=>p?.statut==="termine").length; const scores=etudProgs.filter(p=>p?.quizScore!=null); const avgScore=scores.length?Math.round(scores.reduce((s,p)=>s+p.quizScore,0)/scores.length):null; return { id:mId,titre:mData.titre,termines,total:etudsCours.length,avgScore,duree:mData.dureeEstimee,blocs:mData.blocs?.length||0,statut:mData.statut }; });
    return { moduleStats, totalEtuds:etudsCours.length };
  };


const messagesFiltres = useMemo(() => {
  let r = [...messages];
  if (filterMsgType === "responsable") {
    r = r.filter(m => m.type === "responsable");
  } else if (filterMsgType === "etudiant") {
    r = r.filter(m => m.type === "etudiant");
  } else if (filterMsgType === "envoye") {
    r = r.filter(m => m.sens === "envoye");
  } else if (filterMsgType === "admin") {
    r = r.filter(m => m.type === "admin");
  }
  if (filterMsgLu !== "Tous") {
    r = r.filter(m => m.lu === (filterMsgLu === "lu"));
  }
  if (searchMsg) {
    r = r.filter(m => m.objet.toLowerCase().includes(searchMsg.toLowerCase()) || m.msg.toLowerCase().includes(searchMsg.toLowerCase()));
  }
  return r;
}, [messages, filterMsgType, filterMsgLu, searchMsg]);


  const { messages: groupeMessages, sendMessage: sendGroupeMessage } = useGroupeChat(selectedGroupe?.id || null);

  const sendGroupeMsg = async () => {
    if (!chatInput.trim() || !selectedGroupe) return;
    await sendGroupeMessage(MON_PROFIL_REEL.id, `${MON_PROFIL_REEL.prenom} ${MON_PROFIL_REEL.nom}`, chatInput.trim());
    setChatInput("");
  };

  const tabs = [
    { key:"dashboard",       label:"Tableau de bord", icon:"🏠", count:null },
    { key:"cours",           label:"Mes Cours",        icon:"📚", count:cours.length },
    { key:"modules_contenu", label:"Modules & Contenu",icon:"🧩", count:null },
    { key:"planning",        label:"Planning",          icon:"📅", count:stats.seancesAV },
    { key:"disponibilites",  label:"Disponibilités",    icon:"🗓️", count:null },
    { key:"etudiants",       label:"Étudiants",         icon:"👥", count:etudiants.length },
    { key:"presences",       label:"Présences",         icon:"✅", count:null },
    { key:"evaluations",     label:"Évaluations",       icon:"📝", count:evalAVenir||null, danger:evalAVenir>0 },
    { key:"notes",           label:"Notes",             icon:"🎯", count:null },
    { key:"ressources",      label:"Ressources",        icon:"📂", count:ressources.length },
    { key:"analytics",       label:"Analytiques",       icon:"📊", count:null },
    { key:"notifs",          label:"Notifications",     icon:"🔔", count:notifications.filter(n=>n.statut==="envoye").length||null },
    { key:"messages",        label:"Messages",          icon:"💬", count:msgNonLus||null, danger:msgNonLus>0 },
    { key:"groupes",         label:"Mes Groupes",       icon:"👥", count: groupes.filter(g=>g.statut==="actif").length || null },
    { key:"honoraires",      label:"Honoraires",         icon:"💵", count:null },
    { key:"profil",          label:"Mon profil",        icon:"👤", count:null },
    { key:"notifs_live",     label:"Notifs live",       icon:"🔔", count:null },
  ];

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f0f9ff" }}>
     
      <div style={{ flex:1, overflowX:"hidden" }}>
        <Toaster position="top-right" />

        {/* ── HERO ── */}
        <div style={{ background:BET_GRAD, padding:"26px 28px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-30, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }}/>
          <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:24, position:"relative", zIndex:2 }}>
            {MON_PROFIL_REEL.photo_url
              ? <img src={MON_PROFIL_REEL.photo_url} alt={MON_PROFIL_REEL.prenom}
                  style={{ width:60, height:60, borderRadius:"50%", objectFit:"cover", border:"3px solid rgba(255,255,255,0.3)", flexShrink:0 }} />
              : <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,0.14)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:20, color:"#fff", border:"3px solid rgba(255,255,255,0.3)", flexShrink:0 }}>
                  {MON_PROFIL_REEL.avatar}
                </div>
            }
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:"#7dd3fc", fontWeight:600, letterSpacing:"0.08em", marginBottom:2 }}>ESPACE COACH 🎓</div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{MON_PROFIL_REEL.prenom} {MON_PROFIL_REEL.nom}</h1>
              <div style={{ fontSize:12, color:"#bae6fd", marginTop:3, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                <span>{MON_PROFIL_REEL.specialite}</span>
                <span>⭐ {MON_PROFIL_REEL.notation}/5</span>
                <span style={{ padding:"2px 8px", borderRadius:10, background:"rgba(255,255,255,0.15)" }}>🏆 {MON_PROFIL_REEL.xp}</span>
                {coachCentreLabel && (
                  <span style={{ padding:"2px 10px", borderRadius:10, background:"rgba(8,145,178,0.4)", border:"1px solid rgba(125,211,252,0.5)", fontWeight:700, color:"#e0f2fe" }}>
                    🏢 {coachCentreLabel}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign:"right", display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, position:"relative", zIndex:2 }}>
              <button type="button" onClick={handleLogout} style={{ padding:"6px 14px", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:8, color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                🚪 Déconnexion
              </button>
              <div style={{ fontSize:11, color:"#7dd3fc", marginBottom:4 }}>Ce mois</div>
              <div style={{ fontSize:26, fontWeight:900 }}>{MON_PROFIL_REEL.heuresMois}h</div>
              <div style={{ fontSize:11, color:"#bae6fd" }}>de cours dispensées</div>
            </div>
          </div>
          {/* Mini stats */}
          <div style={{ display:"flex", background:"rgba(0,0,0,0.18)", borderRadius:"10px 10px 0 0", overflow:"hidden" }}>
            {[
              { l:"Cours actifs",       v:cours.length,            c:"#38bdf8" },
              { l:"Total étudiants",    v:stats.totalEtudiants,    c:"#34d399" },
              { l:"Progression moy.",   v:`${stats.avgProg}%`,     c:"#a78bfa" },
              { l:"Assiduité moy.",     v:`${stats.avgAssid}%`,    c:"#fbbf24" },
              { l:"À surveiller",       v:stats.enDanger,          c:stats.enDanger>0?"#f87171":"#6ee7b7" },
              { l:"Séances à venir",    v:stats.seancesAV,         c:"#38bdf8" },
            ].map((s,i,arr) => (
              <div key={s.l} style={{ flex:1, textAlign:"center", padding:"12px 6px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.07)":"none" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginBottom:2 }}>{s.l}</div>
                <div style={{ fontSize:19, fontWeight:800, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"0 24px 28px" }}>
          {/* ── TABS ── */}
          <div style={{ display:"flex", gap:3, marginBottom:0, paddingTop:18, flexWrap:"wrap" }}>
            {tabs.map(tab => {
              const ia = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
                  padding:"9px 14px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer",
                  fontWeight:600, fontSize:12,
                  background: ia?"#fff":"#e0f2fe",
                  color: ia?BET:"#0369a1",
                  boxShadow: ia?"0 -2px 8px rgba(8,145,178,0.12)":"none",
                  display:"flex", alignItems:"center", gap:5,
                }}>
                  <span style={{ fontSize:13 }}>{tab.icon}</span>{tab.label}
                  {tab.count!=null&&(<span style={{ padding:"1px 6px", borderRadius:9, fontSize:10, fontWeight:700,
                    background:tab.danger?"#fee2e2":ia?BET_LIGHT:"#bae6fd",
                    color:tab.danger?"#dc2626":ia?BET:"#0369a1" }}>{tab.count}</span>)}
                </button>
              );
            })}
          </div>

          {/* ── CARD PRINCIPALE ── */}
          <div style={{ ...card, borderRadius:"0 12px 12px 12px" }}>

            {/* ════════ DASHBOARD ════════ */}
            {activeTab==="dashboard" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Tableau de bord</h2><p style={tabSubtitle}>Bonjour Prof. {MON_PROFIL_REEL.prenom} — voici votre résumé du jour</p></div>
                  <div style={{ fontSize:12, color:"#9ca3af" }}>Lundi 9 décembre 2025</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:24 }}>
                  <StatCard label="Séances aujourd'hui" value={seances.filter(s=>s.date==="2025-12-09").length||"0"} color={BET} icon="📅" sub="prochaine : Jeu 12/12" onClick={()=>setActiveTab("planning")} />
                  <StatCard label="Étudiants total"      value={etudiants.length}   color="#7c3aed" icon="👥" sub={`${stats.enDanger} à surveiller`} onClick={()=>setActiveTab("etudiants")} />
                  <StatCard label="Taux de présence" value={`${stats.tauxAssidMoyen}%`} color={stats.tauxAssidMoyen>=75?"#059669":"#d97706"} icon="📊" sub="assiduité moyenne" onClick={()=>setActiveTab("presences")} />
                  <StatCard label="Eval. à corriger"     value={evaluations.filter(e=>e.statut==="a_venir").length} color="#d97706" icon="📝" onClick={()=>setActiveTab("evaluations")} />
                  <StatCard label="Messages non lus"     value={msgNonLus}          color={msgNonLus>0?"#ef4444":"#9ca3af"} icon="💬" onClick={()=>setActiveTab("messages")} />
                  <StatCard label="Ressources partagées" value={ressources.filter(r=>r.partage).length} color="#059669" icon="📂" onClick={()=>setActiveTab("ressources")} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20 }}>
                  {/* Mes cours */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                      <h3 style={blockTitle}>Progression de mes cours</h3>
                      <button onClick={()=>setActiveTab("cours")} style={btnGhost}>Voir tout →</button>
                    </div>
                    {cours.map(c => (
                      <div key={c.id} style={{ padding:"12px 14px", borderRadius:10, background:"#fff", border:"1px solid #e5e7eb", marginBottom:10, cursor:"pointer" }}
                        onClick={()=>{ setSelectedCours(c); setShowCoursModal(true); }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:20 }}>{c.emoji}</span>
                            <div>
                              <div style={{ fontWeight:700, fontSize:13 }}>{c.titre}</div>
                              <div style={{ fontSize:11, color:"#9ca3af" }}>{c.etudiants} étudiants · {c.modulesOk}/{c.modules} modules</div>
                            </div>
                          </div>
                          <NivBadge n={c.niveau}/>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ flex:1 }}><Bar value={(c.modulesOk/c.modules)*100} color={c.color}/></div>
                          <span style={{ fontSize:12, fontWeight:700, color:c.color, minWidth:32 }}>{Math.round((c.modulesOk/c.modules)*100)}%</span>
                        </div>
                        <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>
                          ⏱ {c.heuresFaites}h/{c.heuresTotales}h · Prochaine : {new Date(c.prochainSeance).toLocaleDateString("fr-FR",{ weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {/* Top étudiants */}
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                        <h3 style={{ ...blockTitle, margin:0 }}>🏆 Top élèves</h3>
                        <button onClick={()=>setActiveTab("etudiants")} style={btnGhost}>Voir →</button>
                      </div>
                      {[...etudiants].sort((a,b)=>b.progression-a.progression).slice(0,4).map((e,i) => (
                        <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, cursor:"pointer" }}
                          onClick={()=>{ setSelectedEtud(e); setShowEtudModal(true); }}>
                          <span style={{ fontSize:16 }}>{["🥇","🥈","🥉","4️⃣"][i]}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600, fontSize:12 }}>{e.nom}</div>
                            <Bar value={e.progression} color={BET} h={5}/>
                          </div>
                          <span style={{ fontWeight:800, color:"#059669", fontSize:13 }}>{e.progression}%</span>
                        </div>
                      ))}
                    </div>
                    {/* Alertes */}
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                      <h3 style={{ ...blockTitle, marginBottom:10 }}>⚠️ À surveiller</h3>
                      {etudiants.filter(e=>e.assiduite<80||e.progression<45).map(e => (
                        <div key={e.id} style={{ padding:"8px 10px", borderRadius:8, background:"#fff5f5", border:"1px solid #fecaca", marginBottom:6, cursor:"pointer", fontSize:12 }}
                          onClick={()=>{ setSelectedEtud(e); setShowEtudModal(true); }}>
                          <strong style={{ color:"#dc2626" }}>{e.nom}</strong>
                          <div style={{ color:"#9ca3af", fontSize:11 }}>
                            {e.assiduite<80 && `Assiduité ${e.assiduite}% `}
                            {e.progression<45 && `Progression ${e.progression}%`}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Prochaines séances */}
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                        <h3 style={{ ...blockTitle, margin:0 }}>📅 Prochaines séances</h3>
                        <button onClick={()=>setActiveTab("planning")} style={btnGhost}>Voir →</button>
                      </div>
                      {seances.filter(s=>s.statut!=="termine"&&s.statut!=="annule").slice(0,3).map(s => {
                        const c = cours.find(x=>x.id===s.coursId);
                        return (
                          <div key={s.id} style={{ padding:"8px 10px", borderRadius:8, background:"#fff", border:"1px solid #e5e7eb", marginBottom:6, fontSize:12 }}>
                            <div style={{ fontWeight:600 }}>{s.titre}</div>
                            <div style={{ color:"#9ca3af" }}>{fmtDateCourt(s.date)} · {s.heure} · {s.type==="online"?"🌐":"🏢"} {s.salle}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════ MES COURS ════════ */}
            {activeTab==="cours" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Mes Cours</h2><p style={tabSubtitle}>{cours.length} cours · cliquez sur un module pour voir son contenu</p></div>
                  <button onClick={()=>setShowNewCoursModal(true)} style={btnPrimary}>+ Nouveau cours</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                  {cours.map(c => {
                    const progPct = Math.round((c.modulesOk/c.modules)*100);
                    const etudsCours = etudiants.filter(e=>e.coursIds.includes(c.id));
                    const avgProg = etudsCours.length ? Math.round(etudsCours.reduce((s,e)=>s+e.progression,0)/etudsCours.length) : 0;
                    const mc = modulesContent[String(c.id)] || {};
                    return (
                      <div key={c.id} style={{ borderRadius:14, border:`1px solid ${c.color}30`, background:"#fff", overflow:"hidden" }}>
                        <div style={{ height:5, background:c.color }}/>
                        <div style={{ padding:"16px 20px" }}>
                          {/* En-tête cours */}
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                              <span style={{ fontSize:28 }}>{c.emoji}</span>
                              <div>
                                <div style={{ fontWeight:800, fontSize:16 }}>{c.titre}</div>
                                <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>{c.etudiants} étudiants · Niveau <NivBadge n={c.niveau}/></div>
                              </div>
                            </div>
                            <button onClick={()=>{ setSelectedCours(c); setShowCoursModal(true); setExpandedModuleInCours(null); }} style={{ ...btnSecondary, fontSize:11, padding:"5px 12px" }}>Détails →</button>
                          </div>
                          <p style={{ fontSize:12, color:"#6b7280", lineHeight:1.6, margin:"0 0 14px" }}>{c.description}</p>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
                            {[
                              { l:"Modules",    v:`${c.modulesOk}/${c.modules}`, col:c.color },
                              { l:"Heures",     v:`${c.heuresFaites}h/${c.heuresTotales}h`, col:"#374151" },
                              { l:"Avancement", v:`${progPct}%`, col:c.color },
                              { l:"Moy. élèves",v:`${avgProg}%`, col:avgProg>=60?"#22c55e":"#f59e0b" },
                            ].map(s=>(
                              <div key={s.l} style={{ padding:"8px 10px", borderRadius:8, background:"#f8fafc", textAlign:"center" }}>
                                <div style={{ fontSize:10, color:"#9ca3af" }}>{s.l}</div>
                                <div style={{ fontSize:15, fontWeight:800, color:s.col }}>{s.v}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginBottom:16 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af", marginBottom:3 }}>
                              <span>Avancement modules</span><span style={{ color:c.color, fontWeight:700 }}>{progPct}%</span>
                            </div>
                            <Bar value={progPct} color={c.color}/>
                          </div>

                          {/* Liste des modules dépliables */}
                          <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                            📦 Modules du cours
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            {c.modules_list.map((mod, idx) => {
                              const content = mc[String(mod.id)];
                              const sm = STATUT_MODULE[content?.statut || "brouillon"];
                              const nbBlocs = content?.blocs?.length || 0;
                              const isExpanded = expandedModuleInCours === `${c.id}-${mod.id}`;
                              return (
                                <div key={mod.id} style={{ borderRadius:10, border:`1px solid ${isExpanded ? c.color+"60" : "#e5e7eb"}`, overflow:"hidden", transition:"border-color .2s" }}>
                                  {/* En-tête module cliquable */}
                                  <div
                                    onClick={() => setExpandedModuleInCours(isExpanded ? null : `${c.id}-${mod.id}`)}
                                    style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", cursor:"pointer", background:isExpanded ? c.color+"08" : "#fafafa" }}
                                  >
                                    <div style={{ width:28,height:28,borderRadius:"50%",background:mod.fait?"#dcfce7":c.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:mod.fait?"#166534":c.color,flexShrink:0 }}>
                                      {mod.fait ? "✓" : idx+1}
                                    </div>
                                    <div style={{ flex:1 }}>
                                      <div style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{content?.titre || mod.nom}</div>
                                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>
                                        ⏱ {content?.dureeEstimee||"—"} min · 📦 {nbBlocs} bloc{nbBlocs>1?"s":""} · {mod.type==="online"?"🌐 Online":"🏢 Présentiel"} · {fmtDate(mod.date)}
                                      </div>
                                    </div>
                                    <span style={{ padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:700,background:sm.bg,color:sm.c,flexShrink:0 }}>{sm.label}</span>
                                    <span style={{ fontSize:13, color:"#9ca3af", marginLeft:4 }}>{isExpanded?"▲":"▼"}</span>
                                  </div>

                                  {/* Contenu déplié */}
                                  {isExpanded && (
                                    <div style={{ padding:"12px 16px", borderTop:`1px solid ${c.color}20`, background:"#fff" }}>
                                      {content?.objectifs?.length > 0 && (
                                        <div style={{ marginBottom:12 }}>
                                          <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 }}>🎯 Objectifs pédagogiques</div>
                                          <ul style={{ margin:0, paddingLeft:18 }}>
                                            {content.objectifs.map((obj,i) => <li key={i} style={{ fontSize:12, color:"#6b7280", marginBottom:3 }}>{obj}</li>)}
                                          </ul>
                                        </div>
                                      )}
                                      {nbBlocs > 0 ? (
                                        <div>
                                          <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>📚 Contenu ({nbBlocs} bloc{nbBlocs>1?"s":""})</div>
                                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                            {content.blocs.map((b, bi) => {
                                              const bt = BLOCK_TYPES[b.type] || BLOCK_TYPES.texte;
                                              return (
                                                <div key={b.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 12px", borderRadius:8, background:bt.color+"08", border:`1px solid ${bt.color}20` }}>
                                                  <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{bt.icon}</span>
                                                  <div style={{ flex:1 }}>
                                                    <div style={{ fontWeight:600, fontSize:12, color:bt.color }}>{bi+1}. {b.titre}</div>
                                                    {b.contenu && <div style={{ fontSize:11, color:"#6b7280", marginTop:3, lineHeight:1.5 }}>{b.contenu.slice(0,120)}{b.contenu.length>120?"…":""}</div>}
                                                    {b.type==="quiz" && b.questions?.length>0 && <div style={{ fontSize:11, color:"#2563eb", marginTop:3 }}>❓ {b.questions.length} question{b.questions.length>1?"s":""}</div>}
                                                    {b.type==="document" && b.fichier && <div style={{ fontSize:11, color:"#dc2626", marginTop:3 }}>📄 {b.fichier} {b.taille?`(${b.taille})`:""}</div>}
                                                  </div>
                                                  <span style={{ fontSize:11, color:"#9ca3af", flexShrink:0 }}>{b.dureeMin} min</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ) : (
                                        <div style={{ padding:"10px 12px", borderRadius:8, background:"#f9fafb", fontSize:12, color:"#9ca3af", textAlign:"center" }}>
                                          Aucun contenu — <button onClick={()=>{ openModuleBuilder(c.id, mod.id, mod); }} style={{ ...btnGhost, padding:"0 4px", fontSize:12 }}>Créer le contenu →</button>
                                        </div>
                                      )}
                                      <div style={{ display:"flex", gap:8, marginTop:12 }}>
                                        <button onClick={()=>{ openModuleBuilder(c.id, mod.id, mod); }} style={{ ...btnIconEdit, fontSize:11 }}>✏️ {nbBlocs>0?"Modifier contenu":"Créer contenu"}</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {c.prochainSeance && (
                            <div style={{ marginTop:14, padding:"8px 12px", borderRadius:8, background:c.color+"10", fontSize:11, color:c.color, fontWeight:600 }}>
                              📅 Prochaine séance : {new Date(c.prochainSeance).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════ PLANNING ════════ */}
            {activeTab==="planning" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Planning des Séances</h2><p style={tabSubtitle}>{seances.length} séances · {stats.seancesAV} à venir</p></div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setShowRecurringModal(true)} style={{ ...btnSecondary, marginRight:8 }}>🔄 Séances récurrentes</button>
                  <button onClick={()=>setSemaine(s=>Math.max(0,s-1))} style={btnSecondary} disabled={semaine===0}>← Précédent</button>
                    <span style={{ padding:"7px 14px", background:BET_LIGHT, color:BET, borderRadius:6, fontWeight:600, fontSize:12 }}>
                      Semaine {semaine===0?"courante":`+${semaine}`}
                    </span>
                    <button onClick={()=>setSemaine(s=>s+1)} style={btnSecondary}>Suivant →</button>
                  </div>
                </div>
                {/* Calendrier mini */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6, marginBottom:24 }}>
                  {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((j,i)=>{
                    const base=new Date("2025-12-08"); base.setDate(base.getDate()+semaine*7+i);
                    const ds=base.toISOString().split("T")[0];
                    const sj=seances.filter(s=>s.date===ds);
                    const isToday=ds==="2025-12-09";
                    return (
                      <div key={j} style={{ minHeight:80, padding:7, borderRadius:8, background:isToday?BET_LIGHT:"#f8fafc", border:`1px solid ${isToday?BET:"#e5e7eb"}` }}>
                        <div style={{ fontSize:11, fontWeight:700, color:isToday?BET:"#9ca3af", marginBottom:4 }}>{j} {base.getDate()}</div>
                        {sj.map(s=>(
                          <div key={s.id} style={{ fontSize:9, padding:"3px 5px", borderRadius:4, background:s.type==="online"?"#ede9fe":"#dcfce7", color:s.type==="online"?"#5b21b6":"#166534", marginBottom:2, lineHeight:1.3, cursor:"pointer" }}
                            onClick={()=>{ setSelectedSeance(s); setShowSeanceModal(true); }}>
                            {s.heure} {s.titre.slice(0,18)}…
                          </div>
                        ))}
                        {!sj.length&&<div style={{ fontSize:10, color:"#d1d5db" }}>—</div>}
                      </div>
                    );
                  })}
                </div>
                {/* Filtre + liste */}
                <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                  {["Tous","planifie","confirme","termine","annule"].map(s=>(
                    <button key={s} onClick={()=>setFiltSeanceSt(s)} style={{
                      padding:"4px 12px", borderRadius:20, border:"1px solid", fontSize:12, cursor:"pointer",
                      background: filtSeanceSt===s?(STATUT_SEANCE[s]?.bg||BET_LIGHT):"#fff",
                      color: filtSeanceSt===s?(STATUT_SEANCE[s]?.c||BET):"#6b7280",
                      borderColor: filtSeanceSt===s?(STATUT_SEANCE[s]?.bg||BET):"#e5e7eb",
                      fontWeight: filtSeanceSt===s?700:400,
                    }}>{s==="Tous"?"Toutes":STATUT_SEANCE[s]?.label}</button>
                  ))}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {seancesFiltres.map(s=>{
                    const c=cours.find(x=>x.id===s.coursId);
                    const sm=STATUT_SEANCE[s.statut]||STATUT_SEANCE.planifie;
                    const tauxP=s.nbPresents!==null?Math.round((s.nbPresents/s.nbInscrits)*100):null;
                    return (
                      <div key={s.id} style={{ display:"flex", gap:14, padding:"14px 16px", borderRadius:10, border:`1px solid ${s.statut==="confirme"?BET+"40":"#e5e7eb"}`, background:"#fff" }}>
                        <div style={{ width:48, textAlign:"center", padding:"8px 10px", borderRadius:8, background:s.type==="online"?"#ede9fe":"#dcfce7", flexShrink:0 }}>
                          <div style={{ fontSize:18 }}>{s.type==="online"?"🌐":"🏢"}</div>
                          <div style={{ fontSize:9, fontWeight:700, color:s.type==="online"?"#5b21b6":"#166534" }}>{s.type==="online"?"Online":"Présentiel"}</div>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{s.titre}</div>
                          <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>
                            {c?.emoji} {c?.titre} · 📅 {fmtDateCourt(s.date)} · ⏱ {s.heure} · ⌛ {s.duree} · 📍 {s.salle}
                          </div>
                          <div style={{ fontSize:12, color:"#6b7280" }}>👥 {s.nbInscrits} inscrits{tauxP!==null?` · ✅ ${s.nbPresents}/${s.nbInscrits} présents (${tauxP}%)`:""}</div>
                          {tauxP!==null&&(<div style={{ marginTop:6, maxWidth:200 }}><Bar value={tauxP} color={tauxP>=80?"#22c55e":"#f59e0b"} h={5}/></div>)}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end", flexShrink:0 }}>
                          <span style={{ padding:"3px 10px", borderRadius:10, fontSize:11, fontWeight:700, background:sm.bg, color:sm.c }}>{sm.label}</span>
                          {(s.statut==="confirme"||s.statut==="planifie")&&(
                            <button onClick={()=>openPresence(s)} style={{ ...btnPrimary, padding:"5px 10px", fontSize:11 }}>📋 Feuille de présence</button>
                          )}
                          {s.statut==="planifie"&&(
                            <button onClick={()=>{ setSeances(seances.map(x=>x.id===s.id?{...x,statut:"confirme"}:x)); toast.success("Séance confirmée"); }} style={{ ...btnSecondary, padding:"5px 10px", fontSize:11 }}>✅ Confirmer</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════ ÉTUDIANTS ════════ */}
            {activeTab==="etudiants" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Mes Étudiants</h2><p style={tabSubtitle}>{etudiants.length} étudiants · {etudsFiltres.length} affichés</p></div>
                </div>
                <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                  <input type="text" placeholder="🔍 Nom ou email…" value={searchEtud} onChange={e=>setSearchEtud(e.target.value)} style={{ ...inputSt, marginBottom:0, width:200 }}/>
                  <select value={filtEtudCours} onChange={e=>setFiltEtudCours(e.target.value)} style={{ ...inputSt, marginBottom:0, width:"auto" }}>
                    <option value="Tous">Tous les cours</option>
                    {cours.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.titre}</option>)}
                  </select>
                  <select value={filtEtudNiveau} onChange={e=>setFiltEtudNiveau(e.target.value)} style={{ ...inputSt, marginBottom:0, width:"auto" }}>
                    <option value="Tous">Tous niveaux</option>
                    {Object.keys(NIVEAU_META).map(l=><option key={l}>{l}</option>)}
                  </select>
                  {(filtEtudCours!=="Tous"||filtEtudNiveau!=="Tous"||searchEtud)&&(
                    <button onClick={()=>{setFiltEtudCours("Tous");setFiltEtudNiveau("Tous");setSearchEtud("");}} style={{ ...btnSecondary, padding:"7px 10px", fontSize:11 }}>✕ Reset</button>
                  )}
                  <button onClick={()=>setShowNoteModal(true)} style={{ ...btnPrimary, marginLeft:"auto" }}>+ Saisir une note</button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={tableStyle}><thead><tr>
                    <th style={th}>Étudiant</th><th style={th}>Niveau</th><th style={{ ...th, minWidth:130 }}>Progression</th>
                    <th style={{ ...th, minWidth:130 }}>Assiduité</th><th style={th}>Dern. note</th><th style={th}>Absences</th><th style={th}>Statut</th><th style={th}>Action</th>
                  </tr></thead><tbody>
                    {etudsFiltres.map(e=>(
                      <tr key={e.id} style={{ borderTop:"1px solid #f1f5f9", background:e.assiduite<75||e.progression<40?"#fff9f0":"transparent" }}>
                        <td style={td}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:"50%", background:BET_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11, color:BET, flexShrink:0 }}>
                              {e.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, fontSize:13 }}>{e.nom}</div>
                              <div style={{ fontSize:11, color:"#9ca3af" }}>{e.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={td}><NivBadge n={e.niveau}/></td>
                        <td style={{ ...td, minWidth:130 }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            <div style={{ flex:1 }}><Bar value={e.progression} color={e.progression>=60?BET:"#f59e0b"}/></div>
                            <span style={{ fontSize:12, fontWeight:700, color:e.progression>=60?BET:"#f59e0b", minWidth:32 }}>{e.progression}%</span>
                          </div>
                        </td>
                        <td style={{ ...td, minWidth:130 }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            <div style={{ flex:1 }}><Bar value={e.assiduite} color={e.assiduite>=85?"#22c55e":e.assiduite>=70?"#f59e0b":"#ef4444"}/></div>
                            <span style={{ fontSize:12, fontWeight:700, color:e.assiduite>=85?"#22c55e":e.assiduite>=70?"#f59e0b":"#ef4444", minWidth:32 }}>{e.assiduite}%</span>
                          </div>
                        </td>
                        <td style={{ ...td, fontWeight:800, color:e.dernNote>=10?"#22c55e":"#ef4444", fontSize:15 }}>{e.dernNote}/20</td>
                        <td style={{ ...td, fontWeight:700, color:e.absent>5?"#ef4444":e.absent>2?"#f59e0b":"#374151" }}>{e.absent}</td>
                        <td style={td}><Sbadge s={e.statut}/></td>
                        <td style={td}>
                          <button onClick={()=>{ setSelectedEtud(e); setShowEtudModal(true); }} style={btnIconEdit}>🔍 Fiche</button>
                        </td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              </div>
            )}

            {/* ════════ PRÉSENCES ════════ */}
            {activeTab==="presences" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Gestion des Présences</h2><p style={tabSubtitle}>Historique et saisie des feuilles de présence</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                  {[
                    { l:"Taux global",        v:`${stats.tauxAssidMoyen}%`, c:stats.tauxAssidMoyen>=85?"#22c55e":"#f59e0b" },
                    { l:"Séances enregistrées",v:seances.filter(s=>s.nbPresents!==null).length, c:BET },
                    { l:"Total présences",     v:seances.reduce((s,se)=>s+(se.nbPresents||0),0), c:"#7c3aed" },
                    { l:"Absences signalées",  v:etudiants.reduce((s,e)=>s+e.absent,0), c:"#ef4444" },
                  ].map(s=>(
                    <div key={s.l} style={{ textAlign:"center", padding:14, borderRadius:10, background:"#f8fafc" }}>
                      <div style={{ fontSize:11, color:"#9ca3af" }}>{s.l}</div>
                      <div style={{ fontSize:24, fontWeight:800, color:s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <table style={tableStyle}><thead><tr>
                  <th style={th}>Séance</th><th style={th}>Cours</th><th style={th}>Date</th><th style={{ ...th, minWidth:150 }}>Taux de présence</th><th style={th}>Statut</th><th style={th}>Action</th>
                </tr></thead><tbody>
                  {[...seances].sort((a,b)=>b.date.localeCompare(a.date)).map(s=>{
                    const c=cours.find(x=>x.id===s.coursId);
                    const sm=STATUT_SEANCE[s.statut]||STATUT_SEANCE.planifie;
                    const tauxP=s.nbPresents!==null?Math.round((s.nbPresents/s.nbInscrits)*100):null;
                    return (
                      <tr key={s.id} style={{ borderTop:"1px solid #f1f5f9" }}>
                        <td style={td}><div style={{ fontWeight:500, fontSize:13 }}>{s.titre}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{s.heure} · {s.type==="online"?"🌐":"🏢"} {s.salle}</div></td>
                        <td style={{ ...td, fontSize:12 }}>{c?.emoji} {c?.titre}</td>
                        <td style={{ ...td, fontSize:12, color:"#6b7280" }}>{fmtDateCourt(s.date)}</td>
                        <td style={{ ...td, minWidth:150 }}>
                          {tauxP!==null?(
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              <div style={{ flex:1 }}><Bar value={tauxP} color={tauxP>=80?"#22c55e":"#f59e0b"} h={5}/></div>
                              <span style={{ fontSize:12, fontWeight:700, color:tauxP>=80?"#22c55e":"#f59e0b" }}>{s.nbPresents}/{s.nbInscrits}</span>
                            </div>
                          ):<span style={{ color:"#9ca3af", fontSize:12 }}>Non enregistré</span>}
                        </td>
                        <td style={td}><span style={{ padding:"3px 9px", borderRadius:10, fontSize:11, fontWeight:700, background:sm.bg, color:sm.c }}>{sm.label}</span></td>
                        <td style={td}>
                          {(s.statut==="confirme"||s.statut==="planifie")?
                            <button onClick={()=>openPresence(s)} style={btnIconEdit}>📋 Saisir</button>
                          :<span style={{ fontSize:11, color:"#9ca3af" }}>{tauxP!==null?"✅ Enregistré":"—"}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody></table>
              </div>
            )}

            {/* ════════ ÉVALUATIONS ════════ */}
            {activeTab==="evaluations" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Évaluations</h2><p style={tabSubtitle}>{evaluations.length} évaluations · {evalAVenir} à venir</p></div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>{ setEvalForm(f=>({...f,coursId:1,type:"qcm"})); setShowCreateEvalModal(true); }} style={btnPrimary}>+ Évaluation / Examen</button>
                    <button onClick={()=>{ setEvalForm(f=>({...f,coursId:1,type:"speaking",categorie:"evaluation"})); setShowCreateEvalModal(true); }} style={{ ...btnPrimary, background:"#dc2626" }}>🎤 Speaking</button>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))", gap:16 }}>
                  {evaluations.map(ev=>{
                    const c=cours.find(x=>x.id===ev.coursId);
                    const isAV=ev.statut==="a_venir";
                    return (
                      <div key={ev.id} style={{ borderRadius:12, border:`1px solid ${isAV?BET+"50":"#e5e7eb"}`, background:"#fff", padding:16 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            <span style={{ fontSize:20 }}>{c?.emoji||"📝"}</span>
                            <div>
                              <div style={{ fontWeight:700, fontSize:13 }}>{ev.titre}</div>
                              <div style={{ fontSize:11, color:"#9ca3af" }}>{c?.titre} · {fmtDate(ev.date)}</div>
                            </div>
                          </div>
                          <span style={{ padding:"3px 9px", borderRadius:10, fontSize:11, fontWeight:700,
                            background:isAV?"#dbeafe":"#dcfce7", color:isAV?"#1e40af":"#166534", flexShrink:0 }}>
                            {isAV?"📅 À venir":"✅ Corrigé"}
                          </span>
                        </div>
                        <div style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>👥 {ev.nbEtudiants} étudiants</div>
                        {!isAV&&ev.moyenneClasse!==null&&(
                          <>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                              {[
                                { l:"Moyenne",       v:ev.surTOEIC?ev.moyenneClasse:`${ev.moyenneClasse}/20`, c:"#2563eb" },
                                { l:"Taux réussite", v:`${ev.tauxReussite}%`, c:ev.tauxReussite>=70?"#22c55e":"#f59e0b" },
                                { l:"Min",          v:ev.surTOEIC?ev.min:`${ev.min}/20`, c:"#ef4444" },
                                { l:"Max",          v:ev.surTOEIC?ev.max:`${ev.max}/20`, c:"#22c55e" },
                              ].map(s=>(
                                <div key={s.l} style={{ padding:"6px 10px", borderRadius:7, background:"#f8fafc", textAlign:"center" }}>
                                  <div style={{ fontSize:10, color:"#9ca3af" }}>{s.l}</div>
                                  <div style={{ fontSize:15, fontWeight:800, color:s.c }}>{s.v}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ marginBottom:8 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                                <span style={{ color:"#9ca3af" }}>Taux de réussite</span>
                                <strong style={{ color:ev.tauxReussite>=70?"#22c55e":"#f59e0b" }}>{ev.tauxReussite}%</strong>
                              </div>
                              <Bar value={ev.tauxReussite} color={ev.tauxReussite>=70?"#22c55e":"#f59e0b"}/>
                            </div>
                          </>
                        )}
                        {ev.type==="speaking"&&(
                          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:8 }}>
                            <span style={{ padding:"3px 10px",borderRadius:10,fontSize:11,fontWeight:700,background:"#fef2f2",color:"#dc2626" }}>🎤 Speaking oral</span>
                            {ev.speakPrepTime&&<span style={{ fontSize:11,color:"#9ca3af" }}>⏱ Prépa {ev.speakPrepTime}s · 🎙 Réponse {ev.speakRecordTime}s</span>}
                          </div>
                        )}
                        {isAV&&(
                          <div style={{ padding:"8px 12px", borderRadius:8, background:ev.type==="speaking"?"#fef2f2":"#eff6ff", fontSize:12, color:ev.type==="speaking"?"#dc2626":"#1e40af" }}>
                            {ev.type==="speaking"?"🎤":"📋"} {ev.type==="speaking"?"Speaking programmé le":"Évaluation prévue le"} {fmtDate(ev.date)} — {ev.nbEtudiants} étudiants attendus
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════ NOTES ════════ */}
            {activeTab==="notes" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Gestion des Notes</h2><p style={tabSubtitle}>Saisie et suivi des résultats individuels</p></div>
                  <button onClick={()=>setShowNoteModal(true)} style={btnPrimary}>+ Saisir une note</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
                  {[
                    { l:"Moyenne générale",   v:`${(etudiants.reduce((s,e)=>s+e.dernNote,0)/etudiants.length).toFixed(1)}/20`, c:"#6366f1" },
                    { l:"Taux de réussite",   v:`${Math.round(etudiants.filter(e=>e.dernNote>=10).length/etudiants.length*100)}%`, c:"#22c55e" },
                    { l:"En difficulté (<10)",v:etudiants.filter(e=>e.dernNote<10).length, c:"#ef4444" },
                  ].map(s=>(
                    <div key={s.l} style={{ textAlign:"center", padding:14, borderRadius:10, background:"#f8fafc" }}>
                      <div style={{ fontSize:11, color:"#9ca3af" }}>{s.l}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <table style={tableStyle}><thead><tr>
                  <th style={th}>Étudiant</th><th style={th}>Niveau</th><th style={th}>Cours</th><th style={th}>Dernière note</th><th style={{ ...th, minWidth:150 }}>Performance</th><th style={th}>Commentaire</th><th style={th}>Action</th>
                </tr></thead><tbody>
                  {[...etudiants].sort((a,b)=>b.dernNote-a.dernNote).map(e=>(
                    <tr key={e.id} style={{ borderTop:"1px solid #f1f5f9", background:e.dernNote<10?"#fff5f5":"transparent" }}>
                      <td style={td}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{e.nom}</div>
                        <div style={{ fontSize:11, color:"#9ca3af" }}>{e.email}</div>
                      </td>
                      <td style={td}><NivBadge n={e.niveau}/></td>
                      <td style={td}><div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                        {e.coursIds.map(cId=>{ const c=cours.find(x=>x.id===cId); return c&&<span key={cId} style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background:c.color+"15", color:c.color }}>{c.emoji}</span>; })}</div></td>
                      <td style={td}><span style={{ fontSize:18, fontWeight:900, color:e.dernNote>=14?"#22c55e":e.dernNote>=10?"#f59e0b":"#ef4444" }}>{e.dernNote}/20</span></td>
                      <td style={{ ...td, minWidth:150 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <div style={{ flex:1 }}><Bar value={(e.dernNote/20)*100} color={e.dernNote>=14?"#22c55e":e.dernNote>=10?"#f59e0b":"#ef4444"}/></div>
                          <span style={{ fontSize:11, color:"#9ca3af" }}>{Math.round((e.dernNote/20)*100)}%</span>
                        </div>
                      </td>
                      <td style={{ ...td, fontSize:11, color:e.commentaire?"#374151":"#d1d5db", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {e.commentaire||"—"}
                      </td>
                      <td style={td}>
                        <button onClick={()=>{
                          setNoteForm({ etudiantId:String(e.id), evalNom:"", score:String(e.dernNote), total:"20", commentaire:e.commentaire||"" });
                          setShowNoteModal(true);
                        }} style={btnIconEdit}>✏️</button>
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            )}

            {/* ════════ RESSOURCES ════════ */}
            {activeTab==="ressources" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Ressources Pédagogiques</h2><p style={tabSubtitle}>{ressources.length} ressources · {ressources.filter(r=>r.partage).length} partagées</p></div>
                  <button onClick={()=>setShowAddRessModal(true)} style={btnPrimary}>+ Ajouter une ressource</button>
                </div>
                <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
                  {["Tous",...Object.keys(TYPE_RESSOURCE)].map(t=>{
                    const meta=TYPE_RESSOURCE[t];
                    return (
                      <button key={t} onClick={()=>setFiltRessType(t)} style={{
                        padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:12, cursor:"pointer",
                        background: filtRessType===t?(meta?.color||BET)+"15":"#fff",
                        color: filtRessType===t?(meta?.color||BET):"#6b7280",
                        borderColor: filtRessType===t?(meta?.color||BET):"#e5e7eb",
                        fontWeight: filtRessType===t?700:400,
                      }}>{meta?`${meta.icon} ${meta.label}`:"Tous"}</button>
                    );
                  })}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:12 }}>
                  {ressources.filter(r=>filtRessType==="Tous"||r.type===filtRessType).map(r=>{
                    const meta=TYPE_RESSOURCE[r.type];
                    return (
                      <div key={r.id} style={{ borderRadius:10, border:"1px solid #e5e7eb", background:"#fff", padding:14 }}>
                        <div style={{ display:"flex", gap:10, marginBottom:10 }}>
                          <div style={{ width:40, height:40, borderRadius:8, background:meta.color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                            {meta.icon}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600, fontSize:13, lineHeight:1.4 }}>{r.titre}</div>
                            <div style={{ fontSize:11, color:"#9ca3af" }}>{r.cours}</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:10 }}>
                          <span style={{ padding:"2px 7px", borderRadius:6, background:meta.color+"12", color:meta.color, fontWeight:600 }}>{meta.icon} {meta.label}</span>
                          <span style={{ color:"#9ca3af" }}>{r.taille||r.duree}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:r.partage?"#dcfce7":"#f3f4f6", color:r.partage?"#166534":"#6b7280", fontWeight:600 }}>
                            {r.partage?"✅ Partagé":"🔒 Privé"}
                          </span>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={()=>{ setRessources(ressources.map(x=>x.id===r.id?{...x,partage:!x.partage}:x)); toast.success(r.partage?"Ressource rendue privée":"Ressource partagée avec les étudiants"); }}
                              style={btnIconToggle}>{r.partage?"🔒":"🔓"}</button>
                            <button onClick={()=>{ setRessources(ressources.filter(x=>x.id!==r.id)); toast.success("Supprimé"); }} style={btnIconDelete}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* ════════ MODULES & CONTENU ════════ */}
            {activeTab==="modules_contenu" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Modules & Contenu des Cours</h2><p style={tabSubtitle}>Créez, organisez et publiez vos contenus pédagogiques interactifs</p></div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setShowNotifModal(true)} style={btnSecondary}>🔔 Notifier</button>
                    <button onClick={()=>exportCSVProgressions(selectedCoursModules)} style={btnSecondary}>⬇️ CSV</button>
                    <button onClick={()=>{ setNewModForm({coursId:selectedCoursModules,titre:"",objectifs:"",dureeEstimee:60}); setShowNewModuleModal(true); }} style={btnPrimary}>+ Nouveau module</button>
                    <button onClick={()=>setShowNewCoursModal(true)} style={{ ...btnPrimary, background:"#059669" }}>+ Nouveau cours</button>
                  </div>
                </div>
                {/* Sélecteur cours */}
                {cours.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"60px 24px", borderRadius:16, border:"2px dashed #e5e7eb", marginBottom:20 }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>📚</div>
                    <div style={{ fontWeight:700, fontSize:16, color:"#374151", marginBottom:6 }}>Aucun cours pour l'instant</div>
                    <div style={{ fontSize:13, color:"#9ca3af", marginBottom:20 }}>Créez votre premier cours pour commencer à programmer des modules et du contenu.</div>
                    <button onClick={()=>setShowNewCoursModal(true)} style={{ ...btnPrimary, padding:"11px 24px", fontSize:14 }}>+ Créer mon premier cours</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                    {cours.map(c=>(
                      <button key={c.id} onClick={()=>setSelectedCoursModules(c.id)}
                        style={{ padding:"8px 16px", borderRadius:8, border:`2px solid ${selectedCoursModules===c.id?c.color:"#e5e7eb"}`, background:selectedCoursModules===c.id?c.color+"10":"#fff", cursor:"pointer", fontWeight:selectedCoursModules===c.id?700:400, color:selectedCoursModules===c.id?c.color:"#374151", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
                        <span style={{ fontSize:18 }}>{c.emoji}</span>{c.titre}
                      </button>
                    ))}
                  </div>
                )}
                {(() => {
                  const coursSel=cours.find(c=>c.id===selectedCoursModules);
                  if(!coursSel)return null;
                  const mc=modulesContent[String(selectedCoursModules)]||{};
                  const totalDuree=Object.values(mc).reduce((s,m)=>s+(m.dureeEstimee||0),0);
                  return (
                    <div>
                      <div style={{ padding:"12px 18px", borderRadius:12, background:`${coursSel.color}08`, border:`1px solid ${coursSel.color}30`, marginBottom:20, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ fontSize:13, color:"#374151" }}>📚 <strong>{coursSel.modules}</strong> modules · ⏱ <strong>{totalDuree} min</strong> · 👥 <strong>{coursSel.etudiants}</strong> étudiants · ✅ <strong style={{ color:coursSel.color }}>{coursSel.modulesOk}/{coursSel.modules}</strong> publiés</span>
                        <button onClick={()=>{ setSelectedCoursAnalytics(selectedCoursModules); setShowAnalyticsModal(true); }} style={{ ...btnSecondary, padding:"5px 12px", fontSize:11, marginLeft:"auto" }}>📊 Analytics</button>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        {coursSel.modules_list.map((mod,idx)=>{
                          const content=mc[String(mod.id)];
                          const sm=STATUT_MODULE[content?.statut||"brouillon"];
                          const nbBlocs=content?.blocs?.length||0;
                          const etudsCours=etudiants.filter(e=>e.coursIds.includes(selectedCoursModules));
                          const termines=etudsCours.filter(e=>studentProgressions[e.id]?.[String(selectedCoursModules)]?.[String(mod.id)]?.statut==="termine").length;
                          const pctFini=etudsCours.length?Math.round((termines/etudsCours.length)*100):0;
                          return (
                            <div key={mod.id} style={{ borderRadius:12, border:"1px solid #e5e7eb", background:"#fff", overflow:"hidden" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderBottom:nbBlocs>0?"1px solid #f1f5f9":"none" }}>
                                <div style={{ width:36,height:36,borderRadius:"50%",background:`${coursSel.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:coursSel.color,flexShrink:0 }}>{idx+1}</div>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontWeight:700,fontSize:14,color:"#0f172a" }}>{content?.titre||mod.nom}</div>
                                  <div style={{ fontSize:11,color:"#9ca3af",marginTop:2 }}>
                                    ⏱ {content?.dureeEstimee||"—"} min · 📦 {nbBlocs} blocs · 🎯 {content?.objectifs?.length||0} objectif(s) · 👥 {termines}/{etudsCours.length} terminé(s) ({pctFini}%)
                                  </div>
                                  {etudsCours.length>0&&(
                                    <div style={{ marginTop:5,height:4,background:"#e5e7eb",borderRadius:2,overflow:"hidden",maxWidth:200 }}>
                                      <div style={{ height:"100%",width:`${pctFini}%`,background:pctFini>=80?"#22c55e":pctFini>=40?"#f59e0b":"#ef4444",borderRadius:2 }}/>
                                    </div>
                                  )}
                                </div>
                                <span style={{ padding:"3px 10px",borderRadius:10,fontSize:11,fontWeight:700,background:sm.bg,color:sm.c }}>{sm.label}</span>
                                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                                  <button onClick={()=>openModuleBuilder(selectedCoursModules,mod.id,mod)} style={{ ...btnIconEdit,display:"flex",alignItems:"center",gap:4,fontSize:11 }}>
                                    {nbBlocs>0?"✏️ Modifier":"➕ Créer contenu"}
                                  </button>
                                  <button onClick={()=>{ setSelectedEtudProg({coursId:selectedCoursModules,moduleId:mod.id,moduleTitre:content?.titre||mod.nom}); setShowProgEtudModal(true); }} style={btnIconToggle} title="Progression individuelle">👥</button>
                                  {content?.confirmeCoach ? (
                                    <span style={{ padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700,background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0" }}>✅ Confirmé</span>
                                  ) : (
                                    <button onClick={()=>{ setConfirmModuleTarget({coursId:selectedCoursModules,moduleId:mod.id,titre:content?.titre||mod.nom}); setShowConfirmModuleModal(true); }} style={{ padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,background:"#fef9ee",color:"#d97706",border:"1px solid #fde68a",cursor:"pointer" }}>✓ Confirmer effectué</button>
                                  )}
                                </div>
                              </div>
                              {nbBlocs>0&&(
                                <div style={{ padding:"10px 18px",display:"flex",gap:8,flexWrap:"wrap" }}>
                                  {content.blocs.slice(0,5).map(b=>{ const bt=BLOCK_TYPES[b.type]||BLOCK_TYPES.texte; return (
                                    <div key={b.id} style={{ display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:16,background:bt.color+"12",fontSize:11,color:bt.color,fontWeight:500 }}>
                                      {bt.icon} {b.titre.slice(0,20)}{b.titre.length>20?"…":""} <span style={{ opacity:0.6 }}>·{b.dureeMin}min</span>
                                    </div>
                                  );})}
                                  {nbBlocs>5&&<span style={{ fontSize:11,color:"#9ca3af",padding:"4px 0" }}>+{nbBlocs-5} bloc(s)…</span>}
                                </div>
                              )}
                              {nbBlocs===0&&<div style={{ padding:"8px 18px",fontSize:12,color:"#9ca3af",fontStyle:"italic" }}>Aucun contenu — cliquez "Créer contenu" pour commencer.</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ════════ ANALYTIQUES ════════ */}
            {activeTab==="analytics" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Analytiques des Cours</h2><p style={tabSubtitle}>Suivi de l'engagement et des performances</p></div>
                  <button onClick={exportCSVNotes} style={btnSecondary}>⬇️ Export CSV global</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
                  {cours.map(c=>{
                    const etudsCours=etudiants.filter(e=>e.coursIds.includes(c.id));
                    const avgProg=etudsCours.length?Math.round(etudsCours.reduce((s,e)=>s+e.progression,0)/etudsCours.length):0;
                    const avgAssid=etudsCours.length?Math.round(etudsCours.reduce((s,e)=>s+e.assiduite,0)/etudsCours.length):0;
                    const analytics=getCoursAnalytics(c.id);
                    return (
                      <div key={c.id} style={{ borderRadius:14,border:"1px solid #e5e7eb",background:"#fff",overflow:"hidden",cursor:"pointer" }}
                        onClick={()=>{ setSelectedCoursAnalytics(c.id); setShowAnalyticsModal(true); }}>
                        <div style={{ height:4,background:c.color }}/>
                        <div style={{ padding:18 }}>
                          <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:14 }}>
                            <span style={{ fontSize:22 }}>{c.emoji}</span>
                            <div><div style={{ fontWeight:700,fontSize:14 }}>{c.titre}</div><div style={{ fontSize:11,color:"#9ca3af" }}>{etudsCours.length} étudiants · {c.modulesOk}/{c.modules} modules publiés</div></div>
                          </div>
                          {[{ l:"Progression moy.",v:`${avgProg}%`,w:avgProg,col:c.color },{ l:"Assiduité moy.",v:`${avgAssid}%`,w:avgAssid,col:avgAssid>=85?"#22c55e":"#f59e0b" }].map(s=>(
                            <div key={s.l} style={{ marginBottom:10 }}>
                              <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3 }}><span style={{ color:"#9ca3af" }}>{s.l}</span><strong style={{ color:s.col }}>{s.v}</strong></div>
                              <div style={{ height:6,background:"#e5e7eb",borderRadius:3,overflow:"hidden" }}><div style={{ height:"100%",width:`${s.w}%`,background:s.col,borderRadius:3 }}/></div>
                            </div>
                          ))}
                          <div style={{ marginTop:10,paddingTop:10,borderTop:"1px solid #f1f5f9",display:"flex",gap:6 }}>
                            <button onClick={e=>{e.stopPropagation();exportCSVProgressions(c.id);}} style={{ ...btnSecondary,padding:"4px 10px",fontSize:11,flex:1 }}>⬇️ CSV progression</button>
                            <button onClick={e=>{e.stopPropagation();exportCSVNotes();}} style={{ ...btnSecondary,padding:"4px 10px",fontSize:11,flex:1 }}>⬇️ CSV notes</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════ NOTIFICATIONS ════════ */}
            {activeTab==="notifs" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Notifications</h2><p style={tabSubtitle}>{notifications.length} envoyées · Informez vos étudiants</p></div>
                  <button onClick={()=>setShowNotifModal(true)} style={btnPrimary}>+ Nouvelle notification</button>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  {notifications.map(n=>{ const tc={ module_publie:{bg:"#dcfce7",c:"#166534",icon:"📚"}, evaluation:{bg:"#dbeafe",c:"#1e40af",icon:"📝"}, ressource_ajoutee:{bg:"#ede9fe",c:"#5b21b6",icon:"📄"}, info:{bg:"#f3f4f6",c:"#374151",icon:"ℹ️"} }; const tm=tc[n.type]||tc.info; return (
                    <div key={n.id} style={{ padding:"14px 16px",borderRadius:10,border:"1px solid #e5e7eb",background:"#fff",display:"flex",gap:12,alignItems:"flex-start" }}>
                      <div style={{ width:36,height:36,borderRadius:8,background:tm.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{tm.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:13,color:"#0f172a" }}>{n.titre}</div>
                        <div style={{ fontSize:12,color:"#6b7280",marginTop:2 }}>{n.message}</div>
                        <div style={{ fontSize:11,color:"#9ca3af",marginTop:5,display:"flex",gap:12,flexWrap:"wrap" }}>
                          <span>📚 {n.cours}</span><span>👥 {n.destinataires} dest.</span><span>📅 {fmtDate(n.date)}</span>
                        </div>
                      </div>
                      <span style={{ padding:"3px 9px",borderRadius:10,fontSize:10,fontWeight:700,background:tm.bg,color:tm.c }}>{n.statut}</span>
                    </div>
                  );})}
                </div>
              </div>
            )}

            {/* ════════ MESSAGES ════════ */}
            {activeTab==="messages" && (
              <div style={{ background:"#fff", padding:24, borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                <MessagerieTab accentColor={BET} />
              </div>
            )}

            {/* ════════ GROUPES ════════ */}
            {activeTab==="groupes" && (
  <div>
      {/* ── Grille groupes (toujours visible) ── */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0f172a" }}>👥 Mes Groupes</h2>
            <p style={{ margin:"3px 0 0", fontSize:13, color:"#9ca3af" }}>{groupes.length} groupe{groupes.length>1?"s":""} assigné{groupes.length>1?"s":""} — cliquez sur un groupe pour l'ouvrir</p>
          </div>
        </div>

        {groupesLoading && <p style={{ textAlign:"center", color:"#9ca3af", padding:40 }}>Chargement…</p>}

        {!groupesLoading && groupes.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", background:"#f8fafc", borderRadius:16, border:"1px solid #e5e7eb" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
            <div style={{ fontWeight:700, fontSize:15, color:"#0f172a" }}>Aucun groupe assigné</div>
            <p style={{ color:"#9ca3af", fontSize:13 }}>L'assistante onboarding vous assignera des groupes.</p>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
          {groupes.map(g => {
            const statutColor = g.statut==="actif" ? "#059669" : g.statut==="suspendu" ? "#d97706" : "#6b7280";
            const statutBg    = g.statut==="actif" ? "#d1fae5" : g.statut==="suspendu" ? "#fef3c7" : "#f1f5f9";
            const nbApp = g.nb_apprenants || 0;
            const cap   = g.capacite_max  || 20;
            const pctCap = Math.round((nbApp / cap) * 100);
            return (
              <div key={g.id} onClick={() => fetchGroupeDetail(g)}
                style={{ background:"#fff", borderRadius:14, border:"1.5px solid #e5e7eb", overflow:"hidden", cursor:"pointer", transition:"all .15s", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=BET; e.currentTarget.style.boxShadow=`0 4px 16px rgba(0,0,0,0.10)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#e5e7eb"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.05)"; }}>
                <div style={{ height:4, background:BET_GRAD }}/>
                <div style={{ padding:18 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                    <div style={{ width:46, height:46, borderRadius:12, background:BET_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>👥</div>
                    <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:statutBg, color:statutColor }}>{g.statut}</span>
                  </div>
                  <div style={{ fontWeight:800, fontSize:15, color:"#0f172a", marginBottom:4 }}>{g.nom}</div>
                  {g.niveau && <div style={{ fontSize:12, color:BET, fontWeight:600, marginBottom:8 }}>📊 {g.niveau}{g.filiere ? ` · ${g.filiere}` : ""}</div>}
                  {/* Barre quota */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                      <span style={{ color:"#6b7280" }}>👤 {nbApp} / {cap} apprenants</span>
                      <span style={{ fontWeight:700, color:pctCap>=90?"#dc2626":pctCap>=70?"#d97706":"#059669" }}>{pctCap}%</span>
                    </div>
                    <div style={{ height:5, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min(pctCap,100)}%`, background:pctCap>=90?"#ef4444":pctCap>=70?"#f59e0b":"#22c55e", borderRadius:3 }}/>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10, fontSize:11, color:"#6b7280", flexWrap:"wrap" }}>
                    {g.date_debut && <span>📅 {new Date(g.date_debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</span>}
                    <span>{g.type_cours === "en_ligne" ? "💻 En ligne" : g.type_cours === "domicile" ? "🏠 Domicile" : "🏢 Centre"}</span>
                  </div>
                  {g.horaire?.length > 0 && (
                    <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:4 }}>
                      {g.horaire.map((h,i) => (
                        <span key={i} style={{ padding:"2px 7px", borderRadius:6, background:"#f0f9ff", color:BET, fontSize:10, fontWeight:600 }}>
                          {h.jour} {h.debut}–{h.fin}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop:12, fontSize:11, color:BET, fontWeight:600, textAlign:"center", padding:"6px", background:BET_LIGHT, borderRadius:7 }}>
                    Cliquer pour ouvrir →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal détail groupe ── */}
      {selectedGroupe && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}
          onClick={()=>{ setSelectedGroupe(null); setGroupeSubTab("apprenants"); }}>
          <div style={{ background:"#fff",borderRadius:18,width:"97vw",maxWidth:1140,height:"93vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.35)",overflow:"hidden" }}
            onClick={e=>e.stopPropagation()}>

            {/* En-tête modal */}
            <div style={{ background:BET_GRAD,padding:"18px 24px",color:"#fff",flexShrink:0,display:"flex",gap:16,alignItems:"flex-start" }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:10,color:"#7dd3fc",fontWeight:700,letterSpacing:"0.08em",marginBottom:3 }}>GROUPE</div>
                <div style={{ fontSize:19,fontWeight:900,marginBottom:5 }}>{selectedGroupe.nom}</div>
                <div style={{ fontSize:12,color:"#bae6fd",display:"flex",gap:14,flexWrap:"wrap" }}>
                  {selectedGroupe.niveau && <span>📊 {selectedGroupe.niveau}</span>}
                  {selectedGroupe.filiere && <span>🎓 {selectedGroupe.filiere}</span>}
                  <span>👤 {groupeApprenants.filter(a=>a.statut==="actif").length} apprenants actifs</span>
                  {selectedGroupe.date_debut && <span>📅 Début : {new Date(selectedGroupe.date_debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</span>}
                  <span>{selectedGroupe.type_cours==="en_ligne"?"💻 En ligne":selectedGroupe.type_cours==="domicile"?"🏠 Domicile":"🏢 Centre"}</span>
                </div>
                {selectedGroupe.horaire?.length > 0 && (
                  <div style={{ marginTop:8,display:"flex",gap:5,flexWrap:"wrap" }}>
                    {selectedGroupe.horaire.map((h,i) => (
                      <span key={i} style={{ padding:"2px 9px",borderRadius:7,background:"rgba(255,255,255,0.18)",fontSize:11,fontWeight:600 }}>
                        {h.jour} {h.debut}–{h.fin}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={()=>{ setSelectedGroupe(null); setGroupeSubTab("apprenants"); }}
                style={{ background:"rgba(255,255,255,0.18)",border:"none",color:"#fff",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2 }}>
                ✕
              </button>
            </div>

            {/* Onglets */}
            <div style={{ display:"flex",gap:0,background:"#fafafa",borderBottom:"1px solid #e5e7eb",flexShrink:0,overflowX:"auto" }}>
              {[
                { key:"apprenants", label:`Apprenants (${groupeApprenants.filter(a=>a.statut==="actif").length})`, icon:"👤" },
                { key:"chat",       label:"Chat groupe",  icon:"💬" },
                { key:"fichiers",   label:`Fichiers (${groupeFichiers.length})`, icon:"📎" },
                { key:"presences",  label:"Présences", icon:"✅" },
                { key:"cours",      label:"Historique cours", icon:"📚" },
              ].map(t => (
                <button key={t.key} onClick={() => setGroupeSubTab(t.key)}
                  style={{ padding:"12px 18px",border:"none",borderBottom:groupeSubTab===t.key?`3px solid ${BET}`:"3px solid transparent",fontSize:12,fontWeight:600,cursor:"pointer",
                    background:"transparent",color:groupeSubTab===t.key?BET:"#64748b",whiteSpace:"nowrap",flexShrink:0 }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Corps scrollable */}
            <div style={{ flex:1,overflowY:"auto",padding:"20px 24px" }}>

        {groupeSubTab==="apprenants" && (
          <div>
            {groupeApprenants.filter(a=>a.statut==="actif").length === 0
              ? <div style={{ textAlign:"center", padding:"40px 20px", color:"#9ca3af", background:"#f8fafc", borderRadius:12 }}>Aucun apprenant dans ce groupe.</div>
              : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:12 }}>
                  {groupeApprenants.filter(a=>a.statut==="actif").map(a => {
                    const initiales = [(a.prenom_apprenant||""),(a.nom_apprenant||"")].map(s=>s[0]||"").join("").toUpperCase() || "?";
                    const NIVEAU_COLOR = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };
                    const nColor = NIVEAU_COLOR[a.niveau] || "#6b7280";
                    let noteObj = null;
                    try { noteObj = a.note ? JSON.parse(a.note) : null; } catch { noteObj = null; }
                    return (
                      <div key={a.id}
                        onClick={() => {
                          setApprenantDetail(a);
                          setFicheFicheTab("profil");
                          setFicheTest(null);
                          setFichePres([]);
                          if (a.email_apprenant) {
                            setFicheTestLoading(true);
                            fetch(`${API_URL}/api/level-test/result?email=${encodeURIComponent(a.email_apprenant)}`)
                              .then(r=>r.ok?r.json():null)
                              .then(d=>setFicheTest(d?.result||null))
                              .catch(()=>{})
                              .finally(()=>setFicheTestLoading(false));
                          }
                        }}
                        style={{ background:"#fff", borderRadius:12, border:"1.5px solid #e5e7eb", overflow:"hidden", cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", transition:"all .15s" }}
                        onMouseEnter={e=>{ e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.10)"; e.currentTarget.style.borderColor=BET+"60"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor="#e5e7eb"; }}
                      >
                        <div style={{ height:3, background:`linear-gradient(90deg,${BET},#0891b2)` }}/>
                        <div style={{ padding:"14px 16px" }}>
                          {/* Header */}
                          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                            <div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,#0f172a,${BET})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:"#fff", flexShrink:0 }}>{initiales}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:800, color:"#0f172a", fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {[a.prenom_apprenant, a.nom_apprenant].filter(Boolean).join(" ")}
                              </div>
                              <div style={{ fontSize:11, color:"#6b7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.email_apprenant || "—"}</div>
                            </div>
                            <span style={{ padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:800, color:"#fff", background:nColor, flexShrink:0 }}>{a.niveau || "—"}</span>
                          </div>
                          {/* Infos rapides */}
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
                            <div style={{ padding:"5px 8px", borderRadius:6, background:"#f8fafc" }}>
                              <div style={{ fontSize:9, color:"#9ca3af" }}>Téléphone</div>
                              <div style={{ fontSize:11, fontWeight:700, color:"#374151" }}>{a.telephone || "—"}</div>
                            </div>
                            <div style={{ padding:"5px 8px", borderRadius:6, background:"#f8fafc" }}>
                              <div style={{ fontSize:9, color:"#9ca3af" }}>Programme</div>
                              <div style={{ fontSize:11, fontWeight:700, color:"#374151", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{noteObj?.programme || selectedGroupe?.filiere || "—"}</div>
                            </div>
                            {noteObj?.date_debut && (
                              <div style={{ padding:"5px 8px", borderRadius:6, background:"#f8fafc" }}>
                                <div style={{ fontSize:9, color:"#9ca3af" }}>Date début</div>
                                <div style={{ fontSize:11, fontWeight:700, color:"#374151" }}>{new Date(noteObj.date_debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div>
                              </div>
                            )}
                            {noteObj?.date_renouvellement && (
                              <div style={{ padding:"5px 8px", borderRadius:6, background:"#f8fafc" }}>
                                <div style={{ fontSize:9, color:"#9ca3af" }}>Renouvellement</div>
                                <div style={{ fontSize:11, fontWeight:700, color:"#374151" }}>{new Date(noteObj.date_renouvellement).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div>
                              </div>
                            )}
                          </div>
                          {/* Attentes (aperçu) */}
                          {noteObj?.attentes && (
                            <div style={{ padding:"6px 10px", borderRadius:8, background:"#fef9ee", border:"1px solid #fde68a", fontSize:11, color:"#92400e", lineHeight:1.5, marginBottom:10, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                              🎯 {noteObj.attentes}
                            </div>
                          )}
                          {/* Footer */}
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <span style={{ fontSize:10, color:"#22c55e", fontWeight:700 }}>● Actif</span>
                            <div style={{ display:"flex", gap:6 }}>
                              <span style={{ fontSize:10, color:"#9ca3af" }}>Cliquer pour les détails</span>
                              <button onClick={e=>{ e.stopPropagation(); signalerAbsence(a); }}
                                style={{ padding:"3px 8px", background:"#fff7ed", color:"#92400e", border:"1px solid #fed7aa", borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer" }}>
                                🚨 Absence
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        )}

        {groupeSubTab==="chat" && (
          <div style={{ background:"#fff", borderRadius:12, border:`1px solid ${chatBloque?"#fca5a5":"#e5e7eb"}`, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #e5e7eb", background:`${BET}08`, fontWeight:700, fontSize:13, color:BET }}>
              💬 Chat — {selectedGroupe.nom}
            </div>

            {/* Bannière de blocage */}
            {chatBloque && (
              <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:0, padding:"14px 18px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                  <span style={{ fontSize:24, flexShrink:0 }}>🔒</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, color:"#991b1b", fontSize:14, marginBottom:6 }}>
                      Chat bloqué — liste de présence manquante
                    </div>
                    <div style={{ fontSize:13, color:"#b91c1c", marginBottom:10, lineHeight:1.5 }}>
                      Vous devez remplir la liste de présence pour le{coursManquants.length>1?"s":""} cours suivant{coursManquants.length>1?"s":""} avant de pouvoir écrire :
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                      {coursManquants.map(c => (
                        <span key={c.id} style={{ background:"#fee2e2", color:"#991b1b", borderRadius:99, padding:"3px 12px", fontSize:12, fontWeight:700 }}>
                          📅 {new Date(c.date_cours).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
                          {c.objectif ? ` — ${c.objectif}` : ""}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => setGroupeSubTab("presences")}
                      style={{ padding:"7px 16px", background:"#dc2626", color:"#fff", border:"none", borderRadius:7, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                      → Remplir la liste de présence
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ height:380, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:10 }}>
              {groupeMessages.length === 0 && (
                <div style={{ textAlign:"center", color:"#9ca3af", paddingTop:60 }}>Aucun message — commencez la conversation !</div>
              )}
              {groupeMessages.map(m => {
                const isMe = m.auteur_id === MON_PROFIL_REEL.id;
                return (
                  <div key={m.id} style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    {!isMe && (
                      <div style={{ width:32, height:32, borderRadius:"50%", background:BET_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:BET, flexShrink:0, marginRight:8, alignSelf:"flex-end" }}>
                        {m.auteur_nom?.[0] || "?"}
                      </div>
                    )}
                    <div style={{ maxWidth:"72%" }}>
                      {!isMe && <div style={{ fontSize:11, color:"#9ca3af", marginBottom:2, fontWeight:600 }}>{m.auteur_nom}</div>}
                      {m.type==="fichier" && m.fichier ? (
                        <a href={m.fichier.url} target="_blank" rel="noreferrer"
                          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:isMe?"12px 12px 0 12px":"12px 12px 12px 0", background:isMe?BET:"#f3f4f6", color:isMe?"#fff":"#0f172a", textDecoration:"none", fontSize:13 }}>
                          <span style={{ fontSize:20 }}>{m.fichier.type==="pdf"?"📄":m.fichier.type==="image"?"🖼️":"📎"}</span>
                          <span style={{ fontWeight:600 }}>{m.fichier.nom}</span>
                        </a>
                      ) : (
                        <div style={{ padding:"10px 14px", borderRadius:isMe?"12px 12px 0 12px":"12px 12px 12px 0", background:isMe?BET:"#f3f4f6", color:isMe?"#fff":"#0f172a", fontSize:13, lineHeight:1.5, whiteSpace:"pre-wrap" }}>
                          {m.texte}
                        </div>
                      )}
                      <div style={{ fontSize:10, color:"#9ca3af", marginTop:2, textAlign:isMe?"right":"left" }}>
                        {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding:"10px 12px", borderTop:"1px solid #e5e7eb", display:"flex", gap:8, alignItems:"flex-end", opacity:chatBloque?0.5:1, pointerEvents:chatBloque?"none":"auto" }}>
              <label style={{ padding:"8px 10px", background:"#f1f5f9", border:"1px solid #e5e7eb", borderRadius:8, cursor:chatBloque?"not-allowed":"pointer", fontSize:16, flexShrink:0 }} title={chatBloque?"Remplissez d'abord la liste de présence":"Partager un fichier"}>
                📎
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.pptx" style={{ display:"none" }} disabled={chatBloque}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file || !selectedGroupe) return;
                    setFichierUploading(true);
                    try {
                      const fd = new FormData(); fd.append("file", file);
                      const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
                      const r = await fetch(`${API_URL}/api/upload/image`, { method:"POST", headers:{ Authorization:`Bearer ${token}` }, body:fd });
                      const d = await r.json();
                      const url = d.file?.url || d.url;
                      if (url) {
                        const ext = file.name.split(".").pop().toLowerCase();
                        const type = ["jpg","jpeg","png","gif","webp"].includes(ext) ? "image" : ext === "pdf" ? "pdf" : "autre";
                        await sendGroupeMessage(MON_PROFIL_REEL.id, `${MON_PROFIL_REEL.prenom} ${MON_PROFIL_REEL.nom}`, "", { nom: file.name, url, type });
                        await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/fichiers`, {
                          method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
                          body: JSON.stringify({ nom:file.name, url, type_fichier:type, taille_ko:Math.round(file.size/1024) })
                        });
                        setGroupeFichiers(prev => [{ id:Date.now(), nom:file.name, url, type_fichier:type }, ...prev]);
                      }
                    } catch { toast.error("Erreur upload fichier"); }
                    finally { setFichierUploading(false); e.target.value=""; }
                  }} />
              </label>
              <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)}
                placeholder={chatBloque ? "🔒 Remplissez la liste de présence avant d'écrire…" : `Message au groupe "${selectedGroupe.nom}"…`}
                rows={1} disabled={chatBloque}
                style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${chatBloque?"#fca5a5":"#e5e7eb"}`, borderRadius:8, fontSize:13, resize:"none", fontFamily:"inherit", background:chatBloque?"#fef2f2":"#fff" }}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); if(!chatBloque) sendGroupeMsg(); }}} />
              <button onClick={sendGroupeMsg} disabled={!chatInput.trim() || fichierUploading || chatBloque}
                style={{ padding:"9px 16px", background:chatBloque?"#9ca3af":BET, color:"#fff", border:"none", borderRadius:8, cursor:chatBloque?"not-allowed":"pointer", fontWeight:700, fontSize:13, opacity:(!chatInput.trim()||chatBloque)?0.5:1, flexShrink:0 }}>
                ✉️
              </button>
            </div>
          </div>
        )}

        {groupeSubTab==="fichiers" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>📎 Fichiers partagés</div>
              <label style={{ padding:"8px 14px", background:BET, color:"#fff", borderRadius:8, fontSize:12, fontWeight:600, cursor:fichierUploading?"not-allowed":"pointer", opacity:fichierUploading?0.6:1 }}>
                {fichierUploading ? "⏳ Upload…" : "📤 Partager un fichier"}
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.pptx,.mp4" style={{ display:"none" }} disabled={fichierUploading}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file || !selectedGroupe) return;
                    setFichierUploading(true);
                    try {
                      const fd = new FormData(); fd.append("file", file);
                      const token = localStorage.getItem("coach_token") || localStorage.getItem("admin_token");
                      const r = await fetch(`${API_URL}/api/upload/image`, { method:"POST", headers:{ Authorization:`Bearer ${token}` }, body:fd });
                      const d = await r.json();
                      const url = d.file?.url || d.url;
                      if (url) {
                        const ext = file.name.split(".").pop().toLowerCase();
                        const type = ["jpg","jpeg","png","gif","webp"].includes(ext) ? "image" : ext==="pdf" ? "pdf" : ["doc","docx"].includes(ext) ? "word" : "autre";
                        const fr = await fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/fichiers`, {
                          method:"POST",
                          headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
                          body: JSON.stringify({ nom:file.name, url, type_fichier:type, taille_ko:Math.round(file.size/1024) })
                        });
                        const fd2 = await fr.json();
                        setGroupeFichiers(prev => [fd2.fichier || { id:Date.now(), nom:file.name, url, type_fichier:type }, ...prev]);
                        toast.success("Fichier partagé ✓");
                      }
                    } catch { toast.error("Erreur upload"); }
                    finally { setFichierUploading(false); e.target.value=""; }
                  }} />
              </label>
            </div>
            {groupeFichiers.length === 0
              ? <div style={{ textAlign:"center", padding:"40px 20px", color:"#9ca3af", background:"#f8fafc", borderRadius:12 }}>Aucun fichier partagé dans ce groupe.</div>
              : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {groupeFichiers.map(f => {
                    const icon = f.type_fichier==="pdf" ? "📄" : f.type_fichier==="image" ? "🖼️" : f.type_fichier==="word" ? "📝" : "📎";
                    return (
                      <div key={f.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:"#fff", borderRadius:10, border:"1px solid #e5e7eb" }}>
                        <div style={{ fontSize:28, flexShrink:0 }}>{icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, color:"#0f172a", fontSize:13 }}>{f.nom}</div>
                          <div style={{ fontSize:11, color:"#9ca3af" }}>{f.created_at ? new Date(f.created_at).toLocaleDateString("fr-FR") : ""}{f.taille_ko ? ` · ${f.taille_ko} Ko` : ""}</div>
                        </div>
                        <a href={f.url} target="_blank" rel="noreferrer"
                          style={{ padding:"6px 12px", background:BET_LIGHT, color:BET, borderRadius:8, fontSize:12, fontWeight:600, textDecoration:"none" }}>
                          ⬇️ Télécharger
                        </a>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        )}

        {groupeSubTab==="presences" && (
          <div>
            {/* Toggle saisie / historique */}
            <div style={{ display:"flex", gap:0, marginBottom:20, background:"#f1f5f9", borderRadius:10, padding:4, width:"fit-content" }}>
              {[{k:"saisie",label:"✏️ Saisir une séance"},{k:"historique",label:"📋 Historique"}].map(v=>(
                <button key={v.k} onClick={()=>setPresenceView(v.k)}
                  style={{ padding:"7px 16px", borderRadius:8, border:"none", fontSize:12, fontWeight:600, cursor:"pointer",
                    background:presenceView===v.k?"#fff":"transparent", color:presenceView===v.k?BET:"#64748b",
                    boxShadow:presenceView===v.k?"0 1px 4px rgba(0,0,0,0.1)":"none" }}>
                  {v.label}
                </button>
              ))}
            </div>

            {presenceView==="saisie" && (
              <div>
                {/* Date séance */}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"14px 18px", background:"#f0f9ff", borderRadius:12, border:"1px solid #bae6fd" }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#0369a1" }}>📅 Date de la séance :</span>
                  <input type="date" value={presenceDate} onChange={e=>setPresenceDate(e.target.value)}
                    style={{ padding:"7px 10px", border:"1.5px solid #bae6fd", borderRadius:8, fontSize:13, fontWeight:600 }} />
                </div>

                {/* Liste apprenants */}
                {presenceListe.length === 0
                  ? <p style={{ textAlign:"center", color:"#9ca3af", padding:30 }}>Aucun apprenant actif dans ce groupe.</p>
                  : (
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
                      {presenceListe.map((p, idx) => (
                        <div key={p.ga_id || idx} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:"#fff", borderRadius:10, border:"1.5px solid #e5e7eb" }}>
                          <div style={{ width:38, height:38, borderRadius:"50%", background:BET_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:BET, flexShrink:0 }}>
                            {(p.prenom_apprenant?.[0] || p.nom_apprenant?.[0] || "?").toUpperCase()}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{[p.prenom_apprenant, p.nom_apprenant].filter(Boolean).join(" ")}</div>
                          </div>
                          {/* Statut */}
                          <div style={{ display:"flex", gap:6 }}>
                            {[
                              { val:"present", label:"✅ Présent",  bg:"#d1fae5", color:"#065f46", sel:"#059669" },
                              { val:"retard",  label:"⏰ Retard",   bg:"#fef3c7", color:"#92400e", sel:"#d97706" },
                              { val:"absent",  label:"❌ Absent",   bg:"#fee2e2", color:"#991b1b", sel:"#dc2626" },
                              { val:"excuse",  label:"📝 Excusé",   bg:"#ede9fe", color:"#5b21b6", sel:"#7c3aed" },
                            ].map(s => (
                              <button key={s.val} onClick={()=>setPresenceListe(prev=>prev.map((x,i)=>i===idx?{...x,statut:s.val}:x))}
                                style={{ padding:"5px 10px", borderRadius:20, border:`1.5px solid ${p.statut===s.val?s.sel:"#e5e7eb"}`, fontSize:11, fontWeight:600, cursor:"pointer",
                                  background: p.statut===s.val ? s.bg : "#fff", color: p.statut===s.val ? s.color : "#9ca3af" }}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                          {/* Note optionnelle */}
                          <input value={p.note} onChange={e=>setPresenceListe(prev=>prev.map((x,i)=>i===idx?{...x,note:e.target.value}:x))}
                            placeholder="Note…" style={{ width:120, padding:"5px 8px", border:"1px solid #e5e7eb", borderRadius:7, fontSize:11 }} />
                        </div>
                      ))}
                    </div>
                  )
                }

                {/* Stats rapides */}
                {presenceListe.length > 0 && (
                  <div style={{ display:"flex", gap:12, marginBottom:20, padding:"12px 16px", background:"#f8fafc", borderRadius:10, border:"1px solid #e5e7eb" }}>
                    {[
                      { label:"Présents",  val:presenceListe.filter(p=>p.statut==="present").length,  color:"#059669" },
                      { label:"Retards",   val:presenceListe.filter(p=>p.statut==="retard").length,   color:"#d97706" },
                      { label:"Absents",   val:presenceListe.filter(p=>p.statut==="absent").length,   color:"#dc2626" },
                      { label:"Excusés",   val:presenceListe.filter(p=>p.statut==="excuse").length,   color:"#7c3aed" },
                    ].map(s=>(
                      <div key={s.label} style={{ textAlign:"center", flex:1 }}>
                        <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
                        <div style={{ fontSize:11, color:"#9ca3af", fontWeight:600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={savePresences} disabled={presenceSaving || presenceListe.length===0}
                  style={{ padding:"11px 24px", background:BET, color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:13, opacity:presenceSaving?0.6:1 }}>
                  {presenceSaving ? "⏳ Enregistrement…" : "💾 Enregistrer la feuille de présence"}
                </button>
              </div>
            )}

            {presenceView==="historique" && (
              <div>
                {presenceHistory.length === 0
                  ? <div style={{ textAlign:"center", padding:"40px 20px", color:"#9ca3af", background:"#f8fafc", borderRadius:12 }}>Aucune séance enregistrée.</div>
                  : (() => {
                      const parDate = {};
                      presenceHistory.forEach(p => { if (!parDate[p.date_seance]) parDate[p.date_seance]=[]; parDate[p.date_seance].push(p); });
                      return Object.entries(parDate).sort(([a],[b])=>b.localeCompare(a)).map(([date, rows]) => {
                        const presents = rows.filter(r=>r.statut==="present").length;
                        const total = rows.length;
                        const taux = total ? Math.round(presents/total*100) : 0;
                        return (
                          <div key={date} style={{ marginBottom:16, background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                            <div style={{ padding:"12px 16px", background:"#f8fafc", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <span style={{ fontWeight:700, color:"#0f172a" }}>📅 {new Date(date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>
                              <span style={{ fontSize:12, fontWeight:700, color:taux>=80?"#059669":taux>=60?"#d97706":"#dc2626" }}>
                                {presents}/{total} présents — {taux}%
                              </span>
                            </div>
                            <div style={{ padding:"10px 16px", display:"flex", flexWrap:"wrap", gap:6 }}>
                              {rows.map(r=>(
                                <span key={r.id} style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                                  background:r.statut==="present"?"#d1fae5":r.statut==="absent"?"#fee2e2":r.statut==="retard"?"#fef3c7":"#ede9fe",
                                  color:r.statut==="present"?"#065f46":r.statut==="absent"?"#991b1b":r.statut==="retard"?"#92400e":"#5b21b6" }}>
                                  {r.statut==="present"?"✅":r.statut==="absent"?"❌":r.statut==="retard"?"⏰":"📝"} {[r.prenom_apprenant,r.nom_apprenant].filter(Boolean).join(" ")}
                                  {r.note && ` (${r.note})`}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()
                }
              </div>
            )}
          </div>
        )}

        {groupeSubTab==="cours" && (() => {
          const STATUT_COURS = {
            dispense:         { label:"Dispensé",         color:"#065f46", bg:"#d1fae5", icon:"✅" },
            annule:           { label:"Annulé",           color:"#991b1b", bg:"#fee2e2", icon:"❌" },
            apprenant_absent: { label:"Apprenant absent", color:"#92400e", bg:"#fef3c7", icon:"👤" },
            coach_absent:     { label:"Coach absent",     color:"#1e40af", bg:"#dbeafe", icon:"🏃" },
            catch_up:         { label:"Catch up",         color:"#5b21b6", bg:"#ede9fe", icon:"🔄" },
            holiday:          { label:"Congé / Férié",    color:"#374151", bg:"#f1f5f9", icon:"🏖️" },
          };
          return (
            <div>
              {/* Header + filtres */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a" }}>📚 Historique des cours</h3>
                  <span style={{ fontSize:12, color:"#9ca3af" }}>{coursList.length} séance{coursList.length>1?"s":""}</span>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <select value={coursFiltreMois} onChange={e=>setCoursFiltreMois(Number(e.target.value))}
                    style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:12, fontWeight:600 }}>
                    {["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"].map((m,i)=>(
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                  <select value={coursFiltreAnnee} onChange={e=>setCoursFiltreAnnee(Number(e.target.value))}
                    style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:12, fontWeight:600 }}>
                    {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                  <button onClick={()=>{ setCoursEditId(null); setCoursForm({ date_cours: new Date().toISOString().slice(0,10), objectif:"", grammaire:"", sujet_discussion:"", statut:"dispense", commentaire:"" }); setShowCoursForm(true); }}
                    style={{ padding:"8px 14px", background:BET, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    + Ajouter un cours
                  </button>
                </div>
              </div>

              {/* Formulaire ajout / édition */}
              {showCoursForm && (
                <div style={{ background:"#f0f9ff", border:"2px solid #bae6fd", borderRadius:14, padding:20, marginBottom:20 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:BET, marginBottom:14 }}>
                    {coursEditId ? "✏️ Modifier le cours" : "➕ Nouveau cours"}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Date du cours *</label>
                      <input type="date" value={coursForm.date_cours} onChange={e=>setCoursForm(p=>({...p,date_cours:e.target.value}))}
                        style={{ padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, width:"100%", boxSizing:"border-box" }} />
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Statut du cours</label>
                      <select value={coursForm.statut} onChange={e=>setCoursForm(p=>({...p,statut:e.target.value}))}
                        style={{ padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, width:"100%", background:"#fff", boxSizing:"border-box" }}>
                        {Object.entries(STATUT_COURS).map(([k,v])=>(
                          <option key={k} value={k}>{v.icon} {v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Objectif du cours</label>
                      <input value={coursForm.objectif} onChange={e=>setCoursForm(p=>({...p,objectif:e.target.value}))}
                        placeholder="Ex : Améliorer l'expression orale B2"
                        style={{ padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:12, width:"100%", boxSizing:"border-box" }} />
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Grammaire enseignée</label>
                      <input value={coursForm.grammaire} onChange={e=>setCoursForm(p=>({...p,grammaire:e.target.value}))}
                        placeholder="Ex : Past perfect, conditionnels"
                        style={{ padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:12, width:"100%", boxSizing:"border-box" }} />
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Sujet de discussion</label>
                      <input value={coursForm.sujet_discussion} onChange={e=>setCoursForm(p=>({...p,sujet_discussion:e.target.value}))}
                        placeholder="Ex : Business meetings, voyages"
                        style={{ padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:12, width:"100%", boxSizing:"border-box" }} />
                    </div>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Commentaire du coach</label>
                    <textarea value={coursForm.commentaire} onChange={e=>setCoursForm(p=>({...p,commentaire:e.target.value}))}
                      placeholder="Observations, points à retravailler, niveau général du groupe…"
                      rows={3} style={{ padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:12, width:"100%", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }} />
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={saveCours} disabled={coursSaving}
                      style={{ padding:"9px 20px", background:BET, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, opacity:coursSaving?0.6:1 }}>
                      {coursSaving ? "⏳ Enregistrement…" : "💾 Enregistrer"}
                    </button>
                    <button onClick={()=>{ setShowCoursForm(false); setCoursEditId(null); }}
                      style={{ padding:"9px 16px", background:"#f1f5f9", border:"1px solid #e5e7eb", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:12, color:"#374151" }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Tableau */}
              {coursLoading && <p style={{ textAlign:"center", color:"#9ca3af", padding:30 }}>Chargement…</p>}
              {!coursLoading && coursList.length === 0 && (
                <div style={{ textAlign:"center", padding:"40px 20px", background:"#f8fafc", borderRadius:12, border:"1px solid #e5e7eb" }}>
                  <div style={{ fontSize:40, marginBottom:8 }}>📚</div>
                  <div style={{ fontWeight:700, color:"#0f172a" }}>Aucun cours ce mois-ci</div>
                  <p style={{ color:"#9ca3af", fontSize:13 }}>Cliquez sur "+ Ajouter un cours" pour commencer.</p>
                </div>
              )}
              {!coursLoading && coursList.length > 0 && (
                <div style={{ overflowX:"auto", borderRadius:12, border:"1px solid #e5e7eb" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"#f8fafc" }}>
                        {["Date","Statut","Objectif","Grammaire","Sujet discussion","Commentaire",""].map((h,i)=>(
                          <th key={i} style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11, borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {coursList.map((c, idx) => {
                        const s = STATUT_COURS[c.statut] || STATUT_COURS.dispense;
                        return (
                          <tr key={c.id} style={{ background:idx%2===0?"#fff":"#fafafa", borderBottom:"1px solid #f1f5f9" }}>
                            <td style={{ padding:"10px 14px", fontWeight:600, whiteSpace:"nowrap", color:"#0f172a" }}>
                              {new Date(c.date_cours).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}
                            </td>
                            <td style={{ padding:"10px 14px" }}>
                              <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:s.bg, color:s.color, whiteSpace:"nowrap" }}>
                                {s.icon} {s.label}
                              </span>
                            </td>
                            <td style={{ padding:"10px 14px", color:"#374151", maxWidth:180 }}>{c.objectif || <span style={{ color:"#d1d5db" }}>—</span>}</td>
                            <td style={{ padding:"10px 14px", color:"#374151", maxWidth:160 }}>{c.grammaire || <span style={{ color:"#d1d5db" }}>—</span>}</td>
                            <td style={{ padding:"10px 14px", color:"#374151", maxWidth:160 }}>{c.sujet_discussion || <span style={{ color:"#d1d5db" }}>—</span>}</td>
                            <td style={{ padding:"10px 14px", color:"#6b7280", maxWidth:200, fontStyle:c.commentaire?"normal":"italic" }}>
                              {c.commentaire || <span style={{ color:"#d1d5db" }}>—</span>}
                            </td>
                            <td style={{ padding:"10px 14px", whiteSpace:"nowrap" }}>
                              <button onClick={()=>{ setCoursEditId(c.id); setCoursForm({ date_cours:c.date_cours, objectif:c.objectif||"", grammaire:c.grammaire||"", sujet_discussion:c.sujet_discussion||"", statut:c.statut, commentaire:c.commentaire||"" }); setShowCoursForm(true); }}
                                style={{ padding:"4px 8px", background:"#f0f9ff", color:BET, border:`1px solid ${BET}30`, borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", marginRight:6 }}>
                                ✏️
                              </button>
                              <button onClick={()=>deleteCours(c.id)}
                                style={{ padding:"4px 8px", background:"#fee2e2", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* Résumé du mois */}
                  <div style={{ padding:"12px 16px", background:"#f8fafc", borderTop:"1px solid #e5e7eb", display:"flex", gap:16, flexWrap:"wrap" }}>
                    {Object.entries(STATUT_COURS).map(([k,v])=>{
                      const n = coursList.filter(c=>c.statut===k).length;
                      if (!n) return null;
                      return <span key={k} style={{ fontSize:12, color:v.color, fontWeight:600 }}>{v.icon} {v.label} : {n}</span>;
                    })}
                    <span style={{ marginLeft:"auto", fontSize:12, color:"#9ca3af" }}>Total : {coursList.length} séance{coursList.length>1?"s":""}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
            </div>
          </div>
        </div>
      )}
  </div>
)}

            {/* ════════ DISPONIBILITÉS ════════ */}
            {activeTab==="disponibilites" && (
              <div>
                <div style={tabHeader}>
                  <div>
                    <h2 style={tabTitle}>🗓️ Mes Disponibilités</h2>
                    <p style={tabSubtitle}>Indiquez vos créneaux libres toute la semaine (y compris week-end) — votre planning sera transmis automatiquement à l'assistance onboarding qui programmera les cours et les salles</p>
                  </div>
                  <button onClick={async () => {
                    const token = localStorage.getItem("coach_token");
                    if (!token) { toast.error("Session expirée, veuillez vous reconnecter"); return; }
                    const slots = [];
                    JOURS_SEMAINE.forEach(j => {
                      CRENEAUX_DEF.forEach(c => {
                        const sl = disponibilites[j]?.[c.id] || {};
                        slots.push({ jour: j, creneau: c.id, debut: sl.debut || c.debut, fin: sl.fin || c.fin, dispo: !!sl.dispo });
                      });
                    });
                    setDispoLoading(true);
                    try {
                      const r = await fetch(`${API_URL}/api/coachs/disponibilites`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ slots }),
                      });
                      const data = await r.json();
                      if (!r.ok) throw new Error(data.error || "Erreur");
                      setDispoSaved(true);
                      toast.success("Disponibilités transmises à l'assistance onboarding ✓");
                      setTimeout(() => setDispoSaved(false), 3000);
                    } catch (err) {
                      toast.error(err.message || "Erreur lors de l'enregistrement");
                    } finally {
                      setDispoLoading(false);
                    }
                  }} disabled={dispoLoading} style={{ padding:"9px 20px", background:BET, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor: dispoLoading ? "wait" : "pointer", opacity: dispoLoading ? 0.7 : 1 }}>
                    {dispoLoading ? "⏳ Enregistrement..." : "💾 Enregistrer mes disponibilités"}
                  </button>
                </div>

                {dispoSaved && (
                  <div style={{ background:"#d1fae5", border:"1px solid #6ee7b7", borderRadius:10, padding:"10px 16px", marginBottom:16, color:"#065f46", fontWeight:600, fontSize:13 }}>
                    ✅ Disponibilités transmises à l'assistance onboarding du {coachCentreLabel || "centre BET"}. Les cours seront programmés en conséquence.
                  </div>
                )}

                {/* Légende */}
                <div style={{ display:"flex", gap:16, marginBottom:18, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#64748b" }}>
                    <div style={{ width:16, height:16, borderRadius:4, background:"#d1fae5", border:"2px solid #10b981" }}/> Disponible
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#64748b" }}>
                    <div style={{ width:16, height:16, borderRadius:4, background:"#f1f5f9", border:"2px solid #e2e8f0" }}/> Non disponible
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#64748b" }}>
                    <div style={{ width:16, height:16, borderRadius:4, background:"#f1f5f9", border:"2px solid #cbd5e1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>🔒</div> Cours programmé (non modifiable)
                  </div>
                  <span style={{ fontSize:12, color:"#94a3b8" }}>Cliquez sur une case pour basculer. Vous pouvez ajuster les horaires de chaque créneau.</span>
                </div>

                {/* Grille jours × créneaux */}
                <div style={{ overflowX:"auto", marginBottom:24 }}>
                  <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:4 }}>
                    <thead>
                      <tr>
                        <th style={{ width:110, fontSize:12, color:"#64748b", fontWeight:700, textAlign:"left", paddingBottom:8 }}>Créneau</th>
                        {JOURS_SEMAINE.map(j => (
                          <th key={j} style={{ fontSize:12, fontWeight:800, color:"#0f172a", textAlign:"center", paddingBottom:8 }}>{j}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CRENEAUX_DEF.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontSize:12, fontWeight:700, color:"#475569", paddingRight:8, whiteSpace:"nowrap" }}>
                            <div>{c.label}</div>
                            <div style={{ fontSize:11, color:"#94a3b8", fontWeight:400 }}>{c.debut}–{c.fin}</div>
                          </td>
                          {JOURS_SEMAINE.map(j => {
                            const slot = disponibilites[j]?.[c.id] || { dispo:false, debut:c.debut, fin:c.fin };
                            const locked = !!slot.verrouille;
                            return (
                              <td key={j} style={{ verticalAlign:"top" }}>
                                <div
                                  onClick={() => {
                                    if (locked) return;
                                    setDisponibilites(prev => ({
                                      ...prev,
                                      [j]: { ...prev[j], [c.id]: { ...prev[j][c.id], dispo: !slot.dispo } }
                                    }));
                                  }}
                                  title={locked ? "Créneau verrouillé — cours déjà programmé" : undefined}
                                  style={{
                                    borderRadius:10, cursor: locked ? "not-allowed" : "pointer", padding:"10px 8px", textAlign:"center", minHeight:64,
                                    background: locked ? "#f1f5f9" : slot.dispo ? "#d1fae5" : "#f8fafc",
                                    border: `2px solid ${locked ? "#cbd5e1" : slot.dispo ? "#10b981" : "#e2e8f0"}`,
                                    opacity: locked ? 0.65 : 1,
                                    transition:"all .15s",
                                  }}
                                >
                                  <div style={{ fontSize:18, marginBottom:4 }}>{locked ? "🔒" : slot.dispo ? "✅" : "○"}</div>
                                  {slot.dispo && !locked && (
                                    <div style={{ fontSize:10, color:"#065f46", fontWeight:700 }}>{slot.debut}–{slot.fin}</div>
                                  )}
                                  {locked && (
                                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600 }}>Programmé</div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ajustement horaires des créneaux actifs */}
                {JOURS_SEMAINE.some(j => CRENEAUX_DEF.some(c => disponibilites[j]?.[c.id]?.dispo)) && (
                  <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:20 }}>
                    <h4 style={{ margin:"0 0 14px", fontSize:14, fontWeight:800, color:"#0f172a" }}>⏰ Ajuster les horaires de vos créneaux</h4>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {JOURS_SEMAINE.map(j => CRENEAUX_DEF.map(c => {
                        const slot = disponibilites[j]?.[c.id];
                        if (!slot?.dispo) return null;
                        const locked = !!slot.verrouille;
                        return (
                          <div key={`${j}-${c.id}`} style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", padding:"8px 12px", background: locked ? "#f8fafc" : "#f0fdf4", borderRadius:8, border:`1px solid ${locked ? "#e2e8f0" : "#bbf7d0"}`, opacity: locked ? 0.7 : 1 }}>
                            <span style={{ fontWeight:700, fontSize:13, minWidth:160, color: locked ? "#94a3b8" : "#065f46" }}>{j} — {c.label} {locked && "🔒"}</span>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <label style={{ fontSize:11, color:"#64748b" }}>De</label>
                              <input type="time" value={slot.debut} disabled={locked}
                                onChange={e => setDisponibilites(prev => ({ ...prev, [j]: { ...prev[j], [c.id]: { ...prev[j][c.id], debut: e.target.value } } }))}
                                style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #d1d5db", fontSize:12, cursor: locked ? "not-allowed" : "auto", background: locked ? "#f1f5f9" : "#fff" }}
                              />
                              <label style={{ fontSize:11, color:"#64748b" }}>À</label>
                              <input type="time" value={slot.fin} disabled={locked}
                                onChange={e => setDisponibilites(prev => ({ ...prev, [j]: { ...prev[j], [c.id]: { ...prev[j][c.id], fin: e.target.value } } }))}
                                style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #d1d5db", fontSize:12, cursor: locked ? "not-allowed" : "auto", background: locked ? "#f1f5f9" : "#fff" }}
                              />
                            </div>
                          </div>
                        );
                      }))}
                    </div>
                  </div>
                )}

                {/* Résumé */}
                <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:12, padding:"16px 20px" }}>
                  <h4 style={{ margin:"0 0 10px", fontSize:13, fontWeight:800, color:"#0369a1" }}>📋 Récapitulatif de vos disponibilités</h4>
                  {JOURS_SEMAINE.every(j => CRENEAUX_DEF.every(c => !disponibilites[j]?.[c.id]?.dispo)) ? (
                    <p style={{ color:"#94a3b8", fontSize:13, margin:0 }}>Aucun créneau sélectionné. Cliquez sur la grille pour indiquer vos disponibilités.</p>
                  ) : (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {JOURS_SEMAINE.map(j => {
                        const slots = CRENEAUX_DEF.filter(c => disponibilites[j]?.[c.id]?.dispo);
                        if (!slots.length) return null;
                        return (
                          <div key={j} style={{ background:"#fff", border:"1px solid #bae6fd", borderRadius:8, padding:"8px 12px", minWidth:140 }}>
                            <div style={{ fontWeight:800, color:"#0891b2", fontSize:12, marginBottom:4 }}>{j}</div>
                            {slots.map(c => {
                              const sl = disponibilites[j][c.id];
                              return <div key={c.id} style={{ fontSize:11, color:"#475569" }}>• {c.label} : {sl.debut}–{sl.fin}</div>;
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════ MON PROFIL ════════ */}
            {activeTab==="profil" && (
              <div>
                <div style={tabHeader}>
                  <div><h2 style={tabTitle}>Mon Profil Professeur</h2><p style={tabSubtitle}>Informations personnelles et professionnelles</p></div>
                  <button onClick={()=>toast.success("Modifications enregistrées ✓")} style={btnPrimary}>💾 Enregistrer</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                  {/* Infos perso */}
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20, padding:"14px 16px", borderRadius:10, background:"#fff", border:"1px solid #e5e7eb" }}>
                      {MON_PROFIL_REEL.photo_url
                        ? <img src={MON_PROFIL_REEL.photo_url} alt={MON_PROFIL_REEL.prenom}
                            style={{ width:64, height:64, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                        : <div style={{ width:64, height:64, borderRadius:"50%", background:BET_GRAD, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", flexShrink:0 }}>
                            {MON_PROFIL_REEL.avatar}
                          </div>
                      }
                      <div>
                        <div style={{ fontSize:18, fontWeight:800 }}>Prof. {MON_PROFIL_REEL.prenom} {MON_PROFIL_REEL.nom}</div>
                        <div style={{ fontSize:13, color:"#6b7280" }}>{MON_PROFIL_REEL.specialite}</div>
                        <div style={{ display:"flex", gap:6, marginTop:6 }}>
                          <span style={{ padding:"2px 8px", borderRadius:8, fontSize:11, background:BET_LIGHT, color:BET, fontWeight:700 }}>🏆 {MON_PROFIL_REEL.xp}</span>
                          <span style={{ padding:"2px 8px", borderRadius:8, fontSize:11, background:"#fef3c7", color:"#92400e", fontWeight:700 }}>⭐ {MON_PROFIL_REEL.notation}/5</span>
                        </div>
                      </div>
                    </div>
                    <h3 style={{ ...blockTitle, marginBottom:12 }}>Informations personnelles</h3>
                    {[
                      ["Prénom",              MON_PROFIL_REEL.prenom],
                      ["Nom",                 MON_PROFIL_REEL.nom],
                      ["Email",               MON_PROFIL_REEL.email],
                      ["Téléphone",           MON_PROFIL_REEL.phone],
                      ["Spécialité / Filière",coachBase?.coach_info?.filiere || MON_PROFIL_REEL.specialite],
                      ["Matricule",           coachBase?.coach_info?.matricule || "—"],
                      ["Date début à BET",    fmtDate(coachBase?.coach_info?.date_debut_bet || coachBase?.coach_info?.date_debut || MON_PROFIL_REEL.dateRecrutement)],
                      ["Lieu d'habitation",   coachBase?.coach_info?.lieu_habitation || "—"],
                      ["Contrats actifs",     MON_PROFIL_REEL.nbr_contrats_actifs !== null ? `${MON_PROFIL_REEL.nbr_contrats_actifs} groupe(s) actif(s)` : "—"],
                      ["Nombre d'avis",       `${MON_PROFIL_REEL.nbAvis} avis`],
                    ].map(([l,v])=>(
                      <div key={l} style={{ display:"flex", padding:"6px 0", borderBottom:"1px solid #f3f4f6", fontSize:13 }}>
                        <span style={{ color:"#9ca3af", width:140, fontWeight:500 }}>{l}</span>
                        <span style={{ fontWeight:400 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* Stats et certif */}
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                      <h3 style={{ ...blockTitle, marginBottom:14 }}>Niveaux enseignés</h3>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        {MON_PROFIL_REEL.niveauxEnseignes.map(n=><NivBadge key={n} n={n}/>)}
                      </div>
                    </div>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                      <h3 style={{ ...blockTitle, marginBottom:14 }}>Certifications</h3>
                      {MON_PROFIL_REEL.certifications.map(cert=>(
                        <div key={cert} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, background:"#fff", border:"1px solid #e5e7eb", marginBottom:8 }}>
                          <span style={{ fontSize:18 }}>🏅</span>
                          <span style={{ fontWeight:600, fontSize:13 }}>{cert}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:20 }}>
                      <h3 style={{ ...blockTitle, marginBottom:14 }}>Performance ce mois</h3>
                      {[
                        { l:"Contrats actifs",      v:MON_PROFIL_REEL.nbr_contrats_actifs !== null ? MON_PROFIL_REEL.nbr_contrats_actifs : groupes.length, c:"#dc2626" },
                        { l:"Cours dispensés",     v:cours.length,              c:BET },
                        { l:"Heures de cours",     v:`${MON_PROFIL_REEL.heuresMois}h`,c:"#7c3aed" },
                        { l:"Étudiants suivis",    v:etudiants.length,          c:"#059669" },
                        { l:"Taux de satisfaction",v:`${MON_PROFIL_REEL.notation}/5`,c:"#f59e0b" },
                      ].map(s=>(
                        <div key={s.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f3f4f6" }}>
                          <span style={{ fontSize:13, color:"#6b7280" }}>{s.l}</span>
                          <span style={{ fontWeight:800, color:s.c, fontSize:16 }}>{s.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ONGLET HONORAIRES ── */}
            {activeTab==="honoraires" && (() => {
              const seancesValidees   = MES_HONORAIRES_SEANCES.filter(s=>s.statut==="validee");
              const seancesAttente    = MES_HONORAIRES_SEANCES.filter(s=>s.statut==="en_attente");
              const totalValide       = seancesValidees.reduce((s,se)=>s+(se.duree*se.tarif_heure),0);
              const totalAttente      = seancesAttente.reduce((s,se)=>s+(se.duree*se.tarif_heure),0);
              const totalHeures       = MES_HONORAIRES_SEANCES.reduce((s,se)=>s+se.duree,0);
              const heuresValidees    = seancesValidees.reduce((s,se)=>s+se.duree,0);

              const formatMoney = (v) => new Intl.NumberFormat("fr-FR").format(v) + " FCFA";

              return (
                <div>
                  <div style={tabHeader}>
                    <div>
                      <h2 style={tabTitle}>💵 Suivi des honoraires</h2>
                      <p style={tabSubtitle}>Détail de vos séances validées et montants calculés</p>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
                    <div style={{ background:"linear-gradient(135deg,#059669,#10b981)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
                      <div style={{ fontSize:11, opacity:0.8, fontWeight:600, letterSpacing:"0.05em" }}>MONTANT VALIDÉ</div>
                      <div style={{ fontSize:22, fontWeight:800, margin:"6px 0 2px" }}>{formatMoney(totalValide)}</div>
                      <div style={{ fontSize:11, opacity:0.75 }}>{seancesValidees.length} séances validées</div>
                    </div>
                    <div style={{ background:"linear-gradient(135deg,#d97706,#f59e0b)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
                      <div style={{ fontSize:11, opacity:0.8, fontWeight:600, letterSpacing:"0.05em" }}>EN ATTENTE</div>
                      <div style={{ fontSize:22, fontWeight:800, margin:"6px 0 2px" }}>{formatMoney(totalAttente)}</div>
                      <div style={{ fontSize:11, opacity:0.75 }}>{seancesAttente.length} séance(s) à valider</div>
                    </div>
                    <div style={{ background:"linear-gradient(135deg,#0891b2,#0e7490)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
                      <div style={{ fontSize:11, opacity:0.8, fontWeight:600, letterSpacing:"0.05em" }}>HEURES EFFECTUÉES</div>
                      <div style={{ fontSize:22, fontWeight:800, margin:"6px 0 2px" }}>{totalHeures}h</div>
                      <div style={{ fontSize:11, opacity:0.75 }}>{heuresValidees}h validées</div>
                    </div>
                    <div style={{ background:"linear-gradient(135deg,#7c3aed,#8b5cf6)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
                      <div style={{ fontSize:11, opacity:0.8, fontWeight:600, letterSpacing:"0.05em" }}>TOTAL PÉRIODE</div>
                      <div style={{ fontSize:22, fontWeight:800, margin:"6px 0 2px" }}>{formatMoney(totalValide + totalAttente)}</div>
                      <div style={{ fontSize:11, opacity:0.75 }}>Toutes séances confondues</div>
                    </div>
                  </div>

                  {/* Barre de progression encaissement */}
                  <div style={{ background:"#f8fafc", borderRadius:14, padding:16, marginBottom:20, border:"1px solid #e5e7eb" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>Progression de validation</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"#059669" }}>{Math.round((seancesValidees.length/MES_HONORAIRES_SEANCES.length)*100)}%</span>
                    </div>
                    <div style={{ background:"#e5e7eb", borderRadius:99, height:10, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.round((seancesValidees.length/MES_HONORAIRES_SEANCES.length)*100)}%`, background:"linear-gradient(90deg,#059669,#10b981)", borderRadius:99, transition:"width .5s" }} />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:"#9ca3af" }}>
                      <span>{seancesValidees.length} séances validées</span>
                      <span>{MES_HONORAIRES_SEANCES.length} séances total</span>
                    </div>
                  </div>

                  {/* Tableau des séances */}
                  <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                    <div style={{ padding:"14px 18px", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>Détail des séances</span>
                      <span style={{ fontSize:12, color:"#9ca3af" }}>{MES_HONORAIRES_SEANCES.length} séances</span>
                    </div>
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                        <thead>
                          <tr style={{ background:"#f8fafc" }}>
                            {["Date","Cours","Durée","Tarif/h","Montant","Statut","Notes"].map(h=>(
                              <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9ca3af", borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MES_HONORAIRES_SEANCES.map(s => (
                            <tr key={s.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                              <td style={{ padding:"10px 14px", fontWeight:600, color:"#0f172a", whiteSpace:"nowrap" }}>
                                {new Date(s.date).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}
                              </td>
                              <td style={{ padding:"10px 14px", color:"#475569" }}>{s.cours}</td>
                              <td style={{ padding:"10px 14px", fontWeight:700, color:"#0f172a" }}>{s.duree}h</td>
                              <td style={{ padding:"10px 14px", color:"#475569" }}>{new Intl.NumberFormat("fr-FR").format(s.tarif_heure)} F</td>
                              <td style={{ padding:"10px 14px", fontWeight:800, color:"#059669" }}>{new Intl.NumberFormat("fr-FR").format(s.duree * s.tarif_heure)} F</td>
                              <td style={{ padding:"10px 14px" }}>
                                <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                                  background: s.statut==="validee" ? "#d1fae5" : "#fef9c3",
                                  color:      s.statut==="validee" ? "#065f46" : "#854d0e" }}>
                                  {s.statut==="validee" ? "✅ Validée" : "⏳ En attente"}
                                </span>
                              </td>
                              <td style={{ padding:"10px 14px", fontSize:11, color:"#9ca3af" }}>{s.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background:"#f8fafc", borderTop:"2px solid #e5e7eb" }}>
                            <td colSpan={2} style={{ padding:"12px 14px", fontWeight:700, fontSize:13, color:"#0f172a" }}>TOTAL</td>
                            <td style={{ padding:"12px 14px", fontWeight:800 }}>{totalHeures}h</td>
                            <td style={{ padding:"12px 14px" }}>—</td>
                            <td style={{ padding:"12px 14px", fontWeight:800, color:"#059669", fontSize:14 }}>{formatMoney(totalValide + totalAttente)}</td>
                            <td colSpan={2} style={{ padding:"12px 14px" }} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ════════ NOTIFS LIVE ════════ */}
            {activeTab==="notifs_live" && (
              <div style={{ padding: "24px 0" }}>
                <NotificationsTab userId={MON_PROFIL_REEL?.id} accentColor="#0891b2" />
              </div>
            )}

          </div>
        </div>

        {/* ══ MODAL MODULE BUILDER ══ */}
        {showModuleBuilder&&editingModuleContent&&(
          <div style={{ ...modalOverlay, zIndex:1100 }}>
            <div style={{ background:"#fff", borderRadius:14, width:"min(96vw,1000px)", maxHeight:"95vh", overflowY:"auto", padding:0, display:"flex", flexDirection:"column" }}>
              {/* Header */}
              <div style={{ padding:"18px 24px", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", gap:16, background:BET_GRAD, borderRadius:"14px 14px 0 0" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)",letterSpacing:"0.1em",marginBottom:4 }}>ÉDITEUR DE MODULE</div>
                  <h3 style={{ margin:0,fontSize:18,color:"#fff",fontWeight:800 }}>{moduleForm.titre||"Nouveau module"}</h3>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:3 }}>
                    ⏱ {getTotalDureeModule()} min estimées · 📦 {blocs.length} blocs
                  </div>
                </div>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <button onClick={()=>setPreviewMode(v=>!v)} style={{ padding:"7px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.3)",background:previewMode?"rgba(255,255,255,0.2)":"transparent",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600 }}>
                    {previewMode?"✏️ Éditer":"👁️ Aperçu"}
                  </button>
                  <button onClick={()=>setShowModuleBuilder(false)} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.7)",fontSize:22,cursor:"pointer",padding:0 }}>✕</button>
                </div>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:previewMode?"1fr":"340px 1fr",flex:1,overflow:"hidden" }}>
                {/* LEFT — Paramètres module */}
                {!previewMode&&(
                  <div style={{ padding:20,borderRight:"1px solid #e5e7eb",overflowY:"auto",background:"#f9fafb" }}>
                    <div style={{ fontSize:12,fontWeight:700,color:"#374151",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.08em" }}>Paramètres</div>
                    <label style={labelSt}>Titre du module *</label>
                    <input value={moduleForm.titre} onChange={e=>setModuleForm({...moduleForm,titre:e.target.value})} style={inputSt} placeholder="ex: Réunions d'affaires"/>
                    <label style={labelSt}>Objectifs pédagogiques (un par ligne)</label>
                    <textarea value={moduleForm.objectifs} onChange={e=>setModuleForm({...moduleForm,objectifs:e.target.value})} style={{ ...inputSt,minHeight:80,resize:"vertical" }} placeholder="Maîtriser le vocabulaire des réunions&#10;Animer une réunion formelle"/>
                    <label style={labelSt}>Durée estimée (minutes)</label>
                    <input type="number" value={moduleForm.dureeEstimee} onChange={e=>setModuleForm({...moduleForm,dureeEstimee:e.target.value})} style={inputSt} min={10}/>
                    <label style={labelSt}>Statut de publication</label>
                    <select value={moduleForm.statut} onChange={e=>setModuleForm({...moduleForm,statut:e.target.value})} style={inputSt}>
                      <option value="brouillon">📝 Brouillon (invisible aux étudiants)</option>
                      <option value="publie">✅ Publié (visible + notification)</option>
                      <option value="archive">📦 Archivé</option>
                    </select>
                    <div style={{ marginTop:16,padding:"10px 12px",borderRadius:8,background:moduleForm.statut==="publie"?"#dcfce7":"#f3f4f6",border:`1px solid ${moduleForm.statut==="publie"?"#bbf7d0":"#e5e7eb"}`,fontSize:12,color:moduleForm.statut==="publie"?"#166534":"#6b7280" }}>
                      {moduleForm.statut==="publie"?"✅ Les étudiants seront notifiés lors de la sauvegarde.":moduleForm.statut==="brouillon"?"📝 Non visible. Publiez pour le rendre accessible.":"📦 Archivé, non accessible."}
                    </div>
                    <div style={{ marginTop:20,padding:"12px",borderRadius:8,background:"#f0f9ff",border:"1px solid #bae6fd" }}>
                      <div style={{ fontSize:11,fontWeight:700,color:BET,marginBottom:6 }}>DURÉE PAR TYPE DE BLOC</div>
                      {blocs.map(b=>{ const bt=BLOCK_TYPES[b.type]||BLOCK_TYPES.texte; return (
                        <div key={b.id} style={{ display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3 }}>
                          <span style={{ color:bt.color }}>{bt.icon} {b.titre.slice(0,24)}…</span><span style={{ color:"#9ca3af" }}>{b.dureeMin} min</span>
                        </div>
                      );})}
                      <div style={{ borderTop:"1px solid #e0f2fe",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:12,color:BET }}>
                        <span>Total</span><span>{getTotalDureeModule()} min</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* RIGHT — Blocs */}
                <div style={{ padding:20,overflowY:"auto" }}>
                  {!previewMode&&(
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                      <div style={{ fontSize:13,fontWeight:700,color:"#0f172a" }}>Contenu du module ({blocs.length} bloc{blocs.length>1?"s":""})</div>
                      <button onClick={()=>setShowBlocForm(true)} style={btnPrimary}>+ Ajouter un bloc</button>
                    </div>
                  )}

                  {blocs.length===0&&!previewMode&&(
                    <div style={{ textAlign:"center",padding:"40px 20px",background:"#f8fafc",borderRadius:12,border:"2px dashed #e5e7eb" }}>
                      <div style={{ fontSize:36,marginBottom:10 }}>🧩</div>
                      <p style={{ color:"#9ca3af",fontSize:13 }}>Aucun bloc — ajoutez du contenu pour créer votre module.</p>
                      <p style={{ color:"#9ca3af",fontSize:12,marginTop:4 }}>Texte, vidéo, quiz, exercice, document…</p>
                    </div>
                  )}

                  {blocs.map((b,i)=>{ const bt=BLOCK_TYPES[b.type]||BLOCK_TYPES.texte; return (
                    <div key={b.id} style={{ marginBottom:12,borderRadius:12,border:`1px solid ${bt.color}30`,background:"#fff",overflow:"hidden" }}>
                      <div style={{ padding:"10px 14px",background:bt.color+"0a",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid "+bt.color+"20" }}>
                        <span style={{ fontSize:18 }}>{bt.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700,fontSize:13,color:"#0f172a" }}>{b.titre}</div>
                          <div style={{ fontSize:11,color:"#9ca3af" }}>{bt.label} · {b.dureeMin} min{b.questions?.length>0?` · ${b.questions.length} question(s)`:""}</div>
                        </div>
                        {!previewMode&&(
                          <div style={{ display:"flex",gap:4 }}>
                            <button onClick={()=>moveBlocUp(i)} style={btnIconToggle} disabled={i===0}>↑</button>
                            <button onClick={()=>moveBlocDown(i)} style={btnIconToggle} disabled={i===blocs.length-1}>↓</button>
                            <button onClick={()=>removeBloc(b.id)} style={btnIconDelete}>🗑️</button>
                          </div>
                        )}
                      </div>
                      <div style={{ padding:"10px 14px" }}>
                        {b.type==="texte"&&<p style={{ fontSize:13,color:"#374151",lineHeight:1.6,margin:0 }}>{b.contenu}</p>}
                        {b.type==="video"&&<div style={{ background:"#f3f4f6",borderRadius:8,padding:12,fontSize:12,color:"#6b7280" }}>🎬 <a href={b.url} target="_blank" rel="noreferrer" style={{ color:BET }}>{b.url?.slice(0,60)}…</a></div>}
                        {b.type==="audio"&&<div style={{ background:"#f0fdf4",borderRadius:8,padding:12,fontSize:12,color:"#059669",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10 }}><span>🎧 {b.titre||b.url?.slice(0,50)}</span><button onClick={()=>{ setSelectedAudio(b); setShowAudioModal(true); }} style={{ padding:"5px 12px",background:"#059669",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:600,fontSize:11,flexShrink:0 }}>▶️ Écouter</button></div>}
                        {b.type==="document"&&<div style={{ background:"#fff1f2",borderRadius:8,padding:12,fontSize:12,color:"#dc2626",display:"flex",gap:10,alignItems:"center" }}>📄 {b.fichier} {b.taille&&<span style={{ color:"#9ca3af" }}>· {b.taille}</span>}</div>}
                        {b.type==="lien"&&<div style={{ background:"#e0f2fe",borderRadius:8,padding:12,fontSize:12,color:BET }}>🔗 <a href={b.url} target="_blank" rel="noreferrer" style={{ color:BET }}>{b.url}</a></div>}
                        {b.type==="exercice"&&<div style={{ background:"#fff7ed",borderRadius:8,padding:12,fontSize:12,color:"#92400e" }}><pre style={{ fontFamily:"inherit",margin:0,whiteSpace:"pre-wrap" }}>{b.contenu}</pre></div>}
                        {b.type==="quiz"&&b.questions?.length>0&&(
                          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                            {b.questions.map((q,qi)=>(
                              <div key={q.id} style={{ padding:"8px 12px",borderRadius:8,background:"#f0f9ff",border:"1px solid #bae6fd" }}>
                                <div style={{ fontSize:12,fontWeight:600,color:"#0f172a",marginBottom:5 }}>Q{qi+1}. {q.texte}</div>
                                <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                                  {q.options.filter(Boolean).map((opt,oi)=>(
                                    <span key={oi} style={{ padding:"2px 8px",borderRadius:6,fontSize:11,background:opt===q.correct?"#dcfce7":"#f3f4f6",color:opt===q.correct?"#166534":"#6b7280",fontWeight:opt===q.correct?700:400 }}>
                                      {opt===q.correct?"✓ ":""}{opt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );})}

                  {/* Formulaire ajout bloc */}
                  {showBlocForm&&(
                    <div style={{ marginTop:16,padding:18,borderRadius:12,background:"#f0f9ff",border:"1px solid #bae6fd" }}>
                      <div style={{ fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:14 }}>Nouveau bloc de contenu</div>
                      <label style={labelSt}>Type de bloc</label>
                      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:7,marginBottom:14 }}>
                        {Object.entries(BLOCK_TYPES).map(([k,v])=>(
                          <button key={k} onClick={()=>setBlocForm({...blocForm,type:k})}
                            style={{ padding:"8px 10px",borderRadius:8,border:`1.5px solid ${blocForm.type===k?v.color:"#e5e7eb"}`,background:blocForm.type===k?v.color+"12":"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                            <span style={{ fontSize:18 }}>{v.icon}</span>
                            <span style={{ fontSize:10,fontWeight:blocForm.type===k?700:400,color:blocForm.type===k?v.color:"#374151" }}>{v.label}</span>
                          </button>
                        ))}
                      </div>
                      <label style={labelSt}>Titre du bloc *</label>
                      <input value={blocForm.titre} onChange={e=>setBlocForm({...blocForm,titre:e.target.value})} style={inputSt} placeholder="ex: Vidéo : Introduction aux réunions"/>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:10 }}>
                        <div><label style={labelSt}>Durée estimée (min)</label><input type="number" value={blocForm.dureeMin} onChange={e=>setBlocForm({...blocForm,dureeMin:Number(e.target.value)})} style={inputSt} min={1}/></div>
                      </div>
                      {(blocForm.type==="texte"||blocForm.type==="exercice")&&(
                        <div>
                          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                            <label style={labelSt}>Sections du cours</label>
                            <button onClick={()=>setBlocForm(f=>({ ...f, sections:[...f.sections,{id:Date.now(),niveau:"h2",titre:`${["I","II","III","IV","V","VI","VII","VIII"][f.sections.length]||"§"}. Nouvelle section`,contenu:""}] }))} style={{ ...btnPrimary,padding:"4px 10px",fontSize:11 }}>+ Section</button>
                          </div>
                          {blocForm.sections.map((sec,si)=>(
                            <div key={sec.id} style={{ borderRadius:10,border:"1px solid #bae6fd",background:"#f0f9ff",padding:12,marginBottom:10 }}>
                              <div style={{ display:"flex",gap:8,marginBottom:8,alignItems:"center" }}>
                                <select value={sec.niveau} onChange={e=>{ const s=[...blocForm.sections]; s[si]={...s[si],niveau:e.target.value}; setBlocForm(f=>({...f,sections:s})); }} style={{ ...inputSt,width:90,marginBottom:0,fontSize:11 }}>
                                  <option value="h1">Titre H1</option>
                                  <option value="h2">Section</option>
                                  <option value="h3">Sous-section</option>
                                  <option value="p">Paragraphe</option>
                                  <option value="ul">Liste</option>
                                  <option value="note">📌 Note</option>
                                </select>
                                <input value={sec.titre} onChange={e=>{ const s=[...blocForm.sections]; s[si]={...s[si],titre:e.target.value}; setBlocForm(f=>({...f,sections:s})); }} style={{ ...inputSt,marginBottom:0,flex:1,fontWeight:600 }} placeholder={`ex: I. Introduction`}/>
                                <button onClick={()=>setBlocForm(f=>({...f,sections:f.sections.filter((_,i)=>i!==si)}))} style={{ padding:"4px 8px",borderRadius:6,border:"1px solid #fca5a5",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:12 }}>✕</button>
                              </div>
                              <textarea value={sec.contenu} onChange={e=>{ const s=[...blocForm.sections]; s[si]={...s[si],contenu:e.target.value}; setBlocForm(f=>({...f,sections:s})); }} style={{ ...inputSt,marginBottom:0,minHeight:70,resize:"vertical",fontFamily:"inherit" }} placeholder={sec.niveau==="ul"?"- Point 1\n- Point 2\n- Point 3":sec.niveau==="note"?"Remarque importante…":"Rédigez le contenu de cette section…"}/>
                            </div>
                          ))}
                          {blocForm.sections.length===0&&(
                            <div style={{ padding:14,textAlign:"center",color:"#9ca3af",fontSize:12,border:"1px dashed #d1d5db",borderRadius:8 }}>Cliquez "+ Section" pour commencer</div>
                          )}
                        </div>
                      )}
                      {(blocForm.type==="video"||blocForm.type==="audio"||blocForm.type==="lien")&&(
                        <><label style={labelSt}>URL</label>
                        <input type="url" value={blocForm.url} onChange={e=>setBlocForm({...blocForm,url:e.target.value})} style={inputSt} placeholder="https://…"/></>
                      )}
                      {blocForm.type==="document"&&(
                        <>
                          <label style={labelSt}>Document (PDF, Word, Excel…)</label>
                          <CloudinaryUpload
                            type="document"
                            label="Uploader un document"
                            compact
                            onSuccess={(file) => setBlocForm(f => ({ ...f, fichier: file.original_name, taille: file.size ? `${(file.size/1024/1024).toFixed(1)} MB` : "", url: file.url }))}
                            onError={(msg) => toast.error(msg)}
                          />
                          {blocForm.fichier&&<div style={{ fontSize:12,color:"#059669",marginTop:4,marginBottom:4 }}>✓ {blocForm.fichier} {blocForm.taille&&`(${blocForm.taille})`}</div>}
                        </>
                      )}
                      {blocForm.type==="quiz"&&(
                        <div>
                          <label style={labelSt}>Questions du quiz ({blocForm.questions.length} ajoutée{blocForm.questions.length>1?"s":""})</label>
                          {blocForm.questions.map((q,qi)=>(
                            <div key={q.id} style={{ padding:"8px 10px",borderRadius:8,background:"#f0fdf4",border:"1px solid #bbf7d0",marginBottom:6,fontSize:12 }}>
                              <div style={{ fontWeight:600 }}>Q{qi+1}. {q.texte}</div>
                              <div style={{ color:"#9ca3af" }}>✓ {q.correct}</div>
                            </div>
                          ))}
                          <div style={{ background:"#fff",borderRadius:8,padding:12,border:"1px solid #e5e7eb",marginBottom:8 }}>
                            <div style={{ fontSize:12,fontWeight:600,color:"#374151",marginBottom:8 }}>Ajouter une question</div>
                            <input value={blocQuizQ.texte} onChange={e=>setBlocQuizQ({...blocQuizQ,texte:e.target.value})} style={{ ...inputSt,marginBottom:8 }} placeholder="Texte de la question"/>
                            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8 }}>
                              {[0,1,2,3].map(i=>(
                                <input key={i} value={blocQuizQ.options[i]} onChange={e=>{ const o=[...blocQuizQ.options]; o[i]=e.target.value; setBlocQuizQ({...blocQuizQ,options:o}); }} style={{ ...inputSt,marginBottom:0 }} placeholder={`Option ${i+1}`}/>
                              ))}
                            </div>
                            <select value={blocQuizQ.correct} onChange={e=>setBlocQuizQ({...blocQuizQ,correct:e.target.value})} style={{ ...inputSt,marginBottom:8 }}>
                              <option value="">— Sélectionner la bonne réponse —</option>
                              {blocQuizQ.options.filter(Boolean).map((o,i)=><option key={i} value={o}>{o}</option>)}
                            </select>
                            <button onClick={addQuizQuestion} style={{ ...btnPrimary,padding:"6px 12px",fontSize:11 }}>+ Ajouter cette question</button>
                          </div>
                        </div>
                      )}
                      <div style={{ display:"flex",gap:8,marginTop:12 }}>
                        <button onClick={addBloc} style={btnPrimary}>✓ Ajouter ce bloc</button>
                        <button onClick={()=>setShowBlocForm(false)} style={btnSecondary}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding:"14px 24px",borderTop:"1px solid #e5e7eb",display:"flex",gap:10,justifyContent:"flex-end",background:"#f9fafb",borderRadius:"0 0 14px 14px" }}>
                <button onClick={()=>setShowModuleBuilder(false)} style={btnSecondary}>Annuler</button>
                <button onClick={()=>{ setModuleForm(prev=>{ const f2={...prev,statut:"brouillon"}; const {coursId,moduleId}=editingModuleContent||{}; if(coursId&&moduleId){ const updated={id:`m${coursId}-${moduleId}`,coursId,moduleId,titre:f2.titre,objectifs:f2.objectifs.split("\n").filter(Boolean),dureeEstimee:Number(f2.dureeEstimee),statut:"brouillon",blocs:blocs.map((b,i)=>({...b,ordre:i+1}))}; setModulesContent(prev2=>({...prev2,[String(coursId)]:{...prev2[String(coursId)],[String(moduleId)]:updated}})); toast.success("Brouillon sauvegardé ✓"); setShowModuleBuilder(false); } return f2; }); }} style={{ ...btnSecondary,borderColor:"#d1d5db" }}>💾 Sauvegarder brouillon</button>
                <button onClick={saveModuleContent} style={btnPrimary}>🚀 Publier le module</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL PROGRESSION INDIVIDUELLE ══ */}
        {showProgEtudModal&&selectedEtudProg&&(
          <Modal title={`Progression : ${selectedEtudProg.moduleTitre}`} onClose={()=>setShowProgEtudModal(false)} wide>
            <p style={{ fontSize:13,color:"#9ca3af",marginBottom:16 }}>Suivi individuel par étudiant pour ce module</p>
            <table style={tableStyle}><thead><tr>
              <th style={th}>Étudiant</th><th style={th}>Statut</th><th style={th}>Progression</th><th style={th}>Score quiz</th><th style={th}>Date completion</th>
            </tr></thead><tbody>
              {etudiants.filter(e=>e.coursIds.includes(selectedEtudProg.coursId)).map(e=>{
                const prog=studentProgressions[e.id]?.[String(selectedEtudProg.coursId)]?.[String(selectedEtudProg.moduleId)];
                const sm=STATUT_PROG_META[prog?.statut||"non_commence"];
                return (
                  <tr key={e.id} style={{ borderTop:"1px solid #f1f5f9" }}>
                    <td style={td}><div style={{ fontWeight:600,fontSize:13 }}>{e.nom}</div><div style={{ fontSize:11,color:"#9ca3af" }}>{e.email}</div></td>
                    <td style={td}><span style={{ padding:"3px 10px",borderRadius:10,fontSize:11,fontWeight:700,background:sm.bg,color:sm.c }}>{sm.icon} {sm.label}</span></td>
                    <td style={{ ...td,minWidth:120 }}>
                      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                        <div style={{ flex:1,height:6,background:"#e5e7eb",borderRadius:3,overflow:"hidden" }}><div style={{ height:"100%",width:`${prog?.pct||0}%`,background:BET,borderRadius:3 }}/></div>
                        <span style={{ fontSize:12,fontWeight:700,color:BET }}>{prog?.pct||0}%</span>
                      </div>
                    </td>
                    <td style={td}><span style={{ fontWeight:700,color:prog?.quizScore!=null?(prog.quizScore>=60?"#22c55e":"#f59e0b"):"#9ca3af" }}>{prog?.quizScore!=null?`${prog.quizScore}%`:"—"}</span></td>
                    <td style={{ ...td,fontSize:12,color:"#6b7280" }}>{prog?.dateComplete?fmtDate(prog.dateComplete):"—"}</td>
                  </tr>
                );
              })}
            </tbody></table>
            <div style={{ display:"flex",gap:10,marginTop:16 }}>
              <button onClick={()=>exportCSVProgressions(selectedEtudProg.coursId)} style={btnSecondary}>⬇️ Exporter CSV</button>
              <button onClick={()=>setShowProgEtudModal(false)} style={btnSecondary}>Fermer</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL ANALYTICS COURS ══ */}
        {showAnalyticsModal&&selectedCoursAnalytics&&(()=>{
          const c=cours.find(x=>x.id===selectedCoursAnalytics);
          const analytics=getCoursAnalytics(selectedCoursAnalytics);
          return (
            <Modal title={`Analytics — ${c?.titre}`} onClose={()=>setShowAnalyticsModal(false)} wide>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18 }}>
                {[
                  { l:"Étudiants", v:analytics.totalEtuds, c:BET },
                  { l:"Modules publiés", v:c?.modulesOk, c:"#059669" },
                  { l:"Durée totale", v:`${Object.values(modulesContent[String(selectedCoursAnalytics)]||{}).reduce((s,m)=>s+(m.dureeEstimee||0),0)} min`, c:"#7c3aed" },
                ].map(s=>(
                  <div key={s.l} style={{ textAlign:"center",padding:14,borderRadius:10,background:"#f8fafc" }}>
                    <div style={{ fontSize:11,color:"#9ca3af" }}>{s.l}</div>
                    <div style={{ fontSize:22,fontWeight:800,color:s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <h4 style={{ fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:12 }}>Progression par module</h4>
              {analytics.moduleStats.map(ms=>{
                const sm=STATUT_MODULE[ms.statut||"brouillon"];
                const pct=ms.total?Math.round((ms.termines/ms.total)*100):0;
                return (
                  <div key={ms.id} style={{ marginBottom:12,padding:"10px 12px",borderRadius:8,background:"#f8fafc",border:"1px solid #e5e7eb" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                      <div>
                        <span style={{ fontWeight:600,fontSize:13 }}>{ms.titre}</span>
                        <span style={{ marginLeft:8,padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:700,background:sm.bg,color:sm.c }}>{sm.label}</span>
                      </div>
                      <span style={{ fontSize:12,color:"#9ca3af" }}>{ms.termines}/{ms.total} terminé(s) · {ms.blocs} blocs · {ms.duree} min</span>
                    </div>
                    <div style={{ height:6,background:"#e5e7eb",borderRadius:3,overflow:"hidden" }}>
                      <div style={{ height:"100%",width:`${pct}%`,background:pct>=80?"#22c55e":pct>=40?"#f59e0b":"#ef4444",borderRadius:3 }}/>
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"#9ca3af",marginTop:3 }}>
                      <span>{pct}% des étudiants ont terminé</span>
                      {ms.avgScore!=null&&<span>Score quiz moyen : <strong style={{ color:ms.avgScore>=60?"#22c55e":"#f59e0b" }}>{ms.avgScore}%</strong></span>}
                    </div>
                  </div>
                );
              })}
              <div style={{ display:"flex",gap:10,marginTop:14 }}>
                <button onClick={()=>exportCSVProgressions(selectedCoursAnalytics)} style={btnSecondary}>⬇️ Export CSV progression</button>
                <button onClick={()=>setShowAnalyticsModal(false)} style={btnSecondary}>Fermer</button>
              </div>
            </Modal>
          );
        })()}

        {/* ══ MODAL SÉANCES RÉCURRENTES ══ */}
        {showRecurringModal&&(
          <Modal title="Créer des séances récurrentes" onClose={()=>setShowRecurringModal(false)}>
            <p style={{ fontSize:13,color:"#6b7280",marginBottom:16 }}>Dupliquez une séance existante sur plusieurs semaines consécutives.</p>
            <label style={labelSt}>Séance de référence</label>
            <select value={recurringForm.seanceBaseId} onChange={e=>setRecurringForm({...recurringForm,seanceBaseId:e.target.value})} style={inputSt}>
              <option value="">Sélectionner une séance…</option>
              {seances.filter(s=>s.statut!=="annule").map(s=>(
                <option key={s.id} value={s.id}>{s.titre} — {fmtDateCourt(s.date)} {s.heure}</option>
              ))}
            </select>
            <label style={labelSt}>Nombre de semaines à dupliquer</label>
            <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16 }}>
              <input type="range" min={1} max={12} step={1} value={recurringForm.nbSemaines} onChange={e=>setRecurringForm({...recurringForm,nbSemaines:Number(e.target.value)})} style={{ flex:1 }}/>
              <span style={{ fontWeight:800,color:BET,fontSize:18,minWidth:40 }}>{recurringForm.nbSemaines} sem.</span>
            </div>
            {recurringForm.seanceBaseId&&(
              <div style={{ padding:"10px 14px",borderRadius:8,background:"#e0f2fe",border:"1px solid #bae6fd",fontSize:12,color:BET }}>
                📅 {recurringForm.nbSemaines} nouvelle{recurringForm.nbSemaines>1?"s":""} séance{recurringForm.nbSemaines>1?"s":""} créée{recurringForm.nbSemaines>1?"s":""},<br/>chaque semaine +1 à partir du {fmtDateCourt(seances.find(s=>s.id===Number(recurringForm.seanceBaseId))?.date||"")}.
              </div>
            )}
            <div style={{ display:"flex",gap:10,marginTop:16 }}>
              <button onClick={saveRecurringSessions} disabled={!recurringForm.seanceBaseId} style={{ ...btnPrimary,opacity:!recurringForm.seanceBaseId?0.5:1 }}>🔄 Créer les séances</button>
              <button onClick={()=>setShowRecurringModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL NOTIFICATION ══ */}
        {showNotifModal&&(
          <Modal title="Envoyer une notification" onClose={()=>setShowNotifModal(false)}>
            <label style={labelSt}>Cours concerné</label>
            <select value={notifForm.coursId} onChange={e=>setNotifForm({...notifForm,coursId:Number(e.target.value)})} style={inputSt}>
              {cours.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.titre} ({c.etudiants} étudiants)</option>)}
            </select>
            <label style={labelSt}>Type de notification</label>
            <select value={notifForm.type} onChange={e=>setNotifForm({...notifForm,type:e.target.value})} style={inputSt}>
              <option value="info">ℹ️ Information générale</option>
              <option value="module_publie">📚 Nouveau module disponible</option>
              <option value="evaluation">📝 Évaluation à venir</option>
              <option value="ressource_ajoutee">📄 Nouvelle ressource</option>
            </select>
            <label style={labelSt}>Titre *</label>
            <input value={notifForm.titre} onChange={e=>setNotifForm({...notifForm,titre:e.target.value})} style={inputSt} placeholder="ex: Nouveau module disponible"/>
            <label style={labelSt}>Message *</label>
            <textarea value={notifForm.message} onChange={e=>setNotifForm({...notifForm,message:e.target.value})} style={{ ...inputSt,minHeight:80,resize:"vertical" }} placeholder="ex: Le module 'Correspondance formelle' est maintenant accessible."/>
            <div style={{ padding:"10px 14px",borderRadius:8,background:"#e0f2fe",fontSize:12,color:BET,marginBottom:14 }}>
              📧 Cette notification sera envoyée à <strong>{cours.find(x=>x.id===notifForm.coursId)?.etudiants||0}</strong> étudiant(s) inscrit(s) au cours.
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={sendNotification} style={btnPrimary}>🚀 Envoyer la notification</button>
              <button onClick={()=>setShowNotifModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL FICHE ÉTUDIANT ══ */}
        {showEtudModal&&selectedEtud&&(
          <Modal title="Fiche Étudiant" onClose={()=>setShowEtudModal(false)} wide>
            <div style={{ display:"flex", gap:16, paddingBottom:16, borderBottom:"1px solid #e5e7eb", marginBottom:16 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:BET_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:BET, flexShrink:0 }}>
                {selectedEtud.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:800 }}>{selectedEtud.nom}</div>
                <div style={{ fontSize:13, color:"#6b7280" }}>{selectedEtud.email}</div>
                <div style={{ display:"flex", gap:8, marginTop:6 }}><NivBadge n={selectedEtud.niveau}/><Sbadge s={selectedEtud.statut}/></div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
              {[
                { l:"Progression", v:`${selectedEtud.progression}%`,  c:selectedEtud.progression>=60?BET:"#f59e0b" },
                { l:"Assiduité",   v:`${selectedEtud.assiduite}%`,    c:selectedEtud.assiduite>=85?"#22c55e":"#ef4444" },
                { l:"Dernière note",v:`${selectedEtud.dernNote}/20`,  c:selectedEtud.dernNote>=10?"#22c55e":"#ef4444" },
                { l:"Absences",    v:selectedEtud.absent,             c:selectedEtud.absent>5?"#ef4444":"#374151" },
              ].map(s=>(
                <div key={s.l} style={{ textAlign:"center", padding:12, borderRadius:10, background:"#f8fafc" }}>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{s.l}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, color:"#9ca3af", marginBottom:4 }}>Progression</div>
              <Bar value={selectedEtud.progression} color={BET} h={9}/>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:"#9ca3af", marginBottom:4 }}>Assiduité</div>
              <Bar value={selectedEtud.assiduite} color={selectedEtud.assiduite>=85?"#22c55e":"#ef4444"} h={9}/>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:8 }}>Cours suivis</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {selectedEtud.coursIds.map(cId=>{ const c=cours.find(x=>x.id===cId); return c&&<span key={cId} style={{ padding:"4px 10px", borderRadius:8, fontSize:12, background:c.color+"15", color:c.color, fontWeight:600 }}>{c.emoji} {c.titre}</span>; })}
              </div>
            </div>
            {selectedEtud.commentaire&&(
              <div style={{ padding:"10px 14px", borderRadius:8, background:"#fef3c7", border:"1px solid #fcd34d", fontSize:12, color:"#92400e", marginBottom:16 }}>
                📝 {selectedEtud.commentaire}
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{
                const body=encodeURIComponent(`Bonjour ${selectedEtud.nom},\n\nVoici votre bilan :\n- Progression : ${selectedEtud.progression}%\n- Assiduité : ${selectedEtud.assiduite}%\n- Dernière note : ${selectedEtud.dernNote}/20\n\nCordialement,\nProf. ${MON_PROFIL_REEL.nom}`);
                window.location.href=`mailto:${selectedEtud.email}?subject=Bilan formation&body=${body}`;
              }} style={btnPrimary}>📧 Envoyer un bilan</button>
              <button onClick={()=>setShowEtudModal(false)} style={btnSecondary}>Fermer</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL DÉTAIL COURS ══ */}
        {showCoursModal&&selectedCours&&(
          <Modal title={selectedCours.titre} onClose={()=>setShowCoursModal(false)} wide>
            <div style={{ display:"flex", gap:14, paddingBottom:16, borderBottom:"1px solid #e5e7eb", marginBottom:16 }}>
              <span style={{ fontSize:40 }}>{selectedCours.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:18, fontWeight:800 }}>{selectedCours.titre}</div>
                <NivBadge n={selectedCours.niveau}/>
                <p style={{ fontSize:13, color:"#6b7280", marginTop:8 }}>{selectedCours.description}</p>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
              {[
                { l:"Étudiants",  v:selectedCours.etudiants,   c:BET },
                { l:"Modules",    v:`${selectedCours.modulesOk}/${selectedCours.modules}`, c:selectedCours.color },
                { l:"Heures",     v:`${selectedCours.heuresFaites}h/${selectedCours.heuresTotales}h`, c:"#374151" },
                { l:"Avancement", v:`${Math.round((selectedCours.modulesOk/selectedCours.modules)*100)}%`, c:selectedCours.color },
              ].map(s=>(
                <div key={s.l} style={{ textAlign:"center", padding:12, borderRadius:8, background:"#f8fafc" }}>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{s.l}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
            <h4 style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Modules</h4>
            {selectedCours.modules_list.map((m,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, marginBottom:6, background:m.fait?"#f0fdf4":"#f9fafb", border:`1px solid ${m.fait?"#bbf7d0":"#e5e7eb"}` }}>
                <span style={{ fontSize:16 }}>{m.fait?"✅":"⭕"}</span>
                <span style={{ flex:1, fontSize:13, fontWeight:m.fait?600:400, color:m.fait?"#166534":"#374151" }}>{m.nom}</span>
                <span style={{ fontSize:11, padding:"2px 7px", borderRadius:6, background:m.type==="online"?"#ede9fe":"#dcfce7", color:m.type==="online"?"#5b21b6":"#166534" }}>{m.type==="online"?"🌐 Online":"🏢 Présentiel"}</span>
                <span style={{ fontSize:11, color:"#9ca3af" }}>{fmtDate(m.date)}</span>
              </div>
            ))}
            <button onClick={()=>setShowCoursModal(false)} style={{ ...btnSecondary, marginTop:16 }}>Fermer</button>
          </Modal>
        )}

        {/* ══ MODAL PRÉSENCE ══ */}
        {showPresenceModal&&presenceSeance&&(
          <Modal title={`Présences — ${presenceSeance.titre}`} onClose={()=>setShowPresenceModal(false)} wide>
            <div style={{ padding:"10px 14px", borderRadius:8, background:BET_LIGHT, border:`1px solid ${BET}30`, fontSize:12, color:BET, marginBottom:16 }}>
              📅 {fmtDateCourt(presenceSeance.date)} · ⏱ {presenceSeance.heure} · {presenceSeance.type==="online"?"🌐":"🏢"} {presenceSeance.salle} · 👥 {presenceSeance.nbInscrits} inscrits
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <span style={{ fontSize:13, color:"#374151" }}>
                ✅ <strong>{Object.values(presenceData).filter(v=>v==="present").length}</strong> présents sur {Object.keys(presenceData).length}
              </span>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setPresenceData(Object.fromEntries(Object.keys(presenceData).map(k=>[k,"present"])))} style={{ ...btnSecondary, padding:"5px 10px", fontSize:11 }}>✅ Tous présents</button>
                <button onClick={()=>setPresenceData(Object.fromEntries(Object.keys(presenceData).map(k=>[k,"absent"])))}  style={{ ...btnSecondary, padding:"5px 10px", fontSize:11 }}>❌ Tous absents</button>
              </div>
            </div>
            {etudiants.filter(e=>e.coursIds.includes(presenceSeance.coursId)).map(e=>(
              <div key={e.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, marginBottom:6, background:presenceData[e.id]==="present"?"#f0fdf4":"#fff5f5", border:`1px solid ${presenceData[e.id]==="present"?"#bbf7d0":"#fecaca"}` }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:BET_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11, color:BET, flexShrink:0 }}>
                  {e.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{e.nom}</div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}><NivBadge n={e.niveau}/></div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  {["present","absent","retard"].map(st=>(
                    <button key={st} onClick={()=>setPresenceData(p=>({...p,[e.id]:st}))} style={{
                      padding:"5px 10px", borderRadius:6, border:"1px solid", fontSize:11, cursor:"pointer",
                      background: presenceData[e.id]===st?(st==="present"?"#dcfce7":st==="retard"?"#fef3c7":"#fee2e2"):"#fff",
                      color: presenceData[e.id]===st?(st==="present"?"#166534":st==="retard"?"#92400e":"#991b1b"):"#6b7280",
                      borderColor: presenceData[e.id]===st?(st==="present"?"#bbf7d0":st==="retard"?"#fcd34d":"#fca5a5"):"#e5e7eb",
                      fontWeight: presenceData[e.id]===st?700:400,
                    }}>{st==="present"?"✅ Présent":st==="retard"?"⏰ Retard":"❌ Absent"}</button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={savePresence} style={btnPrimary}>💾 Enregistrer les présences</button>
              <button onClick={()=>setShowPresenceModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL SAISIE NOTE ══ */}
        {showNoteModal&&(
          <Modal title="Saisir une note" onClose={()=>setShowNoteModal(false)}>
            <label style={labelSt}>Étudiant *</label>
            <select value={noteForm.etudiantId} onChange={e=>setNoteForm({...noteForm,etudiantId:e.target.value})} style={inputSt}>
              <option value="">Sélectionner un étudiant</option>
              {etudiants.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
            <label style={labelSt}>Nom de l'évaluation *</label>
            <input type="text" placeholder="ex: Évaluation Module 4" value={noteForm.evalNom} onChange={e=>setNoteForm({...noteForm,evalNom:e.target.value})} style={inputSt}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={labelSt}>Note obtenue *</label>
                <input type="number" min="0" max={noteForm.total} placeholder="0–20" value={noteForm.score} onChange={e=>setNoteForm({...noteForm,score:e.target.value})} style={inputSt}/>
              </div>
              <div>
                <label style={labelSt}>Note sur</label>
                <input type="number" value={noteForm.total} onChange={e=>setNoteForm({...noteForm,total:e.target.value})} style={inputSt}/>
              </div>
            </div>
            <label style={labelSt}>Commentaire (optionnel)</label>
            <textarea placeholder="Remarques pédagogiques…" value={noteForm.commentaire} onChange={e=>setNoteForm({...noteForm,commentaire:e.target.value})} style={{ ...inputSt, minHeight:60, resize:"vertical" }}/>
            {noteForm.score&&noteForm.total&&(
              <div style={{ padding:"8px 12px", borderRadius:8, background:Number(noteForm.score)/Number(noteForm.total)>=0.5?"#f0fdf4":"#fff5f5", border:`1px solid ${Number(noteForm.score)/Number(noteForm.total)>=0.5?"#bbf7d0":"#fecaca"}`, fontSize:12, marginBottom:10 }}>
                Résultat : <strong style={{ color:Number(noteForm.score)/Number(noteForm.total)>=0.5?"#22c55e":"#ef4444" }}>{Math.round(Number(noteForm.score)/Number(noteForm.total)*100)}%</strong>
                {" — "}{Number(noteForm.score)/Number(noteForm.total)>=0.5?"✅ Réussi":"❌ Non validé"}
              </div>
            )}
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <button onClick={saveNote} style={btnPrimary}>💾 Enregistrer</button>
              <button onClick={()=>setShowNoteModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL AJOUTER RESSOURCE ══ */}
        {showAddRessModal&&(
          <Modal title="Ajouter une ressource" onClose={()=>setShowAddRessModal(false)} wide>
            <label style={labelSt}>Titre *</label>
            <input type="text" placeholder="ex: Guide de grammaire B2" value={ressForm.titre} onChange={e=>setRessForm({...ressForm,titre:e.target.value})} style={inputSt}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={labelSt}>Type</label>
                <select value={ressForm.type} onChange={e=>setRessForm({...ressForm,type:e.target.value,url:"",fichierNom:"",speakConsigne:""})} style={inputSt}>
                  {Object.entries(TYPE_RESSOURCE).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Cours associé</label>
                <select value={ressForm.cours} onChange={e=>setRessForm({...ressForm,cours:e.target.value})} style={inputSt}>
                  {cours.map(c=><option key={c.id}>{c.titre}</option>)}
                </select>
              </div>
            </div>

            {/* ── AUDIO : upload Cloudinary + URL ── */}
            {ressForm.type === "audio" && (
              <div style={{ padding:"14px 16px", borderRadius:10, background:"#f0fdf4", border:"1px solid #bbf7d0", marginBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#059669", marginBottom:10 }}>🎧 Fichier Audio</div>
                <CloudinaryUpload
                  type="audio"
                  label="Uploader un fichier audio"
                  currentUrl={ressForm.url && ressForm.fichierNom ? ressForm.url : undefined}
                  onSuccess={(file) => setRessForm(r => ({ ...r, url: file.url, fichierNom: file.original_name, taille: file.size ? `${(file.size/1024/1024).toFixed(1)} MB` : "" }))}
                  onError={(msg) => toast.error(msg)}
                  style={{ marginBottom: 8 }}
                />
                {ressForm.url && ressForm.fichierNom && <audio src={ressForm.url} controls style={{ width:"100%", height:36, marginBottom:8 }} />}
                <label style={labelSt}>— ou URL externe (lien direct MP3)</label>
                <input type="url" placeholder="https://example.com/audio.mp3" value={ressForm.fichierNom?"":ressForm.url} onChange={e=>setRessForm(r=>({...r,url:e.target.value,fichierNom:""}))} style={inputSt}/>
                <label style={labelSt}>Durée</label>
                <input type="text" placeholder="ex: 30 min" value={ressForm.taille} onChange={e=>setRessForm({...ressForm,taille:e.target.value})} style={inputSt}/>
              </div>
            )}

            {/* ── VIDÉO : upload Cloudinary + URL ── */}
            {ressForm.type === "video" && (
              <div style={{ padding:"14px 16px", borderRadius:10, background:"#f5f3ff", border:"1px solid #c4b5fd", marginBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#7c3aed", marginBottom:10 }}>🎬 Fichier Vidéo</div>
                <CloudinaryUpload
                  type="video"
                  label="Uploader une vidéo"
                  currentUrl={ressForm.url && ressForm.fichierNom ? ressForm.url : undefined}
                  onSuccess={(file) => setRessForm(r => ({ ...r, url: file.url, fichierNom: file.original_name, taille: file.size ? `${(file.size/1024/1024).toFixed(0)} MB` : "" }))}
                  onError={(msg) => toast.error(msg)}
                  style={{ marginBottom: 8 }}
                />
                {ressForm.url && ressForm.fichierNom && <video src={ressForm.url} controls style={{ width:"100%", maxHeight:180, borderRadius:8, marginBottom:8 }} />}
                <label style={labelSt}>— ou URL YouTube / Vimeo / lien direct</label>
                <input type="url" placeholder="https://youtube.com/watch?v=… ou https://example.com/video.mp4" value={ressForm.fichierNom?"":ressForm.url} onChange={e=>setRessForm(r=>({...r,url:e.target.value,fichierNom:""}))} style={inputSt}/>
                <label style={labelSt}>Durée</label>
                <input type="text" placeholder="ex: 45 min" value={ressForm.taille} onChange={e=>setRessForm({...ressForm,taille:e.target.value})} style={inputSt}/>
              </div>
            )}

            {/* ── SPEAKING : formulaire complet ── */}
            {ressForm.type === "speaking" && (
              <div style={{ padding:"14px 16px", borderRadius:10, background:"#fef2f2", border:"1px solid #fecaca", marginBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#dc2626", marginBottom:10 }}>🎤 Exercice Speaking à partager</div>
                <div style={{ padding:"8px 12px", borderRadius:8, background:"#fff7ed", border:"1px solid #fed7aa", fontSize:12, color:"#9a3412", marginBottom:12 }}>
                  ℹ️ Cet exercice apparaîtra dans l'onglet <strong>Examens → 🎤 Speaking</strong> de chaque apprenant concerné.
                </div>
                <label style={labelSt}>Format de speaking</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:10 }}>
                  {[["independant","💭","Opinion / Indépendant"],["integre_lecture","📖","Lecture + Expression"],["integre_audio","🎧","Audio + Expression"]].map(([v,ic,lb])=>(
                    <button key={v} onClick={()=>setRessForm(r=>({...r,speakType:v}))} style={{ padding:"10px 6px", borderRadius:8, border:`2px solid ${ressForm.speakType===v?"#dc2626":"#e5e7eb"}`, background:ressForm.speakType===v?"#fef2f2":"#fff", cursor:"pointer", textAlign:"center" }}>
                      <div style={{ fontSize:18 }}>{ic}</div>
                      <div style={{ fontSize:10, fontWeight:ressForm.speakType===v?700:400, color:ressForm.speakType===v?"#dc2626":"#374151", marginTop:2 }}>{lb}</div>
                    </button>
                  ))}
                </div>
                <label style={labelSt}>Consigne * (ce que l'apprenant devra dire)</label>
                <textarea placeholder="ex: Do you prefer working from home or in the office? Explain your preference with 2 reasons and an example." value={ressForm.speakConsigne} onChange={e=>setRessForm(r=>({...r,speakConsigne:e.target.value}))} style={{ ...inputSt, minHeight:80, resize:"vertical" }}/>
                {ressForm.speakType === "integre_audio" && (
                  <>
                    <label style={labelSt}>🎧 URL du fichier audio prompt</label>
                    <input type="url" placeholder="https://example.com/prompt.mp3" value={ressForm.url} onChange={e=>setRessForm(r=>({...r,url:e.target.value}))} style={inputSt}/>
                  </>
                )}
                <label style={labelSt}>Conseil (tip) pour l'apprenant (optionnel)</label>
                <input type="text" placeholder="ex: Structure: State preference → 2 reasons → example → conclude" value={ressForm.speakTip} onChange={e=>setRessForm(r=>({...r,speakTip:e.target.value}))} style={inputSt}/>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  <div>
                    <label style={labelSt}>Niveau</label>
                    <select value={ressForm.speakNiveau} onChange={e=>setRessForm(r=>({...r,speakNiveau:e.target.value}))} style={inputSt}>
                      {["A2","B1","B2","C1","C2"].map(n=><option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelSt}>⏱ Préparation (sec)</label>
                    <input type="number" min={10} max={120} value={ressForm.speakPrepTime} onChange={e=>setRessForm(r=>({...r,speakPrepTime:Number(e.target.value)}))} style={inputSt}/>
                  </div>
                  <div>
                    <label style={labelSt}>🎙 Réponse max (sec)</label>
                    <input type="number" min={15} max={180} value={ressForm.speakRecordTime} onChange={e=>setRessForm(r=>({...r,speakRecordTime:Number(e.target.value)}))} style={inputSt}/>
                  </div>
                </div>
              </div>
            )}

            {/* Taille/Durée pour les autres types */}
            {!["audio","video","speaking"].includes(ressForm.type) && (
              <>
                <label style={labelSt}>Taille / Durée</label>
                <input type="text" placeholder="ex: 2.4 MB ou 30 min" value={ressForm.taille} onChange={e=>setRessForm({...ressForm,taille:e.target.value})} style={inputSt}/>
              </>
            )}

            <label style={{ ...labelSt, display:"flex", alignItems:"center", gap:8 }}>
              <input type="checkbox" checked={ressForm.partage} onChange={e=>setRessForm({...ressForm,partage:e.target.checked})}/> Partager avec les étudiants
            </label>
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <button onClick={saveRessource} style={btnPrimary}>
                {ressForm.type==="speaking"?"🎤 Publier l'exercice":ressForm.type==="audio"?"🎧 Ajouter l'audio":ressForm.type==="video"?"🎬 Ajouter la vidéo":"Ajouter"}
              </button>
              <button onClick={()=>setShowAddRessModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL NOUVEAU MESSAGE ══ */}
        {showNewMsgModal&&(
          <Modal title="✉️ Nouveau message" onClose={()=>setShowNewMsgModal(false)}>
            <label style={labelSt}>Destinataire</label>
            <select value={newMsgForm.destinataire} onChange={e=>setNewMsgForm(f=>({...f,destinataire:e.target.value,etudiantId:""}))} style={inputSt}>
              <option value="etudiant">👤 Un étudiant</option>
              <option value="responsable">🎓 Responsable pédagogique</option>
              <option value="superviseur">🔍 Superviseur</option>
              <option value="onboarding">🎯 Assistant Onboarding</option>
            </select>
            {newMsgForm.destinataire==="etudiant"&&(
              <>
                <label style={labelSt}>Étudiant *</label>
                <select value={newMsgForm.etudiantId} onChange={e=>setNewMsgForm(f=>({...f,etudiantId:e.target.value}))} style={inputSt}>
                  <option value="">Sélectionner un étudiant</option>
                  {etudiants.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}
                </select>
              </>
            )}
            <label style={labelSt}>Objet *</label>
            <input type="text" placeholder="Sujet du message…" value={newMsgForm.objet} onChange={e=>setNewMsgForm(f=>({...f,objet:e.target.value}))} style={inputSt}/>
            <label style={labelSt}>Message *</label>
            <textarea placeholder="Votre message…" value={newMsgForm.message} onChange={e=>setNewMsgForm(f=>({...f,message:e.target.value}))} style={{ ...inputSt, minHeight:100, resize:"vertical" }}/>
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <button onClick={()=>sendNewMessage()} style={btnPrimary}>📨 Envoyer</button>
              <button onClick={()=>setShowNewMsgModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL CRÉER ÉVALUATION / EXAMEN ══ */}
        {showCreateEvalModal&&(
          <Modal title={evalForm.categorie==="examen"?"🎓 Créer un examen officiel":"📝 Créer une évaluation"} onClose={()=>setShowCreateEvalModal(false)} wide>
            {/* Catégorie selector */}
            <div style={{ display:"flex",gap:10,marginBottom:16 }}>
              {[["evaluation","📝 Évaluation","Contrôle courant, devoir, révision","#0891b2"],["examen","🎓 Examen officiel","Examen certifiant, impact sur la certification","#7c3aed"]].map(([val,label,desc,col])=>(
                <button key={val} onClick={()=>setEvalForm(f=>({...f,categorie:val}))} style={{ flex:1,padding:"12px 14px",borderRadius:10,border:`2px solid ${evalForm.categorie===val?col:"#e5e7eb"}`,background:evalForm.categorie===val?col+"12":"#fff",cursor:"pointer",textAlign:"left" }}>
                  <div style={{ fontWeight:700,fontSize:13,color:evalForm.categorie===val?col:"#374151" }}>{label}</div>
                  <div style={{ fontSize:11,color:"#6b7280",marginTop:2 }}>{desc}</div>
                </button>
              ))}
            </div>
            {evalForm.categorie==="examen"&&(
              <div style={{ padding:"8px 14px",borderRadius:8,background:"#f3e8ff",border:"1px solid #c4b5fd",fontSize:12,color:"#7c3aed",marginBottom:12 }}>
                ⚠️ Un examen officiel compte pour la <strong>certification finale</strong> et sera signalé dans le dossier de l'apprenant.
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelSt}>Cours *</label>
                <select value={evalForm.coursId} onChange={e=>setEvalForm(f=>({...f,coursId:Number(e.target.value)}))} style={inputSt}>
                  {cours.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.titre}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelSt}>Titre *</label>
                <input type="text" placeholder={evalForm.categorie==="examen"?"ex: Examen final TOEIC B2":"ex: Évaluation compréhension orale"} value={evalForm.titre} onChange={e=>setEvalForm(f=>({...f,titre:e.target.value}))} style={inputSt}/>
              </div>
              <div>
                <label style={labelSt}>Date *</label>
                <input type="date" value={evalForm.date} onChange={e=>setEvalForm(f=>({...f,date:e.target.value}))} style={inputSt}/>
              </div>
              <div>
                <label style={labelSt}>Durée (minutes)</label>
                <input type="number" min={15} max={300} value={evalForm.dureeMin} onChange={e=>setEvalForm(f=>({...f,dureeMin:Number(e.target.value)}))} style={inputSt}/>
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelSt}>Format / Type de contenu</label>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8 }}>
                  {[["qcm","📋","QCM"],["listening","🎬","Listening"],["audio","🎧","Audio"],["quiz","🎯","Quiz"],["speaking","🎤","Speaking"]].map(([v,ic,lb])=>(
                    <button key={v} onClick={()=>setEvalForm(f=>({...f,type:v,questions:[],ressourceUrl:""}))} style={{ padding:"10px 6px",borderRadius:8,border:`2px solid ${evalForm.type===v?(v==="speaking"?"#dc2626":BET):"#e5e7eb"}`,background:evalForm.type===v?(v==="speaking"?"#fef2f2":BET+"12"):"#fff",cursor:"pointer",textAlign:"center" }}>
                      <div style={{ fontSize:20 }}>{ic}</div>
                      <div style={{ fontSize:11,fontWeight:evalForm.type===v?700:400,color:evalForm.type===v?(v==="speaking"?"#dc2626":BET):"#374151",marginTop:3 }}>{lb}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section adaptative selon type */}
            <div style={{ marginTop:14,padding:14,borderRadius:10,background:"#f8fafc",border:"1px solid #e2e8f0" }}>
              {/* LISTENING / AUDIO → URL ressource */}
              {(evalForm.type==="listening"||evalForm.type==="audio")&&(
                <div style={{ marginBottom:12 }}>
                  <label style={labelSt}>{evalForm.type==="listening"?"🎬 URL de la vidéo (à regarder avant les questions)":"🎧 URL du fichier audio (à écouter avant les questions)"}</label>
                  <input type="url" value={evalForm.ressourceUrl} onChange={e=>setEvalForm(f=>({...f,ressourceUrl:e.target.value}))} style={inputSt} placeholder="https://…"/>
                  {evalForm.ressourceUrl&&(
                    <div style={{ padding:"8px 12px",borderRadius:8,background:evalForm.type==="listening"?"#fef3c7":"#ecfdf5",border:`1px solid ${evalForm.type==="listening"?"#fbbf24":"#6ee7b7"}`,fontSize:12,color:"#374151",marginTop:-4 }}>
                      {evalForm.type==="listening"?"🎬":"🎧"} <strong>Ressource liée :</strong> les apprenants {evalForm.type==="listening"?"regarderont cette vidéo":"écouteront cet audio"} <strong>avant</strong> de répondre aux questions.
                    </div>
                  )}
                </div>
              )}

              {/* Questions QCM / Listening / Audio */}
              {(evalForm.type==="qcm"||evalForm.type==="listening"||evalForm.type==="audio")&&(
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:"#374151",marginBottom:10 }}>Questions ({evalForm.questions.length})</div>
                  {evalForm.questions.map((q,qi)=>(
                    <div key={q.id} style={{ padding:"8px 10px",borderRadius:8,background:"#f0fdf4",border:"1px solid #bbf7d0",marginBottom:6,fontSize:12,display:"flex",justifyContent:"space-between" }}>
                      <div><span style={{ fontWeight:700 }}>Q{qi+1}.</span> {q.texte} <span style={{ color:"#059669",marginLeft:8 }}>✓ {q.correct}</span></div>
                      <button onClick={()=>setEvalForm(f=>({...f,questions:f.questions.filter((_,i)=>i!==qi)}))} style={{ background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:13 }}>✕</button>
                    </div>
                  ))}
                  <div style={{ background:"#fff",borderRadius:8,padding:12,border:"1px solid #e5e7eb" }}>
                    <div style={{ fontSize:12,fontWeight:600,color:"#374151",marginBottom:8 }}>+ Ajouter une question</div>
                    <input value={evalQForm.texte} onChange={e=>setEvalQForm(f=>({...f,texte:e.target.value}))} style={{ ...inputSt,marginBottom:8 }} placeholder="Texte de la question"/>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8 }}>
                      {[0,1,2,3].map(i=>(
                        <input key={i} value={evalQForm.options[i]} onChange={e=>{ const o=[...evalQForm.options]; o[i]=e.target.value; setEvalQForm(f=>({...f,options:o})); }} style={{ ...inputSt,marginBottom:0 }} placeholder={`Option ${i+1}`}/>
                      ))}
                    </div>
                    <select value={evalQForm.correct} onChange={e=>setEvalQForm(f=>({...f,correct:e.target.value}))} style={{ ...inputSt,marginBottom:8 }}>
                      <option value="">— Sélectionner la bonne réponse —</option>
                      {evalQForm.options.filter(Boolean).map((o,i)=><option key={i} value={o}>{o}</option>)}
                    </select>
                    <button onClick={()=>addEvalQuestion()} style={{ ...btnPrimary,padding:"6px 12px",fontSize:11 }}>+ Ajouter cette question</button>
                  </div>
                </div>
              )}

              {/* QUIZ */}
              {evalForm.type==="quiz"&&(
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:"#374151",marginBottom:10 }}>Questions du Quiz ({evalForm.questions.length})</div>
                  {evalForm.questions.map((q,qi)=>(
                    <div key={q.id} style={{ padding:"8px 10px",borderRadius:8,background:"#fef9ee",border:"1px solid #fde68a",marginBottom:6,fontSize:12,display:"flex",justifyContent:"space-between" }}>
                      <div><span style={{ fontWeight:700 }}>Q{qi+1}.</span> {q.texte}</div>
                      <button onClick={()=>setEvalForm(f=>({...f,questions:f.questions.filter((_,i)=>i!==qi)}))} style={{ background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:13 }}>✕</button>
                    </div>
                  ))}
                  <div style={{ background:"#fff",borderRadius:8,padding:12,border:"1px solid #e5e7eb" }}>
                    <input value={evalQForm.texte} onChange={e=>setEvalQForm(f=>({...f,texte:e.target.value}))} style={{ ...inputSt,marginBottom:8 }} placeholder="Question du quiz…"/>
                    <CloudinaryUpload
                      type="image"
                      label="Image / média (optionnel)"
                      compact
                      currentUrl={evalQForm.media || undefined}
                      onSuccess={(file) => setEvalQForm(f => ({ ...f, media: file.url }))}
                      onError={(msg) => toast.error(msg)}
                      style={{ marginBottom: 8 }}
                    />
                    {evalQForm.media && <img src={evalQForm.media} alt="média question" style={{ maxWidth:"100%", maxHeight:100, borderRadius:6, marginBottom:8 }}/>}
                    <button onClick={()=>{ if(!evalQForm.texte.trim()){toast.error("Question requise");return;} setEvalForm(f=>({...f,questions:[...f.questions,{id:Date.now(),...evalQForm}]})); setEvalQForm({texte:"",options:["","","",""],correct:"",media:""}); }} style={{ ...btnPrimary,padding:"6px 12px",fontSize:11 }}>+ Ajouter</button>
                  </div>
                </div>
              )}

              {/* SPEAKING */}
              {evalForm.type==="speaking"&&(
                <div>
                  <div style={{ padding:"8px 12px",borderRadius:8,background:"#fef2f2",border:"1px solid #fecaca",fontSize:12,color:"#991b1b",marginBottom:12 }}>
                    🎤 Les apprenants enregistreront leur réponse orale dans leur espace. Vous recevrez les audios pour notation.
                  </div>
                  <label style={labelSt}>Format de speaking</label>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10 }}>
                    {[["independant","💭","Opinion / Indépendant"],["integre_lecture","📖","Lecture + Expression"],["integre_audio","🎧","Audio + Expression"]].map(([v,ic,lb])=>(
                      <button key={v} onClick={()=>setEvalForm(f=>({...f,speakType:v}))} style={{ padding:"8px 6px",borderRadius:8,border:`2px solid ${evalForm.speakType===v?"#dc2626":"#e5e7eb"}`,background:evalForm.speakType===v?"#fef2f2":"#fff",cursor:"pointer",textAlign:"center" }}>
                        <div style={{ fontSize:16 }}>{ic}</div>
                        <div style={{ fontSize:10,fontWeight:evalForm.speakType===v?700:400,color:evalForm.speakType===v?"#dc2626":"#374151",marginTop:2 }}>{lb}</div>
                      </button>
                    ))}
                  </div>
                  <label style={labelSt}>Consigne * (ce que l'apprenant devra exprimer)</label>
                  <textarea value={evalForm.speakConsigne||""} onChange={e=>setEvalForm(f=>({...f,speakConsigne:e.target.value}))} placeholder="ex: Do you prefer working from home or in the office? Explain your choice with 2 reasons and an example." style={{ ...inputSt,minHeight:70,resize:"vertical" }}/>
                  {evalForm.speakType==="integre_audio"&&(
                    <>
                      <label style={labelSt}>🎧 URL de l'audio à écouter avant de répondre</label>
                      <input type="url" value={evalForm.speakAudioUrl||""} onChange={e=>setEvalForm(f=>({...f,speakAudioUrl:e.target.value}))} placeholder="https://example.com/prompt.mp3" style={inputSt}/>
                    </>
                  )}
                  {evalForm.speakType==="integre_lecture"&&(
                    <>
                      <label style={labelSt}>📖 Texte à lire avant de répondre</label>
                      <textarea value={evalForm.speakTextePassage||""} onChange={e=>setEvalForm(f=>({...f,speakTextePassage:e.target.value}))} placeholder="Collez le passage que l'apprenant devra lire avant de répondre…" style={{ ...inputSt,minHeight:60,resize:"vertical" }}/>
                    </>
                  )}
                  <label style={labelSt}>💡 Conseil (tip) pour l'apprenant (optionnel)</label>
                  <input type="text" value={evalForm.speakTip||""} onChange={e=>setEvalForm(f=>({...f,speakTip:e.target.value}))} placeholder="ex: Structure: State preference → 2 reasons → example → conclude" style={inputSt}/>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:4 }}>
                    <div>
                      <label style={labelSt}>Niveau</label>
                      <select value={evalForm.speakNiveau||"B2"} onChange={e=>setEvalForm(f=>({...f,speakNiveau:e.target.value}))} style={inputSt}>
                        {["A2","B1","B2","C1","C2"].map(n=><option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelSt}>⏱ Préparation (sec)</label>
                      <input type="number" min={10} max={120} value={evalForm.speakPrepTime||30} onChange={e=>setEvalForm(f=>({...f,speakPrepTime:Number(e.target.value)}))} style={inputSt}/>
                    </div>
                    <div>
                      <label style={labelSt}>🎙 Réponse max (sec)</label>
                      <input type="number" min={15} max={180} value={evalForm.speakRecordTime||60} onChange={e=>setEvalForm(f=>({...f,speakRecordTime:Number(e.target.value)}))} style={inputSt}/>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Options notifications + TOEIC */}
            <div style={{ marginTop:14,padding:12,borderRadius:8,background:"#f1f5f9",border:"1px solid #e2e8f0",display:"flex",flexWrap:"wrap",gap:16 }}>
              <label style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer" }}>
                <input type="checkbox" checked={evalForm.notifierEleves} onChange={e=>setEvalForm(f=>({...f,notifierEleves:e.target.checked}))}/>
                <span>📣 Notifier les élèves</span>
              </label>
              <label style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer" }}>
                <input type="checkbox" checked={evalForm.notifierResponsable} onChange={e=>setEvalForm(f=>({...f,notifierResponsable:e.target.checked}))}/>
                <span>👤 Notifier le responsable pédagogique</span>
              </label>
              <label style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer" }}>
                <input type="checkbox" checked={evalForm.surTOEIC} onChange={e=>setEvalForm(f=>({...f,surTOEIC:e.target.checked}))}/>
                <span>🏆 Format TOEIC</span>
              </label>
            </div>

            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <button onClick={()=>createEvaluation()} style={{ ...btnPrimary,background:evalForm.categorie==="examen"?"#7c3aed":BET }}>
                {evalForm.categorie==="examen"?"🎓 Créer l'examen":"✅ Créer l'évaluation"}
              </button>
              <button onClick={()=>setShowCreateEvalModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL NOUVEAU MODULE ══ */}
        {/* ══ MODAL NOUVEAU COURS ══ */}
        {showNewCoursModal&&(
          <Modal title="📚 Créer un nouveau cours" onClose={()=>setShowNewCoursModal(false)} wide>
            <label style={labelSt}>Titre du cours *</label>
            <input type="text" placeholder="ex: Anglais des affaires C1" value={newCoursForm.titre} onChange={e=>setNewCoursForm(f=>({...f,titre:e.target.value}))} style={inputSt}/>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={labelSt}>Niveau CECRL</label>
                <select value={newCoursForm.niveau} onChange={e=>setNewCoursForm(f=>({...f,niveau:e.target.value}))} style={inputSt}>
                  {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Volume horaire total (h)</label>
                <input type="number" min={1} max={500} value={newCoursForm.heuresTotales} onChange={e=>setNewCoursForm(f=>({...f,heuresTotales:e.target.value}))} style={inputSt}/>
              </div>
            </div>

            <label style={labelSt}>Description courte</label>
            <textarea placeholder="Décrivez le contenu et les objectifs globaux du cours…" value={newCoursForm.description} onChange={e=>setNewCoursForm(f=>({...f,description:e.target.value}))} style={{ ...inputSt, minHeight:70, resize:"vertical" }}/>

            <label style={labelSt}>Emoji / Icône du cours</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
              {EMOJIS_COURS.map(em=>(
                <button key={em} onClick={()=>setNewCoursForm(f=>({...f,emoji:em}))} style={{ width:42, height:42, borderRadius:8, border:`2px solid ${newCoursForm.emoji===em?"#0891b2":"#e5e7eb"}`, background:newCoursForm.emoji===em?"#e0f2fe":"#fff", fontSize:20, cursor:"pointer" }}>{em}</button>
              ))}
            </div>

            <label style={labelSt}>Couleur du cours</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
              {COLORS_COURS.map(col=>(
                <button key={col} onClick={()=>setNewCoursForm(f=>({...f,color:col}))} style={{ width:32, height:32, borderRadius:"50%", background:col, border:`3px solid ${newCoursForm.color===col?"#0f172a":"transparent"}`, cursor:"pointer" }}/>
              ))}
            </div>

            {/* Aperçu */}
            <div style={{ padding:"12px 16px", borderRadius:10, background:newCoursForm.color+"10", border:`1.5px solid ${newCoursForm.color}40`, display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <span style={{ fontSize:30 }}>{newCoursForm.emoji}</span>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:newCoursForm.color }}>{newCoursForm.titre||"Titre du cours"}</div>
                <div style={{ fontSize:12, color:"#6b7280" }}>Niveau {newCoursForm.niveau} · {newCoursForm.heuresTotales}h · 0 étudiant · 0 module</div>
              </div>
            </div>

            <div style={{ padding:"8px 12px", borderRadius:8, background:"#f0fdf4", border:"1px solid #bbf7d0", fontSize:12, color:"#166534", marginBottom:12 }}>
              ✅ Après création, vous serez redirigé vers <strong>Modules & Contenu</strong> pour ajouter vos premiers modules.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={createNewCours} style={btnPrimary}>🚀 Créer le cours</button>
              <button onClick={()=>setShowNewCoursModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {showNewModuleModal&&(
          <Modal title="🧩 Créer un nouveau module" onClose={()=>setShowNewModuleModal(false)} wide>
            <label style={labelSt}>Cours *</label>
            <select value={newModForm.coursId} onChange={e=>setNewModForm(f=>({...f,coursId:Number(e.target.value)}))} style={inputSt}>
              {cours.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.titre}</option>)}
            </select>
            <label style={labelSt}>Titre du module *</label>
            <input type="text" placeholder="ex: Compréhension orale avancée" value={newModForm.titre} onChange={e=>setNewModForm(f=>({...f,titre:e.target.value}))} style={inputSt}/>
            <label style={labelSt}>Objectifs pédagogiques</label>
            <textarea placeholder="Décrivez les objectifs et compétences visés…" value={newModForm.objectifs} onChange={e=>setNewModForm(f=>({...f,objectifs:e.target.value}))} style={{ ...inputSt, minHeight:80, resize:"vertical" }}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={labelSt}>Durée estimée (min)</label>
                <input type="number" min={30} max={600} value={newModForm.dureeEstimee} onChange={e=>setNewModForm(f=>({...f,dureeEstimee:Number(e.target.value)}))} style={inputSt}/>
              </div>
              <div>
                <label style={labelSt}>Type</label>
                <select value={newModForm.type||"online"} onChange={e=>setNewModForm(f=>({...f,type:e.target.value}))} style={inputSt}>
                  <option value="online">🌐 En ligne</option>
                  <option value="presentiel">🏢 Présentiel</option>
                </select>
              </div>
            </div>
            <div style={{ padding:"10px 14px", borderRadius:8, background:BET_LIGHT, border:`1px solid ${BET}30`, fontSize:12, color:BET, marginBottom:10 }}>
              💡 Après création, vous serez redirigé vers l'onglet Modules & Contenu pour ajouter les blocs de cours.
            </div>
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <button onClick={()=>createNewModule()} style={btnPrimary}>✅ Créer le module</button>
              <button onClick={()=>setShowNewModuleModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL SIGNALER PROBLÈME ══ */}
        {showSignalModal&&(
          <Modal title="⚠️ Signaler un problème au responsable" onClose={()=>setShowSignalModal(false)}>
            <label style={labelSt}>Type de problème</label>
            <select value={signalForm.type} onChange={e=>setSignalForm(f=>({...f,type:e.target.value}))} style={inputSt}>
              <option value="probleme_technique">🔧 Problème technique</option>
              <option value="absence_etudiant">👤 Absence / comportement étudiant</option>
              <option value="planning">📅 Problème de planning</option>
              <option value="materiel">🖥️ Matériel / salle</option>
              <option value="autre">📌 Autre</option>
            </select>
            <label style={labelSt}>Sujet *</label>
            <input type="text" placeholder="Résumé court du problème…" value={signalForm.sujet} onChange={e=>setSignalForm(f=>({...f,sujet:e.target.value}))} style={inputSt}/>
            <label style={labelSt}>Description *</label>
            <textarea placeholder="Décrivez le problème en détail…" value={signalForm.description} onChange={e=>setSignalForm(f=>({...f,description:e.target.value}))} style={{ ...inputSt, minHeight:100, resize:"vertical" }}/>
            <label style={labelSt}>Urgence</label>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {[["normale","🟢 Normale"],["haute","🟡 Haute"],["critique","🔴 Critique"]].map(([val,lbl])=>(
                <button key={val} onClick={()=>setSignalForm(f=>({...f,urgence:val}))} style={{
                  padding:"7px 14px", borderRadius:6, border:"1px solid", fontSize:12, cursor:"pointer", fontWeight:600,
                  background: signalForm.urgence===val?(val==="critique"?"#fee2e2":val==="haute"?"#fef3c7":"#dcfce7"):"#fff",
                  color: signalForm.urgence===val?(val==="critique"?"#991b1b":val==="haute"?"#92400e":"#166534"):"#6b7280",
                  borderColor: signalForm.urgence===val?(val==="critique"?"#fca5a5":val==="haute"?"#fcd34d":"#bbf7d0"):"#e5e7eb",
                }}>{lbl}</button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <button onClick={()=>sendSignal()} style={{ ...btnPrimary, background:"#f97316" }}>📤 Envoyer au responsable</button>
              <button onClick={()=>setShowSignalModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL AUDIO PLAYER ══ */}
        {showAudioModal&&selectedAudio&&(
          <Modal title={`🎧 ${selectedAudio.titre||"Audio"}`} onClose={()=>setShowAudioModal(false)}>
            <div style={{ padding:24, borderRadius:12, background:"linear-gradient(135deg,#059669,#34d399)", marginBottom:16, textAlign:"center", color:"#fff" }}>
              <div style={{ fontSize:52, marginBottom:8 }}>🎧</div>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{selectedAudio.titre}</div>
              {selectedAudio.dureeMin && <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>⏱ {selectedAudio.dureeMin} min</div>}
            </div>
            <div style={{ padding:"14px 16px", borderRadius:10, background:"#f8fafc", border:"1px solid #e5e7eb", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ flex:1, height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:"30%", height:"100%", background:"#059669", borderRadius:3 }}/>
                </div>
                <span style={{ fontSize:12, color:"#6b7280", minWidth:70, textAlign:"right" }}>7:12 / {selectedAudio.dureeMin||"—"} min</span>
              </div>
              <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12 }}>
                <button onClick={()=>toast.success("Retour 10s")} style={{ padding:"8px 14px", background:"#e5e7eb", border:"none", borderRadius:8, cursor:"pointer", fontSize:13 }}>⏮ 10s</button>
                <button onClick={()=>toast.success("Lecture en cours…")} style={{ width:52, height:52, borderRadius:"50%", background:"#059669", color:"#fff", border:"none", cursor:"pointer", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center" }}>▶️</button>
                <button onClick={()=>toast.success("Avance 10s")} style={{ padding:"8px 14px", background:"#e5e7eb", border:"none", borderRadius:8, cursor:"pointer", fontSize:13 }}>10s ⏭</button>
              </div>
            </div>
            {selectedAudio.url&&(
              <div style={{ padding:"8px 12px", borderRadius:6, background:"#f0fdf4", border:"1px solid #bbf7d0", fontSize:12, color:"#6b7280", marginBottom:12 }}>
                🔗 Fichier : <span style={{ color:"#059669", fontFamily:"monospace" }}>{selectedAudio.url}</span>
              </div>
            )}
            <p style={{ fontSize:12, color:"#6b7280", marginBottom:14 }}>Partagez ce contenu avec vos étudiants depuis l'onglet Modules & Contenu.</p>
            <button onClick={()=>setShowAudioModal(false)} style={btnSecondary}>Fermer</button>
          </Modal>
        )}

        {/* ══ MODAL CONFIRMATION MODULE EFFECTUÉ ══ */}
        {showConfirmModuleModal&&confirmModuleTarget&&(
          <Modal title="✓ Confirmer le module comme effectué" onClose={()=>setShowConfirmModuleModal(false)}>
            <div style={{ padding:16,borderRadius:10,background:"#fefce8",border:"1px solid #fde68a",marginBottom:16 }}>
              <div style={{ fontWeight:700,fontSize:14,color:"#92400e",marginBottom:4 }}>📋 {confirmModuleTarget.titre}</div>
              <div style={{ fontSize:12,color:"#78350f" }}>En confirmant ce module, vous attestez qu'il a bien été dispensé.</div>
            </div>
            <div style={{ fontSize:13,color:"#374151",marginBottom:14 }}>Cette action déclenchera automatiquement :</div>
            <div style={{ display:"grid",gap:8,marginBottom:18 }}>
              {[["🎓","Mise à jour de la progression de tous les apprenants inscrits à ce cours"],["📜","Avancement vers la certification des apprenants éligibles"],["🎯","Validation des objectifs liés à ce module"],["💳","Enregistrement pour le calcul de la rémunération RH (paie coach)"]].map(([ic,txt],i)=>(
                <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"8px 12px",borderRadius:8,background:"#f8fafc",border:"1px solid #e2e8f0",fontSize:12 }}>
                  <span style={{ fontSize:18,flexShrink:0 }}>{ic}</span><span>{txt}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>confirmModuleEffectue()} style={{ ...btnPrimary,background:"#16a34a" }}>✅ Confirmer — Module effectué</button>
              <button onClick={()=>setShowConfirmModuleModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL DÉTAIL APPRENANT (groupe) ══ */}
      {apprenantDetail && (() => {
        const a = apprenantDetail;
        const nomComplet = [a.prenom_apprenant, a.nom_apprenant].filter(Boolean).join(" ");
        const initiales  = [a.prenom_apprenant||"", a.nom_apprenant||""].map(s=>s[0]||"").join("").toUpperCase() || "?";
        const NIVEAU_COLOR = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };
        const nColor = NIVEAU_COLOR[a.niveau] || BET;
        let noteObj = null;
        try { noteObj = a.note ? JSON.parse(a.note) : null; } catch { noteObj = null; }
        const NIVEAUX_LBL = { A1:"Débutant",A2:"Élémentaire",B1:"Intermédiaire",B2:"Interm. Sup.",C1:"Avancé",C2:"Maîtrise" };

        // Présences filtrées pour cet apprenant
        const presApp = fichePres.length > 0 ? fichePres : presenceHistory.filter(p => p.ga_id === a.id || (p.nom_apprenant===a.nom_apprenant && p.prenom_apprenant===a.prenom_apprenant));
        const nbPresent = presApp.filter(p=>p.statut==="present").length;
        const tauxPres  = presApp.length ? Math.round(nbPresent/presApp.length*100) : null;

        return (
          <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.65)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}
            onClick={()=>setApprenantDetail(null)}>
            <div style={{ background:"#fff",borderRadius:18,width:"min(96vw,700px)",maxHeight:"93vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.3)",overflow:"hidden" }}
              onClick={e=>e.stopPropagation()}>

              {/* ── Header ── */}
              <div style={{ background:BET_GRAD,padding:"20px 24px",flexShrink:0,display:"flex",gap:14,alignItems:"center" }}>
                <div style={{ width:54,height:54,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:"#fff",flexShrink:0,border:"3px solid rgba(255,255,255,0.3)" }}>{initiales}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:600,marginBottom:2,letterSpacing:"0.07em" }}>FICHE APPRENANT — {selectedGroupe?.nom}</div>
                  <div style={{ fontSize:18,fontWeight:900,color:"#fff" }}>{nomComplet}</div>
                  <div style={{ display:"flex",gap:6,marginTop:5,flexWrap:"wrap" }}>
                    {a.niveau && <span style={{ padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:800,color:"#fff",background:nColor }}>{a.niveau} — {NIVEAUX_LBL[a.niveau]||a.niveau}</span>}
                    {noteObj?.programme && <span style={{ padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:600,background:"rgba(255,255,255,0.18)",color:"#fff" }}>{noteObj.programme}</span>}
                    <span style={{ padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:"rgba(34,197,94,0.3)",color:"#fff" }}>● Actif</span>
                  </div>
                </div>
                <button onClick={()=>setApprenantDetail(null)} style={{ background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>✕</button>
              </div>

              {/* ── Onglets ── */}
              <div style={{ display:"flex",background:"#fafafa",borderBottom:"1px solid #e5e7eb",flexShrink:0,overflowX:"auto" }}>
                {[
                  { k:"profil",    l:"Profil & Formation",  icon:"👤" },
                  { k:"test",      l:"Test de niveau",       icon:"📊" },
                  { k:"presences", l:`Présences${tauxPres!==null?` (${tauxPres}%)`:""}`, icon:"✅" },
                ].map(t=>(
                  <button key={t.k} onClick={()=>{
                    setFicheFicheTab(t.k);
                    if (t.k==="presences" && fichePres.length===0 && presenceHistory.length===0 && selectedGroupe) {
                      setFichePresLoading(true);
                      const tok = localStorage.getItem("coach_token")||localStorage.getItem("admin_token");
                      fetch(`${API_URL}/api/groupes/${selectedGroupe.id}/presences`,{headers:{Authorization:`Bearer ${tok}`}})
                        .then(r=>r.ok?r.json():null)
                        .then(d=>setFichePres((d?.presences||[]).filter(p=>p.ga_id===a.id||(p.nom_apprenant===a.nom_apprenant&&p.prenom_apprenant===a.prenom_apprenant))))
                        .catch(()=>{})
                        .finally(()=>setFichePresLoading(false));
                    }
                  }}
                    style={{ padding:"11px 18px",border:"none",borderBottom:ficheFicheTab===t.k?`3px solid ${BET}`:"3px solid transparent",fontSize:12,fontWeight:600,cursor:"pointer",background:"transparent",color:ficheFicheTab===t.k?BET:"#64748b",whiteSpace:"nowrap",flexShrink:0 }}>
                    {t.icon} {t.l}
                  </button>
                ))}
              </div>

              {/* ── Corps scrollable ── */}
              <div style={{ flex:1,overflowY:"auto",padding:"20px 24px" }}>

                {/* ═══ PROFIL ═══ */}
                {ficheFicheTab==="profil" && (
                  <div>
                    {/* Coordonnées */}
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:11,fontWeight:800,color:"#9ca3af",letterSpacing:"0.08em",marginBottom:10 }}>COORDONNÉES</div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                        {[
                          { icon:"📧", label:"Email",     value:a.email_apprenant||"—" },
                          { icon:"📞", label:"Téléphone", value:a.telephone||"—" },
                        ].map(r=>(
                          <div key={r.label} style={{ padding:"10px 12px",borderRadius:10,background:"#f8fafc",border:"1px solid #e5e7eb",display:"flex",gap:10,alignItems:"flex-start" }}>
                            <span style={{ fontSize:18,flexShrink:0 }}>{r.icon}</span>
                            <div>
                              <div style={{ fontSize:9,color:"#9ca3af",fontWeight:600 }}>{r.label}</div>
                              <div style={{ fontSize:12,fontWeight:700,color:"#0f172a",wordBreak:"break-all" }}>{r.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Formation */}
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:11,fontWeight:800,color:"#9ca3af",letterSpacing:"0.08em",marginBottom:10 }}>FORMATION</div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                        {[
                          { icon:"📊", label:"Niveau",     value:a.niveau?(a.niveau+" — "+(NIVEAUX_LBL[a.niveau]||"")):"—" },
                          { icon:"📚", label:"Programme",  value:noteObj?.programme||selectedGroupe?.filiere||"—" },
                          { icon:"👥", label:"Groupe",     value:selectedGroupe?.nom||"—" },
                          { icon:"📅", label:"Date début", value:noteObj?.date_debut?new Date(noteObj.date_debut).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):selectedGroupe?.date_debut?new Date(selectedGroupe.date_debut).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):"—" },
                          { icon:"🔄", label:"Renouvellement prévu", value:noteObj?.date_renouvellement?new Date(noteObj.date_renouvellement).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):"—" },
                          { icon:"👩‍💼", label:"Assistante Onboarding", value:a.assistante_nom||"—" },
                        ].map(r=>(
                          <div key={r.label} style={{ padding:"9px 12px",borderRadius:10,background:"#f8fafc",border:"1px solid #e5e7eb",display:"flex",gap:10,alignItems:"flex-start" }}>
                            <span style={{ fontSize:16,flexShrink:0 }}>{r.icon}</span>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontSize:9,color:"#9ca3af",fontWeight:600 }}>{r.label}</div>
                              <div style={{ fontSize:12,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    {noteObj?.description && (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11,fontWeight:800,color:"#9ca3af",letterSpacing:"0.08em",marginBottom:8 }}>PROFIL DE L'APPRENANT</div>
                        <div style={{ padding:"12px 14px",borderRadius:10,background:"#f0f9ff",border:"1px solid #bae6fd",fontSize:13,color:"#374151",lineHeight:1.7 }}>{noteObj.description}</div>
                      </div>
                    )}

                    {/* Attentes */}
                    {noteObj?.attentes && (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11,fontWeight:800,color:"#9ca3af",letterSpacing:"0.08em",marginBottom:8 }}>ATTENTES / OBJECTIFS</div>
                        <div style={{ padding:"12px 14px",borderRadius:10,background:"#fef9ee",border:"1px solid #fde68a",fontSize:13,color:"#374151",lineHeight:1.7 }}>🎯 {noteObj.attentes}</div>
                      </div>
                    )}

                    {/* Note libre */}
                    {a.note && !noteObj && (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11,fontWeight:800,color:"#9ca3af",letterSpacing:"0.08em",marginBottom:8 }}>NOTES</div>
                        <div style={{ padding:"12px 14px",borderRadius:10,background:"#f8fafc",border:"1px solid #e5e7eb",fontSize:13,color:"#374151",lineHeight:1.7 }}>{a.note}</div>
                      </div>
                    )}

                    {/* Assistante commerciale */}
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:11,fontWeight:800,color:"#9ca3af",letterSpacing:"0.08em",marginBottom:10 }}>SUIVI COMMERCIAL</div>
                      {a.assistante_commerciale ? (() => {
                        const ac = a.assistante_commerciale;
                        return (
                          <div style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,background:"linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)",border:"1.5px solid #86efac" }}>
                            <div style={{ width:48,height:48,borderRadius:"50%",background:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:"#fff",flexShrink:0,overflow:"hidden" }}>
                              {ac.photo_url
                                ? <img src={ac.photo_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>{e.currentTarget.style.display="none";}} />
                                : ((ac.prenom||"?")[0]+(ac.nom||"")[0]||"?").toUpperCase()
                              }
                            </div>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontSize:9,fontWeight:700,color:"#16a34a",letterSpacing:"0.06em",marginBottom:2 }}>ASSISTANTE COMMERCIALE</div>
                              <div style={{ fontSize:14,fontWeight:800,color:"#0f172a" }}>{ac.prenom} {ac.nom}</div>
                              {ac.telephone && (
                                <div style={{ fontSize:12,color:"#374151",marginTop:2,display:"flex",alignItems:"center",gap:4 }}>
                                  <span>📞</span>
                                  <a href={`tel:${ac.telephone}`} style={{ color:"#0891b2",fontWeight:600,textDecoration:"none" }}>{ac.telephone}</a>
                                </div>
                              )}
                            </div>
                            <div style={{ flexShrink:0,fontSize:22 }}>🤝</div>
                          </div>
                        );
                      })() : (
                        <div style={{ padding:"12px 14px",borderRadius:10,background:"#f8fafc",border:"1px solid #e5e7eb",fontSize:12,color:"#9ca3af",fontStyle:"italic" }}>
                          Aucune assistante commerciale trouvée pour cet apprenant.
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display:"flex",gap:10,justifyContent:"space-between",alignItems:"center",marginTop:20,paddingTop:16,borderTop:"1px solid #e5e7eb",flexWrap:"wrap" }}>
                      <button onClick={()=>{ signalerAbsence(a); setApprenantDetail(null); }}
                        style={{ padding:"9px 16px",background:"#fff7ed",color:"#92400e",border:"1px solid #fed7aa",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12 }}>
                        🚨 Signaler absence répétée
                      </button>
                      <div style={{ display:"flex",gap:8 }}>
                        <button onClick={()=>{
                            setTransfertCoachForm({ nouveau_groupe_id:"", motif:"", jours:[], creneau:"" });
                            setTransfertCoachGroupes([]);
                            if (a.niveau) searchGroupesPourTransfert(a.niveau);
                            setShowTransfertCoach(true);
                          }}
                          style={{ padding:"9px 16px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12 }}>
                          🔄 Demander un transfert
                        </button>
                        <button onClick={()=>setApprenantDetail(null)}
                          style={{ padding:"9px 20px",background:BET,color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12 }}>
                          Fermer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ TEST DE NIVEAU ═══ */}
                {ficheFicheTab==="test" && (
                  <div>
                    {ficheTestLoading && <p style={{ textAlign:"center",color:"#9ca3af",padding:40 }}>Chargement…</p>}
                    {!ficheTestLoading && !ficheTest && (
                      <div style={{ textAlign:"center",padding:"50px 20px",background:"#f8fafc",borderRadius:14,border:"1px solid #e5e7eb" }}>
                        <div style={{ fontSize:44,marginBottom:10 }}>📊</div>
                        <div style={{ fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:4 }}>Aucun test de niveau enregistré</div>
                        <p style={{ color:"#9ca3af",fontSize:13 }}>Le test de placement n'a pas été passé ou n'est pas lié à cet email.</p>
                      </div>
                    )}
                    {!ficheTestLoading && ficheTest && (() => {
                      const CLR = { A1:"#6b7280",A2:"#0891b2",B1:"#16a34a",B2:"#7c3aed",C1:"#d97706",C2:"#dc2626" };
                      const lvlC = CLR[ficheTest.level] || BET;
                      return (
                        <div style={{ display:"grid",gap:14 }}>
                          {/* Score */}
                          <div style={{ background:BET_GRAD,borderRadius:14,padding:"22px 26px",color:"#fff",display:"flex",gap:22,alignItems:"center",flexWrap:"wrap" }}>
                            <div style={{ textAlign:"center",flexShrink:0 }}>
                              <div style={{ fontSize:52,fontWeight:900,lineHeight:1 }}>{ficheTest.level||"—"}</div>
                              <div style={{ fontSize:12,color:"#7dd3fc",marginTop:4 }}>{NIVEAUX_LBL[ficheTest.level]||"CECRL"}</div>
                            </div>
                            <div style={{ flex:1,minWidth:140 }}>
                              <div style={{ fontSize:26,fontWeight:800 }}>{ficheTest.score??ficheTest.points_earned??0} pts</div>
                              {ficheTest.points_total && <div style={{ fontSize:12,color:"#7dd3fc" }}>sur {ficheTest.points_total} — {ficheTest.correct_answers||0}/{ficheTest.total_questions||0} bonnes réponses</div>}
                              {ficheTest.submitted_at && <div style={{ fontSize:11,color:"#7dd3fc",marginTop:5 }}>📅 Passé le {new Date(ficheTest.submitted_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</div>}
                            </div>
                          </div>

                          {/* Par catégorie */}
                          {ficheTest.by_category && Object.keys(ficheTest.by_category).length>0 && (
                            <div style={{ background:"#f8fafc",borderRadius:12,padding:16,border:"1px solid #e5e7eb" }}>
                              <div style={{ fontSize:11,fontWeight:800,color:BET,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12 }}>Résultats par catégorie</div>
                              <div style={{ display:"grid",gap:10 }}>
                                {Object.entries(ficheTest.by_category).map(([cat,val])=>{
                                  const total = val.total||val.max||10;
                                  const score = val.score??val.correct??0;
                                  const pct = Math.round((score/total)*100);
                                  return (
                                    <div key={cat}>
                                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3 }}>
                                        <span style={{ fontWeight:600,color:"#374151" }}>{cat}</span>
                                        <span style={{ color:pct>=70?lvlC:"#dc2626",fontWeight:700 }}>{score}/{total} ({pct}%)</span>
                                      </div>
                                      <div style={{ height:6,background:"#e5e7eb",borderRadius:99,overflow:"hidden" }}>
                                        <div style={{ height:"100%",width:`${pct}%`,background:pct>=70?lvlC:"#f87171",borderRadius:99 }}/>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Notes oral */}
                          {ficheTest.notes_oral && (
                            <div style={{ background:"#f8fafc",borderRadius:12,padding:14,border:"1px solid #e5e7eb" }}>
                              <div style={{ fontSize:11,fontWeight:800,color:BET,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8 }}>Notes de l'oral</div>
                              <p style={{ color:"#374151",fontSize:13,lineHeight:1.6,margin:0 }}>{ficheTest.notes_oral}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ═══ PRÉSENCES ═══ */}
                {ficheFicheTab==="presences" && (
                  <div>
                    {fichePresLoading && <p style={{ textAlign:"center",color:"#9ca3af",padding:40 }}>Chargement…</p>}
                    {!fichePresLoading && presApp.length===0 && (
                      <div style={{ textAlign:"center",padding:"50px 20px",background:"#f8fafc",borderRadius:14,border:"1px solid #e5e7eb" }}>
                        <div style={{ fontSize:44,marginBottom:10 }}>✅</div>
                        <div style={{ fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:4 }}>Aucune présence enregistrée</div>
                        <p style={{ color:"#9ca3af",fontSize:13 }}>Les séances apparaîtront ici au fil des cours.</p>
                      </div>
                    )}
                    {!fichePresLoading && presApp.length>0 && (() => {
                      const absents = presApp.filter(p=>p.statut==="absent").length;
                      const retards = presApp.filter(p=>p.statut==="retard").length;
                      const taux    = Math.round(nbPresent/presApp.length*100);
                      return (
                        <div style={{ display:"grid",gap:14 }}>
                          {/* KPIs */}
                          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
                            {[
                              { l:"Séances", v:presApp.length,  c:"#0f172a" },
                              { l:"Présent", v:nbPresent,       c:"#059669" },
                              { l:"Absent",  v:absents,         c:"#dc2626" },
                              { l:"Retard",  v:retards,         c:"#d97706" },
                            ].map(s=>(
                              <div key={s.l} style={{ background:"#f8fafc",borderRadius:10,padding:"12px 8px",border:"1px solid #e5e7eb",textAlign:"center" }}>
                                <div style={{ fontSize:22,fontWeight:900,color:s.c }}>{s.v}</div>
                                <div style={{ fontSize:10,color:"#9ca3af",marginTop:2 }}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                          {/* Barre globale */}
                          <div style={{ background:"#f8fafc",borderRadius:10,padding:"12px 16px",border:"1px solid #e5e7eb" }}>
                            <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6 }}>
                              <span style={{ fontWeight:700,color:"#374151" }}>Taux de présence global</span>
                              <span style={{ fontWeight:800,color:taux>=80?"#059669":taux>=60?"#d97706":"#dc2626" }}>{taux}%</span>
                            </div>
                            <div style={{ height:8,background:"#e5e7eb",borderRadius:99,overflow:"hidden" }}>
                              <div style={{ height:"100%",width:`${taux}%`,background:taux>=80?"#059669":taux>=60?"#d97706":"#dc2626",borderRadius:99 }}/>
                            </div>
                          </div>
                          {/* Liste séances */}
                          <div style={{ borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden" }}>
                            {[...presApp].sort((a,b)=>(b.date_seance||"").localeCompare(a.date_seance||"")).map((p,i)=>{
                              const cfg = {
                                present:  { bg:"#d1fae5",c:"#065f46",icon:"✅",l:"Présent" },
                                absent:   { bg:"#fee2e2",c:"#991b1b",icon:"❌",l:"Absent" },
                                retard:   { bg:"#fef3c7",c:"#92400e",icon:"⏰",l:"Retard" },
                              };
                              const s = cfg[p.statut] || cfg.present;
                              return (
                                <div key={p.id||i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:i%2===0?"#fff":"#fafafa",borderBottom:"1px solid #f1f5f9" }}>
                                  <span style={{ fontSize:13,fontWeight:600,color:"#0f172a" }}>📅 {p.date_seance?new Date(p.date_seance).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short",year:"numeric"}):"—"}</span>
                                  <span style={{ padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:s.bg,color:s.c }}>{s.icon} {s.l}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL TRANSFERT (coach) ══ */}
      {showTransfertCoach && apprenantDetail && (() => {
        const a = apprenantDetail;
        return (
          <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.8)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}
            onClick={()=>setShowTransfertCoach(false)}>
            <div style={{ background:"#fff",borderRadius:18,width:"min(97vw,660px)",maxHeight:"93vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}
              onClick={e=>e.stopPropagation()}>

              {/* Header */}
              <div style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)",borderRadius:"18px 18px 0 0",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ color:"#c4b5fd",fontSize:11,fontWeight:700,marginBottom:3 }}>DEMANDE DE TRANSFERT — SIGNALEMENT COACH</div>
                  <div style={{ color:"#fff",fontSize:16,fontWeight:800 }}>🔄 {a.prenom_apprenant} {a.nom_apprenant}</div>
                  <div style={{ color:"#c4b5fd",fontSize:12,marginTop:2 }}>Groupe actuel : {selectedGroupe?.nom||"—"} · Niveau {a.niveau||"—"}</div>
                </div>
                <button onClick={()=>setShowTransfertCoach(false)} style={{ background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:20,width:36,height:36,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
              </div>

              <div style={{ flex:1,overflowY:"auto",padding:"24px" }}>

                {/* Info notification */}
                <div style={{ padding:"12px 14px",borderRadius:10,background:"#fef3c7",border:"1px solid #fde68a",fontSize:12,color:"#92400e",marginBottom:18 }}>
                  ℹ️ En tant que coach, votre signalement déclenchera automatiquement une notification à l'assistante commerciale de {a.prenom_apprenant||""} pour une mise à jour de ses données.
                </div>

                {/* Nouveaux créneaux */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:8 }}>Nouveaux créneaux souhaités par l'apprenant</label>
                  {/* Jours */}
                  <div style={{ fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:6 }}>Jours</div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                    {["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"].map(j=>{
                      const sel = transfertCoachForm.jours.includes(j);
                      return (
                        <button key={j} type="button"
                          onClick={()=>setTransfertCoachForm(f=>({ ...f, jours: sel ? f.jours.filter(x=>x!==j) : [...f.jours, j] }))}
                          style={{ padding:"6px 13px",borderRadius:20,border:`1.5px solid ${sel?"#7c3aed":"#e5e7eb"}`,
                            background:sel?"#7c3aed":"#fff",color:sel?"#fff":"#374151",
                            fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s" }}>
                          {j}
                        </button>
                      );
                    })}
                  </div>
                  {/* Créneaux horaires */}
                  <div style={{ fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:6 }}>Créneau horaire</div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {[
                      { v:"Matin (7h–12h)",       icon:"🌅" },
                      { v:"Après-midi (12h–17h)", icon:"☀️" },
                      { v:"Soir (17h–21h)",       icon:"🌆" },
                      { v:"Week-end matin",        icon:"🏖️" },
                      { v:"Week-end après-midi",   icon:"🏖️" },
                    ].map(opt=>{
                      const sel = transfertCoachForm.creneau===opt.v;
                      return (
                        <button key={opt.v} type="button"
                          onClick={()=>setTransfertCoachForm(f=>({ ...f, creneau: sel ? "" : opt.v }))}
                          style={{ padding:"6px 13px",borderRadius:20,border:`1.5px solid ${sel?"#7c3aed":"#e5e7eb"}`,
                            background:sel?"#7c3aed":"#fff",color:sel?"#fff":"#374151",
                            fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s" }}>
                          {opt.icon} {opt.v}
                        </button>
                      );
                    })}
                  </div>
                  {/* Récap */}
                  {(transfertCoachForm.jours.length>0||transfertCoachForm.creneau) && (
                    <div style={{ marginTop:10,padding:"8px 12px",borderRadius:8,background:"#ede9fe",border:"1px solid #c4b5fd",fontSize:12,color:"#7c3aed",fontWeight:600 }}>
                      📌 {[transfertCoachForm.jours.join(", "),transfertCoachForm.creneau].filter(Boolean).join(" — ")}
                    </div>
                  )}
                </div>

                {/* Motif */}
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6 }}>Contexte / motif</label>
                  <textarea
                    value={transfertCoachForm.motif}
                    onChange={e=>setTransfertCoachForm(f=>({...f,motif:e.target.value}))}
                    rows={2}
                    placeholder="Ex: L'apprenant a changé d'horaires de travail et ne peut plus assister aux séances du lundi…"
                    style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:13,resize:"vertical",boxSizing:"border-box" }}
                  />
                </div>

                {/* Groupes compatibles */}
                <div>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                    <label style={{ fontSize:12,fontWeight:700,color:"#374151" }}>Groupes compatibles — Niveau {a.niveau||"—"}</label>
                    <button onClick={()=>searchGroupesPourTransfert(a.niveau)}
                      style={{ padding:"5px 12px",background:"#ede9fe",color:"#7c3aed",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:11 }}>
                      🔄 Actualiser
                    </button>
                  </div>
                  {transfertCoachLoading && <p style={{ textAlign:"center",color:"#9ca3af",padding:20 }}>Recherche…</p>}
                  {!transfertCoachLoading && transfertCoachGroupes.length===0 && (
                    <div style={{ textAlign:"center",padding:20,background:"#f8fafc",borderRadius:10,border:"1px solid #e5e7eb",color:"#9ca3af",fontSize:13 }}>
                      Aucun groupe actif de niveau {a.niveau||"—"} trouvé.
                    </div>
                  )}
                  {!transfertCoachLoading && transfertCoachGroupes.length>0 && (
                    <div style={{ display:"grid",gap:8 }}>
                      {transfertCoachGroupes.map(g=>{
                        const sel = transfertCoachForm.nouveau_groupe_id===g.id;
                        const TYPE_ICO = { en_ligne:"💻",domicile:"🏠",centre:"🏢" };
                        return (
                          <div key={g.id} onClick={()=>setTransfertCoachForm(f=>({...f,nouveau_groupe_id:g.id}))}
                            style={{ padding:"12px 14px",borderRadius:10,border:`2px solid ${sel?"#7c3aed":"#e5e7eb"}`,
                              background:sel?"#faf5ff":"#fff",cursor:"pointer",display:"flex",gap:12,alignItems:"center" }}>
                            <div style={{ width:34,height:34,borderRadius:"50%",background:sel?"#7c3aed":"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>
                              {sel?"✅":"👥"}
                            </div>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontWeight:700,fontSize:13,color:sel?"#7c3aed":"#0f172a" }}>{g.nom}</div>
                              <div style={{ fontSize:11,color:"#6b7280",marginTop:2 }}>
                                {TYPE_ICO[g.type_cours]||"🏢"} {g.type_cours==="en_ligne"?"En ligne":g.type_cours==="domicile"?"Domicile":"Centre"}
                                {g.filiere ? ` · ${g.filiere}` : ""}
                                {g.coach_nom||g.nom_coach ? ` · 👨‍🏫 ${g.coach_nom||g.nom_coach}` : ""}
                              </div>
                            </div>
                            <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:g.statut==="actif"?"#dcfce7":"#f1f5f9",color:g.statut==="actif"?"#166534":"#6b7280" }}>
                              {g.nb_apprenants||0} appr.
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding:"16px 24px",borderTop:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10 }}>
                <button onClick={()=>setShowTransfertCoach(false)}
                  style={{ padding:"10px 20px",background:"#f1f5f9",color:"#374151",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13 }}>
                  Annuler
                </button>
                <button onClick={()=>executerTransfertCoach(a)} disabled={!transfertCoachForm.nouveau_groupe_id||transfertCoachSaving}
                  style={{ padding:"10px 24px",background:transfertCoachForm.nouveau_groupe_id?"linear-gradient(135deg,#7c3aed,#6d28d9)":"#e5e7eb",
                    color:transfertCoachForm.nouveau_groupe_id?"#fff":"#9ca3af",border:"none",borderRadius:9,
                    cursor:transfertCoachForm.nouveau_groupe_id?"pointer":"default",fontWeight:700,fontSize:13,opacity:transfertCoachSaving?0.7:1 }}>
                  {transfertCoachSaving ? "⏳ Envoi en cours…" : "✅ Envoyer la demande de transfert"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

        {/* ══ MODAL MESSAGE ══ */}
      {showMsgModal&&selectedMsg&&(
  <Modal title={selectedMsg.objet} onClose={()=>setShowMsgModal(false)}>
    <div style={{ display:"flex", gap:12, paddingBottom:14, borderBottom:"1px solid #e5e7eb", marginBottom:14 }}>
      <div style={{ width:44, height:44, borderRadius:"50%", background:BET_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:BET }}>
        {selectedMsg.sens === "envoye" ? "✉️" : selectedMsg.avatar}
      </div>
      <div>
        <div style={{ fontWeight:700, fontSize:14 }}>{selectedMsg.de}{selectedMsg.sens === "envoye" && " (moi)"}</div>
        <div style={{ fontSize:12, color:"#9ca3af" }}>📅 {fmtDate(selectedMsg.date)}</div>
      </div>
    </div>
    <p style={{ fontSize:14, color:"#374151", lineHeight:1.7 }}>{selectedMsg.msg}</p>
    <div style={{ display:"flex", gap:10, marginTop:16 }}>
      {selectedMsg.sens !== "envoye" && (
        <button onClick={() => { setActiveConvMsg(selectedMsg); setShowMsgModal(false); }} style={btnPrimary}>↩️ Répondre</button>
      )}
      <button onClick={()=>setShowMsgModal(false)} style={btnSecondary}>Fermer</button>
    </div>
  </Modal>
)}
      </div>
    </div>
  );
}

/* ═══ STYLES ═══ */
const sidebarStyle    = { width:200, minWidth:200, background:"#0f172a", color:"#fff", padding:20, minHeight:"100vh" };
const sidebarItemStyle= { padding:11, marginBottom:7, borderRadius:8, cursor:"pointer", fontSize:12, color:"#fff" };
const card            = { background:"#fff", padding:24, boxShadow:"0 2px 8px rgba(0,0,0,0.05)" };
const tableStyle      = { width:"100%", borderCollapse:"collapse" };
const th              = { padding:"10px 12px", textAlign:"left", fontSize:12, color:"#6b7280", background:"#f9fafb", fontWeight:600 };
const td              = { padding:"10px 12px", fontSize:13, verticalAlign:"middle" };
const tabHeader       = { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 };
const tabTitle        = { margin:0, fontSize:17, fontWeight:700, color:"#0f172a" };
const tabSubtitle     = { margin:"3px 0 0", fontSize:12, color:"#9ca3af" };
const blockTitle      = { fontSize:14, fontWeight:700, color:"#0f172a" };
const btnPrimary      = { padding:"9px 16px", background:BET, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnSecondary    = { padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnGhost        = { padding:"5px 10px", background:"none", color:BET, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnIconEdit     = { padding:"5px 10px", background:"#e0f2fe", color:BET, border:`1px solid ${BET}40`, borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600 };
const btnIconToggle   = { padding:"4px 8px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:6, cursor:"pointer", fontSize:13 };
const btnIconDelete   = { padding:"4px 8px", background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:6, cursor:"pointer", fontSize:13 };
const modalOverlay    = { position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 };
const modalBox        = { background:"#fff", padding:24, borderRadius:14, maxWidth:"92vw" };
const inputSt         = { padding:9, marginBottom:10, width:"100%", borderRadius:6, border:"1px solid #d1d5db", boxSizing:"border-box", fontSize:13 };
const labelSt         = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 };