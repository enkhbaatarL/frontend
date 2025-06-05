import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { IAuditInfo } from '@/service/admin/members'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'
import { ChartInterval, ChartMetadata, ChartRange, DataDetailChart, MinInterval } from '@/types/dataDetailChart'

export interface ICategoryDataInfo {
  categoryHighCd: string
  value: string[]
}
export interface IProductDataInfo {
  goodsDataNm: string
  goodsDataExpn: string
  goodsDataSummaryCntt: string
  providerNm: string
  categories: ICategoryDataInfo[]
  isViewable: boolean
  isDownloadable: boolean
  auditInfo: IAuditInfo
}
export interface IProductDataUnstructuredData {
  fileNo: number
  fileName: string
  extension: string
  isPdfViewable: boolean
  fileSize: number
  auditInfo: IAuditInfo
}
export interface IProductDataStructuredData {
  goodsDataSourceNo: number
  goodsDataSourceNm: string
  minInterval: MinInterval
  allowedPeriods: {
    range: ChartRange
    defaultInterval: ChartInterval
    intervals: ChartInterval[]
  }[]
}
export interface IProductDataStructuredRequest extends IPaginationRequest {
  startDate: string
  endDate: string
}
export interface IProductDataStructuredRawData {
  cells: string[]
}
export interface IProductDataStructuredRawDataDownloadRequest {
  startDate: string
  endDate: string
}
export interface IProductDataStructuredChartRequest {
  goodsDataSourceNo?: number
  interval?: ChartInterval
  range?: ChartRange
  startDate?: string
  endDate?: string
  unitCd?: string
}
export interface IProductDataStructuredChartPersonalizationRequest {
  chartConditionCd: string
  chartConditionVal: string
}
/**
 * 상품 데이터를 조회합니다.
 * isViewable: 상품에 대한 보기 권한 여부를 의미합니다.
 * isDownloadable: 상품에 대한 다운로드 권한 여부를 의미합니다.
 * 해당 API 호출 시, 상품데이터 조회 내역이 내부적으로 적재되어 관리됩니다.
 * @param goodsNo -상품 번호
 * @param goodsDataNo - 상품 데이터 번호
 */
