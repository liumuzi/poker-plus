import { getPositions, ROUND_NAMES } from '../constants/poker';

/**
 * 创建初始玩家列表并处理盲注
 */
export function createInitialPlayers(playerCount, heroIndex, heroCards, sbAmount, bbAmount) {
  const safeCount = Number.isInteger(playerCount) && playerCount >= 2 ? playerCount : 6;
  const positions = getPositions(safeCount);
  const players = positions.map((pos, idx) => ({
    id: idx,
    name: pos,
    folded: false,
    allIn: false,
    betThisRound: 0,
    totalInvested: 0,
    actedThisRound: false,
    isHero: idx === heroIndex,
    knownCards: [null, null],
  }));

  const safeHeroIndex = Math.min(Math.max(0, heroIndex ?? 0), players.length - 1);
  players[safeHeroIndex].knownCards = [...heroCards];

  const bbIdx = safeCount - 1;
  const sbIdx = safeCount - 2;
  if (!players[sbIdx] || !players[bbIdx]) {
    return { players, potSize: 0, highestBet: 0, history: [] };
  }
  players[sbIdx].betThisRound = sbAmount;
  players[sbIdx].totalInvested = sbAmount;
  players[bbIdx].betThisRound = bbAmount;
  players[bbIdx].totalInvested = bbAmount;

  const potSize = sbAmount + bbAmount;
  const history = [
    { player: players[sbIdx].name, action: `小盲 $${sbAmount}`, pot: sbAmount, isHero: players[sbIdx].isHero },
    { player: players[bbIdx].name, action: `大盲 $${bbAmount}`, pot: potSize, isHero: players[bbIdx].isHero },
    { isDivider: true, text: '--- 进入 翻前 (Pre-flop) ---', cards: [] },
  ];

  return { players, potSize, highestBet: bbAmount, history };
}

/**
 * V2: 创建初始玩家列表，不预设盲注
 * 玩家命名为: BTN, 玩家1, 玩家2... Hero
 */
export function createInitialPlayersV2(playerCount, heroIndex, heroCards, customNames = {}) {
  const safeCount = Number.isInteger(playerCount) && playerCount >= 2 ? playerCount : 2;
  
  const players = [];
  for (let idx = 0; idx < safeCount; idx++) {
    let defaultName;
    if (idx === 0) {
      defaultName = 'BTN';
    } else if (idx === heroIndex) {
      defaultName = 'Hero';
    } else {
      defaultName = `玩家${idx}`;
    }
    
    players.push({
      id: idx,
      name: customNames[idx] || defaultName,
      folded: false,
      allIn: false,
      betThisRound: 0,
      totalInvested: 0,
      actedThisRound: false,
      isHero: idx === heroIndex,
      knownCards: [null, null],
      stackSize: 0, // V2新增：后手筹码
    });
  }

  const safeHeroIndex = Math.min(Math.max(0, heroIndex ?? 0), players.length - 1);
  players[safeHeroIndex].knownCards = [...heroCards];
  players[safeHeroIndex].isHero = true;
  players[safeHeroIndex].name = customNames[safeHeroIndex] || 'Hero';

  return { players, potSize: 0, highestBet: 0, history: [] };
}

/**
 * 处理玩家行动（纯函数）
 * @returns 新状态片段，或 null 表示无效操作
 */
export function processAction(players, currentTurn, potSize, highestBet, bettingRound, actionStr, amount) {
  const p = JSON.parse(JSON.stringify(players));
  const curr = p[currentTurn];
  curr.actedThisRound = true;
  let historyLog = '';
  let newPot = potSize;
  let newHighest = highestBet;

  if (actionStr === 'Fold') {
    curr.folded = true;
    historyLog = 'Fold';
  } else if (actionStr === 'Check/Call') {
    const toMatch = highestBet - curr.betThisRound;
    if (toMatch === 0) {
      historyLog = 'Check';
    } else {
      curr.betThisRound += toMatch;
      curr.totalInvested += toMatch;
      newPot += toMatch;
      historyLog = `Call ${toMatch}`;
    }
  } else if (actionStr === 'Bet') {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || highestBet > 0) return null;
    const added = Math.max(0, amt - curr.betThisRound);
    curr.betThisRound = amt;
    curr.totalInvested += added;
    newPot += added;
    newHighest = amt;
    historyLog = `Bet ${amt}`;

    p.forEach((player) => {
      if (player.id !== curr.id && !player.folded && !player.allIn) {
        player.actedThisRound = false;
      }
    });
  } else if (actionStr === 'Raise') {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= highestBet) return null;
    const added = amt - curr.betThisRound;
    curr.betThisRound = amt;
    curr.totalInvested += added;
    newPot += added;
    newHighest = amt;
    historyLog = `Raise to ${amt}`;

    p.forEach((player) => {
      if (player.id !== curr.id && !player.folded && !player.allIn) {
        player.actedThisRound = false;
      }
    });
  } else if (actionStr === 'All-in') {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return null;
    const added = Math.max(0, amt - curr.betThisRound);
    curr.betThisRound = amt;
    curr.totalInvested += added;
    newPot += added;
    curr.allIn = true;
    historyLog = `All-in ${amt}`;

    if (amt > highestBet) {
      newHighest = amt;
      p.forEach((player) => {
        if (player.id !== curr.id && !player.folded && !player.allIn) {
          player.actedThisRound = false;
        }
      });
    }
  }

  const historyEntry = {
    player: curr.name,
    isHero: curr.isHero,
    action: historyLog,
    round: ROUND_NAMES[bettingRound],
    pot: newPot,
  };

  return { players: p, potSize: newPot, highestBet: newHighest, historyEntry };
}

