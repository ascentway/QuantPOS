import axiosInstance from './axiosInstance';

export const authApi = {
  register: async (data) => {
    const response = await axiosInstance.post('/api/auth/register', data);
    return response.data;
  },

  verifyEmail: async (email, otp) => {
    const response = await axiosInstance.post(
      `/api/auth/verify-email?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`
    );
    return response.data;
  },

  resendOtp: async (email) => {
    const response = await axiosInstance.post(
      `/api/auth/resend-otp?email=${encodeURIComponent(email)}`
    );
    return response.data;
  },

  /**
   * Login Step 1  validate credentials, triggers 2FA OTP email.
   * Returns { success: true, data: null } on success.
   */
  login: async (data) => {
    const response = await axiosInstance.post('/api/auth/login', data);
    return response.data;
  },

  /**
   * Login Step 2  verify 2FA OTP, returns tokens.
   * Returns { success: true, data: { accessToken, refreshToken, user } }
   */
  verify2fa: async (email, otp) => {
    const response = await axiosInstance.post(
      `/api/auth/verify-2fa?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`
    );
    return response.data;
  },

  refresh: async (refreshToken) => {
    const response = await axiosInstance.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await axiosInstance.post('/api/auth/logout', { refreshToken });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axiosInstance.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await axiosInstance.post('/api/auth/reset-password', data);
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get('/api/auth/me');
    return response.data;
  },

  changePassword: async (data) => {
    const response = await axiosInstance.put('/api/auth/change-password', data);
    return response.data;
  },

  inviteStaff: async (data) => {
    const response = await axiosInstance.post('/api/auth/invite', data);
    return response.data;
  },

  acceptInvite: async (data) => {
    const response = await axiosInstance.post('/api/auth/accept-invite', data);
    return response.data;
  },

  getInvitations: async () => {
    const response = await axiosInstance.get('/api/auth/invitations');
    return response.data;
  },

  resendInvitation: async (id) => {
    const response = await axiosInstance.post(`/api/auth/invitations/${id}/resend`);
    return response.data;
  },

  revokeInvitation: async (id) => {
    const response = await axiosInstance.delete(`/api/auth/invitations/${id}`);
    return response.data;
  },
};
