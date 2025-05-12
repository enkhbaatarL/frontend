import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { UserRole } from '@/service/admin/members'

export interface IUser {
  role: UserRole
  userNo: string | null
  userNm: string | null
  email: string | null
  companyNm: string | null
  departmentNm: string | null
}

interface AuthState {
  token: string | null
  user: IUser | null
  setToken: (token: string) => void
  setUser: (user: IUser | null) => void
  clearAuth: () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    },
  ),
)

export default useAuthStore
