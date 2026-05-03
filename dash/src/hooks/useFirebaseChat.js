import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection, doc, query, where, orderBy,
  onSnapshot, addDoc, setDoc, updateDoc,
  serverTimestamp, getDocs, Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const API_URL  = process.env.REACT_APP_API_URL || "http://localhost:5001";
const authHdrs = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
});

// ── Identifiant de conversation déterministe (stable entre les deux users) ──
const convId = (id1, id2) => [id1, id2].sort().join("_");

export function useFirebaseChat() {
  const profil     = JSON.parse(localStorage.getItem("admin_profil") || "{}");
  const myId       = profil?.id   || "";
  const myName     = [profil?.prenom, profil?.nom].filter(Boolean).join(" ") || profil?.email || "";
  const myRole     = profil?.role || "";

  const [conversations, setConversations]   = useState([]);
  const [messages,      setMessages]        = useState([]);
  const [activeConvId,  setActiveConvId]    = useState(null);
  const [contacts,      setContacts]        = useState([]);
  const [onlineUsers,   setOnlineUsers]     = useState({});
  const [loadingConvs,  setLoadingConvs]    = useState(true);

  const msgUnsubRef = useRef(null);

  // ── 1. Écoute en temps réel de mes conversations ──────────────────────────
  useEffect(() => {
    if (!myId) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", myId),
      orderBy("last_message_at", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const convs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setConversations(convs);
      setLoadingConvs(false);
    }, (err) => {
      // Index manquant : afficher l'URL de création dans la console
      if (err.code === "failed-precondition") {
        console.warn("⚠️ Firestore : index composite requis →", err.message);
      }
      setLoadingConvs(false);
    });

    return () => unsub();
  }, [myId]);

  // ── 2. Écoute en temps réel des messages de la conversation active ────────
  useEffect(() => {
    if (msgUnsubRef.current) { msgUnsubRef.current(); msgUnsubRef.current = null; }
    if (!activeConvId) { setMessages([]); return; }

    const q = query(
      collection(db, "chats", activeConvId, "messages"),
      orderBy("created_at", "asc")
    );

    msgUnsubRef.current = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      // Marquer lu automatiquement
      markAsRead(activeConvId);
    });

    return () => { if (msgUnsubRef.current) msgUnsubRef.current(); };
  }, [activeConvId]); // eslint-disable-line

  // ── 3. Écoute de la présence (en ligne / hors ligne) ─────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "presence"), (snap) => {
      const status = {};
      snap.docs.forEach((d) => { status[d.id] = d.data(); });
      setOnlineUsers(status);
    });
    return () => unsub();
  }, []);

  // ── 4. Publier ma propre présence ─────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;

    const ref = doc(db, "presence", myId);
    setDoc(ref, { userId: myId, nom: myName, role: myRole, statut: "en_ligne", dernierVu: serverTimestamp() });

    const interval = setInterval(() => {
      setDoc(ref, { dernierVu: serverTimestamp() }, { merge: true });
    }, 30000);

    const handleOffline = () =>
      setDoc(ref, { statut: "inactif", dernierVu: serverTimestamp() }, { merge: true });

    window.addEventListener("beforeunload", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleOffline);
      handleOffline();
    };
  }, [myId, myName, myRole]);

  // ── 5. Charger les contacts (autres utilisateurs) ─────────────────────────
  const fetchContacts = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/messages/contacts`, { headers: authHdrs() });
      if (!r.ok) return;
      const { contacts: list } = await r.json();
      setContacts(list || []);
    } catch {}
  }, []);

  // ── 6. Ouvrir ou créer une conversation ───────────────────────────────────
  const openOrCreateConv = useCallback(async (contact) => {
    if (!myId) return;

    const cid = convId(myId, contact.id);
    const ref  = doc(db, "chats", cid);

    // Vérifier si elle existe déjà
    const snap = await getDocs(
      query(collection(db, "chats"), where("participants", "array-contains", myId))
    );
    const exists = snap.docs.some((d) => d.id === cid);

    if (!exists) {
      const contactName = [contact.prenom, contact.nom].filter(Boolean).join(" ") || contact.email;
      await setDoc(ref, {
        participants:    [myId, contact.id],
        user1_id:        myId,
        user1_name:      myName,
        user1_role:      myRole,
        user2_id:        contact.id,
        user2_name:      contactName,
        user2_role:      contact.role,
        last_message:    "",
        last_message_at: serverTimestamp(),
        created_at:      serverTimestamp(),
        unread:          { [myId]: 0, [contact.id]: 0 },
      });
    }

    setActiveConvId(cid);
  }, [myId, myName, myRole]);

  // ── 7. Envoyer un message (avec pièces jointes optionnelles) ────────────
  // attachments = [{ url, name, type, size }]
  const sendMessage = useCallback(async (content, attachments = []) => {
    const text = content?.trim() || "";
    if (!text && attachments.length === 0) return;
    if (!activeConvId || !myId) return;

    const convRef = doc(db, "chats", activeConvId);

    await addDoc(collection(db, "chats", activeConvId, "messages"), {
      from_id:     myId,
      from_name:   myName,
      from_role:   myRole,
      content:     text,
      attachments: attachments,
      created_at:  serverTimestamp(),
      read_by:     [myId],
    });

    const conv = conversations.find((c) => c.id === activeConvId);
    const otherId = conv?.participants?.find((p) => p !== myId);
    const unreadUpdate = otherId ? { [`unread.${otherId}`]: (conv?.unread?.[otherId] || 0) + 1 } : {};
    const preview = text || (attachments.length > 0 ? `📎 ${attachments[0].name}` : "");

    await updateDoc(convRef, {
      last_message:    preview.slice(0, 100),
      last_message_at: serverTimestamp(),
      ...unreadUpdate,
    });
  }, [activeConvId, myId, myName, myRole, conversations]);

  // ── 8. Marquer les messages comme lus ────────────────────────────────────
  const markAsRead = useCallback(async (cid) => {
    if (!cid || !myId) return;
    try {
      await updateDoc(doc(db, "chats", cid), { [`unread.${myId}`]: 0 });
    } catch {}
  }, [myId]);

  // ── Helpers UI ────────────────────────────────────────────────────────────
  const partnerName = (conv) =>
    conv?.user1_id === myId ? conv.user2_name : conv.user1_name;

  const partnerRole = (conv) =>
    conv?.user1_id === myId ? conv.user2_role : conv.user1_role;

  const partnerId = (conv) =>
    conv?.user1_id === myId ? conv.user2_id : conv.user1_id;

  const isOnline = (uid) => onlineUsers[uid]?.statut === "en_ligne";

  const unreadTotal = conversations.reduce((s, c) => s + (c.unread?.[myId] || 0), 0);

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  const fmtTime = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return {
    myId, myName, myRole,
    conversations, messages, activeConvId, activeConv,
    setActiveConvId,
    contacts, fetchContacts,
    loadingConvs, unreadTotal,
    openOrCreateConv, sendMessage, markAsRead,
    partnerName, partnerRole, partnerId, isOnline, fmtTime,
    onlineUsers,
  };
}
