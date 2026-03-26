import React from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 节点流程图导航组件
 * 显示: 入池配置 → preflop → flop → turn → river
 */
export default function StageNavigation({ currentStage, onNavigate }) {
  const stages = [
    { id: 'setup', label: '入池配置', shortLabel: '配置' },
    { id: 'preflop', label: '翻前', shortLabel: 'Pre' },
    { id: 'flop', label: '翻牌', shortLabel: 'Flop' },
    { id: 'turn', label: '转牌', shortLabel: 'Turn' },
    { id: 'river', label: '河牌', shortLabel: 'River' },
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.id === currentStage);
  };

  const currentIndex = getCurrentStageIndex();

  const handleStageClick = (stage, index) => {
    // 只能点击已完成的阶段或当前阶段
    if (index <= currentIndex && onNavigate) {
      onNavigate(stage.id);
    }
  };

  return (
    <div className="flex items-center justify-center px-2 py-2 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
      {stages.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isClickable = index <= currentIndex;

        return (
          <React.Fragment key={stage.id}>
            {/* 节点 */}
            <button
              onClick={() => handleStageClick(stage, index)}
              disabled={!isClickable}
              className={`flex flex-col items-center px-1.5 py-1 rounded-lg transition-all ${
                isClickable ? 'cursor-pointer hover:bg-slate-700/50' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                  isCurrent
                    ? 'bg-blue-500 border-blue-400 text-white ring-2 ring-blue-300/50'
                    : isCompleted
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={`text-[9px] mt-0.5 font-bold ${
                  isCurrent
                    ? 'text-blue-400'
                    : isCompleted
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                }`}
              >
                {stage.shortLabel}
              </span>
            </button>

            {/* 连接线 */}
            {index < stages.length - 1 && (
              <div
                className={`w-4 h-0.5 mx-0.5 ${
                  index < currentIndex ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
