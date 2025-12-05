import ToggleButton, { ToggleButtonProps } from '@mui/material/ToggleButton'
import ToggleButtonGroup, { ToggleButtonGroupProps } from '@mui/material/ToggleButtonGroup'
import { ReactNode } from 'react'

export interface MIToggleButtonOption {
  label: ReactNode
  value: string
  disabled?: boolean
}

interface Props extends ToggleButtonGroupProps {
  options: MIToggleButtonOption[]
  toggleButtonProps?: ToggleButtonProps
  enableHoverBackground?: boolean
}

const MIToggleButton = ({ options, toggleButtonProps, enableHoverBackground = false, onChange, value, ...props }: Props) => {
  const { sx: toggleButtonSx, ...restToggleButtonProps } = toggleButtonProps ?? {}

  const getHoverBackgroundColor = () => {
    if (!enableHoverBackground) return undefined
    return 'contentBG.Active'
  }
  const hoverBackgroundColor = getHoverBackgroundColor()

  const handleChange = (event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    // exclusive 모드에서 재 선택시 null 처리 방지
    if (newValue === null && value !== undefined) {
      return
    }
    onChange?.(event, newValue)
  }

  return (
    <ToggleButtonGroup
      exclusive
      aria-label="text alignment"
      disabled={options.every((option) => option.disabled)}
      value={value}
      onChange={handleChange}
      {...props}
      sx={{
        '& .MuiToggleButton-root': {
          padding: '8px 10px',
          height: '40px',
          textTransform: 'none',
          borderRadius: 0,
          borderWidth: '1px',
          borderColor: 'contentBorder.Normal',
          transition: 'background-color 0.15s ease-in-out, border-color 0.4s ease-in-out',
          '&:first-of-type': {
            borderTopLeftRadius: '10px',
            borderBottomLeftRadius: '10px',
          },
          '&:last-of-type': {
            borderTopRightRadius: '10px',
            borderBottomRightRadius: '10px',
          },
          '&:hover:not(:disabled)': {
            backgroundColor: hoverBackgroundColor ?? 'transparent',
            borderColor: hoverBackgroundColor ? 'contentBorder.Active' : 'contentBorder.Normal',
            borderWidth: '1px',
          },
          '&.Mui-selected': {
            backgroundColor: 'contentBG.Active',
            borderColor: 'contentBorder.Normal',
            '&:hover': {
              backgroundColor: 'contentBG.Active',
              borderColor: 'contentBorder.Normal',
            },
          },
          '&:disabled': {
            borderColor: 'contentBorder.Disabled',
            backgroundColor: 'transparent',
          },
          ...(toggleButtonSx as Record<string, unknown>),
        },
        ...props.sx,
      }}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          aria-label={option.label as string}
          disabled={option.disabled}
          disableRipple
          {...restToggleButtonProps}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

export default MIToggleButton
