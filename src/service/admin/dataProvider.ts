import { AxiosResponse } from 'axios'

import { IAuditInfo } from './members'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export interface IProviderInfo {
  providerNo: number
  providerNm: string
  isUsed: boolean
}
export interface IProviderGoodsInfo {
  goodsNo: number
  goodsNm: string
  goodsId: string
}
export interface IProviderListInfo {
  providerNo: number
  providerNm: string
  providerId: string
  isUsed: boolean
  goodsCount: number
  createDt: string
}
export interface IProviderRegisterRequest {
  providerNm: string
  providerId: string
  providerExpn: string
  isUsed: boolean
}
export interface IProviderGoodsDetailInfo {
  goodsNo: number
  goodsNm: string
  goodsId: string
  goodsExpn: string
  isUsed: boolean
  isPublic: boolean
  auditInfo: IAuditInfo
}
export interface IProviderGoodsLatestUpdatedInfo {
  modifyDt: string
  modifyUserName: string
}
export interface IProviderGoodsDataRequest extends IPaginationRequest {
  keyword?: string
}
export interface IProviderGoodsDataInfo {
  customerCompanyNm: string
  goodsDataNo: number
  goodsDataNm: string
  goodsDataExpn: string
}
export interface IProviderGoodsUpdateRequest {
  goodsNm: string
  goodsId: string
  goodsExpn: string
  isUsed: boolean
  isPublic: boolean
}
export interface IProviderDetailInfo {
  providerNo: number
  providerNm: string
  providerId: string
  providerExpn: string
  isUsed: boolean
  auditInfo: IAuditInfo
}

export interface IStructuredDataTypeInfo {
  componentTypeId: string
  componentTypeNm: string
}

export interface IProviderCommonOptionTypeInfo {
  codeId: string
  codeNm: string
  codeExpn: string
}

export type IProviderDocumentTypeInfo = IProviderCommonOptionTypeInfo

export type IProviderLanguageTypeInfo = IProviderCommonOptionTypeInfo

export interface IProductCompanyPermissionRequest extends IPaginationRequest {
  companyNm?: string
}
export interface IProductCompanyPermissionInfo {
  companyNo: number
  companyNm: string
  isUsed: boolean
  goodsAuthManagementSeparateCd: string
  goodsAuthManagementSeparateNm: string
  viewPermission: string
  downloadPermission: string
  auditInfo: IAuditInfo
}
export interface IUpdateProviderRequest {
  providerNm: string
  providerExpn: string
  isUsed: boolean
}

export interface IProviderGoodsDataRegisterRequest {
  goodsDataNm: string
  goodsDataExpn: string
  goodsDataSummaryCntt: string
  docCategoryList: {
    CodeId: string
  }[]
  langCategoryList: {
    CodeId: string
  }[]
  structuredDataList: {
    componentTypeId: string
    fileNo: number
  }[]
  unstructuredDataList: {
    criteriaDt: string
    fileNo: number
  }[]
}

