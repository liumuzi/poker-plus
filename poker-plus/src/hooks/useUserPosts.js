import { useState, useEffect, useCallback } from 'react';
import { MOCK_MODE, supabase } from '../lib/supabase';
import { MOCK_POSTS } from './usePosts';

// Mock profiles keyed by user_id
const MOCK_PROFILES = {
  u1: { id: 'u1', nickname: 'River_2847',   avatar_url: null, bio: '专注翻前策略研究', post_count: 12 },
  u2: { id: 'u2', nickname: 'Bluff_4421',   avatar_url: null, bio: '喜欢慢玩，经常翻船', post_count: 7 },
  u3: { id: 'u3', nickname: 'Equity_9183',  avatar_url: null, bio: '数学控，GTO 爱好者', post_count: 21 },
  u4: { id: 'u4', nickname: 'GTO_Player',   avatar_url: null, bio: '河牌决策专家', post_count: 9 },
  u5: { id: 'u5', nickname: 'Button_4416',  avatar_url: null, bio: '教学向内容创作者', post_count: 34 },
};

/**
 * 获取指定用户的 profile 和帖子列表
 * @param {string} userId
 */
export function useUserPosts(userId) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 300));
      setProfile(MOCK_PROFILES[userId] || {
        id: userId, nickname: `User_${userId.slice(-4)}`, avatar_url: null, bio: '', post_count: 0,
      });
      setPosts(MOCK_POSTS.filter(p => p.user_id === userId));
      setLoading(false);
      return;
    }

    const [profileRes, postsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('posts')
        .select('*, profile:profiles(nickname, avatar_url)')
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    setProfile(profileRes.data || null);
    setPosts(postsRes.data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { profile, posts, loading };
}
