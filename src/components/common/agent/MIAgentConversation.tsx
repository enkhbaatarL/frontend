import { Box } from '@mui/material'
import { useLayoutEffect, useRef, UIEvent } from 'react'

import MIAgentConversationItem from '@/components/common/agent/MIAgentConversationItem'
import GradientOverlay from '@/components/common/gradient/GradientOverlay'
import { useScroll } from '@/contexts/ScrollContext'
import { IChatRoom, IConversation } from '@/hooks/useMIAgent'

interface Props {
  conversations: IConversation[]
  chatRoom?: IChatRoom
  onRetry: (qnaNo: number) => void
  animationComplete: boolean[]
  onAnimationComplete: (index: number) => void
  onScroll?: (e: UIEvent<HTMLDivElement>) => void
  loading?: boolean
  windowExpend?: boolean
  onSendMessage?: (message: string) => void
  hideScrollbar?: boolean
}

const MIAgentConversation = ({
  conversations,
  chatRoom,
  onRetry,
  animationComplete,
  onAnimationComplete,
  onScroll,
  loading,
  windowExpend = false,
  onSendMessage,
  hideScrollbar = false,
}: Props) => {
  const { scrollRef } = useScroll()
  const containerRef = useRef<HTMLDivElement>(null)
  const contentWrapperRef = useRef<HTMLDivElement>(null)
  const previousStatusMessagesRef = useRef<Map<number | null, string | undefined>>(new Map())
  const scrollPositionRef = useRef<number>(0)
  const isStatusMessageUpdateRef = useRef<boolean>(false)
  const lastConversationCountRef = useRef<number>(0)
  const skipScrollPreservationUntilRef = useRef<number>(0) // 스크롤 위치 보존을 건너뛸 시간 (timestamp)
  const shouldMaintainBottomRef = useRef<boolean>(false) // statusMessage 업데이트 시 bottom 유지 여부

  useLayoutEffect(() => {
    if (containerRef.current) {
      scrollRef.current = containerRef.current
    }
  }, [scrollRef])

  // statusMessage 변경 감지 및 스크롤 위치 보존
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const currentConversationCount = conversations.length
    const hasNewConversation = currentConversationCount > lastConversationCountRef.current
    lastConversationCountRef.current = currentConversationCount

    // 상태 업데이트 시 스크롤 중단 방지
    if (hasNewConversation) {
      skipScrollPreservationUntilRef.current = Date.now() + 1000
    }

    const currentStatusMessages = new Map<number | null, string | undefined>()
    for (const conv of conversations) {
      currentStatusMessages.set(conv.qnaNo, conv.statusMessage)
    }

    let hasStatusMessageChange = false
    for (const [qnaNo, statusMessage] of currentStatusMessages.entries()) {
      const previousStatusMessage = previousStatusMessagesRef.current.get(qnaNo)
      if (previousStatusMessage !== statusMessage) {
        hasStatusMessageChange = true
        break
      }
    }

    const distanceFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop
    const isAtBottom = distanceFromBottom <= 20
    const shouldSkipPreservation = Date.now() < skipScrollPreservationUntilRef.current

    if (hasStatusMessageChange) {
      if (isAtBottom) {
        // bottom에 있을 때는 statusMessage 업데이트 후에도 bottom 유지
        shouldMaintainBottomRef.current = true
      } else if (!shouldSkipPreservation) {
        // bottom이 아니고 스킵 기간이 지났으면 스크롤 위치 보존
        isStatusMessageUpdateRef.current = true
        scrollPositionRef.current = container.scrollTop
      }
    }

    previousStatusMessagesRef.current = currentStatusMessages
  }, [conversations])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) {
      isStatusMessageUpdateRef.current = false
      shouldMaintainBottomRef.current = false
      return
    }

    // statusMessage 업데이트로 인한 스크롤 위치 보존
    if (isStatusMessageUpdateRef.current) {
      requestAnimationFrame(() => {
        if (container && scrollPositionRef.current > 0) {
          container.scrollTop = scrollPositionRef.current
          isStatusMessageUpdateRef.current = false
        }
      })
    }

    // bottom 유지가 필요한 경우 (statusMessage 업데이트로 DOM 높이가 변경되었을 때)
    if (shouldMaintainBottomRef.current) {
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - container.clientHeight
          shouldMaintainBottomRef.current = false
        }
      })
    }
  }, [conversations])

  return (
    <Box
      overflow={'hidden'}
      sx={{
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        paddingX: '12px',
        userSelect: loading ? 'none' : 'auto',
        WebkitUserSelect: loading ? 'none' : 'auto',
      }}
    >
      <GradientOverlay color={'#F9F8F6'} />
      <Box
        ref={containerRef}
        sx={{
          height: '100%',
          flex: 1,
          paddingY: '12px',
          overflowY: 'auto',
          scrollbarWidth: hideScrollbar ? 'none' : 'thin',
          scrollbarColor: hideScrollbar ? 'transparent transparent' : '#CED4DA transparent',
          pointerEvents: loading ? 'none' : 'auto',
          touchAction: loading ? 'none' : 'auto',
          userSelect: loading ? 'none' : 'auto',
          WebkitUserSelect: loading ? 'none' : 'auto',
          '&::-webkit-scrollbar': {
            width: hideScrollbar ? '0px' : '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: hideScrollbar ? 'transparent' : '#CED4DA',
            borderRadius: '10px',
          },
        }}
        onScroll={(e) => {
          if (!loading && onScroll) {
            onScroll(e)
          }
          const container = e.currentTarget
          scrollPositionRef.current = container.scrollTop
        }}
      >
        <Box ref={contentWrapperRef}>
          {conversations.map((conversation, index) => (
            <Box key={`${conversation.qnaNo}-${index}`} px={windowExpend ? '28px' : undefined}>
              <MIAgentConversationItem
                conversation={conversation}
                chatRoom={chatRoom}
                onRetry={onRetry}
                animationComplete={animationComplete[index]}
                onAnimationComplete={() => onAnimationComplete(index)}
                isLastChat={index === conversations.length - 1}
                onSendMessage={onSendMessage}
                contentWrapperRef={contentWrapperRef}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default MIAgentConversation
