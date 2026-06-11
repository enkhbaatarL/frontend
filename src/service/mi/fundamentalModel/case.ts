import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse } from '@/types/api'

export type FundamentalModelCaseSearchType = 'TITLE' | 'ASSIGNEE_NAME'
export type FundamentalModelCaseStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
export type FundamentalModelRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface FundamentalModelCaseListItem {
  caseId: number
  title: string
  status: FundamentalModelCaseStatus
  assigneeName: string
  createdAt: string
  updatedAt: string
}

export interface FundamentalModelCaseList {
  totalCount: number
  cases: FundamentalModelCaseListItem[]
}

export interface GetFundamentalModelCasesParams {
  searchType?: FundamentalModelCaseSearchType
  keyword?: string
}

export interface FundamentalModelCaseFile {
  fileIndex: number
  originalFileName: string
  contentType?: string
  size?: number
  mockFileId?: string
}

export interface FundamentalModelLatestRun {
  runId: string
  status: FundamentalModelRunStatus
  requestedAt?: string
  startedAt?: string
  finishedAt?: string
  failureReason?: string
  errorMessage?: string
}

export interface FundamentalModelCaseDetail {
  caseId: number
  title: string
  description?: string | null
  status: FundamentalModelCaseStatus
  assigneeName: string
  assigneeUserNo: number
  files: FundamentalModelCaseFile[]
  latestRun: FundamentalModelLatestRun | null
  createdAt: string
  updatedAt: string
}

export interface FundamentalModelCaseCreateRequest {
  title: string
  description?: string
  files: File[]
}

export interface FundamentalModelCaseCreate {
  caseId: number
  title: string
  description?: string | null
  status: FundamentalModelCaseStatus
  files: FundamentalModelCaseFile[]
  createdAt: string
  statusEndpoint?: string
}

export interface FundamentalModelCaseUpdateRequest {
  title?: string
  description?: string
}

export interface FundamentalModelRunRequest {
  requestedByClientId?: string
}

export interface FundamentalModelRunCallbackRequest {
  status: FundamentalModelRunStatus
  finishedAt: string
  failureReason?: string
  errorMessage?: string
}

export interface FundamentalModelRunCallback {
  runId: string
  status: FundamentalModelRunStatus
  processedAt?: string
}

export interface FundamentalModelRunAccept {
  caseId: number
  runId: string
  status: FundamentalModelRunStatus
  requestedAt?: string
  startedAt?: string
  statusEndpoint?: string
}

export interface FundamentalModelCaseStatusSnapshot {
  caseId: number
  title: string
  status: FundamentalModelCaseStatus
  latestRun: FundamentalModelLatestRun | null
  createdAt: string
  updatedAt: string
}

export type FundamentalModelPriceSeriesType = 'BASE_CASE' | 'USER_ADJUSTED'

export interface FundamentalModelPriceChartPoint {
  year: number
  month: number
  value: number
}

export interface FundamentalModelPriceChartSeries {
  seriesType: FundamentalModelPriceSeriesType
  label: string
  points: FundamentalModelPriceChartPoint[]
}

export interface FundamentalModelPriceChartSeriesSet {
  priceRegion: string
  series: FundamentalModelPriceChartSeries[]
}

export interface FundamentalModelPriceChart {
  seriesSets: FundamentalModelPriceChartSeriesSet[]
}

export interface FundamentalModelPriceColumn {
  key: string
  label: string
}

export interface FundamentalModelPriceRow {
  year: number
  month?: number | null
  priceRegion: string
  baseCasePrice: number | null
  userAdjustedPrice: number | null
  [key: string]: string | number | null | undefined
}

export interface FundamentalModelPriceTable {
  columns: FundamentalModelPriceColumn[]
  rows: FundamentalModelPriceRow[]
}

export interface FundamentalModelPrice {
  caseId: number
  chart: FundamentalModelPriceChart
  annualTable: FundamentalModelPriceTable
  monthlyTable: FundamentalModelPriceTable
}

