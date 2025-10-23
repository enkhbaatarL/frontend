import { AxiosResponse } from 'axios'

import api from '@/lib/axios.ts'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export type MarketItemType = 'positive' | 'neutral' | 'negative'

export interface SourceOption {
  name: string
  link: string
}

export interface MarketItem {
  id: string
  type?: MarketItemType
  title: string
  summary: string[]
  sources: SourceOption[]
  impact?: string
}

export enum DirectionType {
  Upward = 'Upward',
  Downward = 'Downward',
  Neutral = 'Neutral',
}

export interface INewsFeedItem {
  nwsSigId: number
  dataRegistrationSn: number
  firstCreated: string
  nwsMrktCtgrCd: string
  newsSummaryId: number
  briefSummary: string
  summary: string
  title: string
  provider: string
  impctScre: number
  drctnlt: DirectionType
}

const dashboardService = {
  async getNewsFeed(categoryCode: string): Promise<IPaginationResponse<INewsFeedItem>> {
    // TODO: API 변경시 IPaginationResponse 제거 필요
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INewsFeedItem>>> = await api.get('mi/market-news/feed', {
      params: {
        category: categoryCode,
      },
    })

    return response.data.data
  },
}

export default dashboardService
