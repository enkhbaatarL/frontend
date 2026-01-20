import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import aiIcon from '@/assets/ai.svg'
import ForecastChart from '@/pages/mi/forecast/new-components/ForecastChart'
import ForecastReportCard from '@/pages/mi/forecast/new-components/ForecastReportCard'
import { IForecastChartData } from '@/service/mi/forecast'

const sampleData = [
  {
    label: 'DUBAI CRUDE',
    goodsDataSourceNo: 4158,
    startDate: '20250708',
    endDate: '20250709',
    isNew: true,
  },
  {
    label: 'DUBAI CRUDE',
    goodsDataSourceNo: 4158,
    startDate: '20251101',
    endDate: '20251130',
    isNew: true,
  },
  {
    label: 'BRENT CRUDE',
    goodsDataSourceNo: 5850,
    startDate: '20251201',
    endDate: '20251231',
    isNew: false,
  },
]

interface ChartPageProps {
  chartData?: IForecastChartData
  chartDataIsLoading?: boolean
}

const ChartPage = ({ chartData, chartDataIsLoading }: ChartPageProps) => {
  const [hoverReportCardInfo, setHoverReportCardInfo] = useState<{ goodsDataSourceNo: number; startDate: string; endDate: string } | null>(
    null,
  )
  const [isFixedMode, setIsFixedMode] = useState(false)

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
          {sampleData.map((item) => (
            <Box
              key={`${item.label}-${item.startDate}-${item.endDate}`}
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
      />
    </Stack>
  )
}

export default ChartPage
