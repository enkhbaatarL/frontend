import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { CircularProgress, ClickAwayListener, Divider, Paper, Popper, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { type MouseEvent, type ReactNode, type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { EventConnectedScenarioGroup, EventDesignStep, EventScenarioDesignStatus } from '@/service/mi/nextGenMI/event'
import type { IScenarioBaseEvent } from '@/service/mi/nextGenMI/scenarioGroup'

import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import {
  isEventDesignOccupiedByOther,
  normalizeEventDesignStep,
  normalizeEventScenarioDesignStatus,
} from '@/pages/mi/nextGenMI/components/event/eventDesignAvailability'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

const POPOVER_POPPER_MODIFIERS = [
  {
    name: 'offset',
    options: {
      offset: [0, 8],
    },
  },
  {
    name: 'flip',
    options: {
      fallbackPlacements: ['top-end'],
    },
  },
  {
    name: 'preventOverflow',
    options: {
      rootBoundary: 'viewport',
      padding: 8,
    },
  },
]

type ExclusiveCloseFn = () => void

let activeExclusiveClose: ExclusiveCloseFn | null = null

/** 이벤트 행 팝오버는 동시에 1개만 연다 */
const claimExclusivePopover = (close: ExclusiveCloseFn) => {
  if (activeExclusiveClose && activeExclusiveClose !== close) {
    const previousClose = activeExclusiveClose
    activeExclusiveClose = close
    previousClose()
    return
  }
  activeExclusiveClose = close
}

const releaseExclusivePopover = (close: ExclusiveCloseFn) => {
  if (activeExclusiveClose === close) {
    activeExclusiveClose = null
  }
}

export type EventConnectedScenarioGroupPopoverProps = {
  children: (params: { open: boolean; onClick: (e: MouseEvent<HTMLElement>) => void }) => ReactNode
  /** 다중 연결 그룹 (있으면 우선 사용) */
  connectedScenarioGroups?: EventConnectedScenarioGroup[]
  scenarioGroupId?: number | null
  eventId?: number
  eventName?: string
  designStep?: EventDesignStep | string | null
  scenarioDesignStatus?: EventScenarioDesignStatus | string | null
  occupied?: boolean
  occupantUserId?: number | null
  occupantUserName?: string | null
  currentUserNo?: number | null
  onContinue: (group: EventConnectedScenarioGroup) => void
}

const ConnectedGroupStepBadge = ({ locked, designStep }: { locked?: boolean; designStep?: EventDesignStep | string | null }) => {
  const normalizedStep = normalizeEventDesignStep(designStep)
  const stepNumber = normalizedStep === 'step2' ? 2 : 1

  return (
    <Stack
      height="36px"
      padding="6px"
      borderRadius="8px"
      border="1px solid"
      borderColor="contentBorder.Normal"
      bgcolor="commonColor.White"
      gap="4px"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Stack direction="row" alignItems="center" gap="2px">
        <Stack width="26px" height="4px" borderRadius="100px" bgcolor={stepNumber === 1 ? 'mari.Primary' : '#C3CAEE'} />
        <Stack width="26px" height="4px" borderRadius="100px" bgcolor={stepNumber === 2 ? 'mari.Primary' : 'gray.40'} />
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="center" gap="2px">
        {locked && (
          <LockOutlinedIcon
            width="8px"
            height="12px"
            aria-hidden
            focusable="false"
            color="#868E96"
            style={{ display: 'block', flexShrink: 0 }}
          />
        )}
        <Typography variant="body3SB12" color="contentText.Normal" lineHeight={1.4} noWrap>
          {`${stepNumber}단계`}
        </Typography>
      </Stack>
    </Stack>
  )
}

const ConnectedGroupCompletedBadge = () => (
  <Stack
    width="38px"
    height="36px"
    alignItems="center"
    justifyContent="center"
    borderRadius="8px"
    border="1px solid"
    borderColor="contentBorder.Normal"
    bgcolor="commonColor.White"
    flexShrink={0}
    color="contentIcon.Enabled"
  >
    <ChevronRightRoundedIcon aria-hidden focusable="false" sx={{ fontSize: '20px' }} />
  </Stack>
)

const ConnectedGroupStatusCell = ({ group, currentUserNo }: { group: EventConnectedScenarioGroup; currentUserNo?: number | null }) => {
  const status = normalizeEventScenarioDesignStatus(group.scenarioDesignStatus)
  if (status === 'created') {
    return <ConnectedGroupCompletedBadge />
  }

  const locked = isEventDesignOccupiedByOther(
    {
      scenarioDesignStatus: status ?? 'creating',
      occupied: group.occupied,
      occupantUserId: group.occupantUserId,
      occupantUserName: group.occupantUserName,
    },
    currentUserNo,
  )

  return <ConnectedGroupStepBadge locked={locked} designStep={group.designStep} />
}

const EventConnectedScenarioGroupPopover = ({
  children,
  connectedScenarioGroups,
  scenarioGroupId,
  eventId,
  eventName,
  designStep,
  scenarioDesignStatus,
  occupied,
  occupantUserId,
  occupantUserName,
  currentUserNo,
  onContinue,
}: EventConnectedScenarioGroupPopoverProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)
  const hasProvidedGroups = (connectedScenarioGroups?.length ?? 0) > 0
  const fallbackGroupId = scenarioGroupId ?? null

  const { data, isLoading, isError } = useQuery({
    queryKey: ['nextGenMIEventConnectedScenarioGroup', fallbackGroupId],
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroupDetail(fallbackGroupId!),
    enabled: open && !hasProvidedGroups && fallbackGroupId !== null,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const groups = useMemo((): EventConnectedScenarioGroup[] => {
    if (hasProvidedGroups) return connectedScenarioGroups ?? []

    const events: IScenarioBaseEvent[] = []
    if (data?.baseEvent) events.push(data.baseEvent)

    const currentName = eventName?.trim()
    if (currentName && eventId !== undefined && !events.some((item) => item.eventId === eventId)) {
      events.push({
        eventId,
        eventName: currentName,
        eventTypeLv1: '',
        eventTypeLv1Label: '',
        updatedAt: '',
      })
    }

    if (events.length === 0 && currentName && eventId !== undefined) {
      events.push({
        eventId,
        eventName: currentName,
        eventTypeLv1: '',
        eventTypeLv1Label: '',
        updatedAt: '',
      })
    }

    if (fallbackGroupId === null && events.length === 0) return []

    return [
      {
        scenarioGroupId: fallbackGroupId ?? 0,
        groupName: data?.groupName?.trim() || eventName?.trim() || '시나리오 그룹',
        designStep,
        scenarioDesignStatus,
        occupied,
        occupantUserId,
        occupantUserName,
        events: events.map((event) => ({ eventId: event.eventId, eventName: event.eventName })),
      },
    ]
  }, [
    connectedScenarioGroups,
    data?.baseEvent,
    data?.groupName,
    designStep,
    eventId,
    eventName,
    fallbackGroupId,
    hasProvidedGroups,
    occupied,
    occupantUserId,
    occupantUserName,
    scenarioDesignStatus,
  ])

  const groupCount = groups.length
  const anchorElRef = useRef<HTMLElement | null>(null)
  anchorElRef.current = anchorEl

  // exclusive registry용 안정 참조 (MIMenu click-away와 같이 mousedown 1회로 닫힘)
  const exclusiveCloseRef = useRef<() => void>(() => undefined)
  const exclusiveClose = useCallback(() => {
    exclusiveCloseRef.current()
  }, [])

  exclusiveCloseRef.current = () => {
    setAnchorEl(null)
    releaseExclusivePopover(exclusiveClose)
  }

  useEffect(
    () => () => {
      releaseExclusivePopover(exclusiveClose)
    },
    [exclusiveClose],
  )

  const handleClose = useCallback(
    (event?: Event | SyntheticEvent) => {
      if (event && anchorElRef.current?.contains(event.target as Node)) return
      exclusiveClose()
    },
    [exclusiveClose],
  )

  const handleToggle = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()

    if (anchorElRef.current) {
      exclusiveClose()
      return
    }

    claimExclusivePopover(exclusiveClose)
    setAnchorEl(e.currentTarget)
  }

  const handleContinue = (e: MouseEvent<HTMLElement>, group: EventConnectedScenarioGroup) => {
    e.stopPropagation()
    exclusiveClose()
    onContinue(group)
  }

  return (
    <>
      {children({ open, onClick: handleToggle })}
      <Popper open={open} anchorEl={anchorEl} placement="bottom-end" modifiers={POPOVER_POPPER_MODIFIERS} style={{ zIndex: 1300 }}>
        <Paper
          elevation={0}
          onClick={(e) => e.stopPropagation()}
          sx={{
            width: '400px',
            padding: 0,
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'contentBorder.Normal',
            boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <ClickAwayListener onClickAway={handleClose} mouseEvent="onMouseDown" touchEvent="onTouchStart">
            <Stack>
              <Stack padding="6px 6px 0">
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  borderBottom="1px solid"
                  borderColor="contentBorder.Normal"
                >
                  <Typography variant="body2SB14" color="contentText.Black" padding="10px" noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {`연결된 시나리오 그룹 (${groupCount})`}
                  </Typography>
                  <Typography
                    variant="body2SB14"
                    color="contentText.Black"
                    padding="10px 16px"
                    width="76px"
                    textAlign="center"
                    flexShrink={0}
                  >
                    상태
                  </Typography>
                </Stack>

                {isLoading && !hasProvidedGroups ? (
                  <Stack alignItems="center" justifyContent="center" minHeight="72px">
                    <CircularProgress size={20} />
                  </Stack>
                ) : isError && !hasProvidedGroups && groupCount === 0 ? (
                  <Stack padding="12px 10px">
                    <Typography variant="body3M12" color="contentText.Subtext">
                      연결된 시나리오 그룹을 불러오지 못했습니다.
                    </Typography>
                  </Stack>
                ) : (
                  <Stack>
                    {groups.map((group) => (
                      <Stack
                        key={group.scenarioGroupId}
                        component="button"
                        type="button"
                        onClick={(e) => handleContinue(e, group)}
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        gap="8px"
                        width="100%"
                        padding="14px 10px 14px"
                        border="none"
                        bgcolor="transparent"
                        textAlign="left"
                        sx={{
                          cursor: 'pointer',
                          font: 'inherit',
                          appearance: 'none',
                          '&:hover': {
                            bgcolor: 'contentBG.Hover',
                          },
                        }}
                      >
                        <Stack flex={1} minWidth={0} gap="5px">
                          <Typography
                            variant="body2SB14"
                            color="contentText.Normal"
                            noWrap
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {group.groupName}
                          </Typography>
                          <Stack gap="4px" minWidth={0}>
                            {group.events.map((event, eventIndex) => (
                              <Stack
                                key={`${group.scenarioGroupId}-${event.eventId}-${eventIndex}`}
                                direction="row"
                                alignItems="flex-start"
                                gap="6px"
                                minWidth={0}
                              >
                                <Typography
                                  component="span"
                                  variant="body3R12"
                                  color="contentText.Normal"
                                  lineHeight={1.4}
                                  flexShrink={0}
                                  aria-hidden
                                >
                                  {'\u2022'}
                                </Typography>
                                <Typography
                                  variant="body3R12"
                                  color="contentText.Normal"
                                  lineHeight={1.4}
                                  noWrap
                                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}
                                >
                                  {event.eventName}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </Stack>
                        <ConnectedGroupStatusCell group={group} currentUserNo={currentUserNo} />
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Stack>

              <Divider sx={{ borderColor: 'contentBorder.Normal' }} />
              <Stack direction="row" alignItems="flex-start" gap="4px" padding="12px 16px">
                <InfoOutlinedIcon sx={{ fontSize: '16px', color: 'contentText.Subtext', flexShrink: 0, mt: '1px' }} />
                <Typography variant="body3M12" color="contentText.Subtext" lineHeight={1.4}>
                  선택한 이벤트와 연결된 시나리오 그룹입니다.
                </Typography>
              </Stack>
            </Stack>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </>
  )
}

export default EventConnectedScenarioGroupPopover
