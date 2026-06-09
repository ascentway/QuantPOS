import axiosInstance from './axiosInstance';

export const billingApi = {
  getBillingStatus: async () => {
    const response = await axiosInstance.get('/api/billing/status');
    return response.data;
  },

  createCheckoutSession: async (planType, billingCycle = 'MONTHLY') => {
    const response = await axiosInstance.post('/api/billing/checkout-session', {
      planType,
      billingCycle
    });
    return response.data;
  },

  createPortalSession: async () => {
    const response = await axiosInstance.post('/api/billing/portal-session');
    return response.data;
  }
};
