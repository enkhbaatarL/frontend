import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

/** listCases searchType — Swagger Fundamental Model Case API */
export type FundamentalModelCaseSearchType = 'TITLE' | 'ASSIGNEE_NAME'

/** listCases case status — Swagger FundamentalModelCaseListItemRes */
export type FundamentalModelCaseStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

/** latestRun status — FundamentalModelRunStatusRes */
export type FundamentalModelRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface IFundamentalModelCaseListItem {
  caseId: number
  title: string
  status: FundamentalModelCaseStatus
  assigneeName: string
  createdAt: string
  updatedAt: string
}

export interface IFundamentalModelCaseListRes {
  totalCount: number
  cases: IFundamentalModelCaseListItem[]
}

export interface IGetFundamentalModelCasesParams {
  searchType?: FundamentalModelCaseSearchType
  keyword?: string
}

export interface IFundamentalModelCaseFile {
  fileIndex: number
  originalFileName: string
  contentType?: string
  size?: number
  mockFileId?: string
}

export interface IFundamentalModelCaseLatestRun {
  runId: string
  status: FundamentalModelRunStatus
  requestedAt?: string
  startedAt?: string
  finishedAt?: string
  failureReason?: string
  errorMessage?: string
}

export interface IFundamentalModelCaseDetail {
  caseId: number
  title: string
  description?: string | null
  status: FundamentalModelCaseStatus
  assigneeName: string
  files: IFundamentalModelCaseFile[]
  latestRun: IFundamentalModelCaseLatestRun | null
  createdAt: string
  updatedAt: string
}

export interface IFundamentalModelCaseUpdateReq {
  title?: string
  description?: string
}

export interface IFundamentalModelRunReq {
  requestedByClientId?: string
}

/** runCase 응답 — FundamentalModelRunAcceptRes */
export interface IFundamentalModelRunAcceptRes {
  caseId: number
  runId: string
  status: FundamentalModelRunStatus
  requestedAt?: string
  startedAt?: string
  statusEndpoint?: string
}

/** getCaseStatus 응답 — FundamentalModelCaseStatusRes */
export interface IFundamentalModelCaseStatusRes {
  caseId: number
  title: string
  status: FundamentalModelCaseStatus
  latestRun: IFundamentalModelCaseLatestRun | null
  createdAt: string
  updatedAt: string
}

/** getVolumes segment - GLOBAL/LNG/TRADE */
export type FundamentalModelVolumesSegment = 'GLOBAL' | 'LNG' | 'TRADE'

/** getVolumes 데이터 타입(섹션 단위) */
export type FundamentalModelVolumesType = 'DEMAND' | 'PRODUCTION' | 'LNG_IMPORTS' | 'LNG_EXPORTS' | 'PIPELINE_IMPORTS' | 'PIPELINE_EXPORTS'

/** getVolumes region */
export type FundamentalModelVolumesRegion =
  | 'ASIA'
  | 'EUROPE'
  | 'NORTH_AMERICA'
  | 'MIDDLE_EAST'
  | 'AUSTRALIA'
  | 'RUSSIA'
  | 'AFRICA'
  | 'SOUTH_AMERICA'

/** getVolumes 시간 단위 */
export type FundamentalModelVolumesGranularity = 'MONTHLY' | 'YEARLY'

/** getVolumes 행 구분 - COUNTRY: 국가행, REGION_SUBTOTAL: 지역 소계, TYPE_TOTAL: 섹션 총계 */
export type FundamentalModelVolumesRowKind = 'COUNTRY' | 'REGION_SUBTOTAL' | 'TYPE_TOTAL'

/** Volumes 컬럼(시간축) - YEARLY일 때 month는 null */
export interface IFundamentalModelVolumesColumn {
  year: number
  month: number | null
  periodLabel: string
}

/** Volumes 한 행 - columns 순서와 1:1 대응되는 values */
export interface IFundamentalModelVolumesRow {
  type: FundamentalModelVolumesType
  region: FundamentalModelVolumesRegion
  country: string | null
  rowKind: FundamentalModelVolumesRowKind
  values: number[]
}

