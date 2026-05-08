import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationBell({ userId }) {
  const { notifications, nbNonLues, marquerLue } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Fermer le panneau si clic en dehors
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleClick = async (notif) => {
    if (!notif.lu) await marquerLue(notif.id);
    if (notif.link) navigate(notif.link);
    setOpen(false);
  };

  const handleMarquerToutesLues = () => {
    notifications.filter(n => !n.lu).forEach(n => marquerLue(n.id));
  };

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={panelRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "6px 8px",
          borderRadius: "8px",
          transition: "background 0.15s",
          display: "flex",
          alignItems: "center",
        }}
        title="Notifications"
      >
        <span style={{ fontSize: "22px", lineHeight: 1 }}>🔔</span>
        {nbNonLues > 0 && (
          <span style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            background: "#ef4444",
            color: "#fff",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 700,
            minWidth: "16px",
            height: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            lineHeight: 1,
          }}>
            {nbNonLues > 99 ? "99+" : nbNonLues}
          </span>
        )}
      </button>

      {/* Panneau déroulant */}
      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "calc(100% + 8px)",
          width: "360px",
          maxHeight: "480px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* En-tête */}
          <div style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>
              Notifications
            </span>
            {nbNonLues > 0 && (
              <button
                onClick={handleMarquerToutesLues}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#6366f1",
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "14px",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔕</div>
                Aucune notification
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f8fafc",
                    cursor: notif.link ? "pointer" : "default",
                    background: notif.lu ? "#fff" : "#f0f4ff",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = notif.lu ? "#f8fafc" : "#e8edff"}
                  onMouseLeave={e => e.currentTarget.style.background = notif.lu ? "#fff" : "#f0f4ff"}
                >
                  {/* Icône */}
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#ede9fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}>
                    {notif.icon || "🔔"}
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: notif.lu ? 500 : 700,
                      fontSize: "13px",
                      color: "#1e293b",
                      marginBottom: "2px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {notif.titre}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#64748b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {notif.corps}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                      {fmtDate(notif.createdAt)}
                    </div>
                  </div>

                  {/* Pastille non-lu */}
                  {!notif.lu && (
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#6366f1",
                      flexShrink: 0,
                      marginTop: "4px",
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
