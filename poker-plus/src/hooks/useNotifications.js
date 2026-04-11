import { useState, useEffect, useCallback } from 'react';
import { MOCK_MODE, supabase, SUPABASE_CONFIGURED, withTimeout } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ── Mock 通知数据 ──────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: 'n1', type: 'like_post', is_read: false,
    created_at: new Date(Date.now() - 3e5).toISOString(),
    actor: { nickname: 'Bluff_4421', avatar_url: null },
    target: { id: '1', title: 'AKo 在 BTN 面对 CO 开池，3bet 还是跟注？' },
    message: '赞了你的帖子',
  },
  {
    id: 'n2', type: 'comment', is_read: false,
    created_at: new Date(Date.now() - 9e5).toISOString(),
    actor: { nickname: 'Equity_9183', avatar_url: null },
    target: { id: '1', title: 'AKo 在 BTN 面对 CO 开池，3bet 还是跟注？' },
    message: '评论了你的帖子："3bet 更好，AKo 的 equity 很强…"',
  },
  {
    id: 'n3', type: 'reply', is_read: false,
    created_at: new Date(Date.now() - 1.8e6).toISOString(),
    actor: { nickname: 'GTO_Player', avatar_url: null },
    target: { id: '1', title: 'AKo 在 BTN 面对 CO 开池，3bet 还是跟注？' },
    message: '回复了你的评论："同意，BTN 位置优势支持 3bet"',
  },
  {
    id: 'n4', type: 'like_post', is_read: true,
    created_at: new Date(Date.now() - 7.2e6).toISOString(),
    actor: { nickname: 'Button_4416', avatar_url: null },
    target: { id: '2', title: '一手经典慢玩翻船的复盘' },
    message: '赞了你的帖子',
  },
  {
    id: 'n5', type: 'comment', is_read: true,
    created_at: new Date(Date.now() - 1.44e7).toISOString(),
    actor: { nickname: 'River_2847', avatar_url: null },
    target: { id: '2', title: '一手经典慢玩翻船的复盘' },
    message: '评论了你的帖子："慢玩葫芦太危险了，应该翻牌就 donk bet"',
  },
];

/**
 * 通知列表
 */
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [error, setError]                 = useState(null); // 新增：错误状态

  const load = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 300));
      setNotifications(MOCK_NOTIFICATIONS);
      setUnreadCount(MOCK_NOTIFICATIONS.filter(n => !n.is_read).length);
      setLoading(false);
      return;
    }

    // 检查 Supabase 是否已配置
    if (!SUPABASE_CONFIGURED) {
      setError('数据库未配置');
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error: queryError } = await withTimeout(
        supabase
          .from('notifications')
          .select('*, actor:profiles!actor_id(nickname, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(50)
      );

      if (queryError) {
        console.warn('[useNotifications] load error:', queryError.message);
        setError(queryError.message);
        setNotifications([]);
        setUnreadCount(0);
      } else {
        const list = data || [];
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('[useNotifications] unexpected error:', err);
      setError(err.message || '网络错误，请重试');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Real-time: listen for new notifications
  useEffect(() => {
    if (MOCK_MODE || !user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const markAllRead = async () => {
    if (MOCK_MODE) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      return;
    }
    
    // Optimistic update - 先更新 UI，失败时回滚
    const prevNotifications = notifications;
    const prevUnreadCount = unreadCount;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    
    try {
      const { error } = await withTimeout(
        supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
      );
      if (error) {
        console.warn('[useNotifications] markAllRead error:', error.message);
        setNotifications(prevNotifications);
        setUnreadCount(prevUnreadCount);
      }
    } catch (err) {
      console.warn('[useNotifications] markAllRead timeout:', err.message);
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
    }
  };

  return { notifications, loading, unreadCount, markAllRead, refresh: load, error };
}
