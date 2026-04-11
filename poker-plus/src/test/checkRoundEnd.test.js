import { describe, it, expect } from 'vitest';
import { checkRoundEnd } from '../engine/gameEngine';

// ─────────────────────────────────────────────────────────────
// checkRoundEnd — tests for dead code removal fix
// ─────────────────────────────────────────────────────────────

function makePlayers(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `P${i}`,
    folded: false,
    allIn: false,
    betThisRound: 0,
    totalInvested: 0,
    actedThisRound: true,
    isHero: i === 0,
    knownCards: [null, null],
  }));
}

describe('checkRoundEnd — dead code fix', () => {
  it('should detect resolution when only 1 non-folded player remains', () => {
    const players = makePlayers(3);
    players[1].folded = true;
    players[2].folded = true;

    const result = checkRoundEnd(players, 0, 0);
    expect(result.ended).toBe(true);
    expect(result.reason).toBe('resolution');
  });

  it('should proceed to next street when all active players have acted on flop', () => {
    const players = makePlayers(3);
    // All acted, all bets at 0 (checked around)
    const result = checkRoundEnd(players, 0, 0);
    expect(result.ended).toBe(true);
    expect(result.reason).toBe('next_street');
    expect(result.nextStreet).toBe('flop');
  });

  it('should trigger resolution on river (round 3) when all acted', () => {
    const players = makePlayers(2);
    const result = checkRoundEnd(players, 0, 3);
    expect(result.ended).toBe(true);
    expect(result.reason).toBe('resolution');
  });

  it('should not end round when there are unresolved players', () => {
    const players = makePlayers(3);
    players[1].actedThisRound = false;
    const result = checkRoundEnd(players, 0, 0);
    expect(result.ended).toBe(false);
  });

  it('should not end when active player has not matched highest bet', () => {
    const players = makePlayers(3);
    players[0].betThisRound = 10;
    players[1].betThisRound = 5; // has not matched
    players[2].folded = true;
    const result = checkRoundEnd(players, 10, 0);
    expect(result.ended).toBe(false);
  });

  it('should handle all-in scenarios correctly', () => {
    const players = makePlayers(3);
    players[0].allIn = true;
    players[0].betThisRound = 100;
    players[1].betThisRound = 100;
    players[2].folded = true;
    // P1 is active, acted, and matched highest bet
    const result = checkRoundEnd(players, 100, 1);
    expect(result.ended).toBe(true);
    expect(result.reason).toBe('next_street');
    expect(result.nextStreet).toBe('turn');
  });

  it('should map correct next streets', () => {
    const players = makePlayers(2);
    
    // Round 0 → flop
    expect(checkRoundEnd(players, 0, 0).nextStreet).toBe('flop');
    
    // Round 1 → turn
    expect(checkRoundEnd(players, 0, 1).nextStreet).toBe('turn');
    
    // Round 2 → river
    expect(checkRoundEnd(players, 0, 2).nextStreet).toBe('river');
    
    // Round 3 → null (resolution)
    expect(checkRoundEnd(players, 0, 3).nextStreet).toBeNull();
  });
});
