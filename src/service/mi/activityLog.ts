import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export type ActivityPriority = 'High' | 'Medium' | 'Low'
export type ActivityType = '고객사' | '경쟁사' | '법규' | '기술' | '기타'

export interface IActivityLogRequest {
  keyword?: string
  types?: string
  page?: number
  size?: number
}

export interface IActivityLogItem {
  id: number
  date: string
  type: ActivityType
  account: string
  description: string
  priority: ActivityPriority
  source: string
  assignee: string
  team: string
}

export interface ICreateActivityLogRequest {
  date: string
  type: ActivityType
  account: string
  description: string
  priority: ActivityPriority
  source: string
  assignee?: string
  team: string
}

/**
 * Activity Log 서비스
 * 추후 실제 백엔드 API가 준비되면 baseURL과 경로만 교체하면 되도록 구성했습니다.
 */
const activityLogService = {
  /**
   * Activity Log 목록을 조회합니다.
   * @param companyNo - 고객사 번호 (관리자: 선택된 고객사 번호, 사용자: 본인 고객사 번호)
   * @param params - { keyword: 검색어, types: 다중 타입 필터, page, size }
   * @param signal - AbortSignal
   */
  async getActivityLogs(
    companyNo: number,
    params: Partial<IActivityLogRequest>,
    signal?: AbortSignal,
  ): Promise<IPaginationResponse<IActivityLogItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IActivityLogItem>>> = await api.get(
      `/mi/activity-log/companies/${companyNo}/logs`,
      {
        params,
        signal,
      },
    )

    return response.data.data
  },

  /**
   * Activity Log를 생성합니다.
   * @param companyNo - 고객사 번호
   * @param payload - 생성할 Activity Log 데이터
   */
  async createActivityLog(companyNo: number, payload: ICreateActivityLogRequest): Promise<IActivityLogItem> {
    const response: AxiosResponse<ICommonResponse<IActivityLogItem>> = await api.post(
      `/mi/activity-log/companies/${companyNo}/logs`,
      payload,
    )

    return response.data.data
  },
}

export default activityLogService
