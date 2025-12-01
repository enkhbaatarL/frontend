import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import { CircularProgress, Grid2 as Grid, Typography } from '@mui/material'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import MIAgentFeedback from '@/components/common/agent/MIAgentFeedback'
import MIButtonMari from '@/components/common/button/MIButtonMari'
import useSnackbar from '@/hooks/useSnackbar'
import { FeedbackCd } from '@/service/mi/agent'
import { multiContentsToClipboard } from '@/utils/clipboard'
import delay from '@/utils/delay'

interface MIAgentAnswerFooterProps {
  copyableContent?: { plain: string; html?: string }
  onFeedback: (isRecommended: boolean, feedbackCd?: FeedbackCd, feedbackComment?: string) => Promise<void>
  onRetry?: () => void
  initialFeedback?: 'like' | 'dislike'
  isLastChat?: boolean
}

const MIAgentAnswerFooter = ({ copyableContent, onFeedback, onRetry, initialFeedback, isLastChat }: MIAgentAnswerFooterProps) => {
  const [copied, setCopied] = useState<boolean>(false)
  const [liked, setLiked] = useState<boolean>(initialFeedback === 'like')
  const [dislike, setDislike] = useState<boolean>(initialFeedback === 'dislike')
  const [isSubmit, setIsSubmit] = useState<boolean>(initialFeedback === 'dislike')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [submitMessage, setSubmitMessage] = useState<ReactNode>('')
  const { t } = useTranslation()

  const { showSnackbar } = useSnackbar()

  const disabled = useMemo(() => liked || dislike, [dislike, liked])

  const getIcon = () => {
    if (isLoading) return <CircularProgress size={20} />
    if (copied) return <CheckRoundedIcon style={{ color: '#343A40' }} fontSize="small" />
    return <ContentCopyIcon fontSize="small" />
  }

  useEffect(() => {
    if (isSubmit && initialFeedback !== 'dislike') {
      setSubmitMessage(<CircularProgress size={12} style={{ marginLeft: '4px' }} />)
      setTimeout(() => {
        setSubmitMessage(t('mari.answer.feedback.submitSuccess'))
      }, 1000)
    }
  }, [isSubmit, initialFeedback, t])

  return (
    <>
      <Grid py={4} container alignItems={'center'} justifyContent={'space-between'}>
        <Grid container px={1} gap={3}>
          <MIButtonMari
            icon={getIcon()}
            tooltip={copied ? t('common.copySuccess') : t('common.copy')}
            onClick={async () => {
              if (copyableContent) {
                setIsLoading(true)
                try {
                  await multiContentsToClipboard(copyableContent.plain, copyableContent.html)
                  showSnackbar(t('common.copyToClipboard'))
                  setCopied(true)
                } catch (error) {
                  showSnackbar(t('common.copyFail'), { variant: 'error' })
                  console.error('Failed to copy content:', error)
                } finally {
                  setIsLoading(false)
                  await delay(2000)
                  setCopied(false)
                }
              }
            }}
            disabled={!copyableContent}
          />
          <MIButtonMari
            icon={liked ? <ThumbUpAltIcon fontSize="small" /> : <ThumbUpAltOutlinedIcon fontSize="small" />}
            tooltip={t('mari.answer.feedback.like')}
            onClick={async () => {
              if (disabled) return

              setLiked(true)
              await onFeedback(true)
            }}
            disabled={disabled && !liked}
            sx={{
              cursor: disabled ? 'default' : 'pointer',
            }}
          />
          <MIButtonMari
            icon={dislike ? <ThumbDownAltIcon fontSize="small" /> : <ThumbDownAltOutlinedIcon fontSize="small" />}
            tooltip={t('mari.answer.feedback.dislike')}
            onClick={async () => {
              if (disabled) return
              setDislike(true)
            }}
            disabled={disabled && !dislike}
            sx={{
              cursor: disabled ? 'default' : 'pointer',
            }}
          />
          <MIButtonMari
            icon={<RefreshRoundedIcon fontSize="small" />}
            tooltip={t('mari.answer.feedback.retry')}
            onClick={onRetry}
            disabled={disabled || !onRetry || !isLastChat} // MEMO: retry 조건에 따라 마지막 채팅일 경우에만 임시 활성화
          />
        </Grid>
        <Typography color={'gray.70'} variant={'mariDescription'}>
          {t('mari.answer.disclaimer')}
        </Typography>
      </Grid>
      {dislike && !isSubmit && (
        <MIAgentFeedback
          onSubmit={async (feedbackCd: FeedbackCd, feedbackComment?: string) => {
            await onFeedback(false, feedbackCd, feedbackComment)
            setIsSubmit(true)
          }}
          onCancel={() => {
            setDislike(false)
          }}
        />
      )}
      {isSubmit && (
        <Typography variant="body2R14" color="gray.60">
          {submitMessage}
        </Typography>
      )}
    </>
  )
}

export default MIAgentAnswerFooter
