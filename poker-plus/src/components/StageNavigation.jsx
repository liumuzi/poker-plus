import React from 'react';

/**
 * 顶部流程导航 — 简约对称样式
 */
export default function StageNavigation({ currentStage, onNavigate, maxReachableStage }) {
  const stages = [
    { id: 'setup',   label: 'Setup' },
    { id: 'preflop', label: 'Pre' },
    { id: 'flop',    label: 'Flop' },
    { id: 'turn',    label: 'Turn' },
    { id: 'river',   label: 'River' },
  ];

  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const maxReachableIndex = maxReachableStage
    ? stages.findIndex(s => s.id === maxReachableStage)
    : -1;

  const handleClick = (stage, index) => {
    const clickable = index <= currentIndex || (maxReachableIndex >= 0 && index <= maxReachableIndex);
    if (clickable && onNavigate) onNavigate(stage.id);
  };

  return (
    <div className="flex items-start justify-center">
      {stages.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent   = index === currentIndex;
        const isForward   = !isCurrent && !isCompleted && maxReachableIndex >= 0 && index <= maxReachableIndex;
        const isClickable = index <= currentIndex || isForward;

        return (
          <React.Fragment key={stage.id}>
            {/* 节点 */}
            <button
              onClick={() => handleClick(stage, index)}
              disabled={!isClickable}
              className="flex flex-col items-center px-3 focus:outline-none"
            >
              <div className={`w-1.5 h-1.5 rounded-full mt-[5px] mb-1 transition-all ${
                isCurrent   ? 'bg-white scale-125' :
                isCompleted ? 'bg-emerald-400' :
                isForward   ? 'bg-amber-400' :
                              'bg-slate-600'
              }`} />
              <span className={`text-[10px] font-bold tracking-wide transition-all ${
                isCurrent   ? 'text-white' :
                isCompleted ? 'text-emerald-400' :
                isForward   ? 'text-amber-400' :
                              'text-slate-500'
              }`}>
                {stage.label}
              </span>
            </button>

            {/* 连接线 — 与圆点垂直居中 */}
            {index < stages.length - 1 && (
              <div className="flex items-start pt-[5px]">
                <div className={`w-8 h-px mt-[3px] transition-all ${
                  index < currentIndex ? 'bg-emerald-500/60' :
                  (isForward || (index < maxReachableIndex && index >= currentIndex)) ? 'bg-amber-500/40' :
                  'bg-slate-700'
                }`} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
