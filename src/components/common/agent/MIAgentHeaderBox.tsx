import { Box, Stack, Tooltip, Typography, Collapse, Fade } from '@mui/material'
import { useState, useEffect, ReactNode } from 'react'

import CloseChatIcon from '../icons/agent/CloseChatIcon'
import CollapseIcon from '../icons/agent/CollapseIcon'
import ExpandIcon from '../icons/agent/ExpandIcon'
import NewChatIcon from '../icons/agent/NewChatIcon'

import mariSymbol from '@/assets/mari-symbol-animated.svg'

export interface MIAgentHeaderBoxProps {
  minimized?: boolean
  newChat: () => void
  onExpand?: () => void
  onClose?: () => void
  isGenerating: boolean
}

interface HeaderButtonProps {
  title: string
  icon: ReactNode
  onClick: () => void
  expanded?: boolean
  disabled?: boolean
}

const HeaderButton = ({ title, icon, onClick, expanded, disabled = false }: HeaderButtonProps) => {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  useEffect(() => {
    setTooltipOpen(false)
  }, [expanded])

  return (
    <Tooltip
      title={title}
      placement="left-start"
      disableInteractive
      open={tooltipOpen && !expanded}
      onOpen={() => setTooltipOpen(true)}
      onClose={() => setTooltipOpen(false)}
      slots={{ transition: Fade }}
      slotProps={{
        transition: { timeout: 300 },
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [-2, -12],
              },
            },
          ],
          sx: {
            opacity: expanded ? 0 : 1,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
          },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        padding="5px"
        borderRadius="10px"
        color="contentIcon.Enabled"
        sx={{
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          '&:hover': {
            backgroundColor: disabled ? 'transparent' : 'contentBG.Hover',
          },
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'opacity',
        }}
        onClick={disabled ? undefined : onClick}
      >
        <Box
          width={24}
          height={24}
          display="flex"
          alignItems="center"
          justifyContent="center"
          margin={expanded ? '0 8px 0 3px' : '0'}
          sx={{
            transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'margin',
          }}
        >
          {icon}
        </Box>
        <Collapse
          in={expanded}
          orientation="horizontal"
          timeout={300}
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Fade in={expanded} timeout={300}>
            <Typography variant="body2M14" color="contentText.Normal" mr="5px" whiteSpace="nowrap">
              {title}
            </Typography>
          </Fade>
        </Collapse>
      </Stack>
    </Tooltip>
  )
}

const MIAgentHeaderBox = ({ minimized = true, newChat, isGenerating, onExpand = () => {}, onClose = () => {} }: MIAgentHeaderBoxProps) => {
  const isNewChatDisabled = isGenerating

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
            cursor: isNewChatDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0, 0.55, 0.45, 1)',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            display: 'flex',
            alignItems: 'center',
            marginLeft: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 8px 2px rgba(54, 79, 199, 0.7)',
          }}
          onClick={() => {
            if (isNewChatDisabled) return
            newChat()
          }}
        >
          <Box
            component="img"
            src={mariSymbol}
            alt="Mari Icon"
            width="100%"
            height="100%"
            draggable={false}
            sx={{
              display: 'block',
              objectFit: 'cover',
            }}
          />
        </Box>
      </Tooltip>
      <Stack
        direction="row"
        alignItems="center"
        gap={minimized ? '2px' : '8px'}
        mr="12px"
        sx={{
          transition: 'gap 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'gap',
        }}
      >
        <HeaderButton
          title="New Chat"
          icon={<NewChatIcon width={18} height={18} />}
          onClick={newChat}
          expanded={!minimized}
          disabled={isNewChatDisabled}
        />
        <HeaderButton
          title={minimized ? 'Maximize' : 'Minimize'}
          icon={minimized ? <ExpandIcon width={24} height={24} /> : <CollapseIcon width={16} height={16} />}
          onClick={onExpand}
          expanded={!minimized}
        />
        <HeaderButton title="Close" icon={<CloseChatIcon width={24} height={24} />} onClick={onClose} />
      </Stack>
    </Box>
  )
}

export default MIAgentHeaderBox
