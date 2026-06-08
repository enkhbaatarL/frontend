import { Box, Skeleton, Stack, Typography } from '@mui/material'

import type { IScenarioBaseEvent } from '@/service/mi/nextGenMI/scenarioGroup'

import { formatNextGenMIDateTimeYmdHm } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'

interface ScenarioGroupSummarySectionProps {
  baseEvent?: IScenarioBaseEvent
  summary?: string
  loading?: boolean
}

const BaseEventCell = ({ label, value }: { label: string; value: string }) => (
  <Stack gap="4px" minWidth={0}>
    <Typography fontSize="13px" fontWeight={600} lineHeight={1.4} color="contentText.Normal" noWrap>
      {label}
    </Typography>
    <Typography variant="body1M16" color="contentText.Black" noWrap title={value}>
      {value}
    </Typography>
  </Stack>
)

const ScenarioGroupSummarySection = ({ baseEvent, summary, loading = false }: ScenarioGroupSummarySectionProps) => (
  <Stack gap="24px">
    <Stack gap="8px">
      <Typography fontSize="15px" fontWeight={700} lineHeight={1.4} color="contentText.Black">
        Base Event
      </Typography>
      {loading ? (
        <Skeleton variant="rounded" height={72} sx={{ borderRadius: '10px' }} />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            bgcolor: 'gray.5',
            borderRadius: '10px',
            padding: '20px',
          }}
        >
          <BaseEventCell label="이벤트" value={baseEvent?.eventName ?? '-'} />
          <BaseEventCell label="이벤트 유형" value={baseEvent?.eventTypeLv1Label ?? '-'} />
          <BaseEventCell label="업데이트 일시" value={formatNextGenMIDateTimeYmdHm(baseEvent?.updatedAt)} />
        </Box>
      )}
    </Stack>

    <Stack gap="8px">
      <Typography fontSize="15px" fontWeight={700} lineHeight={1.4} color="contentText.Black">
        시나리오 그룹 설명
      </Typography>
      {loading ? (
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: '10px' }} />
      ) : (
        <Box bgcolor="gray.5" borderRadius="10px" padding="20px">
          <Typography variant="body1M16" color="contentText.Black" lineHeight={1.6} sx={{ whiteSpace: 'pre-line' }}>
            {summary ?? '-'}
          </Typography>
        </Box>
      )}
    </Stack>
  </Stack>
)

export default ScenarioGroupSummarySection
