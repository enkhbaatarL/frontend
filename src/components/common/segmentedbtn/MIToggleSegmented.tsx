import { Box, Stack, Typography } from '@mui/material'

export interface MIToggleSegmentedOption {
  value: string
  label: string
}

export interface MIToggleSegmentedProps {
  readonly options: readonly MIToggleSegmentedOption[]
  readonly value: string
  readonly onChange: (value: string) => void
  readonly size?: 'small' | 'medium' | 'large'
  readonly disabled?: boolean
}

export default function MIToggleSegmented({ options, value, onChange, size = 'medium', disabled = false }: MIToggleSegmentedProps) {
  const handleOptionClick = (optionValue: string) => {
    if (disabled) return
    onChange(optionValue)
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '4px',
          borderRadius: '100px',
          optionPadding: '4px 8px',
          fontSize: 12,
        }
      case 'large':
        return {
          padding: '6px',
          borderRadius: '100px',
          optionPadding: '8px 16px',
          fontSize: 16,
        }
      default: // medium
        return {
          padding: '4px',
          borderRadius: '100px',
          optionPadding: '6px 12px',
          fontSize: 14,
        }
    }
  }

  const sizeStyles = getSizeStyles()

  return (
    <Stack
      direction="row"
      gap="2px"
      sx={{
        backgroundColor: '#F1F3F5',
        borderRadius: sizeStyles.borderRadius,
        padding: sizeStyles.padding,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'default',
      }}
    >
      {options.map((option) => (
        <Box
          key={option.value}
          onClick={() => handleOptionClick(option.value)}
          sx={{
            padding: sizeStyles.optionPadding,
            borderRadius: '100px',
            backgroundColor: value === option.value ? '#FFFFFF' : 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            '&:hover': (() => {
              if (disabled) return { backgroundColor: 'transparent' }
              if (value === option.value) return { backgroundColor: '#FFFFFF' }
              return { backgroundColor: 'rgba(255, 255, 255, 0.5)' }
            })(),
          }}
        >
          <Typography
            variant="body2"
            color={value === option.value ? 'gray.90' : 'gray.70'}
            fontWeight={500}
            fontSize={sizeStyles.fontSize}
            sx={{
              userSelect: 'none',
            }}
          >
            {option.label}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}
