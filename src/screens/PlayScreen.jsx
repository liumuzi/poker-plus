import React from 'react';
import { ROUND_NAMES } from '../constants/poker';
import { useGame } from '../contexts/GameContext';
import CardDisplay from '../components/CardDisplay';
import CardPicker from '../components/CardPicker';
import SwipeCard from '../components/SwipeCard';
import PlayerBadge from '../components/PlayerBadge';

export default function PlayScreen() {
  const {
    players, currentTurn, bettingRound, potSize,
    heroCards, communityCards, historySnapshots, dispatch,
  } = useGame();

  const activePlayer = players[currentTurn];
  if (!activePlayer) return null;

  const handleUndo = () => dispatch({ type: 'UNDO' });
  const handleRevealCard = (playerId, cardPos) => {
    dispatch({ type: 'SET_PICKING_TARGET', payload: { target: `reveal_${playerId}_${cardPos}` } });
  };

  const handleExitToHome = () => {
    if (!confirm('确定放弃当前复盘并返回主菜单吗？未保存内容会丢失。')) return;
    dispatch({ type: 'EXIT_TO_HOME' });
  };

  return (
    <div className="flex flex-col min-h-screen max-h-screen bg-slate-50 relative select-none">
      {/* 顶部状态板 */}
      <div className="flex-none bg-felt-700 text-white px-6 pt-8 pb-6 rounded-b-[2rem] shadow-lg z-10 relative">
        <button
          onClick={handleExitToHome}
          className="absolute top-8 left-6 text-xs bg-felt-500 border border-felt-300 hover:bg-felt-300 px-3 py-1.5 rounded-full font-bold text-slate-300 shadow-sm active:scale-95 transition-all"
        >
          放弃并返回
        </button>

        {historySnapshots.length > 0 && (
          <button
            onClick={handleUndo}
            className="absolute top-8 right-6 text-xs bg-felt-500 border border-felt-300 hover:bg-felt-300 px-3 py-1.5 rounded-full font-bold text-slate-300 flex items-center shadow-sm active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            撤销上一步
          </button>
        )}

        <div className="flex justify-between items-end mb-4 pr-24">
          <div>
            <div className="text-xs text-slate-400 font-black tracking-widest uppercase mb-1">Current Round</div>
            <div className="text-amber-400 font-display text-3xl tracking-widest">
              {ROUND_NAMES[bettingRound].split(' ')[0]}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-black tracking-widest uppercase mb-1">Pot Size</div>
            <div className="text-5xl font-display text-white tracking-wide">{potSize}</div>
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-felt-300/50 pt-4">
          <div className="flex flex-col">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">My Hand</div>
            <div className="flex">
              <CardDisplay card={heroCards[0]} />
              <CardDisplay card={heroCards[1]} />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Community</div>
            <div className="flex min-h-[28px]">
              {communityCards.length === 0
                ? <span className="text-sm font-bold text-slate-500 italic">等待发牌</span>
                : communityCards.map((c, i) => <CardDisplay key={i} card={c} />)
              }
            </div>
          </div>
        </div>
      </div>

      {/* 中心交互卡片 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 z-0 min-h-[300px] overflow-hidden">
        <SwipeCard player={activePlayer} />
      </div>

      {/* 底部玩家状态条 */}
      <div className="flex-none w-full p-4 pb-6 bg-slate-100 border-t border-slate-200 z-40">
        <div className="flex justify-between text-[11px] text-slate-500 mb-3 font-black tracking-wider uppercase px-1">
          点击玩家可补录死牌/亮牌
        </div>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <PlayerBadge
              key={p.id}
              player={p}
              isActive={p.id === currentTurn}
              onRevealCard={handleRevealCard}
            />
          ))}
        </div>
      </div>
      <CardPicker />
    </div>
  );
}
