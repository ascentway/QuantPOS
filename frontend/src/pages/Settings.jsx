import React, { useState, useEffect } from 'react';
import { CreditCard, Building, ExternalLink, Download, CheckCircle2, AlertCircle, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { billingApi } from '../api/billingApi';

// ─── Pricing Data ─────────────────────────────────────────────────────────────
const PLANS = [
  { id: 'STARTER', name: 'Starter', monthly: 499, yearly: 4990, desc: 'For new stores starting out', limit: 1 },
  { id: 'GROWTH', name: 'Growth', monthly: 999, yearly: 9990, desc: 'For growing businesses', limit: 3 },
  { id: 'PROFESSIONAL', name: 'Professional', monthly: 1999, yearly: 19990, desc: 'Advanced features & reporting', limit: 5 },
  { id: 'ENTERPRISE', name: 'Enterprise', monthly: 4999, yearly: 49990, desc: 'Unlimited scale & support', limit: 10 }
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('billing');
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Pricing Modal State
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [processingCheckout, setProcessingCheckout] = useState(false);

  useEffect(() => {
    if (activeTab === 'billing') {
      fetchBillingStatus();
    }
  }, [activeTab]);

  const fetchBillingStatus = async () => {
    try {
      setLoading(true);
      const data = await billingApi.getBillingStatus();
      setBillingStatus(data);
    } catch (error) {
      console.error('Error fetching billing status', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const data = await billingApi.createPortalSession();
      window.location.href = data.url;
    } catch (error) {
      console.error('Error launching portal', error);
    }
  };

  const handleCheckout = async (planType) => {
    try {
      setProcessingCheckout(true);
      const data = await billingApi.createCheckoutSession(planType, billingCycle);
      window.location.href = data.url;
    } catch (error) {
      console.error('Error launching checkout', error);
      setProcessingCheckout(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1400px] mx-auto relative">
      {/* ─── Header row ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <h2 className="font-manrope font-bold text-[20px] text-white">Store Settings</h2>
        <p className="font-inter text-[13px] text-white/40">
          Manage your store profile and subscription details.
        </p>
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex space-x-2 border-b border-white/[0.06] pb-4 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 font-manrope font-medium text-[13px] px-4 py-2 rounded-[8px] transition-all ${
            activeTab === 'profile'
              ? 'bg-[#5757f8] text-white'
              : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
          }`}
        >
          <Building className="w-4 h-4" />
          Business Profile
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 font-manrope font-medium text-[13px] px-4 py-2 rounded-[8px] transition-all ${
            activeTab === 'billing'
              ? 'bg-[#5757f8] text-white'
              : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Billing & Subscription
        </button>
      </div>

      {/* ─── Business Profile Tab ────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-[#16161f] border border-white/[0.06] rounded-[12px] p-6 max-w-2xl">
          <h3 className="font-manrope font-semibold text-[16px] text-white mb-1">Business Details</h3>
          <p className="font-inter text-[12px] text-white/40 mb-6">Update your store information.</p>
          
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="bg-[#5757f8] hover:bg-[#6c6cf8] transition-colors text-white font-manrope font-semibold text-[13px] px-4 py-2 rounded-[8px]">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Billing & Subscription Tab ──────────────────────────────────────── */}
      {activeTab === 'billing' && (
        <div className="space-y-6 max-w-4xl">
          {loading ? (
            <div className="bg-[#16161f] border border-white/[0.06] rounded-[12px] p-10 flex justify-center items-center">
              <div className="animate-pulse flex items-center gap-2 text-[#5757f8]">
                <div className="w-4 h-4 rounded-full bg-[#5757f8]"></div>
                <span className="font-manrope text-[14px]">Loading billing details...</span>
              </div>
            </div>
          ) : billingStatus ? (
            <>
              {/* ─── Subscription Card ────────────────────────────────────────────── */}
              <div className="relative bg-[#16161f] border border-white/[0.06] rounded-[12px] p-6 overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#5757f8]"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="font-manrope font-bold text-[24px] text-white mb-2">
                      {billingStatus.planName || 'No Active Plan'}
                    </h3>
                    <div className="flex items-center gap-3 font-inter text-[13px] text-white/40">
                      {billingStatus.subscriptionStatus === 'ACTIVE' ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-[4px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-0.5 rounded-[4px] font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {billingStatus.subscriptionStatus}
                        </span>
                      )}
                      <span>•</span>
                      {billingStatus.cancelAtPeriodEnd ? (
                        <span className="text-red-400">Cancels on <span className="font-bold">{formatDate(billingStatus.currentPeriodEnd)}</span></span>
                      ) : (
                        <span>Renews on <span className="text-white/80">{formatDate(billingStatus.currentPeriodEnd)}</span></span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="font-manrope font-bold text-[32px] text-white">
                        ₹{billingStatus.monthlyPrice || '0.00'}
                      </span>
                      <span className="font-inter text-[13px] text-white/40 uppercase">
                        {billingStatus.currency || 'INR'} / cycle
                      </span>
                    </div>
                    {billingStatus.subscriptionStatus === 'ACTIVE' ? (
                      <button
                        onClick={handleManageBilling}
                        className="flex items-center gap-2 bg-white hover:bg-gray-200 transition-colors text-black font-manrope font-semibold text-[13px] px-5 py-2.5 rounded-[8px]"
                      >
                        <span>Upgrade / Cancel Plan</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPricingModal(true)}
                        className="flex items-center gap-2 bg-[#5757f8] hover:bg-[#6c6cf8] transition-colors text-white font-manrope font-semibold text-[13px] px-5 py-2.5 rounded-[8px]"
                      >
                        <span>Activate Subscription</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ─── Terminals Limit ────────────────────────────────────────────── */}
                <div className="mt-8 pt-6 border-t border-white/[0.06]">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <h4 className="font-manrope font-semibold text-[14px] text-white">Active Terminals</h4>
                      <p className="font-inter text-[12px] text-white/40">Devices currently registered to your store</p>
                    </div>
                    <div className="font-manrope font-bold text-[14px] text-white">
                      {billingStatus.activeTerminals} <span className="text-white/40">/ {billingStatus.terminalLimit || 'Unlimited'}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#5757f8] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((billingStatus.activeTerminals / (billingStatus.terminalLimit || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* ─── Invoices Table ────────────────────────────────────────────── */}
              <div className="bg-[#16161f] border border-white/[0.06] rounded-[12px] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                  <h3 className="font-manrope font-semibold text-[16px] text-white">Billing History</h3>
                </div>
                
                {billingStatus.invoices && billingStatus.invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.04]">
                          {['Date', 'Amount', 'Status', 'Invoice'].map(h => (
                            <th key={h} className={`px-6 py-3 font-manrope font-semibold text-[11px] text-white/30 uppercase tracking-wider ${h === 'Invoice' ? 'text-right' : 'text-left'}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {billingStatus.invoices.map((inv, idx) => (
                          <tr key={inv.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                            <td className="px-6 py-4 font-inter text-[13px] text-white/80">{formatDate(inv.createdAt || inv.invoiceDate)}</td>
                            <td className="px-6 py-4 font-manrope font-semibold text-[13px] text-white uppercase">₹{inv.amountPaid} {inv.currency}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center font-inter text-[11px] font-medium px-2 py-0.5 rounded-[4px] ${
                                inv.status === 'PAID' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {inv.invoicePdfUrl && (
                                <a
                                  href={inv.invoicePdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 font-inter text-[12px] text-[#5757f8] hover:text-[#7a7af8] transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="font-inter text-[13px] text-white/40">No invoices found for this subscription.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-[#16161f] border border-red-500/20 rounded-[12px] p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="font-inter text-[14px] text-red-400">Failed to load billing status.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Pricing Modal ──────────────────────────────────────────────────────── */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#16161f] border border-white/[0.06] rounded-[16px] w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <div>
                <h3 className="font-manrope font-bold text-[20px] text-white">Select a Plan</h3>
                <p className="font-inter text-[13px] text-white/50 mt-1">Upgrade your POS to unlock full capabilities.</p>
              </div>
              <button 
                onClick={() => setShowPricingModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Billing Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-white/5 p-1 rounded-[10px] inline-flex">
                  <button
                    onClick={() => setBillingCycle('MONTHLY')}
                    className={`px-6 py-2 rounded-[6px] font-manrope font-medium text-[13px] transition-all ${
                      billingCycle === 'MONTHLY' ? 'bg-[#5757f8] text-white shadow-lg' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('YEARLY')}
                    className={`px-6 py-2 rounded-[6px] font-manrope font-medium text-[13px] transition-all ${
                      billingCycle === 'YEARLY' ? 'bg-[#5757f8] text-white shadow-lg' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Yearly <span className="ml-1 text-[10px] bg-emerald-400/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Save 16%</span>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map((plan) => {
                  const price = billingCycle === 'MONTHLY' ? plan.monthly : plan.yearly;
                  return (
                    <div key={plan.id} className="bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-5 flex flex-col group hover:border-[#5757f8]/50 hover:bg-white/[0.04] transition-all">
                      <h4 className="font-manrope font-semibold text-[15px] text-white mb-1">{plan.name}</h4>
                      <p className="font-inter text-[12px] text-white/40 h-8 mb-4">{plan.desc}</p>
                      
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="font-manrope font-bold text-[28px] text-white">₹{price}</span>
                        <span className="font-inter text-[12px] text-white/40">/ {billingCycle.toLowerCase()}</span>
                      </div>
                      
                      <div className="flex-1 space-y-3 mb-6">
                        <div className="flex items-center gap-2 font-inter text-[12px] text-white/70">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#5757f8]" />
                          <span>{plan.limit} Terminals</span>
                        </div>
                        <div className="flex items-center gap-2 font-inter text-[12px] text-white/70">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#5757f8]" />
                          <span>Core POS Features</span>
                        </div>
                        <div className="flex items-center gap-2 font-inter text-[12px] text-white/70">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#5757f8]" />
                          <span>Basic Reporting</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleCheckout(plan.id)}
                        disabled={processingCheckout}
                        className={`w-full py-2.5 rounded-[8px] font-manrope font-semibold text-[13px] transition-colors ${
                          processingCheckout 
                            ? 'bg-white/10 text-white/50 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-gray-200'
                        }`}
                      >
                        {processingCheckout ? 'Processing...' : 'Select Plan'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
