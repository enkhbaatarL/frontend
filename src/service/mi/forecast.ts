/* NOTI: 기존 대시보드 기능이 Forecast로 변경되면서 호출하는 api url은 유지한 채 명칭만 변경 되었습니다. */

import { AxiosResponse } from 'axios'

import api from '@/lib/axios.ts'
import { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse } from '@/types/api.ts'

export interface IForecastLastInsightsInfo {
  modifyDt: string
  providerNm: string
  providerNo: number
  goodsDataNo: number
  goodsDataCategoryCd: string
  goodsNo: number
  goodsDataNm: string
  goodsNm: string
}

export interface MarketMetaDataSummary {
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
  frequency?: string
  providerName?: string
  goodsDataSourceExpn?: string
  previousValue?: number
  recentChangeValue?: number
  recentChangeRate?: number
}

export interface MarketDataItemInfo {
  isPermitted: boolean
  marketMetaDataSummary: MarketMetaDataSummary
}

export interface ExtendedMarketDataItemInfo {
  isPermitted: boolean
  marketMetaDataSummary: Omit<MarketMetaDataSummary, 'previousValue' | 'providerName' | 'goodsDataSourceExpn'> & {
    change: number
    changeColor: string
    changePercent: number
    changePercentColor: string
    period: string
    unit: string
    previousValue: string | number
    providerName: string
    goodsDataSourceExpn?: string
  }
}
interface ChartLine {
  isPermitted: boolean
  dataType: 'FUTURE' | 'ACTUAL'
  rawData: {
    date: string
    value: number
  }[]
}

interface ForecastChart {
  chartLineDescription: string
  chartLineType: string
  actualChartLines: ChartLine
  forecastChartLines: ChartLine
}

export interface ForecastChartInfo {
  dashboardMetadata: {
    marketIndexAnalysisTargetCd: string
    lastUpdateDt: string
    currency: string
    currentUnitCd: string
    baseDate: string
  }
  charts: ForecastChart[]
  dashboardDataSources: {
    goodsDataSourceNo: number
    dashboardLineName: string
  }[]
  isFileDownload: boolean
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
  isDownloadable: boolean
  targets: HistoryMetaDataTarget[]
}
export interface ForecastBasicInfo {
  chartPredictSettingNm: string
  lastUpdateDt: string
}
export interface IForecastHistoryDetailRequest {
  fulfillDate: string
}
export interface IForecastHistoryDetailStat {
  price: number
  changeRate: number
  isMaximum: boolean
  isMinimum: boolean
}
export interface IForecastHistoryDetailBaseline {
  type: string
  suffix?: string
  stat: IForecastHistoryDetailStat
  isPermitted: boolean
}
export interface IForecastHistoryDetail {
  date: string
  download: boolean
  baseline: IForecastHistoryDetailBaseline
  baseline2?: IForecastHistoryDetailBaseline
  counterpart?: IForecastHistoryDetailBaseline
}

export interface IForecastChartDates {
  dates: string[]
}
interface IForecastChartMetadata {
  marketIndexAnalysisTargetCd: string
  lastUpdateDt: string
  currency: string
  currentUnitCd: string
  baseDate: string
  dataTableType: string
  tableHeader: string
}
interface IChartLineRawData {
  resultDate: string
  predictDate: string
  value: number
}
interface IChartLine {
  dataExplanation: string
  isPermitted: boolean
  dataType: string
  goodsDataSourceNo: number
  rawData: IChartLineRawData[] | null
}
interface IForecastChart {
  chartLineDescription: string
  chartLineType: string
  actualChartLines: IChartLine
  forecastChartLines: IChartLine
}
export interface IForecastChartData {
  dashboardMetadata: IForecastChartMetadata
  charts: IForecastChart[]
  dashboardDataSources: {
    goodsDataSourceNo: number
    dashboardLineName: string
  }[]
  isFileDownload: boolean
}
export interface IForecastFactorCategoryRequest {
  predictDate: string
  goodsDataSourceNo: number
  date: string
}
export interface IForecastSummary {
  explanatoryTitleContent: string
  explanatorySummaryContent: string
  explanatoryFilePath: string
}
export interface IForecastSummaries {
  summaries: IForecastSummary[]
  isFileDownload: boolean
}
export interface ICategoryList {
  explanatoryLevelNms: string[]
}
export interface IForecastFactorsRequest {
  predictDate: string
  date: string
  goodsDataSourceNo: number
  explanatoryLevelNm: string
}
export interface IFactor {
  marketIndexAnalysisTargetCd: string
  predictionFulfillDt: string
  predictionInputMnemonicDetailCd: string
  predictionInputMnemonicCd: string
  explanatoryLevelDetailNm: string
  explanatoryScore: number
  explanatoryRnk: number
  mnemonicCd: string
  explanatoryDirectionSymbolNm: string
  dirRank: number
}
export interface IForecastFactorsResponse {
  explanatoryLevelNm: string
  categorySummary: string
  plusFactors: IFactor[]
  minusFactors: IFactor[]
}
export interface IGraphMetaData {
  currency: string
  currentUnitCd: string
  tableHeader: string
}
export interface IRawData {
  resultDate: string
  predictDate: string
  value: number
}
export interface IDatasource {
  goodsDataSourceNo: number
  goodsDataSourceNm: string
  goodsNo: number
  goodsDataNo: number
  isPermitted: boolean
}
export interface IForecastFactorGraphRequest {
  goodsDataSourceNo: number
  predictDate: string
  date: string
  mnemonicCd: string
  explanatoryLevelNm: string
  predictionInputMnemonicCd: string
  marketIndexAnalysisTargetCd: string
  predictionInputMnemonicDetailCd: string
}
export interface IForecastFactorGraphResponse {
  summary: string
  graphMetadata: IGraphMetaData
  rawData: IRawData[]
  datasource: IDatasource
}

