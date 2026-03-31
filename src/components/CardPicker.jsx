import React, { useState } from 'react';
import { SUITS, RANKS } from '../constants/poker';
import { isCardUsed } from '../engine/cardUtils';
import { useGame } from '../contexts/GameContext';

/**
 * 选牌弹窗 — 上：花色选择，下：点数选择
 */
export default function CardPicker() {
  const { pickingCardsTarget, tempCards, heroCards, communityCards, presetCommunityCards, players, isV2Mode, dispatch } = useGame();
  const [selectedSuit, setSelectedSuit] = useState(null);

  if (!pickingCardsTarget) return null;

  const isHero = pickingCardsTarget.startsWith('hero');
  const isReveal = pickingCardsTarget.startsWith('reveal');
  const isSetupCommunity = pickingCardsTarget.startsWith('community_');
  const requiredCount = pickingCardsTarget === 'flop' ? 3 : 1;

  const streetTargets = ['flop', 'turn', 'river'];
  if (isV2Mode && streetTargets.includes(pickingCardsTarget)) {
    const presetCards = presetCommunityCards || [];
    const hasPreset = (
      (pickingCardsTarget === 'flop' && presetCards[0] && presetCards[1] && presetCards[2]) ||
      (pickingCardsTarget === 'turn' && presetCards[3]) ||
      (pickingCardsTarget === 'river' && presetCards[4])
    );
    if (hasPreset) return null;
  }

  const allUsedCommunityCards = [...communityCards, ...(presetCommunityCards || []).filter(Boolean)];

  const handleSelectRank = (rank) => {
    if (!selectedSuit) return;
    const suit = SUITS.find(s => s.id === selectedSuit);
    if (isCardUsed(rank, suit.id, heroCards, allUsedCommunityCards, tempCards, players)) return;

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
      const cardIndex = parseInt(pickingCardsTarget.split('_')[1]);
      dispatch({ type: 'SET_SETUP_COMMUNITY_CARD', payload: { index: cardIndex, card } });
    } else {
      const newTemp = [...tempCards, card];
      if (newTemp.length === requiredCount) {
        dispatch({ type: 'TRANSITION_STREET', payload: { cards: newTemp } });
      } else {
        dispatch({ type: 'SELECT_TEMP_CARD', payload: { card } });
      }
    }
    setSelectedSuit(null);
  };

  const handleCancel = () => {
    setSelectedSuit(null);
    dispatch({ type: 'SET_PICKING_TARGET', payload: { target: null } });
  };

  const titleText = isHero
    ? '选择手牌'
    : isReveal
      ? '补录玩家手牌'
      : isSetupCommunity
        ? '选择公共牌'
        : `请发公共牌 (${tempCards.length}/${requiredCount})`;

  const activeSuit = SUITS.find(s => s.id === selectedSuit);

  return (
    <div className="absolute inset-0 bg-slate-900/80 z-[100] flex flex-col justify-end">
      <div className="bg-white rounded-t-3xl shadow-2xl px-5 pt-5 pb-8">

        {/* 标题 */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-lg text-slate-800">{titleText}</h3>
          {selectedSuit && (
            <span className={`text-2xl font-black ${activeSuit.color}`}>{activeSuit.s}</span>
          )}
        </div>

        {/* 花色选择 */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {SUITS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSuit(s.id)}
              className={`py-4 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all font-bold
                ${selectedSuit === s.id
                  ? `border-current bg-slate-50 scale-105 shadow-md ${s.color}`
                  : `border-slate-100 bg-slate-50 hover:border-slate-200 ${s.color}`
                }`}
            >
              <span className="text-3xl leading-none">{s.s}</span>
            </button>
          ))}
        </div>

        {/* 分隔线 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[11px] text-slate-300 font-medium">
            {selectedSuit ? `选择点数` : '先选花色'}
          </span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* 点数选择 */}
        <div className="grid grid-cols-7 gap-2 mb-5">
          {RANKS.map((r) => {
            const disabled = !selectedSuit || isCardUsed(r, selectedSuit, heroCards, allUsedCommunityCards, tempCards, players);
            return (
              <button
                key={r}
                disabled={disabled}
                onClick={() => handleSelectRank(r)}
                className={`aspect-square rounded-xl font-black text-sm border transition-all
                  ${disabled
                    ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed'
                    : selectedSuit
                      ? `bg-white border-slate-200 shadow-sm active:scale-95 ${activeSuit?.color}`
                      : 'bg-slate-50 text-slate-300 border-slate-100'
                  }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* 取消按钮 */}
        {(isHero || isReveal || isSetupCommunity) && (
          <button
            onClick={handleCancel}
            className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-2xl font-bold text-sm"
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
}
