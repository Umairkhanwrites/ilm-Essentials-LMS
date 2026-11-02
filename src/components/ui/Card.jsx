/**
 * Card — Versatile container component for Ilm Essentials LMS.
 *
 * @module components/ui/Card
 *
 * @example
 * <Card variant="elevated" padding="lg" onClick={handleClick}>
 *   <Card.Header>Course Preview</Card.Header>
 *   <Card.Body>Content here...</Card.Body>
 *   <Card.Footer>Footer actions</Card.Footer>
 * </Card>
 */

import React from 'react';
import clsx from 'clsx';

/**
 * @param {object} props
 * @param {'default'|'outlined'|'elevated'} [props.variant='default'] — Visual style
 * @param {'none'|'sm'|'md'|'lg'} [props.padding='md'] — Internal padding
 * @param {boolean} [props.hoverable=false] — Lift on hover
 * @param {function} [props.onClick] — Click handler (adds pointer & hover lift)
 * @param {string} [props.className] — Additional CSS classes
 * @param {React.ReactNode} props.children — Card contents
 */
function Card({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
  className,
  children,
  ...rest
}) {
  const isInteractive = !!onClick || hoverable;

  const base = 'rounded-xl overflow-hidden transition-all duration-200';

  const variants = {
    default: 'bg-white shadow-card',
    outlined: 'bg-white border border-sand-300',
    elevated: 'bg-white shadow-elevated',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  };

  const interactive =
    'cursor-pointer hover:-translate-y-1 hover:shadow-elevated active:translate-y-0';

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={clsx(
        base,
        variants[variant],
        paddings[padding],
        isInteractive && interactive,
        className
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * Card.Header — Optional header section.
 * @param {object} props
 * @param {string} [props.className] — Additional CSS classes
 * @param {React.ReactNode} props.children
 */
function CardHeader({ className, children, ...rest }) {
  return (
    <div
      className={clsx(
        'font-heading text-lg font-semibold text-ink-900 pb-3 border-b border-sand-200 mb-4',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
CardHeader.displayName = 'Card.Header';

/**
 * Card.Body — Main content area.
 * @param {object} props
 * @param {string} [props.className] — Additional CSS classes
 * @param {React.ReactNode} props.children
 */
function CardBody({ className, children, ...rest }) {
  return (
    <div className={clsx('text-ink-700 font-body', className)} {...rest}>
      {children}
    </div>
  );
}
CardBody.displayName = 'Card.Body';

/**
 * Card.Footer — Optional footer section.
 * @param {object} props
 * @param {string} [props.className] — Additional CSS classes
 * @param {React.ReactNode} props.children
 */
function CardFooter({ className, children, ...rest }) {
  return (
    <div
      className={clsx(
        'pt-4 mt-4 border-t border-sand-200 flex items-center gap-3',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
CardFooter.displayName = 'Card.Footer';

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.displayName = 'Card';

export { Card };
export default Card;
