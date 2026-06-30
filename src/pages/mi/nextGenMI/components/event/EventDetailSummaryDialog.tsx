import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, Dialog, DialogActions, Stack, Typography } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'

interface EventDetailSummaryDialogInfoItem {
  label: string
  value?: string | null
  fullWidth?: boolean
}

interface EventDetailSummaryDialogProps {
  open: boolean
  title?: string
  summaryLabel: string
  summary?: string | null
  infoItems?: EventDetailSummaryDialogInfoItem[]
  onClose: () => void
}

const EventDetailSummaryDialogInfoCard = ({ label, value }: EventDetailSummaryDialogInfoItem) => (
  <Stack flex={1} minWidth={0} bgcolor="gray.5" borderRadius="10px" padding="8px" boxSizing="border-box">
    <Stack padding="8px" gap="4px" minWidth={0}>
      <Typography color="contentText.Normal" fontSize="13px" fontWeight={600} lineHeight={1.6}>
        {label}
      </Typography>
      <Typography color="contentText.Black" fontSize="15px" fontWeight={500} lineHeight={1.6} sx={{ wordBreak: 'break-word' }}>
        {value || '-'}
      </Typography>
    </Stack>
  </Stack>
)

const EventDetailSummaryDialog = ({ open, title, summaryLabel, summary, infoItems = [], onClose }: EventDetailSummaryDialogProps) => {
  if (!open) return null

  const inlineInfoItems = infoItems.filter((item) => !item.fullWidth)
  const fullWidthInfoItems = infoItems.filter((item) => item.fullWidth)

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
      <Stack direction="row" alignItems="center" justifyContent={title ? 'space-between' : 'flex-end'} padding="12px 20px" flexShrink={0}>
        {title && (
          <Typography color="contentText.Black" fontSize="18px" fontWeight={600} lineHeight={1.4}>
            {title}
          </Typography>
        )}
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

      <Stack flex={1} minHeight={0} gap="12px" padding="0 24px" overflow="hidden">
        {inlineInfoItems.length > 0 && (
          <Stack direction="row" gap="12px">
            {inlineInfoItems.map((item) => (
              <EventDetailSummaryDialogInfoCard key={item.label} label={item.label} value={item.value} />
            ))}
          </Stack>
        )}
        {fullWidthInfoItems.length > 0 && (
          <Stack gap="12px">
            {fullWidthInfoItems.map((item) => (
              <EventDetailSummaryDialogInfoCard key={item.label} label={item.label} value={item.value} />
            ))}
          </Stack>
        )}
        <Stack flex={1} minHeight={0} bgcolor="gray.5" borderRadius="10px" padding="8px" boxSizing="border-box">
          <Stack padding="8px" gap="4px" minHeight={0} height="100%">
            <Typography color="contentText.Normal" fontSize="13px" fontWeight={600} lineHeight={1.6} flexShrink={0}>
              {summaryLabel}
            </Typography>
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                maxHeight: '320px',
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
                {summary || '-'}
              </Typography>
            </Box>
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

export default EventDetailSummaryDialog
