import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { IFile } from '@/service/admin/file.ts'
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
  bulletinNo: string
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
  isRead: boolean
  auditInfo: IAuditInfo
}

export interface INoticeDetailRequest {
  customerCompanyNo: number
}

export interface INoticeDetailInfo {
  bulletinNo: number
  bulletinCategoryName: string
  bulletinTitleNm: string
  bulletinCntt: string
  fileUrl: string
}

export interface INoticePopupInfo {
  bulletinNo: number
  bulletinTitleName: string
  bulletinContent: string
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
    const response: AxiosResponse<ICommonResponse<IFaqFilter>> = await api.get('mi/bulletinboard/notice/filter')

    return response.data.data
  },
  /**
   * FAQ 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, category: 카테고리, keyword: 검색어 }
   */
  async getFaq(params: Partial<IFaqRequest>): Promise<IPaginationResponse<IFaqDetailInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IFaqDetailInfo>>> = await api.get('mi/bulletinboard/faq', {
      params,
    })

    return response.data.data
  },
  /**
   * 공지사항 필터를 조회합니다.
   */
  async getNoticeFilter(): Promise<INoticeFilter> {
    const response: AxiosResponse<ICommonResponse<INoticeFilter>> = await api.get('mi/bulletinboard/notice/filter')

    return response.data.data
  },
  /**
   * 공지사항 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, category: 카테고리, status: 게시 여부, target: 게시 대상, keyword: 검색어 }
   */
  async getNotice(params?: Partial<INoticeRequest>): Promise<IPaginationResponse<INoticeInfo>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INoticeInfo>>> = await api.get('mi/bulletinboard/notice', {
      params,
    })

    return response.data.data
  },
  /**
   * 공지사항 상세 정보를 조회합니다.
   * @param noticeNo - 공지사항 번호
   * @param params - { customerCompanyNo: 고객회사번호 }
   */
  async getNoticeDetail(noticeNo?: number | string, params?: INoticeDetailRequest): Promise<INoticeDetailInfo> {
    if (!noticeNo) throw new Error('noticeNo is required')

    const response: AxiosResponse<ICommonResponse<INoticeDetailInfo>> = await api.get(`mi/bulletinboard/notices/${noticeNo}`, {
      params,
    })

    return response.data.data
  },
  /**
   * 공지사항 팝업을 조회합니다.
   */
  async getNoticePopup(): Promise<INoticePopupInfo> {
    const response: AxiosResponse<ICommonResponse<INoticePopupInfo>> = await api.get('mi/bulletinboard/notices/popup')

    return response.data.data
  },
}

export default boardService
