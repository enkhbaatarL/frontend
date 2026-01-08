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
  refinitivPresentationRegion: string
  refinitivPriority: number
  refinitivType: string
  status: string
  countryNameCode: string
  countryCurrencyCode: string
}

const economicService = {
  async getEconomicCalendar(params: IGetEconomicCalendarRequest): Promise<IPaginationResponse<IEconomicCalendarItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IEconomicCalendarItem>>> = await api.get('mi/econ-cal', {
      params,
    })

    return response.data.data
  },
}

export default economicService
