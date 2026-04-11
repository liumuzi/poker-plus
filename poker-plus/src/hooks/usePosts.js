import { useState, useEffect, useCallback } from 'react';
import { MOCK_MODE, supabase } from '../lib/supabase';
import { MOCK_POSTS } from '../data/mockPosts';

const PAGE_SIZE = 20;

/**
 * Feed 数据获取，支持 type 过滤 + cursor-based 无限滚动
 */
export function usePosts(typeFilter = 'all') {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor]   = useState(null); // last post created_at
  const [error, setError]     = useState(null); // 新增：错误状态

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCursor(null);

    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 400));
      const filtered = typeFilter === 'all'
        ? MOCK_POSTS
        : MOCK_POSTS.filter(p => p.type === typeFilter);
      setPosts(filtered);
      setHasMore(false);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('posts')
        .select('*, profile:profiles(nickname, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (typeFilter !== 'all') query = query.eq('type', typeFilter);

      const { data, error: queryError } = await query;
      if (queryError) {
        console.warn('[usePosts] load error:', queryError.message);
        setError(queryError.message);
        setPosts([]);
      } else {
        const list = data || [];
        setPosts(list);
        setHasMore(list.length === PAGE_SIZE);
        if (list.length > 0) setCursor(list[list.length - 1].created_at);
      }
    } catch (err) {
      console.error('[usePosts] unexpected error:', err);
      setError('网络错误，请重试');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor || MOCK_MODE) return;
    setLoadingMore(true);

    try {
      let query = supabase
        .from('posts')
        .select('*, profile:profiles(nickname, avatar_url)')
        .lt('created_at', cursor)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (typeFilter !== 'all') query = query.eq('type', typeFilter);

      const { data, error: queryError } = await query;
      if (queryError) {
        console.warn('[usePosts] loadMore error:', queryError.message);
        // loadMore 失败不清空已有帖子
      } else {
        const list = data || [];
        setPosts(prev => [...prev, ...list]);
        setHasMore(list.length === PAGE_SIZE);
        if (list.length > 0) setCursor(list[list.length - 1].created_at);
      }
    } catch (err) {
      console.error('[usePosts] loadMore unexpected error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, cursor, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return { posts, loading, loadingMore, hasMore, loadMore, refresh: load, error };
}

export { MOCK_POSTS };
