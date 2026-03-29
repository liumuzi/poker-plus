import {
  createInitialPlayers,
  createInitialPlayersV2,
} from '../../engine/gameEngine';

/**
 * 处理设置/重置/开始游戏相关的 action
 */

export function handleSetStage(state, action) {
  return { ...state, stage: action.payload.stage };
}

export function handleSetPlayerCount(state, action) {
  return {
    ...state,
    playerCount: action.payload.count,
    heroIndex: action.payload.count - 1,
  };
}

export function handleSetPlayerCountV2(state, action) {
  return {
    ...state,
    playerCount: action.payload.count,
    heroIndex: state.heroIndex >= action.payload.count ? 0 : state.heroIndex,
    isV2Mode: true,
  };
}

export function handleSetBlinds(state, action) {
  return {
    ...state,
    sbAmount: action.payload.sb ?? state.sbAmount,
    bbAmount: action.payload.bb ?? state.bbAmount,
  };
}

export function handleSetHeroIndex(state, action) {
  return { ...state, heroIndex: action.payload.index };
}

export function handleResetForNewGame(state) {
  return {
    ...state,
    heroCards: [null, null],
    players: [],
    communityCards: [],
    presetCommunityCards: [],
    tempCards: [],
    history: [],
    historySnapshots: [],
    winners: [],
    isV2Mode: false,
    playerNames: {},
    playerStacks: {},
    gameNotes: '',
    actionStage: 'setup',
    stage: 'setup',
    savedFutureState: null,
  };
}

export function handleResetForNewGameV2(state) {
  return {
    ...state,
    playerCount: 2,
    heroIndex: 0,
    heroCards: [null, null],
    players: [],
    communityCards: [],
    presetCommunityCards: [],
    tempCards: [],
    history: [],
    historySnapshots: [],
    winners: [],
    isV2Mode: true,
    playerNames: {},
    playerStacks: {},
    gameNotes: '',
    actionStage: 'setup',
    stage: 'setupV2',
    savedFutureState: null,
  };
}

export function handleExitToHome(state) {
  return {
    ...state,
    stage: 'home',
    players: [],
    currentTurn: 0,
    history: [],
    historySnapshots: [],
    communityCards: [],
    presetCommunityCards: [],
    bettingRound: 0,
    highestBet: 0,
    potSize: 0,
    winners: [],
    pickingCardsTarget: null,
    tempCards: [],
    isViewingSave: false,
    savedFutureState: null,
  };
}

export function handleRewriteFromCurrentHand(state) {
  const inferredPlayerCount = state.playerCount >= 2
    ? state.playerCount
    : (state.players.length >= 2 ? state.players.length : 6);
  const heroArrayIndex = state.players.findIndex((p) => p.isHero);
  const inferredHeroIndex = heroArrayIndex >= 0 ? heroArrayIndex : state.heroIndex;
  const heroKnownCards = heroArrayIndex >= 0 ? (state.players[heroArrayIndex].knownCards || [null, null]) : [null, null];

  return {
    ...state,
    playerCount: inferredPlayerCount,
    heroIndex: inferredHeroIndex,
    heroCards: [heroKnownCards[0] || null, heroKnownCards[1] || null],
    players: [],
    currentTurn: 0,
    history: [],
    historySnapshots: [],
    communityCards: [],
    presetCommunityCards: [],
    bettingRound: 0,
    highestBet: 0,
    potSize: 0,
    winners: [],
    pickingCardsTarget: null,
    tempCards: [],
    isViewingSave: false,
    stage: 'setup',
  };
}

export function handleStartGame(state) {
  const init = createInitialPlayers(
    state.playerCount,
    state.heroIndex,
    state.heroCards,
    state.sbAmount,
    state.bbAmount
  );
  return {
    ...state,
    isViewingSave: false,
    players: init.players,
    potSize: init.potSize,
    highestBet: init.highestBet,
    bettingRound: 0,
    communityCards: [],
    history: init.history,
    historySnapshots: [],
    winners: [],
    currentTurn: 0,
    stage: 'play',
    actionStage: 'preflop',
    savedFutureState: null,
  };
}

export function handleStartGameV2(state) {
  const init = createInitialPlayersV2(
    state.playerCount,
    state.heroIndex,
    state.heroCards,
    state.playerNames
  );
  return {
    ...state,
    isViewingSave: false,
    isV2Mode: true,
    players: init.players,
    potSize: 0,
    highestBet: 0,
    bettingRound: 0,
    communityCards: [],
    presetCommunityCards: state.presetCommunityCards,
    history: [{ isDivider: true, text: '--- 进入 翻前 (Pre-flop) ---', cards: [] }],
    historySnapshots: [],
    winners: [],
    currentTurn: 0,
    stage: 'play',
    actionStage: 'preflop',
    savedFutureState: null,
  };
}
