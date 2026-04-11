import { describe, it, expect } from 'vitest';
import { buildDeck, cardToKey, shuffleSample, calculateEquity } from '../utils/equity';
import { RANKS } from '../constants/poker';

// ─────────────────────────────────────────────────────────────
// equity.js tests — verify it correctly uses shared RANKS
// ─────────────────────────────────────────────────────────────

describe('buildDeck', () => {
  it('should produce 52 cards', () => {
    const deck = buildDeck();
    expect(deck.length).toBe(52);
  });

  it('should have unique cards', () => {
    const deck = buildDeck();
    const keys = deck.map(cardToKey);
    expect(new Set(keys).size).toBe(52);
  });

  it('should contain all ranks from constants', () => {
    const deck = buildDeck();
    const deckRanks = new Set(deck.map(c => c.rank));
    for (const rank of RANKS) {
      expect(deckRanks.has(rank)).toBe(true);
    }
  });

  it('should have 4 suits per rank', () => {
    const deck = buildDeck();
    for (const rank of RANKS) {
      const suits = deck.filter(c => c.rank === rank).map(c => c.suit);
      expect(suits.sort()).toEqual(['c', 'd', 'h', 's']);
    }
  });
});

describe('cardToKey', () => {
  it('should produce rank+suit string', () => {
    expect(cardToKey({ rank: 'A', suit: 's' })).toBe('As');
    expect(cardToKey({ rank: 'T', suit: 'h' })).toBe('Th');
  });
});

describe('shuffleSample', () => {
  it('should return n items', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(shuffleSample(arr, 3).length).toBe(3);
    expect(shuffleSample(arr, 5).length).toBe(5);
  });

  it('should not modify the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffleSample(arr, 3);
    expect(arr).toEqual(copy);
  });

  it('should return items from the original array', () => {
    const arr = [10, 20, 30, 40, 50];
    const sample = shuffleSample(arr, 3);
    for (const item of sample) {
      expect(arr).toContain(item);
    }
  });
});

describe('calculateEquity', () => {
  it('should return null if fewer than 2 valid players', () => {
    const result = calculateEquity(
      [{ id: 0, name: 'A', cards: [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }] }],
      [],
      100
    );
    expect(result).toBeNull();
  });

  it('should return results for 2 valid players', () => {
    const result = calculateEquity(
      [
        { id: 0, name: 'A', cards: [{ rank: 'A', suit: 's' }, { rank: 'A', suit: 'h' }] },
        { id: 1, name: 'B', cards: [{ rank: '2', suit: 's' }, { rank: '7', suit: 'h' }] },
      ],
      [],
      100
    );
    expect(result).not.toBeNull();
    expect(result.length).toBe(2);
    // AA should be heavily favored over 72o
    expect(result[0].equity).toBeGreaterThan(result[1].equity);
  });

  it('should have equity summing to ~100%', () => {
    const result = calculateEquity(
      [
        { id: 0, name: 'A', cards: [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }] },
        { id: 1, name: 'B', cards: [{ rank: 'Q', suit: 's' }, { rank: 'J', suit: 'h' }] },
      ],
      [],
      500
    );
    const totalEq = result.reduce((s, p) => s + p.equity, 0);
    expect(totalEq).toBeGreaterThan(95);
    expect(totalEq).toBeLessThan(105);
  });
});
