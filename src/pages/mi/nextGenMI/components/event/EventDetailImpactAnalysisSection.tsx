import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useMemo } from 'react'

import type { KpiCardProps } from '@/pages/mi/nextGenMI/components/common/KpiCard'
import type { EventDetailImpactIndex } from '@/service/mi/nextGenMI/event'

import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import KpiCard from '@/pages/mi/nextGenMI/components/common/KpiCard'
import NextGenMIEventDetailTableBodyText, {
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_CELL_PY,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_CELL_PX,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_HEADER_CELL_PY,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_HEADER_LABEL_COLOR,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailTableBodyText'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import EventIndexSignalCell from '@/pages/mi/nextGenMI/components/event/EventIndexSignalCell'

/** 영향도 분석 섹션 props */
interface EventDetailImpactAnalysisSectionProps {
  tableRows: EventDetailImpactIndex[]
  kpiItems: [KpiCardProps, KpiCardProps]
  narrative: string
  isNoiseEvent?: boolean
  loading?: boolean
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
      borderColor: 'gray.30',
    }}
  >
    <ErrorOutlineOutlinedIcon sx={{ fontSize: 24, color: 'gray.60' }} aria-hidden />
    <Typography variant="body3SB12" color="gray.60" lineHeight={1.4}>
      해당 없음
    </Typography>
  </Box>
)

const impactAnalysisCellSx = ({ field }: { field: string }) => {
  if (field === 'shortTerm' || field === 'midLongTerm') {
    return { py: '4px' }
  }
  return {}
}

