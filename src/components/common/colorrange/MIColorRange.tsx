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
  if (value === 0) return 'Weak Positive'
  if (value === 0.3) return 'Moderate Positive'
  if (value === 0.7) return 'Strong Positive'
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
              width: '48px',
              textAlign: 'center',
              height: '20px',
            }}
          >
            {index === 1 && (
              <Typography variant="body3" color="#868E96" sx={{ marginLeft: '-16px' }}>
                Negative
              </Typography>
            )}
            {index === data.length - 1 && (
              <Typography variant="body3" color="#868E96">
                Positive
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1px', marginLeft: '50px' }}>
        {data.map((value, index) => (
          <Box key={index} sx={{ textAlign: 'center' }}>
            {index < data.length - 1 ? (
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
                marginLeft: index < data.length - 1 ? '-44.83px' : '-15px',
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
