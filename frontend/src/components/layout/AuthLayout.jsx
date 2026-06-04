import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../ui/Wordmark';
import useThemeStore from '../../store/themeStore';

// ── Theme Toggle Button ───────────────────────────────────────────────────────
const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200
                 bg-[var(--border)] hover:bg-[var(--border-strong)] text-[var(--text-secondary)]
                 hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#7b39fc]/40"
    >
      {isDark ? (
        // Sun icon — shown in dark mode to switch to light
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        // Moon icon — shown in light mode to switch to dark
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
        </svg>
      )}
    </button>
  );
};

// ── Auth Footer ───────────────────────────────────────────────────────────────
const AuthFooter = () => (
  <footer className="w-full border-t border-[var(--border)] bg-[var(--bg)]">
    {/* Top footer grid — logo + columns */}
    <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-10">
      {/* Brand */}
      <div className="space-y-4">
        <Wordmark size={28} />
        <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[180px]">
          Cloud-native POS and inventory management for retail &amp; F&amp;B businesses across India.
        </p>
        <div className="flex items-center gap-3 pt-1">
          {/* X / Twitter */}
          <a href="https://x.com" target="_blank" rel="noreferrer"
            aria-label="Follow us on X"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)]
                       text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]
                       transition-all duration-150">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
          </a>
          {/* LinkedIn */}
          <a href="https://linkedin.com" target="_blank" rel="noreferrer"
            aria-label="Follow us on LinkedIn"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)]
                       text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]
                       transition-all duration-150">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </a>
          {/* YouTube */}
          <a href="https://youtube.com" target="_blank" rel="noreferrer"
            aria-label="Watch on YouTube"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)]
                       text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]
                       transition-all duration-150">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C16.2 5 12 5 12 5s-4.2 0-6.9.1c-.4.1-1.3.1-2.1.9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.3.8C6.8 19 12 19 12 19s4.2 0 6.9-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 15V9l5.5 3-5.5 3z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Product links */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 font-manrope">Product</h4>
        <ul className="space-y-2.5">
          {['Features', 'Pricing', 'How It Works', 'Changelog', 'Status'].map(item => (
            <li key={item}>
              <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[#7b39fc] transition-colors duration-150">
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Company links */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 font-manrope">Company</h4>
        <ul className="space-y-2.5">
          {['About', 'Blog', 'Careers', 'Press Kit', 'Contact'].map(item => (
            <li key={item}>
              <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[#7b39fc] transition-colors duration-150">
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Legal links */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 font-manrope">Legal</h4>
        <ul className="space-y-2.5">
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map(item => (
            <li key={item}>
              <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[#7b39fc] transition-colors duration-150">
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-muted)] font-inter">
          © 2026 QuantPOS Technologies Inc. · Built for Indian retail.
        </p>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-[var(--text-muted)] font-inter">All systems operational</span>
        </div>
      </div>
    </div>
  </footer>
);

// ── Main AuthLayout ───────────────────────────────────────────────────────────
/**
 * Wraps all auth pages (login, register, verify-email, forgot/reset password)
 * with a consistent layout: sticky top bar with theme toggle, centred content area,
 * and the full marketing footer.
 */
const AuthLayout = ({ children, maxWidth = 'max-w-md' }) => {
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">

      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Wordmark size={24} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg
                         bg-[#7b39fc] hover:bg-[#6929e8] text-white transition-colors duration-150"
            >
              Get started
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="flex-1 flex items-start justify-center py-12 px-4 sm:px-6">
        <div className={`w-full ${maxWidth}`}>
          {children}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <AuthFooter />
    </div>
  );
};

export default AuthLayout;
