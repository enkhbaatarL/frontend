import Axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'

export interface HttpResponse<T> {
  status: number
  code: string
  message?: string
  data?: T
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

  if (status) {
    if (status > 400) {
      if (status === 401) {
        // TODO: logout
        console.error('Unauthorized')
      } else {
        // TODO: toast 처리
        console.error('Default Error')
      }
    }
  }

  return Promise.reject(error)
}

api.interceptors.response.use((res: AxiosResponse) => res, errorHandler)

export default api
