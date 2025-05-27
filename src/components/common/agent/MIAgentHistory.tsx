import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  styled,
  type TooltipProps,
  Tooltip,
  tooltipClasses,
  Input,
  InputAdornment,
} from '@mui/material'
import React, { useState, useCallback, useMemo } from 'react'

import CloseIcon from '../icons/agent/CloseIcon'
import DeleteIcon from '../icons/agent/DeleteIcon'
import EditIcon from '../icons/agent/EditIcon'
import HistoryIcon from '../icons/agent/HistoryIcon'
import MoreIcon from '../icons/agent/MoreIcon'

// Styled Paper component with dashed border
// const DashedPaper = styled(Paper)(({ theme }) => ({
//   padding: theme.spacing(2),
//   borderRadius: theme.shape.borderRadius,
//   border: `1px dashed ${theme.palette.divider}`,
//   height: '100%',
//   display: 'flex',
//   flexDirection: 'column',
// }))

export interface ChatItem {
  id: string
  title: string
  messages?: Array<{ text: string; isUser: boolean }>
}

export interface MiAgentHistoryProps {
  chatItems: ChatItem[]
  onSelectChat?: (chatId: string) => void
  onNewChat?: () => void
  selectedChatId?: string
  isExpanded?: boolean
  onExpand?: () => void
  onOpenDelete?: (item: ChatItem) => void
  onEditChatTitle?: (chatId: string, newTitle: string) => void
}

// Styled components extracted outside of render function
const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)(
  ({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      background: '#fff',
      color: theme.palette.contentText.Black,
      width: '90px',
      height: '88px',
      minWidth: '90px',
      display: 'flex',
      flexdirection: 'column',
      alignItems: 'flex-start',
      flexShrink: '0',
      borderRadius: '4px',
      boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.10)',
      marginLeft: '8px!important',
      padding: '8px 0',
    },
  }),
)

// Styles extracted as constants to prevent recreation on each render
const listItemButtonStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  boxSizing: 'border-box',
  width: '100%',
  alignItems: 'center',
  gap: '4px',
  padding: '5px 8px',
  borderRadius: '4px',
  height: '44px',
  '&:hover': {
    backgroundColor: '#F9F8F6',
    color: 'content.iconActive',
  },
  color: 'content.iconEnabled',
  '&.Mui-focusVisible': {
    backgroundColor: '#F9F8F6',
  },
}

const editingInputStyles = {
  width: '100%',
  '& .MuiInputBase-input': {
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: '1.4',
    color: '#212529',
    borderRadius: '4px',
    border: '1px solid',
    borderColor: '#2E3F5E',
    backgroundColor: '#fff',
    padding: '0 12px',
    height: '34px',
    paddingRight: '32px',
  },
}

const titleStyles = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: 'content.textNormal',
  '&:hover': {
    color: 'content.textBlack',
  },
  maxWidth: '116px',
}

const tooltipActionStyles = {
  display: 'flex',
  height: '36px',
  padding: '8px 14px',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: '8px',
  color: 'contentIcon.Enabled',
  '&:hover': {
    color: 'contentIcon.Activeb',
    cursor: 'pointer',
  },
}

const moreIconStyles = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '28px',
  height: '28px',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: 'contentBG.Maribtnhover',
  },
}

