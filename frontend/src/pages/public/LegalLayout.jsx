import React from 'react';
import PublicLayout from '../../components/layout/PublicLayout';

/* Shared layout component for legal pages */
export const LegalLayout = ({ title, lastUpdated, effectiveDate, children }) => (
  <PublicLayout fullWidth>
    <div className="max-w-3xl mx-auto px-6 pt-16 pb-24">
      {/* Header */}
      <div className="mb-10 pb-8 border-b border-[var(--border)]">
        <div className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1 mb-5">
          <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Legal Document</span>
        </div>
        <h1 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[var(--text-primary)] tracking-tight mb-3">
          {title}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
          {effectiveDate && <span>Effective: {effectiveDate}</span>}
          {lastUpdated && <span>Last updated: {lastUpdated}</span>}
        </div>
        <div className="mt-4 p-4 rounded-xl bg-[#7b39fc]/05 border border-[#7b39fc]/15 text-sm text-[var(--text-secondary)] leading-relaxed">
          This document governs your use of QuantPOS. Please read it carefully. If you have questions, contact{' '}
          <a href="mailto:quantpos@gmail.com" className="text-[#7b39fc] hover:underline font-medium">quantpos@gmail.com</a>.
        </div>
      </div>

      {/* Content */}
      <div className="prose-legal">{children}</div>
    </div>
  </PublicLayout>
);

export const Section = ({ id, title, children }) => (
  <section id={id} className="mb-8">
    <h2 className="font-manrope font-bold text-lg text-[var(--text-primary)] mb-3 flex items-center gap-2">
      <span className="w-1 h-5 rounded-full bg-[#7b39fc] flex-shrink-0" />
      {title}
    </h2>
    <div className="text-sm text-[var(--text-secondary)] leading-relaxed space-y-3">{children}</div>
  </section>
);

export const P = ({ children }) => <p className="leading-relaxed">{children}</p>;
export const UL = ({ items }) => (
  <ul className="space-y-1.5 pl-4">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#7b39fc] flex-shrink-0 mt-2" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);
export const HighlightBox = ({ children }) => (
  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-secondary)] leading-relaxed">
    {children}
  </div>
);
