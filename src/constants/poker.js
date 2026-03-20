// 德扑常量定义

export const SUITS = [
  { s: '♠', id: 's', color: 'text-slate-800' },
  { s: '♥', id: 'h', color: 'text-red-500' },
  { s: '♣', id: 'c', color: 'text-slate-800' },
  { s: '♦', id: 'd', color: 'text-red-500' },
];

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

export const ROUND_NAMES = [
  '翻前 (Pre-flop)',
  '翻牌 (Flop)',
  '转牌 (Turn)',
  '河牌 (River)',
  '比牌 (Showdown)',
];

export function getPositions(count) {
  if (count === 4) return ['CO', 'BTN', 'SB', 'BB'];
  if (count === 6) return ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  if (count === 8) return ['UTG', 'UTG+1', 'UTG+2', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  if (count === 9) return ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  return Array.from({ length: count }, (_, i) => `位置 ${i + 1}`);
}
