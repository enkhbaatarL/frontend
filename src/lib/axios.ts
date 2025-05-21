import Axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { t } from 'i18next'

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

  if (status && status >= 400) {
    const statusText = error.response?.statusText

    switch (status) {
      case 400:
        errorHandlerOptions?.showSnackbar?.(t('잘못된 요청입니다.'), { variant: 'error' })
        break
      case 401:
        // TODO: logout
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
