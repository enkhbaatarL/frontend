import { AxiosResponse } from 'axios'

import { IAuditInfo } from './members'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export interface IProviderInfo {
  providerNo: number
  providerNm: string
  isUsed: boolean
}
export interface IProviderGoodsInfo {
  goodsNo: number
  goodsNm: string
  goodsId: string
}
export interface IProviderGoodsDetailInfo {
  goodsNo: number
  goodsNm: string
  goodsId: string
  goodsExpn: string
  isUsed: boolean
  isPublic: boolean
  auditInfo: IAuditInfo
}
export interface IProviderGoodsLatestUpdatedInfo {
  modifyDt: string
  modifyUserName: string
}
export interface IProviderGoodsDataRequest extends IPaginationRequest {
  keyword?: string
}
export interface IProviderGoodsDataInfo {
  customerCompanyNm: string
  goodsDataNo: number
  goodsDataNm: string
  goodsDataExpn: string
}
export interface IProviderGoodsUpdateRequest {
  goodsNm: string
  goodsId: string
  goodsExpn: string
  isUsed: boolean
  isPublic: boolean
}

const dataProviderService = {
  /**
   * 데이타 프로바이더명 목록을 조회합니다.
   */
  async getProviders(): Promise<IProviderInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderInfo>> = await api.get('/admin/provider-management/provider/name')

    return response.data.data
  },
  /**
   * 상품 목록을 조회합니다. without pagination
   * @param providerNo 프로바이더 번호
   */
  async getProviderGoods(providerNo: number): Promise<IProviderGoodsInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsInfo>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods/name`,
    )

    return response.data.data
  },
  /**
   * 상품 목록을 조회합니다. with pagination
   * @param providerNo 프로바이더 번호
   */
  async getProviderGoodsList(providerNo: number): Promise<IProviderGoodsInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsInfo>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods`,
    )

    return response.data.data
  },
  /**
   * 상품 상세를 조회합니다.
   * @param providerNo 프로바이더 번호
   * @param goodsNo 상품 번호
   */
  async getProviderGoodsDetail(providerNo: number, goodsNo: number): Promise<IProviderGoodsDetailInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsDetailInfo>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods/${goodsNo}`,
    )

    return response.data.data
  },
  /**
   * 상품의 최신 수정일과 수정자를 반납합니다.
   * @param providerNo 프로바이더 번호
   * @param goodsNo 상품 번호
   */
  async getProviderGoodsLatestUpdated(providerNo: number, goodsNo: number): Promise<IProviderGoodsLatestUpdatedInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsLatestUpdatedInfo>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods/${goodsNo}/latest-updated`,
    )

    return response.data.data
  },
  /**
   * 데이터 목록을 조회합니다.
   * @param providerNo 프로바이더 번호
   * @param goodsNo 상품 번호
   * @param params - { keyword: 데이타명 또는 데이타설명 검색 }
   */
  async getProviderGoodsDataList(
    providerNo: number,
    goodsNo: number,
    params: IProviderGoodsDataRequest,
  ): Promise<IPaginationResponse<IProviderGoodsDataInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IProviderGoodsDataInfo>>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods/${goodsNo}/goods-data`,
      { params },
    )

    return response.data.data
  },
  /**
   * 상품을 수정합니다.
   * @param providerNo 프로바이더 번호
   * @param goodsNo 상품 번호
   * @param body - { goodsNm: 상품 이름, goodsId: 상품ID, goodsExpn: 상품 설명, isUsed: 상품 사용유무, isPublic: 회사공통사용가능여부 }
   */
  async updateProviderGoods(providerNo: number, goodsNo: number, body: IProviderGoodsUpdateRequest): Promise<IProviderGoodsInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsInfo>> = await api.patch(
      `/admin/provider-management/providers/${providerNo}/goods/${goodsNo}`,
      body,
    )

    return response.data.data
  },
}

export default dataProviderService
