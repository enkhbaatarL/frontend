export interface ICommonResponse<T> {
  code: string
  data: T
  message: string
  status: boolean
}

export interface ISamplePagination<T> {
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
}

export interface ISampleReq {
  name: string
}

export interface ISampleRes {
  items: string[]
}

export interface ISampleOption {
  label: string
  value: string
}

export interface ISampleCompaniesResData {
  companyName: string
  companyEngName: string
  createUserId: string
  createDt: string
  modifyUserId: string
  modifyDt: string
}
