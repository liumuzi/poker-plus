import React from 'react';
import { getCardDisplayData } from '../engine/cardUtils';

/**
 * Mini playing-card component used across setup and the table view.
 *
 * Shows a face-up card (rank top-left + large suit in center) when `card`
 * is provided, otherwise shows a red cross-pattern card back.
 *
 * @param {{ card, width, dim, onClick, patternId }} props
 *   - card      {rank, suit} object or null
 *   - width     pixel width of the card (default 46); height is auto via 5:7 aspect ratio
 *   - dim       grey-out the card (e.g. community cards not yet on the board)
 *   - onClick   click handler
 *   - patternId unique string used to avoid duplicate SVG <pattern> ids on the same page
 */
export default function PokerCardMini({ card, width = 46, dim = false, onClick, patternId = '0' }) {
  const data = getCardDisplayData(card);

  // Scale proportionally to card width
  const rankSize   = Math.round(width * 0.28);
  const cornerSuit = Math.round(width * 0.20);
  const centerSuit = Math.round(width * 0.42);
  const pad        = Math.max(2, Math.round(width * 0.09));
  // Corner radius: standard poker card has ~4% of width
  const radius     = Math.max(3, Math.round(width * 0.10));

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-150 active:scale-95 select-none border
        ${data
          ? 'bg-white border-slate-300 shadow-md hover:shadow-lg'
          : 'border-transparent hover:opacity-80'}
        ${dim ? 'opacity-35' : ''}`}
      style={{ width: `${width}px`, aspectRatio: '5/7', borderRadius: radius }}
    >
      {data ? (
        <>
          {/* ── top-left corner: rank only ── */}
          <div
            className={`absolute leading-none font-black ${data.colorClass}`}
            style={{ top: pad, left: pad, fontSize: rankSize }}
          >
            {data.rank}
          </div>

          {/* ── center: large suit ── */}
          <div
            className={`absolute inset-0 flex items-center justify-center leading-none ${data.colorClass}`}
            style={{ fontSize: centerSuit }}
          >
            {data.symbol}
          </div>

          {/* ── bottom-right corner: rank mirrored 180° ── */}
          <div
            className={`absolute leading-none font-black ${data.colorClass}`}
            style={{
              bottom: pad, right: pad,
              fontSize: rankSize,
              transform: 'rotate(180deg)',
            }}
          >
            {data.rank}
          </div>
        </>
      ) : (
        /* card back: red with cross-hatch pattern */
        <div
          className="absolute inset-0 overflow-hidden bg-red-700"
          style={{ borderRadius: radius }}
        >
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id={`pkr-mini-cross-${patternId}`}
                x="0" y="0" width="10" height="10"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" x2="10" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                <line x1="10" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#pkr-mini-cross-${patternId})`}/>
          </svg>
          <div
            className="absolute border border-white/30"
            style={{ inset: 3, borderRadius: Math.max(1, radius - 2) }}
          />
        </div>
      )}
    </div>
  );
}
