import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
}

export interface IUserRequest extends IPaginationRequest {
  userRoleCd: UserRole.USER
  companyNo?: number | string
  departmentNm?: string
  userNm?: string
  emailAddress?: string
}

export interface IAdminUserRequest extends IPaginationRequest {
  userRoleCd?: Omit<UserRole, 'USER'>
  companyNo?: number | string
  departmentNm?: string
  userNm?: string
  emailAddress?: string
}

export interface IGroupUserRequest extends IPaginationRequest {
  userRoleCd: UserRole.USER
  companyCd?: number | string
  userNm?: string
  emailAddress?: string
}

export interface CustomerCompanyNo {
  createDt: string
  modifyDt: string
  createUserId: string
  modifyUserId: string
  isDeleted: boolean
  customerCompanyNo: number
  customerCompanyNm: string
  customerCompanyCd: string
  useBeginDt: string
  useEndDt: string
  isUsed: boolean
}

export interface CreatorCompanyNo {
  createDt: string
  modifyDt: string
  createUserId: string
  modifyUserId: string
  isDeleted: boolean
  customerCompanyNo: number
  customerCompanyNm: string
  customerCompanyCd: string
  useBeginDt: string
  useEndDt: string
  isUsed: boolean
}

export interface IUserInfo {
  userNo: number
  userNm: string
  userLoginId: string
  userRoleCd: string
  onDutyNm: string
  departmentNm: string
  isOtherServiceAccessPossible: boolean
  isIndividualInfoAgreement: boolean
  individualInfoAgreementDtm: string
  customerCompanyNo: CustomerCompanyNo
  customerCompanyNm: string
  creatorUserNm: string
  creatorDepartmentNm: string
  creatorOnDutyNm: string
  creatorCompanyNo: CreatorCompanyNo
  creatorCompanyNm: string
  createUserId: string
  createDt: string
  modifyUserId: string
  modifyDt: string
  auditInfo: string
}

export interface IAuditInfo {
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

export interface IAdminUserInfo {
  userNo: number
  userNm: string
  userLoginId: string
  userRoleCd: string
  positionNm: string
  jobGradeNm: string
  onDutyNm: string
  departmentNm: string
  isOtherServiceAccessPossible: boolean
  isIndividualInfoAgreement: boolean
  individualInfoAgreementDtm: string
  customerCompanyNo: number
  customerCompanyNm: string
  auditInfo: IAuditInfo
}

export interface IMangerDetailInfo {
  userNo: number
  userNm: string
  userLoginId: string
  userRoleCd: UserRole
  onDutyNm: string
  departmentNm: string
  isOtherServiceAccessPossible: boolean
  isIndividualInfoAgreement: boolean
  individualInfoAgreementDtm: string
  customerCompanyNo: number
  customerCompanyNm: string
  auditInfo: IAuditInfo
  accessAllowedIpAddress: string[]
}

export interface IMangerRegisterRequest {
  imCd: string
  userRoleCd: UserRole
  isOtherServiceAccessPossible?: boolean
  accessAllowedIpAddress: string[]
}

export interface IMangerInfoEditRequest {
  userRoleCd: UserRole
  isOtherServiceAccessPossible: boolean
  accessAllowedIpAddress: string[]
}

export interface IGroupUserInfo {
  imCd: string
  userNm: string
  userEnglishNm: string
  loginId: string
  emailAddress: string
  companyCd: string
  companyNm: string
  employeeNo: string
  departmentCd: string
  departmentNm: string
  positionCd: string
  positionNm: string
  jobGradeCd: string
  jobGradeNm: string
  onDutyCd: string
  onDutyNm: string
  isRegistered: boolean
}

export interface IRegisterUserRequest {
  imCd: string[]
}

export interface IRegisterAdminUserInfo {
  imCd: string
  isOtherServiceAccessPossible: boolean
  accessAllowedIpAddress: string[]
  userRoleCd: UserRole
}

/**
 * 사용자 관리 서비스
 */
const membersService = {
  /**
   * 사용자 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, companyNo: 회사 번호, departmentNm: 부서 명, userNm: 사용자 명, emailAddress: 이메일 주소 }
   */
  async getUsers(params: Partial<Omit<IUserRequest, 'userRoleCd'>>): Promise<IPaginationResponse<IUserInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IUserInfo>>> = await api.get('admin/user-management/users', {
      params: {
        ...params,
        userRoleCd: UserRole.USER,
      },
    })

    return response.data.data
  },
  /**
   * 관리자 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, companyNo: 회사 번호, departmentNm: 부서 명, userNm: 사용자 명, emailAddress: 이메일 주소 }
   */
  async getManagers(params: Partial<IAdminUserRequest>): Promise<IPaginationResponse<IAdminUserInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IAdminUserInfo>>> = await api.get(
      'admin/user-management/admin-users',
      { params },
    )

    return response.data.data
  },
  /**
   * 관리자 상세 정보를 조회합니다.
   * @param userNo - 사용자 번호
   */
  async getManagerDetail(userNo?: string): Promise<IMangerDetailInfo> {
    if (!userNo) throw new Error('userNo is required')

    const response: AxiosResponse<ICommonResponse<IMangerDetailInfo>> = await api.get(`admin/user-management/admin-users/${userNo}`)

    return response.data.data
  },
  /**
   * 관리자를 등록합니다.
   * @param body - { imCd: IM코드, isOtherServiceAccessPossible: 다른 서비스 접근 가능 여부, accessAllowedIpAddress: 접근 가능 IP 주소 목록, userRoleCd: 사용자 역할 코드 }
   */
  async registerManager(body: IMangerRegisterRequest): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.post('/admin/user-management/admin-user', body)

    return response.data
  },
  /**
   * 관리자 상세 정보를 수정합니다.
   * @param userNo - 사용자 번호
   * @param body - { isOtherServiceAccessPossible: 다른 서비스 접근 가능 여부, accessAllowedIpAddress: 접근 가능 IP 주소 목록 }
   */
  async updateManagerDetail(userNo: string | undefined, body: IMangerInfoEditRequest): Promise<void> {
    if (!userNo) throw new Error('userNo is required')

    await api.patch(`admin/user-management/admin-users/${userNo}`, body)
  },
  /**
   * 그룹사 사용자 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, companyCd: 회사 코드, userNm: 사용자 명, emailAddress: 이메일 주소 }
   */
  async getGroupUsers(params: Partial<IGroupUserRequest>): Promise<IPaginationResponse<IGroupUserInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IGroupUserInfo>>> = await api.get(
      'admin/user-management/group-users',
      { params },
    )

    return response.data.data
  },
  /**
   * 사용자를 등록합니다.
   * @param body - { imCd: IM코드 }
   */
  async registerUser(body: IRegisterUserRequest): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.post('/admin/user-management/users', body)

    return response.data
  },
  /**
   * 사용자를 삭제합니다.
   * @param userNo - 사용자 번호
   */
  async deleteUser(userNo: number): Promise<ICommonResponse<null>> {
    if (!userNo) throw new Error('userNo is required')

    const response: AxiosResponse<ICommonResponse<null>> = await api.delete(`admin/user-management/users/${userNo}`)
    return response.data
  },
}

export default membersService
