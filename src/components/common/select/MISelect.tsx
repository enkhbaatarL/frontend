import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Autocomplete, Box, SvgIconProps, SxProps, Theme, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import { t } from 'i18next'
import { PropsWithChildren, useMemo, useState, ReactNode, useRef, useEffect, HTMLAttributes, Key } from 'react'

import AdminTextField from '@/components/admin/AdminTextField'
import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIInputClearIcon from '@/components/common/input/MIInputClearIcon'
import theme from '@/theming'

type OptionType = {
  label: ReactNode
  value: string | number | boolean
  disabled?: boolean
}

type MISelectSize = 'h26' | 'h36' | 'h34' | 'h40'
type MISelectProps = {
  label?: string
  placeholder?: string
  showValue?: boolean
  outlineNone?: boolean
  minWidth?: string | number
  sizeSelect?: MISelectSize
  sx?: SxProps<Theme>
  multiple?: boolean
  fullWidth?: boolean
  value?: string | number | boolean
  width?: string | number
  disabled?: boolean
  readOnly?: boolean
  type?: 'button' | 'input'
  onChange?: (e: { target: { value: string | number | boolean | (string | number | boolean)[] } }) => void
  options?: readonly OptionType[]
  useAllOption?: boolean
  showClearIcon?: boolean
}

const CustomArrowIcon = ({
  open,
  size,
  ...props
}: SvgIconProps & {
  open?: boolean
  size?: MISelectSize
}) => {
  const getSizeStyleIcon = (sizeSelect: MISelectSize) => {
    if (sizeSelect === 'h26') {
      return {
        width: 14,
        height: 14,
        svg: {
          width: 14,
          height: 14,
        },
      }
    }
    if (sizeSelect === 'h34') {
      return {
        width: 22,
        height: 22,
      }
    }
    if (sizeSelect === 'h36') {
      return {
        width: 28,
        height: 28,
      }
    }
    if (sizeSelect === 'h40') {
      return {
        width: 32,
        height: 32,
      }
    }

    return {}
  }

  return (
    <Box
      flexShrink={0}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        borderRadius: '4px',
        backgroundColor: open ? theme.palette.content['backgroundHover'] : 'transparent',
        '&:hover': {
          backgroundColor: theme.palette.content['backgroundHover'],
        },
        svg: {
          position: 'unset',
        },
        ...getSizeStyleIcon(size as MISelectSize),
      }}
    >
      <KeyboardArrowDownIcon {...props} sx={{ color: open ? '#343A40 !important' : '#868E96 !important' }} fontSize="small" />
    </Box>
  )
}

type OwnerState = {
  disablePortal?: boolean
  expanded?: boolean
  focused?: boolean
  fullWidth?: boolean
  hasClearIcon?: boolean
  hasPopupIcon?: boolean
  inputFocused?: boolean
  popupOpen?: boolean
  size?: 'small' | 'medium'
  [key: string]: unknown
}

const ListBoxComponent = (props: PropsWithChildren & { ownerState?: OwnerState }) => {
  const { children, ownerState, ...otherProps } = props
  return (
    <ScrollWrapper offsetTop={8} maxHeight={268}>
      <ul className="MuiAutocomplete-listbox" {...otherProps}>
        {children}
      </ul>
    </ScrollWrapper>
  )
}

