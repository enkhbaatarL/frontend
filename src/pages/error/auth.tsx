import { Grid2 as Grid, Typography } from '@mui/material'
import { t } from 'i18next'

import AdminButton from '@/components/admin/AdminButton'
import ErrorIcon from '@/components/common/icons/ErrorIcon'

const UnifiedAuthenticationErrorPage = () => (
  <Grid container height="100vh" width="100vw" alignItems="center" justifyContent="center" direction="column" spacing={5}>
    <Grid container direction="column" alignItems="center" spacing={0}>
      <ErrorIcon />
      <Typography variant="heading1" color="gray.90">
        {t('SK MI Platform')}
      </Typography>
    </Grid>
    <Grid>
      <Typography component="div" variant="subtext1" color="gray.60" align="center">
        <div>{t('통합 인증 로그인에 실패했습니다.')}</div>
        <div>{t('다시 시도해 주세요.')}</div>
      </Typography>
    </Grid>
    <Grid display="flex" gap={3}>
      <AdminButton size="h42" variant="contained" color="primary">
          Try again
      </AdminButton>
    </Grid>
  </Grid>
)

export default UnifiedAuthenticationErrorPage
