import { Box, Typography, useTheme } from '@mui/material'
import { useState, useEffect, useRef } from 'react'

import MIAgentToggleSetting, { MIAgentToggleSettingOption } from './MIAgentToggleSetting'

import SettingIcon from '@/components/common/icons/SettingIcon'

export interface MIAgentToggleSettingItem {
  id: string
  title: string
  subtitle: string
  checked: boolean
  onChange: (checked: boolean) => void
  onChangeSelectedItem: (item: MIAgentToggleSettingItem) => void
}

export interface MIAgentInputBoxDropdownProps {
  isOpen?: boolean
  disabled?: boolean
  onOpenChange?: (isOpen: boolean) => void
  onChangeSelectedItem: (item: MIAgentToggleSettingOption) => void
  settingsItems?: MIAgentToggleSettingOption[]
  selectedItem: MIAgentToggleSettingOption
  modePosition?: 'top' | 'bottom'
}

const MIAgentInputBoxDropdown = ({
  isOpen = false,
  onOpenChange,
  settingsItems = [],
  disabled,
  selectedItem,
  onChangeSelectedItem,
  modePosition = 'bottom',
}: MIAgentInputBoxDropdownProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(isOpen)
  const [isHovered, setIsHovered] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()

  // Sync with external isOpen prop
  useEffect(() => {
    setIsDropdownOpen(isOpen)
  }, [isOpen])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        onOpenChange?.(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, onOpenChange])

  const handleToggleDropdown = () => {
    const newState = !isDropdownOpen

    setIsDropdownOpen(newState)
    onOpenChange?.(newState)
  }

  return (
    <Box ref={dropdownRef} sx={{ position: 'relative', width: 'fit-content', pointerEvents: disabled ? 'none' : 'initial' }}>
      <Box
        sx={{
          borderRadius: '100px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          paddingX: '8px',
          paddingY: '7px',
          border: '1px solid',
          borderColor: isHovered
            ? 'contentBorder.Hover'
            : isDropdownOpen
              ? 'contentBorder.Primaryactive'
              : disabled
                ? 'contentBorder.Disabled'
                : 'contentBorder.Normal',
          '&:hover': {
            cursor: 'pointer',
          },
          transition: 'border-color 0.2s ease',
          width: '90px',
          height: '34px',
          boxSizing: 'border-box',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleToggleDropdown}
        color={
          isHovered
            ? 'contentIcon.Hover'
            : isDropdownOpen
              ? 'contentIcon.Activeb'
              : disabled
                ? 'contentIcon.Disabled'
                : 'contentIcon.Enabled'
        }
      >
        <SettingIcon />
        <Typography variant="body2R14">Source</Typography>
      </Box>

      {isDropdownOpen && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: modePosition === 'bottom' ? '42px' : 'unset',
            bottom: modePosition === 'bottom' ? 'unset' : '42px',
            width: '244px',
            borderRadius: '12px',
            border: `1px solid ${theme.palette.grey[300]}`,
            background: theme.palette.background.paper,
            boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.10)',
            zIndex: 1000,
            padding: '10px 12px',
            boxSizing: 'border-box',
          }}
        >
          <MIAgentToggleSetting items={settingsItems} selectedItem={selectedItem} onChangeSelectedItem={onChangeSelectedItem} />
        </Box>
      )}
    </Box>
  )
}

export default MIAgentInputBoxDropdown
