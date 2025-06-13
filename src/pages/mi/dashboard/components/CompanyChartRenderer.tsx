import { Box } from '@mui/material'
import { useMemo } from 'react'

import EnergyForecastChart from './company-charts/EnergyForecastChart'

import DefaultForecastChart from '@/pages/mi/dashboard/components/company-charts/DefaultForecastChart'
import EnSForecastChart from '@/pages/mi/dashboard/components/company-charts/EnSForecastChart'
import HynixForecastChart from '@/pages/mi/dashboard/components/company-charts/HynixForecastChart'
import { SelectedReportChartContent } from '@/pages/mi/dashboard/components/ReportComponent'
import { IDashboardChartData } from '@/service/mi/dashboardData'

// 회사별 차트 컴포넌트 매핑
const CompanyChartComponents = {
  2015: HynixForecastChart, // Hynix
  2013: EnSForecastChart, // E&S
  2020: EnergyForecastChart, // 에너지
  // 필요에 따라  추가
} as const

type CompanyNo = keyof typeof CompanyChartComponents

// 회사별 차트 렌더러 컴포넌트
interface CompanyChartRendererProps {
  companyNo: number | undefined
  months: string[]
  data: IDashboardChartData
  selectedContent: SelectedReportChartContent | null
  onSelectedContent: (content: SelectedReportChartContent | null) => void
}

const CompanyChartRenderer = ({ companyNo, months, selectedContent, onSelectedContent, data }: CompanyChartRendererProps) => {
  const ChartComponent = useMemo(() => {
    if (!companyNo) return DefaultForecastChart

    const companyChart = CompanyChartComponents[companyNo as CompanyNo]
    return companyChart || DefaultForecastChart
  }, [companyNo])

  return (
    <Box pb="24px">
      <ChartComponent
        key={data?.charts[0]?.actualChartLines?.rawData?.[0]?.resultDate}
        months={months}
        selectedContent={selectedContent}
        onSelectedContent={onSelectedContent}
        data={data}
      />
    </Box>
  )
}

export default CompanyChartRenderer
