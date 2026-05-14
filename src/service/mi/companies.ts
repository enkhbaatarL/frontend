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

// DELETE: API에서 FUNDAMENTAL_MODEL 제공 시 삭제
const FUNDAMENTAL_MODEL_MENU_ITEM: IMenuNode = {
  screenElementCd: 'FUNDAMENTAL_MODEL',
  typeCd: 'MENU_ITEM',
  children: [],
}

// DELETE: API에서 FUNDAMENTAL_MODEL 제공 시 삭제
/** `AI_FORECAST`에 `FUNDAMENTAL_MODEL` ITEM 없으면 끝에 한 줄 붙임 */
const patchMenusEnsureFundamentalModel = (menus: IMenuNode[] | undefined): IMenuNode[] | undefined => {
  if (!menus?.length) return menus
  return menus.map((top) => {
    if (top.typeCd !== 'MENU_TOP' || top.screenElementCd !== 'AI_FORECAST') return top
    const ch = top.children ?? []
    if (ch.some((c) => c.typeCd === 'MENU_ITEM' && c.screenElementCd === 'FUNDAMENTAL_MODEL')) return top
    return { ...top, children: [...ch, FUNDAMENTAL_MODEL_MENU_ITEM] }
  })
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

    const data = response.data.data
    // DELETE: API에서 FUNDAMENTAL_MODEL 제공 시 삭제
    // return response.data.data
    return { ...data, menus: patchMenusEnsureFundamentalModel(data.menus) }
  },
}

export default companiesService
