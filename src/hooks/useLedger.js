import { useState, useMemo } from 'react';

const STORAGE_KEY = 'poker_ledger_records';

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function useLedger() {
  const [records, setRecords] = useState(loadRecords);

  const addRecord = (record) => {
    const newRecord = {
      ...record,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      profit: record.cashOut - record.buyIn,
    };
    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecords(updated);
  };

  const deleteRecord = (id) => {
    const updated = records.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecords(updated);
  };

  const updateRecord = (id, data) => {
    const updated = records.map((r) =>
      r.id === id
        ? { ...r, ...data, profit: data.cashOut - data.buyIn }
        : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecords(updated);
  };

  const summary = useMemo(() => {
    if (!records.length) return null;
    const totalProfit = records.reduce((s, r) => s + r.profit, 0);
    const totalSessions = records.length;
    const avgProfit = totalProfit / totalSessions;
    const bestSession = records.reduce((b, r) => r.profit > b.profit ? r : b, records[0]);
    const worstSession = records.reduce((w, r) => r.profit < w.profit ? r : w, records[0]);
    const totalHours = records.reduce((s, r) => s + (r.duration || 0), 0);
    const profitPerHour = totalHours > 0 ? totalProfit / totalHours : null;
    return { totalProfit, totalSessions, avgProfit, bestSession, worstSession, totalHours, profitPerHour };
  }, [records]);

  // Unique locations sorted by most recent use
  const savedLocations = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const r of records) {
      if (r.location && !seen.has(r.location)) {
        seen.add(r.location);
        result.push(r.location);
      }
    }
    return result;
  }, [records]);

  // Stats grouped by location
  const locationStats = useMemo(() => {
    const map = {};
    for (const r of records) {
      const key = r.location || null;
      if (!key) continue;
      if (!map[key]) map[key] = { location: key, profit: 0, sessions: 0 };
      map[key].profit += r.profit;
      map[key].sessions += 1;
    }
    return Object.values(map).sort((a, b) => b.profit - a.profit);
  }, [records]);

  return { records, addRecord, updateRecord, deleteRecord, summary, savedLocations, locationStats };
}
