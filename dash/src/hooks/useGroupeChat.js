import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, limit
} from "firebase/firestore";
import { db } from "../config/firebase";

export function useGroupeChat(groupeId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!groupeId) return;
    const q = query(
      collection(db, "groupes", groupeId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [groupeId]);

  const sendMessage = (auteur_id, auteur_nom, texte, fichier = null) =>
    addDoc(collection(db, "groupes", groupeId, "messages"), {
      auteur_id, auteur_nom, texte: texte || "",
      fichier: fichier || null,
      type: fichier ? "fichier" : "texte",
      createdAt: serverTimestamp(),
    });

  return { messages, sendMessage };
}
