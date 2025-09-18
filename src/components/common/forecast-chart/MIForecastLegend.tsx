import { Box, Tooltip, Typography } from '@mui/material'
import { ChartDataset } from 'chart.js/auto'
import { useMemo } from 'react'

import { DATA_CATEGORIES } from './constants'
import ActualLegendIcon from './icons/ActualLegendIcon'
import ForecastLegendIcon from './icons/ForecastLegendIcon'
import LockOutlinedIcon from '../icons/LockOutlinedIcon'

import { SelectedReportChartContent } from '@/pages/mi/forecast/components/ReportComponent'
import theme from '@/theming'

interface MIForecastLegendProps {
  datasets: Array<ChartDataset & { category: string; hidden?: boolean; permission?: boolean; yAxisID: string }>
  onToggleDataset: (index: number) => void
  showActual?: boolean
  selectedContent?: SelectedReportChartContent | null
}

const MIForecastLegend = ({ datasets, onToggleDataset, showActual = true, selectedContent }: Readonly<MIForecastLegendProps>) => {
  const legends = useMemo(() => {
    const left: Array<ChartDataset & { category: string; hidden?: boolean; permission?: boolean; yAxisID: string; index: number }> = []
    const right: Array<ChartDataset & { category: string; hidden?: boolean; permission?: boolean; yAxisID: string; index: number }> = []

    datasets.forEach((dataset, index) => {
      if (dataset.category === 'forecast-line') {
        return
      }

      if (dataset.yAxisID === 'y') {
        left.push({
          index,
          ...dataset,
        })
      } else {
        right.push({
          index,
          ...dataset,
        })
      }
    })

    return {
      left,
      right,
    }
  }, [datasets])

  const isMultipleAxes = !!legends.left.length && !!legends.right.length

  return (
    <Box display={'flex'} alignItems={'center'} justifyContent={showActual ? 'space-between' : 'center'} px="24px" py="10px">
      <Box display={'flex'} alignItems={'center'} gap="10px">
        {isMultipleAxes && (
          <Typography variant="body2R14" color="gray.70">
            Left
          </Typography>
        )}

        {legends.left.map((dataset) => {
          // Skip forecast datasets
          if (dataset.category === DATA_CATEGORIES.FORECAST) return null

          let opacity = dataset.hidden ? 0.3 : 1

          if (selectedContent) {
            opacity = selectedContent.label === `${dataset.label} Forecast` ? 1 : 0.3
          }

          return !dataset.permission ? (
            <Tooltip key={`left-${dataset.index}`} title={'접근 권한이 없는 데이터입니다.'}>
              <Box
                display={'flex'}
                alignItems={'center'}
                p="4px"
                gap="2px"
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
            </Tooltip>
          ) : (
            <Box
              key={`left-${dataset.index}`}
              display={'flex'}
              alignItems={'center'}
              p="4px"
              gap="2px"
              onClick={() => onToggleDataset(dataset.index)}
              sx={{
                opacity,
                cursor: selectedContent || !dataset.permission ? 'default' : 'pointer',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'contentBG.PrimaryFade',
                },
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

        {isMultipleAxes && <Box height={'18px'} width={'2px'} sx={{ backgroundColor: theme.palette.gray[60] }} />}

        {isMultipleAxes && (
          <Typography variant="body2R14" color="gray.70">
            Right
          </Typography>
        )}

        {legends.right.map((dataset) => {
          if (dataset.category === DATA_CATEGORIES.FORECAST) return null

          let opacity = dataset.hidden ? 0.3 : 1

          if (selectedContent) {
            opacity = selectedContent.label === `${dataset.label} Forecast` ? 1 : 0.3
          }

          return !dataset.permission ? (
            <Tooltip key={`right-${dataset.index}`} title={'접근 권한이 없는 데이터입니다.'}>
              <Box
                display={'flex'}
                alignItems={'center'}
                p="4px"
                gap="2px"
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
            </Tooltip>
          ) : (
            <Box
              key={`right-${dataset.index}`}
              display={'flex'}
              alignItems={'center'}
              p="4px"
              gap="2px"
              onClick={() => onToggleDataset(dataset.index)}
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
}

export default MIForecastLegend
