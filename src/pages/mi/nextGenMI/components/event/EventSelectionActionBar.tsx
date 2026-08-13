import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box, Collapse, type CollapseProps, Divider, Fade, IconButton, Slide, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { SwitchTransition, TransitionGroup } from 'react-transition-group'

import type { EventDesignStep } from '@/service/mi/nextGenMI/event'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ArrowDown from '@/components/common/icons/ArrowDown'
import CloseIcon from '@/components/common/icons/CloseIcon'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { type MultiEventSelectionDesignMode, normalizeEventDesignStep } from '@/pages/mi/nextGenMI/components/event/eventDesignAvailability'

export type EventSelectionItem = {
  eventId: number
  eventName: string
}

export type EventSelectionActionBarProps = {
  selectedEvents: EventSelectionItem[]
  maxCount?: number
  designMode?: MultiEventSelectionDesignMode
  designLocked?: boolean
  designStep?: EventDesignStep | string | null
  onRemove: (eventId: number) => void
  onDesignClick: () => void
}

const SelectionEventListItemTransition = ({
  children,
  onEnter,
  onEntering,
  onEntered,
  onExit,
  onExiting,
  onExited,
  ...collapseProps
}: CollapseProps) => {
  const [motion, setMotion] = useState<'idle' | 'entering' | 'exiting'>('idle')

  return (
    <Collapse
      {...collapseProps}
      timeout={{ enter: 300, exit: 300 }}
      onEnter={(node, isAppearing) => {
        setMotion('entering')
        onEnter?.(node, isAppearing)
      }}
      onEntering={(node, isAppearing) => {
        node.style.transitionDuration = '150ms'
        node.style.transitionDelay = '0ms'
        onEntering?.(node, isAppearing)
      }}
      onEntered={(node, isAppearing) => {
        setMotion('idle')
        onEntered?.(node, isAppearing)
      }}
      onExit={(node) => {
        setMotion('exiting')
        onExit?.(node)
      }}
      onExiting={(node) => {
        node.style.transitionDuration = '180ms'
        node.style.transitionDelay = '120ms'
        onExiting?.(node)
      }}
      onExited={(node) => onExited?.(node)}
    >
      <Box
        paddingBottom="7px"
        sx={{
          animation:
            motion === 'entering'
              ? 'selectedEventItemEnter 180ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both'
              : motion === 'exiting'
                ? 'selectedEventItemExit 160ms ease-in both'
                : 'none',
          willChange: motion === 'idle' ? 'auto' : 'opacity, transform',
          '@keyframes selectedEventItemEnter': {
            from: { opacity: 0, transform: 'translateX(-12px)' },
            to: { opacity: 1, transform: 'translateX(0)' },
          },
          '@keyframes selectedEventItemExit': {
            from: { opacity: 1, transform: 'translateX(0)' },
            to: { opacity: 0, transform: 'translateX(-12px)' },
          },
        }}
      >
        {children}
      </Box>
    </Collapse>
  )
}

