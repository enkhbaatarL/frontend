import { CircularProgress, Stack, Typography, type TypographyProps } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { type MouseEvent, useMemo } from 'react'

import type { EventDesignStep, EventLinkedScenarioGroup, ScenarioGroupLifecycleStatus } from '@/service/mi/nextGenMI/event'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import ArrowRight from '@/components/common/icons/ArrowRight'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import { formatNextGenMIDateTimeYmdHm } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import { normalizeEventDesignStep } from '@/pages/mi/nextGenMI/components/event/eventDesignAvailability'
import nextGenMIEventService from '@/service/mi/nextGenMI/event'

export type EventLinkedScenarioGroupsExpandPanelProps = {
  eventId: number
  onView: (group: EventLinkedScenarioGroup) => void
}

const LINKED_GROUP_TABLE_COLUMNS = 'minmax(0, 660px) 180px minmax(0, 1fr) minmax(0, 1fr) 100px'

const LinkedGroupEllipsisText = ({ value, sx, ...typographyProps }: Omit<TypographyProps, 'children'> & { value: string }) => {
  const { ref, isEllipsis } = useEllipsisDetection(value)

  const typography = (
    <Typography
      ref={ref}
      {...typographyProps}
      noWrap
      sx={[
        {
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      {value}
    </Typography>
  )

  return isEllipsis ? <NextGenMIFollowCursorTooltip title={value}>{typography}</NextGenMIFollowCursorTooltip> : typography
}

const isCompletedLinkedGroup = (group: EventLinkedScenarioGroup) => {
  const status = (group.status ?? group.stage ?? '').toLowerCase() as ScenarioGroupLifecycleStatus | string
  return status === 'created' || status === 'realized'
}

const getInProgressStepNumber = (designStep?: EventDesignStep | string | null) => {
  const normalized = normalizeEventDesignStep(designStep)
  return normalized === 'step2' ? 2 : 1
}

const LinkedGroupStatusCell = ({ group }: { group: EventLinkedScenarioGroup }) => {
  if (isCompletedLinkedGroup(group)) {
    return (
      <Typography variant="body2SB14" color="mari.Primary" lineHeight={1.4} noWrap>
        완료
      </Typography>
    )
  }

  const stepNumber = getInProgressStepNumber(group.designStep)

  return (
    <Stack direction="row" alignItems="center" gap="4px" minWidth={0}>
      <MIAgentSpinner size={20} tone="gray" sx={{ flexShrink: 0, '& svg': { width: '20px', height: '20px' } }} />
      <Typography variant="body2SB14" color="contentText.Disabled" lineHeight={1.4} noWrap>
        {`${stepNumber}단계 진행중`}
      </Typography>
    </Stack>
  )
}

const sortLinkedGroupsByCreatedAtDesc = (groups: EventLinkedScenarioGroup[]) =>
  [...groups].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : Number.NaN
    const bTime = b.createdAt ? Date.parse(b.createdAt) : Number.NaN
    const aValid = Number.isFinite(aTime)
    const bValid = Number.isFinite(bTime)
    if (aValid && bValid) return bTime - aTime
    if (aValid) return -1
    if (bValid) return 1
    return (b.scenarioGroupId ?? 0) - (a.scenarioGroupId ?? 0)
  })

/** 이벤트 리스트 - 연결 시나리오 그룹 인라인 펼침 패널 */
const EventLinkedScenarioGroupsExpandPanel = ({ eventId, onView }: EventLinkedScenarioGroupsExpandPanelProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['nextGenMIEventScenarioGroups', eventId],
    queryFn: () => nextGenMIEventService.getEventScenarioGroups(eventId),
    enabled: eventId > 0,
    refetchOnWindowFocus: false,
    gcTime: 0,
    retry: 1,
  })

  const groups = useMemo(() => {
    if (isLoading || !data) return []
    return sortLinkedGroupsByCreatedAtDesc(data)
  }, [data, isLoading])

  const groupCount = groups.length
  const showLoading = isLoading && eventId > 0

  const handleView = (e: MouseEvent<HTMLElement>, group: EventLinkedScenarioGroup) => {
    e.stopPropagation()
    onView(group)
  }

  return (
    <Stack
      width="100%"
      bgcolor="gray.5"
      borderTop="1px solid"
      borderBottom="1px solid"
      borderColor="contentBorder.Active"
      padding="10px 20px"
      boxSizing="border-box"
      gap="0px"
    >
      <Stack direction="row" alignItems="center" gap="6px" padding="10px 6px" minWidth={0}>
        <Typography variant="body2M14" color="contentText.Normal" lineHeight={1} noWrap>
          {`이 이벤트가 포함된 시나리오 그룹 (${showLoading ? '-' : groupCount})`}
        </Typography>
      </Stack>

      <Stack width="100%" paddingBottom="10px" overflow="hidden">
        <Stack
          direction="row"
          alignItems="center"
          width="100%"
          padding="0 8px"
          borderBottom="0.5px solid"
          borderColor="contentBorder.Active"
          sx={{ display: 'grid', gridTemplateColumns: LINKED_GROUP_TABLE_COLUMNS }}
        >
          <Stack height="48px" justifyContent="center" padding="10px 6px" boxSizing="border-box">
            <Typography variant="body2SB14" color="contentText.Black" noWrap>
              시나리오 그룹명
            </Typography>
          </Stack>
          <Stack height="48px" justifyContent="center" padding="10px 6px" boxSizing="border-box">
            <Typography variant="body2SB14" color="contentText.Black" noWrap>
              생성자
            </Typography>
          </Stack>
          <Stack height="48px" justifyContent="center" padding="10px 6px" boxSizing="border-box">
            <Typography variant="body2SB14" color="contentText.Black" noWrap>
              생성일시
            </Typography>
          </Stack>
          <Stack height="48px" justifyContent="center" padding="10px 6px" boxSizing="border-box">
            <Typography variant="body2SB14" color="contentText.Black" noWrap>
              상태
            </Typography>
          </Stack>
          <Stack height="48px" />
        </Stack>

        {showLoading ? (
          <Stack alignItems="center" justifyContent="center" minHeight="72px">
            <CircularProgress size={20} />
          </Stack>
        ) : (
          groups.map((group, index) => {
            const isLast = index === groups.length - 1
            const title = group.title?.trim() || '시나리오 그룹'
            const creatorName = group.createdByName?.trim() || '-'

            return (
              <Stack
                key={group.scenarioGroupId}
                direction="row"
                alignItems="center"
                width="100%"
                padding="0 8px"
                borderBottom={isLast ? 'none' : '1px solid'}
                borderColor="contentBorder.Normal"
                sx={{ display: 'grid', gridTemplateColumns: LINKED_GROUP_TABLE_COLUMNS }}
              >
                <Stack minWidth={0} justifyContent="center" padding="10px 6px" boxSizing="border-box">
                  <LinkedGroupEllipsisText value={title} variant="body1SB16" color="contentText.Black" lineHeight={1.4} />
                </Stack>
                <Stack minWidth={0} justifyContent="center" padding="10px 6px" boxSizing="border-box">
                  <LinkedGroupEllipsisText value={creatorName} variant="body2M14" color="contentText.Black" />
                </Stack>
                <Stack minWidth={0} justifyContent="center" padding="10px 6px" boxSizing="border-box">
                  <Typography variant="body2M14" color="contentText.Black" noWrap>
                    {formatNextGenMIDateTimeYmdHm(group.createdAt)}
                  </Typography>
                </Stack>
                <Stack minWidth={0} justifyContent="center" padding="10px 6px" boxSizing="border-box" height="48px">
                  <LinkedGroupStatusCell group={group} />
                </Stack>
                <Stack alignItems="center" justifyContent="center" padding="10px 6px" boxSizing="border-box" height="48px">
                  <MIBaseButton
                    variant="outlined"
                    aria-label={`${title} 보기`}
                    onClick={(e) => handleView(e, group)}
                    suffix={<ArrowRight width="20px" height="20px" aria-hidden />}
                    gap="0px"
                    sx={{
                      height: '36px',
                      minWidth: 'auto',
                      padding: '6px 6px 6px 10px',
                      borderRadius: '8px',
                      borderColor: 'contentBorder.Normal',
                      backgroundColor: 'commonColor.White',
                      color: 'contentText.Normal',
                      flexShrink: 0,
                      '&:hover:not(:disabled)': {
                        borderColor: 'contentBorder.Hover',
                        backgroundColor: 'gray.5',
                        color: 'contentText.Normal',
                      },
                    }}
                  >
                    보기
                  </MIBaseButton>
                </Stack>
              </Stack>
            )
          })
        )}
      </Stack>
    </Stack>
  )
}

export default EventLinkedScenarioGroupsExpandPanel
