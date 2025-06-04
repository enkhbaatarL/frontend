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

export interface IDashboardInfo {
  chartPredictSettingNm: string
  lastUpdateDt: string
}

export interface IDashboardChartDates {
  dates: string[]
}
interface IDashboardChartMetadata {
  marketIndexAnalysisTargetCd: string
  lastUpdateDt: string
  currency: string
  currentUnitCd: string
  baseDate: string
  dataTableType: string
}
interface IChartLineRawData {
  resultDate: string
  predictDate: string
  value: number
}
interface IChartLine {
  isPermitted: boolean
  dataType: string
  goodsDataSourceNo: number
  rawData: IChartLineRawData[]
}
interface IDashboardChart {
  chartLineDescription: string
  chartLineType: string
  actualChartLines: IChartLine
  forecastChartLines: IChartLine
}
export interface IDashboardChartData {
  dashboardMetadata: IDashboardChartMetadata
  charts: IDashboardChart[]
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
   * 대시보드 데이터 존재 여부를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   */
  async getdashboardDataExists(companyNo: number): Promise<boolean> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/data/exists`)
    return response.data.data
  },
  /**
   * 대시보드 기본 정보를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   */
  async getdashboardInfo(companyNo: number): Promise<IDashboardInfo> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/info`)
    return response.data.data
  },
  /**
   * 대시보드 차트 조회 가능한 날짜 리스트를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   */
  async getdashboardChartDates(companyNo: number): Promise<IDashboardChartDates> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/chart-dates`)
    return response.data.data
  },
  /**
   * 대시보드 차트 데이터를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param date - 조회할 년월
   */
  async getdashboardChartData(companyNo: number, date: string): Promise<IDashboardChartData> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/chart`, { params: { date } })
    return response.data.data
  },
}

export default dashboardDataService
