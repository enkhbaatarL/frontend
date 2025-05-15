import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'
export interface IFocusedRequest {
  customerCompanyNo: number
}
export interface IFocusedInfo {
  modifyDt: string
  providerNm: string
  providerNo: number
  goodsDataNo: number
  goodsDataCategoryCd: string
  goodsNo: number
  goodsDataNm: string
  goodsNm: string
}
export interface IAdvancedFilterItem {
  codeNm: string
  codeId: string
}
export interface IAdvancedFilter {
  documentTypes: IAdvancedFilterItem[]
  providers: IAdvancedFilterItem[]
  languages: IAdvancedFilterItem[]
}

const insightsService = {
  /**
   * Focused 목록을 조회합니다.
   * @param parmas - {customerCompanyNo: 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호}
   */
  async getFocusedList(params: IFocusedRequest): Promise<ICommonResponse<IFocusedInfo>> {
    const response: AxiosResponse<ICommonResponse<IFocusedInfo>> = await api.get('mi/insights/focused-data', {
      params,
    })

    return response.data
  },
  /**
   * Insights 검색에서 사용할 고급필터 데이타를 조회합니다.
   */
  async getAdvancedFilterData(): Promise<ICommonResponse<IAdvancedFilter>> {
    const response: AxiosResponse<ICommonResponse<IAdvancedFilter>> = await api.get('mi/insights/advanced-filter')

    return response.data
  },
}

export default insightsService
