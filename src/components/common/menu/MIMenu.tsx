import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { Button, Box, Typography, Stack, ButtonProps, Paper, ClickAwayListener, PaperProps, Popper, Grow } from '@mui/material'
import { useRef, useEffect, useCallback, ReactNode, useMemo, SyntheticEvent, KeyboardEvent } from 'react'

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
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  menuPositionOffset?: MenuPositionOffset
  paperProps?: PaperProps
  children?: ReactNode
  onClose?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  closeOnScroll?: boolean
  disablePortal?: boolean
}

const MIMenu = ({
  label,
  displayType = 'button',
  variant = 'text',
  placement = 'bottom-start',
  menuPositionOffset = {},
  paperProps,
  children,
  onClose,
  open,
  onOpenChange,
  closeOnScroll = false,
  disablePortal = false,
  ...props
}: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const prevOpen = useRef(open)

  const handleToggle = () => {
    onOpenChange?.(!open)
  }

  const handleClose = useCallback(
    (event?: Event | SyntheticEvent) => {
      if (buttonRef.current?.contains(event?.target as HTMLElement)) {
        return
      }
      onOpenChange?.(false)
      onClose?.()
    },
    [onOpenChange, onClose],
  )

  const handleListKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      onOpenChange?.(false)
    } else if (event.key === 'Escape') {
      onOpenChange?.(false)
    }
  }

  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      buttonRef.current?.focus()
    }
    prevOpen.current = open
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const handleScroll = () => {
      if (closeOnScroll) {
        handleClose()
      }
    }

    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, handleClose, closeOnScroll])

  const getBorderColor = () => {
    if (variant !== 'outlined') return undefined
    return open ? 'contentBorder.Active' : 'contentBorder.Normal'
  }

  const getHoverBackgroundColor = () => {
    if (variant !== 'outlined') return undefined
    return open ? 'contentBG.Active' : 'transparent'
  }

  const borderColor = getBorderColor()
  const hoverBackgroundColor = getHoverBackgroundColor()

  const getEndIcon = () => {
    if (displayType !== 'select') return undefined
    return open ? <KeyboardArrowUp /> : <KeyboardArrowDown />
  }

  const getTransformOrigin = (popperPlacement: string) => {
    if (popperPlacement === 'bottom-start') return 'left top'
    if (popperPlacement === 'bottom-end') return 'right top'
    if (popperPlacement === 'top-start') return 'left bottom'
    return 'right bottom'
  }

  const popperModifiers = useMemo(() => {
    const modifiers: Array<Record<string, unknown>> = []

    const { top = 6, left = 0, right = 0, bottom = 6 } = menuPositionOffset

    let skidding = 0
    let distance = 0

    if (placement.startsWith('bottom')) {
      distance = top
      skidding = left === 0 ? -right : left
    } else if (placement.startsWith('top')) {
      distance = bottom
      skidding = left === 0 ? -right : left
    }

    modifiers.push({
      name: 'offset',
      options: {
        offset: [skidding, distance],
      },
    })

    return modifiers
  }, [menuPositionOffset, placement])

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack direction="row" alignItems="center">
        <Button
          ref={buttonRef}
          onClick={handleToggle}
          endIcon={getEndIcon()}
          variant={variant}
          disableRipple={variant === 'outlined'}
          aria-controls={open ? 'mi-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          {...props}
          sx={{
            padding: displayType === 'select' ? '8px 10px' : '8px',
            height: '40px',
            justifyContent: 'space-between',
            textTransform: 'none',
            backgroundColor: open ? 'contentBG.Active' : undefined,
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
          {typeof label === 'string' ? (
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
          ) : (
            label
          )}
        </Button>
      </Stack>
      <Popper
        open={open ?? false}
        anchorEl={buttonRef.current}
        role={undefined}
        placement={placement}
        transition
        disablePortal={disablePortal ?? false}
        sx={{ zIndex: 900 }}
        modifiers={popperModifiers}
      >
        {({ TransitionProps, placement: popperPlacement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: getTransformOrigin(popperPlacement),
            }}
          >
            <Paper
              {...paperProps}
              sx={{
                boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.1)',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: variant === 'outlined' ? 'contentBorder.Normal' : 'gray.20',
                userSelect: 'none',
                ...paperProps?.sx,
              }}
            >
              <ClickAwayListener onClickAway={handleClose} mouseEvent="onMouseDown" touchEvent="onTouchStart">
                <Box id="mi-menu" aria-labelledby={props.id ?? 'mi-menu-button'} onKeyDown={handleListKeyDown}>
                  {children}
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  )
}

export default MIMenu
