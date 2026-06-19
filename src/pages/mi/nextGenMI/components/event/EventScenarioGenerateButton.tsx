import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box } from '@mui/material'
import { type SxProps, type Theme } from '@mui/material/styles'
import { type MouseEvent } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'

export interface EventScenarioGenerateButtonProps {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  disabledTooltipTitle?: string
  recommended?: boolean
  scenarioAvailable?: boolean
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

const ScenarioDesignButtonIcon = () => (
  <Box component="span" sx={tableButtonIconSx}>
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
    gap="6px"
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
        padding: '0 8px',
        transform: 'translateX(0)',
        transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
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

/** Events - 시나리오 생성 버튼 (목록 아이콘) */
const EventScenarioGenerateButton = ({
  onClick,
  disabled,
  disabledTooltipTitle,
  recommended,
  scenarioAvailable,
}: EventScenarioGenerateButtonProps) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onClick?.(e)
  }

  const button = scenarioAvailable ? (
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
