import { useRef } from 'react';

/**
 * 为容器提供鼠标拖拽滚动能力
 */
export function useDragScroll() {
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startPos.current = {
      x: e.pageX,
      y: e.pageY,
      scrollLeft: scrollRef.current?.scrollLeft || 0,
      scrollTop: scrollRef.current?.scrollTop || 0,
    };
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft = startPos.current.scrollLeft - (e.pageX - startPos.current.x);
    scrollRef.current.scrollTop = startPos.current.scrollTop - (e.pageY - startPos.current.y);
  };

  return { scrollRef, handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove };
}
