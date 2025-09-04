import { Box, Typography } from '@mui/material'
import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import logoImg from '@/assets/logo.svg'
import MIButton from '@/components/common/button/MIButton'
import MICheckBox from '@/components/common/input/MICheckBox'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import authService from '@/service/common/auth'
import { simpleEncrypt, simpleDecrypt } from '@/utils/encryption'

interface ICredentials {
  email: string
  password: string
}

const ENCRYPTION_KEY = 'external-login'

const ExternalLoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const navigate = useNavigate()

  const validateForm = () => {
    if (!/\S+@\S+\.\S+/.test(email) || password.length < 6) {
      setErrorMessage('이메일과 비밀번호를 확인하세요.')
      return false
    }

    setErrorMessage('')
    return true
  }

  const saveCredentials = (credentials: ICredentials): void => {
    try {
      const encryptedCredentials = simpleEncrypt(JSON.stringify(credentials), ENCRYPTION_KEY)
      localStorage.setItem('external_credentials', encryptedCredentials)
    } catch (error) {
      console.error('Failed to save credentials:', error)
    }
  }

  const getCredentials = (): { email: string; password: string } | null => {
    try {
      const encryptedCredentials = localStorage.getItem('external_credentials')

      if (!encryptedCredentials) {
        return null
      }

      const decryptedString = simpleDecrypt(encryptedCredentials, ENCRYPTION_KEY)

      if (!decryptedString) {
        return null
      }

      const credentialsData = JSON.parse(decryptedString) as ICredentials

      if (!credentialsData?.email || !credentialsData?.password) {
        return null
      }

      return credentialsData
    } catch (error) {
      console.error('Failed to get credentials:', error)
      return null
    }
  }
  const clearCredentials = (): void => {
    try {
      localStorage.removeItem('external_credentials')
    } catch (error) {
      console.error('Failed to clear credentials:', error)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const { sessionId } = await authService.postExternalLogin({ loginId: email, password })

      if (rememberMe) {
        saveCredentials({ email, password })
      } else {
        clearCredentials()
      }

      navigate(`/callback?sessionId=${sessionId}&isExternalLogin=true`)
    } catch (error) {
      console.error('Login failed:', error)
      setErrorMessage('이메일과 비밀번호를 확인하세요.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const savedCredentials = getCredentials()
    if (savedCredentials) {
      setEmail(savedCredentials.email)
      setPassword(savedCredentials.password)
      setRememberMe(true)
    }
  }, [])

  return (
    <Box width="100vw" height="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ backgroundColor: '#FFFFFF' }}>
      <Box width="452px" display="flex" flexDirection="column" alignItems="center" gap="45px">
        <Box display="flex" flexDirection="column" alignItems="center" gap="24px">
          <Box width="52px" height="52px" display="flex" alignItems="center" justifyContent="center">
            <img src={logoImg} alt="AI Market Insights" height="52" />
          </Box>
          <Typography
            fontFamily="'Source Serif Pro', serif"
            fontSize="22px"
            lineHeight="1em"
            color="#495057"
            fontStyle="italic"
            margin={0}
            sx={{
              letterSpacing: '0.5px',
              wordSpacing: '-6px',
            }}
          >
            Accelerate Market Intelligence with SK AI
          </Typography>
        </Box>
        <Box width="100%" display="flex" flexDirection="column" gap="31px">
          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap="8px" mb="31px">
              <MIField
                label="Email"
                sx={{
                  '&': {
                    marginBottom: '4px',
                  },
                  '& .MuiBox-root:first-of-type': {
                    paddingBottom: '2px',
                  },
                }}
              >
                <MIInput
                  type="email"
                  placeholder="Enter an email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errorMessage) {
                      setErrorMessage('')
                    }
                  }}
                  size="h36"
                />
              </MIField>

              <MIField
                label="Password"
                sx={{
                  '& .MuiBox-root:first-of-type': {
                    paddingBottom: '2px',
                  },
                }}
              >
                <MIInput
                  type="password"
                  placeholder="Enter a password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errorMessage) {
                      setErrorMessage('')
                    }
                  }}
                  size="h36"
                  showPasswordToggle
                />
              </MIField>
              <Box display="flex" alignItems="center" gap="8px" width="100%" pl="4px">
                <MICheckBox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <Typography fontFamily="Pretendard" fontWeight={400} fontSize="13px" lineHeight="1.4em" color="#868E96" margin={0}>
                  Remember me
                </Typography>
              </Box>
              {errorMessage && (
                <Box display="flex" alignItems="center" gap="10px" width="100%" pl="4px">
                  <Typography fontFamily="Pretendard" fontWeight={400} fontSize="12px" lineHeight="1.4em" color="#F03E3E" margin={0}>
                    {errorMessage}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box display="flex" flexDirection="column" alignItems="center" gap="16px" width="100%">
              <Box width={'100%'} sx={{ '& > span': { width: '100%' } }}>
                <MIButton
                  type="filled"
                  size="h42"
                  color="#363434"
                  width="100%"
                  disabled={isLoading || !email || !password}
                  onClick={handleSubmit}
                >
                  Sign in
                </MIButton>
              </Box>
              <Typography
                fontFamily="Pretendard"
                fontWeight={400}
                fontSize="13px"
                lineHeight="1.4em"
                color="#495057"
                textAlign="center"
                width="320px"
                margin={0}
              >
                서비스 이용 문의: mi@sk.com
              </Typography>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  )
}

export default ExternalLoginPage
