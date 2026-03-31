import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import CardDisplay from '../components/CardDisplay';
import CardPicker from '../components/CardPicker';
import HorizontalTableDiagram from '../components/HorizontalTableDiagram';

/**
 * V2 配置界面 - 新的入池人数配置流程
 * 1. 选择flop入池人数 → 显示横向桌面图 → 点击设置Hero位置
 * 2. 录入Hero底牌 + 公共牌（预留拍照识别）
 * 3. 设置盲注
 */
export default function SetupScreenV2() {
  const {
    playerCount, heroIndex, heroCards, presetCommunityCards, dispatch,
  } = useGame();

  const [step, setStep] = useState(1); // 1: 人数+Hero位置, 2: 底牌+公共牌

  const handleAbandonSetup = () => {
    if (!confirm('确认放弃当前配置并返回首页吗？')) return;
    dispatch({ type: 'EXIT_TO_HOME' });
  };

  const handleSelectPlayerCount = (count) => {
    dispatch({ type: 'SET_PLAYER_COUNT_V2', payload: { count } });
  };

  const handleSelectHeroPosition = (index) => {
    dispatch({ type: 'SET_HERO_INDEX', payload: { index } });
  };

  const handleNextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStartGame = () => {
    dispatch({ type: 'START_GAME_V2' });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return playerCount >= 2;
      case 2: return true;
      default: return false;
    }
  };

  // 生成玩家名称（玩家1, 玩家2... Hero）
  const generatePlayerNames = () => {
    const names = [];
    for (let i = 0; i < playerCount; i++) {
      names.push(getPlayerDisplayName(i));
    }
    return names;
  };

  // 获取单个玩家显示名称（提取共用逻辑）
  const getPlayerDisplayName = (index) => {
    if (index === heroIndex) {
      return 'Hero';
    } else if (index === 0) {
      return 'BTN';
    } else {
      return `玩家${index}`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 select-none">
      {/* 顶部导航 */}
      <div className="flex-none bg-slate-900 pt-6 pb-4 px-4 rounded-b-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleAbandonSetup}
            className="text-xs text-slate-400 hover:text-slate-300 px-2 py-1"
          >
            ← 返回
          </button>
          <h2 className="text-lg font-bold text-white">新建入池配置</h2>
          <div className="w-12" /> {/* 占位 */}
        </div>
        
        {/* 步骤指示器 */}
        <div className="flex justify-center space-x-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                s === step
                  ? 'bg-blue-500 w-6'
                  : s < step
                    ? 'bg-emerald-500'
                    : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* Step 1: 选择入池人数 + Hero位置 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm p-6">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Step 1</div>
              <div className="text-lg font-black text-slate-800 mb-4">选择Flop入池人数</div>
              <p className="text-sm text-slate-500 mb-6">
                请选择在翻牌圈有多少玩家入池参与
              </p>
              
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleSelectPlayerCount(num)}
                    className={`py-4 rounded-xl font-bold text-lg ${
                      playerCount === num
                        ? 'bg-blue-500 text-white shadow-md scale-105'
                        : 'bg-slate-50 text-slate-500 border border-slate-100 hover:border-blue-300'
                    } transition-all`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {playerCount >= 2 && (
              <div className="bg-white rounded-[2rem] shadow-sm p-6">
                <div className="text-xs font-bold text-slate-400 mb-4 uppercase">桌面预览 · 点击设置Hero位置</div>
                <HorizontalTableDiagram
                  playerCount={playerCount}
                  heroPosition={heroIndex}
                  onSelectHero={handleSelectHeroPosition}
                />
                <p className="text-xs text-slate-400 mt-4 text-center">
                  BTN位置已自动设置在右侧，点击位置可设置Hero
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Hero底牌 + 公共牌录入 */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Hero底牌 */}
            <div className="bg-white rounded-[2rem] shadow-sm p-6">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Step 2</div>
              <div className="text-lg font-black text-slate-800 mb-4">手牌录入</div>
              <div className="flex justify-center gap-5">
                {[{ target: 'hero1', card: heroCards[0] }, { target: 'hero2', card: heroCards[1] }].map(({ target, card }) => {
                  const data = card ? (() => { const s = [{id:'s',s:'♠',color:'text-slate-800'},{id:'h',s:'♥',color:'text-red-500'},{id:'d',s:'♦',color:'text-red-500'},{id:'c',s:'♣',color:'text-slate-800'}].find(x=>x.id===card.suit); return s ? { symbol: s.s, rank: card.rank, colorClass: s.color } : null; })() : null;
                  return (
                    <div
                      key={target}
                      onClick={() => dispatch({ type: 'SET_PICKING_TARGET', payload: { target } })}
                      className={`relative cursor-pointer transition-all duration-150 active:scale-95 select-none
                        w-[72px] rounded-2xl shadow-md border
                        ${data ? 'bg-white border-slate-200 hover:shadow-lg' : 'border-transparent hover:opacity-80'}`}
                      style={{ aspectRatio: '5/7' }}
                    >
                      {data ? (
                        <>
                          {/* 左上角 rank */}
                          <div className={`absolute top-2 left-2.5 leading-none ${data.colorClass}`}>
                            <div className="text-base font-black">{data.rank}</div>
                          </div>
                          {/* 中心大花色 */}
                          <div className={`absolute inset-0 flex items-center justify-center text-4xl ${data.colorClass}`}>
                            {data.symbol}
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-red-700">
                          {/* 经典交叉斜线图案 */}
                          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <pattern id={`cross-${target}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                                <line x1="0" y1="0" x2="10" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                                <line x1="10" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill={`url(#cross-${target})`}/>
                          </svg>
                          {/* 白色内边框 */}
                          <div className="absolute inset-[5px] rounded-xl border border-white/30" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 公共牌 */}
            <div className="bg-white rounded-[2rem] shadow-sm p-6">
              <div className="text-xs font-bold text-slate-400 mb-4 uppercase">公共牌 (选填)</div>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4].map((i) => {
                  const card = (presetCommunityCards || [])[i] || null;
                  const data = card ? (() => { const s = [{id:'s',s:'♠',color:'text-slate-800'},{id:'h',s:'♥',color:'text-red-500'},{id:'d',s:'♦',color:'text-red-500'},{id:'c',s:'♣',color:'text-slate-800'}].find(x=>x.id===card.suit); return s ? { symbol: s.s, rank: card.rank, colorClass: s.color } : null; })() : null;
                  return (
                    <div
                      key={i}
                      onClick={() => dispatch({ type: 'SET_PICKING_TARGET', payload: { target: `community_${i}` } })}
                      className={`relative cursor-pointer transition-all duration-150 active:scale-95 select-none rounded-2xl shadow-md border
                        ${data ? 'bg-white border-slate-200 hover:shadow-lg' : 'border-transparent hover:opacity-80'}`}
                      style={{ width: '52px', aspectRatio: '5/7' }}
                    >
                      {data ? (
                        <>
                          {/* 左上角 rank */}
                          <div className={`absolute top-1.5 left-2 leading-none ${data.colorClass}`}>
                            <div className="text-xs font-black">{data.rank}</div>
                          </div>
                          {/* 中心大花色 */}
                          <div className={`absolute inset-0 flex items-center justify-center text-2xl ${data.colorClass}`}>
                            {data.symbol}
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-red-700">
                          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <pattern id={`cross-c${i}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                                <line x1="0" y1="0" x2="10" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                                <line x1="10" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill={`url(#cross-c${i})`}/>
                          </svg>
                          <div className="absolute inset-[4px] rounded-xl border border-white/30" />
                        </div>
                      )}
                    </div>
                  );
                })}
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
              
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700">
                  💡 提示：未来版本将支持拍照识别公共牌
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 底部操作按钮 */}
      <div className="flex-none p-5 bg-white border-t border-slate-100 shadow-lg">
        <div className="flex space-x-3">
          {step > 1 && (
            <button
              onClick={handlePrevStep}
              className="flex-none px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          {step < 2 ? (
            <button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                canProceed()
                  ? 'bg-blue-500 text-white active:scale-[0.98] shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              下一步 <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleStartGame}
              className="flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all bg-emerald-500 text-white active:scale-[0.98] shadow-lg"
            >
              开始复盘 <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <CardPicker />
    </div>
  );
}
