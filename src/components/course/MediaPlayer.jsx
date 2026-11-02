/**
 * MediaPlayer — Simulated video player for the course interface.
 *
 * Renders a 16:9 dark container with play overlay, faux progress bar,
 * player controls (play/pause, volume, speed, fullscreen, theater mode),
 * current-lesson title overlay, and an optional LIVE badge.
 *
 * @param {object}   currentLesson       - Active lesson object { id, title, type, duration, … }
 * @param {boolean}  isLive              - Whether this is a live session
 * @param {boolean}  theaterMode         - Current theater-mode state
 * @param {function} onTheaterToggle     - Callback to toggle theater mode
 *
 * TODO: Integrate actual video / HLS player (e.g. video.js or hls.js)
 * TODO: Connect to streaming backend for live sessions
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MonitorPlay,
  SkipForward,
} from 'lucide-react';

/** Speed options */
const SPEED_OPTIONS = ['1x', '1.5x', '2x'];

export default function MediaPlayer({
  currentLesson,
  isLive = false,
  theaterMode = false,
  onTheaterToggle,
}) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(35);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const cycleSpeed = useCallback(() => {
    setSpeedIdx((prev) => (prev + 1) % SPEED_OPTIONS.length);
  }, []);

  const handlePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
    setShowOverlay(false);
  }, []);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <div
      className={clsx(
        'relative w-full bg-ink-900 rounded-xl overflow-hidden shadow-elevated select-none group',
        theaterMode ? 'rounded-none' : ''
      )}
    >
      {/* ---- 16:9 Aspect Ratio Container ---- */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {/* Dark canvas placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-primary-950 flex items-center justify-center">
          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-5 bg-islamic-pattern" />

          {/* ---- Current lesson title overlay (top-left) ---- */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
            <div className="flex items-center gap-3">
              {/* LIVE badge */}
              {isLive && (
                <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse-soft" />
                  Live
                </span>
              )}
              <p className="text-white/90 text-sm font-medium truncate">
                {currentLesson?.title || 'Select a lesson to begin'}
              </p>
            </div>
          </div>

          {/* ---- Large center play button ---- */}
          <AnimatePresence>
            {(showOverlay || !playing) && (
              <motion.button
                key="play-overlay"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={handlePlayPause}
                className="relative z-20 flex items-center justify-center w-20 h-20 rounded-full
                           bg-gold-500/90 hover:bg-gold-400 text-white shadow-glow
                           transition-colors cursor-pointer focus:outline-none"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <Pause size={32} className="ml-0" />
                ) : (
                  <Play size={32} className="ml-1" />
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* ---- Bottom controls ---- */}
          <div
            className={clsx(
              'absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300',
              'bg-gradient-to-t from-black/80 via-black/40 to-transparent',
              'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
            )}
          >
            {/* Fake progress bar */}
            <div className="px-4 pt-4">
              <div
                className="relative w-full h-1 bg-white/20 rounded-full cursor-pointer group/bar"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.round(
                    ((e.clientX - rect.left) / rect.width) * 100
                  );
                  setFakeProgress(Math.max(0, Math.min(100, pct)));
                }}
                role="slider"
                aria-label="Seek"
                aria-valuenow={fakeProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-gold-500 rounded-full transition-all"
                  style={{ width: `${fakeProgress}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold-400 rounded-full
                             opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-md"
                  style={{ left: `${fakeProgress}%`, marginLeft: '-6px' }}
                />
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between px-4 py-3 text-white">
              {/* Left controls */}
              <div className="flex items-center gap-3">
                {/* Play / Pause */}
                <button
                  onClick={handlePlayPause}
                  className="hover:text-gold-400 transition-colors cursor-pointer"
                  aria-label={playing ? 'Pause' : 'Play'}
                >
                  {playing ? <Pause size={20} /> : <Play size={20} />}
                </button>

                {/* Skip forward */}
                <button
                  className="hover:text-gold-400 transition-colors cursor-pointer"
                  aria-label="Skip forward"
                >
                  <SkipForward size={18} />
                </button>

                {/* Volume */}
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="hover:text-gold-400 transition-colors cursor-pointer"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                {/* Duration label */}
                <span className="text-xs text-white/60 font-mono">
                  14:32 / {currentLesson?.duration || '45:00'}
                </span>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-3">
                {/* Speed */}
                <button
                  onClick={cycleSpeed}
                  className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 hover:bg-white/20
                             transition-colors cursor-pointer"
                  aria-label={`Playback speed ${SPEED_OPTIONS[speedIdx]}`}
                >
                  {SPEED_OPTIONS[speedIdx]}
                </button>

                {/* Theater mode */}
                <button
                  onClick={onTheaterToggle}
                  className={clsx(
                    'hover:text-gold-400 transition-colors cursor-pointer',
                    theaterMode && 'text-gold-400'
                  )}
                  aria-label={
                    theaterMode
                      ? 'Exit theater mode'
                      : 'Enter theater mode'
                  }
                >
                  <MonitorPlay size={20} />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={handleFullscreen}
                  className="hover:text-gold-400 transition-colors cursor-pointer"
                  aria-label={
                    isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                  }
                >
                  {isFullscreen ? (
                    <Minimize size={20} />
                  ) : (
                    <Maximize size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
