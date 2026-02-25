import { Box } from '@mui/material'
import { useEffect } from 'react'

import imgPath1 from '@/assets/imsi/Anchor_Navigation_2x.png'
import imgPath2 from '@/assets/imsi/Container_2x.png'
import MISkeleton from '@/components/mi/MISkeleton'

const NewsletterDetailTempPage = () => {
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
        <div style={{ position: 'relative', top: '0', left: '0' }}>
          <img
            style={{ position: 'absolute', top: '94px', right: '-220px' }}
            src={imgPath1}
            width="220px"
            height="790px"
            alt=""
            draggable={false}
          />
          <img src={imgPath2} width="800px" height="4748px" alt="" draggable={false} />
        </div>
      </Box>
    </MISkeleton>
  )
}

export default NewsletterDetailTempPage
