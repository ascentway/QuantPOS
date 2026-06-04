import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// ─── Micro Icon ───────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, strokeWidth = 1.6, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

// ─── Static mock data ─────────────────────────────────────────────────────────
const KPI_DATA = [
  {
    id: 'revenue',
    label: 'Revenue Today',
    value: '₹28,540',
    delta: '+12.4%',
    up: true,
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#5757f8',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    value: '143',
    delta: '+8.1%',
    up: true,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    color: '#10b981',
  },
  {
    id: 'avg_order',
    label: 'Avg. Order Value',
    value: '₹199.6',
    delta: '+3.7%',
    up: true,
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    color: '#f59e0b',
  },
  {
    id: 'low_stock',
    label: 'Low Stock Alerts',
    value: '7',
    delta: '-2 items',
    up: false,
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    color: '#ef4444',
  },
];

const RECENT_ORDERS = [
  { id: '#TXN-8841', time: '14:32', items: 4, amount: '₹620', cashier: 'Priya S.', status: 'Completed' },
  { id: '#TXN-8840', time: '14:18', items: 2, amount: '₹180', cashier: 'Priya S.', status: 'Completed' },
  { id: '#TXN-8839', time: '13:55', items: 6, amount: '₹1,080', cashier: 'Ravi K.', status: 'Completed' },
  { id: '#TXN-8838', time: '13:41', items: 1, amount: '₹95', cashier: 'Priya S.', status: 'Refunded' },
  { id: '#TXN-8837', time: '13:22', items: 3, amount: '₹445', cashier: 'Ravi K.', status: 'Completed' },
];

const TOP_PRODUCTS = [
  { name: 'Aashirvaad Atta 5kg',   sold: 28, revenue: '₹3,360', stock: 142 },
  { name: 'Amul Gold Milk 1L',     sold: 54, revenue: '₹2,700', stock: 230 },
  { name: 'Lay\'s Classic 52g',    sold: 61, revenue: '₹1,830', stock: 88  },
  { name: 'Parle-G Biscuits 800g', sold: 33, revenue: '₹1,650', stock: 55  },
  { name: 'Colgate MaxFresh 150g', sold: 19, revenue: '₹1,235', stock: 74  },
];

