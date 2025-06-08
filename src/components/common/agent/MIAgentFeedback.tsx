import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl, Stack, TextField } from '@mui/material'
import { t } from 'i18next'
import { useEffect, useMemo, useState, useRef } from 'react'

import type React from 'react'

import MIButton from '@/components/common/button/MIButton'
import { useScroll } from '@/contexts/ScrollContext'
import { FeedbackCd } from '@/service/mi/agent'

const FeedbackOptions = [
  {
    id: FeedbackCd.BUG_ISSUE,
    label: '버그문제',
  },
  {
    id: FeedbackCd.NO_POSSIBLE_RESPONSE,
    label: '가능한 응답이 없음',
  },
  {
    id: FeedbackCd.NOT_FOLLOW_REQUEST,
    label: '요청에 제대로 따르지 않음',
  },
  {
    id: FeedbackCd.INACCURATE_INFORMATION,
    label: '정보가 정확하지 않음',
  },
  {
    id: FeedbackCd.INCOMPLETE_RESPONSE,
    label: '응답이 완전하지 않음',
  },
  {
    id: FeedbackCd.OTHER,
    label: '기타',
  },
]

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
          const scrollTop = scroll.scrollTop + (boxRect.bottom - scrollRect.bottom)
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          {t('어떤 점이 불만족스러우셨나요? 알려주시면 개선하겠습니다.')}
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
          placeholder={t('불만족 사유 입력')}
          rows={4}
          multiline
          sx={{ mb: 2 }}
          onChange={(e) => setComment(e.target.value)}
        />
      )}

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3, width: '100%' }}>
        <MIButton type={'outlined'} color={'gray'} size="h34" onClick={onCancel} disabled={buttonDisabled}>
          {t('취소')}
        </MIButton>
        <MIButton type={'filled'} color={'primary'} size="h34" onClick={handleSubMIt} disabled={disabledSubmit || buttonDisabled}>
          {t('확인')}
        </MIButton>
      </Stack>
    </Box>
  )
}

export default MIAgentFeedbackBak
