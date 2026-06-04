import React from 'react';

const ComingSoon = ({ title, icon, description }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
    <div className="text-6xl mb-5">{icon}</div>
    <h2 className="font-manrope font-bold text-[22px] text-white mb-2">{title}</h2>
    <p className="font-inter text-[14px] text-white/40 max-w-xs leading-relaxed">{description}</p>
    <div className="mt-6 inline-flex items-center gap-2 bg-[#5757f8]/10 border border-[#5757f8]/20 rounded-[8px] px-4 py-2">
      <span className="w-2 h-2 bg-[#5757f8] rounded-full animate-pulse" />
      <span className="font-manrope font-semibold text-[12px] text-[#5757f8]">Coming Soon</span>
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
    description="Manage customer profiles, purchase history, and loyalty programs — all in one place."
  />
);

export const Settings = () => (
  <ComingSoon
    title="Store Settings"
    icon="⚙️"
    description="Configure your store profile, team members, subscription, and integrations."
  />
);
