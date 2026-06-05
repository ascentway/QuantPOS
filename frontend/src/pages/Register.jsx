import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'RETAIL',
    phoneNumber: '',
    gstin: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressPincode: '',
    ownerFullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [hasGstin, setHasGstin] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    const payload = { ...formData };
    delete payload.confirmPassword;
    if (!hasGstin) delete payload.gstin;

    setLoading(true);
    try {
      const response = await authApi.register(payload);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`), 2500);
      } else {
        setError(response.error?.details || response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === 'EMAIL_ALREADY_EXISTS')
        setError('An account with this email already exists. Try logging in instead.');
      else
        setError(err?.response?.data?.error?.details || err?.response?.data?.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectClasses = "w-full rounded-[10px] border px-4 py-3 text-[15px] font-inter bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] focus:border-[#7b39fc] focus:ring-2 focus:ring-[#7b39fc]/20 outline-none transition-all duration-150";

  if (success) {
    return (
      <AuthLayout>
        <Card className="bg-[var(--surface)] border-[var(--border)] text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 mb-6">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-instrument text-3xl mb-3 text-[var(--text-primary)] font-normal leading-tight">
            Account Created!
          </h2>
          <p className="font-inter text-[var(--text-secondary)] mb-8 leading-relaxed text-[15px]">
            Please check your email for the 6-digit verification code. Redirecting you now…
          </p>
          <Link to={`/verify-email?email=${encodeURIComponent(formData.email)}`} className="w-full">
            <Button className="w-full">Verify Email Now</Button>
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout maxWidth="max-w-3xl">
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <div className="mb-8 text-center">
          <h2 className="font-instrument text-3xl text-[var(--text-primary)] font-normal leading-tight">
            Create your business account
          </h2>
          <p className="mt-2 text-sm font-inter text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#7b39fc] hover:text-[#915bff] transition-colors">
              Log in instead
            </Link>
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-[10px] bg-red-500/10 p-4 border border-red-500/30 flex items-start gap-2.5">
            <svg className="h-5 w-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-400 font-inter">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Info */}
          <div className="space-y-4">
            <h3 className="text-base font-manrope font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
              Business Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Business Name" name="businessName" required
                value={formData.businessName} onChange={handleChange} placeholder="Your Store Name" />
              <div>
                <label className="mb-1 block text-sm font-manrope font-medium text-[var(--text-secondary)]">
                  Business Type *
                </label>
                <select name="businessType" value={formData.businessType}
                  onChange={handleChange} className={selectClasses}>
                  <option value="RETAIL">Retail</option>
                  <option value="FNB">Food &amp; Beverage (F&amp;B)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Phone Number" name="phoneNumber" type="tel" required
                value={formData.phoneNumber} onChange={handleChange} placeholder="9876543210" />
              <div className="flex flex-col justify-end pb-1 text-left">
                <label className="flex items-center gap-2.5 cursor-pointer font-manrope font-medium text-sm text-[var(--text-secondary)] h-full pt-6 select-none">
                  <input type="checkbox" checked={hasGstin} onChange={(e) => setHasGstin(e.target.checked)}
                    className="rounded border-[var(--border)] bg-[var(--surface)] text-[#7b39fc] focus:ring-[#7b39fc]/50 w-4 h-4" />
                  Our business has a GSTIN
                </label>
              </div>
            </div>

            {hasGstin && (
              <Input label="GSTIN" name="gstin" required value={formData.gstin}
                onChange={handleChange} placeholder="22AAAAA0000A1Z5 (15-digit GST number)" />
            )}
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-base font-manrope font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
              Business Address
            </h3>
            <Input label="Street Address" name="addressStreet" required
              value={formData.addressStreet} onChange={handleChange} placeholder="123 Main Rd, Shop No. 5" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label="City" name="addressCity" required
                value={formData.addressCity} onChange={handleChange} placeholder="Mumbai" />
              <Input label="State" name="addressState" required
                value={formData.addressState} onChange={handleChange} placeholder="Maharashtra" />
              <Input label="Pincode" name="addressPincode" required
                value={formData.addressPincode} onChange={handleChange} placeholder="400001" />
            </div>
          </div>

          {/* Owner Account */}
          <div className="space-y-4">
            <h3 className="text-base font-manrope font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
              Owner Account Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full Name" name="ownerFullName" required
                value={formData.ownerFullName} onChange={handleChange} placeholder="Your Full Name" />
              <Input label="Email Address" name="email" type="email" required
                value={formData.email} onChange={handleChange} placeholder="name@business.com" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Password" name="password" type="password" required
                value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" />
              <Input label="Confirm Password" name="confirmPassword" type="password" required
                value={formData.confirmPassword} onChange={handleChange} placeholder="Re-type password" />
            </div>
            <p className="text-xs text-[var(--text-muted)] font-inter">
              Password must be at least 8 characters, contain 1 uppercase letter and 1 number.
            </p>
          </div>

          {/* Terms agreement */}
          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  id="register-terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] bg-[var(--surface)] text-[#7b39fc]
                             focus:ring-[#7b39fc]/50 focus:ring-2 cursor-pointer"
                />
              </div>
              <span className="text-sm font-inter text-[var(--text-secondary)] leading-relaxed">
                I have read and agree to the{' '}
                <Link to="/terms-of-service" target="_blank"
                  className="font-medium text-[#7b39fc] hover:text-[#915bff] underline transition-colors">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy-policy" target="_blank"
                  className="font-medium text-[#7b39fc] hover:text-[#915bff] underline transition-colors">
                  Privacy Policy
                </Link>.
                {' '}<span className="text-red-400">*</span>
              </span>
            </label>
            {!agreedToTerms && error?.includes('Terms') && (
              <p className="mt-2 text-xs text-red-400 font-inter pl-7">
                You must agree to proceed.
              </p>
            )}
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2"
            disabled={loading}
          >
            Create Account &amp; Continue →
          </Button>

          <p className="text-center text-xs text-[var(--text-muted)] font-inter -mt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#7b39fc] hover:text-[#915bff] transition-colors">
              Sign in instead
            </Link>
          </p>
        </form>
      </Card>
    </AuthLayout>
  );
};

export default Register;
