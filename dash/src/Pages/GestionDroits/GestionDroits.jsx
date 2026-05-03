// src/Pages/GestionDroits/GestionDroits.jsx
// Route : <Route path="/gestion-droits" element={<GestionDroits />} />
// npm install react-hot-toast (déjà installé)

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

/* ═══════════════════════════════════════════════
   CONSTANTES & PALETTE BET
═══════════════════════════════════════════════ */
const BET      = "#1B3080";
const BET_DARK = "#0d1a4a";
const BET_RED  = "#E8273A";
const BET_GRAD = "linear-gradient(135deg,#0d1a4a 0%,#1B3080 60%,#2a4aad 100%)";

/* ── Rôles hiérarchiques ── */
const ROLES_DEF = {
  super_admin: {
    id:"super_admin", label:"Super Admin", emoji:"👑",
    color:"#E8273A", bg:"#fff1f2", border:"#fecdd3",
    niveau: 4,
    description:"Accès total à toutes les fonctionnalités. Configure la plateforme, gère les droits et supervise tout.",
    canBeEditedBy:[], // personne ne peut l'éditer
    badge:"bg-red",
  },
  admin: {
    id:"admin", label:"Administrateur", emoji:"🛡️",
    color:"#1B3080", bg:"#eff6ff", border:"#bfdbfe",
    niveau: 3,
    description:"Gestion complète de la plateforme sauf la configuration système. Peut créer et gérer tous les utilisateurs.",
    canBeEditedBy:["super_admin"],
    badge:"bg-blue",
  },
  responsable: {
    id:"responsable", label:"Responsable", emoji:"🎯",
    color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe",
    niveau: 2,
    description:"Supervise une ou plusieurs équipes, accède aux rapports et KPIs, valide les formations.",
    canBeEditedBy:["super_admin","admin"],
    badge:"bg-purple",
  },
  manager: {
    id:"manager", label:"Manager", emoji:"📋",
    color:"#059669", bg:"#f0fdf4", border:"#bbf7d0",
    niveau: 1,
    description:"Suit la progression de son équipe, accède aux présences et aux notes. Vue limitée à son périmètre.",
    canBeEditedBy:["super_admin","admin","responsable"],
    badge:"bg-green",
  },
};

/* ── Modules / Permissions ── */
const MODULES = [
  { id:"tableau_bord",    label:"Tableau de bord",     cat:"Dashboard",    icon:"🏠" },
  { id:"utilisateurs",    label:"Utilisateurs",         cat:"Gestion",      icon:"👥" },
  { id:"cours",           label:"Cours & Modules",      cat:"Pédagogie",    icon:"📚" },
  { id:"etudiants",       label:"Étudiants",            cat:"Pédagogie",    icon:"🎓" },
  { id:"evaluations",     label:"Évaluations & Notes",  cat:"Pédagogie",    icon:"📝" },
  { id:"presences",       label:"Présences",            cat:"Pédagogie",    icon:"✅" },
  { id:"planning",        label:"Planning",             cat:"Organisation", icon:"📅" },
  { id:"entreprises",     label:"Entreprises / DRH",   cat:"RH",           icon:"🏢" },
  { id:"finances",        label:"Finances & Paiements", cat:"Finance",      icon:"💰" },
  { id:"rapports",        label:"Rapports & KPIs",      cat:"Analytics",    icon:"📊" },
  { id:"notifications",   label:"Notifications",        cat:"Comm.",        icon:"🔔" },
  { id:"ressources",      label:"Ressources pédago.",   cat:"Pédagogie",    icon:"📂" },
  { id:"blog_site",       label:"Blog & Site web",      cat:"Marketing",    icon:"🌐" },
  { id:"droits_acces",    label:"Droits d'accès",       cat:"Sécurité",     icon:"🔐" },
  { id:"parametres",      label:"Paramètres système",   cat:"Système",      icon:"⚙️" },
  { id:"audit_log",       label:"Journal d'audit",      cat:"Sécurité",     icon:"🕵️" },
];

/* ── Permissions par rôle (matrice initiale) ── */
const makePerms = (overrides = {}) => {
  const base = {};
  MODULES.forEach(m => { base[m.id] = { voir:false, creer:false, modifier:false, supprimer:false }; });
  Object.entries(overrides).forEach(([mid, perms]) => { if (base[mid]) base[mid] = { ...base[mid], ...perms }; });
  return base;
};

const PERMISSIONS_INIT = {
  super_admin: makePerms(Object.fromEntries(MODULES.map(m => [m.id, { voir:true, creer:true, modifier:true, supprimer:true }]))),
  admin: makePerms({
    tableau_bord:{ voir:true,creer:false,modifier:false,supprimer:false },
    utilisateurs:{ voir:true,creer:true,modifier:true,supprimer:true },
    cours:       { voir:true,creer:true,modifier:true,supprimer:true },
    etudiants:   { voir:true,creer:true,modifier:true,supprimer:true },
    evaluations: { voir:true,creer:true,modifier:true,supprimer:true },
    presences:   { voir:true,creer:true,modifier:true,supprimer:false },
    planning:    { voir:true,creer:true,modifier:true,supprimer:true },
    entreprises: { voir:true,creer:true,modifier:true,supprimer:false },
    finances:    { voir:true,creer:true,modifier:true,supprimer:false },
    rapports:    { voir:true,creer:false,modifier:false,supprimer:false },
    notifications:{ voir:true,creer:true,modifier:true,supprimer:false },
    ressources:  { voir:true,creer:true,modifier:true,supprimer:true },
    blog_site:   { voir:true,creer:true,modifier:true,supprimer:true },
    droits_acces:{ voir:true,creer:false,modifier:false,supprimer:false },
    parametres:  { voir:false,creer:false,modifier:false,supprimer:false },
    audit_log:   { voir:true,creer:false,modifier:false,supprimer:false },
  }),
  responsable: makePerms({
    tableau_bord:{ voir:true,creer:false,modifier:false,supprimer:false },
    cours:       { voir:true,creer:false,modifier:true,supprimer:false },
    etudiants:   { voir:true,creer:false,modifier:true,supprimer:false },
    evaluations: { voir:true,creer:true,modifier:true,supprimer:false },
    presences:   { voir:true,creer:false,modifier:true,supprimer:false },
    planning:    { voir:true,creer:true,modifier:true,supprimer:false },
    entreprises: { voir:true,creer:false,modifier:false,supprimer:false },
    rapports:    { voir:true,creer:false,modifier:false,supprimer:false },
    notifications:{ voir:true,creer:true,modifier:false,supprimer:false },
    ressources:  { voir:true,creer:true,modifier:true,supprimer:false },
  }),
  manager: makePerms({
    tableau_bord:{ voir:true,creer:false,modifier:false,supprimer:false },
    etudiants:   { voir:true,creer:false,modifier:false,supprimer:false },
    evaluations: { voir:true,creer:false,modifier:false,supprimer:false },
    presences:   { voir:true,creer:false,modifier:false,supprimer:false },
    planning:    { voir:true,creer:false,modifier:false,supprimer:false },
    rapports:    { voir:true,creer:false,modifier:false,supprimer:false },
    notifications:{ voir:true,creer:false,modifier:false,supprimer:false },
    ressources:  { voir:true,creer:false,modifier:false,supprimer:false },
  }),
};

/* ── Utilisateurs ── */
const USERS_INIT = [
  { id:1, nom:"Binnie Kouassi",   email:"binnie@bet.ci",       role:"super_admin", actif:true,  dernConn:"2025-12-09 08:14", twofa:true,  ipRestr:false, accessTemp:null, avatar:"BK", createdAt:"2023-01-15", sessions:2 },
  { id:2, nom:"Amara Diallo",     email:"a.diallo@bet.ci",     role:"admin",       actif:true,  dernConn:"2025-12-09 07:52", twofa:true,  ipRestr:false, accessTemp:null, avatar:"AD", createdAt:"2023-03-10", sessions:1 },
  { id:3, nom:"Fatou N'Diaye",    email:"f.ndiaye@bet.ci",     role:"admin",       actif:true,  dernConn:"2025-12-08 16:30", twofa:false, ipRestr:true,  accessTemp:null, avatar:"FN", createdAt:"2023-06-01", sessions:1 },
  { id:4, nom:"Koné Mariam",      email:"m.kone@bet.ci",       role:"responsable", actif:true,  dernConn:"2025-12-09 09:01", twofa:true,  ipRestr:false, accessTemp:null, avatar:"KM", createdAt:"2024-01-20", sessions:1 },
  { id:5, nom:"Traoré Ibrahima",  email:"i.traore@orange.ci",  role:"responsable", actif:false, dernConn:"2025-11-28 14:00", twofa:false, ipRestr:false, accessTemp:null, avatar:"TI", createdAt:"2024-02-15", sessions:0 },
  { id:6, nom:"Bah Mamadou",      email:"m.bah@bnp.ci",        role:"manager",     actif:true,  dernConn:"2025-12-09 08:45", twofa:false, ipRestr:false, accessTemp:"2025-12-31", avatar:"BM", createdAt:"2024-05-10", sessions:1 },
  { id:7, nom:"Coulibaly Sékou",  email:"s.coul@nestle.ci",    role:"manager",     actif:true,  dernConn:"2025-12-07 11:20", twofa:false, ipRestr:false, accessTemp:null, avatar:"CS", createdAt:"2024-06-01", sessions:0 },
  { id:8, nom:"Ouédraogo Alice",  email:"a.ouedraogo@bet.ci",  role:"responsable", actif:true,  dernConn:"2025-12-09 07:00", twofa:true,  ipRestr:true,  accessTemp:null, avatar:"OA", createdAt:"2024-03-12", sessions:1 },
];

