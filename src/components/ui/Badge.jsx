/**
 * Badge — Course format label component for Ilm Essentials LMS.
 *
 * @module components/ui/Badge
 *
 * @example
 * <Badge variant="on-site" icon={<MapPin />}>On‑Site</Badge>
 * <Badge variant="live-online">Live Online</Badge>
 * <Badge variant="self-paced" size="sm">Self‑Paced</Badge>
 */

import React from 'react';
import clsx from 'clsx';

/**
 * @param {object} props
 * @param {'default'|'on-site'|'live-online'|'self-paced'} [props.variant='default'] — Visual style
 * @param {'sm'|'md'} [props.size='md'] — Badge size
 * @param {React.ReactNode} [props.icon] — Optional leading icon
 * @param {string} [props.className] — Additional CSS classes
 * @param {React.ReactNode} props.children — Badge label text
 */
function Badge({
  variant = 'default',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}) {
  /** Base styles shared by every variant */
  const base =
    'inline-flex items-center font-body font-medium rounded-full whitespace-nowrap select-none';

  /** Variant colour schemes */
  const variants = {
    default: 'bg-sand-200 text-ink-700',
    'on-site':
      'bg-primary-50 text-primary-800 ring-1 ring-primary-200',
    'live-online':
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    'self-paced':
      'bg-gold-50 text-gold-700 ring-1 ring-gold-200',
  };

  /** Size styles */
  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  };

  /** Icon sizes */
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  };

  return (
    <span
      className={clsx(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {icon && (
        <span className={clsx('shrink-0', iconSizes[size])}>{icon}</span>
      )}
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';

export { Badge };
export default Badge;
