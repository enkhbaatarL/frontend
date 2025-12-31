import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { AxiosResponse } from 'axios'
import { t } from 'i18next'

import api from '@/lib/axios'
import i18n from '@/lib/i18n'
import { IAuditInfo } from '@/service/admin/members'
import useAuthStore from '@/store/useAuthStore'
import useDialog from '@/store/useDialog'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export enum StreamEventType {
  // CONNECTED = 'connected',
  MESSAGE = 'message',
  CHUNK = 'chunk',
  VECTOR_DATA = 'vector_data',
  FULLTEXT = 'fulltext',
  SERIES = 'series',
  TABLE = 'table',
  COMPLETE = 'complete',
}

export enum ChatRoomStatus {
  COMPLETE = 'COMPLETE',
  PENDING = 'PENDING',
  FAIL = 'FAIL',
}

export enum ChatRoomErrorStatus {
  FAIL_FORBIDDEN_WORDS = 'FAIL_FORBIDDEN_WORDS',
  FAIL_EXCEED_LENGTH = 'FAIL_EXCEED_LENGTH',
  FAIL_EXCEED_TOKEN = 'FAIL_EXCEED_TOKEN',
  FAIL_TIMED_OUT = 'FAIL_TIMED_OUT',
  FAIL_AGENT_COMMUNICATION = 'FAIL_AGENT_COMMUNICATION',
  CANCELLED_BY_USER = 'CANCELLED_BY_USER',
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

export interface IChatQnaRes {
  qnaNo: number | null
  question: string
  answer: null | {
    [StreamEventType.MESSAGE]: string
    [StreamEventType.SERIES]: {
      order: number
      type: SeriesType
      legend: string
      timestamps: string[]
      values: number[]
    }[]
    [StreamEventType.TABLE]: {
      tableId: string
      headers: {
        field: string
        name: string
      }[]
      rows: {
        cells: string[]
      }[]
    }[]
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

/**
 * 토큰을 재발급하고 새로운 토큰을 반환합니다.
 */
const reissueToken = async (): Promise<string> => {
  const { token: savedToken } = useAuthStore.getState()
  if (!savedToken) throw new Error('no token')

  const reissueRes = await fetch('/api/v1/auth/token-generation', {
    method: 'POST',
    headers: { Authorization: `Bearer ${savedToken}` },
    credentials: 'include',
  })

  if (!reissueRes.ok) throw new Error('reissue failed')

  const data = await reissueRes.json()
  const newToken = data?.data?.accessToken
  if (!newToken) throw new Error('no new token')

  useAuthStore.setState({ token: newToken })
  return newToken
}

/**
 * 세션 만료 다이얼로그를 표시합니다.
 * axios.ts의 errorNavigate와 동일한 패턴을 사용합니다.
 */
const showSessionExpiredDialog = (): void => {
  const { onShow, onHide } = useDialog.getState()
  onHide()
  onShow({
    title: t('세션이 만료되었습니다.'),
    disableClose: true,
    zIndex: 1600,
    actions: [
      {
        label: 'Login',
        onClick: async () => {
          useDialog.getState().onHide()
          globalThis.location.href = '/'
        },
      },
    ],
  })
}

/**
 * 인증 헤더를 생성합니다.
 */
const createAuthHeaders = (): Record<string, string> => {
  const { token, user, accessCompanyInfo } = useAuthStore.getState()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': i18n.language || 'ko',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (user?.isOtherServiceAccessPossible && accessCompanyInfo?.customerCompanyNo) {
    headers['X-Company-No'] = accessCompanyInfo.customerCompanyNo.toString()
  }

  return headers
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
   * @param shouldWebSearch - 실시간 웹검색 여부
   */
  async sendQna(chatRoomId: string, question: string, shouldWebSearch: boolean): Promise<IChatQnaRes> {
    const response: AxiosResponse<ICommonResponse<IChatQnaRes>> = await api.post(
      `mi/mari-agent/chat-rooms/${chatRoomId}/qna`,
      {
        question,
        shouldWebSearch,
      },
      { timeout: 180_000 },
    )

    return response.data.data
  },

  /**
   * Mari 에이전트에게 스트리밍 방식으로 질의합니다.
   * 새로운 채팅룸에서 대화를 시작하려면 chatRoomId를 UUID로 생성해서 전달합니다.
   * 존재하지 않는 chatRoomId 전달 시, 해당 ID로 채팅룸을 생성하고 첫 번째 QnA로 등록합니다.
   * 기존 채팅룸에서 대화를 이어가려면 기존의 chatRoomId를 전달합니다.
   *
   * @param {string} chatRoomId - 채팅방 ID (새로운 대화 시작 시 UUID, 기존 대화 이어가기 시 기존 ID)
   * @param {string} question - 질문 내용
   * @param {boolean} shouldWebSearch - 실시간 웹검색 여부
   * @param {dataHandler} dataHandler - 수신된 이벤트 메시지를 처리할 콜백 함수
   */
  async sendQnaStream(
    chatRoomId: string,
    question: string,
    shouldWebSearch: boolean,
    dataHandler: (event: EventSourceMessage) => void,
  ): Promise<void> {
    const MAX_RETRY_COUNT = 3
    let retryCount = 0
    let shouldRetry = false

    const headers = createAuthHeaders()
    const url = `/api/v1/mi/mari-agent/chat-rooms/${chatRoomId}/stream`

    // 타임아웃 설정 (5분)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 5 * 60_000)

    try {
      await fetchEventSource(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question, shouldWebSearch }),
        credentials: 'include',
        openWhenHidden: true,
        signal: controller.signal,
        onmessage(event) {
          dataHandler(event)
        },
        onerror(err) {
          if (retryCount >= MAX_RETRY_COUNT) {
            throw new Error(`최대 재시도 횟수(${MAX_RETRY_COUNT}회)를 초과했습니다.`)
          }

          retryCount++

          if (retryCount > 1) {
            console.info(`재시도 대기 중... (${retryCount}/${MAX_RETRY_COUNT})`)
          }

          if (err instanceof Response) {
            if (err.status === 401) {
              shouldRetry = true
              throw err
            } else if (err.status >= 500) {
              // 서버 오류는 자동 재시도
              console.warn(`서버 오류 발생, 재시도 중... (${retryCount}/${MAX_RETRY_COUNT})`, err.status)
            } else {
              // 기타 클라이언트 오류는 즉시 throw
              throw err
            }
          } else {
            console.warn(`네트워크 오류 발생, 재시도 중... (${retryCount}/${MAX_RETRY_COUNT})`, err)
          }
        },
        async onopen(response) {
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            retryCount = 0
            return
          }

          if (response.status === 401) {
            try {
              await reissueToken()
              shouldRetry = true
              throw new Error('토큰 재발급 후 재시도 필요')
            } catch {
              showSessionExpiredDialog()
              throw new Error('세션 만료')
            }
          }

          throw new Error(`스트리밍 응답 실패: ${response.status} ${response.statusText}`)
        },
        onclose() {
          clearTimeout(timeoutId)
          console.info('스트리밍 연결 종료')
        },
      })
    } catch (e) {
      clearTimeout(timeoutId)

      if (shouldRetry) {
        try {
          await reissueToken()
          throw e
        } catch {
          showSessionExpiredDialog()
          throw new Error('세션 만료')
        }
      }

      throw e instanceof Error ? e : new Error(String(e))
    }
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
   * 특정 채팅룸에서 진행 중인 Stream 질의응답 작업을 중단합니다.
   * 중단 시점까지 생성된 부분 응답은 DB에 저장됩니다.
   *
   * @param {string} chatRoomId - 채팅방 ID
   * @param {string} message - 중단 시점 메시지
   */
  async cancelStream(chatRoomId: string, message: string): Promise<void> {
    await api.patch(`mi/mari-agent/chat-rooms/${chatRoomId}/stream-cancel`, {
      message,
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
