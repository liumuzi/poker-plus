import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Eye, EyeOff, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const POKER_TERMS = ['River','Flop','Turn','Bluff','Check','Fold','Raise',
                     'Call','Bet','Pot','Equity','GTO','Nuts','Button','Stack','Range'];

function randomNickname() {
  const term = POKER_TERMS[Math.floor(Math.random() * POKER_TERMS.length)];
  const num  = String(Math.floor(Math.random() * 9000) + 1000);
  return `${term}_${num}`;
}

export default function RegisterPage({ onBack, onSuccess, onGoLogin }) {
  const { signUpWithEmail, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) onSuccess?.();
  }, [isLoggedIn]);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(randomNickname);
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  const validate = () => {
    if (!email) return '请填写邮箱';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '邮箱格式不正确';
    if (password.length < 8) return '密码至少 8 位';
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return '密码需包含字母和数字';
    if (!nickname.trim()) return '请填写昵称';
    if (nickname.length > 20) return '昵称最多 20 个字符';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError('');
    const { error: signUpErr, needsVerification } = await signUpWithEmail(email, password, nickname);
    setLoading(false);
    if (signUpErr) { setError(signUpErr.message || '注册失败，请稍后重试'); return; }
    if (needsVerification) { setDone(true); return; }
    onSuccess?.();
  };

  if (done) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 items-center justify-center px-6 text-center">
        <CheckCircle2 size={56} className="text-green-400 mb-4" />
        <h2 className="text-white text-2xl font-black mb-2">验证邮件已发送</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          请前往邮箱点击验证链接，完成注册后即可登录。
        </p>
        <button onClick={onGoLogin}
          className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition-transform">
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 px-5 pt-12 pb-8">
      <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 mb-8 active:scale-95 transition-transform">
        <ArrowLeft size={18} color="white" />
      </button>

      <h1 className="text-white text-3xl font-black mb-1">创建账号</h1>
      <p className="text-gray-400 text-sm mb-8">加入 Poker+ 社区</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* 昵称 */}
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={nickname} onChange={e => setNickname(e.target.value)}
            placeholder="昵称（可修改）" maxLength={20}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
        </div>
        <button type="button" onClick={() => setNickname(randomNickname())}
          className="text-blue-400 text-xs text-left px-1 -mt-1">
          随机生成昵称
        </button>

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
            placeholder="密码（至少 8 位，含字母+数字）"
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl pl-4 pr-11 py-3.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <p className="text-red-400 text-xs px-1">{error}</p>}

        <button type="submit" disabled={loading}
          className={`w-full py-3.5 rounded-2xl font-black text-sm mt-2 transition-all active:scale-95 ${
            loading ? 'bg-gray-800 text-gray-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
          }`}>
          {loading ? '注册中…' : '注册'}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        已有账号？{' '}
        <button onClick={onGoLogin} className="text-blue-400 font-bold">直接登录</button>
      </p>
    </div>
  );
}
