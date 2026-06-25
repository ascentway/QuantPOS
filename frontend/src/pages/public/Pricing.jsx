import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { ANIM_CSS, useReveal, GlowOrb, GradientBadge, CTAStrip, FloatingDots } from './ui';

const PLANS = [
  {
    id: 'starter', name: 'Starter', emoji: '🌱',
    monthly: 499, annual: 4990,
    terminals: 1, members: 'Solo',
    desc: 'Perfect for the solo shopkeeper who wants to modernise without complexity.',
    color: '#00A4A4',
    features: [
      '1 POS Terminal',
      'Up to 500 products',
      'Real-time inventory tracking',
      'Low stock alerts via email',
      'Daily sales report',
      'Owner login with 2FA OTP',
      'Email support (48 h)',
    ],
    cta: 'Get started',
  },
  {
    id: 'growth', name: 'Growth', emoji: '🚀', popular: true,
    monthly: 999, annual: 9990,
    terminals: 3, members: '3 members',
    desc: 'For growing stores with a team. The most popular plan among Indian retailers.',
    color: '#00A4A4',
    features: [
      'Everything in Starter',
      'Up to 3 POS Terminals',
      'Team management (3 members)',
      'Loose product pricing (kg / litre)',
      'Cashier performance reports',
      'Manual AI restocking suggestions',
      'PDF export',
      'Chat support (24 h)',
    ],
    cta: 'Start free trial',
  },
  {
    id: 'professional', name: 'Professional', emoji: '⚡',
    monthly: 1999, annual: 19990,
    terminals: 5, members: '5 members',
    desc: 'For established stores that need automation and full-featured analytics.',
    color: '#00A4A4',
    features: [
      'Everything in Growth',
      'Up to 5 POS Terminals',
      'Refunds & exchange with credit notes',
      'Automatic AI restocking (8 AM & 8 PM)',
      'Hour-by-hour sales analytics',
      'Supplier management + purchase orders',
      'Loyalty points (basic)',
      'Dedicated support (4–8 h)',
    ],
    cta: 'Get started',
  },
  {
    id: 'enterprise', name: 'Enterprise', emoji: '🏢',
    monthly: 4999, annual: 49990,
    terminals: 10, members: 'Unlimited',
    desc: 'For chains, franchises, and multi-location stores that need everything.',
    color: '#10b981',
    features: [
      'Everything in Professional',
      'Up to 10 POS Terminals',
      'Up to 5 locations in one dashboard',
      'Unlimited team members',
      'Loyalty program (branded, tiers)',
      'Gift card & customer database',
      'API access for integrations',
      'White-label option',
      'Phone + dedicated account manager',
    ],
    cta: 'Contact sales',
  },
];

