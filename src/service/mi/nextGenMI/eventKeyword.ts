import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

/** GET /mi/next-gen/event-keywords 목록 항목 */
export interface EventKeywordSetting {
  keywordSettingId: number
  keywordName: string
  isNotificationUse: boolean
  createdAt: string
}

/** GET /mi/next-gen/event-keywords */
export interface EventKeywordSettingList {
  keywordCount: number
  maxKeywordCount: number
  keywords: EventKeywordSetting[]
}

const nextGenMIEventKeywordService = {
  async getKeywordSettings(): Promise<EventKeywordSettingList> {
    const response: AxiosResponse<ICommonResponse<EventKeywordSettingList>> = await api.get('mi/next-gen/event-keywords')

    return response.data.data
  },

  async createKeywordSetting(keywordName: string): Promise<EventKeywordSetting> {
    const response: AxiosResponse<ICommonResponse<EventKeywordSetting>> = await api.post('mi/next-gen/event-keywords', { keywordName }, {
      suppressGlobalErrorHandler: true,
    } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean })

    return response.data.data
  },

  async updateNotificationUse(keywordSettingId: number, isNotificationUse: boolean): Promise<EventKeywordSetting> {
    const response: AxiosResponse<ICommonResponse<EventKeywordSetting>> = await api.patch(
      `mi/next-gen/event-keywords/${keywordSettingId}/notification-use`,
      { isNotificationUse },
      { suppressGlobalErrorHandler: true } as Parameters<typeof api.patch>[2] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },

  async deleteKeywordSetting(keywordSettingId: number): Promise<EventKeywordSetting> {
    const response: AxiosResponse<ICommonResponse<EventKeywordSetting>> = await api.delete(
      `mi/next-gen/event-keywords/${keywordSettingId}`,
      { suppressGlobalErrorHandler: true } as Parameters<typeof api.delete>[1] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },
}

export default nextGenMIEventKeywordService
