import { Divider } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import Flex from '@/components/common/display/Flex'
import MIInput from '@/components/common/input/MIInput'
import authService from '@/service/common/auth'
import useAuthStore from '@/store/useAuthStore'

const devTokens = {
  admin: [
    {
      label: 'SK C&C', // ADMIN-SKCC-SKCC000@SKCC.com
      value:
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJTS0NDMDAwQFNLQ0MuY29tIiwiaWF0IjoxNzQ3MDM1MDkwLCJ1c2VyTm8iOjEwMDAwNDQsImNvbXBhbnlObyI6MjAxMiwiY29tcGFueUNkIjoiU0tDQyIsInJvbGUiOiJBRE1JTiIsImlzT3RoZXJTZXJ2aWNlQWNjZXNzUG9zc2libGUiOnRydWUsImNvbXBhbnlEb21haW4iOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJleHAiOjIxMDcwMzUwOTB9.QELadPU-mRzhW8WmCXSNvH9au6pfuxJMi9B2I-4Z6qw',
    },
  ],
  operator: [
    {
      label: 'SK HY', // OPERATOR-SKHY-SKHY000@SKHY.com
      value:
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJTS0hZMDAwQFNLSFkuY29tIiwiaWF0IjoxNzQ3MDM1MTQxLCJ1c2VyTm8iOjEwMDAwNDUsImNvbXBhbnlObyI6MjAxNSwiY29tcGFueUNkIjoiU0tIWSIsInJvbGUiOiJPUEVSQVRPUiIsImlzT3RoZXJTZXJ2aWNlQWNjZXNzUG9zc2libGUiOmZhbHNlLCJjb21wYW55RG9tYWluIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwIiwiZXhwIjoyMTA3MDM1MTQxfQ.v9L037tbZGE1xdACXI2eTpSQeKH1MpdvkLehMXQ3g-g',
    },
    {
      label: 'SK GAS', // OPERATOR-SKGAS-SKGAS000@SKGAS.com
      value:
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJTS0dBUzAwMEBTS0dBUy5jb20iLCJpYXQiOjE3NDcwMzUxNzUsInVzZXJObyI6MTAwMDA1MSwiY29tcGFueU5vIjoyMDE0LCJjb21wYW55Q2QiOiJTS0dBUyIsInJvbGUiOiJPUEVSQVRPUiIsImlzT3RoZXJTZXJ2aWNlQWNjZXNzUG9zc2libGUiOmZhbHNlLCJjb21wYW55RG9tYWluIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwIiwiZXhwIjoyMTA3MDM1MTc1fQ.QGS0yJLL-OchU7-B2do3QrgL0X4q5LSWBoGZxsbLiqk',
    },
  ],
  user: [
    {
      label: 'SK E&S', // USER-SKEN-SKENS002@SKENS.com
      value:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJTS0VOUzAwMkBTS0VOUy5jb20iLCJpYXQiOjE3NDgyMjkzNDQsInVzZXJObyI6MTAwMDA4MiwiY29tcGFueU5vIjoyMDEzLCJjb21wYW55Q2QiOiJTS0VOUyIsInJvbGUiOiJVU0VSIiwiaXNPdGhlclNlcnZpY2VBY2Nlc3NQb3NzaWJsZSI6ZmFsc2UsImNvbXBhbnlEb21haW4iOiJFTl9MTkciLCJleHAiOjIxMDgyMjkzNDR9.OjQXaOMXr6ZILxx-NsMv33sU9Lq9AJRiTjIWmdgd4Fk',
    },
    {
      label: 'SK HY', // USER-SKHY-SKHY001@SKHY.com
      value:
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJTS0hZMDAxQFNLSFkuY29tIiwiaWF0IjoxNzQ3MDM1MjA5LCJ1c2VyTm8iOjEwMDAwNTMsImNvbXBhbnlObyI6MjAxNSwiY29tcGFueUNkIjoiU0tIWSIsInJvbGUiOiJVU0VSIiwiaXNPdGhlclNlcnZpY2VBY2Nlc3NQb3NzaWJsZSI6ZmFsc2UsImNvbXBhbnlEb21haW4iOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJleHAiOjIxMDcwMzUyMDl9.-UXBxtc-wzkf8X6lB7M09t0KWQQbGiqI-fzMTo4o-6M',
    },
    {
      label: 'SK GAS', // USER-SKGAS-SKGAS001@SKGAS.com
      value:
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJTS0dBUzAwMUBTS0dBUy5jb20iLCJpYXQiOjE3NDcwMzUxMTIsInVzZXJObyI6MTAwMDA4NSwiY29tcGFueU5vIjoyMDE0LCJjb21wYW55Q2QiOiJTS0dBUyIsInJvbGUiOiJVU0VSIiwiaXNPdGhlclNlcnZpY2VBY2Nlc3NQb3NzaWJsZSI6ZmFsc2UsImNvbXBhbnlEb21haW4iOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJleHAiOjIxMDcwMzUxMTJ9.wM4wIH-ekQmcMoIZs_SMQoh4c98WaYJvZcxllnH8XP4',
    },
  ],
}

const LoginPage = () => {
  const isProd = window.location.hostname === 'mi.sk.com'

  const navigate = useNavigate()
  const { setUser, setToken, clearAuth } = useAuthStore()

  const [devUser, setDevUser] = useState<string>(devTokens.user[0].value)
  const [devAdmin, setDevAdmin] = useState<string>(devTokens.admin[0].value)
  const [devOperator, setDevOperator] = useState<string>(devTokens.operator[0].value)

  const [tempAuthFilter, setTempAuthFilter] = useState<boolean>(window.location.hostname === 'localhost') // TODO: 임시 용도로 SSO 작업 시 제거 필요

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

  useEffect(() => {
    clearAuth()
  }, [])

  if (isProd) {
    ssoLogin()
    return null
  }

  const onLogin = async () => {
    const { accessToken: _accessToken } = await authService.postLogin({
      loginUserId: 'SKE000@SKE.com',
    })
    await setUserInfo(devUser)
    navigate('mi')
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
            <MIButton onClick={onLogin} width="120px">
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
          <MIInput
            fullWidth
            label="비밀번호"
            type="password"
            onChange={(e) => {
              if (e.target.value === 'mitest1234' || e.target.value === 'ㅡㅑㅅㄷㄴㅅ1234') {
                setTempAuthFilter(true)
              }
            }}
          />
        </Flex>
      )}
    </Flex>
  )
}

export default LoginPage
