import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [nbNonLues, setNbNonLues]         = useState(0);
  const mountCount = useRef(0);

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

    // Nom unique à chaque montage pour éviter la réutilisation du channel par Supabase
    mountCount.current += 1;
    const channelName = `notifs_${userId}_${mountCount.current}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchNotifs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifs]);

  const marquerLue = async (id) => {
    await supabase.from('notifications').update({ lu: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    setNbNonLues(prev => Math.max(0, prev - 1));
  };

  return { notifications, nbNonLues, marquerLue };
}
