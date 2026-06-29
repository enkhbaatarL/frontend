import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, Dialog, DialogActions, Stack, Typography } from '@mui/material'

import type { IScenarioSignpostMonitoring } from '@/service/mi/nextGenMI/scenarioGroup'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import { formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'

interface SignpostMonitoringDetailInfoCardProps {
  label: string
  value: string
}

const SignpostMonitoringDetailInfoCard = ({ label, value }: SignpostMonitoringDetailInfoCardProps) => (
  <Stack minWidth={0} bgcolor="gray.5" borderRadius="10px" padding="8px" boxSizing="border-box">
    <Stack padding="8px" gap="4px" minWidth={0}>
      <Typography color="contentText.Normal" fontSize="13px" fontWeight={600} lineHeight={1.6}>
        {label}
      </Typography>
      <Typography color="contentText.Black" fontSize="15px" fontWeight={500} lineHeight={1.6} sx={{ wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  </Stack>
)

interface SignpostMonitoringDetailDialogProps {
  open: boolean
  monitoring: IScenarioSignpostMonitoring | null
  onClose: () => void
}

const SignpostMonitoringDetailDialog = ({ open, monitoring, onClose }: SignpostMonitoringDetailDialogProps) => {
  if (!monitoring) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: '800px',
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: 'calc(100vh - 48px)',
            border: '1px solid',
            borderColor: 'contentBorder.Normal',
            borderRadius: '10px',
            boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
            margin: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="flex-end" padding="12px 20px" flexShrink={0}>
        <MIBaseButton
          aria-label="닫기"
          variant="text"
          onClick={onClose}
          sx={{
            height: '36px',
            width: '36px',
            minWidth: '36px',
            padding: '6px',
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
        </MIBaseButton>
      </Stack>

      <Stack flex={1} minHeight={0} gap="20px" padding="0 24px" overflow="hidden">
        <Stack gap="12px" minHeight={0} flex={1}>
          <SignpostMonitoringDetailInfoCard label="업데이트 일시" value={formatNextGenMIDateTime(monitoring.updatedAt, 'YYYY-MM-DD')} />
          <SignpostMonitoringDetailInfoCard label="Signpost 이벤트 요약" value={monitoring.eventSummary} />
          <Stack flex={1} minHeight={0} bgcolor="gray.5" borderRadius="10px" padding="8px" boxSizing="border-box">
            <Stack padding="8px" gap="4px" minHeight={0} height="100%">
              <Typography color="contentText.Normal" fontSize="13px" fontWeight={600} lineHeight={1.6} flexShrink={0}>
                상세 내역 (Signpost 매칭 근거)
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: '240px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}
              >
                <Typography
                  color="contentText.Black"
                  fontSize="15px"
                  fontWeight={500}
                  lineHeight={1.6}
                  sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
                >
                  {monitoring.rationale}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      <DialogActions
        disableSpacing
        sx={{
          padding: '20px',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <MIBaseButton
          variant="contained"
          onClick={onClose}
          labelColor="contentText.White"
          sx={{
            height: '34px',
            borderRadius: '8px',
            padding: '8px 10px',
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
}

export default SignpostMonitoringDetailDialog
