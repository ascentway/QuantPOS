import React from 'react';

const ComingSoon = ({ title, icon, description }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
    <div className="text-6xl mb-5">{icon}</div>
    <h2 className="font-manrope font-bold text-[22px] mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h2>
    <p className="font-inter text-[14px] max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
    <div className="mt-6 inline-flex items-center gap-2 rounded-[8px] px-4 py-2"
      style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
      <span className="font-manrope font-semibold text-[12px]" style={{ color: 'var(--accent)' }}>Coming Soon</span>
    </div>
  </div>
);

export const Inventory = () => (
  <ComingSoon
    title="Inventory Management"
    icon="📦"
    description="Track stock levels, set reorder points, and get AI-powered restocking suggestions. Launching in the next release."
  />
);

export const Reports = () => (
  <ComingSoon
    title="Reports & Analytics"
    icon="📊"
    description="Deep-dive into sales trends, product performance, and revenue insights. Advanced analytics coming soon."
  />
);

export const Customers = () => (
  <ComingSoon
    title="Customer Management"
    icon="👥"
    description="Manage customer profiles, purchase history, and loyalty programs  all in one place."
  />
);
