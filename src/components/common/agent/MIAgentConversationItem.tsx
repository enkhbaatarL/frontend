import { Box, Typography } from '@mui/material'
import clsx from 'clsx'
import { t } from 'i18next'
import { useCallback, useEffect, useState } from 'react'

import MIAgentAnswer from '@/components/common/agent/MIAgentAnswer'
import style from '@/components/common/agent/MIAgentAnswer.module.scss'
import MIAgentAnswerFooter from '@/components/common/agent/MIAgentAnswerFooter'
import MIAgentMessagePrompt from '@/components/common/agent/MIAgentMessagePrompt'
import { IChatRoom, IConversation } from '@/hooks/useMIAgent'
import useSnackbar from '@/hooks/useSnackbar'
import agentService, { ChatRoomErrorStatus, FeedbackCd } from '@/service/mi/agent'

const getErrorMessage = (statusCd: string): string[] => {
  switch (statusCd) {
    case ChatRoomErrorStatus.FAIL_FORBIDDEN_WORDS:
      return [t('금지된 단어가 포함되어 있어 답변을 생성할 수 없습니다.')]
    case ChatRoomErrorStatus.FAIL_EXCEED_LENGTH:
      return [t('질문 길이가 제한을 초과했습니다.')]
    case ChatRoomErrorStatus.FAIL_EXCEED_TOKEN:
      return [t('사용 가능한 크레딧이 모두 소진되었습니다.'), t('자세한 사항은 관리자에게 문의해 주세요.')]
    case ChatRoomErrorStatus.FAIL_TIMED_OUT:
      return [t('요청 시간이 초과되었습니다. 다시 시도해 주세요.')]
    case ChatRoomErrorStatus.FAIL_AGENT_COMMUNICATION:
      return [t('지금은 서버 연결이 원활하지 않습니다.'), t('잠시 후 다시 시도해 주세요.')]
    default:
      return [t('알 수 없는 오류가 발생했습니다.')]
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
  const [clipboardContents, setClipboardContents] = useState<{ plain: string; html?: string }>({ plain: '' })

  const bundles = conversation.answer?.bundles || []
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    const done = bundles.length == 0 || (typeof conversation?.event === 'string' && conversation?.event ==='complete')
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
        showSnackbar('입력하신 내용에 서비스 이용 제한 단어가 포함되어 있습니다.', {
          variant: 'error',
        })
      }
    }
  }, [conversation.statusCd, conversation.isNew, animationComplete, onAnimationComplete, showSnackbar])


  useEffect(() => {
    if (!bundles.length) return
    if (isDone) {
      onAnimationComplete()
      return
    }
    if (currentIdx < bundles.length -1) {
      const timeout = setTimeout(() => {
        setCurrentIdx((prev) => prev+1) 

      },400)
      return () => clearTimeout(timeout)
    }
  }, [bundles.length , currentIdx])

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
          <ErrorMessage messages={getErrorMessage(conversation.statusCd)} />
          <MIAgentAnswerFooter
            copyableContent={{
              plain: getErrorMessage(conversation.statusCd).join('\n'),
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
