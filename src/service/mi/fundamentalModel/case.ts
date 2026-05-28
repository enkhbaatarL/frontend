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

export type FundamentalModelPriceSeriesType = 'BASE_CASE' | 'USER_ADJUSTED'

export interface IFundamentalModelPriceChartPoint {
  year: number
  month: number
  value: number
}

export interface IFundamentalModelPriceChartSeries {
  seriesType: FundamentalModelPriceSeriesType
  label: string
  points: IFundamentalModelPriceChartPoint[]
}

export interface IFundamentalModelPriceChartSeriesSet {
  priceRegion: string
  series: IFundamentalModelPriceChartSeries[]
}

export interface IFundamentalModelPriceChart {
  seriesSets: IFundamentalModelPriceChartSeriesSet[]
}

export interface IFundamentalModelPriceColumn {
  key: string
  label: string
}

export interface IFundamentalModelPriceRow {
  year: number
  month?: number | null
  priceRegion: string
  baseCasePrice: number | null
  userAdjustedPrice: number | null
  [key: string]: string | number | null | undefined
}

export interface IFundamentalModelPriceTable {
  columns: IFundamentalModelPriceColumn[]
  rows: IFundamentalModelPriceRow[]
}

export interface IFundamentalModelPriceRes {
  caseId: number
  chart: IFundamentalModelPriceChart
  annualTable: IFundamentalModelPriceTable
  monthlyTable: IFundamentalModelPriceTable
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

  async getPrice(caseId: number): Promise<IFundamentalModelPriceRes> {
    const response: AxiosResponse<ICommonResponse<IFundamentalModelPriceRes>> = await api.get(`mi/fundamental-model/cases/${caseId}/price`)
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
}

export default fundamentalModelCaseService
