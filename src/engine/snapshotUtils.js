/**
 * 创建当前游戏状态的深拷贝快照
 */
export function createSnapshot(state) {
  return {
    players: JSON.parse(JSON.stringify(state.players)),
    currentTurn: state.currentTurn,
    history: [...state.history],
    communityCards: [...state.communityCards],
    bettingRound: state.bettingRound,
    highestBet: state.highestBet,
    potSize: state.potSize,
  };
}

/**
 * 从快照恢复状态字段
 */
export function restoreSnapshot(snapshot) {
  return {
    players: snapshot.players,
    currentTurn: snapshot.currentTurn,
    history: snapshot.history,
    communityCards: snapshot.communityCards,
    bettingRound: snapshot.bettingRound,
    highestBet: snapshot.highestBet,
    potSize: snapshot.potSize,
  };
}
