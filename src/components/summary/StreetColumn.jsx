import React from 'react';
import CardDisplay from '../CardDisplay';
import { WinLogBubble, HeroActionBubble, OpponentActionBubble } from './ActionBubble';

/**
 * 单条街道的时间线列（SummaryScreen横向滚动列表中的单列）
 */
export default function StreetColumn({ street, players, inlineEditId, inlineTempName, onInlineTempNameChange, onInlineEditStart, onInlineEditConfirm, onInlineEditCancel, inlineInputRef }) {
  const numCards = street.boardCards ? street.boardCards.length : 0;
  const colWidth = numCards === 5 ? 'w-[160px]' : numCards === 4 ? 'w-[130px]' : 'w-[110px]';

  return (
    <div className={`${colWidth} flex flex-col border-r border-felt-300 shrink-0 transition-all`}>
      <div className="py-2 text-center bg-felt-800 border-b border-felt-300 flex flex-col items-center justify-center min-h-[46px]">
        <div className="text-[10px] text-felt-muted font-bold">{street.name}</div>
        {street.startPot > 0 && (
          <div className="text-amber-400 font-black text-[11px] leading-none mt-0.5">${street.startPot}</div>
        )}
      </div>

      {street.boardCards && street.boardCards.length > 0 && (
        <div className="flex justify-center items-center py-1.5 bg-felt-600 border-b border-felt-300/70 min-h-[36px]">
          <div className="flex scale-[0.6] origin-center -m-4">
            {street.boardCards.map((c, j) => <CardDisplay key={j} card={c} />)}
          </div>
        </div>
      )}

      <div className="flex-1 px-1.5 py-3 overflow-y-auto space-y-4 no-scrollbar">
        {street.actions.map((act, j) => {
          if (act.isWinLog) {
            return <WinLogBubble key={j} action={act.action} />;
          }

          const isHeroAction = act.isHero === true || (act.isHero !== false && players.some((p) => p.name === act.player && p.isHero));

          if (isHeroAction) {
            return <HeroActionBubble key={j} act={act} />;
          } else {
            const matchedPlayer = players.find((p) => p.name === act.player);
            const isEditingThis = matchedPlayer && inlineEditId === matchedPlayer.id;
            return (
              <OpponentActionBubble
                key={j}
                act={act}
                matchedPlayer={matchedPlayer}
                isEditing={isEditingThis}
                inlineTempName={inlineTempName}
                onInlineTempNameChange={onInlineTempNameChange}
                onInlineEditStart={onInlineEditStart}
                onInlineEditConfirm={onInlineEditConfirm}
                onInlineEditCancel={onInlineEditCancel}
                inlineInputRef={inlineInputRef}
              />
            );
          }
        })}
      </div>
    </div>
  );
}
