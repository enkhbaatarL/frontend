import { Box } from '@mui/material'

interface MILineProps {
  length?: number | string
  thickness?: number | string
  backgroundColor?: string
  margin?: number | string
  borderRadius?: number
  direction?: 'horizontal' | 'vertical'
}

export default function MILine({
  length = '100%',
  thickness = '1px',
  backgroundColor = '#DEE2E6',
  borderRadius = 0,
  direction = 'horizontal',
  margin = 0,
}: MILineProps) {
  return (
    <Box
      sx={{
        width: direction === 'horizontal' ? length : thickness,
        height: direction === 'horizontal' ? thickness : length,
        backgroundColor,
        borderRadius,
        margin,
      }}
    />
  )
}
