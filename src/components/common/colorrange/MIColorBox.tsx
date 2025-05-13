import { Box } from '@mui/material'
import { useMemo } from 'react'

export interface MIChipProps {
  value: number
}

const MIColorBox = (props: MIChipProps) => {
  const { value } = props
  const color = useMemo(() => {
    if (value < -0.7) return '#B52837'
    if (value < -0.3) return '#C7515E'
    if (value < 0) return '#CB989E'
    if (value < 0.3) return '#99B5AE'
    if (value < 0.7) return '#3F9E80'

    return '#006F4E'
  }, [value])

  return (
    <Box
      sx={{
        backgroundColor: color,
        width: '44.83px',
        height: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          right: '-1px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '1px',
          height: '16px',
          backgroundColor: '#CED4DA',
        },
        '&:first-of-type::after': {
          content: '""',
          position: 'absolute',
          left: '-1px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '1px',
          height: '16px',
          backgroundColor: '#CED4DA',
        },
      }}
    ></Box>
  )
}

export default MIColorBox
