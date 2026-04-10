import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_MODE, supabase } from '../lib/supabase';

const STORAGE_KEY = 'pokerSavedGames';
const MIGRATED_KEY = 'pokerGamesMigrated';

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

    // 立即显示本地缓存，不阻塞 UI
    const localGames = loadLocal();
    setSavedGames(localGames);
    setLoading(false);

    // 后台：同步云端数据，首次登录时迁移本地记录
    (async () => {
      const { data, error } = await supabase
        .from('saved_games')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return;

      const migratedKey = `${MIGRATED_KEY}_${user.id}`;
      const alreadyMigrated = localStorage.getItem(migratedKey);

      if (!alreadyMigrated && localGames.length > 0) {
        // 首次登录：将本地存档批量上传到云端
        const inserts = localGames.map(game => {
          const { id: _id, date: _date, ...gameData } = game;
          return { user_id: user.id, game_data: gameData };
        });
        await supabase.from('saved_games').insert(inserts);
        localStorage.setItem(migratedKey, '1');

        // 重新拉取（含刚迁移的数据）
        const { data: merged } = await supabase
          .from('saved_games')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (merged) {
          setSavedGames(merged.map(row => ({ id: row.id, date: new Date(row.created_at).toLocaleString(), ...row.game_data })));
        }
      } else {
        setSavedGames((data || []).map(row => ({ id: row.id, date: new Date(row.created_at).toLocaleString(), ...row.game_data })));
      }
    })().catch(() => {});
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