/**
 * 检查当前轮次是否结束
 * @returns {{ ended, reason, nextStreet }}
 */
export function checkRoundEnd(players, highestBet, bettingRound) {
  const activePlayers = players.filter((p) => !p.folded && !p.allIn);
  const unresolved = activePlayers.filter(
    (p) => !p.actedThisRound || p.betThisRound < highestBet
  );

  if (unresolved.length > 0) {
    return { ended: false, reason: null, nextStreet: null };
  }

  const standingCount = activePlayers.length + players.filter((p) => p.allIn && !p.folded).length;

  if (standingCount <= 1) {
    return { ended: true, reason: 'resolution', nextStreet: null };
  }

  if (bettingRound === 3) {
    return { ended: true, reason: 'resolution', nextStreet: null };
  }

  const streetMap = { 0: 'flop', 1: 'turn', 2: 'river' };
  return { ended: true, reason: 'next_street', nextStreet: streetMap[bettingRound] || null };
}

/**
 * 找到下一个需要行动的玩家索引
 * @returns 玩家索引，或 null 表示无人可行动
 */
export function findNextActor(currentIdx, players) {
  let nextIdx = (currentIdx + 1) % players.length;
  let loopCount = 0;
  while ((players[nextIdx].folded || players[nextIdx].allIn) && loopCount < players.length) {
    nextIdx = (nextIdx + 1) % players.length;
    loopCount++;
  }
  if (loopCount >= players.length) return null;
  return nextIdx;
}

/**
 * 过渡到下一条街（纯函数）
 * @returns 新状态片段 + nextAction 指示后续操作
 */
export function transitionToNextStreet(
  players,
  communityCards,
  bettingRound,
  potSize,
  cardsAdded,
  playerCount
) {
  const nextRound = bettingRound + 1;
  const newCommunityCards = [...communityCards, ...cardsAdded];
  const p = JSON.parse(JSON.stringify(players));

  p.forEach((player) => {
    player.betThisRound = 0;
    if (!player.folded && !player.allIn) player.actedThisRound = false;
  });

  const historyEntry = {
    isDivider: true,
    text: `--- 进入 ${ROUND_NAMES[nextRound]} ---`,
    cards: cardsAdded,
  };

  const activeCount = p.filter((pl) => !pl.folded && !pl.allIn).length;
  const standingCount = p.filter((pl) => !pl.folded).length;

  // 只剩1人或已到 showdown，直接结算
  if (standingCount <= 1 || nextRound >= 4) {
    return {
      players: p,
      communityCards: newCommunityCards,
      bettingRound: nextRound,
      highestBet: 0,
      historyEntry,
      nextAction: { type: 'resolution' },
    };
  }

  // 所有人 All-in，无人可行动 → 直接进入下一发牌
  if (activeCount === 0) {
    let pickTarget = null;
    if (nextRound === 1) pickTarget = 'turn';
    else if (nextRound === 2) pickTarget = 'river';

    return {
      players: p,
      communityCards: newCommunityCards,
      bettingRound: nextRound,
      highestBet: 0,
      historyEntry,
      nextAction: pickTarget ? { type: 'pick_cards', target: pickTarget } : { type: 'resolution' },
    };
  }

  // 正常：翻后从第一个位置开始搜索第一个可行动玩家（跳过 folded 和 all-in 玩家）
  // 修复 Bug #7：使用 -1 作为起始位置，因为 findNextActor 函数会做 (currentIdx + 1) % length，
  // 所以传入 -1 会使得搜索从位置 0 开始，确保能找到第一个可以行动的玩家，
  // 而不是从原来的 playerCount-3 位置开始（那样可能会跳过前面的可行动玩家）
  const nextActor = findNextActor(-1, p);

  return {
    players: p,
    communityCards: newCommunityCards,
    bettingRound: nextRound,
    highestBet: 0,
    historyEntry,
    nextAction: nextActor !== null
      ? { type: 'continue', nextTurn: nextActor }
      : { type: 'resolution' },
  };
}
