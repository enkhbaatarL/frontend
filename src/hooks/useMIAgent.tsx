import { EventSourceMessage } from '@microsoft/fetch-event-source'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuid } from 'uuid'

import i18n from '@/lib/i18n'
import agentService, { IChatQnaRes, IChatRoomRes, StreamEventType } from '@/service/mi/agent'
import { IPaginationResponse } from '@/types/api'

export type IChatRoom = IChatRoomRes

export enum MIAgentState {
  IDLE = 'idle',
  CONNECTED = 'connected',
  GENERATING = 'generating',
  STREAMING = 'streaming',
  COMPLETE = 'complete',
}

export interface IConversation extends IChatQnaRes {
  statusMessage?: string
  isNew?: boolean
}

/**
 * 청크 속도 추적 정보
 */
interface ChunkSpeedInfo {
  timestamps: number[]
  lastUpdateTime: number
}

/**
 * 청크 관리 객체
 * qnaNo별로 청크 배열을 관리하며, 컴포넌트에서 직접 조회하여 사용
 * 청크 도착 속도를 추적하여 동적 처리 간격 계산에 활용
 */
class ChunkManager {
  private readonly chunks: Map<number, string[]> = new Map()
  private readonly speedInfo: Map<number, ChunkSpeedInfo> = new Map()
  private readonly MAX_TIMESTAMPS = 10 // 최근 10개 청크만 추적

  /**
   * 특정 qnaNo에 청크 추가
   */
  addChunk(qnaNo: number, chunk: string): void {
    const currentChunks = this.chunks.get(qnaNo) ?? []
    this.chunks.set(qnaNo, [...currentChunks, chunk])

    // 청크 도착 속도 추적
    const now = Date.now()
    let info = this.speedInfo.get(qnaNo)
    if (!info) {
      info = { timestamps: [], lastUpdateTime: now }
      this.speedInfo.set(qnaNo, info)
    }

    // 타임스탬프 추가 (최대 MAX_TIMESTAMPS개만 유지)
    info.timestamps.push(now)
    if (info.timestamps.length > this.MAX_TIMESTAMPS) {
      info.timestamps.shift()
    }
    info.lastUpdateTime = now
  }

  /**
   * 특정 qnaNo의 청크 배열 가져오기
   */
  getChunks(qnaNo: number | null): string[] {
    if (qnaNo === null) return []
    return this.chunks.get(qnaNo) ?? []
  }

  /**
   * 특정 qnaNo의 청크 도착 속도 계산 (문자/초)
   * @returns 초당 문자 수, 또는 null (속도 계산 불가)
   */
  getChunkSpeed(qnaNo: number | null): number | null {
    if (qnaNo === null) return null

    const info = this.speedInfo.get(qnaNo)
    if (!info || info.timestamps.length < 2) {
      return null // 속도 계산을 위해 최소 2개 타임스탬프 필요
    }

    const chunks = this.chunks.get(qnaNo) ?? []
    if (chunks.length === 0) return null

    // 최근 타임스탬프들로 시간 범위 계산
    const timestamps = info.timestamps
    const timeSpan = (timestamps.at(-1) ?? 0) - (timestamps.at(0) ?? 0) // ms

    if (timeSpan === 0) return null

    // 해당 기간 동안 추가된 청크들의 총 길이 계산
    const recentChunkCount = Math.min(timestamps.length, chunks.length)
    let totalLength = 0
    const startIndex = Math.max(0, chunks.length - recentChunkCount)
    for (let i = startIndex; i < chunks.length; i++) {
      totalLength += chunks[i].length
    }

    // 초당 문자 수 계산
    return (totalLength / timeSpan) * 1000
  }

  /**
   * 특정 qnaNo의 청크 초기화
   */
  clearChunks(qnaNo: number): void {
    this.chunks.delete(qnaNo)
    this.speedInfo.delete(qnaNo)
  }

  /**
   * 모든 청크 초기화
   */
  clearAll(): void {
    this.chunks.clear()
    this.speedInfo.clear()
  }
}

export const chunkManager = new ChunkManager()

