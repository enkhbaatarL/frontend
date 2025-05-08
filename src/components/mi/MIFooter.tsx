import { Box, Grid2 as Grid, Typography } from '@mui/material'
import Link from '@mui/material/Link'
import { useNavigate } from 'react-router-dom'

const MIFooter = () => {
  const navigate = useNavigate()

  return (
    <footer>
      <Box mt={25} bgcolor="gray.60" paddingX={{ xs: 6, md: 7.5 }} paddingY={{ xs: 6, md: 10 }}>
        <Grid gap={5} wrap="wrap" container maxWidth={'1380px'} margin={'auto'} justifyContent="space-between">
          <Grid container gap={5} direction="column">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault()
                navigate('/')
              }}
            >
              <img width="210" src="/src/assets/logow.svg" alt="" />
            </Link>
            <Typography color="gray.40" component="div" variant="body3R12">
              COPYRIGHT©2025 ALL RIGHTS RESERVED. <br />
              SK구성원을 위한 시스템으로서 인가된 분만 사용할 수 있습니다. 불법으로 사용시에는 법적 제재를 받을 수 있습니다.
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
                navigate('/test/privacy-policy')
              }}
              href=""
              sx={{
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(46, 63, 94, 0.15)',
                },
              }}
            >
              개인정보처리방침
            </Link>
          </Typography>
        </Grid>
      </Box>
    </footer>
  )
}

export default MIFooter
