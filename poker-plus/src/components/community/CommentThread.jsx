import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import UserAvatar from './UserAvatar';
import LikeButton from './LikeButton';

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  return `${Math.floor(h / 24)}天前`;
}

function CommentBubble({ comment, onReply, onNeedAuth, isReply = false }) {
  const { profile, content, like_count, created_at, id } = comment;

  return (
    <div className={`flex gap-2.5 ${isReply ? 'mt-3' : ''}`}>
      <UserAvatar nickname={profile?.nickname} avatarUrl={profile?.avatar_url} size={isReply ? 26 : 32} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-xs font-bold">{profile?.nickname}</span>
          <span className="text-gray-500 text-[11px]">{relativeTime(created_at)}</span>
        </div>
        <p className="text-gray-200 text-sm leading-relaxed break-words">{content}</p>
        <div className="flex items-center gap-4 mt-2">
          <LikeButton targetType="comment" targetId={id} initialCount={like_count} onNeedAuth={onNeedAuth} small />
          <button
            onClick={() => onReply?.({ id, nickname: profile?.nickname })}
            className="text-[11px] text-gray-500 hover:text-blue-400 transition-colors"
          >
            回复
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 楼中楼评论组件（最多 2 层）
 */
export default function CommentThread({ comment, onReply, onNeedAuth }) {
  const { replies = [] } = comment;
  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 3;

  const visibleReplies = expanded ? replies : replies.slice(0, PREVIEW);
  const hiddenCount = replies.length - PREVIEW;

  return (
    <div className="py-4 border-b border-gray-800 last:border-0">
      <CommentBubble comment={comment} onReply={onReply} onNeedAuth={onNeedAuth} />

      {/* 二级评论 */}
      {replies.length > 0 && (
        <div className="ml-10 mt-3 pl-3 border-l border-gray-700">
          {visibleReplies.map(r => (
            <CommentBubble key={r.id} comment={r} onReply={onReply} onNeedAuth={onNeedAuth} isReply />
          ))}

          {/* 展开/收起 */}
          {replies.length > PREVIEW && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-blue-400 text-xs font-bold mt-3 hover:text-blue-300 transition-colors"
            >
              {expanded
                ? <><ChevronUp size={13} />收起回复</>
                : <><ChevronDown size={13} />查看全部 {replies.length} 条回复</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}
