import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

interface ICompanyInfo {
  customerCompanyNo: number
  customerCompanyNm: string
  customerCompanyCd: string
  customerCompanyMipUrl: string
}

const companiesService = {
  async getAllCompanies(): Promise<ICompanyInfo[]> {
    const response: AxiosResponse<ICommonResponse<ICompanyInfo[]>> = await api.get('mi/company-management/companies/all')

    return response.data.data
  },
}

export default companiesService
