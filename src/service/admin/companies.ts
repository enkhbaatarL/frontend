import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export interface ICompaniesRequest extends IPaginationRequest {
  companyNm?: string
  activationSts?: string
}

export interface ICompanyInfo {
  companyNo: number
  companyCd: string
  companyNm: string
  usageBeginDate: string
  usageEndDate: string
  createUserId: string
  createDt: string
  modifyUserId: string
  modifyDt: string
  auditInfo: string
}

interface IGroupCompanyInfo {
  companyCd: string
  companyNm: string
  companyEngNm: string
}

interface IRegisterCompanyRequest {
  companyCd: string
  companyNm: string
  usageBeginDate: string
  usageEndDate: string
}

interface IDepartmentInfo {
  companyNo: number
  companyCd: string
  companyNm: string
  departmentNm: string[]
}
interface IAuditInfo {
  createDt: string
  createUserId: string
  modifyDt: string
  modifyUserId: string
  createUserNm: string
  createUserDeptNm: string
  createUserCpnyNm: string
  modifyUserNm: string
  modifyUserDeptNm: string
  modifyUserCpnyNm: string
}

interface ICompanyDetailInfo {
  companyCd: string
  companyNm: string
  companyNo: number
  isActivated: boolean
  usageBeginDate: string
  usageEndDate: string
  auditInfo: IAuditInfo
}

export interface ICompanyProviderInfo {
  providerNo: number
  providerNm: string
  numberOfGoods: number
  auditInfo: IAuditInfo
}

export interface ICompanyProviderDetailInfo {
  providerNo: number
  providerNm: string
  companyNo: number
  companyNm: string
  isUsed: boolean
  auditInfo: IAuditInfo
}

export interface ICompanyLatestUpdatedInfo {
  modifyUserId: string
  modifyUserNm: string
  modifyDt: string
}

export interface IProviderGoodsInfo {
  goodsNo: number
  goodsNm: string
  goodsExpn: string
  numberOfData: number
  isUsed: boolean
  goodsAuthManagementSeparateCd: string
  goodsAuthManagementSeparateNm: string
  auditInfo: IAuditInfo
}

export interface IProviderGoodsRequest extends IPaginationRequest {
  search?: string
}

export interface IChangeUsageRequest {
  isUsed: boolean
}

/**
 * 고객사 서비스
 */
