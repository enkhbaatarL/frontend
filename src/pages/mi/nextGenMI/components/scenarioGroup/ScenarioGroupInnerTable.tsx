import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import type { IScenarioDimensionColumn, IScenarioRow } from '@/service/mi/nextGenMI/scenarioGroup'

import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
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
          <Stack
            direction="row"
            alignItems="center"
            gap="2px"
            width={NAME_COLUMN_WIDTH}
            flexShrink={0}
            minWidth={0}
            padding={CELL_PADDING}
            onClick={() => navigate(getNextGenMIScenarioGroupDetailPath(scenarioGroupId, scenario.scenarioId))}
            sx={{
              cursor: 'pointer',
              '&:hover .grp-scenario-name': {
                color: 'mari.Primary',
                textDecorationLine: 'underline',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '3px',
              },
              '&:hover .grp-scenario-chevron': { opacity: 1 },
            }}
          >
            <Box minWidth={0} sx={{ flex: '0 1 auto', overflow: 'hidden' }}>
              <NextGenMITableBodyText
                className="grp-scenario-name"
                value={scenario.scenarioName}
                variant="body1SB16"
                color="contentText.Black"
                tooltipWhenTruncated
              />
            </Box>
            <ChevronRightRounded
              className="grp-scenario-chevron"
              sx={{ fontSize: 20, color: 'mari.Primary', flexShrink: 0, opacity: 0, transition: 'opacity 150ms ease' }}
            />
          </Stack>
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
