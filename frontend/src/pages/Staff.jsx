import React, { useState, useEffect, useCallback } from 'react';
import { userApi } from '../api/userApi';
import { terminalApi } from '../api/terminalApi';
import { authApi } from '../api/authApi';
import { toast } from 'react-toastify';

// ─── Icon primitive ────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, sw = 1.6, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    className={className} style={style}>
    <path d={d} />
  </svg>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '', style = {} }) => (
  <div className={`animate-pulse rounded-[6px] ${className}`}
    style={{ background: 'var(--border)', ...style }} />
);

// ─── Paths ─────────────────────────────────────────────────────────────────────
const P = {
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  pos: 'M3 10h18M3 14h18M9 6h6M9 18h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  unlock: 'M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  warn: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  signal: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
};

// ─── Mock data  replaces real API until backend staff endpoints exist ─────────
// Each staff member: id, name, role, email, status (online/offline/on-break), terminal
// Each terminal:    id, name, status (active/idle/locked), operator, lastSale, sessionStart
const MOCK_STAFF = [];
const MOCK_TERMINALS = [];

// ─── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    online: { color: 'var(--success)', bg: 'var(--success-bg)', label: 'Online' },
    'on-break': { color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'On Break' },
    offline: { color: 'var(--text-muted)', bg: 'var(--card2)', label: 'Offline' },
    active: { color: 'var(--success)', bg: 'var(--success-bg)', label: 'Active' },
    idle: { color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Idle' },
    locked: { color: 'var(--danger)', bg: 'var(--danger-bg)', label: 'Locked' },
  }[status] || { color: 'var(--text-muted)', bg: 'var(--card2)', label: status };

  return (
    <span
      className="inline-flex items-center gap-1.5 font-inter font-semibold px-2.5 py-1 rounded-full"
      style={{ fontSize: '11px', color: cfg.color, background: cfg.bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: cfg.color,
          boxShadow: status === 'online' || status === 'active' ? `0 0 5px ${cfg.color}` : 'none',
        }}
      />
      {cfg.label}
    </span>
  );
};

