import { Box } from '@mui/material'
import { useMemo } from 'react'

import DefaultForecastChart from '@/pages/mi/dashboard/components/company-charts/DefaultForecastChart.tsx'
import HynixForecastChart from '@/pages/mi/dashboard/components/company-charts/HynixForecastChart.tsx'
import InnovationForecastChart from '@/pages/mi/dashboard/components/company-charts/InnovationForecastChart'
import { IDashboardChartData } from '@/service/mi/dashboardData'

// 회사별 차트 컴포넌트 매핑
const CompanyChartComponents = {
  2015: HynixForecastChart, // Hynix
  2013: InnovationForecastChart, // Innovation
  // 필요에 따라  추가
} as const

type CompanyNo = keyof typeof CompanyChartComponents

// 회사별 차트 렌더러 컴포넌트
interface CompanyChartRendererProps {
  companyNo: number | undefined
  months: string[]
  data: IDashboardChartData
  onViewDetail: (
    content: { label?: string; value?: number; category?: string; color?: string; date?: string },
    label: string,
    goodsDataSourceNo?: number,
  ) => void
  showDetailChart?: boolean
  setShowDetailChart: (showDetailChart: boolean) => void
}

export const CompanyChartRenderer = ({
  companyNo,
  months,
  onViewDetail,
  data,
  showDetailChart,
  setShowDetailChart,
}: CompanyChartRendererProps) => {
  const ChartComponent = useMemo(() => {
    if (!companyNo) return DefaultForecastChart

    const companyChart = CompanyChartComponents[companyNo as CompanyNo]
    return companyChart || DefaultForecastChart
  }, [companyNo])

  return (
    <Box mb="42px" pb="30px">
      <ChartComponent
        months={months}
        onViewDetail={onViewDetail}
        data={data}
        showDrillDown={showDetailChart}
        setShowDrillDown={setShowDetailChart}
      />
    </Box>
  )
}

export default CompanyChartRenderer
