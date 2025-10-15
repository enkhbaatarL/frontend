import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { Button, Box, Typography, Stack, Switch, ButtonProps, Paper, ClickAwayListener, PaperProps } from '@mui/material'
import { ReactNode, useMemo, useRef, useState } from 'react'
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

const DashboardSelect = ({
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

  const menuAnchorRef = useRef<HTMLDivElement>(null)

  const handleClick = () => setOpen(!open)
  const handleClose = () => setOpen(false)

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

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack direction="row" alignItems="center">
        <Button
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
        <Box ref={menuAnchorRef} />
      </Stack>
      {open && (
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            {...paperProps}
            sx={{
              position: 'absolute',
              top: '100%',
              left: menuPosition === 'left' ? 0 + menuPositionOffset : 'auto',
              right: menuPosition === 'right' ? 0 + menuPositionOffset : 'auto',
              zIndex: 1300,
              minWidth: fitMenuWidth ? 'calc(100% - 2px)' : 'auto',
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'gray.20',
              ...paperProps?.sx,
            }}
          >
            <Box sx={{ padding: '8px 0' }}>
              {items.map(({ label, value, disabled }) => {
                const isSelected = selected.includes(value)

                return (
                  <Box
                    key={value}
                    onClick={() => (disabled ? null : handleToggle(value))}
                    sx={{
                      padding: '8px 12px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      '&:hover': {
                        backgroundColor: disabled ? 'transparent' : 'gray.10',
                      },
                      textWrap: 'nowrap',
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap="12px" component="div">
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
                      {selectType === 'default' && !multiple && isSelected && <CheckIcon style={{ color: 'gray.70' }} />}
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
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  )
}

export default DashboardSelect
