import { Box, Typography, List, ListItem, Tooltip } from '@mui/material'
import { useState, useMemo, memo } from 'react'

import HistoryIcon from '../icons/agent/HistoryIcon'

import MIAgentHistoryItem from '@/components/common/agent/MIAgentHistoryItem'
import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import { IChatRoom } from '@/hooks/useMIAgent'

export interface MiAgentHistoryProps {
  loading: boolean
  chatRooms?: IChatRoom[]
  onSelectChat: (chatId: string) => void
  windowExpend: boolean
  onEditTitle: (chatId: string, newTitle: string) => Promise<void>
  onDelete: (chatId: string) => Promise<void>
  disabled?: boolean
}

const historyIconStyles = {
  padding: '6px',
  margin: '12px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'start',
  alignItems: 'center',
  boxSizing: 'border-box',
  borderRadius: '4px',
  color: 'gray.60',
  '&:hover': {
    backgroundColor: 'contentBG.Hover',
    color: 'gray.80',
  },
}

const MiAgentHistory = ({
  loading,
  chatRooms,
  onSelectChat = () => {},
  windowExpend,
  onEditTitle,
  onDelete,
  disabled,
}: MiAgentHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const containerStyles = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'start',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      width: windowExpend ? (isExpanded ? '200px' : '68px') : '0px',
      transition: 'width 0.3s cubic-bezier(0.65, 0, 0.35, 1), height 0.3s cubic-bezier(0.65, 0, 0.35, 1)',
      backgroundColor: 'white',
      borderTopLeftRadius: '12px',
      borderBottomLeftRadius: '12px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    }),
    [isExpanded, windowExpend],
  )

  return (
    <Box sx={containerStyles}>
      <Tooltip title={isExpanded ? 'Collapse' : 'Open'} placement="right-start">
        <Box sx={historyIconStyles} onClick={() => setIsExpanded(!isExpanded)}>
          <HistoryIcon />
        </Box>
      </Tooltip>

      <List
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
          width: '100%',
          textAlign: 'left',
        }}
      >
        {isExpanded && (
          <>
            <Box sx={{ mb: '6px', paddingX: '12px' }}>
              <Typography
                variant="body3"
                sx={{
                  padding: '12px 8px 8px 8px',
                }}
                color="gray.60"
              >
                최근
              </Typography>
            </Box>
            {loading ? (
              <ListItem disablePadding>
                <Box sx={{ padding: '12px', height: '44px', display: 'flex', alignItems: 'center' }}>
                  <MIAgentSpinner />
                </Box>
              </ListItem>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingX: '12px',
                  position: 'relative',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#CED4DA',
                    borderRadius: '3px',
                    '&:hover': {
                      background: '#ADB5BD',
                    },
                  },
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CED4DA transparent',
                }}
              >
                {chatRooms?.map((item) => (
                  <ListItem key={item.chatRoomId} disablePadding>
                    <MIAgentHistoryItem
                      selected={item.isSelected}
                      item={item}
                      onSelected={(id) => {
                        if (!item.isSelected) onSelectChat(id)
                      }}
                      onEditTitle={onEditTitle}
                      onDelete={onDelete}
                      disabled={disabled}
                    />
                  </ListItem>
                ))}
              </Box>
            )}
          </>
        )}
      </List>

      {isExpanded ? (
        <Box sx={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Powered by
          </Typography>
          <Typography variant="caption" fontWeight="bold" sx={{ ml: 0.5 }}>
            A.I
          </Typography>
        </Box>
      ) : (
        <Typography variant="caption" fontWeight="bold" sx={{ textAlign: 'center', marginBottom: '12px', width: '100%' }}>
          A.I
        </Typography>
      )}
    </Box>
  )
}

export default memo(MiAgentHistory)
