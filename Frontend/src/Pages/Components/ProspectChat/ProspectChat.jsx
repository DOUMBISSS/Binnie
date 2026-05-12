import React, { useState, useEffect, useRef } from "react";
import { useProspectChat } from "../../../hooks/useProspectChat";

const FF = "'Montserrat','Segoe UI',sans-serif";
const BET_BLUE = "#0891b2";
const BET_NAVY = "#1e3a8a";

function Avatar({ name, photo, size = 36 }) {
  const ini = name
    ? name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  if (photo) return (
    <img src={photo} alt="" style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
  );
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${BET_NAVY},${BET_BLUE})`, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:size*.28, flexShrink:0, fontFamily:FF }}>
      {ini}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width:18, height:18, border:"2.5px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"pcSpin .7s linear infinite", flexShrink:0 }} />
  );
}

/**
 * Chat embarqué prospect ↔ assistante BET
 * Continuité : utilise le Supabase UUID → persiste quand le prospect devient apprenant.
 */
export default function ProspectChat({ sbUser, assignation }) {
  const {
    myId, assistanteName,
    messages, unread, loading, initialized, error,
    initConv, sendMessage, fmtTime,
  } = useProspectChat(sbUser, assignation);

  const [text,    setText]   = useState("");
  const [opened,  setOpened] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Injecter keyframes une seule fois
  useEffect(() => {
    if (document.querySelector("#pc-kf")) return;
    const s = document.createElement("style"); s.id = "pc-kf";
    s.textContent = `@keyframes pcSpin { to{transform:rotate(360deg)} } @keyframes pcFU { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`;
    document.head.appendChild(s);
  }, []);

  // Initialiser la conversation Firestore à l'ouverture
  const handleOpen = async () => {
    setOpened(true);
    if (!initialized) await initConv();
  };

  // Scroll auto vers le bas
  useEffect(() => {
    if (opened) bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, opened]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await sendMessage(text);
    setText("");
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!assignation?.assistante_id) return null;

  const photoUrl = assignation.assistante_photo || null;
  const prenom   = assignation.assistante_prenom || assistanteName;

  // ── Chat fermé ─────────────────────────────────────────────────
  if (!opened) {
    return (
      <div
        onClick={handleOpen}
        style={{ display:"flex", alignItems:"center", gap:12, background:`linear-gradient(135deg,${BET_NAVY},${BET_BLUE})`, borderRadius:14, padding:"14px 18px", cursor:"pointer", userSelect:"none", marginTop:16, animation:"pcFU .3s ease" }}
      >
        <Avatar name={assistanteName} photo={photoUrl} size={44} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, color:"#fff", fontSize:".92rem", fontFamily:FF }}>
            💬 Discuter avec {prenom}
          </div>
          <div style={{ color:"rgba(255,255,255,.65)", fontSize:".74rem", marginTop:2 }}>
            Messagerie privée · Réponse sous quelques heures
          </div>
        </div>
        {unread > 0 && (
          <div style={{ background:"#ef4444", color:"#fff", borderRadius:"50%", minWidth:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".7rem", padding:"0 5px", flexShrink:0 }}>
            {unread}
          </div>
        )}
        <span style={{ color:"rgba(255,255,255,.6)", fontSize:"1.2rem" }}>›</span>
      </div>
    );
  }

  // ── Chat ouvert ────────────────────────────────────────────────
  return (
    <div style={{ border:`1.5px solid #e2e8f0`, borderRadius:16, overflow:"hidden", marginTop:16, background:"#fff", animation:"pcFU .2s ease" }}>

      {/* Header */}
      <div
        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:`linear-gradient(135deg,${BET_NAVY},${BET_BLUE})`, cursor:"pointer" }}
        onClick={() => setOpened(false)}
      >
        <Avatar name={assistanteName} photo={photoUrl} size={36} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, color:"#fff", fontSize:".88rem", fontFamily:FF }}>{assistanteName}</div>
          <div style={{ color:"rgba(255,255,255,.6)", fontSize:".7rem" }}>
            Assistante BET Languages · Messagerie privée
          </div>
        </div>
        <button style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:999, width:28, height:28, color:"#fff", cursor:"pointer", fontSize:".85rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          ✕
        </button>
      </div>

      {/* Bannière erreur / offline */}
      {error && (
        <div style={{ background:"#fef9ec", borderBottom:"1px solid #fde68a", padding:"8px 14px", fontSize:".74rem", color:"#92400e", display:"flex", alignItems:"center", gap:8 }}>
          <span>⏳</span>
          <span>{error}</span>
        </div>
      )}

      {/* Zone messages */}
      <div style={{ height:300, overflowY:"auto", padding:"14px 12px", display:"flex", flexDirection:"column", gap:8, background:"#f8fafc" }}>

        {/* Chargement initial */}
        {(loading || !initialized) && (
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, padding:24, color:"#94a3b8", fontSize:".82rem" }}>
            <div style={{ width:20, height:20, border:"2.5px solid #e2e8f0", borderTopColor:BET_BLUE, borderRadius:"50%", animation:"pcSpin .8s linear infinite" }} />
            Connexion en cours…
          </div>
        )}

        {/* Aucun message */}
        {initialized && !loading && messages.length === 0 && (
          <div style={{ textAlign:"center", padding:"28px 16px", animation:"pcFU .3s ease" }}>
            <div style={{ fontSize:"2rem", marginBottom:8 }}>👋</div>
            <p style={{ color:"#64748b", fontSize:".84rem", lineHeight:1.6, margin:0, fontFamily:FF }}>
              Bonjour ! Démarrez votre conversation avec <strong>{prenom}</strong>.<br />
              Elle vous répondra dès que possible.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const isMe = msg.from_id === myId;
          return (
            <div key={msg.id} style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start", gap:8, alignItems:"flex-end", animation:"pcFU .2s ease" }}>
              {!isMe && <Avatar name={assistanteName} photo={photoUrl} size={26} />}
              <div style={{ maxWidth:"75%" }}>
                <div style={{
                  background:    isMe ? `linear-gradient(135deg,${BET_BLUE},${BET_NAVY})` : "#fff",
                  color:         isMe ? "#fff" : "#0f172a",
                  borderRadius:  isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  padding:       "9px 13px",
                  fontSize:      ".85rem",
                  lineHeight:    1.55,
                  boxShadow:     isMe ? "none" : "0 2px 8px rgba(0,0,0,.06)",
                  border:        isMe ? "none" : "1px solid #e2e8f0",
                  whiteSpace:    "pre-wrap",
                  wordBreak:     "break-word",
                  fontFamily:    FF,
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize:".64rem", color:"#94a3b8", marginTop:3, textAlign: isMe ? "right" : "left", paddingLeft: isMe ? 0 : 4 }}>
                  {fmtTime(msg.created_at)}
                  {isMe && " · Envoyé"}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:"10px 12px", borderTop:"1px solid #e2e8f0", display:"flex", gap:8, alignItems:"flex-end", background:"#fff" }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Message à ${prenom}…`}
          rows={1}
          style={{ flex:1, resize:"none", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"9px 12px", fontSize:".85rem", fontFamily:FF, outline:"none", lineHeight:1.5, maxHeight:100, overflowY:"auto", transition:"border-color .2s" }}
          onFocus={e => e.target.style.borderColor = BET_BLUE}
          onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
          onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{ background: (text.trim() && !sending) ? `linear-gradient(135deg,${BET_BLUE},${BET_NAVY})` : "#e2e8f0", color: (text.trim() && !sending) ? "#fff" : "#94a3b8", border:"none", borderRadius:10, width:40, height:40, cursor: (text.trim() && !sending) ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .18s" }}
        >
          {sending ? <Spinner /> : <span style={{ fontSize:"1rem" }}>➤</span>}
        </button>
      </div>

      {/* Note bas de chat */}
      <div style={{ padding:"6px 14px 8px", background:"#f8fafc", borderTop:"1px solid #f1f5f9" }}>
        <p style={{ margin:0, fontSize:".68rem", color:"#94a3b8", textAlign:"center" }}>
          🔒 Messagerie privée BET · Votre historique est conservé même si vous devenez apprenant
        </p>
      </div>
    </div>
  );
}
