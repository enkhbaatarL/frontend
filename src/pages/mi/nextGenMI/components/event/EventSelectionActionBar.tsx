import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box, Divider, IconButton, Stack, Typography } from '@mui/material'
import { useState } from 'react'

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
  const selectedCount = selectedEvents.length

  // 1개 이상 선택 시 하단 액션바 표시
  if (selectedCount < 1) return null

  const designCta =
    designMode === 'creating' ? (
      <SelectionDesignProgressCta locked={designLocked} designStep={designStep} onClick={onDesignClick} />
    ) : designMode === 'created' ? (
      <SelectionDesignViewCta onClick={onDesignClick} />
    ) : (
      <SelectionDesignCreateCta onClick={onDesignClick} />
    )

  return (
    <Box
      position="fixed"
      left="50%"
      bottom="145px"
      zIndex={1200}
      width="580px"
      maxWidth="calc(100vw - 48px)"
      sx={{
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
      }}
    >
      <Stack
        bgcolor="#14181F"
        borderRadius="8px"
        padding={expanded ? '12px 16px 18px' : '12px 16px'}
        boxShadow="0px 6px 12px rgba(0, 0, 0, 0.1)"
        gap={expanded ? '14px' : 0}
      >
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
            onClick={() => setExpanded((prev) => !prev)}
            sx={{
              cursor: 'pointer',
              font: 'inherit',
              appearance: 'none',
              color: 'inherit',
            }}
          >
            <Typography variant="body2SB14" color="commonColor.White" noWrap>
              {`선택한 이벤트 (${selectedCount})`}
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

          {designCta}
        </Stack>

        {expanded && (
          <>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <Stack gap="7px">
              {selectedEvents.map((event, index) => (
                <Stack key={event.eventId} direction="row" alignItems="center" justifyContent="space-between" gap="8px" minWidth={0}>
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
                    <Typography variant="body1R16" color="commonColor.White" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  )
}

export default EventSelectionActionBar
