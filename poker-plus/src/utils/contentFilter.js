// ── 内容关键词过滤 ───────────────────────────────────────────
// 三层防护的第一层：前端快速阻断

const BLOCKED_KEYWORDS = [
  // A类 - 赌博招募 / 私局
  '私局', '地下局', '真钱局', '实钱局', '线下赌局',
  '约局', '组局', '拉人', '招人', '缺人',
  // A类 - 联系方式引流
  '加我微信', '加v', '加V', '加微', 'vx号', 'wx号',
  'telegram', 'tg号', '电报', '飞机号', '纸飞机',
  '私信我', '私我', '联系我',
  // A类 - 金融诱导
  '稳赢', '包赚', '保赚', '稳定收益', '躺赚',
  '首充返水', '充值返利', '下载注册',
  '坐几千', '坐一万', '带多少钱', '带够钱',
  '大额局', '高额局', '豪局',
  // B类 - 赌博平台
  '博彩', '赌博网站', '博彩平台', '在线赌场',
  '老虎机', '百家乐', '龙虎', '炸金花', '牛牛',
  '彩票', '时时彩', '北京赛车',
  '代打', '职业代打',
];

// 白名单：正常 poker 术语，匹配后从文本移除再检测
const WHITELIST = [
  'home game', 'cash game 分析', '现金局复盘', '现金局分析',
  '复盘', 'gto', 'ev', '期望值', 'equity',
  '玩牌', '打牌', '德州', '德州扑克', 'poker',
  '翻牌', '转牌', '河牌', '底牌',
  '买入', '筹码', '下注', 'range', 'hand',
];

/**
 * 检查文本是否包含违规内容
 * @param {string} text
 * @returns {{ isClean: boolean, blockedWords: string[], message: string|null }}
 */
export function checkContent(text) {
  if (!text || typeof text !== 'string') return { isClean: true, blockedWords: [], message: null };

  const lower = text.toLowerCase();

  // 1. 先移除白名单词，避免误判（如「现金局复盘」被「现金局」命中）
  let sanitized = lower;
  for (const w of WHITELIST) {
    sanitized = sanitized.split(w).join('');
  }

  // 2. 检测封锁词
  const found = BLOCKED_KEYWORDS.filter(kw => sanitized.includes(kw.toLowerCase()));

  return {
    isClean: found.length === 0,
    blockedWords: found,
    message: found.length > 0
      ? '您的内容包含违规词汇，无法发布。Poker+ 是技术讨论社区，不支持赌博招募等内容。'
      : null,
  };
}

/**
 * 同时检查标题和正文
 */
export function checkPost({ title = '', body = '' }) {
  const t = checkContent(title);
  if (!t.isClean) return t;
  return checkContent(body);
}
