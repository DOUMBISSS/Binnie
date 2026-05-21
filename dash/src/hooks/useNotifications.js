import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [nbNonLues, setNbNonLues]         = useState(0);

  const fetchNotifs = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      const mapped = data.map(n => ({ ...n, createdAt: n.created_at }));
      setNotifications(mapped);
      setNbNonLues(mapped.filter(n => !n.lu).length);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchNotifs();

    // Écoute en temps réel les nouvelles notifications de ce coach
    const channel = supabase
      .channel(`notifs_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchNotifs()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchNotifs]);

  const marquerLue = async (id) => {
    await supabase.from('notifications').update({ lu: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    setNbNonLues(prev => Math.max(0, prev - 1));
  };

  return { notifications, nbNonLues, marquerLue };
}
