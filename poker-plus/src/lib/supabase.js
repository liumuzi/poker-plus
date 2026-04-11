import { createClient } from '@supabase/supabase-js';

export const MOCK_MODE = false;

// 优先使用运行时注入的环境变量（window.__ENV__），占位符视为无效，fallback 到构建时变量
const runtimeUrl = window.__ENV__?.VITE_SUPABASE_URL;
const runtimeKey = window.__ENV__?.VITE_SUPABASE_ANON_KEY;

// 直连 Supabase URL（用于诊断和 fallback）
const directUrl = (runtimeUrl && !runtimeUrl.includes('RUNTIME_INJECTION')) ? runtimeUrl : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (runtimeKey && !runtimeKey.includes('RUNTIME_INJECTION')) ? runtimeKey : import.meta.env.VITE_SUPABASE_ANON_KEY;

// 反向代理自动检测：如果 window.__ENV__ 存在且包含 Supabase URL，说明运行在 Docker 中
// 自动启用 nginx 反向代理，避免中国用户直连 Supabase 被 GFW 封锁/限速
// 浏览器 → 用户服务器(nginx /supabase-proxy/) → Supabase
const proxyBaseUrl = (window.__ENV__?.VITE_SUPABASE_URL && directUrl)
  ? `${window.location.origin}/supabase-proxy`
  : null;
const supabaseUrl = proxyBaseUrl || directUrl;

// 配置诊断日志（帮助排查服务器部署问题）
if (!directUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] ❌ 缺少必需的配置！请检查环境变量。\n' +
    `  运行时注入 (window.__ENV__): URL=${runtimeUrl ? '已设置' : '(空)'}, KEY=${runtimeKey ? '已设置' : '(空)'}\n` +
    `  构建时变量 (import.meta.env): URL=${import.meta.env.VITE_SUPABASE_URL ? '已设置' : '(空)'}, KEY=${import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '(空)'}\n` +
    '  解决方案：确保 Docker 启动时设置了 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量'
  );
} else {
  console.info(`[Supabase] ✅ 配置已加载${proxyBaseUrl ? '（通过反向代理）' : '（直连）'}`);
  if (proxyBaseUrl) {
    console.info(`[Supabase]    代理: ${proxyBaseUrl}`);
    console.info(`[Supabase]    直连回退: ${directUrl}`);
  }
}

// Supabase 配置缺失标记（供其他模块检查）
export const SUPABASE_CONFIGURED = !!(directUrl && supabaseAnonKey);

/**
 * 带超时 + 代理→直连自动回退的 fetch 包装器
 *
 * 策略：
 * 1. 如果启用了代理，先尝试代理请求（8s 超时）
 * 2. 如果代理失败（超时/5xx/404/网络错误），自动回退到直连（15s 超时）
 * 3. 如果没有代理，直接请求（15s 超时）
 *
 * 这样即使 nginx 代理未配置或代理挂了，也能自动回退到直连
 */
function fetchWithSmartFallback(url, options = {}) {
  const PROXY_TIMEOUT = 8000;
  const DIRECT_TIMEOUT = 15000;

  /**
   * 使用 Promise.race 保证超时可靠触发
   * 某些浏览器环境下 AbortController.abort() 后 fetch() 不会立即 reject，
   * 导致 .catch 不执行、回退逻辑被跳过。Promise.race 确保超时后立即 reject。
   */
  const makeTimedFetch = (reqUrl, timeoutMs) => {
    const controller = new AbortController();
    // 转发调用方的 abort signal
    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort(options.signal.reason);
      } else {
        options.signal.addEventListener(
          'abort',
          () => controller.abort(options.signal.reason),
          { once: true }
        );
      }
    }
    let tid;
    const timeoutPromise = new Promise((_, reject) => {
      tid = setTimeout(() => {
        controller.abort();
        reject(new DOMException('Request timed out', 'AbortError'));
      }, timeoutMs);
    });
    const fetchPromise = fetch(reqUrl, { ...options, signal: controller.signal });
    // 防止超时胜出后 fetch 的 rejection 成为 unhandled rejection
    fetchPromise.catch(() => {});
    return Promise.race([fetchPromise, timeoutPromise])
      .finally(() => clearTimeout(tid));
  };

  // 如果当前请求走代理，先试代理 → 再试直连
  if (proxyBaseUrl && directUrl && url.startsWith(proxyBaseUrl)) {
    const t0 = Date.now();
    return makeTimedFetch(url, PROXY_TIMEOUT)
      .then(res => {
        // 代理配置错误或上游不可达：404/502/503/504 → 回退直连
        if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 404) {
          console.warn(`[Supabase] 代理返回 ${res.status}（${Date.now() - t0}ms），回退到直连...`);
          const directRequestUrl = url.replace(proxyBaseUrl, directUrl);
          return makeTimedFetch(directRequestUrl, DIRECT_TIMEOUT);
        }
        return res;
      })
      .catch(proxyErr => {
        // 代理超时或网络错误，回退到直连
        console.warn(`[Supabase] 代理失败(${proxyErr.name}: ${proxyErr.message}，${Date.now() - t0}ms)，回退到直连...`);
        const directRequestUrl = url.replace(proxyBaseUrl, directUrl);
        return makeTimedFetch(directRequestUrl, DIRECT_TIMEOUT);
      });
  }

  // 无代理，直接请求
  return makeTimedFetch(url, DIRECT_TIMEOUT);
}

/**
 * 给任意 Supabase 查询加上超时保护
 * 防止 Supabase client 内部 Promise 链吞掉 AbortError 导致永远 pending
 * 超时设为 30s，以容纳代理（8s）+ 直连回退（15s）的总时间
 */
export function withTimeout(supabaseQuery, timeoutMs = 30000) {
  return Promise.race([
    supabaseQuery,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('请求超时，请检查网络后重试')), timeoutMs)
    ),
  ]);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    global: { fetch: fetchWithSmartFallback },
  }
);
