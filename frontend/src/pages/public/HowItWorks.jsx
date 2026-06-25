import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { ANIM_CSS, useReveal, GlowOrb, GradientBadge, CTAStrip, FloatingDots } from './ui';

const STEPS = [
  {
    number: '01',
    icon: '✍️',
    title: 'Create your account',
    subtitle: '5 minutes',
    desc: 'Register with your business name, email, and type. Verify your email with an OTP. No credit card needed  your 14-day trial starts instantly.',
    details: ['Business details form', 'Email OTP verification', '2FA activated from day 1', 'Full platform access immediately'],
    color: '#00A4A4',
  },
  {
    number: '02',
    icon: '📦',
    title: 'Add products & terminals',
    subtitle: '10–15 minutes',
    desc: 'Import your product catalogue from Excel in one click or add products manually. Assign POS terminals to cashiers. Set GST rates once and forget.',
    details: ['Bulk Excel / CSV import', 'Manual product entry', 'GST rate configuration', 'Terminal assignment to staff'],
    color: '#00A4A4',
  },
  {
    number: '03',
    icon: '💸',
    title: 'Process your first sale',
    subtitle: 'Day 1',
    desc: 'Open the POS terminal, search or scan a product, add it to cart, select the payment method, and print the receipt. Exactly this simple.',
    details: ['Barcode or text search', 'UPI, Card, Cash payments', 'Thermal receipt printing', 'GST-compliant invoice'],
    color: '#10b981',
  },
  {
    number: '04',
    icon: '📊',
    title: 'Watch your business grow',
    subtitle: 'Ongoing',
    desc: 'Check daily revenue, top-selling products, and low stock alerts from any device. Let the AI agent suggest restocking before you run out.',
    details: ['Live sales dashboard', 'AI restocking recommendations', 'Team performance reports', 'PDF exports for your accountant'],
    color: '#f59e0b',
  },
];


export default function HowItWorks() {
  useReveal();

  return (
    <PublicLayout fullWidth>
      <style>{ANIM_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-6 qp-grid-bg">
        <GlowOrb color="#00A4A4" size={600} opacity={0.1} top="0" left="50%" blur={120} />
        <FloatingDots count={6} color="#00A4A4" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="qp-reveal">
            <GradientBadge color="#00A4A4">Setup in minutes</GradientBadge>
            <h1 className="font-manrope font-extrabold text-5xl sm:text-7xl text-[var(--text-primary)] tracking-tight leading-none mb-6">
              From signup to{' '}
              <span className="qp-shimmer-text">first sale</span>
              <br />in 20 minutes
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
              No IT team. No hardware procurement. No installation. Just open a browser tab and go.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center qp-reveal qp-delay-2">
            <Link to="/register"
              className="qp-btn-primary inline-flex items-center justify-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl text-base shadow-2xl shadow-[#00A4A4]/30">
              Start for free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" /></svg>
            </Link>
            <Link to="/features"
              className="inline-flex items-center justify-center gap-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold px-8 py-4 rounded-xl text-base hover:bg-[var(--surface)] transition-all">
              Explore features
            </Link>
          </div>
        </div>
      </section>

      {/* ── Steps timeline ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16 qp-reveal">
          <GradientBadge color="#00A4A4">The journey</GradientBadge>
          <h2 className="font-manrope font-extrabold text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight mb-4">
            Four simple steps
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-xl mx-auto">
            Everything is browser-based  use your existing phone, tablet, or laptop.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(123,57,252,.3) 20%, rgba(123,57,252,.3) 80%, transparent)' }} />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number}
                className="qp-reveal qp-card-hover group"
                style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 h-full overflow-hidden"
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
                  {/* Step number watermark */}
                  <div className="absolute top-3 right-4 font-manrope font-extrabold text-7xl leading-none select-none pointer-events-none"
                    style={{ color: `${step.color}08` }}>
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${step.color}15` }}>
                    {step.icon}
                  </div>

                  {/* Time badge */}
                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3"
                    style={{ background: `${step.color}12`, border: `1px solid ${step.color}25` }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={step.color} strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                    </svg>
                    <span className="text-xs font-bold" style={{ color: step.color }}>{step.subtitle}</span>
                  </div>

                  <h3 className="font-manrope font-extrabold text-xl text-[var(--text-primary)] mb-3 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">{step.desc}</p>

                  <ul className="space-y-2">
                    {step.details.map(d => (
                      <li key={d} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={step.color} strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 inset-x-0 h-0.5 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    style={{ background: `linear-gradient(90deg, transparent, ${step.color}, transparent)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <CTAStrip
        heading="Ready to get started?"
        sub="Join the modern retailers revolutionising their stores with QuantPOS. Free 14-day trial."
        primaryLabel="Start free  no card needed"
        secondaryLabel="View all features"
        secondaryTo="/features"
      />
    </PublicLayout>
  );
}
