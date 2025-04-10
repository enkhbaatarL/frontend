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
  async getCompanies(params: ICompaniesRequest): Promise<IPaginationResponse<ICompanyInfo>> {
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
}

export default companiesService