const companiesService = {
  /**
   * 고객사 목록을 조회합니다.
   * 페이지네이션 처리되어 'companyNm' 필드를 기준으로 오름차순(ASC) 정렬됩니다.
   * @param params - { companyNm: 검색할 고객사 명, page: 페이지 번호, size: 페이지당 항목 수  }
   * @returns 고객사 목록
   */
  async getCompanies(params: Partial<ICompaniesRequest>): Promise<IPaginationResponse<ICompanyInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<ICompanyInfo>>> = await api.get(
      '/admin/company-management/companies',
      { params },
    )

    return response.data.data
  },
  /**
   * 그룹사 목록을 조회합니다.
   * @returns 그룹사 목록
   */
  async getGroupCompanies(): Promise<IGroupCompanyInfo[]> {
    const response: AxiosResponse<ICommonResponse<IGroupCompanyInfo[]>> = await api.get('/admin/company-management/group-companies')

    return response.data.data
  },
  /**
   * 고객사를 등록합니다.
   * @param body - { companyCd: 고객사 코드, companyNm: 고객사 명, usageBeginDate: 사용 시작일, usageEndDate: 사용 종료일 }
   */
  async registerCompany(body: IRegisterCompanyRequest): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.post('/admin/company-management/company', body)

    return response.data
  },
  /**
   * 드랍다운 메뉴 필터에 쓰일 테이블 고객사, 부서 목록을 조회합니다.
   * @returns 테이블 고객사, 부서 목록
   */
  async getDepartmentAll(): Promise<IDepartmentInfo[]> {
    const response: AxiosResponse<ICommonResponse<IDepartmentInfo[]>> = await api.get('/admin/company-management/company/department/all')

    return response.data.data
  },
  /**
   * 고객사 상세 정보를 조회합니다.
   * @param companyNo - 고객회사 번호
   */
  async getCompanyDetail(companyNo?: number): Promise<ICompanyDetailInfo> {
    const response: AxiosResponse<ICommonResponse<ICompanyDetailInfo>> = await api.get(`admin/company-management/companies/${companyNo}`)

    return response.data.data
  },
  /**
   * 고객사와 매핑된 프로바이더 목록을 조회합니다.
   * @param companyNo - 고객회사 번호
   */
  async getCompanyProviders(companyNo?: number): Promise<ICompanyProviderInfo> {
    const response: AxiosResponse<ICommonResponse<ICompanyProviderInfo>> = await api.get(
      `admin/company-management/companies/${companyNo}/providers`,
    )

    return response.data.data
  },
  /**
   * 고객사와 매핑되어 있는 프로바이더를 상세 조회합니다.
   * @param companyNo - 고객회사 번호
   * @param providerNo - 프로바이더 번호
   */
  async getCompanyProviderDetail(companyNo?: number, providerNo?: number): Promise<ICompanyProviderDetailInfo> {
    const response: AxiosResponse<ICommonResponse<ICompanyProviderDetailInfo>> = await api.get(
      `admin/company-management/companies/${companyNo}/providers/${providerNo}`,
    )

    return response.data.data
  },
  /**
   * 고객사 상세 화면에서 고객사 정보, 프로바이더 정보, 회원 정보를 포함하여 최신 수정 데이터를 조회합니다.
   * @param companyNo - 고객회사 번호
   */
  async getCompanyLatestUpdated(companyNo?: number): Promise<ICompanyLatestUpdatedInfo> {
    const response: AxiosResponse<ICommonResponse<ICompanyLatestUpdatedInfo>> = await api.get(
      `admin/company-management/companies/${companyNo}/latest-updated`,
    )

    return response.data.data
  },
  /**
   * 고객사-프로바이더 상세 화면에서 프로바이더 정보, 상품 정보를 포함하여 최신 수정 데이터를 조회합니다.
   * @param companyNo - 고객회사 번호
   * @param providerNo - 프로바이더 번호
   */
  async getProviderLatestUpdated(companyNo?: number, providerNo?: number): Promise<ICompanyLatestUpdatedInfo> {
    const response: AxiosResponse<ICommonResponse<ICompanyLatestUpdatedInfo>> = await api.get(
      `admin/company-management/companies/${companyNo}/providers/${providerNo}/latest-updated`,
    )

    return response.data.data
  },
  /**
   * 고객사와 매핑되어있는 프로바이더의 상품 내역 중에 고객사가 등록한 상품 목록을 조회합니다.
   * 'goodsNm' 필드를 기준으로 오름차순(ASC) 정렬됩니다.
   * @param companyNo - 고객회사 번호
   * @param providerNo - 프로바이더 번호
   */
  async getProviderGoods(
    companyNo?: number,
    providerNo?: number,
    params?: Partial<IProviderGoodsRequest>,
  ): Promise<IPaginationResponse<IProviderGoodsInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IProviderGoodsInfo>>> = await api.get(
      `admin/company-management/companies/${companyNo}/providers/${providerNo}/goods`,
      { params },
    )

    return response.data.data
  },
  /**
   * 고객사와 프로바이더 매핑을 수정합니다.
   * @param companyNo - 고객회사 번호
   * @param providerNo - 프로바이더 번호
   * @param body - { isUsed: 사용여부 }
   */
  async changeUsage(companyNo: number, providerNo: number, body: IChangeUsageRequest): Promise<ICompanyProviderDetailInfo> {
    const response: AxiosResponse<ICommonResponse<ICompanyProviderDetailInfo>> = await api.patch(
      `admin/company-management/companies/${companyNo}/providers/${providerNo}`,
      {
        ...body,
      },
    )

    return response.data.data
  },
}

export default companiesService
