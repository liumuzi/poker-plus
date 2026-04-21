import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { MOCK_MODE, supabase } from '../lib/supabase';

// ── Mock 用户（MOCK_MODE = true 时使用）──────────────────────
const MOCK_USER = null; // null = 未登录；改为对象模拟已登录状态

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  // tokenReady: true 一旦 getSession() 返回（token 已验证/刷新/清除）
  // 用于让数据请求知道「现在的 token 状态是干净的，可以安全发请求了」
  const [tokenReady, setTokenReady] = useState(false);
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
      setTokenReady(true);
      setLoading(false);
      return;
    }

    // 真实模式：监听 Supabase Auth 状态
    // 安全超时：20s 后仅解除 loading（spinner 消失），但 tokenReady 不在此设置
    // tokenReady 只由 getSession() 真正完成后设置，确保 token 一定是刷新后的新鲜值
    const loadingTimer = setTimeout(() => setLoading(false), 20000);

    // getSession() 会自动刷新过期的 token，返回时 token 一定是新鲜可用的
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(loadingTimer);
        setUser(session?.user ?? null);
        setTokenReady(true); // token 已刷新且有效，数据请求现在可以安全发出
        if (session?.user) fetchProfile(session.user.id, session.user);
        else setLoading(false);
      })
      .catch(() => {
        // getSession 完全失败（网络断），解除 loading 让 UI 继续
        clearTimeout(loadingTimer);
        setTokenReady(true);
        setLoading(false);
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
          try {
            const { data: { session: current } } = await supabase.auth.getSession();
            if (current?.user) return; // session 仍有效，误发事件，忽略
          } catch {
            return; // 网络断，暂不清除状态
          }
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // INITIAL_SESSION：订阅创建时立刻触发，此时 token 可能还未刷新（stale）
        // 只更新 user 状态，profile fetch 由上方 getSession().then() 负责（用新鲜 token）
        if (event === 'INITIAL_SESSION') {
          setUser(session?.user ?? null);
          if (!session?.user) {
            // 无用户的情况，提前解锁 loading（getSession 也会处理，但可以更快）
            clearTimeout(loadingTimer);
            setTokenReady(true);
            setLoading(false);
          }
          return;
        }

        // SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED：token 是新鲜的，可以安全 fetch profile
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
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // JWT 错误：token 可能刚刚在刷新中，等 3s 后重试一次
      if (error && (error.code === 'PGRST301' || error.message?.toLowerCase().includes('jwt'))) {
        console.warn('[AuthContext] fetchProfile JWT error, retrying in 3s...');
        await new Promise(r => setTimeout(r, 3000));
        ({ data, error } = await supabase.from('profiles').select('*').eq('id', userId).single());
      }

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
    } catch (err) {
      // 网络超时或其他异常：profile 设为 null，但保留 user（已通过 auth）
      console.warn('[AuthContext] fetchProfile threw:', err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
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
    isSigningOutRef.current = true;
    // 立即清除 React 状态
    setUser(null);
    setProfile(null);
    // 直接清除 localStorage 里的 Supabase session（同步，立刻生效）
    // 避免异步 signOut 还没执行完用户就刷新页面导致 session 复活
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k));
    } catch { /* 忽略 */ }
    // 后台通知服务器撤销 token（不等待，不阻塞 UI）
    supabase.auth.signOut({ scope: 'local' }).catch(err => console.warn('[AuthContext] signOut error:', err));
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
      user, profile, loading, tokenReady,
      signInWithEmail, signUpWithEmail, signInWithGoogle,
      signOut, updateProfile, uploadAvatar,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
