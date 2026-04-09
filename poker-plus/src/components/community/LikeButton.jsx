import React from 'react';
import { Heart } from 'lucide-react';
import { useLike } from '../../hooks/useLike';
import { useAuth } from '../../contexts/AuthContext';

export default function LikeButton({ targetType, targetId, initialCount = 0, onNeedAuth, small = false }) {
  const { user } = useAuth();
  const { liked, count, toggle } = useLike(targetType, targetId, initialCount);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!user) { onNeedAuth?.(); return; }
    toggle(user.id);
  };

  const iconSize = small ? 13 : 15;

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 transition-colors active:scale-90 ${
        liked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
      }`}
    >
      <Heart size={iconSize} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
      <span className={`${small ? 'text-[11px]' : 'text-xs'} font-medium`}>{count}</span>
    </button>
  );
}
