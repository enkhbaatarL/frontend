import { Box } from '@mui/material'
import { useMemo } from 'react'

import DefaultForecastChart from '@/pages/mi/dashboard/components/company-charts/DefaultForecastChart.tsx'
import HynixForecastChart from '@/pages/mi/dashboard/components/company-charts/HynixForecastChart.tsx'

// 회사별 차트 컴포넌트 매핑
const CompanyChartComponents = {
  2015: HynixForecastChart, // Hynix
  // 필요에 따라  추가
} as const

type CompanyNo = keyof typeof CompanyChartComponents

// 회사별 차트 렌더러 컴포넌트
interface CompanyChartRendererProps {
  companyNo: number | undefined
  months: string[]
  onViewDetail: (content: { label?: string; value?: number; category?: string; color?: string }, label: string) => void
}

export const CompanyChartRenderer = ({ companyNo, months, onViewDetail }: CompanyChartRendererProps) => {
  const ChartComponent = useMemo(() => {
    if (!companyNo) return DefaultForecastChart

    const companyChart = CompanyChartComponents[companyNo as CompanyNo]
    return companyChart || DefaultForecastChart
  }, [companyNo])

  return (
    <Box mb="42px" pb="30px">
      <ChartComponent months={months} onViewDetail={onViewDetail} />
    </Box>
  )
}

export default CompanyChartRenderer
