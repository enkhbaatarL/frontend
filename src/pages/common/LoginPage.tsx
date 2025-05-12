import { Divider } from '@mui/material'
import { jwtDecode } from 'jwt-decode'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import Flex from '@/components/common/display/Flex'
import MISelect from '@/components/common/select/MISelect'
import { UserRole } from '@/service/admin/members'
import useAuthStore, { IUser } from '@/store/useAuthStore'

interface ITokenPayload {
  sub: string
  iat: number
  userNo: number
  companyNo: number
  companyCd: string
  role: UserRole
  exp: number
}

const getUserInfo = (token: string): IUser | null => {
  try {
    const decoded = jwtDecode<ITokenPayload>(token)

    return {
      // TODO: 실 데이터로 교체
      role: decoded.role,
      userNo: decoded.userNo.toString(),
      userNm: '홍길동(테스트)',
      email: decoded.sub,
      companyNm: 'SK C&C',
      departmentNm: 'Market Intelligence팀',
    }
  } catch (error) {
    console.error('token decoding error:', error)
  }

  return null
}

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
  const isProd = false

  const navigate = useNavigate()
  const { setUser, setToken, clearAuth } = useAuthStore()

  const [devUser, setDevUser] = useState<string>(devTokens.user[0].value)
  const [devAdmin, setDevAdmin] = useState<string>(devTokens.admin[0].value)
  const [devOperator, setDevOperator] = useState<string>(devTokens.operator[0].value)

  const ssoLogin = () => {
    // TODO: SSO login 작성
  }

  const setDevUserInfo = useCallback(
    (token: string) => {
      const user = getUserInfo(token)

      if (user) {
        setUser(user)
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

  return (
    <Flex direction="column" gap={20} className="full-height" justify="center" align="center">
      <Flex direction="column" gap={20} align="center">
        <Flex gap={10}>
          <MISelect
            value={devUser}
            options={devTokens.user}
            sx={{ width: '160px' }}
            onChange={({ target }) => {
              setDevUser(target.value as string)
            }}
          />
          <MIButton
            onClick={() => {
              setDevUserInfo(devUser)
              navigate('mi')
            }}
            width="120px"
          >
            사용자 로그인
          </MIButton>
        </Flex>
        <Divider sx={{ width: '100%' }} />
        <Flex gap={10}>
          <MISelect
            value={devAdmin}
            options={devTokens.admin}
            sx={{ width: '160px' }}
            onChange={({ target }) => {
              setDevAdmin(target.value as string)
            }}
          />
          <MIButton
            onClick={() => {
              setDevUserInfo(devAdmin)
              navigate('admin')
            }}
            width="120px"
          >
            Admin 로그인
          </MIButton>
        </Flex>
        <Flex gap={10}>
          <MISelect
            value={devOperator}
            options={devTokens.operator}
            sx={{ width: '160px' }}
            onChange={({ target }) => {
              if (target.value) {
                setDevOperator(target.value as string)
              }
            }}
          />
          <MIButton
            onClick={() => {
              setDevUserInfo(devOperator)
              navigate('admin/data-providers/providers')
            }}
            width="120px"
          >
            운영자 로그인
          </MIButton>
        </Flex>
        <Divider sx={{ width: '100%' }} />
        <Flex gap={10}>
          <MIButton
            onClick={() => {
              navigate('/test')
            }}
            type="outlined"
          >
            Component Test
          </MIButton>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default LoginPage
