import Axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { t } from 'i18next'
import { NavigateFunction } from 'react-router-dom'

import { ISnackbarOptions } from '@/hooks/useSnackbar'
import useAuthStore from '@/store/useAuthStore'
export interface HttpResponse<T> {
  status: number
  code: string
  message?: string
  data?: T
}

export interface ErrorHandlerOptions {
  showSnackbar: (message: string, options?: ISnackbarOptions) => void
}

let navigateFn: NavigateFunction

export const setNavigate = (navFn: typeof navigateFn) => (navigateFn = navFn)

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

api.interceptors.request.use((req) => {
  if (req.headers !== undefined) {
    const { token, user, accessCompanyInfo } = useAuthStore.getState()

    if (token) {
      req.headers['Authorization'] = `Bearer ${token}`
    }

    if (user?.isOtherServiceAccessPossible && accessCompanyInfo?.customerCompanyNo) {
      req.headers['X-Company-No'] = accessCompanyInfo.customerCompanyNo.toString()
    }
  }

  return req
})
const errorHandler = (error: AxiosError<HttpResponse<unknown>>) => {
  const status = error.response?.status
  const code = error.response?.data?.code
  const statusText = error.response?.statusText ?? t('알 수 없는 오류')

  if (status && status >= 400) {
    switch (code) {
      // ==========TODO
      // case 'AUTH-001': // 인증 필요
      // case 'AUTH-002': // 잘못된 자격증명
      // case 'AUTH-006': // 계정 잠김  계정이 잠겼습니다. 관리자에게 문의하세요.
      // case 'AUTH-004': // 토큰 무효

      case 'AUTH-003': // 토큰 만료
        errorHandlerOptions?.showSnackbar?.(t('세션이 만료되었습니다. 다시 로그인해주세요.'), {
          variant: 'warning',
        })
        navigateFn('/login')
        break
      case 'SYS-999': // 401 unknown Error
      case 'AUTH-005': // 권한 부족
      case 'AUTH-007': // 접근 거부
        navigateFn('/error', { state: { code, status }, replace: true })
        break
      default:
        errorHandlerOptions?.showSnackbar?.(`Error: ${statusText}`, { variant: 'error' })
        break
    }
  }
  return Promise.reject(error)
}

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: AxiosError<HttpResponse<unknown>>) => errorHandler(error),
)

export default api
