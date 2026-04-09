import { useState, useEffect, useRef } from 'react';

const BASE_INTERVAL = 1200; // ms per frame at 1x speed

export function useReplayPlayer(frames) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [speed, setSpeed]               = useState(1);
  const timerRef = useRef(null);

  const interval = Math.round(BASE_INTERVAL / speed);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!isPlaying) return;
    if (currentIndex >= frames.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => Math.min(prev + 1, frames.length - 1));
    }, interval);
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, interval, frames.length]);

  const goToFrame = (idx) =>
    setCurrentIndex(Math.max(0, Math.min(idx, frames.length - 1)));

  const togglePlay = () => setIsPlaying(p => !p);

  const replay = () => {
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  return {
    frame: frames[currentIndex] ?? frames[0],
    currentIndex,
    totalFrames: frames.length,
    isPlaying,
    speed,
    isFinished: currentIndex >= frames.length - 1,
    goToFrame,
    togglePlay,
    replay,
    setSpeed,
  };
}
