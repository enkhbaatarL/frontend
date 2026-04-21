import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

export type MenuTypeCd = 'MENU_TOP' | 'MENU_ITEM' | 'MENU_GROUP' | 'FLOATING'

export interface IMenuNode {
  screenElementCd: string
  typeCd: MenuTypeCd
  children?: IMenuNode[]
}

export interface IAccessCompanyInfo {
  customerCompanyNo: number
  customerCompanyNm: string
  customerCompanyCd: string
  customerCompanyMipUrl: string
  newsMarketCategoryCode?: string
  defaultLandingCd?: string
  menus?: IMenuNode[]
  floating?: IMenuNode[]
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
