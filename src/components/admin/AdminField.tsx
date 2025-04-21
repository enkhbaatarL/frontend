import { FormControlLabel, Radio, RadioGroup, TextField, type TextFieldProps, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import Switch from '@mui/material/Switch'
import { Dayjs } from 'dayjs'
import { t } from 'i18next'

import type { SelectChangeEvent } from '@mui/material/Select'
import type React from 'react'

import AdminDatePicker from '@/components/admin/AdminDatePicker'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminUpload, { type FileInfo } from '@/components/admin/AdminUpload'
import Flex from '@/components/common/display/Flex'

type AdminTextFieldProps = TextFieldProps & {
  labelSub?: string
  labelVariant?: 'body1' | 'body2' | 'body3' | 'h6' | 'subtitle'
  labelColor?: string
  fieldType?: 'text' | 'select' | 'radio' | 'checkbox' | 'switch' | 'upload' | 'date-range' | 'date'
  options?: { value: string; label: string; disabled?: boolean }[]
  value?: string | string[] | boolean | (File | FileInfo)[] | Dayjs[]
  countCharacters?: boolean
  maxLength?: number
  onChange?: (value: string | string[] | boolean | (File | FileInfo)[] | Dayjs[]) => void
  maxSize?: number
  minWidth?: number
  acceptedType?: string[]
  multiple?: boolean
  defaultFiles?: FileInfo[]
  width?: number | string[]
  labelSw?: string
  showSelectedValue?: boolean
  useAllOption?: boolean
}

const AdminField = ({
  placeholder,
  fullWidth,
  label,
  labelSub,
  labelVariant = 'body3',
  labelColor = 'gray.70',
  required,
  fieldType = 'text',
  options,
  value = '',
  countCharacters = false,
  maxLength,
  onChange,
  maxSize = 20,
  minWidth = 700,
  acceptedType = ['image/jpeg', 'image/png'],
  multiple = false,
  defaultFiles = [],
  width,
  labelSw,
  disabled,
  showSelectedValue = true,
  useAllOption,
  ...props
}: AdminTextFieldProps) => {
  const handleChangeTextField = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    if (!maxLength || newValue.length <= maxLength) {
      onChange?.(newValue)
    }
  }

  const handleSelectChange = (event: SelectChangeEvent<unknown>) => {
    const newValue = event.target.value as string | string[]
    let processedValue: string | string[]

    if (multiple) {
      processedValue = Array.isArray(newValue) ? newValue : [newValue]
    } else {
      processedValue = newValue
    }

    onChange?.(processedValue)
  }

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked)
  }

  const handleChangeFile = (files: (File | FileInfo)[]) => {
    if (typeof onChange === 'function') onChange?.(files)
  }

  let selectValue
  if (multiple) {
    selectValue = Array.isArray(value) ? value : []
  } else {
    selectValue = value
  }

  return (
    <FormControl fullWidth={fullWidth}>
      {label && (
        <Typography marginBottom={labelVariant === 'subtitle' && !labelSub ? 3 : 1} variant={labelVariant} color={labelColor}>
          {label}
          {required && !disabled && (
            <Typography marginLeft="4px" sx={{ verticalAlign: 4, fontSize: 12, fontWeight: 900 }} component="span" color="error">
              *
            </Typography>
          )}
        </Typography>
      )}
      {labelSub && (
        <Typography variant="subtext2" color="gray.60" marginBottom={3}>
          {labelSub}
        </Typography>
      )}

      {fieldType === 'text' && (
        <>
          <TextField
            disabled={disabled}
            variant="outlined"
            hiddenLabel
            defaultValue={value}
            placeholder={placeholder ?? t('제목을 입력하세요')}
            slotProps={{ htmlInput: { maxLength } }}
            onInput={handleChangeTextField}
            {...props}
          />
          {countCharacters && typeof value === 'string' && (
            <Typography align="right" variant="caption" color="gray.60" marginTop={1}>
              {maxLength ? `${value.length} / ${maxLength}` : `${value.length}`}
            </Typography>
          )}
        </>
      )}

      {fieldType === 'select' && (
        <AdminSelect
          multiple={multiple}
          displayEmpty
          disabled={disabled}
          value={selectValue}
          fullWidth
          sx={{ width }}
          showSelectedValue={showSelectedValue}
          onChange={handleSelectChange}
          useAllOption={useAllOption}
          options={options}
        />
      )}

      {fieldType === 'switch' && (
        <FormControlLabel
          disabled={disabled}
          sx={{ marginRight: 0 }}
          control={<Switch checked={Boolean(value)} onChange={handleSwitchChange} />}
          label={labelSw}
        />
      )}

      {fieldType === 'radio' && (
        <RadioGroup
          row
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value)
          }}
        >
          {options?.map((option) => (
            <FormControlLabel
              disabled={disabled ?? option.disabled}
              key={option.value}
              value={option.value}
              control={<Radio />}
              label={option.label}
            />
          ))}
        </RadioGroup>
      )}
      {fieldType === 'upload' && (
        <AdminUpload
          disabled={disabled}
          maxSize={maxSize}
          minWidth={minWidth}
          acceptedTypes={acceptedType}
          multiple={multiple}
          defaultFiles={defaultFiles}
          onChange={handleChangeFile}
        />
      )}

      {fieldType === 'date-range' && (
        <Flex direction="row">
          <AdminDatePicker
            readOnly={disabled}
            value={((value as Dayjs[]) ?? [])[0]}
            onChange={(newDate) => {
              if (onChange && Array.isArray(value)) {
                const dateArray = [...((value as Dayjs[]) || [])]
                dateArray[0] = newDate as Dayjs
                onChange(dateArray)
              }
            }}
          />
          <Typography sx={{ margin: 2, verticalAlign: 'sub' }} color="gray.50" component="span">
            ~
          </Typography>
          <AdminDatePicker
            readOnly={disabled}
            value={((value as Dayjs[]) ?? [])[1]}
            onChange={(newDate) => {
              if (onChange && Array.isArray(value)) {
                const dateArray = [...((value as Dayjs[]) || [])]
                dateArray[1] = newDate as Dayjs
                onChange(dateArray)
              }
            }}
          />
        </Flex>
      )}

      {fieldType === 'date' && <AdminDatePicker readOnly={disabled} />}
    </FormControl>
  )
}

export default AdminField
