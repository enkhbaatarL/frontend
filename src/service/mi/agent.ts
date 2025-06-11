import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { IAuditInfo } from '@/service/admin/members'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export enum ChatRoomStatus {
  COMPLETE = 'COMPLETE',
  PENDING = 'PENDING',
  FAIL = 'FAIL',
}

export enum ChatRoomErrorStatus {
  FAIL_FORBIDDEN_WORDS = 'FAIL_FORBIDDEN_WORDS',
  FAIL_EXCEED_LENGTH = 'FAIL_EXCEED_LENGTH',
}

export enum FeedbackCd {
  BUG_ISSUE = 'BUG_ISSUE',
  NO_POSSIBLE_RESPONSE = 'NO_POSSIBLE_RESPONSE',
  NOT_FOLLOW_REQUEST = 'NOT_FOLLOW_REQUEST',
  INACCURATE_INFORMATION = 'INACCURATE_INFORMATION',
  INCOMPLETE_RESPONSE = 'INCOMPLETE_RESPONSE',
  OTHER = 'OTHER',
}

export interface IChatRoomRes {
  chatRoomId: string
  title: string
  chatBeginDt: string
  finalChatDt: string
}

export interface IMajorQuestionRes {
  majorQuestionNo: number
  questionRank: number
  majorQuestion: string
}

export enum SeriesType {
  ACTUAL = 'ACTUAL',
  FORECAST = 'FORECAST',
}

export enum RelatedDataType {
  STRUCTURED = 'STRUCTURED',
  UNSTRUCTURED = 'UNSTRUCTURED',
}

export interface IChatQnaAnswerBundle {
  content?: string
  series?: {
    order: number
    type: SeriesType
    legend: string
    timestamps: string[]
    values: number[]
  }[]
  tables?: {
    tableId: string
    headers: {
      field: string
      name: string
    }[]
    rows: {
      cells: string[]
    }[]
  }[]
  sources?: {
    url: string
    sourceNm: string
  }[]
  relatedData?:
    | {
        type: RelatedDataType
        goodsNo: number
        goodsDataNo: number
        displayNm: string
      }[]
    | null
}

export interface IChatQnaRes {
  qnaNo: number | null
  question: string
  answer: null | {
    bundles: IChatQnaAnswerBundle[]
  }
  isRecommended: boolean | null
  isNotRecommended: boolean | null
  statusCd: ChatRoomStatus | ChatRoomErrorStatus | null
  statusNm: string | null
  feedbackCd: FeedbackCd | null
  feedbackNm: string | null
  feedbackComment: string | null
  auditInfo: IAuditInfo | null
}

const agentService = {
  /**
   * 분과별 주요 질의문 목록을 조회합니다.
   * 목록은 questionRank 필드를 기반으로 오름차순 정렬됩니다.
   */
  async getMajorQuestions(): Promise<IMajorQuestionRes[]> {
    const response: AxiosResponse<ICommonResponse<IMajorQuestionRes[]>> = await api.get('mi/mari-agent/major-questions')
    return response.data.data
  },

  /**
   * 채팅방 목록을 조회합니다.
   */
  async getChatRooms(): Promise<IChatRoomRes[]> {
    const response: AxiosResponse<ICommonResponse<IChatRoomRes[]>> = await api.get('mi/mari-agent/chat-rooms')
    return response.data.data
  },

  /**
   * 로그인된 사용자의 Mari 에이전트 특정 채팅룸의 질의응답(QnA) 목록을 페이지네이션으로 조회합니다.
   * 목록은 최신순으로 정렬됩니다.
   *
   * @param {string} chatRoomId - 채팅방 ID
   * @param {number} page - 페이지 번호
   */
  async getChatQna(chatRoomId: string, page: number = 1): Promise<IPaginationResponse<IChatQnaRes>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IChatQnaRes>>> = await api.get(
      `mi/mari-agent/chat-rooms/${chatRoomId}/qna`,
      {
        params: {
          page,
          size: 1,
        },
      },
    )
    return response.data.data
  },

  /**
   * Mari 에이전트에게 질의합니다.
   * 새로운 채팅룸에서 대화를 시작하려면 chatRoomId를 UUID로 생성해서 전달합니다.
   * 존재하지 않는 chatRoomId 전달 시, 해당 ID로 채팅룸을 생성하고 첫 번째 QnA로 등록합니다.
   * 기존 채팅룸에서 대화를 이어가려면 기존의 chatRoomId를 전달합니다.
   *
   * @param {string} chatRoomId - 채팅방 ID (새로운 대화 시작 시 UUID, 기존 대화 이어가기 시 기존 ID)
   * @param {string} question - 질문 내용
   */
  async sendQna(chatRoomId: string, question: string): Promise<IChatQnaRes> {
    const response: AxiosResponse<ICommonResponse<IChatQnaRes>> = await api.post(`mi/mari-agent/chat-rooms/${chatRoomId}/qna`, {
      question,
    })

    return response.data.data
  },

  /**
   * Mari 에이전트의 응답을 평가합니다.
   *
   * @param {string} chatRoomId - 채팅방 ID
   * @param {number} qnaNo - QnA 번호
   * @param {boolean} isRecommended - 추천 여부
   * @param {FeedbackCd} feedbackCd - 피드백 코드
   * @param {string} feedbackComment - 피드백 코멘트
   */
  async assessQna(
    chatRoomId: string,
    qnaNo: number,
    isRecommended: boolean,
    feedbackCd?: FeedbackCd,
    feedbackComment?: string,
  ): Promise<void> {
    await api.patch(`mi/mari-agent/chat-rooms/${chatRoomId}/qna/${qnaNo}/assessment`, {
      isRecommended,
      feedbackCd,
      feedbackComment,
    })
  },

  /**
   * Mari 에이전트의 응답을 재생성합니다.
   *
   * @param {string} chatRoomId - 채팅룸 ID
   * @param {number} qnaNo - 질의응답 번호
   */
  async retryQna(chatRoomId: string, qnaNo: number): Promise<IChatQnaRes> {
    const response: AxiosResponse<ICommonResponse<IChatQnaRes>> = await api.post(
      `mi/mari-agent/chat-rooms/${chatRoomId}/qna/${qnaNo}/retry`,
    )
    return response.data.data
  },

  /**
   * 채팅룸을 삭제합니다.
   *
   * @param {string} chatRoomId - 채팅룸 ID
   */
  async deleteChatRoom(chatRoomId: string): Promise<void> {
    await api.delete(`mi/mari-agent/chat-rooms/${chatRoomId}`)
  },

  /**
   * 채팅룸을 수정합니다.
   *
   * @param {string} chatRoomId - 채팅룸 ID
   * @param {string} title - 제목
   */
  async updateChatRoom(chatRoomId: string, title: string): Promise<void> {
    await api.patch(`mi/mari-agent/chat-rooms/${chatRoomId}`, { title })
  },
}

export default agentService
