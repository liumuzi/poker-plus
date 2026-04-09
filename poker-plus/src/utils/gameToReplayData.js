/**
 * 将 GameContext 中的对局数据转换为社区帖子的 replay_data 格式，
 * 同时生成外部分享所需的文字摘要。
 */

const SUIT_LABEL = { s: '♠', h: '♥', d: '♦', c: '♣' };

function cardLabel(card) {
  if (!card) return '?';
  return `${card.rank}${SUIT_LABEL[card.suit] || card.suit}`;
}

function cardsLabel(cards) {
  return (cards || []).filter(Boolean).map(cardLabel).join(' ');
}

/** 将筹码额转换为 BB 数（保留1位小数） */
function toBB(chips, bb) {
  if (!bb || bb === 0) return chips;
  return Math.round((chips / bb) * 10) / 10;
}

/**
 * 从 history 按街道提取完整行动数据（用于可视化路线图）
 * 返回 [{ name, startPot, boardCards, actions: [{player, isHero, action}] }]
 */
function extractStreetsDetailed(history, players) {
  const streets = [];
  let current = null;
  let rollingPot = 0;
  const boardBuf = [];

  const flush = () => {
    if (current) {
      streets.push({ ...current, boardCards: [...boardBuf] });
      current = null;
    }
  };

  history.forEach(h => {
    if (h.isDivider) {
      if (h.text?.includes('结算')) { flush(); return; }
      flush();
      let name = '翻牌前';
      if (h.text?.includes('Flop'))  name = '翻牌';
      else if (h.text?.includes('Turn'))  name = '转牌';
      else if (h.text?.includes('River')) name = '河牌';
      if (h.cards?.length) boardBuf.push(...h.cards);
      current = { name, startPot: rollingPot, actions: [] };
    } else if (h.action && !h.isWinLog) {
      if (!current) current = { name: '盲注(前注)', startPot: 0, actions: [] };
      const isHero = h.isHero === true || players.some(p => p.name === h.player && p.isHero);
      current.actions.push({ player: h.player || '', isHero, action: h.action });
      if (typeof h.pot === 'number') rollingPot = h.pot;
    }
  });
  flush();

  return streets;
}

/**
 * 从 history 按街道提取行动摘要
 * 返回 [{ street, desc }]
 */
function extractStreetActions(history) {
  const STREET_MAP = {
    'Flop': '翻牌',
    'Turn': '转牌',
    'River': '河牌',
    '翻牌前': '翻牌前',
  };

  const streets = [];
  let current = null;
  const actionBuf = [];

  const flushStreet = () => {
    if (current && actionBuf.length > 0) {
      streets.push({ street: current, desc: actionBuf.join(' → ') });
      actionBuf.length = 0;
    }
  };

  history.forEach(h => {
    if (h.isDivider) {
      if (h.text?.includes('结算')) return;
      flushStreet();
      const label =
        STREET_MAP[Object.keys(STREET_MAP).find(k => h.text?.includes(k))] || h.text;
      current = label || '翻牌前';
    } else if (!h.isWinLog && h.action) {
      // e.g. "Raise 120" / "Call 60" / "Fold" / "Check"
      const parts = h.action.split(' ');
      const verb = parts[0];
      const amount = parts[1] ? ` ${parts[1]}` : '';
      actionBuf.push(`${verb}${amount}`);
    }
  });
  flushStreet();

  // Remove 翻牌前 from display if too noisy
  return streets.filter(s => s.street !== '翻牌前' || streets.length === 1);
}

/**
 * 主函数：将 GameContext state 转换为分享数据
 *
 * @param {object} state - 包含 GameContext 所有字段
 * @returns {{ replayData, shareTitle, shareText }}
 */
export function gameToShareData(state) {
  const {
    heroCards = [],
    communityCards = [],
    players = [],
    sbAmount = 1,
    bbAmount = 2,
    potSize = 0,
    history = [],
    gameNotes = '',
  } = state;

  const hero = players.find(p => p.isHero);
  const heroInvested = Number(hero?.totalInvested || 0);

  // 计算 hero 盈亏（从 history winLog 推断）
  let heroWon = false;
  let winnerCount = 1;
  const winLog = history.find(h => h.isWinLog && typeof h.action === 'string');
  if (winLog?.action) {
    const head = winLog.action.split(' 赢下底池')[0];
    const names = head.split(' & ').map(s => s.trim()).filter(Boolean);
    winnerCount = names.length;
    heroWon = names.includes(hero?.name || '');
  }
  const wonShare = heroWon && winnerCount > 0 ? potSize / winnerCount : 0;
  const netChips = wonShare - heroInvested;
  const netBB = toBB(Math.abs(netChips), bbAmount);
  const resultStr = netChips >= 0 ? `+${netBB}bb` : `-${netBB}bb`;

  // 有效筹码（取最小 stack）
  const validStacks = players.map(p => p.stackSize).filter(s => s > 0);
  const effectiveStack = validStacks.length > 0
    ? toBB(Math.min(...validStacks), bbAmount)
    : null;

  // 公共牌（最终所有出现的）
  const boardCards = [...communityCards].filter(Boolean);

  // 街道行动（文字摘要 + 详细可视化）
  const actions = extractStreetActions(history);
  const streets = extractStreetsDetailed(history, players);

  // ── replay_data (for community post) ─────────────────────────
  // savedGame: full data for animation player (no gameNotes — personal note stays private)
  const savedGameData = {
    history,
    players,
    communityCards: boardCards,
    sbAmount,
    bbAmount,
    playerCount: players.length,
    heroIndex: players.findIndex(p => p.isHero),
    heroCards: heroCards.filter(Boolean),
    playerNames: Object.fromEntries(players.map(p => [p.id, p.name])),
    playerStacks: Object.fromEntries(players.map(p => [p.id, p.stackSize ?? 0])),
  };

  const replayData = {
    heroCards:  heroCards.filter(Boolean),
    boardCards,
    effectiveStack,
    potSize:    toBB(potSize, bbAmount),
    result:     resultStr,
    actions,
    streets,
    savedGame:  savedGameData,
  };

  // ── 外部分享文本 ──────────────────────────────────────────────
  const heroCardStr  = cardsLabel(heroCards);
  const boardCardStr = boardCards.length > 0 ? cardsLabel(boardCards) : '无公共牌';

  const actionLines = actions.map(a => `${a.street}：${a.desc}`).join('\n');

  const shareTitle = `Poker+ 手牌复盘｜${heroCardStr} ${netChips >= 0 ? '盈利' : '亏损'} ${netBB}bb`;

  const shareText = [
    `🃏 手牌复盘`,
    `手牌：${heroCardStr}`,
    `公共牌：${boardCardStr}`,
    effectiveStack ? `有效筹码：${effectiveStack}bb` : null,
    `底池：${toBB(potSize, bbAmount)}bb`,
    `结果：${resultStr}`,
    '',
    actionLines || null,
    gameNotes ? `\n备注：${gameNotes}` : null,
    '',
    '—— 由 Poker+ 生成',
  ].filter(l => l !== null).join('\n');

  return { replayData, shareTitle, shareText };
}
