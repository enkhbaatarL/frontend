import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'
export interface IRawDataPoint {
  date: string
  value: number
}

export interface IMainGraph {
  specificIndicatorName: string | null
  rawData: IRawDataPoint[]
}

export interface ICompareGraph {
  specificIndicatorName: string | null
  rawData: IRawDataPoint[]
}
export interface IchangeRate {
  label: string
  value: number
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
  dodChangeRate: number
  changeRates: IchangeRate[]
}

export interface IMarketData {
  mainChart?: IMainGraph
  isPermitted: boolean
  isCustomChart?: boolean
  marketMetaData?: IMarketMetaData
  compareCharts?: ICompareGraph[]
}

export interface IDataCatalogRequest extends IPaginationRequest {
  keyword?: string
}

export interface IDataCatalogItem {
  providerNo: number
  goodsNo: number
  goodsDataNo: number
  goodsDataNm: string
  goodsDataSrcNo: number
  goodsDataSrcNm: string
  lastValue: string
  modifyDt: string
}

export interface IRecentViewedItem {
  providerNo: number
  providerNm: string
  goodsNo: number
  goodsDataNo: number
  goodsDataNm: string
  goodsDataExpn: string
  recentViewedDt: string
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
      withCustomBaseUrl(`/mi/market-data/companies/${customerCompanyNo}/market-datas`),
    )

    return response.data.data
  },

  /**
   * 커스텀 요건 : 마켓 데이터를 조회합니다. (메인 데이터셋 , 비교데이터셋, 볼린저밴드 등 포함)
   * 예시) SK E&S 고객사의 GIE EU 데이터 : /mi/market-data/companies/2013/custom/gie-eu
   * @param customerCompanyNo - 고객사 번호
   */
  async getMarketDataCustom(customerCompanyNo?: number, customId?: string): Promise<IMarketData> {
    if (!customerCompanyNo) throw new Error('customerCompanyNo is required')

    const response: AxiosResponse<ICommonResponse<IMarketData>> = await api.get(
      withCustomBaseUrl(`/mi/market-data/companies/${customerCompanyNo}/custom/${customId}`),
    )

    return response.data.data
  },

  /**
   * 데이터 카탈로그를 조회합니다.
   * @param customerCompanyNo
   * @param params - {page: 페이지 번호, size: 페이지당 항목 수, keyword: 데이타명 검색 }
   */
  async getDataCatalog(customerCompanyNo: number, params: Partial<IDataCatalogRequest>): Promise<IPaginationResponse<IDataCatalogItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IDataCatalogItem>>> = await api.get(
      withCustomBaseUrl(`/mi/market-data/companies/${customerCompanyNo}/data-catalog`),
      {
        params,
      },
    )

    return response.data.data
  },

  /**
   * 최근 조회한 데이터 목록을 조회합니다.
   */
  async getRecentViewed(customerCompanyNo: number): Promise<IRecentViewedItem[]> {
    const response: AxiosResponse<ICommonResponse<IRecentViewedItem[]>> = await api.get(
      `mi/market-data/companies/${customerCompanyNo}/recent-viewed`,
    )

    return response.data.data
  },
}

export default marketDataService
