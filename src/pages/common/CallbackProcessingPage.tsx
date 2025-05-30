import { CircularProgress, Box } from '@mui/material'
import axios from 'axios'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const CallbackProcessingPage = () => {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  useEffect(() => {
    if (sessionId) {
      axios
        .get('/api/v1/saml2/callback', {
          params: { sessionId },
        })
        .then((res) => {
          console.log(sessionId, res)
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
