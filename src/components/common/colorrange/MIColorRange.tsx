import { Box, Typography, Tooltip } from '@mui/material'

import MIColorBox from './MIColorBox'

import { formatNumberToDecimal } from '@/utils/number'

export interface MIColorRangeProps {
  data?: number[]
}

const getTooltipLabel = (value: number) => {
  if (value === -1.0) return 'Strong Negative'
  if (value === -0.7) return 'Moderate Negative'
  if (value === -0.3) return 'Weak Negative'
  if (value === 0) return 'Neutral'
  if (value === 0.3) return 'Weak Positive'
  if (value === 0.7) return 'Moderate Positive'
  return 'Strong Positive'
}

export default function MIColorRange(props: Readonly<MIColorRangeProps>) {
  const { data = [-1.0, -0.7, -0.3, 0, 0.3, 0.7, 1.0] } = props

  return (
    <Box>
      {/* 상단 Negative/Positive 레이블 */}
      <Box sx={{ display: 'flex', marginBottom: '7px' }}>
        {data.map((_, index) => (
          <Box
            key={`label-${index}`}
            sx={{
              width: '47px',
              textAlign: 'center',
              height: '20px',
              marginLeft: '-5px' 
            }}
          >
            {index === 1 && (
              <Typography variant="body3" color="#868E96" sx={{ marginLeft: '-70px' }}>
                Negative
              </Typography>
            )}
            {index === data.length - 1 && (
              <Typography variant="body3" color="#868E96" sx={{ marginLeft: '24px' }}>
                Positive
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {data.map((value, index) => (
          <Box key={index} sx={{ textAlign: 'center' }} >
            {index < data.length  ? (
              <Tooltip title={getTooltipLabel(value)} arrow>
                <Box>
                  <MIColorBox value={value} />
                </Box>
              </Tooltip>
            ) : (
              <Box height="12px" width="1px" />
            )}
            <Typography
              variant="body3"
              color="#868E96"
              sx={{
                marginTop: '6px',
                // marginLeft: index < data.length - 1 ? '-48px'  : '30px',
                marginLeft: {
                  0: '-24px',
                  1: '-15px',
                  2: '-5px',
                  3: '0px',
                  4: '5px',
                  5: '15px',
                  6: '21px'
                }[index],
              }}
            >
              {formatNumberToDecimal(value)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

