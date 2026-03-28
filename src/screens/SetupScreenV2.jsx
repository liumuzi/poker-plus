import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import CardDisplay from '../components/CardDisplay';
import CardPicker from '../components/CardPicker';
import HorizontalTableDiagram from '../components/HorizontalTableDiagram';
import StageNavigation from '../components/StageNavigation';

/**
 * V2 配置界面 - 新的入池人数配置流程
 * 1. 选择flop入池人数 → 显示横向桌面图 → 自动设置BTN
 * 2. 选择Hero位置
 * 3. 录入公共牌（预留拍照识别）
 * 4. 设置盲注
 */
export default function SetupScreenV2() {
  const {
    playerCount, heroIndex, heroCards, sbAmount, bbAmount, presetCommunityCards, dispatch,
  } = useGame();

  const [step, setStep] = useState(1); // 1: 人数, 2: Hero位置, 3: 公共牌, 4: 盲注

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
    if (step < 4) {
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
      case 2: return heroIndex !== null && heroIndex !== undefined;
      case 3: return true; // 公共牌选填
      case 4: return sbAmount > 0 && bbAmount > 0;
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
          {[1, 2, 3, 4].map((s) => (
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
        {/* Step 1: 选择入池人数 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm p-6">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Step 1</div>
              <div className="text-lg font-black text-slate-800 mb-4">选择Flop入池人数</div>
              <p className="text-sm text-slate-500 mb-6">
                请选择在翻牌圈有多少玩家入池参与
              </p>
              
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
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
                <div className="text-xs font-bold text-slate-400 mb-4 uppercase">桌面预览</div>
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

        {/* Step 2: 选择Hero位置 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm p-6">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Step 2</div>
              <div className="text-lg font-black text-slate-800 mb-4">选择Hero位置</div>
              <p className="text-sm text-slate-500 mb-6">
                点击桌面示意图上的位置来设置你的位置
              </p>
              
              <HorizontalTableDiagram
                playerCount={playerCount}
                heroPosition={heroIndex}
                onSelectHero={handleSelectHeroPosition}
              />
              
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-sm font-bold text-blue-800">
                  当前Hero位置: {getPlayerDisplayName(heroIndex)}
                </div>
              </div>
            </div>

            {/* 底牌选择 */}
            <div className="bg-white rounded-[2rem] shadow-sm p-6">
              <div className="text-xs font-bold text-slate-400 mb-4 uppercase">Hero底牌 (选填)</div>
              <div className="flex justify-center space-x-4">
                <div
                  onClick={() => dispatch({ type: 'SET_PICKING_TARGET', payload: { target: 'hero1' } })}
                  className="w-16 h-22 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-2xl cursor-pointer bg-slate-50 hover:bg-slate-100"
                >
                  <CardDisplay card={heroCards[0]} />
                </div>
                <div
                  onClick={() => dispatch({ type: 'SET_PICKING_TARGET', payload: { target: 'hero2' } })}
                  className="w-16 h-22 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-2xl cursor-pointer bg-slate-50 hover:bg-slate-100"
                >
                  <CardDisplay card={heroCards[1]} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 公共牌录入 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm p-6">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Step 3</div>
              <div className="text-lg font-black text-slate-800 mb-4">录入公共牌 (选填)</div>
              <p className="text-sm text-slate-500 mb-6">
                如果已知公共牌，可以在这里提前录入。也可以在游戏过程中录入。
              </p>
              
              <div className="flex justify-center space-x-2 p-4 bg-emerald-900 rounded-xl">
                {[0, 1, 2, 3, 4].map((i) => {
                  const card = (presetCommunityCards || [])[i] || null;
                  return (
                    <div
                      key={i}
                      onClick={() => dispatch({ type: 'SET_PICKING_TARGET', payload: { target: `community_${i}` } })}
                      className={`w-12 h-16 border-2 rounded-lg flex items-center justify-center text-lg cursor-pointer transition-all ${
                        card 
                          ? 'border-emerald-400 bg-white' 
                          : 'border-dashed border-emerald-600 bg-emerald-800/50 hover:bg-emerald-700/50'
                      }`}
                    >
                      {card ? (
                        <CardDisplay card={card} />
                      ) : (
                        <span className="text-emerald-400">+</span>
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

        {/* Step 4: 盲注设置 */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm p-6">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Step 4</div>
              <div className="text-lg font-black text-slate-800 mb-4">设定盲注大小</div>
              
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

            {/* 配置预览 */}
            <div className="bg-white rounded-[2rem] shadow-sm p-6">
              <div className="text-xs font-bold text-slate-400 mb-4 uppercase">配置预览</div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">入池人数</span>
                  <span className="font-bold text-slate-800">{playerCount}人</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Hero位置</span>
                  <span className="font-bold text-slate-800">{getPlayerDisplayName(heroIndex)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">盲注</span>
                  <span className="font-bold text-slate-800">{sbAmount}/{bbAmount}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">玩家</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {generatePlayerNames().join(', ')}
                  </span>
                </div>
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
          
          {step < 4 ? (
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
              disabled={!canProceed()}
              className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                canProceed()
                  ? 'bg-emerald-500 text-white active:scale-[0.98] shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
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
