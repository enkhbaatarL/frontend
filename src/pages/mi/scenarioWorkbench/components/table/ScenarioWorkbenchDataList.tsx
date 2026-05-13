import { Box, Skeleton, Stack, Typography, type SxProps, type Theme, type TypographyProps } from '@mui/material'
import { type GridColDef, type GridRowModel } from '@mui/x-data-grid'
import { isValidElement, useMemo, type ReactNode } from 'react'

import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import ScenarioWorkbenchEventDetailTableBodyText, {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import WorkbenchFollowCursorTooltip from '@/pages/mi/scenarioWorkbench/components/common/WorkbenchFollowCursorTooltip'

export type ScenarioWorkbenchDataListCellPreset = 'default' | 'miCanvasEvent'

export interface ScenarioWorkbenchDataListProps<T extends GridRowModel>
  extends Partial<{
    loading: boolean
    skeletonRowCount: number
    noRowMessage: string
    disableHover: boolean
    rowHeight: number
    getRowKey: (row: T, index: number) => string | number
    getRowClassName: (params: { row: T }) => string
    onRowClick: (params: { row: T }) => void
    onRowMouseEnter: (params: { row: T }) => void
    onRowMouseLeave: () => void
    sx: SxProps<Theme>
    hideLastRowBorder: boolean // 마지막 행 하단 구분선 미표시
    hideInnerRowBorder: boolean // 행 사이 구분선 미표시(마지막 행 하단 구분선은 유지)
    primitiveCellTypographyVariant: TypographyProps['variant']
    cellPreset: ScenarioWorkbenchDataListCellPreset
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
  sx,
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

  const effectiveRowHeight = rowHeight ?? 42
  const skeletonRows = Math.max(1, skeletonRowCount ?? 8)
  const gridTemplateColumns = useMemo(
    () =>
      columns
        .map((col) => {
          if (col.width !== undefined && col.width !== null) {
            return typeof col.width === 'number' ? `${col.width}px` : String(col.width)
          }
          const flex = col.flex ?? 1
          const min = col.minWidth ?? 0
          return `minmax(${min}px, ${flex}fr)`
        })
        .join(' '),
    [columns],
  )

  const rowKey = (row: T, index: number) => {
    const value = getRowKey ? getRowKey(row, index) : rowId ? row[rowId] : index
    return typeof value === 'string' || typeof value === 'number' ? value : String(value)
  }

  const cellJustifyContent = (align?: GridColDef['align']) =>
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'

  let body: ReactNode
  if (loading) {
    body = (
      <Stack gap={0}>
        {Array.from({ length: skeletonRows }).map((_, idx) => (
          <Box
            key={idx}
            sx={(theme) => {
              const isLastSkeletonRow = idx === skeletonRows - 1
              const showBorder =
                // hideInnerRowBorder: 마지막 행 하단 구분선은 유지(단, hideLastRowBorder면 마지막도 숨김)
                (hideInnerRowBorder ? isLastSkeletonRow : true) && (!isLastSkeletonRow || !hideLastRowBorder)
              return {
                display: 'grid',
                gridTemplateColumns,
                alignItems: 'center',
                height: effectiveRowHeight,
                borderBottom: showBorder ? `1px solid ${theme.palette.contentBorder?.Normal ?? theme.palette.gray[40]}` : 'none',
              }
            }}
          >
            {columns.map((col) => (
              <Box key={col.field} sx={cellBoxSx}>
                <Skeleton variant="rounded" height={Math.min(28, effectiveRowHeight - 8)} />
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
      <Stack gap={0} sx={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
        {rows.map((row, idx) => {
          const currentKey = rowKey(row, idx)

          return (
            <Box
              key={currentKey}
              onClick={onRowClick ? () => onRowClick({ row }) : undefined}
              onMouseEnter={onRowMouseEnter ? () => onRowMouseEnter({ row }) : undefined}
              onMouseLeave={onRowMouseLeave}
              className={getRowClassName?.({ row })}
              sx={(theme) => ({
                display: 'grid',
                gridTemplateColumns,
                alignItems: 'center',
                height: effectiveRowHeight,
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                position: 'relative',
                bgcolor: 'transparent',
                cursor: onRowClick ? 'pointer' : 'default',
                borderBottom: hideInnerRowBorder
                  ? idx === rows.length - 1 && !hideLastRowBorder
                    ? `1px solid ${theme.palette.contentBorder?.Normal ?? theme.palette.mari[40]}`
                    : 'none'
                  : idx < rows.length - 1 || !hideLastRowBorder
                    ? `1px solid ${theme.palette.contentBorder?.Normal ?? theme.palette.gray[40]}`
                    : 'none',
                transition: 'background-color 120ms ease',
                ...(disableHover
                  ? {}
                  : {
                    '&:hover': {
                      backgroundColor: theme.palette.gray[10],
                      borderRadius: 0,
                    },
                  }),
              })}
            >
              {columns.map((col) => {
                const value = (row as Record<string, unknown>)[col.field]
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
                  // 상태 칩은 ellipsis 대상이 아님
                  col.field !== 'status' &&
                  col.field !== 'type' &&
                  col.field !== 'jkmImpact' &&
                  col.field !== 'ttfImpact' &&
                  col.field !== 'hhImpact'

                return (
                  <Box
                    key={col.field}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: cellJustifyContent(col.align),
                      ...cellBoxSx,
                    }}
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
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {body}
    </Stack>
  )
}

export default ScenarioWorkbenchDataList
