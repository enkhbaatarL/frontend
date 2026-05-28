import { Box, type SxProps, type Theme } from '@mui/material'
import { type GridColDef, type GridRowModel } from '@mui/x-data-grid'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'

export const PRICE_TABLE_MAX_HEIGHT = 864
const PRICE_TABLE_HEADER_HEIGHT = 52
const PRICE_TABLE_BODY_MAX_HEIGHT = PRICE_TABLE_MAX_HEIGHT - PRICE_TABLE_HEADER_HEIGHT
const PRICE_TABLE_ROW_HEIGHT = 40

export interface FundamentalModelPriceTableProps<T extends GridRowModel> {
  columns: GridColDef<T>[]
  rows: T[]
  loading?: boolean
  rowId?: keyof T
  getRowKey?: (row: T, index: number) => string | number
  getCellSx?: (params: { field: string; row?: T }) => SxProps<Theme> | undefined
}

const wrapFullHeightCellSx =
  <T extends GridRowModel>(getCellSx?: FundamentalModelPriceTableProps<T>['getCellSx']) =>
    (params: { field: string; row?: T }): SxProps<Theme> => {
      const customSx = getCellSx?.(params)
      if (!customSx) return {}
      return {
        alignSelf: 'stretch',
        height: '100%',
        ...customSx,
      }
    }

const FundamentalModelPriceTable = <T extends GridRowModel>({
  columns,
  rows,
  loading = false,
  rowId = 'id' as keyof T,
  getRowKey,
  getCellSx,
}: FundamentalModelPriceTableProps<T>) => (
    <Box
      sx={{
        width: '100%',
        maxHeight: PRICE_TABLE_MAX_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      <MIDataTableHeader<T>
        columns={columns}
        headerCellPx="12px"
        headerCellPy="8px"
        headerLabelColor="gray.60"
        sx={{
          bgcolor: 'gray.5',
          borderBottom: '1px solid',
          borderColor: 'gray.40',
          minHeight: PRICE_TABLE_HEADER_HEIGHT,
          height: PRICE_TABLE_HEADER_HEIGHT,
          flexShrink: 0,
        }}
      />
      <ScrollWrapper
        height={PRICE_TABLE_BODY_MAX_HEIGHT}
        maxHeight={PRICE_TABLE_BODY_MAX_HEIGHT}
        contentKey={loading ? 'loading' : rows.length}
        scrollbarGap={0}
        thumbInsetTop={6}
        thumbInsetBottom={6}
        thumbWidth={4}
        showScrollbarOnHover
        showScrollEdgeShadow
        sx={{
          flex: '0 0 auto',
          width: '100%',
        }}
        styScroll={{ borderRadius: '1000px' }}
      >
        <MIDataTableBody<T>
          rowId={rowId}
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={getRowKey}
          rowHeight={PRICE_TABLE_ROW_HEIGHT}
          disableHover
          topPaddingPx={0}
          getCellSx={getCellSx ? wrapFullHeightCellSx(getCellSx) : undefined}
          rowSx={{ alignItems: 'stretch' }}
        />
      </ScrollWrapper>
    </Box>
  )

export default FundamentalModelPriceTable
