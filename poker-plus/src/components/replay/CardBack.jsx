import React from 'react';

/** Classic deep-blue card back with diamond pattern */
export default function CardBack({ width = 36, height = 52, style }) {
  const id = `cbp-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 36 52"
      style={{ borderRadius: 4, display: 'block', ...style }}
    >
      <rect width="36" height="52" fill="#1e3a5f" rx="4" />
      <defs>
        <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
          <path
            d="M0 4 L4 0 L8 4 L4 8 Z"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.6"
          />
        </pattern>
      </defs>
      <rect width="36" height="52" fill={`url(#${id})`} rx="4" />
      <rect
        x="2" y="2" width="32" height="48"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1"
        rx="3"
      />
    </svg>
  );
}
