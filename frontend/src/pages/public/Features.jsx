import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { ANIM_CSS, useReveal, GlowOrb, GradientBadge, GlassCard, CTAStrip, FloatingDots } from './ui';

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: '🖥️', category: 'POS Terminal', accent: '#7b39fc',
    title: 'Lightning-fast checkout, anywhere',
    description: 'Scan products, apply discounts and taxes, print thermal receipts, and close sales in seconds — even on basic hardware. Built for the pace of Indian retail.',
    highlights: ['Barcode & manual search', 'Configurable GST tax rates', 'Thermal receipt printing', 'Offline-ready design'],
    plans: ['Starter', 'Growth', 'Professional', 'Enterprise'],
    mockup: 'pos',
  },
  {
    icon: '📦', category: 'Inventory', accent: '#0ea5e9',
    title: 'Real-time stock intelligence',
    description: 'Track every unit, from kg of sugar to individual SKUs. Set reorder levels, get low-stock alerts, and manage loose products with decimal precision.',
    highlights: ['Decimal quantity (0.457 kg)', 'Low stock email alerts', 'Inventory adjustment audit trail', 'Supplier management'],
    plans: ['Starter', 'Growth', 'Professional', 'Enterprise'],
    mockup: 'inventory',
  },
  {
    icon: '📊', category: 'Analytics', accent: '#10b981',
    title: 'Reports that drive decisions',
    description: 'From daily revenue summaries to hour-by-hour peak analysis — understand your business at a glance. Export to PDF or Excel in one click.',
    highlights: ['Hour-by-hour traffic analysis', 'Cashier performance reports', 'Product profitability view', 'PDF & Excel export'],
    plans: ['Growth', 'Professional', 'Enterprise'],
    mockup: 'analytics',
  },
  {
    icon: '👥', category: 'Team Management', accent: '#f59e0b',
    title: 'Manage your team with confidence',
    description: 'Invite cashiers and managers via OTP. Assign roles, set permissions, and track who did what — with a full audit log including IP addresses.',
    highlights: ['Owner / Manager / Cashier roles', 'OTP-based invitations', 'Cashier-only POS access', 'Activity log with timestamps'],
    plans: ['Growth', 'Professional', 'Enterprise'],
    mockup: 'team',
  },
  {
    icon: '🤖', category: 'AI Restocking', accent: '#ec4899', badge: 'AI-Powered',
    title: 'Never run out of stock again',
    description: 'QuantPOS\'s AI analyses your 30+ days of sales, detects seasonal patterns, and generates prioritised purchase order suggestions — automatically, twice a day.',
    highlights: ['8 AM & 8 PM daily recommendations', '7/14/30-day demand forecasting', 'Urgency levels (Red/Yellow/Green)', 'One-click PO to supplier email'],
    plans: ['Professional', 'Enterprise'],
    mockup: 'ai',
  },
  {
    icon: '🏪', category: 'Multi-Location', accent: '#06b6d4',
    title: 'One dashboard, every location',
    description: 'Run up to 5 locations from a single QuantPOS account. Consolidated reporting, shared inventory visibility, and location-wise user access control.',
    highlights: ['Cross-location analytics', 'Inventory transfer between stores', 'Location-wise access roles', 'Franchise performance comparison'],
    plans: ['Enterprise'],
    mockup: 'multiloc',
  },
  {
    icon: '🔒', category: 'Security', accent: '#6366f1',
    title: 'Enterprise-grade security, out of the box',
    description: 'Two-factor authentication on every login, encrypted tokens, IP-level audit logs, and multi-tenant data isolation ensure your business data is always protected.',
    highlights: ['2FA email OTP on every login', 'Row-level data isolation', 'Full audit trail with IP tracking', 'HTTPS & encrypted token storage'],
    plans: ['Starter', 'Growth', 'Professional', 'Enterprise'],
    mockup: 'security',
  },
];

const STATS = [
  { value: '₹499', label: 'Starting price', sub: 'Less than ₹17/day' },
  { value: '99.9%', label: 'Uptime SLA', sub: 'Production infra' },
  { value: '2FA', label: 'Every login', sub: 'Email OTP always on' },
  { value: '<100ms', label: 'Response time', sub: 'Optimised for India' },
];

