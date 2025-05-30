import { Box, Tooltip } from '@mui/material'
import React from 'react'

import CloseChatIcon from '../icons/agent/CloseChatIcon'
import CollapseIcon from '../icons/agent/CollapseIcon'
import ExpandIcon from '../icons/agent/ExpandIcon'

import mariIcon from '@/assets/mariicon.svg'

export interface MIAgentHeaderBoxProps {
  minimized?: boolean
  onExpand?: () => void
  onClose?: () => void
}

const MIAgentHeaderBox: React.FC<MIAgentHeaderBoxProps> = ({ minimized = true, onExpand = () => {}, onClose = () => {} }) => (
  <Box
    width="100%"
    minHeight="70px"
    height="70px"
    alignItems="center"
    bgcolor="#F9F8F6"
    display="flex"
    justifyContent="space-between"
    sx={{
      userSelect: 'none',
      borderRadius: '12px',
    }}
  >
    <Tooltip title={'New Chat'} placement="right-start" disableInteractive>
      <Box
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0, 0.55, 0.45, 1)',
          '&:hover': {
            transform: 'scale(1.04)',
          },
          '&:active': {
            transform: 'scale(1.01)',
          },
        }}
        onClick={() => console.log('New chat clicked')}
      >
        <img width={32} height={32} src={mariIcon} alt="Mari Icon" style={{ marginLeft: '16px' }} />
      </Box>
    </Tooltip>

    <Box display="flex" alignItems="center" gap="8px">
      <Tooltip title={minimized ? 'mini chat' : 'Maximize'} placement="right-start" disableInteractive>
        <Box
          width={34}
          height={34}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={onExpand}
          color={'contentIcon.Enabled'}
          sx={{
            '&:hover': {
              backgroundColor: '#EDECEA',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#000',
            },
          }}
        >
          {minimized ? <CollapseIcon /> : <ExpandIcon />}
        </Box>
      </Tooltip>
      <Tooltip title={'Close'} placement="right-start" disableInteractive>
        <Box
          width={34}
          height={34}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color={'contentIcon.Enabled'}
          sx={{
            marginRight: '12px',
            '&:hover': {
              backgroundColor: '#EDECEA',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#000',
            },
          }}
          onClick={onClose}
        >
          <CloseChatIcon />
        </Box>
      </Tooltip>
    </Box>
  </Box>
)

export default MIAgentHeaderBox
