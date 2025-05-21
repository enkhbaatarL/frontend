import { Grid2 as Grid, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import ErrorIcon from '@/components/common/icons/ErrorIcon'

const codeMapper = (status: number, code?: string): string => {
  if (code) {
    const map: Record<string, string> = {
      'SYS-999': '문제가 발생했습니다.\n나중에 다시 시도하시거나 이전 페이지로 돌아가세요.',
      'AUTH-004': '제공된 토큰이 유효하지 않거나 형식이 잘못되었습니다.',
      'AUTH-005': '이 작업을 수행할 권한이 없습니다.',
      'AUTH-007': '접근이 거부되었습니다. 해당 리소스에 접근할 권한이 없습니다.',
    }
    return map[code] ?? '알 수 없는 오류가 발생했습니다.'
  }

  if (status === 404) {
    return '페이지를 찾을 수 없습니다.\n나중에 다시 시도하시거나 이전 페이지로 돌아가세요.'
  }
  return '문제가 발생했습니다.\n나중에 다시 시도하시거나 이전 페이지로 돌아가세요.'
}

const getErrorInfo = (state: { status?: number; code?: string }, pathname: string) => {
  const fallbackStatus = (() => {
    const last = pathname.split('/').filter(Boolean).pop()
    return last && !isNaN(Number(last)) ? Number(last) : 0
  })()

  const status = state?.status ?? fallbackStatus
  const message = codeMapper(status, state?.code)

  return { status, message }
}

const CommonErrorPage = () => {
  const { state, pathname } = useLocation()
  const navigate = useNavigate()

  const { status, message } = useMemo(() => getErrorInfo(state, pathname), [state, pathname])
  const isAuthError = typeof status === 'number' && status >= 400 && status < 500

  const renderButtons = () => (
    <Grid display="flex" gap={3}>
      <AdminButton size="h42" variant={isAuthError ? 'contained' : 'outlined'} color="primary" onClick={() => navigate(-1)}>
        이전 페이지로
      </AdminButton>
      {!isAuthError && (
        <AdminButton size="h42" variant="contained" color="primary" onClick={() => navigate('/')}>
          홈으로
        </AdminButton>
      )}
    </Grid>
  )

  return (
    <Grid container height="100vh" width="100vw" alignItems="center" justifyContent="center" direction="column" spacing={5}>
      <Grid container direction="column" alignItems="center" spacing={0}>
        <ErrorIcon />
        <Typography variant="heading1" color="gray.90">
          {status === 0 ? 'Error' : status}
        </Typography>
      </Grid>
      <Grid textAlign={'center'}>
        <Typography variant="subtext1" color="gray.60" sx={{ whiteSpace: 'pre-line' }}>
          {message}
        </Typography>
      </Grid>

      <Grid display="flex" gap={3}>
        {renderButtons()}
      </Grid>
    </Grid>
  )
}

export default CommonErrorPage
