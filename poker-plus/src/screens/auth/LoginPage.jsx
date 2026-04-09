import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Eye, EyeOff, Chrome } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage({ onBack, onSuccess, onGoRegister }) {
  const { signInWithEmail, signInWithGoogle, isLoggedIn } = useAuth();

  // OAuth 回调后页面刷新，检测到已登录就自动关闭登录页
  useEffect(() => {
    if (isLoggedIn) onSuccess?.();
  }, [isLoggedIn]);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('请填写邮箱和密码'); return; }
    setLoading(true); setError('');
    const { error: err } = await signInWithEmail(email, password);
    setLoading(false);
    if (err) { setError(err.message || '登录失败，请检查邮箱和密码'); return; }
    onSuccess?.();
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    const { error: err } = await signInWithGoogle();
    setLoading(false);
    if (err) setError(err.message || 'Google 登录失败');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 px-5 pt-12 pb-8">
      <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 mb-8 active:scale-95 transition-transform">
        <ArrowLeft size={18} color="white" />
      </button>

      <h1 className="text-white text-3xl font-black mb-1">欢迎回来</h1>
      <p className="text-gray-400 text-sm mb-8">登录以访问 Poker+ 社区</p>

      {/* Google 登录 */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-white text-gray-800 font-bold text-sm mb-5 active:scale-95 transition-transform shadow-sm"
      >
        <Chrome size={18} />
        使用 Google 登录
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-gray-600 text-xs">或邮箱登录</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      <form onSubmit={handleEmail} className="flex flex-col gap-3">
        {/* 邮箱 */}
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="邮箱地址"
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
        </div>

        {/* 密码 */}
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="密码"
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl pl-4 pr-11 py-3.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <p className="text-red-400 text-xs px-1">{error}</p>}

        <button
          type="submit" disabled={loading}
          className={`w-full py-3.5 rounded-2xl font-black text-sm mt-2 transition-all active:scale-95 ${
            loading ? 'bg-gray-800 text-gray-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
          }`}
        >
          {loading ? '登录中…' : '登录'}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        还没有账号？{' '}
        <button onClick={onGoRegister} className="text-blue-400 font-bold">立即注册</button>
      </p>
    </div>
  );
}
