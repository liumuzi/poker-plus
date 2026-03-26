import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useSavedGames } from '../hooks/useSavedGames';
import { useDragScroll } from '../hooks/useDragScroll';
import { parseAction } from '../utils/formatting';
import CardDisplay from '../components/CardDisplay';

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
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [tempPlayerName, setTempPlayerName] = useState('');
  const [tempPlayerStack, setTempPlayerStack] = useState('');
  const [tempNotes, setTempNotes] = useState(gameNotes || '');

  // 将 history 分组为街道
  let rollingPot = 0;
  const streets = [];
  let currentStreet = null;

  history.forEach((h) => {
    if (h.isDivider) {
      if (!h.text.includes('结算')) {
        if (currentStreet) streets.push(currentStreet);
        let nName = '翻牌前';
        if (h.text.includes('Flop')) nName = '翻牌';
        if (h.text.includes('Turn')) nName = '转牌';
        if (h.text.includes('River')) nName = '河牌';
        currentStreet = { name: nName, startPot: rollingPot, actions: [], cards: h.cards || [] };
      } else {
        if (currentStreet) streets.push(currentStreet);
        currentStreet = { name: '比牌', startPot: rollingPot, actions: [], cards: [] };
      }
    } else {
      if (!currentStreet) {
        currentStreet = { name: '盲注(前注)', startPot: 0, actions: [], cards: [] };
      }
      currentStreet.actions.push(h);
      if (!h.isWinLog && typeof h.pot === 'number') {
        rollingPot = h.pot;
      }
    }
  });
  if (currentStreet && (currentStreet.actions.length > 0 || currentStreet.name === '比牌')) {
    streets.push(currentStreet);
  }

  // 各街公共牌改为累计显示
  const streetsWithBoard = useMemo(() => {
    const board = [];
    return streets.map((street) => {
      if (street.cards && street.cards.length > 0) {
        board.push(...street.cards);
      }
      return { ...street, boardCards: [...board] };
    });
  }, [history]);

  const hero = players.find((p) => p.isHero);
  const heroName = hero?.name || '';
  const heroInvested = Number(hero?.totalInvested || 0);
  const dealtCommunityCards = communityCards.length;

  const heroSummary = useMemo(() => {
    if (!hero) return { wonShare: 0, net: 0, resultText: '未识别 Hero' };

    let winnerCount = 0;
    let heroWon = false;

    if (!isViewingSave && winners.length > 0) {
      winnerCount = winners.length;
      heroWon = winners.includes(hero.id);
    } else {
      const winLog = history.find((h) => h.isWinLog && typeof h.action === 'string');
      if (winLog?.action) {
        const head = winLog.action.split(' 赢下底池')[0];
        const names = head.split(' & ').map((s) => s.trim()).filter(Boolean);
        winnerCount = names.length;
        heroWon = names.includes(heroName);
      }
    }

    const wonShare = heroWon && winnerCount > 0 ? potSize / winnerCount : 0;
    const net = wonShare - heroInvested;
    const resultText = net > 0 ? '盈利' : (net < 0 ? '亏损' : '持平');
    return { wonShare, net, resultText };
  }, [hero, heroName, heroInvested, isViewingSave, winners, history, potSize]);

  const handleRewriteFromStart = () => {
    if (!confirm('将回到记录界面并预填写基础信息，你可以从头重写这手牌。现在继续吗？')) return;
    dispatch({ type: 'REWRITE_FROM_CURRENT_HAND' });
  };

  // V2新增：玩家名称编辑功能
  const handleStartEditPlayer = (player) => {
    setEditingPlayerId(player.id);
    setTempPlayerName(player.name);
    setTempPlayerStack(player.stackSize || playerStacks?.[player.id] || '');
  };

  const handleSavePlayerEdit = () => {
    if (editingPlayerId !== null) {
      if (tempPlayerName.trim()) {
        dispatch({ 
          type: 'UPDATE_PLAYER_NAME', 
          payload: { playerId: editingPlayerId, name: tempPlayerName.trim() } 
        });
      }
      if (tempPlayerStack) {
        dispatch({ 
          type: 'UPDATE_PLAYER_STACK', 
          payload: { playerId: editingPlayerId, stack: Number(tempPlayerStack) } 
        });
      }
    }
    setEditingPlayerId(null);
    setTempPlayerName('');
    setTempPlayerStack('');
  };

  const handleCancelPlayerEdit = () => {
    setEditingPlayerId(null);
    setTempPlayerName('');
    setTempPlayerStack('');
  };

  // V2新增：保存备注
  const handleSaveNotes = () => {
    dispatch({ type: 'UPDATE_GAME_NOTES', payload: { notes: tempNotes } });
  };

  const handleSave = () => {
    saveGame({
      potSize,
      history,
      players: players.filter((p) => p.isHero || (p.knownCards && p.knownCards.some((c) => c))),
      communityCards,
      sbAmount,
      bbAmount,
      playerCount,
      heroIndex,
      heroCards,
      // V2新增字段
      isV2Mode,
      gameNotes: tempNotes,
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
            <div className="mt-3 bg-felt-600 rounded-xl p-3 border border-felt-400">
              <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">玩家信息编辑</h4>
              
              {/* 玩家列表 */}
              <div className="space-y-2 mb-4">
                {players.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-felt-500 rounded-lg p-2">
                    {editingPlayerId === p.id ? (
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={tempPlayerName}
                          onChange={(e) => setTempPlayerName(e.target.value)}
                          placeholder="玩家名称"
                          className="flex-1 bg-felt-700 border border-felt-300 rounded px-2 py-1 text-xs text-white"
                        />
                        <input
                          type="number"
                          value={tempPlayerStack}
                          onChange={(e) => setTempPlayerStack(e.target.value)}
                          placeholder="后手筹码"
                          className="w-20 bg-felt-700 border border-felt-300 rounded px-2 py-1 text-xs text-white"
                        />
                        <button
                          onClick={handleSavePlayerEdit}
                          className="text-emerald-400 text-xs px-2 py-1 bg-emerald-500/20 rounded"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelPlayerEdit}
                          className="text-red-400 text-xs px-2 py-1 bg-red-500/20 rounded"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-bold ${p.isHero ? 'text-amber-400' : 'text-slate-300'}`}>
                            {p.name} {p.isHero && '👑'}
                          </span>
                          {(p.stackSize || playerStacks?.[p.id]) && (
                            <span className="text-[10px] text-slate-500">
                              后手: {p.stackSize || playerStacks?.[p.id]}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleStartEditPlayer(p)}
                          className="text-blue-400 text-xs px-2 py-1 bg-blue-500/20 rounded hover:bg-blue-500/30"
                        >
                          编辑
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* 备注区域 */}
              <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">复盘备注</h4>
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="在这里记录你的复盘思考、反思或注意事项..."
                className="w-full bg-felt-700 border border-felt-300 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 min-h-[80px] resize-none"
              />
            </div>
          )}
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
          {streetsWithBoard.map((street, idx) => {
            const numCards = street.boardCards ? street.boardCards.length : 0;
            const colWidth = numCards === 5 ? 'w-[160px]' : numCards === 4 ? 'w-[130px]' : 'w-[110px]';
            
            return (
              <div key={idx} className={`${colWidth} flex flex-col border-r border-felt-300 shrink-0 transition-all`}>
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
                    return (
                      <div key={j} className="bg-chip-gold rounded-lg p-2 text-center shadow-md text-black mt-2">
                        <div className="font-extrabold text-[10px] leading-snug">{act.action}</div>
                      </div>
                    );
                  }

                  const pActionArray = parseAction(act.action);
                  const isHeroAction = act.isHero === true || (act.isHero !== false && players.some((p) => p.name === act.player && p.isHero));

                  if (isHeroAction) {
                    return (
                      <div key={j} className="flex w-full justify-end items-start gap-1.5 pl-2 group transition-opacity">
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
                  } else {
                    return (
                      <div key={j} className="flex w-full justify-start items-start gap-1.5 pr-2 group transition-opacity">
                        <div className="flex flex-col items-center shrink-0 w-8">
                          <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-500 overflow-hidden flex items-center justify-center text-[9px] text-slate-200 font-black shadow-sm uppercase tracking-tighter">
                            {act.player.substring(0, 3)}
                          </div>
                          <div className="bg-felt-900 text-slate-300 text-[7px] px-1 rounded-sm -mt-2 z-10 border border-slate-600 font-bold max-w-full truncate">
                            {act.player}
                          </div>
                        </div>
                        <div className="relative bg-white text-slate-900 px-1.5 py-1 rounded shadow-md border border-slate-200 flex flex-col items-center justify-center min-w-[36px] text-center z-10">
                          <div className="absolute top-2 -left-[4px] border-t-[4px] border-t-transparent border-r-[4px] border-r-white border-b-[4px] border-b-transparent"></div>
                          <div className="absolute top-2 -left-[5px] border-t-[4px] border-t-transparent border-r-[4px] border-r-slate-200 border-b-[4px] border-b-transparent -z-10"></div>
                          {pActionArray.map((p, i) => <div key={i} className="text-[9px] font-extrabold leading-tight">{p}</div>)}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          );
        })}
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
