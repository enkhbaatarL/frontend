import { Divider } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import Flex from '@/components/common/display/Flex'
import MIInput from '@/components/common/input/MIInput'
import devTokens from '@/constants/devTokens'
import useEnvironment from '@/hooks/useEnvironment'
import authService from '@/service/common/auth'
import useAuthStore from '@/store/useAuthStore'

const LoginPage = () => {
  const { isProd, isLocal } = useEnvironment()

  const navigate = useNavigate()
  const { setUser, setToken, clearAuth } = useAuthStore()

  const [devUser, setDevUser] = useState<string>(devTokens.user[0].value)
  const [devAdmin, setDevAdmin] = useState<string>(devTokens.admin[0].value)
  const [devOperator, setDevOperator] = useState<string>(devTokens.operator[0].value)

  const [password, setPassword] = useState<string>('')
  const [tempAuthFilter, setTempAuthFilter] = useState<boolean>(() => {
    const isDevAuthenticated = localStorage.getItem('mi-dev-authenticated') === 'true'
    return isLocal || isDevAuthenticated
  })

  const ssoLogin = () => {
    window.location.href = '/api/v1/saml2/login/user'
  }

  const setUserInfo = useCallback(
    async (token: string) => {
      const userDetail = await authService.getUserDetail(token)

      if (userDetail) {
        setUser(userDetail)
        setToken(token)
      }
    },
    [setUser, setToken],
  )

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setPassword(inputValue)

    if (inputValue === 'mitest1234' || inputValue === 'ㅡㅑㅅㄷㄴㅅ1234') {
      localStorage.setItem('mi-dev-authenticated', 'true')
      setTempAuthFilter(true)
    }
  }

  useEffect(() => {
    clearAuth()
  }, [])

  if (isProd) {
    ssoLogin()
    return null
  }

  return (
    <Flex direction="column" gap={20} className="full-height" justify="center" align="center">
      {tempAuthFilter ? (
        <Flex direction="column" gap={20} align="center">
          <Flex gap={10}>
            <MIButton
              contentType="select"
              type="outlined"
              valueSelect={devTokens.user.find((option) => option.value === devUser)}
              options={devTokens.user}
              width="160px"
              minWidth="160px"
              onChange={(option) => {
                setDevUser(option.value)
              }}
            />
            <MIButton
              onClick={async () => {
                await setUserInfo(devUser)
                navigate('mi')
              }}
              width="120px"
            >
              사용자 로그인
            </MIButton>
          </Flex>
          <Divider sx={{ width: '100%' }} />
          <Flex gap={10}>
            <MIButton
              contentType="select"
              type="outlined"
              valueSelect={devTokens.admin.find((option) => option.value === devAdmin)}
              options={devTokens.admin}
              width="160px"
              minWidth="160px"
              onChange={(option) => {
                setDevAdmin(option.value)
              }}
            />
            <MIButton
              onClick={async () => {
                await setUserInfo(devAdmin)
                navigate('admin')
              }}
              width="120px"
            >
              Admin 로그인
            </MIButton>
          </Flex>
          <Flex gap={10}>
            <MIButton
              contentType="select"
              type="outlined"
              valueSelect={devTokens.operator.find((option) => option.value === devOperator)}
              options={devTokens.operator}
              width="160px"
              minWidth="160px"
              onChange={(option) => {
                setDevOperator(option.value)
              }}
            />
            <MIButton
              onClick={async () => {
                await setUserInfo(devOperator)
                navigate('admin/data-providers/providers')
              }}
              width="120px"
            >
              운영자 로그인
            </MIButton>
          </Flex>
          <Divider sx={{ width: '100%' }} />
          <MIButton onClick={ssoLogin} width="120px">
            SSO 로그인
          </MIButton>
        </Flex>
      ) : (
        <Flex direction="row" gap={20} align="center" style={{ width: '300px' }}>
          <MIInput fullWidth label="비밀번호" type="password" value={password} onChange={handlePasswordChange} />
        </Flex>
      )}
    </Flex>
  )
}

export default LoginPage
