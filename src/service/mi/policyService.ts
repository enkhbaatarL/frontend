import api from '@/lib/axios'

interface AuditInfo {
  createUserId: string
  createDt: string
  modifyUserId: string
  modifyDt: string
  createUserNm: string
  createUserDeptNm: string
  createUserCpnyNm: string
  modifyUserNm: string
  modifyUserDeptNm: string
  modifyUserCpnyNm: string
}

interface PolicyInfo {
  poltacNo: number
  poltacVerNm: string
  auditInfo: AuditInfo
}

interface PolicyInfoDetail extends PolicyInfo {
  poltacEnforcementDt: string
  poltacCntt: string
}

/**
 * 개인정보 처리방침 서비스
 */
const policyService = {
  /**
   * 개인정보 처리방침 목록 조회 API
   */
  async getPrivacyPolicies(): Promise<PolicyInfo[]> {
    const response = await api.get('mi/policy-tactics/privacy-policies')
    return response.data.data
  },

  /**
   * 개인정보 처리방침 상세 조회 API
   */
  async getPrivacyPolicyDetail(policyNo: number | 'latest'): Promise<PolicyInfoDetail> {
    const response = await api.get(`mi/policy-tactics/privacy-policies/${policyNo}`)
    return response.data.data
  },
}

export default policyService
