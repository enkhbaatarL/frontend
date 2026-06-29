import { Box, Typography } from '@mui/material'

const NextGenMITableRowBadge = ({ label }: { label: string }) => (
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
    bgcolor="gray.20"
    color="contentText.Normal"
    border="1px solid"
    borderColor="contentBorder.Normal"
  >
    <Typography component="span" color="inherit" fontSize="11px" fontWeight={600} noWrap>
      {label}
    </Typography>
  </Box>
)

type ScenarioCellBadgeVariant = 'bc' | 'bcDisabled' | 'discarded'

const SCENARIO_CELL_BADGE_STYLE: Record<ScenarioCellBadgeVariant, { bgcolor: string; color: string }> = {
  bc: { bgcolor: 'mari.Primary', color: 'commonColor.White' },
  bcDisabled: { bgcolor: 'contentBG.Disabled', color: 'contentText.Disabled' },
  discarded: { bgcolor: 'contentBG.Disabled', color: 'contentText.Disabled' },
}

const SCENARIO_CELL_BADGE_LABEL: Record<ScenarioCellBadgeVariant, string> = {
  bc: 'BC',
  bcDisabled: 'BC',
  discarded: '폐기',
}

const NextGenMIScenarioCellBadge = ({
  variant,
  height = '20px',
  padding = '2px 6px',
}: {
  variant: ScenarioCellBadgeVariant
  height?: string
  padding?: string
}) => {
  const palette = SCENARIO_CELL_BADGE_STYLE[variant]

  return (
    <Box
      component="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      height={height}
      padding={padding}
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
  return <NextGenMITableRowBadge label={text} />
}

export const NextGenMIBaseCaseChip = ({
  disabled = false,
  height = '20px',
  padding = '2px 6px',
}: {
  disabled?: boolean
  height?: string
  padding?: string
}) => <NextGenMIScenarioCellBadge variant={disabled ? 'bcDisabled' : 'bc'} height={height} padding={padding} />

export const NextGenMIDiscardedBadge = () => <NextGenMIScenarioCellBadge variant="discarded" />
