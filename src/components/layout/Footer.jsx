/**
 * Footer — Minimalist footer for Ilm Essentials LMS
 *
 * Sections:
 * - Bismillah banner (Arabic, gold)
 * - 3-column grid: Logo + tagline | Quick links | Contact
 * - Copyright bar
 *
 * TODO: Replace static links with dynamic footer config from backend
 */

import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';

import logoWhite from '../../assets/logo-white.png';

/** Quick navigation links */
const quickLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/library', label: 'e-Library' },
];

export default function Footer() {
  return (
    <footer className="bg-primary-950 text-sand-200">
      {/* ── Main content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Column 1 — Brand */}
          <div className="space-y-1.5">
            <Link to="/dashboard" className="inline-block" aria-label="ilm essentials Home">
              <img
                src={logoWhite}
                alt="ilm essentials"
                className="h-7 sm:h-8 w-auto object-contain opacity-95"
              />
            </Link>
            <p className="text-xs sm:text-sm text-sand-300 max-w-xs leading-normal">
              Structured path to divine knowledge
            </p>
          </div>

          {/* Column 2 — Quick links */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white tracking-wide uppercase mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-sand-300 hover:text-gold-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Contact */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white tracking-wide uppercase mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@ilmessentials.pk"
                  className="flex items-center gap-2 text-sm text-sand-300 hover:text-gold-400 transition-colors duration-200"
                >
                  <Mail size={16} className="flex-shrink-0 text-gold-500" />
                  contact@ilmessentials.pk
                </a>
              </li>
              <li>
                <a
                  href="https://share.google/voveRAVDsZheyiKpe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-sm text-sand-300 hover:text-gold-400 transition-colors duration-200 group"
                  title="Open location in Google Maps"
                >
                  <MapPin size={16} className="flex-shrink-0 text-gold-500 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:underline">DHA Phase 6, Lahore</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-primary-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-sand-400">
            © {new Date().getFullYear()} ILM Essentials. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
