import { Box, Grid2 as Grid, Typography } from '@mui/material'
import Link from '@mui/material/Link'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import logowImg from '@/assets/logow.svg'
import useEnvironment from '@/hooks/useEnvironment.ts'

const MIFooter = () => {
  const navigate = useNavigate()
  const { isProd } = useEnvironment()
  const { t } = useTranslation()

  return (
    <footer>
      <Box mt={25} bgcolor="gray.60" paddingY={10}>
        <Grid
          width={'1440px'}
          paddingX={7.5}
          gap={5}
          wrap="wrap"
          container
          maxWidth={'1380px'}
          margin={'auto'}
          justifyContent="space-between"
        >
          <Grid container gap={5} direction="column">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault()
                if (isProd) {
                  navigate('/mi')
                } else {
                  navigate('/')
                }
              }}
            >
              <img src={logowImg} alt="" />
            </Link>
            <Typography color="gray.40" component="div" variant="body3R12">
              COPYRIGHT©2025 ALL RIGHTS RESERVED. <br />
              {t('footer.copyrightMessage')}
            </Typography>
          </Grid>
          <Typography color="gray.40" variant="body2">
            <Link
              fontWeight={600}
              color="white"
              variant="body2"
              underline="none"
              padding="6px 14px"
              onClick={(e) => {
                e.preventDefault()
                navigate('/mi/privacy-policy')
              }}
              href=""
              sx={{
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(46, 63, 94, 0.15)',
                },
              }}
            >
              {t('footer.privacyPolicy')}
            </Link>
          </Typography>
        </Grid>
      </Box>
    </footer>
  )
}

export default MIFooter
