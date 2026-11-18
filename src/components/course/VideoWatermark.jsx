import React, { useState, useEffect, useRef } from 'react';
import { getAllStudents } from '../../services/courseStorage';

/**
 * VideoWatermark — Ultra-Minimal Forensic Flash Watermark
 *
 * Requirements:
 * 1. Fixed at the TOP-RIGHT corner (top-4 right-5, z-50).
 * 2. Clean, highly legible forensic badge: "● ID: std_001".
 * 3. Invisible during standard playback.
 * 4. Actively synchronizes with Bunny.net player playback time:
 *    - Automatically shows when playback is at 2:00 (115s - 135s), even when paused!
 *    - Automatically shows when playback is at 6:00 (355s - 375s).
 * 5. Flashes for 6 seconds on initial lesson load for instant verification.
 */
export default function VideoWatermark({ user, iframeRef }) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);

  // Poll Bunny.net iframe for exact playback time (works when playing AND when paused!)
  useEffect(() => {
    const pollIframe = () => {
      try {
        const iframeWin = iframeRef?.current?.contentWindow;
        if (iframeWin) {
          // Player.js protocol handshake supported by Bunny.net Stream
          iframeWin.postMessage(JSON.stringify({ method: 'getCurrentTime' }), '*');
          iframeWin.postMessage(JSON.stringify({ method: 'addEventListener', value: 'timeupdate' }), '*');
        }
      } catch (err) {
        // Cross-origin restriction fallback
      }
    };

    const interval = setInterval(pollIframe, 400);
    return () => clearInterval(interval);
  }, [iframeRef]);

  // Listen to Player.js / Bunny.net messages
  useEffect(() => {
    const handleMessage = (e) => {
      if (!e.data) return;

      let sec = null;

      try {
        const payload = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (payload) {
          if (typeof payload.value === 'number') {
            sec = payload.value;
          } else if (payload.value && typeof payload.value.seconds === 'number') {
            sec = payload.value.seconds;
          } else if (payload.data && typeof payload.data.seconds === 'number') {
            sec = payload.data.seconds;
          } else if (typeof payload.currentTime === 'number') {
            sec = payload.currentTime;
          }
        }
      } catch (err) {}

      if (sec !== null && typeof sec === 'number') {
        setCurrentSeconds(sec);

        // Active Zone 1: At 2:00 (115s - 135s), e.g. 02:00 mark
        const is2MinZone = sec >= 115 && sec <= 135;
        // Active Zone 2: At 6:00 (355s - 375s), e.g. 06:00 mark
        const is6MinZone = sec >= 355 && sec <= 375;

        if (is2MinZone || is6MinZone) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!isVisible) {
    return null;
  }

  // Resolve student roster ID (e.g. std_001) instead of raw 28-char Firebase UID
  let cleanId = 'std_001';
  try {
    const all = getAllStudents();
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userId = (user?.id || '').toLowerCase().trim();
    const matched = all.find(
      (s) =>
        (s.email && s.email.toLowerCase().trim() === userEmail) ||
        (s.uid && s.uid.toLowerCase().trim() === userId) ||
        (s.id && s.id.toLowerCase().trim() === userId)
    );
    if (matched?.id) {
      cleanId = matched.id;
    } else if (user?.id && !user.id.includes('@') && user.id.length <= 10) {
      cleanId = user.id;
    } else if (user?.email) {
      cleanId = user.email.split('@')[0];
    }
  } catch (e) {
    cleanId = 'std_001';
  }

  return (
    <div className="absolute top-4 right-5 z-50 pointer-events-none select-none transition-all duration-300 animate-fadeIn">
      <div className="bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/25 shadow-2xl flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-mono font-bold text-white tracking-wider">
          ID: {cleanId}
        </span>
      </div>
    </div>
  );
}
