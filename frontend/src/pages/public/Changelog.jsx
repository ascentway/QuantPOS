import React from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import { ANIM_CSS, useReveal, GlowOrb, GradientBadge } from './ui';

const RELEASES = [
  {
    version: 'Milestone 4', date: 'In Progress', type: 'feature',
    title: 'Multi-location Dashboard & Enterprise Features',
    items: [
      { tag: 'new', text: 'Multi-location branch support  manage inventory and staff across multiple shops' },
      { tag: 'new', text: 'Stock transfer system  transfer products between branches with full auditing' },
      { tag: 'new', text: 'API integration  connect third-party billing and accounting software' },
      { tag: 'improved', text: 'Branded customer loyalty program and digital gift cards' },
    ],
  },
  {
    version: 'Milestone 3', date: 'Beta Testing', type: 'feature',
    title: 'AI Restocking Agent & Advanced Inventory',
    items: [
      { tag: 'new', text: 'Demand forecasting  time-series prediction based on seasonal sales velocity' },
      { tag: 'new', text: 'Automated PO generation  automatic supplier purchase orders generated at 8 AM and 8 PM' },
      { tag: 'new', text: 'Supplier management  central database of suppliers, purchase logs, and payments' },
      { tag: 'improved', text: 'Urgency levels  critical alert status for items nearing stockout thresholds' },
    ],
  },
  {
    version: 'Milestone 2', date: 'Completed', type: 'launch',
    title: 'POS Terminal & India-Specific Billing',
    items: [
      { tag: 'new', text: 'Web POS Terminal  browser-based fast checkout cart with barcode scanner search' },
      { tag: 'new', text: 'GST invoices  print thermal receipts with clean tax rates, HSN codes, and store GSTIN' },
      { tag: 'new', text: 'UPI & Multi-mode payments  accept cash, card, and QR-code UPI transactions natively' },
      { tag: 'improved', text: 'Decimal product units  support loose products priced by kg, litre, or custom units' },
    ],
  },
  {
    version: 'Milestone 1', date: 'Completed', type: 'launch',
    title: 'Platform Infrastructure & Tenant Security',
    items: [
      { tag: 'new', text: 'Multi-tenant isolation  secure row-level data isolation for every business' },
      { tag: 'new', text: 'Secure 2FA OTP logins  passwordless auth via secure email verification tokens' },
      { tag: 'new', text: 'Role-Based Access Control  separate permissions for Owner, Manager, and Cashier' },
      { tag: 'new', text: 'Security Auditing  full tracking of system logins, edits, and cashier actions' },
    ],
  },
];

const tagConfig = {
  new: { color: '#00A4A4', bg: 'rgba(123,57,252,.12)', label: 'New' },
  improved: { color: '#10b981', bg: 'rgba(16,185,129,.12)', label: 'Improved' },
  fixed: { color: '#f59e0b', bg: 'rgba(245,158,11,.12)', label: 'Fixed' },
  removed: { color: '#ef4444', bg: 'rgba(239,68,68,.12)', label: 'Removed' },
};

const typeConfig = {
  feature: { color: '#00A4A4', emoji: '⚙️', label: 'Future Release' },
  launch: { color: '#10b981', emoji: '✅', label: 'Completed' },
  patch: { color: '#00A4A4', emoji: '🛠️', label: 'Patch' },
};

export default function Changelog() {
  useReveal();

  return (
    <PublicLayout fullWidth>
      <style>{ANIM_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16 px-6 qp-grid-bg">
        <GlowOrb color="#00A4A4" size={500} opacity={0.09} top="0" left="50%" blur={100} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="qp-reveal">
            <GradientBadge color="#00A4A4">Project Progress</GradientBadge>
            <h1 className="font-manrope font-extrabold text-5xl sm:text-6xl text-[var(--text-primary)] tracking-tight leading-none mb-5">
              Changelog
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Track our development milestones as we build the future of Indian retail.
              Here is what has been built and what is coming next.
            </p>
          </div>
        </div>
      </section>

      {/* ── Timeline ──────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-16 pb-28">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[17px] top-4 bottom-4 w-px hidden sm:block"
            style={{ background: 'linear-gradient(180deg, #00A4A440 0%, transparent 100%)' }} />

          <div className="space-y-10">
            {RELEASES.map((rel, i) => {
              const type = typeConfig[rel.type];
              return (
                <div key={rel.version}
                  className="qp-reveal relative"
                  style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="sm:pl-12">
                    {/* Dot */}
                    <div className="absolute left-0 top-1 w-9 h-9 rounded-full hidden sm:flex items-center justify-center text-xl border-4 border-[var(--bg)]"
                      style={{ background: `${type.color}20` }}>
                      <span className="text-sm">{type.emoji}</span>
                    </div>

                    {/* Card */}
                    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                      {/* Top accent */}
                      <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${type.color}, transparent)` }} />

                      <div className="p-7">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-manrope font-extrabold text-2xl text-[var(--text-primary)]">{rel.version}</span>
                            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${type.color}15`, color: type.color }}>
                              {type.label}
                            </span>
                          </div>
                          <span className="text-sm text-[var(--text-muted)]">{rel.date}</span>
                        </div>

                        <h3 className="font-manrope font-extrabold text-lg text-[var(--text-primary)] mb-5 leading-tight">
                          {rel.title}
                        </h3>

                        {/* Items */}
                        <ul className="space-y-3">
                          {rel.items.map((item, j) => {
                            const t = tagConfig[item.tag];
                            return (
                              <li key={j} className="flex items-start gap-3">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 whitespace-nowrap"
                                  style={{ background: t.bg, color: t.color }}>
                                  {t.label}
                                </span>
                                <span className="text-sm text-[var(--text-muted)] leading-relaxed">{item.text}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-14 text-center qp-reveal">
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Subscribe to changelog updates via email
          </p>
          <a href="mailto:quantpos@gmail.com?subject=Subscribe to changelog"
            className="inline-flex items-center gap-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold px-6 py-3 rounded-xl hover:border-accent hover:text-accent transition-all text-sm">
            Subscribe to updates →
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
