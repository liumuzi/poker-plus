import React, { useState } from 'react';

/**
 * 玩家信息编辑面板（SummaryScreen中的可折叠编辑区域）
 * 用于编辑玩家名称、筹码和复盘备注
 * @param {Function} onSavePlayer - 保存玩家编辑回调 (playerId, name, stack)
 * @param {Function} onSaveNotes - 保存备注回调 (notes)
 */
export default function EditPanel({ players, playerStacks, tempNotes, onTempNotesChange, onSavePlayer, onSaveNotes }) {
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [tempPlayerName, setTempPlayerName] = useState('');
  const [tempPlayerStack, setTempPlayerStack] = useState('');

  const handleStartEditPlayer = (player) => {
    setEditingPlayerId(player.id);
    setTempPlayerName(player.name);
    setTempPlayerStack(player.stackSize ?? playerStacks?.[player.id] ?? '');
  };

  const handleSavePlayerEdit = () => {
    if (editingPlayerId !== null) {
      onSavePlayer(editingPlayerId, tempPlayerName.trim(), tempPlayerStack ? Number(tempPlayerStack) : null);
    }
    setEditingPlayerId(null);
    setTempPlayerName('');
    setTempPlayerStack('');
  };

  const handleCancelPlayerEdit = () => {
    setEditingPlayerId(null);
    setTempPlayerName('');
    setTempPlayerStack('');
  };

  const handleSaveNotes = () => {
    onSaveNotes(tempNotes);
  };

  return (
    <div className="mt-3 bg-felt-600 rounded-xl p-3 border border-felt-400">
      <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">玩家信息编辑</h4>
      
      {/* 玩家列表 */}
      <div className="space-y-2 mb-4">
        {players.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-felt-500 rounded-lg p-2">
            {editingPlayerId === p.id ? (
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={tempPlayerName}
                  onChange={(e) => setTempPlayerName(e.target.value)}
                  placeholder="玩家名称"
                  className="flex-1 bg-felt-700 border border-felt-300 rounded px-2 py-1 text-xs text-white"
                />
                <input
                  type="number"
                  value={tempPlayerStack}
                  onChange={(e) => setTempPlayerStack(e.target.value)}
                  placeholder="后手筹码"
                  className="w-20 bg-felt-700 border border-felt-300 rounded px-2 py-1 text-xs text-white"
                />
                <button
                  onClick={handleSavePlayerEdit}
                  className="text-emerald-400 text-xs px-2 py-1 bg-emerald-500/20 rounded"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancelPlayerEdit}
                  className="text-red-400 text-xs px-2 py-1 bg-red-500/20 rounded"
                >
                  ✗
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold ${p.isHero ? 'text-amber-400' : 'text-slate-300'}`}>
                    {p.name} {p.isHero && '👑'}
                  </span>
                {(p.stackSize != null || playerStacks?.[p.id] != null) && (
                    <span className="text-[10px] text-slate-500">
                      后手: {p.stackSize ?? playerStacks?.[p.id] ?? 0}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleStartEditPlayer(p)}
                  className="text-blue-400 text-xs px-2 py-1 bg-blue-500/20 rounded hover:bg-blue-500/30"
                >
                  编辑
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 备注区域 */}
      <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">复盘备注</h4>
      <textarea
        value={tempNotes}
        onChange={(e) => onTempNotesChange(e.target.value)}
        onBlur={handleSaveNotes}
        placeholder="在这里记录你的复盘思考、反思或注意事项..."
        className="w-full bg-felt-700 border border-felt-300 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 min-h-[80px] resize-none"
      />
    </div>
  );
}
