import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { MenuItem, Button, Menu, Box, Typography, Stack, Switch } from '@mui/material'
import { Dispatch, SetStateAction, useMemo, useRef, useState } from 'react'

export type DashboardMultipleSelectType = 'default' | 'switch'

export interface DashboardSelectItem {
  label: string
  value: string
  disabled?: boolean
}

interface Props {
  type?: DashboardMultipleSelectType
  selectedItems: string[]
  setSelectedItems: Dispatch<SetStateAction<string[]>>
  items: DashboardSelectItem[]
}

const DashboardSelect = ({ selectedItems, setSelectedItems, items, type = 'default' }: Props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const menuAnchorRef = useRef<HTMLDivElement>(null)

  const handleClick = () => setAnchorEl(menuAnchorRef.current)
  const handleClose = () => setAnchorEl(null)

  const handleToggle = (value: string) => {
    setSelectedItems((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const selectedItemsLabel = useMemo(() => {
    const selectedLabels = items.filter((item) => selectedItems.includes(item.value)).map(({ label }) => label)
    if (selectedLabels.length > 2) return `${selectedLabels.slice(0, 2).join(', ')} and more`
    return selectedLabels.join(', ')
  }, [selectedItems, items])

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
              marginLeft: '-100px',
            },
          },
          list: {
            style: {
              padding: '8px 0',
            },
          },
        }}
      >
        {items.map(({ label, value, disabled }) => (
          <MenuItem
            key={value}
            onClick={() => (disabled ? null : handleToggle(value))}
            sx={{
              padding: '8px 12px',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap="12px" component="div">
              <Typography variant="body2M14">{label}</Typography>
              {type === 'switch' && (
                <Switch
                  checked={selectedItems.includes(value)}
                  size="small"
                  disabled={disabled}
                  sx={{
                    margin: 0,
                  }}
                />
              )}
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default DashboardSelect