/* ─── Animated mock-UI panels ───────────────────────────────────────────────── */
const MockupPanel = ({ type, accent }) => {
  const mockups = {
    pos: (
      <div className="h-full flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">POS Terminal</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">● Live</span>
        </div>
        <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col gap-2">
          {[['Basmati Rice 5kg', '₹320'], ['Amul Butter 500g', '₹285'], ['Parle-G Biscuit', '₹10']].map(([n, p]) => (
            <div key={n} className="flex items-center justify-between text-xs">
              <span className="text-white/80">{n}</span>
              <span className="font-bold text-white">{p}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {['UPI', 'Cash', 'Card'].map(m => (
            <button key={m} className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: m === 'UPI' ? accent : 'rgba(255,255,255,.08)', color: m === 'UPI' ? '#fff' : 'rgba(255,255,255,.5)' }}>
              {m}
            </button>
          ))}
        </div>
        <div className="rounded-xl py-2.5 text-center text-sm font-bold text-white" style={{ background: accent }}>
          Collect ₹615 →
        </div>
      </div>
    ),
    inventory: (
      <div className="h-full flex flex-col gap-3 p-4">
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Stock Levels</span>
        {[
          { name: 'Amul Milk 1L', qty: 42, max: 100, color: '#10b981' },
          { name: 'Sunflower Oil 1L', qty: 8, max: 50, color: '#f59e0b' },
          { name: 'Toor Dal 1kg', qty: 3, max: 80, color: '#ef4444' },
          { name: 'Besan 500g', qty: 61, max: 100, color: '#10b981' },
        ].map(item => (
          <div key={item.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/80">{item.name}</span>
              <span className="font-bold" style={{ color: item.color }}>{item.qty} units</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all" style={{ width: `${(item.qty / item.max) * 100}%`, background: item.color }} />
            </div>
          </div>
        ))}
        <div className="mt-auto rounded-xl bg-red-500/15 border border-red-500/20 p-2 text-xs text-red-400 font-semibold flex items-center gap-2">
          <span>⚠</span> 1 item critically low — reorder now
        </div>
      </div>
    ),
    analytics: (
      <div className="h-full flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Revenue — 7 days</span>
          <span className="text-xs font-bold text-green-400">+18.4%</span>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {[38, 55, 42, 70, 52, 88, 65].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md transition-all" style={{ height: `${h}%`, background: i === 5 ? accent : `${accent}40` }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[['Today', '₹18,450'], ['This Week', '₹1,24,800']].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-white/5 p-2.5 text-center">
              <div className="text-xs text-white/50 mb-0.5">{l}</div>
              <div className="font-bold text-sm text-white">{v}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    team: (
      <div className="h-full flex flex-col gap-3 p-4">
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Team Members</span>
        {[
          { name: 'Rajesh (Owner)', role: 'Owner', color: '#7b39fc', online: true },
          { name: 'Priya Sharma', role: 'Manager', color: '#10b981', online: true },
          { name: 'Amit Kumar', role: 'Cashier', color: '#f59e0b', online: false },
        ].map(m => (
          <div key={m.name} className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: m.color }}>
              {m.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{m.name}</div>
              <div className="text-xs text-white/40">{m.role}</div>
            </div>
            <span className={`w-2 h-2 rounded-full ${m.online ? 'bg-green-400' : 'bg-white/20'}`} />
          </div>
        ))}
      </div>
    ),
    ai: (
      <div className="h-full flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
          <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">AI Restocking Agent</span>
        </div>
        {[
          { name: 'Sunflower Oil 1L', urgency: 'Critical', color: '#ef4444', qty: '40 units' },
          { name: 'Bread 400g', urgency: 'Soon', color: '#f59e0b', qty: '24 units' },
          { name: 'Lays Chips 50g', urgency: 'Plan', color: '#10b981', qty: '12 units' },
        ].map(item => (
          <div key={item.name} className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/80 font-semibold">{item.name}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${item.color}20`, color: item.color }}>{item.urgency}</span>
            </div>
            <div className="text-xs text-white/40">Suggested: {item.qty}</div>
          </div>
        ))}
        <div className="mt-auto rounded-xl py-2 text-center text-xs font-bold text-white" style={{ background: accent }}>
          Approve All → Send POs
        </div>
      </div>
    ),
    multiloc: (
      <div className="h-full flex flex-col gap-3 p-4">
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Locations Overview</span>
        {[
          { name: 'Main Branch — Andheri', rev: '₹84,200', status: 'green' },
          { name: 'Branch 2 — Bandra', rev: '₹61,500', status: 'green' },
          { name: 'Branch 3 — Juhu', rev: '₹43,100', status: 'yellow' },
        ].map(loc => (
          <div key={loc.name} className="rounded-xl bg-white/5 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80 font-semibold">{loc.name}</span>
              <span className="text-xs font-bold text-white">{loc.rev}</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: '70%', background: accent }} />
            </div>
          </div>
        ))}
      </div>
    ),
    security: (
      <div className="h-full flex flex-col gap-3 p-4">
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Security Events</span>
        {[
          { event: 'Login via 2FA OTP', time: '2 min ago', ok: true },
          { event: 'Password changed', time: '1 hr ago', ok: true },
          { event: 'Failed login attempt', time: '3 hr ago', ok: false },
        ].map(e => (
          <div key={e.event} className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${e.ok ? 'bg-green-400' : 'bg-red-400'}`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/80 font-semibold">{e.event}</div>
              <div className="text-xs text-white/40">{e.time}</div>
            </div>
          </div>
        ))}
        <div className="mt-auto rounded-xl bg-green-500/10 border border-green-500/20 p-2 text-xs text-green-400 font-semibold flex items-center gap-2">
          <span>🔒</span> All systems secure
        </div>
      </div>
    ),
  };
  return mockups[type] || null;
};

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function Features() {
  const [activeTab, setActiveTab] = useState(0);
  useReveal();

  return (
    <PublicLayout fullWidth>
      <style>{ANIM_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-6 qp-grid-bg">
        <GlowOrb color="#7b39fc" size={600} opacity={0.1} top="0" left="50%" blur={120} />
        <GlowOrb color="#0ea5e9" size={400} opacity={0.07} top="40%" left="80%" blur={100} />
        <FloatingDots count={8} color="#7b39fc" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="qp-reveal">
            <GradientBadge color="#7b39fc">Built for Indian Retail</GradientBadge>
            <h1 className="font-manrope font-extrabold text-5xl sm:text-7xl text-[var(--text-primary)] tracking-tight leading-none mb-6">
              Every tool your store{' '}
              <span className="qp-shimmer-text">needs to grow</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
              From solo shopkeeper to multi-location chain — QuantPOS scales with you.
              No feature-gating, no hidden add-ons.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center qp-reveal qp-delay-2">
            <Link to="/register"
              className="qp-btn-primary inline-flex items-center justify-center gap-2.5 bg-[#7b39fc] text-white font-bold px-8 py-4 rounded-xl text-base shadow-2xl shadow-[#7b39fc]/30">
              Start free trial
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center justify-center gap-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold px-8 py-4 rounded-xl text-base hover:bg-[var(--surface)] transition-all">
              View pricing
            </Link>
          </div>
        </div>

        {/* Floating stat pills */}
        <div className="relative z-10 max-w-5xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 qp-reveal qp-delay-3">
          {STATS.map(s => (
            <div key={s.value}
              className="qp-card-hover qp-glass rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-5 text-center">
              <div className="font-manrope font-extrabold text-2xl sm:text-3xl text-[#7b39fc] mb-1">{s.value}</div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">{s.label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature navigator tabs ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12 qp-reveal">
          <GradientBadge color="#7b39fc">Full Feature Suite</GradientBadge>
          <h2 className="font-manrope font-extrabold text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight mb-4">
            Everything in one place
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Click any feature to explore what's possible.
          </p>
        </div>

        {/* Tab strip */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 qp-reveal qp-delay-1">
          {FEATURES.map((f, i) => (
            <button key={f.category}
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: activeTab === i ? f.accent : 'transparent',
                color: activeTab === i ? '#fff' : 'var(--text-muted)',
                border: `1.5px solid ${activeTab === i ? f.accent : 'var(--border)'}`,
                boxShadow: activeTab === i ? `0 4px 20px ${f.accent}40` : 'none',
              }}>
              <span className="text-base">{f.icon}</span>
              {f.category}
              {f.badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20">AI</span>}
            </button>
          ))}
        </div>

        {/* Active feature panel */}
        {FEATURES.map((f, i) => i === activeTab && (
          <div key={f.category}
            className="grid md:grid-cols-2 gap-8 items-center"
            style={{ animation: 'qp-fade-up .4s cubic-bezier(.22,1,.36,1) both' }}>
            {/* Left: description */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5"
                style={{ background: `${f.accent}15`, border: `1px solid ${f.accent}30` }}>
                <span className="text-lg">{f.icon}</span>
                <span className="text-xs font-bold uppercase tracking-widest font-manrope" style={{ color: f.accent }}>{f.category}</span>
                {f.badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: f.accent }}>{f.badge}</span>}
              </div>
              <h3 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[var(--text-primary)] mb-4 leading-tight">
                {f.title}
              </h3>
              <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-8">{f.description}</p>
              <ul className="space-y-3 mb-8">
                {f.highlights.map(h => (
                  <li key={h} className="flex items-center gap-3 text-[var(--text-secondary)]">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${f.accent}18` }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={f.accent} strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium">{h}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--text-muted)] font-medium">Available on:</span>
                {f.plans.map(plan => (
                  <span key={plan} className="text-xs font-bold px-3 py-1 rounded-full border"
                    style={{ borderColor: `${f.accent}40`, color: f.accent, background: `${f.accent}10` }}>
                    {plan}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: animated mockup */}
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl opacity-20 blur-2xl"
                style={{ background: f.accent, transform: 'scale(.85) translateY(10%)' }} />
              <div className="relative rounded-3xl overflow-hidden border border-white/10 h-72 sm:h-80"
                style={{ background: `linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)`, boxShadow: `0 32px 80px ${f.accent}25` }}>
                <MockupPanel type={f.mockup} accent={f.accent} />
              </div>
              {/* corner glow */}
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full opacity-30"
                style={{ background: f.accent, filter: 'blur(30px)' }} />
            </div>
          </div>
        ))}
      </section>

      {/* ── Comparison grid ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="qp-reveal text-center mb-12">
          <GradientBadge color="#10b981">Why Switch</GradientBadge>
          <h2 className="font-manrope font-extrabold text-4xl text-[var(--text-primary)] tracking-tight mb-4">
            QuantPOS vs. Legacy POS
          </h2>
        </div>
        <div className="overflow-x-auto qp-reveal qp-delay-1">
          <table className="w-full rounded-2xl overflow-hidden border border-[var(--border)] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                <th className="text-left p-4 font-semibold text-[var(--text-muted)]">Feature</th>
                <th className="p-4 font-semibold text-[var(--text-muted)] text-center">Legacy POS</th>
                <th className="p-4 font-bold text-[#7b39fc] text-center">QuantPOS</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Setup cost', '₹80,000+', '₹0'],
                ['Monthly fee', '₹2,000+', 'From ₹499'],
                ['Hardware required', 'Yes', 'No'],
                ['AI restocking', '✗', '✓'],
                ['Real-time sync', 'Partial', 'Always'],
                ['Multi-device access', 'No', 'Yes'],
                ['Contract', '1–3 years', 'Month-to-month'],
                ['24/7 support', 'Paid extra', 'Included'],
              ].map(([feat, leg, qp], idx) => (
                <tr key={feat} className={`border-b border-[var(--border)] transition-colors hover:bg-[var(--surface)] ${idx % 2 === 0 ? '' : 'bg-[var(--surface)]/40'}`}>
                  <td className="p-4 font-medium text-[var(--text-secondary)]">{feat}</td>
                  <td className="p-4 text-center text-[var(--text-muted)]">{leg}</td>
                  <td className="p-4 text-center font-bold text-[#7b39fc]">{qp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <CTAStrip
        heading="Ready to transform your store?"
        sub="Join hundreds of Indian retailers already using QuantPOS. Start free, no credit card required."
        primaryLabel="Start 14-day free trial"
        secondaryLabel="View pricing"
        secondaryTo="/pricing"
      />
    </PublicLayout>
  );
}
