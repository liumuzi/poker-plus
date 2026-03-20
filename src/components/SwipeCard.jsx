import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';

/**
 * 行动卡片：含滑动手势 + 加注面板
 */
export default function SwipeCard({ player }) {
  const { highestBet, bbAmount, potSize, history, dispatch } = useGame();
  const [showRaiseDrawer, setShowRaiseDrawer] = useState(false);
  const isBetMode = highestBet === 0;

  const handleAction = (actionStr, amount) => {
    dispatch({ type: 'PLAYER_ACTION', payload: { action: actionStr, amount } });
  };

  const onDragEnd = (_, { offset }) => {
    if (offset.x < -60) handleAction('Fold');
    else if (offset.x > 60) handleAction('Check/Call');
  };

  const handleCustomRaise = () => {
    const promptText = isBetMode
      ? `当前无人下注。请输入下注总额 (Bet To):`
      : `当前单次最高下注额为 ${highestBet}。\n在此基础上，你要加注到多少？(Raise To)`;
    const amt = prompt(promptText);
    if (amt) handleAction(isBetMode ? 'Bet' : 'Raise', amt);
    setShowRaiseDrawer(false);
  };

  const handleRaiseClick = (amt) => {
    handleAction(isBetMode ? 'Bet' : 'Raise', amt);
    setShowRaiseDrawer(false);
  };

  const handleAllIn = () => {
    const amt = prompt(`请输入玩家 All-in 的总下注额 (当前面临最高下注是 ${highestBet}):`);
    if (amt) handleAction('All-in', amt);
    setShowRaiseDrawer(false);
  };

  const betOneThird = Math.max(1, Math.round(potSize * (1 / 3)));
  const betOneHalf = Math.max(1, Math.round(potSize * (1 / 2)));
  const betTwoThird = Math.max(1, Math.round(potSize * (2 / 3)));
  const betFullPot = Math.max(1, potSize);

  const raise2x = highestBet * 2;
  const raise2_5x = Math.round(highestBet * 2.5);
  const raise3x = highestBet * 3;
  const raise4x = highestBet * 4;

  return (
    <div className="flex flex-col items-center w-full h-[320px] justify-center relative mt-4">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${player.id}-${history.length}`}
          drag="x"
          dragSnapToOrigin={true}
          dragElastic={0.4}
          onDragEnd={onDragEnd}
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -30 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_15px_50px_rgb(0,0,0,0.15)] border border-slate-100 p-8 flex flex-col items-center absolute z-20"
        >
          {showRaiseDrawer && (
            <div className="absolute inset-0 bg-white z-30 rounded-[2.5rem] flex flex-col p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-extrabold text-slate-800 text-lg">选择{isBetMode ? '下注量' : '加注量'}</h4>
                <button onClick={() => setShowRaiseDrawer(false)} className="text-slate-400 font-bold text-sm bg-slate-100 px-3 py-1 rounded-full">返回</button>
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1 content-start">
                {isBetMode ? (
                  <>
                    <button onClick={() => handleRaiseClick(betOneThird)} className="bg-slate-50 border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl active:bg-slate-100 shadow-sm transition-transform active:scale-95">1/3池 ({betOneThird})</button>
                    <button onClick={() => handleRaiseClick(betOneHalf)} className="bg-slate-50 border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl active:bg-slate-100 shadow-sm transition-transform active:scale-95">1/2池 ({betOneHalf})</button>
                    <button onClick={() => handleRaiseClick(betTwoThird)} className="bg-slate-50 border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl active:bg-slate-100 shadow-sm transition-transform active:scale-95">2/3池 ({betTwoThird})</button>
                    <button onClick={() => handleRaiseClick(betFullPot)} className="bg-blue-50 border-2 border-blue-200 text-blue-700 font-black py-4 rounded-2xl active:bg-blue-100 shadow-sm transition-transform active:scale-95">满池 ({betFullPot})</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleRaiseClick(raise2x)} className="bg-slate-50 border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl active:bg-slate-100 shadow-sm transition-transform active:scale-95">2倍 ({raise2x})</button>
                    <button onClick={() => handleRaiseClick(raise2_5x)} className="bg-slate-50 border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl active:bg-slate-100 shadow-sm transition-transform active:scale-95">2.5倍 ({raise2_5x})</button>
                    <button onClick={() => handleRaiseClick(raise3x)} className="bg-slate-50 border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl active:bg-slate-100 shadow-sm transition-transform active:scale-95">3倍 ({raise3x})</button>
                    <button onClick={() => handleRaiseClick(raise4x)} className="bg-blue-50 border-2 border-blue-200 text-blue-700 font-black py-4 rounded-2xl active:bg-blue-100 shadow-sm transition-transform active:scale-95">4倍 ({raise4x})</button>
                  </>
                )}
                <button onClick={handleAllIn} className="bg-red-50 text-red-600 border-2 border-red-200 font-black py-4 rounded-2xl active:bg-red-100 shadow-sm transition-transform active:scale-95">All-in (全下)</button>
                <button onClick={handleCustomRaise} className="bg-slate-800 text-white font-bold py-4 rounded-2xl active:bg-slate-700 shadow-md transition-transform active:scale-95">自定义</button>
              </div>
            </div>
          )}

          <div className={`px-4 py-1.5 rounded-full mb-5 font-black text-xs tracking-wider shadow-sm border-2 ${player.isHero ? 'bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border-amber-400' : 'bg-slate-100 text-slate-500 border-transparent'}`}>
            {player.isHero ? '👑 我 (Hero) 的行动回合' : '其他玩家行动中'}
          </div>

          <h3 className={`text-4xl font-black mb-3 ${player.isHero ? 'text-amber-500' : 'text-slate-800'}`}>{player.name}</h3>

          <div className="bg-slate-50 px-4 py-2 rounded-xl mb-6 border border-slate-100 text-center">
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mb-1">本轮已下注 {player.betThisRound}</p>
            <p className="text-slate-700 font-black text-sm">
              还需补足 <span className="text-blue-600 text-lg">{Math.max(0, highestBet - player.betThisRound)}</span>
              {Math.max(0, highestBet - player.betThisRound) === 0 ? ' (可过牌)' : ''}
            </p>
          </div>

          <div className="flex justify-between w-full text-[10px] font-black text-slate-300 mb-8 uppercase px-1">
            <span className="text-red-400/80">← 左滑 Fold</span>
            <span className="text-emerald-500/80">
              右滑 {(highestBet === 0 || player.betThisRound === highestBet) ? 'Check' : 'Call'} →
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 w-full">
            <button onClick={() => handleAction('Fold')} className="bg-red-50 text-red-600 font-bold py-3.5 rounded-xl text-xs active:bg-red-100">Fold</button>
            <button onClick={() => handleAction('Check/Call')} className="bg-emerald-50 text-emerald-600 font-bold py-3.5 rounded-xl text-xs col-span-2 shadow-sm active:bg-emerald-100">
              {(highestBet === 0 || player.betThisRound === highestBet) ? 'Check' : `Call (${highestBet - player.betThisRound})`}
            </button>
            <button onClick={() => setShowRaiseDrawer(true)} className="bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs shadow-md active:bg-slate-700">{isBetMode ? 'Bet' : 'Raise'}</button>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="w-11/12 h-[300px] bg-slate-300/30 rounded-[2.5rem] absolute z-10 translate-y-3 scale-95"></div>
    </div>
  );
}
