import { Box, Divider, Stack, Typography } from '@mui/material'
import { useSyncExternalStore } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MoveToParentPageIcon from '@/components/common/icons/MoveToParentPageIcon'
import NextGenMIUserFeedback from '@/pages/mi/nextGenMI/components/NextGenMIUserFeedback'

export type ScenarioDesignStep = 1 | 2

interface ScenarioDesignStickyHeaderContent {
  onBackToEventList: () => void
  onBackToEvent: () => void
  activeStep: ScenarioDesignStep
}

let scenarioDesignStickyHeaderContent: ScenarioDesignStickyHeaderContent | null = null
const scenarioDesignStickyHeaderListeners = new Set<() => void>()

export const publishScenarioDesignStickyHeaderContent = (next: ScenarioDesignStickyHeaderContent) => {
  scenarioDesignStickyHeaderContent = next
  scenarioDesignStickyHeaderListeners.forEach((listener) => listener())
}

export const resetScenarioDesignStickyHeaderContent = () => {
  scenarioDesignStickyHeaderContent = null
  scenarioDesignStickyHeaderListeners.forEach((listener) => listener())
}

const subscribeScenarioDesignStickyHeaderContent = (listener: () => void) => {
  scenarioDesignStickyHeaderListeners.add(listener)
  return () => scenarioDesignStickyHeaderListeners.delete(listener)
}

const getScenarioDesignStickyHeaderContentSnapshot = () => scenarioDesignStickyHeaderContent

export const ScenarioDesignOutlineBadge = ({ label }: { label: string }) => (
  <Box
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    padding="6px 4px"
    borderRadius="4px"
    border="1px solid"
    borderColor="contentBorder.Normal"
    bgcolor="commonColor.White"
    flexShrink={0}
  >
    <Typography fontSize="12px" fontWeight={600} color="contentText.Normal" lineHeight={1.4} noWrap>
      {label}
    </Typography>
  </Box>
)

const ScenarioDesignProgressStep = ({
  step,
  label,
  active,
  inProgress,
}: {
  step: ScenarioDesignStep
  label: string
  active: boolean
  inProgress?: boolean
}) => (
  <Stack direction="row" alignItems="center" gap="6px" padding="8px 12px" borderRadius="10px">
    <Box
      width="24px"
      height="24px"
      borderRadius="100px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor={active ? 'mari.Primary' : 'commonColor.White'}
      border="1px solid"
      borderColor={active ? 'mari.Primary' : 'contentBorder.Normal'}
      flexShrink={0}
    >
      <Typography variant="body2SB14" color={active ? 'commonColor.White' : 'contentText.Subtext'} lineHeight={1.4}>
        {step}
      </Typography>
    </Box>
    <Typography variant="body1SB16" color={active ? 'mari.Primary' : 'contentText.Subtext'} lineHeight={1.4} noWrap>
      {label}
    </Typography>
    {inProgress ? <ScenarioDesignOutlineBadge label="진행 중" /> : null}
  </Stack>
)

const ScenarioDesignStickyHeaderView = () => {
  const content = useSyncExternalStore(
    subscribeScenarioDesignStickyHeaderContent,
    getScenarioDesignStickyHeaderContentSnapshot,
    getScenarioDesignStickyHeaderContentSnapshot,
  )
  if (!content) return null

  return (
    <Stack bgcolor="commonColor.White" width="100%">
      <Stack maxWidth="1380px" margin="auto" width="100%" px="12px" py="8px" gap="8px">
        <Stack direction="row" alignItems="center" gap="10px">
          <MIBaseButton
            variant="outlined"
            onClick={content.onBackToEventList}
            prefix={<MoveToParentPageIcon />}
            gap="6px"
            sx={{ height: '36px', padding: '8px', borderRadius: '8px' }}
          >
            Event List
          </MIBaseButton>
          <MIBaseButton
            variant="outlined"
            onClick={content.onBackToEvent}
            prefix={<MoveToParentPageIcon />}
            gap="6px"
            sx={{ height: '36px', padding: '8px', borderRadius: '8px' }}
          >
            Event
          </MIBaseButton>
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="space-between" px="12px" py="8px">
          <Typography variant="titleLarge" fontSize="26px" fontWeight={600} lineHeight={1.4} color="contentText.Black">
            Scenario Design
          </Typography>
          <NextGenMIUserFeedback pageName="Next-Gen MI" sectionName="Scenario Design" targetLabel="Scenario Design" />
        </Stack>
      </Stack>
      <Divider />
      <Stack maxWidth="1380px" margin="auto" width="100%" px="12px" py="12px" borderBottom="1px solid" borderColor="common.primary">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap="4px">
            <ScenarioDesignProgressStep
              step={1}
              label="시나리오 분기항목 및 분기기준 검토"
              active={content.activeStep === 1}
              inProgress={content.activeStep === 1}
            />
            <Box width="40px" height="1px" bgcolor="contentBorder.Normal" flexShrink={0} />
            <ScenarioDesignProgressStep step={2} label="시나리오 One-view 검토" active={content.activeStep === 2} />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioDesignStickyHeaderView
