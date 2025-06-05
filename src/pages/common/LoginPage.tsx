import { Divider } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import Flex from '@/components/common/display/Flex'
import MIInput from '@/components/common/input/MIInput'
import devTokens from '@/constants/devTokens'
import authService from '@/service/common/auth'
import useAuthStore from '@/store/useAuthStore'

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
