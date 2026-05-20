import { Stack, Typography } from '@mui/material'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'

const ScenarioModelExecutionGeneratingState = () => (
  <Stack
    height="100%"
    alignItems="center"
    justifyContent="center"
    gap="10px"
    sx={{
      userSelect: 'none',
      transform: 'translateY(-4px)',
    }}
  >
    <MIAgentSpinner size={40} tone="gray" />
    <Stack gap="4px" alignItems="center">
      <Typography variant="body2SB14" color="contentText.Black">
        MI 수급모델 결과 생성 중...
      </Typography>
      <Typography variant="body3M12" color="contentText.Subtext">
        잠시 기다려 주세요.
      </Typography>
    </Stack>
  </Stack>
)

export default ScenarioModelExecutionGeneratingState
