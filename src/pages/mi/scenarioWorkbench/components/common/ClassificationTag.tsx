import { Box, Typography } from '@mui/material'

import type { WorkbenchClassificationTone } from '@/pages/mi/scenarioWorkbench/components/common/scenarioWorkbenchClassificationChip'

const PALETTE_BY_STATUS: Record<WorkbenchClassificationTone, { bgcolor: string; color: string }> = {
  noise: { bgcolor: 'gray.20', color: 'contentText.Normal' },
  new: { bgcolor: 'contentBG.PrimaryFade', color: 'mari.Primary' },
  updated: { bgcolor: '#F7EFDF', color: '#EB670F' },
  closed: { bgcolor: 'contentBG.Disabled', color: 'contentText.Subtext' },
}

const WorkbenchStatusChip = ({ status, label }: { status: WorkbenchClassificationTone; label: string }) => {
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

const WorkbenchTableRowBadge = ({ bordered, label }: { bordered: boolean; label: string }) => (
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

export const ScenarioWorkbenchNoiseSignalBadge = ({ label }: { label: string }) => {
  const text = label.trim()
  if (!text) return null
  return <WorkbenchTableRowBadge bordered label={text} />
}

export const ScenarioWorkbenchBaseCaseChip = () => <WorkbenchTableRowBadge bordered={false} label="BC" />

export const ScenarioWorkbenchRecommendedBadge = () => <WorkbenchTableRowBadge bordered={false} label="추천" />

interface ClassificationTagProps {
  status: WorkbenchClassificationTone
  label: string
}

const ClassificationTag = ({ status, label }: ClassificationTagProps) => <WorkbenchStatusChip status={status} label={label} />

export default ClassificationTag
