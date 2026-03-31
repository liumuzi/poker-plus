import { describe, it, expect } from 'vitest';
import {
  createInitialPlayers,
  createInitialPlayersV2,
  processAction,
  checkRoundEnd,
  findNextActor,
  transitionToNextStreet,
} from '../engine/gameEngine';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Build a minimal players array for tests */
function makePlayers(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `P${i}`,
    folded: false,
    allIn: false,
    betThisRound: 0,
    totalInvested: 0,
    actedThisRound: false,
    isHero: i === 0,
    knownCards: [null, null],
  }));
}

// ─────────────────────────────────────────────────────────────
// createInitialPlayers
// ─────────────────────────────────────────────────────────────

describe('createInitialPlayers', () => {
  it('creates the correct number of players', () => {
    const { players } = createInitialPlayers(6, 2, [null, null], 50, 100);
    expect(players).toHaveLength(6);
  });

  it('marks the hero player correctly', () => {
    const { players } = createInitialPlayers(6, 2, [null, null], 50, 100);
    expect(players[2].isHero).toBe(true);
    expect(players.filter((p) => p.isHero)).toHaveLength(1);
  });

  it('assigns blinds to last two players (SB, BB)', () => {
    const sb = 50, bb = 100;
    const { players, potSize, highestBet } = createInitialPlayers(6, 2, [null, null], sb, bb);
    expect(players[4].betThisRound).toBe(sb); // SB = count-2
    expect(players[5].betThisRound).toBe(bb); // BB = count-1
    expect(potSize).toBe(sb + bb);
    expect(highestBet).toBe(bb);
  });

  it('stores hero cards on the hero player', () => {
    const heroCards = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }];
    const { players } = createInitialPlayers(6, 2, heroCards, 50, 100);
    expect(players[2].knownCards).toEqual(heroCards);
  });

  it('creates initial history with SB, BB entries and preflop divider', () => {
    const { history } = createInitialPlayers(6, 2, [null, null], 50, 100);
    expect(history).toHaveLength(3);
    expect(history[2].isDivider).toBe(true);
  });

  it('handles 2-player edge case', () => {
    const { players } = createInitialPlayers(2, 0, [null, null], 25, 50);
    expect(players).toHaveLength(2);
  });

  it('clamps invalid player counts to default (6)', () => {
    const { players } = createInitialPlayers(1, 0, [null, null], 25, 50);
    expect(players).toHaveLength(6);
  });
});

// ─────────────────────────────────────────────────────────────
// createInitialPlayersV2
// ─────────────────────────────────────────────────────────────

