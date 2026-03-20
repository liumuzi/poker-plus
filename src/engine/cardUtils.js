import { SUITS } from '../constants/poker';

/**
 * 判断一张牌是否已被使用（在 Hero 手牌、公共牌、临时选牌、其他玩家已知手牌中）
 */
export function isCardUsed(rank, suitId, heroCards, communityCards, tempCards, players) {
  const match = (c) => c && c.rank === rank && c.suit === suitId;

  if (heroCards.some(match)) return true;
  if (communityCards.some(match)) return true;
  if (tempCards.some(match)) return true;
  for (const p of players) {
    if (p.knownCards && p.knownCards.some(match)) return true;
  }
  return false;
}

/**
 * 获取卡牌的显示数据
 * @returns {{ symbol: string, rank: string, colorClass: string } | null}
 */
export function getCardDisplayData(card) {
  if (!card) return null;
  const suitObj = SUITS.find((s) => s.id === card.suit) || SUITS[0];
  return {
    symbol: suitObj.s,
    rank: card.rank,
    colorClass: suitObj.color,
  };
}
