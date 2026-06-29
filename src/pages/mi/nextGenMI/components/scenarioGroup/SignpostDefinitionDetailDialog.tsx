import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, Dialog, DialogActions, Stack, Typography } from '@mui/material'

import type { IScenarioSignpostDefinition } from '@/service/mi/nextGenMI/scenarioGroup'

import MIBaseButton from '@/components/common/button/MIBaseButton'

const SIGNPOST_DETAIL_DIALOG_WIDTH = '800px'
const SIGNPOST_DETAIL_RATIONALE_MAX_HEIGHT = '240px'

interface SignpostDetailInfoCardProps {
  label: string
  value: string
  flex?: number
}

const SignpostDetailInfoCard = ({ label, value, flex }: SignpostDetailInfoCardProps) => (
  <Stack flex={flex} minWidth={0} bgcolor="gray.5" borderRadius="10px" padding="8px" boxSizing="border-box">
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

interface SignpostDefinitionDetailDialogProps {
  open: boolean
  definition: IScenarioSignpostDefinition | null
  onClose: () => void
}

const SignpostDefinitionDetailDialog = ({ open, definition, onClose }: SignpostDefinitionDetailDialogProps) => {
  if (!definition) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: SIGNPOST_DETAIL_DIALOG_WIDTH,
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
          <SignpostDetailInfoCard label="Signpost Label" value={definition.label} />
          <Stack direction="row" gap="12px">
            <SignpostDetailInfoCard label="방향" value={definition.directionLabel} flex={1} />
            <SignpostDetailInfoCard label="영향도" value={definition.strengthLabel} flex={1} />
          </Stack>
          <Stack flex={1} minHeight={0} bgcolor="gray.5" borderRadius="10px" padding="8px" boxSizing="border-box">
            <Stack padding="8px" gap="4px" minHeight={0} height="100%">
              <Typography color="contentText.Normal" fontSize="13px" fontWeight={600} lineHeight={1.6} flexShrink={0}>
                핵심근거
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: SIGNPOST_DETAIL_RATIONALE_MAX_HEIGHT,
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
                  {definition.rationale}
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

export default SignpostDefinitionDetailDialog
