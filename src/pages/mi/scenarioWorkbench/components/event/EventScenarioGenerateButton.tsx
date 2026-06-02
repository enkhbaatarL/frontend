import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { type MouseEvent } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'

export interface EventScenarioGenerateButtonProps {
  onClick?: (e: MouseEvent) => void
  disabled?: boolean
  /** table: Events 목록 아이콘 버튼 / detailHeader: 이벤트 상세 탭 바 CTA */
  layout?: 'table' | 'detailHeader'
}

/** Events - 시나리오 생성 버튼 (목록 아이콘 / 상세 헤더 CTA) */
const EventScenarioGenerateButton = ({ onClick, disabled, layout = 'table' }: EventScenarioGenerateButtonProps) => {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onClick?.(e)
  }

  if (layout === 'detailHeader') {
    return (
      <MIBaseButton
        variant="contained"
        disabled={disabled}
        prefix={<AutoAwesomeIcon sx={{ fontSize: 20, color: 'commonColor.White' }} />}
        onClick={handleClick}
        sx={{
          height: '32px',
          minHeight: '32px',
          px: '10px',
          pl: '6px',
          borderRadius: '10px',
          bgcolor: 'contentIcon.ActivePrimary',
          color: 'commonColor.White',
          fontSize: '14px',
          fontWeight: 600,
          lineHeight: 1.4,
          '&:hover': {
            bgcolor: 'contentIcon.ActivePrimary',
            filter: 'brightness(0.95)',
          },
          '&.Mui-disabled': {
            bgcolor: 'contentBG.Disabled',
            color: 'contentText.Disabled',
          },
        }}
      >
        시나리오 생성
      </MIBaseButton>
    )
  }

  return (
    <MIBaseButton
      variant="outlined"
      enableHoverBackground={!disabled}
      disabled={disabled}
      aria-label="시나리오 생성"
      onClick={handleClick}
      sx={{
        minWidth: '0px',
        width: '36px',
        height: '36px',
        padding: '8px',
        borderRadius: '10px',
        backgroundColor: 'commonColor.White',
      }}
    >
      <AutoAwesomeIcon sx={{ fontSize: 20, color: 'contentText.Black' }} />
    </MIBaseButton>
  )
}

export default EventScenarioGenerateButton
