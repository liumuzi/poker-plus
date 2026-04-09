import React from 'react';

const COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EF4444',
  '#8B5CF6','#EC4899','#14B8A6','#F97316',
];

function colorForNickname(nickname = '') {
  let h = 0;
  for (let i = 0; i < nickname.length; i++) h = (h * 31 + nickname.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}

/**
 * 用户头像：有 avatar_url 则显示图片，否则显示昵称首字母彩色背景
 */
export default function UserAvatar({ nickname = '?', avatarUrl = null, size = 32, onClick }) {
  const bg = colorForNickname(nickname);
  const initial = nickname.charAt(0).toUpperCase();
  const fontSize = Math.round(size * 0.4);

  const base = {
    width: size, height: size, borderRadius: '50%',
    flexShrink: 0, overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
  };

  if (avatarUrl) {
    return (
      <div style={base} onClick={onClick}>
        <img src={avatarUrl} alt={nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div
      style={{ ...base, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClick}
    >
      <span style={{ color: 'white', fontWeight: 900, fontSize, lineHeight: 1 }}>{initial}</span>
    </div>
  );
}
