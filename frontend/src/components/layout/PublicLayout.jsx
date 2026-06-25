import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wordmark } from '../ui/Wordmark';
import useThemeStore from '../../store/themeStore';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  return (
    <button onClick={toggleTheme} aria-label="Toggle theme"
      className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200
                 border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]
                 hover:text-[var(--text-primary)] hover:border-accent/40
                 focus:outline-none focus:ring-2 focus:ring-accent/40">
      {isDark ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/><path strokeLinecap="round" strokeLinejoin="round"
            d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
        </svg>
      )}
    </button>
  );
};

const NAV_LINKS = [
  { label: 'Features',     href: '/features' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'About',        href: '/about' },
];

const PublicNav = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl shadow-sm'
          : 'border-b border-transparent bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + nav */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Wordmark size={24} />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => {
              const active = location.pathname === href;
              return (
                <Link key={href} to={href}
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'text-[var(--text-primary)] bg-[var(--surface)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                  }`}>
                  {label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <Link to="/login"
            className="hidden sm:flex items-center text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                       transition-colors px-4 py-2 rounded-lg border border-[var(--border)] hover:border-accent/40 hover:bg-[var(--surface)]">
            Sign in
          </Link>
          <ThemeToggle />
          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu">
            {mobileOpen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-xl px-6 py-4 space-y-1"
          style={{ animation: 'qp-fade-up .2s cubic-bezier(.22,1,.36,1) both' }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={href} to={href}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === href
                  ? 'bg-accent/10 text-accent'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
              }`}>
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[var(--border)]">
            <Link to="/login"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:border-accent transition-all">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features',     href: '/features' },
      { label: 'Pricing',      href: '/pricing' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Changelog',    href: '/changelog' },
      { label: 'Status',       href: '/status' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',     href: '/about' },
      { label: 'Blog',      href: '/blog' },
      { label: 'Careers',   href: '/careers' },
      { label: 'Press Kit', href: '/press-kit' },
      { label: 'Contact',   href: '/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy',   href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Cookie Policy',    href: '/cookie-policy' },
      { label: 'GDPR',             href: '/gdpr' },
    ],
  },
];

const PublicFooter = () => (
  <footer className="w-full border-t border-[var(--border)] bg-[var(--bg)]">
    <div className="max-w-7xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 md:grid-cols-5 gap-12">
      {/* Brand */}
      <div className="md:col-span-2 space-y-4">
        <Wordmark size={26} />
        <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[240px]">
          Cloud-native POS and inventory management for retail &amp; F&amp;B businesses across India.
          AI-powered. Built for scale.
        </p>
        <div className="flex items-center gap-2.5 pt-1">
          {[
            { label: 'X (Twitter)', href: 'https://x.com', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z' },
            { label: 'LinkedIn', href: 'https://linkedin.com', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z' },
          ].map(({ label, href, path }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)]
                         text-[var(--text-muted)] hover:text-accent hover:border-accent/40
                         transition-all duration-150">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d={path}/>
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* Link columns */}
      {FOOTER_COLS.map(({ heading, links }) => (
        <div key={heading}>
          <h4 className="text-xs font-extrabold text-[var(--text-primary)] mb-4 uppercase tracking-widest font-manrope">
            {heading}
          </h4>
          <ul className="space-y-3">
            {links.map(({ label, href }) => (
              <li key={label}>
                <Link to={href}
                  className="text-sm text-[var(--text-muted)] hover:text-accent transition-colors duration-150">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    {/* Bottom bar */}
    <div className="border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-muted)] font-inter">
          © 2026 QuantPOS · All rights reserved · Made in India 🇮🇳
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-[var(--text-muted)] font-inter">All systems operational</span>
          </div>
          <Link to="/privacy-policy" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
          <Link to="/terms-of-service" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Terms</Link>
        </div>
      </div>
    </div>
  </footer>
);

/**
 * Shared layout for all public-facing marketing pages.
 * Includes: sticky nav with dark/light toggle, mobile menu, main content, full footer.
 */
const PublicLayout = ({ children, fullWidth = false }) => {
  const { initTheme } = useThemeStore();
  useEffect(() => { initTheme(); }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <PublicNav />
      <main className={`flex-1 ${fullWidth ? '' : 'max-w-7xl mx-auto w-full px-6'}`}>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
