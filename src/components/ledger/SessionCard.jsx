import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

function formatBlind(r) {
  let s = `$${r.sb}/$${r.bb}`;
  if (r.anteType && r.anteAmount) s += ` Ante$${r.anteAmount}`;
  if (r.straddleType && r.straddleAmount) s += ` Straddle$${r.straddleAmount}`;
  return s;
}

export default function SessionCard({ record, onDelete, onEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dragX = useMotionValue(0);
  const deleteOpacity = useTransform(dragX, [-80, -40], [1, 0]);
  const cardX = useTransform(dragX, (v) => Math.min(0, v));

  const isPositive = record.profit >= 0;
  const profitColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
  const borderColor = isPositive ? 'bg-emerald-500' : record.profit === 0 ? 'bg-slate-500' : 'bg-rose-500';

  const handleDragEnd = (_, { offset }) => {
    if (offset.x < -60) {
      animate(dragX, -80, { type: 'spring', stiffness: 300, damping: 30 });
    } else {
      animate(dragX, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(record.id);
  };

  const handleCardTap = () => {
    if (dragX.get() < -30) {
      animate(dragX, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setConfirmDelete(false);
    } else {
      onEdit?.(record);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete button underneath */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute right-0 top-0 bottom-0 flex items-center pr-3"
      >
        <button
          onClick={handleDelete}
          className={`px-4 py-2 rounded-lg text-white text-sm font-bold transition-colors ${
            confirmDelete ? 'bg-red-700' : 'bg-red-500'
          }`}
        >
          {confirmDelete ? '确认' : '删除'}
        </button>
      </motion.div>

      {/* Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onTap={handleCardTap}
        style={{ x: cardX }}
        className="relative bg-gray-800 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="flex">
          {/* Left color bar */}
          <div className={`w-1 flex-shrink-0 ${borderColor}`} />

          <div className="flex-1 px-3 py-3">
            {/* Row 1: date + blind tag */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">{record.date}</span>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                {formatBlind(record)}
              </span>
            </div>

            {/* Row 2: profit + duration/players/location */}
            <div className="flex items-center justify-between">
              <span className={`text-xl font-black ${profitColor}`}>
                {isPositive ? '+' : ''}{record.profit}
              </span>
              <span className="text-xs text-gray-500 flex gap-2 items-center">
                {record.location ? <span>{record.location}</span> : null}
                {record.duration ? <span>{record.duration}h</span> : null}
                {record.playerCount ? <span>{record.playerCount}人</span> : null}
              </span>
            </div>

            {/* Row 3: notes */}
            {record.notes ? (
              <div className="mt-1.5 text-xs text-gray-500 italic line-clamp-2">{record.notes}</div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
