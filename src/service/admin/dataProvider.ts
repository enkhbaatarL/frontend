import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

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
export interface IProviderListInfo {
  providerNo: number
  providerNm: string
  providerId: string
  isUsed: boolean
  goodsCount: number
  createDt: string
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
   * 상품 목록을 조회합니다.
   * @param providerNo 프로바이더 번호
   */
  async getProviderGoods(providerNo: number): Promise<IProviderGoodsInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsInfo>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods/name`,
    )

    return response.data.data
  },
  /**
   * 데이타 프로바이더 목록을 조회합니다.
   */
  async getProviderList(): Promise<IPaginationResponse<IProviderListInfo>> {
    const response: AxiosResponse<IPaginationResponse<IProviderListInfo>> = await api.get('/admin/provider-management/provider')

    return response.data
  },
}

export default dataProviderService
