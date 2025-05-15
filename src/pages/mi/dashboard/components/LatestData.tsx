import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Grid2 as Grid, Typography } from '@mui/material'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
interface DocumentItemProps {
  title: string
  date: string
  name: string
  id: number
  index: number
}

const DataItem = ({ title, date, name, index }: DocumentItemProps) => (
  <Box paddingY={3} borderTop={index > 0 ? '1px solid #DEE2E6' : 'none'}>
    <Typography
      onClick={() => alert('redirect to detail')}
      fontWeight={600}
      color="gray.70"
      component="div"
      sx={{ WebkitLineClamp: 1, cursor: 'pointer' }}
      variant="fileName"
    >
      {title}
    </Typography>
    <Grid container wrap="nowrap" alignItems="center" gap={'5px'}>
      <Typography lineHeight={1.6} color="gray.60" variant="body2">
        {name}
      </Typography>
      <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
      <Typography whiteSpace="nowrap" lineHeight={1.6} color="gray.60" variant="body2">
        {date}
      </Typography>
    </Grid>
  </Box>
)

const LatestData = () => {
  const documentData = [
    {
      id: 1,
      title: 'LNG Tranding Analytics : Supply tracker',
      date: '2025-04-11',
      name: 'Wood Mackenzie',
    },
    {
      id: 2,
      title: 'LNG Tranding Analytics : Supply tracker',
      date: '2025-03-26',
      name: 'Wood Mackenzie',
    },
    {
      id: 3,
      title: 'LNG Tranding Analytics : Supply tracker',
      date: '2025-03-26',
      name: 'Wood Mackenzie',
    },
    {
      id: 4,
      title: 'LNG Tranding Analytics : Supply tracker',
      date: '2025-03-26',
      name: 'Wood Mackenzie',
    },
    {
      id: 5,
      title: 'LNG Tranding Analytics : Supply tracker',
      date: '2025-03-26',
      name: 'Wood Mackenzie',
    },
  ]

  return (
    <Grid gap={2.5} bgcolor={'#fff'} container direction="column" p={6} borderRadius={1} border={'1px solid'} borderColor={'gray.30'}>
      <Typography component="div" color="gray.90" variant="titleBox">
        Latest Data
      </Typography>
      <Box>
        {documentData?.map((item, index) => (
          <DataItem key={item.id} index={index} id={item.id} title={item.title} date={item.date} name={item.name} />
        ))}
      </Box>
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
}

export default LatestData
