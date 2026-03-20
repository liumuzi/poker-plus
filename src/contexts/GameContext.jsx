import React, { createContext, useContext, useReducer } from 'react';
import {
  createInitialPlayers,
  processAction,
  checkRoundEnd,
  findNextActor,
  transitionToNextStreet,
} from '../engine/gameEngine';
import { createSnapshot, restoreSnapshot } from '../engine/snapshotUtils';

const GameContext = createContext(null);

const initialState = {
  stage: 'home',
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
        tempCards: [],
        history: [],
        historySnapshots: [],
        winners: [],
        stage: 'setup',
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
        bettingRound: 0,
        highestBet: 0,
        potSize: 0,
        winners: [],
        pickingCardsTarget: null,
        tempCards: [],
        isViewingSave: false,
      };

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
        history: init.history,
        historySnapshots: [],
        winners: [],
        currentTurn: 0,
        stage: 'play',
      };
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

    case 'TRANSITION_STREET': {
      const snapshot = createSnapshot(state);
      const result = transitionToNextStreet(
        state.players,
        state.communityCards,
        state.bettingRound,
        state.potSize,
        action.payload.cards,
        state.playerCount
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
        stage: 'summary',
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
