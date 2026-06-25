import React, { useState, useEffect } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import { ANIM_CSS, useReveal, GradientBadge } from './ui';

const SERVICES = [
  { name: 'POS Terminal API', uptime: 99.97, status: 'operational' },
  { name: 'Authentication & 2FA', uptime: 100.0, status: 'operational' },
  { name: 'Inventory Service', uptime: 99.95, status: 'operational' },
  { name: 'AI Restocking Agent', uptime: 99.91, status: 'operational' },
  { name: 'Email Notifications', uptime: 99.88, status: 'operational' },
  { name: 'Payment Processing', uptime: 99.99, status: 'operational' },
  { name: 'Analytics Pipeline', uptime: 99.76, status: 'degraded' },
  { name: 'CDN / Static Assets', uptime: 100.0, status: 'operational' },
];

const INCIDENTS = [
  {
    date: '2026-05-28', status: 'resolved', severity: 'minor',
    title: 'Analytics dashboard intermittently slow',
    desc: 'Some users experienced 2–5 second delays on the analytics dashboard due to a slow query. Root cause: missing index on sales_lines table. Fixed via V11 migration and query optimisation.',
    duration: '41 minutes',
  },
  {
    date: '2026-04-15', status: 'resolved', severity: 'minor',
    title: 'Email OTP delivery delayed (3 ISPs)',
    desc: 'OTP emails were delayed by 2–8 minutes for Airtel, Jio, and BSNL users due to upstream SMTP relay congestion. Switched to secondary relay. No data loss.',
    duration: '28 minutes',
  },
  {
    date: '2026-03-02', status: 'resolved', severity: 'none',
    title: 'Scheduled maintenance  database migration',
    desc: 'Planned 15-minute maintenance window for database schema upgrades. Service was down for 11 minutes, 4 minutes ahead of schedule.',
    duration: '11 minutes',
  },
];

const statusConfig = {
  operational: { color: '#10b981', label: 'Operational', bg: 'rgba(16,185,129,.1)' },
  degraded: { color: '#f59e0b', label: 'Degraded', bg: 'rgba(245,158,11,.1)' },
  outage: { color: '#ef4444', label: 'Outage', bg: 'rgba(239,68,68,.1)' },
};

const severityConfig = {
  none: { color: '#10b981', label: 'Maintenance' },
  minor: { color: '#f59e0b', label: 'Minor' },
  major: { color: '#ef4444', label: 'Major' },
};

export default function Status() {
  const [time, setTime] = useState(new Date());
  useReveal();
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const allOk = SERVICES.every(s => s.status === 'operational');
  const overallColor = allOk ? '#10b981' : '#f59e0b';

  return (
    <PublicLayout fullWidth>
      <style>{ANIM_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16 px-6 qp-grid-bg">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="qp-reveal">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
              style={{ background: `${overallColor}15`, border: `2px solid ${overallColor}30`, boxShadow: `0 0 40px ${overallColor}20` }}>
              <span className="text-3xl">{allOk ? '✅' : '⚠️'}</span>
            </div>
            <h1 className="font-manrope font-extrabold text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight mb-3">
              {allOk ? 'All systems operational' : 'Partial service degradation'}
            </h1>
            <p className="text-[var(--text-secondary)] mb-4">
              {SERVICES.filter(s => s.status === 'operational').length} / {SERVICES.length} services running normally
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: overallColor }} />
              Last updated: {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
            </div>
          </div>
        </div>
      </section>

      {/* ── Overall uptime bar ────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 qp-reveal">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-manrope font-extrabold text-xl text-[var(--text-primary)]">30-day uptime</h2>
              <p className="text-sm text-[var(--text-muted)]">Each bar = 1 day. Green = operational.</p>
            </div>
            <div className="font-manrope font-extrabold text-4xl text-[#10b981]">99.96%</div>
          </div>
          <div className="flex gap-1 h-8">
            {Array.from({ length: 30 }).map((_, i) => {
              const isIncident = i === 2 || i === 15 || i === 27;
              return (
                <div key={i} className="flex-1 rounded-sm transition-all duration-150 hover:scale-y-110 cursor-pointer"
                  style={{ background: isIncident ? '#f59e0b' : '#10b981', opacity: 0.7 + (i / 30) * 0.3 }}
                  title={isIncident ? 'Minor incident' : 'Operational'} />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="mb-8 qp-reveal">
          <GradientBadge color="#00A4A4">Service health</GradientBadge>
          <h2 className="font-manrope font-extrabold text-3xl text-[var(--text-primary)]">All services</h2>
        </div>
        <div className="space-y-3">
          {SERVICES.map((svc, i) => {
            const cfg = statusConfig[svc.status];
            return (
              <div key={svc.name}
                className="qp-reveal flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4"
                style={{ transitionDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  <span className="font-manrope font-semibold text-[var(--text-primary)] text-sm">{svc.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[var(--text-muted)] hidden sm:block">{svc.uptime.toFixed(2)}% uptime</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Incident history ──────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="mb-8 qp-reveal">
          <GradientBadge color="#00A4A4">Incident history</GradientBadge>
          <h2 className="font-manrope font-extrabold text-3xl text-[var(--text-primary)]">Past incidents</h2>
        </div>
        <div className="space-y-4">
          {INCIDENTS.map((inc, i) => {
            const sev = severityConfig[inc.severity];
            return (
              <div key={i}
                className="qp-reveal rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7"
                style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${sev.color}15`, color: sev.color }}>{sev.label}</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/10 text-green-500">Resolved</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span>📅 {inc.date}</span>
                    <span>⏱️ {inc.duration}</span>
                  </div>
                </div>
                <h3 className="font-manrope font-bold text-[var(--text-primary)] mb-2">{inc.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{inc.desc}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center qp-reveal">
          <p className="text-sm text-[var(--text-muted)]">
            Subscribe to status updates via{' '}
            <a href="mailto:quantpos@gmail.com" className="text-accent font-semibold hover:underline">email</a>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
