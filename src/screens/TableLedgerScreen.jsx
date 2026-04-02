import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calcPlayer, calcSummary, calcTransfers } from '../utils/settlement';

// ─── 玩家行（单行紧凑版）────────────────────────────────────────────────────
function PlayerRow({ player, calc, index, currencySymbol, onChange }) {
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef(null);

  const hasData = player.handsBought !== '' && player.cashoutChips !== '';

  const profitColor = calc.profit > 0.005
    ? 'text-emerald-400'
    : calc.profit < -0.005
    ? 'text-rose-400'
    : 'text-gray-300';

  const profitStr = calc.profit > 0.005
    ? `+${Math.round(calc.profit)}`
    : calc.profit < -0.005
    ? `${Math.round(calc.profit)}`
    : '+0';

  useEffect(() => {
    if (editingName && nameInputRef.current) nameInputRef.current.select();
  }, [editingName]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
      className="mx-3 mb-1.5 bg-gray-800 rounded-xl px-3 py-2.5"
    >
      <div className="flex items-center gap-2">
        {/* 姓名 */}
        {editingName ? (
          <input
            ref={nameInputRef}
            value={player.name}
            onChange={(e) => onChange('name', e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
            className="w-16 bg-gray-700 rounded-lg px-2 py-1 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span
            className="w-14 text-white font-bold text-xs cursor-pointer truncate shrink-0"
            onClick={() => setEditingName(true)}
          >
            {player.name}
          </span>
        )}

        {/* 购买手数 */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <button
            onClick={() => onChange('handsBought', String(Math.max(0, (Number(player.handsBought) || 0) - 1)))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-700 text-gray-300 font-black text-base active:bg-gray-600 active:scale-90 transition-all shrink-0"
          >−</button>
          <input
            type="number"
            inputMode="numeric"
            value={player.handsBought}
            placeholder="0"
            onChange={(e) => onChange('handsBought', e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-0 flex-1 bg-gray-700 rounded-lg px-1 py-1.5 text-white font-bold text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600 [appearance:none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            onClick={() => onChange('handsBought', String((Number(player.handsBought) || 0) + 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-700 text-gray-300 font-black text-base active:bg-gray-600 active:scale-90 transition-all shrink-0"
          >+</button>
          <span className="text-[10px] text-gray-500 shrink-0">手</span>
        </div>

        <span className="text-gray-600 text-xs shrink-0">→</span>

        {/* Cashout筹码 */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            type="number"
            inputMode="numeric"
            value={player.cashoutChips}
            placeholder="筹码"
            onChange={(e) => onChange('cashoutChips', e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-0 flex-1 bg-gray-700 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
          />
          <span className="text-[10px] text-gray-500 shrink-0">码</span>
        </div>

        {/* 盈亏 */}
        <span className={`text-sm font-black shrink-0 w-14 text-right ${profitColor}`}>
          {hasData ? `${currencySymbol}${profitStr}` : '—'}
        </span>
      </div>
    </motion.div>
  );
}

// ─── 结算汇总区 ──────────────────────────────────────────────────────────────
function SettlementCard({ summary, transfers, allFilled, currencySymbol }) {
  const { isBalanced, chipsGap, totalBuyInMoney, totalCashoutMoney } = summary;

  return (
    <div className="mx-3 mt-2 mb-6 bg-gray-800 rounded-2xl p-4">
      <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">结算汇总</p>

      {/* 三列数据 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">总买入</p>
          <p className="text-base font-black text-white">{currencySymbol}{totalBuyInMoney}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">总 Cashout</p>
          <p className="text-base font-black text-white">{currencySymbol}{totalCashoutMoney.toFixed(0)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">筹码差额</p>
          <p className={`text-base font-black ${isBalanced ? 'text-emerald-400' : 'text-orange-400'}`}>
            {chipsGap === 0 ? '0' : `${chipsGap > 0 ? '+' : ''}${chipsGap}`}
          </p>
        </div>
      </div>

      {/* 零和验证 */}
      <div className={`flex items-center gap-2 py-2 px-3 rounded-xl mb-4 ${
        isBalanced ? 'bg-emerald-900/30' : 'bg-orange-900/30'
      }`}>
        {isBalanced
          ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          : <AlertTriangle size={14} className="text-orange-400 shrink-0" />
        }
        <span className={`text-xs font-bold ${isBalanced ? 'text-emerald-400' : 'text-orange-400'}`}>
          {isBalanced
            ? '筹码平衡，结算正确'
            : `筹码差额 ${chipsGap > 0 ? '+' : ''}${chipsGap} 码，请检查数据`}
        </span>
      </div>

      {/* 转账清单 */}
      <p className="text-xs text-gray-400 font-bold mb-2.5">转账清单</p>
      {!allFilled ? (
        <p className="text-xs text-gray-600 text-center py-3">填写所有玩家数据后生成转账清单</p>
      ) : transfers.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-3">
          {isBalanced ? '✅ 无需转账（所有人持平）' : '数据平衡后生成转账清单'}
        </p>
      ) : (
        <div className={`flex flex-col gap-1.5 ${!isBalanced ? 'opacity-40' : ''}`}>
          {transfers.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 bg-gray-700/60 rounded-xl"
            >
              <span className="text-sm">
                <span className="text-white font-bold">{t.from}</span>
                <span className="mx-2 text-gray-500">→</span>
                <span className="text-white font-bold">{t.to}</span>
              </span>
              <span className="text-emerald-400 font-black text-sm">{currencySymbol}{t.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 重置确认弹窗 ────────────────────────────────────────────────────────────
function ResetConfirm({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md mx-auto bg-gray-900 rounded-t-3xl p-6"
      >
        <p className="text-white font-black text-base mb-1.5 text-center">清空重置</p>
        <p className="text-gray-400 text-sm text-center mb-6">将清空所有玩家的手数和 Cashout 数据，局面设置保留</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-gray-800 text-gray-300 font-bold text-sm active:scale-95 transition-transform"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold text-sm active:scale-95 transition-transform"
          >
            确认清空
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── 主屏幕 ──────────────────────────────────────────────────────────────────
export default function TableLedgerScreen({ onBack }) {
  const [settings, setSettings] = useState({
    playerCount: 6,
    chipsPerHand: 100,
    moneyPerHand: 100,
    currency: 'rmb', // 'rmb' | 'usd'
  });

  const [players, setPlayers] = useState(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      name: `玩家${i + 1}`,
      handsBought: '',
      cashoutChips: '',
    }))
  );

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 人数变化时同步 players 数组
  useEffect(() => {
    setPlayers((prev) =>
      Array.from({ length: settings.playerCount }, (_, i) =>
        prev[i] || { id: i, name: `玩家${i + 1}`, handsBought: '', cashoutChips: '' }
      )
    );
  }, [settings.playerCount]);

  // 更新单个玩家字段
  const updatePlayer = (index, field, value) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // 重置
  const handleReset = () => {
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, handsBought: '', cashoutChips: '' }))
    );
    setShowResetConfirm(false);
  };

  // 实时计算
  const calcedPlayers = useMemo(
    () =>
      players.map((p) =>
        calcPlayer(
          { ...p, handsBought: Number(p.handsBought) || 0, cashoutChips: Number(p.cashoutChips) || 0 },
          settings.chipsPerHand,
          settings.moneyPerHand
        )
      ),
    [players, settings]
  );

  const summary = useMemo(() => calcSummary(calcedPlayers), [calcedPlayers]);

  const allFilled = players.every(
    (p) => p.handsBought !== '' && Number(p.handsBought) > 0 && p.cashoutChips !== ''
  );

  const transfers = useMemo(() => {
    if (!allFilled) return [];
    return calcTransfers(calcedPlayers);
  }, [calcedPlayers, allFilled]);

  const currencySymbol = settings.currency === 'usd' ? '$' : '¥';

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white pb-24 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} color="white" />
        </button>
        <h1 className="text-xl font-black">牌桌记账</h1>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform"
        >
          <RotateCcw size={16} color="#9CA3AF" />
        </button>
      </div>

      {/* ── 局面设置卡片 ── */}
      <div className="mx-3 mb-3 bg-gray-800 rounded-2xl p-4">
        {/* 人数 */}
        <p className="text-xs text-gray-400 font-bold mb-2.5 uppercase tracking-wider">桌上人数</p>
        <div className="flex gap-1.5 mb-4">
          {[4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => setSettings((s) => ({ ...s, playerCount: n }))}
              className={`w-9 h-9 rounded-xl text-sm font-black transition-colors active:scale-95 ${
                settings.playerCount === n
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* 筹码/金额/货币 */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 mb-1.5 block font-medium">每手筹码数</label>
            <input
              type="number"
              inputMode="numeric"
              value={settings.chipsPerHand}
              onChange={(e) => setSettings((s) => ({ ...s, chipsPerHand: Number(e.target.value) || 0 }))}
              onFocus={(e) => e.target.select()}
              className="w-full bg-gray-700 rounded-xl px-3 py-2.5 text-white font-black text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100"
            />
          </div>
          <span className="text-gray-500 font-bold pb-2.5">=</span>
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 mb-1.5 block font-medium">每手金额</label>
            <input
              type="number"
              inputMode="numeric"
              value={settings.moneyPerHand}
              onChange={(e) => setSettings((s) => ({ ...s, moneyPerHand: Number(e.target.value) || 0 }))}
              onFocus={(e) => e.target.select()}
              className="w-full bg-gray-700 rounded-xl px-3 py-2.5 text-white font-black text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100"
            />
          </div>
          {/* 货币切换 */}
          <div className="flex flex-col gap-1 pb-0.5">
            {['rmb', 'usd'].map((c) => (
              <button
                key={c}
                onClick={() => setSettings((s) => ({ ...s, currency: c }))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors active:scale-95 ${
                  settings.currency === c
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {c === 'rmb' ? '¥' : '$'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 玩家列表 ── */}
      <AnimatePresence initial={false}>
        {players.map((player, i) => (
          <PlayerRow
            key={player.id}
            player={player}
            calc={calcedPlayers[i]}
            index={i}
            currencySymbol={currencySymbol}
            onChange={(field, val) => updatePlayer(i, field, val)}
          />
        ))}
      </AnimatePresence>

      {/* ── 结算汇总 ── */}
      <SettlementCard
        summary={summary}
        transfers={transfers}
        allFilled={allFilled}
        currencySymbol={currencySymbol}
      />

      {/* ── 重置确认 ── */}
      <AnimatePresence>
        {showResetConfirm && (
          <ResetConfirm
            onConfirm={handleReset}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
