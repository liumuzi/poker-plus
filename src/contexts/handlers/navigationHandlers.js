import { restoreSnapshot } from '../../engine/snapshotUtils';

/**
 * 处理 V2 模式下的阶段导航（NAVIGATE_TO_STAGE）
 * 支持前进导航（从 savedFutureState 恢复）和后退导航（保存当前状态到 savedFutureState）
 */

const STAGE_TO_ROUND = { 'preflop': 0, 'flop': 1, 'turn': 2, 'river': 3 };

/**
 * 在快照数组中查找指定 bettingRound 的第一个快照索引
 * @param {Array} snapshots - 快照数组
 * @param {number} targetRound - 目标轮次
 * @returns {number} 快照索引，-1 表示未找到
 */
function findSnapshotForRound(snapshots, targetRound) {
  for (let i = 0; i < snapshots.length; i++) {
    if (snapshots[i].bettingRound === targetRound) {
      return i;
    }
  }
  return -1;
}

/**
 * 从 savedFutureState 恢复前进导航状态
 */
function handleForwardNavigation(state, targetRound, targetStage) {
  const fs = state.savedFutureState;
  if (!fs) return null;

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

  // 目标在当前和最远之间 → 从 savedFutureState 的快照中恢复
  const snapshotIndex = findSnapshotForRound(fs.historySnapshots, targetRound);
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

  return null;
}

/**
 * 保存当前状态并执行后退导航
 */
function handleBackwardNavigation(state, targetRound, targetStage) {
  if (state.historySnapshots.length === 0) return null;

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
  const snapshotIndex = findSnapshotForRound(state.historySnapshots, targetRound);
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

  return null;
}

export function handleNavigateToStage(state, action) {
  const targetStage = action.payload.stage;
  const targetRound = STAGE_TO_ROUND[targetStage];

  if (targetRound === undefined || targetStage === 'setup') {
    // 根据当前模式返回对应的setup界面
    return {
      ...state,
      stage: state.isV2Mode ? 'setupV2' : 'setup',
      actionStage: 'setup',
    };
  }

  // 前进导航：从 savedFutureState 中恢复
  if (targetRound > state.bettingRound && state.savedFutureState) {
    const result = handleForwardNavigation(state, targetRound, targetStage);
    if (result) return result;
  }

  // 后退导航（包括回到当前阶段的起点）
  if (targetRound <= state.bettingRound) {
    const result = handleBackwardNavigation(state, targetRound, targetStage);
    if (result) return result;
  }

  return { ...state, actionStage: targetStage };
}
