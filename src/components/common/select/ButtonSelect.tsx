import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import {
  Button,
  Box,
  Typography,
  Stack,
  Switch,
  ButtonProps,
  Paper,
  ClickAwayListener,
  PaperProps,
  ListSubheader,
  Divider,
} from '@mui/material'
import { ReactNode, useMemo, useRef, useState, useEffect, useCallback, Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import CheckIcon from '@/components/common/icons/agent/CheckIcon'

export type DashboardMultipleSelectType = 'default' | 'switch' | 'none'

export interface ButtonSelectItem {
  label: ReactNode
  value: string
  disabled?: boolean
  group?: string
}

export type GroupDisplayType = 'label' | 'divider' | 'none'

export interface MenuPositionOffset {
  top?: number
  left?: number
  right?: number
  bottom?: number
}

interface Props extends ButtonProps {
  variant?: 'text' | 'outlined' | 'contained'
  selectType?: DashboardMultipleSelectType
  multiple?: boolean
  selected: string | string[]
  onSelected: ((selected: string) => void) | ((selected: string[]) => void)
  items: ButtonSelectItem[]
  placeholder?: string
  menuPosition?: 'left' | 'right'
  menuPositionOffset?: MenuPositionOffset
  fitMenuWidth?: boolean
  paperProps?: PaperProps
  groupDisplayType?: GroupDisplayType
  groupLabels?: { [groupKey: string]: ReactNode }
}

const ButtonSelect = ({
  variant = 'text',
  selected,
  onSelected,
  items,
  selectType = 'default',
  multiple = false,
  placeholder = '선택하세요',
  menuPosition = 'left',
  menuPositionOffset = {},
  fitMenuWidth = true,
  paperProps,
  groupDisplayType = 'label',
  groupLabels = {},
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

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setOpen(false)
      setIsPositioned(false)
      setIsClosing(false)
    }, 150)
  }, [])

  const handleClick = () => {
    if (open) {
      handleClose()
    } else {
      setOpen(true)
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

  const groupedItems = useMemo(() => {
    if (groupDisplayType === 'none') {
      return { groups: {}, ungroupedItems: items }
    }

    const groups: { [key: string]: ButtonSelectItem[] } = {}
    const ungroupedItems: ButtonSelectItem[] = []

    for (const item of items) {
      const groupKey = item.group
      if (groupKey) {
        if (!groups[groupKey]) {
          groups[groupKey] = []
        }
        groups[groupKey].push(item)
      } else {
        ungroupedItems.push(item)
      }
    }

    return { groups, ungroupedItems }
  }, [items, groupDisplayType])

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
            backgroundColor: open ? 'contentBG.Active' : undefined,
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
            <Stack gap="8px" sx={{ padding: '12px' }}>
              {groupDisplayType === 'divider' ? (
                <>
                  {groupedItems.ungroupedItems.map(({ label, value, disabled }) => {
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

                  {Object.entries(groupedItems.groups).map(([groupKey, groupItems], groupIndex) => (
                    <Fragment key={groupKey}>
                      {groupIndex > 0 && <Divider />}

                      {groupItems.map(({ label, value, disabled }) => {
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
                    </Fragment>
                  ))}
                </>
              ) : (
                <>
                  {groupedItems.ungroupedItems.map(({ label, value, disabled }) => {
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

                  {Object.entries(groupedItems.groups).map(([groupKey, groupItems]) => (
                    <Box key={groupKey}>
                      {groupDisplayType === 'label' && (
                        <ListSubheader
                          sx={{
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            color: 'gray.50',
                            fontSize: '12px',
                            fontWeight: 600,
                            lineHeight: 1.2,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {groupLabels[groupKey] || groupKey}
                        </ListSubheader>
                      )}

                      {groupItems.map(({ label, value, disabled }) => {
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
                    </Box>
                  ))}
                </>
              )}
            </Stack>
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  )
}

export default ButtonSelect
