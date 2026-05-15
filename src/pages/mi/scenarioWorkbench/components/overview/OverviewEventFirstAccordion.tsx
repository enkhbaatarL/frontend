import { Box, Stack, Typography, type SxProps, type Theme } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  accordionFrameSurfaceSx,
  OVERVIEW_ACCORDION_DETAIL_ROW_HEIGHT_PX,
  OVERVIEW_ACCORDION_EXPANDED_ROW_GAP_Y_PX,
  accordionSummarySurfaceSx,
} from './overviewAccordionMotion'
import {
  OverviewAccordionCollapse,
  OverviewAccordionDetailBodyReveal,
  OverviewAccordionNoRows,
  OverviewAccordionSummaryRow,
} from './OverviewAccordionShared'
import {
  formatOverviewScenarioTags,
  OVERVIEW_ACCORDION_ACTION_COLUMN_WIDTH_PX,
  OVERVIEW_ACCORDION_LIST_LOADING_ROW_HEIGHT_PX,
  overviewColumnsToGridTemplate,
  toSxArray,
  useOverviewAccordionDetailLifecycle,
} from './OverviewAccordionUtils'

import type { IOverviewEventItem, IOverviewScenarioBrief } from '@/service/mi/scenarioWorkbench/overview'

import {
  ScenarioWorkbenchBaseCaseChip,
  ScenarioWorkbenchNoiseSignalBadge,
} from '@/pages/mi/scenarioWorkbench/components/common/ClassificationTag'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import ProbabilityGaugeCell from '@/pages/mi/scenarioWorkbench/components/common/ProbabilityGaugeCell'
import { findIndexImpact, formatWorkbenchDateTime } from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'
import { scenarioWorkbenchIsEventNoiseSignal } from '@/pages/mi/scenarioWorkbench/components/common/scenarioWorkbenchClassificationChip'
import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import { buildDistinctSeriesColors } from '@/pages/mi/scenarioWorkbench/components/common/workbenchSeriesColors'
import ScenarioWorkbenchDataList, {
  SCENARIO_WORKBENCH_DATA_LIST_FIRST_ROW_TOP_INSET_DEFAULT_PX,
} from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { EventCategoryLv1 } from '@/service/mi/scenarioWorkbench/common'

const OVERVIEW_DETAIL_ACTION_FIELD = '__overviewAccordionAction'
const OVERVIEW_DETAIL_SCENARIO_LEGEND_FIELD = '__overviewAccordionScenarioLegend'
const OVERVIEW_DETAIL_SCENARIO_PROBABILITY_FIELD = '__overviewAccordionScenarioProbability'

const OVERVIEW_DETAIL_ROW_SX = {
  px: '8px',
  py: '4px',
  boxSizing: 'border-box',
} as const

const OVERVIEW_DETAIL_HEADER_SX = {
  px: '8px',
  borderColor: 'contentBorder.Active',
  bgcolor: 'transparent',
} as const

const SCENARIO_LINE_COLORS = [
  '#185FA5',
  '#0F8A72',
  '#E09A3A',
  '#C4407A',
  '#A32D2D',
  '#2D99A7',
  '#7E5AC4',
  '#B59702',
  '#3E8B44',
  '#6B6A65',
] as const

const scenarioDetailCellSx = (params: { field: string }) => {
  if (params.field === OVERVIEW_DETAIL_SCENARIO_LEGEND_FIELD || params.field === OVERVIEW_DETAIL_ACTION_FIELD) {
    return { px: 0, py: 0 }
  }
  if (params.field === 'scenarioName') {
    return { py: '2px' }
  }
  if (
    params.field === 'jkmImpact' ||
    params.field === 'ttfImpact' ||
    params.field === 'hhImpact' ||
    params.field === OVERVIEW_DETAIL_SCENARIO_PROBABILITY_FIELD
  ) {
    return { px: '8px', py: '6px' }
  }
  return {}
}

const ScenarioLegendCell = ({ color }: { color: string }) => (
  <Box width="100%" display="flex" alignItems="center" justifyContent="center">
    <Box width={18} height={4} borderRadius="100px" bgcolor={color} />
  </Box>
)

