import React from 'react';
import CardDisplay from './CardDisplay';

/**
 * 玩家状态标签（底部玩家条中使用）
 */
export default function PlayerBadge({ player, isActive, onRevealCard }) {
  return (
    <div
      className={`flex flex-col px-3 py-1.5 border-2 rounded-xl text-[10px] font-black uppercase relative z-50
        ${isActive
          ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-md transform scale-105'
          : player.folded
            ? 'bg-slate-100/50 border-transparent text-slate-300 line-through'
            : 'bg-white border-slate-200 text-slate-600 shadow-sm'
        }`}
    >
      <div className="flex justify-between items-center w-full">
        <span>{player.name}{player.isHero ? ' 👑' : ''}</span>
      </div>

      {!player.isHero && (
        <div className="flex mt-1 space-x-1">
          <div
            onClick={(e) => { e.stopPropagation(); onRevealCard(player.id, 0); }}
            className="w-5 h-6 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[10px] cursor-pointer hover:bg-slate-200"
          >
            {player.knownCards?.[0] ? <CardDisplay card={player.knownCards[0]} /> : '?'}
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); onRevealCard(player.id, 1); }}
            className="w-5 h-6 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[10px] cursor-pointer hover:bg-slate-200"
          >
            {player.knownCards?.[1] ? <CardDisplay card={player.knownCards[1]} /> : '?'}
          </div>
        </div>
      )}

      <span className={`text-[11px] mt-1 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
        {player.folded ? 'Fold' : `池:${player.betThisRound}`}
      </span>
    </div>
  );
}
