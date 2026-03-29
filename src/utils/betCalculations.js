/**
 * 计算下注模式下的预设下注量（无人下注时）
 * @param {number} potSize - 当前底池大小
 * @returns {{ betOneThird: number, betOneHalf: number, betTwoThird: number, betFullPot: number }}
 */
export function calculateBetSizes(potSize) {
  return {
    betOneThird: Math.max(1, Math.round(potSize * (1 / 3))),
    betOneHalf: Math.max(1, Math.round(potSize * (1 / 2))),
    betTwoThird: Math.max(1, Math.round(potSize * (2 / 3))),
    betFullPot: Math.max(1, potSize),
  };
}

/**
 * 计算加注模式下的预设加注量（已有人下注时）
 * @param {number} highestBet - 当前最高下注额
 * @returns {{ raise2x: number, raise2_5x: number, raise3x: number, raise4x: number }}
 */
export function calculateRaiseSizes(highestBet) {
  return {
    raise2x: highestBet * 2,
    raise2_5x: Math.round(highestBet * 2.5),
    raise3x: highestBet * 3,
    raise4x: highestBet * 4,
  };
}
