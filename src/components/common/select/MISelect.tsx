import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Autocomplete, Box, SvgIconProps, SxProps, Theme, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import { t } from 'i18next'
import { PropsWithChildren, useMemo, useState, ReactNode } from 'react'

import AdminTextField from '@/components/admin/AdminTextField.tsx'
import ScrollWrapper from '@/components/admin/ScrollWrapper'
import CancelIcon from '@/components/common/icons/CancelIcon.tsx'
import theme from '@/theming'

type OptionType = {
  label: ReactNode
  value: string | number
}

type MISelectSize = 'h26' | 'h36' | 'h34'
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
  value?: string | number
  disabled?: boolean
  onChange?: (e: { target: { value: string | number | (string | number)[] } }) => void
  options?: readonly OptionType[]
  useAllOption?: boolean
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
        backgroundColor: open ? '#F0F3F6' : 'transparent',
        '&:hover': {
          backgroundColor: '#F0F3F6',
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

const ListBoxComponent = (props: PropsWithChildren) => (
  <ScrollWrapper offsetTop={8} maxHeight={268}>
    <ul className="MuiAutocomplete-listbox" {...props} />
  </ScrollWrapper>
)

const MISelect = ({
  fullWidth,
  label,
  placeholder,
  multiple,
  showValue = true,
  minWidth = 200,
  sizeSelect = 'h36',
  sx,
  value,
  disabled,
  onChange,
  options,
  useAllOption = true,
}: MISelectProps) => {
  const finalPlaceholder = placeholder ?? t('선택하세요')

  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

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

    return {}
  }

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
          ...(sizeSelect === 'h26' && { display: 'none' }),
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
          outline: '1px solid #2E3F5E',
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

      ...sx,
    }),
    [minWidth, sizeSelect, showValue, sx],
  )

  const getSelectedOption = (value: string | number | (string | number)[] | undefined): OptionType | OptionType[] | null => {
    if (!options) return null

    if (multiple) {
      if (!Array.isArray(value)) return []

      return options.filter((opt) => value.includes(opt.value))
    } else {
      if (useAllOption && value === '') return { label: t('전체'), value: '' }
      if (value === undefined) return null

      return options.find((opt) => opt.value === (typeof opt.value === 'number' ? Number(value) : value)) ?? null
    }
  }

  const selected = multiple ? (getSelectedOption(value) as OptionType[]) : (getSelectedOption(value) as OptionType | null)

  const handleClear = () => {
    if (onChange) {
      onChange({ target: { value: multiple ? [] : '' } })
    }
  }

  return (
    <FormControl fullWidth={fullWidth}>
      {label && (
        <Typography marginBottom={1} variant="labelText" color="gray.70">
          {label}
        </Typography>
      )}
      <Autocomplete
        clearIcon={inputValue ? <CancelIcon width={16} height={16} onClick={handleClear} /> : null}
        clearOnEscape
        disabled={disabled}
        multiple={multiple}
        options={options ? [...(useAllOption ? [{ label: t('전체'), value: '' }] : []), ...options] : []}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={selected}
        onInputChange={(_event, newInputValue) => {
          setInputValue(newInputValue)
        }}
        onChange={(_event, newValue) => {
          if (!onChange) return

          if (multiple) {
            const values = (newValue as OptionType[]).map((option) => option.value)

            onChange({ target: { value: values } })
          } else {
            const value = (newValue as OptionType | null)?.value ?? ''

            onChange({ target: { value } })
          }
        }}
        getOptionLabel={(typedOption: OptionType | string | number) => {
          if (typeof typedOption === 'string' || typeof typedOption === 'number') {
            return String(typedOption)
          }

          return typedOption.label as string
        }}
        isOptionEqualToValue={(typedOption: OptionType, typedValue: OptionType) => typedOption.value === typedValue.value}
        popupIcon={<CustomArrowIcon open={open} size={sizeSelect} />}
        renderInput={(params) => (
          <AdminTextField
            {...params}
            placeholder={finalPlaceholder}
            sx={inputSx}
            slotProps={{
              input: {
                ...params.InputProps,
                // disableUnderline: true,
              },
            }}
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
                ...theme.typography.body2M14,
              },
            },
          },
        }}
        slots={{
          listbox: ListBoxComponent,
        }}
      />
    </FormControl>
  )
}

export default MISelect
