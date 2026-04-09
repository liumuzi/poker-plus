import React, { useState } from 'react';
import { ArrowLeft, MoreHorizontal, Loader2, Tag, MessageCircle } from 'lucide-react';
import { usePost } from '../../hooks/usePost';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../../components/community/UserAvatar';
import LikeButton from '../../components/community/LikeButton';
import CommentThread from '../../components/community/CommentThread';
import CommentInput from '../../components/community/CommentInput';
import AuthModal from '../../components/community/AuthModal';
import ReportModal from '../../components/community/ReportModal';
import ReplayHandView from '../../components/community/ReplayHandView';

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PostDetail({ postId, onBack, onNavigate }) {
  const { user, isLoggedIn } = useAuth();
  const { post, comments, loading, addComment } = usePost(postId);
  const [replyTo, setReplyTo]     = useState(null); // { id, nickname }
  const [showAuth, setShowAuth]   = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleComment = async (content) => {
    if (!isLoggedIn) { setShowAuth(true); return; }
    setSubmitting(true);
    await addComment(content, replyTo?.id || null, replyTo?.id || null, user.id);
    setReplyTo(null);
    setSubmitting(false);
  };

  const handleNeedAuth = () => setShowAuth(true);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 items-center justify-center">
        <Loader2 size={28} className="text-gray-600 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 items-center justify-center">
        <p className="text-gray-500">帖子不存在或已被删除</p>
        <button onClick={onBack} className="text-blue-400 text-sm mt-4">返回</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform">
          <ArrowLeft size={18} color="white" />
        </button>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          post.type === 'replay' ? 'bg-blue-900 text-blue-300' : 'bg-emerald-900 text-emerald-300'
        }`}>
          {post.type === 'replay' ? '复盘' : '讨论'}
        </span>
        <button onClick={() => setShowReport(true)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform">
          <MoreHorizontal size={18} color="#9CA3AF" />
        </button>
      </div>

      <div className="px-4">
        {/* 作者 */}
        <div
          className="flex items-center gap-3 mb-4 cursor-pointer"
          onClick={() => onNavigate({ screen: 'userProfile', params: { userId: post.user_id } })}
        >
          <UserAvatar nickname={post.profile?.nickname} avatarUrl={post.profile?.avatar_url} size={40} />
          <div>
            <p className="text-white font-bold text-sm">{post.profile?.nickname}</p>
            <p className="text-gray-500 text-xs">{relativeTime(post.created_at)}</p>
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-white text-xl font-black leading-snug mb-3">{post.title}</h1>

        {/* 复盘手牌可视化 */}
        {post.type === 'replay' && post.replay_data && (
          <ReplayHandView replayData={post.replay_data} />
        )}

        {/* 正文 */}
        {post.body && (
          <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.body}</p>
        )}

        {/* 标签 */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                <Tag size={10} />{tag}
              </span>
            ))}
          </div>
        )}

        {/* 操作栏 */}
        <div className="flex items-center gap-5 py-4 border-t border-b border-gray-800 mb-4">
          <LikeButton targetType="post" targetId={post.id} initialCount={post.like_count} onNeedAuth={handleNeedAuth} />
          <span className="flex items-center gap-1.5 text-gray-500 text-sm">
            <MessageCircle size={15} />
            {post.comment_count} 条评论
          </span>
        </div>

        {/* 评论列表 */}
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
          全部评论 ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">暂无评论，来发表第一条吧</p>
        ) : (
          comments.map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              onReply={(target) => setReplyTo(target)}
              onNeedAuth={handleNeedAuth}
            />
          ))
        )}
      </div>

      {/* 固定评论输入框 */}
      <CommentInput
        onSubmit={handleComment}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={submitting}
      />

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onNavigate={onNavigate} />
      <ReportModal open={showReport} onClose={() => setShowReport(false)} targetType="post" targetId={post.id} />
    </div>
  );
}
