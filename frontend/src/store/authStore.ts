import { create } from 'zustand'

interface AuthState {
  token: string | null
  tenantId: string | null
  role: string | null
  setAuth: (token: string, tenantId: string, role: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  tenantId: localStorage.getItem('tenantId'),
  role: localStorage.getItem('role'),

  setAuth: (token, tenantId, role) => {
    localStorage.setItem('token', token)
    localStorage.setItem('tenantId', tenantId)
    localStorage.setItem('role', role)
    set({ token, tenantId, role })
  },

  clearAuth: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('tenantId')
    localStorage.removeItem('role')
    set({ token: null, tenantId: null, role: null })
  },
}))
