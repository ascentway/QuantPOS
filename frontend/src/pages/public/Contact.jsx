import React, { useState } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import { ANIM_CSS, useReveal, GlowOrb, GradientBadge, FloatingDots } from './ui';

const METHODS = [
  { icon: '✉️', label: 'Email', value: 'quantpos@gmail.com', href: 'mailto:quantpos@gmail.com', desc: 'Best for general questions', color: '#7b39fc' },
  { icon: '🐦', label: 'Twitter / X', value: '@quantpos', href: 'https://x.com/quantpos', desc: 'Quick questions & updates', color: '#1d9bf0' },
  { icon: '💼', label: 'LinkedIn', value: 'QuantPOS', href: 'https://linkedin.com/company/quantpos', desc: 'Business & partnership inquiries', color: '#0a66c2' },
];

const TOPICS = [
  { label: 'General question', icon: '💬' },
  { label: 'Sales & pricing', icon: '💰' },
  { label: 'Technical support', icon: '🛠️' },
  { label: 'Partnership / integration', icon: '🤝' },
  { label: 'Feature request', icon: '💡' },
  { label: 'Media / press', icon: '📰' },
];

export default function Contact() {
  const [topic, setTopic] = useState('');
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  useReveal();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <PublicLayout fullWidth>
        <style>{ANIM_CSS}</style>
        <div className="min-h-[70vh] flex items-center justify-center px-6">
          <div className="text-center max-w-md" style={{ animation: 'qp-scale-in .5s cubic-bezier(.22,1,.36,1) both' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-[#7b39fc]/30"
              style={{ background: 'linear-gradient(135deg, #7b39fc, #10b981)' }}>
              ✓
            </div>
            <h2 className="font-manrope font-extrabold text-3xl text-[var(--text-primary)] mb-3">Message sent!</h2>
            <p className="text-[var(--text-muted)] mb-8">We'll get back to you within 24 hours on business days.</p>
            <button onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', message: '' }); setTopic(''); }}
              className="inline-flex items-center gap-2 text-[#7b39fc] font-semibold hover:underline">
              Send another message
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout fullWidth>
      <style>{ANIM_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-12 px-6 qp-grid-bg">
        <GlowOrb color="#7b39fc" size={500} opacity={0.1} top="0" left="50%" blur={100} />
        <FloatingDots count={5} color="#7b39fc" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="qp-reveal">
            <GradientBadge color="#7b39fc">Get in touch</GradientBadge>
            <h1 className="font-manrope font-extrabold text-5xl sm:text-6xl text-[var(--text-primary)] tracking-tight leading-none mb-5">
              We'd love to{' '}
              <span className="qp-shimmer-text">hear from you</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
              Whether you have a question about pricing, features, or need a demo — we're here.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-5 gap-10">

        {/* Left: contact info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="qp-reveal">
            <h2 className="font-manrope font-extrabold text-2xl text-[var(--text-primary)] mb-2">Contact information</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
              Reach us through any of these channels. We typically respond within 24 hours on business days.
            </p>
            <div className="space-y-4">
              {METHODS.map(m => (
                <a key={m.label} href={m.href} target="_blank" rel="noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[#7b39fc]/40 transition-all duration-200 group">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `${m.color}15` }}>
                    {m.icon}
                  </div>
                  <div>
                    <div className="font-manrope font-bold text-sm text-[var(--text-primary)]">{m.label}</div>
                    <div className="text-sm font-semibold" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-xs text-[var(--text-muted)]">{m.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Response time callout */}
          <div className="qp-reveal qp-delay-2 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Team is online</span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Average response time: <strong className="text-[var(--text-primary)]">under 4 hours</strong> during business days (9 AM – 7 PM IST).
            </p>
          </div>
        </div>

        {/* Right: contact form */}
        <div className="lg:col-span-3 qp-reveal qp-delay-1">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-10">
            <h3 className="font-manrope font-extrabold text-xl text-[var(--text-primary)] mb-6">Send us a message</h3>

            {/* Topic selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">What's this about?</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(t => (
                  <button key={t.label} onClick={() => setTopic(t.label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
                    style={{
                      background: topic === t.label ? '#7b39fc' : 'transparent',
                      color: topic === t.label ? '#fff' : 'var(--text-muted)',
                      borderColor: topic === t.label ? '#7b39fc' : 'var(--border)',
                      boxShadow: topic === t.label ? '0 4px 12px rgba(123,57,252,.3)' : 'none',
                    }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { name: 'name', label: 'Your name', placeholder: 'Rajesh Sharma', type: 'text' },
                  { name: 'email', label: 'Email address', placeholder: 'rajesh@store.com', type: 'email' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">{f.label} *</label>
                    <input
                      type={f.type} required
                      value={form[f.name]}
                      onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[#7b39fc] focus:ring-2 focus:ring-[#7b39fc]/20"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Company / Store name</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="Sharma General Store"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[#7b39fc] focus:ring-2 focus:ring-[#7b39fc]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Message *</label>
                <textarea
                  required rows={5}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us what you're working on and how we can help..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[#7b39fc] focus:ring-2 focus:ring-[#7b39fc]/20 resize-none"
                />
              </div>

              <button type="submit"
                className="qp-btn-primary w-full bg-[#7b39fc] text-white font-bold py-4 rounded-xl text-base shadow-xl shadow-[#7b39fc]/30 flex items-center justify-center gap-2">
                Send message
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z" />
                </svg>
              </button>

              <p className="text-xs text-center text-[var(--text-muted)]">
                By submitting, you agree to our Privacy Policy. We never spam.
              </p>
            </form>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
