import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export interface INotificationSettingListRequest extends IPaginationRequest {
  search: string
}

export interface INotificationSettingDetailInfo {
  userGoodsNotificationSettingNo: number
  userNo: number
  goodsNo: number
  goodsDataNo: number
  goodsDataSourceNo: number
  goodsDataSourceNm: string
  notificationCriticalValueSeparateCd: string
  criticalValueSettingVol: number
  criticalValueSettingUnitNm: string
  notificationType: string
}

export interface IRegisterNotificationSettingRequest {
  notificationCriticalValueSeparateCd: string
  criticalValueSettingVol: number
  notificationType: string
}

export interface INotificationRequest extends IPaginationRequest {
  search: string
}

export interface INotificationInfo {
  goodsDataNo: number
  goodsDataNm: string
  goodsDataSourceNo: number
  goodsDataSourceNm: string
  settingNotificationCount: number
}

export interface INotificationHistory {
  emailSendSn: number
  emailTitleNm: string
  emailCntt: string
  emailSendDtm: string
  isEmailInquiry: boolean
  notificationCriticalValueSeparateCd: string
  criticalValueSettingVol: number
  criticalValueSettingUnitNm: string
  goodsDataSourceNm: string
  goodsDataSourceNo: number
  goodsDataNo: number
  goodsNo: number
}

export type BellNotificationType = 'GOODS_THRESHOLD' | 'EVENT_KEYWORD'

export interface IEventKeywordNotification {
  keywordSettingId: number
  keywordName: string
  eventId: number
  eventName: string
}

export interface IBellNotification {
  notificationType: BellNotificationType
  notificationId: number
  notifiedAt: string
  isRead: boolean
  goodsThreshold: INotificationHistory | null
  eventKeyword: IEventKeywordNotification | null
}

export interface IBellNotificationUnreadCount {
  unreadCount: number
}

export interface IMyNotificationGoodsThreshold {
  goodsNo: number
  goodsDataNo: number
  goodsDataNm: string
  goodsDataSourceNo: number
  goodsDataSourceNm: string
  settingNotificationCount: number
  notificationType: string
}

export interface IMyNotification {
  notificationType: BellNotificationType
  goodsThreshold: IMyNotificationGoodsThreshold | null
  eventKeyword: IEventKeywordNotification | null
}

export interface INotificationSetting {
  isUserNotificationSetting: boolean
}

