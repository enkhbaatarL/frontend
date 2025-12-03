import { Box, Typography, List, ListItem, Tooltip, Theme, Stack, Collapse, Fade } from '@mui/material'
import { useState, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'

import axLogo from '@/assets/agent/a.x.svg'
import MIAgentHistoryItem from '@/components/common/agent/MIAgentHistoryItem'
import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import HistoryIcon from '@/components/common/icons/agent/HistoryIcon'
import { IChatRoom } from '@/hooks/useMIAgent'

export interface MiAgentHistoryProps {
  loading: boolean
  chatRooms?: IChatRoom[]
  onSelectChat: (chatId: string) => void
  windowExpend: boolean
  onEditTitle: (chatId: string, newTitle: string) => Promise<void>
  onDelete: (chatId: string) => Promise<void>
  disabled?: boolean
  selectedChatRoomId?: string | null
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
  selectedChatRoomId,
}: MiAgentHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const { t } = useTranslation()

  const containerStyles = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'start',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: windowExpend ? '100%' : '0px',
      width: windowExpend ? (isExpanded ? '200px' : '78px') : '0px',
      minWidth: windowExpend ? (isExpanded ? '200px' : '78px') : '0px',
      maxWidth: windowExpend ? (isExpanded ? '200px' : '78px') : '0px',
      minHeight: windowExpend ? '100%' : '0px',
      maxHeight: windowExpend ? '100%' : '0px',
      backgroundColor: 'white',
      borderTopLeftRadius: '12px',
      borderBottomLeftRadius: '12px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      transition: (theme: Theme) =>
        theme.transitions.create(['width', 'min-width', 'max-width', 'opacity', 'transform'], {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
      opacity: windowExpend ? 1 : 0,
      transform: windowExpend ? 'translateX(0)' : 'translateX(-10px)',
      willChange: 'width, transform, opacity',
      backfaceVisibility: 'hidden',
    }),
    [isExpanded, windowExpend],
  )

  return (
    <Box sx={containerStyles}>
      <Stack height="70px" justifyContent="center" alignItems="center" padding="19px 12px" boxSizing="border-box">
        <Tooltip title={isExpanded ? 'Collapse' : 'Open'} placement="right-start">
          <Box sx={historyIconStyles} onClick={() => setIsExpanded(!isExpanded)}>
            <HistoryIcon />
          </Box>
        </Tooltip>
      </Stack>

      <List
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
          width: '100%',
          textAlign: 'left',
          padding: 0,
        }}
      >
        <Collapse
          in={isExpanded}
          timeout={300}
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            '& .MuiCollapse-wrapper': {
              transition: (theme: Theme) =>
                theme.transitions.create('height', {
                  duration: theme.transitions.duration.standard,
                  easing: theme.transitions.easing.easeInOut,
                }),
            },
          }}
        >
          <Fade in={isExpanded} timeout={300}>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
              <Stack
                height="37px"
                padding="10px 20px"
                boxSizing="border-box"
                justifyContent="center"
                alignItems="start"
                sx={{
                  transition: (theme: Theme) =>
                    theme.transitions.create('padding', {
                      duration: theme.transitions.duration.standard,
                      easing: theme.transitions.easing.easeInOut,
                    }),
                }}
              >
                <Typography variant="body3" color="gray.60" height="17px">
                  {t('common.recent')}
                </Typography>
              </Stack>
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
                        selected={selectedChatRoomId === item.chatRoomId}
                        item={item}
                        onSelected={(id) => {
                          if (selectedChatRoomId !== id) onSelectChat(id)
                        }}
                        onEditTitle={onEditTitle}
                        onDelete={onDelete}
                        disabled={disabled}
                      />
                    </ListItem>
                  ))}
                </Box>
              )}
            </Box>
          </Fade>
        </Collapse>
      </List>

      <Stack
        direction="row"
        width="100%"
        alignItems="center"
        justifyContent="flex-start"
        padding="24px 22px"
        gap="5px"
        boxSizing="border-box"
        sx={{
          minHeight: '61px',
          transition: (theme: Theme) =>
            theme.transitions.create(['padding'], {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }),
          userSelect: 'none',
        }}
      >
        <Box
          sx={{
            maxWidth: isExpanded ? '100px' : '0px',
            overflow: 'hidden',
            opacity: isExpanded ? 1 : 0,
            transition: (theme: Theme) =>
              theme.transitions.create(['max-width', 'opacity'], {
                duration: theme.transitions.duration.standard,
                easing: theme.transitions.easing.easeInOut,
              }),
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Powered by
          </Typography>
        </Box>
        <Box
          component="img"
          src={axLogo}
          alt="A.X Logo"
          width="29px"
          height="13px"
          sx={{
            flexShrink: 0,
          }}
        />
      </Stack>
    </Box>
  )
}

export default memo(MiAgentHistory)
