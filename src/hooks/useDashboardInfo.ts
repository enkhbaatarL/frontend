import { useMemo } from 'react'

import useAuthStore from '@/store/useAuthStore'

export type DataRow = {
  id: string
  model: string
  [key: string]: string | number | null
}

type RawDataItem = {
  model: string
  data: (number | null)[]
  id?: string
  tooltipContent?: string
}

interface DashboardMapperDetail {
  hide?: boolean
  tableRows: string[]
  tableUnitName: string
  errorRate?: boolean
}

const dashboardMapper: Record<number, DashboardMapperDetail> = {
  // 실트론
  2008: { tableRows: ['Server', 'Automobile', 'PC', 'Mobile'], tableUnitName: 'Millions Units' },
  // 이노베이션 E&S
  2013: {
    tableRows: ['Forecast', 'Actual', 'Futures M+1', 'Futures M+2', 'Futures M+3', 'Futures M+4'],
    tableUnitName: 'USD/MMBtu',
    errorRate: true,
  },
  // 가스
  2014: { tableRows: [], tableUnitName: '', hide: true },
  // 하이닉스
  2015: {
    tableRows: ['Forecast', 'Actual', 'Futures M+1', 'Futures M+2', 'Futures M+3', 'Futures M+4'],
    tableUnitName: 'USD/Gb',
    errorRate: true,
  },
  //텔레콤
  2016: { tableRows: [], tableUnitName: '' },
  // C&C
  2017: { tableRows: [], tableUnitName: '' },
  // 이노베이션
  2019: { tableRows: [], tableUnitName: '' },
  // 에너지
  2020: { tableRows: ['Forecast', 'Actual', 'Futures M+1', 'Futures M+2'], tableUnitName: 'USD/bbl', errorRate: true },
  //on
  2021: { tableRows: ['IONIQ 5', 'EV6', 'eGV70', 'ID.4'], tableUnitName: 'Vehicles' },
}

const errorRateTooltipContent = `오차율(%) = {(Forecast - Actual) / Actual} × 100
            • 오차율은 양수 : 예측이 더 높았음 (과대 예측)
            • 오차율은 음수 : 예측이 더 낮았음 (과소 예측)
            • 오차율 0% : 완벽 예측`

export const useDashboardInfo = () => {
  const monthHeaders = useMemo(
    () => ['24-08', '24-09', '24-10', '24-11', '24-12', '25-01', '25-02', '25-03', '25-04', '25-05', '25-06', '25-07'],
    [],
  )
  const accessCompanyInfo = useAuthStore((state) => state.accessCompanyInfo)

  const currentTable = useMemo(() => dashboardMapper[accessCompanyInfo?.customerCompanyNo ?? -1], [accessCompanyInfo?.customerCompanyNo])

  const shouldHideDashboard = useMemo(() => currentTable?.hide, [currentTable])

  const rawData = useMemo<RawDataItem[]>(() => {
    if (!currentTable) return []
    const baseData: RawDataItem[] = currentTable.tableRows.map((row) => ({
      model: row,
      data: [20, 20, 20, 20, 20, 10, 20, 20, 20, 20, 20, 20], //TODO
    }))
    const errorRateData: RawDataItem[] = [
      {
        model: '오차율 (%)',
        id: 'errorRate',
        data: [-0.04, 0.07, -0.04, 0.07, -0.04, 0.07, 0.07, 0.07, -0.04, 0.07, null, null], //TODO
        tooltipContent: errorRateTooltipContent,
      },
    ]
    return [...baseData, ...(currentTable.errorRate ? errorRateData : [])]
  }, [currentTable])

  const rows = useMemo<DataRow[]>(
    () =>
      rawData.map((item) => {
        const row: Record<string, string | number | null | undefined> = {
          id: item.id ?? item.model,
          model: item.model,
          tooltipContent: item.tooltipContent,
        }

        monthHeaders.forEach((month, idx) => {
          row[month] = item.data[idx] ?? '-'
        })

        return row as DataRow
      }),
    [rawData, monthHeaders],
  )

  const columns = useMemo(() => {
    if (!currentTable) return []
    const baseColumn = {
      field: 'model',
      headerName: currentTable.tableUnitName ?? '',
      width: 100,
      type: 'string',
      align: 'center',
    }
    const monthColumns = monthHeaders.map((month) => ({
      field: month,
      headerName: month,
      flex: 1,
      align: 'center' as const,
      type: 'number',
    }))

    return [baseColumn, ...monthColumns]
  }, [currentTable, monthHeaders])
  return { shouldHideDashboard, columns, rows }
}
