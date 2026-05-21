// src/Pages/CustomerCareDashboard/CustomerCareDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import NotificationBell from "../../Components/NotificationBell";
import NotificationsTab from "../../Components/NotificationsTab";
import MessagerieTab from "../../Components/MessagerieTab";
import { useNotifPoller } from "../../hooks/useNotifPoller";

/* ═══════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════ */
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
});
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const CC_COLOR    = "#0e7490";
const CC_DARK     = "#164e63";
const CC_LIGHT    = "#ecfeff";
const CC_GRADIENT = "linear-gradient(135deg, #164e63 0%, #0e7490 100%)";

const PRIORITE_CFG = {
  faible:   { label: "Faible",   color: "#16a34a", bg: "#dcfce7", icon: "🟢", order: 4 },
  normale:  { label: "Normale",  color: "#0891b2", bg: "#e0f2fe", icon: "🔵", order: 3 },
  haute:    { label: "Haute",    color: "#d97706", bg: "#fef3c7", icon: "🟡", order: 2 },
  critique: { label: "Critique", color: "#dc2626", bg: "#fee2e2", icon: "🔴", order: 1 },
};

const STATUT_CFG = {
  ouverte:  { label: "Ouverte",  color: "#dc2626", bg: "#fee2e2", icon: "🔓" },
  en_cours: { label: "En cours", color: "#d97706", bg: "#fef3c7", icon: "⚙️" },
  resolue:  { label: "Résolue",  color: "#16a34a", bg: "#dcfce7", icon: "✅" },
  fermee:   { label: "Fermée",   color: "#6b7280", bg: "#f3f4f6", icon: "🔒" },
};

const OBJETS_PLAINTE = [
  "Absence/retard du coach",
  "Qualité des cours insuffisante",
  "Problème de communication avec le coach",
  "Problème technique (cours en ligne)",
  "Facturation / paiement incorrect",
  "Non-respect des horaires",
  "Comportement inapproprié",
  "Contenu du cours non adapté",
  "Demande de remboursement",
  "Autre",
];

