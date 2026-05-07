import { Box, Stack, StackProps, Typography } from '@mui/material'

export interface MISlidingSegmentedOption {
  value: string
  label: string
  disabled?: boolean
}

export interface MISlidingSegmentedControlProps extends Omit<StackProps, 'options' | 'value' | 'onChange'> {
  options: readonly MISlidingSegmentedOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const MISlidingSegmented = ({ options, value, onChange, disabled = false, sx, ...props }: Readonly<MISlidingSegmentedControlProps>) => {
  const selectedIndex = options.findIndex((o) => o.value === value)
  const showSliding = !disabled && selectedIndex >= 0

  return (
    <Stack
      direction="row"
      alignItems="center"
      padding="4px"
      borderRadius="10px"
      border="1px solid"
      borderColor="contentBorder.Normal"
      bgcolor={disabled ? 'contentBG.Disabled' : 'contentBG.Active'}
      position="relative"
      style={{
        cursor: disabled ? 'not-allowed' : 'default',
        opacity: disabled ? 0.8 : 1,
      }}
      gap="4px"
      sx={sx}
      {...props}
    >
      {showSliding && (
        <Box
          position="absolute"
          top={4}
          bottom={4}
          width={`calc((100% - 8px) / ${options.length})`}
          left={`calc(4px + ${selectedIndex} * ((100% - 8px) / ${options.length}))`}
          bgcolor="commonColor.White"
          borderRadius="10px"
          style={{
            transition: 'left 0.25s ease-out',
            pointerEvents: 'none',
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.06)',
          }}
        />
      )}
      {options.map(({ value: optionValue, label, disabled: optionDisabled }) => {
        const isSelected = value === optionValue
        const isDisabled = disabled || optionDisabled
        let textColor = 'contentText.Normal'

        if (isDisabled) textColor = 'contentText.Disabled'
        else if (isSelected) textColor = 'contentText.Black'

        const handleSelect = () => {
          if (isDisabled) return
          onChange(optionValue)
        }

        return (
          <Stack
            key={optionValue}
            component="button"
            type="button"
            alignItems="center"
            justifyContent="center"
            flex={1}
            padding="6px 8px"
            borderRadius="10px"
            border="none"
            bgcolor="transparent"
            position="relative"
            zIndex={1}
            onClick={handleSelect}
            style={{ cursor: isDisabled ? 'default' : 'pointer' }}
          >
            <Typography variant="body2M14" color={textColor}>
              {label}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}

export default MISlidingSegmented