// ─── Confirm modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ open, title, message, onConfirm, onCancel, danger = true }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm rounded-[16px] p-6 flex flex-col gap-4"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: danger ? 'var(--danger-bg)' : 'var(--warning-bg)' }}
          >
            <Icon d={P.warn} size={18} style={{ color: danger ? 'var(--danger)' : 'var(--warning)' }} />
          </div>
          <div>
            <p className="font-manrope font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>{title}</p>
            <p className="font-inter text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onCancel}
            className="font-manrope font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-all"
            style={{ color: 'var(--text-secondary)', background: 'var(--card2)', border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="font-manrope font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-all"
            style={{
              background: danger ? 'var(--danger)' : 'var(--warning)',
              color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            {danger ? 'Disable Terminal' : 'Enable Terminal'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper for avatars
const getInitials = (name) => {
  if (!name) return 'U';
  const p = name.split(' ');
  if (p.length === 1) return p[0].charAt(0).toUpperCase();
  return (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
};

// ─── Terminal Card ─────────────────────────────────────────────────────────────
const TerminalCard = ({ terminal, onToggleLock }) => {
  const isActive = terminal.isActive && terminal.status !== 'LOCKED';
  const isLocked = terminal.status === 'LOCKED';
  const isIdle = terminal.status === 'IDLE';

  return (
    <div
      className="rounded-[14px] border p-5 flex flex-col gap-4 transition-all duration-200"
      style={{
        background: 'var(--surface)',
        borderColor: isActive ? 'var(--success)' : isLocked ? 'var(--danger)' : 'var(--border)',
        boxShadow: isActive
          ? '0 0 0 1px rgba(5,150,105,0.15), 0 4px 16px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.05)',
        opacity: isLocked ? 0.9 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{
              background: isLocked ? 'var(--danger-bg)' : isActive ? 'var(--success-bg)' : 'var(--card2)',
            }}
          >
            <Icon
              d={isLocked ? P.lock : P.pos}
              size={18}
              style={{ color: isLocked ? 'var(--danger)' : isActive ? 'var(--success)' : 'var(--text-muted)' }}
            />
          </div>
          <div>
            <p className="font-manrope font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>
              {terminal.terminalName}
            </p>
            <p className="font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Terminal #{terminal.terminalNumber}
            </p>
          </div>
        </div>
        <StatusBadge status={terminal.status === 'LOCKED' ? 'locked' : (isActive ? 'active' : 'idle')} />
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>Location</span>
          <span className="font-manrope font-semibold text-[12px]" style={{ color: 'var(--text-primary)' }}>
            {terminal.location || ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>Operator</span>
          <span className="font-inter text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {terminal.operatorName || ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>Last Sale</span>
          <span className="font-inter text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {terminal.lastSale}
          </span>
        </div>
        {isActive && (
          <div className="flex items-center justify-between">
            <span className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>Txns Today</span>
            <span className="font-manrope font-bold text-[13px]" style={{ color: 'var(--accent)' }}>
              {terminal.txnCount}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* Action */}
      <button
        onClick={() => onToggleLock(terminal)}
        className="w-full flex items-center justify-center gap-2 font-manrope font-semibold rounded-[9px] py-2 transition-all duration-200"
        style={{
          fontSize: '12px',
          background: isLocked ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: isLocked ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${isLocked ? 'var(--success)' : 'var(--danger)'}`,
          borderOpacity: 0.3,
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = isLocked ? 'var(--success)' : 'var(--danger)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isLocked ? 'var(--success-bg)' : 'var(--danger-bg)';
          e.currentTarget.style.color = isLocked ? 'var(--success)' : 'var(--danger)';
        }}
      >
        <Icon d={isLocked ? P.unlock : P.lock} size={13} sw={2} />
        {isLocked ? 'Enable Terminal' : 'Disable Terminal'}
      </button>
    </div>
  );
};

// ─── Staff Row ─────────────────────────────────────────────────────────────────
const StaffRow = ({ member, idx, onClick }) => {
  const roleColor = {
    OWNER: 'var(--accent)',
    MANAGER: 'var(--warning)',
    CASHIER: 'var(--text-muted)',
  }[member.role] || 'var(--text-muted)';

  return (
    <tr
      onClick={() => onClick && onClick(member)}
      style={{
        borderBottom: '1px solid var(--border)',
        background: idx % 2 === 0 ? 'transparent' : 'var(--card2)',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--card2)'}
    >
      {/* Name + avatar */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-manrope font-bold flex-shrink-0"
            style={{ fontSize: '11px', background: 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            {getInitials(member.fullName)}
          </div>
          <div>
            <p className="font-manrope font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>
              {member.fullName}
            </p>
            <p className="font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {member.email}
            </p>
          </div>
        </div>
      </td>
      {/* Role */}
      <td className="px-5 py-3.5">
        <span
          className="font-inter font-semibold text-[11px] px-2 py-0.5 rounded-full"
          style={{ color: roleColor, background: roleColor + '18' }}
        >
          {member.role}
        </span>
      </td>
      {/* Status */}
      <td className="px-5 py-3.5">
        <StatusBadge status={member.status} />
      </td>
      {/* Active Terminal */}
      <td className="px-5 py-3.5">
        {member.terminal ? (
          <span
            className="inline-flex items-center gap-1.5 font-manrope font-semibold text-[12px] px-2.5 py-1 rounded-[6px]"
            style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
          >
            <Icon d={P.pos} size={12} sw={2} />
            {member.terminal}
          </span>
        ) : (
          <span className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}></span>
        )}
      </td>
    </tr>
  );
};

// ─── Staff page ────────────────────────────────────────────────────────────────
const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [modal, setModal] = useState(null); // { terminal }
  const [manageStaffModal, setManageStaffModal] = useState(null); // { member }
  const [inviteModal, setInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [updatingStaff, setUpdatingStaff] = useState(false);
  const [actioningInvite, setActioningInvite] = useState(null); // id of invite being actioned
  const [activeTab, setActiveTab] = useState('terminals'); // 'terminals' | 'staff' | 'invitations'

  // Fetch real API data
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, terminalsRes] = await Promise.all([
        userApi.getAllUsers(),
        terminalApi.getAllTerminals()
      ]);
      setStaff(usersRes.data || []);
      setTerminals(terminalsRes.data || []);
      setLastRefresh(new Date());
    } catch (err) {
      toast.error('Failed to load staff and terminal data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const handleToggleLock = (terminal) => {
    setModal({ terminal });
  };

  const confirmToggle = async () => {
    const { terminal } = modal;
    try {
      await terminalApi.toggleLock(terminal.id);
      toast.success(`Terminal ${terminal.terminalName} status updated`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update terminal status');
    }
    setModal(null);
  };

  const handleInviteStaff = async (e) => {
    e.preventDefault();
    setInviting(true);
    const fd = new FormData(e.target);
    const payload = {
      fullName: fd.get('fullName'),
      email: fd.get('email'),
      role: fd.get('role')
    };
    try {
      await authApi.inviteStaff(payload);
      toast.success('Invitation sent to ' + payload.email);
      setInviteModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const loadInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    try {
      const res = await authApi.getInvitations();
      setInvitations(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load invitations');
    } finally {
      setInvitationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'invitations') loadInvitations();
  }, [activeTab, loadInvitations]);

  const handleResendInvitation = async (inv) => {
    setActioningInvite(inv.id);
    try {
      await authApi.resendInvitation(inv.id);
      toast.success(`Invitation resent to ${inv.email}`);
      loadInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invitation');
    } finally {
      setActioningInvite(null);
    }
  };

  const handleRevokeInvitation = async (inv) => {
    setActioningInvite(inv.id);
    try {
      await authApi.revokeInvitation(inv.id);
      toast.success(`Invitation revoked for ${inv.email}`);
      loadInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke invitation');
    } finally {
      setActioningInvite(null);
    }
  };

  const handleManageStaffSubmit = async (e) => {
    e.preventDefault();
    setUpdatingStaff(true);
    const fd = new FormData(e.target);
    const role = fd.get('role');
    const perms = [];
    if (fd.get('perm_loyalty')) perms.push('MANAGE_LOYALTY');
    if (fd.get('perm_discount')) perms.push('APPLY_DISCOUNTS');
    if (fd.get('perm_inventory')) perms.push('MANAGE_INVENTORY');

    try {
      if (role !== manageStaffModal.member.role) {
        await userApi.updateUserRole(manageStaffModal.member.id, role);
      }
      await userApi.updateUserPermissions(manageStaffModal.member.id, perms);
      
      toast.success('Staff member updated successfully');
      setManageStaffModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update staff member');
    } finally {
      setUpdatingStaff(false);
    }
  };

  // Stats
  const onlineCount = staff.filter(s => s.status === 'online').length;
  const activeTerms = terminals.filter(t => t.isActive && t.status !== 'LOCKED').length;
  const lockedTerms = terminals.filter(t => t.status === 'LOCKED').length;

  const TABS = [
    { id: 'terminals', label: 'POS Terminals', count: terminals.length },
    { id: 'staff', label: 'Staff Members', count: staff.length },
    { id: 'invitations', label: 'Invitations', count: invitations.filter(i => i.status === 'PENDING').length },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-1 py-1 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-manrope font-bold text-[22px]" style={{ color: 'var(--text-primary)' }}>
            Staff & Terminals
          </h2>
          <p className="font-inter text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Monitor live staff activity and manage POS terminal access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInviteModal(true)}
            className="flex items-center gap-2 font-manrope font-semibold text-[13px] px-4 py-2 rounded-[9px] transition-all"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Invite Staff
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 font-manrope font-semibold text-[13px] px-4 py-2 rounded-[9px] transition-all"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Icon d={P.refresh} size={14} sw={2} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Staff Online', value: loading ? null : onlineCount, color: 'var(--success)', icon: P.user },
          { label: 'Active Terminals', value: loading ? null : activeTerms, color: 'var(--accent)', icon: P.pos },
          { label: 'Locked Terminals', value: loading ? null : lockedTerms, color: 'var(--danger)', icon: P.lock },
          { label: 'Total Staff', value: loading ? null : staff.length, color: 'var(--warning)', icon: P.eye },
        ].map(({ label, value, color, icon }) => (
          <div
            key={label}
            className="rounded-[14px] border p-4 flex flex-col gap-2"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <div className="w-7 h-7 rounded-[8px] flex items-center justify-center"
                style={{ background: color + '18' }}>
                <Icon d={icon} size={14} style={{ color }} />
              </div>
            </div>
            {value === null ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="font-manrope font-bold text-[26px] leading-none" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-[10px] p-1 w-fit"
        style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 font-manrope font-semibold text-[13px] px-4 py-2 rounded-[7px] transition-all"
            style={{
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
            <span
              className="font-inter text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                background: activeTab === tab.id ? 'var(--accent-subtle)' : 'var(--border)',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── POS Terminals Grid ──────────────────────────────────────────────── */}
      {activeTab === 'terminals' && (
        <div>
          {/* Live indicator */}
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: 'var(--success)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: 'var(--success)' }} />
            </span>
            <span className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Live  last updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-[14px] border p-5 flex flex-col gap-4"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-[10px]" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-2.5 w-14" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-9 w-full rounded-[9px]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {terminals.map(t => (
                <TerminalCard key={t.id} terminal={t} onToggleLock={handleToggleLock} />
              ))}
            </div>
          )}

          {/* Note */}
          <div
            className="mt-5 flex items-start gap-2.5 rounded-[10px] px-4 py-3"
            style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
          >
            <Icon d={P.warn} size={15} sw={1.8} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '1px' }} />
            <p className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Disabling a terminal</strong> will prevent staff from processing any new sales on that device.
              Active sessions will be forcefully ended. This action can be reversed at any time.
              Live data will be connected once the terminal management API is available.
            </p>
          </div>
        </div>
      )}

      {/* ── Staff Table ─────────────────────────────────────────────────────── */}
      {activeTab === 'staff' && (
        <div className="rounded-[14px] border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}>
            <div>
              <h3 className="font-manrope font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
                Staff Members
              </h3>
              <p className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Real-time online status of your store staff
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
              <span className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {onlineCount} online now
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-5 flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2.5 w-44" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-[6px]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Staff Member', 'Role', 'Status', 'Active Terminal'].map(h => (
                      <th key={h}
                        className="px-5 py-3 text-left font-inter font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staff.map((m, idx) => <StaffRow key={m.id} member={m} idx={idx} onClick={m => setManageStaffModal({ member: m })} />)}
                </tbody>
              </table>
            </div>
          )}


        </div>
      )}

      {/* ── Invitations History Tab ──────────────────────────────────────── */}
      {activeTab === 'invitations' && (
        <div className="rounded-[14px] border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}>
            <div>
              <h3 className="font-manrope font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
                Invitation History
              </h3>
              <p className="font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Invitations expire after 1 hour. You can resend or revoke any invitation below.
              </p>
            </div>
            <button
              onClick={loadInvitations}
              disabled={invitationsLoading}
              className="flex items-center gap-1.5 font-manrope font-semibold text-[12px] px-3 py-1.5 rounded-[8px]"
              style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <Icon d={P.refresh} size={13} sw={2} className={invitationsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {invitationsLoading ? (
            <div className="p-5 flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-2.5 w-28" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-7 w-16 rounded-[7px]" />
                </div>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3"
                style={{ background: 'var(--card2)' }}>
                <Icon d={P.user} size={22} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="font-manrope font-semibold text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                No invitations sent yet
              </p>
              <p className="font-inter text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Click "Invite Staff" to send your first invitation
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Recipient', 'Role', 'Status', 'Sent At', 'Expires At', 'Invited By', 'Actions'].map(h => (
                      <th key={h}
                        className="px-5 py-3 text-left font-inter font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv, idx) => {
                    const statusCfg = {
                      PENDING:  { color: 'var(--warning)',  bg: 'var(--warning-bg)',  label: 'Pending' },
                      ACCEPTED: { color: 'var(--success)',  bg: 'var(--success-bg)',  label: 'Accepted' },
                      EXPIRED:  { color: 'var(--text-muted)', bg: 'var(--card2)',      label: 'Expired' },
                      REVOKED:  { color: 'var(--danger)',   bg: 'var(--danger-bg)',   label: 'Revoked' },
                    }[inv.status] || { color: 'var(--text-muted)', bg: 'var(--card2)', label: inv.status };
                    const isActioning = actioningInvite === inv.id;
                    const canResend = inv.status === 'PENDING' || inv.status === 'EXPIRED';
                    const canRevoke = inv.status === 'PENDING';
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--card2)' }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-manrope font-bold flex-shrink-0"
                              style={{ fontSize: '10px', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                              {getInitials(inv.fullName || inv.email)}
                            </div>
                            <div>
                              <p className="font-manrope font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>
                                {inv.fullName || '—'}
                              </p>
                              <p className="font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>{inv.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-inter font-semibold text-[11px] px-2 py-0.5 rounded-full"
                            style={{ color: 'var(--accent)', background: 'var(--accent-subtle)' }}>
                            {inv.role || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 font-inter font-semibold px-2.5 py-1 rounded-full"
                            style={{ fontSize: '11px', color: statusCfg.color, background: statusCfg.bg }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusCfg.color }} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-inter text-[12px]" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-3.5 font-inter text-[12px]" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {inv.expiresAt ? new Date(inv.expiresAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-3.5 font-inter text-[12px]" style={{ color: 'var(--text-muted)' }}>
                          {inv.invitedByName || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {canResend && (
                              <button
                                onClick={() => handleResendInvitation(inv)}
                                disabled={isActioning}
                                className="font-manrope font-semibold text-[11px] px-2.5 py-1.5 rounded-[7px] transition-all"
                                style={{
                                  background: 'var(--accent-subtle)', color: 'var(--accent)',
                                  border: '1px solid transparent', cursor: isActioning ? 'not-allowed' : 'pointer',
                                  opacity: isActioning ? 0.6 : 1,
                                }}
                              >
                                {isActioning ? '...' : 'Resend'}
                              </button>
                            )}
                            {canRevoke && (
                              <button
                                onClick={() => handleRevokeInvitation(inv)}
                                disabled={isActioning}
                                className="font-manrope font-semibold text-[11px] px-2.5 py-1.5 rounded-[7px] transition-all"
                                style={{
                                  background: 'var(--danger-bg)', color: 'var(--danger)',
                                  border: '1px solid transparent', cursor: isActioning ? 'not-allowed' : 'pointer',
                                  opacity: isActioning ? 0.6 : 1,
                                }}
                              >
                                {isActioning ? '...' : 'Revoke'}
                              </button>
                            )}
                            {!canResend && !canRevoke && (
                              <span className="font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="h-4" />

      {/* ── Confirm disable/enable modal ─────────────────────────────────── */}
      <ConfirmModal
        open={!!modal}
        danger={modal?.terminal?.status !== 'LOCKED'}
        title={modal?.terminal?.status === 'LOCKED' ? `Enable ${modal?.terminal?.terminalName}?` : `Disable ${modal?.terminal?.terminalName}?`}
        message={
          modal?.terminal?.status === 'LOCKED'
            ? `This will re-enable Terminal #${modal?.terminal?.terminalNumber} for staff use.`
            : `This will lock Terminal #${modal?.terminal?.terminalNumber} and prevent any new sales. ${modal?.terminal?.operatorName ? `${modal.terminal.operatorName}'s active session will be ended.` : ''}`
        }
        onConfirm={confirmToggle}
        onCancel={() => setModal(null)}
      />

      {/* ── Invite Staff Modal ───────────────────────────────────────────── */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-[16px] p-6 flex flex-col gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div>
              <p className="font-manrope font-bold text-[18px]" style={{ color: 'var(--text-primary)' }}>Invite Staff Member</p>
              <p className="font-inter text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Send an email invitation to join your business.</p>
            </div>

            <form onSubmit={handleInviteStaff} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-semibold text-[12px]" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <input required type="text" name="fullName" className="w-full px-3 py-2 rounded-[8px] font-inter text-[14px]" style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} placeholder="John Doe" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-semibold text-[12px]" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
                <input required type="email" name="email" className="w-full px-3 py-2 rounded-[8px] font-inter text-[14px]" style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} placeholder="john@example.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-semibold text-[12px]" style={{ color: 'var(--text-secondary)' }}>Role</label>
                <select name="role" className="w-full px-3 py-2 rounded-[8px] font-inter text-[14px]" style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="CASHIER">Cashier (POS Only)</option>
                  <option value="MANAGER">Manager (Full Access)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 justify-end mt-4">
                <button type="button" onClick={() => setInviteModal(false)} className="font-manrope font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-all" style={{ color: 'var(--text-secondary)', background: 'var(--card2)', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={inviting} className="font-manrope font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-all" style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', opacity: inviting ? 0.7 : 1 }}>
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Staff Modal ───────────────────────────────────────────── */}
      {manageStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-[16px] p-6 flex flex-col gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div>
              <p className="font-manrope font-bold text-[18px]" style={{ color: 'var(--text-primary)' }}>Manage Staff</p>
              <p className="font-inter text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Update role and permissions for {manageStaffModal.member.fullName}</p>
            </div>

            <form onSubmit={handleManageStaffSubmit} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-semibold text-[12px]" style={{ color: 'var(--text-secondary)' }}>Role (Promote / Demote)</label>
                <select name="role" defaultValue={manageStaffModal.member.role} className="w-full px-3 py-2 rounded-[8px] font-inter text-[14px]" style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="EMPLOYEE">Employee (Inventory Only)</option>
                  <option value="CASHIER">Cashier (POS Only)</option>
                  <option value="MANAGER">Manager (Full Access)</option>
                  <option value="OWNER">Owner (System Admin)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="font-inter font-semibold text-[12px]" style={{ color: 'var(--text-secondary)' }}>Extra Permissions</label>
                
                <label className="flex items-center gap-3 p-3 rounded-[8px] cursor-pointer" style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}>
                  <input type="checkbox" name="perm_loyalty" defaultChecked={manageStaffModal.member.permissions?.includes('MANAGE_LOYALTY')} className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]" />
                  <div>
                    <p className="font-manrope font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>Manage Loyalty</p>
                    <p className="font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>Allow adding customers to programs</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-[8px] cursor-pointer" style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}>
                  <input type="checkbox" name="perm_discount" defaultChecked={manageStaffModal.member.permissions?.includes('APPLY_DISCOUNTS')} className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]" />
                  <div>
                    <p className="font-manrope font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>Apply Discounts</p>
                    <p className="font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>Allow bypassing normal pricing rules</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-[8px] cursor-pointer" style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}>
                  <input type="checkbox" name="perm_inventory" defaultChecked={manageStaffModal.member.permissions?.includes('MANAGE_INVENTORY')} className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]" />
                  <div>
                    <p className="font-manrope font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>Manage Inventory</p>
                    <p className="font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>Bypass manager approval for stock</p>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-2 justify-end mt-4">
                <button type="button" onClick={() => setManageStaffModal(null)} className="font-manrope font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-all" style={{ color: 'var(--text-secondary)', background: 'var(--card2)', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={updatingStaff} className="font-manrope font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-all" style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', opacity: updatingStaff ? 0.7 : 1 }}>
                  {updatingStaff ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
