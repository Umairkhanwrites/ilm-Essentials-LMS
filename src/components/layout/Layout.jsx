/**
 * Layout — Page wrapper component for Ilm Essentials LMS
 *
 * Renders Navbar, main content area, and Footer.
 * Accepts optional props to hide nav/footer or enable full-width mode.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} [props.hideNav=false] - Hide the top navbar
 * @param {boolean} [props.hideFooter=false] - Hide the footer
 * @param {boolean} [props.fullWidth=false] - Remove max-width constraint on content
 *
 * TODO: Add breadcrumb support via context
 * TODO: Add route-based page transition animations
 */

import clsx from 'clsx';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children, hideNav = false, hideFooter = false, fullWidth = false }) {
  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      {/* ── Navbar ── */}
      {!hideNav && <Navbar />}

      {/* ── Main content ── */}
      <main
        className={clsx(
          'flex-1',
          !fullWidth ? 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8' : 'w-full'
        )}
      >
        {children}
      </main>

      {/* ── Footer ── */}
      {!hideFooter && <Footer />}
    </div>
  );
}
