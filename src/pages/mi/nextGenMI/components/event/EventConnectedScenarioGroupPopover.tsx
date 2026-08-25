import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { CircularProgress, ClickAwayListener, Divider, Paper, Popper, Stack, Typography, type TypographyProps } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { type MouseEvent, type ReactNode, type SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react'

import type { EventDesignStep, EventLinkedScenarioGroup, ScenarioGroupLifecycleStatus } from '@/service/mi/nextGenMI/event'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import { normalizeEventDesignStep } from '@/pages/mi/nextGenMI/components/event/eventDesignAvailability'
import nextGenMIEventService from '@/service/mi/nextGenMI/event'

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
  eventId?: number
  onContinue: (group: EventLinkedScenarioGroup) => void
}

const ConnectedGroupEllipsisText = ({ value, sx, ...typographyProps }: Omit<TypographyProps, 'children'> & { value: string }) => {
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

const ConnectedGroupStepBadge = ({
  locked,
  designStep,
  onClick,
}: {
  locked?: boolean
  designStep?: EventDesignStep | string | null
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}) => {
  const normalizedStep = normalizeEventDesignStep(designStep)
  const stepNumber = normalizedStep === 'step2' ? 2 : 1

  return (
    <Stack
      component="button"
      type="button"
      aria-label={`${stepNumber}단계 시나리오 그룹으로 이동`}
      onClick={onClick}
      width="66px"
      minWidth="66px"
      maxWidth="66px"
      height="36px"
      padding="6px 5px"
      boxSizing="border-box"
      border="1px solid"
      borderColor="contentBorder.Normal"
      borderRadius="8px"
      bgcolor="commonColor.White"
      gap="4px"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      sx={{
        appearance: 'none',
        cursor: 'pointer',
        font: 'inherit',
        color: 'contentText.Normal',
        '&:hover': {
          borderColor: 'contentBorder.Hover',
          backgroundColor: 'gray.5',
        },
      }}
    >
      <Stack direction="row" alignItems="center" gap="2px">
        <Stack width="26px" height="4px" borderRadius="100px" bgcolor={stepNumber === 1 ? 'mari.Primary' : '#C3CAEE'} />
        <Stack width="26px" height="4px" borderRadius="100px" bgcolor={stepNumber === 2 ? 'mari.Primary' : 'gray.40'} />
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="center" gap="2px">
        {locked && (
          <Stack width="12px" height="12px" alignItems="center" justifyContent="center" flexShrink={0}>
            <LockOutlinedIcon width="8px" height="10.5px" aria-hidden focusable="false" color="#868E96" style={{ display: 'block' }} />
          </Stack>
        )}
        <Typography variant="body3SB12" color="contentText.Normal" lineHeight="17px" noWrap>
          {`${stepNumber}단계`}
        </Typography>
      </Stack>
    </Stack>
  )
}

const ConnectedGroupCompletedBadge = ({ onClick }: { onClick: (e: MouseEvent<HTMLButtonElement>) => void }) => (
  <MIBaseButton
    variant="outlined"
    aria-label="완료된 시나리오 그룹으로 이동"
    aria-haspopup={undefined}
    onClick={onClick}
    sx={{
      width: '38px',
      minWidth: '38px',
      height: '36px',
      padding: 0,
      boxSizing: 'border-box',
      borderColor: 'contentBorder.Normal',
      borderRadius: '8px',
      backgroundColor: 'commonColor.White',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color: 'contentIcon.Enabled',
      '&:hover:not(:disabled)': {
        borderColor: 'contentBorder.Hover',
        backgroundColor: 'gray.5',
        color: 'contentText.Normal',
      },
    }}
  >
    <ChevronRightRoundedIcon aria-hidden focusable="false" sx={{ fontSize: '20px' }} />
  </MIBaseButton>
)

const isCompletedLinkedGroup = (group: EventLinkedScenarioGroup) => {
  const status = (group.status ?? group.stage ?? '').toLowerCase() as ScenarioGroupLifecycleStatus | string
  return status === 'created' || status === 'realized'
}

const ConnectedGroupStatusCell = ({
  group,
  onClick,
}: {
  group: EventLinkedScenarioGroup
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}) => {
  if (isCompletedLinkedGroup(group)) {
    return (
      <Stack width="76px" minWidth="76px" height="36px" alignItems="center" justifyContent="center">
        <ConnectedGroupCompletedBadge onClick={onClick} />
      </Stack>
    )
  }

  return (
    <Stack width="76px" minWidth="76px" height="36px" alignItems="center" justifyContent="center">
      <ConnectedGroupStepBadge locked={group.mine === false} designStep={group.designStep} onClick={onClick} />
    </Stack>
  )
}

const EventConnectedScenarioGroupPopover = ({ children, eventId, onContinue }: EventConnectedScenarioGroupPopoverProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['nextGenMIEventScenarioGroups', eventId],
    queryFn: () => nextGenMIEventService.getEventScenarioGroups(eventId!),
    enabled: open && eventId !== undefined,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const groups = data ?? []

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

  const handleContinue = (e: MouseEvent<HTMLElement>, group: EventLinkedScenarioGroup) => {
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
            border: 0,
            boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.contentBorder.Normal}, 0px 0px 4px rgba(0, 0, 0, 0.1)`,
            overflow: 'hidden',
          }}
        >
          <ClickAwayListener onClickAway={handleClose} mouseEvent="onMouseDown" touchEvent="onTouchStart">
            <Stack>
              <Stack padding="6px 6px 0">
                <Stack direction="row" alignItems="center" justifyContent="space-between" height="40px" position="relative">
                  <Typography
                    variant="body2SB14"
                    color="contentText.Black"
                    padding="10px"
                    boxSizing="border-box"
                    lineHeight="20px"
                    noWrap
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    {`연결된 시나리오 그룹 (${groupCount})`}
                  </Typography>
                  <Typography
                    variant="body2SB14"
                    color="contentText.Black"
                    padding="10px 16px"
                    width="76px"
                    boxSizing="border-box"
                    lineHeight="20px"
                    textAlign="center"
                    flexShrink={0}
                  >
                    상태
                  </Typography>
                  <Divider
                    sx={{
                      position: 'absolute',
                      right: 0,
                      bottom: 0,
                      left: 0,
                      borderColor: 'contentBorder.Normal',
                    }}
                  />
                </Stack>

                {isLoading ? (
                  <Stack alignItems="center" justifyContent="center" minHeight="72px">
                    <CircularProgress size={20} />
                  </Stack>
                ) : isError && groupCount === 0 ? (
                  <Stack padding="12px 10px">
                    <Typography variant="body3M12" color="contentText.Subtext">
                      연결된 시나리오 그룹을 불러오지 못했습니다.
                    </Typography>
                  </Stack>
                ) : (
                  <Stack>
                    {groups.map((group) => (
                      <Stack key={group.scenarioGroupId} width="100%" padding="8px 0">
                        <Stack
                          width="100%"
                          padding="6px 0"
                          borderRadius="10px"
                          bgcolor="transparent"
                          textAlign="left"
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) 76px',
                            alignItems: 'start',
                          }}
                        >
                          <Stack minWidth={0} padding="0 10px" gap="5px">
                            <ConnectedGroupEllipsisText
                              value={group.title?.trim() || '시나리오 그룹'}
                              variant="body2SB14"
                              color="contentText.Normal"
                              lineHeight="20px"
                            />
                            <Stack gap="4px" minWidth={0}>
                              {(group.events ?? []).map((eventName, eventIndex) => (
                                <Stack
                                  key={`${group.scenarioGroupId}-${eventIndex}-${eventName}`}
                                  direction="row"
                                  alignItems="flex-start"
                                  gap="6px"
                                  minWidth={0}
                                  paddingLeft="8px"
                                >
                                  <Typography
                                    component="span"
                                    variant="body3R12"
                                    color="contentText.Normal"
                                    lineHeight="17px"
                                    flexShrink={0}
                                    aria-hidden
                                  >
                                    {'\u2022'}
                                  </Typography>
                                  <ConnectedGroupEllipsisText
                                    value={eventName}
                                    variant="body3R12"
                                    color="contentText.Normal"
                                    lineHeight="17px"
                                    sx={{ flex: 1 }}
                                  />
                                </Stack>
                              ))}
                            </Stack>
                          </Stack>
                          <ConnectedGroupStatusCell group={group} onClick={(e) => handleContinue(e, group)} />
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Stack>

              <Stack direction="row" alignItems="flex-start" gap="4px" padding="12px 16px">
                <InfoOutlinedIcon sx={{ fontSize: '16px', color: 'contentText.Subtext', flexShrink: 0, mt: '1px' }} />
                <Typography variant="body3M12" color="contentText.Subtext" lineHeight="17px">
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
