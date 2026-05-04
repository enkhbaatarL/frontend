import { Box, Skeleton, Stack, Typography, type SxProps, type Theme } from '@mui/material'
import { type GridColDef, type GridRowModel } from '@mui/x-data-grid'
import { isValidElement, type ReactNode } from 'react'

export interface ScenarioWorkbenchDataListProps<T extends GridRowModel>
  extends Partial<{
    loading: boolean
    noRowMessage: string
    disableHover: boolean
    rowHeight: number
    getRowClassName: (params: { row: T }) => string
    onRowClick: (params: { row: T }) => void
    sx: SxProps<Theme>
  }> {
  rowId: keyof T
  columns: GridColDef<T>[]
  rows?: T[]
}

const renderCellContentToNode = (content: unknown): ReactNode => {
  if (content === null || content === undefined) return null
  if (isValidElement(content)) return content
  if (typeof content === 'string' || typeof content === 'number') return content
  return String(content)
}

const ScenarioWorkbenchDataList = <T extends GridRowModel>({
  rowId,
  columns,
  rows,
  loading,
  noRowMessage,
  disableHover,
  onRowClick,
  rowHeight,
  getRowClassName,
  sx,
}: ScenarioWorkbenchDataListProps<T>) => {
  const effectiveRowHeight = rowHeight ?? 42
  const rowKey = (row: T) => {
    const value = row[rowId]
    return typeof value === 'string' || typeof value === 'number' ? value : String(value)
  }

  const cellJustifyContent = (align?: GridColDef['align']) =>
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'

  let body: ReactNode
  if (loading) {
    body = (
      <Stack gap={1}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <Skeleton key={idx} variant="rounded" height={effectiveRowHeight} />
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
      <Stack gap={0}>
        {rows.map((row, idx) => {
          const currentKey = rowKey(row)

          return (
            <Stack
              key={currentKey}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              onClick={onRowClick ? () => onRowClick({ row }) : undefined}
              className={getRowClassName?.({ row })}
              sx={(theme) => ({
                height: effectiveRowHeight,
                width: '100%',
                position: 'relative',
                bgcolor: theme.palette.commonColor?.White ?? theme.palette.common.white,
                cursor: onRowClick ? 'pointer' : 'default',
                borderBottom: idx < rows.length - 1 ? `1px solid ${theme.palette.contentBorder?.Normal ?? theme.palette.gray[40]}` : 'none',
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

                return (
                  <Box
                    key={col.field}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: cellJustifyContent(col.align),
                      px: 1,
                      overflow: 'hidden',
                      ...(col.width
                        ? { flex: '0 0 auto', width: `${col.width}px` }
                        : { flex: `${col.flex ?? 1} 1 0`, minWidth: col.minWidth ? `${col.minWidth}px` : 0 }),
                    }}
                  >
                    {typeof node === 'string' || typeof node === 'number' ? (
                      <Typography variant="body1M16" color="contentText.Normal" noWrap>
                        {node}
                      </Typography>
                    ) : (
                      node
                    )}
                  </Box>
                )
              })}
            </Stack>
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
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {body}
    </Stack>
  )
}

export default ScenarioWorkbenchDataList
