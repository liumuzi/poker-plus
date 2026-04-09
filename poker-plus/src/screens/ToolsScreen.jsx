import React from 'react';
import { PiggyBank, Percent, BarChart2, ChevronRight } from 'lucide-react';

const TOOLS = [
  { id: 'ledger',      title: 'Bankroll 管理', Icon: PiggyBank, available: true  },
  { id: 'tableLedger', title: '牌桌记账',      Icon: BarChart2, available: true  },
  { id: 'equity',      title: 'Equity 计算',   Icon: Percent,   available: true  },
];

export default function ToolsScreen({ onNavigate }) {
  const handlePress = (tool) => {
    if (tool.available) onNavigate?.(tool.id);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white pb-20 pt-14 select-none">
      <h2 className="text-xl font-black px-5 mb-5">基础工具</h2>

      <div className="mx-4 bg-gray-800 rounded-2xl overflow-hidden">
        {TOOLS.map((tool, i) => {
          const { id, title, subtitle, Icon, available } = tool;
          return (
            <button
              key={id}
              onClick={() => handlePress(tool)}
              className={`flex items-center gap-4 w-full px-4 py-4 text-left active:bg-gray-700 transition-colors ${
                available ? '' : 'opacity-60'
              }`}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0">
                <Icon size={20} color="white" strokeWidth={1.8} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm leading-snug">{title}</div>
              </div>

              {/* Right */}
              {available ? (
                <ChevronRight size={18} color="#6B7280" />
              ) : (
                <span className="text-[10px] text-gray-500 whitespace-nowrap">即将上线</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
