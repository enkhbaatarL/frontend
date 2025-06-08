import { Box, Typography } from '@mui/material'
import clsx from 'clsx'
import { t } from 'i18next'
import { useCallback, useEffect } from 'react'

import MIAgentAnswer, { tableIdRegex } from '@/components/common/agent/MIAgentAnswer'
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
        showSnackbar('입력하신 내용에 서비스 이용 제한 단어가 포함되어 있습니다', {
          variant: 'error',
        })
      }
    }
  }, [conversation.statusCd, conversation.isNew, animationComplete, onAnimationComplete, showSnackbar])

  return (
    <Box display={'flex'} flexDirection={'column'} gap={'12px'} px={'12px'} id={`message-${conversation.qnaNo}`}>
      <MIAgentMessagePrompt content={conversation.question} />
      {conversation.answer && (
        <>
          <MIAgentAnswer
            isNewChat={conversation.isNew}
            bundles={conversation.answer?.bundles}
            chatRoomTitle={chatRoom?.title}
            animationComplete={animationComplete}
            onAnimationComplete={onAnimationComplete}
          />
          {(!conversation.isNew || animationComplete) && (
            <Box className={clsx({ [style.fadeInUp]: conversation.isNew })}>
              <MIAgentAnswerFooter
                copyableContent={conversation.answer?.bundles
                  ?.map((bundle) => bundle.content)
                  .join('\n---\n')
                  .replace(tableIdRegex, '')}
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
            copyableContent={getErrorMessage(conversation.statusCd).join('\n')}
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
