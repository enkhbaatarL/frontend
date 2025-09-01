import { Box, CircularProgress } from '@mui/material'
import axios from 'axios'
import { useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { UserRole } from '@/service/admin/members'
import authService from '@/service/common/auth'
import useAuthStore from '@/store/useAuthStore'

const CallbackProcessingPage = () => {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const { user, setUser, setToken } = useAuthStore()

  const navigate = useNavigate()

  const setUserInfo = useCallback(
    async (token: string) => {
      const userDetail = await authService.getUserDetail(token)

      if (userDetail) {
        setUser(userDetail)
        setToken(token)
        if (userDetail.userRoleCd !== 'USER') {
          await authService.getAdminAccessCheck(token)
        }
      }
    },
    [setUser, setToken],
  )

  useEffect(() => {
    if (!sessionId) {
      navigate('/error/auth', { replace: true })
      return
    }

    axios
      .get('/api/v1/saml2/callback', {
        params: { sessionId },
        withCredentials: true,
      })
      .then(async (res) => {
        const authToken = res.data.data.accessToken

        if (authToken) {
          await setUserInfo(authToken)
        }
      })
      .catch(() => {
        navigate('/error/auth', { replace: true })
      })
  }, [sessionId])

  useEffect(() => {
    if (user?.userRoleCd) {
      // 로컬스토리지에서 저장된 리다이렉트 경로 확인
      const redirectPath = localStorage.getItem('redirectAfterLogin')

      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin')
        navigate(redirectPath, { replace: true })
        return
      }

      switch (user?.userRoleCd) {
        case UserRole.ADMIN:
          navigate('/admin')
          break
        case UserRole.OPERATOR:
          navigate('/admin/data-providers/providers')
          break
        case UserRole.USER:
          navigate('/mi')
          break
        default:
          navigate('/error/auth', { replace: true })
      }
    }
  }, [user?.userRoleCd])

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  )
}

export default CallbackProcessingPage
