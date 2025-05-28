import api from '@/lib/axios.ts'

export interface IDashboardLastInsightsInfo {
  modifyDt: string
  providerNm: string
  providerNo: number
  goodsDataNo: number
  goodsDataCategoryCd: string
  goodsNo: number
  goodsDataNm: string
  goodsNm: string
}

interface MarketMetaDataSummary {
  chartMarkRank: number
  goodsNo: number
  goodsDataNo: number
  goodsDataSourceNo: number
  goodsDataNm: string
  goodsDataSourceNm: string
  currency: string
  currentUnitCd: string
  interval: string
  lastUpdateDt: string
  indexStartDt: string
  lastValue: number
  momChangeRate: number | null
  momChangeValue: number | null
  wowChangeRate: number | null
  wowChangeValue: number | null
  dodChangeRate: number | null
  dodChangeValue: number | null
}

export interface MarketDataItemInfo {
  isPermitted: boolean
  marketMetaDataSummary: MarketMetaDataSummary
}

/**
 * 대시보드 서비스
 */
const dashboardDataService = {
  /**
   * 대시보드 Latest Insights 목록을 조회합니다.
   * @param companyNo - 고객사 번호
   */
  async getdashboardLatestInsights(companyNo: number): Promise<IDashboardLastInsightsInfo[]> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/latest-insights`)
    return response.data.data
  },
  /**
   * 대시보드 Market Data 목록을 조회합니다.
   * @param companyNo - 고객사 번호
   */
  async getdashboardMakterDatas(companyNo: number): Promise<MarketDataItemInfo[]> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/market-datas`)
    return response.data.data
  },
}

export default dashboardDataService
