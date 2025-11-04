import { Box } from '@mui/material'
import { useMemo } from 'react'

import DefaultForecastChart from '@/pages/mi/forecast/components/company-charts/DefaultForecastChart'
import EnergyForecastChart from '@/pages/mi/forecast/components/company-charts/EnergyForecastChart'
import EnSForecastChart from '@/pages/mi/forecast/components/company-charts/EnSForecastChart'
import ExchangeRateForecastChart from '@/pages/mi/forecast/components/company-charts/ExchangeRateForecastChart'
import GasForecastChart from '@/pages/mi/forecast/components/company-charts/GasForecastChart'
import HynixForecastChart from '@/pages/mi/forecast/components/company-charts/HynixForecastChart'
import OnForecastChart from '@/pages/mi/forecast/components/company-charts/OnForecastChart'
import SiltronForecastChart from '@/pages/mi/forecast/components/company-charts/SiltronForecastChart'
import { SelectedReportChartContent } from '@/pages/mi/forecast/components/ReportComponent'
import { IForecastChartData } from '@/service/mi/forecast'

// 회사별 차트 컴포넌트 매핑
const CompanyChartComponents = {
  2015: HynixForecastChart, // Hynix
  2013: EnSForecastChart, // E&S
  2020: EnergyForecastChart, // 에너지
  2014: GasForecastChart, // Gas
  2018: OnForecastChart, // ON
  2008: SiltronForecastChart, // Siltron
  /* --------------------------- */
  2025: ExchangeRateForecastChart, // 한진
} as const

type CompanyNo = keyof typeof CompanyChartComponents

// 회사별 차트 렌더러 컴포넌트
interface CompanyChartRendererProps {
  companyNo: number | undefined
  months: string[]
  data: IForecastChartData
  selectedContent: SelectedReportChartContent | null
  onSelectedContent: (content: SelectedReportChartContent | null) => void
  userRoleCd: string
  hideForecast?: boolean
}

const CompanyChartRenderer = ({
  companyNo,
  months,
  selectedContent,
  onSelectedContent,
  data,
  userRoleCd,
  hideForecast,
}: CompanyChartRendererProps) => {
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
        userRoleCd={userRoleCd}
        hideForecast={hideForecast}
      />
    </Box>
  )
}

export default CompanyChartRenderer
