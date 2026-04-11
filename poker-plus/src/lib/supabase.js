import { createClient } from '@supabase/supabase-js';

export const MOCK_MODE = false;

// 优先使用运行时注入的环境变量（window.__ENV__），占位符视为无效，fallback 到构建时变量
const runtimeUrl = window.__ENV__?.VITE_SUPABASE_URL;
const runtimeKey = window.__ENV__?.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = (runtimeUrl && !runtimeUrl.includes('RUNTIME_INJECTION')) ? runtimeUrl : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (runtimeKey && !runtimeKey.includes('RUNTIME_INJECTION')) ? runtimeKey : import.meta.env.VITE_SUPABASE_ANON_KEY;

// 配置诊断日志（帮助排查服务器部署问题）
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] ❌ 缺少必需的配置！请检查环境变量。\n' +
    `  运行时注入 (window.__ENV__): URL=${runtimeUrl ? '已设置' : '(空)'}, KEY=${runtimeKey ? '已设置' : '(空)'}\n` +
    `  构建时变量 (import.meta.env): URL=${import.meta.env.VITE_SUPABASE_URL ? '已设置' : '(空)'}, KEY=${import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '(空)'}\n` +
    '  解决方案：确保 Docker 启动时设置了 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量'
  );
} else {
  console.info('[Supabase] ✅ 配置已加载');
}

// Supabase 配置缺失标记（供其他模块检查）
export const SUPABASE_CONFIGURED = !!(supabaseUrl && supabaseAnonKey);

// 带 15s 超时的 fetch，防止弱网/GFW 环境下请求永久 pending
function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15000);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(tid));
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    global: { fetch: fetchWithTimeout },
  }
);
