import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { IAuditInfo } from '@/service/admin/members'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

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
  auditInfo: IAuditInfo
}
export interface IProductDataStructuredData {
  goodsDataSourceNo: number
  goodsDataSourceNm: string
  minInterval: string
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
  async getProductDataUnstructuredDataList(goodsNo: number, goodsDataNo: number): Promise<IProductDataUnstructuredData> {
    const response: AxiosResponse<ICommonResponse<IProductDataUnstructuredData>> = await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}/unstructured-data`,
    )

    return response.data.data
  },

  /**
   * 상품 정형 데이터(데이터소스) 목록을 조회합니다.
   * @param goodsNo - 상품 번호
   * @param goodsDataNo - 상품 데이터 번호
   */
  async getProductDataStructuredDataList(goodsNo: number, goodsDataNo: number): Promise<IProductDataStructuredData> {
    const response: AxiosResponse<ICommonResponse<IProductDataStructuredData>> = await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}/goods-data-sources`,
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
    const response = await api.get(
      `/mi/data-detail/goods/${goodsNo}/goods-data/${goodsDataNo}/goods-data-sources/${goodsDataSourceNo}/raw-data/download`,
      { params, responseType: 'blob' },
    )

    return response
  },
}
export default dataDetailService
