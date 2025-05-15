import { Box, Typography } from '@mui/material'
import { ChartDataset } from 'chart.js/auto'

import { DATA_CATEGORIES } from './constants'
import ActualLegendIcon from './icons/ActualLegendIcon'
import ForecastLegendIcon from './icons/ForecastLegendIcon'

interface MIForecastLegendProps {
  datasets: Array<ChartDataset & { category: string }>
  onToggleDataset: (index: number) => void
}

export default function MIForecastLegend({ datasets, onToggleDataset }: MIForecastLegendProps) {
  return (
    <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} px="24px" py="10px">
      <Box display={'flex'} alignItems={'center'} gap="10px">
        {datasets.map((dataset, index) => {
          // Skip forecast datasets
          if (dataset.category === DATA_CATEGORIES.FORECAST) return null

          return (
            <Box
              key={index}
              display={'flex'}
              alignItems={'center'}
              p="4px"
              gap="2px"
              onClick={() => index !== 0 && onToggleDataset(index)}
              sx={{ opacity: dataset.hidden ? 0.3 : 1, cursor: 'pointer' }}
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
            </Box>
          )
        })}
      </Box>

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
    </Box>
  )
}
