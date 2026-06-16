import { Box, Typography } from '@mui/material'

import type { NextGenMIClassificationTone } from '@/pages/mi/nextGenMI/components/common/nextGenMIClassificationChip'

const PALETTE_BY_STATUS: Record<NextGenMIClassificationTone, { bgcolor: string; color: string }> = {
  all: { bgcolor: 'contentBG.Disabled', color: 'contentText.Subtext' },
  noise: { bgcolor: 'gray.20', color: 'contentText.Normal' },
  new: { bgcolor: 'contentBG.PrimaryFade', color: 'mari.Primary' },
  updated: { bgcolor: '#F7EFDF', color: '#EB670F' },
  closed: { bgcolor: 'contentBG.Disabled', color: 'contentText.Subtext' },
}

const NextGenMIStatusChip = ({ status, label }: { status: NextGenMIClassificationTone; label: string }) => {
  const palette = PALETTE_BY_STATUS[status]

  return (
    <Box
      component="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      height={28}
      px="8px"
      py="4px"
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor={palette.bgcolor}
      color={palette.color}
    >
      <Typography component="span" variant="body2SB14" color="inherit" noWrap>
        {label}
      </Typography>
    </Box>
  )
}

const NextGenMITableRowBadge = ({ bordered, label }: { bordered: boolean; label: string }) => (
  <Box
    component="span"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    height="19px"
    px="6px"
    borderRadius="4px"
    boxSizing="border-box"
    lineHeight={0}
    sx={{ verticalAlign: 'middle' }}
    bgcolor={bordered ? 'gray.20' : 'mari.Primary'}
    color={bordered ? 'contentText.Normal' : 'commonColor.White'}
    {...(bordered ? { border: '1px solid', borderColor: 'contentBorder.Normal' } : {})}
  >
    <Typography component="span" color="inherit" fontSize="11px" fontWeight={600} noWrap>
      {label}
    </Typography>
  </Box>
)

type ScenarioCellBadgeVariant = 'bc' | 'bcDisabled' | 'discarded' | 'realized'

const SCENARIO_CELL_BADGE_STYLE: Record<ScenarioCellBadgeVariant, { bgcolor: string; color: string }> = {
  bc: { bgcolor: 'mari.Primary', color: 'commonColor.White' },
  bcDisabled: { bgcolor: 'contentIcon.Disabled', color: 'commonColor.White' },
  discarded: { bgcolor: 'contentBG.Disabled', color: 'contentText.Disabled' },
  realized: { bgcolor: 'contentBG.Primaryactive', color: 'mari.Primary' },
}

const SCENARIO_CELL_BADGE_LABEL: Record<ScenarioCellBadgeVariant, string> = {
  bc: 'BC',
  bcDisabled: 'BC',
  discarded: '폐기',
  realized: '실현',
}

const NextGenMIScenarioCellBadge = ({ variant }: { variant: ScenarioCellBadgeVariant }) => {
  const palette = SCENARIO_CELL_BADGE_STYLE[variant]

  return (
    <Box
      component="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      px="6px"
      py="2px"
      borderRadius="8px"
      boxSizing="border-box"
      lineHeight={0}
      sx={{ verticalAlign: 'middle' }}
      bgcolor={palette.bgcolor}
      color={palette.color}
    >
      <Typography component="span" color="inherit" fontSize="12px" fontWeight={600} lineHeight={1.4} noWrap>
        {SCENARIO_CELL_BADGE_LABEL[variant]}
      </Typography>
    </Box>
  )
}

export const NextGenMINoiseSignalBadge = ({ label }: { label: string }) => {
  const text = label.trim()
  if (!text) return null
  return <NextGenMITableRowBadge bordered label={text} />
}

export const NextGenMIBaseCaseChip = ({ disabled = false }: { disabled?: boolean }) => (
  <NextGenMIScenarioCellBadge variant={disabled ? 'bcDisabled' : 'bc'} />
)

export const NextGenMIDiscardedBadge = () => <NextGenMIScenarioCellBadge variant="discarded" />

export const NextGenMIRealizedBadge = () => <NextGenMIScenarioCellBadge variant="realized" />

export const NextGenMIRecommendedBadge = () => <NextGenMITableRowBadge bordered={false} label="추천" />

interface ClassificationTagProps {
  status: NextGenMIClassificationTone
  label: string
}

const ClassificationTag = ({ status, label }: ClassificationTagProps) => <NextGenMIStatusChip status={status} label={label} />

export default ClassificationTag