const notificationService = {
  /**
   * 정형 데이터 알림 설정 리스트를 조회합니다.
   * @param goodsDataSourceNo
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수 }
   */
  async getGoodsDataNotificationSettingList(
    goodsDataSourceNo: number | string,
    params: Partial<IPaginationRequest>,
  ): Promise<IPaginationResponse<INotificationSettingDetailInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INotificationSettingDetailInfo>>> = await api.get(
      `mi/notification-management/goodsdata/${goodsDataSourceNo}/notification-settings`,
      {
        params,
      },
    )

    return response.data.data
  },
  /**
   * 상품 데이터의 알림 설정을 상세조회합니다.
   * @param goodsDataSourceNo
   * @param notificationSettingNo
   */
  async getGoodsDataNotificationSettingDetail(
    goodsDataSourceNo: number | string,
    notificationSettingNo: number | string,
  ): Promise<INotificationSettingDetailInfo> {
    if (!goodsDataSourceNo) throw new Error('goodsDataSourceNo is required')
    if (!goodsDataSourceNo) throw new Error('goodsDataSourceNo is required')

    const response: AxiosResponse<ICommonResponse<INotificationSettingDetailInfo>> = await api.get(
      `mi/notification-management/goodsdata/${goodsDataSourceNo}/notification-settings/${notificationSettingNo}`,
    )

    return response.data.data
  },
  /**
   * 알림을 설정합니다.
   * @param goodsDataSourceNo
   * @param body - { notificationCriticalValueSeparateCd, criticalValueSettingVol }
   */
  async registerNotificationSetting(
    goodsDataSourceNo: number,
    body: IRegisterNotificationSettingRequest,
  ): Promise<ICommonResponse<INotificationSettingDetailInfo>> {
    const response: AxiosResponse<ICommonResponse<INotificationSettingDetailInfo>> = await api.post(
      `mi/notification-management/goodsdata/${goodsDataSourceNo}/notification-setting`,
      body,
    )

    return response.data
  },
  /**
   * 알림을 삭제합니다.
   * @param goodsDataSourceNo
   * @param notificationSettingNo
   */
  async deleteNotificationSetting(
    goodsDataSourceNo: number | string,
    notificationSettingNo: number | string,
  ): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.delete(
      `mi/notification-management/goodsdata/${goodsDataSourceNo}/notification-settings/${notificationSettingNo}`,
    )
    return response.data
  },
  /**
   * 알림 설정한 정형 데이터 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, search }
   */
  async getNotificationSettingDataList(params: Partial<INotificationRequest>): Promise<IPaginationResponse<INotificationInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INotificationInfo>>> = await api.get(
      'mi/notification-management/notification-settings',
      {
        params,
      },
    )

    return response.data.data
  },
  /**
   * 알림 발송 내역 리스트를 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, search }
   */
  async getNotificationHistory(params: Partial<IPaginationRequest>): Promise<IPaginationResponse<INotificationHistory>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INotificationHistory>>> = await api.get(
      'mi/notification-management/notifications',
      {
        params,
      },
    )

    return response.data.data
  },
  /**
   * 전체 알림 설정을 변경합니다.
   * @param isUserNotificationSetting
   */
  async updateNotificationSetting(isUserNotificationSetting: boolean): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.patch('mi/notification-management/notification-setting', {
      isUserNotificationSetting,
    })
    return response.data
  },

  /**
   * 전체 알림 설정을 조회합니다.
   */
  async getNotificationSetting(): Promise<INotificationSetting> {
    const response: AxiosResponse<ICommonResponse<INotificationSetting>> = await api.get('mi/notification-management/notification-setting')

    return response.data.data
  },
  /**
   * 알림 내역 읽음 처리를 합니다.
   * @param emailSendSn
   */
  async getNotificationInquiry(emailSendSn: number): Promise<INotificationHistory> {
    const response: AxiosResponse<ICommonResponse<INotificationHistory>> = await api.get(
      `mi/notification-management/notifications/${emailSendSn}/inquiry`,
    )

    return response.data.data
  },
  /**
   * 알림벨 목록을 조회합니다. 최근 7일, 발생 일시 최신순입니다.
   * 상품 임계치 알림은 모든 사용자, 이벤트 키워드 알림은 SKGAS 사용자에게 함께 조회됩니다.
   */
  async getBellNotifications(params: Partial<IPaginationRequest>): Promise<IPaginationResponse<IBellNotification>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IBellNotification>>> = await api.get(
      'mi/notification-management/bell-notifications',
      { params },
    )

    return response.data.data
  },
  /**
   * 알림벨의 최근 7일 미조회 알림 수를 조회합니다.
   */
  async getBellNotificationUnreadCount(): Promise<IBellNotificationUnreadCount> {
    const response: AxiosResponse<ICommonResponse<IBellNotificationUnreadCount>> = await api.get(
      'mi/notification-management/bell-notifications/unread-count',
    )

    return response.data.data
  },
  /**
   * 알림벨 항목을 읽음 처리하고 해당 항목을 반환합니다.
   * GOODS_THRESHOLD 의 notificationId 는 emailSendSn, EVENT_KEYWORD 는 키워드 알림 ID 입니다.
   */
  async readBellNotification(notificationType: BellNotificationType, notificationId: number): Promise<IBellNotification> {
    const response: AxiosResponse<ICommonResponse<IBellNotification>> = await api.patch(
      `mi/notification-management/bell-notifications/${notificationType}/${notificationId}/read`,
    )

    return response.data.data
  },
  /**
   * My Notifications 목록을 조회합니다.
   * 상품 임계치 설정과 이벤트 키워드 알림이 함께 내려오며, 키워드 알림은 SKGAS 사용자만 포함됩니다.
   */
  async getMyNotifications(params: Partial<INotificationRequest>): Promise<IPaginationResponse<IMyNotification>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IMyNotification>>> = await api.get(
      'mi/notification-management/my-notifications',
      { params },
    )

    return response.data.data
  },
}

export default notificationService
