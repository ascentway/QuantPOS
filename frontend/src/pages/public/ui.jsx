/**
 * ui.jsx  Shared SaaS primitives for QuantPOS public pages.
 * Inject once, reuse everywhere. Zero external dependencies.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── Global animation CSS (injected once via <style>) ─────────────────────── */
export const ANIM_CSS = `
  @keyframes qp-fade-up   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes qp-fade-in   { from{opacity:0} to{opacity:1} }
  @keyframes qp-scale-in  { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
  @keyframes qp-slide-right{ from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
  @keyframes qp-float     { 0%,100%{transform:translateY(0px) rotate(0deg)} 33%{transform:translateY(-10px) rotate(1deg)} 66%{transform:translateY(-5px) rotate(-1deg)} }
  @keyframes qp-glow-pulse{ 0%,100%{opacity:.45;transform:scale(1)} 50%{opacity:.75;transform:scale(1.08)} }
  @keyframes qp-shimmer   { from{background-position:-200% 0} to{background-position:200% 0} }
  @keyframes qp-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes qp-counter   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes qp-border-glow { 0%,100%{box-shadow:0 0 0 1px rgba(123,57,252,.2)} 50%{box-shadow:0 0 0 2px rgba(123,57,252,.5),0 0 24px rgba(123,57,252,.15)} }
  @keyframes qp-orbit { from{transform:rotate(0deg) translateX(70px) rotate(0deg)} to{transform:rotate(360deg) translateX(70px) rotate(-360deg)} }
  @keyframes qp-grid-flow { from{transform:translateY(0)} to{transform:translateY(64px)} }
  @keyframes qp-ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes qp-gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes qp-line-draw { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }

  .qp-reveal { opacity:0; transform:translateY(24px); transition:opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1) }
  .qp-reveal.visible { opacity:1; transform:translateY(0) }
  .qp-reveal-left { opacity:0; transform:translateX(-24px); transition:opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1) }
  .qp-reveal-left.visible { opacity:1; transform:translateX(0) }
  .qp-reveal-right { opacity:0; transform:translateX(24px); transition:opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1) }
  .qp-reveal-right.visible { opacity:1; transform:translateX(0) }
  .qp-reveal-scale { opacity:0; transform:scale(.94); transition:opacity .55s cubic-bezier(.22,1,.36,1), transform .55s cubic-bezier(.22,1,.36,1) }
  .qp-reveal-scale.visible { opacity:1; transform:scale(1) }

  .qp-delay-1 { transition-delay:.08s }
  .qp-delay-2 { transition-delay:.16s }
  .qp-delay-3 { transition-delay:.24s }
  .qp-delay-4 { transition-delay:.32s }
  .qp-delay-5 { transition-delay:.40s }
  .qp-delay-6 { transition-delay:.48s }

  .qp-float  { animation: qp-float  6s ease-in-out infinite }
  .qp-glow-pulse { animation: qp-glow-pulse 3s ease-in-out infinite }
  .qp-spin-slow  { animation: qp-spin-slow 20s linear infinite }
  .qp-ticker { animation: qp-ticker 28s linear infinite }

  .qp-card-hover {
    transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease, border-color .22s ease;
  }
  .qp-card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 60px -12px rgba(123,57,252,.18);
    border-color: rgba(123,57,252,.3) !important;
  }
  .qp-btn-primary {
    position:relative; overflow:hidden;
    transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
  }
  .qp-btn-primary::before {
    content:''; position:absolute; inset:0;
    background: linear-gradient(180deg, rgba(255,255,255,.12) 0%, transparent 100%);
    pointer-events:none;
  }
  .qp-btn-primary:hover { transform:translateY(-1px); box-shadow:0 12px 32px -4px rgba(123,57,252,.45) }
  .qp-btn-primary:active { transform:translateY(0) }

  .qp-shimmer-text {
    background: linear-gradient(90deg, var(--from,#00A4A4) 0%, #00D4D4 50%, var(--from,#00A4A4) 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: qp-gradient-shift 4s ease infinite;
  }

  .qp-glass {
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);
  }

  .qp-grid-bg {
    background-image:
      linear-gradient(rgba(123,57,252,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(123,57,252,.04) 1px, transparent 1px);
    background-size: 56px 56px;
  }
  .dark .qp-grid-bg {
    background-image:
      linear-gradient(rgba(123,57,252,.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(123,57,252,.07) 1px, transparent 1px);
  }

  .qp-orbit-ring { animation: qp-orbit 12s linear infinite }
  .qp-orbit-ring-rev { animation: qp-orbit 18s linear infinite reverse }
`;

/* ─── Scroll reveal hook ─────────────────────────────────────────────────────── */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.qp-reveal, .qp-reveal-left, .qp-reveal-right, .qp-reveal-scale');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Animated number counter ───────────────────────────────────────────────── */
export function useCounter(target, suffix = '', dur = 2000) {
  const [val, setVal] = useState('0');
  const ref = useRef();
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const isDecimal = String(target).includes('.');
      const t0 = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = isDecimal ? (eased * target).toFixed(1) : Math.round(eased * target);
        setVal(v + suffix);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [target, suffix, dur]);
  return [val, ref];
}

