import { AxiosResponse } from 'axios'

import api from '@/lib/axios.ts'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api.ts'

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
}

export default companiesService
