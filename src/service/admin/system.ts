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

const systemService = {
  /**
   * API Key 목록을 조회합니다.
   */
  async getApiKeyList(params: Partial<IPaginationRequest>): Promise<IPaginationResponse<IApiKeyInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IApiKeyInfo>>> = await api.get(
      '/admin/system-management/client-access',
      { params },
    )

    return response.data.data
  },
  /**
   * 클라이언트 Secret-Key를 재발급합니다.
   * @param clientAccessRegNo - 클라이언트 접근 번호
   */
  async reissueClientSecretKey(clientAccessRegNo: number): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.patch(`/admin/system-management/client-access/${clientAccessRegNo}`)

    return response.data
  },
  /**
   * 복호화된 클라이언트 Secret-Key를 조회합니다.
   * @param clientAccessRegNo - 클라이언트 접근 번호
   */
  async getDecryptedClientSecretKey(clientAccessRegNo: number): Promise<ICommonResponse<IDecryptedClientSecretKey>> {
    const response: AxiosResponse<ICommonResponse<IDecryptedClientSecretKey>> = await api.get(
      `/admin/system-management/client-access/client-access/${clientAccessRegNo}/reveal-secret`,
    )

    return response.data
  },
  /**
   * 클라이언트 접속 정보를 등록합니다.
   * @param body - { customerCompanyNo: 고객회사 번호, clientCertId: 클라이언트 인증 ID }
   */
  async createClientAccess(body: { customerCompanyNo: number; clientCertId: string }): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.post('/admin/system-management/client-access', body)

    return response.data
  },
  /**
   * API Key를 삭제합니다.
   * @param clientAccessRegNo - 클라이언트 접속 등록 번호
   */
  async deleteClientAccess(clientAccessRegNo: number): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.delete(`/admin/system-management/client-access/${clientAccessRegNo}`)

    return response.data
  },
}

export default systemService
