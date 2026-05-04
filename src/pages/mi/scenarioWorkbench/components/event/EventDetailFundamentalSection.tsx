import ContentPasteSearchOutlinedIcon from '@mui/icons-material/ContentPasteSearchOutlined'
import { Box, Stack, Typography } from '@mui/material'

import type {
  EventDetailFundamentalIndicatorRow,
  EventDetailFundamentalMetricRow,
} from '@/pages/mi/scenarioWorkbench/components/event/types'

import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'

interface EventDetailFundamentalSectionProps {
  metricRows: EventDetailFundamentalMetricRow[]
  indicatorRows: EventDetailFundamentalIndicatorRow[]
}

const headerCellSx = {
  flex: 1,
  px: 2.5,
  py: 1,
  borderBottom: '1px solid',
  borderColor: 'contentBorder.Normal',
}

const bodyCellSx = {
  flex: 1,
  px: 2.5,
  py: 1.5,
}

/** Fundamental Deep-dive — 두 개의 4열 표 */
const EventDetailFundamentalSection = ({ metricRows, indicatorRows }: EventDetailFundamentalSectionProps) => (
  <Stack width="100%" gap="12px">
    <EventDetailSectionHeader
      icon={<ContentPasteSearchOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
      title="Fundamental Deep-dive"
      tooltipTitle="펀더멘털 지표와 해석입니다."
    />
    <Stack gap="12px" width="100%">
      <Stack direction="row" width="100%">
        {['항목', '현재 값', '해석 기준', '출처'].map((label) => (
          <Box key={label} sx={headerCellSx}>
            <Typography fontSize={14} fontWeight={600} color="contentText.Black" lineHeight={1.4}>
              {label}
            </Typography>
          </Box>
        ))}
      </Stack>
      {metricRows.map((row) => (
        <Stack key={row.id} direction="row" width="100%">
          <Box sx={bodyCellSx}>
            <ScenarioWorkbenchEventDetailTableBodyText value={row.item} sx={{ fontWeight: 500 }} />
          </Box>
          <Box sx={{ ...bodyCellSx, display: 'flex', justifyContent: 'flex-end' }}>
            <ScenarioWorkbenchEventDetailTableBodyText value={row.currentValue} sx={{ fontWeight: 500 }} />
          </Box>
          <Box sx={bodyCellSx}>
            <ScenarioWorkbenchEventDetailTableBodyText value={row.criteria} sx={{ fontWeight: 500 }} />
          </Box>
          <Box sx={bodyCellSx}>
            <ScenarioWorkbenchEventDetailTableBodyText value={row.source} sx={{ fontWeight: 500 }} />
          </Box>
        </Stack>
      ))}
    </Stack>
    <Stack gap="12px" width="100%" pt="12px">
      <Stack direction="row" width="100%">
        {['지표', '현재 값', '시사점', '출처'].map((label) => (
          <Box key={label} sx={headerCellSx}>
            <Typography fontSize={14} fontWeight={600} color="contentText.Black" lineHeight={1.4}>
              {label}
            </Typography>
          </Box>
        ))}
      </Stack>
      {indicatorRows.map((row) => (
        <Stack key={row.id} direction="row" width="100%">
          <Box sx={bodyCellSx}>
            <ScenarioWorkbenchEventDetailTableBodyText value={row.indicator} sx={{ fontWeight: 500 }} />
          </Box>
          <Box sx={{ ...bodyCellSx, display: 'flex', justifyContent: 'flex-end' }}>
            <ScenarioWorkbenchEventDetailTableBodyText value={row.currentValue} sx={{ fontWeight: 500 }} />
          </Box>
          <Box sx={bodyCellSx}>
            <ScenarioWorkbenchEventDetailTableBodyText value={row.implication} sx={{ fontWeight: 500 }} />
          </Box>
          <Box sx={bodyCellSx}>
            <ScenarioWorkbenchEventDetailTableBodyText value={row.source} sx={{ fontWeight: 500 }} />
          </Box>
        </Stack>
      ))}
    </Stack>
  </Stack>
)

export default EventDetailFundamentalSection
