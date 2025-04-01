import { Grid2 as Grid, Typography } from '@mui/material'

import AdminButton from '@/components/admin/AdminButton'
import ErrorIcon from '@/components/common/icons/ErrorIcon'

const Error404Page = () => (
  <Grid container height="100vh" width="100vw" alignItems="center" justifyContent="center" direction="column" spacing={5}>
    <Grid container direction="column" alignItems="center" spacing={0}>
      <ErrorIcon />
      <Typography variant="heading1" color="gray.90">
        404
      </Typography>
    </Grid>
    <Grid>
      <Typography variant="subtext1" color="gray.60">
        에러 코드별 메시지 내용이 출력됩니다.
      </Typography>
    </Grid>
    <Grid>
      <AdminButton size="h42" variant="contained" color="primary">
        이전 페이지로
      </AdminButton>
    </Grid>
  </Grid>
)

export default Error404Page
