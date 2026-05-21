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

import type { IOverviewEventBrief, IOverviewScenarioItem } from '@/service/mi/scenarioWorkbench/overview'

import MIDataTableBody, { MI_DATA_TABLE_BODY_TOP_PADDING_DEFAULT_PX } from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { ScenarioWorkbenchBaseCaseChip } from '@/pages/mi/scenarioWorkbench/components/common/ClassificationTag'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import { findIndexImpact, formatWorkbenchDateTime } from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'
import ScenarioWorkbenchEventDetailTableBodyText, {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import { EventCategoryLv1, MarketDirection } from '@/service/mi/scenarioWorkbench/common'

const OVERVIEW_DETAIL_ACTION_FIELD = '__overviewAccordionAction'

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

const eventDetailCellSx = (params: { field: string }) => {
  if (params.field === OVERVIEW_DETAIL_ACTION_FIELD) {
    return { px: 0, py: 0 }
  }
  if (params.field === 'eventName') {
    return { py: '2px' }
  }
  if (params.field === 'jkmImpact' || params.field === 'ttfImpact' || params.field === 'hhImpact') {
    return { px: '8px', py: '6px' }
  }
  return {}
}

const EventTitleCell = ({
  row,
  categoryLabelTyped,
  onNameNavigate,
}: {
  row: IOverviewEventBrief
  categoryLabelTyped: (code: EventCategoryLv1 | undefined, labelFromApi?: string) => string
  onNameNavigate: (row: IOverviewEventBrief) => void
}) => {
  const timeLabel = formatWorkbenchDateTime(row.updatedAt ?? row.createdAt)
  const categoryLabel = categoryLabelTyped(row.eventCategoryLv1, row.eventCategoryLv1Label)

  return (
    <Stack alignItems="flex-start" gap="4px" minWidth={0} width="100%">
      <ScenarioWorkbenchEventDetailTableBodyText
        value={row.eventName}
        tooltipWhenTruncated
        onClick={(e) => {
          e.stopPropagation()
          onNameNavigate(row)
        }}
        sx={{
          fontSize: 16,
          fontWeight: 500,
          lineHeight: 1.4,
          minWidth: 0,
          width: '100%',
          color: 'contentText.Normal',
        }}
      />
      <Stack direction="row" alignItems="center" gap="8px" minWidth={0}>
        <Typography fontSize={12} fontWeight={500} lineHeight={1.4} color="contentText.Subtext" noWrap>
          {timeLabel}
        </Typography>
        <Box width="1px" height={12} bgcolor="contentBorder.Normal" flexShrink={0} />
        <Typography fontSize={12} fontWeight={500} lineHeight={1.4} color="contentText.Subtext" noWrap>
          {categoryLabel}
        </Typography>
      </Stack>
    </Stack>
  )
}

export interface OverviewScenarioEventsTableProps {
  scenario: IOverviewScenarioItem
  categoryLabelTyped: (code: EventCategoryLv1 | undefined, labelFromApi?: string) => string
  detailRevealNonce?: number
}

export const OverviewScenarioEventsTable = ({ scenario, categoryLabelTyped, detailRevealNonce = 0 }: OverviewScenarioEventsTableProps) => {
  const navigate = useNavigate()
  const goEventDetail = useCallback(
    (eventId: number) => {
      navigate(`/mi/scenario-workbench/events/${eventId}`)
    },
    [navigate],
  )

  const events = scenario.events ?? []

  const eventColumns: GridColDef<IOverviewEventBrief>[] = useMemo(
    () => [
      {
        field: 'eventName',
        headerName: '이벤트',
        flex: 1,
        minWidth: 220,
        sortable: false,
        align: 'left',
        headerAlign: 'left',
        renderCell: (params: GridRenderCellParams<IOverviewEventBrief>) => (
          <EventTitleCell row={params.row} categoryLabelTyped={categoryLabelTyped} onNameNavigate={(r) => goEventDetail(r.eventId)} />
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
          return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction as MarketDirection | undefined} size={7} />
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
          return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction as MarketDirection | undefined} size={7} />
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
          return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction as MarketDirection | undefined} size={7} />
        },
      },
      {
        field: OVERVIEW_DETAIL_ACTION_FIELD,
        headerName: '',
        width: OVERVIEW_ACCORDION_ACTION_COLUMN_WIDTH_PX,
        sortable: false,
        renderCell: () => null,
      },
    ],
    [categoryLabelTyped, goEventDetail],
  )

  const headerCellSxMatchingBody = useCallback((col: GridColDef<IOverviewEventBrief>) => {
    const bodySx = eventDetailCellSx({ field: col.field })
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
      <MIDataTableHeader<IOverviewEventBrief>
        columns={eventColumns}
        sx={OVERVIEW_DETAIL_HEADER_SX}
        headerLabelColor="contentText.Normal"
        getHeaderCellSx={headerCellSxMatchingBody}
      />

      <OverviewAccordionDetailBodyReveal revealKey={detailRevealNonce}>
        {events.length === 0 ? (
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
              연결된 이벤트가 없습니다.
            </Typography>
          </Box>
        ) : (
          <MIDataTableBody<IOverviewEventBrief>
            rowId="eventId"
            columns={eventColumns}
            rows={events}
            rowHeight={OVERVIEW_ACCORDION_DETAIL_ROW_HEIGHT_PX}
            hideLastRowBorder
            rowSx={OVERVIEW_DETAIL_ROW_SX}
            getCellSx={eventDetailCellSx}
            primitiveCellTypographyVariant={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT}
            primitiveCellLineHeight={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT}
            cellPx={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX}
            cellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY}
            detailShortcutColumnField={OVERVIEW_DETAIL_ACTION_FIELD}
            onDetailShortcutClick={({ row: r }) => goEventDetail(r.eventId)}
          />
        )}
      </OverviewAccordionDetailBodyReveal>
    </Box>
  )
}