const initialConversation: IConversation = {
  qnaNo: null,
  question: '',
  answer: null,
  isRecommended: null,
  isNotRecommended: null,
  statusCd: null,
  statusNm: null,
  feedbackCd: null,
  feedbackNm: null,
  feedbackComment: null,
  auditInfo: null,
  isNew: true,
}

const useMIAgent = () => {
  const { t } = useTranslation()

  const stateRef = useRef<MIAgentState>(MIAgentState.IDLE)
  const [state, setState] = useState<MIAgentState>(MIAgentState.IDLE)

  const [selectedChatRoom, setSelectedChatRoom] = useState<{ id: string | null; isNew: boolean }>({
    id: null,
    isNew: true,
  })
  const [conversations, setConversations] = useState<IConversation[]>([])

  const updateState = useCallback((newState: MIAgentState) => {
    stateRef.current = newState
    setState(newState)
  }, [])

  const {
    data: chatRooms,
    refetch: refetchChatRooms,
    isLoading: chatRoomsLoading,
  } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: () => agentService.getChatRooms(),
  })

  const refetchChatRoomsRef = useRef(refetchChatRooms)
  useEffect(() => {
    refetchChatRoomsRef.current = refetchChatRooms
  }, [refetchChatRooms])

  const {
    data: chatQnaHistory,
    fetchNextPage: fetchPrevHistory,
    hasNextPage: hasPrevHistory,
    isFetchingNextPage: isFetchingPrevHistory,
  } = useInfiniteQuery({
    queryKey: ['chatQna', selectedChatRoom.id],
    queryFn: ({ pageParam = 1 }) => (selectedChatRoom.id ? agentService.getChatQna(selectedChatRoom.id, pageParam) : Promise.resolve(null)),
    getNextPageParam: (lastPage, _, lastPageParam) => (lastPage?.hasNext ? lastPageParam + 1 : undefined),
    enabled: !!selectedChatRoom.id && !selectedChatRoom.isNew,
    initialPageParam: 1,
  })

  /**
   * 채팅방 선택
   */
  const setSelectedChatRoomId = useCallback((id: string | null, isNew: boolean = false) => {
    setConversations([])
    chunkManager.clearAll()
    setSelectedChatRoom({ id, isNew })
  }, [])

  const updateStatusMessage = useCallback((qnaNo: number | null, statusMessage: string | undefined) => {
    if (qnaNo === null) return

    setConversations((prev) => {
      const index = prev.findIndex((conversation) => conversation.qnaNo === qnaNo)
      if (index === -1) return prev

      const updatedConversation: IConversation = {
        ...prev[index],
        statusMessage,
      }

      return [...prev.slice(0, index), updatedConversation, ...prev.slice(index + 1)]
    })
  }, [])

  /**
   * qnaNo로 대화를 검색하고 없으면 추가하는 헬퍼 함수
   * 비동기 문제를 방지하기 위해 함수형 업데이트 내부에서 사용
   */
  const ensureConversationExists = useCallback(
    (prev: IConversation[], qnaNo: number, message: string, initialData?: Partial<IConversation>): IConversation[] => {
      const existingIndex = prev.findIndex((conversation) => conversation.qnaNo === qnaNo)

      if (existingIndex === -1) {
        return [
          ...prev.map((conversation) => ({
            ...conversation,
            isNew: false,
          })),
          {
            ...initialConversation,
            qnaNo,
            question: message,
            ...initialData,
          },
        ]
      }

      return prev
    },
    [],
  )

  const createStreamMessageHandler = useCallback(
    (message: string) =>
      ({ id, event, data }: EventSourceMessage) => {
        try {
          if (event === StreamEventType.COMPLETE) {
            updateState(MIAgentState.COMPLETE)
            setTimeout(() => updateState(MIAgentState.IDLE), 1000)
            setSelectedChatRoom((prev) => {
              if (prev.isNew && prev.id) {
                refetchChatRoomsRef.current()
                return {
                  ...prev,
                  isNew: false,
                }
              }
              return prev
            })
            return
          }

          const { qnaNo, data: streamData } = JSON.parse(data)

          if (qnaNo === null) return

          if (event !== StreamEventType.CHUNK) {
            setConversations((prev) => {
              const optimisticIndex = prev.findIndex((conv) => conv.qnaNo === null && conv.question === message)

              if (optimisticIndex !== -1) {
                // 낙관적 업데이트된 질문을 실제 qnaNo로 업데이트
                const updatedConversation: IConversation = {
                  ...prev[optimisticIndex],
                  qnaNo,
                  auditInfo: streamData,
                }
                return [...prev.slice(0, optimisticIndex), updatedConversation, ...prev.slice(optimisticIndex + 1)]
              }

              // 낙관적 업데이트가 없으면 기존 로직대로 처리
              return ensureConversationExists(prev, qnaNo, message, { auditInfo: streamData })
            })
          }

          switch (event) {
            case StreamEventType.MESSAGE: {
              if (stateRef.current === MIAgentState.STREAMING) {
                break
              }

              updateState(MIAgentState.GENERATING)
              const generatingMessageKey = `mari.streamMessage.${id}`
              const generatingMessage = i18n.exists(generatingMessageKey) ? t(generatingMessageKey) : streamData
              updateStatusMessage(qnaNo, generatingMessage)

              break
            }

            case StreamEventType.CHUNK: {
              updateState(MIAgentState.STREAMING)

              chunkManager.addChunk(qnaNo, streamData)

              // CHUNK 이벤트에서는 statusMessage만 업데이트하고, 실제로 변경이 있을 때만 setConversations 호출
              setConversations((prev) => {
                const existingIndex = prev.findIndex((conversation) => conversation.qnaNo === qnaNo)

                // qnaNo가 없으면 생성 (최초 CHUNK 이벤트)
                if (existingIndex === -1) {
                  return ensureConversationExists(prev, qnaNo, message, {
                    statusMessage: undefined,
                    auditInfo: streamData,
                  })
                }

                const currentConversation = prev[existingIndex]

                // statusMessage가 이미 undefined면 업데이트 불필요
                if (currentConversation.statusMessage === undefined && currentConversation.qnaNo === qnaNo) {
                  return prev
                }

                // qnaNo가 null이었던 경우 업데이트
                if (currentConversation.qnaNo === null && currentConversation.question === message) {
                  const updatedConversation: IConversation = {
                    ...currentConversation,
                    qnaNo,
                    auditInfo: streamData,
                    statusMessage: undefined,
                  }
                  return [...prev.slice(0, existingIndex), updatedConversation, ...prev.slice(existingIndex + 1)]
                }

                // statusMessage만 제거
                const updatedConversation: IConversation = {
                  ...currentConversation,
                  statusMessage: undefined,
                }

                return [...prev.slice(0, existingIndex), updatedConversation, ...prev.slice(existingIndex + 1)]
              })

              break
            }

            case StreamEventType.FULLTEXT: {
              chunkManager.clearChunks(qnaNo)

              setConversations((prev) => {
                const existingIndex = prev.findIndex((conversation) => conversation.qnaNo === qnaNo)

                // qnaNo가 없으면 생성
                if (existingIndex === -1) {
                  return ensureConversationExists(prev, qnaNo, message, {
                    answer: {
                      [StreamEventType.MESSAGE]: streamData,
                    } as NonNullable<IConversation['answer']>,
                    statusMessage: undefined,
                    auditInfo: streamData,
                  })
                }

                const currentConversation = prev[existingIndex]
                const currentAnswer = currentConversation.answer ?? ({} as NonNullable<IConversation['answer']>)
                const currentMessage = currentAnswer[StreamEventType.MESSAGE]

                // answer가 이미 동일하면 업데이트 불필요
                if (currentMessage === streamData && currentConversation.statusMessage === undefined) {
                  return prev
                }

                const updatedAnswer: NonNullable<IConversation['answer']> = {
                  ...currentAnswer,
                  [StreamEventType.MESSAGE]: streamData,
                } as NonNullable<IConversation['answer']>

                const updatedConversation: IConversation = {
                  ...currentConversation,
                  answer: updatedAnswer,
                  statusMessage: undefined,
                }

                return [...prev.slice(0, existingIndex), updatedConversation, ...prev.slice(existingIndex + 1)]
              })
              break
            }

            default:
              break
          }
        } catch (error) {
          console.error('Error in handleStreamMessage:', error)
          updateState(MIAgentState.IDLE)
        }
      },
    [updateState, updateStatusMessage, t, ensureConversationExists],
  )

  const inquire = useCallback(
    async (message: string, shouldWebSearch: boolean = false) => {
      const chatRoomId = selectedChatRoom.id ?? uuid()

      // 새 채팅방이 생성된 경우 selectedChatRoom.id에 저장
      if (!selectedChatRoom.id) {
        setSelectedChatRoom((prev) => ({
          ...prev,
          id: chatRoomId,
          isNew: true,
        }))
      }

      setConversations((prev) => {
        const hasPendingQuestion = prev.some((conv) => conv.qnaNo === null && conv.question === message)
        if (hasPendingQuestion) return prev

        // 기존 대화들의 isNew를 false로 변경
        const updatedPrev = prev.map((conversation) => ({
          ...conversation,
          isNew: false,
        }))

        return [
          ...updatedPrev,
          {
            ...initialConversation,
            qnaNo: null,
            question: message,
            isNew: true,
          },
        ]
      })

      await agentService.sendQnaStream(chatRoomId, message, shouldWebSearch, createStreamMessageHandler(message))
    },
    [selectedChatRoom.id, createStreamMessageHandler],
  )

  const stop = useCallback(
    (message: string) => {
      let accumulatedMessage = message

      // conversations를 역순으로 순회하여 가장 최근 스트리밍 중인 대화 찾기
      for (let i = conversations.length - 1; i >= 0; i--) {
        const conv = conversations[i]
        if (conv.qnaNo !== null) {
          const chunks = chunkManager.getChunks(conv.qnaNo)
          if (chunks.length > 0) {
            accumulatedMessage = chunks.join('')
            accumulatedMessage +=
              '\n\n<span style="color: #ADB5BD; font-weight: 500; font-size: 14px; user-select: none;">MARI stopped answering</span>'
            break
          }
        }
      }

      if (selectedChatRoom.id) {
        agentService.cancelStream(selectedChatRoom.id, accumulatedMessage).then()
      }
    },
    [selectedChatRoom.id, conversations],
  )

  const selectedChatRoomInfo = useMemo(
    () => chatRooms?.find(({ chatRoomId }) => chatRoomId === selectedChatRoom.id),
    [chatRooms, selectedChatRoom.id],
  )

  const historyList = useMemo(() => {
    if (!chatQnaHistory?.pages || chatQnaHistory.pages.length === 0) return []
    return chatQnaHistory.pages
      .filter((page): page is IPaginationResponse<IChatQnaRes> => page !== null)
      .flatMap((page) => page.detail)
      .reverse()
  }, [chatQnaHistory?.pages])

  const prevHistoryQnaNosRef = useRef<Set<number | null>>(new Set())

  useEffect(() => {
    if (historyList.length === 0) return

    const currentQnaNos = new Set(historyList.map((conv) => conv.qnaNo))

    // qnaNo 집합이 변경되지 않았다면 업데이트하지 않음
    if (
      prevHistoryQnaNosRef.current.size === currentQnaNos.size &&
      Array.from(prevHistoryQnaNosRef.current).every((qnaNo) => currentQnaNos.has(qnaNo))
    ) {
      return
    }

    prevHistoryQnaNosRef.current = currentQnaNos

    setConversations((prev) => {
      const existingQnaNos = new Set(prev.map((conv) => conv.qnaNo))
      const newConversations = historyList.filter((conv) => !existingQnaNos.has(conv.qnaNo))

      if (newConversations.length === 0) {
        return prev
      }

      const updatedConversations = newConversations.map((conv) => ({
        ...conv,
        isNew: false,
      }))

      return [...updatedConversations, ...prev]
    })
  }, [historyList])

  return {
    state,
    inquire,
    stop,
    selectedChatRoom: selectedChatRoomInfo,
    selectedChatRoomId: selectedChatRoom.id,
    setSelectedChatRoomId,
    updateStatusMessage,
    conversations,
    chatRoom: {
      list: chatRooms,
      isLoading: chatRoomsLoading,
      refetch: refetchChatRooms,
    },
    history: {
      isLoading: isFetchingPrevHistory,
      fetchPrevHistory,
      isLast: !hasPrevHistory,
    },
  }
}

export default useMIAgent
