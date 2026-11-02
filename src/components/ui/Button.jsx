/**
 * Button — Reusable button component for Ilm Essentials LMS.
 *
 * @module components/ui/Button
 *
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Enroll Now
 * </Button>
 *
 * <Button variant="gold" size="lg" loading iconLeft={<Sparkles />}>
 *   Premium Access
 * </Button>
 */

import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'gold'} [props.variant='primary'] — Visual style variant
 * @param {'sm'|'md'|'lg'} [props.size='md'] — Button size
 * @param {boolean} [props.loading=false] — Show spinner & disable interaction
 * @param {boolean} [props.disabled=false] — Disable the button
 * @param {React.ReactNode} [props.iconLeft] — Icon rendered before label
 * @param {React.ReactNode} [props.iconRight] — Icon rendered after label
 * @param {'button'|'submit'|'reset'} [props.type='button'] — HTML button type
 * @param {string} [props.className] — Additional CSS classes
 * @param {React.ReactNode} props.children — Button label / content
 * @param {React.Ref} ref — Forwarded ref
 */
const Button = React.forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      iconLeft,
      iconRight,
      type = 'button',
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    /** Base styles shared by every variant */
    const base =
      'inline-flex items-center justify-center font-body font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-50';

    /** Variant‑specific styles */
    const variants = {
      primary:
        'bg-primary-800 text-white hover:bg-primary-700 active:bg-primary-900 shadow-soft hover:shadow-elevated',
      secondary:
        'border-2 border-primary-800 text-primary-800 bg-transparent hover:bg-primary-50 active:bg-primary-100',
      ghost:
        'text-primary-800 bg-transparent hover:bg-primary-50 active:bg-primary-100',
      gold:
        'bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-700 shadow-soft hover:shadow-glow',
    };

    /** Size‑specific styles */
    const sizes = {
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'text-sm px-5 py-2.5 gap-2',
      lg: 'text-base px-7 py-3 gap-2.5',
    };

    /** Spinner sizes to match button sizes */
    const spinnerSizes = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={clsx(base, variants[variant], sizes[size], className)}
        aria-busy={loading || undefined}
        {...rest}
      >
        {/* Loading spinner replaces left icon */}
        {loading ? (
          <Loader2 className={clsx('animate-spin', spinnerSizes[size])} />
        ) : (
          iconLeft && (
            <span className={clsx('shrink-0', spinnerSizes[size])}>
              {iconLeft}
            </span>
          )
        )}

        {children}

        {/* Right icon (hidden while loading) */}
        {!loading && iconRight && (
          <span className={clsx('shrink-0', spinnerSizes[size])}>
            {iconRight}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
