import { createClient } from '@supabase/supabase-js';

export const MOCK_MODE = false;

// 优先使用运行时注入的环境变量（window.__ENV__），占位符视为无效，fallback 到构建时变量
const runtimeUrl = window.__ENV__?.VITE_SUPABASE_URL;
const runtimeKey = window.__ENV__?.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = (runtimeUrl && !runtimeUrl.includes('RUNTIME_INJECTION')) ? runtimeUrl : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (runtimeKey && !runtimeKey.includes('RUNTIME_INJECTION')) ? runtimeKey : import.meta.env.VITE_SUPABASE_ANON_KEY;

// 带超时的 fetch，防止弱网/GFW 环境下请求永久 pending
// Auth 端点（token 刷新、登录）给 40s；普通数据请求 20s
function fetchWithTimeout(url, options = {}) {
  const isAuthEndpoint = typeof url === 'string' && url.includes('/auth/v1/');
  const timeout = isAuthEndpoint ? 40000 : 20000;

  const controller = new AbortController();
  // 如果调用方已传入 signal，两者任一中止都取消请求
  const upstream = options.signal;
  if (upstream) {
    if (upstream.aborted) { controller.abort(); }
    else { upstream.addEventListener('abort', () => controller.abort(), { once: true }); }
  }

  const tid = setTimeout(() => controller.abort(), timeout);
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
