import { Box } from '@mui/material'

import LoadingSpinner from './icons/LoadingSpinIcon'

export default function LoadingBox(props: { width: number; height: number }) {
  return (
    <Box
      display={'flex'}
      alignItems={'center'}
      justifyContent={'center'}
      width={`${props.width}px`}
      height={`${props.height}px`}
      sx={{
        borderRadius: '4px',
        border: '1px solid #868E96',
        backgroundColor: 'linear-gradient(107deg, #C2C2C2 8.8%, #FFF 54.4%, #FFF 67.11%, #C4C4C4 100%)',
      }}
    >
      <LoadingSpinner />
    </Box>
  )
}