const ScenarioTitleCell = ({
  row,
  onNameNavigate,
}: {
  row: IOverviewScenarioBrief
  onNameNavigate: (row: IOverviewScenarioBrief) => void
}) => {
  const timeLabel = formatWorkbenchDateTime(row.updatedAt ?? row.createdAt)
  const tagLabel = formatOverviewScenarioTags(row.tags)
  const metaLabel = [timeLabel === '-' ? '' : timeLabel, tagLabel].filter(Boolean).join(' | ')

  return (
    <Stack alignItems="flex-start" gap="4px" minWidth={0} width="100%">
      <Stack direction="row" alignItems="center" gap="8px" minWidth={0} width="100%" height="22px">
        <ScenarioWorkbenchEventDetailTableBodyText
          value={row.scenarioName}
          tooltipWhenTruncated
          onClick={(e) => {
            e.stopPropagation()
            onNameNavigate(row)
          }}
          sx={{
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.4,
            flex: '0 1 auto',
            minWidth: 0,
            width: 'auto',
            color: 'contentText.Normal',
          }}
        />
        {row.baseCase && (
          <Box sx={{ flex: '0 0 auto', display: 'inline-flex', lineHeight: 0 }}>
            <ScenarioWorkbenchBaseCaseChip />
          </Box>
        )}
      </Stack>
      {metaLabel && (
        <Typography fontSize={12} fontWeight={500} lineHeight={1.4} color="contentText.Subtext" noWrap sx={{ minWidth: 0, width: '100%' }}>
          {metaLabel}
        </Typography>
      )}
    </Stack>
  )
}

type OverviewEventScenarioAccordionRow = IOverviewScenarioBrief & {
  overviewLegendColor: string
}

export interface OverviewEventScenariosTableProps {
  event: IOverviewEventItem
  detailRevealNonce?: number
  onForecastScenarioHoverChange?: (scenarioId: number | null) => void
}

