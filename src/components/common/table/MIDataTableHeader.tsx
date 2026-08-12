import { Box, Typography, type SxProps, type Theme, type TypographyProps } from '@mui/material'
import { type GridColDef, type GridRowModel } from '@mui/x-data-grid'
import { useMemo, type ReactNode } from 'react'

import { dataTableColumnsToGridTemplate } from '@/components/common/table/dataTableGridColTemplate'
import MIFollowCursorTooltip from '@/components/common/table/MIFollowCursorTooltip'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'

export const MI_DATA_TABLE_HEADER_DEFAULT_HEIGHT_PX = 36
export const MI_DATA_TABLE_HEADER_DEFAULT_CELL_PX = 12
export const MI_DATA_TABLE_ROW_HEADER_DEFAULT_Z_INDEX = 1

const toCssLength = (value: number | string) => (typeof value === 'number' ? `${value}px` : value)

const toSxArray = (value?: SxProps<Theme>) => (Array.isArray(value) ? value : value ? [value] : [])

export interface MIDataTableRowHeaderOptions {
  colIndex: number
  zIndex?: number
}

export interface MIDataTableHeaderProps<T extends GridRowModel> {
  columns: GridColDef<T>[]
  sx?: SxProps<Theme>
  sticky?: boolean
  stickyTop?: number | string
  stickyZIndex?: number
  headerCellPx?: number | string
  headerCellPy?: number | string
  headerLabelColor?: TypographyProps['color']
  headerLabelVariant?: TypographyProps['variant']
  headerLabelLineClamp?: number
  tooltipWhenHeaderLabelTruncated?: boolean
  bottomBorderColor?: string
  bottomBorderWidth?: number | string
  getHeaderCellSx?: (col: GridColDef<T>) => SxProps<Theme> | undefined
  rowHeader?: MIDataTableRowHeaderOptions
  enableHorizontalScroll?: boolean
}

interface MIDataTableHeaderLabelProps {
  label: ReactNode
  color?: TypographyProps['color']
  variant?: TypographyProps['variant']
  lineClamp?: number
  textAlign?: TypographyProps['textAlign']
  tooltipWhenTruncated?: boolean
}

const MIDataTableHeaderLabel = ({ label, color, variant, lineClamp, textAlign, tooltipWhenTruncated }: MIDataTableHeaderLabelProps) => {
  const { ref, isEllipsis } = useEllipsisDetection(label)

  const typography = (
    <Box sx={{ position: 'relative', width: '100%', minWidth: 0, bgcolor: 'inherit' }}>
      <Typography
        ref={ref}
        variant={variant ?? 'body2SB14'}
        color={color ?? 'gray.70'}
        noWrap={lineClamp === undefined}
        sx={
          lineClamp !== undefined
            ? {
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: lineClamp,
              whiteSpace: 'normal',
              textAlign,
            }
            : undefined
        }
      >
        {label}
      </Typography>
    </Box>
  )

  if (!tooltipWhenTruncated || !isEllipsis) return typography

  return <MIFollowCursorTooltip title={label}>{typography}</MIFollowCursorTooltip>
}

const MIDataTableHeader = <T extends GridRowModel>({
  columns,
  sx,
  sticky,
  stickyTop = 0,
  stickyZIndex = 160,
  headerCellPx,
  headerCellPy,
  headerLabelColor,
  headerLabelVariant,
  headerLabelLineClamp,
  tooltipWhenHeaderLabelTruncated,
  bottomBorderColor,
  bottomBorderWidth,
  getHeaderCellSx,
  rowHeader,
  enableHorizontalScroll,
}: MIDataTableHeaderProps<T>) => {
  const px = toCssLength(headerCellPx ?? `${MI_DATA_TABLE_HEADER_DEFAULT_CELL_PX}px`)
  const pyDefined = headerCellPy !== undefined && headerCellPy !== null
  const py = pyDefined ? toCssLength(headerCellPy) : undefined
  const borderWidth = bottomBorderWidth !== undefined ? toCssLength(bottomBorderWidth) : '0.5px'
  const gridTemplateColumns = useMemo(
    () => dataTableColumnsToGridTemplate(columns, { enableHorizontalScroll }),
    [columns, enableHorizontalScroll],
  )

  // sticky left는 부모 overflow:hidden에서 동작하지 않음 — rowHeader/가로 스크롤 시 overflowX: visible
  const overflowX = rowHeader || enableHorizontalScroll ? 'visible' : 'hidden'
  const rowHeaderZIndex = rowHeader?.zIndex ?? MI_DATA_TABLE_ROW_HEADER_DEFAULT_Z_INDEX

  return (
    <Box
      sx={[
        (theme) => ({
          display: 'grid',
          gridTemplateColumns,
          // stretch: sticky 스크롤 시 셀 배경이 본문을 가리도록
          alignItems: 'stretch',
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX,
          ...(pyDefined
            ? { minHeight: MI_DATA_TABLE_HEADER_DEFAULT_HEIGHT_PX, height: 'auto' }
            : { height: MI_DATA_TABLE_HEADER_DEFAULT_HEIGHT_PX }),
          borderBottom: `${borderWidth} solid ${bottomBorderColor ?? theme.palette.gray[60]}`,
          bgcolor: 'transparent',
          mb: 0,
          ...(sticky
            ? {
              position: 'sticky',
              top: stickyTop,
              zIndex: stickyZIndex,
              pb: 0,
            }
            : {}),
        }),
        ...toSxArray(sx),
      ]}
    >
      {columns.map((col, idx) => {
        const isRowHeaderCol = rowHeader !== undefined && idx === rowHeader.colIndex
        const headerLabel = col.headerName ?? ''
        const textAlign =
          col.headerAlign === 'right' || col.align === 'right'
            ? 'right'
            : col.headerAlign === 'center' || col.align === 'center'
              ? 'center'
              : 'left'

        return (
          <Box
            key={col.field}
            data-row-header={isRowHeaderCol ? 'true' : undefined}
            sx={[
              {
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'stretch',
                justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
                px,
                ...(py !== undefined ? { py } : {}),
                overflow: 'hidden',
                minWidth: 0,
                boxSizing: 'border-box',
                bgcolor: 'inherit',
                ...(isRowHeaderCol
                  ? {
                    position: 'sticky',
                    left: 0,
                    zIndex: rowHeaderZIndex + 1,
                  }
                  : {}),
              },
              ...toSxArray(getHeaderCellSx?.(col)),
            ]}
          >
            {typeof col.renderHeader === 'function' ? (
              col.renderHeader({
                colDef: col,
                field: col.field,
              } as Parameters<NonNullable<GridColDef<T>['renderHeader']>>[0])
            ) : headerLabelLineClamp !== undefined || tooltipWhenHeaderLabelTruncated ? (
              <MIDataTableHeaderLabel
                label={headerLabel}
                variant={headerLabelVariant}
                color={headerLabelColor}
                lineClamp={headerLabelLineClamp}
                textAlign={textAlign}
                tooltipWhenTruncated={tooltipWhenHeaderLabelTruncated}
              />
            ) : (
              <Typography variant={headerLabelVariant ?? 'body2SB14'} color={headerLabelColor ?? 'gray.70'} noWrap>
                {headerLabel}
              </Typography>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

export default MIDataTableHeader
