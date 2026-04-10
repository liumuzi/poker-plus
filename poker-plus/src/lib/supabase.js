import { createClient } from '@supabase/supabase-js';

export const MOCK_MODE = false;

// 优先使用运行时注入的环境变量（window.__ENV__），占位符视为无效，fallback 到构建时变量
const runtimeUrl = window.__ENV__?.VITE_SUPABASE_URL;
const runtimeKey = window.__ENV__?.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = (runtimeUrl && !runtimeUrl.includes('RUNTIME_INJECTION')) ? runtimeUrl : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (runtimeKey && !runtimeKey.includes('RUNTIME_INJECTION')) ? runtimeKey : import.meta.env.VITE_SUPABASE_ANON_KEY;

// 带 15s 超时的 fetch，防止弱网/GFW 环境下请求永久 pending
function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15000);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(tid));
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    global: { fetch: fetchWithTimeout },
  }
);