/** Volumes 적용 필터(서버가 echo) */
export interface IFundamentalModelVolumesAppliedFilters {
  types?: FundamentalModelVolumesType[]
  regions?: FundamentalModelVolumesRegion[]
}

/** getVolumes 응답 — FundamentalModelVolumesRes */
export interface IFundamentalModelVolumesRes {
  caseId: number
  segment: FundamentalModelVolumesSegment
  granularity: FundamentalModelVolumesGranularity
  appliedFilters: IFundamentalModelVolumesAppliedFilters
  columns: IFundamentalModelVolumesColumn[]
  rows: IFundamentalModelVolumesRow[]
}

/** getVolumes 요청 파라미터 */
export interface IGetFundamentalModelVolumesParams {
  segment: FundamentalModelVolumesSegment
  /** 미전달 시 전체 */
  types?: FundamentalModelVolumesType[]
  /** 미전달 시 전체 */
  regions?: FundamentalModelVolumesRegion[]
  /** 기본 MONTHLY */
  granularity?: FundamentalModelVolumesGranularity
}

const fundamentalModelCaseService = {
  async listCases(params?: IGetFundamentalModelCasesParams): Promise<IFundamentalModelCaseListRes> {
    const trimmedKeyword = params?.keyword?.trim()
    const response: AxiosResponse<ICommonResponse<IFundamentalModelCaseListRes>> = await api.get('mi/fundamental-model/cases', {
      params: {
        searchType: trimmedKeyword ? params?.searchType : undefined,
        keyword: trimmedKeyword || undefined,
      },
    })

    return response.data.data
  },

  async getCaseDetail(caseId: number): Promise<IFundamentalModelCaseDetail> {
    const response: AxiosResponse<ICommonResponse<IFundamentalModelCaseDetail>> = await api.get(`mi/fundamental-model/cases/${caseId}`)
    return response.data.data
  },

  async getCaseStatus(caseId: number): Promise<IFundamentalModelCaseStatusRes> {
    const response: AxiosResponse<ICommonResponse<IFundamentalModelCaseStatusRes>> = await api.get(
      `mi/fundamental-model/cases/${caseId}/status`,
    )
    return response.data.data
  },

  async runCase(caseId: number, body?: IFundamentalModelRunReq): Promise<IFundamentalModelRunAcceptRes> {
    const response: AxiosResponse<ICommonResponse<IFundamentalModelRunAcceptRes>> = await api.post(
      `mi/fundamental-model/cases/${caseId}/runs`,
      body ?? {},
    )
    return response.data.data
  },

  async updateCase(caseId: number, body: IFundamentalModelCaseUpdateReq): Promise<IFundamentalModelCaseDetail> {
    const response: AxiosResponse<ICommonResponse<IFundamentalModelCaseDetail>> = await api.patch(
      `mi/fundamental-model/cases/${caseId}`,
      body,
    )
    return response.data.data
  },

  async deleteCase(caseId: number): Promise<void> {
    await api.delete(`mi/fundamental-model/cases/${caseId}`)
  },

  /** COMPLETED 케이스의 Volumes 데이터 조회. types/regions는 콤마 join 으로 전달 */
  async getVolumes(caseId: number, params: IGetFundamentalModelVolumesParams): Promise<IFundamentalModelVolumesRes> {
    const types = params.types && params.types.length > 0 ? params.types.join(',') : undefined
    const regions = params.regions && params.regions.length > 0 ? params.regions.join(',') : undefined

    const response: AxiosResponse<ICommonResponse<IFundamentalModelVolumesRes>> = await api.get(
      `mi/fundamental-model/cases/${caseId}/volumes`,
      {
        params: {
          segment: params.segment,
          types,
          regions,
          granularity: params.granularity,
        },
      },
    )
    return response.data.data
  },
}

export default fundamentalModelCaseService
