import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useMemo } from 'react'

import type { EventDetailImpactKpiItem, EventDetailImpactTableRow } from '@/pages/mi/scenarioWorkbench/components/event/types'

import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import KpiCard from '@/pages/mi/scenarioWorkbench/components/common/KpiCard'
import PriceDirectionIcon from '@/pages/mi/scenarioWorkbench/components/common/PriceDirectionIcon'
import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'

interface EventDetailImpactAnalysisSectionProps {
  tableRows: EventDetailImpactTableRow[]
  kpiItems: [EventDetailImpactKpiItem, EventDetailImpactKpiItem]
  narrative: string
}

const EventDetailImpactAnalysisSection = ({ tableRows, kpiItems, narrative }: EventDetailImpactAnalysisSectionProps) => {
  const columns: GridColDef<EventDetailImpactTableRow>[] = useMemo(
    () => [
      {
        field: 'target',
        headerName: '대상',
        flex: 1,
        minWidth: 120,
        sortable: false,
        renderCell: (p) => (
          <ScenarioWorkbenchEventDetailTableBodyText
            value={String(p.value ?? '')}
            component="span"
            sx={{ fontSize: 16, fontWeight: 600, color: 'contentText.Black' }}
          />
        ),
      },
      {
        field: 'marketImpact',
        headerName: '시장영향',
        width: 120,
        align: 'center',
        sortable: false,
        renderCell: (p) => (
          <>
            <ImpactDotsCell level={p.row.marketImpact} />
          </>
        ),
      },
      {
        field: 'direction',
        headerName: '가격방향',
        width: 120,
        align: 'center',
        sortable: false,
        renderCell: (p) => (
          <Box display="flex" alignItems="center" justifyContent="center" width="100%" height={40}>
            <PriceDirectionIcon direction={p.row.direction} size={14} />
          </Box>
        ),
      },
    ],
    [],
  )

  return (
    <Stack width="100%" gap="12px">
      <EventDetailSectionHeader
        icon={<ManageSearchOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="영향도 분석"
        tooltipTitle="이벤트가 주요 가격 지표에 미치는 영향을 요약합니다."
      />
      <Stack direction="row" gap="12px" alignItems="stretch" width="100%" flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
        <Stack width={{ xs: '100%', md: 600 }} flexShrink={0} gap="12px" minWidth={0}>
          <Box bgcolor="gray.5" borderRadius="10px" p="12px" overflow="hidden">
            <Box sx={{ minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
              <ScenarioWorkbenchTableHeader<EventDetailImpactTableRow> columns={columns} />
              <ScenarioWorkbenchDataList<EventDetailImpactTableRow>
                rowId="id"
                columns={columns}
                rows={tableRows}
                rowHeight={48}
                noRowMessage="표시할 데이터가 없습니다."
                hideLastRowBorder
              />
            </Box>
          </Box>
          <Stack direction="row" gap="12px" width="100%">
            <Box flex={1} minWidth={0} sx={{ minHeight: 120 }}>
              <KpiCard title={kpiItems[0].title} content={kpiItems[0].content} description={kpiItems[0].description ?? ''} />
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
          p="20px"
          display="flex"
          flexDirection="column"
          gap="12px"
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
}

export default EventDetailImpactAnalysisSection
