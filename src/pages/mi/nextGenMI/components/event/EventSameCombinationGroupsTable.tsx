import { CircularProgress, Stack, Typography, type TypographyProps } from '@mui/material'
import { useMemo } from 'react'

import type { SameCombinationScenarioGroup } from '@/service/mi/nextGenMI/scenarioDesign'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import LoadingIcon from '@/components/common/icons/LoadingIcon'
import MISpinner from '@/components/common/spinner/MISpinner'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import { formatNextGenMIDateTimeYmdHm } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import {
  isSameCombinationGroupCompleted,
  isSameCombinationGroupInProgress,
  normalizeEventDesignStep,
} from '@/pages/mi/nextGenMI/components/event/eventDesignAvailability'

export type EventSameCombinationGroupsTableProps = {
  groups: SameCombinationScenarioGroup[]
  loading?: boolean
  onView: (group: SameCombinationScenarioGroup) => void
}

/** 액션바 동일 조합 테이블: 헤더 + 최대 5행, 초과 시 세로만 내부 스크롤 */
const SAME_COMBINATION_TABLE_COLUMNS = 'minmax(0, 1fr) minmax(0, 80px) 160px minmax(0, 128px)'
const SAME_COMBINATION_MAX_VISIBLE_ROWS = 5
const SAME_COMBINATION_ROW_HEIGHT_PX = 48

const sameCombinationRowSx = {
  display: 'grid',
  gridTemplateColumns: SAME_COMBINATION_TABLE_COLUMNS,
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
} as const

const EllipsisText = ({ value, sx, ...typographyProps }: Omit<TypographyProps, 'children'> & { value: string }) => {
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

const getInProgressStepNumber = (group: SameCombinationScenarioGroup) => {
  const normalized = normalizeEventDesignStep(group.designStep)
  return normalized === 'step2' ? 2 : 1
}

const SameCombinationStatusCell = ({ group }: { group: SameCombinationScenarioGroup }) => {
  if (isSameCombinationGroupCompleted(group)) {
    return (
      <Typography variant="body2SB14" color="mari.Primary" lineHeight={1.4} noWrap>
        완료
      </Typography>
    )
  }

  if (isSameCombinationGroupInProgress(group)) {
    const stepNumber = getInProgressStepNumber(group)
    return (
      <Stack direction="row" alignItems="center" gap="4px" minWidth={0}>
        <MISpinner
          size={20}
          speed={0.55}
          sx={(theme) => ({
            flexShrink: 0,
            '& svg path': {
              fill: `${theme.palette.contentIcon.Disabled} !important`,
            },
          })}
        >
          <LoadingIcon width="20px" height="20px" />
        </MISpinner>
        <Typography variant="body2SB14" color="contentText.Disabled" lineHeight={1.4} noWrap>
          {`${stepNumber}단계 진행중`}
        </Typography>
      </Stack>
    )
  }

  const statusLabel = group.statusLabel?.trim()
  return (
    <Typography variant="body2SB14" color="contentText.Normal" lineHeight={1.4} noWrap>
      {statusLabel || '-'}
    </Typography>
  )
}

const sortGroupsByCreatedAtDesc = (groups: SameCombinationScenarioGroup[]) =>
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

const EventSameCombinationGroupsTable = ({ groups, loading = false, onView }: EventSameCombinationGroupsTableProps) => {
  const sortedGroups = useMemo(() => sortGroupsByCreatedAtDesc(groups), [groups])
  const bodyMaxHeight = SAME_COMBINATION_MAX_VISIBLE_ROWS * SAME_COMBINATION_ROW_HEIGHT_PX

  const header = (
    <Stack
      padding="0 20px 0 8px"
      borderBottom="0.5px solid"
      borderColor="contentBorder.Active"
      bgcolor="gray.5"
      flexShrink={0}
      sx={sameCombinationRowSx}
    >
      <Stack minWidth={0} height="48px" justifyContent="center" padding="10px 6px" boxSizing="border-box">
        <Typography variant="body2SB14" color="contentText.Black" noWrap>
          시나리오 그룹명
        </Typography>
      </Stack>
      <Stack minWidth={0} height="48px" justifyContent="center" padding="10px 6px" boxSizing="border-box">
        <Typography variant="body2SB14" color="contentText.Black" noWrap>
          생성자
        </Typography>
      </Stack>
      <Stack minWidth={0} height="48px" justifyContent="center" padding="10px 6px" boxSizing="border-box">
        <Typography variant="body2SB14" color="contentText.Black" noWrap>
          생성일시
        </Typography>
      </Stack>
      <Stack minWidth={0} height="48px" justifyContent="center" padding="10px 6px" boxSizing="border-box">
        <Typography variant="body2SB14" color="contentText.Black" noWrap>
          상태
        </Typography>
      </Stack>
    </Stack>
  )

  return (
    <Stack
      width="100%"
      minWidth={0}
      bgcolor="gray.5"
      border="1px solid"
      borderColor="contentBorder.Normal"
      borderRadius="8px"
      overflow="hidden"
      boxSizing="border-box"
    >
      {header}
      {loading ? (
        <Stack alignItems="center" justifyContent="center" minHeight="72px">
          <CircularProgress size={20} />
        </Stack>
      ) : (
        <ScrollWrapper
          maxHeight={`${bodyMaxHeight}px`}
          scrollbarGap={12}
          thumbInsetTop={6}
          thumbInsetBottom={6}
          reserveScrollbarGap
          showScrollbarOnHover
          overscrollBehavior="none"
        >
          {sortedGroups.map((group, index) => {
            const isLast = index === sortedGroups.length - 1
            const title = group.title?.trim() || '시나리오 그룹'
            const creatorName = group.creatorName?.trim() || group.createdByName?.trim() || '-'

            return (
              <Stack
                key={group.scenarioGroupId}
                padding="0 8px"
                borderBottom={isLast ? 'none' : '1px solid'}
                borderColor="contentBorder.Normal"
                flexShrink={0}
                sx={sameCombinationRowSx}
              >
                <Stack minWidth={0} justifyContent="center" padding="10px 6px" boxSizing="border-box" height="48px">
                  <NextGenMIHoverLinkCell value={title} ariaLabel={`${title} 보기`} onClick={() => onView(group)} />
                </Stack>
                <Stack minWidth={0} justifyContent="center" padding="10px 6px" boxSizing="border-box" height="48px">
                  <EllipsisText value={creatorName} variant="body2M14" color="contentText.Black" />
                </Stack>
                <Stack minWidth={0} justifyContent="center" padding="10px 6px" boxSizing="border-box" height="48px">
                  <Typography variant="body2M14" color="contentText.Black" whiteSpace="nowrap">
                    {formatNextGenMIDateTimeYmdHm(group.createdAt)}
                  </Typography>
                </Stack>
                <Stack minWidth={0} overflow="hidden" justifyContent="center" padding="10px 6px" boxSizing="border-box" height="48px">
                  <SameCombinationStatusCell group={group} />
                </Stack>
              </Stack>
            )
          })}
        </ScrollWrapper>
      )}
    </Stack>
  )
}

export default EventSameCombinationGroupsTable
