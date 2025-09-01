import api from '@/lib/axios'
import { IPaginationRequest, IPaginationResponse } from '@/types/api'

export interface IAlarmRequest extends IPaginationRequest {
  isSendSuccess: boolean | ''
  startDate: string
  endDate: string
}

export interface IAlarmDetail {
  emailSendSn: number
  emailTitleNm: string
  emailCntt: string
  emailSendErrorCntt: string
  emailSendDtm: string
  isSendSuccess: boolean
  userNm: string
  positionNm: null
  departmentNm: string
  customerCompanyNm: string
}

export interface IAlarmPaginationResponse<T> extends IPaginationResponse<T> {
  extension: {
    totalEmailSendCnt: number
    totalEmailSuccessCnt: number
    totalEmailFailCnt: number
    lastUpdatedDt: string
  }
}

/**
 * 알림 서비스
 */
const alarmService = {
  /**
   * 알림 리스트를 조회합니다.
   */
  async getAlarmList(params: Partial<IAlarmRequest>) {
    const response = await api.get('admin/notification-management/notifications', { params })
    return response.data.data
  },
}

export default alarmService
