import { Box, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import type { IScenarioDimensionColumn, IScenarioRow } from '@/service/mi/nextGenMI/scenarioGroup'

import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import ScenarioPossibilityGauge from '@/pages/mi/nextGenMI/components/common/ScenarioPossibilityGauge'
import { getNextGenMIScenarioGroupDetailPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'

interface ScenarioGroupInnerTableProps {
  scenarioGroupId: number
  dimensionColumns: IScenarioDimensionColumn[]
  scenarios: IScenarioRow[]
}

const BADGE_COLUMN_WIDTH = '40px'
const NAME_COLUMN_WIDTH = '300px'
const POSSIBILITY_COLUMN_WIDTH = '100px'
const CELL_PADDING = '10px 6px'

const HeaderLabel = ({ label, align }: { label: string; align: 'left' | 'center' }) => (
  <Typography fontSize="13px" fontWeight={600} lineHeight={1.4} color="contentText.Black" noWrap textAlign={align}>
    {label}
  </Typography>
)

const ScenarioGroupInnerTable = ({ scenarioGroupId, dimensionColumns, scenarios }: ScenarioGroupInnerTableProps) => {
  const navigate = useNavigate()

  return (
    <Stack width="100%">
      <Stack direction="row" alignItems="center" px="8px" borderBottom="0.5px solid" borderColor="contentBorder.Active">
        <Box width={BADGE_COLUMN_WIDTH} flexShrink={0} minWidth={0} />
        <Box width={NAME_COLUMN_WIDTH} flexShrink={0} padding={CELL_PADDING}>
          <HeaderLabel label="시나리오" align="left" />
        </Box>
        {dimensionColumns.map((column) => (
          <Box key={column.key} flex="1 1 0" minWidth={0} padding={CELL_PADDING}>
            <HeaderLabel label={column.label} align="left" />
          </Box>
        ))}
        <Box width={POSSIBILITY_COLUMN_WIDTH} flexShrink={0} padding={CELL_PADDING}>
          <HeaderLabel label="실행가능성" align="center" />
        </Box>
      </Stack>

      {scenarios.map((scenario, index) => (
        <Stack
          key={scenario.scenarioId}
          direction="row"
          alignItems="center"
          px="8px"
          sx={{
            borderBottom: index < scenarios.length - 1 ? '1px solid' : 'none',
            borderColor: 'contentBorder.Normal',
            borderRadius: '4px',
            transition: 'background-color 120ms ease',
            '&:hover': { bgcolor: 'gray.20', borderBottomColor: 'transparent' },
            '&:hover .grp-gauge-box': { bgcolor: 'gray.5' },
          }}
        >
          <Stack width={BADGE_COLUMN_WIDTH} flexShrink={0} minWidth={0} alignItems="center" justifyContent="center" py="10px">
            {scenario.baseCase && <NextGenMIBaseCaseChip />}
          </Stack>
          <Box width={NAME_COLUMN_WIDTH} flexShrink={0} minWidth={0} padding={CELL_PADDING}>
            <NextGenMIHoverLinkCell
              value={scenario.scenarioName}
              onClick={() => navigate(getNextGenMIScenarioGroupDetailPath(scenarioGroupId, scenario.scenarioId))}
            />
          </Box>
          {dimensionColumns.map((column) => {
            const dimension = scenario.dimensions.find((item) => item.key === column.key)
            return (
              <Box key={column.key} flex="1 1 0" minWidth={0} padding={CELL_PADDING}>
                <NextGenMITableBodyText value={dimension?.valueLabel ?? '-'} color="contentText.Black" tooltipWhenTruncated />
              </Box>
            )
          })}
          <Stack width={POSSIBILITY_COLUMN_WIDTH} flexShrink={0} alignItems="center" justifyContent="center" padding={CELL_PADDING}>
            <Box className="grp-gauge-box" padding="6px" borderRadius="10px" sx={{ transition: 'background-color 120ms ease' }}>
              <ScenarioPossibilityGauge probability={scenario.probability} />
            </Box>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}

export default ScenarioGroupInnerTable
