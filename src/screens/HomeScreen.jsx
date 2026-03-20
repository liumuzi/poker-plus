import React from 'react';
import { Play } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useSavedGames } from '../hooks/useSavedGames';
import { SUITS } from '../constants/poker';

export default function HomeScreen() {
  const { dispatch } = useGame();
  const { savedGames, deleteGame } = useSavedGames();

  const getGameSummary = (game) => {
    const hero = game.players?.find((p) => p.isHero);
    const heroName = hero?.name || '';
    const heroInvested = Number(hero?.totalInvested || 0);
    const community = Array.isArray(game.communityCards) ? game.communityCards : [];

    const winLog = game.history?.find((h) => h.isWinLog && typeof h.action === 'string');
    let winnerNames = [];
    if (winLog?.action) {
      const head = winLog.action.split(' 赢下底池')[0];
      winnerNames = head.split(' & ').map((s) => s.trim()).filter(Boolean);
    }

    const heroWon = winnerNames.includes(heroName);
    const winnerCount = winnerNames.length;
    const wonShare = heroWon && winnerCount > 0 ? Number(game.potSize || 0) / winnerCount : 0;
    const net = wonShare - heroInvested;

    return {
      net,
      community,
    };
  };

  const formatCompactCard = (card) => {
    const suit = SUITS.find((s) => s.id === card?.suit)?.s || '?';
    return `${suit}${card?.rank || '?'}`;
  };

  const handleNewGame = () => {
    dispatch({ type: 'RESET_FOR_NEW_GAME' });
  };

  const handleLoadSave = (game) => {
    dispatch({ type: 'LOAD_SAVED_GAME', payload: { game } });
  };

  const handleLoadTestCase = () => {
    dispatch({
      type: 'LOAD_TEST_CASE',
      payload: {
        potSize: 72,
        sbAmount: 1,
        bbAmount: 2,
        players: [
          { id: 1, name: 'imafish', isHero: false, knownCards: [null, null] },
          { id: 2, name: 'Nikola..', isHero: false, knownCards: [null, null] },
          { id: 3, name: 'rd8121', isHero: false, knownCards: [null, null] },
          { id: 4, name: 'Godz1lla', isHero: false, knownCards: [null, null] },
          { id: 5, name: 'moq66', isHero: false, knownCards: [null, null] },
          { id: 6, name: 'Lucife..', isHero: true, knownCards: [{ rank: 'J', suit: 's' }, { rank: 'T', suit: 's' }] },
        ],
        communityCards: [
          { rank: '9', suit: 'd' }, { rank: '5', suit: 'c' }, { rank: '7', suit: 's' },
          { rank: '8', suit: 'h' }, { rank: 'K', suit: 'h' },
        ],
        history: [
          { player: 'Lucife..', action: '小盲 $1', pot: 1, isHero: true },
          { player: 'moq66', action: '大盲 $2', pot: 3, isHero: false },
          { isDivider: true, text: '--- 进入 翻前 ---', cards: [] },
          { player: 'imafish', action: 'Fold', pot: 3, isHero: false },
          { player: 'Nikola..', action: 'Fold', pot: 3, isHero: false },
          { player: 'rd8121', action: 'Call 2', pot: 5, isHero: false },
          { player: 'Godz1lla', action: 'Fold', pot: 5, isHero: false },
          { player: 'Lucife..', action: 'Raise to 8', pot: 12, isHero: true },
          { player: 'moq66', action: 'Fold', pot: 12, isHero: false },
          { player: 'rd8121', action: 'Call 6', pot: 18, isHero: false },
          { isDivider: true, text: '--- 进入 Flop ---', cards: [{ rank: '9', suit: 'd' }, { rank: '5', suit: 'c' }, { rank: '7', suit: 's' }] },
          { player: 'Lucife..', action: 'Check', pot: 18, isHero: true },
          { player: 'rd8121', action: 'Raise to 9', pot: 27, isHero: false },
          { player: 'Lucife..', action: 'Raise to 27', pot: 45, isHero: true },
          { player: 'rd8121', action: 'Call 18', pot: 72, isHero: false },
          { isDivider: true, text: '--- 进入 Turn ---', cards: [{ rank: '8', suit: 'h' }] },
          { player: 'Lucife..', action: 'Raise to 36', pot: 108, isHero: true },
          { player: 'rd8121', action: 'Fold', pot: 108, isHero: false },
          { isDivider: true, text: '--- 结算 ---', cards: [] },
          { player: '👑', action: 'Lucife.. 获胜 $72', isWinLog: true },
        ],
      },
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-slate-900 text-white select-none">
      <div className="flex-1 flex flex-col items-center justify-center w-full mt-10">
        <h1 className="text-5xl font-extrabold mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 pb-1">
          Poker+
        </h1>
        <p className="text-slate-400 mb-12 tracking-widest text-sm text-center">
          专业错题本 • 真德扑状态机复盘
        </p>
        <button
          onClick={handleNewGame}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-500/50 active:scale-95 transition-transform mb-4"
        >
          <Play size={20} className="fill-current" />
          <span>新建复盘牌局</span>
        </button>
        <button
          onClick={handleLoadTestCase}
          className="text-xs text-slate-400 underline underline-offset-4 hover:text-slate-300"
        >
          加载测试用例 (还原截图样式)
        </button>
      </div>

      <div className="w-full max-w-sm pb-10">
        <h3 className="text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2">
          本地存档记录 ({savedGames.length})
        </h3>
        {savedGames.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">暂无存档记录</p>
        ) : (
          <div className="flex flex-col space-y-2">
            {savedGames.map((game) => {
              const summary = getGameSummary(game);
              const borderClass =
                summary.net > 0
                  ? 'border-emerald-400'
                  : summary.net < 0
                    ? 'border-rose-400'
                    : 'border-slate-600';
              const netClass =
                summary.net > 0
                  ? 'text-emerald-300'
                  : summary.net < 0
                    ? 'text-rose-300'
                    : 'text-slate-300';

              return (
                <div
                  key={game.id}
                  onClick={() => handleLoadSave(game)}
                  className={`bg-slate-800 rounded-xl px-3 py-2.5 border-l-4 ${borderClass} shadow-sm cursor-pointer hover:bg-slate-700 transition-colors`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 font-mono truncate">{game.date}</div>
                      <div className={`text-xs font-black ${netClass}`}>
                          净值: {summary.net >= 0 ? '+' : ''}{Math.round(summary.net)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-500 mb-0.5">公共牌</div>
                      <div className="flex flex-wrap gap-1 min-h-[18px]">
                        {summary.community.length === 0 ? (
                          <span className="text-[10px] text-slate-500">未发牌</span>
                        ) : (
                          summary.community.map((card, idx) => (
                            <span key={`${game.id}-${idx}`} className="text-[10px] bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded">
                              {formatCompactCard(card)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); deleteGame(game.id); }}
                      className="text-red-400 text-[10px] px-2 py-1 bg-red-400/10 rounded-md hover:bg-red-400/20 active:scale-95 shrink-0"
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
