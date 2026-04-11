import { describe, it, expect } from 'vitest';
import { MOCK_POSTS } from '../data/mockPosts';

// ─────────────────────────────────────────────────────────────
// Mock 数据正确性验证
// ─────────────────────────────────────────────────────────────

/**
 * 根据 history 条目计算底池变化，验证每一步 pot 值的一致性
 * 注意：mock 数据 history 可能不包含盲注条目，
 * 所以使用 "差值递推" 方式 —— 从第一个已知 pot 开始递推验证后续值
 */
function verifyPotProgression(history) {
  const actionEntries = history.filter(e => !e.isDivider && !e.isWinLog && e.pot !== undefined);
  if (actionEntries.length < 2) return { valid: true, finalPot: actionEntries[0]?.pot || 0 };

  const bets = {}; // player -> betThisRound
  let lastPot = null;
  let currentStreetStartPot = 0;

  for (const entry of history) {
    if (entry.isDivider) {
      if (entry.text.includes('进入') || entry.text.includes('结算')) {
        // 新街重置 betThisRound
        for (const key of Object.keys(bets)) bets[key] = 0;
        if (lastPot !== null) currentStreetStartPot = lastPot;
      }
      continue;
    }
    if (entry.isWinLog) continue;

    const { player, action, pot: expectedPot } = entry;
    if (!bets[player]) bets[player] = 0;

    let added = 0;
    if (action === 'Check' || action === 'Fold') {
      added = 0;
    } else if (action.startsWith('Call ')) {
      const callAmt = parseFloat(action.replace('Call ', ''));
      added = callAmt;
      bets[player] += callAmt;
    } else if (action.startsWith('Bet ')) {
      const betAmt = parseFloat(action.replace('Bet ', ''));
      added = betAmt - bets[player];
      bets[player] = betAmt;
    } else if (action.startsWith('Raise to ')) {
      const raiseTotal = parseFloat(action.replace('Raise to ', ''));
      added = raiseTotal - bets[player];
      bets[player] = raiseTotal;
    } else if (action.startsWith('小盲 $')) {
      const sbAmt = parseFloat(action.replace('小盲 $', ''));
      added = sbAmt;
      bets[player] = sbAmt;
    } else if (action.startsWith('大盲 $')) {
      const bbAmt = parseFloat(action.replace('大盲 $', ''));
      added = bbAmt;
      bets[player] = bbAmt;
    }

    if (lastPot !== null && expectedPot !== undefined) {
      const computedPot = lastPot + added;
      if (computedPot !== expectedPot) {
        return { valid: false, action, player, expected: expectedPot, actual: computedPot, prevPot: lastPot, added };
      }
    }
    if (expectedPot !== undefined) lastPot = expectedPot;
  }
  return { valid: true, finalPot: lastPot };
}

describe('MOCK_POSTS data correctness', () => {
  it('should have correct post count', () => {
    expect(MOCK_POSTS.length).toBe(5);
  });

  describe('Post #2 (replay: 慢玩翻船)', () => {
    const post = MOCK_POSTS.find(p => p.id === '2');

    it('should exist and be a replay type', () => {
      expect(post).toBeDefined();
      expect(post.type).toBe('replay');
    });

    it('should have a positive result (Hero won with quads)', () => {
      // Hero has AA, board has AA - that's quad Aces, Hero raises and villain folds
      // Hero should have a positive result, not negative
      expect(post.replay_data.result).toMatch(/^\+/);
    });

    it('should have correct pot progression in savedGame history', () => {
      const result = verifyPotProgression(post.replay_data.savedGame.history);
      expect(result.valid).toBe(true);
    });

    it('should have savedGame.potSize matching final pot', () => {
      const history = post.replay_data.savedGame.history;
      const winLog = history.find(e => e.isWinLog);
      expect(winLog).toBeDefined();
      expect(winLog.pot).toBe(post.replay_data.savedGame.potSize);
    });

    it('should have pot = 121 after Hero raise to 72 on river', () => {
      // Pre-river pot = 25
      // Player2 Bet 24 → pot = 49
      // Hero Raise to 72 → added = 72, pot = 49 + 72 = 121
      const history = post.replay_data.savedGame.history;
      const heroRaise = history.find(e => e.action === 'Raise to 72');
      expect(heroRaise).toBeDefined();
      expect(heroRaise.pot).toBe(121);
    });

    it('should have win log matching final pot', () => {
      const history = post.replay_data.savedGame.history;
      const winLog = history.find(e => e.isWinLog);
      expect(winLog.action).toContain('$121');
    });
  });

  describe('Post #4 (replay: bluff catch)', () => {
    const post = MOCK_POSTS.find(p => p.id === '4');

    it('should exist and be a replay type', () => {
      expect(post).toBeDefined();
      expect(post.type).toBe('replay');
    });

    it('should have correct result in bb', () => {
      // Hero invested: 5 (preflop call) + 10 (flop call) + 27 (river call) = 42
      // Won pot = 85
      // Net = 85 - 42 = 43
      // BB = 2, so result = 43/2 = 21.5bb
      expect(post.replay_data.result).toBe('+21.5bb');
    });

    it('should have correct pot progression in savedGame history', () => {
      const result = verifyPotProgression(post.replay_data.savedGame.history);
      expect(result.valid).toBe(true);
    });

    it('should have savedGame.potSize matching final pot', () => {
      const history = post.replay_data.savedGame.history;
      const winLog = history.find(e => e.isWinLog);
      expect(winLog.pot).toBe(post.replay_data.savedGame.potSize);
    });
  });

  describe('All replay posts should have consistent streets data', () => {
    const replayPosts = MOCK_POSTS.filter(p => p.type === 'replay');

    it.each(replayPosts.map(p => [p.title, p]))('"%s" should have matching heroCards', (_, post) => {
      const rd = post.replay_data;
      expect(rd.heroCards).toBeDefined();
      expect(rd.heroCards.length).toBe(2);
      // savedGame heroCards should match
      if (rd.savedGame) {
        expect(rd.savedGame.heroCards[0].rank).toBe(rd.heroCards[0].rank);
        expect(rd.savedGame.heroCards[0].suit).toBe(rd.heroCards[0].suit);
      }
    });
  });
});
