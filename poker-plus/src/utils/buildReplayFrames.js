/**
 * Converts a savedGame object into a sequence of animation frames.
 * Each frame is a snapshot of the table state at a specific moment.
 */

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function extractStreetLabel(text) {
  if (!text) return '翻牌前';
  if (text.includes('Flop') || text.includes('翻牌')) return '翻牌';
  if (text.includes('Turn') || text.includes('转牌')) return '转牌';
  if (text.includes('River') || text.includes('河牌')) return '河牌';
  if (text.includes('结算') || text.includes('Showdown')) return '摊牌';
  return '翻牌前';
}

function applyAction(playerStates, entry) {
  // Reset all animation flags
  playerStates.forEach(ps => { ps.chipsToAnimate = 0; });

  const target = playerStates.find(ps => ps.name === entry.player);
  if (!target) return;

  const action = entry.action || '';

  if (action === 'Fold') {
    target.folded = true;
  } else if (action === 'Check') {
    // no chip movement
  } else if (action.startsWith('Call')) {
    const amount = parseFloat(action.split(' ')[1]) || 0;
    target.invested += amount;
    target.betThisRound = (target.betThisRound || 0) + amount;
    target.chipsToAnimate = amount;
  } else if (action.startsWith('Bet')) {
    const amount = parseFloat(action.split(' ')[1]) || 0;
    target.invested += amount;
    target.betThisRound = amount;
    target.chipsToAnimate = amount;
  } else if (action.startsWith('Raise to')) {
    const totalBet = parseFloat(action.split(' ')[2]) || 0;
    const extra = Math.max(0, totalBet - (target.betThisRound || 0));
    target.invested += extra;
    target.betThisRound = totalBet;
    target.chipsToAnimate = extra;
  } else if (action.startsWith('All-in')) {
    const amount = parseFloat(action.split(' ')[1]) || 0;
    const extra = Math.max(0, amount - (target.betThisRound || 0));
    target.invested += extra;
    target.betThisRound = amount;
    target.allIn = true;
    target.chipsToAnimate = extra;
  }
}

/**
 * Builds the animation frame sequence from a savedGame object.
 * Compatible with both live game state and community post replay_data.savedGame.
 */
export function buildReplayFrames(savedGame) {
  const {
    history = [],
    players = [],
    communityCards = [],
    sbAmount = 1,
    bbAmount = 2,
    heroIndex = 0,
    heroCards = [],
    playerStacks = {},
    playerNames = {},
  } = savedGame;

  // Build initial player states
  const playerStates = players.map((p, i) => {
    const isHero = p.isHero || i === heroIndex;
    const name = playerNames[p.id] ?? p.name ?? `P${i + 1}`;
    const stack = playerStacks[p.id] ?? p.stackSize ?? 0;
    const cards = isHero
      ? heroCards.filter(Boolean)
      : (p.knownCards || []).filter(Boolean);
    return {
      id: p.id ?? i,
      name,
      isHero,
      stack,
      cards,
      invested: 0,
      betThisRound: 0,
      folded: false,
      allIn: false,
      chipsToAnimate: 0,
    };
  });

  const frames = [];
  let boardCards = [];
  let pot = sbAmount + bbAmount;
  let streetLabel = '翻牌前';

  // Frame 0: initial state
  frames.push({
    playerStates: deepClone(playerStates),
    boardCards: [],
    newCards: [],
    pot,
    activeEntry: null,
    type: 'initial',
    streetLabel: '翻牌前',
    label: '翻牌前',
  });

  history.forEach(entry => {
    if (entry.isDivider) {
      if (entry.text?.includes('结算')) {
        // showdown frame — no board change
        frames.push({
          playerStates: deepClone(playerStates),
          boardCards: [...boardCards],
          newCards: [],
          pot,
          activeEntry: null,
          type: 'showdown',
          streetLabel: '摊牌',
          label: '摊牌',
        });
        return;
      }

      // New street — deal board cards
      const newCards = entry.cards || [];
      boardCards = [...boardCards, ...newCards];
      // Reset per-street betting
      playerStates.forEach(ps => { ps.betThisRound = 0; });
      playerStates.forEach(ps => { ps.chipsToAnimate = 0; });

      streetLabel = extractStreetLabel(entry.text);

      frames.push({
        playerStates: deepClone(playerStates),
        boardCards: [...boardCards],
        newCards: [...newCards],
        pot,
        activeEntry: null,
        type: 'street_divider',
        streetLabel,
        label: streetLabel,
      });
    } else if (entry.isWinLog) {
      frames.push({
        playerStates: deepClone(playerStates),
        boardCards: [...boardCards],
        newCards: [],
        pot: entry.pot || pot,
        activeEntry: entry,
        type: 'win',
        streetLabel: '结算',
        label: entry.action || '结算',
      });
      pot = entry.pot || pot;
    } else if (entry.action) {
      // Determine street from entry.round
      if (entry.round) streetLabel = extractStreetLabel(entry.round);
      pot = entry.pot || pot;
      applyAction(playerStates, entry);

      frames.push({
        playerStates: deepClone(playerStates),
        boardCards: [...boardCards],
        newCards: [],
        pot,
        activeEntry: entry,
        type: 'action',
        streetLabel,
        label: '',
      });
    }
  });

  return frames;
}
