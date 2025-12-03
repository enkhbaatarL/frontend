import { Box, Typography } from '@mui/material'
import clsx from 'clsx'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import MIAgentAnswer from '@/components/common/agent/MIAgentAnswer'
import style from '@/components/common/agent/MIAgentAnswer.module.scss'
import MIAgentAnswerFooter from '@/components/common/agent/MIAgentAnswerFooter'
import MIAgentMessagePrompt from '@/components/common/agent/MIAgentMessagePrompt'
import { IChatRoom, IConversation } from '@/hooks/useMIAgent'
import useSnackbar from '@/hooks/useSnackbar'
import agentService, { ChatRoomErrorStatus, FeedbackCd } from '@/service/mi/agent'

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

const MIAgentConversationItem = ({ conversation, chatRoom, onRetry, animationComplete, onAnimationComplete, isLastChat }: Props) => {
  const { showSnackbar } = useSnackbar()
  const { t } = useTranslation()
  const [clipboardContents, setClipboardContents] = useState<{ plain: string; html?: string }>({ plain: '' })

  const bundles = conversation.answer?.bundles || []
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    const done = bundles.length === 0 || (typeof conversation?.event === 'string' && conversation?.event === 'complete')
    setIsDone(done)
  }, [bundles, conversation])
  const [currentIdx, setCurrentIdx] = useState(0)

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
  }, [conversation.statusCd, conversation.isNew, animationComplete, onAnimationComplete, showSnackbar])

  useEffect(() => {
    if (!bundles.length) return undefined
    if (isDone) {
      onAnimationComplete()
      return undefined
    }
    if (currentIdx < bundles.length - 1) {
      const timeout = setTimeout(() => {
        setCurrentIdx((prev) => prev + 1)
      }, 400)
      return () => clearTimeout(timeout)
    }

    return undefined
  }, [bundles.length, currentIdx])

  return (
    <Box display={'flex'} flexDirection={'column'} gap={'12px'} px={'12px'} id={`message-${conversation.qnaNo}`}>
      <MIAgentMessagePrompt content={conversation.question} />
      {conversation.answer && (
        <>
          <MIAgentAnswer
            isNewChat={conversation.isNew}
            eventType={conversation.event ?? undefined}
            bundles={conversation.answer?.bundles}
            chatRoomTitle={chatRoom?.title}
            onAnimationComplete={onAnimationComplete}
            onCreateCopyableContent={setClipboardContents}
          />
          {(!conversation.isNew || animationComplete) && (
            <Box className={clsx({ [style.fadeInUp]: conversation.isNew })}>
              <MIAgentAnswerFooter
                copyableContent={clipboardContents}
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
      {conversation.statusCd?.startsWith('FAIL') && (
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
