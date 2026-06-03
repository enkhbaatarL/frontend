import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ModeCommentIcon from '@mui/icons-material/ModeComment'
import { Box, Stack, Typography } from '@mui/material'
import { useCallback, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIMaskInput from '@/components/common/input/MIMaskInput'
import MIMenu from '@/components/common/menu/MIMenu'
import useSnackbar from '@/hooks/useSnackbar'
import userFeedbackService, { type UserFeedbackTypeCd } from '@/service/common/userFeedback'

const FEEDBACK_MAX_LENGTH = 2000

const FEEDBACK_OPTIONS = [
  { value: 'data_error', label: '데이터 오류' },
  { value: 'ui_improvement', label: 'UI 개선' },
  { value: 'feature_suggestion', label: '기능 제안' },
  { value: 'etc', label: '기타' },
] as const

const DEFAULT_FEEDBACK_TYPES: UserFeedbackTypeCd[] = ['data_error']

interface NextGenMIUserFeedbackProps {
  pageName: string
  sectionName: string
  targetLabel?: string
}

const NextGenMIUserFeedback = ({ pageName, sectionName, targetLabel }: NextGenMIUserFeedbackProps) => {
  const { showSnackbar } = useSnackbar()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [feedbackTypes, setFeedbackTypes] = useState<UserFeedbackTypeCd[]>(() => [...DEFAULT_FEEDBACK_TYPES])
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const targetScreenLabel = targetLabel ?? `${pageName}/ ${sectionName}`

  const resetFeedback = useCallback(() => {
    setFeedbackTypes([...DEFAULT_FEEDBACK_TYPES])
    setComment('')
  }, [])

  const closeFeedbackMenu = useCallback(() => {
    setIsMenuOpen(false)
    resetFeedback()
  }, [resetFeedback])

  const handleToggleFeedbackType = useCallback((value: UserFeedbackTypeCd) => {
    setFeedbackTypes((prev) => {
      if (!prev.includes(value)) return [...prev, value]
      return prev.length === 1 ? prev : prev.filter((item) => item !== value)
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true)
      const feedbackContent = comment.trim() || undefined
      await Promise.all(
        feedbackTypes.map((feedbackTypeCd) =>
          userFeedbackService.createUserFeedback({
            feedbackPageNm: pageName,
            feedbackSectionNm: sectionName,
            feedbackTypeCd,
            feedbackContent,
          }),
        ),
      )
      showSnackbar('피드백이 전송되었습니다.', { variant: 'success' })
      closeFeedbackMenu()
    } catch {
      showSnackbar('피드백 전송에 실패했습니다.', { variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }, [closeFeedbackMenu, comment, feedbackTypes, pageName, sectionName, showSnackbar])

  return (
    <MIMenu
      open={isMenuOpen}
      onOpenChange={setIsMenuOpen}
      onClose={resetFeedback}
      placement="bottom-start"
      menuPositionOffset={{ top: 8 }}
      variant="outlined"
      aria-label="사용자 피드백"
      label={<ModeCommentIcon sx={{ fontSize: 20, color: 'inherit' }} />}
      enableHoverBackground
      paperProps={{
        style: {
          border: '1px solid #DEE2E6',
          boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
        },
        sx: { width: '600px', overflow: 'hidden' },
      }}
      sx={{
        width: '36px',
        minWidth: '36px',
        height: '36px',
        padding: '8px',
        color: 'contentIcon.Enabled',
      }}
    >
      <Stack width="600px" minHeight="612px" boxSizing="border-box">
        <Stack gap="20px" padding="20px" width="100%" boxSizing="border-box" flex={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body1SB16" color="contentText.Black">
              사용자 피드백
            </Typography>
            <MIBaseButton
              variant="text"
              aria-label="피드백 메뉴 닫기"
              onClick={closeFeedbackMenu}
              disabled={isSubmitting}
              sx={{
                width: '24px',
                minWidth: '24px',
                height: '24px',
                padding: '2px',
                color: 'contentIcon.Enabled',
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 20, color: 'inherit' }} />
            </MIBaseButton>
          </Stack>

          <Stack gap="8px" alignItems="flex-start">
            <Typography variant="body2SB14" color="contentText.Normal">
              대상 화면
            </Typography>
            <Stack
              maxWidth="100%"
              height="28px"
              justifyContent="center"
              bgcolor="gray.20"
              borderRadius="6px"
              padding="4px 10px"
              boxSizing="border-box"
            >
              <Typography variant="body2M14" color="contentText.Normal" noWrap maxWidth="100%">
                {targetScreenLabel}
              </Typography>
            </Stack>
          </Stack>

          <Stack gap="8px" alignItems="flex-start">
            <Typography variant="body2SB14" color="contentText.Normal">
              피드백 유형
            </Typography>
            <Stack direction="row" gap="5px" alignItems="center" flexWrap="wrap">
              {FEEDBACK_OPTIONS.map((option) => {
                const selected = feedbackTypes.includes(option.value)

                return (
                  <Box
                    key={option.value}
                    component="button"
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleToggleFeedbackType(option.value)}
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
                      font: 'inherit',
                      transition: 'background-color 0.15s ease-in-out, border-color 0.15s ease-in-out',
                      '&:hover': {
                        borderColor: selected ? 'contentBorder.Primaryactive' : 'contentBorder.Hover',
                        backgroundColor: selected ? 'contentBG.PrimaryFade' : 'contentBG.Hover',
                      },
                    }}
                  >
                    <Typography component="span" variant={selected ? 'body2SB14' : 'body2M14'} color="inherit" noWrap sx={{ minWidth: 0 }}>
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

        <Stack direction="row" justifyContent="space-between" alignItems="center" gap="20px" padding="0 20px 20px">
          <Typography variant="body3M12" color="contentText.Subtext" noWrap>
            제출된 피드백은 담당자 확인 후 답변드릴 예정입니다
          </Typography>
          <Stack direction="row" alignItems="center" gap="10px">
            <MIBaseButton variant="outlined" onClick={closeFeedbackMenu} disabled={isSubmitting} sx={{ height: '34px' }}>
              취소
            </MIBaseButton>
            <MIBaseButton
              variant="contained"
              color="primary"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              sx={{ height: '34px' }}
            >
              보내기
            </MIBaseButton>
          </Stack>
        </Stack>
      </Stack>
    </MIMenu>
  )
}

export default NextGenMIUserFeedback
