import { Box } from '@mui/material'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import tempMarketNewsImg from '@/assets/imsi/market-news.png'
import tempMarketNewsJaImg from '@/assets/imsi/market-news_ja.png'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton.tsx'

const NewsPage = () => {
  const { i18n } = useTranslation()

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return (
    <MISkeleton variant={'insights'}>
      <MIPageHeadline title="Market News" gradientStart="#2E313A" gradientEnd="#1F212A" />

      <Box
        sx={{
          overflow: 'hidden',
          zIndex: 0,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <img
          src={i18n.language === 'ja' ? tempMarketNewsJaImg : tempMarketNewsImg}
          alt="market-news"
          width={1920}
          style={{ display: 'block' }}
          draggable={false}
        />
      </Box>
    </MISkeleton>
  )
}

export default NewsPage
