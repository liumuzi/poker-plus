import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Calculator, Plus, BarChart2, User } from 'lucide-react';

const TABS = [
  { id: 'record',    label: '记录', Icon: BookOpen,    isCenter: false },
  { id: 'tools',     label: '基础', Icon: Calculator,  isCenter: false },
  { id: 'community', label: '',     Icon: Plus,         isCenter: true  },
  { id: 'analysis',  label: '分析', Icon: BarChart2,   isCenter: false },
  { id: 'me',        label: '我的', Icon: User,         isCenter: false },
];

const TOAST_LABELS = { analysis: '分析' };

export default function BottomTabBar({ activeTab, onTabChange }) {
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handlePress = (tab) => {
    if (TOAST_LABELS[tab.id]) {
      showToast(`${TOAST_LABELS[tab.id]}功能即将上线，敬请期待 🎉`);
    } else {
      onTabChange(tab.id);
    }
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-2.5 rounded-full shadow-xl border border-slate-700 whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto"
        style={{
          height: 'calc(64px + env(safe-area-inset-bottom))',
          backgroundColor: '#0f172a',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {TABS.map((tab) => {
            const { id, label, Icon, isCenter } = tab;

            if (isCenter) {
              const isCommunityActive = activeTab === 'community';
              return (
                <button
                  key={id}
                  onClick={() => onTabChange('community')}
                  className="flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: isCommunityActive ? '#2563EB' : '#EF4444',
                    boxShadow: isCommunityActive
                      ? '0 4px 16px rgba(37,99,235,0.5)'
                      : '0 4px 16px rgba(239,68,68,0.45)',
                    marginBottom: 16,
                  }}
                >
                  <Icon size={26} color="white" strokeWidth={2.5} />
                </button>
              );
            }

            const isActive = activeTab === id;

            return (
              <button
                key={id}
                onClick={() => handlePress(tab)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full active:scale-95 transition-transform"
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  color={isActive ? '#38BDF8' : '#6B7280'}
                  fill={isActive ? 'rgba(56,189,248,0.12)' : 'none'}
                />
                <span
                  style={{
                    fontSize: 10,
                    lineHeight: 1,
                    color: isActive ? '#38BDF8' : '#6B7280',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
