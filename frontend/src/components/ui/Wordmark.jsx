import React from 'react';

/* ─── Logo mark (works in both light + dark) ─────────────────────────────── */
export const QPMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Deep indigo rounded square */}
    <rect width="38" height="38" rx="10" fill="#4F46E5" />
    {/* Subtle inner gradient */}
    <rect width="38" height="38" rx="10" fill="url(#qpgrad)" opacity="0.4" />
    <defs>
      <linearGradient id="qpgrad" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="white" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="white" stopOpacity="0"/>
      </linearGradient>
    </defs>
    {/* Q ring */}
    <circle cx="18.5" cy="18" r="7" stroke="white" strokeWidth="2.6" fill="none" />
    {/* Q tail */}
    <path d="M23.5 23 L28.5 28.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
    {/* Center spark */}
    <circle cx="18.5" cy="18" r="1.8" fill="rgba(255,255,255,0.5)" />
  </svg>
);

/* ─── Wordmark ────────────────────────────────────────────────────────────── */
export const Wordmark = ({ size = 32 }) => (
  <div className="flex items-center gap-2.5">
    <QPMark size={size} />
    <span className="font-manrope font-bold text-[18px] tracking-tight text-primary">
      QuantPOS
    </span>
  </div>
);

export default Wordmark;
