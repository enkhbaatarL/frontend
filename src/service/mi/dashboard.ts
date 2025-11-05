import { AxiosResponse } from 'axios'
import dayjs from 'dayjs'

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
  regions: string[]
}

export interface INewsFeedFilter {
  sort: string
  sentiments: string[]
  impactScores: string[]
  regions: string[]
}

const dashboardService = {
  async getTimeline(categoryCode: string): Promise<INewsFeedItem[]> {
    const response: AxiosResponse<ICommonResponse<INewsFeedItem[]>> = await api.get('mi/market-news/timeline', {
      params: {
        criteriaDate: dayjs().format('YYYYMMDD'),
        category: categoryCode,
      },
    })

    return response.data.data
  },
  async getNewsFeed(categoryCode: string, filters: INewsFeedFilter): Promise<INewsFeedItem[]> {
    const response: AxiosResponse<ICommonResponse<INewsFeedItem[]>> = await api.get('mi/market-news/feed', {
      params: {
        criteriaDate: dayjs().format('YYYYMMDD'),
        category: categoryCode,
        sort: filters.sort,
        sentiments: filters.sentiments.join(','),
        impactScores: filters.impactScores.join(','),
        regions: filters.regions.join(','),
      },
    })

    return response.data.data
  },
  async getTopicSimilarKeywords(query: string, limit?: number): Promise<string[]> {
    const response: AxiosResponse<ICommonResponse<string[]>> = await api.get('mi/autocomplete/topic', {
      params: {
        query,
        limit,
      },
    })

    return response.data.data
  },
}

export default dashboardService
