import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Stack, Typography } from '@mui/material'
import { useCallback, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import UserFeedbackIcon from '@/components/common/icons/UserFeedbackIcon'
import MIMaskInput from '@/components/common/input/MIMaskInput'
import MIMenu from '@/components/common/menu/MIMenu'
import useSnackbar from '@/hooks/useSnackbar'
import userFeedbackService from '@/service/common/userFeedback'

const FEEDBACK_MAX_LENGTH = 2000

interface NextGenMIUserFeedbackProps {
  pageTitle: string
}

const NextGenMIUserFeedback = ({ pageTitle }: NextGenMIUserFeedbackProps) => {
  const { showSnackbar } = useSnackbar()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetFeedback = useCallback(() => {
    setComment('')
  }, [])

  const closeFeedbackMenu = useCallback(() => {
    setIsMenuOpen(false)
    resetFeedback()
  }, [resetFeedback])

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true)
      const feedbackContent = comment.trim() || undefined
      await userFeedbackService.createUserFeedback({
        feedbackPageNm: pageTitle,
        feedbackTypeCd: 'etc',
        feedbackContent,
      })
      showSnackbar('피드백이 전송되었습니다.', { variant: 'success' })
      closeFeedbackMenu()
    } catch {
      showSnackbar('피드백 전송에 실패했습니다.', { variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }, [closeFeedbackMenu, comment, pageTitle, showSnackbar])

  return (
    <MIMenu
      open={isMenuOpen}
      onOpenChange={setIsMenuOpen}
      onClose={resetFeedback}
      placement="bottom-start"
      menuPositionOffset={{ top: 8 }}
      variant="outlined"
      aria-label="사용자 피드백"
      label={<UserFeedbackIcon />}
      enableHoverBackground
      paperProps={{
        style: {
          border: '1px solid #DEE2E6',
          borderRadius: '8px',
          boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
        },
        sx: { width: '600px', overflow: 'hidden' },
      }}
      sx={{
        width: '36px',
        minWidth: '36px',
        height: '36px',
        padding: '11px',
        color: 'contentIcon.Enabled',
      }}
    >
      <Stack width="600px" minHeight="540px" boxSizing="border-box">
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
                height: '32px',
                padding: '8px',
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
                {pageTitle}
              </Typography>
            </Stack>
          </Stack>

          <MIMaskInput
            label="의견 내용"
            value={comment}
            placeholder="이 화면에서 경험한 문제나 개선 아이디어를 자유롭게 작성해 주세요."
            multiline
            rows={12}
            maxLength={FEEDBACK_MAX_LENGTH}
            onChange={(event) => {
              setComment(event.target.value.slice(0, FEEDBACK_MAX_LENGTH))
            }}
            onUpdateValue={(value) => setComment((value ?? '').slice(0, FEEDBACK_MAX_LENGTH))}
          />
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" gap="20px" padding="0 20px 20px">
          <Typography variant="body3M12" color="contentText.Subtext" noWrap>
            제출된 피드백은 담당자 확인 후 답변드릴 예정입니다
          </Typography>
          <Stack direction="row" alignItems="center" gap="10px">
            <MIBaseButton
              variant="outlined"
              onClick={closeFeedbackMenu}
              disabled={isSubmitting}
              sx={{ height: '32px', padding: '6px 10px', borderRadius: '8px' }}
            >
              취소
            </MIBaseButton>
            <MIBaseButton
              variant="contained"
              color="primary"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              sx={{ height: '32px', padding: '6px 10px', borderRadius: '8px' }}
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
