import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { useScroll } from '@/contexts/ScrollContext'
import agentService, { IChatQnaRes, IChatRoomRes } from '@/service/mi/agent'
import { IPaginationResponse } from '@/types/api'
import delay from '@/utils/delay'

export type MIAgentState = 'default' | 'generating' | 'complete'

export interface IConversation extends IChatQnaRes {
  isNew?: boolean
}

export interface IChatRoom extends IChatRoomRes {
  isSelected: boolean
  isNew: boolean
}

const getTempConversation = (message: string): IConversation => ({
  qnaNo: null,
  question: message,
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
})

const useMIAgent = () => {
  const [state, setState] = useState<MIAgentState>('default')
  const [selectedChatRoom, setSelectedChatRoom] = useState<{ id: string | null; isNew: boolean }>({
    id: null,
    isNew: true,
  })
  const [conversations, setConversations] = useState<IConversation[]>([])
  const { scrollToBottom } = useScroll()
  const {
    data: chatRooms,
    refetch: refetchChatRooms,
    isLoading: chatRoomsLoading,
  } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: () => agentService.getChatRooms(),
  })

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

  const setSelectedChatRoomId = useCallback(
    (id: string | null, isNew: boolean = false) => {
      setConversations([])
      setSelectedChatRoom({ id, isNew })
    },
    [setSelectedChatRoom],
  )

  const pushConversations = useCallback((newChat: IConversation) => {
    setConversations((prev) => [
      ...prev.map((conversation) => ({
        ...conversation,
        isNew: false,
      })),
      {
        ...newChat,
        isNew: true,
      },
    ])
  }, [])

  const replaceConversations = useCallback((newChat: IConversation, index?: number) => {
    setConversations((prev) => [
      ...prev.slice(0, index ?? prev.length - 1),
      {
        ...newChat,
        isNew: true,
      },
    ])
  }, [])

  const inquire = useCallback(
    async (message: string, shouldWebSearch: boolean = false) => {
      try {
        setConversations((prev) => [...prev, getTempConversation(message)])
        setState('generating')
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToBottom()
          }, 200)
        })
        const newChatRoomId = selectedChatRoom.id ?? uuid()
        const newChat = await agentService.sendQna(newChatRoomId, message, shouldWebSearch)
        if (selectedChatRoom.isNew) {
          refetchChatRooms()
          setSelectedChatRoom((prev) => ({
            ...prev,
            id: newChatRoomId,
          }))
        }
        setState('complete')
        await delay(1000)
        setState('default')
        replaceConversations(newChat)
      } catch (error) {
        console.error('Error in inquire:', error)
      }
    },
    [replaceConversations, scrollToBottom, selectedChatRoom.id, selectedChatRoom.isNew, refetchChatRooms],
  )

  const retry = useCallback(
    async (qnaNo: number) => {
      const index = conversations.findIndex((conv) => conv.qnaNo === qnaNo)

      if (!selectedChatRoom.id || index === -1) return

      try {
        replaceConversations(getTempConversation(conversations[index].question), index)
        setState('generating')
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToBottom()
          }, 200)
        })
        const newChat = await agentService.retryQna(selectedChatRoom.id, qnaNo)
        setState('complete')
        await delay(1000)
        setState('default')
        replaceConversations(newChat, index)
      } catch (error) {
        console.error('Error in retryInquire:', error)
      }
    },
    [conversations, replaceConversations, scrollToBottom, selectedChatRoom.id],
  )

  const chatRoomList = useMemo(
    () =>
      chatRooms?.map(
        (room): IChatRoom => ({
          ...room,
          isSelected: room.chatRoomId === selectedChatRoom.id,
          isNew: room.chatRoomId === selectedChatRoom.id && selectedChatRoom.isNew,
        }),
      ) ?? [],
    [chatRooms, selectedChatRoom.id, selectedChatRoom.isNew],
  )

  const selectedChatRoomInfo = useMemo(() => chatRoomList.find(({ isSelected }) => isSelected), [chatRoomList])

  const historyList = useMemo(
    () =>
      chatQnaHistory?.pages
        .filter((page): page is IPaginationResponse<IChatQnaRes> => page !== null)
        .flatMap((page) => page.detail)
        .reverse() ?? [],
    [chatQnaHistory?.pages],
  )

  useEffect(() => {
    if (historyList.length > 0) {
      const isDuplicate = conversations.map((conv) => conv.qnaNo).includes(historyList[0].qnaNo)

      if (isDuplicate) {
        fetchPrevHistory()
        return
      }

      setConversations((prev) => {
        const existingQnaNos = new Set(prev.map((conv) => conv.qnaNo))
        const newConversations = historyList.filter((conv) => !existingQnaNos.has(conv.qnaNo))
        return [...newConversations, ...prev]
      })
    }
  }, [historyList])

  const markLastConversationAsOld = useCallback(() => {
    setConversations((prev) => {
      if (prev.length === 0) return prev
      const newConversations = [...prev]
      newConversations[newConversations.length - 1].isNew = false
      return newConversations
    })
  }, [])

  return {
    state,
    inquire,
    retry,
    chatRoom: {
      list: chatRoomList,
      isLoading: chatRoomsLoading,
      refetch: refetchChatRooms,
    },
    selectedChatRoom: selectedChatRoomInfo,
    setSelectedChatRoomId,
    conversations,
    pushConversations,
    markLastConversationAsOld,
    history: {
      isLoading: isFetchingPrevHistory,
      fetchPrevHistory,
      isLast: !hasPrevHistory,
    },
  }
}

export default useMIAgent
