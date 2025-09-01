import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationResponse } from '@/types/api'
export interface IFocusedInfo {
  modifyDt: string
  providerNm: string
  providerNo: number
  goodsDataNo: number
  goodsDataCategoryCd: string
  goodsNo: number
  goodsDataNm: string
  goodsNm: string
  viewable: boolean
}
export interface IAdvancedFilterItem {
  codeNm: string
  codeId: string
  codeExpn: string
}
export interface IAdvancedFilter {
  documentTypes: IAdvancedFilterItem[]
  providers: IAdvancedFilterItem[]
  languages: IAdvancedFilterItem[]
}
export interface IInsightsRequest {
  keyword?: string
  sort?: string
  period?: string
  docFilters?: string
  provFilters?: string
  langFilters?: string
}
export interface IInsightsInfo {
  providerNo: number
  providerNm: string
  goodsNo: number
  goodsNm: string
  goodsDataNo: number
  goodsDataNm: string
  goodsDataExpn: string
  goodsDataSummaryCntt: string
  modifyDt: string
  goodsDataCategory: string
  isViewable: boolean
}
const insightsService = {
  /**
   * Focused 목록을 조회합니다.
   * @param companyNo - {companyNo: 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호}
   */
  async getFocusedList(companyNo: number): Promise<ICommonResponse<IFocusedInfo[]>> {
    const response = await api.get(`/mi/insights/companies/${companyNo}/focused-data`)

    return response.data
  },
  /**
   * Insights 검색에서 사용할 고급필터 데이타를 조회합니다.
   */
  async getAdvancedFilterData(companyNo: number): Promise<ICommonResponse<IAdvancedFilter>> {
    const response: AxiosResponse<ICommonResponse<IAdvancedFilter>> = await api.get(`/mi/insights/companies/${companyNo}/advanced-filter`)

    return response.data
  },
  /**
   * Insights 목록을 조회합니다.
   * @param companyNo - {companyNo: 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호}
   * @param params
   * @param signal
   */
  async getInsightsData(
    companyNo: number,
    params: Partial<IInsightsRequest>,
    signal?: AbortSignal,
  ): Promise<IPaginationResponse<IInsightsInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IInsightsInfo>>> = await api.get(
      `/mi/insights/companies/${companyNo}/insights-data`,
      {
        params,
        timeout: 120_000,
        signal,
      },
    )

    return response.data.data
  },
}

export default insightsService
