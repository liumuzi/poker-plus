import React, { useEffect, useRef, useState } from 'react';
import PokerCardMini from '../PokerCardMini';

const CARD_W = 30;
const CARD_H = 42;
const SLOT_COUNT = 5;

/**
 * Renders the 5-slot community card area in the center of the table.
 * New cards (newCards) fly in with a brief animation.
 */
export default function CommunityCardArea({ boardCards = [], newCards = [] }) {
  const [animated, setAnimated] = useState(new Set());
  const prevNewCards = useRef([]);

  useEffect(() => {
    if (newCards.length > 0 && newCards !== prevNewCards.current) {
      const keys = newCards.map((c, i) => `${c.rank}${c.suit}-${boardCards.length - newCards.length + i}`);
      setAnimated(new Set(keys));
      prevNewCards.current = newCards;
      const t = setTimeout(() => setAnimated(new Set()), 400);
      return () => clearTimeout(t);
    }
  }, [newCards, boardCards.length]);

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
      {/* Flop group */}
      <div style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2].map(i => {
          const card = boardCards[i];
          const isNew = newCards.some(c => c === boardCards[i]);
          const key = card ? `${card.rank}${card.suit}-${i}` : null;
          const isAnimating = key && animated.has(key);
          return (
            <div
              key={i}
              style={{
                width: CARD_W,
                height: CARD_H,
                animation: isAnimating ? 'cardFlyIn 0.3s ease-out' : undefined,
              }}
            >
              {card
                ? <PokerCardMini card={card} width={CARD_W} patternId={`cca-${i}`} />
                : <EmptySlot />
              }
            </div>
          );
        })}
      </div>

      {/* Gap between flop and turn */}
      <div style={{ width: 6 }} />

      {/* Turn */}
      {(() => {
        const card = boardCards[3];
        const isNew = newCards.some(c => c === boardCards[3]);
        const key = card ? `${card.rank}${card.suit}-3` : null;
        const isAnimating = key && animated.has(key);
        return (
          <div
            style={{
              width: CARD_W, height: CARD_H,
              animation: isAnimating ? 'cardFlyIn 0.3s ease-out' : undefined,
            }}
          >
            {card ? <PokerCardMini card={card} width={CARD_W} patternId="cca-3" /> : <EmptySlot />}
          </div>
        );
      })()}

      {/* Gap between turn and river */}
      <div style={{ width: 6 }} />

      {/* River */}
      {(() => {
        const card = boardCards[4];
        const key = card ? `${card.rank}${card.suit}-4` : null;
        const isAnimating = key && animated.has(key);
        return (
          <div
            style={{
              width: CARD_W, height: CARD_H,
              animation: isAnimating ? 'cardFlyIn 0.3s ease-out' : undefined,
            }}
          >
            {card ? <PokerCardMini card={card} width={CARD_W} patternId="cca-4" /> : <EmptySlot />}
          </div>
        );
      })()}
    </div>
  );
}

function EmptySlot() {
  return (
    <div style={{
      width: CARD_W,
      height: CARD_H,
      border: '1px dashed rgba(255,255,255,0.15)',
      borderRadius: 4,
      background: 'rgba(0,0,0,0.25)',
    }} />
  );
}
