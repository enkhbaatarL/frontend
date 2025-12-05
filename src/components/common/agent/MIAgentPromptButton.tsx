import { Box } from '@mui/material'
import { useMemo, useCallback } from 'react'

import loadingDisabledIcon from '@/assets/agent/loading-disabled.svg'
import sendActivatedIcon from '@/assets/agent/send-activated.svg'
import sendDisabledIcon from '@/assets/agent/send-disabled.svg'
import stopActivatedIcon from '@/assets/agent/stop-activated.svg'
import stopDisabledIcon from '@/assets/agent/stop-disabled.svg'
import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'

export interface MIAgentPromptButtonProps {
  inputStatus?: 'send-activated' | 'send-disabled' | 'stop-activated' | 'stop-disabled' | 'loading-disabled' | 'unable-disabled'
  onSendMessage: () => void
  onStop?: (message: string) => void
}

const MIAgentPromptButton = ({ inputStatus = 'send-activated', onSendMessage, onStop }: MIAgentPromptButtonProps) => {
  const isInteractive = useMemo(() => inputStatus === 'send-activated' || inputStatus === 'stop-activated', [inputStatus])

  const getImageSrc = useCallback(() => {
    switch (inputStatus) {
      case 'send-activated':
        return sendActivatedIcon
      case 'send-disabled':
        return sendDisabledIcon
      case 'stop-activated':
        return stopActivatedIcon
      case 'stop-disabled':
        return stopDisabledIcon
      case 'loading-disabled':
        return loadingDisabledIcon
      default:
        return sendActivatedIcon
    }
  }, [inputStatus])

  const handleClick = () => {
    if (inputStatus === 'send-activated') {
      onSendMessage()
    } else if (inputStatus === 'stop-activated' && onStop) {
      onStop('')
    }
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        pointerEvents: isInteractive ? 'initial' : 'none',
        cursor: isInteractive ? 'pointer' : 'not-allowed',
        userSelect: 'none',
      }}
      onClick={handleClick}
    >
      {inputStatus === 'loading-disabled' ? <MIAgentSpinner /> : <img src={getImageSrc()} width={32} height={32} alt={inputStatus} />}
    </Box>
  )
}

export default MIAgentPromptButton
