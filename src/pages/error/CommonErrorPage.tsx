import { Grid2 as Grid, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AuthorityIcon from '@/components/common/icons/AuthorityIcon'
import ErrorIcon from '@/components/common/icons/ErrorIcon'

const codeMapper = (status: number, code?: string): string => {
  if (code) {
    const map: Record<string, string> = {
      'AUTH-001': '접근 권한이 없습니다. \n관리자에게 시스템 사용자 등록을 요청해 주세요',
      'AUTH-003': '토큰이 만료되어 갱신을 진행합니다.',
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

const getErrorInfo = (state: { status?: number; code?: string }, pathname: string, paramsCode?: string) => {
  const fallbackStatus = (() => {
    const last = pathname.split('/').filter(Boolean).pop()
    return last && !isNaN(Number(last)) ? Number(last) : 0
  })()
  const statusCode = state?.status ?? fallbackStatus
  const message = codeMapper(statusCode, state?.code ?? paramsCode)
  // 많아지면 분리 필요
  // const additionalVar = paramsCode === 'AUTH-001' ? { hiddenButton: true, icon: 'lock', title: 'AI Market Insights' } : {}
  const additionalMap: Record<string, any> = {
    'AUTH-001': { hiddenButton: true, icon: 'lock', title: 'AI Market Insights' },
    'AUTH-003': { hiddenButton: true, icon: 'lock', title: 'AI Market Insights' },
  }
  const additionalVar = additionalMap[paramsCode!] ?? {}
  return { statusCode, message, ...additionalVar }
}

const CommonErrorPage = () => {
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const paramsCode = new URLSearchParams(search).get('errorCode') ?? undefined
  const { statusCode, message, hiddenButton, icon, title } = useMemo(
    () => ({
      hiddenButton: state?.hiddenButton ?? false,
      icon: state?.icon ?? 'warning',
      title: state?.title,
      ...getErrorInfo(state, pathname, paramsCode),
    }),
    [state, pathname, paramsCode],
  )

  const isAuthError = typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500
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
        {icon === 'lock' ? <AuthorityIcon /> : <ErrorIcon />}
        <Typography variant="heading1" color="gray.90">
          {title ?? (statusCode === 0 ? 'Error' : statusCode)}
        </Typography>
      </Grid>
      <Grid textAlign={'center'}>
        <Typography variant="subtext1" color="gray.60" sx={{ whiteSpace: 'pre-line' }}>
          {message}
        </Typography>
      </Grid>

      <Grid display="flex" gap={3}>
        {!hiddenButton && renderButtons()}
      </Grid>
    </Grid>
  )
}

export default CommonErrorPage
