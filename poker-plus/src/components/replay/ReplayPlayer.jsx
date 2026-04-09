import React, { useMemo } from 'react';
import { buildReplayFrames } from '../../utils/buildReplayFrames';
import { useReplayPlayer } from '../../hooks/useReplayPlayer';
import PokerTable from './PokerTable';
import ReplayControls from './ReplayControls';

/**
 * Full-screen overlay replay animation player.
 *
 * Props:
 *   savedGame  – full game data object (from localStorage or community post)
 *   onClose    – () => void
 */
export default function ReplayPlayer({ savedGame, onClose }) {
  const frames = useMemo(() => buildReplayFrames(savedGame), [savedGame]);

  const {
    frame,
    currentIndex,
    totalFrames,
    isPlaying,
    speed,
    isFinished,
    goToFrame,
    togglePlay,
    replay,
    setSpeed,
  } = useReplayPlayer(frames);

  return (
    <>
      {/* CSS animations (injected once) */}
      <style>{`
        @keyframes chipSlide {
          0%   { transform: translate(-50%,-50%); opacity: 1; }
          80%  { opacity: 0.8; }
          100% {
            transform: translate(
              calc(-50% + var(--dx, 0px)),
              calc(-50% + var(--dy, 0px))
            );
            opacity: 0;
          }
        }
        @keyframes cardFlyIn {
          0%   { transform: translateY(-18px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes bubblePop {
          0%   { transform: translateX(-50%) scale(0.7); opacity: 0; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1117',
        }}
      >
        {/* ── Top info bar ── */}
        <div style={{
          height: 48,
          flexShrink: 0,
          background: '#161b22',
          borderBottom: '1px solid #30363d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <span style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }}>
            SB ${savedGame.sbAmount} / BB ${savedGame.bbAmount}
          </span>
          <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 13 }}>
            {frame.streetLabel || '复盘动画'}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: '#374151',
              border: 'none',
              color: '#9ca3af',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Table area ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
          padding: '0 4px',
        }}>
          {/* Portrait table: constrain by height so it fills the screen vertically */}
          <div style={{
            width: '100%',
            maxWidth: 'calc((100vh - 148px) * 390 / 680)',
            aspectRatio: '390 / 680',
          }}>
            <PokerTable savedGame={savedGame} frame={frame} />
          </div>
        </div>

        {/* ── Controls ── */}
        <ReplayControls
          currentIndex={currentIndex}
          totalFrames={totalFrames}
          isPlaying={isPlaying}
          isFinished={isFinished}
          speed={speed}
          frames={frames}
          onTogglePlay={togglePlay}
          onGoToFrame={goToFrame}
          onSpeedChange={setSpeed}
          onReplay={replay}
        />
      </div>
    </>
  );
}
