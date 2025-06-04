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
}

export default dashboardDataService
