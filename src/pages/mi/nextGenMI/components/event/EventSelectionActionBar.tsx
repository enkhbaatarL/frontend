import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box, Collapse, type CollapseProps, Divider, Fade, IconButton, Slide, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { TransitionGroup } from 'react-transition-group'

import type { EventDesignStep } from '@/service/mi/nextGenMI/event'
import type { SameCombinationScenarioGroup } from '@/service/mi/nextGenMI/scenarioDesign'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import CloseIcon from '@/components/common/icons/CloseIcon'
import InfoOutlineIcon from '@/components/common/icons/InfoOutlineIcon'
import KeyboardArrowUpIcon from '@/components/common/icons/KeyboardArrowUpIcon'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { type MultiEventSelectionDesignMode, normalizeEventDesignStep } from '@/pages/mi/nextGenMI/components/event/eventDesignAvailability'
import EventSameCombinationGroupsTable from '@/pages/mi/nextGenMI/components/event/EventSameCombinationGroupsTable'

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
  designStatusLoading?: boolean
  sameCombinationGroups?: SameCombinationScenarioGroup[]
  sameCombinationGroupCount?: number
  onRemove: (eventId: number) => void
  onDesignClick: () => void
  onSameCombinationGroupView?: (group: SameCombinationScenarioGroup) => void
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
  designStatusLoading = false,
  sameCombinationGroups = [],
  sameCombinationGroupCount,
  onRemove,
  onDesignClick,
  onSameCombinationGroupView,
}: EventSelectionActionBarProps) => {
  const [sameCombinationExpanded, setSameCombinationExpanded] = useState(false)
  const [lastSelectedEvents, setLastSelectedEvents] = useState(selectedEvents)
  const selectedCount = selectedEvents.length
  const displayedEvents = selectedCount > 0 ? selectedEvents : lastSelectedEvents
  const showDesignCta = selectedCount > 0 && !designStatusLoading
  const resolvedSameCombinationCount =
    typeof sameCombinationGroupCount === 'number' && Number.isFinite(sameCombinationGroupCount)
      ? sameCombinationGroupCount
      : sameCombinationGroups.length
  const showSameCombinationNotice = selectedCount >= 2 && resolvedSameCombinationCount > 0
  const resolvedDesignCta =
    designMode === 'creating' ? (
      <SelectionDesignProgressCta locked={designLocked} designStep={designStep} onClick={onDesignClick} />
    ) : designMode === 'created' ? (
      <SelectionDesignViewCta onClick={onDesignClick} />
    ) : (
      <SelectionDesignCreateCta onClick={onDesignClick} />
    )

  useEffect(() => {
    if (selectedCount > 0) setLastSelectedEvents(selectedEvents)
  }, [selectedCount, selectedEvents])

  useEffect(() => {
    if (!showSameCombinationNotice) setSameCombinationExpanded(false)
  }, [showSameCombinationNotice])

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
        setSameCombinationExpanded(false)
        setLastSelectedEvents([])
      }}
    >
      <Box
        position="fixed"
        left="50%"
        bottom="68px"
        zIndex={1200}
        width="900px"
        maxWidth="calc(100vw - 48px)"
        sx={{
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
        }}
      >
        <Slide in={selectedCount > 0} direction="up" appear timeout={{ enter: 240, exit: 240 }}>
          <Stack
            bgcolor="commonColor.White"
            border="1px solid"
            borderColor="mari.Primary"
            borderRadius="8px"
            padding="12px 16px 18px"
            boxShadow="2px 4px 20px 0px rgba(39, 106, 207, 0.25)"
            boxSizing="border-box"
            gap="20px"
          >
            <Stack gap="14px" width="100%">
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap="12px">
                <Typography variant="body2SB14" color="contentText.Black" noWrap>
                  {`선택한 이벤트 (${displayedEvents.length}/${maxCount})`}
                </Typography>

                <Box display="flex" justifyContent="flex-end" minWidth="116px" flexShrink={0}>
                  {designStatusLoading && selectedCount > 0 ? (
                    <MIAgentSpinner size={24} tone="gray" sx={{ '& svg': { width: '24px', height: '24px' } }} />
                  ) : (
                    showDesignCta && (
                      <Fade in timeout={160}>
                        <Box display="flex">{resolvedDesignCta}</Box>
                      </Fade>
                    )
                  )}
                </Box>
              </Stack>

              <Divider sx={{ borderColor: 'contentBorder.Normal' }} />

              <Stack gap="10px">
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
                            border="1px solid"
                            borderColor="gray.70"
                            flexShrink={0}
                            boxSizing="border-box"
                          >
                            <Typography variant="body3M12" color="gray.70" lineHeight={1.4}>
                              {index + 1}
                            </Typography>
                          </Stack>
                          <Typography
                            variant="body1R16"
                            color="contentText.Black"
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
                              bgcolor: 'contentBG.Active',
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

            {showSameCombinationNotice && (
              <Stack gap="20px" width="100%">
                <Divider sx={{ borderColor: 'contentBorder.Normal' }} />
                <Stack gap="10px" width="100%">
                  <Stack
                    component="button"
                    type="button"
                    direction="row"
                    alignItems="center"
                    gap="4px"
                    border="none"
                    bgcolor="transparent"
                    padding={0}
                    width="fit-content"
                    maxWidth="100%"
                    aria-expanded={sameCombinationExpanded}
                    aria-controls="same-combination-groups"
                    onClick={() => setSameCombinationExpanded((prev) => !prev)}
                    sx={{
                      cursor: 'pointer',
                      font: 'inherit',
                      appearance: 'none',
                      color: 'mari.Primary',
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap="4px" minWidth={0}>
                      <InfoOutlineIcon
                        width="16px"
                        height="16px"
                        aria-hidden
                        focusable="false"
                        style={{ display: 'block', flexShrink: 0 }}
                      />
                      <Typography variant="breadcrumbs" color="mari.Primary" noWrap>
                        {`선택한 ${selectedCount}개 이벤트와 구성이 같은 그룹이 ${resolvedSameCombinationCount}개 있습니다`}
                      </Typography>
                    </Stack>
                    <Box
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      width="16px"
                      height="16px"
                      flexShrink={0}
                      color="mari.Primary"
                      sx={{
                        transform: sameCombinationExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform 160ms ease',
                      }}
                    >
                      <KeyboardArrowUpIcon width="16px" height="16px" aria-hidden />
                    </Box>
                  </Stack>

                  <Collapse in={sameCombinationExpanded} timeout={220} unmountOnExit sx={{ width: '100%' }}>
                    <Box id="same-combination-groups" width="100%">
                      <EventSameCombinationGroupsTable
                        groups={sameCombinationGroups}
                        loading={designStatusLoading}
                        onView={(group) => onSameCombinationGroupView?.(group)}
                      />
                    </Box>
                  </Collapse>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Slide>
      </Box>
    </Fade>
  )
}

export default EventSelectionActionBar
