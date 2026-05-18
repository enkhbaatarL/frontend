import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

export type UserFeedbackTypeCd = 'data_error' | 'ui_improvement' | 'feature_suggestion' | 'etc'

export interface ICreateUserFeedbackReq {
  feedbackPageNm?: string
  feedbackSectionNm?: string
  feedbackTypeCd: UserFeedbackTypeCd
  feedbackContent?: string
}

const userFeedbackService = {
  async createUserFeedback(payload: ICreateUserFeedbackReq): Promise<number> {
    const response: AxiosResponse<ICommonResponse<number>> = await api.post('common/user-feedback', payload)
    return response.data.data
  },
}

export default userFeedbackService
