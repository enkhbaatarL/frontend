import { AxiosResponse } from 'axios'

import api from '@/lib/axios.ts'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export interface INewsSummaryData {
  newsSummaryId: number
  dataRegistrationSn: number
  firstCreated: string
  title: string
  story: string
  provider: string
}

export interface INewsListRequest extends IPaginationRequest {
  sort?: 'NEWEST' | 'OLDEST'
  keyword?: string
  startDate?: string
  endDate?: string
  category?: string[]
  region?: string[]
  industry?: string[]
}

export interface INewsListItem {
  newsSummaryId: number
  dataRegistrationSn: number
  firstCreated: string
  title: string
  provider: string
}

const marketNewsService = {
  async getNewsList(params: Partial<INewsListRequest>, signal?: AbortSignal): Promise<IPaginationResponse<INewsListItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INewsListItem>>> = await api.get('mi/market-news', {
      params: {
        ...params,
        category: params.category?.join(','),
        region: params.region?.join(','),
        industry: params.industry?.join(','),
      },
      timeout: 120_000,
      signal,
    })
    return response.data.data
  },
  async getNewsSummaryData(newsSummaryId: string): Promise<INewsSummaryData> {
    const response: AxiosResponse<ICommonResponse<INewsSummaryData>> = await api.get(`mi/market-news/${newsSummaryId}`)

    return response.data.data
  },
}

export default marketNewsService
