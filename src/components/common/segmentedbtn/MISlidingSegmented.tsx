import { Box, Stack, StackProps, Typography } from '@mui/material'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

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
  fullWidth?: boolean
}

const getOptionWidthWeight = (label: string) => Math.max(Array.from(label).length, 1)

const MISlidingSegmented = ({
  options,
  value,
  onChange,
  disabled = false,
  fullWidth = false,
  sx,
  ...props
}: Readonly<MISlidingSegmentedControlProps>) => {
  const selectedIndex = options.findIndex((o) => o.value === value)
  const selectedOptionValue = selectedIndex >= 0 ? options[selectedIndex].value : undefined
  const showSliding = !disabled && selectedIndex >= 0
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [slidingBounds, setSlidingBounds] = useState<{ left: number; width: number } | null>(null)

  const updateSlidingBounds = useCallback(() => {
    if (!showSliding || !selectedOptionValue) {
      setSlidingBounds(null)
      return
    }

    const selectedOptionElement = optionRefs.current[selectedOptionValue]

    if (!selectedOptionElement) {
      setSlidingBounds(null)
      return
    }

    setSlidingBounds({
      left: selectedOptionElement.offsetLeft,
      width: selectedOptionElement.offsetWidth,
    })
  }, [selectedOptionValue, showSliding])

  useLayoutEffect(() => {
    updateSlidingBounds()
  }, [options, updateSlidingBounds])

  useLayoutEffect(() => {
    if (!showSliding || !selectedOptionValue) return undefined

    const selectedOptionElement = optionRefs.current[selectedOptionValue]
    if (!selectedOptionElement || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(updateSlidingBounds)
    observer.observe(selectedOptionElement)

    if (selectedOptionElement.parentElement) {
      observer.observe(selectedOptionElement.parentElement)
    }

    return () => observer.disconnect()
  }, [selectedOptionValue, showSliding, updateSlidingBounds])

  return (
    <Stack
      direction="row"
      alignItems="center"
      width={fullWidth ? '100%' : 'fit-content'}
      maxWidth="100%"
      boxSizing="border-box"
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
      {showSliding && slidingBounds && (
        <Box
          position="absolute"
          top={4}
          bottom={4}
          width={slidingBounds.width}
          left={slidingBounds.left}
          bgcolor="commonColor.White"
          borderRadius="10px"
          style={{
            transition: 'left 0.25s ease-out, width 0.25s ease-out',
            pointerEvents: 'none',
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.06)',
          }}
        />
      )}
      {options.map(({ value: optionValue, label, disabled: optionDisabled }) => {
        const isSelected = value === optionValue
        const isDisabled = disabled || optionDisabled
        const widthWeight = getOptionWidthWeight(label)
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
            ref={(node) => {
              optionRefs.current[optionValue] = node
            }}
            alignItems="center"
            justifyContent="center"
            flex={fullWidth ? `${widthWeight} 1 0` : '0 0 auto'}
            padding="6px 8px"
            borderRadius="10px"
            border="none"
            bgcolor="transparent"
            position="relative"
            zIndex={1}
            onClick={handleSelect}
            whiteSpace="nowrap"
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
