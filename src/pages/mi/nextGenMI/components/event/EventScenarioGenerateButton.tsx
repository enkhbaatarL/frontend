import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box, Stack, Typography } from '@mui/material'
import { keyframes, type SxProps, type Theme } from '@mui/material/styles'
import { type MouseEvent } from 'react'

import type { EventDesignStep } from '@/service/mi/nextGenMI/event'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import { getEventDesignStepTooltipTitle, normalizeEventDesignStep } from '@/pages/mi/nextGenMI/components/event/eventDesignAvailability'

export interface EventScenarioGenerateButtonProps {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  disabledTooltipTitle?: string
  recommended?: boolean
  scenarioAvailable?: boolean
  designing?: boolean
  designingLocked?: boolean
  designingAlwaysExpanded?: boolean
  designStep?: EventDesignStep | string | null
  designStepLabel?: string | null
}

type ScenarioTableButtonProps = {
  disabled?: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}

type ScenarioDesigningButtonProps = ScenarioTableButtonProps & {
  recommended?: boolean
  locked?: boolean
  alwaysExpanded?: boolean
  designStep?: EventDesignStep | string | null
  designStepLabel?: string | null
}

const scenarioDesignStepPulseAnimation = keyframes`
  0%, 100% {
    background-color: #9AA7E3;
  }

  35%, 75% {
    background-color: #364FC7;
  }
`

const scenarioDesignStepPulseSx = {
  animation: `${scenarioDesignStepPulseAnimation} 1.8s linear infinite 1.6s`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
} satisfies SxProps<Theme>

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

