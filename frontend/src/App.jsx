import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';

import Register       from './pages/Register';
import Login          from './pages/Login';
import VerifyEmail    from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import Landing        from './pages/Landing';
import Dashboard      from './pages/Dashboard';
import PosTerminal    from './pages/PosTerminal';
import Profile        from './pages/Profile';
import { Inventory, Reports, Customers, Settings } from './pages/ComingSoon';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute  from './components/auth/ProtectedRoute';

// ── Public marketing pages ────────────────────────────────────────────────────
import Features       from './pages/public/Features';
import Pricing        from './pages/public/Pricing';
import HowItWorks     from './pages/public/HowItWorks';
import About          from './pages/public/About';
import Blog           from './pages/public/Blog';
import Careers        from './pages/public/Careers';
import PressKit       from './pages/public/PressKit';
import Contact        from './pages/public/Contact';
import Changelog      from './pages/public/Changelog';
import Status         from './pages/public/Status';
import PrivacyPolicy  from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
import CookiePolicy   from './pages/public/CookiePolicy';
import GDPR           from './pages/public/GDPR';


/**
 * Wraps a page with DashboardLayout + ProtectedRoute.
 * @param {string[]} requiredRoles - optional role guard; omit for "any logged-in user"
 */
const DashboardPage = ({ children, requiredRoles }) => (
  <ProtectedRoute requiredRoles={requiredRoles}>
    <DashboardLayout>
      {children}
    </DashboardLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* ── Public Routes ─────────────────────────────────────────────────── */}
      <Route path="/"                element={<Landing />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/login"           element={<Login />} />
      <Route path="/verify-email"    element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* ── Public Marketing Pages ────────────────────────────────────────── */}
      <Route path="/features"        element={<Features />} />
      <Route path="/pricing"         element={<Pricing />} />
      <Route path="/how-it-works"    element={<HowItWorks />} />
      <Route path="/about"           element={<About />} />
      <Route path="/blog"            element={<Blog />} />
      <Route path="/careers"         element={<Careers />} />
      <Route path="/press-kit"       element={<PressKit />} />
      <Route path="/contact"         element={<Contact />} />
      <Route path="/changelog"       element={<Changelog />} />
      <Route path="/status"          element={<Status />} />
      <Route path="/privacy-policy"  element={<PrivacyPolicy />} />
      <Route path="/terms-of-service"element={<TermsOfService />} />
      <Route path="/cookie-policy"   element={<CookiePolicy />} />
      <Route path="/gdpr"            element={<GDPR />} />

      {/* ── Protected Dashboard Routes ────────────────────────────────────── */}
      {/* Any authenticated user */}
      <Route
        path="/dashboard"
        element={<DashboardPage><Dashboard /></DashboardPage>}
      />
      <Route
        path="/dashboard/profile"
        element={<DashboardPage><Profile /></DashboardPage>}
      />
      <Route
        path="/dashboard/pos"
        element={<DashboardPage requiredRoles={['OWNER', 'MANAGER', 'CASHIER']}><PosTerminal /></DashboardPage>}
      />

      {/* Owner + Manager only */}
      <Route
        path="/dashboard/inventory"
        element={<DashboardPage requiredRoles={['OWNER', 'MANAGER']}><Inventory /></DashboardPage>}
      />
      <Route
        path="/dashboard/reports"
        element={<DashboardPage requiredRoles={['OWNER', 'MANAGER']}><Reports /></DashboardPage>}
      />
      <Route
        path="/dashboard/customers"
        element={<DashboardPage requiredRoles={['OWNER', 'MANAGER']}><Customers /></DashboardPage>}
      />

      {/* Owner only */}
      <Route
        path="/dashboard/settings"
        element={<DashboardPage requiredRoles={['OWNER']}><Settings /></DashboardPage>}
      />

      {/* ── Unauthorized ──────────────────────────────────────────────────── */}
      <Route
        path="/unauthorized"
        element={
          <div className="flex min-h-screen items-center justify-center bg-[#111118] text-white">
            <div className="bg-[#16161f] border border-red-500/30 rounded-[12px] p-8 max-w-sm text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 mb-4">
                <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h2 className="font-manrope font-bold text-[22px] text-red-400 mb-2">Access Denied</h2>
              <p className="font-inter text-[13px] text-white/50 mb-6">You don't have permission to access this page.</p>
              <a href="/dashboard" className="font-cabin font-medium text-sm bg-[#7b39fc] hover:bg-[#6929e8] text-white px-4 py-2 rounded-[8px] transition-colors">
                Back to Dashboard
              </a>
            </div>
          </div>
        }
      />

      {/* ── Fallback ──────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
