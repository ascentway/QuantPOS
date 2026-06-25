import React, { useState } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import { ANIM_CSS, useReveal, GlowOrb, GradientBadge, FloatingDots } from './ui';

const TEAM = [
  {
    name: 'Dhruv Ranjan', role: 'Founder & CEO', avatar: 'DR',
    bio: 'Building the POS system Indian retail deserves. Passionate about solving real operational pain points for shop owners.',
    color: '#00A4A4',
  },
  {
    name: 'Engineering Team', role: 'Backend & Frontend', avatar: 'ET',
    bio: 'Full-stack engineers obsessed with performance, security, and building the smoothest checkout experience possible.',
    color: '#00A4A4',
  },
  {
    name: 'Design Team', role: 'Product & UX', avatar: 'DT',
    bio: 'Every pixel matters. We design for the busy shopkeeper who doesn\'t have time to learn complicated software.',
    color: '#10b981',
  },
];

const VALUES = [
  { icon: '🇮🇳', title: 'Made for India', desc: 'GST-native, UPI-first, built for Indian network conditions and the way Indian retail actually works.' },
  { icon: '🔒', title: 'Security first', desc: '2FA on every login, row-level data isolation, encrypted tokens, and full audit trails  by default.' },
  { icon: '🚀', title: 'Ship fast, iterate', desc: 'We release improvements every week based on real feedback from our merchant community.' },
  { icon: '💡', title: 'AI-augmented', desc: 'Intelligence at the right moment  restocking suggestions, anomaly detection, and demand forecasting.' },
  { icon: '❤️', title: 'Merchant-obsessed', desc: 'Every feature decision starts with "does this make life easier for a shopkeeper?" If not, we don\'t build it.' },
  { icon: '📈', title: 'Built to scale', desc: 'Multi-tenant architecture that handles thousands of concurrent POS terminals without breaking a sweat.' },
];

export default function About() {
  useReveal();

  return (
    <PublicLayout fullWidth>
      <style>{ANIM_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-6 qp-grid-bg">
        <GlowOrb color="#00A4A4" size={600} opacity={0.1} top="0" left="50%" blur={120} />
        <GlowOrb color="#10b981" size={400} opacity={0.07} top="60%" left="80%" blur={100} />
        <FloatingDots count={7} color="#00A4A4" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="qp-reveal">
            <GradientBadge color="#00A4A4">Our story</GradientBadge>
            <h1 className="font-manrope font-extrabold text-5xl sm:text-7xl text-[var(--text-primary)] tracking-tight leading-none mb-6">
              We're fixing{' '}
              <span className="qp-shimmer-text">Indian retail</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
              Every day, millions of Indian shop owners manage their business with pen, paper, and Excel sheets.
              We're changing that  one store at a time.
            </p>
          </div>
        </div>
      </section>

      {/* ── Mission statement ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="relative rounded-3xl overflow-hidden border border-accent/20 p-10 sm:p-16 qp-reveal"
          style={{ background: 'linear-gradient(135deg, rgba(123,57,252,.05) 0%, var(--surface) 50%, rgba(14,165,233,.05) 100%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ background: '#00A4A4', filter: 'blur(60px)', transform: 'translate(30%, -30%)' }} />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="font-manrope font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] leading-relaxed mb-6">
              "Legacy POS systems cost ₹80,000+ upfront with 3-year contracts.
              We built QuantPOS to give every Indian retailer the same
              <span className="text-accent"> enterprise-grade tools </span>
              at ₹499/month."
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #00A4A4, #00A4A4)' }}>DR</div>
              <div className="text-left">
                <div className="font-manrope font-bold text-[var(--text-primary)]">Dhruv Ranjan</div>
                <div className="text-sm text-[var(--text-muted)]">Founder & CEO, QuantPOS</div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── Values ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 qp-grid-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 qp-reveal">
            <GradientBadge color="#00A4A4">What we stand for</GradientBadge>
            <h2 className="font-manrope font-extrabold text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight">
              Our values
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v, i) => (
              <div key={v.title}
                className="qp-reveal qp-card-hover rounded-3xl border border-[var(--border)] bg-[var(--surface)]/80 qp-glass p-7"
                style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-manrope font-extrabold text-lg text-[var(--text-primary)] mb-2">{v.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14 qp-reveal">
          <GradientBadge color="#00A4A4">The team</GradientBadge>
          <h2 className="font-manrope font-extrabold text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight">
            Built by people who care
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TEAM.map((m, i) => (
            <div key={m.name}
              className="qp-reveal qp-card-hover rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center"
              style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl text-white mx-auto mb-5"
                style={{ background: `linear-gradient(135deg, ${m.color}, #00A4A4)` }}>
                {m.avatar}
              </div>
              <h3 className="font-manrope font-extrabold text-xl text-[var(--text-primary)] mb-1">{m.name}</h3>
              <p className="text-sm font-semibold mb-4" style={{ color: m.color }}>{m.role}</p>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-28">
        <div className="relative overflow-hidden rounded-3xl p-12 sm:p-16 text-center border border-accent/20"
          style={{ background: 'linear-gradient(135deg, rgba(123,57,252,.08) 0%, var(--surface) 50%, rgba(14,165,233,.06) 100%)' }}>
          <div className="qp-reveal">
            <GradientBadge color="#00A4A4">Join us</GradientBadge>
            <h2 className="font-manrope font-extrabold text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight mb-4">
              Want to work with us?
            </h2>
            <p className="text-lg text-[var(--text-muted)] mb-8 max-w-xl mx-auto">
              We're a small, talented team building something big. If you love solving hard problems for real people, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/careers"
                className="qp-btn-primary inline-flex items-center justify-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl text-base shadow-2xl shadow-[#00A4A4]/30">
                View open roles
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" /></svg>
              </a>
              <a href="/contact"
                className="inline-flex items-center justify-center gap-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold px-8 py-4 rounded-xl text-base hover:bg-[var(--surface)] transition-all">
                Get in touch
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
