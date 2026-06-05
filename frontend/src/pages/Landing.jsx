import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark, QPMark } from '../components/ui/Wordmark';


/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATION CSS  — scoped with "qp-" prefix, no external libraries
───────────────────────────────────────────────────────────────────────────── */
const animationCSS = `
  @keyframes qp-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes qp-pulse  { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
  @keyframes qp-ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes qp-ping   { 75%,100%{transform:scale(2.2);opacity:0} }
  @keyframes qp-glow-i { 0%,100%{box-shadow:0 0 20px 0 rgba(99,102,241,.3)} 50%{box-shadow:0 0 40px 6px rgba(99,102,241,.55)} }
  @keyframes qp-fade-up{ from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes qp-badge  { 0%{transform:translateY(-2px)} 50%{transform:translateY(1px)} 100%{transform:translateY(-2px)} }

  .qp-float  { animation:qp-float   3.8s ease-in-out infinite }
  .qp-pulse  { animation:qp-pulse   2.2s ease-in-out infinite }
  .qp-ticker { animation:qp-ticker  24s linear infinite }
  .qp-ping   { animation:qp-ping    1.4s cubic-bezier(0,0,.2,1) infinite }
  .qp-glow-i { animation:qp-glow-i  2.6s ease-in-out infinite }
  .qp-badge  { animation:qp-badge   3s ease-in-out infinite }

  /* Scroll reveal — wrapper divs only (NOT on state-reactive elements) */
  .qp-reveal { opacity:0; transform:translateY(22px); transition:opacity .55s ease, transform .55s ease }
  .qp-reveal.visible { opacity:1; transform:translateY(0) }
  .qp-reveal-d1 { transition-delay:.07s }
  .qp-reveal-d2 { transition-delay:.14s }
  .qp-reveal-d3 { transition-delay:.21s }
  .qp-reveal-d4 { transition-delay:.28s }
  .qp-reveal-d5 { transition-delay:.35s }

  /* Card hover */
  .qp-card { transition:transform .22s ease, box-shadow .22s ease }
  .qp-card:hover { transform:translateY(-4px); box-shadow:0 20px 48px -10px rgba(0,0,0,.14) }

  /* Primary button */
  .qp-btn { position:relative; overflow:hidden; transition:transform .18s ease, box-shadow .18s ease }
  .qp-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(255,255,255,.14) 0%,transparent 100%); pointer-events:none }
  .qp-btn:hover  { transform:translateY(-1px); box-shadow:0 10px 30px -4px rgba(99,102,241,.48) }
  .qp-btn:active { transform:translateY(0) }

  /* Hero heading — prevent italic descender clip */
  .qp-hero-h1 { overflow:visible !important; padding-bottom:.12em; line-height:1.08 }

  /* FAQ answer collapse via max-height */
  .qp-faq-answer { max-height:0; overflow:hidden; transition:max-height .32s ease }
  .qp-faq-answer.open { max-height:220px }

  /* Divider gradient */
  .qp-divider { height:1px; background:linear-gradient(90deg,transparent,rgba(37,99,235,.25),transparent) }

  /* Comparison table row zebra */
  .qp-zebra:nth-child(even) { background:rgba(37,99,235,.03) }

  /* Premium SaaS Background Patterns */
  .qp-bg-pattern {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image: 
      linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: linear-gradient(to bottom, black 0px, transparent 1000px);
    -webkit-mask-image: linear-gradient(to bottom, black 0px, transparent 1000px);
  }
  .dark .qp-bg-pattern {
    background-image: 
      linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
  }

  .qp-bg-glow {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    height: 800px;
    background: radial-gradient(ellipse at 50% 0%, rgba(79,70,229,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .dark .qp-bg-glow {
    background: radial-gradient(ellipse at 50% 0%, rgba(129,140,248,0.12) 0%, transparent 70%);
  }
`;

/* ─── Scroll reveal hook ──────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.qp-reveal');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Animated counter hook ───────────────────────────────────────────────── */
function useCounter(target, dur = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - t0) / dur, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: .5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [target, dur]);
  return [val, ref];
}



