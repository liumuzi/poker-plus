import React, { useState } from 'react';
import { X, Users, Share2, Copy, Check, MessageCircle } from 'lucide-react';

/**
 * 分享底部弹窗
 *
 * Props:
 *   open             boolean
 *   onClose          () => void
 *   shareTitle       string  — 分享标题
 *   shareText        string  — 分享正文
 *   onShareCommunity () => void  — 点击"分享到社区"
 */
export default function ShareSheet({ open, onClose, shareTitle, shareText, onShareCommunity }) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  // ── 外部分享（Web Share API） ───────────────────────────────
  const handleExternalShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText });
      } catch {
        // user cancelled or error — fall through to copy
      }
    } else {
      handleCopy();
    }
  };

  // ── 复制文本 ────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── 分享到社区 ──────────────────────────────────────────────
  const handleCommunity = () => {
    onClose();
    onShareCommunity();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-gray-900 rounded-t-3xl border-t border-gray-800 px-5 pt-5 pb-10">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 active:scale-90"
        >
          <X size={16} color="#9CA3AF" />
        </button>

        <h2 className="text-white font-bold text-base mb-1">分享这手牌</h2>
        <p className="text-gray-500 text-xs mb-5">让更多人来讨论你的决策</p>

        {/* Preview card */}
        <div className="bg-gray-800 rounded-2xl p-4 mb-5 border border-gray-700">
          <p className="text-white text-xs font-bold mb-1 line-clamp-1">{shareTitle}</p>
          <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-4 whitespace-pre-line">
            {shareText}
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3">

          {/* 分享到社区 */}
          <button
            onClick={handleCommunity}
            className="flex flex-col items-center gap-2 bg-blue-600 rounded-2xl py-4 active:scale-95 transition-transform"
          >
            <Users size={22} color="white" />
            <span className="text-white text-[11px] font-bold">分享社区</span>
          </button>

          {/* 外部分享（微信等） */}
          <button
            onClick={handleExternalShare}
            className="flex flex-col items-center gap-2 bg-emerald-600 rounded-2xl py-4 active:scale-95 transition-transform"
          >
            <Share2 size={22} color="white" />
            <span className="text-white text-[11px] font-bold">
              {navigator.share ? '发送给朋友' : '系统分享'}
            </span>
          </button>

          {/* 复制文本 */}
          <button
            onClick={handleCopy}
            className={`flex flex-col items-center gap-2 rounded-2xl py-4 active:scale-95 transition-all ${
              copied ? 'bg-gray-600' : 'bg-gray-700'
            }`}
          >
            {copied
              ? <Check size={22} color="#34D399" />
              : <Copy size={22} color="#9CA3AF" />
            }
            <span className={`text-[11px] font-bold ${copied ? 'text-emerald-400' : 'text-gray-400'}`}>
              {copied ? '已复制' : '复制文本'}
            </span>
          </button>
        </div>

        <p className="text-gray-600 text-[10px] text-center mt-4">
          分享到社区后可编辑标题和描述
        </p>
      </div>
    </div>
  );
}
