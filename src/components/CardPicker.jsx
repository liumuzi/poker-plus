import React from 'react';
import { SUITS, RANKS } from '../constants/poker';
import { isCardUsed } from '../engine/cardUtils';
import { useGame } from '../contexts/GameContext';

/**
 * 选牌弹窗（用于选择底牌、公共牌、补录亮牌）
 */
export default function CardPicker() {
  const { pickingCardsTarget, tempCards, heroCards, communityCards, players, dispatch } = useGame();

  if (!pickingCardsTarget) return null;

  const isHero = pickingCardsTarget.startsWith('hero');
  const isReveal = pickingCardsTarget.startsWith('reveal');
  // V2设置阶段的公共牌选择格式: community_0, community_1, ...
  const isSetupCommunity = pickingCardsTarget.startsWith('community_');
  const requiredCount = pickingCardsTarget === 'flop' ? 3 : 1;

  const handleSelect = (rank, suit) => {
    if (isCardUsed(rank, suit.id, heroCards, communityCards, tempCards, players)) return;

    const card = { rank, suit: suit.id };

    if (isHero) {
      const position = pickingCardsTarget === 'hero1' ? 0 : 1;
      dispatch({ type: 'SET_HERO_CARD', payload: { position, card } });
    } else if (isReveal) {
      const parts = pickingCardsTarget.split('_');
      const playerIdx = parseInt(parts[1]);
      const cardPos = parseInt(parts[2]);
      dispatch({ type: 'REVEAL_PLAYER_CARD', payload: { playerIdx, cardPos, card } });
    } else if (isSetupCommunity) {
      // V2设置阶段的公共牌选择：直接添加到communityCards，不触发TRANSITION_STREET
      const cardIndex = parseInt(pickingCardsTarget.split('_')[1]);
      dispatch({ type: 'SET_SETUP_COMMUNITY_CARD', payload: { index: cardIndex, card } });
    } else {
      // 游戏进行中的公共牌选择（发牌过渡）
      const newTemp = [...tempCards, card];
      if (newTemp.length === requiredCount) {
        dispatch({ type: 'TRANSITION_STREET', payload: { cards: newTemp } });
      } else {
        dispatch({ type: 'SELECT_TEMP_CARD', payload: { card } });
      }
    }
  };

  const handleCancel = () => {
    dispatch({ type: 'SET_PICKING_TARGET', payload: { target: null } });
  };

  const titleText = isHero
    ? '挑选我的底牌'
    : isReveal
      ? '补录玩家手牌'
      : isSetupCommunity
        ? '选择公共牌'
        : `请发公共牌 (${tempCards.length}/${requiredCount})`;

  return (
    <div className="absolute inset-0 bg-slate-900/90 z-[100] flex flex-col p-4 justify-end transition-all pb-10">
      <div className="bg-white rounded-3xl p-5 shadow-2xl mb-[env(safe-area-inset-bottom)]">
        <h3 className="font-extrabold text-center text-xl mb-6 text-slate-800">{titleText}</h3>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {SUITS.map((s) => (
            <div key={s.id} className="flex flex-col gap-1.5 items-center bg-slate-50 rounded-xl py-3 border border-slate-100">
              <div className={`text-2xl font-black mb-1 ${s.color}`}>{s.s}</div>
              {RANKS.map((r) => {
                const disabled = isCardUsed(r, s.id, heroCards, communityCards, tempCards, players);
                return (
                  <button
                    key={r}
                    disabled={disabled}
                    onClick={() => handleSelect(r, s)}
                    className={`w-10 h-8 border border-slate-200 rounded-lg font-black text-sm shadow-sm transition-colors ${
                      disabled
                        ? 'bg-slate-200 text-slate-300 opacity-40 cursor-not-allowed'
                        : `bg-white active:bg-blue-100 ${s.color}`
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {(isHero || isReveal || isSetupCommunity) && (
          <button
            onClick={handleCancel}
            className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold mt-4 shadow-inner"
          >
            取消 / 稍后补录
          </button>
        )}
      </div>
    </div>
  );
}
