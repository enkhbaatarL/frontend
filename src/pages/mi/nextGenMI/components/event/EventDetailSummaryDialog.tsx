import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, Dialog, DialogActions, Stack, Typography } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'

interface EventDetailSummaryDialogItem {
  label: string
  value?: string | null
  fullWidth?: boolean
  scrollable?: boolean
}

interface EventDetailSummaryDialogProps {
  open: boolean
  title?: string
  items: EventDetailSummaryDialogItem[]
  onClose: () => void
}

const EventDetailSummaryDialogInfoCard = ({ label, value, scrollable = false }: EventDetailSummaryDialogItem) => (
  <Stack
    flex={1}
    minWidth={0}
    minHeight={scrollable ? 0 : undefined}
    bgcolor="gray.5"
    borderRadius="10px"
    padding="8px"
    boxSizing="border-box"
  >
    <Stack padding="8px" gap="4px" minWidth={0} minHeight={scrollable ? 0 : undefined} height={scrollable ? '100%' : undefined}>
      <Typography color="contentText.Normal" fontSize="13px" fontWeight={600} lineHeight={1.6}>
        {label}
      </Typography>
      {scrollable ? (
        <Box flex={1} minHeight={0} maxHeight="320px" overflow="auto">
          <Typography
            color="contentText.Black"
            fontSize="15px"
            fontWeight={500}
            lineHeight={1.6}
            sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
          >
            {value || '-'}
          </Typography>
        </Box>
      ) : (
        <Typography color="contentText.Black" fontSize="15px" fontWeight={500} lineHeight={1.6} sx={{ wordBreak: 'break-word' }}>
          {value || '-'}
        </Typography>
      )}
    </Stack>
  </Stack>
)

const EventDetailSummaryDialog = ({ open, title, items, onClose }: EventDetailSummaryDialogProps) => {
  if (!open) return null

  const itemRows = items.reduce<EventDetailSummaryDialogItem[][]>((rows, item) => {
    const currentRow = rows.at(-1)

    if (item.fullWidth || !currentRow || currentRow[0].fullWidth) {
      rows.push([item])
    } else {
      currentRow.push(item)
    }

    return rows
  }, [])

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
        {itemRows.map((row) => (
          <Stack key={row.map((item) => item.label).join('-')} direction={row.length > 1 ? 'row' : 'column'} gap="12px">
            {row.map((item) => (
              <EventDetailSummaryDialogInfoCard key={item.label} {...item} />
            ))}
          </Stack>
        ))}
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
