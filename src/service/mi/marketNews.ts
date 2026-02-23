import { AxiosResponse } from 'axios'

import api from '@/lib/axios.ts'
import { DirectionType, IMarketRecapCheckpointItem, IMarketRecapHighlightItem } from '@/service/mi/dashboard'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export interface INewsSummaryData {
  newsSummaryId: number
  dataRegistrationSn: number
  firstCreated: string
  title: string
  story: string
  provider: string
  tagList: string[]
}

export interface INewsListRequest extends IPaginationRequest {
  sort?: 'NEWEST' | 'OLDEST'
  keyword?: string
  startDate?: string
  endDate?: string
  categories?: string
  regions?: string[]
  industries?: string[]
  sentiments?: DirectionType[]
}

export interface INewsListItem {
  newsSummaryId: number
  dataRegistrationSn: number
  firstCreated: string
  title: string
  provider: string
  categories: string[]
  regions: string[]
  industries: string[]
  isViewable: boolean
}

export type DateRangeOption = 'LAST_30_DAYS' | 'LAST_60_DAYS' | 'LAST_12_MONTHS' | 'ALL_TIME' | ''
export type RecapCategory = 'HIGHLIGHT' | 'CHECKPOINT'
export interface INewsRecapsRequest extends IPaginationRequest {
  companyNo: number
  sort?: string
  keyword?: string
  dateRangeOption?: DateRangeOption
  recapCategories?: RecapCategory[]
}
export interface INewsRecapNarrative {
  title: string
  content: string[]
}

export interface INewsRecapItem {
  marketRecapId: number
  criteriaDate: string
  categoryCode: string
  recapCategory: RecapCategory
  narrative: INewsRecapNarrative
  items: IMarketRecapHighlightItem[] | IMarketRecapCheckpointItem[]
}

export interface IDailyTrendRequest {
  companyNo: number
  dateRangeOption: string
}

export interface SentimentData {
  date: string
  upward: number
  neutral: number
  downward: number
}

export interface IDailyTrend {
  criteriaItemName: string
  data: SentimentData[]
}

const marketNewsService = {
  async getNewsList(params: Partial<INewsListRequest>, signal?: AbortSignal): Promise<IPaginationResponse<INewsListItem>> {
    const apiParams: Record<string, string | number | undefined> = {
      ...params,
      regions: params.regions?.join(','),
      industries: params.industries?.join(','),
      sentiments: params.sentiments?.map((s) => s.toLowerCase()).join(','),
    }

    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INewsListItem>>> = await api.get('mi/market-news', {
      params: apiParams,
      timeout: 120_000,
      signal,
    })
    return response.data.data
  },
  async getNewsSummaryData(newsSummaryId: string): Promise<INewsSummaryData> {
    const response: AxiosResponse<ICommonResponse<INewsSummaryData>> = await api.get(`mi/market-news/${newsSummaryId}`)

    return response.data.data
  },
  async getNewsRecaps(params: Partial<INewsRecapsRequest>): Promise<IPaginationResponse<INewsRecapItem>> {
    const { companyNo = 0, ...restParams } = params
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INewsRecapItem>>> = await api.get(
      `mi/market-news/companies/${companyNo}/recaps`,
      {
        params: {
          ...restParams,
          recapCategories: restParams.recapCategories?.join(','),
        },
      },
    )
    return response.data.data
  },
  async getDailyTrend(params: Partial<IDailyTrendRequest>): Promise<IDailyTrend> {
    const response: AxiosResponse<ICommonResponse<IDailyTrend>> = await api.get('mi/market-news/daily-trend', {
      params,
    })
    return response.data.data
  },
}

export default marketNewsService
