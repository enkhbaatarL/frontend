import { AxiosResponse } from 'axios'

import { sampleCompaniesAdapter } from '@/adapter/sampleAdapter'
import api from '@/lib/axios'
import { ICommonResponse, ISampleCompaniesResData, ISamplePagination } from '@/types/sample'

const sampleService = {
  async getSampleCompanies (size: string): Promise<ISampleCompaniesResData[]> {
    const response: AxiosResponse<ICommonResponse<ISamplePagination<ISampleCompaniesResData>>> = await api.post('/companies', {
      size: Number(size),
    })

    return sampleCompaniesAdapter.convert(response.data.data.detail)
  },
}

export default sampleService