/* ─── Icon helpers ────────────────────────────────────────────────────────── */
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const CheckBlue = ({ brand }) => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill={brand + '22'} />
    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke={brand} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckGreen = () => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill="rgba(5,150,105,.14)" />
    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LANDING COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Landing = () => {
  /* ── State ─────────────────────────────────────────────────────────────── */
  const [isDark,    setIsDark]    = useState(() => localStorage.getItem('qp-theme') === 'dark');
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [billing,   setBilling]   = useState('monthly');
  const [activeFaq, setActiveFaq] = useState(null);

  useReveal();

  /* Persist & apply theme */
  const toggleTheme = () => setIsDark(p => {
    const next = !p;
    localStorage.setItem('qp-theme', next ? 'dark' : 'light');
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return next;
  });

  /* Nav shadow on scroll */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);


  const scrollTo = id => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' }); };

  /* ── Design tokens ─────────────────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────────────
     PREMIUM "MIDNIGHT SLATE INDIGO" PALETTE
     Dark: Linear/Stripe-inspired deep obsidian with indigo glow
     Light: Crisp pure white with warm slate typography & indigo accents
  ───────────────────────────────────────────────────────────────────── */
  const T = isDark ? {
    /* Backgrounds */
    page:         '#030712',          /* Ultra-deep obsidian (like Linear.app) */
    nav:          'rgba(3,7,18,0.95)',
    card:         '#0C111D',          /* Slightly lifted surface */
    card2:        '#111827',          /* Secondary surface */
    /* Borders */
    border:       'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.11)',
    /* Typography */
    t1:           '#F9FAFB',          /* Near-white, warm */
    t2:           '#9CA3AF',          /* Warm gray-400 */
    t3:           '#4B5563',          /* Muted gray-600 */
    /* Brand — lighter indigo on dark bg for contrast */
    brand:        '#818CF8',          /* Indigo-400: readable & vivid */
    brandHov:     '#6366F1',
    brandBg:      'rgba(129,140,248,0.1)',
    brandBorder:  'rgba(129,140,248,0.22)',
    /* Semantic */
    success:      '#34D399',
    successBg:    'rgba(52,211,153,0.1)',
    amber:        '#FCD34D',
    /* Section backgrounds */
    tickerBg:     '#070B14',
    statsBg:      '#030712',
    /* Elevation */
    shadow:       '0 1px 0 rgba(255,255,255,0.04)',
    cardShadow:   '0 4px 32px rgba(0,0,0,0.55)',
    /* Pricing highlight */
    planHighBg:   'linear-gradient(150deg,rgba(129,140,248,.13) 0%,rgba(3,7,18,0.98) 55%)',
    planHighBorder:'rgba(129,140,248,0.36)',
    /* Hero & CTA gradients */
    heroBg:       'radial-gradient(ellipse 75% 60% at 12% -8%, rgba(129,140,248,.13) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 88% 95%, rgba(99,102,241,.09) 0%, transparent 60%), #030712',
    ctaBg:        'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(129,140,248,.10) 0%, transparent 68%), #030712',
    /* Mockup UI */
    mockSidebar:  '#020509',
    mockContent:  '#0C111D',
    mockCard:     '#111827',
    mockText:     '#F9FAFB',
    mockMuted:    'rgba(156,163,175,0.5)',
    /* Headline accent color (solid — NO gradient clip trick) */
    headlineAccent: '#A5B4FC',        /* Indigo-300: crisp on dark bg */
  } : {
    /* Backgrounds */
    page:         '#FFFFFF',          /* Pure white — maximum premium contrast */
    nav:          'rgba(255,255,255,0.95)',
    card:         '#FFFFFF',
    card2:        '#F9FAFB',          /* Warm gray-50 */
    /* Borders */
    border:       '#E5E7EB',          /* Gray-200 warm */
    borderStrong: '#D1D5DB',          /* Gray-300 */
    /* Typography */
    t1:           '#111827',          /* Gray-900 near-black (warm tint) */
    t2:           '#374151',          /* Gray-700 */
    t3:           '#9CA3AF',          /* Gray-400 */
    /* Brand — deep vivid indigo */
    brand:        '#4F46E5',          /* Indigo-600: bold & premium */
    brandHov:     '#4338CA',
    brandBg:      '#EEF2FF',          /* Indigo-50 */
    brandBorder:  '#C7D2FE',          /* Indigo-200 */
    /* Semantic */
    success:      '#059669',
    successBg:    '#D1FAE5',
    amber:        '#D97706',
    /* Section backgrounds */
    tickerBg:     '#F3F4F6',          /* Warm gray-100 */
    statsBg:      '#EEF2FF',          /* Indigo-50 */
    /* Elevation */
    shadow:       '0 1px 0 #E5E7EB, 0 2px 8px rgba(17,24,39,.04)',
    cardShadow:   '0 1px 3px rgba(17,24,39,.08), 0 4px 16px rgba(17,24,39,.04)',
    /* Pricing highlight */
    planHighBg:   'linear-gradient(150deg,#EEF2FF 0%,#FFFFFF 55%)',
    planHighBorder:'#C7D2FE',
    /* Hero & CTA gradients */
    heroBg:       'radial-gradient(ellipse 75% 60% at 12% -8%, rgba(79,70,229,.06) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 88% 95%, rgba(99,102,241,.04) 0%, transparent 60%), #FFFFFF',
    ctaBg:        'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(79,70,229,.05) 0%, transparent 68%), #F5F7FF',
    /* Mockup UI — keep dark sidebar for product realism */
    mockSidebar:  '#111827',
    mockContent:  '#FFFFFF',
    mockCard:     '#F9FAFB',
    mockText:     '#111827',
    mockMuted:    '#9CA3AF',
    /* Headline accent color (solid — NO gradient clip trick) */
    headlineAccent: '#4F46E5',        /* Indigo-600: strong on white bg */
  };

  /* ── Data ──────────────────────────────────────────────────────────────── */
  const navLinks = [
    { label:'Features',     href:'/features'     },
    { label:'Pricing',      href:'/pricing'      },
    { label:'About',        href:'/about'        },
    { label:'Contact',      href:'/contact'      },
  ];

  const plans = [
    {
      id:'starter', name:'Starter', badge:null,
      desc:'Perfect for solo shopkeepers',
      monthly: 499,  annual: 4990,
      terminals: 1,  members: 'Solo',
      features:[
        '1 POS Terminal',
        'Up to 500 products',
        'Real-time inventory tracking',
        'Low stock alerts via email',
        'Daily sales reporting',
        'Owner login with 2FA OTP',
        'Email support (48 h)',
      ],
    },
    {
      id:'growth', name:'Growth', badge:'Most Popular',
      desc:'For growing stores with a small team',
      monthly: 999,  annual: 9990,
      terminals: 3,  members: '3 members',
      features:[
        'Everything in Starter',
        'Up to 3 POS Terminals',
        'Team management (3 members)',
        'Loose product pricing (kg, litre)',
        'Cashier performance reports',
        'Manual AI restocking suggestions',
        'PDF export',
        'Chat support (24 h)',
      ],
    },
    {
      id:'professional', name:'Professional', badge:null,
      desc:'For established stores with full features',
      monthly: 1999, annual: 19990,
      terminals: 5,  members: '5 members',
      features:[
        'Everything in Growth',
        'Up to 5 POS Terminals',
        'Refunds & exchange with credit notes',
        'Automatic AI restocking (8 AM & 8 PM)',
        'Hour-by-hour sales analytics',
        'Supplier management + purchase orders',
        'Loyalty points (basic)',
        'Dedicated support (4–8 h)',
      ],
    },
    {
      id:'enterprise', name:'Enterprise', badge:null,
      desc:'For chains, franchises & multi-location stores',
      monthly: 4999, annual: 49990,
      terminals: 10, members: 'Unlimited',
      features:[
        'Everything in Professional',
        'Up to 5 locations in one dashboard',
        'Unlimited team members',
        'Loyalty program (branded, tiers)',
        'Gift card & customer database',
        'API access for integrations',
        'White-label option',
        'Phone + dedicated account manager',
      ],
    },
  ];

  const features = [
    {
      icon: '🖥️',
      title: 'Bill Customers in Seconds',
      tag: 'Point of Sale',
      desc: 'Use your phone, tablet, or any computer as a billing counter. Search products, add them to cart, apply discounts, and give your customer a proper receipt — no expensive hardware needed.',
    },
    {
      icon: '📦',
      title: 'Always Know Your Stock',
      tag: 'Inventory',
      desc: 'See how much of every item you have — right now. Get an alert before something runs out so you never lose a sale to an empty shelf. Add hundreds of products at once from Excel.',
    },
    {
      icon: '🤖',
      title: 'Smart Reorder Suggestions',
      tag: 'Smart Automation',
      desc: 'The system watches what\'s selling fast and tells you what to reorder — and exactly how much. No more guessing or running out of your best products. Approve the suggestion with one tap.',
    },
    {
      icon: '📊',
      title: 'See Your Business at a Glance',
      tag: 'Reports & Analytics',
      desc: 'Check today\'s earnings, which products are selling most, and your busiest hours — live, from any device. Download a clean report for your accountant or review anytime.',
    },
    {
      icon: '👥',
      title: 'Add Your Team Safely',
      tag: 'Staff Management',
      desc: 'Add your manager and billing staff to the system. Your cashier can only process sales. Your manager can see reports. Only you, the owner, control everything. Everyone stays in their lane.',
    },
    {
      icon: '🔒',
      title: 'Your Data is 100% Private',
      tag: 'Security',
      desc: 'Your shop\'s sales, products, and records are completely private — no other business can ever see them. Your account is protected with a one-time code sent to your email each time you log in.',
    },
    {
      icon: '💳',
      title: 'Pay Month by Month — No Lock-in',
      tag: 'Subscription',
      desc: 'Start with one billing counter. Add more as your business grows. Pay monthly with no long contracts. Change or cancel your plan anytime — no phone calls, no paperwork.',
    },
    {
      icon: '🇮🇳',
      title: 'GST Bills & UPI — Ready to Go',
      tag: 'Made for India',
      desc: 'Every bill has your GSTIN printed correctly, automatically. Accept UPI, debit/credit cards, and cash from day one. No extra setup needed — built for how Indian stores actually run.',
    },
  ];

  const steps = [
    { step:'01', title:'Create your account',        desc:'Register with your business details. Email verified and account activated within minutes.', emoji:'✍️' },
    { step:'02', title:'Add products & terminals',   desc:'Bulk-import your catalog from Excel or add products one by one. Assign terminals to cashiers.', emoji:'📦' },
    { step:'03', title:'Sell, track & grow',         desc:'Process sales on any device. Watch real-time analytics. Let AI optimize restocking automatically.', emoji:'📈' },
  ];

  const faqs = [
    { q:'Do I need special hardware to use QuantPOS?', a:'No. QuantPOS is entirely browser-based. It works on any smartphone, tablet, or laptop you already own. Zero hardware investment required.' },
    { q:'Can I switch plans after signing up?',        a:'Absolutely. Upgrade or downgrade your terminal count anytime. Billing is prorated so you only pay for what you use.' },
    { q:'Is my data safe? Can another store see my records?', a:'Your data is completely isolated from every other business. We use database-level multi-tenancy with full encryption at rest and in transit—bank-grade security.' },
    { q:'How does the 14-day free trial work?',        a:'Sign up and get full access to the Growth plan for 14 days—no credit card required. After that, choose the plan that fits your business.' },
    { q:'How does the AI Restocking Agent work?',      a:'It analyses your historical sales velocity, seasonal patterns, and current stock levels to generate purchase order suggestions automatically. You approve with one click.' },
    { q:'Can I manage multiple store locations?',      a:'Yes. The Enterprise plan supports multi-location management from a single dashboard with separate analytics per location.' },
    { q:'Is QuantPOS GST-compliant for India?',        a:'Yes. GST is built in—GSTIN validation, tax-correct invoices, and HSN/SAC code support are all included from day one.' },
  ];




  /* ── Shared inline styles ────────────────────────────────────────────────── */
  const cardStyle  = { background:T.card,  border:`1px solid ${T.border}`,  boxShadow:T.cardShadow };
  const card2Style = { background:T.card2, border:`1px solid ${T.border}` };

  /* ═════════════════════════════════════════════════════════════════════════
     JSX
  ═════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{animationCSS}</style>

      <div style={{ background:T.page, color:T.t1, transition:'background .3s ease, color .3s ease' }} className={`relative min-h-screen w-full overflow-x-hidden ${isDark ? 'dark' : ''}`}>
        <div className="qp-bg-glow"></div>
        <div className="qp-bg-pattern"></div>

        {/* ══ STICKY NAVBAR ════════════════════════════════════════════════ */}
        <header
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background: scrolled ? T.nav : 'transparent',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            boxShadow: scrolled ? T.shadow : 'none',
          }}
        >
          <div className="max-w-[1280px] mx-auto px-6 md:px-10 h-[64px] flex items-center justify-between">
            <Link to="/"><Wordmark isDark={isDark} size={30} /></Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map(l => (
                <Link key={l.label} to={l.href}
                  className="font-inter text-[13.5px] font-medium transition-colors"
                  style={{ color:T.t2 }}
                  onMouseEnter={e => e.currentTarget.style.color = T.t1}
                  onMouseLeave={e => e.currentTarget.style.color = T.t2}
                >{l.label}</Link>
              ))}
            </nav>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background:T.brandBg, color:T.brand, border:`1px solid ${T.brandBorder}` }}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
              <Link to="/login"
                className="qp-btn font-manrope font-semibold text-[13.5px] text-white px-5 py-2.5 rounded-[9px]"
                style={{ background:T.brand, boxShadow:`0 2px 12px ${T.brand}44` }}
              >Sign In</Link>
            </div>

            {/* Mobile: theme toggle + hamburger */}
            <div className="lg:hidden flex items-center gap-2">
              <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:T.brandBg, color:T.brand }}>
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
              <button onClick={() => setMenuOpen(true)} className="p-2" style={{ color:T.t2 }} aria-label="Open menu">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile overlay */}
        {menuOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ background:T.page, backdropFilter:'blur(24px)' }}>
            <div className="flex items-center justify-between px-6 h-16">
              <Wordmark isDark={isDark} size={28} />
              <button onClick={() => setMenuOpen(false)} style={{ color:T.t2 }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <nav className="flex flex-col items-center gap-8 my-auto">
              {navLinks.map(l => (
                <Link key={l.label} to={l.href} onClick={() => setMenuOpen(false)}
                  className="font-manrope font-semibold text-2xl transition-colors"
                  style={{ color:T.t1 }}
                >{l.label}</Link>
              ))}
            </nav>
            <div className="flex flex-col gap-3 p-6">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="w-full text-center rounded-[9px] py-3.5 font-manrope font-semibold text-[15px]"
                style={{ border:`1px solid ${T.border}`, color:T.t1 }}
              >Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="w-full text-center rounded-[9px] py-3.5 text-white font-manrope font-semibold text-[15px]"
                style={{ background:T.brand, boxShadow:`0 4px 16px ${T.brand}44` }}
              >Start Free Trial</Link>
            </div>
          </div>
        )}

        {/* ══ HERO ════════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 overflow-hidden" style={{ background:T.heroBg }}>
          {/* Ambient blob */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background:`radial-gradient(circle, ${T.brand}14 0%, transparent 70%)`, filter:'blur(40px)' }} />

          <div className="relative z-10 max-w-[820px] mx-auto flex flex-col items-center gap-6">

            {/* Headline — solid color accent (no background-clip:text — browser bug) */}
            <h1 className="qp-hero-h1 font-manrope font-extrabold tracking-tighter text-[40px] md:text-[62px] lg:text-[72px] qp-reveal" style={{ color:T.t1 }}>
              One platform.{' '}
              <br className="hidden sm:block" />
              Every tool your{' '}
              <span
                style={{
                  color: T.headlineAccent,
                  fontStyle: 'italic',
                  display: 'inline',
                }}
              >
                store
              </span>{' '}needs.
            </h1>

            {/* Sub */}
            <p className="font-inter text-[17px] md:text-[19px] max-w-[560px] leading-relaxed qp-reveal qp-reveal-d1" style={{ color:T.t2 }}>
              The all-in-one cloud POS platform built for retail stores,
              restaurants, cafés, and F&amp;B businesses across India.
            </p>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 qp-reveal qp-reveal-d2">
              {['14-day free trial','No credit card needed','Cancel anytime'].map(t => (
                <span key={t} className="flex items-center gap-1.5 font-inter text-[13px]" style={{ color:T.t3 }}>
                  <span style={{ color:T.success }}>✓</span> {t}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 mt-1 qp-reveal qp-reveal-d3">
              <Link to="/register"
                className="qp-btn text-white font-manrope font-semibold text-[15px] rounded-[10px] px-8 py-3.5 flex items-center justify-center gap-2"
                style={{ background:T.brand, boxShadow:`0 4px 20px ${T.brand}40` }}
              >
                Start Free Trial
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </Link>
              <button onClick={() => scrollTo('features')}
                className="font-manrope font-semibold text-[15px] rounded-[10px] px-8 py-3.5 flex items-center justify-center transition-colors"
                style={{ border:`1.5px solid ${T.border}`, color:T.t2, background:'transparent' }}
              >Explore Features</button>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-1 qp-reveal qp-reveal-d4">
              {['Cloud POS','Inventory AI','Real-time Analytics','Multi-terminal','GST Ready','UPI · Card · Cash'].map(f => (
                <span key={f} className="font-inter text-[12px] font-medium rounded-full px-3.5 py-1 transition-colors" style={{ border:`1px solid ${T.border}`, color:T.t3, background:T.card }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative z-10 mt-16 w-full max-w-[1060px] mx-auto qp-reveal qp-reveal-d5">
            <div className="rounded-[16px] overflow-hidden" style={{ border:`1px solid ${T.borderStrong}`, boxShadow:`0 32px 80px -16px rgba(0,0,0,${isDark?.3:.12})` }}>
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ background:T.mockSidebar, borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.1)'}` }}>
                <span className="w-3 h-3 rounded-full bg-[#EF4444]/70"/>
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]/70"/>
                <span className="w-3 h-3 rounded-full bg-[#10B981]/70"/>
                <span className="ml-4 flex-1 text-[10px] rounded-md h-5 flex items-center px-3" style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.2)' }}>app.quantpos.com/dashboard</span>
              </div>
              {/* Mock UI */}
              <div className="grid grid-cols-4" style={{ background:T.mockContent, minHeight:300 }}>
                {/* Sidebar */}
                <div className="col-span-1 hidden sm:flex flex-col gap-1 p-4" style={{ background:T.mockSidebar, borderRight:`1px solid rgba(255,255,255,0.06)` }}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <QPMark size={22}/>
                    <span className="font-manrope font-bold text-[13px] text-white">QuantPOS</span>
                  </div>
                  {['Dashboard','POS Terminal','Inventory','Reports','Team','Settings'].map((item,i) => (
                    <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-[7px] text-[11px] font-manrope font-medium" style={{ background:i===0?`${T.brand}22`:'transparent', color:i===0?T.brand:'rgba(255,255,255,0.4)' }}>
                      <span className="w-3 h-3 rounded bg-white/10 flex-shrink-0"/>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Content */}
                <div className="col-span-4 sm:col-span-3 p-5 flex flex-col gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label:"Today's Sales", val:'₹ 18,450', pos:true,  tag:'+12%' },
                      { label:'Transactions',   val:'84',        pos:true,  tag:'+5%' },
                      { label:'Low Stock',       val:'3 items',   pos:false, tag:'Alert' },
                      { label:'Terminals Active',val:'2 / 3',     pos:true,  tag:'Live' },
                    ].map(s => (
                      <div key={s.label} className="rounded-[8px] p-3" style={{ background:T.mockCard, border:`1px solid ${isDark?'rgba(255,255,255,0.06)':'rgba(15,23,42,0.06)'}` }}>
                        <p className="text-[9px] mb-1" style={{ color:'rgba(148,163,184,0.6)' }}>{s.label}</p>
                        <p className="text-[15px] font-manrope font-bold" style={{ color:T.mockText }}>{s.val}</p>
                        <p className="text-[9px] mt-0.5 font-semibold" style={{ color:s.pos?'#10B981':'#F59E0B' }}>{s.tag}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 rounded-[8px] p-3" style={{ background:T.mockCard, border:`1px solid ${isDark?'rgba(255,255,255,0.06)':'rgba(15,23,42,0.06)'}` }}>
                    <p className="text-[10px] mb-3" style={{ color:'rgba(148,163,184,.6)' }}>Revenue — Last 7 days</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[38,58,44,72,50,88,66].map((h,i) => (
                        <div key={i} className="flex-1 rounded-t-[3px] transition-all" style={{ height:`${h}%`, background:i===5?T.brand:'rgba(148,163,184,0.15)' }}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow below mockup */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-12 rounded-full pointer-events-none" style={{ background:`radial-gradient(ellipse, ${T.brand}28 0%, transparent 70%)`, filter:'blur(16px)' }}/>
          </div>
        </section>



        {/* ══ HOW IT WORKS ════════════════════════════════════════════════ */}
        <section id="howitworks" className="py-24 px-6" style={{ background:T.page }}>
          <div className="max-w-[1080px] mx-auto">
            <div className="text-center mb-14 qp-reveal">
              <span className="inline-block font-inter text-[12px] font-semibold uppercase tracking-[.16em] mb-3" style={{ color:T.brand }}>How It Works</span>
              <h2 className="font-manrope font-extrabold text-[38px] md:text-[50px] leading-tight" style={{ color:T.t1 }}>Up and running in 5 minutes</h2>
              <p className="font-inter text-[16px] mt-4 max-w-[480px] mx-auto" style={{ color:T.t2 }}>No IT team, no hardware procurement, no long contracts. Just sign up and go.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <div key={i} className="qp-reveal" style={{ transitionDelay:`${i * 0.1}s` }}>
                  <div className="qp-card relative flex flex-col p-7 rounded-[14px]" style={cardStyle}>
                    <span className="absolute top-4 right-5 font-manrope font-bold text-[52px] leading-none" style={{ color:`${T.brand}10` }}>{s.step}</span>
                    <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-2xl mb-5" style={{ background:T.brandBg }}>{s.emoji}</div>
                    <h3 className="font-manrope font-bold text-[17px] mb-2" style={{ color:T.t1 }}>{s.title}</h3>
                    <p className="font-inter text-[14px] leading-relaxed" style={{ color:T.t2 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES GRID ════════════════════════════════════════════════ */}
        <section id="features" className="py-24 px-6" style={{ background:isDark ? T.card : '#EFF6FF' }}>
          <div className="max-w-[1080px] mx-auto">
            <div className="text-center mb-14 qp-reveal">
              <span className="inline-block font-inter text-[12px] font-semibold uppercase tracking-[.16em] mb-3" style={{ color:T.brand }}>Everything You Need</span>
              <h2 className="font-manrope font-extrabold text-[38px] md:text-[50px] leading-tight" style={{ color:T.t1 }}>A-to-Z feature coverage</h2>
              <p className="font-inter text-[16px] mt-4 max-w-[500px] mx-auto" style={{ color:T.t2 }}>Every tool a retail or F&amp;B business needs, under one roof.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f, i) => (
                <div key={i} className="qp-reveal" style={{ transitionDelay:`${(i % 4) * 0.08}s` }}>
                  <div className="qp-card relative flex flex-col p-5 rounded-[12px] overflow-hidden h-full" style={cardStyle}>
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background:`linear-gradient(90deg, transparent, ${T.brand}50, transparent)` }}/>
                    <div className="text-2xl mb-3">{f.icon}</div>
                    <span className="font-inter text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color:T.brand }}>{f.tag}</span>
                    <h3 className="font-manrope font-bold text-[15px] mb-2" style={{ color:T.t1 }}>{f.title}</h3>
                    <p className="font-inter text-[13px] leading-relaxed" style={{ color:T.t2 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ USP / COMPARISON ════════════════════════════════════════════ */}
        <section className="py-24 px-6" style={{ background:T.page }}>
          <div className="max-w-[1080px] mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left copy */}
              <div className="qp-reveal">
                <span className="inline-block font-inter text-[12px] font-semibold uppercase tracking-[.16em] mb-4" style={{ color:T.brand }}>Why QuantPOS</span>
                <h2 className="font-manrope font-extrabold text-[36px] md:text-[46px] leading-tight mb-5" style={{ color:T.t1 }}>Built for India's retail reality</h2>
                <p className="font-inter text-[16px] leading-relaxed mb-8" style={{ color:T.t2 }}>
                  Traditional POS systems cost ₹80,000+ upfront with year-long contracts.
                  QuantPOS gives you more—for a fraction of the cost, with the flexibility your business demands.
                </p>
                <div className="flex flex-col gap-4">
                  {[
                    { label:'Zero hardware cost',      sub:'₹0 vs ₹80,000+ for legacy systems' },
                    { label:'AI-driven inventory',     sub:'Reduce stockouts by 40% on autopilot' },
                    { label:'Any device, anywhere',    sub:'Browser-based — no app install needed' },
                    { label:'GST & UPI native',        sub:'Built for India from the ground up' },
                  ].map((u,i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckGreen/>
                      <div>
                        <p className="font-manrope font-semibold text-[15px]" style={{ color:T.t1 }}>{u.label}</p>
                        <p className="font-inter text-[13px]" style={{ color:T.t3 }}>{u.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Comparison table */}
              <div className="qp-reveal qp-reveal-d2">
                <div className="rounded-[14px] overflow-hidden" style={{ border:`1px solid ${T.border}`, boxShadow:T.cardShadow }}>
                  <div className="grid grid-cols-3" style={{ background:T.card2, borderBottom:`1px solid ${T.border}` }}>
                    <div className="p-4 font-inter text-[11px] font-semibold uppercase tracking-wide" style={{ color:T.t3 }}>Feature</div>
                    <div className="p-4 font-inter text-[11px] font-semibold uppercase tracking-wide text-center" style={{ color:T.t3 }}>Legacy POS</div>
                    <div className="p-4 font-inter text-[11px] font-semibold uppercase tracking-wide text-center flex items-center justify-center gap-1" style={{ color:T.brand }}>
                      <QPMark size={14}/> <span>QuantPOS</span>
                    </div>
                  </div>
                  {[
                    ['Setup cost',       '₹80,000+',    '₹0'],
                    ['Monthly fee',      '₹2,000+',     '₹499'],
                    ['Hardware',         'Required',    'None'],
                    ['AI restocking',    'No',          'Yes'],
                    ['Real-time sync',   'Partial',     'Always'],
                    ['Multi-device',     'No',          'Yes'],
                    ['Contract',         '1–3 years',   'Month-to-month'],
                    ['24/7 Support',     'Paid extra',  'Included'],
                  ].map(([feat,legacy,quant],i) => (
                    <div key={i} className="grid grid-cols-3 qp-zebra" style={{ borderBottom:`1px solid ${T.border}`, background:i%2===1?T.card2:T.card }}>
                      <div className="p-3 px-4 font-inter text-[13px]" style={{ color:T.t2 }}>{feat}</div>
                      <div className="p-3 font-inter text-[13px] text-center" style={{ color:T.t3 }}>{legacy}</div>
                      <div className="p-3 font-inter text-[13px] text-center font-semibold" style={{ color:T.success }}>{quant}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ PRICING ══════════════════════════════════════════════════════ */}
        <section id="pricing" className="py-24 px-6" style={{ background:isDark ? T.card : '#EFF6FF' }}>
          <div className="max-w-[1080px] mx-auto">
            <div className="text-center mb-12 qp-reveal">
              <span className="inline-block font-inter text-[12px] font-semibold uppercase tracking-[.16em] mb-3" style={{ color:T.brand }}>Pricing</span>
              <h2 className="font-manrope font-extrabold text-[38px] md:text-[50px] leading-tight" style={{ color:T.t1 }}>Pay as you grow</h2>
              <p className="font-inter text-[16px] mt-4 max-w-[440px] mx-auto" style={{ color:T.t2 }}>Start with 1 terminal. Scale to 10+. No hidden fees, ever.</p>
              {/* Billing toggle */}
              <div className="inline-flex items-center gap-1 mt-8 rounded-[11px] p-1" style={{ background:T.card, border:`1px solid ${T.border}` }}>
                {['monthly','annual'].map(b => (
                  <button key={b} onClick={() => setBilling(b)}
                    className="px-5 py-2 rounded-[8px] font-inter text-[13px] font-medium transition-all"
                    style={{
                      background: billing===b ? T.brand : 'transparent',
                      color:      billing===b ? '#fff'  : T.t2,
                      boxShadow:  billing===b ? `0 2px 8px ${T.brand}44` : 'none',
                    }}
                  >
                    {b==='monthly' ? 'Monthly' : (
                      <span className="flex items-center gap-1.5">
                        Annual
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:`${T.success}20`, color:T.success }}>-20%</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
              {plans.map((plan, i) => {
                const price   = billing==='monthly' ? plan.monthly : Math.round(plan.annual / 12);
                const popular = plan.id==='growth';
                return (
                  <div key={plan.id} className="qp-reveal" style={{ transitionDelay:`${i*0.1}s` }}>
                    <div
                      className="qp-card flex flex-col rounded-[16px] overflow-hidden h-full relative"
                      style={{
                        background:    popular ? T.planHighBg : T.card,
                        border:        `1px solid ${popular ? T.planHighBorder : T.border}`,
                        boxShadow:     popular ? `0 8px 40px ${T.brand}22` : T.cardShadow,
                      }}
                    >
                      {popular && <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background:`linear-gradient(90deg,transparent,${T.brand},transparent)` }}/>}
                      {plan.badge && (
                        <div className="absolute top-4 right-4">
                          <span className="font-inter text-[10px] font-bold uppercase tracking-widest text-white px-2.5 py-1 rounded-full" style={{ background:T.brand }}>
                            {plan.badge}
                          </span>
                        </div>
                      )}
                      <div className="p-7 flex flex-col gap-4 flex-1">
                        <div>
                          <h3 className="font-manrope font-bold text-[18px]" style={{ color:T.t1 }}>{plan.name}</h3>
                          <p className="font-inter text-[13px] mt-1" style={{ color:T.t2 }}>{plan.desc}</p>
                        </div>
                        <div>
                          <div className="flex items-end gap-1.5">
                            <span className="font-manrope font-bold text-[40px] leading-none" style={{ color:T.t1 }}>₹{price.toLocaleString('en-IN')}</span>
                            <span className="font-inter text-[13px] mb-2" style={{ color:T.t3 }}>/month</span>
                          </div>
                          {billing==='annual' && <p className="font-inter text-[11px] font-medium mt-0.5" style={{ color:T.success }}>₹{plan.annual.toLocaleString('en-IN')}/year · Save ~17%</p>}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <div className="inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5" style={{ background:T.brandBg, border:`1px solid ${T.brandBorder}` }}>
                            <svg className="w-3.5 h-3.5" style={{ color:T.brand }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path strokeLinecap="round" d="M8 21h8M12 17v4"/></svg>
                            <span className="font-inter text-[12px]" style={{ color:T.brand }}>{plan.terminals} Terminal{plan.terminals>1?'s':''}</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5" style={{ background:T.brandBg, border:`1px solid ${T.brandBorder}` }}>
                            <svg className="w-3.5 h-3.5" style={{ color:T.brand }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                            <span className="font-inter text-[12px]" style={{ color:T.brand }}>{plan.members}</span>
                          </div>
                        </div>
                        <ul className="flex flex-col gap-2.5 mt-1">
                          {plan.features.map((feat,j) => (
                            <li key={j} className="flex items-start gap-2.5">
                              <CheckBlue brand={T.brand}/>
                              <span className="font-inter text-[13.5px]" style={{ color:T.t2 }}>{feat}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto pt-5">
                          <Link to={plan.id==='enterprise' ? '/contact' : '/register'}
                            className="block w-full text-center rounded-[9px] py-3 font-manrope font-semibold text-[14px] transition-all"
                            style={popular ? {
                              background:T.brand,
                              color:'#fff',
                              boxShadow:`0 4px 16px ${T.brand}44`,
                            } : {
                              border:`1.5px solid ${T.border}`,
                              color:T.t1,
                              background:'transparent',
                            }}
                          >
                            {plan.id==='enterprise' ? 'Contact Sales' : popular ? 'Start Free Trial' : 'Get Started'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-8 qp-reveal">
              <p className="font-inter text-[13px]" style={{ color:T.t3 }}>
                All plans include 14-day free trial · No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </section>


        {/* ══ FAQ ══════════════════════════════════════════════════════════
            FIXED: uses CSS max-height transition instead of conditional
            rendering to avoid React className overwriting qp-reveal 'visible'
        ═══════════════════════════════════════════════════════════════════ */}
        <section id="faq" className="py-24 px-6" style={{ background:isDark ? T.card : '#EFF6FF' }}>
          <div className="max-w-[740px] mx-auto">
            <div className="text-center mb-14 qp-reveal">
              <span className="inline-block font-inter text-[12px] font-semibold uppercase tracking-[.16em] mb-3" style={{ color:T.brand }}>FAQ</span>
              <h2 className="font-manrope font-extrabold text-[38px] md:text-[50px] leading-tight" style={{ color:T.t1 }}>Frequently asked questions</h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, i) => {
                const open = activeFaq === i;
                return (
                  /* Outer wrapper has qp-reveal — stable className, never changes */
                  <div key={i} className="qp-reveal" style={{ transitionDelay:`${i*0.06}s` }}>
                    {/* Inner interactive div — NO qp-reveal so React className updates can't kill it */}
                    <div
                      className="rounded-[12px] overflow-hidden transition-all duration-200"
                      style={{
                        border:     `1px solid ${open ? T.planHighBorder : T.border}`,
                        background: open ? T.planHighBg : T.card,
                        boxShadow:  open ? `0 4px 20px ${T.brand}18` : 'none',
                      }}
                    >
                      <button
                        onClick={() => setActiveFaq(open ? null : i)}
                        className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                      >
                        <span className="font-manrope font-semibold text-[15px]" style={{ color:T.t1 }}>
                          {faq.q}
                        </span>
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200"
                          style={{
                            border:     `1.5px solid ${open ? T.brand : T.border}`,
                            background: open ? T.brandBg : 'transparent',
                            transform:  open ? 'rotate(45deg)' : 'rotate(0deg)',
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.8" style={{ color: open ? T.brand : T.t3 }}>
                            <path strokeLinecap="round" d="M6 2v8M2 6h8"/>
                          </svg>
                        </span>
                      </button>
                      {/* CSS max-height accordion — no conditional render */}
                      <div className={`qp-faq-answer${open?' open':''}`}>
                        <p className="px-6 pb-5 font-inter text-[14px] leading-relaxed" style={{ color:T.t2 }}>
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA ════════════════════════════════════════════════════ */}
        <section className="py-32 px-6 relative overflow-hidden" style={{ background:T.ctaBg }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background:`radial-gradient(circle, ${T.brand}18 0%, transparent 70%)`, filter:'blur(50px)' }}/>
          <div className="relative z-10 max-w-[640px] mx-auto text-center">
            <div className="qp-reveal">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ background:T.brandBg, border:`1px solid ${T.brandBorder}` }}>
                <span className="w-1.5 h-1.5 rounded-full qp-ping inline-block" style={{ background:T.brand }}/>
                <span className="font-inter text-[12.5px] font-medium" style={{ color:T.brand }}>14-day free trial · No card required</span>
              </div>
              <h2 className="font-manrope font-extrabold text-[42px] md:text-[58px] leading-tight mb-5" style={{ color:T.t1 }}>
                Ready to modernize your store?
              </h2>
              <p className="font-inter text-[17px] mb-10 max-w-[460px] mx-auto" style={{ color:T.t2 }}>
                Join us and run your business smarter with QuantPOS.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"
                  className="qp-btn text-white font-manrope font-semibold text-[15px] rounded-[11px] px-9 py-4 flex items-center justify-center gap-2"
                  style={{ background:T.brand, boxShadow:`0 4px 24px ${T.brand}50` }}
                >
                  Start Free Trial — It's Free
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </Link>
                <Link to="/login"
                  className="font-manrope font-semibold text-[15px] rounded-[11px] px-9 py-4 flex items-center justify-center transition-colors"
                  style={{ border:`1.5px solid ${T.border}`, color:T.t1 }}
                >Sign In to Dashboard</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
        <footer className="px-6 pt-14 pb-8" style={{ borderTop:`1px solid ${T.border}`, background:isDark?'#04090F':T.card }}>
          <div className="max-w-[1080px] mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
              <div className="lg:col-span-2">
                <div className="mb-4"><Wordmark isDark={isDark} size={28}/></div>
                <p className="font-inter text-[13px] leading-relaxed max-w-[240px] mb-5" style={{ color:T.t3 }}>
                  Cloud-native POS and inventory management for retail &amp; F&amp;B businesses across India.
                </p>
                <div className="flex gap-3">
                  {['𝕏','in','📸'].map(s => (
                    <div key={s} className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[12px] cursor-pointer transition-colors" style={{ border:`1px solid ${T.border}`, color:T.t3 }}>{s}</div>
                  ))}
                </div>
              </div>
              {[
                { title:'Product', links:[['Features','/features'],['Pricing','/pricing'],['How It Works','/how-it-works'],['Changelog','/changelog'],['Status','/status']] },
                { title:'Company', links:[['About','/about'],['Blog','/blog'],['Careers','/careers'],['Press Kit','/press-kit'],['Contact','/contact']] },
                { title:'Legal',   links:[['Privacy Policy','/privacy-policy'],['Terms of Service','/terms-of-service'],['Cookie Policy','/cookie-policy'],['GDPR','/gdpr']] },
              ].map(col => (
                <div key={col.title}>
                  <h4 className="font-manrope font-semibold text-[13px] mb-4" style={{ color:T.t1 }}>{col.title}</h4>
                  <ul className="flex flex-col gap-2.5">
                    {col.links.map(([label, href]) => (
                      <li key={label}><Link to={href} className="font-inter text-[13px] transition-colors hover:text-[#7b39fc]" style={{ color:T.t3 }}>{label}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}

            </div>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop:`1px solid ${T.border}` }}>
              <p className="font-inter text-[12px]" style={{ color:T.t3 }}>© 2026 QuantPOS Technologies Inc. · Built for Indian retail.</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background:T.success }}/>
                <span className="font-inter text-[12px]" style={{ color:T.t3 }}>All systems operational</span>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
};

export default Landing;
