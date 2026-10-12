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

// [MCP 인증] backend mcp-auth API 응답 (Swagger McpAuthInfoRes / McpAuthIssueRes / McpAuthExistsRes)
export interface IMcpAuthInfo {
  mcpAuthRegNo: number
  mcpAuthId: string
  secretPrefix: string
  customerCompanyNo: number
  customerCompanyCd: string
  customerCompanyNm: string
  isOwnerCompany: boolean
  auditInfo: IAuditInfo
}

export interface IMcpAuthIssue {
  mcpAuthInfo: IMcpAuthInfo
  secret: string
}

export interface IMcpAuthExists {
  exists: boolean
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
  // [MCP 인증] mcp-auth API 5종 (목록·중복확인·등록·재발행·삭제)
  /**
   * MCP 인증 키 목록을 조회합니다.
   */
  async getMcpAuthList(params: Partial<IPaginationRequest>): Promise<IPaginationResponse<IMcpAuthInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IMcpAuthInfo>>> = await api.get('/admin/system-management/mcp-auth', {
      params,
    })

    return response.data.data
  },
  /**
   * MCP 인증 ID 사용 여부를 확인합니다.
   * @param mcpAuthId - 확인할 MCP 인증 ID
   */
  async existsMcpAuthId(mcpAuthId: string): Promise<ICommonResponse<IMcpAuthExists>> {
    const response: AxiosResponse<ICommonResponse<IMcpAuthExists>> = await api.get('/admin/system-management/mcp-auth/exists', {
      params: { mcpAuthId },
    })

    return response.data
  },
  /**
   * MCP 인증 키를 등록합니다. 평문 시크릿은 이 응답에서만 제공됩니다.
   * @param body - { customerCompanyNo: 고객회사 번호, mcpAuthId: MCP 인증 ID }
   */
  async createMcpAuth(body: { customerCompanyNo: number; mcpAuthId: string }): Promise<ICommonResponse<IMcpAuthIssue>> {
    const response: AxiosResponse<ICommonResponse<IMcpAuthIssue>> = await api.post('/admin/system-management/mcp-auth', body)

    return response.data
  },
  /**
   * MCP 인증 시크릿을 재발급합니다. 평문 시크릿은 이 응답에서만 제공됩니다.
   * @param mcpAuthRegNo - MCP 인증 등록 번호
   */
  async reissueMcpAuthSecret(mcpAuthRegNo: number): Promise<ICommonResponse<IMcpAuthIssue>> {
    const response: AxiosResponse<ICommonResponse<IMcpAuthIssue>> = await api.patch(`/admin/system-management/mcp-auth/${mcpAuthRegNo}`)

    return response.data
  },
  /**
   * MCP 인증 키를 삭제합니다.
   * @param mcpAuthRegNo - MCP 인증 등록 번호
   */
  async deleteMcpAuth(mcpAuthRegNo: number): Promise<ICommonResponse<IMcpAuthInfo>> {
    const response: AxiosResponse<ICommonResponse<IMcpAuthInfo>> = await api.delete(`/admin/system-management/mcp-auth/${mcpAuthRegNo}`)

    return response.data
  },
}

export default systemService
