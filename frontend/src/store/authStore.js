import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,          // { id, email, fullName, role, tenantId, businessName, businessType, subscriptionStatus }
  accessToken: null,
  refreshToken: null,

  setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),

  clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),

  updateAccessToken: (newAccessToken) =>
    set((state) => ({ ...state, accessToken: newAccessToken })),

  updateUser: (userFields) =>
    set((state) => ({ user: state.user ? { ...state.user, ...userFields } : state.user })),
}));

export default useAuthStore;
