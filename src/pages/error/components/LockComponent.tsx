import { Grid2 as Grid, Typography } from '@mui/material'
import { t } from 'i18next'

import type { ReactNode } from 'react'

import AuthorityIcon from '@/components/common/icons/AuthorityIcon'
type LockComponentProps = {
  title?: string
  message?: ReactNode
}

const LockComponent = ({
  title = 'SK MI Platform',
  message = (
    <>
      <div>{t('접근 권한이 없습니다')}</div>
      <div>{t('관리자에게 시스템 사용자 등록을 요청해 주세요.')}</div>
    </>
  ),
}: LockComponentProps) => (
  <Grid container height="100vh" width="100vw" alignItems="center" justifyContent="center" direction="column" spacing={5}>
    <Grid container direction="column" alignItems="center" spacing={0}>
      <AuthorityIcon />
      <Typography variant="heading1" color="gray.90">
        {title}
      </Typography>
    </Grid>
    <Grid>
      <Typography component="div" variant="subtext1" color="gray.60" align="center" whiteSpace="pre-line">
        {message}
      </Typography>
    </Grid>
  </Grid>
)

export default LockComponent
