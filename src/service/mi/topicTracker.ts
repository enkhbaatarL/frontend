import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export interface ITopicTrackerWidgetRequest {
  criteriaDate: string
  newsTopicId?: number
}

export interface ITopicTrackerTopicItem {
  newsTopicId?: number
  iconImagePath: string
  newsTopicName: string
  userRegisteredYn: string
}

export interface ITopicTrackerWidgetItem {
  newsTopicRelationshipId: number
  crtrDt: string
  newsTopicId: number
  newsTopicName: string
  newsSummaryId: number
  dataRegistrationSn: number
  firstCreated: string
  briefSummary: string
  summary: string[]
  title: string
  provider: string
  regions: string[]
  isViewable?: boolean
}

export interface ITopicTrackerItem {
  newsTopicRelationshipId: number
  newsSummaryId: number
  criteriaDate: string
  publishDate: string
  publishTime: string
  topicName: string
  topicId: number
  providerName: string
  regions: string[]
  briefSummary: string | null
  summary: string[]
  title: string
  briefSummaryEn: string | null
}

export type TopicTrackerSort = 'NEWEST' | 'OLDEST'
export type TopicTrackerDateRangeOption = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_60_DAYS' | 'LAST_12_MONTHS' | 'ALL_TIME'

export interface ITopicTrackerItemListRequest extends IPaginationRequest {
  sort?: TopicTrackerSort
  keyword?: string
  dateRangeOption?: TopicTrackerDateRangeOption
  topics?: string[]
  regions?: string[]
}

const topicTrackerService = {
  async getTopics(): Promise<ITopicTrackerTopicItem[]> {
    const response: AxiosResponse<ICommonResponse<ITopicTrackerTopicItem[]>> = await api.get('mi/topic-tracker/topics')
    return response.data.data
  },
  async getWidgetData(params: Partial<ITopicTrackerWidgetRequest>): Promise<ITopicTrackerWidgetItem[]> {
    const response: AxiosResponse<ICommonResponse<ITopicTrackerWidgetItem[]>> = await api.get('mi/topic-tracker/widget', {
      params,
    })

    return response.data.data
  },
  async getItemList(params: Partial<ITopicTrackerItemListRequest>): Promise<IPaginationResponse<ITopicTrackerItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<ITopicTrackerItem>>> = await api.get('mi/topic-tracker', {
      params: {
        ...params,
        topics: params.topics?.join(','),
        regions: params.regions?.join(','),
      },
    })
    return response.data.data
  },
}

export default topicTrackerService
