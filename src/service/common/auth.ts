import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { IUserDetail } from '@/store/useAuthStore'
import { ICommonResponse } from '@/types/api'

export interface IIndividualInfoAgreementRequest {
  isIndividualInfoAgreement: boolean
}

type IndividualInfoAgreementUser = Pick<
  IUserDetail,
  | 'userNo'
  | 'userNm'
  | 'userLoginId'
  | 'userRoleCd'
  | 'userRoleNm'
  | 'positionNm'
  | 'jobGradeNm'
  | 'onDutyNm'
  | 'departmentNm'
  | 'isOtherServiceAccessPossible'
  | 'isIndividualInfoAgreement'
  | 'companyNo'
  | 'companyNm'
>

const authService = {
  async getUserDetail(token: string): Promise<IUserDetail> {
    const response: AxiosResponse<ICommonResponse<IUserDetail>> = await api.get('common/user-detail', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data.data
  },

  async updateIndividualInfoAgreement(body: IIndividualInfoAgreementRequest): Promise<ICommonResponse<IndividualInfoAgreementUser>> {
    const response: AxiosResponse<ICommonResponse<IndividualInfoAgreementUser>> = await api.patch('common/individual-info-agreement', body)

    return response.data
  },

  async postTokenReissue(token: string): Promise<{ accessToken: string }> {
    const response = await api.post('auth/token-generation', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    })

    return response.data.data
  },

  async postLogin(body: { loginUserId: string }): Promise<{ accessToken: string }> {
    const response = await api.post('test/login/user', body)

    return response.data.data
  },

  async getAdminAccessCheck(token: string): Promise<string> {
    const response: AxiosResponse<ICommonResponse<string>> = await api.get('common/admin-access-check', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data.data
  },

  async postExternalLogin(body: { loginId: string; password: string }): Promise<{ sessionId: string }> {
    const response = await api.post('/external/login', body)
    return response.data.data
  },
}

export default authService
