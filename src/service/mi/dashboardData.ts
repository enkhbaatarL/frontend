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
interface ChartLine {
  isPermitted: boolean
  dataType: 'FUTURE' | 'ACTUAL'
  rawData: {
    date: string
    value: number
  }[]
}

interface DashboardChart {
  chartLineDescription: string
  chartLineType: string
  actualChartLines: ChartLine
  forecastChartLines: ChartLine
}

export interface DashboardChartInfo {
  dashboardMetadata: {
    marketIndexAnalysisTargetCd: string
    lastUpdateDt: string
    currency: string
    currentUnitCd: string
    baseDate: string
  }
  charts: DashboardChart[]
  dashboardDataSources: {
    goodsDataSourceNo: number
    dashboardLineName: string
  }[]
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

  /**
   * 대시보드 차트 데이터르 조회합니다.
   * @param companyNo - 고객사 번호
   * @param date - 조회할 년월
   */
  async getdashboardChart(companyNo: number, date: string): Promise<DashboardChartInfo> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/chart`, {
      params: { date },
    })
    return response.data.data
  },
}

export default dashboardDataService
