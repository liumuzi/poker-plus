import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_MODE, supabase } from '../lib/supabase';

const STORAGE_KEY = 'pokerSavedGames';

function loadLocal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveLocal(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

/**
 * 手牌存档 CRUD hook
 * - 登录状态：读写 Supabase saved_games 表
 * - 未登录：fallback 到 localStorage
 */
export function useSavedGames() {
  const { user } = useAuth();
  const [savedGames, setSavedGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载存档
  useEffect(() => {
    if (MOCK_MODE || !user) {
      setSavedGames(loadLocal());
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('saved_games')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const games = data.map(row => ({ id: row.id, date: new Date(row.created_at).toLocaleString(), ...row.game_data }));
          setSavedGames(games);
        }
        setLoading(false);
      });
  }, [user]);

  const saveGame = async (gameData) => {
    const date = new Date().toLocaleString();

    if (MOCK_MODE || !user) {
      const newGame = { id: Date.now(), date, ...gameData };
      const updated = [newGame, ...savedGames];
      setSavedGames(updated);
      saveLocal(updated);
      return;
    }

    const { data, error } = await supabase
      .from('saved_games')
      .insert({ user_id: user.id, game_data: gameData })
      .select()
      .single();

    if (!error && data) {
      const newGame = { id: data.id, date: new Date(data.created_at).toLocaleString(), ...gameData };
      setSavedGames(prev => [newGame, ...prev]);
    }
  };

  const deleteGame = async (id) => {
    if (MOCK_MODE || !user) {
      const updated = savedGames.filter(g => g.id !== id);
      setSavedGames(updated);
      saveLocal(updated);
      return;
    }

    await supabase.from('saved_games').delete().eq('id', id).eq('user_id', user.id);
    setSavedGames(prev => prev.filter(g => g.id !== id));
  };

  const updateGame = async (id, patch) => {
    if (MOCK_MODE || !user) {
      const updated = savedGames.map(g => g.id === id ? { ...g, ...patch } : g);
      setSavedGames(updated);
      saveLocal(updated);
      return;
    }

    // 取当前 game_data 合并 patch
    const current = savedGames.find(g => g.id === id);
    if (!current) return;
    const { id: _id, date: _date, ...currentData } = current;
    const newData = { ...currentData, ...patch };

    await supabase
      .from('saved_games')
      .update({ game_data: newData })
      .eq('id', id)
      .eq('user_id', user.id);

    setSavedGames(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  };

  return { savedGames, saveGame, deleteGame, updateGame, loading };
}
