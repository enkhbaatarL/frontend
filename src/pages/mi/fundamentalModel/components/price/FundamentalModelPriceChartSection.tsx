import { Box, Stack, Typography, useTheme } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'

const FundamentalModelPriceChartSection = () => {
  const theme = useTheme()

  return (
    <Stack gap="8px">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="body2SB14" color="gray.90">
          Monthly Futures Simulation Chart
        </Typography>
        <MIBaseButton
          variant="outlined"
          aria-label="Download chart"
          sx={{
            height: '28px',
            minWidth: '0px',
            p: '4px',
            borderRadius: '4px',
          }}
        >
          <ChartDownloadIcon fill={theme.palette.contentIcon.Enabled} />
        </MIBaseButton>
      </Stack>

      <Box
        sx={{
          height: 630,
          bgcolor: 'gray.10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        차트 영역
      </Box>
    </Stack>
  )
}

export default FundamentalModelPriceChartSection
