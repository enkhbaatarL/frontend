import { Typography, Switch, Box, styled, SwitchProps } from '@mui/material'

// Custom styled switch to match the design
const CustomSwitch = styled((props: SwitchProps) => <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />)(
  ({ theme }) => ({
    width: 32,
    height: 20,
    padding: 0,
    margin: 0,
    '& .MuiSwitch-switchBase': {
      padding: 0,
      margin: 2,
      transitionDuration: '300ms',
      '&.Mui-checked': {
        transform: 'translateX(12px)',
        color: '#fff',
        '& + .MuiSwitch-track': {
          backgroundColor: theme.palette.commonColor.Primary,
          opacity: 1,
          border: 0,
        },
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 0.5,
        },
      },
      '&.Mui-focusVisible .MuiSwitch-thumb': {
        color: '#33cf4d',
        border: '6px solid #fff',
      },
      '&.Mui-disabled .MuiSwitch-thumb': {
        color: theme.palette.grey[100],
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.7,
      },
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: 16,
      height: 16,
    },
    '& .MuiSwitch-track': {
      borderRadius: 20 / 2,
      backgroundColor: theme.palette.gray['40'],
      opacity: 1,
      transition: theme.transitions.create(['background-color'], {
        duration: 500,
      }),
    },
  }),
)

export interface MIAgentToggleSettingOption {
  id: string
  title: string
  subtitle: string
  checked: boolean
  disabled?: boolean
}

export interface MIAgentToggleSettingProps {
  items: MIAgentToggleSettingOption[]
  onChangeSelectedItem: (item: MIAgentToggleSettingOption) => void
}

export interface MIAgentToggleSettingItemProps {
  item: MIAgentToggleSettingOption
  onToggleItem: (item: MIAgentToggleSettingOption) => void
}

const MIAgentToggleSettingItem = ({ item, onToggleItem }: MIAgentToggleSettingItemProps) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
      }}
    >
      <Typography
        variant="subtext3"
        sx={{
          textAlign: 'left',
          color: item.disabled ? 'contentText.Disabled' : 'contentText.Black',
        }}
      >
        {item.title}
      </Typography>
      <Typography
        variant="body3"
        color={item.disabled ? 'contentText.Disabled' : 'contentText.Normal'}
        sx={{
          textAlign: 'left',
        }}
      >
        {item.subtitle}
      </Typography>
    </Box>
    <CustomSwitch
      checked={item.checked}
      disabled={item.disabled}
      onChange={() => {
        if (!item.disabled) {
          onToggleItem(item)
        }
      }}
    />
  </Box>
)

const MIAgentToggleSetting = ({ items, onChangeSelectedItem }: MIAgentToggleSettingProps) => (
  <Box
    sx={{
      maxWidth: 400,
      boxShadow: 'none',
    }}
  >
    {items?.map((item, index) => (
      <Box
        key={item.id}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <MIAgentToggleSettingItem
          item={{
            ...item,
            disabled: item.disabled ?? false,
          }}
          onToggleItem={onChangeSelectedItem}
        />
        {index < items.length - 1 && (
          <Box sx={{ width: '100%', height: '0.5px', backgroundColor: 'contentBorder.Normal', marginY: '8px' }} />
        )}
      </Box>
    ))}
  </Box>
)

export default MIAgentToggleSetting
