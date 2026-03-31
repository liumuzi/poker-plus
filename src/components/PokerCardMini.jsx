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

  // Scale rank/suit text proportionally to card width
  const rankSize  = Math.round(width * 0.27);
  const suitSize  = Math.round(width * 0.48);
  const topOffset = Math.round(width * 0.065);
  const leftOffset = Math.round(width * 0.10);

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-150 active:scale-95 select-none rounded-2xl border
        ${data
          ? 'bg-white border-slate-200 shadow-md hover:shadow-lg'
          : 'border-transparent hover:opacity-80'}
        ${dim ? 'opacity-35' : ''}`}
      style={{ width: `${width}px`, aspectRatio: '5/7' }}
    >
      {data ? (
        <>
          {/* rank — top-left */}
          <div
            className={`absolute leading-none font-black ${data.colorClass}`}
            style={{ top: topOffset, left: leftOffset, fontSize: rankSize }}
          >
            {data.rank}
          </div>
          {/* suit — center */}
          <div
            className={`absolute inset-0 flex items-center justify-center leading-none ${data.colorClass}`}
            style={{ fontSize: suitSize }}
          >
            {data.symbol}
          </div>
        </>
      ) : (
        /* card back: red with cross-hatch pattern */
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-red-700">
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
          <div className="absolute inset-[4px] rounded-xl border border-white/30" />
        </div>
      )}
    </div>
  );
}
