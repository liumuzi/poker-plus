import React from 'react';
import CardBack from './CardBack';
import PokerCardMini from '../PokerCardMini';

const ACTION_COLORS = {
  Fold:     { bg: '#374151', text: '#9ca3af', label: '弃牌' },
  Check:    { bg: '#14532d', text: '#4ade80', label: '让牌' },
  Call:     { bg: '#14532d', text: '#4ade80' },
  Bet:      { bg: '#78350f', text: '#fbbf24' },
  Raise:    { bg: '#78350f', text: '#fbbf24' },
  'All-in': { bg: '#7c1d0e', text: '#fb923c', label: '全下' },
};

function getAC(action) {
  const verb = (action || '').split(' ')[0];
  return ACTION_COLORS[verb] || { bg: '#1f2937', text: '#e5e7eb' };
}

function formatAction(action) {
  if (!action) return '';
  if (action === 'Fold')              return '弃牌';
  if (action === 'Check')             return '让牌';
  if (action.startsWith('Call'))      return `跟注 $${action.split(' ')[1] || ''}`;
  if (action.startsWith('Bet'))       return `下注 $${action.split(' ')[1] || ''}`;
  if (action.startsWith('Raise to')) return `加注 $${action.split(' ')[2] || ''}`;
  if (action.startsWith('All-in'))   return `全下 $${action.split(' ')[1] || ''}`;
  return action;
}

/**
 * Compact badge-style player panel.
 * Shows: hole cards / name + stack / action bar
 */
export default function PlayerSeat({ playerState, isActive, actionEntry }) {
  const { name, isHero, stack, cards, folded, allIn } = playerState;
  const showAction = isActive && actionEntry?.action;
  const ac = showAction ? getAC(actionEntry.action) : null;
  const opacity = folded ? 0.38 : 1;

  const borderColor = isActive
    ? '#ffffff'
    : isHero
    ? '#3b82f6'
    : folded
    ? '#2d3748'
    : '#4b5563';

  const headerBg = isHero ? '#0f2744' : '#111827';

  return (
    <div style={{
      width: 112,
      opacity,
      borderRadius: 7,
      overflow: 'hidden',
      border: `1.5px solid ${borderColor}`,
      boxShadow: isActive
        ? '0 0 14px rgba(255,255,255,0.35), 0 0 4px rgba(255,255,255,0.2)'
        : isHero
        ? '0 0 10px rgba(59,130,246,0.4)'
        : '0 2px 8px rgba(0,0,0,0.6)',
      transition: 'box-shadow 0.2s, border-color 0.2s, opacity 0.2s',
      userSelect: 'none',
      /* subtle trapezoid: top slightly narrower */
      clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)',
    }}>

      {/* ── Cards row + action badge inline ── */}
      <div style={{
        background: 'rgba(0,0,0,0.45)',
        padding: '4px 7px 3px',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
      }}>
        {/* Hole cards */}
        {cards.length > 0
          ? cards.map((c, i) => (
              <PokerCardMini key={i} card={c} width={22} patternId={`ps-${name}-${i}`} />
            ))
          : [0, 1].map(i => (
              <CardBack key={i} width={22} height={32} />
            ))
        }

        {/* Action badge — fills the space to the right of the cards */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {showAction ? (
            <span style={{
              background: ac.bg,
              color: ac.text,
              fontSize: 8,
              fontWeight: 800,
              padding: '2px 4px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              letterSpacing: 0.1,
              animation: 'bubblePop 0.15s ease-out',
              maxWidth: 52,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {formatAction(actionEntry.action)}
            </span>
          ) : allIn && !folded ? (
            <span style={{
              background: '#ea580c', color: '#fff',
              fontSize: 7, fontWeight: 800, padding: '1px 3px', borderRadius: 3,
            }}>全下</span>
          ) : null}
        </div>
      </div>

      {/* ── Name + stack row ── */}
      <div style={{
        background: headerBg,
        padding: '3px 7px 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 3,
      }}>
        <span style={{
          color: isHero ? '#93c5fd' : '#e5e7eb',
          fontSize: 9,
          fontWeight: 800,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}>
          {isHero ? '◆ ' : ''}{name}
        </span>
        {folded ? (
          <span style={{ color: '#6b7280', fontSize: 8, fontWeight: 700, flexShrink: 0 }}>弃牌</span>
        ) : stack > 0 ? (
          <span style={{
            color: '#fbbf24',
            fontSize: 9,
            fontWeight: 700,
            flexShrink: 0,
            lineHeight: 1.3,
          }}>
            ${stack.toLocaleString()}
          </span>
        ) : null}
      </div>
    </div>
  );
}
