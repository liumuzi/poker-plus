import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_MODE, supabase } from '../lib/supabase';

const STORAGE_KEY = 'poker_ledger_records';

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocal(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function useLedger() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载记录
  useEffect(() => {
    if (MOCK_MODE || !user) {
      setRecords(loadLocal());
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('ledger_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setRecords(data.map(row => ({ ...row.record_data, id: row.id, createdAt: row.created_at })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const addRecord = async (record) => {
    const newRecord = {
      ...record,
      profit: record.cashOut - record.buyIn,
      createdAt: new Date().toISOString(),
    };

    if (MOCK_MODE || !user) {
      const withId = { ...newRecord, id: Date.now().toString() };
      const updated = [withId, ...records];
      saveLocal(updated);
      setRecords(updated);
      return;
    }

    const { data, error } = await supabase
      .from('ledger_records')
      .insert({ user_id: user.id, record_data: newRecord })
      .select()
      .single();

    if (!error && data) {
      setRecords(prev => [{ ...newRecord, id: data.id, createdAt: data.created_at }, ...prev]);
    }
  };

  const deleteRecord = async (id) => {
    if (MOCK_MODE || !user) {
      const updated = records.filter(r => r.id !== id);
      saveLocal(updated);
      setRecords(updated);
      return;
    }

    await supabase.from('ledger_records').delete().eq('id', id).eq('user_id', user.id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const updateRecord = async (id, data) => {
    const updated = { ...data, profit: data.cashOut - data.buyIn };

    if (MOCK_MODE || !user) {
      const updatedList = records.map(r => r.id === id ? { ...r, ...updated } : r);
      saveLocal(updatedList);
      setRecords(updatedList);
      return;
    }

    const current = records.find(r => r.id === id);
    if (!current) return;
    const newData = { ...current, ...updated };
    const { id: _id, createdAt: _c, ...recordData } = newData;

    await supabase
      .from('ledger_records')
      .update({ record_data: recordData })
      .eq('id', id)
      .eq('user_id', user.id);

    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
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

  return { records, addRecord, updateRecord, deleteRecord, summary, savedLocations, locationStats, loading };
}
