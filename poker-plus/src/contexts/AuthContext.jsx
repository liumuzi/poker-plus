import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { MOCK_MODE, supabase } from '../lib/supabase';

// ── Mock 用户（MOCK_MODE = true 时使用）──────────────────────
const MOCK_USER = null; // null = 未登录；改为对象模拟已登录状态

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // 用于区分用户主动退出 vs token 刷新失败触发的 SIGNED_OUT
  const isSigningOutRef = useRef(false);

  useEffect(() => {
    if (MOCK_MODE) {
      // Mock 模式：直接使用本地状态，不连接 Supabase
      setUser(MOCK_USER);
      setProfile(MOCK_USER ? {
        id: MOCK_USER.id,
        nickname: 'River_2847',
        avatar_url: null,
        bio: '德州扑克爱好者',
        post_count: 3,
      } : null);
      setLoading(false);
      return;
    }

    // 真实模式：监听 Supabase Auth 状态
    // 安全超时：8s 后强制解除 loading，防止网络问题导致 UI 永久卡住
    const loadingTimer = setTimeout(() => setLoading(false), 8000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(loadingTimer);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // 用户主动退出时，signOut() 已立即清除状态，这里直接忽略
          if (isSigningOutRef.current) {
            isSigningOutRef.current = false;
            return;
          }
          // 非主动退出（如 token 刷新失败）：先验证 session 是否真的消失
          // 若 getSession 仍能返回有效 session，说明这是一个误发事件，忽略它
          try {
            const { data: { session: current } } = await supabase.auth.getSession();
            if (current?.user) {
              // Session 仍有效，可能是一次性的网络抖动导致的误发，不清除状态
              return;
            }
          } catch {
            // getSession 本身也失败，说明网络完全断了，暂不清除状态，等网络恢复
            return;
          }
          // Session 确实消失了（真正过期），清除状态
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id, session.user);
        else { setProfile(null); setLoading(false); }
      }
    );
    return () => { subscription.unsubscribe(); clearTimeout(loadingTimer); };
  }, []);

  /**
   * 获取用户 profile，带重试机制
   * - 数据库 Trigger 在用户注册时自动创建 profile（随机昵称）
   * - 前端需要等待 Trigger 完成，避免竞态条件
   * @param {string} userId
   * @param {object} userData - 可选的 user metadata
   * @param {number} retries - 重试次数（等待 Trigger 完成）
   */
  const fetchProfile = async (userId, userData = null, retries = 3) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 如果查询失败但不是 "not found"，直接设置 profile 为 null
    if (error && error.code !== 'PGRST116') {
      console.warn('[AuthContext] fetchProfile error:', error.message);
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!data && retries > 0) {
      // Trigger 可能还没执行完，等待后重试
      await new Promise(r => setTimeout(r, 500));
      return fetchProfile(userId, userData, retries - 1);
    }

    if (!data) {
      // 重试后仍无数据，说明是 Google OAuth 首次登录，需手动创建 profile
      const meta = userData?.user_metadata || {};
      const nickname = meta.full_name || meta.name || userData?.email?.split('@')[0] || 'User';
      const avatar_url = meta.avatar_url || meta.picture || null;
      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, nickname, avatar_url, bio: '', post_count: 0 })
        .select()
        .single();
      if (insertError) {
        console.warn('[AuthContext] profile insert error:', insertError.message);
        // 可能是 UNIQUE 冲突（Trigger 刚创建完），再查一次
        const { data: retry, error: retryError } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (retryError) {
          console.warn('[AuthContext] profile retry fetch error:', retryError.message);
        }
        setProfile(retry || null);
      } else {
        setProfile(created);
      }
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  // ── Auth 方法 ─────────────────────────────────────────────

  const signInWithEmail = async (email, password) => {
    if (MOCK_MODE) {
      // Mock 登录：直接设置用户
      const mockU = { id: 'mock-uid', email };
      const mockP = { id: 'mock-uid', nickname: 'River_2847', avatar_url: null, bio: '', post_count: 0 };
      setUser(mockU);
      setProfile(mockP);
      return { error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUpWithEmail = async (email, password, nickname) => {
    if (MOCK_MODE) {
      const mockU = { id: 'mock-uid', email };
      const mockP = { id: 'mock-uid', nickname: 'River_2847', avatar_url: null, bio: '', post_count: 0 };
      setUser(mockU);
      setProfile(mockP);
      return { error: null, needsVerification: false };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });
    return { data, error, needsVerification: !error };
  };

  const signInWithGoogle = async () => {
    if (MOCK_MODE) return { error: new Error('Google 登录需要真实 Supabase 环境') };
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
  };

  const signOut = async () => {
    if (MOCK_MODE) { setUser(null); setProfile(null); return; }
    // 立即清除 React 状态，不等待网络（解决中国网络慢导致退出卡住的问题）
    // 设置 flag 让 onAuthStateChange 忽略由此触发的 SIGNED_OUT 事件
    isSigningOutRef.current = true;
    setUser(null);
    setProfile(null);
    // 后台清除本地 session 和服务器端 token
    supabase.auth.signOut({ scope: 'local' }).catch(err => console.warn('[AuthContext] signOut local error:', err));
    supabase.auth.signOut({ scope: 'global' }).catch(err => console.warn('[AuthContext] signOut global error:', err));
  };

  const uploadAvatar = async (file) => {
    if (MOCK_MODE) return { url: null, error: new Error('Mock mode') };
    if (!user?.id) return { url: null, error: { message: '未登录，请先登录' } };
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(path, file, { upsert: true });
      if (uploadError) return { url: null, error: uploadError };
      const { data } = supabase.storage.from('avatar').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();
      if (!updateError) setProfile(prev => ({ ...prev, avatar_url: url }));
      return { url, error: updateError };
    } catch (err) {
      console.error('[AuthContext] uploadAvatar unexpected error:', err);
      return { url: null, error: { message: err.message || '上传失败，请稍后重试' } };
    }
  };

  const updateProfile = async (updates) => {
    if (MOCK_MODE) {
      setProfile(prev => ({ ...prev, ...updates }));
      return { error: null };
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();
      // 使用服务器返回的完整数据，确保与数据库同步
      if (!error && data) {
        setProfile(data);
      } else if (error) {
        console.warn('[AuthContext] updateProfile error:', error.message);
      }
      return { error };
    } catch (err) {
      console.error('[AuthContext] updateProfile unexpected error:', err);
      return { error: { message: err.message || '网络错误，请稍后重试' } };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signInWithEmail, signUpWithEmail, signInWithGoogle,
      signOut, updateProfile, uploadAvatar,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
