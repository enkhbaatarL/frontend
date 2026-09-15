import { Box, Stack, Typography } from '@mui/material'

import type { IScenarioGroupListItem } from '@/service/mi/nextGenMI/scenarioGroup'

import ScenarioGroupAccordionRow from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupAccordionRow'

interface ScenarioGroupAccordionListProps {
  groups: IScenarioGroupListItem[]
  expandedGroupIds: Set<number>
  onToggle: (scenarioGroupId: number) => void
  emptyMessage: string
  chartBackgroundColor?: string
}

const ScenarioGroupAccordionList = ({
  groups,
  expandedGroupIds,
  onToggle,
  emptyMessage,
  chartBackgroundColor,
}: ScenarioGroupAccordionListProps) => {
  if (groups.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight="240px" width="100%">
        <Typography variant="body2M14" color="contentText.Normal">
          {emptyMessage}
        </Typography>
      </Stack>
    )
  }

  return (
    <Box width="100%">
      {groups.map((group) => (
        <ScenarioGroupAccordionRow
          key={group.scenarioGroupId}
          group={group}
          expanded={expandedGroupIds.has(group.scenarioGroupId)}
          onToggle={onToggle}
          chartBackgroundColor={chartBackgroundColor}
        />
      ))}
    </Box>
  )
}

export default ScenarioGroupAccordionList
