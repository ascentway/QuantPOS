import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { authApi } from '../../api/authApi';
import { notificationApi } from '../../api/notificationApi';
import { QPMark, Wordmark } from '../ui/Wordmark';

// ─── Icon primitive ───────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, sw = 1.6, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    className={className} style={style}>
    <path d={d} />
  </svg>
);

// ─── Icon paths ───────────────────────────────────────────────────────────────
const PATHS = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  pos: 'M3 10h18M3 14h18M9 6h6M9 18h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z',
  inventory: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  reports: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  staff: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  customers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  chevLeft: 'M15 18l-6-6 6-6',
  chevRight: 'M9 18l6-6-6-6',
  profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01',
  sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z',
  moon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
};

const NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: null },
  { label: 'POS Terminal', path: '/dashboard/pos', icon: 'pos', roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { label: 'Inventory', path: '/dashboard/inventory', icon: 'inventory', roles: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
  { label: 'Label Printer', path: '/dashboard/labels', icon: 'tag', roles: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
  { label: 'Reports', path: '/dashboard/reports', icon: 'reports', roles: ['OWNER', 'MANAGER'] },
  { label: 'Staff', path: '/dashboard/staff', icon: 'staff', roles: ['OWNER', 'MANAGER'] },
  { label: 'Customers', path: '/dashboard/customers', icon: 'customers', roles: ['OWNER', 'MANAGER'] },
  { label: 'Settings', path: '/dashboard/settings', icon: 'settings', roles: ['OWNER'] },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/pos': 'Point of Sale',
  '/dashboard/inventory': 'Inventory',
  '/dashboard/labels': 'Label Printer',
  '/dashboard/reports': 'Reports & Analytics',
  '/dashboard/staff': 'Staff & Terminals',
  '/dashboard/customers': 'Customers',
  '/dashboard/settings': 'Settings',
  '/dashboard/profile': 'My Profile',
};

// ─── NavItem ──────────────────────────────────────────────────────────────────
const NavItem = ({ item, collapsed, active }) => (
  <Link
    to={item.path}
    title={collapsed ? item.label : undefined}
    className="relative flex items-center gap-3 rounded-[10px] transition-all duration-150 group"
    style={{
      padding: collapsed ? '10px 0' : '10px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      background: active ? 'var(--sidebar-active-bg)' : 'transparent',
      color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text-muted)',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--sidebar-nav-hover)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    {/* Active left bar */}
    {active && (
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
        style={{ background: 'var(--accent)' }}
      />
    )}

    {/* Icon  always visible */}
    <Icon
      d={PATHS[item.icon]}
      size={18}
      sw={active ? 2.1 : 1.6}
      style={{ flexShrink: 0, color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text-muted)' }}
    />

    {/* Label  only when expanded */}
    {!collapsed && (
      <span
        className="font-manrope font-medium text-[13.5px] leading-none whitespace-nowrap"
        style={{ color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text-muted)' }}
      >
        {item.label}
      </span>
    )}

    {/* Floating tooltip when collapsed */}
    {collapsed && (
      <span
        className="absolute left-full ml-3 px-2.5 py-1.5 rounded-[7px] text-[12px] font-manrope whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50"
        style={{
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}
      >
        {item.label}
      </span>
    )}
  </Link>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAuth, user } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (err) {
      // Ignore errors - still clear local state even if API call fails
      console.warn('Logout API call failed:', err);
    }
    clearAuth();
    navigate('/login');
  };

  const initials = (user?.fullName || user?.email || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0 overflow-hidden relative"
      style={{
        width: collapsed ? '68px' : '240px',
        transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border, var(--border))',
        zIndex: 30,
      }}
    >
      {/* ── Logo & collapse arrow ────────────────────────────────────────── */}
      <div
        className="flex items-center flex-shrink-0 relative"
        style={{
          height: '64px',
          padding: collapsed ? '0' : '0 16px',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--sidebar-border, var(--border))',
        }}
      >
        {/* Logo  click to toggle */}
        <button
          onClick={onToggle}
          className="flex items-center select-none focus:outline-none group"
          title={collapsed ? 'Expand sidebar' : undefined}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            width: collapsed ? '100%' : 'auto',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? '0' : '10px'
          }}
        >
          {/* Logo mark  always visible in collapsed state */}
          {collapsed ? (
            <div className="transition-transform duration-150 group-hover:scale-105 flex items-center justify-center w-full">
              <QPMark size={36} />
            </div>
          ) : (
            /* Wordmark  visible when expanded */
            <div className="transition-transform duration-150 group-hover:scale-[1.02]">
              <Wordmark height={28} />
            </div>
          )}
        </button>

        {/* Collapse arrow  only when expanded */}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="w-7 h-7 flex items-center justify-center rounded-[7px] transition-all duration-150 flex-shrink-0"
            title="Collapse sidebar"
            style={{ color: 'var(--sidebar-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-nav-hover)'; e.currentTarget.style.color = 'var(--sidebar-text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text-muted)'; }}
          >
            <Icon d={PATHS.chevLeft} size={14} sw={2} />
          </button>
        )}
      </div>

      {/* ── Nav section label ────────────────────────────────────────────── */}
      {!collapsed && (
        <p
          className="px-5 pt-5 pb-2 font-inter font-semibold uppercase tracking-[0.1em]"
          style={{ fontSize: '10px', color: 'var(--sidebar-text-muted)', opacity: 0.6 }}
        >
          Navigation
        </p>
      )}
      {collapsed && <div style={{ height: '16px' }} />}

      {/* ── Nav links ────────────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto flex flex-col scrollbar-none"
        style={{
          padding: collapsed ? '0 10px' : '0 10px',
          gap: '2px',
        }}
      >
        {NAV
          .filter(i => !i.roles || i.roles.includes(user?.role))
          .map(item => {
            const active =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return <NavItem key={item.path} item={item} collapsed={collapsed} active={active} />;
          })}
      </nav>

      {/* ── Bottom user area ─────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--sidebar-border, var(--border))', padding: '12px 10px', flexShrink: 0 }}>
        {collapsed ? (
          /* Collapsed: stack avatar + logout icon */
          <div className="flex flex-col items-center gap-2">
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-manrope font-bold"
              style={{
                fontSize: '11px',
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
              }}
              title={user?.fullName || 'User'}
            >
              {initials}
            </div>
            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-center w-9 h-9 rounded-[8px] transition-all duration-150"
              title="Sign out"
              style={{ color: 'var(--sidebar-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--sidebar-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon d={PATHS.logout} size={17} />
            </button>
          </div>
        ) : (
          /* Expanded: user card + profile + logout */
          <div className="flex flex-col gap-1">
            {/* User card */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] mb-1"
              style={{ background: 'var(--sidebar-nav-hover)', border: '1px solid var(--sidebar-border, var(--border))' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-manrope font-bold"
                style={{ fontSize: '11px', background: 'var(--sidebar-accent-subtle, var(--accent-subtle))', color: 'var(--sidebar-accent, var(--accent))' }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="font-manrope font-semibold truncate"
                  style={{ fontSize: '13px', color: 'var(--sidebar-text-primary)', lineHeight: 1.3 }}
                >
                  {user?.fullName || 'User'}
                </p>
                <p
                  className="font-inter truncate"
                  style={{ fontSize: '11px', color: 'var(--sidebar-text-muted)' }}
                >
                  {user?.role || 'Owner'}
                </p>
              </div>
              {/* Online dot */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}
              />
            </div>

            {/* Profile link */}
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px] transition-all duration-150"
              style={{ color: 'var(--sidebar-text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-nav-hover)'; e.currentTarget.style.color = 'var(--sidebar-text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text-muted)'; }}
            >
              <Icon d={PATHS.profile} size={15} />
              <span className="font-manrope font-medium" style={{ fontSize: '13px' }}>My Profile</span>
            </Link>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px] transition-all duration-150 text-left"
              style={{ color: 'var(--sidebar-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--sidebar-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon d={PATHS.logout} size={15} />
              <span className="font-manrope font-medium" style={{ fontSize: '13px' }}>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface border border-theme rounded-[16px] overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-theme">
              <h3 className="font-manrope font-bold text-[18px] text-text-primary">Sign Out</h3>
              <p className="font-inter text-[13px] text-text-muted mt-1">Are you sure you want to sign out?</p>
            </div>
            <div className="px-6 py-5 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 bg-card2 hover:bg-white/10 text-text-primary border border-theme font-manrope font-semibold text-[13px] py-3 rounded-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 bg-danger hover:bg-danger/90 text-white font-manrope font-semibold text-[13px] py-3 rounded-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing Out...</span>
                  </>
                ) : (
                  'Sign Out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

// ─── Live clock + date display ────────────────────────────────────────────────
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="hidden md:flex flex-col items-end" style={{ lineHeight: 1.2 }}>
      <span
        className="font-manrope font-bold tabular-nums"
        style={{ fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
      >
        {timeStr}
      </span>
      <span
        className="font-inter"
        style={{ fontSize: '11px', color: 'var(--text-muted)' }}
      >
        {dateStr}
      </span>
    </div>
  );
};

// ─── Theme toggle button ──────────────────────────────────────────────────────
const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-[8px] transition-all duration-200"
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--card2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      <Icon d={isDark ? PATHS.sun : PATHS.moon} size={17} sw={1.8} />
    </button>
  );
};

// ─── Notification Bell ────────────────────────────────────────────────────────
const getNotificationTitle = (type) => {
  switch (type) {
    case 'APPROVAL_NEEDED': return 'Approval Required';
    case 'APPROVAL_RESULT': return 'Approval Update';
    case 'LOW_STOCK': return 'Low Stock Alert';
    case 'EXPIRY': return 'Expiry Warning';
    default: return 'Notification';
  }
};

const getNotificationVisuals = (type) => {
  switch (type) {
    case 'APPROVAL_NEEDED':
      return {
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      };
    case 'APPROVAL_RESULT':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      };
    case 'LOW_STOCK':
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      };
    case 'EXPIRY':
      return {
        bg: 'bg-red-500/10 text-red-400 border-red-500/20',
        path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      };
    default:
      return {
        bg: 'bg-accent/10 text-accent border-accent/20',
        path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      };
  }
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getUnreadNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (e) { /* silent */ }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) { /* silent */ }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAllAsRead();
      setNotifications([]);
    } catch (e) { /* silent */ }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-[8px] transition-all duration-150"
        style={{ color: 'var(--text-muted)', background: open ? 'var(--card2)' : 'transparent', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = 'var(--card2)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
      >
        <Icon d={PATHS.bell} size={17} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent)' }}></span>
            <span 
              className="relative inline-flex rounded-full h-4.5 w-4.5 text-[9px] font-bold text-white items-center justify-center shadow-md shadow-accent/20" 
              style={{ background: 'var(--accent)', border: '1px solid var(--surface)' }}
            >
              {notifications.length}
            </span>
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            className="absolute right-0 top-[120%] w-[340px] rounded-[16px] shadow-2xl z-50 flex flex-col overflow-hidden border border-theme"
            style={{ background: 'var(--surface)' }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-manrope font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="font-manrope text-[11.5px] font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1.5"
                >
                  <Icon d="M9 12l2 2 4-4" size={13} sw={2} />
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-theme" style={{ borderColor: 'var(--border)' }}>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                  <span className="text-3xl opacity-35 mb-2">🔔</span>
                  <p className="font-manrope font-semibold text-[13px]" style={{ color: 'var(--text-muted)' }}>All caught up!</p>
                  <p className="font-inter text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>No unread notifications.</p>
                </div>
              ) : (
                notifications.map(n => {
                  const visuals = getNotificationVisuals(n.type);
                  return (
                    <div key={n.id} className="px-4 py-3 flex items-start gap-3 hover:bg-[var(--card2)] transition-colors relative group">
                      <div className={`p-1.5 rounded-[8px] border flex-shrink-0 ${visuals.bg}`}>
                        <Icon d={visuals.path} size={15} sw={2} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-manrope font-bold text-[13px]" style={{ color: 'var(--text-primary)' }}>{getNotificationTitle(n.type)}</p>
                          <span className="font-inter text-[10px] whitespace-nowrap opacity-60" style={{ color: 'var(--text-muted)' }}>
                            {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="font-inter text-[12px] leading-relaxed mt-0.5 break-words" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                        <p className="font-inter text-[9.5px] mt-1 opacity-50" style={{ color: 'var(--text-muted)' }}>
                          {new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      <button 
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:scale-105 transition-all text-text-muted hover:text-danger p-1 rounded-full hover:bg-[var(--card2)] border border-theme shadow-sm flex-shrink-0 self-center"
                        title="Mark as read"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Icon d="M6 18L18 6M6 6l12 12" size={12} sw={2} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

// ─── Topbar ───────────────────────────────────────────────────────────────────
const Topbar = ({ title }) => {
  const { user } = useAuthStore();
  const initials = (user?.fullName || user?.email || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header
      className="flex items-center justify-between flex-shrink-0"
      style={{
        height: '64px',
        padding: '0 24px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left  page title */}
      <div className="min-w-0">
        <h1
          className="font-manrope font-bold truncate"
          style={{ fontSize: '17px', color: 'var(--text-primary)', lineHeight: 1 }}
        >
          {title}
        </h1>
      </div>

      {/* Right - clock, theme toggle, bell, avatar */}
      <div className="flex items-center gap-2">

        {/* Notification bell */}
        <NotificationBell />

        {/* Theme toggle */}
        <ThemeToggle />

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />

        {/* Live clock */}
        <LiveClock />

      </div>
    </header>
  );
};

// ─── DashboardLayout ──────────────────────────────────────────────────────────
const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, updateUser } = useAuthStore();
  const { theme, initTheme } = useThemeStore();

  // Sync theme on mount
  useEffect(() => {
    if (initTheme) initTheme();
  }, []);

  // Sync user profile on mount
  useEffect(() => {
    authApi.getMe()
      .then(res => { if (res.success && res.data) updateUser(res.data); })
      .catch(() => {/* silent */ });
  }, []);

  const title = PAGE_TITLES[location.pathname] || 'QuantPOS';

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} />

        {/* Subscription inactive banner */}
        {user?.subscriptionStatus === 'INACTIVE' && (
          <div
            className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-[12px] px-4 py-3 flex-shrink-0"
            style={{
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <Icon d={PATHS.warning} size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <p className="font-inter" style={{ fontSize: '13px', color: 'var(--warning)' }}>
                Your subscription is inactive. Activate to unlock POS terminals and full features.
              </p>
            </div>
            <Link
              to="/dashboard/settings"
              className="font-manrope font-semibold whitespace-nowrap px-3 py-1.5 rounded-[8px] transition-all duration-150"
              style={{ fontSize: '13px', background: 'var(--warning)', color: '#fff' }}
            >
              Activate Plan
            </Link>
          </div>
        )}

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto scrollbar-thin relative"
          style={{ background: 'var(--bg)' }}
        >
          {/* Subtle radial glow at top */}
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 h-28 z-0"
            style={{
              background: 'radial-gradient(ellipse 60% 100% at 50% -10%, var(--accent-subtle) 0%, transparent 70%)',
              opacity: 0.45,
            }}
          />
          <div className="relative z-10 p-5 lg:p-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
