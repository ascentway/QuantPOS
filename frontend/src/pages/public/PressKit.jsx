import React from 'react';
import PublicLayout from '../../components/layout/PublicLayout';

const COLORS = {
  primary: '#00A4A4',
  light: '#00F5D4',
  dark: '#0C206D',
};

const BRAND_USAGES = [
  { ok: true, text: 'Use "QuantPOS" (camelCase) in all written references' },
  { ok: true, text: 'Use the logo on white or very dark (#111 or darker) backgrounds' },
  { ok: true, text: 'Use the official wordmark from the downloads below' },
  { ok: false, text: 'Do not modify, rotate, or add effects to the logo' },
  { ok: false, text: 'Do not use old versions of the logo or brand assets' },
  { ok: false, text: 'Do not imply endorsement or partnership without written consent' },
];

export default function PressKit() {
  return (
    <PublicLayout fullWidth>
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-8">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
          <span className="text-xs font-semibold text-accent tracking-wide">PRESS & MEDIA</span>
        </div>
        <h1 className="font-manrope font-extrabold text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight mb-4">
          Press Kit
        </h1>
        <p className="text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl">
          Everything you need to write about QuantPOS  logos, brand colours, product description, and company facts.
          For media enquiries: <a href="mailto:quantpos@gmail.com" className="text-accent hover:underline">quantpos@gmail.com</a>
        </p>
      </section>

      {/* About blurb */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
          <h2 className="font-manrope font-bold text-lg text-[var(--text-primary)] mb-3">About QuantPOS  Short Description (50 words)</h2>
          <p className="text-[var(--text-muted)] leading-relaxed italic border-l-2 border-accent pl-4">
            "QuantPOS is a cloud-native, AI-powered point-of-sale and inventory management platform built for Indian retail.
            From solo shopkeepers to multi-location chains, QuantPOS delivers real-time stock tracking, team management,
            automated restocking intelligence, and GST-compliant billing  starting at ₹499/month."
          </p>
        </div>
      </section>

      {/* Company facts */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <h2 className="font-manrope font-bold text-lg text-[var(--text-primary)] mb-4">Company Facts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Company name', value: 'QuantPOS' },
            { label: 'Founded', value: '2025' },
            { label: 'Headquarters', value: 'India 🇮🇳' },
            { label: 'Market', value: 'Indian retail (₹50K–₹50L+ monthly revenue)' },
            { label: 'Pricing', value: '₹499 – ₹4,999/month (4 plans)' },
            { label: 'Contact', value: 'quantpos@gmail.com' },
          ].map(f => (
            <div key={f.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">{f.label}</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{f.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Brand colors */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <h2 className="font-manrope font-bold text-lg text-[var(--text-primary)] mb-4">Brand Colours</h2>
        <div className="flex flex-wrap gap-4">
          {[
            { name: 'Brand Teal', hex: '#00A4A4', role: 'Primary accent · logo dot (light)' },
            { name: 'Brand Navy', hex: '#0C206D', role: 'Wordmark text · dark headings' },
            { name: 'Brand Mint', hex: '#00F5D4', role: 'Logo dot (dark mode) · active states' },
            { name: 'Dark BG', hex: '#0B1325', role: 'Dark mode background' },
            { name: 'Light BG', hex: '#F4F6F8', role: 'Light mode background' },
          ].map(c => (
            <div key={c.hex} className="rounded-xl border border-[var(--border)] overflow-hidden w-36">
              <div className="h-16 w-full" style={{ background: c.hex }} />
              <div className="p-3 bg-[var(--surface)]">
                <p className="text-xs font-bold text-[var(--text-primary)] font-manrope">{c.name}</p>
                <p className="text-xs text-[var(--text-muted)] font-mono">{c.hex}</p>
                <p className="text-xs text-[var(--text-muted)]">{c.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <h2 className="font-manrope font-bold text-lg text-[var(--text-primary)] mb-4">Typography</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { font: 'DM Serif Display', role: 'Logo & display headings', sample: 'The quick brown fox' },
            { font: 'Inter', role: 'Body text & UI', sample: 'The quick brown fox' },
            { font: 'Manrope', role: 'UI labels & nav', sample: 'THE QUICK BROWN FOX' },
          ].map(t => (
            <div key={t.font} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">{t.role}</p>
              <p className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: t.font }}>{t.sample}</p>
              <p className="text-sm font-semibold text-accent mt-2 font-manrope">{t.font}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Logo downloads */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <h2 className="font-manrope font-bold text-lg text-[var(--text-primary)] mb-4">Logo Downloads</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Wordmark  Dark background', bg: '#0B1325', text: 'white' },
            { label: 'Wordmark  Light background', bg: '#F4F6F8', text: '#0C206D', border: true },
            { label: 'Icon  Teal background', bg: '#00A4A4', text: 'white' },
          ].map(l => (
            <div key={l.label} className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className={`h-28 flex items-center justify-center ${l.border ? 'border-b border-[var(--border)]' : ''}`}
                style={{ background: l.bg }}>
                <span className="font-dm-serif font-bold text-2xl" style={{ color: l.text }}>Quantpos.</span>
              </div>
              <div className="p-3 bg-[var(--surface)] flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)]">{l.label}</p>
                <button className="text-xs font-semibold text-accent hover:underline">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand guidelines */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="font-manrope font-bold text-lg text-[var(--text-primary)] mb-4">Brand Usage Guidelines</h2>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3">
          {BRAND_USAGES.map((u, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold
                ${u.ok ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>
                {u.ok ? '✓' : '✕'}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">{u.text}</span>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
