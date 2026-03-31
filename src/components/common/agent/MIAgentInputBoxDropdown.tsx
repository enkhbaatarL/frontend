import { Box, Typography, Stack, Switch } from '@mui/material'

import SourceIcon from '@/components/common/icons/agent/SourceIcon'
import MIMenu from '@/components/common/menu/MIMenu'

export interface MIAgentToggleSettingOption {
  id: string
  title: string
  subtitle: string
  checked: boolean
  disabled?: boolean
}

export interface MIAgentInputBoxDropdownProps {
  isOpen?: boolean
  disabled?: boolean
  onOpenChange?: (isOpen: boolean) => void
  onChangeSelectedItem: (item: MIAgentToggleSettingOption) => void
  settingsItems?: MIAgentToggleSettingOption[]
}

const MIAgentInputBoxDropdown = ({
  isOpen = false,
  onOpenChange,
  settingsItems = [],
  disabled,
  onChangeSelectedItem,
}: MIAgentInputBoxDropdownProps) => (
  <Box sx={{ width: 'fit-content', pointerEvents: disabled ? 'none' : 'initial' }}>
    <MIMenu
      variant="outlined"
      open={isOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      zIndex={1600}
      sx={{
        padding: '8px 12px',
        borderRadius: '100px',
      }}
      label={
        <Stack direction="row" alignItems="center" gap="8px">
          <SourceIcon width={16} height={16} />
          <Typography variant="body2R14">Source</Typography>
        </Stack>
      }
    >
      <Stack padding="12px" gap="12px">
        {settingsItems.map((item) => (
          <Stack key={item.id} direction="row" alignItems="center" padding="4px 8px" gap="12px">
            <Stack minWidth={180}>
              <Typography variant="body2SB14" color="contentText.Black">
                {item.title}
              </Typography>
              <Typography variant="body2M14" color="contentText.Normal">
                {item.subtitle}
              </Typography>
            </Stack>
            <Switch
              size="small"
              checked={item.checked}
              disabled={item.disabled}
              onChange={() => {
                if (!item.disabled) {
                  onChangeSelectedItem(item)
                }
              }}
            />
          </Stack>
        ))}
      </Stack>
    </MIMenu>
  </Box>
)

export default MIAgentInputBoxDropdown
