import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { ANIM_CSS, useReveal, GlowOrb, GradientBadge, FloatingDots } from './ui';

const POSTS = [
  {
    slug: '#', tag: 'Product', tagColor: '#00A4A4', date: 'June 4, 2026', readTime: '5 min',
    title: 'Introducing AI Restocking: Never run out of stock again',
    excerpt: 'Our new AI agent analyses your 30-day sales history, detects seasonal patterns, and sends you prioritised purchase order suggestions every day at 8 AM and 8 PM.',
    author: 'Dhruv Ranjan', authorInitials: 'DR', authorColor: '#00A4A4',
    featured: true,
  },
  {
    slug: '#', tag: 'Guide', tagColor: '#10b981', date: 'May 22, 2026', readTime: '8 min',
    title: 'How to set up GST on QuantPOS in 3 minutes',
    excerpt: 'A step-by-step walkthrough of configuring GST rates, GSTIN, and generating GST-compliant thermal receipts for your store.',
    author: 'Product Team', authorInitials: 'PT', authorColor: '#10b981',
  },
  {
    slug: '#', tag: 'Case Study', tagColor: '#f59e0b', date: 'May 10, 2026', readTime: '6 min',
    title: 'How Sharma Supermarket reduced stockouts by 80%',
    excerpt: 'Rajesh Sharma was losing ₹15,000/month to stockouts. After switching to QuantPOS and enabling AI restocking, he cut losses to near zero in 6 weeks.',
    author: 'Growth Team', authorInitials: 'GT', authorColor: '#f59e0b',
  },
  {
    slug: '#', tag: 'Engineering', tagColor: '#00A4A4', date: 'April 28, 2026', readTime: '10 min',
    title: 'How we built a multi-tenant POS on a shared PostgreSQL schema',
    excerpt: 'Deep dive into our row-level security architecture, Hibernate filters, and ThreadLocal tenant context  and why we chose it over separate databases.',
    author: 'Engineering', authorInitials: 'EN', authorColor: '#00A4A4',
  },
  {
    slug: '#', tag: 'Product', tagColor: '#00A4A4', date: 'April 15, 2026', readTime: '4 min',
    title: 'Team management just got a lot better',
    excerpt: 'We shipped OTP-based team invitations, cashier-level POS restrictions, and a full activity audit log in our latest release.',
    author: 'Dhruv Ranjan', authorInitials: 'DR', authorColor: '#00A4A4',
  },
  {
    slug: '#', tag: 'Guide', tagColor: '#10b981', date: 'March 30, 2026', readTime: '7 min',
    title: 'Migrating from Marg ERP to QuantPOS: a practical guide',
    excerpt: 'Export your product list from Marg, clean it up in Excel, and import it into QuantPOS in minutes. We walk through the entire process.',
    author: 'Support Team', authorInitials: 'ST', authorColor: '#10b981',
  },
];

export default function Blog() {
  useReveal();
  const [featured, ...rest] = POSTS;

  return (
    <PublicLayout fullWidth>
      <style>{ANIM_CSS}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16 px-6 qp-grid-bg">
        <GlowOrb color="#00A4A4" size={500} opacity={0.1} top="0" left="50%" blur={100} />
        <FloatingDots count={5} color="#00A4A4" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="qp-reveal">
            <GradientBadge color="#00A4A4">The QuantPOS blog</GradientBadge>
            <h1 className="font-manrope font-extrabold text-5xl sm:text-6xl text-[var(--text-primary)] tracking-tight leading-none mb-5">
              Stories, guides &{' '}
              <span className="qp-shimmer-text">updates</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Product updates, engineering deep-dives, merchant case studies, and how-to guides for Indian retail.
            </p>
          </div>
        </div>
      </section>

      {/* ── Featured post ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <a href={featured.slug}
          className="qp-reveal qp-card-hover group block rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Image placeholder */}
            <div className="h-60 lg:h-auto relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #00A4A422, #00A4A422, #10b98122)' }}>
              <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-30">📦</div>
              <div className="absolute top-0 left-0 right-0 bottom-0 qp-grid-bg opacity-40" />
              <div className="absolute top-5 left-5">
                <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: featured.tagColor }}>
                  {featured.tag}
                </span>
              </div>
            </div>
            {/* Content */}
            <div className="p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-4">
                  <span>📅 {featured.date}</span>
                  <span>⏱️ {featured.readTime} read</span>
                </div>
                <h2 className="font-manrope font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] mb-4 leading-tight group-hover:text-accent transition-colors">
                  {featured.title}
                </h2>
                <p className="text-[var(--text-muted)] leading-relaxed text-sm sm:text-base mb-6">{featured.excerpt}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{ background: featured.authorColor }}>
                    {featured.authorInitials}
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{featured.author}</span>
                </div>
                <span className="text-accent font-semibold text-sm group-hover:gap-2 flex items-center gap-1 transition-all">
                  Read more
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </a>
      </section>

      {/* ── Post grid ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="font-manrope font-extrabold text-2xl text-[var(--text-primary)] mb-8 qp-reveal">Latest articles</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post, i) => (
            <a key={post.title} href={post.slug}
              className="qp-reveal qp-card-hover group flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              style={{ transitionDelay: `${i * 0.07}s` }}>
              {/* Image placeholder */}
              <div className="h-36 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${post.tagColor}15, ${post.tagColor}05)` }}>
                <div className="absolute inset-0 qp-grid-bg opacity-30" />
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: post.tagColor }}>
                    {post.tag}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-3">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime} read</span>
                </div>
                <h3 className="font-manrope font-extrabold text-lg text-[var(--text-primary)] mb-3 leading-tight group-hover:text-accent transition-colors flex-1">
                  {post.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-2.5 pt-4 border-t border-[var(--border)]">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                    style={{ background: post.authorColor }}>
                    {post.authorInitials}
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{post.author}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
