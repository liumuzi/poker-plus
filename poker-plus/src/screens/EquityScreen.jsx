import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Zap, Loader2, X } from 'lucide-react';
import { calculateEquity, cardToKey } from '../utils/equity';
import PokerCardMini from '../components/PokerCardMini';

// ─── 常量 ────────────────────────────────────────────────────────────────────
const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
const SUITS = [
  { id: 's', symbol: '♠', label: '黑桃', textClass: 'text-white' },
  { id: 'h', symbol: '♥', label: '红心', textClass: 'text-red-400' },
  { id: 'd', symbol: '♦', label: '方块', textClass: 'text-red-400' },
  { id: 'c', symbol: '♣', label: '梅花', textClass: 'text-white' },
];
const SUIT_MAP = Object.fromEntries(SUITS.map((s) => [s.id, s]));
const PLAYER_COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EF4444',
  '#8B5CF6','#EC4899','#14B8A6','#F97316',
];

// ─── 牌面渲染：直接复用 PokerCardMini ────────────────────────────────────────
// size: 'board' = 52px (community cards), 'hole' = 72px (player hole cards)
let _pkrId = 0;
function CardFace({ card, size = 'hole', onClick }) {
  const idRef = React.useRef(`eq-${_pkrId++}`);
  const width = size === 'board' ? 52 : 58;
  return (
    <PokerCardMini
      card={card}
      width={width}
      patternId={idRef.current}
      onClick={onClick}
    />
  );
}

