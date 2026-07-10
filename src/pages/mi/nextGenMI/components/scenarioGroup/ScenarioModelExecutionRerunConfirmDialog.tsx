import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'

interface ScenarioModelExecutionRerunConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

const ScenarioModelExecutionRerunConfirmDialog = ({ open, onClose, onConfirm }: ScenarioModelExecutionRerunConfirmDialogProps) => (
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
        padding: '20px 20px 30px',
        '&:last-of-type': {
          paddingBottom: '30px',
        },
      }}
    >
      <Stack direction="row" alignItems="center" width="100%" minWidth={0}>
        <Typography variant="body1" fontSize="16px" fontWeight={700} color="contentText.Normal" lineHeight={1.4} flex={1}>
          수급모델을 재실행하시겠습니까?
        </Typography>
        <MIBaseButton aria-label="닫기" variant="text" onClick={onClose} sx={{ height: '32px', padding: '6px' }}>
          <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
        </MIBaseButton>
      </Stack>
      <Typography variant="body2R14" color="contentText.Normal" lineHeight={1.4}>
        수급모델을 재실행하면 이 시나리오의 기존 가격전망 해석 생성 내역과 수정 내역이 삭제됩니다.
      </Typography>
    </DialogContent>
    <DialogActions disableSpacing sx={{ padding: '30px 20px 20px', gap: '10px' }}>
      <MIBaseButton variant="outlined" onClick={onClose} sx={{ height: '34px', borderRadius: '4px' }}>
        취소
      </MIBaseButton>
      <MIBaseButton
        variant="contained"
        onClick={onConfirm}
        labelColor="contentText.White"
        sx={{
          height: '34px',
          borderRadius: '4px',
          backgroundColor: 'commonColor.Primary',
          '&:hover:not(:disabled)': {
            backgroundColor: 'commonColor.Primary',
          },
        }}
      >
        재실행
      </MIBaseButton>
    </DialogActions>
  </Dialog>
)

export default ScenarioModelExecutionRerunConfirmDialog
