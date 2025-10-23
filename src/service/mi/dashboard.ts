import { AxiosResponse } from 'axios'

import api from '@/lib/axios.ts'
import { ICommonResponse } from '@/types/api'

export type MarketItemType = 'positive' | 'neutral' | 'negative'

export interface MarketItem {
  id: string
  type?: MarketItemType
  title: string
  summary: string[]
  sources: { name: string; link: string }[]
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
  summary: string[]
  title: string
  provider: string
  impctScre: number
  drctnlt: DirectionType
}

const dashboardService = {
  async getTimeline(categoryCode: string): Promise<INewsFeedItem[]> {
    const response: AxiosResponse<ICommonResponse<INewsFeedItem[]>> = await api.get('mi/market-news/timeline', {
      params: {
        category: categoryCode,
      },
    })

    return response.data.data
  },
  async getNewsFeed(categoryCode: string): Promise<INewsFeedItem[]> {
    const response: AxiosResponse<ICommonResponse<INewsFeedItem[]>> = await api.get('mi/market-news/feed', {
      params: {
        category: categoryCode,
      },
    })

    return response.data.data
  },
}

export default dashboardService
