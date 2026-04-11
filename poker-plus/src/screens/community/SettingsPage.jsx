import React, { useState, useRef, useEffect } from 'react';
import {
  Edit2, Check, X, LogOut, ChevronRight, FileText,
  Camera, Lock, Eye, EyeOff, Heart, Bell, Info,
  MessageSquare, Trash2, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../../components/community/UserAvatar';
import { MOCK_POSTS } from '../../data/mockPosts';
import { MOCK_MODE, supabase, withTimeout } from '../../lib/supabase';

// ── 分组 Row 组件 ──────────────────────────────────────────────
function Row({ icon: Icon, label, value, onClick, danger, rightNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-4 py-4 active:bg-gray-800 transition-colors ${danger ? '' : ''}`}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon size={18} color={danger ? '#EF4444' : '#6B7280'} />}
        <span className={`text-sm ${danger ? 'text-red-400' : 'text-white'}`}>{label}</span>
      </div>
      {rightNode ?? (
        <div className="flex items-center gap-1">
          {value != null && <span className="text-gray-500 text-sm">{value}</span>}
          <ChevronRight size={16} color="#4B5563" />
        </div>
      )}
    </button>
  );
}

function SectionHeader({ title }) {
  return <p className="text-gray-500 text-xs font-semibold px-4 pt-5 pb-1 uppercase tracking-wider">{title}</p>;
}


// ── 主组件 ────────────────────────────────────────────────────
export default function SettingsPage({ onBack, onNavigate }) {
  const { user, profile, signOut, updateProfile, uploadAvatar, isLoggedIn } = useAuth();

  // 编辑资料
  const [editing, setEditing]           = useState(false);
  const [nickname, setNickname]         = useState('');
  const [bio, setBio]                   = useState('');
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 统计
  const [myPostsCount, setMyPostsCount] = useState(0);
  const [myLikesCount, setMyLikesCount] = useState(0);

  // 密码修改
  const [showPwForm, setShowPwForm]     = useState(false);
  const [newPw, setNewPw]               = useState('');
  const [showNewPw, setShowNewPw]       = useState(false);
  const [pwSaving, setPwSaving]         = useState(false);
  const [pwError, setPwError]           = useState('');
  const [pwDone, setPwDone]             = useState(false);


  // 弹窗
  const [showSignOutConfirm, setShowSignOutConfirm]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm]     = useState(false);
  const [deleteInput, setDeleteInput]                 = useState('');
  const [deleting, setDeleting]                       = useState(false);

  // 昵称30天限制
  const nicknameChangedAt = profile?.nickname_changed_at ? new Date(profile.nickname_changed_at) : null;
  const canChangeNickname = !nicknameChangedAt || (Date.now() - nicknameChangedAt.getTime()) > 30 * 24 * 60 * 60 * 1000;
  const nicknameCountdown = nicknameChangedAt && !canChangeNickname
    ? Math.ceil((30 * 24 * 60 * 60 * 1000 - (Date.now() - nicknameChangedAt.getTime())) / (24 * 60 * 60 * 1000))
    : 0;

  const isEmailUser = user?.app_metadata?.provider === 'email' || user?.identities?.some(i => i.provider === 'email');

  // 加载统计
  useEffect(() => {
    if (MOCK_MODE) { setMyPostsCount(3); setMyLikesCount(5); return; }
    if (!user) return;
    withTimeout(supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id))
      .then(({ count }) => setMyPostsCount(count ?? 0))
      .catch(() => {});
    withTimeout(supabase.from('likes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('target_type', 'post'))
      .then(({ count }) => setMyLikesCount(count ?? 0))
      .catch(() => {});
  }, [user]);

  // 头像上传
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const { error } = await uploadAvatar(file);
    setAvatarUploading(false);
    if (error) setSaveError(error.message);
  };

  // 保存资料
  const handleSave = async () => {
    console.log('[SettingsPage] handleSave called');
    setSaving(true);
    setSaveError('');
    try {
      const updates = { bio: bio.trim() };
      const nicknameChanged = nickname.trim() !== (profile?.nickname || '');
      if (nicknameChanged) {
        if (!canChangeNickname) {
          setSaveError(`昵称每 30 天只能修改一次，还需等待 ${nicknameCountdown} 天`);
          return;
        }
        updates.nickname = nickname.trim();
        updates.nickname_changed_at = new Date().toISOString();
      }
      console.log('[SettingsPage] calling updateProfile', { nicknameChanged });
      const { error } = await updateProfile(updates);
      console.log('[SettingsPage] updateProfile returned', { error: error?.message });
      if (error) { setSaveError(error.message); return; }
      setEditing(false);
    } catch (err) {
      console.error('[SettingsPage] handleSave error:', err);
      setSaveError(err.message || '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 修改密码
  const handlePasswordChange = async () => {
    if (newPw.length < 8 || !/[a-zA-Z]/.test(newPw) || !/\d/.test(newPw)) {
      setPwError('密码至少 8 位，需含字母和数字'); return;
    }
    setPwSaving(true); setPwError('');
    try {
      const { error } = await withTimeout(supabase.auth.updateUser({ password: newPw }));
      if (error) { setPwError(error.message); return; }
      setPwDone(true); setNewPw('');
      setTimeout(() => { setPwDone(false); setShowPwForm(false); }, 2000);
    } catch (err) {
      setPwError(err.message || '修改失败，请稍后重试');
    } finally {
      setPwSaving(false);
    }
  };

  // 退出登录
  const handleSignOut = async () => {
    await signOut();
    setShowSignOutConfirm(false);
  };

  // 注销账号
  const handleDeleteAccount = async () => {
    if (deleteInput !== '注销账号') return;
    setDeleting(true);
    if (!MOCK_MODE) {
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  // ── 未登录 ────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 pb-24">
        <div className="px-4 pt-12 pb-4">
          <h1 className="text-white text-lg font-bold">我的</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 px-8 gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-2">
            <span className="text-4xl">🃏</span>
          </div>
          <p className="text-gray-400 text-sm text-center">登录后查看个人主页、管理帖子</p>
          <button
            onClick={() => onNavigate({ screen: 'login' })}
            className="w-full max-w-xs bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 active:scale-95 transition-transform"
          >
            登录 / 注册
          </button>
        </div>
      </div>
    );
  }

  // ── 已登录 ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-32">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <h1 className="text-white text-lg font-bold">我的</h1>
        {!editing ? (
          <button
            onClick={() => { setNickname(profile?.nickname || ''); setBio(profile?.bio || ''); setSaving(false); setSaveError(''); setEditing(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 active:scale-90 transition-transform"
          >
            <Edit2 size={13} color="#9CA3AF" />
            <span className="text-gray-400 text-xs">编辑资料</span>
          </button>
        ) : (
          <button onClick={() => setEditing(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800">
            <X size={16} color="#9CA3AF" />
          </button>
        )}
      </div>

      {/* Profile card */}
      <div className="flex flex-col items-center px-6 pb-5 pt-3">
        <div className="relative mb-3">
          <UserAvatar
            nickname={profile?.nickname} avatarUrl={profile?.avatar_url} size={80}
            onClick={editing ? () => fileInputRef.current?.click() : undefined}
          />
          {editing && (
            <div onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.45)' }}>
              {avatarUploading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={20} color="white" />}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {editing ? (
          <div className="w-full flex flex-col gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">昵称</label>
              <input value={nickname} onChange={e => setNickname(e.target.value)} maxLength={20}
                disabled={!canChangeNickname}
                className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="输入昵称..." />
              {!canChangeNickname && (
                <p className="text-yellow-500 text-xs mt-1 px-1">还需等待 {nicknameCountdown} 天才能修改昵称</p>
              )}
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">个人简介</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={100} rows={3}
                className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="介绍一下自己..." />
            </div>
            {saveError && <p className="text-red-400 text-xs px-1">{saveError}</p>}
            <button onClick={handleSave} disabled={saving || !nickname.trim()}
              className="w-full bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={16} /> 保存</>}
            </button>
          </div>
        ) : (
          <>
            <p className="text-white font-bold text-xl">{profile?.nickname || '—'}</p>
            <p className="text-gray-400 text-sm text-center mt-1">{profile?.bio || '这个人很懒，什么都没写～'}</p>
            <p className="text-gray-600 text-xs mt-1">{user?.email}</p>
            <div className="flex gap-10 mt-4">
              <div className="flex flex-col items-center">
                <span className="text-white font-bold text-lg">{myPostsCount}</span>
                <span className="text-gray-500 text-xs">帖子</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-white font-bold text-lg">{myLikesCount}</span>
                <span className="text-gray-500 text-xs">点赞</span>
              </div>
            </div>
          </>
        )}
      </div>

      {!editing && (
        <>
          {/* ── 我的内容 ── */}
          <div className="h-px bg-gray-800 mx-4" />
          <SectionHeader title="我的内容" />
          <Row icon={FileText} label="我的帖子" value={myPostsCount}
            onClick={() => onNavigate({ screen: 'myPosts', params: { userId: user?.id } })} />
          <Row icon={Heart} label="我的点赞" value={myLikesCount}
            onClick={() => onNavigate({ screen: 'myLikes' })} />

          {/* ── 账号设置 ── */}
          <div className="h-px bg-gray-800 mx-4 mt-2" />
          <SectionHeader title="账号设置" />

          <Row icon={Bell} label="通知设置" onClick={() => onNavigate({ screen: 'notificationSettings' })} />

          {/* 修改密码（邮箱用户） */}
          {isEmailUser && (
            <>
              <div className="h-px bg-gray-700 mx-4 my-1" />
              <button
                onClick={() => { setShowPwForm(v => !v); setPwError(''); setPwDone(false); }}
                className="flex items-center justify-between w-full px-4 py-4 active:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock size={18} color="#6B7280" />
                  <span className="text-white text-sm">修改密码</span>
                </div>
                <ChevronRight size={16} color="#4B5563"
                  style={{ transform: showPwForm ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {showPwForm && (
                <div className="px-4 pb-4 flex flex-col gap-2">
                  <div className="relative">
                    <input type={showNewPw ? 'text' : 'password'} value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="新密码（至少 8 位，含字母+数字）"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-4 pr-11 py-3 text-white text-sm focus:outline-none focus:border-blue-500" />
                    <button type="button" onClick={() => setShowNewPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwError && <p className="text-red-400 text-xs px-1">{pwError}</p>}
                  {pwDone && <p className="text-green-400 text-xs px-1">密码修改成功</p>}
                  <button onClick={handlePasswordChange} disabled={pwSaving || !newPw}
                    className="w-full py-3 bg-blue-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl active:scale-95 transition-transform">
                    {pwSaving ? '保存中…' : '确认修改'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── 更多 ── */}
          <div className="h-px bg-gray-800 mx-4 mt-2" />
          <SectionHeader title="更多" />
          <Row icon={MessageSquare} label="意见反馈" onClick={() => onNavigate({ screen: 'feedback' })} />
          <Row icon={Info} label="关于 Poker+" onClick={() => onNavigate({ screen: 'about' })} />

          {/* ── 退出 & 注销 ── */}
          <div className="h-px bg-gray-800 mx-4 mt-2" />
          <button onClick={() => setShowSignOutConfirm(true)}
            className="flex items-center gap-3 w-full px-4 py-4 active:bg-gray-800 transition-colors">
            <LogOut size={18} color="#EF4444" />
            <span className="text-red-400 text-sm">退出登录</span>
          </button>
          <button onClick={() => { setShowDeleteConfirm(true); setDeleteInput(''); }}
            className="flex items-center gap-3 w-full px-4 py-3 active:bg-gray-800 transition-colors">
            <Trash2 size={18} color="#6B7280" />
            <span className="text-gray-600 text-sm">注销账号</span>
          </button>
        </>
      )}

      {/* ── 退出登录确认 ── */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSignOutConfirm(false)} />
          <div className="relative w-full max-w-md bg-gray-900 rounded-t-3xl px-6 pt-6 pb-10 border-t border-gray-800">
            <p className="text-white font-bold text-base text-center mb-1">确认退出登录？</p>
            <p className="text-gray-500 text-sm text-center mb-6">退出后需要重新登录才能发帖和互动</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleSignOut} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform">退出登录</button>
              <button onClick={() => setShowSignOutConfirm(false)} className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 注销账号确认 ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md bg-gray-900 rounded-t-3xl px-6 pt-6 pb-10 border-t border-gray-800">
            <div className="flex justify-center mb-3">
              <AlertTriangle size={32} color="#EF4444" />
            </div>
            <p className="text-white font-bold text-base text-center mb-1">注销账号</p>
            <p className="text-gray-400 text-sm text-center mb-4 leading-relaxed">
              注销后，你的账号、帖子、评论将被永久删除，且无法恢复。
            </p>
            <p className="text-gray-500 text-xs text-center mb-3">请输入 <span className="text-white font-bold">注销账号</span> 确认</p>
            <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
              placeholder="输入「注销账号」"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 mb-3" />
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteAccount}
                disabled={deleteInput !== '注销账号' || deleting}
                className="w-full bg-red-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform">
                {deleting ? '注销中…' : '确认注销'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