export const OverviewEventScenariosTable = ({
  event,
  detailRevealNonce = 0,
  onForecastScenarioHoverChange,
}: OverviewEventScenariosTableProps) => {
  const navigate = useNavigate()
  const goScenarioDetail = useCallback(
    (scenarioId: number) => {
      navigate(`/mi/scenario-workbench/scenarios/${scenarioId}`)
    },
    [navigate],
  )

  const scenarioRows: OverviewEventScenarioAccordionRow[] = useMemo(() => {
    const list = event.scenarios ?? []
    const colors = buildDistinctSeriesColors(SCENARIO_LINE_COLORS, list.length)
    return list.map((scenario, idx) => ({
      ...scenario,
      overviewLegendColor: colors[idx]!,
    }))
  }, [event.scenarios])

  const scenarioColumns: GridColDef<OverviewEventScenarioAccordionRow>[] = useMemo(
    () => [
      {
        field: OVERVIEW_DETAIL_SCENARIO_LEGEND_FIELD,
        headerName: '',
        width: 22,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <ScenarioLegendCell color={params.row.overviewLegendColor} />,
      },
      {
        field: 'scenarioName',
        headerName: '시나리오',
        flex: 1,
        minWidth: 200,
        sortable: false,
        align: 'left',
        headerAlign: 'left',
        renderCell: (params: GridRenderCellParams<OverviewEventScenarioAccordionRow>) => (
          <ScenarioTitleCell row={params.row} onNameNavigate={(r) => goScenarioDetail(r.scenarioId)} />
        ),
      },
      {
        field: 'jkmImpact',
        headerName: 'JKM',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'JKM')
          return <ImpactDotsCell level={impact?.marketImpactLevel} size={7} />
        },
      },
      {
        field: 'ttfImpact',
        headerName: 'TTF',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'TTF')
          return <ImpactDotsCell level={impact?.marketImpactLevel} size={7} />
        },
      },
      {
        field: 'hhImpact',
        headerName: 'HH',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'HH')
          return <ImpactDotsCell level={impact?.marketImpactLevel} size={7} />
        },
      },
      {
        field: OVERVIEW_DETAIL_SCENARIO_PROBABILITY_FIELD,
        headerName: '가능성',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <ProbabilityGaugeCell probability={params.row.probability} barWidth={4} />,
      },
      {
        field: OVERVIEW_DETAIL_ACTION_FIELD,
        headerName: '',
        width: OVERVIEW_ACCORDION_ACTION_COLUMN_WIDTH_PX,
        sortable: false,
        renderCell: () => null,
      },
    ],
    [goScenarioDetail],
  )
  const headerCellSxMatchingBody = useCallback((col: GridColDef<OverviewEventScenarioAccordionRow>) => {
    const bodySx = scenarioDetailCellSx({ field: col.field })
    if (bodySx && typeof bodySx === 'object' && !Array.isArray(bodySx) && 'px' in bodySx) {
      const pxVal = (bodySx as { px?: number | string }).px
      if (pxVal !== undefined) return { px: pxVal }
    }
    return undefined
  }, [])

  return (
    <Box
      sx={{
        bgcolor: 'commonColor.White',
        borderRadius: '10px',
        p: '8px',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <ScenarioWorkbenchTableHeader<OverviewEventScenarioAccordionRow>
        columns={scenarioColumns}
        sx={OVERVIEW_DETAIL_HEADER_SX}
        headerLabelColor="contentText.Normal"
        getHeaderCellSx={headerCellSxMatchingBody}
      />

      <OverviewAccordionDetailBodyReveal revealKey={detailRevealNonce}>
        {scenarioRows.length === 0 ? (
          <Box
            sx={{
              minHeight: OVERVIEW_ACCORDION_DETAIL_ROW_HEIGHT_PX,
              display: 'flex',
              alignItems: 'center',
              px: '12px',
              py: '4px',
              boxSizing: 'border-box',
            }}
          >
            <Typography variant="body2M14" color="contentText.Subtext">
              연결된 시나리오가 없습니다.
            </Typography>
          </Box>
        ) : (
          <ScenarioWorkbenchDataList<OverviewEventScenarioAccordionRow>
            rowId="scenarioId"
            columns={scenarioColumns}
            rows={scenarioRows}
            rowHeight={OVERVIEW_ACCORDION_DETAIL_ROW_HEIGHT_PX}
            hideLastRowBorder
            rowSx={OVERVIEW_DETAIL_ROW_SX}
            getCellSx={scenarioDetailCellSx}
            cellPreset="miCanvasEvent"
            detailShortcutColumnField={OVERVIEW_DETAIL_ACTION_FIELD}
            onDetailShortcutClick={({ row: r }) => goScenarioDetail(r.scenarioId)}
            onRowMouseEnter={onForecastScenarioHoverChange ? ({ row: r }) => onForecastScenarioHoverChange(r.scenarioId) : undefined}
            onRowMouseLeave={onForecastScenarioHoverChange ? () => onForecastScenarioHoverChange(null) : undefined}
          />
        )}
      </OverviewAccordionDetailBodyReveal>
    </Box>
  )
}

export interface OverviewEventFirstAccordionRowProps {
  event: IOverviewEventItem
  expanded: boolean
  columns: GridColDef<IOverviewEventItem>[]
  gridTemplateColumns: string
  actionColumnField?: string
  getCellSx?: (params: { field: string; row?: IOverviewEventItem }) => SxProps<Theme>
  rowSx?: SxProps<Theme>
  enableExpandedRowSticky?: boolean
  expandedRowStickyTopPx?: number
  summaryHovered?: boolean
  beforeHoveredSummary?: boolean
  beforeExpandedSummary?: boolean
  onSummaryMouseEnter?: () => void
  onSummaryMouseLeave?: () => void
  onSummaryExpandClick: () => void
  onSummaryCollapseClick: () => void
  onSummaryDetailShortcutClick?: () => void
  onForecastScenarioHoverChange?: (scenarioId: number | null) => void
}

export const OverviewEventFirstAccordionRow = ({
  event,
  expanded,
  columns,
  gridTemplateColumns,
  actionColumnField,
  getCellSx,
  rowSx,
  enableExpandedRowSticky = false,
  expandedRowStickyTopPx,
  summaryHovered,
  beforeHoveredSummary,
  beforeExpandedSummary,
  onSummaryMouseEnter,
  onSummaryMouseLeave,
  onSummaryExpandClick,
  onSummaryCollapseClick,
  onSummaryDetailShortcutClick,
  onForecastScenarioHoverChange,
}: OverviewEventFirstAccordionRowProps) => {
  const rowKey = event.eventId
  const { shouldRenderDetail, detailRevealNonce, handleDetailExited } = useOverviewAccordionDetailLifecycle(expanded)
  const isMorphing = expanded || shouldRenderDetail
  const isExpandedRowSticky = enableExpandedRowSticky && expandedRowStickyTopPx !== undefined
  const stickyGapPx = isExpandedRowSticky ? OVERVIEW_ACCORDION_EXPANDED_ROW_GAP_Y_PX : 0

  const accordionContent = (
    <>
      <OverviewAccordionSummaryRow<IOverviewEventItem>
        row={event}
        rowKey={rowKey}
        columns={columns}
        gridTemplateColumns={gridTemplateColumns}
        expanded={expanded}
        actionColumnField={actionColumnField}
        actionLabel="관련 시나리오 접기"
        minHeight={56}
        getCellSx={getCellSx}
        onCollapsedSummaryClick={onSummaryExpandClick}
        onExpandedCollapseClick={onSummaryCollapseClick}
        onMouseEnter={onSummaryMouseEnter}
        onMouseLeave={onSummaryMouseLeave}
        collapsedSummaryHovered={summaryHovered}
        onCollapsedDetailShortcutClick={onSummaryDetailShortcutClick}
        sx={[
          ...toSxArray(
            accordionSummarySurfaceSx({
              expanded,
              hovered: summaryHovered,
              beforeHovered: beforeHoveredSummary,
              beforeExpanded: beforeExpandedSummary,
            }),
          ),
          ...toSxArray(rowSx),
        ]}
      />

      {shouldRenderDetail && (
        <OverviewAccordionCollapse expanded={expanded} onExited={handleDetailExited}>
          <Box sx={{ pt: '8px' }}>
            <OverviewEventScenariosTable
              event={event}
              detailRevealNonce={detailRevealNonce}
              onForecastScenarioHoverChange={onForecastScenarioHoverChange}
            />
          </Box>
        </OverviewAccordionCollapse>
      )}
    </>
  )

  const accordionFrameSx = [
    ...toSxArray(
      accordionFrameSurfaceSx({
        expanded,
        animating: isMorphing,
      }),
    ),
    {
      width: '100%',
      maxWidth: '100%',
    },
  ]

  if (!isExpandedRowSticky) {
    return (
      <Box
        sx={[
          ...accordionFrameSx,
          {
            position: 'relative',
          },
        ]}
      >
        {accordionContent}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'sticky',
        top: expandedRowStickyTopPx,
        zIndex: 150,
        display: 'flow-root',
        width: '100%',
        maxWidth: '100%',
        pt: stickyGapPx === 0 ? 0 : `${stickyGapPx}px`,
        boxSizing: 'border-box',
      }}
    >
      {isExpandedRowSticky && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${stickyGapPx}px`,
            bgcolor: 'commonColor.White',
            pointerEvents: 'none',
          }}
        />
      )}
      <Box sx={[...accordionFrameSx, { mt: 0 }]}>{accordionContent}</Box>
    </Box>
  )
}

export interface OverviewEventFirstAccordionListProps {
  columns: GridColDef<IOverviewEventItem>[]
  rows: IOverviewEventItem[]
  loading: boolean
  skeletonRowCount?: number
  noRowMessage: string
  selectedEventId: number | null
  actionColumnField?: string
  enableExpandedRowSticky?: boolean
  expandedRowStickyTopPx?: number
  categoryLabelTyped: (code: EventCategoryLv1 | undefined, labelFromApi?: string) => string
  getCellSx?: (params: { field: string; row?: IOverviewEventItem }) => SxProps<Theme>
  rowSx?: SxProps<Theme>
  onRowClick: (row: IOverviewEventItem) => void
  onAccordionCollapse: () => void
  onSummaryDetailShortcutClick?: (row: IOverviewEventItem) => void
  onForecastScenarioHoverChange?: (scenarioId: number | null) => void
  sx?: SxProps<Theme>
}

export const OverviewEventFirstAccordionList = ({
  columns,
  rows,
  loading,
  skeletonRowCount,
  noRowMessage,
  selectedEventId,
  actionColumnField,
  enableExpandedRowSticky = false,
  expandedRowStickyTopPx,
  categoryLabelTyped,
  getCellSx,
  rowSx,
  onRowClick,
  onAccordionCollapse,
  onSummaryDetailShortcutClick,
  onForecastScenarioHoverChange,
  sx,
}: OverviewEventFirstAccordionListProps) => {
  const gridTemplateColumns = useMemo(() => overviewColumnsToGridTemplate(columns), [columns])
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null)

  if (loading) {
    return (
      <ScenarioWorkbenchDataList<IOverviewEventItem>
        columns={columns}
        rows={[]}
        loading
        skeletonRowCount={skeletonRowCount}
        rowHeight={OVERVIEW_ACCORDION_LIST_LOADING_ROW_HEIGHT_PX}
        rowSx={rowSx}
        getCellSx={getCellSx}
        cellPreset="miCanvasEvent"
        sx={sx}
      />
    )
  }

  if (!rows || rows.length === 0) {
    return <OverviewAccordionNoRows message={noRowMessage} />
  }

  return (
    <Stack
      gap={0}
      sx={[
        {
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          pt: `${SCENARIO_WORKBENCH_DATA_LIST_FIRST_ROW_TOP_INSET_DEFAULT_PX}px`,
        },
        ...toSxArray(sx),
      ]}
    >
      {rows.map((row, idx) => {
        const expanded = selectedEventId !== null && row.eventId === selectedEventId
        const nextEventId = idx < rows.length - 1 ? rows[idx + 1].eventId : null
        const summaryHovered = !expanded && hoveredEventId === row.eventId
        const beforeHoveredSummary = !expanded && nextEventId !== null && hoveredEventId === nextEventId
        const beforeExpandedSummary = !expanded && nextEventId !== null && selectedEventId === nextEventId
        const rowColumns = expanded
          ? columns.map((col) =>
            col.field === 'eventName'
              ? {
                ...col,
                renderCell: (params: GridRenderCellParams<IOverviewEventItem>) => {
                  const r = params.row
                  const timeLabel = formatWorkbenchDateTime(r.updatedAt ?? r.createdAt)
                  const cat = categoryLabelTyped(r.eventCategoryLv1, r.eventCategoryLv1Label)
                  const noise = scenarioWorkbenchIsEventNoiseSignal(r.signalType)
                  return (
                    <Stack alignItems="flex-start" gap="4px" minWidth={0} width="100%" py="2px">
                      <Stack direction="row" alignItems="center" gap="8px" minWidth={0} width="100%">
                        <ScenarioWorkbenchEventDetailTableBodyText
                          value={r.eventName}
                          variant="body1SB16"
                          color="contentText.Black"
                          tooltipWhenTruncated
                          sx={{ minWidth: 0, flex: '0 1 auto', width: 'auto' }}
                        />
                        {noise && (
                          <Box sx={{ flex: '0 0 auto', display: 'inline-flex', lineHeight: 0 }}>
                            <ScenarioWorkbenchNoiseSignalBadge label={r.signalTypeLabel ?? '소음'} />
                          </Box>
                        )}
                      </Stack>
                      <Stack direction="row" alignItems="center" gap="8px" minWidth={0}>
                        <Typography variant="body2M14" color="contentText.Subtext" noWrap>
                          {timeLabel}
                        </Typography>
                        <Box width="1px" height={12} bgcolor="contentBorder.Normal" flexShrink={0} />
                        <Typography variant="body2M14" color="contentText.Subtext" noWrap>
                          {cat}
                        </Typography>
                      </Stack>
                    </Stack>
                  )
                },
              }
              : col,
          )
          : columns

        return (
          <OverviewEventFirstAccordionRow
            key={row.eventId}
            enableExpandedRowSticky={enableExpandedRowSticky}
            expandedRowStickyTopPx={expanded ? expandedRowStickyTopPx : undefined}
            columns={rowColumns}
            event={row}
            expanded={expanded}
            gridTemplateColumns={gridTemplateColumns}
            actionColumnField={actionColumnField}
            getCellSx={getCellSx}
            rowSx={rowSx}
            summaryHovered={summaryHovered}
            beforeHoveredSummary={beforeHoveredSummary}
            beforeExpandedSummary={beforeExpandedSummary}
            onSummaryMouseEnter={() => {
              if (!expanded) setHoveredEventId(row.eventId)
            }}
            onSummaryMouseLeave={() => {
              setHoveredEventId((current) => (current === row.eventId ? null : current))
            }}
            onSummaryExpandClick={() => onRowClick(row)}
            onSummaryCollapseClick={onAccordionCollapse}
            onSummaryDetailShortcutClick={onSummaryDetailShortcutClick ? () => onSummaryDetailShortcutClick(row) : undefined}
            onForecastScenarioHoverChange={expanded ? onForecastScenarioHoverChange : undefined}
          />
        )
      })}
    </Stack>
  )
}