/**
 * Forecast 서비스
 */
const forecastDataService = {
  /**
   * Forecast Latest Insights 목록을 조회합니다.
   * @param companyNo - 고객사 번호
   */
  async getForecastLatestInsights(companyNo: number): Promise<IForecastLastInsightsInfo[]> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/latest-insights`)
    return response.data.data
  },
  /**
   * Forecast Market Data 목록을 조회합니다.
   * @param companyNo - 고객사 번호
   */
  async getForecastMarketDatas(companyNo: number): Promise<MarketDataItemInfo[]> {
    const response = await api.get(withCustomBaseUrl(`mi/dashboard/companies/${companyNo}/market-datas`))
    return response.data.data
  },
  /**
   * Forecast 데이터 존재 여부를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   */
  async getForecastDataExists(companyNo: number): Promise<boolean> {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/data/exists`)
    return response.data.data
  },
  /**
   * Forecast 차트 조회 가능한 날짜 리스트를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   */
  async getForecastChartDates(companyNo: number): Promise<IForecastChartDates> {
    const response = await api.get(withCustomBaseUrl(`mi/dashboard/companies/${companyNo}/chart-dates`))
    return response.data.data
  },
  /**
   * Forecast 차트 데이터를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param date - 조회할 년월
   */
  async getForecastChartData(companyNo: number, date: string): Promise<IForecastChartData> {
    const response = await api.get(withCustomBaseUrl(`mi/dashboard/companies/${companyNo}/chart`), { params: { date } })
    return response.data.data
  },

  /**
   * Forecast 차트 데이터를 조회합니다.
   * @param companyNo - 고객사 번호
   * @param date - 조회할 년월
   */
  async getForecastChart(companyNo: number, date: string): Promise<ForecastChartInfo> {
    const response = await api.get(withCustomBaseUrl(`mi/dashboard/companies/${companyNo}/chart`), {
      params: { date },
    })
    return response.data.data
  },
  /**
   * Forecast 기본 정보를 조회합니다.
   * @param companyNo - 고객사 번호
   */
  async getForecastBasicInfo(companyNo: number): Promise<ForecastBasicInfo> {
    const response: AxiosResponse<ICommonResponse<ForecastBasicInfo>> = await api.get(
      withCustomBaseUrl(`mi/dashboard/companies/${companyNo}/info`),
    )
    return response.data.data
  },
  /**
   * Forecast 히스토리 메타데이터를 조회합니다.
   */
  async getHistoryMetadata(): Promise<ICommonResponse<HistoryMetaData>> {
    const response: AxiosResponse<ICommonResponse<HistoryMetaData>> = await api.get('mi/dashboard/histories/metadata')

    return response.data
  },
  /**
   * Forecast 히스토리 상세 데이터를 조회합니다. (예측가 + 실제가 or 선물가 조합으로 데이터가 생성됩니다.)
   * @param settingDetailNo
   * @param params - { fulfillDate: 예측수행일자 }
   */
  async getForecastHistoryDetail(settingDetailNo: number, params: IForecastHistoryDetailRequest): Promise<IForecastHistoryDetail[]> {
    const response: AxiosResponse<ICommonResponse<IForecastHistoryDetail[]>> = await api.get(
      withCustomBaseUrl(`mi/dashboard/histories/setting-details/${settingDetailNo}`),
      { params },
    )
    return response.data.data
  },
  /**
   * Forecast 히스토리 상세 데이터를 다운로드 합니다.
   * @param settingDetailNo
   * @param params - { fulfillDate: 예측수행일자 }
   */
  async getForecastHistoryDetailDownload(settingDetailNo: number, params: IForecastHistoryDetailRequest) {
    const response = await api.get(withCustomBaseUrl(`mi/dashboard/histories/setting-details/${settingDetailNo}/download`), {
      params,
      responseType: 'blob',
    })

    // 한글 파일명 처리를 위한 Content-Disposition 헤더 수정
    if (response.headers?.['content-disposition']) {
      const contentDisposition = response.headers['content-disposition']
      // filename*=UTF-8'' 형태로 인코딩된 파일명이 있는지 확인
      if (contentDisposition.includes('filename*=')) {
        // 이미 올바르게 인코딩되어 있으면 그대로 사용
        return response
      } else if (contentDisposition.includes('filename=')) {
        // filename= 형태인 경우 UTF-8로 인코딩
        const filenameMatch = contentDisposition.match(/filename=([^;\n]*)/)
        if (filenameMatch) {
          const originalFilename = filenameMatch[1].replace(/['"]/g, '')
          const encodedFilename = encodeURIComponent(originalFilename)
          response.headers['content-disposition'] = contentDisposition.replace(/filename=[^;\n]*/, `filename*=UTF-8''${encodedFilename}`)
        }
      }
    }

    return response
  },
  /**
   * Forecast 차트 데이터를 다운로드합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param date - 조회할 년월
   */
  async getForecastChartDataDownload(companyNo: number, date: string) {
    return await api.get(withCustomBaseUrl(`mi/dashboard/companies/${companyNo}/chart/file-download`), {
      params: { date },
      responseType: 'blob',
    })
  },
  /**
   * Forecast Summary 데이터를 다운로드 합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param date - YYYYMMDD
   * @param predictDate - YYYYMM
   */
  async getForecastSummaryFileDownload(companyNo: number, date: string, predictDate?: string) {
    const response = await api.get(`mi/dashboard/companies/${companyNo}/summary/file-download`, {
      params: { date, predictDate },
      responseType: 'blob',
    })

    // 한글 파일명 처리를 위한 Content-Disposition 헤더 수정
    if (response.headers?.['content-disposition']) {
      const contentDisposition = response.headers['content-disposition']
      // filename*=UTF-8'' 형태로 인코딩된 파일명이 있는지 확인
      if (contentDisposition.includes('filename*=')) {
        // 이미 올바르게 인코딩되어 있으면 그대로 사용
        return response
      } else if (contentDisposition.includes('filename=')) {
        // filename= 형태인 경우 UTF-8로 인코딩
        const filenameMatch = contentDisposition.match(/filename=([^;\n]*)/)
        if (filenameMatch) {
          const originalFilename = filenameMatch[1].replace(/['"]/g, '')
          const encodedFilename = encodeURIComponent(originalFilename)
          response.headers['content-disposition'] = contentDisposition.replace(/filename=[^;\n]*/, `filename*=UTF-8''${encodedFilename}`)
        }
      }
    }

    return response
  },
  /**
   * Forecast Summary 데이터를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param date - YYYYMMDD
   */
  async getForecastSummary(companyNo: number, date: string): Promise<IForecastSummaries> {
    const response: AxiosResponse<ICommonResponse<IForecastSummaries>> = await api.get(`mi/dashboard/companies/${companyNo}/summary`, {
      params: { date },
    })
    return response.data.data
  },
  /**
   * Forecast 차트 주요 요인 분석 카테고리를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param params - { predictDate: 예측 날짜, goodsDataSourceNo: 데이터 소스 번호 }
   */
  async getForecastFactorCategory(companyNo: number, params: IForecastFactorCategoryRequest) {
    const response: AxiosResponse<ICommonResponse<ICategoryList>> = await api.get(
      `mi/dashboard/companies/${companyNo}/chart/factor/category`,
      { params },
    )
    return response.data.data
  },
  /**
   * Forecast 차트 주요 요인 분석 데이터를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param params - { predictDate: 예측 날짜, goodsDataSourceNo: 데이터 소스 번호 }
   */
  async getForecastFactors(companyNo: number, params: IForecastFactorsRequest) {
    const response: AxiosResponse<ICommonResponse<IForecastFactorsResponse>> = await api.get(
      `mi/dashboard/companies/${companyNo}/chart/factors`,
      { params },
    )
    return response.data.data
  },
  /**
   * Forecast 차트 주요 요인 분석 그래프를 조회합니다.
   * @param companyNo - 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호
   * @param params - { predictDate: 예측 날짜, goodsDataSourceNo: 데이터 소스 번호, explanatoryLevelNm: 카테고리 }
   */
  async getForecastFactorGraph(companyNo: number, params: IForecastFactorGraphRequest) {
    const response: AxiosResponse<ICommonResponse<IForecastFactorGraphResponse>> = await api.get(
      withCustomBaseUrl(`mi/dashboard/companies/${companyNo}/chart/factor/graph`),
      { params },
    )
    return response.data.data
  },
}

export default forecastDataService