export type FundamentalModelVolumesSegment = 'GLOBAL' | 'LNG' | 'TRADE'
export type FundamentalModelVolumesType = 'DEMAND' | 'PRODUCTION' | 'LNG_IMPORTS' | 'LNG_EXPORTS' | 'PIPELINE_IMPORTS' | 'PIPELINE_EXPORTS'
export type FundamentalModelVolumesRegion =
  | 'ASIA'
  | 'EUROPE'
  | 'NORTH_AMERICA'
  | 'MIDDLE_EAST'
  | 'AUSTRALIA'
  | 'RUSSIA'
  | 'AFRICA'
  | 'SOUTH_AMERICA'

export type FundamentalModelVolumesGranularity = 'MONTHLY' | 'YEARLY'
export type FundamentalModelVolumesRowKind = 'COUNTRY' | 'REGION_SUBTOTAL' | 'TYPE_TOTAL'

export type FundamentalModelTradeSelector = 'LNG' | 'PNG'
export type FundamentalModelTradeUnit = 'MTPA' | 'BCM'
export type FundamentalModelTradeFlowsType = 'TO_COUNTRY' | 'FROM_COUNTRY'
export type FundamentalModelTradeCountryHeaderKind = 'REGION_TOTAL' | 'COUNTRY' | 'GRAND_TOTAL'

export interface FundamentalModelFilterOption {
  value: string
  label: string
}

export interface FundamentalModelVolumesSegmentFilterOptions {
  segment: FundamentalModelVolumesSegment
  types: FundamentalModelFilterOption[]
  regions: FundamentalModelFilterOption[]
  granularities: FundamentalModelFilterOption[]
}

export interface FundamentalModelVolumesFilterOptions {
  segments: FundamentalModelVolumesSegmentFilterOptions[]
}

export interface FundamentalModelVolumesColumn {
  key: string
  label: string
  year: number
  month: number | null
}

export interface FundamentalModelVolumesRow {
  type: FundamentalModelVolumesType
  typeLabel: string
  region: FundamentalModelVolumesRegion
  country: string | null
  rowKind: FundamentalModelVolumesRowKind
  rowLabel: string
  values: Record<string, number>
}

export interface FundamentalModelVolumesAppliedFilters {
  types?: FundamentalModelVolumesType[]
  regions?: FundamentalModelVolumesRegion[]
}

export interface FundamentalModelVolumes {
  caseId: number
  segment: FundamentalModelVolumesSegment
  granularity: FundamentalModelVolumesGranularity
  unit: 'MTPA'
  appliedFilters: FundamentalModelVolumesAppliedFilters
  columns: FundamentalModelVolumesColumn[]
  rows: FundamentalModelVolumesRow[]
}

export interface FundamentalModelTradeFlowsAppliedFilters {
  types?: FundamentalModelTradeFlowsType[]
  regions?: FundamentalModelVolumesRegion[]
}

export interface FundamentalModelTradeCountryHeader {
  key: string
  label: string
  kind: FundamentalModelTradeCountryHeaderKind
  region: FundamentalModelVolumesRegion | null
  country: string | null
}

export interface FundamentalModelTradeFlowItem {
  fromKey: string
  toKey: string
  fromRegion: FundamentalModelVolumesRegion | null
  fromCountry: string | null
  toRegion: FundamentalModelVolumesRegion | null
  toCountry: string | null
  value: number
}

export interface FundamentalModelTradeFlows {
  caseId: number
  selector: FundamentalModelTradeSelector
  year: number
  unit: FundamentalModelTradeUnit
  appliedFilters: FundamentalModelTradeFlowsAppliedFilters
  fromCountries: FundamentalModelTradeCountryHeader[]
  toCountries: FundamentalModelTradeCountryHeader[]
  flows: FundamentalModelTradeFlowItem[]
}

export interface GetFundamentalModelVolumesParams {
  segment: FundamentalModelVolumesSegment
  types?: FundamentalModelVolumesType[]
  regions?: FundamentalModelVolumesRegion[]
  granularity?: FundamentalModelVolumesGranularity
}

export interface GetFundamentalModelTradeFlowsParams {
  selector: FundamentalModelTradeSelector
  year: number
  unit?: FundamentalModelTradeUnit
  types?: FundamentalModelTradeFlowsType[]
  regions?: FundamentalModelVolumesRegion[]
}

