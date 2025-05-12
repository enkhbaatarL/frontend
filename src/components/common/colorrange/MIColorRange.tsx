import { Box, Typography } from '@mui/material'

import MIColorBox from './MIColorBox'

import { formatNumberToDecimal } from '@/utils/number'

export interface MIColorRangeProps {
  data?: number[]
}

export default function MIColorRange(props: Readonly<MIColorRangeProps>) {
  const { data = [-1.0, -0.7, -0.3, 0, 0.3, 0.7, 1.0] } = props

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1px' }}>
      {data.map((value, index) => (
        <Box key={index} sx={{ textAlign: 'center' }}>
          {index < data.length - 1 ? <MIColorBox value={value} /> : <Box height={'12px'} width={'1px'}></Box>}
          <Typography
            variant="body3"
            color="#868E96"
            sx={{
              marginTop: '6px',
              marginLeft: index < data.length - 1 ? '-44.83px' : '-15px',
            }}
          >
            {formatNumberToDecimal(value)}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
