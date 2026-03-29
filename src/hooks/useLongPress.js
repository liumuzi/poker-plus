import { useRef } from 'react';

/**
 * 长按检测 hook
 * @param {Function} onLongPress - 长按触发的回调
 * @param {Object} options
 * @param {number} [options.duration=500] - 长按持续时间（毫秒）
 * @param {boolean} [options.disabled=false] - 是否禁用
 * @returns {{ onTouchStart, onTouchEnd, onTouchCancel, onMouseDown, onMouseUp, onMouseLeave }}
 */
export function useLongPress(onLongPress, { duration = 500, disabled = false } = {}) {
  const timerRef = useRef(null);

  const start = (e) => {
    if (disabled) return;
    e.stopPropagation();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onLongPress();
    }, duration);
  };

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  };
}
