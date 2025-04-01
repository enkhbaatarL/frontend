import { Grid2 as Grid, Typography } from '@mui/material'

import AuthorityIcon from '@/components/common/icons/AuthorityIcon'

export default function ErrorAccessDeniedPage() {
  return (
    <Grid container height="100vh" width="100vw" alignItems="center" justifyContent="center" direction="column" spacing={5}>
      <Grid container direction="column" alignItems="center" spacing={0}>
        <AuthorityIcon />
        <Typography variant="heading1" color="gray.90">
          SK MI Platform
        </Typography>
      </Grid>
      <Grid>
        <Typography component="div" variant="subtext1" color="gray.60" align="center">
          접근 권한이 없습니다.
          <br />
          관리자에게 시스템 사용자 등록을 요청해 주세요.
        </Typography>
      </Grid>
    </Grid>
  )
}
