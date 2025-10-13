import { Box, TextField, Typography } from '@mui/material'
import { useState, useEffect } from 'react'

import { getCurrentFontFamily } from '@/utils/font'

interface MIInputBoxProps {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  rows?: number
  width?: string | number
  readOnly?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
  offInitialError?: boolean // 초기 상태에서 에러 표시를 비활성화하는 옵션
}

const MIInputBox = ({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 1,
  width = '100%',
  readOnly = false,
  disabled = false,
  error = false,
  helperText,
  offInitialError = false,
}: MIInputBoxProps) => {
  const [hasUserInput, setHasUserInput] = useState(false)

  useEffect(() => {
    if (value && !hasUserInput) {
      setHasUserInput(true)
    }
  }, [value, hasUserInput])

  const shouldShowError = offInitialError ? hasUserInput && error : error
  const shouldShowHelperText = offInitialError ? hasUserInput && helperText : helperText

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width,
        padding: readOnly ? '4px' : '12px',
        backgroundColor: disabled ? '#F1F3F5' : '#FFFFFF',
        border: shouldShowError ? '1px solid #F03E3E' : '1px solid #DEE2E6',
        borderRadius: '8px',
        opacity: disabled ? 0.6 : 1,
        boxSizing: 'border-box',
      }}
    >
      {!readOnly && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Typography
            sx={{
              fontFamily: getCurrentFontFamily(),
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '1.4',
              color: '#868E96',
            }}
          >
            {label}
          </Typography>
          {required && (
            <Typography
              sx={{
                fontFamily: getCurrentFontFamily(),
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '1.4',
                color: '#F03E3E',
              }}
            >
              *
            </Typography>
          )}
        </Box>
      )}

      {readOnly ? (
        <Typography
          sx={{
            fontFamily: 'Pretendard',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '1.4',
            color: '#495057',
            padding: '8px 0',
          }}
        >
          {value}
        </Typography>
      ) : (
        <TextField
          value={value}
          onChange={(e) => onChange(e.target.value)}
          variant="standard"
          placeholder={placeholder}
          multiline={multiline}
          rows={multiline ? rows : undefined}
          disabled={disabled}
          sx={{
            '& .MuiInputBase-root': {
              border: 'none',
              '& input, & textarea': {
                padding: 0,
              },
            },
          }}
          slotProps={{
            input: {
              disableUnderline: true,
              sx: {
                fontFamily: getCurrentFontFamily(),
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '1.4',
                color: '#495057',
                padding: 0,
                '&::placeholder': {
                  color: '#ADB5BD',
                  opacity: 1,
                },
              },
            },
          }}
        />
      )}

      {shouldShowHelperText && (
        <Typography
          sx={{
            fontFamily: 'Pretendard',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '1.4',
            color: shouldShowError ? '#F03E3E' : '#868E96',
            marginTop: '4px',
          }}
        >
          {shouldShowHelperText}
        </Typography>
      )}
    </Box>
  )
}

export default MIInputBox
