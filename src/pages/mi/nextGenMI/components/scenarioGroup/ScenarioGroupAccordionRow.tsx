import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import { Box, Collapse, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { IScenarioGroupListItem } from '@/service/mi/nextGenMI/scenarioGroup'
import type { SxProps, Theme } from '@mui/material'
import type { KeyboardEvent } from 'react'

import LineChartIcon from '@/components/common/icons/LineChartIcon'
import TableRowsIcon from '@/components/common/icons/TableRowsIcon'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import { formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import ScenarioGroupInnerTable from '@/pages/mi/nextGenMI/components/common/ScenarioGroupInnerTable'
import ScenarioGroupGraphView from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupGraphView'
import { getNextGenMIScenarioGroupDetailPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'

type ScenarioGroupViewMode = 'table' | 'graph'

// 컬럼 폭은 ScenarioGroupsTabPanel의 GROUP_HEADER_COLUMNS와 동일해야 정렬됨
const SCENARIO_GROUP_LIST_GRID_TEMPLATE = '32px 110px 10px minmax(0, 408fr) minmax(0, 700fr) 120px 120px'

const MODE_OPTIONS = [
  {
    value: 'table',
    label: (
      <Stack direction="row" alignItems="center" gap="4px">
        <TableRowsIcon />표
      </Stack>
    ),
  },
  {
    value: 'graph',
    label: (
      <Stack direction="row" alignItems="center" gap="4px">
        <LineChartIcon />
        그래프
      </Stack>
    ),
  },
]

const getViewPanelSx = (active: boolean): SxProps<Theme> => ({
  position: active ? 'relative' : 'absolute',
  ...(active ? {} : { inset: 0 }),
  width: '100%',
  boxSizing: 'border-box',
  visibility: active ? 'visible' : 'hidden',
  opacity: active ? 1 : 0,
  pointerEvents: active ? 'auto' : 'none',
  zIndex: active ? 1 : 0,
  willChange: 'opacity',
  transition: active ? 'opacity 160ms ease-out, visibility 0ms' : 'opacity 120ms ease-in, visibility 0ms 120ms',
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
})

interface ScenarioGroupAccordionRowProps {
  group: IScenarioGroupListItem
  expanded: boolean
  onToggle: (scenarioGroupId: number) => void
  chartBackgroundColor?: string
}

const ChevronCell = ({ expanded }: { expanded: boolean }) => (
  <Stack width="32px" flexShrink={0} alignItems="center" justifyContent="center" px="6px" boxSizing="border-box" overflow="hidden">
    <KeyboardArrowDownRounded
      sx={{
        fontSize: '20px',
        color: expanded ? 'contentIcon.Activeb' : 'contentIcon.Enabled',
        transition: 'transform 150ms ease',
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      }}
    />
  </Stack>
)

const ScenarioGroupAccordionRow = ({ group, expanded, onToggle, chartBackgroundColor }: ScenarioGroupAccordionRowProps) => {
  const navigate = useNavigate()
  const dateLabel = formatNextGenMIDateTime(group.createdAt)
  const [viewMode, setViewMode] = useState<ScenarioGroupViewMode>('table')
  const isTableView = viewMode === 'table'
  const toggle = () => onToggle(group.scenarioGroupId)
  const navigateToGroupDetail = () => navigate(getNextGenMIScenarioGroupDetailPath(group.scenarioGroupId))
  const handleKeyToggle = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    }
  }

  const headerContent = (
    <Box
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={handleKeyToggle}
      width="100%"
      overflow="hidden"
      position="relative"
      sx={{
        display: 'grid',
        gridTemplateColumns: SCENARIO_GROUP_LIST_GRID_TEMPLATE,
        alignItems: 'center',
        height: expanded ? '72px' : '48px',
        boxSizing: 'border-box',
        borderBottom: '1px solid',
        borderColor: 'contentBorder.Normal',
        borderTop: '1px solid',
        borderTopColor: expanded ? 'contentBorder.Active' : 'transparent',
        bgcolor: expanded ? 'gray.5' : 'commonColor.White',
        cursor: 'pointer',
        transition: 'height 180ms ease, background-color 180ms ease, border-top-color 180ms ease, border-bottom-color 180ms ease',
        ...(expanded ? {} : { '&:hover': { bgcolor: 'gray.10' } }),
      }}
    >
      <ChevronCell expanded={expanded} />
      <Box px="6px" minWidth={0} overflow="hidden" boxSizing="border-box">
        <NextGenMITableBodyText value={dateLabel} variant="body2M14" color="contentText.Black" />
      </Box>
      <Box px="6px" minWidth={0} overflow="hidden" boxSizing="border-box" />
      <Box px="6px" minWidth={0} overflow="hidden" boxSizing="border-box">
        <NextGenMIHoverLinkCell value={group.groupName} onClick={navigateToGroupDetail} />
      </Box>
      <Stack
        minWidth={0}
        justifyContent="center"
        px="6px"
        boxSizing="border-box"
        overflow="hidden"
        sx={{
          opacity: expanded ? 0 : 1,
          pointerEvents: expanded ? 'none' : 'auto',
          transition: 'opacity 150ms ease',
        }}
      >
        <NextGenMITableBodyText value={group.summary} variant="body2M14" color="contentText.Black" tooltipWhenTruncated />
      </Stack>
      <Stack minWidth={0} alignItems="flex-end" px="24px" boxSizing="border-box" overflow="hidden">
        <Typography
          variant="body2M14"
          color="contentText.Black"
          noWrap
          sx={{
            opacity: expanded ? 0 : 1,
            pointerEvents: expanded ? 'none' : 'auto',
            transition: 'opacity 150ms ease',
          }}
        >
          {group.scenarioCount}
        </Typography>
      </Stack>
      <Stack minWidth={0} alignItems="flex-end" px="24px" boxSizing="border-box" overflow="hidden">
        <Typography
          variant="body2M14"
          color="contentText.Black"
          noWrap
          sx={{
            opacity: expanded ? 0 : 1,
            pointerEvents: expanded ? 'none' : 'auto',
            transition: 'opacity 150ms ease',
          }}
        >
          {group.eventCount}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        position="absolute"
        right="24px"
        top="50%"
        onClick={(event) => event.stopPropagation()}
        sx={{
          transform: 'translateY(-50%)',
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
          transition: 'opacity 150ms ease',
        }}
      >
        <MISlidingSegmented
          options={MODE_OPTIONS}
          value={viewMode}
          onChange={(nextMode) => setViewMode(nextMode as ScenarioGroupViewMode)}
        />
      </Stack>
    </Box>
  )

  return (
    <Box width="100%">
      {headerContent}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box bgcolor="gray.5" borderBottom="1px solid" borderColor="contentBorder.Active">
          <Box position="relative" minWidth={0}>
            <Box aria-hidden={!isTableView} sx={getViewPanelSx(isTableView)}>
              <Box padding="16px 20px">
                <Typography variant="body2M14" color="contentText.Black" lineHeight={1.4}>
                  {group.summary}
                </Typography>
              </Box>

              <Box padding="0 10px 10px">
                <ScenarioGroupInnerTable
                  scenarioGroupId={group.scenarioGroupId}
                  dimensionColumns={group.dimensionColumns}
                  scenarios={group.scenarios}
                  backgroundColor="gray.5"
                />
              </Box>
            </Box>
            <Box padding="16px 20px" aria-hidden={isTableView} sx={getViewPanelSx(!isTableView)}>
              <ScenarioGroupGraphView
                scenarioGroupId={group.scenarioGroupId}
                enabled={expanded}
                chartBackgroundColor={chartBackgroundColor}
              />
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  )
}

export default ScenarioGroupAccordionRow