/* ── Journal d'audit ── */
const AUDIT_INIT = [
  { id:1, acteur:"Binnie Kouassi", role:"super_admin", action:"PERMISSION_MODIFIEE", detail:"Rôle Admin — finances.modifier → activé", date:"2025-12-09 08:14", ip:"192.168.1.1",  statut:"success" },
  { id:2, acteur:"Amara Diallo",   role:"admin",       action:"UTILISATEUR_CREE",   detail:"Nouveau compte : Coulibaly Sékou (manager)", date:"2025-12-08 17:30", ip:"192.168.1.2", statut:"success" },
  { id:3, acteur:"Amara Diallo",   role:"admin",       action:"ROLE_MODIFIE",       detail:"Traoré Ibrahima : responsable → désactivé", date:"2025-11-28 14:05", ip:"192.168.1.2", statut:"success" },
  { id:4, acteur:"SYSTÈME",        role:"system",      action:"TENTATIVE_ECHEC",    detail:"Connexion refusée : user_inconnu@hack.com", date:"2025-12-08 22:11", ip:"41.202.219.4", statut:"danger" },
  { id:5, acteur:"Binnie Kouassi", role:"super_admin", action:"2FA_FORCE",          detail:"2FA rendu obligatoire pour rôle Admin", date:"2025-12-07 10:00", ip:"192.168.1.1",  statut:"success" },
  { id:6, acteur:"Fatou N'Diaye",  role:"admin",       action:"SESSION_REVOQUEE",   detail:"Session forcée fermée : Bah Mamadou", date:"2025-12-06 16:00", ip:"192.168.1.3",  statut:"warning" },
  { id:7, acteur:"SYSTÈME",        role:"system",      action:"TENTATIVE_ECHEC",    detail:"Brute-force détecté : 5 échecs consécutifs", date:"2025-12-05 03:22", ip:"102.90.14.7", statut:"danger" },
  { id:8, acteur:"Koné Mariam",    role:"responsable", action:"EXPORT_DONNEES",     detail:"Export CSV étudiants entreprise Orange", date:"2025-12-04 11:15", ip:"192.168.1.5",  statut:"warning" },
];

/* ── Demandes d'accès ── */
const DEMANDES_INIT = [
  { id:1, nom:"Soro Patrick",    email:"p.soro@mtn.ci",    roleDemande:"responsable", entreprise:"MTN CI",    date:"2025-12-08", statut:"en_attente", justification:"Responsable formation équipe commerciale 45 personnes" },
  { id:2, nom:"Diabaté Yves",    email:"y.diab@total.ci",  roleDemande:"manager",     entreprise:"TotalEnergie", date:"2025-12-07", statut:"en_attente", justification:"Manager équipe technique — besoin suivi formations réglementaires" },
  { id:3, nom:"Camara Aminata",  email:"a.cam@ecobank.ci", roleDemande:"responsable", entreprise:"Ecobank",   date:"2025-12-06", statut:"approuve",   justification:"DRH Ecobank — supervision 120 collaborateurs" },
];

/* ── Politiques de sécurité ── */
const SECURITE_INIT = {
  super_admin:{ twofa_obligatoire:true,  expiration_session:60,  tentatives_max:3, ip_restriction:false, rotation_pwd_jours:60,  complexite_pwd:"tres_haute" },
  admin:      { twofa_obligatoire:true,  expiration_session:120, tentatives_max:5, ip_restriction:false, rotation_pwd_jours:90,  complexite_pwd:"haute"      },
  responsable:{ twofa_obligatoire:false, expiration_session:240, tentatives_max:5, ip_restriction:false, rotation_pwd_jours:180, complexite_pwd:"moyenne"    },
  manager:    { twofa_obligatoire:false, expiration_session:480, tentatives_max:10,ip_restriction:false, rotation_pwd_jours:365, complexite_pwd:"normale"    },
};

const PERM_LABELS = { voir:"Voir", creer:"Créer", modifier:"Modifier", supprimer:"Supprimer" };
const PERM_COLORS = { voir:"#2563eb", creer:"#059669", modifier:"#d97706", supprimer:"#dc2626" };

const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR",{ day:"numeric", month:"short", year:"numeric" }) : "—";
const fmtDateTime = d => d ? d.replace("T"," ").slice(0,16) : "—";

/* ═══════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════ */
const Sidebar = () => (
  <div style={{ width:200, minWidth:200, background:"#0f172a", color:"#fff", padding:20, minHeight:"100vh" }}>
    <div style={{ marginBottom:24, padding:"10px 8px", borderRadius:10, background:"rgba(27,48,128,0.3)", textAlign:"center", border:"1px solid rgba(27,48,128,0.4)" }}>
      <div style={{ fontSize:18, fontWeight:900, color:"#60a5fa", letterSpacing:"0.05em" }}>BET</div>
      <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.15em", marginTop:2 }}>SUPER ADMIN</div>
    </div>
    {[
      { label:"Dashboard",         path:"/AdminDashboard" },
      { label:"Utilisateurs",      path:"/users" },
      { label:"Cours",             path:"/courses" },
      { label:"Étudiants",         path:"/etudiants" },
      { label:"Planning",          path:"/planning" },
      { label:"Entreprises / DRH", path:"/drh" },
      { label:"Finances",          path:"/finances" },
      { label:"Rapports & KPIs",   path:"/rapports" },
      { label:"🔐 Droits d'accès", path:"/gestion-droits", active:true },
      { label:"Audit & Logs",      path:"/audit" },
      { label:"Paramètres",        path:"/settings" },
    ].map((it,i) => (
      <div key={i} style={{ padding:"10px 12px", marginBottom:5, borderRadius:8, cursor:"pointer", fontSize:12, color:"#fff",
        background: it.active ? BET : "transparent",
        fontWeight: it.active ? 700 : 400,
        border: it.active ? `1px solid ${BET}80` : "1px solid transparent",
      }}>{it.label}</div>
    ))}
  </div>
);

