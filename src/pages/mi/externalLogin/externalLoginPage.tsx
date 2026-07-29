import { Box, Typography } from '@mui/material'
import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import subtitleImg from '@/assets/Accelerate Market Intelligence with SK AI.png'
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
    } catch {
      return
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
    } catch {
      return null
    }
  }
  const clearCredentials = (): void => {
    try {
      localStorage.removeItem('external_credentials')
    } catch {
      return
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
    } catch {
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
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ backgroundColor: '#FFFFFF', userSelect: 'none' }}
    >
      <Box width="452px" display="flex" flexDirection="column" alignItems="center" gap="45px">
        <Box display="flex" flexDirection="column" alignItems="center" gap="24px">
          <Box width="52px" height="52px" display="flex" alignItems="center" justifyContent="center">
            <img src={logoImg} alt="AI Market Insights" height="52" draggable={false} />
          </Box>
          <Box width={'390px'} height={'22px'} display="flex" alignItems="center" justifyContent="center">
            <img src={subtitleImg} alt="Accelerate Market Intelligence with SK AI" height={'22'} draggable={false} />
          </Box>
        </Box>
        <Box width="100%" display="flex" flexDirection="column" gap="31px">
          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap="8px" mb="31px">
              <MIField
                label="Email"
                sx={{
                  '&': {
                    marginBottom: '4px',
                    paddingLeft: '4px',
                    paddingRight: '4px',
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
                  '&': {
                    paddingLeft: '4px',
                    paddingRight: '4px',
                  },
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
              <Box display="flex" alignItems="center" width="100%" height={'24px'} gap="2px">
                <MICheckBox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <Typography fontFamily="Pretendard" fontWeight={500} fontSize="13px" lineHeight="1.4em" color="#868E96" margin={0}>
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
                  color="#2E3F5E"
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
                서비스 이용 문의: skmiplatform@sk.com
              </Typography>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  )
}

export default ExternalLoginPage
