/**
 * Modal — Accessible dialog overlay for Ilm Essentials LMS.
 *
 * Features: backdrop blur, Escape key close, click‑outside close,
 * framer‑motion entry/exit, scrollable body, optional footer.
 *
 * @module components/ui/Modal
 *
 * @example
 * <Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm Enrollment">
 *   <p>You are about to enroll in this course.</p>
 *   <Modal.Footer>
 *     <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </Modal.Footer>
 * </Modal>
 */

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';

/**
 * @param {object} props
 * @param {boolean} props.isOpen — Controls visibility
 * @param {function} props.onClose — Called when user requests close
 * @param {string} [props.title] — Header title text
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] — Max width of the dialog
 * @param {boolean} [props.closeOnBackdrop=true] — Close when clicking backdrop
 * @param {boolean} [props.closeOnEscape=true] — Close on Escape key
 * @param {string} [props.className] — Additional CSS classes for the panel
 * @param {React.ReactNode} props.children — Body content (may include Modal.Footer)
 */
function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
  children,
  ...rest
}) {
  /** Escape key listener */
  const handleKeyDown = useCallback(
    (e) => {
      if (closeOnEscape && e.key === 'Escape') onClose?.();
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  /** Panel max‑widths */
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  /** Framer motion variants */
  const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const panel = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdrop}
          transition={{ duration: 0.2 }}
          aria-modal="true"
          role="dialog"
          {...rest}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            className={clsx(
              'relative w-full rounded-xl bg-white shadow-elevated flex flex-col max-h-[90vh]',
              sizes[size],
              className
            )}
            variants={panel}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200">
                <h2 className="font-heading text-lg font-semibold text-ink-900 truncate pr-4">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-lg p-1.5 text-ink-500 hover:bg-sand-100 hover:text-ink-800 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 font-body text-ink-700">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Modal.Footer — Pinned footer inside the modal panel.
 * @param {object} props
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
function ModalFooter({ className, children, ...rest }) {
  return (
    <div
      className={clsx(
        'px-6 py-4 border-t border-sand-200 flex items-center justify-end gap-3',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
ModalFooter.displayName = 'Modal.Footer';

Modal.Footer = ModalFooter;
Modal.displayName = 'Modal';

export { Modal };
export default Modal;
