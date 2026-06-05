import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import useAuthStore from '../store/authStore';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

// ── OTP Input Row ─────────────────────────────────────────────────────────────
const OtpInput = ({ otp, onChange, onKeyDown, onPaste, inputRefs }) => (
  <div className="flex justify-between max-w-xs mx-auto" onPaste={onPaste}>
    {otp.map((digit, idx) => (
      <input
        key={idx}
        type="text"
        inputMode="numeric"
        maxLength="1"
        ref={(el) => (inputRefs.current[idx] = el)}
        value={digit}
        onChange={(e) => onChange(e, idx)}
        onKeyDown={(e) => onKeyDown(e, idx)}
        className="w-12 h-12 text-center text-xl font-bold rounded-[10px] border
                   bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]
                   focus:border-[#7b39fc] focus:ring-2 focus:ring-[#7b39fc]/20 outline-none
                   transition-all duration-150"
        autoComplete="off"
      />
    ))}
  </div>
);

// ── Alert Banner ──────────────────────────────────────────────────────────────
const Alert = ({ type = 'error', message }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`mb-5 rounded-[10px] p-4 border text-sm flex items-start gap-2.5
      ${isError
        ? 'bg-red-500/10 border-red-500/30 text-red-400 dark:text-red-400'
        : 'bg-[#7b39fc]/10 border-[#7b39fc]/30 text-violet-500 dark:text-violet-400'
      }`}>
      <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {isError ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        )}
      </svg>
      <p className="font-inter leading-snug">{message}</p>
    </div>
  );
};

// ── Friendly error resolver ───────────────────────────────────────────────────
function resolveLoginError(err) {
  const status = err?.response?.status;
  const code   = err?.response?.data?.error?.code;
  const detail = err?.response?.data?.error?.details;
  const msg    = err?.response?.data?.message;

  // Specific error codes from the backend
  if (code === 'EMAIL_NOT_VERIFIED') return { redirect: true };
  if (code === 'USER_NOT_FOUND' || code === 'INVALID_CREDENTIALS' || status === 401)
    return 'Incorrect email or password. Please check and try again.';
  if (code === 'ACCOUNT_INACTIVE' || code === 'USER_INACTIVE')
    return 'Your account has been deactivated. Please contact your business owner.';
  if (code === 'TENANT_INACTIVE')
    return 'Your business account is inactive. Please contact QuantPOS support.';
  if (code === 'OTP_LOCKED' || status === 429)
    return 'Too many attempts. Please wait 15 minutes and try again.';
  if (status === 403)
    return 'Access denied. Your email may not be verified.';
  if (status === 0 || !status)
    return 'Unable to connect to the server. Please check your internet connection.';

  // Fall back to whatever the server says
  return detail || msg || 'Something went wrong. Please try again.';
}