const FAQS = [
  { q: 'Is there a free trial?', a: 'Yes  all plans include a 14-day free trial. No credit card required to get started.' },
  { q: 'Can I change plans anytime?', a: 'Absolutely. Upgrade or downgrade at any time. Billing is prorated so you only pay for what you use.' },
  { q: 'Do prices include GST?', a: 'Prices shown are exclusive of 18% GST, which will be added at checkout. You receive a GST-compliant invoice.' },
  { q: 'What payment methods are accepted?', a: 'We accept UPI, debit/credit cards, and net banking via Razorpay. Annual plans can also be paid via bank transfer.' },
  { q: 'What happens when the trial ends?', a: 'After 14 days you can pick any paid plan. Your data is preserved regardless  no sudden deletions.' },
  { q: 'Are there setup or onboarding fees?', a: 'Zero. You can self-onboard in under 20 minutes with our step-by-step wizard and bulk import tool.' },
  { q: 'Is my data safe?', a: 'Yes. Row-level multi-tenant isolation, BCrypt encryption, 2FA on every login, and full audit trails.' },
];

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);
  useReveal();

  return (
    <PublicLayout fullWidth>
      <style>{ANIM_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16 px-6 qp-grid-bg">
        <GlowOrb color="#00A4A4" size={700} opacity={0.09} top="0" left="50%" blur={140} />
        <FloatingDots count={6} color="#00A4A4" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="qp-reveal">
            <GradientBadge color="#00A4A4">Simple, transparent pricing</GradientBadge>
            <h1 className="font-manrope font-extrabold text-5xl sm:text-7xl text-[var(--text-primary)] tracking-tight leading-none mb-5">
              Pay as you <span className="qp-shimmer-text">grow</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-10 leading-relaxed">
              Start with 1 terminal. Scale to 10+. Same powerful features at every tier.
              No feature-gating, no surprise fees.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="qp-reveal qp-delay-1 inline-flex items-center gap-1 rounded-2xl p-1.5 border border-[var(--border)] bg-[var(--surface)]">
            {['monthly', 'annual'].map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className="relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: billing === b ? '#00A4A4' : 'transparent',
                  color: billing === b ? '#fff' : 'var(--text-muted)',
                  boxShadow: billing === b ? '0 4px 16px rgba(123,57,252,.4)' : 'none',
                }}>
                {b === 'monthly' ? 'Monthly' : (
                  <span className="flex items-center gap-2">
                    Annual
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: billing === 'annual' ? 'rgba(255,255,255,.2)' : 'rgba(16,185,129,.15)', color: billing === 'annual' ? '#fff' : '#10b981' }}>
                      Save 17%
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing cards ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-4">
          {PLANS.map((plan, i) => {
            const price = billing === 'monthly' ? plan.monthly : Math.round(plan.annual / 12);
            return (
              <div key={plan.id}
                className="qp-reveal"
                style={{ transitionDelay: `${i * 0.09}s`, animation: undefined }}>
                <div
                  className={`relative flex flex-col rounded-3xl h-full transition-all duration-300
                    ${plan.popular
                      ? 'border-2 border-accent shadow-2xl shadow-[#00A4A4]/20 mt-4'
                      : 'border border-[var(--border)] hover:border-accent/40 hover:shadow-xl hover:shadow-[#00A4A4]/10 mt-4'}`}
                  style={{ background: 'var(--surface)' }}>

                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#00A4A4] to-transparent" />
                  )}
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-accent text-white text-xs font-extrabold px-4 py-1 rounded-full shadow-lg shadow-[#00A4A4]/40 tracking-wide uppercase">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="p-7 flex flex-col gap-5 flex-1">
                    {/* Plan header */}
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="text-2xl">{plan.emoji}</span>
                        <span className="font-manrope font-extrabold text-lg text-[var(--text-primary)]">{plan.name}</span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{plan.desc}</p>
                    </div>

                    {/* Price */}
                    <div>
                      <div className="flex items-end gap-1.5">
                        <span className="font-manrope font-extrabold text-5xl text-[var(--text-primary)] leading-none">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm text-[var(--text-muted)] mb-1.5">/mo</span>
                      </div>
                      {billing === 'annual' && (
                        <p className="text-xs text-green-500 font-semibold mt-1">
                          ₹{plan.annual.toLocaleString('en-IN')}/year · 17% off
                        </p>
                      )}
                      {billing === 'monthly' && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          ₹{plan.annual.toLocaleString('en-IN')}/year billed annually
                        </p>
                      )}
                    </div>

                    {/* Terminals + Members badges */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: '🖥️', label: `${plan.terminals} Terminal${plan.terminals > 1 ? 's' : ''}` },
                        { icon: '👤', label: plan.members },
                      ].map(b => (
                        <span key={b.label}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
                          {b.icon} {b.label}
                        </span>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[var(--border)]" />

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((feat, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#00A4A4" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link to={plan.id === 'enterprise' ? '/contact' : '/register'}
                      className={`mt-auto block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all duration-200
                        ${plan.popular
                          ? 'qp-btn-primary bg-accent text-white shadow-lg shadow-[#00A4A4]/30'
                          : 'border border-[var(--border)] text-[var(--text-primary)] hover:border-accent hover:text-accent hover:bg-accent/5'}`}>
                      {plan.cta}
                      {plan.popular && ' →'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-8 qp-reveal">
          All plans include 14-day free trial · No credit card required · Cancel anytime · Prices exclusive of 18% GST
        </p>
      </section>

      {/* ── Feature comparison table ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12 qp-reveal">
          <GradientBadge color="#00A4A4">Compare plans</GradientBadge>
          <h2 className="font-manrope font-extrabold text-4xl text-[var(--text-primary)] tracking-tight">
            Full feature breakdown
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--border)] overflow-hidden qp-reveal qp-delay-1">
          {/* Header */}
          <div className="grid grid-cols-5 border-b border-[var(--border)] bg-[var(--surface)]">
            <div className="p-4 text-sm font-semibold text-[var(--text-muted)]">Feature</div>
            {PLANS.map(p => (
              <div key={p.id} className="p-4 text-center">
                <div className="text-base">{p.emoji}</div>
                <div className="text-xs font-bold text-[var(--text-primary)]">{p.name}</div>
              </div>
            ))}
          </div>

          {[
            ['POS Terminal', '1', '3', '5', '10'],
            ['Team members', '1', '3', '5', 'Unlimited'],
            ['Products', '500', 'Unlimited', 'Unlimited', 'Unlimited'],
            ['Inventory tracking', '✓', '✓', '✓', '✓'],
            ['Sales analytics', 'Basic', 'Advanced', 'Hour-level', 'All locations'],
            ['AI restocking', '', 'Manual', 'Auto 2×/day', 'Auto 2×/day'],
            ['Refunds & exchanges', '', '', '✓', '✓'],
            ['Supplier management', '', '', '✓', '✓'],
            ['Loyalty program', '', '', 'Basic', 'Branded tiers'],
            ['API access', '', '', '', '✓'],
            ['Multi-location', '', '', '', 'Up to 5'],
            ['Support', 'Email 48h', 'Chat 24h', 'Dedicated 4-8h', 'Phone + Manager'],
          ].map(([feat, ...vals], idx) => (
            <div key={feat}
              className={`grid grid-cols-5 border-b border-[var(--border)] hover:bg-[var(--surface)]/60 transition-colors ${idx % 2 === 0 ? '' : 'bg-[var(--surface)]/30'}`}>
              <div className="p-4 text-sm text-[var(--text-secondary)] font-medium">{feat}</div>
              {vals.map((v, vi) => (
                <div key={vi} className="p-4 text-center text-sm text-[var(--text-muted)]">
                  {v === '✓' ? <span className="text-accent font-bold text-base">✓</span> :
                    v === '' ? <span className="text-[var(--border)] font-bold"></span> :
                      <span className="font-medium">{v}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="text-center mb-12 qp-reveal">
          <GradientBadge color="#00A4A4">FAQ</GradientBadge>
          <h2 className="font-manrope font-extrabold text-4xl text-[var(--text-primary)] tracking-tight">
            Pricing questions answered
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="qp-reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
              <div
                className={`rounded-2xl border overflow-hidden transition-all duration-200 ${openFaq === i ? 'border-accent/50 shadow-lg shadow-[#00A4A4]/10' : 'border-[var(--border)]'}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left gap-4">
                  <span className="font-manrope font-semibold text-[var(--text-primary)] text-sm sm:text-base">{faq.q}</span>
                  <span className={`w-8 h-8 flex-shrink-0 rounded-full border flex items-center justify-center transition-all duration-300
                    ${openFaq === i ? 'bg-accent border-accent rotate-45' : 'border-[var(--border)]'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 12" stroke={openFaq === i ? '#fff' : 'currentColor'} strokeWidth="2">
                      <path strokeLinecap="round" d="M6 2v8M2 6h8" />
                    </svg>
                  </span>
                </button>
                <div style={{ maxHeight: openFaq === i ? '200px' : '0', overflow: 'hidden', transition: 'max-height .3s ease' }}>
                  <p className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <CTAStrip
        heading="Start your 14-day free trial today"
        sub="No credit card. No commitment. Set up in under 20 minutes."
        primaryLabel="Start for free"
        secondaryLabel="Talk to sales"
        secondaryTo="/contact"
      />
    </PublicLayout>
  );
}
