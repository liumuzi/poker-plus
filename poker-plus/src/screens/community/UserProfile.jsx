import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useUserPosts } from '../../hooks/useUserPosts';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../../components/community/UserAvatar';
import PostCard from '../../components/community/PostCard';

export default function UserProfile({ userId, onBack, onNavigate }) {
  const { profile, posts, loading } = useUserPosts(userId);
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);

  const isOwnProfile = user?.id === userId;

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-12 pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} color="#9CA3AF" />
        </button>
        <h1 className="text-white text-lg font-bold">用户主页</h1>
        <div className="w-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Profile card */}
          <div className="flex flex-col items-center px-6 pb-6">
            <UserAvatar nickname={profile?.nickname} avatarUrl={profile?.avatar_url} size={72} />
            <p className="text-white font-bold text-lg mt-3">{profile?.nickname || '—'}</p>
            <p className="text-gray-400 text-sm text-center mt-1">
              {profile?.bio || '这个人很懒，什么都没写～'}
            </p>

            {/* Stats */}
            <div className="flex gap-10 mt-5">
              <div className="flex flex-col items-center">
                <span className="text-white font-bold text-lg">{profile?.post_count ?? posts.length}</span>
                <span className="text-gray-500 text-xs">帖子</span>
              </div>
            </div>

            {/* Follow button (only for other users) */}
            {!isOwnProfile && (
              <button
                onClick={() => setFollowing(v => !v)}
                className={`mt-5 px-8 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 ${
                  following
                    ? 'bg-gray-700 text-gray-300 border border-gray-600'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {following ? '已关注' : '关注'}
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-800 mx-4 mb-4" />

          {/* Posts */}
          <div className="px-4">
            <p className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wide">
              全部帖子 ({posts.length})
            </p>
            {posts.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-10">还没有发布过帖子</p>
            ) : (
              <div className="flex flex-col gap-3">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => onNavigate({ screen: 'post', params: { postId: post.id } })}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
