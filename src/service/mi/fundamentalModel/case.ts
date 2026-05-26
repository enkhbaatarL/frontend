import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

/** listCases searchType — Swagger Fundamental Model Case API */
export type FundamentalModelCaseSearchType = 'TITLE' | 'ASSIGNEE_NAME'

/** listCases case status — Swagger FundamentalModelCaseListItemRes */
export type FundamentalModelCaseStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

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
}

export default fundamentalModelCaseService
