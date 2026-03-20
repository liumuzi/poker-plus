import React from 'react';
import { getCardDisplayData } from '../engine/cardUtils';

/**
 * 渲染单张扑克牌
 * @param {{ card: {rank, suit} | null }} props
 */
export default function CardDisplay({ card }) {
  if (!card) {
    return <span className="text-slate-300">?</span>;
  }
  const data = getCardDisplayData(card);
  if (!data) return null;

  return (
    <span
      className={`font-bold ${data.colorClass} bg-white shadow-sm border border-slate-200 px-[5px] py-0.5 rounded mx-0.5 inline-block text-center min-w-[1.8rem]`}
    >
      {data.symbol}{data.rank}
    </span>
  );
}
