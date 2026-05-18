import ModeCommentIcon from '@mui/icons-material/ModeComment'
import { Box, Stack, Typography } from '@mui/material'
import { useCallback, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIMaskInput from '@/components/common/input/MIMaskInput'
import MIMorphingPopup, { type MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import useSnackbar from '@/hooks/useSnackbar'
import userFeedbackService, { type UserFeedbackTypeCd } from '@/service/common/userFeedback'

const FEEDBACK_MAX_LENGTH = 2000

const FEEDBACK_OPTIONS = [
  { value: 'data_error', label: '데이터 오류' },
  { value: 'ui_improvement', label: 'UI 개선' },
  { value: 'feature_suggestion', label: '기능 제안' },
  { value: 'etc', label: '기타' },
] as const

interface ScenarioWorkbenchUserFeedbackProps {
  pageName: string
  sectionName: string
}

const ScenarioWorkbenchUserFeedback = ({ pageName, sectionName }: ScenarioWorkbenchUserFeedbackProps) => {
  const popupRef = useRef<MIMorphingPopupRef>(null)
  const { showSnackbar } = useSnackbar()
  const [feedbackType, setFeedbackType] = useState<UserFeedbackTypeCd>('data_error')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pageLabel = `${pageName}/ ${sectionName}`

  const resetFeedback = useCallback(() => {
    setFeedbackType('data_error')
    setComment('')
  }, [])

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true)
      await userFeedbackService.createUserFeedback({
        feedbackPageNm: pageName,
        feedbackSectionNm: sectionName,
        feedbackTypeCd: feedbackType,
        feedbackContent: comment.trim() || undefined,
      })
      showSnackbar('피드백이 전송되었습니다.', { variant: 'success' })
      popupRef.current?.close()
    } catch {
      showSnackbar('피드백 전송에 실패했습니다.', { variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }, [comment, feedbackType, pageName, sectionName, showSnackbar])

  return (
    <MIMorphingPopup
      ref={popupRef}
      display="inline-flex"
      popup={{
        title: '사용자 피드백',
        content: (
          <Stack width="100%" boxSizing="border-box">
            <Stack gap="20px" px="24px" width="100%" boxSizing="border-box">
              <Stack gap="8px" alignItems="flex-start">
                <Typography variant="body2SB14" color="contentText.Normal">
                  페이지
                </Typography>
                <Typography variant="body2M14" color="contentText.Normal" noWrap maxWidth="100%">
                  {pageLabel}
                </Typography>
              </Stack>

              <Stack gap="8px" alignItems="flex-start">
                <Typography variant="body2SB14" color="contentText.Normal">
                  피드백 유형
                </Typography>
                <Stack direction="row" gap="5px" alignItems="center" flexWrap="wrap">
                  {FEEDBACK_OPTIONS.map((option) => {
                    const selected = feedbackType === option.value

                    return (
                      <Box
                        key={option.value}
                        component="button"
                        type="button"
                        onClick={() => setFeedbackType(option.value)}
                        sx={{
                          border: '1px solid',
                          borderColor: selected ? 'contentBorder.Primaryactive' : 'contentBorder.Normal',
                          borderRadius: '100px',
                          backgroundColor: selected ? 'contentBG.PrimaryFade' : 'commonColor.White',
                          color: selected ? 'contentText.Black' : 'contentText.Normal',
                          cursor: 'pointer',
                          padding: '6px 10px',
                          height: '32px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.15s ease-in-out, border-color 0.15s ease-in-out',
                          '&:hover': {
                            borderColor: selected ? 'contentBorder.Primaryactive' : 'contentBorder.Hover',
                            backgroundColor: selected ? 'contentBG.PrimaryFade' : 'contentBG.Hover',
                          },
                        }}
                      >
                        <Typography
                          component="span"
                          variant={selected ? 'body2SB14' : 'body2M14'}
                          color="inherit"
                          noWrap
                          sx={{ minWidth: 0 }}
                        >
                          {option.label}
                        </Typography>
                      </Box>
                    )
                  })}
                </Stack>
              </Stack>

              <MIMaskInput
                label="의견 내용"
                value={comment}
                placeholder="이 화면에서 경험한 문제나 개선 아이디어를 자유롭게 작성해 주세요."
                multiline
                rows={12}
                maxLength={FEEDBACK_MAX_LENGTH}
                onInput={(event) => {
                  setComment((event.target as HTMLTextAreaElement).value.slice(0, FEEDBACK_MAX_LENGTH))
                }}
                onUpdateValue={(value) => setComment((value ?? '').slice(0, FEEDBACK_MAX_LENGTH))}
              />
            </Stack>

            <Stack direction="row" justifyContent="flex-end" alignItems="center" gap="10px" px="20px" pt="30px" pb="20px">
              <MIBaseButton variant="outlined" onClick={() => popupRef.current?.close()} disabled={isSubmitting} sx={{ height: 34 }}>
                취소
              </MIBaseButton>
              <MIBaseButton
                variant="contained"
                color="primary"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                sx={{ height: 34 }}
              >
                보내기
              </MIBaseButton>
            </Stack>
          </Stack>
        ),
        hideHeaderLine: true,
        showSkeleton: false,
        minWidth: 360,
        maxWidth: 1020,
        useInternalScroll: true,
        onClose: resetFeedback,
      }}
    >
      <MIBaseButton
        variant="outlined"
        aria-label="사용자 피드백"
        onClick={() => popupRef.current?.open()}
        sx={{
          height: '36px',
          padding: '8px',
          color: 'contentIcon.Enabled',
        }}
        enableHoverBackground
      >
        <ModeCommentIcon sx={{ fontSize: 20, color: 'inherit' }} />
      </MIBaseButton>
    </MIMorphingPopup>
  )
}

export default ScenarioWorkbenchUserFeedback
