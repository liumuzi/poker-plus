import React, { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import CardDisplay from '../components/CardDisplay';
import CardPicker from '../components/CardPicker';

export default function ResolutionScreen() {
  const { players, potSize, winners, dispatch } = useGame();

  const activePlayers = players.filter((p) => !p.folded);
  const isShowdown = activePlayers.length > 1;

  // 只剩1名玩家：自动获胜，无需确认
  useEffect(() => {
    if (activePlayers.length === 1) {
      dispatch({ type: 'TOGGLE_WINNER', payload: { playerId: activePlayers[0].id } });
      dispatch({ type: 'FINISH_HAND' });
    }
  }, []);

  const toggleWinner = (id) => {
    dispatch({ type: 'TOGGLE_WINNER', payload: { playerId: id } });
  };

  const finishHand = () => {
    if (winners.length === 0) {
      if (!confirm('您还未选择赢家，确定要跳过直接看复盘吗？')) return;
    }
    dispatch({ type: 'FINISH_HAND' });
  };

  const handleReveal = (playerId, cardPos) => {
    dispatch({ type: 'SET_PICKING_TARGET', payload: { target: `reveal_${playerId}_${cardPos}` } });
  };

  const handleExitToHome = () => {
    if (!confirm('确定放弃当前复盘并返回主菜单吗？未保存内容会丢失。')) return;
    dispatch({ type: 'EXIT_TO_HOME' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative select-none">
      <div className="flex flex-col px-6 pt-10 pb-6 bg-slate-900 shadow-xl rounded-b-[2rem] z-10 font-sans">
        <button
          onClick={handleExitToHome}
          className="self-start mb-3 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 px-3 py-1.5 rounded-full font-bold text-slate-300 shadow-sm active:scale-95 transition-all"
        >
          放弃并返回
        </button>
        <h2 className="text-2xl font-black text-white mb-2">对局结束结算</h2>
        <p className="text-slate-400 text-sm">请指定赢家并补录残存玩家的亮牌</p>
        <div className="mt-4 p-4 bg-slate-800 rounded-2xl flex justify-between items-center border border-slate-700">
          <span className="text-slate-300 font-bold uppercase tracking-wider text-xs">Final Pot Size</span>
          <span className="text-3xl font-black text-amber-400">{potSize}</span>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto z-0 pb-20">
        {isShowdown && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm font-bold shadow-sm">
            比牌阶段！目前有 {activePlayers.length} 名玩家坚持到了最后，请点击下方的卡槽记录他们的底牌。
          </div>
        )}

        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-1">
          本局仍存活在场上的玩家：
        </h3>
        <div className="flex flex-col gap-3">
          {activePlayers.map((p) => {
            const isWin = winners.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggleWinner(p.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isWin ? 'bg-amber-50 border-amber-400 shadow-md' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isWin ? 'border-amber-500 bg-amber-500 text-white font-black text-xs' : 'border-slate-300'
                    }`}
                  >
                    {isWin && '✓'}
                  </div>
                  <span
                    className={`font-black text-lg ${isWin ? 'text-amber-700' : 'text-slate-700'} ${
                      p.isHero ? 'text-blue-600' : ''
                    }`}
                  >
                    {p.name}{p.isHero && ' 👑'}
                  </span>
                </div>

                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                  <div
                    onClick={() => handleReveal(p.id, 0)}
                    className="w-10 h-14 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center text-sm cursor-pointer hover:bg-slate-200 shadow-inner"
                  >
                    {p.knownCards?.[0] ? <CardDisplay card={p.knownCards[0]} /> : '?'}
                  </div>
                  <div
                    onClick={() => handleReveal(p.id, 1)}
                    className="w-10 h-14 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center text-sm cursor-pointer hover:bg-slate-200 shadow-inner"
                  >
                    {p.knownCards?.[1] ? <CardDisplay card={p.knownCards[1]} /> : '?'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 z-40">
        <button
          onClick={finishHand}
          className={`w-full py-4 text-lg font-black text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center ${
            winners.length > 0 ? 'bg-amber-500' : 'bg-slate-800'
          }`}
        >
          {winners.length > 0 ? '确认赢家并生成复盘' : '跳过输赢直接看复盘'}
        </button>
      </div>
      <CardPicker />
    </div>
  );
}
