import { Box, Typography } from '@mui/material'
import { useEffect } from 'react'

import imgPath from '@/assets/imsi/Market News_weekly_1440 1.png'
import bgmImg from '@/assets/imsi/subheader black.jpg'
import psImg from '@/assets/productsymbol.png'
import MISkeleton from '@/components/mi/MISkeleton.tsx'

const NewsPage = () => {
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
          background: `url(${psImg}) right / 33% no-repeat, url(${bgmImg}) lightgray 50% 82%/ cover no-repeat`,
          zIndex: 0,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            boxShadow: '0px 20px 20px 0px rgba(0, 0, 0, 0.25) inset',
          }}
        ></Box>
        <Box boxSizing={'border-box'} paddingX={7.5} paddingY={10.5} minWidth={'1440px'} width={'1440px'} margin={'auto'}>
          <Typography color="white" component="h1" fontSize={40} variant="body1M16">
            Market news
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          overflow: 'hidden',
          zIndex: 0,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <img src={imgPath} style={{ display: 'block' }} />
      </Box>
    </MISkeleton>
  )
}

export default NewsPage
