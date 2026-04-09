import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Chrome } from 'lucide-react';

/**
 * 登录引导弹窗：未登录用户点击发帖/评论/点赞时弹出
 */
export default function AuthModal({ open, onClose, onNavigate }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end"
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md mx-auto bg-gray-900 rounded-t-3xl px-6 pt-6 pb-10 border-t border-gray-700"
          >
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800">
              <X size={14} className="text-gray-400" />
            </button>

            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">加入社区</p>
            <h3 className="text-white text-xl font-black mb-1">登录后继续操作</h3>
            <p className="text-gray-400 text-sm mb-6">发帖、评论、点赞均需登录账号</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { onClose(); onNavigate({ screen: 'login' }); }}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm active:scale-95 transition-transform"
              >
                <Mail size={16} />
                邮箱登录 / 注册
              </button>
              <button
                onClick={() => { onClose(); onNavigate({ screen: 'login', params: { tab: 'google' } }); }}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gray-800 text-white font-bold text-sm border border-gray-700 active:scale-95 transition-transform"
              >
                <Chrome size={16} />
                使用 Google 登录
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
