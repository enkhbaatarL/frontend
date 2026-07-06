import { Box, Skeleton, Stack, Typography } from '@mui/material'

import type { IScenarioBaseEvent } from '@/service/mi/nextGenMI/scenarioGroup'

import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import { formatNextGenMIDateTimeYmdHm } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'

interface ScenarioGroupSummarySectionProps {
  baseEvent?: IScenarioBaseEvent
  summary?: string
  loading?: boolean
  onEventClick?: () => void
}

const BaseEventHeaderCell = ({ label, fixed = false }: { label: string; fixed?: boolean }) => (
  <Typography
    flex={fixed ? '3 1 0' : '1 1 0'}
    maxWidth={fixed ? '700px' : undefined}
    minWidth={0}
    boxSizing="border-box"
    fontSize="13px"
    fontWeight={600}
    lineHeight={1.4}
    color="contentText.Black"
    noWrap
    title={label}
    sx={{ padding: '10px 6px' }}
  >
    {label}
  </Typography>
)

const ScenarioGroupSummarySection = ({ baseEvent, summary, loading = false, onEventClick }: ScenarioGroupSummarySectionProps) => (
  <Stack gap="24px">
    <Stack gap="10px">
      <Typography fontSize="16px" fontWeight={700} lineHeight={1.4} color="contentText.Black">
        Base Event
      </Typography>
      {loading ? (
        <Skeleton variant="rounded" height={80} sx={{ borderRadius: '10px' }} />
      ) : (
        <Stack
          width="100%"
          maxWidth="100%"
          minWidth={0}
          bgcolor="gray.5"
          borderRadius="10px"
          padding="16px"
          boxSizing="border-box"
          overflow="hidden"
        >
          <Stack
            direction="row"
            alignItems="center"
            height="30px"
            sx={{ borderBottom: '0.5px solid', borderColor: 'contentBorder.Active' }}
          >
            <BaseEventHeaderCell label="이벤트" fixed />
            <BaseEventHeaderCell label="이벤트 유형" />
            <BaseEventHeaderCell label="업데이트 일시" />
          </Stack>
          <Stack direction="row" alignItems="center">
            <Box flex="3 1 0" maxWidth="700px" minWidth={0} boxSizing="border-box" sx={{ padding: '10px 6px' }}>
              <NextGenMIHoverLinkCell
                value={baseEvent?.eventName ?? '-'}
                variant="body1M16"
                ariaLabel={`${baseEvent?.eventName ?? '이벤트'} 상세 보기`}
                onClick={() => {
                  onEventClick?.()
                }}
              />
            </Box>
            <Box flex="1 1 0" minWidth={0} boxSizing="border-box" sx={{ padding: '10px 6px' }}>
              <NextGenMITableBodyText
                value={baseEvent?.eventTypeLv1Label ?? '-'}
                variant="body2M14"
                color="contentText.Black"
                tooltipWhenTruncated
              />
            </Box>
            <Box flex="1 1 0" minWidth={0} boxSizing="border-box" sx={{ padding: '10px 6px' }}>
              <NextGenMITableBodyText
                value={formatNextGenMIDateTimeYmdHm(baseEvent?.updatedAt)}
                variant="body2M14"
                color="contentText.Black"
                tooltipWhenTruncated
              />
            </Box>
          </Stack>
        </Stack>
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
