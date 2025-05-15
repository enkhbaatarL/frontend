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
}

export default authService
