import { AxiosResponse } from 'axios'

import api from '@/lib/axios.ts'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api.ts'

export interface IRawDataPoint {
  date: string
  value: number
}

export interface IMainGraph {
  rawData: IRawDataPoint[]
}

export interface ICompareGraph {
  rawData: IRawDataPoint[]
}

export interface IMarketMetaData {
  chartMarkRank: number
  goodsNo: number
  goodsDataNo: number
  goodsDataSourceNo: number
  goodsDataNm: string
  goodsDataSourceNm: string
  currency: string
  currentUnitCd: string
  visibleChartType: string
  interval: string
  lastUpdateDt: string
  indexStartDt: string
  lastValue: number
  yoyChangeRate: number
  momChangeRate: number
  wowChangeRate: number
}

export interface IMarketData {
  mainChart: IMainGraph
  isPermitted: boolean
  marketMetaData: IMarketMetaData
  compareCharts: ICompareGraph[]
}

export interface IDataCatalogRequest extends IPaginationRequest {
  customerCompanyNo?: number
  keyword?: string
}

export interface IDataCatalogItem {
  providerNo: number
  providerNm: string
  goodsNo: number
  goodsNm: string
  goodsDataNo: number
  goodsDataNm: string
  goodsDataExpn: string
  modifyDt: string
}

/**
 * 시장 데이터 서비스
 */
const marketDataService = {
  /**
   * 마켓 데이터를 조회합니다.
   * @param customerCompanyNo - 고객사 번호
   */
  async getMarketDatas(customerCompanyNo?: number): Promise<IMarketData[]> {
    if (!customerCompanyNo) throw new Error('customerCompanyNo is required')

    const response: AxiosResponse<ICommonResponse<IMarketData[]>> = await api.get(
      `mi/market-data/companies/${customerCompanyNo}/market-datas`,
    )

    return response.data.data
  },

  /**
   * 데이터 카탈로그를 조회합니다.
   * @param params - { customerCompanyNo: 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호, page: 페이지 번호, size: 페이지당 항목 수, keyword: 데이타명 검색 }
   */
  async getDataCatalog(params: Partial<IDataCatalogRequest>): Promise<IPaginationResponse<IDataCatalogItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IDataCatalogItem>>> = await api.get(
      `mi/market-data/companies/${params.customerCompanyNo}/data-catalog`,
      {
        params,
      },
    )

    return response.data.data
  },

  /**
   * 최근 조회한 데이터 목록을 조회합니다.
   */
  async getRecentViewed(): Promise<IDataCatalogItem[]> {
    const response: AxiosResponse<ICommonResponse<IDataCatalogItem[]>> = await api.get('mi/market-data/recent-viewed')

    return response.data.data
  },
}

export default marketDataService