// Extracted as a memoized component to prevent unnecessary re-renders
const HistoryItem = React.memo(
  ({
    item,
    selectedChatId,
    handleSelectChat,
    onNewChat,
    onDeleteChat,
    onEditChatTitle,
    editingItemId,
    setEditingItemId,
  }: {
    item: ChatItem
    selectedChatId: string | undefined
    handleSelectChat?: (chatId: string) => void
    onNewChat?: () => void
    onDeleteChat?: (chatItem: ChatItem) => void
    onEditChatTitle?: (chatId: string, newTitle: string) => void
    editingItemId: string | null
    setEditingItemId: (id: string | null) => void
  }) => {
    const [textInput, setTextInput] = useState(item.title)

    // Memoized callbacks to prevent recreation on each render
    const onEdit = useCallback(() => {
      setEditingItemId(item.id)
      setTextInput(item.title)
    }, [item.id, item.title, setEditingItemId])

    const onCancelEdit = useCallback(() => {
      setEditingItemId(null)
      setTextInput(item.title)
    }, [item.title, setEditingItemId])

    const onSaveEditing = useCallback(() => {
      if (textInput.trim() && textInput !== item.title && onEditChatTitle) {
        onEditChatTitle(item.id, textInput)
      }
      setEditingItemId(null)
    }, [textInput, item.id, item.title, onEditChatTitle, setEditingItemId])

    const onDelete = useCallback(() => {
      if (onDeleteChat) {
        onDeleteChat(item)
      }
    }, [item, onDeleteChat])

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
          onCancelEdit()
        } else if (event.key === 'Enter') {
          onSaveEditing()
        }
      },
      [onCancelEdit, onSaveEditing],
    )

    const handleClearInput = useCallback(() => {
      setTextInput('')
    }, [])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setTextInput(e.target.value)
    }, [])

    const handleItemClick = useCallback(() => {
      if (onNewChat && item.id === '') {
        onNewChat()
      } else if (handleSelectChat) {
        handleSelectChat(item.id)
      }
    }, [item.id, handleSelectChat, onNewChat])

    // Memoized tooltip actions to prevent recreation
    const tooltipActions = useMemo(
      () => [
        { name: '수정', icon: EditIcon, action: onEdit },
        { name: '삭제', icon: DeleteIcon, action: onDelete },
      ],
      [onEdit, onDelete],
    )

    if (editingItemId === item.id) {
      return (
        <ListItemButton
          sx={{
            ...listItemButtonStyles,
            padding: '5px 8px',
          }}
        >
          <Input
            placeholder={'입력하세요'}
            sx={editingInputStyles}
            disableUnderline
            value={textInput}
            onKeyDown={handleKeyDown}
            autoFocus
            endAdornment={
              textInput ? (
                <InputAdornment
                  position="end"
                  sx={{
                    position: 'absolute',
                    right: '12px',
                    top: '7px',
                  }}
                >
                  <Box
                    sx={{
                      color: 'contentIcon.Enabled',
                      cursor: 'pointer',
                      margin: 'auto',
                      width: '20px',
                      height: '20px',
                    }}
                    onClick={handleClearInput}
                  >
                    <CloseIcon />
                  </Box>
                </InputAdornment>
              ) : null
            }
            onChange={handleInputChange}
          />
        </ListItemButton>
      )
    }

    return (
      <ListItemButton selected={selectedChatId === item.id} onClick={handleItemClick} sx={listItemButtonStyles} disableRipple>
        <Typography variant="body4" sx={titleStyles}>
          {item.title}
        </Typography>
        <HtmlTooltip
          title={
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
              }}
            >
              {tooltipActions.map((action, index) => (
                <Box key={index} sx={tooltipActionStyles} onClick={action.action}>
                  <Box
                    sx={{
                      width: '20px',
                      height: '20px',
                    }}
                  >
                    {action.icon({})}
                  </Box>
                  <Typography
                    color="contentText.Normal"
                    variant="body2R14"
                    sx={{
                      '&:hover': {
                        color: 'contentText.Black',
                        fontWeight: 500,
                      },
                    }}
                  >
                    {action.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          }
          placement="right-start"
        >
          <Box sx={moreIconStyles}>
            <MoreIcon width={'20px'} height={'20px'} />
          </Box>
        </HtmlTooltip>
      </ListItemButton>
    )
  },
)

HistoryItem.displayName = 'HistoryItem'

const MiAgentHistory: React.FC<MiAgentHistoryProps> = ({
  chatItems,
  onSelectChat = () => {},
  // onNewChat = () => {},
  selectedChatId,
  isExpanded = true,
  onExpand,
  onEditChatTitle,
  onOpenDelete,
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  // Memoized callback to prevent recreation on each render
  const handleSelectChat = useCallback(
    (chatId: string) => {
      onSelectChat(chatId)
    },
    [onSelectChat],
  )

  // Container styles memoized to prevent recreation
  const containerStyles = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'start',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      width: isExpanded ? '200px' : '68px',
      transition: 'width 0.3s ease',
      backgroundColor: 'white',
      borderTopLeftRadius: '12px',
      borderBottomLeftRadius: '12px',
      boxSizing: 'border-box',
      position: 'relative',
    }),
    [isExpanded],
  )

  // History icon styles memoized
  const historyIconStyles = useMemo(
    () => ({
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
    }),
    [],
  )

  return (
    <Box sx={containerStyles}>
      <Tooltip title={'Open'} placement="right-start">
        <Box sx={historyIconStyles} onClick={onExpand}>
          <HistoryIcon />
        </Box>
      </Tooltip>

      <List sx={{ flex: 1, overflow: 'auto', paddingX: '12px', boxSizing: 'border-box', width: '100%', textAlign: 'left' }}>
        {isExpanded && (
          <>
            <Typography
              variant="body3"
              sx={{
                padding: '12px 8px 8px 8px',
              }}
              color="gray.60"
            >
              최근
            </Typography>
            {/* <ListItem disablePadding>
              <HistoryItem item={{ id: '', title: 'New Chat', messages: [] }} selectedChatId={selectedChatId} onNewChat={onNewChat} />
            </ListItem> */}

            {chatItems.map((item) => (
              <ListItem key={item.id} disablePadding>
                <HistoryItem
                  item={item}
                  handleSelectChat={handleSelectChat}
                  selectedChatId={selectedChatId}
                  onDeleteChat={() => {
                    onOpenDelete?.(item)
                  }}
                  onEditChatTitle={onEditChatTitle}
                  editingItemId={editingItemId}
                  setEditingItemId={setEditingItemId}
                />
              </ListItem>
            ))}
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

export default React.memo(MiAgentHistory)
