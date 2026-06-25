import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inventoryApi } from '../api/inventoryApi';
import useAuthStore from '../store/authStore';

// ─── SVG Icon primitive ────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, sw = 1.6, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    className={className} style={style}>
    <path d={d} />
  </svg>
);

// ─── Skeleton pulse block ─────────────────────────────────────────────────────
const Skeleton = ({ className = '', style = {} }) => (
  <div
    className={`rounded-[6px] animate-pulse ${className}`}
    style={{ background: 'var(--border)', ...style }}
  />
);

// ─── KPI card configs (icons + labels only  no values) ───────────────────────
const KPI_CONFIG = [
  {
    id: 'revenue',
    label: "Today's Revenue",
    prefix: '₹',
    suffix: '',
    color: 'var(--accent)',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    id: 'txns',
    label: 'Transactions',
    prefix: '',
    suffix: '',
    color: 'var(--success)',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    id: 'aov',
    label: 'Avg. Order Value',
    prefix: '₹',
    suffix: '',
    color: 'var(--warning)',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    id: 'products',
    label: 'Total Products',
    prefix: '',
    suffix: '',
    color: 'var(--danger)',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ config, value, loading }) => (
  <div
    className="relative flex flex-col gap-4 rounded-[14px] p-5 overflow-hidden border"
    style={{
      background: 'var(--surface)',
      borderColor: 'var(--border)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    }}
  >
    {/* Accent top bar */}
    <div className="absolute top-0 left-5 right-5 h-[2px] rounded-b-full opacity-70"
      style={{ background: config.color }} />

    {/* Header */}
    <div className="flex items-start justify-between">
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
        style={{ background: config.color + '18' }}
      >
        <Icon d={config.icon} size={17} sw={1.8} style={{ color: config.color }} />
      </div>
      {/* Sparkline placeholder  empty without data */}
      <div className="w-[80px] h-[36px] flex items-end justify-end">
        {loading && <Skeleton className="w-full h-4" />}
      </div>
    </div>

    {/* Value */}
    <div>
      <p className="font-inter text-[12px] font-medium mb-0.5"
        style={{ color: 'var(--text-muted)' }}>
        {config.label}
      </p>
      {loading ? (
        <Skeleton className="h-7 w-24 mt-1" />
      ) : value === null ? (
        <p className="font-inter text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
          No data yet
        </p>
      ) : (
        <p className="font-manrope font-bold text-[28px] leading-none"
          style={{ color: 'var(--text-primary)' }}>
          {config.prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{config.suffix}
        </p>
      )}
    </div>

    {/* Delta badge  only shown when there's data */}
    {!loading && value !== null && (
      <div className="flex items-center gap-1.5">
        <span
          className="font-inter text-[11px] px-2 py-0.5 rounded-full"
          style={{ color: 'var(--text-muted)', background: 'var(--card2)' }}
        >
          Sales API not connected yet
        </span>
      </div>
    )}
    {!loading && value === null && (
      <div className="flex items-center gap-1.5">
        <span
          className="font-inter text-[11px] px-2 py-0.5 rounded-full"
          style={{ color: 'var(--text-muted)', background: 'var(--card2)' }}
        >
          Awaiting sales data
        </span>
      </div>
    )}
  </div>
);

// ─── Revenue Chart Empty State ────────────────────────────────────────────────
const RevenueChart = ({ loading }) => {
  const user = useAuthStore(s => s.user);
  const canAccessPos = ['OWNER', 'MANAGER', 'CASHIER'].includes(user?.role);

  return (
    <div className="rounded-[14px] border p-6 flex flex-col gap-5 h-full"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-manrope font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
            Revenue Overview
          </h3>
          <p className="font-inter text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            This week vs last week
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-end gap-2 h-[160px]">
          {[40, 70, 55, 85, 60, 90, 75].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <Skeleton style={{ height: `${h}%`, width: '100%', borderRadius: '4px 4px 0 0' }} />
              <Skeleton className="w-6 h-2 mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 py-10 gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--card2)' }}>
            <Icon
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              size={22} sw={1.5} style={{ color: 'var(--text-muted)' }}
            />
          </div>
          <p className="font-manrope font-semibold text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            No revenue data yet
          </p>
          <p className="font-inter text-[12px] text-center max-w-[240px]" style={{ color: 'var(--text-muted)' }}>
            {canAccessPos 
              ? "Revenue chart will populate once you start processing sales through the POS terminal."
              : "Revenue chart will populate once sales data is recorded."}
          </p>
          {/* POS link removed as per owner requirements */}
        </div>
      )}
    </div>
  );
};

// ─── Top Products ─────────────────────────────────────────────────────────────
const TopProducts = ({ products, loading }) => {
  const maxPricePaise = products.length > 0 ? Math.max(...products.map(p => p.pricePaise || 0)) : 1;

  return (
    <div className="rounded-[14px] border p-5 flex flex-col gap-4 h-full"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <h3 className="font-manrope font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
          Products in Inventory
        </h3>
        <Link to="/dashboard/inventory"
          className="font-inter text-[12px] font-medium transition-colors"
          style={{ color: 'var(--accent)' }}>
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3.5 w-14" />
              </div>
              <Skeleton className="h-1.5 w-full ml-6" style={{ width: 'calc(100% - 1.5rem)' }} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-8 gap-3">
          <span className="text-3xl opacity-30">📦</span>
          <p className="font-manrope font-semibold text-[13px]" style={{ color: 'var(--text-muted)' }}>
            No products added yet
          </p>
          <Link to="/dashboard/inventory"
            className="font-inter text-[12px] font-medium transition-colors"
            style={{ color: 'var(--accent)' }}>
            Add your first product →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {products.slice(0, 5).map((p, i) => {
            const pct = maxPricePaise > 0 ? Math.round((p.pricePaise / maxPricePaise) * 100) : 0;
            const priceRupees = ((p.pricePaise || 0) / 100).toFixed(2);
            return (
              <div key={p.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-manrope font-bold text-[11px] w-4 flex-shrink-0"
                      style={{ color: 'var(--text-muted)' }}>
                      {i + 1}
                    </span>
                    <span className="font-inter text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {p.name}
                    </span>
                  </div>
                  <span className="font-manrope font-semibold text-[13px] flex-shrink-0 ml-2"
                    style={{ color: 'var(--text-primary)' }}>
                    ₹{priceRupees}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'var(--accent)', opacity: 0.6 + i * 0.08 }} />
                  </div>
                  <span className="font-inter text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {p.productType === 'LOOSE' ? 'Loose' : 'Std'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Recent Transactions ──────────────────────────────────────────────────────
const RecentTransactions = ({ loading }) => {
  const user = useAuthStore(s => s.user);
  const canAccessPos = ['OWNER', 'MANAGER', 'CASHIER'].includes(user?.role);

  return (
    <div className="rounded-[14px] border overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="font-manrope font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
            Recent Transactions
          </h3>
          <p className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Today's sales activity
          </p>
        </div>
        <Link to="/dashboard/reports"
          className="font-inter text-[12px] font-medium transition-colors"
          style={{ color: 'var(--accent)' }}>
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="p-6 flex flex-col gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="h-3.5 w-8" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-16 ml-auto" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-14 gap-4 px-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--card2)' }}>
            <Icon
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              size={24} sw={1.4} style={{ color: 'var(--text-muted)' }}
            />
          </div>
          <div className="text-center">
            <p className="font-manrope font-semibold text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              No transactions yet
            </p>
            <p className="font-inter text-[12px] mt-1 max-w-[260px] mx-auto" style={{ color: 'var(--text-muted)' }}>
              {canAccessPos
                ? "Completed sales will appear here once you process transactions through the POS terminal."
                : "Completed sales will appear here once transactions are processed."}
            </p>
          </div>
          {canAccessPos && (
            <Link to="/dashboard/pos"
              className="flex items-center gap-2 font-manrope font-semibold text-[13px] text-white px-5 py-2.5 rounded-[9px] transition-all"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 2px 12px rgba(79,70,229,0.30)',
              }}>
              <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={14} />
              Open POS Terminal
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    label: 'New Sale', desc: 'Open POS terminal', to: '/dashboard/pos',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    accent: true,
  },
  {
    label: 'Add Product', desc: 'Manage inventory', to: '/dashboard/inventory',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    accent: false,
  },
  {
    label: 'View Reports', desc: 'Analytics & insights', to: '/dashboard/reports',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    accent: false,
  },
];

// ─── Dashboard page ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const user = useAuthStore(s => s.user);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const userName = user?.fullName?.split(' ')[0] || '';

  // Fetch real products from inventory API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await inventoryApi.getAllProducts();
        if (res.success) {
          setProducts(res.data || []);
        }
      } catch {
        // silently fail  show empty state
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    load();
  }, []);

  // KPI values  null means no data available (sales API not built yet)
  const kpiValues = {
    revenue: null,     // awaiting sales API
    txns: null,        // awaiting sales API
    aov: null,         // awaiting sales API
    products: productsLoading ? undefined : products.length,  // real count
  };

  const getQuickActions = () => {
    if (user?.role === 'OWNER' || user?.role === 'MANAGER') {
      return [];
    } else if (user?.role === 'CASHIER') {
      return [
        {
          label: 'New Sale', desc: 'Open POS terminal', to: '/dashboard/pos',
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
          accent: true,
        },
        {
          label: 'My Profile', desc: 'View profile settings', to: '/dashboard/profile',
          icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
          accent: false,
        }
      ];
    } else if (user?.role === 'EMPLOYEE') {
      return [
        {
          label: 'Add Product', desc: 'Manage inventory', to: '/dashboard/inventory',
          icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
          accent: true,
        },
        {
          label: 'Adjust Stock', desc: 'Request stock adjustment', to: '/dashboard/inventory',
          icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
          accent: false,
        },
        {
          label: 'My Profile', desc: 'View profile settings', to: '/dashboard/profile',
          icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
          accent: false,
        }
      ];
    }
    return [];
  };

  const quickActions = getQuickActions();

  return (
    <div className="max-w-[1440px] mx-auto px-1 py-1 space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-manrope font-bold text-[22px] leading-tight"
            style={{ color: 'var(--text-primary)' }}>
            {greeting}{userName ? `, ${userName}` : ''} 👋
          </h2>
        </div>

        {/* Dynamic Header CTA */}
        {['OWNER', 'MANAGER', 'CASHIER'].includes(user?.role) ? (
          <Link to="/dashboard/pos"
            className="flex items-center gap-2 font-manrope font-semibold text-[13px] text-white px-4 py-2 rounded-[9px] transition-all"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 2px 12px rgba(79,70,229,0.35)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={14} />
            Open POS
          </Link>
        ) : user?.role === 'EMPLOYEE' ? (
          <Link to="/dashboard/inventory"
            className="flex items-center gap-2 font-manrope font-semibold text-[13px] text-white px-4 py-2 rounded-[9px] transition-all"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 2px 12px rgba(79,70,229,0.35)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" size={14} />
            Adjust Stock
          </Link>
        ) : null}
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CONFIG.map(config => (
          <KpiCard
            key={config.id}
            config={config}
            value={kpiValues[config.id] === undefined ? null : kpiValues[config.id]}
            loading={config.id === 'products' ? productsLoading : false}
          />
        ))}
      </div>

      {/* ── Main body ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className={user?.role === 'OWNER' ? "xl:col-span-3 relative" : "xl:col-span-2 relative"}>
          <RevenueChart loading={false} />
        </div>
        {user?.role !== 'OWNER' && <TopProducts products={products} loading={productsLoading} />}
      </div>

      {/* ── Quick actions strip ───────────────────────────────────────────────── */}
      {quickActions.length > 0 && (
        <div className={`grid grid-cols-1 ${quickActions.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
          {quickActions.map(a => (
            <Link key={a.label} to={a.to}
              className="flex items-center gap-4 p-4 rounded-[14px] border group transition-all"
              style={{
                background: a.accent ? 'var(--accent)' : 'var(--surface)',
                borderColor: a.accent ? 'transparent' : 'var(--border)',
                boxShadow: a.accent ? '0 4px 20px rgba(79,70,229,0.3)' : 'none',
              }}
              onMouseEnter={e => {
                if (a.accent) e.currentTarget.style.background = 'var(--accent-hover)';
                else e.currentTarget.style.background = 'var(--card2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = a.accent ? 'var(--accent)' : 'var(--surface)';
              }}
            >
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{
                  background: a.accent ? 'rgba(255,255,255,0.15)' : 'var(--accent-subtle)',
                }}>
                <Icon d={a.icon} size={18} sw={1.6}
                  style={{ color: a.accent ? '#fff' : 'var(--accent)' }} />
              </div>
              <div>
                <p className="font-manrope font-semibold text-[14px]"
                  style={{ color: a.accent ? '#fff' : 'var(--text-primary)' }}>
                  {a.label}
                </p>
                <p className="font-inter text-[12px]"
                  style={{ color: a.accent ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)' }}>
                  {a.desc}
                </p>
              </div>
              <Icon d="M9 18l6-6-6-6" size={14} sw={2}
                className="ml-auto transition-transform group-hover:translate-x-1"
                style={{ color: a.accent ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }} />
            </Link>
          ))}
        </div>
      )}

      {/* ── Recent Transactions ─────────────────────────────────────────────── */}
      <RecentTransactions loading={false} />

      <div className="h-4" />
    </div>
  );
};

export default Dashboard;
