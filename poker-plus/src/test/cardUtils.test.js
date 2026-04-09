import { describe, it, expect } from 'vitest';
import { getCardDisplayData, isCardUsed } from '../engine/cardUtils';

describe('getCardDisplayData', () => {
  it('returns null for a null card', () => {
    expect(getCardDisplayData(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(getCardDisplayData(undefined)).toBeNull();
  });

  it('returns correct data for a spade card', () => {
    const result = getCardDisplayData({ rank: 'A', suit: 's' });
    expect(result).toEqual({
      symbol: '♠',
      rank: 'A',
      colorClass: 'text-slate-800',
    });
  });

  it('returns correct data for a heart card (red)', () => {
    const result = getCardDisplayData({ rank: 'K', suit: 'h' });
    expect(result).toEqual({
      symbol: '♥',
      rank: 'K',
      colorClass: 'text-red-500',
    });
  });

  it('returns correct data for a diamond card (red)', () => {
    const result = getCardDisplayData({ rank: 'Q', suit: 'd' });
    expect(result).toEqual({
      symbol: '♦',
      rank: 'Q',
      colorClass: 'text-red-500',
    });
  });

  it('returns correct data for a club card', () => {
    const result = getCardDisplayData({ rank: '2', suit: 'c' });
    expect(result).toEqual({
      symbol: '♣',
      rank: '2',
      colorClass: 'text-slate-800',
    });
  });

  it('falls back to the first SUITS entry for an unknown suit', () => {
    const result = getCardDisplayData({ rank: '5', suit: 'x' });
    // Should use SUITS[0] which is spade
    expect(result).not.toBeNull();
    expect(result.rank).toBe('5');
  });
});

describe('isCardUsed', () => {
  const heroCards = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }];
  const communityCards = [{ rank: 'Q', suit: 'd' }];
  const tempCards = [{ rank: 'J', suit: 'c' }];
  const players = [
    {
      id: 0,
      knownCards: [{ rank: '2', suit: 's' }, null],
    },
    {
      id: 1,
      knownCards: [null, null],
    },
  ];

  it('returns true for a card in heroCards', () => {
    expect(isCardUsed('A', 's', heroCards, communityCards, tempCards, players)).toBe(true);
  });

  it('returns true for a card in communityCards', () => {
    expect(isCardUsed('Q', 'd', heroCards, communityCards, tempCards, players)).toBe(true);
  });

  it('returns true for a card in tempCards', () => {
    expect(isCardUsed('J', 'c', heroCards, communityCards, tempCards, players)).toBe(true);
  });

  it('returns true for a card in a player\'s knownCards', () => {
    expect(isCardUsed('2', 's', heroCards, communityCards, tempCards, players)).toBe(true);
  });

  it('returns false for a card not used anywhere', () => {
    expect(isCardUsed('T', 'h', heroCards, communityCards, tempCards, players)).toBe(false);
  });

  it('returns false for same rank but different suit', () => {
    expect(isCardUsed('A', 'h', heroCards, communityCards, tempCards, players)).toBe(false);
  });
});
