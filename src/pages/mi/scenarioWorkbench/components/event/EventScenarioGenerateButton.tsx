import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { type MouseEvent } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'

export interface EventScenarioGenerateButtonProps {
  onClick?: (e: MouseEvent) => void
  disabled?: boolean
}

/** Events 테이블 시나리오 컬럼: 시나리오 생성(sparkle) 버튼 */
const EventScenarioGenerateButton = ({ onClick, disabled }: EventScenarioGenerateButtonProps) => (
  <MIBaseButton
    variant="outlined"
    enableHoverBackground={!disabled}
    disabled={disabled}
    aria-label="시나리오 생성"
    onClick={(e) => {
      e.stopPropagation()
      onClick?.(e)
    }}
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

export default EventScenarioGenerateButton
