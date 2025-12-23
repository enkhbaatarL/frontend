import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

export interface IAccessCompanyInfo {
  customerCompanyNo: number
  customerCompanyNm: string
  customerCompanyCd: string
  customerCompanyMipUrl: string
  isQualitative?: boolean
  isMari?: boolean
  isFuture?: boolean
  isNewsletter?: boolean
  isSalesAnalysis?: boolean
  isMarketMap?: boolean
  isMiActivityLog?: boolean
  isSalesActivityLog?: boolean
  newsMarketCategoryCode?: string
}

const companiesService = {
  async getAllCompanies(): Promise<IAccessCompanyInfo[]> {
    const response: AxiosResponse<ICommonResponse<IAccessCompanyInfo[]>> = await api.get('mi/company-management/companies/all')

    return response.data.data
  },
  async getCompanyDetail(companyNo: number): Promise<IAccessCompanyInfo> {
    const response: AxiosResponse<ICommonResponse<IAccessCompanyInfo>> = await api.get(
      `mi/company-management/companies/${companyNo}/detail`,
    )

    return response.data.data
  },
}

export default companiesService
