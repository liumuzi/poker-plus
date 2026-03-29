import { useState, useRef, useEffect } from 'react';

/**
 * 内联文本编辑 hook（用于点击进入编辑模式，编辑完成后回调）
 * @param {Function} onConfirm - 确认编辑回调，参数为 (id, newValue)
 * @returns {{ editingId, tempValue, inputRef, startEdit, setTempValue, confirmEdit, cancelEdit }}
 */
export function useInlineEdit(onConfirm) {
  const [editingId, setEditingId] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEdit = (id, currentValue) => {
    setEditingId(id);
    setTempValue(currentValue);
  };

  const confirmEdit = () => {
    const trimmed = tempValue.trim();
    if (editingId !== null && trimmed) {
      onConfirm(editingId, trimmed);
    }
    setEditingId(null);
    setTempValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTempValue('');
  };

  return {
    editingId,
    tempValue,
    inputRef,
    startEdit,
    setTempValue,
    confirmEdit,
    cancelEdit,
  };
}
