import React, { useRef } from 'react';

const SPEEDS = [0.5, 1, 1.5, 2, 3];

/**
 * Bottom controls bar for the replay player.
 * Progress bar, play/pause, speed selector.
 */
export default function ReplayControls({
  currentIndex,
  totalFrames,
  isPlaying,
  isFinished,
  speed,
  frames,
  onTogglePlay,
  onGoToFrame,
  onSpeedChange,
  onReplay,
}) {
  const barRef = useRef(null);

  const progress = totalFrames > 1 ? currentIndex / (totalFrames - 1) : 0;

  const handleBarClick = (e) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onGoToFrame(Math.round(ratio * (totalFrames - 1)));
  };

  // Street divider markers
  const dividerFrames = frames
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => f.type === 'street_divider');

  const currentFrame = frames[currentIndex];

  return (
    <div style={{
      height: 72,
      background: '#161b22',
      borderTop: '1px solid #30363d',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 12px',
      gap: 8,
      flexShrink: 0,
    }}>
      {/* Top row: frame info + progress + speed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Frame counter */}
        <div style={{ color: '#9ca3af', fontSize: 10, whiteSpace: 'nowrap', minWidth: 60 }}>
          {currentIndex + 1} / {totalFrames}
          {currentFrame?.streetLabel && (
            <span style={{ color: '#6b7280', marginLeft: 4 }}>
              · {currentFrame.streetLabel}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div
          ref={barRef}
          onClick={handleBarClick}
          style={{
            flex: 1,
            height: 6,
            background: '#374151',
            borderRadius: 3,
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          {/* Fill */}
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: `${progress * 100}%`,
            background: '#3b82f6',
            borderRadius: 3,
            transition: 'width 0.15s',
          }} />

          {/* Street divider markers */}
          {totalFrames > 1 && dividerFrames.map(({ i }) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(i / (totalFrames - 1)) * 100}%`,
                top: -2,
                bottom: -2,
                width: 2,
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 1,
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Thumb */}
          <div style={{
            position: 'absolute',
            left: `${progress * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#3b82f6',
            border: '2px solid #93c5fd',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Speed selector */}
        <div style={{ display: 'flex', gap: 2 }}>
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                padding: '2px 5px',
                borderRadius: 4,
                fontSize: 9,
                fontWeight: 700,
                background: speed === s ? '#3b82f6' : '#374151',
                color: speed === s ? '#fff' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row: prev, play/pause, next */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {/* Prev */}
        <button
          onClick={() => onGoToFrame(currentIndex - 1)}
          disabled={currentIndex === 0}
          style={btnStyle(currentIndex === 0)}
        >
          ⏮
        </button>

        {/* Play/Pause/Replay */}
        <button
          onClick={isFinished ? onReplay : onTogglePlay}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#374151',
            border: '2px solid #4b5563',
            color: '#fff',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isFinished ? '↺' : isPlaying ? '⏸' : '▶'}
        </button>

        {/* Next */}
        <button
          onClick={() => onGoToFrame(currentIndex + 1)}
          disabled={currentIndex >= totalFrames - 1}
          style={btnStyle(currentIndex >= totalFrames - 1)}
        >
          ⏭
        </button>
      </div>
    </div>
  );
}

function btnStyle(disabled) {
  return {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: disabled ? '#1f2937' : '#374151',
    border: 'none',
    color: disabled ? '#4b5563' : '#9ca3af',
    fontSize: 14,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
