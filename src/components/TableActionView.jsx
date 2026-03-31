import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import PokerCardMini from './PokerCardMini';

/**
 * 桌面图 + 全区域滑动手势（虚化扑克牌动画）
 */

export default function TableActionView({ player, onAction }) {
  const { players, currentTurn, highestBet, history, bettingRound, presetCommunityCards, dispatch } = useGame();

  const dragX       = useMotionValue(0);
  const cardRotate  = useTransform(dragX, [-200, 0, 200], [-20, 0, 20]);
  const cardOpacity = useTransform(dragX, [-50, 0, 50], [0.92, 0, 0.92]);
  const cardScale   = useTransform(dragX, [-200, -50, 0, 50, 200], [1.08, 1.03, 0.9, 1.03, 1.08]);
  const foldOpacity  = useTransform(dragX, [-130, -40], [1, 0]);
  const checkOpacity = useTransform(dragX, [40, 130], [0, 1]);

  const checkLabel = (highestBet === 0 || player.betThisRound === highestBet) ? 'CHECK' : 'CALL';

  const ROUND_PREFIXES = ['翻前', '翻牌', '转牌', '河牌'];
  const roundPrefix = (ROUND_PREFIXES[bettingRound] ?? '').slice(0, 2);
  const lastActionMap = {};
  history.forEach((h) => {
    if (!h.isDivider && h.round?.includes(roundPrefix)) {
      lastActionMap[h.player] = h.action;
    }
  });

  const getSeatPos = (index, total) => {
    const angle = ((index / total) * 360) * (Math.PI / 180);
    return {
      left: `${50 + 40 * Math.cos(angle)}%`,
      top:  `${50 + 34 * Math.sin(angle)}%`,
    };
  };

  const actionColor = (action) => {
    if (!action) return 'text-slate-400';
    if (action === 'Fold') return 'text-red-400';
    if (action.startsWith('Raise') || action.startsWith('Bet') || action.startsWith('All-in')) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="flex flex-col h-full pt-14">
      {/* ── 桌面图 + 全区域拖拽层 ── */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center">

        {/* 静态桌面 oval */}
        <div className="relative w-full" style={{ height: '220px' }}>
          <div className="absolute inset-x-4 inset-y-2 rounded-[40%] border-2 border-slate-200 bg-slate-50" />

          {/* 公共牌区 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map(i => (
                <PokerCardMini
                  key={i}
                  patternId={`play-${i}`}
                  card={presetCommunityCards?.[i] ?? null}
                  dim={(i < 3 && bettingRound < 1) || (i === 3 && bettingRound < 2) || (i === 4 && bettingRound < 3)}
                  onClick={() => dispatch({ type: 'SET_PICKING_TARGET', payload: { target: `community_${i}` } })}
                />
              ))}
            </div>
          </div>

          {players.map((p, index) => {
            const isActive = index === currentTurn;
            const isBtn    = index === 0;
            const pos      = getSeatPos(index, players.length);
            const lastAct  = lastActionMap[p.name];
            return (
              <div key={p.id} className="absolute flex flex-col items-center"
                style={{ left: pos.left, top: pos.top, transform: 'translate(-50%, -50%)' }}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all
                  ${p.folded
                    ? 'bg-slate-100 border-slate-200 text-slate-300'
                    : isActive
                      ? p.isHero
                        ? 'bg-amber-400 border-amber-500 text-amber-900 scale-110 shadow-lg ring-2 ring-amber-300/60'
                        : 'bg-slate-800 border-slate-700 text-white scale-110 shadow-lg ring-2 ring-slate-400/40'
                      : isBtn
                        ? 'bg-amber-400 border-amber-300 text-amber-900 shadow-sm'
                        : p.isHero
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                  }`}>
                  {isBtn && !isActive ? 'BTN' : p.isHero ? 'ME' : p.name.slice(0, 3)}
                </div>
                <span className={`text-[9px] font-bold mt-0.5 leading-none ${
                  p.folded ? 'text-red-300' : actionColor(lastAct)
                }`}>
                  {p.folded ? 'Fold' : lastAct ?? (p.betThisRound > 0 ? String(p.betThisRound) : '')}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── 全区域透明拖拽覆盖层 ── */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`drag-${player.id}-${history.length}`}
            drag="x"
            dragSnapToOrigin
            dragElastic={0.28}
            onDrag={(_, { offset }) => dragX.set(offset.x)}
            onDragEnd={(_, { offset }) => {
              dragX.set(0);
              if (offset.x < -60) onAction('Fold');
              else if (offset.x > 60) onAction('Check/Call');
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing select-none"
          >
            {/* 虚化扑克牌 — 拖动时浮现 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                style={{
                  opacity: cardOpacity,
                  rotate: cardRotate,
                  scale: cardScale,
                  x: dragX,
                  width: '130px',
                  height: '182px',
                  filter: 'blur(2px)',
                }}
                className="relative rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* 红色交叉纹卡背 */}
                <div className="absolute inset-0 bg-red-600/70" />
                <svg
                  className="absolute inset-0 w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="ghost-cross" x="0" y="0" width="9" height="9" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="9" y2="9" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
                      <line x1="9" y1="0" x2="0" y2="9" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#ghost-cross)"/>
                </svg>
                {/* 内框 */}
                <div className="absolute inset-[5px] rounded-lg border border-white/30" />

                {/* FOLD 标签 (左滑) */}
                <motion.div
                  style={{ opacity: foldOpacity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-white font-black text-base tracking-widest drop-shadow-md">
                    FOLD
                  </span>
                </motion.div>

                {/* CHECK / CALL 标签 (右滑) */}
                <motion.div
                  style={{ opacity: checkOpacity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-white font-black text-base tracking-widest drop-shadow-md">
                    {checkLabel}
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
