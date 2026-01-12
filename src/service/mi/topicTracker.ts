import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

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
}

export default topicTrackerService
