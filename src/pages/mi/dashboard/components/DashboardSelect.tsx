import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { MenuItem, Button, Menu, Box, Typography, Stack, Switch } from '@mui/material'
import { Dispatch, SetStateAction, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import CheckIcon from '@/components/common/icons/agent/CheckIcon'

export type DashboardMultipleSelectType = 'default' | 'switch'

export interface DashboardSelectItem {
  label: string
  value: string
  disabled?: boolean
}

interface Props {
  type?: DashboardMultipleSelectType
  multiple?: boolean
  selectedItems: string[]
  setSelectedItems: Dispatch<SetStateAction<string[]>>
  items: DashboardSelectItem[]
  placeholder?: string
}

const DashboardSelect = ({
  selectedItems,
  setSelectedItems,
  items,
  type = 'default',
  multiple = false,
  placeholder = '선택하세요',
}: Props) => {
  const { t } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const menuAnchorRef = useRef<HTMLDivElement>(null)

  const handleClick = () => setAnchorEl(menuAnchorRef.current)
  const handleClose = () => setAnchorEl(null)

  const handleMultipleToggle = (value: string) => {
    setSelectedItems((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const handleSingleSelect = (value: string) => {
    setSelectedItems([value])
    handleClose()
  }

  const handleToggle = multiple ? handleMultipleToggle : handleSingleSelect

  const selectedItemsLabel = useMemo(() => {
    const selectedLabels = items.filter((item) => selectedItems.includes(item.value)).map(({ label }) => label)
    if (selectedLabels.length === 0) return placeholder
    if (selectedLabels.length > 2) return `${selectedLabels.slice(0, 2).join(t('common.comma'))} ${t('common.andMore')}`
    return selectedLabels.join(t('common.comma'))
  }, [selectedItems, items, placeholder, t])

  return (
    <Box>
      <Stack direction="row" alignItems="center">
        <Button
          onClick={handleClick}
          endIcon={open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          variant="text"
          sx={{
            padding: '8px 10px',
            height: '40px',
            justifyContent: 'space-between',
            textTransform: 'none',
          }}
        >
          <Typography variant="body2SB14">{selectedItemsLabel}</Typography>
        </Button>
        <Box ref={menuAnchorRef} />
      </Stack>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              minWidth: 150,
              marginTop: '20px',
              marginLeft: '-110px',
            },
          },
          list: {
            style: {
              padding: '8px 0',
            },
          },
        }}
      >
        {items.map(({ label, value, disabled }) => {
          const isSelected = selectedItems.includes(value)

          return (
            <MenuItem
              key={value}
              onClick={() => (disabled ? null : handleToggle(value))}
              sx={{
                padding: '8px 12px',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap="12px" component="div">
                <Typography variant="body2M14" color={isSelected ? 'gray.70' : 'gray.60'}>
                  {label}
                </Typography>
                {type === 'switch' && (
                  <Switch
                    checked={isSelected}
                    size="small"
                    disabled={disabled}
                    sx={{
                      margin: 0,
                    }}
                  />
                )}
                {type !== 'switch' && !multiple && isSelected && <CheckIcon style={{ color: 'gray.70' }} />}
              </Stack>
            </MenuItem>
          )
        })}
      </Menu>
    </Box>
  )
}

export default DashboardSelect