const dataProviderService = {
  /**
   * 데이터 프로바이더명 목록을 조회합니다.
   */
  async getProviders(): Promise<IProviderInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderInfo>> = await api.get('/admin/provider-management/provider/name')

    return response.data.data
  },
  /**
   * 상품 목록을 조회합니다. without pagination
   * @param providerNo 프로바이더 번호
   */
  async getProviderGoods(providerNo: number): Promise<IProviderGoodsInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsInfo>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods/name`,
    )

    return response.data.data
  },
  /**
   * 상품 목록을 조회합니다. with pagination
   * @param providerNo 프로바이더 번호
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, keyword: 상품명 또는 상품설명 검색 }
   */
  async getProviderGoodsList(providerNo: number, params: IProviderGoodsDataRequest): Promise<IPaginationResponse<IProviderGoodsInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IProviderGoodsInfo>>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods`,
      { params },
    )

    return response.data.data
  },
  /**
   * 상품 상세를 조회합니다.
   * @param providerNo 프로바이더 번호
   * @param goodsNo 상품 번호
   */
  async getProviderGoodsDetail(providerNo: number, goodsNo: number): Promise<IProviderGoodsDetailInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsDetailInfo>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods/${goodsNo}`,
    )

    return response.data.data
  },
  /**
   * 상품의 최신 수정일과 수정자를 반납합니다.
   * @param providerNo 프로바이더 번호
   * @param goodsNo 상품 번호
   */
  async getProviderGoodsLatestUpdated(providerNo: number, goodsNo: number): Promise<IProviderGoodsLatestUpdatedInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsLatestUpdatedInfo>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods/${goodsNo}/latest-updated`,
    )

    return response.data.data
  },
  /**
   * 데이터 목록을 조회합니다.
   * @param providerNo 프로바이더 번호
   * @param goodsNo 상품 번호
   * @param params - { keyword: 데이타명 또는 데이타설명 검색 }
   */
  async getProviderGoodsDataList(
    providerNo: number,
    goodsNo: number,
    params: IProviderGoodsDataRequest,
  ): Promise<IPaginationResponse<IProviderGoodsDataInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IProviderGoodsDataInfo>>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods/${goodsNo}/goods-data`,
      { params },
    )

    return response.data.data
  },
  /**
   * 상품을 수정합니다.
   * @param providerNo 프로바이더 번호
   * @param goodsNo 상품 번호
   * @param body - { goodsNm: 상품 이름, goodsId: 상품ID, goodsExpn: 상품 설명, isUsed: 상품 사용유무, isPublic: 회사공통사용가능여부 }
   */
  async updateProviderGoods(providerNo: number, goodsNo: number, body: IProviderGoodsUpdateRequest): Promise<IProviderGoodsInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderGoodsInfo>> = await api.patch(
      `/admin/provider-management/providers/${providerNo}/goods/${goodsNo}`,
      body,
    )

    return response.data.data
  },
  /**
   * 데이터 프로바이더 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수 }
   */
  async getProviderList(params: Partial<IPaginationRequest>): Promise<IPaginationResponse<IProviderListInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IProviderListInfo>>> = await api.get(
      '/admin/provider-management/provider',
      { params },
    )

    return response.data.data
  },
  /**
   * 데이터 프로바이더를 등록합니다.
   * @param body - { providerNm: 데이터 프로바이더명, providerId: 데이터 프로바이더 고유코드, providerExpn: 데이터프로바이더 설명, isUsed: 사용상태 }
   */
  async registerProvider(body: IProviderRegisterRequest): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.post('/admin/provider-management/provider', body)

    return response.data
  },
  /**
   * 데이터 프로바이더 상세 정보를 조회합니다.
   * @param providerNo - 데이터 프로바이더 번호
   */
  async getProviderDetail(providerNo?: number | string): Promise<IProviderDetailInfo> {
    if (!providerNo) throw new Error('providerNo is required')

    const response: AxiosResponse<ICommonResponse<IProviderDetailInfo>> = await api.get(
      `/admin/provider-management/providers/${providerNo}`,
    )

    return response.data.data
  },
  /**
   * 해당 상품을 구독하고 있는 회사 목록과 매핑된 권한 내역을 조회합니다.
   * 페이지네이션 처리되어 'companyNm' 필드를 기준으로 오름차순(ASC) 정렬됩니다.
   * @param providerNo - 데이터 프로바이더 번호
   * @param goodsNo - 상품 번호
   */
  async getProductCompanyPermissionList(
    providerNo?: number | string,
    goodsNo?: number | string,
    params?: IProductCompanyPermissionRequest,
  ): Promise<IPaginationResponse<IProductCompanyPermissionInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IProductCompanyPermissionInfo>>> = await api.get(
      `/admin/provider-management/providers/${providerNo}/goods/${goodsNo}/company-permissions`,
      { params },
    )

    return response.data.data
  },
  /**
   * 데이터 프로바이더 기본정보를 수정합니다.
   * @param providerNo - 데이터 프로바이더 번호
   * @param body - { providerNm: 데이터 프로바이더명, providerExpn: 데이터프로바이더 설명, isUsed: 사용상태 true }
   */
  async updateProvider(providerNo: number, body: IUpdateProviderRequest): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.patch(`/admin/provider-management/providers/${providerNo}`, {
      ...body,
    })

    return response.data
  },

  /**
   * 정형 데이타 타입 목록을 조회합니다.
   */
  async getStructuredDataType(): Promise<IStructuredDataTypeInfo[]> {
    const response = await api.get('/admin/provider-management/goods-data/structured-data-type')
    return response.data.data
  },

  /**
   * 문서 타입 카테고리를 조회합니다.
   */
  async getProviderDocumentType(): Promise<IProviderDocumentTypeInfo[]> {
    const response = await api.get('/admin/provider-management/goods-data/category/doc')
    return response.data.data
  },

  /**
   * 언어 타입 카테고리를 조회합니다.
   */
  async getProviderLanguageType(): Promise<IProviderLanguageTypeInfo[]> {
    const response = await api.get('/admin/provider-management/goods-data/category/lang')
    return response.data.data
  },

  /**
   * 데이터 프로바이더 데이터 신규등록
   */
  async postGoodsData(providerNo: number, goodsNo: number, body: IProviderGoodsDataRegisterRequest): Promise<IStructuredDataTypeInfo[]> {
    const response = await api.post(`/admin/provider-management/providers/${providerNo}/goods/${goodsNo}/goods-data`, body)
    return response.data.data
  },
}

export default dataProviderService
