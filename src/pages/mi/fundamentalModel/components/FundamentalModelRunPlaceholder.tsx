import { Box, Stack, Typography } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ErrorIcon from '@/components/common/icons/ErrorIcon'
import PendingClockIcon from '@/components/common/icons/PendingClockIcon'
import LoadingSpinner from '@/components/common/influence-factor-chart/icons/LoadingSpinIcon'

/** 본 페이지 우측 본문 자리표시자 모드 */
export type FundamentalModelRunPlaceholderMode = 'pending' | 'running' | 'error'

export interface FundamentalModelRunPlaceholderProps {
  /** 표시할 자리표시자 모드 */
  mode: FundamentalModelRunPlaceholderMode
  /** 대기 상태 - 실행 버튼 클릭 */
  onRun?: () => void
  /** 실패 상태 - 재실행 버튼 클릭 */
  onRetry?: () => void
  /** 실행 요청 접수 중 */
  runActionDisabled?: boolean
}

/** 대기/실행중/실패 자리표시자 컨테이너 공통 sx */
const containerSx = {
  flex: 1,
  width: '100%',
  alignSelf: 'stretch',
  minHeight: 480,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '24px',
  py: '40px',
  boxSizing: 'border-box',
} as const

/** 본문 중앙 정렬용 내부 스택 */
const contentStackSx = {
  position: 'absolute',
  top: '180px',
  left: '50%',
  transform: 'translateX(-50%)',
  justifyContent: 'center',
  alignItems: 'center',
} as const

/** 본 페이지 우측 본문 자리표시자 (대기 - 실행중 - 실패) */
const FundamentalModelRunPlaceholder = ({ mode, onRun, onRetry, runActionDisabled = false }: FundamentalModelRunPlaceholderProps) => {
  if (mode === 'running') {
    return (
      <Box sx={containerSx}>
        <Stack sx={contentStackSx} gap="20px">
          <LoadingSpinner size={64} color="rgba(0, 0, 0, 0.15)" speed={1.2} />
          <Stack alignItems="center" gap="8px" sx={{ width: '100%' }}>
            <Typography sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1.4, color: 'gray.90', textAlign: 'center' }}>
              수급 모델 실행 중...
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 400, lineHeight: 1.4, color: 'gray.70', textAlign: 'center' }}>
              잠시 기다려 주세요.
            </Typography>
          </Stack>
        </Stack>
      </Box>
    )
  }

  if (mode === 'error') {
    return (
      <Box sx={containerSx}>
        <Stack sx={contentStackSx} gap="20px">
          <ErrorIcon />
          <Stack alignItems="center" gap="8px" sx={{ width: '100%', maxWidth: 520, mx: 'auto' }}>
            <Typography sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1.4, color: 'gray.90', textAlign: 'center', width: '100%' }}>
              Error
            </Typography>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.4,
                color: 'gray.70',
                textAlign: 'center',
                whiteSpace: 'pre-line',
                width: '100%',
              }}
            >
              {'실행에 실패했습니다.\n잠시 후 다시 시도하시거나 재실행 버튼을 눌러주세요.'}
            </Typography>
          </Stack>
          <MIBaseButton variant="contained" disabled={runActionDisabled} onClick={onRetry} sx={{ py: '10px', px: '16px' }}>
            재실행
          </MIBaseButton>
        </Stack>
      </Box>
    )
  }

  // pending
  return (
    <Box sx={containerSx}>
      <Stack sx={contentStackSx} gap="20px">
        <PendingClockIcon />
        <Stack alignItems="center" gap="8px" sx={{ width: '100%' }}>
          <Typography sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1.4, color: 'gray.90', textAlign: 'center' }}>
            실행 대기 중
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 400, lineHeight: 1.4, color: 'gray.70', textAlign: 'center' }}>
            실행 버튼을 눌러 시작하세요.
          </Typography>
        </Stack>
        <MIBaseButton variant="contained" disabled={runActionDisabled} onClick={onRun} sx={{ py: '10px', px: '16px' }}>
          실행
        </MIBaseButton>
      </Stack>
    </Box>
  )
}

export default FundamentalModelRunPlaceholder
