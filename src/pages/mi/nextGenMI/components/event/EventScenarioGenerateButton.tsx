import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import { Box } from '@mui/material'
import { type SxProps, type Theme } from '@mui/material/styles'
import { type MouseEvent } from 'react'

import type { EventLinkedScenarioGroup } from '@/service/mi/nextGenMI/event'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ArrowDown from '@/components/common/icons/ArrowDown'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import EventConnectedScenarioGroupPopover from '@/pages/mi/nextGenMI/components/event/EventConnectedScenarioGroupPopover'

export interface EventScenarioGenerateButtonProps {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  onConnectedGroupContinue?: (group: EventLinkedScenarioGroup) => void
  disabled?: boolean
  disabledTooltipTitle?: string
  recommended?: boolean
  scenarioGroupCount?: number
  eventId?: number
}

type ScenarioTableButtonProps = {
  disabled?: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}

const tableButtonIconSx = {
  width: '20px',
  height: '20px',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0,
} satisfies SxProps<Theme>

const tableButtonBaseSx = {
  width: '36px',
  minWidth: '36px',
  height: '36px',
  boxSizing: 'border-box',
  position: 'relative',
  padding: 0,
  borderRadius: '8px',
  borderColor: 'transparent',
  backgroundColor: 'transparent',
  justifyContent: 'center',
  overflow: 'visible',
  transition: 'color 160ms ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '50%',
    width: '36px',
    height: '36px',
    boxSizing: 'border-box',
    border: '1px solid',
    borderColor: 'contentBorder.Normal',
    borderRadius: '8px',
    backgroundColor: 'commonColor.White',
    transform: 'translateX(-50%) scaleX(1)',
    transformOrigin: 'center',
    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), background-color 160ms ease, border-color 160ms ease',
  },
  '& > span': {
    position: 'relative',
    zIndex: 1,
  },
  '& > span > span': {
    boxSizing: 'border-box',
    width: '100%',
    padding: '0 8px 0 6px',
    transform: 'translateX(0)',
    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  '& .MuiStack-root': {
    minWidth: 0,
    overflow: 'visible',
  },
  '& .MuiTypography-root': {
    flex: '0 0 auto',
    width: 'max-content',
    minWidth: 0,
    maxWidth: 'none',
    overflow: 'visible',
    flexShrink: 0,
    opacity: 0,
    transform: 'translateX(-6px)',
    transition: 'opacity 140ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  '&:is(:hover:not(:disabled), :focus-visible)::before': {
    borderRadius: '4.3px / 8px',
    transform: 'translateX(-50%) scaleX(1.8612)',
  },
  '&:is(:hover:not(:disabled), :focus-visible) > span > span': {
    transform: 'translateX(-15.5px)',
  },
  '&:is(:hover:not(:disabled), :focus-visible) .MuiTypography-root': {
    opacity: 1,
    transform: 'translateX(0)',
    transition: 'opacity 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&::before': {
      transition: 'none',
    },
    '& > span > span': {
      transition: 'none',
    },
    '& .MuiTypography-root': {
      transition: 'none',
    },
  },
  '&.Mui-disabled': {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    color: 'contentIcon.Disabled',
  },
  '&.Mui-disabled::before': {
    borderColor: 'contentBorder.Disabled',
    backgroundColor: 'commonColor.White',
  },
} satisfies SxProps<Theme>

const ScenarioDesignButtonIcon = ({ className }: { className?: string }) => (
  <Box component="span" className={className} sx={tableButtonIconSx}>
    <AutoAwesomeRoundedIcon aria-hidden focusable="false" />
  </Box>
)

