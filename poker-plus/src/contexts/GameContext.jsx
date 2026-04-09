import React, { createContext, useContext, useReducer } from 'react';
import {
  createInitialPlayers,
  createInitialPlayersV2,
  processAction,
  checkRoundEnd,
  findNextActor,
  transitionToNextStreet,
} from '../engine/gameEngine';
import { createSnapshot, restoreSnapshot } from '../engine/snapshotUtils';

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
  loadedGameId: null,
  pickingFirstActor: false,
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

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_STAGE':
      return { ...state, stage: action.payload.stage };

    case 'SET_PLAYER_COUNT':
      return {
        ...state,
        playerCount: action.payload.count,
        heroIndex: action.payload.count - 1,
      };

    // V2: 设置入池人数，不自动设置heroIndex为最后一个
    case 'SET_PLAYER_COUNT_V2':
      return {
        ...state,
        playerCount: action.payload.count,
        heroIndex: state.heroIndex >= action.payload.count ? 0 : state.heroIndex,
        isV2Mode: true,
      };

    case 'SET_BLINDS':
      return {
        ...state,
        sbAmount: action.payload.sb ?? state.sbAmount,
        bbAmount: action.payload.bb ?? state.bbAmount,
      };

    case 'SET_HERO_INDEX':
      return { ...state, heroIndex: action.payload.index };

    case 'SET_HERO_CARD': {
      const newHeroCards = [...state.heroCards];
      newHeroCards[action.payload.position] = action.payload.card;
      return { ...state, heroCards: newHeroCards, pickingCardsTarget: null };
    }

    case 'RESET_FOR_NEW_GAME':
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

    // V2: 新建游戏进入V2模式
    case 'RESET_FOR_NEW_GAME_V2':
      return {
        ...state,
        playerCount: 2,
        heroIndex: 1,
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

    case 'EXIT_TO_HOME':
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

    case 'RETURN_TO_PLAY':
      return { ...state, stage: 'play' };

    case 'REWRITE_FROM_CURRENT_HAND_V2': {
      // 回到V2设置界面，保留所有已录入信息
      const heroIdx = state.players.findIndex((p) => p.isHero);
      const heroKnown = heroIdx >= 0 ? (state.players[heroIdx].knownCards || [null, null]) : [null, null];
      return {
        ...state,
        heroIndex: heroIdx >= 0 ? heroIdx : state.heroIndex,
        heroCards: [heroKnown[0] || null, heroKnown[1] || null],
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
        pickingFirstActor: false,
        savedFutureState: null,
        stage: 'setupV2',
        actionStage: 'setup',
        // presetCommunityCards, playerCount, playerNames preserved
      };
    }

    case 'REWRITE_FROM_CURRENT_HAND': {
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

    case 'START_GAME': {
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
        presetCommunityCards: state.presetCommunityCards,
        history: init.history,
        historySnapshots: [],
        winners: [],
        currentTurn: 0,
        stage: 'play',
        actionStage: 'preflop',
        savedFutureState: null,
        pickingFirstActor: false,
      };
    }

    // V2: 开始游戏，总是从翻前开始，预设公共牌在过渡时自动使用
    case 'START_GAME_V2': {
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
        pickingFirstActor: true,
      };
    }

    case 'SET_FIRST_ACTOR': {
      const snapshot = createSnapshot(state); // 保存"选首位行动者"前的状态（pickingFirstActor: true）
      return {
        ...state,
        currentTurn: action.payload.index,
        pickingFirstActor: false,
        historySnapshots: [...state.historySnapshots, snapshot],
      };
    }

    // V2: 更新玩家名称
    case 'UPDATE_PLAYER_NAME': {
      const newNames = { ...state.playerNames };
      const oldName = state.players.find(p => p.id === action.payload.playerId)?.name;
      newNames[action.payload.playerId] = action.payload.name;
      
      // 如果游戏已经开始，也更新players数组中的名称
      let updatedPlayers = state.players;
      if (state.players.length > 0) {
        updatedPlayers = state.players.map((p) => {
          if (p.id === action.payload.playerId) {
            return { ...p, name: action.payload.name };
          }
          return p;
        });
      }

      // 同步更新历史记录中的玩家名称
      const updatedHistory = (oldName && oldName !== action.payload.name) ? state.history.map((h) => {
        if (!h.isDivider && !h.isWinLog && h.player === oldName) {
          return { ...h, player: action.payload.name };
        }
        if (h.isWinLog && typeof h.action === 'string' && h.action.includes(oldName)) {
          // 精确替换赢家日志中的玩家名称（格式: "Name1 & Name2 赢下底池: 100"）
          const parts = h.action.split(' 赢下底池');
          if (parts.length >= 2) {
            const names = parts[0].split(' & ').map(n => n.trim() === oldName ? action.payload.name : n);
            return { ...h, action: names.join(' & ') + ' 赢下底池' + parts.slice(1).join(' 赢下底池') };
          }
        }
        return h;
      }) : state.history;
      
      return { 
        ...state, 
        playerNames: newNames,
        players: updatedPlayers,
        history: updatedHistory,
      };
    }

    // V2: 更新玩家筹码
    case 'UPDATE_PLAYER_STACK': {
      const newStacks = { ...state.playerStacks };
      newStacks[action.payload.playerId] = action.payload.stack;
      
      // 如果游戏已经开始，也更新players数组中的筹码
      let updatedPlayers = state.players;
      if (state.players.length > 0) {
        updatedPlayers = state.players.map((p) => {
          if (p.id === action.payload.playerId) {
            return { ...p, stackSize: action.payload.stack };
          }
          return p;
        });
      }
      
      return { 
        ...state, 
        playerStacks: newStacks,
        players: updatedPlayers,
      };
    }

    // V2: 更新复盘备注
    case 'UPDATE_GAME_NOTES':
      return { ...state, gameNotes: action.payload.notes };

    // V2: 导航到指定阶段（保留前进状态，避免误触丢失数据）
    case 'NAVIGATE_TO_STAGE': {
      const targetStage = action.payload.stage;
      const stageToRound = { 'preflop': 0, 'flop': 1, 'turn': 2, 'river': 3 };
      const targetRound = stageToRound[targetStage];
      
      if (targetRound === undefined || targetStage === 'setup') {
        // 根据当前模式返回对应的setup界面
        return { 
          ...state, 
          stage: state.isV2Mode ? 'setupV2' : 'setup', 
          actionStage: 'setup' 
        };
      }
      
      // 前进导航：从savedFutureState中恢复
      if (targetRound > state.bettingRound && state.savedFutureState) {
        const fs = state.savedFutureState;
        
        // 目标等于或超过保存的最远阶段 → 完整恢复
        if (targetRound >= fs.bettingRound) {
          return {
            ...state,
            players: fs.players,
            currentTurn: fs.currentTurn,
            history: fs.history,
            communityCards: fs.communityCards,
            bettingRound: fs.bettingRound,
            highestBet: fs.highestBet,
            potSize: fs.potSize,
            historySnapshots: fs.historySnapshots,
            stage: fs.stage,
            actionStage: fs.actionStage,
            pickingCardsTarget: fs.pickingCardsTarget,
            winners: fs.winners || [],
            savedFutureState: null,
          };
        }
        
        // 目标在当前和最远之间 → 从savedFutureState的快照中恢复
        let snapshotIndex = -1;
        for (let i = 0; i < fs.historySnapshots.length; i++) {
          if (fs.historySnapshots[i].bettingRound === targetRound) {
            snapshotIndex = i;
            break;
          }
        }
        
        if (snapshotIndex >= 0) {
          const snapshot = fs.historySnapshots[snapshotIndex];
          return {
            ...state,
            ...restoreSnapshot(snapshot),
            historySnapshots: fs.historySnapshots.slice(0, snapshotIndex),
            stage: 'play',
            actionStage: targetStage,
            pickingCardsTarget: null,
            savedFutureState: fs,
          };
        }
      }
      
      // 后退导航（包括回到当前阶段的起点）
      if (targetRound <= state.bettingRound && state.historySnapshots.length > 0) {
        // 保存当前完整状态，以便之后恢复（仅在没有已保存的前进状态时才保存）
        const futureStateToSave = state.savedFutureState || {
          players: JSON.parse(JSON.stringify(state.players)),
          currentTurn: state.currentTurn,
          history: JSON.parse(JSON.stringify(state.history)),
          communityCards: [...state.communityCards],
          bettingRound: state.bettingRound,
          highestBet: state.highestBet,
          potSize: state.potSize,
          historySnapshots: JSON.parse(JSON.stringify(state.historySnapshots)),
          stage: state.stage,
          actionStage: state.actionStage,
          pickingCardsTarget: state.pickingCardsTarget,
          winners: [...(state.winners || [])],
        };
        
        // 找到该阶段的第一个快照（即该阶段的起始状态）
        let snapshotIndex = -1;
        for (let i = 0; i < state.historySnapshots.length; i++) {
          if (state.historySnapshots[i].bettingRound === targetRound) {
            snapshotIndex = i;
            break;
          }
        }
        
        if (snapshotIndex >= 0) {
          const snapshot = state.historySnapshots[snapshotIndex];
          return {
            ...state,
            ...restoreSnapshot(snapshot),
            historySnapshots: state.historySnapshots.slice(0, snapshotIndex),
            stage: 'play',
            actionStage: targetStage,
            pickingCardsTarget: null,
            savedFutureState: futureStateToSave,
          };
        }
      }
      
      return { ...state, actionStage: targetStage };
    }

    case 'PLAYER_ACTION': {
      const snapshot = createSnapshot(state);
      const result = processAction(
        state.players,
        state.currentTurn,
        state.potSize,
        state.highestBet,
        state.bettingRound,
        action.payload.action,
        action.payload.amount
      );
      if (!result) return state;

      const newHistory = [...state.history, result.historyEntry];

      // 弃牌后只剩1名玩家 → 直接进入结算，不再继续行动
      const nonFoldedAfterAction = result.players.filter(p => !p.folded).length;
      if (nonFoldedAfterAction <= 1) {
        return {
          ...state,
          players: result.players,
          potSize: result.potSize,
          highestBet: result.highestBet,
          history: newHistory,
          historySnapshots: [...state.historySnapshots, snapshot],
          stage: 'resolution',
          pickingCardsTarget: null,
          tempCards: [],
          savedFutureState: null,
        };
      }

      const roundCheck = checkRoundEnd(result.players, result.highestBet, state.bettingRound);

      let nextTurn = state.currentTurn;
      let nextStage = state.stage;
      let pickTarget = null;

      if (roundCheck.ended) {
        if (roundCheck.reason === 'resolution') {
          nextStage = 'resolution';
        } else if (roundCheck.reason === 'next_street') {
          pickTarget = roundCheck.nextStreet;
        }
      } else {
        const next = findNextActor(state.currentTurn, result.players);
        if (next === null) {
          nextStage = 'resolution';
        } else {
          nextTurn = next;
        }
      }

      return {
        ...state,
        players: result.players,
        potSize: result.potSize,
        highestBet: result.highestBet,
        history: newHistory,
        historySnapshots: [...state.historySnapshots, snapshot],
        currentTurn: nextTurn,
        stage: nextStage,
        pickingCardsTarget: pickTarget,
        tempCards: pickTarget ? [] : state.tempCards,
        savedFutureState: null,
      };
    }

    case 'UNDO': {
      if (state.historySnapshots.length === 0) return state;
      const previous = state.historySnapshots[state.historySnapshots.length - 1];
      const restored = restoreSnapshot(previous);
      return {
        ...state,
        ...restored,
        historySnapshots: state.historySnapshots.slice(0, -1),
        stage: 'play',
        pickingCardsTarget: null,
      };
    }

    case 'SET_PICKING_TARGET':
      return {
        ...state,
        pickingCardsTarget: action.payload.target,
        tempCards: action.payload.target ? [] : state.tempCards,
      };

    case 'SELECT_TEMP_CARD': {
      const newTemp = [...state.tempCards, action.payload.card];
      return { ...state, tempCards: newTemp };
    }

    // V2设置阶段：设置公共牌到预设数组（不触发TRANSITION_STREET）
    case 'SET_SETUP_COMMUNITY_CARD': {
      const { index, card } = action.payload;
      const newPresetCards = [...(state.presetCommunityCards || [])];
      // 确保数组足够长
      while (newPresetCards.length <= index) {
        newPresetCards.push(null);
      }
      newPresetCards[index] = card;
      return { 
        ...state, 
        presetCommunityCards: newPresetCards,
        pickingCardsTarget: null,
      };
    }

    // V2设置阶段：清除所有预设公共牌
    case 'CLEAR_SETUP_COMMUNITY_CARDS':
      return { ...state, presetCommunityCards: [] };

    case 'TRANSITION_STREET': {
      const snapshot = createSnapshot(state);
      // V1: BTN = playerCount-3, 翻后从SB(playerCount-2)开始; V2: BTN=0, 从1开始
      const btnIndex = state.isV2Mode ? 0 : state.playerCount - 3;
      const result = transitionToNextStreet(
        state.players,
        state.communityCards,
        state.bettingRound,
        state.potSize,
        action.payload.cards,
        state.playerCount,
        btnIndex
      );

      let nextStage = state.stage;
      let nextTurn = state.currentTurn;
      let pickTarget = null;

      if (result.nextAction.type === 'resolution') {
        nextStage = 'resolution';
      } else if (result.nextAction.type === 'pick_cards') {
        pickTarget = result.nextAction.target;
      } else if (result.nextAction.type === 'continue') {
        nextTurn = result.nextAction.nextTurn;
      }

      const stageNames = ['preflop', 'flop', 'turn', 'river'];

      return {
        ...state,
        players: result.players,
        communityCards: result.communityCards,
        bettingRound: result.bettingRound,
        highestBet: result.highestBet,
        history: [...state.history, result.historyEntry],
        historySnapshots: [...state.historySnapshots, snapshot],
        pickingCardsTarget: pickTarget,
        tempCards: [],
        currentTurn: nextTurn,
        stage: nextStage,
        actionStage: stageNames[result.bettingRound] || 'river',
        savedFutureState: null,
      };
    }

    case 'REVEAL_PLAYER_CARD': {
      const p = JSON.parse(JSON.stringify(state.players));
      const { playerIdx, cardPos, card } = action.payload;
      p[playerIdx].knownCards[cardPos] = card;
      return { ...state, players: p, pickingCardsTarget: null };
    }

    case 'TOGGLE_WINNER': {
      const id = action.payload.playerId;
      const winners = state.winners.includes(id)
        ? state.winners.filter((w) => w !== id)
        : [...state.winners, id];
      return { ...state, winners };
    }

    case 'FINISH_HAND': {
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

    case 'LOAD_SAVED_GAME': {
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
        loadedGameId: game.id ?? null,
        stage: 'summary',
        // V2 字段
        isV2Mode: game.isV2Mode ?? false,
        playerNames: game.playerNames ?? {},
        playerStacks: game.playerStacks ?? {},
        gameNotes: game.gameNotes ?? '',
      };
    }

    case 'LOAD_TEST_CASE':
      return {
        ...state,
        ...action.payload,
        isViewingSave: true,
        stage: 'summary',
      };

    default:
      return state;
  }
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
