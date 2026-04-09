import React from 'react';
import { ArrowLeft, Shield, FileText, Mail } from 'lucide-react';

const APP_VERSION = '1.0.0';

export default function AboutPage({ onBack }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-24">
      <div className="flex items-center gap-3 px-3 pt-12 pb-4">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform">
          <ArrowLeft size={20} color="#9CA3AF" />
        </button>
        <h1 className="text-white text-lg font-bold">关于 Poker+</h1>
      </div>

      {/* Logo block */}
      <div className="flex flex-col items-center py-10 px-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
          <span className="text-white text-3xl font-black">P+</span>
        </div>
        <h2 className="text-white text-2xl font-black">Poker+</h2>
        <p className="text-gray-500 text-sm mt-1">专业错题本 · 真德扑状态机复盘</p>
        <p className="text-gray-600 text-xs mt-3">版本 {APP_VERSION}</p>
      </div>

      <div className="h-px bg-gray-800 mx-4 mb-2" />

      {/* Links */}
      <div className="flex flex-col">
        <button
          onClick={() => {}}
          className="flex items-center justify-between px-4 py-4 active:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield size={18} color="#6B7280" />
            <span className="text-white text-sm">隐私政策</span>
          </div>
          <ArrowLeft size={16} color="#6B7280" style={{ transform: 'rotate(180deg)' }} />
        </button>

        <button
          onClick={() => {}}
          className="flex items-center justify-between px-4 py-4 active:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText size={18} color="#6B7280" />
            <span className="text-white text-sm">用户协议</span>
          </div>
          <ArrowLeft size={16} color="#6B7280" style={{ transform: 'rotate(180deg)' }} />
        </button>

        <button
          onClick={() => {}}
          className="flex items-center justify-between px-4 py-4 active:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Mail size={18} color="#6B7280" />
            <span className="text-white text-sm">联系我们</span>
          </div>
          <ArrowLeft size={16} color="#6B7280" style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>

      <div className="h-px bg-gray-800 mx-4 mt-2" />

      <p className="text-center text-gray-700 text-xs mt-8 px-6">
        © 2026 Poker+. All rights reserved.{'\n'}
        本产品仅供德州扑克学习与复盘使用，不涉及任何形式的赌博或金钱交易。
      </p>
    </div>
  );
}
