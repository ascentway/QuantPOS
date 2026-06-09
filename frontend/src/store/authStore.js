import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,          // { id, email, fullName, role, tenantId, businessName, businessType, subscriptionStatus }
  accessToken: null,
  refreshToken: null,

  setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),

  clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),

  updateAccessToken: (newAccessToken) =>
    set((state) => ({ ...state, accessToken: newAccessToken })),

      updateUser: (userFields) =>
        set((state) => ({ user: state.user ? { ...state.user, ...userFields } : state.user })),
    }),
    {
      name: 'quantpos-auth', // name of the item in the storage (must be unique)
    }
  )
);

export default useAuthStore;