const MISelect = ({
  fullWidth,
  label,
  placeholder,
  multiple,
  showValue = true,
  minWidth = 200,
  sizeSelect = 'h34',
  sx,
  value,
  disabled,
  readOnly,
  onChange,
  showClearIcon = true,
  options,
  useAllOption = true,
  width,
  type = 'input',
}: MISelectProps) => {
  const finalPlaceholder = placeholder ?? t('선택하세요')

  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const autoCompleteRef = useRef<HTMLElement>(null)

  const shouldShowClearButton = type === 'input' && isFocused && !disabled && !multiple && inputValue !== undefined && inputValue !== ''

  const getSizeStyle = (sizeSelect: MISelectSize) => {
    if (sizeSelect === 'h26') {
      return {
        padding: '0.5px 12px',
        fontSize: '12px',
      }
    }
    if (sizeSelect === 'h34') {
      return {
        padding: '4.5px 12px',
        fontSize: '14px',
      }
    }
    if (sizeSelect === 'h36') {
      return {
        padding: '5.5px 12px',
        fontSize: '14px',
      }
    }
    if (sizeSelect === 'h40') {
      return {
        padding: '7px 12px',
        fontSize: '14px',
      }
    }

    return {}
  }

  useEffect(() => {
    if (autoCompleteRef.current && type === 'button') {
      const input = autoCompleteRef.current?.querySelector('input')

      if (input) {
        input.readOnly = true
      }
    }
  }, [autoCompleteRef, type])

  const inputSx = useMemo(
    (): SxProps<Theme> => ({
      backgroundColor: '#fff',
      minWidth,
      '& .MuiInputBase-root': {
        padding: 0,
        paddingRight: '0 !important',
        ...(sizeSelect === 'h26' && { borderRadius: '4px' }),
      },

      '.MuiOutlinedInput-root': {
        '.MuiAutocomplete-clearIndicator': {
          display: sizeSelect === 'h26' ? 'none' : 'flex !important',
          visibility: shouldShowClearButton ? 'visible' : 'hidden',
          cursor: 'pointer',
          '& svg': {
            marginRight: '-1px',
            width: sizeSelect === 'h26' ? 14 : 20,
            height: sizeSelect === 'h26' ? 14 : 20,
          },
        },
        '.MuiAutocomplete-endAdornment': {
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        },
      },
      '.MuiChip-root': {
        ...(!showValue && { display: 'none' }),
      },
      '.MuiOutlinedInput-root .MuiAutocomplete-input': {
        boxSizing: 'border-box',
        height: 'auto',
        ...getSizeStyle(sizeSelect),
        '&:focus': {
          outline: `1px solid ${theme.palette.content['borderActivePrimary']}`,
        },
        ...(sizeSelect === 'h26' && { borderRadius: '4px' }),
      },
      '.MuiTouchRipple-root': {
        display: 'none',
      },
      '.MuiButtonBase-root ': {
        '&:hover': {
          backgroundColor: 'transparent',
        },
      },
      ...(type === 'button'
        ? {
          '& .MuiInputBase-root:has(input[readonly])': {
            cursor: 'pointer',
          },
          '& .MuiInputBase-input[readonly]': {
            borderColor: 'inherit',
            backgroundColor: 'inherit',
            userSelect: 'none',
            cursor: 'pointer',
            pointerEvents: 'none',
          },
        }
        : {}),
      ...sx,
    }),
    [minWidth, sizeSelect, shouldShowClearButton, showValue, type, sx],
  )

  const getSelectedOption = (
    value: string | number | boolean | (string | number | boolean)[] | undefined,
  ): OptionType | OptionType[] | null => {
    if (!options) return null

    if (multiple) {
      if (!Array.isArray(value)) return []

      return options.filter((opt) => value.includes(opt.value)) as OptionType[]
    } else {
      if (useAllOption && !isFocused && value === '') return { label: t('전체'), value: '' } as OptionType
      if (value === undefined) return null

      return (options.find((opt) => opt.value === (typeof opt.value === 'number' ? Number(value) : value)) as OptionType) ?? null
    }
  }

  const selected = getSelectedOption(value)

  return (
    <FormControl sx={{ width }} fullWidth={fullWidth}>
      {label && (
        <Typography marginBottom={1} variant="labelText" color="gray.70">
          {label}
        </Typography>
      )}
      <Autocomplete
        ref={autoCompleteRef}
        clearIcon={showClearIcon && <MIInputClearIcon />}
        clearOnEscape
        disabled={disabled}
        readOnly={readOnly}
        multiple={multiple}
        options={options ?? []}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        noOptionsText="결과 없음"
        value={selected}
        onInputChange={(_event, newInputValue) => {
          setInputValue(newInputValue)
        }}
        onChange={(_event, newValue) => {
          if (!onChange) return

          if (multiple) {
            const values = (newValue as OptionType[]).filter((option) => !option.disabled).map((option) => option.value)

            onChange({ target: { value: values } })
          } else {
            const option = newValue as OptionType | null
            if (option && option.disabled) return

            const value = option?.value ?? ''

            onChange({ target: { value } })
          }
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string' || typeof option === 'number') return String(option)
          if (typeof option.label === 'string') return option.label
          return ''
        }}
        isOptionEqualToValue={(typedOption: OptionType, typedValue: OptionType) => typedOption.value === typedValue.value}
        popupIcon={<CustomArrowIcon open={open} size={sizeSelect} />}
        renderInput={(params) => (
          <AdminTextField
            className={readOnly ? 'select-readonly' : ''}
            {...params}
            placeholder={finalPlaceholder}
            sx={inputSx}
            slotProps={{
              input: {
                ...params.InputProps,
                // disableUnderline: true,
              },
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        )}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '4px',
              boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.20)',
              overflow: 'hidden',
              position: 'relative',
              '& .MuiAutocomplete-option': {
                ...theme.typography.body2R14,
                ...(sizeSelect === 'h26' && { fontSize: 12 }),
                padding: '8px 12px',
                color: theme.palette.gray[70],
                cursor: 'pointer',
              },
              '& .MuiAutocomplete-option:hover': {
                ...theme.typography.body2M14,
                color: theme.palette.gray[90],
                background: theme.palette.gray[5],
                ...(sizeSelect === 'h26' && { fontSize: 12 }),
              },
              '& .MuiAutocomplete-option[aria-selected="true"]': {
                ...theme.typography.body2M14,
                color: theme.palette.gray[90],
                background: theme.palette.gray[5],
                ...(sizeSelect === 'h26' && { fontSize: 12 }),
              },

              '& .MuiAutocomplete-noOptions': {
                ...theme.typography.body2R14,
                padding: '16px 12px',
                color: theme.palette.gray[50],
              },

              '& .MuiAutocomplete-option.mi-option-disabled': {
                color: theme.palette.gray[40],
                pointerEvents: 'none',
                cursor: 'not-allowed',
                backgroundColor: 'transparent',
              },
            },
          },
        }}
        slots={{
          listbox: ListBoxComponent,
        }}
        getOptionDisabled={(option: OptionType) => !!option.disabled}
        renderOption={(props: HTMLAttributes<HTMLLIElement> & { key?: Key }, option: OptionType) => {
          const { key, ...otherProps } = props

          // key를 직접 전달하고 나머지 props는 구조분해로 전달
          return (
            <li key={key} {...otherProps} className={`${otherProps?.className} ${option.disabled ? 'mi-option-disabled' : ''}`}>
              {option.label}
            </li>
          )
        }}
      />
    </FormControl>
  )
}

export default MISelect
