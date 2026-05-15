import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Skeleton, Stack, type SxProps, type Theme, Typography, type TypographyProps } from '@mui/material'
import { type GridColDef, type GridRowModel } from '@mui/x-data-grid'
import { isValidElement, type ReactNode, useMemo, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import ScenarioWorkbenchEventDetailTableBodyText, {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import WorkbenchFollowCursorTooltip from '@/pages/mi/scenarioWorkbench/components/common/WorkbenchFollowCursorTooltip'
import { scenarioWorkbenchColumnsToGridTemplate } from '@/pages/mi/scenarioWorkbench/components/table/scenarioWorkbenchGridColTemplate'

export const SCENARIO_WORKBENCH_DATA_LIST_FIRST_ROW_TOP_INSET_DEFAULT_PX = 4

const DETAIL_SHORTCUT_HOVER_MS = 220
const DETAIL_SHORTCUT_HOVER_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
export type ScenarioWorkbenchDataListCellPreset = 'default' | 'miCanvasEvent'

export interface ScenarioWorkbenchDataListProps<T extends GridRowModel>
  extends Partial<{
    loading: boolean
    skeletonRowCount: number
    showCellSkeleton: (col: GridColDef<T>) => boolean
    noRowMessage: string
    disableHover: boolean
    rowHeight: number
    getRowKey: (row: T, index: number) => string | number
    getRowClassName: (params: { row: T }) => string
    onRowClick: (params: { row: T }) => void
    onRowMouseEnter: (params: { row: T }) => void
    onRowMouseLeave: () => void
    sx: SxProps<Theme>
    rowSx: SxProps<Theme>
    rowGap: number | string
    getCellSx: (params: { field: string; row?: T }) => SxProps<Theme>
    hideLastRowBorder: boolean
    hideInnerRowBorder: boolean
    primitiveCellTypographyVariant: TypographyProps['variant']
    cellPreset: ScenarioWorkbenchDataListCellPreset
    detailShortcutColumnField?: string
    onDetailShortcutClick?: (params: { row: T }) => void
    disableFirstRowTopInset?: boolean
  }> {
  rowId?: keyof T
  columns: GridColDef<T>[]
  rows?: T[]
}

const renderCellContentToNode = (content: unknown): ReactNode => {
  if (content === null || content === undefined) return null
  if (isValidElement(content)) return content
  if (typeof content === 'string' || typeof content === 'number') return content
  return String(content)
}

const toSxArray = (sx?: SxProps<Theme>) => (Array.isArray(sx) ? sx : sx ? [sx] : [])

const SKELETON_ROW_MIN_HEIGHT_WHEN_ROW_HEIGHT_AUTO_PX = 48
const ROW_HOVER_BORDER_RADIUS = '10px'

const defaultShowCellSkeleton = <T extends GridRowModel>(col: GridColDef<T>) => String(col.headerName ?? '').trim() !== ''

const DefaultEllipsisTooltip = ({
  value,
  children,
  textAlign,
}: {
  value: string
  children: ReactNode
  textAlign: 'left' | 'center' | 'right'
}) => {
  const { ref, isEllipsis } = useEllipsisDetection(value)

  if (!isEllipsis) {
    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          textAlign,
        }}
      >
        {children}
      </Box>
    )
  }

  return (
    <WorkbenchFollowCursorTooltip title={value}>
      <Box
        ref={ref}
        sx={{
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          textAlign,
        }}
      >
        {children}
      </Box>
    </WorkbenchFollowCursorTooltip>
  )
}