/** 이벤트 상세 — 영향도 분석(표 + KPI + 서술) */
const EventDetailImpactAnalysisSection = ({
  tableRows,
  kpiItems,
  narrative,
  isNoiseEvent = false,
  loading = false,
}: EventDetailImpactAnalysisSectionProps) => {
  const columns: GridColDef<EventDetailImpactIndex>[] = useMemo(
    () => [
      {
        field: 'indexName',
        headerName: '대상',
        width: 296,
        sortable: false,
        renderCell: (p) => (
          <NextGenMIEventDetailTableBodyText
            value={String(p.value ?? '')}
            component="span"
            sx={{ fontWeight: 600, color: 'contentText.Black' }}
          />
        ),
      },
      {
        field: 'shortTerm',
        headerName: '단기 영향',
        width: 140,
        align: 'center',
        sortable: false,
        renderCell: (p) => (
          <Stack alignItems="center" justifyContent="center" width="100%">
            <EventIndexSignalCell
              indexLabel={p.row.indexName ?? undefined}
              level={p.row.shortTerm?.marketImpactLevel}
              levelLabel={p.row.shortTerm?.marketImpactLevelLabel}
              direction={p.row.shortTerm?.direction}
              directionLabel={p.row.shortTerm?.directionLabel}
              term="short"
              showTermBadge={false}
              size={20}
            />
          </Stack>
        ),
      },
      {
        field: 'midLongTerm',
        headerName: '중장기 영향',
        width: 140,
        align: 'center',
        sortable: false,
        renderCell: (p) => (
          <Stack alignItems="center" justifyContent="center" width="100%">
            <EventIndexSignalCell
              indexLabel={p.row.indexName ?? undefined}
              level={p.row.midLongTerm?.marketImpactLevel}
              levelLabel={p.row.midLongTerm?.marketImpactLevelLabel}
              direction={p.row.midLongTerm?.direction}
              directionLabel={p.row.midLongTerm?.directionLabel}
              term="long"
              showTermBadge={false}
              size={20}
            />
          </Stack>
        ),
      },
    ],
    [],
  )

  if (loading) {
    return (
      <Stack width="100%" gap="12px" py="20px">
        <EventDetailSectionHeader
          icon={<ManageSearchIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
          title="영향도 분석"
          tooltipTitle=""
        />
        <Stack direction="row" gap="12px" alignItems="stretch" width="100%" flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
          <Stack width={{ xs: '100%', md: 600 }} flexShrink={0} gap="12px" minWidth={0}>
            <Box bgcolor="gray.5" borderRadius="10px" p="12px" overflow="hidden">
              <Skeleton variant="rounded" height={40} sx={{ borderRadius: '6px', mb: '8px' }} />
              {[0, 1, 2].map((idx) => (
                <Skeleton key={idx} variant="rounded" height={48} sx={{ borderRadius: '4px', mt: idx === 0 ? 0 : '8px' }} />
              ))}
            </Box>
            <Stack direction="row" gap="12px" width="100%">
              <Skeleton variant="rounded" sx={{ flex: 1, minHeight: 120 }} />
              <Skeleton variant="rounded" sx={{ flex: 1, minHeight: 120 }} />
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
            sx={{ bgcolor: 'gray.5' }}
          >
            <Skeleton variant="rounded" width="40%" height={22} sx={{ borderRadius: '4px' }} />
            <Skeleton variant="rounded" height={16} sx={{ borderRadius: '4px' }} />
            <Skeleton variant="rounded" height={16} sx={{ borderRadius: '4px' }} />
            <Skeleton variant="rounded" width="85%" height={16} sx={{ borderRadius: '4px' }} />
          </Box>
        </Stack>
      </Stack>
    )
  }

  /** 소음이면 전체 섹션을 소음 화면으로 고정 */
  if (isNoiseEvent) {
    return (
      <Stack width="100%" gap="12px" py="20px">
        <EventDetailSectionHeader
          icon={<ManageSearchIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
          title="영향도 분석"
          tooltipTitle=""
        />
        <Box bgcolor="gray.5" borderRadius="10px" overflow="hidden" width="100%">
          <EventDetailImpactAnalysisNoiseEmptyPanel />
        </Box>
      </Stack>
    )
  }

  const hasNarrative = narrative.trim().length > 0

  return (
    <Stack width="100%" gap="12px" py="20px">
      <EventDetailSectionHeader
        icon={<ManageSearchIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
        title="영향도 분석"
        tooltipTitle=""
      />
      <Stack direction="row" gap="12px" alignItems="stretch" width="100%" flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
        <Stack width={{ xs: '100%', md: 600 }} flexShrink={0} gap="12px" minWidth={0}>
          <Box bgcolor="gray.5" borderRadius="10px" p="12px" overflow="hidden">
            <Box sx={{ minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
              <MIDataTableHeader<EventDetailImpactIndex>
                columns={columns}
                headerCellPx={NEXT_GEN_MI_EVENT_DETAIL_TABLE_CELL_PX}
                headerCellPy={NEXT_GEN_MI_EVENT_DETAIL_TABLE_HEADER_CELL_PY}
                headerLabelColor={NEXT_GEN_MI_EVENT_DETAIL_TABLE_HEADER_LABEL_COLOR}
              />
              <MIDataTableBody<EventDetailImpactIndex>
                rowId="indexName"
                columns={columns}
                rows={tableRows}
                rowHeight={48}
                noRowMessage="표시할 데이터가 없습니다."
                hideLastRowBorder
                primitiveCellTypographyVariant={NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT}
                primitiveCellLineHeight={NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT}
                cellPx={NEXT_GEN_MI_EVENT_DETAIL_TABLE_CELL_PX}
                cellPy={NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_CELL_PY}
                getCellSx={impactAnalysisCellSx}
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
          bgcolor="gray.5"
        >
          <Typography fontSize={14} fontWeight={600} color="contentText.Normal" lineHeight={1.4}>
            영향도 분석 종합
          </Typography>
          {hasNarrative ? (
            <Typography fontSize={16} fontWeight={500} color="contentText.Black" lineHeight={1.6}>
              {narrative}
            </Typography>
          ) : (
            <Stack flex={1} minHeight="120px" alignItems="center" justifyContent="center">
              <Typography variant="body2M14" color="contentText.Normal">
                표시할 데이터가 없습니다.
              </Typography>
            </Stack>
          )}
        </Box>
      </Stack>
    </Stack>
  )
}

export default EventDetailImpactAnalysisSection