/* ═══════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES
═══════════════════════════════════════════════════════ */
const StatCard = ({ label, value, color, icon, sub, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "#fff",
      padding: 16,
      borderRadius: 12,
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      cursor: onClick ? "pointer" : "default",
      transition: "transform .15s",
      border: "1px solid #f1f5f9",
      flex: 1,
      minWidth: 160,
    }}
  >
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 10,
        background: color + "18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "#9ca3af" }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 800, color, lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{sub}</div>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function CustomerCareDashboard() {
  const navigate = useNavigate();
  const profil = JSON.parse(localStorage.getItem("admin_profil") || "null");
  const prenom = profil?.prenom || "";
  const nom = profil?.nom || "";
  const nomComplet =
    [prenom, nom].filter(Boolean).join(" ") || "Customer Care";
  const initiales =
    [prenom[0], nom[0]].filter(Boolean).join("").toUpperCase() || "CC";

  useNotifPoller({ userId: profil?.id });

  const [activeTab, setActiveTab] = useState("dashboard");

  // ── Plaintes ──
  const [plaintes, setPlaintes] = useState([]);
  const [plaintesLoading, setPlaintesLoading] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtrePriorite, setFiltrePriorite] = useState("tous");
  const [searchQ, setSearchQ] = useState("");
  const [noteResolution, setNoteResolution] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPlaintes = useCallback(async () => {
    setPlaintesLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/plaintes`, {
        headers: authHeaders(),
      });
      const d = await r.json();
      setPlaintes(d.plaintes || []);
    } catch {}
    finally {
      setPlaintesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "plaintes" || activeTab === "dashboard") fetchPlaintes();
  }, [activeTab, fetchPlaintes]);

  const patchPlainte = async (id, updates) => {
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/plaintes/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      if (!r.ok) throw new Error();
      await fetchPlaintes();
      toast.success("Mis à jour ✓");
    } catch {
      toast.error("Erreur mise à jour");
    } finally {
      setSaving(false);
    }
  };

  // ── KPIs ──
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const kpiOuvertes = useMemo(
    () => plaintes.filter((p) => p.statut === "ouverte").length,
    [plaintes]
  );
  const kpiEnCours = useMemo(
    () => plaintes.filter((p) => p.statut === "en_cours").length,
    [plaintes]
  );
  const kpiResoluesMois = useMemo(
    () =>
      plaintes.filter((p) => {
        if (p.statut !== "resolue") return false;
        const d = new Date(p.date_resolution || p.updated_at || p.created_at);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length,
    [plaintes, thisMonth, thisYear]
  );
  const kpiTaux = useMemo(() => {
    const total = plaintes.length;
    if (!total) return "—";
    const resolues = plaintes.filter(
      (p) => p.statut === "resolue" || p.statut === "fermee"
    ).length;
    return Math.round((resolues / total) * 100) + "%";
  }, [plaintes]);

  // ── Filtre et tri ──
  const prioriteOrder = { critique: 1, haute: 2, normale: 3, faible: 4 };

  const plaintesFiltered = useMemo(() => {
    let list = [...plaintes];

    if (filtreStatut !== "tous") {
      list = list.filter((p) => p.statut === filtreStatut);
    }
    if (filtrePriorite !== "tous") {
      list = list.filter((p) => p.priorite === filtrePriorite);
    }
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (p) =>
          (p.apprenant_nom || "").toLowerCase().includes(q) ||
          (p.apprenant_email || "").toLowerCase().includes(q) ||
          (p.objet || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const pa = prioriteOrder[a.priorite] || 3;
      const pb = prioriteOrder[b.priorite] || 3;
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return list;
  }, [plaintes, filtreStatut, filtrePriorite, searchQ]);

  // Top 5 plaintes non résolues pour le dashboard
  const plaintesUrgentes = useMemo(() => {
    return [...plaintes]
      .filter((p) => p.statut === "ouverte" || p.statut === "en_cours")
      .sort((a, b) => {
        const pa = prioriteOrder[a.priorite] || 3;
        const pb = prioriteOrder[b.priorite] || 3;
        if (pa !== pb) return pa - pb;
        return new Date(b.created_at) - new Date(a.created_at);
      })
      .slice(0, 5);
  }, [plaintes]);

  // ── Déconnexion ──
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_profil");
    navigate("/login");
  };

  /* ══════════════════════════════════════════
     RENDU
  ══════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: "#f0fdfe", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Toaster position="top-right" />

      {/* ── HEADER ── */}
      <div style={{ background: CC_GRADIENT, color: "#fff", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Ligne principale */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0 14px" }}>
            {/* Identité */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, flexShrink: 0,
              }}>
                {initiales}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{nomComplet}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {profil?.email || ""}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>
                  Service Après-Vente · Gestion des plaintes
                </div>
              </div>
            </div>

            {/* Actions header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <NotificationBell userId={profil?.id} accentColor="#fff" />
              <button
                onClick={handleLogout}
                style={{
                  padding: "7px 16px", borderRadius: 8,
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Mini-bar stats */}
          <div style={{ display: "flex", gap: 24, paddingBottom: 14, flexWrap: "wrap" }}>
            {[
              { label: "Ouvertes", value: kpiOuvertes, color: "#fca5a5" },
              { label: "En cours", value: kpiEnCours, color: "#fde68a" },
              { label: "Résolues (mois)", value: kpiResoluesMois, color: "#86efac" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Onglets */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "dashboard",     label: "🏠 Dashboard" },
              { key: "plaintes",      label: "📋 Plaintes" },
              { key: "messages",      label: "💬 Messages" },
              { key: "notifications", label: "🔔 Notifications" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: "8px 18px", borderRadius: "8px 8px 0 0",
                  border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: activeTab === t.key ? "#fff" : "rgba(255,255,255,0.12)",
                  color: activeTab === t.key ? CC_DARK : "rgba(255,255,255,0.85)",
                  transition: "all .15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* ════════ DASHBOARD ════════ */}
        {activeTab === "dashboard" && (
          <div>
            {/* 4 StatCards */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <StatCard label="Plaintes ouvertes"    value={kpiOuvertes}     color="#dc2626" icon="🔓" onClick={() => { setFiltreStatut("ouverte"); setActiveTab("plaintes"); }} />
              <StatCard label="En cours"             value={kpiEnCours}      color="#d97706" icon="⚙️" onClick={() => { setFiltreStatut("en_cours"); setActiveTab("plaintes"); }} />
              <StatCard label="Résolues ce mois"     value={kpiResoluesMois} color="#16a34a" icon="✅" />
              <StatCard label="Taux de résolution"   value={kpiTaux}         color={CC_COLOR} icon="📊" />
            </div>

            {/* Plaintes urgentes */}
            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "20px 22px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, color: CC_DARK, display: "flex", alignItems: "center", gap: 8 }}>
                🚨 Plaintes en attente (priorité haute/critique en premier)
              </h3>

              {plaintesLoading ? (
                <div style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>Chargement…</div>
              ) : plaintesUrgentes.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>
                  ✅ Aucune plainte en attente — tout est traité !
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {plaintesUrgentes.map((p) => {
                    const pCfg = PRIORITE_CFG[p.priorite] || PRIORITE_CFG.normale;
                    const sCfg = STATUT_CFG[p.statut] || STATUT_CFG.ouverte;
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: pCfg.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{p.apprenant_nom}</div>
                          <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.objet}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <span style={{ background: pCfg.bg, color: pCfg.color, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>{pCfg.icon} {pCfg.label}</span>
                          <span style={{ background: sCfg.bg, color: sCfg.color, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{sCfg.icon} {sCfg.label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{fmtDateTime(p.created_at)}</div>
                        <button
                          onClick={() => { setActiveTab("plaintes"); }}
                          style={{ padding: "4px 12px", borderRadius: 7, background: CC_LIGHT, color: CC_DARK, border: `1px solid ${CC_COLOR}40`, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          Voir →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ PLAINTES ════════ */}
        {activeTab === "plaintes" && (
          <div>
            {/* Barre de filtres */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 18, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              {/* Search */}
              <input
                type="text"
                placeholder="🔍 Rechercher apprenant, objet…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, flex: 1, minWidth: 200, outline: "none" }}
              />

              {/* Pills statut */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["tous", "ouverte", "en_cours", "resolue", "fermee"].map((s) => {
                  const cfg = STATUT_CFG[s];
                  const active = filtreStatut === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setFiltreStatut(s)}
                      style={{
                        padding: "5px 13px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1.5px solid",
                        background: active ? (cfg ? cfg.bg : CC_LIGHT) : "#f8fafc",
                        color: active ? (cfg ? cfg.color : CC_COLOR) : "#64748b",
                        borderColor: active ? (cfg ? cfg.color : CC_COLOR) : "#e2e8f0",
                        transition: "all .15s",
                      }}
                    >
                      {s === "tous" ? "Tous" : (cfg ? `${cfg.icon} ${cfg.label}` : s)}
                    </button>
                  );
                })}
              </div>

              {/* Select priorité */}
              <select
                value={filtrePriorite}
                onChange={(e) => setFiltrePriorite(e.target.value)}
                style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "#374151", background: "#fff", cursor: "pointer" }}
              >
                <option value="tous">Toutes priorités</option>
                {Object.entries(PRIORITE_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>

              {/* Compteur */}
              <div style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", fontWeight: 600, flexShrink: 0 }}>
                {plaintesFiltered.length} résultat{plaintesFiltered.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Liste des plaintes */}
            {plaintesLoading ? (
              <div style={{ textAlign: "center", padding: 48, color: "#94a3b8", fontSize: 15 }}>Chargement des plaintes…</div>
            ) : plaintesFiltered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "#94a3b8", fontSize: 15 }}>Aucune plainte trouvée.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {plaintesFiltered.map((p) => {
                  const pCfg = PRIORITE_CFG[p.priorite] || PRIORITE_CFG.normale;
                  const sCfg = STATUT_CFG[p.statut] || STATUT_CFG.ouverte;
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        border: "1.5px solid #e5e7eb",
                        overflow: "hidden",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Bande couleur priorité */}
                      <div style={{ height: 4, background: pCfg.color }} />

                      <div style={{ padding: "14px 16px" }}>
                        {/* Header card */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{p.apprenant_nom}</div>
                            {p.apprenant_email && (
                              <div style={{ fontSize: 11, color: "#64748b" }}>{p.apprenant_email}</div>
                            )}
                            {p.apprenant_telephone && (
                              <div style={{ fontSize: 11, color: "#64748b" }}>📞 {p.apprenant_telephone}</div>
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <span style={{ background: pCfg.bg, color: pCfg.color, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 800 }}>
                              {pCfg.icon} {pCfg.label}
                            </span>
                            <span style={{ background: sCfg.bg, color: sCfg.color, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                              {sCfg.icon} {sCfg.label}
                            </span>
                          </div>
                        </div>

                        {/* Objet + coach */}
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ background: "#f0fdfe", color: CC_COLOR, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700, border: `1px solid ${CC_COLOR}30` }}>
                            📋 {p.objet}
                          </span>
                          {p.coach_nom && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: "#64748b" }}>
                              👨‍🏫 {p.coach_nom}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {p.description && (
                          <div style={{ fontSize: 12, color: "#374151", marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {p.description}
                          </div>
                        )}

                        {/* Meta */}
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span>📅 {fmtDateTime(p.created_at)}</span>
                          {p.signale_par_nom && <span>🚨 Signalé par {p.signale_par_nom}</span>}
                          {p.prise_en_charge_par_nom && <span>⚙️ Pris en charge par {p.prise_en_charge_par_nom}</span>}
                        </div>

                        {/* Note résolution existante */}
                        {p.note_resolution && (
                          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#15803d", marginBottom: 10 }}>
                            ✅ {p.note_resolution}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                          {p.statut === "ouverte" && (
                            <button
                              onClick={() =>
                                patchPlainte(p.id, {
                                  statut: "en_cours",
                                  prise_en_charge_par_id: profil?.id,
                                  prise_en_charge_par_nom: nomComplet,
                                })
                              }
                              disabled={saving}
                              style={{ padding: "6px 14px", background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                            >
                              ⚙️ Prendre en charge
                            </button>
                          )}

                          {p.statut === "en_cours" && (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                              <textarea
                                placeholder="Note de résolution…"
                                defaultValue={p.note_resolution || ""}
                                onBlur={(e) => setNoteResolution(e.target.value)}
                                rows={2}
                                style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #a5f3fc", borderRadius: 7, fontSize: 12, resize: "vertical", boxSizing: "border-box" }}
                              />
                              <button
                                onClick={() =>
                                  patchPlainte(p.id, {
                                    statut: "resolue",
                                    note_resolution: noteResolution || p.note_resolution,
                                    date_resolution: new Date().toISOString().slice(0, 10),
                                  })
                                }
                                disabled={saving}
                                style={{ padding: "6px 14px", background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              >
                                ✅ Marquer résolue
                              </button>
                            </div>
                          )}

                          {p.statut === "resolue" && (
                            <button
                              onClick={() => patchPlainte(p.id, { statut: "fermee" })}
                              disabled={saving}
                              style={{ padding: "6px 14px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                            >
                              🔒 Fermer la plainte
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════ MESSAGES ════════ */}
        {activeTab === "messages" && (
          <div style={{ padding: "0 0 32px" }}>
            <MessagerieTab accentColor={CC_COLOR} />
          </div>
        )}

        {/* ════════ NOTIFICATIONS ════════ */}
        {activeTab === "notifications" && (
          <NotificationsTab userId={profil?.id} accentColor={CC_COLOR} />
        )}
      </div>
    </div>
  );
}
