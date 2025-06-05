import { IAdvancedFilterItem } from './insights'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

interface MapCategory {
  categoryName: string
  items: {
    categoryName: string
    items: {
      instrumentNm: string
      correlationCalculationVal: number
    }[]
  }[]
}

export interface MapRootData {
  title: string
  updatedDt: string
  list: MapCategory[]
}

const signalMapService = {
  /**
   * 시그널맵 기간 필터를 조회합니다.
   * @param companyNo - {companyNo: 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호}
   */
  async getPeriodsFilters(companyNo: number): Promise<ICommonResponse<IAdvancedFilterItem[]>> {
    const response = await api.get(`/mi/signal-map/companies/${companyNo}/periods`)

    return response.data
  },
  /**
   * 시그널맵 회사 필터를 조회합니다.
   * @param companyNo - {companyNo: 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호}
   */ async getCompanyFilters(companyNo: number): Promise<ICommonResponse<string[]>> {
    const response = await api.get(`/mi/signal-map/companies/${companyNo}/filters`)

    return response.data
  },
  /**
   * 시그널맵 데이터를 조회합니다.
   * @param companyNo - {companyNo: 관리자: 선택 된 고객사 번호, 사용자: 자신이 속한 고객사 번호}
   */
  async getSignalMapData(companyNo: number, params: Partial<{ period?: string; filter?: string }>): Promise<ICommonResponse<MapRootData>> {
    const response = await api.get(`/mi/signal-map/companies/${companyNo}`, {
      params,
    })

    return response.data
  },
}

export default signalMapService
