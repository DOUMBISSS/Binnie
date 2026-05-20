import React, { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import NotificationsTab from "../../Components/NotificationsTab";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";
const authH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` });

const BET   = "#0891b2";
const DARK  = "#0f172a";
const B2B   = "#2563eb";
const B2B_L = "#eff6ff";

const SECTEURS = ["Finance / Banque","Industrie","Commerce / Distribution","Services","Santé","Éducation","Télécoms","BTP / Immobilier","Agro-alimentaire","Énergie","Transport / Logistique","Autre"];
const PIPELINE_STEPS = [
  { id:"prospection",   label:"Prospection",   color:"#64748b", bg:"#f8fafc" },
  { id:"negociation",   label:"Négociation",   color:"#f59e0b", bg:"#fffbeb" },
  { id:"proposition",   label:"Proposition",   color:"#0891b2", bg:"#e0f2fe" },
  { id:"conclu",        label:"Conclu ✅",      color:"#16a34a", bg:"#f0fdf4" },
  { id:"perdu",         label:"Perdu ❌",       color:"#dc2626", bg:"#fef2f2" },
];
const DOC_TYPES = { proforma:"📄 Proforma", bon_commande:"📋 Bon de commande", contrat:"📑 Contrat", autre:"📎 Autre" };
const FACT_STATUTS = { brouillon:"⚪ Brouillon", envoyée:"📤 Envoyée", payée:"✅ Payée", en_retard:"🔴 En retard", annulée:"❌ Annulée" };
const FACT_COLORS  = { brouillon:"#94a3b8", envoyée:"#0891b2", payée:"#16a34a", en_retard:"#dc2626", annulée:"#9ca3af" };

const fmt = (n) => n != null ? Number(n).toLocaleString("fr-FR", { style:"currency", currency:"XOF", maximumFractionDigits:0 }) : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth: wide ? 760 : 520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding:"20px 24px 0", borderBottom:"1px solid #f1f5f9", marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:DARK }}>{title}</h2>
          {subtitle && <p style={{ margin:"4px 0 16px", fontSize:12, color:"#64748b" }}>{subtitle}</p>}
        </div>
        <div style={{ padding:"0 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>
        {label}{required && <span style={{ color:"#dc2626" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = { width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, boxSizing:"border-box", color:DARK };
const selectStyle = { ...inputStyle, background:"#fff", cursor:"pointer" };
const btnPrimary = { padding:"10px 20px", background:B2B, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 };
const btnSecondary = { padding:"10px 16px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13 };

// ════════════════════════════════════════════════════════════
// ONGLET VUE D'ENSEMBLE
// ════════════════════════════════════════════════════════════
function VueEnsemble({ entreprises, prospects, factures }) {
  const totalEntreprises = entreprises.length;
  const enPipeline = prospects.filter(p => !["conclu","perdu"].includes(p.statut)).length;
  const caEstime   = prospects.filter(p => p.statut !== "perdu").reduce((s, p) => s + (Number(p.montant_estime)||0), 0);
  const facturesEnRetard = factures.filter(f => f.statut === "en_retard").length;
  const caFacture  = factures.filter(f => f.statut === "payée").reduce((s, f) => s + (Number(f.montant_ttc)||0), 0);

  const kpis = [
    { icon:"🏢", label:"Comptes entreprises", val:totalEntreprises, color:B2B, bg:B2B_L },
    { icon:"🔄", label:"Prospects en pipeline", val:enPipeline, color:"#0891b2", bg:"#e0f2fe" },
    { icon:"💰", label:"CA estimé (pipeline)", val:fmt(caEstime), color:"#059669", bg:"#f0fdf4", small:true },
    { icon:"✅", label:"CA facturé (payé)", val:fmt(caFacture), color:"#16a34a", bg:"#dcfce7", small:true },
    { icon:"🔴", label:"Factures en retard", val:facturesEnRetard, color:"#dc2626", bg:"#fee2e2" },
  ];

  const byStatut = {};
  PIPELINE_STEPS.forEach(s => { byStatut[s.id] = prospects.filter(p => p.statut === s.id).length; });

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:12, marginBottom:28 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background:k.bg, borderRadius:12, padding:"16px 18px", border:`1.5px solid ${k.color}20` }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{k.icon}</div>
            <div style={{ fontSize: k.small ? 15 : 24, fontWeight:800, color:k.color }}>{k.val}</div>
            <div style={{ fontSize:11, color:"#64748b", marginTop:2, lineHeight:1.3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:"#fff", borderRadius:12, padding:"18px 20px", border:"1.5px solid #e2e8f0" }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:800, color:DARK }}>Pipeline B2B — Répartition par étape</h3>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {PIPELINE_STEPS.map(s => (
            <div key={s.id} style={{ flex:1, minWidth:100, background:s.bg, borderRadius:10, padding:"12px 14px", border:`1.5px solid ${s.color}30`, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{byStatut[s.id]||0}</div>
              <div style={{ fontSize:11, color:s.color, fontWeight:700, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top entreprises par montant estimé */}
      {prospects.length > 0 && (
        <div style={{ marginTop:20, background:"#fff", borderRadius:12, padding:"18px 20px", border:"1.5px solid #e2e8f0" }}>
          <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:800, color:DARK }}>Top prospects (par montant estimé)</h3>
          {[...prospects].filter(p => p.montant_estime).sort((a,b) => b.montant_estime - a.montant_estime).slice(0,5).map(p => {
            const st = PIPELINE_STEPS.find(s => s.id === p.statut);
            return (
              <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:DARK }}>{p.titre}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{p.entreprise_nom}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:11, padding:"3px 10px", borderRadius:999, background:st?.bg, color:st?.color, fontWeight:700 }}>{st?.label}</span>
                  <span style={{ fontWeight:800, color:"#059669", fontSize:13 }}>{fmt(p.montant_estime)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ONGLET COMPTES ENTREPRISES
// ════════════════════════════════════════════════════════════
function CompteEntreprises({ entreprises, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nom:"", rccm:"", secteur:"", nb_employes:"", referent_rh_nom:"", referent_rh_email:"", referent_rh_telephone:"", budget_formation:"", ville:"", adresse:"", site_web:"", notes:"" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const openNew = () => { setForm({ nom:"", rccm:"", secteur:"", nb_employes:"", referent_rh_nom:"", referent_rh_email:"", referent_rh_telephone:"", budget_formation:"", ville:"", adresse:"", site_web:"", notes:"" }); setEditItem(null); setShowForm(true); };
  const openEdit = (e) => { setForm({ nom:e.nom||"", rccm:e.rccm||"", secteur:e.secteur||"", nb_employes:e.nb_employes||"", referent_rh_nom:e.referent_rh_nom||"", referent_rh_email:e.referent_rh_email||"", referent_rh_telephone:e.referent_rh_telephone||"", budget_formation:e.budget_formation||"", ville:e.ville||"", adresse:e.adresse||"", site_web:e.site_web||"", notes:e.notes||"" }); setEditItem(e); setShowForm(true); };

  const save = async () => {
    if (!form.nom.trim()) return toast.error("Le nom est requis");
    setSaving(true);
    try {
      const url = editItem ? `${API}/api/corporate/entreprises/${editItem.id}` : `${API}/api/corporate/entreprises`;
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: authH(), body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editItem ? "Entreprise mise à jour ✓" : "Entreprise créée ✓");
      setShowForm(false); onRefresh();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Supprimer cette entreprise et tous ses prospects ?")) return;
    try {
      await fetch(`${API}/api/corporate/entreprises/${id}`, { method:"DELETE", headers: authH() });
      toast.success("Supprimé"); onRefresh();
    } catch { toast.error("Erreur suppression"); }
  };

  const filtered = entreprises.filter(e => e.nom?.toLowerCase().includes(search.toLowerCase()) || e.secteur?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{ ...inputStyle, width:240 }} />
        <button onClick={openNew} style={btnPrimary}>➕ Nouvelle entreprise</button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"#94a3b8", fontSize:14 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🏢</div>
          Aucun compte entreprise. Créez votre premier client B2B.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(e => (
            <div key={e.id} style={{ background:"#fff", borderRadius:12, border:"1.5px solid #e2e8f0", overflow:"hidden" }}>
              <div style={{ padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }} onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:B2B_L, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🏢</div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:DARK }}>{e.nom}</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>{e.secteur || "Secteur non renseigné"} {e.ville ? `· ${e.ville}` : ""}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {e.budget_formation && <span style={{ fontSize:12, fontWeight:700, color:"#059669" }}>{fmt(e.budget_formation)}</span>}
                  <span style={{ fontSize:11, padding:"3px 9px", borderRadius:999, background: e.statut==="actif" ? "#dcfce7":"#fee2e2", color: e.statut==="actif" ? "#166534":"#dc2626", fontWeight:700 }}>{e.statut}</span>
                  <button onClick={ev=>{ev.stopPropagation();openEdit(e);}} style={{ padding:"5px 11px", background:"#e0f2fe", color:BET, border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:11 }}>✏️ Modifier</button>
                  <button onClick={ev=>{ev.stopPropagation();del(e.id);}} style={{ padding:"5px 9px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:7, cursor:"pointer", fontSize:11 }}>🗑️</button>
                </div>
              </div>
              {expandedId === e.id && (
                <div style={{ padding:"0 18px 16px", borderTop:"1px solid #f1f5f9", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginTop:12 }}>
                  <InfoRow icon="📋" label="RCCM" val={e.rccm} />
                  <InfoRow icon="👥" label="Employés" val={e.nb_employes} />
                  <InfoRow icon="👤" label="Référent RH" val={e.referent_rh_nom} />
                  <InfoRow icon="📧" label="Email RH" val={e.referent_rh_email} />
                  <InfoRow icon="📞" label="Tél RH" val={e.referent_rh_telephone} />
                  <InfoRow icon="📍" label="Adresse" val={e.adresse} />
                  <InfoRow icon="🌐" label="Site web" val={e.site_web} />
                  {e.notes && <div style={{ gridColumn:"1/-1" }}><InfoRow icon="📝" label="Notes" val={e.notes} /></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editItem ? "Modifier l'entreprise" : "Nouvelle entreprise cliente"} onClose={()=>setShowForm(false)} wide>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <div style={{ gridColumn:"1/-1" }}><Field label="Nom de l'entreprise" required><input value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} style={inputStyle} placeholder="BET Industries SA" /></Field></div>
            <Field label="RCCM"><input value={form.rccm} onChange={e=>setForm({...form,rccm:e.target.value})} style={inputStyle} placeholder="CI-ABJ-2024-…" /></Field>
            <Field label="Secteur d'activité"><select value={form.secteur} onChange={e=>setForm({...form,secteur:e.target.value})} style={selectStyle}><option value="">— Choisir —</option>{SECTEURS.map(s=><option key={s}>{s}</option>)}</select></Field>
            <Field label="Nombre d'employés"><input type="number" value={form.nb_employes} onChange={e=>setForm({...form,nb_employes:e.target.value})} style={inputStyle} placeholder="250" /></Field>
            <Field label="Budget formation (FCFA)"><input type="number" value={form.budget_formation} onChange={e=>setForm({...form,budget_formation:e.target.value})} style={inputStyle} placeholder="5 000 000" /></Field>
            <Field label="Référent RH — Nom"><input value={form.referent_rh_nom} onChange={e=>setForm({...form,referent_rh_nom:e.target.value})} style={inputStyle} /></Field>
            <Field label="Référent RH — Email"><input type="email" value={form.referent_rh_email} onChange={e=>setForm({...form,referent_rh_email:e.target.value})} style={inputStyle} /></Field>
            <Field label="Référent RH — Téléphone"><input value={form.referent_rh_telephone} onChange={e=>setForm({...form,referent_rh_telephone:e.target.value})} style={inputStyle} /></Field>
            <Field label="Ville"><input value={form.ville} onChange={e=>setForm({...form,ville:e.target.value})} style={inputStyle} /></Field>
            <Field label="Site web"><input value={form.site_web} onChange={e=>setForm({...form,site_web:e.target.value})} style={inputStyle} placeholder="https://…" /></Field>
            <div style={{ gridColumn:"1/-1" }}><Field label="Notes internes"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{ ...inputStyle, minHeight:60, resize:"vertical" }} /></Field></div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "⏳ Enregistrement…" : editItem ? "💾 Mettre à jour" : "✅ Créer l'entreprise"}</button>
            <button onClick={()=>setShowForm(false)} style={btnSecondary}>Annuler</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ icon, label, val }) {
  if (!val) return null;
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>{icon} {label}</div>
      <div style={{ fontSize:12, color:DARK, fontWeight:500 }}>{val}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ONGLET PIPELINE B2B
// ════════════════════════════════════════════════════════════
function PipelineB2B({ prospects, entreprises, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showHistorique, setShowHistorique] = useState(null);
  const [form, setForm] = useState({ entreprise_id:"", titre:"", statut:"prospection", montant_estime:"", date_cloture_prevue:"", notes:"" });
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState(null);

  const openNew = () => { setForm({ entreprise_id:"", titre:"", statut:"prospection", montant_estime:"", date_cloture_prevue:"", notes:"" }); setEditItem(null); setShowForm(true); };
  const openEdit = (p) => { setForm({ entreprise_id:p.entreprise_id||"", titre:p.titre||"", statut:p.statut||"prospection", montant_estime:p.montant_estime||"", date_cloture_prevue:p.date_cloture_prevue||"", notes:p.notes||"" }); setEditItem(p); setShowForm(true); };

  const save = async () => {
    if (!form.entreprise_id || !form.titre) return toast.error("Entreprise et titre requis");
    setSaving(true);
    try {
      const url = editItem ? `${API}/api/corporate/prospects/${editItem.id}` : `${API}/api/corporate/prospects`;
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: authH(), body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editItem ? "Prospect mis à jour ✓" : "Prospect créé ✓");
      setShowForm(false); onRefresh();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const moveStatut = async (id, newStatut) => {
    setMovingId(id);
    try {
      const res = await fetch(`${API}/api/corporate/prospects/${id}`, { method:"PATCH", headers: authH(), body: JSON.stringify({ statut: newStatut }) });
      if (!res.ok) throw new Error();
      onRefresh();
    } catch { toast.error("Erreur"); }
    finally { setMovingId(null); }
  };

  const del = async (id) => {
    if (!window.confirm("Supprimer ce prospect ?")) return;
    await fetch(`${API}/api/corporate/prospects/${id}`, { method:"DELETE", headers: authH() });
    onRefresh();
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontSize:13, color:"#64748b" }}>{prospects.length} prospect(s) au total</div>
        <button onClick={openNew} style={btnPrimary}>➕ Nouveau prospect</button>
      </div>

      {/* Vue Kanban */}
      <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:8 }}>
        {PIPELINE_STEPS.map(step => {
          const items = prospects.filter(p => p.statut === step.id);
          const total = items.reduce((s, p) => s + (Number(p.montant_estime)||0), 0);
          return (
            <div key={step.id} style={{ minWidth:220, flex:1, background:step.bg, borderRadius:12, border:`1.5px solid ${step.color}30`, display:"flex", flexDirection:"column" }}>
              <div style={{ padding:"12px 14px", borderBottom:`1.5px solid ${step.color}20` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontWeight:800, fontSize:13, color:step.color }}>{step.label}</span>
                  <span style={{ background:`${step.color}20`, color:step.color, borderRadius:999, padding:"1px 8px", fontSize:12, fontWeight:800 }}>{items.length}</span>
                </div>
                {total > 0 && <div style={{ fontSize:11, color:step.color, marginTop:2, fontWeight:600 }}>{fmt(total)}</div>}
              </div>
              <div style={{ padding:"10px 10px", display:"flex", flexDirection:"column", gap:8, flex:1 }}>
                {items.map(p => (
                  <div key={p.id} style={{ background:"#fff", borderRadius:10, padding:"12px 13px", border:`1.5px solid ${step.color}20`, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontWeight:700, fontSize:12, color:DARK, marginBottom:3 }}>{p.titre}</div>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>🏢 {p.entreprise_nom}</div>
                    {p.montant_estime && <div style={{ fontSize:12, fontWeight:700, color:"#059669", marginBottom:6 }}>{fmt(p.montant_estime)}</div>}
                    {p.date_cloture_prevue && <div style={{ fontSize:10, color:"#94a3b8" }}>📅 Clôture : {fmtDate(p.date_cloture_prevue)}</div>}
                    <div style={{ display:"flex", gap:5, marginTop:8, flexWrap:"wrap" }}>
                      <button onClick={()=>openEdit(p)} style={{ padding:"3px 8px", background:"#e0f2fe", color:BET, border:"none", borderRadius:5, cursor:"pointer", fontSize:10, fontWeight:700 }}>✏️</button>
                      <button onClick={()=>setShowHistorique(p)} style={{ padding:"3px 8px", background:"#f8fafc", color:"#64748b", border:"1px solid #e2e8f0", borderRadius:5, cursor:"pointer", fontSize:10, fontWeight:700 }}>📋 Historique</button>
                      <button onClick={()=>del(p.id)} style={{ padding:"3px 8px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:5, cursor:"pointer", fontSize:10, fontWeight:700 }}>🗑️</button>
                    </div>
                    {/* Boutons de progression rapide */}
                    <div style={{ display:"flex", gap:4, marginTop:6, flexWrap:"wrap" }}>
                      {PIPELINE_STEPS.filter(s => s.id !== step.id).map(s => (
                        <button key={s.id} disabled={movingId === p.id}
                          onClick={() => moveStatut(p.id, s.id)}
                          style={{ padding:"2px 7px", background:s.bg, color:s.color, border:`1px solid ${s.color}40`, borderRadius:4, cursor:"pointer", fontSize:9, fontWeight:700 }}>
                          → {s.label.replace(" ✅","").replace(" ❌","")}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div style={{ textAlign:"center", padding:"20px 10px", color:`${step.color}60`, fontSize:11 }}>Aucun prospect</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <Modal title={editItem ? "Modifier le prospect" : "Nouveau prospect B2B"} onClose={()=>setShowForm(false)}>
          <Field label="Entreprise" required>
            <select value={form.entreprise_id} onChange={e=>setForm({...form,entreprise_id:e.target.value})} style={selectStyle}>
              <option value="">— Choisir l'entreprise —</option>
              {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </Field>
          <Field label="Titre / Objet" required><input value={form.titre} onChange={e=>setForm({...form,titre:e.target.value})} style={inputStyle} placeholder="Formation Anglais — 20 employés" /></Field>
          <Field label="Étape pipeline">
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {PIPELINE_STEPS.map(s => (
                <button key={s.id} onClick={()=>setForm({...form,statut:s.id})}
                  style={{ padding:"6px 12px", borderRadius:8, border:`1.5px solid ${form.statut===s.id ? s.color : "#e2e8f0"}`, background: form.statut===s.id ? s.bg : "#fff", color: form.statut===s.id ? s.color : "#374151", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Montant estimé (FCFA)"><input type="number" value={form.montant_estime} onChange={e=>setForm({...form,montant_estime:e.target.value})} style={inputStyle} placeholder="2 500 000" /></Field>
          <Field label="Date de clôture prévue"><input type="date" value={form.date_cloture_prevue} onChange={e=>setForm({...form,date_cloture_prevue:e.target.value})} style={inputStyle} /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{ ...inputStyle, minHeight:70, resize:"vertical" }} /></Field>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "⏳…" : editItem ? "💾 Mettre à jour" : "✅ Créer"}</button>
            <button onClick={()=>setShowForm(false)} style={btnSecondary}>Annuler</button>
          </div>
        </Modal>
      )}

      {showHistorique && (
        <Modal title={`Historique — ${showHistorique.titre}`} subtitle={showHistorique.entreprise_nom} onClose={()=>setShowHistorique(null)}>
          {(showHistorique.historique || []).length === 0 ? (
            <p style={{ color:"#94a3b8", textAlign:"center" }}>Aucun historique</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[...(showHistorique.historique || [])].reverse().map((h, i) => {
                const st = PIPELINE_STEPS.find(s => s.id === h.statut);
                return (
                  <div key={i} style={{ padding:"10px 14px", borderRadius:8, background:st?.bg || "#f8fafc", border:`1.5px solid ${st?.color||"#e2e8f0"}20`, display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:st?.color||"#94a3b8", marginTop:4, flexShrink:0 }} />
                    <div>
                      <div style={{ fontWeight:700, fontSize:12, color:st?.color||DARK }}>{h.action}</div>
                      {h.note && <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{h.note}</div>}
                      <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>{fmtDate(h.date)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ONGLET DOCUMENTS COMMERCIAUX
// ════════════════════════════════════════════════════════════
function DocumentsCommerciaux({ documents, entreprises, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ entreprise_id:"", type_doc:"proforma", titre:"", montant:"", statut:"brouillon", notes:"", fichier_url:"" });
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("tous");

  const save = async () => {
    if (!form.entreprise_id || !form.titre) return toast.error("Entreprise et titre requis");
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/corporate/documents`, { method:"POST", headers: authH(), body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Document enregistré ✓"); setShowForm(false); onRefresh();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const updateStatut = async (id, statut) => {
    await fetch(`${API}/api/corporate/documents/${id}`, { method:"PATCH", headers: authH(), body: JSON.stringify({ statut }) });
    onRefresh();
  };

  const STATUT_COLORS = { brouillon:"#94a3b8", envoyé:"#0891b2", signé:"#16a34a", annulé:"#dc2626" };
  const filtered = filterType === "tous" ? documents : documents.filter(d => d.type_doc === filterType);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:6 }}>
          {["tous","proforma","bon_commande","contrat","autre"].map(t => (
            <button key={t} onClick={()=>setFilterType(t)}
              style={{ padding:"6px 12px", borderRadius:999, border:`1.5px solid ${filterType===t?B2B:"#e2e8f0"}`, background:filterType===t?B2B_L:"#fff", color:filterType===t?B2B:"#374151", fontWeight:700, fontSize:11, cursor:"pointer" }}>
              {t === "tous" ? "Tous" : DOC_TYPES[t]}
            </button>
          ))}
        </div>
        <button onClick={()=>{ setForm({ entreprise_id:"", type_doc:"proforma", titre:"", montant:"", statut:"brouillon", notes:"", fichier_url:"" }); setShowForm(true); }} style={btnPrimary}>➕ Nouveau document</button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📄</div>
          Aucun document commercial.
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
          {filtered.map(d => (
            <div key={d.id} style={{ background:"#fff", borderRadius:12, padding:"16px 18px", border:"1.5px solid #e2e8f0" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ fontSize:20 }}>{DOC_TYPES[d.type_doc]?.split(" ")[0]}</div>
                <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background:STATUT_COLORS[d.statut]+"20", color:STATUT_COLORS[d.statut], fontWeight:700 }}>{d.statut}</span>
              </div>
              <div style={{ fontWeight:700, fontSize:13, color:DARK, marginBottom:3 }}>{d.titre}</div>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>🏢 {d.entreprise_nom}</div>
              {d.montant && <div style={{ fontSize:12, fontWeight:700, color:"#059669", marginBottom:6 }}>{fmt(d.montant)}</div>}
              <div style={{ fontSize:10, color:"#94a3b8", marginBottom:10 }}>{DOC_TYPES[d.type_doc]} · {fmtDate(d.created_at)}</div>
              {d.fichier_url && <a href={d.fichier_url} target="_blank" rel="noreferrer" style={{ display:"block", marginBottom:8, fontSize:11, color:BET, textDecoration:"underline" }}>📎 Ouvrir le fichier</a>}
              <div style={{ display:"flex", gap:6 }}>
                {d.statut === "brouillon" && <button onClick={()=>updateStatut(d.id,"envoyé")} style={{ flex:1, padding:"5px 0", background:"#e0f2fe", color:BET, border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>📤 Marquer envoyé</button>}
                {d.statut === "envoyé" && <button onClick={()=>updateStatut(d.id,"signé")} style={{ flex:1, padding:"5px 0", background:"#dcfce7", color:"#166534", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>✅ Marquer signé</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Nouveau document commercial" onClose={()=>setShowForm(false)}>
          <Field label="Entreprise" required>
            <select value={form.entreprise_id} onChange={e=>setForm({...form,entreprise_id:e.target.value})} style={selectStyle}>
              <option value="">— Choisir —</option>
              {entreprises.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </Field>
          <Field label="Type de document">
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {Object.entries(DOC_TYPES).map(([v,l]) => (
                <button key={v} onClick={()=>setForm({...form,type_doc:v})}
                  style={{ padding:"6px 12px", borderRadius:8, border:`1.5px solid ${form.type_doc===v?B2B:"#e2e8f0"}`, background:form.type_doc===v?B2B_L:"#fff", color:form.type_doc===v?B2B:"#374151", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Titre" required><input value={form.titre} onChange={e=>setForm({...form,titre:e.target.value})} style={inputStyle} placeholder="Proforma Formation Anglais Q2 2026" /></Field>
          <Field label="Montant (FCFA)"><input type="number" value={form.montant} onChange={e=>setForm({...form,montant:e.target.value})} style={inputStyle} /></Field>
          <Field label="URL du fichier (Cloudinary/Drive)"><input value={form.fichier_url} onChange={e=>setForm({...form,fichier_url:e.target.value})} style={inputStyle} placeholder="https://…" /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{ ...inputStyle, minHeight:60, resize:"vertical" }} /></Field>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "⏳…" : "✅ Enregistrer"}</button>
            <button onClick={()=>setShowForm(false)} style={btnSecondary}>Annuler</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ONGLET DEVIS ENTREPRISES
// ════════════════════════════════════════════════════════════
const DEVIS_STATUTS = {
  brouillon: { label:"📝 Brouillon", color:"#94a3b8" },
  envoyé:    { label:"📤 Envoyé",    color:"#0891b2" },
  accepté:   { label:"✅ Accepté",   color:"#16a34a" },
  refusé:    { label:"❌ Refusé",    color:"#dc2626" },
  expiré:    { label:"⏰ Expiré",    color:"#f59e0b" },
};

function DevisEntreprises({ documents, entreprises, onRefresh }) {
  const devis = documents.filter(d => d.type_doc === "devis");
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [filterStatut, setFilterStatut] = useState("tous");
  const [form, setForm] = useState({ entreprise_id:"", titre:"", montant:"", validite:"", statut:"brouillon", notes:"", fichier_url:"" });

  const isExpired = (d) => d.validite && new Date(d.validite) < new Date() && d.statut === "envoyé";

  const openNew  = () => { setForm({ entreprise_id:"", titre:"", montant:"", validite:"", statut:"brouillon", notes:"", fichier_url:"" }); setEditItem(null); setShowForm(true); };
  const openEdit = (d) => { setForm({ entreprise_id:d.entreprise_id||"", titre:d.titre||"", montant:d.montant||"", validite:d.validite||"", statut:d.statut||"brouillon", notes:d.notes||"", fichier_url:d.fichier_url||"" }); setEditItem(d); setShowForm(true); };

  const save = async () => {
    if (!form.entreprise_id || !form.titre) return toast.error("Entreprise et objet requis");
    setSaving(true);
    try {
      const url    = editItem ? `${API}/api/corporate/documents/${editItem.id}` : `${API}/api/corporate/documents`;
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: authH(), body: JSON.stringify({ ...form, type_doc:"devis" }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editItem ? "Devis modifié ✓" : "Devis créé ✓");
      setShowForm(false); onRefresh();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const updateStatut = async (id, statut) => {
    await fetch(`${API}/api/corporate/documents/${id}`, { method:"PATCH", headers: authH(), body: JSON.stringify({ statut }) });
    toast.success(`Devis marqué "${statut}" ✓`); onRefresh();
  };

  const del = async (id) => {
    if (!window.confirm("Supprimer ce devis ?")) return;
    await fetch(`${API}/api/corporate/documents/${id}`, { method:"DELETE", headers: authH() });
    toast.success("Devis supprimé"); onRefresh();
  };

  const filtered = filterStatut === "tous" ? devis
    : filterStatut === "expiré" ? devis.filter(d => isExpired(d))
    : devis.filter(d => d.statut === filterStatut && !isExpired(d));

  const totalAccepte   = devis.filter(d => d.statut === "accepté").reduce((s,d) => s+(Number(d.montant)||0), 0);
  const totalEnAttente = devis.filter(d => d.statut === "envoyé" && !isExpired(d)).reduce((s,d) => s+(Number(d.montant)||0), 0);
  const nbExpires      = devis.filter(d => isExpired(d)).length;

  return (
    <div>
      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:20 }}>
        <div style={{ background:"#f0fdf4", borderRadius:12, padding:"14px 16px", border:"1.5px solid #bbf7d0" }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#16a34a" }}>{devis.filter(d=>d.statut==="accepté").length}</div>
          <div style={{ fontSize:11, color:"#166534", marginTop:2 }}>✅ Devis acceptés</div>
          <div style={{ fontSize:12, fontWeight:700, color:"#16a34a", marginTop:2 }}>{fmt(totalAccepte)}</div>
        </div>
        <div style={{ background:"#eff6ff", borderRadius:12, padding:"14px 16px", border:"1.5px solid #bfdbfe" }}>
          <div style={{ fontSize:22, fontWeight:800, color:B2B }}>{devis.filter(d=>d.statut==="envoyé"&&!isExpired(d)).length}</div>
          <div style={{ fontSize:11, color:B2B, marginTop:2 }}>📤 En attente de réponse</div>
          <div style={{ fontSize:12, fontWeight:700, color:B2B, marginTop:2 }}>{fmt(totalEnAttente)}</div>
        </div>
        <div style={{ background:"#fefce8", borderRadius:12, padding:"14px 16px", border:"1.5px solid #fde68a" }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#d97706" }}>{nbExpires}</div>
          <div style={{ fontSize:11, color:"#92400e", marginTop:2 }}>⏰ Devis expirés</div>
        </div>
        <div style={{ background:"#fef2f2", borderRadius:12, padding:"14px 16px", border:"1.5px solid #fecaca" }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#dc2626" }}>{devis.filter(d=>d.statut==="refusé").length}</div>
          <div style={{ fontSize:11, color:"#dc2626", marginTop:2 }}>❌ Devis refusés</div>
        </div>
      </div>

      {/* Filtres + bouton */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["tous","brouillon","envoyé","accepté","refusé","expiré"].map(s => {
            const st = DEVIS_STATUTS[s] || {};
            return (
              <button key={s} onClick={()=>setFilterStatut(s)}
                style={{ padding:"5px 11px", borderRadius:999, border:`1.5px solid ${filterStatut===s?(st.color||B2B):"#e2e8f0"}`, background:filterStatut===s?`${st.color||B2B}15`:"#fff", color:filterStatut===s?(st.color||B2B):"#374151", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                {s === "tous" ? "Tous" : st.label || s}
              </button>
            );
          })}
        </div>
        <button onClick={openNew} style={btnPrimary}>➕ Nouveau devis</button>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📄</div>
          {filterStatut === "tous" ? "Aucun devis. Créez votre premier devis entreprise." : `Aucun devis "${filterStatut}".`}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(d => {
            const expired = isExpired(d);
            const st = DEVIS_STATUTS[expired ? "expiré" : d.statut] || {};
            return (
              <div key={d.id} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:`1.5px solid ${expired?"#fde68a":"#e2e8f0"}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <span style={{ fontWeight:800, fontSize:14, color:DARK }}>{d.titre}</span>
                    <span style={{ fontSize:10, padding:"2px 9px", borderRadius:999, background:`${st.color}20`, color:st.color, fontWeight:700 }}>{st.label}</span>
                    {expired && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background:"#fef3c7", color:"#92400e", fontWeight:700 }}>⚠️ Expiré</span>}
                  </div>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>🏢 {d.entreprise_nom}</div>
                  <div style={{ display:"flex", gap:16, fontSize:11, color:"#94a3b8", flexWrap:"wrap" }}>
                    <span>📅 Créé le {fmtDate(d.created_at)}</span>
                    {d.validite && <span style={{ color:expired?"#d97706":"#94a3b8" }}>⏰ Valide jusqu'au {fmtDate(d.validite)}</span>}
                  </div>
                  {d.notes && <div style={{ fontSize:11, color:"#64748b", marginTop:5, fontStyle:"italic" }}>{d.notes}</div>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
                  {d.montant && <div style={{ fontWeight:800, fontSize:16, color:"#059669" }}>{fmt(d.montant)}</div>}
                  {d.fichier_url && <a href={d.fichier_url} target="_blank" rel="noreferrer" style={{ padding:"5px 10px", background:"#f0f9ff", color:BET, border:`1px solid ${BET}30`, borderRadius:6, fontSize:11, fontWeight:700, textDecoration:"none" }}>📎 Fichier</a>}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
                    {d.statut === "brouillon" && <button onClick={()=>updateStatut(d.id,"envoyé")} style={{ padding:"5px 10px", background:"#e0f2fe", color:BET, border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>📤 Envoyer</button>}
                    {(d.statut === "envoyé" || expired) && <button onClick={()=>updateStatut(d.id,"envoyé")} style={{ padding:"5px 10px", background:"#fef3c7", color:"#92400e", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>📧 Relancer</button>}
                    {d.statut === "envoyé" && !expired && <button onClick={()=>updateStatut(d.id,"accepté")} style={{ padding:"5px 10px", background:"#dcfce7", color:"#166534", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>✅ Accepté</button>}
                    {d.statut === "envoyé" && !expired && <button onClick={()=>updateStatut(d.id,"refusé")} style={{ padding:"5px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>❌ Refusé</button>}
                    <button onClick={()=>openEdit(d)} style={{ padding:"5px 10px", background:"#f8fafc", color:"#374151", border:"1px solid #e2e8f0", borderRadius:6, cursor:"pointer", fontSize:11 }}>✏️</button>
                    <button onClick={()=>del(d.id)} style={{ padding:"5px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:6, cursor:"pointer", fontSize:11 }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <Modal title={editItem ? "Modifier le devis" : "Nouveau devis entreprise"} onClose={()=>setShowForm(false)} wide>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label="Entreprise" required>
                <select value={form.entreprise_id} onChange={e=>setForm({...form,entreprise_id:e.target.value})} style={selectStyle}>
                  <option value="">— Choisir l'entreprise —</option>
                  {entreprises.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label="Objet du devis" required>
                <input value={form.titre} onChange={e=>setForm({...form,titre:e.target.value})} style={inputStyle} placeholder="Formation Anglais Professionnel — 20 employés" />
              </Field>
            </div>
            <Field label="Montant estimé (FCFA)">
              <input type="number" value={form.montant} onChange={e=>setForm({...form,montant:e.target.value})} style={inputStyle} placeholder="3 500 000" />
            </Field>
            <Field label="Statut">
              <select value={form.statut} onChange={e=>setForm({...form,statut:e.target.value})} style={selectStyle}>
                {Object.entries(DEVIS_STATUTS).map(([v,s])=><option key={v} value={v}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Date de validité">
              <input type="date" value={form.validite} onChange={e=>setForm({...form,validite:e.target.value})} style={inputStyle} />
            </Field>
            <Field label="URL du fichier (Drive / Cloudinary)">
              <input value={form.fichier_url} onChange={e=>setForm({...form,fichier_url:e.target.value})} style={inputStyle} placeholder="https://…" />
            </Field>
            <div style={{ gridColumn:"1/-1" }}>
              <Field label="Notes internes">
                <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{ ...inputStyle, minHeight:70, resize:"vertical" }} />
              </Field>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "⏳…" : editItem ? "💾 Mettre à jour" : "✅ Créer le devis"}</button>
            <button onClick={()=>setShowForm(false)} style={btnSecondary}>Annuler</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ONGLET FACTURATION B2B
// ════════════════════════════════════════════════════════════
function FacturationB2B({ factures, entreprises, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ entreprise_id:"", objet:"", montant_ht:"", taux_tva:18, date_echeance:"", notes:"" });
  const [saving, setSaving] = useState(false);
  const [filterStatut, setFilterStatut] = useState("tous");

  const totalPaye = factures.filter(f=>f.statut==="payée").reduce((s,f)=>s+(Number(f.montant_ttc)||0),0);
  const totalEnAttente = factures.filter(f=>["envoyée","brouillon"].includes(f.statut)).reduce((s,f)=>s+(Number(f.montant_ttc)||0),0);
  const totalRetard = factures.filter(f=>f.statut==="en_retard").reduce((s,f)=>s+(Number(f.montant_ttc)||0),0);

  const save = async () => {
    if (!form.entreprise_id || !form.montant_ht) return toast.error("Entreprise et montant requis");
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/corporate/factures`, { method:"POST", headers: authH(), body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Facture créée ✓"); setShowForm(false); onRefresh();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const updateStatut = async (id, statut, extra = {}) => {
    await fetch(`${API}/api/corporate/factures/${id}`, { method:"PATCH", headers: authH(), body: JSON.stringify({ statut, ...extra }) });
    toast.success(`Facture marquée ${statut}`); onRefresh();
  };

  const filtered = filterStatut === "tous" ? factures : factures.filter(f => f.statut === filterStatut);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:20 }}>
        <div style={{ background:"#f0fdf4", borderRadius:12, padding:"14px 16px", border:"1.5px solid #bbf7d0" }}>
          <div style={{ fontSize:20, fontWeight:800, color:"#16a34a" }}>{fmt(totalPaye)}</div>
          <div style={{ fontSize:11, color:"#166534" }}>✅ CA encaissé</div>
        </div>
        <div style={{ background:"#eff6ff", borderRadius:12, padding:"14px 16px", border:"1.5px solid #bfdbfe" }}>
          <div style={{ fontSize:20, fontWeight:800, color:B2B }}>{fmt(totalEnAttente)}</div>
          <div style={{ fontSize:11, color:B2B }}>📤 En attente</div>
        </div>
        <div style={{ background:"#fef2f2", borderRadius:12, padding:"14px 16px", border:"1.5px solid #fecaca" }}>
          <div style={{ fontSize:20, fontWeight:800, color:"#dc2626" }}>{fmt(totalRetard)}</div>
          <div style={{ fontSize:11, color:"#dc2626" }}>🔴 En retard</div>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["tous",...Object.keys(FACT_STATUTS)].map(s => (
            <button key={s} onClick={()=>setFilterStatut(s)}
              style={{ padding:"5px 11px", borderRadius:999, border:`1.5px solid ${filterStatut===s?(FACT_COLORS[s]||B2B):"#e2e8f0"}`, background:filterStatut===s?`${FACT_COLORS[s]||B2B}15`:"#fff", color:filterStatut===s?(FACT_COLORS[s]||B2B):"#374151", fontWeight:700, fontSize:11, cursor:"pointer" }}>
              {s === "tous" ? "Toutes" : FACT_STATUTS[s]}
            </button>
          ))}
        </div>
        <button onClick={()=>{ setForm({ entreprise_id:"", objet:"", montant_ht:"", taux_tva:18, date_echeance:"", notes:"" }); setShowForm(true); }} style={btnPrimary}>➕ Nouvelle facture</button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🧾</div>
          Aucune facture.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(f => {
            const c = FACT_COLORS[f.statut] || "#94a3b8";
            const isRetard = f.statut === "en_retard";
            const isEnvoyee = f.statut === "envoyée";
            return (
              <div key={f.id} style={{ background:"#fff", borderRadius:12, padding:"14px 18px", border:`1.5px solid ${isRetard?"#fecaca":"#e2e8f0"}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:`${c}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🧾</div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                      <span style={{ fontWeight:800, fontSize:13, color:DARK }}>{f.numero}</span>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background:`${c}15`, color:c, fontWeight:700 }}>{FACT_STATUTS[f.statut]}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#64748b" }}>🏢 {f.entreprise_nom} {f.objet ? `· ${f.objet}` : ""}</div>
                    {f.date_echeance && <div style={{ fontSize:10, color: isRetard?"#dc2626":"#94a3b8", marginTop:2 }}>📅 Échéance : {fmtDate(f.date_echeance)}</div>}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:800, fontSize:14, color:DARK }}>{fmt(f.montant_ttc)}</div>
                    <div style={{ fontSize:10, color:"#94a3b8" }}>HT : {fmt(f.montant_ht)} · TVA {f.taux_tva}%</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {f.statut === "brouillon" && <button onClick={()=>updateStatut(f.id,"envoyée")} style={{ padding:"5px 10px", background:"#e0f2fe", color:BET, border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>📤 Envoyer</button>}
                    {isEnvoyee && <button onClick={()=>updateStatut(f.id,"payée",{ date_paiement: new Date().toISOString().slice(0,10) })} style={{ padding:"5px 10px", background:"#dcfce7", color:"#166534", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>✅ Payée</button>}
                    {isEnvoyee && <button onClick={()=>updateStatut(f.id,"en_retard")} style={{ padding:"5px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>🔴 Retard</button>}
                    {isRetard && <button onClick={()=>updateStatut(f.id,"payée",{ date_paiement: new Date().toISOString().slice(0,10) })} style={{ padding:"5px 10px", background:"#dcfce7", color:"#166534", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>✅ Encaisser</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Nouvelle facture B2B" onClose={()=>setShowForm(false)}>
          <Field label="Entreprise" required>
            <select value={form.entreprise_id} onChange={e=>setForm({...form,entreprise_id:e.target.value})} style={selectStyle}>
              <option value="">— Choisir —</option>
              {entreprises.map(e=><option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </Field>
          <Field label="Objet"><input value={form.objet} onChange={e=>setForm({...form,objet:e.target.value})} style={inputStyle} placeholder="Formation Anglais professionnel — 15 employés" /></Field>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:12 }}>
            <Field label="Montant HT (FCFA)" required><input type="number" value={form.montant_ht} onChange={e=>setForm({...form,montant_ht:e.target.value})} style={inputStyle} /></Field>
            <Field label="TVA (%)"><input type="number" value={form.taux_tva} onChange={e=>setForm({...form,taux_tva:e.target.value})} style={inputStyle} /></Field>
          </div>
          {form.montant_ht && (
            <div style={{ marginBottom:14, padding:"10px 14px", borderRadius:8, background:"#f0fdf4", border:"1px solid #bbf7d0", fontSize:12, fontWeight:700, color:"#166534" }}>
              Montant TTC : {fmt(parseFloat(form.montant_ht||0) * (1 + parseFloat(form.taux_tva||18)/100))}
            </div>
          )}
          <Field label="Date d'échéance"><input type="date" value={form.date_echeance} onChange={e=>setForm({...form,date_echeance:e.target.value})} style={inputStyle} /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{ ...inputStyle, minHeight:60, resize:"vertical" }} /></Field>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "⏳…" : "✅ Créer la facture"}</button>
            <button onClick={()=>setShowForm(false)} style={btnSecondary}>Annuler</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════
const TABS = [
  { id:"overview",   label:"Vue d'ensemble",     icon:"📊" },
  { id:"entreprises",label:"Comptes entreprises", icon:"🏢" },
  { id:"pipeline",   label:"Pipeline B2B",        icon:"🔄" },
  { id:"devis",      label:"Devis",               icon:"📄" },
  { id:"documents",  label:"Documents",           icon:"🗂️" },
  { id:"factures",       label:"Facturation",         icon:"🧾" },
  { id:"notifications",  label:"Notifications",       icon:"🔔" },
];

export default function CorporateDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [entreprises, setEntreprises] = useState([]);
  const [prospects, setProspects]   = useState([]);
  const [documents, setDocuments]   = useState([]);
  const [factures, setFactures]     = useState([]);
  const [loading, setLoading]       = useState(true);

  const profil = JSON.parse(localStorage.getItem("admin_profil") || "{}");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rE, rP, rD, rF] = await Promise.all([
        fetch(`${API}/api/corporate/entreprises`, { headers: authH() }),
        fetch(`${API}/api/corporate/prospects`,   { headers: authH() }),
        fetch(`${API}/api/corporate/documents`,   { headers: authH() }),
        fetch(`${API}/api/corporate/factures`,    { headers: authH() }),
      ]);
      const [dE, dP, dD, dF] = await Promise.all([rE.json(), rP.json(), rD.json(), rF.json()]);
      setEntreprises(dE.entreprises || []);
      setProspects(dP.prospects || []);
      setDocuments(dD.documents || []);
      setFactures(dF.factures || []);
    } catch { toast.error("Erreur chargement des données"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const facturesEnRetard = factures.filter(f => f.statut === "en_retard").length;
  const devisExpires     = documents.filter(d => d.type_doc === "devis" && d.validite && new Date(d.validite) < new Date() && d.statut === "envoyé").length;
  const tabBadges = { factures: facturesEnRetard || null, devis: devisExpires || null };

  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <Toaster position="top-right" />

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${DARK} 0%, ${B2B} 100%)`, padding:"18px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏢</div>
            <div>
              <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:"#fff" }}>Dashboard Corporate B2B</h1>
              <p style={{ margin:0, fontSize:11, color:"#bfdbfe", marginTop:1 }}>Assistante Commerciale Corporate — BET</p>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {facturesEnRetard > 0 && (
            <div style={{ padding:"5px 12px", background:"#dc2626", borderRadius:999, fontSize:12, color:"#fff", fontWeight:800 }}>
              🔴 {facturesEnRetard} facture{facturesEnRetard>1?"s":""} en retard
            </div>
          )}
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{profil.prenom} {profil.nom}</div>
            <div style={{ fontSize:11, color:"#bfdbfe" }}>Commerciale Corporate</div>
          </div>
          <button onClick={() => { localStorage.removeItem("admin_token"); localStorage.removeItem("admin_profil"); window.location.href = "/login-admin"; }}
            style={{ padding:"7px 14px", background:"rgba(255,255,255,0.1)", color:"#fff", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600 }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Navigation onglets */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0 24px", display:"flex", gap:0, overflowX:"auto" }}>
        {TABS.map(tab => {
          const badge = tabBadges[tab.id];
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding:"14px 18px", background:"none", border:"none", cursor:"pointer", fontWeight: isActive ? 800 : 600, fontSize:13, color: isActive ? B2B : "#64748b", borderBottom:`2.5px solid ${isActive ? B2B : "transparent"}`, whiteSpace:"nowrap", position:"relative", display:"flex", alignItems:"center", gap:6, transition:"color .15s" }}>
              {tab.icon} {tab.label}
              {badge && <span style={{ position:"absolute", top:8, right:6, width:16, height:16, borderRadius:"50%", background:"#dc2626", color:"#fff", fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{badge}</span>}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      <div style={{ padding:"24px 28px", maxWidth:1300, margin:"0 auto" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:80, color:"#94a3b8" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>⏳</div>
            <div>Chargement des données…</div>
          </div>
        ) : (
          <>
            {activeTab === "overview"    && <VueEnsemble entreprises={entreprises} prospects={prospects} factures={factures} />}
            {activeTab === "entreprises" && <CompteEntreprises entreprises={entreprises} onRefresh={load} />}
            {activeTab === "pipeline"    && <PipelineB2B prospects={prospects} entreprises={entreprises} onRefresh={load} />}
            {activeTab === "devis"       && <DevisEntreprises documents={documents} entreprises={entreprises} onRefresh={load} />}
            {activeTab === "documents"   && <DocumentsCommerciaux documents={documents} entreprises={entreprises} onRefresh={load} />}
            {activeTab === "factures"    && <FacturationB2B factures={factures} entreprises={entreprises} onRefresh={load} />}
            {activeTab === "notifications" && (
              <div style={{ padding: "24px 0" }}>
                <NotificationsTab userId={profil?.id} accentColor="#2563eb" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
