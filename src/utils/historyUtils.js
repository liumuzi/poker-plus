/**
 * 将 history 数组分组为街道（街道分组算法）
 * @param {Array} history - 游戏历史记录
 * @returns {{ streets: Array, rollingPot: number }} 分组后的街道数组和最终滚动底池
 */
export function groupHistoryByStreet(history) {
  let rollingPot = 0;
  const streets = [];
  let currentStreet = null;

  history.forEach((h) => {
    if (h.isDivider) {
      if (!h.text.includes('结算')) {
        if (currentStreet) streets.push(currentStreet);
        let nName = '翻牌前';
        if (h.text.includes('Flop')) nName = '翻牌';
        if (h.text.includes('Turn')) nName = '转牌';
        if (h.text.includes('River')) nName = '河牌';
        currentStreet = { name: nName, startPot: rollingPot, actions: [], cards: h.cards || [] };
      } else {
        if (currentStreet) streets.push(currentStreet);
        currentStreet = { name: '比牌', startPot: rollingPot, actions: [], cards: [] };
      }
    } else {
      if (!currentStreet) {
        currentStreet = { name: '盲注(前注)', startPot: 0, actions: [], cards: [] };
      }
      currentStreet.actions.push(h);
      if (!h.isWinLog && typeof h.pot === 'number') {
        rollingPot = h.pot;
      }
    }
  });
  if (currentStreet && (currentStreet.actions.length > 0 || currentStreet.name === '比牌')) {
    streets.push(currentStreet);
  }

  return { streets, rollingPot };
}

/**
 * 为各街道添加累计公共牌显示
 * @param {Array} streets - 街道数组
 * @returns {Array} 带有 boardCards 属性的街道数组
 */
export function addCumulativeBoardCards(streets) {
  const board = [];
  return streets.map((street) => {
    if (street.cards && street.cards.length > 0) {
      board.push(...street.cards);
    }
    return { ...street, boardCards: [...board] };
  });
}

/**
 * 从 win log 中解析赢家名称列表
 * @param {Array} history - 游戏历史记录
 * @returns {string[]} 赢家名称数组
 */
export function parseWinnerNames(history) {
  const winLog = history?.find((h) => h.isWinLog && typeof h.action === 'string');
  if (!winLog?.action) return [];
  const head = winLog.action.split(' 赢下底池')[0];
  return head.split(' & ').map((s) => s.trim()).filter(Boolean);
}

/**
 * 计算 Hero 的对局摘要（盈亏等）
 * @param {Object} params
 * @param {Object} params.hero - Hero 玩家对象
 * @param {string} params.heroName - Hero 名称
 * @param {number} params.heroInvested - Hero 总投入
 * @param {boolean} params.isViewingSave - 是否在查看存档
 * @param {Array} params.winners - 赢家ID数组
 * @param {Array} params.history - 游戏历史记录
 * @param {number} params.potSize - 底池大小
 * @returns {{ wonShare: number, net: number, resultText: string }}
 */
export function calculateHeroSummary({ hero, heroName, heroInvested, isViewingSave, winners, history, potSize }) {
  if (!hero) return { wonShare: 0, net: 0, resultText: '未识别 Hero' };

  let winnerCount = 0;
  let heroWon = false;

  if (!isViewingSave && winners.length > 0) {
    winnerCount = winners.length;
    heroWon = winners.includes(hero.id);
  } else {
    const winnerNames = parseWinnerNames(history);
    winnerCount = winnerNames.length;
    heroWon = winnerNames.includes(heroName);
  }

  const wonShare = heroWon && winnerCount > 0 ? potSize / winnerCount : 0;
  const net = wonShare - heroInvested;
  const resultText = net > 0 ? '盈利' : (net < 0 ? '亏损' : '持平');
  return { wonShare, net, resultText };
}

/**
 * 计算游戏存档摘要（用于首页列表展示）
 * @param {Object} game - 存档的游戏数据
 * @returns {{ net: number, community: Array, heroCards: Array }}
 */
export function getGameSummary(game) {
  const hero = game.players?.find((p) => p.isHero);
  const heroName = hero?.name || '';
  const heroInvested = Number(hero?.totalInvested || 0);
  const community = Array.isArray(game.communityCards) ? game.communityCards : [];

  const winnerNames = parseWinnerNames(game.history);
  const heroWon = winnerNames.includes(heroName);
  const winnerCount = winnerNames.length;
  const wonShare = heroWon && winnerCount > 0 ? Number(game.potSize || 0) / winnerCount : 0;
  const net = wonShare - heroInvested;
  const heroCards = game.heroCards || (hero && hero.knownCards) || [];

  return { net, community, heroCards };
}

/**
 * 同步更新历史记录中的玩家名称
 * @param {Array} history - 游戏历史记录
 * @param {string} oldName - 旧名称
 * @param {string} newName - 新名称
 * @returns {Array} 更新后的历史记录
 */
export function updatePlayerNameInHistory(history, oldName, newName) {
  if (!oldName || oldName === newName) return history;

  return history.map((h) => {
    if (!h.isDivider && !h.isWinLog && h.player === oldName) {
      return { ...h, player: newName };
    }
    if (h.isWinLog && typeof h.action === 'string' && h.action.includes(oldName)) {
      // 精确替换赢家日志中的玩家名称（格式: "Name1 & Name2 赢下底池: 100"）
      const parts = h.action.split(' 赢下底池');
      if (parts.length >= 2) {
        const names = parts[0].split(' & ').map(n => n.trim() === oldName ? newName : n);
        return { ...h, action: names.join(' & ') + ' 赢下底池' + parts.slice(1).join(' 赢下底池') };
      }
    }
    return h;
  });
}