const SelectionDesignProgressCta = ({
  locked,
  designStep,
  onClick,
}: {
  locked?: boolean
  designStep?: EventDesignStep | string | null
  onClick: () => void
}) => {
  const normalizedStep = normalizeEventDesignStep(designStep)
  const stepNumber = normalizedStep === 'step2' ? 2 : 1

  return (
    <Stack
      component="button"
      type="button"
      onClick={onClick}
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
      sx={{
        cursor: 'pointer',
        font: 'inherit',
        appearance: 'none',
        color: 'contentText.Normal',
        '&:hover': {
          bgcolor: 'contentBG.Active',
        },
      }}
    >
      <Stack direction="row" alignItems="center" gap="2px">
        <Box width="26px" height="4px" borderRadius="100px" bgcolor={stepNumber === 1 ? 'mari.Primary' : '#C3CAEE'} />
        <Box width="26px" height="4px" borderRadius="100px" bgcolor={stepNumber === 2 ? 'mari.Primary' : 'gray.40'} />
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

const SelectionDesignViewCta = ({ onClick }: { onClick: () => void }) => (
  <MIBaseButton
    variant="outlined"
    aria-label="완료된 시나리오 그룹 보기"
    onClick={onClick}
    sx={{
      width: '38px',
      minWidth: '38px',
      height: '36px',
      padding: 0,
      borderRadius: '8px',
      borderColor: 'contentBorder.Normal',
      bgcolor: 'commonColor.White',
      color: 'contentIcon.Enabled',
      flexShrink: 0,
      '&:hover:not(:disabled)': {
        borderColor: 'contentBorder.Hover',
        bgcolor: 'gray.5',
        color: 'contentText.Normal',
      },
    }}
  >
    <ChevronRightRoundedIcon aria-hidden focusable="false" sx={{ fontSize: '20px' }} />
  </MIBaseButton>
)

const SelectionDesignCreateCta = ({ onClick }: { onClick: () => void }) => (
  <MIBaseButton
    variant="contained"
    onClick={onClick}
    prefix={<AutoAwesomeRoundedIcon sx={{ fontSize: '20px' }} />}
    sx={{
      height: '36px',
      minWidth: 'auto',
      padding: '8px 10px 8px 6px',
      borderRadius: '8px',
      bgcolor: 'mari.Primary',
      color: 'commonColor.White',
      flexShrink: 0,
      '&:hover:not(:disabled)': {
        bgcolor: 'mari.Primary',
        opacity: 0.92,
      },
    }}
  >
    시나리오 설계
  </MIBaseButton>
)

const EventSelectionActionBar = ({
  selectedEvents,
  maxCount = 5,
  designMode = 'designable',
  designLocked = false,
  designStep,
  onRemove,
  onDesignClick,
}: EventSelectionActionBarProps) => {
  const [expanded, setExpanded] = useState(false)
  const [lastSelectedEvents, setLastSelectedEvents] = useState(selectedEvents)
  const selectedCount = selectedEvents.length
  const displayedEvents = selectedCount > 0 ? selectedEvents : lastSelectedEvents
  const designCtaTransitionKey =
    designMode === 'creating'
      ? `${designMode}-${normalizeEventDesignStep(designStep) ?? 'step1'}-${designLocked ? 'locked' : 'unlocked'}`
      : designMode

  useEffect(() => {
    if (selectedCount > 0) setLastSelectedEvents(selectedEvents)
  }, [selectedCount, selectedEvents])

  const designCta =
    designMode === 'creating' ? (
      <SelectionDesignProgressCta locked={designLocked} designStep={designStep} onClick={onDesignClick} />
    ) : designMode === 'created' ? (
      <SelectionDesignViewCta onClick={onDesignClick} />
    ) : (
      <SelectionDesignCreateCta onClick={onDesignClick} />
    )

  return (
    <Fade
      in={selectedCount > 0}
      timeout={{ enter: 240, exit: 240 }}
      style={{
        transitionDuration: '160ms',
        transitionDelay: selectedCount > 0 ? '20ms' : '80ms',
      }}
      mountOnEnter
      unmountOnExit
      onExited={() => {
        setExpanded(false)
        setLastSelectedEvents([])
      }}
    >
      <Box
        position="fixed"
        left="50%"
        bottom="56px"
        zIndex={1200}
        width="580px"
        maxWidth="calc(100vw - 48px)"
        sx={{
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
        }}
      >
        <Slide in={selectedCount > 0} direction="up" appear timeout={{ enter: 240, exit: 240 }}>
          <Stack bgcolor="#14181F" borderRadius="8px" padding="12px 16px" boxShadow="0px 6px 12px rgba(0, 0, 0, 0.1)">
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap="12px">
              <Stack
                component="button"
                type="button"
                direction="row"
                alignItems="center"
                gap="6px"
                minWidth={0}
                border="none"
                bgcolor="transparent"
                padding={0}
                aria-expanded={expanded}
                aria-controls="selected-event-list"
                onClick={() => setExpanded((prev) => !prev)}
                sx={{
                  cursor: 'pointer',
                  font: 'inherit',
                  appearance: 'none',
                  color: 'inherit',
                }}
              >
                <Typography variant="body2SB14" color="commonColor.White" noWrap>
                  {`선택한 이벤트 (${displayedEvents.length})`}
                </Typography>
                <Stack direction="row" alignItems="center" gap="2px" flexShrink={0}>
                  <Typography variant="body2M14" color="contentText.Subtext" noWrap>
                    {`최대 ${maxCount}개 선택 가능`}
                  </Typography>
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    width="20px"
                    height="20px"
                    sx={{
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 160ms ease',
                      '& svg path': { fill: '#868E96' },
                    }}
                  >
                    <ArrowDown width="20px" height="20px" aria-hidden />
                  </Box>
                </Stack>
              </Stack>

              <SwitchTransition mode="out-in">
                <Fade key={designCtaTransitionKey} appear={false} timeout={{ enter: 160, exit: 100 }}>
                  <Box display="flex" flexShrink={0}>
                    {designCta}
                  </Box>
                </Fade>
              </SwitchTransition>
            </Stack>

            <Collapse in={expanded} timeout={220} unmountOnExit sx={{ width: '100%' }}>
              <Stack id="selected-event-list" paddingTop="14px" paddingBottom="6px" gap="14px">
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                <Stack marginBottom="-7px">
                  <TransitionGroup component={null}>
                    {displayedEvents.map((event, index) => (
                      <SelectionEventListItemTransition key={event.eventId}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap="8px" minWidth={0}>
                          <Stack direction="row" alignItems="center" gap="6px" minWidth={0} flex={1}>
                            <Stack
                              alignItems="center"
                              justifyContent="center"
                              width="20px"
                              height="20px"
                              borderRadius="8px"
                              bgcolor="gray.70"
                              flexShrink={0}
                            >
                              <Typography variant="body3M12" color="gray.30" lineHeight={1.4}>
                                {index + 1}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="body1R16"
                              color="commonColor.White"
                              noWrap
                              sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {event.eventName}
                            </Typography>
                          </Stack>
                          <IconButton
                            aria-label="선택 해제"
                            onClick={() => onRemove(event.eventId)}
                            size="small"
                            sx={{
                              width: '22px',
                              height: '22px',
                              padding: '4px',
                              borderRadius: '4px',
                              color: 'contentText.Subtext',
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                              },
                            }}
                          >
                            <CloseIcon width="20px" height="20px" aria-hidden />
                          </IconButton>
                        </Stack>
                      </SelectionEventListItemTransition>
                    ))}
                  </TransitionGroup>
                </Stack>
              </Stack>
            </Collapse>
          </Stack>
        </Slide>
      </Box>
    </Fade>
  )
}

export default EventSelectionActionBar
