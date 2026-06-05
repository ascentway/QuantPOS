import React, { useState } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import { ANIM_CSS, useReveal, GlowOrb, GradientBadge, FloatingDots, CTAStrip } from './ui';

const ROLES = [
  {
    title: 'Senior Full-Stack Engineer', dept: 'Engineering', location: 'Remote (India)', type: 'Full-time',
    level: 'Senior', color: '#7b39fc',
    desc: 'Own and build mission-critical features across our Spring Boot backend and React frontend. You\'ll work on multi-tenant data isolation, real-time POS sync, and AI integration.',
    skills: ['Java / Spring Boot', 'React / TypeScript', 'PostgreSQL', 'Redis', 'Docker'],
  },
  {
    title: 'AI/ML Engineer', dept: 'Product', location: 'Remote (India)', type: 'Full-time',
    level: 'Mid–Senior', color: '#ec4899',
    desc: 'Build and improve our restocking AI agent. You\'ll work on demand forecasting, anomaly detection, and integrating LLM capabilities into the merchant workflow.',
    skills: ['Python', 'PyTorch / scikit-learn', 'Time-series forecasting', 'API design', 'Data pipelines'],
    badge: 'AI',
  },
  {
    title: 'Product Designer', dept: 'Design', location: 'Remote (India)', type: 'Full-time',
    level: 'Mid', color: '#10b981',
    desc: 'Design experiences for shop owners who don\'t have time for complex software. You\'ll own the POS terminal UX, onboarding flow, and our marketing website.',
    skills: ['Figma', 'User research', 'Design systems', 'Prototyping', 'Accessibility'],
  },
  {
    title: 'Backend Engineer (India Payments)', dept: 'Engineering', location: 'Remote (India)', type: 'Full-time',
    level: 'Mid', color: '#0ea5e9',
    desc: 'Build and maintain our payment infrastructure — Stripe, Razorpay, UPI integrations, GST invoice generation, and financial reconciliation.',
    skills: ['Java / Spring Boot', 'Payment APIs', 'GST / Accounting', 'PostgreSQL', 'Security'],
  },
  {
    title: 'Growth Marketing Manager', dept: 'Marketing', location: 'Remote (India)', type: 'Full-time',
    level: 'Mid', color: '#f59e0b',
    desc: 'Drive merchant acquisition and activation. You\'ll own paid campaigns, content, SEO, and partnerships with Indian retail associations and distributors.',
    skills: ['Performance marketing', 'SEO / SEM', 'Content strategy', 'Analytics', 'B2B SaaS'],
  },
];

const PERKS = [
  { icon: '🏠', title: 'Remote-first', desc: 'Work from anywhere in India. We have no office — and that\'s by design.' },
  { icon: '💰', title: 'Competitive comp', desc: 'Market-rate salaries plus equity. We want you to win when we win.' },
  { icon: '🎓', title: 'Learning budget', desc: '₹50,000/year for courses, books, conferences — anything that makes you better.' },
  { icon: '🏥', title: 'Health coverage', desc: 'Full health insurance for you and your family from day 1.' },
  { icon: '⏰', title: 'Async by default', desc: 'No 9-5. No daily standups. Deep work time is sacred.' },
  { icon: '📈', title: 'Real ownership', desc: 'You won\'t be feature-farming. You\'ll own outcomes and move fast.' },
];

