import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_MODE, supabase } from '../../lib/supabase';
import PostCard from '../../components/community/PostCard';

export default function MyLikesPage({ onBack, onNavigate }) {
  const { user } = useAuth();
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (MOCK_MODE) { setLoading(false); return; }

    (async () => {
      const { data: likes } = await supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'post')
        .order('created_at', { ascending: false });

      if (!likes || likes.length === 0) { setLoading(false); return; }

      const ids = likes.map(l => l.target_id);
      const { data } = await supabase
        .from('posts')
        .select('*, profile:profiles(nickname, avatar_url)')
        .in('id', ids)
        .eq('is_hidden', false);

      // 保持点赞时间顺序
      const ordered = ids.map(id => data?.find(p => p.id === id)).filter(Boolean);
      setPosts(ordered);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-24">
      <div className="flex items-center gap-3 px-3 pt-12 pb-4">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform">
          <ArrowLeft size={20} color="#9CA3AF" />
        </button>
        <h1 className="text-white text-lg font-bold">我的点赞</h1>
      </div>

      <main className="flex flex-col gap-3 px-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="text-gray-600 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <Heart size={40} color="#374151" />
            <p className="text-gray-600 text-sm">还没有点赞过任何帖子</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => onNavigate({ screen: 'post', params: { postId: post.id } })}
              onAvatarClick={() => onNavigate({ screen: 'userProfile', params: { userId: post.user_id } })}
            />
          ))
        )}
      </main>
    </div>
  );
}