// Inline mini bar chart via SVG
const MiniBarChart = ({ data = [45, 60, 38, 82, 55, 90, 72] }) => {
  const max = Math.max(...data);
  const w = 120;
  const h = 40;
  const gap = 4;
  const barW = (w - gap * (data.length - 1)) / data.length;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      {data.map((v, i) => {
        const barH = (v / max) * h;
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={h - barH}
            width={barW}
            height={barH}
            rx="2"
            fill="#5757f8"
            opacity={i === data.length - 1 ? 1 : 0.35}
          />
        );
      })}
    </svg>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ item }) => (
  <div className="relative bg-[#16161f] border border-white/[0.06] rounded-[12px] p-5 flex flex-col gap-4 overflow-hidden group hover:border-white/10 transition-colors">
    <div className="flex items-start justify-between">
      <div>
        <p className="font-inter text-[12px] text-white/40 mb-1">{item.label}</p>
        <p className="font-manrope font-bold text-[26px] text-white leading-none">{item.value}</p>
      </div>
      <div
        className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: item.color + '18' }}
      >
        <Icon d={item.icon} size={18} style={{ color: item.color }} strokeWidth={1.8} />
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <span
        className={`text-[11px] font-manrope font-semibold px-1.5 py-0.5 rounded-[4px] ${
          item.up ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
        }`}
      >
        {item.delta}
      </span>
      <span className="font-inter text-[11px] text-white/30">vs yesterday</span>
    </div>
    {/* Subtle glow */}
    <div
      className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"
      style={{ backgroundColor: item.color }}
    />
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('today');

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1400px] mx-auto">

      {/* ─── Header row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-manrope font-bold text-[20px] text-white">Good morning 👋</h2>
          <p className="font-inter text-[13px] text-white/40 mt-0.5">
            Here's what's happening at your store today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['today', 'week', 'month'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`font-manrope font-medium text-[12px] px-3.5 py-1.5 rounded-[8px] transition-all capitalize ${
                activeTab === t
                  ? 'bg-[#5757f8] text-white'
                  : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              {t}
            </button>
          ))}
          <Link
            to="/dashboard/pos"
            className="ml-2 flex items-center gap-2 bg-[#5757f8] hover:bg-[#6c6cf8] transition-colors text-white font-manrope font-semibold text-[13px] px-4 py-2 rounded-[8px]"
          >
            <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={14} />
            Open POS
          </Link>
        </div>
      </div>

      {/* ─── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map(item => <KpiCard key={item.id} item={item} />)}
      </div>

      {/* ─── Main body: chart + top products ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Revenue chart placeholder */}
        <div className="xl:col-span-2 bg-[#16161f] border border-white/[0.06] rounded-[12px] p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-manrope font-semibold text-[14px] text-white">Revenue Overview</h3>
              <p className="font-inter text-[12px] text-white/30">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-inter text-[11px] text-white/40">
                <span className="w-2 h-2 rounded-full bg-[#5757f8]" />Revenue
              </span>
              <span className="flex items-center gap-1.5 font-inter text-[11px] text-white/40">
                <span className="w-2 h-2 rounded-full bg-white/20" />Last Week
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-[160px] flex items-end gap-2 px-2">
            {[
              { day: 'Mon', cur: 18500, prev: 14200 },
              { day: 'Tue', cur: 22100, prev: 19800 },
              { day: 'Wed', cur: 16800, prev: 20500 },
              { day: 'Thu', cur: 25400, prev: 18700 },
              { day: 'Fri', cur: 31200, prev: 22100 },
              { day: 'Sat', cur: 28700, prev: 25900 },
              { day: 'Sun', cur: 28540, prev: 21300 },
            ].map(({ day, cur, prev }) => {
              const maxVal = 35000;
              const curH = (cur / maxVal) * 100;
              const prevH = (prev / maxVal) * 100;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  <div className="w-full flex items-end gap-0.5" style={{ height: '140px' }}>
                    <div
                      className="flex-1 rounded-t-[4px] bg-white/10 transition-all group-hover/bar:bg-white/20"
                      style={{ height: `${prevH}%` }}
                    />
                    <div
                      className="flex-1 rounded-t-[4px] bg-[#5757f8] transition-all group-hover/bar:bg-[#6c6cf8]"
                      style={{ height: `${curH}%` }}
                    />
                  </div>
                  <span className="font-inter text-[10px] text-white/30">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-[#16161f] border border-white/[0.06] rounded-[12px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-manrope font-semibold text-[14px] text-white">Top Products</h3>
            <button className="font-inter text-[11px] text-[#5757f8] hover:text-[#7a7af8] transition-colors">View all</button>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {TOP_PRODUCTS.map((p, i) => {
              const maxSold = TOP_PRODUCTS[0].sold;
              const pct = (p.sold / maxSold) * 100;
              return (
                <div key={p.name} className="py-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-manrope text-[10px] font-bold text-white/20 w-4">#{i + 1}</span>
                      <span className="font-inter text-[12.5px] text-white/80 truncate max-w-[140px]">{p.name}</span>
                    </div>
                    <span className="font-manrope font-semibold text-[12px] text-white flex-shrink-0">{p.revenue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#5757f8] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-inter text-[10px] text-white/30 flex-shrink-0">{p.sold} sold</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Recent Transactions ──────────────────────────────────────────────── */}
      <div className="bg-[#16161f] border border-white/[0.06] rounded-[12px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="font-manrope font-semibold text-[14px] text-white">Recent Transactions</h3>
          <button className="font-inter text-[11px] text-[#5757f8] hover:text-[#7a7af8] transition-colors">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Transaction ID', 'Time', 'Items', 'Cashier', 'Amount', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-manrope font-semibold text-[11px] text-white/30 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((order, idx) => (
                <tr key={order.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                  <td className="px-5 py-3.5 font-manrope font-semibold text-[12.5px] text-[#5757f8]">{order.id}</td>
                  <td className="px-5 py-3.5 font-inter text-[12.5px] text-white/60">{order.time}</td>
                  <td className="px-5 py-3.5 font-inter text-[12.5px] text-white/60">{order.items}</td>
                  <td className="px-5 py-3.5 font-inter text-[12.5px] text-white/60">{order.cashier}</td>
                  <td className="px-5 py-3.5 font-manrope font-semibold text-[12.5px] text-white">{order.amount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center font-inter text-[11px] font-medium px-2 py-0.5 rounded-[4px] ${
                      order.status === 'Completed'
                        ? 'text-emerald-400 bg-emerald-400/10'
                        : 'text-amber-400 bg-amber-400/10'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Bottom spacer ───────────────────────────────────────────────────── */}
      <div className="h-4" />
    </div>
  );
};

export default Dashboard;
