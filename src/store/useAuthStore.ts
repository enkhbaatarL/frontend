import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { UserRole } from '@/service/admin/members'
import companiesService, { IAccessCompanyInfo } from '@/service/mi/companies'

let __currentBaseUrl: string | null = null

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
  userAccessPageType: string
  companyMipUrl?: string
  isExternalLogin?: boolean
}

interface AuthState {
  token: string | null
  user: IUserDetail | null
  accessCompanyInfo: IAccessCompanyInfo | null
  customBaseUrl: string | null

  setToken: (token: string) => void
  setUser: (user: IUserDetail | null) => void
  setAccessCompanyInfo: (accessCompanyInfo: IAccessCompanyInfo | null) => void
  loadAccessCompanyInfo: (companyNo: number) => void
  clearAuth: () => void
  getUrl: () => string | null
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      accessCompanyInfo: null,
      customBaseUrl: null,

      setToken: (token) => set({ token }),

      setUser: (user) =>
        set((s) => {
          let nextBase = s.customBaseUrl
          const companyNo = s.accessCompanyInfo?.customerCompanyNo ?? user?.companyNo
          if (user?.companyMipUrl && companyNo) {
            nextBase = `${user.companyMipUrl}/api/v1`
            sessionStorage.setItem(`customBaseUrl_${companyNo}`, nextBase)
          }
          __currentBaseUrl = nextBase
          return { user, customBaseUrl: nextBase }
        }),

      setAccessCompanyInfo: (accessCompanyInfo) =>
        set((s) => {
          let nextBase = s.customBaseUrl
          const companyNo = accessCompanyInfo?.customerCompanyNo ?? s.user?.companyNo
          if (accessCompanyInfo?.customerCompanyMipUrl && companyNo) {
            nextBase = `${accessCompanyInfo.customerCompanyMipUrl}/api/v1`
            sessionStorage.setItem(`customBaseUrl_${companyNo}`, nextBase)
            __currentBaseUrl = nextBase
          }
          return { accessCompanyInfo, customBaseUrl: nextBase }
        }),

      loadAccessCompanyInfo: (companyNo: number) => {
        const { setAccessCompanyInfo } = get()
        companiesService.getCompanyDetail(companyNo).then((companyInfo) => {
          setAccessCompanyInfo(companyInfo)
        })
      },

      clearAuth: () =>
        set(() => {
          sessionStorage.clear()
          __currentBaseUrl = null
          return { token: null, user: null, accessCompanyInfo: null, customBaseUrl: null }
        }),

      getUrl: () => {
        const { accessCompanyInfo, user } = get()
        const companyNo = accessCompanyInfo?.customerCompanyNo ?? user?.companyNo
        if (companyNo) {
          return sessionStorage.getItem(`customBaseUrl_${companyNo}`)
        }
        return null
      },
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

/**
 * [운영자 서비스 접속]
 * MI 화면에서 자기 회사(`user.companyNo`) 정보로 진입하는 사용자.
 * 일반 사용자와 타사접속 가능 운영자(자기 회사만 진입)가 해당한다.
 */
export const usesOwnCompanyInMi = (user: IUserDetail | null | undefined) =>
  user?.userRoleCd === UserRole.USER || (user?.userRoleCd === UserRole.OPERATOR && !!user.isOtherServiceAccessPossible)

export const withCustomBaseUrl = (path: string) => {
  if (import.meta.env.MODE === 'development') {
    return path.startsWith('/') ? path : `/${path}`
  }

  if (!__currentBaseUrl) {
    const { getUrl } = useAuthStore.getState()
    const url = getUrl()

    if (url) {
      __currentBaseUrl = url
    } else {
      throw new Error('Custom base url not set.')
    }
  }

  return __currentBaseUrl + (path.startsWith('/') ? path : `/${path}`)
}
