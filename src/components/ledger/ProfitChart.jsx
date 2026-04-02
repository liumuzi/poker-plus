import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

function formatBlind(r) {
  let s = `$${r.sb}/$${r.bb}`;
  if (r.anteType && r.anteAmount) s += ` Ante$${r.anteAmount}`;
  if (r.straddleType && r.straddleAmount) s += ` Straddle$${r.straddleAmount}`;
  return s;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const profit = d.profit;
  const color = profit >= 0 ? '#4ADE80' : '#F87171';
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs shadow-lg">
      <div className="text-gray-400 mb-1">{d.date} · {d.blind}</div>
      <div style={{ color }} className="font-black text-sm">
        {profit >= 0 ? '+' : ''}{profit}
      </div>
    </div>
  );
}

export default function ProfitChart({ records }) {
  if (records.length < 2) {
    return (
      <div className="flex items-center justify-center h-[120px] text-gray-500 text-xs text-center px-4">
        暂无足够数据生成图表，请至少添加 2 条记录
      </div>
    );
  }

  const chartData = records.map((r, i) => ({
    session: `#${i + 1}`,
    profit: r.profit,
    date: r.date,
    blind: formatBlind(r),
  }));

  const lastProfit = chartData[chartData.length - 1]?.profit ?? 0;
  const isPositive = lastProfit >= 0;
  const strokeColor = isPositive ? '#4ADE80' : '#F87171';
  const gradientId = isPositive ? 'profitGreen' : 'profitRed';
  const gradientColor = isPositive ? '#4ADE80' : '#F87171';

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="profitGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="session"
          tick={{ fill: '#6B7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6B7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="4 4" />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="profit"
          stroke={strokeColor}
          fill={`url(#${gradientId})`}
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props;
            const c = payload.profit >= 0 ? '#4ADE80' : '#F87171';
            return <circle key={props.key} cx={cx} cy={cy} r={3} fill={c} stroke={c} />;
          }}
          activeDot={{ r: 5, fill: strokeColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
