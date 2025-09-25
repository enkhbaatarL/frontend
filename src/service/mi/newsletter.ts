import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export enum NewsletterDetailPageMode {
  VIEW = 'view',
  EDIT = 'edit',
  CAPTURE = 'capture',
}

export enum NewsletterStatus {
  PUBLISHED = 'PUBLISHED',
  BLANK = 'BLANK',
}

export enum NewsletterFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  ON_DEMAND = 'ON_DEMAND',
}

export interface INewsletterItem {
  newsletterId: string
  date: string
  issueNo: string
  name: string
  title: string
  status: NewsletterStatus
}

export interface INewsletterListRequest extends IPaginationRequest {
  keyword?: string
}

export interface IFeaturedNewsletterItem {
  newsletterId: string
  frequency: NewsletterFrequency
  name: string
  description: string
  subscribed: boolean
  issueNo: string
  imageBase64: string
  enabled: boolean
}

export interface INewsletterIssue {
  date: string
  no: string
}

export interface INewsletterIssueResponse {
  newsletterId: string
  issuedList: INewsletterIssue[]
}

export interface ISeriesData {
  seriesId: string
  label: string
  renderAs: string
  values: number[]
  isVisible: boolean
  isLineChartDashStyle: string | null
  color?: string
  dtick?: number
  range?: number[]
}

export interface IChartData {
  timestamps: number[]
  series: ISeriesData[]
}

export interface INewsFlowChartData {
  title: string
  aggregationTime: string
  chartData: IChartData
}

export interface IRelatedNewsEventItem {
  newsId: string
  title: string
  content: string[]
  timestamp?: number
  createdDate: string
  createTime: string
  source: string
  showInChart: boolean
  trend?: 'UP' | 'DOWN' | 'NONE' | ''
}

export interface IReferenceDataItem {
  title: string
  description: string
  type: 'CHART' | 'TABLE' | 'TEXT'
  chartData: IChartData
  tableData: {
    tableId: string
    headers: {
      field: string
      name: string
    }[]
    rows: {
      cells: string[]
    }[]
  }
}

export interface INewsletterIssueDetail {
  newsletterId: string
  frequency: NewsletterFrequency
  name: string
  description: string
  subscribed: boolean
  imageBase64: string
  enabled: boolean
  issueDetail: {
    emailSubject: string
    title: string
    date: string
    marketOpenTime: number
    marketCloseTime: number
    summary: string
    newsFlowChart: INewsFlowChartData
    relatedNews: {
      aggregationTime: string
      newsEventItems: IRelatedNewsEventItem[]
    }
    references: IReferenceDataItem[]
  }
}

/**
 * 뉴스레터 서비스
 */
const newsletterService = {
  /**
   * 뉴스레터 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, keyword: 검색어 }
   */
  async getNewsletterList(params: Partial<INewsletterListRequest>): Promise<IPaginationResponse<INewsletterItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INewsletterItem>>> = await api.get('mi/newsletter', {
      params,
    })

    return response.data.data
  },

  /**
   * 뉴스레터 featured(추천) 목록을 조회합니다.
   * 각 뉴스레터별로 가장 최근 발행된 호를 반환합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수 }
   */
  async getFeaturedNewsletters(params?: Partial<IPaginationRequest>): Promise<IPaginationResponse<IFeaturedNewsletterItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IFeaturedNewsletterItem>>> = await api.get(
      '/mi/newsletter/featured',
      {
        params,
      },
    )
    return response.data.data
  },

  /**
   * 특정 뉴스레터의 발행 리스트를 조회합니다.
   * @param {string} newsletterId - 뉴스레터 ID
   * @returns {Promise<{ date: string; no: string }[]>} 발행 리스트
   */
  async getNewsletterIssues(newsletterId: string): Promise<INewsletterIssueResponse> {
    const response: AxiosResponse<ICommonResponse<INewsletterIssueResponse>> = await api.get(`/mi/newsletter/${newsletterId}/issues`)
    return response.data.data
  },

  /**
   * 특정 뉴스레터의 특정 발행호 상세 정보를 조회합니다.
   * @param {string} newsletterId - 뉴스레터 ID
   * @param {string} issueNo - 발행호 번호
   * @returns {Promise<INewsletterIssueDetail>} 뉴스레터 발행호 상세 정보
   */
  async getNewsletterIssueDetail(newsletterId: string, issueNo: string): Promise<INewsletterIssueDetail> {
    const response: AxiosResponse<ICommonResponse<INewsletterIssueDetail>> = await api.get(`mi/newsletter/${newsletterId}/${issueNo}`)

    return response.data.data
  },

  /**
   * [임시] 뉴스레터 구독 상태를 변경합니다.
   * @param {string} _newsletterId - 뉴스레터 ID
   * @param {boolean} subscribed - 구독 상태
   */
  async updateNewsletterSubscribed(_newsletterId: string, subscribed: boolean): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 1000)) /// TODO: 실제 API
    return subscribed
  },
}

export default newsletterService
