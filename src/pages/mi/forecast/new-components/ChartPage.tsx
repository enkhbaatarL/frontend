import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import aiIcon from '@/assets/ai.svg'
import ForecastChart from '@/pages/mi/forecast/new-components/ForecastChart'
import ForecastReportCard from '@/pages/mi/forecast/new-components/ForecastReportCard'
import forecastDataService, { IForecastChartData, IForecastSummary } from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'

interface ChartPageProps {
  chartData?: IForecastChartData
  chartDataIsLoading?: boolean
  monthSelect?: string
}

const ChartPage = ({ chartData, chartDataIsLoading, monthSelect }: ChartPageProps) => {
  const [hoverReportCardInfo, setHoverReportCardInfo] = useState<IForecastSummary | null>(null)
  const [isFixedMode, setIsFixedMode] = useState(false)
  const [goodsDataSourceNo] = useState<number | undefined>(undefined)

  const { accessCompanyInfo, user } = useAuthStore()
  const companyNo = accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0

  // getForecastSummaries
  const { data: forecastSummaries } = useQuery({
    queryKey: ['getForecastSummaries', goodsDataSourceNo],
    queryFn: () => forecastDataService.getForecastSummaries(companyNo, goodsDataSourceNo),
    enabled: !!monthSelect,
  })

  return (
    <Stack py="20px" gap="20px" boxSizing="border-box" width="100%">
      <Stack p="12px 24px" gap="12px">
        <Stack direction="row" alignItems="center" gap="4px">
          <Box component="img" src={aiIcon} alt="AI" draggable={false} />
          <Typography variant="infoDocument" color="commonColor.Black">
            AI FORECAST REPORT
          </Typography>
        </Stack>
        <Stack direction="row" gap="20px">
          {forecastSummaries?.map((item, index) => (
            <Box
              key={index}
              onMouseEnter={() => !isFixedMode && setHoverReportCardInfo(item)}
              onMouseLeave={() => !isFixedMode && setHoverReportCardInfo(null)}
              sx={{
                opacity: isFixedMode ? 0.6 : 1,
              }}
            >
              <ForecastReportCard data={item} onPopupClose={() => setHoverReportCardInfo(null)} isFixedMode={isFixedMode} />
            </Box>
          ))}
        </Stack>
      </Stack>
      <ForecastChart
        hoverReportCardInfo={hoverReportCardInfo}
        chartData={chartData}
        chartDataIsLoading={chartDataIsLoading}
        onFixedModeChange={setIsFixedMode}
        monthSelect={monthSelect}
      />
    </Stack>
  )
}

export default ChartPage
