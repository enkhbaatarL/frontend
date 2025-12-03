import ErrorIcon from '@mui/icons-material/Error'
import { ListItemButton, Typography, styled, TooltipProps, Tooltip, tooltipClasses, Box, Input, InputAdornment } from '@mui/material'
import { useMemo, useState, useRef, useEffect, useCallback, KeyboardEvent, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import DeleteIcon from '@/components/common/icons/agent/DeleteIcon'
import EditIcon from '@/components/common/icons/agent/EditIcon'
import MoreIcon from '@/components/common/icons/agent/MoreIcon'
import MIInputClearIcon from '@/components/common/input/MIInputClearIcon'
import MIDropdownMenu, { DropdownMenuItem } from '@/components/common/menu/MIDropdownMenu'
import { IChatRoomRes } from '@/service/mi/agent'

interface Props {
  selected?: boolean
  item: IChatRoomRes
  onSelected: (id: string) => void
  onEditTitle: (chatId: string, newTitle: string) => Promise<void>
  onDelete: (chatId: string) => Promise<void>
  disabled?: boolean
}

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
  const { t } = useTranslation()
  const titleRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState(item.title)
  const [isEditing, setIsEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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

  const menuItems = useMemo<DropdownMenuItem[]>(
    () => [
      {
        label: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box sx={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EditIcon />
            </Box>
            <Typography color="contentText.Normal" variant="body2R14">
              {t('common.edit')}
            </Typography>
          </Box>
        ),
        action: () => {
          setIsEditing(true)
          setMenuOpen(false)
          setIsHover(false)
        },
      },
      {
        label: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box sx={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DeleteIcon />
            </Box>
            <Typography color="contentText.Normal" variant="body2R14">
              {t('common.delete')}
            </Typography>
          </Box>
        ),
        action: () => {
          setIsDeleteModalOpen(true)
          setMenuOpen(false)
          setIsHover(false)
        },
      },
    ],
    [t],
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
            placeholder={t('common.defaultPlaceholder')}
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
          open={isTextTruncated && !menuOpen && isHover}
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
            {!isUpdating && (isHover || menuOpen) && (
              <Box
                onClick={(e) => {
                  e.stopPropagation()
                }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <MIDropdownMenu
                  items={menuItems}
                  label={
                    <Box sx={moreIconStyles}>
                      <MoreIcon />
                    </Box>
                  }
                  variant="text"
                  placement="bottom-start"
                  menuPositionOffset={{ top: -42, left: 42 }}
                  zIndex={1500}
                  disablePortal={false}
                  groupDisplayType="none"
                  open={menuOpen}
                  onOpenChange={setMenuOpen}
                  paperProps={{
                    sx: {
                      minWidth: '110px',
                    },
                  }}
                  buttonHoverBgColor="transparent"
                  disableRipple
                />
              </Box>
            )}
          </ListItemButton>
        </TitleTooltip>
      )}
      <MIConfirm
        open={isDeleteModalOpen}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('mari.confirm.deleteChatRoom')}
          </>
        }
        width={450}
        zIndex={1600}
        handleClose={() => {
          setIsDeleteModalOpen(false)
        }}
        actions={[
          {
            label: t('common.cancel'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsDeleteModalOpen(false)
            },
            disabled: isUpdating,
          },
          {
            label: t('common.delete'),
            variant: 'filled',
            color: '#F03E3E',
            hoverBgColor: '#BD3D37',
            onClick: handleDelete,
            disabled: isUpdating,
          },
        ]}
        disableClose={isUpdating}
      >
        {t('mari.confirm.deleteChatRoomContent')}
      </MIConfirm>
    </>
  )
}

export default MIAgentHistoryItem
