import { Box, Tooltip } from '@mui/material'
import { useState, useEffect } from 'react'

import CloseChatIcon from '../icons/agent/CloseChatIcon'
import CollapseIcon from '../icons/agent/CollapseIcon'
import ExpandIcon from '../icons/agent/ExpandIcon'

import mariIcon from '@/assets/mariicon.svg'

export interface MIAgentHeaderBoxProps {
  minimized?: boolean
  newChat: () => void
  onExpand?: () => void
  onClose?: () => void
  isGenerating: boolean
}

const MIAgentHeaderBox = ({ minimized = true, newChat, isGenerating, onExpand = () => {}, onClose = () => {} }: MIAgentHeaderBoxProps) => {
  const [closeTooltipOpen, setCloseTooltipOpen] = useState(false)
  const [expandTooltipOpen, setExpandTooltipOpen] = useState(false)

  useEffect(() => {
    setExpandTooltipOpen(false)
  }, [minimized])

  const handleClose = () => {
    setCloseTooltipOpen(false)
    onClose()
  }

  return (
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
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0, 0.55, 0.45, 1)',
            '&:hover': {
              transform: 'scale(1.04)',
            },
            '&:active': {
              transform: 'scale(1.01)',
            },
          }}
          onClick={() => {
            if (isGenerating) return
            newChat()
          }}
        >
          <img width={32} height={32} src={mariIcon} alt="Mari Icon" style={{ marginLeft: '16px' }} />
        </Box>
      </Tooltip>

      <Box display="flex" alignItems="center" gap="8px">
        {minimized ? (
          <Tooltip
            title={'mini chat'}
            placement="right-start"
            disableInteractive
            open={expandTooltipOpen}
            onOpen={() => setExpandTooltipOpen(true)}
            onClose={() => setExpandTooltipOpen(false)}
          >
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
              <CollapseIcon />
            </Box>
          </Tooltip>
        ) : (
          <Tooltip
            title={'Maximize'}
            placement="right-start"
            disableInteractive
            open={expandTooltipOpen}
            onOpen={() => setExpandTooltipOpen(true)}
            onClose={() => setExpandTooltipOpen(false)}
          >
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
              <ExpandIcon />
            </Box>
          </Tooltip>
        )}
        <Tooltip
          title={'Close'}
          placement="right-start"
          disableInteractive
          open={closeTooltipOpen}
          onOpen={() => setCloseTooltipOpen(true)}
          onClose={() => setCloseTooltipOpen(false)}
        >
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
            onClick={handleClose}
          >
            <CloseChatIcon />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default MIAgentHeaderBox
