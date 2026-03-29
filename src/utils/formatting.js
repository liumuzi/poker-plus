import { SUITS } from '../constants/poker';

/**
 * 将内部 action 字符串转为中文展示数组
 * 例: 'Raise to 8' → ['加注', '$8']
 */
export function parseAction(actStr) {
  const s = actStr
    .replace('Bet', '下注 $')
    .replace('Raise to', '加注 $')
    .replace('Call', '跟注 $')
    .replace('Check', '让牌')
    .replace('Fold', '弃牌')
    .replace('All-in', '全下 $');
  return s.split(' ');
}

/**
 * 将扑克牌对象格式化为紧凑显示字符串
 * 例: { rank: 'J', suit: 's' } → '♠J'
 * @param {{ rank: string, suit: string } | null} card
 * @returns {string}
 */
export function formatCompactCard(card) {
  const suit = SUITS.find((s) => s.id === card?.suit)?.s || '?';
  return `${suit}${card?.rank || '?'}`;
}
