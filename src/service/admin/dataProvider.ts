import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

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

const dataProviderService = {
  /**
   * 데이타 프로바이더명 목록을 조회합니다.
   */
  async getProviders(): Promise<IProviderInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderInfo>> = await api.get('/admin/provider-manangement/provider/name')

    return response.data.data
  },
  /**
   * 상품 목록을 조회합니다.
   * @param providerNo 프로바이더 번호
   */
  async getProviderGoods(providerNo: number): Promise<IProviderGoodsInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsInfo>> = await api.get(
      `/admin/provider-manangement/providers/${providerNo}/goods/name`,
    )

    return response.data.data
  },
}

export default dataProviderService