const Modal = ({ title, subtitle, onClose, children, size="md", danger=false }) => {
  const widths = { sm:440, md:580, lg:800, xl:1000, full:"min(98vw,1100px)" };
  return (
    <div style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.6)",display:"flex",justifyContent:"center",alignItems:"center",zIndex:1000,backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff",borderRadius:16,width:widths[size]||580,maxHeight:"94vh",overflowY:"auto",maxWidth:"96vw",boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          background: danger?"linear-gradient(135deg,#7f1d1d,#dc2626)":BET_GRAD, borderRadius:"16px 16px 0 0" }}>
          <div>
            <h3 style={{ margin:0,fontSize:17,fontWeight:800,color:"#fff" }}>{title}</h3>
            {subtitle&&<p style={{ margin:"3px 0 0",fontSize:12,color:"rgba(255,255,255,0.65)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:28,height:28,borderRadius:8,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
};

const RoleBadge = ({ role, size="sm" }) => {
  const r = ROLES_DEF[role];
  if (!r) return null;
  const pad = size==="lg" ? "5px 14px" : "2px 9px";
  const fs  = size==="lg" ? 13 : 11;
  return (
    <span style={{ padding:pad, borderRadius:20, fontSize:fs, fontWeight:700, background:r.bg, color:r.color, border:`1px solid ${r.border}`, display:"inline-flex", alignItems:"center", gap:5 }}>
      {r.emoji} {r.label}
    </span>
  );
};

const ToggleSwitch = ({ on, onChange, color=BET, disabled=false }) => (
  <div onClick={()=>!disabled&&onChange(!on)} style={{ width:42, height:24, borderRadius:12, background:on?color:"#d1d5db", cursor:disabled?"not-allowed":"pointer", position:"relative", transition:"background .2s", opacity:disabled?0.5:1, flexShrink:0 }}>
    <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left:on?21:3, transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,0.25)" }}/>
  </div>
);

const KpiCard = ({ icon, label, value, sub, color, onClick, alert=false }) => (
  <div onClick={onClick} style={{ background:"#fff", borderRadius:14, padding:"18px 20px", border:`1px solid ${alert?"#fecdd3":"#e5e7eb"}`, cursor:onClick?"pointer":"default",
    boxShadow: alert?"0 0 0 2px #fca5a5,0 4px 12px rgba(0,0,0,0.06)":"0 2px 8px rgba(0,0,0,0.04)", display:"flex", alignItems:"center", gap:14 }}>
    <div style={{ width:50, height:50, borderRadius:12, background:color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{icon}</div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:11, color:"#9ca3af", fontWeight:500 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:900, color, lineHeight:1.1 }}>{value}</div>
      {sub&&<div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{sub}</div>}
    </div>
    {alert&&<span style={{ fontSize:18 }}>⚠️</span>}
  </div>
);

const PermCheckbox = ({ on, color, onChange, disabled=false }) => (
  <div onClick={()=>!disabled&&onChange(!on)}
    style={{ width:22, height:22, borderRadius:6, border:`2px solid ${on?color:"#d1d5db"}`, background:on?color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:disabled?"not-allowed":"pointer", flexShrink:0, transition:"all .15s" }}>
    {on&&<span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>✓</span>}
  </div>
);

/* ═══════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════ */
export default function GestionDroits() {
  const [activeTab, setActiveTab] = useState("vue_ensemble");
  const [permissions, setPermissions] = useState(PERMISSIONS_INIT);
  const [users, setUsers]         = useState(USERS_INIT);
  const [auditLog, setAuditLog]   = useState(AUDIT_INIT);
  const [demandes, setDemandes]   = useState(DEMANDES_INIT);
  const [securite, setSecurite]   = useState(SECURITE_INIT);

  /* modals */
  const [showUserModal, setShowUserModal]       = useState(false);
  const [editingUser, setEditingUser]           = useState(null);
  const [showInviteModal, setShowInviteModal]   = useState(false);
  const [showPermModal, setShowPermModal]       = useState(false);
  const [editingRole, setEditingRole]           = useState("admin");
  const [showDemandeModal, setShowDemandeModal] = useState(false);
  const [selectedDemande, setSelectedDemande]  = useState(null);
  const [showSecuModal, setShowSecuModal]       = useState(false);
  const [showRevokeModal, setShowRevokeModal]   = useState(false);
  const [userToRevoke, setUserToRevoke]         = useState(null);
  const [showCloneModal, setShowCloneModal]     = useState(false);

  /* filtres */
  const [filtreRole, setFiltreRole]   = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [searchUser, setSearchUser]   = useState("");
  const [filtreAudit, setFiltreAudit] = useState("Tous");

  /* invite form */
  const [inviteForm, setInviteForm] = useState({ nom:"", email:"", role:"manager", accessTemp:"", note:"" });
  const [cloneForm, setCloneForm]   = useState({ source:"admin", cible:"responsable" });

  /* online simulation */
  const [onlineUsers] = useState([1,2,4,6,8]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    totalAdmin:   users.filter(u=>u.role==="admin"||u.role==="super_admin").length,
    actifs:       users.filter(u=>u.actif).length,
    sans2fa:      users.filter(u=>u.actif&&!u.twofa).length,
    alertes:      auditLog.filter(a=>a.statut==="danger").length,
    enAttente:    demandes.filter(d=>d.statut==="en_attente").length,
    tempAccess:   users.filter(u=>u.accessTemp&&new Date(u.accessTemp)>new Date()).length,
    totalSessions:users.reduce((s,u)=>s+u.sessions,0),
  }), [users, auditLog, demandes]);

  /* ── Computed ── */
  const usersFiltres = useMemo(() => {
    let r = [...users];
    if (filtreRole !== "Tous") r = r.filter(u => u.role === filtreRole);
    if (filtreStatut === "Actifs") r = r.filter(u => u.actif);
    if (filtreStatut === "Inactifs") r = r.filter(u => !u.actif);
    if (filtreStatut === "Sans 2FA") r = r.filter(u => !u.twofa && u.actif);
    if (filtreStatut === "En ligne") r = r.filter(u => onlineUsers.includes(u.id));
    if (searchUser) r = r.filter(u => u.nom.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase()));
    return r;
  }, [users, filtreRole, filtreStatut, searchUser, onlineUsers]);

  const auditFiltres = useMemo(() => {
    if (filtreAudit === "Tous") return auditLog;
    return auditLog.filter(a => a.statut === filtreAudit.toLowerCase());
  }, [auditLog, filtreAudit]);

  const addAuditEntry = (action, detail, statut="success") => {
    setAuditLog(prev => [{
      id: Date.now(), acteur:"Binnie Kouassi", role:"super_admin",
      action, detail, date: new Date().toISOString().replace("T"," ").slice(0,16),
      ip:"192.168.1.1", statut,
    }, ...prev]);
  };

  /* ── Handlers ── */
  const togglePerm = (role, module, perm) => {
    if (role === "super_admin") { toast.error("Les permissions du Super Admin ne peuvent pas être modifiées."); return; }
    setPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [module]: { ...prev[role][module], [perm]:!prev[role][module][perm] } }
    }));
  };

  const savePermissions = () => {
    addAuditEntry("PERMISSIONS_SAUVEGARDEES", `Matrice de permissions mise à jour — Rôle : ${ROLES_DEF[editingRole]?.label}`);
    toast.success("Permissions sauvegardées ✓");
    setShowPermModal(false);
  };

  const toggleUserStatus = (userId) => {
    const u = users.find(x=>x.id===userId);
    setUsers(users.map(x => x.id===userId ? { ...x, actif:!x.actif } : x));
    addAuditEntry(u?.actif?"COMPTE_DESACTIVE":"COMPTE_ACTIVE", `${u?.nom} (${u?.role})`);
    toast.success(u?.actif ? `${u?.nom} désactivé` : `${u?.nom} activé`);
  };

  const revokeSession = (userId) => {
    const u = users.find(x=>x.id===userId);
    setUsers(users.map(x => x.id===userId ? { ...x, sessions:0 } : x));
    addAuditEntry("SESSION_REVOQUEE", `Sessions de ${u?.nom} révoquées`, "warning");
    toast.success(`Sessions révoquées pour ${u?.nom}`);
    setShowRevokeModal(false);
  };

  const sendInvite = () => {
    if (!inviteForm.nom || !inviteForm.email) { toast.error("Nom et email requis"); return; }
    const newUser = { id:Date.now(), nom:inviteForm.nom, email:inviteForm.email, role:inviteForm.role, actif:false, dernConn:"Jamais", twofa:false, ipRestr:false, accessTemp:inviteForm.accessTemp||null, avatar:inviteForm.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(), createdAt:new Date().toISOString().split("T")[0], sessions:0 };
    setUsers(prev=>[...prev, newUser]);
    addAuditEntry("UTILISATEUR_INVITE", `Invitation envoyée : ${inviteForm.nom} (${inviteForm.role}) → ${inviteForm.email}`);
    toast.success(`Invitation envoyée à ${inviteForm.email} ✓`);
    setShowInviteModal(false);
    setInviteForm({ nom:"", email:"", role:"manager", accessTemp:"", note:"" });
  };

  const handleDemande = (demandeId, action) => {
    const d = demandes.find(x=>x.id===demandeId);
    if (action==="approuver") {
      const newUser = { id:Date.now(), nom:d.nom, email:d.email, role:d.roleDemande, actif:true, dernConn:"Jamais", twofa:false, ipRestr:false, accessTemp:null, avatar:d.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(), createdAt:new Date().toISOString().split("T")[0], sessions:0 };
      setUsers(prev=>[...prev, newUser]);
      addAuditEntry("DEMANDE_APPROUVEE", `${d.nom} (${d.roleDemande}) — ${d.entreprise}`);
      toast.success(`Accès approuvé pour ${d.nom} ✓`);
    } else {
      addAuditEntry("DEMANDE_REFUSEE", `${d.nom} (${d.roleDemande}) — ${d.entreprise}`, "warning");
      toast(`Demande refusée pour ${d.nom}`);
    }
    setDemandes(prev=>prev.map(x=>x.id===demandeId?{...x,statut:action==="approuver"?"approuve":"refuse"}:x));
    setShowDemandeModal(false);
  };

  const clonePermissions = () => {
    if (cloneForm.source===cloneForm.cible) { toast.error("Source et cible identiques"); return; }
    setPermissions(prev=>({ ...prev, [cloneForm.cible]:JSON.parse(JSON.stringify(prev[cloneForm.source])) }));
    addAuditEntry("PERMISSIONS_CLONEES", `Permissions copiées de ${ROLES_DEF[cloneForm.source]?.label} vers ${ROLES_DEF[cloneForm.cible]?.label}`);
    toast.success(`Permissions clonées de ${ROLES_DEF[cloneForm.source]?.label} vers ${ROLES_DEF[cloneForm.cible]?.label} ✓`);
    setShowCloneModal(false);
  };

  const exportUsers = () => {
    const headers = ["Nom","Email","Rôle","Actif","2FA","Dernière connexion","Sessions","Accès temporaire"];
    const rows = users.map(u=>[u.nom,u.email,u.role,u.actif?"Oui":"Non",u.twofa?"Oui":"Non",u.dernConn,u.sessions,u.accessTemp||""]);
    const csv = [headers,...rows].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv); a.download=`droits_acces_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    toast.success("Export CSV téléchargé ✓");
  };

  const tabs = [
    { key:"vue_ensemble", label:"Vue d'ensemble",     icon:"🏠" },
    { key:"utilisateurs", label:"Utilisateurs",         icon:"👥", badge: stats.enAttente > 0 ? stats.enAttente : null, danger:true },
    { key:"matrice",      label:"Matrice permissions", icon:"🔐" },
    { key:"securite",     label:"Politiques sécurité", icon:"🛡️", badge: stats.sans2fa > 0 ? stats.sans2fa : null, danger:true },
    { key:"demandes",     label:"Demandes d'accès",    icon:"📬", badge: stats.enAttente > 0 ? stats.enAttente : null, danger:true },
    { key:"audit",        label:"Journal d'audit",     icon:"🕵️", badge: stats.alertes > 0 ? stats.alertes : null, danger:true },
  ];

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f0f4ff", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes gdPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes gdFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .gd-fade { animation:gdFade .3s ease both; }
        input[type=range] { -webkit-appearance:none; height:5px; border-radius:3px; background:#e5e7eb; cursor:pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:${BET}; cursor:pointer; }
        table { border-collapse:collapse; }
        input:focus,select:focus,textarea:focus { outline:2px solid ${BET}40; outline-offset:1px; }
      `}</style>
      <Toaster position="top-right" toastOptions={{ style:{ fontSize:13, fontFamily:"'DM Sans',sans-serif" } }}/>

      {/* <Sidebar /> */}

      <div style={{ flex:1, overflowX:"hidden" }}>

        {/* ── HERO ── */}
        <div style={{ background:BET_GRAD, padding:"28px 28px 0", color:"#fff", position:"relative", overflow:"hidden" }}>
          {/* deco circles */}
          <div style={{ position:"absolute", top:-50, right:80, width:200, height:200, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.05)" }}/>
          <div style={{ position:"absolute", top:-20, right:120, width:120, height:120, borderRadius:"50%", border:"1px solid rgba(232,39,58,0.15)" }}/>
          <div style={{ position:"absolute", bottom:0, left:"40%", width:100, height:100, borderRadius:"50%", background:"rgba(232,39,58,0.06)" }}/>

          <div style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:24, position:"relative", zIndex:1 }}>
            <div style={{ width:54, height:54, borderRadius:14, background:"rgba(232,39,58,0.2)", border:"1px solid rgba(232,39,58,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>🔐</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:4 }}>ADMINISTRATION SYSTÈME</div>
              <h1 style={{ margin:0, fontSize:24, fontWeight:900, fontFamily:"'Playfair Display',serif" }}>Gestion des Droits & Accès</h1>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:4 }}>Contrôle total des rôles, permissions et politiques de sécurité de la plateforme BET</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"rgba(255,255,255,0.7)" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", display:"inline-block", animation:"gdPulse 2s infinite" }}/>
                {onlineUsers.length} utilisateurs en ligne
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>Dernière mise à jour : il y a 3 min</div>
            </div>
          </div>

          {/* KPI Strip */}
          <div style={{ display:"flex", background:"rgba(0,0,0,0.2)", borderRadius:"10px 10px 0 0", overflow:"hidden" }}>
            {[
              { l:"Utilisateurs actifs",   v:stats.actifs,       c:"#60a5fa" },
              { l:"En ligne maintenant",   v:onlineUsers.length, c:"#34d399" },
              { l:"Sessions ouvertes",     v:stats.totalSessions,c:"#a78bfa" },
              { l:"Sans 2FA ⚠️",          v:stats.sans2fa,      c:stats.sans2fa>0?"#f87171":"#6ee7b7" },
              { l:"Demandes en attente",   v:stats.enAttente,    c:stats.enAttente>0?"#fbbf24":"#6ee7b7" },
              { l:"Alertes sécurité",      v:stats.alertes,      c:stats.alertes>0?"#f87171":"#6ee7b7" },
            ].map((s,i,arr)=>(
              <div key={s.l} style={{ flex:1, textAlign:"center", padding:"12px 6px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.06)":"none" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:2 }}>{s.l}</div>
                <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"0 24px 32px" }}>
          {/* ── TABS ── */}
          <div style={{ display:"flex", gap:3, paddingTop:18, flexWrap:"wrap", marginBottom:0 }}>
            {tabs.map(tab => {
              const ia = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{ padding:"9px 15px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer", fontWeight:600, fontSize:12, background:ia?"#fff":"#e0e7ff", color:ia?BET:"#4338ca", boxShadow:ia?"0 -2px 8px rgba(27,48,128,0.1)":"none", display:"flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif" }}>
                  <span style={{ fontSize:14 }}>{tab.icon}</span>{tab.label}
                  {tab.badge&&<span style={{ padding:"1px 6px", borderRadius:9, fontSize:10, fontWeight:700, background:tab.danger?"#fee2e2":"#e0e7ff", color:tab.danger?"#dc2626":"#4338ca" }}>{tab.badge}</span>}
                </button>
              );
            })}
          </div>

          <div style={{ background:"#fff", borderRadius:"0 12px 12px 12px", padding:26, boxShadow:"0 2px 10px rgba(0,0,0,0.05)", border:"1px solid #e5e7eb" }}>

            {/* ══ VUE D'ENSEMBLE ══ */}
            {activeTab==="vue_ensemble" && (
              <div className="gd-fade">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Vue d'ensemble — Contrôle d'accès</h2>
                    <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Tableau de bord de sécurité en temps réel</p>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setShowCloneModal(true)} style={btnSecondary}>📋 Cloner des permissions</button>
                    <button onClick={()=>setShowInviteModal(true)} style={btnPrimary}>+ Inviter un utilisateur</button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:26 }}>
                  <KpiCard icon="👥" label="Utilisateurs totaux"  value={users.length}       color={BET}      sub={`${stats.actifs} actifs`} onClick={()=>setActiveTab("utilisateurs")} />
                  <KpiCard icon="🟢" label="Connexions actives"   value={onlineUsers.length}  color="#22c55e"  sub="En ce moment" />
                  <KpiCard icon="🔐" label="Sans 2FA activé"      value={stats.sans2fa}       color={stats.sans2fa>0?BET_RED:BET} sub="Utilisateurs à risque" alert={stats.sans2fa>2} onClick={()=>setActiveTab("securite")} />
                  <KpiCard icon="📬" label="Demandes en attente"  value={stats.enAttente}     color="#d97706"  sub="À traiter" onClick={()=>setActiveTab("demandes")} alert={stats.enAttente>0} />
                  <KpiCard icon="⚠️" label="Alertes sécurité"    value={stats.alertes}       color={BET_RED}  sub="Dernières 48h" alert={stats.alertes>0} onClick={()=>setActiveTab("audit")} />
                  <KpiCard icon="⏳" label="Accès temporaires"   value={stats.tempAccess}    color="#7c3aed"  sub="Actifs" />
                </div>

                {/* Répartition par rôle */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                  <div>
                    <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:14 }}>Répartition par rôle</h3>
                    {Object.values(ROLES_DEF).reverse().map(r => {
                      const count = users.filter(u=>u.role===r.id).length;
                      const pct = users.length ? Math.round((count/users.length)*100) : 0;
                      return (
                        <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, padding:"10px 14px", borderRadius:10, background:`${r.color}06`, border:`1px solid ${r.border}`, cursor:"pointer" }}
                          onClick={()=>{ setFiltreRole(r.id); setActiveTab("utilisateurs"); }}>
                          <span style={{ fontSize:20 }}>{r.emoji}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontWeight:600, fontSize:13, color:"#0f172a" }}>{r.label}</span>
                              <span style={{ fontWeight:800, color:r.color, fontSize:14 }}>{count}</span>
                            </div>
                            <div style={{ height:5, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${pct}%`, background:r.color, borderRadius:3 }}/>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Activité récente */}
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0 }}>Activité récente</h3>
                      <button onClick={()=>setActiveTab("audit")} style={btnGhost}>Voir tout →</button>
                    </div>
                    {auditLog.slice(0,5).map(a => {
                      const colors = { success:"#059669", danger:BET_RED, warning:"#d97706" };
                      const bgs    = { success:"#f0fdf4", danger:"#fff1f2", warning:"#fff7ed" };
                      const icons  = { success:"✅", danger:"🚨", warning:"⚠️" };
                      return (
                        <div key={a.id} style={{ display:"flex", gap:10, padding:"9px 12px", borderRadius:9, background:bgs[a.statut]||"#f8fafc", border:`1px solid ${a.statut==="danger"?"#fecdd3":a.statut==="warning"?"#fed7aa":"#e5e7eb"}`, marginBottom:8 }}>
                          <span style={{ fontSize:16 }}>{icons[a.statut]||"ℹ️"}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{a.action.replace(/_/g," ")}</div>
                            <div style={{ fontSize:11, color:"#6b7280", marginTop:1 }}>{a.detail.slice(0,55)}{a.detail.length>55?"…":""}</div>
                          </div>
                          <div style={{ fontSize:10, color:"#9ca3af", flexShrink:0 }}>{a.date.slice(11,16)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══ UTILISATEURS ══ */}
            {activeTab==="utilisateurs" && (
              <div className="gd-fade">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Utilisateurs administratifs</h2>
                    <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{usersFiltres.length} affiché(s) sur {users.length}</p>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={exportUsers} style={btnSecondary}>⬇️ Export CSV</button>
                    <button onClick={()=>setShowInviteModal(true)} style={btnPrimary}>+ Inviter</button>
                  </div>
                </div>

                {/* Filtres */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
                  <input type="text" placeholder="🔍 Nom ou email…" value={searchUser} onChange={e=>setSearchUser(e.target.value)} style={{ ...inputSt, width:200, marginBottom:0 }}/>
                  <div style={{ display:"flex", gap:5 }}>
                    {["Tous","super_admin","admin","responsable","manager"].map(r=>(
                      <button key={r} onClick={()=>setFiltreRole(r)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:11, fontWeight:600, cursor:"pointer",
                        background:filtreRole===r?(ROLES_DEF[r]?.color||BET):"#fff",
                        color:filtreRole===r?"#fff":"#6b7280",
                        borderColor:filtreRole===r?(ROLES_DEF[r]?.color||BET):"#e5e7eb" }}>
                        {r==="Tous"?"Tous":ROLES_DEF[r]?.emoji+" "+ROLES_DEF[r]?.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    {["Tous","Actifs","Inactifs","Sans 2FA","En ligne"].map(s=>(
                      <button key={s} onClick={()=>setFiltreStatut(s)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:11, cursor:"pointer",
                        background:filtreStatut===s?BET:"#fff", color:filtreStatut===s?"#fff":"#6b7280",
                        borderColor:filtreStatut===s?BET:"#e5e7eb" }}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}><thead>
                    <tr style={{ background:"#f9fafb" }}>
                      {["Utilisateur","Rôle","Statut","2FA","Sessions","Dernier accès","Accès temp.","Actions"].map(h=>(
                        <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:"#6b7280", fontWeight:600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead><tbody>
                    {usersFiltres.map(u=>{
                      const r=ROLES_DEF[u.role];
                      const isOnline=onlineUsers.includes(u.id);
                      const isExpired=u.accessTemp&&new Date(u.accessTemp)<new Date();
                      return (
                        <tr key={u.id} style={{ borderTop:"1px solid #f1f5f9", background:!u.actif?"#f9fafb":"#fff" }}>
                          <td style={{ padding:"12px", verticalAlign:"middle" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ position:"relative" }}>
                                <div style={{ width:36, height:36, borderRadius:"50%", background:`${r?.color||BET}18`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:r?.color||BET }}>
                                  {u.avatar}
                                </div>
                                {isOnline&&<div style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%", background:"#22c55e", border:"2px solid #fff" }}/>}
                              </div>
                              <div>
                                <div style={{ fontWeight:600, fontSize:13 }}>{u.nom}</div>
                                <div style={{ fontSize:11, color:"#9ca3af" }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"12px", verticalAlign:"middle" }}><RoleBadge role={u.role}/></td>
                          <td style={{ padding:"12px", verticalAlign:"middle" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <ToggleSwitch on={u.actif} onChange={()=>toggleUserStatus(u.id)} color="#22c55e"/>
                              <span style={{ fontSize:11, color:u.actif?"#22c55e":"#9ca3af", fontWeight:600 }}>{u.actif?"Actif":"Inactif"}</span>
                            </div>
                          </td>
                          <td style={{ padding:"12px", verticalAlign:"middle" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <ToggleSwitch on={u.twofa} onChange={()=>{ setUsers(users.map(x=>x.id===u.id?{...x,twofa:!x.twofa}:x)); addAuditEntry("2FA_MODIFIE",`${u.nom} : 2FA ${!u.twofa?"activé":"désactivé"}`,"warning"); toast(`2FA ${!u.twofa?"activé":"désactivé"} pour ${u.nom}`); }} color={BET}/>
                              {!u.twofa&&u.actif&&<span style={{ fontSize:10, color:BET_RED, fontWeight:700 }}>⚠️</span>}
                            </div>
                          </td>
                          <td style={{ padding:"12px", verticalAlign:"middle" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <span style={{ fontWeight:700, color:u.sessions>0?BET:"#9ca3af" }}>{u.sessions}</span>
                              {u.sessions>0&&(
                                <button onClick={()=>{ setUserToRevoke(u); setShowRevokeModal(true); }} style={{ padding:"2px 7px", borderRadius:5, background:"#fff1f2", border:"1px solid #fecdd3", color:BET_RED, fontSize:10, cursor:"pointer", fontWeight:600 }}>Révoquer</button>
                              )}
                            </div>
                          </td>
                          <td style={{ padding:"12px", fontSize:12, color:"#6b7280", verticalAlign:"middle" }}>
                            {u.dernConn==="Jamais"?<span style={{ color:"#9ca3af", fontSize:11 }}>Jamais connecté</span>:u.dernConn}
                          </td>
                          <td style={{ padding:"12px", verticalAlign:"middle" }}>
                            {u.accessTemp ? (
                              <span style={{ fontSize:11, padding:"2px 7px", borderRadius:8, background:isExpired?"#fee2e2":"#fef3c7", color:isExpired?"#dc2626":"#92400e", fontWeight:600 }}>
                                {isExpired?"Expiré":"⏳ "+(new Date(u.accessTemp)).toLocaleDateString("fr-FR")}
                              </span>
                            ) : <span style={{ color:"#d1d5db", fontSize:11 }}>Permanent</span>}
                          </td>
                          <td style={{ padding:"12px", verticalAlign:"middle" }}>
                            <div style={{ display:"flex", gap:5 }}>
                              <button onClick={()=>{ setEditingUser(u); setShowUserModal(true); }} style={btnIconEdit} title="Modifier">✏️</button>
                              <button onClick={()=>{ setEditingRole(u.role); setShowPermModal(true); }} style={btnIconEdit} title="Voir permissions">🔐</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody></table>
                </div>
              </div>
            )}

            {/* ══ MATRICE DES PERMISSIONS ══ */}
            {activeTab==="matrice" && (
              <div className="gd-fade">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Matrice des Permissions</h2>
                    <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Configurez les droits CRUD par rôle et par module</p>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setShowCloneModal(true)} style={btnSecondary}>📋 Cloner</button>
                    <button onClick={()=>{ addAuditEntry("MATRICE_EXPORTEE","Export de la matrice des permissions","warning"); toast.success("Export en cours…"); }} style={btnSecondary}>⬇️ Export</button>
                  </div>
                </div>

                {/* Sélecteur de rôle */}
                <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                  {Object.values(ROLES_DEF).map(r=>(
                    <button key={r.id} onClick={()=>setEditingRole(r.id)} style={{ padding:"9px 18px", borderRadius:10, border:`2px solid ${editingRole===r.id?r.color:"#e5e7eb"}`, background:editingRole===r.id?r.color+"10":"#fff", cursor:"pointer", fontWeight:editingRole===r.id?700:400, color:editingRole===r.id?r.color:"#374151", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
                      {r.emoji} {r.label}
                    </button>
                  ))}
                </div>

                {/* Info rôle */}
                {(() => { const r=ROLES_DEF[editingRole]; return (
                  <div style={{ padding:"12px 16px", borderRadius:10, background:`${r.color}06`, border:`1px solid ${r.border}`, marginBottom:18, display:"flex", gap:14, alignItems:"center" }}>
                    <span style={{ fontSize:28 }}>{r.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{r.label}</div>
                      <div style={{ fontSize:12, color:"#6b7280" }}>{r.description}</div>
                    </div>
                    {editingRole==="super_admin"&&<span style={{ padding:"4px 12px", borderRadius:8, background:"#fee2e2", color:"#dc2626", fontSize:12, fontWeight:700 }}>🔒 Non modifiable</span>}
                    {editingRole!=="super_admin"&&<button onClick={savePermissions} style={{ ...btnPrimary, background:r.color }}>💾 Sauvegarder</button>}
                  </div>
                )})()}

                {/* Légende */}
                <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
                  {Object.entries(PERM_LABELS).map(([k,l])=>(
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12 }}>
                      <div style={{ width:16, height:16, borderRadius:4, background:PERM_COLORS[k] }}/>
                      <span style={{ color:"#6b7280" }}>{l}</span>
                    </div>
                  ))}
                </div>

                {/* Matrice */}
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"#f9fafb" }}>
                        <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"#6b7280", fontWeight:600, minWidth:220 }}>Module</th>
                        <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, color:"#6b7280", fontWeight:600 }}>Catégorie</th>
                        {Object.entries(PERM_LABELS).map(([k,l])=>(
                          <th key={k} style={{ padding:"10px 14px", textAlign:"center", fontSize:11, color:PERM_COLORS[k], fontWeight:700, minWidth:90 }}>{l}</th>
                        ))}
                        <th style={{ padding:"10px 14px", textAlign:"center", fontSize:11, color:"#9ca3af", fontWeight:600 }}>Tout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const cats = [...new Set(MODULES.map(m=>m.cat))];
                        return cats.map(cat => (
                          <React.Fragment key={cat}>
                            <tr>
                              <td colSpan={7} style={{ padding:"8px 14px", background:"#f8fafc", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:"0.06em", borderTop:"1px solid #e5e7eb" }}>
                                {cat}
                              </td>
                            </tr>
                            {MODULES.filter(m=>m.cat===cat).map(m => {
                              const perms = permissions[editingRole]?.[m.id] || {};
                              const allOn = Object.values(perms).every(Boolean);
                              return (
                                <tr key={m.id} style={{ borderTop:"1px solid #f1f5f9" }}>
                                  <td style={{ padding:"10px 14px" }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                      <span style={{ fontSize:16 }}>{m.icon}</span>
                                      <span style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>{m.label}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding:"10px 14px" }}>
                                    <span style={{ fontSize:10, padding:"2px 7px", borderRadius:5, background:"#f3f4f6", color:"#6b7280" }}>{m.cat}</span>
                                  </td>
                                  {Object.keys(PERM_LABELS).map(perm=>(
                                    <td key={perm} style={{ padding:"10px 14px", textAlign:"center" }}>
                                      <div style={{ display:"flex", justifyContent:"center" }}>
                                        <PermCheckbox on={!!perms[perm]} color={PERM_COLORS[perm]} onChange={()=>togglePerm(editingRole,m.id,perm)} disabled={editingRole==="super_admin"}/>
                                      </div>
                                    </td>
                                  ))}
                                  <td style={{ padding:"10px 14px", textAlign:"center" }}>
                                    {editingRole!=="super_admin"&&(
                                      <div style={{ display:"flex", justifyContent:"center" }}>
                                        <PermCheckbox on={allOn} color={ROLES_DEF[editingRole]?.color||BET}
                                          onChange={()=>{ const newPerms=Object.fromEntries(Object.keys(PERM_LABELS).map(p=>[p,!allOn])); setPermissions(prev=>({...prev,[editingRole]:{...prev[editingRole],[m.id]:newPerms}})); }}/>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ SÉCURITÉ ══ */}
            {activeTab==="securite" && (
              <div className="gd-fade">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Politiques de Sécurité</h2>
                    <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Configurez les règles de sécurité par rôle</p>
                  </div>
                  <button onClick={()=>{ addAuditEntry("POLITIQUES_SAUVEGARDEES","Politiques de sécurité mises à jour"); toast.success("Politiques sauvegardées ✓"); }} style={btnPrimary}>💾 Sauvegarder toutes les politiques</button>
                </div>

                {stats.sans2fa > 0 && (
                  <div style={{ padding:"14px 18px", borderRadius:12, background:"#fff7ed", border:"1px solid #fed7aa", marginBottom:20, display:"flex", gap:12, alignItems:"center" }}>
                    <span style={{ fontSize:22 }}>⚠️</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#92400e" }}>{stats.sans2fa} utilisateur(s) actif(s) sans authentification 2FA</div>
                      <div style={{ fontSize:12, color:"#b45309" }}>Renforcez la sécurité en forçant le 2FA pour ces comptes.</div>
                    </div>
                    <button onClick={()=>{ setUsers(prev=>prev.map(u=>({...u,twofa:u.actif?true:u.twofa}))); addAuditEntry("2FA_FORCE_GLOBAL","2FA activé de force sur tous les comptes actifs"); toast.success(`2FA forcé sur ${stats.sans2fa} compte(s) ✓`); }} style={{ ...btnPrimary, marginLeft:"auto", background:BET_RED, whiteSpace:"nowrap" }}>
                      🔒 Forcer le 2FA sur tous
                    </button>
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:18 }}>
                  {Object.entries(securite).map(([roleId, pol]) => {
                    const r = ROLES_DEF[roleId];
                    return (
                      <div key={roleId} style={{ borderRadius:14, border:`1.5px solid ${r.border}`, padding:20, background:"#fff" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${r.border}` }}>
                          <span style={{ fontSize:24 }}>{r.emoji}</span>
                          <div>
                            <div style={{ fontWeight:700, fontSize:15, color:r.color }}>{r.label}</div>
                            <div style={{ fontSize:11, color:"#9ca3af" }}>Niveau {r.niveau} · {users.filter(u=>u.role===roleId).length} utilisateur(s)</div>
                          </div>
                        </div>

                        {/* 2FA */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>🔐 2FA obligatoire</div>
                            <div style={{ fontSize:11, color:"#9ca3af" }}>Authentification à 2 facteurs</div>
                          </div>
                          <ToggleSwitch on={pol.twofa_obligatoire} color={r.color} onChange={(v)=>{ setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],twofa_obligatoire:v}})); addAuditEntry("POLITIQUE_2FA",`${r.label} : 2FA obligatoire → ${v?"activé":"désactivé"}`,"warning"); }}/>
                        </div>

                        {/* Expiration session */}
                        <div style={{ marginBottom:14 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}>
                            <span style={{ fontWeight:600, color:"#374151" }}>⏱ Expiration session</span>
                            <strong style={{ color:r.color }}>{pol.expiration_session} min</strong>
                          </div>
                          <input type="range" min={15} max={480} step={15} value={pol.expiration_session}
                            onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],expiration_session:Number(e.target.value)}}))}/>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#d1d5db", marginTop:2 }}><span>15 min</span><span>8h</span></div>
                        </div>

                        {/* Tentatives max */}
                        <div style={{ marginBottom:14 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}>
                            <span style={{ fontWeight:600, color:"#374151" }}>🔄 Tentatives max</span>
                            <strong style={{ color:r.color }}>{pol.tentatives_max}</strong>
                          </div>
                          <input type="range" min={2} max={10} step={1} value={pol.tentatives_max}
                            onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],tentatives_max:Number(e.target.value)}}))}/>
                        </div>

                        {/* Rotation mot de passe */}
                        <div style={{ marginBottom:14 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}>
                            <span style={{ fontWeight:600, color:"#374151" }}>🔑 Rotation mdp</span>
                            <strong style={{ color:r.color }}>{pol.rotation_pwd_jours} jours</strong>
                          </div>
                          <input type="range" min={30} max={365} step={30} value={pol.rotation_pwd_jours}
                            onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],rotation_pwd_jours:Number(e.target.value)}}))}/>
                        </div>

                        {/* Complexité */}
                        <div style={{ marginBottom:10 }}>
                          <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>🛡️ Complexité mot de passe</label>
                          <select value={pol.complexite_pwd} onChange={e=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],complexite_pwd:e.target.value}}))} style={inputSt}>
                            <option value="normale">Normale (8 car. minimum)</option>
                            <option value="moyenne">Moyenne (12 car. + chiffres)</option>
                            <option value="haute">Haute (12 car. + spéciaux)</option>
                            <option value="tres_haute">Très haute (16 car. + tout)</option>
                          </select>
                        </div>

                        {/* IP restriction */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>🌐 Restriction IP</div>
                            <div style={{ fontSize:11, color:"#9ca3af" }}>Limiter aux IPs autorisées</div>
                          </div>
                          <ToggleSwitch on={pol.ip_restriction} color={r.color} onChange={(v)=>setSecurite(prev=>({...prev,[roleId]:{...prev[roleId],ip_restriction:v}}))}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ DEMANDES D'ACCÈS ══ */}
            {activeTab==="demandes" && (
              <div className="gd-fade">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Demandes d'accès</h2>
                    <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>{demandes.filter(d=>d.statut==="en_attente").length} demande(s) en attente de traitement</p>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
                  {demandes.map(d=>{
                    const r=ROLES_DEF[d.roleDemande];
                    const statutMeta = { en_attente:{ bg:"#fef3c7",c:"#92400e",label:"⏳ En attente" }, approuve:{ bg:"#dcfce7",c:"#166534",label:"✅ Approuvé" }, refuse:{ bg:"#fee2e2",c:"#991b1b",label:"❌ Refusé" } };
                    const sm=statutMeta[d.statut];
                    return (
                      <div key={d.id} style={{ borderRadius:14, border:`1.5px solid ${d.statut==="en_attente"?r?.border:"#e5e7eb"}`, background:"#fff", overflow:"hidden" }}>
                        <div style={{ height:4, background:d.statut==="en_attente"?r?.color||BET:d.statut==="approuve"?"#22c55e":"#9ca3af" }}/>
                        <div style={{ padding:18 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                              <div style={{ width:40, height:40, borderRadius:"50%", background:`${r?.color||BET}15`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:r?.color||BET }}>
                                {d.nom.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{d.nom}</div>
                                <div style={{ fontSize:11, color:"#9ca3af" }}>{d.email}</div>
                              </div>
                            </div>
                            <span style={{ padding:"3px 9px", borderRadius:10, fontSize:11, fontWeight:700, background:sm.bg, color:sm.c }}>{sm.label}</span>
                          </div>
                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:5 }}>Entreprise · Date</div>
                            <div style={{ fontSize:13, color:"#374151" }}>🏢 {d.entreprise} · 📅 {fmtDate(d.date)}</div>
                          </div>
                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:5 }}>Rôle demandé</div>
                            <RoleBadge role={d.roleDemande}/>
                          </div>
                          <div style={{ padding:"9px 12px", borderRadius:8, background:"#f8fafc", fontSize:12, color:"#374151", lineHeight:1.5, marginBottom:14 }}>
                            💬 {d.justification}
                          </div>
                          {d.statut==="en_attente"&&(
                            <div style={{ display:"flex", gap:8 }}>
                              <button onClick={()=>handleDemande(d.id,"approuver")} style={{ ...btnPrimary, flex:1, textAlign:"center", background:"#22c55e" }}>✅ Approuver</button>
                              <button onClick={()=>handleDemande(d.id,"refuser")} style={{ ...btnSecondary, flex:1, textAlign:"center", background:"#fee2e2", color:BET_RED, border:`1px solid #fecdd3` }}>❌ Refuser</button>
                              <button onClick={()=>{ setSelectedDemande(d); setShowDemandeModal(true); }} style={{ ...btnSecondary, padding:"9px 11px" }}>🔍</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ AUDIT LOG ══ */}
            {activeTab==="audit" && (
              <div className="gd-fade">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>Journal d'Audit</h2>
                    <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Traçabilité complète de toutes les actions administratives</p>
                  </div>
                  <button onClick={()=>{ const csv="Acteur,Rôle,Action,Détail,Date,IP,Statut\n"+auditLog.map(a=>[a.acteur,a.role,a.action,`"${a.detail}"`,a.date,a.ip,a.statut].join(",")).join("\n"); const el=document.createElement("a"); el.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv); el.download=`audit_log_${new Date().toISOString().split("T")[0]}.csv`; el.click(); toast.success("Journal exporté ✓"); }} style={btnSecondary}>⬇️ Export audit</button>
                </div>

                {/* Filtres */}
                <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                  {["Tous","success","warning","danger"].map(f=>{
                    const meta={ Tous:{bg:"#f3f4f6",c:"#374151"}, success:{bg:"#dcfce7",c:"#166534"}, warning:{bg:"#fef3c7",c:"#92400e"}, danger:{bg:"#fee2e2",c:"#991b1b"} };
                    const m=meta[f];
                    return (
                      <button key={f} onClick={()=>setFiltreAudit(f)} style={{ padding:"5px 14px", borderRadius:20, border:"1px solid", fontSize:12, cursor:"pointer",
                        background:filtreAudit===f?m.bg:"#fff", color:filtreAudit===f?m.c:"#6b7280",
                        borderColor:filtreAudit===f?m.bg:"#e5e7eb", fontWeight:filtreAudit===f?700:400 }}>
                        {f==="Tous"?"Tous":f==="success"?"✅ Succès":f==="warning"?"⚠️ Attention":"🚨 Alertes"}
                      </button>
                    );
                  })}
                  <span style={{ fontSize:12, color:"#9ca3af", alignSelf:"center", marginLeft:"auto" }}>{auditFiltres.length} entrée(s)</span>
                </div>

                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}><thead>
                    <tr style={{ background:"#f9fafb" }}>
                      {["","Acteur","Action","Détail","Date & Heure","IP Source"].map((h,i)=>(
                        <th key={i} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:"#6b7280", fontWeight:600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead><tbody>
                    {auditFiltres.map(a=>{
                      const meta={ success:{bg:"#f0fdf4",dot:"#22c55e",c:"#166534"}, warning:{bg:"#fff7ed",dot:"#f59e0b",c:"#92400e"}, danger:{bg:"#fff1f2",dot:"#ef4444",c:"#991b1b"} };
                      const m=meta[a.statut]||meta.success;
                      const r=ROLES_DEF[a.role];
                      return (
                        <tr key={a.id} style={{ borderTop:"1px solid #f1f5f9", background:a.statut==="danger"?"#fff8f8":a.statut==="warning"?"#fffaf0":"#fff" }}>
                          <td style={{ padding:"10px 12px" }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:m.dot, boxShadow:`0 0 0 3px ${m.dot}30` }}/>
                          </td>
                          <td style={{ padding:"10px 12px" }}>
                            <div style={{ fontWeight:600, fontSize:13 }}>{a.acteur}</div>
                            {r&&<RoleBadge role={a.role}/>}
                          </td>
                          <td style={{ padding:"10px 12px" }}>
                            <span style={{ padding:"3px 9px", borderRadius:8, fontSize:11, fontWeight:700, background:m.bg, color:m.c }}>{a.action.replace(/_/g," ")}</span>
                          </td>
                          <td style={{ padding:"10px 12px", fontSize:12, color:"#374151", maxWidth:260 }}>{a.detail}</td>
                          <td style={{ padding:"10px 12px", fontSize:12, color:"#6b7280", whiteSpace:"nowrap" }}>{a.date}</td>
                          <td style={{ padding:"10px 12px" }}>
                            <code style={{ fontSize:11, padding:"2px 7px", borderRadius:5, background:"#f3f4f6", color:"#374151" }}>{a.ip}</code>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody></table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ MODAL INVITER ══ */}
        {showInviteModal&&(
          <Modal title="Inviter un administrateur" subtitle="L'utilisateur recevra un email avec ses accès" onClose={()=>setShowInviteModal(false)}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={labelSt}>Nom complet *</label><input value={inviteForm.nom} onChange={e=>setInviteForm({...inviteForm,nom:e.target.value})} style={inputSt} placeholder="Prénom Nom"/></div>
              <div><label style={labelSt}>Email *</label><input type="email" value={inviteForm.email} onChange={e=>setInviteForm({...inviteForm,email:e.target.value})} style={inputSt} placeholder="email@domaine.ci"/></div>
            </div>
            <label style={labelSt}>Rôle à attribuer *</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {Object.values(ROLES_DEF).filter(r=>r.id!=="super_admin").map(r=>(
                <div key={r.id} onClick={()=>setInviteForm({...inviteForm,role:r.id})}
                  style={{ padding:"12px 14px", borderRadius:10, border:`2px solid ${inviteForm.role===r.id?r.color:"#e5e7eb"}`, background:inviteForm.role===r.id?r.color+"08":"#fff", cursor:"pointer" }}>
                  <div style={{ fontWeight:700, color:inviteForm.role===r.id?r.color:"#0f172a", fontSize:14 }}>{r.emoji} {r.label}</div>
                  <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>{r.description.slice(0,60)}…</div>
                </div>
              ))}
            </div>
            <label style={labelSt}>Accès temporaire (optionnel)</label>
            <input type="date" value={inviteForm.accessTemp} onChange={e=>setInviteForm({...inviteForm,accessTemp:e.target.value})} style={inputSt} min={new Date().toISOString().split("T")[0]}/>
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:-8, marginBottom:12 }}>Laissez vide pour un accès permanent.</div>
            <label style={labelSt}>Message personnalisé (optionnel)</label>
            <textarea value={inviteForm.note} onChange={e=>setInviteForm({...inviteForm,note:e.target.value})} style={{ ...inputSt, minHeight:60, resize:"vertical" }} placeholder="Message à inclure dans l'email d'invitation…"/>
            <div style={{ padding:"10px 14px", borderRadius:8, background:"#f0f9ff", border:"1px solid #bae6fd", fontSize:12, color:BET, marginBottom:16 }}>
              📧 Un email avec un lien d'activation sera envoyé à <strong>{inviteForm.email||"l'adresse saisie"}</strong>.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={sendInvite} style={btnPrimary}>📨 Envoyer l'invitation</button>
              <button onClick={()=>setShowInviteModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL MODIFIER UTILISATEUR ══ */}
        {showUserModal&&editingUser&&(
          <Modal title={`Modifier — ${editingUser.nom}`} subtitle="Modifier le rôle et les paramètres de cet utilisateur" onClose={()=>setShowUserModal(false)}>
            <div style={{ display:"flex", gap:14, padding:"12px 16px", borderRadius:10, background:`${ROLES_DEF[editingUser.role]?.bg}`, border:`1px solid ${ROLES_DEF[editingUser.role]?.border}`, marginBottom:18 }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:`${ROLES_DEF[editingUser.role]?.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:ROLES_DEF[editingUser.role]?.color }}>
                {editingUser.avatar}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{editingUser.nom}</div>
                <div style={{ fontSize:12, color:"#9ca3af" }}>{editingUser.email}</div>
                <div style={{ marginTop:5 }}><RoleBadge role={editingUser.role}/></div>
              </div>
            </div>
            <label style={labelSt}>Changer le rôle</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {Object.values(ROLES_DEF).filter(r=>r.id!=="super_admin").map(r=>(
                <div key={r.id} onClick={()=>setEditingUser({...editingUser,role:r.id})}
                  style={{ padding:"10px 12px", borderRadius:9, border:`2px solid ${editingUser.role===r.id?r.color:"#e5e7eb"}`, background:editingUser.role===r.id?r.color+"08":"#fff", cursor:"pointer" }}>
                  <div style={{ fontWeight:700, fontSize:13, color:editingUser.role===r.id?r.color:"#374151" }}>{r.emoji} {r.label}</div>
                </div>
              ))}
            </div>
            <label style={labelSt}>Accès temporaire</label>
            <input type="date" value={editingUser.accessTemp||""} onChange={e=>setEditingUser({...editingUser,accessTemp:e.target.value||null})} style={inputSt}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e5e7eb" }}>
                <span style={{ fontSize:13, fontWeight:500 }}>2FA activé</span>
                <ToggleSwitch on={editingUser.twofa} onChange={v=>setEditingUser({...editingUser,twofa:v})} color={BET}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderRadius:8, background:"#f8fafc", border:"1px solid #e5e7eb" }}>
                <span style={{ fontSize:13, fontWeight:500 }}>Restr. IP</span>
                <ToggleSwitch on={editingUser.ipRestr} onChange={v=>setEditingUser({...editingUser,ipRestr:v})} color={BET}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{ const old=users.find(u=>u.id===editingUser.id); setUsers(users.map(u=>u.id===editingUser.id?editingUser:u)); if(old.role!==editingUser.role) addAuditEntry("ROLE_MODIFIE",`${editingUser.nom} : ${old.role} → ${editingUser.role}`); toast.success("Modifications enregistrées ✓"); setShowUserModal(false); }} style={btnPrimary}>💾 Enregistrer</button>
              <button onClick={()=>setShowUserModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL RÉVOQUER SESSION ══ */}
        {showRevokeModal&&userToRevoke&&(
          <Modal title="Révoquer les sessions" subtitle="Cette action déconnectera l'utilisateur immédiatement" onClose={()=>setShowRevokeModal(false)} danger>
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
              <p style={{ fontSize:14, color:"#374151", lineHeight:1.7 }}>
                Vous êtes sur le point de déconnecter <strong>{userToRevoke.nom}</strong> ({ROLES_DEF[userToRevoke.role]?.label}) de toutes ses sessions actives ({userToRevoke.sessions} session(s)).
              </p>
              <p style={{ fontSize:13, color:"#9ca3af", marginTop:8 }}>L'utilisateur devra se reconnecter pour continuer.</p>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:16 }}>
              <button onClick={()=>revokeSession(userToRevoke.id)} style={{ ...btnPrimary, background:BET_RED }}>🔌 Révoquer les sessions</button>
              <button onClick={()=>setShowRevokeModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL CLONER PERMISSIONS ══ */}
        {showCloneModal&&(
          <Modal title="Cloner des permissions" subtitle="Copier la matrice de permissions d'un rôle vers un autre" onClose={()=>setShowCloneModal(false)}>
            <div style={{ padding:"12px 16px", borderRadius:10, background:"#fff7ed", border:"1px solid #fed7aa", fontSize:13, color:"#92400e", marginBottom:18 }}>
              ⚠️ Cette action remplacera toutes les permissions du rôle cible. L'action est irréversible (sauf sauvegarde manuelle).
            </div>
            <label style={labelSt}>Rôle source (copier de…)</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {Object.values(ROLES_DEF).map(r=>(
                <div key={r.id} onClick={()=>setCloneForm({...cloneForm,source:r.id})}
                  style={{ padding:"10px 12px", borderRadius:9, border:`2px solid ${cloneForm.source===r.id?r.color:"#e5e7eb"}`, background:cloneForm.source===r.id?r.color+"08":"#fff", cursor:"pointer" }}>
                  <div style={{ fontWeight:700, fontSize:13, color:cloneForm.source===r.id?r.color:"#374151" }}>{r.emoji} {r.label}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign:"center", fontSize:22, marginBottom:14 }}>↓</div>
            <label style={labelSt}>Rôle cible (coller vers…)</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18 }}>
              {Object.values(ROLES_DEF).filter(r=>r.id!=="super_admin").map(r=>(
                <div key={r.id} onClick={()=>setCloneForm({...cloneForm,cible:r.id})}
                  style={{ padding:"10px 12px", borderRadius:9, border:`2px solid ${cloneForm.cible===r.id?r.color:"#e5e7eb"}`, background:cloneForm.cible===r.id?r.color+"08":"#fff", cursor:"pointer", opacity:cloneForm.source===r.id?0.35:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:cloneForm.cible===r.id?r.color:"#374151" }}>{r.emoji} {r.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={clonePermissions} disabled={cloneForm.source===cloneForm.cible} style={{ ...btnPrimary, opacity:cloneForm.source===cloneForm.cible?0.5:1 }}>📋 Cloner les permissions</button>
              <button onClick={()=>setShowCloneModal(false)} style={btnSecondary}>Annuler</button>
            </div>
          </Modal>
        )}

        {/* ══ MODAL DÉTAIL DEMANDE ══ */}
        {showDemandeModal&&selectedDemande&&(
          <Modal title="Détail de la demande" subtitle={`Demande de ${selectedDemande.nom}`} onClose={()=>setShowDemandeModal(false)}>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { l:"Nom complet",   v:selectedDemande.nom },
                { l:"Email",         v:selectedDemande.email },
                { l:"Entreprise",    v:selectedDemande.entreprise },
                { l:"Rôle demandé",  v:<RoleBadge role={selectedDemande.roleDemande}/> },
                { l:"Date demande",  v:fmtDate(selectedDemande.date) },
              ].map(row=>(
                <div key={row.l} style={{ display:"flex", gap:16, padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                  <span style={{ width:140, fontSize:12, fontWeight:600, color:"#9ca3af", flexShrink:0 }}>{row.l}</span>
                  <span style={{ fontSize:13, color:"#374151" }}>{row.v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14, padding:"12px 16px", borderRadius:10, background:"#f8fafc", fontSize:13, color:"#374151", lineHeight:1.7 }}>
              💬 <strong>Justification :</strong> {selectedDemande.justification}
            </div>
            {selectedDemande.statut==="en_attente"&&(
              <div style={{ display:"flex", gap:10, marginTop:16 }}>
                <button onClick={()=>handleDemande(selectedDemande.id,"approuver")} style={{ ...btnPrimary, flex:1, textAlign:"center", background:"#22c55e" }}>✅ Approuver</button>
                <button onClick={()=>handleDemande(selectedDemande.id,"refuser")} style={{ ...btnSecondary, flex:1, textAlign:"center", color:BET_RED }}>❌ Refuser</button>
              </div>
            )}
          </Modal>
        )}

      </div>
    </div>
  );
}

/* ═══ STYLES ═══ */
const btnPrimary   = { padding:"9px 16px", background:BET, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"'DM Sans',sans-serif", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6 };
const btnSecondary = { padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:12, fontFamily:"'DM Sans',sans-serif" };
const btnGhost     = { padding:"5px 10px", background:"none", color:BET, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 };
const btnIconEdit  = { padding:"5px 9px", background:"#e0e7ff", color:BET, border:`1px solid ${BET}30`, borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600 };
const inputSt      = { padding:"9px 12px", marginBottom:12, width:"100%", borderRadius:8, border:"1px solid #d1d5db", boxSizing:"border-box", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#0f172a" };
const labelSt      = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:5 };