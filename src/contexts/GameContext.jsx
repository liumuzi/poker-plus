import React, { createContext, useContext, useReducer } from 'react';
import {
  handleSetStage,
  handleSetPlayerCount,
  handleSetPlayerCountV2,
  handleSetBlinds,
  handleSetHeroIndex,
  handleResetForNewGame,
  handleResetForNewGameV2,
  handleExitToHome,
  handleRewriteFromCurrentHand,
  handleStartGame,
  handleStartGameV2,
} from './handlers/setupHandlers';
import {
  handlePlayerAction,
  handleTransitionStreet,
  handleUndo,
} from './handlers/gameplayHandlers';
import { handleNavigateToStage } from './handlers/navigationHandlers';
import {
  handleUpdatePlayerName,
  handleUpdatePlayerStack,
  handleUpdateGameNotes,
} from './handlers/playerEditHandlers';
import {
  handleSetHeroCard,
  handleSetPickingTarget,
  handleSelectTempCard,
  handleSetSetupCommunityCard,
  handleClearSetupCommunityCards,
  handleRevealPlayerCard,
} from './handlers/cardHandlers';
import {
  handleToggleWinner,
  handleFinishHand,
  handleLoadSavedGame,
  handleLoadTestCase,
} from './handlers/saveLoadHandlers';

const GameContext = createContext(null);

const initialState = {
  stage: 'home',
  // V2 模式标记
  isV2Mode: false,
  playerCount: 6,
  sbAmount: 1,
  bbAmount: 2,
  heroIndex: 5,
  heroCards: [null, null],
  players: [],
  currentTurn: 0,
  history: [],
  historySnapshots: [],
  communityCards: [],
  bettingRound: 0,
  highestBet: 0,
  potSize: 0,
  winners: [],
  pickingCardsTarget: null,
  tempCards: [],
  isViewingSave: false,
  // V2 新增: 玩家自定义名称
  playerNames: {},
  // V2 新增: 玩家筹码信息
  playerStacks: {},
  // V2 新增: 复盘备注
  gameNotes: '',
  // V2 新增: 当前行动阶段（用于节点导航）
  actionStage: 'setup',
  // V2 新增: 设置阶段预设的公共牌（与游戏中的communityCards分开存储）
  presetCommunityCards: [],
  // V2 新增: 保存的前进状态（用于导航回退时保留后续数据）
  savedFutureState: null,
};

/**
 * Action type 到 handler 函数的映射表
 * 每个 handler 签名为 (state, action) => newState
 */
const actionHandlers = {
  'SET_STAGE': handleSetStage,
  'SET_PLAYER_COUNT': handleSetPlayerCount,
  'SET_PLAYER_COUNT_V2': handleSetPlayerCountV2,
  'SET_BLINDS': handleSetBlinds,
  'SET_HERO_INDEX': handleSetHeroIndex,
  'SET_HERO_CARD': handleSetHeroCard,
  'RESET_FOR_NEW_GAME': handleResetForNewGame,
  'RESET_FOR_NEW_GAME_V2': handleResetForNewGameV2,
  'EXIT_TO_HOME': handleExitToHome,
  'REWRITE_FROM_CURRENT_HAND': handleRewriteFromCurrentHand,
  'START_GAME': handleStartGame,
  'START_GAME_V2': handleStartGameV2,
  'UPDATE_PLAYER_NAME': handleUpdatePlayerName,
  'UPDATE_PLAYER_STACK': handleUpdatePlayerStack,
  'UPDATE_GAME_NOTES': handleUpdateGameNotes,
  'NAVIGATE_TO_STAGE': handleNavigateToStage,
  'PLAYER_ACTION': handlePlayerAction,
  'UNDO': handleUndo,
  'SET_PICKING_TARGET': handleSetPickingTarget,
  'SELECT_TEMP_CARD': handleSelectTempCard,
  'SET_SETUP_COMMUNITY_CARD': handleSetSetupCommunityCard,
  'CLEAR_SETUP_COMMUNITY_CARDS': handleClearSetupCommunityCards,
  'TRANSITION_STREET': handleTransitionStreet,
  'REVEAL_PLAYER_CARD': handleRevealPlayerCard,
  'TOGGLE_WINNER': handleToggleWinner,
  'FINISH_HAND': handleFinishHand,
  'LOAD_SAVED_GAME': handleLoadSavedGame,
  'LOAD_TEST_CASE': handleLoadTestCase,
};

function gameReducer(state, action) {
  const handler = actionHandlers[action.type];
  if (handler) {
    return handler(state, action);
  }
  return state;
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ ...state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
