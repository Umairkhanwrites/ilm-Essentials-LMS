import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * DevToolsGuard — Client-Side Intellectual Property & Shortcut Protection
 *
 * Capabilities:
 * 1. Blocks right-click context menu (safely allowing form inputs & textareas for pasting)
 * 2. Intercepts common DevTools & source inspection shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
 * 3. Exempts verified administrators (role === 'admin')
 *
 * Note: Window dimension diff checks (outerWidth - innerWidth) are completely eliminated
 * because they trigger false positives on high-DPI displays, OS scaling (125%/150%),
 * browser sidebars (Edge/Opera/Chrome side panels), and window snapping.
 */
export default function DevToolsGuard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
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

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdmin]);

  // Operates purely as a background event guard without disruptive full-screen modal lockouts
  return null;
}
