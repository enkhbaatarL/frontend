import { useMemo } from 'react'

import { miPages } from '@/lib/constants'
import useAuthStore from '@/store/useAuthStore'
import { MiPagesType } from '@/types/common'

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

interface CustomizeMapperDetail {
  // 라우팅에서 제외할 페이지
  extractPage?: MiPagesType[]
  // 대시보드 테이블 관련 데이터
  dashboardTable?: {
    rows: string[]
    unitName: string
    errorRate?: boolean
  }
}

const companyMapper: Record<number, CustomizeMapperDetail> = {
  // 실트론
  2008: { dashboardTable: { rows: ['Server', 'Automobile', 'PC', 'Mobile'], unitName: 'Millions Units' } },
  // 이노베이션 E&S
  2013: {
    dashboardTable: {
      rows: ['Forecast', 'Actual', 'Futures M+1', 'Futures M+2', 'Futures M+3', 'Futures M+4'],
      unitName: 'USD/MMBtu',
      errorRate: true,
    },
  },
  // 가스
  2014: { extractPage: ['signal-map', 'dashboard'] },
  // 하이닉스
  2015: {
    dashboardTable: {
      rows: ['Forecast', 'Actual', 'Futures M+1', 'Futures M+2', 'Futures M+3', 'Futures M+4'],
      unitName: 'USD/Gb',
      errorRate: true,
    },
  },
  //텔레콤
  2016: {},
  // C&C
  2017: {},
  // 이노베이션
  2019: {},
  // 에너지
  2020: {
    dashboardTable: { rows: ['Forecast', 'Actual', 'Futures M+1', 'Futures M+2'], unitName: 'USD/bbl', errorRate: true },
  },
  //on
  2021: { dashboardTable: { rows: ['IONIQ 5', 'EV6', 'eGV70', 'ID.4'], unitName: 'Vehicles' } },
}

const errorRateTooltipContent = `오차율(%) = {(Forecast - Actual) / Actual} × 100
            • 오차율은 양수 : 예측이 더 높았음 (과대 예측)
            • 오차율은 음수 : 예측이 더 낮았음 (과소 예측)
            • 오차율 0% : 완벽 예측`

const monthHeaders = ['24-08', '24-09', '24-10', '24-11', '24-12', '25-01', '25-02', '25-03', '25-04', '25-05', '25-06', '25-07']

export const useCompanyCondition = () => {
  const { accessCompanyInfo, user } = useAuthStore()
  const currentCompanyInfo: CustomizeMapperDetail | undefined = useMemo(() => {
    const comNo = accessCompanyInfo?.customerCompanyNo ?? user?.companyNo ?? -1
    return companyMapper[comNo]
  }, [accessCompanyInfo?.customerCompanyNo, user?.companyNo])

  const extractPage = useMemo(() => {
    if (!currentCompanyInfo) return undefined
    return currentCompanyInfo.extractPage ?? []
  }, [currentCompanyInfo])

  /**
   * 홈 주소
   */
  const miHome = () => {
    if (!extractPage) return undefined
    return miPages.find((page) => !extractPage.includes(page))
  }

  const rawData = useMemo<RawDataItem[]>(() => {
    if (!currentCompanyInfo) return []
    const rows = currentCompanyInfo.dashboardTable?.rows ?? []
    const baseData: RawDataItem[] = rows.map((row) => ({
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
    return [...baseData, ...(currentCompanyInfo.dashboardTable?.errorRate ? errorRateData : [])]
  }, [currentCompanyInfo])

  const dashboardRows = useMemo<DataRow[]>(
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
    [rawData],
  )

  const dashboardColumns = useMemo(() => {
    if (!currentCompanyInfo) return []
    const baseColumn = {
      field: 'model',
      headerName: currentCompanyInfo.dashboardTable?.unitName ?? '',
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
  }, [currentCompanyInfo])

  return { extractPage, dashboardColumns, dashboardRows, miHome }
}
