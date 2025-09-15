import { AxiosResponse } from 'axios'
import { t } from 'i18next'

import api from '@/lib/axios'
import { IAuditInfo } from '@/service/admin/members'
import useAuthStore from '@/store/useAuthStore'
import useDialog from '@/store/useDialog'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

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
  event?: string
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
    bundles: any
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

  // /**
  //  * Mari 에이전트에게 스트리밍 방식으로 질의합니다.
  //  * 새로운 채팅룸에서 대화를 시작하려면 chatRoomId를 UUID로 생성해서 전달합니다.
  //  * 존재하지 않는 chatRoomId 전달 시, 해당 ID로 채팅룸을 생성하고 첫 번째 QnA로 등록합니다.
  //  * 기존 채팅룸에서 대화를 이어가려면 기존의 chatRoomId를 전달합니다.
  //  *
  //  * @param {string} chatRoomId - 채팅방 ID (새로운 대화 시작 시 UUID, 기존 대화 이어가기 시 기존 ID)
  //  * @param {string} question - 질문 내용
  //  * @param {boolean} shouldWebSearch - 실시간 웹검색 여부
  //  * @param {(data: string) => void} onMessage - 수신된 메시지를 처리할 콜백 함수
  //  * @param {() => void} [onDone] - 스트리밍 완료 시 호출될 콜백 함수
  //  * @param {(e: any) => void} [onError] - 오류 발생 시 호출될 콜백 함수
  //  */
  // async sendQnaStream(
  //   chatRoomId: string,
  //   question: string,
  //   shouldWebSearch: boolean,
  //   onMessage: (data: string) => void,
  //   onDone?: () => void,
  //   onError?: (e: any) => void,
  // ): Promise<void> {
  //   try {

  //   const { token, user, accessCompanyInfo } = useAuthStore.getState()

  //     const headers: Record<string, string> = {
  //       'Content-Type': 'application/json'
  //     }

  //     if (token) headers['Authorization'] = `Bearer ${token}`

  //     if (user?.isOtherServiceAccessPossible && accessCompanyInfo?.customerCompanyNo) {
  //     headers['X-Company-No'] = accessCompanyInfo.customerCompanyNo.toString()
  //     }

  //     const BASE_URL ='https://' +  window.location.hostname

  //     const response = await fetch(`${BASE_URL}/api/v1/mi/mari-agent/chat-rooms/${chatRoomId}/stream`, {
  //       method: 'POST',
  //       headers,
  //       body: JSON.stringify({ question, shouldWebSearch }),
  //       keepalive: true
  //     })

  //     if (!response.ok || !response.body) throw new Error('스트리밍 응답 실패')

  //     const reader = response.body.getReader()
  //     const decoder = new TextDecoder('utf-8')
  //     let buffer = ''
  //     let currentEvent = ''
  //     let lastParsedMessage: any = null

  //     while (true) {
  //       const { value, done } = await reader.read()
  //       if (done) break
  //       buffer += decoder.decode (value, {stream : true})

  //       let boundary
  //       while ((boundary = buffer.indexOf('\n\n')) !== -1 ) {
  //         const block = buffer.slice(0,boundary).trim()
  //         buffer = buffer.slice(boundary + 2)

  //         if (!block) continue
  //         const lines = block.split('\n')
  //         for (const line of lines) {
  //           if (line.startsWith('event:')) {
  //             currentEvent = line.slice(6).trim()
  //           } else if (line.startsWith('data:')) {
  //             const dataStr = line.slice(5).trim()
  //             if (currentEvent === 'complete') {
  //               if (lastParsedMessage) {
  //                   onMessage({
  //                   ...lastParsedMessage,
  //                   event: 'complete'
  //                 })
  //                 onDone?.()
  //                 break
  //               }
  //             }
  //             try {
  //               const parsed = JSON.parse(dataStr)

  //               let title = 'PROCESSING';

  //               parsed.title = title
  //               parsed.event = currentEvent
  //               lastParsedMessage = parsed
  //               onMessage(parsed)
  //             } catch (e){
  //               console.log("parsing error")

  //               // onError?.(e)

  //               // onMessage(JSON.parse(JSON.stringify({complete : 'complete'})))
  //             }
  //           }
  //         }
  //         currentEvent = ''
  //       }
  //     }
  //     onDone?.()
  //   } catch (e) {
  //     onError?.(e)
  //   }
  // },
  /**
   * Mari 에이전트에게 스트리밍 방식으로 질의합니다.
   * 새로운 채팅룸에서 대화를 시작하려면 chatRoomId를 UUID로 생성해서 전달합니다.
   * 존재하지 않는 chatRoomId 전달 시, 해당 ID로 채팅룸을 생성하고 첫 번째 QnA로 등록합니다.
   * 기존 채팅룸에서 대화를 이어가려면 기존의 chatRoomId를 전달합니다.
   *
   * @param {string} chatRoomId - 채팅방 ID (새로운 대화 시작 시 UUID, 기존 대화 이어가기 시 기존 ID)
   * @param {string} question - 질문 내용
   * @param {boolean} shouldWebSearch - 실시간 웹검색 여부
   * @param {(data: any) => void} onMessage - 수신된 메시지를 처리할 콜백 함수
   * @param {() => void} [onDone] - 스트리밍 완료 시 호출될 콜백 함수
   * @param {(e: any) => void} [onError] - 오류 발생 시 호출될 콜백 함수
   */
  async sendQnaStream(
    chatRoomId: string,
    question: string,
    shouldWebSearch: boolean,
    onMessage: (data: any) => void,
    onDone?: () => void,
    onError?: (e: any) => void,
  ): Promise<void> {
    try {
      const makeHeaders = () => {
        const { token, user, accessCompanyInfo } = useAuthStore.getState()
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        if (user?.isOtherServiceAccessPossible && accessCompanyInfo?.customerCompanyNo) {
          headers['X-Company-No'] = accessCompanyInfo.customerCompanyNo.toString()
        }
        return headers
      }

      const BASE_URL = `https://${window.location.hostname}`

      let response = await fetch(`${BASE_URL}/api/v1/mi/mari-agent/chat-rooms/${chatRoomId}/stream`, {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify({ question, shouldWebSearch }),
        keepalive: true,
        credentials: 'include',
      })

      if (response.status === 401) {
        try {
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

          response = await fetch(`${BASE_URL}/api/v1/mi/mari-agent/chat-rooms/${chatRoomId}/stream`, {
            method: 'POST',
            headers: makeHeaders(),
            body: JSON.stringify({ question, shouldWebSearch }),
            keepalive: true,
            credentials: 'include',
          })
        } catch {
          const { onShow } = useDialog.getState()
          onShow({
            title: t('세션이 만료되었습니다.'),
            zIndex: 99999,
            actions: [
              {
                label: 'Login',
                onClick: async () => {
                  useDialog.getState().onHide()
                  window.location.href = '/'
                },
              },
            ],
          })
        }
      }

      if (!response.ok || !response.body) throw new Error('스트리밍 응답 실패')

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let currentEvent = ''
      let lastParsedMessage: any = null

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let boundary: number
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, boundary).trim()
          buffer = buffer.slice(boundary + 2)
          if (!block) continue

          const lines = block.split('\n')
          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              const dataStr = line.slice(5).trim()

              if (currentEvent === 'complete') {
                if (lastParsedMessage) {
                  onMessage({ ...lastParsedMessage, event: 'complete' })
                }
                onDone?.()
                currentEvent = ''
                break
              }

              try {
                const parsed = JSON.parse(dataStr)
                parsed.title = parsed.title ?? 'PROCESSING'
                parsed.event = currentEvent
                lastParsedMessage = parsed
                onMessage(parsed)
              } catch (e) {
                console.log('parsing error')

                // onError?.(e)

                // onMessage(JSON.parse(JSON.stringify({complete : 'complete'})))
              }
            }
          }
          currentEvent = ''
        }
      }

      onDone?.()
    } catch (e) {
      onError?.(e)
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
