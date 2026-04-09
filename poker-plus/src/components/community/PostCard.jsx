import React from 'react';
import { Heart, MessageCircle, Tag } from 'lucide-react';
import UserAvatar from './UserAvatar';

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

export default function PostCard({ post, onClick, onAvatarClick }) {
  const { profile, type, title, body, replay_data, tags, like_count, comment_count, created_at } = post;

  const preview = type === 'replay' && replay_data?.heroCards
    ? `Hero: ${replay_data.heroCards.map(c => c.rank + c.suit).join('')}`
    : (body || '').slice(0, 80);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
    >
      {/* 顶部：头像 + 昵称 + 类型标签 + 时间 */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          onClick={onAvatarClick ? (e) => { e.stopPropagation(); onAvatarClick(); } : undefined}
          className={onAvatarClick ? 'cursor-pointer active:opacity-70 transition-opacity' : ''}
        >
          <UserAvatar nickname={profile?.nickname} avatarUrl={profile?.avatar_url} size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-gray-900 text-sm font-bold truncate block">{profile?.nickname}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          type === 'replay'
            ? 'bg-blue-100 text-blue-600'
            : 'bg-emerald-100 text-emerald-600'
        }`}>
          {type === 'replay' ? '复盘' : '讨论'}
        </span>
        <span className="text-[11px] text-gray-400 shrink-0">{relativeTime(created_at)}</span>
      </div>

      {/* 标题 */}
      <h3 className="text-gray-900 font-black text-[15px] leading-snug mb-1.5 line-clamp-2">{title}</h3>

      {/* 内容预览 */}
      {preview && (
        <p className="text-gray-500 text-[13px] leading-relaxed line-clamp-2 mb-2.5">{preview}</p>
      )}

      {/* 底部：点赞、评论、标签 */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-gray-400 text-xs">
          <Heart size={13} />
          {like_count}
        </span>
        <span className="flex items-center gap-1 text-gray-400 text-xs">
          <MessageCircle size={13} />
          {comment_count}
        </span>
        <div className="flex-1" />
        {(tags || []).slice(0, 2).map(tag => (
          <span key={tag} className="flex items-center gap-0.5 text-[11px] text-gray-400">
            <Tag size={10} />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
