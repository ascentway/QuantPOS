import React, { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import useAuthStore from '../store/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const RoleBadge = ({ role }) => {
  const colors = {
    OWNER: 'bg-accent-subtle text-accent border border-accent/30',
    MANAGER: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    CASHIER: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    SUPER_ADMIN: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-cabin font-medium ${colors[role] || 'bg-card2 text-text-muted'}`}>
      {role?.replace('_', ' ')}
    </span>
  );
};

const SubscriptionBadge = ({ status }) => {
  const colors = {
    ACTIVE: 'text-emerald-400',
    INACTIVE: 'text-amber-400',
    PAST_DUE: 'text-red-400',
    CANCELLED: 'text-slate-400',
  };
  return (
    <span className={`font-medium ${colors[status] || 'text-text-muted'}`}>
      {status || ''}
    </span>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-theme last:border-0">
    <span className="text-sm font-manrope text-text-muted">{label}</span>
    <span className="text-sm font-inter text-text-secondary">{value || ''}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Profile Page
// ─────────────────────────────────────────────────────────────────

const Profile = () => {
  const storeUser = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // Change password form
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authApi.getMe();
        if (res.success) {
          setProfile(res.data);
        } else {
          setProfileError(res.message || 'Failed to load profile.');
        }
      } catch (e) {
        setProfileError(e.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPw.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      if (res.success) {
        setPwSuccess(res.message || 'Password changed. Please log in again.');
        // Clear form
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        // Backend invalidates all sessions  log user out after 2s
        setTimeout(() => {
          clearAuth();
          window.location.href = '/login';
        }, 2500);
      } else {
        setPwError(res.error?.details || res.message || 'Failed to change password.');
      }
    } catch (err) {
      setPwError(err.response?.data?.error?.details || err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const displayUser = profile || storeUser;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Page Header ───────────────────────────────────── */}
      <div>
        <h1 className="font-instrument text-3xl text-text-primary font-normal">My Profile</h1>
        <p className="mt-1 font-inter text-sm text-text-muted">View your account information and manage your password.</p>
      </div>

      {/* ── Profile Info Card ─────────────────────────────── */}
      <Card className="bg-surface border-theme">
        {loadingProfile ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profileError ? (
          <p className="text-sm text-red-400 font-inter py-4 text-center">{profileError}</p>
        ) : (
          <>
            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <span className="text-[#a87eff] font-manrope font-bold text-xl">
                  {displayUser?.fullName?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h2 className="font-manrope font-semibold text-text-primary text-lg leading-tight">
                  {displayUser?.fullName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <RoleBadge role={displayUser?.role} />
                  <span className="text-xs font-inter text-text-muted">{displayUser?.businessName}</span>
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div>
              <InfoRow label="Email" value={displayUser?.email} />
              <InfoRow label="Business" value={displayUser?.businessName} />
              <InfoRow label="Business Type" value={displayUser?.businessType} />
              <InfoRow label="Subscription" value={<SubscriptionBadge status={displayUser?.subscriptionStatus} />} />
              <InfoRow label="Role" value={<RoleBadge role={displayUser?.role} />} />
            </div>
          </>
        )}
      </Card>

      {/* ── Security Card ─────────────────────────────────── */}
      <Card className="bg-surface border-theme">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-manrope font-semibold text-text-primary text-base">Password & Security</h3>
            <p className="text-xs font-inter text-text-muted mt-0.5">
              Changing your password will log you out of all devices.
            </p>
          </div>
          {!showPwForm && (
            <button
              onClick={() => { setShowPwForm(true); setPwError(null); setPwSuccess(null); }}
              className="font-cabin font-medium text-sm text-accent hover:text-[#a87eff] transition-colors"
            >
              Change Password
            </button>
          )}
        </div>

        {showPwForm && (
          <form onSubmit={handleChangePassword} className="space-y-4">

            {pwError && (
              <div className="rounded-[10px] bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 font-inter">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400 font-inter">
                {pwSuccess}
              </div>
            )}

            <Input
              label="Current Password"
              type="password"
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
            />
            <Input
              label="New Password"
              type="password"
              required
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Min. 8 chars, include uppercase, number, special"
            />
            <Input
              label="Confirm New Password"
              type="password"
              required
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={pwLoading} className="flex-1">
                Update Password
              </Button>
              <button
                type="button"
                onClick={() => { setShowPwForm(false); setPwError(null); setPwSuccess(null); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
                className="flex-1 rounded-[10px] border border-theme text-sm font-cabin text-text-muted hover:text-text-primary hover:border-theme transition-colors py-3"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Card>

    </div>
  );
};

export default Profile;