const ScenarioWorkbenchDataList = <T extends GridRowModel>({
  rowId,
  columns,
  rows,
  loading,
  skeletonRowCount,
  showCellSkeleton,
  noRowMessage,
  disableHover,
  onRowClick,
  onRowMouseEnter,
  onRowMouseLeave,
  rowHeight,
  getRowKey,
  getRowClassName,
  hideLastRowBorder,
  hideInnerRowBorder,
  primitiveCellTypographyVariant,
  cellPreset,
  rowSx,
  rowGap,
  getCellSx,
  sx,
  detailShortcutColumnField,
  onDetailShortcutClick,
  disableFirstRowTopInset,
}: ScenarioWorkbenchDataListProps<T>) => {
  const preset = cellPreset ?? 'default'
  const isMiCanvas = preset === 'miCanvasEvent'
  const cellPx = `${SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX}px`
  const primitiveVariant: TypographyProps['variant'] =
    primitiveCellTypographyVariant ?? (isMiCanvas ? SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT : 'body1M16')
  const primitiveBodySx = isMiCanvas ? { lineHeight: SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT } : undefined
  const cellBoxSx = {
    px: cellPx,
    ...(isMiCanvas ? { py: `${SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY}px` } : {}),
    overflow: 'hidden',
    minWidth: 0,
    boxSizing: 'border-box' as const,
  }

  const hasFixedRowHeight = typeof rowHeight === 'number'
  const skeletonRows = Math.max(1, skeletonRowCount ?? 8)
  const resolveShowCellSkeleton = showCellSkeleton ?? defaultShowCellSkeleton
  const rowSxArray = toSxArray(rowSx)
  const [hoveredRowKey, setHoveredRowKey] = useState<string | number | null>(null)
  const gridTemplateColumns = useMemo(() => scenarioWorkbenchColumnsToGridTemplate(columns), [columns])

  const rowKey = (row: T, index: number) => (getRowKey ? getRowKey(row, index) : rowId ? row[rowId] : index)

  const cellJustifyContent = (align?: GridColDef['align']) =>
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'

  const firstRowTopInsetPx = disableFirstRowTopInset ? 0 : SCENARIO_WORKBENCH_DATA_LIST_FIRST_ROW_TOP_INSET_DEFAULT_PX

  let body: ReactNode
  if (loading) {
    body = (
      <Stack gap={rowGap ?? 0}>
        {Array.from({ length: skeletonRows }).map((_, idx) => (
          <Box
            key={idx}
            sx={[
              (theme) => {
                const isLastSkeletonRow = idx === skeletonRows - 1
                const showBorder = (hideInnerRowBorder ? isLastSkeletonRow : true) && (!isLastSkeletonRow || !hideLastRowBorder)
                return {
                  display: 'grid',
                  gridTemplateColumns,
                  alignItems: hasFixedRowHeight ? 'center' : 'stretch',
                  ...(hasFixedRowHeight ? { height: rowHeight } : { minHeight: SKELETON_ROW_MIN_HEIGHT_WHEN_ROW_HEIGHT_AUTO_PX }),
                  borderBottom: showBorder ? `1px solid ${theme.palette.contentBorder?.Normal ?? theme.palette.gray[40]}` : 'none',
                }
              },
              ...rowSxArray,
            ]}
          >
            {columns.map((col) => (
              <Box
                key={col.field}
                sx={[
                  {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: cellJustifyContent(col.align),
                    ...cellBoxSx,
                  },
                  ...toSxArray(getCellSx?.({ field: col.field })),
                ]}
              >
                {resolveShowCellSkeleton(col) ? (
                  <Skeleton
                    variant="rounded"
                    width="100%"
                    height={hasFixedRowHeight ? Math.min(28, rowHeight - 8) : 28}
                    sx={{ maxWidth: '100%' }}
                  />
                ) : null}
              </Box>
            ))}
          </Box>
        ))}
      </Stack>
    )
  } else if (!rows || rows.length === 0) {
    body = (
      <Box
        sx={{
          width: '100%',
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'gray.5',
          borderRadius: '10px',
        }}
      >
        <Typography variant="body6" color="gray.60">
          {noRowMessage ?? 'No results found'}
        </Typography>
      </Box>
    )
  } else {
    body = (
      <Stack gap={rowGap ?? 0} sx={{ width: '100%', minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
        {rows.map((row, idx) => {
          const currentKey = rowKey(row, idx)
          const nextKey = idx < rows.length - 1 ? rowKey(rows[idx + 1], idx + 1) : null
          const isRowHovered = !disableHover && hoveredRowKey === currentKey
          const isBeforeHoveredRow = !disableHover && nextKey !== null && hoveredRowKey === nextKey

          return (
            <Box
              key={currentKey}
              onClick={onRowClick ? () => onRowClick({ row }) : undefined}
              onMouseEnter={() => {
                if (!disableHover) {
                  setHoveredRowKey(currentKey)
                }
                onRowMouseEnter?.({ row })
              }}
              onMouseLeave={() => {
                setHoveredRowKey(null)
                onRowMouseLeave?.()
              }}
              className={getRowClassName?.({ row })}
              sx={[
                (theme) => {
                  const showDivider = hideInnerRowBorder
                    ? idx === rows.length - 1 && !hideLastRowBorder
                    : idx < rows.length - 1 || !hideLastRowBorder
                  const dividerColor = hideInnerRowBorder
                    ? (theme.palette.contentBorder?.Normal ?? theme.palette.mari[40])
                    : (theme.palette.contentBorder?.Normal ?? theme.palette.gray[40])
                  const rowHoverBgColor = theme.palette.gray[10]
                  const hideDividerForHover = showDivider && (isRowHovered || isBeforeHoveredRow)

                  return {
                    display: 'grid',
                    gridTemplateColumns,
                    alignItems: hasFixedRowHeight ? 'center' : 'stretch',
                    ...(hasFixedRowHeight ? { height: rowHeight } : {}),
                    width: '100%',
                    minWidth: 0,
                    maxWidth: '100%',
                    position: 'relative',
                    zIndex: isRowHovered ? 1 : 0,
                    bgcolor: 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                    borderBottom: showDivider ? `1px solid ${hideDividerForHover ? 'transparent' : dividerColor}` : 'none',
                    borderRadius: isRowHovered ? ROW_HOVER_BORDER_RADIUS : 0,
                    transition: 'background-color 120ms ease, border-color 120ms ease, border-radius 120ms ease',
                    ...(disableHover
                      ? {}
                      : {
                        '&:hover': {
                          backgroundColor: rowHoverBgColor,
                          borderRadius: ROW_HOVER_BORDER_RADIUS,
                        },
                      }),
                  }
                },
                ...rowSxArray,
              ]}
            >
              {columns.map((col) => {
                const value = (row as Record<string, unknown>)[col.field]
                const showDetailShortcutCell =
                  detailShortcutColumnField !== undefined && onDetailShortcutClick !== undefined && col.field === detailShortcutColumnField

                if (showDetailShortcutCell) {
                  return (
                    <Box
                      key={col.field}
                      sx={[
                        {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: cellJustifyContent(col.align),
                          ...cellBoxSx,
                        },
                        ...toSxArray(getCellSx?.({ field: col.field, row })),
                      ]}
                    >
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          opacity: isRowHovered ? 1 : 0,
                          transition: `opacity ${DETAIL_SHORTCUT_HOVER_MS}ms ${DETAIL_SHORTCUT_HOVER_EASE}`,
                          pointerEvents: isRowHovered ? 'auto' : 'none',
                          '@media (prefers-reduced-motion: reduce)': {
                            transition: 'none',
                          },
                        }}
                      >
                        <MIBaseButton
                          variant="outlined"
                          enableHoverBackground
                          aria-label="상세 보기"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDetailShortcutClick({ row })
                          }}
                          sx={{
                            width: '22px',
                            minWidth: '0px',
                            height: '22px',
                            padding: '3px',
                            borderRadius: '4px',
                            backgroundColor: 'commonColor.White',
                          }}
                        >
                          <OpenInNewIcon sx={{ fontSize: 14, color: 'contentIcon.Enabled' }} />
                        </MIBaseButton>
                      </Box>
                    </Box>
                  )
                }

                const content = col.renderCell
                  ? col.renderCell({
                    value,
                    row,
                    field: col.field,
                    id: currentKey,
                    api: undefined,
                    rowNode: undefined,
                    colDef: col,
                    cellMode: 'view',
                    hasFocus: false,
                    tabIndex: 0,
                    formattedValue: value,
                    isEditable: false,
                  } as never)
                  : value
                const node = renderCellContentToNode(content)

                const textAlign: 'left' | 'center' | 'right' = col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left'

                const shouldWrapEllipsisTooltip =
                  !col.renderCell &&
                  typeof value === 'string' &&
                  value.length > 0 &&
                  col.field !== 'status' &&
                  col.field !== 'type' &&
                  col.field !== 'jkmImpact' &&
                  col.field !== 'ttfImpact' &&
                  col.field !== 'hhImpact'

                return (
                  <Box
                    key={col.field}
                    sx={[
                      {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: cellJustifyContent(col.align),
                        ...cellBoxSx,
                      },
                      ...toSxArray(getCellSx?.({ field: col.field, row })),
                    ]}
                  >
                    {typeof node === 'string' || typeof node === 'number' ? (
                      <ScenarioWorkbenchEventDetailTableBodyText
                        value={String(node)}
                        variant={primitiveVariant}
                        tooltipWhenTruncated
                        sx={[
                          {
                            alignSelf: 'stretch',
                            flex: '1 1 0',
                            minWidth: 0,
                            textAlign,
                          },
                          ...(primitiveBodySx ? (Array.isArray(primitiveBodySx) ? primitiveBodySx : [primitiveBodySx]) : []),
                        ]}
                      />
                    ) : shouldWrapEllipsisTooltip ? (
                      <DefaultEllipsisTooltip value={value} textAlign={textAlign}>
                        {node}
                      </DefaultEllipsisTooltip>
                    ) : (
                      node
                    )}
                  </Box>
                )
              })}
            </Box>
          )
        })}
      </Stack>
    )
  }

  return (
    <Stack
      sx={[
        {
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          overflowX: 'hidden',
          ...(firstRowTopInsetPx > 0 ? { pt: `${firstRowTopInsetPx}px` } : {}),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {body}
    </Stack>
  )
}

export default ScenarioWorkbenchDataList
