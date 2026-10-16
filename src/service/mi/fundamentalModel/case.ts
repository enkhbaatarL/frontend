import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse } from '@/types/api'

export type FundamentalModelCaseSearchType = 'TITLE' | 'ASSIGNEE_NAME'
export type FundamentalModelCaseStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
export type FundamentalModelCaseExecType = 'INDEPENDENT' | 'MI_BASE'
export type FundamentalModelRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface FundamentalModelCaseListItem {
  caseId: number
  title: string
  status: FundamentalModelCaseStatus
  execType: FundamentalModelCaseExecType
  assigneeName: string
  createdAt: string
  updatedAt: string
}

export interface FundamentalModelCaseList {
  totalCount: number
  miBase: FundamentalModelCaseListItem | null
  cases: FundamentalModelCaseListItem[]
}

export interface GetFundamentalModelCasesParams {
  searchType?: FundamentalModelCaseSearchType
  keyword?: string
}

export interface FundamentalModelCaseFile {
  fileNo: number
  fileIndex: number
  originalFileName: string
  contentType?: string
  size?: number
}

export interface FundamentalModelDownloadFile {
  fileNo: number
  fileNm: string
  fileSize: number
}

export interface FundamentalModelCaseFiles {
  input: FundamentalModelDownloadFile[]
  output: FundamentalModelDownloadFile[]
  tradeOutput?: FundamentalModelDownloadFile[]
  intermediate: FundamentalModelDownloadFile[]
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
  execType: FundamentalModelCaseExecType
  assigneeName: string
  assigneeUserNo: number
  files: FundamentalModelCaseFiles
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

export type PriceChartSeriesType = 'BASE_CASE' | 'USER_ADJUSTED'

export interface PriceChartPoint {
  year: number
  month?: number | null
  value: number
}

export interface PriceChartSeries {
  seriesType: PriceChartSeriesType
  label: string
  points: PriceChartPoint[]
}

export interface PriceChartSeriesSet {
  priceRegion: string
  series: PriceChartSeries[]
}

export interface PriceChart {
  monthlySeriesSets: PriceChartSeriesSet[]
  yearlySeriesSets: PriceChartSeriesSet[]
}

export interface PriceColumn {
  key: string
  label: string
}

export interface PriceRow {
  year: number
  month?: number | null
  priceRegion: string
  baseCasePrice: number | null
  userAdjustedPrice: number | null
  [key: string]: string | number | null | undefined
}

export interface PriceTable {
  columns: PriceColumn[]
  rows: PriceRow[]
}

export interface FundamentalModelPrice {
  caseId: number
  chart: PriceChart
  annualTable: PriceTable
  monthlyTable: PriceTable
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

export interface FundamentalModelRegionFilterOption {
  value: string
  label: string
  countries: FundamentalModelFilterOption[]
}

export interface GetFundamentalModelVolumesFilterOptionsParams {
  caseId?: number
  selector?: FundamentalModelTradeSelector
  year?: number
}

export interface FundamentalModelVolumesSegmentFilterOptions {
  segment: FundamentalModelVolumesSegment
  types: FundamentalModelFilterOption[]
  regions: FundamentalModelRegionFilterOption[]
  granularities: FundamentalModelFilterOption[]
  periods?: FundamentalModelPeriodFilterOptions
}

export interface FundamentalModelPeriodFilterOptions {
  yearly: FundamentalModelFilterOption[]
  monthly: FundamentalModelFilterOption[]
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
  countryKeys?: string[]
  periods?: string[]
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
  countryKeys?: string[]
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
  countryKeys?: string[]
  granularity?: FundamentalModelVolumesGranularity
  /** YEARLY: yyyy, MONTHLY: yyyy-MM. 미전달 시 전체 기간 */
  periods?: string[]
}

export interface GetFundamentalModelTradeFlowsParams {
  selector: FundamentalModelTradeSelector
  year: number
  unit?: FundamentalModelTradeUnit
  types?: FundamentalModelTradeFlowsType[]
  regions?: FundamentalModelVolumesRegion[]
  countryKeys?: string[]
}

const fundamentalModelCaseService = {
  async createCase(body: FundamentalModelCaseCreateRequest): Promise<FundamentalModelCaseCreate> {
    const formData = new FormData()
    body.files.forEach((file) => formData.append('files', file))

    const response: AxiosResponse<ICommonResponse<FundamentalModelCaseCreate>> = await api.post(
      withCustomBaseUrl('mi/fundamental-model/cases'),
      formData,
      {
        params: {
          title: body.title.trim(),
          description: body.description?.trim() || undefined,
        },
        suppressGlobalErrorHandler: true,
        timeout: 0,
      } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean },
    )
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

  async designateMiBase(caseId: number): Promise<FundamentalModelCaseListItem> {
    const response: AxiosResponse<ICommonResponse<FundamentalModelCaseListItem>> = await api.put(
      `mi/fundamental-model/cases/${caseId}/mi-base`,
    )
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

  async getVolumesFilterOptions(params?: GetFundamentalModelVolumesFilterOptionsParams): Promise<FundamentalModelVolumesFilterOptions> {
    const response: AxiosResponse<ICommonResponse<FundamentalModelVolumesFilterOptions>> = await api.get(
      'mi/fundamental-model/cases/volumes/filter-options',
      { params },
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
          countryKeys: params.countryKeys?.length ? params.countryKeys.join(',') : undefined,
          periods: params.periods?.length ? params.periods.join(',') : undefined,
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
          countryKeys: params.countryKeys?.length ? params.countryKeys.join(',') : undefined,
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
