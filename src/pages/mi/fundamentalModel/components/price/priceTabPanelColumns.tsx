import { Typography } from '@mui/material'
import { type GridColDef, type GridRenderCellParams, type GridRowModel } from '@mui/x-data-grid'

import type { FundamentalModelPriceColumn, FundamentalModelPriceTable } from '@/service/mi/fundamentalModel/case'

const PRICE_VALUE_FIELD_NAMES = new Set(['baseCasePrice', 'userAdjustedPrice'])

const centerBoldCell = ({ value }: GridRenderCellParams<GridRowModel>) => (
  <Typography variant="body2SB14" color="gray.90" noWrap sx={{ width: '100%', textAlign: 'center' }}>
    {value === null || value === undefined || value === '' ? '-' : String(value)}
  </Typography>
)

const textCell = ({ value }: GridRenderCellParams<GridRowModel>) => (
  <Typography variant="body2R14" color="gray.90" noWrap sx={{ width: '100%', minWidth: 0 }}>
    {value === null || value === undefined || value === '' ? '-' : String(value)}
  </Typography>
)

const formatPriceValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return String(value)
}

const priceValueCell = ({ value }: GridRenderCellParams<GridRowModel>) => (
  <Typography variant="body2R14" color="gray.90" noWrap sx={{ width: '100%', textAlign: 'right' }}>
    {formatPriceValue(value)}
  </Typography>
)

const priceColumnDefaults = { sortable: false as const }

export const buildPricePeriodTableRows = (table: FundamentalModelPriceTable | undefined, includeMonth: boolean): GridRowModel[] => {
  const rows = table?.rows ?? []
  return rows.map((row, index) => ({
    id: `${row.priceRegion}-${row.year}-${includeMonth ? row.month : 'annual'}-${index}`,
    ...row,
  }))
}

const buildFallbackColumns = (includeMonth: boolean): FundamentalModelPriceColumn[] => [
  { key: 'year', label: 'Year' },
  ...(includeMonth ? [{ key: 'month', label: 'Month' }] : []),
  { key: 'priceRegion', label: 'Price Region' },
  { key: 'baseCasePrice', label: 'Base Case Price' },
  { key: 'userAdjustedPrice', label: 'User Adjusted Price' },
]

const buildPriceColumn = (column: FundamentalModelPriceColumn): GridColDef<GridRowModel> => {
  const field = column.key
  const headerName = column.label

  if (field === 'year' || field === 'month') {
    return {
      ...priceColumnDefaults,
      field,
      headerName,
      width: 80,
      align: 'center',
      renderCell: centerBoldCell,
    }
  }

  if (field === 'priceRegion') {
    return {
      ...priceColumnDefaults,
      field,
      headerName,
      flex: 1.1,
      minWidth: 140,
      align: 'left',
      renderCell: textCell,
    }
  }

  if (PRICE_VALUE_FIELD_NAMES.has(field)) {
    return {
      ...priceColumnDefaults,
      field,
      headerName,
      flex: 1,
      minWidth: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: priceValueCell,
    }
  }

  return {
    ...priceColumnDefaults,
    field,
    headerName,
    flex: 1,
    minWidth: 100,
    renderCell: textCell,
  }
}

export const buildPricePeriodTableColumns = (
  table: FundamentalModelPriceTable | undefined,
  includeMonth: boolean,
): GridColDef<GridRowModel>[] => {
  const columns = table?.columns?.length ? table.columns : buildFallbackColumns(includeMonth)
  return columns.map(buildPriceColumn)
}

export const isPriceValueField = (field: string): boolean => PRICE_VALUE_FIELD_NAMES.has(field)
