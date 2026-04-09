import { useState, useEffect } from 'react';
import { MOCK_MODE, supabase } from '../lib/supabase';
import { MOCK_POSTS } from './usePosts';

const MOCK_COMMENTS = {
  '1': [
    {
      id: 'c1', post_id: '1', user_id: 'u2', parent_id: null, reply_to_id: null,
      content: '3bet 更好，AKo 的 equity 很强，平衡翻前 range 应该保持高 3bet 频率。',
      like_count: 8, created_at: new Date(Date.now() - 900000).toISOString(),
      profile: { nickname: 'Bluff_4421', avatar_url: null },
      replies: [
        {
          id: 'c1r1', post_id: '1', user_id: 'u3', parent_id: 'c1', reply_to_id: 'c1',
          content: '@Bluff_4421 同意，而且 BTN 的位置优势也支持 3bet。',
          like_count: 3, created_at: new Date(Date.now() - 600000).toISOString(),
          profile: { nickname: 'Equity_9183', avatar_url: null },
        },
      ],
    },
    {
      id: 'c2', post_id: '1', user_id: 'u4', parent_id: null, reply_to_id: null,
      content: '跟注也有道理，保留 CO 的线注让 range 更平衡，关键看 CO 开池频率。',
      like_count: 5, created_at: new Date(Date.now() - 720000).toISOString(),
      profile: { nickname: 'GTO_Player', avatar_url: null },
      replies: [],
    },
  ],
};

/**
 * 单帖详情 + 评论树
 */
export function usePost(postId) {
  const [post, setPost]         = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!postId) return;

    const fetch = async () => {
      setLoading(true);

      if (MOCK_MODE) {
        await new Promise(r => setTimeout(r, 300));
        setPost(MOCK_POSTS.find(p => p.id === postId) || null);
        setComments(MOCK_COMMENTS[postId] || []);
        setLoading(false);
        return;
      }

      // TODO: 真实查询
      const [{ data: postData }, { data: commentData }] = await Promise.all([
        supabase.from('posts')
          .select('*, profile:profiles(nickname, avatar_url)')
          .eq('id', postId).single(),
        supabase.from('comments')
          .select('*, profile:profiles(nickname, avatar_url)')
          .eq('post_id', postId).is('parent_id', null)
          .order('created_at', { ascending: true }),
      ]);

      setPost(postData);
      // 构建评论树（附加 replies）
      if (commentData) {
        const { data: replyData } = await supabase.from('comments')
          .select('*, profile:profiles(nickname, avatar_url)')
          .eq('post_id', postId).not('parent_id', 'is', null);
        const replyMap = {};
        (replyData || []).forEach(r => {
          if (!replyMap[r.parent_id]) replyMap[r.parent_id] = [];
          replyMap[r.parent_id].push(r);
        });
        setComments(commentData.map(c => ({ ...c, replies: replyMap[c.id] || [] })));
      }
      setLoading(false);
    };

    fetch();
  }, [postId]);

  const addComment = async (content, parentId = null, replyToId = null, userId) => {
    if (MOCK_MODE) {
      const newComment = {
        id: `c-${Date.now()}`, post_id: postId, user_id: userId,
        parent_id: parentId, reply_to_id: replyToId,
        content, like_count: 0,
        created_at: new Date().toISOString(),
        profile: { nickname: '我', avatar_url: null },
        replies: [],
      };
      if (!parentId) {
        setComments(prev => [...prev, newComment]);
      } else {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: [...c.replies, newComment] } : c
        ));
      }
      setPost(prev => prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : prev);
      return { error: null };
    }

    const { error } = await supabase.from('comments').insert({
      post_id: postId, user_id: userId,
      parent_id: parentId, reply_to_id: replyToId, content,
    });
    if (!error) {
      setPost(prev => prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : prev);
      // 重新拉取评论树
      const { data: commentData } = await supabase.from('comments')
        .select('*, profile:profiles(nickname, avatar_url)')
        .eq('post_id', postId).is('parent_id', null)
        .order('created_at', { ascending: true });
      if (commentData) {
        const { data: replyData } = await supabase.from('comments')
          .select('*, profile:profiles(nickname, avatar_url)')
          .eq('post_id', postId).not('parent_id', 'is', null);
        const replyMap = {};
        (replyData || []).forEach(r => {
          if (!replyMap[r.parent_id]) replyMap[r.parent_id] = [];
          replyMap[r.parent_id].push(r);
        });
        setComments(commentData.map(c => ({ ...c, replies: replyMap[c.id] || [] })));
      }
    }
    return { error };
  };

  return { post, comments, loading, addComment };
}
