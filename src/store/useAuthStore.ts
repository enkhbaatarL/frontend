import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { UserRole } from '@/service/admin/members'

export interface IUserDetail {
  userNo: number
  userNm: string
  userLoginId: string
  userRoleCd: UserRole
  userRoleNm: string
  positionNm: string
  jobGradeNm: string
  onDutyNm: string
  departmentNm: string
  isOtherServiceAccessPossible: boolean
  isIndividualInfoAgreement: boolean
  companyNm: string
  companyNo: number
}

interface IAccessCompanyInfo {
  customerCompanyNo: number
  customerCompanyNm: string
}

interface AuthState {
  token: string | null
  user: IUserDetail | null
  accessCompanyInfo: IAccessCompanyInfo | null
  setToken: (token: string) => void
  setUser: (user: IUserDetail | null) => void
  setAccessCompanyInfo: (accessCompanyInfo: IAccessCompanyInfo | null) => void
  clearAuth: () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      accessCompanyInfo: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setAccessCompanyInfo: (accessCompanyInfo) => set({ accessCompanyInfo }),
      clearAuth: () => set({ token: null, user: null, accessCompanyInfo: null }),
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
