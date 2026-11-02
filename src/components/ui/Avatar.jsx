/**
 * Avatar — User avatar with image support and initials fallback for Ilm Essentials LMS.
 *
 * @module components/ui/Avatar
 *
 * @example
 * <Avatar src="/img/user.jpg" alt="Ali Khan" size="lg" status="online" />
 * <Avatar name="Fatima Zahra" size="md" />
 */

import React, { useState } from 'react';
import clsx from 'clsx';

/**
 * Extracts initials from a full name (first letter of first + last word).
 * @param {string} name — Full user name
 * @returns {string} Up to two uppercase letters
 */
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * @param {object} props
 * @param {string} [props.src] — Image URL
 * @param {string} [props.alt] — Alt text for the image
 * @param {string} [props.name] — User name (used for initials fallback)
 * @param {'sm'|'md'|'lg'} [props.size='md'] — Avatar size (32 / 40 / 56 px)
 * @param {'online'|'offline'} [props.status] — Optional status indicator dot
 * @param {string} [props.className] — Additional CSS classes
 */
function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  status,
  className,
  ...rest
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = src && !imgFailed;
  const initials = getInitials(name);

  /** Pixel sizes & text sizes per variant */
  const sizeMap = {
    sm: { px: 32, text: 'text-xs', dot: 'h-2.5 w-2.5 border-[1.5px]' },
    md: { px: 40, text: 'text-sm', dot: 'h-3 w-3 border-2' },
    lg: { px: 56, text: 'text-base', dot: 'h-3.5 w-3.5 border-2' },
  };

  const { px, text, dot } = sizeMap[size];

  /** Status dot colours */
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-ink-400',
  };

  return (
    <div
      className={clsx('relative inline-flex shrink-0', className)}
      style={{ width: px, height: px }}
      {...rest}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? name}
          onError={() => setImgFailed(true)}
          className="h-full w-full rounded-full object-cover ring-2 ring-sand-200"
          loading="lazy"
        />
      ) : (
        <span
          className={clsx(
            'flex h-full w-full items-center justify-center rounded-full bg-primary-800 font-body font-semibold text-gold-300 ring-2 ring-sand-200 select-none',
            text
          )}
          aria-label={name || 'User avatar'}
        >
          {initials || '?'}
        </span>
      )}

      {/* Status indicator */}
      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-white',
            dot,
            statusColors[status]
          )}
          aria-label={status}
        />
      )}
    </div>
  );
}

Avatar.displayName = 'Avatar';

export { Avatar };
export default Avatar;
