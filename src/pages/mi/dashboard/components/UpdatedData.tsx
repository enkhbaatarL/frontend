import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Grid2 as Grid, Typography } from '@mui/material'

import MIButton from '@/components/common/button/MIButton.tsx'
import MILine from '@/components/common/divider/MILine.tsx'

interface ItemProps {
  name: string
  price: number
  change: number
  changePercent: number
  date: string
  unit: string
  direction: string
}

const dummyData = [
  {
    name: 'Heating Oil',
    price: 2.17,
    change: 0.0053,
    changePercent: 0.24,
    date: 'April 29, 2025',
    unit: 'USD',
    direction: 'up',
  },
  {
    name: 'S&P GSCI',
    price: 533.61,
    change: -5.28,
    changePercent: -0.98,
    date: 'April 29, 2025',
    unit: 'USD',
    direction: 'down',
  },
  {
    name: 'Baltic Dry Index (BDI)',
    price: 1200.0,
    change: 15.0,
    changePercent: 1.27,
    date: 'April 29, 2025',
    unit: 'USD',
    direction: 'up',
  },
  {
    name: 'RBOB Gasoline',
    price: 2.16,
    change: -0.0028,
    changePercent: -0.13,
    date: 'April 29, 2025',
    unit: 'USD',
    direction: 'down',
  },
  {
    name: 'WTI Crude Oil',
    price: 61.8,
    change: 0.18,
    changePercent: 0.29,
    date: 'April 29, 2025',
    unit: 'USD',
    direction: 'up',
  },
]

const DataItem = ({ name, price, change, changePercent, date, index, unit }: ItemProps & { index: number }) => {
  const isPositive = change > 0

  return (
    <Box paddingY={3} borderTop={index > 0 ? '1px solid #DEE2E6' : 'none'}>
      <Typography
        onClick={() => alert('redirect to detail')}
        fontWeight={600}
        color="gray.70"
        component="div"
        mb={'2px'}
        sx={{ WebkitLineClamp: 1, cursor: 'pointer' }}
        variant="fileName"
      >
        {name}
      </Typography>
      <Grid mb={1} container wrap="nowrap" alignItems="center" gap={'5px'}>
        <Typography lineHeight={1.6} color="gray.90" variant="body2">
          {price}
        </Typography>
        <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
        <Typography lineHeight={1.6} color={isPositive ? '#3C8A36' : '#A9141A'} variant="body2">
          {`${isPositive ? '+' : ''}${change} (${isPositive ? '+' : ''}${changePercent}%)`}
        </Typography>
      </Grid>
      <Grid container wrap="nowrap" alignItems="center" gap={'5px'}>
        <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
          {date}
        </Typography>
        <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
        <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
          {'DoD'}
        </Typography>
        <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
        <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
          {unit}
        </Typography>
      </Grid>
    </Box>
  )
}

const UpdatedData = () => (
  <Grid gap={2.5} bgcolor={'#fff'} container direction="column" p={6} borderRadius={1} border={'1px solid'} borderColor={'gray.30'}>
    <Typography component="div" color="gray.90" variant="titleBox">
      Updated Data
    </Typography>
    <Box>{dummyData?.map((item: ItemProps, index: number) => <DataItem key={index} {...item} index={index} />)}</Box>
    <MIButton width={'100%'} contentType={'text'} color={'gray2'} type={'outlined'} size={'h42'}>
      View all
      <KeyboardArrowRightIcon
        sx={{
          verticalAlign: 'sub',
          color: '#868E96',
          ml: '8px',
        }}
        fontSize={'small'}
      />
    </MIButton>
  </Grid>
)

export default UpdatedData
