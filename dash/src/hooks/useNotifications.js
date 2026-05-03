import { useState, useEffect } from 'react';
import {
  collection, query, orderBy,
  onSnapshot, updateDoc, doc, limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [nbNonLues, setNbNonLues] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications', userId, 'items'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(data);
      setNbNonLues(data.filter(n => !n.lu).length);
    });

    return unsub;
  }, [userId]);

  const marquerLue = (id) =>
    updateDoc(doc(db, 'notifications', userId, 'items', id), { lu: true });

  return { notifications, nbNonLues, marquerLue };
}