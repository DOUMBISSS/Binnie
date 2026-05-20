import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications";

const TYPES_CONFIG = {
  paiement:     { icon:"💳", color:"#059669", bg:"#d1fae5", label:"Paiement" },
  inscription:  { icon:"📋", color:"#0891b2", bg:"#e0f2fe", label:"Inscription" },
  assignation:  { icon:"🎯", color:"#7c3aed", bg:"#ede9fe", label:"Affectation" },
  message:      { icon:"💬", color:"#f59e0b", bg:"#fef3c7", label:"Message" },
  cours:        { icon:"📚", color:"#2563eb", bg:"#dbeafe", label:"Cours" },
  evaluation:   { icon:"📝", color:"#dc2626", bg:"#fee2e2", label:"Évaluation" },
  honoraire:    { icon:"💵", color:"#d97706", bg:"#fef3c7", label:"Honoraire" },
  alerte:       { icon:"⚠️", color:"#dc2626", bg:"#fee2e2", label:"Alerte" },
  info:         { icon:"ℹ️", color:"#0891b2", bg:"#e0f2fe", label:"Info" },
  systeme:      { icon:"⚙️", color:"#64748b", bg:"#f1f5f9", label:"Système" },
};

const fmtDate = (ts) => {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)  return "À l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `il y a ${h}h`;
  const j = Math.floor(h / 24);
  if (j < 7)    return `il y a ${j}j`;
  return d.toLocaleDateString("fr-FR", { day:"numeric", month:"short" });
};

export default function NotificationsTab({ userId, accentColor = "#0891b2" }) {
  const { notifications, nbNonLues, marquerLue } = useNotifications(userId);
  const [filtre, setFiltre] = useState("toutes"); // toutes | non_lues | lues
  const [typeFiltre, setTypeFiltre] = useState("tous");

  const marquerToutesLues = () => {
    notifications.filter(n => !n.lu).forEach(n => marquerLue(n.id));
  };

  const filtrees = notifications.filter(n => {
    if (filtre === "non_lues" && n.lu)  return false;
    if (filtre === "lues"     && !n.lu) return false;
    if (typeFiltre !== "tous" && n.type !== typeFiltre) return false;
    return true;
  });

  const typesPresents = [...new Set(notifications.map(n => n.type).filter(Boolean))];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>
            🔔 Notifications
          </h2>
          <p style={{ margin:"3px 0 0", fontSize:13, color:"#9ca3af" }}>
            {nbNonLues > 0
              ? `${nbNonLues} non lue${nbNonLues > 1 ? "s" : ""} · ${notifications.length} au total`
              : `${notifications.length} notification${notifications.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {nbNonLues > 0 && (
          <button onClick={marquerToutesLues}
            style={{ padding:"8px 14px", background:"#f1f5f9", border:"none", borderRadius:8, fontSize:12, fontWeight:600, color:"#475569", cursor:"pointer" }}>
            ✓ Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filtres statut */}
      <div style={{ display:"flex", gap:6, marginBottom:14, background:"#f1f5f9", borderRadius:10, padding:4, width:"fit-content" }}>
        {[
          { key:"toutes",   label:`Toutes (${notifications.length})` },
          { key:"non_lues", label:`Non lues (${nbNonLues})` },
          { key:"lues",     label:`Lues (${notifications.length - nbNonLues})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltre(f.key)}
            style={{ padding:"6px 14px", borderRadius:8, border:"none", fontSize:12, fontWeight:600, cursor:"pointer",
              background: filtre === f.key ? "#fff" : "transparent",
              color:      filtre === f.key ? accentColor : "#64748b",
              boxShadow:  filtre === f.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition:"all .15s" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtre par type */}
      {typesPresents.length > 1 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:18 }}>
          <button onClick={() => setTypeFiltre("tous")}
            style={{ padding:"4px 12px", borderRadius:20, border:`1.5px solid ${typeFiltre==="tous"?accentColor:"#e5e7eb"}`,
              background: typeFiltre==="tous" ? accentColor : "#fff", color: typeFiltre==="tous" ? "#fff" : "#374151",
              fontSize:11, fontWeight:600, cursor:"pointer" }}>
            Tous types
          </button>
          {typesPresents.map(t => {
            const cfg = TYPES_CONFIG[t] || TYPES_CONFIG.info;
            return (
              <button key={t} onClick={() => setTypeFiltre(t)}
                style={{ padding:"4px 12px", borderRadius:20, border:`1.5px solid ${typeFiltre===t ? cfg.color : "#e5e7eb"}`,
                  background: typeFiltre===t ? cfg.color : "#fff",
                  color: typeFiltre===t ? "#fff" : "#374151",
                  fontSize:11, fontWeight:600, cursor:"pointer" }}>
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Liste */}
      {filtrees.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", background:"#f8fafc", borderRadius:16, border:"1px solid #e5e7eb" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔕</div>
          <div style={{ fontWeight:700, fontSize:15, color:"#0f172a", marginBottom:6 }}>
            {filtre === "non_lues" ? "Aucune notification non lue" : "Aucune notification"}
          </div>
          <p style={{ color:"#9ca3af", fontSize:13, margin:0 }}>
            Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtrees.map(notif => {
            const cfg = TYPES_CONFIG[notif.type] || TYPES_CONFIG.info;
            return (
              <div key={notif.id}
                onClick={() => { if (!notif.lu) marquerLue(notif.id); }}
                style={{ display:"flex", gap:14, padding:"14px 16px", borderRadius:12,
                  background: notif.lu ? "#fff" : `${accentColor}06`,
                  border: `1.5px solid ${notif.lu ? "#e5e7eb" : accentColor+"30"}`,
                  cursor: notif.lu ? "default" : "pointer",
                  transition:"all .15s", position:"relative" }}>

                {/* Pastille non lue */}
                {!notif.lu && (
                  <div style={{ position:"absolute", top:14, right:14, width:8, height:8,
                    borderRadius:"50%", background:accentColor }} />
                )}

                {/* Icône type */}
                <div style={{ width:42, height:42, borderRadius:12, background:cfg.bg,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:20, flexShrink:0 }}>
                  {cfg.icon}
                </div>

                {/* Contenu */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:3 }}>
                    <div style={{ fontWeight: notif.lu ? 500 : 700, fontSize:14, color:"#0f172a", lineHeight:1.3 }}>
                      {notif.titre || notif.title || "Notification"}
                    </div>
                    <span style={{ fontSize:11, color:"#9ca3af", whiteSpace:"nowrap", flexShrink:0 }}>
                      {fmtDate(notif.createdAt)}
                    </span>
                  </div>
                  <p style={{ margin:0, fontSize:13, color: notif.lu ? "#6b7280" : "#374151", lineHeight:1.5 }}>
                    {notif.message || notif.body || ""}
                  </p>
                  <div style={{ display:"flex", gap:8, marginTop:6, alignItems:"center" }}>
                    <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600,
                      background:cfg.bg, color:cfg.color }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {!notif.lu && (
                      <span style={{ fontSize:11, color:accentColor, fontWeight:600 }}>● Non lue</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer info */}
      {notifications.length > 0 && (
        <p style={{ textAlign:"center", fontSize:11, color:"#cbd5e1", marginTop:20 }}>
          Les notifications sont conservées 30 jours · Cliquer sur une notification pour la marquer comme lue
        </p>
      )}
    </div>
  );
}
