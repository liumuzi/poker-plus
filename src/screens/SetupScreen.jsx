import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getPositions } from '../constants/poker';
import { useGame } from '../contexts/GameContext';
import CardDisplay from '../components/CardDisplay';
import CardPicker from '../components/CardPicker';

export default function SetupScreen() {
  const {
    playerCount, heroIndex, heroCards, sbAmount, bbAmount, dispatch,
  } = useGame();

  const handleAbandonSetup = () => {
    if (!confirm('确认放弃当前配置并返回首页吗？')) return;
    dispatch({ type: 'EXIT_TO_HOME' });
  };

  return (
    <div className="flex flex-col p-5 min-h-screen bg-slate-100 select-none">
      <h2 className="text-2xl font-black mb-6 text-slate-800 pt-6">配置对局参数</h2>

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
              {num}人
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

      {/* 底牌选择 */}
      <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-6">
        <div className="text-xs font-bold text-slate-400 mb-4 uppercase">4. 记录我拿到的底牌 (选填)</div>
        <div className="flex justify-center space-x-4">
          <div
            onClick={() => dispatch({ type: 'SET_PICKING_TARGET', payload: { target: 'hero1' } })}
            className="w-20 h-28 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-3xl cursor-pointer bg-slate-50 hover:bg-slate-100"
          >
            <CardDisplay card={heroCards[0]} />
          </div>
          <div
            onClick={() => dispatch({ type: 'SET_PICKING_TARGET', payload: { target: 'hero2' } })}
            className="w-20 h-28 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-3xl cursor-pointer bg-slate-50 hover:bg-slate-100"
          >
            <CardDisplay card={heroCards[1]} />
          </div>
        </div>
      </div>

      <div className="mt-auto mb-6 space-y-2">
        <button
          onClick={() => dispatch({ type: 'START_GAME' })}
          className="w-full bg-slate-800 text-white p-5 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform flex justify-center shadow-xl"
        >
          进入桌台发牌 <ChevronRight className="ml-2 w-6 h-6" />
        </button>
        <button
          onClick={handleAbandonSetup}
          className="mx-auto block text-[11px] text-slate-400 hover:text-slate-500 active:text-slate-600 px-2 py-1"
        >
          放弃并返回首页
        </button>
      </div>
      <CardPicker />
    </div>
  );
}