const DesignScenarioButton = ({ disabled, onClick }: ScenarioTableButtonProps) => (
  <MIBaseButton
    variant="outlined"
    disabled={disabled}
    aria-label="시나리오 설계"
    onClick={onClick}
    prefix={<ScenarioDesignButtonIcon />}
    gap="6px"
    sx={{
      ...tableButtonBaseSx,
      color: 'contentIcon.Enabled',
      '&::before': {
        ...tableButtonBaseSx['&::before'],
        borderColor: 'contentBorder.Normal',
        backgroundColor: 'commonColor.White',
      },
      '&:hover:not(:disabled), &:focus-visible': {
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        color: 'commonColor.White',
        '&::before': {
          borderColor: 'contentIcon.ActivePrimary',
          backgroundColor: 'contentIcon.ActivePrimary',
        },
      },
      '&:active:not(:disabled)': {
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        color: 'commonColor.White',
        '&::before': {
          borderColor: 'contentIcon.ActivePrimary',
          backgroundColor: 'contentIcon.ActivePrimary',
          backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(0deg, #2E3F5E, #2E3F5E)',
        },
      },
    }}
  >
    설계
  </MIBaseButton>
)

const RecommendedScenarioButton = ({ disabled, onClick }: ScenarioTableButtonProps) => (
  <MIBaseButton
    variant="outlined"
    disabled={disabled}
    aria-label="추천 시나리오 설계"
    onClick={onClick}
    prefix={<ScenarioDesignButtonIcon />}
    gap="6px"
    sx={{
      ...tableButtonBaseSx,
      color: 'mari.Primary',
      '&::before': {
        ...tableButtonBaseSx['&::before'],
        borderColor: 'mari.Primary',
        backgroundColor: 'commonColor.White',
      },
      '&:hover:not(:disabled), &:focus-visible': {
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        color: 'contentText.White',
        '&::before': {
          borderColor: 'mari.Primary',
          backgroundColor: 'mari.Primary',
        },
      },
      '&:active:not(:disabled)': {
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        color: 'contentText.White',
        '&::before': {
          borderColor: 'mari.Primary',
          backgroundColor: 'mari.Primary',
          backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(0deg, #364FC7, #364FC7)',
        },
      },
    }}
  >
    추천
  </MIBaseButton>
)

const ConnectedGroupsButton = ({
  disabled,
  count,
  open = false,
  onClick,
}: ScenarioTableButtonProps & { count: number; open?: boolean }) => (
  <MIBaseButton
    variant="outlined"
    disabled={disabled}
    aria-label={`연결된 시나리오 그룹 ${count}개`}
    aria-expanded={open}
    onClick={onClick}
    gap="0px"
    prefix={<LayersOutlinedIcon aria-hidden focusable="false" sx={{ fontSize: '16px', width: '16px', height: '16px', display: 'block' }} />}
    suffix={
      <Box
        component="span"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        width="14px"
        height="14px"
        flexShrink={0}
        sx={{
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 160ms ease',
          '& svg path': {
            fill: 'currentColor',
          },
        }}
      >
        <ArrowDown width="14px" height="14px" aria-hidden />
      </Box>
    }
    sx={{
      width: 'auto',
      minWidth: 'auto',
      height: '36px',
      padding: '6px 4px 6px 6px',
      borderRadius: '8px',
      borderColor: 'contentBorder.Normal',
      backgroundColor: 'commonColor.White',
      color: 'contentText.Normal',
      justifyContent: 'center',
      flexShrink: 0,
      '& > span': {
        width: 'auto',
        minWidth: 'auto',
      },
      '& > span > span': {
        width: 'auto',
        minWidth: 'auto',
      },
      '& .MuiStack-root': {
        flex: '0 0 auto',
        width: 'auto',
        minWidth: 'auto',
        overflow: 'visible',
      },
      '& .MuiTypography-root': {
        flex: '0 0 auto',
        width: 'auto',
        minWidth: 'auto',
        maxWidth: 'none',
        overflow: 'visible',
        textOverflow: 'clip',
        whiteSpace: 'nowrap',
      },
      '&:hover:not(:disabled), &:focus-visible': {
        borderColor: 'contentBG.Active',
        backgroundColor: 'contentBG.Active',
        color: 'contentText.Black',
      },
      '&:active:not(:disabled)': {
        borderColor: 'contentBG.Active',
        backgroundColor: 'gray.5',
        color: 'contentText.Black',
      },
      '&.Mui-disabled': {
        borderColor: 'contentBorder.Disabled',
        backgroundColor: 'contentBG.Disabled',
        color: 'contentText.Disabled',
      },
    }}
  >
    {`그룹 ${count}`}
  </MIBaseButton>
)

/** Events - 시나리오 생성 버튼 (목록 아이콘) */
const EventScenarioGenerateButton = ({
  onClick,
  onConnectedGroupContinue,
  disabled,
  disabledTooltipTitle,
  recommended,
  scenarioGroupCount = 0,
  eventId,
}: EventScenarioGenerateButtonProps) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onClick?.(e)
  }

  const connectedGroupCount = scenarioGroupCount
  const hasConnectedGroups = connectedGroupCount > 0

  const handleConnectedGroupContinue = (group: EventLinkedScenarioGroup) => {
    if (onConnectedGroupContinue) {
      onConnectedGroupContinue(group)
      return
    }
    onClick?.({} as MouseEvent<HTMLButtonElement>)
  }

  // 연결 그룹이 있으면 이벤트 단위 락/"진행" 없이 "그룹 N" + 팝오버
  if (hasConnectedGroups) {
    const connectedGroupsButton = (
      <EventConnectedScenarioGroupPopover eventId={eventId} onContinue={handleConnectedGroupContinue}>
        {({ open, onClick: openPopover }) => (
          <ConnectedGroupsButton
            disabled={disabled}
            count={connectedGroupCount}
            open={open}
            onClick={(e) => {
              e.stopPropagation()
              openPopover(e)
            }}
          />
        )}
      </EventConnectedScenarioGroupPopover>
    )

    if (disabled && disabledTooltipTitle) {
      return (
        <NextGenMIFollowCursorTooltip title={disabledTooltipTitle}>
          <Box component="span" display="inline-flex" sx={{ cursor: 'not-allowed' }}>
            {connectedGroupsButton}
          </Box>
        </NextGenMIFollowCursorTooltip>
      )
    }

    return connectedGroupsButton
  }

  const button = recommended ? (
    <RecommendedScenarioButton disabled={disabled} onClick={handleClick} />
  ) : (
    <DesignScenarioButton disabled={disabled} onClick={handleClick} />
  )

  if (disabled && disabledTooltipTitle) {
    return (
      <NextGenMIFollowCursorTooltip title={disabledTooltipTitle}>
        <Box component="span" display="inline-flex" sx={{ cursor: 'not-allowed' }}>
          {button}
        </Box>
      </NextGenMIFollowCursorTooltip>
    )
  }

  return button
}

export default EventScenarioGenerateButton
