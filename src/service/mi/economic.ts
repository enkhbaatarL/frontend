import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export enum EconomicCalendarDateRange {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  TOMORROW = 'TOMORROW',
  THISWEEK = 'THISWEEK',
  NEXTWEEK = 'NEXTWEEK',
}

interface IGetEconomicCalendarRequest extends IPaginationRequest {
  dateRange: EconomicCalendarDateRange
  keyword?: string
  categories?: string
  importance?: '3' | '2' | '1'
}

export interface IEconomicCalendarItem {
  economicCalendarId: number
  code: string
  date: string
  economicIndicatorName: string
  economicIndicatorPresentationDay: string
  economicIndicatorPresentationTime: string
  economicIndicatorRealValue: number | null
  economicIndicatorPredictionDay: string
  economicIndicatorPresentationPriorValue: number | null
  economicIndicatorPredictionValue: number | null
  unitPrefix: string | null
  unit: string | null
  nextEconomicIndicatorPresentationDay?: string
  refinitivName?: string
  refinitivPresentationRegion: string
  refinitivExplanation?: string
  refinitivSourceOrganization?: string
  refinitivType: string
  refinitivUnit?: string
  refinitivPresentationCycle?: string
  refinitivIsUsed?: boolean
  refinitivPriority: number
  refinitivPresentationDatetime?: string
  status: string
  countryNameCode: string
  countryCurrencyCode: string
}

export interface IRecentViewedItem {
  code: string
  economicIndicatorName: string
  inquiryDateTime: string
  refinitivSourceOrganization: string
}

const economicService = {
  async getEconomicCalendar(params: IGetEconomicCalendarRequest): Promise<IPaginationResponse<IEconomicCalendarItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IEconomicCalendarItem>>> = await api.get('mi/econ-cal', {
      params,
    })

    return response.data.data
  },
  async getEconomicCalenderDetail(code: string): Promise<IEconomicCalendarItem> {
    const response: AxiosResponse<ICommonResponse<IEconomicCalendarItem>> = await api.get(`mi/econ-cal/${code}`)

    return response.data.data
  },
  async getEconomicCalenderDetailHistory(code: string): Promise<IPaginationResponse<IEconomicCalendarItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IEconomicCalendarItem>>> = await api.get(
      `mi/econ-cal/${code}/history`,
    )

    return response.data.data
  },
  async getRecentViewed(): Promise<IRecentViewedItem[]> {
    const response: AxiosResponse<ICommonResponse<IRecentViewedItem[]>> = await api.get('mi/econ-cal/recent-viewed')

    return response.data.data
  },
  async clearRecentViewed(): Promise<void> {
    await api.delete('mi/econ-cal/recent-viewed')
  },
}

export default economicService
