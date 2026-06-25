import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { toast } from 'react-toastify';

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    const password = fd.get('password');
    const confirmPassword = fd.get('confirmPassword');
    const fullName = fd.get('fullName');

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authApi.acceptInvite({ token, fullName, password });
      setSuccess(true);
      toast.success('Account created successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation. Token might be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="font-inter text-red-500">Invalid invitation link. Missing token.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="w-full max-w-md p-8 rounded-[16px] shadow-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-2">Join QuantPOS</h2>
        <p className="font-inter text-sm text-[var(--text-muted)] mb-6">Create your account to accept the invitation to the store.</p>
        
        {success ? (
          <div className="p-4 bg-[var(--success-bg)] text-[var(--success)] rounded-[8px] font-inter text-sm">
            Success! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-inter font-semibold text-xs text-[var(--text-secondary)]">Full Name</label>
              <input required type="text" name="fullName" placeholder="John Doe" className="px-4 py-2.5 rounded-[8px] font-inter text-sm bg-[var(--card2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-inter font-semibold text-xs text-[var(--text-secondary)]">Password</label>
              <input required minLength={8} type="password" name="password" placeholder="Min 8 characters" className="px-4 py-2.5 rounded-[8px] font-inter text-sm bg-[var(--card2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-inter font-semibold text-xs text-[var(--text-secondary)]">Confirm Password</label>
              <input required minLength={8} type="password" name="confirmPassword" placeholder="Repeat password" className="px-4 py-2.5 rounded-[8px] font-inter text-sm bg-[var(--card2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors" />
            </div>

            <button type="submit" disabled={loading} className="mt-4 w-full py-2.5 rounded-[8px] font-manrope font-semibold text-sm bg-[var(--accent)] text-white hover:bg-opacity-90 transition-all disabled:opacity-70">
              {loading ? 'Creating Account...' : 'Accept Invitation & Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
