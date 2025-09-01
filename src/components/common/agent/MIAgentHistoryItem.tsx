import ErrorIcon from '@mui/icons-material/Error'
import { ListItemButton, Typography, styled, TooltipProps, Tooltip, tooltipClasses, Box, Input, InputAdornment } from '@mui/material'
import { t } from 'i18next'
import { useMemo, useState, useRef, useEffect, useCallback, KeyboardEvent, ChangeEvent, MouseEvent } from 'react'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import DeleteIcon from '@/components/common/icons/agent/DeleteIcon'
import EditIcon from '@/components/common/icons/agent/EditIcon'
import MoreIcon from '@/components/common/icons/agent/MoreIcon'
import MIInputClearIcon from '@/components/common/input/MIInputClearIcon'
import { IChatRoomRes } from '@/service/mi/agent'

interface Props {
  selected?: boolean
  item: IChatRoomRes
  onSelected: (id: string) => void
  onEditTitle: (chatId: string, newTitle: string) => Promise<void>
  onDelete: (chatId: string) => Promise<void>
  disabled?: boolean
}

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)(
  ({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      background: '#fff',
      color: theme.palette.contentText.Black,
      width: '90px',
      height: '88px',
      minWidth: '90px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      flexShrink: '0',
      borderRadius: '4px',
      boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.10)',
      marginLeft: '8px!important',
      padding: '8px 0',
    },
  }),
)

const TitleTooltip = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)(
  ({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.contentText.Black,
      color: '#fff',
      fontSize: '14px',
      padding: '8px 12px',
      borderRadius: '4px',
      position: 'relative',
      marginLeft: '8px !important',
    },
  }),
)

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
    backgroundColor: '#F8F9FA',
  },
}

const moreIconStyles = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '28px',
  minHeight: '28px',
  borderRadius: '4px',
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

const MIAgentHistoryItem = ({ item, selected, onSelected, onEditTitle, onDelete, disabled }: Props) => {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState(item.title)
  const [isEditing, setIsEditing] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [isTextTruncated, setIsTextTruncated] = useState(false)
  const [isHover, setIsHover] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleEdit = useCallback(async () => {
    setIsEditing(false)

    if (title !== item.title && title !== '') {
      setIsUpdating(true)
      try {
        await onEditTitle(item.chatRoomId, title)
      } finally {
        setIsUpdating(false)
      }
    } else if (title === '') {
      setTitle(item.title)
    }
  }, [item.chatRoomId, item.title, onEditTitle, title])

  const handleDelete = useCallback(async () => {
    setIsUpdating(true)
    try {
      await onDelete(item.chatRoomId)
    } finally {
      setIsUpdating(false)
    }
    setIsDeleteModalOpen(false)
  }, [item.chatRoomId, onDelete])

  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        await handleEdit()
      }
    },
    [handleEdit],
  )

  useEffect(() => {
    if (titleRef.current) {
      // const isTruncated = titleRef.current.clientWidth > (titleRef.current.parentElement?.clientWidth ?? 0) - 40
      setIsTextTruncated(true) // TODO: 계산 필요
    }
  }, [item.title])

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setTooltipOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const tooltipActions = useMemo(
    () => [
      {
        name: '수정',
        icon: EditIcon,
        action: () => {
          setIsEditing(true)
          setTooltipOpen(false)
          setIsHover(false)
        },
      },
      {
        name: '삭제',
        icon: DeleteIcon,
        action: (e: MouseEvent<HTMLDivElement>) => {
          e.stopPropagation()
          setIsDeleteModalOpen(true)
          setTooltipOpen(false)
          setIsHover(false)
        },
      },
    ],
    [],
  )

  return (
    <>
      {isEditing ? (
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
            value={title}
            onKeyDown={handleKeyDown}
            autoFocus
            endAdornment={
              title ? (
                <InputAdornment
                  position="end"
                  sx={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
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
                    onClick={(e) => {
                      e.stopPropagation()
                      setTitle(item.title)
                      setIsEditing(false)
                    }}
                  >
                    <MIInputClearIcon />
                  </Box>
                </InputAdornment>
              ) : null
            }
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setTitle(e.target.value)
            }}
            onBlur={() => {
              setIsEditing(false)
            }}
          />
        </ListItemButton>
      ) : (
        <TitleTooltip
          title={item.title}
          placement="bottom-start"
          disableInteractive
          followCursor
          open={isTextTruncated && !tooltipOpen && isHover}
        >
          <ListItemButton
            selected={selected}
            onClick={() => {
              if (!disabled) {
                onSelected(item.chatRoomId)
              }
            }}
            sx={listItemButtonStyles}
            disableRipple
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            disabled={disabled}
          >
            <Typography ref={titleRef} variant="body4" sx={titleStyles}>
              {isUpdating ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MIAgentSpinner />
                </Box>
              ) : (
                item.title
              )}
            </Typography>
            {!isUpdating && isHover && (
              <HtmlTooltip
                open={tooltipOpen}
                onClose={() => setTooltipOpen(false)}
                title={
                  <Box
                    ref={tooltipRef}
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
                <Box
                  sx={moreIconStyles}
                  onClick={(e) => {
                    e.stopPropagation()
                    setTooltipOpen(!tooltipOpen)
                  }}
                >
                  <MoreIcon />
                </Box>
              </HtmlTooltip>
            )}
          </ListItemButton>
        </TitleTooltip>
      )}
      <MIConfirm
        open={isDeleteModalOpen}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('채팅을 삭제하시겠습니까?')}
          </>
        }
        width={450}
        zIndex={1600}
        handleClose={() => {
          setIsDeleteModalOpen(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsDeleteModalOpen(false)
            },
            disabled: isUpdating,
          },
          {
            label: t('삭제'),
            variant: 'filled',
            color: '#F03E3E',
            hoverBgColor: '#BD3D37',
            onClick: handleDelete,
            disabled: isUpdating,
          },
        ]}
        disableClose={isUpdating}
      >
        {t('삭제된 내용은 되돌릴 수 없습니다.')}
      </MIConfirm>
    </>
  )
}

export default MIAgentHistoryItem
