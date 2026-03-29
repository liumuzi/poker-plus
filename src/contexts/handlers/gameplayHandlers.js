import {
  processAction,
  checkRoundEnd,
  findNextActor,
  transitionToNextStreet,
} from '../../engine/gameEngine';
import { createSnapshot, restoreSnapshot } from '../../engine/snapshotUtils';

/**
 * 处理游戏进行中的 action（行动、过渡、撤销）
 */

export function handlePlayerAction(state, action) {
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
    savedFutureState: null,
  };
}

export function handleTransitionStreet(state, action) {
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

export function handleUndo(state) {
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