const ScenarioViewButtonIcon = () => (
  <Box component="span" sx={tableButtonIconSx}>
    <ChevronRightRoundedIcon aria-hidden focusable="false" sx={{ width: '100%', height: '100%', fontSize: '20px' }} />
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

const ViewScenarioButton = ({ disabled, onClick }: ScenarioTableButtonProps) => (
  <MIBaseButton
    variant="outlined"
    disabled={disabled}
    aria-label="시나리오 보기"
    onClick={onClick}
    prefix={<ScenarioViewButtonIcon />}
    gap="0px"
    sx={{
      ...tableButtonBaseSx,
      color: 'contentIcon.Enabled',
      '&::before': {
        ...tableButtonBaseSx['&::before'],
        borderColor: 'contentBorder.Normal',
        backgroundColor: 'commonColor.White',
      },
      '& > span > span': {
        boxSizing: 'border-box',
        width: '100%',
        padding: '0 5px',
        transform: 'translateX(3px)',
        transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
      '&:is(:hover:not(:disabled), :focus-visible)::before': {
        borderRadius: '4.3px / 8px',
        transform: 'translateX(-50%) scaleX(1.6667)',
      },
      '&:is(:hover:not(:disabled), :focus-visible) > span > span': {
        transform: 'translateX(-14px)',
      },
      '&:hover:not(:disabled), &:focus-visible': {
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        color: 'contentText.Normal',
        '&::before': {
          borderColor: 'contentBorder.Hover',
          backgroundColor: 'gray.5',
        },
      },
      '&:active:not(:disabled)': {
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        color: 'contentText.Black',
        '&::before': {
          borderColor: 'contentBorder.Active',
          backgroundColor: 'gray.5',
        },
      },
    }}
  >
    보기
  </MIBaseButton>
)

const ScenarioDesignStepBar = ({ active, done }: { active?: boolean; done?: boolean }) => (
  <Box
    component="span"
    width="26px"
    height="4px"
    borderRadius="100px"
    bgcolor={active ? 'mari.Primary' : done ? '#C3CAEE' : 'gray.40'}
    flexShrink={0}
    sx={active ? scenarioDesignStepPulseSx : undefined}
  />
)

const DesigningScenarioButtonContent = ({
  className,
  locked,
  designStep,
}: {
  className?: string
  locked?: boolean
  designStep?: EventDesignStep | string | null
}) => {
  const normalizedStep = normalizeEventDesignStep(designStep)
  const step2 = normalizedStep === 'step2'

  return (
    <Stack component="span" className={className} alignItems="center" gap="4px" width="54px" overflow="visible">
      <Stack component="span" direction="row" alignItems="center" gap="2px">
        <ScenarioDesignStepBar active={!step2} done={step2} />
        <ScenarioDesignStepBar active={step2} />
      </Stack>
      <Stack component="span" direction="row" alignItems="center" justifyContent="center" gap="4px" width="100%" minWidth={0}>
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
        <Typography component="span" variant="body3SB12" color="inherit" lineHeight={1.4} noWrap>
          {step2 ? '2단계' : '1단계'}
        </Typography>
      </Stack>
    </Stack>
  )
}

const DesigningScenarioButton = ({
  disabled,
  recommended,
  locked,
  alwaysExpanded = false,
  designStep,
  designStepLabel,
  onClick,
}: ScenarioDesigningButtonProps) => {
  const button = (
    <MIBaseButton
      variant="outlined"
      disabled={disabled}
      aria-label={`${locked ? '다른 사용자 ' : ''}시나리오 ${designStepLabel?.trim() || '설계'} 진행 중`}
      onClick={onClick}
      sx={{
        ...(alwaysExpanded
          ? {
            width: '66px',
            minWidth: '66px',
          }
          : tableButtonBaseSx),
        height: '36px',
        padding: alwaysExpanded ? '6px' : 0,
        borderRadius: '8px',
        borderColor: alwaysExpanded ? 'contentBorder.Normal' : 'transparent',
        backgroundColor: alwaysExpanded ? 'commonColor.White' : 'transparent',
        color: alwaysExpanded ? 'contentText.Normal' : recommended ? 'mari.Primary' : 'contentIcon.Enabled',
        justifyContent: 'center',
        '& > span, & > span > span': {
          width: '100%',
        },
        ...(!alwaysExpanded && {
          '&::before': {
            ...tableButtonBaseSx['&::before'],
            borderColor: recommended ? 'mari.Primary' : 'contentBorder.Normal',
            backgroundColor: 'commonColor.White',
          },
          '& > span > span': {
            boxSizing: 'border-box',
            width: '100%',
            padding: 0,
            transform: 'translateX(0)',
            transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          },
          '& .scenario-designing-content': {
            position: 'relative',
            width: '36px',
            height: '36px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          },
          '& .scenario-designing-expanded': {
            position: 'absolute',
            top: '50%',
            left: '50%',
            flex: '0 0 auto',
            opacity: 0,
            transform: 'translate(-50%, -50%) translateX(12px) scale(0.96)',
            transition: 'opacity 140ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          },
          '& .scenario-designing-collapsed-icon': {
            position: 'absolute',
            top: '50%',
            left: '50%',
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1)',
            transition: 'opacity 140ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          },
          '&:is(:hover:not(:disabled), :focus-visible)::before': {
            borderRadius: '4.1px / 8px',
            borderColor: 'contentBG.Active',
            backgroundColor: 'contentBG.Active',
            transform: 'translateX(-50%) scaleX(1.9444)',
          },
          '&:is(:hover:not(:disabled), :focus-visible) > span > span': {
            transform: 'translateX(0)',
          },
          '&:is(:hover:not(:disabled), :focus-visible) .scenario-designing-collapsed-icon': {
            opacity: 0,
            transform: 'translate(-50%, -50%) translateX(-12px) scale(0.92)',
          },
          '&:is(:hover:not(:disabled), :focus-visible) .scenario-designing-expanded': {
            opacity: 1,
            transform: 'translate(-50%, -50%) translateX(0) scale(1)',
            transition: 'opacity 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          },
        }),
        '& .MuiStack-root': {
          overflow: 'visible',
        },
        '&:hover:not(:disabled), &:focus-visible': {
          borderColor: alwaysExpanded ? 'contentBG.Active' : 'transparent',
          backgroundColor: alwaysExpanded ? 'contentBG.Active' : 'transparent',
          color: 'contentText.Black',
        },
        '&:active:not(:disabled)': {
          borderColor: alwaysExpanded ? 'contentBG.Active' : 'transparent',
          backgroundColor: alwaysExpanded ? 'gray.5' : 'transparent',
          color: 'contentText.Black',
          ...(!alwaysExpanded && {
            '&::before': {
              borderColor: 'contentBorder.Active',
              backgroundColor: 'gray.5',
            },
          }),
        },
        '&.Mui-disabled': {
          borderColor: alwaysExpanded ? 'contentBorder.Disabled' : 'transparent',
          backgroundColor: alwaysExpanded ? 'contentBG.Disabled' : 'transparent',
          color: 'contentText.Disabled',
        },
      }}
    >
      {alwaysExpanded ? (
        <DesigningScenarioButtonContent locked={locked} designStep={designStep} />
      ) : (
        <Box component="span" className="scenario-designing-content">
          <ScenarioDesignButtonIcon className="scenario-designing-collapsed-icon" />
          <DesigningScenarioButtonContent className="scenario-designing-expanded" locked={locked} designStep={designStep} />
        </Box>
      )}
    </MIBaseButton>
  )

  return (
    <NextGenMIFollowCursorTooltip
      title={getEventDesignStepTooltipTitle(designStep, designStepLabel)}
      followCursor={false}
      placement="top-start"
      // placement="right"
      // slotProps={{
      //   popper: {
      //     modifiers: [{ name: 'offset', options: { offset: [0, 22] } }],
      //   },
      // }}
    >
      {button}
    </NextGenMIFollowCursorTooltip>
  )
}

/** Events - 시나리오 생성 버튼 (목록 아이콘) */
const EventScenarioGenerateButton = ({
  onClick,
  disabled,
  disabledTooltipTitle,
  recommended,
  scenarioAvailable,
  designing,
  designingLocked,
  designingAlwaysExpanded = false,
  designStep,
  designStepLabel,
}: EventScenarioGenerateButtonProps) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onClick?.(e)
  }

  const button = designing ? (
    <DesigningScenarioButton
      disabled={disabled}
      recommended={recommended}
      locked={designingLocked}
      alwaysExpanded={designingAlwaysExpanded}
      designStep={designStep}
      designStepLabel={designStepLabel}
      onClick={handleClick}
    />
  ) : scenarioAvailable ? (
    <ViewScenarioButton disabled={disabled} onClick={handleClick} />
  ) : recommended ? (
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
