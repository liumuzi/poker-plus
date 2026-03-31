import React, { useEffect, useState } from 'react';
import { ROUND_NAMES } from '../constants/poker';
import { useGame } from '../contexts/GameContext';
import CardPicker from '../components/CardPicker';
import TableActionView from '../components/TableActionView';
import PlayerBadge from '../components/PlayerBadge';
import StageNavigation from '../components/StageNavigation';

/**
 * 获取指定街道的预设公共牌
 * @returns 牌数组（flop=3张, turn/river=1张）或null表示没有预设
 */
function getPresetCardsForStreet(street, presetCommunityCards) {
  const presetCards = presetCommunityCards || [];
  if (street === 'flop' && presetCards[0] && presetCards[1] && presetCards[2]) {
    return [presetCards[0], presetCards[1], presetCards[2]];
  }
  if (street === 'turn' && presetCards[3]) {
    return [presetCards[3]];
  }
  if (street === 'river' && presetCards[4]) {
    return [presetCards[4]];
  }
  return null;
}

export default function PlayScreen() {
  const {
    players, currentTurn, bettingRound, potSize, highestBet,
    heroCards, communityCards, historySnapshots, isV2Mode,
    pickingCardsTarget, presetCommunityCards, savedFutureState,
    pickingFirstActor, dispatch,
  } = useGame();

  // V2模式：公共牌已在设置阶段录入，街道转换直接使用预设牌，不再弹出录入界面
  useEffect(() => {
    if (!isV2Mode || !pickingCardsTarget) return;
    const streetTargets = ['flop', 'turn', 'river'];
    if (!streetTargets.includes(pickingCardsTarget)) return;

    const cards = getPresetCardsForStreet(pickingCardsTarget, presetCommunityCards) ?? [];
    dispatch({ type: 'TRANSITION_STREET', payload: { cards } });
  }, [isV2Mode, pickingCardsTarget, presetCommunityCards, dispatch]);

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

  const handleNameChange = (playerId, newName) => {
    dispatch({ type: 'UPDATE_PLAYER_NAME', payload: { playerId, name: newName } });
  };

  const [showRaiseDrawer, setShowRaiseDrawer] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState('');

  const checkLabel = (highestBet === 0 || activePlayer.betThisRound === highestBet) ? 'Check' : 'Call';

  const handleAction = (type) => {
    if (type === 'Fold') {
      dispatch({ type: 'PLAYER_ACTION', payload: { action: 'Fold' } });
    } else if (type === 'Check/Call') {
      dispatch({ type: 'PLAYER_ACTION', payload: { action: 'Check/Call' } });
    } else if (type === 'Bet') {
      setShowRaiseDrawer(true);
      setRaiseAmount('');
    }
  };

  const handleConfirmRaise = () => {
    const amt = parseInt(raiseAmount, 10);
    if (!amt || amt <= 0) return;
    const actionType = highestBet > 0 ? 'Raise' : 'Bet';
    dispatch({ type: 'PLAYER_ACTION', payload: { action: actionType, amount: amt } });
    setShowRaiseDrawer(false);
    setRaiseAmount('');
  };

  // 获取当前阶段名称用于导航
  const getCurrentStageName = () => {
    const stageMap = ['preflop', 'flop', 'turn', 'river'];
    return stageMap[bettingRound] || 'preflop';
  };

  // 计算savedFutureState中可达的最远阶段
  const getMaxReachableStage = () => {
    if (!savedFutureState) return null;
    const stageMap = ['preflop', 'flop', 'turn', 'river'];
    return stageMap[savedFutureState.bettingRound] || 'river';
  };

  const handleNavigateToStage = (stageName) => {
    dispatch({ type: 'NAVIGATE_TO_STAGE', payload: { stage: stageName } });
  };

  return (
    <div className="flex flex-col min-h-screen max-h-screen bg-slate-50 relative select-none">
      {/* 顶部状态板 */}
      <div className="flex-none bg-slate-900 text-white px-4 pt-3 pb-3 z-20">
        {/* 流程导航 */}
        {isV2Mode && (
          <StageNavigation
            currentStage={getCurrentStageName()}
            onNavigate={handleNavigateToStage}
            maxReachableStage={getMaxReachableStage()}
          />
        )}

        {/* 操作按钮 + 状态信息 */}
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={handleExitToHome}
            className="text-[11px] bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg font-bold text-slate-400 active:scale-95 transition-all"
          >
            退出
          </button>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Round</div>
              <div className="text-sm font-black text-amber-400 leading-tight">
                {ROUND_NAMES[bettingRound].split(' ')[0]}
              </div>
            </div>
            <div className="w-px h-6 bg-slate-700" />
            <div className="text-center">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Pot</div>
              <div className="text-sm font-black text-white leading-tight">{potSize}</div>
            </div>
          </div>

          {historySnapshots.length > 0 ? (
            <button
              onClick={handleUndo}
              className="text-[11px] bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg font-bold text-slate-400 active:scale-95 transition-all"
            >
              撤销
            </button>
          ) : (
            <div className="w-[42px]" />
          )}
        </div>
      </div>

      {/* 中心桌面视图 */}
      <div className="flex-1 flex flex-col px-4 pt-2 pb-0 z-0 min-h-0 relative">
        <TableActionView player={activePlayer} onAction={handleAction} />

        {/* Preflop 首先行动选择覆层 */}
        {pickingFirstActor && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
            <p className="text-[13px] font-bold text-slate-500 mb-4 tracking-wide">请选择 Preflop 首先行动的玩家</p>
            <div className="flex flex-wrap gap-2 justify-center px-4">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => dispatch({ type: 'SET_FIRST_ACTOR', payload: { index: p.id } })}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-black border-2 transition-all active:scale-95
                    ${p.isHero
                      ? 'bg-amber-400 border-amber-500 text-amber-900'
                      : p.id === 0
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-700'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 行动按钮区 */}
      <div className="flex-none px-4 pt-2 pb-3 z-10">
        {/* 滑动提示 */}
        <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-2 px-2">
          <span>← 左滑 Fold</span>
          <span>右滑 {checkLabel} →</span>
        </div>
        {/* 三列按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('Fold')}
            className="flex-1 py-3.5 rounded-2xl bg-red-50 text-red-500 font-black text-sm border border-red-100 active:scale-95 transition-all"
          >
            Fold
          </button>
          <button
            onClick={() => handleAction('Bet')}
            className="flex-1 py-3.5 rounded-2xl bg-amber-400 text-amber-900 font-black text-sm shadow-md active:scale-95 transition-all"
          >
            Bet / Raise
          </button>
          <button
            onClick={() => handleAction('Check/Call')}
            className="flex-1 py-3.5 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-sm border border-emerald-100 active:scale-95 transition-all"
          >
            {checkLabel}
          </button>
        </div>

        {/* Raise 金额输入抽屉 */}
        {showRaiseDrawer && (
          <div className="mt-3 flex gap-2 items-center">
            <input
              type="number"
              inputMode="numeric"
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(e.target.value)}
              placeholder="输入金额"
              className="flex-1 py-3 px-4 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-sm outline-none focus:border-amber-400"
              autoFocus
            />
            <button
              onClick={handleConfirmRaise}
              className="px-5 py-3 rounded-2xl bg-amber-400 text-amber-900 font-black text-sm shadow-md active:scale-95 transition-all"
            >
              确认
            </button>
            <button
              onClick={() => setShowRaiseDrawer(false)}
              className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-400 font-bold text-sm active:scale-95 transition-all"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* 底部玩家状态条 */}
      <div className="flex-none w-full px-4 pt-3 pb-5 bg-slate-100 border-t border-slate-200 z-10">
        <div className="flex justify-between text-[11px] text-slate-500 mb-3 font-black tracking-wider uppercase px-1">
          长按玩家名可改名 · 点击补录亮牌
        </div>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <PlayerBadge
              key={p.id}
              player={p}
              isActive={p.id === currentTurn}
              onRevealCard={handleRevealCard}
              onNameChange={handleNameChange}
            />
          ))}
        </div>
      </div>
      <CardPicker />
    </div>
  );
}
