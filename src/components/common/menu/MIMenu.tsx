import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { Button, Box, Typography, Stack, ButtonProps, Paper, ClickAwayListener, PaperProps } from '@mui/material'
import { useRef, useState, useEffect, useCallback, ReactNode } from 'react'

export interface MenuPositionOffset {
  top?: number
  left?: number
  right?: number
  bottom?: number
}

interface Props extends ButtonProps {
  label?: ReactNode
  displayType?: 'button' | 'select'
  variant?: 'text' | 'outlined' | 'contained'
  menuPosition?: 'left' | 'right'
  menuPositionOffset?: MenuPositionOffset
  fitMenuWidth?: boolean
  paperProps?: PaperProps
  children?: ReactNode
  onClose?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const MIMenu = ({
  label,
  displayType = 'button',
  variant = 'text',
  menuPosition = 'left',
  menuPositionOffset = {},
  fitMenuWidth = true,
  paperProps,
  children,
  onClose,
  open: controlledOpen,
  onOpenChange,
  ...props
}: Props) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const [isPositioned, setIsPositioned] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [menuStyles, setMenuStyles] = useState<{ top: number; left?: number; right?: number; width?: number }>({
    top: 0,
  })

  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      if (controlledOpen === undefined) {
        setInternalOpen(false)
      } else {
        onOpenChange?.(false)
      }
      setIsPositioned(false)
      setIsClosing(false)
      onClose?.()
    }, 150)
  }, [controlledOpen, onOpenChange, onClose])

  const handleClick = () => {
    if (open) {
      handleClose()
    } else {
      if (controlledOpen === undefined) {
        setInternalOpen(true)
      } else {
        onOpenChange?.(true)
      }
      setIsClosing(false)
    }
  }

  useEffect(() => {
    if (!open || !buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const styles: { top: number; left?: number; right?: number; width?: number } = {
      top: rect.bottom + (menuPositionOffset.top ?? 8),
    }

    if (menuPosition === 'left') {
      styles.left = rect.left + (menuPositionOffset.left ?? 0)
    } else {
      styles.right = window.innerWidth - rect.right + (menuPositionOffset.right ?? 0)
    }

    if (fitMenuWidth) {
      styles.width = rect.width - 2
    }

    setMenuStyles(styles)
    setIsPositioned(true)
  }, [open, menuPosition, fitMenuWidth, menuPositionOffset.top, menuPositionOffset.left, menuPositionOffset.right])

  useEffect(() => {
    if (!open) return undefined

    const handleScrollClose = () => {
      if (open && !isClosing) {
        handleClose()
      }
    }

    const handleResize = () => {
      if (!buttonRef.current) return

      const rect = buttonRef.current.getBoundingClientRect()
      const styles: { top: number; left?: number; right?: number; width?: number } = {
        top: rect.bottom + (menuPositionOffset.top ?? 8),
      }

      if (menuPosition === 'left') {
        styles.left = rect.left + (menuPositionOffset.left ?? 0)
      } else {
        styles.right = window.innerWidth - rect.right + (menuPositionOffset.right ?? 0)
      }

      if (fitMenuWidth) {
        styles.width = rect.width - 2
      }

      setMenuStyles(styles)
    }

    window.addEventListener('scroll', handleScrollClose, true)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScrollClose, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [open, isClosing, handleClose, menuPosition, fitMenuWidth, menuPositionOffset.top, menuPositionOffset.left, menuPositionOffset.right])

  const getMenuOpacity = () => {
    if (isClosing) return 0
    if (isPositioned) return 1
    return 0
  }

  const getMenuTransition = () => {
    if (isClosing) return 'opacity 0.15s ease-out'
    if (isPositioned) return 'opacity 0.1s ease-in'
    return 'none'
  }

  const menuOpacity = getMenuOpacity()
  const menuTransition = getMenuTransition()

  const getBorderColor = () => {
    if (variant !== 'outlined') return undefined
    return open && !isClosing ? 'contentBorder.Active' : 'contentBorder.Normal'
  }

  const getHoverBackgroundColor = () => {
    if (variant !== 'outlined') return undefined
    return open && !isClosing ? 'contentBG.Active' : 'transparent'
  }

  const borderColor = getBorderColor()
  const hoverBackgroundColor = getHoverBackgroundColor()

  const getEndIcon = () => {
    if (displayType !== 'select') return undefined
    return open && !isClosing ? <KeyboardArrowUp /> : <KeyboardArrowDown />
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack direction="row" alignItems="center">
        <Button
          ref={buttonRef}
          onClick={handleClick}
          endIcon={getEndIcon()}
          variant={variant}
          disableRipple={variant === 'outlined'}
          {...props}
          sx={{
            padding: displayType === 'select' ? '8px 10px' : '8px',
            height: '40px',
            justifyContent: 'space-between',
            textTransform: 'none',
            backgroundColor: open && !isClosing ? 'contentBG.Active' : undefined,
            transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
            '&:disabled': {
              backgroundColor: props.disabled && variant === 'text' ? 'transparent' : undefined,
            },
            borderColor,
            borderWidth: '1px',
            borderRadius: '10px',
            '&:hover': {
              backgroundColor: hoverBackgroundColor,
              borderColor,
              borderWidth: '1px',
            },
            '& .MuiButton-endIcon': {
              marginRight: '2px',
            },
            ...props.sx,
          }}
        >
          <Typography
            variant="body2SB14"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {label}
          </Typography>
        </Button>
      </Stack>
      {open && (
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            {...paperProps}
            sx={{
              position: 'fixed',
              top: `${menuStyles.top}px`,
              left: menuStyles.left === undefined ? 'auto' : `${menuStyles.left}px`,
              right: menuStyles.right === undefined ? 'auto' : `${menuStyles.right}px`,
              minWidth: menuStyles.width === undefined ? 'auto' : `${menuStyles.width}px`,
              zIndex: 900,
              boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.1)',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: variant === 'outlined' ? 'contentBorder.Normal' : 'gray.20',
              opacity: menuOpacity,
              transition: menuTransition,
              userSelect: 'none',
              ...paperProps?.sx,
            }}
          >
            {children}
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  )
}

export default MIMenu
