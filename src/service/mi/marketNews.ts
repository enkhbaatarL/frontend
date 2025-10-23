import { AxiosResponse } from 'axios'

import api from '@/lib/axios.ts'
import { ICommonResponse } from '@/types/api'

export interface INewsSummaryData {
  newsSummaryId: number
  dataRegistrationSn: number
  firstCreated: string
  title: string
  story: string
  provider: string
}

const marketNewsService = {
  async getNewsSummaryData(newsSummaryId: string): Promise<INewsSummaryData> {
    const response: AxiosResponse<ICommonResponse<INewsSummaryData>> = await api.get(`mi/market-news/${newsSummaryId}`)

    return response.data.data
  },
}

export default marketNewsService
