import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import Marquee from 'react-fast-marquee'

interface Props {
  data: {
    product: string
    country: string
    name: string
    change: number
  }[]
}

const DailyChart = ({ data }: Props) => (
  <Box
    sx={{
      overflowX: 'hidden',
      bgcolor: '#fff',
      borderBottom: '1px solid #DEE2E6',
    }}
  >
    <Marquee pauseOnHover={true} gradient={false} speed={20} style={{ height: '50px', backgroundColor: '#fff' }} autoFill>
      {[...data].map((item, idx) => (
        <Box
          bgcolor={'#fff'}
          flexShrink={0}
          display={'flex'}
          alignItems={'normal'}
          flexDirection={'column'}
          justifyContent={'center'}
          key={idx}
          width="200px"
          mx={2.5}
        >
          <Typography color={'gray.70'} component={'div'} variant="body3SB12">
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
    </Marquee>
  </Box>
)

export default DailyChart
