import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box } from '@mui/material'
import { type SxProps, type Theme } from '@mui/material/styles'
import { type MouseEvent } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ScenarioDesignIcon from '@/components/common/icons/ScenarioDesignIcon'

export interface EventScenarioGenerateButtonProps {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  recommended?: boolean
  scenarioAvailable?: boolean
}

type ScenarioTableButtonProps = {
  disabled?: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}

const tableButtonIconSx = {
  width: 20,
  height: 20,
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0,
} satisfies SxProps<Theme>

const tableButtonBaseSx = {
  width: 36,
  minWidth: 36,
  height: 36,
  boxSizing: 'border-box',
  p: 0,
  borderRadius: '8px',
  backgroundColor: 'commonColor.White',
  justifyContent: 'center',
  overflow: 'hidden',
  transition: 'width 220ms cubic-bezier(0.22, 1, 0.36, 1), background 160ms ease, border-color 160ms ease, color 160ms ease',
  '& > span > span': {
    boxSizing: 'border-box',
    width: '100%',
    pl: '6px',
    pr: '8px',
    transition: 'padding-left 220ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  '& .MuiStack-root': {
    minWidth: 0,
  },
  '& .MuiTypography-root': {
    width: 0,
    minWidth: 0,
    flexShrink: 0,
    opacity: 0,
    transform: 'translateX(-2px)',
    transition: 'width 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 140ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  '&:is(:hover:not(:disabled), :focus-visible)': {
    width: 61,
    transition: 'width 360ms cubic-bezier(0.22, 1, 0.36, 1), background 160ms ease, border-color 160ms ease, color 160ms ease',
  },
  '&:is(:hover:not(:disabled), :focus-visible) > span > span': {
    pl: '6px',
    transition: 'padding-left 360ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  '&:is(:hover:not(:disabled), :focus-visible) .MuiTypography-root': {
    width: '25px',
    opacity: 1,
    transform: 'translateX(0)',
    transition: 'width 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  '&.Mui-disabled': {
    borderColor: 'contentBorder.Disabled',
    backgroundColor: 'commonColor.White',
    color: 'contentIcon.Disabled',
  },
} satisfies SxProps<Theme>

const ScenarioDesignButtonIcon = () => (
  <Box component="span" sx={tableButtonIconSx}>
    <ScenarioDesignIcon aria-hidden focusable="false" />
  </Box>
)

const ScenarioViewButtonIcon = () => (
  <Box component="span" sx={tableButtonIconSx}>
    <ChevronRightRoundedIcon aria-hidden focusable="false" sx={{ width: '100%', height: '100%', fontSize: 20 }} />
  </Box>
)

const DesignScenarioButton = ({ disabled, onClick }: ScenarioTableButtonProps) => (
  <MIBaseButton
    variant="outlined"
    disabled={disabled}
    aria-label="시나리오 설계"
    onClick={onClick}
    prefix={<ScenarioDesignButtonIcon />}
    gap="2px"
    sx={{
      ...tableButtonBaseSx,
      borderColor: 'contentBorder.Normal',
      color: 'contentIcon.Enabled',
      '&:hover:not(:disabled), &:focus-visible': {
        borderColor: 'contentIcon.ActivePrimary',
        backgroundColor: 'contentIcon.ActivePrimary',
        color: 'commonColor.White',
      },
      '&:active:not(:disabled)': {
        borderColor: 'contentIcon.ActivePrimary',
        backgroundColor: 'contentIcon.ActivePrimary',
        color: 'commonColor.White',
        backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(0deg, #2E3F5E, #2E3F5E)',
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
    gap="2px"
    sx={{
      ...tableButtonBaseSx,
      borderColor: 'mari.Primary',
      color: 'mari.Primary',
      '&:hover:not(:disabled), &:focus-visible': {
        borderColor: 'mari.Primary',
        backgroundColor: 'mari.Primary',
        color: 'contentText.White',
      },
      '&:active:not(:disabled)': {
        borderColor: 'mari.Primary',
        backgroundColor: 'mari.Primary',
        color: 'contentText.White',
        backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(0deg, #364FC7, #364FC7)',
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
    gap="2px"
    sx={{
      ...tableButtonBaseSx,
      borderColor: 'contentBorder.Normal',
      color: 'contentIcon.Enabled',
      '& > span > span': {
        boxSizing: 'border-box',
        width: '100%',
        pl: '8px',
        pr: '8px',
        transition: 'padding-left 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
      '&:hover:not(:disabled), &:focus-visible': {
        borderColor: 'contentBorder.Hover',
        backgroundColor: 'gray.5',
        color: 'contentText.Normal',
      },
      '&:active:not(:disabled)': {
        borderColor: 'contentBorder.Active',
        backgroundColor: 'gray.5',
        color: 'contentText.Black',
      },
    }}
  >
    보기
  </MIBaseButton>
)

/** Events - 시나리오 생성 버튼 (목록 아이콘) */
const EventScenarioGenerateButton = ({ onClick, disabled, recommended, scenarioAvailable }: EventScenarioGenerateButtonProps) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onClick?.(e)
  }

  if (scenarioAvailable) return <ViewScenarioButton disabled={disabled} onClick={handleClick} />
  if (recommended) return <RecommendedScenarioButton disabled={disabled} onClick={handleClick} />
  return <DesignScenarioButton disabled={disabled} onClick={handleClick} />
}

export default EventScenarioGenerateButton
