import React from 'react';

/**
 * 简约风格桌面示意图
 * 椭圆桌面，BTN 固定右侧，玩家可点击选择 Hero 座位
 */
export default function HorizontalTableDiagram({
  playerCount,
  heroPosition,
  onSelectHero,
}) {
  const seats = Array.from({ length: playerCount }, (_, i) => ({
    id: i,
    label: i === 0 ? 'BTN' : `${i}`,
    isBtn: i === 0,
  }));

  // 计算座位坐标，BTN 从右侧（0°）顺时针排列
  const getSeatPos = (index, total) => {
    const startAngle = 0; // 右侧
    const angle = (startAngle + (index / total) * 360) * (Math.PI / 180);
    const rx = 38; // 水平半径 %
    const ry = 32; // 垂直半径 %
    return {
      left: `${50 + rx * Math.cos(angle)}%`,
      top: `${50 + ry * Math.sin(angle)}%`,
    };
  };

  return (
    <div className="relative w-full" style={{ paddingBottom: '56%' }}>
      {/* 桌面 */}
      <div className="absolute inset-4 rounded-[40%] border-2 border-slate-200 bg-slate-50" />

      {/* 中心提示 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] text-slate-300 font-medium tracking-wide select-none">
          点击座位设为 HERO
        </span>
      </div>

      {/* 座位 */}
      {seats.map((seat) => {
        const isHero = heroPosition === seat.id;
        const pos = getSeatPos(seat.id, playerCount);

        return (
          <button
            key={seat.id}
            onClick={() => onSelectHero && onSelectHero(seat.id)}
            style={{ left: pos.left, top: pos.top, transform: 'translate(-50%, -50%)' }}
            className="absolute flex flex-col items-center gap-0.5 transition-all duration-150 focus:outline-none"
          >
            {/* 座位圆 */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all duration-150
                ${isHero
                  ? 'bg-slate-800 text-white border-slate-800 scale-110 shadow-md'
                  : seat.isBtn
                    ? 'bg-amber-400 text-amber-900 border-amber-300 shadow-md'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400 shadow-sm'
                }`}
            >
              {isHero ? 'ME' : seat.label}
            </div>

            {/* 标签 */}
            <span
              className={`text-[9px] font-semibold tracking-wide leading-none
                ${isHero ? 'text-slate-800' : seat.isBtn ? 'text-amber-500' : 'text-transparent'}`}
            >
              {isHero ? 'HERO' : seat.isBtn ? 'BTN' : '·'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
