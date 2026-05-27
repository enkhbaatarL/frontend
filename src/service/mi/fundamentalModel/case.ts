import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

/** listCases searchType — Swagger Fundamental Model Case API */
export type FundamentalModelCaseSearchType = 'TITLE' | 'ASSIGNEE_NAME'

/** listCases case status — Swagger FundamentalModelCaseListItemRes */
export type FundamentalModelCaseStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

/** latestRun status — FundamentalModelRunStatusRes */
export type FundamentalModelRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface IFundamentalModelCaseListItem {
  caseId: number
  title: string
  status: FundamentalModelCaseStatus
  assigneeName: string
  createdAt: string
  updatedAt: string
}

export interface IFundamentalModelCaseListRes {
  totalCount: number
  cases: IFundamentalModelCaseListItem[]
}

export interface IGetFundamentalModelCasesParams {
  searchType?: FundamentalModelCaseSearchType
  keyword?: string
}

export interface IFundamentalModelCaseFile {
  fileIndex: number
  originalFileName: string
  contentType?: string
  size?: number
  mockFileId?: string
}

export interface IFundamentalModelCaseLatestRun {
  runId: string
  status: FundamentalModelRunStatus
  requestedAt?: string
  startedAt?: string
  finishedAt?: string
  failureReason?: string
  errorMessage?: string
}

export interface IFundamentalModelCaseDetail {
  caseId: number
  title: string
  description?: string | null
  status: FundamentalModelCaseStatus
  assigneeName: string
  files: IFundamentalModelCaseFile[]
  latestRun: IFundamentalModelCaseLatestRun | null
  createdAt: string
  updatedAt: string
}

export interface IFundamentalModelCaseUpdateReq {
  title?: string
  description?: string
}

const fundamentalModelCaseService = {
  async listCases(params?: IGetFundamentalModelCasesParams): Promise<IFundamentalModelCaseListRes> {
    const trimmedKeyword = params?.keyword?.trim()
    const response: AxiosResponse<ICommonResponse<IFundamentalModelCaseListRes>> = await api.get('mi/fundamental-model/cases', {
      params: {
        searchType: trimmedKeyword ? params?.searchType : undefined,
        keyword: trimmedKeyword || undefined,
      },
    })

    return response.data.data
  },

  async getCaseDetail(caseId: number): Promise<IFundamentalModelCaseDetail> {
    const response: AxiosResponse<ICommonResponse<IFundamentalModelCaseDetail>> = await api.get(`mi/fundamental-model/cases/${caseId}`)
    return response.data.data
  },

  async updateCase(caseId: number, body: IFundamentalModelCaseUpdateReq): Promise<IFundamentalModelCaseDetail> {
    const response: AxiosResponse<ICommonResponse<IFundamentalModelCaseDetail>> = await api.patch(
      `mi/fundamental-model/cases/${caseId}`,
      body,
    )
    return response.data.data
  },

  async deleteCase(caseId: number): Promise<void> {
    await api.delete(`mi/fundamental-model/cases/${caseId}`)
  },
}

export default fundamentalModelCaseService
