import { Box } from '@mui/material'
import { useMemo } from 'react'

export interface MIChipProps {
  value: number
}

const MIColorBox = (props: MIChipProps) => {
  const { value } = props
  const color = useMemo(() => {
    if (value < -0.7) return '#6B2935'
    if (value < -0.3) return '#983846'
    if (value < 0) return '#C74659'
    if (value === 0) return '#5D636A'
    if (value < 0.4 ) return '#459578' 
    if (value < 0.8) return '#397964'

    return '#29584A'
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
        
      }}
    ></Box>
  )
}

export default MIColorBox