export interface OverviewScenarioFirstAccordionRowProps {
  scenario: IOverviewScenarioItem
  expanded: boolean
  columns: GridColDef<IOverviewScenarioItem>[]
  gridTemplateColumns: string
  actionColumnField?: string
  getCellSx?: (params: { field: string; row?: IOverviewScenarioItem }) => SxProps<Theme>
  rowSx?: SxProps<Theme>
  enableExpandedRowSticky?: boolean
  expandedRowStickyTopPx?: number
  summaryHovered?: boolean
  beforeHoveredSummary?: boolean
  beforeExpandedSummary?: boolean
  onSummaryMouseEnter?: () => void
  onSummaryMouseLeave?: () => void
  categoryLabelTyped: (code: EventCategoryLv1 | undefined, labelFromApi?: string) => string
  onSummaryExpandClick: () => void
  onSummaryCollapseClick: () => void
  onSummaryDetailShortcutClick?: () => void
}

export const OverviewScenarioFirstAccordionRow = ({
  scenario,
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
  categoryLabelTyped,
  onSummaryExpandClick,
  onSummaryCollapseClick,
  onSummaryDetailShortcutClick,
}: OverviewScenarioFirstAccordionRowProps) => {
  const rowKey = scenario.scenarioId
  const { shouldRenderDetail, detailRevealNonce, handleDetailExited } = useOverviewAccordionDetailLifecycle(expanded)
  const isMorphing = expanded || shouldRenderDetail
  const isExpandedRowSticky = enableExpandedRowSticky && expandedRowStickyTopPx !== undefined
  const stickyGapPx = isExpandedRowSticky ? OVERVIEW_ACCORDION_EXPANDED_ROW_GAP_Y_PX : 0

  const accordionContent = (
    <>
      <OverviewAccordionSummaryRow<IOverviewScenarioItem>
        row={scenario}
        rowKey={rowKey}
        columns={columns}
        gridTemplateColumns={gridTemplateColumns}
        expanded={expanded}
        actionColumnField={actionColumnField}
        actionLabel="관련 이벤트 접기"
        minHeight={55}
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
            <OverviewScenarioEventsTable
              scenario={scenario}
              categoryLabelTyped={categoryLabelTyped}
              detailRevealNonce={detailRevealNonce}
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

export interface OverviewScenarioFirstAccordionListProps {
  columns: GridColDef<IOverviewScenarioItem>[]
  rows: IOverviewScenarioItem[]
  loading: boolean
  skeletonRowCount?: number
  noRowMessage: string
  selectedScenarioId: number | null
  actionColumnField?: string
  enableExpandedRowSticky?: boolean
  expandedRowStickyTopPx?: number
  categoryLabelTyped: (code: EventCategoryLv1 | undefined, labelFromApi?: string) => string
  getCellSx?: (params: { field: string; row?: IOverviewScenarioItem }) => SxProps<Theme>
  rowSx?: SxProps<Theme>
  onRowClick: (row: IOverviewScenarioItem) => void
  onAccordionCollapse: () => void
  onSummaryDetailShortcutClick?: (row: IOverviewScenarioItem) => void
  onScenarioSummaryHoverChange?: (scenarioId: number | null) => void
  sx?: SxProps<Theme>
}

export const OverviewScenarioFirstAccordionList = ({
  columns,
  rows,
  loading,
  skeletonRowCount,
  noRowMessage,
  selectedScenarioId,
  actionColumnField,
  enableExpandedRowSticky = false,
  expandedRowStickyTopPx,
  categoryLabelTyped,
  getCellSx,
  rowSx,
  onRowClick,
  onAccordionCollapse,
  onSummaryDetailShortcutClick,
  onScenarioSummaryHoverChange,
  sx,
}: OverviewScenarioFirstAccordionListProps) => {
  const gridTemplateColumns = useMemo(() => overviewColumnsToGridTemplate(columns), [columns])
  const [hoveredScenarioId, setHoveredScenarioId] = useState<number | null>(null)

  if (loading) {
    return (
      <MIDataTableBody<IOverviewScenarioItem>
        columns={columns}
        rows={[]}
        loading
        skeletonRowCount={skeletonRowCount}
        rowHeight={OVERVIEW_ACCORDION_LIST_LOADING_ROW_HEIGHT_PX}
        rowSx={rowSx}
        getCellSx={getCellSx}
        primitiveCellTypographyVariant={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT}
        primitiveCellLineHeight={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT}
        cellPx={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX}
        cellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY}
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
          pt: `${MI_DATA_TABLE_BODY_TOP_PADDING_DEFAULT_PX}px`,
        },
        ...toSxArray(sx),
      ]}
    >
      {rows.map((row, idx) => {
        const expanded = selectedScenarioId !== null && row.scenarioId === selectedScenarioId
        const nextScenarioId = idx < rows.length - 1 ? rows[idx + 1].scenarioId : null
        const summaryHovered = !expanded && hoveredScenarioId === row.scenarioId
        const beforeHoveredSummary = !expanded && nextScenarioId !== null && hoveredScenarioId === nextScenarioId
        const beforeExpandedSummary = !expanded && nextScenarioId !== null && selectedScenarioId === nextScenarioId
        const rowColumns = expanded
          ? columns.map((col) =>
            col.field === 'scenarioName'
              ? {
                ...col,
                renderCell: (params: GridRenderCellParams<IOverviewScenarioItem>) => {
                  const r = params.row
                  const timeLabel = formatWorkbenchDateTime(r.updatedAt ?? r.createdAt)
                  const tagLabel = formatOverviewScenarioTags(r.tags)
                  const metaLabel = [timeLabel !== '-' ? timeLabel : '', tagLabel].filter(Boolean).join(' | ')
                  return (
                    <Stack alignItems="flex-start" gap="4px" minWidth={0} width="100%" py="2px">
                      <Stack direction="row" alignItems="center" gap="8px" minWidth={0} width="100%">
                        <ScenarioWorkbenchEventDetailTableBodyText
                          value={r.scenarioName}
                          variant="body1SB16"
                          color="contentText.Black"
                          tooltipWhenTruncated
                          sx={{ minWidth: 0, flex: '0 1 auto', width: 'auto' }}
                        />
                        {r.baseCase && (
                          <Box sx={{ flex: '0 0 auto', display: 'inline-flex', lineHeight: 0 }}>
                            <ScenarioWorkbenchBaseCaseChip />
                          </Box>
                        )}
                      </Stack>
                      {metaLabel && (
                        <Typography variant="body2M14" color="contentText.Subtext" noWrap sx={{ minWidth: 0, width: '100%' }}>
                          {metaLabel}
                        </Typography>
                      )}
                    </Stack>
                  )
                },
              }
              : col,
          )
          : columns

        return (
          <OverviewScenarioFirstAccordionRow
            key={row.scenarioId}
            enableExpandedRowSticky={enableExpandedRowSticky}
            expandedRowStickyTopPx={expanded ? expandedRowStickyTopPx : undefined}
            columns={rowColumns}
            scenario={row}
            expanded={expanded}
            gridTemplateColumns={gridTemplateColumns}
            actionColumnField={actionColumnField}
            getCellSx={getCellSx}
            rowSx={rowSx}
            summaryHovered={summaryHovered}
            beforeHoveredSummary={beforeHoveredSummary}
            beforeExpandedSummary={beforeExpandedSummary}
            onSummaryMouseEnter={() => {
              if (!expanded) {
                setHoveredScenarioId(row.scenarioId)
                onScenarioSummaryHoverChange?.(row.scenarioId)
              }
            }}
            onSummaryMouseLeave={() => {
              if (!expanded) {
                setHoveredScenarioId((current) => (current === row.scenarioId ? null : current))
                onScenarioSummaryHoverChange?.(null)
              }
            }}
            categoryLabelTyped={categoryLabelTyped}
            onSummaryExpandClick={() => onRowClick(row)}
            onSummaryCollapseClick={onAccordionCollapse}
            onSummaryDetailShortcutClick={onSummaryDetailShortcutClick ? () => onSummaryDetailShortcutClick(row) : undefined}
          />
        )
      })}
    </Stack>
  )
}
