import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [otp, setOtp]                   = useState(['', '', '', '', '', '']);
  const [status, setStatus]             = useState('idle');
  const [message, setMessage]           = useState('');
  const [resendStatus, setResendStatus] = useState('idle');
  const [resendMessage, setResendMessage] = useState('');
  const [timer, setTimer]               = useState(60);
  const inputRefs                       = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const id = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(id);
    }
  }, [timer]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp]; newOtp[index - 1] = ''; setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp]; newOtp[index] = ''; setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').trim();
    if (data.length === 6 && /^\d+$/.test(data)) {
      setOtp(data.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setStatus('error');
      setMessage('Please enter all 6 digits of the verification code.');
      return;
    }
    setStatus('loading'); setMessage('');
    try {
      const response = await authApi.verifyEmail(email, otpCode);
      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'Email verified successfully! Redirecting to login…');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(response.error?.details || response.message || 'Verification failed.');
      }
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      setStatus('error');
      if (code === 'OTP_LOCKED')
        setMessage('Too many failed attempts. Please wait 15 minutes before trying again.');
      else if (code === 'OTP_EXPIRED' || err?.response?.status === 400)
        setMessage('This code has expired or is invalid. Please request a new one.');
      else
        setMessage(err?.response?.data?.error?.details || err?.response?.data?.message || 'Verification failed. The code may be invalid or expired.');
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resendStatus === 'sending') return;
    setResendStatus('sending'); setResendMessage('');
    try {
      const response = await authApi.resendOtp(email);
      if (response.success) {
        setResendStatus('success');
        setResendMessage('A new verification code has been sent to your email.');
        setTimer(60);
      } else {
        setResendStatus('error');
        setResendMessage(response.message || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      setResendStatus('error');
      if (code === 'RESEND_COOLDOWN')
        setResendMessage('Please wait a moment before requesting another code.');
      else
        setResendMessage(err?.response?.data?.error?.details || err?.response?.data?.message || 'Failed to resend code.');
    }
  };

  const inputClasses = "w-12 h-12 text-center text-xl font-bold rounded-[10px] border bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-150";

  return (
    <AuthLayout>
      <Card className="bg-[var(--surface)] border-[var(--border)] text-center">
        {status === 'success' ? (
          <div className="flex flex-col items-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 mb-6">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-instrument text-3xl text-[var(--text-primary)] mb-2 font-normal leading-tight">
              Email Verified!
            </h2>
            <p className="font-inter text-[var(--text-secondary)] mb-8 leading-relaxed text-[15px]">{message}</p>
            <Link to="/login" className="w-full">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <svg className="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="font-instrument text-3xl mb-2 font-normal leading-tight text-[var(--text-primary)]">
              Verify your email
            </h2>
            <p className="text-sm font-inter text-[var(--text-secondary)] mb-6 leading-relaxed">
              We sent a 6-digit code to{' '}
              <span className="text-accent font-semibold">{email || 'your email'}</span>.
              <br />Enter it below to activate your account.
            </p>

            {message && (
              <div className={`mb-6 rounded-[10px] p-4 border text-sm flex items-start gap-2.5 text-left
                ${status === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-accent/10 border-accent/30 text-violet-500'}`}>
                <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {status === 'error' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <p className="font-inter">{message}</p>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-between max-w-xs mx-auto" onPaste={handlePaste}>
                {otp.map((data, index) => (
                  <input key={index} type="text" name={`otp-${index}`} maxLength="1"
                    ref={(el) => (inputRefs.current[index] = el)}
                    value={data}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={inputClasses} autoComplete="off" />
                ))}
              </div>
              <Button type="submit" loading={status === 'loading'} className="w-full mt-2">
                Verify Code
              </Button>
            </form>

            <div className="mt-6 text-sm font-inter">
              <p className="text-[var(--text-secondary)]">
                Didn't receive the code?{' '}
                {timer > 0 ? (
                  <span className="text-[var(--text-muted)]">Resend in {timer}s</span>
                ) : (
                  <button onClick={handleResend} disabled={resendStatus === 'sending'}
                    className="font-medium text-accent hover:text-[var(--accent-hover)] transition-colors bg-transparent border-none p-0 cursor-pointer">
                    {resendStatus === 'sending' ? 'Sending…' : 'Resend Code'}
                  </button>
                )}
              </p>
              {resendMessage && (
                <p className={`mt-2 text-xs ${resendStatus === 'success' ? 'text-green-500' : 'text-red-400'}`}>
                  {resendMessage}
                </p>
              )}
            </div>

            <div className="mt-5 border-t border-[var(--border)] pt-5">
              <Link to="/login" className="text-sm font-manrope font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                ← Back to Login
              </Link>
            </div>
          </div>
        )}
      </Card>
    </AuthLayout>
  );
};

export default VerifyEmail;
