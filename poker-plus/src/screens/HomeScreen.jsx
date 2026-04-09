import React from 'react';
import { Play, Zap, Keyboard, Mic } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useSavedGames } from '../hooks/useSavedGames';
import { SUITS } from '../constants/poker';

const RECORD_MODES = (handleNewGame, handleNewGameV2) => [
  { id: 'full',      title: '全量复盘', subtitle: '完整记录每一个行动', Icon: Play,     available: true,  onClick: handleNewGame    },
  { id: 'quick',     title: '快捷复盘', subtitle: '入池人数快速配置',   Icon: Zap,      available: true,  onClick: handleNewGameV2  },
  { id: 'shorthand', title: '专业简记', subtitle: '输入简记法自动解析', Icon: Keyboard, available: false, onClick: () => {} },
  { id: 'voice',     title: '语音输入', subtitle: '语音转录牌局记录',   Icon: Mic,      available: false, onClick: () => {} },
];

export default function HomeScreen() {
  const { dispatch } = useGame();
  const { savedGames, deleteGame } = useSavedGames();

  const handleNewGame = () => dispatch({ type: 'RESET_FOR_NEW_GAME' });
  const handleNewGameV2 = () => dispatch({ type: 'RESET_FOR_NEW_GAME_V2' });

  const handleLoadSave = (game) => dispatch({ type: 'LOAD_SAVED_GAME', payload: { game } });

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
    const heroCards = game.heroCards || (hero && hero.knownCards) || [];

    return { net, community, heroCards };
  };

  const formatCompactCard = (card) => {
    const suit = SUITS.find((s) => s.id === card?.suit)?.s || '?';
    return `${suit}${card?.rank || '?'}`;
  };

  const modes = RECORD_MODES(handleNewGame, handleNewGameV2);

  return (
    <div className="flex flex-col min-h-screen bg-felt-700 text-white select-none pb-20">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center pt-16 pb-8">
        <h1 className="text-6xl font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 pb-1">
          Poker+
        </h1>
        <p className="text-slate-400 text-sm tracking-widest mt-1 text-center">
          专业错题本 · 真德扑状态机复盘
        </p>
      </div>

      {/* 记录模式选择 */}
      <div className="px-4 mb-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">选择记录模式</p>
        <div className="grid grid-cols-2 gap-2">
          {modes.map(({ id, title, Icon, available, onClick }) => (
            <button
              key={id}
              onClick={onClick}
              className={`flex items-center gap-3 bg-gray-800 rounded-2xl px-5 py-4 active:bg-gray-700 transition-colors ${!available ? 'opacity-50' : ''}`}
            >
              <Icon size={20} color="white" strokeWidth={1.8} />
              <span className="text-white font-bold text-base leading-none">{title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 本地存档列表 */}
      <div className="px-4 pb-6">
        <h3 className="text-lg font-bold text-slate-300 mb-4 border-b border-felt-300 pb-2">
          本地存档记录 ({savedGames.length})
        </h3>
        {savedGames.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">暂无存档记录</p>
        ) : (
          <div className="flex flex-col space-y-2">
            {savedGames.map((game) => {
              const summary = getGameSummary(game);
              const borderClass =
                summary.net > 0 ? 'border-emerald-400' : summary.net < 0 ? 'border-rose-400' : 'border-slate-600';
              const netClass =
                summary.net > 0 ? 'text-emerald-300' : summary.net < 0 ? 'text-rose-300' : 'text-slate-300';

              return (
                <div
                  key={game.id}
                  onClick={() => handleLoadSave(game)}
                  className={`bg-felt-500 rounded-xl px-3 py-2.5 border-l-4 ${borderClass} shadow-sm cursor-pointer hover:bg-felt-300 transition-colors`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="shrink-0 w-[55px] pt-1 pb-1 flex flex-col justify-center">
                      <div className="text-[10px] text-slate-400 font-mono truncate mb-1">
                        {game.date ? game.date.split(' ')[0] : ''}
                      </div>
                      <div className={`text-base font-black ${netClass}`}>
                        {summary.net >= 0 ? '+' : ''}{Math.round(summary.net)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-[7px] py-[3px]">
                      <div className="flex items-start gap-2">
                        <div className="text-[10px] text-slate-500 w-9 shrink-0 leading-[18px]">手牌</div>
                        <div className="flex flex-row overflow-hidden gap-[3px] min-h-[18px] pl-0.5">
                          {summary.heroCards && summary.heroCards.filter(Boolean).length > 0 ? (
                            summary.heroCards.filter(Boolean).map((card, idx) => (
                              <span key={`hero-${game.id}-${idx}`} className="text-[10px] bg-indigo-900 border border-indigo-700 text-indigo-100 px-1 py-0.5 rounded">
                                {formatCompactCard(card)}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500 leading-[18px]">—</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-[10px] text-slate-500 w-9 shrink-0 leading-[18px]">公共牌</div>
                        <div className="flex flex-row overflow-hidden gap-[3px] min-h-[18px] pl-0.5">
                          {summary.community.length === 0 ? (
                            <span className="text-[10px] text-slate-500 leading-[18px]">未发牌</span>
                          ) : (
                            summary.community.map((card, idx) => (
                              <span key={`${game.id}-${idx}`} className="text-[10px] bg-slate-700 text-slate-200 px-1 py-0.5 rounded">
                                {formatCompactCard(card)}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteGame(game.id); }}
                      className="text-red-400 text-[10px] px-2 py-1 bg-red-400/10 rounded-md hover:bg-red-400/20 active:scale-95 shrink-0"
                    >
                      删除
                    </button>
                  </div>
                  {game.gameNotes && game.gameNotes.trim() && (
                    <div className="mt-1.5 text-[10px] text-slate-400 leading-snug line-clamp-2 pl-[63px] pr-2">
                      {game.gameNotes.trim()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
