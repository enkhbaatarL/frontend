import { CircularProgress, Box } from '@mui/material'
import axios from 'axios'
import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import authService from '@/service/common/auth'
import useAuthStore from '@/store/useAuthStore'

const CallbackProcessingPage = () => {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const { user, setUser, setToken } = useAuthStore()

  // const navigate = useNavigate()

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
          console.log('res', res)

          const authToken = res.headers['set-cookie']?.find((cookie) => cookie.startsWith('Authorization='))
          const refreshToken = res.headers['set-cookie']?.find((cookie) => cookie.startsWith('X-Refresh-Token='))

          console.log('Authorization Token:', authToken)
          console.log('Refresh Token:', refreshToken)
          console.log('Session ID:', sessionId)

          if (authToken && refreshToken) {
            await setUserInfo(authToken, refreshToken)
            // navigate('/')
            console.log('user', user)
          }
        })
    }
  }, [sessionId])

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
