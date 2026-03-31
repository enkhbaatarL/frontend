import { CircularProgress, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { SuggestedQuestion } from '@/utils/agentMarkdownExtractor'

import suggestionIcon from '@/assets/agent/suggestion.svg'
import style from '@/components/common/agent/MIAgentAnswer.module.scss'

interface Props {
  suggestedQuestions: SuggestedQuestion[]
  isNew?: boolean
  onSendMessage?: (message: string) => void
}

const MAX_SUGGESTED_QUESTIONS_COUNT = 3

const MIAgentSuggestedQuestions = ({ suggestedQuestions, isNew, onSendMessage }: Props) => {
  const { t } = useTranslation()
  const [isShowMore, setIsShowMore] = useState<boolean>(suggestedQuestions.length <= MAX_SUGGESTED_QUESTIONS_COUNT)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const questionsList = useMemo(
    () => (isShowMore ? suggestedQuestions : suggestedQuestions.slice(0, MAX_SUGGESTED_QUESTIONS_COUNT)),
    [isShowMore, suggestedQuestions],
  )

  const handleLoadMore = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsShowMore(true)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Stack py="8px" className={isNew ? style.parsedDataContainer : undefined}>
      <Typography variant="contentTitle" color="content.textBlack">
        {t('mari.agent.suggestedQuestions')}
      </Typography>
      <Stack py="6px" gap="6px">
        {questionsList.map((question, index) => (
          <Stack
            key={question.index}
            direction="row"
            width="fit-content"
            padding="6px 8px"
            gap="6px"
            borderRadius="4px"
            className={isNew ? style.parsedDataItem : undefined}
            sx={{
              userSelect: 'none',
              cursor: 'pointer',
              animationDelay: `${index * 100}ms`,
              '&:hover': {
                backgroundColor: 'gray.20',
              },
            }}
            onClick={() => {
              onSendMessage?.(question.text)
            }}
          >
            <img src={suggestionIcon} alt="suggestion" draggable={false} />
            <Typography variant="body2M14" color="content.textBlack">
              {question.text}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {!isShowMore && (
        <Stack mt="12px" direction="row" alignItems="center" gap="8px" sx={{ userSelect: 'none' }}>
          {isLoading ? (
            <CircularProgress size={16} sx={{ color: 'gray.70' }} />
          ) : (
            <Typography
              variant="body2M14"
              color="gray.70"
              onClick={handleLoadMore}
              sx={{
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                '&:hover': {
                  color: isLoading ? 'gray.70' : 'gray.90',
                  textDecoration: isLoading ? 'none' : 'underline',
                },
              }}
            >
              Show more
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  )
}

export default MIAgentSuggestedQuestions
