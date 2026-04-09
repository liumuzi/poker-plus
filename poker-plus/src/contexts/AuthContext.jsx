import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_MODE, supabase } from '../lib/supabase';

// ── Mock 用户（MOCK_MODE = true 时使用）──────────────────────
const MOCK_USER = null; // null = 未登录；改为对象模拟已登录状态

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
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
      options: { redirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    if (MOCK_MODE) { setUser(null); setProfile(null); return; }
    await supabase.auth.signOut();
  };

  const uploadAvatar = async (file) => {
    if (MOCK_MODE) return { url: null, error: new Error('Mock mode') };
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
  };

  const updateProfile = async (updates) => {
    if (MOCK_MODE) {
      setProfile(prev => ({ ...prev, ...updates }));
      return { error: null };
    }
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (!error) setProfile(prev => ({ ...prev, ...updates }));
    return { error };
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
