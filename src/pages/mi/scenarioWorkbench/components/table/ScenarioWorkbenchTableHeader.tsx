import { Box, Typography, type SxProps, type Theme, type TypographyProps } from '@mui/material'
import { type GridColDef, type GridRowModel } from '@mui/x-data-grid'
import { useMemo } from 'react'

export const SCENARIO_WORKBENCH_TABLE_HEADER_STICKY_TOP_PX = 138

const toCssLength = (value: number | string) => (typeof value === 'number' ? `${value}px` : value)

export interface ScenarioWorkbenchTableHeaderProps<T extends GridRowModel> {
  columns: GridColDef<T>[]
  sx?: SxProps<Theme>
  sticky?: boolean
  stickyTop?: number | string // sticky 시 스크롤포트 상단으로부터의 오프셋
  headerCellPx?: number | string
  headerCellPy?: number | string
  headerLabelColor?: TypographyProps['color']
}

const ScenarioWorkbenchTableHeader = <T extends GridRowModel>({
  columns,
  sx,
  sticky,
  stickyTop,
  headerCellPx,
  headerCellPy,
  headerLabelColor,
}: ScenarioWorkbenchTableHeaderProps<T>) => {
  const px = toCssLength(headerCellPx ?? '12px')
  const pyDefined = headerCellPy !== undefined && headerCellPy !== null
  const py = pyDefined ? toCssLength(headerCellPy) : undefined
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

  return (
    <Box
      sx={[
        (theme) => ({
          display: 'grid',
          gridTemplateColumns,
          alignItems: 'center',
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          ...(pyDefined ? { minHeight: 36, height: 'auto' } : { height: 36 }),
          borderBottom: `0.5px solid ${theme.palette.gray[60]}`,
          bgcolor: 'transparent',
          mb: 0,
          ...(sticky
            ? {
              position: 'sticky',
              top: stickyTop ?? SCENARIO_WORKBENCH_TABLE_HEADER_STICKY_TOP_PX,
              zIndex: 160,
              pb: 0,
            }
            : {}),
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {columns.map((col) => (
        <Box
          key={col.field}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
            px,
            ...(py !== undefined ? { py } : {}),
            overflow: 'hidden',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="body2SB14" color={headerLabelColor ?? 'gray.70'} noWrap>
            {col.headerName ?? ''}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

export default ScenarioWorkbenchTableHeader
