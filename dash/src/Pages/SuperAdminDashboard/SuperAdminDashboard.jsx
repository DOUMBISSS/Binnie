// src/Pages/SuperAdminDashboard/SuperAdminDashboard.jsx
// Route : <Route path="/superadmin-dashboard" element={<SuperAdminDashboard />} />

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import CloudinaryUpload, { AvatarUpload } from "../../Components/CloudinaryUpload";
import MessagerieTab from "../../Components/MessagerieTab";
import NotificationsTab from "../../Components/NotificationsTab";
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
   PARTENAIRES MANAGER — composant autonome
═══════════════════════════════════════════════════════ */
function PartenairesManager({ apiUrl, authHeaders }) {
  const [list,        setList]        = React.useState([]);
  const [loading,     setLoading]     = React.useState(true);
  const [saving,      setSaving]      = React.useState(false);
  const [uploading,   setUploading]   = React.useState(false);
  const [form,        setForm]        = React.useState({ nom:"", logo_url:"", site_web:"", ordre:0 });
  const [editId,      setEditId]      = React.useState(null);
  const [editVals,    setEditVals]    = React.useState({});

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${apiUrl}/api/partenaires`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setList(d); }
    } catch {}
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const uploadLogo = async (file, target) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch(`${apiUrl}/api/upload/image`, { method:"POST", headers:{ Authorization:`Bearer ${localStorage.getItem("admin_token")}` }, body:fd });
      const d = await r.json();
      const url = d.file?.url || d.url || d.publicUrl || d.path;
      if (target === "form") setForm(p=>({...p, logo_url:url}));
      else setEditVals(p=>({...p, logo_url:url}));
    } catch { alert("Erreur upload"); }
    finally { setUploading(false); }
  };

  const create = async () => {
    if (!form.nom.trim() || !form.logo_url) { alert("Nom et logo requis"); return; }
    setSaving(true);
    try {
      const r = await fetch(`${apiUrl}/api/partenaires`, { method:"POST", headers:authHeaders(), body:JSON.stringify(form) });
      if (r.ok) { setForm({ nom:"", logo_url:"", site_web:"", ordre:0 }); await load(); }
    } catch {}
    finally { setSaving(false); }
  };

  const update = async (id) => {
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/partenaires/${id}`, { method:"PATCH", headers:authHeaders(), body:JSON.stringify(editVals) });
      setEditId(null); setEditVals({});
      await load();
    } catch {}
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer ce partenaire ?")) return;
    await fetch(`${apiUrl}/api/partenaires/${id}`, { method:"DELETE", headers:authHeaders() });
    await load();
  };

  const toggle = async (id, actif) => {
    await fetch(`${apiUrl}/api/partenaires/${id}`, { method:"PATCH", headers:authHeaders(), body:JSON.stringify({ actif:!actif }) });
    await load();
  };

  const inputSt = { padding:"8px 10px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>🤝 Configuration Partenaires</h3>
          <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Logos affichés dans le carrousel partenaires de la page d'accueil</p>
        </div>
        <button onClick={load} style={{ padding:"8px 14px", background:"#e0f2fe", color:"#0369a1", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>🔄 Actualiser</button>
      </div>

      {/* Formulaire d'ajout */}
      <div style={{ background:"#f8fafc", borderRadius:14, padding:18, border:"1.5px dashed #cbd5e1", marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:12 }}>➕ Ajouter un partenaire</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:4 }}>Nom du partenaire *</label>
            <input value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="Ex : GIZ" style={inputSt} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:4 }}>Site web</label>
            <input value={form.site_web} onChange={e=>setForm(p=>({...p,site_web:e.target.value}))} placeholder="https://..." style={inputSt} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:4 }}>Ordre d'affichage</label>
            <input type="number" value={form.ordre} onChange={e=>setForm(p=>({...p,ordre:Number(e.target.value)}))} style={inputSt} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"#64748b" }}>Logo *</label>
            <label style={{ padding:"7px 12px", background:"#0891b2", color:"#fff", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700, textAlign:"center", whiteSpace:"nowrap" }}>
              {uploading ? "…" : "📁 Choisir"}
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>e.target.files[0]&&uploadLogo(e.target.files[0],"form")} />
            </label>
          </div>
        </div>
        {form.logo_url && (
          <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:12 }}>
            <img src={form.logo_url} alt="" style={{ height:40, maxWidth:120, objectFit:"contain", background:"#e2e8f0", borderRadius:6, padding:4 }} />
            <span style={{ fontSize:11, color:"#64748b", wordBreak:"break-all" }}>{form.logo_url}</span>
          </div>
        )}
        <button onClick={create} disabled={saving||uploading||!form.nom||!form.logo_url}
          style={{ marginTop:14, padding:"9px 20px", background:"#0891b2", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", opacity:(saving||uploading||!form.nom||!form.logo_url)?0.6:1 }}>
          {saving ? "Ajout…" : "➕ Ajouter le partenaire"}
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>⏳ Chargement…</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign:"center", padding:32, color:"#94a3b8", fontSize:13 }}>Aucun partenaire ajouté pour l'instant.</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
          {list.map(p => {
            const isEditing = editId === p.id;
            const ev = editVals;
            return (
              <div key={p.id} style={{ background:"#fff", borderRadius:14, border:"1.5px solid #e2e8f0", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
                <div style={{ height:3, background:p.actif?"#22c55e":"#e2e8f0" }} />
                <div style={{ padding:"14px 16px" }}>
                  {/* Logo */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <div style={{ width:64, height:40, display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0", flexShrink:0 }}>
                      <img src={isEditing&&ev.logo_url!==undefined?ev.logo_url:p.logo_url} alt={p.nom}
                        style={{ maxWidth:56, maxHeight:34, objectFit:"contain" }}
                        onError={e=>{ e.currentTarget.parentElement.style.background="#e2e8f0"; e.currentTarget.style.display="none"; }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      {isEditing ? (
                        <input value={ev.nom!==undefined?ev.nom:p.nom} onChange={e=>setEditVals(v=>({...v,nom:e.target.value}))} style={{ ...inputSt, fontSize:13, fontWeight:700 }} />
                      ) : (
                        <div style={{ fontSize:14, fontWeight:800, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.nom}</div>
                      )}
                      <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>Ordre : {p.ordre}</div>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, background:p.actif?"#dcfce7":"#f3f4f6", color:p.actif?"#15803d":"#6b7280" }}>
                      {p.actif?"Actif":"Inactif"}
                    </span>
                  </div>

                  {isEditing && (
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
                      <input value={ev.site_web!==undefined?ev.site_web:(p.site_web||"")} onChange={e=>setEditVals(v=>({...v,site_web:e.target.value}))} placeholder="Site web" style={inputSt} />
                      <div style={{ display:"flex", gap:6 }}>
                        <input type="number" value={ev.ordre!==undefined?ev.ordre:p.ordre} onChange={e=>setEditVals(v=>({...v,ordre:Number(e.target.value)}))} placeholder="Ordre" style={{...inputSt,width:80}} />
                        <label style={{ flex:1, padding:"7px 10px", background:"#e0f2fe", color:"#0369a1", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700, textAlign:"center" }}>
                          {uploading?"…":"📁 Changer logo"}
                          <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>e.target.files[0]&&uploadLogo(e.target.files[0],"edit")} />
                        </label>
                      </div>
                    </div>
                  )}

                  {p.site_web && !isEditing && (
                    <div style={{ fontSize:11, color:"#0891b2", marginBottom:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>🔗 {p.site_web}</div>
                  )}

                  {/* Actions */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {isEditing ? (
                      <>
                        <button onClick={()=>update(p.id)} disabled={saving} style={{ flex:1, padding:"6px 10px", background:"#22c55e", color:"#fff", border:"none", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>{saving?"…":"✓ Enregistrer"}</button>
                        <button onClick={()=>{setEditId(null);setEditVals({});}} style={{ padding:"6px 10px", background:"#e5e7eb", border:"none", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={()=>{setEditId(p.id);setEditVals({});}} style={{ flex:1, padding:"6px 10px", background:"#e0f2fe", color:"#0369a1", border:"none", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>✏️ Modifier</button>
                        <button onClick={()=>toggle(p.id,p.actif)} style={{ padding:"6px 10px", background:p.actif?"#fef3c7":"#dcfce7", color:p.actif?"#d97706":"#16a34a", border:"none", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>{p.actif?"⏸":"▶"}</button>
                        <button onClick={()=>remove(p.id)} style={{ padding:"6px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
const ROLES_AVEC_CENTRE = ["admin","manager","responsable","commercial","gestionnaire","coach","onboarding","pedagogical_advisor","superviseur"];

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
  super_admin:          { id:"super_admin",          label:"Super Admin",           emoji:"👑", color:BET_RED,   border:"#fecaca", niveau:7, description:"Accès total, toutes permissions, non modifiable" },
  admin:                { id:"admin",                label:"Administrateur",        emoji:"🔧", color:BET_COLOR, border:"#bae6fd", niveau:6, description:"Gestion complète sauf paramètres critiques" },
  manager:              { id:"manager",              label:"Manager",               emoji:"👥", color:"#10b981", border:"#a7f3d0", niveau:5, description:"Supervision et reporting" },
  superviseur:          { id:"superviseur",          label:"Superviseur",           emoji:"🔭", color:"#0284c7", border:"#bae6fd", niveau:5, description:"Superviseur / Deputy Superviseur — contrôle opérationnel" },
  responsable:          { id:"responsable",          label:"Responsable",           emoji:"📋", color:"#8b5cf6", border:"#c4b5fd", niveau:4, description:"Gestion des équipes et suivi pédagogique" },
  pedagogical_advisor:  { id:"pedagogical_advisor",  label:"Pedagogical Advisor",   emoji:"🧑‍🏫", color:"#7c3aed", border:"#ede9fe", niveau:4, description:"Classes privées + Validation des honoraires enseignants" },
  commercial:           { id:"commercial",           label:"Commercial",            emoji:"📈", color:"#f59e0b", border:"#fcd34d", niveau:3, description:"CRM, inscriptions et ventes" },
  onboarding:           { id:"onboarding",           label:"Assistant Onboarding",  emoji:"🚀", color:"#0891b2", border:"#a5f3fc", niveau:3, description:"Création de classes (cours en groupe) et attribution d'enseignants" },
  gestionnaire:         { id:"gestionnaire",         label:"Gestionnaire",          emoji:"🗂️", color:"#059669", border:"#6ee7b7", niveau:3, description:"Administratif, finances, planning" },
  rh:                   { id:"rh",                   label:"Espace RH / Paie",      emoji:"👔", color:"#db2777", border:"#fbcfe8", niveau:3, description:"Gestion RH, contrats, fiches de paie et congés" },
  comptable:            { id:"comptable",            label:"Comptable / Trésorier", emoji:"🧾", color:"#d97706", border:"#fde68a", niveau:3, description:"Comptabilité, trésorerie et rapports financiers" },
  coach:                { id:"coach",                label:"Coach",                 emoji:"🎓", color:"#6366f1", border:"#a5b4fc", niveau:2, description:"Pédagogie, cours et examens" },
  customer_care:        { id:"customer_care",        label:"Customer Care",         emoji:"🎧", color:"#0e7490", border:"#a5f3fc", niveau:2, description:"Prise en charge, suivi et résolution des plaintes clients" },
  data_collector:       { id:"data_collector",       label:"Data Collector",        emoji:"📊", color:"#64748b", border:"#e2e8f0", niveau:1, description:"Saisie de données uniquement" },
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
const SA_PROGRESSION = { moyenneProgression:69, resultatsParNiveau:{ A1:54, A2:63, B1:72, B2:80, C1:87, C2:94 }, assiduiteMoyenne:85, bulletinsGeneres:1870, certificatsDelivres:312 };

// ── Helpers stables pour le modal Certifications ──────────────────────────
// Définis au niveau module (pas dans le rendu) pour éviter le re-montage à chaque frappe
// ── Helpers stables pour le modal Aperçu Cours ───────────────────────────
const ApercuStringList = ({ modal, setModal, field, placeholder }) => {
  const list = modal?.data?.[field] || [];
  const setD = updater => setModal(m => ({ ...m, data: updater(m.data) }));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {list.map((item, i) => (
        <div key={i} style={{ display:"flex", gap:6, alignItems:"center" }}>
          <input value={item} onChange={e => { const u=[...list]; u[i]=e.target.value; setD(prev => ({...prev,[field]:u})); }}
            placeholder={placeholder} style={{ flex:1, padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
          <button onClick={() => setD(prev => ({...prev,[field]:list.filter((_,j)=>j!==i)}))}
            style={{ width:28, height:28, border:"none", borderRadius:7, background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontSize:13, flexShrink:0 }}>✕</button>
        </div>
      ))}
      <button onClick={() => setD(prev => ({...prev,[field]:[...list,""]}))}
        style={{ alignSelf:"flex-start", padding:"6px 12px", background:"#f1f5f9", border:"1px dashed #94a3b8", borderRadius:7, fontSize:11, color:"#475569", cursor:"pointer", fontWeight:600 }}>➕ Ajouter</button>
    </div>
  );
};
const ApercuObjList = ({ modal, setModal, field, keys, placeholders }) => {
  const list = modal?.data?.[field] || [];
  const setD = updater => setModal(m => ({ ...m, data: updater(m.data) }));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {list.map((item, i) => (
        <div key={i} style={{ background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px 12px" }}>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:6 }}>
            <button onClick={() => setD(prev => ({...prev,[field]:list.filter((_,j)=>j!==i)}))}
              style={{ width:24, height:24, border:"none", borderRadius:6, background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontSize:12 }}>✕</button>
          </div>
          {keys.map((k, ki) => (
            <div key={k} style={{ marginBottom:ki < keys.length-1 ? 8 : 0 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#374151", display:"block", marginBottom:3 }}>{k}</label>
              <input value={item[k]||""} onChange={e => { const u=list.map((x,j)=>j===i?{...x,[k]:e.target.value}:x); setD(prev => ({...prev,[field]:u})); }}
                placeholder={placeholders?.[ki]||""} style={{ width:"100%", padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
            </div>
          ))}
        </div>
      ))}
      <button onClick={() => { const empty={}; keys.forEach(k=>empty[k]=""); setD(prev => ({...prev,[field]:[...list,empty]})); }}
        style={{ alignSelf:"flex-start", padding:"6px 12px", background:"#f1f5f9", border:"1px dashed #94a3b8", borderRadius:7, fontSize:11, color:"#475569", cursor:"pointer", fontWeight:600 }}>➕ Ajouter</button>
    </div>
  );
};

// ── Helpers stables pour le modal Certifications ──────────────────────────
const CertifFieldInput = ({ modal, setModal, label, field, path, placeholder, multiline, type="text" }) => {
  const val = path ? (modal?.data?.[path]?.[field] ?? "") : (modal?.data?.[field] ?? "");
  const onChange = e => {
    const v = type === "number" ? Number(e.target.value) : e.target.value;
    if (path) { setModal(m => ({...m, data:{...m.data, [path]:{...m.data[path],[field]:v}}})); }
    else       { setModal(m => ({...m, data:{...m.data,[field]:v}})); }
  };
  return (
    <div>
      <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{label}</label>
      {multiline
        ? <textarea value={val} onChange={onChange} placeholder={placeholder} rows={3}
            style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box", resize:"vertical" }} />
        : <input value={val} onChange={onChange} placeholder={placeholder} type={type}
            style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
      }
    </div>
  );
};
const CertifStringList = ({ modal, setModal, field, placeholder }) => {
  const list = modal?.data?.[field] || [];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {list.map((item, i) => (
        <div key={i} style={{ display:"flex", gap:6, alignItems:"center" }}>
          <input value={item} onChange={e => { const u=[...list]; u[i]=e.target.value; setModal(m=>({...m,data:{...m.data,[field]:u}})); }}
            placeholder={placeholder} style={{ flex:1, padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
          <button onClick={() => { const u=list.filter((_,j)=>j!==i); setModal(m=>({...m,data:{...m.data,[field]:u}})); }}
            style={{ width:28, height:28, border:"none", borderRadius:7, background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontSize:13, flexShrink:0 }}>✕</button>
        </div>
      ))}
      <button onClick={() => setModal(m=>({...m,data:{...m.data,[field]:[...list,""]}}))}
        style={{ alignSelf:"flex-start", padding:"6px 12px", background:"#f1f5f9", border:"1px dashed #94a3b8", borderRadius:7, fontSize:11, color:"#475569", cursor:"pointer", fontWeight:600 }}>
        ➕ Ajouter
      </button>
    </div>
  );
};
const CertifObjList = ({ modal, setModal, field, fields }) => {
  const list = modal?.data?.[field] || [];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {list.map((item, i) => (
        <div key={i} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"10px 12px" }}>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:6 }}>
            <button onClick={() => { const u=list.filter((_,j)=>j!==i); setModal(m=>({...m,data:{...m.data,[field]:u}})); }}
              style={{ padding:"3px 8px", border:"none", borderRadius:5, background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontSize:11, fontWeight:700 }}>🗑️ Supprimer</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8 }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize:11, fontWeight:600, color:"#374151", display:"block", marginBottom:3 }}>{f.label}</label>
                {f.multiline
                  ? <textarea value={item[f.key]||""} rows={2} onChange={e => { const u=[...list]; u[i]={...u[i],[f.key]:e.target.value}; setModal(m=>({...m,data:{...m.data,[field]:u}})); }}
                      style={{ width:"100%", padding:"6px 9px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:12, resize:"vertical", boxSizing:"border-box" }} />
                  : <input value={item[f.key]||""} onChange={e => { const u=[...list]; u[i]={...u[i],[f.key]:e.target.value}; setModal(m=>({...m,data:{...m.data,[field]:u}})); }}
                      style={{ width:"100%", padding:"6px 9px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:12, boxSizing:"border-box" }} />
                }
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => { const empty={}; fields.forEach(f=>{empty[f.key]="";}); setModal(m=>({...m,data:{...m.data,[field]:[...list,empty]}})); }}
        style={{ alignSelf:"flex-start", padding:"6px 12px", background:"#f1f5f9", border:"1px dashed #94a3b8", borderRadius:7, fontSize:11, color:"#475569", cursor:"pointer", fontWeight:600 }}>
        ➕ Ajouter
      </button>
    </div>
  );
};

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
  const [filtreCentre, setFiltreCentre] = useState("Tous");
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
  const [inviteForm, setInviteForm] = useState({ nom:"", email:"", telephone:"", role:"manager", centre_id:"", accessTemp:"", note:"", type_cours:"en_ligne", quota_jour:10, jours_travail:["lundi","mardi","mercredi","jeudi","vendredi"], profil_assistante:"b2c", photo:"", coach_matricule:"", coach_filiere:"", coach_lieu_habitation:"", coach_date_debut:"", coach_nb_contrats:0, coach_certifications:[], coach_certif_input:"" });
  const [invitePhotoUploading, setInvitePhotoUploading] = useState(false);
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

  // ── Avis offres ──────────────────────────────────────────────────────────
  const [avisOffres,      setAvisOffres]      = useState([]);
  const [avisLoading,     setAvisLoading]     = useState(false);
  const [avisFiltre,      setAvisFiltre]      = useState("tous"); // "tous"|"cours"|"certification"
  const fetchAvisOffres = async () => {
    setAvisLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/avis`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setAvisOffres(d.avis || []);
    } catch { toast.error("Erreur chargement des avis"); }
    finally { setAvisLoading(false); }
  };
  const toggleAvis = async (id, actif) => {
    try {
      await fetch(`${API_URL}/api/avis/${id}`, { method:"PATCH", headers:authHeaders(), body:JSON.stringify({actif}) });
      setAvisOffres(prev => prev.map(a => a.id===id ? {...a,actif} : a));
      toast.success(actif ? "Avis réactivé" : "Avis désactivé");
    } catch { toast.error("Erreur"); }
  };
  const deleteAvis = async (id) => {
    if (!window.confirm("Supprimer définitivement cet avis ?")) return;
    try {
      await fetch(`${API_URL}/api/avis/${id}`, { method:"DELETE", headers:authHeaders() });
      setAvisOffres(prev => prev.filter(a => a.id !== id));
      toast.success("Avis supprimé");
    } catch { toast.error("Erreur"); }
  };

  const [temos, setTemos]                   = useState([]);
  const [temosLoading, setTemosLoading]     = useState(false);
  const [temoFiltre, setTemoFiltre]         = useState("tous");
  const [temoForm, setTemoForm]             = useState({ nom:"", role:"", score:"", certType:"", certScore:"", texte:"", avatar:"🎓", couleur:"#1e4080", etoiles:5, ordre:0, photo_url:"", video_url:"" });
  const [temoUploading, setTemoUploading]   = useState(null); // "photo" | "video" | null
  const [temoUploadPct, setTemoUploadPct]   = useState(0);
  const temoFileRef = React.useRef(null);
  const [temoFileTarget, setTemoFileTarget] = useState(null); // "photo" | "video"
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

  const temoAction = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/api/temoignages/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
      setTemos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success("Témoignage mis à jour");
    } catch (e) { toast.error(e.message || "Erreur mise à jour"); }
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
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
      const created = data;
      setTemos(prev => [created, ...prev]);
      setTemoForm({ nom:"", role:"", score:"", certType:"", certScore:"", texte:"", avatar:"🎓", couleur:"#1e4080", etoiles:5, ordre:0, photo_url:"", video_url:"" });
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

  const temoUploadMedia = async (file, target) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const endpoint = isVideo ? "/api/upload/video" : "/api/upload/image";
    setTemoUploading(target); setTemoUploadPct(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}${endpoint}`);
        xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("admin_token")}`);
        xhr.upload.onprogress = e => { if (e.lengthComputable) setTemoUploadPct(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => {
          try {
            const d = JSON.parse(xhr.responseText);
            if (xhr.status >= 400) { reject(new Error(d.error || "Erreur upload")); return; }
            resolve(d.file?.url || d.url || "");
          } catch { reject(new Error("Réponse invalide")); }
        };
        xhr.onerror = () => reject(new Error("Erreur réseau"));
        xhr.send(formData);
      });
      if (!url) throw new Error("URL non reçue");
      setTemoForm(f => ({ ...f, [target === "photo" ? "photo_url" : "video_url"]: url }));
      toast.success(`${target === "photo" ? "Photo" : "Vidéo"} uploadée !`);
    } catch (e) { toast.error(e.message); }
    finally { setTemoUploading(null); setTemoUploadPct(0); }
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
  const [waSavingIdx,    setWaSavingIdx]    = useState(null);

  // Config contact centrale (bouton flottant, footer, page contact)
  const [contactConfig,     setContactConfig]     = useState({ whatsapp_number:"", whatsapp_message:"", email_central:"", localisation:"", maps_embed_url:"" });
  const [contactConfigLoad, setContactConfigLoad] = useState(false);
  const [contactConfigSave, setContactConfigSave] = useState(false);

  useEffect(() => {
    const load = async () => {
      setContactConfigLoad(true);
      try {
        const r = await fetch(`${API_URL}/api/config-contact`);
        if (r.ok) { const d = await r.json(); setContactConfig(d); }
      } catch {}
      setContactConfigLoad(false);
    };
    load();
  }, []); // eslint-disable-line

  const saveContactConfig = async () => {
    setContactConfigSave(true);
    try {
      const token = localStorage.getItem("admin_token");
      const r = await fetch(`${API_URL}/api/config-contact`, {
        method: "PUT",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify(contactConfig),
      });
      if (r.ok) {
        toast.success("✓ Configuration de contact sauvegardée");
        // Notifie le frontend pour rechargement immédiat
        localStorage.setItem("bet_contact_config", JSON.stringify(contactConfig));
        window.dispatchEvent(new StorageEvent("storage", { key:"bet_contact_config", newValue:JSON.stringify(contactConfig) }));
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch { toast.error("Erreur réseau"); }
    setContactConfigSave(false);
  };

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
    if (filtreCentre !== "Tous") {
      if (filtreCentre === "national") {
        r = r.filter(u => !u.scope || u.scope.includes("national") || u.role === "super_admin");
      } else {
        r = r.filter(u => u.scope && u.scope.includes(filtreCentre));
      }
    }
    if (filtreStatut === "Actifs") r = r.filter(u => u.actif);
    if (filtreStatut === "Inactifs") r = r.filter(u => !u.actif);
    if (filtreStatut === "Sans 2FA") r = r.filter(u => !u.twofa);
    if (filtreStatut === "En ligne") r = r.filter(u => onlineUsers.includes(u.id));
    if (searchUser) r = r.filter(u => u.nom.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase()));
    return r;
  }, [users, filtreRole, filtreCentre, filtreStatut, searchUser, onlineUsers]);

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
        avatar_url: inviteForm.photo || null,
      };
      // Pour les coachs : inclure les infos spécifiques
      if (inviteForm.role === "coach") {
        payload.coach_info = {
          photo_url:           inviteForm.photo               || null,
          matricule:           inviteForm.coach_matricule      || null,
          filiere:             inviteForm.coach_filiere        || null,
          lieu_habitation:     inviteForm.coach_lieu_habitation || null,
          date_debut_bet:      inviteForm.coach_date_debut     || null,
          nb_contrats_actifs:  inviteForm.coach_nb_contrats    || 0,
          certifications:      inviteForm.coach_certifications.length ? inviteForm.coach_certifications : null,
        };
      }
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
      setInviteForm({ nom:"", email:"", telephone:"", role:"manager", centre_id:"", accessTemp:"", note:"", type_cours:"en_ligne", quota_jour:10, jours_travail:["lundi","mardi","mercredi","jeudi","vendredi"], profil_assistante:"b2c", photo:"", coach_matricule:"", coach_filiere:"", coach_lieu_habitation:"", coach_date_debut:"", coach_nb_contrats:0, coach_certifications:[], coach_certif_input:"" });
    } catch { toast.error("Impossible de joindre le serveur"); }
  };

  const uploadInvitePhoto = async (file) => {
    setInvitePhotoUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch(`${API_URL}/api/upload/avatar`, { method:"POST", headers:{ Authorization:`Bearer ${localStorage.getItem("admin_token")}` }, body:fd });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || `Erreur ${r.status} — upload photo`); return; }
      const url = d.file?.url || d.url || "";
      if (url) setInviteForm(p => ({ ...p, photo: url }));
      else toast.error("Upload échoué — URL manquante");
    } catch (e) { toast.error("Erreur réseau upload photo"); }
    finally { setInvitePhotoUploading(false); }
  };

  const openCoachModal = (coach) => {
    setSelectedCoach(coach);
    setCoachModalTab("infos");
    setCoachContrats([]);
    setCoachGroupes([]);
    setShowContratForm(false);
    setContratEditId(null);
    fetchCoachContrats(coach.id);
    fetchCoachGroupes(coach.id);
  };

  const fetchCoachContrats = async (coachId) => {
    setCoachContratsLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/contrats-prives?coach_id=${coachId}`, { headers: authHeaders() });
      const d = await r.json();
      setCoachContrats(d.contrats || []);
    } catch {}
    finally { setCoachContratsLoading(false); }
  };

  const fetchCoachGroupes = async (coachId) => {
    setCoachGroupesLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/groupes?coach_id=${coachId}`, { headers: authHeaders() });
      const d = await r.json();
      setCoachGroupes(d.groupes || []);
    } catch {}
    finally { setCoachGroupesLoading(false); }
  };

  const saveContrat = async () => {
    if (!contratForm.apprenant_nom || !contratForm.prix_h) {
      toast.error("Nom apprenant et prix/h sont requis"); return;
    }
    setContratSaving(true);
    try {
      const url = contratEditId
        ? `${API_URL}/api/contrats-prives/${contratEditId}`
        : `${API_URL}/api/contrats-prives`;
      const method = contratEditId ? "PATCH" : "POST";
      const body = contratEditId
        ? contratForm
        : { ...contratForm, coach_id: selectedCoach.id };
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
      toast.success(contratEditId ? "Contrat mis à jour ✓" : "Contrat créé ✓");
      setShowContratForm(false);
      setContratEditId(null);
      setContratForm({ apprenant_nom:"", apprenant_prenom:"", apprenant_email:"", apprenant_telephone:"", type_contrat:"en_ligne", niveau:"B1", objectif:"", prix_h:"", nb_seances_total:"", duree_seance_h:"1.5", date_debut:"", date_fin:"", note:"" });
      fetchCoachContrats(selectedCoach.id);
    } catch { toast.error("Erreur sauvegarde contrat"); }
    finally { setContratSaving(false); }
  };

  const patchContrat = async (id, updates) => {
    try {
      const r = await fetch(`${API_URL}/api/contrats-prives/${id}`, { method:"PATCH", headers: authHeaders(), body: JSON.stringify(updates) });
      if (!r.ok) throw new Error();
      fetchCoachContrats(selectedCoach.id);
    } catch { toast.error("Erreur mise à jour"); }
  };

  const deleteContrat = async (id) => {
    if (!window.confirm("Supprimer ce contrat ?")) return;
    try {
      await fetch(`${API_URL}/api/contrats-prives/${id}`, { method:"DELETE", headers: authHeaders() });
      toast.success("Contrat supprimé");
      fetchCoachContrats(selectedCoach.id);
    } catch { toast.error("Erreur suppression"); }
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

  // ── Gestion Articles Blog ────────────────────────────────
  const BLOG_CATEGORIES = ["Actualités","Conseils","Certifications","Entreprises","Réussite","Événements","Général"];
  const BLOG_FORM_INIT  = { titre:"", extrait:"", contenu:"", categorie:"Actualités", auteur:"Admin", read_time:"", image_url:"", video_url:"", publie:false };
  const [blogInnerTab,     setBlogInnerTab]     = useState("articles");
  const [blogArticles,     setBlogArticles]     = useState([]);
  const [blogLoading,      setBlogLoading]      = useState(false);
  const [blogForm,         setBlogForm]         = useState(BLOG_FORM_INIT);
  const [blogFormOpen,     setBlogFormOpen]     = useState(false);
  const [blogEditId,       setBlogEditId]       = useState(null);
  const [blogSearch,       setBlogSearch]       = useState("");
  const [blogUploading,    setBlogUploading]    = useState(null);
  const [blogUploadPct,    setBlogUploadPct]    = useState(0);
  const [blogFileTarget,   setBlogFileTarget]   = useState("image");
  const blogFileRef = useRef(null);

  const fetchBlogArticles = async () => {
    setBlogLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/blog/admin/all`, { headers: authHeaders() });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setBlogArticles(d.articles || []);
    } catch { toast.error("Erreur chargement articles"); }
    finally { setBlogLoading(false); }
  };

  const blogSave = async () => {
    if (!blogForm.titre.trim()) return toast.error("Titre requis");
    try {
      const method = blogEditId ? "PUT" : "POST";
      const url    = blogEditId ? `${API_URL}/api/blog/${blogEditId}` : `${API_URL}/api/blog`;
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(blogForm) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      toast.success(blogEditId ? "Article mis à jour" : "Article créé");
      setBlogFormOpen(false); setBlogEditId(null); setBlogForm(BLOG_FORM_INIT);
      fetchBlogArticles();
    } catch (e) { toast.error(e.message); }
  };

  const blogTogglePublie = async (id, publie) => {
    try {
      await fetch(`${API_URL}/api/blog/${id}/publie`, { method:"PATCH", headers: authHeaders(), body: JSON.stringify({ publie: !publie }) });
      setBlogArticles(p => p.map(a => a.id===id ? {...a, publie:!publie} : a));
    } catch { toast.error("Erreur"); }
  };

  const blogDelete = async (id) => {
    if (!window.confirm("Supprimer cet article définitivement ?")) return;
    try {
      await fetch(`${API_URL}/api/blog/${id}`, { method:"DELETE", headers: authHeaders() });
      setBlogArticles(p => p.filter(a => a.id !== id));
      toast.success("Article supprimé");
    } catch { toast.error("Erreur suppression"); }
  };

  const blogUploadMedia = async (file, target) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const endpoint = isVideo ? "/api/upload/video" : "/api/upload/image";
    setBlogUploading(target); setBlogUploadPct(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}${endpoint}`);
        xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("admin_token")}`);
        xhr.upload.onprogress = e => { if (e.lengthComputable) setBlogUploadPct(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => {
          try {
            const d = JSON.parse(xhr.responseText);
            if (xhr.status >= 400) { reject(new Error(d.error || "Erreur upload")); return; }
            resolve(d.file?.url || d.url || "");
          } catch { reject(new Error("Réponse invalide")); }
        };
        xhr.onerror = () => reject(new Error("Erreur réseau"));
        xhr.send(formData);
      });
      if (!url) throw new Error("URL non reçue");
      setBlogForm(f => ({ ...f, [target === "video" ? "video_url" : "image_url"]: url }));
      toast.success(`${target === "video" ? "Vidéo" : "Image"} uploadée !`);
    } catch (e) { toast.error(e.message); }
    finally { setBlogUploading(null); setBlogUploadPct(0); }
  };

  // ── Commentaires Blog ────────────────────────────────────
  const [blogComments,        setBlogComments]        = useState([]);
  const [blogCommentsLoading, setBlogCommentsLoading] = useState(false);
  const [blogCommentsSearch,  setBlogCommentsSearch]  = useState("");
  const [blogExpandedArticle, setBlogExpandedArticle] = useState(null);

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


  const fetchApprenants = async () => {
    setLoadingApprenants(true);
    try {
      const res  = await fetch(`${API_URL}/api/parcours/assignations`, { headers: authHeaders() });
      const data = await res.json();
      const all  = (data.assignations || []).map(a => ({
        id:              a.id,
        nom:             a.prospect_nom       || "—",
        email:           a.prospect_email     || "—",
        telephone:       a.prospect_telephone || "—",
        type_cours:      a.type_cours         || "—",
        type_coaching:   a.type_coaching      || "—",
        centre_id:       a.centre_id          || null,
        centre_nom:      a.centre_nom         || null,
        statut:          a.statut             || "nouveau",
        statut_paiement: a.statut_paiement    || null,
        mode_paiement:   a.mode_paiement      || null,
        commercial:      a.assistante_nom     || "—",
        created_at:      a.created_at,
      }));
      setApprenants(all);
    } catch(e) { console.error("Erreur chargement apprenants", e); }
    finally { setLoadingApprenants(false); }
  };
  useEffect(() => { if (activeTab === "suivi_apprenants") fetchApprenants(); }, [activeTab]);

  // États pour les onglets Coachs & Apprenants
  const [selectedCoach,     setSelectedCoach]     = useState(null);
  const [coachModalTab,     setCoachModalTab]     = useState("infos");
  const [coachContrats,     setCoachContrats]     = useState([]);
  const [coachContratsLoading, setCoachContratsLoading] = useState(false);
  const [coachGroupes,      setCoachGroupes]      = useState([]);
  const [coachGroupesLoading, setCoachGroupesLoading] = useState(false);
  const [showContratForm,   setShowContratForm]   = useState(false);
  const [contratEditId,     setContratEditId]     = useState(null);
  const [contratSaving,     setContratSaving]     = useState(false);
  const [contratForm,       setContratForm]       = useState({
    apprenant_nom:"", apprenant_prenom:"", apprenant_email:"", apprenant_telephone:"",
    type_contrat:"en_ligne", niveau:"B1", objectif:"", prix_h:"",
    nb_seances_total:"", duree_seance_h:"1.5", date_debut:"", date_fin:"", note:"",
  });
  const [selectedApprenant, setSelectedApprenant] = useState(null);
  const [coachSubTab,       setCoachSubTab]       = useState("liste");
  const [apprenantFiltre,   setApprenantFiltre]   = useState({ type_cours:"Tous", centre:"Tous", statut:"Tous", search:"" });
  const [apprenants,        setApprenants]        = useState([]);
  const [loadingApprenants, setLoadingApprenants] = useState(false);
  const [apprenantPage,     setApprenantPage]     = useState(1);
  const APPRENANTS_PER_PAGE = 20;

  // États Paiements
  const [paiements,        setPaiements]        = useState([]);
  const [loadingPaiements, setLoadingPaiements] = useState(false);
  const [apprenantSubTab,  setApprenantSubTab]  = useState("liste");
  const [paiementPage,     setPaiementPage]     = useState(1);
  const [paiementFiltre,   setPaiementFiltre]   = useState({ statut:"Tous", mode:"Tous", search:"", dateDebut:"", dateFin:"" });
  const [paiementModal,    setPaiementModal]    = useState(null);
  const [caPeriode,        setCaPeriode]        = useState("annee"); // "semaine"|"mois"|"trimestre"|"annee"|"tout"
  const [caAnnee,          setCaAnnee]          = useState(new Date().getFullYear());
  const PAIEMENTS_PER_PAGE = 25;

  const fetchPaiements = async () => {
    setLoadingPaiements(true);
    try {
      const res  = await fetch(`${API_URL}/api/paiements/all`, { headers: authHeaders() });
      const data = await res.json();
      setPaiements(data.paiements || []);
    } catch(e) { console.error("Erreur chargement paiements", e); }
    finally { setLoadingPaiements(false); }
  };
  useEffect(() => { if (activeTab === "paiements") fetchPaiements(); }, [activeTab]);

  // ── Paiements CinetPay (en ligne) ───────────────────────────────────────
  const [paiementsSubTab,       setPaiementsSubTab]       = useState("manuel");
  const [cinetpayPaiements,     setCinetpayPaiements]     = useState([]);
  const [cinetpayLoading,       setCinetpayLoading]       = useState(false);
  const [cinetpaySearch,        setCinetpaySearch]        = useState("");
  const [cinetpayStatutFiltre,  setCinetpayStatutFiltre]  = useState("tous");
  const [cinetpayTraiteeFiltre, setCinetpayTraiteeFiltre] = useState("tous");

  const fetchCinetpayPaiements = async () => {
    setCinetpayLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/cinetpay/admin/all`, { headers: authHeaders() });
      const data = await res.json();
      setCinetpayPaiements(data.paiements || []);
    } catch(e) { console.error("Erreur chargement cinetpay", e); }
    finally { setCinetpayLoading(false); }
  };

  const marquerTraite = async (id, notes) => {
    try {
      await fetch(`${API_URL}/api/cinetpay/admin/${id}/traiter`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ notes_assistante: notes }),
      });
      setCinetpayPaiements(prev => prev.map(p => p.id === id ? { ...p, traitee: true, notes_assistante: notes } : p));
      toast.success("Marqué comme traité ✓");
    } catch { toast.error("Erreur"); }
  };

  useEffect(() => {
    if (activeTab === "paiements" && paiementsSubTab === "cinetpay") fetchCinetpayPaiements();
  }, [activeTab, paiementsSubTab]); // eslint-disable-line

  // ── Audit global ─────────────────────────────────────────────────────────
  const [auditLogs,         setAuditLogs]         = useState([]);
  const [auditStats,        setAuditStats]        = useState(null);
  const [auditLoading,      setAuditLoading]      = useState(false);
  const [auditTotal,        setAuditTotal]        = useState(0);
  const [auditPage,         setAuditPage]         = useState(1);
  const [auditView,         setAuditView]         = useState("logs"); // "logs" | "stats" | "profil" | "centre"
  const [auditSelectedProfile, setAuditSelectedProfile] = useState(null);
  const [auditSelectedCentre, setAuditSelectedCentre]  = useState(null);
  const [auditProfileLogs, setAuditProfileLogs]  = useState([]);
  const [auditCentreLogs,  setAuditCentreLogs]   = useState([]);
  const AUDIT_LIMIT = 50;
  const [auditFilters, setAuditFilters] = useState({
    module: "", action_type: "", statut: "", centre: "", search: "",
    date_debut: "", date_fin: "",
  });

  const fetchAuditLogs = useCallback(async (page = 1, filters = auditFilters) => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: AUDIT_LIMIT,
        ...(filters.module     && { module: filters.module }),
        ...(filters.action_type && { action_type: filters.action_type }),
        ...(filters.statut     && { statut: filters.statut }),
        ...(filters.centre     && { centre: filters.centre }),
        ...(filters.search     && { search: filters.search }),
        ...(filters.date_debut && { date_debut: filters.date_debut }),
        ...(filters.date_fin   && { date_fin: filters.date_fin }),
      });
      const res = await fetch(`${API_URL}/api/audit/logs?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
    } catch { toast.error("Erreur chargement audit"); }
    finally { setAuditLoading(false); }
  }, [auditFilters]); // eslint-disable-line

  const fetchAuditStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/audit/stats`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setAuditStats(await res.json());
    } catch {}
  }, []); // eslint-disable-line

  const fetchAuditByProfile = async (acteur_id) => {
    try {
      const res = await fetch(`${API_URL}/api/audit/by-profile/${acteur_id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setAuditProfileLogs(await res.json());
    } catch { toast.error("Erreur"); }
  };

  const fetchAuditByCentre = async (centre) => {
    try {
      const res = await fetch(`${API_URL}/api/audit/by-centre/${centre}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setAuditCentreLogs(await res.json());
    } catch { toast.error("Erreur"); }
  };

  useEffect(() => {
    if (activeTab === "audit") { fetchAuditLogs(1); fetchAuditStats(); }
  }, [activeTab]); // eslint-disable-line

  // ── Groupes admin ────────────────────────────────────────────────────────
  const [adminGroupes, setAdminGroupes]         = useState([]);
  const [adminGroupesLoading, setAdminGroupesLoading] = useState(false);
  const [adminSelectedGroupe, setAdminSelectedGroupe] = useState(null);
  const [adminGroupeDetail, setAdminGroupeDetail]     = useState({ apprenants:[], fichiers:[] });
  const [adminCoursListe, setAdminCoursListe]   = useState([]);
  const [adminCoursLoading, setAdminCoursLoading] = useState(false);
  const [adminPresences, setAdminPresences]     = useState([]);
  const [adminGroupeSubTab, setAdminGroupeSubTab] = useState("apprenants");
  const [adminCoursFiltreMois, setAdminCoursFiltreMois] = useState(() => new Date().getMonth()+1);
  const [adminCoursAnnee, setAdminCoursAnnee]   = useState(() => new Date().getFullYear());
  const [adminFiltreCoach, setAdminFiltreCoach] = useState("tous");

  // États onglet Cours (sous-onglets Cours privés + Groupes cours)
  const [coursSubTab,           setCoursSubTab]           = useState("groupes");
  const [adminAllContrats,      setAdminAllContrats]      = useState([]);
  const [adminAllContratsLoad,  setAdminAllContratsLoad]  = useState(false);
  const [adminContratFiltre,    setAdminContratFiltre]    = useState({ coach:"tous", statut:"tous", search:"" });
  const [adminContratPage,      setAdminContratPage]      = useState(1);
  const CONTRATS_PER_PAGE = 20;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab !== "cours") return;
    const token = localStorage.getItem("admin_token");
    setAdminGroupesLoading(true);
    fetch(`${API_URL}/api/groupes`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.ok?r.json():{groupes:[]})
      .then(d=>setAdminGroupes(d.groupes||[]))
      .catch(()=>{})
      .finally(()=>setAdminGroupesLoading(false));
  }, [activeTab]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab !== "cours" || coursSubTab !== "cours_prives") return;
    const token = localStorage.getItem("admin_token");
    setAdminAllContratsLoad(true);
    fetch(`${API_URL}/api/contrats-prives`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.ok?r.json():{contrats:[]})
      .then(d=>setAdminAllContrats(d.contrats||[]))
      .catch(()=>{})
      .finally(()=>setAdminAllContratsLoad(false));
  }, [activeTab, coursSubTab]);

  const fetchAdminGroupeDetail = async (groupe) => {
    const token = localStorage.getItem("admin_token");
    setAdminSelectedGroupe(groupe);
    setAdminGroupeSubTab("apprenants");
    setAdminCoursListe([]); setAdminPresences([]);
    try {
      const r = await fetch(`${API_URL}/api/groupes/${groupe.id}`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setAdminGroupeDetail({ apprenants: d.apprenants||[], fichiers: d.fichiers||[] });
    } catch {}
  };

  const fetchAdminCours = async (groupeId, mois, annee) => {
    const token = localStorage.getItem("admin_token");
    setAdminCoursLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/groupes/${groupeId}/cours?mois=${mois}&annee=${annee}`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setAdminCoursListe(d.cours||[]);
    } catch {} finally { setAdminCoursLoading(false); }
  };

  const fetchAdminPresences = async (groupeId) => {
    const token = localStorage.getItem("admin_token");
    try {
      const r = await fetch(`${API_URL}/api/groupes/${groupeId}/presences`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await r.json();
      setAdminPresences(d.presences||[]);
    } catch {}
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!adminSelectedGroupe) return;
    if (adminGroupeSubTab === "cours") fetchAdminCours(adminSelectedGroupe.id, adminCoursFiltreMois, adminCoursAnnee);
    if (adminGroupeSubTab === "presences") fetchAdminPresences(adminSelectedGroupe.id);
  }, [adminGroupeSubTab, adminSelectedGroupe, adminCoursFiltreMois, adminCoursAnnee]);

  // Onglets principaux (élargis)
  const tabs = [
    { key: "overview",      label: "Vue d'ensemble", icon: "🏠" },
    { key: "platform",      label: "Plateforme",     icon: "🏢" },
    { key: "permissions",   label: "Gestion des droits", icon: "🔐", badge: stats.enAttente, danger: stats.enAttente>0 },
    { key: "audit",         label: "Audit global",   icon: "📜", badge: auditStats?.alertes_today||null, danger: (auditStats?.alertes_today||0)>0 },
    { key: "logs",          label: "Logs système",           icon: "📋" },
    { key: "trafic",        label: "Trafic web",             icon: "🌐" },
    { key: "clients",       label: "Clients & Prospects",    icon: "👥" },
    { key: "offres",        label: "Offres & Formations",    icon: "🎓" },
    { key: "ca",            label: "Chiffre d'affaires",     icon: "💰" },
    { key: "paiements",     label: "Paiements",              icon: "💳", badge: cinetpayPaiements.filter(p=>p.statut==="validé"&&!p.traitee).length||null, danger: cinetpayPaiements.filter(p=>p.statut==="validé"&&!p.traitee).length>0 },
    { key: "suivi_apprenants", label: "Apprenants", icon: "🎓", badge: apprenants.length || null },
    { key: "assistantes",   label: "Planning assistantes",   icon: "📅", badge: assistantesAdmin.filter(a=>!a.actif).length||null, danger: assistantesAdmin.filter(a=>!a.actif).length>0 },
    { key: "coachs",        label: "Coachs",                 icon: "👨‍🏫", badge: COACHS_MOCK.length },
    { key: "cours",         label: "Cours",                  icon: "📚" },
    { key: "sondages",      label: "Sondages",               icon: "🎯",  badge: sondagesAll.length },
    { key: "messages",      label: "Messages",               icon: "💬",  badge: msgNonLuTotal||null, danger: msgNonLuTotal>0 },
    { key: "notifications", label: "Notifications",          icon: "🔔" },
  ];

  const permTabs = [
    { key:"vue_ensemble", label:"Vue d'ensemble", icon:"📊" },
    { key:"utilisateurs", label:"Utilisateurs", icon:"👥", badge:users.length },
    { key:"matrice", label:"Matrice des permissions", icon:"🔐" },
    { key:"securite", label:"Sécurité", icon:"🛡️" },
    // { key:"demandes", label:"Demandes d'accès", icon:"📬", badge:stats.enAttente, danger:stats.enAttente>0 },
  ];

  const [platformSubTab, setPlatformSubTab] = useState("partenaires");
  const [catalogueSubTab, setCatalogueSubTab] = useState("centres");
  const CATALOGUE_TABS = [
    { key:"centres",          label:"Nos centres",      icon:"📍" },
    { key:"offres_en_ligne",  label:"Offres En ligne",  icon:"💻" },
    { key:"offres_domicile",  label:"Offres À domicile",icon:"🏠" },
    { key:"certifications",   label:"Certifications",   icon:"🏆" },
    { key:"interpretariat",   label:"Interprétariat",   icon:"🌍" },
    { key:"traduction",       label:"Traduction",        icon:"📄" },
  ];

  // ── Médias pages (offre_media) ──────────────────────────────────
  const OFFRE_MEDIA_TYPES = [
    { key:"en-ligne",  label:"Cours en ligne",    icon:"💻", color:"#1e3a8a" },
    { key:"cabinet",   label:"Cours en cabinet",  icon:"🏫", color:"#0891b2" },
    { key:"domicile",  label:"Cours à domicile",  icon:"🏠", color:"#059669" },
    { key:"toeic",     label:"TOEIC",             icon:"🏆", color:"#7c3aed" },
    { key:"toefl",     label:"TOEFL",             icon:"🎓", color:"#b45309" },
    { key:"ielts",     label:"IELTS",             icon:"🌍", color:"#dc2626" },
  ];
  const OFFRE_MEDIA_BLANK = { type:"video", url:"", titre:"", actif:true };
  const [offreMediaType,       setOffreMediaType]       = useState("toeic");
  const [offreMediaList,       setOffreMediaList]       = useState([]);
  const [offreMediaLoading,    setOffreMediaLoading]    = useState(false);
  const [offreMediaForm,       setOffreMediaForm]       = useState(OFFRE_MEDIA_BLANK);
  const [offreMediaSaving,     setOffreMediaSaving]     = useState(false);
  const [offreMediaUploading,  setOffreMediaUploading]  = useState(false);
  const [offreMediaUploadPct,  setOffreMediaUploadPct]  = useState(0);
  const [offreMediaDragOver,   setOffreMediaDragOver]   = useState(false);
  const offreMediaFileRef = React.useRef(null);
  const platformTabs = [
    { key:"partenaires",   label:"Config. Partenaires", icon:"🤝" },
    { key:"whatsapp",      label:"Contact & WhatsApp",  icon:"📞" },
    { key:"coachs_photos", label:"Équipe Coachs",       icon:"👨‍🏫" },
    { key:"marquee",       label:"Marquee",             icon:"📢" },
    { key:"catalogue",     label:"Offres & Contenus",   icon:"📦" },
    { key:"avis_offres",   label:"Avis offres",         icon:"💬", badge: avisOffres.filter(a=>!a.actif).length||null },
    { key:"boutique",      label:"Boutique",            icon:"🛍️", badge: commandes.filter(c=>c.statut==="en_attente").length||null, danger: commandes.filter(c=>c.statut==="en_attente").length>0 },
    { key:"contenu",       label:"Blog & Témoignages",  icon:"📋", badge: (blogArticles.filter(a=>!a.publie).length + temosPending + blogComments.length)||null, danger: temosPending>0 },
    { key:"faq",           label:"FAQ",                 icon:"❓" },
    { key:"carrousel",     label:"Carrousel & Médias",  icon:"🖼️" },
  ];
  // useEffects dépendant de platformSubTab (déclarés après useState)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "platform" && platformSubTab === "avis_offres") fetchAvisOffres(); }, [activeTab, platformSubTab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === "platform" && platformSubTab === "contenu") {
      fetchBlogArticles(); fetchTemos(); fetchBlogComments();
    }
  }, [activeTab, platformSubTab]); // eslint-disable-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "platform" && platformSubTab === "boutique") { fetchProduits(); fetchCommandes(); } }, [activeTab, platformSubTab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "platform" && platformSubTab === "boutique" && boutiqueSubTab === "commandes") fetchCommandes(); }, [cmdFiltreStatut]);

  // ── Marquee ─────────────────────────────────────────────────────────────
  const [marqueeMessages, setMarqueeMessages] = useState([]);
  const [marqueeLoading,  setMarqueeLoading]  = useState(false);
  const [marqueeForm,     setMarqueeForm]     = useState(null); // null=fermé
  const [marqueeSavingId, setMarqueeSavingId] = useState(null);
  const [marqueePage,     setMarqueePage]     = useState(1);

  // ── FAQ ─────────────────────────────────────────────────────────────────────
  const [faqItems,      setFaqItems]      = useState([]);
  const [faqLoading,    setFaqLoading]    = useState(false);
  const [faqForm,       setFaqForm]       = useState(null);
  const [faqSavingId,   setFaqSavingId]   = useState(null);
  const [faqSearch,     setFaqSearch]     = useState("");
  const [faqCatFilter,  setFaqCatFilter]  = useState("Tous");
  const FAQ_CATEGORIES = ["Cours & formations","Certifications","Tarifs & paiement","Nos centres","Entreprises","Compte & espace personnel","Général"];
  const MARQUEE_PER_PAGE = 5;

  // ── Centres master (source de vérité partagée) ───────────────────────────────
  const CENTRES_MASTER_KEY = "bet_centres_master";
  const CENTRES_BET_COLORS = ["#25d366","#facc15","#0891b2","#a855f7","#f97316","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f59e0b"];
  const DEFAULT_OFFRES = [
    { id:"cours_groupe",  label:"Cours en groupe",          actif:true,  prix:"30 000 F/mois", duration:"Sans engagement", desc:"Sessions hebdomadaires en petits groupes de 4–8 apprenants.", brochure_url:"", brochure_nom:"" },
    { id:"cours_prives",  label:"Cours privés",             actif:true,  prix:"50 000 F/mois", duration:"Sans engagement", desc:"Coaching 1-pour-1 avec un formateur certifié.",               brochure_url:"", brochure_nom:"" },
    { id:"toeic_prep",    label:"Préparation TOEIC",        actif:true,  prix:"45 000 F/mois", duration:"2 mois",          desc:"Programme intensif pour viser 750+ dès le 1er passage.",     brochure_url:"", brochure_nom:"" },
    { id:"ielts_prep",    label:"Préparation IELTS",        actif:false, prix:"45 000 F/mois", duration:"2 mois",          desc:"Entraînement complet aux 4 compétences IELTS.",               brochure_url:"", brochure_nom:"" },
    { id:"toefl_prep",    label:"Préparation TOEFL",        actif:false, prix:"45 000 F/mois", duration:"2 mois",          desc:"Préparation ciblée au TOEFL iBT.",                            brochure_url:"", brochure_nom:"" },
    { id:"enfants",       label:"Cours enfants (6–17 ans)", actif:true,  prix:"20 000 F/mois", duration:"Sans engagement", desc:"Méthodes ludiques adaptées à chaque tranche d'âge.",          brochure_url:"", brochure_nom:"" },
    { id:"entreprise",    label:"Formation entreprises",    actif:true,  prix:"Sur devis",      duration:"Sur mesure",      desc:"Programmes sur-mesure pour vos équipes (min. 5 employés).",   brochure_url:"", brochure_nom:"" },
  ];
  const DEFAULT_CTA = { rdv:{ actif:true, lien:"/contact" }, inscrire:{ actif:true, lien:"/parcours/particulier" }, contact:{ actif:true, lien:"/contact" } };
  const DEFAULT_ADVANTAGES = ["Groupes de 6 personnes maximum","Matériel pédagogique fourni","Certification officielle en fin de stage","Suivi personnalisé par un formateur certifié"];
  const DEFAULT_CABINET = { subtitle:"", hero_image:"", advantages:[...DEFAULT_ADVANTAGES], testimonials:[], faq:[] };
  const CENTRES_MASTER_DEFAULT = [
    { key:"angre",    name:"BET Angré",       ville:"Abidjan",     addr:"Angré 7ème Tranche, Abidjan",    lat:5.3699, lng:-3.9674, color:"#25d366", actif:true, description:"Centre phare d'Abidjan-Cocody, dans un cadre moderne et accessible.",           horaires:"Lun–Ven : 08h–19h | Sam : 09h–17h", telephone:"+225 07 00 000 001", email:"angre@bet-ci.com",    photos:[], brochure_url:"", brochure_nom:"Brochure BET Angré.pdf",       maps_url:"", maps_embed:"", cta:{...DEFAULT_CTA}, offres:[...DEFAULT_OFFRES], assistantes:[{nom:"Assistante 1",phone:"2250700000001",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Angré."},{nom:"Assistante 2",phone:"2250700000011",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Angré."}], ...DEFAULT_CABINET },
    { key:"bouake",   name:"BET Bouaké",      ville:"Bouaké",      addr:"Centre-Ville, Bouaké",            lat:7.6936, lng:-5.0232, color:"#facc15", actif:true, description:"Le seul centre BET hors Abidjan — au cœur de la capitale économique du centre.", horaires:"Lun–Ven : 08h–18h30 | Sam : 09h–15h", telephone:"+225 07 00 000 002", email:"bouake@bet-ci.com",   photos:[], brochure_url:"", brochure_nom:"Brochure BET Bouaké.pdf",      maps_url:"", maps_embed:"", cta:{...DEFAULT_CTA}, offres:[...DEFAULT_OFFRES], assistantes:[{nom:"Assistante 1",phone:"2250700000002",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Bouaké."},{nom:"Assistante 2",phone:"2250700000022",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Bouaké."}], ...DEFAULT_CABINET },
    { key:"plateaux", name:"BET II Plateaux", ville:"Abidjan",     addr:"Riviera II Plateaux, Abidjan",   lat:5.3611, lng:-4.0103, color:"#0891b2", actif:true, description:"Situé au cœur des Deux-Plateaux, quartier résidentiel et d'affaires.",             horaires:"Lun–Ven : 08h–19h | Sam : 09h–17h", telephone:"+225 07 00 000 003", email:"plateaux@bet-ci.com", photos:[], brochure_url:"", brochure_nom:"Brochure BET II Plateaux.pdf", maps_url:"", maps_embed:"", cta:{...DEFAULT_CTA}, offres:[...DEFAULT_OFFRES], assistantes:[{nom:"Assistante 1",phone:"2250700000003",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET II Plateaux."},{nom:"Assistante 2",phone:"2250700000033",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET II Plateaux."}], ...DEFAULT_CABINET },
    { key:"yopougon", name:"BET Yopougon",    ville:"Abidjan",     addr:"Yopougon Sicogi, Abidjan",       lat:5.3264, lng:-4.0709, color:"#a855f7", actif:true, description:"Desservant le plus grand quartier populaire d'Afrique de l'Ouest.",               horaires:"Lun–Ven : 08h–18h30 | Sam : 09h–15h", telephone:"+225 07 00 000 004", email:"yopougon@bet-ci.com", photos:[], brochure_url:"", brochure_nom:"Brochure BET Yopougon.pdf",    maps_url:"", maps_embed:"", cta:{...DEFAULT_CTA}, offres:[...DEFAULT_OFFRES], assistantes:[{nom:"Assistante 1",phone:"2250700000004",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Yopougon."},{nom:"Assistante 2",phone:"2250700000044",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Yopougon."}], ...DEFAULT_CABINET },
    { key:"koumassi", name:"BET Koumassi",    ville:"Abidjan",     addr:"Koumassi Remblai, Abidjan",      lat:5.3001, lng:-3.9500, color:"#f97316", actif:true, description:"Centre stratégique desservant les communes du sud d'Abidjan.",                    horaires:"Lun–Ven : 08h–18h30 | Sam : 09h–15h", telephone:"+225 07 00 000 005", email:"koumassi@bet-ci.com", photos:[], brochure_url:"", brochure_nom:"Brochure BET Koumassi.pdf",   maps_url:"", maps_embed:"", cta:{...DEFAULT_CTA}, offres:[...DEFAULT_OFFRES], assistantes:[{nom:"Assistante 1",phone:"2250700000005",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Koumassi."},{nom:"Assistante 2",phone:"2250700000055",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Koumassi."}], ...DEFAULT_CABINET },
    { key:"abatta",   name:"BET Abatta",      ville:"Grand-Bassam",addr:"Abatta, Grand-Bassam",            lat:5.2667, lng:-3.8333, color:"#ef4444", actif:true, description:"Centre BET desservant la zone côtière Grand-Bassam / Assinie.",                   horaires:"Lun–Ven : 08h–18h | Sam : 09h–14h",   telephone:"+225 07 00 000 006", email:"abatta@bet-ci.com",   photos:[], brochure_url:"", brochure_nom:"Brochure BET Abatta.pdf",     maps_url:"", maps_embed:"", cta:{...DEFAULT_CTA}, offres:[...DEFAULT_OFFRES], assistantes:[{nom:"Assistante 1",phone:"2250700000006",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Abatta."},{nom:"Assistante 2",phone:"2250700000066",message:"Bonjour, je souhaite avoir des informations sur les cours d'anglais chez BET Abatta."}], ...DEFAULT_CABINET },
  ];

  const readCentresMaster = () => {
    try {
      const s = localStorage.getItem(CENTRES_MASTER_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        return CENTRES_MASTER_DEFAULT.map(def => {
          const saved = parsed.find(c => c.key === def.key);
          return saved ? { ...def, ...saved, offres: saved.offres || def.offres, assistantes: saved.assistantes || def.assistantes, advantages: saved.advantages || def.advantages, testimonials: saved.testimonials || def.testimonials, faq: saved.faq || def.faq } : def;
        }).concat(parsed.filter(c => !CENTRES_MASTER_DEFAULT.find(d => d.key === c.key)));
      }
      return CENTRES_MASTER_DEFAULT;
    } catch { return CENTRES_MASTER_DEFAULT; }
  };

  const saveCentresMaster = async (data) => {
    // 1. localStorage local (même onglet)
    localStorage.setItem(CENTRES_MASTER_KEY, JSON.stringify(data));
    const waCompat = data.filter(c => c.actif !== false).map(c => ({ key:c.key, name:c.name.replace("BET ",""), color:c.color, commerciaux:[], assistantes:c.assistantes||[] }));
    localStorage.setItem("bet_centers_config", JSON.stringify(waCompat));
    window.dispatchEvent(new StorageEvent("storage", { key: CENTRES_MASTER_KEY, newValue: JSON.stringify(data) }));
    window.dispatchEvent(new StorageEvent("storage", { key: "bet_centers_config", newValue: JSON.stringify(waCompat) }));

    // 2. Supabase (source de vérité partagée — accessible par le Frontend)
    try {
      await supabase.from("plateforme_config").upsert(
        { key: "centres_master", valeur: data, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
      await supabase.from("plateforme_config").upsert(
        { key: "centres_wa", valeur: waCompat, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    } catch (e) { console.error("Supabase sync centres:", e); }
  };

  const [centresMaster,      setCentresMaster]      = useState(readCentresMaster);
  useEffect(() => {
    supabase.from("plateforme_config").select("valeur").eq("key","centres_master").maybeSingle()
      .then(({ data, error }) => {
        if (!error && Array.isArray(data?.valeur) && data.valeur.length) {
          localStorage.setItem(CENTRES_MASTER_KEY, JSON.stringify(data.valeur));
          setCentresMaster(data.valeur);
        }
      });
  }, []); // eslint-disable-line
  const [centreEditKey,       setCentreEditKey]       = useState(null);
  const [centreEditData,      setCentreEditData]      = useState(null);
  const [centresSaving,       setCentresSaving]       = useState(false);
  const [newPhotoUrl,         setNewPhotoUrl]         = useState("");
  // ── Offres En ligne & À domicile ────────────────────────────────────────────
  const DEFAULT_OFFRES_EN_LIGNE = [
    { id:"el_groupe", label:"Coaching de groupe",     prix:"25 000 F/mois", duration:"Sans engagement", desc:"Sessions Zoom hebdomadaires, groupes de 5 apprenants max.",             actif:true,  icon:"👥" },
    { id:"el_prive",  label:"Coaching privé",          prix:"45 000 F/mois", duration:"Sans engagement", desc:"Suivi individuel en visio avec un formateur certifié.",                actif:true,  icon:"👤" },
    { id:"el_toeic",  label:"Prépa TOEIC en ligne",    prix:"40 000 F/mois", duration:"2 mois",          desc:"Programme intensif pour viser 750+ dès le 1er passage.",              actif:false, icon:"🎯" },
    { id:"el_enfant", label:"Cours enfants en ligne",   prix:"20 000 F/mois", duration:"Sans engagement", desc:"Méthodes ludiques adaptées à chaque tranche d'âge (6–17 ans).",      actif:false, icon:"🎓" },
  ];
  const DEFAULT_OFFRES_DOMICILE = [
    { id:"dom_prive",  label:"Cours privé à domicile",  prix:"Sur devis", duration:"Sur mesure", desc:"Un coach certifié se déplace chez vous. Tarif selon zone géographique.", actif:true,  icon:"🏠" },
    { id:"dom_enfant", label:"Cours enfant à domicile",  prix:"Sur devis", duration:"Sur mesure", desc:"Coach spécialisé jeunesse, programme adapté à l'âge de l'enfant.",       actif:true,  icon:"👧" },
    { id:"dom_groupe", label:"Groupe chez vous",          prix:"Sur devis", duration:"Sur mesure", desc:"Organisez un groupe chez vous — tarif partagé entre participants.",        actif:false, icon:"👥" },
  ];
  const DEFAULT_CERTIF_CONFIG = {
    toeic: {
      name:"TOEIC", fullName:"Test of English for International Communication",
      tagline:"La certification anglais n°1 en entreprise — reconnue par 14 000 employeurs",
      heroImage:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80",
      level:"B1 → C1", duration:"6 semaines", price:"390 000 FCFA", oldPrice:"500 000 FCFA", discount:"22%",
      rating:4.9, ratingCount:1248, students:5200,
      description:"Le TOEIC est la référence mondiale pour évaluer vos compétences en anglais professionnel. Un score TOEIC reconnu ouvre les portes des entreprises internationales.",
      whatYouLearn:["Maîtriser le Listening (200 points)","Stratégies Reading avancées","Vocabulaire professionnel ciblé","15 tests blancs corrigés","Techniques anti-stress d'examen","Score garanti 700+"],
      examStructure:[
        {section:"Listening",duration:"45 min",questions:"100 questions",desc:"Photographies, questions/réponses, courtes conversations, discours"},
        {section:"Reading",duration:"75 min",questions:"100 questions",desc:"Phrases incomplètes, textes à compléter, lecture de passages"},
      ],
      preparationProgram:{weeks:6,hoursPerWeek:8,sessions:48,details:"6 semaines intensives. 2 sessions de 4h par semaine. Accès illimité aux ressources + 15 tests blancs + coaching individuel."},
      benefits:["Reconnu par 14 000 entreprises dans le monde","Améliore votre CV immédiatement","Exigé pour de nombreux postes internationaux","Valable 2 ans — renouvelable","Score précis de 10 à 990"],
      includes:[{icon:"🎥",label:"48 sessions de cours"},{icon:"📝",label:"15 tests blancs complets"},{icon:"📄",label:"Guide de stratégies PDF"},{icon:"📱",label:"Application mobile"},{icon:"∞",label:"Accès illimité à vie"},{icon:"🏆",label:"Certificat BET + TOEIC officiel"},{icon:"👤",label:"Coach personnel dédié"}],
      whyChoose:"BET est centre officiel ETS pour le TOEIC en Côte d'Ivoire. Nos apprenants obtiennent en moyenne 780 points dès leur premier passage. Taux de réussite au score cible : 96%.",
      faq:[
        {q:"Quelle est la durée de validité du TOEIC ?",a:"Le TOEIC est valable 2 ans à partir de la date de l'examen."},
        {q:"Quel score pour être compétitif ?",a:"Un score de 785+ est considéré professionnel. Pour le management international, 900+ est recommandé."},
        {q:"L'examen se passe-t-il chez BET ?",a:"Oui, BET est centre officiel ETS. L'examen a lieu dans nos locaux dans des conditions officielles."},
      ],
    },
    ielts: {
      name:"IELTS", fullName:"International English Language Testing System",
      tagline:"La certification anglais pour étudier et migrer dans les pays anglophones",
      heroImage:"https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80",
      level:"B1 → C2", duration:"6 à 10 semaines", price:"210 000 FCFA", oldPrice:"", discount:"",
      rating:4.8, ratingCount:856, students:3400,
      description:"L'IELTS est le test d'anglais le plus populaire pour étudier, travailler ou migrer dans les pays anglophones (Royaume-Uni, Australie, Canada).",
      whatYouLearn:["Maîtriser les 4 compétences","Techniques de Reading académique","Speaking avec locuteurs natifs","Writing Task 1 & 2","Listening strategies","Band 7+ garanti"],
      examStructure:[
        {section:"Listening",duration:"30 min",questions:"40 questions",desc:"Enregistrements variés — conversations et monologues"},
        {section:"Reading",duration:"60 min",questions:"40 questions",desc:"3 passages longs — 500 à 900 mots chacun"},
        {section:"Writing",duration:"60 min",questions:"2 tâches",desc:"Task 1 (rapport/lettre) + Task 2 (essai argumentatif)"},
        {section:"Speaking",duration:"11–14 min",questions:"3 parties",desc:"Interview individuelle, long turn, discussion thématique"},
      ],
      preparationProgram:{weeks:8,hoursPerWeek:9,sessions:36,details:"8 semaines de préparation complète avec simulations d'examen et corrections détaillées."},
      benefits:["Reconnu par plus de 10 000 organisations dans le monde","Idéal pour l'immigration au Canada, Australie, NZ","Deux versions : Academic et General Training","Évaluation de l'anglais réel (accents variés)"],
      includes:[{icon:"🎥",label:"36 sessions de cours"},{icon:"📝",label:"8 simulations complètes"},{icon:"👤",label:"Coach personnel"},{icon:"📄",label:"Fiches de stratégies"},{icon:"🏆",label:"Certificat BET + IELTS officiel"}],
      whyChoose:"Nous proposons une préparation IELTS avec des examinateurs certifiés. Bénéficiez de 8 simulations complètes et d'un plan de progression personnalisé. Taux de réussite : 94%.",
      faq:[
        {q:"IELTS Academic vs General Training ?",a:"Academic pour les études universitaires. General Training pour l'immigration et la formation professionnelle."},
        {q:"Combien de fois puis-je passer l'IELTS ?",a:"Autant de fois que nécessaire, sans délai minimum entre les passages."},
      ],
    },
    toefl: {
      name:"TOEFL", fullName:"Test of English as a Foreign Language",
      tagline:"La certification académique pour intégrer les meilleures universités du monde",
      heroImage:"https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
      level:"B2 → C2", duration:"8 semaines", price:"220 000 FCFA", oldPrice:"", discount:"",
      rating:4.7, ratingCount:632, students:2100,
      description:"Le TOEFL est le test d'anglais académique le plus reconnu pour entrer dans les universités américaines, canadiennes et européennes.",
      whatYouLearn:["Reading académique avancé","Listening académique","Speaking structuré","Writing intégré","Gestion du temps en examen","Score 100+ iBT garanti"],
      examStructure:[
        {section:"Reading",duration:"54–72 min",questions:"30–40 questions",desc:"3–4 passages académiques de 700 mots chacun"},
        {section:"Listening",duration:"41–57 min",questions:"28–39 questions",desc:"Conférences et conversations académiques enregistrées"},
        {section:"Speaking",duration:"17 min",questions:"4 tâches",desc:"Integrated et Independent speaking tasks chronométrés"},
        {section:"Writing",duration:"50 min",questions:"2 tâches",desc:"Integrated writing + Independent essay argumentatif"},
      ],
      preparationProgram:{weeks:8,hoursPerWeek:10,sessions:40,details:"8 semaines intensives avec accès à une plateforme exclusive (+500 exercices), corrigés types et sessions de speaking en petit groupe avec des natifs."},
      benefits:["Admission dans plus de 11 000 universités dans le monde","Test complet évaluant les 4 compétences","Reconnu par les gouvernements pour l'immigration","Valable 2 ans"],
      includes:[{icon:"🎥",label:"40 sessions de cours"},{icon:"📝",label:"6 tests blancs complets"},{icon:"💻",label:"Accès plateforme exclusive"},{icon:"🗣️",label:"Sessions speaking natifs"},{icon:"🏆",label:"Certificat BET + TOEFL officiel"}],
      whyChoose:"Notre préparation TOEFL vous offre un accès à une plateforme exclusive avec +500 exercices, des corrigés types, et des sessions de speaking en petit groupe avec des natifs.",
      faq:[
        {q:"TOEFL iBT vs TOEFL Essentials ?",a:"Le TOEFL iBT est la version standard pour les universités. TOEFL Essentials est plus court et flexible."},
        {q:"Quel score pour les top universités ?",a:"100+ iBT pour la plupart des grandes universités. Certaines (Harvard, MIT) demandent 110+."},
      ],
    },
  };
  const readOffresEnLigne  = () => { try { const s=localStorage.getItem("bet_offres_en_ligne");  return s ? JSON.parse(s) : DEFAULT_OFFRES_EN_LIGNE;  } catch { return DEFAULT_OFFRES_EN_LIGNE;  } };
  const readOffresDomicile = () => { try { const s=localStorage.getItem("bet_offres_domicile"); return s ? JSON.parse(s) : DEFAULT_OFFRES_DOMICILE; } catch { return DEFAULT_OFFRES_DOMICILE; } };
  const saveOffresEnLigne  = async (data) => {
    localStorage.setItem("bet_offres_en_ligne", JSON.stringify(data));
    window.dispatchEvent(new StorageEvent("storage", { key:"bet_offres_en_ligne", newValue:JSON.stringify(data) }));
    try { await supabase.from("plateforme_config").upsert({ key:"offres_en_ligne", valeur:data, updated_at:new Date().toISOString() }, { onConflict:"key" }); } catch(e) { console.error("Supabase offres_en_ligne:", e); }
  };
  const saveOffresDomicile = async (data) => {
    localStorage.setItem("bet_offres_domicile", JSON.stringify(data));
    window.dispatchEvent(new StorageEvent("storage", { key:"bet_offres_domicile", newValue:JSON.stringify(data) }));
    try { await supabase.from("plateforme_config").upsert({ key:"offres_domicile", valeur:data, updated_at:new Date().toISOString() }, { onConflict:"key" }); } catch(e) { console.error("Supabase offres_domicile:", e); }
  };
  const [offresEnLigne,  setOffresEnLigne]  = useState(readOffresEnLigne);
  const [offresDomicile, setOffresDomicile] = useState(readOffresDomicile);
  useEffect(() => {
    supabase.from("plateforme_config").select("valeur").eq("key","offres_en_ligne").maybeSingle()
      .then(({ data, error }) => {
        if (!error && Array.isArray(data?.valeur) && data.valeur.length) {
          localStorage.setItem("bet_offres_en_ligne", JSON.stringify(data.valeur));
          setOffresEnLigne(data.valeur);
        }
      });
    supabase.from("plateforme_config").select("valeur").eq("key","offres_domicile").maybeSingle()
      .then(({ data, error }) => {
        if (!error && Array.isArray(data?.valeur) && data.valeur.length) {
          localStorage.setItem("bet_offres_domicile", JSON.stringify(data.valeur));
          setOffresDomicile(data.valeur);
        }
      });
  }, []); // eslint-disable-line
  const [offreEditModal, setOffreEditModal] = useState(null); // { mode:"en_ligne"|"domicile", idx, data }

  const DEFAULT_SERVICE_INTERP = {
    description: "Services d'interprétation professionnelle assurés par des interprètes certifiés pour vos événements, conférences et réunions d'affaires.",
    tagline: "Conférences · Réunions · Événements",
    details: [
      { icon:"🎤", label:"Types", val:"Simultané · Consécutif · Liaison" },
      { icon:"🌐", label:"Langues", val:"Anglais · Français · et autres" },
      { icon:"📍", label:"Déplacement", val:"Abidjan & déplacements sur demande" },
      { icon:"📅", label:"Disponibilité", val:"7j/7 · Sur réservation" },
      { icon:"📜", label:"Certification", val:"Interprètes certifiés AIIC" },
      { icon:"⚡", label:"Délai", val:"Devis sous 24h" },
    ],
    plans: [
      { nom:"Demi-journée", prix:"Sur devis", detail:"Jusqu'à 4h · 1 interprète" },
      { nom:"Journée",      prix:"Sur devis", detail:"Journée complète · 1-2 interprètes", popular:true },
      { nom:"Événement",    prix:"Sur devis", detail:"Multi-jours · Équipe dédiée" },
    ],
  };
  const DEFAULT_SERVICE_TRAD = {
    description: "Service de traduction professionnelle de documents juridiques, commerciaux et techniques. Traductions certifiées disponibles pour vos démarches officielles.",
    tagline: "Documents · Contrats · Certifiée",
    details: [
      { icon:"📋", label:"Documents", val:"Contrats · Actes · Brochures · Sites web" },
      { icon:"🌐", label:"Langues", val:"Anglais ↔ Français (+ autres sur demande)" },
      { icon:"📜", label:"Certifiée", val:"Traductions certifiées disponibles" },
      { icon:"⚡", label:"Délais", val:"Express 24h · Standard 3-5 jours" },
      { icon:"🔒", label:"Confidentialité", val:"NDA disponible sur demande" },
      { icon:"💬", label:"Révisions", val:"1 révision gratuite incluse" },
    ],
    plans: [
      { nom:"Standard",  prix:"Sur devis", detail:"3-5 jours ouvrés · Tarif /mot" },
      { nom:"Express",   prix:"Sur devis", detail:"24-48h · Majoration urgence", popular:true },
      { nom:"Certifiée", prix:"Sur devis", detail:"Avec cachet officiel · Légalisation" },
    ],
  };
  const readServiceInterp = () => { try { const s=localStorage.getItem("bet_service_interpretariat"); return s ? JSON.parse(s) : DEFAULT_SERVICE_INTERP; } catch { return DEFAULT_SERVICE_INTERP; } };
  const readServiceTrad   = () => { try { const s=localStorage.getItem("bet_service_traduction");    return s ? JSON.parse(s) : DEFAULT_SERVICE_TRAD;  } catch { return DEFAULT_SERVICE_TRAD;  } };
  const saveServiceInterp = async (data) => {
    localStorage.setItem("bet_service_interpretariat", JSON.stringify(data));
    window.dispatchEvent(new StorageEvent("storage", { key:"bet_service_interpretariat", newValue:JSON.stringify(data) }));
    try { await supabase.from("plateforme_config").upsert({ key:"service_interpretariat", valeur:data, updated_at:new Date().toISOString() }, { onConflict:"key" }); } catch(e) { console.error("Supabase service_interpretariat:", e); }
  };
  const saveServiceTrad = async (data) => {
    localStorage.setItem("bet_service_traduction", JSON.stringify(data));
    window.dispatchEvent(new StorageEvent("storage", { key:"bet_service_traduction", newValue:JSON.stringify(data) }));
    try { await supabase.from("plateforme_config").upsert({ key:"service_traduction", valeur:data, updated_at:new Date().toISOString() }, { onConflict:"key" }); } catch(e) { console.error("Supabase service_traduction:", e); }
  };
  const [serviceInterp, setServiceInterp] = useState(readServiceInterp);
  const [serviceTrad,   setServiceTrad]   = useState(readServiceTrad);
  useEffect(() => {
    supabase.from("plateforme_config").select("valeur").eq("key","service_interpretariat").maybeSingle()
      .then(({ data, error }) => { if (!error && data?.valeur) { localStorage.setItem("bet_service_interpretariat", JSON.stringify(data.valeur)); setServiceInterp(data.valeur); } });
    supabase.from("plateforme_config").select("valeur").eq("key","service_traduction").maybeSingle()
      .then(({ data, error }) => { if (!error && data?.valeur) { localStorage.setItem("bet_service_traduction", JSON.stringify(data.valeur)); setServiceTrad(data.valeur); } });
  }, []); // eslint-disable-line
  const [serviceEditModal, setServiceEditModal] = useState(null);

  // ── Config page Aperçu (CourseDetail) ────────────────────────────────────
  const DEFAULT_COURSE_APERCU = {
    en_ligne: {
      description:"Nos cours en ligne vous offrent une flexibilité totale. Suivez vos leçons en direct ou en replay, accédez à une plateforme interactive et progressez avec un suivi personnalisé.",
      advantages:["Accès 24/7 à la plateforme e-learning","Classes en visio avec des professeurs natifs","Exercices interactifs et corrections automatiques","Certification de fin de formation incluse"],
      whatYouLearn:["Maîtriser la communication professionnelle en anglais","Préparer et réussir TOEIC, TOEFL ou IELTS","Rédiger des emails, rapports et présentations en anglais","Conduire des réunions et négociations internationales"],
      includes:[{icon:"🎥",label:"Sessions vidéo en direct"},{icon:"📱",label:"Accès mobile & tablette"},{icon:"∞",label:"Accès illimité à vie"},{icon:"🏆",label:"Certificat de fin de formation"}],
      requirements:["Niveau A2 minimum en anglais","Un ordinateur avec webcam et connexion internet stable","30 minutes par jour de disponibilité"],
      targetAudience:["Professionnels souhaitant évoluer dans un contexte international","Étudiants visant une certification TOEIC, TOEFL ou IELTS","Toute personne souhaitant apprendre à son rythme"],
      faq:[{q:"Quel matériel est nécessaire ?",a:"Un ordinateur avec webcam et une connexion internet stable."},{q:"Peut-on annuler un cours ?",a:"Oui, jusqu'à 24h à l'avance sans frais."}],
    },
    domicile: {
      description:"Nos cours à domicile sont conçus pour s'adapter parfaitement à votre vie. Un enseignant se déplace chez vous aux horaires que vous choisissez.",
      advantages:["Horaires 100% flexibles","Programme personnalisé selon vos objectifs","Suivi hebdomadaire des progrès","Tarifs dégressifs selon la formule choisie"],
      whatYouLearn:["Anglais adapté à vos objectifs personnels","Communication orale et écrite","Préparation aux certifications si souhaité","Grammaire et vocabulaire ciblés"],
      includes:[{icon:"🏠",label:"Cours à votre domicile"},{icon:"👤",label:"Coach personnel dédié"},{icon:"📋",label:"Programme personnalisé"},{icon:"🏆",label:"Certification BET incluse"}],
      requirements:["Espace disponible pour les cours","Engagement minimum de 4 semaines"],
      targetAudience:["Personnes avec un emploi du temps chargé","Parents souhaitant des cours pour leurs enfants","Professionnels en reconversion"],
      faq:[{q:"Dans quelles zones intervenez-vous ?",a:"Nous couvrons tout le grand Abidjan et plusieurs villes de l'intérieur."},{q:"Peut-on changer de professeur ?",a:"Oui, sans frais si vous n'êtes pas satisfait."}],
    },
  };
  const readCourseApercu  = () => { try { const s=localStorage.getItem("bet_course_apercu_config"); return s ? JSON.parse(s) : DEFAULT_COURSE_APERCU; } catch { return DEFAULT_COURSE_APERCU; } };
  const saveCourseApercu  = async (data) => {
    localStorage.setItem("bet_course_apercu_config", JSON.stringify(data));
    window.dispatchEvent(new StorageEvent("storage", { key:"bet_course_apercu_config", newValue:JSON.stringify(data) }));
    try { await supabase.from("plateforme_config").upsert({ key:"course_apercu_config", valeur:data, updated_at:new Date().toISOString() }, { onConflict:"key" }); } catch(e) { console.error("Supabase course apercu:", e); }
  };
  const [courseApercu,          setCourseApercu]          = useState(readCourseApercu);
  useEffect(() => {
    supabase.from("plateforme_config").select("valeur").eq("key","course_apercu_config").maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.valeur && typeof data.valeur === "object") {
          localStorage.setItem("bet_course_apercu_config", JSON.stringify(data.valeur));
          setCourseApercu(data.valeur);
        }
      });
  }, []); // eslint-disable-line
  const [courseApercuEditModal, setCourseApercuEditModal] = useState(null); // { type:"en_ligne"|"domicile", data:{} }
  const [courseApercuSection,   setCourseApercuSection]   = useState("general");
  const readCertifConfig = () => { try { const s=localStorage.getItem("bet_certifications_config"); return s ? JSON.parse(s) : DEFAULT_CERTIF_CONFIG; } catch { return DEFAULT_CERTIF_CONFIG; } };
  const saveCertifConfig = async (data) => {
    localStorage.setItem("bet_certifications_config", JSON.stringify(data));
    window.dispatchEvent(new StorageEvent("storage", { key:"bet_certifications_config", newValue:JSON.stringify(data) }));
    try { await supabase.from("plateforme_config").upsert({ key:"certifications_config", valeur:data, updated_at:new Date().toISOString() }, { onConflict:"key" }); } catch(e) { console.error("Supabase certif:", e); }
  };
  const [certifConfig,      setCertifConfig]      = useState(readCertifConfig);
  useEffect(() => {
    supabase.from("plateforme_config").select("valeur").eq("key","certifications_config").maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.valeur && typeof data.valeur === "object") {
          localStorage.setItem("bet_certifications_config", JSON.stringify(data.valeur));
          setCertifConfig(data.valeur);
        }
      });
  }, []); // eslint-disable-line
  const [certifEditModal,   setCertifEditModal]   = useState(null);
  const [certifEditSection, setCertifEditSection] = useState("general");

  const [showAddCentre,       setShowAddCentre]       = useState(false);
  const [newCentreForm,       setNewCentreForm]       = useState({ name:"", ville:"", addr:"", telephone:"", email:"", color:"#0891b2", lat:"", lng:"" });

  const fetchMarquee = async () => {
    setMarqueeLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const r = await fetch(`${API_URL}/api/marquee`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setMarqueeMessages(d.messages || []);
      setMarqueePage(1);
    } catch { toast.error("Erreur chargement marquee"); }
    finally { setMarqueeLoading(false); }
  };

  const saveMarquee = async (form) => {
    setMarqueeSavingId(form.id || "__new");
    try {
      const token = localStorage.getItem("admin_token");
      const isEdit = !!form.id;
      const url  = isEdit ? `${API_URL}/api/marquee/${form.id}` : `${API_URL}/api/marquee`;
      const method = isEdit ? "PATCH" : "POST";
      const body = {
        texte: form.texte, code_promo: form.code_promo || null,
        lien_url: form.lien_url || null, lien_label: form.lien_label || null,
        date_expiration: form.date_expiration || null,
        actif: form.actif !== false,
        ordre: form.ordre != null ? Number(form.ordre) : undefined,
      };
      const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error((await r.json()).error || "Erreur");
      toast.success(isEdit ? "Message mis à jour" : "Message créé");
      setMarqueeForm(null);
      fetchMarquee();
    } catch (e) { toast.error(e.message); }
    finally { setMarqueeSavingId(null); }
  };

  const deleteMarquee = async (id) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      await fetch(`${API_URL}/api/marquee/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      toast.success("Message supprimé");
      fetchMarquee();
    } catch { toast.error("Erreur suppression"); }
  };

  const toggleMarqueeActif = async (msg) => {
    try {
      const token = localStorage.getItem("admin_token");
      await fetch(`${API_URL}/api/marquee/${msg.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !msg.actif }),
      });
      setMarqueeMessages(prev => prev.map(m => m.id === msg.id ? { ...m, actif: !m.actif } : m));
    } catch { toast.error("Erreur"); }
  };
  const fetchFaq = async () => {
    setFaqLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/faq`, { headers: authHeaders() });
      const d = await r.json();
      setFaqItems(d.items || []);
    } catch { toast.error("Erreur chargement FAQ"); }
    finally { setFaqLoading(false); }
  };

  const saveFaq = async (form) => {
    setFaqSavingId(form.id || "__new");
    try {
      const isEdit = !!form.id;
      const url    = isEdit ? `${API_URL}/api/faq/${form.id}` : `${API_URL}/api/faq`;
      const method = isEdit ? "PATCH" : "POST";
      const r = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          question:  form.question,
          reponse:   form.reponse,
          categorie: form.categorie || "Général",
          ordre:     form.ordre != null ? Number(form.ordre) : undefined,
          actif:     form.actif !== false,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Erreur");
      toast.success(isEdit ? "FAQ mise à jour" : "FAQ créée");
      setFaqForm(null);
      fetchFaq();
    } catch (e) { toast.error(e.message); }
    finally { setFaqSavingId(null); }
  };

  const deleteFaq = async (id) => {
    if (!window.confirm("Supprimer cette FAQ ?")) return;
    try {
      await fetch(`${API_URL}/api/faq/${id}`, { method: "DELETE", headers: authHeaders() });
      toast.success("FAQ supprimée");
      fetchFaq();
    } catch { toast.error("Erreur suppression"); }
  };

  const toggleFaqActif = async (item) => {
    try {
      await fetch(`${API_URL}/api/faq/${item.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ actif: !item.actif }),
      });
      setFaqItems(prev => prev.map(f => f.id === item.id ? { ...f, actif: !f.actif } : f));
    } catch { toast.error("Erreur"); }
  };

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
  useEffect(() => { if (platformSubTab === "marquee") fetchMarquee(); }, [platformSubTab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "platform" && platformSubTab === "faq") fetchFaq(); }, [activeTab, platformSubTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Carrousel ──────────────────────────────────────────────────────────────
  const CAROUSEL_BLANK = { type:"image", url:"", titre:"", description:"", link_url:"", link_label:"", ordre:0, actif:true };
  const [carouselSlides,     setCarouselSlides]     = useState([]);
  const [carouselLoading,    setCarouselLoading]    = useState(false);
  const [carouselForm,       setCarouselForm]       = useState(null);
  const [carouselSaving,     setCarouselSaving]     = useState(false);
  const [carouselUploading,  setCarouselUploading]  = useState(false);
  const [carouselUploadPct,  setCarouselUploadPct]  = useState(0);
  const [carouselDragOver,   setCarouselDragOver]   = useState(false);
  const carouselFileRef = React.useRef(null);

  const fetchCarousel = async () => {
    setCarouselLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/carousel`, { headers: authHeaders() });
      const d = await r.json();
      setCarouselSlides(d.slides || []);
    } catch { toast.error("Erreur chargement carrousel"); }
    finally { setCarouselLoading(false); }
  };

  const saveCarousel = async () => {
    if (!carouselForm?.url?.trim()) return toast.error("L'URL est requise");
    setCarouselSaving(true);
    try {
      const isEdit = !!carouselForm.id;
      const url    = isEdit ? `${API_URL}/api/carousel/${carouselForm.id}` : `${API_URL}/api/carousel`;
      const method = isEdit ? "PATCH" : "POST";
      const r = await fetch(url, {
        method,
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(carouselForm),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Erreur"); }
      toast.success(isEdit ? "Slide mise à jour" : "Slide ajoutée");
      setCarouselForm(null);
      fetchCarousel();
    } catch (e) { toast.error(e.message); }
    finally { setCarouselSaving(false); }
  };

  const deleteCarousel = async (id) => {
    if (!window.confirm("Supprimer cette slide ?")) return;
    try {
      await fetch(`${API_URL}/api/carousel/${id}`, { method: "DELETE", headers: authHeaders() });
      toast.success("Slide supprimée");
      fetchCarousel();
    } catch { toast.error("Erreur suppression"); }
  };

  const toggleCarouselActif = async (item) => {
    try {
      await fetch(`${API_URL}/api/carousel/${item.id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !item.actif }),
      });
      fetchCarousel();
    } catch { toast.error("Erreur"); }
  };

  const moveCarouselSlide = async (slideId, direction) => {
    const idx = carouselSlides.findIndex(s => s.id === slideId);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= carouselSlides.length) return;
    // Réordonner localement puis normaliser les valeurs d'ordre (0,1,2,...)
    const reordered = [...carouselSlides];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    try {
      await Promise.all(reordered.map((s, i) =>
        fetch(`${API_URL}/api/carousel/${s.id}`, {
          method: "PATCH",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ ordre: i }),
        })
      ));
      fetchCarousel();
    } catch { toast.error("Erreur réorganisation"); }
  };

  const uploadCarouselFile = async (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) return toast.error("Fichier non supporté (image ou vidéo uniquement)");
    const maxMb = isVideo ? 200 : 10;
    if (file.size > maxMb * 1024 * 1024) return toast.error(`Fichier trop lourd (max ${maxMb} Mo)`);

    setCarouselUploading(true);
    setCarouselUploadPct(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}/api/upload/${isVideo ? "video" : "image"}`);
        const tok = localStorage.getItem("admin_token");
        if (tok) xhr.setRequestHeader("Authorization", `Bearer ${tok}`);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setCarouselUploadPct(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            const url  = data.file?.url || data.url || "";
            setCarouselForm(p => ({ ...p, url, type: isVideo ? "video" : "image" }));
            toast.success(isVideo ? "Vidéo uploadée ✓" : "Image uploadée ✓");
            resolve();
          } else {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || "Erreur upload"));
          }
        };
        xhr.onerror = () => reject(new Error("Erreur réseau"));
        xhr.send(formData);
      });
    } catch (e) { toast.error(e.message); }
    finally { setCarouselUploading(false); setCarouselUploadPct(0); }
  };

  useEffect(() => { if (activeTab === "platform" && platformSubTab === "carrousel") fetchCarousel(); }, [activeTab, platformSubTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Offre Média ────────────────────────────────────────────────────────────
  const fetchOffreMedia = useCallback(async (offreType) => {
    setOffreMediaLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/offre-media/${offreType}`, { headers: authHeaders() });
      const d = await r.json();
      setOffreMediaList(d.media || []);
    } catch { toast.error("Erreur chargement médias"); }
    finally { setOffreMediaLoading(false); }
  }, []);

  const getActiveOffreMediaType = () => {
    const typeMap = { offres_en_ligne:"en-ligne", offres_domicile:"domicile", centres:"cabinet" };
    return typeMap[catalogueSubTab] || offreMediaType;
  };

  const saveOffreMedia = async () => {
    if (!offreMediaForm.url.trim()) return toast.error("URL requise");
    const activeType = getActiveOffreMediaType();
    setOffreMediaSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/offre-media`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...offreMediaForm, offre_type: activeType }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast.success("Média ajouté");
      setOffreMediaForm(OFFRE_MEDIA_BLANK);
      fetchOffreMedia(activeType);
    } catch (e) { toast.error(e.message); }
    finally { setOffreMediaSaving(false); }
  };

  const deleteOffreMedia = async (id) => {
    if (!window.confirm("Supprimer ce média ?")) return;
    const activeType = getActiveOffreMediaType();
    try {
      await fetch(`${API_URL}/api/offre-media/${id}`, { method:"DELETE", headers: authHeaders() });
      toast.success("Supprimé");
      fetchOffreMedia(activeType);
    } catch { toast.error("Erreur suppression"); }
  };

  const toggleOffreMediaActif = async (item) => {
    const activeType = getActiveOffreMediaType();
    try {
      await fetch(`${API_URL}/api/offre-media/${item.id}`, {
        method:"PATCH", headers: authHeaders(),
        body: JSON.stringify({ actif: !item.actif }),
      });
      fetchOffreMedia(activeType);
    } catch { toast.error("Erreur"); }
  };

  const moveOffreMedia = async (itemId, direction) => {
    const list = [...offreMediaList];
    const idx  = list.findIndex(s => s.id === itemId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
    const reordered = list.map((s, i) => ({ ...s, ordre: i }));
    setOffreMediaList(reordered);
    try {
      await Promise.all(reordered.map(s =>
        fetch(`${API_URL}/api/offre-media/${s.id}`, {
          method:"PATCH", headers: authHeaders(),
          body: JSON.stringify({ ordre: s.ordre }),
        })
      ));
    } catch { toast.error("Erreur réordonnancement"); }
  };

  const uploadOffreMediaFile = async (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    if (isVideo && file.size > 200 * 1024 * 1024) return toast.error("Vidéo trop lourde (max 200 Mo)");
    setOffreMediaUploading(true); setOffreMediaUploadPct(0);
    try {
      const endpoint = isVideo ? "/api/upload/video" : "/api/upload/image";
      const formData = new FormData();
      formData.append("file", file);
      const url = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}${endpoint}`);
        xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("admin_token")}`);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setOffreMediaUploadPct(Math.round(e.loaded/e.total*100)); };
        xhr.onload = () => {
          try {
            const d = JSON.parse(xhr.responseText);
            if (xhr.status >= 400) { reject(new Error(d.error || "Erreur upload")); return; }
            resolve(d.file?.url || d.url || d.secure_url || "");
          }
          catch { reject(new Error("Réponse invalide")); }
        };
        xhr.onerror = () => reject(new Error("Erreur réseau"));
        xhr.send(formData);
      });
      if (!url) throw new Error("URL non reçue du serveur");
      setOffreMediaForm(f => ({ ...f, url, type: isVideo ? "video" : "image" }));
      toast.success("Fichier uploadé !");
    } catch (e) { toast.error(e.message); }
    finally { setOffreMediaUploading(false); setOffreMediaUploadPct(0); }
  };

  useEffect(() => {
    if (activeTab !== "platform" || platformSubTab !== "catalogue") return;
    const typeMap = { offres_en_ligne:"en-ligne", offres_domicile:"domicile", centres:"cabinet" };
    if (typeMap[catalogueSubTab]) fetchOffreMedia(typeMap[catalogueSubTab]);
    else if (catalogueSubTab === "certifications") fetchOffreMedia(offreMediaType);
  }, [activeTab, platformSubTab, catalogueSubTab, offreMediaType, fetchOffreMedia]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Codes Promo ────────────────────────────────────────────────────────────
  const PROMO_BLANK = { code:"", description:"", type_reduction:"pourcentage", valeur:"", applicable_a:["tous"], date_expiration:"", usage_max:"", actif:true };
  const [codesPromo,       setCodesPromo]       = useState([]);
  const [codesPromoLoading,setCodesPromoLoading] = useState(false);
  const [promoForm,        setPromoForm]         = useState(PROMO_BLANK);
  const [promoEditing,     setPromoEditing]      = useState(null); // id en édition
  const [promoSaving,      setPromoSaving]       = useState(false);
  const [promoShowForm,    setPromoShowForm]      = useState(false);

  const fetchCodesPromo = useCallback(async () => {
    setCodesPromoLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/codes-promo`, { headers: authHeaders() });
      const d = await r.json();
      setCodesPromo(d.codes || []);
    } catch { toast.error("Erreur chargement codes promo"); }
    finally { setCodesPromoLoading(false); }
  }, []);

  useEffect(() => {
    if (platformSubTab === "catalogue") fetchCodesPromo();
  }, [platformSubTab, catalogueSubTab, fetchCodesPromo]); // eslint-disable-line react-hooks/exhaustive-deps

  const savePromoCode = async () => {
    if (!promoForm.code.trim()) return toast.error("Le code est requis");
    if (!promoForm.valeur || isNaN(Number(promoForm.valeur))) return toast.error("La valeur est invalide");
    setPromoSaving(true);
    try {
      const payload = {
        ...promoForm,
        valeur:    Number(promoForm.valeur),
        usage_max: promoForm.usage_max ? Number(promoForm.usage_max) : null,
        date_expiration: promoForm.date_expiration || null,
        applicable_a: promoForm.applicable_a.length ? promoForm.applicable_a : ["tous"],
      };
      const url    = promoEditing ? `${API_URL}/api/codes-promo/${promoEditing}` : `${API_URL}/api/codes-promo`;
      const method = promoEditing ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      toast.success(promoEditing ? "Code mis à jour ✓" : "Code créé ✓");
      setPromoForm(PROMO_BLANK);
      setPromoEditing(null);
      setPromoShowForm(false);
      fetchCodesPromo();
    } catch (e) { toast.error(e.message); }
    finally { setPromoSaving(false); }
  };

  const deletePromoCode = async (id) => {
    if (!window.confirm("Supprimer ce code promo ?")) return;
    try {
      const r = await fetch(`${API_URL}/api/codes-promo/${id}`, { method:"DELETE", headers: authHeaders() });
      if (!r.ok) throw new Error();
      toast.success("Code supprimé");
      fetchCodesPromo();
    } catch { toast.error("Erreur suppression"); }
  };

  const togglePromoActif = async (code) => {
    try {
      const r = await fetch(`${API_URL}/api/codes-promo/${code.id}`, { method:"PUT", headers: authHeaders(), body: JSON.stringify({ actif: !code.actif }) });
      if (!r.ok) throw new Error();
      fetchCodesPromo();
    } catch { toast.error("Erreur"); }
  };

  // ── Panneau médias intégré dans chaque onglet offre ────────────────────────
  const renderOffreMediaPanel = (fixedType, accentCol = BET_COLOR, label = "") => (
    <div style={{ marginTop:28, borderTop:"1.5px dashed #e2e8f0", paddingTop:22 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:16 }}>🎬</span>
        <div>
          <h4 style={{ margin:0, fontSize:13, fontWeight:800, color:"#0f172a" }}>Vidéo / image de présentation{label ? ` — ${label}` : ""}</h4>
          <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>Affichée dans le hero de la page. YouTube, Vimeo ou fichier uploadé.</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>
        {/* ── Formulaire ajout ── */}
        <div style={{ background:"#f8fafc", borderRadius:12, border:"1px solid #e5e7eb", padding:14 }}>
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:7, padding:"6px 10px", marginBottom:12, fontSize:10, color:"#1e40af" }}>
            📐 Images : 1280×720 px · Vidéos : MP4 max 200 Mo — ou URL YouTube/Vimeo
          </div>

          {/* Zone upload */}
          <div
            onDragOver={e => { e.preventDefault(); setOffreMediaDragOver(true); }}
            onDragLeave={() => setOffreMediaDragOver(false)}
            onDrop={e => { e.preventDefault(); setOffreMediaDragOver(false); const f=e.dataTransfer.files[0]; if(f) uploadOffreMediaFile(f); }}
            onClick={() => !offreMediaUploading && offreMediaFileRef.current?.click()}
            style={{ border:`2px dashed ${offreMediaDragOver?"#1e3a8a":"#cbd5e1"}`, borderRadius:9, padding:"12px 10px", textAlign:"center", cursor:"pointer", background:offreMediaDragOver?"#eff6ff":"#fff", marginBottom:10, transition:"all .2s" }}
          >
            <input ref={offreMediaFileRef} type="file" accept="image/*,video/*" style={{ display:"none" }}
              onChange={e => { const f=e.target.files?.[0]; if(f) uploadOffreMediaFile(f); e.target.value=""; }}
            />
            {offreMediaUploading ? (
              <div>
                <div style={{ fontSize:11, color:"#1e3a8a", marginBottom:5 }}>Upload… {offreMediaUploadPct}%</div>
                <div style={{ height:5, background:"#e2e8f0", borderRadius:3 }}>
                  <div style={{ height:"100%", width:`${offreMediaUploadPct}%`, background:accentCol, borderRadius:3, transition:"width .3s" }} />
                </div>
              </div>
            ) : (
              <div style={{ fontSize:11, color:"#64748b" }}>
                <div style={{ fontSize:18, marginBottom:3 }}>☁️</div>
                Glissez ou <span style={{ color:accentCol, fontWeight:700, textDecoration:"underline" }}>parcourir</span>
              </div>
            )}
          </div>

          <div style={{ textAlign:"center", fontSize:10, color:"#94a3b8", marginBottom:8 }}>— ou URL —</div>
          <input
            value={offreMediaForm.url}
            onChange={e => setOffreMediaForm(f => ({ ...f, url: e.target.value }))}
            placeholder="https://youtube.com/... ou https://..."
            style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, marginBottom:8, boxSizing:"border-box", outline:"none" }}
          />
          {offreMediaForm.url && offreMediaForm.type === "image" && (
            <img src={offreMediaForm.url} alt="" onError={e => e.target.style.display="none"}
              style={{ width:"100%", height:80, objectFit:"cover", borderRadius:7, marginBottom:8 }} />
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            <select value={offreMediaForm.type} onChange={e => setOffreMediaForm(f => ({ ...f, type: e.target.value }))}
              style={{ padding:"7px 8px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:11, outline:"none" }}>
              <option value="video">🎬 Vidéo</option>
              <option value="image">🖼️ Image</option>
            </select>
            <input value={offreMediaForm.titre} onChange={e => setOffreMediaForm(f => ({ ...f, titre: e.target.value }))}
              placeholder="Titre (optionnel)"
              style={{ padding:"7px 8px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:11, boxSizing:"border-box", outline:"none" }} />
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#374151", marginBottom:10, cursor:"pointer" }}>
            <input type="checkbox" checked={offreMediaForm.actif} onChange={e => setOffreMediaForm(f => ({ ...f, actif: e.target.checked }))} />
            Visible sur le site
          </label>
          <button onClick={saveOffreMedia} disabled={offreMediaSaving || !offreMediaForm.url.trim()} style={{
            width:"100%", padding:"8px", background: offreMediaForm.url.trim() ? accentCol : "#e5e7eb",
            color:"#fff", border:"none", borderRadius:7, fontWeight:800, fontSize:12, cursor: offreMediaForm.url.trim() ? "pointer" : "default",
          }}>
            {offreMediaSaving ? "Enregistrement…" : "💾 Ajouter"}
          </button>
        </div>

        {/* ── Liste ── */}
        <div>
          {offreMediaLoading && <div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:12 }}>Chargement…</div>}
          {!offreMediaLoading && offreMediaList.length === 0 && (
            <div style={{ textAlign:"center", padding:"20px 12px", background:"#f8fafc", borderRadius:10, border:"1.5px dashed #e2e8f0" }}>
              <div style={{ fontSize:24, marginBottom:6 }}>🎬</div>
              <p style={{ margin:0, fontSize:11, color:"#94a3b8" }}>Aucun média configuré</p>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {offreMediaList.map((item, idx) => (
              <div key={item.id} style={{ background:"#fff", borderRadius:10, border:`1.5px solid ${item.actif?"#e0f2fe":"#fee2e2"}`, padding:10, display:"flex", gap:8, alignItems:"flex-start" }}>
                <div style={{ width:60, height:40, borderRadius:5, overflow:"hidden", flexShrink:0, background:"#0f172a", position:"relative" }}>
                  {item.type === "image"
                    ? <img src={item.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.display="none"} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🎬</div>
                  }
                  <div style={{ position:"absolute", top:1, left:1, background:item.type==="video"?"#dc2626":"#1e3a8a", color:"#fff", fontSize:7, fontWeight:800, borderRadius:2, padding:"1px 3px" }}>
                    {item.type === "video" ? "VID" : "IMG"}
                  </div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:11, color:"#0f172a", marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {item.titre || `Média #${idx + 1}`}
                  </div>
                  <div style={{ fontSize:9, color:"#94a3b8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.url}</div>
                  <div style={{ display:"flex", gap:3, marginTop:5, flexWrap:"wrap" }}>
                    <button onClick={() => toggleOffreMediaActif(item)} style={{ padding:"2px 6px", borderRadius:999, border:"none", cursor:"pointer", fontSize:9, fontWeight:700, background:item.actif?"#d1fae5":"#fee2e2", color:item.actif?"#065f46":"#991b1b" }}>
                      {item.actif ? "✅" : "❌"}
                    </button>
                    <button onClick={() => moveOffreMedia(item.id, "up")} disabled={idx===0} style={{ padding:"2px 6px", borderRadius:5, border:"1px solid #e5e7eb", background:"#f8fafc", cursor:idx===0?"default":"pointer", fontSize:10, color:idx===0?"#cbd5e1":"#374151" }}>↑</button>
                    <button onClick={() => moveOffreMedia(item.id, "down")} disabled={idx===offreMediaList.length-1} style={{ padding:"2px 6px", borderRadius:5, border:"1px solid #e5e7eb", background:"#f8fafc", cursor:idx===offreMediaList.length-1?"default":"pointer", fontSize:10, color:idx===offreMediaList.length-1?"#cbd5e1":"#374151" }}>↓</button>
                    <button onClick={() => deleteOffreMedia(item.id)} style={{ padding:"2px 6px", borderRadius:5, border:"none", background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontSize:10, fontWeight:700 }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {offreMediaList.length > 0 && (
            <p style={{ margin:"8px 0 0", fontSize:10, color:"#059669" }}>💡 Le premier média actif apparaît dans le hero de la page.</p>
          )}
        </div>
      </div>
    </div>
  );

  // ── Panneau codes promo intégré dans chaque onglet offre ────────────────────────────────────────────
  const renderPromoPanel = (offreType, accentCol = BET_COLOR) => {
    const filtered = codesPromo.filter(c => {
      const a = c.applicable_a || ["tous"];
      return a.includes("tous") || a.includes(offreType);
    });
    const formKey = `promo-actif-${offreType}`;
    const isEditingThisTab = promoEditing && filtered.some(c => c.id === promoEditing);
    const showForm = promoShowForm && (isEditingThisTab || (!promoEditing && promoForm._tab === offreType));

    const openNew = () => {
      setPromoForm({ ...PROMO_BLANK, applicable_a: [offreType], _tab: offreType });
      setPromoEditing(null);
      setPromoShowForm(true);
    };
    const openEdit = (c) => {
      setPromoForm({ code:c.code, description:c.description||"", type_reduction:c.type_reduction, valeur:c.valeur, applicable_a:c.applicable_a||[offreType], date_expiration:c.date_expiration?c.date_expiration.slice(0,16):"", usage_max:c.usage_max||"", actif:c.actif, _tab:offreType });
      setPromoEditing(c.id);
      setPromoShowForm(true);
    };
    const closeForm = () => { setPromoShowForm(false); setPromoEditing(null); setPromoForm(PROMO_BLANK); };

    return (
      <div style={{ marginTop:32, borderTop:"1.5px dashed #e2e8f0", paddingTop:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <h4 style={{ margin:0, fontSize:14, fontWeight:700, color:"#0f172a" }}>🏷️ Codes Promo liés à cette offre</h4>
            <p style={{ margin:"3px 0 0", fontSize:11, color:"#9ca3af" }}>Codes applicables à cet onglet · Expirables ou illimités</p>
          </div>
          <button onClick={openNew}
            style={{ padding:"7px 15px", background:accentCol, color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>
            ＋ Nouveau code
          </button>
        </div>

        {showForm && (
          <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:18, marginBottom:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:3 }}>Code *</label>
                <input value={promoForm.code} onChange={e => setPromoForm(p=>({...p,code:e.target.value.toUpperCase()}))}
                  placeholder="Ex : BET2025"
                  style={{ width:"100%", padding:"8px 11px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, fontFamily:"monospace", boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:3 }}>Description</label>
                <input value={promoForm.description} onChange={e => setPromoForm(p=>({...p,description:e.target.value}))}
                  placeholder="Ex : Rentrée 2025"
                  style={{ width:"100%", padding:"8px 11px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:3 }}>Type</label>
                <select value={promoForm.type_reduction} onChange={e => setPromoForm(p=>({...p,type_reduction:e.target.value}))}
                  style={{ width:"100%", padding:"8px 11px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, boxSizing:"border-box" }}>
                  <option value="pourcentage">% Pourcentage</option>
                  <option value="montant_fixe">FCFA Montant fixe</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:3 }}>
                  Valeur * {promoForm.type_reduction === "pourcentage" ? "(%)" : "(FCFA)"}
                </label>
                <input value={promoForm.valeur} onChange={e => setPromoForm(p=>({...p,valeur:e.target.value}))}
                  type="number" min="0" placeholder={promoForm.type_reduction==="pourcentage"?"Ex : 20":"Ex : 50000"}
                  style={{ width:"100%", padding:"8px 11px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:3 }}>Expiration <span style={{ color:"#9ca3af",fontWeight:400 }}>(vide=illimité)</span></label>
                <input value={promoForm.date_expiration} onChange={e => setPromoForm(p=>({...p,date_expiration:e.target.value}))}
                  type="datetime-local"
                  style={{ width:"100%", padding:"8px 11px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:3 }}>Utilisations max <span style={{ color:"#9ca3af",fontWeight:400 }}>(vide=illimité)</span></label>
                <input value={promoForm.usage_max} onChange={e => setPromoForm(p=>({...p,usage_max:e.target.value}))}
                  type="number" min="1" placeholder="Ex : 100"
                  style={{ width:"100%", padding:"8px 11px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <input type="checkbox" id={formKey} checked={!!promoForm.actif} onChange={e=>setPromoForm(p=>({...p,actif:e.target.checked}))} style={{ width:14,height:14,accentColor:accentCol,cursor:"pointer" }} />
              <label htmlFor={formKey} style={{ fontSize:12, fontWeight:600, color:"#374151", cursor:"pointer" }}>Code actif</label>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={closeForm} style={{ padding:"7px 16px", background:"#f1f5f9", border:"none", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:12, color:"#374151" }}>Annuler</button>
              <button onClick={savePromoCode} disabled={promoSaving}
                style={{ padding:"7px 18px", background:accentCol, color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontWeight:800, fontSize:12, opacity:promoSaving?.7:1 }}>
                {promoSaving ? "⏳ Enregistrement…" : "💾 Enregistrer"}
              </button>
            </div>
          </div>
        )}

        {codesPromoLoading ? (
          <div style={{ padding:20, textAlign:"center", color:"#94a3b8", fontSize:12 }}>⏳ Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"18px 0", textAlign:"center", color:"#94a3b8", fontSize:12, border:"1.5px dashed #e2e8f0", borderRadius:10 }}>
            Aucun code promo pour cette offre — cliquez sur "Nouveau code" pour en créer un.
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtered.map(c => {
              const expired = c.date_expiration && new Date(c.date_expiration) < new Date();
              const maxed   = c.usage_max != null && c.usage_count >= c.usage_max;
              const valid   = c.actif && !expired && !maxed;
              return (
                <div key={c.id} style={{ background:"#fff", border:`1.5px solid ${valid?"#bae6fd":expired||maxed?"#fecaca":"#fde68a"}`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:"monospace", fontWeight:900, fontSize:13, color:"#0f172a", background:"#f1f5f9", padding:"2px 9px", borderRadius:5, letterSpacing:1 }}>{c.code}</span>
                      <span style={{ padding:"1px 8px", borderRadius:20, fontSize:10, fontWeight:700,
                        background:valid?"#dcfce7":expired?"#fee2e2":maxed?"#fef3c7":"#fef3c7",
                        color:valid?"#166534":expired?"#991b1b":maxed?"#92400e":"#92400e" }}>
                        {valid?"✓ Actif":expired?"⏰ Expiré":maxed?"🚫 Épuisé":"⏸ Inactif"}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:"#475569" }}>
                      <strong style={{ color:accentCol }}>
                        {c.type_reduction==="pourcentage"?`-${c.valeur}%`:`-${Number(c.valeur).toLocaleString("fr-FR")} FCFA`}
                      </strong>
                      {c.description && <span style={{ marginLeft:6 }}>· {c.description}</span>}
                      <span style={{ marginLeft:6, color:"#94a3b8" }}>· {c.usage_count||0} util.{c.usage_max?`/${c.usage_max}`:""}</span>
                      {c.date_expiration && <span style={{ marginLeft:6, color:expired?"#ef4444":"#94a3b8" }}>· Exp. {new Date(c.date_expiration).toLocaleDateString("fr-FR")}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={() => togglePromoActif(c)} style={{ padding:"5px 10px", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:10, background:c.actif?"#fee2e2":"#dcfce7", color:c.actif?"#991b1b":"#166534" }}>
                      {c.actif?"Désactiver":"Activer"}
                    </button>
                    <button onClick={() => openEdit(c)} style={{ padding:"5px 10px", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:10, background:"#e0f2fe", color:"#0891b2" }}>✏️</button>
                    <button onClick={() => deletePromoCode(c.id)} style={{ padding:"5px 10px", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:10, background:"#f1f5f9", color:"#ef4444" }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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

                {/* ── Sous-onglet : Configuration Partenaires ── */}
                {platformSubTab === "partenaires" && (
                  <PartenairesManager apiUrl={API_URL} authHeaders={authHeaders} />
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

                    {/* ── CONFIG CENTRALE ── */}
                    <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #6366f1", padding:24, marginBottom:28 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                        <div>
                          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a" }}>📞 Coordonnées centrales BET</h3>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#6b7280" }}>Ces informations s'affichent sur le bouton WhatsApp flottant, le footer et la page Contact.</p>
                        </div>
                        {contactConfigLoad && <span style={{ fontSize:12, color:"#9ca3af" }}>⏳ Chargement…</span>}
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                        <div>
                          <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>✉️ Email central</label>
                          <input
                            value={contactConfig.email_central||""}
                            onChange={e=>setContactConfig(p=>({...p,email_central:e.target.value}))}
                            placeholder="contact@bet-ci.com"
                            style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>📱 Numéro WhatsApp (sans +)</label>
                          <input
                            value={contactConfig.whatsapp_number||""}
                            onChange={e=>setContactConfig(p=>({...p,whatsapp_number:e.target.value}))}
                            placeholder="2250700000000"
                            style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }}
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom:16 }}>
                        <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>📍 Adresse / Localisation (affichée dans la carte Maps de la page Contact)</label>
                        <input
                          value={contactConfig.localisation||""}
                          onChange={e=>setContactConfig(p=>({...p,localisation:e.target.value}))}
                          placeholder="Angré 7ème Tranche, Immeuble Le Palace, Abidjan"
                          style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }}
                        />
                      </div>
                      <div style={{ marginBottom:16 }}>
                        <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>🗺️ URL d'intégration Google Maps (iframe embed)</label>
                        <input
                          value={contactConfig.maps_embed_url||""}
                          onChange={e=>setContactConfig(p=>({...p,maps_embed_url:e.target.value}))}
                          placeholder="https://www.google.com/maps/embed?pb=..."
                          style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }}
                        />
                        <p style={{ margin:"4px 0 0", fontSize:11, color:"#9ca3af" }}>Depuis Google Maps → Partager → Intégrer une carte → copier le lien src de l'iframe</p>
                      </div>
                      <div style={{ marginBottom:16 }}>
                        <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>💬 Message WhatsApp pré-rempli</label>
                        <textarea
                          value={contactConfig.whatsapp_message||""}
                          onChange={e=>setContactConfig(p=>({...p,whatsapp_message:e.target.value}))}
                          rows={3}
                          placeholder="Bonjour ! Je souhaite avoir des informations sur les cours d'anglais chez BET."
                          style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}
                        />
                      </div>
                      {contactConfig.whatsapp_number && (
                        <div style={{ marginBottom:14, padding:"8px 12px", borderRadius:8, background:"#f0fdf4", border:"1px solid #bbf7d0", fontSize:12, color:"#166534" }}>
                          🔗 Aperçu lien : <strong>https://wa.me/{contactConfig.whatsapp_number}</strong>
                        </div>
                      )}
                      <button
                        onClick={saveContactConfig}
                        disabled={contactConfigSave}
                        style={{ padding:"10px 22px", background:"#6366f1", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:13, opacity:contactConfigSave?0.6:1 }}
                      >
                        {contactConfigSave ? "Sauvegarde…" : "💾 Enregistrer les coordonnées"}
                      </button>
                    </div>

                    {/* ── RÉSEAUX SOCIAUX ── */}
                    {(() => {
                      const SOCIALS = [
                        { key:"social_facebook",  label:"Facebook",    icon:"📘", bg:"#1877f2",  previewLabel:"f",  placeholder:"https://facebook.com/binnieset" },
                        { key:"social_instagram", label:"Instagram",   icon:"📸", bg:"linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", previewLabel:"📷", placeholder:"https://instagram.com/binnieset" },
                        { key:"social_linkedin",  label:"LinkedIn",    icon:"💼", bg:"#0077b5",  previewLabel:"in", placeholder:"https://linkedin.com/company/binnieset" },
                        { key:"social_tiktok",    label:"TikTok",      icon:"🎵", bg:"#010101",  previewLabel:"♪",  placeholder:"https://tiktok.com/@binnieset" },
                        { key:"social_twitter",   label:"X (Twitter)", icon:"🐦", bg:"#000",     previewLabel:"𝕏",  placeholder:"https://x.com/binnieset" },
                      ];
                      const visibleCount = SOCIALS.filter(s => contactConfig[s.key] && contactConfig[`${s.key}_visible`] !== false).length;
                      return (
                        <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #e2e8f0", padding:24 }}>
                          <div style={{ marginBottom:18 }}>
                            <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a" }}>🌐 Réseaux sociaux</h3>
                            <p style={{ margin:"3px 0 0", fontSize:12, color:"#6b7280" }}>Configurez les liens et activez/désactivez leur affichage dans le footer.</p>
                          </div>

                          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
                            {SOCIALS.map(({ key, label, icon, placeholder }) => {
                              const visKey  = `${key}_visible`;
                              const url     = contactConfig[key] || "";
                              const visible = contactConfig[visKey] !== false;
                              const hasUrl  = !!url.trim();
                              return (
                                <div key={key} style={{
                                  display:"grid", gridTemplateColumns:"1fr auto",
                                  gap:12, alignItems:"center",
                                  padding:"12px 14px", borderRadius:10,
                                  border:`1.5px solid ${hasUrl && visible ? "#86efac" : hasUrl ? "#fde68a" : "#e5e7eb"}`,
                                  background: hasUrl && visible ? "#f0fdf4" : hasUrl ? "#fffbeb" : "#fafafa",
                                  transition:"all .2s",
                                }}>
                                  {/* Colonne gauche : label + input */}
                                  <div>
                                    <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                                      <span>{icon}</span>{label}
                                      {hasUrl && (
                                        <a href={url} target="_blank" rel="noopener noreferrer"
                                          style={{ marginLeft:"auto", fontSize:11, color:BET_COLOR, fontWeight:600, textDecoration:"none" }}>
                                          Tester ↗
                                        </a>
                                      )}
                                    </label>
                                    <input
                                      value={url}
                                      onChange={e => setContactConfig(p => ({ ...p, [key]: e.target.value }))}
                                      placeholder={placeholder}
                                      style={{ width:"100%", padding:"8px 11px", borderRadius:7, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box", background:"#fff" }}
                                    />
                                  </div>
                                  {/* Colonne droite : toggle visibilité */}
                                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:60 }}>
                                    <ToggleSwitch
                                      on={hasUrl && visible}
                                      onChange={v => setContactConfig(p => ({ ...p, [visKey]: v }))}
                                      color="#22c55e"
                                    />
                                    <span style={{ fontSize:10, fontWeight:700, color: hasUrl && visible ? "#16a34a" : "#9ca3af", whiteSpace:"nowrap" }}>
                                      {hasUrl && visible ? "Visible" : hasUrl ? "Masqué" : "Vide"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Aperçu footer */}
                          <div style={{ marginBottom:18, padding:"12px 16px", borderRadius:10, background:"#f8fafc", border:"1px solid #e2e8f0" }}>
                            <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700, color:"#6b7280", letterSpacing:".05em" }}>APERÇU FOOTER</p>
                            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                              {SOCIALS.map(({ key, bg, previewLabel }) => {
                                const url     = contactConfig[key];
                                const visible = contactConfig[`${key}_visible`] !== false;
                                const active  = url && visible;
                                return (
                                  <div key={key} style={{
                                    width:34, height:34, borderRadius:"50%",
                                    background: active ? bg : "#e5e7eb",
                                    display:"flex", alignItems:"center", justifyContent:"center",
                                    color: active ? "#fff" : "#9ca3af",
                                    fontSize:13, fontWeight:700,
                                    cursor: active ? "pointer" : "default",
                                    opacity: url && !visible ? 0.3 : active ? 1 : 0.45,
                                    transition:"all .2s",
                                    position:"relative",
                                  }}
                                    title={active ? url : url ? "Masqué" : "Non configuré"}
                                    onClick={() => active && window.open(url, "_blank")}
                                  >
                                    {previewLabel}
                                    {url && !visible && (
                                      <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🚫</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <p style={{ margin:"8px 0 0", fontSize:11, color:"#9ca3af" }}>
                              {visibleCount} / 5 réseau{visibleCount !== 1 ? "x" : ""} visible{visibleCount !== 1 ? "s" : ""} sur le site
                            </p>
                          </div>

                          <button
                            onClick={saveContactConfig}
                            disabled={contactConfigSave}
                            style={{ padding:"10px 22px", background:"#6366f1", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:13, opacity:contactConfigSave ? 0.6 : 1 }}
                          >
                            {contactConfigSave ? "Sauvegarde…" : "💾 Enregistrer les réseaux sociaux"}
                          </button>
                        </div>
                      );
                    })()}

                    {/* ── CONFIG PAR CENTRE (désactivé temporairement) ── */}
                    {/*
                    <div style={{ marginBottom:20 }}>
                      <h3>💬 Messages WhatsApp — Centres BET</h3>
                      ...
                    </div>
                    */}
                  </div>
                )}
                {/* ── Sous-onglet : Marquee ── */}
                {platformSubTab === "marquee" && (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                      <div>
                        <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>📢 Messages défilants (Marquee)</h3>
                        <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Ces messages s'affichent en bandeau sur la page d'accueil. Seuls les messages actifs et non expirés sont visibles.</p>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={fetchMarquee} style={{ padding:"8px 14px", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>🔄 Actualiser</button>
                        <button onClick={() => setMarqueeForm({ texte:"", code_promo:"", lien_url:"", lien_label:"", date_expiration:"", actif:true })} style={{ padding:"8px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>➕ Nouveau message</button>
                      </div>
                    </div>

                    {/* Aperçu live */}
                    {marqueeMessages.filter(m => m.actif).length > 0 && (
                      <div style={{ marginBottom:16, background:"#0f172a", borderRadius:10, padding:"10px 16px", overflow:"hidden", position:"relative" }}>
                        <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontWeight:600 }}>APERÇU BANDEAU</div>
                        <div style={{ display:"flex", gap:20, overflow:"hidden", whiteSpace:"nowrap" }}>
                          {marqueeMessages.filter(m => m.actif).map((m, i) => (
                            <span key={i} style={{ fontSize:12, color:"#e2e8f0", flexShrink:0 }}>
                              {m.texte}
                              {m.code_promo && <span style={{ marginLeft:6, background:"#fbbf24", color:"#78350f", padding:"1px 6px", borderRadius:4, fontWeight:700, fontSize:11 }}>{m.code_promo}</span>}
                              {m.lien_url && <span style={{ marginLeft:6, color:"#38bdf8", textDecoration:"underline", fontSize:11 }}>{m.lien_label || m.lien_url}</span>}
                              <span style={{ marginLeft:12, color:"#334155" }}>·</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Formulaire création / édition */}
                    {marqueeForm && (
                      <div style={{ background:"#f8fafc", border:`1.5px solid ${BET_COLOR}33`, borderRadius:12, padding:20, marginBottom:20 }}>
                        <h4 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:"#0f172a" }}>
                          {marqueeForm.id ? "✏️ Modifier le message" : "➕ Nouveau message"}
                        </h4>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                          <div style={{ gridColumn:"1 / -1" }}>
                            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Texte du message *</label>
                            <input value={marqueeForm.texte} onChange={e => setMarqueeForm(p => ({ ...p, texte: e.target.value }))}
                              placeholder="🎁 Offre spéciale · -15% sur l'inscription en ligne !"
                              style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }} />
                          </div>
                          <div>
                            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Code promo (optionnel)</label>
                            <input value={marqueeForm.code_promo} onChange={e => setMarqueeForm(p => ({ ...p, code_promo: e.target.value }))}
                              placeholder="BET2024"
                              style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }} />
                          </div>
                          <div>
                            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Lien de redirection (optionnel)</label>
                            <input value={marqueeForm.lien_url} onChange={e => setMarqueeForm(p => ({ ...p, lien_url: e.target.value }))}
                              placeholder="https://bet-languages.com/offre"
                              style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }} />
                          </div>
                          <div>
                            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Texte du lien</label>
                            <input value={marqueeForm.lien_label} onChange={e => setMarqueeForm(p => ({ ...p, lien_label: e.target.value }))}
                              placeholder="En savoir plus →"
                              style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }} />
                          </div>
                          <div>
                            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Date d'expiration (optionnel)</label>
                            <input type="datetime-local" value={marqueeForm.date_expiration}
                              onChange={e => setMarqueeForm(p => ({ ...p, date_expiration: e.target.value }))}
                              style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }} />
                          </div>
                          <div>
                            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Ordre d'affichage</label>
                            <input type="number" value={marqueeForm.ordre ?? ""} onChange={e => setMarqueeForm(p => ({ ...p, ordre: e.target.value }))}
                              placeholder="0"
                              style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:"1px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }} />
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:20 }}>
                            <ToggleSwitch on={marqueeForm.actif !== false} onChange={v => setMarqueeForm(p => ({ ...p, actif: v }))} color={BET_COLOR} />
                            <span style={{ fontSize:13, color:"#374151" }}>Actif (visible sur le site)</span>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                          <button onClick={() => setMarqueeForm(null)} style={{ padding:"8px 16px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13 }}>Annuler</button>
                          <button
                            onClick={() => saveMarquee(marqueeForm)}
                            disabled={!marqueeForm.texte?.trim() || !!marqueeSavingId}
                            style={{ padding:"8px 18px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:13, opacity:(!marqueeForm.texte?.trim() || !!marqueeSavingId) ? 0.6 : 1 }}>
                            {marqueeSavingId ? "⏳ Enregistrement…" : "💾 Enregistrer"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Liste des messages */}
                    {marqueeLoading ? (
                      <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>⏳ Chargement…</div>
                    ) : marqueeMessages.length === 0 ? (
                      <div style={{ textAlign:"center", padding:32, color:"#9ca3af", fontSize:13 }}>Aucun message. Créez-en un ci-dessus.</div>
                    ) : (() => {
                      const totalPages = Math.ceil(marqueeMessages.length / MARQUEE_PER_PAGE);
                      const page       = Math.min(marqueePage, totalPages);
                      const slice      = marqueeMessages.slice((page - 1) * MARQUEE_PER_PAGE, page * MARQUEE_PER_PAGE);
                      return (
                        <>
                          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                            {slice.map(msg => {
                              const isExpired = msg.date_expiration && new Date(msg.date_expiration) < new Date();
                              return (
                                <div key={msg.id} style={{ background:"#fff", borderRadius:10, padding:"14px 16px", border:`1px solid ${isExpired ? "#fecaca" : msg.actif ? "#d1fae5" : "#e5e7eb"}`, display:"flex", alignItems:"flex-start", gap:14, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                                  {/* Ordre + toggle */}
                                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, minWidth:36 }}>
                                    <span style={{ fontSize:11, fontWeight:700, color:"#9ca3af" }}>#{msg.ordre}</span>
                                    <ToggleSwitch on={msg.actif} onChange={() => toggleMarqueeActif(msg)} color={BET_COLOR} />
                                  </div>
                                  {/* Contenu */}
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", marginBottom:4 }}>{msg.texte}</div>
                                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                                      {msg.code_promo && (
                                        <span style={{ background:"#fef3c7", color:"#92400e", padding:"2px 8px", borderRadius:5, fontSize:11, fontWeight:700 }}>🏷️ {msg.code_promo}</span>
                                      )}
                                      {msg.lien_url && (
                                        <span style={{ background:"#e0f2fe", color:"#0369a1", padding:"2px 8px", borderRadius:5, fontSize:11 }}>🔗 {msg.lien_label || msg.lien_url}</span>
                                      )}
                                      {msg.date_expiration && (
                                        <span style={{ background: isExpired ? "#fee2e2" : "#f0fdf4", color: isExpired ? "#dc2626" : "#166534", padding:"2px 8px", borderRadius:5, fontSize:11 }}>
                                          {isExpired ? "⛔ Expiré" : "⏳ Exp."} {new Date(msg.date_expiration).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                                        </span>
                                      )}
                                      {!msg.actif && !isExpired && <span style={{ background:"#f1f5f9", color:"#64748b", padding:"2px 8px", borderRadius:5, fontSize:11 }}>Inactif</span>}
                                    </div>
                                  </div>
                                  {/* Actions */}
                                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                                    <button onClick={() => setMarqueeForm({ ...msg, date_expiration: msg.date_expiration ? msg.date_expiration.slice(0,16) : "" })}
                                      style={{ padding:"5px 10px", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>✏️</button>
                                    <button onClick={() => deleteMarquee(msg.id)}
                                      style={{ padding:"5px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>🗑️</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* ── Pagination ── */}
                          {totalPages > 1 && (
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:16, padding:"10px 0" }}>
                              <span style={{ fontSize:12, color:"#6b7280" }}>
                                {(page - 1) * MARQUEE_PER_PAGE + 1}–{Math.min(page * MARQUEE_PER_PAGE, marqueeMessages.length)} sur {marqueeMessages.length} messages
                              </span>
                              <div style={{ display:"flex", gap:4 }}>
                                <button onClick={() => setMarqueePage(1)} disabled={page === 1}
                                  style={{ padding:"5px 9px", borderRadius:6, border:"1px solid #e5e7eb", background: page===1?"#f9fafb":"#fff", color: page===1?"#d1d5db":"#374151", cursor: page===1?"default":"pointer", fontSize:12, fontWeight:600 }}>«</button>
                                <button onClick={() => setMarqueePage(p => Math.max(1, p - 1))} disabled={page === 1}
                                  style={{ padding:"5px 9px", borderRadius:6, border:"1px solid #e5e7eb", background: page===1?"#f9fafb":"#fff", color: page===1?"#d1d5db":"#374151", cursor: page===1?"default":"pointer", fontSize:12, fontWeight:600 }}>‹</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                  <button key={p} onClick={() => setMarqueePage(p)}
                                    style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${p===page ? BET_COLOR : "#e5e7eb"}`, background: p===page ? BET_COLOR : "#fff", color: p===page ? "#fff" : "#374151", cursor:"pointer", fontSize:12, fontWeight:700 }}>{p}</button>
                                ))}
                                <button onClick={() => setMarqueePage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                  style={{ padding:"5px 9px", borderRadius:6, border:"1px solid #e5e7eb", background: page===totalPages?"#f9fafb":"#fff", color: page===totalPages?"#d1d5db":"#374151", cursor: page===totalPages?"default":"pointer", fontSize:12, fontWeight:600 }}>›</button>
                                <button onClick={() => setMarqueePage(totalPages)} disabled={page === totalPages}
                                  style={{ padding:"5px 9px", borderRadius:6, border:"1px solid #e5e7eb", background: page===totalPages?"#f9fafb":"#fff", color: page===totalPages?"#d1d5db":"#374151", cursor: page===totalPages?"default":"pointer", fontSize:12, fontWeight:600 }}>»</button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* ── Sous-onglets internes : Offres & Contenus ── */}
                {platformSubTab === "catalogue" && (
                  <div style={{ display:"flex", gap:2, marginBottom:16, background:"#f8fafc", borderRadius:10, padding:4, border:"1px solid #e5e7eb" }}>
                    {CATALOGUE_TABS.map(t => {
                      const active = catalogueSubTab === t.key;
                      return (
                        <button key={t.key} onClick={() => setCatalogueSubTab(t.key)} style={{
                          flex:1, padding:"8px 10px", borderRadius:8, border:"none", cursor:"pointer",
                          fontWeight:700, fontSize:12,
                          background: active ? "#fff" : "transparent",
                          color: active ? BET_COLOR : "#6b7280",
                          boxShadow: active ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                          display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                          transition:"all .18s",
                        }}>
                          <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {platformSubTab === "catalogue" && catalogueSubTab === "centres" && (
                  <div>
                    {/* Header */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                      <div>
                        <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>📍 Nos centres & leurs offres</h3>
                        <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Source de vérité partagée — Navbar, parcours et frontend se synchronisent automatiquement.</p>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => setCentresMaster(readCentresMaster())} style={{ padding:"8px 14px", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>🔄 Actualiser</button>
                        <button onClick={() => setShowAddCentre(true)} style={{ padding:"8px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>➕ Nouveau centre</button>
                      </div>
                    </div>

                    {/* Grille des centres */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                      {centresMaster.map(c => (
                        <div key={c.key} style={{ background:"#fff", borderRadius:14, border:`2px solid ${c.actif ? c.color+"33" : "#f1f5f9"}`, padding:16, boxShadow:"0 1px 6px rgba(0,0,0,.05)", opacity:c.actif?1:.65 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                            <div style={{ width:42, height:42, borderRadius:10, background:c.color+"22", border:`2px solid ${c.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, overflow:"hidden" }}>
                              {c.photos?.[0] ? <img src={c.photos[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "📍"}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{c.name}</div>
                              <div style={{ fontSize:11, color:"#64748b" }}>{c.ville}</div>
                            </div>
                            <span style={{ padding:"3px 8px", borderRadius:20, fontSize:10, fontWeight:700, background:c.actif?"#dcfce7":"#fee2e2", color:c.actif?"#166534":"#991b1b", flexShrink:0 }}>{c.actif ? "Actif" : "Inactif"}</span>
                          </div>
                          <div style={{ marginBottom:8 }}>
                            <div style={{ fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4 }}>Offres actives</div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                              {(c.offres||[]).filter(o => o.actif).map(o => <span key={o.id} style={{ padding:"2px 7px", borderRadius:20, fontSize:10, fontWeight:600, background:BET_LIGHT, color:BET_COLOR }}>{o.label}</span>)}
                              {(c.offres||[]).filter(o => o.actif).length === 0 && <span style={{ fontSize:11, color:"#94a3b8", fontStyle:"italic" }}>Aucune</span>}
                            </div>
                          </div>
                          <div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>🕐 {c.horaires}</div>
                          {c.brochure_url && <div style={{ fontSize:11, color:"#0891b2", marginBottom:8 }}>📄 Brochure configurée</div>}
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => { setCentreEditKey(c.key); setCentreEditData(JSON.parse(JSON.stringify(c))); }}
                              style={{ flex:1, padding:"8px 0", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                              ✏️ Modifier
                            </button>
                            <button onClick={() => { if(window.confirm(`Supprimer ${c.name} ?`)) { const u=centresMaster.filter(x=>x.key!==c.key); saveCentresMaster(u); setCentresMaster(u); toast.success("Centre supprimé"); } }}
                              style={{ padding:"8px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Modal Ajouter un centre */}
                    {showAddCentre && (
                      <div onClick={e => { if(e.target===e.currentTarget) setShowAddCentre(false); }}
                        style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                        <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:520, boxShadow:"0 24px 60px rgba(0,0,0,0.25)", overflow:"hidden" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 24px", borderBottom:"1px solid #f1f5f9" }}>
                            <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a", flex:1 }}>➕ Nouveau centre BET</h3>
                            <button onClick={() => setShowAddCentre(false)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#f1f5f9", cursor:"pointer", fontSize:16, color:"#64748b" }}>✕</button>
                          </div>
                          <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:12 }}>
                            {[
                              { field:"name",      label:"Nom du centre",      placeholder:"BET Cocody" },
                              { field:"ville",     label:"Ville",              placeholder:"Abidjan" },
                              { field:"addr",      label:"Adresse physique",   placeholder:"Cocody Danga, Abidjan" },
                              { field:"telephone", label:"Téléphone",          placeholder:"+225 07 00 000 00" },
                              { field:"email",     label:"E-mail",             placeholder:"nouveau@bet-ci.com" },
                            ].map(f => (
                              <div key={f.field}>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{f.label}</label>
                                <input value={newCentreForm[f.field]} onChange={e => setNewCentreForm(x => ({...x,[f.field]:e.target.value}))}
                                  placeholder={f.placeholder} style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, color:"#0f172a", background:"#fff", boxSizing:"border-box" }} />
                              </div>
                            ))}
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                              <div>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Latitude</label>
                                <input value={newCentreForm.lat} onChange={e => setNewCentreForm(x=>({...x,lat:e.target.value}))} placeholder="5.3742" style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                              </div>
                              <div>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Longitude</label>
                                <input value={newCentreForm.lng} onChange={e => setNewCentreForm(x=>({...x,lng:e.target.value}))} placeholder="-3.9832" style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                              </div>
                            </div>
                            <div>
                              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Couleur</label>
                              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                {CENTRES_BET_COLORS.map(col => (
                                  <button key={col} onClick={() => setNewCentreForm(x=>({...x,color:col}))} type="button"
                                    style={{ width:28, height:28, borderRadius:"50%", background:col, border:`3px solid ${newCentreForm.color===col?"#0f172a":"transparent"}`, cursor:"pointer" }} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", padding:"16px 24px", borderTop:"1px solid #f1f5f9", background:"#fafafa" }}>
                            <button onClick={() => setShowAddCentre(false)} style={{ padding:"10px 20px", background:"#f1f5f9", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:"#374151" }}>Annuler</button>
                            <button onClick={() => {
                              if (!newCentreForm.name.trim() || !newCentreForm.ville.trim()) { toast.error("Nom et ville requis"); return; }
                              const key = newCentreForm.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,"_").replace(/_+/g,"_");
                              const nouveau = {
                                key, name:newCentreForm.name.trim(), ville:newCentreForm.ville.trim(),
                                addr:newCentreForm.addr.trim(), lat:parseFloat(newCentreForm.lat)||0, lng:parseFloat(newCentreForm.lng)||0,
                                color:newCentreForm.color, actif:true,
                                description:"", horaires:"Lun–Ven : 08h–19h | Sam : 09h–17h",
                                telephone:newCentreForm.telephone.trim(), email:newCentreForm.email.trim(),
                                photos:[], brochure_url:"", brochure_nom:`Brochure ${newCentreForm.name.trim()}.pdf`,
                                maps_url:"", maps_embed:"",
                                cta:{ rdv:{actif:true,lien:"/contact"}, inscrire:{actif:true,lien:"/parcours/particulier"}, contact:{actif:true,lien:"/contact"} },
                                offres:[...DEFAULT_OFFRES],
                                assistantes:[
                                  { nom:"Assistante 1", phone:"", message:`Bonjour, je souhaite avoir des informations sur les cours d'anglais chez ${newCentreForm.name.trim()}.` },
                                ],
                              };
                              const updated = [...centresMaster, nouveau];
                              saveCentresMaster(updated);
                              setCentresMaster(updated);
                              setShowAddCentre(false);
                              setNewCentreForm({ name:"", ville:"", addr:"", telephone:"", email:"", color:"#0891b2", lat:"", lng:"" });
                              toast.success(`Centre ${nouveau.name} créé`);
                            }} style={{ padding:"10px 24px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:800, fontSize:13 }}>
                              ✅ Créer
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Modal Modifier un centre */}
                    {centreEditKey && centreEditData && (() => {
                      const updateField = (field, val) => setCentreEditData(d => ({ ...d, [field]: val }));
                      const updateOffre  = (id, field, val) => setCentreEditData(d => ({ ...d, offres: d.offres.map(o => o.id === id ? { ...o, [field]: val } : o) }));
                      const removeOffre  = (id) => setCentreEditData(d => ({ ...d, offres: (d.offres||[]).filter(o => o.id !== id) }));
                      const addOffre     = () => setCentreEditData(d => { const newId = `offre_${Date.now()}`; return { ...d, offres: [...(d.offres||[]), { id:newId, label:"Nouvelle offre", actif:true, prix:"", duration:"", desc:"", brochure_url:"", brochure_nom:"" }] }; });
                      const updateCta   = (btn, field, val) => setCentreEditData(d => ({ ...d, cta:{ ...(d.cta||{}), [btn]:{ ...(d.cta?.[btn]||{}), [field]:val } } }));
                      const addPhoto    = () => { if (!newPhotoUrl.trim()) return; setCentreEditData(d => ({ ...d, photos:[...(d.photos||[]), newPhotoUrl.trim()] })); setNewPhotoUrl(""); };
                      const removePhoto = (idx) => setCentreEditData(d => ({ ...d, photos:(d.photos||[]).filter((_,i) => i!==idx) }));
                      const updateAsst  = (idx, field, val) => setCentreEditData(d => ({ ...d, assistantes:d.assistantes.map((a,i) => i===idx ? {...a,[field]:val} : a) }));
                      const addAsst     = () => setCentreEditData(d => ({ ...d, assistantes:[...(d.assistantes||[]), { nom:`Assistante ${(d.assistantes||[]).length+1}`, phone:"", message:`Bonjour, je souhaite avoir des informations sur les cours d'anglais chez ${d.name}.` }] }));
                      const removeAsst  = (idx) => setCentreEditData(d => ({ ...d, assistantes:(d.assistantes||[]).filter((_,i) => i!==idx) }));
                      const updateAdvantage  = (idx, val) => setCentreEditData(d => ({ ...d, advantages:(d.advantages||[]).map((a,i) => i===idx ? val : a) }));
                      const addAdvantage     = () => setCentreEditData(d => ({ ...d, advantages:[...(d.advantages||[]), ""] }));
                      const removeAdvantage  = (idx) => setCentreEditData(d => ({ ...d, advantages:(d.advantages||[]).filter((_,i) => i!==idx) }));
                      const updateTestimonial= (idx, field, val) => setCentreEditData(d => ({ ...d, testimonials:(d.testimonials||[]).map((t,i) => i===idx ? {...t,[field]:val} : t) }));
                      const addTestimonial   = () => setCentreEditData(d => ({ ...d, testimonials:[...(d.testimonials||[]), { name:"", text:"", avatar:"👤" }] }));
                      const removeTestimonial= (idx) => setCentreEditData(d => ({ ...d, testimonials:(d.testimonials||[]).filter((_,i) => i!==idx) }));
                      const updateFaq        = (idx, field, val) => setCentreEditData(d => ({ ...d, faq:(d.faq||[]).map((f,i) => i===idx ? {...f,[field]:val} : f) }));
                      const addFaq           = () => setCentreEditData(d => ({ ...d, faq:[...(d.faq||[]), { q:"", a:"" }] }));
                      const removeFaq        = (idx) => setCentreEditData(d => ({ ...d, faq:(d.faq||[]).filter((_,i) => i!==idx) }));
                      const handleSave  = () => {
                        setCentresSaving(true);
                        const updated = centresMaster.map(c => c.key === centreEditKey ? centreEditData : c);
                        saveCentresMaster(updated);
                        setCentresMaster(updated);
                        setCentreEditKey(null); setCentreEditData(null); setNewPhotoUrl("");
                        setCentresSaving(false);
                        toast.success(`Centre ${centreEditData.name} mis à jour — Navbar & parcours synchronisés`);
                      };
                      const closeModal = () => { setCentreEditKey(null); setCentreEditData(null); setNewPhotoUrl(""); };
                      const iStyle = { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, color:"#0f172a", background:"#fff", boxSizing:"border-box" };
                      const lStyle = { fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 };
                      const sectionTitle = (t) => <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em", marginBottom:12, paddingBottom:6, borderBottom:"1px solid #f1f5f9" }}>{t}</div>;
                      const commercialesAffilies = (users||[]).filter(u => u.role==="commercial" && (u.scope||[]).includes(centreEditData.key));
                      return (
                        <div onClick={e => { if(e.target===e.currentTarget) closeModal(); }}
                          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                          <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:720, maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 60px rgba(0,0,0,0.25)", overflow:"hidden" }}>

                            {/* Header */}
                            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 24px", borderBottom:"1px solid #f1f5f9", flexShrink:0 }}>
                              <div style={{ width:36, height:36, borderRadius:10, background:centreEditData.color+"22", border:`2px solid ${centreEditData.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📍</div>
                              <div style={{ flex:1 }}>
                                <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a" }}>{centreEditData.name}</h3>
                                <span style={{ fontSize:11, color:"#64748b" }}>{centreEditData.ville}</span>
                              </div>
                              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                                <div>
                                  {CENTRES_BET_COLORS.map(col => (
                                    <button key={col} onClick={() => updateField("color",col)} type="button"
                                      style={{ width:18, height:18, borderRadius:"50%", background:col, border:`2px solid ${centreEditData.color===col?"#0f172a":"transparent"}`, cursor:"pointer", margin:"0 2px" }} />
                                  ))}
                                </div>
                                <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:centreEditData.actif?"#dcfce7":"#fee2e2", color:centreEditData.actif?"#166534":"#991b1b" }}>
                                  {centreEditData.actif ? "Actif" : "Inactif"}
                                </span>
                              </div>
                              <button onClick={closeModal} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#f1f5f9", cursor:"pointer", fontSize:16, color:"#64748b", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
                            </div>

                            {/* Corps scrollable */}
                            <div style={{ overflowY:"auto", flex:1, padding:"20px 24px", display:"flex", flexDirection:"column", gap:22 }}>

                              {/* Infos générales */}
                              <div>
                                {sectionTitle("Informations générales")}
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                                  <div><label style={lStyle}>Nom affiché</label><input style={iStyle} value={centreEditData.name} onChange={e => updateField("name",e.target.value)} /></div>
                                  <div><label style={lStyle}>Ville</label><input style={iStyle} value={centreEditData.ville} onChange={e => updateField("ville",e.target.value)} /></div>
                                  <div><label style={lStyle}>Horaires</label><input style={iStyle} value={centreEditData.horaires} onChange={e => updateField("horaires",e.target.value)} placeholder="Lun–Ven : 08h–19h | Sam : 09h–17h" /></div>
                                  <div><label style={lStyle}>Téléphone</label><input style={iStyle} value={centreEditData.telephone} onChange={e => updateField("telephone",e.target.value)} /></div>
                                  <div><label style={lStyle}>E-mail</label><input style={iStyle} value={centreEditData.email} onChange={e => updateField("email",e.target.value)} type="email" /></div>
                                  <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:20 }}>
                                    <label style={{ ...lStyle, margin:0 }}>Visible</label>
                                    <button onClick={() => updateField("actif",!centreEditData.actif)} type="button" style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:centreEditData.actif?"#dcfce7":"#fee2e2", color:centreEditData.actif?"#166534":"#991b1b" }}>
                                      {centreEditData.actif ? "✅ Actif" : "❌ Inactif"}
                                    </button>
                                  </div>
                                  <div style={{ gridColumn:"1/-1" }}><label style={lStyle}>Description</label><textarea style={{ ...iStyle, minHeight:64, resize:"vertical" }} value={centreEditData.description} onChange={e => updateField("description",e.target.value)} /></div>
                                  <div><label style={lStyle}>Latitude</label><input style={iStyle} type="number" step="0.0001" value={centreEditData.lat||""} onChange={e => updateField("lat",parseFloat(e.target.value)||0)} placeholder="5.3699" /></div>
                                  <div><label style={lStyle}>Longitude</label><input style={iStyle} type="number" step="0.0001" value={centreEditData.lng||""} onChange={e => updateField("lng",parseFloat(e.target.value)||0)} placeholder="-3.9674" /></div>
                                </div>
                              </div>

                              {/* Adresse & Maps */}
                              <div>
                                {sectionTitle("📍 Adresse & Google Maps")}
                                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                  <div><label style={lStyle}>Adresse physique</label><input style={iStyle} value={centreEditData.addr} onChange={e => updateField("addr",e.target.value)} placeholder="Ex : Angré 7ème Tranche, Abidjan" /></div>
                                  <div><label style={lStyle}>Lien Google Maps direct</label><input style={iStyle} value={centreEditData.maps_url||""} onChange={e => updateField("maps_url",e.target.value)} placeholder="https://maps.google.com/?q=…" /></div>
                                  <div>
                                    <label style={lStyle}>URL embed iframe</label>
                                    <input style={iStyle} value={centreEditData.maps_embed||""} onChange={e => updateField("maps_embed",e.target.value)} placeholder="https://www.google.com/maps/embed?pb=…" />
                                    <p style={{ fontSize:11, color:"#94a3b8", margin:"4px 0 0" }}>Google Maps → Partager → Intégrer une carte → copier le src de l'iframe</p>
                                  </div>
                                  {centreEditData.maps_embed && (
                                    <div style={{ borderRadius:10, overflow:"hidden", border:"1px solid #e5e7eb", height:160 }}>
                                      <iframe title="maps-preview" src={centreEditData.maps_embed} width="100%" height="160" style={{ border:0, display:"block" }} allowFullScreen loading="lazy" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Brochure PDF */}
                              <div>
                                {sectionTitle("📄 Brochure PDF (téléchargeable par le client)")}
                                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                  <div><label style={lStyle}>URL du PDF</label><input style={iStyle} value={centreEditData.brochure_url||""} onChange={e => updateField("brochure_url",e.target.value)} placeholder="https://… ou /brochures/angre.pdf" /></div>
                                  <div><label style={lStyle}>Nom affiché du fichier</label><input style={iStyle} value={centreEditData.brochure_nom||""} onChange={e => updateField("brochure_nom",e.target.value)} placeholder="Brochure BET Angré.pdf" /></div>
                                  {centreEditData.brochure_url && (
                                    <a href={centreEditData.brochure_url} target="_blank" rel="noreferrer"
                                      style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 16px", background:"#f0fdf4", color:"#166534", border:"1px solid #86efac", borderRadius:8, fontSize:12, fontWeight:700, textDecoration:"none" }}>
                                      📄 Aperçu — {centreEditData.brochure_nom||"brochure.pdf"}
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Galerie photos */}
                              <div>
                                {sectionTitle("🖼️ Galerie photos")}
                                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                                  <input style={{ ...iStyle, flex:1 }} value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} placeholder="URL photo (https://…)" onKeyDown={e => e.key==="Enter" && addPhoto()} />
                                  <button onClick={addPhoto} type="button" style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, flexShrink:0 }}>＋ Ajouter</button>
                                </div>
                                {(centreEditData.photos||[]).length === 0 && <p style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic", margin:0 }}>Aucune photo.</p>}
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:8 }}>
                                  {(centreEditData.photos||[]).map((url, idx) => (
                                    <div key={idx} style={{ position:"relative", borderRadius:8, overflow:"hidden", aspectRatio:"4/3", background:"#f1f5f9" }}>
                                      <img src={url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.currentTarget.style.opacity=".3"; }} />
                                      <button onClick={() => removePhoto(idx)} type="button" style={{ position:"absolute", top:4, right:4, width:22, height:22, borderRadius:"50%", background:"rgba(220,38,38,.9)", color:"#fff", border:"none", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>✕</button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Page Cabinet (CourseDetail) */}
                              <div>
                                {sectionTitle("🎓 Contenu de la page Cabinet (CourseDetail)")}
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                                  <div style={{ gridColumn:"1/-1" }}>
                                    <label style={lStyle}>Sous-titre (affiché sous le titre)</label>
                                    <input style={iStyle} value={centreEditData.subtitle||""} onChange={e => updateField("subtitle",e.target.value)} placeholder="Apprenez en petit groupe dans nos centres modernes" />
                                  </div>
                                  <div style={{ gridColumn:"1/-1" }}>
                                    <label style={lStyle}>Image de couverture (URL)</label>
                                    <input style={iStyle} value={centreEditData.hero_image||""} onChange={e => updateField("hero_image",e.target.value)} placeholder="https://images.unsplash.com/…" />
                                    {centreEditData.hero_image && <img src={centreEditData.hero_image} alt="" style={{ marginTop:8, width:"100%", height:100, objectFit:"cover", borderRadius:8 }} onError={e => { e.currentTarget.style.display="none"; }} />}
                                  </div>
                                </div>

                                {/* Avantages */}
                                <label style={{ ...lStyle, marginBottom:8 }}>✅ Avantages exclusifs (section "Aperçu")</label>
                                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
                                  {(centreEditData.advantages||[]).map((adv, idx) => (
                                    <div key={idx} style={{ display:"flex", gap:8, alignItems:"center" }}>
                                      <input style={{ ...iStyle, flex:1, fontSize:12 }} value={adv} onChange={e => updateAdvantage(idx, e.target.value)} placeholder="Ex : Groupes de 6 personnes maximum" />
                                      <button onClick={() => removeAdvantage(idx)} type="button" style={{ padding:"9px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, flexShrink:0 }}>🗑️</button>
                                    </div>
                                  ))}
                                  <button onClick={addAdvantage} type="button" style={{ padding:"8px 0", background:"#f0fdf4", color:"#166534", border:"1.5px dashed #86efac", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>＋ Ajouter un avantage</button>
                                </div>

                                {/* Témoignages */}
                                <label style={{ ...lStyle, marginBottom:8 }}>💬 Témoignages (onglet "Avis")</label>
                                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                                  {(centreEditData.testimonials||[]).map((t, idx) => (
                                    <div key={idx} style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"12px 14px" }}>
                                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, alignItems:"end", marginBottom:8 }}>
                                        <div><label style={lStyle}>Nom</label><input style={{ ...iStyle, fontSize:12 }} value={t.name} onChange={e => updateTestimonial(idx,"name",e.target.value)} placeholder="Fatou S." /></div>
                                        <div><label style={lStyle}>Avatar (emoji)</label><input style={{ ...iStyle, fontSize:12 }} value={t.avatar} onChange={e => updateTestimonial(idx,"avatar",e.target.value)} placeholder="👩‍🎓" /></div>
                                        <button onClick={() => removeTestimonial(idx)} type="button" style={{ padding:"9px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, alignSelf:"end" }}>🗑️</button>
                                      </div>
                                      <div><label style={lStyle}>Témoignage</label><textarea style={{ ...iStyle, fontSize:12, minHeight:48, resize:"none" }} value={t.text} onChange={e => updateTestimonial(idx,"text",e.target.value)} placeholder="Mon expérience chez BET…" /></div>
                                    </div>
                                  ))}
                                  <button onClick={addTestimonial} type="button" style={{ padding:"9px 0", background:"#f0f9ff", color:"#0369a1", border:"1.5px dashed #7dd3fc", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>＋ Ajouter un témoignage</button>
                                </div>

                                {/* FAQ */}
                                <label style={{ ...lStyle, marginBottom:8 }}>❓ FAQ (onglet "FAQ")</label>
                                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                  {(centreEditData.faq||[]).map((item, idx) => (
                                    <div key={idx} style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"12px 14px" }}>
                                      <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
                                        <div style={{ flex:1 }}><label style={lStyle}>Question</label><input style={{ ...iStyle, fontSize:12 }} value={item.q} onChange={e => updateFaq(idx,"q",e.target.value)} placeholder="Où sont situés les cabinets ?" /></div>
                                        <button onClick={() => removeFaq(idx)} type="button" style={{ padding:"9px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, marginTop:20 }}>🗑️</button>
                                      </div>
                                      <div><label style={lStyle}>Réponse</label><textarea style={{ ...iStyle, fontSize:12, minHeight:52, resize:"vertical" }} value={item.a} onChange={e => updateFaq(idx,"a",e.target.value)} placeholder="Nous avons des centres à Abidjan…" /></div>
                                    </div>
                                  ))}
                                  <button onClick={addFaq} type="button" style={{ padding:"9px 0", background:"#fdf4ff", color:"#7e22ce", border:"1.5px dashed #d8b4fe", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>＋ Ajouter une question FAQ</button>
                                </div>
                              </div>

                              {/* Offres = Formules & Tarifs sur le frontend */}
                              <div>
                                {sectionTitle("📋 Offres disponibles — affiché comme « Formules & Tarifs » sur le site")}
                                <p style={{ fontSize:11, color:"#64748b", marginTop:-6, marginBottom:10 }}>Les offres actives apparaissent dans l'onglet <strong>Formules & Tarifs</strong> de la page Cabinet côté client.</p>
                                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                  {(centreEditData.offres||[]).map(o => (
                                    <div key={o.id} style={{ background:o.actif?"#f0fdf4":"#fafafa", border:`1.5px solid ${o.actif?"#86efac":"#e5e7eb"}`, borderRadius:10, padding:"11px 13px" }}>
                                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:o.actif?10:0 }}>
                                        <button onClick={() => updateOffre(o.id,"actif",!o.actif)} type="button" style={{ width:34, height:20, borderRadius:10, border:"none", cursor:"pointer", flexShrink:0, background:o.actif?"#22c55e":"#d1d5db", position:"relative", transition:"background .2s" }}>
                                          <div style={{ width:14, height:14, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left:o.actif?17:3, transition:"left .2s" }} />
                                        </button>
                                        <input
                                          value={o.label}
                                          onChange={e => updateOffre(o.id,"label",e.target.value)}
                                          style={{ flex:1, padding:"5px 9px", border:"1px solid #e5e7eb", borderRadius:7, fontSize:13, fontWeight:700, color:o.actif?"#166534":"#6b7280", background:"transparent", outline:"none" }}
                                          placeholder="Nom de l'offre"
                                        />
                                        <button onClick={() => removeOffre(o.id)} type="button" title="Supprimer cette offre" style={{ padding:"5px 8px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, cursor:"pointer", fontSize:13, flexShrink:0 }}>🗑️</button>
                                      </div>
                                      {o.actif && (
                                        <>
                                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                                            <div>
                                              <label style={lStyle}>Prix</label>
                                              <input value={o.prix} onChange={e => updateOffre(o.id,"prix",e.target.value)} style={{ ...iStyle, fontSize:12 }} placeholder="30 000 F/mois" />
                                            </div>
                                            <div>
                                              <label style={lStyle}>Durée</label>
                                              <input value={o.duration||""} onChange={e => updateOffre(o.id,"duration",e.target.value)} style={{ ...iStyle, fontSize:12 }} placeholder="Sans engagement" />
                                            </div>
                                          </div>
                                          <textarea value={o.desc} onChange={e => updateOffre(o.id,"desc",e.target.value)} style={{ width:"100%", padding:"6px 10px", border:"1px solid #e2e8f0", borderRadius:7, fontSize:12, resize:"none", minHeight:40, color:"#374151", boxSizing:"border-box" }} placeholder="Description courte affichée sous le prix…" />
                                          {/* Brochure PDF par offre */}
                                          <div style={{ marginTop:8 }}>
                                            <label style={{ fontSize:11, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>📄 Brochure PDF (téléchargeable par le client)</label>
                                            {o.brochure_url ? (
                                              <div style={{ display:"flex", alignItems:"center", gap:8, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:8, padding:"7px 11px" }}>
                                                <span style={{ fontSize:15 }}>📄</span>
                                                <a href={o.brochure_url} target="_blank" rel="noopener noreferrer" style={{ flex:1, fontSize:11, fontWeight:600, color:"#1e3a8a", textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.brochure_nom || "Brochure.pdf"}</a>
                                                <CloudinaryUpload type="document" compact label="Remplacer" onSuccess={f => updateOffre(o.id,"brochure_url",f.url) || updateOffre(o.id,"brochure_nom",f.original_name)} style={{ flexShrink:0 }} />
                                                <button onClick={() => { updateOffre(o.id,"brochure_url",""); updateOffre(o.id,"brochure_nom",""); }} type="button" style={{ width:24, height:24, borderRadius:6, border:"none", background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontSize:12, flexShrink:0 }}>✕</button>
                                              </div>
                                            ) : (
                                              <CloudinaryUpload type="document" label="Uploader la brochure PDF" onSuccess={f => { updateOffre(o.id,"brochure_url",f.url); updateOffre(o.id,"brochure_nom",f.original_name); }} />
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                  <button onClick={addOffre} type="button" style={{ padding:"9px 0", background:"#fffbeb", color:"#92400e", border:"1.5px dashed #fcd34d", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>＋ Ajouter une offre</button>
                                </div>
                              </div>

                              {/* Assistantes WhatsApp */}
                              <div>
                                {sectionTitle("💬 Assistantes WhatsApp (contact client)")}
                                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                  {(centreEditData.assistantes||[]).map((a, idx) => (
                                    <div key={idx} style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"12px 14px" }}>
                                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, alignItems:"end" }}>
                                        <div><label style={lStyle}>Nom</label><input value={a.nom} onChange={e => updateAsst(idx,"nom",e.target.value)} style={{ ...iStyle, fontSize:12 }} /></div>
                                        <div><label style={lStyle}>Téléphone WhatsApp</label><input value={a.phone} onChange={e => updateAsst(idx,"phone",e.target.value)} placeholder="225XXXXXXXXX" style={{ ...iStyle, fontSize:12 }} /></div>
                                        <button onClick={() => removeAsst(idx)} style={{ padding:"9px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, alignSelf:"end" }}>🗑️</button>
                                      </div>
                                      <div style={{ marginTop:8 }}><label style={lStyle}>Message pré-rempli</label><textarea value={a.message} onChange={e => updateAsst(idx,"message",e.target.value)} style={{ ...iStyle, fontSize:12, minHeight:44, resize:"none" }} /></div>
                                    </div>
                                  ))}
                                  <button onClick={addAsst} style={{ padding:"9px 0", background:"#f0fdf4", color:"#166534", border:"1.5px dashed #86efac", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>＋ Ajouter une assistante</button>
                                </div>
                              </div>

                              {/* Commerciales affiliées */}
                              <div>
                                {sectionTitle("👤 Commerciales affiliées à ce centre")}
                                {commercialesAffilies.length === 0 ? (
                                  <p style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic" }}>Aucune commerciale affiliée. Affectez-les depuis Gestion des utilisateurs en assignant le scope "{centreEditData.key}".</p>
                                ) : (
                                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                    {commercialesAffilies.map(u => (
                                      <div key={u.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:10, padding:"10px 14px" }}>
                                        <div style={{ width:34, height:34, borderRadius:"50%", background:BET_LIGHT, color:BET_COLOR, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0 }}>
                                          {((u.prenom||"")[0]||"")}{((u.nom||"")[0]||"")}
                                        </div>
                                        <div style={{ flex:1 }}>
                                          <div style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{u.prenom} {u.nom}</div>
                                          <div style={{ fontSize:11, color:"#64748b" }}>{u.email}</div>
                                        </div>
                                        <span style={{ padding:"3px 8px", borderRadius:20, fontSize:10, fontWeight:700, background:u.actif?"#dcfce7":"#fee2e2", color:u.actif?"#166534":"#991b1b" }}>{u.actif?"Actif":"Inactif"}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* CTA */}
                              <div>
                                {sectionTitle("🔘 Boutons d'action (CTA)")}
                                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                  {[
                                    { key:"rdv",      label:"Prendre RDV",  emoji:"📅", color:"#0891b2" },
                                    { key:"inscrire", label:"S'inscrire",   emoji:"✍️", color:"#22c55e" },
                                    { key:"contact",  label:"Me contacter", emoji:"💬", color:"#f97316" },
                                  ].map(btn => {
                                    const val = centreEditData.cta?.[btn.key] || { actif:true, lien:"" };
                                    return (
                                      <div key={btn.key} style={{ background:val.actif?"#f8fafc":"#fafafa", border:`1.5px solid ${val.actif?btn.color+"55":"#e5e7eb"}`, borderRadius:10, padding:"11px 14px" }}>
                                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:val.actif?8:0 }}>
                                          <button onClick={() => updateCta(btn.key,"actif",!val.actif)} type="button" style={{ width:34, height:20, borderRadius:10, border:"none", cursor:"pointer", flexShrink:0, background:val.actif?"#22c55e":"#d1d5db", position:"relative", transition:"background .2s" }}>
                                            <div style={{ width:14, height:14, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left:val.actif?17:3, transition:"left .2s" }} />
                                          </button>
                                          <span style={{ fontSize:16 }}>{btn.emoji}</span>
                                          <span style={{ fontWeight:700, fontSize:13, color:val.actif?"#0f172a":"#6b7280", flex:1 }}>{btn.label}</span>
                                        </div>
                                        {val.actif && <input value={val.lien} onChange={e => updateCta(btn.key,"lien",e.target.value)} style={{ ...iStyle, fontSize:12, padding:"7px 10px" }} placeholder="Lien (/contact, /parcours/particulier, https://…)" />}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>

                            {/* Footer */}
                            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", padding:"16px 24px", borderTop:"1px solid #f1f5f9", flexShrink:0, background:"#fafafa" }}>
                              <button onClick={closeModal} style={{ padding:"10px 20px", background:"#f1f5f9", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:"#374151" }}>Annuler</button>
                              <button onClick={handleSave} disabled={centresSaving} style={{ padding:"10px 24px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:800, fontSize:13, opacity:centresSaving?.7:1 }}>
                                {centresSaving ? "Enregistrement…" : "💾 Enregistrer & synchroniser"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  {renderOffreMediaPanel("cabinet", BET_COLOR, "Cours en cabinet")}
                  {renderPromoPanel("centres", BET_COLOR)}
                  </div>
                )}

                {/* ── Sous-onglet : Offres En ligne ── */}
                {platformSubTab === "catalogue" && catalogueSubTab === "offres_en_ligne" && (() => {
                  const saveAndSet = async (data) => { setOffresEnLigne(data); await saveOffresEnLigne(data); toast.success("Offres en ligne synchronisées"); };
                  const ICONS = ["👥","👤","🎯","🎓","💻","📱","🌐","⚡","🏆","📋"];
                  return (
                    <div>
                      {/* Header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                        <div>
                          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>💻 Offres En ligne</h3>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Formules affichées sur <code>/cours/en-ligne</code> et dans le parcours d'inscription en ligne.</p>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <a href="/cours/en-ligne" target="_blank" rel="noopener noreferrer" style={{ padding:"8px 14px", background:"#f1f5f9", color:"#374151", borderRadius:8, fontWeight:700, fontSize:12, textDecoration:"none", display:"flex", alignItems:"center", gap:5 }}>🔗 Voir la page</a>
                          <button onClick={() => setOffreEditModal({ mode:"en_ligne", idx:-1, data:{ id:`el_${Date.now()}`, label:"Nouvelle offre", prix:"", duration:"", desc:"", actif:true, icon:"📋" } })}
                            style={{ padding:"8px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>➕ Nouvelle offre</button>
                        </div>
                      </div>
                      {/* Config page Aperçu */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#eff6ff", border:"1.5px solid #bfdbfe", borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color:"#1e3a8a" }}>📄 Contenu de l'onglet "Aperçu"</div>
                          <div style={{ fontSize:11, color:"#3b82f6", marginTop:2 }}>Description, avantages, programme, FAQ affichés sur la page du cours en ligne.</div>
                        </div>
                        <button onClick={() => { setCourseApercuEditModal({ type:"en_ligne", data: JSON.parse(JSON.stringify(courseApercu.en_ligne || {})) }); setCourseApercuSection("general"); }}
                          style={{ padding:"8px 16px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, flexShrink:0 }}>✏️ Modifier</button>
                      </div>
                      {/* Grid */}
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14, marginBottom:20 }}>
                        {offresEnLigne.map((o, idx) => (
                          <div key={o.id} style={{ background:"#fff", borderRadius:14, border:`2px solid ${o.actif ? BET_COLOR+"33" : "#f1f5f9"}`, padding:16, boxShadow:"0 1px 6px rgba(0,0,0,.05)", opacity:o.actif?1:.6 }}>
                            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                              <div style={{ width:40, height:40, borderRadius:10, background:BET_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{o.icon||"📋"}</div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", lineHeight:1.3 }}>{o.label}</div>
                                <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{o.prix}{o.duration ? ` · ${o.duration}` : ""}</div>
                              </div>
                              <span style={{ padding:"3px 8px", borderRadius:20, fontSize:10, fontWeight:700, flexShrink:0, background:o.actif?"#dcfce7":"#fee2e2", color:o.actif?"#166534":"#991b1b" }}>{o.actif?"Actif":"Inactif"}</span>
                            </div>
                            {o.desc && <div style={{ fontSize:12, color:"#475569", lineHeight:1.5, marginBottom:12, minHeight:36 }}>{o.desc}</div>}
                            <div style={{ display:"flex", gap:6 }}>
                              <button onClick={() => setOffreEditModal({ mode:"en_ligne", idx, data:{...o} })} style={{ flex:1, padding:"7px 0", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:11 }}>✏️ Modifier</button>
                              <button onClick={() => { const u=[...offresEnLigne]; u[idx]={...u[idx],actif:!u[idx].actif}; saveAndSet(u); }}
                                style={{ padding:"7px 10px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:11 }} title={o.actif?"Désactiver":"Activer"}>{o.actif?"⏸":"▶️"}</button>
                              <button onClick={() => { if(!window.confirm(`Supprimer "${o.label}" ?`)) return; saveAndSet(offresEnLigne.filter((_,i)=>i!==idx)); }}
                                style={{ padding:"7px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:11 }}>🗑️</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Modal édition offre en ligne */}
                      {offreEditModal?.mode === "en_ligne" && (
                        <div onClick={e => { if(e.target===e.currentTarget) setOffreEditModal(null); }}
                          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                          <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:480, boxShadow:"0 24px 60px rgba(0,0,0,.25)", overflow:"hidden" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 24px", borderBottom:"1px solid #f1f5f9" }}>
                              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a", flex:1 }}>{offreEditModal.idx === -1 ? "➕ Nouvelle offre en ligne" : "✏️ Modifier l'offre"}</h3>
                              <button onClick={() => setOffreEditModal(null)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#f1f5f9", cursor:"pointer", fontSize:16, color:"#64748b" }}>✕</button>
                            </div>
                            <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:12 }}>
                              <div>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Icône</label>
                                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                  {ICONS.map(ic => <button key={ic} onClick={() => setOffreEditModal(m => ({...m, data:{...m.data, icon:ic}}))} style={{ width:34, height:34, borderRadius:8, border:`2px solid ${offreEditModal.data.icon===ic ? BET_COLOR : "#e5e7eb"}`, background:offreEditModal.data.icon===ic ? BET_LIGHT : "#fff", fontSize:18, cursor:"pointer" }}>{ic}</button>)}
                                </div>
                              </div>
                              {[
                                { field:"label",    label:"Intitulé *",     placeholder:"Ex : Coaching de groupe" },
                                { field:"prix",     label:"Prix",           placeholder:"Ex : 25 000 F/mois" },
                                { field:"duration", label:"Durée",          placeholder:"Ex : Sans engagement" },
                              ].map(f => (
                                <div key={f.field}>
                                  <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{f.label}</label>
                                  <input value={offreEditModal.data[f.field]||""} onChange={e => setOffreEditModal(m => ({...m, data:{...m.data, [f.field]:e.target.value}}))}
                                    placeholder={f.placeholder} style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                                </div>
                              ))}
                              <div>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Description</label>
                                <textarea value={offreEditModal.data.desc||""} onChange={e => setOffreEditModal(m => ({...m, data:{...m.data, desc:e.target.value}}))}
                                  placeholder="Courte description visible par le client…" rows={3}
                                  style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box", resize:"vertical" }} />
                              </div>
                              <div>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>📄 Brochure PDF</label>
                                {offreEditModal.data.brochure_url ? (
                                  <div style={{ display:"flex", alignItems:"center", gap:8, background:"#eff6ff", border:"1.5px solid #bae6fd", borderRadius:8, padding:"8px 12px" }}>
                                    <span style={{ fontSize:16 }}>📄</span>
                                    <a href={offreEditModal.data.brochure_url} target="_blank" rel="noopener noreferrer" style={{ flex:1, fontSize:12, fontWeight:600, color:BET_COLOR, textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{offreEditModal.data.brochure_nom || "Brochure.pdf"}</a>
                                    <CloudinaryUpload type="document" compact label="Remplacer" onSuccess={f => setOffreEditModal(m => ({...m, data:{...m.data, brochure_url:f.url, brochure_nom:f.original_name}}))} style={{ flexShrink:0 }} />
                                    <button onClick={() => setOffreEditModal(m => ({...m, data:{...m.data, brochure_url:"", brochure_nom:""}}))} style={{ width:26, height:26, borderRadius:6, border:"none", background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontSize:13, flexShrink:0 }}>✕</button>
                                  </div>
                                ) : (
                                  <CloudinaryUpload type="document" label="Uploader la brochure PDF" onSuccess={f => setOffreEditModal(m => ({...m, data:{...m.data, brochure_url:f.url, brochure_nom:f.original_name}}))} />
                                )}
                              </div>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151" }}>Actif</label>
                                <input type="checkbox" checked={!!offreEditModal.data.actif} onChange={e => setOffreEditModal(m => ({...m, data:{...m.data, actif:e.target.checked}}))} style={{ width:16, height:16, accentColor:BET_COLOR, cursor:"pointer" }} />
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", padding:"14px 24px", borderTop:"1px solid #f1f5f9", background:"#fafafa" }}>
                              <button onClick={() => setOffreEditModal(null)} style={{ padding:"9px 18px", background:"#f1f5f9", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:"#374151" }}>Annuler</button>
                              <button onClick={() => {
                                if (!offreEditModal.data.label?.trim()) { toast.error("Intitulé requis"); return; }
                                let u;
                                if (offreEditModal.idx === -1) { u = [...offresEnLigne, offreEditModal.data]; }
                                else { u = offresEnLigne.map((o,i) => i === offreEditModal.idx ? offreEditModal.data : o); }
                                saveAndSet(u); setOffreEditModal(null);
                              }} style={{ padding:"9px 22px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:800, fontSize:13 }}>💾 Enregistrer</button>
                            </div>
                          </div>
                        </div>
                      )}
                      {renderOffreMediaPanel("en-ligne", BET_COLOR, "Cours en ligne")}
                      {renderPromoPanel("en_ligne", BET_COLOR)}
                    </div>
                  );
                })()}

                {/* ── Sous-onglet : Offres À domicile ── */}
                {platformSubTab === "catalogue" && catalogueSubTab === "offres_domicile" && (() => {
                  const saveAndSet = async (data) => { setOffresDomicile(data); await saveOffresDomicile(data); toast.success("Offres à domicile synchronisées"); };
                  const ICONS = ["🏠","👧","👥","👤","🎯","🎓","⭐","🏆","📋","✨"];
                  return (
                    <div>
                      {/* Header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                        <div>
                          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>🏠 Offres À domicile</h3>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Formules affichées sur <code>/cours/domicile</code> — un coach se déplace chez le client.</p>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <a href="/cours/domicile" target="_blank" rel="noopener noreferrer" style={{ padding:"8px 14px", background:"#f1f5f9", color:"#374151", borderRadius:8, fontWeight:700, fontSize:12, textDecoration:"none", display:"flex", alignItems:"center", gap:5 }}>🔗 Voir la page</a>
                          <button onClick={() => setOffreEditModal({ mode:"domicile", idx:-1, data:{ id:`dom_${Date.now()}`, label:"Nouvelle offre", prix:"Sur devis", duration:"Sur mesure", desc:"", actif:true, icon:"🏠" } })}
                            style={{ padding:"8px 16px", background:"#059669", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>➕ Nouvelle offre</button>
                        </div>
                      </div>
                      {/* Config page Aperçu */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color:"#14532d" }}>📄 Contenu de l'onglet "Aperçu"</div>
                          <div style={{ fontSize:11, color:"#059669", marginTop:2 }}>Description, avantages, programme, FAQ affichés sur la page du cours à domicile.</div>
                        </div>
                        <button onClick={() => { setCourseApercuEditModal({ type:"domicile", data: JSON.parse(JSON.stringify(courseApercu.domicile || {})) }); setCourseApercuSection("general"); }}
                          style={{ padding:"8px 16px", background:"#059669", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, flexShrink:0 }}>✏️ Modifier</button>
                      </div>
                      {/* Grid */}
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14, marginBottom:20 }}>
                        {offresDomicile.map((o, idx) => (
                          <div key={o.id} style={{ background:"#fff", borderRadius:14, border:`2px solid ${o.actif ? "#05996933" : "#f1f5f9"}`, padding:16, boxShadow:"0 1px 6px rgba(0,0,0,.05)", opacity:o.actif?1:.6 }}>
                            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                              <div style={{ width:40, height:40, borderRadius:10, background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{o.icon||"🏠"}</div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", lineHeight:1.3 }}>{o.label}</div>
                                <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{o.prix}{o.duration ? ` · ${o.duration}` : ""}</div>
                              </div>
                              <span style={{ padding:"3px 8px", borderRadius:20, fontSize:10, fontWeight:700, flexShrink:0, background:o.actif?"#dcfce7":"#fee2e2", color:o.actif?"#166534":"#991b1b" }}>{o.actif?"Actif":"Inactif"}</span>
                            </div>
                            {o.desc && <div style={{ fontSize:12, color:"#475569", lineHeight:1.5, marginBottom:12, minHeight:36 }}>{o.desc}</div>}
                            <div style={{ display:"flex", gap:6 }}>
                              <button onClick={() => setOffreEditModal({ mode:"domicile", idx, data:{...o} })} style={{ flex:1, padding:"7px 0", background:"#059669", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:11 }}>✏️ Modifier</button>
                              <button onClick={() => { const u=[...offresDomicile]; u[idx]={...u[idx],actif:!u[idx].actif}; saveAndSet(u); }}
                                style={{ padding:"7px 10px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:11 }} title={o.actif?"Désactiver":"Activer"}>{o.actif?"⏸":"▶️"}</button>
                              <button onClick={() => { if(!window.confirm(`Supprimer "${o.label}" ?`)) return; saveAndSet(offresDomicile.filter((_,i)=>i!==idx)); }}
                                style={{ padding:"7px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:11 }}>🗑️</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Note pédagogique */}
                      <div style={{ display:"flex", gap:10, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"12px 16px" }}>
                        <span style={{ flexShrink:0 }}>💡</span>
                        <p style={{ margin:0, fontSize:12, color:"#166534", lineHeight:1.6 }}>
                          Les cours à domicile sont gérés par un <strong>Responsable pédagogique</strong> qui contacte le client sous 24–48h après sa demande. Les offres affichées ici sont indicatives.
                        </p>
                      </div>
                      {/* Modal édition offre domicile */}
                      {offreEditModal?.mode === "domicile" && (
                        <div onClick={e => { if(e.target===e.currentTarget) setOffreEditModal(null); }}
                          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                          <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:480, boxShadow:"0 24px 60px rgba(0,0,0,.25)", overflow:"hidden" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 24px", borderBottom:"1px solid #f1f5f9" }}>
                              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a", flex:1 }}>{offreEditModal.idx === -1 ? "➕ Nouvelle offre à domicile" : "✏️ Modifier l'offre"}</h3>
                              <button onClick={() => setOffreEditModal(null)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#f1f5f9", cursor:"pointer", fontSize:16, color:"#64748b" }}>✕</button>
                            </div>
                            <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:12 }}>
                              <div>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Icône</label>
                                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                  {ICONS.map(ic => <button key={ic} onClick={() => setOffreEditModal(m => ({...m, data:{...m.data, icon:ic}}))} style={{ width:34, height:34, borderRadius:8, border:`2px solid ${offreEditModal.data.icon===ic ? "#059669" : "#e5e7eb"}`, background:offreEditModal.data.icon===ic ? "#f0fdf4" : "#fff", fontSize:18, cursor:"pointer" }}>{ic}</button>)}
                                </div>
                              </div>
                              {[
                                { field:"label",    label:"Intitulé *",     placeholder:"Ex : Cours privé à domicile" },
                                { field:"prix",     label:"Prix",           placeholder:"Ex : Sur devis" },
                                { field:"duration", label:"Durée",          placeholder:"Ex : Sur mesure" },
                              ].map(f => (
                                <div key={f.field}>
                                  <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{f.label}</label>
                                  <input value={offreEditModal.data[f.field]||""} onChange={e => setOffreEditModal(m => ({...m, data:{...m.data, [f.field]:e.target.value}}))}
                                    placeholder={f.placeholder} style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                                </div>
                              ))}
                              <div>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Description</label>
                                <textarea value={offreEditModal.data.desc||""} onChange={e => setOffreEditModal(m => ({...m, data:{...m.data, desc:e.target.value}}))}
                                  placeholder="Courte description visible par le client…" rows={3}
                                  style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box", resize:"vertical" }} />
                              </div>
                              <div>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>📄 Brochure PDF</label>
                                {offreEditModal.data.brochure_url ? (
                                  <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:8, padding:"8px 12px" }}>
                                    <span style={{ fontSize:16 }}>📄</span>
                                    <a href={offreEditModal.data.brochure_url} target="_blank" rel="noopener noreferrer" style={{ flex:1, fontSize:12, fontWeight:600, color:"#059669", textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{offreEditModal.data.brochure_nom || "Brochure.pdf"}</a>
                                    <CloudinaryUpload type="document" compact label="Remplacer" onSuccess={f => setOffreEditModal(m => ({...m, data:{...m.data, brochure_url:f.url, brochure_nom:f.original_name}}))} style={{ flexShrink:0 }} />
                                    <button onClick={() => setOffreEditModal(m => ({...m, data:{...m.data, brochure_url:"", brochure_nom:""}}))} style={{ width:26, height:26, borderRadius:6, border:"none", background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontSize:13, flexShrink:0 }}>✕</button>
                                  </div>
                                ) : (
                                  <CloudinaryUpload type="document" label="Uploader la brochure PDF" onSuccess={f => setOffreEditModal(m => ({...m, data:{...m.data, brochure_url:f.url, brochure_nom:f.original_name}}))} />
                                )}
                              </div>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <label style={{ fontSize:12, fontWeight:600, color:"#374151" }}>Actif</label>
                                <input type="checkbox" checked={!!offreEditModal.data.actif} onChange={e => setOffreEditModal(m => ({...m, data:{...m.data, actif:e.target.checked}}))} style={{ width:16, height:16, accentColor:"#059669", cursor:"pointer" }} />
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", padding:"14px 24px", borderTop:"1px solid #f1f5f9", background:"#fafafa" }}>
                              <button onClick={() => setOffreEditModal(null)} style={{ padding:"9px 18px", background:"#f1f5f9", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:"#374151" }}>Annuler</button>
                              <button onClick={() => {
                                if (!offreEditModal.data.label?.trim()) { toast.error("Intitulé requis"); return; }
                                let u;
                                if (offreEditModal.idx === -1) { u = [...offresDomicile, offreEditModal.data]; }
                                else { u = offresDomicile.map((o,i) => i === offreEditModal.idx ? offreEditModal.data : o); }
                                saveAndSet(u); setOffreEditModal(null);
                              }} style={{ padding:"9px 22px", background:"#059669", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:800, fontSize:13 }}>💾 Enregistrer</button>
                            </div>
                          </div>
                        </div>
                      )}
                      {renderOffreMediaPanel("domicile", "#059669", "Cours à domicile")}
                      {renderPromoPanel("domicile", "#059669")}
                    </div>
                  );
                })()}

                {/* ── Sous-onglet : Certifications ── */}
                {platformSubTab === "catalogue" && catalogueSubTab === "certifications" && (() => {
                  const CERT_KEYS = ["toeic","ielts","toefl"];
                  const CERT_META = {
                    toeic:{ color:"#1e3a8a", bg:"#eff6ff", route:"/certifications/toeic" },
                    ielts:{ color:"#dc2626", bg:"#fef2f2", route:"/certifications/ielts" },
                    toefl:{ color:"#059669", bg:"#f0fdf4", route:"/certifications/toefl" },
                  };
                  return (
                    <div>
                      {/* Header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                        <div>
                          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>🏆 Certifications</h3>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>
                            Contenu des pages TOEIC, IELTS et TOEFL affichées sur le site web.
                          </p>
                        </div>
                      </div>
                      {/* 3 cartes certifications */}
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
                        {CERT_KEYS.map(k => {
                          const c = certifConfig[k] || {};
                          const m = CERT_META[k];
                          return (
                            <div key={k} style={{ background:"#fff", borderRadius:16, border:`2px solid ${m.color}22`, overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,.06)" }}>
                              {c.heroImage && (
                                <img src={c.heroImage} alt={k} style={{ width:"100%", height:72, objectFit:"cover", display:"block" }} />
                              )}
                              <div style={{ padding:"14px 16px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                                  <span style={{ fontWeight:900, fontSize:18, color:m.color }}>{c.name}</span>
                                  <span style={{ fontSize:10, fontWeight:700, background:m.bg, color:m.color, borderRadius:999, padding:"2px 8px" }}>Officiel</span>
                                </div>
                                <div style={{ fontSize:11, color:"#64748b", marginBottom:4, lineHeight:1.4 }}>{c.fullName}</div>
                                <div style={{ fontSize:13, fontWeight:800, color:"#0f172a", marginBottom:4 }}>{c.price}</div>
                                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12 }}>
                                  {c.level && <span style={{ fontSize:10, fontWeight:700, background:"#f1f5f9", color:"#475569", borderRadius:4, padding:"2px 7px" }}>📊 {c.level}</span>}
                                  {c.duration && <span style={{ fontSize:10, fontWeight:700, background:"#f1f5f9", color:"#475569", borderRadius:4, padding:"2px 7px" }}>⏱ {c.duration}</span>}
                                </div>
                                <div style={{ display:"flex", gap:6 }}>
                                  <button onClick={() => { setCertifEditModal({ key:k, data:JSON.parse(JSON.stringify(certifConfig[k]||DEFAULT_CERTIF_CONFIG[k])) }); setCertifEditSection("general"); }}
                                    style={{ flex:1, padding:"8px 0", background:m.color, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                                    ✏️ Modifier
                                  </button>
                                  <a href={m.route} target="_blank" rel="noopener noreferrer"
                                    style={{ padding:"8px 10px", background:"#f1f5f9", color:"#374151", borderRadius:8, fontWeight:700, fontSize:11, textDecoration:"none", display:"flex", alignItems:"center" }}>
                                    🔗
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Info */}
                      <div style={{ display:"flex", gap:10, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"12px 16px" }}>
                        <span style={{ flexShrink:0 }}>💡</span>
                        <p style={{ margin:0, fontSize:12, color:"#92400e", lineHeight:1.6 }}>
                          Les modifications sont enregistrées en <strong>localStorage</strong> et synchronisées avec Supabase. Elles sont visibles immédiatement sur le site web.
                        </p>
                      </div>
                      {/* Modal édition certification */}
                      {certifEditModal && (
                        <div onClick={e => { if(e.target===e.currentTarget) setCertifEditModal(null); }}
                          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                          <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:680, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 60px rgba(0,0,0,.25)" }}>
                            {/* Modal header */}
                            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 24px", borderBottom:"1px solid #f1f5f9", flexShrink:0 }}>
                              <span style={{ fontSize:20 }}>🏆</span>
                              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a", flex:1 }}>
                                {certifConfig[certifEditModal.key]?.name || certifEditModal.key.toUpperCase()} — Configuration
                              </h3>
                              <button onClick={() => setCertifEditModal(null)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#f1f5f9", cursor:"pointer", fontSize:16, color:"#64748b" }}>✕</button>
                            </div>
                            {/* Section tabs */}
                            <div style={{ display:"flex", borderBottom:"1px solid #f1f5f9", overflowX:"auto", flexShrink:0 }}>
                              {[
                                {key:"general",    label:"Général"},
                                {key:"prix",       label:"Prix & Stats"},
                                {key:"contenu",    label:"Contenu"},
                                {key:"examen",     label:"Examen"},
                                {key:"programme",  label:"Programme"},
                                {key:"faq",        label:"FAQ"},
                              ].map(s => (
                                <button key={s.key} onClick={() => setCertifEditSection(s.key)}
                                  style={{ padding:"10px 16px", border:"none", background:"none", cursor:"pointer", fontWeight:certifEditSection===s.key?800:500, fontSize:12, color:certifEditSection===s.key?"#1e3a8a":"#64748b", borderBottom:certifEditSection===s.key?"2px solid #1e3a8a":"2px solid transparent", whiteSpace:"nowrap", transition:"all .15s" }}>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                            {/* Section content */}
                            <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                              {certifEditSection === "general" && (<>
                                <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Nom complet (fullName)" field="fullName" placeholder="Ex : Test of English for International Communication" />
                                <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Accroche (tagline)" field="tagline" placeholder="Ex : La certification n°1 en entreprise" />
                                <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Image héro (URL)" field="heroImage" placeholder="https://..." />
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Niveau" field="level" placeholder="Ex : B1 → C1" />
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Durée de préparation" field="duration" placeholder="Ex : 6 semaines" />
                                </div>
                                <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Description" field="description" placeholder="À propos de la certification…" multiline />
                                <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Pourquoi choisir BET ?" field="whyChoose" placeholder="Texte affiché dans l'encart bleu…" multiline />
                              </>)}
                              {certifEditSection === "prix" && (<>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Prix affiché" field="price" placeholder="Ex : 390 000 FCFA" />
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Ancien prix (barré)" field="oldPrice" placeholder="Ex : 500 000 FCFA" />
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Réduction" field="discount" placeholder="Ex : 22%" />
                                </div>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Note (ex: 4.9)" field="rating" type="number" placeholder="4.9" />
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Nb d'avis" field="ratingCount" type="number" placeholder="1248" />
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Nb de certifiés" field="students" type="number" placeholder="5200" />
                                </div>
                              </>)}
                              {certifEditSection === "contenu" && (<>
                                <div>
                                  <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>✅ Ce que vous apprendrez</label>
                                  <CertifStringList modal={certifEditModal} setModal={setCertifEditModal} field="whatYouLearn" placeholder="Ex : Maîtriser le Listening" />
                                </div>
                                <div>
                                  <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>🎯 Avantages (Pourquoi passer cette certification ?)</label>
                                  <CertifStringList modal={certifEditModal} setModal={setCertifEditModal} field="benefits" placeholder="Ex : Reconnu par 14 000 entreprises" />
                                </div>
                                <div>
                                  <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>📦 Ce que comprend la préparation (includes)</label>
                                  <CertifObjList modal={certifEditModal} setModal={setCertifEditModal} field="includes" fields={[{key:"icon",label:"Icône (emoji)"},{key:"label",label:"Libellé"}]} />
                                </div>
                              </>)}
                              {certifEditSection === "examen" && (<>
                                <p style={{ margin:0, fontSize:12, color:"#64748b" }}>Sections de l'examen officiel (structure affichée sur la page)</p>
                                <CertifObjList modal={certifEditModal} setModal={setCertifEditModal} field="examStructure" fields={[
                                  {key:"section",   label:"Section"},
                                  {key:"duration",  label:"Durée"},
                                  {key:"questions", label:"Questions / Tâches"},
                                  {key:"desc",      label:"Description", multiline:true},
                                ]} />
                              </>)}
                              {certifEditSection === "programme" && (<>
                                <p style={{ margin:0, fontSize:12, color:"#64748b" }}>Statistiques du programme de préparation</p>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Nombre de semaines" field="weeks" path="preparationProgram" type="number" placeholder="6" />
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Heures / semaine" field="hoursPerWeek" path="preparationProgram" type="number" placeholder="8" />
                                  <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Nombre de sessions" field="sessions" path="preparationProgram" type="number" placeholder="48" />
                                </div>
                                <CertifFieldInput modal={certifEditModal} setModal={setCertifEditModal} label="Détails du programme" field="details" path="preparationProgram" placeholder="Description détaillée du déroulé…" multiline />
                              </>)}
                              {certifEditSection === "faq" && (<>
                                <p style={{ margin:0, fontSize:12, color:"#64748b" }}>Questions fréquentes affichées sur la page</p>
                                <CertifObjList modal={certifEditModal} setModal={setCertifEditModal} field="faq" fields={[
                                  {key:"q",label:"Question"},
                                  {key:"a",label:"Réponse",multiline:true},
                                ]} />
                              </>)}
                            </div>
                            {/* Footer */}
                            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", padding:"14px 24px", borderTop:"1px solid #f1f5f9", background:"#fafafa", flexShrink:0 }}>
                              <button onClick={() => setCertifEditModal(null)} style={{ padding:"9px 18px", background:"#f1f5f9", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:"#374151" }}>Annuler</button>
                              <button onClick={async () => {
                                const updated = { ...certifConfig, [certifEditModal.key]: certifEditModal.data };
                                setCertifConfig(updated);
                                await saveCertifConfig(updated);
                                toast.success(`${certifEditModal.data.name || certifEditModal.key.toUpperCase()} mis à jour`);
                                setCertifEditModal(null);
                              }} style={{ padding:"9px 22px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:800, fontSize:13 }}>💾 Enregistrer</button>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Sélecteur certif pour les médias */}
                      <div style={{ marginTop:28, borderTop:"1.5px dashed #e2e8f0", paddingTop:20 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                          <span style={{ fontSize:16 }}>🎬</span>
                          <div>
                            <h4 style={{ margin:0, fontSize:13, fontWeight:800, color:"#0f172a" }}>Vidéo / image de présentation par certification</h4>
                            <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>Choisissez la certification pour configurer son média hero.</p>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
                          {[{key:"toeic",label:"TOEIC",color:"#1e3a8a"},{key:"toefl",label:"TOEFL",color:"#059669"},{key:"ielts",label:"IELTS",color:"#dc2626"}].map(c => (
                            <button key={c.key} onClick={() => setOffreMediaType(c.key)} style={{
                              padding:"6px 16px", borderRadius:20, border:`2px solid ${(offreMediaType||"toeic")===c.key ? c.color : "#e5e7eb"}`,
                              background:(offreMediaType||"toeic")===c.key ? c.color+"18" : "#f8fafc",
                              color:(offreMediaType||"toeic")===c.key ? c.color : "#64748b",
                              fontWeight:800, fontSize:12, cursor:"pointer", transition:"all .15s",
                            }}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {renderOffreMediaPanel(offreMediaType || "toeic", ["toeic","toefl","ielts"].includes(offreMediaType) ? {toeic:"#1e3a8a",toefl:"#059669",ielts:"#dc2626"}[offreMediaType] : "#1e3a8a", (offreMediaType||"toeic").toUpperCase())}
                      {renderPromoPanel("certifications", "#1e3a8a")}
                    </div>
                  );
                })()}

                {/* ── Sous-onglet : Interprétariat ── */}
                {platformSubTab === "catalogue" && catalogueSubTab === "interpretariat" && (() => {
                  const svc = serviceInterp;
                  const color = "#059669";
                  const renderServicePanel = (svcData, setSvcData, saveSvc, svcKey) => {
                    const addDetail = () => setSvcData(s => ({ ...s, details: [...(s.details||[]), { icon:"📌", label:"", val:"" }] }));
                    const updDetail = (i, field, val) => setSvcData(s => ({ ...s, details: s.details.map((d,idx) => idx===i ? {...d,[field]:val} : d) }));
                    const delDetail = (i) => setSvcData(s => ({ ...s, details: s.details.filter((_,idx) => idx!==i) }));
                    const addPlan   = () => setSvcData(s => ({ ...s, plans: [...(s.plans||[]), { nom:"", prix:"Sur devis", detail:"", popular:false }] }));
                    const updPlan   = (i, field, val) => setSvcData(s => ({ ...s, plans: s.plans.map((p,idx) => idx===i ? {...p,[field]:val} : p) }));
                    const delPlan   = (i) => setSvcData(s => ({ ...s, plans: s.plans.filter((_,idx) => idx!==i) }));
                    return (
                      <div>
                        {/* Description & Tagline */}
                        <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:18 }}>
                          <div style={{ fontWeight:800, fontSize:14, color:"#0f172a", marginBottom:14 }}>📝 Informations générales</div>
                          <div style={{ marginBottom:12 }}>
                            <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Tagline (sous-titre)</label>
                            <input value={svcData.tagline||""} onChange={e => setSvcData(s=>({...s,tagline:e.target.value}))}
                              style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                          </div>
                          <div>
                            <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Description</label>
                            <textarea value={svcData.description||""} onChange={e => setSvcData(s=>({...s,description:e.target.value}))}
                              rows={3} style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }} />
                          </div>
                        </div>
                        {/* Details */}
                        <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:18 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                            <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>📊 Points clés (détails)</div>
                            <button onClick={addDetail} style={{ padding:"6px 14px", background:color, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>➕ Ajouter</button>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                            {(svcData.details||[]).map((d, i) => (
                              <div key={i} style={{ display:"grid", gridTemplateColumns:"60px 1fr 1fr auto", gap:8, alignItems:"center" }}>
                                <input value={d.icon} onChange={e=>updDetail(i,"icon",e.target.value)} placeholder="🎤" style={{ padding:"7px 8px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:18, textAlign:"center", boxSizing:"border-box" }} />
                                <input value={d.label} onChange={e=>updDetail(i,"label",e.target.value)} placeholder="Label" style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
                                <input value={d.val} onChange={e=>updDetail(i,"val",e.target.value)} placeholder="Valeur" style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
                                <button onClick={()=>delDetail(i)} style={{ padding:"7px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>🗑</button>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Plans */}
                        <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:18 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                            <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>💼 Formules / Tarifs</div>
                            <button onClick={addPlan} style={{ padding:"6px 14px", background:color, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>➕ Ajouter</button>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                            {(svcData.plans||[]).map((p, i) => (
                              <div key={i} style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"12px 14px" }}>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, marginBottom:8 }}>
                                  <input value={p.nom} onChange={e=>updPlan(i,"nom",e.target.value)} placeholder="Nom de la formule"
                                    style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
                                  <input value={p.prix} onChange={e=>updPlan(i,"prix",e.target.value)} placeholder="Prix"
                                    style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
                                  <button onClick={()=>delPlan(i)} style={{ padding:"7px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>🗑</button>
                                </div>
                                <input value={p.detail} onChange={e=>updPlan(i,"detail",e.target.value)} placeholder="Détail (ex: Jusqu'à 4h · 1 interprète)"
                                  style={{ width:"100%", padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box", marginBottom:6 }} />
                                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, fontWeight:600, color:"#374151", cursor:"pointer" }}>
                                  <input type="checkbox" checked={!!p.popular} onChange={e=>updPlan(i,"popular",e.target.checked)} style={{ width:15, height:15 }} />
                                  Populaire (badge affiché)
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Save */}
                        <button onClick={async () => { await saveSvc(svcData); toast.success("Service mis à jour !"); }}
                          style={{ padding:"10px 28px", background:color, color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:800, fontSize:14 }}>
                          💾 Enregistrer les modifications
                        </button>
                      </div>
                    );
                  };
                  return (
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                        <div>
                          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>🌍 Interprétariat</h3>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Contenu affiché dans "Nos offres" → Interprétariat de la navbar.</p>
                        </div>
                      </div>
                      {/* Aperçu navbar */}
                      <div style={{ background:`#f0fdf4`, border:`2px solid #059669`, borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", gap:14, alignItems:"flex-start" }}>
                        <div style={{ width:52, height:52, borderRadius:12, background:"#05966918", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>🌍</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>Interprétariat</div>
                          <div style={{ fontSize:12, color:"#059669", fontWeight:600, marginTop:2 }}>{svc.tagline}</div>
                          <div style={{ fontSize:12, color:"#475569", marginTop:4, lineHeight:1.5 }}>{(svc.description||"").slice(0,100)}…</div>
                          <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{(svc.plans||[]).length} formule(s)</div>
                        </div>
                      </div>
                      {renderServicePanel(serviceInterp, setServiceInterp, saveServiceInterp, "interpretariat")}
                    </div>
                  );
                })()}

                {/* ── Sous-onglet : Traduction ── */}
                {platformSubTab === "catalogue" && catalogueSubTab === "traduction" && (() => {
                  const svc = serviceTrad;
                  const color = "#dc2626";
                  const renderServicePanel = (svcData, setSvcData, saveSvc, svcKey) => {
                    const addDetail = () => setSvcData(s => ({ ...s, details: [...(s.details||[]), { icon:"📌", label:"", val:"" }] }));
                    const updDetail = (i, field, val) => setSvcData(s => ({ ...s, details: s.details.map((d,idx) => idx===i ? {...d,[field]:val} : d) }));
                    const delDetail = (i) => setSvcData(s => ({ ...s, details: s.details.filter((_,idx) => idx!==i) }));
                    const addPlan   = () => setSvcData(s => ({ ...s, plans: [...(s.plans||[]), { nom:"", prix:"Sur devis", detail:"", popular:false }] }));
                    const updPlan   = (i, field, val) => setSvcData(s => ({ ...s, plans: s.plans.map((p,idx) => idx===i ? {...p,[field]:val} : p) }));
                    const delPlan   = (i) => setSvcData(s => ({ ...s, plans: s.plans.filter((_,idx) => idx!==i) }));
                    return (
                      <div>
                        <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:18 }}>
                          <div style={{ fontWeight:800, fontSize:14, color:"#0f172a", marginBottom:14 }}>📝 Informations générales</div>
                          <div style={{ marginBottom:12 }}>
                            <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Tagline (sous-titre)</label>
                            <input value={svcData.tagline||""} onChange={e => setSvcData(s=>({...s,tagline:e.target.value}))}
                              style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                          </div>
                          <div>
                            <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Description</label>
                            <textarea value={svcData.description||""} onChange={e => setSvcData(s=>({...s,description:e.target.value}))}
                              rows={3} style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }} />
                          </div>
                        </div>
                        <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:18 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                            <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>📊 Points clés (détails)</div>
                            <button onClick={addDetail} style={{ padding:"6px 14px", background:color, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>➕ Ajouter</button>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                            {(svcData.details||[]).map((d, i) => (
                              <div key={i} style={{ display:"grid", gridTemplateColumns:"60px 1fr 1fr auto", gap:8, alignItems:"center" }}>
                                <input value={d.icon} onChange={e=>updDetail(i,"icon",e.target.value)} placeholder="📄" style={{ padding:"7px 8px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:18, textAlign:"center", boxSizing:"border-box" }} />
                                <input value={d.label} onChange={e=>updDetail(i,"label",e.target.value)} placeholder="Label" style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
                                <input value={d.val} onChange={e=>updDetail(i,"val",e.target.value)} placeholder="Valeur" style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
                                <button onClick={()=>delDetail(i)} style={{ padding:"7px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>🗑</button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:18 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                            <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>💼 Formules / Tarifs</div>
                            <button onClick={addPlan} style={{ padding:"6px 14px", background:color, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>➕ Ajouter</button>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                            {(svcData.plans||[]).map((p, i) => (
                              <div key={i} style={{ background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:10, padding:"12px 14px" }}>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, marginBottom:8 }}>
                                  <input value={p.nom} onChange={e=>updPlan(i,"nom",e.target.value)} placeholder="Nom de la formule"
                                    style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
                                  <input value={p.prix} onChange={e=>updPlan(i,"prix",e.target.value)} placeholder="Prix"
                                    style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box" }} />
                                  <button onClick={()=>delPlan(i)} style={{ padding:"7px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>🗑</button>
                                </div>
                                <input value={p.detail} onChange={e=>updPlan(i,"detail",e.target.value)} placeholder="Détail (ex: 3-5 jours ouvrés)"
                                  style={{ width:"100%", padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, boxSizing:"border-box", marginBottom:6 }} />
                                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, fontWeight:600, color:"#374151", cursor:"pointer" }}>
                                  <input type="checkbox" checked={!!p.popular} onChange={e=>updPlan(i,"popular",e.target.checked)} style={{ width:15, height:15 }} />
                                  Populaire (badge affiché)
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button onClick={async () => { await saveSvc(svcData); toast.success("Service mis à jour !"); }}
                          style={{ padding:"10px 28px", background:color, color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:800, fontSize:14 }}>
                          💾 Enregistrer les modifications
                        </button>
                      </div>
                    );
                  };
                  return (
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                        <div>
                          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>📄 Traduction</h3>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Contenu affiché dans "Nos offres" → Traduction de la navbar.</p>
                        </div>
                      </div>
                      <div style={{ background:`#fef2f2`, border:`2px solid #dc2626`, borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", gap:14, alignItems:"flex-start" }}>
                        <div style={{ width:52, height:52, borderRadius:12, background:"#dc262618", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>📄</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>Traduction</div>
                          <div style={{ fontSize:12, color:"#dc2626", fontWeight:600, marginTop:2 }}>{svc.tagline}</div>
                          <div style={{ fontSize:12, color:"#475569", marginTop:4, lineHeight:1.5 }}>{(svc.description||"").slice(0,100)}…</div>
                          <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{(svc.plans||[]).length} formule(s)</div>
                        </div>
                      </div>
                      {renderServicePanel(serviceTrad, setServiceTrad, saveServiceTrad, "traduction")}
                    </div>
                  );
                })()}

          {/* ════ MODAL APERÇU COURS ════ */}
          {courseApercuEditModal && (() => {
            const type = courseApercuEditModal.type;
            const accentColor = type === "en_ligne" ? "#1e3a8a" : "#059669";
            const label = type === "en_ligne" ? "Cours en ligne" : "Cours à domicile";
            const tabs = [
              { key:"general",       label:"Général" },
              { key:"avantages",     label:"Avantages" },
              { key:"programme",     label:"Programme" },
              { key:"inclus",        label:"Inclus" },
              { key:"prerequis",     label:"Prérequis" },
              { key:"faq",           label:"FAQ" },
            ];
            return (
              <div onClick={e => { if(e.target===e.currentTarget) setCourseApercuEditModal(null); }}
                style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:680, maxHeight:"90vh", boxShadow:"0 24px 60px rgba(0,0,0,.25)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 24px", borderBottom:"1px solid #f1f5f9", background:accentColor, borderRadius:"20px 20px 0 0" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,.7)", fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>Onglet Aperçu</div>
                      <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#fff" }}>📄 {label} — Contenu de la page</h3>
                    </div>
                    <button onClick={() => setCourseApercuEditModal(null)} style={{ width:32, height:32, borderRadius:8, border:"none", background:"rgba(255,255,255,.2)", cursor:"pointer", fontSize:16, color:"#fff" }}>✕</button>
                  </div>
                  {/* Tabs */}
                  <div style={{ display:"flex", gap:2, padding:"12px 24px 0", background:"#f8fafc", borderBottom:"1px solid #e5e7eb", overflowX:"auto" }}>
                    {tabs.map(t => (
                      <button key={t.key} onClick={() => setCourseApercuSection(t.key)}
                        style={{ padding:"8px 14px", border:"none", borderRadius:"8px 8px 0 0", cursor:"pointer", fontWeight:700, fontSize:12, whiteSpace:"nowrap",
                          background: courseApercuSection===t.key ? "#fff" : "transparent",
                          color: courseApercuSection===t.key ? accentColor : "#64748b",
                          borderBottom: courseApercuSection===t.key ? `3px solid ${accentColor}` : "3px solid transparent" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {/* Body */}
                  <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
                    {courseApercuSection === "general" && (
                      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                        <div>
                          <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Description principale</label>
                          <textarea value={courseApercuEditModal.data.description||""} onChange={e => setCourseApercuEditModal(m => ({...m, data:{...m.data, description:e.target.value}}))}
                            rows={4} placeholder="Décrivez ce cours en quelques phrases…"
                            style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box", resize:"vertical" }} />
                        </div>
                        <div>
                          <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Public cible</label>
                          <ApercuStringList modal={courseApercuEditModal} setModal={setCourseApercuEditModal} field="targetAudience" placeholder="Ex : Professionnels souhaitant…" />
                        </div>
                      </div>
                    )}
                    {courseApercuSection === "avantages" && (
                      <div>
                        <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Points forts / Avantages</label>
                        <ApercuStringList modal={courseApercuEditModal} setModal={setCourseApercuEditModal} field="advantages" placeholder="Ex : Accès 24/7 à la plateforme…" />
                      </div>
                    )}
                    {courseApercuSection === "programme" && (
                      <div>
                        <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Ce que vous apprendrez</label>
                        <ApercuStringList modal={courseApercuEditModal} setModal={setCourseApercuEditModal} field="whatYouLearn" placeholder="Ex : Maîtriser la grammaire avancée…" />
                      </div>
                    )}
                    {courseApercuSection === "inclus" && (
                      <div>
                        <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Ce qui est inclus</label>
                        <ApercuObjList modal={courseApercuEditModal} setModal={setCourseApercuEditModal} field="includes" keys={["icon","label"]} placeholders={["🎓","Accès à la plateforme…"]} />
                      </div>
                    )}
                    {courseApercuSection === "prerequis" && (
                      <div>
                        <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Prérequis</label>
                        <ApercuStringList modal={courseApercuEditModal} setModal={setCourseApercuEditModal} field="requirements" placeholder="Ex : Niveau A2 minimum…" />
                      </div>
                    )}
                    {courseApercuSection === "faq" && (
                      <div>
                        <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Questions fréquentes</label>
                        <ApercuObjList modal={courseApercuEditModal} setModal={setCourseApercuEditModal} field="faq" keys={["q","a"]} placeholders={["Question…","Réponse…"]} />
                      </div>
                    )}
                  </div>
                  {/* Footer */}
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"14px 24px", borderTop:"1px solid #f1f5f9" }}>
                    <button onClick={() => setCourseApercuEditModal(null)}
                      style={{ padding:"9px 20px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>Annuler</button>
                    <button onClick={async () => {
                      const updated = { ...courseApercu, [type]: courseApercuEditModal.data };
                      setCourseApercu(updated);
                      await saveCourseApercu(updated);
                      toast.success(`Aperçu "${label}" mis à jour`);
                      setCourseApercuEditModal(null);
                    }} style={{ padding:"9px 22px", background:accentColor, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:800, fontSize:13 }}>💾 Enregistrer</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ════ TÉMOIGNAGES ════ */}
          {platformSubTab === "contenu" && (
            <div style={{ background:"#fff", borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", overflow:"hidden" }}>

              {/* ── Navigation interne ── */}
              <div style={{ display:"flex", gap:4, padding:"16px 20px 0", borderBottom:"2px solid #e2e8f0", background:"#f8fafc" }}>
                {[
                  { key:"articles",      label:"📝 Articles Blog",    badge: blogArticles.filter(a=>!a.publie).length },
                  { key:"temoignages",   label:"⭐ Témoignages",       badge: temosPending, danger: temosPending>0 },
                ].map(t => (
                  <button key={t.key} onClick={() => setBlogInnerTab(t.key)} style={{ padding:"8px 16px", borderRadius:"8px 8px 0 0", border:"none", fontWeight:700, fontSize:12, cursor:"pointer", position:"relative",
                    background: blogInnerTab===t.key ? "#fff" : "transparent",
                    color: blogInnerTab===t.key ? "#0f172a" : "#6b7280",
                    borderBottom: blogInnerTab===t.key ? "2px solid #1e3a8a" : "2px solid transparent",
                    marginBottom: blogInnerTab===t.key ? -2 : 0,
                  }}>
                    {t.label}
                    {t.badge > 0 && <span style={{ marginLeft:6, background: t.danger ? "#dc2626" : "#6366f1", color:"#fff", borderRadius:999, padding:"1px 7px", fontSize:10, fontWeight:800 }}>{t.badge}</span>}
                  </button>
                ))}
              </div>

              <div style={{ padding:24 }}>

              {/* ══ TÉMOIGNAGES ══ */}
              {blogInnerTab === "temoignages" && (() => {
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

                      {/* ── Médias photo + vidéo ── */}
                      <div className="temo-form-grid--full" style={{ marginTop:4 }}>
                        <label style={{ fontWeight:700, fontSize:12, color:"#374151", marginBottom:8, display:"block" }}>📎 Photo ou vidéo de témoignage</label>
                        <input ref={temoFileRef} type="file" accept={temoFileTarget==="video" ? "video/*" : "image/*"} style={{ display:"none" }}
                          onChange={e => { const f=e.target.files?.[0]; if(f) temoUploadMedia(f, temoFileTarget); e.target.value=""; }} />
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                          {/* Photo */}
                          <div style={{ background:"#f8fafc", border:"1.5px dashed #cbd5e1", borderRadius:9, padding:12 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>🖼️ Photo (diplôme, résultat…)</div>
                            {temoForm.photo_url ? (
                              <div style={{ position:"relative" }}>
                                <img src={temoForm.photo_url} alt="" style={{ width:"100%", height:80, objectFit:"cover", borderRadius:6, display:"block" }} />
                                <button onClick={() => setTemoForm(f=>({...f,photo_url:""}))} style={{ position:"absolute",top:4,right:4,background:"rgba(0,0,0,.6)",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                              </div>
                            ) : (
                              <button onClick={() => { setTemoFileTarget("photo"); temoFileRef.current?.click(); }} disabled={!!temoUploading}
                                style={{ width:"100%", padding:"10px 0", background:"#eff6ff", color:"#1e40af", border:"1px solid #bfdbfe", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                                {temoUploading==="photo" ? `Upload… ${temoUploadPct}%` : "☁️ Uploader une photo"}
                              </button>
                            )}
                            <input value={temoForm.photo_url} onChange={e=>setTemoForm(f=>({...f,photo_url:e.target.value}))}
                              placeholder="ou coller une URL…" style={{ width:"100%",marginTop:6,padding:"6px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,boxSizing:"border-box",outline:"none" }} />
                          </div>
                          {/* Vidéo */}
                          <div style={{ background:"#f8fafc", border:"1.5px dashed #cbd5e1", borderRadius:9, padding:12 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>🎬 Vidéo (témoignage filmé)</div>
                            {temoForm.video_url ? (
                              <div style={{ position:"relative" }}>
                                <video src={temoForm.video_url} style={{ width:"100%", height:80, objectFit:"cover", borderRadius:6, display:"block" }} />
                                <button onClick={() => setTemoForm(f=>({...f,video_url:""}))} style={{ position:"absolute",top:4,right:4,background:"rgba(0,0,0,.6)",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                              </div>
                            ) : (
                              <button onClick={() => { setTemoFileTarget("video"); temoFileRef.current?.click(); }} disabled={!!temoUploading}
                                style={{ width:"100%", padding:"10px 0", background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                                {temoUploading==="video" ? `Upload… ${temoUploadPct}%` : "☁️ Uploader une vidéo"}
                              </button>
                            )}
                            <input value={temoForm.video_url} onChange={e=>setTemoForm(f=>({...f,video_url:e.target.value}))}
                              placeholder="ou coller une URL MP4…" style={{ width:"100%",marginTop:6,padding:"6px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,boxSizing:"border-box",outline:"none" }} />
                          </div>
                        </div>
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

                          {/* Photo diplôme */}
                          {t.photo_url && (
                            <div style={{ marginBottom:8, borderRadius:8, overflow:"hidden", border:"1px solid #e5e7eb" }}>
                              <img src={t.photo_url} alt="Diplôme" style={{ width:"100%", height:90, objectFit:"cover", display:"block" }} />
                            </div>
                          )}
                          {/* Vidéo témoignage */}
                          {t.video_url && (
                            <div style={{ marginBottom:8, borderRadius:8, overflow:"hidden", border:"1px solid #e5e7eb", position:"relative" }}>
                              <video src={t.video_url} controls style={{ width:"100%", height:110, objectFit:"cover", display:"block", background:"#000" }} />
                              <span style={{ position:"absolute",top:6,left:6,background:"rgba(0,0,0,.55)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4 }}>🎬 Vidéo</span>
                            </div>
                          )}

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

              {/* ══ ARTICLES BLOG ══ */}
              {blogInnerTab === "articles" && (
              <div style={{ paddingTop:8 }}>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:20 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>📝 Gestion des Articles Blog</h2>
                  <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>{blogArticles.length} article{blogArticles.length>1?"s":""} · {blogArticles.filter(a=>!a.publie).length} brouillon{blogArticles.filter(a=>!a.publie).length>1?"s":""}</p>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={fetchBlogArticles} style={{ padding:"8px 16px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:"#374151" }}>🔄 Actualiser</button>
                  <button onClick={() => { setBlogForm(BLOG_FORM_INIT); setBlogEditId(null); setBlogFormOpen(f=>!f); }}
                    style={{ padding:"8px 18px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                    {blogFormOpen && !blogEditId ? "✕ Fermer" : "➕ Nouvel article"}
                  </button>
                </div>
              </div>
              {blogFormOpen && (
                <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:22, marginBottom:24 }}>
                  <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:800, color:"#0f172a" }}>{blogEditId ? "✏️ Modifier l'article" : "➕ Créer un article"}</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Titre *</label>
                      <input value={blogForm.titre} onChange={e=>setBlogForm(f=>({...f,titre:e.target.value}))} placeholder="Titre de l'article…"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Catégorie</label>
                      <select value={blogForm.categorie} onChange={e=>setBlogForm(f=>({...f,categorie:e.target.value}))}
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }}>
                        {BLOG_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Auteur</label>
                      <input value={blogForm.auteur} onChange={e=>setBlogForm(f=>({...f,auteur:e.target.value}))} placeholder="Admin"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Temps de lecture</label>
                      <input value={blogForm.read_time} onChange={e=>setBlogForm(f=>({...f,read_time:e.target.value}))} placeholder="Ex: 5 min"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }} />
                    </div>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Extrait / Résumé</label>
                      <textarea value={blogForm.extrait} onChange={e=>setBlogForm(f=>({...f,extrait:e.target.value}))} rows={2} placeholder="Courte description affichée sur la liste…"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }} />
                    </div>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Contenu (HTML)</label>
                      <textarea value={blogForm.contenu} onChange={e=>setBlogForm(f=>({...f,contenu:e.target.value}))} rows={6} placeholder="Contenu HTML de l'article…"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, resize:"vertical", boxSizing:"border-box", fontFamily:"monospace" }} />
                    </div>
                  </div>
                  <input ref={blogFileRef} type="file" accept={blogFileTarget==="video" ? "video/*" : "image/*"} style={{ display:"none" }}
                    onChange={e => { const f=e.target.files?.[0]; if(f) blogUploadMedia(f, blogFileTarget); e.target.value=""; }} />
                  <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:10 }}>📎 Médias</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                    <div style={{ background:"#fff", border:"1.5px dashed #cbd5e1", borderRadius:9, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>🖼️ Image principale</div>
                      {blogForm.image_url ? (
                        <div style={{ position:"relative" }}>
                          <img src={blogForm.image_url} alt="" style={{ width:"100%", height:80, objectFit:"cover", borderRadius:6, display:"block" }} />
                          <button onClick={()=>setBlogForm(f=>({...f,image_url:""}))} style={{ position:"absolute",top:4,right:4,background:"rgba(0,0,0,.6)",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={()=>{ setBlogFileTarget("image"); blogFileRef.current?.click(); }} disabled={!!blogUploading}
                          style={{ width:"100%", padding:"10px 0", background:"#eff6ff", color:"#1e40af", border:"1px solid #bfdbfe", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                          {blogUploading==="image" ? `Upload… ${blogUploadPct}%` : "☁️ Uploader une image"}
                        </button>
                      )}
                      <input value={blogForm.image_url} onChange={e=>setBlogForm(f=>({...f,image_url:e.target.value}))}
                        placeholder="ou coller une URL…" style={{ width:"100%",marginTop:6,padding:"6px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,boxSizing:"border-box",outline:"none" }} />
                    </div>
                    <div style={{ background:"#fff", border:"1.5px dashed #cbd5e1", borderRadius:9, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>🎬 Vidéo (YouTube, Vimeo ou MP4)</div>
                      {blogForm.video_url ? (
                        <div style={{ position:"relative" }}>
                          <div style={{ width:"100%", height:80, background:"#0f172a", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ color:"#fff", fontSize:22 }}>▶</span>
                          </div>
                          <button onClick={()=>setBlogForm(f=>({...f,video_url:""}))} style={{ position:"absolute",top:4,right:4,background:"rgba(0,0,0,.6)",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={()=>{ setBlogFileTarget("video"); blogFileRef.current?.click(); }} disabled={!!blogUploading}
                          style={{ width:"100%", padding:"10px 0", background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                          {blogUploading==="video" ? `Upload… ${blogUploadPct}%` : "☁️ Uploader une vidéo"}
                        </button>
                      )}
                      <input value={blogForm.video_url} onChange={e=>setBlogForm(f=>({...f,video_url:e.target.value}))}
                        placeholder="ou coller une URL YouTube/Vimeo/MP4…" style={{ width:"100%",marginTop:6,padding:"6px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,boxSizing:"border-box",outline:"none" }} />
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:13, fontWeight:700, color:"#374151" }}>
                      <input type="checkbox" checked={blogForm.publie} onChange={e=>setBlogForm(f=>({...f,publie:e.target.checked}))} style={{ width:16, height:16 }} />
                      Publier immédiatement
                    </label>
                    <div style={{ display:"flex", gap:10 }}>
                      <button onClick={()=>{ setBlogFormOpen(false); setBlogEditId(null); setBlogForm(BLOG_FORM_INIT); }}
                        style={{ padding:"9px 18px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:"#374151" }}>Annuler</button>
                      <button onClick={blogSave}
                        style={{ padding:"9px 22px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                        {blogEditId ? "💾 Mettre à jour" : "✓ Créer l'article"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ marginBottom:16 }}>
                <input value={blogSearch} onChange={e=>setBlogSearch(e.target.value)} placeholder="🔍 Rechercher un article…"
                  style={{ width:"100%", padding:"9px 14px", borderRadius:9, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box", outline:"none" }} />
              </div>
              {blogLoading ? (
                <div style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:14 }}>⏳ Chargement…</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {blogArticles.filter(a => !blogSearch || a.titre?.toLowerCase().includes(blogSearch.toLowerCase()) || a.categorie?.toLowerCase().includes(blogSearch.toLowerCase()) || a.auteur?.toLowerCase().includes(blogSearch.toLowerCase())).map(article => {
                    const isExpanded = blogExpandedArticle === article.id;
                    const articleComments = blogComments.filter(c => c.article_id === article.id);
                    return (
                    <div key={article.id} style={{ background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12, overflow:"hidden" }}>
                      {/* Carte article */}
                      <div style={{ padding:16, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                        <div style={{ width:64, height:64, borderRadius:8, overflow:"hidden", flexShrink:0, background:"#e2e8f0" }}>
                          {article.image_url ? <img src={article.image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>📄</div>}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
                            <span style={{ fontWeight:800, fontSize:14, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:320 }}>{article.titre}</span>
                            <span style={{ padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700, background: article.publie ? "#dcfce7" : "#fef9c3", color: article.publie ? "#166534" : "#854d0e" }}>
                              {article.publie ? "✅ Publié" : "📝 Brouillon"}
                            </span>
                            {article.video_url && <span style={{ padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700, background:"#f0fdf4", color:"#15803d" }}>🎬 Vidéo</span>}
                          </div>
                          <div style={{ fontSize:12, color:"#6b7280" }}>
                            {article.categorie} · {article.auteur} · {article.read_time || "—"}
                          </div>
                          <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{article.created_at ? new Date(article.created_at).toLocaleDateString("fr-FR") : ""}</div>
                        </div>
                        <div style={{ display:"flex", gap:8, flexShrink:0, flexWrap:"wrap" }}>
                          <button
                            onClick={() => {
                              if (!isExpanded && blogComments.length === 0) fetchBlogComments();
                              setBlogExpandedArticle(isExpanded ? null : article.id);
                            }}
                            style={{ padding:"6px 12px", background: isExpanded ? "#1e3a8a" : "#eff6ff", color: isExpanded ? "#fff" : "#1e40af", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12, position:"relative" }}>
                            💬 {article.nb_commentaires || 0}
                            {article.nb_en_attente > 0 && <span style={{ position:"absolute", top:-5, right:-5, background:"#d97706", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800 }}>{article.nb_en_attente}</span>}
                          </button>
                          <button onClick={()=>blogTogglePublie(article.id, article.publie)}
                            style={{ padding:"6px 12px", background: article.publie ? "#fef9c3" : "#dcfce7", color: article.publie ? "#854d0e" : "#166534", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                            {article.publie ? "↩ Dépublier" : "✅ Publier"}
                          </button>
                          <button onClick={()=>{ setBlogForm({ titre:article.titre, extrait:article.extrait||"", contenu:article.contenu||"", categorie:article.categorie||"Actualités", auteur:article.auteur||"Admin", read_time:article.read_time||"", image_url:article.image_url||"", video_url:article.video_url||"", publie:article.publie }); setBlogEditId(article.id); setBlogFormOpen(true); window.scrollTo({top:0,behavior:"smooth"}); }}
                            style={{ padding:"6px 12px", background:"#eff6ff", color:"#1e40af", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>✏️ Modifier</button>
                          <button onClick={()=>blogDelete(article.id)}
                            style={{ padding:"6px 12px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>🗑</button>
                        </div>
                      </div>
                      {/* Commentaires inline */}
                      {isExpanded && (
                        <div style={{ borderTop:"1.5px solid #e2e8f0", background:"#fff", padding:"16px 20px" }}>
                          <div style={{ fontWeight:800, fontSize:13, color:"#0f172a", marginBottom:12 }}>
                            💬 Commentaires · {articleComments.length} au total
                            {blogCommentsLoading && <span style={{ fontWeight:400, color:"#9ca3af", marginLeft:8 }}>Chargement…</span>}
                          </div>
                          {articleComments.length === 0 && !blogCommentsLoading ? (
                            <p style={{ color:"#9ca3af", fontSize:13, margin:0 }}>Aucun commentaire pour cet article.</p>
                          ) : (
                            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                              {articleComments.map(c => (
                                <div key={c.id} style={{ border:"1.5px solid #e5e7eb", borderRadius:10, padding:"12px 16px", background:"#f8fafc", display:"flex", gap:12, alignItems:"flex-start" }}>
                                  <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#1e3a8a,#0891b2)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".85rem", flexShrink:0 }}>
                                    {(c.nom||"?")[0].toUpperCase()}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, flexWrap:"wrap" }}>
                                      <div>
                                        <span style={{ fontWeight:800, color:"#0f172a", fontSize:13 }}>{c.nom}</span>
                                        {c.email && <span style={{ fontSize:11, color:"#94a3b8", marginLeft:8 }}>{c.email}</span>}
                                      </div>
                                      <span style={{ fontSize:11, color:"#94a3b8", flexShrink:0 }}>
                                        {new Date(c.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                                      </span>
                                    </div>
                                    <p style={{ fontSize:13, color:"#334155", margin:"6px 0 0", lineHeight:1.6, wordBreak:"break-word" }}>{c.commentaire}</p>
                                  </div>
                                  <button
                                    onClick={() => deleteBlogComment(c.id)}
                                    title="Supprimer"
                                    style={{ padding:"5px 10px", background:"#fff1f2", color:"#dc2626", border:"1.5px solid #fecdd3", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12, flexShrink:0 }}>
                                    🗑
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    );
                  })}
                  {blogArticles.length === 0 && !blogLoading && (
                    <div style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:14 }}>Aucun article. Créez-en un avec le bouton "➕ Nouvel article".</div>
                  )}
                </div>
              )}
              </div>
              )}


            </div>
            </div>
          )}

          {/* ══ AVIS OFFRES ══ */}
          {platformSubTab === "avis_offres" && (
            <div style={{ background:"#fff", borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,.05)", padding:28, overflow:"hidden" }}>
              {/* Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:22 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0f172a" }}>💬 Avis sur les offres</h2>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:"#9ca3af" }}>
                    {avisOffres.length} avis · {avisOffres.filter(a=>!a.actif).length} désactivé(s)
                  </p>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["tous","cours","certification"].map(f=>(
                    <button key={f} onClick={()=>setAvisFiltre(f)}
                      style={{ padding:"7px 16px", borderRadius:999, border:`1.5px solid ${avisFiltre===f?"#1e3a8a":"#e5e7eb"}`, background:avisFiltre===f?"#1e3a8a":"#fff", color:avisFiltre===f?"#fff":"#374151", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                      {f==="tous"?"Tous":`${f==="cours"?"Cours":"Certifications"} (${avisOffres.filter(a=>a.offre_type===f).length})`}
                    </button>
                  ))}
                  <button onClick={fetchAvisOffres} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid #e5e7eb", background:"#f8fafc", cursor:"pointer", fontWeight:700, fontSize:12, color:"#374151" }}>🔄 Actualiser</button>
                </div>
              </div>

              {avisLoading && <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>Chargement…</div>}
              {!avisLoading && avisOffres.length===0 && (
                <div style={{ textAlign:"center", padding:"48px 24px", background:"#f8fafc", borderRadius:12, border:"1.5px dashed #e2e8f0" }}>
                  <div style={{ fontSize:"2.5rem", marginBottom:12 }}>💬</div>
                  <p style={{ color:"#64748b", fontSize:14, margin:0 }}>Aucun avis pour le moment.</p>
                </div>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {avisOffres
                  .filter(a => avisFiltre==="tous" || a.offre_type===avisFiltre)
                  .map(a => (
                  <div key={a.id} style={{ border:`1.5px solid ${a.actif?"#e5e7eb":"#fecdd3"}`, borderRadius:12, padding:"16px 18px", background:a.actif?"#fff":"#fff7f7", display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
                    {/* Avatar initiale */}
                    <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#1e3a8a,#dc2626)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:16, flexShrink:0 }}>
                      {(a.apprenant_nom||"?")[0].toUpperCase()}
                    </div>
                    {/* Contenu */}
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:4 }}>
                        <span style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>{a.apprenant_nom||"Apprenant BET"}</span>
                        <span style={{ padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700, background:a.offre_type==="cours"?"#dbeafe":"#ede9fe", color:a.offre_type==="cours"?"#1e40af":"#6d28d9" }}>
                          {a.offre_type==="cours"?"📚 Cours":"🏆 Certification"}
                        </span>
                        <span style={{ padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700, background:a.actif?"#dcfce7":"#fee2e2", color:a.actif?"#166534":"#991b1b" }}>
                          {a.actif?"✅ Visible":"🚫 Désactivé"}
                        </span>
                        <span style={{ fontSize:11, color:"#9ca3af", marginLeft:"auto" }}>{new Date(a.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                      {/* Étoiles */}
                      <div style={{ marginBottom:6 }}>
                        <span style={{ color:"#f59e0b", fontSize:16 }}>{"★".repeat(a.note)}</span>
                        <span style={{ color:"#e5e7eb", fontSize:16 }}>{"★".repeat(5-a.note)}</span>
                      </div>
                      <p style={{ fontSize:13, color:"#374151", lineHeight:1.6, margin:"0 0 6px", fontStyle:"italic" }}>"{a.texte}"</p>
                      <div style={{ fontSize:11, color:"#9ca3af" }}>✉️ {a.apprenant_email}</div>
                    </div>
                    {/* Actions */}
                    <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                      <button onClick={()=>toggleAvis(a.id, !a.actif)}
                        style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${a.actif?"#fecdd3":"#bbf7d0"}`, background:a.actif?"#fee2e2":"#dcfce7", color:a.actif?"#991b1b":"#166534", fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
                        {a.actif?"🚫 Désactiver":"✅ Réactiver"}
                      </button>
                      <button onClick={()=>deleteAvis(a.id)}
                        style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #fecdd3", background:"#fff", color:"#dc2626", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                        🗑 Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ BOUTIQUE ══ */}
          {platformSubTab === "boutique" && (
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

          {/* [old blog block removed - now inside contenu inner tabs] */}
          {false && (
            <div>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:20 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>📝 Gestion des Articles Blog</h2>
                  <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>{blogArticles.length} article{blogArticles.length>1?"s":""} · {blogArticles.filter(a=>!a.publie).length} brouillon{blogArticles.filter(a=>!a.publie).length>1?"s":""}</p>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={fetchBlogArticles} style={{ padding:"8px 16px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:"#374151" }}>🔄 Actualiser</button>
                  <button onClick={() => { setBlogForm(BLOG_FORM_INIT); setBlogEditId(null); setBlogFormOpen(f=>!f); }}
                    style={{ padding:"8px 18px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                    {blogFormOpen && !blogEditId ? "✕ Fermer" : "➕ Nouvel article"}
                  </button>
                </div>
              </div>

              {/* Formulaire création / édition */}
              {blogFormOpen && (
                <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:22, marginBottom:24 }}>
                  <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:800, color:"#0f172a" }}>{blogEditId ? "✏️ Modifier l'article" : "➕ Créer un article"}</h3>

                  {/* Champs principaux */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Titre *</label>
                      <input value={blogForm.titre} onChange={e=>setBlogForm(f=>({...f,titre:e.target.value}))} placeholder="Titre de l'article…"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Catégorie</label>
                      <select value={blogForm.categorie} onChange={e=>setBlogForm(f=>({...f,categorie:e.target.value}))}
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }}>
                        {BLOG_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Auteur</label>
                      <input value={blogForm.auteur} onChange={e=>setBlogForm(f=>({...f,auteur:e.target.value}))} placeholder="Admin"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Temps de lecture</label>
                      <input value={blogForm.read_time} onChange={e=>setBlogForm(f=>({...f,read_time:e.target.value}))} placeholder="Ex: 5 min"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box" }} />
                    </div>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Extrait / Résumé</label>
                      <textarea value={blogForm.extrait} onChange={e=>setBlogForm(f=>({...f,extrait:e.target.value}))} rows={2} placeholder="Courte description affichée sur la liste…"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }} />
                    </div>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Contenu (HTML)</label>
                      <textarea value={blogForm.contenu} onChange={e=>setBlogForm(f=>({...f,contenu:e.target.value}))} rows={6} placeholder="Contenu HTML de l'article…"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, resize:"vertical", boxSizing:"border-box", fontFamily:"monospace" }} />
                    </div>
                  </div>

                  {/* Médias image + vidéo */}
                  <input ref={blogFileRef} type="file" accept={blogFileTarget==="video" ? "video/*" : "image/*"} style={{ display:"none" }}
                    onChange={e => { const f=e.target.files?.[0]; if(f) blogUploadMedia(f, blogFileTarget); e.target.value=""; }} />
                  <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:10 }}>📎 Médias</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                    {/* Image principale */}
                    <div style={{ background:"#fff", border:"1.5px dashed #cbd5e1", borderRadius:9, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>🖼️ Image principale</div>
                      {blogForm.image_url ? (
                        <div style={{ position:"relative" }}>
                          <img src={blogForm.image_url} alt="" style={{ width:"100%", height:80, objectFit:"cover", borderRadius:6, display:"block" }} />
                          <button onClick={()=>setBlogForm(f=>({...f,image_url:""}))} style={{ position:"absolute",top:4,right:4,background:"rgba(0,0,0,.6)",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={()=>{ setBlogFileTarget("image"); blogFileRef.current?.click(); }} disabled={!!blogUploading}
                          style={{ width:"100%", padding:"10px 0", background:"#eff6ff", color:"#1e40af", border:"1px solid #bfdbfe", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                          {blogUploading==="image" ? `Upload… ${blogUploadPct}%` : "☁️ Uploader une image"}
                        </button>
                      )}
                      <input value={blogForm.image_url} onChange={e=>setBlogForm(f=>({...f,image_url:e.target.value}))}
                        placeholder="ou coller une URL…" style={{ width:"100%",marginTop:6,padding:"6px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,boxSizing:"border-box",outline:"none" }} />
                    </div>
                    {/* Vidéo */}
                    <div style={{ background:"#fff", border:"1.5px dashed #cbd5e1", borderRadius:9, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:8 }}>🎬 Vidéo (YouTube, Vimeo ou MP4)</div>
                      {blogForm.video_url ? (
                        <div style={{ position:"relative" }}>
                          <div style={{ width:"100%", height:80, background:"#0f172a", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ color:"#fff", fontSize:22 }}>▶</span>
                          </div>
                          <button onClick={()=>setBlogForm(f=>({...f,video_url:""}))} style={{ position:"absolute",top:4,right:4,background:"rgba(0,0,0,.6)",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={()=>{ setBlogFileTarget("video"); blogFileRef.current?.click(); }} disabled={!!blogUploading}
                          style={{ width:"100%", padding:"10px 0", background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0", borderRadius:7, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                          {blogUploading==="video" ? `Upload… ${blogUploadPct}%` : "☁️ Uploader une vidéo"}
                        </button>
                      )}
                      <input value={blogForm.video_url} onChange={e=>setBlogForm(f=>({...f,video_url:e.target.value}))}
                        placeholder="ou coller une URL YouTube/Vimeo/MP4…" style={{ width:"100%",marginTop:6,padding:"6px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,boxSizing:"border-box",outline:"none" }} />
                    </div>
                  </div>

                  {/* Statut + actions */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:13, fontWeight:700, color:"#374151" }}>
                      <input type="checkbox" checked={blogForm.publie} onChange={e=>setBlogForm(f=>({...f,publie:e.target.checked}))} style={{ width:16, height:16 }} />
                      Publier immédiatement
                    </label>
                    <div style={{ display:"flex", gap:10 }}>
                      <button onClick={()=>{ setBlogFormOpen(false); setBlogEditId(null); setBlogForm(BLOG_FORM_INIT); }}
                        style={{ padding:"9px 18px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:"#374151" }}>Annuler</button>
                      <button onClick={blogSave}
                        style={{ padding:"9px 22px", background:"#1e3a8a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                        {blogEditId ? "💾 Mettre à jour" : "✓ Créer l'article"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recherche */}
              <div style={{ marginBottom:16 }}>
                <input value={blogSearch} onChange={e=>setBlogSearch(e.target.value)} placeholder="🔍 Rechercher un article…"
                  style={{ width:"100%", padding:"9px 14px", borderRadius:9, border:"1.5px solid #e5e7eb", fontSize:13, boxSizing:"border-box", outline:"none" }} />
              </div>

              {/* Liste articles */}
              {blogLoading ? (
                <div style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:14 }}>⏳ Chargement…</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {blogArticles.filter(a => !blogSearch || a.titre?.toLowerCase().includes(blogSearch.toLowerCase()) || a.categorie?.toLowerCase().includes(blogSearch.toLowerCase()) || a.auteur?.toLowerCase().includes(blogSearch.toLowerCase())).map(article => (
                    <div key={article.id} style={{ background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:12, padding:16, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                      {/* Miniature */}
                      <div style={{ width:64, height:64, borderRadius:8, overflow:"hidden", flexShrink:0, background:"#e2e8f0" }}>
                        {article.image_url ? <img src={article.image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>📄</div>}
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
                          <span style={{ fontWeight:800, fontSize:14, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:320 }}>{article.titre}</span>
                          <span style={{ padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700, background: article.publie ? "#dcfce7" : "#fef9c3", color: article.publie ? "#166534" : "#854d0e" }}>
                            {article.publie ? "✅ Publié" : "📝 Brouillon"}
                          </span>
                          {article.video_url && <span style={{ padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700, background:"#f0fdf4", color:"#15803d" }}>🎬 Vidéo</span>}
                        </div>
                        <div style={{ fontSize:12, color:"#6b7280" }}>
                          {article.categorie} · {article.auteur} · {article.read_time || "—"}
                          {article.nb_commentaires > 0 && ` · 💬 ${article.nb_commentaires} commentaire${article.nb_commentaires>1?"s":""}`}
                          {article.nb_en_attente > 0 && <span style={{ color:"#d97706" }}> (⏳{article.nb_en_attente})</span>}
                        </div>
                        <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{article.created_at ? new Date(article.created_at).toLocaleDateString("fr-FR") : ""}</div>
                      </div>
                      {/* Actions */}
                      <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                        <button onClick={()=>blogTogglePublie(article.id, article.publie)}
                          style={{ padding:"6px 12px", background: article.publie ? "#fef9c3" : "#dcfce7", color: article.publie ? "#854d0e" : "#166534", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                          {article.publie ? "↩ Dépublier" : "✅ Publier"}
                        </button>
                        <button onClick={()=>{ setBlogForm({ titre:article.titre, extrait:article.extrait||"", contenu:article.contenu||"", categorie:article.categorie||"Actualités", auteur:article.auteur||"Admin", read_time:article.read_time||"", image_url:article.image_url||"", video_url:article.video_url||"", publie:article.publie }); setBlogEditId(article.id); setBlogFormOpen(true); window.scrollTo({top:0,behavior:"smooth"}); }}
                          style={{ padding:"6px 12px", background:"#eff6ff", color:"#1e40af", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>✏️ Modifier</button>
                        <button onClick={()=>blogDelete(article.id)}
                          style={{ padding:"6px 12px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>🗑</button>
                      </div>
                    </div>
                  ))}
                  {blogArticles.length === 0 && !blogLoading && (
                    <div style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:14 }}>Aucun article. Créez-en un avec le bouton "➕ Nouvel article".</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* [old blog_comments block removed - now inside contenu inner tabs] */}
          {false && (
            <div>
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

          {platformSubTab === "carrousel" && (() => {
            const isEdit = !!carouselForm?.id;
            return (
              <div style={{ background:"#fff", borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", overflow:"hidden" }}>
                {/* Header */}
                <div style={{ background: BET_GRADIENT, padding:"24px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <h2 style={{ color:"#fff", margin:0, fontSize:"1.3rem", fontWeight:800 }}>🖼️ Carrousel & Médias</h2>
                    <p style={{ color:"rgba(255,255,255,0.7)", margin:"4px 0 0", fontSize:".85rem" }}>
                      {carouselSlides.length} slide{carouselSlides.length !== 1 ? "s" : ""} · {carouselSlides.filter(s=>s.actif).length} visible{carouselSlides.filter(s=>s.actif).length !== 1 ? "s" : ""} sur le site
                    </p>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={fetchCarousel} style={{ padding:"9px 16px", background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13 }}>🔄 Actualiser</button>
                    <button onClick={() => setCarouselForm({ ...CAROUSEL_BLANK, ordre: carouselSlides.length })}
                      style={{ padding:"9px 18px", background:"#fff", color:BET_COLOR, border:"none", borderRadius:8, fontWeight:800, cursor:"pointer", fontSize:13 }}>
                      ➕ Ajouter une slide
                    </button>
                  </div>
                </div>

                <div style={{ padding:"28px" }}>
                  {/* Formulaire add/edit */}
                  {carouselForm && (
                    <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"22px 24px", marginBottom:28 }}>
                      <h3 style={{ margin:"0 0 4px", fontSize:"1rem", fontWeight:800, color:"#0f172a" }}>
                        {isEdit ? "✏️ Modifier la slide" : "➕ Nouvelle slide"}
                      </h3>

                      {/* Fiche dimensions recommandées */}
                      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"6px 12px", fontSize:12 }}>
                          <span style={{ fontSize:15 }}>🖼️</span>
                          <div>
                            <span style={{ fontWeight:700, color:"#1e40af" }}>Image recommandée</span>
                            <span style={{ color:"#3b82f6", marginLeft:6 }}>1600 × 900 px · 16:9 · JPG/PNG/WebP · max 10 Mo</span>
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:7, background:"#fefce8", border:"1px solid #fde68a", borderRadius:8, padding:"6px 12px", fontSize:12 }}>
                          <span style={{ fontSize:15 }}>🎬</span>
                          <div>
                            <span style={{ fontWeight:700, color:"#92400e" }}>Vidéo</span>
                            <span style={{ color:"#b45309", marginLeft:6 }}>MP4/MOV/WebM · max 200 Mo  —  ou lien YouTube/Vimeo (embed)</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                        {/* Type */}
                        <div>
                          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Type *</label>
                          <select value={carouselForm.type} onChange={e=>setCarouselForm(p=>({...p,type:e.target.value,url:""}))}
                            style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:13, background:"#fff" }}>
                            <option value="image">🖼️ Image</option>
                            <option value="video">🎬 Vidéo</option>
                          </select>
                        </div>
                        {/* Ordre */}
                        <div>
                          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Ordre d'affichage</label>
                          <input type="number" min="0" value={carouselForm.ordre}
                            onChange={e=>setCarouselForm(p=>({...p,ordre:Number(e.target.value)}))}
                            style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                        </div>

                        {/* Zone upload depuis PC */}
                        <div style={{ gridColumn:"1/-1" }}>
                          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>
                            {carouselForm.type === "video" ? "📁 Uploader une vidéo depuis le PC" : "📁 Uploader une image depuis le PC"}
                          </label>
                          <input
                            ref={carouselFileRef}
                            type="file"
                            accept={carouselForm.type === "video" ? "video/mp4,video/mov,video/avi,video/mkv,video/webm" : "image/jpeg,image/png,image/webp,image/gif"}
                            style={{ display:"none" }}
                            onChange={e => { if (e.target.files?.[0]) uploadCarouselFile(e.target.files[0]); e.target.value=""; }}
                          />
                          <div
                            onClick={() => !carouselUploading && carouselFileRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setCarouselDragOver(true); }}
                            onDragLeave={() => setCarouselDragOver(false)}
                            onDrop={e => { e.preventDefault(); setCarouselDragOver(false); if (!carouselUploading && e.dataTransfer.files?.[0]) uploadCarouselFile(e.dataTransfer.files[0]); }}
                            style={{
                              border:`2px dashed ${carouselDragOver ? BET_COLOR : "#d1d5db"}`,
                              borderRadius:10, padding:"22px 16px", textAlign:"center",
                              cursor: carouselUploading ? "not-allowed" : "pointer",
                              background: carouselDragOver ? "#fff1f2" : "#fff",
                              transition:"all .2s",
                            }}>
                            {carouselUploading ? (
                              <div>
                                <div style={{ fontSize:13, fontWeight:700, color:BET_COLOR, marginBottom:10 }}>⏳ Upload en cours… {carouselUploadPct}%</div>
                                <div style={{ height:8, background:"#f1f5f9", borderRadius:4, overflow:"hidden" }}>
                                  <div style={{ height:"100%", width:`${carouselUploadPct}%`, background:BET_COLOR, borderRadius:4, transition:"width .2s" }} />
                                </div>
                              </div>
                            ) : (
                              <>
                                <div style={{ fontSize:28, marginBottom:6 }}>{carouselForm.type === "video" ? "🎬" : "🖼️"}</div>
                                <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>
                                  Glisser-déposer ou <span style={{ color:BET_COLOR, textDecoration:"underline" }}>cliquer pour choisir</span>
                                </div>
                                <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>
                                  {carouselForm.type === "video"
                                    ? "MP4 · MOV · WebM · max 200 Mo"
                                    : "JPG · PNG · WebP · 1600×900 px recommandé · max 10 Mo"}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Séparateur OU + champ URL */}
                          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"12px 0 8px" }}>
                            <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
                            <span style={{ fontSize:11, color:"#9ca3af", fontWeight:700, whiteSpace:"nowrap" }}>ou coller une URL</span>
                            <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
                          </div>
                          <input type="url"
                            placeholder={carouselForm.type === "video" ? "https://youtube.com/embed/xxx  ou  https://...mp4" : "https://..."}
                            value={carouselForm.url}
                            onChange={e=>setCarouselForm(p=>({...p,url:e.target.value}))}
                            style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                        </div>

                        {/* Titre */}
                        <div>
                          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Titre superposé</label>
                          <input type="text" placeholder="Votre anglais, votre avenir."
                            value={carouselForm.titre}
                            onChange={e=>setCarouselForm(p=>({...p,titre:e.target.value}))}
                            style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                        </div>
                        {/* Description */}
                        <div>
                          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Description courte</label>
                          <input type="text" placeholder="Sous-titre ou accroche…"
                            value={carouselForm.description}
                            onChange={e=>setCarouselForm(p=>({...p,description:e.target.value}))}
                            style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                        </div>
                        {/* Lien CTA */}
                        <div>
                          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Lien CTA (optionnel)</label>
                          <input type="url" placeholder="https://... ou /parcours"
                            value={carouselForm.link_url}
                            onChange={e=>setCarouselForm(p=>({...p,link_url:e.target.value}))}
                            style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                        </div>
                        {/* Label CTA */}
                        <div>
                          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:5 }}>Texte du bouton CTA</label>
                          <input type="text" placeholder="Découvrir →"
                            value={carouselForm.link_label}
                            onChange={e=>setCarouselForm(p=>({...p,link_label:e.target.value}))}
                            style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                        </div>
                        {/* Visible */}
                        <div style={{ display:"flex", alignItems:"center", gap:10, gridColumn:"1/-1" }}>
                          <ToggleSwitch checked={carouselForm.actif} onChange={v=>setCarouselForm(p=>({...p,actif:v}))} />
                          <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Visible sur le site</span>
                        </div>
                      </div>

                      {/* Aperçu après upload ou URL */}
                      {carouselForm.type === "image" && carouselForm.url && (
                        <div style={{ marginTop:14 }}>
                          <p style={{ fontSize:11, color:"#9ca3af", margin:"0 0 6px", fontWeight:600 }}>APERÇU</p>
                          <div style={{ position:"relative", display:"inline-block", width:"100%" }}>
                            <img src={carouselForm.url} alt="preview"
                              style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:8, border:"1px solid #e5e7eb", display:"block" }}
                              onError={e=>{e.target.style.display="none";}} />
                            {/* ratio indicator */}
                            <span style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,.55)", color:"#fff", fontSize:10, fontWeight:700, borderRadius:5, padding:"2px 7px" }}>16:9 idéal</span>
                          </div>
                        </div>
                      )}
                      {carouselForm.type === "video" && carouselForm.url && (
                        <div style={{ marginTop:14, background:"#0f172a", borderRadius:8, padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,.6)", display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:20 }}>🎬</span>
                          <span style={{ wordBreak:"break-all", color:"#fff" }}>{carouselForm.url.length > 70 ? carouselForm.url.slice(0,70)+"…" : carouselForm.url}</span>
                        </div>
                      )}

                      <div style={{ display:"flex", gap:10, marginTop:18 }}>
                        <button onClick={saveCarousel} disabled={carouselSaving || carouselUploading}
                          style={{ padding:"10px 22px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:13, opacity:(carouselSaving||carouselUploading)?0.6:1 }}>
                          {carouselSaving ? "Sauvegarde…" : isEdit ? "💾 Mettre à jour" : "✅ Ajouter la slide"}
                        </button>
                        <button onClick={() => setCarouselForm(null)} disabled={carouselUploading}
                          style={{ padding:"10px 18px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:9, cursor:"pointer", fontWeight:600, fontSize:13 }}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Liste des slides */}
                  {carouselLoading && <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:14 }}>⏳ Chargement…</div>}
                  {!carouselLoading && carouselSlides.length === 0 && (
                    <div style={{ textAlign:"center", padding:"52px 0" }}>
                      <div style={{ fontSize:42, marginBottom:12 }}>🖼️</div>
                      <div style={{ fontWeight:700, color:"#0f172a", marginBottom:6 }}>Aucune slide pour le moment</div>
                      <p style={{ color:"#9ca3af", fontSize:13 }}>Ajoutez votre première slide pour animer le carrousel de la page d'accueil.</p>
                    </div>
                  )}
                  {!carouselLoading && carouselSlides.length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      {carouselSlides.map((slide, slidePos) => (
                        <div key={slide.id} style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"14px 16px", background: slide.actif ? "#f8fafc" : "#f1f5f9", border:`1.5px solid ${slide.actif?"#e2e8f0":"#d1d5db"}`, borderRadius:10 }}>
                          {/* Vignette */}
                          <div style={{ width:110, height:70, borderRadius:8, overflow:"hidden", flexShrink:0, background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {slide.type === "image" ? (
                              <img src={slide.url} alt={slide.titre || "slide"}
                                style={{ width:"100%", height:"100%", objectFit:"cover" }}
                                onError={e=>{e.target.style.display="none";e.target.parentNode.innerHTML='<span style="font-size:28px;opacity:.5">🖼️</span>';}} />
                            ) : (
                              <span style={{ fontSize:28, opacity:.7 }}>🎬</span>
                            )}
                          </div>
                          {/* Infos */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                              <span style={{ padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:700, background: slide.type==="video"?"#fef3c7":"#ede9fe", color: slide.type==="video"?"#92400e":"#6d28d9" }}>
                                {slide.type === "video" ? "🎬 Vidéo" : "🖼️ Image"}
                              </span>
                              <span style={{ padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:800, background:"#f1f5f9", color:"#475569" }}>#{slidePos + 1}</span>
                              {!slide.actif && <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, background:"#f1f5f9", color:"#9ca3af", fontWeight:600 }}>Masqué</span>}
                            </div>
                            {slide.titre && <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:700, color:"#0f172a" }}>{slide.titre}</p>}
                            {slide.description && <p style={{ margin:"0 0 3px", fontSize:12, color:"#475569", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{slide.description}</p>}
                            {slide.link_url && (
                              <p style={{ margin:0, fontSize:11, color:"#6366f1" }}>
                                🔗 {slide.link_label || slide.link_url}
                              </p>
                            )}
                            <p style={{ margin:"4px 0 0", fontSize:11, color:"#94a3b8", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{slide.url}</p>
                          </div>
                          {/* Actions */}
                          <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0, alignItems:"flex-end" }}>
                            <ToggleSwitch checked={slide.actif} onChange={() => toggleCarouselActif(slide)} />
                            {/* Réorganisation ↑↓ */}
                            <div style={{ display:"flex", gap:3 }}>
                              <button
                                onClick={() => moveCarouselSlide(slide.id, "up")}
                                disabled={carouselSlides.indexOf(slide) === 0}
                                title="Monter"
                                style={{ padding:"5px 9px", background:"#f8fafc", color:"#374151", border:"1px solid #e2e8f0", borderRadius:6, cursor:"pointer", fontSize:12, opacity: carouselSlides.indexOf(slide)===0 ? 0.35 : 1 }}>↑</button>
                              <button
                                onClick={() => moveCarouselSlide(slide.id, "down")}
                                disabled={carouselSlides.indexOf(slide) === carouselSlides.length - 1}
                                title="Descendre"
                                style={{ padding:"5px 9px", background:"#f8fafc", color:"#374151", border:"1px solid #e2e8f0", borderRadius:6, cursor:"pointer", fontSize:12, opacity: carouselSlides.indexOf(slide)===carouselSlides.length-1 ? 0.35 : 1 }}>↓</button>
                            </div>
                            <div style={{ display:"flex", gap:5 }}>
                              <button onClick={() => setCarouselForm({ ...slide })}
                                style={{ padding:"6px 11px", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>✏️</button>
                              <button onClick={() => deleteCarousel(slide.id)}
                                style={{ padding:"6px 11px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>🗑️</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {carouselSlides.length > 0 && (
                    <p style={{ textAlign:"right", fontSize:12, color:"#94a3b8", marginTop:16 }}>
                      {carouselSlides.filter(s=>s.actif).length} slide{carouselSlides.filter(s=>s.actif).length!==1?"s":""} active{carouselSlides.filter(s=>s.actif).length!==1?"s":""} / {carouselSlides.length} total
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {platformSubTab === "faq" && (() => {
            const faqCats = ["Tous", ...FAQ_CATEGORIES];
            const filtered = faqItems.filter(item => {
              const matchCat = faqCatFilter === "Tous" || item.categorie === faqCatFilter;
              const q = faqSearch.toLowerCase();
              const matchSearch = !q || item.question.toLowerCase().includes(q) || item.reponse.toLowerCase().includes(q) || item.categorie.toLowerCase().includes(q);
              return matchCat && matchSearch;
            });
            return (
              <div style={{ background:"#fff", borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", overflow:"hidden" }}>
                {/* Header */}
                <div style={{ background: BET_GRADIENT, padding:"24px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <h2 style={{ color:"#fff", margin:0, fontSize:"1.3rem", fontWeight:800 }}>❓ Gestion FAQ</h2>
                    <p style={{ color:"rgba(255,255,255,0.7)", margin:"4px 0 0", fontSize:".85rem" }}>
                      {faqItems.length} question{faqItems.length !== 1 ? "s" : ""} · {faqItems.filter(f => f.actif).length} visible{faqItems.filter(f => f.actif).length !== 1 ? "s" : ""} sur le site
                    </p>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={fetchFaq} style={{ padding:"9px 16px", background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13 }}>🔄 Actualiser</button>
                    <button onClick={() => setFaqForm({ question:"", reponse:"", categorie:"Général", ordre:"", actif:true })}
                      style={{ padding:"9px 18px", background:"#fff", color:BET_COLOR, border:"none", borderRadius:8, cursor:"pointer", fontWeight:800, fontSize:13 }}>
                      ➕ Nouvelle FAQ
                    </button>
                  </div>
                </div>

                <div style={{ padding:24 }}>
                  {/* Formulaire création / édition */}
                  {faqForm && (
                    <div style={{ background:"#f8fafc", border:`1.5px solid ${BET_COLOR}44`, borderRadius:14, padding:22, marginBottom:24 }}>
                      <h4 style={{ margin:"0 0 16px", fontSize:14, fontWeight:800, color:"#0f172a" }}>
                        {faqForm.id ? "✏️ Modifier la FAQ" : "➕ Nouvelle question"}
                      </h4>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                        <div style={{ gridColumn:"1 / -1" }}>
                          <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Question *</label>
                          <input
                            value={faqForm.question}
                            onChange={e => setFaqForm(p => ({ ...p, question: e.target.value }))}
                            placeholder="Quels types de cours proposez-vous ?"
                            style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }}
                          />
                        </div>
                        <div style={{ gridColumn:"1 / -1" }}>
                          <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Réponse *</label>
                          <textarea
                            value={faqForm.reponse}
                            onChange={e => setFaqForm(p => ({ ...p, reponse: e.target.value }))}
                            placeholder="Rédigez une réponse claire et complète…"
                            rows={4}
                            style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Catégorie</label>
                          <select
                            value={faqForm.categorie}
                            onChange={e => setFaqForm(p => ({ ...p, categorie: e.target.value }))}
                            style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box", background:"#fff" }}
                          >
                            {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Ordre d'affichage</label>
                          <input
                            type="number"
                            value={faqForm.ordre}
                            onChange={e => setFaqForm(p => ({ ...p, ordre: e.target.value }))}
                            placeholder="0"
                            style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box" }}
                          />
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:18 }}>
                          <ToggleSwitch on={faqForm.actif !== false} onChange={v => setFaqForm(p => ({ ...p, actif: v }))} color={BET_COLOR} />
                          <span style={{ fontSize:13, color:"#374151" }}>Visible sur le site</span>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                        <button onClick={() => setFaqForm(null)} style={{ padding:"9px 18px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13 }}>Annuler</button>
                        <button
                          onClick={() => saveFaq(faqForm)}
                          disabled={!faqForm.question?.trim() || !faqForm.reponse?.trim() || !!faqSavingId}
                          style={{ padding:"9px 20px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, opacity:(!faqForm.question?.trim() || !faqForm.reponse?.trim() || !!faqSavingId) ? 0.6 : 1 }}
                        >
                          {faqSavingId ? "⏳ Enregistrement…" : "💾 Enregistrer"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Filtres */}
                  <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                    <input
                      value={faqSearch}
                      onChange={e => setFaqSearch(e.target.value)}
                      placeholder="🔍 Rechercher question, réponse…"
                      style={{ flex:1, minWidth:220, padding:"8px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, boxSizing:"border-box" }}
                    />
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {faqCats.map(c => (
                        <button key={c} onClick={() => setFaqCatFilter(c)}
                          style={{ padding:"6px 12px", borderRadius:20, border:"1.5px solid", borderColor: faqCatFilter === c ? BET_COLOR : "#e2e8f0", background: faqCatFilter === c ? BET_COLOR : "#fff", color: faqCatFilter === c ? "#fff" : "#475569", fontWeight:600, fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Liste */}
                  {faqLoading ? (
                    <div style={{ textAlign:"center", padding:48, color:"#9ca3af" }}>⏳ Chargement…</div>
                  ) : filtered.length === 0 ? (
                    <div style={{ textAlign:"center", padding:48, color:"#9ca3af", fontSize:13 }}>
                      {faqItems.length === 0 ? "Aucune FAQ. Créez-en une ci-dessus." : "Aucun résultat pour ces filtres."}
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {filtered.map(item => (
                        <div key={item.id} style={{ background:"#fff", borderRadius:10, border:`1.5px solid ${item.actif ? "#d1fae5" : "#e5e7eb"}`, padding:"14px 18px", display:"flex", gap:14, alignItems:"flex-start", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                          {/* Toggle actif */}
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, paddingTop:2, minWidth:32 }}>
                            <ToggleSwitch on={item.actif} onChange={() => toggleFaqActif(item)} color={BET_COLOR} />
                            <span style={{ fontSize:10, color:"#9ca3af", fontWeight:700 }}>#{item.ordre}</span>
                          </div>
                          {/* Contenu */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                              <span style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:BET_LIGHT, color:BET_COLOR }}>{item.categorie}</span>
                              {!item.actif && <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, background:"#f1f5f9", color:"#9ca3af", fontWeight:600 }}>Masqué</span>}
                            </div>
                            <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:700, color:"#0f172a", lineHeight:1.4 }}>❓ {item.question}</p>
                            <p style={{ margin:0, fontSize:12, color:"#475569", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.reponse}</p>
                          </div>
                          {/* Actions */}
                          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                            <button onClick={() => setFaqForm({ ...item })}
                              style={{ padding:"6px 11px", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>✏️</button>
                            <button onClick={() => deleteFaq(item.id)}
                              style={{ padding:"6px 11px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filtered.length > 0 && (
                    <p style={{ textAlign:"right", fontSize:12, color:"#94a3b8", marginTop:14 }}>
                      {filtered.length} / {faqItems.length} question{faqItems.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

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
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
                      {/* Barre de recherche */}
                      <input type="text" placeholder="🔍 Nom ou email…" value={searchUser} onChange={e=>setSearchUser(e.target.value)} style={{ padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:13, width:200, marginBottom:0 }} />
                      {/* Filtre par rôle */}
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {["Tous","super_admin","admin","manager","superviseur","responsable","pedagogical_advisor","commercial","onboarding","gestionnaire","rh","comptable","coach","customer_care","data_collector"].map(r=>(
                          <button key={r} onClick={()=>setFiltreRole(r)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:11, fontWeight:600, cursor:"pointer", background:filtreRole===r?(ROLES_DEF[r]?.color||BET_COLOR):"#fff", color:filtreRole===r?"#fff":"#6b7280", borderColor:filtreRole===r?(ROLES_DEF[r]?.color||BET_COLOR):"#e5e7eb" }}>
                            {r==="Tous"?"Tous":ROLES_DEF[r]?.emoji+" "+ROLES_DEF[r]?.label}
                          </button>
                        ))}
                      </div>
                      {/* Filtre par statut */}
                      <div style={{ display:"flex", gap:5 }}>
                        {["Tous","Actifs","Inactifs","Sans 2FA","En ligne"].map(s=>(
                          <button key={s} onClick={()=>setFiltreStatut(s)} style={{ padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:11, cursor:"pointer", background:filtreStatut===s?BET_COLOR:"#fff", color:filtreStatut===s?"#fff":"#6b7280", borderColor:filtreStatut===s?BET_COLOR:"#e5e7eb" }}>{s}</button>
                        ))}
                      </div>
                      {/* Filtre par centre */}
                      <div style={{ display:"flex", alignItems:"center", gap:6, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"4px 10px" }}>
                        <span style={{ fontSize:11, color:"#64748b", fontWeight:700, whiteSpace:"nowrap" }}>🏢 Centre :</span>
                        <select value={filtreCentre} onChange={e=>setFiltreCentre(e.target.value)} style={{ border:"none", background:"transparent", fontSize:12, color:"#0f172a", fontWeight:600, cursor:"pointer", outline:"none" }}>
                          <option value="Tous">Tous les centres</option>
                          <option value="national">🌍 National (accès global)</option>
                          {CENTRES_BET.map(c=>(
                            <option key={c.id} value={c.id}>{c.label.replace("BET ","")}</option>
                          ))}
                        </select>
                        {filtreCentre !== "Tous" && (
                          <button onClick={()=>setFiltreCentre("Tous")} style={{ border:"none", background:"none", cursor:"pointer", color:"#94a3b8", fontSize:14, lineHeight:1, padding:0 }} title="Effacer">✕</button>
                        )}
                      </div>
                    </div>
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
                                        {u.avatar_url
                                          ? <img src={u.avatar_url} alt={u.prenom} style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", display:"block" }}/>
                                          : <div style={{ width:36, height:36, borderRadius:"50%", background:`${r?.color||BET_COLOR}18`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:r?.color||BET_COLOR }}>{(u.prenom?.[0]||"")+(u.nom?.[0]||"")}</div>
                                        }
                                        {isOnline&&<div style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%", background:"#22c55e", border:"2px solid #fff" }}/>}
                                    </div>
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
                                {u.role === "coach" && (
                                  <button onClick={()=>openCoachModal(u)} title="Profil coach complet" style={{ padding:"5px 10px", background:"#ede9fe", color:"#6d28d9", border:"1px solid #c4b5fd", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:700 }}>👁 Profil</button>
                                )}
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
            {activeTab === "audit" && (() => {
              const STATUT_META = {
                success: { bg:"#dcfce7", color:"#166534", dot:"#22c55e", label:"✅ Succès" },
                warning: { bg:"#fef9c3", color:"#854d0e", dot:"#f59e0b", label:"⚠️ Attention" },
                danger:  { bg:"#fee2e2", color:"#991b1b", dot:"#ef4444", label:"🚨 Alerte" },
                info:    { bg:"#e0f2fe", color:"#0369a1", dot:"#0891b2", label:"ℹ️ Info" },
              };
              const MODULE_ICONS = { auth:"🔐", users:"👤", admin:"🔧", paiements:"💳", boutique:"🛍️", inscriptions:"📋", leads:"📞", devis:"📄", blog:"📝", temoignages:"⭐", sondage:"📊", coachs:"🎓", centres:"📍", system:"⚙️", cinetpay:"💳", parcours:"🎯" };
              const CENTRES_LIST = ["angre","bouake","plateaux","yopougon","koumassi","abatta","cocody"];
              const totalPages = Math.max(1, Math.ceil(auditTotal / AUDIT_LIMIT));

              const exportCSV = () => {
                const rows = [["ID","Acteur","Email","Rôle","Action","Module","Entité","Centre","Détail","IP","Statut","Date"]];
                auditLogs.forEach(l => rows.push([l.id,l.acteur_nom||"",l.acteur_email||"",l.acteur_role||"",l.action_type||"",l.module||"",`${l.entite_type||""}:${l.entite_id||""}`,l.centre||"",`"${(l.detail||"").replace(/"/g,'""')}"`,l.ip_address||"",l.statut||"",l.created_at||""]));
                const csv = rows.map(r => r.join(",")).join("\n");
                const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,﻿"+encodeURIComponent(csv); a.download=`audit_${new Date().toISOString().split("T")[0]}.csv`; a.click();
                toast.success("Export CSV effectué");
              };

              const AuditRow = ({ log }) => {
                const sm = STATUT_META[log.statut] || STATUT_META.info;
                const initiales = (log.acteur_nom||"??").split(" ").map(x=>x[0]||"").join("").toUpperCase().slice(0,2);
                return (
                  <tr style={{ borderBottom:"1px solid #f1f5f9", background: log.statut==="danger"?"#fff8f8":log.statut==="warning"?"#fffdf0":"#fff" }}>
                    <td style={{ padding:"10px 8px", width:16 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:sm.dot, boxShadow:`0 0 0 3px ${sm.dot}22`, margin:"auto" }} />
                    </td>
                    <td style={{ padding:"10px 10px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:30, height:30, borderRadius:"50%", background: log.statut==="danger"?"#fee2e2":log.statut==="warning"?"#fef9c3":"#e0f2fe", color: log.statut==="danger"?"#dc2626":log.statut==="warning"?"#b45309":BET_COLOR, fontWeight:800, fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{initiales}</div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:12, color:"#0f172a" }}>{log.acteur_nom||"Système"}</div>
                          <div style={{ fontSize:10, color:"#9ca3af" }}>{log.acteur_role||"—"}{log.acteur_email ? ` · ${log.acteur_email}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"10px 10px" }}>
                      <span style={{ padding:"3px 9px", borderRadius:6, fontSize:10, fontWeight:700, background:sm.bg, color:sm.color, whiteSpace:"nowrap" }}>
                        {log.action_type?.replace(/_/g," ")||"—"}
                      </span>
                    </td>
                    <td style={{ padding:"10px 10px" }}>
                      <span style={{ fontSize:11, color:"#6b7280" }}>{MODULE_ICONS[log.module]||"📦"} {log.module||"—"}</span>
                      {log.entite_type && <div style={{ fontSize:10, color:"#94a3b8" }}>{log.entite_type}{log.entite_id ? ` #${String(log.entite_id).slice(0,8)}` : ""}</div>}
                    </td>
                    <td style={{ padding:"10px 10px", fontSize:12, color:"#374151", maxWidth:280 }}>
                      <span title={log.detail}>{log.detail?.length>80 ? log.detail.slice(0,80)+"…" : log.detail||"—"}</span>
                    </td>
                    <td style={{ padding:"10px 10px" }}>
                      {log.centre && <span style={{ fontSize:10, background:"#f1f5f9", padding:"2px 7px", borderRadius:4, color:"#475569", fontWeight:600 }}>📍 {log.centre}</span>}
                    </td>
                    <td style={{ padding:"10px 10px", fontSize:10, color:"#9ca3af", whiteSpace:"nowrap" }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}) : "—"}
                    </td>
                    <td style={{ padding:"10px 10px" }}>
                      <code style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"#f3f4f6", color:"#374151" }}>{log.ip_address||"—"}</code>
                    </td>
                  </tr>
                );
              };

              return (
                <div>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>📜 Audit global</h2>
                      <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Traçabilité complète — chaque action, chaque profil, chaque centre</p>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => { fetchAuditLogs(1); fetchAuditStats(); }} style={{ padding:"9px 12px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>🔄 Actualiser</button>
                      <button onClick={exportCSV} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇️ Export CSV</button>
                      <button onClick={async () => { if (!window.confirm("Supprimer les logs de +90 jours ?")) return; await fetch(`${API_URL}/api/audit/clear`,{method:"DELETE",headers:authHeaders()}); toast.success("Logs purgés"); fetchAuditLogs(1); fetchAuditStats(); }} style={{ padding:"9px 12px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>🗑️ Purger +90j</button>
                    </div>
                  </div>

                  {/* KPIs */}
                  {auditStats && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12, marginBottom:20 }}>
                      {[
                        { icon:"📊", label:"Aujourd'hui",   value:auditStats.total_today,              color:"#0891b2" },
                        { icon:"📅", label:"7 derniers j",  value:auditStats.total_7j,                 color:"#8b5cf6" },
                        { icon:"📆", label:"30 derniers j", value:auditStats.total_30j,                color:"#059669" },
                        { icon:"🚨", label:"Alertes (j.)",   value:auditStats.alertes_today,            color:BET_RED   },
                        { icon:"✅", label:"Succès",         value:auditStats.par_statut?.success||0,   color:"#22c55e" },
                        { icon:"⚠️", label:"Avertissements", value:auditStats.par_statut?.warning||0,   color:"#f59e0b" },
                      ].map((k,i) => (
                        <div key={i} style={{ background:"#fff", borderRadius:12, padding:"14px 16px", border:"1px solid #f1f5f9", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                          <div style={{ fontSize:18, marginBottom:4 }}>{k.icon}</div>
                          <div style={{ fontWeight:900, fontSize:20, color:k.color }}>{k.value??0}</div>
                          <div style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>{k.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sous-vues */}
                  <div style={{ display:"flex", gap:4, marginBottom:20, background:"#f1f5f9", borderRadius:10, padding:4, width:"fit-content" }}>
                    {[
                      { key:"logs",   label:"📋 Journal complet" },
                      { key:"stats",  label:"📊 Par module" },
                      { key:"profil", label:"👤 Par profil" },
                      { key:"centre", label:"📍 Par centre" },
                    ].map(v => (
                      <button key={v.key} onClick={() => setAuditView(v.key)} style={{ padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:12,
                        background: auditView===v.key ? "#fff" : "transparent",
                        color:      auditView===v.key ? BET_COLOR : "#6b7280",
                        boxShadow:  auditView===v.key ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                      }}>{v.label}</button>
                    ))}
                  </div>

                  {/* VUE : JOURNAL COMPLET */}
                  {auditView === "logs" && (
                    <div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
                        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                          <input placeholder="🔍 Acteur, email, action, détail…" value={auditFilters.search}
                            onChange={e => setAuditFilters(f => ({...f, search:e.target.value}))}
                            style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, minWidth:240, background:"#fff" }} />
                          <select value={auditFilters.statut} onChange={e => setAuditFilters(f=>({...f,statut:e.target.value}))}
                            style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                            <option value="">Tous statuts</option>
                            <option value="success">✅ Succès</option>
                            <option value="warning">⚠️ Avertissement</option>
                            <option value="danger">🚨 Alerte</option>
                            <option value="info">ℹ️ Info</option>
                          </select>
                          <select value={auditFilters.module} onChange={e => setAuditFilters(f=>({...f,module:e.target.value}))}
                            style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                            <option value="">Tous modules</option>
                            {Object.entries(MODULE_ICONS).map(([k,ico]) => <option key={k} value={k}>{ico} {k}</option>)}
                          </select>
                          <select value={auditFilters.centre} onChange={e => setAuditFilters(f=>({...f,centre:e.target.value}))}
                            style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                            <option value="">Tous centres</option>
                            {CENTRES_LIST.map(c => <option key={c} value={c}>📍 {c}</option>)}
                          </select>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:11, color:"#64748b" }}>Du</span>
                            <input type="date" value={auditFilters.date_debut} onChange={e => setAuditFilters(f=>({...f,date_debut:e.target.value}))}
                              style={{ padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, background:"#fff" }} />
                            <span style={{ fontSize:11, color:"#64748b" }}>au</span>
                            <input type="date" value={auditFilters.date_fin} onChange={e => setAuditFilters(f=>({...f,date_fin:e.target.value}))}
                              style={{ padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, background:"#fff" }} />
                          </div>
                          <button onClick={() => { setAuditPage(1); fetchAuditLogs(1); }} style={{ padding:"8px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>Filtrer</button>
                          <button onClick={() => { const empty={module:"",action_type:"",statut:"",centre:"",search:"",date_debut:"",date_fin:""}; setAuditFilters(empty); setAuditPage(1); fetchAuditLogs(1,empty); }} style={{ padding:"8px 12px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontSize:12 }}>✕ Reset</button>
                          <span style={{ fontSize:12, color:"#9ca3af", marginLeft:"auto" }}>{auditTotal.toLocaleString("fr-FR")} entrée{auditTotal>1?"s":""}</span>
                        </div>
                      </div>

                      {auditLoading ? (
                        <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>⏳ Chargement…</div>
                      ) : auditLogs.length === 0 ? (
                        <div style={{ textAlign:"center", padding:60, color:"#9ca3af" }}>
                          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                          <div style={{ fontWeight:600, marginBottom:4 }}>Aucun événement trouvé</div>
                          <div style={{ fontSize:12 }}>Ajustez vos filtres ou attendez les premières actions</div>
                        </div>
                      ) : (
                        <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid #e5e7eb" }}>
                          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                            <thead>
                              <tr style={{ background:"#f8fafc" }}>
                                {["","Acteur","Action","Module","Détail","Centre","Date & Heure","IP"].map(h => (
                                  <th key={h} style={{ padding:"10px 10px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {auditLogs.map(log => <AuditRow key={log.id} log={log} />)}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {totalPages > 1 && (
                        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:16, flexWrap:"wrap" }}>
                          <button onClick={() => { const p=Math.max(1,auditPage-1); setAuditPage(p); fetchAuditLogs(p); }} disabled={auditPage===1}
                            style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #e5e7eb", background:auditPage===1?"#f9fafb":"#fff", cursor:auditPage===1?"not-allowed":"pointer", fontSize:13, color:auditPage===1?"#d1d5db":"#374151" }}>‹</button>
                          {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>n===1||n===totalPages||Math.abs(n-auditPage)<=2).reduce((acc,n,i,arr)=>{if(i>0&&arr[i-1]!==n-1)acc.push("…");acc.push(n);return acc;},[]).map((n,i)=>
                            n==="…"?<span key={`e${i}`} style={{padding:"6px 6px",fontSize:13,color:"#9ca3af"}}>…</span>
                            :<button key={n} onClick={()=>{setAuditPage(n);fetchAuditLogs(n);}} style={{padding:"6px 12px",borderRadius:6,border:"1px solid",fontSize:13,cursor:"pointer",fontWeight:n===auditPage?700:400,background:n===auditPage?BET_COLOR:"#fff",color:n===auditPage?"#fff":"#374151",borderColor:n===auditPage?BET_COLOR:"#e5e7eb"}}>{n}</button>
                          )}
                          <button onClick={() => { const p=Math.min(totalPages,auditPage+1); setAuditPage(p); fetchAuditLogs(p); }} disabled={auditPage===totalPages}
                            style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #e5e7eb", background:auditPage===totalPages?"#f9fafb":"#fff", cursor:auditPage===totalPages?"not-allowed":"pointer", fontSize:13, color:auditPage===totalPages?"#d1d5db":"#374151" }}>›</button>
                          <span style={{ alignSelf:"center", fontSize:11, color:"#9ca3af" }}>Page {auditPage}/{totalPages}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VUE : PAR MODULE */}
                  {auditView === "stats" && auditStats && (
                    <div>
                      <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:"#0f172a" }}>📊 Activité par module</h3>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14, marginBottom:28 }}>
                        {(auditStats.par_module||[]).sort((a,b)=>b.count-a.count).map(m => {
                          const maxCount = Math.max(...(auditStats.par_module||[]).map(x=>x.count),1);
                          const pct = Math.round((m.count/maxCount)*100);
                          return (
                            <div key={m.module} style={{ background:"#fff", borderRadius:12, padding:"16px 18px", border:"1px solid #f1f5f9", cursor:"pointer" }}
                              onClick={() => { setAuditFilters(f=>({...f,module:m.module})); setAuditView("logs"); setAuditPage(1); fetchAuditLogs(1,{...auditFilters,module:m.module}); }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                                <span style={{ fontSize:22 }}>{MODULE_ICONS[m.module]||"📦"}</span>
                                <span style={{ fontWeight:900, fontSize:18, color:BET_COLOR }}>{m.count}</span>
                              </div>
                              <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:8 }}>{m.module}</div>
                              <div style={{ height:6, borderRadius:3, background:"#f1f5f9" }}>
                                <div style={{ height:"100%", width:`${pct}%`, background:BET_COLOR, borderRadius:3 }} />
                              </div>
                              <div style={{ fontSize:10, color:"#94a3b8", marginTop:4 }}>{pct}% du max · Cliquer pour filtrer</div>
                            </div>
                          );
                        })}
                      </div>
                      <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:"#0f172a" }}>🏆 Top acteurs du jour</h3>
                      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #f1f5f9", overflow:"hidden" }}>
                        {(auditStats.top_acteurs||[]).length === 0
                          ? <div style={{ padding:24, textAlign:"center", color:"#9ca3af", fontSize:13 }}>Aucune activité aujourd'hui</div>
                          : (auditStats.top_acteurs||[]).map((a,i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 18px", borderBottom:i<(auditStats.top_acteurs.length-1)?"1px solid #f8fafc":"none" }}>
                              <div style={{ width:28, height:28, borderRadius:"50%", background:i===0?"#fef9c3":i===1?"#f1f5f9":"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0 }}>
                                {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{a.acteur_nom||"Inconnu"}</div>
                                <div style={{ fontSize:11, color:"#9ca3af" }}>{a.acteur_email||"—"}</div>
                              </div>
                              <span style={{ fontWeight:900, fontSize:16, color:BET_COLOR }}>{a.count}</span>
                              <span style={{ fontSize:11, color:"#9ca3af" }}>actions</span>
                            </div>
                          ))
                        }
                      </div>
                      {(auditStats.par_heure||[]).length > 0 && (
                        <div style={{ marginTop:24 }}>
                          <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:"#0f172a" }}>⏱️ Activité par heure (aujourd'hui)</h3>
                          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #f1f5f9", padding:"20px 24px" }}>
                            <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:80 }}>
                              {auditStats.par_heure.map((h,i) => {
                                const maxH = Math.max(...auditStats.par_heure.map(x=>x.count),1);
                                const pct = (h.count/maxH)*100;
                                return (
                                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                                    <div style={{ width:"100%", background:pct>0?BET_COLOR:"#f1f5f9", borderRadius:"3px 3px 0 0", height:`${Math.max(pct,4)}%`, minHeight:4 }} title={`${h.heure} : ${h.count}`} />
                                    <span style={{ fontSize:8, color:"#94a3b8" }}>{h.heure}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VUE : PAR PROFIL */}
                  {auditView === "profil" && (
                    <div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", marginBottom:20 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:8 }}>Sélectionner un utilisateur :</div>
                        <select onChange={e => { const u=users.find(x=>x.id===e.target.value); if(!u)return; setAuditSelectedProfile(u); fetchAuditByProfile(u.id); }}
                          style={{ padding:"9px 14px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, background:"#fff", minWidth:300, cursor:"pointer" }}>
                          <option value="">-- Choisir un utilisateur --</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.role})</option>)}
                        </select>
                      </div>
                      {auditSelectedProfile && (
                        auditProfileLogs.length === 0
                          ? <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}><div style={{ fontSize:32, marginBottom:8 }}>📭</div>Aucun log</div>
                          : <div>
                              <div style={{ marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
                                <div style={{ width:36, height:36, borderRadius:"50%", background:"#e0f2fe", color:BET_COLOR, fontWeight:800, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                  {(auditSelectedProfile.prenom||"?")[0]}{(auditSelectedProfile.nom||"")[0]}
                                </div>
                                <div>
                                  <div style={{ fontWeight:700, fontSize:14 }}>{auditSelectedProfile.prenom} {auditSelectedProfile.nom}</div>
                                  <div style={{ fontSize:11, color:"#9ca3af" }}>{auditSelectedProfile.email} · {auditSelectedProfile.role} · {auditProfileLogs.length} actions</div>
                                </div>
                              </div>
                              <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid #e5e7eb" }}>
                                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                                  <thead><tr style={{ background:"#f8fafc" }}>{["","Acteur","Action","Module","Détail","Centre","Date","IP"].map(h=><th key={h} style={{ padding:"10px 10px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", borderBottom:"2px solid #e5e7eb" }}>{h}</th>)}</tr></thead>
                                  <tbody>{auditProfileLogs.map(log=><AuditRow key={log.id} log={log}/>)}</tbody>
                                </table>
                              </div>
                            </div>
                      )}
                    </div>
                  )}

                  {/* VUE : PAR CENTRE */}
                  {auditView === "centre" && (
                    <div>
                      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
                        {CENTRES_LIST.map(c => (
                          <button key={c} onClick={() => { setAuditSelectedCentre(c); fetchAuditByCentre(c); }} style={{
                            padding:"10px 18px", borderRadius:10, border:"2px solid", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .15s",
                            background: auditSelectedCentre===c ? BET_COLOR : "#fff",
                            color:      auditSelectedCentre===c ? "#fff" : "#374151",
                            borderColor:auditSelectedCentre===c ? BET_COLOR : "#e5e7eb",
                          }}>📍 {c.charAt(0).toUpperCase()+c.slice(1)}</button>
                        ))}
                      </div>
                      {auditSelectedCentre && (
                        auditCentreLogs.length === 0
                          ? <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}><div style={{ fontSize:32, marginBottom:8 }}>📭</div>Aucun log pour ce centre</div>
                          : <div>
                              <div style={{ marginBottom:12, fontWeight:700, fontSize:14, color:"#0f172a" }}>📍 {auditSelectedCentre} — {auditCentreLogs.length} entrée{auditCentreLogs.length>1?"s":""}</div>
                              <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid #e5e7eb" }}>
                                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                                  <thead><tr style={{ background:"#f8fafc" }}>{["","Acteur","Action","Module","Détail","Date","IP"].map(h=><th key={h} style={{ padding:"10px 10px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", borderBottom:"2px solid #e5e7eb" }}>{h}</th>)}</tr></thead>
                                  <tbody>{auditCentreLogs.map(log=><AuditRow key={log.id} log={log}/>)}</tbody>
                                </table>
                              </div>
                            </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}


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
            {activeTab === "ca" && (() => {
              const now = new Date();
              const filtreCA = (p) => {
                const d = p.date_paiement ? new Date(p.date_paiement) : null;
                if (!d) return false;
                if (caPeriode === "semaine") {
                  const debut = new Date(now); debut.setDate(now.getDate() - 7);
                  return d >= debut;
                }
                if (caPeriode === "mois") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
                if (caPeriode === "trimestre") {
                  const trimestre = Math.floor(now.getMonth() / 3);
                  return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === trimestre;
                }
                if (caPeriode === "annee") return d.getFullYear() === caAnnee;
                return true; // "tout"
              };

              const pFiltered = paiements.filter(filtreCA);
              const totalRecu     = pFiltered.reduce((s,p)=>s+(p.montant_recu||0),0);
              const totalDu       = pFiltered.reduce((s,p)=>s+(p.montant_du||0),0);
              const totalAttente  = pFiltered.filter(p=>p.statut==="en_attente").reduce((s,p)=>s+(p.montant_du||0),0);
              const totalPartiel  = pFiltered.filter(p=>p.statut==="partiel").reduce((s,p)=>s+(p.montant_du||0)-(p.montant_recu||0),0);
              const nbTransactions = pFiltered.length;
              const nbPayes = pFiltered.filter(p=>p.statut==="paye").length;
              const txEncaissement = totalDu > 0 ? Math.round((totalRecu/totalDu)*100) : 0;
              const panierMoyen = nbTransactions > 0 ? Math.round(totalRecu / nbTransactions) : 0;

              // CA par mois pour la période annuelle
              const MOIS_FR = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
              const parMois = MOIS_FR.map((label, idx) => {
                const val = paiements.filter(p => {
                  const d = p.date_paiement ? new Date(p.date_paiement) : null;
                  return d && d.getFullYear() === caAnnee && d.getMonth() === idx;
                }).reduce((s,p)=>s+(p.montant_recu||0),0);
                return { label, val };
              });
              const maxMois = Math.max(...parMois.map(m=>m.val), 1);

              // CA par commercial
              const parCommercial = {};
              pFiltered.forEach(p => {
                const nom = p.commercial_nom || "—";
                if (!parCommercial[nom]) parCommercial[nom] = 0;
                parCommercial[nom] += p.montant_recu || 0;
              });
              const topCommercials = Object.entries(parCommercial).sort((a,b)=>b[1]-a[1]).slice(0,6);

              // CA par mode de paiement
              const parMode = {};
              pFiltered.forEach(p => {
                const m = p.mode_paiement || "Autre";
                if (!parMode[m]) parMode[m] = 0;
                parMode[m] += p.montant_recu || 0;
              });
              const totalMode = Object.values(parMode).reduce((a,b)=>a+b,0);

              const PERIODE_OPTIONS = [
                { key:"semaine",   label:"7 derniers jours" },
                { key:"mois",      label:"Ce mois" },
                { key:"trimestre", label:"Ce trimestre" },
                { key:"annee",     label:"Année" },
                { key:"tout",      label:"Tout" },
              ];

              return (
                <div>
                  {/* Header + Filtres */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>💰 Chiffre d'affaires — Plateforme globale</h2>
                      <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Suivi financier en temps réel de toutes les structures</p>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                      <div style={{ display:"flex", background:"#f1f5f9", borderRadius:10, padding:3, gap:2 }}>
                        {PERIODE_OPTIONS.map(opt => (
                          <button key={opt.key} onClick={()=>setCaPeriode(opt.key)}
                            style={{ padding:"6px 12px", borderRadius:8, border:"none", fontSize:12, fontWeight:600, cursor:"pointer",
                              background: caPeriode===opt.key ? "#fff" : "transparent",
                              color:      caPeriode===opt.key ? "#0891b2" : "#64748b",
                              boxShadow:  caPeriode===opt.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                              transition:"all .15s" }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {caPeriode === "annee" && (
                        <select value={caAnnee} onChange={e=>setCaAnnee(Number(e.target.value))}
                          style={{ padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                          {[now.getFullYear()-1, now.getFullYear()].map(y=><option key={y} value={y}>{y}</option>)}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* KPIs */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
                    <div style={{ background:"linear-gradient(135deg,#059669,#10b981)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
                      <div style={{ fontSize:11, opacity:0.8, fontWeight:600, letterSpacing:"0.05em" }}>TOTAL ENCAISSÉ</div>
                      <div style={{ fontSize:24, fontWeight:800, margin:"6px 0 2px" }}>{formatMoney(totalRecu)}</div>
                      <div style={{ fontSize:11, opacity:0.75 }}>sur {formatMoney(totalDu)} dû</div>
                    </div>
                    <div style={{ background:"linear-gradient(135deg,#0891b2,#0e7490)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
                      <div style={{ fontSize:11, opacity:0.8, fontWeight:600, letterSpacing:"0.05em" }}>TRANSACTIONS</div>
                      <div style={{ fontSize:24, fontWeight:800, margin:"6px 0 2px" }}>{nbTransactions}</div>
                      <div style={{ fontSize:11, opacity:0.75 }}>{nbPayes} soldées</div>
                    </div>
                    <div style={{ background:"linear-gradient(135deg,#d97706,#f59e0b)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
                      <div style={{ fontSize:11, opacity:0.8, fontWeight:600, letterSpacing:"0.05em" }}>EN ATTENTE</div>
                      <div style={{ fontSize:24, fontWeight:800, margin:"6px 0 2px" }}>{formatMoney(totalAttente + totalPartiel)}</div>
                      <div style={{ fontSize:11, opacity:0.75 }}>à encaisser</div>
                    </div>
                    <div style={{ background:"linear-gradient(135deg,#7c3aed,#8b5cf6)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
                      <div style={{ fontSize:11, opacity:0.8, fontWeight:600, letterSpacing:"0.05em" }}>TX ENCAISSEMENT</div>
                      <div style={{ fontSize:24, fontWeight:800, margin:"6px 0 2px" }}>{txEncaissement}%</div>
                      <div style={{ fontSize:11, opacity:0.75 }}>Panier moy. {formatMoney(panierMoyen)}</div>
                    </div>
                  </div>

                  {/* Barre d'encaissement globale */}
                  <div style={{ background:"#f8fafc", borderRadius:14, padding:16, marginBottom:20, border:"1px solid #e5e7eb" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>Taux d'encaissement global</span>
                      <span style={{ fontSize:13, fontWeight:700, color:txEncaissement>=80?"#059669":txEncaissement>=50?"#d97706":"#dc2626" }}>{txEncaissement}%</span>
                    </div>
                    <div style={{ background:"#e5e7eb", borderRadius:99, height:10, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${txEncaissement}%`, background:`linear-gradient(90deg,${txEncaissement>=80?"#059669":txEncaissement>=50?"#d97706":"#dc2626"},${txEncaissement>=80?"#10b981":txEncaissement>=50?"#f59e0b":"#ef4444"})`, borderRadius:99, transition:"width .5s" }} />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:"#9ca3af" }}>
                      <span>{formatMoney(totalRecu)} reçus</span>
                      <span>{formatMoney(totalDu)} total dû</span>
                    </div>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                    {/* Histogramme mensuel */}
                    <div style={{ background:"#f8fafc", borderRadius:14, padding:16, border:"1px solid #e5e7eb" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:14 }}>📊 Évolution mensuelle {caAnnee}</div>
                      <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:120 }}>
                        {parMois.map(({label,val}) => (
                          <div key={label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                            <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600 }}>{val>0?(val/1000).toFixed(0)+"k":""}</div>
                            <div style={{ width:"100%", background: val>0?"#0891b2":"#e5e7eb", borderRadius:"4px 4px 0 0", height:`${maxMois>0?Math.max((val/maxMois)*90,val>0?8:2):2}px`, transition:"height .3s", minHeight:2 }} />
                            <div style={{ fontSize:9, color:"#9ca3af", whiteSpace:"nowrap" }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Modes de paiement */}
                    <div style={{ background:"#f8fafc", borderRadius:14, padding:16, border:"1px solid #e5e7eb" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:14 }}>💳 Répartition par mode</div>
                      {Object.keys(parMode).length === 0 ? (
                        <div style={{ textAlign:"center", padding:"30px 0", color:"#9ca3af", fontSize:12 }}>Aucune donnée sur la période</div>
                      ) : (
                        Object.entries(parMode).sort((a,b)=>b[1]-a[1]).map(([mode,val]) => {
                          const pct = totalMode > 0 ? Math.round((val/totalMode)*100) : 0;
                          return (
                            <div key={mode} style={{ marginBottom:10 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                                <span style={{ fontWeight:600, color:"#374151" }}>{mode}</span>
                                <span style={{ fontWeight:700, color:"#0891b2" }}>{formatMoney(val)} <span style={{ color:"#9ca3af", fontWeight:400 }}>({pct}%)</span></span>
                              </div>
                              <div style={{ background:"#e5e7eb", borderRadius:99, height:6, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${pct}%`, background:"#0891b2", borderRadius:99 }} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Top commerciaux */}
                  <div style={{ background:"#f8fafc", borderRadius:14, padding:16, border:"1px solid #e5e7eb" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:14 }}>🏆 Classement commerciaux — Encaissements</div>
                    {topCommercials.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"20px 0", color:"#9ca3af", fontSize:12 }}>Aucune donnée sur la période sélectionnée</div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {topCommercials.map(([nom, val], idx) => {
                          const pct = topCommercials[0][1] > 0 ? Math.round((val/topCommercials[0][1])*100) : 0;
                          const medals = ["🥇","🥈","🥉"];
                          return (
                            <div key={nom} style={{ display:"flex", alignItems:"center", gap:12, background:"#fff", borderRadius:10, padding:"10px 14px", border:"1px solid #e5e7eb" }}>
                              <span style={{ fontSize:18, flexShrink:0 }}>{medals[idx]||`#${idx+1}`}</span>
                              <div style={{ flex:1 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                  <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{nom}</span>
                                  <span style={{ fontWeight:800, fontSize:13, color:"#059669" }}>{formatMoney(val)}</span>
                                </div>
                                <div style={{ background:"#e5e7eb", borderRadius:99, height:5 }}>
                                  <div style={{ height:"100%", width:`${pct}%`, background: idx===0?"#059669":idx===1?"#0891b2":"#8b5cf6", borderRadius:99 }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ================= ONGLET PAIEMENTS ================= */}
            {activeTab === "paiements" && (() => {
              const STATUT_PAI = {
                paye:       { label:"✅ Payé",       bg:"#d1fae5", color:"#065f46" },
                en_attente: { label:"⏳ En attente", bg:"#fef9c3", color:"#854d0e" },
                partiel:    { label:"⚡ Partiel",    bg:"#fff7ed", color:"#92400e" },
                refuse:     { label:"❌ Refusé",     bg:"#fee2e2", color:"#dc2626" },
                rembourse:  { label:"↩ Remboursé",  bg:"#f3e8ff", color:"#7c3aed" },
              };

              const modes = ["Tous", ...new Set(paiements.map(p=>p.mode_paiement).filter(Boolean))];

              const filtres = paiements.filter(p => {
                if (paiementFiltre.statut !== "Tous" && p.statut !== paiementFiltre.statut) return false;
                if (paiementFiltre.mode   !== "Tous" && p.mode_paiement !== paiementFiltre.mode) return false;
                if (paiementFiltre.search) {
                  const q = paiementFiltre.search.toLowerCase();
                  if (!p.client?.toLowerCase().includes(q) &&
                      !p.email?.toLowerCase().includes(q) &&
                      !p.commercial_nom?.toLowerCase().includes(q) &&
                      !p.ref_transaction?.toLowerCase().includes(q)) return false;
                }
                if (paiementFiltre.dateDebut && p.date_paiement < paiementFiltre.dateDebut) return false;
                if (paiementFiltre.dateFin   && p.date_paiement > paiementFiltre.dateFin)   return false;
                return true;
              });

              const totalPages = Math.max(1, Math.ceil(filtres.length / PAIEMENTS_PER_PAGE));
              const page       = Math.min(paiementPage, totalPages);
              const pageItems  = filtres.slice((page-1)*PAIEMENTS_PER_PAGE, page*PAIEMENTS_PER_PAGE);

              const totalRecu   = filtres.reduce((s,p) => s + (p.montant_recu || 0), 0);
              const totalDu     = filtres.reduce((s,p) => s + (p.montant_du  || 0), 0);
              const kpiPaye     = filtres.filter(p=>p.statut==="paye").length;
              const kpiAttente  = filtres.filter(p=>p.statut==="en_attente").length;
              const kpiRefuse   = filtres.filter(p=>p.statut==="refuse").length;

              const exportCSV = () => {
                const rows = [["Client","Email","Inscription","Montant dû","Montant reçu","Mode","Statut","Réf transaction","Commercial","Date"]];
                filtres.forEach(p => rows.push([
                  p.client||"—", p.email||"—", p.inscription||"—",
                  p.montant_du||0, p.montant_recu||0, p.mode_paiement||"—",
                  p.statut||"—", p.ref_transaction||"—", p.commercial_nom||"—",
                  p.date_paiement||"—"
                ]));
                const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
                const blob = new Blob([csv],{type:"text/csv"});
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement("a"); a.href=url; a.download="paiements.csv"; a.click();
                URL.revokeObjectURL(url);
              };

              const hasFilter = paiementFiltre.statut!=="Tous"||paiementFiltre.mode!=="Tous"||paiementFiltre.search||paiementFiltre.dateDebut||paiementFiltre.dateFin;

              return (
                <>
                {/* ── Sous-onglets Paiements ── */}
                <div style={{ display:"flex", gap:4, marginBottom:20, background:"#f1f5f9", borderRadius:10, padding:4, width:"fit-content" }}>
                  {[
                    { key:"manuel",   label:"💳 Paiements manuels" },
                    { key:"cinetpay", label:"🌐 CinetPay en ligne", badge: cinetpayPaiements.filter(p=>p.statut==="validé"&&!p.traitee).length },
                  ].map(st => (
                    <button key={st.key} onClick={() => setPaiementsSubTab(st.key)} style={{
                      padding:"8px 16px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, position:"relative",
                      background: paiementsSubTab===st.key ? "#fff" : "transparent",
                      color:      paiementsSubTab===st.key ? BET_COLOR : "#6b7280",
                      boxShadow:  paiementsSubTab===st.key ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                    }}>
                      {st.label}
                      {st.badge > 0 && <span style={{ position:"absolute", top:4, right:4, background:"#dc2626", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800 }}>{st.badge}</span>}
                    </button>
                  ))}
                </div>

                {/* ── Panel Manuel ── */}
                {paiementsSubTab === "manuel" && (
                <div>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>💳 Paiements — Historique global</h2>
                      <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Toutes les transactions de toutes les commerciales</p>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={fetchPaiements} style={{ padding:"9px 14px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>🔄 Actualiser</button>
                      <button onClick={exportCSV} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇ Export CSV</button>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
                    <StatCard icon="💰" label="Total reçu (filtré)"  value={formatMoney(totalRecu)}        color="#22c55e" sub={`sur ${formatMoney(totalDu)} dû`} />
                    <StatCard icon="✅" label="Payés"                value={kpiPaye}                       color="#22c55e" sub={`${filtres.length} transactions filtrées`} />
                    <StatCard icon="⏳" label="En attente"           value={kpiAttente}                    color="#f59e0b" sub="À relancer" />
                    <StatCard icon="❌" label="Refusés"              value={kpiRefuse}                     color={BET_RED}  sub="Vérifier" />
                  </div>

                  {/* Filtres */}
                  <div style={{ background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", marginBottom:18 }}>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                      <input placeholder="🔍 Client, email, commerciale, réf…" value={paiementFiltre.search}
                        onChange={e=>{ setPaiementFiltre(p=>({...p,search:e.target.value})); setPaiementPage(1); }}
                        style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, minWidth:280, background:"#fff" }} />
                      <select value={paiementFiltre.statut} onChange={e=>{ setPaiementFiltre(p=>({...p,statut:e.target.value})); setPaiementPage(1); }}
                        style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                        <option value="Tous">Tous statuts</option>
                        {Object.entries(STATUT_PAI).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <select value={paiementFiltre.mode} onChange={e=>{ setPaiementFiltre(p=>({...p,mode:e.target.value})); setPaiementPage(1); }}
                        style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                        {modes.map(m=><option key={m} value={m}>{m==="Tous"?"Tous modes":m}</option>)}
                      </select>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:12, color:"#64748b", whiteSpace:"nowrap" }}>Du</span>
                        <input type="date" value={paiementFiltre.dateDebut}
                          onChange={e=>{ setPaiementFiltre(p=>({...p,dateDebut:e.target.value})); setPaiementPage(1); }}
                          style={{ padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, cursor:"pointer", background:"#fff" }} />
                        <span style={{ fontSize:12, color:"#64748b" }}>au</span>
                        <input type="date" value={paiementFiltre.dateFin}
                          onChange={e=>{ setPaiementFiltre(p=>({...p,dateFin:e.target.value})); setPaiementPage(1); }}
                          style={{ padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, cursor:"pointer", background:"#fff" }} />
                      </div>
                      <span style={{ fontSize:12, color:"#9ca3af", marginLeft:"auto" }}>{filtres.length} résultat(s)</span>
                      {hasFilter && (
                        <button onClick={()=>{ setPaiementFiltre({statut:"Tous",mode:"Tous",search:"",dateDebut:"",dateFin:""}); setPaiementPage(1); }}
                          style={{ padding:"6px 12px", background:"#fee2e2", color:BET_RED, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>✕ Réinitialiser</button>
                      )}
                    </div>
                  </div>

                  {/* Contenu */}
                  {loadingPaiements ? (
                    <div style={{ textAlign:"center", padding:"60px 0", color:"#9ca3af", fontSize:13 }}>⏳ Chargement des paiements…</div>
                  ) : paiements.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"60px 0" }}>
                      <div style={{ fontSize:40, marginBottom:10 }}>💳</div>
                      <div style={{ fontWeight:700, color:"#0f172a", marginBottom:6 }}>Aucun paiement enregistré</div>
                      <p style={{ color:"#9ca3af", fontSize:13 }}>Les paiements saisis par les commerciales apparaîtront ici.</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid #e5e7eb" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                          <thead>
                            <tr style={{ background:"#f8fafc" }}>
                              {["Client","Inscription","Montant dû","Montant reçu","Mode","Commercial","Statut","Date","Réf"].map(h=>(
                                <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9ca3af", borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pageItems.map(p => {
                              const st = STATUT_PAI[p.statut] || { label:p.statut||"—", bg:"#f3f4f6", color:"#374151" };
                              const initiales = (p.client||"?").split(" ").map(x=>x[0]||"").join("").slice(0,2).toUpperCase();
                              const solde = (p.montant_du||0) - (p.montant_recu||0);
                              return (
                                <tr key={p.id} onClick={()=>setPaiementModal(p)} style={{ borderBottom:"1px solid #f1f5f9", background:"#fff", cursor:"pointer", transition:"background .15s" }}
                                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                                  <td style={{ padding:"10px 12px" }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                                      <div style={{ width:32, height:32, borderRadius:"50%", background:"#8b5cf620", color:"#8b5cf6", fontWeight:800, fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{initiales}</div>
                                      <div>
                                        <div style={{ fontWeight:700, color:"#0f172a" }}>{p.client}</div>
                                        <div style={{ fontSize:11, color:"#9ca3af" }}>{p.email||"—"}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding:"10px 12px", fontSize:12, color:"#475569", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.inscription||"—"}</td>
                                  <td style={{ padding:"10px 12px", fontWeight:700, color:"#0f172a" }}>{formatMoney(p.montant_du||0)}</td>
                                  <td style={{ padding:"10px 12px" }}>
                                    <span style={{ fontWeight:700, color: solde===0?"#22c55e":solde>0?"#f59e0b":"#9ca3af" }}>{formatMoney(p.montant_recu||0)}</span>
                                    {solde > 0 && <div style={{ fontSize:10, color:"#f59e0b" }}>reste {formatMoney(solde)}</div>}
                                  </td>
                                  <td style={{ padding:"10px 12px" }}><span style={{ padding:"2px 8px", borderRadius:8, background:"#f3f4f6", fontSize:12 }}>{p.mode_paiement||"—"}</span></td>
                                  <td style={{ padding:"10px 12px", fontSize:12, color:"#475569", fontWeight:600 }}>{p.commercial_nom}</td>
                                  <td style={{ padding:"10px 12px" }}>
                                    <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:st.bg, color:st.color }}>{st.label}</span>
                                  </td>
                                  <td style={{ padding:"10px 12px", fontSize:11, color:"#9ca3af", whiteSpace:"nowrap" }}>
                                    {p.date_paiement ? new Date(p.date_paiement).toLocaleDateString("fr-FR") : "—"}
                                  </td>
                                  <td style={{ padding:"10px 12px", fontSize:11, color:"#94a3b8", fontFamily:"monospace" }}>{p.ref_transaction||"—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {filtres.length === 0 && (
                          <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:13 }}>Aucun paiement ne correspond aux filtres.</div>
                        )}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, padding:"0 4px" }}>
                          <span style={{ fontSize:12, color:"#9ca3af" }}>
                            {(page-1)*PAIEMENTS_PER_PAGE+1}–{Math.min(page*PAIEMENTS_PER_PAGE, filtres.length)} sur {filtres.length}
                          </span>
                          <div style={{ display:"flex", gap:4 }}>
                            <button onClick={()=>setPaiementPage(p=>Math.max(1,p-1))} disabled={page===1}
                              style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #e5e7eb", background:page===1?"#f9fafb":"#fff", color:page===1?"#d1d5db":"#374151", cursor:page===1?"not-allowed":"pointer", fontSize:13 }}>‹</button>
                            {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce((acc,n,idx,arr)=>{
                              if(idx>0&&arr[idx-1]!==n-1) acc.push("…");
                              acc.push(n); return acc;
                            },[]).map((n,i)=> n==="…"
                              ? <span key={`e${i}`} style={{ padding:"5px 6px", fontSize:13, color:"#9ca3af" }}>…</span>
                              : <button key={n} onClick={()=>setPaiementPage(n)}
                                  style={{ padding:"5px 10px", borderRadius:6, border:"1px solid", fontSize:13, cursor:"pointer", fontWeight:n===page?700:400,
                                    background:n===page?BET_COLOR:"#fff", color:n===page?"#fff":"#374151", borderColor:n===page?BET_COLOR:"#e5e7eb" }}>{n}</button>
                            )}
                            <button onClick={()=>setPaiementPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                              style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #e5e7eb", background:page===totalPages?"#f9fafb":"#fff", color:page===totalPages?"#d1d5db":"#374151", cursor:page===totalPages?"not-allowed":"pointer", fontSize:13 }}>›</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                )}

                {/* ── Panel CinetPay ── */}
                {paiementsSubTab === "cinetpay" && (() => {
                  const STATUT_CP = {
                    "validé":     { label:"✅ Validé",     bg:"#d1fae5", color:"#065f46" },
                    "en_attente": { label:"⏳ En attente", bg:"#fef9c3", color:"#854d0e" },
                    "échoué":     { label:"❌ Échoué",     bg:"#fee2e2", color:"#dc2626" },
                    "annulé":     { label:"↩ Annulé",     bg:"#f3f4f6", color:"#6b7280" },
                  };
                  const filtered = cinetpayPaiements.filter(p => {
                    const matchSearch = !cinetpaySearch ||
                      (p.client_nom||"").toLowerCase().includes(cinetpaySearch.toLowerCase()) ||
                      (p.client_email||"").toLowerCase().includes(cinetpaySearch.toLowerCase()) ||
                      (p.client_telephone||"").includes(cinetpaySearch) ||
                      (p.offre_label||"").toLowerCase().includes(cinetpaySearch.toLowerCase());
                    const matchStatut = cinetpayStatutFiltre === "tous" || p.statut === cinetpayStatutFiltre;
                    const matchTraitee = cinetpayTraiteeFiltre === "tous" || (cinetpayTraiteeFiltre === "non" ? !p.traitee : p.traitee);
                    return matchSearch && matchStatut && matchTraitee;
                  });
                  const nouveaux = cinetpayPaiements.filter(p=>p.statut==="validé"&&!p.traitee).length;

                  return (
                    <div>
                      {/* Header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                        <div>
                          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🌐 Paiements CinetPay — En ligne</h2>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Transactions initiées via le formulaire en ligne</p>
                        </div>
                        <button onClick={fetchCinetpayPaiements} style={{ padding:"9px 14px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>🔄 Actualiser</button>
                      </div>

                      {/* KPIs */}
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
                        <StatCard icon="💰" label="Total encaissé" value={formatMoney(cinetpayPaiements.filter(p=>p.statut==="validé").reduce((s,p)=>s+(p.montant||0),0))} color="#22c55e" sub="Paiements validés" />
                        <StatCard icon="✅" label="Validés" value={cinetpayPaiements.filter(p=>p.statut==="validé").length} color="#22c55e" sub="Confirmés par CinetPay" />
                        <StatCard icon="⏳" label="En attente" value={cinetpayPaiements.filter(p=>p.statut==="en_attente").length} color="#f59e0b" sub="À confirmer" />
                        <StatCard icon="🔔" label="Non traités" value={nouveaux} color={nouveaux>0?BET_RED:"#22c55e"} sub="Inscription à finaliser" />
                      </div>

                      {/* Filtres */}
                      <div style={{ background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", marginBottom:18 }}>
                        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                          <input placeholder="🔍 Nom, email, téléphone, offre…" value={cinetpaySearch}
                            onChange={e => setCinetpaySearch(e.target.value)}
                            style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, minWidth:260, background:"#fff" }} />
                          <select value={cinetpayStatutFiltre} onChange={e => setCinetpayStatutFiltre(e.target.value)}
                            style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                            <option value="tous">Tous statuts</option>
                            <option value="validé">✅ Validés</option>
                            <option value="en_attente">⏳ En attente</option>
                            <option value="échoué">❌ Échoués</option>
                            <option value="annulé">↩ Annulés</option>
                          </select>
                          <select value={cinetpayTraiteeFiltre} onChange={e => setCinetpayTraiteeFiltre(e.target.value)}
                            style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                            <option value="tous">Tous</option>
                            <option value="non">⚠️ Non traités</option>
                            <option value="oui">✅ Traités</option>
                          </select>
                          <span style={{ fontSize:12, color:"#9ca3af", marginLeft:"auto" }}>{filtered.length} résultat{filtered.length!==1?"s":""}</span>
                        </div>
                      </div>

                      {/* Table */}
                      {cinetpayLoading ? (
                        <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>Chargement…</div>
                      ) : filtered.length === 0 ? (
                        <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>Aucun paiement trouvé</div>
                      ) : (
                        <div style={{ overflowX:"auto" }}>
                          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                            <thead>
                              <tr style={{ background:"#f8fafc" }}>
                                {["Client","Email / Tél","Offre","Montant","Statut","Traité","Date","Actions"].map(h => (
                                  <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, fontSize:12, color:"#64748b", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((p, idx) => {
                                const st = STATUT_CP[p.statut] || { label:p.statut||"—", bg:"#f3f4f6", color:"#374151" };
                                const initiales = ((p.client_prenom||"").charAt(0)+(p.client_nom||"").charAt(0)).toUpperCase();
                                return (
                                  <tr key={p.id} style={{ background: idx%2===0?"#fff":"#f8fafc", borderBottom:"1px solid #f1f5f9" }}>
                                    <td style={{ padding:"12px 12px" }}>
                                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                        <div style={{ width:32, height:32, borderRadius:"50%", background:"#e0e7ff", color:"#4f46e5", fontWeight:800, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{initiales||"?"}</div>
                                        <div>
                                          <div style={{ fontWeight:700, color:"#0f172a" }}>{p.client_prenom} {p.client_nom}</div>
                                          <div style={{ fontSize:11, color:"#9ca3af" }}>{p.client_ville||"—"}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding:"12px 12px" }}>
                                      <div style={{ fontSize:12, color:"#374151" }}>{p.client_email||"—"}</div>
                                      <div style={{ fontSize:11, color:"#9ca3af" }}>{p.client_telephone||"—"}</div>
                                    </td>
                                    <td style={{ padding:"12px 12px" }}>
                                      <div style={{ fontWeight:600, color:"#0f172a" }}>{p.offre_label||"—"}</div>
                                      {p.offre_formule && <div style={{ fontSize:11, color:"#9ca3af" }}>{p.offre_formule}</div>}
                                      {p.offre_type && <div style={{ fontSize:10, color:"#6b7280", background:"#f1f5f9", display:"inline-block", padding:"1px 6px", borderRadius:4, marginTop:2 }}>{p.offre_type}</div>}
                                    </td>
                                    <td style={{ padding:"12px 12px" }}>
                                      <div style={{ fontWeight:800, fontSize:14, color:"#15803d" }}>{Number(p.montant||0).toLocaleString("fr-FR")} FCFA</div>
                                    </td>
                                    <td style={{ padding:"12px 12px" }}>
                                      <span style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:st.bg, color:st.color, whiteSpace:"nowrap" }}>{st.label}</span>
                                    </td>
                                    <td style={{ padding:"12px 12px" }}>
                                      {p.traitee ? (
                                        <span style={{ fontSize:11, color:"#16a34a", fontWeight:600 }}>✅ Traité</span>
                                      ) : p.statut === "validé" ? (
                                        <span style={{ fontSize:11, color:"#dc2626", fontWeight:700 }}>⚠️ À traiter</span>
                                      ) : (
                                        <span style={{ fontSize:11, color:"#9ca3af" }}>—</span>
                                      )}
                                    </td>
                                    <td style={{ padding:"12px 12px", whiteSpace:"nowrap", fontSize:12, color:"#64748b" }}>
                                      {p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                                    </td>
                                    <td style={{ padding:"12px 12px" }}>
                                      {p.statut === "validé" && !p.traitee && (
                                        <button onClick={() => marquerTraite(p.id)}
                                          style={{ padding:"6px 12px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                                          ✅ Marquer traité
                                        </button>
                                      )}
                                      {p.traitee && (
                                        <span style={{ fontSize:11, color:"#9ca3af" }}>
                                          {p.date_traitement ? new Date(p.date_traitement).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}) : "Traité"}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Modal détail paiement ── */}
                {paiementModal && (() => {
                  const pm = paiementModal;
                  const STATUT_PAI_M = {
                    paye:       { label:"✅ Payé",       bg:"#d1fae5", color:"#065f46" },
                    en_attente: { label:"⏳ En attente", bg:"#fef9c3", color:"#854d0e" },
                    partiel:    { label:"⚡ Partiel",    bg:"#fff7ed", color:"#92400e" },
                    refuse:     { label:"❌ Refusé",     bg:"#fee2e2", color:"#dc2626" },
                    rembourse:  { label:"↩ Remboursé",  bg:"#f3e8ff", color:"#7c3aed" },
                  };
                  const st = STATUT_PAI_M[pm.statut] || { label:pm.statut||"—", bg:"#f3f4f6", color:"#374151" };
                  const solde = (pm.montant_du||0) - (pm.montant_recu||0);
                  const initiales = (pm.client||"?").split(" ").map(x=>x[0]||"").join("").slice(0,2).toUpperCase();
                  return (
                    <div onClick={()=>setPaiementModal(null)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 25px 60px rgba(0,0,0,0.25)" }}>
                        {/* Header */}
                        <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#0891b2 100%)", borderRadius:"18px 18px 0 0", padding:"20px 24px", display:"flex", alignItems:"center", gap:14 }}>
                          <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,0.15)", color:"#fff", fontWeight:800, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{initiales}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:800, fontSize:17, color:"#fff" }}>{pm.client}</div>
                            <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:2 }}>{pm.email||"Aucun email"} · {pm.telephone||"—"}</div>
                          </div>
                          <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:st.bg, color:st.color }}>{st.label}</span>
                          <button onClick={()=>setPaiementModal(null)} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:32, height:32, color:"#fff", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                        </div>
                        {/* Body */}
                        <div style={{ padding:"24px" }}>
                          {/* Bloc financier */}
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
                            <div style={{ background:"#f0fdf4", borderRadius:12, padding:"14px 16px", textAlign:"center", border:"1px solid #bbf7d0" }}>
                              <div style={{ fontSize:11, color:"#16a34a", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Montant reçu</div>
                              <div style={{ fontSize:22, fontWeight:800, color:"#15803d", marginTop:4 }}>{formatMoney(pm.montant_recu||0)}</div>
                            </div>
                            <div style={{ background:"#fefce8", borderRadius:12, padding:"14px 16px", textAlign:"center", border:"1px solid #fde68a" }}>
                              <div style={{ fontSize:11, color:"#b45309", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Montant dû</div>
                              <div style={{ fontSize:22, fontWeight:800, color:"#92400e", marginTop:4 }}>{formatMoney(pm.montant_du||0)}</div>
                            </div>
                            <div style={{ background: solde===0?"#f0fdf4":solde>0?"#fff7ed":"#f8fafc", borderRadius:12, padding:"14px 16px", textAlign:"center", border:`1px solid ${solde===0?"#bbf7d0":solde>0?"#fed7aa":"#e5e7eb"}` }}>
                              <div style={{ fontSize:11, color: solde===0?"#16a34a":solde>0?"#c2410c":"#475569", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Solde</div>
                              <div style={{ fontSize:22, fontWeight:800, color: solde===0?"#15803d":solde>0?"#ea580c":"#64748b", marginTop:4 }}>{solde===0?"Soldé":solde>0?`-${formatMoney(solde)}`:`+${formatMoney(Math.abs(solde))}`}</div>
                            </div>
                          </div>

                          {/* Infos détail */}
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                            {[
                              ["📋 Inscription",     pm.inscription||"—"],
                              ["💳 Mode de paiement", pm.mode_paiement||"—"],
                              ["📅 Date",            pm.date_paiement ? new Date(pm.date_paiement).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}) : "—"],
                              ["🔖 Réf. transaction", pm.ref_transaction||"—"],
                              ["👤 Commercial(e)",   pm.commercial_nom||"—"],
                              ["🏷️ ID paiement",     pm.id?.slice(0,8)+"…"||"—"],
                              ["📧 Email",           pm.email||"—"],
                              ["📞 Téléphone",       pm.telephone||"—"],
                            ].map(([label,val])=>(
                              <div key={label} style={{ background:"#f8fafc", borderRadius:10, padding:"10px 14px" }}>
                                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:3 }}>{label}</div>
                                <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", wordBreak:"break-all" }}>{val}</div>
                              </div>
                            ))}
                          </div>

                          {/* Notes */}
                          {pm.notes && (
                            <div style={{ background:"#fefce8", borderRadius:10, padding:"12px 14px", marginBottom:16, border:"1px solid #fde68a" }}>
                              <div style={{ fontSize:11, color:"#92400e", fontWeight:600, marginBottom:4 }}>📝 Notes</div>
                              <div style={{ fontSize:13, color:"#78350f" }}>{pm.notes}</div>
                            </div>
                          )}

                          {/* Preuve image */}
                          {pm.preuve_image && (
                            <div style={{ marginBottom:16 }}>
                              <div style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:8 }}>🖼️ Preuve de paiement</div>
                              <img src={pm.preuve_image} alt="Preuve" style={{ maxWidth:"100%", borderRadius:10, border:"1px solid #e5e7eb" }} onError={e=>{e.currentTarget.style.display="none";}} />
                            </div>
                          )}

                          <button onClick={()=>setPaiementModal(null)} style={{ width:"100%", padding:12, background:"#f1f5f9", border:"none", borderRadius:10, fontSize:14, fontWeight:600, color:"#374151", cursor:"pointer" }}>Fermer</button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                </>
              );
            })()}


            {/* ================= ONGLET APPRENANTS & PROGRESSION ================= */}
            {activeTab === "suivi_apprenants" && apprenantSubTab === "progression" && (
              <div>
                {/* Sous-onglets */}
                <div style={{ display:"flex", gap:4, marginBottom:20, background:"#f1f5f9", borderRadius:10, padding:4, width:"fit-content" }}>
                  {[{ key:"liste", label:"🎓 Liste apprenants" }, { key:"progression", label:"📈 Progression" }].map(st => (
                    <button key={st.key} onClick={()=>setApprenantSubTab(st.key)}
                      style={{ padding:"7px 16px", borderRadius:8, border:"none", fontSize:13, fontWeight:600, cursor:"pointer",
                        background: apprenantSubTab===st.key ? "#fff" : "transparent",
                        color:      apprenantSubTab===st.key ? "#0891b2" : "#64748b",
                        boxShadow:  apprenantSubTab===st.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                        transition:"all .15s" }}>
                      {st.label}
                    </button>
                  ))}
                </div>
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

            {/* ══ ONGLET COURS (Cours privés + Groupes de cours) ══ */}
            {activeTab === "cours" && (
              <div>
                {/* Sous-onglets */}
                <div style={{ display:"flex", gap:4, marginBottom:20, background:"#f1f5f9", borderRadius:10, padding:4, width:"fit-content" }}>
                  {[
                    { k:"groupes",     l:"👥 Groupes cours" },
                    { k:"cours_prives", l:"🎯 Cours privés" },
                  ].map(st=>(
                    <button key={st.k} onClick={()=>{ setCoursSubTab(st.k); setAdminSelectedGroupe(null); }}
                      style={{ padding:"7px 18px", borderRadius:8, border:"none", fontSize:13, fontWeight:600, cursor:"pointer",
                        background:coursSubTab===st.k?"#fff":"transparent",
                        color:coursSubTab===st.k?BET_COLOR:"#64748b",
                        boxShadow:coursSubTab===st.k?"0 1px 4px rgba(0,0,0,0.1)":"none",
                        transition:"all .15s" }}>
                      {st.l}
                    </button>
                  ))}
                </div>

                {/* ── Sous-onglet : Groupes de cours ── */}
                {coursSubTab === "groupes" && (
                <div>
                {!adminSelectedGroupe ? (
                  <div>
                    {/* Header */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                      <div>
                        <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>👥 Groupes de cours — Vue globale</h2>
                        <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Consultation de tous les groupes d'apprenants</p>
                      </div>
                    </div>

                    {/* Filtre par coach */}
                    {adminGroupes.length > 0 && (
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
                        {["tous", ...Array.from(new Set(adminGroupes.map(g=>g.coach_nom||g.nom_coach||"Sans coach")))].map(coach=>(
                          <button key={coach} onClick={()=>setAdminFiltreCoach(coach)}
                            style={{ padding:"5px 12px", borderRadius:20, border:"1.5px solid", fontSize:12, fontWeight:600, cursor:"pointer",
                              background:adminFiltreCoach===coach?BET_COLOR:"#fff",
                              color:adminFiltreCoach===coach?"#fff":"#374151",
                              borderColor:adminFiltreCoach===coach?BET_COLOR:"#e5e7eb" }}>
                            {coach==="tous"?"Tous les coachs":coach}
                          </button>
                        ))}
                      </div>
                    )}

                    {adminGroupesLoading && <div style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:13 }}>Chargement des groupes…</div>}
                    {!adminGroupesLoading && adminGroupes.length === 0 && (
                      <div style={{ textAlign:"center", padding:60, color:"#9ca3af", fontSize:13 }}>Aucun groupe trouvé.</div>
                    )}
                    {!adminGroupesLoading && adminGroupes.length > 0 && (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                        {adminGroupes
                          .filter(g => adminFiltreCoach === "tous" || (g.coach_nom||g.nom_coach||"Sans coach") === adminFiltreCoach)
                          .map(g => (
                            <div key={g.id} style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"16px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                                <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{g.nom}</div>
                                <span style={{ padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:700,
                                  color:g.statut==="actif"?"#166534":"#6b7280",
                                  background:g.statut==="actif"?"#dcfce7":"#f1f5f9" }}>{g.statut==="actif"?"Actif":"Inactif"}</span>
                              </div>
                              <div style={{ fontSize:11, color:"#6b7280", marginBottom:10 }}>
                                {g.filiere||"—"} · Niveau {g.niveau||"—"} · {g.type_cours==="en_ligne"?"💻 En ligne":g.type_cours==="domicile"?"🏠 Domicile":"🏢 Centre"}
                              </div>
                              <div style={{ fontSize:11, color:"#374151", marginBottom:4 }}>👨‍🏫 {g.coach_nom||g.nom_coach||"Sans coach"}</div>
                              <div style={{ fontSize:11, color:"#374151", marginBottom:12 }}>👥 {g.nb_apprenants||0} apprenant(s)</div>
                              <button onClick={()=>fetchAdminGroupeDetail(g)}
                                style={{ width:"100%", padding:"7px 0", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                                Voir détail →
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── DETAIL VIEW ── */
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                      <button onClick={()=>{ setAdminSelectedGroupe(null); setAdminGroupeDetail({ apprenants:[], fichiers:[] }); }}
                        style={{ padding:"8px 14px", background:"#f1f5f9", color:"#374151", border:"1px solid #e5e7eb", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13 }}>
                        ← Retour
                      </button>
                      <div>
                        <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0f172a" }}>{adminSelectedGroupe.nom}</h2>
                        <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>
                          {adminSelectedGroupe.filiere||"—"} · Niveau {adminSelectedGroupe.niveau||"—"} · {adminSelectedGroupe.type_cours==="en_ligne"?"💻 En ligne":adminSelectedGroupe.type_cours==="domicile"?"🏠 Domicile":"🏢 Centre"}
                        </div>
                      </div>
                      <span style={{ marginLeft:"auto", padding:"3px 12px", borderRadius:99, fontSize:11, fontWeight:700,
                        color:adminSelectedGroupe.statut==="actif"?"#166534":"#6b7280",
                        background:adminSelectedGroupe.statut==="actif"?"#dcfce7":"#f1f5f9" }}>
                        {adminSelectedGroupe.statut==="actif"?"Actif":"Inactif"}
                      </span>
                    </div>

                    {/* Info cards */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:10, marginBottom:20 }}>
                      {[
                        { l:"Coach assigné", v: adminSelectedGroupe.coach_nom||adminSelectedGroupe.nom_coach||"—" },
                        { l:"Apprenants", v: adminSelectedGroupe.nb_apprenants||0 },
                        { l:"Date début", v: adminSelectedGroupe.date_debut ? new Date(adminSelectedGroupe.date_debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "—" },
                        { l:"Date fin", v: adminSelectedGroupe.date_fin ? new Date(adminSelectedGroupe.date_fin).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "—" },
                      ].map(s=>(
                        <div key={s.l} style={{ padding:"10px 12px", borderRadius:10, background:"#f8fafc", border:"1px solid #e5e7eb" }}>
                          <div style={{ fontSize:10, color:"#9ca3af", marginBottom:2 }}>{s.l}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{s.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Sub-tabs */}
                    <div style={{ display:"flex", gap:4, borderBottom:"2px solid #e5e7eb", marginBottom:20 }}>
                      {[
                        { k:"apprenants", l:"Apprenants" },
                        { k:"cours", l:"Historique cours" },
                        { k:"presences", l:"Présences" },
                      ].map(t=>(
                        <button key={t.k} onClick={()=>setAdminGroupeSubTab(t.k)}
                          style={{ padding:"8px 16px", border:"none", background:"none", fontWeight:700, fontSize:13, cursor:"pointer",
                            color:adminGroupeSubTab===t.k?BET_COLOR:"#64748b",
                            borderBottom:adminGroupeSubTab===t.k?`2px solid ${BET_COLOR}`:"2px solid transparent",
                            marginBottom:-2 }}>
                          {t.l}
                        </button>
                      ))}
                    </div>

                    {/* Apprenants sub-tab */}
                    {adminGroupeSubTab === "apprenants" && (
                      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                        <div style={{ padding:"14px 18px", borderBottom:"1px solid #e5e7eb", background:"#fafafa", fontSize:13, fontWeight:700, color:"#0f172a" }}>
                          Apprenants ({adminGroupeDetail.apprenants.filter(a=>a.statut!=="retire").length})
                        </div>
                        {adminGroupeDetail.apprenants.length === 0 && (
                          <div style={{ textAlign:"center", padding:32, color:"#9ca3af", fontSize:12 }}>Aucun apprenant dans ce groupe</div>
                        )}
                        {adminGroupeDetail.apprenants.filter(a=>a.statut!=="retire").map(a=>(
                          <div key={a.id} style={{ display:"flex", alignItems:"center", padding:"12px 18px", borderBottom:"1px solid #f1f5f9", gap:10 }}>
                            <div style={{ width:36, height:36, borderRadius:"50%", background:BET_COLOR+"20", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:BET_COLOR, flexShrink:0 }}>
                              {(a.prenom_apprenant||a.nom_apprenant||"?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{a.prenom_apprenant} {a.nom_apprenant}</div>
                              <div style={{ fontSize:11, color:"#6b7280" }}>{a.email_apprenant||"—"} {a.niveau ? `· Niveau ${a.niveau}` : ""}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cours sub-tab */}
                    {adminGroupeSubTab === "cours" && (() => {
                      const STATUT_COURS_CFG = {
                        dispense:{label:"Dispensé",color:"#065f46",bg:"#d1fae5",icon:"✅"},
                        annule:{label:"Annulé",color:"#991b1b",bg:"#fee2e2",icon:"❌"},
                        apprenant_absent:{label:"Apprenant absent",color:"#92400e",bg:"#fef3c7",icon:"👤"},
                        coach_absent:{label:"Coach absent",color:"#1e40af",bg:"#dbeafe",icon:"🏃"},
                        catch_up:{label:"Catch up",color:"#5b21b6",bg:"#ede9fe",icon:"🔄"},
                        holiday:{label:"Congé / Férié",color:"#374151",bg:"#f1f5f9",icon:"🏖️"},
                      };
                      return (
                        <div>
                          <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
                            <select value={adminCoursFiltreMois} onChange={e=>setAdminCoursFiltreMois(Number(e.target.value))}
                              style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:12 }}>
                              {["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"].map((m,i)=>(
                                <option key={i+1} value={i+1}>{m}</option>
                              ))}
                            </select>
                            <select value={adminCoursAnnee} onChange={e=>setAdminCoursAnnee(Number(e.target.value))}
                              style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:12 }}>
                              {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          {adminCoursLoading && <p style={{ color:"#9ca3af", textAlign:"center" }}>Chargement…</p>}
                          {!adminCoursLoading && adminCoursListe.length === 0 && <p style={{ color:"#9ca3af", textAlign:"center", padding:20 }}>Aucun cours ce mois-ci.</p>}
                          {!adminCoursLoading && adminCoursListe.length > 0 && (
                            <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid #e5e7eb" }}>
                              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                                <thead>
                                  <tr style={{ background:"#f8fafc" }}>
                                    {["Date","Statut","Objectif","Grammaire","Sujet discussion","Commentaire"].map((h,i)=>(
                                      <th key={i} style={{ padding:"9px 12px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11, borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {adminCoursListe.map((c,idx)=>{
                                    const s = STATUT_COURS_CFG[c.statut] || STATUT_COURS_CFG.dispense;
                                    return (
                                      <tr key={c.id} style={{ background:idx%2===0?"#fff":"#fafafa", borderBottom:"1px solid #f1f5f9" }}>
                                        <td style={{ padding:"9px 12px", fontWeight:600, whiteSpace:"nowrap" }}>{new Date(c.date_cours).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</td>
                                        <td style={{ padding:"9px 12px" }}><span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, background:s.bg, color:s.color }}>{s.icon} {s.label}</span></td>
                                        <td style={{ padding:"9px 12px", color:"#374151" }}>{c.objectif||"—"}</td>
                                        <td style={{ padding:"9px 12px", color:"#374151" }}>{c.grammaire||"—"}</td>
                                        <td style={{ padding:"9px 12px", color:"#374151" }}>{c.sujet_discussion||"—"}</td>
                                        <td style={{ padding:"9px 12px", color:"#6b7280" }}>{c.commentaire||"—"}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Présences sub-tab */}
                    {adminGroupeSubTab === "presences" && (
                      <div>
                        {adminPresences.length === 0 && <p style={{ color:"#9ca3af", textAlign:"center", padding:20 }}>Aucune présence enregistrée.</p>}
                        {(() => {
                          const parDate = {};
                          adminPresences.forEach(p=>{ if(!parDate[p.date_seance]) parDate[p.date_seance]=[]; parDate[p.date_seance].push(p); });
                          return Object.entries(parDate).sort(([a],[b])=>b.localeCompare(a)).map(([date,rows])=>{
                            const presents = rows.filter(r=>r.statut==="present").length;
                            const taux = rows.length ? Math.round(presents/rows.length*100) : 0;
                            return (
                              <div key={date} style={{ marginBottom:12, background:"#fff", borderRadius:10, border:"1px solid #e5e7eb", overflow:"hidden" }}>
                                <div style={{ padding:"10px 14px", background:"#f8fafc", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>📅 {new Date(date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</span>
                                  <span style={{ fontSize:11, fontWeight:700, color:taux>=80?"#059669":taux>=60?"#d97706":"#dc2626" }}>{presents}/{rows.length} — {taux}%</span>
                                </div>
                                <div style={{ padding:"10px 14px", display:"flex", flexWrap:"wrap", gap:6 }}>
                                  {rows.map(r=>(
                                    <span key={r.id} style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                                      background:r.statut==="present"?"#d1fae5":r.statut==="absent"?"#fee2e2":r.statut==="retard"?"#fef3c7":"#ede9fe",
                                      color:r.statut==="present"?"#065f46":r.statut==="absent"?"#991b1b":r.statut==="retard"?"#92400e":"#5b21b6" }}>
                                      {r.statut==="present"?"✅":r.statut==="absent"?"❌":r.statut==="retard"?"⏰":"📝"} {[r.prenom_apprenant,r.nom_apprenant].filter(Boolean).join(" ")}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}
                </div>
                )} {/* fin coursSubTab === "groupes" */}

                {/* ── Sous-onglet : Cours privés ── */}
                {coursSubTab === "cours_prives" && (() => {
                  const STATUT_CONTRAT = {
                    actif:    { bg:"#d1fae5", color:"#065f46",  label:"Actif" },
                    termine:  { bg:"#f1f5f9", color:"#374151",  label:"Terminé" },
                    suspendu: { bg:"#fee2e2", color:"#dc2626",  label:"Suspendu" },
                    en_attente:{ bg:"#fef3c7", color:"#92400e", label:"En attente" },
                  };
                  const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "—";

                  const filteredContrats = adminAllContrats.filter(c => {
                    if (adminContratFiltre.statut !== "tous" && c.statut !== adminContratFiltre.statut) return false;
                    if (adminContratFiltre.coach  !== "tous" && String(c.coach_id) !== adminContratFiltre.coach) return false;
                    if (adminContratFiltre.search) {
                      const q = adminContratFiltre.search.toLowerCase();
                      const nom = `${c.apprenant_prenom||""} ${c.apprenant_nom||""}`.toLowerCase();
                      if (!nom.includes(q) && !(c.apprenant_email||"").toLowerCase().includes(q) && !(c.coach_nom||"").toLowerCase().includes(q)) return false;
                    }
                    return true;
                  });

                  const totalPages = Math.max(1, Math.ceil(filteredContrats.length / CONTRATS_PER_PAGE));
                  const page = Math.min(adminContratPage, totalPages);
                  const pageItems = filteredContrats.slice((page-1)*CONTRATS_PER_PAGE, page*CONTRATS_PER_PAGE);

                  const coaches = Array.from(new Map(adminAllContrats.filter(c=>c.coach_id).map(c=>[c.coach_id, c.coach_nom||c.coach_id])));

                  return (
                    <div>
                      {/* Header */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                        <div>
                          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🎯 Cours privés — Vue globale</h2>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Tous les contrats de cours individuels</p>
                        </div>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <span style={{ padding:"4px 12px", borderRadius:20, background:BET_LIGHT, color:BET_COLOR, fontWeight:700, fontSize:12 }}>
                            {filteredContrats.length} contrat(s)
                          </span>
                        </div>
                      </div>

                      {/* Filtres */}
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
                        <input
                          value={adminContratFiltre.search}
                          onChange={e=>{ setAdminContratFiltre(p=>({...p,search:e.target.value})); setAdminContratPage(1); }}
                          placeholder="Rechercher apprenant ou coach…"
                          style={{ padding:"7px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, width:240 }}
                        />
                        <select value={adminContratFiltre.statut} onChange={e=>{ setAdminContratFiltre(p=>({...p,statut:e.target.value})); setAdminContratPage(1); }}
                          style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, background:"#fff" }}>
                          <option value="tous">Tous statuts</option>
                          {Object.entries(STATUT_CONTRAT).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                        {coaches.length > 0 && (
                          <select value={adminContratFiltre.coach} onChange={e=>{ setAdminContratFiltre(p=>({...p,coach:e.target.value})); setAdminContratPage(1); }}
                            style={{ padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, background:"#fff" }}>
                            <option value="tous">Tous les coachs</option>
                            {coaches.map(([id,nom])=><option key={id} value={String(id)}>{nom}</option>)}
                          </select>
                        )}
                      </div>

                      {/* Contenu */}
                      {adminAllContratsLoad && <div style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:13 }}>Chargement des contrats…</div>}
                      {!adminAllContratsLoad && adminAllContrats.length === 0 && (
                        <div style={{ textAlign:"center", padding:60, color:"#9ca3af", fontSize:13 }}>Aucun contrat de cours privé trouvé.</div>
                      )}
                      {!adminAllContratsLoad && filteredContrats.length === 0 && adminAllContrats.length > 0 && (
                        <div style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:13 }}>Aucun contrat ne correspond aux filtres.</div>
                      )}
                      {!adminAllContratsLoad && pageItems.length > 0 && (
                        <div style={{ overflowX:"auto", borderRadius:12, border:"1px solid #e5e7eb" }}>
                          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                            <thead>
                              <tr style={{ background:"#f8fafc" }}>
                                {["Apprenant","Coach","Type","Niveau","Prix/h","Séances","Statut","Début","Fin"].map((h,i)=>(
                                  <th key={i} style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11, borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {pageItems.map((c,idx)=>{
                                const s = STATUT_CONTRAT[c.statut] || { bg:"#f1f5f9", color:"#6b7280", label: c.statut||"—" };
                                const TYPE_LABEL = { en_ligne:"💻 En ligne", domicile:"🏠 Domicile", centre:"🏢 Centre" };
                                return (
                                  <tr key={c.id} style={{ background:idx%2===0?"#fff":"#fafafa", borderBottom:"1px solid #f1f5f9" }}>
                                    <td style={{ padding:"10px 14px" }}>
                                      <div style={{ fontWeight:700, color:"#0f172a", fontSize:13 }}>{c.apprenant_prenom} {c.apprenant_nom}</div>
                                      <div style={{ fontSize:11, color:"#6b7280" }}>{c.apprenant_email||"—"}</div>
                                    </td>
                                    <td style={{ padding:"10px 14px", color:"#374151" }}>{c.coach_nom||"—"}</td>
                                    <td style={{ padding:"10px 14px", color:"#374151", whiteSpace:"nowrap" }}>{TYPE_LABEL[c.type_contrat]||c.type_contrat||"—"}</td>
                                    <td style={{ padding:"10px 14px", color:"#374151" }}>{c.niveau||"—"}</td>
                                    <td style={{ padding:"10px 14px", fontWeight:600, color:"#0f172a", whiteSpace:"nowrap" }}>{c.prix_h ? `${Number(c.prix_h).toLocaleString("fr-FR")} F` : "—"}</td>
                                    <td style={{ padding:"10px 14px", color:"#374151" }}>{c.nb_seances_total||"—"}</td>
                                    <td style={{ padding:"10px 14px" }}>
                                      <span style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:s.bg, color:s.color }}>{s.label}</span>
                                    </td>
                                    <td style={{ padding:"10px 14px", color:"#374151", whiteSpace:"nowrap" }}>{fmtDate(c.date_debut)}</td>
                                    <td style={{ padding:"10px 14px", color:"#374151", whiteSpace:"nowrap" }}>{fmtDate(c.date_fin)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:16 }}>
                          <button onClick={()=>setAdminContratPage(p=>Math.max(1,p-1))} disabled={page===1}
                            style={{ padding:"6px 12px", border:"1.5px solid #e5e7eb", borderRadius:7, background:"#fff", cursor:page===1?"default":"pointer", fontSize:12, color:"#374151", opacity:page===1?0.5:1 }}>
                            ← Préc.
                          </button>
                          {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                            <button key={n} onClick={()=>setAdminContratPage(n)}
                              style={{ padding:"6px 12px", border:"1.5px solid", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer",
                                borderColor:n===page?BET_COLOR:"#e5e7eb",
                                background:n===page?BET_COLOR:"#fff",
                                color:n===page?"#fff":"#374151" }}>
                              {n}
                            </button>
                          ))}
                          <button onClick={()=>setAdminContratPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                            style={{ padding:"6px 12px", border:"1.5px solid #e5e7eb", borderRadius:7, background:"#fff", cursor:page===totalPages?"default":"pointer", fontSize:12, color:"#374151", opacity:page===totalPages?0.5:1 }}>
                            Suiv. →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            )}

            {/* ================= ONGLET APPRENANTS — liste ================= */}
            {activeTab === "suivi_apprenants" && apprenantSubTab === "liste" && (() => {
              const STATUT_LABEL = { nouveau:"Nouveau", contacte:"Contacté", en_cours:"En cours", converti:"Converti", annule:"Annulé", termine:"Terminé" };
              const STATUT_STYLE = {
                nouveau:  { bg:"#eff6ff", color:BET_COLOR },
                contacte: { bg:"#fff7ed", color:"#92400e" },
                en_cours: { bg:"#fef9c3", color:"#854d0e" },
                converti: { bg:"#d1fae5", color:"#065f46" },
                annule:   { bg:"#fee2e2", color:"#dc2626" },
                termine:  { bg:"#f3f4f6", color:"#374151" },
              };
              const PAI_STYLE = {
                paye:      { bg:"#d1fae5", color:"#065f46" },
                en_attente:{ bg:"#fef9c3", color:"#854d0e" },
                partiel:   { bg:"#fff7ed", color:"#92400e" },
                impaye:    { bg:"#fee2e2", color:"#dc2626" },
              };

              const filtres = apprenants.filter(a => {
                if (apprenantFiltre.type_cours !== "Tous" && a.type_cours !== apprenantFiltre.type_cours) return false;
                if (apprenantFiltre.centre     !== "Tous" && a.centre_id  !== apprenantFiltre.centre)    return false;
                if (apprenantFiltre.statut     !== "Tous" && a.statut     !== apprenantFiltre.statut)    return false;
                if (apprenantFiltre.search) {
                  const q = apprenantFiltre.search.toLowerCase();
                  if (!a.nom.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q) && !a.commercial.toLowerCase().includes(q)) return false;
                }
                return true;
              });

              const totalPages = Math.max(1, Math.ceil(filtres.length / APPRENANTS_PER_PAGE));
              const page       = Math.min(apprenantPage, totalPages);
              const pageItems  = filtres.slice((page-1)*APPRENANTS_PER_PAGE, page*APPRENANTS_PER_PAGE);

              const kpiTotal    = apprenants.length;
              const kpiConvert  = apprenants.filter(a=>a.statut==="converti").length;
              const kpiEnLigne  = apprenants.filter(a=>a.type_cours==="en_ligne").length;
              const kpiPaye     = apprenants.filter(a=>a.statut_paiement==="paye").length;

              const exportCSV = () => {
                const rows = [["Nom","Email","Téléphone","Type cours","Coaching","Centre","Commercial","Statut","Paiement","Inscrit le"]];
                filtres.forEach(a => rows.push([a.nom,a.email,a.telephone,a.type_cours,a.type_coaching,a.centre_id||"—",a.commercial,a.statut,a.statut_paiement||"—",a.created_at?.slice(0,10)||"—"]));
                const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
                const blob = new Blob([csv],{type:"text/csv"});
                const url  = URL.createObjectURL(blob);
                const link = document.createElement("a"); link.href=url; link.download="apprenants.csv"; link.click();
                URL.revokeObjectURL(url);
              };

              const hasFilter = apprenantFiltre.type_cours!=="Tous"||apprenantFiltre.centre!=="Tous"||apprenantFiltre.statut!=="Tous"||apprenantFiltre.search;

              return (
                <div>
                  {/* Sous-onglets */}
                  <div style={{ display:"flex", gap:4, marginBottom:20, background:"#f1f5f9", borderRadius:10, padding:4, width:"fit-content" }}>
                    {[{ key:"liste", label:"🎓 Liste apprenants" }, { key:"progression", label:"📈 Progression" }].map(st => (
                      <button key={st.key} onClick={()=>setApprenantSubTab(st.key)}
                        style={{ padding:"7px 16px", borderRadius:8, border:"none", fontSize:13, fontWeight:600, cursor:"pointer",
                          background: apprenantSubTab===st.key ? "#fff" : "transparent",
                          color:      apprenantSubTab===st.key ? "#0891b2" : "#64748b",
                          boxShadow:  apprenantSubTab===st.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                          transition:"all .15s" }}>
                        {st.label}
                      </button>
                    ))}
                  </div>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>🎓 Apprenants & Prospects</h2>
                      <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Toutes les assignations parcours — données réelles</p>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={fetchApprenants} style={{ padding:"9px 14px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>🔄 Actualiser</button>
                      <button onClick={exportCSV} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>⬇ Export CSV</button>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
                    {[
                      { icon:"🎓", label:"Total inscrits",    value:kpiTotal,   color:BET_COLOR, sub:"Toutes assignations" },
                      { icon:"💻", label:"Cours en ligne",    value:kpiEnLigne, color:"#8b5cf6", sub:`${kpiTotal-kpiEnLigne} présentiel` },
                      { icon:"✅", label:"Convertis",         value:kpiConvert, color:"#22c55e", sub:"Inscription finalisée" },
                      { icon:"💳", label:"Paiements reçus",   value:kpiPaye,    color:"#f59e0b", sub:"Statut paiement = payé" },
                    ].map((k,i) => <StatCard key={i} {...k} />)}
                  </div>

                  {/* Filtres */}
                  <div style={{ background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", marginBottom:18 }}>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                      <input placeholder="🔍 Nom, email ou commercial…" value={apprenantFiltre.search}
                        onChange={e=>{ setApprenantFiltre(p=>({...p,search:e.target.value})); setApprenantPage(1); }}
                        style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, minWidth:240, background:"#fff" }} />
                      <select value={apprenantFiltre.type_cours} onChange={e=>{ setApprenantFiltre(p=>({...p,type_cours:e.target.value})); setApprenantPage(1); }}
                        style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                        <option value="Tous">Tous les types</option>
                        <option value="en_ligne">💻 En ligne</option>
                        <option value="presentiel">🏢 Présentiel</option>
                      </select>
                      <select value={apprenantFiltre.centre} onChange={e=>{ setApprenantFiltre(p=>({...p,centre:e.target.value})); setApprenantPage(1); }}
                        style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                        <option value="Tous">🏢 Tous les centres</option>
                        {CENTRES_BET.map(c=><option key={c.id} value={c.id}>{c.label.replace("BET ","")}</option>)}
                      </select>
                      <select value={apprenantFiltre.statut} onChange={e=>{ setApprenantFiltre(p=>({...p,statut:e.target.value})); setApprenantPage(1); }}
                        style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" }}>
                        <option value="Tous">Tous statuts</option>
                        {Object.entries(STATUT_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                      </select>
                      <span style={{ fontSize:12, color:"#9ca3af", marginLeft:"auto" }}>{filtres.length} résultat(s)</span>
                      {hasFilter && (
                        <button onClick={()=>{ setApprenantFiltre({type_cours:"Tous",centre:"Tous",statut:"Tous",search:""}); setApprenantPage(1); }}
                          style={{ padding:"6px 12px", background:"#fee2e2", color:BET_RED, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>✕ Réinitialiser</button>
                      )}
                    </div>
                  </div>

                  {/* Contenu */}
                  {loadingApprenants ? (
                    <div style={{ textAlign:"center", padding:"60px 0", color:"#9ca3af", fontSize:13 }}>⏳ Chargement des apprenants…</div>
                  ) : apprenants.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"60px 0" }}>
                      <div style={{ fontSize:40, marginBottom:10 }}>🎓</div>
                      <div style={{ fontWeight:700, color:"#0f172a", marginBottom:6 }}>Aucun apprenant enregistré</div>
                      <p style={{ color:"#9ca3af", fontSize:13 }}>Les prospects assignés par les commerciales apparaîtront ici.</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid #e5e7eb" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                          <thead>
                            <tr style={{ background:"#f8fafc" }}>
                              {["Apprenant","Type cours","Coaching","Centre","Commerciale","Statut","Paiement","Date",""].map(h=>(
                                <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#9ca3af", borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pageItems.map(a => {
                              const initiales = a.nom.split(" ").map(p=>p[0]||"").join("").slice(0,2).toUpperCase();
                              const centreLabel = CENTRES_BET.find(c=>c.id===a.centre_id)?.label.replace("BET ","") || a.centre_nom || a.centre_id || "—";
                              const st  = STATUT_STYLE[a.statut]          || { bg:"#f3f4f6", color:"#374151" };
                              const pai = PAI_STYLE[a.statut_paiement]    || null;
                              return (
                                <tr key={a.id} style={{ borderBottom:"1px solid #f1f5f9", background:"#fff" }}>
                                  <td style={{ padding:"10px 12px" }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                      <div style={{ width:34, height:34, borderRadius:"50%", background:"#8b5cf620", color:"#8b5cf6", fontWeight:800, fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{initiales}</div>
                                      <div>
                                        <div style={{ fontWeight:700, color:"#0f172a" }}>{a.nom}</div>
                                        <div style={{ fontSize:11, color:"#9ca3af" }}>{a.email}</div>
                                        {a.telephone && <div style={{ fontSize:11, color:"#94a3b8" }}>{a.telephone}</div>}
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding:"10px 12px" }}>
                                    <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700,
                                      background: a.type_cours==="en_ligne"?"#ede9fe":"#e0f2fe",
                                      color: a.type_cours==="en_ligne"?"#7c3aed":BET_COLOR }}>
                                      {a.type_cours==="en_ligne"?"💻 En ligne":"🏢 Présentiel"}
                                    </span>
                                  </td>
                                  <td style={{ padding:"10px 12px", fontSize:12, color:"#475569" }}>{a.type_coaching || "—"}</td>
                                  <td style={{ padding:"10px 12px" }}>
                                    {a.centre_id
                                      ? <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700, background:"#e0f2fe", color:BET_COLOR }}>🏢 {centreLabel}</span>
                                      : <span style={{ fontSize:11, color:"#fca5a5", fontWeight:600 }}>⚠ Non assigné</span>}
                                  </td>
                                  <td style={{ padding:"10px 12px", fontSize:12, color:"#475569", fontWeight:600 }}>{a.commercial}</td>
                                  <td style={{ padding:"10px 12px" }}>
                                    <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:st.bg, color:st.color }}>
                                      {STATUT_LABEL[a.statut] || a.statut}
                                    </span>
                                  </td>
                                  <td style={{ padding:"10px 12px" }}>
                                    {pai
                                      ? <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:pai.bg, color:pai.color }}>{a.statut_paiement}</span>
                                      : <span style={{ fontSize:11, color:"#d1d5db" }}>—</span>}
                                  </td>
                                  <td style={{ padding:"10px 12px", fontSize:11, color:"#9ca3af", whiteSpace:"nowrap" }}>
                                    {a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : "—"}
                                  </td>
                                  <td style={{ padding:"10px 12px" }}>
                                    <button onClick={()=>setSelectedApprenant(a)} style={{ padding:"5px 12px", background:BET_LIGHT, color:BET_COLOR, border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:12 }}>Détail →</button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {filtres.length === 0 && (
                          <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:13 }}>Aucun apprenant ne correspond aux filtres.</div>
                        )}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, padding:"0 4px" }}>
                          <span style={{ fontSize:12, color:"#9ca3af" }}>
                            {(page-1)*APPRENANTS_PER_PAGE+1}–{Math.min(page*APPRENANTS_PER_PAGE, filtres.length)} sur {filtres.length}
                          </span>
                          <div style={{ display:"flex", gap:4 }}>
                            <button onClick={()=>setApprenantPage(p=>Math.max(1,p-1))} disabled={page===1}
                              style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #e5e7eb", background:page===1?"#f9fafb":"#fff", color:page===1?"#d1d5db":"#374151", cursor:page===1?"not-allowed":"pointer", fontSize:13 }}>‹</button>
                            {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce((acc,n,idx,arr)=>{
                              if(idx>0&&arr[idx-1]!==n-1) acc.push("…");
                              acc.push(n); return acc;
                            },[]).map((n,i)=> n==="…"
                              ? <span key={`e${i}`} style={{ padding:"5px 6px", fontSize:13, color:"#9ca3af" }}>…</span>
                              : <button key={n} onClick={()=>setApprenantPage(n)}
                                  style={{ padding:"5px 10px", borderRadius:6, border:"1px solid", fontSize:13, cursor:"pointer", fontWeight:n===page?700:400,
                                    background:n===page?BET_COLOR:"#fff", color:n===page?"#fff":"#374151", borderColor:n===page?BET_COLOR:"#e5e7eb" }}>{n}</button>
                            )}
                            <button onClick={()=>setApprenantPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                              style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #e5e7eb", background:page===totalPages?"#f9fafb":"#fff", color:page===totalPages?"#d1d5db":"#374151", cursor:page===totalPages?"not-allowed":"pointer", fontSize:13 }}>›</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
            {/* Photo de profil — commune à tous les rôles */}
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16, padding:"14px 16px", background:"#f8fafc", borderRadius:10, border:"1px solid #e5e7eb" }}>
              <div style={{ width:72, height:72, borderRadius:"50%", overflow:"hidden", background:"#e5e7eb", border:"2px solid #d1d5db", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {inviteForm.photo
                  ? <img src={inviteForm.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span style={{ fontSize:30 }}>👤</span>
                }
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 }}>Photo de profil</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <label style={{ padding:"7px 14px", background:invitePhotoUploading?"#9ca3af":"#0f172a", color:"#fff", borderRadius:7, fontSize:12, fontWeight:600, cursor:invitePhotoUploading?"not-allowed":"pointer", display:"inline-block" }}>
                    {invitePhotoUploading ? "⏳ Upload…" : "📷 Choisir une photo"}
                    <input type="file" accept="image/*" style={{ display:"none" }} disabled={invitePhotoUploading}
                      onChange={e => { if (e.target.files?.[0]) uploadInvitePhoto(e.target.files[0]); }} />
                  </label>
                  {inviteForm.photo && (
                    <button onClick={()=>setInviteForm(p=>({...p,photo:""}))}
                      style={{ padding:"6px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, fontSize:11, cursor:"pointer", fontWeight:600 }}>
                      ✕ Retirer
                    </button>
                  )}
                </div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>Optionnel — JPG, PNG recommandé</div>
              </div>
            </div>

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

            {/* ── Section Coach ── */}
            {inviteForm.role === "coach" && (
              <div style={{ marginBottom:14, padding:"16px 18px", borderRadius:12, background:"#eef2ff", border:"2px solid #c7d2fe" }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#3730a3", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                  🎓 Profil coach
                </div>

                {/* Matricule + Filière */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Matricule</label>
                    <input value={inviteForm.coach_matricule} onChange={e=>setInviteForm(p=>({...p,coach_matricule:e.target.value}))}
                      style={{ padding:"8px 10px", border:"1.5px solid #c7d2fe", borderRadius:7, fontSize:13, width:"100%", boxSizing:"border-box" }}
                      placeholder="EX : BET-C-001" />
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Filière / Spécialité</label>
                    <select value={inviteForm.coach_filiere} onChange={e=>setInviteForm(p=>({...p,coach_filiere:e.target.value}))}
                      style={{ padding:"8px 10px", border:"1.5px solid #c7d2fe", borderRadius:7, fontSize:13, width:"100%", background:"#fff", boxSizing:"border-box" }}>
                      <option value="">— Choisir —</option>
                      {["Anglais Général","Anglais Business","Préparation TOEIC","Préparation IELTS","Préparation TOEFL","Anglais Enfants","Prise de parole","Traduction","Autre"].map(f=>(
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lieu d'habitation + Date début */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Lieu d'habitation</label>
                    <input value={inviteForm.coach_lieu_habitation} onChange={e=>setInviteForm(p=>({...p,coach_lieu_habitation:e.target.value}))}
                      style={{ padding:"8px 10px", border:"1.5px solid #c7d2fe", borderRadius:7, fontSize:13, width:"100%", boxSizing:"border-box" }}
                      placeholder="Ex : Cocody, Abidjan" />
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Date de début à BET</label>
                    <input type="date" value={inviteForm.coach_date_debut} onChange={e=>setInviteForm(p=>({...p,coach_date_debut:e.target.value}))}
                      style={{ padding:"8px 10px", border:"1.5px solid #c7d2fe", borderRadius:7, fontSize:13, width:"100%", boxSizing:"border-box" }} />
                  </div>
                </div>

                {/* Nb contrats actifs */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Nombre de contrats actifs</label>
                  <input type="number" min={0} value={inviteForm.coach_nb_contrats}
                    onChange={e=>setInviteForm(p=>({...p,coach_nb_contrats:parseInt(e.target.value)||0}))}
                    style={{ width:100, padding:"8px 10px", border:"1.5px solid #c7d2fe", borderRadius:7, fontSize:14, fontWeight:700, textAlign:"center" }} />
                </div>

                {/* Certifications */}
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#374151", marginBottom:6 }}>🏆 Certifications</label>
                  {/* Quick-add badges */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                    {["CELTA","DELTA","TEFL","TOEIC Expert","IELTS 7+","TOEFL iBT","Cambridge TKT","Diplôme universitaire"].map(cert => {
                      const active = inviteForm.coach_certifications.includes(cert);
                      return (
                        <button key={cert} type="button"
                          onClick={() => setInviteForm(p => ({
                            ...p,
                            coach_certifications: active
                              ? p.coach_certifications.filter(c=>c!==cert)
                              : [...p.coach_certifications, cert]
                          }))}
                          style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:`1.5px solid ${active?"#6366f1":"#c7d2fe"}`, background:active?"#6366f1":"#fff", color:active?"#fff":"#6366f1" }}>
                          {active ? "✓ " : "+ "}{cert}
                        </button>
                      );
                    })}
                  </div>
                  {/* Saisie libre */}
                  <div style={{ display:"flex", gap:6 }}>
                    <input value={inviteForm.coach_certif_input}
                      onChange={e=>setInviteForm(p=>({...p,coach_certif_input:e.target.value}))}
                      onKeyDown={e=>{
                        if ((e.key==="Enter"||e.key===",") && inviteForm.coach_certif_input.trim()) {
                          e.preventDefault();
                          const v=inviteForm.coach_certif_input.trim().replace(/,$/,"");
                          if (v && !inviteForm.coach_certifications.includes(v))
                            setInviteForm(p=>({...p,coach_certifications:[...p.coach_certifications,v],coach_certif_input:""}));
                          else setInviteForm(p=>({...p,coach_certif_input:""}));
                        }
                      }}
                      placeholder="Autre certification… (Entrée pour ajouter)"
                      style={{ flex:1, padding:"7px 10px", border:"1.5px solid #c7d2fe", borderRadius:7, fontSize:12 }} />
                    <button type="button"
                      onClick={()=>{
                        const v=inviteForm.coach_certif_input.trim();
                        if (v && !inviteForm.coach_certifications.includes(v))
                          setInviteForm(p=>({...p,coach_certifications:[...p.coach_certifications,v],coach_certif_input:""}));
                      }}
                      style={{ padding:"7px 12px", background:"#6366f1", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer" }}>+ Ajouter</button>
                  </div>
                  {/* Tags ajoutés */}
                  {inviteForm.coach_certifications.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                      {inviteForm.coach_certifications.map(c => (
                        <span key={c} style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, background:"#ede9fe", color:"#5b21b6", fontSize:11, fontWeight:600 }}>
                          🏆 {c}
                          <button type="button" onClick={()=>setInviteForm(p=>({...p,coach_certifications:p.coach_certifications.filter(x=>x!==c)}))}
                            style={{ background:"none", border:"none", cursor:"pointer", color:"#7c3aed", fontWeight:800, fontSize:12, padding:0, lineHeight:1 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
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
            <div style={{ display:"flex", gap:10 }}><button onClick={async()=>{ const old=users.find(u=>u.id===editingUser.id); try { const res = await fetch(`${API_URL}/api/admin/utilisateurs/${editingUser.id}`, { method:"PATCH", headers:{ ...authHeaders(), "Content-Type":"application/json" }, body: JSON.stringify({ nom: editingUser.nom, prenom: editingUser.prenom, telephone: editingUser.telephone, avatar_url: editingUser.avatar_url, role: editingUser.role }) }); if (!res.ok) { const e = await res.json().catch(()=>({})); toast.error(e.error||"Erreur lors de la sauvegarde"); return; } setUsers(users.map(u=>u.id===editingUser.id?editingUser:u)); if(old.role!==editingUser.role) addAuditEntry("ROLE_MODIFIE",`${editingUser.nom} : ${old.role} → ${editingUser.role}`); toast.success("Modifications enregistrées ✓"); setShowUserModal(false); } catch(err){ toast.error("Erreur réseau"); } }} style={{ padding:"9px 16px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>💾 Enregistrer</button><button onClick={()=>setShowUserModal(false)} style={{ padding:"9px 16px", background:"#e5e7eb", color:"#374151", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontSize:12 }}>Annuler</button></div>
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
        {selectedCoach && (() => {
          const coach = selectedCoach;
          const photoUrl = coach.avatar_url || coach.coach_info?.photo_url || null;
          const initiales = ((coach.prenom?.[0]||"")+(coach.nom?.[0]||"")).toUpperCase() || "CO";
          const centre = (coach.scope?.filter(s=>s!=="national")||[]).join(", ") || "National";
          const fmtMoney = v => v != null ? Number(v).toLocaleString("fr-FR")+" F" : "—";
          const fmtDate  = d => d ? new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}) : "—";
          const CONTRAT_TYPE = {
            en_ligne:        { label:"En ligne",      icon:"💻", color:"#0891b2", bg:"#e0f2fe" },
            presentiel_bet:  { label:"Présentiel BET",icon:"🏢", color:"#7c3aed", bg:"#ede9fe" },
            domicile:        { label:"À domicile",    icon:"🏠", color:"#d97706", bg:"#fef3c7" },
          };
          const CONTRAT_STATUT = {
            en_attente:   { label:"En attente",    color:"#d97706", bg:"#fef3c7" },
            actif:        { label:"Actif",          color:"#16a34a", bg:"#dcfce7" },
            suspendu:     { label:"Suspendu",       color:"#9ca3af", bg:"#f3f4f6" },
            termine:      { label:"Terminé",        color:"#6b7280", bg:"#f3f4f6" },
            renouvele:    { label:"Renouvelé",      color:"#2563eb", bg:"#dbeafe" },
            non_renouvele:{ label:"Non renouvelé",  color:"#dc2626", bg:"#fee2e2" },
          };
          const RENOUV_STATUT = {
            en_attente: { label:"En attente",  color:"#d97706", bg:"#fef3c7" },
            confirme:   { label:"Confirmé",    color:"#16a34a", bg:"#dcfce7" },
            refuse:     { label:"Refusé",      color:"#dc2626", bg:"#fee2e2" },
          };

          // Honoraires — calcul par contrat
          const honoraires = coachContrats.map(c => ({
            ...c,
            montant_total: (c.prix_h || 0) * (c.duree_seance_h || 1.5) * (c.nb_seances_total || 0),
            montant_realise: (c.prix_h || 0) * (c.duree_seance_h || 1.5) * (c.nb_seances_realisees || 0),
          }));
          const totalDu     = honoraires.reduce((s,h) => s + h.montant_total,    0);
          const totalRealise = honoraires.reduce((s,h) => s + h.montant_realise, 0);
          const contratsActifs = coachContrats.filter(c=>c.statut==="actif").length;

          // Renouvellement — contrats à échéance < 60j ou avec statut renouvellement
          const today = new Date(); today.setHours(0,0,0,0);
          const contratsARenouveler = coachContrats.filter(c => {
            if (!c.date_fin) return false;
            const fin = new Date(c.date_fin);
            const joursRestants = Math.ceil((fin - today) / 86400000);
            return (joursRestants <= 60 && c.statut === "actif") || c.renouvellement_statut;
          });

          const MODAL_TABS = [
            { id:"infos",          label:"Infos",           icon:"👤" },
            { id:"contrats",       label:`Contrats (${coachContrats.length})`, icon:"📋" },
            { id:"honoraires",     label:"Honoraires",      icon:"💰" },
            { id:"groupes",        label:`Groupes (${coachGroupes.length})`,   icon:"👥" },
            { id:"renouvellement", label:`Renouvellement${contratsARenouveler.length > 0 ? ` 🔴${contratsARenouveler.length}` : ""}`, icon:"🔄" },
          ];

          return (
          <div style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={e=>{ if(e.target===e.currentTarget) setSelectedCoach(null); }}>
            <div style={{ background:"#fff", borderRadius:16, width:"95%", maxWidth:900, maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>

              {/* ── HEADER ── */}
              <div style={{ background:BET_GRADIENT, padding:"20px 24px", borderRadius:"16px 16px 0 0", flexShrink:0 }}>
                <button onClick={()=>setSelectedCoach(null)} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", color:"#fff", fontSize:18 }}>✕</button>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  {photoUrl
                    ? <img src={photoUrl} alt={coach.prenom} style={{ width:64, height:64, borderRadius:"50%", objectFit:"cover", border:"3px solid rgba(255,255,255,0.4)", flexShrink:0 }} />
                    : <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.2)", color:"#fff", fontWeight:800, fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{initiales}</div>
                  }
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#7dd3fc", fontWeight:600, marginBottom:2 }}>👨‍🏫 Formateur BET</div>
                    <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{coach.prenom} {coach.nom}</div>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:4, fontSize:12, color:"rgba(255,255,255,.75)" }}>
                      <span>{coach.coach_info?.filiere || coach.departement || "—"}</span>
                      <span style={{ background:"rgba(255,255,255,.18)", borderRadius:6, padding:"1px 8px", color:"#fff", fontWeight:700 }}>
                        {coach.actif ? "✅ Actif" : "🔴 Inactif"}
                      </span>
                      <span>📋 {contratsActifs} contrat{contratsActifs!==1?"s":""} actif{contratsActifs!==1?"s":""}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── ONGLETS ── */}
              <div style={{ display:"flex", borderBottom:"2px solid #e5e7eb", background:"#fafafa", flexShrink:0, overflowX:"auto" }}>
                {MODAL_TABS.map(t => (
                  <button key={t.id} onClick={()=>setCoachModalTab(t.id)}
                    style={{ padding:"12px 18px", border:"none", borderBottom:`3px solid ${coachModalTab===t.id?BET_COLOR:"transparent"}`,
                      background:"transparent", cursor:"pointer", fontWeight:coachModalTab===t.id?700:400,
                      color:coachModalTab===t.id?BET_COLOR:"#6b7280", fontSize:12, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:5 }}>
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>

              {/* ── CONTENU ── */}
              <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

                {/* ════ INFOS ════ */}
                {coachModalTab === "infos" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                    <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                      <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:800 }}>Informations personnelles</h3>
                      {[
                        ["Prénom",           coach.prenom || "—"],
                        ["Nom",              coach.nom    || "—"],
                        ["Email",            coach.email  || "—"],
                        ["Téléphone",        coach.telephone || "—"],
                        ["Matricule",        coach.coach_info?.matricule || "—"],
                        ["Filière",          coach.coach_info?.filiere || coach.departement || "—"],
                        ["Lieu habitation",  coach.coach_info?.lieu_habitation || "—"],
                        ["Date début BET",   fmtDate(coach.coach_info?.date_debut_bet || coach.date_creation)],
                        ["Centre",           centre],
                        ["Statut",           coach.actif ? "✅ Actif" : "🔴 Inactif"],
                      ].map(([l,v])=>(
                        <div key={l} style={{ display:"flex", padding:"6px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
                          <span style={{ color:"#9ca3af", width:140, flexShrink:0, fontWeight:500 }}>{l}</span>
                          <span style={{ fontWeight:600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                      <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                        <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:800 }}>Certifications</h3>
                        {(() => {
                          const certs = coach.coach_info?.certifications;
                          const list = Array.isArray(certs) ? certs : (typeof certs === "string" ? certs.split(",").map(s=>s.trim()).filter(Boolean) : []);
                          return list.length ? (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                              {list.map((c,i) => <span key={i} style={{ padding:"4px 12px", borderRadius:99, background:"#ede9fe", color:"#5b21b6", fontSize:12, fontWeight:700 }}>🏆 {c}</span>)}
                            </div>
                          ) : <p style={{ fontSize:13, color:"#9ca3af" }}>Aucune certification</p>;
                        })()}
                      </div>
                      <div style={{ background:"#f8fafc", borderRadius:12, padding:18 }}>
                        <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:800 }}>Résumé activité</h3>
                        {[
                          { l:"Contrats actifs",   v:contratsActifs,            c:BET_COLOR },
                          { l:"Total contrats",    v:coachContrats.length,       c:"#6b7280" },
                          { l:"Groupes de cours",  v:coachGroupes.length,        c:"#7c3aed" },
                          { l:"Montant total dû",  v:fmtMoney(totalDu),          c:"#16a34a" },
                          { l:"Montant réalisé",   v:fmtMoney(totalRealise),     c:"#0891b2" },
                        ].map(s => (
                          <div key={s.l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
                            <span style={{ color:"#6b7280" }}>{s.l}</span>
                            <span style={{ fontWeight:800, color:s.c }}>{s.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ════ CONTRATS ════ */}
                {coachModalTab === "contrats" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>Contrats privés</h3>
                        <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>En ligne · Présentiel BET · À domicile</p>
                      </div>
                      <button onClick={()=>{ setShowContratForm(true); setContratEditId(null); setContratForm({ apprenant_nom:"", apprenant_prenom:"", apprenant_email:"", apprenant_telephone:"", type_contrat:"en_ligne", niveau:"B1", objectif:"", prix_h:"", nb_seances_total:"", duree_seance_h:"1.5", date_debut:"", date_fin:"", note:"" }); }}
                        style={{ padding:"9px 18px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                        ➕ Nouveau contrat
                      </button>
                    </div>

                    {/* Formulaire nouveau/edit contrat */}
                    {showContratForm && (
                      <div style={{ background:"#f0f9ff", border:"1.5px solid #bae6fd", borderRadius:12, padding:18 }}>
                        <h4 style={{ margin:"0 0 14px", fontSize:14, fontWeight:800, color:BET_COLOR }}>{contratEditId ? "✏️ Modifier le contrat" : "➕ Nouveau contrat"}</h4>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Nom apprenant *</label>
                            <input value={contratForm.apprenant_nom} onChange={e=>setContratForm(p=>({...p,apprenant_nom:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, boxSizing:"border-box" }} /></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Prénom apprenant</label>
                            <input value={contratForm.apprenant_prenom} onChange={e=>setContratForm(p=>({...p,apprenant_prenom:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, boxSizing:"border-box" }} /></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Email apprenant</label>
                            <input value={contratForm.apprenant_email} onChange={e=>setContratForm(p=>({...p,apprenant_email:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, boxSizing:"border-box" }} /></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Téléphone apprenant</label>
                            <input value={contratForm.apprenant_telephone} onChange={e=>setContratForm(p=>({...p,apprenant_telephone:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, boxSizing:"border-box" }} /></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Type de contrat</label>
                            <select value={contratForm.type_contrat} onChange={e=>setContratForm(p=>({...p,type_contrat:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, background:"#fff", boxSizing:"border-box" }}>
                              <option value="en_ligne">💻 En ligne</option>
                              <option value="presentiel_bet">🏢 Présentiel BET</option>
                              <option value="domicile">🏠 À domicile</option>
                            </select></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Niveau</label>
                            <select value={contratForm.niveau} onChange={e=>setContratForm(p=>({...p,niveau:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, background:"#fff", boxSizing:"border-box" }}>
                              {["A1","A2","B1","B2","C1","C2"].map(n=><option key={n} value={n}>{n}</option>)}
                            </select></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Prix / heure (F CFA) *</label>
                            <input type="number" min="0" value={contratForm.prix_h} onChange={e=>setContratForm(p=>({...p,prix_h:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, boxSizing:"border-box" }} /></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Nb séances total</label>
                            <input type="number" min="0" value={contratForm.nb_seances_total} onChange={e=>setContratForm(p=>({...p,nb_seances_total:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, boxSizing:"border-box" }} /></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Durée / séance (h)</label>
                            <select value={contratForm.duree_seance_h} onChange={e=>setContratForm(p=>({...p,duree_seance_h:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, background:"#fff", boxSizing:"border-box" }}>
                              {["0.5","1","1.5","2","2.5","3"].map(v=><option key={v} value={v}>{v}h</option>)}
                            </select></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Objectif</label>
                            <input value={contratForm.objectif} onChange={e=>setContratForm(p=>({...p,objectif:e.target.value}))} placeholder="TOEIC, Général…" style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, boxSizing:"border-box" }} /></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Date début</label>
                            <input type="date" value={contratForm.date_debut} onChange={e=>setContratForm(p=>({...p,date_debut:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, boxSizing:"border-box" }} /></div>
                          <div><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Date fin</label>
                            <input type="date" value={contratForm.date_fin} onChange={e=>setContratForm(p=>({...p,date_fin:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, boxSizing:"border-box" }} /></div>
                        </div>
                        {contratForm.prix_h && contratForm.nb_seances_total && (
                          <div style={{ marginTop:10, padding:"8px 14px", background:"#dcfce7", borderRadius:8, fontSize:13, fontWeight:700, color:"#15803d" }}>
                            💰 Montant total : {fmtMoney(parseFloat(contratForm.prix_h) * parseFloat(contratForm.duree_seance_h||1.5) * parseInt(contratForm.nb_seances_total))}
                          </div>
                        )}
                        <div style={{ marginTop:10 }}><label style={{ fontSize:11, fontWeight:600, display:"block", marginBottom:3 }}>Note interne</label>
                          <textarea value={contratForm.note} onChange={e=>setContratForm(p=>({...p,note:e.target.value}))} rows={2} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bae6fd", borderRadius:7, fontSize:13, resize:"vertical", boxSizing:"border-box" }} /></div>
                        <div style={{ display:"flex", gap:8, marginTop:12 }}>
                          <button onClick={saveContrat} disabled={contratSaving} style={{ padding:"9px 20px", background:BET_COLOR, color:"#fff", border:"none", borderRadius:7, fontWeight:700, fontSize:13, cursor:"pointer", opacity:contratSaving?.6:1 }}>{contratSaving?"⏳ Sauvegarde…":"✅ Enregistrer"}</button>
                          <button onClick={()=>setShowContratForm(false)} style={{ padding:"9px 16px", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:7, fontSize:13, cursor:"pointer" }}>Annuler</button>
                        </div>
                      </div>
                    )}

                    {coachContratsLoading ? (
                      <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>Chargement…</div>
                    ) : coachContrats.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>
                        <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
                        <div style={{ fontWeight:600 }}>Aucun contrat privé</div>
                        <div style={{ fontSize:12, marginTop:4 }}>Cliquez sur "Nouveau contrat" pour en créer un.</div>
                      </div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        {coachContrats.map(c => {
                          const type = CONTRAT_TYPE[c.type_contrat] || CONTRAT_TYPE.en_ligne;
                          const stCfg = CONTRAT_STATUT[c.statut] || CONTRAT_STATUT.en_attente;
                          const montant = (c.prix_h||0) * (c.duree_seance_h||1.5) * (c.nb_seances_total||0);
                          return (
                            <div key={c.id} style={{ background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:12, overflow:"hidden" }}>
                              <div style={{ height:4, background:type.color }} />
                              <div style={{ padding:"14px 16px" }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                                  <div>
                                    <div style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>{c.apprenant_prenom || ""} {c.apprenant_nom}</div>
                                    <div style={{ display:"flex", gap:8, marginTop:4 }}>
                                      <span style={{ background:type.bg, color:type.color, borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:700 }}>{type.icon} {type.label}</span>
                                      {c.niveau && <span style={{ background:"#f3f4f6", color:"#374151", borderRadius:99, padding:"2px 8px", fontSize:11, fontWeight:700 }}>Niv. {c.niveau}</span>}
                                      {c.objectif && <span style={{ fontSize:11, color:"#6b7280" }}>🎯 {c.objectif}</span>}
                                    </div>
                                  </div>
                                  <span style={{ background:stCfg.bg, color:stCfg.color, borderRadius:99, padding:"3px 12px", fontSize:11, fontWeight:800 }}>{stCfg.label}</span>
                                </div>
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, fontSize:12, color:"#6b7280", marginBottom:10 }}>
                                  <div><div style={{ fontSize:10, color:"#9ca3af", marginBottom:2 }}>Prix/heure</div><div style={{ fontWeight:700, color:"#0f172a" }}>{fmtMoney(c.prix_h)}</div></div>
                                  <div><div style={{ fontSize:10, color:"#9ca3af", marginBottom:2 }}>Séances</div><div style={{ fontWeight:700, color:"#0f172a" }}>{c.nb_seances_realisees||0}/{c.nb_seances_total||0}</div></div>
                                  <div><div style={{ fontSize:10, color:"#9ca3af", marginBottom:2 }}>Durée/séance</div><div style={{ fontWeight:700, color:"#0f172a" }}>{c.duree_seance_h||1.5}h</div></div>
                                  <div><div style={{ fontSize:10, color:"#9ca3af", marginBottom:2 }}>Montant total</div><div style={{ fontWeight:700, color:"#16a34a" }}>{fmtMoney(montant)}</div></div>
                                </div>
                                {(c.date_debut || c.date_fin) && (
                                  <div style={{ fontSize:12, color:"#6b7280", marginBottom:10 }}>
                                    📅 {fmtDate(c.date_debut)} → {fmtDate(c.date_fin)}
                                  </div>
                                )}
                                {/* Paiement */}
                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:c.paiement_confirme?"#dcfce7":"#fef3c7", borderRadius:8, marginBottom:10 }}>
                                  <span style={{ fontSize:12, fontWeight:700, color:c.paiement_confirme?"#15803d":"#92400e" }}>
                                    {c.paiement_confirme ? "✅ Paiement confirmé" : "⏳ Paiement en attente"}
                                    {c.paiement_date ? ` — ${fmtDate(c.paiement_date)}` : ""}
                                  </span>
                                  {!c.paiement_confirme && (
                                    <button onClick={()=>patchContrat(c.id,{ paiement_confirme:true, paiement_date:new Date().toISOString().slice(0,10), paiement_montant:montant })}
                                      style={{ padding:"5px 12px", background:"#16a34a", color:"#fff", border:"none", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                                      ✅ Confirmer paiement
                                    </button>
                                  )}
                                </div>
                                {/* Actions statut */}
                                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                  {c.statut === "en_attente" && c.paiement_confirme && (
                                    <button onClick={()=>patchContrat(c.id,{statut:"actif"})} style={{ padding:"5px 12px", background:"#dcfce7", color:"#15803d", border:"1px solid #86efac", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>▶ Activer</button>
                                  )}
                                  {c.statut === "actif" && (
                                    <button onClick={()=>patchContrat(c.id,{statut:"suspendu"})} style={{ padding:"5px 12px", background:"#f3f4f6", color:"#374151", border:"1px solid #d1d5db", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>⏸ Suspendre</button>
                                  )}
                                  {c.statut === "suspendu" && (
                                    <button onClick={()=>patchContrat(c.id,{statut:"actif"})} style={{ padding:"5px 12px", background:"#dcfce7", color:"#15803d", border:"1px solid #86efac", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>▶ Reprendre</button>
                                  )}
                                  {["actif","suspendu"].includes(c.statut) && (
                                    <button onClick={()=>patchContrat(c.id,{statut:"termine"})} style={{ padding:"5px 12px", background:"#f1f5f9", color:"#475569", border:"1px solid #cbd5e1", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>⏹ Terminer</button>
                                  )}
                                  <button onClick={()=>{ setContratEditId(c.id); setContratForm({ apprenant_nom:c.apprenant_nom||"", apprenant_prenom:c.apprenant_prenom||"", apprenant_email:c.apprenant_email||"", apprenant_telephone:c.apprenant_telephone||"", type_contrat:c.type_contrat||"en_ligne", niveau:c.niveau||"B1", objectif:c.objectif||"", prix_h:c.prix_h||"", nb_seances_total:c.nb_seances_total||"", duree_seance_h:c.duree_seance_h||"1.5", date_debut:c.date_debut||"", date_fin:c.date_fin||"", note:c.note||"" }); setShowContratForm(true); }}
                                    style={{ padding:"5px 12px", background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>✏️ Modifier</button>
                                  <button onClick={()=>deleteContrat(c.id)} style={{ padding:"5px 12px", background:"#fee2e2", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>🗑 Supprimer</button>
                                  <button onClick={()=>{ const seances = parseInt(window.prompt("Nb séances réalisées :", c.nb_seances_realisees||0)); if (!isNaN(seances)) patchContrat(c.id,{nb_seances_realisees:seances}); }}
                                    style={{ padding:"5px 12px", background:"#fef3c7", color:"#92400e", border:"1px solid #fcd34d", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>📝 Séances réalisées</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ════ HONORAIRES ════ */}
                {coachModalTab === "honoraires" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>Honoraires — {coach.prenom} {coach.nom}</h3>
                    {/* KPIs */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                      {[
                        { l:"Montant total dû",       v:fmtMoney(totalDu),       c:"#16a34a", bg:"#dcfce7" },
                        { l:"Montant réalisé",        v:fmtMoney(totalRealise),  c:"#0891b2", bg:"#e0f2fe" },
                        { l:"Reste à réaliser",       v:fmtMoney(totalDu - totalRealise), c:"#d97706", bg:"#fef3c7" },
                      ].map(s => (
                        <div key={s.l} style={{ background:s.bg, borderRadius:12, padding:"14px 16px" }}>
                          <div style={{ fontSize:11, color:s.c, fontWeight:600, marginBottom:4 }}>{s.l}</div>
                          <div style={{ fontSize:22, fontWeight:900, color:s.c }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    {honoraires.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>Aucun contrat — pas d'honoraires calculés.</div>
                    ) : (
                      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                          <thead>
                            <tr style={{ background:"#f8fafc" }}>
                              {["Apprenant","Type","Prix/h","Durée/séance","Séances","Montant total","Réalisé","Statut"].map(h=>(
                                <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6b7280", borderBottom:"1px solid #e5e7eb" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {honoraires.map(h => {
                              const type = CONTRAT_TYPE[h.type_contrat] || CONTRAT_TYPE.en_ligne;
                              const stCfg = CONTRAT_STATUT[h.statut] || CONTRAT_STATUT.en_attente;
                              return (
                                <tr key={h.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                                  <td style={{ padding:"10px 12px", fontWeight:600 }}>{h.apprenant_prenom||""} {h.apprenant_nom}</td>
                                  <td style={{ padding:"10px 12px" }}><span style={{ background:type.bg, color:type.color, borderRadius:99, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{type.icon} {type.label}</span></td>
                                  <td style={{ padding:"10px 12px", fontWeight:700 }}>{fmtMoney(h.prix_h)}</td>
                                  <td style={{ padding:"10px 12px" }}>{h.duree_seance_h||1.5}h</td>
                                  <td style={{ padding:"10px 12px" }}>{h.nb_seances_realisees||0}/{h.nb_seances_total||0}</td>
                                  <td style={{ padding:"10px 12px", fontWeight:800, color:"#16a34a" }}>{fmtMoney(h.montant_total)}</td>
                                  <td style={{ padding:"10px 12px", fontWeight:700, color:"#0891b2" }}>{fmtMoney(h.montant_realise)}</td>
                                  <td style={{ padding:"10px 12px" }}><span style={{ background:stCfg.bg, color:stCfg.color, borderRadius:99, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{stCfg.label}</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ background:"#f0fdf4" }}>
                              <td colSpan={5} style={{ padding:"10px 12px", fontWeight:800, fontSize:13 }}>Total</td>
                              <td style={{ padding:"10px 12px", fontWeight:900, color:"#16a34a", fontSize:14 }}>{fmtMoney(totalDu)}</td>
                              <td style={{ padding:"10px 12px", fontWeight:900, color:"#0891b2", fontSize:14 }}>{fmtMoney(totalRealise)}</td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ════ GROUPES ════ */}
                {coachModalTab === "groupes" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>Groupes de cours assignés</h3>
                    {coachGroupesLoading ? (
                      <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>Chargement…</div>
                    ) : coachGroupes.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>
                        <div style={{ fontSize:36, marginBottom:8 }}>👥</div>
                        <div style={{ fontWeight:600 }}>Aucun groupe assigné</div>
                      </div>
                    ) : (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
                        {coachGroupes.map(g => {
                          const sCol = g.statut==="actif" ? { c:"#16a34a", bg:"#dcfce7" } : { c:"#6b7280", bg:"#f3f4f6" };
                          return (
                            <div key={g.id} style={{ background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:12, overflow:"hidden" }}>
                              <div style={{ height:4, background:BET_COLOR }} />
                              <div style={{ padding:"14px 16px" }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                                  <div style={{ fontSize:14, fontWeight:800 }}>{g.nom}</div>
                                  <span style={{ background:sCol.bg, color:sCol.c, borderRadius:99, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{g.statut}</span>
                                </div>
                                <div style={{ fontSize:12, color:"#6b7280", display:"flex", flexDirection:"column", gap:3 }}>
                                  {g.niveau && <span>📊 Niveau {g.niveau}</span>}
                                  {g.filiere && <span>📂 {g.filiere}</span>}
                                  {g.nb_apprenants !== undefined && <span>👤 {g.nb_apprenants} apprenant{g.nb_apprenants!==1?"s":""}</span>}
                                  {g.type_cours && <span>{g.type_cours==="en_ligne"?"💻 En ligne":g.type_cours==="domicile"?"🏠 Domicile":"🏢 Présentiel"}</span>}
                                  {g.date_debut && <span>📅 Début : {fmtDate(g.date_debut)}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ════ RENOUVELLEMENT ════ */}
                {coachModalTab === "renouvellement" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <div>
                      <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>Gestion des renouvellements</h3>
                      <p style={{ margin:"4px 0 0", fontSize:12, color:"#9ca3af" }}>Contrats arrivant à échéance dans les 60 jours ou en cours de renouvellement</p>
                    </div>
                    {contratsARenouveler.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}>
                        <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                        <div style={{ fontWeight:600 }}>Aucun contrat à renouveler</div>
                        <div style={{ fontSize:12, marginTop:4 }}>Tous les contrats actifs ont plus de 60 jours restants.</div>
                      </div>
                    ) : contratsARenouveler.map(c => {
                      const fin = new Date(c.date_fin);
                      const joursRestants = Math.ceil((fin - today) / 86400000);
                      const rCfg = c.renouvellement_statut ? (RENOUV_STATUT[c.renouvellement_statut] || RENOUV_STATUT.en_attente) : null;
                      const urgence = joursRestants <= 0 ? "expired" : joursRestants <= 14 ? "critical" : joursRestants <= 30 ? "warning" : "ok";
                      const urgCfg = { expired:{bg:"#fee2e2",c:"#dc2626",label:"Expiré"}, critical:{bg:"#fee2e2",c:"#dc2626",label:`${joursRestants}j restants`}, warning:{bg:"#fef3c7",c:"#d97706",label:`${joursRestants}j restants`}, ok:{bg:"#dcfce7",c:"#16a34a",label:`${joursRestants}j restants`} }[urgence];
                      return (
                        <div key={c.id} style={{ background:"#fff", border:`1.5px solid ${urgence==="expired"||urgence==="critical"?"#fca5a5":"#e5e7eb"}`, borderRadius:12, padding:"16px 18px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                            <div>
                              <div style={{ fontSize:15, fontWeight:800 }}>{c.apprenant_prenom||""} {c.apprenant_nom}</div>
                              <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>
                                📅 {fmtDate(c.date_debut)} → {fmtDate(c.date_fin)} · {CONTRAT_TYPE[c.type_contrat]?.label||c.type_contrat}
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                              <span style={{ background:urgCfg.bg, color:urgCfg.c, borderRadius:99, padding:"3px 12px", fontSize:11, fontWeight:800 }}>{urgCfg.label}</span>
                              {rCfg && <span style={{ background:rCfg.bg, color:rCfg.color, borderRadius:99, padding:"3px 12px", fontSize:11, fontWeight:800 }}>🔄 {rCfg.label}</span>}
                            </div>
                          </div>
                          {/* Workflow renouvellement */}
                          <div style={{ background:"#f8fafc", borderRadius:8, padding:"12px 14px", marginBottom:10 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>Décision de renouvellement</div>
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                              {!c.renouvellement_statut && (
                                <button onClick={()=>patchContrat(c.id,{ renouvellement_statut:"en_attente", renouvellement_demande_date:new Date().toISOString().slice(0,10) })}
                                  style={{ padding:"6px 14px", background:"#fef3c7", color:"#92400e", border:"1px solid #fcd34d", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                                  ⏳ Demander renouvellement
                                </button>
                              )}
                              {c.renouvellement_statut === "en_attente" && (<>
                                <button onClick={()=>patchContrat(c.id,{ renouvellement_statut:"confirme", renouvellement_decision_date:new Date().toISOString().slice(0,10), statut:"renouvele" })}
                                  style={{ padding:"6px 14px", background:"#dcfce7", color:"#15803d", border:"1px solid #86efac", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                                  ✅ Confirmer — Renouveler
                                </button>
                                <button onClick={()=>patchContrat(c.id,{ renouvellement_statut:"refuse", renouvellement_decision_date:new Date().toISOString().slice(0,10), statut:"non_renouvele" })}
                                  style={{ padding:"6px 14px", background:"#fee2e2", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                                  ❌ Refuser — Arrêter le contrat
                                </button>
                              </>)}
                              {c.renouvellement_statut === "confirme" && (
                                <div style={{ fontSize:12, color:"#15803d", fontWeight:700 }}>✅ Contrat renouvelé — cours en cours · Décidé le {fmtDate(c.renouvellement_decision_date)}</div>
                              )}
                              {c.renouvellement_statut === "refuse" && (
                                <div style={{ fontSize:12, color:"#dc2626", fontWeight:700 }}>❌ Contrat non renouvelé — cours arrêtés · Décidé le {fmtDate(c.renouvellement_decision_date)}</div>
                              )}
                            </div>
                          </div>
                          {c.renouvellement_note !== undefined && (
                            <div style={{ marginTop:6 }}>
                              <label style={{ fontSize:11, fontWeight:600, color:"#374151", display:"block", marginBottom:3 }}>Note renouvellement</label>
                              <textarea defaultValue={c.renouvellement_note||""}
                                onBlur={e=>patchContrat(c.id,{renouvellement_note:e.target.value})}
                                rows={2} placeholder="Motif, conditions…"
                                style={{ width:"100%", padding:"7px 10px", border:"1.5px solid #e5e7eb", borderRadius:7, fontSize:12, resize:"vertical", boxSizing:"border-box" }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>{/* fin contenu */}
            </div>
          </div>
          );
        })()}

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
          {activeTab === "notifications" && (
            <div style={{ background:"#fff", padding:24, borderRadius:"0 12px 12px 12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
              <NotificationsTab
                userId={JSON.parse(localStorage.getItem("admin_profil") || "null")?.id}
                accentColor="#0f172a"
              />
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
                    // photo : priorité photo_url de la table assistantes, sinon avatar_url du compte utilisateur lié
                    const userLie = a.email ? users.find(u => u.email === a.email) : null;
                    const photoSrc = a.photo_url || userLie?.avatar_url || null;
                    return (
                      <div key={a.id} style={{ background:"#fff", borderRadius:12, border:`2px solid ${hasDraft ? "#fde68a" : travailleAujourdHui && da.actif ? `${centreColor}40` : "#e5e7eb"}`, overflow:"hidden" }}>
                        <div style={{ height:3, background: hasDraft ? "#f59e0b" : travailleAujourdHui && da.actif ? centreColor : "#e5e7eb" }} />
                        <div style={{ padding:"14px 18px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                            <div style={{ position:"relative", flexShrink:0 }}>
                              <input type="file" accept="image/*" id={`photo-assist-${a.id}`} style={{ display:"none" }}
                                onChange={async e => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const fd = new FormData(); fd.append("file", file);
                                  try {
                                    const r = await fetch(`${API_URL}/api/upload/avatar`, { method:"POST", headers: authHeaders(), body: fd });
                                    const d = await r.json();
                                    const url = d.file?.url; if (!url) return;
                                    await fetch(`${API_URL}/api/parcours/assistantes/${a.id}`, { method:"PATCH", headers:{ ...authHeaders(), "Content-Type":"application/json" }, body: JSON.stringify({ photo_url: url }) });
                                    setAssistantesAdmin(prev => prev.map(x => x.id === a.id ? { ...x, photo_url: url } : x));
                                    toast.success("Photo mise à jour ✓");
                                  } catch { toast.error("Erreur upload photo"); }
                                  e.target.value = "";
                                }}
                              />
                              <div title="Changer la photo" onClick={() => document.getElementById(`photo-assist-${a.id}`).click()}
                                style={{ cursor:"pointer", position:"relative", width:42, height:42 }}>
                                {photoSrc
                                  ? <img src={photoSrc} alt={a.prenom} style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover", display:"block" }}/>
                                  : <div style={{ width:42, height:42, borderRadius:"50%", background:`linear-gradient(135deg,#0f172a,${centreColor})`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13 }}>{initiales}</div>
                                }
                                <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity .15s" }}
                                  onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                                  <span style={{ fontSize:14 }}>📷</span>
                                </div>
                              </div>
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