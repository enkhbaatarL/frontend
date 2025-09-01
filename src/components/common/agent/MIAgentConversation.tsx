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
}

const MIAgentConversation = ({ conversations, chatRoom, onRetry, animationComplete, onAnimationComplete, onScroll, loading }: Props) => {
  const { scrollRef } = useScroll()
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (containerRef.current) {
      scrollRef.current = containerRef.current
    }
  }, [scrollRef])

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
          scrollbarWidth: 'thin',
          scrollbarColor: '#CED4DA transparent',
          pointerEvents: loading ? 'none' : 'auto',
          touchAction: loading ? 'none' : 'auto',
          userSelect: loading ? 'none' : 'auto',
          WebkitUserSelect: loading ? 'none' : 'auto',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#CED4DA',
            borderRadius: '10px',
          },
        }}
        onScroll={(e) => {
          if (!loading && onScroll) {
            onScroll(e)
          }
        }}
      >
        {conversations.map((conversation, index) => (
            <MIAgentConversationItem
              key={`${conversation.qnaNo}-${index}`}

              conversation={conversation}
              chatRoom={chatRoom}
              onRetry={onRetry}
              animationComplete={animationComplete[index]}
              onAnimationComplete={() => onAnimationComplete(index)}
              isLastChat={index === conversations.length - 1}
            />
        ))}
      </Box>
    </Box>
  )
}

export default MIAgentConversation
