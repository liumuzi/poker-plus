import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem('poker_notif') || '{}'); } catch { return {}; }
}
function saveSettings(s) {
  localStorage.setItem('poker_notif', JSON.stringify(s));
}

function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

const SETTINGS = [
  { key: 'likes',    label: '点赞通知',    desc: '有人点赞你的帖子或评论时通知你' },
  { key: 'comments', label: '评论通知',    desc: '有人评论你的帖子时通知你' },
  { key: 'replies',  label: '回复通知',    desc: '有人回复你的评论时通知你' },
];

export default function NotificationSettingsPage({ onBack }) {
  const [notif, setNotif] = useState({ likes: true, comments: true, replies: true });

  useEffect(() => {
    setNotif({ likes: true, comments: true, replies: true, ...loadSettings() });
  }, []);

  const toggle = (key) => {
    const next = { ...notif, [key]: !notif[key] };
    setNotif(next);
    saveSettings(next);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-24">
      <div className="flex items-center gap-3 px-3 pt-12 pb-4">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform">
          <ArrowLeft size={20} color="#9CA3AF" />
        </button>
        <h1 className="text-white text-lg font-bold">通知设置</h1>
      </div>

      <div className="flex flex-col gap-0">
        {SETTINGS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3 flex-1">
              <Bell size={18} color="#6B7280" />
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
            <Toggle on={notif[key]} onToggle={() => toggle(key)} />
          </div>
        ))}
      </div>

      <p className="text-gray-600 text-xs px-4 mt-6 leading-relaxed">
        通知设置保存在本设备上。部分通知依赖浏览器权限，请确保已允许通知。
      </p>
    </div>
  );
}
