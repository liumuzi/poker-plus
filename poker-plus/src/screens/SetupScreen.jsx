import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getPositions } from '../constants/poker';
import { useGame } from '../contexts/GameContext';
import CardPicker from '../components/CardPicker';

const SUIT_DATA = [
  { id: 's', s: '♠', color: 'text-slate-800' },
  { id: 'h', s: '♥', color: 'text-red-500' },
  { id: 'd', s: '♦', color: 'text-red-500' },
  { id: 'c', s: '♣', color: 'text-slate-800' },
];

function getCardData(card) {
  if (!card) return null;
  const s = SUIT_DATA.find(x => x.id === card.suit);
  return s ? { symbol: s.s, rank: card.rank, colorClass: s.color } : null;
}

function CardSlot({ card, onClick, width = '72px' }) {
  const data = getCardData(card);
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-150 active:scale-95 select-none rounded-2xl shadow-md border
        ${data ? 'bg-white border-slate-200 hover:shadow-lg' : 'border-transparent hover:opacity-80'}`}
      style={{ width, aspectRatio: '5/7' }}
    >
      {data ? (
        <>
          <div className={`absolute top-2 left-2 leading-none ${data.colorClass}`}>
            <div className="text-sm font-black leading-none">{data.rank}</div>
          </div>
          <div className={`absolute inset-0 flex items-center justify-center ${data.colorClass}`}
            style={{ fontSize: width === '72px' ? '2rem' : '1.5rem' }}>
            {data.symbol}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-red-700">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`cross-slot-${Math.random()}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="10" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                <line x1="10" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cross-slot-0)"/>
          </svg>
          <div className="absolute inset-[5px] rounded-xl border border-white/30" />
        </div>
      )}
    </div>
  );
}

export default function SetupScreen() {
  const {
    playerCount, heroIndex, heroCards, sbAmount, bbAmount,
    presetCommunityCards, dispatch,
  } = useGame();

  const handleAbandonSetup = () => {
    if (!confirm('确认放弃当前配置并返回首页吗？')) return;
    dispatch({ type: 'EXIT_TO_HOME' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 select-none">
      {/* 顶部导航 */}
      <div className="flex-none bg-slate-900 pt-6 pb-4 px-4 rounded-b-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={handleAbandonSetup}
            className="text-xs text-slate-400 hover:text-slate-300 px-2 py-1"
          >
            ← 返回
          </button>
          <h2 className="text-lg font-bold text-white">全量复盘配置</h2>
          <div className="w-12" />
        </div>
      </div>
      <div className="flex flex-col p-5">

      {/* 人数选择 */}
      <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-4">
        <div className="text-xs font-bold text-slate-400 mb-4 uppercase">1. 选择桌上人数</div>
        <div className="grid grid-cols-5 gap-2">
          {[4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => dispatch({ type: 'SET_PLAYER_COUNT', payload: { count: num } })}
              className={`py-3 rounded-xl font-bold text-sm ${
                playerCount === num
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-50 text-slate-500 border border-slate-100'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* 盲注设置 */}
      <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-4">
        <div className="text-xs font-bold text-slate-400 mb-4 uppercase">2. 设定本局盲注大小</div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-400 mb-2">小盲 (SB)</label>
            <input
              type="number"
              pattern="[0-9]*"
              value={sbAmount === 0 ? '' : sbAmount}
              onChange={(e) => dispatch({ type: 'SET_BLINDS', payload: { sb: e.target.value === '' ? 0 : Number(e.target.value) } })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-400 mb-2">大盲 (BB)</label>
            <input
              type="number"
              pattern="[0-9]*"
              value={bbAmount === 0 ? '' : bbAmount}
              onChange={(e) => dispatch({ type: 'SET_BLINDS', payload: { bb: e.target.value === '' ? 0 : Number(e.target.value) } })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Hero 位置 */}
      <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-4">
        <div className="text-xs font-bold text-slate-400 mb-4 uppercase">3. 我 (Hero) 的位置在哪？</div>
        <div className="grid grid-cols-4 gap-2">
          {getPositions(playerCount).map((pos, idx) => (
            <button
              key={idx}
              onClick={() => dispatch({ type: 'SET_HERO_INDEX', payload: { index: idx } })}
              className={`py-2.5 rounded-xl font-bold text-xs ${
                heroIndex === idx
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 border border-slate-100'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* 手牌录入 */}
      <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-4">
        <div className="text-xs font-bold text-slate-400 mb-4 uppercase">4. 手牌录入 (选填)</div>
        <div className="flex justify-center gap-5">
          {[{ target: 'hero1', card: heroCards[0] }, { target: 'hero2', card: heroCards[1] }].map(({ target, card }) => (
            <CardSlot
              key={target}
              card={card}
              width="72px"
              onClick={() => dispatch({ type: 'SET_PICKING_TARGET', payload: { target } })}
            />
          ))}
        </div>
      </div>

      {/* 公共牌录入 */}
      <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-6">
        <div className="text-xs font-bold text-slate-400 mb-4 uppercase">5. 公共牌录入 (选填)</div>
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <CardSlot
              key={i}
              card={(presetCommunityCards || [])[i] || null}
              width="52px"
              onClick={() => dispatch({ type: 'SET_PICKING_TARGET', payload: { target: `community_${i}` } })}
            />
          ))}
        </div>
        {(presetCommunityCards || []).filter(Boolean).length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => dispatch({ type: 'CLEAR_SETUP_COMMUNITY_CARDS' })}
              className="text-xs text-slate-400 underline hover:text-slate-600"
            >
              清除所有公共牌
            </button>
          </div>
        )}
      </div>

      <div className="mt-auto mb-6 space-y-2">
        <button
          onClick={() => dispatch({ type: 'START_GAME' })}
          className="w-full bg-slate-800 text-white p-5 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform flex justify-center shadow-xl"
        >
          进入桌台发牌 <ChevronRight className="ml-2 w-6 h-6" />
        </button>
      </div>
      <CardPicker />
    </div>
    </div>
  );
}
