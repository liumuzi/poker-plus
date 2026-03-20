import { useState } from 'react';

const STORAGE_KEY = 'pokerSavedGames';

/**
 * localStorage 存档 CRUD hook
 */
export function useSavedGames() {
  const [savedGames, setSavedGames] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveGame = (gameData) => {
    const newGame = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      ...gameData,
    };
    const updated = [newGame, ...savedGames];
    setSavedGames(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteGame = (id) => {
    const updated = savedGames.filter((g) => g.id !== id);
    setSavedGames(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { savedGames, saveGame, deleteGame };
}
