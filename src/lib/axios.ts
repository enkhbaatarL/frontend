import Axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'

import { ISnackbarOptions } from '@/hooks/useSnackbar'

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
    // TODO: 헤더에 인증정보 추가
  }

  return req
})

const errorHandler = (error: AxiosError<HttpResponse<unknown>>) => {
  const status = error.response?.status

  if (status && errorHandlerOptions?.showSnackbar) {
    if (status > 400) {
      if (status === 401) {
        // TODO: logout
        errorHandlerOptions.showSnackbar('Unauthorized access', { variant: 'warning' })
      } else {
        const statusText = error.response?.statusText

        errorHandlerOptions.showSnackbar(`Error: ${statusText}`, { variant: 'error' })
      }
    }
  }

  return Promise.reject(error)
}

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: AxiosError<HttpResponse<unknown>>) => errorHandler(error),
)

export default api
