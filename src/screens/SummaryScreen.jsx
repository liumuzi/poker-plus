import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useSavedGames } from '../hooks/useSavedGames';
import { useDragScroll } from '../hooks/useDragScroll';
import { useInlineEdit } from '../hooks/useInlineEdit';
import { groupHistoryByStreet, addCumulativeBoardCards, calculateHeroSummary } from '../utils/historyUtils';
import CardDisplay from '../components/CardDisplay';
import EditPanel from '../components/summary/EditPanel';
import StreetColumn from '../components/summary/StreetColumn';

export default function SummaryScreen() {
  const {
    history, potSize, players, communityCards, isViewingSave,
    sbAmount, bbAmount, winners, playerCount, heroIndex, heroCards, 
    isV2Mode, gameNotes, playerStacks, dispatch,
  } = useGame();
  const { saveGame } = useSavedGames();
  const { scrollRef, handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove } = useDragScroll();
  
  // V2新增：编辑模式状态
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [tempNotes, setTempNotes] = useState(gameNotes || '');

  // 玩家名称内联编辑（使用共享 hook）
  const inlineEdit = useInlineEdit((id, newName) => {
    const currentName = players.find(p => p.id === id)?.name;
    if (newName !== currentName) {
      dispatch({ type: 'UPDATE_PLAYER_NAME', payload: { playerId: id, name: newName } });
    }
  });

  // 将 history 分组为街道
  const { streets } = groupHistoryByStreet(history);

  // 各街公共牌改为累计显示
  const streetsWithBoard = useMemo(() => {
    return addCumulativeBoardCards(streets);
  }, [history]);

  const hero = players.find((p) => p.isHero);
  const heroName = hero?.name || '';
  const heroInvested = Number(hero?.totalInvested || 0);
  const dealtCommunityCards = communityCards.length;

  const heroSummary = useMemo(() => {
    return calculateHeroSummary({
      hero, heroName, heroInvested, isViewingSave, winners, history, potSize,
    });
  }, [hero, heroName, heroInvested, isViewingSave, winners, history, potSize]);

  const handleRewriteFromStart = () => {
    if (!confirm('将回到记录界面并预填写基础信息，你可以从头重写这手牌。现在继续吗？')) return;
    dispatch({ type: 'REWRITE_FROM_CURRENT_HAND' });
  };

  // 内联编辑：点击非Hero玩家名称开始编辑
  const handleInlineEditStart = (player) => {
    if (player.isHero) return;
    inlineEdit.startEdit(player.id, player.name);
  };

  const handleSave = () => {
    saveGame({
      potSize,
      history,
      players: isV2Mode ? players : players.filter((p) => p.isHero || (p.knownCards && p.knownCards.some((c) => c))),
      communityCards,
      sbAmount,
      bbAmount,
      playerCount,
      heroIndex,
      heroCards,
      // V2新增字段
      isV2Mode,
      gameNotes: tempNotes,
      playerNames: Object.fromEntries(players.map(p => [p.id, p.name])),
      playerStacks,
    });
    dispatch({ type: 'SET_STAGE', payload: { stage: 'home' } });
  };

  const handleGoHome = () => {
    dispatch({ type: 'SET_STAGE', payload: { stage: 'home' } });
  };

  return (
    <div className="flex flex-col min-h-screen bg-felt-700 text-white select-none">
      <div className="pt-6 mb-2 px-4 shadow-sm pb-2 z-20">
        <h2 className="text-2xl font-black text-amber-500 mb-1">手牌复盘</h2>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
          总底池: <span className="text-amber-400 ml-1 text-lg font-display tracking-wider">${potSize}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
          <div className="rounded-lg bg-felt-500 border border-felt-300 p-2">
            <div className="text-slate-400">本手结果</div>
            <div className={`font-black text-xs ${heroSummary.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {heroSummary.resultText} {heroSummary.net >= 0 ? '+' : ''}{Math.round(heroSummary.net)}
            </div>
          </div>
          <div className="rounded-lg bg-felt-500 border border-felt-300 p-2">
            <div className="text-slate-400">Hero投入</div>
            <div className="font-black text-xs text-white">{Math.round(heroInvested)}</div>
          </div>
          <div className="rounded-lg bg-felt-500 border border-felt-300 p-2">
            <div className="text-slate-400">已发公共牌</div>
            <div className="font-black text-xs text-white">{dealtCommunityCards}/5</div>
          </div>

          </div>
          {/* 玩家手牌展示 */}
          {players.some(p => (p.knownCards && p.knownCards.filter(Boolean).length > 0) || (p.isHero && heroCards && heroCards.filter(Boolean).length > 0)) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {players.map(p => {
                const cards = (p.isHero && heroCards && heroCards.filter(Boolean).length > 0) ? heroCards : (p.knownCards || []);
                const validCards = cards.filter(Boolean);
                if (validCards.length === 0) return null;
                return (
                  <div key={p.id} className="flex items-center space-x-3 bg-felt-500 pr-3 pl-2 py-1 rounded-lg border border-felt-300">
                    <span className="text-xs text-slate-300 font-bold">{p.name}</span>
                    <div className="flex scale-[0.65] origin-left -m-4 ml-1">
                      {validCards.map((c, i) => <CardDisplay key={i} card={c} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* V2新增：编辑面板切换按钮 */}
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleRewriteFromStart}
              className="text-xs px-3 py-1.5 rounded-full border font-bold bg-felt-500 text-slate-300 border-felt-300"
            >
              回到记录界面重写本手
            </button>
            <button
              onClick={() => setShowEditPanel(!showEditPanel)}
              className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-colors ${
                showEditPanel 
                  ? 'bg-blue-500 text-white border-blue-400' 
                  : 'bg-felt-500 text-slate-300 border-felt-300'
              }`}
            >
              {showEditPanel ? '收起编辑' : '📝 编辑/备注'}
            </button>
          </div>

          {/* V2新增：编辑面板 */}
          {showEditPanel && (
            <EditPanel
              players={players}
              playerStacks={playerStacks}
              tempNotes={tempNotes}
              onTempNotesChange={setTempNotes}
              dispatch={dispatch}
            />
          )}
      </div>

      {/* 提示文字：点击玩家名可改名 */}
      <div className="px-4 py-1.5 text-[10px] text-slate-500 font-bold tracking-wider">
        点击下方玩家名称可修改名称
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ touchAction: 'pan-x pan-y', cursor: 'grab' }}
        className="flex-1 overflow-x-auto overflow-y-hidden w-full no-scrollbar pb-[100px]"
      >
        <div className="flex min-w-max h-full border-t border-b border-felt-400 bg-felt-500">
          {streetsWithBoard.map((street, idx) => (
            <StreetColumn
              key={idx}
              street={street}
              players={players}
              inlineEditId={inlineEdit.editingId}
              inlineTempName={inlineEdit.tempValue}
              onInlineTempNameChange={inlineEdit.setTempValue}
              onInlineEditStart={handleInlineEditStart}
              onInlineEditConfirm={inlineEdit.confirmEdit}
              onInlineEditCancel={inlineEdit.cancelEdit}
              inlineInputRef={inlineEdit.inputRef}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-felt-700/90 backdrop-blur-md p-4 border-t border-felt-400 z-30">
        {isViewingSave ? (
          <button
            onClick={handleGoHome}
            className="w-full bg-felt-300 hover:bg-felt-200 active:scale-95 transition-transform text-white py-4 rounded-2xl font-bold text-sm shadow-xl border border-felt-200"
          >
            返回首页
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-transform text-white py-4 rounded-2xl font-black text-sm shadow-[0_10px_30px_rgb(5,150,105,0.4)] border border-emerald-400"
          >
            保存对局并返回首页
          </button>
        )}
      </div>
    </div>
  );
}
