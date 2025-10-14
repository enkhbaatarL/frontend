import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl, Stack, TextField } from '@mui/material'
import { useEffect, useMemo, useState, useRef, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

import MIButton from '@/components/common/button/MIButton'
import { useScroll } from '@/contexts/ScrollContext'
import { FeedbackCd } from '@/service/mi/agent'

export interface MIAgentFeedbackProps {
  onSubmit: (feedbackCd: FeedbackCd, feedbackComment?: string) => Promise<void>
  onCancel: () => void
}

const MIAgentFeedbackBak = ({ onSubmit, onCancel }: MIAgentFeedbackProps) => {
  const [feedbackCd, setFeedbackCd] = useState<FeedbackCd>()
  const [comment, setComment] = useState('')
  const [buttonDisabled, setButtonDisabled] = useState(false)
  const { scrollRef } = useScroll()
  const boxRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const FeedbackOptions = useMemo(
    () => [
      {
        id: FeedbackCd.BUG_ISSUE,
        label: t('mari.answer.feedback.detail.bugIssue'),
      },
      {
        id: FeedbackCd.NO_POSSIBLE_RESPONSE,
        label: t('mari.answer.feedback.detail.noPossibleResponse'),
      },
      {
        id: FeedbackCd.NOT_FOLLOW_REQUEST,
        label: t('mari.answer.feedback.detail.notFollowRequest'),
      },
      {
        id: FeedbackCd.INACCURATE_INFORMATION,
        label: t('mari.answer.feedback.detail.inaccurateInformation'),
      },
      {
        id: FeedbackCd.INCOMPLETE_RESPONSE,
        label: t('mari.answer.feedback.detail.incompleteResponse'),
      },
      {
        id: FeedbackCd.OTHER,
        label: t('mari.answer.feedback.detail.other'),
      },
    ],
    [t],
  )

  useEffect(() => {
    if (!boxRef.current || !scrollRef.current) return () => {}

    const resizeObserver = new ResizeObserver((entries) => {
      for (const _entry of entries) {
        const box = boxRef.current
        const scroll = scrollRef.current

        if (!box || !scroll) return

        const boxRect = box.getBoundingClientRect()
        const scrollRect = scroll.getBoundingClientRect()

        if (boxRect.bottom > scrollRect.bottom) {
          const scrollTop = scroll.scrollTop + (boxRect.bottom - scrollRect.bottom) + 18 // 여백 18px 추가 (marginY 보정)
          scroll.scrollTo({
            top: scrollTop,
            behavior: 'smooth',
          })
        }
      }
    })

    resizeObserver.observe(boxRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [scrollRef])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFeedbackCd(event.target.value as FeedbackCd)
  }

  const handleSubMIt = async () => {
    if (feedbackCd) {
      const feedbackComment = feedbackCd === FeedbackCd.OTHER ? comment.trim() : undefined

      setButtonDisabled(true)
      await onSubmit(feedbackCd, feedbackComment)
      setButtonDisabled(false)
    }
  }

  const disabledSubmit = useMemo(() => !feedbackCd || (feedbackCd === FeedbackCd.OTHER && !comment), [feedbackCd, comment])

  return (
    <Box
      ref={boxRef}
      sx={{
        display: 'flex',
        width: '100%',
        minWidth: '450px',
        maxWidth: '800px',
        minHeight: '186px',
        maxHeight: '800px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderRadius: '12px',
        border: '1px solid #DEE2E6',
        background: '#FFF',
        padding: '20px',
        boxSizing: 'border-box',
        ' p': {
          margin: '0 !important',
        },
      }}
    >
      <Box mb={7.5}>
        <Typography variant="contentTitle" color="gray.70" component={'div'}>
          Feedback
        </Typography>
        <Typography variant="body2R14" color="gray.60">
          {t('mari.answer.feedback.detail.reason')}
        </Typography>
      </Box>

      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <RadioGroup value={feedbackCd ?? ''} onChange={handleChange}>
          {FeedbackOptions.map((option) => (
            <FormControlLabel
              key={option.id}
              value={option.id}
              control={<Radio size="small" />}
              label={
                <Typography variant="body2M14" sx={{ ml: 0.5 }}>
                  {option.label}
                </Typography>
              }
              sx={{ mb: 1 }}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {feedbackCd === FeedbackCd.OTHER && (
        <TextField
          fullWidth={true}
          placeholder={t('mari.answer.feedback.detail.placeholder')}
          rows={4}
          multiline
          sx={{ mb: 2 }}
          onChange={(e) => setComment(e.target.value)}
        />
      )}

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3, width: '100%' }}>
        <MIButton type={'outlined'} color={'gray'} size="h34" onClick={onCancel} disabled={buttonDisabled}>
          {t('common.cancel')}
        </MIButton>
        <MIButton type={'filled'} color={'primary'} size="h34" onClick={handleSubMIt} disabled={disabledSubmit || buttonDisabled}>
          {t('common.confirm')}
        </MIButton>
      </Stack>
    </Box>
  )
}

export default MIAgentFeedbackBak
