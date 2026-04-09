import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag } from 'lucide-react';
import { MOCK_MODE, supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const REASONS = [
  { value: 'gambling_recruitment', label: '赌博招募 / 私局拉人' },
  { value: 'spam',                 label: '垃圾广告' },
  { value: 'harassment',           label: '骚扰或攻击他人' },
  { value: 'inappropriate',        label: '不当内容' },
  { value: 'other',                label: '其他' },
];

export default function ReportModal({ open, onClose, targetType, targetId }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState('');
  const [detail, setDetail]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);

    if (!MOCK_MODE) {
      await supabase.from('reports').insert({
        reporter_id: user.id, target_type: targetType,
        target_id: targetId, reason: selected, detail,
      });
    }

    await new Promise(r => setTimeout(r, 500));
    setDone(true);
    setSubmitting(false);
    setTimeout(() => { onClose(); setDone(false); setSelected(''); setDetail(''); }, 1500);
  };

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
            className="relative w-full max-w-md mx-auto bg-gray-900 rounded-t-3xl px-5 pt-5 pb-10 border-t border-gray-700"
          >
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800">
              <X size={14} className="text-gray-400" />
            </button>

            {done ? (
              <div className="py-8 text-center">
                <Flag size={32} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-bold">举报已提交</p>
                <p className="text-gray-400 text-sm mt-1">我们会尽快处理，感谢你维护社区环境</p>
              </div>
            ) : (
              <>
                <h3 className="text-white font-black text-lg mb-4">举报内容</h3>
                <div className="flex flex-col gap-2 mb-4">
                  {REASONS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setSelected(r.value)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        selected === r.value
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-gray-700 bg-gray-800 text-gray-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={detail}
                  onChange={e => setDetail(e.target.value)}
                  placeholder="补充说明（选填）"
                  maxLength={200}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-gray-500 mb-4"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!selected || submitting}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
                    selected && !submitting
                      ? 'bg-red-600 text-white active:scale-95'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {submitting ? '提交中…' : '提交举报'}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
