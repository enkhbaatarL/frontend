import { Box, Stack, Typography } from '@mui/material'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

interface ScenarioWorkbenchEventDetailLocationState {
  eventName?: string
}

/** 시나리오 워크벤치 이벤트 상세 — API 연동 전 임시 화면 */
const ScenarioWorkbenchEventDetailPage = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ScenarioWorkbenchEventDetailLocationState | null
  const title = state?.eventName?.trim() || `이벤트 ${eventId ?? ''}`

  return (
    <Box paddingTop="56px" paddingBottom="30px">
      <Box paddingX={7.5} boxSizing="border-box" minWidth="1440px" width="1440px" margin="auto" position="relative">
        <Typography
          color="contentText.Normal"
          variant="subtext1"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/mi/scenario-workbench')}
        >
          - Event
        </Typography>
        <Typography paddingY={4.5} color="contentText.Black" component="h1" lineHeight={1.2} variant="titleSubPage">
          {title}
        </Typography>
        <Stack gap={2} maxWidth={720}>
          <Typography variant="body1M16" color="contentText.Normal">
            상세 내용은 추후 연동 예정입니다.
          </Typography>
          <Typography variant="body2R14" color="gray.60">
            이벤트 ID: {eventId ?? '-'}
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}

export default ScenarioWorkbenchEventDetailPage
