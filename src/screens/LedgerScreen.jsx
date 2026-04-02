import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Plus, CalendarDays, Check, MapPin, X } from 'lucide-react';
import { useLedger } from '../hooks/useLedger';
import ProfitChart from '../components/ledger/ProfitChart';
import SessionCard from '../components/ledger/SessionCard';
import AddSessionSheet from '../components/ledger/AddSessionSheet';

function SummaryCard({ summary }) {
  const profitColor = summary.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400';
  const fmt = (n) => (n >= 0 ? '+' : '') + Math.round(n);
  return (
    <div className="mx-4 mb-4 bg-gray-800 rounded-2xl p-4">
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">累计盈亏</p>
        <span className={`text-4xl font-black ${profitColor}`}>{fmt(summary.totalProfit)}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: '总场次',   value: `${summary.totalSessions}场` },
          { label: '场均盈亏', value: fmt(summary.avgProfit) },
          { label: '最佳一局', value: `+${summary.bestSession?.profit ?? 0}` },
          { label: '最差一局', value: `${summary.worstSession?.profit ?? 0}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
            <p className="text-white font-bold text-sm">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center mt-12">
      <span className="text-6xl mb-4">📊</span>
      <p className="text-white font-black text-lg mb-2">还没有任何记录</p>
      <p className="text-gray-500 text-sm">点击右上角 ＋ 开始记账</p>
    </div>
  );
}

function YearFilterDropdown({ years, selected, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const options = [{ label: '全量', value: null }, ...years.map((y) => ({ label: `${y}年`, value: y }))];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -6 }}
      transition={{ duration: 0.15 }}
      className="absolute top-8 right-0 z-50 bg-gray-700 rounded-xl shadow-2xl border border-gray-600 overflow-hidden min-w-[96px]"
    >
      {options.map(({ label, value }) => (
        <button
          key={String(value)}
          onClick={() => { onSelect(value); onClose(); }}
          className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-white hover:bg-gray-600 active:bg-gray-500 transition-colors"
        >
          <span>{label}</span>
          {selected === value && <Check size={14} className="text-blue-400 ml-2" />}
        </button>
      ))}
    </motion.div>
  );
}

function LocationFilterDropdown({ locations, selected, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const options = [{ label: '全部地址', value: null }, ...locations.map((l) => ({ label: l, value: l }))];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -6 }}
      transition={{ duration: 0.15 }}
      className="absolute top-8 right-0 z-50 bg-gray-700 rounded-xl shadow-2xl border border-gray-600 overflow-hidden min-w-[120px]"
    >
      {options.map(({ label, value }) => (
        <button
          key={String(value)}
          onClick={() => { onSelect(value); onClose(); }}
          className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-white hover:bg-gray-600 active:bg-gray-500 transition-colors"
        >
          <span className="truncate max-w-[140px]">{label}</span>
          {selected === value && <Check size={14} className="text-blue-400 ml-2 flex-shrink-0" />}
        </button>
      ))}
    </motion.div>
  );
}

function LocationStatsSheet({ locationStats, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md mx-auto bg-gray-900 rounded-t-3xl overflow-hidden"
        style={{ maxHeight: '70vh' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-800">
          <h2 className="font-black text-white text-base">按地址统计</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800">
            <X size={16} color="white" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-3" style={{ maxHeight: 'calc(70vh - 72px)' }}>
          {locationStats.map(({ location, profit, sessions }) => {
            const isPos = profit >= 0;
            return (
              <div key={location} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white text-sm font-medium truncate">{location}</span>
                  <span className="text-gray-500 text-xs flex-shrink-0">{sessions}场</span>
                </div>
                <span className={`text-sm font-black flex-shrink-0 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? '+' : ''}{profit}
                </span>
              </div>
            );
          })}
          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LedgerScreen({ onBack }) {
  const { records, addRecord, updateRecord, deleteRecord, savedLocations, locationStats } = useLedger();
  const [sheetState, setSheetState] = useState(null);
  const [filterYear, setFilterYear] = useState(null); // null = all
  const [filterLocation, setFilterLocation] = useState(null); // null = all
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showLocationStats, setShowLocationStats] = useState(false);

  // Available years derived from all records
  const availableYears = useMemo(() => {
    const set = new Set(records.map((r) => r.date?.slice(0, 4)).filter(Boolean));
    return Array.from(set).sort((a, b) => b - a).map(Number);
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterYear !== null && !r.date?.startsWith(String(filterYear))) return false;
      if (filterLocation !== null && r.location !== filterLocation) return false;
      return true;
    });
  }, [records, filterYear, filterLocation]);

  // Summary of filtered records
  const filteredSummary = useMemo(() => {
    if (!filteredRecords.length) return null;
    const totalProfit = filteredRecords.reduce((s, r) => s + r.profit, 0);
    const totalSessions = filteredRecords.length;
    const avgProfit = totalProfit / totalSessions;
    const bestSession = filteredRecords.reduce((b, r) => r.profit > b.profit ? r : b, filteredRecords[0]);
    const worstSession = filteredRecords.reduce((w, r) => r.profit < w.profit ? r : w, filteredRecords[0]);
    return { totalProfit, totalSessions, avgProfit, bestSession, worstSession };
  }, [filteredRecords]);

  const openAdd = () => setSheetState({ mode: 'add' });
  const openEdit = (record) => setSheetState({ mode: 'edit', record });
  const closeSheet = () => setSheetState(null);

  const handleSave = (payload, recordId) => {
    if (recordId) updateRecord(recordId, payload);
    else addRecord(payload);
  };

  const filterYearLabel = filterYear === null ? '全量' : `${filterYear}年`;
  const filterLocationLabel = filterLocation === null ? '全部' : filterLocation;

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white pb-24 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 active:scale-95 transition-transform">
          <ArrowLeft size={18} color="white" />
        </button>
        <h1 className="text-xl font-black">Bankroll 管理</h1>
        <button onClick={openAdd} className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 active:scale-95 transition-transform shadow-lg shadow-blue-600/40">
          <Plus size={20} color="white" strokeWidth={2.5} />
        </button>
      </div>

      {records.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {filteredSummary && <SummaryCard summary={filteredSummary} />}

          {/* Chart card */}
          <div className="mx-4 mb-4 bg-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">盈亏趋势</p>
                {locationStats.length > 0 && (
                  <button
                    onClick={() => setShowLocationStats(true)}
                    className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <MapPin size={10} />
                    <span>按地址</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Location filter */}
                {savedLocations.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => { setShowLocationPicker((v) => !v); setShowYearPicker(false); }}
                      className={`flex items-center gap-1.5 text-xs transition-colors active:scale-95 ${filterLocation !== null ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                      <MapPin size={14} />
                      <span>{filterLocationLabel}</span>
                    </button>
                    <AnimatePresence>
                      {showLocationPicker && (
                        <LocationFilterDropdown
                          locations={savedLocations}
                          selected={filterLocation}
                          onSelect={setFilterLocation}
                          onClose={() => setShowLocationPicker(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                )}
                {/* Year filter */}
                <div className="relative">
                  <button
                    onClick={() => { setShowYearPicker((v) => !v); setShowLocationPicker(false); }}
                    className={`flex items-center gap-1.5 text-xs transition-colors active:scale-95 ${filterYear !== null ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                  >
                    <CalendarDays size={14} />
                    <span>{filterYearLabel}</span>
                  </button>
                  <AnimatePresence>
                    {showYearPicker && (
                      <YearFilterDropdown
                        years={availableYears}
                        selected={filterYear}
                        onSelect={setFilterYear}
                        onClose={() => setShowYearPicker(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <ProfitChart records={[...filteredRecords].reverse()} />
          </div>

          {/* List */}
          <div className="px-4 flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              历史记录（{filteredRecords.length}）
            </p>
            {filteredRecords.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">{filterYear}年暂无记录</p>
            ) : (
              filteredRecords.map((record) => (
                <SessionCard key={record.id} record={record} onDelete={deleteRecord} onEdit={openEdit} />
              ))
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {sheetState && (
          <AddSessionSheet
            onClose={closeSheet}
            onSave={handleSave}
            initialData={sheetState.mode === 'edit' ? sheetState.record : null}
            recordId={sheetState.mode === 'edit' ? sheetState.record.id : null}
            savedLocations={savedLocations}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLocationStats && (
          <LocationStatsSheet
            locationStats={locationStats}
            onClose={() => setShowLocationStats(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
