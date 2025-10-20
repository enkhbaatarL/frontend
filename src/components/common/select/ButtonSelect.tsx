import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { Button, Box, Typography, Stack, Switch, ButtonProps, Paper, ClickAwayListener, PaperProps } from '@mui/material'
import { ReactNode, useMemo, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import CheckIcon from '@/components/common/icons/agent/CheckIcon'

export type DashboardMultipleSelectType = 'default' | 'switch' | 'none'

export interface DashboardSelectItem {
  label: ReactNode
  value: string
  disabled?: boolean
}

interface Props extends ButtonProps {
  variant?: 'text' | 'outlined' | 'contained'
  selectType?: DashboardMultipleSelectType
  multiple?: boolean
  selected: string | string[]
  onSelected: ((selected: string) => void) | ((selected: string[]) => void)
  items: DashboardSelectItem[]
  placeholder?: string
  menuPosition?: 'left' | 'right'
  menuPositionOffset?: number
  fitMenuWidth?: boolean
  paperProps?: PaperProps
}

const ButtonSelect = ({
  variant = 'text',
  selected,
  onSelected,
  items,
  selectType = 'default',
  multiple = false,
  placeholder = '선택하세요',
  menuPosition = 'right',
  menuPositionOffset = 0,
  fitMenuWidth = true,
  paperProps,
  ...props
}: Props) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [menuStyles, setMenuStyles] = useState<{ top: number; left?: number; right?: number; width?: number }>({
    top: 0,
  })

  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setOpen(false)
      setIsPositioned(false)
      setIsClosing(false)
    }, 150)
  }

  const handleClick = () => {
    if (open) {
      handleClose()
    } else {
      setOpen(true)
      setIsClosing(false)
    }
  }

  useEffect(() => {
    if (!open || !buttonRef.current) {
      return undefined
    }

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) {
        const styles: { top: number; left?: number; right?: number; width?: number } = {
          top: rect.bottom,
        }

        if (menuPosition === 'left') {
          styles.left = rect.left + menuPositionOffset
        } else {
          styles.right = window.innerWidth - rect.right + menuPositionOffset
        }

        if (fitMenuWidth) {
          styles.width = rect.width - 2
        }

        setMenuStyles(styles)
        setIsPositioned(true)
      }
    }

    updatePosition()

    const handelScrollClose = () => {
      updatePosition()
      if (open && !isClosing) {
        handleClose()
      }
    }

    window.addEventListener('scroll', handelScrollClose, true)
    window.addEventListener('resize', handelScrollClose)

    return () => {
      window.removeEventListener('scroll', handelScrollClose, true)
      window.removeEventListener('resize', handelScrollClose)
    }
  }, [open, menuPosition, menuPositionOffset, fitMenuWidth, isClosing])

  const handleMultipleToggle = (value: string) => {
    const currentArray = Array.isArray(selected) ? selected : [selected]
    const newArray = currentArray.includes(value) ? currentArray.filter((item) => item !== value) : [...currentArray, value]
    ;(onSelected as (selected: string[]) => void)(newArray)
  }

  const handleSingleSelect = (value: string) => {
    ;(onSelected as (selected: string) => void)(value)
    handleClose()
  }

  const handleToggle = multiple ? handleMultipleToggle : handleSingleSelect

  const selectedItemsLabel = useMemo(() => {
    if (!multiple) {
      return (
        items.find((item) => item.value === selected)?.label ?? (
          <Typography variant="body2M14" color="gray.50">
            {placeholder}
          </Typography>
        )
      )
    }

    const selectedItems = items.filter((item) => selected.includes(item.value))
    if (selectedItems.length === 0) return placeholder
    if (selectedItems.length > 2) {
      return (
        <>
          {selectedItems.slice(0, 2).map(({ label, value }, index) => (
            <span key={value}>
              {label}
              {index < 1 && t('common.comma')}
            </span>
          ))}{' '}
          {t('common.andMore')}
        </>
      )
    }
    return selectedItems.map(({ label, value }, index) => (
      <span key={value}>
        {label}
        {index < selectedItems.length - 1 && t('common.comma')}
      </span>
    ))
  }, [selected, items, placeholder, t, multiple])

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

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack direction="row" alignItems="center">
        <Button
          ref={buttonRef}
          onClick={handleClick}
          endIcon={open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          variant={variant}
          disableRipple={variant === 'outlined'}
          {...props}
          sx={{
            padding: '8px 10px',
            height: '40px',
            justifyContent: 'space-between',
            textTransform: 'none',
            '&:disabled': {
              backgroundColor: props.disabled && variant === 'text' ? 'transparent' : undefined,
            },
            border: variant === 'outlined' ? '1px solid #DEE2E6' : 'none',
            '&:hover': {
              backgroundColor: variant === 'outlined' ? 'transparent' : undefined,
              border: variant === 'outlined' ? '1px solid #DEE2E6' : 'none',
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
            }}
          >
            {selectedItemsLabel}
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
              left: menuStyles.left !== undefined ? `${menuStyles.left}px` : 'auto',
              right: menuStyles.right !== undefined ? `${menuStyles.right}px` : 'auto',
              minWidth: menuStyles.width !== undefined ? `${menuStyles.width}px` : 'auto',
              zIndex: 900,
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'gray.20',
              opacity: menuOpacity,
              transition: menuTransition,
              userSelect: 'none',
              ...paperProps?.sx,
            }}
          >
            <Stack gap="8px" sx={{ padding: '12px' }}>
              {items.map(({ label, value, disabled }) => {
                const isSelected = selected.includes(value)

                return (
                  <Box
                    key={value}
                    onClick={() => (disabled ? null : handleToggle(value))}
                    borderRadius="10px"
                    sx={{
                      padding: '6px 12px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      '&:hover': {
                        backgroundColor: disabled ? 'transparent' : 'gray.10',
                      },
                      textWrap: 'nowrap',
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      width="100%"
                      minWidth={(props.sx as Record<string, unknown>)?.minWidth as string | number}
                      gap="12px"
                      component="div"
                    >
                      <Typography
                        variant="body2M14"
                        color={isSelected ? 'gray.70' : 'gray.60'}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                      >
                        {label}
                      </Typography>
                      {selectType === 'default' && !multiple && (
                        <Box width="20px" height="20px">
                          {isSelected && <CheckIcon fill="gray.70" />}
                        </Box>
                      )}
                      {selectType === 'switch' && (
                        <Switch
                          checked={isSelected}
                          size="small"
                          disabled={disabled}
                          sx={{
                            margin: 0,
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                )
              })}
            </Stack>
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  )
}

export default ButtonSelect
