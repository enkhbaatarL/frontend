import { FormControlLabel, Radio, RadioGroup, type TextFieldProps, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import Switch from '@mui/material/Switch'
import { Dayjs } from 'dayjs'
import { ChangeEvent } from 'react'

import AdminUpload, { type FileInfo } from '@/components/admin/AdminUpload'
import MIDatePicker from '@/components/common/datepicker/MIDatePicker'
import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import MIInput from '@/components/common/input/MIInput'
import MISelect from '@/components/common/select/MISelect'

type AdminTextFieldProps = TextFieldProps & {
  labelSub?: string
  labelVariant?: 'body1' | 'body2' | 'body3' | 'h6' | 'subtitle' | 'sectionTitle'
  labelColor?: string
  fieldType?: 'text' | 'select' | 'radio' | 'checkbox' | 'switch' | 'upload' | 'date-range' | 'date'
  options?: { value: string; label: string; disabled?: boolean }[]
  value?: string | string[] | boolean | (File | FileInfo)[] | Dayjs[]
  maxLength?: number
  onChange?: (value: string | string[] | boolean | (File | FileInfo)[] | Dayjs[]) => void
  maxSize?: number
  minWidth?: number
  acceptedType?: string[]
  multiple?: boolean
  multiline?: boolean
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
  labelVariant = 'sectionTitle',
  labelColor = 'gray.90',
  required,
  fieldType = 'text',
  options,
  value = '',
  maxLength,
  onChange,
  maxSize = 20,
  minWidth = 700,
  acceptedType = ['image/jpeg', 'image/png'],
  multiple = false,
  multiline = false,
  defaultFiles = [],
  width,
  labelSw,
  disabled,
  showSelectedValue = true,
  useAllOption,
}: AdminTextFieldProps) => {
  const handleChangeTextField = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    if (!maxLength || newValue.length <= maxLength) {
      onChange?.(newValue)
    }
  }

  const handleSelectChange = (e: { target: { value: string | number | (string | number)[] } }) => {
    const newValue = e.target.value as string

    onChange?.(newValue)
  }

  const handleSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked)
  }

  // const handleChangeFile = (files: (File | FileInfo)[]) => {
  //   if (typeof onChange === 'function') onChange?.(files)
  // }

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
        <MIInput
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={handleChangeTextField}
          multiline={multiline}
        />
      )}

      {fieldType === 'select' && (
        <MISelect
          multiple={multiple}
          disabled={disabled}
          value={value as string}
          fullWidth
          sx={{ width }}
          showValue={showSelectedValue}
          onChange={handleSelectChange}
          useAllOption={useAllOption}
          options={options}
        />
      )}

      {fieldType === 'switch' && (
        <FormControlLabel
          disabled={disabled}
          sx={{ marginRight: 0 }}
          control={
            <Switch
              checked={Boolean(value)}
              onChange={handleSwitchChange}
              onContextMenu={(e) => {
                e.preventDefault()
                onChange?.(!value)
              }}
            />
          }
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
          required={required}
          maxSize={maxSize}
          minWidth={minWidth}
          acceptedTypes={acceptedType}
          multiple={multiple}
          defaultFiles={defaultFiles}
          // onChange={handleChangeFile}
        />
      )}

      {fieldType === 'date-range' && (
        <MIDateRangePicker
          disabled={disabled}
          // value={value}
          // onChange={onChange} ///
        />
        // <Flex direction="row">
        //   <AdminDatePicker
        //     readOnly={disabled}
        //     value={((value as Dayjs[]) ?? [])[0]}
        //     onChange={(newDate) => {
        //       if (onChange && Array.isArray(value)) {
        //         const dateArray = [...((value as Dayjs[]) || [])]
        //         dateArray[0] = newDate as Dayjs
        //         onChange(dateArray)
        //       }
        //     }}
        //   />
        //   <Typography sx={{ margin: 2, verticalAlign: 'sub' }} color="gray.50" component="span">
        //     ~
        //   </Typography>
        //   <AdminDatePicker
        //     readOnly={disabled}
        //     value={((value as Dayjs[]) ?? [])[1]}
        //     onChange={(newDate) => {
        //       if (onChange && Array.isArray(value)) {
        //         const dateArray = [...((value as Dayjs[]) || [])]
        //         dateArray[1] = newDate as Dayjs
        //         onChange(dateArray)
        //       }
        //     }}
        //   />
        // </Flex>
      )}

      {fieldType === 'date' && <MIDatePicker readOnly={disabled} />}
      {/*{fieldType === 'date' && <AdminDatePicker readOnly={disabled} />}*/}
    </FormControl>
  )
}

export default AdminField
