import { Box, Grid2 as Grid, Typography } from '@mui/material'
import Marquee from 'react-fast-marquee'
import { useNavigate } from 'react-router-dom'

import MILine from '@/components/common/divider/MILine'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'

interface Props {
  data: {
    product: string
    country: string
    name: string
    value: number
    change: number
    date: string
    changeUnit: string
    unit: string
    isPermitted: boolean
  }[]
}

const DailyChart = ({ data }: Props) => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        overflowX: 'hidden',
        bgcolor: '#fff',
        borderBottom: '1px solid #DEE2E6',
      }}
    >
      <Marquee pauseOnHover={true} gradient={false} speed={20} style={{ height: '76px', backgroundColor: '#fff' }} autoFill>
        {[...data].map((item, idx) => {
          const dataItem = {
            ...item,
            value: item.isPermitted ? item.value : 0.0,
            change: item.isPermitted ? item.change : 0.0,
            date: item.isPermitted ? item.date : '9999-99-99',
            changeUnit: item.isPermitted ? item.changeUnit : 'N/A',
            unit: item.isPermitted ? item.unit : 'N/A',
          }

          return (
            <Box
              key={idx}
              flexShrink={0}
              bgcolor={'#fff'}
              mx={'35px'}
              p={3}
              onClick={item.isPermitted ? () => navigate('/mi/data-detail/70008/12956') : undefined} // TODO: 임시 연결 제거
              sx={{
                cursor: item.isPermitted ? 'pointer' : 'auto',
                userSelect: 'none',
              }}
            >
              <Typography
                fontWeight={600}
                color="gray.70"
                component="div"
                fontSize={'14px'}
                lineHeight={1}
                mb={1}
                sx={{ WebkitLineClamp: 1 }}
                variant="fileName"
              >
                {dataItem.name}
              </Typography>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ filter: !dataItem.isPermitted ? 'blur(3px)' : 'none' }}>
                  <Grid mb={1} container wrap="nowrap" alignItems="center" gap={'4px'}>
                    <Typography lineHeight={1.4} color="gray.90" variant="body2">
                      {dataItem.value}
                    </Typography>
                    <Typography
                      lineHeight={1.4}
                      color={!dataItem.isPermitted ? 'gray.90' : dataItem.change > 0 ? '#498B47' : '#CC4D50'}
                      variant="body2"
                    >
                      {`${dataItem.change > 0 ? '+' : ''}${dataItem.change} (${dataItem.change > 0 ? '+' : ''}${dataItem.change}%)`}
                    </Typography>
                  </Grid>
                  <Grid container wrap="nowrap" alignItems="center" gap={'5px'}>
                    <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
                      {dataItem.date}
                    </Typography>
                    <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
                    <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
                      {dataItem.changeUnit}
                    </Typography>
                    <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
                    <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
                      {dataItem.unit}
                    </Typography>
                  </Grid>
                </Box>
                {!dataItem.isPermitted && (
                  <Box
                    display={'flex'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    position={'absolute'}
                    sx={{ inset: '-4px -8px', backgroundColor: 'rgba(255, 255, 255, 0.4)', color: '#868E96' }}
                  >
                    <LockOutlinedIcon width={24} height={24} />
                  </Box>
                )}
              </Box>
            </Box>
          )
        })}
      </Marquee>
    </Box>
  )
}

export default DailyChart
