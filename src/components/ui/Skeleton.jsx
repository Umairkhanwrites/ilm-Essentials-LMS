/**
 * Skeleton — Loading placeholder with shimmer for Ilm Essentials LMS.
 *
 * Uses the `.skeleton` CSS class defined in index.css for the shimmer
 * animation gradient, combined with Tailwind utility classes.
 *
 * @module components/ui/Skeleton
 *
 * @example
 * <Skeleton variant="text" />
 * <Skeleton variant="avatar" />
 * <Skeleton variant="card" width="100%" height="200px" />
 * <Skeleton variant="courseCard" />
 */

import React from 'react';
import clsx from 'clsx';

/**
 * @param {object} props
 * @param {'text'|'card'|'avatar'|'courseCard'} [props.variant='text'] — Shape preset
 * @param {string|number} [props.width] — Custom width override
 * @param {string|number} [props.height] — Custom height override
 * @param {number} [props.lines=1] — Number of lines for the "text" variant
 * @param {string} [props.className] — Additional CSS classes
 */
function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
  ...rest
}) {
  /** Inline style for custom dimensions */
  const style = {
    ...(width ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height
      ? { height: typeof height === 'number' ? `${height}px` : height }
      : {}),
  };

  /* ---- Text variant (single or multi‑line) ---- */
  if (variant === 'text') {
    if (lines > 1) {
      return (
        <div className={clsx('flex flex-col gap-2', className)} {...rest}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                'skeleton h-4',
                i === lines - 1 ? 'w-3/4' : 'w-full'
              )}
              style={style}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        className={clsx('skeleton h-4 w-full', className)}
        style={style}
        {...rest}
      />
    );
  }

  /* ---- Avatar variant (circle) ---- */
  if (variant === 'avatar') {
    return (
      <div
        className={clsx('skeleton rounded-full', className)}
        style={{ width: width ?? 40, height: height ?? 40, ...style }}
        {...rest}
      />
    );
  }

  /* ---- Card variant (rectangle) ---- */
  if (variant === 'card') {
    return (
      <div
        className={clsx('skeleton w-full', className)}
        style={{ height: height ?? 200, ...style }}
        {...rest}
      />
    );
  }

  /* ---- CourseCard variant (full course card shape) ---- */
  if (variant === 'courseCard') {
    return (
      <div
        className={clsx(
          'rounded-xl overflow-hidden bg-white shadow-card',
          className
        )}
        style={style}
        {...rest}
      >
        {/* Image area */}
        <div className="skeleton h-44 w-full rounded-none" />

        {/* Content area */}
        <div className="p-4 flex flex-col gap-3">
          {/* Badge row */}
          <div className="flex gap-2">
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>

          {/* Title */}
          <div className="skeleton h-5 w-full" />
          <div className="skeleton h-5 w-3/4" />

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-16" />
          </div>

          {/* Footer / price row */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-sand-200">
            <div className="skeleton h-6 w-20" />
            <div className="skeleton h-9 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  /* ---- Fallback: generic block ---- */
  return (
    <div
      className={clsx('skeleton w-full h-8', className)}
      style={style}
      {...rest}
    />
  );
}

Skeleton.displayName = 'Skeleton';

export { Skeleton };
export default Skeleton;
