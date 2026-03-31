import { QueryClient } from '@tanstack/react-query'
import Axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { t } from 'i18next'
import { NavigateFunction } from 'react-router-dom'

import { ISnackbarOptions } from '@/hooks/useSnackbar'
import i18n from '@/lib/i18n'
import useAuthStore from '@/store/useAuthStore'
import useDialog from '@/store/useDialog'
import { triggerLayoutReset } from '@/utils/resetLayout'
export interface HttpResponse<T> {
  status: number
  code: string
  message?: string
  data?: T
}

export const queryClient = new QueryClient()

export interface ErrorHandlerOptions {
  showSnackbar: (message: string, options?: ISnackbarOptions) => void
}

let navigateFn: NavigateFunction

// 페이지 이동 시 다이얼로그를 닫도록 처리
const wrapNavigateFn = (navFn: NavigateFunction): NavigateFunction =>
  ((to, options) => {
    const { visible, onHide } = useDialog.getState()
    if (visible) {
      onHide()
    }
    return navFn(to, options)
  }) as NavigateFunction

export const setNavigate = (navFn: typeof navigateFn) => {
  navigateFn = wrapNavigateFn(navFn)
}

let errorHandlerOptions: ErrorHandlerOptions | null = null

export const setErrorHandlerOptions = (options: ErrorHandlerOptions) => {
  errorHandlerOptions = options
}

export const removeErrorHandlerOptions = () => {
  errorHandlerOptions = null
}

const api: AxiosInstance = Axios.create({
  baseURL: '/api/v1/',
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
  },
  timeout: 20_000,
  withCredentials: true,
})

/**
 * 세션 토큰·리프레시·전역 에러 핸들러를 붙이지 않은 인스턴스.
 * 호출부에서 `Authorization: Bearer …`만 쓸 때 사용 (예: 내부 뉴스레터 렌더용 JWT).
 */
export const apiExplicitBearer: AxiosInstance = Axios.create({
  baseURL: '/api/v1/',
  headers: {
    'Cache-Control': 'no-cache',
  },
  timeout: 20_000,
  withCredentials: true,
})

api.interceptors.request.use((req) => {
  if (req.headers !== undefined) {
    const { token, user, accessCompanyInfo } = useAuthStore.getState()
    if (token) {
      req.headers['Authorization'] = `Bearer ${token}`
    }
    if (user?.isOtherServiceAccessPossible && accessCompanyInfo?.customerCompanyNo) {
      req.headers['X-Company-No'] = accessCompanyInfo.customerCompanyNo.toString()
    }
    req.headers['Accept-Language'] = i18n.language || 'ko'
  }

  return req
})

let isRefreshing = false
let requestQueue: (() => void)[] = []

/** 토큰만료 재발급 process */
const reissueToken = async (config?: InternalAxiosRequestConfig): Promise<void> => {
  const { token: savedToken } = useAuthStore.getState()
  const processQueue = (): Promise<void> =>
    new Promise((resolve) => {
      for (const callback of requestQueue) {
        callback()
      }
      requestQueue = []
      resolve()
    })
  const errorNavigate = () => {
    requestQueue = []
    const { onShow, onHide } = useDialog.getState()
    onHide()
    const handleDelete = () => {
      onShow({
        title: t('세션이 만료되었습니다.'),
        disableClose: true,
        zIndex: 1600,
        actions: [
          {
            label: 'Login',
            onClick: async () => {
              useDialog.getState().onHide()
              navigateFn('/')
            },
          },
        ],
      })
    }
    handleDelete()
  }
  if (!savedToken) return errorNavigate()
  if (isRefreshing) {
    return new Promise((resolve) => {
      requestQueue.push(() => resolve())
    })
  }
  isRefreshing = true
  try {
    const originalRequest = config
    if (originalRequest) requestQueue.push(() => api(originalRequest))
    const response = await fetch('/api/v1/auth/token-generation', {
      method: 'POST',
      headers: { Authorization: `Bearer ${savedToken}` },
      credentials: 'include',
    })
    if (!response.ok) return errorNavigate()
    const data = await response.json()
    const newToken = data?.data?.accessToken
    useAuthStore.setState({ token: newToken })
    await processQueue()
    setTimeout(() => {
      triggerLayoutReset()
    }, 200)
  } catch {
    errorNavigate()
  } finally {
    requestQueue = []
    isRefreshing = false
  }

  return Promise.resolve()
}

const errorHandler = async (error: AxiosError<HttpResponse<unknown>>) => {
  const status = error.response?.status
  const code = error.response?.data?.code
  const statusText = error.response?.statusText ?? t('알 수 없는 오류')

  if (status && status >= 400) {
    const { visible, onHide } = useDialog.getState()

    if (visible) {
      onHide()
    }

    switch (code) {
      case 'AUTH-001': // 인증 필요
        navigateFn('/error', { state: { code, status, hiddenButton: true, icon: 'lock', title: 'AI Market Insights' }, replace: true })
        break
      // case 'AUTH-002': // 잘못된 자격증명
      // case 'AUTH-006': // 계정 잠김  계정이 잠겼습니다. 관리자에게 문의하세요.
      // case 'AUTH-004': // 토큰 무효
      case 'AUTH-003': // 토큰 만료
        await reissueToken(error.config)
        break
      case 'SYS-999': // 401 unknown Error
      case 'AUTH-005': // 권한 부족
      case 'AUTH-007': // 접근 거부
        navigateFn('/error', { state: { code, status }, replace: true })
        break
      case 'AUTH-008':
        navigateFn('/error/ip-verification', { state: { code, status }, replace: true })
        break
      default:
        errorHandlerOptions?.showSnackbar?.(`Error: ${statusText}`, { variant: 'error' })
        console.error(error)
        break
    }
  }
  return Promise.reject(error)
}

api.interceptors.response.use(
  async (res: AxiosResponse) => res,
  (error: AxiosError<HttpResponse<unknown>>) => errorHandler(error),
)

export default api
