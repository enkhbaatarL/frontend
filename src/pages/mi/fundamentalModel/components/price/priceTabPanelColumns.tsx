import { Typography } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import type { FundamentalModelAnnualPriceRow, FundamentalModelMonthlyPriceRow } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

const centerBoldCell = ({ value }: GridRenderCellParams) => (
  <Typography variant="body2SB14" color="gray.90" noWrap sx={{ width: '100%', textAlign: 'center' }}>
    {value}
  </Typography>
)

const centerCell = ({ value }: GridRenderCellParams) => (
  <Typography variant="body2R14" color="gray.90" noWrap sx={{ width: '100%', textAlign: 'center' }}>
    {value}
  </Typography>
)

const rightCell = ({ value }: GridRenderCellParams) => (
  <Typography variant="body2R14" color="gray.90" noWrap sx={{ width: '100%', textAlign: 'right' }}>
    {value}
  </Typography>
)

const priceColumnDefaults = { sortable: false as const }

export const ANNUAL_PRICE_TABLE_COLUMNS: GridColDef<FundamentalModelAnnualPriceRow>[] = [
  {
    ...priceColumnDefaults,
    field: 'year',
    headerName: 'Year',
    width: 80,
    align: 'center',
    renderCell: centerBoldCell,
  },
  {
    ...priceColumnDefaults,
    field: 'priceRegion',
    headerName: 'Price region',
    width: 120,
    align: 'center',
    renderCell: centerCell,
  },
  {
    ...priceColumnDefaults,
    field: 'baseCasePrice',
    headerName: 'Base case price',
    flex: 1,
    minWidth: 80,
    align: 'right',
    renderCell: rightCell,
  },
  {
    ...priceColumnDefaults,
    field: 'userAdjustedPrice',
    headerName: 'User adjusted',
    flex: 1,
    minWidth: 80,
    align: 'right',
    renderCell: rightCell,
  },
]

export const MONTHLY_PRICE_TABLE_COLUMNS: GridColDef<FundamentalModelMonthlyPriceRow>[] = [
  {
    ...priceColumnDefaults,
    field: 'year',
    headerName: 'Year',
    width: 80,
    align: 'center',
    renderCell: centerBoldCell,
  },
  {
    ...priceColumnDefaults,
    field: 'month',
    headerName: 'Month',
    width: 80,
    align: 'center',
    renderCell: centerBoldCell,
  },
  {
    ...priceColumnDefaults,
    field: 'priceRegion',
    headerName: 'Price region',
    width: 120,
    align: 'center',
    renderCell: centerCell,
  },
  {
    ...priceColumnDefaults,
    field: 'baseCasePrice',
    headerName: 'Base case price',
    flex: 1,
    minWidth: 80,
    align: 'right',
    renderCell: rightCell,
  },
  {
    ...priceColumnDefaults,
    field: 'userAdjustedPrice',
    headerName: 'User adjusted',
    flex: 1,
    minWidth: 80,
    align: 'right',
    renderCell: rightCell,
  },
]

export const MONTHLY_PRICE_HIGHLIGHTED_FIELDS = new Set(['baseCasePrice', 'userAdjustedPrice'])
