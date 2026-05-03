// src/components/CloudinaryUpload.jsx
// Composant réutilisable pour uploader vers Cloudinary via le backend BET
// Usage :
//   <CloudinaryUpload type="avatar" onSuccess={(file) => setAvatar(file.url)} />
//   <CloudinaryUpload type="video"  label="Ajouter une vidéo de cours" onSuccess={...} />
//
// types disponibles : "avatar" | "image" | "video" | "audio" | "document"

import React, { useRef, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const TYPE_CONFIG = {
  avatar:   { accept: "image/*",                          label: "Photo de profil", icon: "🖼️",  maxMb: 5,   hint: "JPG, PNG, WEBP — max 5 Mo" },
  image:    { accept: "image/*",                          label: "Image",           icon: "🖼️",  maxMb: 10,  hint: "JPG, PNG, WEBP, GIF — max 10 Mo" },
  video:    { accept: "video/*",                          label: "Vidéo",           icon: "🎬",  maxMb: 200, hint: "MP4, MOV, MKV, WEBM — max 200 Mo" },
  audio:    { accept: "audio/*",                          label: "Audio",           icon: "🎵",  maxMb: 50,  hint: "MP3, WAV, OGG, M4A — max 50 Mo" },
  document: { accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx", label: "Document", icon: "📄",  maxMb: 20,  hint: "PDF, Word, PowerPoint, Excel — max 20 Mo" },
};

export default function CloudinaryUpload({
  type       = "image",
  label,
  onSuccess,
  onError,
  currentUrl,      // URL actuelle (pour preview)
  className,
  style,
  compact = false, // Mode bouton compact (sans zone de drop)
  token,           // admin_token — si non fourni, lu depuis localStorage
}) {
  const cfg       = TYPE_CONFIG[type] || TYPE_CONFIG.image;
  const inputRef  = useRef(null);
  const [loading, setLoading]   = useState(false);
  const [preview, setPreview]   = useState(currentUrl || null);
  const [error,   setError]     = useState("");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const authToken = token || localStorage.getItem("admin_token") || localStorage.getItem("coach_token");

  const upload = async (file) => {
    if (!file) return;
    const maxBytes = cfg.maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      const msg = `Fichier trop lourd (max ${cfg.maxMb} Mo)`;
      setError(msg);
      onError?.(msg);
      return;
    }

    setError("");
    setLoading(true);
    setProgress(0);

    // Preview local immédiate pour les images/avatars
    if (type === "avatar" || type === "image") {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // XHR pour avoir la progression
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}/api/upload/${type}`);
        xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).error || `Erreur ${xhr.status}`)); }
            catch { reject(new Error(`Erreur ${xhr.status}`)); }
          }
        };
        xhr.onerror = () => reject(new Error("Erreur réseau"));
        xhr.send(formData);
      });

      setProgress(100);
      if (result.file?.url) setPreview(result.file.url);
      onSuccess?.(result.file);
    } catch (e) {
      setError(e.message);
      setPreview(currentUrl || null);
      onError?.(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  if (compact) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, ...style }} className={className}>
        <input ref={inputRef} type="file" accept={cfg.accept} onChange={onFileChange} style={{ display: "none" }} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Spinner /> : <span>{cfg.icon}</span>}
          {loading ? `${progress}%` : (label || `Uploader ${cfg.label.toLowerCase()}`)}
        </button>
        {error && <span style={{ fontSize: 12, color: "#dc2626" }}>⚠️ {error}</span>}
      </div>
    );
  }

  return (
    <div style={{ ...style }} className={className}>
      <input ref={inputRef} type="file" accept={cfg.accept} onChange={onFileChange} style={{ display: "none" }} />

      {/* Zone de drop */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? "#0891b2" : error ? "#dc2626" : "#e2e8f0"}`,
          borderRadius: 12,
          padding: 20,
          textAlign: "center",
          cursor: loading ? "not-allowed" : "pointer",
          background: dragging ? "#e0f2fe" : "#f8fafc",
          transition: "all .2s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Preview image/avatar */}
        {preview && (type === "avatar" || type === "image") && (
          <img src={preview} alt="preview"
            style={{ width: type === "avatar" ? 80 : "100%", height: type === "avatar" ? 80 : 140,
              objectFit: "cover", borderRadius: type === "avatar" ? "50%" : 8, marginBottom: 10 }} />
        )}

        {/* Icône + texte */}
        {!loading && (
          <>
            <div style={{ fontSize: preview ? 20 : 32, marginBottom: 6 }}>{cfg.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
              {label || `Uploader ${cfg.label.toLowerCase()}`}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{cfg.hint}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Glissez-déposez ou cliquez</div>
          </>
        )}

        {/* Progression */}
        {loading && (
          <div style={{ padding: "10px 0" }}>
            <Spinner size={28} />
            <div style={{ marginTop: 8, fontSize: 13, color: "#0891b2", fontWeight: 600 }}>Upload {progress}%</div>
            <div style={{ marginTop: 6, height: 4, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#0891b2", borderRadius: 4, transition: "width .3s" }} />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 6, padding: "6px 10px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, fontSize: 12, color: "#dc2626" }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

// ── Composant avatar cliquable (photo de profil ronde) ────────────────────────
export function AvatarUpload({ currentUrl, nom = "", onSuccess, size = 80, token }) {
  const initiales = nom.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";
  const [url, setUrl] = useState(currentUrl);

  return (
    <CloudinaryUpload
      type="avatar"
      token={token}
      currentUrl={url}
      compact={false}
      style={{ width: size + 40 }}
      onSuccess={(file) => { setUrl(file.url); onSuccess?.(file); }}
    />
  );
}

function Spinner({ size = 18 }) {
  return (
    <div style={{
      width: size, height: size,
      border: "2.5px solid rgba(8,145,178,0.2)",
      borderTopColor: "#0891b2",
      borderRadius: "50%",
      animation: "betSpin .7s linear infinite",
      display: "inline-block",
    }} />
  );
}

// Injection du keyframe global (une seule fois)
if (typeof document !== "undefined" && !document.getElementById("bet-spinner-style")) {
  const s = document.createElement("style");
  s.id = "bet-spinner-style";
  s.textContent = "@keyframes betSpin { to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}
