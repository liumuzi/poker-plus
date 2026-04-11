// src/utils/equity.js
import { Hand } from 'pokersolver';
import { RANKS } from '../constants/poker';

const SUITS = ['s','h','d','c'];

export function buildDeck() {
  return RANKS.flatMap((r) => SUITS.map((s) => ({ rank: r, suit: s })));
}

export function cardToKey(c) {
  return c.rank + c.suit;
}

/** Fisher-Yates partial shuffle — returns n random items from arr without modifying original */
export function shuffleSample(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > a.length - 1 - n; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(a.length - n);
}

function toPS(c) {
  return c.rank + c.suit;
}

/**
 * Monte Carlo equity calculation
 * @param {Array<{id, name, cards: [{rank,suit},{rank,suit}]}>} players
 * @param {Array<{rank,suit}>} boardCards  0-5 known board cards
 * @param {number} iterations
 * @returns {Array<{id, name, winPct, tiePct, equity, potOdds}>} | null
 */
export function calculateEquity(players, boardCards, iterations = 10000) {
  const validPlayers = players.filter(
    (p) => p.cards && p.cards.length === 2 && p.cards[0] && p.cards[1]
  );
  if (validPlayers.length < 2) return null;

  const usedKeys = new Set([
    ...validPlayers.flatMap((p) => p.cards.map(cardToKey)),
    ...boardCards.map(cardToKey),
  ]);

  const deck = buildDeck().filter((c) => !usedKeys.has(cardToKey(c)));
  const cardsNeeded = 5 - boardCards.length;

  const wins = new Array(validPlayers.length).fill(0);
  const ties = new Array(validPlayers.length).fill(0);

  for (let i = 0; i < iterations; i++) {
    const runOut = cardsNeeded > 0 ? shuffleSample(deck, cardsNeeded) : [];
    const board = [...boardCards, ...runOut];

    const hands = validPlayers.map((p) => {
      const seven = [...p.cards, ...board].map(toPS);
      return Hand.solve(seven);
    });

    const winners = Hand.winners(hands);
    if (winners.length === 1) {
      const idx = hands.indexOf(winners[0]);
      wins[idx]++;
    } else {
      winners.forEach((w) => {
        const idx = hands.indexOf(w);
        ties[idx]++;
      });
    }
  }

  const maxWin = Math.max(...wins);

  return validPlayers.map((p, i) => {
    const eq = (wins[i] + ties[i] * 0.5) / iterations * 100;
    return {
      id: p.id,
      name: p.name,
      winPct: +(wins[i] / iterations * 100).toFixed(1),
      tiePct: +(ties[i] / iterations * 100).toFixed(1),
      equity: +eq.toFixed(1),
      potOdds: +(100 - eq).toFixed(1),
      isWinner: wins[i] === maxWin,
    };
  });
}
