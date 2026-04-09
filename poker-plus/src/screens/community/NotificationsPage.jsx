import React from 'react';
import { ArrowLeft, Heart, MessageCircle, MessageSquare, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import UserAvatar from '../../components/community/UserAvatar';

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}天前`;
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

const TYPE_ICON = {
  like_post:    <Heart size={14} className="text-red-400" fill="currentColor" />,
  like_comment: <Heart size={14} className="text-red-400" fill="currentColor" />,
  comment:      <MessageCircle size={14} className="text-blue-400" />,
  reply:        <MessageSquare size={14} className="text-emerald-400" />,
};

export default function NotificationsPage({ onBack, onNavigate }) {
  const { notifications, loading, unreadCount, markAllRead } = useNotifications();

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
        <h1 className="text-white text-lg font-bold">通知</h1>
        {unreadCount > 0 ? (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-blue-400 text-xs active:opacity-70"
          >
            <CheckCheck size={14} />
            全部已读
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {/* List */}
      <div className="flex flex-col">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-600 text-sm">暂无通知</p>
          </div>
        ) : (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => n.target?.id && onNavigate({ screen: 'post', params: { postId: n.target.id } })}
              className={`flex items-start gap-3 px-4 py-4 border-b border-gray-800 active:bg-gray-800 transition-colors text-left ${
                !n.is_read ? 'bg-gray-800/40' : ''
              }`}
            >
              {/* Avatar + type icon */}
              <div className="relative flex-shrink-0">
                <UserAvatar nickname={n.actor?.nickname} avatarUrl={n.actor?.avatar_url} size={40} />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                  {TYPE_ICON[n.type] || <MessageCircle size={12} className="text-gray-400" />}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm leading-snug">
                  <span className="font-bold">{n.actor?.nickname}</span>
                  {' '}
                  <span className="text-gray-300">{n.message}</span>
                </p>
                {n.target?.title && (
                  <p className="text-gray-500 text-xs mt-0.5 truncate">「{n.target.title}」</p>
                )}
                <p className="text-gray-600 text-[11px] mt-1">{relativeTime(n.created_at)}</p>
              </div>

              {/* Unread dot */}
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
