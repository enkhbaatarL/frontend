import ModelTrainingOutlinedIcon from '@mui/icons-material/ModelTrainingOutlined'
import { Box, Stack, Typography } from '@mui/material'

import EventDetailSectionHeader from './EventDetailSectionHeader'

import type { EventDetailFundamentalIndicatorRow, EventDetailFundamentalMetricRow } from './types'

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

/** Figma — Fundamental Deep-dive (두 개의 4열 표) */
const EventDetailFundamentalSection = ({ metricRows, indicatorRows }: EventDetailFundamentalSectionProps) => (
  <Stack
    width="100%"
    borderBottom="1px solid"
    borderColor="contentBorder.Normal"
    py={7.5}
    gap={3}
    id="event-detail-section-fundamental"
  >
    <EventDetailSectionHeader
      icon={<ModelTrainingOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
      title="Fundamental Deep-dive"
      tooltipTitle="펀더멘털 지표와 해석입니다."
    />
    <Stack gap={1.5} width="100%">
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
            <Typography fontSize={14} fontWeight={500} color="contentText.Normal" lineHeight={1.4}>
              {row.item}
            </Typography>
          </Box>
          <Box sx={{ ...bodyCellSx, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography fontSize={14} fontWeight={500} color="contentText.Normal" lineHeight={1.4}>
              {row.currentValue}
            </Typography>
          </Box>
          <Box sx={bodyCellSx}>
            <Typography fontSize={14} fontWeight={500} color="contentText.Normal" lineHeight={1.4}>
              {row.criteria}
            </Typography>
          </Box>
          <Box sx={bodyCellSx}>
            <Typography fontSize={14} fontWeight={500} color="contentText.Normal" lineHeight={1.4}>
              {row.source}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
    <Stack gap={1.5} width="100%" pt={1.5}>
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
            <Typography fontSize={14} fontWeight={500} color="contentText.Normal" lineHeight={1.4}>
              {row.indicator}
            </Typography>
          </Box>
          <Box sx={{ ...bodyCellSx, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography fontSize={14} fontWeight={500} color="contentText.Normal" lineHeight={1.4}>
              {row.currentValue}
            </Typography>
          </Box>
          <Box sx={bodyCellSx}>
            <Typography fontSize={14} fontWeight={500} color="contentText.Normal" lineHeight={1.4}>
              {row.implication}
            </Typography>
          </Box>
          <Box sx={bodyCellSx}>
            <Typography fontSize={14} fontWeight={500} color="contentText.Normal" lineHeight={1.4}>
              {row.source}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  </Stack>
)

export default EventDetailFundamentalSection
