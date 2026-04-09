import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_MODE, supabase } from '../../lib/supabase';

const CATEGORIES = [
  { value: 'bug',        label: '功能异常 / Bug' },
  { value: 'suggestion', label: '功能建议' },
  { value: 'content',    label: '内容举报' },
  { value: 'other',      label: '其他' },
];

export default function FeedbackPage({ onBack }) {
  const { user } = useAuth();
  const [category, setCategory] = useState('suggestion');
  const [content, setContent]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    if (content.trim().length < 10) { setError('请至少输入 10 个字'); return; }
    setSubmitting(true); setError('');

    if (!MOCK_MODE) {
      const { error: err } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        content: `[${category}] ${content.trim()}`,
      });
      if (err) { setError('提交失败，请稍后重试'); setSubmitting(false); return; }
    }

    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 items-center justify-center px-6 text-center">
        <CheckCircle2 size={56} className="text-green-400 mb-4" />
        <h2 className="text-white text-2xl font-black mb-2">感谢你的反馈</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          我们会认真阅读每一条反馈，持续改进 Poker+。
        </p>
        <button
          onClick={onBack}
          className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition-transform"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-24">
      <div className="flex items-center gap-3 px-3 pt-12 pb-4">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform">
          <ArrowLeft size={20} color="#9CA3AF" />
        </button>
        <h1 className="text-white text-lg font-bold">意见反馈</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Category */}
        <div>
          <p className="text-gray-400 text-xs mb-2">反馈类型</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium text-left transition-all border ${
                  category === c.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-800 text-gray-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <p className="text-gray-400 text-xs mb-2">详细描述 <span className="text-gray-600">（10-500 字）</span></p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={500}
            rows={6}
            placeholder="请详细描述你遇到的问题或建议..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
          <p className="text-gray-600 text-xs text-right mt-1">{content.length} / 500</p>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || content.trim().length < 10}
          className="w-full py-3.5 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-2xl active:scale-95 transition-transform"
        >
          {submitting ? '提交中…' : '提交反馈'}
        </button>
      </div>
    </div>
  );
}
