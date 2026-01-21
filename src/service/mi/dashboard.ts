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
  OutOfRange = 'OUTOFRANGE',
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
  isViewable?: boolean
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
    isViewable?: boolean
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
  isViewable: boolean
}

export interface IMarketRecapHighlightItem {
  highlightEventId: number
  nameKorean: string
  nameEnglish: string
  content: string[]
  momentum?: DirectionType
  relatedEventRepresentativeNewsResNews?: IMarketRecapRelatedNews[]
}

export interface IMarketRecapHighlights {
  items: IMarketRecapHighlightItem[]
  narrative: {
    title: string
    content: string[]
  }
  relatedEventRepresentativeNewsResNews?: IMarketRecapRelatedNews[]
}

export interface IMarketRecapCheckpointItem {
  checkpointId: number
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
  analysisFrequency?: string
  analysisPeriod?: string[]
}

// Key Economic Indicators 관련 타입들
export interface IKeyEconomicIndicatorItem {
  economicCalendarId: number
  code: string
  date: string
  economicIndicatorName: string
  economicIndicatorPresentationDay: string
  economicIndicatorPresentationTime: string
  economicIndicatorRealValue: number | null
  economicIndicatorPredictionDay: string | null
  economicIndicatorPresentationPriorValue: number | null
  economicIndicatorPredictionValue: number | null
  unitPrefix: string | null
  unit: string
  refinitivPriority: number
  refinitivType: string
  status: string
}

export interface IKeyEconomicIndicatorsResponse {
  economicIndicatorAnalysisId: number
  categoryCode: string
  criteriaDate: string
  content: string[]
  relatedEconomicIndicators: IKeyEconomicIndicatorItem[]
}

export interface IEconomicCalendarWidgetResponse {
  updateTime: string
  economicCalendarWidgetList: IKeyEconomicIndicatorItem[]
}

export interface IEconomicCalendarWidgetFilter {
  categories: string[]
  importance: string[]
}

// API 응답 타입
interface IMarketRecapApiHighlightItem {
  highlightEventId: number
  nameKorean: string
  nameEnglish: string
  momentum: DirectionType
  relatedEventRepresentativeNewsResNews: IMarketRecapRelatedNews[]
}

interface IMarketRecapApiHighlights {
  narrative: {
    title: string
    content: string[]
  }
  items: IMarketRecapApiHighlightItem[]
  relatedEventRepresentativeNewsResNews: IMarketRecapRelatedNews[]
}

interface IMarketRecapApiCheckpointItem {
  checkpointId: number
  title: string
  content: string[]
}

interface IMarketRecapApiCheckpoints {
  narrative: {
    title: string
    content: string[]
  }
  items: IMarketRecapApiCheckpointItem[]
}

interface IMarketRecapApiResponse {
  marketRecapId: number
  criteriaDate: string
  categoryCode: string
  sentiments: {
    current: IMarketRecapSentimentItem
    previous: IMarketRecapSentimentItem
    last7days: IMarketRecapSentimentItem
    last30days: IMarketRecapSentimentItem
  }
  highlights: IMarketRecapApiHighlights
  checkpoints: IMarketRecapApiCheckpoints
  analysisFrequency?: string
  analysisPeriod?: string[]
}

export interface ICriteriaDateInfo {
  criteriaDate: string
  nextUpdate: string
}

const dashboardService = {
  async getTimeline(category: string, criteriaDate: string): Promise<INewsFeedItem[]> {
    const response: AxiosResponse<ICommonResponse<INewsFeedItem[]>> = await api.get('mi/market-news/timeline', {
      params: {
        category,
        criteriaDate,
      },
    })

    return response.data.data
  },
  async getNewsFeed(category: string, filters: INewsFeedFilter, criteriaDate: string): Promise<INewsFeedItem[]> {
    const params: Record<string, string> = {
      category,
      criteriaDate,
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
  async getMarketRecap(category: string, criteriaDate: string): Promise<IMarketRecapItem> {
    const response: AxiosResponse<ICommonResponse<IMarketRecapApiResponse>> = await api.get('mi/market-news/recap', {
      params: {
        category,
        criteriaDate,
      },
    })

    const apiData = response.data.data

    // API 응답을 내부 인터페이스로 매핑
    return {
      sentiments: {
        current: apiData.sentiments.current,
        previous: apiData.sentiments.previous,
        last7days: apiData.sentiments.last7days,
        last30days: apiData.sentiments.last30days,
      },
      highlights: {
        items: apiData.highlights.items.map((item) => ({
          highlightEventId: item.highlightEventId,
          nameKorean: item.nameKorean,
          nameEnglish: item.nameEnglish,
          content: [],
          momentum: item.momentum,
          relatedEventRepresentativeNewsResNews: item.relatedEventRepresentativeNewsResNews,
        })),
        narrative: {
          title: apiData.highlights.narrative.title,
          content: apiData.highlights.narrative.content,
        },
        relatedEventRepresentativeNewsResNews: apiData.highlights.relatedEventRepresentativeNewsResNews,
      },
      checkpoints: {
        items: apiData.checkpoints.items.map((item) => ({
          checkpointId: item.checkpointId,
          title: item.title,
          content: item.content,
        })),
        narrative: {
          title: apiData.checkpoints.narrative.title,
          content: apiData.checkpoints.narrative.content,
        },
      },
      ...(apiData.analysisFrequency && { analysisFrequency: apiData.analysisFrequency }),
      ...(apiData.analysisPeriod && { analysisPeriod: apiData.analysisPeriod }),
    }
  },
  async getKeyEconomicIndicators(category: string, criteriaDate: string): Promise<IKeyEconomicIndicatorsResponse> {
    const response: AxiosResponse<ICommonResponse<IKeyEconomicIndicatorsResponse>> = await api.get('mi/econ-cal/key', {
      params: {
        category,
        criteriaDate,
      },
    })

    return response.data.data
  },
  async getEconomicCalendarWidget(criteriaDate: string, filters?: IEconomicCalendarWidgetFilter): Promise<IEconomicCalendarWidgetResponse> {
    const params: Record<string, string> = {
      criteriaDate,
    }

    if (filters?.categories && filters?.categories.length > 0) {
      params.categories = filters.categories.join(',')
    }

    if (filters?.importance && filters?.importance.length > 0) {
      params.importance = filters.importance.join(',')
    }

    const response: AxiosResponse<ICommonResponse<IEconomicCalendarWidgetResponse>> = await api.get('mi/econ-cal/widget', {
      params,
    })

    return response.data.data
  },
  /**
   * 서버 로컬 시간 기준으로 시장 뉴스 기준일자를 계산하여 반환합니다.
   * 로컬스토리지에 devCriteriaDate 값이 있으면 우선 반환합니다. (20251210)
   * @returns 기준일자 정보
   */
  async getCriteriaDate(): Promise<ICriteriaDateInfo> {
    const devCriteriaDate = localStorage.getItem('devCriteriaDate')
    if (devCriteriaDate) {
      return {
        criteriaDate: devCriteriaDate,
        nextUpdate: '',
      }
    }

    const response: AxiosResponse<ICommonResponse<ICriteriaDateInfo>> = await api.get('mi/market-news/criteria-date')
    return response.data.data
  },
}

export default dashboardService