describe('createInitialPlayersV2', () => {
  it('creates the correct number of players', () => {
    const { players } = createInitialPlayersV2(5, 2, [null, null]);
    expect(players).toHaveLength(5);
  });

  it('names player 0 as BTN', () => {
    const { players } = createInitialPlayersV2(4, 2, [null, null]);
    expect(players[0].name).toBe('BTN');
  });

  it('names the hero player "Hero"', () => {
    const { players } = createInitialPlayersV2(4, 2, [null, null]);
    expect(players[2].name).toBe('Hero');
    expect(players[2].isHero).toBe(true);
  });

  it('names other players as "玩家N"', () => {
    const { players } = createInitialPlayersV2(4, 2, [null, null]);
    expect(players[1].name).toBe('玩家1');
    expect(players[3].name).toBe('玩家3');
  });

  it('respects custom names', () => {
    const { players } = createInitialPlayersV2(3, 1, [null, null], { 0: 'Alice', 1: 'Bob' });
    expect(players[0].name).toBe('Alice');
    // heroIndex=1 → 'Hero' takes precedence over custom
    expect(players[1].name).toBe('Bob');
  });

  it('starts with zero pot', () => {
    const { potSize, highestBet } = createInitialPlayersV2(3, 0, [null, null]);
    expect(potSize).toBe(0);
    expect(highestBet).toBe(0);
  });

  it('stores hero cards on the hero player', () => {
    const heroCards = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }];
    const { players } = createInitialPlayersV2(3, 1, heroCards);
    expect(players[1].knownCards).toEqual(heroCards);
  });

  it('initialises stackSize to 0 for all players', () => {
    const { players } = createInitialPlayersV2(3, 0, [null, null]);
    players.forEach((p) => expect(p.stackSize).toBe(0));
  });

  it('clamps invalid player counts to default (2)', () => {
    const { players } = createInitialPlayersV2(1, 0, [null, null]);
    expect(players).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────
// processAction
// ─────────────────────────────────────────────────────────────

describe('processAction', () => {
  it('Fold marks the current player as folded', () => {
    const players = makePlayers(3);
    const result = processAction(players, 0, 100, 50, 0, 'Fold', 0);
    expect(result.players[0].folded).toBe(true);
    expect(result.historyEntry.action).toBe('Fold');
  });

  it('Check when no bet is outstanding', () => {
    const players = makePlayers(3);
    const result = processAction(players, 1, 100, 0, 0, 'Check/Call', 0);
    expect(result.historyEntry.action).toBe('Check');
    expect(result.potSize).toBe(100); // unchanged
  });

  it('Call when there is an outstanding bet', () => {
    const players = makePlayers(3);
    players[1].betThisRound = 0; // owes 50
    const result = processAction(players, 1, 100, 50, 0, 'Check/Call', 0);
    expect(result.historyEntry.action).toBe('Call 50');
    expect(result.players[1].betThisRound).toBe(50);
    expect(result.potSize).toBe(150);
  });

  it('Bet increases the pot and sets highestBet', () => {
    const players = makePlayers(3);
    const result = processAction(players, 0, 100, 0, 0, 'Bet', 75);
    expect(result.players[0].betThisRound).toBe(75);
    expect(result.highestBet).toBe(75);
    expect(result.potSize).toBe(175);
    expect(result.historyEntry.action).toBe('Bet 75');
  });

  it('Bet returns null if there is already a highest bet', () => {
    const players = makePlayers(3);
    const result = processAction(players, 0, 100, 50, 0, 'Bet', 75);
    expect(result).toBeNull();
  });

  it('Raise increases the pot and highestBet', () => {
    const players = makePlayers(3);
    const result = processAction(players, 0, 100, 50, 0, 'Raise', 150);
    expect(result.highestBet).toBe(150);
    expect(result.historyEntry.action).toBe('Raise to 150');
    expect(result.potSize).toBe(250);
  });

  it('Raise returns null if amount <= highestBet', () => {
    const players = makePlayers(3);
    const result = processAction(players, 0, 100, 50, 0, 'Raise', 40);
    expect(result).toBeNull();
  });

  it('Bet/Raise resets actedThisRound for other players', () => {
    const players = makePlayers(3);
    players[1].actedThisRound = true;
    players[2].actedThisRound = true;
    const result = processAction(players, 0, 100, 0, 0, 'Bet', 75);
    expect(result.players[1].actedThisRound).toBe(false);
    expect(result.players[2].actedThisRound).toBe(false);
  });

  it('marks the acting player as actedThisRound', () => {
    const players = makePlayers(3);
    const result = processAction(players, 2, 100, 0, 0, 'Check/Call', 0);
    expect(result.players[2].actedThisRound).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// checkRoundEnd
// ─────────────────────────────────────────────────────────────

describe('checkRoundEnd', () => {
  it('returns ended=false when a player has not acted', () => {
    const players = makePlayers(3);
    players[0].actedThisRound = true;
    players[1].actedThisRound = true;
    // players[2] has not acted yet
    const result = checkRoundEnd(players, 0, 0);
    expect(result.ended).toBe(false);
  });

  it('returns ended=false when a player has not matched the highest bet', () => {
    const players = makePlayers(3);
    players.forEach((p) => { p.actedThisRound = true; p.betThisRound = 50; });
    players[2].betThisRound = 25; // still needs to call
    const result = checkRoundEnd(players, 50, 0);
    expect(result.ended).toBe(false);
  });

  it('returns resolution when only one non-folded player remains', () => {
    const players = makePlayers(3);
    players[1].folded = true;
    players[2].folded = true;
    const result = checkRoundEnd(players, 0, 0);
    expect(result.ended).toBe(true);
    expect(result.reason).toBe('resolution');
  });

  it('returns next_street after preflop with all players acted', () => {
    const players = makePlayers(3);
    players.forEach((p) => { p.actedThisRound = true; p.betThisRound = 100; });
    const result = checkRoundEnd(players, 100, 0); // bettingRound=0 = preflop
    expect(result.ended).toBe(true);
    expect(result.reason).toBe('next_street');
    expect(result.nextStreet).toBe('flop');
  });

  it('returns resolution after the river', () => {
    const players = makePlayers(3);
    players.forEach((p) => { p.actedThisRound = true; p.betThisRound = 100; });
    const result = checkRoundEnd(players, 100, 3); // bettingRound=3 = river
    expect(result.ended).toBe(true);
    expect(result.reason).toBe('resolution');
  });

  it('ignores folded players for the acted check', () => {
    const players = makePlayers(3);
    players[0].folded = true;
    players[1].actedThisRound = true;
    players[1].betThisRound = 100;
    players[2].actedThisRound = true;
    players[2].betThisRound = 100;
    const result = checkRoundEnd(players, 100, 0);
    expect(result.ended).toBe(true);
    expect(result.reason).toBe('next_street');
  });
});

// ─────────────────────────────────────────────────────────────
// findNextActor
// ─────────────────────────────────────────────────────────────

describe('findNextActor', () => {
  it('returns the next player index', () => {
    const players = makePlayers(4);
    expect(findNextActor(0, players)).toBe(1);
    expect(findNextActor(3, players)).toBe(0); // wraps around
  });

  it('skips folded players', () => {
    const players = makePlayers(4);
    players[1].folded = true;
    players[2].folded = true;
    expect(findNextActor(0, players)).toBe(3);
  });

  it('skips all-in players', () => {
    const players = makePlayers(4);
    players[1].allIn = true;
    expect(findNextActor(0, players)).toBe(2);
  });

  it('returns null when no actor is available', () => {
    const players = makePlayers(3);
    players.forEach((p) => { p.folded = true; });
    expect(findNextActor(0, players)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// transitionToNextStreet
// ─────────────────────────────────────────────────────────────

describe('transitionToNextStreet', () => {
  const flopCards = [
    { rank: 'A', suit: 's' },
    { rank: 'K', suit: 'h' },
    { rank: 'Q', suit: 'd' },
  ];

  it('adds cards to communityCards', () => {
    const players = makePlayers(3);
    const result = transitionToNextStreet(players, [], 0, 100, flopCards, 3);
    expect(result.communityCards).toHaveLength(3);
    expect(result.communityCards).toEqual(flopCards);
  });

  it('increments bettingRound', () => {
    const players = makePlayers(3);
    const result = transitionToNextStreet(players, [], 0, 100, flopCards, 3);
    expect(result.bettingRound).toBe(1);
  });

  it('resets betThisRound and actedThisRound for each player', () => {
    const players = makePlayers(3);
    players.forEach((p) => { p.betThisRound = 50; p.actedThisRound = true; });
    const result = transitionToNextStreet(players, [], 0, 200, flopCards, 3);
    result.players.forEach((p) => {
      expect(p.betThisRound).toBe(0);
      expect(p.actedThisRound).toBe(false);
    });
  });

  it('returns a history divider entry', () => {
    const players = makePlayers(3);
    const result = transitionToNextStreet(players, [], 0, 100, flopCards, 3);
    expect(result.historyEntry.isDivider).toBe(true);
    expect(result.historyEntry.text).toContain('翻牌');
  });

  it('calls resolution when only one non-folded player remains', () => {
    const players = makePlayers(3);
    players[1].folded = true;
    players[2].folded = true;
    const result = transitionToNextStreet(players, [], 0, 100, flopCards, 3);
    expect(result.nextAction.type).toBe('resolution');
  });

  it('calls resolution when bettingRound reaches showdown (4)', () => {
    const players = makePlayers(3);
    const result = transitionToNextStreet(players, [], 3, 100, [], 3);
    expect(result.nextAction.type).toBe('resolution');
  });

  it('picks next card when all players are all-in', () => {
    const players = makePlayers(3);
    players.forEach((p) => { p.allIn = true; });
    const result = transitionToNextStreet(players, [], 0, 100, flopCards, 3); // preflop→flop
    expect(result.nextAction.type).toBe('pick_cards');
    expect(result.nextAction.target).toBe('turn');
  });

  it('continues to next actor when players can still act', () => {
    const players = makePlayers(3);
    const result = transitionToNextStreet(players, [], 0, 100, flopCards, 3);
    expect(result.nextAction.type).toBe('continue');
    expect(typeof result.nextAction.nextTurn).toBe('number');
  });
});
