import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'

export type ScenarioDesignConfirmDialogContent = {
  title: string
  description?: string
  confirmLabel: string
  confirmBgColor: string
}

export const ScenarioDesignConfirmDialog = ({
  open,
  content,
  onClose,
  onConfirm,
}: {
  open: boolean
  content: ScenarioDesignConfirmDialogContent | null
  onClose: () => void
  onConfirm: () => void
}) => {
  if (!content) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: '450px',
            maxWidth: 'calc(100vw - 48px)',
            border: '1px solid',
            borderColor: 'contentBorder.Normal',
            borderRadius: '12px',
            boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
            margin: 0,
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: content.description ? '20px' : 0,
          padding: '20px 20px 30px',
          '&:last-of-type': {
            paddingBottom: '30px',
          },
        }}
      >
        <Stack direction="row" alignItems="center" width="100%" minWidth={0}>
          <Typography variant="body1" fontSize="16px" fontWeight={700} color="contentText.Normal" lineHeight={1.4} flex={1} noWrap>
            {content.title}
          </Typography>
          <MIBaseButton
            aria-label="닫기"
            variant="text"
            onClick={onClose}
            sx={{
              height: '32px',
              padding: '6px',
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
          </MIBaseButton>
        </Stack>
        {content.description && (
          <Typography variant="body2R14" color="contentText.Normal" lineHeight={1.4}>
            {content.description}
          </Typography>
        )}
      </DialogContent>
      <DialogActions
        disableSpacing
        sx={{
          padding: '30px 20px 20px',
          gap: '10px',
        }}
      >
        <MIBaseButton
          variant="outlined"
          onClick={onClose}
          sx={{
            height: '34px',
            borderRadius: '4px',
          }}
        >
          취소
        </MIBaseButton>
        <MIBaseButton
          variant="contained"
          onClick={onConfirm}
          labelColor="contentText.White"
          sx={{
            height: '34px',
            borderRadius: '4px',
            backgroundColor: content.confirmBgColor,
            '&:hover:not(:disabled)': {
              backgroundColor: content.confirmBgColor,
            },
          }}
        >
          {content.confirmLabel}
        </MIBaseButton>
      </DialogActions>
    </Dialog>
  )
}

export const ScenarioDesignReviewFailedDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog
    open={open}
    onClose={onClose}
    slotProps={{
      paper: {
        sx: {
          width: '450px',
          maxWidth: 'calc(100vw - 48px)',
          border: '1px solid',
          borderColor: 'contentBorder.Normal',
          borderRadius: '12px',
          boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
          margin: 0,
          overflow: 'hidden',
        },
      },
    }}
  >
    <DialogContent
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '20px',
        padding: '20px 20px 0px',
      }}
    >
      <Stack direction="row" alignItems="center" width="100%" minWidth={0}>
        <Typography variant="body1" fontSize="16px" fontWeight={700} color="contentText.Normal" lineHeight={1.4} flex={1} noWrap>
          수정이 필요한 항목이 있습니다
        </Typography>
        <MIBaseButton
          aria-label="닫기"
          variant="text"
          onClick={onClose}
          sx={{
            height: '32px',
            padding: '6px',
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
        </MIBaseButton>
      </Stack>
      <Typography variant="body2R14" color="contentText.Normal" lineHeight={1.4}>
        검토 기준을 충족하지 않는 항목이 발견되었습니다. 테이블 하단의 안내를 확인한 후 값을 수정해 주세요.
      </Typography>
    </DialogContent>
    <DialogActions
      disableSpacing
      sx={{
        padding: '30px 20px 20px',
        gap: '10px',
        justifyContent: 'flex-end',
      }}
    >
      <MIBaseButton
        variant="contained"
        onClick={onClose}
        labelColor="contentText.White"
        sx={{
          height: '34px',
          padding: '7px 16px',
          borderRadius: '4px',
          backgroundColor: 'contentIcon.ActivePrimary',
          '&:hover:not(:disabled)': {
            backgroundColor: 'contentIcon.ActivePrimary',
          },
        }}
      >
        확인
      </MIBaseButton>
    </DialogActions>
  </Dialog>
)
