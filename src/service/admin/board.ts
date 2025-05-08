import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { IFile } from '@/service/admin/file'
import { IAuditInfo } from '@/service/admin/members'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'
import { IFilterItem } from '@/types/common'

export interface IFaqFilter {
  category: IFilterItem[]
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

export interface INoticeFilter {
  category: IFilterItem[]
  status: IFilterItem[]
  target: IFilterItem[]
}

export interface INoticeRequest extends IPaginationRequest {
  category: string
  status: string
  target: string
  keyword: string
}

export interface INoticeInfo {
  bulletinNo: number
  isTopFixed: boolean
  isPopupUse: boolean
  bulletinCategorySeparateCode: string
  bulletinTitleName: string
  status: string
  target: string
  auditInfo: IAuditInfo
}

export interface INoticeDetailInfo {
  isTopFixed: boolean
  isPopupUse: boolean
  popupPostBeginDt: string
  popupPostEndDt: string
  bulletinCategorySeparateCd: string
  isWholePost: boolean
  targetList: {
    customerCompanyNo: number
    customerCompanyNm: string
  }[]
  bulletinValidBeginDt: string
  bulletinValidEndDt: string
  bulletinTitleNm: string
  bulletinCntt: string
  fileList: IFile[]
}

/**
 * 게시판 관리 서비스
 */
const boardService = {
  /**
   * FAQ 필터를 조회합니다.
   */
  async getFaqFilter(): Promise<IFaqFilter> {
    const response: AxiosResponse<ICommonResponse<IFaqFilter>> = await api.get('admin/bulletinboard-management/faq/filter')

    return response.data.data
  },
  /**
   * FAQ 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, category: 카테고리, keyword: 검색어 }
   */
  async getFaq(params: Partial<IFaqRequest>): Promise<IPaginationResponse<IFaqInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IFaqInfo>>> = await api.get('admin/bulletinboard-management/faq', {
      params,
    })

    return response.data.data
  },
  /**
   * FAQ를 등록합니다.
   * @param body - { bulletinCategorySeparateCd: 카테고리 코드, bulletinTitleNm: 제목(질문), bulletinCntt: 내용(답변) }
   */
  async registerFaq(body: IFaqDetailInfo): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.post('admin/bulletinboard-management/faq', body)

    return response.data
  },
  /**
   * FAQ 상세 정보를 조회합니다.
   * @param faqNo - FAQ 번호
   */
  async getFaqDetail(faqNo?: number | string): Promise<IFaqDetailInfo> {
    if (!faqNo) throw new Error('faqNo is required')

    const response: AxiosResponse<ICommonResponse<IFaqDetailInfo>> = await api.get(`admin/bulletinboard-management/faq/${faqNo}`)

    return response.data.data
  },
  /**
   * FAQ를 삭제합니다.
   * @param faqNo - FAQ 번호
   */
  async deleteFaq(faqNo: number | string): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.delete(`admin/bulletinboard-management/faq/${faqNo}`)
    return response.data
  },
  /**
   * FAQ를 수정합니다.
   * @param faqNo - FAQ 번호
   * @param body - { bulletinCategorySeparateCd: 카테고리 코드, bulletinTitleNm: 제목(질문), bulletinCntt: 내용(답변) }
   */
  async updateFaq(faqNo: number | string | undefined, body: IFaqDetailInfo): Promise<void> {
    if (!faqNo) throw new Error('faqNo is required')

    await api.patch(`admin/bulletinboard-management/faq/${faqNo}`, body)
  },
  /**
   * 공지사항 필터를 조회합니다.
   */
  async getNoticeFilter(): Promise<INoticeFilter> {
    const response: AxiosResponse<ICommonResponse<INoticeFilter>> = await api.get('admin/bulletinboard-management/notice/filter')

    return response.data.data
  },
  /**
   * 공지사항 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, category: 카테고리, status: 게시 여부, target: 게시 대상, keyword: 검색어 }
   */
  async getNotice(params: Partial<INoticeRequest>): Promise<IPaginationResponse<INoticeInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INoticeInfo>>> = await api.get(
      'admin/bulletinboard-management/notice',
      {
        params,
      },
    )

    return response.data.data
  },
  /**
   * 공지사항을 등록합니다.
   * @param body
   */
  async registerNotice(body: INoticeDetailInfo): Promise<ICommonResponse<null>> {
    const { targetList, ...rest } = body

    const response: AxiosResponse<ICommonResponse<null>> = await api.post('admin/bulletinboard-management/notice', {
      ...rest,
      target: targetList.map((item) => item.customerCompanyNo),
    })

    return response.data
  },
  /**
   * 공지사항 상세 정보를 조회합니다.
   * @param noticeNo - 공지사항 번호
   */
  async getNoticeDetail(noticeNo?: number | string): Promise<INoticeDetailInfo> {
    if (!noticeNo) throw new Error('noticeNo is required')

    const response: AxiosResponse<ICommonResponse<INoticeDetailInfo>> = await api.get(`admin/bulletinboard-management/notices/${noticeNo}`)

    return response.data.data
  },
  /**
   * 공지사항을 삭제 합니다.
   * @param noticeNo - 공지사항 번호
   */
  async deleteNotice(noticeNo: number | string): Promise<ICommonResponse<null>> {
    const response: AxiosResponse<ICommonResponse<null>> = await api.delete(`admin/bulletinboard-management/notices/${noticeNo}`)
    return response.data
  },
  /**
   * 공지사항을 수정합니다.
   * @param noticeNo - 공지사항 번호
   * @param body - 공지사항 수정 정보
   */
  async updateNotice(noticeNo: number | string | undefined, body: INoticeDetailInfo): Promise<void> {
    if (!noticeNo) throw new Error('noticeNo is required')

    const { targetList, ...rest } = body

    await api.patch(`admin/bulletinboard-management/notices/${noticeNo}`, {
      ...rest,
      target: targetList.map((item) => item.customerCompanyNo),
    })
  },
  async uploadNoticeFile(): Promise<INoticeFilter> {
    const response: AxiosResponse<ICommonResponse<INoticeFilter>> = await api.get('admin/bulletinboard-management/notice/upload-file')

    return response.data.data
  },

  // /api/v1/admin/bulletinboard-management/notice/upload-file
}

export default boardService
