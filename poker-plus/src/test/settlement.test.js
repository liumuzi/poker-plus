import { describe, it, expect } from 'vitest';
import { getChipValue, calcPlayer, calcSummary, calcTransfers } from '../utils/settlement';

// ─────────────────────────────────────────────────────────────
// settlement.js pure function tests
// ─────────────────────────────────────────────────────────────

describe('getChipValue', () => {
  it('should compute correct chip value', () => {
    expect(getChipValue(100, 10000)).toBeCloseTo(0.01);
    expect(getChipValue(200, 20000)).toBeCloseTo(0.01);
    expect(getChipValue(500, 10000)).toBeCloseTo(0.05);
  });

  it('should return 0 if chipsPerHand is 0', () => {
    expect(getChipValue(100, 0)).toBe(0);
  });

  it('should return 0 if chipsPerHand is falsy', () => {
    expect(getChipValue(100, null)).toBe(0);
    expect(getChipValue(100, undefined)).toBe(0);
  });
});

describe('calcPlayer', () => {
  it('should compute buyIn and profit correctly', () => {
    const player = { name: 'Alice', handsBought: 3, cashoutChips: 35000 };
    const result = calcPlayer(player, 10000, 100);
    
    expect(result.buyInChips).toBe(30000);
    expect(result.buyInMoney).toBe(300);
    expect(result.cashoutChips).toBe(35000);
    expect(result.cashoutMoney).toBeCloseTo(350);
    expect(result.profit).toBeCloseTo(50);
  });

  it('should handle negative profit (loss)', () => {
    const player = { name: 'Bob', handsBought: 2, cashoutChips: 15000 };
    const result = calcPlayer(player, 10000, 100);
    
    expect(result.buyInChips).toBe(20000);
    expect(result.buyInMoney).toBe(200);
    expect(result.profit).toBeCloseTo(-50);
  });

  it('should handle zero hands bought', () => {
    const player = { name: 'Charlie', handsBought: 0, cashoutChips: 0 };
    const result = calcPlayer(player, 10000, 100);
    
    expect(result.buyInChips).toBe(0);
    expect(result.profit).toBe(0);
  });
});

describe('calcSummary', () => {
  it('should compute totals correctly', () => {
    const players = [
      { buyInChips: 20000, cashoutChips: 25000, buyInMoney: 200, cashoutMoney: 250 },
      { buyInChips: 30000, cashoutChips: 25000, buyInMoney: 300, cashoutMoney: 250 },
    ];
    const summary = calcSummary(players);
    
    expect(summary.totalBuyInChips).toBe(50000);
    expect(summary.totalCashoutChips).toBe(50000);
    expect(summary.isBalanced).toBe(true);
    expect(summary.chipsGap).toBe(0);
  });

  it('should detect unbalanced chips', () => {
    const players = [
      { buyInChips: 20000, cashoutChips: 22000, buyInMoney: 200, cashoutMoney: 220 },
      { buyInChips: 20000, cashoutChips: 15000, buyInMoney: 200, cashoutMoney: 150 },
    ];
    const summary = calcSummary(players);
    
    expect(summary.isBalanced).toBe(false);
    expect(summary.chipsGap).toBe(-3000);
  });
});

describe('calcTransfers', () => {
  it('should produce minimal transfer list', () => {
    const players = [
      { name: 'Alice', profit: 50 },
      { name: 'Bob', profit: -30 },
      { name: 'Charlie', profit: -20 },
    ];
    const transfers = calcTransfers(players);
    
    // Bob and Charlie should pay Alice
    expect(transfers.length).toBe(2);
    const totalPaid = transfers.reduce((s, t) => s + t.amount, 0);
    expect(totalPaid).toBeCloseTo(50);
  });

  it('should handle single debtor and single creditor', () => {
    const players = [
      { name: 'Alice', profit: 100 },
      { name: 'Bob', profit: -100 },
    ];
    const transfers = calcTransfers(players);
    
    expect(transfers.length).toBe(1);
    expect(transfers[0].from).toBe('Bob');
    expect(transfers[0].to).toBe('Alice');
    expect(transfers[0].amount).toBe(100);
  });

  it('should return empty array when no one has profit/loss', () => {
    const players = [
      { name: 'Alice', profit: 0 },
      { name: 'Bob', profit: 0 },
    ];
    expect(calcTransfers(players)).toEqual([]);
  });
});