const fundamentalModelCaseService = {
  async createCase(body: FundamentalModelCaseCreateRequest): Promise<FundamentalModelCaseCreate> {
    const formData = new FormData()
    body.files.forEach((file) => formData.append('files', file))

    const response: AxiosResponse<ICommonResponse<FundamentalModelCaseCreate>> = await api.post('mi/fundamental-model/cases', formData, {
      params: {
        title: body.title.trim(),
        description: body.description?.trim() || undefined,
      },
      suppressGlobalErrorHandler: true,
      timeout: 0,
    } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean })
    return response.data.data
  },

  async listCases(params?: GetFundamentalModelCasesParams): Promise<FundamentalModelCaseList> {
    const trimmedKeyword = params?.keyword?.trim()
    const response: AxiosResponse<ICommonResponse<FundamentalModelCaseList>> = await api.get('mi/fundamental-model/cases', {
      params: {
        searchType: trimmedKeyword ? params?.searchType : undefined,
        keyword: trimmedKeyword || undefined,
      },
    })

    return response.data.data
  },

  async getCaseDetail(caseId: number): Promise<FundamentalModelCaseDetail> {
    const response: AxiosResponse<ICommonResponse<FundamentalModelCaseDetail>> = await api.get(`mi/fundamental-model/cases/${caseId}`)
    return response.data.data
  },

  async getCaseStatus(caseId: number): Promise<FundamentalModelCaseStatusSnapshot> {
    const response: AxiosResponse<ICommonResponse<FundamentalModelCaseStatusSnapshot>> = await api.get(
      `mi/fundamental-model/cases/${caseId}/status`,
    )
    return response.data.data
  },

  async getPrice(caseId: number): Promise<FundamentalModelPrice> {
    const response: AxiosResponse<ICommonResponse<FundamentalModelPrice>> = await api.get(`mi/fundamental-model/cases/${caseId}/price`)
    return response.data.data
  },

  async runCase(caseId: number, body?: FundamentalModelRunRequest): Promise<FundamentalModelRunAccept> {
    const response: AxiosResponse<ICommonResponse<FundamentalModelRunAccept>> = await api.post(
      withCustomBaseUrl(`mi/fundamental-model/cases/${caseId}/runs`),
      body ?? {},
    )
    return response.data.data
  },

  async callbackRun(runId: string, body: FundamentalModelRunCallbackRequest): Promise<FundamentalModelRunCallback> {
    const response: AxiosResponse<ICommonResponse<FundamentalModelRunCallback>> = await api.post(
      withCustomBaseUrl(`mi/fundamental-model/runs/${runId}/callback`),
      body,
    )
    return response.data.data
  },

  async updateCase(caseId: number, body: FundamentalModelCaseUpdateRequest): Promise<FundamentalModelCaseDetail> {
    const response: AxiosResponse<ICommonResponse<FundamentalModelCaseDetail>> = await api.patch(
      `mi/fundamental-model/cases/${caseId}`,
      body,
    )
    return response.data.data
  },

  async deleteCase(caseId: number): Promise<void> {
    await api.delete(`mi/fundamental-model/cases/${caseId}`)
  },

  async getVolumesFilterOptions(): Promise<FundamentalModelVolumesFilterOptions> {
    const response: AxiosResponse<ICommonResponse<FundamentalModelVolumesFilterOptions>> = await api.get(
      'mi/fundamental-model/cases/volumes/filter-options',
    )
    return response.data.data
  },

  async getVolumes(caseId: number, params: GetFundamentalModelVolumesParams): Promise<FundamentalModelVolumes> {
    const types = params.types && params.types.length > 0 ? params.types.join(',') : undefined
    const regions = params.regions && params.regions.length > 0 ? params.regions.join(',') : undefined

    const response: AxiosResponse<ICommonResponse<FundamentalModelVolumes>> = await api.get(
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

  async getTradeFlows(caseId: number, params: GetFundamentalModelTradeFlowsParams): Promise<FundamentalModelTradeFlows> {
    const types = params.types && params.types.length > 0 ? params.types.join(',') : undefined
    const regions = params.regions && params.regions.length > 0 ? params.regions.join(',') : undefined

    const response: AxiosResponse<ICommonResponse<FundamentalModelTradeFlows>> = await api.get(
      `mi/fundamental-model/cases/${caseId}/volumes/trade`,
      {
        params: {
          selector: params.selector,
          year: params.year,
          unit: params.unit,
          types,
          regions,
        },
      },
    )
    return response.data.data
  },
}

export default fundamentalModelCaseService
