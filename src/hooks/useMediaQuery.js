import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive breakpoint detection.
 * Uses window.matchMedia for efficient media query listening.
 * 
 * @param {string} query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} - Whether the media query currently matches
 * 
 * Usage:
 *   const isMobile = useMediaQuery('(max-width: 767px)');
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    // Modern browsers
    mediaQuery.addEventListener('change', handler);
    // Set initial value
    setMatches(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export default useMediaQuery;
