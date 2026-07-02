import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'

interface ScenarioGroupPriceForecastInterpretationResetDialogProps {
  open: boolean
  pending?: boolean
  onClose: () => void
  onConfirm: () => void
}

const ScenarioGroupPriceForecastInterpretationResetDialog = ({
  open,
  pending = false,
  onClose,
  onConfirm,
}: ScenarioGroupPriceForecastInterpretationResetDialogProps) => (
  <Dialog
    open={open}
    onClose={pending ? undefined : onClose}
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
        alignItems: 'center',
        padding: '20px 20px 30px',
        '&:last-of-type': {
          paddingBottom: '30px',
        },
      }}
    >
      <Stack direction="row" alignItems="center" width="100%" minWidth={0}>
        <Typography variant="body1" fontSize="16px" fontWeight={700} color="contentText.Normal" lineHeight={1.4} flex={1}>
          가격전망 해석 내용을 초기화하시겠습니까?
        </Typography>
        <MIBaseButton aria-label="닫기" variant="text" onClick={onClose} disabled={pending} sx={{ height: '32px', padding: '6px' }}>
          <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
        </MIBaseButton>
      </Stack>
    </DialogContent>
    <DialogActions disableSpacing sx={{ padding: '30px 20px 20px', gap: '10px' }}>
      <MIBaseButton variant="outlined" onClick={onClose} disabled={pending} sx={{ height: '34px', borderRadius: '6px' }}>
        취소
      </MIBaseButton>
      <MIBaseButton
        variant="contained"
        onClick={onConfirm}
        disabled={pending}
        isLoading={pending}
        labelColor="contentText.White"
        sx={{
          height: '34px',
          borderRadius: '6px',
          backgroundColor: 'contentIcon.Error',
          '&:hover:not(:disabled)': {
            backgroundColor: 'contentIcon.Error',
          },
        }}
      >
        초기화
      </MIBaseButton>
    </DialogActions>
  </Dialog>
)

export default ScenarioGroupPriceForecastInterpretationResetDialog
