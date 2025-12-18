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
  newsSignificanceId?: number
  newsEventId?: number
  significantNewsId?: number
  dataRegistrationSerialNo: number
  firstCreated: string
  newsMarketCategoryCode: string
  newsSummaryId: number
  similarityGroupStatusCode?: string
  newsEventNameEn?: string
  briefSummary: string | null
  summary: string[]
  title: string
  provider: string
  newsSignificanceScore?: number
  score?: number
  significantNewsScore?: number
  directionality: DirectionType
  regions?: string[]
  similarNewsList?: Array<{
    newsSummaryId: number
    title: string
    firstCreated: string
    dataRegistrationSerialNo: number
  }> | null
}

export interface INewsFeedFilter {
  sort: string
  sentiments: DirectionType[]
  impactScores: string[]
  regions: string[]
}

// Market Recap 관련 타입들
export interface IMarketRecapSentimentItem {
  period: string
  upwardCount: number
  neutralCount: number
  downwardCount: number
}

export interface IMarketRecapSentiments {
  [key: string]: IMarketRecapSentimentItem
}

export interface IMarketRecapRelatedNews {
  provider: string
  newsSummaryId: number
  title: string
}

export interface IMarketRecapHighlightItem {
  highlightItemId: number
  title: string
  content: string[]
  momentum?: DirectionType
  relatedNews?: IMarketRecapRelatedNews[]
}

export interface IMarketRecapHighlights {
  items: IMarketRecapHighlightItem[]
  narrative: {
    title: string
    content: string[]
    relatedNews?: IMarketRecapRelatedNews[]
  }
}

export interface IMarketRecapCheckpointItem {
  checkpointItemId: number
  title: string
  content: string[]
}

export interface IMarketRecapCheckpoints {
  items: IMarketRecapCheckpointItem[]
  narrative: {
    title: string
    content: string[]
  }
}

export interface IMarketRecapItem {
  sentiments: IMarketRecapSentiments
  highlights: IMarketRecapHighlights
  checkpoints: IMarketRecapCheckpoints
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
    const params: Record<string, string> = {
      criteriaDate: dayjs().format('YYYYMMDD'),
      category: categoryCode,
      sort: filters.sort || 'NEWEST',
    }

    if (filters.sentiments && filters.sentiments.length > 0) {
      params.sentiments = filters.sentiments.map((sentiment) => sentiment.toLowerCase()).join(',')
    }

    if (filters.impactScores && filters.impactScores.length > 0) {
      params.impactScores = filters.impactScores.map((score) => score.toUpperCase()).join(',')
    }

    if (filters.regions && filters.regions.length > 0) {
      params.regions = filters.regions.join(',')
    }

    const response: AxiosResponse<ICommonResponse<INewsFeedItem[]>> = await api.get('mi/market-news/feed', {
      params,
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
  async getMarketRecap(): Promise<IMarketRecapItem> {
    // TODO: API 연동 후 실제 API 호출로 변경
    // 임시 가짜 데이터 반환
    return {
      sentiments: {
        current: {
          period: 'Last 24H',
          upwardCount: 45,
          neutralCount: 30,
          downwardCount: 25,
        },
        week: {
          period: 'Last 7D',
          upwardCount: 320,
          neutralCount: 210,
          downwardCount: 180,
        },
        month: {
          period: 'Last 30D',
          upwardCount: 1250,
          neutralCount: 890,
          downwardCount: 760,
        },
      },
      highlights: {
        items: [
          {
            highlightItemId: 1,
            title: 'Oil prices surge on supply concerns',
            content: [
              'Crude oil futures jumped 3.2% following OPEC+ production cut announcements',
              'Geopolitical tensions in the Middle East continue to impact global supply chains',
              'Refinery margins expanded as demand outlook improved',
            ],
            momentum: DirectionType.Upward,
            relatedNews: [
              {
                provider: 'Reuters',
                newsSummaryId: 1001,
                title: 'Crude oil futures jumped 3.2% following OPEC+ production cut announcements',
              },
              {
                provider: 'Bloomberg',
                newsSummaryId: 1002,
                title: 'Geopolitical tensions in the Middle East continue to impact global supply chains',
              },
            ],
          },
          {
            highlightItemId: 2,
            title: 'Natural gas inventories decline',
            content: ['Storage levels dropped below seasonal averages', 'Cold weather forecasts drive demand expectations higher'],
            momentum: DirectionType.Upward,
            relatedNews: [{ provider: 'Energy Information', newsSummaryId: 1003, title: 'Storage levels dropped below seasonal averages' }],
          },
          {
            highlightItemId: 3,
            title: 'Renewable energy investments slow',
            content: ['Policy uncertainty affects project financing', 'Supply chain disruptions impact solar panel installations'],
            momentum: DirectionType.Downward,
            relatedNews: [{ provider: 'Financial Times', newsSummaryId: 1004, title: 'Policy uncertainty affects project financing' }],
          },
        ],
        narrative: {
          title: 'Market Overview: Energy Sector Shows Mixed Signals',
          content: [
            'The energy market experienced significant volatility this week, with oil prices reaching new highs while renewable energy investments showed signs of slowing.',
            'Supply-side constraints continue to drive commodity prices, with OPEC+ production decisions and geopolitical factors playing key roles.',
            'Investors are closely monitoring inventory levels and demand patterns as the market navigates through uncertain economic conditions.',
          ],
          relatedNews: [
            { provider: 'Market Watch', newsSummaryId: 1005, title: 'The energy market experienced significant volatility this week' },
            { provider: 'Energy Weekly', newsSummaryId: 1006, title: 'Supply-side constraints continue to drive commodity prices' },
          ],
        },
      },
      checkpoints: {
        items: [
          {
            checkpointItemId: 1,
            title: 'Monitor OPEC+ production decisions',
            content: ['Next meeting scheduled for early next month', 'Production quotas will impact global supply balance'],
          },
          {
            checkpointItemId: 2,
            title: 'Track inventory levels',
            content: ['Weekly EIA reports show declining stocks', 'Seasonal demand patterns emerging'],
          },
          {
            checkpointItemId: 3,
            title: 'Watch geopolitical developments',
            content: ['Middle East tensions affecting supply routes', 'Trade policy changes under review'],
          },
        ],
        narrative: {
          title: 'Key Monitoring Points for Energy Markets',
          content: [
            'Several critical factors require ongoing attention in the coming weeks, including production decisions from major oil-producing nations and inventory trends across key markets.',
            'Geopolitical developments continue to introduce volatility, making it essential to stay informed about regional tensions and policy changes.',
            'Market participants should also monitor demand indicators and economic data that could signal shifts in consumption patterns.',
          ],
        },
      },
    }
  },
}

export default dashboardService
