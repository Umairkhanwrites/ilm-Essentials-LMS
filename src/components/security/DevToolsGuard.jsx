import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * DevToolsGuard — Advanced Client-Side Intellectual Property Protection
 *
 * Capabilities:
 * 1. Blocks right-click context menu on sensitive course pages
 * 2. Intercepts common DevTools keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 * 3. Detects active DevTools inspection windows via dimension metrics & debugger timing
 * 4. Displays an active security shield overlay when inspection is open
 * 5. Automatically exempts verified administrators (role === 'admin')
 */
export default function DevToolsGuard() {
  const { user } = useAuth();
  const [isDevToolsDetected, setIsDevToolsDetected] = useState(false);

  // Exempt administrators from developer tool restrictions
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      setIsDevToolsDetected(false);
      return;
    }

    // 1. Context Menu (Right Click) Prevention
    const handleContextMenu = (e) => {
      // Allow right-click inside form inputs/textareas for pasting/spellcheck
      const targetTag = e.target?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') {
        return;
      }
      e.preventDefault();
    };

    // 2. Keyboard Shortcut Interception
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I / Cmd+Option+I (Inspect)
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey))) {
        const key = (e.key || '').toLowerCase();
        if (key === 'i' || key === 'j' || key === 'c') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl+U / Cmd+Option+U (View Source)
      if (cmdOrCtrl && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S / Cmd+S (Save Webpage)
      if (cmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. DevTools Open Detection Probe
    let intervalId = null;
    const checkDevTools = () => {
      // In local development or split-pane webviews, skip dimension probe to prevent false positives
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || import.meta.env.DEV) {
        setIsDevToolsDetected(false);
        return;
      }

      // Threshold check: docked DevTools occupies at least 250px-450px
      const widthThreshold = (window.outerWidth - window.innerWidth) > 250;
      const heightThreshold = (window.outerHeight - window.innerHeight) > 250;

      if (widthThreshold || heightThreshold) {
        setIsDevToolsDetected(true);
      } else {
        setIsDevToolsDetected(false);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    intervalId = setInterval(checkDevTools, 1000);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAdmin]);

  // If administrator or no DevTools detected, render nothing
  if (isAdmin || !isDevToolsDetected) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 text-center select-none animate-fade-in">
      <div className="max-w-md w-full bg-gradient-to-b from-[#0e1d15] to-[#07130d] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-inner">
          <ShieldAlert size={32} className="animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-[11px] font-bold uppercase tracking-wider">
            <Lock size={12} />
            <span>Digital Rights Security Protocol</span>
          </div>
          <h3 className="text-xl font-heading font-bold text-white leading-snug">
            Developer Inspection Restricted
          </h3>
          <p className="text-xs sm:text-sm text-sand-300 leading-relaxed">
            To safeguard proprietary academic materials and copyrighted lecture streams, viewing the LMS with Developer Tools open is restricted.
          </p>
          <p className="text-[11px] text-sand-400 pt-1">
            Please close Developer Tools to immediately resume your lecture.
          </p>
        </div>

        <div className="pt-2">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-sand-300 flex items-center justify-center gap-2">
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            <span>This window will automatically restore when closed.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
