import { Typography } from '@mui/material'
import { useMemo } from 'react'

import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import MITableCell from '@/components/common/table/MITableCell'

type DataRow = {
  id: string
  model: string
  [key: string]: string | number | null
}

type RawDataItem = {
  model: string
  data: (number | null)[]
}

export const useMockDataReport = () => {
  const monthHeaders = useMemo(
    () => ['24-08', '24-09', '24-10', '24-11', '24-12', '25-01', '25-02', '25-03', '25-04', '25-05', '25-06', '25-07'],
    [],
  )

  const rawData = useMemo<RawDataItem[]>(
    () => [
      { model: 'Forecast', data: [20, 20, 20, 20, 20, 10, 20, 20, 20, 20, 20, 20] },
      { model: 'Actual', data: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, null, null] },
      { model: 'M1', data: [20, 20, 20, 20, 20, 10, 20, 20, 20, 20, null, null] },
      { model: 'M2', data: [10, 10, 10, 10, 10, 10, 10, 10, 20, 20, null, null] },
      { model: 'M3', data: [10, 10, 10, 10, 10, 10, 10, 10, 20, 20, null, null] },
      { model: '오차율 (%)', data: [-0.04, 0.07, -0.04, 0.07, -0.04, 0.07, 0.07, 0.07, -0.04, 0.07, null, null] },
    ],
    [],
  )

  const rows = useMemo<DataRow[]>(() => rawData.map((item) => {
    const row: Record<string, string | number | null> = {
      id: item.model,
      model: item.model,
    }

    monthHeaders.forEach((month, idx) => {
      row[month] = item.data[idx] ?? '-'
    })

    return row as DataRow
  }), [rawData, monthHeaders])

  const columns = useMemo<GridColDef[]>(() => {
    const baseColumn: GridColDef[] = [
      {
        field: 'model',
        headerName: '',
        width: 100,
        type: 'string',
        align: 'center',
        renderCell: (param: GridRenderCellParams<DataRow, string>) => {
          const value = param.value as unknown as string
          const tooltipContent = (
            <Typography variant={'subtext'} sx={{ whiteSpace: 'pre-line' }}>
              오차율(%) = {'{'}(Forecast - Actual) / Actual{'}'} × 100
              {'\n'}• 오차율은 양수 : 예측이 더 높았음 (과대 예측)
              {'\n'}• 오차율은 음수 : 예측이 더 낮았음 (과소 예측)
              {'\n'}• 오차율 0% : 완벽 예측
            </Typography>
          )

          return (
            <MITableCell
              tooltip={param.value === '오차율 (%)'}
              tooltipContent={tooltipContent}
              typography={{ variant: 'tableBody1' }}
              value={value}
            />
          )
        },
      },
    ]

    const monthColumns: GridColDef[] = monthHeaders.map((month) => ({
      field: month,
      headerName: month,
      flex: 1,
      align: 'center' as const,
      type: 'number',
      renderCell: (param: GridRenderCellParams<DataRow, string>) => {
        const value = param.value as string | number | null
        const isErrorRate = param.row.model.includes('오차율')
        const fontWeight = isErrorRate && typeof value === 'number' ? '600' : '400'
        const isNumber = typeof value === 'number'
        const isPositive = isNumber && value > 0

        const displayValue = isErrorRate && isNumber ? `${isPositive ? '+' : ''}${value.toFixed(2)}` : value
        const color = isErrorRate && typeof value === 'number' ? (value > 0 ? '#498B47' : '#CC4D50') : '#212529'

        return <span style={{ color, fontWeight }}>{displayValue}</span>
      },
    }))

    return [...baseColumn, ...monthColumns]
  }, [monthHeaders])

  return { rows, columns }
}
