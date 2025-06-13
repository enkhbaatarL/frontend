import { Box, Typography } from '@mui/material'
import { ChartDataset } from 'chart.js/auto'

import { DATA_CATEGORIES } from './constants'
import ActualLegendIcon from './icons/ActualLegendIcon'
import ForecastLegendIcon from './icons/ForecastLegendIcon'
import LockOutlinedIcon from '../icons/LockOutlinedIcon'

import { SelectedReportChartContent } from '@/pages/mi/dashboard/components/ReportComponent'

interface MIForecastLegendProps {
  datasets: Array<ChartDataset & { category: string; hidden?: boolean; permission?: boolean }>
  onToggleDataset: (index: number) => void
  showActual?: boolean
  selectedContent?: SelectedReportChartContent | null
}

const MIForecastLegend = ({ datasets, onToggleDataset, showActual = true, selectedContent }: Readonly<MIForecastLegendProps>) => (
  <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} px="24px" py="10px">
    <Box display={'flex'} alignItems={'center'} gap="10px">
      {datasets.map((dataset, index) => {
        // MEMO: 인덱스 유지용으로 필터링 하지 않음
        if (dataset.category === DATA_CATEGORIES.FORECAST) return null

        let opacity = dataset.hidden ? 0.3 : 1

        if (selectedContent) {
          opacity = selectedContent.label === `${dataset.label} Forecast` ? 1 : 0.3
        }

        return (
          <Box
            key={index}
            display={'flex'}
            alignItems={'center'}
            p="4px"
            gap="2px"
            onClick={() => onToggleDataset(index)}
            sx={{
              opacity,
              cursor: selectedContent || !dataset.permission ? 'default' : 'pointer',
            }}
          >
            <Box
              sx={{
                width: '12px',
                height: '12px',
                margin: '4px',
                borderRadius: '2px',
                backgroundColor: dataset.backgroundColor as string,
                borderColor: dataset.borderColor as string,
                borderWidth: 1,
              }}
            />
            <Typography variant="body2SB14" color="gray.70">
              {dataset.label}
            </Typography>
            {!dataset.permission && (
              <LockOutlinedIcon width={12} height={15} style={{ marginLeft: '3px', marginBottom: '1px' }} color="#868E96" />
            )}
          </Box>
        )
      })}
    </Box>
    {showActual && (
      <Box display={'flex'} alignItems={'center'} gap="10px">
        <Box display={'flex'} alignItems={'center'} p="4px" gap="2px">
          <ActualLegendIcon />
          <Typography variant="body2SB14" color="gray.70">
            Actual
          </Typography>
        </Box>
        <Box display={'flex'} alignItems={'center'} p="4px" gap="2px">
          <ForecastLegendIcon />
          <Typography variant="body2SB14" color="gray.70">
            Forecast
          </Typography>
        </Box>
      </Box>
    )}
  </Box>
)

export default MIForecastLegend
