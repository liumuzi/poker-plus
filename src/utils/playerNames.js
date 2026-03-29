/**
 * 获取单个玩家显示名称（V2模式）
 * BTN固定在位置0，Hero根据heroIndex标记
 * @param {number} index - 玩家位置索引
 * @param {number} heroIndex - Hero的位置索引
 * @returns {string} 玩家显示名称
 */
export function getPlayerDisplayName(index, heroIndex) {
  if (index === heroIndex) {
    return 'Hero';
  } else if (index === 0) {
    return 'BTN';
  } else {
    return `玩家${index}`;
  }
}

/**
 * 生成所有玩家的显示名称数组（V2模式）
 * @param {number} playerCount - 玩家人数
 * @param {number} heroIndex - Hero的位置索引
 * @returns {string[]} 玩家名称数组
 */
export function generatePlayerNames(playerCount, heroIndex) {
  const names = [];
  for (let i = 0; i < playerCount; i++) {
    names.push(getPlayerDisplayName(i, heroIndex));
  }
  return names;
}
