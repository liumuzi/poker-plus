import React, { useState } from 'react';
import { Search, Plus, Loader2, Bell } from 'lucide-react';
import { usePosts } from '../../hooks/usePosts';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import PostCard from '../../components/community/PostCard';
import AuthModal from '../../components/community/AuthModal';
import UserAvatar from '../../components/community/UserAvatar';

const TABS = [
  { id: 'all',        label: '全部' },
  { id: 'replay',     label: '复盘' },
  { id: 'discussion', label: '讨论' },
];

export default function CommunityFeed({ onNavigate }) {
  const { isLoggedIn, profile } = useAuth();
  const [tab, setTab]           = useState('all');
  const [showAuth, setShowAuth] = useState(false);
  const { posts, loading, loadingMore, hasMore, loadMore, error, refresh } = usePosts(tab);
  const { unreadCount }         = useNotifications();

  const handleCreate = () => {
    if (!isLoggedIn) { setShowAuth(true); return; }
    onNavigate({ screen: 'create' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <h1 className="text-white text-xl font-black">Poker+ 社区</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate({ screen: 'search' })}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform"
          >
            <Search size={16} color="#9CA3AF" />
          </button>
          {isLoggedIn && (
            <button
              onClick={() => onNavigate({ screen: 'notifications' })}
              className="relative w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform"
            >
              <Bell size={16} color="#9CA3AF" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          )}
          {isLoggedIn && (
            <div onClick={() => onNavigate({ screen: 'settings' })}>
              <UserAvatar nickname={profile?.nickname} avatarUrl={profile?.avatar_url} size={36} />
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-4 mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              tab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <main className="flex flex-col gap-3 px-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="text-gray-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <p className="text-red-400 text-sm">加载失败: {error}</p>
            <button
              onClick={refresh}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-full active:scale-95 transition-transform"
            >
              重试
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-sm">暂无帖子，来发第一帖吧！</p>
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
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-3 text-sm text-gray-400 flex items-center justify-center gap-2 active:text-white transition-colors"
          >
            {loadingMore ? <Loader2 size={16} className="animate-spin" /> : '加载更多'}
          </button>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={handleCreate}
        className="fixed bottom-24 right-4 max-w-md w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-600/40 active:scale-95 transition-transform z-20"
        style={{ right: 'max(1rem, calc(50vw - 200px + 1rem))' }}
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </button>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onNavigate={onNavigate} />
    </div>
  );
}
