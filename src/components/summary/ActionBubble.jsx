import React from 'react';
import { parseAction } from '../../utils/formatting';

/**
 * 赢家日志气泡
 */
export function WinLogBubble({ action }) {
  return (
    <div className="bg-chip-gold rounded-lg p-2 text-center shadow-md text-black mt-2">
      <div className="font-extrabold text-[10px] leading-snug">{action}</div>
    </div>
  );
}

/**
 * Hero 行动气泡（右对齐，金色）
 */
export function HeroActionBubble({ act }) {
  const pActionArray = parseAction(act.action);
  return (
    <div className="flex w-full justify-end items-start gap-1.5 pl-2 group transition-opacity">
      <div className="relative bg-chip-gold text-black px-1.5 py-1 rounded shadow-md border border-chip-gold-dark flex flex-col items-center justify-center min-w-[36px] text-center z-10">
        {pActionArray.map((p, i) => <div key={i} className="text-[9px] font-extrabold leading-tight">{p}</div>)}
        <div className="absolute top-2 -right-[4px] border-t-[4px] border-t-transparent border-l-[4px] border-l-chip-gold border-b-[4px] border-b-transparent"></div>
        <div className="absolute top-2 -right-[5px] border-t-[4px] border-t-transparent border-l-[4px] border-l-chip-gold-dark border-b-[4px] border-b-transparent -z-10"></div>
      </div>
      <div className="flex flex-col items-center shrink-0 w-8">
        <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-amber-500 overflow-hidden flex items-center justify-center text-xs shadow-sm">👑</div>
        <div className="bg-felt-900 text-amber-500/90 text-[7px] px-1 rounded-sm -mt-2 z-10 border border-amber-600/50 font-bold max-w-full truncate">Hero</div>
      </div>
    </div>
  );
}

/**
 * 对手行动气泡（左对齐，白色，支持内联名称编辑）
 */
export function OpponentActionBubble({ act, matchedPlayer, isEditing, inlineTempName, onInlineTempNameChange, onInlineEditStart, onInlineEditConfirm, onInlineEditCancel, inlineInputRef }) {
  const pActionArray = parseAction(act.action);
  return (
    <div className="flex w-full justify-start items-start gap-1.5 pr-2 group transition-opacity">
      <div
        className="flex flex-col items-center shrink-0 w-8 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (matchedPlayer) onInlineEditStart(matchedPlayer);
        }}
      >
        <div className={`w-7 h-7 rounded-full bg-slate-700 border-2 overflow-hidden flex items-center justify-center text-[9px] text-slate-200 font-black shadow-sm uppercase tracking-tighter ${isEditing ? 'border-blue-400' : 'border-slate-500'}`}>
          {act.player.substring(0, 3)}
        </div>
        {isEditing ? (
          <input
            ref={inlineInputRef}
            type="text"
            value={inlineTempName}
            onChange={(e) => onInlineTempNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onInlineEditConfirm();
              if (e.key === 'Escape') onInlineEditCancel();
            }}
            onBlur={onInlineEditConfirm}
            onClick={(e) => e.stopPropagation()}
            className="w-16 bg-felt-700 border border-blue-400 rounded px-1 py-0.5 text-[8px] text-white text-center -mt-2 z-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <div className="bg-felt-900 text-slate-300 text-[7px] px-1 rounded-sm -mt-2 z-10 border border-slate-600 font-bold max-w-full truncate">
            {act.player}
          </div>
        )}
      </div>
      <div className="relative bg-white text-slate-900 px-1.5 py-1 rounded shadow-md border border-slate-200 flex flex-col items-center justify-center min-w-[36px] text-center z-10">
        <div className="absolute top-2 -left-[4px] border-t-[4px] border-t-transparent border-r-[4px] border-r-white border-b-[4px] border-b-transparent"></div>
        <div className="absolute top-2 -left-[5px] border-t-[4px] border-t-transparent border-r-[4px] border-r-slate-200 border-b-[4px] border-b-transparent -z-10"></div>
        {pActionArray.map((p, i) => <div key={i} className="text-[9px] font-extrabold leading-tight">{p}</div>)}
      </div>
    </div>
  );
}
