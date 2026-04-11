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
  const [error, setError] = useState(null); // 新增：错误状态

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
      const { data, error: fetchError } = await supabase
        .from('saved_games')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('[useSavedGames] fetch error:', fetchError.message);
        setError(fetchError.message);
        return;
      }

      const migratedKey = `${MIGRATED_KEY}_${user.id}`;
      const alreadyMigrated = localStorage.getItem(migratedKey);

      if (!alreadyMigrated && localGames.length > 0) {
        // 立即设置 flag，防止并发 effect 重复迁移
        localStorage.setItem(migratedKey, '1');
        try {
          const inserts = localGames.map(game => {
            const { id: _id, date: _date, ...gameData } = game;
            return { user_id: user.id, game_data: gameData };
          });
          const { error: insertError } = await supabase.from('saved_games').insert(inserts);
          if (insertError) throw insertError;

          // 重新拉取（含刚迁移的数据）
          const { data: merged } = await supabase
            .from('saved_games')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (merged) {
            setSavedGames(merged.map(row => ({ id: row.id, date: new Date(row.created_at).toLocaleString(), ...row.game_data })));
          }
        } catch (err) {
          // 上传失败，撤销 flag 允许下次重试
          console.warn('[useSavedGames] migration error:', err.message || err);
          localStorage.removeItem(migratedKey);
          setSavedGames((data || []).map(row => ({ id: row.id, date: new Date(row.created_at).toLocaleString(), ...row.game_data })));
        }
      } else {
        setSavedGames((data || []).map(row => ({ id: row.id, date: new Date(row.created_at).toLocaleString(), ...row.game_data })));
      }
    })().catch((err) => {
      console.error('[useSavedGames] unexpected error:', err);
    });
  }, [user]);

  const saveGame = async (gameData) => {
    const date = new Date().toLocaleString();

    if (MOCK_MODE || !user) {
      const newGame = { id: Date.now(), date, ...gameData };
      const updated = [newGame, ...savedGames];
      setSavedGames(updated);
      saveLocal(updated);
      return { error: null };
    }

    const { data, error: insertError } = await supabase
      .from('saved_games')
      .insert({ user_id: user.id, game_data: gameData })
      .select()
      .single();

    if (insertError) {
      console.warn('[useSavedGames] saveGame error:', insertError.message);
      return { error: insertError };
    }
    if (data) {
      const newGame = { id: data.id, date: new Date(data.created_at).toLocaleString(), ...gameData };
      setSavedGames(prev => [newGame, ...prev]);
    }
    return { error: null };
  };

  const deleteGame = async (id) => {
    if (MOCK_MODE || !user) {
      const updated = savedGames.filter(g => g.id !== id);
      setSavedGames(updated);
      saveLocal(updated);
      return { error: null };
    }

    const { error: deleteError } = await supabase.from('saved_games').delete().eq('id', id).eq('user_id', user.id);
    if (deleteError) {
      console.warn('[useSavedGames] deleteGame error:', deleteError.message);
      return { error: deleteError };
    }
    setSavedGames(prev => prev.filter(g => g.id !== id));
    return { error: null };
  };

  const updateGame = async (id, patch) => {
    if (MOCK_MODE || !user) {
      const updated = savedGames.map(g => g.id === id ? { ...g, ...patch } : g);
      setSavedGames(updated);
      saveLocal(updated);
      return { error: null };
    }

    // 取当前 game_data 合并 patch
    const current = savedGames.find(g => g.id === id);
    if (!current) return { error: new Error('Game not found') };
    const { id: _id, date: _date, ...currentData } = current;
    const newData = { ...currentData, ...patch };

    const { error: updateError } = await supabase
      .from('saved_games')
      .update({ game_data: newData })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.warn('[useSavedGames] updateGame error:', updateError.message);
      return { error: updateError };
    }

    setSavedGames(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
    return { error: null };
  };

  return { savedGames, saveGame, deleteGame, updateGame, loading, error };
}
