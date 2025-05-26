import { AxiosResponse } from 'axios'

import api from '@/lib/axios.ts'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api.ts'

export interface INotificationSettingListRequest extends IPaginationRequest {
  search: string
}

export interface INotificationSettingDetailInfo {
  userGoodsNotificationSettingNo: number
  userNo: number
  goodsDataSourceNo: number
  goodsDataSourceNm: string
  notificationCriticalValueSeparateCd: string
  criticalValueSettingVol: number
  criticalValueSettingUnitNm: string
}

export interface IRegisterNotificationSettingRequest {
  notificationCriticalValueSeparateCd: string
  criticalValueSettingVol: number
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
}

export default notificationService