/* ─── Ambient glow orb ──────────────────────────────────────────────────────── */
export const GlowOrb = ({ color = '#00A4A4', size = 400, opacity = 0.12, top, left, right, bottom, blur = 80 }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute rounded-full qp-glow-pulse"
    style={{
      width: size, height: size,
      top, left, right, bottom,
      background: color,
      opacity,
      filter: `blur(${blur}px)`,
      transform: 'translate(-50%, -50%)',
    }}
  />
);

/* ─── Gradient badge ─────────────────────────────────────────────────────────── */
export const GradientBadge = ({ children, color = '#00A4A4' }) => (
  <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
    style={{
      background: `${color}12`,
      border: `1px solid ${color}30`,
    }}>
    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
    <span className="text-xs font-bold tracking-widest uppercase font-manrope" style={{ color }}>
      {children}
    </span>
  </div>
);

/* ─── Section heading ────────────────────────────────────────────────────────── */
export const SectionHeading = ({ eyebrow, title, subtitle, center = true, accent = '#00A4A4', className = '' }) => (
  <div className={`${center ? 'text-center' : ''} mb-16 qp-reveal ${className}`}>
    {eyebrow && <GradientBadge color={accent}>{eyebrow}</GradientBadge>}
    <h2 className="font-manrope font-extrabold text-3xl sm:text-5xl text-[var(--text-primary)] tracking-tight leading-tight mb-4">
      {title}
    </h2>
    {subtitle && (
      <p className="text-lg text-[var(--text-muted)] max-w-2xl leading-relaxed" style={center ? { margin: '0 auto' } : {}}>
        {subtitle}
      </p>
    )}
  </div>
);

/* ─── Glass card ─────────────────────────────────────────────────────────────── */
export const GlassCard = ({ children, className = '', accent, style = {}, hover = true }) => (
  <div
    className={`relative rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 qp-glass overflow-hidden
      ${hover ? 'qp-card-hover' : ''} ${className}`}
    style={style}
  >
    {accent && (
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />
    )}
    {children}
  </div>
);

/* ─── CTA Strip ──────────────────────────────────────────────────────────────── */
export const CTAStrip = ({ heading, sub, primaryLabel = 'Start Free Trial', primaryTo = '/register', secondaryLabel, secondaryTo }) => (
  <section className="max-w-7xl mx-auto px-6 pb-28">
    <div className="relative overflow-hidden rounded-3xl p-12 sm:p-16 text-center"
      style={{
        background: 'linear-gradient(135deg, #00A4A4 0%, #00A4A4 50%, #00A4A4 100%)',
        backgroundSize: '200% 200%',
        animation: 'qp-gradient-shift 6s ease infinite',
      }}>
      {/* Mesh noise overlay */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />
      {/* Glow orbs inside CTA */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20"
        style={{ background: '#fff', filter: 'blur(80px)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15"
        style={{ background: '#00A4A4', filter: 'blur(60px)', transform: 'translate(-30%, 30%)' }} />

      <div className="relative z-10 qp-reveal">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-white/90 tracking-widest uppercase">14-day free trial · No card required</span>
        </div>
        <h2 className="font-manrope font-extrabold text-3xl sm:text-5xl text-white mb-4 leading-tight">
          {heading}
        </h2>
        {sub && <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto leading-relaxed">{sub}</p>}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={primaryTo}
            className="inline-flex items-center justify-center gap-2 bg-white text-accent font-bold px-8 py-4 rounded-xl text-base hover:bg-white/90 transition-all shadow-lg">
            {primaryLabel}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </Link>
          {secondaryLabel && secondaryTo && (
            <Link to={secondaryTo}
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base hover:bg-white/10 transition-all">
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  </section>
);

/* ─── Hero wrapper with grid background ─────────────────────────────────────── */
export const HeroSection = ({ children, className = '' }) => (
  <section className={`relative overflow-hidden pt-24 pb-20 px-6 qp-grid-bg ${className}`}>
    {/* Radial fade mask over grid */}
    <div className="pointer-events-none absolute inset-0"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, transparent 30%, var(--bg) 100%)' }} />
    <div className="relative z-10 max-w-7xl mx-auto text-center">
      {children}
    </div>
  </section>
);

/* ─── Floating particle dots ─────────────────────────────────────────────────── */
export const FloatingDots = ({ count = 6, color = '#00A4A4' }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i}
        className="absolute w-1.5 h-1.5 rounded-full opacity-30"
        style={{
          background: color,
          left: `${10 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
          animation: `qp-float ${4 + i}s ease-in-out infinite`,
          animationDelay: `${i * 0.6}s`,
        }}
      />
    ))}
  </div>
);

/* ─── Stat card with animated counter ──────────────────────────────────────── */
export const StatCard = ({ value, suffix = '', label, sub, color = '#00A4A4', raw, delay = 0 }) => {
  const [v, ref] = useCounter(raw ?? parseFloat(value), suffix);
  return (
    <div ref={ref}
      className={`qp-reveal qp-card-hover rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 qp-glass p-6 text-center`}
      style={{ transitionDelay: `${delay}s` }}>
      <div className="font-manrope font-extrabold text-4xl mb-1" style={{ color }}>{raw != null ? v : value}</div>
      <div className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{label}</div>
      {sub && <div className="text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
};
