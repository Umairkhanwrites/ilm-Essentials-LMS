/**
 * ProgressBar — Animated progress indicator for Ilm Essentials LMS.
 *
 * @module components/ui/ProgressBar
 *
 * @example
 * <ProgressBar value={65} color="primary" size="md" showLabel />
 * <ProgressBar value={30} color="gold" size="lg" />
 */

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

/**
 * @param {object} props
 * @param {number} props.value — Progress percentage (0‑100)
 * @param {'primary'|'gold'} [props.color='primary'] — Fill colour
 * @param {'sm'|'md'|'lg'} [props.size='md'] — Track height
 * @param {boolean} [props.showLabel=true] — Show percentage text
 * @param {string} [props.label] — Optional custom label (overrides default "X%")
 * @param {string} [props.className] — Additional CSS classes
 */
function ProgressBar({
  value = 0,
  color = 'primary',
  size = 'md',
  showLabel = true,
  label,
  className,
  ...rest
}) {
  const clamped = Math.min(100, Math.max(0, value));

  /** Animate the bar width from 0 on mount */
  const [width, setWidth] = useState(0);
  useEffect(() => {
    // Use rAF to ensure the 0‑width state renders first
    const raf = requestAnimationFrame(() => {
      setWidth(clamped);
    });
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  /** Track height per size */
  const trackSizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  /** Fill gradient colours */
  const fills = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-400',
    gold: 'bg-gradient-to-r from-gold-600 to-gold-400',
  };

  /** Track background */
  const trackBg = 'bg-sand-200';

  const displayLabel = label ?? `${Math.round(clamped)}%`;

  return (
    <div className={clsx('w-full', className)} {...rest}>
      {/* Label row */}
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-ink-600 font-body">
            Progress
          </span>
          <span
            className={clsx(
              'text-xs font-semibold font-body',
              color === 'gold' ? 'text-gold-700' : 'text-primary-700'
            )}
          >
            {displayLabel}
          </span>
        </div>
      )}

      {/* Track */}
      <div
        className={clsx('w-full rounded-full overflow-hidden', trackBg, trackSizes[size])}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={displayLabel}
      >
        {/* Fill */}
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-700 ease-out',
            fills[color]
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
export default ProgressBar;
