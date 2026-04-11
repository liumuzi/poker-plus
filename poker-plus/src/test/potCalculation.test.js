import { describe, it, expect } from 'vitest';
import { processAction } from '../engine/gameEngine';

// ─────────────────────────────────────────────────────────────
// processAction pot calculation tests
// Verifies pot tracking matches mock data expectations
// ─────────────────────────────────────────────────────────────

function makePlayers(count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: i === 0 ? 'Hero' : `Player${i + 1}`,
    folded: false,
    allIn: false,
    betThisRound: 0,
    totalInvested: 0,
    actedThisRound: false,
    isHero: i === 0,
    knownCards: [null, null],
  }));
}

describe('processAction pot tracking', () => {
  describe('Raise to X — pot should include full raise amount', () => {
    it('should add the full raise amount to pot when no prior bet this round', () => {
      // Simulates: Hero has betThisRound=0, Raise to 72
      // added = 72 - 0 = 72
      const players = makePlayers(2);
      const result = processAction(players, 0, 49, 0, 3, 'Raise', 72);

      expect(result).not.toBeNull();
      expect(result.potSize).toBe(49 + 72); // 121
      expect(result.highestBet).toBe(72);
      expect(result.historyEntry.action).toBe('Raise to 72');
    });

    it('should compute added correctly when player already has a bet this round', () => {
      const players = makePlayers(2);
      players[0].betThisRound = 10; // already bet 10 this round
      const result = processAction(players, 0, 30, 10, 0, 'Raise', 25);

      // added = 25 - 10 = 15
      expect(result.potSize).toBe(30 + 15); // 45
      expect(result.highestBet).toBe(25);
    });
  });

  describe('Simulating Post #2 river action', () => {
    it('should produce pot=121 for the full river sequence', () => {
      let players = makePlayers(2);
      let pot = 25; // starting river pot
      let highest = 0;

      // Hero Check
      let r = processAction(players, 0, pot, highest, 3, 'Check/Call', 0);
      expect(r.potSize).toBe(25);
      pot = r.potSize;
      highest = r.highestBet;
      players = r.players;

      // Player2 Bet 24
      r = processAction(players, 1, pot, highest, 3, 'Bet', 24);
      expect(r.potSize).toBe(49);
      pot = r.potSize;
      highest = r.highestBet;
      players = r.players;

      // Hero Raise to 72
      r = processAction(players, 0, pot, highest, 3, 'Raise', 72);
      expect(r.potSize).toBe(121); // 49 + 72 = 121
      pot = r.potSize;
      highest = r.highestBet;
      players = r.players;

      // Player2 Fold
      r = processAction(players, 1, pot, highest, 3, 'Fold', 0);
      expect(r.potSize).toBe(121); // fold doesn't change pot
    });
  });

  describe('Call action', () => {
    it('should add the difference to match highest bet', () => {
      const players = makePlayers(2);
      players[1].betThisRound = 10;
      const result = processAction(players, 0, 10, 10, 0, 'Check/Call', 0);

      expect(result.potSize).toBe(20); // 10 + 10 matched
      expect(result.historyEntry.action).toBe('Call 10');
    });

    it('should produce Check when no bet to match', () => {
      const players = makePlayers(2);
      const result = processAction(players, 0, 10, 0, 0, 'Check/Call', 0);

      expect(result.potSize).toBe(10); // no change
      expect(result.historyEntry.action).toBe('Check');
    });
  });

  describe('Bet action', () => {
    it('should add bet amount to pot', () => {
      const players = makePlayers(2);
      const result = processAction(players, 0, 13, 0, 1, 'Bet', 6);

      expect(result.potSize).toBe(19);
      expect(result.highestBet).toBe(6);
    });

    it('should reject bet when highestBet > 0', () => {
      const players = makePlayers(2);
      const result = processAction(players, 0, 13, 5, 1, 'Bet', 10);
      expect(result).toBeNull();
    });
  });

  describe('Fold action', () => {
    it('should not change pot', () => {
      const players = makePlayers(2);
      const result = processAction(players, 0, 50, 10, 1, 'Fold', 0);

      expect(result.potSize).toBe(50);
      expect(result.players[0].folded).toBe(true);
    });
  });

  describe('All-in action', () => {
    it('should add the correct amount to pot', () => {
      const players = makePlayers(2);
      const result = processAction(players, 0, 20, 10, 0, 'All-in', 50);

      expect(result.potSize).toBe(70); // 20 + 50
      expect(result.players[0].allIn).toBe(true);
    });
  });
});
