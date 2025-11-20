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
  tagList: string[]
}

export interface INewsListRequest extends IPaginationRequest {
  sort?: 'NEWEST' | 'OLDEST'
  keyword?: string
  startDate?: string
  endDate?: string
  categories?: string[]
  regions?: string[]
  industries?: string[]
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
}

const marketNewsService = {
  async getNewsList(params: Partial<INewsListRequest>, signal?: AbortSignal): Promise<IPaginationResponse<INewsListItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INewsListItem>>> = await api.get('mi/market-news', {
      params: {
        ...params,
        categories: params.categories?.join(','),
        regions: params.regions?.join(','),
        industries: params.industries?.join(','),
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
