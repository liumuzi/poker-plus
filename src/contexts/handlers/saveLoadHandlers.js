/**
 * 处理游戏存档加载、结算等 action
 */

export function handleToggleWinner(state, action) {
  const id = action.payload.playerId;
  const winners = state.winners.includes(id)
    ? state.winners.filter((w) => w !== id)
    : [...state.winners, id];
  return { ...state, winners };
}

export function handleFinishHand(state) {
  if (state.winners.length > 0) {
    const winnerNames = state.winners
      .map((wid) => state.players.find((p) => p.id === wid)?.name)
      .join(' & ');
    const newHistory = [
      ...state.history,
      { isDivider: true, text: '--- 结算 (Showdown / Fold) ---', cards: [] },
      {
        player: '👑',
        action: `${winnerNames} 赢下底池: ${state.potSize}`,
        pot: state.potSize,
        isWinLog: true,
      },
    ];
    return { ...state, history: newHistory, stage: 'summary' };
  }
  return { ...state, stage: 'summary' };
}

export function handleLoadSavedGame(state, action) {
  const game = action.payload.game;
  const fallbackHeroIndex = Array.isArray(game.players)
    ? game.players.findIndex((p) => p.isHero)
    : -1;
  return {
    ...state,
    playerCount: game.playerCount ?? state.playerCount,
    heroIndex: game.heroIndex ?? (fallbackHeroIndex >= 0 ? fallbackHeroIndex : state.heroIndex),
    heroCards: game.heroCards ?? state.heroCards,
    sbAmount: game.sbAmount ?? state.sbAmount,
    bbAmount: game.bbAmount ?? state.bbAmount,
    potSize: game.potSize,
    history: game.history,
    players: game.players,
    communityCards: game.communityCards || [],
    winners: [],
    isViewingSave: true,
    stage: 'summary',
    // V2 字段
    isV2Mode: game.isV2Mode ?? false,
    playerNames: game.playerNames ?? {},
    playerStacks: game.playerStacks ?? {},
    gameNotes: game.gameNotes ?? '',
  };
}

export function handleLoadTestCase(state, action) {
  return {
    ...state,
    ...action.payload,
    isViewingSave: true,
    stage: 'summary',
  };
}