// ─── 独立选牌弹窗 ──────────────────────────────────────────────────────────────
function CardPickerSheet({ usedKeys, title, maxCards = 1, onSelect, onClose }) {
  const [selectedSuit, setSelectedSuit] = useState(null);

  const activeSuit = selectedSuit ? SUIT_MAP[selectedSuit] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl px-5 pt-5 pb-8"
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg text-slate-800">{title}</h3>
          <div className="flex items-center gap-2">
            {activeSuit && (
              <span className={`text-2xl font-black ${activeSuit.textClass.replace('text-', 'text-')}`}
                style={{ color: activeSuit.id === 'h' || activeSuit.id === 'd' ? '#ef4444' : '#1e293b' }}>
                {activeSuit.symbol}
              </span>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100">
              <X size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* 花色选择 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {SUITS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSuit(s.id)}
              className={`py-4 rounded-2xl flex items-center justify-center border-2 transition-all
                ${selectedSuit === s.id
                  ? 'border-blue-400 bg-blue-50 scale-105 shadow-md'
                  : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                }`}
            >
              <span className="text-3xl leading-none"
                style={{ color: s.id === 'h' || s.id === 'd' ? '#ef4444' : '#1e293b' }}>
                {s.symbol}
              </span>
            </button>
          ))}
        </div>

        {/* 分隔 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[11px] text-slate-300 font-medium">
            {selectedSuit ? '选择点数' : '先选花色'}
          </span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* 点数选择 */}
        <div className="grid grid-cols-7 gap-1.5">
          {RANKS.map((r) => {
            const key = selectedSuit ? r + selectedSuit : null;
            const disabled = !selectedSuit || usedKeys.has(key);
            const suitColor = activeSuit?.id === 'h' || activeSuit?.id === 'd' ? '#ef4444' : '#1e293b';
            return (
              <button
                key={r}
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  onSelect({ rank: r, suit: selectedSuit });
                  setSelectedSuit(null);
                }}
                className={`aspect-square rounded-xl font-black text-sm border transition-all
                  ${disabled
                    ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed'
                    : 'bg-white border-slate-200 shadow-sm active:scale-95 hover:border-blue-300'
                  }`}
                style={!disabled && selectedSuit ? { color: suitColor } : {}}
              >
                {r}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── 玩家卡片 ─────────────────────────────────────────────────────────────────
function PlayerCard({ player, index, color, result, isTopResult, onCardClick, onNameChange, canRemove, onRemove }) {
  const [editingName, setEditingName] = useState(false);
  const nameRef = useRef(null);

  return (
    <div className="bg-gray-800 rounded-2xl p-3.5">
      {/* 头部行：名称 + Win% / 删除 */}
      <div className="flex items-center gap-2.5 mb-3">
        {editingName ? (
          <input
            ref={nameRef}
            autoFocus
            value={player.name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
            className="flex-1 bg-gray-700 rounded-lg px-2.5 py-1 text-white text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span
            className="flex-1 text-white font-bold text-sm cursor-pointer"
            onClick={() => setEditingName(true)}
          >
            {player.name}
          </span>
        )}

        {result ? (
          <span className={`text-2xl font-black ${isTopResult ? 'text-emerald-400' : 'text-white'}`}>
            {result.winPct}%
          </span>
        ) : canRemove ? (
          <button
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 text-gray-500 hover:bg-gray-600 hover:text-rose-400 transition-colors active:scale-90"
          >
            <X size={12} />
          </button>
        ) : null}
      </div>

      {/* 手牌槽 */}
      <div className="flex gap-2 justify-center mb-1">
        {[0, 1].map((slotIdx) => (
          <CardFace
            key={slotIdx}
            card={player.cards[slotIdx]}
            size="hole"
            onClick={() => onCardClick(slotIdx)}
          />
        ))}
      </div>

      {/* 结果行 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex justify-between text-xs text-gray-400 px-1 mt-2.5 mb-2">
              <span>平局 <span className="text-gray-200">{result.tiePct}%</span></span>
              <span>Equity <span className="text-blue-400 font-bold">{result.equity}%</span></span>
              <span>Pot Odds <span className="text-gray-200">≥{result.potOdds}%</span></span>
            </div>
            {/* 胜率进度条 */}
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.winPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 公共牌区 ─────────────────────────────────────────────────────────────────
function BoardSection({ boardCards, onSlotClick, onRemove }) {
  const slots = Array.from({ length: 5 }, (_, i) => boardCards[i] || null);

  return (
    <div className="mx-3 mb-4 bg-gray-800 rounded-2xl p-3.5">
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">公共牌 Board</p>
      <div className="flex gap-2 justify-center">
        {slots.map((card, i) => (
          <div key={i} className="relative">
            {card ? (
              <>
                <CardFace card={card} size="board" onClick={() => onSlotClick(i)} />
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center"
                >
                  <X size={9} color="white" />
                </button>
              </>
            ) : (
              <CardFace onClick={() => onSlotClick(i)} size="board" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 综合胜率分布条 ────────────────────────────────────────────────────────────
function EquityBar({ results, colors }) {
  if (!results || results.length < 2) return null;
  return (
    <div className="mx-3 mb-4 bg-gray-800 rounded-2xl p-3.5">
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">胜率分布</p>
      <div className="flex rounded-xl overflow-hidden h-5">
        {results.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ flex: 0 }}
            animate={{ flex: r.winPct }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex items-center justify-center"
            style={{ backgroundColor: colors[i] }}
          >
            {r.winPct >= 12 && (
              <span className="text-white text-[10px] font-black">{r.winPct}%</span>
            )}
          </motion.div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {results.map((r, i) => (
          <div key={r.id} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
            <span className="text-[11px] text-gray-400">{r.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 主屏幕 ───────────────────────────────────────────────────────────────────
export default function EquityScreen({ onBack }) {
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState(() =>
    Array.from({ length: 9 }, (_, i) => ({
      id: i,
      name: `玩家${i + 1}`,
      cards: [null, null],
    }))
  );
  const [boardCards, setBoardCards] = useState([]);
  const [results, setResults] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const [pickTarget, setPickTarget] = useState(null);

  // 已用牌 set
  const usedKeys = useMemo(() => {
    const keys = new Set();
    players.slice(0, playerCount).forEach((p) =>
      p.cards.forEach((c) => { if (c) keys.add(cardToKey(c)); })
    );
    boardCards.forEach((c) => keys.add(cardToKey(c)));
    return keys;
  }, [players, playerCount, boardCards]);

  const updatePlayer = (id, updates) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    setResults(null);
  };

  const handleCardSelect = useCallback((card) => {
    if (!pickTarget) return;
    if (pickTarget.type === 'player') {
      const { playerId, slotIdx } = pickTarget;
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== playerId) return p;
          const next = [...p.cards];
          next[slotIdx] = card;
          return { ...p, cards: next };
        })
      );
      if (slotIdx === 0) {
        setPickTarget({ type: 'player', playerId, slotIdx: 1 });
      } else {
        setPickTarget(null);
      }
    } else {
      const { slotIdx } = pickTarget;
      setBoardCards((prev) => {
        const next = [...prev];
        if (slotIdx !== undefined && slotIdx < next.length) {
          next[slotIdx] = card;
        } else {
          next.push(card);
        }
        return next;
      });
      setPickTarget(null);
    }
    setResults(null);
  }, [pickTarget]);

  const handleBoardSlotClick = (i) => {
    if (i < boardCards.length) {
      setPickTarget({ type: 'board', slotIdx: i });
    } else if (i === boardCards.length && boardCards.length < 5) {
      setPickTarget({ type: 'board', slotIdx: undefined });
    }
  };

  const removeBoard = (i) => {
    setBoardCards((prev) => prev.filter((_, idx) => idx !== i));
    setResults(null);
  };

  const addPlayer = () => {
    if (playerCount < 9) { setPlayerCount((n) => n + 1); setResults(null); }
  };

  const removePlayer = (idx) => {
    if (playerCount <= 2) return;
    setPlayerCount((n) => n - 1);
    setResults(null);
  };

  const canCalculate = players.slice(0, playerCount).filter((p) => p.cards[0] && p.cards[1]).length >= 2;

  const handleCalculate = () => {
    if (!canCalculate || calculating) return;
    setCalculating(true);
    setTimeout(() => {
      const res = calculateEquity(players.slice(0, playerCount), boardCards);
      setResults(res);
      setCalculating(false);
    }, 50);
  };

  const handleReset = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, cards: [null, null] })));
    setBoardCards([]);
    setResults(null);
    setPlayerCount(2);
  };

  const maxWinPct = results ? Math.max(...results.map((r) => r.winPct)) : 0;

  const pickerTitle = pickTarget?.type === 'board'
    ? '选择公共牌'
    : pickTarget?.slotIdx === 0
    ? '选择第一张手牌'
    : '选择第二张手牌';

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white pb-36 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} color="white" />
        </button>
        <h1 className="text-xl font-black">Equity 计算</h1>
        <button
          onClick={handleReset}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform"
        >
          <RotateCcw size={16} color="#9CA3AF" />
        </button>
      </div>

      {/* 公共牌（置顶）*/}
      <BoardSection
        boardCards={boardCards}
        onSlotClick={handleBoardSlotClick}
        onRemove={removeBoard}
      />

      {/* 玩家卡片 */}
      <div className="mx-3 flex flex-col gap-2 mb-3">
        <AnimatePresence initial={false}>
          {players.slice(0, playerCount).map((player, i) => {
            const result = results?.find((r) => r.id === player.id);
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
              >
                <PlayerCard
                  player={player}
                  index={i}
                  color={PLAYER_COLORS[i]}
                  result={result}
                  isTopResult={result && result.winPct === maxWinPct}
                  onCardClick={(slotIdx) => setPickTarget({ type: 'player', playerId: player.id, slotIdx })}
                  onNameChange={(name) => updatePlayer(player.id, { name })}
                  canRemove={playerCount > 2}
                  onRemove={() => removePlayer(i)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* 添加玩家按钮 */}
        {playerCount < 9 && (
          <button
            onClick={addPlayer}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-700 text-gray-500 hover:border-blue-600 hover:text-blue-400 transition-colors active:scale-95"
          >
            <span className="text-xl font-black leading-none">+</span>
            <span className="text-sm font-bold">添加玩家</span>
          </button>
        )}
      </div>

      {/* 胜率分布条 */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <EquityBar results={results} colors={PLAYER_COLORS} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 固定底部计算按钮 */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30">
        <button
          onClick={handleCalculate}
          disabled={!canCalculate || calculating}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
            canCalculate && !calculating
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 active:scale-95'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {calculating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              计算中…
            </>
          ) : (
            <>
              <Zap size={18} />
              计算 Equity
            </>
          )}
        </button>
        <p className="text-[10px] text-gray-600 text-center mt-1.5">基于 10,000 次蒙特卡洛模拟</p>
      </div>

      {/* 选牌弹窗 */}
      <AnimatePresence>
        {pickTarget && (
          <CardPickerSheet
            key="picker"
            usedKeys={usedKeys}
            title={pickerTitle}
            onSelect={handleCardSelect}
            onClose={() => setPickTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
