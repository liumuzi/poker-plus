import { updatePlayerNameInHistory } from '../../utils/historyUtils';

/**
 * 处理玩家信息编辑相关的 action（名称、筹码、备注）
 */

export function handleUpdatePlayerName(state, action) {
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
  const updatedHistory = updatePlayerNameInHistory(state.history, oldName, action.payload.name);

  return {
    ...state,
    playerNames: newNames,
    players: updatedPlayers,
    history: updatedHistory,
  };
}

export function handleUpdatePlayerStack(state, action) {
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

export function handleUpdateGameNotes(state, action) {
  return { ...state, gameNotes: action.payload.notes };
}
