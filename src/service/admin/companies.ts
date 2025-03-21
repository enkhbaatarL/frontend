import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

interface ICompaniesRequest extends IPaginationRequest {
  companyNm?: string
  status?: string
}

interface ICompanyInfo {
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

enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface IUserRequest extends IPaginationRequest {
  userRoleCd: UserRole.USER
  companyNo?: number | string
  departmentNm?: string
  userNm?: string
  emailAddress?: string
}

export interface CustomerCompanyNo {
  createDt: string
  modifyDt: string
  createUserId: string
  modifyUserId: string
  isDeleted: boolean
  customerCompanyNo: number
  customerCompanyNm: string
  customerCompanyCd: string
  useBeginDt: string
  useEndDt: string
  isUsed: boolean
}

export interface CreatorCompanyNo {
  createDt: string
  modifyDt: string
  createUserId: string
  modifyUserId: string
  isDeleted: boolean
  customerCompanyNo: number
  customerCompanyNm: string
  customerCompanyCd: string
  useBeginDt: string
  useEndDt: string
  isUsed: boolean
}

export interface IUserInfo {
  userNo: number
  userNm: string
  userLoginId: string
  userRoleCd: string
  onDutyNm: string
  departmentNm: string
  isOtherServiceAccessPossible: boolean
  isIndividualInfoAgreement: boolean
  individualInfoAgreementDtm: string
  customerCompanyNo: CustomerCompanyNo
  customerCompanyNm: string
  creatorUserNm: string
  creatorDepartmentNm: string
  creatorOnDutyNm: string
  creatorCompanyNo: CreatorCompanyNo
  creatorCompanyNm: string
  createUserId: string
  createDt: string
  modifyUserId: string
  modifyDt: string
  auditInfo: string
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
  async getCompanies (params: ICompaniesRequest): Promise<IPaginationResponse<ICompanyInfo>> {
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
  async getGroupCompanies (): Promise<IGroupCompanyInfo[]> {
    const response: AxiosResponse<ICommonResponse<IGroupCompanyInfo[]>> = await api.get('/admin/company-management/group-companies')

    return response.data.data
  },
  /**
   * 고객사를 등록합니다.
   * @param body - { companyCd: 고객사 코드, companyNm: 고객사 명, usageBeginDate: 사용 시작일, usageEndDate: 사용 종료일 }
   */
  async registerCompany (body: IRegisterCompanyRequest): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.post('/admin/company-management/company', body)

    return response.data
  },
  /**
   * 드랍다운 메뉴 필터에 쓰일 테이블 고객사, 부서 목록을 조회합니다.
   * @returns 테이블 고객사, 부서 목록
   */
  async getDepartmentAll (): Promise<IDepartmentInfo[]> {
    const response: AxiosResponse<ICommonResponse<IDepartmentInfo[]>> = await api.get('/admin/company-management/company/department/all')

    return response.data.data
  },
  /**
   * 사용자 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, companyCode: 회사 코드, departmentNm: 부서 명, userName: 사용자 명, emailAddress: 이메일 주소 }
   */
  async getUsers (params: Partial<Omit<IUserRequest, 'userRoleCd'>>): Promise<IPaginationResponse<IUserInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IUserInfo>>> = await api.get('admin/user-management/users', {
      params: {
        ...params,
        userRoleCd: UserRole.USER,
      },
    })

    return response.data.data
  },
}

export default companiesService
