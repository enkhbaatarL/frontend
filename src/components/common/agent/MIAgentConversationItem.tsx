import { Box, Typography } from '@mui/material'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import MIAgentAnswer from '@/components/common/agent/MIAgentAnswer'
import style from '@/components/common/agent/MIAgentAnswer.module.scss'
import MIAgentAnswerFooter from '@/components/common/agent/MIAgentAnswerFooter'
import MIAgentMessagePrompt from '@/components/common/agent/MIAgentMessagePrompt'
import { IChatRoom, IConversation, chunkManager } from '@/hooks/useMIAgent'
import useSnackbar from '@/hooks/useSnackbar'
import agentService, { ChatRoomErrorStatus, FeedbackCd, StreamEventType } from '@/service/mi/agent'
import { parseSources, parseSuggestedQuestions } from '@/utils/agentMarkdownExtractor'

const getErrorMessage = (statusCd: string, t: (key: string) => string): string[] => {
  switch (statusCd) {
    case ChatRoomErrorStatus.FAIL_FORBIDDEN_WORDS:
      return [t('mari.error.forbiddenWords')]
    case ChatRoomErrorStatus.FAIL_EXCEED_LENGTH:
      return [t('mari.error.exceedLength')]
    case ChatRoomErrorStatus.FAIL_EXCEED_TOKEN:
      return [t('mari.error.exceedToken'), t('mari.error.exceedTokenDetail')]
    case ChatRoomErrorStatus.FAIL_TIMED_OUT:
      return [t('mari.error.timedOut')]
    case ChatRoomErrorStatus.FAIL_AGENT_COMMUNICATION:
      return [t('mari.error.agentCommunication'), t('mari.error.pleaseTryAgain')]
    default:
      return [t('mari.error.unknownError')]
  }
}

interface Props {
  conversation: IConversation
  chatRoom?: IChatRoom
  onRetry: (qnaNo: number) => void
  animationComplete: boolean
  onAnimationComplete: () => void
  isLastChat: boolean
  onSendMessage?: (message: string) => void
  contentWrapperRef?: React.RefObject<HTMLDivElement | null>
}

const ErrorMessage = ({ messages }: { messages: string[] }) => (
  <Box display={'Flex'} flexDirection={'column'} gap={1} px={'2px'} mt={3} mb={-2}>
    {messages.map((message, index) => (
      <Typography key={index} variant="mariParagraph" color="contentText.Black">
        {message}
      </Typography>
    ))}
  </Box>
)

