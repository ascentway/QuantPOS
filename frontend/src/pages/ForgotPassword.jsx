import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const ForgotPassword = () => {
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading'); setMessage('');
    try {
      const response = await authApi.forgotPassword(email);
      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'If an account with that email exists, a reset code has been sent.');
      } else {
        setStatus('error');
        setMessage(response.error?.details || response.message || 'Failed to send reset email.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(
        err?.response?.data?.error?.details ||
        err?.response?.data?.message ||
        'Unable to send reset email. Please check your internet connection and try again.'
      );
    }
  };

  if (status === 'success') {
    return (
      <AuthLayout>
        <Card className="bg-[var(--surface)] border-[var(--border)] text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 mb-6">
            <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="font-instrument text-3xl mb-4 text-[var(--text-primary)] font-normal leading-tight">
            Check your email
          </h2>
          <p className="font-inter text-[var(--text-secondary)] mb-2 leading-relaxed text-[15px]">{message}</p>
          <p className="font-inter text-[var(--text-muted)] mb-8 text-sm">
            Check your spam folder if you don't see it within a minute.
          </p>
          <Link to="/login" className="w-full">
            <Button className="w-full">Back to Login</Button>
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="font-instrument text-3xl text-[var(--text-primary)] font-normal leading-tight">
            Reset your password
          </h2>
          <p className="mt-2 text-sm font-inter text-[var(--text-secondary)]">
            Enter your email and we'll send you a reset link.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Email Address" type="email" name="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="name@business.com" autoComplete="email" />

          <Button type="submit" loading={status === 'loading'} className="w-full mt-1">
            Send Reset Link
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

export default ForgotPassword;
