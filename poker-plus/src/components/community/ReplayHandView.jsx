import React, { useRef, useState } from 'react';
import PokerCardMini from '../PokerCardMini';
import { parseAction } from '../../utils/formatting';
import ReplayPlayer from '../replay/ReplayPlayer';

let _uid = 0;

/** Single action bubble — mirrors SummaryScreen style but scaled for community */
function ActionBubble({ action, isHero, player }) {
  const parts = parseAction(action);
  // 缩写名字：最多4个字符，避免溢出
  const shortName = player ? player.slice(0, 4) : '?';
  if (isHero) {
    return (
      <div className="flex w-full justify-end items-start gap-1 pl-1">
        <div className="relative bg-yellow-400 text-black px-1.5 py-0.5 rounded shadow flex flex-col items-center min-w-[28px] text-center">
          {parts.map((p, i) => (
            <div key={i} className="text-[8px] font-extrabold leading-tight">{p}</div>
          ))}
          <div className="absolute top-1.5 -right-[3px] border-t-[3px] border-t-transparent border-l-[3px] border-l-yellow-400 border-b-[3px] border-b-transparent" />
        </div>
        <div className="flex flex-col items-center shrink-0 w-6">
          <div className="w-5 h-5 rounded-full bg-slate-800 border border-yellow-500 flex items-center justify-center text-[8px]">👑</div>
          <div className="text-yellow-500 text-[6px] font-bold -mt-1.5 z-10">Hero</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex w-full justify-start items-start gap-1 pr-1">
      <div className="flex flex-col items-center shrink-0 w-6">
        <div className="w-5 h-5 rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center text-[6px] text-white font-black leading-none text-center px-0.5">
          {shortName}
        </div>
      </div>
      <div className="relative bg-white text-slate-900 px-1.5 py-0.5 rounded shadow flex flex-col items-center min-w-[28px] text-center">
        <div className="absolute top-1.5 -left-[3px] border-t-[3px] border-t-transparent border-r-[3px] border-r-white border-b-[3px] border-b-transparent" />
        {parts.map((p, i) => (
          <div key={i} className="text-[8px] font-extrabold leading-tight">{p}</div>
        ))}
      </div>
    </div>
  );
}

/**
 * Inline mini poker hand display for replay posts.
 * Shows hero hole cards, meta info, result, and a visual per-street roadmap.
 */
export default function ReplayHandView({ replayData }) {
  const idRef = useRef(`rhv-${_uid++}`);
  const [showReplay, setShowReplay] = useState(false);

  if (!replayData) return null;

  const {
    heroCards      = [],
    boardCards     = [],
    position,
    effectiveStack,
    potSize,
    result,
    actions        = [],
    streets        = [],
    savedGame,
  } = replayData;

  const resultPositive = result && result.startsWith('+');
  const resultNegative = result && result.startsWith('-');

  // Use streets (visual) when available, fall back to text actions
  const hasStreets = streets && streets.length > 0;

  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
      {/* ── Hero cards + board + result ── */}
      <div className="flex items-center gap-4 mb-3">
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-1.5">Hero</p>
          <div className="flex gap-1">
            {heroCards.map((card, i) => (
              <PokerCardMini key={i} card={card} width={34} patternId={`${idRef.current}-h${i}`} />
            ))}
          </div>
        </div>

        {boardCards.length > 0 && (
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-1.5">
              公共牌 ({boardCards.length === 3 ? '翻牌' : boardCards.length === 4 ? '转牌' : '河牌'})
            </p>
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-1" style={{ width: 'max-content' }}>
                {boardCards.map((card, i) => (
                  <PokerCardMini key={i} card={card} width={30} patternId={`${idRef.current}-b${i}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="ml-auto flex flex-col items-center shrink-0">
            <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">结果</p>
            <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${
              resultPositive ? 'bg-emerald-900/60 text-emerald-400' :
              resultNegative ? 'bg-red-900/60 text-red-400' :
              'bg-gray-700 text-gray-300'
            }`}>
              {result}
            </span>
          </div>
        )}
      </div>

      {/* ── Meta badges ── */}
      <div className="flex gap-2 flex-wrap mb-3">
        {position && (
          <span className="text-xs text-gray-400 bg-gray-700 px-2.5 py-1 rounded-full">
            位置: <span className="text-white font-bold">{position}</span>
          </span>
        )}
        {effectiveStack && (
          <span className="text-xs text-gray-400 bg-gray-700 px-2.5 py-1 rounded-full">
            有效筹码: <span className="text-white font-bold">{effectiveStack}bb</span>
          </span>
        )}
        {potSize && (
          <span className="text-xs text-gray-400 bg-gray-700 px-2.5 py-1 rounded-full">
            底池: <span className="text-white font-bold">{potSize}bb</span>
          </span>
        )}
      </div>

      {/* ── Visual street roadmap (preferred) ── */}
      {hasStreets ? (
        <div className="overflow-x-auto no-scrollbar -mx-1">
          <div className="flex min-w-max border border-gray-700 rounded-lg overflow-hidden">
            {streets.map((street, si) => {
              const numCards = street.boardCards?.length || 0;
              // Each card 22px + 2px gap, plus 8px horizontal padding
              const colW = Math.max(72, numCards * 24 + 8);
              return (
                <div
                  key={si}
                  className="flex flex-col border-r border-gray-700 last:border-r-0 shrink-0"
                  style={{ width: colW }}
                >
                  {/* Street header */}
                  <div className="bg-gray-900 border-b border-gray-700 py-1 text-center">
                    <div className="text-[9px] text-gray-400 font-bold">{street.name}</div>
                    {street.startPot > 0 && (
                      <div className="text-amber-400 text-[9px] font-black">${street.startPot}</div>
                    )}
                  </div>

                  {/* Board cards — single row, horizontally scrollable if needed */}
                  {street.boardCards?.length > 0 && (
                    <div className="bg-gray-800 border-b border-gray-700 py-1 overflow-x-auto no-scrollbar">
                      <div className="flex items-center gap-0.5 px-1" style={{ width: 'max-content' }}>
                        {street.boardCards.map((c, ci) => (
                          <PokerCardMini
                            key={ci}
                            card={c}
                            width={20}
                            patternId={`${idRef.current}-s${si}-c${ci}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex-1 bg-gray-850 px-0.5 py-1.5 flex flex-col gap-1.5" style={{ backgroundColor: '#1a2235' }}>
                    {street.actions.map((act, ai) => (
                      <ActionBubble key={ai} action={act.action} isHero={act.isHero} player={act.player} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : actions.length > 0 ? (
        /* Fallback: text action list */
        <div className="flex flex-col gap-1.5">
          {actions.map((a, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-[10px] text-gray-500 shrink-0 w-12">{a.street}</span>
              <span className="text-xs text-gray-300">{a.desc}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── 播放动画按钮（需要完整 savedGame 数据）── */}
      {savedGame && (
        <button
          onClick={() => setShowReplay(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all text-white py-2.5 rounded-xl font-bold text-xs border border-slate-600"
        >
          <span className="text-base leading-none">▶</span>
          播放复盘动画
        </button>
      )}

      {/* ── 动画播放器弹层 ── */}
      {showReplay && savedGame && (
        <ReplayPlayer savedGame={savedGame} onClose={() => setShowReplay(false)} />
      )}
    </div>
  );
}