const MIAgentConversationItem = ({
  conversation,
  chatRoom,
  onRetry,
  animationComplete,
  onAnimationComplete,
  isLastChat,
  onSendMessage,
  contentWrapperRef,
}: Props) => {
  const { showSnackbar } = useSnackbar()
  const { t } = useTranslation()
  const messageBoxRef = useRef<HTMLDivElement>(null)

  const copyableContent = useMemo(() => {
    let answerMessage = conversation.answer?.[StreamEventType.MESSAGE]
    if (answerMessage && typeof answerMessage === 'string') {
      const sources = parseSources(answerMessage)
      const suggestedQuestions = parseSuggestedQuestions(answerMessage)

      answerMessage = answerMessage.replaceAll(/<!--.*?-->/gs, '')

      if (sources && sources.length > 0) {
        // sources를 정렬하고 가상 번호 매핑 생성
        const sorted = [...sources].sort((a, b) => {
          const numA = Number.parseInt(a.index.replace(/^web_/, ''), 10) || 0
          const numB = Number.parseInt(b.index.replace(/^web_/, ''), 10) || 0
          return numA - numB
        })
        const virtualIndexMap = new Map<string, number>()
        sorted.forEach((source, index) => {
          virtualIndexMap.set(source.index, index + 1)
        })

        // 본문에 있는 [web_X] 링크를 가상 번호로 변환
        answerMessage = answerMessage.replaceAll(/\[web_(\d+)\]/g, (_, originalNum) => {
          const originalIndex = `web_${originalNum}`
          const virtualNumber = virtualIndexMap.get(originalIndex) ?? originalNum
          return `[${virtualNumber}]`
        })

        answerMessage = answerMessage.trimEnd()

        answerMessage += `\n\n## ${t('mari.agent.sources')}\n${sorted
          .map((source) => {
            const virtualNumber = virtualIndexMap.get(source.index) ?? source.index.replace(/^web_/, '')
            return `[${virtualNumber} ${source.sourceNm}](${source.url})`
          })
          .join('  \n')}`
      } else {
        answerMessage = answerMessage.replaceAll(/\[web_/gs, '[').trimEnd()
      }

      if (suggestedQuestions) {
        answerMessage += `\n\n## ${t('mari.agent.suggestedQuestions')}\n${suggestedQuestions.map((question) => `${question.text}`).join('  \n')}`
      }

      return { plain: answerMessage }
    }
    return undefined
  }, [conversation.answer, t])

  // 마지막 항목만 contentWrapperRef의 높이를 기준으로 min-height 설정
  useLayoutEffect(() => {
    const messageBox = messageBoxRef.current

    // 마지막 항목이 아니게 된 경우 기존 min-height 제거
    if (!isLastChat) {
      if (messageBox) {
        messageBox.style.minHeight = ''
      }
      return undefined
    }

    const contentWrapper = contentWrapperRef?.current
    if (!messageBox || !contentWrapper) return undefined

    // contentWrapper의 부모 컨테이너(스크롤 컨테이너) 높이를 가져옴
    const scrollContainer = contentWrapper.parentElement
    if (!scrollContainer) return undefined

    const updateMinHeight = () => {
      const containerHeight = scrollContainer.clientHeight
      // 컨테이너 높이만큼 min-height 설정 (질문이 상단으로 자연스럽게 스크롤될 수 있도록)
      messageBox.style.minHeight = `${containerHeight - 24}px`
    }

    updateMinHeight()

    const resizeObserver = new ResizeObserver(updateMinHeight)
    resizeObserver.observe(scrollContainer)

    return () => {
      resizeObserver.disconnect()
      messageBox.style.minHeight = ''
    }
  }, [contentWrapperRef, isLastChat])

  const handleFeedback = useCallback(
    async (qnaNo: number, isRecommended: boolean, feedbackCd?: FeedbackCd, feedbackComment?: string) => {
      if (!chatRoom?.chatRoomId) return

      await agentService.assessQna(chatRoom.chatRoomId, qnaNo, isRecommended, feedbackCd, feedbackComment)
    },
    [chatRoom?.chatRoomId],
  )

  useEffect(() => {
    if (conversation.statusCd?.startsWith('FAIL') && conversation.isNew && !animationComplete) {
      onAnimationComplete()

      if (conversation.statusCd === ChatRoomErrorStatus.FAIL_FORBIDDEN_WORDS) {
        showSnackbar(t('mari.snackbar.forbiddenWords'), {
          variant: 'error',
        })
      }
    }
  }, [conversation.statusCd, conversation.isNew, animationComplete, onAnimationComplete, showSnackbar, t])

  const shouldRenderAnswer =
    Boolean(conversation.answer) ||
    Boolean(conversation.statusMessage) ||
    (conversation.qnaNo !== null && chunkManager.getChunks(conversation.qnaNo).length > 0)

  const isPending = conversation.qnaNo === null && !shouldRenderAnswer

  // 메시지 ID 생성 (낙관적 업데이트 시 임시 ID 사용)
  const messageId = conversation.qnaNo === null ? `pending-${conversation.question}` : `message-${conversation.qnaNo}`

  return (
    <Box ref={messageBoxRef} display={'flex'} flexDirection={'column'} gap={'12px'} px={'12px'} id={messageId}>
      <MIAgentMessagePrompt content={conversation.question} isPending={isPending} />
      {shouldRenderAnswer && (
        <>
          <MIAgentAnswer
            conversation={conversation}
            chatRoomTitle={chatRoom?.title}
            onAnimationComplete={onAnimationComplete}
            onSendMessage={onSendMessage}
            animationComplete={animationComplete}
          />
          {conversation.answer && (!conversation.isNew || animationComplete) && (
            <Box className={clsx({ [style.fadeInUp]: conversation.isNew })}>
              <MIAgentAnswerFooter
                copyableContent={copyableContent}
                onFeedback={async (isRecommended, feedbackCd, feedbackComment) => {
                  if (conversation.qnaNo === null) return
                  await handleFeedback(conversation.qnaNo, isRecommended, feedbackCd, feedbackComment)
                }}
                initialFeedback={conversation.isRecommended ? 'like' : conversation.isNotRecommended ? 'dislike' : undefined}
                onRetry={() => {
                  if (conversation.qnaNo === null) return
                  onRetry(conversation.qnaNo)
                }}
                isLastChat={isLastChat}
              />
            </Box>
          )}
        </>
      )}
      {conversation.statusCd?.startsWith('FAIL') && !conversation.answer && (
        <>
          <ErrorMessage messages={getErrorMessage(conversation.statusCd, t)} />
          <MIAgentAnswerFooter
            copyableContent={{
              plain: getErrorMessage(conversation.statusCd, t).join('\n'),
            }}
            onFeedback={async (isRecommended, feedbackCd, feedbackComment) => {
              if (conversation.qnaNo === null) return
              await handleFeedback(conversation.qnaNo, isRecommended, feedbackCd, feedbackComment)
            }}
            initialFeedback={conversation.isRecommended ? 'like' : conversation.isNotRecommended ? 'dislike' : undefined}
            onRetry={() => {
              if (conversation.qnaNo === null) return
              onRetry(conversation.qnaNo)
            }}
            isLastChat={isLastChat}
          />
        </>
      )}
    </Box>
  )
}

export default MIAgentConversationItem
