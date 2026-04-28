import { Box, Stack, StackProps, Typography } from '@mui/material'
import { useLayoutEffect, useRef, useState } from 'react'

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

interface SliderStyle {
  left: number
  width: number
}

const MISlidingSegmented = ({ options, value, onChange, disabled = false, sx, ...props }: Readonly<MISlidingSegmentedControlProps>) => {
  const selectedIndex = options.findIndex((o) => o.value === value)
  const showSliding = !disabled && selectedIndex >= 0

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [sliderStyle, setSliderStyle] = useState<SliderStyle | null>(null)

  useLayoutEffect(() => {
    const selectedBtn = buttonRefs.current[selectedIndex]
    if (!selectedBtn) {
      setSliderStyle(null)
      return
    }
    setSliderStyle({
      left: selectedBtn.offsetLeft,
      width: selectedBtn.offsetWidth,
    })
  }, [selectedIndex, options])

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
      sx={sx}
      {...props}
    >
      {showSliding && sliderStyle && (
        <Box
          position="absolute"
          top={4}
          bottom={4}
          bgcolor="commonColor.White"
          borderRadius="10px"
          style={{
            left: sliderStyle.left,
            width: sliderStyle.width,
            transition: 'left 0.25s ease-out, width 0.25s ease-out',
            pointerEvents: 'none',
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.06)',
          }}
        />
      )}
      {options.map(({ value: optionValue, label, disabled: optionDisabled }, index) => {
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
            ref={(el: HTMLButtonElement | null) => {
              buttonRefs.current[index] = el
            }}
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