const dataDetailService = {
  async getProductData(goodsNo: number, goodsDataNo: number): Promise<IProductDataInfo> {
    const response: AxiosResponse<ICommonResponse<IProductDataInfo>> = await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}`,
    )

    return response.data.data
  },

  /**
   * 상품 데이터 비정형데이터 목록을 조회합니다.
   * isPdfViewable: 비정형데이터 파일의 PDF 뷰어 가능 여부를 의미합니다.
   * @param goodsNo - 상품 번호
   * @param goodsDataNo - 상품 데이터 번호
   */
  async getProductDataUnstructuredDataList(goodsNo: number, goodsDataNo: number): Promise<IProductDataUnstructuredData[]> {
    const response: AxiosResponse<ICommonResponse<IProductDataUnstructuredData[]>> = await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}/unstructured-data`,
    )

    return response.data.data
  },

  /**
   * 상품 정형 데이터(데이터소스) 목록을 조회합니다.
   * @param goodsNo - 상품 번호
   * @param goodsDataNo - 상품 데이터 번호
   */
  async getProductDataStructuredDataList(goodsNo: number, goodsDataNo: number): Promise<IProductDataStructuredData[]> {
    const response: AxiosResponse<ICommonResponse<IProductDataStructuredData[]>> = await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}/goods-data-sources`,
    )

    return response.data.data
  },

  /**
   * 상품 정형 데이터(데이터소스) 차트의 메타데이터를 조회합니다.
   * 상품 VIEW권한이 필요합니다.
   * @param goodsNo
   * @param goodsDataNo
   * @param goodsDataSourceNo
   */
  async getProductDataStructuredChartMetaData(goodsNo: number, goodsDataNo: number, goodsDataSourceNo: number): Promise<ChartMetadata> {
    const response: AxiosResponse<ICommonResponse<ChartMetadata>> = await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}/goods-data-sources/${goodsDataSourceNo}/metadata`,
    )
    return response.data.data
  },

  /**
   * 상품 정형 데이터(데이터소스) 차트를 조회합니다.
   * 상품 VIEW권한이 필요합니다.
   * @param goodsNo
   * @param goodsDataNo
   * @param goodsDataSourceNo
   * @param params - { interval: 차트 주기, range: 차트 범위, startDate: 조회 시작일, endDate: 조회 종료일, unitCd: 변환 단위 코드 }
   */
  async getProductDataStructuredChartData(
    goodsNo: number,
    goodsDataNo: number,
    goodsDataSourceNo: number,
    params: IProductDataStructuredChartRequest,
  ): Promise<DataDetailChart> {
    const response: AxiosResponse<ICommonResponse<DataDetailChart>> = await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}/goods-data-sources/${goodsDataSourceNo}/chart`,
      { params },
    )

    return response.data.data
  },

  /**
   * 페이지네이션을 통해 상품 정형 데이터(데이터소스) raw 데이터를 조회합니다.
   * 상품 VIEW권한이 필요합니다.
   * @param goodsNo - 상품 번호
   * @param goodsDataNo - 상품 데이터 번호
   * @param goodsDataSourceNo - 상품 데이터소스 번호
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, startDate: 조회 시작일, endDate: 조회 종료일 }
   */
  async getProductDataStructuredRawData(
    goodsNo: number,
    goodsDataNo: number,
    goodsDataSourceNo: number,
    params: IProductDataStructuredRequest,
  ): Promise<IPaginationResponse<IProductDataStructuredRawData>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IProductDataStructuredRawData>>> = await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}/goods-data-sources/${goodsDataSourceNo}/raw-data`,
      { params },
    )

    return response.data.data
  },

  /**
   * 상품 정형 데이터(데이터소스) raw 데이터를 다운로드 합니다.
   * 상품 DOWNLOAD권한이 필요합니다.
   * @param goodsNo - 상품 번호
   * @param goodsDataNo - 상품 데이터 번호
   * @param goodsDataSourceNo - 상품 데이터소스 번호
   * @param params - { startDate: 조회 시작일, endDate: 조회 종료일 }
   */
  async downloadProductDataStructuredRawData(
    goodsNo: number,
    goodsDataNo: number,
    goodsDataSourceNo: number,
    params: IProductDataStructuredRawDataDownloadRequest,
  ) {
    return await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}/goods-data-sources/${goodsDataSourceNo}/raw-data/download`,
      { params, responseType: 'blob' },
    )
  },

  /**
   * 상품 정형 데이터(데이터소스) 차트 개인화 설정을 합니다.
   * 개인화 차트 조건 타입과 허용 값 정의
   * RANGE: 차트 범위(1W, 1M, 3M, 6M, 1Y, 2Y) / CUSTOM은 개인화 대상이 아님
   * INTERVAL: 차트 주기(1D, 1W, 2W, 1M, 3M, 6M, 1Y)
   * INDICATOR: 보조 지표(BB, MA_5, MA_20, MA_60, MA_120), visible 처리 / 복수 값 허용
   * CHART: 차트 유형(CANDLE, LINE)
   * UNIT_CD: 변환 단위 코드
   * COMP_DATA_SOURCE: 상품 데이터소스 번호, visible 처리 / 복수 값 허용
   * 차트 개인화 설정은 항상 전체 설정 값을 리스트로 전달해주어야 합니다. (요청 시, 개인화 리소스 전체 교체)
   * @param goodsNo - 상품 번호
   * @param goodsDataNo - 상품 데이터 번호
   * @param goodsDataSourceNo - 상품 데이터소스 번호
   * @param body - { chartConditionCd: 개인화 차트 조건 타입(RANGE, INTERVAL, INDICATOR, CHART, UNIT_CD, COMP_DATA_SOURCE), chartConditionVal: 개인화 차트 조건 값 }
   */
  async setProductDataStructuredChartPersonalization(
    goodsNo: number,
    goodsDataNo: number,
    goodsDataSourceNo: number,
    body: IProductDataStructuredChartPersonalizationRequest[],
  ) {
    const response = await api.put(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}/goods-data-sources/${goodsDataSourceNo}/charts-personalize`,
      body,
    )

    return response.data.data
  },
}
export default dataDetailService
