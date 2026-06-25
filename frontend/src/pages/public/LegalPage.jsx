import React from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import { ANIM_CSS, useReveal, GlowOrb, GradientBadge } from './ui';

/**
 * LegalPage  premium wrapper for all legal documents.
 * Usage: <LegalPage title="Privacy Policy" badge="Privacy" updated="June 4, 2026" toc={[...]} accentColor="#00A4A4">
 *   <section>...</section>
 * </LegalPage>
 */
export default function LegalPage({ title, badge, updated, accentColor = '#00A4A4', toc = [], children }) {
  useReveal();

  return (
    <PublicLayout fullWidth>
      <style>{ANIM_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-12 px-6 qp-grid-bg">
        <GlowOrb color={accentColor} size={400} opacity={0.08} top="0" left="50%" blur={80} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="qp-reveal">
            <GradientBadge color={accentColor}>{badge}</GradientBadge>
            <h1 className="font-manrope font-extrabold text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight mb-3">
              {title}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Last updated: <strong>{updated}</strong> · QuantPOS Technologies Inc.
            </p>
          </div>
        </div>
      </section>

      {/* ── Body: ToC sidebar + content ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14 pb-28 grid lg:grid-cols-4 gap-10">
        {/* Sticky Table of contents */}
        {toc.length > 0 && (
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 qp-reveal">
              <h3 className="font-manrope font-bold text-sm text-[var(--text-primary)] mb-4 uppercase tracking-wider">Contents</h3>
              <ul className="space-y-2">
                {toc.map(({ id, label }) => (
                  <li key={id}>
                    <a href={`#${id}`}
                      className="block text-sm text-[var(--text-muted)] hover:text-accent transition-colors py-1 leading-snug">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className={`qp-reveal ${toc.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="prose prose-lg max-w-none
            prose-headings:font-manrope prose-headings:font-extrabold prose-headings:text-[var(--text-primary)]
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:scroll-mt-24
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed prose-p:text-sm prose-p:mb-4
            prose-li:text-[var(--text-secondary)] prose-li:text-sm prose-li:mb-1
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[var(--text-primary)] prose-strong:font-semibold">
            {children}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
