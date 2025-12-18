import { Box, Stack, Paper, ClickAwayListener, PaperProps, Popper, Grow } from '@mui/material'
import { useRef, useEffect, useCallback, ReactNode, useMemo, SyntheticEvent, KeyboardEvent } from 'react'

import MIBaseButton, { MIBaseButtonProps } from '@/components/common/button/MIBaseButton'

export interface MenuPositionOffset {
  top?: number
  left?: number
  right?: number
  bottom?: number
}

export interface MIMenuProps extends MIBaseButtonProps {
  label?: ReactNode
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  menuPositionOffset?: MenuPositionOffset
  fadeIn?: 'left' | 'right' | 'center'
  paperProps?: PaperProps
  children?: ReactNode
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  closeOnScroll?: boolean
  disablePortal?: boolean
}

const MIMenu = ({
  label,
  variant = 'text',
  buttonHoverBgColor,
  placement = 'bottom-start',
  menuPositionOffset = {},
  fadeIn,
  paperProps,
  children,
  onClose,
  open,
  onOpenChange,
  closeOnScroll = false,
  disablePortal = false,
  enableHoverBackground = false,
  ...props
}: MIMenuProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const prevOpen = useRef(open)

  const handleToggle = () => {
    const newOpen = !open
    onOpenChange?.(newOpen)
    if (!newOpen) {
      onClose?.()
    }
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
      onClose?.()
    } else if (event.key === 'Escape') {
      onOpenChange?.(false)
      onClose?.()
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

  const getTransformOrigin = (popperPlacement: string) => {
    const isTop = popperPlacement.startsWith('top')

    let horizontalOrigin = 'center'
    let verticalOrigin

    if (fadeIn) {
      if (fadeIn === 'left') horizontalOrigin = 'left'
      else if (fadeIn === 'right') horizontalOrigin = 'right'
      if (isTop) verticalOrigin = 'bottom'
      else verticalOrigin = 'top'
    } else {
      if (popperPlacement.includes('start')) horizontalOrigin = 'left'
      else if (popperPlacement.includes('end')) horizontalOrigin = 'right'

      if (isTop) verticalOrigin = 'bottom'
      else verticalOrigin = 'top'
    }

    return `${horizontalOrigin} ${verticalOrigin}`
  }

  const menuWidth =
    props.sx && typeof props.sx === 'object' && !Array.isArray(props.sx)
      ? ((props.sx as Record<string, unknown>)?.width as string | number | undefined)
      : undefined

  const popperModifiers = useMemo(() => {
    const modifiers: Array<Record<string, unknown>> = []

    const { top = variant === 'outlined' ? 6 : 2, left = 0, right = 0, bottom = variant === 'outlined' ? 6 : 2 } = menuPositionOffset

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
  }, [menuPositionOffset, placement, variant])

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack direction="row" alignItems="center">
        <MIBaseButton
          ref={buttonRef}
          variant={variant}
          buttonHoverBgColor={buttonHoverBgColor}
          open={open}
          onClick={handleToggle}
          enableHoverBackground={enableHoverBackground}
          {...props}
        >
          {label}
        </MIBaseButton>
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
                ...paperProps?.sx,
                ...(menuWidth && { minWidth: menuWidth }),
                boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.1)',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: variant === 'outlined' ? 'contentBorder.Normal' : 'gray.20',
                userSelect: 'none',
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
