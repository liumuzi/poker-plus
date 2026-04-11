import { useState } from 'react';
import { MOCK_MODE, supabase, withTimeout } from '../lib/supabase';

/**
 * 点赞状态管理（Optimistic Update）
 * @param {string} targetType 'post' | 'comment'
 * @param {string} targetId
 * @param {number} initialCount
 * @param {boolean} initialLiked
 */
export function useLike(targetType, targetId, initialCount = 0, initialLiked = false) {
  const [liked, setLiked]   = useState(initialLiked);
  const [count, setCount]   = useState(initialCount);
  const [pending, setPending] = useState(false);

  const toggle = async (userId) => {
    if (!userId || pending) return;
    setPending(true);

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setCount(n => newLiked ? n + 1 : Math.max(n - 1, 0));

    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 200));
      setPending(false);
      return;
    }

    try {
      if (newLiked) {
        const { error } = await withTimeout(supabase.from('likes').insert({ user_id: userId, target_type: targetType, target_id: targetId }));
        if (error) throw error;
      } else {
        const { error } = await withTimeout(supabase.from('likes').delete()
          .match({ user_id: userId, target_type: targetType, target_id: targetId }));
        if (error) throw error;
      }
    } catch (err) {
      // Rollback on error
      console.warn('[useLike] toggle error:', err.message || err);
      setLiked(!newLiked);
      setCount(n => newLiked ? Math.max(n - 1, 0) : n + 1);
    } finally {
      setPending(false);
    }
  };

  return { liked, count, toggle, pending };
}