export default function Careers() {
  const [selectedDept, setSelectedDept] = useState('All');
  const depts = ['All', ...new Set(ROLES.map(r => r.dept))];
  const filtered = selectedDept === 'All' ? ROLES : ROLES.filter(r => r.dept === selectedDept);
  useReveal();

  return (
    <PublicLayout fullWidth>
      <style>{ANIM_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-6 qp-grid-bg">
        <GlowOrb color="#7b39fc" size={600} opacity={0.1} top="0" left="50%" blur={120} />
        <GlowOrb color="#10b981" size={400} opacity={0.07} top="50%" left="20%" blur={100} />
        <FloatingDots count={7} color="#7b39fc" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="qp-reveal">
            <GradientBadge color="#7b39fc">We're hiring</GradientBadge>
            <h1 className="font-manrope font-extrabold text-5xl sm:text-7xl text-[var(--text-primary)] tracking-tight leading-none mb-6">
              Build the future of{' '}
              <span className="qp-shimmer-text">Indian retail</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
              We're a small team with a big mission. Join us and make an impact on millions of Indian shopkeepers.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 qp-reveal qp-delay-2">
            {[
              { v: `${ROLES.length}`, label: 'Open roles' },
              { v: '100%', label: 'Remote' },
              { v: 'Series A', label: 'Stage (upcoming)' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-manrope font-extrabold text-3xl text-[#7b39fc]">{s.v}</div>
                <div className="text-sm text-[var(--text-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Perks ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 qp-grid-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 qp-reveal">
            <GradientBadge color="#7b39fc">Why QuantPOS</GradientBadge>
            <h2 className="font-manrope font-extrabold text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight">
              Built for builders
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PERKS.map((p, i) => (
              <div key={p.title}
                className="qp-reveal qp-card-hover rounded-3xl border border-[var(--border)] bg-[var(--surface)]/80 qp-glass p-7"
                style={{ transitionDelay: `${i * 0.07}s` }}>
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="font-manrope font-extrabold text-lg text-[var(--text-primary)] mb-2">{p.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open roles ────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-12 qp-reveal">
          <GradientBadge color="#7b39fc">Open positions</GradientBadge>
          <h2 className="font-manrope font-extrabold text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight mb-8">
            {ROLES.length} open roles
          </h2>
          {/* Dept filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {depts.map(d => (
              <button key={d} onClick={() => setSelectedDept(d)}
                className="px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200"
                style={{
                  background: selectedDept === d ? '#7b39fc' : 'transparent',
                  color: selectedDept === d ? '#fff' : 'var(--text-muted)',
                  borderColor: selectedDept === d ? '#7b39fc' : 'var(--border)',
                  boxShadow: selectedDept === d ? '0 4px 12px rgba(123,57,252,.3)' : 'none',
                }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {filtered.map((role, i) => (
            <div key={role.title}
              className="qp-reveal qp-card-hover rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              style={{ transitionDelay: `${i * 0.08}s` }}>
              {/* Top accent */}
              <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${role.color}, transparent)` }} />

              <div className="p-7">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-manrope font-extrabold text-xl text-[var(--text-primary)]">{role.title}</h3>
                      {role.badge && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: role.color }}>
                          {role.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {[
                        { icon: '🏢', v: role.dept },
                        { icon: '📍', v: role.location },
                        { icon: '⏱️', v: role.type },
                        { icon: '📊', v: role.level },
                      ].map(b => (
                        <span key={b.v} className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          {b.icon} {b.v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a href={`mailto:quantpos@gmail.com?subject=Application: ${encodeURIComponent(role.title)}`}
                    className="qp-btn-primary flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg"
                    style={{ background: role.color, boxShadow: `0 4px 16px ${role.color}40` }}>
                    Apply now →
                  </a>
                </div>

                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">{role.desc}</p>

                <div className="flex flex-wrap gap-2">
                  {role.skills.map(s => (
                    <span key={s} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center qp-reveal">
          <p className="text-[var(--text-muted)] mb-4">Don't see a role that fits? We hire great people regardless.</p>
          <a href="mailto:quantpos@gmail.com?subject=Open Application"
            className="inline-flex items-center gap-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold px-6 py-3 rounded-xl hover:border-[#7b39fc] hover:text-[#7b39fc] transition-all">
            Send open application →
          </a>
        </div>
      </section>

      <CTAStrip
        heading="Ready to build with us?"
        sub="Small team. Big mission. Real ownership."
        primaryLabel="See all open roles"
        primaryTo="#roles"
        secondaryLabel="Learn about us"
        secondaryTo="/about"
      />
    </PublicLayout>
  );
}
