import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { IScenarioGroupListItem } from '@/service/mi/nextGenMI/scenarioGroup'
import type { KeyboardEvent } from 'react'

import LineChartIcon from '@/components/common/icons/LineChartIcon'
import TableRowsIcon from '@/components/common/icons/TableRowsIcon'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import { formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import ScenarioGroupGraphView from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupGraphView'
import ScenarioGroupInnerTable from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupInnerTable'
import { getNextGenMIScenarioGroupDetailPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'

type ScenarioGroupViewMode = 'table' | 'graph'

// 컬럼 폭은 ScenarioGroupsTabPanel의 GROUP_HEADER_COLUMNS와 동일해야 정렬됨
const SCENARIO_GROUP_LIST_GRID_TEMPLATE = '32px 110px 10px minmax(0, 408fr) minmax(0, 700fr) 120px'

interface ScenarioGroupAccordionRowProps {
  group: IScenarioGroupListItem
  expanded: boolean
  onToggle: (scenarioGroupId: number) => void
}

const ChevronCell = ({ expanded }: { expanded: boolean }) => (
  <Stack width="32px" flexShrink={0} alignItems="center" justifyContent="center">
    <Stack alignItems="center" justifyContent="center" width="26px" height="26px" borderRadius="10px">
      <KeyboardArrowDownRounded
        sx={{
          fontSize: 20,
          color: expanded ? 'contentIcon.Activeb' : 'contentIcon.Enabled',
          transition: 'transform 150ms ease',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      />
    </Stack>
  </Stack>
)

/** 표 / 그래프 전환 토글 (controlled) — 헤더 접힘과 분리하려 stopPropagation */
const ViewModeToggle = ({ mode, onModeChange }: { mode: ScenarioGroupViewMode; onModeChange: (mode: ScenarioGroupViewMode) => void }) => {
  const handleSelect = (next: ScenarioGroupViewMode) => (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    onModeChange(next)
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap="4px"
      padding="4px"
      borderRadius="6px"
      bgcolor="gray.20"
      onClick={(e) => e.stopPropagation()}
    >
      <Stack
        role="button"
        tabIndex={0}
        direction="row"
        alignItems="center"
        gap="4px"
        height="28px"
        padding="4px 6px"
        borderRadius="6px"
        bgcolor={mode === 'table' ? 'commonColor.White' : 'transparent'}
        border={mode === 'table' ? '0.5px solid' : 'none'}
        borderColor="contentBorder.Normal"
        onClick={handleSelect('table')}
        sx={{ cursor: 'pointer' }}
      >
        <Box display="flex" sx={{ color: mode === 'table' ? 'contentText.Black' : 'contentText.Subtext' }}>
          <TableRowsIcon />
        </Box>
        <Typography variant="body2SB14" color={mode === 'table' ? 'contentText.Black' : 'contentText.Subtext'}>
          표
        </Typography>
      </Stack>
      <Stack
        role="button"
        tabIndex={0}
        direction="row"
        alignItems="center"
        gap="4px"
        height="28px"
        padding="4px 6px"
        borderRadius="6px"
        bgcolor={mode === 'graph' ? 'commonColor.White' : 'transparent'}
        border={mode === 'graph' ? '0.5px solid' : 'none'}
        borderColor="contentBorder.Normal"
        onClick={handleSelect('graph')}
        sx={{ cursor: 'pointer' }}
      >
        <Box display="flex" sx={{ color: mode === 'graph' ? 'contentText.Black' : 'contentText.Subtext' }}>
          <LineChartIcon />
        </Box>
        <Typography variant="body2SB14" color={mode === 'graph' ? 'contentText.Black' : 'contentText.Subtext'}>
          그래프
        </Typography>
      </Stack>
    </Stack>
  )
}

const ScenarioGroupAccordionRow = ({ group, expanded, onToggle }: ScenarioGroupAccordionRowProps) => {
  const navigate = useNavigate()
  const dateLabel = formatNextGenMIDateTime(group.createdAt)
  const [viewMode, setViewMode] = useState<ScenarioGroupViewMode>('table')
  const toggle = () => onToggle(group.scenarioGroupId)
  const navigateToGroupDetail = () => navigate(getNextGenMIScenarioGroupDetailPath(group.scenarioGroupId))
  const handleKeyToggle = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    }
  }

  if (!expanded) {
    return (
      <Box
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={handleKeyToggle}
        sx={{
          display: 'grid',
          gridTemplateColumns: SCENARIO_GROUP_LIST_GRID_TEMPLATE,
          alignItems: 'center',
          width: '100%',
          minHeight: '48px',
          borderBottom: '1px solid',
          borderColor: 'contentBorder.Normal',
          bgcolor: 'commonColor.White',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'gray.10' },
        }}
      >
        <ChevronCell expanded={false} />
        <Box px="6px" minWidth={0}>
          <NextGenMITableBodyText value={dateLabel} variant="body2M14" color="contentText.Black" />
        </Box>
        <Box />
        <Stack
          direction="row"
          alignItems="center"
          gap="2px"
          px="6px"
          minWidth={0}
          onClick={(e) => {
            e.stopPropagation()
            navigateToGroupDetail()
          }}
          sx={{
            cursor: 'pointer',
            '&:hover .grp-name': {
              color: 'mari.Primary',
              textDecorationLine: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: '3px',
            },
            '&:hover .grp-name-chevron': { opacity: 1 },
          }}
        >
          <Box minWidth={0} sx={{ flex: '0 1 auto', overflow: 'hidden' }}>
            <NextGenMITableBodyText
              className="grp-name"
              value={group.groupName}
              variant="body1SB16"
              color="contentText.Black"
              tooltipWhenTruncated
            />
          </Box>
          <ChevronRightRounded
            className="grp-name-chevron"
            sx={{ fontSize: 20, color: 'mari.Primary', flexShrink: 0, opacity: 0, transition: 'opacity 150ms ease' }}
          />
        </Stack>
        <Box px="6px" minWidth={0}>
          <NextGenMITableBodyText value={group.summary} variant="body2M14" color="contentText.Black" tooltipWhenTruncated />
        </Box>
        <Stack px="24px" minWidth={0} alignItems="flex-end">
          <Typography variant="body2M14" color="contentText.Black" noWrap>
            {group.scenarioCount}
          </Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box bgcolor="gray.5" borderTop="1px solid" borderBottom="1px solid" borderColor="contentBorder.Active">
      <Stack direction="row" alignItems="center" borderBottom="1px solid" borderColor="contentBorder.Normal">
        <Stack
          role="button"
          tabIndex={0}
          direction="row"
          alignItems="center"
          flexShrink={0}
          onClick={toggle}
          onKeyDown={handleKeyToggle}
          sx={{ height: '48px', cursor: 'pointer' }}
        >
          <ChevronCell expanded />
          <Box width="110px" flexShrink={0} px="6px" minWidth={0}>
            <NextGenMITableBodyText value={dateLabel} variant="body2M14" color="contentText.Black" />
          </Box>
          <Box width="10px" flexShrink={0} />
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          gap="2px"
          flex="1 1 0"
          minWidth={0}
          px="6px"
          onClick={(e) => {
            e.stopPropagation()
            navigateToGroupDetail()
          }}
          sx={{
            cursor: 'pointer',
            '&:hover .grp-name': {
              color: 'mari.Primary',
              textDecorationLine: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: '3px',
            },
            '&:hover .grp-name-chevron': { opacity: 1 },
          }}
        >
          <Box minWidth={0} sx={{ flex: '0 1 auto', overflow: 'hidden' }}>
            <NextGenMITableBodyText
              className="grp-name"
              value={group.groupName}
              variant="body1B16"
              color="contentText.Black"
              tooltipWhenTruncated
            />
          </Box>
          <ChevronRightRounded
            className="grp-name-chevron"
            sx={{ fontSize: 20, color: 'mari.Primary', flexShrink: 0, opacity: 0, transition: 'opacity 150ms ease' }}
          />
        </Stack>
        <Box padding="12px 20px">
          <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
        </Box>
      </Stack>

      <Box padding="4px 0">
        <Box padding="12px 20px">
          <Typography variant="body2M14" color="contentText.Black" lineHeight={1.4}>
            {group.summary}
          </Typography>
        </Box>
      </Box>

      {viewMode === 'table' ? (
        <Box padding="0 10px 10px">
          <ScenarioGroupInnerTable
            scenarioGroupId={group.scenarioGroupId}
            dimensionColumns={group.dimensionColumns}
            scenarios={group.scenarios}
          />
        </Box>
      ) : (
        <Box padding="0 10px 16px">
          <ScenarioGroupGraphView scenarioGroupId={group.scenarioGroupId} enabled={expanded && viewMode === 'graph'} />
        </Box>
      )}
    </Box>
  )
}

export default ScenarioGroupAccordionRow
