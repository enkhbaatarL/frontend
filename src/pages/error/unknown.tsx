import { Grid2 as Grid, Typography } from '@mui/material'

import AdminButton from '@/components/admin/AdminButton'
import ErrorIcon from '@/components/common/icons/ErrorIcon'

export default function ErrorUnknownPage() {
  return (
    <Grid container height="100vh" width="100vw" alignItems="center" justifyContent="center" direction="column" spacing={5}>
      <Grid container direction="column" alignItems="center" spacing={0}>
        <ErrorIcon />
        <Typography variant="heading1" color="gray.90">
          Error
        </Typography>
      </Grid>
      <Grid>
        <Typography component="div" variant="subtext1" color="gray.60" align="center">
          문제가 발생했습니다.
          <br />
          나중에 다시 시도하시거나 이전 페이지로 돌아가세요.
        </Typography>
      </Grid>
      <Grid display="flex" gap={3}>
        <AdminButton size="h42" variant="outlined" color="primary">
          이전 페이지로
        </AdminButton>
        <AdminButton size="h42" variant="contained" color="primary">
          홈으로
        </AdminButton>
      </Grid>
    </Grid>
  )
}
