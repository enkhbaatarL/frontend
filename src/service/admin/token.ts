import { AxiosResponse } from 'axios'

import { IAuditInfo } from './members'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export interface IApiKeyInfo {
  clientAccessRegNo: number
  clientCertId: string
  clientSecretKey: string
  customerCompanyNo: number
  customerCompanyCd: string
  customerCompanyNm: string
  certTypeNm: string
  certMethodNm: string
  auditInfo: IAuditInfo
  isOwnerCompany: boolean
}

export interface IDecryptedClientSecretKey {
  clientSecretKey: string
}

const tokenService = {
  /**
   * API Key 목록을 조회합니다. api생성완료시 교체 예정
   */
  async getApiKeyList(params: Partial<IPaginationRequest>): Promise<IPaginationResponse<IApiKeyInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IApiKeyInfo>>> = await api.get(
      '/admin/system-management/client-access',
      { params },
    )

    return response.data.data
  },
}

export default tokenService
