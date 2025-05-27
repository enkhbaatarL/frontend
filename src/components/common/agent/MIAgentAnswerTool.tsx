import { Grid2 as Grid, Typography } from '@mui/material'
import { useState } from 'react'

import MIAgentFeedback from './MIAgentFeedback'

import MIButtonMari from '@/components/common/button/MIButtonMari'
import MIChip from '@/components/common/chip/MIChip'
type Props = {
  sources?: string[]
  onClick?: (action: 'copy' | 'like' | 'dislike' | 'refresh') => void
  scrolToBottom?: () => void
}
const MIAgentAnswerTool = ({ sources, onClick, scrolToBottom }: Props) => {
  const [copied, setCopied] = useState<boolean>(false)
  const [liked, setLiked] = useState<boolean>(false)
  const [dislike, setDislike] = useState<boolean>(false)
  const [isSubmit, setIsSubmit] = useState<boolean>(false)

  const handleClick = (action: 'copy' | 'like' | 'dislike' | 'refresh') => () => {
    if (action === 'copy') setCopied(true)
    if (action === 'like') {
      if (!liked) {
        setDislike(false)
        setIsSubmit(false)
      }
      setLiked(!liked)
    }
    if (action === 'dislike') {
      if (!dislike) {
        setLiked(false)
      } else {
        setIsSubmit(false)
      }
      setDislike(!dislike)
    }
    if (scrolToBottom) {
      scrolToBottom()
    }
    onClick?.(action)
  }

  const feedbackOptions = [
    { id: 'incorrect', label: '잘못 응답' },
    { id: 'harmful', label: '유해한 정보나 내용' },
    { id: 'not_helpful', label: '도움이 되지 않는 대답' },
    { id: 'other_reason', label: '다른 이유로 마음에 들지 않음' },
    { id: 'other', label: '기타' },
  ]

  const handleSubmit = () => {
    setIsSubmit(true)
  }

  const handleCancel = () => {
    setIsSubmit(false)
    setDislike(false)
  }

  const handleChange = () => {
    if (scrolToBottom) {
      scrolToBottom()
    }
  }

  return (
    <>
      {sources && sources.length > 0 && (
        <Grid px={1.5} paddingBottom={1.5} pt={6} container gap={1.5} alignItems={'center'}>
          <Typography color={'gray.70'} variant={'mariDescription'}>
            출처
          </Typography>
          <Grid container gap={1.5} alignItems={'center'}>
            {sources.map((source, index) => (
              <MIChip key={index} size={'h24'} color={'gray'} type={'mari'} label={source} />
            ))}
          </Grid>
        </Grid>
      )}
      <Grid py={4} container alignItems={'center'} justifyContent={'space-between'}>
        <Grid container px={1} gap={3}>
          <MIButtonMari onClick={handleClick('copy')} action={!copied ? 'copy' : 'copied'} />
          <MIButtonMari onClick={handleClick('like')} active={liked} action="like" />
          <MIButtonMari onClick={handleClick('dislike')} active={dislike} action="dislike" />
          <MIButtonMari onClick={handleClick('refresh')} action="refresh" />
        </Grid>
        <Typography color={'gray.70'} variant={'mariDescription'}>
          AI 응답은 검토 후 활용하시기 바랍니다
        </Typography>
      </Grid>
      {dislike && !isSubmit && (
        <MIAgentFeedback onChange={handleChange} options={feedbackOptions} onSubMIt={handleSubmit} onCancel={handleCancel} />
      )}
      {isSubmit && (
        <Typography variant="body2R14" color="gray.60">
          피드백이 제출되었습니다.
        </Typography>
      )}
    </>
  )
}

export default MIAgentAnswerTool
