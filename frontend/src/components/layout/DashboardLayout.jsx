import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, strokeWidth = 1.6, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

const icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  pos:       'M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z',
  inventory: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  reports:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  customers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  settings:  'M12 20.25c4.28 0 7.75-3.47 7.75-7.75S16.28 4.75 12 4.75 4.25 8.22 4.25 12.5s3.47 7.75 7.75 7.75zM12 14.5a2 2 0 100-4 2 2 0 000 4z',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  bell:      'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  logout:    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu:      'M4 6h16M4 12h16M4 18h16',
};

const NAV_ITEMS = [
  { label: 'Dashboard',   path: '/dashboard',           icon: 'dashboard',  roles: null },
  { label: 'POS Terminal', path: '/dashboard/pos',      icon: 'pos',        roles: null },
  { label: 'Inventory',   path: '/dashboard/inventory', icon: 'inventory',  roles: ['OWNER', 'MANAGER'] },
  { label: 'Reports',     path: '/dashboard/reports',   icon: 'reports',    roles: ['OWNER', 'MANAGER'] },
  { label: 'Customers',   path: '/dashboard/customers', icon: 'customers',  roles: ['OWNER', 'MANAGER'] },
  { label: 'Settings',    path: '/dashboard/settings',  icon: 'settings',   roles: ['OWNER'] },
];

// ─── Logo ─────────────────────────────────────────────────────────────────────
const Logo = ({ collapsed }) => (
  <Link to="/dashboard" className="flex items-center gap-2.5 select-none group">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="flex-shrink-0">
      <path d="M1.04356 6.35771L13.6437 0.666504L26.2438 6.35771L26.2438 17.7401L13.6437 23.4313L1.04356 17.7401L1.04356 6.35771Z" fill="white" />
      <path d="M6.04356 10.35771L13.6437 6.666504L21.2438 10.35771L21.2438 15.7401L13.6437 19.4313L6.04356 15.7401L6.04356 10.35771Z" fill="#5757f8" />
    </svg>
    {!collapsed && (
      <span className="font-manrope font-bold text-[17px] text-white tracking-tight">QuantPOS</span>
    )}
  </Link>
);

// ─── Nav Item ─────────────────────────────────────────────────────────────────
const NavItem = ({ item, collapsed, active }) => (
  <Link
    to={item.path}
    title={collapsed ? item.label : undefined}
    className={`
      relative flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all duration-150 group
      ${active
        ? 'bg-[#5757f8]/15 text-[#5757f8]'
        : 'text-white/50 hover:text-white hover:bg-white/5'
      }
    `}
  >
    {/* Active left bar */}
    {active && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#5757f8] rounded-r-full" />
    )}
    <Icon d={icons[item.icon]} size={18} strokeWidth={active ? 2 : 1.6} />
    {!collapsed && (
      <span className="font-manrope font-medium text-[13.5px] leading-none">{item.label}</span>
    )}
    {/* Collapsed tooltip */}
    {collapsed && (
      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#202020] text-white text-xs font-manrope rounded-[6px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
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

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <aside
      className={`
        flex flex-col h-full
        bg-[#0e0e1a] border-r border-white/[0.06]
        transition-all duration-200 ease-out
        ${collapsed ? 'w-[60px]' : 'w-[220px]'}
      `}
    >
      {/* Top section */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-3' : 'justify-between px-5'} py-5 border-b border-white/[0.06]`}>
        <Logo collapsed={collapsed} />
        <button
          onClick={onToggle}
          className={`${collapsed ? 'hidden' : 'flex'} items-center justify-center w-7 h-7 rounded-[6px] text-white/30 hover:text-white hover:bg-white/5 transition-colors`}
        >
          <Icon d={icons.chevronLeft} size={15} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-0.5 scrollbar-thin">
        {NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role)).map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return <NavItem key={item.path} item={item} collapsed={collapsed} active={isActive} />;
        })}
      </nav>

      {/* Bottom user area */}
      <div className="border-t border-white/[0.06] px-2 py-3 flex flex-col gap-0.5">
        {collapsed ? (
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center justify-center w-full py-2.5 rounded-[8px] text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Icon d={icons.logout} size={18} />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] bg-white/[0.03] mb-1">
              <div className="w-7 h-7 rounded-full bg-[#5757f8]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#5757f8] text-xs font-manrope font-bold">
                  {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-manrope font-semibold text-[12px] text-white truncate">
                  {user?.fullName || 'User'}
                </p>
                <p className="font-inter text-[11px] text-white/40 truncate">{user?.role || 'Owner'}</p>
              </div>
            </div>
            {/* Profile link */}
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px] text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              <span className="font-manrope font-medium text-[13px]">My Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px] text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors group"
            >
              <Icon d={icons.logout} size={16} />
              <span className="font-manrope font-medium text-[13px]">Logout</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

// ─── Topbar ───────────────────────────────────────────────────────────────────
const Topbar = ({ collapsed, onToggle, title }) => {
  const { user } = useAuthStore();

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0e0e1a] flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile/collapsed expand button */}
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-8 h-8 rounded-[6px] text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Icon d={collapsed ? icons.chevronRight : icons.menu} size={16} />
        </button>
        <div>
          <h1 className="font-manrope font-semibold text-[15px] text-white leading-none">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative flex items-center justify-center w-8 h-8 rounded-[6px] text-white/40 hover:text-white hover:bg-white/5 transition-colors">
          <Icon d={icons.bell} size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#5757f8] rounded-full" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.06]">
          <div className="w-7 h-7 rounded-full bg-[#5757f8]/20 flex items-center justify-center">
            <span className="text-[#5757f8] text-xs font-manrope font-bold">
              {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
            </span>
          </div>
          <span className="font-manrope font-medium text-[12px] text-white/70 hidden sm:block">
            {user?.fullName || user?.email}
          </span>
        </div>
      </div>
    </header>
  );
};

// ─── Page title map ────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  '/dashboard':            'Dashboard',
  '/dashboard/pos':        'POS Terminal',
  '/dashboard/inventory':  'Inventory',
  '/dashboard/reports':    'Reports',
  '/dashboard/customers':  'Customers',
  '/dashboard/settings':   'Settings',
  '/dashboard/profile':    'My Profile',
};

// ─── DashboardLayout ──────────────────────────────────────────────────────────
const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();

  const title = PAGE_TITLES[location.pathname] || 'QuantPOS';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111118] text-white">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} title={title} />

        {/* Subscription banner — shown when subscription is INACTIVE */}
        {user?.subscriptionStatus === 'INACTIVE' && (
          <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-[10px] bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs font-inter text-amber-300">
                Your subscription is inactive. Activate it to unlock POS terminals and full features.
              </p>
            </div>
            <a href="/dashboard/settings" className="font-cabin font-medium text-xs text-amber-400 hover:text-amber-300 whitespace-nowrap transition-colors">
              Activate →
            </a>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-[#111118] p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
