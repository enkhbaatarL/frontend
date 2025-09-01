export interface ICommonResponse<T> {
  code: string
  data: T
  message: string
  status: boolean
}

export interface IPaginationRequest {
  page: number
  size: number
}

export interface IPaginationResponse<T> {
  totalPages: number
  totalElements: number
  currentPage: number
  numberOfElements: number
  size: number
  isFirst: boolean
  isLast: boolean
  hasPrevious: boolean
  hasNext: boolean
  detail: T[]
  headers?: {
    field: string
    name: string
  }[]
}
