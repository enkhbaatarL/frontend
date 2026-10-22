import Axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { t } from 'i18next'
import { NavigateFunction } from 'react-router-dom'

import { ISnackbarOptions } from '@/hooks/useSnackbar'
import i18n from '@/lib/i18n'
import useAuthStore from '@/store/useAuthStore'
import useDialog from '@/store/useDialog'

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
  // 수급 모델 API -> 응답 대기 시간 제한 해제 (처리 느림)
  if (/(?:^|\/)mi\/fundamental-model(?:\/|[?#]|$)/.test(req.url ?? '')) {
    req.timeout = 0
  }

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

/* ── 토큰 갱신 & 재시도 ── */

let isRefreshing = false
let failedQueue: {
  resolve: (value: AxiosResponse) => void
  reject: (reason?: unknown) => void
  config: InternalAxiosRequestConfig
}[] = []

const showExpiredSessionDialog = () => {
  const { onShow, onHide } = useDialog.getState()
  onHide()
  onShow({
    title: t('세션이 만료되었습니다.'),
    disableClose: true,
    zIndex: 1600,
    actions: [
      {
        label: 'Login',
        onClick: async () => {
          useDialog.getState().onHide()
          globalThis.location.href = '/'
        },
      },
    ],
  })
}

const drainQueue = (error: AxiosError | null, newToken: string | null = null) => {
  for (const entry of failedQueue) {
    if (error) {
      entry.reject(error)
    } else {
      if (newToken && entry.config.headers) {
        entry.config.headers['Authorization'] = `Bearer ${newToken}`
      }
      entry.resolve(api(entry.config) as unknown as AxiosResponse)
    }
  }
  failedQueue = []
}

/**
 * AUTH-003 토큰 만료 시 토큰을 갱신하고 원래 요청을 재시도한 결과를 반환한다.
 * 동시 다발 요청이 실패해도 토큰 갱신은 한 번만 수행하고,
 * 나머지는 큐에 쌓았다가 갱신 완료 후 일괄 재시도한다.
 */
const refreshAndRetry = async (failedConfig: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  if (isRefreshing) {
    return new Promise<AxiosResponse>((resolve, reject) => {
      failedQueue.push({ resolve, reject, config: failedConfig })
    })
  }

  isRefreshing = true

  try {
    const { token: savedToken } = useAuthStore.getState()
    if (!savedToken) {
      drainQueue(null)
      showExpiredSessionDialog()
      throw new Error('No saved token')
    }

    const res = await fetch('/api/v1/auth/token-generation', {
      method: 'POST',
      headers: { Authorization: `Bearer ${savedToken}` },
      credentials: 'include',
    })

    if (!res.ok) {
      drainQueue(null)
      showExpiredSessionDialog()
      throw new Error('Token refresh failed')
    }

    const data = await res.json()
    const newToken: string = data?.data?.accessToken
    useAuthStore.setState({ token: newToken })

    failedConfig.headers['Authorization'] = `Bearer ${newToken}`
    drainQueue(null, newToken)
    return api(failedConfig)
  } catch (err) {
    const isHandledRefreshExit = err instanceof Error && (err.message === 'No saved token' || err.message === 'Token refresh failed')
    if (!isHandledRefreshExit) {
      drainQueue(err as AxiosError)
      showExpiredSessionDialog()
    }
    throw err
  } finally {
    isRefreshing = false
  }
}

const errorHandler = async (error: AxiosError<HttpResponse<unknown>>) => {
  const status = error.response?.status
  const code = error.response?.data?.code
  const statusText = error.response?.statusText ?? t('알 수 없는 오류')
  const originalConfig = error.config
  const suppressGlobalErrorHandler = Boolean(
    (originalConfig as (InternalAxiosRequestConfig & { suppressGlobalErrorHandler?: boolean }) | undefined)?.suppressGlobalErrorHandler,
  )

  if (status && status >= 400) {
    if (code === 'AUTH-003' && originalConfig) {
      return refreshAndRetry(originalConfig)
    }

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
      // case 'AUTH-003': // 토큰 만료
      case 'SYS-999': // 401 unknown Error
      case 'AUTH-005': // 권한 부족
      case 'AUTH-007': // 접근 거부
        navigateFn('/error', { state: { code, status }, replace: true })
        break
      case 'AUTH-008':
        navigateFn('/error/ip-verification', { state: { code, status }, replace: true })
        break
      default:
        if (!suppressGlobalErrorHandler) {
          errorHandlerOptions?.showSnackbar?.(`Error: ${statusText}`, { variant: 'error' })
        }
        break
    }
  }
  throw error
}

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: AxiosError<HttpResponse<unknown>>) => errorHandler(error),
)

export default api
