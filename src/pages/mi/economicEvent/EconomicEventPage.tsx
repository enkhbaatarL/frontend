import { Box } from '@mui/material'
import { useEffect } from 'react'

import imgPath from '@/assets/imsi/Newsletter_1440.png'
import MISkeleton from '@/components/mi/MISkeleton.tsx'

const EconomicEventPage = () => {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <MISkeleton variant={'insights'}>
      <Box
        sx={{
          overflow: 'hidden',
          zIndex: 0,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <img src={imgPath} alt={''} />
      </Box>
    </MISkeleton>
  )
}

export default EconomicEventPage
