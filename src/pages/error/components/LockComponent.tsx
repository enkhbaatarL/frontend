import { Grid2 as Grid, Typography } from '@mui/material'
import { t } from 'i18next'
import { useNavigate } from 'react-router-dom'

import type { ReactNode } from 'react'

import AdminButton from '@/components/admin/AdminButton.tsx'
import AuthorityIcon from '@/components/common/icons/AuthorityIcon'
import useAuthStore from '@/store/useAuthStore.ts'

type LockComponentProps = {
  title?: string
  message?: ReactNode
}

const LockComponent = ({
  title = 'AI Market Insights',
  message = (
    <>
      <div>{t('접근 권한이 없습니다')}</div>
      <div>{t('관리자에게 시스템 사용자 등록을 요청해 주세요.')}</div>
    </>
  ),
}: LockComponentProps) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  return (
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
      {user?.userAccessPageType === 'BOTH' && (
        <AdminButton size="h39" variant="contained" color="primary" onClick={() => navigate('/mi')}>
          서비스 페이지 이동
        </AdminButton>
      )}
    </Grid>
  )
}

export default LockComponent
