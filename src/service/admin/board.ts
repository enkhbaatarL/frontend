import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { IAuditInfo } from '@/service/admin/members'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'

export interface FaqFilter {
  category: {
    key: string
    value: string
  }[]
}

export interface IFaqRequest extends IPaginationRequest {
  category: string
  keyword: string
}

export interface IFaqInfo {
  bulletinNo: number
  bulletinCategorySeparateCd: string
  bulletinTitleNm: string
  auditInfo: IAuditInfo
}

export interface IFaqDetailInfo {
  bulletinCategorySeparateCd: string
  bulletinTitleNm: string
  bulletinCntt: string
}

/**
 * 게시판 관리 서비스
 */
const boardService = {
  /**
   * FAQ 필터를 조회합니다.
   */
  async getFaqFilter(): Promise<FaqFilter> {
    const response: AxiosResponse<ICommonResponse<FaqFilter>> = await api.get('admin/bulletinboard-manangement/faq/filter')

    return response.data.data
  },
  /**
   * FAQ 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, category: 카테고리, keyword: 검색어 }
   */
  async getFaq(params: Partial<IFaqRequest>): Promise<IPaginationResponse<IFaqInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IFaqInfo>>> = await api.get('admin/bulletinboard-manangement/faq', {
      params,
    })

    return response.data.data
  },
  /**
   * FAQ를 등록합니다.
   * @param body - { bulletinCategorySeparateCd: 카테고리 코드, bulletinTitleNm: 제목(질문), bulletinCntt: 내용(답변) }
   */
  async registerFaq(body: IFaqDetailInfo): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.post('admin/bulletinboard-manangement/faq', body)

    return response.data
  },
  /**
   * FAQ 상세 정보를 조회합니다.
   * @param faqNo - FAQ 번호
   */
  async geFaqDetail(faqNo?: number | string): Promise<IFaqDetailInfo> {
    if (!faqNo) throw new Error('faqNo is required')

    const response: AxiosResponse<ICommonResponse<IFaqDetailInfo>> = await api.get(`admin/bulletinboard-manangement/faq/${faqNo}`)

    return response.data.data
  },
  /**
   * FAQ를 삭제합니다.
   * @param faqNo - FAQ 번호
   */
  async deleteFaq(faqNo: number | string): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.delete(`admin/bulletinboard-manangement/faq/${faqNo}`)
    return response.data
  },
  /**
   * FAQ를 수정합니다.
   * @param faqNo - FAQ 번호
   * @param body - { bulletinCategorySeparateCd: 카테고리 코드, bulletinTitleNm: 제목(질문), bulletinCntt: 내용(답변) }
   */
  async updateFaq(faqNo: number | string | undefined, body: IFaqDetailInfo): Promise<void> {
    if (!faqNo) throw new Error('faqNo is required')

    await api.patch(`admin/bulletinboard-manangement/faq/${faqNo}`, body)
  },
}

export default boardService
