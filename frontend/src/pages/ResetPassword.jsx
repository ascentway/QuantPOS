import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPw]           = useState(false);
  const [status, setStatus]                 = useState('idle');
  const [message, setMessage]               = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing reset link. Please request a new one.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match. Please re-enter your new password.');
      return;
    }
    if (password.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters long.');
      return;
    }

    setStatus('loading'); setMessage('');
    try {
      const response = await authApi.resetPassword({ token, password });
      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'Password reset successfully. You can now log in with your new password.');
      } else {
        setStatus('error');
        setMessage(response.error?.details || response.message || 'Failed to reset password.');
      }
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      setStatus('error');
      if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN')
        setMessage('This reset link has expired or is invalid. Please request a new password reset.');
      else
        setMessage(err?.response?.data?.error?.details || err?.response?.data?.message || 'Failed to reset password. The link may have expired.');
    }
  };

  if (status === 'success') {
    return (
      <AuthLayout>
        <Card className="bg-[var(--surface)] border-[var(--border)] text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 mb-6">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-instrument text-3xl mb-4 text-[var(--text-primary)] font-normal leading-tight">
            Password Updated
          </h2>
          <p className="font-inter text-[var(--text-secondary)] mb-8 leading-relaxed text-[15px]">{message}</p>
          <Link to="/login" className="w-full">
            <Button className="w-full">Go to Login</Button>
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#7b39fc]/10">
            <svg className="h-7 w-7 text-[#7b39fc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="font-instrument text-3xl text-[var(--text-primary)] font-normal leading-tight">
            Create new password
          </h2>
          <p className="mt-2 text-sm font-inter text-[var(--text-secondary)]">
            Choose a strong password for your account.
          </p>
        </div>

        {status === 'error' && (
          <div className="mb-6 rounded-[10px] bg-red-500/10 p-4 border border-red-500/30 flex items-start gap-2.5">
            <svg className="h-5 w-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-400 font-inter">{message}</p>
          </div>
        )}

        {!token && (
          <div className="mb-6 rounded-[10px] bg-amber-500/10 p-4 border border-amber-500/30 flex items-start gap-2.5">
            <svg className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm text-amber-400 font-inter font-medium">Invalid reset link</p>
              <p className="text-xs text-amber-400/80 font-inter mt-1">
                This link is invalid or has expired.{' '}
                <Link to="/forgot-password" className="underline hover:text-[#7b39fc] transition-colors">
                  Request a new one
                </Link>.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <label htmlFor="reset-password" className="block text-sm font-manrope font-medium text-[var(--text-secondary)] mb-1">
              New Password
            </label>
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-[10px] border px-4 py-3 pr-11 text-[15px] font-inter
                         bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]
                         placeholder-[var(--text-muted)] focus:border-[#7b39fc] focus:ring-2
                         focus:ring-[#7b39fc]/20 outline-none transition-all duration-150"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-[38px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>

          <Input label="Confirm New Password" type="password" name="confirmPassword" required
            minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••" />

          <p className="text-xs text-[var(--text-muted)] font-inter -mt-2">
            Must be at least 8 characters with 1 uppercase letter and 1 number.
          </p>

          <Button type="submit" disabled={!token} loading={status === 'loading'} className="w-full mt-1">
            Reset Password
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-manrope font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            ← Back to login
          </Link>
        </div>
      </Card>
    </AuthLayout>
  );
};

export default ResetPassword;
