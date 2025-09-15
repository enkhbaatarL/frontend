import { Box } from '@mui/material'
import { useEffect } from 'react'

import MISkeleton from '@/components/mi/MISkeleton.tsx'

const CustomPage = () => {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  const HEADER = 64
  return (
    <MISkeleton variant={'insights'}>
      <Box
        paddingY={14}
        sx={{
          height: `calc(100vh - ${HEADER}px)`,
          overflow: 'hidden',
          p: '30px',
          zIndex: 0,
          position: 'relative',
        }}
      >
        <iframe
          src={`https://${window.location.hostname}/ske/?embed=true`}
          title="Embedded"
          style={{ width: '100%', height: '100%', border: 0 }}
          allowFullScreen
        />
      </Box>
    </MISkeleton>
  )
}

export default CustomPage
