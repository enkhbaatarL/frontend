import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined'
import { Box, Stack, Typography } from '@mui/material'

import EventDetailSectionHeader from './EventDetailSectionHeader'
import EventImpactDirectionCompact from './EventImpactDirectionCompact'
import EventImpactDotsCell from './EventImpactDotsCell'
import KpiCard from '../KpiCard'

import type { EventDetailImpactKpiItem, EventDetailImpactTableRow } from './types'

interface EventDetailImpactAnalysisSectionProps {
  tableRows: EventDetailImpactTableRow[]
  kpiItems: [EventDetailImpactKpiItem, EventDetailImpactKpiItem]
  narrative: string
}

/**
 * Figma node 2128:31396 — 영향도 분석
 * 좌 600px: 표(gray.5 패딩 12) + KPI 2열 / 우측 flex: 분석 텍스트(gray.5, px24 py20, radius 8)
 */
const EventDetailImpactAnalysisSection = ({ tableRows, kpiItems, narrative }: EventDetailImpactAnalysisSectionProps) => (
  <Stack
    width="100%"
    borderBottom="1px solid"
    borderColor="contentBorder.Normal"
    py={5}
    gap={1.5}
    id="event-detail-section-impact"
  >
    <EventDetailSectionHeader
      icon={<ManageSearchOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
      title="영향도 분석"
      tooltipTitle="이벤트가 주요 가격 지표에 미치는 영향을 요약합니다."
    />
    <Stack direction="row" gap={1.5} alignItems="stretch" width="100%" flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
      <Stack width={{ xs: '100%', md: 600 }} flexShrink={0} gap={1.5} minWidth={0}>
        <Box bgcolor="gray.5" borderRadius="10px" p={1.5} overflow="hidden">
          <Stack
            component="div"
            direction="row"
            alignItems="center"
            minHeight={36}
            borderBottom="0.5px solid"
            borderColor="contentBorder.Active"
          >
            <Box flex={1} px={1.5} py={1}>
              <Typography fontSize={14} fontWeight={600} color="contentText.Normal" lineHeight={1.4}>
                대상
              </Typography>
            </Box>
            <Box width={120} px={1.5} py={1} textAlign="center">
              <Typography fontSize={14} fontWeight={600} color="contentText.Normal" lineHeight={1.4}>
                시장영향
              </Typography>
            </Box>
            <Box width={120} px={1.5} py={1} textAlign="center">
              <Typography fontSize={14} fontWeight={600} color="contentText.Normal" lineHeight={1.4}>
                가격방향
              </Typography>
            </Box>
          </Stack>
          {tableRows.map((row) => (
            <Stack
              key={row.id}
              direction="row"
              alignItems="center"
              minHeight={48}
              borderBottom="1px solid"
              borderColor="contentBorder.Normal"
              sx={{ '&:last-of-type': { borderBottom: 'none' } }}
            >
              <Box flex={1} px={1.5} py={1.25} minWidth={0}>
                <Typography fontSize={16} fontWeight={600} color="contentText.Black" lineHeight={1.4} noWrap title={row.target}>
                  {row.target}
                </Typography>
              </Box>
              <Box width={120} display="flex" alignItems="center" justifyContent="center" px={1.5} py={1.25}>
                <EventImpactDotsCell level={row.marketImpact} />
              </Box>
              <Box width={120} px={1.5} py={1.25}>
                <EventImpactDirectionCompact direction={row.direction} />
              </Box>
            </Stack>
          ))}
        </Box>
        <Stack direction="row" gap={1.5} width="100%">
          <Box flex={1} minWidth={0} sx={{ minHeight: 120 }}>
            <KpiCard
              title={kpiItems[0].title}
              content={kpiItems[0].content}
              description={kpiItems[0].description ?? ''}
            />
          </Box>
          <Box flex={1} minWidth={0} sx={{ minHeight: 120 }}>
            <KpiCard title={kpiItems[1].title} content={kpiItems[1].content} description={kpiItems[1].description ?? '\u00a0'} />
          </Box>
        </Stack>
      </Stack>
      <Box
        flex={1}
        minWidth={{ xs: '100%', md: 280 }}
        bgcolor="gray.5"
        borderRadius="8px"
        px={3}
        py={2.5}
        display="flex"
        flexDirection="column"
        gap={1.25}
      >
        <Typography fontSize={14} fontWeight={600} color="contentText.Normal" lineHeight={1.4}>
          영향도 분석
        </Typography>
        <Typography fontSize={16} fontWeight={500} color="contentText.Black" lineHeight={1.6}>
          {narrative}
        </Typography>
      </Box>
    </Stack>
  </Stack>
)

export default EventDetailImpactAnalysisSection
