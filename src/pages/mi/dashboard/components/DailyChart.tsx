import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useRef } from 'react'

import { useMockDataDaily } from '@/hooks/useMockDataDaily'

const DailyChart = () => {
  const data = useMockDataDaily()
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <Box
      sx={{
        overflowX: 'hidden',
        bgcolor: '#fff',
      }}
    >
      <Grid
        flexWrap={'nowrap'}
        gap={5}
        bgcolor={'#fff'}
        container
        ref={containerRef}
        sx={{
          display: 'flex',
          bgcolor: '#fff',
          animation: 'marquee 35s linear infinite',
          willChange: 'transform',
          '@keyframes marquee': {
            '0%': {
              transform: 'translateX(0%)',
            },
            '100%': {
              transform: 'translateX(-50%)',
            },
          },
          '&:hover': {
            animationPlayState: 'paused',
          },
        }}
      >
        {[...data, ...data, ...data].map((item, idx) => (
          <Box bgcolor={'#fff'} flexShrink={0} px={3} py={2} key={idx} width="200px">
            <Typography color={'gray.70'} mb={1} component={'div'} variant="body3SB12">
              {item.name}
            </Typography>
            <Grid container alignItems={'center'}>
              <Typography mr={1} component={'div'} variant="body2SB14" color={item.change >= 0 ? 'chart.green6' : 'chart.red4'}>
                {item.change >= 0 ? (
                  <TrendingUpIcon sx={{ display: 'block' }} fontSize={'small'} />
                ) : (
                  <TrendingDownIcon sx={{ display: 'block' }} fontSize={'small'} />
                )}
              </Typography>
              <Typography mr={2} variant="body2SB14" color={item.change >= 0 ? 'chart.green6' : 'chart.red4'}>
                {item.change >= 0 ? '+' : ''}
                {(item.change * 100).toFixed(2)}%
              </Typography>
              <Typography variant="body3R12" color="gray.60">
                WoW
              </Typography>
            </Grid>
          </Box>
        ))}
      </Grid>
    </Box>
  )
}

export default DailyChart
