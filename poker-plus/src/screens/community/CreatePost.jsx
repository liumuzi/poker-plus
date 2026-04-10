import React, { useState } from 'react';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { checkPost } from '../../utils/contentFilter';
import { MOCK_MODE, supabase } from '../../lib/supabase';
import ReplayHandView from '../../components/community/ReplayHandView';

const MAX_TAGS = 5;

export default function CreatePost({ onBack, onSuccess, initialData }) {
  const { user } = useAuth();

  // Edit mode: initialData.editPost contains the existing post object
  const editPost = initialData?.editPost || null;
  const isEditing = !!editPost;

  const [type, setType]         = useState(editPost?.type || initialData?.type || 'discussion');
  const [title, setTitle]       = useState(editPost?.title || initialData?.title || '');
  const [body, setBody]         = useState(editPost?.body || initialData?.body || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags]         = useState(editPost?.tags || initialData?.tags || []);
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t || tags.includes(t) || tags.length >= MAX_TAGS) return;
    setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag));

  const handleSubmit = async () => {
    if (!title.trim()) { setError('请填写标题（至少 3 个字符）'); return; }
    if (title.length < 3) { setError('标题至少 3 个字符'); return; }
    if (type === 'discussion' && body.trim().length < 10) { setError('正文至少 10 个字符'); return; }

    // 内容过滤
    const check = checkPost({ title, body });
    if (!check.isClean) { setError(check.message); return; }

    setSubmitting(true); setError('');

    try {
      if (MOCK_MODE) {
        await new Promise(r => setTimeout(r, 800));
        onSuccess?.(editPost?.id || 'mock-post-' + Date.now());
        return;
      }

      if (isEditing) {
        const { error: updateErr } = await supabase
          .from('posts')
          .update({ title: title.trim(), body: body.trim() || null, tags })
          .eq('id', editPost.id)
          .eq('user_id', user.id);
        if (updateErr) throw updateErr;
        onSuccess?.(editPost.id);
      } else {
        const { data, error: insertErr } = await supabase
          .from('posts')
          .insert({
            user_id: user.id, type, title: title.trim(),
            body: body.trim() || null,
            replay_data: initialData?.replayData || null,
            tags,
          })
          .select()
          .single();
        if (insertErr) throw insertErr;
        onSuccess?.(data.id);
      }
    } catch (err) {
      setError(err.message || (isEditing ? '保存失败，请稍后重试' : '发布失败，请稍后重试'));
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = (max, cur) => (
    <span className={`text-[10px] ${cur > max * 0.9 ? 'text-amber-400' : 'text-gray-600'}`}>
      {cur}/{max}
    </span>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform">
          <ArrowLeft size={18} color="white" />
        </button>
        <h1 className="text-white font-black text-lg">{isEditing ? '编辑帖子' : '发帖'}</h1>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`px-5 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${
            submitting ? 'bg-gray-800 text-gray-600' : 'bg-blue-600 text-white'
          }`}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : (isEditing ? '保存' : '发布')}
        </button>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* 复盘手牌预览（从分享流程进入时显示） */}
        {initialData?.replayData && (
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">手牌数据</p>
            <ReplayHandView replayData={initialData.replayData} />
          </div>
        )}

        {/* 帖子类型 */}
        {!isEditing && !initialData?.type && (
          <div className="flex gap-2">
            {[{ id: 'discussion', label: '讨论帖' }, { id: 'replay', label: '复盘帖' }].map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  type === t.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* 标题 */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">标题</label>
            {charCount(100, title.length)}
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="简短描述这手牌或讨论主题…"
            maxLength={100}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
        </div>

        {/* 正文 */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">
              正文{type === 'discussion' ? '（必填）' : '（选填）'}
            </label>
            {charCount(5000, body.length)}
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={type === 'discussion'
              ? '详细描述你的问题或分析…\n支持 **加粗** 和 `代码` 格式'
              : '补充描述这手牌的背景和你的思考…'
            }
            maxLength={5000}
            rows={6}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600 resize-none leading-relaxed"
          />
        </div>

        {/* 标签 */}
        <div>
          <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">
            标签（最多 {MAX_TAGS} 个）
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-full">
                #{tag}
                <button onClick={() => removeTag(tag)}>
                  <X size={11} className="text-gray-500 hover:text-white" />
                </button>
              </span>
            ))}
          </div>
          {tags.length < MAX_TAGS && (
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="添加标签（回车确认）"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
              />
              <button onClick={addTag} className="px-4 py-2 bg-gray-800 text-gray-400 rounded-xl text-sm font-bold">
                添加
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
