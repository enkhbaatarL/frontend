import { AxiosResponse } from 'axios'

import api from '@/lib/axios.ts'
import { ICommonResponse } from '@/types/api.ts'

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

export interface SettingDetail {
  settingDetailNo: number
  settingDetailExpn: string
  priceType: string
  priceTypeNm: string
}

export interface HistoryMetaDataTarget {
  fulfillmentDates: string[]
  settingDetails: SettingDetail[]
}

export interface HistoryMetaData {
  predictTargetSettingNm: string
  predictPeriodUnitSeparateCd: string
  currency: string
  unit: string
  targets: HistoryMetaDataTarget[]
}
export interface DashboardBasicInfo {
  chartPredictSettingNm: string
  lastUpdateDt: string
}
export interface IDashboardHistoryDetailRequest {
  fulfillDate: string
}
export interface IDashboardHistoryDetailStat {
  price: number
  changeRate: number
  isMaximum: boolean
  isMinimum: boolean
}
export interface IDashboardHistoryDetailBaseline {
  type: string
  stat: IDashboardHistoryDetailStat
  isPermitted: boolean
}
export interface IDashboardHistoryDetail {
  date: string
  baseline: IDashboardHistoryDetailBaseline
  counterpart?: IDashboardHistoryDetailBaseline
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
  dashboardDataSources: {
    goodsDataSourceNo: number
    dashboardLineName: string
  }[]
}
export interface IDashboardFactorCategoryRequest {
  predictDate: string
  goodsDataSourceNo: number
}
export interface IDashboardSummary {
  explanatoryTitleContent: string
  explanatorySummaryContent: string
  explanatoryFilePath: string
}
export interface IDashboardSummaries {
  summaries: IDashboardSummary[]
  isFileDownload: boolean
}

/**
 * 대시보드 서비스
 */
const dashboardDataService = {
  /**
   * 대시보드 Latest Insights 목록을 조회합니다.
   * @param companyNo - 고객사 번호
   */
  async getDashboardLatestInsights(companyNo: number): Promise<IDashboardLastInsightsInfo[]> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/latest-insights`)
    return response.data.data
  },
  /**
   * 대시보드 Market Data 목록을 조회합니다.
   * @param companyNo - 고객사 번호
   */
  async getDashboardMarketDatas(companyNo: number): Promise<MarketDataItemInfo[]> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/market-datas`)
    return response.data.data
  },
  /**
   * 대시보드 데이터 존재 여부를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   */
  async getDashboardDataExists(companyNo: number): Promise<boolean> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/data/exists`)
    return response.data.data
  },
  /**
   * 대시보드 차트 조회 가능한 날짜 리스트를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   */
  async getDashboardChartDates(companyNo: number): Promise<IDashboardChartDates> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/chart-dates`)
    return response.data.data
  },
  /**
   * 대시보드 차트 데이터를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param date - 조회할 년월
   */
  async getDashboardChartData(companyNo: number, date: string): Promise<IDashboardChartData> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/chart`, { params: { date } })
    return response.data.data
  },

  /**
   * 대시보드 차트 데이터르 조회합니다.
   * @param companyNo - 고객사 번호
   * @param date - 조회할 년월
   */
  async getDashboardChart(companyNo: number, date: string): Promise<DashboardChartInfo> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/chart`, {
      params: { date },
    })
    return response.data.data
  },
  /**
   * 대시보드 대시보드 기본 정보를 조회합니다.
   * @param companyNo - 고객사 번호
   */
  async getDashboardBasicInfo(companyNo: number): Promise<DashboardBasicInfo> {
    const response: AxiosResponse<ICommonResponse<DashboardBasicInfo>> = await api.get(`mi/dashboard/companies/${companyNo}/info`)
    return response.data.data
  },
  /**
   * 대시보드 히스토리 메타데이터를 조회합니다.
   */
  async getHistoryMetadata(): Promise<ICommonResponse<HistoryMetaData>> {
    const response: AxiosResponse<ICommonResponse<HistoryMetaData>> = await api.get('mi/dashboard/histories/metadata')

    return response.data
  },
  /**
   * 대시보드 히스토리 상세 데이터를 조회합니다. (예측가 + 실제가 or 선물가 조합으로 데이터가 생성됩니다.)
   * @param settingDetailNo
   * @param params - { fulfillDate: 예측수행일자 }
   */
  async getDashboardHistoryDetail(settingDetailNo: number, params: IDashboardHistoryDetailRequest): Promise<IDashboardHistoryDetail[]> {
    const response: AxiosResponse<ICommonResponse<IDashboardHistoryDetail[]>> = await api.get(
      `mi/dashboard/histories/setting-details/${settingDetailNo}`,
      { params },
    )

    return response.data.data
  },
  /**
   * 대시보드 히스토리 상세 데이터를 다운로드 합니다.
   * @param settingDetailNo
   * @param params - { fulfillDate: 예측수행일자 }
   */
  async getDashboardHistoryDetailDownload(settingDetailNo: number, params: IDashboardHistoryDetailRequest) {
    return await api.get(`mi/dashboard/histories/setting-details/${settingDetailNo}/download`, { params, responseType: 'blob' })
  },
  /**
   * 대시보드 차트 데이터를 다운로드합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param date - 조회할 년월
   */
  async getDashboardChartDataDownload(companyNo: number, date: string) {
    return await api.get(`mi/dashboard/companies/${companyNo}/chart/file-download`, {
      params: { date },
      responseType: 'blob',
    })
  },
  /**
   * 대시보드 Summary 데이터를 다운로드 합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param date - YYYYMMDD
   * @param predictDate - YYYYMM
   */
  async getDashboardSummaryFileDownload(companyNo: number, date: string, predictDate?: string) {
    return await api.get(`mi/dashboard/companies/${companyNo}/summary/file-download`, {
      params: { date, predictDate },
      responseType: 'blob',
    })
  },
  /**
   * 대시보드 Summary 데이터를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param date - YYYYMMDD
   */
  async getDashboardSummary(companyNo: number, date: string): Promise<IDashboardSummaries> {
    const response: AxiosResponse<ICommonResponse<IDashboardSummaries>> = await api.get(`mi/dashboard/companies/${companyNo}/summary`, {
      params: { date },
    })
    return response.data.data
  },
  /**
   * 대시보드 차트 주요 요인 분석 카테고리를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param params - { predictDate: 예측 날짜, goodsDataSourceNo: 데이터 소스 번호 }
   */
  async getDashboardFactorCategory(companyNo: number, params: IDashboardFactorCategoryRequest) {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/chart/factor/category`, { params })
    return response.data.data
  },
}

export default dashboardDataService
