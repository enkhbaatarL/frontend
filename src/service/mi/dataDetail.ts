import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { IAuditInfo } from '@/service/admin/members'
import { ICommonResponse } from '@/types/api'

export interface IProductDataInfo {
  goodsDataNm: string
  goodsDataExpn: string
  goodsDataSummaryCntt: string
  providerNm: string
  categoryDataInfo: string
  isViewable: boolean
  isDownloadable: boolean
  auditInfo: IAuditInfo
}

/**
 * 상품 데이터를 조회합니다.
 * isViewable: 상품에 대한 보기 권한 여부를 의미합니다.
 * isDownloadable: 상품에 대한 다운로드 권한 여부를 의미합니다.
 * 해당 API 호출 시, 상품데이터 조회 내역이 내부적으로 적재되어 관리됩니다.
 * @param goodsNo -상품 번호
 * @param goodsDataNo - 상품 데이터 번호
 */
const dataDetailService = {
  async getProductData(goodsNo: number, goodsDataNo: number): Promise<IProductDataInfo> {
    const response: AxiosResponse<ICommonResponse<IProductDataInfo>> = await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}`,
    )

    return response.data.data
  },
}

export default dataDetailService
