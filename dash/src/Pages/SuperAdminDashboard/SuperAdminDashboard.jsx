// src/Pages/SuperAdminDashboard/SuperAdminDashboard.jsx
// Route : <Route path="/superadmin-dashboard" element={<SuperAdminDashboard />} />

import React, { useState, useMemo, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { AvatarUpload } from "../../Components/CloudinaryUpload";
import MessagerieTab from "../../Components/MessagerieTab";
import NotificationBell from "../../Components/NotificationBell";
import { supabase } from "../../config/supabase";
import "./temoignages.css";

const API_URL      = process.env.REACT_APP_API_URL      || "http://localhost:5001";
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000";
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` });

/* ═══════════════════════════════════════════════════════
   CONSTANTES (chartre BET)
═══════════════════════════════════════════════════════ */
const BET_COLOR    = "#0891b2";
const BET_DARK     = "#0e7490";
const BET_LIGHT    = "#e0f2fe";
const BET_GRADIENT = "linear-gradient(135deg, #0f172a 0%, #0891b2 100%)";
const BET_RED      = "#dc2626";

/* ═══════════════════════════════════════════════════════
   COACH PHOTO CARD — composant stable (hors render principal)
═══════════════════════════════════════════════════════ */
const CoachPhotoCard = ({ coach, photoUrl, statut, hasChanges, uploading, saving, onFile, onRemove, onToggleStatut, onUrlChange, onSave }) => {
  const [hov, setHov] = React.useState(false);
  const inputId = `coach-upload-${coach.id}`;
  return (
    <div style={{ background:"#fff", borderRadius:14, padding:16, border:`2px solid ${hasChanges?"#f59e0b":statut==="actif"?"#e0f2fe":"#fee2e2"}`, boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>

      {/* Avatar + infos */}
      <div style={{ display:"flex", gap:14, alignItems:"flex-start", marginBottom:14 }}>
        <label
          htmlFor={inputId}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{ position:"relative", width:80, height:80, borderRadius:12, overflow:"hidden", background:"#f1f5f9", flexShrink:0, border:"2px solid #e5e7eb", cursor:"pointer", display:"block" }}
          title="Cliquer pour changer la photo"
        >
          {photoUrl
            ? <img src={photoUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.currentTarget.style.display="none"; }} />
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, color:"#cbd5e1" }}>👤</div>
          }
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", opacity:(hov||uploading)?1:0, transition:"opacity .2s" }}>
            <span style={{ fontSize:22 }}>{uploading ? "⏳" : "📷"}</span>
          </div>
          <input id={inputId} type="file" accept="image/*" style={{ display:"none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
          />
        </label>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#0f172a", marginBottom:2 }}>{coach.prenom || ""} {coach.nom || ""}</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:8 }}>{coach.grade || "—"}</div>
          <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:statut==="actif"?"#dcfce7":"#fee2e2", color:statut==="actif"?"#166534":"#991b1b" }}>
            {statut === "actif" ? "✅ Actif" : "❌ Inactif"}
          </span>
        </div>
      </div>

      {/* Boutons upload / retirer */}
      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <label htmlFor={inputId} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0", background:"#e0f2fe", color:"#0891b2", border:"1px solid #bae6fd", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
          {uploading ? "⏳ Upload…" : "📷 Ajouter / changer la photo"}
        </label>
        {photoUrl && (
          <button onClick={onRemove} style={{ padding:"8px 12px", background:"#fee2e2", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }} title="Retirer la photo">
            🗑️ Retirer
          </button>
        )}
      </div>

      {/* URL manuelle */}
      <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Ou coller une URL</label>
      <input
        value={photoUrl}
        onChange={e => onUrlChange(e.target.value)}
        placeholder="https://… ou /team1.jpeg"
        style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:12, boxSizing:"border-box", marginBottom:10 }}
      />

      {/* Visibilité sur le site */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>Afficher sur le site</span>
        <button onClick={onToggleStatut} style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:statut==="actif"?"#dcfce7":"#f1f5f9", color:statut==="actif"?"#166534":"#64748b" }}>
          {statut === "actif" ? "✅ Visible" : "🔇 Masqué"}
        </button>
      </div>

      {/* Enregistrer */}
      <button
        onClick={onSave}
        disabled={!hasChanges || saving}
        style={{ width:"100%", padding:"9px 0", background:hasChanges?"#0891b2":"#e5e7eb", color:hasChanges?"#fff":"#9ca3af", border:"none", borderRadius:8, cursor:hasChanges?"pointer":"default", fontWeight:700, fontSize:13, transition:"background .2s", opacity:saving?0.7:1 }}
      >
        {saving ? "⏳ Sauvegarde…" : hasChanges ? "💾 Enregistrer les modifications" : "Aucune modification"}
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   NEW COACH FORM — composant stable (hors render principal)
═══════════════════════════════════════════════════════ */
const NewCoachForm = ({ form, onFormChange, onPhotoFile, photoUploading, onSubmit, saving }) => {
  const [open, setOpen]     = React.useState(false);
  const [hov, setHov]       = React.useState(false);
  const previewUrl = form.photo_url;

  return (
    <div style={{ background:"#f8fafc", border:"2px dashed #bae6fd", borderRadius:14, padding:20, marginBottom:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>➕</span>
          <span style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>Ajouter un coach</span>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ padding:"6px 14px", background:open?"#e5e7eb":"#0891b2", color:open?"#374151":"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
          {open ? "Annuler" : "+ Ajouter"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop:18, display:"flex", gap:16, flexWrap:"wrap" }}>
          {/* Avatar upload */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <label htmlFor="new-coach-upload"
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{ position:"relative", width:100, height:100, borderRadius:14, overflow:"hidden", background:"#e0f2fe", border:"2px solid #7dd3fc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
              title="Cliquer pour choisir une photo"
            >
              {previewUrl
                ? <img src={previewUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:36, color:"#7dd3fc" }}>👤</span>
              }
              <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", opacity:(hov||photoUploading)?1:0, transition:"opacity .2s" }}>
                <span style={{ fontSize:24 }}>{photoUploading ? "⏳" : "📷"}</span>
              </div>
              <input id="new-coach-upload" type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) onPhotoFile(f); e.target.value = ""; }}
              />
            </label>
            <label htmlFor="new-coach-upload" style={{ fontSize:11, fontWeight:700, color:"#0891b2", cursor:"pointer" }}>
              {photoUploading ? "⏳ Upload…" : "📷 Choisir une photo"}
            </label>
          </div>

          {/* Champs */}
          <div style={{ flex:1, minWidth:200, display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:3 }}>Nom (optionnel)</label>
              <input value={form.nom} onChange={e => onFormChange("nom", e.target.value)}
                placeholder="Ex : Aminata Koné" style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:3 }}>Titre (optionnel)</label>
              <input value={form.titre} onChange={e => onFormChange("titre", e.target.value)}
                placeholder="Ex : Coach TOEIC Certifié" style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }} />
            </div>
            <button onClick={onSubmit} disabled={saving || !form.photo_url}
              style={{ padding:"9px 0", background:form.photo_url?"#0891b2":"#e5e7eb", color:form.photo_url?"#fff":"#9ca3af", border:"none", borderRadius:8, cursor:form.photo_url?"pointer":"default", fontWeight:700, fontSize:13, opacity:saving?0.7:1 }}>
              {saving ? "⏳ Ajout en cours…" : form.photo_url ? "✅ Ajouter cette photo" : "⬆️ Uploadez d'abord une photo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES (identiques à AdminDashboard)
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
    super_admin:    { label:"Super Admin",    color:BET_RED,    bg:"#fee2e2", emoji:"👑" },
    admin:          { label:"Administrateur", color:BET_COLOR,  bg:"#e0f2fe", emoji:"🔧" },
    responsable:    { label:"Responsable",    color:"#8b5cf6",  bg:"#ede9fe", emoji:"📋" },
    manager:        { label:"Manager",        color:"#10b981",  bg:"#d1fae5", emoji:"👥" },
    commercial:     { label:"Commercial",     color:"#f59e0b",  bg:"#fef3c7", emoji:"📈" },
    gestionnaire:   { label:"Gestionnaire",   color:"#059669",  bg:"#dcfce7", emoji:"🗂️" },
    coach:          { label:"Coach",          color:"#6366f1",  bg:"#ede9fe", emoji:"🎓" },
    data_collector: { label:"Data Collector", color:"#64748b",  bg:"#f1f5f9", emoji:"📊" },
  };
  const r = roles[role] || { label: role || "Inconnu", color:"#64748b", bg:"#f1f5f9", emoji:"👤" };
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
   DONNÉES MOCK SUPER ADMIN (globales)
═══════════════════════════════════════════════════════ */
// Données de la plateforme
const PLATEFORME_STATS = {
  totalAdmins: 12,
  totalApprenants: 1870,
  totalEntreprises: 45,
  totalCertificationsDelivrees: 312,
  chiffreAffairesAnnuel: 18750000,
  tauxCroissance: 23.5,
};

/* ══════════════════════════════════════════════════════
   SYSTÈME DE PROFILS BET
   Chaque profil = Département × Périmètre × Permissions
══════════════════════════════════════════════════════ */

// Les 6 types de profils administratifs BET
const PROFIL_TYPES = {
  super_admin: {
    id:"super_admin", label:"Super Admin", emoji:"👑", color:BET_RED,
    description:"Accès total à toute la plateforme. Un seul par organisation.",
    modules:["dashboard","users","roles","cours","examens","finances","support","audit","plateforme","coachs","apprenants","rh","commercial"],
    permsDefaut:{ create:true, read:true, update:true, delete:true, manage:true },
    unique:true,
  },
  admin_pedagogique: {
    id:"admin_pedagogique", label:"Admin Pédagogique", emoji:"📚", color:"#8b5cf6",
    description:"Gère les cours, coachs, apprenants, évaluations et ressources pédagogiques.",
    modules:["dashboard","cours","examens","coachs","apprenants"],
    permsDefaut:{ create:true, read:true, update:true, delete:false, manage:false },
  },
  admin_financier: {
    id:"admin_financier", label:"Admin Financier", emoji:"💰", color:"#059669",
    description:"Gère la facturation, les paiements, le chiffre d'affaires et les rapports financiers.",
    modules:["dashboard","finances","paiements","ca"],
    permsDefaut:{ create:true, read:true, update:true, delete:false, manage:false },
  },
  admin_rh: {
    id:"admin_rh", label:"Admin RH", emoji:"👤", color:"#d97706",
    description:"Gère les coachs : contrats, absences, paie, absences et remplacements.",
    modules:["dashboard","coachs","rh","absences"],
    permsDefaut:{ create:true, read:true, update:true, delete:false, manage:true },
  },
  admin_commercial: {
    id:"admin_commercial", label:"Admin Commercial", emoji:"📈", color:"#0891b2",
    description:"Gère les entreprises clientes, les prospects, les offres et le CRM.",
    modules:["dashboard","clients","offres","commercial"],
    permsDefaut:{ create:true, read:true, update:true, delete:false, manage:false },
  },
  responsable_centre: {
    id:"responsable_centre", label:"Responsable de Centre", emoji:"🏢", color:"#6366f1",
    description:"Supervise toutes les opérations d'un centre spécifique (pédagogie + planning + présences).",
    modules:["dashboard","cours","examens","coachs","apprenants","planning","presences"],
    permsDefaut:{ create:true, read:true, update:true, delete:false, manage:true },
  },
  observateur: {
    id:"observateur", label:"Observateur", emoji:"👁️", color:"#64748b",
    description:"Accès en lecture seule. Peut consulter mais pas modifier.",
    modules:["dashboard","cours","apprenants"],
    permsDefaut:{ create:false, read:true, update:false, delete:false, manage:false },
  },
};

// Centres BET
const CENTRES_BET = [
  { id:"angre",      label:"BET Angré — Abidjan" },
  { id:"2plateaux",  label:"BET II Plateaux — Abidjan" },
  { id:"yopougon",   label:"BET Yopougon — Abidjan" },
  { id:"koumassi",   label:"BET Koumassi — Abidjan" },
  { id:"abatta",     label:"BET Abatta — Abidjan" },
  { id:"bouake",     label:"BET Bouaké — Bouaké" },
];

// Rôles qui nécessitent un centre (sauf super_admin et data_collector)
const ROLES_AVEC_CENTRE = ["admin","manager","responsable","commercial","gestionnaire","coach"];

// Liste de tous les utilisateurs/profils
// Utilisateurs chargés depuis l'API (plus de mock)

// Logs globaux (audit super admin)
const GLOBAL_AUDIT = [
  { id:1, acteur:"Kouamé Aya", role:"super_admin", action:"ADMIN_CREE", detail:"Nouvel admin : Ibrahima Diallo", date:"2025-12-10 08:15", ip:"192.168.1.1", statut:"success" },
  { id:2, acteur:"Diallo Ibrahima", role:"admin", action:"PERMISSIONS_MODIFIEES", detail:"Rôle 'manager' modifié", date:"2025-12-09 14:22", ip:"192.168.1.23", statut:"warning" },
  { id:3, acteur:"Système", role:"system", action:"MAINTENANCE", detail:"Mise à jour de la base de données", date:"2025-12-08 03:00", ip:"internal", statut:"success" },
  { id:4, acteur:"Kouamé Aya", role:"super_admin", action:"CONFIGURATION_CHANGEE", detail:"Paramètres de sécurité renforcés", date:"2025-12-07 09:30", ip:"192.168.1.1", statut:"success" },
  { id:5, acteur:"Inconnu", role:"?", action:"TENTATIVE_ACCES", detail:"Tentative d'accès non autorisée", date:"2025-12-06 22:15", ip:"203.0.113.5", statut:"danger" },
];

// Rôles disponibles (étendus)
const ROLES_DEF = {
  super_admin:    { id:"super_admin",    label:"Super Admin",    emoji:"👑", color:BET_RED,   border:"#fecaca", niveau:7, description:"Accès total, toutes permissions, non modifiable" },
  admin:          { id:"admin",          label:"Administrateur", emoji:"🔧", color:BET_COLOR, border:"#bae6fd", niveau:6, description:"Gestion complète sauf paramètres critiques" },
  manager:        { id:"manager",        label:"Manager",        emoji:"👥", color:"#10b981", border:"#a7f3d0", niveau:5, description:"Supervision et reporting" },
  responsable:    { id:"responsable",    label:"Responsable",    emoji:"📋", color:"#8b5cf6", border:"#c4b5fd", niveau:4, description:"Gestion des équipes et suivi pédagogique" },
  commercial:     { id:"commercial",     label:"Commercial",     emoji:"📈", color:"#f59e0b", border:"#fcd34d", niveau:3, description:"CRM, inscriptions et ventes" },
  gestionnaire:   { id:"gestionnaire",   label:"Gestionnaire",   emoji:"🗂️", color:"#059669", border:"#6ee7b7", niveau:3, description:"Administratif, finances, planning" },
  coach:          { id:"coach",          label:"Coach",          emoji:"🎓", color:"#6366f1", border:"#a5b4fc", niveau:2, description:"Pédagogie, cours et examens" },
  data_collector: { id:"data_collector", label:"Data Collector", emoji:"📊", color:"#64748b", border:"#e2e8f0", niveau:1, description:"Saisie de données uniquement" },
};

// Modules (idem AdminDashboard)
const MODULES = [
  { id:"dashboard", label:"Tableau de bord", cat:"Analyse", icon:"📊" },
  { id:"users", label:"Utilisateurs", cat:"Administration", icon:"👥" },
  { id:"roles", label:"Rôles & Permissions", cat:"Administration", icon:"🔐" },
  { id:"cours", label:"Cours", cat:"Pédagogie", icon:"📚" },
  { id:"examens", label:"Examens", cat:"Pédagogie", icon:"📝" },
  { id:"finances", label:"Finances", cat:"Finances", icon:"💰" },
  { id:"support", label:"Support", cat:"Support", icon:"💬" },
  { id:"audit", label:"Audit", cat:"Sécurité", icon:"📜" },
  { id:"plateforme", label:"Plateforme", cat:"Supervision", icon:"🏢" },
];

const PERM_LABELS = { create:"Créer", read:"Lire", update:"Modifier", delete:"Supprimer", manage:"Gérer" };
const PERM_COLORS = { create:"#22c55e", read:"#3b82f6", update:"#f59e0b", delete:"#ef4444", manage:"#8b5cf6" };

// Permissions initiales (super_admin a tout)
// Permissions et sécurité chargées depuis l'API (plus de mock)

// Demandes d'accès (nouvelles)
const DEMANDES_INIT = [
  { id:1, nom:"N'Guessan Fatou", email:"fatou@orange.ci", entreprise:"Orange CI", roleDemande:"admin", justification:"Besoin de gérer tous les cours", statut:"en_attente", date:"2025-12-08" },
  { id:2, nom:"Yao Stéphanie", email:"stephanie@nestle.ci", entreprise:"Nestlé CI", roleDemande:"manager", justification:"Suivi des apprenants", statut:"en_attente", date:"2025-12-10" },
  { id:3, nom:"Konan Brou", email:"brou@bnp.ci", entreprise:"BNP Paribas", roleDemande:"responsable", justification:"Gestion de l'équipe", statut:"en_attente", date:"2025-12-11" },
];

/* ── Données mock Coachs ── */
const COACHS_MOCK = [
  { id:1, nom:"James Adou",        initiales:"JA", specialite:"TOEIC / Business English", centre:"Angré",       classes:3, apprenants:34, tauxPresence:87, statut:"actif",    prochainCours:"Mer 30/04 · 18h00", certif:"CELTA · TOEIC 990", email:"j.adou@bet.ci",     tel:"+225 07 11 22 33", dateEmb:"2022-03-01",
    planning:[
      { jour:"Lun", horaire:"08h00–10h00", classe:"TOEIC B1→B2",  salle:"Salle A3", apprenants:11 },
      { jour:"Mer", horaire:"18h00–20h00", classe:"TOEIC B1→B2",  salle:"Salle A3", apprenants:11 },
      { jour:"Ven", horaire:"10h00–12h00", classe:"TOEIC B2→C1",  salle:"Salle B1", apprenants:9  },
    ],
    examens:[
      { titre:"Test blanc TOEIC #3", date:"10/04/25", classe:"TOEIC B1→B2", nbParticipants:11, noteMoy:"72/100", statut:"Corrigé" },
      { titre:"Test blanc TOEIC #3", date:"10/04/25", classe:"TOEIC B2→C1", nbParticipants:9,  noteMoy:"81/100", statut:"Corrigé" },
      { titre:"Éval intermédiaire",  date:"25/04/25", classe:"TOEIC B1→B2", nbParticipants:11, noteMoy:"—",      statut:"À venir"  },
    ],
  },
  { id:2, nom:"Aminata Koné",      initiales:"AK", specialite:"Anglais Adultes / Conversation", centre:"II Plateaux", classes:2, apprenants:26, tauxPresence:91, statut:"actif",    prochainCours:"Lun 28/04 · 10h00", certif:"DELTA · DALF", email:"a.kone@bet.ci",       tel:"+225 07 44 55 66", dateEmb:"2021-09-15",
    planning:[
      { jour:"Lun", horaire:"10h00–12h00", classe:"Adultes A2→B1",  salle:"Salle C2", apprenants:14 },
      { jour:"Jeu", horaire:"16h00–18h00", classe:"Conversation B2", salle:"Salle C1", apprenants:12 },
    ],
    examens:[
      { titre:"Éval mensuelle",     date:"15/04/25", classe:"Adultes A2→B1",  nbParticipants:14, noteMoy:"68/100", statut:"Corrigé" },
      { titre:"Éval mensuelle",     date:"26/04/25", classe:"Conversation B2", nbParticipants:12, noteMoy:"—",      statut:"À venir"  },
    ],
  },
  { id:3, nom:"Moussa Bamba",      initiales:"MB", specialite:"Anglais Enfants / Junior", centre:"Bouaké",     classes:4, apprenants:52, tauxPresence:83, statut:"actif",    prochainCours:"Sam 27/04 · 09h00", certif:"TEFL · YL Cert",   email:"m.bamba@bet.ci",      tel:"+225 07 77 88 99", dateEmb:"2023-01-10",
    planning:[
      { jour:"Sam", horaire:"09h00–11h00", classe:"Enfants 8–10 ans", salle:"Salle J1", apprenants:15 },
      { jour:"Sam", horaire:"11h00–13h00", classe:"Enfants 11–13 ans",salle:"Salle J2", apprenants:13 },
      { jour:"Mer", horaire:"14h00–16h00", classe:"Junior A1",        salle:"Salle J1", apprenants:12 },
      { jour:"Mer", horaire:"16h00–18h00", classe:"Junior A2",        salle:"Salle J2", apprenants:12 },
    ],
    examens:[
      { titre:"Contrôle trimestriel", date:"05/04/25", classe:"Enfants 8–10 ans",  nbParticipants:15, noteMoy:"74/100", statut:"Corrigé" },
      { titre:"Contrôle trimestriel", date:"05/04/25", classe:"Junior A1",         nbParticipants:12, noteMoy:"70/100", statut:"Corrigé" },
      { titre:"Contrôle trimestriel", date:"30/04/25", classe:"Enfants 11–13 ans", nbParticipants:13, noteMoy:"—",      statut:"À venir"  },
    ],
  },
  { id:4, nom:"Isabelle Yao",      initiales:"IY", specialite:"IELTS / Séjours linguistiques", centre:"Angré", classes:2, apprenants:18, tauxPresence:94, statut:"actif",    prochainCours:"Mar 29/04 · 17h00", certif:"IELTS 8.5 · CELTA", email:"i.yao@bet.ci",       tel:"+225 07 00 11 22", dateEmb:"2020-06-01",
    planning:[
      { jour:"Mar", horaire:"17h00–19h00", classe:"IELTS Prep B2", salle:"Salle B3", apprenants:10 },
      { jour:"Ven", horaire:"08h00–10h00", classe:"IELTS Prep C1", salle:"Salle B3", apprenants:8  },
    ],
    examens:[
      { titre:"Mock IELTS #2",  date:"12/04/25", classe:"IELTS Prep B2", nbParticipants:10, noteMoy:"6.5/9", statut:"Corrigé" },
      { titre:"Mock IELTS #2",  date:"12/04/25", classe:"IELTS Prep C1", nbParticipants:8,  noteMoy:"7.2/9", statut:"Corrigé" },
      { titre:"Mock IELTS #3",  date:"03/05/25", classe:"IELTS Prep B2", nbParticipants:10, noteMoy:"—",     statut:"À venir"  },
    ],
  },
  { id:5, nom:"David Assoumou",    initiales:"DA", specialite:"Anglais Entreprise / Corporate", centre:"Angré", classes:3, apprenants:48, tauxPresence:78, statut:"conge",   prochainCours:"Retour 05/05",      certif:"MBA · CELTA",      email:"d.assoumou@bet.ci",   tel:"+225 07 33 44 55", dateEmb:"2019-04-20",
    planning:[], examens:[],
  },
  { id:6, nom:"Rosine Ouattara",   initiales:"RO", specialite:"Anglais Adultes / Entreprises", centre:"II Plateaux", classes:1, apprenants:14, tauxPresence:89, statut:"actif",    prochainCours:"Jeu 01/05 · 18h30", certif:"CELTA",             email:"r.ouattara@bet.ci",   tel:"+225 07 66 77 88", dateEmb:"2023-09-01",
    planning:[
      { jour:"Jeu", horaire:"18h30–20h30", classe:"Entreprise Orange CI", salle:"Salle D1", apprenants:14 },
    ],
    examens:[
      { titre:"Éval mensuelle", date:"30/04/25", classe:"Entreprise Orange CI", nbParticipants:14, noteMoy:"—", statut:"À venir" },
    ],
  },
];

/* ── Données mock Apprenants ── */
const APPRENANTS_MOCK = [
  { id:1,  nom:"Awa Traoré",         initiales:"AT", niveau:"B1", coach:"James Adou",   centre:"Angré",     progression:68, presence:92, dernierExam:"720/990 TOEIC", paiement:"À jour",   statut:"Actif",    dateInscr:"2025-01-15", email:"awa.traore@gmail.com",    tel:"+225 07 10 20 30", typeFormation:"TOEIC B1→B2" },
  { id:2,  nom:"Kouamé Brou",        initiales:"KB", niveau:"B1", coach:"James Adou",   centre:"Angré",     progression:54, presence:78, dernierExam:"640/990 TOEIC", paiement:"Retard",   statut:"⚠ Risque", dateInscr:"2025-02-01", email:"kouame.brou@gmail.com",   tel:"+225 07 20 30 40", typeFormation:"TOEIC B1→B2" },
  { id:3,  nom:"Fatoumata Diallo",   initiales:"FD", niveau:"B2", coach:"James Adou",   centre:"Angré",     progression:82, presence:96, dernierExam:"780/990 TOEIC", paiement:"À jour",   statut:"Actif",    dateInscr:"2025-01-10", email:"fatoumata.d@gmail.com",   tel:"+225 07 30 40 50", typeFormation:"TOEIC B1→B2" },
  { id:4,  nom:"Serge Assoua",       initiales:"SA", niveau:"C1", coach:"James Adou",   centre:"Angré",     progression:71, presence:88, dernierExam:"820/990 TOEIC", paiement:"À jour",   statut:"Actif",    dateInscr:"2024-09-01", email:"serge.assoua@gmail.com",  tel:"+225 07 40 50 60", typeFormation:"TOEIC B2→C1" },
  { id:5,  nom:"Marie Kouamé",       initiales:"MK", niveau:"B1", coach:"James Adou",   centre:"Angré",     progression:45, presence:65, dernierExam:"580/990 TOEIC", paiement:"Impayé",   statut:"⚠ Risque", dateInscr:"2025-03-01", email:"marie.kouame@gmail.com",  tel:"+225 07 50 60 70", typeFormation:"TOEIC B1→B2" },
  { id:6,  nom:"Amidou Coulibaly",   initiales:"AC", niveau:"A2", coach:"Aminata Koné", centre:"II Plateaux",progression:61, presence:85, dernierExam:"68/100",        paiement:"À jour",   statut:"Actif",    dateInscr:"2025-02-15", email:"amidou.c@gmail.com",      tel:"+225 07 60 70 80", typeFormation:"Adultes A2→B1" },
  { id:7,  nom:"Nadège Bamba",       initiales:"NB", niveau:"B2", coach:"Aminata Koné", centre:"II Plateaux",progression:79, presence:93, dernierExam:"76/100",        paiement:"À jour",   statut:"Actif",    dateInscr:"2024-11-01", email:"nadege.b@gmail.com",      tel:"+225 07 70 80 90", typeFormation:"Conversation B2" },
  { id:8,  nom:"Omar Sangaré",       initiales:"OS", niveau:"A1", coach:"Moussa Bamba", centre:"Bouaké",    progression:38, presence:88, dernierExam:"42/100",        paiement:"À jour",   statut:"Actif",    dateInscr:"2025-03-10", email:"omar.s@gmail.com",        tel:"+225 07 80 90 01", typeFormation:"Junior A1" },
  { id:9,  nom:"Chloé Diaby",        initiales:"CD", niveau:"A2", coach:"Moussa Bamba", centre:"Bouaké",    progression:55, presence:76, dernierExam:"58/100",        paiement:"Retard",   statut:"Actif",    dateInscr:"2025-01-20", email:"chloe.d@gmail.com",       tel:"+225 07 90 01 12", typeFormation:"Junior A2" },
  { id:10, nom:"Paul Yao",           initiales:"PY", niveau:"C1", coach:"Isabelle Yao", centre:"Angré",     progression:88, presence:97, dernierExam:"7.2/9 IELTS",  paiement:"À jour",   statut:"Certifié", dateInscr:"2024-06-01", email:"paul.yao@gmail.com",      tel:"+225 07 01 12 23", typeFormation:"IELTS Prep C1" },
  { id:11, nom:"Safi Touré",         initiales:"ST", niveau:"B2", coach:"Isabelle Yao", centre:"Angré",     progression:74, presence:90, dernierExam:"6.5/9 IELTS",  paiement:"À jour",   statut:"Actif",    dateInscr:"2025-01-05", email:"safi.toure@gmail.com",    tel:"+225 07 12 23 34", typeFormation:"IELTS Prep B2" },
  { id:12, nom:"Eric Konan",         initiales:"EK", niveau:"B1", coach:"Rosine Ouattara", centre:"II Plateaux",progression:52, presence:82, dernierExam:"64/100",    paiement:"Impayé",   statut:"⚠ Risque", dateInscr:"2025-03-15", email:"eric.konan@orange.ci",   tel:"+225 07 23 34 45", typeFormation:"Entreprise Orange CI" },
];

// Profil du Super Admin
const SUPER_ADMIN_PROFIL = {
  id:1, nom:"Kouamé", prenom:"Aya", email:"aya@bet.com", role:"super_admin", avatar:"AK", tel:"+225 01 00 00 01", dateEmbauche:"2020-01-01", dernierAcces:"2025-12-14 08:30", permissions:"totales"
};

/* ═══════════════════════════════════════════════════════
   DONNÉES MOCK GLOBALES (vue SuperAdmin — toute la plateforme)
═══════════════════════════════════════════════════════ */
const SA_TRAFIC = {
  visites:89240, pagesVues:275800, tauxRebond:38.4,
  sources:[{name:"Recherche organique",part:52},{name:"Réseaux sociaux",part:24},{name:"Direct",part:14},{name:"Emailing",part:10}],
  pagesPopulaires:[{titre:"/formations/anglais-pro",vues:24500},{titre:"/tarifs-entreprises",vues:18700},{titre:"/test-niveau",vues:15200}],
  tauxConversionForm:4.1
};
const SA_CLIENTS = { prospects:6240, inscritsActifs:1870, nouveauxClientsMois:312, tauxConversion:14.8 };
const SA_OFFRES = [
  { id:1, nom:"Anglais Adulte",      type:"Adulte",       nbInscrits:820,  chiffre:4920000,  tauxRemplissage:87 },
  { id:2, nom:"Anglais Enfant",      type:"Enfant",       nbInscrits:380,  chiffre:2280000,  tauxRemplissage:76 },
  { id:3, nom:"Formation Entreprise",type:"Entreprise",   nbInscrits:1200, chiffre:9600000,  tauxRemplissage:94 },
  { id:4, nom:"Certification TOEIC", type:"Certification",nbInscrits:560,  chiffre:1950000,  tauxRemplissage:71 },
];
const SA_REPARTITION_TYPE = { Adulte:820, Enfant:380, Entreprise:1200, Certification:560 };
const SA_CA = {
  total:18750000,
  parOffre:{ "Anglais Adulte":4920000,"Anglais Enfant":2280000,"Formation Entreprise":9600000,"Certification TOEIC":1950000 },
  parPeriode:{ "Jan":1250000,"Fév":1380000,"Mar":1520000,"Avr":1600000,"Mai":1750000,"Juin":1820000,"Juil":1680000,"Août":1540000,"Sep":1720000,"Oct":1890000,"Nov":1980000,"Déc":620000 },
  paiementsRecus:16890000, paiementsAttente:1860000,
  moyenPaiement:{ "Mobile Money":62,"Carte bancaire":28,"Virement":10 },
};
const SA_TRANSACTIONS = [
  { id:1, client:"Orange CI",   montant:450000, date:"2025-12-10", statut:"validé",     moyen:"Mobile Money" },
  { id:2, client:"MTN CI",      montant:620000, date:"2025-12-09", statut:"validé",     moyen:"Virement" },
  { id:3, client:"BNP Paribas", montant:380000, date:"2025-12-09", statut:"validé",     moyen:"Carte" },
  { id:4, client:"Nestlé CI",   montant:125000, date:"2025-12-08", statut:"en_attente", moyen:"Mobile Money" },
  { id:5, client:"SIFCA",       montant:290000, date:"2025-12-07", statut:"validé",     moyen:"Carte" },
  { id:6, client:"Total CI",    montant:840000, date:"2025-12-06", statut:"echoué",     moyen:"Virement" },
];
const SA_PROGRESSION = { moyenneProgression:69, resultatsParNiveau:{ A1:54, A2:63, B1:72, B2:80, C1:87, C2:94 }, assiduiteMoyenne:85, bulletinsGeneres:1870, certificatsDelivres:312 };
const SA_REQUETES = [
  { id:1, client:"Orange CI",   sujet:"Accès plateforme",   statut:"ouvert",   date:"2025-12-10", tempsTraitement:0,   categorie:"Technique" },
  { id:2, client:"BNP Paribas", sujet:"Facture groupe",     statut:"en_cours", date:"2025-12-09", tempsTraitement:3.5, categorie:"Facturation" },
  { id:3, client:"Nestlé CI",   sujet:"Certificat manquant",statut:"résolu",   date:"2025-12-05", tempsTraitement:8,   categorie:"Certification" },
  { id:4, client:"MTN CI",      sujet:"Rapport assiduité",  statut:"ouvert",   date:"2025-12-10", tempsTraitement:0,   categorie:"Pédagogique" },
  { id:5, client:"SIFCA",       sujet:"Accès formateur",    statut:"en_cours", date:"2025-12-08", tempsTraitement:6,   categorie:"Technique" },
];
const SA_TEMPS_MOYEN = 7.4;

/* ═══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function SuperAdminDashboard() {
  const handleLogout = () => {
    ["admin_token", "admin_refresh", "admin_profil"].forEach(k => localStorage.removeItem(k));
    window.location.replace("/login-admin");
  };

  // Profil connecté depuis la session
  const profilConnecte = useMemo(() => {
    try {
      const stored = localStorage.getItem("admin_profil");
      if (stored) return JSON.parse(stored);
    } catch {}
    return SUPER_ADMIN_PROFIL;
  }, []);

  const [activeTab, setActiveTab]   = useState("overview");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(true);

  // ── Sondages acquisition ──────────────────────────────
  const [sondagesAll,     setSondagesAll]     = useState([]);
  const [sondageSrcStats, setSondageSrcStats] = useState({});
  const [sondageUtmStats, setSondageUtmStats] = useState({});
  const [visitStats,      setVisitStats]      = useState({});
  const [totalVisits,     setTotalVisits]     = useState(0);
  const [sondagesLoading, setSondagesLoading] = useState(false);

  const fetchSondagesAll = async () => {
    setSondagesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sondage/all`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setSondagesAll(d.sondages || []);
      setSondageSrcStats(d.source_stats || {});
      setSondageUtmStats(d.utm_stats || {});
      setVisitStats(d.visit_stats || {});
      setTotalVisits(d.total_visits || 0);
    } catch (e) { console.error("Sondages SA:", e); }
    finally { setSondagesLoading(false); }
  };

  useEffect(() => { fetchSondagesAll(); }, []);

  // États Gestion des droits — alimentés par l'API
  const [users, setUsers]           = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [securite, setSecurite]     = useState({});
  const [permissions, setPermissions] = useState({});
  const [demandes, setDemandes]     = useState([]);
  const [auditLog, setAuditLog] = useState(GLOBAL_AUDIT);
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
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [tempPasswords, setTempPasswords] = useState({}); // { [userId]: mdp }
  const [inviteForm, setInviteForm] = useState({ nom:"", email:"", telephone:"", role:"manager", centre_id:"", accessTemp:"", note:"", type_cours:"en_ligne", quota_jour:10, jours_travail:["lundi","mardi","mercredi","jeudi","vendredi"], profil_assistante:"b2c" });
  const [assistanteProfilFilter, setAssistanteProfilFilter] = useState("b2c"); // "b2c" | "b2b"
  const [editingUser, setEditingUser] = useState(null);
  const [userToRevoke, setUserToRevoke] = useState(null);
  const [cloneForm, setCloneForm] = useState({ source:"admin", cible:"manager" });
  const [selectedDemande, setSelectedDemande] = useState(null);
  // Onglet secondaire pour les permissions
  const [permSubTab, setPermSubTab] = useState("vue_ensemble");

  // ── Témoignages ──────────────────────────────────────────
  const [assistantesAdmin, setAssistantesAdmin]     = useState([]);
  const [assistantesLoading, setAssistantesLoading] = useState(false);
  const [assistantesDrafts, setAssistantesDrafts]   = useState({}); // { [id]: {field:val,...} }
  const [assistantesSaving, setAssistantesSaving]   = useState({}); // { [id]: bool }
  const [centreTab, setCentreTab]                   = useState("Angré");
  const [centresList, setCentresList]               = useState([]); // centres réels depuis Supabase [{id,nom,ville}]

  const fetchAssistantesAdmin = async () => {
    setAssistantesLoading(true);
    setAssistantesDrafts({});
    try {
      const res = await fetch(`${API_URL}/api/parcours/assistantes`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setAssistantesAdmin(d.assistantes || []);
    } catch { toast.error("Erreur chargement assistantes"); }
    finally { setAssistantesLoading(false); }
  };

  const fetchCentresList = async () => {
    try {
      const res = await fetch(`${API_URL}/api/parcours/centres`);
      const d = await res.json();
      setCentresList(d.centres || []);
    } catch {}
  };

  // Retourne la version draft-merged d'une assistante
  const getDraftedA = (a) => ({ ...a, ...(assistantesDrafts[a.id] || {}) });

  // Met à jour le draft local (sans appel API)
  const setDraft = (id, updates) => {
    setAssistantesDrafts(prev => ({ ...prev, [id]: { ...(prev[id]||{}), ...updates } }));
  };

  const toggleJourTravailDraft = (assistanteId, jour) => {
    const a = assistantesAdmin.find(x => x.id === assistanteId);
    if (!a) return;
    const base = (assistantesDrafts[assistanteId]?.jours_travail) ?? (a.jours_travail || ["lundi","mardi","mercredi","jeudi","vendredi"]);
    const nouveau = base.includes(jour) ? base.filter(j => j !== jour) : [...base, jour];
    setDraft(assistanteId, { jours_travail: nouveau });
  };

  // Enregistre le draft d'une assistante vers l'API
  const saveDraftAssistante = async (id) => {
    const draft = assistantesDrafts[id];
    if (!draft || Object.keys(draft).length === 0) return;
    setAssistantesSaving(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API_URL}/api/parcours/assistantes/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      setAssistantesAdmin(prev => prev.map(a => a.id === id ? { ...a, ...draft } : a));
      setAssistantesDrafts(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast.success("Planning enregistré ✓");
    } catch { toast.error("Erreur lors de l'enregistrement"); }
    finally { setAssistantesSaving(prev => ({ ...prev, [id]: false })); }
  };

  const [temos, setTemos]                   = useState([]);
  const [temosLoading, setTemosLoading]     = useState(false);
  const [temoFiltre, setTemoFiltre]         = useState("tous");
  const [temoForm, setTemoForm]             = useState({ nom:"", role:"", score:"", certType:"", certScore:"", texte:"", avatar:"🎓", couleur:"#1e4080", etoiles:5, ordre:0 });
  const [temoFormOpen, setTemoFormOpen]     = useState(false);
  const [temoRejetId, setTemoRejetId]       = useState(null);
  const [temoMotif, setTemoMotif]           = useState("");
  const [temoPage,   setTemoPage]           = useState(1);
  const TEMO_PER_PAGE = 9;

  const fetchTemos = async () => {
    setTemosLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/temoignages`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setTemos(await res.json());
    } catch { toast.error("Erreur chargement témoignages"); }
    finally { setTemosLoading(false); }
  };

  useEffect(() => { if (activeTab === "assistantes") fetchAssistantesAdmin(); }, [activeTab]);
  useEffect(() => { fetchCentresList(); }, []);
  useEffect(() => { if (activeTab === "temoignages") fetchTemos(); }, [activeTab]);

  const temoAction = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/api/temoignages/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      setTemos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success("Témoignage mis à jour");
    } catch { toast.error("Erreur mise à jour"); }
  };

  const temoDelete = async (id) => {
    if (!window.confirm("Supprimer définitivement ?")) return;
    try {
      await fetch(`${API_URL}/api/temoignages/${id}?hard=1`, { method: "DELETE", headers: authHeaders() });
      setTemos(prev => prev.filter(t => t.id !== id));
      toast.success("Supprimé");
    } catch { toast.error("Erreur suppression"); }
  };

  const temoCreate = async () => {
    if (!temoForm.nom || !temoForm.texte) return toast.error("Nom et texte requis");
    try {
      const res = await fetch(`${API_URL}/api/temoignages`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(temoForm),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setTemos(prev => [created, ...prev]);
      setTemoForm({ nom:"", role:"", score:"", certType:"", certScore:"", texte:"", avatar:"🎓", couleur:"#1e4080", etoiles:5, ordre:0 });
      setTemoFormOpen(false);
      toast.success("Témoignage créé");
    } catch { toast.error("Erreur création"); }
  };

  const temoApprouver = async (id) => {
    await temoAction(id, { statut: "actif", actif: true });
  };

  const temoRejeter = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/temoignages/${id}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ statut: "rejete", actif: false, motif_rejet: temoMotif }),
      });
      if (!res.ok) throw new Error();
      setTemos(prev => prev.map(t => t.id === id ? { ...t, statut: "rejete", actif: false, motif_rejet: temoMotif } : t));
      setTemoRejetId(null); setTemoMotif("");
      toast.success("Rejeté");
    } catch { toast.error("Erreur"); }
  };

  const temosPending = temos.filter(t => t.statut === "en_attente").length;

  // ── Messagerie interne ───────────────────────────────────
  const [msgConvs, setMsgConvs]         = useState([]);
  const [msgMessages, setMsgMessages]   = useState([]);
  const [msgActiveId, setMsgActiveId]   = useState(null);
  const [msgInput, setMsgInput]         = useState("");
  const [msgContacts, setMsgContacts]   = useState([]);
  const [showNewConv, setShowNewConv]   = useState(false);

  const fetchConvs = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/messages/conversations`, { headers: authHeaders() });
      if (!r.ok) return;
      const { conversations } = await r.json();
      setMsgConvs(conversations || []);
    } catch {}
  }, []);

  const fetchMsgMessages = useCallback(async (convId) => {
    try {
      const r = await fetch(`${API_URL}/api/messages/conversations/${convId}/messages`, { headers: authHeaders() });
      if (!r.ok) return;
      const { messages } = await r.json();
      setMsgMessages(messages || []);
      await fetch(`${API_URL}/api/messages/conversations/${convId}/read`, { method:"PATCH", headers: authHeaders() });
      setMsgConvs(prev => prev.map(c => c.id===convId ? {...c, non_lus:0} : c));
    } catch {}
  }, []);

  const fetchMsgContacts = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/messages/contacts`, { headers: authHeaders() });
      if (!r.ok) return;
      const { contacts } = await r.json();
      setMsgContacts(contacts || []);
    } catch {}
  }, []);

  const startConv = async (toId) => {
    try {
      const r = await fetch(`${API_URL}/api/messages/conversations`, {
        method:"POST", headers: authHeaders(), body: JSON.stringify({ to_id: toId })
      });
      if (!r.ok) return;
      const { conversation } = await r.json();
      await fetchConvs();
      setShowNewConv(false);
      setMsgActiveId(conversation.id);
      await fetchMsgMessages(conversation.id);
    } catch {}
  };

  const sendMsg = async () => {
    if (!msgInput.trim() || !msgActiveId) return;
    const content = msgInput.trim();
    setMsgInput("");
    try {
      await fetch(`${API_URL}/api/messages/conversations/${msgActiveId}/messages`, {
        method:"POST", headers: authHeaders(), body: JSON.stringify({ content })
      });
      await fetchMsgMessages(msgActiveId);
      await fetchConvs();
    } catch {}
  };

  useEffect(() => { fetchConvs(); }, [fetchConvs]);
  useEffect(() => {
    if (!msgActiveId) return;
    const t = setInterval(() => fetchMsgMessages(msgActiveId), 6000);
    return () => clearInterval(t);
  }, [msgActiveId, fetchMsgMessages]);

  const msgNonLuTotal = msgConvs.reduce((s,c) => s+(c.non_lus||0), 0);
  const saMyId = JSON.parse(localStorage.getItem("admin_profil")||"{}")?.id || "";
  const saPartnerName = (conv) => conv.user1_id===saMyId ? conv.user2_name : conv.user1_name;
  const saPartnerRole = (conv) => conv.user1_id===saMyId ? conv.user2_role : conv.user1_role;
  const msgActiveConv = msgConvs.find(c => c.id===msgActiveId);
  const ROLE_META_SA = {
    super_admin:"SuperAdmin", admin:"Admin", manager:"Manager",
    responsable:"Responsable", commercial:"Commercial",
    gestionnaire:"Gestionnaire", coach:"Coach", data_collector:"Data"
  };

  // ── Config centres WhatsApp ─────────────────────────────────────────────────
  const WA_LS_KEY = "bet_centers_config";
  const WA_DEFAULTS = [
    { key:"angre",    name:"Angré",       color:"#25d366", assistantes:[
      { nom:"Assistante 1", phone:"2250700000001", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Angré." },
      { nom:"Assistante 2", phone:"2250700000011", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Angré." },
    ]},
    { key:"bouake",   name:"Bouaké",      color:"#facc15", assistantes:[
      { nom:"Assistante 1", phone:"2250700000002", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Bouaké." },
      { nom:"Assistante 2", phone:"2250700000022", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Bouaké." },
    ]},
    { key:"plateaux", name:"II Plateaux", color:"#0891b2", assistantes:[
      { nom:"Assistante 1", phone:"2250700000003", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET II Plateaux." },
      { nom:"Assistante 2", phone:"2250700000033", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET II Plateaux." },
    ]},
    { key:"yopougon", name:"Yopougon",    color:"#a855f7", assistantes:[
      { nom:"Assistante 1", phone:"2250700000004", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Yopougon." },
      { nom:"Assistante 2", phone:"2250700000044", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Yopougon." },
    ]},
    { key:"koumassi", name:"Koumassi",    color:"#f97316", assistantes:[
      { nom:"Assistante 1", phone:"2250700000005", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Koumassi." },
      { nom:"Assistante 2", phone:"2250700000055", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Koumassi." },
    ]},
    { key:"abatta",   name:"Abatta",      color:"#ef4444", assistantes:[
      { nom:"Assistante 1", phone:"2250700000006", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Abatta." },
      { nom:"Assistante 2", phone:"2250700000066", message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Abatta." },
    ]},
  ];

  const readLSCenters = () => {
    try { const s = localStorage.getItem(WA_LS_KEY); return s ? JSON.parse(s) : WA_DEFAULTS; }
    catch { return WA_DEFAULTS; }
  };

  const [waCenters,      setWaCenters]      = useState(readLSCenters);
  const [waLoading,      setWaLoading]      = useState(false);
  const [waSavingIdx,    setWaSavingIdx]    = useState(null); // index du centre en cours de sauvegarde

  // Charger depuis Supabase au montage (Supabase = source de vérité)
  useEffect(() => {
    const fetch = async () => {
      setWaLoading(true);
      const { data, error } = await supabase
        .from("plateforme_config")
        .select("valeur")
        .eq("key", "centres_wa")
        .maybeSingle();
      if (!error && data?.valeur?.length) {
        setWaCenters(data.valeur);
        localStorage.setItem(WA_LS_KEY, JSON.stringify(data.valeur)); // sync cache
      }
      setWaLoading(false);
    };
    fetch();
  }, []); // eslint-disable-line

  const updateWAField = (cIdx, aIdx, field, value) => {
    setWaCenters(prev => prev.map((c, ci) => ci !== cIdx ? c : {
      ...c,
      assistantes: c.assistantes.map((a, ai) => ai !== aIdx ? a : { ...a, [field]: value }),
    }));
  };

  // Sauvegarder un seul centre (l'état complet est écrit en base pour rester cohérent)
  const saveWACentre = async (cIdx) => {
    setWaSavingIdx(cIdx);
    const { error } = await supabase
      .from("plateforme_config")
      .upsert({ key: "centres_wa", valeur: waCenters, updated_at: new Date().toISOString() });
    setWaSavingIdx(null);
    if (error) { toast.error("Erreur Supabase : " + error.message); return; }
    localStorage.setItem(WA_LS_KEY, JSON.stringify(waCenters));
    window.dispatchEvent(new StorageEvent("storage", { key: WA_LS_KEY, newValue: JSON.stringify(waCenters) }));
    toast.success(`✓ BET ${waCenters[cIdx]?.name} sauvegardé`);
  };

  const resetWACentre = async (cIdx) => {
    const updated = waCenters.map((c, i) => i === cIdx ? WA_DEFAULTS[cIdx] : c);
    setWaCenters(updated);
    await supabase
      .from("plateforme_config")
      .upsert({ key: "centres_wa", valeur: updated, updated_at: new Date().toISOString() });
    localStorage.setItem(WA_LS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent("storage", { key: WA_LS_KEY, newValue: JSON.stringify(updated) }));
    toast(`↺ BET ${waCenters[cIdx]?.name} réinitialisé`);
  };

  // Chargement des utilisateurs réels
  const chargerUtilisateurs = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/utilisateurs`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setUsers((data.utilisateurs || []).map(u => ({ ...u, twofa: u.twofa_active ?? false })));
    } catch (e) { console.error("Erreur chargement utilisateurs", e); }
    finally { setLoadingUsers(false); }
  }, []);

  // Chargement de la matrice de permissions réelle
  const chargerPermissions = useCallback(async () => {
    setLoadingPerms(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/permissions-matrice`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setPermissions(data.matrice || {});
    } catch (e) { console.error("Erreur chargement permissions", e); }
    finally { setLoadingPerms(false); }
  }, []);

  useEffect(() => {
    chargerUtilisateurs();
    chargerPermissions();
  }, [chargerUtilisateurs, chargerPermissions]);

  const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
  const formatMoney = (val) => val.toLocaleString("fr-FR") + " FCFA";

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
    const newEntry = { id: auditLog.length+1, acteur:"Super Admin", role:"super_admin", action, detail, date:new Date().toLocaleString(), ip:"127.0.0.1", statut };
    setAuditLog([newEntry, ...auditLog]);
  };

  const toggleUserStatus = async (userId) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const newActif = !target.actif;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, actif: newActif } : u));
    try {
      const res = await fetch(`${API_URL}/api/admin/utilisateurs/${userId}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ actif: newActif }),
      });
      if (!res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, actif: target.actif } : u));
        toast.error("Erreur lors du changement de statut");
      } else {
        addAuditEntry("STATUT_UTILISATEUR", `${target.prenom} ${target.nom} ${newActif ? "activé" : "désactivé"}`, "warning");
        toast.success(`${target.prenom} ${target.nom} ${newActif ? "✅ activé" : "🔴 désactivé"}`);
      }
    } catch {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, actif: target.actif } : u));
      toast.error("Impossible de joindre le serveur");
    }
  };

  const toggle2FA = async (userId, newVal) => {
    const userName = users.find(u => u.id === userId)?.prenom || "l'utilisateur";
    // Mise à jour optimiste de l'UI
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, twofa: newVal } : u));
    try {
      const res = await fetch(`${API_URL}/api/admin/utilisateurs/${userId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ twofa_active: newVal }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${res.status}`);
      }
      addAuditEntry("2FA_MODIFIE", `${userName} : 2FA ${newVal ? "activé" : "désactivé"}`, "warning");
      toast.success(`2FA ${newVal ? "activé 🔐 — l'utilisateur devra configurer son authenticator" : "désactivé"} pour ${userName}`);
    } catch (e) {
      // Rollback si erreur
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, twofa: !newVal } : u));
      toast.error(`❌ Erreur 2FA : ${e.message}`);
    }
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
    const parts = inviteForm.nom.trim().split(" ");
    const prenom = parts[0] || "";
    const nom    = parts.slice(1).join(" ") || prenom;
    if (!prenom || !inviteForm.email) { toast.error("Veuillez remplir le nom et l'email"); return; }
    if (ROLES_AVEC_CENTRE.includes(inviteForm.role) && !inviteForm.centre_id) {
      toast.error("Veuillez sélectionner le centre BET de cet utilisateur");
      return;
    }
    if (inviteForm.role === "commercial" && inviteForm.jours_travail.length === 0) {
      toast.error("Sélectionnez au moins un jour de service pour l'assistante");
      return;
    }
    try {
      const scope = inviteForm.centre_id ? [inviteForm.centre_id] : ["national"];
      const payload = {
        nom, prenom,
        email: inviteForm.email,
        telephone: inviteForm.telephone || null,
        role: inviteForm.role,
        scope,
        note: inviteForm.note,
      };
      // Pour les assistantes commerciales : inclure le planning
      if (inviteForm.role === "commercial") {
        payload.planning = {
          centre_id: inviteForm.centre_id || null,
          type_cours: inviteForm.type_cours,
          type_semaine: inviteForm.jours_travail.some(j => ["samedi","dimanche"].includes(j)) &&
                        inviteForm.jours_travail.some(j => ["lundi","mardi","mercredi","jeudi","vendredi"].includes(j))
                        ? "les_deux"
                        : inviteForm.jours_travail.some(j => ["samedi","dimanche"].includes(j)) ? "weekend" : "semaine",
          quota_jour: inviteForm.quota_jour,
          jours_travail: inviteForm.jours_travail,
          profil: inviteForm.profil_assistante || "b2c",
        };
      }
      const res  = await fetch(`${API_URL}/api/admin/utilisateurs`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erreur création"); return; }
      if (data.utilisateur?.id && data.mdp_temporaire) {
        setTempPasswords(prev => ({ ...prev, [data.utilisateur.id]: data.mdp_temporaire }));
        setCreatedCredentials({ nom: inviteForm.nom, email: inviteForm.email, mdp: data.mdp_temporaire, role: inviteForm.role });
        setShowCredentialsModal(true);
      }
      await chargerUtilisateurs();
      setShowInviteModal(false);
      setInviteForm({ nom:"", email:"", telephone:"", role:"manager", centre_id:"", accessTemp:"", note:"", type_cours:"en_ligne", quota_jour:10, jours_travail:["lundi","mardi","mercredi","jeudi","vendredi"] });
    } catch { toast.error("Impossible de joindre le serveur"); }
  };

  const renvoyerAcces = async (userId) => {
    try {
      const res  = await fetch(`${API_URL}/api/admin/utilisateurs/${userId}/renvoyer-acces`, {
        method: "POST", headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erreur"); return; }
      setTempPasswords(prev => ({ ...prev, [userId]: data.mdp_initial }));
      toast.success(`Accès de ${data.nom} affichés dans le tableau`);
    } catch { toast.error("Impossible de joindre le serveur"); }
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
      const newUser = { id: users.length+1, nom: demande.nom, email: demande.email, avatar: demande.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(), role: demande.roleDemande, actif: true, twofa: false, sessions: 0, dernConn: "Jamais", ipRestr: false, accessTemp: null, platforme:"BET Global" };
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
    const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv); a.download="superadmin_utilisateurs.csv"; a.click();
    toast.success("Export CSV effectué");
  };

  // ── Boutique ─────────────────────────────────────────────
  const [boutiqueSubTab,    setBoutiqueSubTab]    = useState("produits");
  const [produits,          setProduits]          = useState([]);
  const [prodLoading,       setProdLoading]       = useState(false);
  const [commandes,         setCommandes]         = useState([]);
  const [cmdLoading,        setCmdLoading]        = useState(false);
  const [cmdFiltreStatut,   setCmdFiltreStatut]   = useState("tous");
  const [selectedProduit,   setSelectedProduit]   = useState(null);
  const PROD_FORM_INIT = { nom:"", description:"", prix:"", stock:"0", categorie:"Autre", images:[] };
  const [prodForm,          setProdForm]          = useState(PROD_FORM_INIT);
  const [prodFormOpen,      setProdFormOpen]      = useState(false);
  const [prodSaving,        setProdSaving]        = useState(false);
  const [prodImageUploading,setProdImageUploading]= useState(false);
  const [prodPage,          setProdPage]          = useState(1);
  const PROD_PER_PAGE = 12;

  const CATEGORIES_BOUTIQUE = ["Autre","Vêtements","Accessoires","Fournitures","Livres","Goodies"];
  const STATUTS_CMD = [
    { key:"tous",       label:"Toutes",     color:"#6b7280" },
    { key:"en_attente", label:"En attente", color:"#d97706" },
    { key:"confirmee",  label:"Confirmée",  color:"#2563eb" },
    { key:"livree",     label:"Livrée",     color:"#059669" },
    { key:"annulee",    label:"Annulée",    color:"#dc2626" },
  ];

  const fetchProduits = async () => {
    setProdLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/boutique/produits`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setProduits(await res.json());
    } catch { toast.error("Erreur chargement produits"); }
    finally { setProdLoading(false); }
  };

  const fetchCommandes = async () => {
    setCmdLoading(true);
    try {
      const url = cmdFiltreStatut === "tous"
        ? `${API_URL}/api/boutique/commandes`
        : `${API_URL}/api/boutique/commandes?statut=${cmdFiltreStatut}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setCommandes(await res.json());
    } catch { toast.error("Erreur chargement commandes"); }
    finally { setCmdLoading(false); }
  };

  const saveProduit = async () => {
    if (!prodForm.nom || !prodForm.prix) return toast.error("Nom et prix requis");
    setProdSaving(true);
    try {
      const isEdit = !!selectedProduit;
      const url = isEdit
        ? `${API_URL}/api/boutique/produits/${selectedProduit.id}`
        : `${API_URL}/api/boutique/produits`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ ...prodForm, prix: Number(prodForm.prix), stock: Number(prodForm.stock), image_url: prodForm.images[0] || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(isEdit ? "Produit mis à jour" : "Produit créé");
      setProdFormOpen(false);
      setSelectedProduit(null);
      setProdForm(PROD_FORM_INIT);
      setProdPage(1);
      fetchProduits();
    } catch (e) { toast.error(e.message || "Erreur sauvegarde"); }
    finally { setProdSaving(false); }
  };

  const toggleProduitActif = async (id, actif) => {
    try {
      await fetch(`${API_URL}/api/boutique/produits/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !actif }),
      });
      setProduits(p => p.map(x => x.id === id ? { ...x, actif: !actif } : x));
    } catch { toast.error("Erreur"); }
  };

  const deleteProduit = async (id) => {
    if (!window.confirm("Supprimer ce produit ?")) return;
    try {
      await fetch(`${API_URL}/api/boutique/produits/${id}`, { method:"DELETE", headers: authHeaders() });
      toast.success("Produit supprimé");
      setProduits(p => p.filter(x => x.id !== id));
    } catch { toast.error("Erreur suppression"); }
  };

  const updateCmdStatut = async (id, statut) => {
    try {
      await fetch(`${API_URL}/api/boutique/commandes/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      setCommandes(c => c.map(x => x.id === id ? { ...x, statut } : x));
      toast.success("Statut mis à jour");
    } catch { toast.error("Erreur"); }
  };

  const uploadProduitImage = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image trop lourde — maximum 10 Mo");
      return;
    }
    setProdImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/api/upload/image`, { method:"POST", headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }, body: fd });
      if (res.status === 413) throw new Error("Fichier trop volumineux pour le serveur (max 10 Mo)");
      let d;
      try { d = await res.json(); } catch { throw new Error(`Erreur serveur (${res.status})`); }
      if (!res.ok) throw new Error(d.error || `Erreur ${res.status}`);
      setProdForm(f => ({ ...f, images: [...(f.images||[]), d.file.url] }));
      toast.success("Image ajoutée");
    } catch (e) { toast.error(e.message || "Erreur upload image"); }
    finally { setProdImageUploading(false); }
  };

  // ── Commentaires Blog ────────────────────────────────────
  const [blogComments,        setBlogComments]        = useState([]);
  const [blogCommentsLoading, setBlogCommentsLoading] = useState(false);
  const [blogCommentsSearch,  setBlogCommentsSearch]  = useState("");

  const fetchBlogComments = async () => {
    setBlogCommentsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/blog/admin/commentaires/all`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setBlogComments(d.commentaires || []);
    } catch { toast.error("Erreur chargement commentaires"); }
    finally { setBlogCommentsLoading(false); }
  };

  const deleteBlogComment = async (id) => {
    if (!window.confirm("Supprimer ce commentaire définitivement ?")) return;
    try {
      await fetch(`${API_URL}/api/blog/commentaires/${id}`, { method:"DELETE", headers: authHeaders() });
      setBlogComments(c => c.filter(x => x.id !== id));
      toast.success("Commentaire supprimé");
    } catch { toast.error("Erreur suppression"); }
  };

  useEffect(() => { if (activeTab === "blog_comments") fetchBlogComments(); }, [activeTab]);

  useEffect(() => { if (activeTab === "boutique") { fetchProduits(); fetchCommandes(); } }, [activeTab]);
  useEffect(() => { if (activeTab === "boutique" && boutiqueSubTab === "commandes") fetchCommandes(); }, [cmdFiltreStatut]);

  // États pour les onglets Coachs & Apprenants
  const [selectedCoach,     setSelectedCoach]     = useState(null);
  const [selectedApprenant, setSelectedApprenant] = useState(null);
  const [coachSubTab,       setCoachSubTab]       = useState("liste");
  const [apprenantFiltre,   setApprenantFiltre]   = useState({ niveau:"Tous", centre:"Tous", statut:"Tous", search:"" });

  // Onglets principaux (élargis)
  const tabs = [
    { key: "overview",      label: "Vue d'ensemble", icon: "🏠" },
    { key: "platform",      label: "Plateforme",     icon: "🏢" },
    { key: "permissions",   label: "Gestion des droits", icon: "🔐", badge: stats.enAttente, danger: stats.enAttente>0 },
    { key: "audit",         label: "Audit global",   icon: "📜", badge: auditLog.length },
    { key: "logs",          label: "Logs système",           icon: "📋" },
    { key: "trafic",        label: "Trafic web",             icon: "🌐" },
    { key: "clients",       label: "Clients & Prospects",    icon: "👥" },
    { key: "offres",        label: "Offres & Formations",    icon: "🎓" },
    { key: "ca",            label: "Chiffre d'affaires",     icon: "💰" },
    { key: "paiements",     label: "Paiements",              icon: "💳" },
    { key: "progression",   label: "Progression apprenants", icon: "📈" },
    { key: "support",       label: "Requêtes & Support",     icon: "🛠️" },
    { key: "assistantes",   label: "Planning assistantes",   icon: "📅", badge: assistantesAdmin.filter(a=>!a.actif).length||null, danger: assistantesAdmin.filter(a=>!a.actif).length>0 },
    { key: "coachs",        label: "Coachs",                 icon: "👨‍🏫", badge: COACHS_MOCK.length },
    { key: "apprenants",    label: "Apprenants",             icon: "🎓",  badge: APPRENANTS_MOCK.length },
    { key: "sondages",      label: "Sondages",               icon: "🎯",  badge: sondagesAll.length },
    { key: "messages",      label: "Messages",               icon: "💬",  badge: msgNonLuTotal||null, danger: msgNonLuTotal>0 },
    { key: "temoignages",   label: "Témoignages",            icon: "⭐",  badge: temosPending||null, danger: temosPending>0 },
    { key: "boutique",      label: "Boutique",               icon: "🛍️", badge: commandes.filter(c=>c.statut==="en_attente").length||null, danger: commandes.filter(c=>c.statut==="en_attente").length>0 },
    { key: "blog_comments", label: "Commentaires Blog",      icon: "💬",  badge: blogComments.length || null },
  ];

  const permTabs = [
    { key:"vue_ensemble", label:"Vue d'ensemble", icon:"📊" },
    { key:"utilisateurs", label:"Utilisateurs", icon:"👥", badge:users.length },
    { key:"matrice", label:"Matrice des permissions", icon:"🔐" },
    { key:"securite", label:"Sécurité", icon:"🛡️" },
    // { key:"demandes", label:"Demandes d'accès", icon:"📬", badge:stats.enAttente, danger:stats.enAttente>0 },
  ];

  const [platformSubTab, setPlatformSubTab] = useState("general");
  const platformTabs = [
    { key:"general",       label:"Paramètres généraux", icon:"⚙️" },
    { key:"whatsapp",      label:"Messages WhatsApp",   icon:"💬" },
    { key:"coachs_photos", label:"Équipe Coachs",       icon:"👨‍🏫" },
  ];
  const [coachsList, setCoachsList]           = useState([]);
  const [coachsLoading, setCoachsLoading]     = useState(false);
  const [coachsEdits, setCoachsEdits]         = useState({});
  const [coachsSaving, setCoachsSaving]       = useState({});
  const [coachsUploading, setCoachsUploading] = useState({});
  const [newCoachForm, setNewCoachForm]       = useState({ nom:"", titre:"", photo_url:"" });
  const [newCoachUploading, setNewCoachUploading] = useState(false);
  const [newCoachSaving, setNewCoachSaving]   = useState(false);

  const uploadToCloudinary = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/api/upload/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur upload");
    return data.file.url;
  };

  const uploadCoachPhoto = async (coach, file) => {
    setCoachsUploading(p => ({ ...p, [coach.id]: true }));
    try {
      const url = await uploadToCloudinary(file);
      setCoachsEdits(p => ({ ...p, [coach.id]: { ...(p[coach.id] || {}), photo_url: url } }));
      toast.success("Photo uploadée — cliquez Enregistrer pour sauvegarder");
    } catch (err) {
      toast.error("Erreur upload : " + (err.message || "réessayez"));
    } finally {
      setCoachsUploading(p => ({ ...p, [coach.id]: false }));
    }
  };

  const uploadNewCoachPhoto = async (file) => {
    setNewCoachUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setNewCoachForm(p => ({ ...p, photo_url: url }));
      toast.success("Photo chargée");
    } catch (err) {
      toast.error("Erreur upload : " + (err.message || "réessayez"));
    } finally {
      setNewCoachUploading(false);
    }
  };

  const createDisplayCoach = async () => {
    if (!newCoachForm.photo_url) { toast.error("Veuillez d'abord uploader une photo"); return; }
    setNewCoachSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/equipe-photos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newCoachForm),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur"); }
      toast.success("Photo ajoutée !");
      setNewCoachForm({ nom:"", titre:"", photo_url:"" });
      fetchCoachs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setNewCoachSaving(false);
    }
  };

  const fetchCoachs = useCallback(async () => {
    setCoachsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/equipe-photos`, { headers: authHeaders() });
      const data = await res.json();
      setCoachsList(Array.isArray(data) ? data : []);
      setCoachsEdits({});
    } catch { toast.error("Erreur chargement photos équipe"); }
    finally { setCoachsLoading(false); }
  }, []);

  useEffect(() => { if (platformSubTab === "coachs_photos") fetchCoachs(); }, [platformSubTab, fetchCoachs]);

  const saveCoach = async (photo) => {
    const edits = coachsEdits[photo.id] || {};
    setCoachsSaving(p => ({ ...p, [photo.id]: true }));
    try {
      const res = await fetch(`${API_URL}/api/equipe-photos/${photo.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(edits),
      });
      if (!res.ok) throw new Error();
      toast.success("Photo mise à jour");
      setCoachsEdits(p => { const n = { ...p }; delete n[photo.id]; return n; });
      fetchCoachs();
    } catch { toast.error("Erreur sauvegarde"); }
    finally { setCoachsSaving(p => ({ ...p, [photo.id]: false })); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f9ff" }}>
      <div style={{ padding:0, overflowX:"hidden" }}>
        <Toaster position="top-right" />

        {/* HERO HEADER (Super Admin) */}
        <div style={{ background:BET_GRADIENT, padding:"28px 32px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", zIndex:0 }} />
          <div style={{ position:"absolute", bottom:-60, right:80, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.03)", zIndex:0 }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, position:"relative", zIndex:2 }}>
            <div style={{ display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", border:"3px solid rgba(255,255,255,0.3)" }}>
                {(profilConnecte.prenom?.[0] || "S") + (profilConnecte.nom?.[0] || "A")}
              </div>
              <div>
                <div style={{ fontSize:11, color:"#7dd3fc", fontWeight:600, letterSpacing:"0.08em" }}>Super Admin 👑</div>
                <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>{profilConnecte.prenom} {profilConnecte.nom}</h1>
                <div style={{ fontSize:12, color:"#bae6fd", marginTop:3 }}>{profilConnecte.email} · Supervision globale · Tous droits</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <NotificationBell userId={saMyId} />
              <button
                type="button"
                onClick={handleLogout}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", transition:"background .2s", fontFamily:"inherit" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(220,38,38,0.35)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}
              >
                <span style={{ fontSize:16 }}>🚪</span> Déconnexion
              </button>
            </div>
          </div>
          <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.15)", borderRadius:"12px 12px 0 0", overflow:"hidden" }}>
            {[
              { l:"Admins actifs", v:`${stats.actifs}/${users.length}`, c:"#38bdf8" },
              { l:"Apprenants", v:PLATEFORME_STATS.totalApprenants, c:"#34d399" },
              { l:"Entreprises", v:PLATEFORME_STATS.totalEntreprises, c:"#a78bfa" },
              { l:"CA annuel", v:formatMoney(PLATEFORME_STATS.chiffreAffairesAnnuel), c:"#f87171" },
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

            {/* ================= ONGLET VUE D'ENSEMBLE ================= */}
            {activeTab === "overview" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🏠 Tableau de bord Super Admin</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Indicateurs clés de la plateforme BET</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:16, marginBottom:24 }}>
                  <StatCard label="Admins actifs" value={`${stats.actifs}/${users.length}`} color={BET_COLOR} icon="👥" sub="dont 1 super admin" />
                  <StatCard label="Apprenants" value={PLATEFORME_STATS.totalApprenants} color="#22c55e" icon="👩‍🎓" sub="+12% vs mois dernier" />
                  <StatCard label="Entreprises" value={PLATEFORME_STATS.totalEntreprises} color="#f59e0b" icon="🏢" sub="Nouveaux : +5" />
                  <StatCard label="Certifications" value={PLATEFORME_STATS.totalCertificationsDelivrees} color="#8b5cf6" icon="🏅" sub="Taux réussite 94%" />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Évolution du CA (millions FCFA)</div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af", marginBottom:6 }}><span>J</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span><span>J</span><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span></div>
                    <div style={{ height:60, display:"flex", alignItems:"flex-end", gap:2 }}>
                      {[12,14,16,18,20,22,24,26,28,30,32,28].map((val,i)=> <div key={i} style={{ flex:1, background:BET_COLOR, height:`${val*1.5}%`, minHeight:5, borderRadius:4 }} title={`${val} M`} />)}
                    </div>
                    <div style={{ marginTop:12 }}><ProgressBar value={PLATEFORME_STATS.tauxCroissance} color="#22c55e" /> <div style={{ fontSize:12, marginTop:4 }}>Croissance annuelle : <strong>{PLATEFORME_STATS.tauxCroissance}%</strong></div></div>
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Répartition des utilisateurs par rôle</div>
                    {Object.values(ROLES_DEF).map(r => {
                      const count = users.filter(u => u.role === r.id).length;
                      const pct = users.length ? Math.round((count/users.length)*100) : 0;
                      return (
                        <div key={r.id} style={{ marginBottom:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                            <span>{r.emoji} {r.label}</span><strong>{count} ({pct}%)</strong>
                          </div>
                          <ProgressBar value={pct} color={r.color} height={5} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= ONGLET PLATEFORME ================= */}
            {activeTab === "platform" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🏢 Configuration de la plateforme</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Paramètres globaux, modules activés, maintenance</p></div>
                </div>

                {/* ── Sous-onglets Plateforme ── */}
                <div style={{ display:"flex", gap:3, marginBottom:20, borderBottom:"1px solid #e5e7eb", paddingBottom:8 }}>
                  {platformTabs.map(tab => {
                    const isActive = platformSubTab === tab.key;
                    return (
                      <button key={tab.key} onClick={() => setPlatformSubTab(tab.key)} style={{ padding:"8px 14px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer", fontWeight:600, fontSize:12, background:isActive?BET_LIGHT:"transparent", color:isActive?BET_COLOR:"#6b7280", display:"flex", alignItems:"center", gap:5 }}>
                        <span style={{ fontSize:13 }}>{tab.icon}</span>{tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* ── Sous-onglet : Paramètres généraux ── */}
                {platformSubTab === "general" && (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                      <div><h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>⚙️ Paramètres généraux</h3></div>
                      <button onClick={()=>toast.success("Sauvegarde effectuée")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>💾 Sauvegarder</button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                      <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                        <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Modules actifs</h3>
                        {MODULES.map(m => (
                          <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                            <span>{m.icon} {m.label}</span>
                            <ToggleSwitch on={true} onChange={()=>{}} color={BET_COLOR} />
                          </div>
                        ))}
                      </div>
                      <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                        <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Paramètres de sécurité globaux</h3>
                        <div style={{ marginBottom:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}><span>2FA obligatoire pour tous les admins</span><ToggleSwitch on={true} onChange={()=>{}} color={BET_RED} /></div>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}><span>Expiration des sessions (heures)</span><input type="number" defaultValue={8} style={{ width:70, padding:4, borderRadius:4, border:"1px solid #e5e7eb" }} /></div>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}><span>Rotation des mots de passe (jours)</span><input type="number" defaultValue={90} style={{ width:70, padding:4, borderRadius:4, border:"1px solid #e5e7eb" }} /></div>
                        </div>
                        <button onClick={()=>toast.success("Configuration mise à jour")} style={{ marginTop:10, ...btnPrimary, width:"100%" }}>Appliquer</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Sous-onglet : Messages WhatsApp ── */}
                {/* ── Sous-onglet : Équipe Coachs ── */}
                {platformSubTab === "coachs_photos" && (
                  <div>
                    {/* En-tête */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                      <div>
                        <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>👨‍🏫 Équipe Coachs</h3>
                        <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Ajoutez et gérez les photos des coachs affichées sur le site</p>
                      </div>
                      <button onClick={fetchCoachs} style={{ padding:"8px 14px", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>🔄 Actualiser</button>
                    </div>

                    {/* ── Formulaire d'ajout ── */}
                    <NewCoachForm
                      form={newCoachForm}
                      onFormChange={(key, val) => setNewCoachForm(p => ({ ...p, [key]: val }))}
                      onPhotoFile={uploadNewCoachPhoto}
                      photoUploading={newCoachUploading}
                      onSubmit={createDisplayCoach}
                      saving={newCoachSaving}
                    />

                    {/* ── Liste des coachs existants ── */}
                    {coachsLoading ? (
                      <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>⏳ Chargement…</div>
                    ) : coachsList.length === 0 ? (
                      <div style={{ textAlign:"center", padding:32, color:"#9ca3af", fontSize:13 }}>Aucun coach ajouté pour l'instant.</div>
                    ) : (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
                        {coachsList.map(photo => {
                          const edits      = coachsEdits[photo.id] || {};
                          const photoUrl   = edits.photo_url !== undefined ? edits.photo_url : (photo.photo_url || "");
                          const isActif    = edits.actif    !== undefined ? edits.actif     : (photo.actif !== false);
                          const statut     = isActif ? "actif" : "inactif";
                          const hasChanges = Object.keys(edits).length > 0;
                          const fakeCoach  = { id: photo.id, nom: photo.nom || "", prenom: "", grade: photo.titre || "" };
                          return (
                            <CoachPhotoCard
                              key={photo.id}
                              coach={fakeCoach}
                              photoUrl={photoUrl}
                              statut={statut}
                              hasChanges={hasChanges}
                              uploading={!!coachsUploading[photo.id]}
                              saving={!!coachsSaving[photo.id]}
                              onFile={f => uploadCoachPhoto(fakeCoach, f)}
                              onRemove={() => { if (window.confirm("Supprimer cette photo ?")) setCoachsEdits(p => ({ ...p, [photo.id]: { ...(p[photo.id]||{}), photo_url: "" } })); }}
                              onToggleStatut={() => setCoachsEdits(p => ({ ...p, [photo.id]: { ...(p[photo.id]||{}), actif: !isActif } }))}
                              onUrlChange={val => setCoachsEdits(p => ({ ...p, [photo.id]: { ...(p[photo.id]||{}), photo_url: val } }))}
                              onSave={() => saveCoach(photo)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {platformSubTab === "whatsapp" && (
                  <div>
                    <div style={{ marginBottom:20 }}>
                      <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>💬 Messages WhatsApp — Centres BET</h3>
                      <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>
                        {waLoading ? "⏳ Chargement depuis la base de données…" : "Chaque centre dispose de son propre bouton Enregistrer."}
                      </p>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:16 }}>
                      {waCenters.map((centre, cIdx) => (
                        <div key={centre.key} style={{ background:"#fff", borderRadius:12, padding:16, border:`1.5px solid ${centre.color}33`, boxShadow:"0 1px 4px rgba(0,0,0,0.04)", display:"flex", flexDirection:"column" }}>
                          {/* En-tête centre */}
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ width:10, height:10, borderRadius:"50%", background:centre.color, display:"inline-block", flexShrink:0 }} />
                              <span style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>BET {centre.name}</span>
                            </div>
                            <button onClick={() => resetWACentre(cIdx)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#94a3b8", fontWeight:600, padding:"2px 6px" }} title="Réinitialiser ce centre">↺ reset</button>
                          </div>
                          {/* Assistantes */}
                          <div style={{ flex:1 }}>
                            {centre.assistantes.map((a, aIdx) => (
                              <div key={aIdx} style={{ marginBottom: aIdx < centre.assistantes.length - 1 ? 14 : 0 }}>
                                <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                                  <div style={{ flex:1 }}>
                                    <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:3 }}>Prénom / Nom</label>
                                    <input
                                      value={a.nom}
                                      onChange={e => updateWAField(cIdx, aIdx, "nom", e.target.value)}
                                      style={{ width:"100%", padding:"6px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:12, boxSizing:"border-box" }}
                                      placeholder="Ex : Aminata Koné"
                                    />
                                  </div>
                                  <div style={{ flex:1 }}>
                                    <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:3 }}>Numéro WhatsApp</label>
                                    <input
                                      value={a.phone}
                                      onChange={e => updateWAField(cIdx, aIdx, "phone", e.target.value.replace(/\D/g,""))}
                                      style={{ width:"100%", padding:"6px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:12, boxSizing:"border-box" }}
                                      placeholder="2250700000000"
                                    />
                                  </div>
                                </div>
                                <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:3 }}>Message pré-rempli</label>
                                <textarea
                                  value={a.message}
                                  onChange={e => updateWAField(cIdx, aIdx, "message", e.target.value)}
                                  rows={3}
                                  style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:12, resize:"vertical", fontFamily:"inherit", boxSizing:"border-box", lineHeight:1.5 }}
                                  placeholder="Bonjour, je souhaite…"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Bouton Enregistrer propre à ce centre */}
                          <button
                            onClick={() => saveWACentre(cIdx)}
                            disabled={waSavingIdx === cIdx}
                            style={{ marginTop:14, width:"100%", padding:"9px 0", background: centre.color, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, opacity: waSavingIdx === cIdx ? 0.7 : 1, transition:"opacity .15s" }}
                          >
                            {waSavingIdx === cIdx ? "⏳ Enregistrement…" : "💾 Enregistrer BET " + centre.name}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
                )}
              </div>
            )}

            {/* ================= GESTION DES PERMISSIONS (identique AdminDashboard mais avec rôle viewer) ================= */}
            {activeTab === "permissions" && (
              <div>
                <div style={{ display:"flex", gap:3, marginBottom:20, flexWrap:"wrap", borderBottom:"1px solid #e5e7eb", paddingBottom:8 }}>
                  {permTabs.map(tab => {
                    const isActive = permSubTab === tab.key;
                    return <button key={tab.key} onClick={() => setPermSubTab(tab.key)} style={{ padding:"8px 14px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer", fontWeight:600, fontSize:12, background:isActive?BET_LIGHT:"transparent", color:isActive?BET_COLOR:"#6b7280", display:"flex", alignItems:"center", gap:5 }}><span style={{ fontSize:13 }}>{tab.icon}</span>{tab.label}{tab.badge!==null&&tab.badge!==undefined&&<span style={{ padding:"1px 6px", borderRadius:9, fontSize:10, fontWeight:700, background:tab.danger?"#fee2e2":BET_LIGHT, color:tab.danger?"#dc2626":BET_COLOR }}>{tab.badge}</span>}</button>;
                  })}
                </div>
                {permSubTab === "vue_ensemble" && (
                  <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}><div><h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Vue d'ensemble — Contrôle d'accès</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Tableau de bord de sécurité en temps réel</p></div><div style={{ display:"flex", gap:8 }}><button onClick={()=>setShowCloneModal(true)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>📋 Cloner des permissions</button><button onClick={()=>setShowInviteModal(true)} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Inviter un utilisateur</button></div></div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:26 }}>
                      <KpiCard icon="👥" label="Utilisateurs totaux" value={users.length} color={BET_COLOR} sub={`${stats.actifs} actifs`} onClick={()=>setPermSubTab("utilisateurs")}/>
                      <KpiCard icon="🟢" label="Connexions actives" value={onlineUsers.length} color="#22c55e" sub="En ce moment"/>
                      <KpiCard icon="🔐" label="Sans 2FA activé" value={stats.sans2fa} color={stats.sans2fa>0?BET_RED:BET_COLOR} sub="Utilisateurs à risque" alert={stats.sans2fa>2} onClick={()=>setPermSubTab("securite")}/>
                      <KpiCard icon="📬" label="Demandes en attente" value={stats.enAttente} color="#d97706" sub="À traiter" alert={stats.enAttente>0} onClick={()=>setPermSubTab("demandes")}/>
                      <KpiCard icon="⚠️" label="Alertes sécurité" value={stats.alertes} color={BET_RED} sub="Dernières 48h" alert={stats.alertes>0} onClick={()=>setActiveTab("audit")}/>
                      <KpiCard icon="⏳" label="Accès temporaires" value={stats.tempAccess} color="#7c3aed" sub="Actifs"/>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                      <div><h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:14 }}>Répartition par rôle</h3>{Object.values(ROLES_DEF).reverse().map(r=>{const count=users.filter(u=>u.role===r.id).length;const pct=users.length?Math.round((count/users.length)*100):0;return <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, padding:"10px 14px", borderRadius:10, background:`${r.color}06`, border:`1px solid ${r.border}`, cursor:"pointer" }} onClick={()=>{setFiltreRole(r.id);setPermSubTab("utilisateurs");}}><span style={{ fontSize:20 }}>{r.emoji}</span><div style={{ flex:1 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{r.label}</span><span style={{ fontWeight:800, color:r.color, fontSize:14 }}>{count}</span></div><div style={{ height:5, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}><div style={{ height:"100%", width:`${pct}%`, background:r.color, borderRadius:3 }}/></div></div></div>})}</div>
                      <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}><h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0 }}>Activité récente</h3><button onClick={()=>setActiveTab("audit")} style={{ padding:"5px 10px", background:"none", color:BET_COLOR, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:11 }}>Voir tout →</button></div>{auditLog.slice(0,5).map(a=>{const colors={success:"#059669",danger:BET_RED,warning:"#d97706"};const bgs={success:"#f0fdf4",danger:"#fff1f2",warning:"#fff7ed"};const icons={success:"✅",danger:"🚨",warning:"⚠️"};return <div key={a.id} style={{ display:"flex", gap:10, padding:"9px 12px", borderRadius:9, background:bgs[a.statut]||"#f8fafc", border:`1px solid ${a.statut==="danger"?"#fecdd3":a.statut==="warning"?"#fed7aa":"#e5e7eb"}`, marginBottom:8 }}><span style={{ fontSize:16 }}>{icons[a.statut]||"ℹ️"}</span><div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{a.action.replace(/_/g," ")}</div><div style={{ fontSize:11, color:"#6b7280", marginTop:1 }}>{a.detail.slice(0,55)}{a.detail.length>55?"…":""}</div></div><div style={{ fontSize:10, color:"#9ca3af", flexShrink:0 }}>{a.date.slice(11,16)}</div></div>})}</div>
                    </div></div>
                )}
                {permSubTab === "utilisateurs" && (
                  <div>
                  {loadingUsers && <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:14 }}>⏳ Chargement des utilisateurs…</div>}
                  {!loadingUsers && users.length === 0 && (
                    <div style={{ textAlign:"center", padding:"40px 0" }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
                      <div style={{ fontWeight:700, color:"#0f172a", marginBottom:6 }}>Aucun utilisateur</div>
                      <p style={{ color:"#9ca3af", fontSize:13, marginBottom:16 }}>Créez le premier utilisateur de la plateforme.</p>
                      <button onClick={()=>setShowInviteModal(true)} style={{ padding:"10px 22px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                        ➕ Créer un utilisateur
                      </button>
                    </div>
                  )}
                  {!loadingUsers && users.length > 0 && <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Utilisateurs</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{usersFiltres.length} affiché(s) sur {users.length}</p></div><div style={{ display:"flex", gap:8 }}><button onClick={exportUsers} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Export CSV</button><button onClick={()=>setShowInviteModal(true)} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>+ Inviter</button></div></div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}><input type="text" placeholder="🔍 Nom ou email…" value={searchUser} onChange={e=>setSearchUser(e.target.value)} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:200, marginBottom:0 }} /><div style={{ display:"flex", gap:5 }}>{["Tous","super_admin","admin","manager","responsable","commercial","gestionnaire","coach","data_collector"].map(r=><button key={r} onClick={()=>setFiltreRole(r)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:11, fontWeight:600, cursor:"pointer", background:filtreRole===r?(ROLES_DEF[r]?.color||BET_COLOR):"#fff", color:filtreRole===r?"#fff":"#6b7280", borderColor:filtreRole===r?(ROLES_DEF[r]?.color||BET_COLOR):"#e5e7eb" }}>{r==="Tous"?"Tous":ROLES_DEF[r]?.emoji+" "+ROLES_DEF[r]?.label}</button>)}</div><div style={{ display:"flex", gap:5 }}>{["Tous","Actifs","Inactifs","Sans 2FA","En ligne"].map(s=><button key={s} onClick={()=>setFiltreStatut(s)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:11, cursor:"pointer", background:filtreStatut===s?BET_COLOR:"#fff", color:filtreStatut===s?"#fff":"#6b7280", borderColor:filtreStatut===s?BET_COLOR:"#e5e7eb" }}>{s}</button>)}</div></div>
                    <div style={{ overflowX:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse" }}><thead>
                        <tr style={{ background:"#f9fafb" }}>
                            {["Utilisateur","Rôle","Centre","Identifiants de connexion","Statut","2FA","Dernier accès","Actions"].map(h=><th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:"#6b7280", fontWeight:600 }}>{h}</th>
                        )}</tr></thead>
                        <tbody>{usersFiltres.map(u=>{const r=ROLES_DEF[u.role];
                            const isOnline=onlineUsers.includes(u.id);
                            const isExpired=u.accessTemp&&new Date(u.accessTemp)<new Date();
                            const mdpTemp=tempPasswords[u.id];
                        const mdpVisible = tempPasswords[u.id] || u.mdp_initial;
                        return <tr key={u.id} style={{ borderTop:"1px solid #f1f5f9", background:u.mdp_temporaire&&mdpVisible?"#fffbeb":!u.actif?"#f9fafb":"#fff" }}>
                            <td style={{ padding:"12px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                    <div style={{ position:"relative" }}>
                                        <div style={{ width:36, height:36, borderRadius:"50%", background:`${r?.color||BET_COLOR}18`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:r?.color||BET_COLOR }}>{u.avatar||((u.prenom?.[0]||"")+(u.nom?.[0]||""))}</div>{isOnline&&<div style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%", background:"#22c55e", border:"2px solid #fff" }}/>}</div>
                                        <div><div style={{ fontWeight:600, fontSize:13 }}>{u.prenom} {u.nom}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{u.email}</div></div>
                                </div>
                            </td>
                            <td style={{ padding:"12px" }}><RoleBadge role={u.role}/></td>
                            <td style={{ padding:"12px" }}>{(()=>{
                              const sc = u.scope;
                              if (!sc || sc.includes("national") || u.role==="super_admin") return <span style={{ fontSize:11, color:"#9ca3af" }}>National</span>;
                              const label = sc.map(s=>CENTRES_BET.find(c=>c.id===s)?.label.replace("BET ","") || s).join(", ");
                              return label
                                ? <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, background:"#e0f2fe", color:"#0369a1", fontSize:11, fontWeight:600 }}>🏢 {label}</span>
                                : <span style={{ fontSize:11, color:"#fca5a5", fontWeight:600 }}>⚠ Non assigné</span>;
                            })()}</td>
                            <td style={{ padding:"12px", minWidth:240 }}>
                              <div style={{ fontSize:11, color:"#9ca3af", marginBottom:2 }}>Email</div>
                              <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
                                {u.email}
                                <button onClick={()=>{navigator.clipboard.writeText(u.email);toast.success("Email copié !");}} title="Copier l'email" style={{ padding:"2px 6px", background:"#f3f4f6", border:"none", borderRadius:4, cursor:"pointer", fontSize:10 }}>📋</button>
                              </div>
                              <div style={{ fontSize:11, color:"#9ca3af", marginBottom:2 }}>Mot de passe</div>
                              {mdpVisible ? (
                                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                  <code style={{ padding:"4px 10px", borderRadius:6, background:"#fef3c7", border:"1px solid #fcd34d", fontSize:13, fontWeight:800, color:"#92400e", letterSpacing:"0.04em" }}>{mdpVisible}</code>
                                  <button onClick={()=>{navigator.clipboard.writeText(mdpVisible);toast.success("Mot de passe copié !");}} title="Copier" style={{ padding:"3px 7px", background:"#f59e0b", color:"#fff", border:"none", borderRadius:5, cursor:"pointer", fontSize:10, fontWeight:700 }}>📋</button>
                                </div>
                              ) : (
                                <span style={{ fontSize:11, color:"#d1d5db" }}>— non disponible</span>
                              )}
                            </td>
                            <td style={{ padding:"12px" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><ToggleSwitch on={u.actif} onChange={()=>toggleUserStatus(u.id)} color="#22c55e"/><span style={{ fontSize:11, color:u.actif?"#22c55e":"#9ca3af", fontWeight:600 }}>{u.actif?"Actif":"Inactif"}</span></div></td>
                            <td style={{ padding:"12px" }}><div style={{ display:"flex", alignItems:"center", gap:6 }}><ToggleSwitch on={u.twofa} onChange={()=>toggle2FA(u.id, !u.twofa)} color={BET_COLOR}/>{!u.twofa&&u.actif&&<span style={{ fontSize:10, color:BET_RED, fontWeight:700 }}>⚠️</span>}</div></td>
                            <td style={{ padding:"12px", fontSize:12, color:"#6b7280" }}>{u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString("fr-FR") : "—"}</td>
                            <td style={{ padding:"12px" }}>
                              <div style={{ display:"flex", gap:5 }}>
                                <button onClick={()=>{setEditingUser(u);setShowUserModal(true);}} title="Modifier" style={{ padding:"5px 10px", background:BET_LIGHT, color:BET_DARK, border:`1px solid ${BET_COLOR}40`, borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️</button>
                                <button onClick={()=>renvoyerAcces(u.id)} title="Afficher les accès" style={{ padding:"5px 10px", background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600 }}>✉️</button>
                                <button onClick={()=>{setEditingRole(u.role);setPermSubTab("matrice");}} title="Permissions" style={{ padding:"5px 10px", background:BET_LIGHT, color:BET_DARK, border:`1px solid ${BET_COLOR}40`, borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600 }}>🔐</button>
                              </div>
                            </td>
                        </tr>})}</tbody></table></div></div>}
                  </div>
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
                    {stats.sans2fa>0&&<div style={{ padding:"14px 18px", borderRadius:12, background:"#fff7ed", border:"1px solid #fed7aa", marginBottom:20, display:"flex", gap:12, alignItems:"center" }}><span style={{ fontSize:22 }}>⚠️</span><div><div style={{ fontWeight:700, fontSize:14, color:"#92400e" }}>{stats.sans2fa} utilisateur(s) actif(s) sans authentification 2FA</div><div style={{ fontSize:12, color:"#b45309" }}>Renforcez la sécurité en forçant le 2FA pour ces comptes.</div></div><button onClick={async()=>{
  const cibles = users.filter(u=>u.actif&&!u.twofa);
  setUsers(prev=>prev.map(u=>({...u,twofa:u.actif?true:u.twofa})));
  addAuditEntry("2FA_FORCE_GLOBAL","2FA activé de force sur tous les comptes actifs");
  toast.success(`2FA forcé sur ${cibles.length} compte(s) ✓`);
  await Promise.allSettled(cibles.map(u=>fetch(`${API_URL}/api/admin/utilisateurs/${u.id}`,{method:"PATCH",headers:authHeaders(),body:JSON.stringify({twofa_active:true})})));
}} style={{ ...btnPrimary, marginLeft:"auto", background:BET_RED, whiteSpace:"nowrap" }}>🔒 Forcer le 2FA sur tous</button></div>}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:18 }}>{Object.entries(securite).map(([roleId,pol])=>{const r=ROLES_DEF[roleId];return <div key={roleId} style={{ borderRadius:14, border:`1.5px solid ${r.border}`, padding:20, background:"#fff" }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${r.border}` }}><span style={{ fontSize:24 }}>{r.emoji}</span><div><div style={{ fontWeight:700, fontSize:15, color:r.color }}>{r.label}</div><div style={{ fontSize:11, color:"#9ca3af" }}>Niveau {r.niveau} · {users.filter(u=>u.role===roleId).length} utilisateur(s)</div></div></div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}><div><div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>🔐 2FA obligatoire</div><div style={{ fontSize:11, color:"#9ca3af" }}>Authentification à 2 facteurs</div></div><ToggleSwitch on={pol.twofa_obligatoire} color={r.color} onChange={(v)=>{setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],twofa_obligatoire:v}}));addAuditEntry("POLITIQUE_2FA",`${r.label} : 2FA obligatoire → ${v?"activé":"désactivé"}`,"warning");}}/></div>
                      <div style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}><span style={{ fontWeight:600, color:"#374151" }}>⏱ Expiration session</span><strong style={{ color:r.color }}>{pol.expiration_session} min</strong></div><input type="range" min={15} max={480} step={15} value={pol.expiration_session} onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],expiration_session:Number(e.target.value)}}))}/><div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#d1d5db", marginTop:2 }}><span>15 min</span><span>8h</span></div></div>
                      <div style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}><span style={{ fontWeight:600, color:"#374151" }}>🔄 Tentatives max</span><strong style={{ color:r.color }}>{pol.tentatives_max}</strong></div><input type="range" min={2} max={10} step={1} value={pol.tentatives_max} onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],tentatives_max:Number(e.target.value)}}))}/></div>
                      <div style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}><span style={{ fontWeight:600, color:"#374151" }}>🔑 Rotation mdp</span><strong style={{ color:r.color }}>{pol.rotation_pwd_jours} jours</strong></div><input type="range" min={30} max={365} step={30} value={pol.rotation_pwd_jours} onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],rotation_pwd_jours:Number(e.target.value)}}))}/></div>
                      <div style={{ marginBottom:10 }}><label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>🛡️ Complexité mot de passe</label><select value={pol.complexite_pwd} onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],complexite_pwd:e.target.value}}))} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%" }}><option value="normale">Normale (8 car. minimum)</option><option value="moyenne">Moyenne (12 car. + chiffres)</option><option value="haute">Haute (12 car. + spéciaux)</option><option value="tres_haute">Très haute (16 car. + tout)</option></select></div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}><div><div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>🌐 Restriction IP</div><div style={{ fontSize:11, color:"#9ca3af" }}>Limiter aux IPs autorisées</div></div><ToggleSwitch on={pol.ip_restriction} color={r.color} onChange={(v)=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],ip_restriction:v}}))}/></div></div>})}</div></div>
                )}
                {permSubTab === "demandes" && (
                  <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}><div><h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Demandes d'accès</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{demandes.filter(d=>d.statut==="en_attente").length} demande(s) en attente de traitement</p></div></div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>{demandes.map(d=>{const r=ROLES_DEF[d.roleDemande];const statutMeta={en_attente:{bg:"#fef3c7",c:"#92400e",label:"⏳ En attente"},approuve:{bg:"#dcfce7",c:"#166534",label:"✅ Approuvé"},refuse:{bg:"#fee2e2",c:"#991b1b",label:"❌ Refusé"}};const sm=statutMeta[d.statut];return <div key={d.id} style={{ borderRadius:14, border:`1.5px solid ${d.statut==="en_attente"?r?.border:"#e5e7eb"}`, background:"#fff", overflow:"hidden" }}><div style={{ height:4, background:d.statut==="en_attente"?r?.color||BET_COLOR:d.statut==="approuve"?"#22c55e":"#9ca3af" }}/><div style={{ padding:18 }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}><div style={{ display:"flex", gap:10, alignItems:"center" }}><div style={{ width:40, height:40, borderRadius:"50%", background:`${r?.color||BET_COLOR}15`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:r?.color||BET_COLOR }}>{d.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div><div><div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{d.nom}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{d.email}</div></div></div><span style={{ padding:"3px 9px", borderRadius:10, fontSize:11, fontWeight:700, background:sm.bg, color:sm.c }}>{sm.label}</span></div><div style={{ marginBottom:10 }}><div style={{ fontSize:11, color:"#9ca3af", marginBottom:5 }}>Entreprise · Date</div><div style={{ fontSize:13, color:"#374151" }}>🏢 {d.entreprise} · 📅 {formatDate(d.date)}</div></div><div style={{ marginBottom:10 }}><div style={{ fontSize:11, color:"#9ca3af", marginBottom:5 }}>Rôle demandé</div><RoleBadge role={d.roleDemande}/></div><div style={{ padding:"9px 12px", borderRadius:8, background:"#f8fafc", fontSize:12, color:"#374151", lineHeight:1.5, marginBottom:14 }}>💬 {d.justification}</div>{d.statut==="en_attente"&&<div style={{ display:"flex", gap:8 }}><button onClick={()=>handleDemande(d.id,"approuver")} style={{ ...btnPrimary, flex:1, textAlign:"center", background:"#22c55e" }}>✅ Approuver</button><button onClick={()=>handleDemande(d.id,"refuser")} style={{ ...btnSecondary, flex:1, textAlign:"center", background:"#fee2e2", color:BET_RED, border:`1px solid #fecdd3` }}>❌ Refuser</button><button onClick={()=>{setSelectedDemande(d);setShowDemandeModal(true);}} style={{ ...btnSecondary, padding:"9px 11px" }}>🔍</button></div>}</div></div>})}</div></div>
                )}
              </div>
            )}

            {/* ================= ONGLET AUDIT GLOBAL ================= */}
            {activeTab === "audit" && (
              <div><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}><div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📜 Journal d'Audit global</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Traçabilité complète de toutes les actions sur la plateforme</p></div><button onClick={()=>{const csv="Acteur,Rôle,Action,Détail,Date,IP,Statut\n"+auditLog.map(a=>[a.acteur,a.role,a.action,`"${a.detail}"`,a.date,a.ip,a.statut].join(",")).join("\n");const el=document.createElement("a");el.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv);el.download=`superadmin_audit_${new Date().toISOString().split("T")[0]}.csv`;el.click();toast.success("Export CSV effectué");}} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Export complet</button></div>
                <div style={{ display:"flex", gap:8, marginBottom:16 }}>{["Tous","success","warning","danger"].map(f=>{const meta={Tous:{bg:"#f3f4f6",c:"#374151"},success:{bg:"#dcfce7",c:"#166534"},warning:{bg:"#fef3c7",c:"#92400e"},danger:{bg:"#fee2e2",c:"#991b1b"}};const m=meta[f];return <button key={f} onClick={()=>setFiltreAudit(f)} style={{ padding:"5px 14px", borderRadius:20, border:"1px solid", fontSize:12, cursor:"pointer", background:filtreAudit===f?m.bg:"#fff", color:filtreAudit===f?m.c:"#6b7280", borderColor:filtreAudit===f?m.bg:"#e5e7eb", fontWeight:filtreAudit===f?700:400 }}>{f==="Tous"?"Tous":f==="success"?"✅ Succès":f==="warning"?"⚠️ Attention":"🚨 Alertes"}</button>})}<span style={{ fontSize:12, color:"#9ca3af", alignSelf:"center", marginLeft:"auto" }}>{auditFiltres.length} entrée(s)</span></div>
                <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse" }}><thead><tr style={{ background:"#f9fafb" }}><th style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:"#6b7280", fontWeight:600 }}></th><th>Acteur</th><th>Action</th><th>Détail</th><th>Date & Heure</th><th>IP Source</th></tr></thead><tbody>{auditFiltres.map(a=>{const meta={success:{bg:"#f0fdf4",dot:"#22c55e",c:"#166534"},warning:{bg:"#fff7ed",dot:"#f59e0b",c:"#92400e"},danger:{bg:"#fff1f2",dot:"#ef4444",c:"#991b1b"}};const m=meta[a.statut]||meta.success;const r=ROLES_DEF[a.role];return <tr key={a.id} style={{ borderTop:"1px solid #f1f5f9", background:a.statut==="danger"?"#fff8f8":a.statut==="warning"?"#fffaf0":"#fff" }}><td style={{ padding:"10px 12px" }}><div style={{ width:8, height:8, borderRadius:"50%", background:m.dot, boxShadow:`0 0 0 3px ${m.dot}30` }}/></td><td style={{ padding:"10px 12px" }}><div style={{ fontWeight:600, fontSize:13 }}>{a.acteur}</div>{r&&<RoleBadge role={a.role}/>}</td><td style={{ padding:"10px 12px" }}><span style={{ padding:"3px 9px", borderRadius:8, fontSize:11, fontWeight:700, background:m.bg, color:m.c }}>{a.action.replace(/_/g," ")}</span></td><td style={{ padding:"10px 12px", fontSize:12, color:"#374151", maxWidth:260 }}>{a.detail}</td><td style={{ padding:"10px 12px", fontSize:12, color:"#6b7280", whiteSpace:"nowrap" }}>{a.date}</td><td style={{ padding:"10px 12px" }}><code style={{ fontSize:11, padding:"2px 7px", borderRadius:5, background:"#f3f4f6", color:"#374151" }}>{a.ip}</code></td></tr>})}</tbody></table></div></div>
            )}

            {/* ================= ONGLET LOGS SYSTÈME ================= */}
            {activeTab === "logs" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📋 Logs système</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Événements techniques et erreurs serveur</p></div>
                  <button onClick={()=>toast.success("Logs téléchargés")} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Télécharger logs</button>
                </div>
                <div style={{ background:"#0f172a", color:"#e2e8f0", borderRadius:12, padding:16, fontFamily:"monospace", fontSize:12, overflowX:"auto" }}>
                  <pre style={{ margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
{`[2025-12-14 08:30:12] INFO  - Super Admin connecté depuis IP 192.168.1.1
[2025-12-14 07:15:45] WARN  - Tentative de connexion échouée (admin@bet.com) depuis 203.0.113.5
[2025-12-13 22:00:00] INFO  - Sauvegarde automatique de la base de données effectuée
[2025-12-13 14:20:33] ERROR - Timeout sur le module d'envoi d'emails (SMTP)
[2025-12-13 09:12:07] INFO  - Mise à jour des permissions du rôle 'manager' par super_admin
[2025-12-12 23:45:10] WARN  - 2FA non activé pour 3 utilisateurs (alerte sécurité)
[2025-12-12 10:00:00] INFO  - Génération du rapport mensuel (CA, apprenants, etc.)`}
                  </pre>
                </div>
              </div>
            )}

            {/* ================= ONGLET TRAFIC WEB ================= */}
            {activeTab === "trafic" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🌐 Trafic web — Vue globale plateforme</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Audience et comportement de l'ensemble des visiteurs</p></div>
                  <div style={{ fontSize:12, color:"#9ca3af" }}>Mise à jour : {formatDate(new Date())}</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:12, marginBottom:24 }}>
                  <StatCard label="Visites (30j)" value={SA_TRAFIC.visites.toLocaleString()} color={BET_COLOR} icon="👀" />
                  <StatCard label="Pages vues" value={SA_TRAFIC.pagesVues.toLocaleString()} color="#2563eb" icon="📄" />
                  <StatCard label="Taux de rebond" value={`${SA_TRAFIC.tauxRebond}%`} color="#d97706" icon="🔄" />
                  <StatCard label="Taux conversion form." value={`${SA_TRAFIC.tauxConversionForm}%`} color="#059669" icon="📝" />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Sources de trafic</div>
                    {SA_TRAFIC.sources.map(s => <div key={s.name} style={{ marginBottom:12 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}><span>{s.name}</span><span style={{ fontWeight:700 }}>{s.part}%</span></div><ProgressBar value={s.part} color={BET_COLOR} /></div>)}
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Pages les plus consultées</div>
                    {SA_TRAFIC.pagesPopulaires.map(p => <div key={p.titre} style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:13, padding:"6px 0", borderBottom:"1px solid #e5e7eb" }}><span style={{ color:"#6b7280" }}>{p.titre}</span><strong>{p.vues.toLocaleString()}</strong></div>)}
                  </div>
                </div>
              </div>
            )}

            {/* ================= ONGLET CLIENTS & PROSPECTS ================= */}
            {activeTab === "clients" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>👥 Clients & Prospects — Plateforme globale</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Funnel de conversion et portefeuille clients total</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
                  <StatCard label="Prospects totaux" value={SA_CLIENTS.prospects.toLocaleString()} color="#6366f1" icon="👤" />
                  <StatCard label="Inscrits actifs" value={SA_CLIENTS.inscritsActifs.toLocaleString()} color="#22c55e" icon="✅" />
                  <StatCard label="Nouveaux clients (mois)" value={SA_CLIENTS.nouveauxClientsMois} color="#f59e0b" icon="🆕" />
                  <StatCard label="Taux conversion" value={`${SA_CLIENTS.tauxConversion}%`} color={BET_COLOR} icon="📈" sub="Prospect → Client" />
                </div>
                <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Évolution mensuelle — Nouveaux prospects</div>
                  <ProgressBar value={65} color={BET_COLOR} height={10} />
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11, color:"#9ca3af" }}><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span></div>
                  <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                    <div style={{ padding:12, borderRadius:10, background:"#fff", border:"1px solid #e5e7eb", textAlign:"center" }}><div style={{ fontSize:11, color:"#9ca3af" }}>Entités clientes actives</div><div style={{ fontSize:22, fontWeight:800, color:BET_COLOR }}>45</div></div>
                    <div style={{ padding:12, borderRadius:10, background:"#fff", border:"1px solid #e5e7eb", textAlign:"center" }}><div style={{ fontSize:11, color:"#9ca3af" }}>Apprenants actifs</div><div style={{ fontSize:22, fontWeight:800, color:"#22c55e" }}>{SA_CLIENTS.inscritsActifs.toLocaleString()}</div></div>
                    <div style={{ padding:12, borderRadius:10, background:"#fff", border:"1px solid #e5e7eb", textAlign:"center" }}><div style={{ fontSize:11, color:"#9ca3af" }}>Taux rétention</div><div style={{ fontSize:22, fontWeight:800, color:"#d97706" }}>78%</div></div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= ONGLET OFFRES & FORMATIONS ================= */}
            {activeTab === "offres" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🎓 Offres & Formations — Toute la plateforme</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Performance commerciale globale des produits BET</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:16, marginBottom:24 }}>
                  {SA_OFFRES.map(offre => (
                    <div key={offre.id} style={{ border:`1px solid ${BET_COLOR}20`, borderRadius:12, padding:16, background:"#fff" }}>
                      <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{offre.nom}</div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:12, padding:"2px 8px", borderRadius:8, background:"#f3f4f6", display:"inline-block" }}>{offre.type}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:8 }}><span>Apprenants inscrits</span><strong>{offre.nbInscrits.toLocaleString()}</strong></div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:10 }}><span>Chiffre d'affaires</span><strong style={{ color:"#059669" }}>{formatMoney(offre.chiffre)}</strong></div>
                      <div><div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}><span>Taux de remplissage</span><span style={{ fontWeight:700, color:offre.tauxRemplissage>=85?"#22c55e":offre.tauxRemplissage>=70?"#f59e0b":"#ef4444" }}>{offre.tauxRemplissage}%</span></div><ProgressBar value={offre.tauxRemplissage} color={offre.tauxRemplissage>=85?"#22c55e":offre.tauxRemplissage>=70?"#f59e0b":"#ef4444"} /></div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Répartition par type — Total inscrits</div>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                    {Object.entries(SA_REPARTITION_TYPE).map(([type,nb]) => (
                      <div key={type} style={{ flex:1, minWidth:120, textAlign:"center", background:"#fff", borderRadius:10, padding:"14px 10px", border:`1px solid ${BET_COLOR}20` }}>
                        <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>{type}</div>
                        <div style={{ fontSize:24, fontWeight:800, color:BET_COLOR }}>{nb}</div>
                        <div style={{ fontSize:10, color:"#9ca3af" }}>apprenants</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= ONGLET CHIFFRE D'AFFAIRES ================= */}
            {activeTab === "ca" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>💰 Chiffre d'affaires — Plateforme globale</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Suivi financier complet de toutes les structures</p></div>
                  <button onClick={()=>toast.success("Export CA généré")} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Export CA</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
                  <StatCard label="CA total annuel" value={formatMoney(SA_CA.total)} color="#059669" icon="💰" sub={`+${PLATEFORME_STATS.tauxCroissance}% vs N-1`} />
                  <StatCard label="Paiements reçus" value={formatMoney(SA_CA.paiementsRecus)} color={BET_COLOR} icon="✅" />
                  <StatCard label="Paiements en attente" value={formatMoney(SA_CA.paiementsAttente)} color="#d97706" icon="⏳" />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>CA par offre</div>
                    {Object.entries(SA_CA.parOffre).map(([offre,val]) => (
                      <div key={offre} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}><span>{offre}</span><strong style={{ color:"#059669" }}>{formatMoney(val)}</strong></div>
                        <ProgressBar value={Math.round((val/SA_CA.total)*100)} color={BET_COLOR} />
                      </div>
                    ))}
                    <div style={{ marginTop:16 }}>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Moyens de paiement</div>
                      {Object.entries(SA_CA.moyenPaiement).map(([moyen,pct]) => <div key={moyen} style={{ marginBottom:8 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}><span>{moyen}</span><span style={{ fontWeight:700 }}>{pct}%</span></div><ProgressBar value={pct} color="#7c3aed" /></div>)}
                    </div>
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>CA par période (12 mois)</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {Object.entries(SA_CA.parPeriode).map(([mois,val]) => (
                        <div key={mois} style={{ flex:1, minWidth:70, textAlign:"center", background:"#fff", borderRadius:8, padding:"8px 4px", border:"1px solid #e5e7eb" }}>
                          <div style={{ fontSize:10, color:"#9ca3af" }}>{mois}</div>
                          <div style={{ fontSize:11, fontWeight:700, color:BET_COLOR }}>{(val/1000000).toFixed(1)}M</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= ONGLET PAIEMENTS ================= */}
            {activeTab === "paiements" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>💳 Paiements — Historique global</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Toutes les transactions de la plateforme</p></div>
                  <button onClick={()=>toast.success("Historique des transactions exporté")} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Export transactions</button>
                </div>
                <div style={{ display:"flex", gap:12, marginBottom:20 }}>
                  <StatCard label="Transactions validées" value={SA_TRANSACTIONS.filter(t=>t.statut==="validé").length} color="#22c55e" icon="✅" />
                  <StatCard label="En attente" value={SA_TRANSACTIONS.filter(t=>t.statut==="en_attente").length} color="#f59e0b" icon="⏳" />
                  <StatCard label="Échecs" value={SA_TRANSACTIONS.filter(t=>t.statut==="echoué").length} color={BET_RED} icon="❌" />
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                      <th style={{ padding:10, textAlign:"left" }}>Client</th>
                      <th style={{ padding:10 }}>Montant</th>
                      <th style={{ padding:10 }}>Date</th>
                      <th style={{ padding:10 }}>Moyen de paiement</th>
                      <th style={{ padding:10 }}>Statut</th>
                    </tr></thead>
                    <tbody>
                      {SA_TRANSACTIONS.map(t => (
                        <tr key={t.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:13 }}>
                          <td style={{ padding:"10px" }}><strong>{t.client}</strong></td>
                          <td style={{ padding:"10px", fontWeight:700, color:"#0f172a" }}>{formatMoney(t.montant)}</td>
                          <td style={{ padding:"10px", color:"#6b7280" }}>{formatDate(t.date)}</td>
                          <td style={{ padding:"10px" }}><span style={{ padding:"3px 10px", borderRadius:8, background:"#f3f4f6", fontSize:12 }}>{t.moyen}</span></td>
                          <td style={{ padding:"10px" }}>
                            <span style={{ padding:"3px 10px", borderRadius:10, fontSize:12, fontWeight:700, background:t.statut==="validé"?"#dcfce7":t.statut==="en_attente"?"#fef3c7":"#fee2e2", color:t.statut==="validé"?"#166534":t.statut==="en_attente"?"#92400e":"#991b1b" }}>
                              {t.statut==="validé"?"✅ Validé":t.statut==="en_attente"?"⏳ En attente":"❌ Échoué"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= ONGLET PROGRESSION APPRENANTS ================= */}
            {activeTab === "progression" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📈 Progression des apprenants — Vue globale</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Indicateurs pédagogiques de l'ensemble de la plateforme</p></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
                  <StatCard label="Progression moyenne" value={`${SA_PROGRESSION.moyenneProgression}%`} color="#2563eb" icon="📈" />
                  <StatCard label="Assiduité moyenne" value={`${SA_PROGRESSION.assiduiteMoyenne}%`} color="#059669" icon="⏱️" />
                  <StatCard label="Bulletins générés" value={SA_PROGRESSION.bulletinsGeneres.toLocaleString()} color="#d97706" icon="📄" />
                  <StatCard label="Certificats délivrés" value={SA_PROGRESSION.certificatsDelivres.toLocaleString()} color={BET_COLOR} icon="🏅" />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Résultats moyens par niveau CECRL</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {Object.entries(SA_PROGRESSION.resultatsParNiveau).map(([niveau,score]) => (
                        <div key={niveau} style={{ flex:1, minWidth:60, textAlign:"center", background:"#fff", borderRadius:8, padding:10, border:"1px solid #e5e7eb" }}>
                          <div style={{ fontWeight:700, fontSize:13, color:"#374151" }}>{niveau}</div>
                          <div style={{ fontSize:18, fontWeight:800, color:score>=80?"#22c55e":score>=65?"#f59e0b":"#ef4444" }}>{score}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Indicateurs clés pédagogiques</div>
                    {[
                      { label:"Taux de progression moyen", value:`${SA_PROGRESSION.moyenneProgression}%`, color:"#2563eb" },
                      { label:"Assiduité globale",          value:`${SA_PROGRESSION.assiduiteMoyenne}%`,    color:"#059669" },
                      { label:"Taux de certification",      value:`${Math.round((SA_PROGRESSION.certificatsDelivres/SA_CLIENTS.inscritsActifs)*100)}%`, color:BET_COLOR },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}><span>{item.label}</span><strong style={{ color:item.color }}>{item.value}</strong></div>
                        <ProgressBar value={parseFloat(item.value)} color={item.color} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= ONGLET REQUÊTES & SUPPORT ================= */}
            {activeTab === "support" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div><h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🛠️ Requêtes & Support — Toutes les structures</h2><p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Suivi global des demandes clients et temps de traitement</p></div>
                  <button onClick={()=>toast.success("Export des requêtes effectué")} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Export requêtes</button>
                </div>
                <div style={{ display:"flex", gap:12, marginBottom:20 }}>
                  <StatCard label="Requêtes ouvertes" value={SA_REQUETES.filter(r=>r.statut==="ouvert").length} color={BET_RED} icon="🔴" />
                  <StatCard label="En cours" value={SA_REQUETES.filter(r=>r.statut==="en_cours").length} color="#f59e0b" icon="🟡" />
                  <StatCard label="Résolues" value={SA_REQUETES.filter(r=>r.statut==="résolu").length} color="#22c55e" icon="🟢" />
                  <StatCard label="Temps moyen traitement" value={`${SA_TEMPS_MOYEN} h`} color="#7c3aed" icon="⏱️" />
                </div>
                <div style={{ overflowX:"auto", marginBottom:16 }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"#f9fafb", fontSize:12, color:"#6b7280" }}>
                      <th style={{ padding:10, textAlign:"left" }}>Client</th>
                      <th style={{ padding:10, textAlign:"left" }}>Sujet</th>
                      <th style={{ padding:10 }}>Catégorie</th>
                      <th style={{ padding:10 }}>Statut</th>
                      <th style={{ padding:10 }}>Date</th>
                      <th style={{ padding:10 }}>Traitement (h)</th>
                    </tr></thead>
                    <tbody>
                      {SA_REQUETES.map(r => (
                        <tr key={r.id} style={{ borderTop:"1px solid #e5e7eb", fontSize:12 }}>
                          <td style={{ padding:8 }}><strong>{r.client}</strong></td>
                          <td style={{ padding:8 }}>{r.sujet}</td>
                          <td style={{ padding:8 }}><span style={{ padding:"2px 8px", borderRadius:8, background:"#f3f4f6", fontSize:11 }}>{r.categorie}</span></td>
                          <td style={{ padding:8 }}>
                            <span style={{ padding:"2px 8px", borderRadius:10, fontWeight:700, fontSize:11, background:r.statut==="ouvert"?"#fee2e2":r.statut==="en_cours"?"#fef3c7":"#dcfce7", color:r.statut==="ouvert"?"#dc2626":r.statut==="en_cours"?"#92400e":"#166534" }}>
                              {r.statut}
                            </span>
                          </td>
                          <td style={{ padding:8, color:"#6b7280" }}>{formatDate(r.date)}</td>
                          <td style={{ padding:8, fontWeight:600 }}>{r.tempsTraitement || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ background:"#f8fafc", borderRadius:12, padding:14, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {["Technique","Facturation","Certification","Pédagogique"].map(cat => {
                    const count = SA_REQUETES.filter(r=>r.categorie===cat).length;
                    return <div key={cat} style={{ background:"#fff", borderRadius:8, padding:"10px 12px", border:"1px solid #e5e7eb", textAlign:"center" }}><div style={{ fontSize:11, color:"#9ca3af" }}>{cat}</div><div style={{ fontSize:20, fontWeight:800, color:BET_COLOR }}>{count}</div></div>;
                  })}
                </div>
              </div>
            )}

            {/* ================= ONGLET COACHS ================= */}
            {activeTab === "coachs" && (() => {
              const coachActifs   = COACHS_MOCK.filter(c=>c.statut==="actif").length;
              const sessionsTotal = COACHS_MOCK.reduce((s,c)=>s+c.planning.length,0);
              const presenceMoy   = Math.round(COACHS_MOCK.filter(c=>c.statut==="actif").reduce((s,c)=>s+c.tauxPresence,0)/coachActifs);
              const examAVenir    = COACHS_MOCK.flatMap(c=>c.examens).filter(e=>e.statut==="À venir").length;

              const subTabs = [
                { key:"liste",    label:"Liste & KPIs" },
                { key:"planning", label:"Planning global" },
                { key:"examens",  label:"Examens" },
              ];

              return (
                <div>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>👨‍🏫 Gestion des Coachs</h2>
                      <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Supervision des formateurs BET — plannings, examens, performance</p>
                    </div>
                    <button onClick={()=>toast.success("Export effectué")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇ Exporter CSV</button>
                  </div>

                  {/* KPIs */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
                    {[
                      { icon:"👨‍🏫", label:"Coachs actifs",         value:`${coachActifs}/${COACHS_MOCK.length}`, color:BET_COLOR,   sub:"1 en congé" },
                      { icon:"📅", label:"Sessions / semaine",      value:sessionsTotal,                          color:"#8b5cf6",   sub:"Toutes classes confondues" },
                      { icon:"✅", label:"Présence moy. classes",   value:`${presenceMoy}%`,                      color:"#22c55e",   sub:"Semaine en cours" },
                      { icon:"📝", label:"Examens à venir",         value:examAVenir,                             color:"#f59e0b",   sub:"Dans les 30 prochains jours" },
                    ].map((k,i) => <StatCard key={i} {...k} />)}
                  </div>

                  {/* Sub-tabs */}
                  <div style={{ display:"flex", gap:4, borderBottom:"2px solid #e5e7eb", marginBottom:20 }}>
                    {subTabs.map(t => (
                      <button key={t.key} onClick={()=>setCoachSubTab(t.key)} style={{ padding:"8px 16px", border:"none", background:"none", fontWeight:700, fontSize:13, cursor:"pointer", color:coachSubTab===t.key?BET_COLOR:"#64748b", borderBottom:coachSubTab===t.key?`2px solid ${BET_COLOR}`:"2px solid transparent", marginBottom:-2 }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* ── SUB-TAB : LISTE ── */}
                  {coachSubTab === "liste" && (
                    <div>
                      <div style={{ overflowX:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                          <thead>
                            <tr style={{ background:"#f8fafc" }}>
                              {["Coach","Spécialité","Centre","Classes","Apprenants","Taux présence","Prochain cours","Statut",""].map(h=>(
                                <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9ca3af", borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {COACHS_MOCK.map(coach => (
                              <tr key={coach.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                                <td style={{ padding:"10px 12px" }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                    <div style={{ width:36, height:36, borderRadius:"50%", background:BET_COLOR+"20", color:BET_COLOR, fontWeight:800, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{coach.initiales}</div>
                                    <div>
                                      <div style={{ fontWeight:700, color:"#0f172a" }}>{coach.nom}</div>
                                      <div style={{ fontSize:11, color:"#9ca3af" }}>{coach.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding:"10px 12px", fontSize:12, color:"#475569" }}>{coach.specialite}</td>
                                <td style={{ padding:"10px 12px" }}><span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:"#e0f2fe", color:BET_COLOR }}>{coach.centre}</span></td>
                                <td style={{ padding:"10px 12px", fontWeight:700, textAlign:"center" }}>{coach.classes}</td>
                                <td style={{ padding:"10px 12px", fontWeight:700, textAlign:"center" }}>{coach.apprenants}</td>
                                <td style={{ padding:"10px 12px" }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                    <div style={{ flex:1, height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                                      <div style={{ width:`${coach.tauxPresence}%`, height:"100%", background: coach.tauxPresence>=85?"#22c55e":coach.tauxPresence>=70?"#f59e0b":"#ef4444", borderRadius:3 }} />
                                    </div>
                                    <span style={{ fontSize:12, fontWeight:700, color: coach.tauxPresence>=85?"#22c55e":coach.tauxPresence>=70?"#f59e0b":"#ef4444", minWidth:32 }}>{coach.tauxPresence}%</span>
                                  </div>
                                </td>
                                <td style={{ padding:"10px 12px", fontSize:12, color:"#64748b" }}>{coach.prochainCours}</td>
                                <td style={{ padding:"10px 12px" }}>
                                  <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                                    background: coach.statut==="actif"?"#d1fae5":coach.statut==="conge"?"#fff7ed":"#fee2e2",
                                    color:       coach.statut==="actif"?"#065f46":coach.statut==="conge"?"#92400e":"#dc2626" }}>
                                    {coach.statut==="actif"?"✅ Actif":coach.statut==="conge"?"🏖 Congé":"❌ Inactif"}
                                  </span>
                                </td>
                                <td style={{ padding:"10px 12px" }}>
                                  <button onClick={()=>setSelectedCoach(coach)} style={{ padding:"5px 12px", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:12 }}>Détail →</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── SUB-TAB : PLANNING ── */}
                  {coachSubTab === "planning" && (
                    <div>
                      {["Lun","Mar","Mer","Jeu","Ven","Sam"].map(jour => {
                        const sessions = COACHS_MOCK.flatMap(c => c.planning.filter(p=>p.jour===jour).map(p=>({...p, coach:c.nom})));
                        if (!sessions.length) return null;
                        return (
                          <div key={jour} style={{ marginBottom:16 }}>
                            <div style={{ fontWeight:800, fontSize:13, color:"#0f172a", marginBottom:8, padding:"6px 12px", background:"#f0f9ff", borderRadius:6, borderLeft:`3px solid ${BET_COLOR}` }}>{jour}</div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
                              {sessions.map((s,i) => (
                                <div key={i} style={{ background:"#fff", border:"1px solid #e0f2fe", borderRadius:10, padding:"12px 14px" }}>
                                  <div style={{ fontWeight:700, color:BET_COLOR, fontSize:13 }}>{s.horaire}</div>
                                  <div style={{ fontWeight:600, color:"#0f172a", margin:"4px 0 2px" }}>{s.classe}</div>
                                  <div style={{ fontSize:12, color:"#64748b" }}>👨‍🏫 {s.coach} · 📍 {s.salle} · 👥 {s.apprenants} apprenant(s)</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── SUB-TAB : EXAMENS ── */}
                  {coachSubTab === "examens" && (
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                        <thead>
                          <tr style={{ background:"#f8fafc" }}>
                            {["Titre","Coach","Classe","Date","Participants","Note moy.","Statut"].map(h=>(
                              <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9ca3af", borderBottom:"1px solid #e5e7eb" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {COACHS_MOCK.flatMap(c => c.examens.map((e,i) => ({ ...e, coach:c.nom, key:`${c.id}-${i}` }))).map(e => (
                            <tr key={e.key} style={{ borderBottom:"1px solid #f1f5f9" }}>
                              <td style={{ padding:"10px 12px", fontWeight:600 }}>{e.titre}</td>
                              <td style={{ padding:"10px 12px", color:"#475569" }}>{e.coach}</td>
                              <td style={{ padding:"10px 12px", color:"#475569" }}>{e.classe}</td>
                              <td style={{ padding:"10px 12px", color:"#475569" }}>{e.date}</td>
                              <td style={{ padding:"10px 12px", textAlign:"center", fontWeight:700 }}>{e.nbParticipants}</td>
                              <td style={{ padding:"10px 12px", fontWeight:700, color:BET_COLOR }}>{e.noteMoy}</td>
                              <td style={{ padding:"10px 12px" }}>
                                <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                                  background: e.statut==="Corrigé"?"#d1fae5":"#fff7ed",
                                  color:       e.statut==="Corrigé"?"#065f46":"#92400e" }}>
                                  {e.statut==="Corrigé"?"✅ Corrigé":"⏳ À venir"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ================= ONGLET APPRENANTS ================= */}
            {activeTab === "apprenants" && (() => {
              const niveaux  = ["Tous","A1","A2","B1","B2","C1","C2"];
              const centres  = ["Tous", ...new Set(APPRENANTS_MOCK.map(a=>a.centre))];
              const statuts  = ["Tous","Actif","⚠ Risque","Certifié"];

              const filtres  = APPRENANTS_MOCK.filter(a => {
                if (apprenantFiltre.niveau!=="Tous" && a.niveau!==apprenantFiltre.niveau) return false;
                if (apprenantFiltre.centre!=="Tous" && a.centre!==apprenantFiltre.centre) return false;
                if (apprenantFiltre.statut!=="Tous" && a.statut!==apprenantFiltre.statut) return false;
                if (apprenantFiltre.search && !a.nom.toLowerCase().includes(apprenantFiltre.search.toLowerCase())) return false;
                return true;
              });

              const aJour    = APPRENANTS_MOCK.filter(a=>a.paiement==="À jour").length;
              const retard   = APPRENANTS_MOCK.filter(a=>a.paiement==="Retard"||a.paiement==="Impayé").length;
              const certifie = APPRENANTS_MOCK.filter(a=>a.statut==="Certifié").length;
              const progMoy  = Math.round(APPRENANTS_MOCK.reduce((s,a)=>s+a.progression,0)/APPRENANTS_MOCK.length);

              return (
                <div>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🎓 Gestion des Apprenants</h2>
                      <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Suivi complet — progression, paiements, examens, présences</p>
                    </div>
                    <button onClick={()=>toast.success("Export effectué")} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇ Exporter CSV</button>
                  </div>

                  {/* KPIs */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
                    {[
                      { icon:"🎓", label:"Total apprenants",      value:APPRENANTS_MOCK.length, color:BET_COLOR,  sub:"Toutes formations" },
                      { icon:"📈", label:"Progression moyenne",   value:`${progMoy}%`,          color:"#8b5cf6",  sub:"Toutes classes confondues" },
                      { icon:"✅", label:"Paiements à jour",      value:aJour,                  color:"#22c55e",  sub:`${retard} en retard / impayé` },
                      { icon:"🏅", label:"Certifiés ce mois",     value:certifie,               color:"#f59e0b",  sub:"Certificats délivrés" },
                    ].map((k,i) => <StatCard key={i} {...k} />)}
                  </div>

                  {/* Filtres */}
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18, alignItems:"center" }}>
                    <input placeholder="🔍 Rechercher un apprenant…" value={apprenantFiltre.search}
                      onChange={e=>setApprenantFiltre(p=>({...p,search:e.target.value}))}
                      style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, minWidth:220 }} />
                    {[
                      { label:"Niveau", key:"niveau", values:niveaux },
                      { label:"Centre", key:"centre", values:centres },
                      { label:"Statut", key:"statut", values:statuts },
                    ].map(f => (
                      <select key={f.key} value={apprenantFiltre[f.key]}
                        onChange={e=>setApprenantFiltre(p=>({...p,[f.key]:e.target.value}))}
                        style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer" }}>
                        {f.values.map(v=><option key={v}>{v}</option>)}
                      </select>
                    ))}
                    <span style={{ fontSize:12, color:"#9ca3af" }}>{filtres.length} résultat(s)</span>
                    {(apprenantFiltre.niveau!=="Tous"||apprenantFiltre.centre!=="Tous"||apprenantFiltre.statut!=="Tous"||apprenantFiltre.search) && (
                      <button onClick={()=>setApprenantFiltre({niveau:"Tous",centre:"Tous",statut:"Tous",search:""})}
                        style={{ padding:"6px 12px", background:"#fee2e2", color:BET_RED, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>✕ Réinitialiser</button>
                    )}
                  </div>

                  {/* Tableau */}
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead>
                        <tr style={{ background:"#f8fafc" }}>
                          {["Apprenant","Niveau","Formation","Coach","Centre","Progression","Présence","Dernier exam","Paiement","Statut",""].map(h=>(
                            <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9ca3af", borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtres.map(a => (
                          <tr key={a.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                            <td style={{ padding:"10px 12px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <div style={{ width:34, height:34, borderRadius:"50%", background:"#8b5cf620", color:"#8b5cf6", fontWeight:800, fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{a.initiales}</div>
                                <div>
                                  <div style={{ fontWeight:700, color:"#0f172a" }}>{a.nom}</div>
                                  <div style={{ fontSize:11, color:"#9ca3af" }}>{a.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:"10px 12px" }}>
                              <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:800, background: a.niveau>="C"?"#ede9fe":a.niveau>="B"?"#e0f2fe":"#f0fdf4", color: a.niveau>="C"?"#7c3aed":a.niveau>="B"?BET_COLOR:"#15803d" }}>{a.niveau}</span>
                            </td>
                            <td style={{ padding:"10px 12px", fontSize:12, color:"#475569", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.typeFormation}</td>
                            <td style={{ padding:"10px 12px", fontSize:12, color:"#475569" }}>{a.coach}</td>
                            <td style={{ padding:"10px 12px" }}><span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700, background:"#e0f2fe", color:BET_COLOR }}>{a.centre}</span></td>
                            <td style={{ padding:"10px 12px", minWidth:120 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ flex:1, height:5, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                                  <div style={{ width:`${a.progression}%`, height:"100%", background: a.progression>=70?"#22c55e":a.progression>=45?"#f59e0b":"#ef4444", borderRadius:3 }} />
                                </div>
                                <span style={{ fontSize:12, fontWeight:700, color: a.progression>=70?"#22c55e":a.progression>=45?"#f59e0b":"#ef4444", minWidth:30 }}>{a.progression}%</span>
                              </div>
                            </td>
                            <td style={{ padding:"10px 12px", fontWeight:700, color: a.presence>=85?"#22c55e":a.presence>=70?"#f59e0b":"#ef4444" }}>{a.presence}%</td>
                            <td style={{ padding:"10px 12px", fontSize:12, color:BET_COLOR, fontWeight:600 }}>{a.dernierExam}</td>
                            <td style={{ padding:"10px 12px" }}>
                              <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                                background: a.paiement==="À jour"?"#d1fae5":a.paiement==="Retard"?"#fff7ed":"#fee2e2",
                                color:       a.paiement==="À jour"?"#065f46":a.paiement==="Retard"?"#92400e":"#dc2626" }}>
                                {a.paiement}
                              </span>
                            </td>
                            <td style={{ padding:"10px 12px" }}>
                              <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                                background: a.statut==="Actif"?"#eff6ff":a.statut==="Certifié"?"#d1fae5":"#fff7ed",
                                color:       a.statut==="Actif"?BET_COLOR:a.statut==="Certifié"?"#065f46":"#92400e" }}>
                                {a.statut}
                              </span>
                            </td>
                            <td style={{ padding:"10px 12px" }}>
                              <button onClick={()=>setSelectedApprenant(a)} style={{ padding:"5px 12px", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:12 }}>Détail →</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtres.length === 0 && (
                      <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:13 }}>Aucun apprenant ne correspond aux filtres sélectionnés.</div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ══ ONGLET SONDAGES (Super Admin — vue globale) ══ */}
            {activeTab === "sondages" && (() => {
              const SOURCE_ICONS = {
                "Bouche à oreille":"🗣️","Facebook / Instagram":"📱","LinkedIn":"💼",
                "Google / Recherche web":"🔍","Radio / Télévision":"📺",
                "Affichage / Flyers":"📋","Recommandé par un ami":"👫",
                "Recommandé par mon entreprise":"🏢","Autre":"✏️",
              };
              const UTM_ICONS = {
                facebook:"📘",instagram:"📸",tiktok:"🎵",linkedin:"💼",
                whatsapp:"💬",google:"🔍",youtube:"▶️",twitter:"🐦",
                email:"📧",sms:"📱",flyer:"📋",qrcode:"⬛",direct:"🌐",
              };
              const total = sondagesAll.length;
              const totalUtm = Object.values(sondageUtmStats).reduce((s,v)=>s+v,0);

              return (
                <div>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🎯 Sondages & Acquisition — Vue globale</h2>
                      <p style={{ margin:"4px 0 0", fontSize:12, color:"#9ca3af" }}>Comment les prospects ont-ils entendu parler de BET ? Données manuelles + tracking automatique des liens.</p>
                    </div>
                    <button onClick={() => { fetchSondagesAll(); }} style={{ padding:"8px 16px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:12 }}>
                      🔄 Actualiser
                    </button>
                  </div>

                  {/* Stat cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
                    <div style={{ background:"#fff", borderRadius:12, padding:16, border:"1px solid #e5e7eb", textAlign:"center" }}>
                      <div style={{ fontSize:28, fontWeight:800, color:"#7c3aed" }}>{total}</div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>Réponses au sondage</div>
                    </div>
                    <div style={{ background:"#fff", borderRadius:12, padding:16, border:"2px solid #0891b2", textAlign:"center", position:"relative" }}>
                      <div style={{ position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)", background:"#0891b2", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:99, whiteSpace:"nowrap" }}>CLICS RÉELS</div>
                      <div style={{ fontSize:28, fontWeight:800, color:"#0891b2" }}>{totalVisits}</div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>Visites depuis liens UTM</div>
                    </div>
                    <div style={{ background:"#fff", borderRadius:12, padding:16, border:"1px solid #e5e7eb", textAlign:"center" }}>
                      <div style={{ fontSize:28, fontWeight:800, color:"#059669" }}>
                        {totalVisits > 0 ? Math.round((total / totalVisits) * 100) : 0}%
                      </div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>Taux de réponse sondage</div>
                    </div>
                    <div style={{ background:"#fff", borderRadius:12, padding:16, border:"1px solid #e5e7eb", textAlign:"center" }}>
                      <div style={{ fontSize:28, fontWeight:800, color:"#f59e0b" }}>{Object.keys(visitStats).length}</div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>Canaux actifs</div>
                    </div>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>

                    {/* Réponses manuelles */}
                    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px" }}>
                      <h4 style={{ margin:"0 0 4px", fontSize:13, fontWeight:800, color:"#0f172a" }}>📋 Sondage manuel</h4>
                      <p style={{ margin:"0 0 16px", fontSize:11, color:"#9ca3af" }}>Réponse choisie par le client dans son espace</p>
                      {Object.keys(sondageSrcStats).length === 0
                        ? <div style={{ textAlign:"center", padding:"30px 0", color:"#cbd5e1", fontSize:13 }}>Aucune réponse encore</div>
                        : Object.entries(sondageSrcStats).sort((a,b)=>b[1]-a[1]).map(([src, count]) => {
                            const pct = total > 0 ? Math.round((count/total)*100) : 0;
                            return (
                              <div key={src} style={{ marginBottom:12 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#374151", marginBottom:5 }}>
                                  <span>{SOURCE_ICONS[src] || "•"} {src}</span>
                                  <span style={{ fontWeight:700, color:"#7c3aed" }}>{count} ({pct}%)</span>
                                </div>
                                <div style={{ background:"#f1f5f9", borderRadius:999, height:8, overflow:"hidden" }}>
                                  <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius:999 }} />
                                </div>
                              </div>
                            );
                          })
                      }
                    </div>

                    {/* Tracking UTM */}
                    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px" }}>
                      <h4 style={{ margin:"0 0 4px", fontSize:13, fontWeight:800, color:"#0f172a" }}>🔗 Clics par canal (UTM)</h4>
                      <p style={{ margin:"0 0 16px", fontSize:11, color:"#9ca3af" }}>Comptabilisé dès le clic sur le lien — avant même le test ou le sondage</p>
                      {Object.keys(visitStats).length === 0
                        ? <div style={{ textAlign:"center", padding:"30px 0", color:"#cbd5e1", fontSize:13 }}>Aucun clic tracké encore — partagez vos liens UTM !</div>
                        : Object.entries(visitStats).sort((a,b)=>b[1]-a[1]).map(([src, count]) => {
                            const pct = totalVisits > 0 ? Math.round((count/totalVisits)*100) : 0;
                            return (
                              <div key={src} style={{ marginBottom:12 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#374151", marginBottom:5 }}>
                                  <span>{UTM_ICONS[src] || "🔗"} {src}</span>
                                  <span style={{ fontWeight:700, color:"#0891b2" }}>{count} clic{count>1?"s":""} ({pct}%)</span>
                                </div>
                                <div style={{ background:"#f1f5f9", borderRadius:999, height:8, overflow:"hidden" }}>
                                  <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg,#0891b2,#38bdf8)", borderRadius:999 }} />
                                </div>
                              </div>
                            );
                          })
                      }

                      {/* Générateur de liens */}
                      <div style={{ marginTop:20, padding:"14px 16px", background:"#f0f9ff", borderRadius:10, border:"1px solid #bae6fd" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#0369a1", marginBottom:10 }}>🔗 Liens trackés à partager</div>
                        {["whatsapp","facebook","instagram","tiktok","linkedin","google"].map(src => {
                          const base = window.location.origin;
                          const link = `${base}/test-niveau?utm_source=${src}&utm_medium=social&utm_campaign=bet2025`;
                          return (
                            <div key={src} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                              <span style={{ fontSize:14, flexShrink:0 }}>{UTM_ICONS[src]}</span>
                              <span style={{ fontSize:10, color:"#0369a1", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"monospace" }}>{link}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(link); }}
                                style={{ padding:"3px 10px", background:"#0891b2", color:"#fff", border:"none", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", flexShrink:0 }}
                              >Copier</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Tableau détaillé */}
                  <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                    <div style={{ padding:"16px 20px", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <h4 style={{ margin:0, fontSize:13, fontWeight:800, color:"#0f172a" }}>Toutes les réponses ({total})</h4>
                    </div>
                    {sondagesLoading ? (
                      <div style={{ textAlign:"center", padding:"40px", color:"#9ca3af" }}>⏳ Chargement…</div>
                    ) : total === 0 ? (
                      <div style={{ textAlign:"center", padding:"40px", color:"#cbd5e1" }}>Aucune réponse pour l'instant</div>
                    ) : (
                      <div style={{ overflowX:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                          <thead>
                            <tr style={{ background:"#f9fafb", color:"#6b7280" }}>
                              <th style={{ padding:"10px 14px", textAlign:"left", fontWeight:600 }}>Email</th>
                              <th style={{ padding:"10px 14px", textAlign:"left", fontWeight:600 }}>Source (sondage)</th>
                              <th style={{ padding:"10px 14px", textAlign:"left", fontWeight:600 }}>Canal UTM</th>
                              <th style={{ padding:"10px 14px", textAlign:"left", fontWeight:600 }}>Campagne</th>
                              <th style={{ padding:"10px 14px", textAlign:"left", fontWeight:600 }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sondagesAll.map(s => (
                              <tr key={s.id} style={{ borderTop:"1px solid #f1f5f9" }}>
                                <td style={{ padding:"10px 14px", color:"#0f172a" }}>{s.email}</td>
                                <td style={{ padding:"10px 14px" }}>
                                  <span style={{ background:"#f3e8ff", color:"#7c3aed", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>
                                    {SOURCE_ICONS[s.source] || "•"} {s.source}
                                  </span>
                                  {s.source_detail && <span style={{ fontSize:10, color:"#9ca3af", marginLeft:6 }}>{s.source_detail}</span>}
                                </td>
                                <td style={{ padding:"10px 14px" }}>
                                  {s.utm_source
                                    ? <span style={{ background:"#e0f2fe", color:"#0369a1", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>{UTM_ICONS[s.utm_source] || "🔗"} {s.utm_source}</span>
                                    : <span style={{ color:"#d1d5db", fontSize:10 }}>–</span>}
                                </td>
                                <td style={{ padding:"10px 14px", color:"#6b7280", fontSize:11 }}>{s.utm_campaign || "–"}</td>
                                <td style={{ padding:"10px 14px", color:"#9ca3af" }}>
                                  {s.created_at ? new Date(s.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" }) : "–"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

        {/* MODALES (invitation, utilisateur, révocation, clone, demande) identiques à AdminDashboard */}
        {showInviteModal && (
          <Modal title="Créer un utilisateur" subtitle="Un mot de passe temporaire sera généré automatiquement" onClose={()=>setShowInviteModal(false)}>
            {/* Identité */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div><label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Nom complet *</label><input value={inviteForm.nom} onChange={e=>setInviteForm({...inviteForm,nom:e.target.value})} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%" }} placeholder="Prénom Nom"/></div>
              <div><label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Téléphone</label><input value={inviteForm.telephone} onChange={e=>setInviteForm({...inviteForm,telephone:e.target.value})} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%" }} placeholder="+225 07 …"/></div>
            </div>
            <div style={{ marginBottom:14 }}><label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Email *</label><input type="email" value={inviteForm.email} onChange={e=>setInviteForm({...inviteForm,email:e.target.value})} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%" }} placeholder="email@domaine.ci"/></div>

            {/* Rôle */}
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>Rôle à attribuer *</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {Object.values(ROLES_DEF).filter(r=>r.id!=="super_admin").map(r=>(
                <div key={r.id} onClick={()=>setInviteForm({...inviteForm,role:r.id,centre_id:""})} style={{ padding:"10px 12px", borderRadius:10, border:`2px solid ${inviteForm.role===r.id?r.color:"#e5e7eb"}`, background:inviteForm.role===r.id?r.color+"08":"#fff", cursor:"pointer" }}>
                  <div style={{ fontWeight:700, color:inviteForm.role===r.id?r.color:"#0f172a", fontSize:13 }}>{r.emoji} {r.label}</div>
                  <div style={{ fontSize:10, color:"#9ca3af", marginTop:2 }}>{r.description.slice(0,55)}…</div>
                </div>
              ))}
            </div>

            {/* Centre BET — pour les rôles qui en ont besoin */}
            {ROLES_AVEC_CENTRE.includes(inviteForm.role) && (
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:inviteForm.centre_id?"#1e3a8a":"#dc2626", marginBottom:4 }}>🏢 Centre BET *</label>
                <select value={inviteForm.centre_id} onChange={e=>setInviteForm({...inviteForm,centre_id:e.target.value})}
                  style={{ padding:9, borderRadius:6, border:`2px solid ${inviteForm.centre_id?"#1e3a8a":"#fca5a5"}`, fontSize:13, width:"100%", background:"#fff" }}>
                  <option value="">— Choisir le centre —</option>
                  {inviteForm.role === "commercial"
                    ? centresList.map(c=><option key={c.id} value={c.id}>{c.nom}{c.ville ? ` — ${c.ville}` : ""}</option>)
                    : CENTRES_BET.map(c=><option key={c.id} value={c.id}>{c.label}</option>)
                  }
                </select>
              </div>
            )}

            {/* ── Section planning (assistante commerciale uniquement) ── */}
            {inviteForm.role === "commercial" && (
              <div style={{ marginBottom:14, padding:"16px 18px", borderRadius:12, background:"#f0fdf4", border:"2px solid #bbf7d0" }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#166534", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                  📅 Planning de l'assistante commerciale
                </div>

                {/* Profil B2C / B2B */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:6 }}>Profil de l'assistante</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {[{v:"b2c",l:"👤 B2C — Particuliers"},{v:"b2b",l:"🏢 Corporate — Entreprises"},{v:"les_deux",l:"🔀 Les deux"}].map(opt=>(
                      <button key={opt.v} onClick={()=>setInviteForm({...inviteForm,profil_assistante:opt.v})}
                        style={{ flex:1, padding:"8px 6px", borderRadius:8, border:`2px solid ${inviteForm.profil_assistante===opt.v?"#0891b2":"#e5e7eb"}`,
                          background:inviteForm.profil_assistante===opt.v?"#e0f2fe":"#fff",
                          color:inviteForm.profil_assistante===opt.v?"#0891b2":"#374151",
                          fontWeight:700, fontSize:11, cursor:"pointer" }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type de cours */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:6 }}>Type de coaching</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {[{v:"en_ligne",l:"💻 En ligne"},{v:"presentiel",l:"🏢 Présentiel"},{v:"les_deux",l:"🔀 Les deux"}].map(opt=>(
                      <button key={opt.v} onClick={()=>setInviteForm({...inviteForm,type_cours:opt.v})}
                        style={{ flex:1, padding:"8px 6px", borderRadius:8, border:`2px solid ${inviteForm.type_cours===opt.v?"#22c55e":"#e5e7eb"}`,
                          background:inviteForm.type_cours===opt.v?"#dcfce7":"#fff",
                          color:inviteForm.type_cours===opt.v?"#166534":"#374151",
                          fontWeight:700, fontSize:11, cursor:"pointer" }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quota par jour */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Quota d'assignations / jour</label>
                  <input type="number" min={1} max={50} value={inviteForm.quota_jour}
                    onChange={e=>setInviteForm({...inviteForm,quota_jour:parseInt(e.target.value)||10})}
                    style={{ width:80, padding:"7px 10px", borderRadius:7, border:"1.5px solid #d1d5db", fontSize:14, fontWeight:700, textAlign:"center" }}/>
                </div>

                {/* Jours de service */}
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:8 }}>
                    Jours de service · <span style={{ color:"#16a34a" }}>{inviteForm.jours_travail.length} sélectionné(s)</span>
                  </label>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"].map(jour=>{
                      const COURT = { lundi:"L", mardi:"M", mercredi:"Me", jeudi:"J", vendredi:"V", samedi:"S", dimanche:"D" };
                      const actif = inviteForm.jours_travail.includes(jour);
                      return (
                        <button key={jour} title={jour.charAt(0).toUpperCase()+jour.slice(1)}
                          onClick={()=>{
                            const nv = actif ? inviteForm.jours_travail.filter(j=>j!==jour) : [...inviteForm.jours_travail,jour];
                            setInviteForm({...inviteForm,jours_travail:nv});
                          }}
                          style={{ width:34, height:34, borderRadius:999, border:`1.5px solid ${actif?"#22c55e":"#e2e8f0"}`,
                            background:actif?"#22c55e":"#f8fafc", color:actif?"#fff":"#94a3b8",
                            fontWeight:800, fontSize:11, cursor:"pointer" }}>
                          {COURT[jour]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Note */}
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:4 }}>Note interne (optionnel)</label>
            <textarea value={inviteForm.note} onChange={e=>setInviteForm({...inviteForm,note:e.target.value})} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:"100%", minHeight:52, resize:"vertical", marginBottom:14 }} placeholder="Note visible uniquement par les admins…"/>

            <div style={{ padding:"10px 14px", borderRadius:8, background:"#f0f9ff", border:"1px solid #bae6fd", fontSize:12, color:BET_COLOR, marginBottom:16 }}>
              🔑 Un mot de passe temporaire sera généré automatiquement et affiché après création.
              {inviteForm.role === "commercial" && <><br/><span style={{ color:"#166534" }}>✅ Le profil planning de l'assistante sera créé en même temps.</span></>}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={sendInvite} style={{ padding:"10px 20px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>✅ Créer l'utilisateur</button>
              <button onClick={()=>setShowInviteModal(false)} style={{ padding:"10px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13 }}>Annuler</button>
            </div>
          </Modal>
        )}

        {showCredentialsModal && createdCredentials && (
          <Modal title="✅ Utilisateur créé avec succès" subtitle="Transmettez ces accès à l'utilisateur de manière sécurisée" onClose={()=>setShowCredentialsModal(false)}>
            <div style={{ padding:"18px 20px", borderRadius:12, background:"#f0fdf4", border:"2px solid #bbf7d0", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                  {ROLES_DEF[createdCredentials.role]?.emoji || "👤"}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#0f172a" }}>{createdCredentials.nom}</div>
                  <div style={{ fontSize:12, color:"#6b7280" }}><RoleBadge role={createdCredentials.role}/></div>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#6b7280", marginBottom:4 }}>EMAIL DE CONNEXION</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <code style={{ flex:1, padding:"9px 12px", borderRadius:8, background:"#fff", border:"1px solid #d1d5db", fontSize:14, color:"#0f172a", fontWeight:600 }}>{createdCredentials.email}</code>
                  <button onClick={()=>{navigator.clipboard.writeText(createdCredentials.email);toast.success("Email copié !");}} style={{ padding:"8px 12px", background:"#e5e7eb", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, flexShrink:0 }}>📋 Copier</button>
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:"#6b7280", marginBottom:4 }}>MOT DE PASSE TEMPORAIRE</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <code style={{ flex:1, padding:"9px 12px", borderRadius:8, background:"#fff", border:"2px solid #22c55e", fontSize:16, color:"#166534", fontWeight:800, letterSpacing:"0.05em" }}>{createdCredentials.mdp}</code>
                  <button onClick={()=>{navigator.clipboard.writeText(createdCredentials.mdp);toast.success("Mot de passe copié !");}} style={{ padding:"8px 12px", background:"#22c55e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, flexShrink:0 }}>📋 Copier</button>
                </div>
              </div>
            </div>
            <div style={{ padding:"10px 14px", borderRadius:8, background:"#fff7ed", border:"1px solid #fed7aa", fontSize:12, color:"#92400e", marginBottom:16 }}>
              ⚠️ Ce mot de passe temporaire ne sera plus affiché. L'utilisateur devra le changer à sa première connexion.
            </div>
            <button onClick={()=>setShowCredentialsModal(false)} style={{ width:"100%", padding:"10px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:14 }}>J'ai noté les accès ✓</button>
          </Modal>
        )}

        {showUserModal && editingUser && (
          <Modal title={`Modifier — ${editingUser.nom}`} subtitle="Modifier le rôle et les paramètres de cet utilisateur" onClose={()=>setShowUserModal(false)}>
            <div style={{ display:"flex", gap:14, padding:"12px 16px", borderRadius:10, background:`${ROLES_DEF[editingUser.role]?.bg}`, border:`1px solid ${ROLES_DEF[editingUser.role]?.border}`, marginBottom:18, alignItems:"center" }}>
              <AvatarUpload
                currentUrl={editingUser.avatar_url || null}
                nom={editingUser.nom || ""}
                size={56}
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
              {[{ l:"Nom complet", v:selectedDemande.nom },{ l:"Email", v:selectedDemande.email },{ l:"Entreprise", v:selectedDemande.entreprise },{ l:"Rôle demandé", v:<RoleBadge role={selectedDemande.roleDemande}/> },{ l:"Date demande", v:formatDate(selectedDemande.date) }].map(row=>(
                <div key={row.l} style={{ display:"flex", gap:16, padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}><span style={{ width:140, fontSize:12, fontWeight:600, color:"#9ca3af", flexShrink:0 }}>{row.l}</span><span style={{ fontSize:13, color:"#374151" }}>{row.v}</span></div>
              ))}
            </div>
            <div style={{ marginTop:14, padding:"12px 16px", borderRadius:10, background:"#f8fafc", fontSize:13, color:"#374151", lineHeight:1.7 }}>💬 <strong>Justification :</strong> {selectedDemande.justification}</div>
            {selectedDemande.statut==="en_attente"&&<div style={{ display:"flex", gap:10, marginTop:16 }}><button onClick={()=>handleDemande(selectedDemande.id,"approuver")} style={{ ...btnPrimary, flex:1, textAlign:"center", background:"#22c55e" }}>✅ Approuver</button><button onClick={()=>handleDemande(selectedDemande.id,"refuser")} style={{ ...btnSecondary, flex:1, textAlign:"center", color:BET_RED }}>❌ Refuser</button></div>}
          </Modal>
        )}

        {/* ── MODALE DÉTAIL COACH ── */}
        {selectedCoach && (
          <div style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
            <div style={{ background:"#fff", borderRadius:16, width:"90%", maxWidth:720, maxHeight:"90vh", overflowY:"auto", padding:0 }}>
              {/* Header */}
              <div style={{ background:BET_GRADIENT, padding:"24px 28px", borderRadius:"16px 16px 0 0", position:"relative" }}>
                <button onClick={()=>setSelectedCoach(null)} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", color:"#fff", fontSize:18 }}>✕</button>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,255,255,0.2)", color:"#fff", fontWeight:800, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>{selectedCoach.initiales}</div>
                  <div>
                    <div style={{ fontSize:11, color:"#7dd3fc", fontWeight:600, marginBottom:2 }}>👨‍🏫 Formateur BET</div>
                    <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{selectedCoach.nom}</div>
                    <div style={{ fontSize:13, color:"#bae6fd" }}>{selectedCoach.specialite} · {selectedCoach.certif}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding:"24px 28px" }}>
                {/* Infos rapides */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                  {[
                    { icon:"📍", label:"Centre",     val:selectedCoach.centre },
                    { icon:"📧", label:"Email",      val:selectedCoach.email },
                    { icon:"📞", label:"Téléphone",  val:selectedCoach.tel },
                    { icon:"📅", label:"Embauché le",val:selectedCoach.dateEmb },
                    { icon:"👥", label:"Apprenants", val:`${selectedCoach.apprenants} actifs` },
                    { icon:"✅", label:"Taux présence",val:`${selectedCoach.tauxPresence}%` },
                  ].map((r,i) => (
                    <div key={i} style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px" }}>
                      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:3 }}>{r.icon} {r.label}</div>
                      <div style={{ fontWeight:700, color:"#0f172a", fontSize:13 }}>{r.val}</div>
                    </div>
                  ))}
                </div>

                {/* Planning */}
                <h4 style={{ fontWeight:800, fontSize:14, margin:"0 0 12px", color:"#0f172a" }}>📅 Planning hebdomadaire</h4>
                {selectedCoach.planning.length === 0
                  ? <div style={{ color:"#9ca3af", fontSize:13, marginBottom:20 }}>Aucune session planifiée (congé).</div>
                  : (
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
                      {selectedCoach.planning.map((p,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 14px", background:"#f0f9ff", borderRadius:10, border:"1px solid #e0f2fe" }}>
                          <div style={{ width:36, textAlign:"center", fontWeight:800, color:BET_COLOR, fontSize:13 }}>{p.jour}</div>
                          <div style={{ fontWeight:700, color:"#0f172a", minWidth:120 }}>{p.horaire}</div>
                          <div style={{ flex:1, color:"#475569", fontSize:13 }}>{p.classe}</div>
                          <div style={{ fontSize:12, color:"#64748b" }}>📍 {p.salle} · 👥 {p.apprenants}</div>
                        </div>
                      ))}
                    </div>
                  )
                }

                {/* Examens */}
                <h4 style={{ fontWeight:800, fontSize:14, margin:"0 0 12px", color:"#0f172a" }}>📝 Examens</h4>
                {selectedCoach.examens.length === 0
                  ? <div style={{ color:"#9ca3af", fontSize:13 }}>Aucun examen enregistré.</div>
                  : (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {selectedCoach.examens.map((e,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e5e7eb" }}>
                          <div>
                            <div style={{ fontWeight:700, color:"#0f172a", fontSize:13 }}>{e.titre}</div>
                            <div style={{ fontSize:12, color:"#9ca3af" }}>{e.classe} · {e.date} · {e.nbParticipants} participants</div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            {e.noteMoy !== "—" && <span style={{ fontWeight:800, color:BET_COLOR, fontSize:14 }}>{e.noteMoy}</span>}
                            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:e.statut==="Corrigé"?"#d1fae5":"#fff7ed", color:e.statut==="Corrigé"?"#065f46":"#92400e" }}>{e.statut==="Corrigé"?"✅ Corrigé":"⏳ À venir"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        )}

        {/* ── MODALE DÉTAIL APPRENANT ── */}
        {selectedApprenant && (
          <div style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
            <div style={{ background:"#fff", borderRadius:16, width:"90%", maxWidth:680, maxHeight:"90vh", overflowY:"auto", padding:0 }}>
              {/* Header */}
              <div style={{ background:"linear-gradient(135deg,#0f172a,#7c3aed)", padding:"24px 28px", borderRadius:"16px 16px 0 0", position:"relative" }}>
                <button onClick={()=>setSelectedApprenant(null)} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", color:"#fff", fontSize:18 }}>✕</button>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,255,255,0.2)", color:"#fff", fontWeight:800, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>{selectedApprenant.initiales}</div>
                  <div>
                    <div style={{ fontSize:11, color:"#c4b5fd", fontWeight:600, marginBottom:2 }}>🎓 Apprenant BET</div>
                    <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{selectedApprenant.nom}</div>
                    <div style={{ fontSize:13, color:"#ddd6fe" }}>{selectedApprenant.typeFormation} · Niveau {selectedApprenant.niveau}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding:"24px 28px" }}>
                {/* Infos */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
                  {[
                    { icon:"📧", label:"Email",          val:selectedApprenant.email },
                    { icon:"📞", label:"Téléphone",      val:selectedApprenant.tel },
                    { icon:"👨‍🏫", label:"Coach",          val:selectedApprenant.coach },
                    { icon:"📍", label:"Centre",          val:selectedApprenant.centre },
                    { icon:"📅", label:"Inscrit le",      val:new Date(selectedApprenant.dateInscr).toLocaleDateString("fr-FR") },
                    { icon:"💳", label:"Paiement",        val:selectedApprenant.paiement },
                  ].map((r,i) => (
                    <div key={i} style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px" }}>
                      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:3 }}>{r.icon} {r.label}</div>
                      <div style={{ fontWeight:700, color:"#0f172a", fontSize:13 }}>{r.val}</div>
                    </div>
                  ))}
                </div>

                {/* Progression & Présence */}
                <h4 style={{ fontWeight:800, fontSize:14, margin:"0 0 14px", color:"#0f172a" }}>📈 Performance</h4>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
                  <div style={{ background:"#f8fafc", borderRadius:10, padding:"16px" }}>
                    <div style={{ fontSize:12, color:"#9ca3af", marginBottom:8 }}>Progression cours</div>
                    <div style={{ fontSize:28, fontWeight:800, color: selectedApprenant.progression>=70?"#22c55e":selectedApprenant.progression>=45?"#f59e0b":"#ef4444" }}>{selectedApprenant.progression}%</div>
                    <div style={{ height:8, background:"#e5e7eb", borderRadius:4, marginTop:8, overflow:"hidden" }}>
                      <div style={{ width:`${selectedApprenant.progression}%`, height:"100%", background: selectedApprenant.progression>=70?"#22c55e":selectedApprenant.progression>=45?"#f59e0b":"#ef4444", borderRadius:4 }} />
                    </div>
                  </div>
                  <div style={{ background:"#f8fafc", borderRadius:10, padding:"16px" }}>
                    <div style={{ fontSize:12, color:"#9ca3af", marginBottom:8 }}>Taux de présence</div>
                    <div style={{ fontSize:28, fontWeight:800, color: selectedApprenant.presence>=85?"#22c55e":selectedApprenant.presence>=70?"#f59e0b":"#ef4444" }}>{selectedApprenant.presence}%</div>
                    <div style={{ height:8, background:"#e5e7eb", borderRadius:4, marginTop:8, overflow:"hidden" }}>
                      <div style={{ width:`${selectedApprenant.presence}%`, height:"100%", background: selectedApprenant.presence>=85?"#22c55e":selectedApprenant.presence>=70?"#f59e0b":"#ef4444", borderRadius:4 }} />
                    </div>
                  </div>
                </div>

                {/* Dernier résultat exam */}
                <h4 style={{ fontWeight:800, fontSize:14, margin:"0 0 12px", color:"#0f172a" }}>📝 Dernier résultat d'examen</h4>
                <div style={{ padding:"14px 18px", background:"linear-gradient(135deg,#f0f9ff,#e0f2fe)", borderRadius:12, border:`1px solid #bae6fd`, display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div>
                    <div style={{ fontSize:12, color:"#0369a1" }}>{selectedApprenant.typeFormation}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:BET_COLOR, marginTop:4 }}>{selectedApprenant.dernierExam}</div>
                  </div>
                  <span style={{ padding:"4px 14px", borderRadius:20, fontSize:12, fontWeight:700,
                    background: selectedApprenant.statut==="Actif"?"#eff6ff":selectedApprenant.statut==="Certifié"?"#d1fae5":"#fff7ed",
                    color: selectedApprenant.statut==="Actif"?BET_COLOR:selectedApprenant.statut==="Certifié"?"#065f46":"#92400e" }}>
                    {selectedApprenant.statut}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>{ toast.success(`Message envoyé à ${selectedApprenant.nom}`); }} style={{ flex:1, padding:"10px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>💬 Contacter</button>
                  <button onClick={()=>{ toast.success("Fiche exportée"); }} style={{ flex:1, padding:"10px", background:"#f1f5f9", color:"#0f172a", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>⬇ Exporter fiche</button>
                  <button onClick={()=>setSelectedApprenant(null)} style={{ padding:"10px 18px", background:"#fee2e2", color:BET_RED, border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>Fermer</button>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* ════ MESSAGES ════ */}
          {activeTab === "messages" && (
            <div style={{ background:"#fff", padding:24, borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
              <MessagerieTab />
            </div>
          )}
          {activeTab === "messages_old_DISABLED" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:17, fontWeight:800 }}>💬 Messagerie interne</h2>
                  <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Échangez directement avec tous les profils de la plateforme BET.</p>
                </div>
                <button onClick={() => { fetchMsgContacts(); setShowNewConv(true); }}
                  style={{ padding:"9px 18px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                  ✏️ Nouvelle conversation
                </button>
              </div>

              {/* Modal sélection contact */}
              {showNewConv && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ background:"#fff", borderRadius:16, padding:28, width:440, maxHeight:"70vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                      <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>Choisir un contact</h3>
                      <button onClick={() => setShowNewConv(false)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer" }}>✕</button>
                    </div>
                    {msgContacts.length === 0 ? (
                      <div style={{ textAlign:"center", padding:30, color:"#9ca3af", fontSize:13 }}>⏳ Chargement…</div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {msgContacts.map(c => (
                          <div key={c.id} onClick={() => startConv(c.id)} style={{
                            display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
                            borderRadius:10, border:"1px solid #e5e7eb", cursor:"pointer",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background="#f0f9ff"}
                            onMouseLeave={e => e.currentTarget.style.background="#fff"}
                          >
                            <div style={{ width:38, height:38, borderRadius:"50%", background:BET_COLOR, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, flexShrink:0 }}>
                              {(c.prenom?.[0]||"")+(c.nom?.[0]||"")}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{c.prenom} {c.nom}</div>
                              <div style={{ fontSize:11, color:"#9ca3af" }}>{ROLE_META_SA[c.role]||c.role} · {c.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Layout messagerie */}
              <div style={{ display:"flex", gap:0, height:580, border:"1px solid #e5e7eb", borderRadius:14, overflow:"hidden", background:"#fff" }}>
                {/* Liste conversations */}
                <div style={{ width:270, borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", background:"#fafafa" }}>
                  <div style={{ padding:"12px 14px", borderBottom:"1px solid #e5e7eb", fontSize:12, fontWeight:700, color:"#374151" }}>
                    Conversations {msgNonLuTotal > 0 && <span style={{ marginLeft:6, padding:"1px 7px", borderRadius:10, background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700 }}>{msgNonLuTotal}</span>}
                  </div>
                  <div style={{ flex:1, overflowY:"auto" }}>
                    {msgConvs.length === 0 ? (
                      <div style={{ padding:20, fontSize:12, color:"#9ca3af", textAlign:"center", marginTop:40 }}>
                        Aucune conversation.<br/>Cliquez sur "Nouvelle conversation"
                      </div>
                    ) : (
                      msgConvs.map(conv => {
                        const isActive = msgActiveId === conv.id;
                        const name = saPartnerName(conv);
                        const role = saPartnerRole(conv);
                        const initiales = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
                        return (
                          <div key={conv.id} onClick={() => { setMsgActiveId(conv.id); fetchMsgMessages(conv.id); }} style={{
                            padding:"12px 14px", borderBottom:"1px solid #f1f5f9", cursor:"pointer",
                            background: isActive ? "#e0f2fe" : "transparent", display:"flex", alignItems:"center", gap:10,
                          }}>
                            <div style={{ width:36, height:36, borderRadius:"50%", background:BET_COLOR, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, flexShrink:0 }}>{initiales}</div>
                            <div style={{ minWidth:0, flex:1 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{name}</div>
                              <div style={{ fontSize:10, color:"#9ca3af" }}>{ROLE_META_SA[role]||role}</div>
                              {conv.last_message && <div style={{ fontSize:10, color:"#9ca3af", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", marginTop:1 }}>{conv.last_message}</div>}
                            </div>
                            {conv.non_lus > 0 && (
                              <span style={{ background:"#ef4444", color:"#fff", borderRadius:99, fontSize:9, fontWeight:800, padding:"2px 6px", flexShrink:0 }}>{conv.non_lus}</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Zone messages */}
                {msgActiveConv ? (
                  <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
                    <div style={{ padding:"12px 18px", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", gap:12, background:"#fff" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:BET_COLOR, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800 }}>
                        {saPartnerName(msgActiveConv).split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700 }}>{saPartnerName(msgActiveConv)}</div>
                        <div style={{ fontSize:11, color:"#9ca3af" }}>{ROLE_META_SA[saPartnerRole(msgActiveConv)]||saPartnerRole(msgActiveConv)}</div>
                      </div>
                    </div>
                    <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:10, background:"#f8fafc" }}>
                      {msgMessages.length === 0 && (
                        <div style={{ textAlign:"center", marginTop:60, color:"#9ca3af", fontSize:13 }}>Commencez la conversation !</div>
                      )}
                      {msgMessages.map((msg, i) => {
                        const isMe = msg.from_id === saMyId;
                        return (
                          <div key={i} style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                            <div style={{
                              maxWidth:"70%", padding:"10px 14px", fontSize:12,
                              borderRadius: isMe ? "12px 12px 0 12px" : "12px 12px 12px 0",
                              background: isMe ? BET_COLOR : "#fff",
                              color: isMe ? "#fff" : "#111827", boxShadow:"0 1px 4px rgba(0,0,0,0.07)"
                            }}>
                              {!isMe && <div style={{ fontSize:10, fontWeight:700, marginBottom:3, opacity:.7 }}>{msg.from_name}</div>}
                              <div style={{ lineHeight:1.5 }}>{msg.content}</div>
                              <div style={{ fontSize:9, marginTop:4, opacity:.6, textAlign:"right" }}>
                                {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ padding:"12px 16px", borderTop:"1px solid #e5e7eb", display:"flex", gap:8, background:"#fff" }}>
                      <input
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
                        placeholder="Écrire un message…"
                        style={{ flex:1, padding:"9px 14px", borderRadius:20, border:"1px solid #e5e7eb", fontSize:12, outline:"none" }}
                      />
                      <button onClick={sendMsg} style={{ padding:"9px 18px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:20, cursor:"pointer", fontWeight:700, fontSize:12 }}>Envoyer</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:"#9ca3af" }}>
                    <div style={{ fontSize:44 }}>💬</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>Sélectionnez une conversation</div>
                    <div style={{ fontSize:12 }}>ou démarrez-en une nouvelle via le bouton ci-dessus</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ TÉMOIGNAGES ════ */}
          {activeTab === "temoignages" && (
            <div style={{ background:"#fff", padding:24, borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
              {(() => {
            const EMOJI_LIST = ["🎓","👩🏾‍⚖️","👨🏿‍💼","👩🏽‍💻","👨🏽‍🎓","🌟","💪","🏆","👑","✨"];
            const filtered   = temoFiltre === "tous" ? temos : temos.filter(t => t.statut === temoFiltre);
            const temoTotalPages = Math.max(1, Math.ceil(filtered.length / TEMO_PER_PAGE));
            const displayed  = filtered.slice((temoPage - 1) * TEMO_PER_PAGE, temoPage * TEMO_PER_PAGE);
            const temoGoTo   = (p) => { setTemoPage(Math.min(Math.max(1, p), temoTotalPages)); };
            return (
              <div className="temo-page">

                {/* Header */}
                <div className="temo-header">
                  <div>
                    <h2>⭐ Gestion des Témoignages</h2>
                    <p>{temos.length} témoignage{temos.length>1?"s":""} · {temosPending} en attente de validation</p>
                  </div>
                  <div className="temo-header-actions">
                    <button className="temo-btn temo-btn--outline" onClick={fetchTemos}>🔄 Actualiser</button>
                    <button className="temo-btn temo-btn--primary" onClick={() => setTemoFormOpen(f => !f)}>
                      {temoFormOpen ? "✕ Fermer" : "➕ Nouveau témoignage"}
                    </button>
                  </div>
                </div>

                {/* Formulaire création */}
                {temoFormOpen && (
                  <div className="temo-form">
                    <h3>➕ Créer un témoignage (source admin)</h3>
                    <div className="temo-form-grid">
                      <div>
                        <label>Nom *</label>
                        <input value={temoForm.nom} onChange={e => setTemoForm(f=>({...f,nom:e.target.value}))} placeholder="Ex: Awa Koné" />
                      </div>
                      <div>
                        <label>Rôle / Titre</label>
                        <input value={temoForm.role} onChange={e => setTemoForm(f=>({...f,role:e.target.value}))} placeholder="Ex: Étudiante en droit" />
                      </div>
                      <div>
                        <label>Type de certification</label>
                        <select
                          value={temoForm.score.split(" ")[0] || ""}
                          onChange={e => {
                            const type = e.target.value;
                            const scoreNum = temoForm.score.split(" ").slice(1).join(" ");
                            setTemoForm(f => ({ ...f, score: type ? `${type}${scoreNum ? " " + scoreNum : ""}` : scoreNum }));
                          }}
                        >
                          <option value="">— Sélectionner —</option>
                          <option value="TOEIC">TOEIC</option>
                          <option value="TOEFL">TOEFL</option>
                          <option value="IELTS">IELTS</option>
                          <option value="Anglais Pro">Anglais Pro</option>
                          <option value="Anglais Enfant">Anglais Enfant</option>
                        </select>
                      </div>
                      <div>
                        <label>Score obtenu</label>
                        <input
                          value={temoForm.score.split(" ").slice(1).join(" ")}
                          onChange={e => {
                            const type = temoForm.score.split(" ")[0] || "";
                            const val  = e.target.value;
                            setTemoForm(f => ({ ...f, score: type ? `${type}${val ? " " + val : ""}` : val }));
                          }}
                          placeholder="Ex: 850, 7.5, 104…"
                        />
                      </div>
                      <div>
                        <label>Étoiles</label>
                        <select value={temoForm.etoiles} onChange={e => setTemoForm(f=>({...f,etoiles:Number(e.target.value)}))}>
                          {[5,4,3,2,1].map(n => <option key={n} value={n}>{"★".repeat(n)} {n}/5</option>)}
                        </select>
                      </div>
                      <div className="temo-form-grid--full">
                        <label>Texte *</label>
                        <textarea value={temoForm.texte} onChange={e => setTemoForm(f=>({...f,texte:e.target.value}))} rows={3} placeholder="Le témoignage..." />
                      </div>
                      <div>
                        <label>Avatar</label>
                        <div className="temo-emoji-row">
                          {EMOJI_LIST.map(e => (
                            <div key={e} className={`temo-emoji-btn${temoForm.avatar===e?" temo-emoji-btn--sel":""}`}
                              onClick={() => setTemoForm(f=>({...f,avatar:e}))}>
                              {e}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label>Couleur accent</label>
                        <div className="temo-color-row">
                          <input type="color" className="temo-color-swatch" value={temoForm.couleur}
                            onChange={e => setTemoForm(f=>({...f,couleur:e.target.value}))} />
                          <span style={{ fontSize:12, color:"#6b7280" }}>{temoForm.couleur}</span>
                        </div>
                      </div>
                      <div>
                        <label>Ordre d'affichage</label>
                        <input type="number" value={temoForm.ordre} min={0}
                          onChange={e => setTemoForm(f=>({...f,ordre:Number(e.target.value)}))} />
                      </div>
                    </div>
                    <div className="temo-form-footer">
                      <button className="temo-btn temo-btn--outline" onClick={() => setTemoFormOpen(false)}>Annuler</button>
                      <button className="temo-btn temo-btn--primary" onClick={temoCreate}>✓ Créer</button>
                    </div>
                  </div>
                )}

                {/* Filtres */}
                <div className="temo-filters">
                  {[
                    { key:"tous",       label:`Tous (${temos.length})` },
                    { key:"en_attente", label:`⏳ En attente (${temos.filter(t=>t.statut==="en_attente").length})` },
                    { key:"actif",      label:`✅ Actifs (${temos.filter(t=>t.statut==="actif").length})` },
                    { key:"rejete",     label:`❌ Rejetés (${temos.filter(t=>t.statut==="rejete").length})` },
                  ].map(f => (
                    <button key={f.key}
                      className={`temo-filter-btn ${temoFiltre===f.key?"temo-filter-btn--active":"temo-filter-btn--inactive"}`}
                      onClick={() => { setTemoFiltre(f.key); setTemoPage(1); }}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Modal rejet */}
                {temoRejetId && (
                  <div className="temo-modal-overlay">
                    <div className="temo-modal">
                      <h3>❌ Rejeter ce témoignage</h3>
                      <label>Motif de rejet (optionnel)</label>
                      <textarea value={temoMotif} onChange={e => setTemoMotif(e.target.value)} rows={3}
                        placeholder="Ex: Contenu non conforme à la charte..." />
                      <div className="temo-modal-footer">
                        <button className="temo-btn temo-btn--outline temo-btn--sm"
                          onClick={() => { setTemoRejetId(null); setTemoMotif(""); }}>Annuler</button>
                        <button className="temo-btn temo-btn--danger temo-btn--sm"
                          onClick={() => temoRejeter(temoRejetId)}>Confirmer le rejet</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liste */}
                {temosLoading ? (
                  <div className="temo-loading">Chargement des témoignages…</div>
                ) : filtered.length === 0 ? (
                  <div className="temo-empty">
                    <div className="temo-empty__icon">⭐</div>
                    <div className="temo-empty__text">Aucun témoignage{temoFiltre!=="tous"?` — ${temoFiltre}`:""}</div>
                    <div className="temo-empty__sub">Créez le premier via le bouton ci-dessus</div>
                  </div>
                ) : (
                  <>
                  {/* Info page */}
                  <p style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>
                    {filtered.length} témoignage{filtered.length>1?"s":""} · page {temoPage}/{temoTotalPages}
                  </p>
                  <div className="temo-grid">
                    {displayed.map(t => (
                      <div key={t.id} className={`temo-card temo-card--${t.statut}`}>
                        <div className="temo-card__accent" style={{ background: t.couleur || "#1e4080" }} />
                        <div className="temo-card__body">
                          {/* Identité */}
                          <div className="temo-card__identity">
                            <div className="temo-card__avatar-wrap">
                              <div className="temo-card__avatar" style={{ background:`${t.couleur||"#1e4080"}18` }}>
                                {t.avatar || "🎓"}
                              </div>
                              <div>
                                <div className="temo-card__name">{t.nom}</div>
                                {t.role  && <div className="temo-card__role">{t.role}</div>}
                                {t.score && <div className="temo-card__score" style={{ color: t.couleur||"#1e4080" }}>{t.score}</div>}
                              </div>
                            </div>
                            <div className="temo-card__badges">
                              <span className={`temo-badge temo-badge--${t.statut}`}>
                                {t.statut==="actif"?"✅ Actif":t.statut==="en_attente"?"⏳ En attente":"❌ Rejeté"}
                              </span>
                              <span className="temo-card__source">{t.source==="apprenant"?"👤 Apprenant":"🔧 Admin"}</span>
                            </div>
                          </div>

                          {/* Étoiles */}
                          <div className="temo-stars">
                            <span className="temo-stars--filled">{"★".repeat(t.etoiles||5)}</span>
                            <span className="temo-stars--empty">{"☆".repeat(5-(t.etoiles||5))}</span>
                          </div>

                          {/* Texte */}
                          <p className="temo-card__texte">« {t.texte} »</p>

                          {/* Motif rejet */}
                          {t.motif_rejet && <div className="temo-card__motif">💬 {t.motif_rejet}</div>}

                          {/* Info apprenant */}
                          {t.apprenant && (
                            <div className="temo-card__apprenant-info">
                              👤 {t.apprenant.prenom} {t.apprenant.nom} — {t.apprenant.email}
                            </div>
                          )}

                          {/* Contrôles */}
                          <div className="temo-card__controls">
                            <span>Ordre :</span>
                            <input type="number" className="temo-ordre-input" defaultValue={t.ordre} min={0}
                              onBlur={e => temoAction(t.id, { ordre: Number(e.target.value) })} />
                            <span>Visible :</span>
                            <ToggleSwitch on={t.actif} color="#1e4080" onChange={val => temoAction(t.id, { actif: val })} />
                          </div>
                        </div>

                        {/* Footer actions */}
                        <div className="temo-card__footer">
                          {t.statut === "en_attente" && (
                            <>
                              <button className="temo-btn temo-btn--success temo-btn--sm" style={{ flex:1 }}
                                onClick={() => temoApprouver(t.id)}>✅ Approuver</button>
                              <button className="temo-btn temo-btn--danger temo-btn--sm" style={{ flex:1 }}
                                onClick={() => { setTemoRejetId(t.id); setTemoMotif(""); }}>❌ Rejeter</button>
                            </>
                          )}
                          {t.statut !== "en_attente" && (
                            <button className="temo-btn temo-btn--outline temo-btn--sm" style={{ flex:1 }}
                              onClick={() => temoAction(t.id, { statut: t.statut==="actif"?"rejete":"actif", actif: t.statut!=="actif" })}>
                              {t.statut==="actif" ? "⏸ Désactiver" : "▶ Réactiver"}
                            </button>
                          )}
                          <button className="temo-btn temo-btn--danger temo-btn--icon"
                            onClick={() => temoDelete(t.id)}>🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Pagination ── */}
                  {temoTotalPages > 1 && (
                    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:6, marginTop:28, flexWrap:"wrap" }}>
                      <button onClick={() => temoGoTo(temoPage - 1)} disabled={temoPage === 1}
                        style={{ padding:"7px 16px", borderRadius:999, border:"1.5px solid #e5e7eb", background:temoPage===1?"#f8fafc":"#fff", color:temoPage===1?"#cbd5e1":"#0b1f40", fontWeight:700, fontSize:12, cursor:temoPage===1?"not-allowed":"pointer" }}>
                        ← Précédent
                      </button>
                      {Array.from({ length: temoTotalPages }, (_, i) => i + 1).map(n => {
                        const near = Math.abs(n - temoPage) <= 1 || n === 1 || n === temoTotalPages;
                        if (!near) {
                          if (n === temoPage - 2 || n === temoPage + 2) return <span key={n} style={{ color:"#9ca3af", fontSize:12 }}>…</span>;
                          return null;
                        }
                        return (
                          <button key={n} onClick={() => temoGoTo(n)}
                            style={{ width:34, height:34, borderRadius:"50%", border:"none", background:n===temoPage?"#1e4080":"#f1f5f9", color:n===temoPage?"#fff":"#374151", fontWeight:800, fontSize:13, cursor:"pointer" }}>
                            {n}
                          </button>
                        );
                      })}
                      <button onClick={() => temoGoTo(temoPage + 1)} disabled={temoPage === temoTotalPages}
                        style={{ padding:"7px 16px", borderRadius:999, border:"1.5px solid #e5e7eb", background:temoPage===temoTotalPages?"#f8fafc":"#fff", color:temoPage===temoTotalPages?"#cbd5e1":"#0b1f40", fontWeight:700, fontSize:12, cursor:temoPage===temoTotalPages?"not-allowed":"pointer" }}>
                        Suivant →
                      </button>
                    </div>
                  )}
                  </>
                )}
              </div>
            );
              })()}
            </div>
          )}

          {/* ══ BOUTIQUE ══ */}
          {activeTab === "boutique" && (
            <div style={{ background:"#fff", borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", padding:0, overflow:"hidden" }}>
              {/* Header */}
              <div style={{ background: BET_GRADIENT, padding:"24px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <h2 style={{ color:"#fff", margin:0, fontSize:"1.3rem", fontWeight:800 }}>🛍️ Boutique BET</h2>
                  <p style={{ color:"rgba(255,255,255,0.7)", margin:"4px 0 0", fontSize:".85rem" }}>
                    {produits.length} produit{produits.length!==1?"s":""} · {commandes.length} commande{commandes.length!==1?"s":""}
                    {commandes.filter(c=>c.statut==="en_attente").length > 0 &&
                      <span style={{ marginLeft:10, background:"#fbbf24", color:"#7c2d12", padding:"2px 10px", borderRadius:999, fontWeight:700, fontSize:11 }}>
                        {commandes.filter(c=>c.statut==="en_attente").length} en attente
                      </span>
                    }
                  </p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { setBoutiqueSubTab("produits"); setProdFormOpen(true); setSelectedProduit(null); setProdForm(PROD_FORM_INIT); }}
                    style={{ padding:"9px 18px", background:"#fff", color:BET_COLOR, border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
                    + Nouveau produit
                  </button>
                </div>
              </div>

              {/* Sous-onglets */}
              <div style={{ display:"flex", gap:0, borderBottom:"2px solid #e5e7eb", padding:"0 28px" }}>
                {[{ key:"produits", label:"📦 Produits" }, { key:"commandes", label:"🧾 Commandes" }].map(t => (
                  <button key={t.key} onClick={() => setBoutiqueSubTab(t.key)}
                    style={{ padding:"12px 20px", border:"none", background:"none", cursor:"pointer", fontWeight:700, fontSize:13,
                      color: boutiqueSubTab===t.key ? BET_COLOR : "#6b7280",
                      borderBottom: boutiqueSubTab===t.key ? `3px solid ${BET_COLOR}` : "3px solid transparent",
                      marginBottom:-2 }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ padding:28 }}>

                {/* ── Formulaire ajout/édition produit ── */}
                {boutiqueSubTab === "produits" && prodFormOpen && (
                  <div style={{ background:"#f0f9ff", border:`1.5px solid ${BET_COLOR}40`, borderRadius:12, padding:24, marginBottom:28 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                      <h3 style={{ margin:0, color:BET_DARK, fontWeight:800 }}>
                        {selectedProduit ? "✏️ Modifier le produit" : "➕ Nouveau produit"}
                      </h3>
                      <button onClick={() => { setProdFormOpen(false); setSelectedProduit(null); }}
                        style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#6b7280" }}>✕</button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        <label style={{ fontSize:12, fontWeight:700, color:"#374151" }}>Nom du produit *</label>
                        <input value={prodForm.nom} onChange={e=>setProdForm(f=>({...f,nom:e.target.value}))}
                          placeholder="Ex: T-Shirt BET"
                          style={{ padding:"9px 12px", border:`1.5px solid ${BET_COLOR}40`, borderRadius:8, fontSize:13 }} />
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        <label style={{ fontSize:12, fontWeight:700, color:"#374151" }}>Catégorie</label>
                        <select
                          value={CATEGORIES_BOUTIQUE.includes(prodForm.categorie) ? prodForm.categorie : "__custom__"}
                          onChange={e => {
                            if (e.target.value === "__custom__") setProdForm(f=>({...f, categorie:""}));
                            else setProdForm(f=>({...f, categorie:e.target.value}));
                          }}
                          style={{ padding:"9px 12px", border:`1.5px solid ${BET_COLOR}40`, borderRadius:8, fontSize:13 }}>
                          {CATEGORIES_BOUTIQUE.map(c=><option key={c}>{c}</option>)}
                          <option value="__custom__">✏️ Saisir manuellement…</option>
                        </select>
                        {!CATEGORIES_BOUTIQUE.includes(prodForm.categorie) && (
                          <input
                            autoFocus
                            value={prodForm.categorie}
                            onChange={e=>setProdForm(f=>({...f,categorie:e.target.value}))}
                            placeholder="Nom de la catégorie…"
                            style={{ padding:"9px 12px", border:`1.5px solid ${BET_COLOR}`, borderRadius:8, fontSize:13 }}
                          />
                        )}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        <label style={{ fontSize:12, fontWeight:700, color:"#374151" }}>Prix (FCFA) *</label>
                        <input type="number" min="0" value={prodForm.prix} onChange={e=>setProdForm(f=>({...f,prix:e.target.value}))}
                          placeholder="5000"
                          style={{ padding:"9px 12px", border:`1.5px solid ${BET_COLOR}40`, borderRadius:8, fontSize:13 }} />
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        <label style={{ fontSize:12, fontWeight:700, color:"#374151" }}>Stock</label>
                        <input type="number" min="0" value={prodForm.stock} onChange={e=>setProdForm(f=>({...f,stock:e.target.value}))}
                          placeholder="0"
                          style={{ padding:"9px 12px", border:`1.5px solid ${BET_COLOR}40`, borderRadius:8, fontSize:13 }} />
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6, gridColumn:"1/-1" }}>
                        <label style={{ fontSize:12, fontWeight:700, color:"#374151" }}>Description</label>
                        <textarea value={prodForm.description} onChange={e=>setProdForm(f=>({...f,description:e.target.value}))}
                          placeholder="Description du produit…" rows={3}
                          style={{ padding:"9px 12px", border:`1.5px solid ${BET_COLOR}40`, borderRadius:8, fontSize:13, resize:"vertical" }} />
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:8, gridColumn:"1/-1" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <label style={{ fontSize:12, fontWeight:700, color:"#374151" }}>
                            Photos du produit <span style={{ color:"#94a3b8", fontWeight:400 }}>({prodForm.images.length} / 6)</span>
                          </label>
                          {prodForm.images.length < 6 && (
                            <label style={{ padding:"6px 14px", background:BET_LIGHT, color:BET_COLOR, borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, display:"flex", alignItems:"center", gap:5 }}>
                              {prodImageUploading ? "⏳ Upload…" : "📷 Ajouter une photo"}
                              <input type="file" accept="image/*" style={{ display:"none" }}
                                onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadProduitImage(f); e.target.value=""; }} />
                            </label>
                          )}
                        </div>
                        {prodForm.images.length === 0 ? (
                          <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:100, border:`2px dashed ${BET_COLOR}40`, borderRadius:10, cursor:"pointer", color:"#94a3b8", fontSize:13, gap:6 }}>
                            <span style={{ fontSize:28 }}>📷</span>
                            Cliquez pour ajouter des photos
                            <input type="file" accept="image/*" style={{ display:"none" }}
                              onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadProduitImage(f); e.target.value=""; }} />
                          </label>
                        ) : (
                          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                            {prodForm.images.map((url, i) => (
                              <div key={i} style={{ position:"relative", width:90, height:90 }}>
                                <img src={url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:8, border: i===0?"2.5px solid "+BET_COLOR:"1.5px solid #e5e7eb" }} />
                                {i===0 && <span style={{ position:"absolute", top:4, left:4, background:BET_COLOR, color:"#fff", fontSize:9, fontWeight:800, padding:"1px 5px", borderRadius:4 }}>PRINCIPALE</span>}
                                <button onClick={()=>setProdForm(f=>({...f, images:f.images.filter((_,j)=>j!==i)}))}
                                  style={{ position:"absolute", top:2, right:2, width:20, height:20, borderRadius:"50%", background:"#dc2626", color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800 }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>La 1ère photo est l'image principale. Max 6 photos · 10 Mo par photo.</p>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
                      <button onClick={()=>{ setProdFormOpen(false); setSelectedProduit(null); }}
                        style={{ padding:"9px 20px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>
                        Annuler
                      </button>
                      <button onClick={saveProduit} disabled={prodSaving}
                        style={{ padding:"9px 20px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, opacity:prodSaving?0.7:1 }}>
                        {prodSaving ? "Enregistrement…" : selectedProduit ? "Mettre à jour" : "Créer le produit"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Liste des produits ── */}
                {boutiqueSubTab === "produits" && (() => {
                  const totalPages = Math.max(1, Math.ceil(produits.length / PROD_PER_PAGE));
                  const paginated  = produits.slice((prodPage-1)*PROD_PER_PAGE, prodPage*PROD_PER_PAGE);
                  return (
                  <>
                    {prodLoading ? (
                      <div style={{ textAlign:"center", padding:40, color:"#6b7280" }}>Chargement…</div>
                    ) : produits.length === 0 ? (
                      <div style={{ textAlign:"center", padding:60 }}>
                        <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
                        <p style={{ color:"#6b7280", fontWeight:600 }}>Aucun produit pour l'instant</p>
                        <button onClick={()=>setProdFormOpen(true)} style={{ padding:"10px 22px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, marginTop:8 }}>
                          + Ajouter le premier produit
                        </button>
                      </div>
                    ) : (
                      <>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:18 }}>
                        {paginated.map(p => {
                          const imgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []);
                          const mainImg = imgs[0] || null;
                          return (
                          <div key={p.id} style={{ border:"1.5px solid #e5e7eb", borderRadius:12, overflow:"hidden", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", opacity:p.actif?1:0.65 }}>
                            {/* Image principale */}
                            <div style={{ height:150, background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
                              {mainImg
                                ? <img src={mainImg} alt={p.nom} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                : <span style={{ fontSize:48 }}>📦</span>
                              }
                              {imgs.length > 1 && (
                                <span style={{ position:"absolute", bottom:6, right:6, background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999 }}>
                                  +{imgs.length-1} photo{imgs.length>2?"s":""}
                                </span>
                              )}
                            </div>
                            {/* Miniatures */}
                            {imgs.length > 1 && (
                              <div style={{ display:"flex", gap:4, padding:"6px 8px", background:"#f8fafc", overflowX:"auto" }}>
                                {imgs.slice(1).map((url, i) => (
                                  <img key={i} src={url} alt="" style={{ width:36, height:36, objectFit:"cover", borderRadius:5, border:"1px solid #e5e7eb", flexShrink:0 }} />
                                ))}
                              </div>
                            )}
                            <div style={{ padding:"12px 14px" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                                <div>
                                  <div style={{ fontWeight:800, color:"#0f172a", fontSize:14 }}>{p.nom}</div>
                                  <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>{p.categorie}</div>
                                </div>
                                <span style={{ padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700,
                                  background:p.actif?"#dcfce7":"#f1f5f9", color:p.actif?"#166534":"#6b7280" }}>
                                  {p.actif?"Actif":"Inactif"}
                                </span>
                              </div>
                              {p.description && <p style={{ fontSize:12, color:"#64748b", margin:"4px 0 8px", lineHeight:1.4 }}>{p.description.slice(0,70)}{p.description.length>70?"…":""}</p>}
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                                <span style={{ fontWeight:800, fontSize:15, color:BET_COLOR }}>{Number(p.prix).toLocaleString("fr-FR")} FCFA</span>
                                <span style={{ fontSize:11, color: p.stock===0?"#dc2626":"#6b7280" }}>
                                  {p.stock===0 ? "⚠ Rupture" : `Stock : ${p.stock}`}
                                </span>
                              </div>
                              <div style={{ display:"flex", gap:7 }}>
                                <button onClick={()=>{ setSelectedProduit(p); setProdForm({ nom:p.nom, description:p.description||"", prix:p.prix, stock:p.stock, categorie:p.categorie, images: imgs }); setProdFormOpen(true); }}
                                  style={{ flex:1, padding:"7px 0", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                                  ✏️ Modifier
                                </button>
                                <button onClick={()=>toggleProduitActif(p.id, p.actif)}
                                  style={{ padding:"7px 10px", background:p.actif?"#fff7ed":"#f0fdf4", color:p.actif?"#c2410c":"#166534", border:`1.5px solid ${p.actif?"#fed7aa":"#bbf7d0"}`, borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                                  {p.actif?"⏸":"▶"}
                                </button>
                                <button onClick={()=>deleteProduit(p.id)}
                                  style={{ padding:"7px 10px", background:"#fff1f2", color:"#dc2626", border:"1.5px solid #fecdd3", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                                  🗑
                                </button>
                              </div>
                            </div>
                          </div>
                        );})}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, marginTop:24 }}>
                          <button onClick={()=>setProdPage(p=>Math.max(1,p-1))} disabled={prodPage===1}
                            style={{ padding:"7px 16px", borderRadius:999, border:"1.5px solid #e5e7eb", background:prodPage===1?"#f8fafc":"#fff", color:prodPage===1?"#cbd5e1":"#0b1f40", fontWeight:700, fontSize:12, cursor:prodPage===1?"not-allowed":"pointer" }}>
                            ← Précédent
                          </button>
                          {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                            <button key={n} onClick={()=>setProdPage(n)}
                              style={{ width:34, height:34, borderRadius:"50%", border:"none", background:n===prodPage?BET_COLOR:"#f1f5f9", color:n===prodPage?"#fff":"#374151", fontWeight:800, fontSize:13, cursor:"pointer" }}>
                              {n}
                            </button>
                          ))}
                          <button onClick={()=>setProdPage(p=>Math.min(totalPages,p+1))} disabled={prodPage===totalPages}
                            style={{ padding:"7px 16px", borderRadius:999, border:"1.5px solid #e5e7eb", background:prodPage===totalPages?"#f8fafc":"#fff", color:prodPage===totalPages?"#cbd5e1":"#0b1f40", fontWeight:700, fontSize:12, cursor:prodPage===totalPages?"not-allowed":"pointer" }}>
                            Suivant →
                          </button>
                          <span style={{ fontSize:12, color:"#94a3b8", marginLeft:8 }}>{produits.length} produit{produits.length>1?"s":""} · page {prodPage}/{totalPages}</span>
                        </div>
                      )}
                      </>
                    )}
                  </>
                  );
                })()}


                {/* ── Commandes ── */}
                {boutiqueSubTab === "commandes" && (
                  <>
                    {/* Filtres statut */}
                    <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                      {STATUTS_CMD.map(s => (
                        <button key={s.key} onClick={()=>setCmdFiltreStatut(s.key)}
                          style={{ padding:"6px 16px", borderRadius:999, border:`1.5px solid ${cmdFiltreStatut===s.key?s.color:"#e5e7eb"}`,
                            background:cmdFiltreStatut===s.key?s.color:"#fff",
                            color:cmdFiltreStatut===s.key?"#fff":s.color,
                            fontWeight:700, fontSize:12, cursor:"pointer" }}>
                          {s.label}
                          {s.key!=="tous" && <span style={{ marginLeft:6, opacity:.85 }}>({commandes.filter(c=>c.statut===s.key).length})</span>}
                        </button>
                      ))}
                      <button onClick={fetchCommandes} style={{ marginLeft:"auto", padding:"6px 14px", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:999, cursor:"pointer", fontWeight:700, fontSize:12 }}>🔄 Actualiser</button>
                    </div>

                    {cmdLoading ? (
                      <div style={{ textAlign:"center", padding:40, color:"#6b7280" }}>Chargement…</div>
                    ) : commandes.length === 0 ? (
                      <div style={{ textAlign:"center", padding:60 }}>
                        <div style={{ fontSize:48, marginBottom:12 }}>🧾</div>
                        <p style={{ color:"#6b7280", fontWeight:600 }}>Aucune commande{cmdFiltreStatut!=="tous"?" dans ce statut":""}</p>
                      </div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        {commandes.map(cmd => {
                          const statutInfo = STATUTS_CMD.find(s=>s.key===cmd.statut) || STATUTS_CMD[0];
                          return (
                            <div key={cmd.id} style={{ border:"1.5px solid #e5e7eb", borderRadius:12, padding:"16px 20px", background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                                <div>
                                  <div style={{ fontWeight:800, color:"#0f172a", fontSize:14 }}>{cmd.client_nom}</div>
                                  <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>
                                    {cmd.client_email} {cmd.client_telephone && `· ${cmd.client_telephone}`}
                                  </div>
                                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
                                    {new Date(cmd.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                                  </div>
                                </div>
                                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                                  <span style={{ fontWeight:800, fontSize:16, color:BET_COLOR }}>{Number(cmd.total).toLocaleString("fr-FR")} FCFA</span>
                                  <span style={{ padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:700, background:`${statutInfo.color}18`, color:statutInfo.color }}>
                                    {statutInfo.label}
                                  </span>
                                </div>
                              </div>
                              {/* Articles */}
                              {Array.isArray(cmd.items) && cmd.items.length > 0 && (
                                <div style={{ background:"#f8fafc", borderRadius:8, padding:"10px 12px", marginBottom:10, fontSize:12 }}>
                                  {cmd.items.map((item, i) => (
                                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"2px 0", color:"#374151" }}>
                                      <span>{item.nom} × {item.quantite}</span>
                                      <span style={{ fontWeight:700 }}>{(Number(item.prix_unitaire)*Number(item.quantite)).toLocaleString("fr-FR")} FCFA</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {cmd.notes && <p style={{ fontSize:12, color:"#64748b", margin:"0 0 10px", fontStyle:"italic" }}>📝 {cmd.notes}</p>}
                              {/* Actions statut */}
                              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                                {STATUTS_CMD.filter(s=>s.key!=="tous"&&s.key!==cmd.statut).map(s => (
                                  <button key={s.key} onClick={()=>updateCmdStatut(cmd.id, s.key)}
                                    style={{ padding:"5px 12px", borderRadius:6, border:`1.5px solid ${s.color}40`, background:`${s.color}10`, color:s.color, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                                    → {s.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          )}

          {/* ══ COMMENTAIRES BLOG ══ */}
          {activeTab === "blog_comments" && (
            <div style={{ background:"#fff", borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", overflow:"hidden" }}>
              {/* Header */}
              <div style={{ background: BET_GRADIENT, padding:"24px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <h2 style={{ color:"#fff", margin:0, fontSize:"1.3rem", fontWeight:800 }}>💬 Commentaires Blog</h2>
                  <p style={{ color:"rgba(255,255,255,0.7)", margin:"4px 0 0", fontSize:".85rem" }}>
                    {blogComments.length} commentaire{blogComments.length!==1?"s":""} · supprimez les contenus inappropriés
                  </p>
                </div>
                <button onClick={fetchBlogComments} style={{ padding:"9px 18px", background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13 }}>
                  🔄 Actualiser
                </button>
              </div>

              <div style={{ padding:28 }}>
                {/* Recherche */}
                <div style={{ marginBottom:20 }}>
                  <input
                    value={blogCommentsSearch}
                    onChange={e => setBlogCommentsSearch(e.target.value)}
                    placeholder="🔍 Rechercher par nom, article, contenu…"
                    style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e5e7eb", borderRadius:10, fontSize:13, boxSizing:"border-box" }}
                  />
                </div>

                {blogCommentsLoading ? (
                  <div style={{ textAlign:"center", padding:40, color:"#6b7280" }}>Chargement…</div>
                ) : blogComments.length === 0 ? (
                  <div style={{ textAlign:"center", padding:60 }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>💬</div>
                    <p style={{ color:"#6b7280", fontWeight:600 }}>Aucun commentaire pour l'instant</p>
                  </div>
                ) : (() => {
                  const q = blogCommentsSearch.toLowerCase();
                  const filtered = blogComments.filter(c =>
                    !q ||
                    c.nom?.toLowerCase().includes(q) ||
                    c.commentaire?.toLowerCase().includes(q) ||
                    c.article_titre?.toLowerCase().includes(q) ||
                    c.email?.toLowerCase().includes(q)
                  );
                  return (
                    <>
                      {filtered.length === 0 ? (
                        <p style={{ color:"#94a3b8", textAlign:"center", padding:32 }}>Aucun résultat pour « {blogCommentsSearch} »</p>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          {filtered.map(c => (
                            <div key={c.id} style={{ border:"1.5px solid #e5e7eb", borderRadius:12, padding:"14px 18px", background:"#fff", display:"flex", gap:16, alignItems:"flex-start" }}>
                              {/* Avatar */}
                              <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#1e3a8a,#0891b2)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".9rem", flexShrink:0 }}>
                                {(c.nom||"?")[0].toUpperCase()}
                              </div>
                              {/* Contenu */}
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, flexWrap:"wrap" }}>
                                  <div>
                                    <span style={{ fontWeight:800, color:"#0f172a", fontSize:14 }}>{c.nom}</span>
                                    {c.email && <span style={{ fontSize:12, color:"#94a3b8", marginLeft:8 }}>{c.email}</span>}
                                  </div>
                                  <span style={{ fontSize:11, color:"#94a3b8", flexShrink:0 }}>
                                    {new Date(c.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                                  </span>
                                </div>
                                <div style={{ fontSize:11, fontWeight:700, margin:"4px 0 8px" }}>
                                  📄{" "}
                                  {c.article_id ? (
                                    <a
                                      href={`${FRONTEND_URL}/blog/${c.article_id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color:BET_COLOR, textDecoration:"none", borderBottom:`1px dashed ${BET_COLOR}` }}
                                    >
                                      {c.article_titre || "Voir l'article"}
                                    </a>
                                  ) : (
                                    <span style={{ color:"#94a3b8" }}>{c.article_titre || "—"}</span>
                                  )}
                                </div>
                                <p style={{ fontSize:13, color:"#334155", margin:0, lineHeight:1.6, wordBreak:"break-word" }}>{c.commentaire}</p>
                              </div>
                              {/* Supprimer */}
                              <button
                                onClick={() => deleteBlogComment(c.id)}
                                title="Supprimer ce commentaire"
                                style={{ padding:"6px 10px", background:"#fff1f2", color:"#dc2626", border:"1.5px solid #fecdd3", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12, flexShrink:0 }}>
                                🗑 Supprimer
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p style={{ textAlign:"right", fontSize:12, color:"#94a3b8", marginTop:14 }}>
                        {filtered.length} / {blogComments.length} commentaire{blogComments.length>1?"s":""}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ══ PLANNING ASSISTANTES ══ */}
          {activeTab === "assistantes" && (() => {
            const JOURS = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
            const JOURS_COURT = { lundi:"L", mardi:"M", mercredi:"Me", jeudi:"J", vendredi:"V", samedi:"S", dimanche:"D" };
            const jourCourant = (() => {
              const j = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
              return j[new Date().getDay()];
            })();
            const TYPE_LABEL = { en_ligne:"💻 En ligne", presentiel:"🏢 Présentiel", les_deux:"🔀 Les deux" };

            return (
              <div style={{ maxWidth:900, margin:"0 auto", padding:"0 4px" }}>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                  <div>
                    <h2 style={{ margin:"0 0 4px", fontSize:17, fontWeight:800, color:"#0f172a" }}>📅 Planning des assistantes</h2>
                    <p style={{ margin:0, fontSize:12, color:"#6b7280", maxWidth:520 }}>
                      Modifiez les jours de service et le quota. Seules les assistantes actives présentes aujourd'hui ({jourCourant}) sont proposées aux prospects.
                    </p>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <button onClick={()=>{ setActiveTab("permissions"); setPermSubTab("utilisateurs"); setInviteForm(f=>({...f,profil_assistante:assistanteProfilFilter==="b2b"?"b2b":"b2c"})); setShowInviteModal(true); }}
                      style={{ padding:"8px 14px", background: assistanteProfilFilter==="b2b" ? "#eff6ff" : "#f0fdf4", color: assistanteProfilFilter==="b2b" ? "#1d4ed8" : "#166534", border: `2px solid ${assistanteProfilFilter==="b2b" ? "#bfdbfe" : "#bbf7d0"}`, borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                      {assistanteProfilFilter==="b2b" ? "➕ Nouvelle assistante Corporate" : "➕ Nouvelle assistante"}
                    </button>
                    <button onClick={fetchAssistantesAdmin} style={{ padding:"8px 14px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                      🔄 Actualiser
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom:16, padding:"10px 14px", borderRadius:10, background:"#fffbeb", border:"1px solid #fde68a", fontSize:12, color:"#92400e" }}>
                  💡 Pour <strong>créer une assistante</strong> (B2C ou Corporate B2B), allez dans <strong>Gestion des droits → Utilisateurs → Créer</strong> et choisissez le rôle <strong>Commercial</strong> — sélectionnez ensuite le profil <strong>B2C</strong> ou <strong>Corporate B2B</strong> dans le planning.
                </div>

                {/* Légende */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18, padding:"10px 14px", background:"#eff6ff", borderRadius:10, border:"1px solid #bae6fd", fontSize:12, color:"#1e40af", flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700 }}>📍 Aujourd'hui :</span>
                  <span style={{ background:"#1e3a8a", color:"#fff", borderRadius:999, padding:"3px 10px", fontWeight:800, textTransform:"capitalize" }}>{jourCourant}</span>
                  <span style={{ color:"#64748b" }}>Les assistantes absentes ce jour ne sont pas visibles sur le site.</span>
                </div>

                {/* Toggle B2C / Corporate */}
                <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#374151", marginRight:4 }}>Afficher :</span>
                  {[{v:"b2c",l:"👤 Commerciales B2C"},{v:"b2b",l:"🏢 Corporate B2B"}].map(opt=>(
                    <button key={opt.v} onClick={()=>setAssistanteProfilFilter(opt.v)}
                      style={{ padding:"7px 16px", borderRadius:999, border:`2px solid ${assistanteProfilFilter===opt.v ? (opt.v==="b2b"?"#2563eb":"#0891b2") : "#e5e7eb"}`,
                        background: assistanteProfilFilter===opt.v ? (opt.v==="b2b"?"#eff6ff":"#e0f2fe") : "#fff",
                        color: assistanteProfilFilter===opt.v ? (opt.v==="b2b"?"#1d4ed8":"#0891b2") : "#374151",
                        fontWeight: assistanteProfilFilter===opt.v ? 800 : 600, fontSize:12, cursor:"pointer", transition:"all .15s" }}>
                      {opt.l}
                    </button>
                  ))}
                </div>

                {(() => {
                  const CENTRES_CONFIG = [
                    { nom:"Angré",         couleur:"#0891b2" },
                    { nom:"II Plateaux",   couleur:"#6366f1" },
                    { nom:"Yopougon",      couleur:"#a855f7" },
                    { nom:"Koumassi",      couleur:"#f97316" },
                    { nom:"Bouaké",        couleur:"#eab308" },
                    { nom:"Abatta",        couleur:"#ef4444" },
                    { nom:"__sans_centre", couleur:"#94a3b8", label:"Non assignées" },
                  ];

                  // Filtrer par profil sélectionné (b2c ou b2b) — "les_deux" apparaît dans les deux vues
                  const assistantesFiltrees = assistantesAdmin.filter(a => {
                    const p = a.profil || "b2c";
                    if (assistanteProfilFilter === "b2b") return p === "b2b" || p === "les_deux";
                    return p === "b2c" || p === "les_deux";
                  });

                  // Grouper par centre_nom — on retire le préfixe "BET " pour matcher CENTRES_CONFIG
                  const normaliseCentre = (nom) => (nom || "").replace(/^BET\s+/i, "") || "__sans_centre";
                  const grouped = {};
                  assistantesFiltrees.forEach(a => {
                    const key = normaliseCentre(a.centre_nom);
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(a);
                  });

                  const cfg = CENTRES_CONFIG.find(c => c.nom === centreTab) || CENTRES_CONFIG[0];
                  const liste = grouped[cfg.nom] || [];
                  const centreColor = cfg.couleur;

                  const renderCard = (a) => {
                    const da = getDraftedA(a);
                    const jours = da.jours_travail || ["lundi","mardi","mercredi","jeudi","vendredi"];
                    const travailleAujourdHui = jours.includes(jourCourant);
                    const initiales = `${(a.prenom||"")[0]||""}${(a.nom||"")[0]||""}`.toUpperCase();
                    const hasDraft = !!(assistantesDrafts[a.id] && Object.keys(assistantesDrafts[a.id]).length > 0);
                    const isSaving = !!assistantesSaving[a.id];
                    return (
                      <div key={a.id} style={{ background:"#fff", borderRadius:12, border:`2px solid ${hasDraft ? "#fde68a" : travailleAujourdHui && da.actif ? `${centreColor}40` : "#e5e7eb"}`, overflow:"hidden" }}>
                        <div style={{ height:3, background: hasDraft ? "#f59e0b" : travailleAujourdHui && da.actif ? centreColor : "#e5e7eb" }} />
                        <div style={{ padding:"14px 18px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                            <div style={{ position:"relative", flexShrink:0 }}>
                              <div style={{ width:42, height:42, borderRadius:"50%", background:`linear-gradient(135deg,#0f172a,${centreColor})`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13 }}>{initiales}</div>
                              <div style={{ position:"absolute", bottom:-1, right:-1, width:12, height:12, borderRadius:"50%", background: travailleAujourdHui && da.actif ? "#22c55e" : "#d1d5db", border:"2px solid #fff" }} />
                            </div>
                            <div style={{ flex:1, minWidth:130 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:2 }}>
                                <span style={{ fontWeight:800, fontSize:13, color:"#0f172a" }}>{a.prenom} {a.nom}</span>
                                <span style={{ fontSize:10, padding:"2px 7px", borderRadius:999, background:`${centreColor}18`, color:centreColor, fontWeight:700 }}>{TYPE_LABEL[da.type_cours] || da.type_cours}</span>
                                {(da.profil === "b2b" || da.profil === "les_deux") && (
                                  <span style={{ fontSize:10, padding:"2px 7px", borderRadius:999, background:"#eff6ff", color:"#2563eb", fontWeight:700 }}>
                                    {da.profil === "les_deux" ? "🔀 B2C+B2B" : "🏢 Corporate B2B"}
                                  </span>
                                )}
                                {!travailleAujourdHui && da.actif && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:999, background:"#fef3c7", color:"#d97706", fontWeight:700 }}>⚠ Absente aujourd'hui</span>}
                                {!da.actif && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:999, background:"#fee2e2", color:"#dc2626", fontWeight:700 }}>● Inactive</span>}
                              </div>
                              {a.email && <div style={{ fontSize:11, color:"#94a3b8" }}>{a.email}</div>}
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0, flexWrap:"wrap" }}>
                              {/* Mode coaching */}
                              <div style={{ textAlign:"center" }}>
                                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:3 }}>Mode</div>
                                <select value={da.type_cours || "en_ligne"}
                                  onChange={e => setDraft(a.id, { type_cours: e.target.value })}
                                  style={{ padding:"5px 7px", borderRadius:7, border:`1.5px solid ${hasDraft ? "#fde68a" : "#d1d5db"}`, fontSize:11, color:"#0f172a", cursor:"pointer", background:"#fff" }}>
                                  <option value="en_ligne">💻 En ligne</option>
                                  <option value="presentiel">🏢 Présentiel</option>
                                  <option value="les_deux">🔀 Les deux</option>
                                </select>
                              </div>
                              {/* Quota */}
                              <div style={{ textAlign:"center" }}>
                                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:3 }}>Quota/j</div>
                                <input type="number" min={1} max={50} value={da.quota_jour ?? 10}
                                  onChange={e => setDraft(a.id, { quota_jour: parseInt(e.target.value) || 10 })}
                                  style={{ width:50, padding:"4px 6px", borderRadius:7, border:`1.5px solid ${hasDraft ? "#fde68a" : "#d1d5db"}`, fontSize:13, fontWeight:700, textAlign:"center", color:"#0f172a" }}
                                />
                              </div>
                              {/* Profil */}
                              <div style={{ textAlign:"center" }}>
                                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:3 }}>Profil</div>
                                <select value={da.profil || "b2c"}
                                  onChange={e => setDraft(a.id, { profil: e.target.value })}
                                  style={{ padding:"5px 7px", borderRadius:7, border:`1.5px solid ${hasDraft ? "#fde68a" : "#d1d5db"}`, fontSize:11, color:"#0f172a", cursor:"pointer", background:"#fff" }}>
                                  <option value="b2c">👤 B2C</option>
                                  <option value="b2b">🏢 B2B</option>
                                  <option value="les_deux">🔀 Les deux</option>
                                </select>
                              </div>
                              {/* Actif */}
                              <div style={{ textAlign:"center" }}>
                                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:5 }}>Actif site</div>
                                <ToggleSwitch on={!!da.actif} color={centreColor} onChange={() => setDraft(a.id, { actif: !da.actif })} />
                              </div>
                            </div>
                          </div>
                          <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid #f1f5f9" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#64748b" }}>Jours de service :</span>
                              <span style={{ fontSize:11, color:"#94a3b8" }}>{jours.length}j/sem</span>
                            </div>
                            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                              {JOURS.map(jour => {
                                const actif = jours.includes(jour);
                                const estAujourd = jour === jourCourant;
                                return (
                                  <button key={jour} onClick={() => toggleJourTravailDraft(a.id, jour)}
                                    title={jour.charAt(0).toUpperCase() + jour.slice(1)}
                                    style={{ width:32, height:32, borderRadius:999,
                                      border: estAujourd ? `2.5px solid ${centreColor}` : `1.5px solid ${actif ? "#22c55e" : "#e2e8f0"}`,
                                      background: actif ? (estAujourd ? centreColor : "#22c55e") : "#f8fafc",
                                      color: actif ? "#fff" : "#cbd5e1",
                                      fontWeight:800, fontSize:11, cursor:"pointer", transition:"all .15s", flexShrink:0,
                                    }}
                                  >{JOURS_COURT[jour]}</button>
                                );
                              })}
                            </div>
                          </div>
                          <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                            <span style={{ fontSize:11, color: hasDraft ? "#d97706" : "#94a3b8", fontWeight: hasDraft ? 700 : 400 }}>
                              {hasDraft ? "⚠ Modifications non enregistrées" : "✓ À jour"}
                            </span>
                            <button onClick={() => saveDraftAssistante(a.id)} disabled={!hasDraft || isSaving}
                              style={{ padding:"7px 18px", borderRadius:8, border:"none", cursor: hasDraft && !isSaving ? "pointer" : "default",
                                background: hasDraft ? (isSaving ? "#e2e8f0" : centreColor) : "#f1f5f9",
                                color: hasDraft ? (isSaving ? "#94a3b8" : "#fff") : "#94a3b8",
                                fontWeight:700, fontSize:12, display:"flex", alignItems:"center", gap:5,
                              }}
                            >
                              {isSaving ? <><div style={{ width:11,height:11,border:"2px solid #94a3b8",borderTopColor:centreColor,borderRadius:"50%",animation:"spin .7s linear infinite" }} />Enregistrement…</> : "💾 Enregistrer"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div>
                      {/* Sous-onglets centres */}
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
                        {CENTRES_CONFIG.map(c => {
                          const grp = grouped[c.nom] || [];
                          const dispoDuJour = grp.filter(a => {
                            const da = getDraftedA(a);
                            const j = da.jours_travail || ["lundi","mardi","mercredi","jeudi","vendredi"];
                            return da.actif && j.includes(jourCourant);
                          }).length;
                          const hasPendingDraft = grp.some(a => assistantesDrafts[a.id] && Object.keys(assistantesDrafts[a.id]).length > 0);
                          const isActive = centreTab === c.nom;
                          return (
                            <button key={c.nom} onClick={() => setCentreTab(c.nom)}
                              style={{
                                display:"flex", alignItems:"center", gap:6,
                                padding:"7px 13px", borderRadius:999, border:`2px solid ${isActive ? c.couleur : "#e5e7eb"}`,
                                background: isActive ? c.couleur : "#fff",
                                color: isActive ? "#fff" : "#374151",
                                fontWeight: isActive ? 800 : 600, fontSize:12,
                                cursor:"pointer", transition:"all .15s", position:"relative",
                              }}
                            >
                              {c.label || c.nom}
                              {/* badge nb assistantes */}
                              <span style={{ background: isActive ? "rgba(255,255,255,0.25)" : `${c.couleur}20`, color: isActive ? "#fff" : c.couleur, borderRadius:999, padding:"1px 7px", fontSize:11, fontWeight:800 }}>
                                {grp.length}
                              </span>
                              {/* point dispo */}
                              {grp.length > 0 && (
                                <span style={{ width:7, height:7, borderRadius:"50%", background: dispoDuJour > 0 ? "#22c55e" : "#e5e7eb", flexShrink:0 }} />
                              )}
                              {/* point draft non sauvegardé */}
                              {hasPendingDraft && (
                                <span style={{ position:"absolute", top:2, right:2, width:8, height:8, borderRadius:"50%", background:"#f59e0b", border:"1.5px solid #fff" }} />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Infos centre actif */}
                      {assistantesLoading ? (
                        <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>Chargement…</div>
                      ) : liste.length === 0 ? (
                        <div style={{ padding:"24px", borderRadius:12, border:"1.5px dashed #e2e8f0", background:"#fafafa", color:"#94a3b8", fontSize:13, textAlign:"center" }}>
                          Aucune assistante assignée au centre <strong>{cfg.label || cfg.nom}</strong>.<br/>
                          <span style={{ fontSize:11 }}>Vérifiez que les assistantes ont un <code>centre_id</code> correct dans Supabase.</span>
                        </div>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          {liste.map(a => renderCard(a))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <p style={{ marginTop:24, fontSize:11, color:"#94a3b8", textAlign:"center" }}>
                  🔒 La gestion complète du planning (horaires, congés, rotations) sera transférée vers le service RH.
                </p>
              </div>
            );
          })()}

      </div>
    </div>
  );
}

const btnPrimary = { padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnSecondary = { padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };