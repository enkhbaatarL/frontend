import { Skeleton, Stack, Typography } from '@mui/material'

import type { IScenarioGroupListItem } from '@/service/mi/nextGenMI/scenarioGroup'

import ScenarioGroupAccordionRow from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupAccordionRow'

interface ScenarioGroupAccordionListProps {
  groups: IScenarioGroupListItem[]
  expandedGroupIds: Set<number>
  onToggle: (scenarioGroupId: number) => void
  loading: boolean
  skeletonRowCount: number
  emptyMessage: string
  chartBackgroundColor?: string
}

const ScenarioGroupAccordionList = ({
  groups,
  expandedGroupIds,
  onToggle,
  loading,
  skeletonRowCount,
  emptyMessage,
  chartBackgroundColor,
}: ScenarioGroupAccordionListProps) => (
  <Stack width="100%">
    {loading ? (
      <Stack>
        {Array.from({ length: skeletonRowCount }).map((_, index) => (
          <Skeleton
            key={`scenario-group-skeleton-${index}`}
            variant="rectangular"
            height="48px"
            sx={{ borderBottom: '1px solid', borderColor: 'contentBorder.Normal' }}
          />
        ))}
      </Stack>
    ) : groups.length === 0 ? (
      <Stack alignItems="center" justifyContent="center" minHeight="240px">
        <Typography variant="body2M14" color="contentText.Normal">
          {emptyMessage}
        </Typography>
      </Stack>
    ) : (
      groups.map((group) => (
        <ScenarioGroupAccordionRow
          key={group.scenarioGroupId}
          group={group}
          expanded={expandedGroupIds.has(group.scenarioGroupId)}
          onToggle={onToggle}
          chartBackgroundColor={chartBackgroundColor}
        />
      ))
    )}
  </Stack>
)

export default ScenarioGroupAccordionList
