import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { IUserDetail } from '@/store/useAuthStore'
import { ICommonResponse } from '@/types/api'

const authService = {
  async getUserDetail(token: string): Promise<IUserDetail> {
    const response: AxiosResponse<ICommonResponse<IUserDetail>> = await api.get('common/user-detail', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data.data
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async postTokenReissue(token: string): Promise<any> {
    const response: AxiosResponse<ICommonResponse<IUserDetail>> = await api.post('auth/token-generation', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    })

    return response.data.data
  },
}

export default authService