// ── Main Component ────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((state) => state.setAuth);

  // Step 1 — credentials
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPw] = useState(false);

  // Step 2 — 2FA OTP
  const [step, setStep]   = useState(1);
  const [otp, setOtp]     = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const inputRefs         = useRef([]);

  // Shared
  const [error, setError]     = useState(null);
  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(false);

  // Countdown timer for 2FA resend
  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  // Auto-focus first OTP box
  useEffect(() => {
    if (step === 2) inputRefs.current[0]?.focus();
  }, [step]);

  // ── Step 1: credentials ────────────────────────────────────────────────────
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.success) {
        setInfo(`A 6-digit verification code has been sent to ${email}`);
        setStep(2);
        setTimer(60);
      } else {
        setError(res.error?.details || res.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      const result = resolveLoginError(err);
      if (result?.redirect) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setError(result);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: 2FA OTP ────────────────────────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter all 6 digits.'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.verify2fa(email, code);
      if (res.success) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
        navigate('/dashboard');
      } else {
        setError(res.error?.details || res.message || 'Verification failed.');
      }
    } catch (err) {
      const status = err?.response?.status;
      const code   = err?.response?.data?.error?.code;
      if (code === 'OTP_LOCKED' || status === 429)
        setError('Too many incorrect codes. Please wait 15 minutes and try again.');
      else if (status === 401)
        setError('Invalid or expired code. Please check your email and try again.');
      else
        setError(err?.response?.data?.error?.details || err?.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP handlers ───────────────────────────────────────────────────────────
  const handleOtpChange = (e, idx) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.substring(val.length - 1);
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (!otp[idx] && idx > 0) {
        const next = [...otp]; next[idx - 1] = ''; setOtp(next);
        inputRefs.current[idx - 1]?.focus();
      } else {
        const next = [...otp]; next[idx] = ''; setOtp(next);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').trim();
    if (data.length === 6 && /^\d+$/.test(data)) {
      setOtp(data.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend2fa = async () => {
    if (timer > 0) return;
    setError(null); setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.success) {
        setInfo('A new code has been sent to your email.');
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
      }
    } catch (err) {
      setError('Could not resend the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="bg-[var(--surface)] border-[var(--border)]">

        {/* ── STEP 1: Credentials ─────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="mb-8 text-center">
              <h2 className="font-instrument text-3xl text-[var(--text-primary)] font-normal leading-tight">
                Welcome back
              </h2>
              <p className="mt-2 text-sm font-inter text-[var(--text-secondary)]">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-[#7b39fc] hover:text-[#915bff] transition-colors">
                  Create an account
                </Link>
              </p>
            </div>

            <Alert type="error" message={error} />

            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                name="email"
                id="login-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                autoComplete="email"
              />

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="login-password" className="block text-sm font-manrope font-medium text-[var(--text-secondary)]">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-manrope font-semibold text-[#7b39fc] hover:text-[#915bff] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-[10px] border px-4 py-3 pr-11 text-[15px] font-inter
                               bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]
                               placeholder-[var(--text-muted)] focus:border-[#7b39fc] focus:ring-2
                               focus:ring-[#7b39fc]/20 outline-none transition-all duration-150"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]
                               hover:text-[var(--text-secondary)] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full mt-1">
                Continue →
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-[var(--text-muted)] font-inter">
              By signing in you agree to our{' '}
              <Link to="/terms-of-service" className="underline hover:text-[#7b39fc] transition-colors">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy-policy" className="underline hover:text-[#7b39fc] transition-colors">Privacy Policy</Link>.
            </p>
          </>
        )}

        {/* ── STEP 2: 2FA OTP ─────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#7b39fc]/10">
                <svg className="h-7 w-7 text-[#7b39fc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-instrument text-3xl text-[var(--text-primary)] font-normal">Check your email</h2>
              <p className="mt-2 text-sm font-inter text-[var(--text-secondary)]">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-[#7b39fc]">{email}</span>
              </p>
            </div>

            <Alert type="error" message={error} />
            <Alert type="info"  message={info}  />

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <OtpInput otp={otp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown}
                onPaste={handleOtpPaste} inputRefs={inputRefs} />

              {/* Countdown */}
              <p className="text-center text-sm text-[var(--text-muted)] font-inter">
                {timer > 0 ? `Code expires in ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}` : 'Code expired'}
              </p>

              <Button type="submit" loading={loading} className="w-full">
                Verify &amp; Sign In
              </Button>
            </form>

            <div className="mt-6 text-sm font-inter text-center text-[var(--text-secondary)]">
              Didn't receive the code?{' '}
              {timer > 0 ? (
                <span className="text-[var(--text-muted)]">Resend in {timer}s</span>
              ) : (
                <button onClick={handleResend2fa} disabled={loading}
                  className="font-medium text-[#7b39fc] hover:text-[#915bff] transition-colors bg-transparent border-none p-0 cursor-pointer">
                  Resend Code
                </button>
              )}
            </div>

            <div className="mt-5 border-t border-[var(--border)] pt-5 text-center">
              <button
                onClick={() => { setStep(1); setError(null); setInfo(null); setOtp(['', '', '', '', '', '']); }}
                className="text-sm font-manrope font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </>
        )}
      </Card>
    </AuthLayout>
  );
};

export default Login;
