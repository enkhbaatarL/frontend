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
    async (token: string, refreshToken?: string) => {
      const userDetail = await authService.getUserDetail(token)

      if (userDetail) {
        setUser(userDetail)
        setToken(token, refreshToken)
      }
    },
    [setUser, setToken],
  )

  useEffect(() => {
    if (sessionId) {
      axios
        .get('/api/v1/saml2/callback', {
          params: { sessionId },
          withCredentials: true,
        })
        .then(async (res) => {
          const authToken = res.data.data.accessToken
          const refreshToken = res.data.data.refreshToken

          if (authToken && refreshToken) {
            await setUserInfo(authToken, refreshToken)
          }
        })
    }
  }, [sessionId])

  useEffect(() => {
    if (user?.userRoleCd) {
      switch (user?.userRoleCd) {
        case UserRole.ADMIN:
        case UserRole.OPERATOR:
          navigate('admin')
          break
        case UserRole.USER:
          navigate('mi')
          break
        default:
          navigate('error/auth', { replace: true })
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
