import { Divider, Typography } from '@mui/material'
import { ChangeEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import Flex from '@/components/common/display/Flex'
import MIInput from '@/components/common/input/MIInput'
import devTokens from '@/constants/devTokens'
import useEnvironment from '@/hooks/useEnvironment'
import { NEWSLETTER_LOCAL_DRAFT_KEY_PREFIX, NEWSLETTER_LOCAL_DRAFT_TTL_MS } from '@/pages/mi/newsletter/hooks/useNewsletterLocalDraft'
import authService from '@/service/common/auth'
import useAuthStore from '@/store/useAuthStore'

const LoginPage = () => {
  const { isProd, isLocal, useExternalLogin } = useEnvironment()

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

  const ssoLogin = useCallback(() => {
    globalThis.location.href = '/api/v1/saml2/login/user'
  }, [])

  const externalAccessLogin = useCallback(() => {
    navigate('/login')
  }, [navigate])

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

  const handlePasswordChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setPassword(inputValue)

    if (['mitest1234', 'ㅡㅑㅅㄷㄴㅅ1234'].includes(inputValue)) {
      localStorage.setItem('mi-dev-authenticated', 'true')
      setTempAuthFilter(true)

      return
    }

    if (['skgas', '낳ㅁㄴ'].includes(inputValue)) {
      const token = devTokens.user.find(({ label }) => label === 'SK Gas')?.value
      if (!token) return

      await setUserInfo(token)
      navigate('/mi')
    }
  }

  // 만료된 로컬스토리지 항목 삭제 함수
  const removeExpiredLocalStorageItems = useCallback((storageKeyPrefix: string) => {
    const now = Date.now()

    // 모든 로컬스토리지 키 순회
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith(storageKeyPrefix)) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const parsed = JSON.parse(item)
            // expiresAt이 있고 만료되었으면 삭제
            const savedAtMs = typeof parsed.savedAt === 'string' ? Date.parse(parsed.savedAt) : Number.NaN
            const isExpired =
              (typeof parsed.expiresAt === 'number' && parsed.expiresAt < now) ||
              (Number.isFinite(savedAtMs) && savedAtMs + NEWSLETTER_LOCAL_DRAFT_TTL_MS < now)
            if (isExpired) {
              localStorage.removeItem(key)
            }
          }
        } catch (error) {
          // 파싱 오류가 있으면 삭제
          console.error(`Failed to parse localStorage item ${key}:`, error)
          localStorage.removeItem(key)
        }
      }
    }
  }, [])

  useEffect(() => {
    clearAuth()

    // 만료된 로컬스토리지 항목 삭제 (임시: Newsletter 관련 로컬스토리지 삭제)
    removeExpiredLocalStorageItems(NEWSLETTER_LOCAL_DRAFT_KEY_PREFIX)
    removeExpiredLocalStorageItems('newsletter_issue_draft')
  }, [clearAuth, removeExpiredLocalStorageItems])

  useEffect(() => {
    if (useExternalLogin) {
      externalAccessLogin()
    } else if (isProd) {
      ssoLogin()
    }
  }, [useExternalLogin, externalAccessLogin, isProd, ssoLogin])

  if (useExternalLogin || isProd) return null

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
                const redirectPath = localStorage.getItem('redirectAfterLogin')
                if (redirectPath) {
                  localStorage.removeItem('redirectAfterLogin')
                  navigate(redirectPath, { replace: true })
                } else {
                  navigate('/mi')
                }
              }}
              width="120px"
            >
              사용자 로그인
            </MIButton>
          </Flex>
          <Divider flexItem />
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
                const redirectPath = localStorage.getItem('redirectAfterLogin')
                if (redirectPath) {
                  localStorage.removeItem('redirectAfterLogin')
                  navigate(redirectPath, { replace: true })
                } else {
                  navigate('admin')
                }
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
                const redirectPath = localStorage.getItem('redirectAfterLogin')
                if (redirectPath) {
                  localStorage.removeItem('redirectAfterLogin')
                  navigate(redirectPath, { replace: true })
                } else {
                  navigate('admin/data-providers/providers')
                }
              }}
              width="120px"
            >
              운영자 로그인
            </MIButton>
          </Flex>
          <Divider flexItem />
          <MIButton onClick={ssoLogin} width="120px">
            SSO 로그인
          </MIButton>
          <MIButton onClick={externalAccessLogin} width="120px">
            ID / PW 로그인
          </MIButton>
        </Flex>
      ) : (
        <Flex direction="row" gap={12} align="center">
          <MIInput width="180px" label="비밀번호" type="password" value={password} onChange={handlePasswordChange} />
          <Typography component="span" variant="body2R14" color="gray.50">
            |
          </Typography>
          <MIButton onClick={ssoLogin} width="120px">
            SSO 로그인
          </MIButton>
        </Flex>
      )}
    </Flex>
  )
}

export default LoginPage
