import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

export interface IProviderInfo {
  providerNo: number
  providerNm: string
  isUsed: boolean
}

const dataProviderService = {
  async getProviders(): Promise<IProviderInfo> {
    const response: AxiosResponse<ICommonResponse<IProviderInfo>> = await api.get('/admin/provider-manangement/provider/name')

    return response.data.data
  },
}

export default dataProviderService
