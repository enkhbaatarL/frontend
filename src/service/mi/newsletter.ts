import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export enum NewsletterStatus {
  PUBLISHING = 'PUBLISHING',
  CHECK = 'CHECK',
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
  image: string
  enabled: boolean
}

export interface INewsletterIssueDetail {
  newsletterId: string
  frequency: string
  name: string
  description: string
  subscribed: boolean
  issueNo: string
  image: string
  enabled: boolean
  issuedList: {
    date: string
    no: string
  }[]
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
   * 특정 뉴스레터의 특정 발행호 상세 정보를 조회합니다.
   * @param {string} newsletterId - 뉴스레터 ID
   * @param {string} issueNo - 발행호 번호
   * @returns {Promise<INewsletterIssueDetail>} 뉴스레터 발행호 상세 정보
   */
  async getNewsletterIssueDetail(newsletterId: string, issueNo: string): Promise<INewsletterIssueDetail> {
    const response: AxiosResponse<ICommonResponse<INewsletterIssueDetail>> = await api.get(`mi/newsletter/${newsletterId}/${issueNo}`)

    return response.data.data
  },
}

export default newsletterService
