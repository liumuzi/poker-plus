import React from 'react';

/**
 * 横向桌面示意图组件
 * 根据入池人数显示玩家位置，BTN位置固定在右边
 */
export default function HorizontalTableDiagram({ 
  playerCount, 
  heroPosition, 
  onSelectHero,
  players = []
}) {
  // 生成玩家位置数组，从BTN开始顺时针
  const generatePositions = (count) => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      if (i === 0) {
        positions.push({ id: i, label: 'BTN', displayName: 'BTN' });
      } else {
        positions.push({ id: i, label: `玩家${i}`, displayName: `玩家${i}` });
      }
    }
    return positions;
  };

  const positions = generatePositions(playerCount);

  // 计算位置坐标（横向椭圆桌）
  const getPositionStyle = (index, total) => {
    // 桌子是横向的椭圆形
    // BTN在最右边(3点钟位置)，然后顺时针排列
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // 从右边开始
    const radiusX = 42; // 水平方向半径 (%)
    const radiusY = 35; // 垂直方向半径 (%)
    
    const x = 50 + radiusX * Math.cos(angle);
    const y = 50 + radiusY * Math.sin(angle);
    
    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)'
    };
  };

  return (
    <div className="relative w-full h-48 bg-gradient-to-b from-emerald-800 to-emerald-900 rounded-[3rem] border-4 border-emerald-950 shadow-inner overflow-visible">
      {/* 桌子内部椭圆 */}
      <div className="absolute inset-4 rounded-[2.5rem] border-2 border-emerald-600/30" />
      
      {/* 中心标记 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-400/50 text-xs font-bold">
        BTN →
      </div>

      {/* 玩家位置 */}
      {positions.map((pos, index) => {
        const isHero = heroPosition === index;
        const isBtn = index === 0;
        const playerData = players[index];
        
        return (
          <div
            key={pos.id}
            className="absolute flex flex-col items-center cursor-pointer group"
            style={getPositionStyle(index, playerCount)}
            onClick={() => onSelectHero && onSelectHero(index)}
          >
            {/* 位置圆圈 */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 shadow-md
                ${isHero 
                  ? 'bg-amber-400 text-amber-900 border-amber-500 scale-110 ring-2 ring-amber-300' 
                  : isBtn
                    ? 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                    : 'bg-slate-700 text-slate-200 border-slate-500 hover:border-blue-400'
                }`}
            >
              {isHero ? '👑' : pos.displayName.substring(0, 3)}
            </div>
            
            {/* 位置标签 */}
            <div className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isHero 
                ? 'bg-amber-500 text-white' 
                : isBtn 
                  ? 'bg-white/90 text-slate-700'
                  : 'bg-slate-800/80 text-slate-300'
            }`}>
              {isHero ? 'HERO' : pos.displayName}
            </div>

            {/* 点击提示 */}
            {!isHero && (
              <div className="absolute -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-emerald-300 whitespace-nowrap">
                点击设为Hero
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
