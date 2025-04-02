import { Checkbox, CheckboxProps, FormControlLabel, SvgIcon, SvgIconProps, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { JSX, useState, ChangeEvent } from 'react'

// Custom SVG icons
const UncheckedIcon = (props: SvgIconProps): JSX.Element => (
  <SvgIcon {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 4H16C18.2091 4 20 5.79086 20 8V16C20 18.2091 18.2091 20 16 20H8C5.79086 20 4 18.2091 4 16V8C4 5.79086 5.79086 4 8 4ZM8 6C6.89543 6 6 6.89543 6 8V16C6 17.1046 6.89543 18 8 18H16C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H8Z"
      fill="currentColor"
    />
  </SvgIcon>
)

// Custom hover icon
const HoverIcon = (props: SvgIconProps): JSX.Element => (
  <SvgIcon {...props}>
    <path
      d="M2 8C2 4.68629 4.68629 2 8 2H16C19.3137 2 22 4.68629 22 8V16C22 19.3137 19.3137 22 16 22H8C4.68629 22 2 19.3137 2 16V8Z"
      fill="#F0F3F6"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 4H16C18.2091 4 20 5.79086 20 8V16C20 18.2091 18.2091 20 16 20H8C5.79086 20 4 18.2091 4 16V8C4 5.79086 5.79086 4 8 4ZM8 6C6.89543 6 6 6.89543 6 8V16C6 17.1046 6.89543 18 8 18H16C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H8Z"
      fill="#343A40"
    />
  </SvgIcon>
)

// Custom checked icon
const CheckedIcon = (props: SvgIconProps): JSX.Element => (
  <SvgIcon {...props}>
    <path
      d="M15.729 10.6778C16.1076 10.2757 16.0886 9.6428 15.6866 9.26418C15.2845 8.88555 14.6516 8.90456 14.273 9.30663L11.0147 12.7666L9.74861 11.3371C9.38243 10.9237 8.75042 10.8854 8.33698 11.2516C7.92355 11.6177 7.88524 12.2497 8.25142 12.6632L9.88051 14.5025C10.4653 15.1628 11.4908 15.1784 12.0954 14.5363L15.729 10.6778Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 4H8C5.79086 4 4 5.79086 4 8V16C4 18.2091 5.79086 20 8 20H16C18.2091 20 20 18.2091 20 16V8C20 5.79086 18.2091 4 16 4ZM15.6861 9.26409C16.0881 9.64271 16.1071 10.2756 15.7285 10.6777L12.0949 14.5362C11.4903 15.1783 10.4648 15.1627 9.88002 14.5024L8.25093 12.6631C7.88475 12.2496 7.92306 11.6176 8.3365 11.2515C8.74993 10.8853 9.38194 10.9236 9.74812 11.337L11.0142 12.7665L14.2725 9.30654C14.6511 8.90446 15.284 8.88546 15.6861 9.26409Z"
      fill="#2E3F5E"
    />
  </SvgIcon>
)

// Checked hover icon
const CheckedHoverIcon = (props: SvgIconProps): JSX.Element => (
  <SvgIcon {...props}>
    <path
      d="M2 8C2 4.68629 4.68629 2 8 2H16C19.3137 2 22 4.68629 22 8V16C22 19.3137 19.3137 22 16 22H8C4.68629 22 2 19.3137 2 16V8Z"
      fill="#DDE4ED"
    />
    <path
      d="M15.729 10.6778C16.1076 10.2757 16.0886 9.6428 15.6866 9.26418C15.2845 8.88555 14.6516 8.90456 14.273 9.30663L11.0147 12.7666L9.74861 11.3371C9.38243 10.9237 8.75042 10.8854 8.33698 11.2516C7.92355 11.6177 7.88524 12.2497 8.25142 12.6632L9.88051 14.5025C10.4653 15.1628 11.4908 15.1784 12.0954 14.5363L15.729 10.6778Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 4H8C5.79086 4 4 5.79086 4 8V16C4 18.2091 5.79086 20 8 20H16C18.2091 20 20 18.2091 20 16V8C20 5.79086 18.2091 4 16 4ZM15.6861 9.26409C16.0881 9.64271 16.1071 10.2756 15.7285 10.6777L12.0949 14.5362C11.4903 15.1783 10.4648 15.1627 9.88002 14.5024L8.25093 12.6631C7.88475 12.2496 7.92306 11.6176 8.3365 11.2515C8.74993 10.8853 9.38194 10.9236 9.74812 11.337L11.0142 12.7665L14.2725 9.30654C14.6511 8.90446 15.284 8.88546 15.6861 9.26409Z"
      fill="#1A2B4B"
    />
  </SvgIcon>
)

// Disabled unchecked icon
const DisabledUncheckedIcon = (props: SvgIconProps): JSX.Element => (
  <SvgIcon {...props}>
    <path
      d="M6 8C6 6.89543 6.89543 6 8 6H16C17.1046 6 18 6.89543 18 8V16C18 17.1046 17.1046 18 16 18H8C6.89543 18 6 17.1046 6 16V8Z"
      fill="#E9ECEF"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 4H16C18.2091 4 20 5.79086 20 8V16C20 18.2091 18.2091 20 16 20H8C5.79086 20 4 18.2091 4 16V8C4 5.79086 5.79086 4 8 4ZM8 6C6.89543 6 6 6.89543 6 8V16C6 17.1046 6.89543 18 8 18H16C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H8Z"
      fill="#CED4DA"
    />
  </SvgIcon>
)

// Disabled checked icon
const DisabledCheckedIcon = (props: SvgIconProps): JSX.Element => (
  <SvgIcon {...props}>
    <path
      d="M15.729 10.6778C16.1076 10.2757 16.0886 9.6428 15.6866 9.26418C15.2845 8.88555 14.6516 8.90456 14.273 9.30663L11.0147 12.7666L9.74861 11.3371C9.38243 10.9237 8.75042 10.8854 8.33698 11.2516C7.92355 11.6177 7.88524 12.2497 8.25142 12.6632L9.88051 14.5025C10.4653 15.1628 11.4908 15.1784 12.0954 14.5363L15.729 10.6778Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 4H8C5.79086 4 4 5.79086 4 8V16C4 18.2091 5.79086 20 8 20H16C18.2091 20 20 18.2091 20 16V8C20 5.79086 18.2091 4 16 4ZM15.6861 9.26409C16.0881 9.64271 16.1071 10.2756 15.7285 10.6777L12.0949 14.5362C11.4903 15.1783 10.4648 15.1627 9.88002 14.5024L8.25093 12.6631C7.88475 12.2496 7.92306 11.6176 8.3365 11.2515C8.74993 10.8853 9.38194 10.9236 9.74812 11.337L11.0142 12.7665L14.2725 9.30654C14.6511 8.90446 15.284 8.88546 15.6861 9.26409Z"
      fill="#CED4DA"
    />
  </SvgIcon>
)

// Create styled checkbox component
const CustomCheckbox = styled(Checkbox)(() => ({
  // Base styles
  padding: 0,
  borderRadius: 2,

  // Remove original hover effect
  '&:hover': {
    backgroundColor: 'transparent',
  },

  // Remove ripple effect
  '& .MuiTouchRipple-root': {
    display: 'none',
  },

  '& .MuiSvgIcon-root': {
    fontSize: 24, // Match the SVG width/height
  },
}))

// Props interface for CustomizedCheckbox component
interface CustomizedCheckboxProps extends CheckboxProps {
  label: string
  checked?: boolean
  disabled?: boolean
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  name?: string
}

// Main component
export default function AdminCheckboxField({
  label,
  checked = false,
  disabled = false,
  onChange,
  ...props
}: Readonly<CustomizedCheckboxProps>) {
  const [isHovered, setIsHovered] = useState<boolean>(false)

  const handleMouseEnter = (): void => {
    setIsHovered(true)
  }

  const handleMouseLeave = (): void => {
    setIsHovered(false)
  }

  // Determine which icon to use based on state
  const getIcon = (): JSX.Element => {
    if (disabled) {
      return <DisabledUncheckedIcon />
    }
    if (isHovered && !checked) {
      return <HoverIcon />
    }

    return <UncheckedIcon />
  }

  const getCheckedIcon = (): JSX.Element => {
    if (disabled) {
      return <DisabledCheckedIcon />
    }
    if (isHovered) {
      return <CheckedHoverIcon />
    }

    return <CheckedIcon />
  }

  return (
    <FormControlLabel
      control={
        <CustomCheckbox
          icon={getIcon()}
          checkedIcon={getCheckedIcon()}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...props}
        />
      }
      label={
        <Typography ml={1} variant="body2M14" color={disabled ? 'gray.50' : 'gray.70'}>
          {label}
        </Typography>
      }
    />
  )
}
