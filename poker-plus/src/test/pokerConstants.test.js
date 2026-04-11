import { describe, it, expect } from 'vitest';
import { getPositions, RANKS, SUITS, ROUND_NAMES } from '../constants/poker';

// ─────────────────────────────────────────────────────────────
// poker.js constants tests
// ─────────────────────────────────────────────────────────────

describe('RANKS', () => {
  it('should have 13 ranks', () => {
    expect(RANKS.length).toBe(13);
  });

  it('should start with A and end with 2', () => {
    expect(RANKS[0]).toBe('A');
    expect(RANKS[RANKS.length - 1]).toBe('2');
  });
});

describe('SUITS', () => {
  it('should have 4 suits', () => {
    expect(SUITS.length).toBe(4);
  });

  it('should include spades, hearts, clubs, diamonds', () => {
    const ids = SUITS.map(s => s.id);
    expect(ids).toContain('s');
    expect(ids).toContain('h');
    expect(ids).toContain('c');
    expect(ids).toContain('d');
  });
});

describe('ROUND_NAMES', () => {
  it('should have 5 round names', () => {
    expect(ROUND_NAMES.length).toBe(5);
  });

  it('should cover Pre-flop through Showdown', () => {
    expect(ROUND_NAMES[0]).toContain('Pre-flop');
    expect(ROUND_NAMES[1]).toContain('Flop');
    expect(ROUND_NAMES[2]).toContain('Turn');
    expect(ROUND_NAMES[3]).toContain('River');
    expect(ROUND_NAMES[4]).toContain('Showdown');
  });
});

describe('getPositions', () => {
  it('should return proper positions for 2-player table (heads-up)', () => {
    const positions = getPositions(2);
    expect(positions).toEqual(['BTN/SB', 'BB']);
    expect(positions.length).toBe(2);
  });

  it('should return proper positions for 3-player table', () => {
    const positions = getPositions(3);
    expect(positions).toEqual(['BTN', 'SB', 'BB']);
    expect(positions.length).toBe(3);
  });

  it('should return proper positions for 4-player table', () => {
    const positions = getPositions(4);
    expect(positions).toEqual(['CO', 'BTN', 'SB', 'BB']);
    expect(positions.length).toBe(4);
  });

  it('should return proper positions for 6-player table (standard)', () => {
    const positions = getPositions(6);
    expect(positions).toEqual(['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']);
    expect(positions.length).toBe(6);
  });

  it('should return proper positions for 9-player table (full ring)', () => {
    const positions = getPositions(9);
    expect(positions.length).toBe(9);
    expect(positions[0]).toBe('UTG');
    expect(positions[positions.length - 1]).toBe('BB');
    expect(positions[positions.length - 2]).toBe('SB');
  });

  it('should return proper positions for 10-player table', () => {
    const positions = getPositions(10);
    expect(positions.length).toBe(10);
    expect(positions[positions.length - 1]).toBe('BB');
    expect(positions[positions.length - 2]).toBe('SB');
    expect(positions[positions.length - 3]).toBe('BTN');
  });

  it('should always end with BB for all valid counts (2-10)', () => {
    for (let i = 2; i <= 10; i++) {
      const positions = getPositions(i);
      expect(positions[positions.length - 1]).toBe('BB');
    }
  });

  it('should have position count matching player count for 2-10', () => {
    for (let i = 2; i <= 10; i++) {
      expect(getPositions(i).length).toBe(i);
    }
  });

  it('should use fallback for unsupported counts', () => {
    const positions = getPositions(11);
    expect(positions.length).toBe(11);
    expect(positions[0]).toBe('位置 1');
  });
});
