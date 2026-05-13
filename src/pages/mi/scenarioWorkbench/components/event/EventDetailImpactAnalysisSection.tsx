import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useMemo } from 'react'

import type { KpiCardProps } from '@/pages/mi/scenarioWorkbench/components/common/KpiCard'
import type { IScenarioWorkbenchImpactIndexSummary } from '@/service/mi/scenarioWorkbench/event'

import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import KpiCard from '@/pages/mi/scenarioWorkbench/components/common/KpiCard'
import { PriceDirectionIconWithTooltip } from '@/pages/mi/scenarioWorkbench/components/common/PriceDirectionIcon'
import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'

/** 영향도 분석 섹션 props */
interface EventDetailImpactAnalysisSectionProps {
  tableRows: IScenarioWorkbenchImpactIndexSummary[]
  kpiItems: [KpiCardProps, KpiCardProps]
  narrative: string
  isNoiseEvent?: boolean
}

/** 소음 전용 — 아이콘 + 해당 없음 */
const EventDetailImpactAnalysisNoiseEmptyPanel = () => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    gap="10px"
    width="100%"
    minHeight={{ xs: 280, sm: 340, md: 387 }}
    sx={{
      borderBottom: '1px solid',
      borderColor: 'gray.30',
    }}
  >
    <ErrorOutlineOutlinedIcon sx={{ fontSize: 24, color: 'gray.60' }} aria-hidden />
    <Typography variant="body3SB12" color="gray.60" lineHeight={1.4}>
      해당 없음
    </Typography>
  </Box>
)

/** 이벤트 상세 — 영향도 분석(표 + KPI + 서술) */
const EventDetailImpactAnalysisSection = ({
  tableRows,
  kpiItems,
  narrative,
  isNoiseEvent = false,
}: EventDetailImpactAnalysisSectionProps) => {
  const columns: GridColDef<IScenarioWorkbenchImpactIndexSummary>[] = useMemo(
    () => [
      {
        field: 'indexName',
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
        field: 'marketImpactLevel',
        headerName: '시장영향',
        width: 120,
        align: 'center',
        sortable: false,
        renderCell: (p) => (
          <>
            <ImpactDotsCell level={p.row.marketImpactLevel} />
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
            <PriceDirectionIconWithTooltip direction={p.row.direction} size={14} />
          </Box>
        ),
      },
    ],
    [],
  )

  /** 소음이면 전체 섹션을 소음 화면으로 고정 */

  if (isNoiseEvent) {
    return (
      <Stack width="100%" gap="12px">
        <EventDetailSectionHeader
          icon={<ManageSearchOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
          title="영향도 분석"
          tooltipTitle=""
        />
        <Box bgcolor="gray.5" borderRadius="10px" overflow="hidden" width="100%">
          <EventDetailImpactAnalysisNoiseEmptyPanel />
        </Box>
      </Stack>
    )
  }

  return (
    <Stack width="100%" gap="12px">
      <EventDetailSectionHeader
        icon={<ManageSearchOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="영향도 분석"
        tooltipTitle=""
      />
      <Stack direction="row" gap="12px" alignItems="stretch" width="100%" flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
        <Stack width={{ xs: '100%', md: 600 }} flexShrink={0} gap="12px" minWidth={0}>
          <Box bgcolor="gray.5" borderRadius="10px" p="12px" overflow="hidden">
            <Box sx={{ minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
              <ScenarioWorkbenchTableHeader<IScenarioWorkbenchImpactIndexSummary> columns={columns} />
              <ScenarioWorkbenchDataList<IScenarioWorkbenchImpactIndexSummary>
                rowId="indexName"
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
          borderRadius="8px"
          p="20px"
          display="flex"
          flexDirection="column"
          gap="12px"
          sx={{
            bgcolor: 'gray.5',
            '&:hover': { bgcolor: 'contentBG.Hover' },
          }}
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
