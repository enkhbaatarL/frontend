import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useRef } from 'react'

import type { IScenarioEventBundle, IScenarioGroupEvidence } from '@/service/mi/nextGenMI/scenarioGroup'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import DocumentIcon from '@/components/common/icons/DocumentIcon'
import MIMorphingPopup, { type MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import { formatNextGenMIDateTimeYmdHm } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import ScenarioRationalePopupContent from '@/pages/mi/nextGenMI/components/common/ScenarioRationalePopupContent'

interface ScenarioGroupSummarySectionProps {
  eventBundles?: IScenarioEventBundle[]
  evidence?: IScenarioGroupEvidence | null
  summary?: string
  loading?: boolean
  onEventClick?: (eventId: number, eventName?: string) => void
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

const ScenarioGroupSummarySection = ({
  eventBundles = [],
  evidence,
  summary,
  loading = false,
  onEventClick,
}: ScenarioGroupSummarySectionProps) => {
  const evidencePopupRef = useRef<MIMorphingPopupRef>(null)
  const eventAnalysisMarkdown = evidence?.eventAnalysisMarkdown?.trim() ?? ''
  const roleSelectionMarkdown = evidence?.roleSelectionMarkdown?.trim() ?? ''
  const hasEvidence = eventAnalysisMarkdown.length > 0 || roleSelectionMarkdown.length > 0
  const rows = eventBundles
  const evidenceSections = [
    ...(eventAnalysisMarkdown ? [{ title: undefined, blocks: [{ markdown: eventAnalysisMarkdown }] }] : []),
    ...(roleSelectionMarkdown ? [{ title: undefined, blocks: [{ markdown: roleSelectionMarkdown }] }] : []),
  ]
  const evidenceContent = <ScenarioRationalePopupContent sections={evidenceSections} />

  return (
    <Stack gap="24px">
      <Stack gap="10px">
        <Stack direction="row" alignItems="center" justifyContent="space-between" minWidth={0}>
          <Typography fontSize="16px" fontWeight={700} lineHeight={1.4} color="contentText.Black">
            Base Event
          </Typography>
          {hasEvidence && (
            <MIMorphingPopup
              ref={evidencePopupRef}
              display="inline-flex"
              popup={{
                title: '도출 근거',
                content: evidenceContent,
                measureContent: evidenceContent,
                hideHeaderLine: true,
                showSkeleton: false,
              }}
            >
              <MIBaseButton
                variant="outlined"
                onClick={() => evidencePopupRef.current?.open()}
                prefix={<DocumentIcon width={20} height={20} aria-hidden focusable="false" style={{ color: '#495057' }} />}
                labelColor="contentText.Normal"
                gap="4px"
                sx={{
                  height: '36px',
                  padding: '8px 10px 8px 6px',
                  borderRadius: '8px',
                  flexShrink: 0,
                  backgroundColor: 'commonColor.White',
                  borderColor: 'contentBorder.Normal',
                  '&:hover:not(:disabled)': {
                    backgroundColor: 'commonColor.White',
                    borderColor: 'contentBorder.Hover',
                  },
                  '& .MuiTypography-root': {
                    fontWeight: 600,
                  },
                }}
              >
                근거 보기
              </MIBaseButton>
            </MIMorphingPopup>
          )}
        </Stack>
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
            {rows.length === 0 ? (
              <Stack direction="row" alignItems="center">
                <Box flex="3 1 0" maxWidth="700px" minWidth={0} boxSizing="border-box" sx={{ padding: '10px 6px' }}>
                  <Typography variant="body1M16" color="contentText.Black">
                    -
                  </Typography>
                </Box>
              </Stack>
            ) : (
              rows.map((event) => (
                <Stack key={event.eventId} direction="row" alignItems="center">
                  <Box flex="3 1 0" maxWidth="700px" minWidth={0} boxSizing="border-box" sx={{ padding: '10px 6px' }}>
                    <NextGenMIHoverLinkCell
                      value={event.eventName ?? '-'}
                      variant="body1M16"
                      ariaLabel={`${event.eventName ?? '이벤트'} 상세 보기`}
                      onClick={() => {
                        onEventClick?.(event.eventId, event.eventName)
                      }}
                    />
                  </Box>
                  <Box flex="1 1 0" minWidth={0} boxSizing="border-box" sx={{ padding: '10px 6px' }}>
                    <NextGenMITableBodyText
                      value={event.eventTypeLv1Label ?? event.eventTypeLv1 ?? '-'}
                      variant="body2M14"
                      color="contentText.Black"
                      tooltipWhenTruncated
                    />
                  </Box>
                  <Box flex="1 1 0" minWidth={0} boxSizing="border-box" sx={{ padding: '10px 6px' }}>
                    <NextGenMITableBodyText
                      value={formatNextGenMIDateTimeYmdHm(event.latestRecordFirstCreated)}
                      variant="body2M14"
                      color="contentText.Black"
                      tooltipWhenTruncated
                    />
                  </Box>
                </Stack>
              ))
            )}
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
}

export default ScenarioGroupSummarySection
