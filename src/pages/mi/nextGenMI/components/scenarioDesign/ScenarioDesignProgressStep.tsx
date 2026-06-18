import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Stack, Typography } from '@mui/material'

import ScenarioDesignStatusBadge from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignStatusBadge'

type ScenarioDesignProgressStepProps = {
  active: boolean
  completed?: boolean
  number: number
  label: string
  stateLabel?: string
}

const ScenarioDesignProgressStep = ({ active, completed, number, label, stateLabel }: ScenarioDesignProgressStepProps) => (
  <Stack direction="row" alignItems="center" gap="6px" height="40px" padding="8px 12px" borderRadius="10px" minWidth={0}>
    <Stack
      alignItems="center"
      justifyContent="center"
      width="24px"
      height="24px"
      borderRadius="100px"
      bgcolor={completed ? '#9AA7E3' : active ? 'mari.Primary' : 'commonColor.White'}
      border="1px solid"
      borderColor={active || completed ? 'transparent' : 'contentBorder.Normal'}
      boxSizing="border-box"
      flexShrink={0}
    >
      {completed ? (
        <CheckRoundedIcon sx={{ fontSize: '14px', color: 'contentText.White' }} />
      ) : (
        <Typography variant="body2SB14" color={active ? 'contentText.White' : 'contentText.Subtext'} lineHeight={1.4}>
          {number}
        </Typography>
      )}
    </Stack>
    <Typography variant={active ? 'body1SB16' : 'body1M16'} color={active ? 'mari.Primary' : 'contentText.Normal'} noWrap>
      {label}
    </Typography>
    {stateLabel && <ScenarioDesignStatusBadge label={stateLabel} />}
  </Stack>
)

export default ScenarioDesignProgressStep
