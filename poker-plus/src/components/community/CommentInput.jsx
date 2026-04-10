import React, { useRef, useState, useEffect } from 'react';
import { Send, X } from 'lucide-react';

/**
 * 评论输入框（固定在底部）
 * replyTo: { id, nickname } | null
 */
export default function CommentInput({ onSubmit, replyTo, onCancelReply, disabled }) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (replyTo) ref.current?.focus();
  }, [replyTo]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const placeholder = replyTo ? `回复 @${replyTo.nickname}…` : '发表评论…';

  return (
    <div className="fixed left-0 right-0 max-w-md mx-auto z-50 bg-gray-900 border-t border-gray-800 px-3 py-2.5"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))', paddingBottom: '0.625rem' }}>
      {/* 回复目标提示 */}
      {replyTo && (
        <div className="flex items-center justify-between px-1 mb-1.5">
          <span className="text-xs text-blue-400">回复 @{replyTo.nickname}</span>
          <button onClick={onCancelReply}>
            <X size={13} className="text-gray-500" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          maxLength={500}
          rows={1}
          style={{ resize: 'none', minHeight: 36, maxHeight: 100 }}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-500 leading-snug"
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 ${
            text.trim() && !disabled ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-600'
          }`}
        >
          <Send size={15} />
        </button>
      </div>

      {text.length > 400 && (
        <p className="text-[10px] text-gray-500 text-right mt-1 px-1">{text.length}/500</p>
      )}
    </div>
  );
}
