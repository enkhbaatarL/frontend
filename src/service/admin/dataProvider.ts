import { AxiosResponse } from 'axios'

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
export interface IProviderListInfo {
  providerNo: number
  providerNm: string
  providerId: string
  isUsed: boolean
  goodsCount: number
  createDt: string
}
export interface IProviderRegisterRequest {
  providerNm: string
  providerId: string
  providerExpn: string
  isUsed: boolean
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
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수 }
   */
  async getProviderList(params: Partial<IPaginationRequest>): Promise<IPaginationResponse<IProviderListInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IProviderListInfo>>> = await api.get(
      '/admin/provider-management/provider',
      { params },
    )

    return response.data.data
  },
  /**
   * 데이타 프로바이더를 등록합니다.
   * @param body - { providerNm: 데이터 프로바이더명, providerId: 데이터 프로바이더 고유코드, providerExpn: 데이터프로바이더 설명, isUsed: 사용상태 }
   */
  async registerProvider(body: IProviderRegisterRequest): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.post('/admin/provider-management/provider', body)

    return response.data
  },
}

export default dataProviderService
